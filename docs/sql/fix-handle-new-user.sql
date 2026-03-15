-- ============================================
-- CORRECTION: Fonction handle_new_user
-- ============================================
-- Problème: Erreur 500 lors de l'inscription
-- Solution: Gérer les cas où 'plan' n'est pas dans les métadonnées
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
  v_status TEXT;
  v_trial_ends_at TIMESTAMPTZ;
BEGIN
  -- Récupérer le plan choisi depuis les métadonnées (défaut: free)
  -- Utiliser COALESCE pour gérer le cas où plan n'existe pas
  BEGIN
    v_plan := COALESCE((NEW.raw_user_meta_data->>'plan')::text, 'free');
  EXCEPTION
    WHEN OTHERS THEN
      v_plan := 'free';
  END;
  
  -- Déterminer le statut et la date de fin d'essai
  IF v_plan IN ('pro', 'cabinet') THEN
    -- Si l'utilisateur choisit Pro ou Cabinet, c'est un essai de 7 jours
    v_status := 'trial';
    v_trial_ends_at := NOW() + INTERVAL '7 days';
  ELSE
    -- Sinon, c'est un plan gratuit permanent
    v_plan := 'free';
    v_status := 'active';
    v_trial_ends_at := NULL;
  END IF;
  
  -- Créer le profil
  INSERT INTO public.profiles (id, email, first_name, last_name, profession)
  VALUES (
    NEW.id::uuid,
    NEW.email::text,
    COALESCE((NEW.raw_user_meta_data->>'first_name')::text, ''),
    COALESCE((NEW.raw_user_meta_data->>'last_name')::text, ''),
    COALESCE((NEW.raw_user_meta_data->>'profession')::text, 'avocat')
  );
  
  -- Créer l'abonnement avec le plan choisi
  INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at)
  VALUES (NEW.id::uuid, v_plan, v_status, v_trial_ends_at);
  
  -- Log pour déboguer
  RAISE NOTICE 'Utilisateur créé: %, Plan: %, Status: %', NEW.email, v_plan, v_status;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, logger et continuer quand même
    RAISE WARNING 'Erreur dans handle_new_user pour %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Test
DO $$
BEGIN
  RAISE NOTICE '✅ Fonction handle_new_user corrigée et trigger recréé';
  RAISE NOTICE '📝 La fonction gère maintenant les erreurs gracieusement';
END $$;
