// Types pour la gestion complète des dossiers

export interface Case {
  id: string;
  user_id: string;
  
  // Informations de base
  case_number: string;
  title: string;
  description?: string;
  case_type: 'civil' | 'penal' | 'commercial' | 'administratif' | 'famille' | 'travail' | 'autre';
  
  // Statut et priorité
  status: 'nouveau' | 'en_cours' | 'audience' | 'jugement' | 'cloture' | 'archive';
  priority: 'basse' | 'normale' | 'haute' | 'urgente';
  
  // Dates importantes
  opened_date: string;
  closed_date?: string;
  next_hearing_date?: string;
  statute_of_limitations?: string;
  
  // Juridiction
  court_name?: string;
  court_location?: string;
  judge_name?: string;
  case_reference?: string;
  
  // Parties
  client_role?: string;
  adverse_party_name?: string;
  adverse_party_lawyer?: string;
  
  // Financier
  estimated_value?: number;
  court_fees?: number;
  
  // Organisation
  tags?: string[];
  folder_path?: string;
  
  // Notes
  notes?: string;
  internal_notes?: string;
  
  // Métadonnées
  created_at: string;
  updated_at: string;
  archived_at?: string;
  
  // Relations (depuis les vues)
  total_documents?: number;
  total_events?: number;
  total_tasks?: number;
  completed_tasks?: number;
  total_clients?: number;
}

export interface CaseClient {
  id: string;
  case_id: string;
  client_id: string;
  role: string;
  notes?: string;
  created_at: string;
}

export interface CaseDocument {
  id: string;
  user_id: string;
  case_id: string;
  
  // Informations du document
  title: string;
  description?: string;
  document_type: string;
  
  // Fichier
  file_name: string;
  file_size?: number;
  file_type?: string;
  storage_path: string;
  
  // Métadonnées
  document_date?: string;
  received_date?: string;
  sent_date?: string;
  
  // Organisation
  category?: string;
  tags?: string[];
  is_confidential: boolean;
  
  // Versioning
  version: number;
  parent_document_id?: string;
  
  // Statut
  status: 'actif' | 'archive' | 'supprime';
  
  // Métadonnées
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  notes?: string;
}

export interface CaseEvent {
  id: string;
  user_id: string;
  case_id: string;
  
  // Événement
  event_type: string;
  title: string;
  description?: string;
  
  // Date et heure
  event_date: string;
  event_time?: string;
  duration_minutes?: number;
  
  // Localisation
  location?: string;
  
  // Participants
  participants?: string[];
  
  // Résultat
  outcome?: string;
  outcome_type?: 'favorable' | 'defavorable' | 'neutre' | 'en_attente';
  
  // Documents liés
  related_document_ids?: string[];
  
  // Rappels
  reminder_date?: string;
  reminder_sent: boolean;
  
  // Statut
  status: 'prevu' | 'termine' | 'annule' | 'reporte';
  
  // Métadonnées
  created_at: string;
  updated_at: string;
  
  notes?: string;
}

export interface CaseTask {
  id: string;
  user_id: string;
  case_id: string;
  
  // Tâche
  title: string;
  description?: string;
  task_type?: string;
  
  // Priorité et statut
  priority: 'basse' | 'normale' | 'haute' | 'urgente';
  status: 'a_faire' | 'en_cours' | 'terminee' | 'annulee';
  
  // Dates
  due_date?: string;
  completed_date?: string;
  
  // Assignation
  assigned_to?: string;
  
  // Temps estimé vs réel
  estimated_hours?: number;
  actual_hours?: number;
  
  // Rappels
  reminder_date?: string;
  reminder_sent: boolean;
  
  // Métadonnées
  created_at: string;
  updated_at: string;
  
  notes?: string;
}

export interface CaseNote {
  id: string;
  user_id: string;
  case_id: string;
  
  // Note
  title?: string;
  content: string;
  note_type: string;
  
  // Confidentialité
  is_private: boolean;
  
  // Tags
  tags?: string[];
  
  // Métadonnées
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CaseStats {
  id: string;
  user_id: string;
  case_number: string;
  title: string;
  status: string;
  priority: string;
  opened_date: string;
  next_hearing_date?: string;
  total_documents: number;
  total_events: number;
  total_tasks: number;
  completed_tasks: number;
  total_clients: number;
}
