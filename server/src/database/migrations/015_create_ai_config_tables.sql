-- Migration 015: Create AI Configuration Tables
-- Description: Tables pour la configuration et gestion des modèles IA

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums for AI configuration
CREATE TYPE ai_provider AS ENUM (
  'openai', 'anthropic', 'google', 'groq', 'mistral', 'local'
);

CREATE TYPE domaine_juridique AS ENUM (
  'droit_civil', 'droit_penal', 'droit_commercial', 'droit_administratif',
  'droit_constitutionnel', 'droit_international', 'droit_travail',
  'droit_famille', 'droit_immobilier', 'droit_fiscal', 'general'
);

CREATE TYPE ai_task_type AS ENUM (
  'document_generation', 'legal_analysis', 'compliance_check',
  'contract_review', 'legal_research', 'translation', 'summarization'
);

-- 1. AI Model Configurations Table
CREATE TABLE ai_model_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  provider ai_provider NOT NULL,
  model_id VARCHAR(255) NOT NULL,
  domain_juridique domaine_juridique NOT NULL,
  configuration JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(domain_juridique, is_default) WHERE is_default = true AND deleted_at IS NULL
);

-- 2. AI Usage Logs Table
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES ai_model_configs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  response TEXT,
  error_message TEXT,
  success BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  tokens_used INTEGER,
  cost_estimate DECIMAL(10,6),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. AI Prompt Templates Table
CREATE TABLE ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain_juridique domaine_juridique NOT NULL,
  task_type ai_task_type NOT NULL,
  template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. AI Performance Metrics Table
CREATE TABLE ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES ai_model_configs(id) ON DELETE CASCADE,
  domain_juridique domaine_juridique NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  average_response_time DECIMAL(8,2),
  average_accuracy DECIMAL(5,2),
  average_relevance DECIMAL(5,2),
  user_satisfaction_score DECIMAL(5,2),
  response_quality DECIMAL(5,2),
  compliance_score DECIMAL(5,2),
  cost_total DECIMAL(10,6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(model_id, metric_date)
);

-- 5. AI Model Feedback Table
CREATE TABLE ai_model_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usage_log_id UUID NOT NULL REFERENCES ai_usage_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  relevance_rating INTEGER CHECK (relevance_rating >= 1 AND relevance_rating <= 5),
  compliance_rating INTEGER CHECK (compliance_rating >= 1 AND compliance_rating <= 5),
  feedback_text TEXT,
  is_helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. AI Configuration Presets Table
CREATE TABLE ai_config_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  provider ai_provider NOT NULL,
  domain_juridique domaine_juridique NOT NULL,
  task_type ai_task_type NOT NULL,
  configuration JSONB NOT NULL,
  is_system_preset BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_ai_model_configs_provider_domain ON ai_model_configs(provider, domain_juridique);
CREATE INDEX idx_ai_model_configs_active_default ON ai_model_configs(is_active, is_default);
CREATE INDEX idx_ai_model_configs_created_by ON ai_model_configs(created_by);

CREATE INDEX idx_ai_usage_logs_model_date ON ai_usage_logs(model_id, created_at DESC);
CREATE INDEX idx_ai_usage_logs_user_date ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_logs_success ON ai_usage_logs(success);

CREATE INDEX idx_ai_prompt_templates_domain_task ON ai_prompt_templates(domain_juridique, task_type);
CREATE INDEX idx_ai_prompt_templates_active ON ai_prompt_templates(is_active);

CREATE INDEX idx_ai_performance_metrics_model_date ON ai_performance_metrics(model_id, metric_date DESC);
CREATE INDEX idx_ai_performance_metrics_domain_date ON ai_performance_metrics(domain_juridique, metric_date DESC);

CREATE INDEX idx_ai_model_feedback_usage_log ON ai_model_feedback(usage_log_id);
CREATE INDEX idx_ai_model_feedback_user ON ai_model_feedback(user_id);
CREATE INDEX idx_ai_model_feedback_rating ON ai_model_feedback(rating);

CREATE INDEX idx_ai_config_presets_provider_domain ON ai_config_presets(provider, domain_juridique);
CREATE INDEX idx_ai_config_presets_task_type ON ai_config_presets(task_type);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_ai_model_configs_updated_at BEFORE UPDATE ON ai_model_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_prompt_templates_updated_at BEFORE UPDATE ON ai_prompt_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_performance_metrics_updated_at BEFORE UPDATE ON ai_performance_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_config_presets_updated_at BEFORE UPDATE ON ai_config_presets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PostgreSQL functions for AI configuration

-- Function to get default AI model for domain
CREATE OR REPLACE FUNCTION get_default_ai_model(p_domain_juridique domaine_juridique)
RETURNS UUID AS $
DECLARE
    model_id UUID;
BEGIN
    SELECT id INTO model_id
    FROM ai_model_configs
    WHERE domain_juridique = p_domain_juridique
    AND is_default = true
    AND is_active = true
    AND deleted_at IS NULL;
    
    -- If no default model, get the first active model for the domain
    IF model_id IS NULL THEN
        SELECT id INTO model_id
        FROM ai_model_configs
        WHERE domain_juridique = p_domain_juridique
        AND is_active = true
        AND deleted_at IS NULL
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;
    
    RETURN model_id;
END;
$ LANGUAGE plpgsql;

-- Function to update AI performance metrics
CREATE OR REPLACE FUNCTION update_ai_performance_metrics(
    p_model_id UUID,
    p_domain_juridique domaine_juridique,
    p_success BOOLEAN,
    p_response_time INTEGER,
    p_cost DECIMAL
)
RETURNS VOID AS $
DECLARE
    metric_date DATE := CURRENT_DATE;
BEGIN
    INSERT INTO ai_performance_metrics (
        model_id, domain_juridique, metric_date, total_requests,
        successful_requests, average_response_time, cost_total
    ) VALUES (
        p_model_id, p_domain_juridique, metric_date, 1,
        CASE WHEN p_success THEN 1 ELSE 0 END,
        p_response_time, p_cost
    )
    ON CONFLICT (model_id, metric_date) DO UPDATE SET
        total_requests = ai_performance_metrics.total_requests + 1,
        successful_requests = ai_performance_metrics.successful_requests + 
            CASE WHEN p_success THEN 1 ELSE 0 END,
        average_response_time = (
            (ai_performance_metrics.average_response_time * ai_performance_metrics.total_requests) + 
            COALESCE(p_response_time, 0)
        ) / (ai_performance_metrics.total_requests + 1),
        cost_total = ai_performance_metrics.cost_total + COALESCE(p_cost, 0),
        updated_at = CURRENT_TIMESTAMP;
END;
$ LANGUAGE plpgsql;

-- Function to calculate AI model efficiency score
CREATE OR REPLACE FUNCTION calculate_ai_efficiency_score(p_model_id UUID, p_days INTEGER DEFAULT 30)
RETURNS DECIMAL AS $
DECLARE
    efficiency_score DECIMAL;
    success_rate DECIMAL;
    avg_response_time DECIMAL;
    user_satisfaction DECIMAL;
BEGIN
    -- Calculate success rate, average response time, and user satisfaction
    SELECT 
        COALESCE(AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) * 100, 0) as success_rate,
        COALESCE(AVG(response_time_ms), 0) as avg_response_time,
        COALESCE(AVG(f.rating), 3) as user_satisfaction
    INTO success_rate, avg_response_time, user_satisfaction
    FROM ai_usage_logs ul
    LEFT JOIN ai_model_feedback f ON ul.id = f.usage_log_id
    WHERE ul.model_id = p_model_id
    AND ul.created_at > CURRENT_TIMESTAMP - INTERVAL '1 day' * p_days;
    
    -- Calculate efficiency score (weighted average)
    efficiency_score := (
        (success_rate * 0.4) +                    -- 40% weight on success rate
        (GREATEST(0, 100 - (avg_response_time / 100)) * 0.3) + -- 30% weight on speed
        (user_satisfaction * 20 * 0.3)           -- 30% weight on user satisfaction
    );
    
    RETURN LEAST(100, GREATEST(0, efficiency_score));
END;
$ LANGUAGE plpgsql;

-- Function to get AI usage statistics
CREATE OR REPLACE FUNCTION get_ai_usage_statistics(
    p_model_id UUID DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    model_id UUID,
    model_name VARCHAR,
    total_requests BIGINT,
    successful_requests BIGINT,
    success_rate DECIMAL,
    avg_response_time DECIMAL,
    total_tokens BIGINT,
    total_cost DECIMAL,
    efficiency_score DECIMAL
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        amc.id,
        amc.name,
        COUNT(ul.id) as total_requests,
        COUNT(CASE WHEN ul.success THEN 1 END) as successful_requests,
        COALESCE(AVG(CASE WHEN ul.success THEN 1.0 ELSE 0.0 END) * 100, 0) as success_rate,
        COALESCE(AVG(ul.response_time_ms), 0) as avg_response_time,
        COALESCE(SUM(ul.tokens_used), 0) as total_tokens,
        COALESCE(SUM(ul.cost_estimate), 0) as total_cost,
        calculate_ai_efficiency_score(amc.id) as efficiency_score
    FROM ai_model_configs amc
    LEFT JOIN ai_usage_logs ul ON amc.id = ul.model_id
        AND (p_date_from IS NULL OR ul.created_at::date >= p_date_from)
        AND (p_date_to IS NULL OR ul.created_at::date <= p_date_to)
    WHERE (p_model_id IS NULL OR amc.id = p_model_id)
    AND amc.deleted_at IS NULL
    GROUP BY amc.id, amc.name
    ORDER BY total_requests DESC;
END;
$ LANGUAGE plpgsql;

-- Insert default AI model configurations
INSERT INTO ai_model_configs (name, provider, model_id, domain_juridique, configuration, is_default, created_by)
SELECT 
    'GPT-4 Droit Civil', 'openai', 'gpt-4', 'droit_civil',
    '{"temperature": 0.3, "maxTokens": 2000, "systemPrompt": "Vous êtes un assistant juridique spécialisé en droit civil algérien.", "contextWindow": 8000, "rateLimitPerMinute": 60, "rateLimitPerHour": 1000}',
    true, u.id
FROM users u WHERE u.role = 'Administrateur_Plateforme' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ai_model_configs (name, provider, model_id, domain_juridique, configuration, is_default, created_by)
SELECT 
    'GPT-4 Droit Pénal', 'openai', 'gpt-4', 'droit_penal',
    '{"temperature": 0.2, "maxTokens": 2000, "systemPrompt": "Vous êtes un assistant juridique spécialisé en droit pénal algérien.", "contextWindow": 8000, "rateLimitPerMinute": 60, "rateLimitPerHour": 1000}',
    true, u.id
FROM users u WHERE u.role = 'Administrateur_Plateforme' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ai_model_configs (name, provider, model_id, domain_juridique, configuration, is_default, created_by)
SELECT 
    'Claude Droit Commercial', 'anthropic', 'claude-3-sonnet', 'droit_commercial',
    '{"temperature": 0.4, "maxTokens": 2000, "systemPrompt": "Vous êtes un assistant juridique spécialisé en droit commercial algérien.", "contextWindow": 200000, "rateLimitPerMinute": 50, "rateLimitPerHour": 800}',
    true, u.id
FROM users u WHERE u.role = 'Administrateur_Plateforme' LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert default prompt templates
INSERT INTO ai_prompt_templates (name, domain_juridique, task_type, template, variables, created_by)
SELECT 
    'Génération de contrat de vente', 'droit_civil', 'document_generation',
    'Rédigez un contrat de vente immobilière selon le droit algérien avec les éléments suivants:\n- Vendeur: {{vendeur}}\n- Acquéreur: {{acquereur}}\n- Bien: {{description_bien}}\n- Prix: {{prix}} DZD\n- Conditions: {{conditions}}',
    '[{"name": "vendeur", "type": "string", "description": "Nom et prénom du vendeur", "required": true}, {"name": "acquereur", "type": "string", "description": "Nom et prénom de l''acquéreur", "required": true}, {"name": "description_bien", "type": "string", "description": "Description détaillée du bien", "required": true}, {"name": "prix", "type": "number", "description": "Prix de vente en DZD", "required": true}, {"name": "conditions", "type": "string", "description": "Conditions particulières", "required": false}]',
    u.id
FROM users u WHERE u.role = 'Administrateur_Plateforme' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ai_prompt_templates (name, domain_juridique, task_type, template, variables, created_by)
SELECT 
    'Analyse de conformité légale', 'general', 'compliance_check',
    'Analysez la conformité du document suivant avec la législation algérienne:\n\n{{document}}\n\nVeuillez identifier:\n1. Les points conformes\n2. Les non-conformités potentielles\n3. Les recommandations d''amélioration',
    '[{"name": "document", "type": "string", "description": "Contenu du document à analyser", "required": true}]',
    u.id
FROM users u WHERE u.role = 'Administrateur_Plateforme' LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert configuration presets
INSERT INTO ai_config_presets (name, description, provider, domain_juridique, task_type, configuration, is_system_preset)
VALUES 
('Précis et Formel', 'Configuration pour des réponses précises et formelles', 'openai', 'general', 'document_generation', 
 '{"temperature": 0.2, "maxTokens": 2000, "topP": 0.9, "frequencyPenalty": 0.1, "presencePenalty": 0.1}', true),
('Créatif et Flexible', 'Configuration pour des réponses créatives et flexibles', 'openai', 'general', 'document_generation',
 '{"temperature": 0.7, "maxTokens": 2000, "topP": 0.95, "frequencyPenalty": 0.2, "presencePenalty": 0.2}', true),
('Analyse Approfondie', 'Configuration optimisée pour l''analyse juridique', 'anthropic', 'general', 'legal_analysis',
 '{"temperature": 0.3, "maxTokens": 4000, "topP": 0.9}', true);

COMMENT ON TABLE ai_model_configs IS 'Configurations des modèles IA par domaine juridique';
COMMENT ON TABLE ai_usage_logs IS 'Logs d''utilisation des modèles IA avec métriques de performance';
COMMENT ON TABLE ai_prompt_templates IS 'Templates de prompts réutilisables par domaine et type de tâche';
COMMENT ON TABLE ai_performance_metrics IS 'Métriques de performance agrégées des modèles IA';
COMMENT ON TABLE ai_model_feedback IS 'Feedback des utilisateurs sur les réponses des modèles IA';
COMMENT ON TABLE ai_config_presets IS 'Presets de configuration prédéfinis pour différents cas d''usage';

COMMENT ON COLUMN ai_model_configs.configuration IS 'Configuration JSON du modèle (température, tokens, prompts système, etc.)';
COMMENT ON COLUMN ai_usage_logs.tokens_used IS 'Nombre de tokens utilisés pour cette requête';
COMMENT ON COLUMN ai_usage_logs.cost_estimate IS 'Coût estimé de la requête en USD';
COMMENT ON COLUMN ai_performance_metrics.compliance_score IS 'Score de conformité légale des réponses (0-100)';