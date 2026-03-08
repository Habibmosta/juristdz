-- ============================================
-- VÉRIFIER L'ÉTAT DES EMAILS VÉRIFIÉS
-- ============================================

-- 1. Voir tous les utilisateurs et leur statut de vérification
SELECT 
  p.email,
  p.first_name,
  p.last_name,
  p.email_verified as profile_email_verified,
  u.email_confirmed_at as auth_email_confirmed,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN 'Vérifié dans auth'
    ELSE 'Non vérifié dans auth'
  END as statut_auth,
  CASE 
    WHEN p.email_verified = true THEN 'Vérifié dans profile'
    ELSE 'Non vérifié dans profile'
  END as statut_profile
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- 2. Compter les utilisateurs par statut
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN p.email_verified = true THEN 1 END) as verified_in_profile,
  COUNT(CASE WHEN u.email_confirmed_at IS NOT NULL THEN 1 END) as verified_in_auth,
  COUNT(CASE WHEN p.email_verified = false OR p.email_verified IS NULL THEN 1 END) as unverified_in_profile
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- 3. Trouver les incohérences (vérifié dans auth mais pas dans profile)
SELECT 
  p.email,
  p.email_verified as profile_verified,
  u.email_confirmed_at as auth_confirmed
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.email_confirmed_at IS NOT NULL 
  AND (p.email_verified = false OR p.email_verified IS NULL);
