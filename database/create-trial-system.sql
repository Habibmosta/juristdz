-- =====================================================
-- SYSTÈME D'ESSAI GRATUIT ET VALIDATION
-- Gestion des comptes trial, suspended, active, blocked
-- =====================================================

-- Ajouter les colonnes de gestion de compte à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'trial' 
  CHECK (account_status IN ('trial', 'suspended', 'active', 'blocked'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);

-- Limites pour les comptes en essai
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_cases INTEGER DEFAULT 3;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_clients INTEGER DEFAULT 5;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_documents INTEGER DEFAULT 10;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_invoices INTEGER DEFAULT 3;

-- Métadonnées
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at ON profiles(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON profiles(payment_status);

-- =====================================================
-- FONCTIONS AUTOMATIQUES
-- =====================================================

-- Fonction pour vérifier si un compte trial est expiré
CREATE OR REPLACE FUNCTION is_trial_expired(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_profile RECORD;
BEGIN
  SELECT account_status, trial_ends_at
  INTO v_profile
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_profile.account_status != 'trial' THEN
    RETURN FALSE;
  END IF;
  
  RETURN NOW() > v_profile.trial_ends_at;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour suspendre les comptes trial expirés
CREATE OR REPLACE FUNCTION suspend_expired_trials()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE profiles
  SET 
    account_status = 'suspended',
    suspension_reason = 'Essai gratuit expiré. Contactez l''administrateur pour activer votre compte.'
  WHERE account_status = 'trial'
    AND trial_ends_at < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RAISE NOTICE 'Suspended % expired trial accounts', v_count;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier les limites d'un compte
CREATE OR REPLACE FUNCTION check_account_limit(
  p_user_id UUID,
  p_resource_type VARCHAR,
  p_current_count INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_profile RECORD;
  v_limit INTEGER;
BEGIN
  SELECT account_status, max_cases, max_clients, max_documents, max_invoices
  INTO v_profile
  FROM profiles
  WHERE id = p_user_id;
  
  -- Si compte actif, pas de limite
  IF v_profile.account_status = 'active' THEN
    RETURN TRUE;
  END IF;
  
  -- Si compte suspendu ou bloqué, refuser
  IF v_profile.account_status IN ('suspended', 'blocked') THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier les limites pour compte trial
  CASE p_resource_type
    WHEN 'cases' THEN v_limit := v_profile.max_cases;
    WHEN 'clients' THEN v_limit := v_profile.max_clients;
    WHEN 'documents' THEN v_limit := v_profile.max_documents;
    WHEN 'invoices' THEN v_limit := v_profile.max_invoices;
    ELSE v_limit := 0;
  END CASE;
  
  RETURN p_current_count < v_limit;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour activer un compte
CREATE OR REPLACE FUNCTION activate_account(
  p_user_id UUID,
  p_admin_id UUID,
  p_payment_amount DECIMAL DEFAULT NULL,
  p_payment_reference VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET 
    account_status = 'active',
    validated_by = p_admin_id,
    validated_at = NOW(),
    payment_status = CASE WHEN p_payment_amount IS NOT NULL THEN 'paid' ELSE payment_status END,
    payment_date = CASE WHEN p_payment_amount IS NOT NULL THEN NOW() ELSE payment_date END,
    payment_amount = COALESCE(p_payment_amount, payment_amount),
    payment_reference = COALESCE(p_payment_reference, payment_reference),
    max_cases = NULL, -- Supprimer les limites
    max_clients = NULL,
    max_documents = NULL,
    max_invoices = NULL,
    suspension_reason = NULL
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour bloquer un compte
CREATE OR REPLACE FUNCTION block_account(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET 
    account_status = 'blocked',
    validated_by = p_admin_id,
    validated_at = NOW(),
    suspension_reason = p_reason
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques d'utilisation d'un compte
CREATE OR REPLACE FUNCTION get_account_usage(p_user_id UUID)
RETURNS TABLE (
  cases_count BIGINT,
  clients_count BIGINT,
  documents_count BIGINT,
  invoices_count BIGINT,
  cases_limit INTEGER,
  clients_limit INTEGER,
  documents_limit INTEGER,
  invoices_limit INTEGER,
  can_create_case BOOLEAN,
  can_create_client BOOLEAN,
  can_create_document BOOLEAN,
  can_create_invoice BOOLEAN
) AS $$
DECLARE
  v_profile RECORD;
BEGIN
  -- Récupérer le profil
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM cases WHERE user_id = p_user_id)::BIGINT,
    (SELECT COUNT(*) FROM clients WHERE user_id = p_user_id)::BIGINT,
    0::BIGINT, -- documents_count (à implémenter si table documents existe)
    (SELECT COUNT(*) FROM invoices WHERE user_id = p_user_id)::BIGINT,
    v_profile.max_cases,
    v_profile.max_clients,
    v_profile.max_documents,
    v_profile.max_invoices,
    -- Vérifier si peut créer
    CASE 
      WHEN v_profile.account_status = 'active' THEN TRUE
      WHEN v_profile.account_status IN ('suspended', 'blocked') THEN FALSE
      ELSE (SELECT COUNT(*) FROM cases WHERE user_id = p_user_id) < COALESCE(v_profile.max_cases, 999999)
    END,
    CASE 
      WHEN v_profile.account_status = 'active' THEN TRUE
      WHEN v_profile.account_status IN ('suspended', 'blocked') THEN FALSE
      ELSE (SELECT COUNT(*) FROM clients WHERE user_id = p_user_id) < COALESCE(v_profile.max_clients, 999999)
    END,
    CASE 
      WHEN v_profile.account_status = 'active' THEN TRUE
      WHEN v_profile.account_status IN ('suspended', 'blocked') THEN FALSE
      ELSE TRUE
    END,
    CASE 
      WHEN v_profile.account_status = 'active' THEN TRUE
      WHEN v_profile.account_status IN ('suspended', 'blocked') THEN FALSE
      ELSE (SELECT COUNT(*) FROM invoices WHERE user_id = p_user_id) < COALESCE(v_profile.max_invoices, 999999)
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue pour les comptes en attente de validation
CREATE OR REPLACE VIEW pending_accounts AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.account_status,
  p.trial_started_at,
  p.trial_ends_at,
  p.payment_status,
  EXTRACT(DAY FROM (p.trial_ends_at - NOW()))::INTEGER as days_remaining,
  (SELECT COUNT(*) FROM cases WHERE user_id = p.id) as cases_count,
  (SELECT COUNT(*) FROM clients WHERE user_id = p.id) as clients_count,
  p.created_at,
  p.last_login_at,
  p.login_count
FROM profiles p
WHERE p.account_status IN ('trial', 'suspended')
ORDER BY p.created_at DESC;

-- Vue pour les comptes expirés
CREATE OR REPLACE VIEW expired_trials AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.account_status,
  p.trial_ends_at,
  EXTRACT(DAY FROM (NOW() - p.trial_ends_at))::INTEGER as days_expired,
  (SELECT COUNT(*) FROM cases WHERE user_id = p.id) as cases_count,
  (SELECT COUNT(*) FROM clients WHERE user_id = p.id) as clients_count
FROM profiles p
WHERE p.account_status = 'trial'
  AND p.trial_ends_at < NOW()
ORDER BY p.trial_ends_at;

-- =====================================================
-- TRIGGER POUR METTRE À JOUR last_login_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    last_login_at = NOW(),
    login_count = login_count + 1
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Ce trigger doit être appelé depuis l'application lors du login

-- =====================================================
-- DONNÉES DE DÉMONSTRATION (OPTIONNEL)
-- =====================================================

-- Fonction pour créer un compte de test
CREATE OR REPLACE FUNCTION create_test_trial_account(
  p_email VARCHAR,
  p_first_name VARCHAR,
  p_last_name VARCHAR
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Cette fonction est juste pour référence
  -- L'inscription réelle se fait via Supabase Auth
  RAISE NOTICE 'Utilisez Supabase Auth pour créer des comptes';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN profiles.account_status IS 'Statut du compte: trial (essai), suspended (suspendu), active (actif), blocked (bloqué)';
COMMENT ON COLUMN profiles.trial_ends_at IS 'Date de fin de l''essai gratuit (7 jours par défaut)';
COMMENT ON COLUMN profiles.payment_status IS 'Statut du paiement: pending, paid, failed, refunded';
COMMENT ON COLUMN profiles.max_cases IS 'Nombre maximum de dossiers pour compte trial (NULL = illimité)';
COMMENT ON COLUMN profiles.suspension_reason IS 'Raison de la suspension du compte';

-- =====================================================
-- SCRIPT TERMINÉ
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Système d''essai gratuit créé avec succès!';
  RAISE NOTICE '📊 Colonnes ajoutées: account_status, trial_ends_at, payment_status, etc.';
  RAISE NOTICE '⚙️ Fonctions: suspend_expired_trials, activate_account, check_account_limit';
  RAISE NOTICE '📈 Vues: pending_accounts, expired_trials';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Prochaines étapes:';
  RAISE NOTICE '1. Mettre à jour les comptes existants si nécessaire';
  RAISE NOTICE '2. Configurer un cron job pour suspend_expired_trials()';
  RAISE NOTICE '3. Implémenter les hooks React pour vérifier les limites';
END $$;
