-- JuristDZ - Données de test pour l'interface Admin SaaS
-- À exécuter dans Supabase SQL Editor après les migrations

-- =============================================
-- 1. VÉRIFIER LES PLANS D'ABONNEMENT
-- =============================================
-- Les plans devraient déjà exister via saas-complete-schema.sql
-- Vérification:
SELECT * FROM subscription_plans ORDER BY sort_order;

-- Si les plans n'existent pas, les créer:
INSERT INTO subscription_plans (name, display_name, description, monthly_price, yearly_price, max_users, max_cases, max_storage_gb, features, is_popular, sort_order)
VALUES 
  ('starter', 'Starter', 'Parfait pour les avocats indépendants', 2900.00, 29000.00, 1, 50, 2, '{"ai_assistant": true, "basic_templates": true}', false, 1),
  ('professional', 'Professional', 'Idéal pour les petits cabinets', 9900.00, 99000.00, 5, 200, 10, '{"ai_assistant": true, "advanced_templates": true, "collaboration": true, "api_access": true}', true, 2),
  ('enterprise', 'Enterprise', 'Pour les grands cabinets et études', 29900.00, 299000.00, 50, 1000, 100, '{"ai_assistant": true, "advanced_templates": true, "collaboration": true, "api_access": true, "custom_branding": true, "priority_support": true}', false, 3)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 2. CRÉER DES ORGANISATIONS DE TEST
-- =============================================

-- Organisation 1: Cabinet d'avocat en trial (usage faible)
INSERT INTO organizations (
  name, 
  type, 
  address,
  phone,
  email,
  subscription_plan_id, 
  subscription_status,
  trial_ends_at,
  current_users,
  current_cases,
  current_storage_mb,
  current_documents
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
  1,
  12,
  256,
  45
FROM subscription_plans 
WHERE name = 'starter'
LIMIT 1;

-- Organisation 2: Étude notariale active (usage moyen)
INSERT INTO organizations (
  name, 
  type, 
  address,
  phone,
  email,
  subscription_plan_id, 
  subscription_status,
  subscription_starts_at,
  subscription_ends_at,
  current_users,
  current_cases,
  current_storage_mb,
  current_documents
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
  3,
  145,
  7680,
  520
FROM subscription_plans 
WHERE name = 'professional'
LIMIT 1;

-- Organisation 3: Cabinet d'avocat actif (usage élevé - alerte)
INSERT INTO organizations (
  name, 
  type, 
  address,
  phone,
  email,
  subscription_plan_id, 
  subscription_status,
  subscription_starts_at,
  subscription_ends_at,
  current_users,
  current_cases,
  current_storage_mb,
  current_documents
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
  4,
  185,
  9216,
  780
FROM subscription_plans 
WHERE name = 'professional'
LIMIT 1;

-- Organisation 4: Étude d'huissier en retard de paiement
INSERT INTO organizations (
  name, 
  type, 
  address,
  phone,
  email,
  subscription_plan_id, 
  subscription_status,
  subscription_starts_at,
  subscription_ends_at,
  current_users,
  current_cases,
  current_storage_mb,
  current_documents
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
  1,
  28,
  1024,
  95
FROM subscription_plans 
WHERE name = 'starter'
LIMIT 1;

-- Organisation 5: Grande entreprise avec plan Enterprise
INSERT INTO organizations (
  name, 
  type, 
  address,
  phone,
  email,
  subscription_plan_id, 
  subscription_status,
  subscription_starts_at,
  subscription_ends_at,
  current_users,
  current_cases,
  current_storage_mb,
  current_documents
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
  35,
  650,
  81920,
  2450
FROM subscription_plans 
WHERE name = 'enterprise'
LIMIT 1;

-- Organisation 6: Cabinet suspendu (non-paiement)
INSERT INTO organizations (
  name, 
  type, 
  address,
  phone,
  email,
  subscription_plan_id, 
  subscription_status,
  subscription_starts_at,
  subscription_ends_at,
  current_users,
  current_cases,
  current_storage_mb,
  current_documents
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
  1,
  42,
  1536,
  180
FROM subscription_plans 
WHERE name = 'starter'
LIMIT 1;

-- Organisation 7: Nouveau cabinet en trial (usage très faible)
INSERT INTO organizations (
  name, 
  type, 
  address,
  phone,
  email,
  subscription_plan_id, 
  subscription_status,
  trial_ends_at,
  current_users,
  current_cases,
  current_storage_mb,
  current_documents
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
  1,
  2,
  64,
  8
FROM subscription_plans 
WHERE name = 'professional'
LIMIT 1;

-- =============================================
-- 3. CRÉER UN HISTORIQUE DE FACTURATION
-- =============================================

-- Factures pour l'organisation active (Khelifi)
INSERT INTO subscription_history (
  organization_id,
  subscription_plan_id,
  period_start,
  period_end,
  amount,
  currency,
  payment_status,
  payment_method,
  invoice_number
)
SELECT 
  o.id,
  o.subscription_plan_id,
  NOW() - INTERVAL '3 months',
  NOW() - INTERVAL '2 months',
  sp.monthly_price,
  'DZD',
  'paid',
  'CIB',
  'INV-2024-001'
FROM organizations o
JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
WHERE o.name = 'Étude Notariale Khelifi';

INSERT INTO subscription_history (
  organization_id,
  subscription_plan_id,
  period_start,
  period_end,
  amount,
  currency,
  payment_status,
  payment_method,
  invoice_number
)
SELECT 
  o.id,
  o.subscription_plan_id,
  NOW() - INTERVAL '2 months',
  NOW() - INTERVAL '1 month',
  sp.monthly_price,
  'DZD',
  'paid',
  'CIB',
  'INV-2024-002'
FROM organizations o
JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
WHERE o.name = 'Étude Notariale Khelifi';

INSERT INTO subscription_history (
  organization_id,
  subscription_plan_id,
  period_start,
  period_end,
  amount,
  currency,
  payment_status,
  payment_method,
  invoice_number
)
SELECT 
  o.id,
  o.subscription_plan_id,
  NOW() - INTERVAL '1 month',
  NOW(),
  sp.monthly_price,
  'DZD',
  'paid',
  'CIB',
  'INV-2024-003'
FROM organizations o
JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
WHERE o.name = 'Étude Notariale Khelifi';

-- Facture en retard pour Meziane
INSERT INTO subscription_history (
  organization_id,
  subscription_plan_id,
  period_start,
  period_end,
  amount,
  currency,
  payment_status,
  payment_method,
  invoice_number
)
SELECT 
  o.id,
  o.subscription_plan_id,
  NOW() - INTERVAL '1 month',
  NOW(),
  sp.monthly_price,
  'DZD',
  'failed',
  'CIB',
  'INV-2024-004'
FROM organizations o
JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
WHERE o.name = 'Étude d''Huissier Meziane';

-- =============================================
-- 4. CRÉER DES MÉTRIQUES D'USAGE
-- =============================================

-- Métriques pour les 7 derniers jours (organisation Khelifi)
INSERT INTO usage_metrics (
  organization_id,
  metric_date,
  active_users,
  total_cases,
  new_cases,
  total_documents,
  new_documents,
  storage_used_mb,
  logins,
  api_calls,
  searches
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
-- 5. VÉRIFICATIONS
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

-- Vérifier les organisations avec usage élevé
SELECT 
  o.name,
  o.current_users,
  sp.max_users,
  ROUND((o.current_users::DECIMAL / sp.max_users) * 100, 2) as users_percent,
  o.current_cases,
  sp.max_cases,
  ROUND((o.current_cases::DECIMAL / sp.max_cases) * 100, 2) as cases_percent
FROM organizations o
JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
WHERE 
  (o.current_users::DECIMAL / sp.max_users) > 0.7
  OR (o.current_cases::DECIMAL / sp.max_cases) > 0.7
ORDER BY users_percent DESC;

-- =============================================
-- RÉSULTAT ATTENDU
-- =============================================
-- 7 organisations créées:
--   - 2 en trial (dont 1 expire bientôt)
--   - 3 actives (dont 1 avec usage élevé)
--   - 1 en retard de paiement
--   - 1 suspendue
-- 3 plans d'abonnement
-- Historique de facturation
-- Métriques d'usage pour test des graphiques
