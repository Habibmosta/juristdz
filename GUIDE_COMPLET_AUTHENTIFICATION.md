# Guide Complet - Système d'Authentification JuristDZ

## Vue d'ensemble

Le système d'authentification de JuristDZ est conçu pour un modèle SaaS avec validation admin et gestion des quotas.

## 1. Inscription (Sign Up)

### Processus d'inscription

1. **Formulaire d'inscription** (`src/components/auth/AuthForm.tsx`)
   - Prénom, Nom
   - Email professionnel
   - Mot de passe (min 6 caractères)
   - Profession (avocat, notaire, huissier, magistrat, étudiant, juriste d'entreprise)
   - N° d'inscription (optionnel)
   - Téléphone (optionnel)
   - Cabinet/Organisation (optionnel)

2. **Création du compte**
   ```typescript
   // 1. Créer l'utilisateur dans auth.users
   supabase.auth.signUp({ email, password })
   
   // 2. Créer le profil avec is_active = false
   profiles.insert({ is_active: false, is_admin: false })
   
   // 3. Créer l'abonnement avec status = 'pending'
   subscriptions.insert({ status: 'pending', is_active: false })
   ```

3. **État après inscription**
   - ✅ Compte créé dans `auth.users`
   - ✅ Profil créé dans `profiles` avec `is_active = false`
   - ✅ Abonnement créé avec `status = 'pending'`
   - ⏳ En attente de validation admin
   - 📧 Message affiché : "Votre compte est en attente de validation"

### Validation par l'admin

1. **Interface admin** (Onglet "Utilisateurs")
   - Section "Comptes en Attente de Validation"
   - Liste des utilisateurs avec `is_active = false`

2. **Actions admin**
   - ✅ **Activer** : Passe `is_active = true` et `status = 'active'`
   - ❌ **Refuser** : Supprime le compte complètement
   - 👁️ **Voir détails** : Affiche les informations du profil

3. **Après activation**
   - L'utilisateur peut se connecter
   - Accès au plan Gratuit (5 documents, 30 jours)
   - Notification par email (à implémenter)

## 2. Connexion (Sign In)

### Processus de connexion

1. **Formulaire de connexion**
   - Email
   - Mot de passe
   - Option "Afficher/Masquer mot de passe"

2. **Vérification**
   ```typescript
   // 1. Authentification
   supabase.auth.signInWithPassword({ email, password })
   
   // 2. Vérifier si le compte est actif
   profiles.select('is_active').eq('id', user.id)
   
   // 3. Si is_active = false
   //    → Déconnecter et afficher message d'attente
   // 4. Si is_active = true
   //    → Rediriger vers l'application
   ```

3. **États possibles**
   - ✅ **Compte actif** : Connexion réussie
   - ⏳ **En attente** : Message "Compte en attente de validation"
   - ❌ **Erreur** : Email/mot de passe incorrect

## 3. Mot de passe oublié

### Processus de réinitialisation

1. **Demande de réinitialisation**
   - Cliquer sur "Mot de passe oublié ?"
   - Entrer l'email
   - Cliquer sur "Envoyer le lien de réinitialisation"

2. **Envoi de l'email**
   ```typescript
   supabase.auth.resetPasswordForEmail(email, {
     redirectTo: `${window.location.origin}/reset-password`
   })
   ```

3. **Configuration Supabase requise**
   - Aller dans Authentication → Email Templates
   - Configurer le template "Reset Password"
   - URL de redirection : `https://votre-domaine.com/reset-password`

4. **Réinitialisation du mot de passe**
   - L'utilisateur clique sur le lien dans l'email
   - Redirigé vers `/reset-password` avec un token
   - Composant `ResetPassword.tsx` s'affiche
   - Entrer nouveau mot de passe (2 fois)
   - Validation et redirection vers connexion

### Composant ResetPassword

Fichier : `src/components/auth/ResetPassword.tsx`

**Fonctionnalités :**
- Validation du token de réinitialisation
- Formulaire avec 2 champs (nouveau mot de passe + confirmation)
- Afficher/Masquer mot de passe
- Validation : minimum 6 caractères
- Vérification : les 2 mots de passe correspondent
- Message de succès avec redirection automatique

## 4. Gestion des comptes par l'admin

### Interface admin

**Onglet "Utilisateurs"** (`src/components/admin/AdminUserManagement.tsx`)

#### Statistiques
- Total Utilisateurs
- Actifs
- En Attente
- Admins

#### Section "En Attente de Validation"
- Liste des comptes avec `is_active = false`
- Informations : Nom, Email, Profession, Date d'inscription
- Actions :
  - ✅ Activer
  - 👁️ Voir détails
  - ❌ Refuser et supprimer

#### Section "Utilisateurs Actifs"
- Liste des comptes avec `is_active = true`
- Informations : Nom, Email, Profession, Plan, Documents utilisés
- Actions :
  - ✏️ Modifier (profil, plan, quotas)
  - 🔄 Activer/Désactiver
  - 🔑 Réinitialiser mot de passe
  - 🗑️ Supprimer

### Créer un utilisateur (Admin)

**Modal "Créer un Utilisateur"** (`src/components/admin/CreateUserModal.tsx`)

1. **Informations personnelles**
   - Prénom, Nom
   - Email
   - Mot de passe
   - Profession

2. **Abonnement**
   - Plan : Gratuit / Pro / Cabinet
   - Limites : Documents, Dossiers (si Gratuit)

3. **Création**
   - Utilise `supabase.auth.signUp()`
   - Crée profil avec `is_active = true`
   - Crée abonnement selon le plan choisi
   - Restaure la session admin après création

### Modifier un utilisateur (Admin)

**Modal "Modifier l'Utilisateur"** (`src/components/admin/EditUserModal.tsx`)

1. **Informations modifiables**
   - Prénom, Nom
   - Profession
   - Plan d'abonnement
   - Limites (documents, dossiers)
   - Statut actif/inactif

2. **Réinitialiser mot de passe**
   - Checkbox "Envoyer un email de réinitialisation"
   - Utilise `supabase.auth.resetPasswordForEmail()`
   - L'utilisateur reçoit un email avec lien

3. **Supprimer un utilisateur**
   - Confirmation requise
   - Supprime dans l'ordre :
     1. Documents
     2. Dossiers
     3. Abonnement
     4. Profil
   - Note : L'utilisateur reste dans `auth.users` (nécessite service_role pour supprimer)

## 5. Sécurité et RLS (Row Level Security)

### État actuel : RLS DÉSACTIVÉ

Pour faciliter les tests, RLS est actuellement désactivé. L'isolation des données se fait au niveau de l'application (filtrage par `user_id`).

### Activation de RLS (Recommandé pour production)

**Script :** `supabase-enable-rls.sql`

1. **Activer RLS sur les tables**
   ```sql
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
   ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
   ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
   ```

2. **Policies créées**
   - Utilisateurs : Voir/Modifier leurs propres données uniquement
   - Admins : Voir/Modifier toutes les données
   - Inscription : Permettre création profil/abonnement

3. **Avantages RLS**
   - ✅ Sécurité au niveau base de données
   - ✅ Impossible de contourner via API
   - ✅ Isolation garantie même en cas de bug applicatif

### Quand activer RLS ?

- ✅ Après avoir testé que tout fonctionne sans RLS
- ✅ Avant la mise en production
- ✅ Quand vous avez plusieurs utilisateurs réels

## 6. Configuration Supabase

### Email Templates

**Authentication → Email Templates**

1. **Confirm Signup** (Optionnel)
   - Désactiver si vous voulez validation admin uniquement
   - Activer si vous voulez confirmation email + validation admin

2. **Reset Password** (REQUIS)
   - Template par défaut fonctionne
   - URL de redirection : `https://votre-domaine.com/reset-password`
   - Personnaliser le message si nécessaire

3. **Magic Link** (Optionnel)
   - Pour connexion sans mot de passe
   - Non utilisé actuellement

### URL Configuration

**Authentication → URL Configuration**

- Site URL : `https://votre-domaine.com`
- Redirect URLs : 
  - `https://votre-domaine.com/reset-password`
  - `http://localhost:5173/reset-password` (développement)

## 7. Flux complets

### Flux 1 : Nouvel utilisateur (Auto-inscription)

```
1. Utilisateur remplit formulaire inscription
   ↓
2. Compte créé avec is_active = false
   ↓
3. Message : "En attente de validation"
   ↓
4. Admin voit le compte dans "En Attente"
   ↓
5. Admin clique "Activer"
   ↓
6. is_active = true, status = 'active'
   ↓
7. Utilisateur peut se connecter
   ↓
8. Accès au plan Gratuit (5 docs, 30j)
```

### Flux 2 : Utilisateur créé par admin

```
1. Admin clique "Créer un Utilisateur"
   ↓
2. Admin remplit formulaire + choisit plan
   ↓
3. Compte créé avec is_active = true
   ↓
4. Utilisateur reçoit email avec identifiants
   ↓
5. Utilisateur peut se connecter immédiatement
   ↓
6. Accès selon le plan choisi par admin
```

### Flux 3 : Mot de passe oublié

```
1. Utilisateur clique "Mot de passe oublié ?"
   ↓
2. Entre son email
   ↓
3. Reçoit email avec lien de réinitialisation
   ↓
4. Clique sur le lien
   ↓
5. Redirigé vers /reset-password
   ↓
6. Entre nouveau mot de passe (2 fois)
   ↓
7. Mot de passe mis à jour
   ↓
8. Redirection vers connexion
   ↓
9. Connexion avec nouveau mot de passe
```

### Flux 4 : Admin réinitialise mot de passe utilisateur

```
1. Admin ouvre modal "Modifier l'Utilisateur"
   ↓
2. Coche "Envoyer email de réinitialisation"
   ↓
3. Clique "Enregistrer"
   ↓
4. Utilisateur reçoit email
   ↓
5. Suit le flux 3 (Mot de passe oublié)
```

## 8. Tests recommandés

### Test 1 : Inscription et validation
1. S'inscrire avec un nouveau compte
2. Vérifier qu'on ne peut pas se connecter
3. Se connecter en admin
4. Activer le compte
5. Se déconnecter
6. Se connecter avec le nouveau compte
7. ✅ Connexion réussie

### Test 2 : Mot de passe oublié
1. Cliquer "Mot de passe oublié ?"
2. Entrer email
3. Vérifier réception email
4. Cliquer sur le lien
5. Entrer nouveau mot de passe
6. Se connecter avec nouveau mot de passe
7. ✅ Connexion réussie

### Test 3 : Admin réinitialise mot de passe
1. Se connecter en admin
2. Modifier un utilisateur
3. Cocher "Envoyer email réinitialisation"
4. Enregistrer
5. Se connecter avec le compte utilisateur
6. Vérifier réception email
7. Suivre le processus de réinitialisation
8. ✅ Nouveau mot de passe fonctionne

### Test 4 : Isolation des données
1. Créer 2 utilisateurs (User A et User B)
2. Se connecter avec User A
3. Créer un dossier
4. Se déconnecter
5. Se connecter avec User B
6. ✅ Le dossier de User A n'est PAS visible

## 9. Fichiers importants

### Authentification
- `src/components/auth/AuthForm.tsx` - Formulaire connexion/inscription
- `src/components/auth/ResetPassword.tsx` - Réinitialisation mot de passe
- `src/hooks/useAuth.ts` - Hook d'authentification
- `src/lib/supabase.ts` - Client Supabase centralisé

### Administration
- `src/components/admin/AdminUserManagement.tsx` - Gestion utilisateurs
- `src/components/admin/CreateUserModal.tsx` - Création utilisateur
- `src/components/admin/EditUserModal.tsx` - Modification utilisateur

### Base de données
- `supabase-reset-clean.sql` - Création tables
- `supabase-step2-no-rls.sql` - Fonctions (sans RLS)
- `supabase-enable-rls.sql` - Activation RLS (production)
- `supabase-create-admin.sql` - Création compte admin

## 10. Problèmes courants

### "Compte en attente de validation"
- **Cause** : `is_active = false` dans profiles
- **Solution** : Admin doit activer le compte

### "Email/mot de passe incorrect"
- **Cause** : Identifiants incorrects ou compte n'existe pas
- **Solution** : Vérifier identifiants ou réinitialiser mot de passe

### "Lien de réinitialisation invalide"
- **Cause** : Token expiré ou URL incorrecte
- **Solution** : Redemander un nouveau lien

### Email de réinitialisation non reçu
- **Cause** : Email dans spam ou configuration Supabase incorrecte
- **Solution** : 
  1. Vérifier spam
  2. Vérifier Email Templates dans Supabase
  3. Vérifier URL Configuration

### Utilisateur voit données d'autres utilisateurs
- **Cause** : RLS désactivé ou policies incorrectes
- **Solution** : Activer RLS avec `supabase-enable-rls.sql`

---

**Version :** 1.0  
**Date :** 2 mars 2026  
**Statut :** ✅ Système complet et fonctionnel
