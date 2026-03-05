-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT SIMPLIFIÉ POUR CRÉER LE BUCKET ET LA TABLE
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Créer le bucket de stockage (si n'existe pas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-documents', 
  'case-documents', 
  false,  -- Privé
  52428800,  -- 50 MB
  NULL  -- Tous les types de fichiers
)
ON CONFLICT (id) DO NOTHING;

-- 2. Créer la table case_documents (si n'existe pas)
CREATE TABLE IF NOT EXISTS public.case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT,
  description TEXT,
  document_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON public.case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_user_id ON public.case_documents(user_id);

-- 4. Activer RLS
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer les anciennes politiques (si existent)
DROP POLICY IF EXISTS "Users can view their own case documents" ON public.case_documents;
DROP POLICY IF EXISTS "Users can insert their own case documents" ON public.case_documents;
DROP POLICY IF EXISTS "Users can delete their own case documents" ON public.case_documents;

-- 6. Créer les politiques RLS pour la table
CREATE POLICY "Users can view their own case documents"
  ON public.case_documents
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own case documents"
  ON public.case_documents
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own case documents"
  ON public.case_documents
  FOR DELETE
  USING (user_id = auth.uid());

-- 7. Supprimer les anciennes politiques de stockage (si existent)
DROP POLICY IF EXISTS "Users can upload case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their case documents" ON storage.objects;

-- 8. Créer les politiques de stockage (PUBLIQUES pour simplifier)
CREATE POLICY "Anyone authenticated can upload to case-documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'case-documents');

CREATE POLICY "Anyone authenticated can view case-documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'case-documents');

CREATE POLICY "Anyone authenticated can delete from case-documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'case-documents');

-- 9. Vérification
SELECT 'Bucket créé:' as status, * FROM storage.buckets WHERE id = 'case-documents';
SELECT 'Table créée:' as status, COUNT(*) as count FROM public.case_documents;
