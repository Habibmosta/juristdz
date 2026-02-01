import express from 'express';
import { rbacService } from '@/services/rbacService';
import { authenticate as requireAuth } from '@/middleware/auth';
import { requirePermission, requireRole } from '@/middleware/rbacMiddleware';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types/auth';
import { ResourceType, ActionType } from '@/types/rbac';

const router = express.Router();

/**
 * Get user's roles
 * GET /api/rbac/user/roles
 */
router.get('/user/roles', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const roles = await rbacService.getUserRoles(req.user!.userId);
    
    res.json({
      success: true,
      data: {
        roles
      }
    });

  } catch (error) {
    logger.error('Get user roles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user roles'
    });
  }
});

/**
 * Switch active role
 * POST /api/rbac/user/switch-role
 */
router.post('/user/switch-role', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { newRole, organizationId } = req.body;

    if (!newRole) {
      return res.status(400).json({
        success: false,
        error: 'New role is required'
      });
    }

    const success = await rbacService.switchActiveRole(
      req.user!.userId,
      newRole,
      organizationId
    );

    if (!success) {
      return res.status(403).json({
        success: false,
        error: 'Cannot switch to this role'
      });
    }

    res.json({
      success: true,
      message: 'Role switched successfully'
    });

  } catch (error) {
    logger.error('Switch role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to switch role'
    });
  }
});

/**
 * Check permission
 * POST /api/rbac/check-permission
 */
router.post('/check-permission', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { resource, action, context } = req.body;

    if (!resource || !action) {
      return res.status(400).json({
        success: false,
        error: 'Resource and action are required'
      });
    }

    const result = await rbacService.checkPermissionDetailed(
      req.user!.userId,
      resource,
      action,
      context
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Check permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check permission'
    });
  }
});

/**
 * Get effective permissions
 * GET /api/rbac/user/permissions
 */
router.get('/user/permissions', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    
    const context = {
      userId: req.user!.userId,
      activeRole: req.user!.activeRole,
      organizationId
    };

    const permissions = await rbacService.getEffectivePermissions(req.user!.userId, context);

    res.json({
      success: true,
      data: {
        permissions,
        context
      }
    });

  } catch (error) {
    logger.error('Get effective permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get permissions'
    });
  }
});

// Admin-only routes for role management

/**
 * Create custom role
 * POST /api/rbac/admin/roles
 */
router.post('/admin/roles', 
  requireAuth,
  requirePermission(ResourceType.ROLE, ActionType.CREATE),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { organizationId, roleDefinition } = req.body;

      if (!organizationId || !roleDefinition) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID and role definition are required'
        });
      }

      const role = await rbacService.createCustomRole(
        organizationId,
        roleDefinition,
        req.user!.userId
      );

      res.status(201).json({
        success: true,
        data: {
          role
        }
      });

    } catch (error) {
      logger.error('Create custom role error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create custom role'
      });
    }
  }
);

/**
 * Assign role to user
 * POST /api/rbac/admin/assign-role
 */
router.post('/admin/assign-role',
  requireAuth,
  requirePermission(ResourceType.USER, ActionType.ASSIGN),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, roleId, organizationId, expiresAt } = req.body;

      if (!userId || !roleId) {
        return res.status(400).json({
          success: false,
          error: 'User ID and role ID are required'
        });
      }

      await rbacService.assignRole(
        userId,
        roleId,
        organizationId ? { organizationId, organizationType: 'organization' } : undefined,
        req.user!.userId,
        expiresAt ? new Date(expiresAt) : undefined
      );

      res.json({
        success: true,
        message: 'Role assigned successfully'
      });

    } catch (error) {
      logger.error('Assign role error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign role'
      });
    }
  }
);

/**
 * Get all roles (admin only)
 * GET /api/rbac/admin/roles
 */
router.get('/admin/roles',
  requireAuth,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { organizationId, profession } = req.query;

      // This would need to be implemented in the RBAC service
      // For now, return a placeholder response
      res.json({
        success: true,
        data: {
          roles: [],
          message: 'Role listing not yet implemented'
        }
      });

    } catch (error) {
      logger.error('Get all roles error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get roles'
      });
    }
  }
);

/**
 * Initialize default roles (admin only)
 * POST /api/rbac/admin/initialize
 */
router.post('/admin/initialize',
  requireAuth,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res) => {
    try {
      await rbacService.initializeDefaultRoles();

      res.json({
        success: true,
        message: 'Default roles initialized successfully'
      });

    } catch (error) {
      logger.error('Initialize default roles error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initialize default roles'
      });
    }
  }
);

/**
 * Get audit logs (admin only)
 * GET /api/rbac/admin/audit
 */
router.get('/admin/audit',
  requireAuth,
  requirePermission(ResourceType.AUDIT, ActionType.READ),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { 
        userId, 
        resource, 
        action, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 50 
      } = req.query;

      // This would need to be implemented in the RBAC service
      // For now, return a placeholder response
      res.json({
        success: true,
        data: {
          auditLogs: [],
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 0
          },
          message: 'Audit log retrieval not yet implemented'
        }
      });

    } catch (error) {
      logger.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get audit logs'
      });
    }
  }
);

export default router;