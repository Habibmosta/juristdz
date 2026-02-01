import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { documentService } from '@/services/documentService';
import { fileStorageService } from '@/services/fileStorageService';
import { connectDatabase, db } from '@/database/connection';
import {
  DocumentTemplate,
  DocumentType,
  DocumentCategory,
  ConfidentialityLevel,
  TemplateVariables
} from '@/types/document';
import { Profession } from '@/types/auth';

describe('Document System Integration Tests', () => {
  const testUserId = 'test-user-123';
  const testOrgId = 'test-org-456';

  beforeAll(async () => {
    // Connect to test database
    await connectDatabase();
    
    // Create test user if not exists
    try {
      await db.query(
        `INSERT INTO users (id, email, password_hash, is_verified, created_at)
         VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO NOTHING`,
        [testUserId, 'test@example.com', 'hashed_password']
      );

      await db.query(
        `INSERT INTO user_profiles (user_id, profession, first_name, last_name, is_primary, created_at)
         VALUES ($1, $2, 'Test', 'User', true, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, profession) DO NOTHING`,
        [testUserId, Profession.AVOCAT]
      );
    } catch (error) {
      console.warn('Test user setup failed:', error);
    }
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await db.query('DELETE FROM documents WHERE owner_id = $1', [testUserId]);
      await db.query('DELETE FROM document_templates WHERE created_by = $1', [testUserId]);
      await db.query('DELETE FROM user_profiles WHERE user_id = $1', [testUserId]);
      await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
    } catch (error) {
      console.warn('Test cleanup failed:', error);
    }
  });

  describe('Document Template and Generation', () => {
    it('should create and use a document template', async () => {
      // Create a test template
      const template: DocumentTemplate = {
        id: 'test-template-123',
        name: 'Test Legal Template',
        description: 'A test template for integration testing',
        type: DocumentType.REQUETE,
        category: DocumentCategory.PROCEDURE,
        roleRestrictions: [Profession.AVOCAT],
        template: 'REQUÊTE\n\nMonsieur le Président,\n\n{{client_name}} demande {{request_type}}.\n\nFait à {{location}}, le {{date}}.\n\n{{lawyer_name}}',
        variables: [
          {
            name: 'client_name',
            type: 'text' as any,
            label: 'Nom du client',
            required: true,
            description: 'Nom complet du client'
          },
          {
            name: 'request_type',
            type: 'text' as any,
            label: 'Type de demande',
            required: true,
            description: 'Nature de la demande'
          },
          {
            name: 'location',
            type: 'text' as any,
            label: 'Lieu',
            required: true,
            description: 'Lieu de rédaction'
          },
          {
            name: 'date',
            type: 'date' as any,
            label: 'Date',
            required: true,
            description: 'Date de rédaction'
          },
          {
            name: 'lawyer_name',
            type: 'text' as any,
            label: 'Nom de l\'avocat',
            required: true,
            description: 'Nom de l\'avocat signataire'
          }
        ],
        legalReferences: [],
        isPublic: true,
        isActive: true,
        version: 1,
        createdBy: testUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: {
          totalUsage: 0,
          popularVariables: []
        },
        tags: ['test', 'requete'],
        language: 'fr',
        jurisdiction: 'Algeria'
      };

      // Insert template into database
      await db.query(
        `INSERT INTO document_templates (
          id, name, description, type, category, role_restrictions, template, variables,
          legal_references, is_public, is_active, version, created_by, created_at, updated_at,
          usage_count, tags, language, jurisdiction
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          template.id, template.name, template.description, template.type, template.category,
          template.roleRestrictions, template.template, JSON.stringify(template.variables),
          JSON.stringify(template.legalReferences), template.isPublic, template.isActive,
          template.version, template.createdBy, template.createdAt, template.updatedAt,
          0, template.tags, template.language, template.jurisdiction
        ]
      );

      // Generate document from template
      const variables: TemplateVariables = {
        client_name: 'Jean Dupont',
        request_type: 'une indemnisation pour préjudice',
        location: 'Alger',
        date: '2024-01-15',
        lawyer_name: 'Maître Ahmed Benali',
        title: 'Requête en indemnisation - Jean Dupont'
      };

      const result = await documentService.generateFromTemplate(
        template.id,
        variables,
        testUserId,
        testOrgId
      );

      expect(result).toBeDefined();
      expect(result.document).toBeDefined();
      expect(result.document.title).toBe('Requête en indemnisation - Jean Dupont');
      expect(result.document.content).toContain('Jean Dupont');
      expect(result.document.content).toContain('une indemnisation pour préjudice');
      expect(result.document.content).toContain('Alger');
      expect(result.document.content).toContain('Maître Ahmed Benali');
      expect(result.document.ownerId).toBe(testUserId);
      expect(result.document.templateId).toBe(template.id);
      expect(result.warnings).toBeDefined();
      expect(result.missingVariables).toHaveLength(0);

      // Verify document was saved to database
      const savedDoc = await documentService.getDocument(result.document.id, testUserId);
      expect(savedDoc).toBeDefined();
      expect(savedDoc?.title).toBe(result.document.title);
      expect(savedDoc?.content).toBe(result.document.content);

      console.log('✅ Document template and generation test passed');
    });
  });

  describe('Document Search and Filtering', () => {
    it('should search documents by content and metadata', async () => {
      // Search for documents created in previous test
      const searchResult = await documentService.searchDocuments(
        {
          query: 'Jean Dupont',
          type: DocumentType.REQUETE,
          limit: 10
        },
        testUserId
      );

      expect(searchResult).toBeDefined();
      expect(searchResult.documents).toBeDefined();
      expect(searchResult.totalCount).toBeGreaterThan(0);
      expect(searchResult.searchTime).toBeGreaterThan(0);

      // Check if our test document is in results
      const testDoc = searchResult.documents.find(doc => 
        doc.content.includes('Jean Dupont') && doc.type === DocumentType.REQUETE
      );
      expect(testDoc).toBeDefined();

      console.log('✅ Document search test passed');
    });
  });

  describe('Document Versioning', () => {
    it('should create and manage document versions', async () => {
      // Get a document to update
      const userDocs = await documentService.getUserDocuments(testUserId, { limit: 1 });
      expect(userDocs.length).toBeGreaterThan(0);

      const document = userDocs[0];
      const originalContent = document.content;

      // Update document content
      document.content = originalContent + '\n\nMISE À JOUR: Ajout de précisions sur le préjudice subi.';

      // Save updated document
      const version = await documentService.saveDocument(
        document,
        testUserId,
        'Ajout de précisions sur le préjudice'
      );

      expect(version).toBeDefined();
      expect(version.version).toBeGreaterThan(1);
      expect(version.changes).toBe('Ajout de précisions sur le préjudice');
      expect(version.createdBy).toBe(testUserId);

      // Verify document was updated
      const updatedDoc = await documentService.getDocument(document.id, testUserId);
      expect(updatedDoc).toBeDefined();
      expect(updatedDoc?.content).toContain('MISE À JOUR');
      expect(updatedDoc?.versions.length).toBeGreaterThan(0);

      console.log('✅ Document versioning test passed');
    });
  });

  describe('Document Export', () => {
    it('should export document in different formats', async () => {
      // Get a document to export
      const userDocs = await documentService.getUserDocuments(testUserId, { limit: 1 });
      expect(userDocs.length).toBeGreaterThan(0);

      const document = userDocs[0];

      // Test HTML export
      const htmlExport = await documentService.exportDocument(
        document.id,
        testUserId,
        {
          format: 'html',
          includeMetadata: true,
          includeSignatures: false,
          includeAttachments: false
        }
      );

      expect(htmlExport).toBeInstanceOf(Buffer);
      const htmlContent = htmlExport.toString('utf-8');
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain(document.title);

      // Test text export
      const txtExport = await documentService.exportDocument(
        document.id,
        testUserId,
        {
          format: 'txt',
          includeMetadata: false,
          includeSignatures: false,
          includeAttachments: false
        }
      );

      expect(txtExport).toBeInstanceOf(Buffer);
      const txtContent = txtExport.toString('utf-8');
      expect(txtContent).toBe(document.content);

      console.log('✅ Document export test passed');
    });
  });

  describe('File Storage Integration', () => {
    it('should upload and manage file attachments', async () => {
      // Get a document to attach files to
      const userDocs = await documentService.getUserDocuments(testUserId, { limit: 1 });
      expect(userDocs.length).toBeGreaterThan(0);

      const document = userDocs[0];

      // Create test file
      const testFileContent = Buffer.from('This is a test PDF file content');
      const filename = 'test-attachment.pdf';
      const mimeType = 'application/pdf';

      // Upload file
      const uploadResult = await fileStorageService.uploadFile(
        document.id,
        testFileContent,
        filename,
        mimeType,
        testUserId,
        { encrypt: false }
      );

      expect(uploadResult).toBeDefined();
      expect(uploadResult.attachment).toBeDefined();
      expect(uploadResult.attachment.originalFilename).toBe(filename);
      expect(uploadResult.attachment.mimeType).toBe(mimeType);
      expect(uploadResult.attachment.size).toBe(testFileContent.length);

      // Get document attachments
      const attachments = await fileStorageService.getDocumentAttachments(document.id, testUserId);
      expect(attachments.length).toBeGreaterThan(0);

      const testAttachment = attachments.find(att => att.originalFilename === filename);
      expect(testAttachment).toBeDefined();

      // Download file
      const downloadResult = await fileStorageService.downloadFile(
        uploadResult.attachment.id,
        testUserId
      );

      expect(downloadResult).toBeDefined();
      expect(downloadResult.buffer).toEqual(testFileContent);
      expect(downloadResult.attachment.originalFilename).toBe(filename);

      // Clean up - delete file
      await fileStorageService.deleteFile(uploadResult.attachment.id, testUserId);

      console.log('✅ File storage integration test passed');
    });
  });

  describe('Document Permissions and Sharing', () => {
    it('should manage document permissions and sharing', async () => {
      // Get a document to share
      const userDocs = await documentService.getUserDocuments(testUserId, { limit: 1 });
      expect(userDocs.length).toBeGreaterThan(0);

      const document = userDocs[0];

      // Create another test user to share with
      const shareUserId = 'share-user-789';
      try {
        await db.query(
          `INSERT INTO users (id, email, password_hash, is_verified, created_at)
           VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO NOTHING`,
          [shareUserId, 'share@example.com', 'hashed_password']
        );
      } catch (error) {
        // User might already exist
      }

      // Share document
      await documentService.shareDocument(
        document.id,
        shareUserId,
        ['read', 'write'] as any,
        testUserId
      );

      // Verify sharing worked by checking permissions
      const sharedDoc = await documentService.getDocument(document.id, testUserId);
      expect(sharedDoc).toBeDefined();
      expect(sharedDoc?.permissions.length).toBeGreaterThan(0);

      // Clean up share user
      try {
        await db.query('DELETE FROM document_permissions WHERE user_id = $1', [shareUserId]);
        await db.query('DELETE FROM users WHERE id = $1', [shareUserId]);
      } catch (error) {
        console.warn('Share user cleanup failed:', error);
      }

      console.log('✅ Document permissions and sharing test passed');
    });
  });
});