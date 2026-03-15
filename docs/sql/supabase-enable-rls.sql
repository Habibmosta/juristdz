-- ═══════════════════════════════════════════════════════════════════════════
-- ACTIVATION RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════════════════
-- Ce script active RLS et crée les policies pour l'isolation des données
-- Exécutez ce script APRÈS avoir testé que tout fonctionne sans RLS
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. ACTIVER RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. POLICIES POUR LA TABLE PROFILES
-- ═══════════════════════════════════════════════════════════════════════════

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (id::text = (auth.uid())::text);

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (id::text = (auth.uid())::text);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

-- Les admins peuvent tout modifier
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_admin());

-- Les admins peuvent créer des profils
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (public.is_admin());

-- Les admins peuvent supprimer des profils
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (public.is_admin());

-- Permettre l'insertion lors de l'inscription (signUp)
CREATE POLICY "Allow profile creation on signup"
ON public.profiles
FOR INSERT
WITH CHECK (id::text = (auth.uid())::text);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. POLICIES POUR LA TABLE CASES
-- ═══════════════════════════════════════════════════════════════════════════

-- Les utilisateurs peuvent voir leurs propres dossiers
CREATE POLICY "Users can view own cases"
ON public.cases
FOR SELECT
USING (user_id::text = (auth.uid())::text);

-- Les utilisateurs peuvent créer leurs propres dossiers
CREATE POLICY "Users can create own cases"
ON public.cases
FOR INSERT
WITH CHECK (user_id::text = (auth.uid())::text);

-- Les utilisateurs peuvent modifier leurs propres dossiers
CREATE POLICY "Users can update own cases"
ON public.cases
FOR UPDATE
USING (user_id::text = (auth.uid())::text);

-- Les utilisateurs peuvent supprimer leurs propres dossiers
CREATE POLICY "Users can delete own cases"
ON public.cases
FOR DELETE
USING (user_id::text = (auth.uid())::text);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all cases"
ON public.cases
FOR SELECT
USING (public.is_admin());

-- Les admins peuvent tout modifier
CREATE POLICY "Admins can manage all cases"
ON public.cases
FOR ALL
USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. POLICIES POUR LA TABLE DOCUMENTS
-- ═══════════════════════════════════════════════════════════════════════════

-- Les utilisateurs peuvent voir leurs propres documents
CREATE POLICY "Users can view own documents"
ON public.documents
FOR SELECT
USING (user_id::text = (auth.uid())::text);

-- Les utilisateurs peuvent créer leurs propres documents
CREATE POLICY "Users can create own documents"
ON public.documents
FOR INSERT
WITH CHECK (
  user_id::text = (auth.uid())::text 
  AND public.check_document_quota(user_id)
);

-- Les utilisateurs peuvent modifier leurs propres documents
CREATE POLICY "Users can update own documents"
ON public.documents
FOR UPDATE
USING (user_id::text = (auth.uid())::text);

-- Les utilisateurs peuvent supprimer leurs propres documents
CREATE POLICY "Users can delete own documents"
ON public.documents
FOR DELETE
USING (user_id::text = (auth.uid())::text);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all documents"
ON public.documents
FOR SELECT
USING (public.is_admin());

-- Les admins peuvent tout gérer
CREATE POLICY "Admins can manage all documents"
ON public.documents
FOR ALL
USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. POLICIES POUR LA TABLE SUBSCRIPTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Les utilisateurs peuvent voir leur propre abonnement
CREATE POLICY "Users can view own subscription"
ON public.subscriptions
FOR SELECT
USING (user_id::text = (auth.uid())::text);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (public.is_admin());

-- Les admins peuvent tout gérer
CREATE POLICY "Admins can manage all subscriptions"
ON public.subscriptions
FOR ALL
USING (public.is_admin());

-- Permettre la création d'abonnement lors de l'inscription
CREATE POLICY "Allow subscription creation on signup"
ON public.subscriptions
FOR INSERT
WITH CHECK (user_id::text = (auth.uid())::text);

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN ACTIVATION RLS
-- ═══════════════════════════════════════════════════════════════════════════
-- RLS activé sur toutes les tables
-- Policies créées pour l'isolation des données
-- Chaque utilisateur voit UNIQUEMENT ses propres données
-- Les admins peuvent tout voir et gérer
-- ═══════════════════════════════════════════════════════════════════════════
