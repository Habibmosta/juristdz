# 🗄️ Guide de Migration Base de Données Supabase

**Date:** 5 février 2026  
**Système:** JuristDZ - Document Management System  
**Objectif:** Configurer la base de données Supabase pour le système de gestion documentaire

---

## 📋 Vue d'Ensemble

Vous avez **14 scripts SQL** dans le dossier `database/`. Ce guide vous explique dans quel ordre les exécuter et pourquoi.

---

## ✅ Prérequis

1. **Compte Supabase** - Vous l'avez déjà ✅
2. **Projet Supabase** - https://fcteljnmcdelbratudnc.supabase.co ✅
3. **Accès au SQL Editor** - Dashboard Supabase

---

## 🎯 Stratégie de Migration

### Option 1: Migration Complète (RECOMMANDÉ)
Utiliser le script tout-en-un qui contient tout.

### Option 2: Migration Progressive
Exécuter les scripts un par un pour plus de contrôle.

---

## 🚀 Option 1: Migration Complète (Rapide)

### Étape 1: Aller sur Supabase

1. Ouvrez https://supabase.com
2. Connectez-vous
3. Sélectionnez votre projet
4. Allez dans **SQL Editor** (icône de base de données dans le menu)

### Étape 2: Exécuter le Script Principal

Cliquez sur **"New Query"** et exécutez dans cet ordre :

#### 1️⃣ Schema de Base (OBLIGATOIRE)

**Fichier:** `database/document-management-complete-schema.sql`

Ce script crée :
- ✅ Toutes les tables principales
- ✅ Tables de documents et dossiers
- ✅ Tables de versioning
- ✅ Tables de workflows
- ✅ Tables de templates
- ✅ Tables de permissions
- ✅ Tables d'audit

**Comment faire :**
1. Ouvrez le fichier `database/document-management-complete-schema.sql`
2. Copiez tout le contenu
3. Collez dans le SQL Editor de Supabase
4. Cliquez sur **"Run"**
5. Attendez la confirmation ✅

#### 2️⃣ Politiques RLS (OBLIGATOIRE)

**Fichier:** `database/simple-rls-policies.sql`

Ce script configure :
- ✅ Row Level Security (RLS)
- ✅ Politiques d'accès
- ✅ Sécurité des données

**Comment faire :**
1. Ouvrez le fichier `database/simple-rls-policies.sql`
2. Copiez tout le contenu
3. Collez dans un nouveau query
4. Cliquez sur **"Run"**
5. Attendez la confirmation ✅

#### 3️⃣ Workflows Enhancement (OPTIONNEL)

**Fichier:** `database/workflow-management-enhancement.sql`

Ce script ajoute :
- ✅ Améliorations des workflows
- ✅ Fonctionnalités avancées

**Comment faire :**
1. Ouvrez le fichier `database/workflow-management-enhancement.sql`
2. Copiez tout le contenu
3. Collez dans un nouveau query
4. Cliquez sur **"Run"**

---

## 🔧 Option 2: Migration Progressive (Détaillée)

Si vous préférez plus de contrôle, exécutez dans cet ordre :

### Phase 1: Infrastructure de Base

#### Script 1: Schema Principal
```sql
-- Fichier: database/supabase-schema.sql
-- Crée la structure de base
```

#### Script 2: Multi-User Support
```sql
-- Fichier: database/multi-user-schema.sql
-- Ajoute le support multi-utilisateurs
```

### Phase 2: Gestion Documentaire

#### Script 3: Document Management
```sql
-- Fichier: database/document-management-schema.sql
-- Tables pour la gestion des documents
```

#### Script 4: Document Management Complet
```sql
-- Fichier: database/document-management-complete-schema.sql
-- Version complète avec toutes les fonctionnalités
```

### Phase 3: Templates et Workflows

#### Script 5: Templates
```sql
-- Fichier: database/template-management-schema.sql
-- Gestion des templates
```

#### Script 6: Custom Templates
```sql
-- Fichier: database/custom-template-schema.sql
-- Templates personnalisés
```

#### Script 7: Workflow Enhancement
```sql
-- Fichier: database/workflow-management-enhancement.sql
-- Améliorations des workflows
```

### Phase 4: Sécurité

#### Script 8: RLS Policies
```sql
-- Fichier: database/simple-rls-policies.sql
-- Politiques de sécurité
```

#### Script 9: Fix RLS (si nécessaire)
```sql
-- Fichier: database/fix-rls-policies.sql
-- Corrections des politiques
```

---

## 📦 Configuration du Storage

### Étape 1: Créer les Buckets

Dans Supabase Dashboard > **Storage** :

#### Bucket 1: documents
```sql
-- Créer le bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);
```

**Configuration :**
- Public: ❌ Non
- File size limit: 50 MB
- Allowed MIME types: 
  - application/pdf
  - application/msword
  - application/vnd.openxmlformats-officedocument.wordprocessingml.document
  - image/jpeg
  - image/png
  - text/plain

#### Bucket 2: templates
```sql
-- Créer le bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', false);
```

### Étape 2: Politiques de Storage

```sql
-- Politique de lecture pour documents
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Politique d'upload pour documents
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Politique de suppression pour documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = owner);

-- Même chose pour templates
CREATE POLICY "Authenticated users can read templates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'templates');

CREATE POLICY "Authenticated users can upload templates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'templates');
```

---

## ✅ Vérification Post-Migration

### Vérifier les Tables

Dans SQL Editor, exécutez :

```sql
-- Lister toutes les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Tables attendues :**
- ✅ documents
- ✅ folders
- ✅ document_versions
- ✅ document_workflows
- ✅ workflow_steps
- ✅ workflow_step_actions
- ✅ workflow_audit_trail
- ✅ templates
- ✅ template_variables
- ✅ document_permissions
- ✅ share_links
- ✅ document_comments
- ✅ audit_trail
- ✅ signature_workflows
- ✅ digital_signatures

### Vérifier les Politiques RLS

```sql
-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Toutes les tables sensibles doivent avoir `rowsecurity = true`.

### Vérifier les Buckets

Dans Dashboard > **Storage**, vous devriez voir :
- ✅ documents
- ✅ templates

---

## 🔄 Scripts de Maintenance

### Script de Backup

**Fichier:** `database/migration-backup.sql`

Utilisez ce script pour sauvegarder vos données avant une migration.

### Script de Migration SaaS

**Fichier:** `database/migration-to-saas.sql`

Pour migrer vers une architecture SaaS multi-tenant.

### Désactiver RLS Temporairement

**Fichier:** `database/disable-rls-temporarily.sql`

⚠️ **ATTENTION:** À utiliser uniquement pour le debug !

---

## 🆘 Dépannage

### Erreur: "relation already exists"

**Solution:** La table existe déjà. Vous pouvez :
1. Ignorer l'erreur (pas grave)
2. Ou supprimer la table d'abord :
```sql
DROP TABLE IF EXISTS nom_de_la_table CASCADE;
```

### Erreur: "permission denied"

**Solution:** Vérifiez que vous êtes connecté en tant qu'admin du projet.

### Erreur: "syntax error"

**Solution:** 
1. Vérifiez que vous avez copié tout le script
2. Exécutez les scripts un par un
3. Vérifiez les logs d'erreur

### Tables manquantes

**Solution:** Exécutez le script `document-management-complete-schema.sql` qui contient tout.

---

## 📋 Checklist de Migration

### Avant la Migration
- [ ] Backup de la base de données actuelle (si existante)
- [ ] Accès au SQL Editor Supabase
- [ ] Scripts SQL téléchargés

### Pendant la Migration
- [ ] Script principal exécuté (`document-management-complete-schema.sql`)
- [ ] Politiques RLS exécutées (`simple-rls-policies.sql`)
- [ ] Workflow enhancement exécuté (optionnel)
- [ ] Buckets de storage créés
- [ ] Politiques de storage configurées

### Après la Migration
- [ ] Tables vérifiées
- [ ] RLS vérifié
- [ ] Buckets vérifiés
- [ ] Test de connexion depuis l'app
- [ ] Test d'upload de fichier
- [ ] Test de création de workflow

---

## 🎯 Ordre Recommandé (Résumé)

### Migration Minimale (Production Ready)

```
1. document-management-complete-schema.sql  ← OBLIGATOIRE
2. simple-rls-policies.sql                  ← OBLIGATOIRE
3. Créer les buckets de storage             ← OBLIGATOIRE
4. Configurer les politiques de storage     ← OBLIGATOIRE
```

### Migration Complète (Toutes les Fonctionnalités)

```
1. document-management-complete-schema.sql
2. simple-rls-policies.sql
3. workflow-management-enhancement.sql
4. template-management-schema.sql
5. custom-template-schema.sql
6. Créer les buckets de storage
7. Configurer les politiques de storage
```

---

## 💡 Conseils

### Pour le Développement
- Utilisez `disable-rls-temporarily.sql` pour faciliter les tests
- Réactivez RLS avant le déploiement !

### Pour la Production
- Toujours activer RLS
- Faire un backup avant toute migration
- Tester sur un projet de staging d'abord

### Pour le Debug
- Consultez les logs dans Dashboard > **Logs**
- Utilisez `SELECT * FROM table_name LIMIT 10;` pour vérifier les données

---

## 📞 Support

### Logs Supabase
Dashboard > **Logs** > **Postgres Logs**

### Documentation
- https://supabase.com/docs/guides/database
- https://supabase.com/docs/guides/storage

---

## ✅ Validation Finale

Une fois la migration terminée, testez :

```sql
-- Test 1: Créer un document
INSERT INTO documents (id, name, original_name, mime_type, size, checksum, encryption_key, storage_path, created_by, case_id, current_version_id)
VALUES (gen_random_uuid(), 'Test Document', 'test.pdf', 'application/pdf', 1024, 'checksum123', 'key123', '/test/path', auth.uid(), gen_random_uuid(), gen_random_uuid());

-- Test 2: Créer un dossier
INSERT INTO folders (id, name, parent_id, case_id, created_by)
VALUES (gen_random_uuid(), 'Test Folder', NULL, gen_random_uuid(), auth.uid());

-- Test 3: Vérifier les workflows
SELECT COUNT(*) FROM document_workflows;
```

Si tout fonctionne, vous êtes prêt ! ✅

---

**Document créé le:** 5 février 2026  
**Dernière mise à jour:** 5 février 2026  
**Version:** 1.0.0  
**Statut:** ✅ PRÊT POUR LA MIGRATION
