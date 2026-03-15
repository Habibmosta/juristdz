/**
 * Service de versioning des documents rédigés
 */
import { supabase } from '../lib/supabase';

export interface DocumentVersion {
  id: string;
  user_id: string;
  document_id: string;
  document_title: string;
  template_id?: string;
  version_number: number;
  content: string;
  language: string;
  change_summary?: string;
  word_count?: number;
  created_at: string;
}

export const documentVersionService = {
  /**
   * Sauvegarder une nouvelle version d'un document
   */
  async saveVersion(params: {
    userId: string;
    documentId: string;
    documentTitle: string;
    templateId?: string;
    content: string;
    language: string;
    changeSummary?: string;
  }): Promise<DocumentVersion | null> {
    try {
      // Obtenir le prochain numéro de version
      const { data: versionNum } = await supabase
        .rpc('get_next_version_number', {
          p_user_id: params.userId,
          p_document_id: params.documentId,
        });

      const wordCount = params.content.trim().split(/\s+/).length;

      const { data, error } = await supabase
        .from('document_versions')
        .insert({
          user_id: params.userId,
          document_id: params.documentId,
          document_title: params.documentTitle,
          template_id: params.templateId,
          version_number: versionNum || 1,
          content: params.content,
          language: params.language,
          change_summary: params.changeSummary,
          word_count: wordCount,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('documentVersionService.saveVersion error:', err);
      return null;
    }
  },

  /**
   * Récupérer toutes les versions d'un document
   */
  async getVersions(userId: string, documentId: string): Promise<DocumentVersion[]> {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('user_id', userId)
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('documentVersionService.getVersions error:', err);
      return [];
    }
  },

  /**
   * Récupérer les documents récents (dernière version de chaque document)
   */
  async getRecentDocuments(userId: string, limit = 20): Promise<DocumentVersion[]> {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit * 3); // fetch more to deduplicate

      if (error) throw error;

      // Keep only the latest version per document_id
      const seen = new Set<string>();
      const unique: DocumentVersion[] = [];
      for (const v of (data || [])) {
        if (!seen.has(v.document_id)) {
          seen.add(v.document_id);
          unique.push(v);
          if (unique.length >= limit) break;
        }
      }
      return unique;
    } catch (err) {
      console.error('documentVersionService.getRecentDocuments error:', err);
      return [];
    }
  },

  /**
   * Supprimer une version spécifique
   */
  async deleteVersion(userId: string, versionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('document_versions')
        .delete()
        .eq('id', versionId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('documentVersionService.deleteVersion error:', err);
      return false;
    }
  },
};
