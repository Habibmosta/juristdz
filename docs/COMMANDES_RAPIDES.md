# ⚡ Commandes Rapides - Solution Inscription

## 🎯 Objectif
Corriger l'erreur 401 en 3 minutes

---

## 1️⃣ EXÉCUTER LE SCRIPT SQL

### Dans Supabase SQL Editor:

```sql
-- Copier et exécuter TOUT le contenu de:
-- database/create-rpc-function-profile.sql
```

**Vérification rapide:**
```sql
-- Vérifier que la fonction existe
SELECT proname FROM pg_proc WHERE proname = 'create_user_profile';
-- Résultat attendu: create_user_profile
```

---

## 2️⃣ TESTER L'INSCRIPTION

### Dans votre application:

1. Ouvrir le formulaire d'inscription
2. Remplir avec des données de test:
   - Email: `test@example.com`
   - Mot de passe: `test123`
   - Prénom: `Test`
   - Nom: `User`
3. Soumettre

### Vérifier dans la console (F12):
```
✅ User created in auth.users: [id]
✅ Profile created successfully via RPC: {success: true, ...}
```

---

## 3️⃣ VÉRIFIER DANS SUPABASE

### Table profiles:
```sql
SELECT id, email, first_name, last_name, is_active 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;
```

### Table subscriptions:
```sql
SELECT user_id, plan, status, is_active 
FROM subscriptions 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 🧪 TESTS SUPPLÉMENTAIRES (Optionnel)

### Exécuter le script de test:
```sql
-- Copier et exécuter:
-- database/test-rpc-function.sql
```

### Nettoyer les utilisateurs de test:
```sql
-- Voir les utilisateurs de test
SELECT u.id, u.email, u.created_at
FROM auth.users u
WHERE u.email LIKE '%test%' OR u.email LIKE '%example%'
ORDER BY u.created_at DESC;

-- Supprimer (décommenter si nécessaire)
-- DELETE FROM subscriptions WHERE user_id = '[USER_ID]';
-- DELETE FROM profiles WHERE id = '[USER_ID]';
-- Puis supprimer dans Dashboard > Authentication > Users
```

---

## 🐛 DÉPANNAGE RAPIDE

### Erreur: "function does not exist"
```sql
-- Réexécuter le script
-- database/create-rpc-function-profile.sql
```

### Erreur 401 persiste
```
1. Vider le cache (Ctrl+Shift+R)
2. Réessayer l'inscription
```

### Profil non créé
```sql
-- Vérifier les logs PostgreSQL dans Supabase
-- Logs > Postgres Logs
-- Chercher: create_user_profile
```

---

## ✅ CHECKLIST

- [ ] Script SQL exécuté
- [ ] Fonction existe (vérifiée)
- [ ] Inscription testée
- [ ] Console affiche succès
- [ ] Profil créé dans table
- [ ] Subscription créée dans table

---

## 📚 DOCUMENTATION COMPLÈTE

- **Guide ultra-rapide**: `FAIRE_MAINTENANT.md`
- **Guide visuel**: `GUIDE_VISUEL_INSCRIPTION.md`
- **Guide détaillé**: `SOLUTION_RPC_INSCRIPTION.md`
- **Index complet**: `INDEX_SOLUTION_INSCRIPTION.md`

---

**Temps total: 3 minutes**
