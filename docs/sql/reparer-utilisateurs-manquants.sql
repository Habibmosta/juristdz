-- ============================================
-- RÉPARER LES UTILISATEURS MANQUANTS
-- ============================================
-- Crée les profils et abonnements pour les utilisateurs qui n'en ont pas
-- ============================================

-- Fonction pour réparer un utilisateur spécifique
CREATE OR REPLACE FUNCTION repair_user(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_profile_exists BOOLEAN;
  v_subscription_exists BOOLEAN;
  v_plan TEXT := 'free';
  v_status TEXT := 'active';
  v_trial_ends_at TIMESTAMPTZ := NULL;
BEGIN
  -- Récupérer l'utilisateur
  SELECT * INTO v_user
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_user IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Utilisateur introuvable'
    );
  END IF;
  
  -- Vérifier si le profil existe
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id) INTO v_profile_exists;
  
  -- Vérifier si l'abonnement existe
  SELECT EXISTS(SELECT 1 FROM subscriptions WHERE user_id = p_user_id) INTO v_subscription_exists;
  
  -- Créer le profil s'il n'existe pas
  IF NOT v_profile_exists THEN
    INSERT INTO profiles (id, email, first_name, last_name, profession, email_verified)
    VALUES (
      v_user.id,
      v_user.email,
      COALESCE((v_user.raw_user_meta_data->>'first_name')::text, ''),
      COALESCE((v_user.raw_user_meta_data->>'last_name')::text, ''),
      COALESCE((v_user.raw_user_meta_data->>'profession')::text, 'avocat'),
      v_user.email_confirmed_at IS NOT NULL
    );
    RAISE NOTICE 'Profil créé pour %', v_user.email;
  ELSE
    -- Mettre à jour email_verified si l'email est confirmé
    IF v_user.email_confirmed_at IS NOT NULL THEN
      UPDATE profiles
      SET email_verified = true
      WHERE id = p_user_id AND email_verified = false;
    END IF;
  END IF;
  
  -- Déterminer le plan depuis les métadonnées
  BEGIN
    v_plan := COALESCE((v_user.raw_user_meta_data->>'plan')::text, 'free');
    IF v_plan IN ('pro', 'cabinet') THEN
      v_status := 'trial';
      v_trial_ends_at := NOW() + INTERVAL '7 days';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_plan := 'free';
      v_status := 'active';
  END;
  
  -- Créer l'abonnement s'il n'existe pas
  IF NOT v_subscription_exists THEN
    INSERT INTO subscriptions (user_id, plan, status, trial_ends_at)
    VALUES (v_user.id, v_plan, v_status, v_trial_ends_at);
    RAISE NOTICE 'Abonnement créé pour % avec plan %', v_user.email, v_plan;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Utilisateur réparé',
    'email', v_user.email,
    'profile_created', NOT v_profile_exists,
    'subscription_created', NOT v_subscription_exists,
    'plan', v_plan
  );
END;
$$;

-- Réparer TOUS les utilisateurs manquants automatiquement
DO $$
DECLARE
  v_user RECORD;
  v_result JSON;
  v_count INTEGER := 0;
BEGIN
  -- Pour chaque utilisateur sans profil ou sans abonnement
  FOR v_user IN (
    SELECT DISTINCT u.id, u.email
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    LEFT JOIN subscriptions s ON u.id = s.user_id
    WHERE p.id IS NULL OR s.user_id IS NULL
  ) LOOP
    -- Réparer l'utilisateur
    SELECT repair_user(v_user.id) INTO v_result;
    v_count := v_count + 1;
    RAISE NOTICE 'Réparé: %', v_user.email;
  END LOOP;
  
  RAISE NOTICE '✅ % utilisateur(s) réparé(s)', v_count;
END $$;

-- Vérifier le résultat
SELECT 
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profile,
  COUNT(s.user_id) as users_with_subscription,
  COUNT(*) - COUNT(p.id) as missing_profiles,
  COUNT(*) - COUNT(s.user_id) as missing_subscriptions
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN subscriptions s ON u.id = s.user_id;
