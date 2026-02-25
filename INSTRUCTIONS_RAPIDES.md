# ⚡ Instructions Rapides - Migration 69 Wilayas

## 🎯 En 3 Étapes Simples

### 1️⃣ Ouvrir Supabase
```
https://fcteljnmcdelbratudnc.supabase.co
```
→ Menu gauche → "SQL Editor" → "+ New query"

### 2️⃣ Copier-Coller le Fichier
Ouvrir: `database/migrations/ALL_MIGRATIONS_COMBINED.sql`
→ Copier TOUT le contenu
→ Coller dans l'éditeur SQL

### 3️⃣ Exécuter
Cliquer sur "Run" (ou Ctrl+Enter)
→ Attendre 10-30 secondes
→ Vérifier les résultats affichés

## ✅ Résultats Attendus

Tu devrais voir:
```
Total Wilayas: 69
Total Tribunaux: 138
Total Barreaux: 69
Total Conservations: 69
Total Chambres Notaires: 69
Total Chambres Huissiers: 69
```

Et la liste des nouvelles wilayas (59-69):
```
59 | Aflou | أفلو | 59
60 | Barika | باريكة | 60
...
69 | El Aricha | العريشة | 69
```

## 🔍 Vérification Rapide

Après la migration, exécuter cette requête:
```sql
SELECT COUNT(*) FROM wilayas;
```
→ Devrait retourner: **69**

## ⚠️ Si Problème

### Les données ne s'affichent pas dans l'app?
Exécuter cette requête pour permettre la lecture publique:
```sql
CREATE POLICY "Allow public read" ON wilayas FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON tribunaux FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON barreaux FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON conservation_fonciere FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON chambres_notaires FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON chambres_huissiers FOR SELECT USING (true);
```

### Erreur "permission denied"?
Tu n'as pas les droits admin. Contacte l'administrateur du projet Supabase.

### Erreur "already exists"?
C'est normal! La migration gère les conflits automatiquement.

## 🎉 C'est Tout!

Une fois la migration exécutée:
1. Tester l'application: `yarn dev`
2. Vérifier les sélecteurs de wilayas
3. Tester la génération de documents

---

**Temps estimé**: 2-5 minutes  
**Difficulté**: ⭐ Facile  
**Fichier à utiliser**: `database/migrations/ALL_MIGRATIONS_COMBINED.sql`
