/**
 * Basic Unit Tests for Workflow Management Service
 * 
 * Tests the core functionality of the workflow service to ensure
 * it's working correctly before running property-based tests.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { workflowService } from '../../src/document-management/services/workflowService';
import { 
  DocumentWorkflowStatus, 
  WorkflowStepStatus, 
  WorkflowStepType 
} from '../../src/document-management/types';
import { createClient } from '@supabase/supabase-js';

// Initialize test database
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Workflow Service - Basic Tests', () => {
  let testDocumentId: string;
  let testUserId: string;
  let testCaseId: string;

  beforeAll(async () => {
    testUserId = crypto.randomUUID();
    testCaseId = crypto.randomUUID();

    // Create a test document
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          id: crypto.randomUUID(),
          case_id: testCaseId,
          name: 'Test Document for Workflows',
          original_name: 'test-workflow-doc.pdf',
          mime_type: 'application/pdf',
          size: 2048,
          checksum: 'test-checksum-workflow',
          encryption_key: 'test-key',
          storage_path: '/test/workflow/path',
          tags: [],
          metadata: { category: 'contract' },
          created_at: new Date().toISOString(),
          created_by: testUserId,
          current_version_id: crypto.randomUUID(),
          is_deleted: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating test document:', error);
        throw error;
      } else {
        testDocumentId = data.id;
        console.log('✅ Test document created:', testDocumentId);
      }
    } catch (error) {
      console.error('Failed to create test document:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (testDocumentId) {
      await supabase.from('documents').delete().eq('id', testDocumentId);
    }
  });

  describe('Workflow Creation', () => {
    it('should create a basic workflow with one step', async () => {
      const steps = [
        {
          name: 'Initial Review',
          description: 'First review step',
          type: WorkflowStepType.REVIEW,
          assigneeType: 'user' as const,
          assigneeId: testUserId
        }
      ];

      const workflow = await workflowService.createWorkflow(
        {
          documentId: testDocumentId,
          name: 'Basic Test Workflow',
          steps
        },
        testUserId
      );

      expect(workflow).toBeDefined();
      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBe('Basic Test Workflow');
      expect(workflow.documentId).toBe(testDocumentId);
      expect(workflow.status).toBe(DocumentWorkflowStatus.DRAFT);
      expect(workflow.steps).toHaveLength(1);
      expect(workflow.steps[0].name).toBe('Initial Review');

      // Cleanup
      await supabase
        .from('document_workflows')
        .delete()
        .eq('id', workflow.id);
    });

    it('should create a workflow with multiple steps', async () => {
      const steps = [
        {
          name: 'Step 1',
          description: 'First step',
          type: WorkflowStepType.REVIEW,
          assigneeType: 'user' as const,
          assigneeId: testUserId
        },
        {
          name: 'Step 2',
          description: 'Second step',
          type: WorkflowStepType.APPROVAL,
          assigneeType: 'user' as const,
          assigneeId: testUserId
        }
      ];

      const workflow = await workflowService.createWorkflow(
        {
          documentId: testDocumentId,
          name: 'Multi-Step Workflow',
          steps
        },
        testUserId
      );

      expect(workflow.steps).toHaveLength(2);
      expect(workflow.steps[0].stepNumber).toBe(1);
      expect(workflow.steps[1].stepNumber).toBe(2);

      // Cleanup
      await supabase
        .from('document_workflows')
        .delete()
        .eq('id', workflow.id);
    });
  });

  describe('Workflow State Management', () => {
    it('should start a workflow', async () => {
      const steps = [
        {
          name: 'Review Step',
          description: 'Review',
          type: WorkflowStepType.REVIEW,
          assigneeType: 'user' as const,
          assigneeId: testUserId
        }
      ];

      const workflow = await workflowService.createWorkflow(
        {
          documentId: testDocumentId,
          name: 'Start Test Workflow',
          steps
        },
        testUserId
      );

      await workflowService.startWorkflow(workflow.id, testUserId);

      const updatedWorkflow = await workflowService.getWorkflow(workflow.id);
      expect(updatedWorkflow?.status).toBe(DocumentWorkflowStatus.ACTIVE);
      expect(updatedWorkflow?.currentStep).toBe(1);

      // Cleanup
      await supabase
        .from('document_workflows')
        .delete()
        .eq('id', workflow.id);
    });
  });

  describe('Document Locking', () => {
    it('should lock document when workflow is active', async () => {
      const steps = [
        {
          name: 'Lock Test Step',
          description: 'Test locking',
          type: WorkflowStepType.REVIEW,
          assigneeType: 'user' as const,
          assigneeId: testUserId
        }
      ];

      const workflow = await workflowService.createWorkflow(
        {
          documentId: testDocumentId,
          name: 'Lock Test Workflow',
          steps
        },
        testUserId
      );

      // Document should not be locked in draft
      let isLocked = await workflowService.isDocumentLocked(testDocumentId);
      expect(isLocked).toBe(false);

      // Start workflow
      await workflowService.startWorkflow(workflow.id, testUserId);

      // Document should be locked now
      isLocked = await workflowService.isDocumentLocked(testDocumentId);
      expect(isLocked).toBe(true);

      // Cleanup
      await supabase
        .from('document_workflows')
        .delete()
        .eq('id', workflow.id);
    });
  });

  describe('Workflow Progress Tracking', () => {
    it('should track workflow progress', async () => {
      const steps = [
        {
          name: 'Progress Step 1',
          description: 'First step',
          type: WorkflowStepType.REVIEW,
          assigneeType: 'user' as const,
          assigneeId: testUserId
        },
        {
          name: 'Progress Step 2',
          description: 'Second step',
          type: WorkflowStepType.APPROVAL,
          assigneeType: 'user' as const,
          assigneeId: testUserId
        }
      ];

      const workflow = await workflowService.createWorkflow(
        {
          documentId: testDocumentId,
          name: 'Progress Test Workflow',
          steps
        },
        testUserId
      );

      await workflowService.startWorkflow(workflow.id, testUserId);

      const progress = await workflowService.getWorkflowProgress(workflow.id);

      expect(progress.workflowId).toBe(workflow.id);
      expect(progress.status).toBe(DocumentWorkflowStatus.ACTIVE);
      expect(progress.totalSteps).toBe(2);
      expect(progress.completedSteps).toBe(0);
      expect(progress.currentStepNumber).toBe(1);
      expect(progress.progress).toBe(0);

      // Cleanup
      await supabase
        .from('document_workflows')
        .delete()
        .eq('id', workflow.id);
    });
  });
});
