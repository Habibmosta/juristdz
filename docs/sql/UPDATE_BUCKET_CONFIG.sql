-- Mettre à jour la configuration du bucket
UPDATE storage.buckets 
SET 
  file_size_limit = 52428800,  -- 50 MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
  ]::text[]
WHERE id = 'case-documents';

-- Vérifier
SELECT * FROM storage.buckets WHERE id = 'case-documents';
