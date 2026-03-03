# 📝 Instructions pour Exécuter le Script SQL

## ⚠️ ERREUR RENCONTRÉE

```
Error: Failed to run sql query: ERROR: 42703: column "user_id" does not exist
```

**Cause:** Le script original référençait la table `cases` qui n'a pas de colonne `user_id`.

**Solution:** Utiliser le script simplifié qui ne dépend pas de `cases`.

---

## ✅ SOLUTION: Script Simplifié

### Étape 1: Ouvrir Supabase Dashboard

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Cliquer sur "SQL Editor" dans le menu de gauche

### Étape 2: Exécuter le Script Simplifié

1. Ouvrir le fichier: `supabase/create-clients-invoices-simple.sql`
2. Copier TOUT le contenu (Ctrl+A, Ctrl+C)
3. Coller dans SQL Editor
4. Cliquer sur "Run" (ou Ctrl+Enter)

### Étape 3: Vérifier le Résultat

Vous devriez voir:
```
Script exécuté avec succès! Tables créées: clients, time_entries, invoices, invoice_items, payments
```

### Étape 4: Vérifier les Tables Créées

Exécuter cette requête pour confirmer:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('clients', 'time_entries', 'invoices', 'invoice_items', 'payments')
ORDER BY table_name;
```

**Résultat attendu:** 5 tables listées

---

## 📊 Tables Créées

### 1. `clients` - Gestion des Clients
- Particuliers ET entreprises
- Contact complet (email, téléphone, adresse)
- CIN, NIF, RC (identification algérienne)
- Wilaya et code postal
- Notes privées
- Statut (actif/inactif/archivé)

### 2. `time_entries` - Time Tracking (comme Clio)
- Chronomètre start/stop
- Durée calculée automatiquement
- Taux horaire personnalisable
- Montant calculé automatiquement
- Facturable/Non facturable
- Types d'activité (consultation, recherche, rédaction, etc.)

### 3. `invoices` - Factures
- Numérotation automatique (INV-2026-0001)
- Calculs automatiques (sous-total, TVA 19%, total)
- Statuts (brouillon, envoyée, payée, en retard)
- Suivi des paiements
- Dates (émission, échéance, paiement)

### 4. `invoice_items` - Lignes de Facture
- Services, dépenses, entrées de temps
- Quantité, prix unitaire, montant
- Lié aux time entries

### 5. `payments` - Paiements
- Montant, date, méthode
- Référence (chèque, virement)
- Notes

---

## 🔧 Fonctions Automatiques Créées

### 1. `calculate_time_entry_duration()`
- Calcule automatiquement la durée en minutes
- Calcule automatiquement le montant (durée × taux horaire)
- Se déclenche à chaque insertion/modification d'une entrée de temps

### 2. `update_invoice_total()`
- Calcule automatiquement le sous-total
- Calcule automatiquement la TVA (19%)
- Calcule automatiquement le total
- Se déclenche à chaque ajout/modification/suppression de ligne de facture

### 3. `generate_invoice_number(p_user_id)`
- Génère un numéro de facture unique
- Format: INV-2026-0001, INV-2026-0002, etc.
- Incrémente automatiquement par année

---

## 📈 Vues Créées

### 1. `client_stats`
Statistiques par client:
- Nombre de factures
- Total facturé
- Total payé
- Total en attente

### 2. `overdue_invoices`
Factures en retard:
- Toutes les factures non payées après échéance
- Nombre de jours de retard
- Informations client

---

## 🧪 Test Rapide

Après avoir exécuté le script, testez avec ces requêtes:

### Test 1: Créer un client
```sql
INSERT INTO public.clients (user_id, first_name, last_name, email, phone, city, wilaya, client_type)
VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Votre user_id
  'Ahmed',
  'Benali',
  'ahmed.benali@test.dz',
  '0555123456',
  'Alger',
  'Alger',
  'individual'
);
```

### Test 2: Vérifier le client créé
```sql
SELECT * FROM public.clients ORDER BY created_at DESC LIMIT 1;
```

### Test 3: Créer une entrée de temps
```sql
INSERT INTO public.time_entries (
  user_id, 
  client_id, 
  description, 
  activity_type, 
  start_time, 
  end_time, 
  hourly_rate, 
  billable
)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM public.clients ORDER BY created_at DESC LIMIT 1),
  'Consultation juridique',
  'consultation',
  NOW() - INTERVAL '2 hours',
  NOW(),
  15000,
  true
);
```

### Test 4: Vérifier le calcul automatique
```sql
SELECT 
  description,
  duration_minutes,
  hourly_rate,
  amount,
  ROUND((duration_minutes / 60.0) * hourly_rate, 2) as expected_amount
FROM public.time_entries 
ORDER BY created_at DESC 
LIMIT 1;
```

**Résultat attendu:**
- duration_minutes: 120 (2 heures)
- hourly_rate: 15000
- amount: 30000 (calculé automatiquement!)

---

## ✅ Prochaines Étapes

Une fois le script exécuté avec succès:

1. ✅ Tester l'interface de gestion des clients
2. ✅ Tester le time tracker
3. ✅ Tester la facturation
4. ✅ Identifier 3 avocats pour tester
5. ✅ Collecter les feedbacks

---

## 🆘 En Cas de Problème

### Erreur: "relation already exists"
**Solution:** Les tables existent déjà, c'est OK! Le script utilise `CREATE TABLE IF NOT EXISTS`.

### Erreur: "permission denied"
**Solution:** Vérifier que vous êtes connecté avec le bon compte Supabase.

### Erreur: "function already exists"
**Solution:** Le script utilise `CREATE OR REPLACE FUNCTION`, c'est OK!

### Autre erreur
**Solution:** Copier l'erreur complète et me la partager.

---

**Date**: 3 mars 2026  
**Fichier à exécuter**: `supabase/create-clients-invoices-simple.sql`  
**Durée**: 5 minutes  
**Prochaine étape**: Tests des fonctionnalités
