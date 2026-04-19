-- ============================================================
-- FIX: Compte admin — supprimer les restrictions
-- Remplace 'admin@juristdz.com' par ton email si différent
-- ============================================================

-- 1. Mettre le profil admin en statut actif, illimité
UPDATE profiles
SET
  account_status    = 'active',
  subscription_plan = 'cabinet',
  credits_remaining = 999999,
  trial_ends_at     = NOW() + INTERVAL '10 years',
  payment_status    = 'paid',
  suspension_reason = NULL,
  is_active         = TRUE,
  email_verified    = TRUE,
  max_cases         = NULL,
  max_clients       = NULL,
  max_documents     = NULL,
  max_invoices      = NULL,
  updated_at        = NOW()
WHERE profession = 'admin'
   OR email = 'admin@juristdz.com';

-- 2. Mettre l'abonnement admin en actif illimité
UPDATE subscriptions
SET
  plan              = 'cabinet',
  status            = 'active',
  is_active         = TRUE,
  credits_remaining = 999999,
  expires_at        = NOW() + INTERVAL '10 years',
  trial_ends_at     = NULL,
  updated_at        = NOW()
WHERE user_id IN (
  SELECT id FROM profiles
  WHERE profession = 'admin' OR email = 'admin@juristdz.com'
);

-- 3. Vérification
SELECT
  p.email,
  p.profession,
  p.account_status,
  p.subscription_plan,
  p.credits_remaining,
  p.payment_status,
  s.plan AS sub_plan,
  s.status AS sub_status,
  s.expires_at
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id
WHERE p.profession = 'admin' OR p.email = 'admin@juristdz.com';
