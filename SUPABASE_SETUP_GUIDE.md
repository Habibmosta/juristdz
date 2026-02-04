# 🗄️ Guide d'Installation Supabase - JuristDZ

## 📋 **Prérequis**

1. **Compte Supabase** : Créez un compte sur [supabase.com](https://supabase.com)
2. **Projet existant** : Vous avez déjà un projet Supabase configuré

## 🚀 **Étapes d'Installation**

### **Étape 1 : Accéder à votre Dashboard Supabase**

1. Connectez-vous à [supabase.com](https://supabase.com)
2. Sélectionnez votre projet : `fcteljnmcdelbratudnc`
3. Allez dans l'onglet **"SQL Editor"**

### **Étape 2 : Créer les Tables**

1. Dans le **SQL Editor**, copiez et exécutez le contenu du fichier `database/supabase-schema.sql`
2. Cliquez sur **"Run"** pour exécuter le script
3. Vérifiez que les tables ont été créées dans l'onglet **"Table Editor"**

### **Étape 3 : Vérifier la Configuration**

Vos variables d'environnement sont déjà configurées dans `.env.local` :

```env
VITE_SUPABASE_URL=https://fcteljnmcdelbratudnc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Étape 4 : Tester la Connexion**

1. Redémarrez votre application : `npm run dev`
2. Ouvrez la console du navigateur
3. Vous devriez voir : `✅ Using Supabase for data persistence`
4. Créez un nouveau dossier via l'interface
5. Vérifiez dans Supabase → Table Editor → `cases` que le dossier est sauvegardé

## 📊 **Structure de la Base de Données**

### **Table `cases`**

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique (auto-généré) |
| `title` | VARCHAR(500) | Titre du dossier |
| `client_name` | VARCHAR(200) | Nom du client |
| `client_phone` | VARCHAR(20) | Téléphone du client |
| `client_email` | VARCHAR(100) | Email du client |
| `client_address` | TEXT | Adresse du client |
| `description` | TEXT | Description du dossier |
| `case_type` | VARCHAR(100) | Type de dossier |
| `priority` | VARCHAR(20) | Priorité (low, medium, high, urgent) |
| `estimated_value` | DECIMAL(15,2) | Valeur estimée en DA |
| `deadline` | DATE | Date limite |
| `status` | VARCHAR(20) | Statut (active, archived) |
| `notes` | TEXT | Notes additionnelles |
| `assigned_lawyer` | VARCHAR(200) | Avocat assigné |
| `tags` | TEXT[] | Tags (array) |
| `documents` | TEXT[] | Documents (array) |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de mise à jour |
| `user_id` | UUID | ID de l'utilisateur |

### **Vue `case_statistics`**

Fournit des statistiques automatiques :
- Nombre total de dossiers
- Dossiers actifs/archivés
- Dossiers urgents/haute priorité
- Échéances à venir
- Valeur totale/moyenne estimée

## 🔒 **Sécurité (RLS - Row Level Security)**

Les politiques de sécurité sont automatiquement configurées :

- ✅ **Isolation des utilisateurs** : Chaque utilisateur ne voit que ses propres dossiers
- ✅ **Authentification requise** : Seuls les utilisateurs connectés peuvent accéder aux données
- ✅ **CRUD sécurisé** : Permissions appropriées pour créer, lire, modifier, supprimer

## 🔧 **Fonctionnalités Implémentées**

### **✅ Persistance des Données**
- Sauvegarde automatique en base de données
- Synchronisation en temps réel
- Pas de perte de données au rechargement

### **✅ Système Hybride**
- **Supabase disponible** → Utilise la base de données cloud
- **Supabase indisponible** → Fallback vers stockage local
- **Transition transparente** → L'utilisateur ne voit pas la différence

### **✅ Fonctionnalités Avancées**
- Recherche full-text dans les dossiers
- Statistiques automatiques
- Filtrage par priorité, type, statut
- Gestion des échéances
- Export/Import des données

## 🧪 **Test de Fonctionnement**

### **Test 1 : Création de Dossier**
1. Ouvrez l'interface Avocat
2. Cliquez sur "Nouveau Dossier"
3. Remplissez le formulaire
4. Cliquez sur "Créer le Dossier"
5. ✅ Le dossier apparaît immédiatement dans la liste
6. ✅ Vérifiez dans Supabase que le dossier est sauvegardé

### **Test 2 : Persistance**
1. Créez un dossier
2. Rechargez la page (F5)
3. ✅ Le dossier est toujours présent

### **Test 3 : Statistiques**
1. Créez plusieurs dossiers avec différentes priorités
2. ✅ Les statistiques se mettent à jour automatiquement
3. ✅ Les compteurs reflètent les vrais nombres

## 🐛 **Dépannage**

### **Problème : "Supabase not available"**
- Vérifiez votre connexion internet
- Vérifiez les variables d'environnement
- Redémarrez l'application

### **Problème : "Failed to create case"**
- Vérifiez que les tables sont créées
- Vérifiez les politiques RLS
- Consultez les logs Supabase

### **Problème : Données non visibles**
- Vérifiez l'authentification utilisateur
- Les politiques RLS isolent les données par utilisateur
- Chaque utilisateur ne voit que ses propres dossiers

## 📞 **Support**

- **Documentation Supabase** : [docs.supabase.com](https://docs.supabase.com)
- **Dashboard Supabase** : [app.supabase.com](https://app.supabase.com)
- **Logs en temps réel** : Dashboard → Logs

---

## 🎉 **Félicitations !**

Votre système de gestion de dossiers JuristDZ est maintenant connecté à une vraie base de données avec :

- ✅ **Persistance des données**
- ✅ **Sécurité multi-utilisateurs**
- ✅ **Synchronisation temps réel**
- ✅ **Statistiques automatiques**
- ✅ **Recherche avancée**
- ✅ **Système de fallback**

Les dossiers créés via l'interface sont maintenant **définitivement sauvegardés** ! 🚀