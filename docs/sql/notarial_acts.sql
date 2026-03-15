-- ============================================================
-- Table: notarial_acts — Registre des actes notariés
-- JuristDZ — Phase 1 Roadmap
-- ============================================================

CREATE TABLE IF NOT EXISTS notarial_acts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Numérotation automatique par notaire et par année
  act_number        TEXT NOT NULL,          -- Ex: "N/2026/0042"
  act_year          INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  sequence_number   INTEGER NOT NULL,       -- Numéro séquentiel dans l'année
  
  -- Type d'acte
  act_type          TEXT NOT NULL CHECK (act_type IN (
                      'vente_immobiliere',
                      'donation',
                      'succession',
                      'mariage',
                      'divorce',
                      'constitution_societe',
                      'dissolution_societe',
                      'procuration',
                      'testament',
                      'hypotheque',
                      'mainlevee',
                      'bail_commercial',
                      'bail_habitation',
                      'partage',
                      'autre'
                    )),
  act_type_label    TEXT,                   -- Label personnalisé si "autre"
  
  -- Parties
  party_first_name  TEXT NOT NULL,          -- Prénom partie principale
  party_last_name   TEXT NOT NULL,          -- Nom partie principale
  party_nin         TEXT,                   -- NIN (Numéro d'Identification National)
  party_address     TEXT,
  
  -- Contre-partie (optionnel)
  counterparty_name TEXT,
  counterparty_nin  TEXT,
  
  -- Détails de l'acte
  act_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  act_object        TEXT,                   -- Objet de l'acte
  property_address  TEXT,                   -- Adresse du bien (si immobilier)
  act_value         NUMERIC(15, 2),         -- Valeur en DA
  
  -- Droits et frais
  registration_fees NUMERIC(12, 2),         -- Droits d'enregistrement
  notary_fees       NUMERIC(12, 2),         -- Honoraires notaire
  
  -- Statut
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                      'draft',       -- Brouillon
                      'signed',      -- Signé
                      'registered',  -- Enregistré (Conservation foncière)
                      'delivered'    -- Expédition délivrée
                    )),
  
  -- Références
  registration_ref  TEXT,                   -- Référence enregistrement
  land_registry_ref TEXT,                   -- Référence Conservation foncière
  notes             TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unicité : un seul numéro par notaire par année
  UNIQUE(user_id, act_year, sequence_number)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notarial_acts_user_id   ON notarial_acts(user_id);
CREATE INDEX IF NOT EXISTS idx_notarial_acts_act_date  ON notarial_acts(act_date);
CREATE INDEX IF NOT EXISTS idx_notarial_acts_act_type  ON notarial_acts(act_type);
CREATE INDEX IF NOT EXISTS idx_notarial_acts_status    ON notarial_acts(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_notarial_acts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notarial_acts_updated_at
  BEFORE UPDATE ON notarial_acts
  FOR EACH ROW EXECUTE FUNCTION update_notarial_acts_updated_at();

-- Fonction pour générer le prochain numéro d'acte
CREATE OR REPLACE FUNCTION get_next_act_number(p_user_id UUID, p_year INTEGER)
RETURNS TABLE(sequence_num INTEGER, act_num TEXT) AS $$
DECLARE
  v_seq INTEGER;
  v_prefix TEXT;
BEGIN
  -- Obtenir le prochain numéro séquentiel
  SELECT COALESCE(MAX(sequence_number), 0) + 1
  INTO v_seq
  FROM notarial_acts
  WHERE user_id = p_user_id AND act_year = p_year;
  
  -- Format: N/YYYY/NNNN
  v_prefix := 'N/' || p_year || '/' || LPAD(v_seq::TEXT, 4, '0');
  
  RETURN QUERY SELECT v_seq, v_prefix;
END;
$$ LANGUAGE plpgsql;

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE notarial_acts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notarial_acts_select_own"
  ON notarial_acts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notarial_acts_insert_own"
  ON notarial_acts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notarial_acts_update_own"
  ON notarial_acts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "notarial_acts_delete_own"
  ON notarial_acts FOR DELETE
  USING (auth.uid() = user_id);
