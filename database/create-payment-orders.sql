-- ============================================================
-- TABLE: payment_orders — Commandes de paiement abonnements
-- Idempotent: DROP IF EXISTS + CREATE
-- ============================================================

DROP TABLE IF EXISTS payment_orders CASCADE;

CREATE TABLE payment_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL CHECK (plan IN ('pro', 'cabinet')),
  amount_dzd      NUMERIC(10,2) NOT NULL,
  amount_usd      NUMERIC(10,2),
  gateway         TEXT NOT NULL CHECK (gateway IN ('paypal', 'baridimob')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference       TEXT,                    -- numéro de transaction PayPal ou BaridiMob
  confirmed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_status  ON payment_orders(status);

-- RLS
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_orders' AND policyname = 'Users can view own orders') THEN
    CREATE POLICY "Users can view own orders" ON payment_orders FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_orders' AND policyname = 'Users can insert own orders') THEN
    CREATE POLICY "Users can insert own orders" ON payment_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_orders' AND policyname = 'Users can update own orders') THEN
    CREATE POLICY "Users can update own orders" ON payment_orders FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_orders' AND policyname = 'Admins can view all orders') THEN
    CREATE POLICY "Admins can view all orders" ON payment_orders FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profession = 'admin')
    );
  END IF;
END $$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_payment_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_payment_orders_updated_at ON payment_orders;
CREATE TRIGGER trg_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_payment_orders_updated_at();

-- Vue admin des paiements
CREATE OR REPLACE VIEW v_payment_orders AS
SELECT
  po.*,
  p.first_name || ' ' || p.last_name AS user_name,
  p.email AS user_email,
  p.profession
FROM payment_orders po
JOIN profiles p ON p.id = po.user_id;
