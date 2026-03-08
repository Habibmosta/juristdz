-- ============================================
-- SYSTÈME D'ESSAI GRATUIT - ACTIVATION
-- ============================================
-- Date: 8 Mars 2026
-- Description: Active le système d'essai gratuit de 7 jours pour les plans Pro/Cabinet
-- ============================================

-- ============================================
-- 0. AJOUTER LA COLONNE trial_ends_at SI NÉCESSAIRE
-- ============================================

-- Ajouter la colonne trial_ends_at à la table subscriptions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Mettre à jour le CHECK constraint pour inclure 'trial'
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN ('active', 'cancelled', 'expired', 'trial', 'pending'));

-- ============================================
-- 1. MODIFIER LA FONCTION handle_new_user
-- ============================================
-- Cette fonction permet de choisir entre plan gratuit ou essai gratuit

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
  v_status TEXT;
  v_trial_ends_at TIMESTAMPTZ;
BEGIN
  -- Récupérer le plan choisi depuis les métadonnées (défaut: free)
  v_plan := COALESCE((NEW.raw_user_meta_data->>'plan')::text, 'free');
  
  -- Déterminer le statut et la date de fin d'essai
  IF v_plan IN ('pro', 'cabinet') THEN
    -- Si l'utilisateur choisit Pro ou Cabinet, c'est un essai de 7 jours
    v_status := 'trial';
    v_trial_ends_at := NOW() + INTERVAL '7 days';
  ELSE
    -- Sinon, c'est un plan gratuit permanent
    v_plan := 'free';
    v_status := 'active';
    v_trial_ends_at := NULL;
  END IF;
  
  -- Créer le profil
  INSERT INTO public.profiles (id, email, first_name, last_name, profession)
  VALUES (
    NEW.id::uuid,
    NEW.email::text,
    COALESCE((NEW.raw_user_meta_data->>'first_name')::text, ''),
    COALESCE((NEW.raw_user_meta_data->>'last_name')::text, ''),
    COALESCE((NEW.raw_user_meta_data->>'profession')::text, 'avocat')
  );
  
  -- Créer l'abonnement avec le plan choisi
  INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at)
  VALUES (NEW.id::uuid, v_plan, v_status, v_trial_ends_at);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. FONCTION POUR SUSPENDRE LES ESSAIS EXPIRÉS
-- ============================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS suspend_expired_trials();

CREATE OR REPLACE FUNCTION suspend_expired_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Suspendre les abonnements en essai qui ont expiré
  UPDATE subscriptions
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE status = 'trial'
    AND trial_ends_at < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RAISE NOTICE 'Essais expirés suspendus: %', v_count;
END;
$$;

-- ============================================
-- 3. FONCTION POUR CONVERTIR UN ESSAI EN PAYANT
-- ============================================

CREATE OR REPLACE FUNCTION convert_trial_to_paid(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  -- Récupérer l'abonnement
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id;
  
  IF v_subscription IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Abonnement introuvable'
    );
  END IF;
  
  IF v_subscription.status != 'trial' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Cet abonnement n''est pas en essai'
    );
  END IF;
  
  -- Convertir en abonnement payant
  UPDATE subscriptions
  SET 
    status = 'active',
    trial_ends_at = NULL,
    expires_at = NOW() + INTERVAL '1 month',
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Essai converti en abonnement payant',
    'plan', v_subscription.plan,
    'expires_at', NOW() + INTERVAL '1 month'
  );
END;
$$;

-- ============================================
-- 4. FONCTION POUR RETOURNER AU PLAN GRATUIT
-- ============================================

CREATE OR REPLACE FUNCTION downgrade_to_free(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Passer au plan gratuit
  UPDATE subscriptions
  SET 
    plan = 'free',
    status = 'active',
    trial_ends_at = NULL,
    expires_at = NULL,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Abonnement changé vers le plan gratuit'
  );
END;
$$;

-- ============================================
-- 5. VUE POUR LES ESSAIS EN COURS
-- ============================================

CREATE OR REPLACE VIEW v_active_trials AS
SELECT 
  s.user_id,
  p.email,
  p.first_name,
  p.last_name,
  s.plan,
  s.trial_ends_at,
  EXTRACT(DAY FROM (s.trial_ends_at - NOW())) as days_remaining,
  s.created_at as trial_started_at
FROM subscriptions s
INNER JOIN profiles p ON s.user_id = p.id
WHERE s.status = 'trial'
  AND s.trial_ends_at IS NOT NULL
  AND s.trial_ends_at > NOW()
ORDER BY s.trial_ends_at ASC;

-- ============================================
-- 6. VUE POUR LES ESSAIS EXPIRÉS
-- ============================================

CREATE OR REPLACE VIEW v_expired_trials AS
SELECT 
  s.user_id,
  p.email,
  p.first_name,
  p.last_name,
  s.plan,
  s.trial_ends_at,
  EXTRACT(DAY FROM (NOW() - s.trial_ends_at)) as days_since_expiry,
  s.created_at as trial_started_at
FROM subscriptions s
INNER JOIN profiles p ON s.user_id = p.id
WHERE s.status IN ('trial', 'expired')
  AND s.trial_ends_at IS NOT NULL
  AND s.trial_ends_at < NOW()
ORDER BY s.trial_ends_at DESC;

-- ============================================
-- 7. ACTIVER LE CRON JOB (si pg_cron est installé)
-- ============================================

-- Note: Sur Supabase, pg_cron n'est pas toujours disponible
-- Vous pouvez utiliser Supabase Edge Functions ou un scheduler externe

-- Tentative de création du CRON job
DO $$
BEGIN
  -- Supprimer l'ancien job s'il existe
  BEGIN
    PERFORM cron.unschedule('suspend-expired-trials');
    RAISE NOTICE '✅ Ancien CRON job supprimé';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'ℹ️ Aucun ancien CRON job à supprimer';
  END;
  
  -- Créer le CRON job
  BEGIN
    PERFORM cron.schedule(
      'suspend-expired-trials',
      '0 2 * * *',
      'SELECT suspend_expired_trials();'
    );
    RAISE NOTICE '✅ CRON job créé avec succès: suspend-expired-trials';
    RAISE NOTICE '⏰ Exécution: Tous les jours à 2h du matin';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️ pg_cron n''est pas disponible sur cette instance.';
      RAISE NOTICE '💡 Solutions alternatives:';
      RAISE NOTICE '   1. Utiliser Supabase Edge Functions avec un scheduler';
      RAISE NOTICE '   2. Exécuter manuellement: SELECT suspend_expired_trials();';
      RAISE NOTICE '   3. Utiliser un service externe (cron-job.org, etc.)';
  END;
END $$;

-- ============================================
-- 8. COMMENTAIRES
-- ============================================

COMMENT ON FUNCTION handle_new_user IS 'Crée un profil et un abonnement (gratuit ou essai) lors de l''inscription';
COMMENT ON FUNCTION suspend_expired_trials IS 'Suspend les abonnements en essai qui ont expiré';
COMMENT ON FUNCTION convert_trial_to_paid IS 'Convertit un essai gratuit en abonnement payant';
COMMENT ON FUNCTION downgrade_to_free IS 'Retourne un utilisateur au plan gratuit';
COMMENT ON VIEW v_active_trials IS 'Liste des essais gratuits en cours';
COMMENT ON VIEW v_expired_trials IS 'Liste des essais gratuits expirés';

-- ============================================
-- 9. EXEMPLES D'UTILISATION
-- ============================================

/*

-- Voir les essais en cours
SELECT * FROM v_active_trials;

-- Voir les essais expirés
SELECT * FROM v_expired_trials;

-- Suspendre manuellement les essais expirés
SELECT suspend_expired_trials();

-- Convertir un essai en payant
SELECT convert_trial_to_paid('user-id-here');

-- Retourner au plan gratuit
SELECT downgrade_to_free('user-id-here');

-- Statistiques des essais
SELECT 
  COUNT(*) FILTER (WHERE status = 'trial') as essais_actifs,
  COUNT(*) FILTER (WHERE status = 'expired') as essais_expires,
  COUNT(*) FILTER (WHERE status = 'active' AND plan != 'free') as convertis_payant
FROM subscriptions;

*/

-- ============================================
-- 10. LOGS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Système d''essai gratuit activé avec succès!';
  RAISE NOTICE '📊 Fonctions créées:';
  RAISE NOTICE '   - handle_new_user() (modifiée)';
  RAISE NOTICE '   - suspend_expired_trials()';
  RAISE NOTICE '   - convert_trial_to_paid()';
  RAISE NOTICE '   - downgrade_to_free()';
  RAISE NOTICE '📊 Vues créées:';
  RAISE NOTICE '   - v_active_trials';
  RAISE NOTICE '   - v_expired_trials';
  RAISE NOTICE '⏰ CRON job: suspend-expired-trials (tous les jours à 2h)';
END $$;
