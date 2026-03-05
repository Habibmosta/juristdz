-- =====================================================
-- SYSTÈME CLIENT PORTAL
-- Tables pour l'espace client sécurisé
-- =====================================================

-- Table pour les messages client-avocat
CREATE TABLE IF NOT EXISTS client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  
  -- Message
  content TEXT NOT NULL,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('lawyer', 'client')),
  
  -- Statut
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Pièces jointes
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour le partage de documents avec clients
CREATE TABLE IF NOT EXISTS client_document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Permissions
  can_download BOOLEAN DEFAULT TRUE,
  can_view BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  viewed_at TIMESTAMP WITH TIME ZONE,
  downloaded_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_client_messages_client_id ON client_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_user_id ON client_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_case_id ON client_messages(case_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_read ON client_messages(read);
CREATE INDEX IF NOT EXISTS idx_client_document_shares_client_id ON client_document_shares(client_id);
CREATE INDEX IF NOT EXISTS idx_client_document_shares_document_id ON client_document_shares(document_id);

-- RLS
ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_document_shares ENABLE ROW LEVEL SECURITY;

-- Politiques pour client_messages
CREATE POLICY "Lawyers can view own client messages"
  ON client_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Lawyers can create messages"
  ON client_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politiques pour client_document_shares
CREATE POLICY "Lawyers can manage document shares"
  ON client_document_shares FOR ALL
  USING (auth.uid() = shared_by);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Client Portal créé avec succès!';
END $$;
