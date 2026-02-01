-- Create case management tables for lawyers (Avocats)

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('individual', 'company')),
  
  -- Individual client fields
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  place_of_birth VARCHAR(255),
  nationality VARCHAR(100),
  id_card_number VARCHAR(50),
  
  -- Company client fields
  company_name VARCHAR(255),
  legal_form VARCHAR(100),
  registration_number VARCHAR(100),
  tax_number VARCHAR(100),
  
  -- Common contact information
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  fax VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Algeria',
  
  -- Professional information
  profession VARCHAR(255),
  employer VARCHAR(255),
  
  -- Legal information
  marital_status VARCHAR(50),
  legal_representative_name VARCHAR(255),
  legal_representative_capacity VARCHAR(100),
  
  -- System fields
  created_by UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  -- Constraints
  CONSTRAINT clients_individual_check CHECK (
    (type = 'individual' AND first_name IS NOT NULL AND last_name IS NOT NULL) OR
    (type = 'company' AND company_name IS NOT NULL)
  )
);

-- Create cases table (dossiers)
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Case classification
  legal_domain VARCHAR(50) NOT NULL CHECK (legal_domain IN (
    'civil', 'criminal', 'commercial', 'administrative', 'family',
    'labor', 'tax', 'constitutional', 'international'
  )),
  case_type VARCHAR(100) NOT NULL,
  urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN (
    'low', 'normal', 'high', 'urgent'
  )),
  
  -- Parties
  client_id UUID NOT NULL REFERENCES clients(id),
  opposing_party TEXT,
  opposing_counsel VARCHAR(255),
  
  -- Court information
  court_id UUID REFERENCES courts(id),
  court_name VARCHAR(255),
  judge_name VARCHAR(255),
  case_reference VARCHAR(100),
  
  -- Status and dates
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN (
    'open', 'in_progress', 'pending', 'closed', 'archived', 'cancelled'
  )),
  opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
  closed_date DATE,
  next_hearing_date TIMESTAMP,
  statute_limitations_date DATE,
  
  -- Financial information
  estimated_value DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'DZD',
  fee_arrangement VARCHAR(50) CHECK (fee_arrangement IN (
    'hourly', 'fixed', 'contingency', 'mixed'
  )),
  hourly_rate DECIMAL(10,2),
  fixed_fee DECIMAL(15,2),
  contingency_percentage DECIMAL(5,2),
  
  -- Assignment
  assigned_lawyer_id UUID NOT NULL REFERENCES users(id),
  supervising_lawyer_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  
  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- Ensure unique case numbers per organization
  UNIQUE(case_number, organization_id)
);

-- Create case_documents junction table
CREATE TABLE case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_role VARCHAR(100), -- 'pleading', 'evidence', 'correspondence', 'contract', etc.
  added_by UUID NOT NULL REFERENCES users(id),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  
  -- Prevent duplicate associations
  UNIQUE(case_id, document_id)
);

-- Create case_events table for timeline tracking
CREATE TABLE case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'hearing', 'deadline', 'filing', 'meeting', 'call', 'email',
    'payment', 'settlement', 'judgment', 'appeal', 'other'
  )),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP NOT NULL,
  duration_minutes INTEGER,
  location VARCHAR(255),
  
  -- Participants
  participants JSONB DEFAULT '[]',
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'completed', 'cancelled', 'postponed'
  )),
  
  -- Reminders and notifications
  reminder_date TIMESTAMP,
  is_billable BOOLEAN DEFAULT false,
  billable_hours DECIMAL(4,2),
  
  -- System fields
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create case_notes table for internal notes
CREATE TABLE case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'general' CHECK (note_type IN (
    'general', 'strategy', 'research', 'client_communication', 'internal'
  )),
  is_confidential BOOLEAN DEFAULT false,
  
  -- System fields
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create case_contacts table for additional contacts
CREATE TABLE case_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  contact_type VARCHAR(50) NOT NULL CHECK (contact_type IN (
    'witness', 'expert', 'interpreter', 'court_clerk', 'opposing_counsel',
    'mediator', 'arbitrator', 'other'
  )),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(255),
  title VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  address TEXT,
  notes TEXT,
  
  -- System fields
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create case_deadlines table for deadline tracking
CREATE TABLE case_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline_date TIMESTAMP NOT NULL,
  deadline_type VARCHAR(50) NOT NULL CHECK (deadline_type IN (
    'filing', 'response', 'discovery', 'hearing', 'appeal', 'payment', 'other'
  )),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN (
    'low', 'medium', 'high', 'critical'
  )),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'missed', 'extended'
  )),
  completed_date TIMESTAMP,
  
  -- Notifications
  notification_days_before INTEGER[] DEFAULT ARRAY[7, 3, 1],
  last_notification_sent TIMESTAMP,
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  
  -- System fields
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create case_time_entries table for time tracking
CREATE TABLE case_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES users(id),
  
  -- Time information
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  
  -- Activity details
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
    'research', 'drafting', 'review', 'meeting', 'call', 'hearing',
    'travel', 'correspondence', 'filing', 'negotiation', 'other'
  )),
  description TEXT NOT NULL,
  
  -- Billing information
  is_billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  total_amount DECIMAL(15,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'approved', 'billed'
  )),
  
  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create case_expenses table for expense tracking
CREATE TABLE case_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Expense details
  expense_type VARCHAR(50) NOT NULL CHECK (expense_type IN (
    'court_fees', 'filing_fees', 'expert_fees', 'travel', 'accommodation',
    'meals', 'copying', 'postage', 'research', 'other'
  )),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'DZD',
  expense_date DATE NOT NULL,
  
  -- Documentation
  receipt_number VARCHAR(100),
  vendor VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'reimbursed', 'billed_to_client'
  )),
  
  -- System fields
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_clients_created_by ON clients(created_by);
CREATE INDEX idx_clients_organization ON clients(organization_id);
CREATE INDEX idx_clients_type ON clients(type);
CREATE INDEX idx_clients_active ON clients(is_active);
CREATE INDEX idx_clients_name ON clients(last_name, first_name);
CREATE INDEX idx_clients_company ON clients(company_name);

CREATE INDEX idx_cases_client ON cases(client_id);
CREATE INDEX idx_cases_lawyer ON cases(assigned_lawyer_id);
CREATE INDEX idx_cases_organization ON cases(organization_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_domain ON cases(legal_domain);
CREATE INDEX idx_cases_opened_date ON cases(opened_date DESC);
CREATE INDEX idx_cases_next_hearing ON cases(next_hearing_date);
CREATE INDEX idx_cases_case_number ON cases(case_number);

CREATE INDEX idx_case_documents_case ON case_documents(case_id);
CREATE INDEX idx_case_documents_document ON case_documents(document_id);
CREATE INDEX idx_case_documents_role ON case_documents(document_role);

CREATE INDEX idx_case_events_case ON case_events(case_id);
CREATE INDEX idx_case_events_date ON case_events(event_date);
CREATE INDEX idx_case_events_type ON case_events(event_type);
CREATE INDEX idx_case_events_status ON case_events(status);

CREATE INDEX idx_case_notes_case ON case_notes(case_id);
CREATE INDEX idx_case_notes_type ON case_notes(note_type);
CREATE INDEX idx_case_notes_created_by ON case_notes(created_by);

CREATE INDEX idx_case_contacts_case ON case_contacts(case_id);
CREATE INDEX idx_case_contacts_type ON case_contacts(contact_type);

CREATE INDEX idx_case_deadlines_case ON case_deadlines(case_id);
CREATE INDEX idx_case_deadlines_date ON case_deadlines(deadline_date);
CREATE INDEX idx_case_deadlines_status ON case_deadlines(status);
CREATE INDEX idx_case_deadlines_assigned ON case_deadlines(assigned_to);

CREATE INDEX idx_case_time_entries_case ON case_time_entries(case_id);
CREATE INDEX idx_case_time_entries_lawyer ON case_time_entries(lawyer_id);
CREATE INDEX idx_case_time_entries_date ON case_time_entries(start_time);
CREATE INDEX idx_case_time_entries_billable ON case_time_entries(is_billable);

CREATE INDEX idx_case_expenses_case ON case_expenses(case_id);
CREATE INDEX idx_case_expenses_date ON case_expenses(expense_date);
CREATE INDEX idx_case_expenses_type ON case_expenses(expense_type);
CREATE INDEX idx_case_expenses_status ON case_expenses(status);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER clients_updated_at_trigger
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cases_updated_at_trigger
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER case_events_updated_at_trigger
  BEFORE UPDATE ON case_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER case_notes_updated_at_trigger
  BEFORE UPDATE ON case_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER case_contacts_updated_at_trigger
  BEFORE UPDATE ON case_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER case_deadlines_updated_at_trigger
  BEFORE UPDATE ON case_deadlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER case_time_entries_updated_at_trigger
  BEFORE UPDATE ON case_time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER case_expenses_updated_at_trigger
  BEFORE UPDATE ON case_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate case numbers
CREATE OR REPLACE FUNCTION generate_case_number(org_id UUID, year INTEGER DEFAULT NULL)
RETURNS VARCHAR(100) AS $
DECLARE
  case_year INTEGER;
  case_count INTEGER;
  case_number VARCHAR(100);
BEGIN
  -- Use current year if not specified
  case_year := COALESCE(year, EXTRACT(YEAR FROM CURRENT_DATE));
  
  -- Get count of cases for this year and organization
  SELECT COUNT(*) + 1 INTO case_count
  FROM cases 
  WHERE organization_id = org_id 
  AND EXTRACT(YEAR FROM opened_date) = case_year;
  
  -- Format: YYYY-ORG-NNNN (e.g., 2024-ORG-0001)
  case_number := case_year || '-' || SUBSTRING(org_id::TEXT FROM 1 FOR 8) || '-' || LPAD(case_count::TEXT, 4, '0');
  
  RETURN case_number;
END;
$ LANGUAGE plpgsql;

-- Create function to calculate case statistics
CREATE OR REPLACE FUNCTION get_case_statistics(lawyer_id UUID, start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE (
  total_cases INTEGER,
  open_cases INTEGER,
  closed_cases INTEGER,
  total_billable_hours DECIMAL(10,2),
  total_revenue DECIMAL(15,2),
  avg_case_duration DECIMAL(10,2)
) AS $
DECLARE
  filter_start_date DATE;
  filter_end_date DATE;
BEGIN
  -- Set default date range if not provided
  filter_start_date := COALESCE(start_date, CURRENT_DATE - INTERVAL '1 year');
  filter_end_date := COALESCE(end_date, CURRENT_DATE);
  
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_cases,
    COUNT(CASE WHEN c.status IN ('open', 'in_progress', 'pending') THEN 1 END)::INTEGER as open_cases,
    COUNT(CASE WHEN c.status = 'closed' THEN 1 END)::INTEGER as closed_cases,
    COALESCE(SUM(te.duration_minutes) / 60.0, 0)::DECIMAL(10,2) as total_billable_hours,
    COALESCE(SUM(te.total_amount), 0)::DECIMAL(15,2) as total_revenue,
    COALESCE(AVG(EXTRACT(DAYS FROM c.closed_date - c.opened_date)), 0)::DECIMAL(10,2) as avg_case_duration
  FROM cases c
  LEFT JOIN case_time_entries te ON c.id = te.case_id AND te.is_billable = true
  WHERE c.assigned_lawyer_id = lawyer_id
  AND c.opened_date BETWEEN filter_start_date AND filter_end_date;
END;
$ LANGUAGE plpgsql;

-- Create view for case overview
CREATE VIEW case_overview AS
SELECT 
  c.id,
  c.case_number,
  c.title,
  c.legal_domain,
  c.case_type,
  c.status,
  c.urgency_level,
  c.opened_date,
  c.closed_date,
  c.next_hearing_date,
  
  -- Client information
  cl.first_name as client_first_name,
  cl.last_name as client_last_name,
  cl.company_name as client_company_name,
  cl.type as client_type,
  
  -- Lawyer information
  u.email as assigned_lawyer_email,
  up.first_name as lawyer_first_name,
  up.last_name as lawyer_last_name,
  
  -- Court information
  co.name as court_name,
  c.judge_name,
  
  -- Statistics
  (SELECT COUNT(*) FROM case_documents cd WHERE cd.case_id = c.id) as document_count,
  (SELECT COUNT(*) FROM case_events ce WHERE ce.case_id = c.id) as event_count,
  (SELECT COUNT(*) FROM case_deadlines cd WHERE cd.case_id = c.id AND cd.status = 'pending') as pending_deadlines,
  (SELECT SUM(duration_minutes) / 60.0 FROM case_time_entries cte WHERE cte.case_id = c.id AND cte.is_billable = true) as billable_hours,
  (SELECT SUM(total_amount) FROM case_time_entries cte WHERE cte.case_id = c.id) as total_fees
  
FROM cases c
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN users u ON c.assigned_lawyer_id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id AND up.is_primary = true
LEFT JOIN courts co ON c.court_id = co.id;

-- Insert sample data for testing
INSERT INTO clients (type, first_name, last_name, email, phone, address, city, created_by) VALUES
  ('individual', 'Ahmed', 'Benali', 'ahmed.benali@email.com', '+213555123456', '123 Rue Didouche Mourad', 'Alger', (SELECT id FROM users LIMIT 1)),
  ('individual', 'Fatima', 'Khelifi', 'fatima.khelifi@email.com', '+213555654321', '456 Boulevard Mohamed V', 'Oran', (SELECT id FROM users LIMIT 1)),
  ('company', NULL, NULL, 'contact@entreprise-dz.com', '+213555789012', '789 Zone Industrielle', 'Constantine', (SELECT id FROM users LIMIT 1));

UPDATE clients SET company_name = 'Entreprise Algérienne SARL', legal_form = 'SARL', registration_number = '24/00123456' 
WHERE type = 'company';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON cases TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON case_documents TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON case_events TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON case_notes TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON case_contacts TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON case_deadlines TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON case_time_entries TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON case_expenses TO app_user;
GRANT SELECT ON case_overview TO app_user;