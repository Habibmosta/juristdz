-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 2 SIMPLIFIÉE: Juste les Fonctions (SANS RLS pour l'instant)
-- ═══════════════════════════════════════════════════════════════════════════
-- Exécutez ce script APRÈS avoir exécuté supabase-step1-tables.sql
-- On va d'abord tester sans RLS, puis l'activer après
-- ═══════════════════════════════════════════════════════════════════════════

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
-- FIN ÉTAPE 2 SIMPLIFIÉE
-- ═══════════════════════════════════════════════════════════════════════════
-- Fonctions créées: is_admin, check_document_quota, increment_document_usage
-- RLS désactivé pour l'instant (on va le tester d'abord sans)
-- Prochaine étape: Créer les comptes utilisateurs et tester
-- ═══════════════════════════════════════════════════════════════════════════
