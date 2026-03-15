-- CASES TABLE (extended) + related tables - Idempotent
-- case_documents, case_events, case_tasks, case_notes, case_clients

-- ─── case_documents ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own case documents" ON case_documents;
DROP POLICY IF EXISTS "Users can insert own case documents" ON case_documents;
DROP POLICY IF EXISTS "Users can update own case documents" ON case_documents;
DROP POLICY IF EXISTS "Users can delete own case documents" ON case_documents;
DROP TABLE IF EXISTS case_documents CASCADE;

CREATE TABLE case_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other',
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX idx_case_documents_user_id ON case_documents(user_id);

ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own case documents"
  ON case_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own case documents"
  ON case_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own case documents"
  ON case_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own case documents"
  ON case_documents FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON case_documents TO authenticated;

-- ─── case_events ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own case events" ON case_events;
DROP POLICY IF EXISTS "Users can insert own case events" ON case_events;
DROP POLICY IF EXISTS "Users can update own case events" ON case_events;
DROP POLICY IF EXISTS "Users can delete own case events" ON case_events;
DROP TABLE IF EXISTS case_events CASCADE;

CREATE TABLE case_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'hearing'
    CHECK (event_type IN ('hearing','deadline','meeting','filing','judgment','other')),
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_case_events_case_id ON case_events(case_id);
CREATE INDEX idx_case_events_user_id ON case_events(user_id);
CREATE INDEX idx_case_events_event_date ON case_events(event_date ASC);

ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own case events"
  ON case_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own case events"
  ON case_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own case events"
  ON case_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own case events"
  ON case_events FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON case_events TO authenticated;

-- ─── case_tasks ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own case tasks" ON case_tasks;
DROP POLICY IF EXISTS "Users can insert own case tasks" ON case_tasks;
DROP POLICY IF EXISTS "Users can update own case tasks" ON case_tasks;
DROP POLICY IF EXISTS "Users can delete own case tasks" ON case_tasks;
DROP TABLE IF EXISTS case_tasks CASCADE;

CREATE TABLE case_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','critical')),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_case_tasks_case_id ON case_tasks(case_id);
CREATE INDEX idx_case_tasks_user_id ON case_tasks(user_id);

ALTER TABLE case_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own case tasks"
  ON case_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own case tasks"
  ON case_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own case tasks"
  ON case_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own case tasks"
  ON case_tasks FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON case_tasks TO authenticated;

-- ─── case_notes ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own case notes" ON case_notes;
DROP POLICY IF EXISTS "Users can insert own case notes" ON case_notes;
DROP POLICY IF EXISTS "Users can update own case notes" ON case_notes;
DROP POLICY IF EXISTS "Users can delete own case notes" ON case_notes;
DROP TABLE IF EXISTS case_notes CASCADE;

CREATE TABLE case_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_case_notes_case_id ON case_notes(case_id);
CREATE INDEX idx_case_notes_user_id ON case_notes(user_id);

ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own case notes"
  ON case_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own case notes"
  ON case_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own case notes"
  ON case_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own case notes"
  ON case_notes FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON case_notes TO authenticated;

-- ─── case_clients (junction table) ───────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own case clients" ON case_clients;
DROP POLICY IF EXISTS "Users can insert own case clients" ON case_clients;
DROP POLICY IF EXISTS "Users can delete own case clients" ON case_clients;
DROP TABLE IF EXISTS case_clients CASCADE;

CREATE TABLE case_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client'
    CHECK (role IN ('client','adverse_party','witness','expert','other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(case_id, client_id)
);

CREATE INDEX idx_case_clients_case_id ON case_clients(case_id);
CREATE INDEX idx_case_clients_client_id ON case_clients(client_id);

ALTER TABLE case_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own case clients"
  ON case_clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own case clients"
  ON case_clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own case clients"
  ON case_clients FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON case_clients TO authenticated;
