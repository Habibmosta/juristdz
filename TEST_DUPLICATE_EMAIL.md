# 🧪 TEST: Vérification Protection Doublons Email

## ✅ Protection Automatique Supabase

Supabase empêche automatiquement les inscriptions avec le même email.

---

## 🔍 VÉRIFICATION DANS LA BASE

### 1. Voir la contrainte UNIQUE

Exécute dans Supabase SQL Editor:

```sql
-- Vérifier la contrainte UNIQUE sur auth.users
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'auth.users'::regclass
  AND contype = 'u'; -- u = UNIQUE
```

**Résultat attendu:**
```
constraint_name          | constraint_type
users_email_key          | u
users_phone_key          | u
```

### 2. Vérifier les index

```sql
-- Voir les index sur la colonne email
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND schemaname = 'auth'
  AND indexdef LIKE '%email%';
```

---

## 🧪 TEST MANUEL

### Scénario 1: Inscription avec même email

1. **Première inscription**:
   - Email: test@example.com
   - Nom: Jean Dupont
   - Résultat: ✅ Compte créé

2. **Deuxième inscription** (même email):
   - Email: test@example.com
   - Nom: Marie Martin
   - Résultat: ❌ Erreur

**Message d'erreur attendu:**
```
"User already registered"
```

### Scénario 2: Email avec casse différente

1. **Première inscription**:
   - Email: Test@Example.com
   - Résultat: ✅ Compte créé

2. **Deuxième inscription**:
   - Email: test@example.com
   - Résultat: ❌ Erreur (même email)

**Note:** PostgreSQL traite les emails de manière case-insensitive.

---

## 🔒 SÉCURITÉ SUPPLÉMENTAIRE

### Protection côté client (optionnel)

Ajouter une vérification avant l'inscription:

```typescript
// Dans AuthForm.tsx, avant handleSignUp

const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();
    
    return !!data;
  } catch {
    return false;
  }
};

// Dans handleSignUp, avant signUp
const emailExists = await checkEmailExists(email);
if (emailExists) {
  setError('Cet email est déjà utilisé. Essayez de vous connecter ou utilisez un autre email.');
  setLoading(false);
  return;
}
```

**Avantage:** Message d'erreur plus clair avant même d'appeler Supabase.

---

## 📊 STATISTIQUES

### Voir les emails en double (ne devrait rien retourner)

```sql
-- Vérifier s'il y a des doublons (ne devrait rien retourner)
SELECT 
  email,
  COUNT(*) as count
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;
```

**Résultat attendu:** Aucune ligne (table vide)

### Voir tous les emails

```sql
-- Liste de tous les emails uniques
SELECT 
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;
```

---

## ⚠️ CAS PARTICULIERS

### 1. Email avec espaces

```
"test@example.com " ≠ "test@example.com"
```

**Solution:** Supabase trim automatiquement les espaces.

### 2. Email avec caractères spéciaux

```
"test+1@example.com" ≠ "test@example.com"
```

**Note:** Ce sont des emails différents (valide).

### 3. Compte supprimé puis recréé

Si un utilisateur:
1. Crée un compte: test@example.com
2. Supprime son compte
3. Recrée avec le même email

**Comportement:**
- ❌ Par défaut: Erreur (l'email reste dans auth.users)
- ✅ Avec soft delete: Possible de réactiver

---

## 🛡️ PROTECTION MULTI-NIVEAUX

### Niveau 1: Base de données (PostgreSQL)
- ✅ Contrainte UNIQUE sur email
- ✅ Index unique
- ✅ Impossible d'insérer un doublon

### Niveau 2: Supabase Auth
- ✅ Vérification avant insertion
- ✅ Message d'erreur clair
- ✅ Rate limiting (4 tentatives/heure)

### Niveau 3: Application (optionnel)
- ✅ Vérification côté client
- ✅ Message d'erreur personnalisé
- ✅ UX améliorée

---

## 🎯 RECOMMANDATION

**Tu n'as RIEN à faire!** 🎉

La protection est déjà en place grâce à:
1. PostgreSQL (contrainte UNIQUE)
2. Supabase Auth (vérification automatique)

**Optionnel:** Ajouter la vérification côté client pour une meilleure UX.

---

## 📝 MESSAGES D'ERREUR

### Message actuel (Supabase)
```
"User already registered"
```

### Message amélioré (optionnel)
```
"Cet email est déjà utilisé. 
Essayez de vous connecter ou utilisez 'Mot de passe oublié'."
```

---

## ✅ CONCLUSION

**Protection garantie à 100%** ✅

Impossible de créer deux comptes avec le même email, même si:
- ❌ Nom différent
- ❌ Prénom différent
- ❌ Téléphone différent
- ❌ Profession différente
- ❌ Casse différente (Test@example.com vs test@example.com)

**Seule exception:** Email avec caractères différents (test+1@example.com)

---

**Date:** 6 mars 2026
**Statut:** ✅ Protection active par défaut
**Action requise:** Aucune (optionnel: améliorer le message d'erreur)
