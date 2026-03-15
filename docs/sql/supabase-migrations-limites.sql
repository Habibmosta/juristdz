-- ============================================================================
-- MIGRATIONS SUPABASE - SYSTÈME DE GESTION DES LIMITES D'UTILISATION
-- ============================================================================
-- Date: 8 Mars 2026
-- Description: Tables, fonctions et triggers pour gérer les limites d'usage
-- ============================================================================

-- ============================================================================
-- 1. TABLE: usage_stats
-- ============================================================================
-- Stocke les statistiques d'utilisation par utilisateur

CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Crédits
  credits_used_today INTEGER NOT NULL DEFAULT 0,
  credits_used_this_month INTEGER NOT NULL DEFAULT 0,
  credits_used_total INTEGER NOT NULL DEFAULT 0,
  
  -- Appels API
  api_calls_today INTEGER NOT NULL DEFAULT 0,
  api_calls_this_month INTEGER NOT NULL DEFAULT 0,
  api_calls_total INTEGER NOT NULL DEFAULT 0,
  
  -- Stockage
  storage_used_gb DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Dates de reset
  last_daily_reset TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_monthly_reset TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_last_daily_reset ON usage_stats(last_daily_reset);

-- RLS (Row Level Security)
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres stats
CREATE POLICY "Users can view own usage stats"
  ON usage_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres stats
CREATE POLICY "Users can update own usage stats"
  ON usage_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. MISE À JOUR TABLE: subscriptions
-- ============================================================================
-- Ajouter les colonnes manquantes si elles n'existent pas

DO $$ 
BEGIN
  -- Ajouter credits_remaining si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'credits_remaining'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN credits_remaining INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  -- Ajouter expires_at si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- ============================================================================
-- 3. FONCTION: Initialiser les crédits selon le plan
-- ============================================================================

CREATE OR REPLACE FUNCTION initialize_subscription_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Définir les crédits selon le plan
  IF NEW.plan = 'free' THEN
    NEW.credits_remaining := 50;
    NEW.expires_at := NOW() + INTERVAL '30 days';
  ELSIF NEW.plan = 'pro' THEN
    NEW.credits_remaining := 500;
    NEW.expires_at := NOW() + INTERVAL '365 days';
  ELSIF NEW.plan = 'cabinet' THEN
    NEW.credits_remaining := 999999; -- Illimité (représenté par un grand nombre)
    NEW.expires_at := NOW() + INTERVAL '365 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour initialiser les crédits à la création
DROP TRIGGER IF EXISTS trigger_initialize_subscription_credits ON subscriptions;
CREATE TRIGGER trigger_initialize_subscription_credits
  BEFORE INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION initialize_subscription_credits();

-- ============================================================================
-- 4. FONCTION: Déduire des crédits
-- ============================================================================

CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_credits INTEGER;
  v_plan TEXT;
BEGIN
  -- Récupérer les crédits actuels et le plan
  SELECT credits_remaining, plan INTO v_current_credits, v_plan
  FROM subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;
  
  -- Si pas d'abonnement actif
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Si plan cabinet (illimité), toujours autoriser
  IF v_plan = 'cabinet' THEN
    RETURN TRUE;
  END IF;
  
  -- Vérifier si suffisant
  IF v_current_credits < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Déduire les crédits
  UPDATE subscriptions
  SET credits_remaining = credits_remaining - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id AND status = 'active';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. FONCTION: Incrémenter l'usage
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_type TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Créer l'enregistrement si n'existe pas
  INSERT INTO usage_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Incrémenter selon le type
  IF p_type = 'credits' THEN
    UPDATE usage_stats
    SET credits_used_today = credits_used_today + 1,
        credits_used_this_month = credits_used_this_month + 1,
        credits_used_total = credits_used_total + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
  ELSIF p_type = 'api_calls' THEN
    UPDATE usage_stats
    SET api_calls_today = api_calls_today + 1,
        api_calls_this_month = api_calls_this_month + 1,
        api_calls_total = api_calls_total + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. FONCTION: Reset quotas journaliers
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS VOID AS $$
BEGIN
  UPDATE usage_stats
  SET credits_used_today = 0,
      api_calls_today = 0,
      last_daily_reset = NOW(),
      updated_at = NOW()
  WHERE last_daily_reset < CURRENT_DATE;
  
  RAISE NOTICE 'Daily quotas reset for % users', (SELECT COUNT(*) FROM usage_stats WHERE last_daily_reset < CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. FONCTION: Reset quotas mensuels
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS VOID AS $$
BEGIN
  UPDATE usage_stats
  SET credits_used_this_month = 0,
      api_calls_this_month = 0,
      last_monthly_reset = NOW(),
      updated_at = NOW()
  WHERE DATE_TRUNC('month', last_monthly_reset) < DATE_TRUNC('month', CURRENT_DATE);
  
  RAISE NOTICE 'Monthly quotas reset for % users', (SELECT COUNT(*) FROM usage_stats WHERE DATE_TRUNC('month', last_monthly_reset) < DATE_TRUNC('month', CURRENT_DATE));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. FONCTION: Vérifier l'expiration des abonnements
-- ============================================================================

CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS VOID AS $$
BEGIN
  -- Marquer comme expirés les abonnements dont la date est dépassée
  UPDATE subscriptions
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  RAISE NOTICE 'Marked % subscriptions as expired', (SELECT COUNT(*) FROM subscriptions WHERE status = 'expired' AND expires_at < NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. FONCTION: Obtenir les statistiques d'usage d'un utilisateur
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_usage(p_user_id UUID)
RETURNS TABLE(
  plan TEXT,
  credits_remaining INTEGER,
  credits_used_today INTEGER,
  credits_used_this_month INTEGER,
  api_calls_today INTEGER,
  storage_used_gb DECIMAL,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.plan,
    s.credits_remaining,
    COALESCE(u.credits_used_today, 0) AS credits_used_today,
    COALESCE(u.credits_used_this_month, 0) AS credits_used_this_month,
    COALESCE(u.api_calls_today, 0) AS api_calls_today,
    COALESCE(u.storage_used_gb, 0) AS storage_used_gb,
    s.expires_at
  FROM subscriptions s
  LEFT JOIN usage_stats u ON u.user_id = s.user_id
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. CRON JOBS (Nécessite l'extension pg_cron)
-- ============================================================================

-- Activer l'extension pg_cron si disponible
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Job 1: Reset quotas journaliers à minuit
SELECT cron.schedule(
  'reset-daily-quotas',
  '0 0 * * *', -- Tous les jours à 00:00
  'SELECT reset_daily_quotas();'
);

-- Job 2: Reset quotas mensuels le 1er de chaque mois
SELECT cron.schedule(
  'reset-monthly-quotas',
  '0 0 1 * *', -- Le 1er de chaque mois à 00:00
  'SELECT reset_monthly_quotas();'
);

-- Job 3: Vérifier les abonnements expirés toutes les heures
SELECT cron.schedule(
  'check-expired-subscriptions',
  '0 * * * *', -- Toutes les heures
  'SELECT check_expired_subscriptions();'
);

-- ============================================================================
-- 11. TRIGGER: Créer usage_stats automatiquement pour nouveaux utilisateurs
-- ============================================================================

CREATE OR REPLACE FUNCTION create_usage_stats_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO usage_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_usage_stats ON subscriptions;
CREATE TRIGGER trigger_create_usage_stats
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION create_usage_stats_for_new_user();

-- ============================================================================
-- 12. VUES UTILES
-- ============================================================================

-- Vue: Statistiques globales d'usage
CREATE OR REPLACE VIEW v_usage_overview AS
SELECT 
  s.user_id,
  s.plan,
  s.status,
  s.credits_remaining,
  s.expires_at,
  u.credits_used_today,
  u.credits_used_this_month,
  u.credits_used_total,
  u.api_calls_today,
  u.api_calls_this_month,
  u.api_calls_total,
  u.storage_used_gb,
  CASE 
    WHEN s.expires_at IS NULL THEN NULL
    WHEN s.expires_at < NOW() THEN 0
    ELSE EXTRACT(DAY FROM (s.expires_at - NOW()))
  END AS days_until_expiration
FROM subscriptions s
LEFT JOIN usage_stats u ON u.user_id = s.user_id
WHERE s.status = 'active';

-- Vue: Utilisateurs proches des limites
CREATE OR REPLACE VIEW v_users_near_limits AS
SELECT 
  s.user_id,
  s.plan,
  s.credits_remaining,
  u.credits_used_today,
  u.api_calls_today,
  u.storage_used_gb,
  CASE 
    WHEN s.plan = 'free' AND s.credits_remaining <= 10 THEN 'credits_critical'
    WHEN s.plan = 'free' AND u.credits_used_today >= 8 THEN 'daily_quota_warning'
    WHEN s.plan = 'free' AND u.storage_used_gb >= 0.85 THEN 'storage_warning'
    WHEN s.plan = 'pro' AND s.credits_remaining <= 50 THEN 'credits_warning'
    WHEN s.expires_at IS NOT NULL AND s.expires_at < NOW() + INTERVAL '7 days' THEN 'expiration_warning'
    ELSE 'ok'
  END AS warning_type
FROM subscriptions s
LEFT JOIN usage_stats u ON u.user_id = s.user_id
WHERE s.status = 'active'
  AND (
    (s.plan = 'free' AND s.credits_remaining <= 10) OR
    (s.plan = 'free' AND u.credits_used_today >= 8) OR
    (s.plan = 'free' AND u.storage_used_gb >= 0.85) OR
    (s.plan = 'pro' AND s.credits_remaining <= 50) OR
    (s.expires_at IS NOT NULL AND s.expires_at < NOW() + INTERVAL '7 days')
  );

-- ============================================================================
-- 13. DONNÉES DE TEST
-- ============================================================================

-- Insérer des données de test pour développement (à supprimer en production)
-- INSERT INTO usage_stats (user_id, credits_used_today, credits_used_this_month, api_calls_today, storage_used_gb)
-- VALUES 
--   ('00000000-0000-0000-0000-000000000001', 5, 45, 25, 0.45),
--   ('00000000-0000-0000-0000-000000000002', 9, 95, 48, 0.92);

-- ============================================================================
-- FIN DES MIGRATIONS
-- ============================================================================

-- Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migrations terminées avec succès!';
  RAISE NOTICE '📊 Tables créées: usage_stats';
  RAISE NOTICE '⚙️ Fonctions créées: 8 fonctions';
  RAISE NOTICE '🔄 Triggers créés: 2 triggers';
  RAISE NOTICE '⏰ CRON jobs créés: 3 jobs';
  RAISE NOTICE '👁️ Vues créées: 2 vues';
END $$;
