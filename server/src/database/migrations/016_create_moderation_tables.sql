-- Migration: Create moderation system tables
-- Description: Tables for content moderation, workflows, and automated moderation

-- Moderation workflows table
CREATE TABLE moderation_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content_types TEXT[] NOT NULL,
    auto_moderation_rules TEXT[] NOT NULL,
    requires_manual_review BOOLEAN DEFAULT false,
    escalation_threshold INTEGER DEFAULT 3,
    approval_required BOOLEAN DEFAULT true,
    reviewer_roles TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Moderation items table
CREATE TABLE moderation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL,
    content_id UUID NOT NULL,
    content_title VARCHAR(500) NOT NULL,
    content_preview TEXT,
    submitted_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_moderator UUID REFERENCES users(id),
    workflow_id UUID REFERENCES moderation_workflows(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalated_by UUID REFERENCES users(id),
    escalation_reason TEXT
);

-- Auto moderation flags table
CREATE TABLE auto_moderation_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderation_item_id UUID NOT NULL REFERENCES moderation_items(id) ON DELETE CASCADE,
    rule VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    details TEXT NOT NULL,
    flagged_content TEXT,
    suggested_action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Manual moderation reports table
CREATE TABLE moderation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderation_item_id UUID NOT NULL REFERENCES moderation_items(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES users(id),
    reason VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    evidence TEXT[], -- Array of evidence URLs or descriptions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Moderation actions table
CREATE TABLE moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderation_item_id UUID NOT NULL REFERENCES moderation_items(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Moderation alerts table
CREATE TABLE moderation_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    moderation_item_id UUID REFERENCES moderation_items(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_moderation_items_status ON moderation_items(status);
CREATE INDEX idx_moderation_items_content_type ON moderation_items(content_type);
CREATE INDEX idx_moderation_items_priority ON moderation_items(priority);
CREATE INDEX idx_moderation_items_assigned_moderator ON moderation_items(assigned_moderator);
CREATE INDEX idx_moderation_items_submitted_by ON moderation_items(submitted_by);
CREATE INDEX idx_moderation_items_created_at ON moderation_items(created_at);
CREATE INDEX idx_moderation_items_workflow_id ON moderation_items(workflow_id);

CREATE INDEX idx_auto_moderation_flags_item_id ON auto_moderation_flags(moderation_item_id);
CREATE INDEX idx_auto_moderation_flags_rule ON auto_moderation_flags(rule);
CREATE INDEX idx_auto_moderation_flags_severity ON auto_moderation_flags(severity);

CREATE INDEX idx_moderation_reports_item_id ON moderation_reports(moderation_item_id);
CREATE INDEX idx_moderation_reports_reported_by ON moderation_reports(reported_by);
CREATE INDEX idx_moderation_reports_reason ON moderation_reports(reason);

CREATE INDEX idx_moderation_actions_item_id ON moderation_actions(moderation_item_id);
CREATE INDEX idx_moderation_actions_performed_by ON moderation_actions(performed_by);
CREATE INDEX idx_moderation_actions_action ON moderation_actions(action);

CREATE INDEX idx_moderation_alerts_type ON moderation_alerts(type);
CREATE INDEX idx_moderation_alerts_acknowledged ON moderation_alerts(acknowledged);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_moderation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_moderation_workflows_updated_at
    BEFORE UPDATE ON moderation_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_moderation_updated_at();

CREATE TRIGGER trigger_moderation_items_updated_at
    BEFORE UPDATE ON moderation_items
    FOR EACH ROW
    EXECUTE FUNCTION update_moderation_updated_at();

-- Function to automatically assign moderation items based on workload
CREATE OR REPLACE FUNCTION assign_moderation_item()
RETURNS TRIGGER AS $$
DECLARE
    moderator_id UUID;
BEGIN
    -- Only auto-assign if no moderator is already assigned
    IF NEW.assigned_moderator IS NULL THEN
        -- Find the moderator with the least assigned pending items
        SELECT u.id INTO moderator_id
        FROM users u
        WHERE u.role = 'ADMIN' 
           OR u.id IN (
               SELECT UNNEST(mw.reviewer_roles::UUID[])
               FROM moderation_workflows mw
               WHERE mw.id = NEW.workflow_id
           )
        ORDER BY (
            SELECT COUNT(*)
            FROM moderation_items mi
            WHERE mi.assigned_moderator = u.id
              AND mi.status IN ('pending', 'under_review')
        ) ASC
        LIMIT 1;
        
        NEW.assigned_moderator = moderator_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_moderation_item
    BEFORE INSERT ON moderation_items
    FOR EACH ROW
    EXECUTE FUNCTION assign_moderation_item();

-- Function to create alerts for high priority items
CREATE OR REPLACE FUNCTION create_moderation_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Create alert for high priority items
    IF NEW.priority = 'high' OR NEW.priority = 'urgent' THEN
        INSERT INTO moderation_alerts (type, message, moderation_item_id)
        VALUES (
            'high_priority_item',
            'High priority moderation item requires attention: ' || NEW.content_title,
            NEW.id
        );
    END IF;
    
    -- Create alert when item is escalated
    IF NEW.escalated_at IS NOT NULL AND OLD.escalated_at IS NULL THEN
        INSERT INTO moderation_alerts (type, message, moderation_item_id)
        VALUES (
            'escalation_needed',
            'Moderation item has been escalated: ' || NEW.content_title,
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_moderation_alerts
    AFTER INSERT OR UPDATE ON moderation_items
    FOR EACH ROW
    EXECUTE FUNCTION create_moderation_alerts();

-- Function to calculate moderation statistics
CREATE OR REPLACE FUNCTION get_moderation_statistics(
    date_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP - INTERVAL '30 days',
    date_to TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalItems', (
            SELECT COUNT(*) FROM moderation_items 
            WHERE created_at BETWEEN date_from AND date_to
        ),
        'pendingItems', (
            SELECT COUNT(*) FROM moderation_items 
            WHERE status = 'pending' AND created_at BETWEEN date_from AND date_to
        ),
        'approvedItems', (
            SELECT COUNT(*) FROM moderation_items 
            WHERE status = 'approved' AND created_at BETWEEN date_from AND date_to
        ),
        'rejectedItems', (
            SELECT COUNT(*) FROM moderation_items 
            WHERE status = 'rejected' AND created_at BETWEEN date_from AND date_to
        ),
        'flaggedItems', (
            SELECT COUNT(*) FROM moderation_items 
            WHERE status = 'flagged' AND created_at BETWEEN date_from AND date_to
        ),
        'averageReviewTime', (
            SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 60), 0)
            FROM moderation_items 
            WHERE reviewed_at IS NOT NULL 
              AND created_at BETWEEN date_from AND date_to
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert default moderation workflow
INSERT INTO moderation_workflows (
    name,
    description,
    content_types,
    auto_moderation_rules,
    requires_manual_review,
    escalation_threshold,
    approval_required,
    reviewer_roles,
    created_by
) VALUES (
    'Default Content Moderation',
    'Default workflow for all content types with basic auto-moderation rules',
    ARRAY['document', 'template', 'comment', 'case_note', 'legal_opinion'],
    ARRAY['profanity_filter', 'confidential_data_detection', 'spam_detection'],
    true,
    2,
    true,
    ARRAY['ADMIN'],
    (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)
);

-- Insert sample auto-moderation rules configuration
CREATE TABLE auto_moderation_rules_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    severity_threshold VARCHAR(20) DEFAULT 'medium',
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
    action_on_trigger VARCHAR(50) DEFAULT 'flag',
    keywords TEXT[], -- For keyword-based rules
    patterns TEXT[], -- For regex patterns
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default auto-moderation rules
INSERT INTO auto_moderation_rules_config (rule_name, description, keywords, patterns) VALUES
('profanity_filter', 'Detects inappropriate language and profanity', 
 ARRAY['inappropriate', 'offensive', 'vulgar'], 
 ARRAY['\b(damn|hell|crap)\b']),
('confidential_data_detection', 'Detects potential confidential information leaks',
 ARRAY['confidential', 'secret', 'private', 'ssn', 'social security'],
 ARRAY['\b\d{3}-\d{2}-\d{4}\b', '\b\d{9}\b']),
('spam_detection', 'Detects spam and promotional content',
 ARRAY['buy now', 'click here', 'limited time', 'act now'],
 ARRAY['http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+']);

CREATE TRIGGER trigger_auto_moderation_rules_updated_at
    BEFORE UPDATE ON auto_moderation_rules_config
    FOR EACH ROW
    EXECUTE FUNCTION update_moderation_updated_at();