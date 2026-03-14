-- ============================================================
-- FIX: Politiques RLS pour accès admin complet
-- Exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Vérifier les politiques actuelles sur profiles
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. Supprimer les anciennes politiques restrictives sur profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- 3. Créer une politique: chaque utilisateur voit son propre profil
CREATE POLICY "users_view_own_profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 4. Créer une politique: les admins voient TOUS les profils
CREATE POLICY "admins_view_all_profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.profession = 'admin'
    )
  );

-- 5. Créer une politique: chaque utilisateur modifie son propre profil
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 6. Créer une politique: les admins modifient TOUS les profils
CREATE POLICY "admins_update_all_profiles" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.profession = 'admin'
    )
  );

-- 7. Créer une politique: les admins suppriment des profils
CREATE POLICY "admins_delete_profiles" ON profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.profession = 'admin'
    )
  );

-- 8. Même chose pour la table subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_policy" ON subscriptions;

CREATE POLICY "users_view_own_subscription" ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "admins_view_all_subscriptions" ON subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.profession = 'admin'
    )
  );

CREATE POLICY "admins_update_all_subscriptions" ON subscriptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.profession = 'admin'
    )
  );

-- 9. Vérifier que habib.belkacemi@outlook a bien profession = 'admin'
SELECT id, email, profession, is_admin, is_active
FROM profiles
WHERE email = 'habib.belkacemi@outlook.com';

-- Si profession != 'admin', corriger:
-- UPDATE profiles SET profession = 'admin', is_admin = true WHERE email = 'habib.belkacemi@outlook.com';
