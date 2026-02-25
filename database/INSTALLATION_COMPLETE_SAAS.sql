-- =============================================
-- INSTALLATION COMPLÈTE SAAS - JuristDZ
-- À exécuter dans Supabase SQL Editor
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
    monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    yearly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'DZD',
    max_users INTEGER DEFAULT 1,
    max_cases INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 1,
    max_documents INTEGER DEFAULT 100,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. ORGANIZATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('cabinet_avocat', 'etude_notaire', 'etude_huissier', 'entreprise')),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    siret VARCHAR(20),
    barreau_id VARCHAR(50),
    chambre_id VARCHAR(50),
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    subscription_status VARCHAR(20) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    subscription_starts_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    billing_email VARCHAR(100),
    billing_address TEXT,
    payment_method_id VARCHAR(100),
    current_users INTEGER DEFAULT 0,
    current_cases INTEGER DEFAULT 0,
    current_storage_mb INTEGER DEFAULT 0,
    current_documents INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT org_name_check CHECK (LENGTH(name) > 0)
);

-- =============================================
-- 3. SUBSCRIPTION HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    subscription_plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'DZD',
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    payment_provider_id VARCHAR(100),
    invoice_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. USAGE METRICS
-- =============================================
CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    metric_date DATE NOT NULL,
    active_users INTEGER DEFAULT 0,
    total_cases INTEGER DEFAULT 0,
    new_cases INTEGER DEFAULT 0,
    total_documents INTEGER DEFAULT 0,
    new_documents INTEGER DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,
    logins INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    searches INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, metric_date)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription ON organizations(subscription_plan_id, subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_trial ON organizations(trial_ends_at) WHERE subscription_status = 'trial';
CREATE INDEX IF NOT EXISTS idx_subscription_history_org ON subscription_history(organization_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_org_date ON usage_metrics(organization_id, metric_date DESC);

-- =============================================
-- DONNÉES INITIALES: PLANS D'ABONNEMENT
-- =============================================
INSERT INTO subscription_plans (name, display_name, description, monthly_price, yearly_price, max_users, max_cases, max_storage_gb, features, is_popular, sort_order) VALUES
('starter', 'Starter', 'Parfait pour les avocats indépendants', 2900.00, 29000.00, 1, 50, 2, '{"ai_assistant": true, "basic_templates": true}', false, 1),
('professional', 'Professional', 'Idéal pour les petits cabinets', 9900.00, 99000.00, 5, 200, 10, '{"ai_assistant": true, "advanced_templates": true, "collaboration": true, "api_access": true}', true, 2),
('enterprise', 'Enterprise', 'Pour les grands cabinets et études', 29900.00, 299000.00, 50, 1000, 100, '{"ai_assistant": true, "advanced_templates": true, "collaboration": true, "api_access": true, "custom_branding": true, "priority_support": true}', false, 3)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- DONNÉES DE TEST: ORGANISATIONS
-- =============================================

-- Organisation 1: Cabinet d'avocat en trial
INSERT INTO organizations (
  name, type, address, phone, email,
  subscription_plan_id, subscription_status, trial_ends_at,
  current_users, current_cases, current_storage_mb, current_documents
)
SELECT 
  'Cabinet Benali & Associés',
  'cabinet_avocat',
  '15 Rue Didouche Mourad, Alger',
  '+213 21 123 456',
  'contact@benali-avocat.dz',
  id,
  'trial',
  NOW() + INTERVAL '10 days',
  1, 12, 256, 45
FROM subscription_plans WHERE name = 'starter' LIMIT 1;

-- Organisation 2: Étude notariale active
INSERT INTO organizations (
  name, type, address, phone, email,
  subscription_plan_id, subscription_status,
  subscription_starts_at, subscription_ends_at,
  current_users, current_cases, current_storage_mb, current_documents
)
SELECT 
  'Étude Notariale Khelifi',
  'etude_notaire',
  '42 Boulevard Mohamed V, Oran',
  '+213 41 234 567',
  'contact@khelifi-notaire.dz',
  id,
  'active',
  NOW() - INTERVAL '3 months',
  NOW() + INTERVAL '9 months',
  3, 145, 7680, 520
FROM subscription_plans WHERE name = 'professional' LIMIT 1;

-- Organisation 3: Cabinet actif avec usage élevé
INSERT INTO organizations (
  name, type, address, phone, email,
  subscription_plan_id, subscription_status,
  subscription_starts_at, subscription_ends_at,
  current_users, current_cases, current_storage_mb, current_documents
)
SELECT 
  'Cabinet Juridique Larbi',
  'cabinet_avocat',
  '8 Rue Larbi Ben M''hidi, Constantine',
  '+213 31 345 678',
  'contact@larbi-avocat.dz',
  id,
  'active',
  NOW() - INTERVAL '6 months',
  NOW() + INTERVAL '6 months',
  4, 185, 9216, 780
FROM subscription_plans WHERE name = 'professional' LIMIT 1;

-- Organisation 4: Étude d'huissier en retard
INSERT INTO organizations (
  name, type, address, phone, email,
  subscription_plan_id, subscription_status,
  subscription_starts_at, subscription_ends_at,
  current_users, current_cases, current_storage_mb, current_documents
)
SELECT 
  'Étude d''Huissier Meziane',
  'etude_huissier',
  '23 Avenue de l''Indépendance, Annaba',
  '+213 38 456 789',
  'contact@meziane-huissier.dz',
  id,
  'past_due',
  NOW() - INTERVAL '1 year',
  NOW() - INTERVAL '15 days',
  1, 28, 1024, 95
FROM subscription_plans WHERE name = 'starter' LIMIT 1;

-- Organisation 5: Grande entreprise
INSERT INTO organizations (
  name, type, address, phone, email,
  subscription_plan_id, subscription_status,
  subscription_starts_at, subscription_ends_at,
  current_users, current_cases, current_storage_mb, current_documents
)
SELECT 
  'Sonatrach - Direction Juridique',
  'entreprise',
  'Avenue du 1er Novembre, Alger',
  '+213 21 567 890',
  'juridique@sonatrach.dz',
  id,
  'active',
  NOW() - INTERVAL '2 years',
  NOW() + INTERVAL '1 year',
  35, 650, 81920, 2450
FROM subscription_plans WHERE name = 'enterprise' LIMIT 1;

-- Organisation 6: Cabinet suspendu
INSERT INTO organizations (
  name, type, address, phone, email,
  subscription_plan_id, subscription_status,
  subscription_starts_at, subscription_ends_at,
  current_users, current_cases, current_storage_mb, current_documents
)
SELECT 
  'Cabinet Hamidi',
  'cabinet_avocat',
  '67 Rue des Frères Bouadou, Blida',
  '+213 25 678 901',
  'contact@hamidi-avocat.dz',
  id,
  'suspended',
  NOW() - INTERVAL '8 months',
  NOW() - INTERVAL '2 months',
  1, 42, 1536, 180
FROM subscription_plans WHERE name = 'starter' LIMIT 1;

-- Organisation 7: Nouveau cabinet en trial
INSERT INTO organizations (
  name, type, address, phone, email,
  subscription_plan_id, subscription_status, trial_ends_at,
  current_users, current_cases, current_storage_mb, current_documents
)
SELECT 
  'Cabinet Nouveau Départ',
  'cabinet_avocat',
  '12 Rue de la Liberté, Tizi Ouzou',
  '+213 26 789 012',
  'contact@nouveau-depart.dz',
  id,
  'trial',
  NOW() + INTERVAL '3 days',
  1, 2, 64, 8
FROM subscription_plans WHERE name = 'professional' LIMIT 1;

-- =============================================
-- HISTORIQUE DE FACTURATION
-- =============================================

-- Factures pour Khelifi (3 derniers mois)
INSERT INTO subscription_history (
  organization_id, subscription_plan_id,
  period_start, period_end, amount, currency,
  payment_status, payment_method, invoice_number
)
SELECT 
  o.id, o.subscription_plan_id,
  NOW() - INTERVAL '3 months', NOW() - INTERVAL '2 months',
  sp.monthly_price, 'DZD',
  'paid', 'CIB', 'INV-2024-001'
FROM organizations o
JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
WHERE o.name = 'Étude Notariale Khelifi';

INSERT INTO subscription_history (
  organization_id, subscription_plan_id,
  period_start, period_end, amount, currency,
  payment_status, payment_method, invoice_number
)
SELECT 
  o.id, o.subscription_plan_id,
  NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 month',
  sp.monthly_price, 'DZD',
  'paid', 'CIB', 'INV-2024-002'
FROM organizations o
JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
WHERE o.name = 'Étude Notariale Khelifi';

INSERT INTO subscription_history (
  organization_id, subscription_plan_id,
  period_start, period_end, amount, currency,
  payment_status, payment_method, invoice_number
)
SELECT 
  o.id, o.subscription_plan_id,
  NOW() - INTERVAL '1 month', NOW(),
  sp.monthly_price, 'DZD',
  'paid', 'CIB', 'INV-2024-003'
FROM organizations o
JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
WHERE o.name = 'Étude Notariale Khelifi';

-- Facture en retard pour Meziane
INSERT INTO subscription_history (
  organization_id, subscription_plan_id,
  period_start, period_end, amount, currency,
  payment_status, payment_method, invoice_number
)
SELECT 
  o.id, o.subscription_plan_id,
  NOW() - INTERVAL '1 month', NOW(),
  sp.monthly_price, 'DZD',
  'failed', 'CIB', 'INV-2024-004'
FROM organizations o
JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
WHERE o.name = 'Étude d''Huissier Meziane';

-- =============================================
-- MÉTRIQUES D'USAGE (7 derniers jours pour Khelifi)
-- =============================================
INSERT INTO usage_metrics (
  organization_id, metric_date,
  active_users, total_cases, new_cases,
  total_documents, new_documents, storage_used_mb,
  logins, api_calls, searches
)
SELECT 
  o.id,
  CURRENT_DATE - i,
  2 + (random() * 2)::int,
  140 + i * 2,
  (random() * 5)::int,
  500 + i * 10,
  (random() * 15)::int,
  7500 + i * 50,
  5 + (random() * 10)::int,
  100 + (random() * 200)::int,
  20 + (random() * 30)::int
FROM organizations o, generate_series(0, 6) i
WHERE o.name = 'Étude Notariale Khelifi';

-- =============================================
-- VÉRIFICATIONS
-- =============================================

-- Compter les organisations par statut
SELECT 
  subscription_status,
  COUNT(*) as count
FROM organizations
GROUP BY subscription_status
ORDER BY subscription_status;

-- Compter les abonnés par plan
SELECT 
  sp.display_name,
  COUNT(o.id) as subscribers,
  SUM(CASE WHEN o.subscription_status = 'active' THEN 1 ELSE 0 END) as active_subscribers
FROM subscription_plans sp
LEFT JOIN organizations o ON sp.id = o.subscription_plan_id
GROUP BY sp.id, sp.display_name
ORDER BY sp.sort_order;

-- Calculer le MRR
SELECT 
  SUM(sp.monthly_price) as mrr,
  COUNT(o.id) as active_subscriptions
FROM organizations o
JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
WHERE o.subscription_status = 'active';

-- =============================================
-- RÉSULTAT ATTENDU
-- =============================================
-- ✅ 3 plans d'abonnement créés
-- ✅ 7 organisations créées
-- ✅ Historique de facturation créé
-- ✅ Métriques d'usage créées
-- ✅ MRR: ~42,700 DZD
-- ✅ ARR: ~512,400 DZD
-- ✅ 3 abonnements actifs
-- ✅ 2 essais gratuits
