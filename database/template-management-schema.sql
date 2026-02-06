-- Template Management System Database Schema
-- 
-- Creates tables and indexes for template storage, access control, and management
-- Requirements: 3.1, 3.2

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Templates table for storing template definitions
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('contract', 'motion', 'brief', 'notice', 'agreement')),
    language VARCHAR(10) NOT NULL CHECK (language IN ('fr', 'ar')),
    applicable_roles TEXT[] NOT NULL, -- Array of user roles (avocat, notaire, huissier, magistrate, admin)
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- Template variables as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    organization_id UUID, -- For multi-tenant support
    
    -- Constraints
    CONSTRAINT templates_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT templates_content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
    CONSTRAINT templates_applicable_roles_not_empty CHECK (array_length(applicable_roles, 1) > 0)
);

-- Template access control table
CREATE TABLE IF NOT EXISTS template_access_control (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    allowed_roles TEXT[] NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID,
    
    -- Ensure one access control entry per template
    UNIQUE(template_id)
);

-- Template usage tracking table
CREATE TABLE IF NOT EXISTS template_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    used_by UUID NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    variables_used JSONB, -- Variables and values used
    document_generated_id UUID, -- Reference to generated document
    organization_id UUID,
    
    -- Index for performance
    INDEX idx_template_usage_template_id (template_id),
    INDEX idx_template_usage_used_by (used_by),
    INDEX idx_template_usage_used_at (used_at)
);

-- Template versions table for version control
CREATE TABLE IF NOT EXISTS template_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    change_description TEXT,
    is_current BOOLEAN DEFAULT false,
    
    -- Ensure unique version numbers per template
    UNIQUE(template_id, version_number)
);

-- Template categories lookup table
CREATE TABLE IF NOT EXISTS template_categories (
    id VARCHAR(50) PRIMARY KEY,
    name_fr VARCHAR(100) NOT NULL, -- French name
    name_ar VARCHAR(100), -- Arabic name
    description_fr TEXT,
    description_ar TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Insert default template categories
INSERT INTO template_categories (id, name_fr, name_ar, description_fr, description_ar, sort_order) VALUES
('contract', 'Contrat', 'عقد', 'Modèles de contrats et accords', 'قوالب العقود والاتفاقيات', 1),
('motion', 'Requête', 'طلب', 'Modèles de requêtes et motions', 'قوالب الطلبات والالتماسات', 2),
('brief', 'Mémoire', 'مذكرة', 'Modèles de mémoires et plaidoiries', 'قوالب المذكرات والمرافعات', 3),
('notice', 'Avis', 'إشعار', 'Modèles d''avis et notifications', 'قوالب الإشعارات والتبليغات', 4),
('agreement', 'Accord', 'اتفاقية', 'Modèles d''accords et conventions', 'قوالب الاتفاقيات والمعاهدات', 5)
ON CONFLICT (id) DO NOTHING;

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_language ON templates(language);
CREATE INDEX IF NOT EXISTS idx_templates_applicable_roles ON templates USING GIN(applicable_roles);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_organization_id ON templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_templates_name_search ON templates USING GIN(to_tsvector('french', name));
CREATE INDEX IF NOT EXISTS idx_templates_content_search ON templates USING GIN(to_tsvector('french', content));

-- Indexes for template access control
CREATE INDEX IF NOT EXISTS idx_template_access_control_template_id ON template_access_control(template_id);
CREATE INDEX IF NOT EXISTS idx_template_access_control_allowed_roles ON template_access_control USING GIN(allowed_roles);
CREATE INDEX IF NOT EXISTS idx_template_access_control_organization_id ON template_access_control(organization_id);

-- Indexes for template versions
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_is_current ON template_versions(is_current);
CREATE INDEX IF NOT EXISTS idx_template_versions_created_at ON template_versions(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access templates for their roles
CREATE POLICY templates_role_access ON templates
    FOR SELECT
    USING (
        is_active = true AND
        (
            -- Check if user's role is in applicable_roles
            EXISTS (
                SELECT 1 FROM auth.users 
                WHERE auth.users.id = auth.uid() 
                AND auth.users.raw_user_meta_data->>'role' = ANY(applicable_roles)
            )
            OR
            -- Template creator can always access
            created_by = auth.uid()
            OR
            -- Admin can access all templates
            EXISTS (
                SELECT 1 FROM auth.users 
                WHERE auth.users.id = auth.uid() 
                AND auth.users.raw_user_meta_data->>'role' = 'admin'
            )
        )
    );

-- RLS Policy: Users can create templates
CREATE POLICY templates_create ON templates
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid() AND
        updated_by = auth.uid()
    );

-- RLS Policy: Users can update their own templates or if they have admin role
CREATE POLICY templates_update ON templates
    FOR UPDATE
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    )
    WITH CHECK (
        updated_by = auth.uid()
    );

-- RLS Policy: Template access control follows template access
CREATE POLICY template_access_control_policy ON template_access_control
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM templates 
            WHERE templates.id = template_id 
            AND (
                templates.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.id = auth.uid() 
                    AND auth.users.raw_user_meta_data->>'role' = 'admin'
                )
            )
        )
    );

-- RLS Policy: Template usage tracking
CREATE POLICY template_usage_policy ON template_usage
    FOR ALL
    USING (
        used_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policy: Template versions follow template access
CREATE POLICY template_versions_policy ON template_versions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM templates 
            WHERE templates.id = template_id 
            AND (
                templates.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.id = auth.uid() 
                    AND auth.users.raw_user_meta_data->>'role' = 'admin'
                )
            )
        )
    );

-- Functions for template management

-- Function to get templates by role
CREATE OR REPLACE FUNCTION get_templates_by_role(
    user_role TEXT,
    template_language TEXT DEFAULT 'fr',
    template_category TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    category VARCHAR(50),
    language VARCHAR(10),
    applicable_roles TEXT[],
    content TEXT,
    variables JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by UUID,
    is_active BOOLEAN,
    version INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id, t.name, t.description, t.category, t.language,
        t.applicable_roles, t.content, t.variables,
        t.created_at, t.created_by, t.updated_at, t.updated_by,
        t.is_active, t.version
    FROM templates t
    WHERE 
        t.is_active = true
        AND t.language = template_language
        AND user_role = ANY(t.applicable_roles)
        AND (template_category IS NULL OR t.category = template_category)
    ORDER BY t.category, t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track template usage
CREATE OR REPLACE FUNCTION track_template_usage(
    template_uuid UUID,
    variables_data JSONB DEFAULT NULL,
    document_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    usage_id UUID;
BEGIN
    INSERT INTO template_usage (template_id, used_by, variables_used, document_generated_id)
    VALUES (template_uuid, auth.uid(), variables_data, document_id)
    RETURNING id INTO usage_id;
    
    RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get template usage statistics
CREATE OR REPLACE FUNCTION get_template_usage_stats(template_uuid UUID)
RETURNS TABLE (
    usage_count BIGINT,
    last_used TIMESTAMP WITH TIME ZONE,
    unique_users BIGINT,
    popular_variables JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as usage_count,
        MAX(used_at) as last_used,
        COUNT(DISTINCT used_by) as unique_users,
        jsonb_agg(DISTINCT variables_used) FILTER (WHERE variables_used IS NOT NULL) as popular_variables
    FROM template_usage
    WHERE template_id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update template updated_at timestamp
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER templates_updated_at_trigger
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_template_updated_at();

-- Trigger to create template version on update
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create version if content or variables changed
    IF OLD.content != NEW.content OR OLD.variables != NEW.variables THEN
        -- Mark previous version as not current
        UPDATE template_versions 
        SET is_current = false 
        WHERE template_id = NEW.id AND is_current = true;
        
        -- Create new version
        INSERT INTO template_versions (
            template_id, version_number, name, description, content, variables,
            created_by, is_current, change_description
        ) VALUES (
            NEW.id, NEW.version, NEW.name, NEW.description, NEW.content, NEW.variables,
            NEW.updated_by, true, 'Template updated'
        );
        
        -- Increment version number
        NEW.version = NEW.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER templates_version_trigger
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION create_template_version();

-- Comments for documentation
COMMENT ON TABLE templates IS 'Stores template definitions with role-based access control';
COMMENT ON TABLE template_access_control IS 'Manages access control for templates based on user roles';
COMMENT ON TABLE template_usage IS 'Tracks template usage for analytics and optimization';
COMMENT ON TABLE template_versions IS 'Maintains version history of template changes';
COMMENT ON TABLE template_categories IS 'Lookup table for template categories with multi-language support';

COMMENT ON COLUMN templates.applicable_roles IS 'Array of user roles that can access this template (avocat, notaire, huissier, magistrate, admin)';
COMMENT ON COLUMN templates.variables IS 'JSON array of template variables with their definitions and validation rules';
COMMENT ON COLUMN templates.content IS 'Template content with variable placeholders in {{variable_name}} format';
COMMENT ON COLUMN template_access_control.allowed_roles IS 'Roles allowed to access the template, mirrors templates.applicable_roles';
COMMENT ON COLUMN template_usage.variables_used IS 'JSON object containing the variables and values used when generating document';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON template_access_control TO authenticated;
GRANT SELECT, INSERT ON template_usage TO authenticated;
GRANT SELECT ON template_versions TO authenticated;
GRANT SELECT ON template_categories TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_templates_by_role(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION track_template_usage(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_template_usage_stats(UUID) TO authenticated;