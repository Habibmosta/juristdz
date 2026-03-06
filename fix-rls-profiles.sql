-- Fix RLS policies for profiles table
-- Permet aux utilisateurs de créer leur propre profil lors de l'inscription

-- 1. Activer RLS sur profiles (si pas déjà fait)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Politique pour permettre l'insertion lors de l'inscription
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. Politique pour permettre la lecture de son propre profil
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 4. Politique pour permettre la mise à jour de son propre profil
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Vérifier les politiques
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
