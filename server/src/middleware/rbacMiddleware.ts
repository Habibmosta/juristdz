import { Request, Response, NextFunction } from 'express';
import { rbacService } from '@/services/rbacService';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types/auth';
import { AccessContext, Permission } from '@/types/rbac';

/**
 * RBAC middleware factory for protecting routes with specific permissions
 * Validates: Requirements 1.3 - Role-based access control with permission verification
 */
export function requirePermission(resource: string, action: string, options?: {
  getContext?: (req: AuthenticatedRequest) => Partial<AccessContext>;
  onDenied?: (req: AuthenticatedRequest, res: Response) => void;
}) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Build access context
      const baseContext: Partial<AccessContext> = {
        activeRole: req.user.activeRole,
        organizationId: req.headers['x-organization-id'] as string,
        resourceId: req.params.id || req.body.id,
        resourceType: resource
      };

      // Merge with custom context if provided
      const context = options?.getContext ? 
        { ...baseContext, ...options.getContext(req) } : 
        baseContext;

      // Check permission
      const hasPermission = await rbacService.checkPermission(
        req.user.userId,
        resource,
        action,
        context
      );

      if (!hasPermission) {
        logger.warn(`Access denied for user ${req.user.userId} to ${resource}:${action}`, {
          userId: req.user.userId,
          resource,
          action,
          context
        });

        if (options?.onDenied) {
          return options.onDenied(req, res);
        }

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: {
            resource,
            action
          }
        });
      }

      // Add permission context to request for use in handlers
      req.permissionContext = context as AccessContext;
      next();

    } catch (error) {
      logger.error('RBAC middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
}

/**
 * Middleware to require specific role
 * Validates: Requirements 1.2 - Support for all defined roles
 */
export function requireRole(allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.activeRole)) {
      logger.warn(`Role access denied for user ${req.user.userId}`, {
        userId: req.user.userId,
        activeRole: req.user.activeRole,
        requiredRoles: roles
      });

      return res.status(403).json({
        success: false,
        error: 'Insufficient role permissions',
        required: {
          roles: roles
        },
        current: {
          role: req.user.activeRole
        }
      });
    }

    next();
  };
}

/**
 * Middleware to check if user belongs to specific organization
 */
export function requireOrganization(getOrganizationId?: (req: AuthenticatedRequest) => string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const requiredOrgId = getOrganizationId ? 
        getOrganizationId(req) : 
        req.headers['x-organization-id'] as string;

      if (!requiredOrgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization context required'
        });
      }

      // Check if user has any role in this organization
      const userRoles = await rbacService.getUserRoles(req.user.userId);
      const hasOrgAccess = userRoles.some(role => 
        role.organizationId === requiredOrgId || !role.organizationId // Global roles
      );

      if (!hasOrgAccess) {
        logger.warn(`Organization access denied for user ${req.user.userId}`, {
          userId: req.user.userId,
          requiredOrganization: requiredOrgId
        });

        return res.status(403).json({
          success: false,
          error: 'Access denied to organization'
        });
      }

      next();

    } catch (error) {
      logger.error('Organization middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Organization check failed'
      });
    }
  };
}

/**
 * Middleware to add user's permissions to request context
 */
export function addPermissionsContext() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next();
      }

      const context: AccessContext = {
        userId: req.user.userId,
        activeRole: req.user.activeRole,
        organizationId: req.headers['x-organization-id'] as string
      };

      // Get user's effective permissions
      const permissions = await rbacService.getEffectivePermissions(req.user.userId, context);
      
      // Add to request context
      req.userPermissions = permissions;
      req.permissionContext = context;

      next();

    } catch (error) {
      logger.error('Add permissions context error:', error);
      // Continue without permissions context
      next();
    }
  };
}

/**
 * Helper function to check permission in route handlers
 */
export async function checkPermissionInHandler(
  req: AuthenticatedRequest,
  resource: string,
  action: string,
  context?: Partial<AccessContext>
): Promise<boolean> {
  if (!req.user) {
    return false;
  }

  const fullContext = {
    ...req.permissionContext,
    ...context
  };

  return rbacService.checkPermission(
    req.user.userId,
    resource,
    action,
    fullContext
  );
}

// Extend the AuthenticatedRequest interface
declare module '@/types/auth' {
  interface AuthenticatedRequest {
    permissionContext?: AccessContext;
    userPermissions?: Permission[];
  }
}

// Re-export for convenience
export { rbacService };

// Default export for backward compatibility
export const rbacMiddleware = requirePermission;
export const checkPermission = requirePermission;