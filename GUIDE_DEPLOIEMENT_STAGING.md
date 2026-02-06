# 🚀 Guide de Déploiement - Environnement Staging

**Date:** 5 février 2026  
**Système:** JuristDZ - Document Management System  
**Objectif:** Déployer en staging pour tests utilisateurs

---

## ✅ Prérequis (Déjà Configurés)

Vous avez déjà :
- ✅ Supabase configuré et opérationnel
- ✅ Clés API (Gemini, Groq) configurées
- ✅ Code source complet et testé
- ✅ Base de données prête

---

## 📋 Étape 1: Build et Test Local

### 1.1 Installer les Dépendances

```powershell
npm install --legacy-peer-deps
```

### 1.2 Build de Production

```powershell
npm run build
```

### 1.3 Tester Localement

```powershell
npm run preview
```

Ouvrez http://localhost:4173 et testez les fonctionnalités principales.

---

## 📋 Étape 2: Déploiement sur Vercel

### 2.1 Installer Vercel CLI

```powershell
npm install -g vercel
```

### 2.2 Se Connecter

```powershell
vercel login
```

### 2.3 Déployer

```powershell
vercel
```

Suivez les instructions :
- Project name: `juristdz-staging`
- Directory: `./`
- Override settings: `No`

### 2.4 Configurer les Variables d'Environnement

Dans Vercel Dashboard > Settings > Environment Variables, ajoutez :

```
VITE_SUPABASE_URL=https://fcteljnmcdelbratudnc.supabase.co
VITE_SUPABASE_ANON_KEY=[votre clé]
VITE_GEMINI_API_KEY=[votre clé]
VITE_GROQ_API_KEY=[votre clé]
```

### 2.5 Redéployer

```powershell
vercel --prod
```

---

## 📋 Étape 3: Configuration Supabase

### 3.1 Mettre à Jour les URLs

Dans Supabase Dashboard > Authentication > URL Configuration :

- Site URL: `https://juristdz-staging.vercel.app`
- Redirect URLs: `https://juristdz-staging.vercel.app/**`

### 3.2 Configurer CORS

Dans Settings > API, ajouter :
```
https://juristdz-staging.vercel.app
```

---

## 📋 Étape 4: Tests Utilisateurs

### 4.1 Créer des Comptes de Test

Créez 3-5 utilisateurs avec différents rôles dans Supabase Dashboard.

### 4.2 Scénarios de Test

1. Upload de documents
2. Création de workflows
3. Utilisation de templates
4. Collaboration et partage
5. Recherche et filtrage

### 4.3 Collecter les Retours

Créez un formulaire Google Form pour les feedbacks.

---

## ✅ Checklist

- [ ] Build réussi
- [ ] Déployé sur Vercel
- [ ] Variables d'environnement configurées
- [ ] Supabase configuré
- [ ] Comptes de test créés
- [ ] Tests fonctionnels OK
- [ ] Testeurs invités

---

**Prêt à déployer !** 🚀
