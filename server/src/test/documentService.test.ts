import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { documentService } from '@/services/documentService';
import { fileStorageService } from '@/services/fileStorageService';
import { db } from '@/database/connection';
import {
  Document,
  DocumentTemplate,
  DocumentType,
  DocumentCategory,
  DocumentStatus,
  ConfidentialityLevel,
  DocumentSearchCriteria,
  BulkDocumentOperation,
  TemplateVariables
} from '@/types/document';
import { Profession } from '@/types/auth';

// Mock database
jest.mock('@/database/connection');
const mockDb = db as jest.Mocked<typeof db>;

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('DocumentService', () => {
  const mockUserId = 'user-123';
  const mockOrganizationId = 'org-456';
  const mockDocumentId = 'doc-789';
  const mockTemplateId = 'template-101';

  const mockTemplate: DocumentTemplate = {
    id: mockTemplateId,
    name: 'Test Template',
    description: 'Test template for unit tests',
    type: DocumentType.REQUETE,
    category: DocumentCategory.PROCEDURE,
    roleRestrictions: [Profession.AVOCAT],
    template: 'Test template content with {{variable1}} and {{variable2}}',
    variables: [
      {
        name: 'variable1',
        type: 'text' as any,
        label: 'Variable 1',
        required: true,
        description: 'First test variable'
      },
      {
        name: 'variable2',
        type: 'text' as any,
        label: 'Variable 2',
        required: false,
        description: 'Second test variable'
      }
    ],
    legalReferences: [],
    isPublic: true,
    isActive: true,
    version: 1,
    createdBy: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    usage: {
      totalUsage: 0,
      popularVariables: []
    },
    tags: ['test'],
    language: 'fr',
    jurisdiction: 'Algeria'
  };

  const mockDocument: Document = {
    id: mockDocumentId,
    title: 'Test Document',
    type: DocumentType.REQUETE,
    category: DocumentCategory.PROCEDURE,
    content: 'Test document content',
    metadata: {
      legalReferences: [],
      tags: ['test'],
      keywords: ['test', 'document'],
      customFields: {},
      relatedDocuments: [],
      attachments: [],
      wordCount: 3,
      pageCount: 1,
      checksum: 'test-checksum'
    },
    ownerId: mockUserId,
    organizationId: mockOrganizationId,
    permissions: [],
    versions: [],
    signatures: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: DocumentStatus.DRAFT,
    templateId: mockTemplateId,
    isTemplate: false,
    language: 'fr',
    confidentialityLevel: ConfidentialityLevel.INTERNAL
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createDocument', () => {
    it('should create a document from template successfully', async () => {
      // Mock database responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ profession: Profession.AVOCAT }] }) // getUserRole
        .mockResolvedValueOnce({ rows: [{ barreau_id: mockOrganizationId }] }) // getUserOrganizationId
        .mockResolvedValueOnce({ rows: [] }) // saveDocumentToDatabase
        .mockResolvedValueOnce({ rows: [{ max_version: 0 }] }) // createDocumentVersion - get max version
        .mockResolvedValueOnce({ rows: [] }) // createDocumentVersion - deactivate previous
        .mockResolvedValueOnce({ rows: [] }) // createDocumentVersion - insert new
        .mockResolvedValueOnce({ rows: [] }) // setDefaultPermissions
        .mockResolvedValueOnce({ rows: [] }); // updateTemplateUsage

      const variables: TemplateVariables = {
        variable1: 'Test Value 1',
        variable2: 'Test Value 2',
        title: 'Generated Document'
      };

      const result = await documentService.createDocument(
        mockTemplate,
        variables,
        mockUserId,
        mockOrganizationId
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('Generated Document');
      expect(result.content).toContain('Test Value 1');
      expect(result.content).toContain('Test Value 2');
      expect(result.ownerId).toBe(mockUserId);
      expect(result.organizationId).toBe(mockOrganizationId);
      expect(result.templateId).toBe(mockTemplateId);
    });

    it('should throw error when user role is not authorized for template', async () => {
      // Mock user with different role
      mockDb.query.mockResolvedValueOnce({ rows: [{ profession: Profession.NOTAIRE }] });

      const variables: TemplateVariables = {
        variable1: 'Test Value 1'
      };

      await expect(
        documentService.createDocument(mockTemplate, variables, mockUserId, mockOrganizationId)
      ).rejects.toThrow('User role not authorized for this template');
    });

    it('should throw error when required variables are missing', async () => {
      // Mock authorized user
      mockDb.query.mockResolvedValueOnce({ rows: [{ profession: Profession.AVOCAT }] });

      const variables: TemplateVariables = {
        variable2: 'Test Value 2' // Missing required variable1
      };

      await expect(
        documentService.createDocument(mockTemplate, variables, mockUserId, mockOrganizationId)
      ).rejects.toThrow('Template validation failed');
    });
  });

  describe('generateFromTemplate', () => {
    it('should generate document from template with warnings for missing variables', async () => {
      // Mock template retrieval and user authorization
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockTemplate] }) // getTemplate
        .mockResolvedValueOnce({ rows: [{ profession: Profession.AVOCAT }] }) // getUserRole
        .mockResolvedValueOnce({ rows: [{ barreau_id: mockOrganizationId }] }) // getUserOrganizationId
        .mockResolvedValueOnce({ rows: [] }) // saveDocumentToDatabase
        .mockResolvedValueOnce({ rows: [{ max_version: 0 }] }) // createDocumentVersion
        .mockResolvedValueOnce({ rows: [] }) // deactivate previous versions
        .mockResolvedValueOnce({ rows: [] }) // insert new version
        .mockResolvedValueOnce({ rows: [] }) // setDefaultPermissions
        .mockResolvedValueOnce({ rows: [] }); // updateTemplateUsage

      const variables: TemplateVariables = {
        variable2: 'Test Value 2' // Missing required variable1
      };

      const result = await documentService.generateFromTemplate(
        mockTemplateId,
        variables,
        mockUserId,
        mockOrganizationId
      );

      expect(result).toBeDefined();
      expect(result.document).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.missingVariables).toContain('variable1');
      expect(result.validationErrors).toBeDefined();
    });

    it('should throw error when template is not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // getTemplate returns empty

      const variables: TemplateVariables = {
        variable1: 'Test Value 1'
      };

      await expect(
        documentService.generateFromTemplate(
          'non-existent-template',
          variables,
          mockUserId,
          mockOrganizationId
        )
      ).rejects.toThrow('Template not found');
    });
  });

  describe('searchDocuments', () => {
    it('should search documents with basic criteria', async () => {
      const mockSearchResults = [
        { ...mockDocument, rank: 0.8 },
        { ...mockDocument, id: 'doc-456', rank: 0.6 }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: mockSearchResults }) // search query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // count query

      const criteria: DocumentSearchCriteria = {
        query: 'test document',
        type: DocumentType.REQUETE,
        limit: 10,
        offset: 0
      };

      const result = await documentService.searchDocuments(criteria, mockUserId);

      expect(result).toBeDefined();
      expect(result.documents).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.searchTime).toBeGreaterThan(0);
    });

    it('should search documents with date range filter', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const criteria: DocumentSearchCriteria = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31')
        }
      };

      const result = await documentService.searchDocuments(criteria, mockUserId);

      expect(result).toBeDefined();
      expect(result.documents).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getDocument', () => {
    it('should retrieve document with permissions check', async () => {
      const mockDocumentRow = {
        id: mockDocumentId,
        title: 'Test Document',
        type: DocumentType.REQUETE,
        category: DocumentCategory.PROCEDURE,
        content: 'Test content',
        metadata: JSON.stringify(mockDocument.metadata),
        owner_id: mockUserId,
        organization_id: mockOrganizationId,
        created_at: new Date(),
        updated_at: new Date(),
        status: DocumentStatus.DRAFT,
        template_id: mockTemplateId,
        parent_document_id: null,
        is_template: false,
        language: 'fr',
        confidentiality_level: ConfidentialityLevel.INTERNAL
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockDocumentRow] }) // getDocument
        .mockResolvedValueOnce({ rows: [] }) // getDocumentVersions
        .mockResolvedValueOnce({ rows: [] }) // getDocumentSignatures
        .mockResolvedValueOnce({ rows: [] }); // getDocumentPermissions

      const result = await documentService.getDocument(mockDocumentId, mockUserId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockDocumentId);
      expect(result?.title).toBe('Test Document');
      expect(result?.ownerId).toBe(mockUserId);
    });

    it('should return null when document is not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await documentService.getDocument('non-existent-doc', mockUserId);

      expect(result).toBeNull();
    });

    it('should throw error when user has no access to document', async () => {
      const mockDocumentRow = {
        ...mockDocument,
        owner_id: 'different-user-id'
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockDocumentRow] });

      await expect(
        documentService.getDocument(mockDocumentId, mockUserId)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('deleteDocument', () => {
    it('should soft delete document when user has permission', async () => {
      const mockDocumentRow = {
        id: mockDocumentId,
        owner_id: mockUserId,
        // ... other fields
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockDocumentRow] }) // getDocument
        .mockResolvedValueOnce({ rows: [] }) // getDocumentVersions
        .mockResolvedValueOnce({ rows: [] }) // getDocumentSignatures
        .mockResolvedValueOnce({ rows: [] }) // getDocumentPermissions
        .mockResolvedValueOnce({ rows: [] }) // update status to cancelled
        .mockResolvedValueOnce({ rows: [] }); // log activity

      await documentService.deleteDocument(mockDocumentId, mockUserId);

      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE documents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [DocumentStatus.CANCELLED, mockDocumentId]
      );
    });
  });

  describe('bulkOperation', () => {
    it('should perform bulk delete operation', async () => {
      const documentIds = ['doc-1', 'doc-2', 'doc-3'];
      
      // Mock successful operations for all documents
      for (let i = 0; i < documentIds.length; i++) {
        mockDb.query
          .mockResolvedValueOnce({ rows: [{ id: documentIds[i], owner_id: mockUserId }] }) // getDocument
          .mockResolvedValueOnce({ rows: [] }) // getDocumentVersions
          .mockResolvedValueOnce({ rows: [] }) // getDocumentSignatures
          .mockResolvedValueOnce({ rows: [] }) // getDocumentPermissions
          .mockResolvedValueOnce({ rows: [] }) // update status
          .mockResolvedValueOnce({ rows: [] }); // log activity
      }

      const operation: BulkDocumentOperation = {
        documentIds,
        operation: 'delete'
      };

      const result = await documentService.bulkOperation(operation, mockUserId);

      expect(result.successful).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(result.totalProcessed).toBe(3);
    });

    it('should handle partial failures in bulk operation', async () => {
      const documentIds = ['doc-1', 'doc-2'];
      
      // Mock success for first document
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: documentIds[0], owner_id: mockUserId }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        // Mock failure for second document
        .mockResolvedValueOnce({ rows: [] }); // Document not found

      const operation: BulkDocumentOperation = {
        documentIds,
        operation: 'delete'
      };

      const result = await documentService.bulkOperation(operation, mockUserId);

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.totalProcessed).toBe(2);
      expect(result.failed[0].documentId).toBe('doc-2');
    });
  });

  describe('shareDocument', () => {
    it('should share document with another user', async () => {
      const shareWithUserId = 'user-456';
      const permissions = ['read', 'write'];

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: mockDocumentId, owner_id: mockUserId }] }) // getDocument
        .mockResolvedValueOnce({ rows: [] }) // getDocumentVersions
        .mockResolvedValueOnce({ rows: [] }) // getDocumentSignatures
        .mockResolvedValueOnce({ rows: [] }) // getDocumentPermissions
        .mockResolvedValueOnce({ rows: [] }) // insert permission
        .mockResolvedValueOnce({ rows: [] }); // log activity

      await documentService.shareDocument(
        mockDocumentId,
        shareWithUserId,
        permissions as any,
        mockUserId
      );

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO document_permissions'),
        expect.arrayContaining([shareWithUserId, permissions])
      );
    });
  });

  describe('exportDocument', () => {
    it('should export document in PDF format', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: mockDocumentId, owner_id: mockUserId }] }) // getDocument
        .mockResolvedValueOnce({ rows: [] }) // getDocumentVersions
        .mockResolvedValueOnce({ rows: [] }) // getDocumentSignatures
        .mockResolvedValueOnce({ rows: [] }) // getDocumentPermissions
        .mockResolvedValueOnce({ rows: [] }); // log activity

      const exportOptions = {
        format: 'pdf' as const,
        includeMetadata: true,
        includeSignatures: true,
        includeAttachments: false
      };

      const result = await documentService.exportDocument(
        mockDocumentId,
        mockUserId,
        exportOptions
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should export document in HTML format', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: mockDocumentId, owner_id: mockUserId }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const exportOptions = {
        format: 'html' as const,
        includeMetadata: true,
        includeSignatures: false,
        includeAttachments: false
      };

      const result = await documentService.exportDocument(
        mockDocumentId,
        mockUserId,
        exportOptions
      );

      expect(result).toBeInstanceOf(Buffer);
      const htmlContent = result.toString('utf-8');
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain(mockDocument.title);
    });
  });

  describe('saveDocument', () => {
    it('should save document and create new version', async () => {
      const updatedDocument = { ...mockDocument };
      updatedDocument.content = 'Updated content';

      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // updateDocumentInDatabase
        .mockResolvedValueOnce({ rows: [{ max_version: 1 }] }) // get current version
        .mockResolvedValueOnce({ rows: [] }) // deactivate previous versions
        .mockResolvedValueOnce({ rows: [] }) // insert new version
        .mockResolvedValueOnce({ rows: [] }); // cleanup old versions

      const result = await documentService.saveDocument(
        updatedDocument,
        mockUserId,
        'Updated document content'
      );

      expect(result).toBeDefined();
      expect(result.version).toBe(2);
      expect(result.changes).toBe('Updated document content');
      expect(result.createdBy).toBe(mockUserId);
    });
  });
});

describe('FileStorageService', () => {
  const mockUserId = 'user-123';
  const mockDocumentId = 'doc-789';
  const mockAttachmentId = 'attachment-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const fileBuffer = Buffer.from('test file content');
      const originalFilename = 'test.pdf';
      const mimeType = 'application/pdf';

      // Mock file system operations
      const mockFs = require('fs').promises;
      mockFs.mkdir = jest.fn().mockResolvedValue(undefined);
      mockFs.writeFile = jest.fn().mockResolvedValue(undefined);

      // Mock database operations
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // findFileByHash
        .mockResolvedValueOnce({ rows: [] }); // saveAttachmentToDatabase

      const result = await fileStorageService.uploadFile(
        mockDocumentId,
        fileBuffer,
        originalFilename,
        mimeType,
        mockUserId
      );

      expect(result).toBeDefined();
      expect(result.attachment).toBeDefined();
      expect(result.attachment.originalFilename).toBe(originalFilename);
      expect(result.attachment.mimeType).toBe(mimeType);
      expect(result.attachment.size).toBe(fileBuffer.length);
    });

    it('should reject file with invalid MIME type', async () => {
      const fileBuffer = Buffer.from('test file content');
      const originalFilename = 'test.exe';
      const mimeType = 'application/x-executable';

      await expect(
        fileStorageService.uploadFile(
          mockDocumentId,
          fileBuffer,
          originalFilename,
          mimeType,
          mockUserId
        )
      ).rejects.toThrow('File type application/x-executable is not allowed');
    });

    it('should reject file that exceeds size limit', async () => {
      const largeBuffer = Buffer.alloc(200 * 1024 * 1024); // 200MB
      const originalFilename = 'large.pdf';
      const mimeType = 'application/pdf';

      await expect(
        fileStorageService.uploadFile(
          mockDocumentId,
          largeBuffer,
          originalFilename,
          mimeType,
          mockUserId,
          { maxSize: 100 * 1024 * 1024 } // 100MB limit
        )
      ).rejects.toThrow('File size exceeds maximum allowed size');
    });
  });

  describe('downloadFile', () => {
    it('should download file successfully', async () => {
      const mockAttachment = {
        id: mockAttachmentId,
        filename: 'stored-file.pdf',
        originalFilename: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        url: '/files/test.pdf',
        uploadedAt: new Date(),
        uploadedBy: mockUserId,
        isEncrypted: false
      };

      const fileContent = Buffer.from('test file content');

      // Mock database operations
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockAttachment] }) // getAttachment
        .mockResolvedValueOnce({ rows: [{ document_id: mockDocumentId }] }) // checkFileAccess
        .mockResolvedValueOnce({ rows: [{ owner_id: mockUserId }] }) // checkDocumentAccess
        .mockResolvedValueOnce({ rows: [{ file_path: '/storage/test.pdf' }] }) // getAttachmentFilePath
        .mockResolvedValueOnce({ rows: [] }); // logFileAccess

      // Mock file system
      const mockFs = require('fs').promises;
      mockFs.readFile = jest.fn().mockResolvedValue(fileContent);

      const result = await fileStorageService.downloadFile(mockAttachmentId, mockUserId);

      expect(result).toBeDefined();
      expect(result.buffer).toEqual(fileContent);
      expect(result.attachment).toEqual(mockAttachment);
    });

    it('should throw error when attachment is not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // getAttachment returns empty

      await expect(
        fileStorageService.downloadFile('non-existent-attachment', mockUserId)
      ).rejects.toThrow('Attachment not found');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      // Mock database operations
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ document_id: mockDocumentId }] }) // checkFileAccess
        .mockResolvedValueOnce({ rows: [{ owner_id: mockUserId }] }) // checkDocumentAccess
        .mockResolvedValueOnce({ rows: [{ file_path: '/storage/test.pdf' }] }) // getAttachmentFilePath
        .mockResolvedValueOnce({ rows: [] }) // delete from database
        .mockResolvedValueOnce({ rows: [] }); // logFileAccess

      // Mock file system
      const mockFs = require('fs').promises;
      mockFs.unlink = jest.fn().mockResolvedValue(undefined);

      await fileStorageService.deleteFile(mockAttachmentId, mockUserId);

      expect(mockFs.unlink).toHaveBeenCalledWith('/storage/test.pdf');
      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM document_attachments WHERE id = $1',
        [mockAttachmentId]
      );
    });
  });

  describe('getDocumentAttachments', () => {
    it('should retrieve document attachments', async () => {
      const mockAttachments = [
        {
          id: 'attachment-1',
          filename: 'file1.pdf',
          original_filename: 'document1.pdf',
          mime_type: 'application/pdf',
          file_size: 1024,
          file_path: '/storage/file1.pdf',
          uploaded_by: mockUserId,
          uploaded_at: new Date(),
          is_encrypted: false,
          encryption_key_id: null
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ owner_id: mockUserId }] }) // checkDocumentAccess
        .mockResolvedValueOnce({ rows: mockAttachments }); // getDocumentAttachments

      const result = await fileStorageService.getDocumentAttachments(mockDocumentId, mockUserId);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].originalFilename).toBe('document1.pdf');
    });
  });
});