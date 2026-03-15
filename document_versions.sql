-- Drop and recreate cleanly
DROP TABLE IF EXISTS document_versions CASCADE;

CREATE TABLE document_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id TEXT NOT NULL,
  document_title TEXT NOT NULL,
  template_id TEXT,
  version_number INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr',
  change_summary TEXT,
  word_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK separately to avoid any parsing ambiguity
ALTER TABLE document_versions
  ADD CONSTRAINT fk_dv_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_dv_doc ON document_versions(user_id, document_id, version_number DESC);
CREATE INDEX idx_dv_user ON document_versions(user_id, created_at DESC);

-- RLS
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dv_user_policy"
  ON document_versions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
