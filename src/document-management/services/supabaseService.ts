// Document Management System - Supabase Service
// This service handles all Supabase database operations for the DMS
// Requirements: 8.6, 7.1

import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { getSupabaseClient, getDMSConfig } from '../config';

export interface DatabaseResult<T> {
  data: T | null;
  error: PostgrestError | Error | null;
  success: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
}

export class SupabaseService {
  private client: SupabaseClient;
  private config: ReturnType<typeof getDMSConfig>;

  constructor() {
    this.client = getSupabaseClient();
    this.config = getDMSConfig();
  }

  // =====================================================
  // GENERIC DATABASE OPERATIONS
  // =====================================================

  /**
   * Generic select operation with filtering and pagination
   */
  async select<T>(
    table: string,
    columns: string = '*',
    filters?: FilterOptions,
    pagination?: PaginationOptions
  ): Promise<DatabaseResult<T[]>> {
    try {
      let query = this.client.from(table).select(columns);

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (typeof value === 'string' && value.includes('%')) {
              query = query.like(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      // Apply pagination and ordering
      if (pagination) {
        const { page, limit, orderBy = 'created_at', orderDirection = 'desc' } = pagination;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query
          .order(orderBy, { ascending: orderDirection === 'asc' })
          .range(from, to);
      }

      const { data, error } = await query;

      return {
        data: data as T[],
        error,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * Generic insert operation
   */
  async insert<T>(table: string, data: Partial<T>): Promise<DatabaseResult<T>> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select()
        .single();

      return {
        data: result as T,
        error,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * Generic update operation
   */
  async update<T>(
    table: string,
    id: string,
    data: Partial<T>
  ): Promise<DatabaseResult<T>> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      return {
        data: result as T,
        error,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * Generic delete operation (soft delete by default)
   */
  async delete(table: string, id: string, hardDelete: boolean = false): Promise<DatabaseResult<void>> {
    try {
      let query;
      
      if (hardDelete) {
        query = this.client.from(table).delete().eq('id', id);
      } else {
        // Soft delete - set is_deleted = true
        query = this.client
          .from(table)
          .update({ is_deleted: true, deleted_at: new Date().toISOString() })
          .eq('id', id);
      }

      const { error } = await query;

      return {
        data: null,
        error,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  // =====================================================
  // DOCUMENT-SPECIFIC OPERATIONS
  // =====================================================

  /**
   * Get documents with case and folder information
   */
  async getDocumentsWithDetails(
    filters?: FilterOptions,
    pagination?: PaginationOptions
  ): Promise<DatabaseResult<any[]>> {
    try {
      let query = this.client
        .from('documents')
        .select(`
          *,
          cases:case_id(id, title, client_name),
          folders:folder_id(id, name, path),
          document_versions!current_version_id(id, version_number, created_at),
          created_by_user:created_by(id, email)
        `)
        .eq('is_deleted', false);

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply pagination
      if (pagination) {
        const { page, limit, orderBy = 'created_at', orderDirection = 'desc' } = pagination;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query
          .order(orderBy, { ascending: orderDirection === 'asc' })
          .range(from, to);
      }

      const { data, error } = await query;

      return {
        data,
        error,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * Get folder hierarchy for a case
   */
  async getFolderHierarchy(caseId: string): Promise<DatabaseResult<any[]>> {
    try {
      const { data, error } = await this.client
        .rpc('get_folder_hierarchy', { case_id: caseId });

      return {
        data,
        error,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * Search documents by content, tags, or metadata
   */
  async searchDocuments(
    searchQuery: string,
    filters?: FilterOptions,
    pagination?: PaginationOptions
  ): Promise<DatabaseResult<any[]>> {
    try {
      let query = this.client
        .from('documents')
        .select(`
          *,
          cases:case_id(id, title, client_name),
          folders:folder_id(id, name, path)
        `)
        .eq('is_deleted', false);

      // Apply text search
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
      }

      // Apply additional filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply pagination
      if (pagination) {
        const { page, limit, orderBy = 'created_at', orderDirection = 'desc' } = pagination;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query
          .order(orderBy, { ascending: orderDirection === 'asc' })
          .range(from, to);
      }

      const { data, error } = await query;

      return {
        data,
        error,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  // =====================================================
  // STORAGE OPERATIONS
  // =====================================================

  /**
   * Upload file to Supabase storage
   */
  async uploadFile(
    filePath: string,
    file: File | Buffer,
    options?: { upsert?: boolean; contentType?: string }
  ): Promise<DatabaseResult<{ path: string; fullPath: string }>> {
    try {
      const { data, error } = await this.client.storage
        .from(this.config.storageBucket)
        .upload(filePath, file, {
          upsert: options?.upsert || false,
          contentType: options?.contentType
        });

      if (error) {
        return {
          data: null,
          error,
          success: false
        };
      }

      return {
        data: {
          path: data.path,
          fullPath: data.fullPath
        },
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * Download file from Supabase storage
   */
  async downloadFile(filePath: string): Promise<DatabaseResult<Blob>> {
    try {
      const { data, error } = await this.client.storage
        .from(this.config.storageBucket)
        .download(filePath);

      return {
        data,
        error,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * Delete file from Supabase storage
   */
  async deleteFile(filePath: string): Promise<DatabaseResult<void>> {
    try {
      const { error } = await this.client.storage
        .from(this.config.storageBucket)
        .remove([filePath]);

      return {
        data: null,
        error,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * Get signed URL for file access
   */
  async getSignedUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<DatabaseResult<{ signedUrl: string }>> {
    try {
      const { data, error } = await this.client.storage
        .from(this.config.storageBucket)
        .createSignedUrl(filePath, expiresIn);

      return {
        data: data ? { signedUrl: data.signedUrl } : null,
        error,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  // =====================================================
  // AUDIT TRAIL OPERATIONS
  // =====================================================

  /**
   * Create audit trail entry
   */
  async createAuditEntry(
    entityType: string,
    entityId: string,
    action: string,
    details?: Record<string, any>
  ): Promise<DatabaseResult<any>> {
    try {
      const auditData = {
        entity_type: entityType,
        entity_id: entityId,
        action,
        details: details || {},
        timestamp: new Date().toISOString(),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      };

      return await this.insert('audit_trail', auditData);
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * Get audit trail for an entity
   */
  async getAuditTrail(
    entityType: string,
    entityId: string,
    pagination?: PaginationOptions
  ): Promise<DatabaseResult<any[]>> {
    return await this.select(
      'audit_trail',
      '*',
      { entity_type: entityType, entity_id: entityId },
      pagination || { page: 1, limit: 50, orderBy: 'timestamp', orderDirection: 'desc' }
    );
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      return { user, error };
    } catch (error) {
      return { user: null, error };
    }
  }

  /**
   * Check if user has permission for a document
   */
  async checkDocumentPermission(
    documentId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('document_permissions')
        .select('id')
        .eq('document_id', documentId)
        .eq('permission', permission)
        .or('expires_at.is.null,expires_at.gt.now()')
        .limit(1);

      return !error && data && data.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string | null> {
    try {
      // This is a best effort to get client IP
      // In production, you might want to use a proper IP detection service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Execute raw SQL query (use with caution)
   */
  async executeRawQuery(query: string, params?: any[]): Promise<DatabaseResult<any>> {
    try {
      const { data, error } = await this.client.rpc('execute_sql', {
        query,
        params: params || []
      });

      return {
        data,
        error,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.client.from('cases').select('count', { count: 'exact', head: true });
      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<DatabaseResult<any>> {
    try {
      const { data, error } = await this.client
        .from('document_statistics')
        .select('*')
        .single();

      return {
        data,
        error,
        success: !error
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        success: false
      };
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
export default supabaseService;
