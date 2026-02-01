/**
 * RBAC Integration Examples
 * 
 * This file demonstrates how to integrate the RBAC system with existing routes
 * and services in the JuristDZ platform.
 */

import express from 'express';
import { authenticate } from '@/middleware/auth';
import { requirePermission, requireRole, checkPermissionInHandler } from '@/middleware/rbacMiddleware';
import { ResourceType, ActionType } from '@/types/rbac';
import { AuthenticatedRequest } from '@/types/auth';

const router = express.Router();

/**
 * Example 1: Document Management with RBAC
 * Only users with document creation permissions can create documents
 */
router.post('/documents', 
  authenticate,
  requirePermission(ResourceType.DOCUMENT, ActionType.CREATE),
  async (req: AuthenticatedRequest, res) => {
    try {
      // User has been verified to have document creation permissions
      // Implement document creation logic here
      
      res.json({
        success: true,
        message: 'Document created successfully',
        userId: req.user!.userId,
        activeRole: req.user!.activeRole
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create document'
      });
    }
  }
);

/**
 * Example 2: Client Management for Lawyers
 * Only lawyers (avocats) can manage clients
 */
router.get('/clients',
  authenticate,
  requireRole('avocat'),
  requirePermission(ResourceType.CLIENT, ActionType.READ),
  async (req: AuthenticatedRequest, res) => {
    try {
      // Only lawyers with client read permissions can access this
      
      res.json({
        success: true,
        clients: [], // Would fetch from database
        userRole: req.user!.activeRole
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch clients'
      });
    }
  }
);

/**
 * Example 3: Notary Minutier Access
 * Only notaries can access the electronic minutier
 */
router.get('/minutier',
  authenticate,
  requireRole('notaire'),
  requirePermission(ResourceType.MINUTIER, ActionType.READ),
  async (req: AuthenticatedRequest, res) => {
    try {
      // Only notaries with minutier access can view this
      
      res.json({
        success: true,
        minutier: [], // Would fetch notary's minutier
        message: 'Minutier électronique accessible'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to access minutier'
      });
    }
  }
);

/**
 * Example 4: Admin User Management
 * Only administrators can manage users
 */
router.post('/admin/users',
  authenticate,
  requireRole('admin'),
  requirePermission(ResourceType.USER, ActionType.CREATE),
  async (req: AuthenticatedRequest, res) => {
    try {
      // Only admins can create users
      
      res.json({
        success: true,
        message: 'User created by administrator',
        adminId: req.user!.userId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
    }
  }
);

/**
 * Example 5: Dynamic Permission Checking
 * Check permissions dynamically within route handler
 */
router.get('/documents/:id',
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const documentId = req.params.id;
      
      // Check if user can read this specific document
      const canRead = await checkPermissionInHandler(
        req,
        ResourceType.DOCUMENT,
        ActionType.READ,
        { resourceId: documentId }
      );
      
      if (!canRead) {
        return res.status(403).json({
          success: false,
          error: 'Cannot access this document'
        });
      }
      
      // Additional check for sensitive documents
      const canReadSensitive = await checkPermissionInHandler(
        req,
        ResourceType.DOCUMENT,
        ActionType.READ,
        { 
          resourceId: documentId,
          additionalContext: { documentType: 'confidential' }
        }
      );
      
      res.json({
        success: true,
        document: {
          id: documentId,
          // Would include document data
        },
        permissions: {
          canRead: true,
          canReadSensitive
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch document'
      });
    }
  }
);

/**
 * Example 6: Multi-Role Context
 * Handle users with multiple roles
 */
router.get('/dashboard',
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const activeRole = req.user!.activeRole;
      
      // Get role-specific dashboard data
      let dashboardData: any = {
        role: activeRole,
        features: []
      };
      
      // Check various permissions to determine available features
      const permissions = [
        { resource: ResourceType.DOCUMENT, action: ActionType.CREATE, feature: 'document_creation' },
        { resource: ResourceType.CLIENT, action: ActionType.READ, feature: 'client_management' },
        { resource: ResourceType.MINUTIER, action: ActionType.READ, feature: 'minutier_access' },
        { resource: ResourceType.JURISPRUDENCE, action: ActionType.SEARCH, feature: 'legal_research' },
        { resource: ResourceType.INVOICE, action: ActionType.CREATE, feature: 'billing' },
        { resource: ResourceType.USER, action: ActionType.READ, feature: 'user_management' }
      ];
      
      for (const perm of permissions) {
        const hasPermission = await checkPermissionInHandler(
          req,
          perm.resource,
          perm.action
        );
        
        if (hasPermission) {
          dashboardData.features.push(perm.feature);
        }
      }
      
      res.json({
        success: true,
        dashboard: dashboardData
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to load dashboard'
      });
    }
  }
);

/**
 * Example 7: Organization-Scoped Permissions
 * Access control based on organization membership
 */
router.get('/organization/:orgId/reports',
  authenticate,
  requirePermission(ResourceType.REPORT, ActionType.READ, {
    getContext: (req) => ({
      organizationId: req.params.orgId
    })
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const organizationId = req.params.orgId;
      
      // User has been verified to have report access in this organization
      
      res.json({
        success: true,
        reports: [], // Would fetch organization reports
        organizationId,
        userRole: req.user!.activeRole
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch organization reports'
      });
    }
  }
);

export default router;

/**
 * Usage Examples in Service Layer
 */

export class DocumentService {
  /**
   * Example of checking permissions in service methods
   */
  async createDocument(userId: string, documentData: any, activeRole: string) {
    // Import RBAC service
    const { rbacService } = await import('@/services/rbacService');
    
    // Check permission before creating document
    const canCreate = await rbacService.checkPermission(
      userId,
      ResourceType.DOCUMENT,
      ActionType.CREATE,
      { activeRole: activeRole as any }
    );
    
    if (!canCreate) {
      throw new Error('Insufficient permissions to create document');
    }
    
    // Proceed with document creation
    // ... implementation
    
    return {
      success: true,
      documentId: 'doc-123'
    };
  }
  
  /**
   * Example of role-specific document templates
   */
  async getAvailableTemplates(userId: string, activeRole: string) {
    const { rbacService } = await import('@/services/rbacService');
    
    // Get user's effective permissions
    const permissions = await rbacService.getEffectivePermissions(userId, {
      userId,
      activeRole: activeRole as any
    });
    
    // Filter templates based on permissions
    const availableTemplates = [];
    
    // Check template access for different document types
    const templateTypes = [
      { type: 'requete', resource: ResourceType.DOCUMENT },
      { type: 'acte_authentique', resource: ResourceType.ACTE_AUTHENTIQUE },
      { type: 'exploit', resource: ResourceType.DOCUMENT }
    ];
    
    for (const template of templateTypes) {
      const hasAccess = permissions.some(perm => 
        perm.resource === template.resource && 
        perm.actions.includes(ActionType.CREATE)
      );
      
      if (hasAccess) {
        availableTemplates.push(template.type);
      }
    }
    
    return availableTemplates;
  }
}

/**
 * Integration with Authentication Service
 */
export class AuthIntegrationExample {
  /**
   * Example of role switching with RBAC validation
   */
  async switchUserRole(userId: string, newRole: string, sessionId: string) {
    const { rbacService } = await import('@/services/rbacService');
    const { authService } = await import('@/services/authService');
    
    // Validate role switch with RBAC
    const canSwitch = await rbacService.switchActiveRole(userId, newRole as any);
    
    if (!canSwitch) {
      throw new Error('Cannot switch to this role');
    }
    
    // Update session with new active role
    const success = await authService.switchRole(userId, sessionId, newRole);
    
    if (!success) {
      throw new Error('Failed to update session');
    }
    
    return {
      success: true,
      newActiveRole: newRole
    };
  }
}