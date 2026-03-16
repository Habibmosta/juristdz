-- ============================================================
-- FIX COMPLET: Trigger création profil + subscription
-- À exécuter dans Supabase SQL Editor
-- Idempotent: peut être exécuté plusieurs fois sans risque
-- ============================================================

-- ÉTAPE 1: Supprimer l'ancien trigger et fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ÉTAPE 2: Créer la fonction complète
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_plan TEXT;
  v_trial_days INT := 7;
  v_trial_end TIMESTAMPTZ;
BEGIN
  -- Récupérer le plan choisi (défaut: free)
  v_plan := COALESCE(NEW.raw_user_meta_data->>'plan', 'free');
  v_trial_end := NOW() + (v_trial_days || ' days')::INTERVAL;

  -- -------------------------------------------------------
  -- Insérer le profil
  -- -------------------------------------------------------
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    profession,
    role,
    registration_number,
    organization_name,
    phone_number,
    subscription_plan,
    account_status,
    is_admin,
    is_active,
    trial_ends_at,
    payment_status,
    credits_remaining,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'profession', 'avocat'),
    COALESCE(NEW.raw_user_meta_data->>'profession', 'avocat'),
    NEW.raw_user_meta_data->>'registration_number',
    NEW.raw_user_meta_data->>'organization_name',
    NEW.raw_user_meta_data->>'phone_number',
    v_plan,
    'trial',        -- account_status: trial par défaut
    false,          -- is_admin
    true,           -- is_active: actif dès l'inscription
    v_trial_end,    -- trial_ends_at: 7 jours
    'pending',      -- payment_status
    CASE v_plan
      WHEN 'pro'     THEN 500
      WHEN 'cabinet' THEN 9999
      ELSE 50
    END,            -- credits_remaining selon le plan
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email          = EXCLUDED.email,
    updated_at     = NOW();

  -- -------------------------------------------------------
  -- Insérer la subscription
  -- -------------------------------------------------------
  INSERT INTO public.subscriptions (
    user_id,
    plan,
    status,
    trial_ends_at,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    v_plan,
    'trial',
    v_trial_end,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan       = EXCLUDED.plan,
    updated_at = NOW();

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- ÉTAPE 3: Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ÉTAPE 4: Réparer les utilisateurs existants sans profil
-- (ceux créés avant que le trigger soit en place)
-- ============================================================
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  profession,
  role,
  subscription_plan,
  account_status,
  is_admin,
  is_active,
  trial_ends_at,
  payment_status,
  credits_remaining,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', ''),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  COALESCE(u.raw_user_meta_data->>'profession', 'avocat'),
  COALESCE(u.raw_user_meta_data->>'profession', 'avocat'),
  COALESCE(u.raw_user_meta_data->>'plan', 'free'),
  'trial',
  false,
  true,
  NOW() + INTERVAL '7 days',
  'pending',
  50,
  u.created_at,
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Réparer aussi les subscriptions manquantes
INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at, is_active, created_at, updated_at)
SELECT
  p.id,
  COALESCE(p.subscription_plan, 'free'),
  'trial',
  COALESCE(p.trial_ends_at, NOW() + INTERVAL '7 days'),
  true,
  NOW(),
  NOW()
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- VÉRIFICATION
-- ============================================================
SELECT
  'Trigger créé' AS check,
  COUNT(*) AS count
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'

UNION ALL

SELECT
  'Utilisateurs auth sans profil' AS check,
  COUNT(*) AS count
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)

UNION ALL

SELECT
  'Profils total' AS check,
  COUNT(*) AS count
FROM public.profiles;
