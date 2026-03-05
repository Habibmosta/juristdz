-- =============================================
-- CRÉER LA VUE user_case_statistics
-- =============================================
-- Cette vue fournit des statistiques sur les dossiers par utilisateur
-- Elle est utilisée par le tableau de bord pour afficher les métriques

-- Supprimer la vue si elle existe déjà
DROP VIEW IF EXISTS user_case_statistics;

-- Créer la vue user_case_statistics
CREATE OR REPLACE VIEW user_case_statistics AS
SELECT 
    c.user_id,
    COUNT(DISTINCT c.id) as total_cases,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_cases,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'closed') as closed_cases,
    COUNT(DISTINCT c.id) FILTER (WHERE c.priority = 'urgent') as urgent_cases,
    COUNT(DISTINCT c.id) FILTER (WHERE c.deadline <= CURRENT_DATE + INTERVAL '7 days' AND c.status = 'active') as upcoming_deadlines,
    COALESCE(SUM(c.estimated_value) FILTER (WHERE c.status = 'active'), 0) as total_estimated_value,
    COALESCE(SUM(c.total_hours), 0) as total_hours_worked
FROM cases c
GROUP BY c.user_id;

-- Accorder les permissions
GRANT SELECT ON user_case_statistics TO authenticated;

-- =============================================
-- VÉRIFICATION
-- =============================================
-- Vérifier que la vue a été créée
SELECT 
    '✅ Vue user_case_statistics créée' as status,
    COUNT(*) as nombre_utilisateurs
FROM user_case_statistics;
