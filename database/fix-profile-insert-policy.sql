-- ============================================
-- FIX: Politique d'insertion de profil lors de l'inscription
-- ============================================
-- Problème: Erreur 401 lors de la création du profil après signup
-- Solution: Permettre à un utilisateur authentifié d'insérer son propre profil

-- 1. Supprimer les anciennes politiques d'insertion qui peuvent causer des conflits
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 2. Créer une politique claire pour l'insertion du profil lors de l'inscription
CREATE POLICY "Allow authenticated users to insert their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  -- L'utilisateur peut insérer uniquement son propre profil
  auth.uid() = id
);

-- 3. Vérifier que la politique de lecture existe
-- (pour que l'utilisateur puisse lire son propre profil après création)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR is_admin()
);

-- 4. Vérifier que la politique de mise à jour existe
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Vérifier les politiques admin (lecture, mise à jour, suppression)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
ON profiles
FOR DELETE
TO authenticated
USING (is_admin());

-- 6. Vérifier que RLS est activé
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. Afficher toutes les politiques pour vérification
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================
-- RÉSULTAT ATTENDU:
-- ============================================
-- 1. "Allow authenticated users to insert their own profile" - INSERT
-- 2. "Users can view their own profile" - SELECT
-- 3. "Users can update their own profile" - UPDATE
-- 4. "Admins can view all profiles" - SELECT
-- 5. "Admins can update all profiles" - UPDATE
-- 6. "Admins can delete profiles" - DELETE
-- ============================================

-- Note: Après avoir exécuté ce script, testez l'inscription d'un nouvel utilisateur
