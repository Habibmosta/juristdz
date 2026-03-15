import { Case } from '../types';
import { supabase } from '../src/lib/supabase';
import { authService } from './authService';

/**
 * Multi-User Case Service for Cloud Application
 * Handles proper user isolation, organization-based access, and collaboration
 */
class MultiUserCaseService {
  private tableName = 'cases';

  /**
   * Get current user's organization and profile
   */
  private async getCurrentUserContext() {
    const userProfile = await authService.getCurrentUser();
    
    if (!userProfile) {
      throw new Error('User not authenticated');
    }

    return { 
      user: { id: userProfile.id }, 
      profile: userProfile 
    };
  }

  /**
   * Get all accessible cases for current user
   */
  async getAllCases(): Promise<Case[]> {
    try {
      const { user } = await this.getCurrentUserContext();

      const { data, error } = await supabase
        ?.from(this.tableName)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching cases:', error);
        throw new Error(`Failed to fetch cases: ${error.message}`);
      }

      return this.mapSupabaseToCases(data || []);
    } catch (error) {
      console.error('❌ Error in getAllCases:', error);
      throw error;
    }
  }

  /**
   * Get cases assigned to current user
   */
  async getMyAssignedCases(): Promise<Case[]> {
    try {
      const { user, profile } = await this.getCurrentUserContext();

      const { data, error } = await supabase
        ?.from(this.tableName)
        .select(`
          *,
          client:clients(*),
          created_by_user:user_profiles!cases_created_by_fkey(first_name, last_name)
        `)
        .eq('organization_id', profile.organization_id)
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assigned cases:', error);
        throw new Error(`Failed to fetch assigned cases: ${error.message}`);
      }

      return this.mapSupabaseToCases(data || []);
    } catch (error) {
      console.error('Error in getMyAssignedCases:', error);
      throw error;
    }
  }

  /**
   * Get cases created by current user
   */
  async getMyCases(): Promise<Case[]> {
    try {
      const { user, profile } = await this.getCurrentUserContext();

      const { data, error } = await supabase
        ?.from(this.tableName)
        .select(`
          *,
          client:clients(*),
          assigned_to_user:user_profiles!cases_assigned_to_fkey(first_name, last_name)
        `)
        .eq('organization_id', profile.organization_id)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my cases:', error);
        throw new Error(`Failed to fetch my cases: ${error.message}`);
      }

      return this.mapSupabaseToCases(data || []);
    } catch (error) {
      console.error('Error in getMyCases:', error);
      throw error;
    }
  }

  /**
   * Create a new case
   */
  async createCase(caseData: Partial<Case>): Promise<Case> {
    try {
      const { user, profile } = await this.getCurrentUserContext();

      // Prepare case data
      const supabaseData = {
        user_id: user.id, // IMPORTANT: user_id de l'utilisateur connecté
        title: caseData.title || 'Nouveau dossier',
        client_name: caseData.clientName || 'Client',
        client_phone: caseData.clientPhone || null,
        client_email: caseData.clientEmail || null,
        client_address: caseData.clientAddress || null,
        description: caseData.description || null,
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
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error creating case:', error);
        throw new Error(`Failed to create case: ${error.message}`);
      }

      // Log activity (optionnel, peut échouer si la table n'existe pas)
      try {
        await this.logActivity('created', 'case', data.id, `Created case: ${data.title}`);
      } catch (logError) {
        console.warn('⚠️ Could not log activity:', logError);
      }

      return this.mapSupabaseToCase(data);
    } catch (error) {
      console.error('❌ Error in createCase:', error);
      throw error;
    }
  }

  /**
   * Update an existing case
   */
  async updateCase(id: string, updates: Partial<Case>): Promise<Case | null> {
    try {
      const { user, profile } = await this.getCurrentUserContext();

      const supabaseUpdates = this.mapCaseToSupabase(updates);
      
      // Remove fields that shouldn't be updated
      delete supabaseUpdates.id;
      delete supabaseUpdates.organization_id;
      delete supabaseUpdates.created_by;
      delete supabaseUpdates.created_at;

      const { data, error } = await supabase
        ?.from(this.tableName)
        .update(supabaseUpdates)
        .eq('id', id)
        .eq('organization_id', profile.organization_id) // Ensure organization isolation
        .select(`
          *,
          client:clients(*),
          created_by_user:user_profiles!cases_created_by_fkey(first_name, last_name),
          assigned_to_user:user_profiles!cases_assigned_to_fkey(first_name, last_name)
        `)
        .single();

      if (error) {
        console.error('Error updating case:', error);
        throw new Error(`Failed to update case: ${error.message}`);
      }

      // Log activity
      await this.logActivity('updated', 'case', id, `Updated case: ${data.title}`);

      return this.mapSupabaseToCase(data);
    } catch (error) {
      console.error('Error in updateCase:', error);
      throw error;
    }
  }

  /**
   * Archive a case (soft delete)
   */
  async archiveCase(id: string): Promise<boolean> {
    try {
      const { user, profile } = await this.getCurrentUserContext();

      const { data, error } = await supabase
        ?.from(this.tableName)
        .update({ status: 'archived' })
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .select('title')
        .single();

      if (error) {
        console.error('Error archiving case:', error);
        throw new Error(`Failed to archive case: ${error.message}`);
      }

      // Log activity
      await this.logActivity('archived', 'case', id, `Archived case: ${data.title}`);

      return true;
    } catch (error) {
      console.error('Error in archiveCase:', error);
      return false;
    }
  }

  /**
   * Add collaborator to a case
   */
  async addCollaborator(caseId: string, userId: string, role: 'collaborator' | 'viewer' = 'collaborator'): Promise<boolean> {
    try {
      const { user, profile } = await this.getCurrentUserContext();

      // Verify the case belongs to the organization
      const { data: caseData, error: caseError } = await supabase
        ?.from(this.tableName)
        .select('id, title')
        .eq('id', caseId)
        .eq('organization_id', profile.organization_id)
        .single();

      if (caseError || !caseData) {
        throw new Error('Case not found or access denied');
      }

      // Add collaborator
      const { error } = await supabase
        ?.from('case_collaborators')
        .insert([{
          case_id: caseId,
          user_id: userId,
          role: role,
          added_by: user.id
        }]);

      if (error) {
        console.error('Error adding collaborator:', error);
        throw new Error(`Failed to add collaborator: ${error.message}`);
      }

      // Log activity
      await this.logActivity('added_collaborator', 'case', caseId, `Added collaborator to case: ${caseData.title}`);

      return true;
    } catch (error) {
      console.error('Error in addCollaborator:', error);
      return false;
    }
  }

  /**
   * Get organization users (for assignment/collaboration)
   */
  async getOrganizationUsers(): Promise<any[]> {
    try {
      const { profile } = await this.getCurrentUserContext();

      const { data, error } = await supabase
        ?.from('user_profiles')
        .select('id, first_name, last_name, role, email')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('first_name');

      if (error) {
        console.error('Error fetching organization users:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getOrganizationUsers:', error);
      throw error;
    }
  }

  /**
   * Get case statistics for current user
   */
  async getCaseStatistics() {
    try {
      // Calculer les statistiques manuellement au lieu d'utiliser une vue
      return this.calculateStatisticsManually();
    } catch (error) {
      console.error('Error in getCaseStatistics:', error);
      return this.calculateStatisticsManually();
    }
  }

  /**
   * Log user activity
   */
  private async logActivity(action: string, entityType: string, entityId: string, description: string) {
    try {
      const { user, profile } = await this.getCurrentUserContext();

      await supabase
        ?.from('activity_log')
        .insert([{
          organization_id: profile.organization_id,
          user_id: user.id,
          case_id: entityType === 'case' ? entityId : null,
          action,
          entity_type: entityType,
          entity_id: entityId,
          description
        }]);
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw - activity logging shouldn't break main functionality
    }
  }

  /**
   * Map Supabase data to Case interface
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
   * Map Case interface to Supabase data
   */
  private mapCaseToSupabase(caseData: Partial<Case>): any {
    const supabaseData: any = {};
    
    if (caseData.title !== undefined) supabaseData.title = caseData.title;
    if (caseData.clientName !== undefined) supabaseData.client_name = caseData.clientName;
    if (caseData.clientPhone !== undefined) supabaseData.client_phone = caseData.clientPhone;
    if (caseData.clientEmail !== undefined) supabaseData.client_email = caseData.clientEmail;
    if (caseData.clientAddress !== undefined) supabaseData.client_address = caseData.clientAddress;
    if (caseData.description !== undefined) supabaseData.description = caseData.description;
    if (caseData.caseType !== undefined) supabaseData.case_type = caseData.caseType;
    if (caseData.priority !== undefined) supabaseData.priority = caseData.priority;
    if (caseData.estimatedValue !== undefined) supabaseData.estimated_value = caseData.estimatedValue;
    if (caseData.deadline !== undefined) supabaseData.deadline = caseData.deadline ? caseData.deadline.toISOString().split('T')[0] : null;
    if (caseData.notes !== undefined) supabaseData.notes = caseData.notes;
    if (caseData.assignedLawyer !== undefined) supabaseData.assigned_lawyer = caseData.assignedLawyer;
    if (caseData.tags !== undefined) supabaseData.tags = caseData.tags;
    if (caseData.documents !== undefined) supabaseData.documents = caseData.documents;
    if (caseData.status !== undefined) supabaseData.status = caseData.status;

    return supabaseData;
  }

  /**
   * Fallback manual statistics calculation
   */
  private async calculateStatisticsManually() {
    try {
      const allCases = await this.getAllCases();
      const activeCases = allCases.filter(c => c.status === 'active');
      
      const totalEstimatedValue = activeCases.reduce((sum, case_) => 
        sum + (case_.estimatedValue || 0), 0
      );

      return {
        totalCases: allCases.length,
        activeCases: activeCases.length,
        closedCases: allCases.filter(c => c.status === 'closed').length,
        urgentCases: allCases.filter(c => c.priority === 'urgent').length,
        upcomingDeadlines: allCases.filter(c => 
          c.deadline && c.deadline <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ).length,
        totalEstimatedValue,
        totalHoursWorked: 0 // Would need to be calculated from time tracking
      };
    } catch (error) {
      console.error('Error in calculateStatisticsManually:', error);
      return {
        totalCases: 0,
        activeCases: 0,
        closedCases: 0,
        urgentCases: 0,
        upcomingDeadlines: 0,
        totalEstimatedValue: 0,
        totalHoursWorked: 0
      };
    }
  }

  /**
   * Check if Supabase is available
   */
  isAvailable(): boolean {
    return supabase !== null;
  }
}

// Create and export a singleton instance
export const multiUserCaseService = new MultiUserCaseService();