# 📊 Migrations Base de Données - 69 Wilayas

Ce dossier contient les scripts de migration pour mettre à jour la base de données avec les 69 wilayas d'Algérie.

## 📋 Contenu

### Scripts SQL
- `complete_all_wilayas_data.sql` - Création des tables et insertion des 58 wilayas existantes
- `add_69_wilayas.sql` - Ajout des 11 nouvelles wilayas (59-69)

### Scripts Node.js
- `run-migrations.js` - Script automatisé pour exécuter toutes les migrations

## 🚀 Utilisation

### Prérequis

1. PostgreSQL installé et en cours d'exécution
2. Base de données créée (par défaut: `juristdz`)
3. Variables d'environnement configurées (optionnel)

### Configuration

Créez un fichier `.env` à la racine du projet avec:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=juristdz
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
```

### Méthode 1: Script Automatisé (Recommandé)

```bash
# Exécuter toutes les migrations
node database/run-migrations.js
```

Le script va:
- ✅ Vérifier la connexion à la base de données
- ✅ Créer toutes les tables nécessaires
- ✅ Insérer les 69 wilayas
- ✅ Créer les tribunaux, barreaux, etc.
- ✅ Afficher les statistiques

### Méthode 2: Exécution Manuelle

```bash
# Se connecter à PostgreSQL
psql -U postgres -d juristdz

# Exécuter les migrations dans l'ordre
\i database/migrations/complete_all_wilayas_data.sql
\i database/migrations/add_69_wilayas.sql
```

## 📊 Structure de la Base de Données

### Tables Créées

#### 1. `wilayas`
Contient les 69 wilayas d'Algérie

| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | Identifiant unique |
| code | VARCHAR(2) | Code wilaya (01-69) |
| name_fr | VARCHAR(100) | Nom en français |
| name_ar | VARCHAR(100) | Nom en arabe |
| region | VARCHAR(50) | Région géographique |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |

#### 2. `tribunaux`
Tribunaux par wilaya

| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | Identifiant unique |
| wilaya_code | VARCHAR(2) | Code wilaya (FK) |
| name_fr | VARCHAR(200) | Nom en français |
| name_ar | VARCHAR(200) | Nom en arabe |
| type | VARCHAR(50) | Type de tribunal |
| address | TEXT | Adresse |
| phone | VARCHAR(20) | Téléphone |
| email | VARCHAR(100) | Email |

Types de tribunaux:
- `premiere_instance` - Tribunal de première instance
- `appel` - Cour d'appel
- `administratif` - Tribunal administratif
- `commerce` - Tribunal de commerce

#### 3. `barreaux`
Ordres des avocats par wilaya

| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | Identifiant unique |
| wilaya_code | VARCHAR(2) | Code wilaya (FK) |
| name_fr | VARCHAR(200) | Nom en français |
| name_ar | VARCHAR(200) | Nom en arabe |
| address | TEXT | Adresse |
| phone | VARCHAR(20) | Téléphone |
| email | VARCHAR(100) | Email |
| president | VARCHAR(100) | Nom du président |

#### 4. `conservation_fonciere`
Conservations foncières par wilaya

#### 5. `chambres_notaires`
Chambres des notaires par wilaya

#### 6. `chambres_huissiers`
Chambres des huissiers par wilaya

## 🔍 Vues Créées

### `v_wilayas_complete`
Vue complète avec statistiques pour chaque wilaya

```sql
SELECT * FROM v_wilayas_complete;
```

Colonnes:
- code, name_fr, name_ar, region
- nombre_tribunaux
- nombre_barreaux
- nombre_conservations
- nombre_chambres_notaires
- nombre_chambres_huissiers

### `v_nouvelles_wilayas`
Vue des 11 nouvelles wilayas (59-69)

```sql
SELECT * FROM v_nouvelles_wilayas;
```

## 📝 Requêtes Utiles

### Lister toutes les wilayas

```sql
SELECT code, name_fr, name_ar, region 
FROM wilayas 
ORDER BY code::INTEGER;
```

### Compter les wilayas par région

```sql
SELECT region, COUNT(*) as nombre
FROM wilayas
GROUP BY region
ORDER BY nombre DESC;
```

### Lister les tribunaux d'une wilaya

```sql
SELECT t.name_fr, t.type, t.address
FROM tribunaux t
WHERE t.wilaya_code = '16'  -- Alger
ORDER BY t.type;
```

### Statistiques globales

```sql
SELECT 
  (SELECT COUNT(*) FROM wilayas) as total_wilayas,
  (SELECT COUNT(*) FROM tribunaux) as total_tribunaux,
  (SELECT COUNT(*) FROM barreaux) as total_barreaux;
```

### Wilayas sans tribunal

```sql
SELECT w.code, w.name_fr
FROM wilayas w
LEFT JOIN tribunaux t ON w.code = t.wilaya_code
WHERE t.id IS NULL;
```

## 🆕 Les 11 Nouvelles Wilayas

| Code | Nom | Wilaya Mère | Région |
|------|-----|-------------|--------|
| 59 | Aflou | Laghouat (03) | Hautes Plaines |
| 60 | Barika | Batna (05) | Hautes Plaines |
| 61 | Ksar Chellala | Tiaret (14) | Hautes Plaines |
| 62 | Messaad | Djelfa (17) | Hautes Plaines |
| 63 | Aïn Oussera | Djelfa (17) | Hautes Plaines |
| 64 | Boussaâda | M'Sila (28) | Hautes Plaines |
| 65 | El Abiodh Sidi Cheikh | El Bayadh (32) | Sud |
| 66 | El Kantara | Biskra (07) | Sud |
| 67 | Bir El Ater | Tébessa (12) | Sud-Est |
| 68 | Ksar El Boukhari | Médéa (26) | Centre |
| 69 | El Aricha | Tlemcen (13) | Ouest |

## ⚠️ Notes Importantes

### Données Minimales
Les migrations créent des données minimales pour toutes les wilayas. Les informations suivantes doivent être complétées:
- ✅ Adresses exactes des institutions
- ✅ Numéros de téléphone
- ✅ Adresses email
- ✅ Noms des responsables

### Mise à Jour des Données

Pour mettre à jour les informations d'un tribunal:

```sql
UPDATE tribunaux 
SET 
  address = 'Nouvelle adresse',
  phone = '029 XX XX XX',
  email = 'tribunal@justice.dz'
WHERE wilaya_code = '59' AND type = 'premiere_instance';
```

### Sauvegarde

Avant d'exécuter les migrations, faites une sauvegarde:

```bash
pg_dump -U postgres juristdz > backup_avant_migration.sql
```

### Restauration

En cas de problème:

```bash
psql -U postgres juristdz < backup_avant_migration.sql
```

## 🧪 Tests

### Vérifier le nombre de wilayas

```sql
SELECT COUNT(*) FROM wilayas;
-- Résultat attendu: 69
```

### Vérifier les nouvelles wilayas

```sql
SELECT code, name_fr 
FROM wilayas 
WHERE code::INTEGER >= 59
ORDER BY code::INTEGER;
-- Résultat attendu: 11 lignes (59-69)
```

### Vérifier l'intégrité référentielle

```sql
-- Tous les tribunaux doivent avoir une wilaya valide
SELECT t.* 
FROM tribunaux t
LEFT JOIN wilayas w ON t.wilaya_code = w.code
WHERE w.code IS NULL;
-- Résultat attendu: 0 lignes
```

## 📚 Ressources

- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Wikipedia - Provinces of Algeria](https://en.wikipedia.org/wiki/Provinces_of_Algeria)
- [Décret présidentiel du 16 novembre 2025](https://www.joradp.dz/)

## 🆘 Support

En cas de problème:

1. Vérifiez les logs du script: `node database/run-migrations.js`
2. Vérifiez la connexion PostgreSQL: `psql -U postgres -d juristdz`
3. Consultez les erreurs dans les logs PostgreSQL
4. Vérifiez les variables d'environnement

## ✅ Checklist Post-Migration

- [ ] 69 wilayas dans la table `wilayas`
- [ ] Tribunaux créés pour toutes les wilayas
- [ ] Barreaux créés pour toutes les wilayas
- [ ] Conservations foncières créées
- [ ] Chambres des notaires créées
- [ ] Chambres des huissiers créées
- [ ] Vues créées et fonctionnelles
- [ ] Index créés pour la performance
- [ ] Application testée avec les nouvelles wilayas
- [ ] Sélecteurs de wilayas mis à jour
- [ ] Documents générés correctement

---

**Dernière mise à jour**: 25 février 2025
**Version**: 1.0.0
