-- Custom Template System Database Schema
-- 
-- Creates tables and indexes for custom template creation, sharing, and management
-- Requirements: 3.4 - Custom template creation and reuse capabilities

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom templates table for tracking user-created templates
CREATE TABLE IF NOT EXISTS custom_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    created_by UUID NOT NULL,
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one custom template record per template
    UNIQUE(template_id)
);

-- Template shares table for managing template sharing
CREATE TABLE IF NOT EXISTS template_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL,
    shared_with_users UUID[] DEFAULT '{}', -- Array of user IDs
    shared_with_roles TEXT[] DEFAULT '{}', -- Array of role names
    permissions TEXT[] NOT NULL DEFAULT '{}', -- Array of permissions (view, edit, share)
    message TEXT, -- Optional message to recipients
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT template_shares_permissions_not_empty CHECK (array_length(permissions, 1) > 0),
    CONSTRAINT template_shares_valid_permissions CHECK (
        permissions <@ ARRAY['view', 'edit', 'delete', 'share', 'sign']
    )
);

-- Template favorites table for user favorite templates
CREATE TABLE IF NOT EXISTS template_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one favorite record per user per template
    UNIQUE(template_id, user_id)
);

-- Template collaborators table for collaborative editing
CREATE TABLE IF NOT EXISTS template_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'editor', -- owner, editor, viewer
    permissions TEXT[] NOT NULL DEFAULT '{}',
    invited_by UUID NOT NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, revoked
    last_activity_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT template_collaborators_valid_role CHECK (role IN ('owner', 'editor', 'viewer')),
    CONSTRAINT template_collaborators_valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
    CONSTRAINT template_collaborators_permissions_not_empty CHECK (array_length(permissions, 1) > 0)
);

-- Template editor sessions table for tracking editing sessions
CREATE TABLE IF NOT EXISTS template_editor_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    content TEXT, -- Current editing content
    variables JSONB DEFAULT '[]'::jsonb, -- Current variables being edited
    is_dirty BOOLEAN DEFAULT false, -- Has unsaved changes
    last_saved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    
    -- Constraints
    CONSTRAINT template_editor_sessions_token_not_empty CHECK (LENGTH(TRIM(session_token)) > 0)
);

-- Template comments table for collaborative feedback
CREATE TABLE IF NOT EXISTS template_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    parent_comment_id UUID REFERENCES template_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    position_start INTEGER, -- Character position in template content
    position_end INTEGER, -- End character position for range comments
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT template_comments_content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
    CONSTRAINT template_comments_valid_position CHECK (
        (position_start IS NULL AND position_end IS NULL) OR
        (position_start IS NOT NULL AND position_end IS NOT NULL AND position_start <= position_end)
    )
);

-- Template tags table for better organization
CREATE TABLE IF NOT EXISTS template_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique tags per template
    UNIQUE(template_id, tag_name),
    
    -- Constraints
    CONSTRAINT template_tags_name_not_empty CHECK (LENGTH(TRIM(tag_name)) > 0)
);

-- Template analytics table for usage tracking
CREATE TABLE IF NOT EXISTS template_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- view, edit, generate, share, favorite
    user_id UUID,
    session_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT template_analytics_valid_event_type CHECK (
        event_type IN ('view', 'edit', 'generate', 'share', 'favorite', 'unfavorite', 'clone', 'delete')
    )
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_custom_templates_template_id ON custom_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_custom_templates_created_by ON custom_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_templates_is_private ON custom_templates(is_private);

CREATE INDEX IF NOT EXISTS idx_template_shares_template_id ON template_shares(template_id);
CREATE INDEX IF NOT EXISTS idx_template_shares_shared_by ON template_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_template_shares_shared_with_users ON template_shares USING GIN(shared_with_users);
CREATE INDEX IF NOT EXISTS idx_template_shares_shared_with_roles ON template_shares USING GIN(shared_with_roles);
CREATE INDEX IF NOT EXISTS idx_template_shares_is_active ON template_shares(is_active);
CREATE INDEX IF NOT EXISTS idx_template_shares_expires_at ON template_shares(expires_at);

CREATE INDEX IF NOT EXISTS idx_template_favorites_template_id ON template_favorites(template_id);
CREATE INDEX IF NOT EXISTS idx_template_favorites_user_id ON template_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_template_favorites_created_at ON template_favorites(created_at);

CREATE INDEX IF NOT EXISTS idx_template_collaborators_template_id ON template_collaborators(template_id);
CREATE INDEX IF NOT EXISTS idx_template_collaborators_user_id ON template_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_template_collaborators_status ON template_collaborators(status);
CREATE INDEX IF NOT EXISTS idx_template_collaborators_role ON template_collaborators(role);

CREATE INDEX IF NOT EXISTS idx_template_editor_sessions_template_id ON template_editor_sessions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_editor_sessions_user_id ON template_editor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_template_editor_sessions_session_token ON template_editor_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_template_editor_sessions_expires_at ON template_editor_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_template_comments_template_id ON template_comments(template_id);
CREATE INDEX IF NOT EXISTS idx_template_comments_user_id ON template_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_template_comments_parent_comment_id ON template_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_template_comments_is_resolved ON template_comments(is_resolved);

CREATE INDEX IF NOT EXISTS idx_template_tags_template_id ON template_tags(template_id);
CREATE INDEX IF NOT EXISTS idx_template_tags_tag_name ON template_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_template_tags_created_by ON template_tags(created_by);

CREATE INDEX IF NOT EXISTS idx_template_analytics_template_id ON template_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_event_type ON template_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_template_analytics_user_id ON template_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_template_analytics_created_at ON template_analytics(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE custom_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_editor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access their own custom templates
CREATE POLICY custom_templates_owner_access ON custom_templates
    FOR ALL
    USING (created_by = auth.uid());

-- RLS Policy: Template shares - users can see shares they created or are recipients of
CREATE POLICY template_shares_access ON template_shares
    FOR SELECT
    USING (
        shared_by = auth.uid() OR
        auth.uid() = ANY(shared_with_users) OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = ANY(shared_with_roles)
        )
    );

-- RLS Policy: Users can create template shares for their own templates
CREATE POLICY template_shares_create ON template_shares
    FOR INSERT
    WITH CHECK (
        shared_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM templates t
            JOIN custom_templates ct ON t.id = ct.template_id
            WHERE t.id = template_id AND ct.created_by = auth.uid()
        )
    );

-- RLS Policy: Users can update their own template shares
CREATE POLICY template_shares_update ON template_shares
    FOR UPDATE
    USING (shared_by = auth.uid())
    WITH CHECK (shared_by = auth.uid());

-- RLS Policy: Users can manage their own favorites
CREATE POLICY template_favorites_user_access ON template_favorites
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- RLS Policy: Template collaborators can see collaborations they're part of
CREATE POLICY template_collaborators_access ON template_collaborators
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        invited_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM templates t
            JOIN custom_templates ct ON t.id = ct.template_id
            WHERE t.id = template_id AND ct.created_by = auth.uid()
        )
    );

-- RLS Policy: Template owners can manage collaborators
CREATE POLICY template_collaborators_manage ON template_collaborators
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM templates t
            JOIN custom_templates ct ON t.id = ct.template_id
            WHERE t.id = template_id AND ct.created_by = auth.uid()
        )
    )
    WITH CHECK (
        invited_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM templates t
            JOIN custom_templates ct ON t.id = ct.template_id
            WHERE t.id = template_id AND ct.created_by = auth.uid()
        )
    );

-- RLS Policy: Users can manage their own editor sessions
CREATE POLICY template_editor_sessions_user_access ON template_editor_sessions
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can see comments on templates they have access to
CREATE POLICY template_comments_access ON template_comments
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM templates t
            WHERE t.id = template_id AND (
                t.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM template_collaborators tc
                    WHERE tc.template_id = t.id AND tc.user_id = auth.uid() AND tc.status = 'accepted'
                )
            )
        )
    );

-- RLS Policy: Users can create comments on templates they have access to
CREATE POLICY template_comments_create ON template_comments
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM templates t
            WHERE t.id = template_id AND (
                t.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM template_collaborators tc
                    WHERE tc.template_id = t.id AND tc.user_id = auth.uid() AND tc.status = 'accepted'
                )
            )
        )
    );

-- RLS Policy: Users can update their own comments
CREATE POLICY template_comments_update ON template_comments
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- RLS Policy: Template tags follow template access
CREATE POLICY template_tags_access ON template_tags
    FOR ALL
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM templates t
            WHERE t.id = template_id AND (
                t.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM template_collaborators tc
                    WHERE tc.template_id = t.id AND tc.user_id = auth.uid() AND tc.status = 'accepted'
                )
            )
        )
    );

-- RLS Policy: Template analytics - users can see analytics for their templates
CREATE POLICY template_analytics_access ON template_analytics
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM templates t
            JOIN custom_templates ct ON t.id = ct.template_id
            WHERE t.id = template_id AND ct.created_by = auth.uid()
        )
    );

-- RLS Policy: Anyone can insert analytics (for tracking)
CREATE POLICY template_analytics_insert ON template_analytics
    FOR INSERT
    WITH CHECK (true);

-- Functions for custom template management

-- Function to get user's template library
CREATE OR REPLACE FUNCTION get_user_template_library(user_uuid UUID)
RETURNS TABLE (
    template_type TEXT,
    id UUID,
    name VARCHAR(255),
    description TEXT,
    category VARCHAR(50),
    language VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_favorite BOOLEAN,
    usage_count BIGINT
) AS $$
BEGIN
    -- Personal templates
    RETURN QUERY
    SELECT 
        'personal'::TEXT as template_type,
        t.id, t.name, t.description, t.category, t.language,
        t.created_at, t.updated_at,
        EXISTS(SELECT 1 FROM template_favorites tf WHERE tf.template_id = t.id AND tf.user_id = user_uuid) as is_favorite,
        COALESCE(tu.usage_count, 0) as usage_count
    FROM templates t
    JOIN custom_templates ct ON t.id = ct.template_id
    LEFT JOIN (
        SELECT template_id, COUNT(*) as usage_count
        FROM template_usage
        WHERE used_by = user_uuid
        GROUP BY template_id
    ) tu ON t.id = tu.template_id
    WHERE ct.created_by = user_uuid AND t.is_active = true;

    -- Shared templates
    RETURN QUERY
    SELECT 
        'shared'::TEXT as template_type,
        t.id, t.name, t.description, t.category, t.language,
        t.created_at, t.updated_at,
        EXISTS(SELECT 1 FROM template_favorites tf WHERE tf.template_id = t.id AND tf.user_id = user_uuid) as is_favorite,
        COALESCE(tu.usage_count, 0) as usage_count
    FROM templates t
    JOIN template_shares ts ON t.id = ts.template_id
    LEFT JOIN (
        SELECT template_id, COUNT(*) as usage_count
        FROM template_usage
        WHERE used_by = user_uuid
        GROUP BY template_id
    ) tu ON t.id = tu.template_id
    WHERE (
        user_uuid = ANY(ts.shared_with_users) OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = user_uuid 
            AND auth.users.raw_user_meta_data->>'role' = ANY(ts.shared_with_roles)
        )
    ) AND ts.is_active = true AND t.is_active = true;

    -- Favorite templates
    RETURN QUERY
    SELECT 
        'favorite'::TEXT as template_type,
        t.id, t.name, t.description, t.category, t.language,
        t.created_at, t.updated_at,
        true as is_favorite,
        COALESCE(tu.usage_count, 0) as usage_count
    FROM templates t
    JOIN template_favorites tf ON t.id = tf.template_id
    LEFT JOIN (
        SELECT template_id, COUNT(*) as usage_count
        FROM template_usage
        WHERE used_by = user_uuid
        GROUP BY template_id
    ) tu ON t.id = tu.template_id
    WHERE tf.user_id = user_uuid AND t.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track template analytics
CREATE OR REPLACE FUNCTION track_template_analytics(
    template_uuid UUID,
    event_type_param VARCHAR(50),
    user_uuid UUID DEFAULT NULL,
    session_id_param VARCHAR(255) DEFAULT NULL,
    metadata_param JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    analytics_id UUID;
BEGIN
    INSERT INTO template_analytics (template_id, event_type, user_id, session_id, metadata)
    VALUES (template_uuid, event_type_param, user_uuid, session_id_param, metadata_param)
    RETURNING id INTO analytics_id;
    
    RETURN analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get template sharing information
CREATE OR REPLACE FUNCTION get_template_sharing_info(template_uuid UUID)
RETURNS TABLE (
    share_id UUID,
    shared_with_users UUID[],
    shared_with_roles TEXT[],
    permissions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id as share_id,
        ts.shared_with_users,
        ts.shared_with_roles,
        ts.permissions,
        ts.created_at,
        ts.expires_at,
        ts.access_count,
        ts.is_active
    FROM template_shares ts
    WHERE ts.template_id = template_uuid AND ts.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired editor sessions
CREATE OR REPLACE FUNCTION cleanup_expired_editor_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM template_editor_sessions
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update template_shares access count
CREATE OR REPLACE FUNCTION update_template_share_access()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE template_shares 
    SET 
        access_count = access_count + 1,
        last_accessed_at = NOW()
    WHERE id = NEW.share_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update editor session timestamp
CREATE OR REPLACE FUNCTION update_editor_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_editor_sessions_updated_at_trigger
    BEFORE UPDATE ON template_editor_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_editor_session_timestamp();

-- Trigger to update custom templates timestamp
CREATE OR REPLACE FUNCTION update_custom_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_templates_updated_at_trigger
    BEFORE UPDATE ON custom_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_template_timestamp();

-- Comments for documentation
COMMENT ON TABLE custom_templates IS 'Tracks user-created custom templates with privacy settings';
COMMENT ON TABLE template_shares IS 'Manages template sharing with users and roles including permissions and expiration';
COMMENT ON TABLE template_favorites IS 'Stores user favorite templates for quick access';
COMMENT ON TABLE template_collaborators IS 'Manages collaborative editing permissions for templates';
COMMENT ON TABLE template_editor_sessions IS 'Tracks active template editing sessions with auto-save capabilities';
COMMENT ON TABLE template_comments IS 'Stores comments and feedback on templates for collaboration';
COMMENT ON TABLE template_tags IS 'Custom tags for better template organization and discovery';
COMMENT ON TABLE template_analytics IS 'Tracks template usage analytics for insights and optimization';

COMMENT ON COLUMN template_shares.shared_with_users IS 'Array of user UUIDs who have access to the template';
COMMENT ON COLUMN template_shares.shared_with_roles IS 'Array of role names that have access to the template';
COMMENT ON COLUMN template_shares.permissions IS 'Array of permissions granted (view, edit, delete, share, sign)';
COMMENT ON COLUMN template_editor_sessions.content IS 'Current editing content, may differ from saved template content';
COMMENT ON COLUMN template_editor_sessions.is_dirty IS 'Indicates if there are unsaved changes in the editing session';
COMMENT ON COLUMN template_comments.position_start IS 'Character position in template content where comment applies';
COMMENT ON COLUMN template_analytics.event_type IS 'Type of event: view, edit, generate, share, favorite, unfavorite, clone, delete';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_shares TO authenticated;
GRANT SELECT, INSERT, DELETE ON template_favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_collaborators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_editor_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_tags TO authenticated;
GRANT SELECT, INSERT ON template_analytics TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_template_library(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_template_analytics(UUID, VARCHAR(50), UUID, VARCHAR(255), JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_template_sharing_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_editor_sessions() TO authenticated;

-- Create a scheduled job to cleanup expired sessions (if pg_cron is available)
-- SELECT cron.schedule('cleanup-expired-editor-sessions', '0 */6 * * *', 'SELECT cleanup_expired_editor_sessions();');