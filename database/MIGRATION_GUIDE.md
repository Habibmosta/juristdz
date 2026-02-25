# 📖 Guide de Migration - 69 Wilayas d'Algérie

## 🎯 Objectif

Ajouter les données complètes des 69 wilayas d'Algérie dans la base de données Supabase.

## ✅ Ce qui sera créé

### Tables
1. **wilayas** - 69 wilayas avec code, nom FR/AR, code_postal_prefix, région
2. **tribunaux** - 2 tribunaux par wilaya (première instance + administratif) = 138 tribunaux
3. **barreaux** - 1 barreau par wilaya = 69 barreaux
4. **conservation_fonciere** - 1 conservation foncière par wilaya = 69
5. **chambres_notaires** - 1 chambre des notaires par wilaya = 69
6. **chambres_huissiers** - 1 chambre des huissiers par wilaya = 69

### Vues
- **v_wilayas_complete** - Vue complète avec statistiques par wilaya

### Total
- **69 wilayas**
- **414 institutions juridiques**

## 🚀 Méthode 1: Fichier SQL Combiné (RECOMMANDÉ)

### Étape 1: Ouvrir Supabase Dashboard

1. Aller sur: https://fcteljnmcdelbratudnc.supabase.co
2. Se connecter avec tes identifiants
3. Cliquer sur "SQL Editor" dans le menu de gauche

### Étape 2: Exécuter la Migration

1. Cliquer sur "New query" (+ Nouvelle requête)
2. Ouvrir le fichier: `database/migrations/ALL_MIGRATIONS_COMBINED.sql`
3. Copier TOUT le contenu du fichier
4. Coller dans l'éditeur SQL de Supabase
5. Cliquer sur "Run" (ou Ctrl+Enter)

### Étape 3: Vérifier les Résultats

La dernière requête du fichier affichera automatiquement:
- ✅ Nombre de wilayas (devrait être 69)
- ✅ Nombre de tribunaux (devrait être 138)
- ✅ Nombre de barreaux (devrait être 69)
- ✅ Nombre de conservations foncières (devrait être 69)
- ✅ Nombre de chambres notaires (devrait être 69)
- ✅ Nombre de chambres huissiers (devrait être 69)
- ✅ Liste des nouvelles wilayas (59-69)

## 🔧 Méthode 2: Fichiers Séparés

Si tu préfères exécuter les migrations une par une:

### Ordre d'exécution:

1. **complete_all_wilayas_data.sql**
   - Crée les tables de base
   - Insère les 58 wilayas existantes
   - Crée les institutions pour toutes les wilayas

2. **add_69_wilayas.sql**
   - Ajoute les 11 nouvelles wilayas (59-69)
   - Ajoute leurs tribunaux et barreaux

3. **add_code_postal_prefix.sql**
   - Ajoute le champ code_postal_prefix
   - Met à jour toutes les wilayas

## 📊 Vérification Post-Migration

### Requêtes de Vérification

```sql
-- 1. Compter les wilayas (devrait retourner 69)
SELECT COUNT(*) FROM wilayas;

-- 2. Vérifier que toutes ont un code_postal_prefix
SELECT COUNT(*) FROM wilayas WHERE code_postal_prefix IS NOT NULL;

-- 3. Lister les nouvelles wilayas
SELECT code, name_fr, name_ar, code_postal_prefix 
FROM wilayas 
WHERE code::INTEGER >= 59 
ORDER BY code::INTEGER;

-- 4. Statistiques complètes
SELECT * FROM v_wilayas_complete;

-- 5. Vérifier les institutions par wilaya
SELECT 
  w.code,
  w.name_fr,
  COUNT(DISTINCT t.id) as tribunaux,
  COUNT(DISTINCT b.id) as barreaux
FROM wilayas w
LEFT JOIN tribunaux t ON w.code = t.wilaya_code
LEFT JOIN barreaux b ON w.code = b.wilaya_code
GROUP BY w.code, w.name_fr
ORDER BY w.code::INTEGER;
```

## ⚠️ Résolution de Problèmes

### Erreur: "relation wilayas already exists"
✅ Normal! La migration utilise `CREATE TABLE IF NOT EXISTS`, elle ne créera pas la table si elle existe déjà.

### Erreur: "duplicate key value violates unique constraint"
✅ Normal! La migration utilise `ON CONFLICT DO UPDATE`, elle mettra à jour les données existantes.

### Erreur: "permission denied"
❌ Tu n'as pas les droits suffisants. Assure-toi d'être connecté avec un compte admin.

### Les données ne s'affichent pas dans l'application
1. Vérifier que les migrations ont bien été exécutées
2. Vérifier les Row Level Security (RLS) policies
3. Redémarrer l'application: `yarn dev`

## 🔐 Row Level Security (RLS)

Si les données ne sont pas accessibles depuis l'application, tu dois peut-être désactiver temporairement le RLS:

```sql
-- Désactiver RLS pour les tables (TEMPORAIRE - pour développement uniquement)
ALTER TABLE wilayas DISABLE ROW LEVEL SECURITY;
ALTER TABLE tribunaux DISABLE ROW LEVEL SECURITY;
ALTER TABLE barreaux DISABLE ROW LEVEL SECURITY;
ALTER TABLE conservation_fonciere DISABLE ROW LEVEL SECURITY;
ALTER TABLE chambres_notaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE chambres_huissiers DISABLE ROW LEVEL SECURITY;
```

Ou créer des policies pour permettre la lecture publique:

```sql
-- Permettre la lecture publique (recommandé)
CREATE POLICY "Allow public read access" ON wilayas FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON tribunaux FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON barreaux FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON conservation_fonciere FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON chambres_notaires FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON chambres_huissiers FOR SELECT USING (true);
```

## 📝 Après la Migration

1. ✅ Tester l'application: `yarn dev`
2. ✅ Vérifier les sélecteurs de wilayas
3. ✅ Tester la génération de documents
4. ✅ Vérifier les formulaires

## 🎉 Succès!

Si tout s'est bien passé, tu devrais maintenant avoir:
- ✅ 69 wilayas dans la base de données
- ✅ Toutes les institutions juridiques associées
- ✅ Le champ code_postal_prefix pour toutes les wilayas
- ✅ Des vues SQL pour faciliter les requêtes

## 💡 Prochaines Étapes

1. Compléter les coordonnées réelles (téléphones, emails, adresses précises)
2. Ajouter les communes pour chaque wilaya
3. Ajouter les daïras pour chaque wilaya
4. Enrichir les données des tribunaux (horaires, services, etc.)

---

**Date**: 25 février 2026  
**Version**: 1.0  
**Auteur**: Kiro AI Assistant
