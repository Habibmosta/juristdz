// Document Management System - Configuration
// This file contains configuration settings for the DMS
// Requirements: 8.6, 7.1

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface DMSConfig {
  // File upload settings
  maxFileSize: number; // in bytes
  allowedFileTypes: string[];
  allowedMimeTypes: string[];
  
  // Storage settings
  encryptionAlgorithm: string;
  storageBucket: string;
  
  // Folder settings
  maxFolderDepth: number;
  
  // Security settings
  requireMFA: boolean;
  sessionTimeout: number; // in minutes
  
  // Integration settings
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  
  // Database settings
  enableRLS: boolean;
  auditTrailEnabled: boolean;
  
  // Performance settings
  connectionPoolSize: number;
  queryTimeout: number; // in milliseconds
}

// Helper function to get environment variables (works in both browser and Node.js)
const getEnvVar = (key: string): string | undefined => {
  // In test environment or Node.js, use process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  
  // In browser environment, use import.meta.env
  if (typeof globalThis !== 'undefined' && (globalThis as any).importMeta?.env) {
    return (globalThis as any).importMeta.env[key];
  }
  
  // Fallback for browser - only try if we're not in Node.js
  if (typeof process === 'undefined') {
    try {
      return (import.meta as any).env[key];
    } catch {
      return undefined;
    }
  }
  
  return undefined;
};

export const DEFAULT_DMS_CONFIG: DMSConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB as per requirement 1.2
  allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'txt'], // As per requirement 1.1
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain'
  ],
  encryptionAlgorithm: 'AES-256', // As per requirement 7.1
  storageBucket: 'documents',
  maxFolderDepth: 5, // As per requirement 2.2
  requireMFA: true, // As per requirement 7.5
  sessionTimeout: 30,
  supabaseUrl: getEnvVar('VITE_SUPABASE_URL'),
  supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  enableRLS: true, // Row Level Security enabled by default
  auditTrailEnabled: true, // As per requirement 7.3
  connectionPoolSize: 10,
  queryTimeout: 30000, // 30 seconds
};

export const getDMSConfig = (): DMSConfig => {
  return {
    ...DEFAULT_DMS_CONFIG,
    // Override with environment variables if available
    supabaseUrl: getEnvVar('VITE_SUPABASE_URL') || DEFAULT_DMS_CONFIG.supabaseUrl,
    supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY') || DEFAULT_DMS_CONFIG.supabaseAnonKey,
  };
};

// Supabase client instance
let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    const config = getDMSConfig();
    
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error('Supabase configuration is missing. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }
    
    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'X-Client-Info': 'juristdz-dms@1.0.0'
        }
      }
    });
    
    // Test connection on initialization
    testConnection();
  }
  
  return supabaseClient;
};

// Test Supabase connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('cases').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test error:', error);
    return false;
  }
};

// Validate DMS configuration
export const validateConfig = (config: DMSConfig): string[] => {
  const errors: string[] = [];
  
  if (!config.supabaseUrl) {
    errors.push('Supabase URL is required');
  }
  
  if (!config.supabaseAnonKey) {
    errors.push('Supabase anonymous key is required');
  }
  
  if (config.maxFileSize <= 0) {
    errors.push('Maximum file size must be greater than 0');
  }
  
  if (config.maxFileSize > 100 * 1024 * 1024) { // 100MB absolute limit
    errors.push('Maximum file size cannot exceed 100MB');
  }
  
  if (config.allowedFileTypes.length === 0) {
    errors.push('At least one file type must be allowed');
  }
  
  if (config.maxFolderDepth < 1 || config.maxFolderDepth > 10) {
    errors.push('Maximum folder depth must be between 1 and 10');
  }
  
  if (config.sessionTimeout < 5 || config.sessionTimeout > 1440) { // 5 minutes to 24 hours
    errors.push('Session timeout must be between 5 and 1440 minutes');
  }
  
  return errors;
};

// Get file type from MIME type
export const getFileTypeFromMimeType = (mimeType: string): string => {
  const mimeToType: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'text/plain': 'txt'
  };
  
  return mimeToType[mimeType] || 'unknown';
};

// Check if file type is allowed
export const isFileTypeAllowed = (fileType: string): boolean => {
  const config = getDMSConfig();
  return config.allowedFileTypes.includes(fileType.toLowerCase());
};

// Check if MIME type is allowed
export const isMimeTypeAllowed = (mimeType: string): boolean => {
  const config = getDMSConfig();
  return config.allowedMimeTypes.includes(mimeType);
};

// Check if file size is within limits
export const isFileSizeAllowed = (sizeBytes: number): boolean => {
  const config = getDMSConfig();
  return sizeBytes > 0 && sizeBytes <= config.maxFileSize;
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get storage path for user documents
export const getUserStoragePath = (userId: string, fileName: string): string => {
  return `${userId}/${fileName}`;
};

// Generate unique file name to prevent conflicts
export const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');
  
  return `${nameWithoutExtension}_${timestamp}_${random}.${extension}`;
};