-- ============================================================================
-- JURISTDZ - GESTION DES DOCUMENTS PAR DOSSIER
-- Sprint 1: Base de données et sécurité
-- Date: 03/03/2026
-- ============================================================================

-- ============================================================================
-- 1. TABLE: case_documents
-- ============================================================================
CREATE TABLE IF NOT EXISTS case_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Informations du fichier
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL, -- en bytes
  file_type TEXT NOT NULL, -- 'pdf', 'docx', 'doc', 'jpg', 'png', 'txt', etc.
  mime_type TEXT NOT NULL,
  
  -- Stockage Supabase
  storage_path TEXT NOT NULL, -- chemin complet dans le bucket
  storage_bucket TEXT DEFAULT 'case-documents',
  
  -- Métadonnées et organisation
  category TEXT DEFAULT 'autre', -- 'piece', 'conclusion', 'jugement', 'correspondance', 'contrat', 'autre'
  description TEXT,
  tags TEXT[], -- array de tags pour recherche
  
  -- Versioning (pour futures versions)
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES case_documents(id) ON DELETE SET NULL,
  is_latest_version BOOLEAN DEFAULT true,
  
  -- Audit et dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT fk_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 104857600), -- Max 100MB
  CONSTRAINT valid_category CHECK (category IN ('piece', 'conclusion', 'jugement', 'correspondance', 'contrat', 'autre'))
);

-- ============================================================================
-- 2. INDEX POUR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_user_id ON case_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_category ON case_documents(category);
CREATE INDEX IF NOT EXISTS idx_case_documents_created_at ON case_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_documents_file_type ON case_documents(file_type);
CREATE INDEX IF NOT EXISTS idx_case_documents_tags ON case_documents USING GIN(tags);

-- Index pour recherche full-text sur nom de fichier et description
CREATE INDEX IF NOT EXISTS idx_case_documents_search ON case_documents 
  USING GIN(to_tsvector('french', COALESCE(file_name, '') || ' ' || COALESCE(description, '')));

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres documents
CREATE POLICY "Users can view their own case documents"
  ON case_documents FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Les utilisateurs peuvent insérer leurs propres documents
CREATE POLICY "Users can insert their own case documents"
  ON case_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres documents
CREATE POLICY "Users can update their own case documents"
  ON case_documents FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Les utilisateurs peuvent supprimer leurs propres documents
CREATE POLICY "Users can delete their own case documents"
  ON case_documents FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 4. FONCTION: Mise à jour automatique de updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_case_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_case_documents_updated_at
  BEFORE UPDATE ON case_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_case_documents_updated_at();

-- ============================================================================
-- 5. FONCTION: Statistiques des documents par dossier
-- ============================================================================
CREATE OR REPLACE FUNCTION get_case_document_stats(p_case_id UUID)
RETURNS TABLE (
  total_documents BIGINT,
  total_size_mb NUMERIC,
  documents_by_category JSONB,
  recent_documents JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_documents,
    ROUND((SUM(file_size) / 1048576.0)::NUMERIC, 2) as total_size_mb,
    jsonb_object_agg(
      category, 
      count
    ) as documents_by_category,
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'file_name', file_name,
        'category', category,
        'created_at', created_at
      ) ORDER BY created_at DESC
    ) FILTER (WHERE rn <= 5) as recent_documents
  FROM (
    SELECT 
      cd.*,
      ROW_NUMBER() OVER (ORDER BY cd.created_at DESC) as rn,
      COUNT(*) OVER (PARTITION BY cd.category) as count
    FROM case_documents cd
    WHERE cd.case_id = p_case_id
  ) sub
  GROUP BY true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. FONCTION: Recherche dans les documents
-- ============================================================================
CREATE OR REPLACE FUNCTION search_case_documents(
  p_user_id UUID,
  p_search_query TEXT,
  p_case_id UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  case_id UUID,
  file_name TEXT,
  description TEXT,
  category TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.id,
    cd.case_id,
    cd.file_name,
    cd.description,
    cd.category,
    cd.file_size,
    cd.created_at,
    ts_rank(
      to_tsvector('french', COALESCE(cd.file_name, '') || ' ' || COALESCE(cd.description, '')),
      plainto_tsquery('french', p_search_query)
    ) as relevance
  FROM case_documents cd
  WHERE 
    cd.user_id = p_user_id
    AND (p_case_id IS NULL OR cd.case_id = p_case_id)
    AND (p_category IS NULL OR cd.category = p_category)
    AND (
      cd.file_name ILIKE '%' || p_search_query || '%'
      OR cd.description ILIKE '%' || p_search_query || '%'
      OR p_search_query = ANY(cd.tags)
    )
  ORDER BY relevance DESC, cd.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. VUES UTILES
-- ============================================================================

-- Vue: Documents récents de l'utilisateur
CREATE OR REPLACE VIEW user_recent_documents AS
SELECT 
  cd.id,
  cd.case_id,
  cd.user_id,
  cd.file_name,
  cd.category,
  cd.file_size,
  cd.created_at,
  c.title as case_title,
  c.client_name
FROM case_documents cd
JOIN cases c ON cd.case_id = c.id
ORDER BY cd.created_at DESC;

-- Vue: Statistiques globales par utilisateur
CREATE OR REPLACE VIEW user_document_stats AS
SELECT 
  user_id,
  COUNT(*) as total_documents,
  SUM(file_size) as total_size_bytes,
  ROUND((SUM(file_size) / 1048576.0)::NUMERIC, 2) as total_size_mb,
  COUNT(DISTINCT case_id) as cases_with_documents,
  MAX(created_at) as last_upload_date
FROM case_documents
GROUP BY user_id;

-- ============================================================================
-- 8. COMMENTAIRES ET DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE case_documents IS 'Stocke les métadonnées des documents associés aux dossiers juridiques';
COMMENT ON COLUMN case_documents.storage_path IS 'Chemin complet dans Supabase Storage: user_id/case_id/filename';
COMMENT ON COLUMN case_documents.category IS 'Catégorie du document pour organisation: piece, conclusion, jugement, correspondance, contrat, autre';
COMMENT ON COLUMN case_documents.tags IS 'Tags pour recherche et filtrage rapide';
COMMENT ON COLUMN case_documents.version IS 'Numéro de version pour le versioning de documents';
COMMENT ON COLUMN case_documents.is_latest_version IS 'Indique si c''est la dernière version du document';

-- ============================================================================
-- 9. DONNÉES DE TEST (OPTIONNEL - À SUPPRIMER EN PRODUCTION)
-- ============================================================================
-- Décommenter pour ajouter des données de test
/*
INSERT INTO case_documents (case_id, user_id, file_name, file_size, file_type, mime_type, storage_path, category, description)
SELECT 
  c.id,
  c.user_id,
  'Document_Test_' || generate_series || '.pdf',
  1024 * 1024 * generate_series, -- Taille variable
  'pdf',
  'application/pdf',
  c.user_id || '/' || c.id || '/Document_Test_' || generate_series || '.pdf',
  (ARRAY['piece', 'conclusion', 'jugement', 'correspondance', 'autre'])[floor(random() * 5 + 1)],
  'Document de test numéro ' || generate_series
FROM cases c
CROSS JOIN generate_series(1, 3)
WHERE c.user_id = auth.uid()
LIMIT 10;
*/

-- ============================================================================
-- 10. VÉRIFICATIONS FINALES
-- ============================================================================

-- Vérifier que la table existe
SELECT 'Table case_documents créée avec succès' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'case_documents'
);

-- Vérifier que RLS est activé
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'case_documents';

-- Compter les policies
SELECT 
  COUNT(*) as total_policies,
  'Policies créées avec succès' as status
FROM pg_policies 
WHERE tablename = 'case_documents';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
-- Pour exécuter ce script:
-- 1. Ouvrir Supabase Dashboard
-- 2. Aller dans SQL Editor
-- 3. Copier-coller ce script
-- 4. Exécuter
-- 
-- Note: Le bucket 'case-documents' doit être créé manuellement dans Storage
-- ============================================================================
