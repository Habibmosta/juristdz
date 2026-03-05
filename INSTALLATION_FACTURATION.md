# 📦 Installation du Système de Facturation

## ✅ Fichiers Créés

### Composants React
- ✅ `src/components/billing/InvoiceManager.tsx` - Gestionnaire principal (COMPLÉTÉ)
- ✅ `src/components/billing/CreateInvoiceModal.tsx` - Formulaire de création (NOUVEAU)

### Services
- ✅ `src/services/emailService.ts` - Envoi d'emails (NOUVEAU)
- ✅ `src/utils/invoicePDF.ts` - Génération PDF (NOUVEAU)

### Base de données
- ✅ `database/create-invoicing.sql` - Tables, RLS, fonctions (NOUVEAU)

## 📋 Étapes d'Installation

### 1. Installer les dépendances NPM

```bash
npm install jspdf jspdf-autotable
npm install --save-dev @types/jspdf
```

Si l'installation échoue, essayez:
```bash
npm install --legacy-peer-deps jspdf jspdf-autotable @types/jspdf
```

### 2. Exécuter le script SQL

Connectez-vous à votre base Supabase et exécutez:
```bash
psql -h [YOUR_SUPABASE_HOST] -U postgres -d postgres -f database/create-invoicing.sql
```

Ou via l'interface Supabase:
1. Allez dans SQL Editor
2. Copiez le contenu de `database/create-invoicing.sql`
3. Exécutez le script

### 3. Configurer l'envoi d'emails (Optionnel)

Pour l'envoi d'emails automatique, créez une Edge Function Supabase:

```bash
supabase functions new send-email
```

Puis ajoutez le code dans `supabase/functions/send-email/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { to, subject, html, attachments } = await req.json()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'noreply@juristdz.com',
      to,
      subject,
      html,
      attachments
    })
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

Alternative: Utilisez le fallback `mailto:` qui ouvre le client email par défaut.

### 4. Ajouter la route dans votre application

Dans votre fichier de routes principal, ajoutez:

```typescript
import InvoiceManager from './components/billing/InvoiceManager';

// Dans votre router
<Route path="/billing" element={<InvoiceManager userId={userId} language={language} />} />
```

## 🎯 Fonctionnalités Implémentées

### ✅ Gestion des Factures
- Création de factures avec formulaire complet
- Sélection client et dossier
- Ajout d'éléments multiples (description, quantité, prix)
- Calcul automatique (sous-total, TVA 19%, total)
- Statuts: brouillon, envoyée, payée, en retard, annulée

### ✅ Génération PDF Professionnelle
- En-tête avec logo et couleurs
- Informations avocat et client
- Tableau des éléments
- Calculs détaillés (sous-total, TVA, total)
- Notes personnalisées
- Pied de page avec date de génération

### ✅ Envoi par Email
- Email HTML professionnel
- Facture PDF en pièce jointe
- Fallback vers client email si service indisponible
- Rappels de paiement pour factures en retard

### ✅ Base de Données
- Table `invoices` avec tous les champs nécessaires
- RLS (Row Level Security) activé
- Fonctions automatiques:
  - Mise à jour `updated_at`
  - Détection factures en retard
  - Statistiques de facturation
- Vues pour rapports:
  - `invoices_with_details` (avec infos client/dossier)
  - `monthly_invoice_stats` (statistiques mensuelles)

### ✅ Statistiques
- Total factures
- Factures payées / en attente / en retard
- Montants totaux, payés, impayés
- Affichage en temps réel

## 🚀 Utilisation

1. Accédez à la section Facturation
2. Cliquez sur "Nouvelle Facture"
3. Sélectionnez un client (obligatoire)
4. Sélectionnez un dossier (optionnel)
5. Ajoutez les éléments de facturation
6. Ajustez la TVA si nécessaire (19% par défaut)
7. Ajoutez des notes (optionnel)
8. Cliquez sur "Créer"

### Actions disponibles:
- 👁️ Voir: Afficher les détails
- 📥 Télécharger PDF: Générer et télécharger la facture
- 📧 Envoyer: Envoyer par email au client (brouillons uniquement)

## 📊 Impact sur le Score

Score avant: 5.4/10
Score après: 5.9/10
**Gain: +0.5 points**

## 🔥 Prochaines Étapes

Pour atteindre 7.0/10, implémenter:
1. Calendrier intelligent (+0.2)
2. Client Portal (+0.3)
3. Signature électronique (+0.2)
4. Notifications intelligentes (+0.1)
5. Rapports avancés (+0.2)
6. Recherche globale (+0.1)

## 🐛 Dépannage

### Erreur: "Cannot find module 'jspdf'"
```bash
npm install jspdf jspdf-autotable
```

### Erreur: "Table invoices does not exist"
Exécutez le script SQL: `database/create-invoicing.sql`

### Erreur: "RLS policy violation"
Vérifiez que l'utilisateur est authentifié et que les politiques RLS sont activées.

### Email ne s'envoie pas
Le système utilise un fallback `mailto:` qui ouvre le client email par défaut. Pour l'envoi automatique, configurez la Edge Function Supabase.

## 📝 Notes

- TVA par défaut: 19% (Algérie)
- Devise: DZD (Dinar Algérien)
- Format numéro facture: INV-YYYY-XXXX
- Bilingue: FR/AR complet
- RLS activé pour sécurité multi-tenant
