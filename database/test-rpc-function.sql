-- ============================================
-- SCRIPT DE TEST: Fonction RPC create_user_profile
-- ============================================
-- Exécutez ce script pour vérifier que la fonction RPC fonctionne
-- ============================================

-- 1. Vérifier que la fonction existe
SELECT 
  '=== FONCTION RPC ===' as section,
  proname as function_name,
  prosecdef as is_security_definer,
  CASE 
    WHEN prosecdef THEN '✅ SECURITY DEFINER activé'
    ELSE '❌ SECURITY DEFINER manquant'
  END as status
FROM pg_proc 
WHERE proname = 'create_user_profile';

-- 2. Vérifier les permissions
SELECT 
  '=== PERMISSIONS ===' as section,
  grantee,
  privilege_type,
  CASE 
    WHEN grantee = 'authenticated' AND privilege_type = 'EXECUTE' 
    THEN '✅ Permission OK'
    ELSE '⚠️ Vérifier permission'
  END as status
FROM information_schema.routine_privileges 
WHERE routine_name = 'create_user_profile';

-- 3. Vérifier les paramètres de la fonction
SELECT 
  '=== PARAMÈTRES ===' as section,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as parameters,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
WHERE p.proname = 'create_user_profile';

-- 4. Compter les profils existants
SELECT 
  '=== STATISTIQUES ===' as section,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE is_active = true) as active_profiles,
  COUNT(*) FILTER (WHERE is_active = false) as pending_profiles,
  COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as created_today
FROM profiles;

-- 5. Compter les subscriptions existantes
SELECT 
  '=== SUBSCRIPTIONS ===' as section,
  COUNT(*) as total_subscriptions,
  COUNT(*) FILTER (WHERE status = 'active') as active_subs,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_subs,
  COUNT(*) FILTER (WHERE status = 'trial') as trial_subs
FROM subscriptions;

-- 6. Vérifier les politiques RLS sur profiles
SELECT 
  '=== POLITIQUES RLS PROFILES ===' as section,
  schemaname,
  tablename,
  policyname,
  cmd as command,
  CASE 
    WHEN cmd = 'INSERT' THEN '✅ Politique INSERT'
    WHEN cmd = 'SELECT' THEN '✅ Politique SELECT'
    WHEN cmd = 'UPDATE' THEN '✅ Politique UPDATE'
    WHEN cmd = 'DELETE' THEN '✅ Politique DELETE'
  END as type
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 7. Vérifier les politiques RLS sur subscriptions
SELECT 
  '=== POLITIQUES RLS SUBSCRIPTIONS ===' as section,
  schemaname,
  tablename,
  policyname,
  cmd as command,
  CASE 
    WHEN cmd = 'INSERT' THEN '✅ Politique INSERT'
    WHEN cmd = 'SELECT' THEN '✅ Politique SELECT'
    WHEN cmd = 'UPDATE' THEN '✅ Politique UPDATE'
    WHEN cmd = 'DELETE' THEN '✅ Politique DELETE'
  END as type
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY cmd, policyname;

-- 8. Vérifier que RLS est activé
SELECT 
  '=== RLS STATUS ===' as section,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS activé'
    ELSE '❌ RLS désactivé'
  END as status
FROM pg_tables
WHERE tablename IN ('profiles', 'subscriptions')
  AND schemaname = 'public';

-- ============================================
-- RÉSULTATS ATTENDUS
-- ============================================
-- 1. Fonction existe avec SECURITY DEFINER = true
-- 2. Permission EXECUTE pour 'authenticated'
-- 3. Paramètres: user_id, user_email, first_name, etc.
-- 4. Return type: json
-- 5. Statistiques des profils et subscriptions
-- 6. Politiques RLS actives pour INSERT, SELECT, UPDATE
-- 7. RLS activé sur profiles et subscriptions
-- ============================================

-- ============================================
-- TEST MANUEL (À EXÉCUTER APRÈS INSCRIPTION)
-- ============================================
-- Remplacez [USER_ID] et [EMAIL] par les vraies valeurs
-- 
-- SELECT public.create_user_profile(
--   '[USER_ID]'::uuid,
--   '[EMAIL]',
--   'Test',
--   'User',
--   'avocat',
--   NULL,
--   NULL,
--   NULL
-- );
-- ============================================
