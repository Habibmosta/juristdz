-- ============================================
-- VÉRIFIER LES UTILISATEURS MANQUANTS
-- ============================================

-- 1. Voir tous les utilisateurs dans auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Voir tous les profils
SELECT 
  id,
  email,
  first_name,
  last_name,
  email_verified,
  is_active,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 3. Trouver les utilisateurs dans auth.users SANS profil
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  'PROFIL MANQUANT' as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 4. Trouver les utilisateurs dans auth.users SANS abonnement
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  'ABONNEMENT MANQUANT' as status
FROM auth.users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE s.user_id IS NULL
ORDER BY u.created_at DESC;
