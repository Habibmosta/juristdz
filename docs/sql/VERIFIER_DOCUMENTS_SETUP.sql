-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT DE VÉRIFICATION COMPLÈTE
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Vérifier que le bucket existe
SELECT 
  'BUCKET' as type,
  id, 
  name, 
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_types_count
FROM storage.buckets 
WHERE id = 'case-documents';

-- 2. Vérifier que la table existe
SELECT 
  'TABLE' as type,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'case_documents'
ORDER BY ordinal_position;

-- 3. Vérifier les politiques RLS de la table
SELECT 
  'TABLE POLICY' as type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'case_documents';

-- 4. Vérifier les politiques de stockage
SELECT 
  'STORAGE POLICY' as type,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%case-documents%';

-- 5. Compter les documents existants
SELECT 
  'DOCUMENTS COUNT' as type,
  COUNT(*) as total_documents
FROM public.case_documents;

-- 6. Tester l'accès (remplacez USER_ID par votre ID utilisateur)
-- SELECT * FROM public.case_documents WHERE user_id = 'VOTRE_USER_ID';
