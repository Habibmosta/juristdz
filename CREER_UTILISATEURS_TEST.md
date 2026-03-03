# 👥 Créer les Utilisateurs de Test

## 🎯 OBJECTIF

Créer 4 utilisateurs de test pour valider l'isolation des données entre utilisateurs.

---

## 📋 LISTE DES UTILISATEURS À CRÉER

### ✅ Utilisateur 1 (DÉJÀ CRÉÉ)
- **Nom**: Ahmed Benali
- **Email**: ahmed.benali@test.dz
- **Mot de passe**: test123
- **Profession**: Avocat
- **Plan**: Gratuit
- **Statut**: ✅ Créé

### ⏳ Utilisateur 2
- **Nom**: Sarah Khelifi
- **Email**: sarah.khelifi@test.dz
- **Mot de passe**: test123
- **Profession**: Avocat
- **Plan**: Gratuit

### ⏳ Utilisateur 3
- **Nom**: Mohamed Ziani
- **Email**: mohamed.ziani@test.dz
- **Mot de passe**: test123
- **Profession**: Notaire
- **Plan**: Gratuit

### ⏳ Utilisateur 4
- **Nom**: Karim Djahid
- **Email**: karim.djahid@test.dz
- **Mot de passe**: test123
- **Profession**: Huissier
- **Plan**: Gratuit

---

## 🚀 PROCÉDURE DE CRÉATION

### Méthode 1: Via l'Interface Admin (RECOMMANDÉ)

1. **Ouvrir l'application**
   ```
   http://localhost:5173
   ```

2. **Se connecter en tant qu'admin**
   - Email: admin@juristdz.com
   - Mot de passe: Admin2024!JuristDZ

3. **Aller dans l'onglet "Utilisateurs"**

4. **Cliquer sur "Créer un Utilisateur"**

5. **Remplir le formulaire pour chaque utilisateur:**

   **Pour Sarah Khelifi:**
   - Prénom: Sarah
   - Nom: Khelifi
   - Email: sarah.khelifi@test.dz
   - Mot de passe: test123
   - Profession: Avocat
   - Plan: Gratuit
   - Limite Documents: 5
   - Limite Dossiers: 3

   **Pour Mohamed Ziani:**
   - Prénom: Mohamed
   - Nom: Ziani
   - Email: mohamed.ziani@test.dz
   - Mot de passe: test123
   - Profession: Notaire
   - Plan: Gratuit
   - Limite Documents: 5
   - Limite Dossiers: 3

   **Pour Karim Djahid:**
   - Prénom: Karim
   - Nom: Djahid
   - Email: karim.djahid@test.dz
   - Mot de passe: test123
   - Profession: Huissier
   - Plan: Gratuit
   - Limite Documents: 5
   - Limite Dossiers: 3

6. **Vérifier la création**
   - Les utilisateurs doivent apparaître dans la liste
   - Statut: Actif
   - Plan: free

---

## ✅ TESTS D'ISOLATION DES DONNÉES

### Test 1: Isolation entre Avocats

**Étape 1: Ahmed crée un dossier**
1. Se déconnecter de l'admin
2. Se connecter avec ahmed.benali@test.dz / test123
3. Aller dans "Mes Dossiers"
4. Créer un nouveau dossier:
   - Titre: "Affaire Test Ahmed"
   - Type: Civil
   - Description: "Dossier de test pour Ahmed"
5. Créer un document dans ce dossier
6. Noter le nombre de dossiers (devrait être 1)
7. Se déconnecter

**Étape 2: Sarah ne voit pas le dossier d'Ahmed**
1. Se connecter avec sarah.khelifi@test.dz / test123
2. Aller dans "Mes Dossiers"
3. ✅ **VÉRIFIER**: La liste doit être VIDE (0 dossiers)
4. Créer un nouveau dossier:
   - Titre: "Affaire Test Sarah"
   - Type: Pénal
   - Description: "Dossier de test pour Sarah"
5. ✅ **VÉRIFIER**: Sarah voit UNIQUEMENT son dossier (1 dossier)
6. Se déconnecter

**Étape 3: Ahmed ne voit toujours que son dossier**
1. Se reconnecter avec ahmed.benali@test.dz / test123
2. Aller dans "Mes Dossiers"
3. ✅ **VÉRIFIER**: Ahmed voit UNIQUEMENT son dossier (1 dossier)
4. ✅ **VÉRIFIER**: Il ne voit PAS le dossier de Sarah
5. Se déconnecter

### Test 2: Isolation entre Professions

**Étape 1: Mohamed (Notaire) ne voit rien**
1. Se connecter avec mohamed.ziani@test.dz / test123
2. Aller dans "Mes Dossiers"
3. ✅ **VÉRIFIER**: La liste doit être VIDE (0 dossiers)
4. ✅ **VÉRIFIER**: Il ne voit ni les dossiers d'Ahmed ni ceux de Sarah
5. Créer un dossier notarial:
   - Titre: "Acte Notarié Test"
   - Type: Notarial
   - Description: "Dossier de test pour Mohamed"
6. Se déconnecter

**Étape 2: Karim (Huissier) ne voit rien**
1. Se connecter avec karim.djahid@test.dz / test123
2. Aller dans "Mes Dossiers"
3. ✅ **VÉRIFIER**: La liste doit être VIDE (0 dossiers)
4. ✅ **VÉRIFIER**: Il ne voit aucun dossier des autres utilisateurs
5. Créer un dossier d'huissier:
   - Titre: "Constat d'Huissier Test"
   - Type: Exécution
   - Description: "Dossier de test pour Karim"
6. Se déconnecter

### Test 3: Vérification Admin

1. Se connecter avec admin@juristdz.com
2. Aller dans "Utilisateurs"
3. ✅ **VÉRIFIER**: Les 4 utilisateurs de test sont listés
4. ✅ **VÉRIFIER**: Chaque utilisateur a 1 dossier
5. Cliquer sur chaque utilisateur pour voir les détails

---

## 📊 RÉSULTATS ATTENDUS

### Isolation Réussie ✅
- Chaque utilisateur voit UNIQUEMENT ses propres dossiers
- Aucun utilisateur ne peut voir les dossiers des autres
- L'admin peut voir tous les utilisateurs (mais pas forcément leurs dossiers)

### Isolation Échouée ❌
- Un utilisateur voit les dossiers d'un autre utilisateur
- Les dossiers sont mélangés
- Erreurs lors de la création de dossiers

---

## 🔧 EN CAS DE PROBLÈME

### Problème 1: Utilisateur non créé
**Symptôme**: Erreur lors de la création  
**Solution**: 
1. Vérifier les logs dans la console du navigateur (F12)
2. Vérifier que l'email n'existe pas déjà
3. Vérifier la connexion à Supabase

### Problème 2: Utilisateur créé mais ne peut pas se connecter
**Symptôme**: "Invalid credentials"  
**Solution**:
1. Vérifier dans Supabase → Authentication → Users
2. Vérifier que l'utilisateur existe
3. Vérifier que le mot de passe est correct (test123)
4. Réinitialiser le mot de passe si nécessaire

### Problème 3: Utilisateur voit les dossiers des autres
**Symptôme**: Isolation des données échouée  
**Solution**:
1. ⚠️ **PROBLÈME CRITIQUE**: L'isolation ne fonctionne pas
2. Vérifier le code dans `src/services/caseService.ts`
3. Vérifier que les requêtes filtrent par `user_id`
4. Activer RLS immédiatement

### Problème 4: Erreur "Multiple GoTrueClient instances"
**Symptôme**: Warning dans la console  
**Solution**:
- Ce n'est qu'un warning, pas une erreur
- L'application fonctionne normalement
- Peut être ignoré pour le moment
- Sera corrigé dans une future optimisation

---

## 🎯 PROCHAINE ÉTAPE

Une fois les 4 utilisateurs créés et les tests d'isolation réussis:

1. **Activer Row Level Security (RLS)**
   - Fichier: `activer-rls-seulement.sql`
   - Exécuter dans Supabase SQL Editor
   - Cela renforcera la sécurité au niveau base de données

2. **Commencer le développement des fonctionnalités Priority 1**
   - Timeline des événements
   - Système de rappels
   - Suivi des échéances

---

## 📝 CHECKLIST

- [ ] Sarah Khelifi créée
- [ ] Mohamed Ziani créé
- [ ] Karim Djahid créé
- [ ] Test 1: Ahmed vs Sarah (isolation avocats) ✅
- [ ] Test 2: Mohamed (notaire) isolé ✅
- [ ] Test 3: Karim (huissier) isolé ✅
- [ ] Vérification admin ✅
- [ ] RLS activé
- [ ] Documentation des résultats

---

**Date**: 3 mars 2026  
**Durée estimée**: 10-15 minutes  
**Statut**: Prêt à exécuter

