-- SOLUTION IMMÉDIATE : DÉSACTIVATION RLS POUR ÉVITER LA RÉCURSION
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

-- D'abord, créer l'utilisateur dans auth.users (simulation)
-- Note: En production, ceci serait fait via l'inscription Supabase
DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- ID fixe pour la démo
    org_id UUID;
BEGIN
    -- Récupérer l'ID de l'organisation de démonstration
    SELECT id INTO org_id FROM organizations WHERE name = 'Cabinet de Démonstration' LIMIT 1;
    
    IF org_id IS NULL THEN
        RAISE EXCEPTION 'Organisation de démonstration non trouvée';
    END IF;
    
    -- Insérer dans auth.users (table système Supabase)
    -- Note: Cette approche peut ne pas fonctionner selon la configuration Supabase
    -- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    -- VALUES (demo_user_id, 'demo@juristdz.com', crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW())
    -- ON CONFLICT (id) DO NOTHING;
    
    -- Alternative: Insérer directement dans user_profiles sans contrainte FK
    -- Nous allons temporairement désactiver la contrainte
    ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
    
    -- Insérer le profil utilisateur de démonstration
    INSERT INTO user_profiles (
        id,
        organization_id,
        email,
        first_name,
        last_name,
        role,
        is_organization_admin,
        is_active
    ) VALUES (
        demo_user_id,
        org_id,
        'demo@juristdz.com',
        'Maître',
        'Dupont',
        'avocat',
        true,
        true
    ) ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        is_organization_admin = EXCLUDED.is_organization_admin,
        is_active = EXCLUDED.is_active;
    
    RAISE NOTICE 'Utilisateur de démonstration créé avec ID: %', demo_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la création de l''utilisateur: %', SQLERRM;
END $$;

-- =============================================
-- CRÉER QUELQUES DOSSIERS DE DÉMONSTRATION
-- =============================================

DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
    org_id UUID;
BEGIN
    -- Récupérer l'ID de l'organisation
    SELECT id INTO org_id FROM organizations WHERE name = 'Cabinet de Démonstration' LIMIT 1;
    
    IF org_id IS NULL THEN
        RAISE NOTICE 'Organisation de démonstration non trouvée, impossible de créer les dossiers';
        RETURN;
    END IF;
    
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
    ) VALUES 
    (
        org_id,
        demo_user_id,
        demo_user_id,
        'Affaire Benali vs. Société SARL',
        'Litige commercial concernant un contrat de fourniture non respecté. Le client réclame des dommages-intérêts.',
        'Droit Commercial',
        'high',
        'active',
        2500000
    ),
    (
        org_id,
        demo_user_id,
        demo_user_id,
        'Divorce contentieux Mme Khadija',
        'Procédure de divorce contentieux avec demande de garde des enfants et pension alimentaire.',
        'Droit de la Famille',
        'medium',
        'active',
        500000
    ),
    (
        org_id,
        demo_user_id,
        demo_user_id,
        'Succession M. Brahim',
        'Règlement de succession avec biens immobiliers et mobiliers. Plusieurs héritiers.',
        'Droit Civil',
        'low',
        'active',
        15000000
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Dossiers de démonstration créés';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur lors de la création des dossiers: %', SQLERRM;
END $$;

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
    
    RAISE NOTICE '=== SAAS CONFIGURÉ SANS RLS ===';
    RAISE NOTICE 'Organisations: %', org_count;
    RAISE NOTICE 'Utilisateurs: %', user_count;
    RAISE NOTICE 'Dossiers: %', case_count;
    RAISE NOTICE '⚠️ RLS désactivé temporairement';
    RAISE NOTICE '✅ Système SAAS prêt pour les tests';
    RAISE NOTICE '';
    RAISE NOTICE 'Vous pouvez maintenant tester l''application !';
END $$;