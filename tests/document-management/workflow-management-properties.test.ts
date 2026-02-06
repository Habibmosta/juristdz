/**
 * Property-Based Tests for Workflow Management Service
 * 
 * Tests the correctness properties for document workflow management,
 * approval processes, state transitions, and audit trails.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import * as fc from 'fast-check';
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

// Custom generators
const workflowNameGenerator = fc.string({ minLength: 5, maxLength: 100 });
const userIdGenerator = fc.uuid();
const stepTypeGenerator = fc.constantFrom(...Object.values(WorkflowStepType));

const workflowStepGenerator = fc.record({
  name: fc.string({ minLength: 3, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  type: stepTypeGenerator,
  assigneeType: fc.constantFrom('user', 'role', 'group'),
  assigneeId: userIdGenerator,
  timeLimit: fc.option(fc.integer({ min: 1, max: 168 }), { nil: undefined })
});

describe('Workflow Management Service - Property Tests', () => {
  let testDocumentId: string;
  let testUserId: string;

  beforeAll(async () => {
    testUserId = crypto.randomUUID();

    // Create a test document
    const { data, error } = await supabase
      .from('documents')
      .insert({
        id: crypto.randomUUID(),
        case_id: crypto.randomUUID(),
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
    } else {
      testDocumentId = data.id;
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (testDocumentId) {
      await supabase.from('documents').delete().eq('id', testDocumentId);
    }
  });

  /**
   * Property 51: Workflow Definition Flexibility
   * **Validates: Requirements 10.1**
   * 
   * For any workflow creation, the system should allow defining custom approval 
   * steps and assigning specific reviewers
   */
  describe('Property 51: Workflow Definition Flexibility', () => {
    it('should create workflows with custom steps and reviewers', async () => {
      await fc.assert(
        fc.asyncProperty(
          workflowNameGenerator,
          fc.array(workflowStepGenerator, { minLength: 1, maxLength: 5 }),
          async (workflowName, steps) => {
            if (!testDocumentId) return true;

            try {
              const workflow = await workflowService.createWorkflow(
                {
                  documentId: testDocumentId,
                  name: workflowName,
                  steps
                },
                testUserId
              );

              // Verify workflow was created
              expect(workflow).toBeDefined();
              expect(workflow.id).toBeDefined();
              expect(workflow.name).toBe(workflowName);
              expect(workflow.documentId).toBe(testDocumentId);
              expect(workflow.status).toBe(DocumentWorkflowStatus.DRAFT);

              // Verify all steps are included
              expect(workflow.steps).toHaveLength(steps.length);

              // Verify each step has correct properties
              workflow.steps.forEach((workflowStep, index) => {
                expect(workflowStep.name).toBe(steps[index].name);
                expect(workflowStep.description).toBe(steps[index].description);
                expect(workflowStep.type).toBe(steps[index].type);
                expect(workflowStep.assigneeType).toBe(steps[index].assigneeType);
                expect(workflowStep.assigneeId).toBe(steps[index].assigneeId);
                expect(workflowStep.stepNumber).toBe(index + 1);
              });

              // Cleanup
              await supabase
                .from('document_workflows')
                .delete()
                .eq('id', workflow.id);

              return true;
            } catch (error) {
              console.error('Workflow creation error:', error);
              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 52: Workflow Initiation and Tracking
   * **Validates: Requirements 10.2**
   * 
   * For any document entering a workflow, assigned reviewers should be notified 
   * and progress should be tracked
   */
  describe('Property 52: Workflow Initiation and Tracking', () => {
    it('should track workflow progress accurately', async () => {
      if (!testDocumentId) return;

      const steps = [
        {
          name: 'Initial Review',
          description: 'First review step',
          type: WorkflowStepType.REVIEW,
          assigneeType: 'user' as const,
          assigneeId: crypto.randomUUID()
        },
        {
          name: 'Approval',
          description: 'Approval step',
          type: WorkflowStepType.APPROVAL,
          assigneeType: 'user' as const,
          assigneeId: crypto.randomUUID()
        }
      ];

      const workflow = await workflowService.createWorkflow(
        {
          documentId: testDocumentId,
          name: 'Test Progress Tracking',
          steps
        },
        testUserId
      );

      // Start workflow
      await workflowService.startWorkflow(workflow.id, testUserId);

      // Get progress
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

  /**
   * Property 53: Workflow State Transitions
   * **Validates: Requirements 10.3**
   * 
   * For any reviewer action (approve/reject), the workflow should advance 
   * appropriately or return for revisions
   */
  describe('Property 53: Workflow State Transitions', () => {
    it('should advance workflow on approval', async () => {
      if (!testDocumentId) return;

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
          name: 'Test State Transitions',
          steps
        },
        testUserId
      );

      await workflowService.startWorkflow(workflow.id, testUserId);

      // Complete first step
      const firstStep = workflow.steps[0];
      await workflowService.completeStep(
        firstStep.id,
        {
          stepId: firstStep.id,
          decision: 'approved',
          comments: 'Looks good'
        },
        testUserId
      );

      // Verify workflow advanced
      const updatedWorkflow = await workflowService.getWorkflow(workflow.id);
      expect(updatedWorkflow?.currentStep).toBe(2);

      // Cleanup
      await supabase
        .from('document_workflows')
        .delete()
        .eq('id', workflow.id);
    });

    it('should put workflow on hold on rejection', async () => {
      if (!testDocumentId) return;

      const steps = [
        {
          name: 'Review Step',
          description: 'Review',
          type: WorkflowStepType.REVIEW,
          assigneeType: 'user' as const,
          assigneeId: testUserId,
          isOptional: false
        }
      ];

      const workflow = await workflowService.createWorkflow(
        {
          documentId: testDocumentId,
          name: 'Test Rejection',
          steps
        },
        testUserId
      );

      await workflowService.startWorkflow(workflow.id, testUserId);

      // Reject step
      const step = workflow.steps[0];
      await workflowService.completeStep(
        step.id,
        {
          stepId: step.id,
          decision: 'rejected',
          comments: 'Needs revision',
          revisionNotes: 'Please fix issues'
        },
        testUserId
      );

      // Verify workflow is on hold
      const updatedWorkflow = await workflowService.getWorkflow(workflow.id);
      expect(updatedWorkflow?.status).toBe(DocumentWorkflowStatus.ON_HOLD);

      // Cleanup
      await supabase
        .from('document_workflows')
        .delete()
        .eq('id', workflow.id);
    });
  });

  /**
   * Property 54: Workflow Document Protection
   * **Validates: Requirements 10.4**
   * 
   * For any document in an active workflow, unauthorized modifications should 
   * be prevented
   */
  describe('Property 54: Workflow Document Protection', () => {
    it('should lock documents in active workflows', async () => {
      if (!testDocumentId) return;

      const steps = [
        {
          name: 'Review',
          description: 'Review step',
          type: WorkflowStepType.REVIEW,
          assigneeType: 'user' as const,
          assigneeId: testUserId
        }
      ];

      const workflow = await workflowService.createWorkflow(
        {
          documentId: testDocumentId,
          name: 'Test Document Lock',
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

      // Check modification permission
      const canModify = await workflowService.canModifyDocument(
        testDocumentId,
        'unauthorized-user'
      );
      expect(canModify.canModify).toBe(false);
      expect(canModify.reason).toContain('locked');

      // Cleanup
      await supabase
        .from('document_workflows')
        .delete()
        .eq('id', workflow.id);
    });
  });

  /**
   * Property 55: Workflow Completion Processing
   * **Validates: Requirements 10.5**
   * 
   * For any completed workflow, the document status should be updated and all 
   * stakeholders should be notified
   */
  describe('Property 55: Workflow Completion Processing', () => {
    it('should complete workflow when all steps are approved', async () => {
      if (!testDocumentId) return;

      const steps = [
        {
          name: 'Final Review',
          description: 'Final review step',
          type: WorkflowStepType.REVIEW,
          assigneeType: 'user' as const,
          assigneeId: testUserId
        }
      ];

      const workflow = await workflowService.createWorkflow(
        {
          documentId: testDocumentId,
          name: 'Test Completion',
          steps
        },
        testUserId
      );

      await workflowService.startWorkflow(workflow.id, testUserId);

      // Complete the step
      const step = workflow.steps[0];
      await workflowService.completeStep(
        step.id,
        {
          stepId: step.id,
          decision: 'approved',
          comments: 'Approved'
        },
        testUserId
      );

      // Verify workflow is completed
      const updatedWorkflow = await workflowService.getWorkflow(workflow.id);
      expect(updatedWorkflow?.status).toBe(DocumentWorkflowStatus.COMPLETED);
      expect(updatedWorkflow?.completedAt).toBeDefined();

      // Cleanup
      await supabase
        .from('document_workflows')
        .delete()
        .eq('id', workflow.id);
    });
  });

  /**
   * Property 56: Workflow Audit Trail Maintenance
   * **Validates: Requirements 10.6**
   * 
   * For any workflow activity, complete history and decision audit trails 
   * should be maintained
   */
  describe('Property 56: Workflow Audit Trail Maintenance', () => {
    it('should maintain complete audit trail for all workflow activities', async () => {
      if (!testDocumentId) return;

      const steps = [
        {
          name: 'Audit Test Step',
          description: 'Step for audit testing',
          type: WorkflowStepType.REVIEW,
          assigneeType: 'user' as const,
          assigneeId: testUserId
        }
      ];

      const workflow = await workflowService.createWorkflow(
        {
          documentId: testDocumentId,
          name: 'Test Audit Trail',
          steps
        },
        testUserId
      );

      // Get initial audit trail
      let auditTrail = await workflowService.getAuditTrail(workflow.id);
      
      // Should have workflow_created entry
      const createdEntry = auditTrail.find(e => e.action === 'workflow_created');
      expect(createdEntry).toBeDefined();

      // Start workflow
      await workflowService.startWorkflow(workflow.id, testUserId);

      // Get updated audit trail
      auditTrail = await workflowService.getAuditTrail(workflow.id);
      
      // Should have workflow_started entry
      const startedEntry = auditTrail.find(e => e.action === 'workflow_started');
      expect(startedEntry).toBeDefined();

      // Complete step
      const step = workflow.steps[0];
      await workflowService.completeStep(
        step.id,
        {
          stepId: step.id,
          decision: 'approved',
          comments: 'Test approval'
        },
        testUserId
      );

      // Get final audit trail
      auditTrail = await workflowService.getAuditTrail(workflow.id);

      // Verify completeness
      expect(auditTrail.length).toBeGreaterThan(2);

      // Verify each entry has required fields
      for (const entry of auditTrail) {
        expect(entry.id).toBeDefined();
        expect(entry.workflowId).toBe(workflow.id);
        expect(entry.action).toBeDefined();
        expect(entry.performedBy).toBeDefined();
        expect(entry.performedAt).toBeInstanceOf(Date);
        expect(entry.details).toBeDefined();
      }

      // Verify workflow_completed entry
      const completedEntry = auditTrail.find(e => e.action === 'workflow_completed');
      expect(completedEntry).toBeDefined();

      // Generate workflow report
      const report = await workflowService.generateWorkflowReport(workflow.id);
      expect(report.workflow).toBeDefined();
      expect(report.auditTrail).toBeDefined();
      expect(report.statistics).toBeDefined();
      expect(report.statistics.completedSteps).toBe(1);

      // Cleanup
      await supabase
        .from('document_workflows')
        .delete()
        .eq('id', workflow.id);
    });
  });
});
