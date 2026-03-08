# 🎯 Guide d'Utilisation - Interface Admin

## ✅ CE QUI A ÉTÉ CRÉÉ

### Interface Complète de Gestion des Utilisateurs

L'interface admin dispose maintenant d'un onglet "Utilisateurs" avec toutes les fonctionnalités nécessaires pour gérer votre plateforme SaaS.

---

## 🚀 COMMENT UTILISER

### 1. Accéder à l'Interface Admin

1. **Se connecter** avec le compte admin:
   - Email: `admin@juristdz.com`
   - Mot de passe: `Admin2024!JuristDZ`

2. **Vous arrivez** automatiquement sur la page Admin

3. **Cliquer** sur l'onglet "Utilisateurs"

---

### 2. Créer un Nouvel Utilisateur

1. **Cliquer** sur le bouton "Créer un Utilisateur" (en haut à droite)

2. **Remplir le formulaire:**
   - **Prénom**: Ahmed
   - **Nom**: Benali
   - **Email**: ahmed.benali@test.dz
   - **Mot de passe**: test123 (minimum 6 caractères)
   - **Profession**: Avocat
   - **Plan**: Gratuit (5 documents, 30 jours)

3. **Cliquer** sur "Créer l'Utilisateur"

4. ✅ **L'utilisateur est créé** automatiquement avec:
   - Compte dans `auth.users`
   - Profil dans `public.profiles`
   - Abonnement dans `public.subscriptions`

---

### 3. Modifier un Utilisateur

1. **Trouver** l'utilisateur dans la liste

2. **Cliquer** sur l'icône "Modifier" (crayon)

3. **Modifier** les informations:
   - Prénom, nom
   - Profession
   - Plan (Gratuit → Pro)
   - Quotas (5 → Illimité)
   - Statut (Actif/Inactif)

4. **Cliquer** sur "Enregistrer"

---

### 4. Passer un Utilisateur en PRO

1. **Cliquer** sur "Modifier" pour l'utilisateur

2. **Changer le Plan** de "Gratuit" à "Pro"

3. **Observer** que les limites passent automatiquement à "Illimité"

4. **Enregistrer**

5. ✅ L'utilisateur a maintenant:
   - `documents_limit = -1` (illimité)
   - `cases_limit = -1` (illimité)
   - `plan = 'pro'`

---

### 5. Désactiver un Compte

1. **Cliquer** sur l'icône "Désactiver" (X rouge)

2. **Confirmer** (le bouton change de couleur)

3. ✅ L'utilisateur ne peut plus se connecter

---

### 6. Réactiver un Compte

1. **Cliquer** sur l'icône "Activer" (✓ vert)

2. ✅ L'utilisateur peut à nouveau se connecter

---

## 📊 FONCTIONNALITÉS

### Statistiques en Temps Réel

En haut de la page, vous voyez:
- **Total Utilisateurs**: Nombre total de comptes
- **Actifs**: Comptes actifs
- **Inactifs**: Comptes désactivés
- **Admins**: Nombre d'administrateurs

### Recherche

- **Barre de recherche** pour filtrer par:
  - Email
  - Nom
  - Prénom

### Liste des Utilisateurs

Tableau avec colonnes:
- **Utilisateur**: Nom complet + email
- **Profession**: avocat, notaire, huissier, etc.
- **Plan**: free, pro, cabinet
- **Documents**: Utilisés / Limite
- **Statut**: Actif / Inactif
- **Actions**: Modifier, Activer/Désactiver

---

## 🎯 WORKFLOW COMPLET

### Scénario: Nouveau Client Avocat

**Jour 1 - Création du Compte:**
```
1. Client contacte: "Je veux tester JuristDZ"
2. Admin se connecte
3. Admin clique sur "Créer un Utilisateur"
4. Admin remplit:
   - Email: client@cabinet.dz
   - Mot de passe: (généré ou personnalisé)
   - Profession: Avocat
   - Plan: Gratuit
5. Admin envoie les identifiants au client par email
```

**Jour 15 - Client Teste:**
```
1. Client se connecte
2. Client génère 3 documents
3. Système affiche: "2 documents restants"
```

**Jour 30 - Client Paie:**
```
1. Client: "Je veux continuer, comment payer?"
2. Admin: "10 000 DA/mois par virement"
3. Client effectue le paiement
4. Admin modifie le compte:
   - Plan: Gratuit → Pro
   - Documents: 5 → Illimité
5. Client peut générer des documents sans limite
```

**Jour 60 - Renouvellement:**
```
1. Admin vérifie si le client a payé
2. Si OUI: Rien à faire (abonnement continue)
3. Si NON: Admin désactive le compte
```

---

## 💡 CONSEILS

### Gestion des Mots de Passe

- **Utilisez** des mots de passe simples pour les tests (ex: `test123`)
- **En production**, générez des mots de passe forts
- **Envoyez** les identifiants par email sécurisé

### Gestion des Plans

- **Gratuit**: Pour les essais (30 jours)
- **Pro**: Pour les utilisateurs payants (mensuel)
- **Cabinet**: Pour les cabinets avec plusieurs utilisateurs

### Suivi des Paiements

- **Utilisez** le champ "Notes" dans l'abonnement
- **Notez**: "Paiement reçu le 02/03/2026"
- **Vérifiez** régulièrement les dates d'expiration

---

## 🔐 SÉCURITÉ

### Permissions Admin

- **Seuls les admins** peuvent accéder à cette interface
- **Vérification** automatique du rôle `is_admin = true`
- **Redirection** si l'utilisateur n'est pas admin

### Isolation des Données

- **Chaque utilisateur** voit uniquement ses propres données
- **L'admin** peut voir tous les utilisateurs mais pas leurs dossiers
- **Protection** au niveau application (RLS à activer plus tard)

---

## 🆘 DÉPANNAGE

### Erreur: "Failed to create user"

**Cause**: Email déjà utilisé ou mot de passe trop court

**Solution**:
- Vérifier que l'email n'existe pas déjà
- Utiliser un mot de passe d'au moins 6 caractères

### Erreur: "Permission denied"

**Cause**: L'utilisateur connecté n'est pas admin

**Solution**:
- Vérifier que `is_admin = true` dans `public.profiles`
- Se reconnecter

### L'utilisateur ne peut pas se connecter

**Cause**: Compte désactivé ou mot de passe incorrect

**Solution**:
- Vérifier que `is_active = true`
- Réinitialiser le mot de passe si nécessaire

---

## 📈 PROCHAINES ÉTAPES

### Court Terme
- ✅ Créer 4 comptes de test
- ✅ Tester la création d'utilisateurs
- ✅ Tester la modification des quotas
- ✅ Vérifier l'isolation des données

### Moyen Terme
- Activer Row Level Security (RLS)
- Ajouter système d'envoi d'emails automatiques
- Créer des rapports et statistiques avancées
- Ajouter historique des actions admin

### Long Terme
- Intégration paiement en ligne
- Facturation automatique
- Notifications automatiques d'expiration
- Dashboard analytics complet

---

## ✅ CHECKLIST

- [ ] Se connecter en tant qu'admin
- [ ] Accéder à l'onglet "Utilisateurs"
- [ ] Créer un utilisateur de test
- [ ] Modifier le profil d'un utilisateur
- [ ] Passer un utilisateur en Pro
- [ ] Désactiver un compte
- [ ] Réactiver un compte
- [ ] Tester la recherche
- [ ] Vérifier les statistiques

---

**Date**: 2 mars 2026  
**Statut**: ✅ Interface admin complète et fonctionnelle  
**Prochaine étape**: Créer les comptes de test via l'interface  
**Temps estimé**: 5 minutes par compte
