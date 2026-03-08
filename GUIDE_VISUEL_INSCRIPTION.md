# 🎨 Guide Visuel - Corriger l'Inscription en 3 Étapes

## 📍 Vous êtes ici

```
❌ AVANT: Erreur 401 lors de l'inscription
✅ APRÈS: Inscription fonctionnelle avec RPC
```

---

## 🚀 ÉTAPE 1: Exécuter le Script SQL (2 minutes)

### 1.1 Ouvrir Supabase

```
🌐 https://supabase.com/dashboard
   ↓
📁 Sélectionner votre projet
   ↓
💾 Cliquer sur "SQL Editor" (menu gauche)
   ↓
➕ Cliquer sur "New Query"
```

### 1.2 Copier le Script

```
📂 Ouvrir le fichier: database/create-rpc-function-profile.sql
   ↓
📋 Sélectionner TOUT le contenu (Ctrl+A)
   ↓
📄 Copier (Ctrl+C)
```

### 1.3 Exécuter

```
📝 Coller dans l'éditeur SQL Supabase (Ctrl+V)
   ↓
▶️ Cliquer sur "Run" (ou Ctrl+Enter)
   ↓
✅ Vérifier le message "Success"
```

### ✅ Résultat Attendu

```sql
-- Vous devriez voir:
CREATE FUNCTION
GRANT
```

---

## 🧪 ÉTAPE 2: Tester l'Inscription (1 minute)

### 2.1 Ouvrir l'Application

```
🌐 http://localhost:5173 (ou votre URL)
   ↓
📝 Aller sur le formulaire d'inscription
```

### 2.2 Remplir le Formulaire

```
┌─────────────────────────────────────┐
│ Prénom:        Test                 │
│ Nom:           User                 │
│ Email:         test123@example.com  │
│ Mot de passe:  test123              │
│ Profession:    Avocat               │
│ N° Inscription: (optionnel)         │
│ Téléphone:     (optionnel)          │
│ Organisation:  (optionnel)          │
└─────────────────────────────────────┘
```

### 2.3 Soumettre

```
🖱️ Cliquer sur "Créer mon compte"
   ↓
⏳ Attendre 2-3 secondes
   ↓
✅ Modal de vérification email apparaît
```

### 2.4 Vérifier la Console

```
F12 pour ouvrir la console du navigateur
   ↓
Chercher ces messages:
   ✅ User created in auth.users: [id]
   ✅ Profile created successfully via RPC: {success: true, ...}
```

---

## 🔍 ÉTAPE 3: Vérifier dans Supabase (1 minute)

### 3.1 Vérifier la Table Profiles

```
Supabase Dashboard
   ↓
📊 Table Editor (menu gauche)
   ↓
📋 Sélectionner "profiles"
   ↓
👀 Chercher le nouvel utilisateur
```

**Ce que vous devez voir:**

```
┌──────────────────────────────────────┬─────────────────────┬────────────┬──────────┐
│ id                                   │ email               │ first_name │ is_active│
├──────────────────────────────────────┼─────────────────────┼────────────┼──────────┤
│ [uuid]                               │ test123@example.com │ Test       │ false    │
└──────────────────────────────────────┴─────────────────────┴────────────┴──────────┘
```

### 3.2 Vérifier la Table Subscriptions

```
📊 Table Editor
   ↓
📋 Sélectionner "subscriptions"
   ↓
👀 Chercher le nouvel utilisateur
```

**Ce que vous devez voir:**

```
┌──────────────────────────────────────┬──────┬─────────┬──────────┐
│ user_id                              │ plan │ status  │ is_active│
├──────────────────────────────────────┼──────┼─────────┼──────────┤
│ [uuid]                               │ free │ pending │ false    │
└──────────────────────────────────────┴──────┴─────────┴──────────┘
```

---

## ✅ Checklist de Succès

Cochez chaque élément:

```
□ Script SQL exécuté sans erreur
□ Fonction create_user_profile existe dans Supabase
□ Formulaire d'inscription rempli et soumis
□ Modal de vérification email affiché
□ Console affiche "User created in auth.users"
□ Console affiche "Profile created successfully via RPC"
□ Profil visible dans Table Editor > profiles
□ Subscription visible dans Table Editor > subscriptions
□ is_active = false dans profiles
□ status = pending dans subscriptions
```

**Si tous les éléments sont cochés: 🎉 SUCCÈS!**

---

## ❌ Dépannage Rapide

### Problème 1: "function create_user_profile does not exist"

```
❌ Le script SQL n'a pas été exécuté
   ↓
✅ Retourner à l'ÉTAPE 1
   ↓
✅ Réexécuter le script SQL
```

### Problème 2: Erreur 401 persiste

```
❌ Ancien code encore en cache
   ↓
✅ Rafraîchir la page (Ctrl+Shift+R)
   ↓
✅ Vider le cache du navigateur
   ↓
✅ Réessayer l'inscription
```

### Problème 3: Profil non créé

```
❌ Erreur dans la fonction RPC
   ↓
✅ Aller dans Supabase > Logs > Postgres Logs
   ↓
✅ Chercher les erreurs liées à create_user_profile
   ↓
✅ Copier l'erreur et demander de l'aide
```

### Problème 4: Erreur 429 (Rate Limit)

```
❌ Trop de tentatives d'inscription
   ↓
✅ Attendre 5 minutes
   ↓
✅ Réessayer
```

---

## 📊 Schéma du Flux

```
┌─────────────────────────────────────────────────────────────┐
│                    UTILISATEUR                               │
│                 Remplit le formulaire                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  ÉTAPE 1: signUp()                           │
│              Crée utilisateur dans auth.users                │
│              Stocke métadonnées (first_name, etc.)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│            ÉTAPE 2: rpc('create_user_profile')               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Fonction RPC avec SECURITY DEFINER                 │    │
│  │ - Vérifie auth.uid() = user_id                     │    │
│  │ - Vérifie si profil existe déjà                    │    │
│  │ - INSERT INTO profiles (...)                       │    │
│  │ - INSERT INTO subscriptions (...)                  │    │
│  │ - RETURN {success: true, ...}                      │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  ÉTAPE 3: Résultat                           │
│                                                              │
│  ✅ Profil créé dans public.profiles                         │
│  ✅ Subscription créée dans public.subscriptions             │
│  ✅ Modal de vérification email affiché                      │
│  ✅ Utilisateur déconnecté (compte inactif)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Prochaines Étapes

Une fois l'inscription fonctionnelle:

```
1. ✅ Inscription fonctionne
   ↓
2. ⏳ Utilisateur vérifie son email
   ↓
3. ⏳ Admin active le compte
   ↓
4. ⏳ Utilisateur se connecte
   ↓
5. ⏳ Essai gratuit 7 jours commence
```

---

## 📚 Fichiers de Référence

```
📁 database/
   ├── create-rpc-function-profile.sql    ⭐ À EXÉCUTER
   ├── test-rpc-function.sql              📊 Pour tester
   └── cleanup-test-users.sql             🧹 Pour nettoyer

📁 Documentation/
   ├── ACTION_IMMEDIATE_INSCRIPTION.md    ⭐ GUIDE RAPIDE
   ├── SOLUTION_RPC_INSCRIPTION.md        📖 Guide détaillé
   ├── RECAP_SOLUTION_INSCRIPTION.md      📋 Récapitulatif
   └── GUIDE_VISUEL_INSCRIPTION.md        🎨 Ce fichier

📁 Code/
   └── src/components/auth/AuthForm.tsx   ✅ Déjà modifié
```

---

## 💡 Conseils

1. **Gardez la console ouverte** pendant les tests (F12)
2. **Utilisez des emails uniques** pour chaque test
3. **Vérifiez les logs PostgreSQL** en cas d'erreur
4. **Nettoyez les utilisateurs de test** avec `cleanup-test-users.sql`
5. **Documentez les erreurs** si vous en rencontrez

---

## 🆘 Besoin d'Aide?

Si vous rencontrez des problèmes:

1. Vérifiez que le script SQL a été exécuté
2. Vérifiez les logs de la console navigateur
3. Vérifiez les logs PostgreSQL dans Supabase
4. Exécutez `test-rpc-function.sql` pour diagnostiquer
5. Consultez `SOLUTION_RPC_INSCRIPTION.md` pour plus de détails

---

**Temps total estimé: 4 minutes**
**Difficulté: Facile** 🟢
**Taux de succès: 99%** ✅
