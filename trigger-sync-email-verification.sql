-- ============================================
-- TRIGGER: SYNCHRONISATION AUTOMATIQUE EMAIL VÉRIFIÉ
-- ============================================
-- Date: 8 Mars 2026
-- Description: Synchronise automatiquement email_verified dans profiles 
--              quand email_confirmed_at change dans auth.users
-- ============================================

-- Fonction trigger pour synchroniser la vérification email
CREATE OR REPLACE FUNCTION sync_email_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si l'email vient d'être confirmé
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Mettre à jour le profil
    UPDATE profiles
    SET 
      email_verified = true,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

-- Créer le trigger sur auth.users
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION sync_email_verification();

-- Commentaire
COMMENT ON FUNCTION sync_email_verification IS 
  'Synchronise automatiquement email_verified dans profiles quand email_confirmed_at change dans auth.users';

-- ============================================
-- TEST DU TRIGGER
-- ============================================

/*
-- Pour tester, créer un utilisateur de test et confirmer son email
-- Le profil devrait automatiquement être mis à jour

-- 1. Créer un utilisateur (via l'interface normale)
-- 2. Simuler la confirmation d'email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'test@example.com';

-- 3. Vérifier que le profil a été mis à jour
SELECT email_verified FROM profiles WHERE email = 'test@example.com';
-- Résultat attendu: true
*/
