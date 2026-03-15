-- ============================================
-- SCRIPT POUR OBTENIR UN USER_ID POUR LES TESTS
-- ============================================
-- Date: 8 Mars 2026
-- Description: Récupérer un user_id existant ou créer un utilisateur de test
-- ============================================

-- ============================================
-- OPTION 1: LISTER TOUS LES UTILISATEURS EXISTANTS
-- ============================================

SELECT 
  u.id as user_id,
  u.email,
  p.first_name,
  p.last_name,
  p.profession,
  s.plan,
  s.credits_remaining,
  s.expires_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN subscriptions s ON u.id = s.user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- ============================================
-- OPTION 2: CRÉER UN UTILISATEUR DE TEST DÉDIÉ
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_test_email TEXT := 'test-limites@juristdz.com';
  v_user_exists BOOLEAN;
BEGIN
  -- Vérifier si l'utilisateur de test existe déjà
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = v_test_email
  ) INTO v_user_exists;
  
  IF v_user_exists THEN
    -- Récupérer l'ID existant
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_test_email;
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ UTILISATEUR DE TEST EXISTANT';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Email: %', v_test_email;
    RAISE NOTICE 'Mot de passe: TestPassword123!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Copiez cet ID pour vos tests:';
    RAISE NOTICE '%', v_user_id;
    RAISE NOTICE '========================================';
  ELSE
    -- Créer un nouvel utilisateur de test
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔨 CRÉATION D''UN NOUVEL UTILISATEUR DE TEST';
    RAISE NOTICE '========================================';
    
    -- Insérer dans auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_test_email,
      crypt('TestPassword123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO v_user_id;
    
    -- Créer le profil
    INSERT INTO profiles (
      id,
      email,
      first_name,
      last_name,
      profession,
      is_active,
      email_verified,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_test_email,
      'Test',
      'Limites',
      'avocat',
      true,
      true,
      NOW(),
      NOW()
    );
    
    -- Créer l'abonnement
    INSERT INTO subscriptions (
      user_id,
      plan,
      credits_remaining,
      expires_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      'free',
      50,
      NOW() + INTERVAL '30 days',
      NOW(),
      NOW()
    );
    
    -- Créer les stats d'usage
    INSERT INTO usage_stats (
      user_id,
      credits_used_today,
      credits_used_this_month,
      storage_used_gb,
      api_calls_today,
      last_reset_date,
      last_monthly_reset
    ) VALUES (
      v_user_id,
      0,
      0,
      0,
      0,
      CURRENT_DATE,
      DATE_TRUNC('month', CURRENT_DATE)
    );
    
    RAISE NOTICE '✅ UTILISATEUR DE TEST CRÉÉ AVEC SUCCÈS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Email: %', v_test_email;
    RAISE NOTICE 'Mot de passe: TestPassword123!';
    RAISE NOTICE 'Plan: free';
    RAISE NOTICE 'Crédits: 50';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Copiez cet ID pour vos tests:';
    RAISE NOTICE '%', v_user_id;
    RAISE NOTICE '========================================';
  END IF;
  
  -- Afficher les détails de l'abonnement
  RAISE NOTICE '';
  RAISE NOTICE '📊 DÉTAILS DE L''ABONNEMENT:';
  RAISE NOTICE '========================================';
  
  DECLARE
    v_subscription RECORD;
  BEGIN
    SELECT * INTO v_subscription 
    FROM v_usage_overview 
    WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Plan: %', v_subscription.plan;
    RAISE NOTICE 'Crédits restants: %', v_subscription.credits_remaining;
    RAISE NOTICE 'Utilisés aujourd''hui: %', v_subscription.credits_used_today;
    RAISE NOTICE 'Utilisés ce mois: %', v_subscription.credits_used_this_month;
    RAISE NOTICE 'Stockage: % GB', v_subscription.storage_used_gb;
    RAISE NOTICE 'Expire le: %', v_subscription.expires_at;
    RAISE NOTICE '========================================';
  END;
  
END $$;

-- ============================================
-- OPTION 3: UTILISER VOTRE PROPRE COMPTE
-- ============================================

-- Si vous voulez utiliser votre propre compte, connectez-vous à l'application
-- puis exécutez cette requête dans la console du navigateur (F12):
-- 
-- const { data: { user } } = await supabase.auth.getUser();
-- console.log('Mon User ID:', user.id);
-- 
-- Puis copiez l'ID affiché dans la console

-- ============================================
-- VÉRIFICATION RAPIDE
-- ============================================

-- Vérifier qu'un utilisateur a bien un abonnement et des stats
SELECT 
  u.id,
  u.email,
  s.plan,
  s.credits_remaining,
  us.credits_used_today,
  us.credits_used_this_month
FROM auth.users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN usage_stats us ON u.id = us.user_id
WHERE u.email = 'test-limites@juristdz.com';

-- ============================================
-- INSTRUCTIONS D'UTILISATION
-- ============================================

/*

ÉTAPE 1: Exécuter ce script dans Supabase SQL Editor

ÉTAPE 2: Copier le User ID affiché dans les logs

ÉTAPE 3: Utiliser cet ID dans les tests:

  Option A - Dans test-limites-automatique.sql:
    Remplacer toutes les occurrences de 'test-user-id' par votre User ID

  Option B - Dans l'application:
    Se connecter avec:
    Email: test-limites@juristdz.com
    Mot de passe: TestPassword123!

ÉTAPE 4: Exécuter les tests

*/
