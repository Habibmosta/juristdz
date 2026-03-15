-- ═══════════════════════════════════════════════════════════════════════════
-- CONFIGURATION DU BUCKET POUR ACCÈS PUBLIC
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Mettre à jour le bucket pour le rendre PUBLIC
UPDATE storage.buckets 
SET public = true
WHERE id = 'case-documents';

-- 2. Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Anyone authenticated can upload to case-documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone authenticated can view case-documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone authenticated can delete from case-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their case documents" ON storage.objects;

-- 3. Créer des politiques PUBLIQUES simples
CREATE POLICY "Public Access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'case-documents');

CREATE POLICY "Authenticated users can upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'case-documents');

CREATE POLICY "Authenticated users can update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'case-documents');

CREATE POLICY "Authenticated users can delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'case-documents');

-- 4. Vérifier la configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'case-documents';

-- 5. Vérifier les politiques
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND (policyname LIKE '%case-documents%' OR policyname LIKE '%Public Access%' OR policyname LIKE '%Authenticated%');
