# 🚀 Suite: Création des Comptes de Test

## ✅ CE QUI EST FAIT

1. ✅ Ahmed Benali créé (ahmed.benali@test.dz)
2. ✅ Problèmes console résolus
3. ✅ Interface admin fonctionnelle

---

## 📋 CE QU'IL RESTE À FAIRE (5 minutes)

### Créer 3 Comptes Supplémentaires

#### 1. Sarah Khelifi - Avocate
```
Prénom: Sarah
Nom: Khelifi
Email: sarah.khelifi@test.dz
Mot de passe: test123
Profession: Avocat
Plan: Gratuit (5 documents, 30 jours)
```

#### 2. Mohamed Ziani - Notaire
```
Prénom: Mohamed
Nom: Ziani
Email: mohamed.ziani@test.dz
Mot de passe: test123
Profession: Notaire
Plan: Gratuit (5 documents, 30 jours)
```

#### 3. Karim Djahid - Huissier
```
Prénom: Karim
Nom: Djahid
Email: karim.djahid@test.dz
Mot de passe: test123
Profession: Huissier
Plan: Gratuit (5 documents, 30 jours)
```

---

## 🎯 COMMENT FAIRE

### Étape par Étape

1. **Rester connecté** en tant qu'admin
2. **Aller** dans l'onglet "Utilisateurs"
3. **Cliquer** sur "Créer un Utilisateur"
4. **Remplir** les informations (voir ci-dessus)
5. **Cliquer** sur "Créer l'Utilisateur"
6. **Répéter** pour les 3 comptes

---

## 🧪 TESTS À FAIRE APRÈS

### Test 1: Vérifier la Liste des Utilisateurs

Dans l'interface admin, tu devrais voir:
- ✅ admin@juristdz.com (Admin)
- ✅ ahmed.benali@test.dz (Avocat)
- ✅ sarah.khelifi@test.dz (Avocat)
- ✅ mohamed.ziani@test.dz (Notaire)
- ✅ karim.djahid@test.dz (Huissier)

**Total: 5 utilisateurs**

### Test 2: Isolation des Données

1. **Se déconnecter** du compte admin
2. **Se connecter** avec ahmed.benali@test.dz / test123
3. **Créer un dossier:**
   - Titre: "Dossier Test Ahmed"
   - Client: "Client Test"
   - Description: "Test isolation"
4. **Noter** que le dossier apparaît dans la liste
5. **Se déconnecter**
6. **Se connecter** avec sarah.khelifi@test.dz / test123
7. **Vérifier** que Sarah ne voit PAS le dossier d'Ahmed
8. ✅ **Si Sarah ne voit rien** → Isolation fonctionne!
9. ❌ **Si Sarah voit le dossier d'Ahmed** → Problème à corriger

### Test 3: Quotas

Pour chaque utilisateur:
1. **Se connecter**
2. **Vérifier** qu'il voit "5 documents restants"
3. **Générer** un document
4. **Vérifier** qu'il voit "4 documents restants"
5. ✅ Quotas fonctionnent!

---

## 📊 RÉSULTAT ATTENDU

### Base de Données

**Table: auth.users**
- 5 utilisateurs créés

**Table: public.profiles**
- 5 profils créés
- 1 admin (is_admin = true)
- 4 utilisateurs normaux (is_admin = false)

**Table: public.subscriptions**
- 5 abonnements créés
- 1 illimité (admin)
- 4 gratuits (5 documents, 30 jours)

**Table: public.cases**
- 0 dossiers (pour l'instant)
- Après le test: 1 dossier (Ahmed)

**Table: public.documents**
- 0 documents (pour l'instant)

---

## 🎉 APRÈS LES TESTS

Si tout fonctionne:
1. ✅ Isolation des données confirmée
2. ✅ Quotas fonctionnels
3. ✅ Interface admin opérationnelle
4. ✅ Système SaaS prêt pour la production

### Prochaine Étape: Activer RLS

Une fois les tests validés, on activera Row Level Security pour:
- Sécurité renforcée au niveau base de données
- Protection automatique des données
- Impossible de contourner même avec accès direct

---

## 📞 SI PROBLÈME

### Sarah voit le dossier d'Ahmed

**Cause:** Isolation des données ne fonctionne pas

**Solution:**
1. Vérifier que `user_id` est bien enregistré dans `cases`
2. Vérifier le code de récupération des dossiers
3. Activer RLS immédiatement

### Impossible de créer un dossier

**Cause:** Problème de permissions ou de structure

**Solution:**
1. Vérifier la console pour les erreurs
2. Vérifier que la table `cases` existe
3. Vérifier que l'utilisateur est bien connecté

### Quotas ne diminuent pas

**Cause:** Fonction `increment_document_usage` ne fonctionne pas

**Solution:**
1. Vérifier que la fonction existe dans Supabase
2. Vérifier qu'elle est appelée lors de la génération
3. Tester manuellement dans SQL Editor

---

## ✅ CHECKLIST

- [ ] Créer Sarah Khelifi
- [ ] Créer Mohamed Ziani
- [ ] Créer Karim Djahid
- [ ] Vérifier la liste des 5 utilisateurs
- [ ] Test isolation: Ahmed crée un dossier
- [ ] Test isolation: Sarah ne voit pas le dossier d'Ahmed
- [ ] Test quotas: Vérifier "5 documents restants"
- [ ] Test quotas: Générer un document
- [ ] Test quotas: Vérifier "4 documents restants"
- [ ] Tout fonctionne → Activer RLS

---

**Date**: 2 mars 2026  
**Statut**: En cours - Création des comptes  
**Temps estimé**: 5 minutes pour créer + 10 minutes pour tester  
**Total**: 15 minutes

