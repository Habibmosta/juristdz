# 📦 Configuration Supabase Storage pour Documents

## 🎯 Objectif
Créer un bucket de stockage sécurisé pour les documents des dossiers juridiques.

---

## 📋 Étapes de Configuration

### 1. Créer le Bucket

1. Ouvrir **Supabase Dashboard**: https://app.supabase.com
2. Sélectionner votre projet: **fcteljnmcdelbratudnc**
3. Aller dans **Storage** (menu de gauche)
4. Cliquer sur **New bucket**

**Configuration du bucket**:
```
Nom: case-documents
Public: ❌ NON (bucket privé)
File size limit: 104857600 (100 MB)
Allowed MIME types: (laisser vide pour tout autoriser, ou spécifier)
```

### 2. Configurer les Policies de Sécurité

Une fois le bucket créé, aller dans **Policies** et créer les policies suivantes:

#### Policy 1: Upload de fichiers
```sql
-- Nom: Users can upload their own documents
-- Operation: INSERT
-- Policy definition:
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'case-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2: Lecture de fichiers
```sql
-- Nom: Users can view their own documents
-- Operation: SELECT
-- Policy definition:
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 3: Mise à jour de fichiers
```sql
-- Nom: Users can update their own documents
-- Operation: UPDATE
-- Policy definition:
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'case-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'case-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 4: Suppression de fichiers
```sql
-- Nom: Users can delete their own documents
-- Operation: DELETE
-- Policy definition:
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'case-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 📁 Structure des Chemins

Les fichiers seront organisés ainsi:
```
case-documents/
  └── {user_id}/
      └── {case_id}/
          ├── document1.pdf
          ├── document2.docx
          └── photo_piece.jpg
```

**Exemple**:
```
case-documents/fa4ef014-f3e2-496f-b341-ea427e1d2bf2/123e4567-e89b-12d3-a456-426614174000/contrat_bail.pdf
```

---

## 🔒 Sécurité

### Isolation des Données
- Chaque utilisateur ne peut accéder qu'à ses propres fichiers
- Le `user_id` est dans le chemin du fichier
- Les policies RLS vérifient que `(storage.foldername(name))[1] = auth.uid()::text`

### Limites
- **Taille max par fichier**: 100 MB
- **Types autorisés**: Tous (ou spécifier: PDF, Word, Images)
- **Bucket privé**: Pas d'accès public

---

## 📊 Quotas par Plan

### Plan GRATUIT
- **Stockage total**: 50 MB
- **Documents max**: 5
- **Taille par fichier**: 10 MB

### Plan PRO
- **Stockage total**: 10 GB
- **Documents max**: Illimité
- **Taille par fichier**: 50 MB

### Plan CABINET
- **Stockage total**: 100 GB
- **Documents max**: Illimité
- **Taille par fichier**: 100 MB

---

## ✅ Vérification

Après configuration, vérifier:

1. **Bucket créé**:
   ```sql
   SELECT * FROM storage.buckets WHERE name = 'case-documents';
   ```

2. **Policies actives**:
   ```sql
   SELECT * FROM storage.policies WHERE bucket_id = 'case-documents';
   ```

3. **Test d'upload** (via l'application):
   - Créer un dossier
   - Uploader un fichier PDF
   - Vérifier qu'il apparaît dans Storage

---

## 🚨 Troubleshooting

### Erreur: "new row violates row-level security policy"
- Vérifier que les policies sont bien créées
- Vérifier que l'utilisateur est authentifié
- Vérifier que le chemin contient le bon `user_id`

### Erreur: "File size exceeds limit"
- Vérifier la limite du bucket (100 MB)
- Vérifier la limite du plan utilisateur

### Erreur: "Bucket not found"
- Vérifier que le bucket `case-documents` existe
- Vérifier l'orthographe exacte

---

## 📝 Notes Importantes

1. **Backup**: Supabase fait des backups automatiques, mais considérer un backup externe pour les documents critiques
2. **Migration**: Si changement de structure, prévoir un script de migration
3. **Nettoyage**: Prévoir un job pour supprimer les documents des dossiers archivés après X mois
4. **Monitoring**: Surveiller l'utilisation du stockage par utilisateur

---

**Date**: 03/03/2026
**Statut**: ⏳ À configurer avant de démarrer l'implémentation
**Priorité**: 🔴 CRITIQUE
