-- MIGRATION VERS ARCHITECTURE SAAS
-- JuristDZ - Transformation en plateforme multi-organisations

-- =============================================
-- ÉTAPE 1: SAUVEGARDE DES DONNÉES EXISTANTES
-- =============================================

-- Sauvegarder les dossiers existants (seulement si la table cases existe)
DO $$
BEGIN
    -- Vérifier si la table cases existe et créer la sauvegarde
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cases') THEN
        -- Créer la sauvegarde seulement si elle n'existe pas déjà
        IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cases_backup') THEN
            CREATE TABLE cases_backup AS SELECT * FROM cases;
            RAISE NOTICE 'Sauvegarde créée: % lignes copiées', (SELECT COUNT(*) FROM cases_backup);
        ELSE
            RAISE NOTICE 'Sauvegarde existe déjà, ignorée';
        END IF;
    ELSE
        RAISE NOTICE 'Table cases n''existe pas, pas de sauvegarde nécessaire';
    END IF;
END $$;

-- =============================================
-- ÉTAPE 2: SUPPRESSION DE L'ANCIEN SCHÉMA
-- =============================================

-- Désactiver RLS temporairement (seulement si la table existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cases') THEN
        ALTER TABLE cases DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS désactivé pour la table cases';
    END IF;
END $$;

-- Supprimer les anciennes politiques (seulement si elles existent)
DROP POLICY IF EXISTS "Users can view own cases" ON cases;
DROP POLICY IF EXISTS "Users can insert own cases" ON cases;
DROP POLICY IF EXISTS "Users can update own cases" ON cases;
DROP POLICY IF EXISTS "Users can delete own cases" ON cases;

-- Supprimer les anciennes vues
DROP VIEW IF EXISTS case_statistics;

-- =============================================
-- ÉTAPE 3: CRÉATION DU NOUVEAU SCHÉMA SAAS
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. SUBSCRIPTION PLANS
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Pricing (en Dinars Algériens)
    monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    yearly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'DZD',
    
    -- Limits and Features
    max_users INTEGER DEFAULT 1,
    max_cases INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 1,
    max_documents INTEGER DEFAULT 100,
    
    -- Features (JSON for flexibility)
    features JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. ORGANIZATIONS (Multi-tenant)
-- =============================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Basic Info
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('cabinet_avocat', 'etude_notaire', 'etude_huissier', 'entreprise')),
    
    -- Contact Info
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    
    -- Legal Info
    siret VARCHAR(20),
    barreau_id VARCHAR(50),
    chambre_id VARCHAR(50),
    
    -- SAAS Subscription
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    subscription_status VARCHAR(20) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    subscription_starts_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Billing
    billing_email VARCHAR(100),
    billing_address TEXT,
    
    -- Usage Tracking
    current_users INTEGER DEFAULT 0,
    current_cases INTEGER DEFAULT 0,
    current_storage_mb INTEGER DEFAULT 0,
    current_documents INTEGER DEFAULT 0,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT org_name_check CHECK (LENGTH(name) > 0)
);

-- =============================================
-- 3. USER PROFILES (Extended Supabase Auth)
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
    subscription_role VARCHAR(20) DEFAULT 'member' CHECK (subscription_role IN ('owner', 'admin', 'member')),
    
    -- Metadata
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'Africa/Algiers',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    
    CONSTRAINT profile_name_check CHECK (LENGTH(first_name) > 0 AND LENGTH(last_name) > 0)
);

-- =============================================
-- 4. CLIENTS (Shared across organization)
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
    cin VARCHAR(20),
    nif VARCHAR(20),
    rc VARCHAR(20),
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. CASES (Multi-user with proper isolation)
-- =============================================
-- Supprimer l'ancienne table cases (si elle existe)
DROP TABLE IF EXISTS cases CASCADE;

-- Créer la nouvelle table cases avec architecture SAAS
CREATE TABLE cases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Case information
    case_number VARCHAR(50),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    case_type VARCHAR(100),
    category VARCHAR(50),
    
    -- Status and priority
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'closed', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Financial
    estimated_value DECIMAL(15,2),
    hourly_rate DECIMAL(10,2),
    total_hours DECIMAL(8,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    billable_hours DECIMAL(8,2) DEFAULT 0,
    total_billed DECIMAL(15,2) DEFAULT 0,
    
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
-- 6. CASE COLLABORATORS
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
-- 7. DOCUMENTS
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
    document_type VARCHAR(50),
    tags TEXT[],
    is_confidential BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 8. ACTIVITY LOG
-- =============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    
    -- Activity information
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    description TEXT,
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

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

-- Activity Log
CREATE INDEX IF NOT EXISTS idx_activity_log_org_date ON activity_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_case_date ON activity_log(case_id, created_at DESC);

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
        id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid() LIMIT 1)
    );

CREATE POLICY "Organization admins can update" ON organizations
    FOR UPDATE USING (
        id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid() AND is_organization_admin = TRUE LIMIT 1)
    );

-- User Profiles: Users can see profiles in their organization
CREATE POLICY "Users can view org profiles" ON user_profiles
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid() LIMIT 1)
    );

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Clients: Organization-level access
CREATE POLICY "Users can view org clients" ON clients
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid() LIMIT 1)
    );

CREATE POLICY "Users can manage org clients" ON clients
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid() LIMIT 1)
    );

-- Cases: Organization + collaboration-based access
CREATE POLICY "Users can view accessible cases" ON cases
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid() LIMIT 1)
        AND (
            created_by = auth.uid() 
            OR assigned_to = auth.uid()
            OR id IN (SELECT case_id FROM case_collaborators WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage own cases" ON cases
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid() LIMIT 1)
        AND (created_by = auth.uid() OR assigned_to = auth.uid())
    );

-- Case Collaborators: Case-based access
CREATE POLICY "Users can view case collaborators" ON case_collaborators
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM cases WHERE 
            organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid() LIMIT 1)
            AND (created_by = auth.uid() OR assigned_to = auth.uid() OR id IN (SELECT case_id FROM case_collaborators WHERE user_id = auth.uid()))
        )
    );

-- Documents: Organization + case-based access
CREATE POLICY "Users can view accessible documents" ON documents
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid() LIMIT 1)
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
        organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid() LIMIT 1)
    );

-- =============================================
-- VIEWS FOR STATISTICS
-- =============================================

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
-- SAMPLE DATA
-- =============================================

-- Insert subscription plans
INSERT INTO subscription_plans (name, display_name, description, monthly_price, yearly_price, max_users, max_cases, max_storage_gb, features) VALUES
('starter', 'Starter', 'Parfait pour les avocats indépendants', 2900.00, 29000.00, 1, 50, 2, '{"ai_assistant": true, "basic_templates": true}'),
('professional', 'Professional', 'Idéal pour les petits cabinets', 9900.00, 99000.00, 5, 200, 10, '{"ai_assistant": true, "advanced_templates": true, "collaboration": true, "api_access": true}'),
('enterprise', 'Enterprise', 'Pour les grands cabinets et études', 29900.00, 299000.00, 50, 1000, 100, '{"ai_assistant": true, "advanced_templates": true, "collaboration": true, "api_access": true, "custom_branding": true, "priority_support": true}')
ON CONFLICT (name) DO NOTHING;

-- Create default organization for existing data
INSERT INTO organizations (name, type, subscription_plan_id, subscription_status) 
SELECT 'Cabinet de Démonstration', 'cabinet_avocat', sp.id, 'trial'
FROM subscription_plans sp 
WHERE sp.name = 'professional'
AND NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Cabinet de Démonstration');

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON case_collaborators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO authenticated;
GRANT SELECT, INSERT ON activity_log TO authenticated;

-- Grant permissions on views
GRANT SELECT ON user_case_statistics TO authenticated;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Vérification finale
DO $$
DECLARE
    table_count INTEGER;
    org_count INTEGER;
    plan_count INTEGER;
BEGIN
    -- Compter les nouvelles tables créées
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name IN ('subscription_plans', 'organizations', 'user_profiles', 'clients', 'cases', 'case_collaborators', 'documents', 'activity_log');
    
    -- Compter les données de base
    SELECT COUNT(*) INTO plan_count FROM subscription_plans;
    SELECT COUNT(*) INTO org_count FROM organizations;
    
    RAISE NOTICE '=== MIGRATION SAAS TERMINÉE ===';
    RAISE NOTICE 'Tables créées: %/8', table_count;
    RAISE NOTICE 'Plans d''abonnement: %', plan_count;
    RAISE NOTICE 'Organisations: %', org_count;
    
    IF table_count = 8 AND plan_count > 0 THEN
        RAISE NOTICE '✅ Migration réussie !';
    ELSE
        RAISE WARNING '⚠️ Migration incomplète - vérifiez les erreurs ci-dessus';
    END IF;
END $$;

-- Note: Les données de l'ancienne table cases sont sauvegardées dans cases_backup
-- Elles devront être migrées manuellement vers la nouvelle structure avec organization_id