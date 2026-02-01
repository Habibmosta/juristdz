-- Create document storage and versioning tables

-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  owner_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  template_id UUID,
  parent_document_id UUID REFERENCES documents(id),
  is_template BOOLEAN DEFAULT false,
  language VARCHAR(2) DEFAULT 'fr' CHECK (language IN ('fr', 'ar')),
  confidentiality_level VARCHAR(20) DEFAULT 'internal' CHECK (confidentiality_level IN (
    'public', 'internal', 'confidential', 'secret'
  )),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft', 'in_review', 'approved', 'signed', 'archived', 'cancelled'
  )),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  CONSTRAINT documents_type_check CHECK (type IN (
    'requete', 'conclusion', 'memoire', 'consultation', 'contrat',
    'acte_authentique', 'acte_vente', 'acte_donation', 'testament', 'procuration',
    'exploit', 'pv_signification', 'constat', 'commandement',
    'jugement', 'arret', 'ordonnance', 'decision',
    'contrat_entreprise', 'avis_juridique', 'politique_interne',
    'courrier', 'rapport', 'note', 'autre'
  )),
  
  CONSTRAINT documents_category_check CHECK (category IN (
    'procedure', 'contrat', 'acte_notarie', 'signification', 'decision_justice',
    'consultation', 'correspondance', 'rapport', 'autre'
  ))
);

-- Create document templates table
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  role_restrictions TEXT[] DEFAULT '{}',
  template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  legal_references JSONB DEFAULT '[]',
  organization_id UUID REFERENCES organizations(id),
  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP,
  tags TEXT[] DEFAULT '{}',
  language VARCHAR(2) DEFAULT 'fr' CHECK (language IN ('fr', 'ar')),
  jurisdiction VARCHAR(100),
  legal_domain VARCHAR(50),
  
  -- Same type and category constraints as documents
  CONSTRAINT templates_type_check CHECK (type IN (
    'requete', 'conclusion', 'memoire', 'consultation', 'contrat',
    'acte_authentique', 'acte_vente', 'acte_donation', 'testament', 'procuration',
    'exploit', 'pv_signification', 'constat', 'commandement',
    'jugement', 'arret', 'ordonnance', 'decision',
    'contrat_entreprise', 'avis_juridique', 'politique_interne',
    'courrier', 'rapport', 'note', 'autre'
  )),
  
  CONSTRAINT templates_category_check CHECK (category IN (
    'procedure', 'contrat', 'acte_notarie', 'signification', 'decision_justice',
    'consultation', 'correspondance', 'rapport', 'autre'
  ))
);

-- Create document versions table for versioning system
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT false,
  checksum VARCHAR(64) NOT NULL,
  
  -- Ensure unique version numbers per document
  UNIQUE(document_id, version)
);

-- Create document permissions table for access control
CREATE TABLE document_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role_id UUID,
  organization_id UUID REFERENCES organizations(id),
  permissions TEXT[] NOT NULL DEFAULT '{}',
  granted_by UUID NOT NULL REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- Ensure at least one of user_id, role_id, or organization_id is specified
  CONSTRAINT permissions_target_check CHECK (
    user_id IS NOT NULL OR role_id IS NOT NULL OR organization_id IS NOT NULL
  ),
  
  -- Permissions must be valid actions
  CONSTRAINT permissions_actions_check CHECK (
    permissions <@ ARRAY['read', 'write', 'delete', 'share', 'sign', 'approve', 'archive', 'export', 'print']
  )
);

-- Create document signatures table for electronic signatures
CREATE TABLE document_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL REFERENCES users(id),
  signer_name VARCHAR(255) NOT NULL,
  signer_role VARCHAR(100),
  signature_type VARCHAR(20) DEFAULT 'simple' CHECK (signature_type IN (
    'simple', 'advanced', 'qualified'
  )),
  signature_data TEXT NOT NULL,
  certificate TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  location VARCHAR(255),
  reason TEXT,
  is_valid BOOLEAN DEFAULT true,
  validation_data JSONB,
  
  -- Ensure unique signatures per document per user
  UNIQUE(document_id, signer_id)
);

-- Create document attachments table for file attachments
CREATE TABLE document_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_encrypted BOOLEAN DEFAULT false,
  encryption_key_id UUID,
  
  -- Ensure reasonable file sizes (max 100MB)
  CONSTRAINT attachment_size_check CHECK (file_size <= 104857600)
);

-- Create document workflow instances table
CREATE TABLE document_workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL,
  current_step INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
    'active', 'completed', 'cancelled', 'failed'
  )),
  started_by UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- Create document workflow steps table
CREATE TABLE document_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES document_workflow_instances(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  assignee_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'skipped', 'failed'
  )),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  comments TEXT,
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(workflow_instance_id, step_number)
);

-- Create document activity log for audit trail
CREATE TABLE document_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Valid actions for audit
  CONSTRAINT activity_action_check CHECK (action IN (
    'created', 'updated', 'deleted', 'viewed', 'downloaded', 'shared',
    'signed', 'approved', 'rejected', 'archived', 'restored',
    'permission_granted', 'permission_revoked', 'workflow_started',
    'workflow_completed', 'version_created', 'attachment_added',
    'attachment_removed', 'template_applied'
  ))
);

-- Create indexes for performance
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_organization ON documents(organization_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX idx_documents_template ON documents(template_id);
CREATE INDEX idx_documents_confidentiality ON documents(confidentiality_level);
CREATE INDEX idx_documents_metadata ON documents USING GIN(metadata);

CREATE INDEX idx_document_templates_type ON document_templates(type);
CREATE INDEX idx_document_templates_category ON document_templates(category);
CREATE INDEX idx_document_templates_organization ON document_templates(organization_id);
CREATE INDEX idx_document_templates_active ON document_templates(is_active);
CREATE INDEX idx_document_templates_public ON document_templates(is_public);
CREATE INDEX idx_document_templates_usage ON document_templates(usage_count DESC);
CREATE INDEX idx_document_templates_domain ON document_templates(legal_domain);

CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_active ON document_versions(document_id, is_active);
CREATE INDEX idx_document_versions_created_at ON document_versions(created_at DESC);

CREATE INDEX idx_document_permissions_document ON document_permissions(document_id);
CREATE INDEX idx_document_permissions_user ON document_permissions(user_id);
CREATE INDEX idx_document_permissions_active ON document_permissions(is_active);

CREATE INDEX idx_document_signatures_document ON document_signatures(document_id);
CREATE INDEX idx_document_signatures_signer ON document_signatures(signer_id);
CREATE INDEX idx_document_signatures_timestamp ON document_signatures(timestamp DESC);

CREATE INDEX idx_document_attachments_document ON document_attachments(document_id);
CREATE INDEX idx_document_attachments_uploaded_by ON document_attachments(uploaded_by);

CREATE INDEX idx_document_workflow_instances_document ON document_workflow_instances(document_id);
CREATE INDEX idx_document_workflow_instances_status ON document_workflow_instances(status);

CREATE INDEX idx_document_activity_log_document ON document_activity_log(document_id);
CREATE INDEX idx_document_activity_log_user ON document_activity_log(user_id);
CREATE INDEX idx_document_activity_log_timestamp ON document_activity_log(timestamp DESC);
CREATE INDEX idx_document_activity_log_action ON document_activity_log(action);

-- Create full-text search index for documents
CREATE INDEX idx_documents_content_search ON documents USING GIN(to_tsvector('french', title || ' ' || content));

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at_trigger
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER document_templates_updated_at_trigger
  BEFORE UPDATE ON document_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for document activity logging
CREATE OR REPLACE FUNCTION log_document_activity()
RETURNS TRIGGER AS $
DECLARE
  action_name VARCHAR(50);
BEGIN
  -- Determine action based on operation
  IF TG_OP = 'INSERT' THEN
    action_name := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := 'updated';
  ELSIF TG_OP = 'DELETE' THEN
    action_name := 'deleted';
  END IF;
  
  -- Log the activity (using OLD for DELETE, NEW for INSERT/UPDATE)
  INSERT INTO document_activity_log (document_id, user_id, action, details)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.owner_id, OLD.owner_id),
    action_name,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', CURRENT_TIMESTAMP
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER documents_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION log_document_activity();

-- Create function for document search with ranking
CREATE OR REPLACE FUNCTION search_documents(
  search_query TEXT,
  user_id_param UUID,
  document_type_param VARCHAR(50) DEFAULT NULL,
  limit_param INTEGER DEFAULT 50,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(500),
  type VARCHAR(50),
  category VARCHAR(50),
  owner_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  rank REAL
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.type,
    d.category,
    d.owner_id,
    d.created_at,
    d.updated_at,
    ts_rank(to_tsvector('french', d.title || ' ' || d.content), plainto_tsquery('french', search_query)) as rank
  FROM documents d
  LEFT JOIN document_permissions dp ON d.id = dp.document_id
  WHERE 
    (
      -- User owns the document
      d.owner_id = user_id_param
      OR
      -- User has explicit permission
      (dp.user_id = user_id_param AND dp.is_active = true AND 'read' = ANY(dp.permissions))
      OR
      -- Document is public
      d.confidentiality_level = 'public'
    )
    AND (document_type_param IS NULL OR d.type = document_type_param)
    AND to_tsvector('french', d.title || ' ' || d.content) @@ plainto_tsquery('french', search_query)
  ORDER BY rank DESC, d.updated_at DESC
  LIMIT limit_param OFFSET offset_param;
END;
$ LANGUAGE plpgsql;

-- Create function for document cleanup (remove old versions, expired permissions)
CREATE OR REPLACE FUNCTION cleanup_document_data()
RETURNS void AS $
BEGIN
  -- Remove expired permissions
  DELETE FROM document_permissions 
  WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP;
  
  -- Remove old activity logs (keep for 2 years)
  DELETE FROM document_activity_log 
  WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '2 years';
  
  -- Update template usage statistics
  UPDATE document_templates SET
    usage_count = (
      SELECT COUNT(*) FROM documents 
      WHERE template_id = document_templates.id
    );
END;
$ LANGUAGE plpgsql;

-- Insert sample document templates for different professions
INSERT INTO document_templates (
  name, description, type, category, role_restrictions, template, variables, 
  legal_references, is_public, created_by, language, legal_domain
) VALUES
  (
    'Modèle de Requête Civile',
    'Modèle standard pour les requêtes en matière civile',
    'requete',
    'procedure',
    ARRAY['avocat'],
    'REQUÊTE EN {{type_procedure}}

Monsieur le Président du Tribunal de {{juridiction}},

J''ai l''honneur de vous exposer que :

{{exposé_des_faits}}

PAR CES MOTIFS,

Il vous plaira, Monsieur le Président :

{{demandes}}

Sous toutes réserves.

{{lieu}}, le {{date}}

{{signature_avocat}}
Avocat au Barreau de {{barreau}}',
    '[
      {"name": "type_procedure", "type": "text", "label": "Type de procédure", "required": true},
      {"name": "juridiction", "type": "text", "label": "Juridiction", "required": true},
      {"name": "exposé_des_faits", "type": "text", "label": "Exposé des faits", "required": true},
      {"name": "demandes", "type": "text", "label": "Demandes", "required": true},
      {"name": "lieu", "type": "text", "label": "Lieu", "required": true},
      {"name": "date", "type": "date", "label": "Date", "required": true},
      {"name": "signature_avocat", "type": "text", "label": "Nom de l''avocat", "required": true},
      {"name": "barreau", "type": "text", "label": "Barreau", "required": true}
    ]',
    '[]',
    true,
    (SELECT id FROM users LIMIT 1),
    'fr',
    'civil'
  ),
  (
    'Modèle d''Acte de Vente Immobilière',
    'Modèle d''acte authentique pour la vente d''un bien immobilier',
    'acte_vente',
    'acte_notarie',
    ARRAY['notaire'],
    'ACTE DE VENTE

L''an {{année}}, le {{date}}, à {{heure}}.

Devant Maître {{nom_notaire}}, Notaire à {{ville_notaire}}.

ONT COMPARU :

1°) {{vendeur_nom}}, {{vendeur_qualité}}, demeurant à {{vendeur_adresse}}.

2°) {{acquereur_nom}}, {{acquereur_qualité}}, demeurant à {{acquereur_adresse}}.

CESSION

Le vendeur cède et transporte à l''acquéreur qui accepte :

{{description_bien}}

PRIX

Cette vente est consentie moyennant le prix de {{prix}} DA ({{prix_lettres}}).

{{conditions_paiement}}

DONT ACTE

{{lieu_acte}}, le {{date_acte}}

{{signature_notaire}}',
    '[
      {"name": "année", "type": "number", "label": "Année", "required": true},
      {"name": "date", "type": "date", "label": "Date", "required": true},
      {"name": "heure", "type": "text", "label": "Heure", "required": true},
      {"name": "nom_notaire", "type": "text", "label": "Nom du notaire", "required": true},
      {"name": "ville_notaire", "type": "text", "label": "Ville du notaire", "required": true},
      {"name": "vendeur_nom", "type": "text", "label": "Nom du vendeur", "required": true},
      {"name": "vendeur_qualité", "type": "text", "label": "Qualité du vendeur", "required": true},
      {"name": "vendeur_adresse", "type": "text", "label": "Adresse du vendeur", "required": true},
      {"name": "acquereur_nom", "type": "text", "label": "Nom de l''acquéreur", "required": true},
      {"name": "acquereur_qualité", "type": "text", "label": "Qualité de l''acquéreur", "required": true},
      {"name": "acquereur_adresse", "type": "text", "label": "Adresse de l''acquéreur", "required": true},
      {"name": "description_bien", "type": "text", "label": "Description du bien", "required": true},
      {"name": "prix", "type": "currency", "label": "Prix en chiffres", "required": true},
      {"name": "prix_lettres", "type": "text", "label": "Prix en lettres", "required": true},
      {"name": "conditions_paiement", "type": "text", "label": "Conditions de paiement", "required": true},
      {"name": "lieu_acte", "type": "text", "label": "Lieu de l''acte", "required": true},
      {"name": "date_acte", "type": "date", "label": "Date de l''acte", "required": true},
      {"name": "signature_notaire", "type": "text", "label": "Signature du notaire", "required": true}
    ]',
    '[{"reference": "Code Civil Art. 387-395", "title": "Vente immobilière"}]',
    true,
    (SELECT id FROM users LIMIT 1),
    'fr',
    'civil'
  );

-- Create a view for document statistics
CREATE VIEW document_statistics AS
SELECT 
  d.type,
  d.category,
  d.status,
  d.confidentiality_level,
  COUNT(*) as document_count,
  AVG(LENGTH(d.content)) as avg_content_length,
  MAX(d.created_at) as latest_created,
  COUNT(DISTINCT d.owner_id) as unique_owners
FROM documents d
GROUP BY d.type, d.category, d.status, d.confidentiality_level;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_templates TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_versions TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_permissions TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_signatures TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_attachments TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_workflow_instances TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_workflow_steps TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_activity_log TO app_user;
GRANT SELECT ON document_statistics TO app_user;

-- Create encryption keys table for file encryption
CREATE TABLE encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encrypted_key BYTEA NOT NULL,
  iv BYTEA NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Create file access log table for audit
CREATE TABLE file_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attachment_id UUID NOT NULL REFERENCES document_attachments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for encryption and access log tables
CREATE INDEX idx_encryption_keys_active ON encryption_keys(is_active);
CREATE INDEX idx_encryption_keys_expires ON encryption_keys(expires_at);

CREATE INDEX idx_file_access_log_attachment ON file_access_log(attachment_id);
CREATE INDEX idx_file_access_log_user ON file_access_log(user_id);
CREATE INDEX idx_file_access_log_timestamp ON file_access_log(timestamp DESC);

-- Grant permissions for new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON encryption_keys TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON file_access_log TO app_user;