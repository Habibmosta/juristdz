-- Migration 017: Tables pour le système de sécurité et isolation multi-tenant
-- Création des tables pour la gestion du chiffrement et de l'audit de sécurité

-- Table des clés de chiffrement par tenant
CREATE TABLE IF NOT EXISTS tenant_encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    key_id VARCHAR(255) NOT NULL UNIQUE,
    key_metadata JSONB NOT NULL, -- Métadonnées de la clé (algorithme, longueur, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    rotated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    rotation_count INTEGER DEFAULT 0,
    
    CONSTRAINT unique_active_tenant_key UNIQUE (tenant_id, is_active) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Index pour les requêtes de clés actives
CREATE INDEX idx_tenant_keys_active ON tenant_encryption_keys (tenant_id, is_active) 
    WHERE is_active = true;

-- Index pour la rotation des clés
CREATE INDEX idx_tenant_keys_rotation ON tenant_encryption_keys (expires_at, is_active);

-- Table des contextes d'isolation par tenant
CREATE TABLE IF NOT EXISTS tenant_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL UNIQUE,
    organization_id VARCHAR(255) NOT NULL,
    organization_name VARCHAR(500) NOT NULL,
    organization_type VARCHAR(100) NOT NULL, -- barreau, etude_notariale, tribunal, etc.
    region VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    -- Configuration de sécurité par tenant
    security_config JSONB DEFAULT '{
        "encryption_required": true,
        "key_rotation_days": 90,
        "audit_level": "full",
        "data_retention_days": 2555,
        "cross_tenant_access": false
    }'::jsonb,
    
    -- Métadonnées d'isolation
    isolation_metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour les requêtes par organisation
CREATE INDEX idx_tenant_contexts_org ON tenant_contexts (organization_id);
CREATE INDEX idx_tenant_contexts_type ON tenant_contexts (organization_type);
CREATE INDEX idx_tenant_contexts_active ON tenant_contexts (is_active) WHERE is_active = true;

-- Table des logs d'audit de sécurité
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    
    -- Informations sur l'action
    action_type VARCHAR(100) NOT NULL, -- access, create, update, delete, encrypt, decrypt
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    
    -- Contexte de sécurité
    security_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Résultat de l'action
    success BOOLEAN NOT NULL,
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Informations de traçabilité
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(255),
    
    -- Métadonnées additionnelles
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Horodatage
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les requêtes d'audit
CREATE INDEX idx_security_audit_tenant ON security_audit_logs (tenant_id, timestamp DESC);
CREATE INDEX idx_security_audit_user ON security_audit_logs (user_id, timestamp DESC);
CREATE INDEX idx_security_audit_action ON security_audit_logs (action_type, timestamp DESC);
CREATE INDEX idx_security_audit_resource ON security_audit_logs (resource_type, resource_id);
CREATE INDEX idx_security_audit_failed ON security_audit_logs (success, timestamp DESC) 
    WHERE success = false;

-- Table des violations de sécurité détectées
CREATE TABLE IF NOT EXISTS security_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    violation_type VARCHAR(100) NOT NULL, -- cross_tenant_access, unauthorized_decrypt, etc.
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    
    -- Détails de la violation
    description TEXT NOT NULL,
    affected_resources JSONB DEFAULT '[]'::jsonb,
    
    -- Contexte de la violation
    user_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Statut de traitement
    status VARCHAR(50) DEFAULT 'open', -- open, investigating, resolved, false_positive
    assigned_to VARCHAR(255),
    resolution_notes TEXT,
    
    -- Horodatage
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour les violations de sécurité
CREATE INDEX idx_security_violations_tenant ON security_violations (tenant_id, detected_at DESC);
CREATE INDEX idx_security_violations_severity ON security_violations (severity, status);
CREATE INDEX idx_security_violations_status ON security_violations (status, detected_at DESC);
CREATE INDEX idx_security_violations_type ON security_violations (violation_type, detected_at DESC);

-- Table des données chiffrées (pour le stockage sécurisé)
CREATE TABLE IF NOT EXISTS encrypted_data_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    data_type VARCHAR(100) NOT NULL, -- document, client_info, case_data, etc.
    data_id VARCHAR(255) NOT NULL, -- ID de la donnée originale
    
    -- Données chiffrées
    encrypted_content TEXT NOT NULL,
    encryption_metadata JSONB NOT NULL, -- IV, tag, algorithm, key_id
    
    -- Métadonnées de recherche (hashées)
    searchable_hash VARCHAR(255), -- Hash pour la recherche sans déchiffrement
    content_hash VARCHAR(255) NOT NULL, -- Hash pour l'intégrité
    
    -- Informations de versioning
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES encrypted_data_store(id),
    
    -- Horodatage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes d'unicité par tenant
    CONSTRAINT unique_tenant_data UNIQUE (tenant_id, data_type, data_id, version)
);

-- Index pour les données chiffrées
CREATE INDEX idx_encrypted_data_tenant ON encrypted_data_store (tenant_id, data_type);
CREATE INDEX idx_encrypted_data_search ON encrypted_data_store (tenant_id, searchable_hash);
CREATE INDEX idx_encrypted_data_integrity ON encrypted_data_store (content_hash);
CREATE INDEX idx_encrypted_data_version ON encrypted_data_store (data_id, version DESC);

-- Table des sessions sécurisées
CREATE TABLE IF NOT EXISTS secure_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    tenant_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    
    -- Informations de session
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Contexte de sécurité
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- État de la session
    is_active BOOLEAN DEFAULT true,
    is_mfa_verified BOOLEAN DEFAULT false,
    
    -- Métadonnées de session chiffrées
    encrypted_session_data TEXT,
    session_metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour les sessions
CREATE INDEX idx_secure_sessions_user ON secure_sessions (user_id, is_active);
CREATE INDEX idx_secure_sessions_tenant ON secure_sessions (tenant_id, is_active);
CREATE INDEX idx_secure_sessions_expiry ON secure_sessions (expires_at) WHERE is_active = true;
CREATE INDEX idx_secure_sessions_activity ON secure_sessions (last_activity DESC);

-- Fonctions de sécurité

-- Fonction pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE secure_sessions 
    SET is_active = false 
    WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Log de l'opération de nettoyage
    INSERT INTO security_audit_logs (
        tenant_id, user_id, action_type, resource_type, 
        success, metadata, timestamp
    ) VALUES (
        'system', 'system', 'cleanup', 'sessions',
        true, jsonb_build_object('cleaned_sessions', cleaned_count),
        CURRENT_TIMESTAMP
    );
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour détecter les tentatives d'accès cross-tenant
CREATE OR REPLACE FUNCTION detect_cross_tenant_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier si l'utilisateur tente d'accéder à des données d'un autre tenant
    IF NEW.tenant_id IS NOT NULL AND OLD.tenant_id IS NOT NULL 
       AND NEW.tenant_id != OLD.tenant_id THEN
        
        -- Enregistrer la violation
        INSERT INTO security_violations (
            tenant_id, violation_type, severity, description,
            user_id, detected_at
        ) VALUES (
            OLD.tenant_id, 'cross_tenant_access', 'high',
            'Tentative de modification cross-tenant détectée',
            current_setting('app.current_user_id', true),
            CURRENT_TIMESTAMP
        );
        
        -- Empêcher la modification
        RAISE EXCEPTION 'Violation de sécurité: accès cross-tenant interdit';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour l'audit automatique des accès aux données sensibles
CREATE OR REPLACE FUNCTION audit_sensitive_data_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Enregistrer l'accès aux données sensibles
    INSERT INTO security_audit_logs (
        tenant_id, user_id, action_type, resource_type, resource_id,
        success, security_context, timestamp
    ) VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        current_setting('app.current_user_id', true),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        true,
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', CURRENT_TIMESTAMP
        ),
        CURRENT_TIMESTAMP
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Tâche de maintenance automatique (à exécuter périodiquement)
CREATE OR REPLACE FUNCTION security_maintenance()
RETURNS void AS $$
BEGIN
    -- Nettoyer les sessions expirées
    PERFORM cleanup_expired_sessions();
    
    -- Nettoyer les anciens logs d'audit (garder 1 an)
    DELETE FROM security_audit_logs 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 year';
    
    -- Nettoyer les violations résolues anciennes (garder 2 ans)
    DELETE FROM security_violations 
    WHERE status = 'resolved' 
    AND resolved_at < CURRENT_TIMESTAMP - INTERVAL '2 years';
    
    -- Log de la maintenance
    INSERT INTO security_audit_logs (
        tenant_id, user_id, action_type, resource_type,
        success, metadata, timestamp
    ) VALUES (
        'system', 'system', 'maintenance', 'security',
        true, jsonb_build_object('maintenance_completed', true),
        CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;

-- Triggers pour l'audit automatique sur les tables sensibles
-- (À appliquer sur les tables contenant des données sensibles)

-- Commentaires sur les tables
COMMENT ON TABLE tenant_encryption_keys IS 'Gestion des clés de chiffrement par tenant pour l''isolation sécurisée';
COMMENT ON TABLE tenant_contexts IS 'Contextes d''isolation multi-tenant avec configuration de sécurité';
COMMENT ON TABLE security_audit_logs IS 'Logs d''audit complets pour la traçabilité des accès';
COMMENT ON TABLE security_violations IS 'Détection et suivi des violations de sécurité';
COMMENT ON TABLE encrypted_data_store IS 'Stockage sécurisé des données sensibles chiffrées';
COMMENT ON TABLE secure_sessions IS 'Gestion des sessions sécurisées avec isolation tenant';

-- Permissions restrictives
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON security_audit_logs TO app_user;
GRANT SELECT ON tenant_contexts TO app_user;
GRANT SELECT ON tenant_encryption_keys TO app_user;
GRANT SELECT, INSERT, UPDATE ON security_violations TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON encrypted_data_store TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON secure_sessions TO app_user;