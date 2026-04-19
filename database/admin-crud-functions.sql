-- ============================================================
-- ADMIN CRUD FUNCTIONS
-- RPCs pour la gestion complète des utilisateurs par l'admin
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- 1. Mettre à jour le profil d'un utilisateur
-- ============================================================
CREATE OR REPLACE FUNCTION admin_update_user_profile(
  p_user_id        UUID,
  p_first_name     TEXT DEFAULT NULL,
  p_last_name      TEXT DEFAULT NULL,
  p_profession     TEXT DEFAULT NULL,
  p_organization   TEXT DEFAULT NULL,
  p_phone          TEXT DEFAULT NULL,
  p_account_status TEXT DEFAULT NULL,
  p_subscription_plan TEXT DEFAULT NULL,
  p_credits        INTEGER DEFAULT NULL,
  p_is_admin       BOOLEAN DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET
    first_name        = COALESCE(p_first_name,        first_name),
    last_name         = COALESCE(p_last_name,         last_name),
    profession        = COALESCE(p_profession,        profession),
    organization_name = COALESCE(p_organization,      organization_name),
    phone_number      = COALESCE(p_phone,             phone_number),
    account_status    = COALESCE(p_account_status,    account_status),
    subscription_plan = COALESCE(p_subscription_plan, subscription_plan),
    credits_remaining = COALESCE(p_credits,           credits_remaining),
    is_admin          = COALESCE(p_is_admin,          is_admin),
    updated_at        = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur introuvable');
  END IF;

  -- Sync subscription table if plan changed
  IF p_subscription_plan IS NOT NULL THEN
    UPDATE subscriptions SET
      plan       = p_subscription_plan,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Profil mis à jour');
END;
$$;

-- ============================================================
-- 2. Supprimer un utilisateur (soft delete)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_delete_user(
  p_user_id UUID,
  p_reason  TEXT DEFAULT 'Supprimé par administrateur'
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Bloquer le compte (soft delete)
  UPDATE profiles SET
    account_status    = 'blocked',
    is_active         = FALSE,
    suspension_reason = p_reason,
    updated_at        = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur introuvable');
  END IF;

  -- Désactiver l'abonnement
  UPDATE subscriptions SET
    status     = 'cancelled',
    is_active  = FALSE,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'Compte désactivé et bloqué');
END;
$$;

-- ============================================================
-- 3. Mettre à jour l'abonnement d'un utilisateur
-- ============================================================
CREATE OR REPLACE FUNCTION admin_update_subscription(
  p_user_id   UUID,
  p_plan      TEXT,
  p_credits   INTEGER DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Update profile
  UPDATE profiles SET
    subscription_plan = p_plan,
    credits_remaining = COALESCE(p_credits, credits_remaining),
    account_status    = 'active',
    updated_at        = NOW()
  WHERE id = p_user_id;

  -- Upsert subscription
  INSERT INTO subscriptions (user_id, plan, status, is_active, credits_remaining, expires_at, updated_at)
  VALUES (p_user_id, p_plan, 'active', TRUE,
          COALESCE(p_credits, CASE p_plan WHEN 'cabinet' THEN 999999 WHEN 'pro' THEN 500 ELSE 50 END),
          COALESCE(p_expires_at, NOW() + INTERVAL '1 year'),
          NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    plan              = EXCLUDED.plan,
    status            = 'active',
    is_active         = TRUE,
    credits_remaining = EXCLUDED.credits_remaining,
    expires_at        = EXCLUDED.expires_at,
    updated_at        = NOW();

  RETURN json_build_object('success', true, 'message', 'Abonnement mis à jour');
END;
$$;

-- ============================================================
-- 4. Activer un compte (account_status → active)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_activate_account(p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE auth.users SET
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at         = NOW()
  WHERE id = p_user_id;

  UPDATE profiles SET
    account_status    = 'active',
    is_active         = TRUE,
    email_verified    = TRUE,
    suspension_reason = NULL,
    updated_at        = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'Compte activé');
END;
$$;

-- ============================================================
-- 5. Suspendre un compte
-- ============================================================
CREATE OR REPLACE FUNCTION admin_suspend_account(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET
    account_status    = 'suspended',
    suspension_reason = COALESCE(p_reason, 'Suspendu par administrateur'),
    updated_at        = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'Compte suspendu');
END;
$$;

-- ============================================================
-- 6. admin_deactivate_user (si pas encore créé)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_deactivate_user(p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET
    is_active  = FALSE,
    updated_at = NOW()
  WHERE id = p_user_id;

  UPDATE subscriptions SET
    is_active  = FALSE,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'Utilisateur désactivé');
END;
$$;

-- ============================================================
-- 7. admin_reactivate_user (si pas encore créé)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_reactivate_user(p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET
    is_active         = TRUE,
    account_status    = 'active',
    suspension_reason = NULL,
    updated_at        = NOW()
  WHERE id = p_user_id;

  UPDATE subscriptions SET
    is_active  = TRUE,
    status     = 'active',
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'Utilisateur réactivé');
END;
$$;

-- ============================================================
-- VÉRIFICATION
-- ============================================================
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'admin_%'
ORDER BY routine_name;
