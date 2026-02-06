-- CONFIGURATION SAAS SIMPLIFIÉE
-- Évite les problèmes d'authentification en modifiant la structure

-- =============================================
-- DÉSACTIVER RLS ET SUPPRIMER LES POLITIQUES
-- =============================================

ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_collaborators DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques
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
-- MODIFIER LA TABLE USER_PROFILES
-- =============================================

-- Supprimer la contrainte de clé étrangère problématique
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Modifier la colonne id pour qu'elle ne soit plus liée à auth.users
ALTER TABLE user_profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- =============================================
-- CRÉER DES DONNÉES DE DÉMONSTRATION
-- =============================================

DO $$
DECLARE
    demo_user_id UUID := gen_random_uuid();
    org_id UUID;
BEGIN
    -- Récupérer l'organisation de démonstration
    SELECT id INTO org_id FROM organizations WHERE name = 'Cabinet de Démonstration' LIMIT 1;
    
    IF org_id IS NULL THEN
        RAISE EXCEPTION 'Organisation de démonstration non trouvée';
    END IF;
    
    -- Créer l'utilisateur de démonstration
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
    );
    
    -- Créer quelques clients de démonstration
    INSERT INTO clients (
        organization_id,
        created_by,
        type,
        first_name,
        last_name,
        email,
        phone,
        address
    ) VALUES 
    (
        org_id,
        demo_user_id,
        'individual',
        'Ahmed',
        'Benali',
        'ahmed.benali@email.com',
        '+213 555 123 456',
        '15 Rue Didouche Mourad, Alger'
    ),
    (
        org_id,
        demo_user_id,
        'individual',
        'Khadija',
        'Mansouri',
        'khadija.mansouri@email.com',
        '+213 555 987 654',
        '42 Boulevard Mohamed V, Oran'
    );
    
    -- Créer des dossiers de démonstration
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
    );
    
    RAISE NOTICE '=== CONFIGURATION SAAS TERMINÉE ===';
    RAISE NOTICE 'Utilisateur créé: % (Maître Dupont)', demo_user_id;
    RAISE NOTICE 'Organisation: % (%)', org_id, 'Cabinet de Démonstration';
    RAISE NOTICE 'Clients créés: 2';
    RAISE NOTICE 'Dossiers créés: 3';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Système SAAS prêt !';
    RAISE NOTICE '⚠️ RLS désactivé pour éviter les problèmes d''authentification';
    RAISE NOTICE '🚀 Vous pouvez maintenant tester l''application';
    
END $$;