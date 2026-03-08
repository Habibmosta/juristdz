-- ============================================
-- ACTIVATION DU SYSTÈME D'ESSAI GRATUIT
-- ============================================
-- Date: 8 Mars 2026
-- Description: Active le système d'essai gratuit de 7 jours pour le plan Pro
-- ============================================

-- ============================================
-- 1. FONCTION: Créer un Utilisateur avec Essai Gratuit
-- ============================================

CREATE OR REPLACE FUNCTION create_user_with_trial(
  p_user_id UUID,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_profession TEXT,
  p_plan TEXT DEFAULT 'pro'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trial_ends_at TIMESTAMPTZ;
BEGIN
  -- Calculer la date de fin d'essai (7 jours)
  v_trial_ends_at := NOW() + INTERVAL '7 days';
  
  -- Créer le profil
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    profession,
    email_verified,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_first_name,
    p_last_name,
    p_profession,
    false,
    true,
    NOW(),
    NOW()
  );
  
  -- Créer l'abonnement en mode trial
  INSERT INTO subscriptions (
    user_id,
    plan,
    status,
    trial_ends_at,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_plan,
    'trial',
    v_trial_ends_at,
    NOW(),
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Utilisateur créé avec essai gratuit',
    'user_id', p_user_id,
    'plan', p_plan,
    'trial_ends_at', v_trial_ends_at
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erreur lors de la création: ' || SQLERRM
    );
END;
$$;

-- ============================================
-- 2. FONCTION: Créer un Utilisateur avec Plan Gratuit
-- ============================================

CREATE OR REPLACE FUNCTION create_user_with_free_plan(
  p_user_id UUID,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_profession TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Créer le profil
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    profession,
    email_verified,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_first_name,
    p_last_name,
    p_profession,
    false,
    true,
    NOW(),
    NOW()
  );
  
  -- Créer l'abonnement gratuit
  INSERT INTO subscriptions (
    user_id,
    plan,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    'free',
    'active',
    NOW(),
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Utilisateur créé avec plan gratuit',
    'user_id', p_user_id,
    'plan', 'free'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erreur lors de la création: ' || SQLERRM
    );
END;
$$;

-- ============================================
-- 3. FONCTION: Convertir Essai en Abonnement Payant
-- ============================================

CREATE OR REPLACE FUNCTION convert_trial_to_paid(
  p_user_id UUID,
  p_payment_method TEXT DEFAULT 'ccp'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Récupérer le plan actuel
  SELECT plan INTO v_plan
  FROM subscriptions
  WHERE user_id = p_user_id;
  
  IF v_plan IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Abonnement introuvable'
    );
  END IF;
  
  -- Calculer la date d'expiration (30 jours)
  v_expires_at := NOW() + INTERVAL '30 days';
  
  -- Mettre à jour l'abonnement
  UPDATE subscriptions
  SET 
    status = 'active',
    trial_ends_at = NULL,
    expires_at = v_expires_at,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Logger la conversion
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_user_id,
    details,
    created_at
  ) VALUES (
    p_user_id,
    'trial_converted',
    p_user_id,
    json_build_object(
      'plan', v_plan,
      'payment_method', p_payment_method,
      'expires_at', v_expires_at
    ),
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Essai converti en abonnement payant',
    'plan', v_plan,
    'expires_at', v_expires_at
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erreur lors de la conversion: ' || SQLERRM
    );
END;
$$;

-- ============================================
-- 4. FONCTION: Convertir Essai en Plan Gratuit
-- ============================================

CREATE OR REPLACE FUNCTION convert_trial_to_free(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mettre à jour l'abonnement
  UPDATE subscriptions
  SET 
    plan = 'free',
    status = 'active',
    trial_ends_at = NULL,
    expires_at = NULL,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Logger la conversion
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_user_id,
    details,
    created_at
  ) VALUES (
    p_user_id,
    'trial_to_free',
    p_user_id,
    json_build_object(
      'converted_at', NOW()
    ),
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Essai converti en plan gratuit'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erreur lors de la conversion: ' || SQLERRM
    );
END;
$$;

-- ============================================
-- 5. FONCTION: Suspendre les Essais Expirés
-- ============================================

CREATE OR REPLACE FUNCTION suspend_expired_trials()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Suspendre les essais expirés
  UPDATE subscriptions
  SET 
    status = 'suspended',
    updated_at = NOW()
  WHERE status = 'trial'
    AND trial_ends_at < NOW()
    AND trial_ends_at IS NOT NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Essais expirés suspendus',
    'count', v_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erreur: ' || SQLERRM
    );
END;
$$;

-- ============================================
-- 6. VUE: Essais en Cours
-- ============================================

CREATE OR REPLACE VIEW v_active_trials AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.profession,
  s.plan,
  s.trial_ends_at,
  EXTRACT(DAY FROM (s.trial_ends_at - NOW())) as days_remaining,
  CASE 
    WHEN s.trial_ends_at < NOW() THEN 'expired'
    WHEN EXTRACT(DAY FROM (s.trial_ends_at - NOW())) <= 2 THEN 'expiring_soon'
    ELSE 'active'
  END as trial_status
FROM profiles p
INNER JOIN subscriptions s ON p.id = s.user_id
WHERE s.status = 'trial'
  AND s.trial_ends_at IS NOT NULL
ORDER BY s.trial_ends_at ASC;

-- ============================================
-- 7. VUE: Essais Expirés (à relancer)
-- ============================================

CREATE OR REPLACE VIEW v_expired_trials AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.profession,
  s.plan,
  s.trial_ends_at,
  EXTRACT(DAY FROM (NOW() - s.trial_ends_at)) as days_since_expiry
FROM profiles p
INNER JOIN subscriptions s ON p.id = s.user_id
WHERE s.status = 'suspended'
  AND s.trial_ends_at IS NOT NULL
  AND s.trial_ends_at < NOW()
ORDER BY s.trial_ends_at DESC;

-- ============================================
-- 8. CRON JOB: Suspendre les Essais Expirés
-- ============================================

-- Supprimer le job existant s'il existe
SELECT cron.unschedule('suspend-expired-trials') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'suspend-expired-trials'
);

-- Créer le CRON job (tous les jours à 2h du matin)
SELECT cron.schedule(
  'suspend-expired-trials',
  '0 2 * * *',
  $$ SELECT suspend_expired_trials(); $$
);

-- ============================================
-- 9. COMMENTAIRES
-- ============================================

COMMENT ON FUNCTION create_user_with_trial IS 'Crée un utilisateur avec essai gratuit de 7 jours';
COMMENT ON FUNCTION create_user_with_free_plan IS 'Crée un utilisateur avec plan gratuit permanent';
COMMENT ON FUNCTION convert_trial_to_paid IS 'Convertit un essai en abonnement payant';
COMMENT ON FUNCTION convert_trial_to_free IS 'Convertit un essai en plan gratuit';
COMMENT ON FUNCTION suspend_expired_trials IS 'Suspend automatiquement les essais expirés';
COMMENT ON VIEW v_active_trials IS 'Liste des essais gratuits en cours';
COMMENT ON VIEW v_expired_trials IS 'Liste des essais expirés à relancer';

-- ============================================
-- 10. EXEMPLES D'UTILISATION
-- ============================================

/*

-- Créer un utilisateur avec essai Pro 7 jours
SELECT create_user_with_trial(
  'user-id-here',
  'email@example.com',
  'Prénom',
  'Nom',
  'avocat',
  'pro'
);

-- Créer un utilisateur avec plan gratuit
SELECT create_user_with_free_plan(
  'user-id-here',
  'email@example.com',
  'Prénom',
  'Nom',
  'avocat'
);

-- Convertir un essai en abonnement payant
SELECT convert_trial_to_paid('user-id-here', 'ccp');

-- Convertir un essai en plan gratuit
SELECT convert_trial_to_free('user-id-here');

-- Voir les essais en cours
SELECT * FROM v_active_trials;

-- Voir les essais expirés
SELECT * FROM v_expired_trials;

-- Suspendre manuellement les essais expirés
SELECT suspend_expired_trials();

*/

-- ============================================
-- ✅ SYSTÈME D'ESSAI GRATUIT ACTIVÉ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Système d''essai gratuit activé avec succès!';
  RAISE NOTICE '📊 Fonctions créées: create_user_with_trial, convert_trial_to_paid, etc.';
  RAISE NOTICE '👁️ Vues créées: v_active_trials, v_expired_trials';
  RAISE NOTICE '⏰ CRON job activé: suspend-expired-trials (tous les jours à 2h)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Prochaine étape: Modifier l''interface d''inscription';
END $$;
