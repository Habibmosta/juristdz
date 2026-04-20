-- ============================================================
-- ADMIN: Forcer un nouveau mot de passe pour un utilisateur
-- Utilise l'API admin Supabase via une fonction sécurisée
-- ============================================================

-- Activer pgcrypto si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fonction pour forcer un mot de passe
CREATE OR REPLACE FUNCTION admin_force_password(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  
  IF v_email IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur introuvable');
  END IF;

  IF length(p_new_password) < 8 THEN
    RETURN json_build_object('success', false, 'message', 'Le mot de passe doit contenir au moins 8 caractères');
  END IF;

  UPDATE auth.users
  SET
    encrypted_password       = crypt(p_new_password, gen_salt('bf')),
    updated_at               = NOW(),
    reauthentication_token   = '',
    reauthentication_sent_at = NULL
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Mot de passe mis à jour pour ' || v_email
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION admin_force_password(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_force_password(UUID, TEXT) TO authenticated;
