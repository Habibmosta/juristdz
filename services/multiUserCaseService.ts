import { Case } from '../types';
import { supabase } from './supabaseClient';
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
      const { profile } = await this.getCurrentUserContext();

      const { data, error } = await supabase
        ?.from(this.tableName)
        .select(`
          *,
          client:clients(*),
          created_by_user:user_profiles!cases_created_by_fkey(first_name, last_name),
          assigned_to_user:user_profiles!cases_assigned_to_fkey(first_name, last_name),
          collaborators:case_collaborators(
            user:user_profiles(first_name, last_name, role)
          )
        `)
        .eq('organization_id', profile.organization_id)
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

      // Prepare case data with proper user and organization context
      const supabaseData = {
        ...this.mapCaseToSupabase(caseData),
        organization_id: profile.organization_id,
        created_by: user.id,
        assigned_to: caseData.assignedLawyer ? caseData.assignedLawyer : user.id, // Default to creator
      };

      // Remove fields that shouldn't be set directly
      delete supabaseData.id;
      delete supabaseData.created_at;
      delete supabaseData.updated_at;

      const { data, error } = await supabase
        ?.from(this.tableName)
        .insert([supabaseData])
        .select(`
          *,
          client:clients(*),
          created_by_user:user_profiles!cases_created_by_fkey(first_name, last_name),
          assigned_to_user:user_profiles!cases_assigned_to_fkey(first_name, last_name)
        `)
        .single();

      if (error) {
        console.error('Error creating case:', error);
        throw new Error(`Failed to create case: ${error.message}`);
      }

      // Log activity
      await this.logActivity('created', 'case', data.id, `Created case: ${data.title}`);

      return this.mapSupabaseToCase(data);
    } catch (error) {
      console.error('Error in createCase:', error);
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
      const { user } = await this.getCurrentUserContext();

      const { data, error } = await supabase
        ?.from('user_case_statistics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching case statistics:', error);
        // Fallback to manual calculation
        return this.calculateStatisticsManually();
      }

      return {
        totalCases: data.total_cases || 0,
        activeCases: data.active_cases || 0,
        closedCases: data.closed_cases || 0,
        urgentCases: data.urgent_cases || 0,
        upcomingDeadlines: data.upcoming_deadlines || 0,
        totalEstimatedValue: parseFloat(data.total_estimated_value || '0'),
        totalHoursWorked: parseFloat(data.total_hours_worked || '0')
      };
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
      clientName: data.client?.first_name && data.client?.last_name 
        ? `${data.client.first_name} ${data.client.last_name}` 
        : data.client?.company_name || 'Client inconnu',
      clientPhone: data.client?.phone,
      clientEmail: data.client?.email,
      clientAddress: data.client?.address,
      description: data.description,
      caseType: data.case_type,
      priority: data.priority,
      estimatedValue: data.estimated_value ? parseFloat(data.estimated_value) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      status: data.status,
      notes: data.notes,
      assignedLawyer: data.assigned_to_user 
        ? `${data.assigned_to_user.first_name} ${data.assigned_to_user.last_name}`
        : undefined,
      tags: data.tags || [],
      documents: [], // Will be loaded separately if needed
      createdAt: new Date(data.created_at),
      lastUpdated: new Date(data.updated_at),
      
      // Additional multi-user fields
      createdBy: data.created_by_user 
        ? `${data.created_by_user.first_name} ${data.created_by_user.last_name}`
        : undefined,
      collaborators: data.collaborators?.map((c: any) => ({
        name: `${c.user.first_name} ${c.user.last_name}`,
        role: c.user.role
      })) || []
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
      description: caseData.description,
      case_type: caseData.caseType,
      priority: caseData.priority,
      estimated_value: caseData.estimatedValue,
      deadline: caseData.deadline ? caseData.deadline.toISOString().split('T')[0] : null,
      status: caseData.status,
      notes: caseData.notes,
      tags: caseData.tags || []
    };

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