# Vérification Manuelle RLS dans Supabase Dashboard

## Le problème

Le script SQL a été exécuté mais RLS n'est toujours pas activé. Cela peut arriver si :
1. Le script n'a pas été exécuté sur le bon projet
2. Il y a eu une erreur silencieuse
3. RLS a été désactivé après l'exécution

## Solution : Vérification et activation manuelle

### Étape 1 : Vérifier l'état actuel de RLS

1. **Aller dans Supabase Dashboard**
2. **Cliquer sur "Database"** dans le menu de gauche
3. **Cliquer sur "Tables"**

Pour **CHAQUE** table (`profiles`, `cases`, `documents`, `subscriptions`) :

4. **Cliquer sur le nom de la table**
5. **Regarder en haut à droite** : Y a-t-il un badge "RLS enabled" ?
   - ✅ Si OUI → RLS est activé (passez à la table suivante)
   - ❌ Si NON → Continuez à l'étape 2

---

### Étape 2 : Activer RLS manuellement (si désactivé)

Pour chaque table où RLS n'est PAS activé :

1. **Cliquer sur le nom de la table**
2. **En haut à droite, cliquer sur le bouton "Enable RLS"**
3. **Confirmer** dans la popup
4. **Vérifier** que le badge "RLS enabled" apparaît

**Répétez pour les 4 tables :**
- [ ] profiles
- [ ] cases
- [ ] documents
- [ ] subscriptions

---

### Étape 3 : Vérifier les Policies

1. **Aller dans "Authentication"** dans le menu de gauche
2. **Cliquer sur "Policies"**
3. **Sélectionner une table** dans le dropdown en haut

**Pour chaque table, vérifiez que les policies existent :**

#### Table `profiles` (doit avoir 7 policies)
```
✓ Users can view own profile
✓ Users can update own profile
✓ Admins can view all profiles
✓ Admins can update all profiles
✓ Admins can insert profiles
✓ Admins can delete profiles
✓ Allow profile creation on signup
```

#### Table `cases` (doit avoir 6 policies)
```
✓ Users can view own cases
✓ Users can create own cases
✓ Users can update own cases
✓ Users can delete own cases
✓ Admins can view all cases
✓ Admins can manage all cases
```

#### Table `documents` (doit avoir 6 policies)
```
✓ Users can view own documents
✓ Users can create own documents
✓ Users can update own documents
✓ Users can delete own documents
✓ Admins can view all documents
✓ Admins can manage all documents
```

#### Table `subscriptions` (doit avoir 4 policies)
```
✓ Users can view own subscription
✓ Admins can view all subscriptions
✓ Admins can manage all subscriptions
✓ Allow subscription creation on signup
```

**Si des policies manquent :**
- Cliquez sur "New Policy"
- Copiez-collez le SQL depuis `supabase-enable-rls.sql`

---

### Étape 4 : Test avec SQL Editor

Pour vérifier que RLS fonctionne vraiment :

1. **Aller dans "SQL Editor"**
2. **Créer une nouvelle requête**
3. **Copier-coller ce code :**

```sql
-- Test 1 : Vérifier que RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'cases', 'documents', 'subscriptions');

-- Résultat attendu : rowsecurity = true pour toutes les tables
```

4. **Cliquer sur "Run"**

**Résultat attendu :**
```
schemaname | tablename      | rowsecurity
-----------+----------------+-------------
public     | profiles       | true
public     | cases          | true
public     | documents      | true
public     | subscriptions  | true
```

**Si rowsecurity = false :**
- RLS n'est PAS activé
- Activez-le manuellement (Étape 2)

---

### Étape 5 : Test avec SQL Editor (Policies)

Pour vérifier que les policies existent :

```sql
-- Test 2 : Lister toutes les policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'cases', 'documents', 'subscriptions')
ORDER BY tablename, policyname;
```

**Résultat attendu :**
- Au moins 23 policies au total
- 7 pour profiles
- 6 pour cases
- 6 pour documents
- 4 pour subscriptions

---

### Étape 6 : Re-tester avec le HTML

1. **Rechargez** `test-rls-configuration.html`
2. **Cliquez sur "Vérifier RLS"**

**Résultat attendu :**
```
✅ profiles      → RLS ACTIVÉ
✅ cases         → RLS ACTIVÉ
✅ documents     → RLS ACTIVÉ
✅ subscriptions → RLS ACTIVÉ
```

---

## Si RLS est toujours désactivé après tout ça

### Vérification 1 : Bon projet Supabase ?

Vérifiez que vous êtes sur le bon projet :
- URL du projet : `https://fcteljnmcdelbratudnc.supabase.co`
- Nom du projet dans le Dashboard doit correspondre

### Vérification 2 : Permissions

Vérifiez que vous avez les permissions :
- Vous devez être "Owner" ou "Admin" du projet
- Allez dans Settings → Team pour vérifier

### Vérification 3 : Cache du navigateur

Videz le cache :
1. Ouvrez la console (F12)
2. Clic droit sur le bouton "Recharger"
3. Sélectionnez "Vider le cache et recharger"

### Vérification 4 : Essayez via l'API

Testez directement avec curl :

```bash
curl -X GET 'https://fcteljnmcdelbratudnc.supabase.co/rest/v1/profiles' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdGVsam5tY2RlbGJyYXR1ZG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTkzMDQsImV4cCI6MjA4NTE5NTMwNH0.jbWM24_1ernpGVHS7i32Jx0W9K7yx8WdCLqq42tzwOo" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdGVsam5tY2RlbGJyYXR1ZG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTkzMDQsImV4cCI6MjA4NTE5NTMwNH0.jbWM24_1ernpGVHS7i32Jx0W9K7yx8WdCLqq42tzwOo"
```

**Si RLS est activé :**
```json
{
  "code": "PGRST301",
  "message": "row-level security policy violation"
}
```

**Si RLS n'est PAS activé :**
```json
[
  { "id": "...", "email": "...", ... }
]
```

---

## Checklist Finale

```
☐ Vérifié dans Dashboard → Database → Tables
☐ Badge "RLS enabled" visible sur profiles
☐ Badge "RLS enabled" visible sur cases
☐ Badge "RLS enabled" visible sur documents
☐ Badge "RLS enabled" visible sur subscriptions

☐ Vérifié dans Dashboard → Authentication → Policies
☐ 7 policies pour profiles
☐ 6 policies pour cases
☐ 6 policies pour documents
☐ 4 policies pour subscriptions

☐ Test SQL : rowsecurity = true pour toutes les tables
☐ Test HTML : "RLS ACTIVÉ" pour toutes les tables
☐ Test manuel : User A ne voit pas les données de User B
```

---

## Contact Support Supabase

Si rien ne fonctionne, contactez le support Supabase :
- Dashboard → Help → Contact Support
- Discord : https://discord.supabase.com
- GitHub Issues : https://github.com/supabase/supabase/issues

Mentionnez :
- Projet ID : `fcteljnmcdelbratudnc`
- Problème : "RLS ne s'active pas malgré ALTER TABLE ENABLE ROW LEVEL SECURITY"
- Scripts exécutés : `supabase-enable-rls.sql` et `activer-rls-seulement.sql`

---

**Date :** 2 mars 2026  
**Priorité :** 🚨 CRITIQUE
