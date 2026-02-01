-- Create notification and deadline management system tables

-- Create notification_templates table
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'deadline_reminder', 'hearing_reminder', 'case_update', 'document_shared',
    'payment_due', 'task_assigned', 'system_alert', 'custom'
  )),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'in_app', 'push')),
  
  -- Template content
  subject_template TEXT,
  body_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- Available template variables
  
  -- Conditions for automatic triggering
  trigger_conditions JSONB DEFAULT '{}',
  
  -- System fields
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES organizations(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(name, organization_id)
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient information
  recipient_id UUID NOT NULL REFERENCES users(id),
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  
  -- Notification content
  type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'in_app', 'push')),
  subject VARCHAR(500),
  message TEXT NOT NULL,
  
  -- Related entities
  related_entity_type VARCHAR(50), -- 'case', 'document', 'deadline', etc.
  related_entity_id UUID,
  case_id UUID REFERENCES cases(id),
  
  -- Scheduling and delivery
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  
  -- Status and priority
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'delivered', 'read', 'failed', 'cancelled'
  )),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN (
    'low', 'normal', 'high', 'urgent'
  )),
  
  -- Retry mechanism
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_retry_at TIMESTAMP,
  failure_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  template_id UUID REFERENCES notification_templates(id),
  
  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notification_preferences table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Notification type preferences
  notification_type VARCHAR(50) NOT NULL,
  
  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  in_app_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  
  -- Timing preferences
  business_hours_only BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'Africa/Algiers',
  
  -- Frequency preferences
  immediate BOOLEAN DEFAULT true,
  daily_digest BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT false,
  digest_time TIME DEFAULT '09:00:00',
  
  -- System fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, notification_type)
);

-- Create deadline_notifications table for deadline-specific notifications
CREATE TABLE deadline_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deadline_id UUID NOT NULL REFERENCES case_deadlines(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  
  -- Notification timing
  days_before INTEGER NOT NULL,
  notification_date TIMESTAMP NOT NULL,
  
  -- Status
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(deadline_id, days_before)
);

-- Create notification_logs table for audit and debugging
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  
  -- Log details
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'created', 'scheduled', 'sent', 'delivered', 'read', 'failed', 'cancelled', 'retry'
  )),
  event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Event details
  details JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- External service response
  external_id VARCHAR(255), -- ID from email/SMS service
  external_status VARCHAR(100),
  external_response JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notification_digests table for digest notifications
CREATE TABLE notification_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Digest configuration
  digest_type VARCHAR(20) NOT NULL CHECK (digest_type IN ('daily', 'weekly')),
  digest_date DATE NOT NULL,
  
  -- Content
  notification_count INTEGER DEFAULT 0,
  content JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'generated', 'sent', 'failed'
  )),
  generated_at TIMESTAMP,
  sent_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, digest_type, digest_date)
);

-- Create procedural_deadlines table for legal procedure deadlines
CREATE TABLE procedural_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Deadline identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  legal_reference VARCHAR(255),
  
  -- Deadline calculation
  base_event VARCHAR(100) NOT NULL, -- 'hearing_date', 'service_date', 'judgment_date', etc.
  calculation_method VARCHAR(50) NOT NULL CHECK (calculation_method IN (
    'days_after', 'days_before', 'business_days_after', 'business_days_before',
    'months_after', 'months_before', 'fixed_date'
  )),
  calculation_value INTEGER, -- Number of days/months
  
  -- Applicable conditions
  legal_domain VARCHAR(50),
  case_type VARCHAR(100),
  court_type VARCHAR(50),
  jurisdiction VARCHAR(100),
  
  -- Notification settings
  default_notification_days INTEGER[] DEFAULT ARRAY[7, 3, 1],
  is_critical BOOLEAN DEFAULT false,
  
  -- System fields
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_at);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_case ON notifications(case_id);
CREATE INDEX idx_notifications_channel ON notifications(channel);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_type ON notification_preferences(notification_type);

CREATE INDEX idx_deadline_notifications_deadline ON deadline_notifications(deadline_id);
CREATE INDEX idx_deadline_notifications_date ON deadline_notifications(notification_date);
CREATE INDEX idx_deadline_notifications_sent ON deadline_notifications(is_sent);

CREATE INDEX idx_notification_logs_notification ON notification_logs(notification_id);
CREATE INDEX idx_notification_logs_event ON notification_logs(event_type);
CREATE INDEX idx_notification_logs_timestamp ON notification_logs(event_timestamp);

CREATE INDEX idx_notification_digests_user ON notification_digests(user_id);
CREATE INDEX idx_notification_digests_date ON notification_digests(digest_date);
CREATE INDEX idx_notification_digests_type ON notification_digests(digest_type);

CREATE INDEX idx_procedural_deadlines_domain ON procedural_deadlines(legal_domain);
CREATE INDEX idx_procedural_deadlines_active ON procedural_deadlines(is_active);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER notification_templates_updated_at_trigger
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notifications_updated_at_trigger
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notification_preferences_updated_at_trigger
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER procedural_deadlines_updated_at_trigger
  BEFORE UPDATE ON procedural_deadlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate procedural deadlines
CREATE OR REPLACE FUNCTION calculate_procedural_deadline(
  base_date DATE,
  calculation_method VARCHAR(50),
  calculation_value INTEGER,
  exclude_weekends BOOLEAN DEFAULT true
)
RETURNS DATE AS $
DECLARE
  result_date DATE;
  days_to_add INTEGER;
  current_date DATE;
BEGIN
  CASE calculation_method
    WHEN 'days_after' THEN
      IF exclude_weekends THEN
        -- Add business days only
        current_date := base_date;
        days_to_add := calculation_value;
        WHILE days_to_add > 0 LOOP
          current_date := current_date + INTERVAL '1 day';
          -- Skip weekends (Saturday = 6, Sunday = 0)
          IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
            days_to_add := days_to_add - 1;
          END IF;
        END LOOP;
        result_date := current_date;
      ELSE
        result_date := base_date + (calculation_value || ' days')::INTERVAL;
      END IF;
      
    WHEN 'days_before' THEN
      IF exclude_weekends THEN
        current_date := base_date;
        days_to_add := calculation_value;
        WHILE days_to_add > 0 LOOP
          current_date := current_date - INTERVAL '1 day';
          IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
            days_to_add := days_to_add - 1;
          END IF;
        END LOOP;
        result_date := current_date;
      ELSE
        result_date := base_date - (calculation_value || ' days')::INTERVAL;
      END IF;
      
    WHEN 'months_after' THEN
      result_date := base_date + (calculation_value || ' months')::INTERVAL;
      
    WHEN 'months_before' THEN
      result_date := base_date - (calculation_value || ' months')::INTERVAL;
      
    ELSE
      result_date := base_date;
  END CASE;
  
  RETURN result_date;
END;
$ LANGUAGE plpgsql;

-- Create function to generate deadline notifications
CREATE OR REPLACE FUNCTION generate_deadline_notifications()
RETURNS INTEGER AS $
DECLARE
  deadline_record RECORD;
  notification_days INTEGER;
  notification_date TIMESTAMP;
  notifications_created INTEGER := 0;
BEGIN
  -- Loop through all pending deadlines
  FOR deadline_record IN 
    SELECT cd.*, c.assigned_lawyer_id, c.title as case_title
    FROM case_deadlines cd
    JOIN cases c ON cd.case_id = c.id
    WHERE cd.status = 'pending'
    AND cd.deadline_date > CURRENT_TIMESTAMP
  LOOP
    -- Create notifications for each notification day
    FOREACH notification_days IN ARRAY deadline_record.notification_days_before
    LOOP
      notification_date := deadline_record.deadline_date - (notification_days || ' days')::INTERVAL;
      
      -- Only create notification if it's in the future and doesn't exist
      IF notification_date > CURRENT_TIMESTAMP THEN
        INSERT INTO deadline_notifications (deadline_id, notification_id, days_before, notification_date)
        SELECT 
          deadline_record.id,
          (INSERT INTO notifications (
            recipient_id, type, channel, subject, message, case_id, 
            related_entity_type, related_entity_id, scheduled_at, priority
          ) VALUES (
            deadline_record.assigned_to COALESCE(deadline_record.assigned_to, deadline_record.assigned_lawyer_id),
            'deadline_reminder',
            'in_app',
            'Rappel d''échéance: ' || deadline_record.title,
            'L''échéance "' || deadline_record.title || '" pour l''affaire "' || deadline_record.case_title || '" arrive dans ' || notification_days || ' jour(s).',
            deadline_record.case_id,
            'deadline',
            deadline_record.id,
            notification_date,
            CASE WHEN notification_days <= 1 THEN 'urgent'
                 WHEN notification_days <= 3 THEN 'high'
                 ELSE 'normal' END
          ) RETURNING id),
          notification_days,
          notification_date
        ON CONFLICT (deadline_id, days_before) DO NOTHING;
        
        notifications_created := notifications_created + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN notifications_created;
END;
$ LANGUAGE plpgsql;

-- Create function to send pending notifications
CREATE OR REPLACE FUNCTION process_pending_notifications()
RETURNS INTEGER AS $
DECLARE
  notification_record RECORD;
  notifications_processed INTEGER := 0;
BEGIN
  -- Process notifications scheduled for now or earlier
  FOR notification_record IN 
    SELECT * FROM notifications 
    WHERE status = 'pending' 
    AND scheduled_at <= CURRENT_TIMESTAMP
    ORDER BY priority DESC, scheduled_at ASC
    LIMIT 100 -- Process in batches
  LOOP
    -- Update status to sent (actual sending would be handled by external service)
    UPDATE notifications 
    SET status = 'sent', sent_at = CURRENT_TIMESTAMP
    WHERE id = notification_record.id;
    
    -- Log the event
    INSERT INTO notification_logs (notification_id, event_type, details)
    VALUES (notification_record.id, 'sent', jsonb_build_object(
      'channel', notification_record.channel,
      'recipient', notification_record.recipient_id,
      'processed_at', CURRENT_TIMESTAMP
    ));
    
    notifications_processed := notifications_processed + 1;
  END LOOP;
  
  RETURN notifications_processed;
END;
$ LANGUAGE plpgsql;

-- Insert default notification templates
INSERT INTO notification_templates (name, type, channel, subject_template, body_template, variables, is_system) VALUES
  (
    'Rappel d''échéance - 7 jours',
    'deadline_reminder',
    'email',
    'Rappel: {{deadline_title}} - {{case_title}}',
    'Bonjour {{user_name}},

Ceci est un rappel concernant l''échéance suivante :

**Affaire :** {{case_title}}
**Échéance :** {{deadline_title}}
**Date limite :** {{deadline_date}}
**Priorité :** {{priority}}

{{#if deadline_description}}
**Description :** {{deadline_description}}
{{/if}}

Veuillez prendre les mesures nécessaires avant la date limite.

Cordialement,
L''équipe JuristDZ',
    '[
      {"name": "user_name", "type": "string", "description": "Nom de l''utilisateur"},
      {"name": "case_title", "type": "string", "description": "Titre de l''affaire"},
      {"name": "deadline_title", "type": "string", "description": "Titre de l''échéance"},
      {"name": "deadline_date", "type": "datetime", "description": "Date de l''échéance"},
      {"name": "deadline_description", "type": "string", "description": "Description de l''échéance"},
      {"name": "priority", "type": "string", "description": "Priorité de l''échéance"}
    ]',
    true
  ),
  (
    'Rappel d''audience',
    'hearing_reminder',
    'email',
    'Rappel d''audience: {{case_title}}',
    'Bonjour {{user_name}},

Rappel concernant l''audience prévue :

**Affaire :** {{case_title}}
**Date :** {{hearing_date}}
**Heure :** {{hearing_time}}
**Lieu :** {{hearing_location}}
**Tribunal :** {{court_name}}

{{#if hearing_notes}}
**Notes :** {{hearing_notes}}
{{/if}}

N''oubliez pas de préparer vos dossiers et documents nécessaires.

Cordialement,
L''équipe JuristDZ',
    '[
      {"name": "user_name", "type": "string"},
      {"name": "case_title", "type": "string"},
      {"name": "hearing_date", "type": "date"},
      {"name": "hearing_time", "type": "time"},
      {"name": "hearing_location", "type": "string"},
      {"name": "court_name", "type": "string"},
      {"name": "hearing_notes", "type": "string"}
    ]',
    true
  ),
  (
    'Mise à jour d''affaire',
    'case_update',
    'in_app',
    'Mise à jour: {{case_title}}',
    'L''affaire "{{case_title}}" a été mise à jour.

{{update_description}}

Consultez les détails dans votre tableau de bord.',
    '[
      {"name": "case_title", "type": "string"},
      {"name": "update_description", "type": "string"}
    ]',
    true
  );

-- Insert default procedural deadlines for Algerian legal system
INSERT INTO procedural_deadlines (name, description, legal_reference, base_event, calculation_method, calculation_value, legal_domain, default_notification_days, is_critical) VALUES
  (
    'Délai d''appel',
    'Délai pour interjeter appel d''un jugement',
    'Code de Procédure Civile Art. 336',
    'judgment_date',
    'days_after',
    30,
    'civil',
    ARRAY[15, 7, 3, 1],
    true
  ),
  (
    'Délai de pourvoi en cassation',
    'Délai pour former un pourvoi en cassation',
    'Code de Procédure Civile Art. 351',
    'judgment_date',
    'days_after',
    60,
    'civil',
    ARRAY[30, 15, 7, 3],
    true
  ),
  (
    'Délai de signification',
    'Délai pour signifier un acte de procédure',
    'Code de Procédure Civile Art. 18',
    'filing_date',
    'days_after',
    8,
    'civil',
    ARRAY[5, 3, 1],
    false
  ),
  (
    'Délai de constitution d''avocat',
    'Délai pour constituer avocat après assignation',
    'Code de Procédure Civile Art. 61',
    'service_date',
    'days_after',
    15,
    'civil',
    ARRAY[10, 7, 3],
    false
  ),
  (
    'Délai de dépôt des conclusions',
    'Délai pour déposer les conclusions écrites',
    'Code de Procédure Civile Art. 63',
    'hearing_date',
    'days_before',
    8,
    'civil',
    ARRAY[15, 8, 3],
    true
  );

-- Create view for notification dashboard
CREATE VIEW notification_dashboard AS
SELECT 
  n.id,
  n.type,
  n.channel,
  n.subject,
  n.status,
  n.priority,
  n.scheduled_at,
  n.sent_at,
  n.case_id,
  c.title as case_title,
  c.case_number,
  n.recipient_id,
  u.email as recipient_email,
  up.first_name || ' ' || up.last_name as recipient_name
FROM notifications n
LEFT JOIN cases c ON n.case_id = c.id
LEFT JOIN users u ON n.recipient_id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id AND up.is_primary = true;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_templates TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON deadline_notifications TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_logs TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_digests TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON procedural_deadlines TO app_user;
GRANT SELECT ON notification_dashboard TO app_user;