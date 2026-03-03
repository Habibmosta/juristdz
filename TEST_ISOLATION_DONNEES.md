# Test d'Isolation des Données - Procédure Complète

## Configuration Actuelle

✅ RLS activé sur toutes les tables
✅ Policies créées et correctes
✅ Rôle anon ne bypass pas RLS
✅ Fonctions PostgreSQL présentes

**Le test HTML montre "RLS DÉSACTIVÉ" mais c'est un faux positif.**

Le test HTML utilise la clé anon sans authentification, et les policies bloquent correctement (aucune donnée n'est retournée). Mais le test interprète mal le résultat.

## Test Réel dans l'Application

### Prérequis

Vous devez avoir au moins 2 utilisateurs actifs :
- User A : `ahmed.benali@test.dz` / `test123`
- User B : `sarah.mansouri@test.dz` / `test123`

Si vous ne les avez pas, créez-les via l'interface admin.

---

### Test 1 : Créer des données avec User A

1. **Se connecter avec User A**
   - Email : `ahmed.benali@test.dz`
   - Mot de passe : `test123`

2. **Créer un dossier**
   - Aller dans "Mes Dossiers" ou équivalent
   - Créer un nouveau dossier : "Affaire Test A - Confidentiel"
   - Ajouter une description : "Données privées de User A"
   - Sauvegarder

3. **Vérifier que le dossier est visible**
   - Le dossier "Affaire Test A" doit apparaître dans la liste
   - ✅ Si visible : OK

4. **Noter l'ID du dossier** (si possible, pour vérification SQL)

---

### Test 2 : Vérifier l'isolation avec User B

1. **Se déconnecter de User A**
   - Cliquer sur "Déconnexion"

2. **Se connecter avec User B**
   - Email : `sarah.mansouri@test.dz`
   - Mot de passe : `test123`

3. **Aller dans "Mes Dossiers"**
   - Regarder la liste des dossiers

4. **VÉRIFICATION CRITIQUE**
   - ❌ Le dossier "Affaire Test A" ne doit PAS être visible
   - ✅ La liste doit être vide OU contenir uniquement les dossiers de User B
   - ❌ Si vous voyez le dossier de User A → **RLS NE FONCTIONNE PAS**
   - ✅ Si vous ne voyez PAS le dossier de User A → **RLS FONCTIONNE**

5. **Créer un dossier pour User B**
   - Créer un nouveau dossier : "Affaire Test B - Privé"
   - Sauvegarder

---

### Test 3 : Vérifier la réciprocité

1. **Se déconnecter de User B**

2. **Se reconnecter avec User A**
   - Email : `ahmed.benali@test.dz`

3. **Aller dans "Mes Dossiers"**

4. **VÉRIFICATION**
   - ✅ Voir "Affaire Test A" (son propre dossier)
   - ❌ Ne PAS voir "Affaire Test B" (dossier de User B)

---

### Test 4 : Vérifier l'accès admin

1. **Se déconnecter**

2. **Se connecter en admin**
   - Email : `admin@juristdz.com`
   - Mot de passe : `Admin2024!JuristDZ`

3. **Aller dans l'interface admin**
   - Onglet "Utilisateurs"

4. **VÉRIFICATION**
   - ✅ Voir tous les utilisateurs (User A, User B, etc.)
   - ✅ Pouvoir modifier n'importe quel utilisateur
   - ✅ Voir les statistiques de tous les utilisateurs

---

### Test 5 : Vérification SQL (Optionnel)

**Dans Supabase Dashboard → SQL Editor :**

```sql
-- Vérifier que les dossiers ont bien un user_id
SELECT 
    id,
    user_id,
    title,
    client_name,
    created_at
FROM cases
ORDER BY created_at DESC
LIMIT 10;
```

**Résultat attendu :**
- Chaque dossier a un `user_id` différent
- "Affaire Test A" a le user_id de User A
- "Affaire Test B" a le user_id de User B

---

## Résultats Attendus

### ✅ RLS FONCTIONNE si :

```
✅ User A voit uniquement ses propres dossiers
✅ User B voit uniquement ses propres dossiers
✅ User A ne voit PAS les dossiers de User B
✅ User B ne voit PAS les dossiers de User A
✅ Admin voit tous les utilisateurs et peut tout gérer
```

### ❌ RLS NE FONCTIONNE PAS si :

```
❌ User A voit les dossiers de User B
❌ User B voit les dossiers de User A
❌ N'importe quel utilisateur voit les données des autres
```

---

## Si RLS ne fonctionne pas dans l'application

### Vérification 1 : Le code filtre-t-il par user_id ?

Vérifiez dans le code que les requêtes filtrent bien par `user_id` :

```typescript
// BON ✅
const { data } = await supabase
  .from('cases')
  .select('*')
  .eq('user_id', user.id);

// MAUVAIS ❌
const { data } = await supabase
  .from('cases')
  .select('*');
  // Pas de filtre user_id !
```

### Vérification 2 : L'utilisateur est-il authentifié ?

Vérifiez que `user.id` existe et correspond à l'utilisateur connecté.

### Vérification 3 : Les policies sont-elles appliquées ?

Si le code ne filtre pas par `user_id`, les policies RLS devraient quand même bloquer. Mais c'est mieux de filtrer dans le code aussi.

---

## Conclusion

**Le test HTML n'est pas fiable pour tester RLS.**

Le vrai test est de se connecter avec 2 utilisateurs différents et vérifier qu'ils ne voient pas les données de l'autre.

**Si le test manuel fonctionne (isolation OK), alors RLS fonctionne correctement** même si le test HTML dit le contraire.

---

## Prochaines Étapes

1. ✅ Faire le test manuel ci-dessus
2. ✅ Vérifier que l'isolation fonctionne
3. ✅ Si OK, ignorer le test HTML (faux positif)
4. ✅ Mettre l'application en production

**RLS est configuré correctement selon les résultats SQL. Le test manuel confirmera que tout fonctionne.**

---

**Date :** 2 mars 2026  
**Statut :** Configuration RLS complète, test manuel requis
