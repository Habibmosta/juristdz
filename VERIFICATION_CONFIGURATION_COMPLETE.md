# ✅ Vérification Configuration Complète

## Étape 1 : Vérifier RLS dans Supabase Dashboard

### 1.1 Vérifier que RLS est activé sur toutes les tables

**Chemin :** Dashboard → Database → Tables

Pour chaque table, vérifiez que **"RLS enabled"** est coché :

```
✅ profiles         → RLS enabled: true
✅ cases            → RLS enabled: true
✅ documents        → RLS enabled: true
✅ subscriptions    → RLS enabled: true
```

**Comment vérifier :**
1. Cliquer sur une table (ex: `profiles`)
2. Regarder en haut à droite : "RLS enabled" doit être coché
3. Si pas coché, cliquer sur "Enable RLS"

---

### 1.2 Vérifier les Policies

**Chemin :** Dashboard → Authentication → Policies

Chaque table doit avoir plusieurs policies. Voici ce qui doit être présent :

#### Table `profiles`

```sql
✅ Users can view own profile          (SELECT)
✅ Users can update own profile        (UPDATE)
✅ Admins can view all profiles        (SELECT)
✅ Admins can update all profiles      (UPDATE)
✅ Admins can insert profiles          (INSERT)
✅ Admins can delete profiles          (DELETE)
✅ Allow profile creation on signup    (INSERT)
```

#### Table `cases`

```sql
✅ Users can view own cases            (SELECT)
✅ Users can create own cases          (INSERT)
✅ Users can update own cases          (UPDATE)
✅ Users can delete own cases          (DELETE)
✅ Admins can view all cases           (SELECT)
✅ Admins can manage all cases         (ALL)
```

#### Table `documents`

```sql
✅ Users can view own documents        (SELECT)
✅ Users can create own documents      (INSERT + check quota)
✅ Users can update own documents      (UPDATE)
✅ Users can delete own documents      (DELETE)
✅ Admins can view all documents       (SELECT)
✅ Admins can manage all documents     (ALL)
```

#### Table `subscriptions`

```sql
✅ Users can view own subscription     (SELECT)
✅ Admins can view all subscriptions   (SELECT)
✅ Admins can manage all subscriptions (ALL)
✅ Allow subscription creation on signup (INSERT)
```

**Comment vérifier :**
1. Aller dans Authentication → Policies
2. Sélectionner une table dans le dropdown
3. Vérifier que toutes les policies listées ci-dessus sont présentes
4. Si une policy manque, elle n'a pas été créée correctement

---

### 1.3 Vérifier les Fonctions PostgreSQL

**Chemin :** Dashboard → Database → Functions

Vous devez avoir ces 3 fonctions :

```sql
✅ is_admin()                          → Vérifie si l'utilisateur est admin
✅ check_document_quota(user_id)       → Vérifie le quota de documents
✅ increment_document_usage(user_id)   → Incrémente l'usage de documents
```

**Comment vérifier :**
1. Aller dans Database → Functions
2. Chercher les 3 fonctions dans la liste
3. Si elles n'existent pas, le script `supabase-step2-no-rls.sql` n'a pas été exécuté

---

## Étape 2 : Vérifier avec le fichier HTML de test

### 2.1 Ouvrir le fichier de test

1. Ouvrir `test-rls-configuration.html` dans votre navigateur
2. Entrer vos credentials Supabase :
   - SUPABASE_URL : `https://votre-projet.supabase.co`
   - SUPABASE_ANON_KEY : Votre clé anon

### 2.2 Exécuter les tests

Cliquer sur chaque bouton dans l'ordre :

1. **Charger Configuration** → Doit afficher ✅
2. **Vérifier RLS** → Doit afficher le statut de chaque table
3. **Vérifier Policies** → Doit afficher ✅ ou ⚠️
4. **Vérifier Fonctions** → Doit afficher ✅ pour les 3 fonctions
5. **Tester Isolation** → Instructions pour test manuel
6. **Tester Accès Admin** → Instructions pour test manuel

### 2.3 Résultats attendus

```
✅ Configuration chargée
✅ RLS activé sur toutes les tables
✅ Policies actives
✅ Fonctions PostgreSQL présentes
ℹ️ Tests manuels à effectuer
```

---

## Étape 3 : Tests manuels dans l'application

### Test 1 : Inscription et validation

**Objectif :** Vérifier que le système de validation admin fonctionne

1. **Créer un nouveau compte**
   - Aller sur la page de connexion
   - Cliquer sur "Inscription"
   - Remplir le formulaire
   - Cliquer sur "Créer mon compte"
   - ✅ Message : "Compte créé avec succès! En attente de validation..."

2. **Essayer de se connecter**
   - Entrer email et mot de passe
   - ✅ Message : "Votre compte est en attente de validation par un administrateur"
   - ✅ Connexion refusée

3. **Valider le compte en tant qu'admin**
   - Se connecter avec `admin@juristdz.com`
   - Aller dans l'onglet "Utilisateurs"
   - Section "En Attente de Validation"
   - ✅ Le nouveau compte doit être visible
   - Cliquer sur "Activer"
   - ✅ Le compte passe dans "Utilisateurs Actifs"

4. **Se connecter avec le nouveau compte**
   - Se déconnecter
   - Se connecter avec le nouveau compte
   - ✅ Connexion réussie
   - ✅ Accès à l'application

---

### Test 2 : Isolation des données

**Objectif :** Vérifier que chaque utilisateur voit UNIQUEMENT ses propres données

**Prérequis :** Avoir au moins 2 utilisateurs actifs (User A et User B)

1. **Se connecter avec User A**
   - Email : `ahmed.benali@test.dz`
   - Créer un dossier : "Affaire Test A"
   - ✅ Dossier créé et visible

2. **Se connecter avec User B**
   - Se déconnecter
   - Se connecter avec `sarah.mansouri@test.dz`
   - Aller dans "Mes Dossiers"
   - ✅ Le dossier "Affaire Test A" ne doit PAS être visible
   - ✅ Liste vide ou seulement les dossiers de User B

3. **Créer un dossier avec User B**
   - Créer un dossier : "Affaire Test B"
   - ✅ Dossier créé et visible

4. **Revenir à User A**
   - Se déconnecter
   - Se connecter avec `ahmed.benali@test.dz`
   - Aller dans "Mes Dossiers"
   - ✅ Voir "Affaire Test A" mais PAS "Affaire Test B"

**Résultat attendu :** Isolation complète des données entre utilisateurs

---

### Test 3 : Accès admin

**Objectif :** Vérifier que l'admin peut voir et gérer tous les utilisateurs

1. **Se connecter en admin**
   - Email : `admin@juristdz.com`
   - Mot de passe : `Admin2024!JuristDZ`

2. **Vérifier l'onglet Utilisateurs**
   - ✅ Onglet "Utilisateurs" visible
   - ✅ Liste de tous les utilisateurs (User A, User B, etc.)
   - ✅ Statistiques : Total, Actifs, En Attente, Admins

3. **Tester les actions admin**
   - Cliquer sur "Modifier" pour un utilisateur
   - ✅ Modal s'ouvre avec les informations
   - Modifier le plan (ex: Gratuit → Pro)
   - ✅ Modification enregistrée
   - Vérifier que le changement est visible

4. **Tester la création d'utilisateur**
   - Cliquer sur "Créer un Utilisateur"
   - Remplir le formulaire
   - ✅ Utilisateur créé avec `is_active = true`
   - ✅ Utilisateur peut se connecter immédiatement

---

### Test 4 : Mot de passe oublié

**Objectif :** Vérifier que la réinitialisation de mot de passe fonctionne

1. **Demander une réinitialisation**
   - Aller sur la page de connexion
   - Cliquer sur "Mot de passe oublié ?"
   - Entrer un email valide
   - Cliquer sur "Envoyer le lien de réinitialisation"
   - ✅ Message : "Un email de réinitialisation a été envoyé..."

2. **Vérifier l'email**
   - Ouvrir votre boîte email
   - ✅ Email reçu de Supabase
   - ✅ Lien de réinitialisation présent

3. **Réinitialiser le mot de passe**
   - Cliquer sur le lien dans l'email
   - ✅ Redirection vers `/reset-password`
   - ✅ Formulaire de réinitialisation affiché
   - Entrer nouveau mot de passe (2 fois)
   - Cliquer sur "Réinitialiser le mot de passe"
   - ✅ Message : "Mot de passe réinitialisé!"
   - ✅ Redirection automatique vers connexion

4. **Se connecter avec le nouveau mot de passe**
   - Entrer email et nouveau mot de passe
   - ✅ Connexion réussie

---

### Test 5 : Quotas et limites

**Objectif :** Vérifier que les quotas sont respectés

**Prérequis :** Avoir un utilisateur avec plan Gratuit (5 documents max)

1. **Se connecter avec un compte Gratuit**
   - Email : `ahmed.benali@test.dz` (Plan Gratuit)

2. **Créer des documents**
   - Créer 5 documents
   - ✅ Tous les documents sont créés
   - Essayer de créer un 6ème document
   - ✅ Message d'erreur : "Quota de documents atteint"

3. **Passer en Plan Pro**
   - Se connecter en admin
   - Modifier l'utilisateur
   - Changer le plan : Gratuit → Pro
   - Enregistrer

4. **Vérifier le nouveau quota**
   - Se reconnecter avec l'utilisateur
   - Essayer de créer un nouveau document
   - ✅ Document créé (quota illimité)

---

## Étape 4 : Checklist finale

### Configuration Supabase

```
✅ RLS activé sur profiles
✅ RLS activé sur cases
✅ RLS activé sur documents
✅ RLS activé sur subscriptions

✅ Policies créées pour profiles (7 policies)
✅ Policies créées pour cases (6 policies)
✅ Policies créées pour documents (6 policies)
✅ Policies créées pour subscriptions (4 policies)

✅ Fonction is_admin() existe
✅ Fonction check_document_quota() existe
✅ Fonction increment_document_usage() existe

✅ Email Provider activé
❌ Confirm email désactivé (validation admin uniquement)
✅ Password recovery activé
```

### Tests fonctionnels

```
✅ Inscription avec validation admin
✅ Connexion refusée si compte inactif
✅ Connexion réussie si compte actif
✅ Isolation des données entre utilisateurs
✅ Admin peut voir tous les utilisateurs
✅ Admin peut créer/modifier/supprimer des utilisateurs
✅ Mot de passe oublié fonctionne
✅ Réinitialisation de mot de passe fonctionne
✅ Quotas respectés selon le plan
✅ Changement de plan fonctionne
```

### Sécurité

```
✅ RLS activé (isolation au niveau base de données)
✅ Policies empêchent l'accès non autorisé
✅ Utilisateurs voient uniquement leurs données
✅ Admins ont accès complet
✅ Fonctions PostgreSQL sécurisées (SECURITY DEFINER)
✅ Pas de fuite de données entre utilisateurs
```

---

## Étape 5 : Problèmes courants et solutions

### Problème 1 : RLS activé mais policies manquantes

**Symptôme :** Erreur "row-level security policy" lors de l'accès aux données

**Solution :**
1. Vérifier que toutes les policies sont créées
2. Réexécuter `supabase-enable-rls.sql`
3. Vérifier dans Dashboard → Authentication → Policies

---

### Problème 2 : Fonction is_admin() non trouvée

**Symptôme :** Erreur "function is_admin() does not exist"

**Solution :**
1. Exécuter `supabase-step2-no-rls.sql`
2. Vérifier dans Dashboard → Database → Functions
3. Si la fonction existe, vérifier le schéma (doit être `public`)

---

### Problème 3 : Utilisateur voit les données d'autres utilisateurs

**Symptôme :** Isolation des données ne fonctionne pas

**Solution :**
1. Vérifier que RLS est activé sur toutes les tables
2. Vérifier que les policies existent
3. Vérifier que les policies utilisent `auth.uid()` correctement
4. Tester avec le fichier HTML de test

---

### Problème 4 : Email de réinitialisation non reçu

**Symptôme :** Pas d'email après "Mot de passe oublié"

**Solution :**
1. Vérifier dans Dashboard → Authentication → Email Templates
2. Vérifier que "Enable password recovery" est activé
3. Vérifier les spams
4. Vérifier l'URL de redirection dans URL Configuration

---

### Problème 5 : Admin ne peut pas voir tous les utilisateurs

**Symptôme :** Admin voit seulement son propre profil

**Solution :**
1. Vérifier que `is_admin = true` dans la table `profiles`
2. Vérifier que la fonction `is_admin()` existe
3. Vérifier que les policies "Admins can view all" existent
4. Se reconnecter pour rafraîchir la session

---

## Résumé

Si tous les tests passent, votre configuration est complète et sécurisée :

✅ **Authentification** : Inscription, connexion, validation admin
✅ **Sécurité** : RLS activé, policies en place, isolation des données
✅ **Fonctionnalités** : Mot de passe oublié, gestion utilisateurs, quotas
✅ **Administration** : Interface admin complète, gestion des plans

**Votre système est prêt pour la production !**

---

**Date :** 2 mars 2026  
**Version :** 1.0  
**Statut :** ✅ Configuration complète
