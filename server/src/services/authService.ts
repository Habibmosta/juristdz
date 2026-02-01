import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/config/environment';
import { db } from '@/database/connection';
import { logger } from '@/utils/logger';
import { UserCredentials, AuthResult, TokenPair, SessionInfo, MFASetup, UserProfile, MFAMethod } from '@/types/auth';

export class AuthenticationService {
  private readonly saltRounds = 12;
  private readonly sessionExpiryHours = 24;

  /**
   * Authenticate user with credentials and return auth result
   * Validates: Requirements 1.1 - Authentication and role determination
   */
  async authenticate(credentials: UserCredentials): Promise<AuthResult> {
    try {
      const { email, password, mfaCode } = credentials;

      // Find user by email
      const userResult = await db.query(
        'SELECT id, email, password_hash, is_active, email_verified, mfa_enabled, mfa_secret FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (!userResult || (userResult as any).rows.length === 0) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      const user = (userResult as any).rows[0];

      // Check if user is active and email verified
      if (!user.is_active) {
        return {
          success: false,
          error: 'Account is deactivated'
        };
      }

      if (!user.email_verified) {
        return {
          success: false,
          error: 'Email not verified'
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check MFA if enabled
      if (user.mfa_enabled) {
        if (!mfaCode) {
          return {
            success: false,
            mfaRequired: true,
            error: 'MFA code required'
          };
        }

        const isMFAValid = speakeasy.totp.verify({
          secret: user.mfa_secret,
          encoding: 'base32',
          token: mfaCode,
          window: 2
        });

        if (!isMFAValid) {
          return {
            success: false,
            error: 'Invalid MFA code'
          };
        }
      }

      // Get user profiles with roles
      const profilesResult = await db.query(
        `SELECT up.*, o.name as organization_name, o.type as organization_type 
         FROM user_profiles up 
         LEFT JOIN organizations o ON up.barreau_id = o.id::text 
         WHERE up.user_id = $1 
         ORDER BY up.is_primary DESC, up.created_at ASC`,
        [user.id]
      );

      const profiles = (profilesResult as any).rows;

      if (profiles.length === 0) {
        return {
          success: false,
          error: 'No user profile found'
        };
      }

      // Create user profile object
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        firstName: profiles[0].first_name || '',
        lastName: profiles[0].last_name || '',
        profession: profiles[0].profession,
        registrationNumber: profiles[0].registration_number,
        barreauId: profiles[0].barreau_id,
        organizationName: profiles[0].organization_name,
        phoneNumber: user.phone_number,
        address: {
          line1: profiles[0].address_line1,
          line2: profiles[0].address_line2,
          city: profiles[0].city,
          postalCode: profiles[0].postal_code,
          country: profiles[0].country
        },
        languages: profiles[0].languages || ['fr'],
        specializations: profiles[0].specializations || [],
        roles: profiles.map((p: any) => p.profession),
        activeRole: profiles[0].profession,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        mfaEnabled: user.mfa_enabled
      };

      // Generate tokens
      const tokens = await this.generateTokens(user.id, profiles[0].id);

      // Create session
      await this.createSession(user.id, tokens, profiles[0].id);

      // Update last login
      await db.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      logger.info(`User authenticated successfully: ${email}`);

      return {
        success: true,
        user: userProfile,
        tokens
      };

    } catch (error) {
      logger.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Validate session token and return session info
   * Validates: Requirements 1.5 - Secure session management with expiration
   */
  async validateSession(token: string): Promise<SessionInfo> {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      // Check session in database
      const sessionResult = await db.query(
        `SELECT s.*, u.email, u.is_active, up.profession, up.first_name, up.last_name
         FROM user_sessions s
         JOIN users u ON s.user_id = u.id
         LEFT JOIN user_profiles up ON s.active_profile_id = up.id
         WHERE s.token_hash = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
        [this.hashToken(token)]
      );

      if (!sessionResult || (sessionResult as any).rows.length === 0) {
        return {
          valid: false,
          error: 'Invalid or expired session'
        };
      }

      const session = (sessionResult as any).rows[0];

      // Update last activity
      await db.query(
        'UPDATE user_sessions SET last_activity_at = CURRENT_TIMESTAMP WHERE id = $1',
        [session.id]
      );

      return {
        valid: true,
        userId: session.user_id,
        email: session.email,
        activeRole: session.profession,
        sessionId: session.id,
        expiresAt: session.expires_at
      };

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: 'Invalid token'
        };
      }
      
      logger.error('Session validation error:', error);
      return {
        valid: false,
        error: 'Session validation failed'
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      
      // Find session with refresh token
      const sessionResult = await db.query(
        'SELECT * FROM user_sessions WHERE refresh_token_hash = $1 AND expires_at > CURRENT_TIMESTAMP',
        [this.hashToken(refreshToken)]
      );

      if (!sessionResult || (sessionResult as any).rows.length === 0) {
        throw new Error('Invalid refresh token');
      }

      const session = (sessionResult as any).rows[0];

      // Generate new tokens
      const newTokens = await this.generateTokens(session.user_id, session.active_profile_id);

      // Update session with new tokens
      await db.query(
        `UPDATE user_sessions 
         SET token_hash = $1, refresh_token_hash = $2, expires_at = $3, last_activity_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [
          this.hashToken(newTokens.accessToken),
          this.hashToken(newTokens.refreshToken),
          new Date(Date.now() + this.sessionExpiryHours * 60 * 60 * 1000),
          session.id
        ]
      );

      return newTokens;

    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Logout user by invalidating session
   */
  async logout(sessionId: string): Promise<void> {
    try {
      await db.query(
        'DELETE FROM user_sessions WHERE id = $1',
        [sessionId]
      );
      
      logger.info(`Session logged out: ${sessionId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(userId: string, method: MFAMethod): Promise<MFASetup> {
    try {
      if (method !== 'totp') {
        throw new Error('Only TOTP MFA method is currently supported');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: 'JuristDZ',
        issuer: 'JuristDZ Legal Platform',
        length: 32
      });

      // Get user email for QR code
      const userResult = await db.query(
        'SELECT email FROM users WHERE id = $1',
        [userId]
      );

      if (!userResult || (userResult as any).rows.length === 0) {
        throw new Error('User not found');
      }

      const user = (userResult as any).rows[0];

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Store secret (temporarily, until verified)
      await db.query(
        'UPDATE users SET mfa_secret = $1 WHERE id = $2',
        [secret.base32, userId]
      );

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes: [] // TODO: Implement backup codes
      };

    } catch (error) {
      logger.error('MFA setup error:', error);
      throw new Error('MFA setup failed');
    }
  }

  /**
   * Verify MFA setup and enable it
   */
  async verifyMFASetup(userId: string, token: string): Promise<boolean> {
    try {
      // Get user's MFA secret
      const userResult = await db.query(
        'SELECT mfa_secret FROM users WHERE id = $1',
        [userId]
      );

      if (!userResult || (userResult as any).rows.length === 0) {
        return false;
      }

      const user = (userResult as any).rows[0];

      // Verify token
      const isValid = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      if (isValid) {
        // Enable MFA
        await db.query(
          'UPDATE users SET mfa_enabled = true WHERE id = $1',
          [userId]
        );
        
        logger.info(`MFA enabled for user: ${userId}`);
      }

      return isValid;

    } catch (error) {
      logger.error('MFA verification error:', error);
      return false;
    }
  }

  /**
   * Switch active role for multi-role users
   */
  async switchRole(userId: string, sessionId: string, newRole: string): Promise<boolean> {
    try {
      // Verify user has this role
      const profileResult = await db.query(
        'SELECT id FROM user_profiles WHERE user_id = $1 AND profession = $2',
        [userId, newRole]
      );

      if (!profileResult || (profileResult as any).rows.length === 0) {
        return false;
      }

      const profile = (profileResult as any).rows[0];

      // Update session with new active profile
      await db.query(
        'UPDATE user_sessions SET active_profile_id = $1 WHERE id = $2 AND user_id = $3',
        [profile.id, sessionId, userId]
      );

      logger.info(`Role switched for user ${userId} to ${newRole}`);
      return true;

    } catch (error) {
      logger.error('Role switch error:', error);
      return false;
    }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(userId: string, profileId: string): Promise<TokenPair> {
    const accessToken = jwt.sign(
      { 
        userId, 
        profileId,
        type: 'access'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { 
        userId, 
        profileId,
        type: 'refresh'
      },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Create user session
   */
  private async createSession(
    userId: string, 
    tokens: TokenPair, 
    activeProfileId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + this.sessionExpiryHours * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO user_sessions (user_id, token_hash, refresh_token_hash, active_profile_id, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        this.hashToken(tokens.accessToken),
        this.hashToken(tokens.refreshToken),
        activeProfileId,
        ipAddress,
        userAgent,
        expiresAt
      ]
    );
  }

  /**
   * Hash token for storage
   */
  private hashToken(token: string): string {
    return bcrypt.hashSync(token, 8);
  }

  /**
   * Clean expired sessions
   */
  async cleanExpiredSessions(): Promise<void> {
    try {
      const result = await db.query(
        'DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP'
      );
      
      const deletedCount = (result as any).rowCount;
      if (deletedCount > 0) {
        logger.info(`Cleaned ${deletedCount} expired sessions`);
      }
    } catch (error) {
      logger.error('Session cleanup error:', error);
    }
  }
}

export const authService = new AuthenticationService();