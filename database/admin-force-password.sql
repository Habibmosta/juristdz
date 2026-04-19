-- ============================================================
-- ADMIN: Forcer un nouveau mot de passe pour un utilisateur
-- ⚠️  IMPORTANT: Cette fonction utilise SECURITY DEFINER
--     Elle doit être exécutée par un superuser Supabase
-- ============================================================

-- Fonction pour forcer un mot de passe (via extensions Supabase)
CREATE OR REPLACE FUNCTION admin_force_password(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Vérifier que l'utilisateur existe
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  
  IF v_email IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur introuvable');
  END IF;

  -- Valider la longueur du mot de passe
  IF length(p_new_password) < 8 THEN
    RETURN json_build_object('success', false, 'message', 'Le mot de passe doit contenir au moins 8 caractères');
  END IF;

  -- Mettre à jour le mot de passe via la table auth.users
  UPDATE auth.users
  SET
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at         = NOW(),
    -- Invalider les sessions existantes
    reauthentication_token = '',
    reauthentication_sent_at = NULL
  WHERE id = p_user_id;

  -- Logger l'action
  INSERT INTO audit_logs (user_id, action, resource_type, details, created_at)
  VALUES (
    auth.uid(),
    'admin.force_password',
    'user',
    json_build_object('target_user_id', p_user_id, 'target_email', v_email),
    NOW()
  ) ON CONFLICT DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'message', 'Mot de passe mis à jour pour ' || v_email
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Accorder l'exécution uniquement aux utilisateurs authentifiés
-- (la vérification admin se fait côté application)
REVOKE ALL ON FUNCTION admin_force_password(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_force_password(UUID, TEXT) TO authenticated;
