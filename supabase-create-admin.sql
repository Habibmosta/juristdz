-- ═══════════════════════════════════════════════════════════════════════════
-- CRÉER LE COMPTE ADMIN
-- ═══════════════════════════════════════════════════════════════════════════
-- Remplacer 'VOTRE_ID_ICI' par l'ID réel de l'utilisateur créé dans auth.users
-- ═══════════════════════════════════════════════════════════════════════════

-- D'abord, modifier la contrainte pour accepter 'admin' comme profession
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_profession_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_profession_check 
CHECK (profession IN ('admin', 'avocat', 'notaire', 'huissier', 'magistrat', 'etudiant', 'juriste_entreprise'));

-- Créer le profil admin avec profession = 'admin'
INSERT INTO public.profiles (id, email, first_name, last_name, profession, is_admin)
VALUES (
  'VOTRE_ID_ICI',
  'admin@juristdz.com',
  'Admin',
  'JuristDZ',
  'admin',
  true
);

-- Créer l'abonnement admin (illimité)
INSERT INTO public.subscriptions (user_id, plan, status, documents_limit, cases_limit)
VALUES (
  'VOTRE_ID_ICI',
  'pro',
  'active',
  -1,
  -1
);

-- Vérifier que tout est créé
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.profession,
  p.is_admin,
  s.plan,
  s.documents_limit
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.id
WHERE p.email = 'admin@juristdz.com';

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN
-- ═══════════════════════════════════════════════════════════════════════════
-- Résultat attendu:
-- profession = 'admin'
-- is_admin = true
-- documents_limit = -1 (illimité)
-- ═══════════════════════════════════════════════════════════════════════════
