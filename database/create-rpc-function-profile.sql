-- ============================================
-- SOLUTION ALTERNATIVE: Fonction RPC pour Créer le Profil
-- ============================================
-- Cette fonction peut être appelée depuis le client avec les privilèges système
-- ============================================

-- 1. Créer la fonction RPC
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
SECURITY DEFINER -- Important: s'exécute avec les privilèges du créateur
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  -- Vérifier que l'utilisateur appelant est bien celui qui crée son profil
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only create your own profile';
  END IF;

  -- Vérifier si le profil existe déjà
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
    RAISE EXCEPTION 'Profile already exists for this user';
  END IF;

  -- Créer le profil
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

  -- Créer la subscription
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

  -- Retourner le résultat
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

-- 2. Donner les permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;

-- 3. Tester la fonction
SELECT public.create_user_profile(
  auth.uid(),
  'test@example.com',
  'Test',
  'User',
  'avocat',
  NULL,
  NULL,
  NULL
);

-- ============================================
-- UTILISATION DEPUIS LE CLIENT
-- ============================================
-- const { data, error } = await supabase.rpc('create_user_profile', {
--   user_id: authData.user.id,
--   user_email: email,
--   first_name: firstName,
--   last_name: lastName,
--   profession: profession,
--   registration_number: registrationNumber,
--   organization_name: organizationName,
--   phone_number: phoneNumber
-- });
-- ============================================
