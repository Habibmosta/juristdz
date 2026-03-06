-- ============================================
-- NETTOYAGE: Supprimer les Utilisateurs de Test
-- ============================================
-- Utilisez ce script pour supprimer les utilisateurs de test
-- créés pendant le debugging de l'erreur 401
-- ============================================

-- ⚠️ ATTENTION: Ce script supprime définitivement les données
-- Vérifiez bien les IDs avant d'exécuter

-- ============================================
-- 1. LISTER LES UTILISATEURS SANS PROFIL
-- ============================================
-- Ces utilisateurs ont été créés mais leur profil n'a pas été créé
SELECT 
  '=== UTILISATEURS SANS PROFIL ===' as section,
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '❌ Email non vérifié'
    ELSE '✅ Email vérifié'
  END as email_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- ============================================
-- 2. LISTER LES PROFILS SANS SUBSCRIPTION
-- ============================================
-- Ces profils ont été créés mais leur subscription n'a pas été créée
SELECT 
  '=== PROFILS SANS SUBSCRIPTION ===' as section,
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.created_at
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id
WHERE s.user_id IS NULL
ORDER BY p.created_at DESC;

-- ============================================
-- 3. LISTER LES UTILISATEURS DE TEST
-- ============================================
-- Utilisateurs créés aujourd'hui avec email de test
SELECT 
  '=== UTILISATEURS DE TEST ===' as section,
  u.id,
  u.email,
  u.created_at,
  p.first_name,
  p.last_name,
  p.is_active,
  s.status as subscription_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.subscriptions s ON u.id = s.user_id
WHERE u.email LIKE '%test%' 
   OR u.email LIKE '%demo%'
   OR u.email LIKE '%example%'
ORDER BY u.created_at DESC;

-- ============================================
-- 4. SUPPRIMER UN UTILISATEUR SPÉCIFIQUE
-- ============================================
-- Remplacez [USER_ID] par l'ID réel de l'utilisateur à supprimer
-- 
-- -- Étape 1: Supprimer la subscription
-- DELETE FROM public.subscriptions 
-- WHERE user_id = '[USER_ID]';
-- 
-- -- Étape 2: Supprimer le profil
-- DELETE FROM public.profiles 
-- WHERE id = '[USER_ID]';
-- 
-- -- Étape 3: Supprimer l'utilisateur (nécessite privilèges admin)
-- -- Cette étape doit être faite via le Dashboard Supabase
-- -- Authentication > Users > Sélectionner l'utilisateur > Delete User

-- ============================================
-- 5. SUPPRIMER TOUS LES UTILISATEURS DE TEST
-- ============================================
-- ⚠️ DANGER: Supprime TOUS les utilisateurs avec email de test
-- Décommentez UNIQUEMENT si vous êtes sûr
-- 
-- -- Supprimer les subscriptions
-- DELETE FROM public.subscriptions 
-- WHERE user_id IN (
--   SELECT id FROM auth.users 
--   WHERE email LIKE '%test%' 
--      OR email LIKE '%demo%'
--      OR email LIKE '%example%'
-- );
-- 
-- -- Supprimer les profils
-- DELETE FROM public.profiles 
-- WHERE id IN (
--   SELECT id FROM auth.users 
--   WHERE email LIKE '%test%' 
--      OR email LIKE '%demo%'
--      OR email LIKE '%example%'
-- );
-- 
-- -- Les utilisateurs auth.users doivent être supprimés via le Dashboard

-- ============================================
-- 6. SUPPRIMER LES UTILISATEURS CRÉÉS AUJOURD'HUI
-- ============================================
-- ⚠️ DANGER: Supprime tous les utilisateurs créés aujourd'hui
-- Décommentez UNIQUEMENT si vous êtes sûr
-- 
-- -- Supprimer les subscriptions
-- DELETE FROM public.subscriptions 
-- WHERE user_id IN (
--   SELECT id FROM auth.users 
--   WHERE created_at::date = CURRENT_DATE
-- );
-- 
-- -- Supprimer les profils
-- DELETE FROM public.profiles 
-- WHERE id IN (
--   SELECT id FROM auth.users 
--   WHERE created_at::date = CURRENT_DATE
-- );

-- ============================================
-- 7. VÉRIFIER LES SUPPRESSIONS
-- ============================================
-- Après avoir supprimé, vérifiez que tout est cohérent
SELECT 
  '=== VÉRIFICATION FINALE ===' as section,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.subscriptions) as total_subscriptions,
  (SELECT COUNT(*) FROM auth.users u 
   LEFT JOIN public.profiles p ON u.id = p.id 
   WHERE p.id IS NULL) as users_without_profile,
  (SELECT COUNT(*) FROM public.profiles p 
   LEFT JOIN public.subscriptions s ON p.id = s.user_id 
   WHERE s.user_id IS NULL) as profiles_without_subscription;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- 1. Les utilisateurs dans auth.users ne peuvent être supprimés que via:
--    - Dashboard Supabase > Authentication > Users
--    - API Admin Supabase
--    - Fonction RPC avec privilèges admin
-- 
-- 2. Ordre de suppression IMPORTANT:
--    a. Supprimer subscriptions (référence user_id)
--    b. Supprimer profiles (référence id)
--    c. Supprimer auth.users (via Dashboard)
-- 
-- 3. Si vous supprimez un profil/subscription mais pas l'utilisateur:
--    - L'utilisateur peut toujours se connecter
--    - Mais il n'aura pas de profil/subscription
--    - La fonction RPC créera un nouveau profil à la prochaine inscription
-- 
-- 4. Pour un nettoyage complet:
--    - Exécutez les DELETE pour subscriptions et profiles
--    - Allez dans Dashboard > Authentication > Users
--    - Supprimez manuellement les utilisateurs
-- ============================================

-- ============================================
-- EXEMPLE: Supprimer les 2 utilisateurs de test mentionnés
-- ============================================
-- IDs: cc744a41-1510-4ea9-a907-8a547e343d0f
--      4e06ae2c-3508-461f-bc6c-5586fd9820c9
-- 
-- DELETE FROM public.subscriptions 
-- WHERE user_id IN (
--   'cc744a41-1510-4ea9-a907-8a547e343d0f',
--   '4e06ae2c-3508-461f-bc6c-5586fd9820c9'
-- );
-- 
-- DELETE FROM public.profiles 
-- WHERE id IN (
--   'cc744a41-1510-4ea9-a907-8a547e343d0f',
--   '4e06ae2c-3508-461f-bc6c-5586fd9820c9'
-- );
-- 
-- Puis supprimer via Dashboard > Authentication > Users
-- ============================================
