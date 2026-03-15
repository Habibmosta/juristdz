-- ═══════════════════════════════════════════════════════════════════════════
-- CRÉATION DE LA TABLE ET DU BUCKET POUR LES DOCUMENTS DE DOSSIERS
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Créer la table case_documents
CREATE TABLE IF NOT EXISTS public.case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Informations du fichier
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT,
  
  -- Métadonnées
  description TEXT,
  document_type TEXT, -- 'contract', 'evidence', 'correspondence', 'court_document', 'other'
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON public.case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_user_id ON public.case_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_created_at ON public.case_documents(created_at DESC);

-- 2. Activer RLS (Row Level Security)
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;

-- 3. Politique RLS: Les utilisateurs peuvent voir leurs propres documents
CREATE POLICY "Users can view their own case documents"
  ON public.case_documents
  FOR SELECT
  USING (user_id = auth.uid());

-- 4. Politique RLS: Les utilisateurs peuvent insérer leurs propres documents
CREATE POLICY "Users can insert their own case documents"
  ON public.case_documents
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 5. Politique RLS: Les utilisateurs peuvent supprimer leurs propres documents
CREATE POLICY "Users can delete their own case documents"
  ON public.case_documents
  FOR DELETE
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- CRÉATION DU BUCKET DE STOCKAGE (À EXÉCUTER DANS SUPABASE DASHBOARD)
-- ═══════════════════════════════════════════════════════════════════════════

-- IMPORTANT: Cette partie doit être exécutée dans le Dashboard Supabase
-- Allez dans Storage > Create a new bucket
-- Nom du bucket: case-documents
-- Public: Non (privé)
-- File size limit: 50 MB
-- Allowed MIME types: Tous les types de fichiers

-- Ou exécutez ce code SQL dans l'éditeur SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('case-documents', 'case-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Politique de stockage: Les utilisateurs peuvent uploader leurs fichiers
CREATE POLICY "Users can upload case documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'case-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Politique de stockage: Les utilisateurs peuvent voir leurs fichiers
CREATE POLICY "Users can view their case documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'case-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Politique de stockage: Les utilisateurs peuvent supprimer leurs fichiers
CREATE POLICY "Users can delete their case documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'case-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

-- Vérifier que la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'case_documents'
);

-- Vérifier que le bucket existe
SELECT * FROM storage.buckets WHERE id = 'case-documents';
