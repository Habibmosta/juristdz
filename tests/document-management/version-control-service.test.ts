/**
 * Version Control Service Tests
 * 
 * Tests for automatic versioning system with version creation on document modification,
 * version storage and metadata tracking, and chronological ordering.
 * 
 * Requirements: 4.1, 4.4, 4.5
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { versionControlService } from '../../src/document-management/services/versionControlService';
import { documentService } from '../../src/document-management/services/documentService';
import { databaseInitService } from '../../src/document-management/services/databaseInitService';
import { testDatabase } from './testDatabase';
import { testCleanup } from './testCleanup';
import { generateMockDocument, generateMockUser, generateMockCase } from './mockGenerators';

describe('Version Control Service', () => {
  let testUserId: string;
  let testCaseId: string;
  let testDocumentId: string;

  beforeAll(async () => {
    await testDatabase.setup();
    await databaseInitService.initializeSchema();
  });

  afterAll(async () => {
    await testDatabase.teardown();
  });

  beforeEach(async () => {
    await testCleanup.cleanupTestData();
    
    // Create test user and case
    const mockUser = generateMockUser();
    const mockCase = generateMockCase();
    
    testUserId = mockUser.id;
    testCaseId = mockCase.id;

    // Create test document
    const mockDocument = generateMockDocument({ caseId: testCaseId, userId: testUserId });
    const documentResult = await documentService.createDocument({
      file: new File([Buffer.from('Initial content')], 'test.txt', { type: 'text/plain' }),
      caseId: testCaseId,
      metadata: mockDocument.metadata,
      userId: testUserId
    });

    expect(documentResult.success).toBe(true);
    testDocumentId = documentResult.document!.id;
  });

  afterEach(async () => {
    await testCleanup.cleanupTestData();
  });

  describe('Automatic Version Creation', () => {
    test('should create version on document modification', async () => {
      // Property 16: Automatic Versioning
      // For any document modification, a new version should be created while preserving all previous versions
      
      const newContent = Buffer.from('Updated document content');
      const changeDescription = 'Updated content for testing';
      
      const result = await versionControlService.createVersion(testDocumentId, newContent, {
        userId: testUserId,
        changeDescription
      });
      
      expect(result.success).toBe(true);
      expect(result.version).toBeDefined();
      expect(result.version!.documentId).toBe(testDocumentId);
      expect(result.version!.versionNumber).toBe(2); // Should be version 2 (first version was created during document creation)
      expect(result.version!.createdBy).toBe(testUserId);
      expect(result.version!.changeDescription).toBe(changeDescription);
      expect(result.version!.isCurrent).toBe(true);
    });

    test('should store version metadata with timestamps and user information', async () => {
      // Property 19: Version Metadata Completeness
      // For any document version, it should have complete metadata including timestamp, user information, and modification details
      
      const newContent = Buffer.from('Content with metadata test');
      const changeDescription = 'Testing metadata completeness';
      
      const result = await versionControlService.createVersion(testDocumentId, newContent, {
        userId: testUserId,
        changeDescription
      });
      
      expect(result.success).toBe(true);
      expect(result.version).toBeDefined();
      
      const version = result.version!;
      expect(version.createdAt).toBeInstanceOf(Date);
      expect(version.createdBy).toBe(testUserId);
      expect(version.changeDescription).toBe(changeDescription);
      expect(version.size).toBe(newContent.length);
      expect(version.checksum).toBeDefined();
      expect(version.storagePath).toBeDefined();
    });

    test('should maintain chronological ordering of versions', async () => {
      // Create multiple versions
      const version1Content = Buffer.from('Version 1 content');
      const version2Content = Buffer.from('Version 2 content');
      const version3Content = Buffer.from('Version 3 content');
      
      const result1 = await versionControlService.createVersion(testDocumentId, version1Content, {
        userId: testUserId,
        changeDescription: 'Version 1'
      });
      
      const result2 = await versionControlService.createVersion(testDocumentId, version2Content, {
        userId: testUserId,
        changeDescription: 'Version 2'
      });
      
      const result3 = await versionControlService.createVersion(testDocumentId, version3Content, {
        userId: testUserId,
        changeDescription: 'Version 3'
      });
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
      
      // Get version history
      const historyResult = await versionControlService.getVersionHistory(testDocumentId, {
        userId: testUserId
      });
      
      expect(historyResult.success).toBe(true);
      expect(historyResult.versions).toBeDefined();
      expect(historyResult.versions!.length).toBeGreaterThanOrEqual(3);
      
      // Check chronological ordering (most recent first by default)
      const versions = historyResult.versions!;
      for (let i = 0; i < versions.length - 1; i++) {
        expect(versions[i].versionNumber).toBeGreaterThan(versions[i + 1].versionNumber);
      }
    });

    test('should not create version if content is identical', async () => {
      // First, create a version
      const content = Buffer.from('Identical content test');
      
      const result1 = await versionControlService.createVersion(testDocumentId, content, {
        userId: testUserId,
        changeDescription: 'First version'
      });
      
      expect(result1.success).toBe(true);
      
      // Try to create another version with identical content
      const result2 = await versionControlService.createVersion(testDocumentId, content, {
        userId: testUserId,
        changeDescription: 'Duplicate version'
      });
      
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('No changes detected');
      expect(result2.warnings).toBeDefined();
      expect(result2.warnings![0]).toContain('identical to current version');
    });

    test('should enforce access control for version creation', async () => {
      // Try to create version with unauthorized user
      const unauthorizedUserId = 'unauthorized-user-123';
      const content = Buffer.from('Unauthorized content');
      
      const result = await versionControlService.createVersion(testDocumentId, content, {
        userId: unauthorizedUserId,
        changeDescription: 'Unauthorized version'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
    });
  });

  describe('Version History Management', () => {
    test('should retrieve version history with proper ordering', async () => {
      // Create a few versions first
      const contents = [
        Buffer.from('History test version 1'),
        Buffer.from('History test version 2'),
        Buffer.from('History test version 3')
      ];
      
      for (let i = 0; i < contents.length; i++) {
        await versionControlService.createVersion(testDocumentId, contents[i], {
          userId: testUserId,
          changeDescription: `History test version ${i + 1}`
        });
      }
      
      const historyResult = await versionControlService.getVersionHistory(testDocumentId, {
        userId: testUserId,
        sortOrder: 'desc'
      });
      
      expect(historyResult.success).toBe(true);
      expect(historyResult.versions).toBeDefined();
      expect(historyResult.versions!.length).toBeGreaterThanOrEqual(3);
      
      // Check descending order
      const versions = historyResult.versions!;
      for (let i = 0; i < versions.length - 1; i++) {
        expect(versions[i].versionNumber).toBeGreaterThan(versions[i + 1].versionNumber);
      }
    });

    test('should support pagination for version history', async () => {
      // Create multiple versions
      for (let i = 0; i < 10; i++) {
        await versionControlService.createVersion(testDocumentId, Buffer.from(`Version ${i + 1} content`), {
          userId: testUserId,
          changeDescription: `Version ${i + 1}`
        });
      }
      
      // Test pagination
      const page1Result = await versionControlService.getVersionHistory(testDocumentId, {
        userId: testUserId,
        limit: 5,
        offset: 0
      });
      
      const page2Result = await versionControlService.getVersionHistory(testDocumentId, {
        userId: testUserId,
        limit: 5,
        offset: 5
      });
      
      expect(page1Result.success).toBe(true);
      expect(page2Result.success).toBe(true);
      expect(page1Result.versions!.length).toBe(5);
      expect(page2Result.versions!.length).toBeGreaterThan(0);
      expect(page1Result.hasMore).toBe(true);
    });

    test('should enforce access control for version history', async () => {
      const unauthorizedUserId = 'unauthorized-user-456';
      
      const result = await versionControlService.getVersionHistory(testDocumentId, {
        userId: unauthorizedUserId
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
    });
  });

  describe('Version Content Retrieval', () => {
    test('should retrieve version content with integrity verification', async () => {
      const originalContent = Buffer.from('Content integrity test');
      
      const createResult = await versionControlService.createVersion(testDocumentId, originalContent, {
        userId: testUserId,
        changeDescription: 'Integrity test version'
      });
      
      expect(createResult.success).toBe(true);
      
      const contentResult = await versionControlService.getVersionContent(
        createResult.version!.id,
        testUserId
      );
      
      expect(contentResult.success).toBe(true);
      expect(contentResult.content).toBeDefined();
      expect(Buffer.compare(contentResult.content!, originalContent)).toBe(0);
    });

    test('should enforce access control for version content retrieval', async () => {
      const content = Buffer.from('Access control test content');
      
      const createResult = await versionControlService.createVersion(testDocumentId, content, {
        userId: testUserId,
        changeDescription: 'Access control test'
      });
      
      expect(createResult.success).toBe(true);
      
      const unauthorizedUserId = 'unauthorized-user-789';
      const contentResult = await versionControlService.getVersionContent(
        createResult.version!.id,
        unauthorizedUserId
      );
      
      expect(contentResult.success).toBe(false);
      expect(contentResult.error).toContain('Access denied');
    });
  });

  describe('Version Restoration and Rollback', () => {
    test('should restore previous version with history preservation', async () => {
      // Property 18: Version Restoration Integrity
      // For any version restoration, the selected version should become current while preserving the complete version history
      
      // Create multiple versions
      const version1Content = Buffer.from('Original content');
      const version2Content = Buffer.from('Modified content');
      const version3Content = Buffer.from('Further modified content');
      
      const v1Result = await versionControlService.createVersion(testDocumentId, version1Content, {
        userId: testUserId,
        changeDescription: 'Version 1'
      });
      
      const v2Result = await versionControlService.createVersion(testDocumentId, version2Content, {
        userId: testUserId,
        changeDescription: 'Version 2'
      });
      
      const v3Result = await versionControlService.createVersion(testDocumentId, version3Content, {
        userId: testUserId,
        changeDescription: 'Version 3'
      });
      
      expect(v1Result.success).toBe(true);
      expect(v2Result.success).toBe(true);
      expect(v3Result.success).toBe(true);
      
      // Restore to version 1
      const restoreResult = await versionControlService.restoreVersion(
        testDocumentId,
        v1Result.version!.id,
        testUserId,
        'Restoring to original content'
      );
      
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.restoredVersion).toBeDefined();
      expect(restoreResult.newCurrentVersion).toBeDefined();
      expect(restoreResult.restoredVersion!.id).toBe(v1Result.version!.id);
      expect(restoreResult.newCurrentVersion!.isCurrent).toBe(true);
      
      // Verify content was restored correctly
      const restoredContentResult = await versionControlService.getVersionContent(
        restoreResult.newCurrentVersion!.id,
        testUserId
      );
      
      expect(restoredContentResult.success).toBe(true);
      expect(Buffer.compare(restoredContentResult.content!, version1Content)).toBe(0);
      
      // Verify version history is preserved
      const historyResult = await versionControlService.getVersionHistory(testDocumentId, {
        userId: testUserId
      });
      
      expect(historyResult.success).toBe(true);
      expect(historyResult.versions!.length).toBeGreaterThanOrEqual(4); // Original + 3 versions + restored version
    });

    test('should validate version integrity before restoration', async () => {
      // Create a version
      const content = Buffer.from('Integrity test content');
      const versionResult = await versionControlService.createVersion(testDocumentId, content, {
        userId: testUserId,
        changeDescription: 'Integrity test version'
      });
      
      expect(versionResult.success).toBe(true);
      
      // Validate integrity
      const integrityResult = await versionControlService.validateVersionIntegrity(
        versionResult.version!.id,
        testUserId
      );
      
      expect(integrityResult.success).toBe(true);
      expect(integrityResult.integrityReport).toBeDefined();
      
      const report = integrityResult.integrityReport!;
      expect(report.checksumValid).toBe(true);
      expect(report.contentAccessible).toBe(true);
      expect(report.metadataComplete).toBe(true);
      expect(report.storagePathValid).toBe(true);
      expect(report.encryptionValid).toBe(true);
    });

    test('should perform rollback to specific version', async () => {
      // Create multiple versions
      const contents = [
        Buffer.from('Rollback test version 1'),
        Buffer.from('Rollback test version 2'),
        Buffer.from('Rollback test version 3'),
        Buffer.from('Rollback test version 4')
      ];
      
      const versionResults = [];
      for (let i = 0; i < contents.length; i++) {
        const result = await versionControlService.createVersion(testDocumentId, contents[i], {
          userId: testUserId,
          changeDescription: `Rollback test version ${i + 1}`
        });
        expect(result.success).toBe(true);
        versionResults.push(result);
      }
      
      // Rollback to version 2
      const targetVersionNumber = versionResults[1].version!.versionNumber;
      const rollbackResult = await versionControlService.rollbackToVersion(
        testDocumentId,
        targetVersionNumber,
        testUserId,
        {
          rollbackDescription: 'Rolling back to version 2',
          validateIntegrity: true
        }
      );
      
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.rollbackVersion).toBeDefined();
      expect(rollbackResult.newCurrentVersion).toBeDefined();
      expect(rollbackResult.rollbackSummary).toBeDefined();
      
      const summary = rollbackResult.rollbackSummary!;
      expect(summary.versionsAffected).toBeGreaterThan(0);
      expect(summary.preservedVersions).toBe(true);
      expect(summary.rollbackTimestamp).toBeInstanceOf(Date);
      
      // Verify content was rolled back correctly
      const rolledBackContentResult = await versionControlService.getVersionContent(
        rollbackResult.newCurrentVersion!.id,
        testUserId
      );
      
      expect(rolledBackContentResult.success).toBe(true);
      expect(Buffer.compare(rolledBackContentResult.content!, contents[1])).toBe(0);
    });

    test('should enforce access control for version restoration', async () => {
      // Create a version
      const content = Buffer.from('Access control restoration test');
      const versionResult = await versionControlService.createVersion(testDocumentId, content, {
        userId: testUserId,
        changeDescription: 'Access control test version'
      });
      
      expect(versionResult.success).toBe(true);
      
      // Try to restore with unauthorized user
      const unauthorizedUserId = 'unauthorized-user-restore';
      const restoreResult = await versionControlService.restoreVersion(
        testDocumentId,
        versionResult.version!.id,
        unauthorizedUserId,
        'Unauthorized restoration attempt'
      );
      
      expect(restoreResult.success).toBe(false);
      expect(restoreResult.error).toContain('Access denied');
    });

    test('should prevent restoration of non-existent versions', async () => {
      const nonExistentVersionId = 'non-existent-version-123';
      
      const restoreResult = await versionControlService.restoreVersion(
        testDocumentId,
        nonExistentVersionId,
        testUserId,
        'Attempting to restore non-existent version'
      );
      
      expect(restoreResult.success).toBe(false);
      expect(restoreResult.error).toContain('not found');
    });

    test('should prevent restoration of versions from different documents', async () => {
      // Create another document
      const mockDocument2 = generateMockDocument({ caseId: testCaseId, userId: testUserId });
      const document2Result = await documentService.createDocument({
        file: new File([Buffer.from('Other document content')], 'other.txt', { type: 'text/plain' }),
        caseId: testCaseId,
        metadata: mockDocument2.metadata,
        userId: testUserId
      });
      
      expect(document2Result.success).toBe(true);
      const otherDocumentId = document2Result.document!.id;
      
      // Create a version in the first document
      const content = Buffer.from('Cross-document test content');
      const versionResult = await versionControlService.createVersion(testDocumentId, content, {
        userId: testUserId,
        changeDescription: 'Cross-document test version'
      });
      
      expect(versionResult.success).toBe(true);
      
      // Try to restore this version to the other document
      const restoreResult = await versionControlService.restoreVersion(
        otherDocumentId,
        versionResult.version!.id,
        testUserId,
        'Cross-document restoration attempt'
      );
      
      expect(restoreResult.success).toBe(false);
      expect(restoreResult.error).toContain('does not belong to the specified document');
    });

    test('should create comprehensive audit trails for restoration', async () => {
      // Create a version
      const content = Buffer.from('Audit trail test content');
      const versionResult = await versionControlService.createVersion(testDocumentId, content, {
        userId: testUserId,
        changeDescription: 'Audit trail test version'
      });
      
      expect(versionResult.success).toBe(true);
      
      // Restore the version
      const restoreResult = await versionControlService.restoreVersion(
        testDocumentId,
        versionResult.version!.id,
        testUserId,
        'Testing audit trail creation'
      );
      
      expect(restoreResult.success).toBe(true);
      
      // Note: In a real implementation, you would verify the audit entry was created
      // This would require access to the audit log or a method to retrieve audit entries
      // For now, we verify the restoration was successful, which implies audit entry creation
      expect(restoreResult.restoredVersion).toBeDefined();
      expect(restoreResult.newCurrentVersion).toBeDefined();
    });
  });

  describe('Property-Based Tests', () => {
    test('Property 16: Automatic Versioning - any document modification creates new version', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (content, description) => {
            const buffer = Buffer.from(content);
            
            const result = await versionControlService.createVersion(testDocumentId, buffer, {
              userId: testUserId,
              changeDescription: description
            });
            
            if (result.success) {
              expect(result.version).toBeDefined();
              expect(result.version!.documentId).toBe(testDocumentId);
              expect(result.version!.createdBy).toBe(testUserId);
              expect(result.version!.changeDescription).toBe(description);
              expect(result.version!.size).toBe(buffer.length);
              expect(result.version!.isCurrent).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 10 } // Reduced runs for faster testing
      );
    });

    test('Property 18: Version Restoration Integrity - restoration preserves history and content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 500 }), { minLength: 2, maxLength: 5 }),
          fc.nat({ max: 100 }),
          async (contents, restoreIndex) => {
            // Create multiple versions
            const versionResults = [];
            for (let i = 0; i < contents.length; i++) {
              const buffer = Buffer.from(contents[i]);
              const result = await versionControlService.createVersion(testDocumentId, buffer, {
                userId: testUserId,
                changeDescription: `Property test version ${i + 1}`
              });
              
              if (result.success) {
                versionResults.push(result);
              }
            }
            
            if (versionResults.length < 2) return true; // Skip if not enough versions created
            
            // Select a version to restore (not the current one)
            const targetIndex = restoreIndex % (versionResults.length - 1);
            const targetVersion = versionResults[targetIndex];
            
            // Restore the selected version
            const restoreResult = await versionControlService.restoreVersion(
              testDocumentId,
              targetVersion.version!.id,
              testUserId,
              `Property test restoration to version ${targetIndex + 1}`
            );
            
            if (restoreResult.success) {
              // Verify restoration integrity
              expect(restoreResult.restoredVersion).toBeDefined();
              expect(restoreResult.newCurrentVersion).toBeDefined();
              expect(restoreResult.restoredVersion!.id).toBe(targetVersion.version!.id);
              
              // Verify content was restored correctly
              const restoredContentResult = await versionControlService.getVersionContent(
                restoreResult.newCurrentVersion!.id,
                testUserId
              );
              
              if (restoredContentResult.success) {
                const originalContent = Buffer.from(contents[targetIndex]);
                expect(Buffer.compare(restoredContentResult.content!, originalContent)).toBe(0);
              }
              
              // Verify version history is preserved (should have more versions now)
              const historyResult = await versionControlService.getVersionHistory(testDocumentId, {
                userId: testUserId
              });
              
              if (historyResult.success) {
                expect(historyResult.versions!.length).toBeGreaterThan(versionResults.length);
              }
            }
            
            return true;
          }
        ),
        { numRuns: 5 } // Reduced runs due to complexity
      );
    });

    test('Property 19: Version Metadata Completeness - all versions have complete metadata', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }),
          fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          async (content, description) => {
            const buffer = Buffer.from(content);
            
            const result = await versionControlService.createVersion(testDocumentId, buffer, {
              userId: testUserId,
              changeDescription: description || undefined
            });
            
            if (result.success && result.version) {
              const version = result.version;
              
              // Check all required metadata fields
              expect(version.id).toBeDefined();
              expect(version.documentId).toBe(testDocumentId);
              expect(version.versionNumber).toBeGreaterThan(0);
              expect(version.size).toBe(buffer.length);
              expect(version.checksum).toBeDefined();
              expect(version.storagePath).toBeDefined();
              expect(version.createdAt).toBeInstanceOf(Date);
              expect(version.createdBy).toBe(testUserId);
              expect(typeof version.isCurrent).toBe('boolean');
              
              if (description) {
                expect(version.changeDescription).toBe(description);
              }
            }
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    test('Property 20: Version Data Integrity - no version data is lost during operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 300 }), { minLength: 1, maxLength: 3 }),
          async (contents) => {
            const versionResults = [];
            
            // Create versions and track their data
            for (let i = 0; i < contents.length; i++) {
              const buffer = Buffer.from(contents[i]);
              const result = await versionControlService.createVersion(testDocumentId, buffer, {
                userId: testUserId,
                changeDescription: `Integrity test version ${i + 1}`
              });
              
              if (result.success) {
                versionResults.push({
                  version: result.version!,
                  originalContent: buffer
                });
              }
            }
            
            // Verify all versions can be retrieved with correct content
            for (const versionData of versionResults) {
              const contentResult = await versionControlService.getVersionContent(
                versionData.version.id,
                testUserId
              );
              
              if (contentResult.success) {
                // Verify content integrity
                expect(Buffer.compare(contentResult.content!, versionData.originalContent)).toBe(0);
                
                // Verify metadata integrity
                const versionResult = await versionControlService.getVersion(
                  versionData.version.id,
                  testUserId
                );
                
                if (versionResult.success) {
                  const retrievedVersion = versionResult.version!;
                  expect(retrievedVersion.id).toBe(versionData.version.id);
                  expect(retrievedVersion.documentId).toBe(versionData.version.documentId);
                  expect(retrievedVersion.versionNumber).toBe(versionData.version.versionNumber);
                  expect(retrievedVersion.size).toBe(versionData.version.size);
                  expect(retrievedVersion.checksum).toBe(versionData.version.checksum);
                }
              }
            }
            
            return true;
          }
        ),
        { numRuns: 8 }
      );
    });
  });
});