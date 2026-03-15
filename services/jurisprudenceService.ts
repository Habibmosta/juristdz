/**
 * Service jurisprudence — CRUD + recherche full-text Supabase
 * Fallback sur mock data si la table n'existe pas encore
 */
import { supabase } from '../src/lib/supabase';
import { searchService } from './searchService';
import type { SearchQuery, SearchResult, JurisprudenceResult } from '../types/search';

export type JurisprudenceStatus = 'pending' | 'under_review' | 'validated' | 'rejected';
export type PrecedentValue = 'binding' | 'persuasive' | 'informative';

export interface JurisprudenceEntry {
  id: string;
  case_number: string;
  decision_date: string;
  jurisdiction: string;
  court_name: string;
  wilaya?: string;
  chamber?: string;
  legal_domain: string;
  summary_fr: string;
  summary_ar?: string;
  full_text_fr?: string;
  full_text_ar?: string;
  keywords: string[];
  legal_references: string[];
  cited_decisions: string[];
  precedent_value: PrecedentValue;
  status: JurisprudenceStatus;
  rejection_reason?: string;
  contributed_by?: string;
  contributor_role?: string;
  source: string;
  view_count: number;
  citation_count: number;
  created_at: string;
}

export interface ContributionPayload {
  case_number: string;
  decision_date: string;
  jurisdiction: string;
  court_name: string;
  wilaya?: string;
  chamber?: string;
  legal_domain: string;
  summary_fr: string;
  summary_ar?: string;
  full_text_fr?: string;
  full_text_ar?: string;
  keywords: string[];
  legal_references: string[];
  cited_decisions?: string[];
  precedent_value: PrecedentValue;
  contributor_role?: string;
}

export const jurisprudenceService = {
  /**
   * Recherche full-text via la fonction RPC Supabase.
   * Fallback sur mock data si la table n'est pas disponible.
   */
  async search(query: SearchQuery): Promise<SearchResult<JurisprudenceResult>> {
    try {
      const { data, error } = await supabase.rpc('search_jurisprudence', {
        query_text: query.text,
        p_domain: query.filters?.domain || null,
        p_jurisdiction: query.filters?.jurisdiction || null,
        p_date_from: query.filters?.dateFrom || null,
        p_date_to: query.filters?.dateTo || null,
        p_limit: query.pageSize ?? 20,
        p_offset: ((query.page ?? 1) - 1) * (query.pageSize ?? 20),
      });

      if (error) throw error;

      const items: JurisprudenceResult[] = (data || []).map((row: any) => ({
        id: row.id,
        caseNumber: row.case_number,
        date: row.decision_date,
        court: { id: row.jurisdiction, name: row.court_name, jurisdiction: row.jurisdiction },
        legalDomain: row.legal_domain,
        summary: row.summary_fr,
        keywords: row.keywords || [],
        citations: (row.legal_references || []).map((ref: string) => ({ reference: ref })),
        precedentValue: row.precedent_value,
        relevanceScore: row.rank,
      }));

      return {
        query,
        items,
        total: items.length,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
        took: 0,
      };
    } catch {
      // Fallback sur mock data
      return searchService.searchJurisprudence(query);
    }
  },

  /**
   * Soumettre une nouvelle décision (statut: pending)
   */
  async contribute(userId: string, payload: ContributionPayload): Promise<JurisprudenceEntry> {
    const { data, error } = await supabase
      .from('jurisprudence')
      .insert([{
        ...payload,
        cited_decisions: payload.cited_decisions || [],
        contributed_by: userId,
        source: 'contribution',
        status: 'pending',
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mes contributions (pour le contributeur)
   */
  async getMyContributions(userId: string): Promise<JurisprudenceEntry[]> {
    const { data, error } = await supabase
      .from('jurisprudence')
      .select('*')
      .eq('contributed_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Contributions en attente (pour les admins/validateurs)
   */
  async getPending(): Promise<JurisprudenceEntry[]> {
    const { data, error } = await supabase
      .from('jurisprudence')
      .select('*, profiles(full_name, profession)')
      .in('status', ['pending', 'under_review'])
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Valider une contribution
   */
  async validate(id: string, validatorId: string): Promise<void> {
    const { error } = await supabase
      .from('jurisprudence')
      .update({ status: 'validated', validated_by: validatorId, validated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Rejeter une contribution
   */
  async reject(id: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('jurisprudence')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Incrémenter le compteur de vues
   */
  async incrementViews(id: string): Promise<void> {
    await supabase.rpc('increment_jurisprudence_views', { entry_id: id }).maybeSingle();
  },
};
