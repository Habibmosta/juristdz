-- ============================================
-- VÉRIFIER L'UTILISATEUR SPÉCIFIQUE
-- ============================================

-- Vérifier dans auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmation_sent_at,
  confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'habibo.belkacemio@gmail.com';

-- Vérifier dans profiles
SELECT 
  id,
  email,
  first_name,
  last_name,
  email_verified,
  is_active,
  created_at
FROM profiles
WHERE email = 'habibo.belkacemio@gmail.com';

-- Vérifier dans subscriptions
SELECT 
  user_id,
  plan,
  status,
  trial_ends_at,
  is_active,
  created_at
FROM subscriptions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'habibo.belkacemio@gmail.com');
