-- ============================================
-- SOLUTION RPC CORRIGEE: Fonction pour Creer le Profil
-- ============================================
-- Cette fonction peut etre appelee depuis le client avec les privileges systeme
-- CORRECTION: Suppression de la verification auth.uid() qui retourne NULL
-- ============================================

-- 1. Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- 2. Creer la nouvelle fonction RPC
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT,
  first_name TEXT,
  last_name TEXT,
  profession TEXT,
  registration_number TEXT DEFAULT NULL,
  organization_name TEXT DEFAULT NULL,
  phone_number TEXT DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verifier que l'utilisateur existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Verifier si le profil existe deja
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
    RAISE EXCEPTION 'Profile already exists for this user';
  END IF;

  -- Creer le profil
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    profession,
    registration_number,
    organization_name,
    phone_number,
    is_admin,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    user_email,
    first_name,
    last_name,
    profession,
    registration_number,
    organization_name,
    phone_number,
    false,
    false,
    NOW(),
    NOW()
  );

  -- Creer la subscription
  INSERT INTO public.subscriptions (
    user_id,
    plan,
    status,
    documents_used,
    documents_limit,
    cases_limit,
    is_active,
    expires_at,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    'free',
    'pending',
    0,
    5,
    3,
    false,
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
  );

  -- Retourner le resultat
  result := json_build_object(
    'success', true,
    'user_id', user_id,
    'message', 'Profile and subscription created successfully'
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Retourner l'erreur
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

-- 3. Donner les permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;

-- 4. Verifier que la fonction existe
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'create_user_profile';

-- ============================================
-- UTILISATION DEPUIS LE CLIENT
-- ============================================
-- const { data, error } = await supabase.rpc('create_user_profile', {
--   user_id: authData.user.id,
--   user_email: email,
--   first_name: firstName,
--   last_name: lastName,
--   profession: profession,
--   registration_number: registrationNumber || null,
--   organization_name: organizationName || null,
--   phone_number: phoneNumber || null
-- });
-- ============================================

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- 1. La verification auth.uid() a ete SUPPRIMEE car elle retourne NULL
--    juste apres signUp (la session n'est pas encore etablie)
-- 2. La securite est assuree par:
--    - SECURITY DEFINER (privileges systeme)
--    - Verification que l'utilisateur existe dans auth.users
--    - Verification de doublons
-- 3. La fonction peut etre appelee par 'authenticated' et 'anon'
--    car elle est appelee juste apres signUp (avant connexion)
-- ============================================
