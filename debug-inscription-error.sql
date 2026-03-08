-- ============================================
-- DEBUG: Vérifier l'erreur d'inscription
-- ============================================

-- 1. Vérifier que la fonction existe
SELECT 
  proname as function_name,
  prosrc as function_code
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 2. Vérifier que le trigger existe
SELECT 
  tgname as trigger_name,
  tgtype,
  tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 3. Vérifier la structure de la table subscriptions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 4. Vérifier les contraintes
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'subscriptions'::regclass;

-- 5. Tester manuellement la création d'un abonnement
-- (Remplacer 'test-user-id' par un vrai UUID)
/*
INSERT INTO subscriptions (user_id, plan, status, trial_ends_at)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'pro',
  'trial',
  NOW() + INTERVAL '7 days'
);
*/
