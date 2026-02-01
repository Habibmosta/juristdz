-- Create legal search tables for jurisprudence and legal texts

-- Create courts table
CREATE TABLE IF NOT EXISTS courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'civil', 'criminal', 'commercial', 'administrative', 'supreme', 'constitutional'
  )),
  jurisdiction VARCHAR(50) NOT NULL CHECK (jurisdiction IN (
    'supreme_court', 'council_of_state', 'court_of_cassation', 'appeal_court',
    'first_instance', 'commercial_court', 'administrative_court', 'criminal_court'
  )),
  level VARCHAR(50) NOT NULL CHECK (level IN (
    'first_instance', 'appeal', 'supreme'
  )),
  location VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create jurisprudence table
CREATE TABLE IF NOT EXISTS jurisprudence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  full_text TEXT,
  court_id UUID NOT NULL REFERENCES courts(id),
  date DATE NOT NULL,
  parties JSONB DEFAULT '[]',
  legal_domain VARCHAR(50) NOT NULL CHECK (legal_domain IN (
    'civil', 'criminal', 'commercial', 'administrative', 'family',
    'labor', 'tax', 'constitutional', 'international'
  )),
  keywords TEXT[] DEFAULT '{}',
  citations JSONB DEFAULT '[]',
  precedent_value VARCHAR(20) DEFAULT 'informative' CHECK (precedent_value IN (
    'binding', 'persuasive', 'informative'
  )),
  is_public BOOLEAN DEFAULT true,
  document_url TEXT,
  indexed_content TSVECTOR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique case numbers per court
  UNIQUE(case_number, court_id)
);

-- Create legal_texts table for codes, laws, regulations
CREATE TABLE IF NOT EXISTS legal_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'code', 'law', 'decree', 'regulation', 'ordinance'
  )),
  reference VARCHAR(100) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  domain VARCHAR(50) NOT NULL CHECK (domain IN (
    'civil', 'criminal', 'commercial', 'administrative', 'family',
    'labor', 'tax', 'constitutional', 'international'
  )),
  publication_date DATE NOT NULL,
  effective_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
    'active', 'repealed', 'amended'
  )),
  amendments JSONB DEFAULT '[]',
  related_texts TEXT[] DEFAULT '{}',
  jora_reference VARCHAR(100),
  indexed_content TSVECTOR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create related_cases table for case relationships
CREATE TABLE IF NOT EXISTS related_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_case_id UUID NOT NULL REFERENCES jurisprudence(id) ON DELETE CASCADE,
  related_case_id UUID NOT NULL REFERENCES jurisprudence(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN (
    'cited_by', 'cites', 'overruled_by', 'overrules', 'distinguished', 'followed'
  )),
  relevance_score DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent self-references and duplicate relationships
  CHECK (source_case_id != related_case_id),
  UNIQUE(source_case_id, related_case_id, relationship_type)
);

-- Create search_logs table for analytics
CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  search_query TEXT NOT NULL,
  search_type VARCHAR(50) NOT NULL CHECK (search_type IN (
    'jurisprudence', 'legal_texts', 'mixed'
  )),
  filters JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  search_time_ms INTEGER DEFAULT 0,
  clicked_result_id UUID,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create search_suggestions table for autocomplete
CREATE TABLE IF NOT EXISTS search_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'keyword', 'legal_reference', 'case_name', 'court'
  )),
  frequency INTEGER DEFAULT 1,
  context TEXT,
  domain VARCHAR(50),
  language VARCHAR(2) DEFAULT 'fr',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(term, type, domain)
);

-- Create indexes for performance
CREATE INDEX idx_courts_jurisdiction ON courts(jurisdiction);
CREATE INDEX idx_courts_type ON courts(type);
CREATE INDEX idx_courts_location ON courts(location);

CREATE INDEX idx_jurisprudence_court ON jurisprudence(court_id);
CREATE INDEX idx_jurisprudence_date ON jurisprudence(date DESC);
CREATE INDEX idx_jurisprudence_domain ON jurisprudence(legal_domain);
CREATE INDEX idx_jurisprudence_public ON jurisprudence(is_public);
CREATE INDEX idx_jurisprudence_case_number ON jurisprudence(case_number);
CREATE INDEX idx_jurisprudence_keywords ON jurisprudence USING GIN(keywords);
CREATE INDEX idx_jurisprudence_search ON jurisprudence USING GIN(indexed_content);

CREATE INDEX idx_legal_texts_reference ON legal_texts(reference);
CREATE INDEX idx_legal_texts_type ON legal_texts(type);
CREATE INDEX idx_legal_texts_domain ON legal_texts(domain);
CREATE INDEX idx_legal_texts_status ON legal_texts(status);
CREATE INDEX idx_legal_texts_publication_date ON legal_texts(publication_date DESC);
CREATE INDEX idx_legal_texts_search ON legal_texts USING GIN(indexed_content);

CREATE INDEX idx_related_cases_source ON related_cases(source_case_id);
CREATE INDEX idx_related_cases_related ON related_cases(related_case_id);
CREATE INDEX idx_related_cases_type ON related_cases(relationship_type);

CREATE INDEX idx_search_logs_user ON search_logs(user_id);
CREATE INDEX idx_search_logs_created ON search_logs(created_at DESC);
CREATE INDEX idx_search_logs_type ON search_logs(search_type);

CREATE INDEX idx_search_suggestions_term ON search_suggestions(term);
CREATE INDEX idx_search_suggestions_type ON search_suggestions(type);
CREATE INDEX idx_search_suggestions_frequency ON search_suggestions(frequency DESC);

-- Create triggers for full-text search indexing
CREATE OR REPLACE FUNCTION update_jurisprudence_search_index()
RETURNS TRIGGER AS $$
BEGIN
  NEW.indexed_content := 
    setweight(to_tsvector('french', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'C') ||
    setweight(to_tsvector('french', COALESCE(NEW.full_text, '')), 'D');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jurisprudence_search_index_trigger
  BEFORE INSERT OR UPDATE ON jurisprudence
  FOR EACH ROW EXECUTE FUNCTION update_jurisprudence_search_index();

CREATE OR REPLACE FUNCTION update_legal_texts_search_index()
RETURNS TRIGGER AS $$
BEGIN
  NEW.indexed_content := 
    setweight(to_tsvector('french', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.reference, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(NEW.content, '')), 'C');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER legal_texts_search_index_trigger
  BEFORE INSERT OR UPDATE ON legal_texts
  FOR EACH ROW EXECUTE FUNCTION update_legal_texts_search_index();

-- Insert sample courts
INSERT INTO courts (name, type, jurisdiction, level, location, region) VALUES
  ('Cour Suprême d''Algérie', 'supreme', 'supreme_court', 'supreme', 'Alger', 'Alger'),
  ('Conseil d''État', 'administrative', 'council_of_state', 'supreme', 'Alger', 'Alger'),
  ('Cour d''Appel d''Alger', 'civil', 'appeal_court', 'appeal', 'Alger', 'Alger'),
  ('Cour d''Appel d''Oran', 'civil', 'appeal_court', 'appeal', 'Oran', 'Oran'),
  ('Cour d''Appel de Constantine', 'civil', 'appeal_court', 'appeal', 'Constantine', 'Constantine'),
  ('Tribunal de Première Instance d''Alger', 'civil', 'first_instance', 'first_instance', 'Alger', 'Alger'),
  ('Tribunal de Commerce d''Alger', 'commercial', 'commercial_court', 'first_instance', 'Alger', 'Alger'),
  ('Tribunal Administratif d''Alger', 'administrative', 'administrative_court', 'first_instance', 'Alger', 'Alger'),
  ('Tribunal Criminel d''Alger', 'criminal', 'criminal_court', 'first_instance', 'Alger', 'Alger');

-- Insert sample jurisprudence
INSERT INTO jurisprudence (
  case_number, title, summary, court_id, date, legal_domain, keywords, is_public
) VALUES
  (
    '2024/001',
    'Affaire Société SARL vs. Benali Ahmed - Résolution de contrat commercial',
    'Résolution d''un contrat de fourniture pour non-respect des délais de livraison. La cour confirme la validité de la clause résolutoire.',
    (SELECT id FROM courts WHERE name = 'Tribunal de Commerce d''Alger'),
    '2024-01-15',
    'commercial',
    ARRAY['contrat', 'résolution', 'clause résolutoire', 'délai', 'livraison'],
    true
  ),
  (
    '2024/002',
    'Divorce pour faute - Garde des enfants',
    'Divorce prononcé aux torts exclusifs du mari. Attribution de la garde des enfants à la mère avec droit de visite organisé.',
    (SELECT id FROM courts WHERE name = 'Tribunal de Première Instance d''Alger'),
    '2024-02-01',
    'family',
    ARRAY['divorce', 'faute', 'garde', 'enfants', 'droit de visite'],
    true
  ),
  (
    '2023/156',
    'Responsabilité civile - Accident de la circulation',
    'Indemnisation des victimes d''accident de la circulation. Application du principe de responsabilité du fait des choses.',
    (SELECT id FROM courts WHERE name = 'Tribunal de Première Instance d''Alger'),
    '2023-12-10',
    'civil',
    ARRAY['responsabilité civile', 'accident', 'circulation', 'indemnisation', 'fait des choses'],
    true
  );

-- Insert sample legal texts
INSERT INTO legal_texts (
  type, reference, title, content, domain, publication_date, status, jora_reference
) VALUES
  (
    'code',
    'Code Civil Art. 124',
    'Code Civil Algérien - Article 124 - Formation du contrat',
    'Le contrat se forme par l''échange des consentements entre les parties. Le consentement doit être libre et éclairé.',
    'civil',
    '1975-09-26',
    'active',
    'JORA N° 78/1975'
  ),
  (
    'code',
    'Code Commerce Art. 15',
    'Code de Commerce - Article 15 - Obligations du commerçant',
    'Tout commerçant doit tenir une comptabilité régulière et sincère de ses opérations commerciales.',
    'commercial',
    '1975-09-26',
    'active',
    'JORA N° 78/1975'
  ),
  (
    'law',
    'Loi 08-09',
    'Loi relative au Code de Procédure Civile et Administrative',
    'La présente loi fixe les règles de procédure applicables devant les juridictions civiles et administratives.',
    'civil',
    '2008-02-25',
    'active',
    'JORA N° 21/2008'
  );

-- Insert sample search suggestions
INSERT INTO search_suggestions (term, type, frequency, domain) VALUES
  ('contrat de vente', 'keyword', 150, 'civil'),
  ('responsabilité civile', 'keyword', 120, 'civil'),
  ('divorce', 'keyword', 200, 'family'),
  ('garde d''enfants', 'keyword', 80, 'family'),
  ('accident de travail', 'keyword', 90, 'labor'),
  ('licenciement abusif', 'keyword', 75, 'labor'),
  ('société commerciale', 'keyword', 110, 'commercial'),
  ('faillite', 'keyword', 60, 'commercial'),
  ('Code Civil Art. 124', 'legal_reference', 45, 'civil'),
  ('Cour Suprême', 'court', 300, null);

-- Function to update search suggestions frequency
CREATE OR REPLACE FUNCTION update_search_suggestion_frequency(search_term TEXT, suggestion_type VARCHAR(50), suggestion_domain VARCHAR(50) DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO search_suggestions (term, type, frequency, domain)
  VALUES (search_term, suggestion_type, 1, suggestion_domain)
  ON CONFLICT (term, type, domain) 
  DO UPDATE SET 
    frequency = search_suggestions.frequency + 1,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old search logs (keep for 1 year)
CREATE OR REPLACE FUNCTION clean_old_search_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM search_logs 
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;