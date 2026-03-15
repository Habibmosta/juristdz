-- JURISPRUDENCE TABLE - Base jurisprudentielle algérienne collaborative
-- Full-text search PostgreSQL (FR + AR), workflow de validation éditoriale
-- Idempotent

-- Drop policies only if table exists (avoids 42P01 error)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jurisprudence') THEN
    DROP POLICY IF EXISTS "Public can read validated jurisprudence" ON jurisprudence;
    DROP POLICY IF EXISTS "Authenticated users can contribute" ON jurisprudence;
    DROP POLICY IF EXISTS "Contributors can update own pending" ON jurisprudence;
    DROP POLICY IF EXISTS "Admins can manage all jurisprudence" ON jurisprudence;
  END IF;
END;
$$;

DROP TABLE IF EXISTS jurisprudence CASCADE;

CREATE TABLE jurisprudence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identification de la décision
  case_number TEXT NOT NULL,                    -- Ex: CS/Civ/2022/1234
  decision_date DATE NOT NULL,
  jurisdiction TEXT NOT NULL
    CHECK (jurisdiction IN (
      'cour_supreme','conseil_etat','tribunal_administratif',
      'cour_appel','tribunal','tribunal_commerce','cour_constitutionnelle'
    )),
  court_name TEXT NOT NULL,                     -- Ex: Cour Suprême — Chambre Civile
  wilaya TEXT,                                  -- Pour les juridictions locales
  chamber TEXT,                                 -- Chambre civile, commerciale, sociale...

  -- Domaine juridique
  legal_domain TEXT NOT NULL
    CHECK (legal_domain IN (
      'civil','penal','commercial','administratif','travail',
      'famille','immobilier','fiscal','constitutionnel','international'
    )),

  -- Contenu
  summary_fr TEXT NOT NULL,                     -- Résumé en français (obligatoire)
  summary_ar TEXT,                              -- Résumé en arabe
  full_text_fr TEXT,                            -- Texte intégral FR
  full_text_ar TEXT,                            -- Texte intégral AR
  keywords TEXT[] DEFAULT '{}',                 -- Mots-clés
  legal_references TEXT[] DEFAULT '{}',         -- Ex: ['Art. 176 C.Civ', 'Loi 90-11']
  cited_decisions TEXT[] DEFAULT '{}',          -- Numéros d'arrêts cités

  -- Valeur jurisprudentielle
  precedent_value TEXT NOT NULL DEFAULT 'informative'
    CHECK (precedent_value IN ('binding','persuasive','informative')),

  -- Full-text search vectors (auto-générés)
  search_vector_fr TSVECTOR,
  search_vector_ar TSVECTOR,

  -- Workflow de validation
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','under_review','validated','rejected')),
  rejection_reason TEXT,
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,

  -- Contribution
  contributed_by UUID REFERENCES auth.users(id),
  contributor_role TEXT,                        -- avocat, magistrat, notaire...
  source TEXT DEFAULT 'contribution',           -- 'contribution' | 'official' | 'import'

  -- Métriques
  view_count INTEGER DEFAULT 0,
  citation_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Index full-text search ───────────────────────────────────────────────────
CREATE INDEX idx_jurisprudence_search_fr ON jurisprudence USING GIN(search_vector_fr);
CREATE INDEX idx_jurisprudence_search_ar ON jurisprudence USING GIN(search_vector_ar);
CREATE INDEX idx_jurisprudence_domain ON jurisprudence(legal_domain);
CREATE INDEX idx_jurisprudence_jurisdiction ON jurisprudence(jurisdiction);
CREATE INDEX idx_jurisprudence_date ON jurisprudence(decision_date DESC);
CREATE INDEX idx_jurisprudence_status ON jurisprudence(status);
CREATE INDEX idx_jurisprudence_keywords ON jurisprudence USING GIN(keywords);

-- ─── Trigger: mise à jour automatique des vecteurs full-text ─────────────────
CREATE OR REPLACE FUNCTION update_jurisprudence_search_vector()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector_fr :=
    setweight(to_tsvector('french', coalesce(NEW.case_number, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.summary_fr, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(NEW.full_text_fr, '')), 'C') ||
    setweight(to_tsvector('french', coalesce(array_to_string(NEW.keywords, ' '), '')), 'A') ||
    setweight(to_tsvector('french', coalesce(array_to_string(NEW.legal_references, ' '), '')), 'B');

  -- Arabe: utiliser 'simple' (pas de stemmer arabe natif dans PostgreSQL)
  NEW.search_vector_ar :=
    setweight(to_tsvector('simple', coalesce(NEW.summary_ar, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.full_text_ar, '')), 'C');

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_jurisprudence_search_vector
  BEFORE INSERT OR UPDATE ON jurisprudence
  FOR EACH ROW EXECUTE FUNCTION update_jurisprudence_search_vector();

-- ─── RLS Policies ────────────────────────────────────────────────────────────
ALTER TABLE jurisprudence ENABLE ROW LEVEL SECURITY;

-- Lecture publique des décisions validées
CREATE POLICY "Public can read validated jurisprudence"
  ON jurisprudence FOR SELECT
  USING (status = 'validated');

-- Tout utilisateur authentifié peut contribuer
CREATE POLICY "Authenticated users can contribute"
  ON jurisprudence FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = contributed_by);

-- Un contributeur peut modifier sa propre contribution si encore en attente
CREATE POLICY "Contributors can update own pending"
  ON jurisprudence FOR UPDATE
  USING (auth.uid() = contributed_by AND status = 'pending');

-- Les admins voient et gèrent tout
CREATE POLICY "Admins can manage all jurisprudence"
  ON jurisprudence FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND profession = 'admin'
    )
  );

GRANT SELECT ON jurisprudence TO anon;
GRANT SELECT, INSERT, UPDATE ON jurisprudence TO authenticated;

-- ─── Fonction de recherche full-text ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_jurisprudence(
  query_text TEXT,
  p_domain TEXT DEFAULT NULL,
  p_jurisdiction TEXT DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  case_number TEXT,
  decision_date DATE,
  jurisdiction TEXT,
  court_name TEXT,
  legal_domain TEXT,
  summary_fr TEXT,
  summary_ar TEXT,
  keywords TEXT[],
  legal_references TEXT[],
  precedent_value TEXT,
  rank REAL
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id, j.case_number, j.decision_date, j.jurisdiction,
    j.court_name, j.legal_domain, j.summary_fr, j.summary_ar,
    j.keywords, j.legal_references, j.precedent_value,
    ts_rank(j.search_vector_fr, plainto_tsquery('french', query_text)) AS rank
  FROM jurisprudence j
  WHERE
    j.status = 'validated'
    AND (
      j.search_vector_fr @@ plainto_tsquery('french', query_text)
      OR j.search_vector_ar @@ plainto_tsquery('simple', query_text)
      OR j.case_number ILIKE '%' || query_text || '%'
    )
    AND (p_domain IS NULL OR j.legal_domain = p_domain)
    AND (p_jurisdiction IS NULL OR j.jurisdiction = p_jurisdiction)
    AND (p_date_from IS NULL OR j.decision_date >= p_date_from)
    AND (p_date_to IS NULL OR j.decision_date <= p_date_to)
  ORDER BY rank DESC, j.decision_date DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION search_jurisprudence TO anon, authenticated;
