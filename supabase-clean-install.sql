-- ═══════════════════════════════════════════════════════════════════════════
-- INSTALLATION PROPRE - SUPPRESSION ET RECRÉATION COMPLÈTE
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 3 Mars 2026
-- Description: Script qui supprime tout et recrée proprement
-- ATTENTION: Ce script supprime les données existantes!
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 1: DÉSACTIVER RLS TEMPORAIREMENT
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS case_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cases DISABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 2: SUPPRIMER TOUTES LES POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Policies pour invoice_items
DROP POLICY IF EXISTS "Users can view invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can manage invoice items" ON invoice_items;

-- Policies pour invoices
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can manage their own invoices" ON invoices;

-- Policies pour calendar_events
DROP POLICY IF EXISTS "Users can view their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can manage their own calendar events" ON calendar_events;

-- Policies pour reminders
DROP POLICY IF EXISTS "Users can view their own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can manage their own reminders" ON reminders;

-- Policies pour case_events
DROP POLICY IF EXISTS "Users can view their own case events" ON case_events;
DROP POLICY IF EXISTS "Users can manage their own case events" ON case_events;

-- Policies pour documents
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can manage their own documents" ON documents;

-- Policies pour clients
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can manage their own clients" ON clients;

-- Policies pour cases
DROP POLICY IF EXISTS "Users can view their own cases" ON cases;
DROP POLICY IF EXISTS "Users can manage their own cases" ON cases;

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 3: SUPPRIMER LES TABLES (CASCADE pour supprimer les dépendances)
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS case_events CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS cases CASCADE;

-- ═════════════════