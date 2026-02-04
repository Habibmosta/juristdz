-- JuristDZ - Supabase Database Schema
-- Tables for case management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cases table for legal case management
CREATE TABLE IF NOT EXISTS cases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    client_name VARCHAR(200) NOT NULL,
    client_phone VARCHAR(20),
    client_email VARCHAR(100),
    client_address TEXT,
    description TEXT NOT NULL,
    case_type VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    estimated_value DECIMAL(15,2),
    deadline DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    notes TEXT,
    assigned_lawyer VARCHAR(200),
    tags TEXT[], -- Array of tags
    documents TEXT[], -- Array of document URLs/paths
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID, -- For multi-user support
    
    -- Indexes for better performance
    CONSTRAINT cases_title_check CHECK (LENGTH(title) > 0),
    CONSTRAINT cases_client_name_check CHECK (LENGTH(client_name) > 0),
    CONSTRAINT cases_description_check CHECK (LENGTH(description) > 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_case_type ON cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_deadline ON cases(deadline);
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_cases_updated_at 
    BEFORE UPDATE ON cases 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own cases
CREATE POLICY "Users can view own cases" ON cases
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own cases
CREATE POLICY "Users can insert own cases" ON cases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own cases
CREATE POLICY "Users can update own cases" ON cases
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own cases (archive them)
CREATE POLICY "Users can delete own cases" ON cases
    FOR DELETE USING (auth.uid() = user_id);

-- Insert some sample data (optional - for testing)
INSERT INTO cases (
    title, 
    client_name, 
    client_phone, 
    client_email, 
    client_address,
    description, 
    case_type, 
    priority, 
    estimated_value, 
    deadline,
    notes,
    assigned_lawyer,
    tags
) VALUES 
(
    'Affaire Benali vs. Société SARL',
    'M. Ahmed Benali',
    '+213 555 123 456',
    'ahmed.benali@email.com',
    '15 Rue Didouche Mourad, Alger',
    'Litige commercial concernant un contrat de fourniture non respecté. Le client réclame des dommages-intérêts.',
    'Droit Commercial',
    'high',
    2500000.00,
    '2024-03-15',
    'Client très préoccupé par les délais. Prévoir une médiation avant procès.',
    'Maître Dupont',
    ARRAY['commercial', 'contrat', 'fourniture']
),
(
    'Divorce contentieux Mme Khadija',
    'Mme Khadija Mansouri',
    '+213 555 987 654',
    'khadija.mansouri@email.com',
    '42 Boulevard Mohamed V, Oran',
    'Procédure de divorce contentieux avec demande de garde des enfants et pension alimentaire.',
    'Droit de la Famille',
    'medium',
    500000.00,
    '2024-03-20',
    'Situation familiale complexe. Enfants mineurs impliqués.',
    'Maître Martin',
    ARRAY['famille', 'divorce', 'garde']
),
(
    'Succession M. Brahim',
    'Famille Brahim',
    '+213 555 456 789',
    'famille.brahim@email.com',
    '8 Rue Larbi Ben M''hidi, Constantine',
    'Règlement de succession avec biens immobiliers et mobiliers. Plusieurs héritiers.',
    'Droit Civil',
    'low',
    15000000.00,
    '2024-04-30',
    'Inventaire des biens en cours. Attendre expertise immobilière.',
    'Maître Dubois',
    ARRAY['succession', 'immobilier', 'héritage']
);

-- Create a view for case statistics
CREATE OR REPLACE VIEW case_statistics AS
SELECT 
    COUNT(*) as total_cases,
    COUNT(*) FILTER (WHERE status = 'active') as active_cases,
    COUNT(*) FILTER (WHERE status = 'archived') as archived_cases,
    COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_cases,
    COUNT(*) FILTER (WHERE priority = 'high') as high_priority_cases,
    COUNT(*) FILTER (WHERE deadline <= CURRENT_DATE + INTERVAL '7 days' AND status = 'active') as upcoming_deadlines,
    COALESCE(SUM(estimated_value) FILTER (WHERE status = 'active'), 0) as total_estimated_value,
    COALESCE(AVG(estimated_value) FILTER (WHERE status = 'active'), 0) as average_estimated_value
FROM cases
WHERE user_id = auth.uid();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON cases TO authenticated;
GRANT SELECT ON case_statistics TO authenticated;