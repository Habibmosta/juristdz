# 🏢 Architecture SaaS - Système d'Administration

## 🎯 OBJECTIF

Créer un système SaaS complet où:
- Un **administrateur** gère la plateforme
- L'admin crée et gère les comptes utilisateurs
- L'admin définit les quotas selon les abonnements
- L'admin active/désactive les comptes selon les paiements

---

## 🔐 SYSTÈME D'AUTHENTIFICATION

### 1. Compte Administrateur (Super Admin)

**Email**: admin@juristdz.com
**Mot de passe**: (défini lors de la première configuration)
**Rôle**: ADMIN
**Permissions**:
- ✅ Créer des comptes utilisateurs
- ✅ Modifier les quotas
- ✅ Activer/Désactiver des comptes
- ✅ Voir tous les utilisateurs
- ✅ Voir les statistiques globales
- ✅ Gérer les abonnements

### 2. Comptes Utilisateurs (Avocats, Notaires, Huissiers)

**Création**: Par l'administrateur uniquement
**Accès**: Email + Mot de passe (envoyés par l'admin)
**Rôle**: AVOCAT / NOTAIRE / HUISSIER / etc.
**Permissions**:
- ✅ Créer des dossiers
- ✅ Générer des documents (selon quota)
- ✅ Voir uniquement ses propres données
- ❌ Voir les autres utilisateurs
- ❌ Modifier les quotas

---

## 📊 SYSTÈME DE QUOTAS

### Plans d'Abonnement

#### Plan GRATUIT (Essai)
- **Prix**: 0 DA/mois
- **Quotas**:
  * 5 documents/mois
  * 3 dossiers maximum
  * Support par email
- **Durée**: 30 jours
- **Statut**: Actif automatiquement

#### Plan PRO
- **Prix**: 
  * Avocats: 10 000 DA/mois
  * Notaires: 15 000 DA/mois
  * Huissiers: 8 000 DA/mois
- **Quotas**:
  * Documents illimités
  * Dossiers illimités
  * Traduction automatique
  * Support prioritaire
- **Durée**: Mensuel
- **Statut**: Activé par l'admin après paiement

#### Plan CABINET
- **Prix**:
  * Avocats: 25 000 DA/mois (5 utilisateurs)
  * Notaires: 35 000 DA/mois (5 utilisateurs)
  * Huissiers: 20 000 DA/mois (3 utilisateurs)
- **Quotas**:
  * Tout du Pro
  * Multi-utilisateurs
  * Gestion centralisée
  * Formation personnalisée
- **Durée**: Mensuel
- **Statut**: Activé par l'admin après paiement

#### Plan ENTERPRISE
- **Prix**: Sur devis
- **Quotas**: Personnalisés
- **Durée**: Annuel
- **Statut**: Activé par l'admin après contrat

---

## 🔄 WORKFLOW SAAS

### Scénario 1: Nouvel Utilisateur (Essai Gratuit)

1. **Prospect contacte JuristDZ**
   - Par email, téléphone, ou formulaire web
   - Demande un essai gratuit

2. **Admin crée le compte**
   - Se connecte à l'interface admin
   - Clique sur "Créer un utilisateur"
   - Remplit le formulaire:
     * Email: maitre.benali@barreau.dz
     * Prénom: Ahmed
     * Nom: Benali
     * Profession: Avocat
     * Plan: GRATUIT
     * Quotas: 5 documents, 3 dossiers
     * Durée: 30 jours
   - Génère un mot de passe temporaire
   - Envoie les identifiants par email

3. **Utilisateur se connecte**
   - Reçoit l'email avec identifiants
   - Se connecte sur juristdz.com
   - Change son mot de passe
   - Commence à utiliser (5 documents max)

4. **Fin de l'essai (30 jours)**
   - Système envoie un email automatique
   - "Votre essai expire dans 3 jours"
   - Propose de passer au plan PRO

### Scénario 2: Passage au Plan PRO

1. **Utilisateur veut passer au PRO**
   - Contacte JuristDZ
   - Demande un devis
   - Reçoit les coordonnées bancaires

2. **Utilisateur effectue le paiement**
   - Virement bancaire: 10 000 DA
   - Envoie la preuve de paiement

3. **Admin valide le paiement**
   - Vérifie le virement
   - Se connecte à l'interface admin
   - Trouve l'utilisateur
   - Clique sur "Modifier l'abonnement"
   - Change:
     * Plan: GRATUIT → PRO
     * Quotas: 5 documents → Illimité
     * Durée: 30 jours → 1 mois
     * Date d'expiration: 2 avril 2026
   - Enregistre

4. **Utilisateur est notifié**
   - Reçoit un email: "Votre compte est maintenant PRO!"
   - Peut générer des documents illimités

5. **Renouvellement mensuel**
   - 5 jours avant expiration: Email automatique
   - "Votre abonnement expire le 2 avril"
   - Utilisateur paie
   - Admin prolonge l'abonnement

### Scénario 3: Non-paiement

1. **Abonnement expire**
   - Date d'expiration atteinte
   - Système désactive automatiquement le compte

2. **Utilisateur ne peut plus se connecter**
   - Message: "Votre abonnement a expiré"
   - "Contactez-nous pour renouveler"

3. **Admin réactive après paiement**
   - Utilisateur paie
   - Admin réactive le compte
   - Utilisateur peut se reconnecter

---

## 🖥️ INTERFACE ADMIN

### Dashboard Admin

```
┌─────────────────────────────────────────────────────────┐
│  📊 TABLEAU DE BORD ADMINISTRATEUR                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📈 STATISTIQUES                                        │
│  ┌──────────────┬──────────────┬──────────────┐       │
│  │ Utilisateurs │  Documents   │   Revenus    │       │
│  │     45       │    1,234     │  450,000 DA  │       │
│  └──────────────┴──────────────┴──────────────┘       │
│                                                         │
│  👥 UTILISATEURS PAR PLAN                               │
│  • Gratuit: 15 utilisateurs                            │
│  • Pro: 25 utilisateurs                                │
│  • Cabinet: 5 utilisateurs                             │
│                                                         │
│  ⚠️ ACTIONS REQUISES                                    │
│  • 3 abonnements expirent dans 5 jours                 │
│  • 2 nouveaux paiements à valider                      │
│                                                         │
│  🔍 RECHERCHER UN UTILISATEUR                           │
│  [Recherche par email, nom...]                         │
│                                                         │
│  ➕ CRÉER UN NOUVEL UTILISATEUR                         │
│  [Bouton]                                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Liste des Utilisateurs

```
┌─────────────────────────────────────────────────────────┐
│  👥 GESTION DES UTILISATEURS                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Filtres: [Tous] [Actifs] [Expirés] [Gratuit] [Pro]   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Ahmed Benali (ahmed.benali@barreau.dz)           │ │
│  │ Avocat • Plan PRO • Expire: 15/04/2026           │ │
│  │ Documents: 45/∞ • Actif ✅                        │ │
│  │ [Modifier] [Désactiver] [Voir détails]           │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Sarah Khelifi (sarah.khelifi@barreau.dz)         │ │
│  │ Avocate • Plan GRATUIT • Expire: 05/03/2026      │ │
│  │ Documents: 5/5 • Actif ✅                         │ │
│  │ [Modifier] [Passer au PRO] [Voir détails]        │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Mohamed Ziani (mohamed.ziani@notaire.dz)         │ │
│  │ Notaire • Plan PRO • Expiré ⚠️                    │ │
│  │ Documents: 120/∞ • Inactif ❌                     │ │
│  │ [Renouveler] [Contacter] [Voir détails]          │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Créer un Utilisateur

```
┌─────────────────────────────────────────────────────────┐
│  ➕ CRÉER UN NOUVEL UTILISATEUR                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  INFORMATIONS PERSONNELLES                             │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Prénom: [Ahmed                              ]  │  │
│  │ Nom:    [Benali                             ]  │  │
│  │ Email:  [ahmed.benali@barreau.dz            ]  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  PROFESSION                                            │
│  ┌─────────────────────────────────────────────────┐  │
│  │ [Avocat ▼]                                      │  │
│  │ N° Inscription: [A/12345/2024               ]  │  │
│  │ Barreau/Chambre: [Barreau d'Alger          ]  │  │
│  │ Cabinet: [Cabinet Benali & Associés         ]  │  │
│  │ Téléphone: [+213 555 123 456                ]  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ABONNEMENT                                            │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Plan: [Gratuit (Essai) ▼]                      │  │
│  │ Durée: [30 jours ▼]                            │  │
│  │ Quotas:                                        │  │
│  │   • Documents: [5] par mois                    │  │
│  │   • Dossiers: [3] maximum                      │  │
│  │ Date d'expiration: [02/04/2026]                │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  MOT DE PASSE                                          │
│  ┌─────────────────────────────────────────────────┐  │
│  │ [Générer automatiquement] ✅                    │  │
│  │ Mot de passe: JDZ-2024-BENALI-7X9K             │  │
│  │ [Copier] [Envoyer par email]                   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Créer le compte] [Annuler]                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📧 EMAILS AUTOMATIQUES

### Email 1: Bienvenue (Compte créé)

```
Objet: Bienvenue sur JuristDZ - Vos identifiants

Bonjour Maître Benali,

Votre compte JuristDZ a été créé avec succès!

VOS IDENTIFIANTS:
Email: ahmed.benali@barreau.dz
Mot de passe: JDZ-2024-BENALI-7X9K

VOTRE ABONNEMENT:
Plan: Gratuit (Essai)
Durée: 30 jours
Expire le: 2 avril 2026
Quotas: 5 documents/mois

PREMIÈRE CONNEXION:
1. Aller sur www.juristdz.com
2. Se connecter avec vos identifiants
3. Changer votre mot de passe
4. Commencer à utiliser JuristDZ!

Besoin d'aide? Contactez-nous:
📧 support@juristdz.com
📱 +213 XX XX XX XX

Cordialement,
L'équipe JuristDZ
```

### Email 2: Expiration proche (5 jours avant)

```
Objet: Votre abonnement JuristDZ expire dans 5 jours

Bonjour Maître Benali,

Votre abonnement JuristDZ expire le 2 avril 2026 (dans 5 jours).

POUR RENOUVELER:
1. Effectuer un virement de 10 000 DA
2. Envoyer la preuve de paiement à paiement@juristdz.com
3. Votre compte sera renouvelé sous 24h

COORDONNÉES BANCAIRES:
Banque: BNA
RIB: XXXX XXXX XXXX XXXX
Bénéficiaire: JuristDZ SARL

Questions? Contactez-nous:
📧 support@juristdz.com
📱 +213 XX XX XX XX

Cordialement,
L'équipe JuristDZ
```

### Email 3: Compte expiré

```
Objet: Votre abonnement JuristDZ a expiré

Bonjour Maître Benali,

Votre abonnement JuristDZ a expiré le 2 avril 2026.

Votre compte est maintenant désactivé.

POUR RÉACTIVER:
1. Effectuer un virement de 10 000 DA
2. Envoyer la preuve de paiement
3. Nous réactiverons votre compte sous 24h

Vos données sont conservées pendant 90 jours.

Cordialement,
L'équipe JuristDZ
```

---

## 🔧 IMPLÉMENTATION TECHNIQUE

### Tables Supabase (Ajouts nécessaires)

```sql
-- Ajouter colonne admin dans profiles
ALTER TABLE public.profiles
ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Ajouter colonnes de quota dans subscriptions
ALTER TABLE public.subscriptions
ADD COLUMN documents_used INTEGER DEFAULT 0,
ADD COLUMN documents_limit INTEGER DEFAULT 5,
ADD COLUMN cases_limit INTEGER DEFAULT 3,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Fonction pour vérifier les quotas
CREATE OR REPLACE FUNCTION check_document_quota(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_record RECORD;
BEGIN
  SELECT * INTO subscription_record
  FROM public.subscriptions
  WHERE user_id = user_id_param
  AND status = 'active'
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF subscription_record.documents_limit = -1 THEN
    -- Illimité
    RETURN true;
  END IF;
  
  RETURN subscription_record.documents_used < subscription_record.documents_limit;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter l'utilisation
CREATE OR REPLACE FUNCTION increment_document_usage(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.subscriptions
  SET documents_used = documents_used + 1
  WHERE user_id = user_id_param
  AND status = 'active';
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 RÉSUMÉ

### Pour l'Administrateur:
1. Se connecter avec admin@juristdz.com
2. Créer des comptes utilisateurs
3. Définir les quotas selon les paiements
4. Activer/Désactiver les comptes
5. Voir les statistiques

### Pour les Utilisateurs:
1. Recevoir les identifiants par email
2. Se connecter sur juristdz.com
3. Utiliser selon les quotas
4. Payer pour renouveler
5. Contacter l'admin si problème

---

**Date**: 2 mars 2026
**Statut**: Architecture définie
**Prochaine étape**: Implémenter l'interface admin
