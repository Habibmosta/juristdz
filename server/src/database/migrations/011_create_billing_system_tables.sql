-- Create billing and fee calculation system tables for Algerian legal system

-- Create billing_calculations table
CREATE TABLE billing_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  client_id UUID NOT NULL,
  lawyer_id UUID NOT NULL REFERENCES users(id),
  profession VARCHAR(50) NOT NULL CHECK (profession IN (
    'avocat', 'notaire', 'huissier', 'commissaire_priseur', 'expert_judiciaire'
  )),
  calculation_type VARCHAR(50) NOT NULL CHECK (calculation_type IN (
    'hourly_rate', 'fixed_fee', 'percentage_fee', 'court_scale', 
    'notarial_scale', 'bailiff_scale', 'mixed_calculation'
  )),
  
  -- Amounts
  base_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  final_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'DZD',
  
  -- Calculation details
  calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  parameters JSONB DEFAULT '{}',
  breakdown JSONB DEFAULT '{}',
  
  -- Status and approval
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft', 'calculated', 'approved', 'invoiced', 'paid', 'disputed', 'cancelled'
  )),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  
  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create algerian_fee_schedules table
CREATE TABLE algerian_fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profession VARCHAR(50) NOT NULL CHECK (profession IN (
    'avocat', 'notaire', 'huissier', 'commissaire_priseur', 'expert_judiciaire'
  )),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  
  -- Fee structure
  minimum_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
  maximum_fee DECIMAL(15,2),
  percentage_rate DECIMAL(5,4),
  fixed_amount DECIMAL(15,2),
  unit_type VARCHAR(50) CHECK (unit_type IN (
    'per_hour', 'per_day', 'per_case', 'per_document', 'per_page', 
    'percentage_of_value', 'fixed_amount'
  )),
  
  -- Validity
  effective_date DATE NOT NULL,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Legal reference
  legal_reference VARCHAR(500) NOT NULL,
  notes TEXT,
  
  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(profession, category, subcategory, effective_date)
);

-- Create lawyer_fee_schedules table (specific to lawyers)
CREATE TABLE lawyer_fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_schedule_id UUID NOT NULL REFERENCES algerian_fee_schedules(id) ON DELETE CASCADE,
  case_type VARCHAR(50) NOT NULL CHECK (case_type IN (
    'civil_litigation', 'criminal_defense', 'commercial_law', 'administrative_law',
    'family_law', 'labor_law', 'real_estate_law', 'intellectual_property',
    'tax_law', 'consultation', 'document_drafting', 'legal_opinion'
  )),
  court_level VARCHAR(50) CHECK (court_level IN (
    'tribunal_premiere_instance', 'cour_appel', 'cour_supreme', 
    'conseil_etat', 'tribunal_administratif', 'tribunal_commerce'
  )),
  complexity VARCHAR(20) CHECK (complexity IN (
    'simple', 'moderate', 'complex', 'very_complex'
  )),
  minimum_hours INTEGER,
  maximum_hours INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notary_fee_schedules table (specific to notaries)
CREATE TABLE notary_fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_schedule_id UUID NOT NULL REFERENCES algerian_fee_schedules(id) ON DELETE CASCADE,
  act_type VARCHAR(50) NOT NULL CHECK (act_type IN (
    'property_sale', 'property_purchase', 'mortgage', 'lease_agreement',
    'inheritance', 'donation', 'marriage_contract', 'company_formation',
    'power_of_attorney', 'authentication', 'certification'
  )),
  property_type VARCHAR(20) CHECK (property_type IN (
    'residential', 'commercial', 'industrial', 'agricultural', 'land'
  )),
  value_threshold DECIMAL(15,2),
  is_percentage_based BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bailiff_fee_schedules table (specific to bailiffs)
CREATE TABLE bailiff_fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_schedule_id UUID NOT NULL REFERENCES algerian_fee_schedules(id) ON DELETE CASCADE,
  execution_type VARCHAR(50) NOT NULL CHECK (execution_type IN (
    'seizure', 'eviction', 'delivery', 'inventory', 'auction', 'notification'
  )),
  amount_threshold DECIMAL(15,2),
  distance_threshold INTEGER, -- in kilometers
  is_distance_based BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tax_configurations table
CREATE TABLE tax_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profession VARCHAR(50) NOT NULL CHECK (profession IN (
    'avocat', 'notaire', 'huissier', 'commissaire_priseur', 'expert_judiciaire'
  )),
  tax_type VARCHAR(50) NOT NULL CHECK (tax_type IN (
    'vat', 'professional_tax', 'stamp_duty', 'registration_tax', 'withholding_tax'
  )),
  rate DECIMAL(5,4) NOT NULL,
  is_percentage BOOLEAN DEFAULT true,
  minimum_amount DECIMAL(15,2),
  maximum_amount DECIMAL(15,2),
  exemption_threshold DECIMAL(15,2),
  
  -- Validity
  applicable_from DATE NOT NULL,
  applicable_to DATE,
  is_active BOOLEAN DEFAULT true,
  legal_reference VARCHAR(500) NOT NULL,
  
  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(profession, tax_type, applicable_from)
);

-- Create billing_invoices table
CREATE TABLE billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  billing_calculation_id UUID NOT NULL REFERENCES billing_calculations(id),
  case_id UUID NOT NULL REFERENCES cases(id),
  client_id UUID NOT NULL,
  lawyer_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  
  -- Invoice details
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  payment_terms INTEGER DEFAULT 30, -- days
  
  -- Amounts
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'DZD',
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'viewed', 'accepted', 'disputed', 'cancelled', 'paid'
  )),
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid', 'partial', 'paid', 'overdue', 'refunded'
  )),
  
  -- Payment details
  payment_method VARCHAR(20) CHECK (payment_method IN (
    'cash', 'check', 'bank_transfer', 'credit_card', 'mobile_payment', 'other'
  )),
  payment_date DATE,
  payment_reference VARCHAR(100),
  
  -- Additional information
  notes TEXT,
  terms_and_conditions TEXT,
  
  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create fee_schedule_updates table
CREATE TABLE fee_schedule_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profession VARCHAR(50) NOT NULL,
  update_type VARCHAR(10) NOT NULL CHECK (update_type IN ('create', 'update', 'delete')),
  previous_schedule JSONB,
  new_schedule JSONB NOT NULL,
  effective_date DATE NOT NULL,
  reason TEXT NOT NULL,
  updated_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP
);

-- Create billing_audit table
CREATE TABLE billing_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_calculation_id UUID NOT NULL REFERENCES billing_calculations(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'calculated', 'approved', 'modified', 'invoiced', 'paid', 'disputed', 'cancelled'
  )),
  performed_by UUID NOT NULL REFERENCES users(id),
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Audit details
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_billing_calculations_case ON billing_calculations(case_id);
CREATE INDEX idx_billing_calculations_client ON billing_calculations(client_id);
CREATE INDEX idx_billing_calculations_lawyer ON billing_calculations(lawyer_id);
CREATE INDEX idx_billing_calculations_profession ON billing_calculations(profession);
CREATE INDEX idx_billing_calculations_status ON billing_calculations(status);
CREATE INDEX idx_billing_calculations_date ON billing_calculations(calculation_date);
CREATE INDEX idx_billing_calculations_amount ON billing_calculations(total_amount);

CREATE INDEX idx_fee_schedules_profession ON algerian_fee_schedules(profession);
CREATE INDEX idx_fee_schedules_category ON algerian_fee_schedules(category);
CREATE INDEX idx_fee_schedules_active ON algerian_fee_schedules(is_active);
CREATE INDEX idx_fee_schedules_effective ON algerian_fee_schedules(effective_date);

CREATE INDEX idx_lawyer_schedules_case_type ON lawyer_fee_schedules(case_type);
CREATE INDEX idx_lawyer_schedules_court_level ON lawyer_fee_schedules(court_level);
CREATE INDEX idx_lawyer_schedules_complexity ON lawyer_fee_schedules(complexity);

CREATE INDEX idx_notary_schedules_act_type ON notary_fee_schedules(act_type);
CREATE INDEX idx_notary_schedules_property_type ON notary_fee_schedules(property_type);

CREATE INDEX idx_bailiff_schedules_execution_type ON bailiff_fee_schedules(execution_type);

CREATE INDEX idx_tax_configurations_profession ON tax_configurations(profession);
CREATE INDEX idx_tax_configurations_type ON tax_configurations(tax_type);
CREATE INDEX idx_tax_configurations_active ON tax_configurations(is_active);

CREATE INDEX idx_invoices_number ON billing_invoices(invoice_number);
CREATE INDEX idx_invoices_calculation ON billing_invoices(billing_calculation_id);
CREATE INDEX idx_invoices_client ON billing_invoices(client_id);
CREATE INDEX idx_invoices_lawyer ON billing_invoices(lawyer_id);
CREATE INDEX idx_invoices_status ON billing_invoices(status);
CREATE INDEX idx_invoices_payment_status ON billing_invoices(payment_status);
CREATE INDEX idx_invoices_due_date ON billing_invoices(due_date);
CREATE INDEX idx_invoices_issue_date ON billing_invoices(issue_date);

CREATE INDEX idx_billing_audit_calculation ON billing_audit(billing_calculation_id);
CREATE INDEX idx_billing_audit_action ON billing_audit(action);
CREATE INDEX idx_billing_audit_performed_at ON billing_audit(performed_at);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER billing_calculations_updated_at_trigger
  BEFORE UPDATE ON billing_calculations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER algerian_fee_schedules_updated_at_trigger
  BEFORE UPDATE ON algerian_fee_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tax_configurations_updated_at_trigger
  BEFORE UPDATE ON tax_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER billing_invoices_updated_at_trigger
  BEFORE UPDATE ON billing_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number(
  lawyer_id UUID,
  invoice_date DATE DEFAULT CURRENT_DATE
)
RETURNS VARCHAR(50) AS $
DECLARE
  year_part VARCHAR(4);
  sequence_number INTEGER;
  lawyer_code VARCHAR(10);
  invoice_number VARCHAR(50);
BEGIN
  -- Get year part
  year_part := EXTRACT(YEAR FROM invoice_date)::VARCHAR;
  
  -- Get lawyer code (first 3 letters of last name + user ID last 3 chars)
  SELECT UPPER(LEFT(COALESCE(up.last_name, 'LAW'), 3)) || RIGHT(u.id::VARCHAR, 3)
  INTO lawyer_code
  FROM users u
  LEFT JOIN user_profiles up ON u.id = up.user_id AND up.is_primary = true
  WHERE u.id = lawyer_id;
  
  -- Get next sequence number for this lawyer and year
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ ('^FAC-' || year_part || '-' || lawyer_code || '-[0-9]+$')
      THEN CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO sequence_number
  FROM billing_invoices
  WHERE lawyer_id = generate_invoice_number.lawyer_id
  AND EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM invoice_date);
  
  -- Generate invoice number: FAC-YYYY-LAWYERCODE-NNNN
  invoice_number := 'FAC-' || year_part || '-' || lawyer_code || '-' || LPAD(sequence_number::VARCHAR, 4, '0');
  
  RETURN invoice_number;
END;
$ LANGUAGE plpgsql;

-- Create function to calculate Algerian lawyer fees
CREATE OR REPLACE FUNCTION calculate_lawyer_fees(
  case_type VARCHAR(50),
  court_level VARCHAR(50),
  complexity VARCHAR(20),
  hours DECIMAL DEFAULT NULL,
  base_amount DECIMAL DEFAULT NULL,
  urgency VARCHAR(20) DEFAULT 'normal'
)
RETURNS TABLE(
  base_fee DECIMAL,
  complexity_multiplier DECIMAL,
  urgency_multiplier DECIMAL,
  court_multiplier DECIMAL,
  total_fee DECIMAL
) AS $
DECLARE
  schedule_record RECORD;
  base_fee_amount DECIMAL := 0;
  complexity_mult DECIMAL := 1.0;
  urgency_mult DECIMAL := 1.0;
  court_mult DECIMAL := 1.0;
BEGIN
  -- Get base fee from schedule
  SELECT afs.minimum_fee, afs.maximum_fee, afs.percentage_rate, afs.fixed_amount, afs.unit_type
  INTO schedule_record
  FROM algerian_fee_schedules afs
  JOIN lawyer_fee_schedules lfs ON afs.id = lfs.fee_schedule_id
  WHERE afs.profession = 'avocat'
  AND lfs.case_type = calculate_lawyer_fees.case_type
  AND (lfs.court_level = calculate_lawyer_fees.court_level OR lfs.court_level IS NULL)
  AND (lfs.complexity = calculate_lawyer_fees.complexity OR lfs.complexity IS NULL)
  AND afs.is_active = true
  AND afs.effective_date <= CURRENT_DATE
  AND (afs.expiry_date IS NULL OR afs.expiry_date > CURRENT_DATE)
  ORDER BY lfs.court_level NULLS LAST, lfs.complexity NULLS LAST
  LIMIT 1;
  
  -- Calculate base fee
  IF schedule_record.unit_type = 'per_hour' AND hours IS NOT NULL THEN
    base_fee_amount := schedule_record.minimum_fee * hours;
  ELSIF schedule_record.unit_type = 'percentage_of_value' AND base_amount IS NOT NULL THEN
    base_fee_amount := base_amount * schedule_record.percentage_rate;
  ELSIF schedule_record.fixed_amount IS NOT NULL THEN
    base_fee_amount := schedule_record.fixed_amount;
  ELSE
    base_fee_amount := schedule_record.minimum_fee;
  END IF;
  
  -- Apply complexity multiplier
  CASE complexity
    WHEN 'simple' THEN complexity_mult := 1.0;
    WHEN 'moderate' THEN complexity_mult := 1.2;
    WHEN 'complex' THEN complexity_mult := 1.5;
    WHEN 'very_complex' THEN complexity_mult := 2.0;
    ELSE complexity_mult := 1.0;
  END CASE;
  
  -- Apply urgency multiplier
  CASE urgency
    WHEN 'normal' THEN urgency_mult := 1.0;
    WHEN 'urgent' THEN urgency_mult := 1.3;
    WHEN 'very_urgent' THEN urgency_mult := 1.5;
    WHEN 'emergency' THEN urgency_mult := 2.0;
    ELSE urgency_mult := 1.0;
  END CASE;
  
  -- Apply court level multiplier
  CASE court_level
    WHEN 'tribunal_premiere_instance' THEN court_mult := 1.0;
    WHEN 'tribunal_commerce' THEN court_mult := 1.1;
    WHEN 'tribunal_administratif' THEN court_mult := 1.2;
    WHEN 'cour_appel' THEN court_mult := 1.5;
    WHEN 'conseil_etat' THEN court_mult := 1.8;
    WHEN 'cour_supreme' THEN court_mult := 2.0;
    ELSE court_mult := 1.0;
  END CASE;
  
  -- Return calculated values
  RETURN QUERY SELECT 
    base_fee_amount,
    complexity_mult,
    urgency_mult,
    court_mult,
    base_fee_amount * complexity_mult * urgency_mult * court_mult;
END;
$ LANGUAGE plpgsql;

-- Create function to calculate notary fees
CREATE OR REPLACE FUNCTION calculate_notary_fees(
  act_type VARCHAR(50),
  property_value DECIMAL DEFAULT NULL,
  property_type VARCHAR(20) DEFAULT NULL,
  document_count INTEGER DEFAULT 1
)
RETURNS TABLE(
  base_fee DECIMAL,
  percentage_fee DECIMAL,
  document_fee DECIMAL,
  total_fee DECIMAL
) AS $
DECLARE
  schedule_record RECORD;
  base_fee_amount DECIMAL := 0;
  percentage_fee_amount DECIMAL := 0;
  document_fee_amount DECIMAL := 0;
BEGIN
  -- Get base fee from schedule
  SELECT afs.minimum_fee, afs.percentage_rate, afs.fixed_amount, nfs.is_percentage_based
  INTO schedule_record
  FROM algerian_fee_schedules afs
  JOIN notary_fee_schedules nfs ON afs.id = nfs.fee_schedule_id
  WHERE afs.profession = 'notaire'
  AND nfs.act_type = calculate_notary_fees.act_type
  AND (nfs.property_type = calculate_notary_fees.property_type OR nfs.property_type IS NULL)
  AND (nfs.value_threshold IS NULL OR property_value >= nfs.value_threshold)
  AND afs.is_active = true
  AND afs.effective_date <= CURRENT_DATE
  AND (afs.expiry_date IS NULL OR afs.expiry_date > CURRENT_DATE)
  ORDER BY nfs.value_threshold DESC NULLS LAST
  LIMIT 1;
  
  -- Calculate fees
  IF schedule_record.is_percentage_based AND property_value IS NOT NULL THEN
    percentage_fee_amount := property_value * schedule_record.percentage_rate;
    base_fee_amount := GREATEST(schedule_record.minimum_fee, percentage_fee_amount);
  ELSIF schedule_record.fixed_amount IS NOT NULL THEN
    base_fee_amount := schedule_record.fixed_amount;
  ELSE
    base_fee_amount := schedule_record.minimum_fee;
  END IF;
  
  -- Add document fees if multiple documents
  IF document_count > 1 THEN
    document_fee_amount := (document_count - 1) * (base_fee_amount * 0.1); -- 10% per additional document
  END IF;
  
  -- Return calculated values
  RETURN QUERY SELECT 
    base_fee_amount,
    percentage_fee_amount,
    document_fee_amount,
    base_fee_amount + document_fee_amount;
END;
$ LANGUAGE plpgsql;

-- Create function to calculate bailiff fees
CREATE OR REPLACE FUNCTION calculate_bailiff_fees(
  execution_type VARCHAR(50),
  execution_amount DECIMAL DEFAULT NULL,
  distance INTEGER DEFAULT 0,
  urgency VARCHAR(20) DEFAULT 'normal'
)
RETURNS TABLE(
  base_fee DECIMAL,
  distance_fee DECIMAL,
  urgency_multiplier DECIMAL,
  total_fee DECIMAL
) AS $
DECLARE
  schedule_record RECORD;
  base_fee_amount DECIMAL := 0;
  distance_fee_amount DECIMAL := 0;
  urgency_mult DECIMAL := 1.0;
BEGIN
  -- Get base fee from schedule
  SELECT afs.minimum_fee, afs.percentage_rate, afs.fixed_amount, bfs.is_distance_based
  INTO schedule_record
  FROM algerian_fee_schedules afs
  JOIN bailiff_fee_schedules bfs ON afs.id = bfs.fee_schedule_id
  WHERE afs.profession = 'huissier'
  AND bfs.execution_type = calculate_bailiff_fees.execution_type
  AND (bfs.amount_threshold IS NULL OR execution_amount >= bfs.amount_threshold)
  AND afs.is_active = true
  AND afs.effective_date <= CURRENT_DATE
  AND (afs.expiry_date IS NULL OR afs.expiry_date > CURRENT_DATE)
  ORDER BY bfs.amount_threshold DESC NULLS LAST
  LIMIT 1;
  
  -- Calculate base fee
  IF schedule_record.percentage_rate IS NOT NULL AND execution_amount IS NOT NULL THEN
    base_fee_amount := GREATEST(schedule_record.minimum_fee, execution_amount * schedule_record.percentage_rate);
  ELSIF schedule_record.fixed_amount IS NOT NULL THEN
    base_fee_amount := schedule_record.fixed_amount;
  ELSE
    base_fee_amount := schedule_record.minimum_fee;
  END IF;
  
  -- Calculate distance fee if applicable
  IF schedule_record.is_distance_based AND distance > 10 THEN -- Free for first 10km
    distance_fee_amount := (distance - 10) * 50; -- 50 DZD per km beyond 10km
  END IF;
  
  -- Apply urgency multiplier
  CASE urgency
    WHEN 'normal' THEN urgency_mult := 1.0;
    WHEN 'urgent' THEN urgency_mult := 1.5;
    WHEN 'very_urgent' THEN urgency_mult := 2.0;
    WHEN 'emergency' THEN urgency_mult := 2.5;
    ELSE urgency_mult := 1.0;
  END CASE;
  
  -- Return calculated values
  RETURN QUERY SELECT 
    base_fee_amount,
    distance_fee_amount,
    urgency_mult,
    (base_fee_amount + distance_fee_amount) * urgency_mult;
END;
$ LANGUAGE plpgsql;

-- Create function to calculate taxes
CREATE OR REPLACE FUNCTION calculate_taxes(
  profession_param VARCHAR(50),
  base_amount DECIMAL
)
RETURNS TABLE(
  tax_type VARCHAR(50),
  tax_rate DECIMAL,
  tax_amount DECIMAL
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    tc.tax_type,
    tc.rate,
    CASE 
      WHEN tc.is_percentage THEN 
        LEAST(
          GREATEST(base_amount * tc.rate, COALESCE(tc.minimum_amount, 0)),
          COALESCE(tc.maximum_amount, base_amount * tc.rate)
        )
      ELSE tc.rate
    END as calculated_tax_amount
  FROM tax_configurations tc
  WHERE tc.profession = profession_param
  AND tc.is_active = true
  AND tc.applicable_from <= CURRENT_DATE
  AND (tc.applicable_to IS NULL OR tc.applicable_to > CURRENT_DATE)
  AND (tc.exemption_threshold IS NULL OR base_amount > tc.exemption_threshold);
END;
$ LANGUAGE plpgsql;

-- Insert default Algerian fee schedules for lawyers
INSERT INTO algerian_fee_schedules (profession, category, subcategory, minimum_fee, maximum_fee, percentage_rate, unit_type, effective_date, legal_reference) VALUES
  ('avocat', 'Consultation juridique', NULL, 2000, 5000, NULL, 'per_hour', '2024-01-01', 'Décision du Conseil de l''Ordre des Avocats d''Alger 2024'),
  ('avocat', 'Rédaction d''actes', 'Contrat simple', 5000, 15000, NULL, 'per_document', '2024-01-01', 'Barème des honoraires des avocats 2024'),
  ('avocat', 'Rédaction d''actes', 'Contrat complexe', 15000, 50000, NULL, 'per_document', '2024-01-01', 'Barème des honoraires des avocats 2024'),
  ('avocat', 'Procédure civile', 'Première instance', 10000, NULL, 0.05, 'percentage_of_value', '2024-01-01', 'Code de procédure civile algérien'),
  ('avocat', 'Procédure civile', 'Appel', 15000, NULL, 0.07, 'percentage_of_value', '2024-01-01', 'Code de procédure civile algérien'),
  ('avocat', 'Procédure pénale', 'Délit', 20000, 100000, NULL, 'per_case', '2024-01-01', 'Code de procédure pénale algérien'),
  ('avocat', 'Procédure pénale', 'Crime', 50000, 500000, NULL, 'per_case', '2024-01-01', 'Code de procédure pénale algérien'),
  ('avocat', 'Droit commercial', 'Création société', 25000, 100000, NULL, 'per_case', '2024-01-01', 'Code de commerce algérien'),
  ('avocat', 'Droit du travail', 'Contentieux', 15000, 75000, NULL, 'per_case', '2024-01-01', 'Code du travail algérien');

-- Insert lawyer-specific fee schedules
INSERT INTO lawyer_fee_schedules (fee_schedule_id, case_type, court_level, complexity) 
SELECT id, 'consultation', NULL, 'simple' FROM algerian_fee_schedules WHERE profession = 'avocat' AND category = 'Consultation juridique';

INSERT INTO lawyer_fee_schedules (fee_schedule_id, case_type, court_level, complexity) 
SELECT id, 'civil_litigation', 'tribunal_premiere_instance', 'moderate' FROM algerian_fee_schedules WHERE profession = 'avocat' AND category = 'Procédure civile' AND subcategory = 'Première instance';

INSERT INTO lawyer_fee_schedules (fee_schedule_id, case_type, court_level, complexity) 
SELECT id, 'civil_litigation', 'cour_appel', 'complex' FROM algerian_fee_schedules WHERE profession = 'avocat' AND category = 'Procédure civile' AND subcategory = 'Appel';

INSERT INTO lawyer_fee_schedules (fee_schedule_id, case_type, court_level, complexity) 
SELECT id, 'criminal_defense', 'tribunal_premiere_instance', 'moderate' FROM algerian_fee_schedules WHERE profession = 'avocat' AND category = 'Procédure pénale' AND subcategory = 'Délit';

INSERT INTO lawyer_fee_schedules (fee_schedule_id, case_type, court_level, complexity) 
SELECT id, 'criminal_defense', 'cour_appel', 'complex' FROM algerian_fee_schedules WHERE profession = 'avocat' AND category = 'Procédure pénale' AND subcategory = 'Crime';

-- Insert default notary fee schedules
INSERT INTO algerian_fee_schedules (profession, category, subcategory, minimum_fee, percentage_rate, unit_type, effective_date, legal_reference) VALUES
  ('notaire', 'Vente immobilière', 'Résidentiel', 50000, 0.015, 'percentage_of_value', '2024-01-01', 'Décret exécutif relatif aux tarifs notariaux'),
  ('notaire', 'Vente immobilière', 'Commercial', 75000, 0.02, 'percentage_of_value', '2024-01-01', 'Décret exécutif relatif aux tarifs notariaux'),
  ('notaire', 'Hypothèque', NULL, 25000, 0.01, 'percentage_of_value', '2024-01-01', 'Code civil algérien'),
  ('notaire', 'Succession', NULL, 30000, 0.025, 'percentage_of_value', '2024-01-01', 'Code civil algérien'),
  ('notaire', 'Contrat de mariage', NULL, 15000, NULL, 'fixed_amount', '2024-01-01', 'Code de la famille algérien'),
  ('notaire', 'Procuration', NULL, 5000, NULL, 'fixed_amount', '2024-01-01', 'Code civil algérien');

-- Insert notary-specific fee schedules
INSERT INTO notary_fee_schedules (fee_schedule_id, act_type, property_type, is_percentage_based) 
SELECT id, 'property_sale', 'residential', true FROM algerian_fee_schedules WHERE profession = 'notaire' AND category = 'Vente immobilière' AND subcategory = 'Résidentiel';

INSERT INTO notary_fee_schedules (fee_schedule_id, act_type, property_type, is_percentage_based) 
SELECT id, 'property_sale', 'commercial', true FROM algerian_fee_schedules WHERE profession = 'notaire' AND category = 'Vente immobilière' AND subcategory = 'Commercial';

INSERT INTO notary_fee_schedules (fee_schedule_id, act_type, is_percentage_based) 
SELECT id, 'mortgage', true FROM algerian_fee_schedules WHERE profession = 'notaire' AND category = 'Hypothèque';

INSERT INTO notary_fee_schedules (fee_schedule_id, act_type, is_percentage_based) 
SELECT id, 'inheritance', true FROM algerian_fee_schedules WHERE profession = 'notaire' AND category = 'Succession';

-- Insert default bailiff fee schedules
INSERT INTO algerian_fee_schedules (profession, category, subcategory, minimum_fee, maximum_fee, unit_type, effective_date, legal_reference) VALUES
  ('huissier', 'Signification', 'Simple', 3000, 8000, 'per_document', '2024-01-01', 'Décret relatif aux tarifs des huissiers de justice'),
  ('huissier', 'Signification', 'Complexe', 5000, 15000, 'per_document', '2024-01-01', 'Décret relatif aux tarifs des huissiers de justice'),
  ('huissier', 'Saisie', 'Mobilière', 10000, NULL, 'percentage_of_value', '2024-01-01', 'Code de procédure civile algérien'),
  ('huissier', 'Saisie', 'Immobilière', 25000, NULL, 'percentage_of_value', '2024-01-01', 'Code de procédure civile algérien'),
  ('huissier', 'Expulsion', NULL, 15000, 50000, 'per_case', '2024-01-01', 'Code de procédure civile algérien'),
  ('huissier', 'Inventaire', NULL, 8000, NULL, 'per_day', '2024-01-01', 'Code de procédure civile algérien');

-- Insert bailiff-specific fee schedules
INSERT INTO bailiff_fee_schedules (fee_schedule_id, execution_type, is_distance_based) 
SELECT id, 'notification', true FROM algerian_fee_schedules WHERE profession = 'huissier' AND category = 'Signification' AND subcategory = 'Simple';

INSERT INTO bailiff_fee_schedules (fee_schedule_id, execution_type, is_distance_based) 
SELECT id, 'seizure', false FROM algerian_fee_schedules WHERE profession = 'huissier' AND category = 'Saisie' AND subcategory = 'Mobilière';

INSERT INTO bailiff_fee_schedules (fee_schedule_id, execution_type, is_distance_based) 
SELECT id, 'eviction', true FROM algerian_fee_schedules WHERE profession = 'huissier' AND category = 'Expulsion';

-- Insert default tax configurations
INSERT INTO tax_configurations (profession, tax_type, rate, is_percentage, applicable_from, legal_reference) VALUES
  ('avocat', 'vat', 0.19, true, '2024-01-01', 'Code des taxes sur le chiffre d''affaires'),
  ('avocat', 'professional_tax', 0.02, true, '2024-01-01', 'Code des impôts directs et taxes assimilées'),
  ('notaire', 'vat', 0.19, true, '2024-01-01', 'Code des taxes sur le chiffre d''affaires'),
  ('notaire', 'registration_tax', 0.05, true, '2024-01-01', 'Code de l''enregistrement'),
  ('huissier', 'vat', 0.19, true, '2024-01-01', 'Code des taxes sur le chiffre d''affaires'),
  ('huissier', 'stamp_duty', 1000, false, '2024-01-01', 'Code du timbre');

-- Create view for active fee schedules
CREATE VIEW active_fee_schedules AS
SELECT 
  afs.*,
  lfs.case_type,
  lfs.court_level,
  lfs.complexity,
  nfs.act_type,
  nfs.property_type,
  nfs.is_percentage_based as notary_percentage_based,
  bfs.execution_type,
  bfs.is_distance_based as bailiff_distance_based
FROM algerian_fee_schedules afs
LEFT JOIN lawyer_fee_schedules lfs ON afs.id = lfs.fee_schedule_id
LEFT JOIN notary_fee_schedules nfs ON afs.id = nfs.fee_schedule_id
LEFT JOIN bailiff_fee_schedules bfs ON afs.id = bfs.fee_schedule_id
WHERE afs.is_active = true
AND afs.effective_date <= CURRENT_DATE
AND (afs.expiry_date IS NULL OR afs.expiry_date > CURRENT_DATE)
ORDER BY afs.profession, afs.category, afs.subcategory;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON billing_calculations TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON algerian_fee_schedules TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON lawyer_fee_schedules TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON notary_fee_schedules TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON bailiff_fee_schedules TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON tax_configurations TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON billing_invoices TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON fee_schedule_updates TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON billing_audit TO app_user;
GRANT SELECT ON active_fee_schedules TO app_user;