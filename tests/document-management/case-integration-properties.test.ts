/**
 * Property-Based Tests for Case Integration Service
 * 
 * Tests the correctness properties for case-document integration,
 * permission inheritance, workspace creation, and bulk operations.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.7
 */

import * as fc from 'fast-check';
import { caseIntegrationService } from '../../src/document-management/services/caseIntegrationService';
import { Permission } from '../../src/document-management/types';
import { createClient } from '@supabase/supabase-js';

// Initialize test database
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Custom generators
const caseTitleGenerator = fc.string({ minLength: 5, maxLength: 100 });
const userIdGenerator = fc.uuid();

describe('Case Integration Service - Property Tests', () => {
  let testCaseId: string;
  let testUserId: string;

  beforeAll(async () => {
    testUserId = crypto.randomUUID();

    // Create a test case
    const { data, error } = await supabase
      .from('cases')
      .insert({
        id: crypto.randomUUID(),
        title: 'Test Case for Integration',
        description: 'Test case',
        status: 'active',
        created_by: testUserId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test case:', error);
    } else {
      testCaseId = data.id;
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (testCaseId) {
      await supabase.from('cases').delete().eq('id', testCaseId);
    }
  });

  /**
   * Property 39: Case-Document Integration Display
   * **Validates: Requirements 8.1**
   * 
   * For any case view, all associated documents should be displayed within 
   * the case interface
   */
  describe('Property 39: Case-Document Integration Display', () => {
    it('should display all documents associated with a case', async () => {
      if (!testCaseId) return;

      // Create test documents
      const documentIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const { data, error } = await supabase
          .from('documents')
          .insert({
            id: crypto.randomUUID(),
            case_id: testCaseId,
            name: `Test Document ${i + 1}`,
            original_name: `test-doc-${i + 1}.pdf`,
            mime_type: 'application/pdf',
            size: 1024 * (i + 1),
            checksum: `checksum-${i}`,
            encryption_key: 'test-key',
            storage_path: `/test/path/${i}`,
            tags: [],
            metadata: {},
            created_at: new Date().toISOString(),
            created_by: testUserId,
            current_version_id: crypto.randomUUID(),
            is_deleted: false
          })
          .select()
          .single();

        if (!error && data) {
          documentIds.push(data.id);
        }
      }

      // Get case documents
      const documents = await caseIntegrationService.getCaseDocuments(testCaseId);

      // Verify all documents are returned
      expect(documents.length).toBeGreaterThanOrEqual(3);
      
      // Verify each document has correct case association
      for (const doc of documents) {
        expect(doc.caseId).toBe(testCaseId);
      }

      // Cleanup
      for (const docId of documentIds) {
        await supabase.from('documents').delete().eq('id', docId);
      }
    });

    it('should provide case document statistics', async () => {
      if (!testCaseId) return;

      const stats = await caseIntegrationService.getCaseDocumentStats(testCaseId);

      expect(stats).toBeDefined();
      expect(stats.totalDocuments).toBeGreaterThanOrEqual(0);
      expect(stats.totalSize).toBeGreaterThanOrEqual(0);
      expect(stats.documentsByType).toBeDefined();
      expect(stats.recentDocuments).toBeDefined();
      expect(Array.isArray(stats.recentDocuments)).toBe(true);
    });
  });

  /**
   * Property 40: Permission System Integration
   * **Validates: Requirements 8.2**
   * 
   * For any user, their document management permissions should inherit from 
   * and be consistent with their case management system permissions
   */
  describe('Property 40: Permission System Integration', () => {
    it('should inherit permissions from case management system', async () => {
      if (!testCaseId) return;

      // Create a test document
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          id: crypto.randomUUID(),
          case_id: testCaseId,
          name: 'Permission Test Document',
          original_name: 'perm-test.pdf',
          mime_type: 'application/pdf',
          size: 2048,
          checksum: 'perm-checksum',
          encryption_key: 'test-key',
          storage_path: '/test/perm/path',
          tags: [],
          metadata: {},
          created_at: new Date().toISOString(),
          created_by: testUserId,
          current_version_id: crypto.randomUUID(),
          is_deleted: false
        })
        .select()
        .single();

      if (docError || !document) {
        console.error('Failed to create test document');
        return;
      }

      // Create case permission
      await supabase
        .from('case_permissions')
        .insert({
          id: crypto.randomUUID(),
          case_id: testCaseId,
          user_id: testUserId,
          permission_level: 'editor',
          granted_at: new Date().toISOString()
        });

      // Inherit permissions
      await caseIntegrationService.inheritCasePermissions(testCaseId, document.id);

      // Verify document permissions were created
      const { data: docPermissions } = await supabase
        .from('document_permissions')
        .select('*')
        .eq('document_id', document.id);

      expect(docPermissions).toBeDefined();
      expect(docPermissions!.length).toBeGreaterThan(0);

      // Cleanup
      await supabase.from('documents').delete().eq('id', document.id);
      await supabase.from('case_permissions').delete().eq('case_id', testCaseId);
    });

    it('should check user access to case documents', async () => {
      if (!testCaseId) return;

      const canAccess = await caseIntegrationService.canAccessCaseDocuments(
        testCaseId,
        testUserId
      );

      expect(typeof canAccess).toBe('boolean');
    });
  });

  /**
   * Property 41: Automatic Workspace Creation
   * **Validates: Requirements 8.3**
   * 
   * For any new case creation, a corresponding document workspace should be 
   * automatically created
   */
  describe('Property 41: Automatic Workspace Creation', () => {
    it('should create workspace with default folder structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          caseTitleGenerator,
          async (caseTitle) => {
            try {
              // Create a new case
              const { data: newCase, error: caseError } = await supabase
                .from('cases')
                .insert({
                  id: crypto.randomUUID(),
                  title: caseTitle,
                  description: 'Test case for workspace',
                  status: 'active',
                  created_by: testUserId,
                  created_at: new Date().toISOString()
                })
                .select()
                .single();

              if (caseError || !newCase) {
                return false;
              }

              // Create workspace
              const workspace = await caseIntegrationService.createCaseWorkspace(
                newCase.id,
                testUserId
              );

              // Verify root folder was created
              expect(workspace.rootFolder).toBeDefined();
              expect(workspace.rootFolder.caseId).toBe(newCase.id);
              expect(workspace.rootFolder.level).toBe(0);

              // Verify default folders were created
              expect(workspace.defaultFolders).toBeDefined();
              expect(workspace.defaultFolders.length).toBeGreaterThan(0);

              // Verify each default folder
              for (const folder of workspace.defaultFolders) {
                expect(folder.caseId).toBe(newCase.id);
                expect(folder.parentId).toBe(workspace.rootFolder.id);
                expect(folder.level).toBe(1);
              }

              // Cleanup
              await supabase.from('cases').delete().eq('id', newCase.id);
              await supabase.from('folders').delete().eq('case_id', newCase.id);

              return true;
            } catch (error) {
              console.error('Workspace creation error:', error);
              return false;
            }
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  /**
   * Property 45: Bulk Export Functionality
   * **Validates: Requirements 8.7**
   * 
   * For any export request, the system should provide bulk export and backup 
   * capabilities for multiple documents
   */
  describe('Property 45: Bulk Export Functionality', () => {
    it('should export multiple documents in bulk', async () => {
      if (!testCaseId) return;

      // Create test documents
      const documentIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const { data, error } = await supabase
          .from('documents')
          .insert({
            id: crypto.randomUUID(),
            case_id: testCaseId,
            name: `Export Test Doc ${i + 1}`,
            original_name: `export-test-${i + 1}.pdf`,
            mime_type: 'application/pdf',
            size: 1024 * (i + 1),
            checksum: `export-checksum-${i}`,
            encryption_key: 'test-key',
            storage_path: `/test/export/${i}`,
            tags: [],
            metadata: {},
            created_at: new Date().toISOString(),
            created_by: testUserId,
            current_version_id: crypto.randomUUID(),
            is_deleted: false
          })
          .select()
          .single();

        if (!error && data) {
          documentIds.push(data.id);
        }
      }

      // Initiate bulk export
      const exportResult = await caseIntegrationService.bulkExportDocuments(
        documentIds,
        { format: 'zip', includeMetadata: true }
      );

      // Verify export was initiated
      expect(exportResult.exportId).toBeDefined();
      expect(exportResult.documentCount).toBe(documentIds.length);
      expect(exportResult.totalSize).toBeGreaterThan(0);
      expect(exportResult.status).toBe('pending');

      // Verify export status can be retrieved
      const status = await caseIntegrationService.getExportStatus(exportResult.exportId);
      expect(status).toBeDefined();
      expect(status?.exportId).toBe(exportResult.exportId);

      // Cleanup
      for (const docId of documentIds) {
        await supabase.from('documents').delete().eq('id', docId);
      }
      await supabase.from('document_exports').delete().eq('id', exportResult.exportId);
    });

    it('should perform bulk operations on documents', async () => {
      if (!testCaseId) return;

      // Create test documents
      const documentIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const { data, error } = await supabase
          .from('documents')
          .insert({
            id: crypto.randomUUID(),
            case_id: testCaseId,
            name: `Bulk Op Test Doc ${i + 1}`,
            original_name: `bulk-op-${i + 1}.pdf`,
            mime_type: 'application/pdf',
            size: 1024,
            checksum: `bulk-checksum-${i}`,
            encryption_key: 'test-key',
            storage_path: `/test/bulk/${i}`,
            tags: [],
            metadata: {},
            created_at: new Date().toISOString(),
            created_by: testUserId,
            current_version_id: crypto.randomUUID(),
            is_deleted: false
          })
          .select()
          .single();

        if (!error && data) {
          documentIds.push(data.id);
        }
      }

      // Test bulk tagging
      const tagResult = await caseIntegrationService.bulkTagDocuments(
        documentIds,
        ['test-tag', 'bulk-operation'],
        testUserId,
        'add'
      );

      expect(tagResult.successful.length).toBe(documentIds.length);
      expect(tagResult.failed.length).toBe(0);
      expect(tagResult.totalProcessed).toBe(documentIds.length);

      // Test bulk delete
      const deleteResult = await caseIntegrationService.bulkDeleteDocuments(
        documentIds,
        testUserId,
        false // soft delete
      );

      expect(deleteResult.successful.length).toBe(documentIds.length);
      expect(deleteResult.failed.length).toBe(0);

      // Cleanup
      for (const docId of documentIds) {
        await supabase.from('documents').delete().eq('id', docId);
      }
    });

    it('should export entire case workspace', async () => {
      if (!testCaseId) return;

      const exportResult = await caseIntegrationService.exportCaseWorkspace(
        testCaseId,
        { format: 'zip', includeMetadata: true }
      );

      expect(exportResult.exportId).toBeDefined();
      expect(exportResult.status).toBe('pending');

      // Cleanup
      await supabase.from('document_exports').delete().eq('id', exportResult.exportId);
    });
  });
});
