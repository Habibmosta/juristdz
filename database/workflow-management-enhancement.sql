-- =====================================================
-- WORKFLOW MANAGEMENT ENHANCEMENT SCHEMA
-- =====================================================
-- This migration adds missing tables and columns for complete
-- workflow management functionality including audit trails,
-- step actions, and enhanced workflow tracking.
--
-- Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
-- =====================================================

-- =====================================================
-- ENHANCE DOCUMENT_WORKFLOWS TABLE
-- =====================================================
-- Add missing columns to document_workflows table
ALTER TABLE document_workflows 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
ADD COLUMN IF NOT EXISTS notifications JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update status check constraint to include all statuses
ALTER TABLE document_workflows 
DROP CONSTRAINT IF EXISTS document_workflows_status_check;

ALTER TABLE document_workflows 
ADD CONSTRAINT document_workflows_status_check 
CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'on_hold'));

-- =====================================================
-- ENHANCE WORKFLOW_STEPS TABLE
-- =====================================================
-- Add missing columns to workflow_steps table
ALTER TABLE workflow_steps 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'review',
ADD COLUMN IF NOT EXISTS assignee_type VARCHAR(20) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS assignee_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS assignee_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS required_actions JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS conditions JSONB,
ADD COLUMN IF NOT EXISTS time_limit INTEGER,
ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS decision VARCHAR(50),
ADD COLUMN IF NOT EXISTS revision_notes TEXT;

-- Update status check constraint to include all statuses
ALTER TABLE workflow_steps 
DROP CONSTRAINT IF EXISTS workflow_steps_status_check;

ALTER TABLE workflow_steps 
ADD CONSTRAINT workflow_steps_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'skipped'));

-- Add check constraint for workflow step type
ALTER TABLE workflow_steps 
ADD CONSTRAINT workflow_steps_type_check 
CHECK (type IN ('review', 'approval', 'signature', 'notification', 'custom'));

-- Add check constraint for assignee type
ALTER TABLE workflow_steps 
ADD CONSTRAINT workflow_steps_assignee_type_check 
CHECK (assignee_type IN ('user', 'role', 'group'));

-- =====================================================
-- WORKFLOW AUDIT TRAIL TABLE
-- =====================================================
-- Complete audit trail for all workflow activities
CREATE TABLE IF NOT EXISTS workflow_audit_trail (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_id UUID NOT NULL REFERENCES document_workflows(id) ON DELETE CASCADE,
    step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    CONSTRAINT workflow_audit_trail_action_check 
    CHECK (action IN (
        'workflow_created', 'workflow_started', 'workflow_completed', 
        'workflow_cancelled', 'workflow_on_hold', 'workflow_resumed',
        'step_started', 'step_completed', 'step_notification_sent',
        'revision_requested', 'completion_notifications_sent'
    ))
);

-- =====================================================
-- WORKFLOW STEP ACTIONS TABLE
-- =====================================================
-- Detailed record of all actions taken on workflow steps
CREATE TABLE IF NOT EXISTS workflow_step_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES document_workflows(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    comments TEXT,
    attachments JSONB DEFAULT '[]',
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    CONSTRAINT workflow_step_actions_action_check 
    CHECK (action IN ('approved', 'rejected', 'revision_requested', 'commented', 'viewed'))
);

-- =====================================================
-- WORKFLOW TEMPLATES TABLE
-- =====================================================
-- Reusable workflow templates for common approval processes
CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    applicable_document_types TEXT[] DEFAULT '{}',
    template_steps JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Workflow audit trail indexes
CREATE INDEX IF NOT EXISTS idx_workflow_audit_trail_workflow_id 
ON workflow_audit_trail(workflow_id);

CREATE INDEX IF NOT EXISTS idx_workflow_audit_trail_step_id 
ON workflow_audit_trail(step_id);

CREATE INDEX IF NOT EXISTS idx_workflow_audit_trail_performed_at 
ON workflow_audit_trail(performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_audit_trail_action 
ON workflow_audit_trail(action);

-- Workflow step actions indexes
CREATE INDEX IF NOT EXISTS idx_workflow_step_actions_step_id 
ON workflow_step_actions(step_id);

CREATE INDEX IF NOT EXISTS idx_workflow_step_actions_workflow_id 
ON workflow_step_actions(workflow_id);

CREATE INDEX IF NOT EXISTS idx_workflow_step_actions_performed_at 
ON workflow_step_actions(performed_at DESC);

-- Workflow templates indexes
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category 
ON workflow_templates(category);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_is_active 
ON workflow_templates(is_active) WHERE is_active = TRUE;

-- Enhanced workflow indexes
CREATE INDEX IF NOT EXISTS idx_document_workflows_started_at 
ON document_workflows(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_type 
ON workflow_steps(type);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_assignee_id 
ON workflow_steps(assignee_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE workflow_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Workflow audit trail policies
CREATE POLICY "Users can view audit trail for their workflows" 
ON workflow_audit_trail FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM document_workflows dw 
        WHERE dw.id = workflow_audit_trail.workflow_id 
        AND (dw.created_by = auth.uid() OR dw.user_id = auth.uid())
    )
);

CREATE POLICY "System can insert audit trail entries" 
ON workflow_audit_trail FOR INSERT WITH CHECK (true);

-- Workflow step actions policies
CREATE POLICY "Users can view step actions for their workflows" 
ON workflow_step_actions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM document_workflows dw 
        WHERE dw.id = workflow_step_actions.workflow_id 
        AND (dw.created_by = auth.uid() OR dw.user_id = auth.uid())
    )
);

CREATE POLICY "Users can insert step actions for assigned steps" 
ON workflow_step_actions FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM workflow_steps ws 
        WHERE ws.id = workflow_step_actions.step_id 
        AND ws.assignee_id = auth.uid()::text
    )
);

-- Workflow templates policies
CREATE POLICY "Users can view active workflow templates" 
ON workflow_templates FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage workflow templates" 
ON workflow_templates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT ON workflow_audit_trail TO authenticated;
GRANT SELECT, INSERT ON workflow_step_actions TO authenticated;
GRANT SELECT ON workflow_templates TO authenticated;
GRANT ALL ON workflow_templates TO service_role;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE workflow_audit_trail IS 
'Complete audit trail for all workflow activities including creation, state changes, and completion';

COMMENT ON TABLE workflow_step_actions IS 
'Detailed record of all actions taken on workflow steps including approvals, rejections, and comments';

COMMENT ON TABLE workflow_templates IS 
'Reusable workflow templates for common approval processes';

COMMENT ON COLUMN document_workflows.started_at IS 
'Timestamp when the workflow was started (moved from draft to active)';

COMMENT ON COLUMN document_workflows.cancelled_at IS 
'Timestamp when the workflow was cancelled';

COMMENT ON COLUMN document_workflows.cancel_reason IS 
'Reason provided for workflow cancellation';

COMMENT ON COLUMN document_workflows.notifications IS 
'Notification settings and preferences for the workflow';

COMMENT ON COLUMN document_workflows.metadata IS 
'Additional workflow metadata including priority, deadline, and custom fields';

COMMENT ON COLUMN workflow_steps.type IS 
'Type of workflow step: review, approval, signature, notification, or custom';

COMMENT ON COLUMN workflow_steps.assignee_type IS 
'Type of assignee: user, role, or group';

COMMENT ON COLUMN workflow_steps.assignee_id IS 
'ID of the assigned user, role, or group';

COMMENT ON COLUMN workflow_steps.required_actions IS 
'List of actions that must be completed for this step';

COMMENT ON COLUMN workflow_steps.conditions IS 
'Conditions that must be met for this step to be activated';

COMMENT ON COLUMN workflow_steps.time_limit IS 
'Time limit for completing this step (in hours)';

COMMENT ON COLUMN workflow_steps.is_optional IS 
'Whether this step can be skipped if rejected';

COMMENT ON COLUMN workflow_steps.decision IS 
'Decision made on this step: approved, rejected, or revision_requested';

COMMENT ON COLUMN workflow_steps.revision_notes IS 
'Notes provided when requesting revisions';
