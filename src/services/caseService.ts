import { supabase } from '../lib/supabase';
import type { Case, CaseDocument, CaseEvent, CaseTask, CaseNote, CaseStats } from '../types/case.types';

export class CaseService {
  // ═══════════════════════════════════════════════════════════════════════════
  // GESTION DES DOSSIERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Générer un numéro de dossier automatique
   */
  static async generateCaseNumber(userId: string): Promise<string> {
    const { data, error } = await supabase.rpc('generate_case_number', {
      p_user_id: userId
    });

    if (error) throw error;
    return data;
  }

  /**
   * Créer un nouveau dossier
   */
  static async createCase(userId: string, caseData: Partial<Case>): Promise<Case> {
    // Générer le numéro de dossier si non fourni
    if (!caseData.case_number) {
      caseData.case_number = await this.generateCaseNumber(userId);
    }

    const { data, error } = await supabase
      .from('cases')
      .insert({
        user_id: userId,
        ...caseData,
        status: caseData.status || 'nouveau'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Récupérer tous les dossiers
   */
  static async getCases(userId: string, filters?: {
    status?: string;
    priority?: string;
    case_type?: string;
  }): Promise<Case[]> {
    let query = supabase
      .from('cases')
      .select('*')
      .eq('user_id', userId)
      .order('opened_date', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.case_type) {
      query = query.eq('case_type', filters.case_type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Récupérer les statistiques des dossiers
   */
  static async getCaseStats(userId: string): Promise<CaseStats[]> {
    const { data, error } = await supabase
      .from('case_stats')
      .select('*')
      .eq('user_id', userId)
      .order('opened_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Récupérer un dossier par ID
   */
  static async getCase(caseId: string): Promise<Case | null> {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mettre à jour un dossier
   */
  static async updateCase(caseId: string, updates: Partial<Case>): Promise<Case> {
    const { data, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', caseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Supprimer un dossier
   */
  static async deleteCase(caseId: string): Promise<void> {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', caseId);

    if (error) throw error;
  }

  /**
   * Archiver un dossier
   */
  static async archiveCase(caseId: string): Promise<Case> {
    return this.updateCase(caseId, {
      status: 'archive',
      archived_at: new Date().toISOString()
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTION DES DOCUMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Récupérer les documents d'un dossier
   */
  static async getCaseDocuments(caseId: string): Promise<CaseDocument[]> {
    const { data, error } = await supabase
      .from('case_documents')
      .select('*')
      .eq('case_id', caseId)
      .eq('status', 'actif')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Ajouter un document au dossier
   */
  static async addDocument(userId: string, caseId: string, document: Partial<CaseDocument>): Promise<CaseDocument> {
    const { data, error } = await supabase
      .from('case_documents')
      .insert({
        user_id: userId,
        case_id: caseId,
        ...document,
        status: 'actif',
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Upload un fichier vers Supabase Storage
   */
  static async uploadFile(file: File, caseId: string, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${caseId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('case-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return filePath;
  }

  /**
   * Obtenir l'URL publique d'un document
   */
  static getDocumentUrl(storagePath: string): string {
    const { data } = supabase.storage
      .from('case-documents')
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTION DES ÉVÉNEMENTS (TIMELINE)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Récupérer les événements d'un dossier
   */
  static async getCaseEvents(caseId: string): Promise<CaseEvent[]> {
    const { data, error } = await supabase
      .from('case_events')
      .select('*')
      .eq('case_id', caseId)
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Ajouter un événement
   */
  static async addEvent(userId: string, caseId: string, event: Partial<CaseEvent>): Promise<CaseEvent> {
    const { data, error } = await supabase
      .from('case_events')
      .insert({
        user_id: userId,
        case_id: caseId,
        ...event,
        status: event.status || 'prevu'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mettre à jour un événement
   */
  static async updateEvent(eventId: string, updates: Partial<CaseEvent>): Promise<CaseEvent> {
    const { data, error } = await supabase
      .from('case_events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTION DES TÂCHES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Récupérer les tâches d'un dossier
   */
  static async getCaseTasks(caseId: string): Promise<CaseTask[]> {
    const { data, error } = await supabase
      .from('case_tasks')
      .select('*')
      .eq('case_id', caseId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Ajouter une tâche
   */
  static async addTask(userId: string, caseId: string, task: Partial<CaseTask>): Promise<CaseTask> {
    const { data, error } = await supabase
      .from('case_tasks')
      .insert({
        user_id: userId,
        case_id: caseId,
        ...task,
        status: task.status || 'a_faire'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mettre à jour une tâche
   */
  static async updateTask(taskId: string, updates: Partial<CaseTask>): Promise<CaseTask> {
    const { data, error } = await supabase
      .from('case_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Marquer une tâche comme terminée
   */
  static async completeTask(taskId: string): Promise<CaseTask> {
    return this.updateTask(taskId, {
      status: 'terminee',
      completed_date: new Date().toISOString().split('T')[0]
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTION DES NOTES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Récupérer les notes d'un dossier
   */
  static async getCaseNotes(caseId: string): Promise<CaseNote[]> {
    const { data, error } = await supabase
      .from('case_notes')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Ajouter une note
   */
  static async addNote(userId: string, caseId: string, note: Partial<CaseNote>): Promise<CaseNote> {
    const { data, error } = await supabase
      .from('case_notes')
      .insert({
        user_id: userId,
        case_id: caseId,
        ...note,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATISTIQUES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtenir les statistiques globales
   */
  static async getGlobalStats(userId: string) {
    const cases = await this.getCases(userId);

    const totalCases = cases.length;
    const activeCases = cases.filter(c => c.status === 'en_cours').length;
    const closedCases = cases.filter(c => c.status === 'cloture').length;
    const upcomingHearings = cases.filter(c => 
      c.next_hearing_date && new Date(c.next_hearing_date) >= new Date()
    ).length;

    return {
      totalCases,
      activeCases,
      closedCases,
      archivedCases: cases.filter(c => c.status === 'archive').length,
      upcomingHearings,
      urgentCases: cases.filter(c => c.priority === 'urgente').length
    };
  }

  /**
   * Récupérer les prochaines audiences
   */
  static async getUpcomingHearings(userId: string) {
    const { data, error } = await supabase
      .from('upcoming_hearings')
      .select('*')
      .eq('user_id', userId)
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  /**
   * Récupérer les tâches en retard
   */
  static async getOverdueTasks(userId: string) {
    const { data, error } = await supabase
      .from('overdue_tasks')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }
}
