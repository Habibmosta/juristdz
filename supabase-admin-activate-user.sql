-- ============================================
-- FONCTION ADMIN: ACTIVER L'EMAIL D'UN UTILISATEUR
-- ============================================
-- Date: 8 Mars 2026
-- Description: Permet à l'admin d'activer manuellement l'email d'un utilisateur
-- ============================================

-- Fonction pour activer l'email d'un utilisateur
CREATE OR REPLACE FUNCTION admin_activate_user_email(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_user_email TEXT;
BEGIN
  -- Vérifier que l'utilisateur existe
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_user_email IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Utilisateur introuvable'
    );
  END IF;
  
  -- Mettre à jour auth.users pour confirmer l'email
  UPDATE auth.users
  SET 
    email_confirmed_at = NOW(),
    confirmation_token = ''
  WHERE id = p_user_id;
  
  -- Mettre à jour le profil
  UPDATE profiles
  SET 
    email_verified = true,
    is_active = true,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log de l'action admin
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_user_id,
    details,
    created_at
  ) VALUES (
    auth.uid(), -- L'admin qui effectue l'action
    'activate_email',
    p_user_id,
    json_build_object(
      'email', v_user_email,
      'activated_at', NOW()
    ),
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Email activé avec succès',
    'user_email', v_user_email,
    'activated_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erreur lors de l''activation: ' || SQLERRM
    );
END;
$$;

-- ============================================
-- TABLE POUR LOGGER LES ACTIONS ADMIN
-- ============================================

CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- RLS pour admin_actions
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Admins can view all admin actions" ON admin_actions;
DROP POLICY IF EXISTS "Admins can create admin actions" ON admin_actions;

-- Seuls les admins peuvent voir les logs
CREATE POLICY "Admins can view all admin actions"
  ON admin_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.profession = 'admin'
    )
  );

-- Seuls les admins peuvent créer des logs
CREATE POLICY "Admins can create admin actions"
  ON admin_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.profession = 'admin'
    )
  );

-- ============================================
-- FONCTION POUR DÉSACTIVER UN UTILISATEUR
-- ============================================

CREATE OR REPLACE FUNCTION admin_deactivate_user(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_user_email TEXT;
BEGIN
  -- Vérifier que l'utilisateur existe
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_user_email IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Utilisateur introuvable'
    );
  END IF;
  
  -- Désactiver le profil
  UPDATE profiles
  SET 
    is_active = false,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Suspendre l'abonnement
  UPDATE subscriptions
  SET 
    status = 'suspended',
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log de l'action admin
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_user_id,
    details,
    created_at
  ) VALUES (
    auth.uid(),
    'deactivate_user',
    p_user_id,
    json_build_object(
      'email', v_user_email,
      'deactivated_at', NOW()
    ),
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Utilisateur désactivé avec succès',
    'user_email', v_user_email
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erreur lors de la désactivation: ' || SQLERRM
    );
END;
$$;

-- ============================================
-- FONCTION POUR RÉACTIVER UN UTILISATEUR
-- ============================================

CREATE OR REPLACE FUNCTION admin_reactivate_user(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_user_email TEXT;
BEGIN
  -- Vérifier que l'utilisateur existe
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_user_email IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Utilisateur introuvable'
    );
  END IF;
  
  -- Réactiver le profil
  UPDATE profiles
  SET 
    is_active = true,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Réactiver l'abonnement
  UPDATE subscriptions
  SET 
    status = 'active',
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log de l'action admin
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_user_id,
    details,
    created_at
  ) VALUES (
    auth.uid(),
    'reactivate_user',
    p_user_id,
    json_build_object(
      'email', v_user_email,
      'reactivated_at', NOW()
    ),
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Utilisateur réactivé avec succès',
    'user_email', v_user_email
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erreur lors de la réactivation: ' || SQLERRM
    );
END;
$$;

-- ============================================
-- VUE POUR LES UTILISATEURS NON VÉRIFIÉS
-- ============================================

CREATE OR REPLACE VIEW v_unverified_users AS
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  p.first_name,
  p.last_name,
  p.profession,
  p.email_verified,
  p.is_active,
  EXTRACT(DAY FROM (NOW() - u.created_at)) as days_since_registration
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email_confirmed_at IS NULL
  OR p.email_verified = false
ORDER BY u.created_at DESC;

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON FUNCTION admin_activate_user_email IS 'Permet à un admin d''activer manuellement l''email d''un utilisateur';
COMMENT ON FUNCTION admin_deactivate_user IS 'Permet à un admin de désactiver un utilisateur';
COMMENT ON FUNCTION admin_reactivate_user IS 'Permet à un admin de réactiver un utilisateur';
COMMENT ON TABLE admin_actions IS 'Log de toutes les actions effectuées par les admins';
COMMENT ON VIEW v_unverified_users IS 'Liste des utilisateurs dont l''email n''est pas vérifié';

-- ============================================
-- EXEMPLES D'UTILISATION
-- ============================================

/*

-- Activer l'email d'un utilisateur
SELECT admin_activate_user_email('user-id-here');

-- Désactiver un utilisateur
SELECT admin_deactivate_user('user-id-here');

-- Réactiver un utilisateur
SELECT admin_reactivate_user('user-id-here');

-- Voir les utilisateurs non vérifiés
SELECT * FROM v_unverified_users;

-- Voir les actions admin récentes
SELECT 
  aa.action_type,
  aa.created_at,
  p_admin.email as admin_email,
  p_target.email as target_user_email,
  aa.details
FROM admin_actions aa
LEFT JOIN profiles p_admin ON aa.admin_id = p_admin.id
LEFT JOIN profiles p_target ON aa.target_user_id = p_target.id
ORDER BY aa.created_at DESC
LIMIT 50;

*/
