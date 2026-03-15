# Test - Gestion des Utilisateurs Admin

## 🎯 Objectif du Test
Tester les nouvelles fonctionnalités de gestion des utilisateurs :
1. Modification d'un utilisateur existant
2. Réinitialisation de mot de passe
3. Suppression d'un utilisateur

## 📋 Prérequis
- Être connecté en tant qu'admin (admin@juristdz.com)
- Avoir au moins un utilisateur de test (Ahmed Benali existe déjà)

## 🧪 Tests à Effectuer

### Test 1 : Modifier un Utilisateur
**Objectif** : Vérifier que la modification fonctionne

1. Se connecter avec le compte admin
2. Aller dans l'onglet "Utilisateurs"
3. Cliquer sur l'icône "Modifier" (crayon) pour Ahmed Benali
4. Modifier le prénom : "Ahmed" → "Ahmed Mohamed"
5. Changer le plan : "Gratuit" → "Pro"
6. Cliquer sur "Enregistrer"

**Résultat attendu** :
- ✅ Message de succès
- ✅ Le prénom est mis à jour dans la liste
- ✅ Le plan affiche "pro" avec la couleur or
- ✅ Les documents affichent "0 / ∞" (illimité)

### Test 2 : Réinitialiser le Mot de Passe
**Objectif** : Vérifier l'envoi d'email de réinitialisation

1. Cliquer sur "Modifier" pour Ahmed Benali
2. Cocher la case "Envoyer un email de réinitialisation à l'utilisateur"
3. Cliquer sur "Enregistrer"

**Résultat attendu** :
- ✅ Message de succès
- ✅ Un email est envoyé à ahmed.benali@test.dz
- ⚠️ **Note** : Si l'email n'existe pas vraiment, Supabase peut ne pas envoyer l'email

**Vérification dans Supabase** :
1. Aller sur le dashboard Supabase
2. Authentication → Users
3. Vérifier les logs d'emails

### Test 3 : Activer/Désactiver un Utilisateur
**Objectif** : Vérifier le changement de statut

1. Dans la liste des utilisateurs
2. Cliquer sur l'icône de statut (coche verte) pour Ahmed Benali
3. Observer le changement

**Résultat attendu** :
- ✅ Le statut passe de "Actif" (vert) à "Inactif" (rouge)
- ✅ L'icône change de CheckCircle à XCircle
- ✅ Le changement est immédiat (pas de rechargement)

4. Cliquer à nouveau pour réactiver
5. Le statut repasse à "Actif"

### Test 4 : Créer un Deuxième Utilisateur
**Objectif** : Créer Sarah Khelifi pour tester la suppression

1. Cliquer sur "Créer un Utilisateur"
2. Remplir le formulaire :
   - Prénom : Sarah
   - Nom : Khelifi
   - Email : sarah.khelifi@test.dz
   - Mot de passe : test123
   - Profession : Avocat
   - Plan : Gratuit
3. Cliquer sur "Créer l'Utilisateur"

**Résultat attendu** :
- ✅ Message de succès
- ✅ Sarah apparaît dans la liste
- ✅ Statut "Actif"
- ✅ Plan "free"

### Test 5 : Supprimer un Utilisateur
**Objectif** : Vérifier la suppression complète

1. Cliquer sur "Modifier" pour Sarah Khelifi
2. Descendre en bas du formulaire
3. Cliquer sur "Supprimer l'utilisateur"
4. Lire le message d'avertissement
5. Cliquer sur "Confirmer la suppression"

**Résultat attendu** :
- ✅ Message de confirmation
- ✅ Sarah disparaît de la liste
- ✅ Le compteur "Total Utilisateurs" diminue de 1

**Vérification dans Supabase** :
1. Aller sur le dashboard Supabase
2. Table Editor → profiles
3. Vérifier que Sarah n'existe plus
4. Table Editor → subscriptions
5. Vérifier que l'abonnement de Sarah n'existe plus

### Test 6 : Filtres et Recherche
**Objectif** : Vérifier les fonctionnalités de filtrage

1. **Test de recherche** :
   - Taper "ahmed" dans la barre de recherche
   - Vérifier que seul Ahmed apparaît

2. **Test filtre profession** :
   - Sélectionner "Avocat" dans le filtre profession
   - Vérifier que seuls les avocats apparaissent

3. **Test filtre statut** :
   - Sélectionner "Actifs" dans le filtre statut
   - Vérifier que seuls les utilisateurs actifs apparaissent

4. **Test filtre plan** :
   - Sélectionner "Pro" dans le filtre plan
   - Vérifier que seuls les utilisateurs Pro apparaissent

5. **Test combinaison de filtres** :
   - Recherche : "ahmed"
   - Profession : "Avocat"
   - Statut : "Actifs"
   - Plan : "Pro"
   - Vérifier que le compteur affiche le bon nombre

## 🐛 Problèmes Potentiels

### Erreur : "Session expirée"
**Solution** : Se reconnecter avec le compte admin

### Erreur : "Erreur lors de la suppression"
**Cause possible** : Contraintes de clés étrangères
**Solution** : Vérifier que les tables documents et cases existent

### Email de réinitialisation non reçu
**Causes possibles** :
1. L'email n'existe pas vraiment
2. Configuration SMTP de Supabase
3. Email dans les spams

**Solution** : Vérifier les logs dans Supabase Dashboard

### Utilisateur supprimé mais toujours dans auth.users
**C'est normal** : La suppression de auth.users nécessite la clé service_role
**Impact** : L'utilisateur ne peut plus se connecter (profil supprimé)

## 📊 Checklist de Validation

- [ ] Modification d'utilisateur fonctionne
- [ ] Changement de plan fonctionne
- [ ] Réinitialisation de mot de passe envoie un email
- [ ] Activation/désactivation fonctionne
- [ ] Création d'utilisateur fonctionne
- [ ] Suppression d'utilisateur fonctionne
- [ ] Recherche fonctionne
- [ ] Filtres fonctionnent
- [ ] Statistiques se mettent à jour
- [ ] Interface responsive

## 🎯 Prochaines Étapes Après Validation

Si tous les tests passent :
1. ✅ Interface admin validée
2. 🔄 Créer les 3 comptes de test restants :
   - Sarah Khelifi (avocat)
   - Mohamed Ziani (notaire)
   - Karim Djahid (huissier)
3. 🔄 Tester l'isolation des données :
   - Se connecter avec Ahmed
   - Créer un dossier
   - Se connecter avec Sarah
   - Vérifier qu'elle ne voit pas le dossier d'Ahmed
4. 🔄 Activer Row Level Security (RLS)

## 💡 Conseils

### Pour tester la suppression
Créez toujours un utilisateur de test avant de tester la suppression. Ne supprimez pas Ahmed Benali si vous voulez le garder pour d'autres tests.

### Pour tester l'email de réinitialisation
Utilisez un vrai email si vous voulez recevoir l'email. Sinon, vérifiez simplement qu'il n'y a pas d'erreur.

### Pour tester les filtres
Créez plusieurs utilisateurs avec différentes professions et plans pour voir les filtres en action.

## 🎉 Résultat Attendu

Après tous les tests, vous devriez avoir :
- Une interface admin complète et fonctionnelle
- La capacité de gérer tous les aspects des utilisateurs
- Une base solide pour créer les comptes de test
- Confiance dans le système avant d'activer RLS

**Bonne chance avec les tests !** 🚀
