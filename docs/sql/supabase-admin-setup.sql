-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT SQL: Configuration Admin et Quotas pour JuristDZ SaaS
-- ═══════════════════════════════════════════════════════════════════════════
-- À exécuter APRÈS le script principal (SUPABASE_SETUP_GUIDE.md)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. AJOUTER COLONNE ADMIN DANS PROFILES
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. AJOUTER COLONNES DE QUOTAS DANS SUBSCRIPTIONS
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS documents_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS documents_limit INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS cases_limit INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. CRÉER LA TABLE ADMIN_ACTIONS (Historique des actions admin)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('create_user', 'update_subscription', 'activate_user', 'deactivate_user', 'delete_user', 'update_quota')),
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view admin actions
CREATE POLICY "Admins can view admin actions" ON public.admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policy: Only admins can insert admin actions
CREATE POLICY "Admins can insert admin actions" ON public.admin_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 4. FONCTION: Vérifier si l'utilisateur est admin
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FONCTION: Vérifier les quotas de documents
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_document_quota(user_id_param UUID)
RETURNS BOOLEAN AS $$
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
  
  -- Check expiration
  IF subscription_record.expires_at IS NOT NULL 
     AND subscription_record.expires_at < NOW() THEN
    RETURN false;
  END IF;
  
  -- -1 means unlimited
  IF subscription_record.documents_limit = -1 THEN
    RETURN true;
  END IF;
  
  RETURN subscription_record.documents_used < subscription_record.documents_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FONCTION: Incrémenter l'utilisation des documents
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_document_usage(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.subscriptions
  SET documents_used = documents_used + 1,
      updated_at = NOW()
  WHERE user_id = user_id_param
  AND status = 'active'
  AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FONCTION: Réinitialiser les quotas mensuels
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reset_monthly_quotas()
RETURNS VOID AS $$
BEGIN
  UPDATE public.subscriptions
  SET documents_used = 0,
      updated_at = NOW()
  WHERE status = 'active'
  AND is_active = true
  AND plan != 'free'; -- Ne pas réinitialiser les comptes gratuits
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FONCTION: Désactiver les abonnements expirés
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deactivate_expired_subscriptions()
RETURNS VOID AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired',
      is_active = false,
      updated_at = NOW()
  WHERE expires_at < NOW()
  AND status = 'active';
  
  -- Also deactivate profiles
  UPDATE public.profiles
  SET is_active = false,
      updated_at = NOW()
  WHERE id IN (
    SELECT user_id FROM public.subscriptions
    WHERE expires_at < NOW()
    AND status = 'expired'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. POLICIES: Permettre aux admins de voir tous les utilisateurs
-- ───────────────────────────────────────────────────────────────────────────

-- Profiles: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid()
      AND p.is_admin = true
    )
  );

-- Profiles: Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid()
      AND p.is_admin = true
    )
  );

-- Subscriptions: Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Subscriptions: Admins can update all subscriptions
CREATE POLICY "Admins can update all subscriptions" ON public.subscriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Subscriptions: Admins can insert subscriptions
CREATE POLICY "Admins can insert subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 10. CRÉER LE COMPTE ADMIN PAR DÉFAUT
-- ───────────────────────────────────────────────────────────────────────────
-- NOTE: Vous devez d'abord créer le compte via Supabase Auth UI ou API
-- Ensuite, exécutez cette requête en remplaçant 'ADMIN_USER_ID' par l'ID réel

-- UPDATE public.profiles
-- SET is_admin = true
-- WHERE email = 'admin@juristdz.com';

-- 11. CRÉER DES VUES POUR L'ADMIN
-- ───────────────────────────────────────────────────────────────────────────

-- Vue: Statistiques globales
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE is_active = true) AS active_users,
  (SELECT COUNT(*) FROM public.profiles WHERE is_active = false) AS inactive_users,
  (SELECT COUNT(*) FROM public.subscriptions WHERE plan = 'free') AS free_users,
  (SELECT COUNT(*) FROM public.subscriptions WHERE plan = 'pro') AS pro_users,
  (SELECT COUNT(*) FROM public.subscriptions WHERE plan = 'cabinet') AS cabinet_users,
  (SELECT COUNT(*) FROM public.documents) AS total_documents,
  (SELECT COUNT(*) FROM public.cases) AS total_cases,
  (SELECT COUNT(*) FROM public.subscriptions WHERE expires_at < NOW() + INTERVAL '5 days' AND status = 'active') AS expiring_soon;

-- Vue: Utilisateurs avec leurs abonnements
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.profession,
  p.registration_number,
  p.organization_name,
  p.phone_number,
  p.is_active,
  p.is_admin,
  p.created_at AS user_created_at,
  s.plan,
  s.status AS subscription_status,
  s.credits_remaining,
  s.documents_used,
  s.documents_limit,
  s.cases_limit,
  s.is_active AS subscription_active,
  s.started_at,
  s.expires_at,
  CASE
    WHEN s.expires_at < NOW() THEN 'expired'
    WHEN s.expires_at < NOW() + INTERVAL '5 days' THEN 'expiring_soon'
    ELSE 'active'
  END AS expiration_status
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id;

-- 12. TRIGGER: Enregistrer les actions admin
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.plan != NEW.plan THEN
    INSERT INTO public.admin_actions (admin_id, action_type, target_user_id, details)
    VALUES (
      auth.uid(),
      'update_subscription',
      NEW.user_id,
      jsonb_build_object(
        'old_plan', OLD.plan,
        'new_plan', NEW.plan,
        'old_limit', OLD.documents_limit,
        'new_limit', NEW.documents_limit
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_subscription_changes
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_action();

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN DU SCRIPT
-- ═══════════════════════════════════════════════════════════════════════════

-- INSTRUCTIONS POST-INSTALLATION:
-- 1. Créer le compte admin via Supabase Auth (email: admin@juristdz.com)
-- 2. Récupérer l'ID du compte admin
-- 3. Exécuter: UPDATE public.profiles SET is_admin = true WHERE email = 'admin@juristdz.com';
-- 4. Se connecter avec le compte admin
-- 5. Commencer à créer des utilisateurs!

-- NOTES:
-- - documents_limit = -1 signifie illimité
-- - cases_limit = -1 signifie illimité
-- - Plan 'free': documents_limit = 5, cases_limit = 3
-- - Plan 'pro': documents_limit = -1, cases_limit = -1
-- - Plan 'cabinet': documents_limit = -1, cases_limit = -1
