-- JuristDZ - Multi-User Cloud Application Schema
-- Designed for multiple law firms, lawyers, bailiffs, etc.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. ORGANIZATIONS (Cabinets, Études, etc.)
-- =============================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('cabinet_avocat', 'etude_notaire', 'etude_huissier', 'entreprise')),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    siret VARCHAR(20),
    barreau_id VARCHAR(50), -- Pour les avocats
    chambre_id VARCHAR(50), -- Pour les notaires/huissiers
    subscription_plan VARCHAR(20) DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'pro', 'enterprise')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
    max_users INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT org_name_check CHECK (LENGTH(name) > 0)
);

-- =============================================
-- 2. USER PROFILES (Extended Supabase Auth)
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'avocat', 'notaire', 'huissier', 'juriste_entreprise', 'etudiant', 'magistrat')),
    phone VARCHAR(20),
    address TEXT,
    
    -- Professional information
    barreau_id VARCHAR(50),
    registration_number VARCHAR(50),
    specializations TEXT[],
    languages TEXT[] DEFAULT ARRAY['fr'],
    
    -- Permissions
    permissions JSONB DEFAULT '{}',
    is_organization_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'Africa/Algiers',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT profile_name_check CHECK (LENGTH(first_name) > 0 AND LENGTH(last_name) > 0)
);

-- =============================================
-- 3. CLIENTS (Shared across organization)
-- =============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Client information
    type VARCHAR(20) DEFAULT 'individual' CHECK (type IN ('individual', 'company')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(200),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    
    -- Legal information
    cin VARCHAR(20), -- Carte d'identité
    nif VARCHAR(20), -- Numéro d'identification fiscale
    rc VARCHAR(20),  -- Registre de commerce (pour entreprises)
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. CASES (Multi-user with proper isolation)
-- =============================================
CREATE TABLE IF NOT EXISTS cases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Case information
    case_number VARCHAR(50), -- Numéro de dossier interne
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    case_type VARCHAR(100),
    category VARCHAR(50), -- civil, penal, commercial, famille, etc.
    
    -- Status and priority
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'closed', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Financial
    estimated_value DECIMAL(15,2),
    hourly_rate DECIMAL(10,2),
    total_hours DECIMAL(8,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Dates
    deadline DATE,
    court_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    is_confidential BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT cases_title_check CHECK (LENGTH(title) > 0),
    CONSTRAINT cases_description_check CHECK (LENGTH(description) > 0)
);

-- =============================================
-- 5. CASE COLLABORATORS (Multi-user access)
-- =============================================
CREATE TABLE IF NOT EXISTS case_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(50) DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator', 'viewer')),
    permissions JSONB DEFAULT '{"read": true, "write": false, "delete": false}',
    added_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(case_id, user_id)
);

-- =============================================
-- 6. DOCUMENTS (File management)
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
    
    -- Document information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    -- Classification
    document_type VARCHAR(50), -- contract, judgment, correspondence, etc.
    tags TEXT[],
    is_confidential BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. ACTIVITY LOG (Audit trail)
-- =============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    
    -- Activity information
    action VARCHAR(50) NOT NULL, -- created, updated, deleted, viewed, etc.
    entity_type VARCHAR(50) NOT NULL, -- case, client, document, etc.
    entity_id UUID,
    description TEXT,
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for performance
    INDEX idx_activity_log_org_date (organization_id, created_at DESC),
    INDEX idx_activity_log_user_date (user_id, created_at DESC),
    INDEX idx_activity_log_case_date (case_id, created_at DESC)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(subscription_status);

-- User Profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_org ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(is_active);

-- Cases
CREATE INDEX IF NOT EXISTS idx_cases_org ON cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_cases_client ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_by ON cases(created_by);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_deadline ON cases(deadline);

-- Case Collaborators
CREATE INDEX IF NOT EXISTS idx_case_collaborators_case ON case_collaborators(case_id);
CREATE INDEX IF NOT EXISTS idx_case_collaborators_user ON case_collaborators(user_id);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_case ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Organization admins can update" ON organizations
    FOR UPDATE USING (
        id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid() AND is_organization_admin = TRUE)
    );

-- User Profiles: Users can see profiles in their organization
CREATE POLICY "Users can view org profiles" ON user_profiles
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

-- Clients: Organization-level access
CREATE POLICY "Users can view org clients" ON clients
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can manage org clients" ON clients
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    );

-- Cases: Organization + collaboration-based access
CREATE POLICY "Users can view accessible cases" ON cases
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
        AND (
            created_by = auth.uid() 
            OR assigned_to = auth.uid()
            OR id IN (SELECT case_id FROM case_collaborators WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage own cases" ON cases
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
        AND (created_by = auth.uid() OR assigned_to = auth.uid())
    );

-- Case Collaborators: Case-based access
CREATE POLICY "Users can view case collaborators" ON case_collaborators
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE 
            organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
            AND (created_by = auth.uid() OR assigned_to = auth.uid() OR id IN (SELECT case_id FROM case_collaborators WHERE user_id = auth.uid()))
        )
    );

-- Documents: Organization + case-based access
CREATE POLICY "Users can view accessible documents" ON documents
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
        AND (
            case_id IS NULL 
            OR case_id IN (
                SELECT id FROM cases WHERE 
                created_by = auth.uid() OR assigned_to = auth.uid() 
                OR id IN (SELECT case_id FROM case_collaborators WHERE user_id = auth.uid())
            )
        )
    );

-- Activity Log: Organization-based access
CREATE POLICY "Users can view org activity" ON activity_log
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    );

-- =============================================
-- VIEWS FOR STATISTICS AND REPORTING
-- =============================================

-- Organization statistics
CREATE OR REPLACE VIEW organization_statistics AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    COUNT(DISTINCT up.id) as total_users,
    COUNT(DISTINCT c.id) as total_cases,
    COUNT(DISTINCT cl.id) as total_clients,
    COUNT(DISTINCT d.id) as total_documents,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_cases,
    COUNT(DISTINCT c.id) FILTER (WHERE c.priority = 'urgent') as urgent_cases,
    COALESCE(SUM(c.estimated_value) FILTER (WHERE c.status = 'active'), 0) as total_estimated_value
FROM organizations o
LEFT JOIN user_profiles up ON o.id = up.organization_id AND up.is_active = TRUE
LEFT JOIN cases c ON o.id = c.organization_id
LEFT JOIN clients cl ON o.id = cl.organization_id AND cl.is_active = TRUE
LEFT JOIN documents d ON o.id = d.organization_id
GROUP BY o.id, o.name;

-- User case statistics
CREATE OR REPLACE VIEW user_case_statistics AS
SELECT 
    up.id as user_id,
    up.organization_id,
    COUNT(DISTINCT c.id) as total_cases,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_cases,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'closed') as closed_cases,
    COUNT(DISTINCT c.id) FILTER (WHERE c.priority = 'urgent') as urgent_cases,
    COUNT(DISTINCT c.id) FILTER (WHERE c.deadline <= CURRENT_DATE + INTERVAL '7 days' AND c.status = 'active') as upcoming_deadlines,
    COALESCE(SUM(c.estimated_value) FILTER (WHERE c.status = 'active'), 0) as total_estimated_value,
    COALESCE(SUM(c.total_hours), 0) as total_hours_worked
FROM user_profiles up
LEFT JOIN cases c ON (c.created_by = up.id OR c.assigned_to = up.id)
WHERE up.is_active = TRUE
GROUP BY up.id, up.organization_id;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON case_collaborators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO authenticated;
GRANT SELECT, INSERT ON activity_log TO authenticated;

-- Grant permissions on views
GRANT SELECT ON organization_statistics TO authenticated;
GRANT SELECT ON user_case_statistics TO authenticated;

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Sample organization
INSERT INTO organizations (name, type, address, email, subscription_plan) VALUES 
('Cabinet Dupont & Associés', 'cabinet_avocat', '123 Rue de la République, Alger', 'contact@dupont-avocats.dz', 'pro');

-- Note: User profiles will be created automatically when users sign up through Supabase Auth
-- The application should handle the profile creation in the signup process