// Document Management System - Database Initialization Service
// This service handles database schema setup and initialization
// Requirements: 8.6, 7.1

import { supabaseService } from './supabaseService';
import { getSupabaseClient } from '../config';

export interface InitializationResult {
  success: boolean;
  message: string;
  errors?: string[];
}

export class DatabaseInitService {
  private client = getSupabaseClient();

  /**
   * Initialize the complete database schema
   */
  async initializeSchema(): Promise<InitializationResult> {
    try {
      console.log('🔧 Starting database schema initialization...');

      // Check if we can connect to the database
      const connectionTest = await supabaseService.testConnection();
      if (!connectionTest) {
        return {
          success: false,
          message: 'Failed to connect to database'
        };
      }

      // Check if tables already exist
      const tablesExist = await this.checkTablesExist();
      if (tablesExist) {
        console.log('✅ Database tables already exist');
        return {
          success: true,
          message: 'Database schema already initialized'
        };
      }

      // Execute schema creation
      const schemaResult = await this.createSchema();
      if (!schemaResult.success) {
        return schemaResult;
      }

      // Create storage bucket
      const bucketResult = await this.createStorageBucket();
      if (!bucketResult.success) {
        console.warn('⚠️ Storage bucket creation failed:', bucketResult.message);
        // Don't fail the entire initialization for bucket creation
      }

      // Verify schema creation
      const verificationResult = await this.verifySchema();
      if (!verificationResult.success) {
        return verificationResult;
      }

      console.log('✅ Database schema initialization completed successfully');
      return {
        success: true,
        message: 'Database schema initialized successfully'
      };

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      return {
        success: false,
        message: 'Database initialization failed',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Check if required tables exist
   */
  private async checkTablesExist(): Promise<boolean> {
    try {
      const requiredTables = [
        'encryption_keys',
        'folders',
        'documents',
        'document_versions',
        'templates',
        'signature_workflows',
        'workflow_signers',
        'document_permissions',
        'share_links',
        'document_comments',
        'audit_trail',
        'document_workflows',
        'workflow_steps'
      ];

      for (const table of requiredTables) {
        const { error } = await this.client
          .from(table)
          .select('count', { count: 'exact', head: true });

        if (error) {
          console.log(`Table ${table} does not exist or is not accessible`);
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create the database schema
   */
  private async createSchema(): Promise<InitializationResult> {
    try {
      console.log('📝 Creating database schema...');

      // Note: In a real implementation, you would execute the SQL schema
      // For now, we'll assume the schema is created manually or via migrations
      // This is because Supabase client doesn't support executing DDL directly

      console.log('⚠️ Schema creation requires manual execution of SQL file');
      console.log('Please execute the SQL file: database/document-management-complete-schema.sql');
      console.log('This can be done through the Supabase dashboard SQL editor');

      return {
        success: true,
        message: 'Schema creation instructions provided - manual execution required'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Schema creation failed',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Create storage bucket for documents
   */
  private async createStorageBucket(): Promise<InitializationResult> {
    try {
      console.log('📁 Creating storage bucket...');

      // Check if bucket already exists
      const { data: buckets, error: listError } = await this.client.storage.listBuckets();
      
      if (listError) {
        return {
          success: false,
          message: 'Failed to list storage buckets',
          errors: [listError.message]
        };
      }

      const bucketExists = buckets?.some(bucket => bucket.name === 'documents');
      
      if (bucketExists) {
        console.log('✅ Storage bucket already exists');
        return {
          success: true,
          message: 'Storage bucket already exists'
        };
      }

      // Create the bucket
      const { error: createError } = await this.client.storage.createBucket('documents', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'text/plain'
        ]
      });

      if (createError) {
        return {
          success: false,
          message: 'Failed to create storage bucket',
          errors: [createError.message]
        };
      }

      console.log('✅ Storage bucket created successfully');
      return {
        success: true,
        message: 'Storage bucket created successfully'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Storage bucket creation failed',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Verify schema creation
   */
  private async verifySchema(): Promise<InitializationResult> {
    try {
      console.log('🔍 Verifying schema creation...');

      const errors: string[] = [];

      // Test basic table access
      const testTables = [
        'documents',
        'folders',
        'templates',
        'audit_trail'
      ];

      for (const table of testTables) {
        try {
          const { error } = await this.client
            .from(table)
            .select('count', { count: 'exact', head: true });

          if (error) {
            errors.push(`Table ${table} verification failed: ${error.message}`);
          }
        } catch (error) {
          errors.push(`Table ${table} access failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Test views
      const testViews = [
        'document_statistics',
        'folder_hierarchy',
        'document_permissions_summary'
      ];

      for (const view of testViews) {
        try {
          const { error } = await this.client
            .from(view)
            .select('*', { head: true });

          if (error) {
            errors.push(`View ${view} verification failed: ${error.message}`);
          }
        } catch (error) {
          errors.push(`View ${view} access failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          message: 'Schema verification failed',
          errors
        };
      }

      console.log('✅ Schema verification completed successfully');
      return {
        success: true,
        message: 'Schema verification successful'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Schema verification failed',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Create sample data for testing
   */
  async createSampleData(): Promise<InitializationResult> {
    try {
      console.log('📊 Creating sample data...');

      // Get current user
      const { user, error: userError } = await supabaseService.getCurrentUser();
      if (userError || !user) {
        return {
          success: false,
          message: 'User authentication required for sample data creation'
        };
      }

      // Create sample encryption key
      const keyResult = await supabaseService.insert('encryption_keys', {
        key_data: btoa(crypto.getRandomValues(new Uint8Array(32)).toString()),
        algorithm: 'AES-256',
        user_id: user.id
      });

      if (!keyResult.success) {
        return {
          success: false,
          message: 'Failed to create sample encryption key',
          errors: [keyResult.error?.message || 'Unknown error']
        };
      }

      // Create sample folder (assuming a case exists)
      const casesResult = await supabaseService.select('cases', 'id', { user_id: user.id }, { page: 1, limit: 1 });
      
      if (casesResult.success && casesResult.data && casesResult.data.length > 0) {
        const caseId = casesResult.data[0].id;

        const folderResult = await supabaseService.insert('folders', {
          case_id: caseId,
          name: 'Sample Documents',
          level: 0,
          path: 'Sample Documents',
          user_id: user.id,
          created_by: user.id
        });

        if (!folderResult.success) {
          console.warn('⚠️ Failed to create sample folder:', folderResult.error?.message);
        }
      }

      // Create sample template
      const templateResult = await supabaseService.insert('templates', {
        name: 'Sample Legal Document',
        description: 'A sample template for legal documents',
        category: 'contract',
        language: 'fr',
        applicable_roles: ['avocat', 'notaire'],
        content: 'This is a sample template with {{client_name}} and {{date}} variables.',
        variables: {
          client_name: { type: 'text', label: 'Client Name', required: true },
          date: { type: 'date', label: 'Document Date', required: true }
        },
        user_id: user.id,
        created_by: user.id
      });

      if (!templateResult.success) {
        console.warn('⚠️ Failed to create sample template:', templateResult.error?.message);
      }

      console.log('✅ Sample data created successfully');
      return {
        success: true,
        message: 'Sample data created successfully'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Sample data creation failed',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Reset database (use with caution)
   */
  async resetDatabase(): Promise<InitializationResult> {
    try {
      console.log('🗑️ Resetting database...');
      console.warn('⚠️ This operation will delete all data!');

      // This would require admin privileges and should be used very carefully
      // For now, we'll just return a warning message

      return {
        success: false,
        message: 'Database reset requires manual execution with admin privileges'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Database reset failed',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Get initialization status
   */
  async getInitializationStatus(): Promise<{
    initialized: boolean;
    tablesExist: boolean;
    bucketExists: boolean;
    hasData: boolean;
  }> {
    try {
      const tablesExist = await this.checkTablesExist();
      
      let bucketExists = false;
      try {
        const { data: buckets } = await this.client.storage.listBuckets();
        bucketExists = buckets?.some(bucket => bucket.name === 'documents') || false;
      } catch (error) {
        // Ignore bucket check errors
      }

      let hasData = false;
      if (tablesExist) {
        try {
          const { data } = await supabaseService.select('documents', 'count', {}, { page: 1, limit: 1 });
          hasData = data && data.length > 0;
        } catch (error) {
          // Ignore data check errors
        }
      }

      return {
        initialized: tablesExist && bucketExists,
        tablesExist,
        bucketExists,
        hasData
      };

    } catch (error) {
      return {
        initialized: false,
        tablesExist: false,
        bucketExists: false,
        hasData: false
      };
    }
  }
}

// Export singleton instance
export const databaseInitService = new DatabaseInitService();
export default databaseInitService;
