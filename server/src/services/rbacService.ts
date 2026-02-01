import { db } from '@/database/connection';
import { logger } from '@/utils/logger';
import { 
  Role, 
  Permission, 
  AccessContext, 
  RoleDefinition, 
  PermissionDefinition,
  OrganizationContext,
  UserRoleAssignment,
  RolePermissionCheck,
  PermissionScope,
  ResourceType,
  ActionType,
  DEFAULT_ROLE_PERMISSIONS,
  AccessCondition
} from '@/types/rbac';
import { Profession } from '@/types/auth';
import crypto from 'crypto';

export class RBACService {
  private readonly cacheExpiryMinutes = 15;

  /**
   * Check if user has permission for a specific resource and action
   * Validates: Requirements 1.3 - Role-based access control with permission verification
   */
  async checkPermission(
    userId: string, 
    resource: string, 
    action: string, 
    context?: Partial<AccessContext>
  ): Promise<boolean> {
    try {
      // Build full access context
      const accessContext: AccessContext = {
        userId,
        activeRole: context?.activeRole || await this.getUserActiveRole(userId),
        organizationId: context?.organizationId,
        resourceId: context?.resourceId,
        resourceType: context?.resourceType,
        additionalContext: context?.additionalContext
      };

      // Check cache first
      const cacheKey = this.generateCacheKey(userId, resource, action, accessContext);
      const cachedResult = await this.getCachedPermission(cacheKey);
      
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Get user's effective permissions
      const permissions = await this.getEffectivePermissions(userId, accessContext);
      
      // Check if any permission grants access to this resource and action
      const hasPermission = permissions.some(permission => {
        return this.matchesPermission(permission, resource, action, accessContext);
      });

      // Cache the result
      await this.cachePermissionResult(cacheKey, hasPermission);

      // Log access attempt for audit
      await this.logAccess(userId, action, resource, accessContext, hasPermission);

      return hasPermission;

    } catch (error) {
      logger.error('Permission check error:', error);
      // Fail secure - deny access on error
      return false;
    }
  }

  /**
   * Get all roles assigned to a user
   * Validates: Requirements 1.2 - Support for all defined roles
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    try {
      const result = await db.query(
        `SELECT r.*, ura.organization_id, ura.assigned_at, ura.expires_at, ura.is_active
         FROM roles r
         JOIN user_role_assignments ura ON r.id = ura.role_id
         WHERE ura.user_id = $1 AND ura.is_active = true
         AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
         ORDER BY r.profession, r.name`,
        [userId]
      );

      return (result as any).rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        profession: row.profession,
        description: row.description,
        permissions: [], // Will be loaded separately if needed
        organizationId: row.organization_id,
        isCustom: row.is_custom,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

    } catch (error) {
      logger.error('Get user roles error:', error);
      return [];
    }
  }

  /**
   * Assign a role to a user
   * Validates: Requirements 1.4 - Multi-role user management
   */
  async assignRole(
    userId: string, 
    roleId: string, 
    context?: OrganizationContext,
    assignedBy?: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      // Verify role exists and is active
      const roleResult = await db.query(
        'SELECT id, profession, organization_id FROM roles WHERE id = $1 AND is_active = true',
        [roleId]
      );

      if (!roleResult || (roleResult as any).rows.length === 0) {
        throw new Error('Role not found or inactive');
      }

      const role = (roleResult as any).rows[0];

      // Check if user already has this role in this context
      const existingAssignment = await db.query(
        `SELECT id FROM user_role_assignments 
         WHERE user_id = $1 AND role_id = $2 AND organization_id = $3 AND is_active = true`,
        [userId, roleId, context?.organizationId]
      );

      if (existingAssignment && (existingAssignment as any).rows.length > 0) {
        throw new Error('User already has this role in this context');
      }

      // Assign role
      await db.query(
        `INSERT INTO user_role_assignments (user_id, role_id, organization_id, assigned_by, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, roleId, context?.organizationId, assignedBy, expiresAt]
      );

      // Invalidate user's permission cache
      await this.invalidateUserCache(userId);

      logger.info(`Role ${roleId} assigned to user ${userId}`);

    } catch (error) {
      logger.error('Assign role error:', error);
      throw new Error('Failed to assign role');
    }
  }

  /**
   * Create a custom role for an organization
   */
  async createCustomRole(
    organizationId: string, 
    roleDefinition: RoleDefinition,
    createdBy: string
  ): Promise<Role> {
    try {
      const result = await db.transaction(async (client) => {
        // Create role
        const roleResult = await client.query(
          `INSERT INTO roles (name, profession, description, organization_id, is_custom)
           VALUES ($1, $2, $3, $4, true)
           RETURNING *`,
          [roleDefinition.name, roleDefinition.profession, roleDefinition.description, organizationId]
        );

        const role = roleResult.rows[0];

        // Create permissions and assign to role
        for (const permDef of roleDefinition.permissions) {
          // Find or create permission
          let permissionId = await this.findOrCreatePermission(client, permDef);
          
          // Assign permission to role
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id, conditions)
             VALUES ($1, $2, $3)`,
            [role.id, permissionId, JSON.stringify(permDef.conditions || {})]
          );
        }

        return role;
      });

      logger.info(`Custom role created: ${roleDefinition.name} for organization ${organizationId}`);

      return {
        id: result.id,
        name: result.name,
        profession: result.profession,
        description: result.description,
        permissions: [], // Will be loaded separately
        organizationId: result.organization_id,
        isCustom: result.is_custom,
        isActive: result.is_active,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };

    } catch (error) {
      logger.error('Create custom role error:', error);
      throw new Error('Failed to create custom role');
    }
  }

  /**
   * Get effective permissions for a user in a given context
   * Validates: Requirements 1.3 - Granular permission system
   */
  async getEffectivePermissions(userId: string, context: AccessContext): Promise<Permission[]> {
    try {
      const result = await db.query(
        `SELECT DISTINCT p.*, rp.conditions as role_conditions
         FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         JOIN user_role_assignments ura ON rp.role_id = ura.role_id
         JOIN roles r ON ura.role_id = r.id
         WHERE ura.user_id = $1 
         AND ura.is_active = true
         AND r.is_active = true
         AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
         AND (r.profession = $2 OR r.profession = 'admin')
         AND (r.organization_id IS NULL OR r.organization_id = $3)
         ORDER BY p.resource, p.scope`,
        [userId, context.activeRole, context.organizationId]
      );

      return (result as any).rows.map((row: any) => ({
        id: row.id,
        resource: row.resource,
        actions: row.actions,
        conditions: row.conditions ? JSON.parse(row.conditions) : undefined,
        scope: row.scope,
        description: row.description
      }));

    } catch (error) {
      logger.error('Get effective permissions error:', error);
      return [];
    }
  }

  /**
   * Switch user's active role
   * Validates: Requirements 1.4 - Multi-role management with active role selection
   */
  async switchActiveRole(userId: string, newRole: Profession, organizationId?: string): Promise<boolean> {
    try {
      // Verify user has this role
      const roleCheck = await db.query(
        `SELECT r.id FROM roles r
         JOIN user_role_assignments ura ON r.id = ura.role_id
         WHERE ura.user_id = $1 AND r.profession = $2 AND ura.is_active = true
         AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
         AND (r.organization_id IS NULL OR r.organization_id = $3)`,
        [userId, newRole, organizationId]
      );

      if (!roleCheck || (roleCheck as any).rows.length === 0) {
        return false;
      }

      // Update user's active role in their session (handled by auth service)
      // Invalidate permission cache
      await this.invalidateUserCache(userId);

      logger.info(`Active role switched for user ${userId} to ${newRole}`);
      return true;

    } catch (error) {
      logger.error('Switch active role error:', error);
      return false;
    }
  }

  /**
   * Initialize default roles and permissions
   */
  async initializeDefaultRoles(): Promise<void> {
    try {
      logger.info('Initializing default RBAC roles and permissions...');

      await db.transaction(async (client) => {
        // Create default permissions for each profession
        for (const [profession, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
          const roleName = `${profession.charAt(0).toUpperCase() + profession.slice(1)} Standard`;
          
          // Get role ID
          const roleResult = await client.query(
            'SELECT id FROM roles WHERE name = $1 AND profession = $2',
            [roleName, profession]
          );

          if (roleResult.rows.length === 0) {
            logger.warn(`Default role not found: ${roleName}`);
            continue;
          }

          const roleId = roleResult.rows[0].id;

          // Create and assign permissions
          for (const permDef of permissions) {
            const permissionId = await this.findOrCreatePermission(client, permDef);
            
            // Assign permission to role if not already assigned
            const existingAssignment = await client.query(
              'SELECT id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
              [roleId, permissionId]
            );

            if (existingAssignment.rows.length === 0) {
              await client.query(
                'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
                [roleId, permissionId]
              );
            }
          }
        }
      });

      logger.info('Default RBAC roles and permissions initialized successfully');

    } catch (error) {
      logger.error('Initialize default roles error:', error);
      throw new Error('Failed to initialize default roles');
    }
  }

  /**
   * Perform detailed permission check with conditions
   */
  async checkPermissionDetailed(
    userId: string,
    resource: string,
    action: string,
    context?: Partial<AccessContext>
  ): Promise<RolePermissionCheck> {
    try {
      const accessContext: AccessContext = {
        userId,
        activeRole: context?.activeRole || await this.getUserActiveRole(userId),
        organizationId: context?.organizationId,
        resourceId: context?.resourceId,
        resourceType: context?.resourceType,
        additionalContext: context?.additionalContext
      };

      const permissions = await this.getEffectivePermissions(userId, accessContext);
      
      for (const permission of permissions) {
        if (this.matchesPermission(permission, resource, action, accessContext)) {
          return {
            hasPermission: true,
            conditions: permission.conditions,
            scope: permission.scope
          };
        }
      }

      return {
        hasPermission: false,
        reason: 'No matching permission found',
        scope: PermissionScope.PERSONAL
      };

    } catch (error) {
      logger.error('Detailed permission check error:', error);
      return {
        hasPermission: false,
        reason: 'Permission check failed',
        scope: PermissionScope.PERSONAL
      };
    }
  }

  // Private helper methods

  private async getUserActiveRole(userId: string): Promise<Profession> {
    try {
      // Get from current session or user profile
      const result = await db.query(
        `SELECT up.profession FROM user_profiles up 
         WHERE up.user_id = $1 AND up.is_primary = true`,
        [userId]
      );

      if (result && (result as any).rows.length > 0) {
        return (result as any).rows[0].profession;
      }

      return Profession.ETUDIANT; // Default fallback
    } catch (error) {
      logger.error('Get user active role error:', error);
      return Profession.ETUDIANT;
    }
  }

  private matchesPermission(
    permission: Permission, 
    resource: string, 
    action: string, 
    context: AccessContext
  ): boolean {
    // Check resource match
    if (permission.resource !== resource) {
      return false;
    }

    // Check action match
    if (!permission.actions.includes(action)) {
      return false;
    }

    // Check scope constraints
    if (!this.checkScopeConstraints(permission, context)) {
      return false;
    }

    // Check additional conditions
    if (permission.conditions && !this.evaluateConditions(permission.conditions, context)) {
      return false;
    }

    return true;
  }

  private checkScopeConstraints(permission: Permission, context: AccessContext): boolean {
    switch (permission.scope) {
      case PermissionScope.GLOBAL:
        return true;
      
      case PermissionScope.ORGANIZATION:
        return !!context.organizationId;
      
      case PermissionScope.PERSONAL:
        return true; // Additional checks would be done in conditions
      
      case PermissionScope.ROLE_SPECIFIC:
        return true; // Role is already verified by the query
      
      default:
        return false;
    }
  }

  private evaluateConditions(conditions: AccessCondition[], context: AccessContext): boolean {
    return conditions.every(condition => {
      const contextValue = this.getContextValue(condition.field, context);
      return this.evaluateCondition(condition, contextValue);
    });
  }

  private getContextValue(field: string, context: AccessContext): any {
    switch (field) {
      case 'userId':
        return context.userId;
      case 'organizationId':
        return context.organizationId;
      case 'resourceId':
        return context.resourceId;
      case 'activeRole':
        return context.activeRole;
      default:
        return context.additionalContext?.[field];
    }
  }

  private evaluateCondition(condition: AccessCondition, value: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value);
      case 'starts_with':
        return typeof value === 'string' && value.startsWith(condition.value);
      case 'ends_with':
        return typeof value === 'string' && value.endsWith(condition.value);
      default:
        return false;
    }
  }

  private async findOrCreatePermission(client: any, permDef: PermissionDefinition): Promise<string> {
    // Try to find existing permission
    const existingResult = await client.query(
      'SELECT id FROM permissions WHERE resource = $1 AND scope = $2 AND actions = $3',
      [permDef.resource, permDef.scope, permDef.actions]
    );

    if (existingResult.rows.length > 0) {
      return existingResult.rows[0].id;
    }

    // Create new permission
    const newResult = await client.query(
      `INSERT INTO permissions (resource, actions, conditions, scope, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        permDef.resource,
        permDef.actions,
        JSON.stringify(permDef.conditions || {}),
        permDef.scope,
        `${permDef.resource} ${permDef.actions.join(', ')} permission`
      ]
    );

    return newResult.rows[0].id;
  }

  private generateCacheKey(userId: string, resource: string, action: string, context: AccessContext): string {
    const contextStr = JSON.stringify({
      activeRole: context.activeRole,
      organizationId: context.organizationId,
      resourceId: context.resourceId,
      resourceType: context.resourceType
    });
    
    return crypto
      .createHash('sha256')
      .update(`${userId}:${resource}:${action}:${contextStr}`)
      .digest('hex');
  }

  private async getCachedPermission(cacheKey: string): Promise<boolean | null> {
    try {
      const result = await db.query(
        'SELECT has_permission FROM access_control_cache WHERE context_hash = $1 AND expires_at > CURRENT_TIMESTAMP',
        [cacheKey]
      );

      if (result && (result as any).rows.length > 0) {
        return (result as any).rows[0].has_permission;
      }

      return null;
    } catch (error) {
      logger.error('Get cached permission error:', error);
      return null;
    }
  }

  private async cachePermissionResult(cacheKey: string, hasPermission: boolean): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + this.cacheExpiryMinutes * 60 * 1000);
      
      await db.query(
        `INSERT INTO access_control_cache (context_hash, has_permission, expires_at, user_id, resource, action)
         VALUES ($1, $2, $3, '', '', '')
         ON CONFLICT (context_hash) DO UPDATE SET
         has_permission = EXCLUDED.has_permission,
         expires_at = EXCLUDED.expires_at,
         cached_at = CURRENT_TIMESTAMP`,
        [cacheKey, hasPermission, expiresAt]
      );
    } catch (error) {
      logger.error('Cache permission result error:', error);
      // Non-critical error, continue without caching
    }
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    try {
      await db.query(
        'DELETE FROM access_control_cache WHERE user_id = $1',
        [userId]
      );
    } catch (error) {
      logger.error('Invalidate user cache error:', error);
    }
  }

  private async logAccess(
    userId: string,
    action: string,
    resource: string,
    context: AccessContext,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO audit_log (user_id, action, resource_type, resource_id, organization_id, success, error_message, additional_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          action,
          resource,
          context.resourceId,
          context.organizationId,
          success,
          errorMessage,
          JSON.stringify({
            activeRole: context.activeRole,
            resourceType: context.resourceType,
            additionalContext: context.additionalContext
          })
        ]
      );
    } catch (error) {
      logger.error('Log access error:', error);
      // Non-critical error, continue without logging
    }
  }

  /**
   * Clean expired cache entries and audit logs
   */
  async cleanupExpiredData(): Promise<void> {
    try {
      // Clean expired cache
      const cacheResult = await db.query(
        'DELETE FROM access_control_cache WHERE expires_at < CURRENT_TIMESTAMP'
      );

      // Clean old audit logs (keep for 1 year)
      const auditResult = await db.query(
        'DELETE FROM audit_log WHERE created_at < CURRENT_TIMESTAMP - INTERVAL \'1 year\''
      );

      const cacheDeleted = (cacheResult as any).rowCount || 0;
      const auditDeleted = (auditResult as any).rowCount || 0;

      if (cacheDeleted > 0 || auditDeleted > 0) {
        logger.info(`Cleaned up ${cacheDeleted} cache entries and ${auditDeleted} audit logs`);
      }
    } catch (error) {
      logger.error('Cleanup expired data error:', error);
    }
  }
}

export const rbacService = new RBACService();