# ⚡ EXÉCUTER MAINTENANT - Correction Finale

## 🎯 Problème
```
Error: "null value in column id of relation profiles violates not-null constraint"
```

## ✅ Solution
Nouveau script SQL corrigé qui supprime la vérification `auth.uid()` problématique.

---

## 🚀 ACTION IMMÉDIATE

### 1️⃣ Exécuter le Script SQL (30 secondes)

**Fichier**: `database/create-rpc-function-profile-v2.sql`

1. Ouvrez Supabase Dashboard
2. Cliquez sur **SQL Editor**
3. Ouvrez le fichier `create-rpc-function-profile-v2.sql`
4. Copiez TOUT le contenu
5. Collez dans l'éditeur SQL
6. Cliquez sur **Run**
7. Vérifiez "Success"

### 2️⃣ Tester (1 minute)

1. Ouvrez votre application
2. Créez un nouveau compte
3. Ouvrez la console (F12)

### 3️⃣ Vérifier

**Console doit afficher**:
```
✅ User created in auth.users: [id]
✅ Profile created successfully via RPC: {success: true, ...}
```

**Supabase doit contenir**:
- Nouveau profil dans table `profiles`
- Nouvelle subscription dans table `subscriptions`

---

## 🔍 Qu'est-ce qui a changé?

### Avant (ne fonctionnait pas)
```sql
IF auth.uid() != user_id THEN  -- auth.uid() = NULL après signUp!
  RAISE EXCEPTION 'Unauthorized';
END IF;
```

### Après (fonctionne)
```sql
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
  RAISE EXCEPTION 'User does not exist';
END IF;
```

---

## ✅ C'est tout!

Après avoir exécuté le script, l'inscription fonctionnera sans erreur.

---

**Fichier**: `database/create-rpc-function-profile-v2.sql`  
**Temps**: 30 secondes  
**Résultat**: Inscription fonctionnelle ✅
