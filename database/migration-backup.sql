-- BACKUP: Ancien schéma avant migration SAAS
-- Exécuté le: $(date)

-- Sauvegarde des données existantes
CREATE TABLE IF NOT EXISTS cases_backup AS SELECT * FROM cases;

-- Note: Les données de test seront migrées vers la nouvelle structure
-- Les dossiers existants seront assignés à une organisation par défaut