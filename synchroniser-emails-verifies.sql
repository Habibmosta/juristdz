-- ============================================
-- SYNCHRONISER LES STATUTS DE VÉRIFICATION EMAIL
-- ============================================
-- Date: 8 Mars 2026
-- Description: Synchronise email_verified dans profiles avec email_confirmed_at dans auth.users
-- ============================================

-- Mettre à jour tous les profils où l'email est confirmé dans auth.users
-- mais pas marqué comme vérifié dans profiles
UPDATE profiles p
SET 
  email_verified = true,
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND u.email_confirmed_at IS NOT NULL
  AND (p.email_verified = false OR p.email_verified IS NULL);

-- Afficher le résultat
SELECT 
  COUNT(*) as profiles_synchronises
FROM profiles p
INNER JOIN auth.users u ON p.id = u.id
WHERE u.email_confirmed_at IS NOT NULL
  AND p.email_verified = true;

-- Afficher les utilisateurs maintenant vérifiés
SELECT 
  p.email,
  p.first_name,
  p.last_name,
  p.email_verified,
  u.email_confirmed_at
FROM profiles p
INNER JOIN auth.users u ON p.id = u.id
WHERE p.email_verified = true
ORDER BY p.created_at DESC;
