/**
 * Mock configuration for testing
 */

export const getDMSConfig = () => ({
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'txt'],
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain'
  ],
  encryptionAlgorithm: 'AES-256',
  storageBucket: 'documents',
  maxFolderDepth: 5,
  requireMFA: true,
  sessionTimeout: 30,
  supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://test.supabase.co',
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key',
  enableRLS: true,
  auditTrailEnabled: true,
  connectionPoolSize: 10,
  queryTimeout: 30000,
});

export const DEFAULT_DMS_CONFIG = getDMSConfig();

export const getSupabaseClient = () => {
  const { createClient } = require('@supabase/supabase-js');
  const config = getDMSConfig();
  return createClient(config.supabaseUrl, config.supabaseAnonKey);
};

export const testConnection = async () => true;
export const validateConfig = () => [];
export const getFileTypeFromMimeType = (mimeType: string) => {
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

export const isFileTypeAllowed = (fileType: string) => {
  const config = getDMSConfig();
  return config.allowedFileTypes.includes(fileType.toLowerCase());
};

export const isMimeTypeAllowed = (mimeType: string) => {
  const config = getDMSConfig();
  return config.allowedMimeTypes.includes(mimeType);
};

export const isFileSizeAllowed = (sizeBytes: number) => {
  const config = getDMSConfig();
  return sizeBytes > 0 && sizeBytes <= config.maxFileSize;
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getUserStoragePath = (userId: string, fileName: string) => {
  return `${userId}/${fileName}`;
};

export const generateUniqueFileName = (originalName: string) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');
  return `${nameWithoutExtension}_${timestamp}_${random}.${extension}`;
};