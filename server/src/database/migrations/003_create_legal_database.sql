-- Create legal codes table
CREATE TABLE legal_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code_type VARCHAR(50) NOT NULL CHECK (code_type IN (
    'civil', 'penal', 'commercial', 'administratif', 'procedure_civile', 'procedure_penale'
  )),
  version VARCHAR(20),
  effective_date DATE,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create legal articles table
CREATE TABLE legal_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES legal_codes(id),
  article_number VARCHAR(20) NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,
  chapter VARCHAR(100),
  section VARCHAR(100),
  subsection VARCHAR(100),
  effective_date DATE,
  repeal_date DATE,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create JORA (Journal Officiel) table
CREATE TABLE jora_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jora_number VARCHAR(20) NOT NULL,
  publication_date DATE NOT NULL,
  year INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  document_type VARCHAR(50) CHECK (document_type IN (
    'loi', 'decret', 'arrete', 'ordonnance', 'decision'
  )),
  ministry VARCHAR(255),
  keywords TEXT[],
  file_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create jurisprudence table
CREATE TABLE jurisprudence_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(100) NOT NULL,
  court_id UUID NOT NULL,
  court_name VARCHAR(255) NOT NULL,
  court_type VARCHAR(50) NOT NULL CHECK (court_type IN (
    'civil', 'penal', 'commercial', 'administratif', 'supreme'
  )),
  court_level VARCHAR(20) NOT NULL CHECK (court_level IN (
    'premiere_instance', 'appel', 'cassation', 'supreme'
  )),
  jurisdiction VARCHAR(100),
  decision_date DATE NOT NULL,
  parties TEXT[],
  summary TEXT,
  full_text TEXT,
  legal_domain VARCHAR(50),
  keywords TEXT[],
  legal_references TEXT[],
  precedent_value VARCHAR(20) DEFAULT 'normal' CHECK (precedent_value IN (
    'low', 'normal', 'high', 'landmark'
  )),
  is_public BOOLEAN DEFAULT true,
  publication_status VARCHAR(20) DEFAULT 'published' CHECK (publication_status IN (
    'draft', 'review', 'published', 'archived'
  )),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create courts table
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'civil', 'penal', 'commercial', 'administratif', 'supreme'
  )),
  level VARCHAR(20) NOT NULL CHECK (level IN (
    'premiere_instance', 'appel', 'cassation', 'supreme'
  )),
  jurisdiction VARCHAR(100),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create legal references table for cross-referencing
CREATE TABLE legal_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN (
    'article', 'case', 'jora', 'document'
  )),
  source_id UUID NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN (
    'article', 'case', 'jora', 'document'
  )),
  target_id UUID NOT NULL,
  reference_type VARCHAR(20) DEFAULT 'cites' CHECK (reference_type IN (
    'cites', 'cited_by', 'amends', 'repeals', 'interprets'
  )),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create search indexes
CREATE INDEX idx_legal_articles_code ON legal_articles(code_id);
CREATE INDEX idx_legal_articles_number ON legal_articles(article_number);
CREATE INDEX idx_legal_articles_current ON legal_articles(is_current);
CREATE INDEX idx_jora_date ON jora_publications(publication_date);
CREATE INDEX idx_jora_year ON jora_publications(year);
CREATE INDEX idx_jora_type ON jora_publications(document_type);
CREATE INDEX idx_jurisprudence_court ON jurisprudence_cases(court_id);
CREATE INDEX idx_jurisprudence_date ON jurisprudence_cases(decision_date);
CREATE INDEX idx_jurisprudence_type ON jurisprudence_cases(court_type);
CREATE INDEX idx_jurisprudence_domain ON jurisprudence_cases(legal_domain);
CREATE INDEX idx_courts_type ON courts(type);
CREATE INDEX idx_courts_level ON courts(level);
CREATE INDEX idx_legal_references_source ON legal_references(source_type, source_id);
CREATE INDEX idx_legal_references_target ON legal_references(target_type, target_id);

-- Full-text search indexes
CREATE INDEX idx_legal_articles_search ON legal_articles USING gin(to_tsvector('french', title || ' ' || content));
CREATE INDEX idx_jora_search ON jora_publications USING gin(to_tsvector('french', title || ' ' || COALESCE(content, '')));
CREATE INDEX idx_jurisprudence_search ON jurisprudence_cases USING gin(to_tsvector('french', summary || ' ' || COALESCE(full_text, '')));

-- Create triggers
CREATE TRIGGER update_legal_codes_updated_at BEFORE UPDATE ON legal_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_articles_updated_at BEFORE UPDATE ON legal_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jurisprudence_updated_at BEFORE UPDATE ON jurisprudence_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample legal codes
INSERT INTO legal_codes (name, code_type, version, effective_date) VALUES
('Code Civil Algérien', 'civil', '2007', '2007-05-13'),
('Code Pénal Algérien', 'penal', '2006', '2006-12-20'),
('Code de Commerce Algérien', 'commercial', '1975', '1975-09-26'),
('Code de Procédure Civile et Administrative', 'procedure_civile', '2008', '2008-02-25'),
('Code de Procédure Pénale', 'procedure_penale', '2015', '2015-07-23');

-- Insert sample courts
INSERT INTO courts (name, type, level, jurisdiction, city) VALUES
('Tribunal de Première Instance d''Alger', 'civil', 'premiere_instance', 'Alger', 'Alger'),
('Cour d''Appel d''Alger', 'civil', 'appel', 'Alger', 'Alger'),
('Tribunal Administratif d''Alger', 'administratif', 'premiere_instance', 'Alger', 'Alger'),
('Cour Suprême', 'supreme', 'supreme', 'National', 'Alger'),
('Tribunal de Commerce d''Alger', 'commercial', 'premiere_instance', 'Alger', 'Alger');