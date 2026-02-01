import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { RBACService } from '../services/rbacService';
import { Profession } from '../types/auth';
import { ResourceType, ActionType, PermissionScope } from '../types/rbac';

// Mock database connection for testing
jest.mock('../database/connection', () => ({
  db: {
    query: jest.fn(),
    transaction: jest.fn()
  }
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('RBAC Service', () => {
  let rbacService: RBACService;
  let mockDb: any;

  beforeAll(() => {
    rbacService = new RBACService();
    mockDb = require('../database/connection').db;
  });

  beforeEach(() => {
    // Clear all mocks before each test
    mockDb.query.mockClear();
    mockDb.transaction.mockClear();
  });

  describe('Permission Checking', () => {
    test('should deny access when user has no permissions', async () => {
      // Mock database to return no permissions
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // getUserActiveRole
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // getEffectivePermissions

      const hasPermission = await rbacService.checkPermission(
        'user-123',
        ResourceType.DOCUMENT,
        ActionType.CREATE
      );

      expect(hasPermission).toBe(false);
    });

    test('should grant access when user has matching permission', async () => {
      // Mock cache check (no cached result)
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock getUserActiveRole
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ profession: Profession.AVOCAT }] 
      });
      
      // Mock getEffectivePermissions - actions should be an array
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{
          id: 'perm-1',
          resource: ResourceType.DOCUMENT,
          actions: [ActionType.CREATE, ActionType.READ], // Array, not JSON string
          conditions: null,
          scope: PermissionScope.PERSONAL,
          description: 'Document management'
        }]
      });

      // Mock cache result storage
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock audit log
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const hasPermission = await rbacService.checkPermission(
        'user-123',
        ResourceType.DOCUMENT,
        ActionType.CREATE
      );

      expect(hasPermission).toBe(true);
    });
  });

  describe('Role Management', () => {
    test('should return empty array when user has no roles', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const roles = await rbacService.getUserRoles('user-123');

      expect(roles).toEqual([]);
    });

    test('should return user roles when they exist', async () => {
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{
          id: 'role-1',
          name: 'Avocat Standard',
          profession: Profession.AVOCAT,
          description: 'Standard lawyer role',
          organization_id: null,
          is_custom: false,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const roles = await rbacService.getUserRoles('user-123');

      expect(roles).toHaveLength(1);
      expect(roles[0].profession).toBe(Profession.AVOCAT);
      expect(roles[0].name).toBe('Avocat Standard');
    });
  });

  describe('Role Switching', () => {
    test('should allow switching to valid role', async () => {
      // Mock role verification query
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ id: 'role-1' }] 
      });

      const success = await rbacService.switchActiveRole(
        'user-123',
        Profession.AVOCAT
      );

      expect(success).toBe(true);
    });

    test('should deny switching to invalid role', async () => {
      // Mock role verification query returning no results
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const success = await rbacService.switchActiveRole(
        'user-123',
        Profession.ADMIN
      );

      expect(success).toBe(false);
    });
  });
});

/**
 * Property-based tests for RBAC system
 * Validates: Requirements 1.2, 1.3, 1.4 - Role support, access control, multi-role management
 */
describe('RBAC Property Tests', () => {
  let mockDb: any;

  beforeAll(() => {
    mockDb = require('../database/connection').db;
  });

  beforeEach(() => {
    mockDb.query.mockClear();
  });

  test('Property 2: Support Complet des Rôles - System should recognize all defined roles', () => {
    const allProfessions = Object.values(Profession);
    
    // Verify all professions are supported in the system
    allProfessions.forEach(profession => {
      expect(typeof profession).toBe('string');
      expect(profession.length).toBeGreaterThan(0);
    });

    // Verify we have the expected roles
    expect(allProfessions).toContain(Profession.AVOCAT);
    expect(allProfessions).toContain(Profession.NOTAIRE);
    expect(allProfessions).toContain(Profession.HUISSIER);
    expect(allProfessions).toContain(Profession.MAGISTRAT);
    expect(allProfessions).toContain(Profession.ETUDIANT);
    expect(allProfessions).toContain(Profession.JURISTE_ENTREPRISE);
    expect(allProfessions).toContain(Profession.ADMIN);
  });

  test('Property 3: Contrôle d\'Accès Basé sur les Rôles - Access should be granted iff user has required permissions', async () => {
    const rbacService = new RBACService();

    // Test case 1: User with permission should get access
    // Mock cache check (no cached result)
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    // Mock getUserActiveRole
    mockDb.query.mockResolvedValueOnce({ rows: [{ profession: Profession.AVOCAT }] });
    // Mock getEffectivePermissions - actions should be an array
    mockDb.query.mockResolvedValueOnce({ 
      rows: [{
        resource: ResourceType.DOCUMENT,
        actions: [ActionType.READ], // Array, not JSON string
        scope: PermissionScope.PERSONAL
      }]
    });
    // Mock cache result storage
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    // Mock audit log
    mockDb.query.mockResolvedValueOnce({ rows: [] });

    const hasPermission1 = await rbacService.checkPermission(
      'user-1',
      ResourceType.DOCUMENT,
      ActionType.READ
    );
    expect(hasPermission1).toBe(true);

    // Test case 2: User without permission should be denied
    // Mock cache check (no cached result)
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    // Mock getUserActiveRole
    mockDb.query.mockResolvedValueOnce({ rows: [{ profession: Profession.ETUDIANT }] });
    // Mock getEffectivePermissions (empty - no permissions)
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    // Mock cache result storage
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    // Mock audit log
    mockDb.query.mockResolvedValueOnce({ rows: [] });

    const hasPermission2 = await rbacService.checkPermission(
      'user-2',
      ResourceType.ADMIN,
      ActionType.DELETE
    );
    expect(hasPermission2).toBe(false);
  });

  test('Property 4: Gestion des Rôles Multiples - System should allow role selection for multi-role users', async () => {
    const rbacService = new RBACService();

    // Mock user with multiple roles
    mockDb.query.mockResolvedValueOnce({ 
      rows: [
        { 
          id: 'role-1', 
          profession: Profession.AVOCAT,
          name: 'Avocat Standard'
        },
        { 
          id: 'role-2', 
          profession: Profession.NOTAIRE,
          name: 'Notaire Standard'
        }
      ]
    });

    const roles = await rbacService.getUserRoles('multi-role-user');
    
    // User should have multiple roles
    expect(roles.length).toBeGreaterThan(1);
    
    // Should be able to switch between roles
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'role-2' }] });
    const switchSuccess = await rbacService.switchActiveRole(
      'multi-role-user',
      Profession.NOTAIRE
    );
    expect(switchSuccess).toBe(true);
  });
});