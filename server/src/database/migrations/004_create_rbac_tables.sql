-- Create RBAC (Role-Based Access Control) tables

-- Create roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  profession VARCHAR(50) NOT NULL CHECK (profession IN (
    'avocat', 'notaire', 'huissier', 'magistrat', 
    'etudiant', 'juriste_entreprise', 'admin'
  )),
  description TEXT,
  organization_id UUID REFERENCES organizations(id),
  is_custom BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique role names per profession and organization
  UNIQUE(name, profession, organization_id)
);

-- Create permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(100) NOT NULL,
  actions TEXT[] NOT NULL,
  conditions JSONB,
  scope VARCHAR(50) NOT NULL CHECK (scope IN (
    'global', 'organization', 'personal', 'role_specific'
  )),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique permissions per resource and scope
  UNIQUE(resource, scope, actions)
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  conditions JSONB, -- Additional conditions specific to this role-permission assignment
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique role-permission combinations
  UNIQUE(role_id, permission_id)
);

-- Create user_role_assignments table (replaces simple profession in user_profiles)
CREATE TABLE user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- Ensure unique active role assignments per user and organization
  UNIQUE(user_id, role_id, organization_id)
);

-- Create access_control_cache table for performance optimization
CREATE TABLE access_control_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  context_hash VARCHAR(64) NOT NULL, -- Hash of access context for cache key
  has_permission BOOLEAN NOT NULL,
  conditions JSONB,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  -- Ensure unique cache entries
  UNIQUE(user_id, resource, action, context_hash)
);

-- Create audit_log table for access control auditing
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  organization_id UUID REFERENCES organizations(id),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  additional_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_roles_profession ON roles(profession);
CREATE INDEX idx_roles_organization ON roles(organization_id);
CREATE INDEX idx_roles_active ON roles(is_active);

CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_scope ON permissions(scope);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

CREATE INDEX idx_user_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX idx_user_role_assignments_role ON user_role_assignments(role_id);
CREATE INDEX idx_user_role_assignments_org ON user_role_assignments(organization_id);
CREATE INDEX idx_user_role_assignments_active ON user_role_assignments(is_active);

CREATE INDEX idx_access_control_cache_user ON access_control_cache(user_id);
CREATE INDEX idx_access_control_cache_resource ON access_control_cache(resource, action);
CREATE INDEX idx_access_control_cache_expires ON access_control_cache(expires_at);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_audit_log_organization ON audit_log(organization_id);

-- Create triggers for updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles for each profession
INSERT INTO roles (name, profession, description, is_custom) VALUES
  ('Avocat Standard', 'avocat', 'Rôle standard pour les avocats avec permissions de base', false),
  ('Notaire Standard', 'notaire', 'Rôle standard pour les notaires avec accès au minutier électronique', false),
  ('Huissier Standard', 'huissier', 'Rôle standard pour les huissiers avec permissions de signification', false),
  ('Magistrat Standard', 'magistrat', 'Rôle standard pour les magistrats avec accès étendu à la jurisprudence', false),
  ('Étudiant Standard', 'etudiant', 'Rôle standard pour les étudiants avec accès limité et mode apprentissage', false),
  ('Juriste Entreprise Standard', 'juriste_entreprise', 'Rôle standard pour les juristes d''entreprise', false),
  ('Administrateur Système', 'admin', 'Rôle administrateur avec accès complet au système', false);

-- Insert default permissions (will be populated by the RBAC service initialization)
-- This will be done programmatically to ensure consistency with TypeScript definitions

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM access_control_cache WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to invalidate user cache on role changes
CREATE OR REPLACE FUNCTION invalidate_user_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Invalidate cache for affected user
  DELETE FROM access_control_cache 
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to invalidate cache on role changes
CREATE TRIGGER invalidate_cache_on_role_assignment 
  AFTER INSERT OR UPDATE OR DELETE ON user_role_assignments
  FOR EACH ROW EXECUTE FUNCTION invalidate_user_cache();

CREATE TRIGGER invalidate_cache_on_role_permission_change
  AFTER INSERT OR UPDATE OR DELETE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION invalidate_user_cache();