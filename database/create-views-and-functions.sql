-- ============================================================
-- Vues et fonctions pour la gestion des comptes
-- A executer dans Supabase SQL Editor
-- Idempotent: peut etre execute plusieurs fois sans risque
-- ============================================================

-- Vue: comptes en attente de validation (trial + suspended)
CREATE OR REPLACE VIEW pending_accounts AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.account_status,
  p.trial_started_at,
  p.trial_ends_at,
  p.payment_status,
  EXTRACT(DAY FROM (p.trial_ends_at - NOW()))::INTEGER AS days_remaining,
  (SELECT COUNT(*) FROM cases   WHERE user_id = p.id) AS cases_count,
  (SELECT COUNT(*) FROM clients WHERE user_id = p.id) AS clients_count,
  p.created_at,
  p.last_login_at,
  p.login_count
FROM profiles p
WHERE p.account_status IN ('trial', 'suspended')
ORDER BY p.created_at DESC;

-- Vue: comptes trial expirés
CREATE OR REPLACE VIEW expired_trials AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.account_status,
  p.trial_ends_at,
  EXTRACT(DAY FROM (NOW() - p.trial_ends_at))::INTEGER AS days_expired,
  (SELECT COUNT(*) FROM cases   WHERE user_id = p.id) AS cases_count,
  (SELECT COUNT(*) FROM clients WHERE user_id = p.id) AS clients_count
FROM profiles p
WHERE p.account_status = 'trial'
  AND p.trial_ends_at < NOW()
ORDER BY p.trial_ends_at;

-- Fonction: activer un compte
DROP FUNCTION IF EXISTS activate_account(UUID, UUID, DECIMAL, VARCHAR);
CREATE OR REPLACE FUNCTION activate_account(
  p_user_id UUID,
  p_admin_id UUID,
  p_payment_amount DECIMAL DEFAULT NULL,
  p_payment_reference VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Confirmer l'email dans auth.users
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at         = NOW()
  WHERE id = p_user_id;

  -- Activer le profil
  UPDATE profiles
  SET 
    account_status     = 'active',
    email_verified     = true,
    validated_by       = p_admin_id,
    validated_at       = NOW(),
    payment_status     = CASE WHEN p_payment_amount IS NOT NULL THEN 'paid' ELSE payment_status END,
    payment_date       = CASE WHEN p_payment_amount IS NOT NULL THEN NOW() ELSE payment_date END,
    payment_amount     = COALESCE(p_payment_amount, payment_amount),
    payment_reference  = COALESCE(p_payment_reference, payment_reference),
    max_cases          = NULL,
    max_clients        = NULL,
    max_documents      = NULL,
    max_invoices       = NULL,
    suspension_reason  = NULL,
    updated_at         = NOW()
  WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

-- Fonction: bloquer un compte
CREATE OR REPLACE FUNCTION block_account(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    account_status    = 'blocked',
    validated_by      = p_admin_id,
    validated_at      = NOW(),
    suspension_reason = p_reason,
    updated_at        = NOW()
  WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

-- Fonction: suspendre les trials expirés (a appeler via cron ou manuellement)
DROP FUNCTION IF EXISTS suspend_expired_trials();
CREATE OR REPLACE FUNCTION suspend_expired_trials()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE profiles
  SET 
    account_status    = 'suspended',
    suspension_reason = 'Essai gratuit expire. Contactez l''administrateur pour activer votre compte.',
    updated_at        = NOW()
  WHERE account_status = 'trial'
    AND trial_ends_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Verification
SELECT 'Vue pending_accounts' AS object, COUNT(*) AS rows FROM pending_accounts
UNION ALL
SELECT 'Vue expired_trials',  COUNT(*) FROM expired_trials;
