-- ═══════════════════════════════════════════════════════════════════════════
-- CORRIGER RLS : Bloquer les accès anonymes
-- ═══════════════════════════════════════════════════════════════════════════
-- Problème : Les policies actuelles ne bloquent pas les requêtes anonymes
-- Solution : Ajouter une policy par défaut qui refuse tout accès anonyme
-- ═══════════════════════════════════════════════════════════════════════════

-- Pour profiles : Bloquer SELECT anonyme
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Pour cases : Bloquer SELECT anonyme
DROP POLICY IF EXISTS "Block anonymous access to cases" ON public.cases;
CREATE POLICY "Block anonymous access to cases"
ON public.cases
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Pour documents : Bloquer SELECT anonyme
DROP POLICY IF EXISTS "Block anonymous access to documents" ON public.documents;
CREATE POLICY "Block anonymous access to documents"
ON public.documents
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Pour subscriptions : Bloquer SELECT anonyme
DROP POLICY IF EXISTS "Block anonymous access to subscriptions" ON public.subscriptions;
CREATE POLICY "Block anonymous access to subscriptions"
ON public.subscriptions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════════════════
-- ALTERNATIVE : Supprimer les anciennes policies et recréer correctement
-- ═══════════════════════════════════════════════════════════════════════════

-- Si la solution ci-dessus ne fonctionne pas, utilisez cette approche :

-- 1. Supprimer les policies SELECT existantes
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 2. Recréer avec une condition qui bloque les anonymes
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND id::text = (auth.uid())::text
);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND public.is_admin()
);

-- Répéter pour cases
DROP POLICY IF EXISTS "Users can view own cases" ON public.cases;
DROP POLICY IF EXISTS "Admins can view all cases" ON public.cases;

CREATE POLICY "Users can view own cases"
ON public.cases
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND user_id::text = (auth.uid())::text
);

CREATE POLICY "Admins can view all cases"
ON public.cases
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND public.is_admin()
);

-- Répéter pour documents
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;

CREATE POLICY "Users can view own documents"
ON public.documents
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND user_id::text = (auth.uid())::text
);

CREATE POLICY "Admins can view all documents"
ON public.documents
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND public.is_admin()
);

-- Répéter pour subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own subscription"
ON public.subscriptions
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND user_id::text = (auth.uid())::text
);

CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND public.is_admin()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- TERMINÉ
-- ═══════════════════════════════════════════════════════════════════════════
-- Les policies bloquent maintenant les accès anonymes
-- Re-testez avec test-rls-configuration.html
-- ═══════════════════════════════════════════════════════════════════════════
