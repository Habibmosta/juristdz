-- JuristDZ - Complete SAAS Architecture
-- Multi-tenant legal platform with billing, subscriptions, and enterprise features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. SUBSCRIPTION PLANS (SAAS Pricing)
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Pricing
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
-- 2. ORGANIZATIONS (Enhanced for SAAS)
-- =============================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Basic Info
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE, -- For custom domains: cabinet-dupont.juristdz.com
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
    payment_method_id VARCHAR(100), -- Stripe/payment provider ID
    
    -- Usage Tracking
    current_users INTEGER DEFAULT 0,
    current_cases INTEGER DEFAULT 0,
    current_storage_mb INTEGER DEFAULT 0,
    current_documents INTEGER DEFAULT 0,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}', -- Custom logo, colors, etc.
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT org_name_check CHECK (LENGTH(name) > 0)
);

-- =============================================
-- 3. SUBSCRIPTION HISTORY (Billing History)
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    subscription_plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
    
    -- Billing Period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Pricing
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'DZD',
    
    -- Payment Info
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    payment_provider_id VARCHAR(100), -- Stripe invoice ID, etc.
    
    -- Metadata
    invoice_number VARCHAR(50),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. USAGE METRICS (SAAS Analytics)
-- =============================================
CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    
    -- Date (daily metrics)
    metric_date DATE NOT NULL,
    
    -- Usage Counters
    active_users INTEGER DEFAULT 0,
    total_cases INTEGER DEFAULT 0,
    new_cases INTEGER DEFAULT 0,
    total_documents INTEGER DEFAULT 0,
    new_documents INTEGER DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,
    
    -- Activity Metrics
    logins INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    searches INTEGER DEFAULT 0,
    
    -- Performance Metrics
    avg_response_time_ms INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, metric_date)
);

-- =============================================
-- 5. FEATURE FLAGS (SAAS Feature Management)
-- =============================================
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Feature Control
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    
    -- Targeting
    target_plans TEXT[], -- Which subscription plans get this feature
    target_organizations UUID[], -- Specific organizations
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. SYSTEM NOTIFICATIONS (SAAS Communication)
-- =============================================
CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Targeting
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('all', 'plan', 'organization', 'user')),
    target_ids UUID[], -- Plan IDs, Organization IDs, or User IDs
    
    -- Notification Content
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    
    -- Delivery
    channels TEXT[] DEFAULT ARRAY['in_app'], -- in_app, email, sms
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. API KEYS (SAAS API Access)
-- =============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Key Info
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed API key
    key_prefix VARCHAR(20) NOT NULL, -- First few chars for identification
    
    -- Permissions
    scopes TEXT[] DEFAULT ARRAY['read'], -- read, write, admin
    rate_limit_per_hour INTEGER DEFAULT 1000,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 8. WEBHOOKS (SAAS Integrations)
-- =============================================
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Webhook Config
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    events TEXT[] NOT NULL, -- case.created, case.updated, etc.
    
    -- Security
    secret VARCHAR(100), -- For signature verification
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ENHANCED EXISTING TABLES FOR SAAS
-- =============================================

-- Add SAAS fields to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_role VARCHAR(20) DEFAULT 'member' CHECK (subscription_role IN ('owner', 'admin', 'member'));

-- Add SAAS fields to cases
ALTER TABLE cases ADD COLUMN IF NOT EXISTS billable_hours DECIMAL(8,2) DEFAULT 0;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS total_billed DECIMAL(15,2) DEFAULT 0;

-- =============================================
-- INDEXES FOR SAAS PERFORMANCE
-- =============================================

-- Subscription Plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_subscription ON organizations(subscription_plan_id, subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_trial ON organizations(trial_ends_at) WHERE subscription_status = 'trial';
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Subscription History
CREATE INDEX IF NOT EXISTS idx_subscription_history_org ON subscription_history(organization_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_history_status ON subscription_history(payment_status);

-- Usage Metrics
CREATE INDEX IF NOT EXISTS idx_usage_metrics_org_date ON usage_metrics(organization_id, metric_date DESC);

-- Feature Flags
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

-- API Keys
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- Webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks(organization_id);

-- =============================================
-- SAAS VIEWS AND FUNCTIONS
-- =============================================

-- Organization usage summary
CREATE OR REPLACE VIEW organization_usage_summary AS
SELECT 
    o.id,
    o.name,
    o.subscription_status,
    sp.name as plan_name,
    sp.max_users,
    sp.max_cases,
    sp.max_storage_gb,
    o.current_users,
    o.current_cases,
    o.current_storage_mb,
    ROUND((o.current_users::DECIMAL / sp.max_users) * 100, 2) as users_usage_percent,
    ROUND((o.current_cases::DECIMAL / sp.max_cases) * 100, 2) as cases_usage_percent,
    ROUND((o.current_storage_mb::DECIMAL / (sp.max_storage_gb * 1024)) * 100, 2) as storage_usage_percent,
    o.trial_ends_at,
    o.subscription_ends_at
FROM organizations o
LEFT JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
WHERE o.is_active = TRUE;

-- Monthly recurring revenue (MRR)
CREATE OR REPLACE VIEW monthly_recurring_revenue AS
SELECT 
    DATE_TRUNC('month', CURRENT_DATE) as month,
    COUNT(DISTINCT o.id) as active_subscriptions,
    SUM(sp.monthly_price) as mrr,
    AVG(sp.monthly_price) as avg_revenue_per_user
FROM organizations o
JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
WHERE o.subscription_status = 'active'
GROUP BY DATE_TRUNC('month', CURRENT_DATE);

-- Function to check feature access
CREATE OR REPLACE FUNCTION has_feature_access(org_id UUID, feature_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    org_plan VARCHAR;
    feature_enabled BOOLEAN;
    feature_plans TEXT[];
BEGIN
    -- Get organization's plan
    SELECT sp.name INTO org_plan
    FROM organizations o
    JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
    WHERE o.id = org_id;
    
    -- Check if feature is enabled and available for this plan
    SELECT ff.is_enabled, ff.target_plans INTO feature_enabled, feature_plans
    FROM feature_flags ff
    WHERE ff.name = feature_name;
    
    -- Return access decision
    RETURN feature_enabled AND (feature_plans IS NULL OR org_plan = ANY(feature_plans));
END;
$$ LANGUAGE plpgsql;

-- Function to update usage metrics
CREATE OR REPLACE FUNCTION update_organization_usage(org_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE organizations SET
        current_users = (
            SELECT COUNT(*) FROM user_profiles 
            WHERE organization_id = org_id AND is_active = TRUE
        ),
        current_cases = (
            SELECT COUNT(*) FROM cases 
            WHERE organization_id = org_id AND status != 'archived'
        ),
        current_documents = (
            SELECT COUNT(*) FROM documents 
            WHERE organization_id = org_id
        ),
        current_storage_mb = (
            SELECT COALESCE(SUM(file_size), 0) / (1024 * 1024) 
            FROM documents 
            WHERE organization_id = org_id
        )
    WHERE id = org_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SAAS TRIGGERS
-- =============================================

-- Update usage when users are added/removed
CREATE OR REPLACE FUNCTION trigger_update_org_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM update_organization_usage(NEW.organization_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM update_organization_usage(NEW.organization_id);
        IF OLD.organization_id != NEW.organization_id THEN
            PERFORM update_organization_usage(OLD.organization_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_organization_usage(OLD.organization_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_org_usage_on_user_change
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_update_org_usage();

CREATE TRIGGER update_org_usage_on_case_change
    AFTER INSERT OR UPDATE OR DELETE ON cases
    FOR EACH ROW EXECUTE FUNCTION trigger_update_org_usage();

-- =============================================
-- SAMPLE SAAS DATA
-- =============================================

-- Insert subscription plans
INSERT INTO subscription_plans (name, display_name, description, monthly_price, yearly_price, max_users, max_cases, max_storage_gb, features) VALUES
('starter', 'Starter', 'Parfait pour les avocats indépendants', 2900.00, 29000.00, 1, 50, 2, '{"ai_assistant": true, "basic_templates": true}'),
('professional', 'Professional', 'Idéal pour les petits cabinets', 9900.00, 99000.00, 5, 200, 10, '{"ai_assistant": true, "advanced_templates": true, "collaboration": true, "api_access": true}'),
('enterprise', 'Enterprise', 'Pour les grands cabinets et études', 29900.00, 299000.00, 50, 1000, 100, '{"ai_assistant": true, "advanced_templates": true, "collaboration": true, "api_access": true, "custom_branding": true, "priority_support": true}')
ON CONFLICT (name) DO NOTHING;

-- Insert feature flags
INSERT INTO feature_flags (name, description, is_enabled, target_plans) VALUES
('ai_legal_assistant', 'Assistant IA juridique avancé', true, ARRAY['professional', 'enterprise']),
('custom_branding', 'Personnalisation de la marque', true, ARRAY['enterprise']),
('api_access', 'Accès API REST', true, ARRAY['professional', 'enterprise']),
('advanced_analytics', 'Analytics avancées', false, ARRAY['enterprise'])
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_history TO authenticated;
GRANT SELECT, INSERT ON usage_metrics TO authenticated;
GRANT SELECT ON feature_flags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON webhooks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON system_notifications TO authenticated;

-- Grant permissions on views
GRANT SELECT ON organization_usage_summary TO authenticated;
GRANT SELECT ON monthly_recurring_revenue TO authenticated;