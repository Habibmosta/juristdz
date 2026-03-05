-- =====================================================
-- SCRIPT DE NETTOYAGE COMPLET
-- ⚠️ ATTENTION: Ce script supprime TOUTES les données!
-- À utiliser uniquement en développement
-- =====================================================

-- Supprimer les vues d'abord (dépendances)
DROP VIEW IF EXISTS invoices_with_details CASCADE;
DROP VIEW IF EXISTS monthly_invoice_stats CASCADE;
DROP VIEW IF EXISTS calendar_events_with_details CASCADE;
DROP VIEW IF EXISTS events_needing_reminder CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS update_invoices_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_invoice_overdue_status() CASCADE;
DROP FUNCTION IF EXISTS get_invoice_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_demo_invoices(UUID, UUID, UUID) CASCADE;

DROP FUNCTION IF EXISTS update_calendar_events_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_upcoming_events(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS check_schedule_conflict(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID) CASCADE;
DROP FUNCTION IF EXISTS auto_complete_past_events() CASCADE;
DROP FUNCTION IF EXISTS get_calendar_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_demo_calendar_events(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS auto_create_case_events() CASCADE;

-- Supprimer les tables
DROP TABLE IF EXISTS client_document_shares CASCADE;
DROP TABLE IF EXISTS client_messages CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Nettoyage terminé!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Prochaines étapes:';
  RAISE NOTICE '1. Exécutez: create-invoicing.sql';
  RAISE NOTICE '2. Exécutez: create-calendar.sql';
  RAISE NOTICE '3. Exécutez: create-client-portal.sql';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Votre base sera propre et prête!';
END $$;
