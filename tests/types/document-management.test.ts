/**
 * Unit tests for Document Management System core types
 * 
 * These tests verify that the core interfaces and enums are properly defined
 * and can be used correctly in TypeScript code.
 */

import {
  Document,
  DocumentCategory,
  ConfidentialityLevel,
  Permission,
  DocumentMetadata,
  Folder,
  DocumentVersion,
  DocumentPermission,
  ShareLink,
  UserRole,
  Language
} from '../../types/document-management';

describe('Document Management Types', () => {
  describe('Enums', () => {
    test('DocumentCategory enum should have correct values', () => {
      expect(DocumentCategory.CONTRACT).toBe('contract');
      expect(DocumentCategory.PLEADING).toBe('pleading');
      expect(DocumentCategory.EVIDENCE).toBe('evidence');
      expect(DocumentCategory.CORRESPONDENCE).toBe('correspondence');
      expect(DocumentCategory.TEMPLATE).toBe('template');
      expect(DocumentCategory.OTHER).toBe('other');
    });

    test('ConfidentialityLevel enum should have correct values', () => {
      expect(ConfidentialityLevel.PUBLIC).toBe('public');
      expect(ConfidentialityLevel.INTERNAL).toBe('internal');
      expect(ConfidentialityLevel.CONFIDENTIAL).toBe('confidential');
      expect(ConfidentialityLevel.RESTRICTED).toBe('restricted');
    });

    test('Permission enum should have correct values', () => {
      expect(Permission.VIEW).toBe('view');
      expect(Permission.EDIT).toBe('edit');
      expect(Permission.DELETE).toBe('delete');
      expect(Permission.SHARE).toBe('share');
      expect(Permission.SIGN).toBe('sign');
    });
  });

  describe('Interfaces', () => {
    test('Document interface should be properly typed', () => {
      const mockDocument: Document = {
        id: 'doc-123',
        caseId: 'case-456',
        name: 'Test Document',
        originalName: 'test-document.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
        checksum: 'abc123def456',
        encryptionKey: 'key-789',
        storagePath: '/encrypted/storage/doc-123',
        folderId: 'folder-001',
        tags: ['contract', 'important'],
        metadata: {
          category: DocumentCategory.CONTRACT,
          confidentialityLevel: ConfidentialityLevel.CONFIDENTIAL,
          customFields: {
            clientName: 'John Doe',
            contractValue: 50000
          }
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        createdBy: 'user-123',
        currentVersionId: 'version-001',
        isDeleted: false
      };

      expect(mockDocument.id).toBe('doc-123');
      expect(mockDocument.metadata.category).toBe(DocumentCategory.CONTRACT);
      expect(mockDocument.metadata.confidentialityLevel).toBe(ConfidentialityLevel.CONFIDENTIAL);
    });

    test('Folder interface should be properly typed', () => {
      const mockFolder: Folder = {
        id: 'folder-123',
        caseId: 'case-456',
        name: 'Contracts',
        parentId: 'folder-parent',
        path: '/root/contracts',
        level: 1,
        createdAt: new Date('2024-01-01'),
        createdBy: 'user-123',
        isDeleted: false
      };

      expect(mockFolder.id).toBe('folder-123');
      expect(mockFolder.level).toBe(1);
      expect(mockFolder.path).toBe('/root/contracts');
    });

    test('DocumentVersion interface should be properly typed', () => {
      const mockVersion: DocumentVersion = {
        id: 'version-123',
        documentId: 'doc-456',
        versionNumber: 2,
        size: 1024000,
        checksum: 'version-checksum-123',
        storagePath: '/versions/doc-456/v2',
        createdAt: new Date('2024-01-01'),
        createdBy: 'user-123',
        changeDescription: 'Updated contract terms',
        isCurrent: true
      };

      expect(mockVersion.versionNumber).toBe(2);
      expect(mockVersion.isCurrent).toBe(true);
      expect(mockVersion.changeDescription).toBe('Updated contract terms');
    });

    test('DocumentPermission interface should be properly typed', () => {
      const mockPermission: DocumentPermission = {
        id: 'perm-123',
        documentId: 'doc-456',
        userId: 'user-789',
        permission: Permission.EDIT,
        grantedBy: 'user-admin',
        grantedAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-12-31')
      };

      expect(mockPermission.permission).toBe(Permission.EDIT);
      expect(mockPermission.userId).toBe('user-789');
    });

    test('ShareLink interface should be properly typed', () => {
      const mockShareLink: ShareLink = {
        id: 'share-123',
        documentId: 'doc-456',
        token: 'secure-token-abc123',
        permissions: [Permission.VIEW, Permission.EDIT],
        expiresAt: new Date('2024-12-31'),
        createdBy: 'user-123',
        accessCount: 5,
        maxAccess: 10
      };

      expect(mockShareLink.permissions).toContain(Permission.VIEW);
      expect(mockShareLink.permissions).toContain(Permission.EDIT);
      expect(mockShareLink.accessCount).toBe(5);
    });
  });

  describe('Type compatibility', () => {
    test('Should work with re-exported UserRole and Language types', () => {
      // Test that UserRole enum is properly re-exported
      expect(UserRole.AVOCAT).toBe('avocat');
      expect(UserRole.NOTAIRE).toBe('notaire');
      
      // Test that Language enum is properly re-exported
      expect(Language.FRENCH).toBe('fr');
      expect(Language.ARABIC).toBe('ar');
    });

    test('DocumentMetadata should accept custom fields', () => {
      const metadata: DocumentMetadata = {
        description: 'Test document metadata',
        category: DocumentCategory.CONTRACT,
        confidentialityLevel: ConfidentialityLevel.INTERNAL,
        retentionPeriod: 365,
        customFields: {
          clientId: 'client-123',
          projectCode: 'PROJ-2024-001',
          priority: 'high',
          reviewRequired: true
        }
      };

      expect(metadata.customFields.clientId).toBe('client-123');
      expect(metadata.customFields.reviewRequired).toBe(true);
    });
  });
});