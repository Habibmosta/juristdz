/**
 * Document Management System - Document Sharing Service
 * 
 * Provides document sharing functionality with granular permission assignment,
 * share link generation with expiration, and external sharing with security controls.
 * 
 * Requirements: 5.1, 5.6
 */

import { supabaseService } from './supabaseService';
import { encryptionService } from './encryptionService';
import type { 
  DocumentPermission,
  ShareLink,
  Permission,
  PermissionGrantRequest,
  PermissionRevocationRequest,
  AccessAttempt
} from '../../../types/document-management';

// Sharing operation result interfaces
export interface SharingOperationResult {
  success: boolean;
  error?: string;
  warnings?: string[];
}

export interface PermissionGrantResult extends SharingOperationResult {
  permission?: DocumentPermission;
}

export interface ShareLinkResult extends SharingOperationResult {
  shareLink?: ShareLink;
}

export interface PermissionListResult extends SharingOperationResult {
  permissions?: DocumentPermission[];
  totalCount?: number;
}

export interface ShareLinkListResult extends SharingOperationResult {
  shareLinks?: ShareLink[];
  totalCount?: number;
}

// Share link creation options
export interface ShareLinkOptions {
  permissions: Permission[];
  expiresAt: Date;
  maxAccess?: number;
  description?: string;
  requireAuthentication?: boolean;
  allowedDomains?: string[];
}

// Permission query options
export interface PermissionQueryOptions {
  documentId?: string;
  userId?: string;
  roleId?: string;
  permission?: Permission;
  includeExpired?: boolean;
  limit?: number;
  offset?: number;
}

export class DocumentSharingService {
  /**
   * Grant specific permissions to a user or role for a document
   */
  async grantPermission(request: PermissionGrantRequest, grantedBy: string): Promise<PermissionGrantResult> {
    try {
      // Validate document exists
      const documentResult = await supabaseService.findById('documents', request.documentId);
      if (!documentResult.success || !documentResult.data) {
        return {
          success: false,
          error: 'Document not found'
        };
      }

      // Check if granter has permission to share the document
      const canShare = await this.checkUserPermission(request.documentId, grantedBy, Permission.SHARE);
      if (!canShare) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to share document'
        };
      }

      // Validate that either userId or roleId is provided, but not both
      if ((!request.userId && !request.roleId) || (request.userId && request.roleId)) {
        return {
          success: false,
          error: 'Either userId or roleId must be provided, but not both'
        };
      }

      // Check if permission already exists
      const existingPermission = await this.findExistingPermission(
        request.documentId,
        request.userId,
        request.roleId
      );

      if (existingPermission) {
        // Update existing permission
        const updateResult = await this.updatePermission(
          existingPermission.id,
          request.permissions,
          request.expiresAt,
          grantedBy
        );
        return updateResult;
      }

      // Create new permission
      const permissionData = {
        document_id: request.documentId,
        user_id: request.userId,
        role_id: request.roleId,
        permissions: request.permissions,
        granted_by: grantedBy,
        granted_at: new Date().toISOString(),
        expires_at: request.expiresAt?.toISOString(),
        is_active: true
      };

      const createResult = await supabaseService.insert('document_permissions', permissionData);

      if (!createResult.success) {
        return {
          success: false,
          error: `Permission grant failed: ${createResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'document_permission',
        createResult.data.id,
        'grant',
        {
          documentId: request.documentId,
          targetUserId: request.userId,
          targetRoleId: request.roleId,
          permissions: request.permissions,
          expiresAt: request.expiresAt?.toISOString(),
          message: request.message
        },
        grantedBy
      );

      // Send notification if message provided
      if (request.message && request.userId) {
        await this.sendPermissionNotification(
          request.userId,
          request.documentId,
          request.permissions,
          request.message,
          grantedBy
        );
      }

      const permission = this.mapDatabaseRecordToPermission(createResult.data);

      return {
        success: true,
        permission
      };

    } catch (error) {
      return {
        success: false,
        error: `Permission grant failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Revoke permissions from a user or role for a document
   */
  async revokePermission(request: PermissionRevocationRequest, revokedBy: string): Promise<SharingOperationResult> {
    try {
      // Check if revoker has permission to manage document permissions
      const canShare = await this.checkUserPermission(request.documentId, revokedBy, Permission.SHARE);
      if (!canShare) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to revoke document permissions'
        };
      }

      // Find existing permissions
      const existingPermissions = await this.getDocumentPermissions(request.documentId, {
        userId: request.userId,
        roleId: request.roleId
      });

      if (!existingPermissions.success || !existingPermissions.permissions?.length) {
        return {
          success: false,
          error: 'No permissions found to revoke'
        };
      }

      // Revoke specified permissions or all if none specified
      const permissionsToRevoke = request.permissions || 
        existingPermissions.permissions.flatMap(p => p.permission ? [p.permission] : []);

      for (const permission of existingPermissions.permissions) {
        if (!request.permissions || permissionsToRevoke.includes(permission.permission)) {
          // Deactivate permission instead of deleting for audit trail
          await supabaseService.update('document_permissions', permission.id, {
            is_active: false,
            revoked_at: new Date().toISOString(),
            revoked_by: revokedBy,
            revocation_reason: request.reason
          });

          // Create audit entry
          await supabaseService.createAuditEntry(
            'document_permission',
            permission.id,
            'revoke',
            {
              documentId: request.documentId,
              targetUserId: request.userId,
              targetRoleId: request.roleId,
              revokedPermissions: [permission.permission],
              reason: request.reason
            },
            revokedBy
          );
        }
      }

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `Permission revocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create a secure share link for external document sharing
   */
  async createShareLink(
    documentId: string,
    options: ShareLinkOptions,
    createdBy: string
  ): Promise<ShareLinkResult> {
    try {
      // Check if user has permission to share the document
      const canShare = await this.checkUserPermission(documentId, createdBy, Permission.SHARE);
      if (!canShare) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to create share link'
        };
      }

      // Validate document exists
      const documentResult = await supabaseService.findById('documents', documentId);
      if (!documentResult.success || !documentResult.data) {
        return {
          success: false,
          error: 'Document not found'
        };
      }

      // Generate secure token
      const token = await this.generateSecureToken();

      // Create share link record
      const shareLinkData = {
        document_id: documentId,
        token,
        permissions: options.permissions,
        expires_at: options.expiresAt.toISOString(),
        created_by: createdBy,
        created_at: new Date().toISOString(),
        access_count: 0,
        max_access: options.maxAccess,
        description: options.description,
        require_authentication: options.requireAuthentication || false,
        allowed_domains: options.allowedDomains,
        is_active: true
      };

      const createResult = await supabaseService.insert('share_links', shareLinkData);

      if (!createResult.success) {
        return {
          success: false,
          error: `Share link creation failed: ${createResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'share_link',
        createResult.data.id,
        'create',
        {
          documentId,
          permissions: options.permissions,
          expiresAt: options.expiresAt.toISOString(),
          maxAccess: options.maxAccess,
          requireAuthentication: options.requireAuthentication,
          allowedDomains: options.allowedDomains
        },
        createdBy
      );

      const shareLink = this.mapDatabaseRecordToShareLink(createResult.data);

      return {
        success: true,
        shareLink
      };

    } catch (error) {
      return {
        success: false,
        error: `Share link creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Access a document via share link
   */
  async accessViaShareLink(
    token: string,
    accessorInfo?: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      domain?: string;
    }
  ): Promise<{
    success: boolean;
    documentId?: string;
    permissions?: Permission[];
    shareLink?: ShareLink;
    error?: string;
  }> {
    try {
      // Find share link by token
      const shareLinkResult = await supabaseService.query('share_links', {
        filters: { token, is_active: true },
        limit: 1
      });

      if (!shareLinkResult.success || !shareLinkResult.data?.length) {
        // Log access attempt
        await this.logAccessAttempt(
          accessorInfo?.userId,
          'unknown',
          Permission.VIEW,
          'denied',
          'Invalid or expired share link',
          accessorInfo
        );

        return {
          success: false,
          error: 'Invalid or expired share link'
        };
      }

      const shareLinkRecord = shareLinkResult.data[0];
      const shareLink = this.mapDatabaseRecordToShareLink(shareLinkRecord);

      // Check if link has expired
      if (shareLink.expiresAt < new Date()) {
        await this.logAccessAttempt(
          accessorInfo?.userId,
          shareLink.documentId,
          Permission.VIEW,
          'denied',
          'Share link expired',
          accessorInfo
        );

        return {
          success: false,
          error: 'Share link has expired'
        };
      }

      // Check access count limit
      if (shareLink.maxAccess && shareLink.accessCount >= shareLink.maxAccess) {
        await this.logAccessAttempt(
          accessorInfo?.userId,
          shareLink.documentId,
          Permission.VIEW,
          'denied',
          'Maximum access count exceeded',
          accessorInfo
        );

        return {
          success: false,
          error: 'Maximum access count exceeded'
        };
      }

      // Check domain restrictions
      if (shareLink.allowedDomains?.length && accessorInfo?.domain) {
        const isDomainAllowed = shareLink.allowedDomains.some(domain => 
          accessorInfo.domain?.endsWith(domain)
        );
        
        if (!isDomainAllowed) {
          await this.logAccessAttempt(
            accessorInfo?.userId,
            shareLink.documentId,
            Permission.VIEW,
            'denied',
            'Domain not allowed',
            accessorInfo
          );

          return {
            success: false,
            error: 'Access from this domain is not allowed'
          };
        }
      }

      // Increment access count
      await supabaseService.update('share_links', shareLink.id, {
        access_count: shareLink.accessCount + 1,
        last_accessed_at: new Date().toISOString(),
        last_accessed_by: accessorInfo?.userId,
        last_access_ip: accessorInfo?.ipAddress
      });

      // Log successful access
      await this.logAccessAttempt(
        accessorInfo?.userId,
        shareLink.documentId,
        Permission.VIEW,
        'granted',
        'Share link access granted',
        accessorInfo
      );

      return {
        success: true,
        documentId: shareLink.documentId,
        permissions: shareLink.permissions,
        shareLink
      };

    } catch (error) {
      return {
        success: false,
        error: `Share link access failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all permissions for a document
   */
  async getDocumentPermissions(
    documentId: string,
    options: PermissionQueryOptions = {}
  ): Promise<PermissionListResult> {
    try {
      const filters: any = { document_id: documentId };
      
      if (options.userId) filters.user_id = options.userId;
      if (options.roleId) filters.role_id = options.roleId;
      if (options.permission) filters.permissions = { contains: [options.permission] };
      if (!options.includeExpired) {
        filters.is_active = true;
      }

      const queryOptions = {
        filters,
        limit: options.limit || 50,
        offset: options.offset || 0,
        sortBy: 'granted_at',
        sortOrder: 'desc' as const
      };

      const result = await supabaseService.query('document_permissions', queryOptions);

      if (!result.success) {
        return {
          success: false,
          error: `Failed to retrieve permissions: ${result.error?.message || 'Unknown error'}`
        };
      }

      const permissions = (result.data || []).map(record => 
        this.mapDatabaseRecordToPermission(record)
      );

      return {
        success: true,
        permissions,
        totalCount: result.count
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve permissions: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all share links for a document
   */
  async getDocumentShareLinks(documentId: string, createdBy?: string): Promise<ShareLinkListResult> {
    try {
      const filters: any = { document_id: documentId, is_active: true };
      if (createdBy) filters.created_by = createdBy;

      const result = await supabaseService.query('share_links', {
        filters,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      if (!result.success) {
        return {
          success: false,
          error: `Failed to retrieve share links: ${result.error?.message || 'Unknown error'}`
        };
      }

      const shareLinks = (result.data || []).map(record => 
        this.mapDatabaseRecordToShareLink(record)
      );

      return {
        success: true,
        shareLinks,
        totalCount: result.count
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve share links: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Revoke a share link
   */
  async revokeShareLink(shareLinkId: string, revokedBy: string): Promise<SharingOperationResult> {
    try {
      // Get share link to verify ownership
      const shareLinkResult = await supabaseService.findById('share_links', shareLinkId);
      if (!shareLinkResult.success || !shareLinkResult.data) {
        return {
          success: false,
          error: 'Share link not found'
        };
      }

      const shareLink = shareLinkResult.data;

      // Check if user has permission to revoke (creator or document owner)
      const canRevoke = shareLink.created_by === revokedBy || 
        await this.checkUserPermission(shareLink.document_id, revokedBy, Permission.SHARE);

      if (!canRevoke) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to revoke share link'
        };
      }

      // Deactivate share link
      await supabaseService.update('share_links', shareLinkId, {
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: revokedBy
      });

      // Create audit entry
      await supabaseService.createAuditEntry(
        'share_link',
        shareLinkId,
        'revoke',
        {
          documentId: shareLink.document_id,
          token: shareLink.token,
          accessCount: shareLink.access_count
        },
        revokedBy
      );

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `Share link revocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if a user has a specific permission for a document
   */
  async checkUserPermission(
    documentId: string,
    userId: string,
    permission: Permission
  ): Promise<boolean> {
    try {
      // Check document ownership first
      const documentResult = await supabaseService.findById('documents', documentId);
      if (documentResult.success && documentResult.data) {
        if (documentResult.data.created_by === userId || documentResult.data.user_id === userId) {
          return true; // Document owner has all permissions
        }
      }

      // Check direct user permissions
      const userPermissionResult = await supabaseService.query('document_permissions', {
        filters: {
          document_id: documentId,
          user_id: userId,
          is_active: true
        },
        limit: 1
      });

      if (userPermissionResult.success && userPermissionResult.data?.length) {
        const userPermission = userPermissionResult.data[0];
        if (userPermission.permissions.includes(permission)) {
          // Check if permission hasn't expired
          return !userPermission.expires_at || new Date(userPermission.expires_at) > new Date();
        }
      }

      // TODO: Check role-based permissions when role system is implemented
      // This would involve checking the user's roles and then checking role permissions

      return false;

    } catch (error) {
      console.error('Failed to check user permission:', error);
      return false;
    }
  }

  /**
   * Generate a secure token for share links
   */
  private async generateSecureToken(): Promise<string> {
    const crypto = await import('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Find existing permission for user/role and document
   */
  private async findExistingPermission(
    documentId: string,
    userId?: string,
    roleId?: string
  ): Promise<DocumentPermission | null> {
    try {
      const filters: any = { document_id: documentId, is_active: true };
      if (userId) filters.user_id = userId;
      if (roleId) filters.role_id = roleId;

      const result = await supabaseService.query('document_permissions', {
        filters,
        limit: 1
      });

      if (result.success && result.data?.length) {
        return this.mapDatabaseRecordToPermission(result.data[0]);
      }

      return null;

    } catch (error) {
      console.error('Failed to find existing permission:', error);
      return null;
    }
  }

  /**
   * Update existing permission
   */
  private async updatePermission(
    permissionId: string,
    permissions: Permission[],
    expiresAt?: Date,
    updatedBy?: string
  ): Promise<PermissionGrantResult> {
    try {
      const updateData: any = {
        permissions,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      };

      if (expiresAt) {
        updateData.expires_at = expiresAt.toISOString();
      }

      const updateResult = await supabaseService.update('document_permissions', permissionId, updateData);

      if (!updateResult.success) {
        return {
          success: false,
          error: `Permission update failed: ${updateResult.error?.message || 'Unknown error'}`
        };
      }

      const permission = this.mapDatabaseRecordToPermission(updateResult.data);

      return {
        success: true,
        permission
      };

    } catch (error) {
      return {
        success: false,
        error: `Permission update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Send permission notification to user
   */
  private async sendPermissionNotification(
    userId: string,
    documentId: string,
    permissions: Permission[],
    message: string,
    grantedBy: string
  ): Promise<void> {
    try {
      // TODO: Integrate with notification service when available
      // For now, we'll create a notification record in the database
      
      const notificationData = {
        user_id: userId,
        type: 'document_permission_granted',
        title: 'Document Access Granted',
        message: `You have been granted ${permissions.join(', ')} permissions to a document. ${message}`,
        data: {
          documentId,
          permissions,
          grantedBy
        },
        created_at: new Date().toISOString(),
        is_read: false
      };

      await supabaseService.insert('notifications', notificationData);

    } catch (error) {
      console.error('Failed to send permission notification:', error);
      // Don't fail the main operation if notification fails
    }
  }

  /**
   * Log access attempt for security monitoring
   */
  private async logAccessAttempt(
    userId: string | undefined,
    documentId: string,
    permission: Permission,
    result: 'granted' | 'denied' | 'error',
    reason?: string,
    accessorInfo?: {
      ipAddress?: string;
      userAgent?: string;
      domain?: string;
    }
  ): Promise<void> {
    try {
      const accessAttemptData = {
        user_id: userId,
        document_id: documentId,
        permission,
        result,
        reason,
        ip_address: accessorInfo?.ipAddress,
        user_agent: accessorInfo?.userAgent,
        domain: accessorInfo?.domain,
        timestamp: new Date().toISOString()
      };

      await supabaseService.insert('access_attempts', accessAttemptData);

    } catch (error) {
      console.error('Failed to log access attempt:', error);
      // Don't fail the main operation if logging fails
    }
  }

  /**
   * Map database record to DocumentPermission interface
   */
  private mapDatabaseRecordToPermission(record: any): DocumentPermission {
    return {
      id: record.id,
      documentId: record.document_id,
      userId: record.user_id,
      roleId: record.role_id,
      permission: record.permissions[0], // For backward compatibility, take first permission
      grantedBy: record.granted_by,
      grantedAt: new Date(record.granted_at),
      expiresAt: record.expires_at ? new Date(record.expires_at) : undefined
    };
  }

  /**
   * Map database record to ShareLink interface
   */
  private mapDatabaseRecordToShareLink(record: any): ShareLink {
    return {
      id: record.id,
      documentId: record.document_id,
      token: record.token,
      permissions: record.permissions,
      expiresAt: new Date(record.expires_at),
      createdBy: record.created_by,
      accessCount: record.access_count,
      maxAccess: record.max_access,
      allowedDomains: record.allowed_domains
    };
  }
}

// Export singleton instance
export const documentSharingService = new DocumentSharingService();
export default documentSharingService;
