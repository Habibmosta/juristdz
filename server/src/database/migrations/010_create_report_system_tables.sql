-- Create report generation system tables

-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'case_activity', 'case_summary', 'time_tracking', 'billing_summary',
    'deadline_tracking', 'client_portfolio', 'performance_metrics',
    'financial_overview', 'case_statistics', 'notification_analytics', 'custom'
  )),
  format VARCHAR(20) NOT NULL CHECK (format IN ('pdf', 'excel', 'csv', 'json', 'html')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'generating', 'completed', 'failed', 'expired'
  )),
  
  -- Report configuration
  parameters JSONB DEFAULT '{}',
  
  -- File information
  file_path VARCHAR(500),
  file_size BIGINT,
  
  -- Timing
  generated_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Access control
  generated_by UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  download_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  
  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create report_templates table
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'case_activity', 'case_summary', 'time_tracking', 'billing_summary',
    'deadline_tracking', 'client_portfolio', 'performance_metrics',
    'financial_overview', 'case_statistics', 'notification_analytics', 'custom'
  )),
  format VARCHAR(20) NOT NULL CHECK (format IN ('pdf', 'excel', 'csv', 'json', 'html')),
  
  -- Template configuration
  parameters JSONB DEFAULT '{}',
  layout JSONB DEFAULT '{}',
  
  -- Template properties
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Access control
  organization_id UUID REFERENCES organizations(id),
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(name, organization_id)
);

-- Create report_generation_jobs table
CREATE TABLE report_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'generating', 'completed', 'failed', 'expired'
  )),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Timing
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_completion TIMESTAMP,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create scheduled_reports table
CREATE TABLE scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Schedule configuration
  schedule_frequency VARCHAR(20) NOT NULL CHECK (schedule_frequency IN (
    'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  )),
  schedule_interval INTEGER DEFAULT 1,
  schedule_day_of_week INTEGER CHECK (schedule_day_of_week >= 0 AND schedule_day_of_week <= 6),
  schedule_day_of_month INTEGER CHECK (schedule_day_of_month >= 1 AND schedule_day_of_month <= 31),
  schedule_hour INTEGER DEFAULT 9 CHECK (schedule_hour >= 0 AND schedule_hour <= 23),
  schedule_minute INTEGER DEFAULT 0 CHECK (schedule_minute >= 0 AND schedule_minute <= 59),
  timezone VARCHAR(50) DEFAULT 'Africa/Algiers',
  
  -- Recipients
  recipients JSONB DEFAULT '[]', -- Array of user IDs or email addresses
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_generated TIMESTAMP,
  next_generation TIMESTAMP,
  
  -- Access control
  created_by UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  
  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create report_shares table
CREATE TABLE report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id),
  shared_with JSONB DEFAULT '[]', -- Array of user IDs
  
  -- Permissions
  permissions JSONB DEFAULT '["view"]', -- Array of permissions: view, download, share
  
  -- Access control
  expires_at TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create report_audit table
CREATE TABLE report_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'generated', 'downloaded', 'shared', 'deleted', 'viewed', 'exported'
  )),
  performed_by UUID NOT NULL REFERENCES users(id),
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Audit details
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dashboard_widgets table
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  size VARCHAR(20) DEFAULT 'medium' CHECK (size IN ('small', 'medium', 'large', 'full_width')),
  
  -- Position
  position_row INTEGER NOT NULL,
  position_column INTEGER NOT NULL,
  position_width INTEGER DEFAULT 1,
  position_height INTEGER DEFAULT 1,
  
  -- Configuration
  refresh_interval INTEGER DEFAULT 300, -- seconds
  parameters JSONB DEFAULT '{}',
  
  -- Data cache
  last_updated TIMESTAMP,
  cached_data JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, position_row, position_column)
);

-- Create indexes for performance
CREATE INDEX idx_reports_generated_by ON reports(generated_by);
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_generated_at ON reports(generated_at);
CREATE INDEX idx_reports_expires_at ON reports(expires_at);
CREATE INDEX idx_reports_organization ON reports(organization_id);

CREATE INDEX idx_report_templates_type ON report_templates(type);
CREATE INDEX idx_report_templates_active ON report_templates(is_active);
CREATE INDEX idx_report_templates_organization ON report_templates(organization_id);

CREATE INDEX idx_report_jobs_report ON report_generation_jobs(report_id);
CREATE INDEX idx_report_jobs_status ON report_generation_jobs(status);
CREATE INDEX idx_report_jobs_started ON report_generation_jobs(started_at);

CREATE INDEX idx_scheduled_reports_template ON scheduled_reports(template_id);
CREATE INDEX idx_scheduled_reports_next_generation ON scheduled_reports(next_generation);
CREATE INDEX idx_scheduled_reports_active ON scheduled_reports(is_active);

CREATE INDEX idx_report_shares_report ON report_shares(report_id);
CREATE INDEX idx_report_shares_shared_by ON report_shares(shared_by);
CREATE INDEX idx_report_shares_active ON report_shares(is_active);

CREATE INDEX idx_report_audit_report ON report_audit(report_id);
CREATE INDEX idx_report_audit_action ON report_audit(action);
CREATE INDEX idx_report_audit_performed_at ON report_audit(performed_at);

CREATE INDEX idx_dashboard_widgets_user ON dashboard_widgets(user_id);
CREATE INDEX idx_dashboard_widgets_active ON dashboard_widgets(is_active);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER reports_updated_at_trigger
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER report_templates_updated_at_trigger
  BEFORE UPDATE ON report_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER report_generation_jobs_updated_at_trigger
  BEFORE UPDATE ON report_generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER scheduled_reports_updated_at_trigger
  BEFORE UPDATE ON scheduled_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER dashboard_widgets_updated_at_trigger
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate next scheduled report generation
CREATE OR REPLACE FUNCTION calculate_next_report_generation(
  frequency VARCHAR(20),
  interval_value INTEGER,
  day_of_week INTEGER,
  day_of_month INTEGER,
  hour INTEGER,
  minute INTEGER,
  timezone VARCHAR(50),
  last_generated TIMESTAMP
)
RETURNS TIMESTAMP AS $
DECLARE
  next_date TIMESTAMP;
  base_date TIMESTAMP;
BEGIN
  -- Use last generated date or current time as base
  base_date := COALESCE(last_generated, CURRENT_TIMESTAMP);
  
  CASE frequency
    WHEN 'daily' THEN
      next_date := base_date + (interval_value || ' days')::INTERVAL;
      
    WHEN 'weekly' THEN
      -- Calculate next occurrence of the specified day of week
      next_date := base_date + (interval_value || ' weeks')::INTERVAL;
      IF day_of_week IS NOT NULL THEN
        -- Adjust to the correct day of week
        next_date := next_date + ((day_of_week - EXTRACT(DOW FROM next_date))::INTEGER || ' days')::INTERVAL;
      END IF;
      
    WHEN 'monthly' THEN
      next_date := base_date + (interval_value || ' months')::INTERVAL;
      IF day_of_month IS NOT NULL THEN
        -- Adjust to the correct day of month
        next_date := DATE_TRUNC('month', next_date) + ((day_of_month - 1) || ' days')::INTERVAL;
      END IF;
      
    WHEN 'quarterly' THEN
      next_date := base_date + ((interval_value * 3) || ' months')::INTERVAL;
      
    WHEN 'yearly' THEN
      next_date := base_date + (interval_value || ' years')::INTERVAL;
      
    ELSE
      next_date := base_date + '1 day'::INTERVAL;
  END CASE;
  
  -- Set the specific time
  next_date := DATE_TRUNC('day', next_date) + (hour || ' hours')::INTERVAL + (minute || ' minutes')::INTERVAL;
  
  -- Ensure the next date is in the future
  IF next_date <= CURRENT_TIMESTAMP THEN
    CASE frequency
      WHEN 'daily' THEN
        next_date := next_date + (interval_value || ' days')::INTERVAL;
      WHEN 'weekly' THEN
        next_date := next_date + (interval_value || ' weeks')::INTERVAL;
      WHEN 'monthly' THEN
        next_date := next_date + (interval_value || ' months')::INTERVAL;
      WHEN 'quarterly' THEN
        next_date := next_date + ((interval_value * 3) || ' months')::INTERVAL;
      WHEN 'yearly' THEN
        next_date := next_date + (interval_value || ' years')::INTERVAL;
    END CASE;
  END IF;
  
  RETURN next_date;
END;
$ LANGUAGE plpgsql;

-- Create function to process scheduled reports
CREATE OR REPLACE FUNCTION process_scheduled_reports()
RETURNS INTEGER AS $
DECLARE
  scheduled_record RECORD;
  reports_processed INTEGER := 0;
  new_report_id UUID;
BEGIN
  -- Loop through all active scheduled reports that are due
  FOR scheduled_record IN 
    SELECT * FROM scheduled_reports 
    WHERE is_active = true 
    AND next_generation <= CURRENT_TIMESTAMP
  LOOP
    -- Create a new report based on the template
    new_report_id := gen_random_uuid();
    
    INSERT INTO reports (
      id, title, description, type, format, status, parameters,
      generated_by, organization_id, created_at, updated_at
    )
    SELECT 
      new_report_id,
      scheduled_record.title,
      scheduled_record.description,
      rt.type,
      rt.format,
      'pending',
      rt.parameters,
      scheduled_record.created_by,
      scheduled_record.organization_id,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM report_templates rt
    WHERE rt.id = scheduled_record.template_id;
    
    -- Update the scheduled report with next generation time
    UPDATE scheduled_reports 
    SET 
      last_generated = CURRENT_TIMESTAMP,
      next_generation = calculate_next_report_generation(
        schedule_frequency,
        schedule_interval,
        schedule_day_of_week,
        schedule_day_of_month,
        schedule_hour,
        schedule_minute,
        timezone,
        CURRENT_TIMESTAMP
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = scheduled_record.id;
    
    reports_processed := reports_processed + 1;
  END LOOP;
  
  RETURN reports_processed;
END;
$ LANGUAGE plpgsql;

-- Create function to cleanup expired reports
CREATE OR REPLACE FUNCTION cleanup_expired_reports()
RETURNS INTEGER AS $
DECLARE
  reports_cleaned INTEGER := 0;
BEGIN
  -- Delete expired reports and their files
  UPDATE reports 
  SET status = 'expired', updated_at = CURRENT_TIMESTAMP
  WHERE expires_at IS NOT NULL 
  AND expires_at < CURRENT_TIMESTAMP 
  AND status NOT IN ('expired', 'failed');
  
  GET DIAGNOSTICS reports_cleaned = ROW_COUNT;
  
  RETURN reports_cleaned;
END;
$ LANGUAGE plpgsql;

-- Create function to get case activity summary for reports
CREATE OR REPLACE FUNCTION get_case_activity_summary(
  lawyer_id UUID,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_cases INTEGER,
  active_cases INTEGER,
  closed_cases INTEGER,
  total_hours DECIMAL,
  total_revenue DECIMAL,
  avg_case_duration DECIMAL
) AS $
DECLARE
  date_filter TEXT := '';
BEGIN
  -- Build date filter if provided
  IF start_date IS NOT NULL AND end_date IS NOT NULL THEN
    date_filter := ' AND c.opened_date BETWEEN ''' || start_date || ''' AND ''' || end_date || '''';
  ELSIF start_date IS NOT NULL THEN
    date_filter := ' AND c.opened_date >= ''' || start_date || '''';
  ELSIF end_date IS NOT NULL THEN
    date_filter := ' AND c.opened_date <= ''' || end_date || '''';
  END IF;
  
  RETURN QUERY EXECUTE '
    SELECT 
      COUNT(*)::INTEGER as total_cases,
      COUNT(CASE WHEN c.status IN (''open'', ''in_progress'') THEN 1 END)::INTEGER as active_cases,
      COUNT(CASE WHEN c.status = ''closed'' THEN 1 END)::INTEGER as closed_cases,
      COALESCE(SUM(te.duration_minutes), 0)::DECIMAL / 60 as total_hours,
      COALESCE(SUM(te.total_amount), 0)::DECIMAL as total_revenue,
      COALESCE(AVG(EXTRACT(DAYS FROM (COALESCE(c.closed_date, CURRENT_DATE) - c.opened_date))), 0)::DECIMAL as avg_case_duration
    FROM cases c
    LEFT JOIN case_time_entries te ON c.id = te.case_id AND te.is_billable = true
    WHERE c.assigned_lawyer_id = ''' || lawyer_id || '''
    AND c.is_active = true' || date_filter;
END;
$ LANGUAGE plpgsql;

-- Insert default report templates
INSERT INTO report_templates (name, description, type, format, parameters, layout, is_system, created_by) VALUES
  (
    'Rapport d''Activité Mensuel',
    'Rapport mensuel des activités par dossier avec statistiques détaillées',
    'case_activity',
    'pdf',
    '{
      "dateRange": {"from": "{{first_day_of_month}}", "to": "{{last_day_of_month}}"},
      "groupBy": "month",
      "includeArchived": false,
      "sortBy": "date",
      "sortOrder": "desc"
    }',
    '{
      "sections": [
        {"id": "summary", "title": "Résumé Exécutif", "type": "summary", "order": 1, "visible": true},
        {"id": "cases", "title": "Détail des Dossiers", "type": "table", "order": 2, "visible": true},
        {"id": "time_chart", "title": "Répartition du Temps", "type": "chart", "order": 3, "visible": true},
        {"id": "revenue_chart", "title": "Évolution du Chiffre d''Affaires", "type": "chart", "order": 4, "visible": true}
      ],
      "styling": {
        "fontFamily": "Arial",
        "fontSize": 12,
        "primaryColor": "#2563eb",
        "secondaryColor": "#64748b"
      }
    }',
    true,
    (SELECT id FROM users WHERE email = 'admin@juristdz.com' LIMIT 1)
  ),
  (
    'Rapport de Suivi des Délais',
    'Suivi des échéances et délais procéduraux avec alertes',
    'deadline_tracking',
    'excel',
    '{
      "dateRange": {"from": "{{today}}", "to": "{{today_plus_30_days}}"},
      "includeCompleted": false,
      "sortBy": "deadline_date",
      "sortOrder": "asc"
    }',
    '{
      "sections": [
        {"id": "upcoming", "title": "Échéances Prochaines", "type": "table", "order": 1, "visible": true},
        {"id": "overdue", "title": "Échéances Dépassées", "type": "table", "order": 2, "visible": true},
        {"id": "summary", "title": "Statistiques", "type": "summary", "order": 3, "visible": true}
      ]
    }',
    true,
    (SELECT id FROM users WHERE email = 'admin@juristdz.com' LIMIT 1)
  ),
  (
    'Rapport de Facturation',
    'Analyse financière avec détail des honoraires et frais',
    'billing_summary',
    'pdf',
    '{
      "dateRange": {"from": "{{first_day_of_quarter}}", "to": "{{last_day_of_quarter}}"},
      "groupBy": "month",
      "includeUnpaid": true,
      "sortBy": "amount",
      "sortOrder": "desc"
    }',
    '{
      "sections": [
        {"id": "financial_summary", "title": "Résumé Financier", "type": "summary", "order": 1, "visible": true},
        {"id": "invoices", "title": "Détail des Factures", "type": "table", "order": 2, "visible": true},
        {"id": "payment_trends", "title": "Tendances de Paiement", "type": "chart", "order": 3, "visible": true},
        {"id": "aging", "title": "Balance Âgée", "type": "table", "order": 4, "visible": true}
      ]
    }',
    true,
    (SELECT id FROM users WHERE email = 'admin@juristdz.com' LIMIT 1)
  );

-- Create view for report dashboard
CREATE VIEW report_dashboard AS
SELECT 
  r.id,
  r.title,
  r.type,
  r.format,
  r.status,
  r.generated_at,
  r.file_size,
  r.download_count,
  r.generated_by,
  up.first_name || ' ' || up.last_name as generated_by_name,
  r.created_at
FROM reports r
LEFT JOIN users u ON r.generated_by = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id AND up.is_primary = true
WHERE r.status != 'expired'
ORDER BY r.created_at DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON reports TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON report_templates TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON report_generation_jobs TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduled_reports TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON report_shares TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON report_audit TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON dashboard_widgets TO app_user;
GRANT SELECT ON report_dashboard TO app_user;