# ⚡ Solution Rapide - Erreur Vercel

## 🚨 Problème
```
Failed to load resource: net::ERR_NAME_NOT_RESOLVED
fcteljnmcdelbratudnc.supabase.c/auth/v1/token
```

## ✅ Solution en 3 Étapes (5 minutes)

### Étape 1: Aller sur Vercel
1. Ouvrez [vercel.com](https://vercel.com)
2. Connectez-vous
3. Cliquez sur votre projet **juristdz**
4. Cliquez sur **Settings**
5. Cliquez sur **Environment Variables**

### Étape 2: Ajouter Ces 2 Variables CRITIQUES

#### Variable 1
```
Name: VITE_SUPABASE_URL
Value: https://fcteljnmcdelbratudnc.supabase.co
Environments: ☑ Production ☑ Preview ☑ Development
```
Cliquez **Save**

#### Variable 2
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdGVsam5tY2RlbGJyYXR1ZG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTkzMDQsImV4cCI6MjA4NTE5NTMwNH0.jbWM24_1ernpGVHS7i32Jx0W9K7yx8WdCLqq42tzwOo
Environments: ☑ Production ☑ Preview ☑ Development
```
Cliquez **Save**

### Étape 3: Redéployer

#### Option A: Via Vercel Dashboard
1. Allez dans **Deployments**
2. Cliquez sur les 3 points (•••) du dernier déploiement
3. Cliquez **Redeploy**
4. Confirmez

#### Option B: Via Git (Plus Simple)
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

---

## ⏱️ Temps d'Attente
- Ajout des variables: 2 minutes
- Redéploiement: 2-3 minutes
- **Total: ~5 minutes**

---

## ✅ Vérification

Après 5 minutes:
1. Ouvrez votre site en production
2. Essayez de vous connecter
3. Ça devrait fonctionner! ✨

---

## 🆘 Si Ça Ne Marche Toujours Pas

1. Vérifiez que les variables sont bien ajoutées (Settings > Environment Variables)
2. Vérifiez que "Production" est coché pour chaque variable
3. Attendez 5 minutes après le redéploiement
4. Videz le cache du navigateur (Ctrl+Shift+Delete)
5. Essayez en mode incognito

---

## 📚 Documentation Complète

Pour plus de détails, consultez:
- `CONFIGURATION_VERCEL_URGENT.md` - Guide complet
- `verifier-env-vercel.cjs` - Script de vérification

---

**C'est tout! Votre application devrait fonctionner après ces 3 étapes.**

🎯 **L'erreur vient du fait que Vercel n'a pas accès aux variables d'environnement locales (.env.local). Vous devez les configurer manuellement sur Vercel.**
