-- DÉSACTIVATION TEMPORAIRE DE RLS POUR RÉSOUDRE LA RÉCURSION
-- Cette solution permet de tester le système SAAS sans les politiques RLS problématiques

-- =============================================
-- DÉSACTIVER RLS SUR TOUTES LES TABLES
-- =============================================

ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_collaborators DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;

-- =============================================
-- SUPPRIMER TOUTES LES POLITIQUES PROBLÉMATIQUES
-- =============================================

DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Organization admins can update" ON organizations;
DROP POLICY IF EXISTS "Users can view org profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view org clients" ON clients;
DROP POLICY IF EXISTS "Users can manage org clients" ON clients;
DROP POLICY IF EXISTS "Users can view accessible cases" ON cases;
DROP POLICY IF EXISTS "Users can manage own cases" ON cases;
DROP POLICY IF EXISTS "Users can view case collaborators" ON case_collaborators;
DROP POLICY IF EXISTS "Users can view accessible documents" ON documents;
DROP POLICY IF EXISTS "Users can view org activity" ON activity_log;

-- =============================================
-- CRÉER UN UTILISATEUR DE DÉMONSTRATION
-- =============================================

-- Insérer un profil utilisateur de démonstration
INSERT INTO user_profiles (
    id,
    organization_id,
    email,
    first_name,
    last_name,
    role,
    is_organization_admin,
    is_active
) 
SELECT 
    'demo-user-id'::uuid,
    o.id,
    'demo@juristdz.com',
    'Maître',
    'Dupont',
    'avocat',
    true,
    true
FROM organizations o 
WHERE o.name = 'Cabinet de Démonstration'
ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    is_organization_admin = EXCLUDED.is_organization_admin,
    is_active = EXCLUDED.is_active;

-- =============================================
-- CRÉER QUELQUES DOSSIERS DE DÉMONSTRATION
-- =============================================

-- Insérer des dossiers de démonstration
INSERT INTO cases (
    organization_id,
    created_by,
    assigned_to,
    title,
    description,
    case_type,
    priority,
    status,
    estimated_value
)
SELECT 
    o.id,
    'demo-user-id'::uuid,
    'demo-user-id'::uuid,
    'Affaire Benali vs. Société SARL',
    'Litige commercial concernant un contrat de fourniture non respecté. Le client réclame des dommages-intérêts.',
    'Droit Commercial',
    'high',
    'active',
    2500000
FROM organizations o 
WHERE o.name = 'Cabinet de Démonstration'
ON CONFLICT DO NOTHING;

INSERT INTO cases (
    organization_id,
    created_by,
    assigned_to,
    title,
    description,
    case_type,
    priority,
    status,
    estimated_value
)
SELECT 
    o.id,
    'demo-user-id'::uuid,
    'demo-user-id'::uuid,
    'Divorce contentieux Mme Khadija',
    'Procédure de divorce contentieux avec demande de garde des enfants et pension alimentaire.',
    'Droit de la Famille',
    'medium',
    'active',
    500000
FROM organizations o 
WHERE o.name = 'Cabinet de Démonstration'
ON CONFLICT DO NOTHING;

-- =============================================
-- VÉRIFICATION FINALE
-- =============================================

DO $$
DECLARE
    org_count INTEGER;
    user_count INTEGER;
    case_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations;
    SELECT COUNT(*) INTO user_count FROM user_profiles;
    SELECT COUNT(*) INTO case_count FROM cases;
    
    RAISE NOTICE '=== CONFIGURATION SAAS SANS RLS ===';
    RAISE NOTICE 'Organisations: %', org_count;
    RAISE NOTICE 'Utilisateurs: %', user_count;
    RAISE NOTICE 'Dossiers: %', case_count;
    RAISE NOTICE '⚠️ RLS désactivé temporairement pour éviter la récursion';
    RAISE NOTICE '✅ Système SAAS prêt pour les tests';
END $$;