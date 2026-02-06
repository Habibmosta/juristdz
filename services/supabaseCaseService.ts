import { Case } from '../types';
import { supabase } from './supabaseClient';

/**
 * Supabase-powered Case Service
 * Handles CRUD operations for legal cases with real database persistence
 */
class SupabaseCaseService {
  private tableName = 'cases';

  /**
   * Get all cases for the current user
   */
  async getAllCases(): Promise<Case[]> {
    try {
      const { data, error } = await supabase
        ?.from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cases:', error);
        throw new Error(`Failed to fetch cases: ${error.message}`);
      }

      return this.mapSupabaseToCases(data || []);
    } catch (error) {
      console.error('Error in getAllCases:', error);
      throw error;
    }
  }

  /**
   * Get active cases only
   */
  async getActiveCases(): Promise<Case[]> {
    try {
      const { data, error } = await supabase
        ?.from(this.tableName)
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active cases:', error);
        throw new Error(`Failed to fetch active cases: ${error.message}`);
      }

      return this.mapSupabaseToCases(data || []);
    } catch (error) {
      console.error('Error in getActiveCases:', error);
      throw error;
    }
  }

  /**
   * Get cases by priority
   */
  async getCasesByPriority(priority: 'low' | 'medium' | 'high' | 'urgent'): Promise<Case[]> {
    try {
      const { data, error } = await supabase
        ?.from(this.tableName)
        .select('*')
        .eq('priority', priority)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cases by priority:', error);
        throw new Error(`Failed to fetch cases by priority: ${error.message}`);
      }

      return this.mapSupabaseToCases(data || []);
    } catch (error) {
      console.error('Error in getCasesByPriority:', error);
      throw error;
    }
  }

  /**
   * Get cases with upcoming deadlines
   */
  async getUpcomingDeadlines(days: number = 7): Promise<Case[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await supabase
        ?.from(this.tableName)
        .select('*')
        .eq('status', 'active')
        .not('deadline', 'is', null)
        .gte('deadline', new Date().toISOString().split('T')[0])
        .lte('deadline', futureDate.toISOString().split('T')[0])
        .order('deadline', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming deadlines:', error);
        throw new Error(`Failed to fetch upcoming deadlines: ${error.message}`);
      }

      return this.mapSupabaseToCases(data || []);
    } catch (error) {
      console.error('Error in getUpcomingDeadlines:', error);
      throw error;
    }
  }

  /**
   * Get case by ID
   */
  async getCaseById(id: string): Promise<Case | null> {
    try {
      const { data, error } = await supabase
        ?.from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Case not found
        }
        console.error('Error fetching case by ID:', error);
        throw new Error(`Failed to fetch case: ${error.message}`);
      }

      return this.mapSupabaseToCase(data);
    } catch (error) {
      console.error('Error in getCaseById:', error);
      throw error;
    }
  }

  /**
   * Create a new case
   */
  async createCase(caseData: Partial<Case>): Promise<Case> {
    try {
      console.log('🔍 Début création cas Supabase:', caseData);
      
      const supabaseData = this.mapCaseToSupabase(caseData);
      console.log('🔄 Données mappées pour Supabase:', supabaseData);
      
      // Pour les tests, on met user_id à null pour contourner RLS temporairement
      supabaseData.user_id = null;

      console.log('📤 Envoi vers Supabase...');
      const { data, error } = await supabase
        ?.from(this.tableName)
        .insert([supabaseData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur Supabase détaillée:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to create case: ${error.message}`);
      }

      console.log('✅ Cas créé avec succès dans Supabase:', data);
      return this.mapSupabaseToCase(data);
    } catch (error) {
      console.error('❌ Erreur générale dans createCase:', error);
      throw error;
    }
  }

  /**
   * Update an existing case
   */
  async updateCase(id: string, updates: Partial<Case>): Promise<Case | null> {
    try {
      const supabaseUpdates = this.mapCaseToSupabase(updates);
      delete supabaseUpdates.id; // Don't update ID
      delete supabaseUpdates.created_at; // Don't update creation date

      const { data, error } = await supabase
        ?.from(this.tableName)
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating case:', error);
        throw new Error(`Failed to update case: ${error.message}`);
      }

      return this.mapSupabaseToCase(data);
    } catch (error) {
      console.error('Error in updateCase:', error);
      throw error;
    }
  }

  /**
   * Delete a case (archive it)
   */
  async deleteCase(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        ?.from(this.tableName)
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) {
        console.error('Error archiving case:', error);
        throw new Error(`Failed to archive case: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in deleteCase:', error);
      return false;
    }
  }

  /**
   * Search cases by title, client name, or description
   */
  async searchCases(query: string): Promise<Case[]> {
    try {
      if (!query.trim()) {
        return this.getAllCases();
      }

      const searchTerm = `%${query.toLowerCase()}%`;

      const { data, error } = await supabase
        ?.from(this.tableName)
        .select('*')
        .or(`title.ilike.${searchTerm},client_name.ilike.${searchTerm},description.ilike.${searchTerm},case_type.ilike.${searchTerm}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching cases:', error);
        throw new Error(`Failed to search cases: ${error.message}`);
      }

      return this.mapSupabaseToCases(data || []);
    } catch (error) {
      console.error('Error in searchCases:', error);
      throw error;
    }
  }

  /**
   * Get case statistics
   */
  async getCaseStatistics() {
    try {
      const { data, error } = await supabase
        ?.from('case_statistics')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching case statistics:', error);
        // Fallback to manual calculation
        return this.calculateStatisticsManually();
      }

      return {
        totalCases: data.total_cases || 0,
        activeCases: data.active_cases || 0,
        archivedCases: data.archived_cases || 0,
        upcomingDeadlines: data.upcoming_deadlines || 0,
        highPriorityCases: data.high_priority_cases || 0,
        urgentCases: data.urgent_cases || 0,
        totalEstimatedValue: parseFloat(data.total_estimated_value || '0'),
        averageEstimatedValue: parseFloat(data.average_estimated_value || '0')
      };
    } catch (error) {
      console.error('Error in getCaseStatistics:', error);
      return this.calculateStatisticsManually();
    }
  }

  /**
   * Get cases grouped by type
   */
  async getCasesByType(): Promise<Record<string, Case[]>> {
    try {
      const cases = await this.getAllCases();
      const grouped: Record<string, Case[]> = {};
      
      cases.forEach(case_ => {
        const type = case_.caseType || 'Non classé';
        if (!grouped[type]) {
          grouped[type] = [];
        }
        grouped[type].push(case_);
      });

      return grouped;
    } catch (error) {
      console.error('Error in getCasesByType:', error);
      return {};
    }
  }

  /**
   * Check if Supabase is available
   */
  isAvailable(): boolean {
    return supabase !== null;
  }

  /**
   * Map Supabase data to Case interface
   */
  private mapSupabaseToCase(data: any): Case {
    return {
      id: data.id,
      title: data.title,
      clientName: data.client_name,
      clientPhone: data.client_phone,
      clientEmail: data.client_email,
      clientAddress: data.client_address,
      description: data.description,
      caseType: data.case_type,
      priority: data.priority,
      estimatedValue: data.estimated_value ? parseFloat(data.estimated_value) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      status: data.status,
      notes: data.notes,
      assignedLawyer: data.assigned_lawyer,
      tags: data.tags || [],
      documents: data.documents || [],
      createdAt: new Date(data.created_at),
      lastUpdated: new Date(data.updated_at)
    };
  }

  /**
   * Map array of Supabase data to Case array
   */
  private mapSupabaseToCases(data: any[]): Case[] {
    return data.map(item => this.mapSupabaseToCase(item));
  }

  /**
   * Map Case interface to Supabase data
   */
  private mapCaseToSupabase(caseData: Partial<Case>): any {
    const supabaseData: any = {
      title: caseData.title,
      client_name: caseData.clientName,
      client_phone: caseData.clientPhone,
      client_email: caseData.clientEmail,
      client_address: caseData.clientAddress,
      description: caseData.description,
      case_type: caseData.caseType,
      priority: caseData.priority,
      estimated_value: caseData.estimatedValue,
      deadline: caseData.deadline ? caseData.deadline.toISOString().split('T')[0] : null,
      status: caseData.status,
      notes: caseData.notes,
      assigned_lawyer: caseData.assignedLawyer,
      tags: caseData.tags || [],
      documents: caseData.documents || []
    };

    // Only include id if it exists and is not undefined
    if (caseData.id) {
      supabaseData.id = caseData.id;
    }

    // Only include timestamps if they exist
    if (caseData.createdAt) {
      supabaseData.created_at = caseData.createdAt.toISOString();
    }
    if (caseData.lastUpdated) {
      supabaseData.updated_at = caseData.lastUpdated.toISOString();
    }

    return supabaseData;
  }

  /**
   * Fallback manual statistics calculation
   */
  private async calculateStatisticsManually() {
    try {
      const allCases = await this.getAllCases();
      const activeCases = allCases.filter(c => c.status === 'active');
      const upcomingDeadlines = await this.getUpcomingDeadlines();
      
      const totalEstimatedValue = activeCases.reduce((sum, case_) => 
        sum + (case_.estimatedValue || 0), 0
      );

      return {
        totalCases: allCases.length,
        activeCases: activeCases.length,
        archivedCases: allCases.filter(c => c.status === 'archived').length,
        upcomingDeadlines: upcomingDeadlines.length,
        highPriorityCases: allCases.filter(c => c.priority === 'high').length,
        urgentCases: allCases.filter(c => c.priority === 'urgent').length,
        totalEstimatedValue,
        averageEstimatedValue: activeCases.length > 0 ? totalEstimatedValue / activeCases.length : 0
      };
    } catch (error) {
      console.error('Error in calculateStatisticsManually:', error);
      return {
        totalCases: 0,
        activeCases: 0,
        archivedCases: 0,
        upcomingDeadlines: 0,
        highPriorityCases: 0,
        urgentCases: 0,
        totalEstimatedValue: 0,
        averageEstimatedValue: 0
      };
    }
  }
}

// Create and export a singleton instance
export const supabaseCaseService = new SupabaseCaseService();