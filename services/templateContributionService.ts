import { supabase } from './supabaseClient';
import { UserRole } from '../types';

export interface TemplateField {
  name: string;
  label_fr: string;
  label_ar: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select';
  required: boolean;
  options?: string[];
}

export interface TemplateContribution {
  id?: string;
  user_id: string;
  user_role: UserRole;
  name_fr: string;
  name_ar: string;
  description_fr?: string;
  description_ar?: string;
  category: string;
  wilaya?: string;
  tribunal?: string;
  source: 'cabinet' | 'tribunal' | 'notaire' | 'huissier' | 'autre';
  is_public: boolean;
  template_content: string;
  template_format: 'text' | 'docx' | 'pdf';
  fields: TemplateField[];
  status?: 'pending_review' | 'approved' | 'rejected' | 'needs_revision';
  usage_count?: number;
  rating?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TemplateRating {
  template_id: string;
  user_id: string;
  rating: number;
  comment?: string;
}

export interface TemplateUsageLog {
  template_id: string;
  user_id: string;
  success: boolean;
  feedback?: string;
}

export interface TemplateSuggestion {
  template_id: string;
  user_id: string;
  suggestion_type: 'correction' | 'addition' | 'clarification' | 'autre';
  suggestion_text: string;
}

class TemplateContributionService {
  /**
   * Soumettre une nouvelle contribution de template
   */
  async submitContribution(contribution: TemplateContribution): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('template_contributions')
        .insert([{
          user_id: contribution.user_id,
          user_role: contribution.user_role,
          name_fr: contribution.name_fr,
          name_ar: contribution.name_ar,
          description_fr: contribution.description_fr,
          description_ar: contribution.description_ar,
          category: contribution.category,
          wilaya: contribution.wilaya,
          tribunal: contribution.tribunal,
          source: contribution.source,
          is_public: contribution.is_public,
          template_content: contribution.template_content,
          template_format: contribution.template_format,
          fields: contribution.fields,
          status: 'pending_review'
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error submitting contribution:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Récupérer les contributions d'un utilisateur
   */
  async getUserContributions(userId: string): Promise<TemplateContribution[]> {
    try {
      const { data, error } = await supabase
        .from('template_contributions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user contributions:', error);
      return [];
    }
  }

  /**
   * Rechercher des templates approuvés
   */
  async searchTemplates(
    query?: string,
    category?: string,
    wilaya?: string,
    role?: UserRole
  ): Promise<TemplateContribution[]> {
    try {
      const { data, error } = await supabase.rpc('search_templates', {
        search_query: query || null,
        filter_category: category || null,
        filter_wilaya: wilaya || null,
        filter_role: role || null
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching templates:', error);
      return [];
    }
  }

  /**
   * Récupérer un template par ID
   */
  async getTemplateById(templateId: string): Promise<TemplateContribution | null> {
    try {
      const { data, error } = await supabase
        .from('template_contributions')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  /**
   * Évaluer un template
   */
  async rateTemplate(rating: TemplateRating): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('template_ratings')
        .upsert([rating], { onConflict: 'template_id,user_id' });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error rating template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Logger l'utilisation d'un template
   */
  async logTemplateUsage(log: TemplateUsageLog): Promise<void> {
    try {
      await supabase
        .from('template_usage_logs')
        .insert([log]);
    } catch (error) {
      console.error('Error logging template usage:', error);
    }
  }

  /**
   * Soumettre une suggestion d'amélioration
   */
  async submitSuggestion(suggestion: TemplateSuggestion): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('template_improvement_suggestions')
        .insert([suggestion]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Récupérer les templates les plus populaires
   */
  async getPopularTemplates(limit: number = 10): Promise<TemplateContribution[]> {
    try {
      const { data, error } = await supabase
        .from('template_contributions')
        .select('*')
        .eq('status', 'approved')
        .eq('is_public', true)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching popular templates:', error);
      return [];
    }
  }

  /**
   * Récupérer les templates les mieux notés
   */
  async getTopRatedTemplates(limit: number = 10): Promise<TemplateContribution[]> {
    try {
      const { data, error } = await supabase
        .from('template_contributions')
        .select('*')
        .eq('status', 'approved')
        .eq('is_public', true)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching top rated templates:', error);
      return [];
    }
  }

  /**
   * Récupérer les statistiques d'un template
   */
  async getTemplateStatistics(templateId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('template_statistics')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching template statistics:', error);
      return null;
    }
  }

  /**
   * Récupérer les templates par wilaya
   */
  async getTemplatesByWilaya(wilaya: string): Promise<TemplateContribution[]> {
    try {
      const { data, error } = await supabase
        .from('template_contributions')
        .select('*')
        .eq('status', 'approved')
        .eq('is_public', true)
        .eq('wilaya', wilaya)
        .order('rating', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates by wilaya:', error);
      return [];
    }
  }

  /**
   * Récupérer les templates par catégorie et rôle
   */
  async getTemplatesByCategoryAndRole(
    category: string,
    role: UserRole
  ): Promise<TemplateContribution[]> {
    try {
      const { data, error } = await supabase
        .from('template_contributions')
        .select('*')
        .eq('status', 'approved')
        .eq('is_public', true)
        .eq('category', category)
        .eq('user_role', role)
        .order('rating', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates by category and role:', error);
      return [];
    }
  }

  /**
   * Mettre à jour une contribution (seulement si pending)
   */
  async updateContribution(
    templateId: string,
    updates: Partial<TemplateContribution>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('template_contributions')
        .update(updates)
        .eq('id', templateId)
        .eq('status', 'pending_review');

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating contribution:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Supprimer une contribution (seulement si pending)
   */
  async deleteContribution(templateId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('template_contributions')
        .delete()
        .eq('id', templateId)
        .eq('user_id', userId)
        .eq('status', 'pending_review');

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting contribution:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const templateContributionService = new TemplateContributionService();
