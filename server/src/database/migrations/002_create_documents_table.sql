-- Create document categories and types
CREATE TABLE document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  allowed_roles TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES document_categories(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  template_schema JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  type_id UUID NOT NULL REFERENCES document_types(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  content TEXT,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
    'draft', 'review', 'approved', 'signed', 'archived'
  )),
  confidentiality_level VARCHAR(20) DEFAULT 'normal' CHECK (confidentiality_level IN (
    'public', 'normal', 'confidential', 'secret'
  )),
  retention_period INTEGER, -- in months
  client_id UUID,
  case_number VARCHAR(100),
  legal_references TEXT[],
  tags TEXT[],
  file_path VARCHAR(500),
  file_size BIGINT,
  file_mime_type VARCHAR(100),
  checksum VARCHAR(64),
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  signed_at TIMESTAMP,
  archived_at TIMESTAMP
);

-- Create document versions table
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_summary TEXT,
  UNIQUE(document_id, version_number)
);

-- Create document permissions table
CREATE TABLE document_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role VARCHAR(50),
  organization_id UUID REFERENCES organizations(id),
  permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN (
    'read', 'write', 'delete', 'share', 'sign'
  )),
  granted_by UUID NOT NULL REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Create document signatures table
CREATE TABLE document_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL REFERENCES users(id),
  signature_type VARCHAR(20) NOT NULL CHECK (signature_type IN (
    'electronic', 'digital', 'biometric'
  )),
  signature_data TEXT NOT NULL,
  certificate_data TEXT,
  timestamp_authority VARCHAR(255),
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_valid BOOLEAN DEFAULT true
);

-- Create document audit log
CREATE TABLE document_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_type ON documents(type_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_organization ON documents(organization_id);
CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_documents_case_number ON documents(case_number);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_permissions_document ON document_permissions(document_id);
CREATE INDEX idx_document_permissions_user ON document_permissions(user_id);
CREATE INDEX idx_document_signatures_document ON document_signatures(document_id);
CREATE INDEX idx_document_audit_document ON document_audit_log(document_id);
CREATE INDEX idx_document_audit_user ON document_audit_log(user_id);

-- Full-text search index
CREATE INDEX idx_documents_content_search ON documents USING gin(to_tsvector('french', title || ' ' || COALESCE(content, '')));

-- Create triggers
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default document categories
INSERT INTO document_categories (name, description, allowed_roles) VALUES
('Actes de procédure', 'Documents de procédure judiciaire', ARRAY['avocat', 'huissier', 'magistrat']),
('Actes authentiques', 'Documents notariés officiels', ARRAY['notaire']),
('Contrats', 'Contrats et conventions', ARRAY['avocat', 'notaire', 'juriste_entreprise']),
('Consultations', 'Avis et consultations juridiques', ARRAY['avocat', 'juriste_entreprise']),
('Jugements', 'Décisions de justice', ARRAY['magistrat']),
('Documents pédagogiques', 'Matériel d''apprentissage', ARRAY['etudiant', 'admin']);

-- Insert default document types
INSERT INTO document_types (category_id, name, description) 
SELECT 
  c.id,
  dt.name,
  dt.description
FROM document_categories c
CROSS JOIN (VALUES
  ('Actes de procédure', 'Requête', 'Demande en justice'),
  ('Actes de procédure', 'Conclusions', 'Conclusions d''avocat'),
  ('Actes de procédure', 'Mémoire', 'Mémoire en défense'),
  ('Actes authentiques', 'Acte de vente', 'Contrat de vente immobilière'),
  ('Actes authentiques', 'Testament', 'Testament authentique'),
  ('Contrats', 'Contrat de travail', 'Contrat d''emploi'),
  ('Contrats', 'Bail', 'Contrat de location'),
  ('Consultations', 'Avis juridique', 'Consultation juridique'),
  ('Jugements', 'Jugement civil', 'Décision en matière civile'),
  ('Jugements', 'Jugement pénal', 'Décision en matière pénale')
) AS dt(category_name, name, description)
WHERE c.name = dt.category_name;