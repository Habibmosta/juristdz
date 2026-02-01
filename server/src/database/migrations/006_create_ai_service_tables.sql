-- Migration: Create AI Service Tables
-- Description: Tables for AI legal service functionality including compliance rules, legal references, and explanations

-- Compliance Rules Table
CREATE TABLE IF NOT EXISTS compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    jurisdiction VARCHAR(100) DEFAULT 'Algeria',
    legal_basis JSONB DEFAULT '[]',
    severity VARCHAR(20) CHECK (severity IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Legal References Table
CREATE TABLE IF NOT EXISTS legal_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('law', 'decree', 'regulation', 'jurisprudence', 'doctrine')),
    reference VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    article VARCHAR(100),
    url TEXT,
    domain VARCHAR(50) NOT NULL,
    jurisdiction VARCHAR(100) DEFAULT 'Algeria',
    publication_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    content TEXT,
    keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Legal Explanations Table (for educational content)
CREATE TABLE IF NOT EXISTS legal_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    context TEXT,
    level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'intermediate',
    language VARCHAR(5) CHECK (language IN ('fr', 'ar')) DEFAULT 'fr',
    content JSONB NOT NULL, -- Full explanation object
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(concept, level, language)
);

-- AI Service Usage Analytics Table
CREATE TABLE IF NOT EXISTS ai_service_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL, -- 'document_draft', 'compliance_analysis', etc.
    request_data JSONB,
    response_data JSONB,
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    model_used VARCHAR(100),
    confidence_score DECIMAL(3,2),
    user_feedback INTEGER CHECK (user_feedback BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Document Templates Enhanced Table (if not exists from previous migration)
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    role_restrictions VARCHAR(50)[] DEFAULT '{}',
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    legal_references JSONB DEFAULT '[]',
    organization_id UUID,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    language VARCHAR(5) DEFAULT 'fr',
    jurisdiction VARCHAR(100) DEFAULT 'Algeria',
    legal_domain VARCHAR(50)
);

-- AI Generated Content Table
CREATE TABLE IF NOT EXISTS ai_generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- 'document', 'clause', 'explanation', etc.
    prompt TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    context_data JSONB,
    model_used VARCHAR(100),
    tokens_used INTEGER DEFAULT 0,
    confidence_score DECIMAL(3,2),
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_compliance_rules_domain ON compliance_rules(domain);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_severity ON compliance_rules(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_active ON compliance_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_legal_references_domain ON legal_references(domain);
CREATE INDEX IF NOT EXISTS idx_legal_references_type ON legal_references(type);
CREATE INDEX IF NOT EXISTS idx_legal_references_reference ON legal_references(reference);
CREATE INDEX IF NOT EXISTS idx_legal_references_keywords ON legal_references USING GIN(keywords);

CREATE INDEX IF NOT EXISTS idx_legal_explanations_concept ON legal_explanations(concept);
CREATE INDEX IF NOT EXISTS idx_legal_explanations_level ON legal_explanations(level);
CREATE INDEX IF NOT EXISTS idx_legal_explanations_language ON legal_explanations(language);

CREATE INDEX IF NOT EXISTS idx_ai_service_usage_user_id ON ai_service_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_service_usage_service_type ON ai_service_usage(service_type);
CREATE INDEX IF NOT EXISTS idx_ai_service_usage_created_at ON ai_service_usage(created_at);

CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(type);
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_role_restrictions ON document_templates USING GIN(role_restrictions);
CREATE INDEX IF NOT EXISTS idx_document_templates_active ON document_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_document_templates_public ON document_templates(is_public);

CREATE INDEX IF NOT EXISTS idx_ai_generated_content_user_id ON ai_generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_type ON ai_generated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_approved ON ai_generated_content(is_approved);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_legal_references_fts ON legal_references USING GIN(to_tsvector('french', title || ' ' || reference || ' ' || COALESCE(content, '')));
CREATE INDEX IF NOT EXISTS idx_legal_explanations_fts ON legal_explanations USING GIN(to_tsvector('french', concept || ' ' || definition || ' ' || COALESCE(context, '')));

-- Insert default compliance rules
INSERT INTO compliance_rules (name, description, category, domain, legal_basis, severity) VALUES
('Forme générale des actes', 'Les actes juridiques doivent respecter les formes prescrites par la loi', 'form', 'civil', '[{"type": "law", "reference": "Code civil algérien", "title": "Dispositions générales"}]', 'high'),
('Mentions obligatoires contrats', 'Les contrats doivent contenir les mentions obligatoires prévues par la loi', 'content', 'commercial', '[{"type": "law", "reference": "Code de commerce", "title": "Formation des contrats"}]', 'high'),
('Procédure civile', 'Respect des règles de procédure civile algérienne', 'procedure', 'civil', '[{"type": "law", "reference": "Code de procédure civile et administrative", "title": "Procédure civile"}]', 'critical'),
('Droit du travail', 'Conformité à la législation du travail algérienne', 'labor', 'labor', '[{"type": "law", "reference": "Loi 90-11", "title": "Relations de travail"}]', 'high'),
('Formalités notariales', 'Respect des formalités requises pour les actes authentiques', 'formality', 'civil', '[{"type": "law", "reference": "Loi sur le notariat", "title": "Statut du notariat"}]', 'critical'),
('Significations huissier', 'Respect des formes de signification par huissier', 'procedure', 'civil', '[{"type": "decree", "reference": "Décret 91-65", "title": "Statut des huissiers"}]', 'high')
ON CONFLICT DO NOTHING;

-- Insert default legal references
INSERT INTO legal_references (type, reference, title, domain, content, keywords) VALUES
('law', 'Code civil algérien', 'Code civil de la République algérienne', 'civil', 'Dispositions générales du droit civil algérien', ARRAY['civil', 'obligations', 'contrats', 'responsabilité']),
('law', 'Code de commerce', 'Code de commerce algérien', 'commercial', 'Réglementation du commerce et des sociétés', ARRAY['commerce', 'sociétés', 'commerçants', 'fonds de commerce']),
('law', 'Code pénal', 'Code pénal algérien', 'criminal', 'Infractions et sanctions pénales', ARRAY['pénal', 'infractions', 'sanctions', 'crimes']),
('law', 'Code de procédure civile et administrative', 'Procédures civiles et administratives', 'civil', 'Règles de procédure devant les juridictions', ARRAY['procédure', 'tribunal', 'jugement', 'appel']),
('law', 'Loi 90-11', 'Loi relative aux relations de travail', 'labor', 'Réglementation des relations de travail', ARRAY['travail', 'emploi', 'salaire', 'licenciement']),
('law', 'Code de la famille', 'Code de la famille algérien', 'family', 'Statut personnel et relations familiales', ARRAY['famille', 'mariage', 'divorce', 'succession']),
('law', 'Constitution algérienne', 'Constitution de la République algérienne', 'constitutional', 'Loi fondamentale de l''État', ARRAY['constitution', 'droits', 'libertés', 'institutions'])
ON CONFLICT DO NOTHING;

-- Insert sample legal explanations
INSERT INTO legal_explanations (concept, definition, context, level, language, content) VALUES
('Contrat', 'Convention par laquelle une ou plusieurs personnes s''obligent envers une ou plusieurs autres à donner, à faire ou à ne pas faire quelque chose', 'Le contrat est l''un des actes juridiques les plus courants en droit civil', 'beginner', 'fr', '{"examples": [], "relatedConcepts": ["obligation", "convention"], "practicalApplications": ["vente", "location", "prestation de services"]}'),
('Responsabilité civile', 'Obligation de réparer le dommage causé à autrui par son fait, par négligence ou imprudence', 'Principe fondamental du droit civil pour la réparation des préjudices', 'intermediate', 'fr', '{"examples": [], "relatedConcepts": ["dommage", "préjudice", "faute"], "practicalApplications": ["accidents", "négligence professionnelle"]}'),
('Procédure civile', 'Ensemble des règles qui régissent le déroulement des procès devant les juridictions civiles', 'Cadre procédural pour faire valoir ses droits en justice', 'advanced', 'fr', '{"examples": [], "relatedConcepts": ["juridiction", "jugement", "appel"], "practicalApplications": ["assignation", "conclusions", "voies de recours"]}')
ON CONFLICT (concept, level, language) DO NOTHING;

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_compliance_rules_updated_at BEFORE UPDATE ON compliance_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_legal_references_updated_at BEFORE UPDATE ON legal_references FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_legal_explanations_updated_at BEFORE UPDATE ON legal_explanations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_generated_content_updated_at BEFORE UPDATE ON ai_generated_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();