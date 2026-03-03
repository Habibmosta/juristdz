/**
 * Document Service - Gestion des documents par dossier
 * Sprint 1: Fonctionnalités essentielles
 * Date: 03/03/2026
 */

import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface CaseDocument {
  id: string;
  caseId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  storagePath: string;
  storageBucket: string;
  category: DocumentCategory;
  description?: string;
  tags?: string[];
  version: number;
  parentDocumentId?: string;
  isLatestVersion: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentCategory = 
  | 'piece'           // Pièce jointe
  | 'conclusion'      // Conclusion, mémoire
  | 'jugement'        // Jugement, ordonnance
  | 'correspondance'  // Lettres, emails
  | 'contrat'         // Contrats
  | 'autre';          // Autre

export interface DocumentUploadOptions {
  category?: DocumentCategory;
  description?: string;
  tags?: string[];
}

export interface DocumentStats {
  totalDocuments: number;
  totalSizeMB: number;
  documentsByCategory: Record<DocumentCategory, number>;
  recentDocuments: CaseDocument[];
}

export interface DocumentSearchFilters {
  caseId?: string;
  category?: DocumentCategory;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const STORAGE_BUCKET = 'case-documents';

// Limites par plan
const PLAN_LIMITS = {
  free: {
    maxDocuments: 5,
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    maxTotalStorage: 50 * 1024 * 1024, // 50 MB
  },
  pro: {
    maxDocuments: Infinity,
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    maxTotalStorage: 10 * 1024 * 1024 * 1024, // 10 GB
  },
  cabinet: {
    maxDocuments: Infinity,
    maxFileSize: 100 * 1024 * 1024, // 100 MB
    maxTotalStorage: 100 * 1024 * 1024 * 1024, // 100 GB
  },
};

// Types MIME autorisés
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'text/plain',
];

// ============================================================================
// SERVICE CLASS
// ============================================================================

class DocumentService {
  /**
   * Upload un document vers Supabase Storage
   */
  async uploadDocument(
    caseId: string,
    file: File,
    options: DocumentUploadOptions = {}
  ): Promise<CaseDocument> {
    try {
      // 1. Vérifications préliminaires
      await this.validateUpload(file);

      // 2. Obtenir l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 3. Vérifier les quotas
      await this.checkQuotas(user.id, file.size);

      // 4. Générer le chemin de stockage
      const storagePath = this.generateStoragePath(user.id, caseId, file.name);

      // 5. Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // 6. Créer l'entrée dans la base de données
      const documentData = {
        case_id: caseId,
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        file_type: this.getFileExtension(file.name),
        mime_type: file.type,
        storage_path: storagePath,
        storage_bucket: STORAGE_BUCKET,
        category: options.category || 'autre',
        description: options.description,
        tags: options.tags || [],
        version: 1,
        is_latest_version: true,
      };

      const { data, error } = await supabase
        .from('case_documents')
        .insert(documentData)
        .select()
        .single();

      if (error) {
        // Rollback: supprimer le fichier du storage
        await this.deleteFromStorage(storagePath);
        console.error('Database insert error:', error);
        throw new Error(`Failed to save document metadata: ${error.message}`);
      }

      console.log('✅ Document uploaded successfully:', data.file_name);
      return this.mapToDocument(data);
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Télécharger un document
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      // 1. Récupérer les métadonnées
      const document = await this.getDocument(documentId);

      // 2. Télécharger depuis Storage
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(document.storagePath);

      if (error) {
        console.error('Storage download error:', error);
        throw new Error(`Failed to download file: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'URL signée pour prévisualisation
   */
  async getDocumentUrl(documentId: string, expiresIn: number = 3600): Promise<string> {
    try {
      const document = await this.getDocument(documentId);

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(document.storagePath, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      throw error;
    }
  }

  /**
   * Obtenir un document par ID
   */
  async getDocument(documentId: string): Promise<CaseDocument> {
    try {
      const { data, error } = await supabase
        .from('case_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('Error fetching document:', error);
        throw new Error(`Document not found: ${error.message}`);
      }

      return this.mapToDocument(data);
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  /**
   * Lister les documents d'un dossier
   */
  async getDocumentsByCase(caseId: string): Promise<CaseDocument[]> {
    try {
      const { data, error } = await supabase
        .from('case_documents')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      return (data || []).map(this.mapToDocument);
    } catch (error) {
      console.error('Error getting documents by case:', error);
      throw error;
    }
  }

  /**
   * Supprimer un document
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // 1. Récupérer les métadonnées
      const document = await this.getDocument(documentId);

      // 2. Supprimer de la base de données
      const { error: dbError } = await supabase
        .from('case_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw new Error(`Failed to delete document metadata: ${dbError.message}`);
      }

      // 3. Supprimer du storage
      await this.deleteFromStorage(document.storagePath);

      console.log('✅ Document deleted successfully:', document.fileName);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les métadonnées d'un document
   */
  async updateDocumentMetadata(
    documentId: string,
    updates: Partial<Pick<CaseDocument, 'category' | 'description' | 'tags'>>
  ): Promise<CaseDocument> {
    try {
      const { data, error } = await supabase
        .from('case_documents')
        .update({
          category: updates.category,
          description: updates.description,
          tags: updates.tags,
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating document:', error);
        throw new Error(`Failed to update document: ${error.message}`);
      }

      return this.mapToDocument(data);
    } catch (error) {
      console.error('Error updating document metadata:', error);
      throw error;
    }
  }

  /**
   * Rechercher dans les documents
   */
  async searchDocuments(
    query: string,
    filters: DocumentSearchFilters = {}
  ): Promise<CaseDocument[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Utiliser la fonction SQL de recherche
      const { data, error } = await supabase.rpc('search_case_documents', {
        p_user_id: user.id,
        p_search_query: query,
        p_case_id: filters.caseId || null,
        p_category: filters.category || null,
        p_limit: 50,
      });

      if (error) {
        console.error('Search error:', error);
        throw new Error(`Search failed: ${error.message}`);
      }

      return (data || []).map(this.mapToDocument);
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des documents d'un dossier
   */
  async getCaseDocumentStats(caseId: string): Promise<DocumentStats> {
    try {
      const { data, error } = await supabase.rpc('get_case_document_stats', {
        p_case_id: caseId,
      });

      if (error) {
        console.error('Error fetching stats:', error);
        throw new Error(`Failed to fetch stats: ${error.message}`);
      }

      const stats = data[0] || {
        total_documents: 0,
        total_size_mb: 0,
        documents_by_category: {},
        recent_documents: [],
      };

      return {
        totalDocuments: stats.total_documents,
        totalSizeMB: stats.total_size_mb,
        documentsByCategory: stats.documents_by_category || {},
        recentDocuments: (stats.recent_documents || []).map(this.mapToDocument),
      };
    } catch (error) {
      console.error('Error getting document stats:', error);
      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Valider l'upload d'un fichier
   */
  private async validateUpload(file: File): Promise<void> {
    // Vérifier le type MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(
        `Type de fichier non autorisé: ${file.type}. Types autorisés: PDF, Word, Images, Texte.`
      );
    }

    // Vérifier la taille (limite absolue: 100 MB)
    if (file.size > 100 * 1024 * 1024) {
      throw new Error('Fichier trop volumineux. Taille maximale: 100 MB.');
    }

    // Vérifier le nom du fichier
    if (!file.name || file.name.length > 255) {
      throw new Error('Nom de fichier invalide.');
    }
  }

  /**
   * Vérifier les quotas de l'utilisateur
   */
  private async checkQuotas(userId: string, fileSize: number): Promise<void> {
    // Récupérer le profil utilisateur pour connaître son plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    const plan = profile?.subscription_plan || 'free';
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    // Vérifier la taille du fichier
    if (fileSize > limits.maxFileSize) {
      throw new Error(
        `Fichier trop volumineux pour votre plan ${plan.toUpperCase()}. ` +
        `Taille maximale: ${this.formatFileSize(limits.maxFileSize)}.`
      );
    }

    // Vérifier le nombre de documents
    const { count } = await supabase
      .from('case_documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count !== null && count >= limits.maxDocuments) {
      throw new Error(
        `Limite de documents atteinte pour votre plan ${plan.toUpperCase()}. ` +
        `Maximum: ${limits.maxDocuments} documents.`
      );
    }

    // Vérifier le stockage total
    const { data: stats } = await supabase
      .from('user_document_stats')
      .select('total_size_bytes')
      .eq('user_id', userId)
      .single();

    const currentStorage = stats?.total_size_bytes || 0;
    if (currentStorage + fileSize > limits.maxTotalStorage) {
      throw new Error(
        `Limite de stockage atteinte pour votre plan ${plan.toUpperCase()}. ` +
        `Maximum: ${this.formatFileSize(limits.maxTotalStorage)}.`
      );
    }
  }

  /**
   * Générer le chemin de stockage
   */
  private generateStoragePath(userId: string, caseId: string, fileName: string): string {
    // Nettoyer le nom du fichier
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${cleanFileName}`;
    
    return `${userId}/${caseId}/${uniqueFileName}`;
  }

  /**
   * Supprimer un fichier du storage
   */
  private async deleteFromStorage(storagePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.error('Error deleting from storage:', error);
      // Ne pas throw ici, juste logger
    }
  }

  /**
   * Obtenir l'extension d'un fichier
   */
  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Formater la taille d'un fichier
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  /**
   * Mapper les données de la base vers l'interface CaseDocument
   */
  private mapToDocument(data: any): CaseDocument {
    return {
      id: data.id,
      caseId: data.case_id,
      userId: data.user_id,
      fileName: data.file_name,
      fileSize: data.file_size,
      fileType: data.file_type,
      mimeType: data.mime_type,
      storagePath: data.storage_path,
      storageBucket: data.storage_bucket,
      category: data.category,
      description: data.description,
      tags: data.tags || [],
      version: data.version,
      parentDocumentId: data.parent_document_id,
      isLatestVersion: data.is_latest_version,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const documentService = new DocumentService();
