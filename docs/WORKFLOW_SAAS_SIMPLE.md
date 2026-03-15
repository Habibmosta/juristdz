# 🎯 Workflow SaaS JuristDZ - Guide Simple

## 📊 COMMENT ÇA FONCTIONNE?

### Vue d'ensemble
```
CLIENT POTENTIEL
    ↓
    📞 Contacte JuristDZ (email/téléphone)
    ↓
ADMIN (vous)
    ↓
    👤 Crée un compte GRATUIT (5 documents, 30 jours)
    ↓
    📧 Envoie les identifiants au client
    ↓
CLIENT
    ↓
    🧪 Teste l'application (30 jours)
    ↓
    💰 Décide de payer ou non
    ↓
    ┌─────────────────┬─────────────────┐
    │                 │                 │
    💳 PAIE           ❌ NE PAIE PAS
    │                 │
    ↓                 ↓
ADMIN               ADMIN
    │                 │
    ✅ Active PRO     🔒 Désactive
    │                 │
    ↓                 ↓
CLIENT PRO          COMPTE BLOQUÉ
(illimité)          (accès refusé)
```

---

## 👤 RÔLES ET PERMISSIONS

### 1. ADMINISTRATEUR (vous)
**Email**: admin@juristdz.com  
**Mot de passe**: Admin2024!JuristDZ

**Peut faire:**
- ✅ Créer des comptes utilisateurs
- ✅ Modifier les quotas (5 documents → illimité)
- ✅ Activer/Désactiver des comptes
- ✅ Voir tous les utilisateurs
- ✅ Voir toutes les statistiques
- ✅ Gérer les abonnements

**Ne peut PAS faire:**
- ❌ Voir les dossiers des utilisateurs (confidentialité)
- ❌ Modifier les documents des utilisateurs

### 2. UTILISATEURS (avocats, notaires, huissiers)
**Exemples**: ahmed.benali@test.dz, sarah.khelifi@test.dz

**Peuvent faire:**
- ✅ Se connecter avec leurs identifiants
- ✅ Créer des dossiers
- ✅ Générer des documents
- ✅ Voir UNIQUEMENT leurs propres données

**Ne peuvent PAS faire:**
- ❌ Voir les dossiers d'autres utilisateurs
- ❌ Créer d'autres comptes
- ❌ Modifier leurs quotas
- ❌ Accéder à l'interface admin

---

## 💰 PLANS D'ABONNEMENT

### Plan GRATUIT (Essai)
```
Durée: 30 jours
Documents: 5 maximum
Dossiers: 3 maximum
Prix: 0 DA
```

**Utilisation:**
- Client teste l'application
- Peut générer 5 documents
- Après 30 jours → compte désactivé automatiquement

### Plan PRO
```
Durée: 1 mois (renouvelable)
Documents: Illimité
Dossiers: Illimité
Prix: 10 000 - 15 000 DA/mois
```

**Utilisation:**
- Client paie chaque mois
- Accès complet à toutes les fonctionnalités
- Génération illimitée de documents

### Plan CABINET
```
Durée: 1 mois (renouvelable)
Documents: Illimité
Dossiers: Illimité
Utilisateurs: 5 maximum
Prix: 40 000 - 50 000 DA/mois
```

**Utilisation:**
- Pour les cabinets avec plusieurs avocats/notaires
- Chaque membre a son propre compte
- Données isolées par utilisateur

---

## 🔄 WORKFLOW DÉTAILLÉ

### Scénario 1: Nouveau Client (Avocat)

**Jour 1:**
```
1. Client: "Bonjour, je veux tester JuristDZ"
2. Admin: Crée le compte
   - Email: avocat@cabinet.dz
   - Mot de passe: (généré automatiquement)
   - Plan: GRATUIT
   - Quotas: 5 documents, 30 jours
3. Admin: Envoie les identifiants par email
4. Client: Se connecte et teste
```

**Jour 15:**
```
1. Client: Génère 3 documents
2. Système: Affiche "2 documents restants"
3. Client: Continue à tester
```

**Jour 30:**
```
1. Client: "Je veux continuer, comment payer?"
2. Admin: "10 000 DA/mois par virement"
3. Client: Effectue le paiement
4. Admin: Active le plan PRO
   - Quotas: Illimité
   - Durée: +30 jours
5. Client: Peut générer des documents sans limite
```

**Jour 60:**
```
1. Admin: Vérifie si le client a payé
   - Si OUI → Renouvelle pour 30 jours
   - Si NON → Désactive le compte
```

### Scénario 2: Client ne Paie Pas

**Jour 30:**
```
1. Système: Désactive automatiquement le compte
2. Client: Essaie de se connecter
3. Système: "Votre abonnement a expiré"
4. Client: Contacte l'admin
5. Admin: "Payez 10 000 DA pour réactiver"
```

### Scénario 3: Cabinet avec Plusieurs Avocats

**Jour 1:**
```
1. Cabinet: "Nous sommes 3 avocats"
2. Admin: Crée 3 comptes
   - avocat1@cabinet.dz (Plan GRATUIT)
   - avocat2@cabinet.dz (Plan GRATUIT)
   - avocat3@cabinet.dz (Plan GRATUIT)
3. Cabinet: Teste pendant 30 jours
```

**Jour 30:**
```
1. Cabinet: "Nous voulons le plan CABINET"
2. Admin: "40 000 DA/mois pour 5 utilisateurs"
3. Cabinet: Paie
4. Admin: Active les 3 comptes en PRO
5. Chaque avocat: Accès illimité, données isolées
```

---

## 🎛️ ACTIONS ADMIN

### Créer un Utilisateur
```
1. Se connecter en tant qu'admin
2. Aller dans "Administration" → "Utilisateurs"
3. Cliquer sur "Créer un utilisateur"
4. Remplir:
   - Prénom: Ahmed
   - Nom: Benali
   - Email: ahmed.benali@cabinet.dz
   - Profession: Avocat
   - Plan: Gratuit
5. Cliquer sur "Créer"
6. Copier le mot de passe généré
7. Envoyer par email au client
```

### Passer un Utilisateur en PRO
```
1. Trouver l'utilisateur dans la liste
2. Cliquer sur "Modifier"
3. Changer:
   - Plan: Gratuit → Pro
   - Documents: 5 → Illimité (-1)
   - Dossiers: 3 → Illimité (-1)
   - Expiration: +30 jours
4. Cliquer sur "Enregistrer"
5. Ajouter une note: "Paiement reçu le 02/03/2026"
```

### Désactiver un Compte
```
1. Trouver l'utilisateur dans la liste
2. Cliquer sur "Désactiver"
3. Confirmer
4. L'utilisateur ne peut plus se connecter
```

### Réactiver un Compte
```
1. Trouver l'utilisateur dans la liste
2. Cliquer sur "Activer"
3. Définir la nouvelle date d'expiration
4. Cliquer sur "Enregistrer"
```

---

## 📊 STATISTIQUES ADMIN

### Vue d'ensemble
```
Utilisateurs actifs: 45
Utilisateurs inactifs: 12
Plan Gratuit: 23
Plan Pro: 18
Plan Cabinet: 4

Documents générés ce mois: 1,234
Revenus mensuels: 450,000 DA
```

### Par Profession
```
Avocats: 30 (67%)
Notaires: 10 (22%)
Huissiers: 5 (11%)
```

---

## 💡 CONSEILS

### Pour l'Admin
1. **Vérifier les paiements** chaque début de mois
2. **Désactiver** les comptes non payés après 3 jours de retard
3. **Envoyer des rappels** 5 jours avant l'expiration
4. **Garder un historique** de tous les paiements
5. **Offrir des réductions** pour les paiements annuels

### Pour les Clients
1. **Tester** pendant 30 jours avant de payer
2. **Contacter l'admin** pour toute question
3. **Payer à temps** pour éviter la désactivation
4. **Demander une facture** pour chaque paiement

---

## 🔐 SÉCURITÉ

### Isolation des Données
```
Avocat A crée un dossier
    ↓
Dossier stocké avec user_id = A
    ↓
Avocat B se connecte
    ↓
Système vérifie: user_id = B
    ↓
Avocat B ne voit PAS le dossier de A
```

### Vérification des Quotas
```
Utilisateur génère un document
    ↓
Système vérifie:
  - Plan actif? ✅
  - Date expirée? ❌
  - Quota atteint? ❌
    ↓
Document généré
    ↓
Compteur: documents_used + 1
```

---

## ✅ RÉSUMÉ

**Vous êtes l'ADMIN:**
- Vous créez les comptes
- Vous gérez les quotas
- Vous activez/désactivez selon les paiements

**Les utilisateurs:**
- Se connectent avec leurs identifiants
- Voient UNIQUEMENT leurs données
- Paient pour continuer après l'essai

**Le système:**
- Isole les données automatiquement
- Vérifie les quotas automatiquement
- Désactive les comptes expirés automatiquement

---

**Date**: 2 mars 2026
**Statut**: ✅ Guide complet
**Prochaine étape**: Configurer Supabase et créer le compte admin
