/**
 * Access Control Service
 * 
 * Implements role-based access control, permission inheritance from case management,
 * attorney-client privilege enforcement, and confidentiality level restrictions
 * for the Document Management System.
 * 
 * Requirements: 5.5, 7.4, 8.2
 */

import {
  Document,
  DocumentPermission,
  Permission,
  ConfidentialityLevel,
  AccessAttempt,
  AuditTrail
} from '../../../types/document-management';
import { UserRole } from '../../../types';
import { supabaseService } from './supabaseService';
import { auditService } from './auditService';

// =====================================================
// ACCESS CONTROL INTERFACES
// =====================================================

export interface AccessControlRequest {
  userId: string;
  userRole: UserRole;
  documentId: string;
  permission: Permission;
  caseId?: string;
  organizationId?: string;
  clientId?: string;
}

export interface AccessControlResult {
  granted: boolean;
  reason: string;
  restrictions?: AccessRestriction[];
  auditTrailId?: string;
}

export interface AccessRestriction {
  type: 'time_limit' | 'ip_restriction' | 'download_disabled' | 'print_disabled' | 'watermark_required';
  value?: string;
  expiresAt?: Date;
}

export interface PermissionInheritanceRule {
  sourceRole: UserRole;
  targetPermissions: Permission[];
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  type: 'case_assignment' | 'organization_member' | 'client_relationship' | 'confidentiality_level';
  value: string;
  operator: 'equals' | 'includes' | 'greater_than' | 'less_than';
}

export interface AttorneyClientPrivilege {
  attorneyId: string;
  clientId: string;
  caseId: string;
  privilegeLevel: 'full' | 'limited' | 'none';
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface ConfidentialityRule {
  level: ConfidentialityLevel;
  requiredRoles: UserRole[];
  additionalRestrictions: AccessRestriction[];
  requiresApproval: boolean;
}

// =====================================================
// ACCESS CONTROL SERVICE CLASS
// =====================================================

export class AccessControlService {
  private readonly permissionsTable = 'document_permissions';
  private readonly privilegeTable = 'attorney_client_privileges';
  private readonly accessAttemptsTable = 'access_attempts';
  private readonly inheritanceRulesTable = 'permission_inheritance_rules';

  // =====================================================
  // CORE ACCESS CONTROL METHODS
  // =====================================================

  /**
   * Check if user has permission to access document
   * Requirement 5.5: Permission inheritance from case management
   * Requirement 7.4: Attorney-client privilege enforcement
   */
  async checkAccess(request: AccessControlRequest): Promise<AccessControlResult> {
    try {
      // Log access attempt
      const accessAttempt: AccessAttempt = {
        userId: request.userId,
        documentId: request.documentId,
        permission: request.permission,
        timestamp: new Date(),
        ipAddress: this.getCurrentIPAddress(),
        userAgent: this.getCurrentUserAgent(),
        granted: false,
        reason: ''
      };

      // Get document details
      const document = await this.getDocument(request.documentId);
      if (!document) {
        accessAttempt.reason = 'Document not found';
        await this.logAccessAttempt(accessAttempt);
        return { granted: false, reason: 'Document not found' };
      }

      // Check confidentiality level restrictions
      const confidentialityCheck = await this.checkConfidentialityAccess(
        request.userRole,
        document.metadata.confidentialityLevel
      );

      if (!confidentialityCheck.granted) {
        accessAttempt.reason = confidentialityCheck.reason;
        await this.logAccessAttempt(accessAttempt);
        return confidentialityCheck;
      }

      // Check attorney-client privilege
      if (document.caseId) {
        const privilegeCheck = await this.checkAttorneyClientPrivilege(
          request.userId,
          document.caseId,
          request.permission
        );

        if (!privilegeCheck.granted) {
          accessAttempt.reason = privilegeCheck.reason;
          await this.logAccessAttempt(accessAttempt);
          return privilegeCheck;
        }
      }

      // Check inherited permissions from case management
      const inheritedPermissions = await this.getInheritedPermissions(
        request.userId,
        request.userRole,
        document.caseId,
        request.organizationId
      );

      // Check direct document permissions
      const directPermissions = await this.getDirectDocumentPermissions(
        request.userId,
        request.documentId
      );

      // Combine permissions
      const allPermissions = [...inheritedPermissions, ...directPermissions];
      const hasPermission = allPermissions.includes(request.permission);

      if (!hasPermission) {
        accessAttempt.reason = 'Insufficient permissions';
        await this.logAccessAttempt(accessAttempt);
        return { granted: false, reason: 'Insufficient permissions' };
      }

      // Apply access restrictions based on confidentiality level
      const restrictions = await this.getAccessRestrictions(
        document.metadata.confidentialityLevel,
        request.userRole
      );

      // Grant access
      accessAttempt.granted = true;
      accessAttempt.reason = 'Access granted';
      const auditTrailId = await this.logAccessAttempt(accessAttempt);

      return {
        granted: true,
        reason: 'Access granted',
        restrictions,
        auditTrailId
      };

    } catch (error) {
      console.error('Error checking access:', error);
      return {
        granted: false,
        reason: 'Access check failed due to system error'
      };
    }
  }

  /**
   * Grant permission to user for document
   */
  async grantPermission(
    documentId: string,
    userId: string,
    permission: Permission,
    grantedBy: string,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      const permissionData = {
        document_id: documentId,
        user_id: userId,
        permission,
        granted_by: grantedBy,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt?.toISOString(),
        is_active: true
      };

      const { error } = await supabaseService.getClient()
        .from(this.permissionsTable)
        .insert(permissionData);

      if (error) {
        console.error('Error granting permission:', error);
        return false;
      }

      // Log permission grant
      await auditService.logActivity({
        userId: grantedBy,
        action: 'permission_granted',
        resourceType: 'document',
        resourceId: documentId,
        details: {
          targetUserId: userId,
          permission,
          expiresAt
        }
      });

      return true;
    } catch (error) {
      console.error('Error granting permission:', error);
      return false;
    }
  }

  /**
   * Revoke permission from user for document
   */
  async revokePermission(
    documentId: string,
    userId: string,
    permission: Permission,
    revokedBy: string
  ): Promise<boolean> {
    try {
      const { error } = await supabaseService.getClient()
        .from(this.permissionsTable)
        .update({ 
          is_active: false,
          revoked_by: revokedBy,
          revoked_at: new Date().toISOString()
        })
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .eq('permission', permission)
        .eq('is_active', true);

      if (error) {
        console.error('Error revoking permission:', error);
        return false;
      }

      // Log permission revocation
      await auditService.logActivity({
        userId: revokedBy,
        action: 'permission_revoked',
        resourceType: 'document',
        resourceId: documentId,
        details: {
          targetUserId: userId,
          permission
        }
      });

      return true;
    } catch (error) {
      console.error('Error revoking permission:', error);
      return false;
    }
  }

  // =====================================================
  // PERMISSION INHERITANCE METHODS
  // =====================================================

  /**
   * Get inherited permissions from case management system
   * Requirement 8.2: Permission system integration
   */
  async getInheritedPermissions(
    userId: string,
    userRole: UserRole,
    caseId?: string,
    organizationId?: string
  ): Promise<Permission[]> {
    try {
      const inheritedPermissions: Permission[] = [];

      // Get role-based permissions
      const rolePermissions = await this.getRoleBasedPermissions(userRole);
      inheritedPermissions.push(...rolePermissions);

      // Get case-specific permissions if case is provided
      if (caseId) {
        const casePermissions = await this.getCaseBasedPermissions(userId, caseId);
        inheritedPermissions.push(...casePermissions);
      }

      // Get organization-specific permissions if organization is provided
      if (organizationId) {
        const orgPermissions = await this.getOrganizationBasedPermissions(userId, organizationId);
        inheritedPermissions.push(...orgPermissions);
      }

      // Remove duplicates
      return [...new Set(inheritedPermissions)];
    } catch (error) {
      console.error('Error getting inherited permissions:', error);
      return [];
    }
  }

  /**
   * Get role-based permissions
   */
  private async getRoleBasedPermissions(userRole: UserRole): Promise<Permission[]> {
    const rolePermissionMap: Record<UserRole, Permission[]> = {
      [UserRole.ADMIN]: [Permission.VIEW, Permission.EDIT, Permission.DELETE, Permission.SHARE, Permission.SIGN],
      [UserRole.AVOCAT]: [Permission.VIEW, Permission.EDIT, Permission.SHARE, Permission.SIGN],
      [UserRole.NOTAIRE]: [Permission.VIEW, Permission.EDIT, Permission.SHARE, Permission.SIGN],
      [UserRole.HUISSIER]: [Permission.VIEW, Permission.EDIT, Permission.SHARE],
      [UserRole.MAGISTRATE]: [Permission.VIEW, Permission.EDIT],
      [UserRole.CLIENT]: [Permission.VIEW]
    };

    return rolePermissionMap[userRole] || [Permission.VIEW];
  }

  /**
   * Get case-based permissions
   */
  private async getCaseBasedPermissions(userId: string, caseId: string): Promise<Permission[]> {
    try {
      // Query case management system for user's role in this case
      const { data, error } = await supabaseService.getClient()
        .from('case_participants')
        .select('role, permissions')
        .eq('case_id', caseId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return [];
      }

      return data.permissions || [];
    } catch (error) {
      console.error('Error getting case-based permissions:', error);
      return [];
    }
  }

  /**
   * Get organization-based permissions
   */
  private async getOrganizationBasedPermissions(userId: string, organizationId: string): Promise<Permission[]> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from('organization_members')
        .select('role, permissions')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return [];
      }

      return data.permissions || [];
    } catch (error) {
      console.error('Error getting organization-based permissions:', error);
      return [];
    }
  }

  // =====================================================
  // ATTORNEY-CLIENT PRIVILEGE METHODS
  // =====================================================

  /**
   * Check attorney-client privilege
   * Requirement 7.4: Attorney-client privilege enforcement
   */
  async checkAttorneyClientPrivilege(
    userId: string,
    caseId: string,
    permission: Permission
  ): Promise<AccessControlResult> {
    try {
      // Get privilege relationship
      const { data, error } = await supabaseService.getClient()
        .from(this.privilegeTable)
        .select('*')
        .eq('case_id', caseId)
        .or(`attorney_id.eq.${userId},client_id.eq.${userId}`)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        // No privilege relationship found - check if user has other access rights
        return { granted: true, reason: 'No privilege restrictions apply' };
      }

      // Check if privilege has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { granted: false, reason: 'Attorney-client privilege has expired' };
      }

      // Check privilege level
      switch (data.privilege_level) {
        case 'full':
          return { granted: true, reason: 'Full attorney-client privilege' };
        
        case 'limited':
          // Limited privilege - only allow view and comment
          if ([Permission.VIEW, Permission.COMMENT].includes(permission)) {
            return { granted: true, reason: 'Limited attorney-client privilege' };
          }
          return { granted: false, reason: 'Permission not allowed under limited privilege' };
        
        case 'none':
          return { granted: false, reason: 'Attorney-client privilege denied' };
        
        default:
          return { granted: false, reason: 'Invalid privilege level' };
      }
    } catch (error) {
      console.error('Error checking attorney-client privilege:', error);
      return { granted: false, reason: 'Privilege check failed' };
    }
  }

  /**
   * Grant attorney-client privilege
   */
  async grantAttorneyClientPrivilege(
    attorneyId: string,
    clientId: string,
    caseId: string,
    privilegeLevel: 'full' | 'limited' | 'none',
    grantedBy: string,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      const privilegeData = {
        attorney_id: attorneyId,
        client_id: clientId,
        case_id: caseId,
        privilege_level: privilegeLevel,
        granted_at: new Date().toISOString(),
        granted_by: grantedBy,
        expires_at: expiresAt?.toISOString(),
        is_active: true
      };

      const { error } = await supabaseService.getClient()
        .from(this.privilegeTable)
        .insert(privilegeData);

      if (error) {
        console.error('Error granting attorney-client privilege:', error);
        return false;
      }

      // Log privilege grant
      await auditService.logActivity({
        userId: grantedBy,
        action: 'privilege_granted',
        resourceType: 'case',
        resourceId: caseId,
        details: {
          attorneyId,
          clientId,
          privilegeLevel,
          expiresAt
        }
      });

      return true;
    } catch (error) {
      console.error('Error granting attorney-client privilege:', error);
      return false;
    }
  }

  // =====================================================
  // CONFIDENTIALITY LEVEL METHODS
  // =====================================================

  /**
   * Check confidentiality level access
   * Requirement 7.4: Confidentiality level restrictions
   */
  async checkConfidentialityAccess(
    userRole: UserRole,
    confidentialityLevel: ConfidentialityLevel
  ): Promise<AccessControlResult> {
    const confidentialityRules: Record<ConfidentialityLevel, ConfidentialityRule> = {
      [ConfidentialityLevel.PUBLIC]: {
        level: ConfidentialityLevel.PUBLIC,
        requiredRoles: Object.values(UserRole),
        additionalRestrictions: [],
        requiresApproval: false
      },
      [ConfidentialityLevel.INTERNAL]: {
        level: ConfidentialityLevel.INTERNAL,
        requiredRoles: [UserRole.ADMIN, UserRole.AVOCAT, UserRole.NOTAIRE, UserRole.HUISSIER, UserRole.MAGISTRATE],
        additionalRestrictions: [],
        requiresApproval: false
      },
      [ConfidentialityLevel.CONFIDENTIAL]: {
        level: ConfidentialityLevel.CONFIDENTIAL,
        requiredRoles: [UserRole.ADMIN, UserRole.AVOCAT, UserRole.NOTAIRE],
        additionalRestrictions: [
          { type: 'watermark_required', value: 'CONFIDENTIAL' },
          { type: 'download_disabled' }
        ],
        requiresApproval: false
      },
      [ConfidentialityLevel.RESTRICTED]: {
        level: ConfidentialityLevel.RESTRICTED,
        requiredRoles: [UserRole.ADMIN, UserRole.AVOCAT],
        additionalRestrictions: [
          { type: 'watermark_required', value: 'RESTRICTED' },
          { type: 'download_disabled' },
          { type: 'print_disabled' },
          { type: 'ip_restriction' }
        ],
        requiresApproval: true
      }
    };

    const rule = confidentialityRules[confidentialityLevel];
    
    if (!rule.requiredRoles.includes(userRole)) {
      return {
        granted: false,
        reason: `Role ${userRole} not authorized for ${confidentialityLevel} documents`
      };
    }

    return {
      granted: true,
      reason: `Access granted for ${confidentialityLevel} document`,
      restrictions: rule.additionalRestrictions
    };
  }

  /**
   * Get access restrictions for confidentiality level
   */
  private async getAccessRestrictions(
    confidentialityLevel: ConfidentialityLevel,
    userRole: UserRole
  ): Promise<AccessRestriction[]> {
    const confidentialityCheck = await this.checkConfidentialityAccess(userRole, confidentialityLevel);
    return confidentialityCheck.restrictions || [];
  }

  // =====================================================
  // DIRECT PERMISSION METHODS
  // =====================================================

  /**
   * Get direct document permissions for user
   */
  async getDirectDocumentPermissions(userId: string, documentId: string): Promise<Permission[]> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from(this.permissionsTable)
        .select('permission')
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (error) {
        console.error('Error getting direct permissions:', error);
        return [];
      }

      return data.map(row => row.permission);
    } catch (error) {
      console.error('Error getting direct permissions:', error);
      return [];
    }
  }

  /**
   * Get all permissions for user on document
   */
  async getAllUserPermissions(
    userId: string,
    userRole: UserRole,
    documentId: string,
    caseId?: string,
    organizationId?: string
  ): Promise<Permission[]> {
    const directPermissions = await this.getDirectDocumentPermissions(userId, documentId);
    const inheritedPermissions = await this.getInheritedPermissions(userId, userRole, caseId, organizationId);
    
    return [...new Set([...directPermissions, ...inheritedPermissions])];
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Get document details
   */
  private async getDocument(documentId: string): Promise<Document | null> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('is_deleted', false)
        .single();

      if (error || !data) {
        return null;
      }

      return data as Document;
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  }

  /**
   * Log access attempt
   */
  private async logAccessAttempt(attempt: AccessAttempt): Promise<string | undefined> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from(this.accessAttemptsTable)
        .insert({
          user_id: attempt.userId,
          document_id: attempt.documentId,
          permission: attempt.permission,
          timestamp: attempt.timestamp.toISOString(),
          ip_address: attempt.ipAddress,
          user_agent: attempt.userAgent,
          granted: attempt.granted,
          reason: attempt.reason
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error logging access attempt:', error);
        return undefined;
      }

      return data.id;
    } catch (error) {
      console.error('Error logging access attempt:', error);
      return undefined;
    }
  }

  /**
   * Get current IP address (placeholder - would be implemented based on request context)
   */
  private getCurrentIPAddress(): string {
    // In a real implementation, this would extract IP from request headers
    return '127.0.0.1';
  }

  /**
   * Get current user agent (placeholder - would be implemented based on request context)
   */
  private getCurrentUserAgent(): string {
    // In a real implementation, this would extract user agent from request headers
    return 'Document Management System';
  }

  // =====================================================
  // BULK OPERATIONS
  // =====================================================

  /**
   * Grant permissions to multiple users
   */
  async grantPermissionsToUsers(
    documentId: string,
    userPermissions: Array<{ userId: string; permissions: Permission[] }>,
    grantedBy: string,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      const permissionData = userPermissions.flatMap(({ userId, permissions }) =>
        permissions.map(permission => ({
          document_id: documentId,
          user_id: userId,
          permission,
          granted_by: grantedBy,
          granted_at: new Date().toISOString(),
          expires_at: expiresAt?.toISOString(),
          is_active: true
        }))
      );

      const { error } = await supabaseService.getClient()
        .from(this.permissionsTable)
        .insert(permissionData);

      if (error) {
        console.error('Error granting bulk permissions:', error);
        return false;
      }

      // Log bulk permission grant
      await auditService.logActivity({
        userId: grantedBy,
        action: 'bulk_permissions_granted',
        resourceType: 'document',
        resourceId: documentId,
        details: {
          userCount: userPermissions.length,
          totalPermissions: permissionData.length,
          expiresAt
        }
      });

      return true;
    } catch (error) {
      console.error('Error granting bulk permissions:', error);
      return false;
    }
  }

  /**
   * Revoke all permissions for user on document
   */
  async revokeAllUserPermissions(
    documentId: string,
    userId: string,
    revokedBy: string
  ): Promise<boolean> {
    try {
      const { error } = await supabaseService.getClient()
        .from(this.permissionsTable)
        .update({
          is_active: false,
          revoked_by: revokedBy,
          revoked_at: new Date().toISOString()
        })
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error revoking all permissions:', error);
        return false;
      }

      // Log permission revocation
      await auditService.logActivity({
        userId: revokedBy,
        action: 'all_permissions_revoked',
        resourceType: 'document',
        resourceId: documentId,
        details: {
          targetUserId: userId
        }
      });

      return true;
    } catch (error) {
      console.error('Error revoking all permissions:', error);
      return false;
    }
  }
}

// =====================================================
// SERVICE INSTANCE
// =====================================================

export const accessControlService = new AccessControlService();