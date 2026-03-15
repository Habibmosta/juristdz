-- ═══════════════════════════════════════════════════════════════════════════
-- 🔄 RAFRAÎCHIR LE CACHE SCHÉMA SUPABASE
-- ═══════════════════════════════════════════════════════════════════════════
-- Les colonnes existent mais Supabase ne les voit pas dans son cache
-- Ce script force le rafraîchissement du cache
-- ═══════════════════════════════════════════════════════════════════════════

-- Méthode 1: Notifier PostgREST de recharger le schéma
NOTIFY pgrst, 'reload schema';

-- Méthode 2: Forcer une modification mineure pour invalider le cache
COMMENT ON TABLE cases IS 'Table des dossiers juridiques - Cache rafraichi le 04/03/2026';

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ TERMINÉ!
-- ═══════════════════════════════════════════════════════════════════════════
-- Le cache du schéma a été rafraîchi.
-- 
-- Si l'erreur persiste:
-- 1. Allez dans Settings → API → Restart API
-- 2. Ou attendez 1-2 minutes que le cache se rafraîchisse automatiquement
-- 3. Rafraîchissez votre application (F5)
-- ═══════════════════════════════════════════════════════════════════════════
