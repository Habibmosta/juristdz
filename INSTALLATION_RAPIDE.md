# 🚀 Installation Rapide - Base de données SaaS

## ❌ Erreur rencontrée

```
ERROR: 42P01: relation "subscription_history" does not exist
```

**Cause:** Les tables SaaS n'existent pas encore dans votre base de données.

## ✅ Solution (1 seul fichier à exécuter)

### Étape unique: Créer les tables + insérer les données

```bash
# 1. Ouvrir Supabase SQL Editor:
https://fcteljnmcdelbratudnc.supabase.co

# 2. Copier-coller et exécuter CE FICHIER:
database/INSTALLATION_COMPLETE_SAAS.sql

# 3. Attendre la fin de l'exécution (environ 10 secondes)
```

## 📊 Ce que ce script fait

### 1. Crée les tables SaaS:
- ✅ `subscription_plans` - Plans d'abonnement
- ✅ `organizations` - Organisations/cabinets
- ✅ `subscription_history` - Historique de facturation
- ✅ `usage_metrics` - Métriques d'usage

### 2. Crée les index pour la performance:
- ✅ Index sur les plans actifs
- ✅ Index sur les abonnements
- ✅ Index sur l'historique
- ✅ Index sur les métriques

### 3. Insère les données de test:
- ✅ 3 plans d'abonnement (Starter, Professional, Enterprise)
- ✅ 7 organisations de test
- ✅ Historique de facturation
- ✅ Métriques d'usage

### 4. Affiche les vérifications:
- ✅ Comptage par statut
- ✅ Comptage par plan
- ✅ Calcul du MRR

## 🎯 Résultat attendu

Après l'exécution, vous verrez dans les résultats:

```sql
-- Organisations par statut:
subscription_status | count
--------------------+-------
active             |     3
past_due           |     1
suspended          |     1
trial              |     2

-- Abonnés par plan:
display_name   | subscribers | active_subscribers
---------------+-------------+-------------------
Starter        |           3 |                 0
Professional   |           3 |                 2
Enterprise     |           1 |                 1

-- MRR:
mrr      | active_subscriptions
---------+---------------------
42700.00 |                   3
```

## ✅ Vérification

Pour vérifier que tout est bien créé:

```sql
-- Lister les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscription_plans', 'organizations', 'subscription_history', 'usage_metrics');

-- Compter les organisations
SELECT COUNT(*) FROM organizations;
-- Résultat attendu: 7

-- Compter les plans
SELECT COUNT(*) FROM subscription_plans;
-- Résultat attendu: 3
```

## 🚀 Après l'installation

1. **Démarrer le serveur:**
   ```bash
   yarn dev
   ```

2. **Accéder à l'interface Admin:**
   - Ouvrir http://localhost:5174/
   - Se connecter
   - Cliquer sur "Administration"

3. **Voir les résultats:**
   - Onglet "Organisations": 7 organisations
   - Onglet "Abonnements": 3 plans
   - Statistiques: MRR 42,700 DZD, ARR 512,400 DZD

## 🐛 En cas de problème

### "Table already exists"
→ C'est normal! Le script utilise `CREATE TABLE IF NOT EXISTS`, donc il ne recrée pas les tables existantes.

### "Duplicate key value"
→ Les données de test existent déjà. Vous pouvez:
- Ignorer l'erreur (les données existantes restent)
- Ou supprimer les données existantes d'abord:
  ```sql
  DELETE FROM usage_metrics;
  DELETE FROM subscription_history;
  DELETE FROM organizations;
  DELETE FROM subscription_plans;
  ```

### "Foreign key violation"
→ Exécuter le script dans l'ordre (ne pas exécuter ligne par ligne)

## 📚 Fichiers

- **`database/INSTALLATION_COMPLETE_SAAS.sql`** ← Exécuter ce fichier
- ~~`database/saas-complete-schema.sql`~~ ← Ne plus utiliser
- ~~`database/test-data/saas_test_data.sql`~~ ← Ne plus utiliser

**Un seul fichier suffit maintenant!**

---

**Exécutez `database/INSTALLATION_COMPLETE_SAAS.sql` et c'est prêt! 🎉**
