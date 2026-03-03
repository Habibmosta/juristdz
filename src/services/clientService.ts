import { supabase } from '../lib/supabase';
import type { Client, ClientStats } from '../types/client.types';

export class ClientService {
  // ═══════════════════════════════════════════════════════════════════════════
  // GESTION DES CLIENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Récupérer tous les clients de l'utilisateur
   */
  static async getClients(userId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Récupérer les statistiques des clients
   */
  static async getClientStats(userId: string): Promise<ClientStats[]> {
    const { data, error } = await supabase
      .from('client_stats')
      .select('*')
      .eq('user_id', userId)
      .order('total_billed', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Récupérer un client par ID
   */
  static async getClient(clientId: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Créer un nouveau client
   */
  static async createClient(userId: string, clientData: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: userId,
        ...clientData,
        status: clientData.status || 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mettre à jour un client
   */
  static async updateClient(clientId: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Supprimer un client
   */
  static async deleteClient(clientId: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) throw error;
  }

  /**
   * Rechercher des clients
   */
  static async searchClients(userId: string, query: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,company_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Lier un client à un dossier
   */
  static async linkClientToCase(caseId: string, clientId: string, role: string = 'client'): Promise<void> {
    const { error } = await supabase
      .from('case_clients')
      .insert({
        case_id: caseId,
        client_id: clientId,
        role
      });

    if (error) throw error;
  }

  /**
   * Récupérer les clients d'un dossier
   */
  static async getCaseClients(caseId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('case_clients')
      .select('client_id, clients(*)')
      .eq('case_id', caseId);

    if (error) throw error;
    return data?.map(item => item.clients).filter(Boolean) || [];
  }

  /**
   * Récupérer les dossiers d'un client
   */
  static async getClientCases(clientId: string) {
    const { data, error } = await supabase
      .from('case_clients')
      .select('case_id, cases(*)')
      .eq('client_id', clientId);

    if (error) throw error;
    return data?.map(item => item.cases).filter(Boolean) || [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATISTIQUES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtenir les statistiques globales des clients
   */
  static async getGlobalStats(userId: string) {
    const clients = await this.getClients(userId);
    const stats = await this.getClientStats(userId);

    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'active').length;
    const totalBilled = stats.reduce((sum, s) => sum + (s.total_billed || 0), 0);
    const totalPaid = stats.reduce((sum, s) => sum + (s.total_paid || 0), 0);
    const totalOutstanding = stats.reduce((sum, s) => sum + (s.total_outstanding || 0), 0);

    return {
      totalClients,
      activeClients,
      inactiveClients: totalClients - activeClients,
      totalBilled,
      totalPaid,
      totalOutstanding,
      collectionRate: totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0
    };
  }
}
