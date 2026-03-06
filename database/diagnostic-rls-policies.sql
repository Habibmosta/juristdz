-- ============================================
-- DIAGNOSTIC: Vérification des Politiques RLS
-- ============================================
-- Ce script permet de diagnostiquer rapidement les problèmes
-- de politiques RLS pour l'inscription
-- ============================================

-- 1. Vérifier que RLS est activé
SELECT 
  '=== RLS STATUS ===' as section,
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables 
WHERE tablename IN ('profiles', 'subscriptions')
ORDER BY tablename;

-- 2. Compter les politiques par table
SELECT 
  '=== POLICY COUNT ===' as section,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ OK'
    ELSE '⚠️ MISSING POLICIES'
  END as status
FROM pg_policies 
WHERE tablename IN ('profiles', 'subscriptions')
GROUP BY tablename
ORDER BY tablename;

-- 3. Vérifier les politiques INSERT (les plus importantes pour l'inscription)
SELECT 
  '=== INSERT POLICIES ===' as section,
  tablename,
  policyname,
  roles,
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ HAS CHECK'
    ELSE '❌ NO CHECK'
  END as check_status
FROM pg_policies 
WHERE tablename IN ('profiles', 'subscriptions')
  AND cmd = 'INSERT'
ORDER BY tablename, policyname;

-- 4. Lister toutes les politiques profiles
SELECT 
  '=== ALL PROFILES POLICIES ===' as section,
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 5. Lister toutes les politiques subscriptions
SELECT 
  '=== ALL SUBSCRIPTIONS POLICIES ===' as section,
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies 
WHERE tablename = 'subscriptions'
ORDER BY cmd, policyname;

-- 6. Vérifier la fonction is_admin()
SELECT 
  '=== FUNCTION is_admin() ===' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') 
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as function_status;

-- 7. Vérifier les colonnes nécessaires dans profiles
SELECT 
  '=== PROFILES COLUMNS ===' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('id', 'email', 'first_name', 'last_name', 'profession', 'is_admin', 'is_active')
ORDER BY column_name;

-- 8. Vérifier les colonnes nécessaires dans subscriptions
SELECT 
  '=== SUBSCRIPTIONS COLUMNS ===' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name IN ('id', 'user_id', 'plan', 'status', 'is_active')
ORDER BY column_name;

-- 9. Vérifier s'il y a des politiques en conflit (même nom)
SELECT 
  '=== DUPLICATE POLICIES ===' as section,
  tablename,
  policyname,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 1 THEN '⚠️ DUPLICATE'
    ELSE '✅ UNIQUE'
  END as status
FROM pg_policies 
WHERE tablename IN ('profiles', 'subscriptions')
GROUP BY tablename, policyname
HAVING COUNT(*) > 1
ORDER BY tablename, policyname;

-- 10. Résumé final
SELECT 
  '=== DIAGNOSTIC SUMMARY ===' as section,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as profiles_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'subscriptions') as subscriptions_policies,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles') as profiles_rls,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'subscriptions') as subscriptions_rls,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') 
    THEN true
    ELSE false
  END as has_is_admin_function;

-- ============================================
-- INTERPRÉTATION DES RÉSULTATS
-- ============================================
-- 
-- ✅ TOUT EST OK SI:
-- - RLS STATUS: Les deux tables ont "✅ ENABLED"
-- - POLICY COUNT: Les deux tables ont "✅ OK" (7 politiques chacune)
-- - INSERT POLICIES: Au moins 2 politiques INSERT par table avec "✅ HAS CHECK"
-- - FUNCTION is_admin(): "✅ EXISTS"
-- - DUPLICATE POLICIES: Aucune ligne ou toutes "✅ UNIQUE"
-- - DIAGNOSTIC SUMMARY: 
--   * profiles_policies: 7
--   * subscriptions_policies: 7
--   * profiles_rls: true
--   * subscriptions_rls: true
--   * has_is_admin_function: true
--
-- ⚠️ PROBLÈMES POSSIBLES:
-- - RLS DISABLED: Exécuter "ALTER TABLE xxx ENABLE ROW LEVEL SECURITY"
-- - MISSING POLICIES: Exécuter le script fix-signup-policies-complete.sql
-- - DUPLICATE POLICIES: Supprimer les doublons avec DROP POLICY
-- - MISSING FUNCTION: Créer la fonction is_admin()
-- ============================================
