-- ============================================
-- SCRIPT DE TEST AUTOMATIQUE - SYSTÈME DE LIMITES
-- ============================================
-- Date: 8 Mars 2026
-- Description: Script SQL pour tester automatiquement tous les cas de figures
-- Durée: ~5 minutes
-- ============================================

-- IMPORTANT: Remplacer 'test-user-id' par votre véritable user_id
\set test_user_id 'test-user-id'

-- ============================================
-- PRÉPARATION: Créer un utilisateur de test
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'test-user-id'::UUID;
BEGIN
  -- Créer ou mettre à jour l'abonnement de test
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
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan = 'free',
    credits_remaining = 50,
    expires_at = NOW() + INTERVAL '30 days',
    updated_at = NOW();

  -- Créer ou mettre à jour les stats d'usage
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
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    credits_used_today = 0,
    credits_used_this_month = 0,
    storage_used_gb = 0,
    api_calls_today = 0,
    last_reset_date = CURRENT_DATE,
    last_monthly_reset = DATE_TRUNC('month', CURRENT_DATE);

  RAISE NOTICE '✅ Utilisateur de test créé/réinitialisé: %', v_user_id;
END $$;

-- ============================================
-- TEST 1: Vérifier les limites avec crédits suffisants
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'test-user-id'::UUID;
  v_result RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 1: Crédits Suffisants';
  RAISE NOTICE '========================================';
  
  -- Vérifier l'état initial
  SELECT * INTO v_result FROM v_usage_overview WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 État initial:';
  RAISE NOTICE '  - Crédits restants: %', v_result.credits_remaining;
  RAISE NOTICE '  - Plan: %', v_result.plan;
  RAISE NOTICE '  - Utilisés aujourd''hui: %', v_result.credits_used_today;
  
  -- Vérifier les limites
  SELECT * INTO v_result FROM check_all_limits(v_user_id, 'research');
  
  IF v_result.allowed THEN
    RAISE NOTICE '✅ TEST 1 RÉUSSI: Action autorisée';
  ELSE
    RAISE NOTICE '❌ TEST 1 ÉCHOUÉ: Action bloquée alors qu''elle devrait être autorisée';
  END IF;
END $$;

-- ============================================
-- TEST 2: Déduction de crédits
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'test-user-id'::UUID;
  v_credits_before INT;
  v_credits_after INT;
  v_success BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 2: Déduction de Crédits';
  RAISE NOTICE '========================================';
  
  -- Récupérer les crédits avant
  SELECT credits_remaining INTO v_credits_before 
  FROM subscriptions 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Crédits avant: %', v_credits_before;
  
  -- Déduire 1 crédit
  SELECT deduct_credits(v_user_id, 1) INTO v_success;
  
  -- Récupérer les crédits après
  SELECT credits_remaining INTO v_credits_after 
  FROM subscriptions 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Crédits après: %', v_credits_after;
  
  IF v_success AND v_credits_after = v_credits_before - 1 THEN
    RAISE NOTICE '✅ TEST 2 RÉUSSI: 1 crédit déduit correctement';
  ELSE
    RAISE NOTICE '❌ TEST 2 ÉCHOUÉ: Déduction incorrecte';
  END IF;
END $$;

-- ============================================
-- TEST 3: Crédits épuisés (blocage)
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'test-user-id'::UUID;
  v_result RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 3: Crédits Épuisés';
  RAISE NOTICE '========================================';
  
  -- Épuiser les crédits
  UPDATE subscriptions 
  SET credits_remaining = 0 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Crédits mis à 0';
  
  -- Vérifier les limites
  SELECT * INTO v_result FROM check_all_limits(v_user_id, 'research');
  
  IF NOT v_result.allowed AND v_result.limit_type = 'credits' THEN
    RAISE NOTICE '✅ TEST 3 RÉUSSI: Action bloquée correctement';
    RAISE NOTICE '  - Type: %', v_result.limit_type;
    RAISE NOTICE '  - Statut: %', v_result.status;
  ELSE
    RAISE NOTICE '❌ TEST 3 ÉCHOUÉ: Action devrait être bloquée';
  END IF;
  
  -- Restaurer les crédits
  UPDATE subscriptions 
  SET credits_remaining = 50 
  WHERE user_id = v_user_id;
END $$;

-- ============================================
-- TEST 4: Quota journalier dépassé (Plan Free)
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'test-user-id'::UUID;
  v_result RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 4: Quota Journalier Dépassé';
  RAISE NOTICE '========================================';
  
  -- Configurer plan free avec quota dépassé
  UPDATE subscriptions 
  SET plan = 'free', credits_remaining = 50 
  WHERE user_id = v_user_id;
  
  UPDATE usage_stats 
  SET credits_used_today = 10 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Plan: free, Utilisés aujourd''hui: 10/10';
  
  -- Vérifier les limites
  SELECT * INTO v_result FROM check_all_limits(v_user_id, 'research');
  
  IF NOT v_result.allowed AND v_result.limit_type = 'daily_quota' THEN
    RAISE NOTICE '✅ TEST 4 RÉUSSI: Quota journalier bloqué correctement';
  ELSE
    RAISE NOTICE '❌ TEST 4 ÉCHOUÉ: Quota journalier devrait bloquer';
  END IF;
  
  -- Restaurer
  UPDATE usage_stats 
  SET credits_used_today = 0 
  WHERE user_id = v_user_id;
END $$;

-- ============================================
-- TEST 5: Quota mensuel dépassé (Plan Pro)
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'test-user-id'::UUID;
  v_result RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 5: Quota Mensuel Dépassé';
  RAISE NOTICE '========================================';
  
  -- Configurer plan pro avec quota mensuel dépassé
  UPDATE subscriptions 
  SET plan = 'pro', credits_remaining = 50 
  WHERE user_id = v_user_id;
  
  UPDATE usage_stats 
  SET credits_used_this_month = 500 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Plan: pro, Utilisés ce mois: 500/500';
  
  -- Vérifier les limites
  SELECT * INTO v_result FROM check_all_limits(v_user_id, 'research');
  
  IF NOT v_result.allowed AND v_result.limit_type = 'monthly_quota' THEN
    RAISE NOTICE '✅ TEST 5 RÉUSSI: Quota mensuel bloqué correctement';
  ELSE
    RAISE NOTICE '❌ TEST 5 ÉCHOUÉ: Quota mensuel devrait bloquer';
  END IF;
  
  -- Restaurer
  UPDATE subscriptions SET plan = 'free' WHERE user_id = v_user_id;
  UPDATE usage_stats SET credits_used_this_month = 0 WHERE user_id = v_user_id;
END $$;

-- ============================================
-- TEST 6: Abonnement expiré
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'test-user-id'::UUID;
  v_result RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 6: Abonnement Expiré';
  RAISE NOTICE '========================================';
  
  -- Expirer l'abonnement
  UPDATE subscriptions 
  SET expires_at = NOW() - INTERVAL '1 day' 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Abonnement expiré hier';
  
  -- Vérifier les limites
  SELECT * INTO v_result FROM check_all_limits(v_user_id, 'research');
  
  IF NOT v_result.allowed AND v_result.limit_type = 'expiration' THEN
    RAISE NOTICE '✅ TEST 6 RÉUSSI: Expiration bloquée correctement';
  ELSE
    RAISE NOTICE '❌ TEST 6 ÉCHOUÉ: Expiration devrait bloquer';
  END IF;
  
  -- Restaurer
  UPDATE subscriptions 
  SET expires_at = NOW() + INTERVAL '30 days' 
  WHERE user_id = v_user_id;
END $$;

-- ============================================
-- TEST 7: Avertissement à 80%
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'test-user-id'::UUID;
  v_result RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 7: Avertissement 80%%';
  RAISE NOTICE '========================================';
  
  -- Mettre à 80% d'utilisation
  UPDATE subscriptions 
  SET credits_remaining = 10 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Crédits: 10/50 (80%% utilisés)';
  
  -- Vérifier les limites
  SELECT * INTO v_result FROM check_all_limits(v_user_id, 'research');
  
  IF v_result.allowed AND v_result.status = 'warning' THEN
    RAISE NOTICE '✅ TEST 7 RÉUSSI: Avertissement à 80%% détecté';
    RAISE NOTICE '  - Pourcentage: %', v_result.percentage;
  ELSE
    RAISE NOTICE '❌ TEST 7 ÉCHOUÉ: Avertissement devrait être affiché';
  END IF;
  
  -- Restaurer
  UPDATE subscriptions 
  SET credits_remaining = 50 
  WHERE user_id = v_user_id;
END $$;

-- ============================================
-- TEST 8: Avertissement critique à 95%
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'test-user-id'::UUID;
  v_result RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 8: Avertissement Critique 95%%';
  RAISE NOTICE '========================================';
  
  -- Mettre à 95% d'utilisation
  UPDATE subscriptions 
  SET credits_remaining = 2 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Crédits: 2/50 (96%% utilisés)';
  
  -- Vérifier les limites
  SELECT * INTO v_result FROM check_all_limits(v_user_id, 'research');
  
  IF v_result.allowed AND v_result.status = 'critical' THEN
    RAISE NOTICE '✅ TEST 8 RÉUSSI: Avertissement critique à 95%% détecté';
    RAISE NOTICE '  - Pourcentage: %', v_result.percentage;
  ELSE
    RAISE NOTICE '❌ TEST 8 ÉCHOUÉ: Avertissement critique devrait être affiché';
  END IF;
  
  -- Restaurer
  UPDATE subscriptions 
  SET credits_remaining = 50 
  WHERE user_id = v_user_id;
END $$;

-- ============================================
-- TEST 9: Stockage plein
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'test-user-id'::UUID;
  v_result RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 9: Stockage Plein';
  RAISE NOTICE '========================================';
  
  -- Remplir le stockage
  UPDATE subscriptions SET plan = 'free' WHERE user_id = v_user_id;
  UPDATE usage_stats 
  SET storage_used_gb = 1.0 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Stockage: 1.0/1.0 GB (100%%)';
  
  -- Vérifier les limites
  SELECT * INTO v_result FROM check_all_limits(v_user_id, 'upload');
  
  IF NOT v_result.allowed AND v_result.limit_type = 'storage' THEN
    RAISE NOTICE '✅ TEST 9 RÉUSSI: Stockage plein bloqué correctement';
  ELSE
    RAISE NOTICE '❌ TEST 9 ÉCHOUÉ: Stockage plein devrait bloquer';
  END IF;
  
  -- Restaurer
  UPDATE usage_stats 
  SET storage_used_gb = 0 
  WHERE user_id = v_user_id;
END $$;

-- ============================================
-- TEST 10: Plan Cabinet (illimité)
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'test-user-id'::UUID;
  v_result RECORD;
  v_i INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 10: Plan Cabinet (Illimité)';
  RAISE NOTICE '========================================';
  
  -- Passer en plan cabinet
  UPDATE subscriptions 
  SET plan = 'cabinet', credits_remaining = 999999 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Plan: cabinet';
  
  -- Effectuer 20 actions
  FOR v_i IN 1..20 LOOP
    SELECT * INTO v_result FROM check_all_limits(v_user_id, 'research');
    
    IF NOT v_result.allowed THEN
      RAISE NOTICE '❌ TEST 10 ÉCHOUÉ: Plan cabinet ne devrait jamais bloquer';
      EXIT;
    END IF;
    
    PERFORM deduct_credits(v_user_id, 1);
  END LOOP;
  
  RAISE NOTICE '✅ TEST 10 RÉUSSI: 20 actions effectuées sans blocage';
  
  -- Restaurer
  UPDATE subscriptions 
  SET plan = 'free', credits_remaining = 50 
  WHERE user_id = v_user_id;
END $$;

-- ============================================
-- TEST 11: Réinitialisation quotidienne
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'test-user-id'::UUID;
  v_before INT;
  v_after INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 11: Réinitialisation Quotidienne';
  RAISE NOTICE '========================================';
  
  -- Simuler usage d'hier
  UPDATE usage_stats 
  SET 
    credits_used_today = 10,
    last_reset_date = CURRENT_DATE - INTERVAL '1 day'
  WHERE user_id = v_user_id;
  
  SELECT credits_used_today INTO v_before 
  FROM usage_stats 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Avant reset: %', v_before;
  
  -- Déclencher le reset
  PERFORM reset_daily_usage();
  
  SELECT credits_used_today INTO v_after 
  FROM usage_stats 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Après reset: %', v_after;
  
  IF v_after = 0 THEN
    RAISE NOTICE '✅ TEST 11 RÉUSSI: Reset quotidien fonctionne';
  ELSE
    RAISE NOTICE '❌ TEST 11 ÉCHOUÉ: Reset quotidien n''a pas fonctionné';
  END IF;
END $$;

-- ============================================
-- TEST 12: Réinitialisation mensuelle
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'test-user-id'::UUID;
  v_before INT;
  v_after INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 12: Réinitialisation Mensuelle';
  RAISE NOTICE '========================================';
  
  -- Simuler usage du mois dernier
  UPDATE usage_stats 
  SET 
    credits_used_this_month = 500,
    last_monthly_reset = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
  WHERE user_id = v_user_id;
  
  SELECT credits_used_this_month INTO v_before 
  FROM usage_stats 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Avant reset: %', v_before;
  
  -- Déclencher le reset
  PERFORM reset_monthly_usage();
  
  SELECT credits_used_this_month INTO v_after 
  FROM usage_stats 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Après reset: %', v_after;
  
  IF v_after = 0 THEN
    RAISE NOTICE '✅ TEST 12 RÉUSSI: Reset mensuel fonctionne';
  ELSE
    RAISE NOTICE '❌ TEST 12 ÉCHOUÉ: Reset mensuel n''a pas fonctionné';
  END IF;
END $$;

-- ============================================
-- RÉSUMÉ FINAL
-- ============================================

DO $$
DECLARE
  v_user_id UUID := 'test-user-id'::UUID;
  v_overview RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSUMÉ FINAL - État de l''utilisateur';
  RAISE NOTICE '========================================';
  
  SELECT * INTO v_overview FROM v_usage_overview WHERE user_id = v_user_id;
  
  RAISE NOTICE '📊 Plan: %', v_overview.plan;
  RAISE NOTICE '📊 Crédits restants: %', v_overview.credits_remaining;
  RAISE NOTICE '📊 Utilisés aujourd''hui: %', v_overview.credits_used_today;
  RAISE NOTICE '📊 Utilisés ce mois: %', v_overview.credits_used_this_month;
  RAISE NOTICE '📊 Stockage: % GB', v_overview.storage_used_gb;
  RAISE NOTICE '📊 Expire le: %', v_overview.expires_at;
  RAISE NOTICE '';
  RAISE NOTICE '✅ TOUS LES TESTS TERMINÉS';
  RAISE NOTICE '';
END $$;

-- ============================================
-- NETTOYAGE (Optionnel)
-- ============================================

-- Décommenter pour supprimer l'utilisateur de test
-- DELETE FROM usage_stats WHERE user_id = 'test-user-id'::UUID;
-- DELETE FROM subscriptions WHERE user_id = 'test-user-id'::UUID;
