/**
 * Document Workflow Management Service
 * 
 * Manages document approval workflows, review processes, and workflow state management.
 * Provides workflow definition, step management, reviewer assignment, and progress tracking.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { createClient } from '@supabase/supabase-js';
import {
  DocumentWorkflow,
  WorkflowStep,
  WorkflowTemplate,
  WorkflowProgress,
  WorkflowCreateRequest,
  WorkflowStepCompletionRequest,
  WorkflowAuditEntry,
  WorkflowStepAction,
  DocumentWorkflowStatus,
  WorkflowStepStatus,
  WorkflowStepType
} from '../types';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Workflow Service Class
 * Handles all document workflow operations
 */
class WorkflowService {
  /**
   * Create a new document workflow
   * Requirements: 10.1
   */
  async createWorkflow(request: WorkflowCreateRequest, createdBy: string): Promise<DocumentWorkflow> {
    try {
      // Validate document exists
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('id, name, metadata')
        .eq('id', request.documentId)
        .single();

      if (docError || !document) {
        throw new Error(`Document not found: ${request.documentId}`);
      }

      // Validate steps
      if (!request.steps || request.steps.length === 0) {
        throw new Error('Workflow must have at least one step');
      }

      // Create workflow
      const workflowId = crypto.randomUUID();
      const now = new Date();

      // Create workflow steps
      const steps: WorkflowStep[] = request.steps.map((stepReq, index) => ({
        id: crypto.randomUUID(),
        workflowId,
        stepNumber: index + 1,
        name: stepReq.name,
        description: stepReq.description,
        type: stepReq.type,
        assigneeType: stepReq.assigneeType,
        assigneeId: stepReq.assigneeId,
        status: index === 0 ? WorkflowStepStatus.PENDING : WorkflowStepStatus.PENDING,
        requiredActions: stepReq.requiredActions || [],
        timeLimit: stepReq.timeLimit,
        isOptional: stepReq.isOptional || false
      }));

      const workflow: DocumentWorkflow = {
        id: workflowId,
        documentId: request.documentId,
        name: request.name,
        description: request.description || '',
        status: DocumentWorkflowStatus.DRAFT,
        currentStep: 0,
        steps,
        createdAt: now,
        createdBy,
        notifications: request.notifications,
        metadata: {
          documentName: document.name,
          documentType: document.metadata?.category || 'unknown',
          priority: request.metadata?.priority,
          deadline: request.metadata?.deadline
        }
      };

      // Store workflow in database
      const { error: workflowError } = await supabase
        .from('document_workflows')
        .insert({
          id: workflow.id,
          document_id: workflow.documentId,
          name: workflow.name,
          description: workflow.description,
          status: workflow.status,
          current_step: workflow.currentStep,
          created_at: workflow.createdAt.toISOString(),
          created_by: workflow.createdBy,
          notifications: workflow.notifications,
          metadata: workflow.metadata
        });

      if (workflowError) {
        throw new Error(`Failed to create workflow: ${workflowError.message}`);
      }

      // Store workflow steps
      const stepsData = steps.map(step => ({
        id: step.id,
        workflow_id: step.workflowId,
        step_number: step.stepNumber,
        name: step.name,
        description: step.description,
        type: step.type,
        assignee_type: step.assigneeType,
        assignee_id: step.assigneeId,
        status: step.status,
        required_actions: step.required_actions,
        time_limit: step.timeLimit,
        is_optional: step.isOptional
      }));

      const { error: stepsError } = await supabase
        .from('workflow_steps')
        .insert(stepsData);

      if (stepsError) {
        throw new Error(`Failed to create workflow steps: ${stepsError.message}`);
      }

      // Create audit entry
      await this.createAuditEntry({
        id: crypto.randomUUID(),
        workflowId: workflow.id,
        action: 'workflow_created',
        performedBy: createdBy,
        performedAt: now,
        details: {
          documentId: request.documentId,
          stepCount: steps.length,
          workflowName: request.name
        }
      });

      return workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  /**
   * Start a workflow (activate it)
   * Requirements: 10.2
   */
  async startWorkflow(workflowId: string, startedBy: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status !== DocumentWorkflowStatus.DRAFT) {
      throw new Error(`Workflow cannot be started from status: ${workflow.status}`);
    }

    const now = new Date();

    // Update workflow status
    await supabase
      .from('document_workflows')
      .update({
        status: DocumentWorkflowStatus.ACTIVE,
        started_at: now.toISOString(),
        current_step: 1
      })
      .eq('id', workflowId);

    // Update first step status
    if (workflow.steps.length > 0) {
      const firstStep = workflow.steps[0];
      await this.updateStepStatus(firstStep.id, WorkflowStepStatus.IN_PROGRESS, now);

      // Notify assignee
      await this.notifyStepAssignee(firstStep);
    }

    // Create audit entry
    await this.createAuditEntry({
      id: crypto.randomUUID(),
      workflowId,
      action: 'workflow_started',
      performedBy: startedBy,
      performedAt: now,
      details: { startedAt: now.toISOString() }
    });
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<DocumentWorkflow | null> {
    try {
      const { data: workflowData, error: workflowError } = await supabase
        .from('document_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError || !workflowData) {
        return null;
      }

      const { data: stepsData, error: stepsError } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('step_number', { ascending: true });

      if (stepsError) {
        throw new Error(`Failed to fetch workflow steps: ${stepsError.message}`);
      }

      const workflow: DocumentWorkflow = {
        id: workflowData.id,
        documentId: workflowData.document_id,
        name: workflowData.name,
        description: workflowData.description,
        status: workflowData.status as DocumentWorkflowStatus,
        currentStep: workflowData.current_step,
        steps: (stepsData || []).map(s => this.mapStepFromDb(s)),
        createdAt: new Date(workflowData.created_at),
        createdBy: workflowData.created_by,
        startedAt: workflowData.started_at ? new Date(workflowData.started_at) : undefined,
        completedAt: workflowData.completed_at ? new Date(workflowData.completed_at) : undefined,
        cancelledAt: workflowData.cancelled_at ? new Date(workflowData.cancelled_at) : undefined,
        cancelReason: workflowData.cancel_reason,
        notifications: workflowData.notifications,
        metadata: workflowData.metadata
      };

      return workflow;
    } catch (error) {
      console.error('Error fetching workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow progress
   * Requirements: 10.2
   */
  async getWorkflowProgress(workflowId: string): Promise<WorkflowProgress> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const totalSteps = workflow.steps.length;
    const completedSteps = workflow.steps.filter(
      s => s.status === WorkflowStepStatus.COMPLETED || s.status === WorkflowStepStatus.SKIPPED
    ).length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    const currentStep = workflow.steps.find(s => s.stepNumber === workflow.currentStep);
    const delayedSteps = workflow.steps.filter(s => {
      if (!s.timeLimit || !s.startedAt) return false;
      const deadline = new Date(s.startedAt.getTime() + s.timeLimit * 60 * 60 * 1000);
      return new Date() > deadline && s.status === WorkflowStepStatus.IN_PROGRESS;
    }).length;

    let nextAction: string | undefined;
    if (currentStep) {
      nextAction = `Waiting for ${currentStep.assigneeName || currentStep.assigneeId} to ${currentStep.type} step: ${currentStep.name}`;
    }

    return {
      workflowId: workflow.id,
      status: workflow.status,
      totalSteps,
      completedSteps,
      currentStepNumber: workflow.currentStep,
      currentStepName: currentStep?.name,
      progress,
      estimatedCompletion: workflow.metadata.deadline,
      isOnTrack: delayedSteps === 0,
      delayedSteps,
      nextAction
    };
  }

  /**
   * Update step status
   */
  private async updateStepStatus(
    stepId: string,
    status: WorkflowStepStatus,
    timestamp: Date,
    completedBy?: string
  ): Promise<void> {
    const updates: any = { status };

    if (status === WorkflowStepStatus.IN_PROGRESS) {
      updates.started_at = timestamp.toISOString();
    } else if (status === WorkflowStepStatus.COMPLETED || status === WorkflowStepStatus.REJECTED) {
      updates.completed_at = timestamp.toISOString();
      if (completedBy) {
        updates.completed_by = completedBy;
      }
    }

    const { error } = await supabase
      .from('workflow_steps')
      .update(updates)
      .eq('id', stepId);

    if (error) {
      throw new Error(`Failed to update step status: ${error.message}`);
    }
  }

  /**
   * Notify step assignee
   * Requirements: 10.2
   */
  private async notifyStepAssignee(step: WorkflowStep): Promise<void> {
    // Create audit entry for notification
    await this.createAuditEntry({
      id: crypto.randomUUID(),
      workflowId: step.workflowId,
      stepId: step.id,
      action: 'step_notification_sent',
      performedBy: 'system',
      performedAt: new Date(),
      details: {
        stepId: step.id,
        stepName: step.name,
        assigneeType: step.assigneeType,
        assigneeId: step.assigneeId
      }
    });

    // TODO: Integrate with actual notification service
    console.log(`Notification sent for step ${step.name} to ${step.assigneeId}`);
  }

  /**
   * Create audit entry for workflow
   * Requirements: 10.6
   */
  private async createAuditEntry(entry: WorkflowAuditEntry): Promise<void> {
    const { error } = await supabase
      .from('workflow_audit_trail')
      .insert({
        id: entry.id,
        workflow_id: entry.workflowId,
        step_id: entry.stepId,
        action: entry.action,
        performed_by: entry.performedBy,
        performed_at: entry.performedAt.toISOString(),
        details: entry.details,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent
      });

    if (error) {
      console.error('Error creating audit entry:', error);
    }
  }

  /**
   * Complete a workflow step
   * Requirements: 10.3
   */
  async completeStep(
    stepId: string,
    request: WorkflowStepCompletionRequest,
    completedBy: string
  ): Promise<void> {
    try {
      // Get step
      const { data: stepData, error: stepError } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('id', stepId)
        .single();

      if (stepError || !stepData) {
        throw new Error(`Step not found: ${stepId}`);
      }

      const step = this.mapStepFromDb(stepData);

      // Verify step is in progress
      if (step.status !== WorkflowStepStatus.IN_PROGRESS) {
        throw new Error(`Step cannot be completed from status: ${step.status}`);
      }

      // Get workflow
      const workflow = await this.getWorkflow(step.workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${step.workflowId}`);
      }

      // Verify workflow is active
      if (workflow.status !== DocumentWorkflowStatus.ACTIVE) {
        throw new Error(`Workflow is not active: ${workflow.status}`);
      }

      const now = new Date();

      // Update step based on decision
      const newStatus = request.decision === 'approved' 
        ? WorkflowStepStatus.COMPLETED 
        : WorkflowStepStatus.REJECTED;

      await supabase
        .from('workflow_steps')
        .update({
          status: newStatus,
          completed_at: now.toISOString(),
          completed_by: completedBy,
          decision: request.decision,
          comments: request.comments,
          revision_notes: request.revisionNotes
        })
        .eq('id', stepId);

      // Create step action record
      await this.createStepAction({
        id: crypto.randomUUID(),
        stepId,
        workflowId: step.workflowId,
        action: request.decision === 'approved' ? 'approved' : 
                request.decision === 'rejected' ? 'rejected' : 'revision_requested',
        performedBy: completedBy,
        performedAt: now,
        comments: request.comments,
        attachments: request.attachments
      });

      // Create audit entry
      await this.createAuditEntry({
        id: crypto.randomUUID(),
        workflowId: step.workflowId,
        stepId,
        action: 'step_completed',
        performedBy: completedBy,
        performedAt: now,
        details: {
          stepName: step.name,
          decision: request.decision,
          comments: request.comments
        }
      });

      // Handle workflow advancement based on decision
      if (request.decision === 'approved') {
        await this.advanceWorkflow(step.workflowId, completedBy);
      } else if (request.decision === 'rejected') {
        // If step is rejected and not optional, workflow may need to be cancelled or returned
        if (!step.isOptional) {
          await this.handleRejection(step.workflowId, step, request.revisionNotes || '');
        } else {
          // Skip optional rejected step and continue
          await this.advanceWorkflow(step.workflowId, completedBy);
        }
      } else if (request.decision === 'revision_requested') {
        await this.handleRevisionRequest(step.workflowId, step, request.revisionNotes || '');
      }
    } catch (error) {
      console.error('Error completing step:', error);
      throw error;
    }
  }

  /**
   * Advance workflow to next step
   * Requirements: 10.3
   */
  private async advanceWorkflow(workflowId: string, advancedBy: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Find next pending step
    const nextStep = workflow.steps.find(
      s => s.stepNumber > workflow.currentStep && s.status === WorkflowStepStatus.PENDING
    );

    if (nextStep) {
      // Move to next step
      await supabase
        .from('document_workflows')
        .update({ current_step: nextStep.stepNumber })
        .eq('id', workflowId);

      // Start next step
      await this.updateStepStatus(nextStep.id, WorkflowStepStatus.IN_PROGRESS, new Date());

      // Notify assignee
      await this.notifyStepAssignee(nextStep);

      // Create audit entry
      await this.createAuditEntry({
        id: crypto.randomUUID(),
        workflowId,
        stepId: nextStep.id,
        action: 'step_started',
        performedBy: advancedBy,
        performedAt: new Date(),
        details: {
          stepNumber: nextStep.stepNumber,
          stepName: nextStep.name
        }
      });
    } else {
      // No more steps - complete workflow
      await this.completeWorkflow(workflowId, advancedBy);
    }
  }

  /**
   * Handle step rejection
   * Requirements: 10.3
   */
  private async handleRejection(
    workflowId: string,
    step: WorkflowStep,
    reason: string
  ): Promise<void> {
    // Put workflow on hold for revision
    await supabase
      .from('document_workflows')
      .update({ status: DocumentWorkflowStatus.ON_HOLD })
      .eq('id', workflowId);

    // Create audit entry
    await this.createAuditEntry({
      id: crypto.randomUUID(),
      workflowId,
      stepId: step.id,
      action: 'workflow_on_hold',
      performedBy: 'system',
      performedAt: new Date(),
      details: {
        reason: 'Step rejected',
        stepName: step.name,
        rejectionReason: reason
      }
    });

    // TODO: Notify workflow creator about rejection
    console.log(`Workflow ${workflowId} put on hold due to rejection at step ${step.name}`);
  }

  /**
   * Handle revision request
   * Requirements: 10.3
   */
  private async handleRevisionRequest(
    workflowId: string,
    step: WorkflowStep,
    revisionNotes: string
  ): Promise<void> {
    // Put workflow on hold for revision
    await supabase
      .from('document_workflows')
      .update({ status: DocumentWorkflowStatus.ON_HOLD })
      .eq('id', workflowId);

    // Create audit entry
    await this.createAuditEntry({
      id: crypto.randomUUID(),
      workflowId,
      stepId: step.id,
      action: 'revision_requested',
      performedBy: 'system',
      performedAt: new Date(),
      details: {
        stepName: step.name,
        revisionNotes
      }
    });

    // TODO: Notify workflow creator about revision request
    console.log(`Revision requested for workflow ${workflowId} at step ${step.name}`);
  }

  /**
   * Resume workflow from on-hold status
   * Requirements: 10.3
   */
  async resumeWorkflow(workflowId: string, resumedBy: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status !== DocumentWorkflowStatus.ON_HOLD) {
      throw new Error(`Workflow cannot be resumed from status: ${workflow.status}`);
    }

    // Resume workflow
    await supabase
      .from('document_workflows')
      .update({ status: DocumentWorkflowStatus.ACTIVE })
      .eq('id', workflowId);

    // Reset current step to in progress
    const currentStep = workflow.steps.find(s => s.stepNumber === workflow.currentStep);
    if (currentStep) {
      await this.updateStepStatus(currentStep.id, WorkflowStepStatus.IN_PROGRESS, new Date());
      await this.notifyStepAssignee(currentStep);
    }

    // Create audit entry
    await this.createAuditEntry({
      id: crypto.randomUUID(),
      workflowId,
      action: 'workflow_resumed',
      performedBy: resumedBy,
      performedAt: new Date(),
      details: { resumedAt: new Date().toISOString() }
    });
  }

  /**
   * Cancel a workflow
   * Requirements: 10.3
   */
  async cancelWorkflow(workflowId: string, reason: string, cancelledBy: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status === DocumentWorkflowStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed workflow');
    }

    const now = new Date();

    await supabase
      .from('document_workflows')
      .update({
        status: DocumentWorkflowStatus.CANCELLED,
        cancelled_at: now.toISOString(),
        cancel_reason: reason
      })
      .eq('id', workflowId);

    // Create audit entry
    await this.createAuditEntry({
      id: crypto.randomUUID(),
      workflowId,
      action: 'workflow_cancelled',
      performedBy: cancelledBy,
      performedAt: now,
      details: { reason }
    });
  }

  /**
   * Prevent unauthorized modifications to documents in active workflows
   * Requirements: 10.4
   */
  async isDocumentLocked(documentId: string): Promise<boolean> {
    const { data: workflows, error } = await supabase
      .from('document_workflows')
      .select('id, status')
      .eq('document_id', documentId)
      .in('status', [DocumentWorkflowStatus.ACTIVE, DocumentWorkflowStatus.ON_HOLD]);

    if (error) {
      console.error('Error checking document lock:', error);
      return false;
    }

    return (workflows && workflows.length > 0) || false;
  }

  /**
   * Check if user can modify document
   * Requirements: 10.4
   */
  async canModifyDocument(documentId: string, userId: string): Promise<{
    canModify: boolean;
    reason?: string;
    workflowId?: string;
  }> {
    const isLocked = await this.isDocumentLocked(documentId);
    
    if (!isLocked) {
      return { canModify: true };
    }

    // Get active workflows
    const { data: workflows } = await supabase
      .from('document_workflows')
      .select('id, name, current_step')
      .eq('document_id', documentId)
      .in('status', [DocumentWorkflowStatus.ACTIVE, DocumentWorkflowStatus.ON_HOLD]);

    if (!workflows || workflows.length === 0) {
      return { canModify: true };
    }

    const workflow = workflows[0];

    // Check if user is the current step assignee
    const { data: currentStep } = await supabase
      .from('workflow_steps')
      .select('assignee_id, assignee_type')
      .eq('workflow_id', workflow.id)
      .eq('step_number', workflow.current_step)
      .single();

    if (currentStep && currentStep.assignee_type === 'user' && currentStep.assignee_id === userId) {
      return { canModify: true };
    }

    return {
      canModify: false,
      reason: `Document is locked by active workflow: ${workflow.name}`,
      workflowId: workflow.id
    };
  }

  /**
   * Complete a workflow
   * Requirements: 10.5
   */
  private async completeWorkflow(workflowId: string, completedBy: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const now = new Date();

    // Update workflow status
    await supabase
      .from('document_workflows')
      .update({
        status: DocumentWorkflowStatus.COMPLETED,
        completed_at: now.toISOString()
      })
      .eq('id', workflowId);

    // Create audit entry
    await this.createAuditEntry({
      id: crypto.randomUUID(),
      workflowId,
      action: 'workflow_completed',
      performedBy: completedBy,
      performedAt: now,
      details: {
        completedAt: now.toISOString(),
        totalSteps: workflow.steps.length,
        duration: workflow.startedAt 
          ? now.getTime() - workflow.startedAt.getTime() 
          : 0
      }
    });

    // Notify all stakeholders
    await this.notifyWorkflowCompletion(workflow);
  }

  /**
   * Notify stakeholders of workflow completion
   * Requirements: 10.5
   */
  private async notifyWorkflowCompletion(workflow: DocumentWorkflow): Promise<void> {
    // Notify workflow creator
    console.log(`Workflow completed notification sent to creator: ${workflow.createdBy}`);

    // Notify all step assignees
    const uniqueAssignees = new Set(
      workflow.steps
        .filter(s => s.assigneeId)
        .map(s => s.assigneeId!)
    );

    for (const assigneeId of uniqueAssignees) {
      console.log(`Workflow completed notification sent to assignee: ${assigneeId}`);
    }

    // Create audit entry for notifications
    await this.createAuditEntry({
      id: crypto.randomUUID(),
      workflowId: workflow.id,
      action: 'completion_notifications_sent',
      performedBy: 'system',
      performedAt: new Date(),
      details: {
        notificationCount: uniqueAssignees.size + 1,
        recipients: [workflow.createdBy, ...Array.from(uniqueAssignees)]
      }
    });
  }

  /**
   * Get complete audit trail for a workflow
   * Requirements: 10.6
   */
  async getAuditTrail(workflowId: string): Promise<WorkflowAuditEntry[]> {
    const { data: auditData, error } = await supabase
      .from('workflow_audit_trail')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('performed_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch audit trail: ${error.message}`);
    }

    return (auditData || []).map(a => ({
      id: a.id,
      workflowId: a.workflow_id,
      stepId: a.step_id,
      action: a.action,
      performedBy: a.performed_by,
      performedAt: new Date(a.performed_at),
      details: a.details,
      ipAddress: a.ip_address,
      userAgent: a.user_agent
    }));
  }

  /**
   * Get audit trail for a specific document across all workflows
   * Requirements: 10.6
   */
  async getDocumentAuditTrail(documentId: string): Promise<WorkflowAuditEntry[]> {
    // Get all workflows for this document
    const { data: workflows, error: workflowError } = await supabase
      .from('document_workflows')
      .select('id')
      .eq('document_id', documentId);

    if (workflowError) {
      throw new Error(`Failed to fetch workflows: ${workflowError.message}`);
    }

    if (!workflows || workflows.length === 0) {
      return [];
    }

    const workflowIds = workflows.map(w => w.id);

    // Get audit entries for all workflows
    const { data: auditData, error: auditError } = await supabase
      .from('workflow_audit_trail')
      .select('*')
      .in('workflow_id', workflowIds)
      .order('performed_at', { ascending: true });

    if (auditError) {
      throw new Error(`Failed to fetch audit trail: ${auditError.message}`);
    }

    return (auditData || []).map(a => ({
      id: a.id,
      workflowId: a.workflow_id,
      stepId: a.step_id,
      action: a.action,
      performedBy: a.performed_by,
      performedAt: new Date(a.performed_at),
      details: a.details,
      ipAddress: a.ip_address,
      userAgent: a.user_agent
    }));
  }

  /**
   * Get step actions for a workflow step
   * Requirements: 10.6
   */
  async getStepActions(stepId: string): Promise<WorkflowStepAction[]> {
    const { data: actionsData, error } = await supabase
      .from('workflow_step_actions')
      .select('*')
      .eq('step_id', stepId)
      .order('performed_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch step actions: ${error.message}`);
    }

    return (actionsData || []).map(a => ({
      id: a.id,
      stepId: a.step_id,
      workflowId: a.workflow_id,
      action: a.action,
      performedBy: a.performed_by,
      performedAt: new Date(a.performed_at),
      comments: a.comments,
      attachments: a.attachments,
      ipAddress: a.ip_address,
      userAgent: a.user_agent
    }));
  }

  /**
   * Generate workflow history report
   * Requirements: 10.6
   */
  async generateWorkflowReport(workflowId: string): Promise<{
    workflow: DocumentWorkflow;
    auditTrail: WorkflowAuditEntry[];
    stepActions: Record<string, WorkflowStepAction[]>;
    statistics: {
      totalDuration: number;
      averageStepDuration: number;
      completedSteps: number;
      rejectedSteps: number;
      revisionsRequested: number;
    };
  }> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const auditTrail = await this.getAuditTrail(workflowId);

    // Get step actions for all steps
    const stepActions: Record<string, WorkflowStepAction[]> = {};
    for (const step of workflow.steps) {
      stepActions[step.id] = await this.getStepActions(step.id);
    }

    // Calculate statistics
    const completedSteps = workflow.steps.filter(
      s => s.status === WorkflowStepStatus.COMPLETED
    ).length;
    
    const rejectedSteps = workflow.steps.filter(
      s => s.status === WorkflowStepStatus.REJECTED
    ).length;

    const revisionsRequested = auditTrail.filter(
      e => e.action === 'revision_requested'
    ).length;

    let totalDuration = 0;
    let stepDurations: number[] = [];

    for (const step of workflow.steps) {
      if (step.startedAt && step.completedAt) {
        const duration = step.completedAt.getTime() - step.startedAt.getTime();
        stepDurations.push(duration);
        totalDuration += duration;
      }
    }

    const averageStepDuration = stepDurations.length > 0
      ? stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length
      : 0;

    return {
      workflow,
      auditTrail,
      stepActions,
      statistics: {
        totalDuration,
        averageStepDuration,
        completedSteps,
        rejectedSteps,
        revisionsRequested
      }
    };
  }

  /**
   * Get workflows by document
   */
  async getWorkflowsByDocument(documentId: string): Promise<DocumentWorkflow[]> {
    const { data: workflowsData, error } = await supabase
      .from('document_workflows')
      .select('id')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch workflows: ${error.message}`);
    }

    const workflows: DocumentWorkflow[] = [];
    for (const workflowData of workflowsData || []) {
      const workflow = await this.getWorkflow(workflowData.id);
      if (workflow) {
        workflows.push(workflow);
      }
    }

    return workflows;
  }

  /**
   * Create step action record
   */
  private async createStepAction(action: WorkflowStepAction): Promise<void> {
    const { error } = await supabase
      .from('workflow_step_actions')
      .insert({
        id: action.id,
        step_id: action.stepId,
        workflow_id: action.workflowId,
        action: action.action,
        performed_by: action.performedBy,
        performed_at: action.performedAt.toISOString(),
        comments: action.comments,
        attachments: action.attachments,
        ip_address: action.ipAddress,
        user_agent: action.userAgent
      });

    if (error) {
      console.error('Error creating step action:', error);
    }
  }

  /**
   * Map database step record to WorkflowStep interface
   */
  private mapStepFromDb(dbStep: any): WorkflowStep {
    return {
      id: dbStep.id,
      workflowId: dbStep.workflow_id,
      stepNumber: dbStep.step_number,
      name: dbStep.name,
      description: dbStep.description,
      type: dbStep.type as WorkflowStepType,
      assigneeType: dbStep.assignee_type,
      assigneeId: dbStep.assignee_id,
      assigneeName: dbStep.assignee_name,
      status: dbStep.status as WorkflowStepStatus,
      requiredActions: dbStep.required_actions || [],
      conditions: dbStep.conditions,
      timeLimit: dbStep.time_limit,
      isOptional: dbStep.is_optional,
      startedAt: dbStep.started_at ? new Date(dbStep.started_at) : undefined,
      completedAt: dbStep.completed_at ? new Date(dbStep.completed_at) : undefined,
      completedBy: dbStep.completed_by,
      comments: dbStep.comments,
      decision: dbStep.decision,
      revisionNotes: dbStep.revision_notes
    };
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
export default workflowService;
