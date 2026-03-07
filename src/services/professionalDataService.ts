import { supabase } from '../lib/supabase';

/**
 * Service unifié pour gérer les données professionnelles
 * Utilise la table 'cases' existante avec des types différents par profession
 */

export interface ProfessionalData {
  id: string;
  user_id: string;
  client_id?: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'archived' | 'closed';
  type?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Mapping des professions vers les types de cases
const PROFESSION_TYPE_MAP: Record<string, string> = {
  notaire: 'acte_notarial',
  huissier: 'constat',
  magistrat: 'jugement',
  juriste_entreprise: 'contrat_entreprise',
  etudiant: 'ressource_pedagogique',
  avocat: 'dossier' // Les avocats utilisent le type par défaut
};

export const professionalDataService = {
  /**
   * Récupérer les données par profession
   */
  async getByProfession(userId: string, profession: string, limit = 50) {
    try {
      const caseType = PROFESSION_TYPE_MAP[profession] || 'dossier';
      
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching professional data:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getByProfession:', error);
      return [];
    }
  },

  /**
   * Récupérer une entrée spécifique
   */
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      return null;
    }
  },

  /**
   * Créer une nouvelle entrée
   */
  async create(userId: string, profession: string, data: Partial<ProfessionalData>) {
    try {
      const caseType = PROFESSION_TYPE_MAP[profession] || 'dossier';
      
      const newData = {
        user_id: userId,
        type: caseType,
        title: data.title || 'Sans titre',
        description: data.description || '',
        status: data.status || 'draft',
        client_id: data.client_id,
        metadata: data.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('cases')
        .insert(newData)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour une entrée
   */
  async update(id: string, data: Partial<ProfessionalData>) {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('cases')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  },

  /**
   * Supprimer une entrée
   */
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  },

  /**
   * Rechercher dans les données
   */
  async search(userId: string, profession: string, searchTerm: string) {
    try {
      const caseType = PROFESSION_TYPE_MAP[profession] || 'dossier';
      
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('user_id', userId)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in search:', error);
      return [];
    }
  },

  /**
   * Obtenir les statistiques
   */
  async getStats(userId: string, profession: string) {
    try {
      const caseType = PROFESSION_TYPE_MAP[profession] || 'dossier';
      
      // Total
      const { count: total, error: totalError } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (totalError) throw totalError;

      // Actifs
      const { count: active, error: activeError } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (activeError) throw activeError;

      // Brouillons
      const { count: draft, error: draftError } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'draft');

      if (draftError) throw draftError;

      // Archivés
      const { count: archived, error: archivedError } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'archived');

      if (archivedError) throw archivedError;

      // Ce mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: thisMonth, error: monthError } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());

      if (monthError) throw monthError;

      return {
        total: total || 0,
        active: active || 0,
        draft: draft || 0,
        archived: archived || 0,
        thisMonth: thisMonth || 0
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      return {
        total: 0,
        active: 0,
        draft: 0,
        archived: 0,
        thisMonth: 0
      };
    }
  }
};
