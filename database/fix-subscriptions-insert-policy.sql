-- ============================================
-- FIX: Politique d'insertion de subscription lors de l'inscription
-- ============================================
-- Problème: Erreur possible lors de la création de subscription après signup
-- Solution: Permettre à un utilisateur authentifié d'insérer sa propre subscription

-- 1. Supprimer les anciennes politiques d'insertion qui peuvent causer des conflits
DROP POLICY IF EXISTS "Users can insert their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Allow subscription creation on signup" ON subscriptions;

-- 2. Créer une politique claire pour l'insertion de subscription lors de l'inscription
CREATE POLICY "Allow authenticated users to insert their own subscription"
ON subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  -- L'utilisateur peut insérer uniquement sa propre subscription
  auth.uid() = user_id
);

-- 3. Vérifier que la politique de lecture existe
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;

CREATE POLICY "Users can view their own subscription"
ON subscriptions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR is_admin()
);

-- 4. Vérifier que la politique de mise à jour existe
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON subscriptions;

CREATE POLICY "Users can update their own subscription"
ON subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Vérifier les politiques admin
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
CREATE POLICY "Admins can view all subscriptions"
ON subscriptions
FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all subscriptions" ON subscriptions;
CREATE POLICY "Admins can update all subscriptions"
ON subscriptions
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete subscriptions" ON subscriptions;
CREATE POLICY "Admins can delete subscriptions"
ON subscriptions
FOR DELETE
TO authenticated
USING (is_admin());

-- 6. Vérifier que RLS est activé
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

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
WHERE tablename = 'subscriptions'
ORDER BY policyname;

-- ============================================
-- RÉSULTAT ATTENDU:
-- ============================================
-- 1. "Allow authenticated users to insert their own subscription" - INSERT
-- 2. "Users can view their own subscription" - SELECT
-- 3. "Users can update their own subscription" - UPDATE
-- 4. "Admins can view all subscriptions" - SELECT
-- 5. "Admins can update all subscriptions" - UPDATE
-- 6. "Admins can delete subscriptions" - DELETE
-- ============================================
