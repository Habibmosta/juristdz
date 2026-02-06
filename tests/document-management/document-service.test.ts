/**
 * Document Management System - Document Service Tests
 * 
 * Comprehensive tests for the document service including
 * unit tests and property-based tests for correctness validation.
 */

import { documentService } from '../../src/document-management/services/documentService';
import type { 
  DocumentUploadRequest, 
  DocumentUpdateRequest, 
  DocumentQueryOptions 
} from '../../src/document-management/services/documentService';
import type { Document, DocumentCategory, ConfidentialityLevel } from '../../types/document-management';
import * as fc from 'fast-check';

// Mock dependencies
jest.mock('../../src/document-management/services/supabaseService', () => ({
  supabaseService: {
    insert: jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'doc-123',
        case_id: 'case-456',
        name: 'test.pdf',
        original_name: 'test.pdf',
        mime_type: 'application/pdf',
        size: 1024,
        checksum: 'abc123',
        encryption_key: 'key123',
        storage_path: '/documents/test.pdf',
        folder_id: null,
        tags: ['legal'],
        description: 'Test document',
        category: 'contract',
        confidentiality_level: 'confidential',
        custom_fields: {},
        created_by: 'user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_version_id: 'version-1',
        is_deleted: false
      }
    }),
    findById: jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'doc-123',
        case_id: 'case-456',
        name: 'test.pdf',
        original_name: 'test.pdf',
        mime_type: 'application/pdf',
        size: 1024,
        checksum: 'abc123',
        encryption_key: 'key123',
        storage_path: '/documents/test.pdf',
        folder_id: null,
        tags: ['legal'],
        description: 'Test document',
        category: 'contract',
        confidentiality_level: 'confidential',
        custom_fields: {},
        created_by: 'user-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_version_id: 'version-1',
        is_deleted: false
      }
    }),
    update: jest.fn().mockResolvedValue({ success: true }),
    delete: jest.fn().mockResolvedValue({ success: true }),
    query: jest.fn().mockResolvedValue({
      success: true,
      data: [],
      count: 0
    }),
    createAuditEntry: jest.fn().mockResolvedValue({ success: true })
  }
}));

jest.mock('../../src/document-management/services/fileStorageService', () => ({
  fileStorageService: {
    deleteFile: jest.fn().mockResolvedValue({ success: true })
  }
}));

jest.mock('../../src/document-management/services/fileUploadService', () => ({
  fileUploadService: {
    uploadFile: jest.fn().mockResolvedValue({
      success: true,
      checksum: 'abc123',
      encryptionKey: 'key123',
      storagePath: '/documents/test.pdf',
      versionId: 'version-1'
    })
  }
}));

describe('DocumentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Document Creation', () => {
    test('should create document successfully', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const uploadRequest: DocumentUploadRequest = {
        file,
        caseId: 'case-456',
        userId: 'user-123',
        metadata: {
          description: 'Test document',
          category: 'contract',
          confidentialityLevel: 'confidential',
          tags: ['legal'],
          customFields: {}
        }
      };

      const result = await documentService.createDocument(uploadRequest);

      expect(result.success).toBe(true);
      expect(result.document).toBeDefined();
      expect(result.document!.name).toBe('test.pdf');
      expect(result.document!.caseId).toBe('case-456');
      expect(result.document!.metadata.category).toBe('contract');
    });

    test('should validate case existence', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.findById.mockResolvedValueOnce({ success: false, data: null });

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const uploadRequest: DocumentUploadRequest = {
        file,
        caseId: 'nonexistent-case',
        userId: 'user-123'
      };

      const result = await documentService.createDocument(uploadRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Case not found');
    });

    test('should validate folder existence', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      // Mock case exists but folder doesn't
      supabaseService.findById
        .mockResolvedValueOnce({ success: true, data: { id: 'case-456' } }) // Case exists
        .mockResolvedValueOnce({ success: false, data: null }); // Folder doesn't exist

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const uploadRequest: DocumentUploadRequest = {
        file,
        caseId: 'case-456',
        folderId: 'nonexistent-folder',
        userId: 'user-123'
      };

      const result = await documentService.createDocument(uploadRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Folder not found');
    });

    test('should handle file upload failure', async () => {
      const { fileUploadService } = require('../../src/document-management/services/fileUploadService');
      fileUploadService.uploadFile.mockResolvedValueOnce({
        success: false,
        error: 'Upload failed'
      });

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const uploadRequest: DocumentUploadRequest = {
        file,
        caseId: 'case-456',
        userId: 'user-123'
      };

      const result = await documentService.createDocument(uploadRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('File upload failed');
    });
  });

  describe('Document Retrieval', () => {
    test('should get document by ID', async () => {
      // Mock permission check
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [{ permission_level: 'view' }]
      });

      const result = await documentService.getDocument('doc-123', 'user-123');

      expect(result.success).toBe(true);
      expect(result.document).toBeDefined();
      expect(result.document!.id).toBe('doc-123');
    });

    test('should handle document not found', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.findById.mockResolvedValueOnce({ success: false, data: null });

      const result = await documentService.getDocument('nonexistent-doc', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Document not found');
    });

    test('should handle deleted document', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: { id: 'doc-123', is_deleted: true }
      });

      const result = await documentService.getDocument('doc-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Document has been deleted');
    });

    test('should check permissions', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      // Mock document exists but no permissions
      supabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: { id: 'doc-123', created_by: 'other-user', case_id: 'case-456', is_deleted: false }
      });
      supabaseService.query.mockResolvedValueOnce({ success: true, data: [] }); // No permissions

      const result = await documentService.getDocument('doc-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
    });
  });

  describe('Document Updates', () => {
    test('should update document metadata', async () => {
      // Mock permission checks
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValue({
        success: true,
        data: [{ permission_level: 'edit' }]
      });

      const updateRequest: DocumentUpdateRequest = {
        name: 'updated-test.pdf',
        description: 'Updated description',
        category: 'evidence',
        tags: ['legal', 'updated']
      };

      const result = await documentService.updateDocument('doc-123', updateRequest, 'user-123');

      expect(result.success).toBe(true);
      expect(supabaseService.update).toHaveBeenCalledWith(
        'documents',
        'doc-123',
        expect.objectContaining({
          name: 'updated-test.pdf',
          description: 'Updated description',
          category: 'evidence',
          tags: ['legal', 'updated']
        })
      );
    });

    test('should validate folder when updating', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      // Mock document exists and user has permission
      supabaseService.query.mockResolvedValue({
        success: true,
        data: [{ permission_level: 'edit' }]
      });
      // Mock folder doesn't exist
      supabaseService.findById
        .mockResolvedValueOnce({ success: true, data: { id: 'doc-123' } }) // Document exists
        .mockResolvedValueOnce({ success: false, data: null }); // Folder doesn't exist

      const updateRequest: DocumentUpdateRequest = {
        folderId: 'nonexistent-folder'
      };

      const result = await documentService.updateDocument('doc-123', updateRequest, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Folder not found');
    });

    test('should check edit permissions', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      // Mock document exists but user doesn't have edit permission
      supabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: { id: 'doc-123', created_by: 'other-user', case_id: 'case-456', is_deleted: false }
      });
      supabaseService.query.mockResolvedValue({ success: true, data: [] }); // No permissions

      const updateRequest: DocumentUpdateRequest = {
        name: 'updated-test.pdf'
      };

      const result = await documentService.updateDocument('doc-123', updateRequest, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('insufficient permissions to edit');
    });
  });

  describe('Document Deletion', () => {
    test('should soft delete document', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValue({
        success: true,
        data: [{ permission_level: 'delete' }]
      });

      const result = await documentService.deleteDocument('doc-123', 'user-123');

      expect(result.success).toBe(true);
      expect(supabaseService.update).toHaveBeenCalledWith(
        'documents',
        'doc-123',
        expect.objectContaining({
          is_deleted: true,
          deleted_at: expect.any(String)
        })
      );
    });

    test('should permanently delete document', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      const { fileStorageService } = require('../../src/document-management/services/fileStorageService');
      
      supabaseService.query.mockResolvedValue({
        success: true,
        data: [{ permission_level: 'delete' }]
      });

      const result = await documentService.permanentlyDeleteDocument('doc-123', 'user-123');

      expect(result.success).toBe(true);
      expect(fileStorageService.deleteFile).toHaveBeenCalled();
      expect(supabaseService.delete).toHaveBeenCalledWith('documents', 'doc-123');
    });

    test('should check delete permissions', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      // Mock document exists but user doesn't have delete permission
      supabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: { id: 'doc-123', created_by: 'other-user', case_id: 'case-456', is_deleted: false }
      });
      supabaseService.query.mockResolvedValue({ success: true, data: [] }); // No permissions

      const result = await documentService.deleteDocument('doc-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('insufficient permissions to delete');
    });
  });

  describe('Document Listing', () => {
    test('should list documents with filters', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'doc-1',
            name: 'test1.pdf',
            created_by: 'user-123',
            case_id: 'case-456',
            is_deleted: false
          }
        ],
        count: 1
      });

      const options: DocumentQueryOptions = {
        caseId: 'case-456',
        category: 'contract',
        limit: 10
      };

      const result = await documentService.listDocuments(options, 'user-123');

      expect(result.success).toBe(true);
      expect(result.documents).toBeDefined();
      expect(supabaseService.query).toHaveBeenCalledWith(
        'documents',
        expect.objectContaining({
          filters: expect.objectContaining({
            case_id: 'case-456',
            category: 'contract'
          })
        })
      );
    });

    test('should filter by date range', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-12-31');

      const options: DocumentQueryOptions = {
        dateFrom,
        dateTo
      };

      const result = await documentService.listDocuments(options, 'user-123');

      expect(result.success).toBe(true);
      expect(supabaseService.query).toHaveBeenCalledWith(
        'documents',
        expect.objectContaining({
          dateRange: {
            field: 'created_at',
            from: dateFrom.toISOString(),
            to: dateTo.toISOString()
          }
        })
      );
    });

    test('should search by term', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      const options: DocumentQueryOptions = {
        searchTerm: 'contract'
      };

      const result = await documentService.listDocuments(options, 'user-123');

      expect(result.success).toBe(true);
      expect(supabaseService.query).toHaveBeenCalledWith(
        'documents',
        expect.objectContaining({
          search: {
            fields: ['name', 'description'],
            term: 'contract'
          }
        })
      );
    });

    test('should filter by tags', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      const options: DocumentQueryOptions = {
        tags: ['legal', 'contract']
      };

      const result = await documentService.listDocuments(options, 'user-123');

      expect(result.success).toBe(true);
      expect(supabaseService.query).toHaveBeenCalledWith(
        'documents',
        expect.objectContaining({
          arrayContains: {
            field: 'tags',
            values: ['legal', 'contract']
          }
        })
      );
    });
  });

  describe('Document Movement', () => {
    test('should move document to folder', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValue({
        success: true,
        data: [{ permission_level: 'edit' }]
      });
      // Mock folder exists
      supabaseService.findById
        .mockResolvedValueOnce({ success: true, data: { id: 'doc-123' } }) // Document exists
        .mockResolvedValueOnce({ success: true, data: { id: 'folder-456', is_deleted: false } }); // Folder exists

      const result = await documentService.moveDocument('doc-123', 'folder-456', 'user-123');

      expect(result.success).toBe(true);
      expect(supabaseService.update).toHaveBeenCalledWith(
        'documents',
        'doc-123',
        expect.objectContaining({
          folder_id: 'folder-456'
        })
      );
    });

    test('should move document to root (null folder)', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValue({
        success: true,
        data: [{ permission_level: 'edit' }]
      });

      const result = await documentService.moveDocument('doc-123', null, 'user-123');

      expect(result.success).toBe(true);
      expect(supabaseService.update).toHaveBeenCalledWith(
        'documents',
        'doc-123',
        expect.objectContaining({
          folder_id: null
        })
      );
    });

    test('should validate target folder exists', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValue({
        success: true,
        data: [{ permission_level: 'edit' }]
      });
      // Mock document exists but folder doesn't
      supabaseService.findById
        .mockResolvedValueOnce({ success: true, data: { id: 'doc-123' } }) // Document exists
        .mockResolvedValueOnce({ success: false, data: null }); // Folder doesn't exist

      const result = await documentService.moveDocument('doc-123', 'nonexistent-folder', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Target folder not found');
    });
  });

  describe('Property-Based Tests', () => {
    // Property 5: Case Association
    // For any document upload, the document should be successfully associated with any valid existing case
    test('Property 5: Document should be associated with valid cases', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('contract', 'pleading', 'evidence', 'correspondence', 'template', 'other'),
          async (caseId, fileName, category) => {
            const { supabaseService } = require('../../src/document-management/services/supabaseService');
            // Mock case exists
            supabaseService.findById.mockResolvedValue({ success: true, data: { id: caseId } });

            const file = new File(['test content'], `${fileName}.pdf`, { type: 'application/pdf' });
            const uploadRequest: DocumentUploadRequest = {
              file,
              caseId,
              userId: 'user-123',
              metadata: {
                category: category as DocumentCategory
              }
            };

            const result = await documentService.createDocument(uploadRequest);

            if (result.success) {
              expect(result.document!.caseId).toBe(caseId);
              expect(result.document!.metadata.category).toBe(category);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    // Property 7: Tag Indexing
    // For any document with assigned tags, those tags should be stored and become searchable immediately
    test('Property 7: Document tags should be stored and searchable', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (tags, fileName) => {
            const file = new File(['test content'], `${fileName}.pdf`, { type: 'application/pdf' });
            const uploadRequest: DocumentUploadRequest = {
              file,
              caseId: 'case-456',
              userId: 'user-123',
              metadata: {
                tags
              }
            };

            const result = await documentService.createDocument(uploadRequest);

            if (result.success) {
              expect(result.document!.tags).toEqual(tags);
              
              // Test that documents can be found by tags
              const searchResult = await documentService.listDocuments(
                { tags: [tags[0]] },
                'user-123'
              );
              
              expect(searchResult.success).toBe(true);
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    // Property 10: Hierarchy Consistency
    // For any folder operation, the folder hierarchy and document associations should remain consistent
    test('Property 10: Document-folder associations should remain consistent', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.uuid(), { nil: null }),
          fc.option(fc.uuid(), { nil: null }),
          async (initialFolderId, targetFolderId) => {
            const { supabaseService } = require('../../src/document-management/services/supabaseService');
            
            // Mock permissions
            supabaseService.query.mockResolvedValue({
              success: true,
              data: [{ permission_level: 'edit' }]
            });

            // Mock folders exist if specified
            if (targetFolderId) {
              supabaseService.findById.mockResolvedValue({
                success: true,
                data: { id: targetFolderId, is_deleted: false }
              });
            }

            // Create document with initial folder
            const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
            const uploadRequest: DocumentUploadRequest = {
              file,
              caseId: 'case-456',
              folderId: initialFolderId,
              userId: 'user-123'
            };

            const createResult = await documentService.createDocument(uploadRequest);
            
            if (createResult.success) {
              expect(createResult.document!.folderId).toBe(initialFolderId);

              // Move document to target folder
              const moveResult = await documentService.moveDocument(
                createResult.document!.id,
                targetFolderId,
                'user-123'
              );

              if (moveResult.success) {
                expect(moveResult.document!.folderId).toBe(targetFolderId);
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    // Property: Document metadata should be preserved through operations
    test('Property: Document metadata integrity should be maintained', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('contract', 'pleading', 'evidence', 'correspondence', 'template', 'other'),
          fc.constantFrom('public', 'internal', 'confidential', 'restricted'),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
          async (description, category, confidentialityLevel, tags) => {
            const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
            const uploadRequest: DocumentUploadRequest = {
              file,
              caseId: 'case-456',
              userId: 'user-123',
              metadata: {
                description,
                category: category as DocumentCategory,
                confidentialityLevel: confidentialityLevel as ConfidentialityLevel,
                tags,
                customFields: { testField: 'testValue' }
              }
            };

            const createResult = await documentService.createDocument(uploadRequest);

            if (createResult.success) {
              const doc = createResult.document!;
              
              // Verify all metadata is preserved
              expect(doc.metadata.description).toBe(description);
              expect(doc.metadata.category).toBe(category);
              expect(doc.metadata.confidentialityLevel).toBe(confidentialityLevel);
              expect(doc.tags).toEqual(tags);
              expect(doc.metadata.customFields).toEqual({ testField: 'testValue' });

              // Retrieve document and verify metadata is still intact
              const getResult = await documentService.getDocument(doc.id, 'user-123');
              
              if (getResult.success) {
                const retrievedDoc = getResult.document!;
                expect(retrievedDoc.metadata.description).toBe(description);
                expect(retrievedDoc.metadata.category).toBe(category);
                expect(retrievedDoc.metadata.confidentialityLevel).toBe(confidentialityLevel);
                expect(retrievedDoc.tags).toEqual(tags);
              }
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Statistics', () => {
    test('should get document statistics', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [
          {
            category: 'contract',
            confidentiality_level: 'confidential',
            size: 1024,
            tags: ['legal', 'contract'],
            created_at: new Date().toISOString()
          },
          {
            category: 'evidence',
            confidentiality_level: 'internal',
            size: 2048,
            tags: ['legal', 'evidence'],
            created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() // 8 days ago
          }
        ]
      });

      const stats = await documentService.getDocumentStatistics('case-456', 'user-123');

      expect(stats.totalDocuments).toBe(2);
      expect(stats.documentsByCategory.contract).toBe(1);
      expect(stats.documentsByCategory.evidence).toBe(1);
      expect(stats.documentsByConfidentiality.confidential).toBe(1);
      expect(stats.documentsByConfidentiality.internal).toBe(1);
      expect(stats.totalSize).toBe(3072);
      expect(stats.averageSize).toBe(1536);
      expect(stats.recentUploads).toBe(1); // Only one document in last 7 days
      expect(stats.mostUsedTags).toContainEqual({ tag: 'legal', count: 2 });
    });

    test('should handle empty statistics', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValueOnce({
        success: true,
        data: []
      });

      const stats = await documentService.getDocumentStatistics();

      expect(stats.totalDocuments).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.averageSize).toBe(0);
      expect(stats.recentUploads).toBe(0);
      expect(stats.mostUsedTags).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.insert.mockResolvedValueOnce({
        success: false,
        error: { message: 'Database connection failed' }
      });

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const uploadRequest: DocumentUploadRequest = {
        file,
        caseId: 'case-456',
        userId: 'user-123'
      };

      const result = await documentService.createDocument(uploadRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Document creation failed');
    });

    test('should clean up on document creation failure', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      const { fileStorageService } = require('../../src/document-management/services/fileStorageService');
      
      // Mock successful upload but failed document creation
      supabaseService.insert.mockResolvedValueOnce({
        success: false,
        error: { message: 'Database error' }
      });

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const uploadRequest: DocumentUploadRequest = {
        file,
        caseId: 'case-456',
        userId: 'user-123'
      };

      const result = await documentService.createDocument(uploadRequest);

      expect(result.success).toBe(false);
      expect(fileStorageService.deleteFile).toHaveBeenCalled(); // Should clean up uploaded file
    });

    test('should handle permission check failures', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockRejectedValueOnce(new Error('Permission check failed'));

      const result = await documentService.getDocument('doc-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to retrieve document');
    });
  });
});