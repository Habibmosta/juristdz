-- ═══════════════════════════════════════════════════════════════════════════
-- CRÉER LES COMPTES DE TEST
-- ═══════════════════════════════════════════════════════════════════════════
-- Ce script crée 4 comptes de test avec leurs profils et abonnements
-- Vous devez d'abord créer les utilisateurs dans Supabase Authentication
-- ═══════════════════════════════════════════════════════════════════════════

-- INSTRUCTIONS:
-- 1. Aller dans Supabase → Authentication → Users
-- 2. Créer ces 4 utilisateurs (Add user → Create new user):
--    - ahmed.benali@test.dz / test123 (✅ Auto Confirm User)
--    - sarah.khelifi@test.dz / test123 (✅ Auto Confirm User)
--    - mohamed.ziani@test.dz / test123 (✅ Auto Confirm User)
--    - karim.djahid@test.dz / test123 (✅ Auto Confirm User)
-- 3. Copier les IDs de chaque utilisateur
-- 4. Remplacer les IDs ci-dessous
-- 5. Exécuter ce script

-- ═══════════════════════════════════════════════════════════════════════════
-- AVOCAT 1: Ahmed Benali
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.profiles (id, email, first_name, last_name, profession, is_admin)
VALUES (
  'ID_AHMED_BENALI',
  'ahmed.benali@test.dz',
  'Ahmed',
  'Benali',
  'avocat',
  false
);

INSERT INTO public.subscriptions (user_id, plan, status, documents_limit, cases_limit, notes)
VALUES (
  'ID_AHMED_BENALI',
  'free',
  'active',
  5,
  3,
  'Compte de test - Avocat 1'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- AVOCAT 2: Sarah Khelifi
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.profiles (id, email, first_name, last_name, profession, is_admin)
VALUES (
  'ID_SARAH_KHELIFI',
  'sarah.khelifi@test.dz',
  'Sarah',
  'Khelifi',
  'avocat',
  false
);

INSERT INTO public.subscriptions (user_id, plan, status, documents_limit, cases_limit, notes)
VALUES (
  'ID_SARAH_KHELIFI',
  'free',
  'active',
  5,
  3,
  'Compte de test - Avocat 2'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTAIRE: Mohamed Ziani
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.profiles (id, email, first_name, last_name, profession, is_admin)
VALUES (
  'ID_MOHAMED_ZIANI',
  'mohamed.ziani@test.dz',
  'Mohamed',
  'Ziani',
  'notaire',
  false
);

INSERT INTO public.subscriptions (user_id, plan, status, documents_limit, cases_limit, notes)
VALUES (
  'ID_MOHAMED_ZIANI',
  'free',
  'active',
  5,
  3,
  'Compte de test - Notaire'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- HUISSIER: Karim Djahid
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.profiles (id, email, first_name, last_name, profession, is_admin)
VALUES (
  'ID_KARIM_DJAHID',
  'karim.djahid@test.dz',
  'Karim',
  'Djahid',
  'huissier',
  false
);

INSERT INTO public.subscriptions (user_id, plan, status, documents_limit, cases_limit, notes)
VALUES (
  'ID_KARIM_DJAHID',
  'free',
  'active',
  5,
  3,
  'Compte de test - Huissier'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════
-- Vérifier que tous les comptes sont créés
SELECT 
  p.email,
  p.first_name,
  p.last_name,
  p.profession,
  s.plan,
  s.documents_limit,
  s.cases_limit,
  s.notes
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.id
WHERE p.email LIKE '%@test.dz'
ORDER BY p.profession, p.email;

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN
-- ═══════════════════════════════════════════════════════════════════════════
-- Résultat attendu: 4 lignes
-- - 2 avocats (Ahmed, Sarah)
-- - 1 notaire (Mohamed)
-- - 1 huissier (Karim)
-- Tous avec plan = 'free', documents_limit = 5, cases_limit = 3
-- ═══════════════════════════════════════════════════════════════════════════
