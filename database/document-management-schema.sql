-- Document Management System - Database Schema
-- Comprehensive schema for JuristDZ Document Management System
-- Requirements: 8.6, 7.1

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENCRYPTION KEYS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS encryption_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key_data TEXT NOT NULL, -- Encrypted key data
    algorithm VARCHAR(50) NOT NULL DEFAULT 'AES-256',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- FOLDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS folders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    path TEXT NOT NULL, -- Full path for easy navigation
    level INTEGER NOT NULL CHECK (level >= 0 AND level <= 5), -- Max 5 levels deep
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    CONSTRAINT folders_name_check CHECK (LENGTH(name) > 0),
    CONSTRAINT folders_level_check CHECK (level <= 5)
);

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    
    -- File information
    name VARCHAR(500) NOT NULL,
    original_name VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 52428800), -- 50MB limit
    checksum VARCHAR(64) NOT NULL, -- SHA-256 hash
    
    -- Storage and encryption
    storage_path TEXT NOT NULL,
    encryption_key_id UUID REFERENCES encryption_keys(id) ON DELETE RESTRICT,
    
    -- Organization
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('contract', 'pleading', 'evidence', 'correspondence', 'template', 'other')),
    confidentiality_level VARCHAR(20) DEFAULT 'internal' CHECK (confidentiality_level IN ('public', 'internal', 'confidential', 'restricted')),
    
    -- Metadata
    description TEXT,
    custom_fields JSONB DEFAULT '{}',
    
    -- Timestamps and ownership
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    current_version_id UUID, -- Will reference document_versions table
    
    -- Status
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    retention_period INTEGER, -- Days to retain after deletion
    
    -- Multi-user support
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    CONSTRAINT documents_name_check CHECK (LENGTH(name) > 0),
    CONSTRAINT documents_original_name_check CHECK (LENGTH(original_name) > 0),
    CONSTRAINT documents_storage_path_check CHECK (LENGTH(storage_path) > 0)
);

-- =====================================================
-- DOCUMENT VERSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    change_description TEXT,
    is_current BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT document_versions_version_number_check CHECK (version_number > 0),
    CONSTRAINT document_versions_unique_current UNIQUE (document_id, is_current) DEFERRABLE INITIALLY DEFERRED
);

-- =====================================================
-- TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('contract', 'motion', 'brief', 'notice', 'agreement', 'other')),
    language VARCHAR(10) DEFAULT 'fr' CHECK (language IN ('fr', 'ar')),
    applicable_roles TEXT[] DEFAULT '{}', -- Array of user roles
    content TEXT NOT NULL,
    variables JSONB DEFAULT '{}', -- Template variables definition
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    CONSTRAINT templates_name_check CHECK (LENGTH(name) > 0),
    CONSTRAINT templates_content_check CHECK (LENGTH(content) > 0)
);

-- =====================================================
-- SIGNATURE WORKFLOWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS signature_workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- WORKFLOW SIGNERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_signers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_id UUID REFERENCES signature_workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    order_index INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_data TEXT, -- Digital signature data
    certificate TEXT, -- Signature certificate
    ip_address INET,
    location TEXT
);

-- =====================================================
-- DOCUMENT PERMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS document_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id VARCHAR(50), -- For role-based permissions
    permission VARCHAR(20) NOT NULL CHECK (permission IN ('view', 'edit', 'delete', 'share', 'sign')),
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT document_permissions_user_or_role CHECK (user_id IS NOT NULL OR role_id IS NOT NULL)
);

-- =====================================================
-- SHARE LINKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS share_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    permissions TEXT[] NOT NULL, -- Array of permissions
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    access_count INTEGER DEFAULT 0,
    max_access INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- DOCUMENT COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS document_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES document_comments(id) ON DELETE CASCADE, -- For threaded comments
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT document_comments_content_check CHECK (LENGTH(content) > 0)
);

-- =====================================================
-- AUDIT TRAIL TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'document', 'folder', 'template', etc.
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'view', 'download', etc.
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}', -- Additional action details
    
    CONSTRAINT audit_trail_entity_type_check CHECK (LENGTH(entity_type) > 0),
    CONSTRAINT audit_trail_action_check CHECK (LENGTH(action) > 0)
);

-- =====================================================
-- DOCUMENT WORKFLOWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS document_workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    current_step INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- WORKFLOW STEPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_id UUID REFERENCES document_workflows(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
    completed_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    
    CONSTRAINT workflow_steps_step_number_check CHECK (step_number > 0)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_confidentiality ON documents(confidentiality_level);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_custom_fields ON documents USING GIN(custom_fields);
CREATE INDEX IF NOT EXISTS idx_documents_is_deleted ON documents(is_deleted) WHERE is_deleted = FALSE;

-- Folders indexes
CREATE INDEX IF NOT EXISTS idx_folders_case_id ON folders(case_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_path ON folders(path);
CREATE INDEX IF NOT EXISTS idx_folders_level ON folders(level);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_is_deleted ON folders(is_deleted) WHERE is_deleted = FALSE;

-- Document versions indexes
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_versions_is_current ON document_versions(is_current) WHERE is_current = TRUE;

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_language ON templates(language);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_templates_applicable_roles ON templates USING GIN(applicable_roles);

-- Signature workflows indexes
CREATE INDEX IF NOT EXISTS idx_signature_workflows_document_id ON signature_workflows(document_id);
CREATE INDEX IF NOT EXISTS idx_signature_workflows_status ON signature_workflows(status);
CREATE INDEX IF NOT EXISTS idx_signature_workflows_expires_at ON signature_workflows(expires_at);
CREATE INDEX IF NOT EXISTS idx_signature_workflows_user_id ON signature_workflows(user_id);

-- Workflow signers indexes
CREATE INDEX IF NOT EXISTS idx_workflow_signers_workflow_id ON workflow_signers(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_signers_user_id ON workflow_signers(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_signers_status ON workflow_signers(status);
CREATE INDEX IF NOT EXISTS idx_workflow_signers_order ON workflow_signers(order_index);

-- Document permissions indexes
CREATE INDEX IF NOT EXISTS idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user_id ON document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_role_id ON document_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_permission ON document_permissions(permission);

-- Share links indexes
CREATE INDEX IF NOT EXISTS idx_share_links_document_id ON share_links(document_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF d() IS NOT NULL;

-- Sample folder structure
INSERT INTO folders (case_id, name, parent_id, user_id)
SELECT 
    c.id,
    'Documents',
    NULL,
    auth.uid()
FROM cases c 
WHERE c.user_id = auth.uid()
LIMIT 1;
*/T USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Note: Sample data would be inserted here for testing purposes
-- This is commented out for production deployment

/*
-- Sample encryption key
INSERT INTO encryption_keys (key_data, algorithm, user_id)
SELECT 
    encode(gen_random_bytes(32), 'base64'),
    'AES-256',
    auth.uid()
WHERE auth.ui
GRANT SELECT, INSERT, UPDATE, DELETE ON document_comments TO authenticated;
GRANT SELECT, INSERT ON audit_trail TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_workflows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_steps TO authenticated;

-- Grant permissions on views
GRANT SELECT ON document_statistics TO authenticated;
GRANT SELECT ON folder_hierarchy TO authenticated;
GRANT SELECT ON document_permissions_summary TO authenticated;

-- Grant usage on sequences
GRAN
GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON signature_workflows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_signers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON share_links TO authenticated;OR dp.expires_at > NOW())
LEFT JOIN share_links sl ON d.id = sl.document_id 
    AND sl.expires_at > NOW() AND sl.is_active = TRUE
WHERE d.user_id = auth.uid()
GROUP BY d.id, d.name, d.user_id;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON encryption_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON folders TO authenticated;sions_summary AS
SELECT 
    d.id as document_id,
    d.name as document_name,
    d.user_id as owner_id,
    ARRAY_AGG(DISTINCT dp.permission) FILTER (WHERE dp.permission IS NOT NULL) as granted_permissions,
    COUNT(DISTINCT dp.user_id) FILTER (WHERE dp.user_id IS NOT NULL) as shared_with_users,
    COUNT(DISTINCT sl.id) FILTER (WHERE sl.id IS NOT NULL AND sl.is_active = TRUE) as active_share_links
FROM documents d
LEFT JOIN document_permissions dp ON d.id = dp.document_id 
    AND (dp.expires_at IS NULL 
    FROM folders 
    WHERE parent_id IS NULL AND user_id = auth.uid()
    
    UNION ALL
    
    -- Recursive case: child folders
    SELECT 
        f.id, 
        f.name, 
        f.parent_id, 
        f.path, 
        f.level, 
        f.case_id,
        f.user_id,
        ft.path_array || f.name
    FROM folders f
    INNER JOIN folder_tree ft ON f.parent_id = ft.id
    WHERE f.user_id = auth.uid()
)
SELECT * FROM folder_tree;

-- View for document permissions summary
CREATE OR REPLACE VIEW document_permis confidentiality_level = 'restricted') as restricted_documents,
    COALESCE(SUM(size_bytes), 0) as total_storage_bytes,
    COALESCE(AVG(size_bytes), 0) as average_document_size
FROM documents
WHERE user_id = auth.uid();

-- View for folder hierarchy
CREATE OR REPLACE VIEW folder_hierarchy AS
WITH RECURSIVE folder_tree AS (
    -- Base case: root folders
    SELECT 
        id, 
        name, 
        parent_id, 
        path, 
        level, 
        case_id,
        user_id,
        ARRAY[name] as path_array document_statistics AS
SELECT 
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE is_deleted = FALSE) as active_documents,
    COUNT(*) FILTER (WHERE is_deleted = TRUE) as deleted_documents,
    COUNT(*) FILTER (WHERE category = 'contract') as contracts,
    COUNT(*) FILTER (WHERE category = 'pleading') as pleadings,
    COUNT(*) FILTER (WHERE category = 'evidence') as evidence,
    COUNT(*) FILTER (WHERE confidentiality_level = 'confidential') as confidential_documents,
    COUNT(*) FILTER (WHERE
    FOR UPDATE USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for document statistics
CREATE OR REPLACE VIEWDO NOTHING;

-- Storage bucket policies
CREATE POLICY "Users can upload documents to their own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own documents" ON storage.objects=================================
-- STORAGE BUCKET CONFIGURATION
-- =====================================================

-- Create storage bucket for encrypted documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    52428800, -- 50MB
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'text/plain']
) ON CONFLICT (id)     SELECT 1 FROM document_workflows dw 
            WHERE dw.id = workflow_steps.workflow_id 
            AND auth.uid() = dw.user_id
        )
    );

CREATE POLICY "Users can update workflow steps assigned to them or their workflows" ON workflow_steps
    FOR UPDATE USING (
        auth.uid() = assigned_user_id OR
        EXISTS (
            SELECT 1 FROM document_workflows dw 
            WHERE dw.id = workflow_steps.workflow_id 
            AND auth.uid() = dw.user_id
        )
    );

-- ====================        SELECT 1 FROM document_workflows dw 
            WHERE dw.id = workflow_steps.workflow_id 
            AND (
                auth.uid() = dw.user_id OR
                EXISTS (
                    SELECT 1 FROM documents d 
                    WHERE d.id = dw.document_id 
                    AND auth.uid() = d.user_id
                )
            )
        )
    );

CREATE POLICY "Users can insert workflow steps for their workflows" ON workflow_steps
    FOR INSERT WITH CHECK (
        EXISTS (
        ) = user_id AND
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = document_workflows.document_id 
            AND auth.uid() = d.user_id
        )
    );

CREATE POLICY "Users can update workflows they created" ON document_workflows
    FOR UPDATE USING (auth.uid() = user_id);

-- Workflow Steps Policies
CREATE POLICY "Users can view workflow steps for workflows they can see" ON workflow_steps
    FOR SELECT USING (
        auth.uid() = assigned_user_id OR
        EXISTS (
    NG (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = document_workflows.document_id 
            AND auth.uid() = d.user_id
        ) OR
        EXISTS (
            SELECT 1 FROM workflow_steps ws 
            WHERE ws.workflow_id = document_workflows.id 
            AND ws.assigned_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert workflows for their documents" ON document_workflows
    FOR INSERT WITH CHECK (
        auth.uid(CY "Users can update their own comments" ON document_comments
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own comments" ON document_comments
    FOR DELETE USING (auth.uid() = created_by);

-- Audit Trail Policies
CREATE POLICY "Users can view audit trail for their entities" ON audit_trail
    FOR SELECT USING (auth.uid() = user_id);

-- Document Workflows Policies
CREATE POLICY "Users can view workflows for their documents" ON document_workflows
    FOR SELECT USInts d 
            WHERE d.id = document_comments.document_id 
            AND (
                auth.uid() = d.user_id OR
                EXISTS (
                    SELECT 1 FROM document_permissions dp 
                    WHERE dp.document_id = d.id 
                    AND dp.user_id = auth.uid() 
                    AND dp.permission IN ('view', 'edit', 'delete', 'share')
                    AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
                )
            )
        )
    );

CREATE POLI               SELECT 1 FROM document_permissions dp 
                    WHERE dp.document_id = d.id 
                    AND dp.user_id = auth.uid() 
                    AND dp.permission IN ('view', 'edit', 'delete', 'share')
                    AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
                )
            )
        )
    );

CREATE POLICY "Users can insert comments for documents they can access" ON document_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM docume (
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = share_links.document_id 
            AND auth.uid() = d.user_id
        )
    );

-- Document Comments Policies
CREATE POLICY "Users can view comments for documents they can access" ON document_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = document_comments.document_id 
            AND (
                auth.uid() = d.user_id OR
                EXISTS (
                 SELECT 1 FROM documents d 
            WHERE d.id = share_links.document_id 
            AND auth.uid() = d.user_id
        )
    );

CREATE POLICY "Users can update share links for their documents" ON share_links
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = share_links.document_id 
            AND auth.uid() = d.user_id
        )
    );

CREATE POLICY "Users can delete share links for their documents" ON share_links
    FOR DELETE USING d.id = document_permissions.document_id 
            AND auth.uid() = d.user_id
        )
    );

-- Share Links Policies
CREATE POLICY "Users can view share links for their documents" ON share_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = share_links.document_id 
            AND auth.uid() = d.user_id
        )
    );

CREATE POLICY "Users can create share links for their documents" ON share_links
    FOR INSERT WITH CHECK (
        EXISTS (
 AND auth.uid() = d.user_id
        )
    );

CREATE POLICY "Users can update permissions for their documents" ON document_permissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = document_permissions.document_id 
            AND auth.uid() = d.user_id
        )
    );

CREATE POLICY "Users can revoke permissions for their documents" ON document_permissions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM documents d 
            WHEREfor their documents" ON document_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = document_permissions.document_id 
            AND auth.uid() = d.user_id
        ) OR
        auth.uid() = user_id
    );

CREATE POLICY "Users can grant permissions for their documents" ON document_permissions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = document_permissions.document_id 
            )
        )
    );

CREATE POLICY "Users can insert workflow signers for their workflows" ON workflow_signers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM signature_workflows sw 
            WHERE sw.id = workflow_signers.workflow_id 
            AND auth.uid() = sw.user_id
        )
    );

CREATE POLICY "Users can update their own signer records" ON workflow_signers
    FOR UPDATE USING (auth.uid() = user_id);

-- Document Permissions Policies
CREATE POLICY "Users can view permissions CY "Users can view workflow signers for workflows they can see" ON workflow_signers
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM signature_workflows sw 
            WHERE sw.id = workflow_signers.workflow_id 
            AND (
                auth.uid() = sw.user_id OR
                EXISTS (
                    SELECT 1 FROM documents d 
                    WHERE d.id = sw.document_id 
                    AND auth.uid() = d.user_id
                )
                  )
    );

CREATE POLICY "Users can insert signature workflows for their documents" ON signature_workflows
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = signature_workflows.document_id 
            AND auth.uid() = d.user_id
        )
    );

CREATE POLICY "Users can update signature workflows they created" ON signature_workflows
    FOR UPDATE USING (auth.uid() = user_id);

-- Workflow Signers Policies
CREATE POLIer_id);

-- Signature Workflows Policies
CREATE POLICY "Users can view signature workflows for their documents" ON signature_workflows
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = signature_workflows.document_id 
            AND auth.uid() = d.user_id
        ) OR
        EXISTS (
            SELECT 1 FROM workflow_signers ws 
            WHERE ws.workflow_id = signature_workflows.id 
            AND ws.user_id = auth.uid()
     );

-- Templates Policies
CREATE POLICY "Users can view own templates or applicable to their role" ON templates
    FOR SELECT USING (
        auth.uid() = user_id OR
        is_active = TRUE
    );

CREATE POLICY "Users can insert own templates" ON templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON templates
    FOR DELETE USING (auth.uid() = usSTS (
            SELECT 1 FROM documents d 
            WHERE d.id = document_versions.document_id 
            AND (
                auth.uid() = d.user_id OR
                EXISTS (
                    SELECT 1 FROM document_permissions dp 
                    WHERE dp.document_id = d.id 
                    AND dp.user_id = auth.uid() 
                    AND dp.permission IN ('edit', 'delete')
                    AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
                )
            )
        )
              EXISTS (
                    SELECT 1 FROM document_permissions dp 
                    WHERE dp.document_id = d.id 
                    AND dp.user_id = auth.uid() 
                    AND dp.permission IN ('view', 'edit', 'delete', 'share')
                    AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
                )
            )
        )
    );

CREATE POLICY "Users can insert document versions if they can edit document" ON document_versions
    FOR INSERT WITH CHECK (
        EXIment_id = documents.id 
            AND dp.user_id = auth.uid() 
            AND dp.permission = 'delete'
            AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
        )
    );

-- Document Versions Policies
CREATE POLICY "Users can view document versions if they can view document" ON document_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = document_versions.document_id 
            AND (
                auth.uid() = d.user_id OR
  S (
            SELECT 1 FROM document_permissions dp 
            WHERE dp.document_id = documents.id 
            AND dp.user_id = auth.uid() 
            AND dp.permission IN ('edit', 'delete')
            AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
        )
    );

CREATE POLICY "Users can delete own documents or with delete permission" ON documents
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM document_permissions dp 
            WHERE dp.docussions dp 
            WHERE dp.document_id = documents.id 
            AND dp.user_id = auth.uid() 
            AND dp.permission IN ('view', 'edit', 'delete', 'share')
            AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
        )
    );

CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents or with edit permission" ON documents
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXIST) = user_id);

CREATE POLICY "Users can insert own folders" ON folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON folders
    FOR DELETE USING (auth.uid() = user_id);

-- Documents Policies
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM document_permiLE ROW LEVEL SECURITY;

-- Encryption Keys Policies
CREATE POLICY "Users can view own encryption keys" ON encryption_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own encryption keys" ON encryption_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own encryption keys" ON encryption_keys
    FOR UPDATE USING (auth.uid() = user_id);

-- Folders Policies
CREATE POLICY "Users can view own folders" ON folders
    FOR SELECT USING (auth.uid(cument_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABr depth validation
CREATE TRIGGER validate_folder_depth_trigger
    BEFORE INSERT OR UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION validate_folder_depth();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE doEGER;
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        SELECT level INTO parent_level FROM folders WHERE id = NEW.parent_id;
        IF parent_level >= 5 THEN
            RAISE EXCEPTION 'Maximum folder depth of 5 levels exceeded';
        END IF;
        NEW.level = parent_level + 1;
        NEW.path = (SELECT path FROM folders WHERE id = NEW.parent_id) || '/' || NEW.name;
    ELSE
        NEW.level = 0;
        NEW.path = NEW.name;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for folde    FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

CREATE TRIGGER audit_templates_trigger
    AFTER INSERT OR UPDATE OR DELETE ON templates
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

CREATE TRIGGER audit_signature_workflows_trigger
    AFTER INSERT OR UPDATE OR DELETE ON signature_workflows
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

-- Function to validate folder hierarchy depth
CREATE OR REPLACE FUNCTION validate_folder_depth()
RETURNS TRIGGER AS $$
DECLARE
    parent_level INTALESCE(NEW.user_id, OLD.user_id, auth.uid()),
        jsonb_build_object(
            'operation', TG_OP,
            'table', TG_TABLE_NAME,
            'timestamp', NOW()
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Audit triggers for key tables
CREATE TRIGGER audit_documents_trigger
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

CREATE TRIGGER audit_folders_trigger
    AFTER INSERT OR UPDATE OR DELETE ON folders
  FOR EACH ROW
    EXECUTE FUNCTION update_document_current_version();

-- Function to create audit trail entries
CREATE OR REPLACE FUNCTION create_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_trail (entity_type, entity_id, action, user_id, details)
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'create'
            WHEN TG_OP = 'UPDATE' THEN 'update'
            WHEN TG_OP = 'DELETE' THEN 'delete'
        END,
        COthis document to not current
        UPDATE document_versions 
        SET is_current = FALSE 
        WHERE document_id = NEW.document_id AND id != NEW.id;
        
        -- Update the document's current_version_id
        UPDATE documents 
        SET current_version_id = NEW.id 
        WHERE id = NEW.document_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for document versions
CREATE TRIGGER update_document_current_version_trigger
    AFTER INSERT OR UPDATE ON document_versions
  ated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for document_comments table
CREATE TRIGGER update_document_comments_updated_at 
    BEFORE UPDATE ON document_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to maintain current version reference
CREATE OR REPLACE FUNCTION update_document_current_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current = TRUE THEN
        -- Set all other versions of workflow_steps(status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_step_number ON workflow_steps(step_number);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for documents table
CREATE TRIGGER update_documents_updcument_workflows_document_id ON document_workflows(document_id);
CREATE INDEX IF NOT EXISTS idx_document_workflows_status ON document_workflows(status);
CREATE INDEX IF NOT EXISTS idx_document_workflows_user_id ON document_workflows(user_id);

-- Workflow steps indexes
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_assigned_user ON workflow_steps(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON  idx_document_comments_is_deleted ON document_comments(is_deleted) WHERE is_deleted = FALSE;

-- Audit trail indexes
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_type_id ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action);

-- Document workflows indexes
CREATE INDEX IF NOT EXISTS idx_doNOT EXISTS idx_share_links_expires_at ON share_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_share_links_is_active ON share_links(is_active) WHERE is_active = TRUE;

-- Document comments indexes
CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_parent_id ON document_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_created_at ON document_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS