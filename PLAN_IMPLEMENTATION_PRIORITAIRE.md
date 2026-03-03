# 🚀 Plan d'Implémentation Prioritaire - JuristDZ

## 📋 Vue d'Ensemble

Ce document détaille l'implémentation des **3 fonctionnalités critiques** identifiées dans l'analyse de compétitivité:
1. Gestion des Documents par Dossier
2. Calendrier et Agenda
3. Suivi du Temps et Facturation

**Durée totale estimée**: 8 semaines
**Ressources**: 1 développeur full-stack

---

## 🗂️ FONCTIONNALITÉ 1: Gestion des Documents par Dossier

### Durée: 2 semaines (Sprint 1-2)

### Architecture Technique

#### Base de Données (Supabase)
```sql
-- Table: case_documents
CREATE TABLE case_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Informations du fichier
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL, -- en bytes
  file_type TEXT NOT NULL, -- 'pdf', 'docx', 'image', etc.
  mime_type TEXT NOT NULL,
  
  -- Stockage
  storage_path TEXT NOT NULL, -- chemin dans Supabase Storage
  storage_bucket TEXT DEFAULT 'case-documents',
  
  -- Métadonnées
  category TEXT, -- 'piece', 'conclusion', 'jugement', 'correspondance', 'autre'
  description TEXT,
  tags TEXT[], -- array de tags
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES case_documents(id),
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index
  CONSTRAINT fk_case FOREIGN KEY (case_id) REFERENCES cases(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id)
);

-- Index pour performance
CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX idx_case_documents_user_id ON case_documents(user_id);
CREATE INDEX idx_case_documents_category ON case_documents(category);

-- RLS Policies
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own case documents"
  ON case_documents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own case documents"
  ON case_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own case documents"
  ON case_documents FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own case documents"
  ON case_documents FOR DELETE
  USING (user_id = auth.uid());
```

#### Supabase Storage
```typescript
// Configuration du bucket
// Bucket name: 'case-documents'
// Public: false (privé)
// File size limit: 50MB par fichier
// Allowed MIME types: 
//   - application/pdf
//   - application/msword
//   - application/vnd.openxmlformats-officedocument.wordprocessingml.document
//   - image/jpeg, image/png, image/gif
//   - text/plain
```

### Services à Créer

#### 1. `services/documentService.ts`
```typescript
interface CaseDocument {
  id: string;
  caseId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  storagePath: string;
  category?: 'piece' | 'conclusion' | 'jugement' | 'correspondance' | 'autre';
  description?: string;
  tags?: string[];
  version: number;
  parentDocumentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

class DocumentService {
  // Upload un document
  async uploadDocument(
    caseId: string,
    file: File,
    metadata: {
      category?: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<CaseDocument>;

  // Télécharger un document
  async downloadDocument(documentId: string): Promise<Blob>;

  // Obtenir l'URL signée pour prévisualisation
  async getDocumentUrl(documentId: string, expiresIn?: number): Promise<string>;

  // Lister les documents d'un dossier
  async getDocumentsByCase(caseId: string): Promise<CaseDocument[]>;

  // Supprimer un document
  async deleteDocument(documentId: string): Promise<boolean>;

  // Mettre à jour les métadonnées
  async updateDocumentMetadata(
    documentId: string,
    metadata: Partial<CaseDocument>
  ): Promise<CaseDocument>;

  // Créer une nouvelle version
  async createNewVersion(
    documentId: string,
    file: File
  ): Promise<CaseDocument>;

  // Obtenir l'historique des versions
  async getDocumentVersions(documentId: string): Promise<CaseDocument[]>;

  // Rechercher dans les documents
  async searchDocuments(
    query: string,
    filters?: {
      caseId?: string;
      category?: string;
      tags?: string[];
    }
  ): Promise<CaseDocument[]>;
}
```

### Composants UI à Créer

#### 1. `components/documents/DocumentManager.tsx`
- Liste des documents d'un dossier
- Upload de nouveaux documents
- Filtrage par catégorie
- Recherche
- Actions (télécharger, supprimer, modifier)

#### 2. `components/documents/DocumentUploadModal.tsx`
- Drag & drop de fichiers
- Sélection de catégorie
- Ajout de description et tags
- Barre de progression

#### 3. `components/documents/DocumentPreview.tsx`
- Prévisualisation PDF (react-pdf)
- Prévisualisation images
- Téléchargement
- Informations du document

#### 4. `components/documents/DocumentCard.tsx`
- Carte d'affichage d'un document
- Icône selon le type
- Métadonnées
- Actions rapides

### Tâches d'Implémentation

**Semaine 1**:
- [ ] Créer la table `case_documents` avec RLS
- [ ] Configurer Supabase Storage bucket
- [ ] Implémenter `documentService.ts` (upload, download, list)
- [ ] Créer `DocumentUploadModal.tsx`
- [ ] Créer `DocumentCard.tsx`

**Semaine 2**:
- [ ] Implémenter `DocumentManager.tsx`
- [ ] Implémenter `DocumentPreview.tsx`
- [ ] Ajouter le versioning
- [ ] Ajouter la recherche
- [ ] Tests et optimisations
- [ ] Intégration dans `AvocatInterface.tsx`

### Quotas et Limites

**Plan GRATUIT**:
- 5 documents maximum
- 10 MB par document
- Stockage total: 50 MB

**Plan PRO**:
- Documents illimités
- 50 MB par document
- Stockage total: 10 GB

**Plan CABINET**:
- Documents illimités
- 100 MB par document
- Stockage total: 100 GB

---

## 📅 FONCTIONNALITÉ 2: Calendrier et Agenda

### Durée: 2 semaines (Sprint 3-4)

### Architecture Technique

#### Base de Données
```sql
-- Table: calendar_events
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  
  -- Informations de l'événement
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  
  -- Type d'événement
  event_type TEXT NOT NULL, -- 'audience', 'rdv_client', 'deadline', 'reunion', 'autre'
  
  -- Dates et heures
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  
  -- Rappels
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_minutes INTEGER DEFAULT 60, -- 60 minutes avant
  reminder_sent BOOLEAN DEFAULT false,
  
  -- Récurrence (pour événements répétitifs)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- Format iCal RRULE
  
  -- Participants
  participants TEXT[], -- array d'emails
  
  -- Statut
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  
  -- Métadonnées
  color TEXT DEFAULT '#3B82F6', -- couleur pour affichage
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_case_id ON calendar_events(case_id);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_event_type ON calendar_events(event_type);

-- RLS Policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
  ON calendar_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own events"
  ON calendar_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own events"
  ON calendar_events FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own events"
  ON calendar_events FOR DELETE
  USING (user_id = auth.uid());
```

### Services à Créer

#### 1. `services/calendarService.ts`
```typescript
interface CalendarEvent {
  id: string;
  userId: string;
  caseId?: string;
  title: string;
  description?: string;
  location?: string;
  eventType: 'audience' | 'rdv_client' | 'deadline' | 'reunion' | 'autre';
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  reminderEnabled: boolean;
  reminderMinutes: number;
  reminderSent: boolean;
  isRecurring: boolean;
  recurrenceRule?: string;
  participants?: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

class CalendarService {
  // Créer un événement
  async createEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent>;

  // Obtenir les événements d'une période
  async getEventsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]>;

  // Obtenir les événements d'un dossier
  async getEventsByCase(caseId: string): Promise<CalendarEvent[]>;

  // Obtenir les événements du jour
  async getTodayEvents(): Promise<CalendarEvent[]>;

  // Obtenir les événements à venir (7 jours)
  async getUpcomingEvents(days?: number): Promise<CalendarEvent[]>;

  // Mettre à jour un événement
  async updateEvent(
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent>;

  // Supprimer un événement
  async deleteEvent(eventId: string): Promise<boolean>;

  // Marquer comme complété
  async markAsCompleted(eventId: string): Promise<CalendarEvent>;

  // Envoyer les rappels
  async sendReminders(): Promise<void>;
}
```

#### 2. `services/reminderService.ts`
```typescript
class ReminderService {
  // Vérifier les rappels à envoyer
  async checkPendingReminders(): Promise<void>;

  // Envoyer un rappel par email
  async sendEmailReminder(event: CalendarEvent): Promise<boolean>;

  // Créer une notification dans l'app
  async createNotification(event: CalendarEvent): Promise<void>;
}
```

### Composants UI à Créer

#### 1. `components/calendar/CalendarView.tsx`
- Vue mensuelle (grille)
- Vue hebdomadaire
- Vue journalière
- Navigation entre les dates
- Affichage des événements

#### 2. `components/calendar/EventModal.tsx`
- Création/modification d'événement
- Sélection de date/heure
- Liaison avec un dossier
- Configuration des rappels
- Ajout de participants

#### 3. `components/calendar/EventCard.tsx`
- Affichage compact d'un événement
- Icône selon le type
- Actions rapides (modifier, supprimer, compléter)

#### 4. `components/calendar/UpcomingEvents.tsx`
- Liste des prochains événements
- Affichage dans le dashboard
- Filtrage par type

### Bibliothèques à Utiliser

```json
{
  "dependencies": {
    "react-big-calendar": "^1.8.5", // Composant calendrier
    "date-fns": "^2.30.0", // Manipulation de dates
    "react-datepicker": "^4.21.0" // Sélecteur de date/heure
  }
}
```

### Tâches d'Implémentation

**Semaine 3**:
- [ ] Créer la table `calendar_events` avec RLS
- [ ] Implémenter `calendarService.ts`
- [ ] Créer `EventModal.tsx`
- [ ] Créer `EventCard.tsx`
- [ ] Intégrer react-big-calendar

**Semaine 4**:
- [ ] Implémenter `CalendarView.tsx` (vues mois/semaine/jour)
- [ ] Implémenter `UpcomingEvents.tsx`
- [ ] Implémenter `reminderService.ts`
- [ ] Configurer les emails de rappel (Supabase Edge Functions)
- [ ] Tests et optimisations
- [ ] Intégration dans `AvocatInterface.tsx`

### Rappels Automatiques

**Configuration Supabase Edge Function**:
```typescript
// supabase/functions/send-reminders/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Récupérer les événements avec rappels à envoyer
  const now = new Date();
  const { data: events } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('reminder_enabled', true)
    .eq('reminder_sent', false)
    .lte('start_date', new Date(now.getTime() + 60 * 60 * 1000)); // 1h avant

  // Envoyer les emails
  for (const event of events || []) {
    // Logique d'envoi d'email
    // Marquer comme envoyé
  }

  return new Response(JSON.stringify({ sent: events?.length || 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Cron Job**: Exécuter toutes les 15 minutes

---

## ⏱️ FONCTIONNALITÉ 3: Suivi du Temps et Facturation

### Durée: 2 semaines (Sprint 5-6)

### Architecture Technique

#### Base de Données
```sql
-- Table: time_entries
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Temps
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER, -- calculé automatiquement
  
  -- Description
  description TEXT NOT NULL,
  activity_type TEXT, -- 'consultation', 'redaction', 'audience', 'recherche', 'autre'
  
  -- Facturation
  is_billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10, 2), -- taux horaire en DA
  amount DECIMAL(10, 2), -- montant calculé
  
  -- Statut
  is_invoiced BOOLEAN DEFAULT false,
  invoice_id UUID REFERENCES invoices(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  case_id UUID NOT NULL REFERENCES cases(id),
  
  -- Numérotation
  invoice_number TEXT NOT NULL UNIQUE,
  
  -- Client
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  
  -- Montants
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0, -- TVA en %
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Dates
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Statut
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  
  -- Notes
  notes TEXT,
  payment_terms TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: invoice_items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Description
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Lien avec time entry (optionnel)
  time_entry_id UUID REFERENCES time_entries(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_case_id ON time_entries(case_id);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_case_id ON invoices(case_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- RLS Policies (similaire aux autres tables)
```

### Services à Créer

#### 1. `services/timeTrackingService.ts`
```typescript
interface TimeEntry {
  id: string;
  userId: string;
  caseId: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  description: string;
  activityType?: string;
  isBillable: boolean;
  hourlyRate?: number;
  amount?: number;
  isInvoiced: boolean;
  invoiceId?: string;
}

class TimeTrackingService {
  // Démarrer un timer
  async startTimer(caseId: string, description: string): Promise<TimeEntry>;

  // Arrêter un timer
  async stopTimer(entryId: string): Promise<TimeEntry>;

  // Obtenir le timer actif
  async getActiveTimer(): Promise<TimeEntry | null>;

  // Ajouter une entrée manuelle
  async addManualEntry(entry: Partial<TimeEntry>): Promise<TimeEntry>;

  // Obtenir les entrées d'un dossier
  async getEntriesByCase(caseId: string): Promise<TimeEntry[]>;

  // Obtenir les entrées d'une période
  async getEntriesByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<TimeEntry[]>;

  // Obtenir les entrées non facturées
  async getUnbilledEntries(caseId?: string): Promise<TimeEntry[]>;

  // Calculer le total des heures
  async getTotalHours(filters?: any): Promise<number>;

  // Calculer le montant total
  async getTotalAmount(filters?: any): Promise<number>;
}
```

#### 2. `services/invoiceService.ts`
```typescript
interface Invoice {
  id: string;
  userId: string;
  caseId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  paymentTerms?: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  timeEntryId?: string;
}

class InvoiceService {
  // Créer une facture depuis des time entries
  async createInvoiceFromTimeEntries(
    caseId: string,
    timeEntryIds: string[],
    metadata: Partial<Invoice>
  ): Promise<Invoice>;

  // Créer une facture manuelle
  async createManualInvoice(invoice: Partial<Invoice>): Promise<Invoice>;

  // Obtenir les factures
  async getInvoices(filters?: any): Promise<Invoice[]>;

  // Obtenir une facture
  async getInvoice(invoiceId: string): Promise<Invoice>;

  // Mettre à jour une facture
  async updateInvoice(
    invoiceId: string,
    updates: Partial<Invoice>
  ): Promise<Invoice>;

  // Marquer comme payée
  async markAsPaid(invoiceId: string, paidDate: Date): Promise<Invoice>;

  // Générer le PDF
  async generatePDF(invoiceId: string): Promise<Blob>;

  // Envoyer par email
  async sendByEmail(invoiceId: string): Promise<boolean>;

  // Obtenir les statistiques
  async getInvoiceStats(): Promise<{
    totalRevenue: number;
    paidAmount: number;
    unpaidAmount: number;
    overdueAmount: number;
  }>;
}
```

### Composants UI à Créer

#### 1. `components/time-tracking/TimeTracker.tsx`
- Timer actif avec bouton start/stop
- Sélection du dossier
- Description de l'activité
- Affichage du temps écoulé

#### 2. `components/time-tracking/TimeEntryList.tsx`
- Liste des entrées de temps
- Filtrage par dossier/période
- Édition/suppression
- Marquage comme facturable/non-facturable

#### 3. `components/invoicing/InvoiceList.tsx`
- Liste des factures
- Filtrage par statut
- Actions (voir, modifier, envoyer, marquer payée)

#### 4. `components/invoicing/InvoiceForm.tsx`
- Création/modification de facture
- Sélection des time entries
- Ajout d'items manuels
- Calcul automatique des totaux

#### 5. `components/invoicing/InvoicePreview.tsx`
- Prévisualisation de la facture
- Format professionnel
- Export PDF
- Envoi par email

### Bibliothèques à Utiliser

```json
{
  "dependencies": {
    "jspdf": "^2.5.1", // Génération PDF
    "jspdf-autotable": "^3.6.0", // Tables dans PDF
    "react-to-print": "^2.14.15" // Impression
  }
}
```

### Tâches d'Implémentation

**Semaine 5**:
- [ ] Créer les tables (time_entries, invoices, invoice_items)
- [ ] Implémenter `timeTrackingService.ts`
- [ ] Créer `TimeTracker.tsx`
- [ ] Créer `TimeEntryList.tsx`
- [ ] Intégrer dans `AvocatInterface.tsx`

**Semaine 6**:
- [ ] Implémenter `invoiceService.ts`
- [ ] Créer `InvoiceForm.tsx`
- [ ] Créer `InvoiceList.tsx`
- [ ] Créer `InvoicePreview.tsx`
- [ ] Implémenter génération PDF
- [ ] Tests et optimisations

### Template de Facture PDF

```typescript
// Format professionnel avec:
// - En-tête avec logo et informations cabinet
// - Informations client
// - Numéro de facture et dates
// - Tableau des prestations
// - Sous-total, TVA, Total
// - Conditions de paiement
// - Pied de page avec coordonnées bancaires
```

---

## 📊 Suivi de Sprint

### Sprint 1-2: Documents (Semaines 1-2)
- **Objectif**: Upload, stockage, et gestion de documents
- **Livrables**: DocumentManager fonctionnel dans AvocatInterface
- **Critères de succès**: 
  - Upload de PDF/Word/Images
  - Prévisualisation
  - Catégorisation
  - Téléchargement

### Sprint 3-4: Calendrier (Semaines 3-4)
- **Objectif**: Calendrier complet avec rappels
- **Livrables**: CalendarView intégré avec événements
- **Critères de succès**:
  - Création d'événements
  - Vues mois/semaine/jour
  - Rappels par email
  - Liaison avec dossiers

### Sprint 5-6: Temps & Facturation (Semaines 5-6)
- **Objectif**: Suivi du temps et génération de factures
- **Livrables**: TimeTracker + InvoiceManager
- **Critères de succès**:
  - Timer fonctionnel
  - Création de factures
  - Génération PDF
  - Statistiques financières

---

## 🎯 Critères de Validation

### Tests Fonctionnels
- [ ] Upload de 10 documents de types différents
- [ ] Création de 20 événements sur 3 mois
- [ ] Suivi de 50 heures sur 10 dossiers
- [ ] Génération de 5 factures avec PDF

### Tests de Performance
- [ ] Upload de fichier 50MB en < 30s
- [ ] Affichage calendrier mois en < 1s
- [ ] Calcul facture 100 items en < 2s

### Tests de Sécurité
- [ ] RLS empêche accès aux documents d'autres users
- [ ] Validation des types de fichiers
- [ ] Sanitization des inputs

---

## 📈 Métriques de Succès

### Adoption
- 80% des utilisateurs uploadent au moins 1 document
- 60% des utilisateurs créent au moins 1 événement
- 40% des utilisateurs utilisent le time tracking

### Engagement
- Moyenne de 5 documents par dossier
- Moyenne de 10 événements par mois
- Moyenne de 20 heures trackées par mois

### Satisfaction
- NPS > 8/10 sur les nouvelles fonctionnalités
- Taux de rétention +20%
- Conversion GRATUIT → PRO +30%

---

**Date de création**: 03/03/2026
**Prochaine révision**: Fin de chaque sprint
