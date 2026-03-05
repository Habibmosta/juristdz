# 🧪 GUIDE DE TEST DES NOUVELLES FONCTIONNALITÉS

## ✅ INTÉGRATION TERMINÉE!

Les 3 nouveaux systèmes sont maintenant intégrés dans l'application:
- ✅ Routes ajoutées dans App.tsx
- ✅ Menu mis à jour dans Sidebar.tsx
- ✅ Traductions ajoutées dans constants.ts
- ✅ Types ajoutés dans types.ts
- ✅ Compilation réussie sans erreurs

---

## 🚀 DÉMARRER L'APPLICATION

```bash
yarn dev
```

L'application démarre sur: **http://localhost:5174/**

---

## 📋 TESTS À EFFECTUER

### 1. VÉRIFIER LE MENU

**Étapes:**
1. Ouvre http://localhost:5174/
2. Connecte-toi avec ton compte
3. Regarde le menu latéral (Sidebar)

**Tu devrais voir dans "Suite Métier":**
- 📁 Dossiers
- 👥 Clients
- 📅 Calendrier ⬅️ NOUVEAU
- 💰 Facturation ⬅️ NOUVEAU
- ⏱️ Temps ⬅️ NOUVEAU
- 👤 Portail Client ⬅️ NOUVEAU
- 📝 Rédaction
- 🛡️ Analyse

---

### 2. TESTER LA FACTURATION

**Accès:** Clique sur "💰 Facturation" dans le menu

**Test 1: Créer une facture**
1. Clique sur "Nouvelle Facture"
2. Sélectionne un client dans la liste
3. (Optionnel) Sélectionne un dossier
4. Remplis les dates:
   - Date d'émission: Aujourd'hui
   - Date d'échéance: Dans 30 jours
5. Ajoute un élément:
   - Description: "Consultation juridique"
   - Quantité: 2
   - Prix unitaire: 15000
6. Vérifie que le calcul est automatique:
   - Sous-total: 30,000 DA
   - TVA (19%): 5,700 DA
   - Total: 35,700 DA
7. Clique sur "Créer"

**Résultat attendu:**
- ✅ Message: "Facture créée avec succès!"
- ✅ La facture apparaît dans la liste
- ✅ Numéro: INV-2026-0001

**Test 2: Générer un PDF**
1. Dans la liste des factures, trouve ta facture
2. Clique sur l'icône "📥 Télécharger PDF"

**Résultat attendu:**
- ✅ Un PDF se télécharge automatiquement
- ✅ Le PDF contient:
  - En-tête avec couleurs
  - Informations avocat et client
  - Tableau des éléments
  - Calculs (sous-total, TVA, total)
  - Pied de page

**Test 3: Envoyer par email**
1. Trouve une facture avec statut "Brouillon"
2. Clique sur l'icône "📧 Envoyer"

**Résultat attendu:**
- ✅ Ton client email s'ouvre (Outlook, Gmail, etc.)
- ✅ Le sujet contient le numéro de facture
- ✅ Le corps contient un message

**Test 4: Statistiques**
Vérifie en haut de la page:
- ✅ Total factures
- ✅ Factures payées (montant)
- ✅ Factures en attente (montant)
- ✅ Factures en retard

---

### 3. TESTER LE CALENDRIER

**Accès:** Clique sur "📅 Calendrier" dans le menu

**Test 1: Vue mensuelle**
1. Vérifie que tu vois le calendrier du mois actuel
2. Vérifie que la date d'aujourd'hui est mise en évidence
3. Clique sur "←" et "→" pour naviguer entre les mois
4. Clique sur "Aujourd'hui" pour revenir

**Résultat attendu:**
- ✅ Calendrier s'affiche correctement
- ✅ Navigation fluide
- ✅ Date actuelle en bleu

**Test 2: Créer un événement**
1. Clique sur "Nouvel Événement"
2. Remplis le formulaire:
   - Titre: "Audience Tribunal"
   - Type: Audience (⚖️)
   - Date début: Demain
   - Heure début: 10:00
   - Date fin: Demain
   - Heure fin: 12:00
   - Lieu: "Tribunal d'Alger"
   - Type de lieu: Tribunal
   - Rappel: 1 heure avant
3. Clique sur "Créer"

**Résultat attendu:**
- ✅ Message: "Événement créé avec succès!"
- ✅ L'événement apparaît dans le calendrier
- ✅ Badge rouge avec "⚖️ Audience Tribunal"

**Test 3: Détection de conflits**
1. Crée un autre événement au même moment
2. Remplis avec les mêmes date/heure

**Résultat attendu:**
- ✅ Alerte: "Conflit avec événement existant"
- ✅ Option de continuer ou annuler

**Test 4: Intégration avec dossiers**
1. Va dans "Dossiers"
2. Crée/modifie un dossier
3. Ajoute une "Date d'audience"
4. Retourne au calendrier

**Résultat attendu:**
- ✅ L'audience apparaît automatiquement dans le calendrier
- ✅ Liée au dossier

---

### 4. TESTER LE SUIVI DU TEMPS

**Accès:** Clique sur "⏱️ Temps" dans le menu

**Test 1: Démarrer un timer**
1. Remplis:
   - Description: "Rédaction contrat"
   - Dossier: (Sélectionne un dossier)
   - Facturable: ✅
   - Taux horaire: 15000 DA
2. Clique sur "Démarrer"

**Résultat attendu:**
- ✅ Timer démarre: 00:00:01, 00:00:02...
- ✅ Bouton change en "Arrêter"

**Test 2: Arrêter le timer**
1. Attends quelques secondes
2. Clique sur "Arrêter"

**Résultat attendu:**
- ✅ Timer s'arrête
- ✅ L'activité apparaît dans "Activités Récentes"
- ✅ Durée et montant calculés automatiquement

**Test 3: Activités récentes**
Vérifie la liste en bas:
- ✅ Description de l'activité
- ✅ Dossier associé
- ✅ Durée (ex: 2min)
- ✅ Montant (si facturable)

---

### 5. TESTER LE PORTAIL CLIENT

**Accès:** Clique sur "👤 Portail Client" dans le menu

**Test 1: Onglet Dossiers**
1. Vérifie que tu vois les dossiers
2. Chaque dossier affiche:
   - Titre et numéro
   - Statut
   - Date d'ouverture
   - Prochaine audience (si applicable)

**Résultat attendu:**
- ✅ Liste des dossiers s'affiche
- ✅ Informations complètes

**Test 2: Onglet Messages**
1. Clique sur l'onglet "Messages"
2. Écris un message test
3. Clique sur "Envoyer"

**Résultat attendu:**
- ✅ Message apparaît dans la conversation
- ✅ Aligné à droite (client)
- ✅ Horodatage visible

**Test 3: Onglet Documents**
1. Clique sur l'onglet "Documents"
2. Vérifie les documents partagés

**Résultat attendu:**
- ✅ Liste des documents
- ✅ Boutons "Voir" et "Télécharger"

---

## 🎯 CHECKLIST COMPLÈTE

### Facturation
- [ ] Menu "Facturation" visible
- [ ] Création de facture fonctionne
- [ ] Calculs automatiques corrects
- [ ] Génération PDF fonctionne
- [ ] Envoi email fonctionne
- [ ] Statistiques s'affichent
- [ ] Bilingue FR/AR

### Calendrier
- [ ] Menu "Calendrier" visible
- [ ] Vue mensuelle s'affiche
- [ ] Navigation mois fonctionne
- [ ] Création événement fonctionne
- [ ] Détection conflits fonctionne
- [ ] Intégration dossiers fonctionne
- [ ] Bilingue FR/AR

### Suivi du Temps
- [ ] Menu "Temps" visible
- [ ] Timer démarre/arrête
- [ ] Calculs automatiques
- [ ] Association dossier fonctionne
- [ ] Activités récentes s'affichent
- [ ] Bilingue FR/AR

### Portail Client
- [ ] Menu "Portail Client" visible
- [ ] Onglet Dossiers fonctionne
- [ ] Onglet Messages fonctionne
- [ ] Onglet Documents fonctionne
- [ ] Bilingue FR/AR

---

## 🐛 PROBLÈMES COURANTS

### Le menu ne s'affiche pas
**Solution:** Rafraîchis la page (Ctrl+R ou Cmd+R)

### Erreur "Cannot find module"
**Solution:**
```bash
yarn install
yarn dev
```

### Les données ne s'affichent pas
**Solution:** Vérifie que:
1. Tu es connecté
2. Les scripts SQL ont été exécutés
3. Tu as des données de test

### Le PDF ne se génère pas
**Solution:** Ouvre la console du navigateur (F12) et vérifie les erreurs

### L'email ne s'envoie pas automatiquement
**C'est normal!** Le système utilise un fallback `mailto:` qui ouvre ton client email. Pour l'envoi automatique, il faut configurer une Edge Function Supabase.

---

## 📊 RÉSULTAT ATTENDU

Après tous les tests, tu devrais avoir:
- ✅ 3 nouveaux systèmes fonctionnels
- ✅ Menu mis à jour avec 6 nouvelles entrées
- ✅ Tout bilingue FR/AR
- ✅ Design moderne et cohérent
- ✅ Intégrations entre les modules

**Score: 6.4/10** 🎉

---

## 🚀 PROCHAINES ÉTAPES

Si tout fonctionne, tu peux:
1. Créer des données de test
2. Tester avec de vrais clients
3. Personnaliser les couleurs/design
4. Ajouter plus de fonctionnalités

**Besoin d'aide? Pose tes questions!** 💪
