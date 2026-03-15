-- Script de test pour vérifier la création de dossiers

-- 1. Vérifier la structure de la table cases
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cases'
ORDER BY ordinal_position;

-- 2. Vérifier les utilisateurs actifs
SELECT id, email, first_name, last_name, profession, is_active, created_at
FROM profiles
WHERE is_active = true
ORDER BY created_at DESC;

-- 3. Vérifier tous les dossiers créés
SELECT 
  c.id,
  c.user_id,
  p.email as user_email,
  p.first_name || ' ' || p.last_name as user_name,
  c.title,
  c.client_name,
  c.description,
  c.status,
  c.created_at,
  c.updated_at
FROM cases c
LEFT JOIN profiles p ON c.user_id = p.id
ORDER BY c.created_at DESC;

-- 4. Compter les dossiers par utilisateur
SELECT 
  p.email,
  p.first_name || ' ' || p.last_name as user_name,
  COUNT(c.id) as nombre_dossiers
FROM profiles p
LEFT JOIN cases c ON p.id = c.user_id
WHERE p.is_active = true
GROUP BY p.id, p.email, p.first_name, p.last_name
ORDER BY nombre_dossiers DESC;

-- 5. Vérifier l'isolation : Dossiers de l'Avocat Habib Belkacemi
SELECT id, title, client_name, status, created_at
FROM cases
WHERE user_id = 'fa4ef014-f3e2-496f-b341-ea427e1d2bf2'
ORDER BY created_at DESC;

-- 6. Vérifier l'isolation : Dossiers de l'Avocat Sara Khelifi
SELECT id, title, client_name, status, created_at
FROM cases
WHERE user_id = '3ba9195c-8cdb-4f8c-b682-73d172cf4f17'
ORDER BY created_at DESC;

-- 7. Vérifier l'isolation : Dossiers de l'Avocat Ahmed Benali
SELECT id, title, client_name, status, created_at
FROM cases
WHERE user_id = '46c84e7f-c0ad-4fcb-abb0-270539922880'
ORDER BY created_at DESC;

-- 8. Vérifier les policies RLS sur la table cases
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'cases'
ORDER BY policyname;

-- 9. Vérifier que RLS est activé sur la table cases
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'cases';

-- 10. Test d'insertion manuelle (pour debug)
-- Remplacer USER_ID_ICI par l'ID d'un utilisateur réel
/*
INSERT INTO cases (user_id, title, client_name, description, status)
VALUES (
  'fa4ef014-f3e2-496f-b341-ea427e1d2bf2',  -- Habib Belkacemi
  'Test Dossier SQL',
  'Client Test',
  'Description test',
  'active'
)
RETURNING *;
*/
