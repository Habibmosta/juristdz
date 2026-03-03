// Types pour la gestion des clients (comme Clio/MyCase)

export interface Client {
  id: string;
  user_id: string;
  
  // Informations personnelles
  first_name: string;
  last_name: string;
  company_name?: string;
  client_type: 'individual' | 'company';
  
  // Identification
  cin?: string;
  nif?: string;
  rc?: string;
  
  // Contact
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  wilaya?: string;
  postal_code?: string;
  
  // Informations professionnelles
  profession?: string;
  
  // Notes et statut
  notes?: string;
  status: 'active' | 'inactive' | 'archived';
  
  // Métadonnées
  created_at: string;
  updated_at: string;
  
  // Statistiques (depuis la vue)
  total_cases?: number;
  total_invoices?: number;
  total_billed?: number;
  total_paid?: number;
  total_outstanding?: number;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  case_id?: string;
  client_id?: string;
  
  // Temps
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  
  // Description
  description: string;
  activity_type?: 'consultation' | 'research' | 'drafting' | 'court' | 'phone' | 'email' | 'travel' | 'other';
  
  // Facturation
  billable: boolean;
  hourly_rate?: number;
  amount?: number;
  invoiced: boolean;
  invoice_id?: string;
  
  // Métadonnées
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  case_id?: string;
  
  // Numérotation
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  
  // Montants
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  
  // Paiement
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paid_amount: number;
  paid_date?: string;
  payment_method?: 'cash' | 'check' | 'transfer' | 'card';
  
  // Notes
  notes?: string;
  terms?: string;
  
  // Métadonnées
  created_at: string;
  updated_at: string;
  
  // Relations
  client?: Client;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  
  // Type de ligne
  item_type: 'service' | 'expense' | 'time_entry';
  time_entry_id?: string;
  
  // Description
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  
  // Ordre d'affichage
  sort_order: number;
  
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  invoice_id: string;
  client_id: string;
  
  // Montant
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'check' | 'transfer' | 'card';
  
  // Détails
  reference?: string;
  notes?: string;
  
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  case_id?: string;
  client_id?: string;
  
  // Événement
  title: string;
  description?: string;
  event_type: 'hearing' | 'meeting' | 'deadline' | 'reminder' | 'task';
  
  // Date et heure
  start_datetime: string;
  end_datetime?: string;
  all_day: boolean;
  
  // Localisation
  location?: string;
  
  // Rappels
  reminder_minutes?: number;
  reminder_sent: boolean;
  
  // Statut
  status: 'scheduled' | 'completed' | 'cancelled';
  
  // Métadonnées
  created_at: string;
  updated_at: string;
}

export interface ClientStats {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  total_cases: number;
  total_invoices: number;
  total_billed: number;
  total_paid: number;
  total_outstanding: number;
}
