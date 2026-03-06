-- ============================================
-- SOLUTION DÉFINITIVE: Trigger Automatique pour Création de Profil
-- ============================================
-- Ce trigger crée automatiquement le profil après l'inscription
-- Il s'exécute avec les privilèges du système, contournant RLS
-- ============================================

-- 1. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Créer la fonction qui sera appelée par le trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- Important: s'exécute avec les privilèges du créateur
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insérer le profil avec les données de auth.users
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
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'profession', 'avocat'),
    NEW.raw_user_meta_data->>'registration_number',
    NEW.raw_user_meta_data->>'organization_name',
    NEW.raw_user_meta_data->>'phone_number',
    false, -- is_admin
    false, -- is_active (en attente de validation)
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
    NEW.id,
    'free',
    'pending',
    0,
    5,
    3,
    false, -- is_active (en attente de validation)
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas la création de l'utilisateur
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Créer le trigger sur auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Vérifier que le trigger est créé
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
-- trigger_name: on_auth_user_created
-- event_manipulation: INSERT
-- event_object_table: users
-- action_statement: EXECUTE FUNCTION public.handle_new_user()
-- ============================================

-- ✅ Après avoir exécuté ce script:
-- 1. Le profil sera créé AUTOMATIQUEMENT après l'inscription
-- 2. Plus besoin d'insérer manuellement depuis le client
-- 3. Pas d'erreur 401 car le trigger a les privilèges système
-- ============================================
