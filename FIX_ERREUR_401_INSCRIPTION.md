# 🔧 Fix: Erreur 401 lors de l'Inscription

## 🚨 Problème

Lors de l'inscription d'un nouvel utilisateur, vous obtenez:
```
Failed to load resource: the server responded with a status of 401 ()
Profile creation error: Object
```

## 🔍 Cause

Les politiques RLS (Row Level Security) de Supabase empêchent l'utilisateur nouvellement inscrit d'insérer son propre profil dans la table `profiles`.

## ✅ Solution

Exécuter le script SQL qui corrige les politiques RLS.

---

## 📋 Étapes de Correction

### Étape 1: Ouvrir Supabase Dashboard

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet JuristDZ
3. Cliquer sur "SQL Editor" dans le menu de gauche

### Étape 2: Exécuter le Script de Correction

1. Cliquer sur "New query"
2. Copier le contenu du fichier `database/fix-signup-policies-complete.sql`
3. Coller dans l'éditeur SQL
4. Cliquer sur "Run" (ou Ctrl+Enter)

### Étape 3: Vérifier les Résultats

Vous devriez voir 3 tableaux de résultats:

#### 1. Politiques PROFILES
```
=== PROFILES POLICIES ===
- Allow authenticated users to insert their own profile (INSERT)
- Admins can insert profiles (INSERT)
- Users can view their own profile (SELECT)
- Admins can view all profiles (SELECT)
- Users can update their own profile (UPDATE)
- Admins can update all profiles (UPDATE)
- Admins can delete profiles (DELETE)
```

#### 2. Politiques SUBSCRIPTIONS
```
=== SUBSCRIPTIONS POLICIES ===
- Allow authenticated users to insert their own subscription (INSERT)
- Admins can insert subscriptions (INSERT)
- Users can view their own subscription (SELECT)
- Admins can view all subscriptions (SELECT)
- Users can update their own subscription (UPDATE)
- Admins can update all subscriptions (UPDATE)
- Admins can delete subscriptions (DELETE)
```

#### 3. RLS Status
```
profiles       | rls_enabled: true
subscriptions  | rls_enabled: true
```

### Étape 4: Tester l'Inscription

1. Ouvrir votre application JuristDZ
2. Cliquer sur "Inscription"
3. Remplir le formulaire avec de nouvelles informations
4. Cliquer sur "Créer mon compte"
5. ✅ Vous devriez voir le modal de vérification d'email
6. ✅ Pas d'erreur 401 dans la console

---

## 🔍 Comprendre les Politiques RLS

### Politique d'Insertion (INSERT)

```sql
CREATE POLICY "Allow authenticated users to insert their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

**Signification:**
- Un utilisateur authentifié peut insérer un profil
- SEULEMENT si l'ID du profil correspond à son propre ID utilisateur
- Empêche un utilisateur de créer un profil pour quelqu'un d'autre

### Politique de Lecture (SELECT)

```sql
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR is_admin());
```

**Signification:**
- Un utilisateur peut lire son propre profil
- OU s'il est admin, il peut lire tous les profils

### Politique de Mise à Jour (UPDATE)

```sql
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

**Signification:**
- Un utilisateur peut modifier son propre profil
- USING: Vérifie qu'il peut accéder à la ligne
- WITH CHECK: Vérifie que les nouvelles valeurs sont valides

---

## 🧪 Tests à Effectuer

### Test 1: Inscription Nouvel Utilisateur

1. **Action:** Créer un nouveau compte
2. **Résultat attendu:** 
   - ✅ Pas d'erreur 401
   - ✅ Modal de vérification d'email affiché
   - ✅ Email de confirmation reçu

### Test 2: Vérification Base de Données

1. **Aller dans Supabase Dashboard → Table Editor**
2. **Ouvrir la table `profiles`**
3. **Vérifier:**
   - ✅ Le nouveau profil existe
   - ✅ `is_active = false` (en attente de validation)
   - ✅ `is_admin = false`
   - ✅ Toutes les informations sont présentes

### Test 3: Vérification Subscription

1. **Ouvrir la table `subscriptions`**
2. **Vérifier:**
   - ✅ La subscription existe pour le nouvel utilisateur
   - ✅ `plan = 'free'`
   - ✅ `status = 'pending'`
   - ✅ `is_active = false`

---

## 🚨 Dépannage

### Problème: Erreur 401 persiste

**Solutions:**
1. Vérifier que le script SQL a bien été exécuté
2. Vérifier qu'il n'y a pas d'erreurs dans les logs SQL
3. Rafraîchir la page de l'application (Ctrl+F5)
4. Vider le cache du navigateur
5. Essayer en navigation privée

### Problème: Politiques en double

**Solution:**
```sql
-- Lister toutes les politiques
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

-- Supprimer les doublons manuellement
DROP POLICY IF EXISTS "nom_de_la_politique_en_double" ON profiles;
```

### Problème: RLS désactivé

**Solution:**
```sql
-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Vérification Manuelle des Politiques

### Commande SQL pour Vérifier

```sql
-- Voir toutes les politiques profiles
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Voir toutes les politiques subscriptions
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'subscriptions'
ORDER BY cmd, policyname;
```

### Résultat Attendu

Vous devriez voir exactement 7 politiques pour `profiles` et 7 pour `subscriptions`:
- 2 INSERT (user + admin)
- 2 SELECT (user + admin)
- 2 UPDATE (user + admin)
- 1 DELETE (admin seulement)

---

## ✅ Checklist Finale

Après avoir appliqué le fix:

- [ ] Script SQL exécuté sans erreur
- [ ] 7 politiques pour `profiles` visibles
- [ ] 7 politiques pour `subscriptions` visibles
- [ ] RLS activé sur les deux tables
- [ ] Test d'inscription réussi
- [ ] Pas d'erreur 401 dans la console
- [ ] Modal de vérification d'email affiché
- [ ] Profil créé dans la base de données
- [ ] Subscription créée dans la base de données

---

## 📞 Support

Si le problème persiste après avoir suivi toutes ces étapes:

1. Vérifier les logs Supabase (Dashboard → Logs → Auth)
2. Vérifier les logs de la console navigateur (F12)
3. Copier l'erreur exacte
4. Vérifier que la fonction `is_admin()` existe dans la base de données

### Vérifier la fonction is_admin()

```sql
-- Vérifier que la fonction existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_admin';

-- Si elle n'existe pas, la créer
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_admin 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎯 Résultat Final

Après avoir appliqué ce fix, l'inscription devrait fonctionner parfaitement:

1. ✅ Utilisateur remplit le formulaire
2. ✅ Clique sur "Créer mon compte"
3. ✅ Profil créé dans `profiles` (is_active = false)
4. ✅ Subscription créée dans `subscriptions` (status = pending)
5. ✅ Email de confirmation envoyé
6. ✅ Modal de vérification affiché
7. ✅ Utilisateur attend la validation admin

Tout fonctionne! 🎉
