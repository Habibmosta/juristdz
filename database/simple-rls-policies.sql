-- POLITIQUES RLS SIMPLIFIÉES SANS RÉCURSION
-- Version alternative qui évite complètement les références circulaires

-- =============================================
-- APPROCHE 1: POLITIQUES BASÉES SUR LES CLAIMS JWT
-- =============================================

-- Note: Cette approche nécessite que l'organization_id soit stocké dans le JWT
-- Pour l'instant, nous utilisons une approche plus simple

-- =============================================
-- APPROCHE 2: POLITIQUES TRÈS SIMPLES
-- =============================================

-- Réactiver RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- User Profiles: Politique la plus simple possible
CREATE POLICY "Allow all for authenticated users" ON user_profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- Organizations: Permettre l'accès à tous les utilisateurs authentifiés
CREATE POLICY "Allow read for authenticated users" ON organizations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON organizations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Clients: Accès pour tous les utilisateurs authentifiés
CREATE POLICY "Allow all for authenticated users" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

-- Cases: Accès pour tous les utilisateurs authentifiés
CREATE POLICY "Allow all for authenticated users" ON cases
    FOR ALL USING (auth.role() = 'authenticated');

-- Case Collaborators: Accès pour tous les utilisateurs authentifiés
CREATE POLICY "Allow all for authenticated users" ON case_collaborators
    FOR ALL USING (auth.role() = 'authenticated');

-- Documents: Accès pour tous les utilisateurs authentifiés
CREATE POLICY "Allow all for authenticated users" ON documents
    FOR ALL USING (auth.role() = 'authenticated');

-- Activity Log: Accès en lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Allow read for authenticated users" ON activity_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON activity_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- VÉRIFICATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Politiques RLS simplifiées créées';
    RAISE NOTICE 'Toutes les tables sont accessibles aux utilisateurs authentifiés';
    RAISE NOTICE 'L''isolation par organisation sera gérée au niveau applicatif';
END $$;