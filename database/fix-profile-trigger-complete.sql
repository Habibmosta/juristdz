-- ============================================================
-- FIX COMPLET: Trigger creation profil
-- A executer dans Supabase SQL Editor
-- Idempotent: peut etre execute plusieurs fois sans risque
-- ============================================================

-- ETAPE 1: Supprimer l'ancien trigger et fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ETAPE 2: Creer la fonction
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    profession,
    registration_number,
    organization_name,
    phone_number,
    account_status,
    is_admin,
    is_active,
    email_verified,
    mfa_enabled,
    trial_started_at,
    trial_ends_at,
    payment_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'profession', 'avocat'),
    NEW.raw_user_meta_data->>'registration_number',
    NEW.raw_user_meta_data->>'organization_name',
    NEW.raw_user_meta_data->>'phone_number',
    'pending',
    false,
    true,
    false,
    false,
    NOW(),
    NOW() + INTERVAL '7 days',
    'pending',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- ETAPE 3: Creer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ETAPE 4: Reparer les utilisateurs existants sans profil
-- ============================================================
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  profession,
  account_status,
  is_admin,
  is_active,
  email_verified,
  mfa_enabled,
  trial_started_at,
  trial_ends_at,
  payment_status,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', ''),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  COALESCE(u.raw_user_meta_data->>'profession', 'avocat'),
  'pending',
  false,
  true,
  false,
  false,
  NOW(),
  NOW() + INTERVAL '7 days',
  'pending',
  u.created_at,
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'Trigger cree' AS check, COUNT(*) AS count
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'

UNION ALL

SELECT 'Utilisateurs sans profil' AS check, COUNT(*) AS count
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)

UNION ALL

SELECT 'Profils total' AS check, COUNT(*) AS count
FROM public.profiles;
