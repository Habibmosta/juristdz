# ⚡ Migration Rapide Supabase - 5 Minutes

**Pour les pressés !** Ce guide vous permet de configurer la base de données en 5 minutes.

---

## 🎯 3 Étapes Seulement

### Étape 1: Ouvrir Supabase SQL Editor

1. Allez sur https://supabase.com
2. Connectez-vous
3. Sélectionnez votre projet
4. Cliquez sur **SQL Editor** (icône 🗄️ dans le menu)

---

### Étape 2: Exécuter le Script Principal

Cliquez sur **"New Query"** et copiez-collez le contenu du fichier :

📁 **`database/document-management-complete-schema.sql`**

Puis cliquez sur **"Run"** ▶️

**Temps:** ~30 secondes

---

### Étape 3: Exécuter les Politiques de Sécurité

Créez une **nouvelle query** et copiez-collez le contenu du fichier :

📁 **`database/simple-rls-policies.sql`**

Puis cliquez sur **"Run"** ▶️

**Temps:** ~10 secondes

---

### Étape 4: Créer les Buckets de Storage

Dans Supabase Dashboard, allez dans **Storage** et :

#### Bucket 1: documents
1. Cliquez sur **"New bucket"**
2. Name: `documents`
3. Public: ❌ **Non**
4. Cliquez sur **"Create bucket"**

#### Bucket 2: templates
1. Cliquez sur **"New bucket"**
2. Name: `templates`
3. Public: ❌ **Non**
4. Cliquez sur **"Create bucket"**

---

### Étape 5: Configurer les Politiques de Storage

Retournez dans **SQL Editor** et exécutez :

```sql
-- Politiques pour le bucket documents
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = owner);

-- Politiques pour le bucket templates
CREATE POLICY "Authenticated users can read templates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'templates');

CREATE POLICY "Authenticated users can upload templates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'templates');
```

Cliquez sur **"Run"** ▶️

---

## ✅ Vérification Rapide

Exécutez cette requête pour vérifier que tout est OK :

```sql
-- Compter les tables créées
SELECT COUNT(*) as nombre_de_tables
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Résultat attendu:** ~15-20 tables

---

## 🎉 C'est Tout !

Votre base de données est prête ! Vous pouvez maintenant :

1. ✅ Déployer votre application sur Vercel
2. ✅ Tester l'upload de documents
3. ✅ Créer des workflows
4. ✅ Inviter des testeurs

---

## 🆘 Problème ?

### Erreur "relation already exists"
➡️ **Normal !** Ignorez, la table existe déjà.

### Erreur "permission denied"
➡️ Vérifiez que vous êtes admin du projet Supabase.

### Buckets ne se créent pas
➡️ Essayez via SQL :
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', false);
```

---

## 📋 Checklist Ultra-Rapide

- [ ] Script principal exécuté
- [ ] Politiques RLS exécutées
- [ ] Bucket "documents" créé
- [ ] Bucket "templates" créé
- [ ] Politiques de storage configurées
- [ ] Vérification OK

---

**Temps total:** 5 minutes ⏱️  
**Difficulté:** Facile 😊  
**Prêt pour la production:** ✅

---

## 🚀 Prochaine Étape

Maintenant que la base de données est prête, déployez sur Vercel !

Consultez **ETAPES_VERCEL.md** pour le déploiement.
