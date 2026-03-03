# Création des Utilisateurs de Test

## Utilisateurs à Créer

Vous devez créer ces utilisateurs via l'interface admin (onglet "Utilisateurs" → "Créer un Utilisateur") :

### 1. Ahmed Benali (Avocat - Plan Gratuit)
- ✅ **DÉJÀ CRÉÉ**
- Email : `ahmed.benali@test.dz`
- Mot de passe : `test123`
- Prénom : Ahmed
- Nom : Benali
- Profession : Avocat
- Plan : Gratuit (5 documents, 30 jours)

### 2. Sarah Mansouri (Notaire - Plan Pro)
- Email : `sarah.mansouri@test.dz`
- Mot de passe : `test123`
- Prénom : Sarah
- Nom : Mansouri
- Profession : Notaire
- Plan : Pro (Illimité)

### 3. Mohamed Khelifi (Huissier - Plan Gratuit)
- Email : `mohamed.khelifi@test.dz`
- Mot de passe : `test123`
- Prénom : Mohamed
- Nom : Khelifi
- Profession : Huissier
- Plan : Gratuit (5 documents, 30 jours)

### 4. Karim Boudiaf (Magistrat - Plan Cabinet)
- Email : `karim.boudiaf@test.dz`
- Mot de passe : `test123`
- Prénom : Karim
- Nom : Boudiaf
- Profession : Magistrat
- Plan : Cabinet (Illimité, Multi-utilisateurs)

## Procédure de Création

1. **Se connecter en tant qu'admin**
   - Email : `admin@juristdz.com`
   - Mot de passe : `Admin2024!JuristDZ`

2. **Accéder à l'interface admin**
   - Cliquer sur l'onglet "Utilisateurs"

3. **Créer chaque utilisateur**
   - Cliquer sur "Créer un Utilisateur"
   - Remplir le formulaire avec les informations ci-dessus
   - Cliquer sur "Créer l'Utilisateur"

4. **Vérifier la création**
   - L'utilisateur devrait apparaître dans la liste
   - Statut : Actif
   - Plan : Selon la configuration

## Tests d'Isolation des Données

Après avoir créé tous les utilisateurs, testez l'isolation :

### Test 1 : Créer un dossier avec Ahmed
1. Se connecter avec `ahmed.benali@test.dz`
2. Créer un dossier "Affaire Ahmed 001"
3. Ajouter un document

### Test 2 : Vérifier l'isolation avec Sarah
1. Se déconnecter
2. Se connecter avec `sarah.mansouri@test.dz`
3. Vérifier que le dossier d'Ahmed n'est PAS visible
4. Créer un dossier "Affaire Sarah 001"

### Test 3 : Vérifier avec Mohamed
1. Se déconnecter
2. Se connecter avec `mohamed.khelifi@test.dz`
3. Vérifier qu'aucun dossier d'Ahmed ou Sarah n'est visible
4. Créer un dossier "Affaire Mohamed 001"

### Test 4 : Vérifier avec Karim
1. Se déconnecter
2. Se connecter avec `karim.boudiaf@test.dz`
3. Vérifier qu'aucun dossier des autres utilisateurs n'est visible
4. Créer un dossier "Affaire Karim 001"

### Test 5 : Vérifier en tant qu'admin
1. Se déconnecter
2. Se connecter avec `admin@juristdz.com`
3. Aller dans l'onglet "Utilisateurs"
4. Vérifier que tous les utilisateurs sont listés
5. Vérifier les statistiques de documents pour chaque utilisateur

## Résultat Attendu

✅ Chaque utilisateur voit UNIQUEMENT ses propres données
✅ Aucun utilisateur ne peut accéder aux données d'un autre
✅ L'admin peut voir tous les utilisateurs et leurs statistiques
✅ Les quotas sont respectés selon le plan

## En Cas de Problème

Si un utilisateur voit les données d'un autre :
1. Vérifier que RLS est activé dans Supabase
2. Vérifier les policies dans la table `cases`
3. Vérifier les policies dans la table `documents`
4. Consulter `supabase-step2-no-rls.sql` pour les policies

---

**Note :** Pour l'instant, RLS n'est PAS activé pour faciliter les tests. Les données sont isolées au niveau de l'application (filtrage par `user_id`).
