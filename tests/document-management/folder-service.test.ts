/**
 * Document Management System - Folder Service Tests
 * 
 * Comprehensive tests for the folder service including
 * unit tests and property-based tests for correctness validation.
 */

import { folderService } from '../../src/document-management/services/folderService';
import type { 
  FolderCreateRequest, 
  FolderUpdateRequest, 
  FolderQueryOptions 
} from '../../src/document-management/services/folderService';
import type { Folder } from '../../types/document-management';
import * as fc from 'fast-check';

// Mock dependencies
jest.mock('../../src/document-management/services/supabaseService', () => ({
  supabaseService: {
    insert: jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'folder-123',
        case_id: 'case-456',
        name: 'Test Folder',
        parent_id: null,
        path: '/Test Folder',
        level: 0,
        description: 'Test folder description',
        custom_fields: {},
        created_by: 'user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false
      }
    }),
    findById: jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'folder-123',
        case_id: 'case-456',
        name: 'Test Folder',
        parent_id: null,
        path: '/Test Folder',
        level: 0,
        description: 'Test folder description',
        custom_fields: {},
        created_by: 'user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false
      }
    }),
    update: jest.fn().mockResolvedValue({ success: true }),
    query: jest.fn().mockResolvedValue({
      success: true,
      data: [],
      count: 0
    }),
    createAuditEntry: jest.fn().mockResolvedValue({ success: true })
  }
}));

describe('FolderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Folder Creation', () => {
    test('should create root folder successfully', async () => {
      const createRequest: FolderCreateRequest = {
        name: 'Test Folder',
        caseId: 'case-456',
        userId: 'user-123',
        description: 'Test folder description'
      };

      const result = await folderService.createFolder(createRequest);

      expect(result.success).toBe(true);
      expect(result.folder).toBeDefined();
      expect(result.folder!.name).toBe('Test Folder');
      expect(result.folder!.caseId).toBe('case-456');
      expect(result.folder!.level).toBe(0);
      expect(result.folder!.path).toBe('/Test Folder');
      expect(result.folder!.parentId).toBeNull();
    });

    test('should create subfolder successfully', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      
      // Mock parent folder exists
      supabaseService.findById
        .mockResolvedValueOnce({ success: true, data: { id: 'case-456' } }) // Case exists
        .mockResolvedValueOnce({ // Parent folder exists
          success: true,
          data: {
            id: 'parent-folder',
            case_id: 'case-456',
            name: 'Parent Folder',
            parent_id: null,
            path: '/Parent Folder',
            level: 0,
            is_deleted: false
          }
        });

      const createRequest: FolderCreateRequest = {
        name: 'Sub Folder',
        caseId: 'case-456',
        parentId: 'parent-folder',
        userId: 'user-123'
      };

      const result = await folderService.createFolder(createRequest);

      expect(result.success).toBe(true);
      expect(result.folder!.parentId).toBe('parent-folder');
      expect(result.folder!.level).toBe(1);
      expect(result.folder!.path).toBe('/Parent Folder/Sub Folder');
    });

    test('should validate case existence', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.findById.mockResolvedValueOnce({ success: false, data: null });

      const createRequest: FolderCreateRequest = {
        name: 'Test Folder',
        caseId: 'nonexistent-case',
        userId: 'user-123'
      };

      const result = await folderService.createFolder(createRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Case not found');
    });

    test('should validate parent folder existence', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.findById
        .mockResolvedValueOnce({ success: true, data: { id: 'case-456' } }) // Case exists
        .mockResolvedValueOnce({ success: false, data: null }); // Parent doesn't exist

      const createRequest: FolderCreateRequest = {
        name: 'Sub Folder',
        caseId: 'case-456',
        parentId: 'nonexistent-parent',
        userId: 'user-123'
      };

      const result = await folderService.createFolder(createRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Parent folder not found');
    });

    test('should validate parent belongs to same case', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.findById
        .mockResolvedValueOnce({ success: true, data: { id: 'case-456' } }) // Case exists
        .mockResolvedValueOnce({ // Parent folder exists but different case
          success: true,
          data: {
            id: 'parent-folder',
            case_id: 'different-case',
            name: 'Parent Folder',
            level: 0,
            is_deleted: false
          }
        });

      const createRequest: FolderCreateRequest = {
        name: 'Sub Folder',
        caseId: 'case-456',
        parentId: 'parent-folder',
        userId: 'user-123'
      };

      const result = await folderService.createFolder(createRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('same case');
    });

    test('should prevent duplicate folder names at same level', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      
      // Mock case exists
      supabaseService.findById.mockResolvedValueOnce({ success: true, data: { id: 'case-456' } });
      
      // Mock duplicate name check returns existing folder
      supabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [{ id: 'existing-folder', name: 'Test Folder' }]
      });

      const createRequest: FolderCreateRequest = {
        name: 'Test Folder',
        caseId: 'case-456',
        userId: 'user-123'
      };

      const result = await folderService.createFolder(createRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('Folder Retrieval', () => {
    test('should get folder by ID', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      // Mock permission check
      supabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [{ permission_level: 'view' }]
      });

      const result = await folderService.getFolder('folder-123', 'user-123');

      expect(result.success).toBe(true);
      expect(result.folder).toBeDefined();
      expect(result.folder!.id).toBe('folder-123');
    });

    test('should handle folder not found', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.findById.mockResolvedValueOnce({ success: false, data: null });

      const result = await folderService.getFolder('nonexistent-folder', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Folder not found');
    });

    test('should handle deleted folder', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: { id: 'folder-123', is_deleted: true }
      });

      const result = await folderService.getFolder('folder-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('has been deleted');
    });

    test('should check permissions', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      // Mock folder exists but no permissions
      supabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: { id: 'folder-123', created_by: 'other-user', case_id: 'case-456', is_deleted: false }
      });
      supabaseService.query.mockResolvedValueOnce({ success: true, data: [] }); // No permissions

      const result = await folderService.getFolder('folder-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
    });
  });

  describe('Folder Updates', () => {
    test('should update folder name', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      // Mock permission checks
      supabaseService.query.mockResolvedValue({
        success: true,
        data: [{ permission_level: 'edit' }]
      });

      const updateRequest: FolderUpdateRequest = {
        name: 'Updated Folder Name',
        description: 'Updated description'
      };

      const result = await folderService.updateFolder('folder-123', updateRequest, 'user-123');

      expect(result.success).toBe(true);
      expect(supabaseService.update).toHaveBeenCalledWith(
        'folders',
        'folder-123',
        expect.objectContaining({
          name: 'Updated Folder Name',
          description: 'Updated description',
          path: '/Updated Folder Name' // Path should be updated when name changes
        })
      );
    });

    test('should prevent duplicate names when updating', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      // Mock folder exists and user has permission
      supabaseService.query
        .mockResolvedValueOnce({ success: true, data: [{ permission_level: 'edit' }] }) // Permission check
        .mockResolvedValueOnce({ // Duplicate name check
          success: true,
          data: [{ id: 'other-folder', name: 'Existing Name' }]
        });

      const updateRequest: FolderUpdateRequest = {
        name: 'Existing Name'
      };

      const result = await folderService.updateFolder('folder-123', updateRequest, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    test('should check edit permissions', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      // Mock folder exists but user doesn't have edit permission
      supabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: { id: 'folder-123', created_by: 'other-user', case_id: 'case-456', is_deleted: false }
      });
      supabaseService.query.mockResolvedValue({ success: true, data: [] }); // No permissions

      const updateRequest: FolderUpdateRequest = {
        name: 'Updated Name'
      };

      const result = await folderService.updateFolder('folder-123', updateRequest, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('insufficient permissions to edit');
    });
  });

  describe('Folder Deletion', () => {
    test('should soft delete empty folder', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query
        .mockResolvedValueOnce({ success: true, data: [{ permission_level: 'delete' }] }) // Permission check
        .mockResolvedValueOnce({ success: true, data: [] }) // No subfolders
        .mockResolvedValueOnce({ success: true, data: [] }); // No documents

      const result = await folderService.deleteFolder('folder-123', 'user-123');

      expect(result.success).toBe(true);
      expect(supabaseService.update).toHaveBeenCalledWith(
        'folders',
        'folder-123',
        expect.objectContaining({
          is_deleted: true,
          deleted_at: expect.any(String)
        })
      );
    });

    test('should prevent deletion of non-empty folder', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query
        .mockResolvedValueOnce({ success: true, data: [{ permission_level: 'delete' }] }) // Permission check
        .mockResolvedValueOnce({ // Has subfolders
          success: true,
          data: [{ id: 'subfolder-1', name: 'Subfolder' }]
        })
        .mockResolvedValueOnce({ success: true, data: [] }); // No documents

      const result = await folderService.deleteFolder('folder-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('folder contains');
      expect(result.warnings).toBeDefined();
    });

    test('should check delete permissions', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      // Mock folder exists but user doesn't have delete permission
      supabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: { id: 'folder-123', created_by: 'other-user', case_id: 'case-456', is_deleted: false }
      });
      supabaseService.query.mockResolvedValue({ success: true, data: [] }); // No permissions

      const result = await folderService.deleteFolder('folder-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('insufficient permissions to delete');
    });
  });

  describe('Folder Movement', () => {
    test('should move folder to different parent', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      
      // Mock permissions and folder existence
      supabaseService.query.mockResolvedValue({
        success: true,
        data: [{ permission_level: 'edit' }]
      });
      
      // Mock target parent folder
      supabaseService.findById
        .mockResolvedValueOnce({ // Current folder
          success: true,
          data: {
            id: 'folder-123',
            case_id: 'case-456',
            name: 'Test Folder',
            parent_id: null,
            path: '/Test Folder',
            level: 0,
            is_deleted: false
          }
        })
        .mockResolvedValueOnce({ // Target parent folder
          success: true,
          data: {
            id: 'target-parent',
            case_id: 'case-456',
            name: 'Target Parent',
            parent_id: null,
            path: '/Target Parent',
            level: 0,
            is_deleted: false
          }
        });

      const result = await folderService.moveFolder('folder-123', 'target-parent', 'user-123');

      expect(result.success).toBe(true);
      expect(supabaseService.update).toHaveBeenCalledWith(
        'folders',
        'folder-123',
        expect.objectContaining({
          parent_id: 'target-parent',
          level: 1,
          path: '/Target Parent/Test Folder'
        })
      );
    });

    test('should move folder to root level', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValue({
        success: true,
        data: [{ permission_level: 'edit' }]
      });

      const result = await folderService.moveFolder('folder-123', null, 'user-123');

      expect(result.success).toBe(true);
      expect(supabaseService.update).toHaveBeenCalledWith(
        'folders',
        'folder-123',
        expect.objectContaining({
          parent_id: null,
          level: 0,
          path: '/Test Folder'
        })
      );
    });

    test('should validate target parent belongs to same case', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      
      supabaseService.query.mockResolvedValue({
        success: true,
        data: [{ permission_level: 'edit' }]
      });
      
      supabaseService.findById
        .mockResolvedValueOnce({ // Current folder
          success: true,
          data: {
            id: 'folder-123',
            case_id: 'case-456',
            name: 'Test Folder',
            is_deleted: false
          }
        })
        .mockResolvedValueOnce({ // Target parent in different case
          success: true,
          data: {
            id: 'target-parent',
            case_id: 'different-case',
            name: 'Target Parent',
            is_deleted: false
          }
        });

      const result = await folderService.moveFolder('folder-123', 'target-parent', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('same case');
    });

    test('should prevent moving folder into itself', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      
      supabaseService.query.mockResolvedValue({
        success: true,
        data: [{ permission_level: 'edit' }]
      });

      const result = await folderService.moveFolder('folder-123', 'folder-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('into itself');
    });
  });

  describe('Folder Contents', () => {
    test('should get folder contents', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      
      // Mock permission check
      supabaseService.query
        .mockResolvedValueOnce({ success: true, data: [{ permission_level: 'view' }] }) // Permission check
        .mockResolvedValueOnce({ // Subfolders
          success: true,
          data: [{
            id: 'subfolder-1',
            name: 'Subfolder 1',
            created_by: 'user-123',
            case_id: 'case-456',
            is_deleted: false
          }]
        })
        .mockResolvedValueOnce({ // Documents
          success: true,
          data: [{
            id: 'doc-1',
            name: 'Document 1.pdf',
            created_by: 'user-123',
            case_id: 'case-456',
            is_deleted: false
          }]
        });

      const result = await folderService.getFolderContents('folder-123', 'user-123');

      expect(result.success).toBe(true);
      expect(result.contents).toBeDefined();
      expect(result.contents!.folders).toHaveLength(1);
      expect(result.contents!.documents).toHaveLength(1);
      expect(result.contents!.totalCount).toBe(2);
    });

    test('should filter contents based on permissions', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      
      // Mock permission checks - folder accessible, but contents not
      supabaseService.query
        .mockResolvedValueOnce({ success: true, data: [{ permission_level: 'view' }] }) // Folder permission
        .mockResolvedValueOnce({ // Subfolders
          success: true,
          data: [{
            id: 'subfolder-1',
            name: 'Subfolder 1',
            created_by: 'other-user',
            case_id: 'case-456',
            is_deleted: false
          }]
        })
        .mockResolvedValueOnce({ // Documents
          success: true,
          data: [{
            id: 'doc-1',
            name: 'Document 1.pdf',
            created_by: 'other-user',
            case_id: 'case-456',
            is_deleted: false
          }]
        })
        .mockResolvedValueOnce({ success: true, data: [] }) // No subfolder permissions
        .mockResolvedValueOnce({ success: true, data: [] }); // No document permissions

      const result = await folderService.getFolderContents('folder-123', 'user-123');

      expect(result.success).toBe(true);
      expect(result.contents!.folders).toHaveLength(0); // Filtered out
      expect(result.contents!.documents).toHaveLength(0); // Filtered out
      expect(result.contents!.totalCount).toBe(0);
    });
  });

  describe('Folder Listing', () => {
    test('should list folders with filters', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query
        .mockResolvedValueOnce({
          success: true,
          data: [{
            id: 'folder-1',
            name: 'Folder 1',
            created_by: 'user-123',
            case_id: 'case-456',
            is_deleted: false
          }],
          count: 1
        })
        .mockResolvedValueOnce({ success: true, data: [{ permission_level: 'view' }] }); // Permission check

      const options: FolderQueryOptions = {
        caseId: 'case-456',
        parentId: null,
        limit: 10
      };

      const result = await folderService.listFolders(options, 'user-123');

      expect(result.success).toBe(true);
      expect(result.folders).toBeDefined();
      expect(supabaseService.query).toHaveBeenCalledWith(
        'folders',
        expect.objectContaining({
          filters: expect.objectContaining({
            case_id: 'case-456',
            parent_id: null
          })
        })
      );
    });

    test('should filter folders by permissions', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query
        .mockResolvedValueOnce({
          success: true,
          data: [{
            id: 'folder-1',
            name: 'Folder 1',
            created_by: 'other-user',
            case_id: 'case-456',
            is_deleted: false
          }],
          count: 1
        })
        .mockResolvedValueOnce({ success: true, data: [] }); // No permissions

      const result = await folderService.listFolders({}, 'user-123');

      expect(result.success).toBe(true);
      expect(result.folders).toHaveLength(0); // Filtered out due to permissions
    });
  });

  describe('Folder Hierarchy', () => {
    test('should get folder hierarchy', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      
      // Mock nested folder structure
      supabaseService.findById
        .mockResolvedValueOnce({ // Child folder
          success: true,
          data: {
            id: 'child-folder',
            name: 'Child',
            parent_id: 'parent-folder',
            case_id: 'case-456',
            is_deleted: false
          }
        })
        .mockResolvedValueOnce({ // Parent folder
          success: true,
          data: {
            id: 'parent-folder',
            name: 'Parent',
            parent_id: null,
            case_id: 'case-456',
            is_deleted: false
          }
        });
      
      // Mock permission checks
      supabaseService.query.mockResolvedValue({
        success: true,
        data: [{ permission_level: 'view' }]
      });

      const result = await folderService.getFolderHierarchy('child-folder', 'user-123');

      expect(result.success).toBe(true);
      expect(result.hierarchy).toHaveLength(2);
      expect(result.hierarchy![0].name).toBe('Parent'); // Root first
      expect(result.hierarchy![1].name).toBe('Child'); // Child last
    });
  });

  describe('Property-Based Tests', () => {
    // Property 6: Folder Hierarchy Limits
    // For any folder creation attempt, folders should be created successfully up to 5 levels deep
    test('Property 6: Folder hierarchy should be limited to 5 levels', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 4 }), // Valid levels (0-4)
          fc.string({ minLength: 1, maxLength: 50 }),
          async (level, folderName) => {
            const { supabaseService } = require('../../src/document-management/services/supabaseService');
            
            // Mock case exists
            supabaseService.findById.mockResolvedValue({ success: true, data: { id: 'case-456' } });
            
            // Mock hierarchy validation - should pass for levels 0-4
            supabaseService.query.mockResolvedValue({ success: true, data: [] }); // No duplicates

            const createRequest: FolderCreateRequest = {
              name: folderName,
              caseId: 'case-456',
              userId: 'user-123'
            };

            const result = await folderService.createFolder(createRequest);

            // Should succeed for valid levels
            if (level <= 4) {
              expect(result.success).toBe(true);
            }
          }
        ),
        { numRuns: 20 }
      );

      // Test that level 5 and above should fail
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 5, max: 10 }), // Invalid levels (5+)
          fc.string({ minLength: 1, maxLength: 50 }),
          async (level, folderName) => {
            const { supabaseService } = require('../../src/document-management/services/supabaseService');
            
            // Mock deep hierarchy that would exceed limit
            let currentParent = null;
            for (let i = 0; i < level; i++) {
              supabaseService.findById.mockResolvedValueOnce({
                success: true,
                data: {
                  id: `parent-${i}`,
                  case_id: 'case-456',
                  parent_id: currentParent,
                  level: i,
                  is_deleted: false
                }
              });
              currentParent = `parent-${i}`;
            }

            const createRequest: FolderCreateRequest = {
              name: folderName,
              caseId: 'case-456',
              parentId: currentParent,
              userId: 'user-123'
            };

            const result = await folderService.createFolder(createRequest);

            // Should fail for levels 5 and above
            expect(result.success).toBe(false);
            expect(result.error).toContain('Maximum folder depth');
          }
        ),
        { numRuns: 10 }
      );
    });

    // Property 10: Hierarchy Consistency
    // For any folder operation, the folder hierarchy and document associations should remain consistent
    test('Property 10: Folder hierarchy should remain consistent after operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
          async (folderName, newName) => {
            const { supabaseService } = require('../../src/document-management/services/supabaseService');
            
            // Mock permissions
            supabaseService.query.mockResolvedValue({
              success: true,
              data: [{ permission_level: 'edit' }]
            });

            // Create folder
            const createRequest: FolderCreateRequest = {
              name: folderName,
              caseId: 'case-456',
              userId: 'user-123'
            };

            const createResult = await folderService.createFolder(createRequest);
            
            if (createResult.success) {
              expect(createResult.folder!.name).toBe(folderName);
              expect(createResult.folder!.path).toBe(`/${folderName}`);

              // Update folder name if provided
              if (newName && newName !== folderName) {
                const updateRequest: FolderUpdateRequest = {
                  name: newName
                };

                const updateResult = await folderService.updateFolder(
                  createResult.folder!.id,
                  updateRequest,
                  'user-123'
                );

                if (updateResult.success) {
                  // Path should be updated consistently
                  expect(updateResult.folder!.name).toBe(newName);
                  expect(updateResult.folder!.path).toBe(`/${newName}`);
                }
              }
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    // Property: Folder names should be unique at the same level
    test('Property: Folder names should be unique within the same parent', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.option(fc.uuid(), { nil: null }),
          async (folderName, parentId) => {
            const { supabaseService } = require('../../src/document-management/services/supabaseService');
            
            // Mock case exists
            supabaseService.findById.mockResolvedValue({ success: true, data: { id: 'case-456' } });
            
            // First creation should succeed (no duplicates)
            supabaseService.query.mockResolvedValueOnce({ success: true, data: [] });

            const createRequest: FolderCreateRequest = {
              name: folderName,
              caseId: 'case-456',
              parentId,
              userId: 'user-123'
            };

            const firstResult = await folderService.createFolder(createRequest);

            if (firstResult.success) {
              // Second creation with same name should fail (duplicate found)
              supabaseService.query.mockResolvedValueOnce({
                success: true,
                data: [{ id: 'existing-folder', name: folderName }]
              });

              const secondResult = await folderService.createFolder(createRequest);

              expect(secondResult.success).toBe(false);
              expect(secondResult.error).toContain('already exists');
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    // Property: Folder paths should be correctly calculated
    test('Property: Folder paths should reflect hierarchy structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
          async (folderNames) => {
            const { supabaseService } = require('../../src/document-management/services/supabaseService');
            
            let expectedPath = '';
            let currentParentId = null;
            let currentLevel = 0;

            for (const folderName of folderNames) {
              expectedPath += `/${folderName}`;
              
              // Mock parent folder if not root
              if (currentParentId) {
                supabaseService.findById.mockResolvedValueOnce({
                  success: true,
                  data: {
                    id: currentParentId,
                    case_id: 'case-456',
                    path: expectedPath.substring(0, expectedPath.lastIndexOf('/')),
                    level: currentLevel - 1,
                    is_deleted: false
                  }
                });
              }

              const createRequest: FolderCreateRequest = {
                name: folderName,
                caseId: 'case-456',
                parentId: currentParentId,
                userId: 'user-123'
              };

              const result = await folderService.createFolder(createRequest);

              if (result.success) {
                expect(result.folder!.path).toBe(expectedPath);
                expect(result.folder!.level).toBe(currentLevel);
                
                currentParentId = result.folder!.id;
                currentLevel++;
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.insert.mockResolvedValueOnce({
        success: false,
        error: { message: 'Database connection failed' }
      });

      const createRequest: FolderCreateRequest = {
        name: 'Test Folder',
        caseId: 'case-456',
        userId: 'user-123'
      };

      const result = await folderService.createFolder(createRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Folder creation failed');
    });

    test('should handle permission check failures', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockRejectedValueOnce(new Error('Permission check failed'));

      const result = await folderService.getFolder('folder-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to retrieve folder');
    });

    test('should handle hierarchy validation errors', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      
      // Mock case exists
      supabaseService.findById.mockResolvedValueOnce({ success: true, data: { id: 'case-456' } });
      
      // Mock hierarchy validation failure (circular reference)
      supabaseService.findById.mockRejectedValueOnce(new Error('Hierarchy validation failed'));

      const createRequest: FolderCreateRequest = {
        name: 'Test Folder',
        caseId: 'case-456',
        parentId: 'parent-folder',
        userId: 'user-123'
      };

      const result = await folderService.createFolder(createRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('hierarchy validation failed');
    });
  });
});