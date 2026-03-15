-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 2: Configuration de la Sécurité (RLS et Fonctions)
-- ═══════════════════════════════════════════════════════════════════════════
-- Exécutez ce script APRÈS avoir exécuté supabase-step1-tables.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can create own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can update own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can delete own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can create own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id::text = (auth.uid())::text);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id::text = (auth.uid())::text);

-- Policies for cases
CREATE POLICY "Users can view own cases" ON public.cases
  FOR SELECT USING (user_id::text = (auth.uid())::text);

CREATE POLICY "Users can create own cases" ON public.cases
  FOR INSERT WITH CHECK (user_id::text = (auth.uid())::text);

CREATE POLICY "Users can update own cases" ON public.cases
  FOR UPDATE USING (user_id::text = (auth.uid())::text);

CREATE POLICY "Users can delete own cases" ON public.cases
  FOR DELETE USING (user_id::text = (auth.uid())::text);

-- Policies for documents
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (user_id::text = (auth.uid())::text);

CREATE POLICY "Users can create own documents" ON public.documents
  FOR INSERT WITH CHECK (user_id::text = (auth.uid())::text);

CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (user_id::text = (auth.uid())::text);

CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (user_id::text = (auth.uid())::text);

-- Policies for subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (user_id::text = (auth.uid())::text);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id::text = (auth.uid())::text
    AND is_admin = true
  );
END;
$$;

-- Function to check document quota
CREATE OR REPLACE FUNCTION public.check_document_quota(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record RECORD;
BEGIN
  SELECT * INTO subscription_record
  FROM public.subscriptions
  WHERE user_id = user_id_param
  AND status = 'active'
  AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF subscription_record.expires_at IS NOT NULL 
     AND subscription_record.expires_at < NOW() THEN
    RETURN false;
  END IF;
  
  IF subscription_record.documents_limit = -1 THEN
    RETURN true;
  END IF;
  
  RETURN subscription_record.documents_used < subscription_record.documents_limit;
END;
$$;

-- Function to increment document usage
CREATE OR REPLACE FUNCTION public.increment_document_usage(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.subscriptions
  SET documents_used = documents_used + 1
  WHERE user_id = user_id_param
  AND status = 'active';
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN ÉTAPE 2
-- ═══════════════════════════════════════════════════════════════════════════
-- RLS activé sur toutes les tables
-- Policies créées pour isolation des données
-- Fonctions créées: is_admin, check_document_quota, increment_document_usage
-- Prochaine étape: Créer les comptes utilisateurs
-- ═══════════════════════════════════════════════════════════════════════════
