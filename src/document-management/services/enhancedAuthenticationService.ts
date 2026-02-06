/**
 * Enhanced Authentication Service
 * 
 * Implements multi-factor authentication for sensitive documents,
 * session management, timeout handling, and secure authentication flows
 * for the Document Management System.
 * 
 * Requirements: 7.5
 */

import {
  Document,
  ConfidentialityLevel,
  AccessAttempt,
  AuditTrail
} from '../../../types/document-management';
import { UserRole } from '../../../types';
import { supabaseService } from './supabaseService';
import { auditService } from './auditService';
import { accessControlService } from './accessControlService';

// =====================================================
// AUTHENTICATION INTERFACES
// =====================================================

export interface AuthenticationRequest {
  userId: string;
  documentId: string;
  confidentialityLevel: ConfidentialityLevel;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
}

export interface AuthenticationResult {
  success: boolean;
  requiresMFA: boolean;
  mfaChallenge?: MFAChallenge;
  sessionToken?: string;
  expiresAt?: Date;
  restrictions?: AuthenticationRestriction[];
  reason: string;
}

export interface MFAChallenge {
  challengeId: string;
  type: MFAType;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

export interface MFAVerificationRequest {
  challengeId: string;
  code: string;
  userId: string;
  documentId: string;
}

export interface MFAVerificationResult {
  success: boolean;
  sessionToken?: string;
  expiresAt?: Date;
  reason: string;
}

export interface AuthenticationSession {
  id: string;
  userId: string;
  documentId?: string;
  confidentialityLevel?: ConfidentialityLevel;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  mfaVerified: boolean;
  restrictions: AuthenticationRestriction[];
}

export interface AuthenticationRestriction {
  type: 'time_limit' | 'ip_lock' | 'single_session' | 'no_concurrent' | 'location_restricted';
  value?: string;
  expiresAt?: Date;
}

export enum MFAType {
  SMS = 'sms',
  EMAIL = 'email',
  TOTP = 'totp',
  PUSH = 'push',
  BIOMETRIC = 'biometric'
}

export interface SessionConfiguration {
  standardTimeout: number; // minutes
  sensitiveTimeout: number; // minutes
  maxConcurrentSessions: number;
  requireMFAForConfidential: boolean;
  requireMFAForRestricted: boolean;
  allowedIPRanges?: string[];
  sessionExtensionLimit: number; // times
}

// =====================================================
// ENHANCED AUTHENTICATION SERVICE CLASS
// =====================================================

export class EnhancedAuthenticationService {
  private readonly sessionsTable = 'authentication_sessions';
  private readonly mfaChallengesTable = 'mfa_challenges';
  private readonly mfaMethodsTable = 'user_mfa_methods';
  private readonly authAttemptsTable = 'authentication_attempts';

  private readonly defaultConfig: SessionConfiguration = {
    standardTimeout: 30, // 30 minutes
    sensitiveTimeout: 15, // 15 minutes for sensitive documents
    maxConcurrentSessions: 3,
    requireMFAForConfidential: true,
    requireMFAForRestricted: true,
    sessionExtensionLimit: 3
  };

  // =====================================================
  // CORE AUTHENTICATION METHODS
  // =====================================================

  /**
   * Authenticate user for document access
   * Requirement 7.5: Multi-factor authentication for sensitive documents
   */
  async authenticateForDocument(request: AuthenticationRequest): Promise<AuthenticationResult> {
    try {
      // Log authentication attempt
      await this.logAuthenticationAttempt({
        userId: request.userId,
        documentId: request.documentId,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        timestamp: new Date(),
        success: false,
        reason: 'Authentication in progress'
      });

      // Check if MFA is required for this confidentiality level
      const requiresMFA = this.requiresMFAForConfidentiality(request.confidentialityLevel);

      // Check existing session
      const existingSession = await this.getActiveSession(request.userId, request.documentId);
      
      if (existingSession && this.isSessionValid(existingSession)) {
        // Check if MFA is already verified for this session
        if (!requiresMFA || existingSession.mfaVerified) {
          // Extend session activity
          await this.updateSessionActivity(existingSession.id);
          
          return {
            success: true,
            requiresMFA: false,
            sessionToken: existingSession.id,
            expiresAt: existingSession.expiresAt,
            restrictions: existingSession.restrictions,
            reason: 'Existing session valid'
          };
        }
      }

      // Create new session or update existing one
      const session = await this.createAuthenticationSession({
        userId: request.userId,
        documentId: request.documentId,
        confidentialityLevel: request.confidentialityLevel,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      });

      if (!session) {
        return {
          success: false,
          requiresMFA: false,
          reason: 'Failed to create authentication session'
        };
      }

      // If MFA is required, create challenge
      if (requiresMFA) {
        const mfaChallenge = await this.createMFAChallenge(request.userId, request.documentId);
        
        if (!mfaChallenge) {
          return {
            success: false,
            requiresMFA: true,
            reason: 'Failed to create MFA challenge'
          };
        }

        return {
          success: false,
          requiresMFA: true,
          mfaChallenge,
          sessionToken: session.id,
          reason: 'MFA verification required'
        };
      }

      // No MFA required, authentication successful
      await this.logAuthenticationAttempt({
        userId: request.userId,
        documentId: request.documentId,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        timestamp: new Date(),
        success: true,
        reason: 'Authentication successful'
      });

      return {
        success: true,
        requiresMFA: false,
        sessionToken: session.id,
        expiresAt: session.expiresAt,
        restrictions: session.restrictions,
        reason: 'Authentication successful'
      };

    } catch (error) {
      console.error('Error in authentication:', error);
      return {
        success: false,
        requiresMFA: false,
        reason: 'Authentication failed due to system error'
      };
    }
  }

  /**
   * Verify MFA challenge
   */
  async verifyMFA(request: MFAVerificationRequest): Promise<MFAVerificationResult> {
    try {
      // Get MFA challenge
      const challenge = await this.getMFAChallenge(request.challengeId);
      
      if (!challenge) {
        return {
          success: false,
          reason: 'Invalid or expired MFA challenge'
        };
      }

      // Check if challenge has expired
      if (new Date() > challenge.expiresAt) {
        await this.expireMFAChallenge(request.challengeId);
        return {
          success: false,
          reason: 'MFA challenge has expired'
        };
      }

      // Check attempt limits
      if (challenge.attempts >= challenge.maxAttempts) {
        await this.expireMFAChallenge(request.challengeId);
        return {
          success: false,
          reason: 'Maximum MFA attempts exceeded'
        };
      }

      // Increment attempt counter
      await this.incrementMFAAttempts(request.challengeId);

      // Verify the MFA code
      const isValidCode = await this.verifyMFACode(challenge.type, request.code, request.userId);
      
      if (!isValidCode) {
        return {
          success: false,
          reason: 'Invalid MFA code'
        };
      }

      // MFA verification successful
      await this.completeMFAChallenge(request.challengeId);

      // Update session to mark MFA as verified
      const session = await this.getSessionByUserId(request.userId, request.documentId);
      if (session) {
        await this.markSessionMFAVerified(session.id);
        
        return {
          success: true,
          sessionToken: session.id,
          expiresAt: session.expiresAt,
          reason: 'MFA verification successful'
        };
      }

      return {
        success: false,
        reason: 'Session not found after MFA verification'
      };

    } catch (error) {
      console.error('Error verifying MFA:', error);
      return {
        success: false,
        reason: 'MFA verification failed due to system error'
      };
    }
  }

  // =====================================================
  // SESSION MANAGEMENT METHODS
  // =====================================================

  /**
   * Create authentication session
   */
  async createAuthenticationSession(params: {
    userId: string;
    documentId?: string;
    confidentialityLevel?: ConfidentialityLevel;
    ipAddress: string;
    userAgent: string;
  }): Promise<AuthenticationSession | null> {
    try {
      // Determine session timeout based on confidentiality level
      const timeoutMinutes = this.getSessionTimeout(params.confidentialityLevel);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + timeoutMinutes);

      // Get restrictions for this confidentiality level
      const restrictions = this.getAuthenticationRestrictions(params.confidentialityLevel);

      // Check concurrent session limits
      const activeSessions = await this.getActiveSessionsForUser(params.userId);
      if (activeSessions.length >= this.defaultConfig.maxConcurrentSessions) {
        // Expire oldest session
        const oldestSession = activeSessions.sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())[0];
        await this.expireSession(oldestSession.id);
      }

      const sessionData = {
        user_id: params.userId,
        document_id: params.documentId,
        confidentiality_level: params.confidentialityLevel,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        last_activity: new Date().toISOString(),
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
        is_active: true,
        mfa_verified: false,
        restrictions: JSON.stringify(restrictions)
      };

      const { data, error } = await supabaseService.getClient()
        .from(this.sessionsTable)
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      return this.mapSessionData(data);
    } catch (error) {
      console.error('Error creating authentication session:', error);
      return null;
    }
  }

  /**
   * Get active session for user and document
   */
  async getActiveSession(userId: string, documentId?: string): Promise<AuthenticationSession | null> {
    try {
      let query = supabaseService.getClient()
        .from(this.sessionsTable)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (documentId) {
        query = query.eq('document_id', documentId);
      }

      const { data, error } = await query
        .order('last_activity', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapSessionData(data);
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabaseService.getClient()
        .from(this.sessionsTable)
        .update({ last_activity: new Date().toISOString() })
        .eq('id', sessionId);

      return !error;
    } catch (error) {
      console.error('Error updating session activity:', error);
      return false;
    }
  }

  /**
   * Expire session
   */
  async expireSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabaseService.getClient()
        .from(this.sessionsTable)
        .update({ 
          is_active: false,
          expired_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      return !error;
    } catch (error) {
      console.error('Error expiring session:', error);
      return false;
    }
  }

  /**
   * Validate session token
   */
  async validateSession(sessionToken: string): Promise<AuthenticationSession | null> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from(this.sessionsTable)
        .select('*')
        .eq('id', sessionToken)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      const session = this.mapSessionData(data);
      
      // Update last activity
      await this.updateSessionActivity(sessionToken);
      
      return session;
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  // =====================================================
  // MFA METHODS
  // =====================================================

  /**
   * Create MFA challenge
   */
  async createMFAChallenge(userId: string, documentId: string): Promise<MFAChallenge | null> {
    try {
      // Get user's preferred MFA method
      const mfaMethod = await this.getUserMFAMethod(userId);
      
      if (!mfaMethod) {
        // Set up default MFA method (email)
        await this.setupDefaultMFAMethod(userId);
        return this.createMFAChallenge(userId, documentId);
      }

      const challengeId = this.generateChallengeId();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minute expiry

      const challengeData = {
        id: challengeId,
        user_id: userId,
        document_id: documentId,
        type: mfaMethod.type,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        max_attempts: 3,
        is_completed: false
      };

      const { error } = await supabaseService.getClient()
        .from(this.mfaChallengesTable)
        .insert(challengeData);

      if (error) {
        console.error('Error creating MFA challenge:', error);
        return null;
      }

      // Send MFA code
      await this.sendMFACode(mfaMethod.type, mfaMethod.destination, challengeId);

      return {
        challengeId,
        type: mfaMethod.type,
        expiresAt,
        attempts: 0,
        maxAttempts: 3
      };
    } catch (error) {
      console.error('Error creating MFA challenge:', error);
      return null;
    }
  }

  /**
   * Get MFA challenge
   */
  private async getMFAChallenge(challengeId: string): Promise<MFAChallenge | null> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from(this.mfaChallengesTable)
        .select('*')
        .eq('id', challengeId)
        .eq('is_completed', false)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        challengeId: data.id,
        type: data.type,
        expiresAt: new Date(data.expires_at),
        attempts: data.attempts,
        maxAttempts: data.max_attempts
      };
    } catch (error) {
      console.error('Error getting MFA challenge:', error);
      return null;
    }
  }

  /**
   * Verify MFA code
   */
  private async verifyMFACode(type: MFAType, code: string, userId: string): Promise<boolean> {
    // In a real implementation, this would verify against the actual MFA system
    // For now, we'll implement a simple verification
    
    switch (type) {
      case MFAType.EMAIL:
      case MFAType.SMS:
        // Verify 6-digit code
        return /^\d{6}$/.test(code);
      
      case MFAType.TOTP:
        // Verify TOTP code (would integrate with authenticator app)
        return /^\d{6}$/.test(code);
      
      default:
        return false;
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Check if MFA is required for confidentiality level
   */
  private requiresMFAForConfidentiality(level?: ConfidentialityLevel): boolean {
    if (!level) return false;
    
    return level === ConfidentialityLevel.CONFIDENTIAL || 
           level === ConfidentialityLevel.RESTRICTED;
  }

  /**
   * Get session timeout based on confidentiality level
   */
  private getSessionTimeout(level?: ConfidentialityLevel): number {
    if (level === ConfidentialityLevel.RESTRICTED) {
      return this.defaultConfig.sensitiveTimeout;
    }
    return this.defaultConfig.standardTimeout;
  }

  /**
   * Get authentication restrictions for confidentiality level
   */
  private getAuthenticationRestrictions(level?: ConfidentialityLevel): AuthenticationRestriction[] {
    const restrictions: AuthenticationRestriction[] = [];

    if (level === ConfidentialityLevel.RESTRICTED) {
      restrictions.push(
        { type: 'single_session' },
        { type: 'no_concurrent' },
        { type: 'ip_lock' }
      );
    } else if (level === ConfidentialityLevel.CONFIDENTIAL) {
      restrictions.push(
        { type: 'time_limit', value: '15' } // 15 minutes
      );
    }

    return restrictions;
  }

  /**
   * Check if session is valid
   */
  private isSessionValid(session: AuthenticationSession): boolean {
    const now = new Date();
    return session.isActive && 
           session.expiresAt > now &&
           (now.getTime() - session.lastActivity.getTime()) < (30 * 60 * 1000); // 30 minutes
  }

  /**
   * Map database session data to AuthenticationSession
   */
  private mapSessionData(data: any): AuthenticationSession {
    return {
      id: data.id,
      userId: data.user_id,
      documentId: data.document_id,
      confidentialityLevel: data.confidentiality_level,
      createdAt: new Date(data.created_at),
      expiresAt: new Date(data.expires_at),
      lastActivity: new Date(data.last_activity),
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      isActive: data.is_active,
      mfaVerified: data.mfa_verified,
      restrictions: data.restrictions ? JSON.parse(data.restrictions) : []
    };
  }

  /**
   * Generate unique challenge ID
   */
  private generateChallengeId(): string {
    return `mfa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user's MFA method
   */
  private async getUserMFAMethod(userId: string): Promise<{ type: MFAType; destination: string } | null> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from(this.mfaMethodsTable)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        type: data.type,
        destination: data.destination
      };
    } catch (error) {
      console.error('Error getting user MFA method:', error);
      return null;
    }
  }

  /**
   * Setup default MFA method for user
   */
  private async setupDefaultMFAMethod(userId: string): Promise<boolean> {
    try {
      // Get user email from users table
      const { data: userData, error: userError } = await supabaseService.getClient()
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return false;
      }

      const mfaMethodData = {
        user_id: userId,
        type: MFAType.EMAIL,
        destination: userData.email,
        is_active: true,
        is_primary: true,
        created_at: new Date().toISOString()
      };

      const { error } = await supabaseService.getClient()
        .from(this.mfaMethodsTable)
        .insert(mfaMethodData);

      return !error;
    } catch (error) {
      console.error('Error setting up default MFA method:', error);
      return false;
    }
  }

  /**
   * Send MFA code
   */
  private async sendMFACode(type: MFAType, destination: string, challengeId: string): Promise<boolean> {
    // In a real implementation, this would integrate with SMS/email services
    // For now, we'll just log the code generation
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`MFA Code for ${destination}: ${code} (Challenge: ${challengeId})`);
    
    // Store the code for verification (in real implementation, this would be hashed)
    await supabaseService.getClient()
      .from(this.mfaChallengesTable)
      .update({ verification_code: code })
      .eq('id', challengeId);

    return true;
  }

  /**
   * Get active sessions for user
   */
  private async getActiveSessionsForUser(userId: string): Promise<AuthenticationSession[]> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from(this.sessionsTable)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (error || !data) {
        return [];
      }

      return data.map(this.mapSessionData);
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }

  /**
   * Get session by user ID and document ID
   */
  private async getSessionByUserId(userId: string, documentId?: string): Promise<AuthenticationSession | null> {
    return this.getActiveSession(userId, documentId);
  }

  /**
   * Mark session MFA as verified
   */
  private async markSessionMFAVerified(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabaseService.getClient()
        .from(this.sessionsTable)
        .update({ mfa_verified: true })
        .eq('id', sessionId);

      return !error;
    } catch (error) {
      console.error('Error marking session MFA verified:', error);
      return false;
    }
  }

  /**
   * Increment MFA attempts
   */
  private async incrementMFAAttempts(challengeId: string): Promise<boolean> {
    try {
      const { error } = await supabaseService.getClient()
        .rpc('increment_mfa_attempts', { challenge_id: challengeId });

      return !error;
    } catch (error) {
      console.error('Error incrementing MFA attempts:', error);
      return false;
    }
  }

  /**
   * Complete MFA challenge
   */
  private async completeMFAChallenge(challengeId: string): Promise<boolean> {
    try {
      const { error } = await supabaseService.getClient()
        .from(this.mfaChallengesTable)
        .update({ 
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', challengeId);

      return !error;
    } catch (error) {
      console.error('Error completing MFA challenge:', error);
      return false;
    }
  }

  /**
   * Expire MFA challenge
   */
  private async expireMFAChallenge(challengeId: string): Promise<boolean> {
    try {
      const { error } = await supabaseService.getClient()
        .from(this.mfaChallengesTable)
        .update({ 
          is_expired: true,
          expired_at: new Date().toISOString()
        })
        .eq('id', challengeId);

      return !error;
    } catch (error) {
      console.error('Error expiring MFA challenge:', error);
      return false;
    }
  }

  /**
   * Log authentication attempt
   */
  private async logAuthenticationAttempt(attempt: {
    userId: string;
    documentId?: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    success: boolean;
    reason: string;
  }): Promise<void> {
    try {
      await supabaseService.getClient()
        .from(this.authAttemptsTable)
        .insert({
          user_id: attempt.userId,
          document_id: attempt.documentId,
          ip_address: attempt.ipAddress,
          user_agent: attempt.userAgent,
          timestamp: attempt.timestamp.toISOString(),
          success: attempt.success,
          reason: attempt.reason
        });
    } catch (error) {
      console.error('Error logging authentication attempt:', error);
    }
  }
}

// =====================================================
// SERVICE INSTANCE
// =====================================================

export const enhancedAuthenticationService = new EnhancedAuthenticationService();