-- ============================================
-- ACTIVER COMPLÈTEMENT UN UTILISATEUR
-- ============================================
-- Force l'activation complète d'un utilisateur
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'habibo.belkacemio@gmail.com';
BEGIN
  -- Récupérer l'ID de l'utilisateur
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur % introuvable', v_email;
  END IF;
  
  -- 1. Confirmer l'email dans auth.users
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmation_token = ''
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ Email confirmé dans auth.users';
  
  -- 2. Activer le profil
  UPDATE profiles
  SET 
    email_verified = true,
    is_active = true,
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ Profil activé';
  
  -- 3. Activer l'abonnement
  UPDATE subscriptions
  SET 
    is_active = true,
    updated_at = NOW()
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '✅ Abonnement activé';
  
  -- 4. Vérifier le résultat
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'RÉSULTAT POUR: %', v_email;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ Utilisateur % complètement activé!', v_email;
  RAISE NOTICE '👉 Essayez de vous connecter maintenant';
  
END $$;

-- Afficher l'état complet de l'utilisateur
SELECT 
  'auth.users' as table_name,
  u.email,
  u.email_confirmed_at,
  NULL::text as email_verified,
  NULL::boolean as is_active,
  NULL::text as plan,
  NULL::text as status
FROM auth.users u
WHERE u.email = 'habibo.belkacemio@gmail.com'

UNION ALL

SELECT 
  'profiles' as table_name,
  p.email,
  NULL::timestamptz as email_confirmed_at,
  p.email_verified::text,
  p.is_active,
  NULL::text as plan,
  NULL::text as status
FROM profiles p
WHERE p.email = 'habibo.belkacemio@gmail.com'

UNION ALL

SELECT 
  'subscriptions' as table_name,
  (SELECT email FROM auth.users WHERE id = s.user_id) as email,
  NULL::timestamptz as email_confirmed_at,
  NULL::text as email_verified,
  s.is_active,
  s.plan,
  s.status
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM auth.users WHERE email = 'habibo.belkacemio@gmail.com');
