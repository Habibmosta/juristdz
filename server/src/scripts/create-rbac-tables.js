const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://juristdz_user:juristdz_password_2024@localhost:5433/juristdz_db',
});

async function createRBACTables() {
  const client = await pool.connect();
  
  try {
    console.log('Creating RBAC tables...');
    
    // Create roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        profession VARCHAR(50) NOT NULL CHECK (profession IN (
          'avocat', 'notaire', 'huissier', 'magistrat', 
          'etudiant', 'juriste_entreprise', 'admin'
        )),
        description TEXT,
        organization_id UUID,
        is_custom BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, profession, organization_id)
      );
    `);
    console.log('✓ roles table created');
    
    // Create permissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
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
        UNIQUE(resource, scope, actions)
      );
    `);
    console.log('✓ permissions table created');
    
    // Create role_permissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        conditions JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_id, permission_id)
      );
    `);
    console.log('✓ role_permissions table created');
    
    // Create user_roles table (simpler version)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        organization_id UUID,
        assigned_by UUID REFERENCES users(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        UNIQUE(user_id, role_id, organization_id)
      );
    `);
    console.log('✓ user_roles table created');
    
    // Insert default roles
    await client.query(`
      INSERT INTO roles (name, profession, description, is_custom) VALUES
        ('Avocat Standard', 'avocat', 'Rôle standard pour les avocats', false),
        ('Notaire Standard', 'notaire', 'Rôle standard pour les notaires', false),
        ('Huissier Standard', 'huissier', 'Rôle standard pour les huissiers', false),
        ('Magistrat Standard', 'magistrat', 'Rôle standard pour les magistrats', false),
        ('Étudiant Standard', 'etudiant', 'Rôle standard pour les étudiants', false),
        ('Juriste Entreprise Standard', 'juriste_entreprise', 'Rôle standard pour les juristes', false),
        ('Administrateur Système', 'admin', 'Rôle administrateur', false)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Default roles inserted');
    
    // Insert basic permissions
    await client.query(`
      INSERT INTO permissions (resource, actions, scope, description) VALUES
        ('user', ARRAY['create', 'read', 'update', 'delete'], 'global', 'User management'),
        ('user', ARRAY['read'], 'organization', 'Read users in organization'),
        ('document', ARRAY['create', 'read', 'update', 'delete'], 'global', 'Document management'),
        ('document', ARRAY['read'], 'personal', 'Read own documents'),
        ('case', ARRAY['create', 'read', 'update', 'delete'], 'global', 'Case management'),
        ('case', ARRAY['read'], 'personal', 'Read own cases'),
        ('admin', ARRAY['read', 'update'], 'global', 'Admin operations')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Default permissions inserted');
    
    console.log('\n✅ RBAC tables created successfully!');
    
  } catch (error) {
    console.error('Error creating RBAC tables:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createRBACTables();