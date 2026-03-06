-- ============================================
-- FIX COMPLET: Politiques RLS pour l'inscription
-- ============================================
-- Ce script corrige toutes les politiques nécessaires pour permettre
-- l'inscription d'un nouvel utilisateur sans erreur 401
-- ============================================

-- ============================================
-- PARTIE 1: TABLE PROFILES
-- ============================================

-- Nettoyer les anciennes politiques
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Créer les nouvelles politiques pour profiles
CREATE POLICY "Allow authenticated users to insert their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete profiles"
ON profiles
FOR DELETE
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can insert profiles"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTIE 2: TABLE SUBSCRIPTIONS
-- ============================================

-- Nettoyer les anciennes politiques
DROP POLICY IF EXISTS "Users can insert their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Allow subscription creation on signup" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON subscriptions;

-- Créer les nouvelles politiques pour subscriptions
CREATE POLICY "Allow authenticated users to insert their own subscription"
ON subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscription"
ON subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can update their own subscription"
ON subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON subscriptions
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update all subscriptions"
ON subscriptions
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete subscriptions"
ON subscriptions
FOR DELETE
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can insert subscriptions"
ON subscriptions
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Activer RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

-- Afficher toutes les politiques profiles
SELECT 
  '=== PROFILES POLICIES ===' as info,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Afficher toutes les politiques subscriptions
SELECT 
  '=== SUBSCRIPTIONS POLICIES ===' as info,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'subscriptions'
ORDER BY cmd, policyname;

-- Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'subscriptions')
ORDER BY tablename;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
-- PROFILES:
-- 1. INSERT: Allow authenticated users to insert their own profile
-- 2. INSERT: Admins can insert profiles
-- 3. SELECT: Users can view their own profile
-- 4. SELECT: Admins can view all profiles
-- 5. UPDATE: Users can update their own profile
-- 6. UPDATE: Admins can update all profiles
-- 7. DELETE: Admins can delete profiles
--
-- SUBSCRIPTIONS:
-- 1. INSERT: Allow authenticated users to insert their own subscription
-- 2. INSERT: Admins can insert subscriptions
-- 3. SELECT: Users can view their own subscription
-- 4. SELECT: Admins can view all subscriptions
-- 5. UPDATE: Users can update their own subscription
-- 6. UPDATE: Admins can update all subscriptions
-- 7. DELETE: Admins can delete subscriptions
-- ============================================

-- ✅ Après avoir exécuté ce script:
-- 1. Testez l'inscription d'un nouvel utilisateur
-- 2. Vérifiez qu'il n'y a plus d'erreur 401
-- 3. Vérifiez que le profil et la subscription sont créés
-- 4. Vérifiez que l'utilisateur peut voir son propre profil
