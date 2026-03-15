# 🚨 URGENT : Activer RLS Maintenant

## Résultat du Test

```
❌ profiles      → RLS DÉSACTIVÉ
❌ cases         → RLS DÉSACTIVÉ  
❌ documents     → RLS DÉSACTIVÉ
❌ subscriptions → RLS DÉSACTIVÉ
❌ Policies      → Manquantes
✅ Fonctions     → OK (is_admin, check_document_quota, increment_document_usage)
```

**Problème :** RLS n'est pas activé, ce qui signifie que **TOUS les utilisateurs peuvent voir les données de TOUS les autres utilisateurs** !

---

## Solution : Activer RLS Manuellement

### Méthode 1 : Via Supabase Dashboard (RECOMMANDÉ)

#### Étape 1 : Activer RLS sur chaque table

**Chemin :** Dashboard → Database → Tables

Pour **CHAQUE** table (`profiles`, `cases`, `documents`, `subscriptions`) :

1. Cliquer sur le nom de la table
2. En haut à droite, cliquer sur **"Enable RLS"**
3. Confirmer

**Vérification :** Le badge "RLS enabled" doit être visible en haut de chaque table.

---

#### Étape 2 : Créer les Policies

**Chemin :** Dashboard → Authentication → Policies

##### Pour la table `profiles`

Cliquer sur **"New Policy"** et créer ces 7 policies :

**1. Users can view own profile**
```sql
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (id::text = (auth.uid())::text);
```

**2. Users can update own profile**
```sql
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (id::text = (auth.uid())::text);
```

**3. Admins can view all profiles**
```sql
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());
```

**4. Admins can update all profiles**
```sql
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_admin());
```

**5. Admins can insert profiles**
```sql
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (public.is_admin());
```

**6. Admins can delete profiles**
```sql
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (public.is_admin());
```

**7. Allow profile creation on signup**
```sql
CREATE POLICY "Allow profile creation on signup"
ON public.profiles
FOR INSERT
WITH CHECK (id::text = (auth.uid())::text);
```

---

##### Pour la table `cases`

**1. Users can view own cases**
```sql
CREATE POLICY "Users can view own cases"
ON public.cases
FOR SELECT
USING (user_id::text = (auth.uid())::text);
```

**2. Users can create own cases**
```sql
CREATE POLICY "Users can create own cases"
ON public.cases
FOR INSERT
WITH CHECK (user_id::text = (auth.uid())::text);
```

**3. Users can update own cases**
```sql
CREATE POLICY "Users can update own cases"
ON public.cases
FOR UPDATE
USING (user_id::text = (auth.uid())::text);
```

**4. Users can delete own cases**
```sql
CREATE POLICY "Users can delete own cases"
ON public.cases
FOR DELETE
USING (user_id::text = (auth.uid())::text);
```

**5. Admins can view all cases**
```sql
CREATE POLICY "Admins can view all cases"
ON public.cases
FOR SELECT
USING (public.is_admin());
```

**6. Admins can manage all cases**
```sql
CREATE POLICY "Admins can manage all cases"
ON public.cases
FOR ALL
USING (public.is_admin());
```

---

##### Pour la table `documents`

**1. Users can view own documents**
```sql
CREATE POLICY "Users can view own documents"
ON public.documents
FOR SELECT
USING (user_id::text = (auth.uid())::text);
```

**2. Users can create own documents**
```sql
CREATE POLICY "Users can create own documents"
ON public.documents
FOR INSERT
WITH CHECK (
  user_id::text = (auth.uid())::text 
  AND public.check_document_quota(user_id)
);
```

**3. Users can update own documents**
```sql
CREATE POLICY "Users can update own documents"
ON public.documents
FOR UPDATE
USING (user_id::text = (auth.uid())::text);
```

**4. Users can delete own documents**
```sql
CREATE POLICY "Users can delete own documents"
ON public.documents
FOR DELETE
USING (user_id::text = (auth.uid())::text);
```

**5. Admins can view all documents**
```sql
CREATE POLICY "Admins can view all documents"
ON public.documents
FOR SELECT
USING (public.is_admin());
```

**6. Admins can manage all documents**
```sql
CREATE POLICY "Admins can manage all documents"
ON public.documents
FOR ALL
USING (public.is_admin());
```

---

##### Pour la table `subscriptions`

**1. Users can view own subscription**
```sql
CREATE POLICY "Users can view own subscription"
ON public.subscriptions
FOR SELECT
USING (user_id::text = (auth.uid())::text);
```

**2. Admins can view all subscriptions**
```sql
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (public.is_admin());
```

**3. Admins can manage all subscriptions**
```sql
CREATE POLICY "Admins can manage all subscriptions"
ON public.subscriptions
FOR ALL
USING (public.is_admin());
```

**4. Allow subscription creation on signup**
```sql
CREATE POLICY "Allow subscription creation on signup"
ON public.subscriptions
FOR INSERT
WITH CHECK (user_id::text = (auth.uid())::text);
```

---

### Méthode 2 : Via SQL Editor (PLUS RAPIDE)

**Chemin :** Dashboard → SQL Editor → New Query

Copiez-collez **TOUT** le contenu du fichier `supabase-enable-rls.sql` et cliquez sur **"Run"**.

Si vous avez une erreur "policy already exists", c'est normal, continuez.

---

## Vérification

### 1. Vérifier dans le Dashboard

**Database → Tables** : Chaque table doit avoir "RLS enabled" = ✅

**Authentication → Policies** : Chaque table doit avoir ses policies listées

### 2. Re-tester avec le HTML

1. Rechargez `test-rls-configuration.html`
2. Entrez vos credentials
3. Cliquez sur "Vérifier RLS"
4. **Résultat attendu :**
   ```
   ✅ profiles      → RLS ACTIVÉ
   ✅ cases         → RLS ACTIVÉ
   ✅ documents     → RLS ACTIVÉ
   ✅ subscriptions → RLS ACTIVÉ
   ```

### 3. Tester dans l'application

1. Se connecter avec User A
2. Créer un dossier
3. Se connecter avec User B
4. **Vérifier que le dossier de User A n'est PAS visible**

---

## Pourquoi c'est URGENT ?

Sans RLS activé :
- ❌ Tous les utilisateurs peuvent voir les données de tous les autres
- ❌ Aucune isolation des données
- ❌ Faille de sécurité majeure
- ❌ Non conforme RGPD

Avec RLS activé :
- ✅ Chaque utilisateur voit UNIQUEMENT ses données
- ✅ Isolation garantie au niveau base de données
- ✅ Sécurité maximale
- ✅ Conforme RGPD

---

## Problèmes Courants

### "Policy already exists"
**Solution :** Normal si vous avez déjà essayé. Continuez avec les autres policies.

### "Function is_admin() does not exist"
**Solution :** Exécutez d'abord `supabase-step2-no-rls.sql` pour créer les fonctions.

### "Permission denied"
**Solution :** Vous devez être connecté en tant que propriétaire du projet Supabase.

### RLS activé mais policies ne fonctionnent pas
**Solution :** Vérifiez que les policies utilisent bien `auth.uid()` et non `current_user`.

---

## Checklist Finale

```
☐ RLS activé sur profiles
☐ RLS activé sur cases
☐ RLS activé sur documents
☐ RLS activé sur subscriptions

☐ 7 policies créées pour profiles
☐ 6 policies créées pour cases
☐ 6 policies créées pour documents
☐ 4 policies créées pour subscriptions

☐ Test HTML montre "RLS ACTIVÉ" pour toutes les tables
☐ Test manuel : User A ne voit pas les données de User B
☐ Test manuel : Admin voit toutes les données
```

---

**IMPORTANT :** Ne mettez PAS l'application en production tant que RLS n'est pas activé !

---

**Date :** 2 mars 2026  
**Priorité :** 🚨 CRITIQUE
