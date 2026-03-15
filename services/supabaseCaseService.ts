import { Case } from '../types';
import { supabase } from '../src/lib/supabase';

/**
 * Supabase-powered Case Service
 * Handles CRUD operations for legal cases with real database persistence
 */
class SupabaseCaseService {
  private tableName = 'cases';

  /**
   * Get all cases for the current user
   */
  async getAllCases(userId?: string): Promise<Case[]> {
    try {
      // Get user_id from parameter or from auth
      let user_id = userId;
      if (!user_id) {
        const { data: { user } } = await supabase?.auth.getUser() || { data: { user: null } };
        user_id = user?.id;
      }

      if (!user_id) {
        console.warn('No user authenticated, returning empty cases');
        return [];
      }

      const { data, error } = await supabase
        ?.from(this.tableName)
        .select('*')
        .eq('user_id', user_id)
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
  async getActiveCases(userId?: string): Promise<Case[]> {
    try {
      // Get user_id from parameter or from auth
      let user_id = userId;
      if (!user_id) {
        const { data: { user } } = await supabase?.auth.getUser() || { data: { user: null } };
        user_id = user?.id;
      }

      if (!user_id) {
        console.warn('No user authenticated, returning empty cases');
        return [];
      }

      const { data, error } = await supabase
        ?.from(this.tableName)
        .select('*')
        .eq('user_id', user_id)
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
  async createCase(caseData: Partial<Case>, userId?: string): Promise<Case> {
    try {
      // Get user_id from parameter or from auth
      let user_id = userId;
      if (!user_id) {
        const { data: { user } } = await supabase?.auth.getUser() || { data: { user: null } };
        user_id = user?.id;
      }

      if (!user_id) {
        throw new Error('User not authenticated - cannot create case');
      }

      // Map to complete structure with all columns
      const supabaseData = {
        user_id: user_id,
        title: caseData.title || '',
        client_name: caseData.clientName || '',
        client_phone: caseData.clientPhone || null,
        client_email: caseData.clientEmail || null,
        client_address: caseData.clientAddress || null,
        description: caseData.description || '',
        case_type: caseData.caseType || null,
        priority: caseData.priority || 'medium',
        estimated_value: caseData.estimatedValue || null,
        deadline: caseData.deadline ? caseData.deadline.toISOString().split('T')[0] : null,
        notes: caseData.notes || null,
        assigned_lawyer: caseData.assignedLawyer || null,
        tags: caseData.tags || [],
        documents: caseData.documents || [],
        status: caseData.status || 'active'
      };
      
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

      return this.mapSupabaseToCase(data);
    } catch (error) {
      console.error('❌ Erreur générale dans createCase:', error);
      throw error;
    }
  }

  /**
   * Update an existing case
   */
  async updateCase(id: string, updates: Partial<Case>, userId?: string): Promise<Case | null> {
    try {
      // Get user_id from parameter or from auth
      let user_id = userId;
      if (!user_id) {
        const { data: { user } } = await supabase?.auth.getUser() || { data: { user: null } };
        user_id = user?.id;
      }

      if (!user_id) {
        throw new Error('User not authenticated - cannot update case');
      }

      // Map to complete structure with all columns
      const supabaseUpdates: any = {};
      if (updates.title !== undefined) supabaseUpdates.title = updates.title;
      if (updates.clientName !== undefined) supabaseUpdates.client_name = updates.clientName;
      if (updates.clientPhone !== undefined) supabaseUpdates.client_phone = updates.clientPhone;
      if (updates.clientEmail !== undefined) supabaseUpdates.client_email = updates.clientEmail;
      if (updates.clientAddress !== undefined) supabaseUpdates.client_address = updates.clientAddress;
      if (updates.description !== undefined) supabaseUpdates.description = updates.description;
      if (updates.caseType !== undefined) supabaseUpdates.case_type = updates.caseType;
      if (updates.priority !== undefined) supabaseUpdates.priority = updates.priority;
      if (updates.estimatedValue !== undefined) supabaseUpdates.estimated_value = updates.estimatedValue;
      if (updates.deadline !== undefined) supabaseUpdates.deadline = updates.deadline ? updates.deadline.toISOString().split('T')[0] : null;
      if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;
      if (updates.assignedLawyer !== undefined) supabaseUpdates.assigned_lawyer = updates.assignedLawyer;
      if (updates.tags !== undefined) supabaseUpdates.tags = updates.tags;
      if (updates.documents !== undefined) supabaseUpdates.documents = updates.documents;
      if (updates.status !== undefined) supabaseUpdates.status = updates.status;

      const { data, error } = await supabase
        ?.from(this.tableName)
        .update(supabaseUpdates)
        .eq('id', id)
        .eq('user_id', user_id) // Ensure user can only update their own cases
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
   * Maps all columns from the database
   */
  private mapSupabaseToCase(data: any): Case {
    return {
      id: data.id,
      title: data.title,
      clientName: data.client_name,
      clientPhone: data.client_phone || '',
      clientEmail: data.client_email || '',
      clientAddress: data.client_address || '',
      description: data.description || '',
      caseType: data.case_type || '',
      priority: data.priority || 'medium',
      estimatedValue: data.estimated_value ? parseFloat(data.estimated_value) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      notes: data.notes || '',
      assignedLawyer: data.assigned_lawyer || '',
      tags: data.tags || [],
      documents: data.documents || [],
      status: data.status,
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