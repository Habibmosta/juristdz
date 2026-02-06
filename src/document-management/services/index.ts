// Document Management System - Services
// This file exports all service implementations for the DMS

export { supabaseService, SupabaseService } from './supabaseService';
export { databaseInitService, DatabaseInitService } from './databaseInitService';
export { fileUploadService, FileUploadService } from './fileUploadService';
export { encryptionService, EncryptionService } from './encryptionService';
export { fileStorageService, FileStorageService } from './fileStorageService';
export { documentService, DocumentService } from './documentService';
export { folderService, FolderService } from './folderService';
export { taggingService, TaggingService } from './taggingService';
export { contentExtractionService, ContentExtractionService } from './contentExtractionService';
export { searchService, SearchService } from './searchService';
export { templateProcessingService, TemplateProcessingService } from './templateProcessingService';
export { templateManagementService, TemplateManagementService } from './templateManagementService';
export { customTemplateService, CustomTemplateService } from './customTemplateService';
export { accessControlService, AccessControlService } from './accessControlService';
export { enhancedAuthenticationService, EnhancedAuthenticationService } from './enhancedAuthenticationService';
export { auditService, AuditService } from './auditService';
export { dataRetentionService, DataRetentionService } from './dataRetentionService';
export { versionControlService, VersionControlService } from './versionControlService';
export { documentComparisonService, DocumentComparisonService } from './documentComparisonService';
export { diffVisualizationService, DiffVisualizationService } from './diffVisualizationService';
export { documentSharingService, DocumentSharingService } from './documentSharingService';
export { concurrentEditingService, ConcurrentEditingService } from './concurrentEditingService';
export { notificationService, NotificationService } from './notificationService';
export { languagePreferenceService, LanguagePreferenceService } from './languagePreferenceService';

export type { DatabaseResult, PaginationOptions, FilterOptions } from './supabaseService';
export type { InitializationResult } from './databaseInitService';
export type { 
  FileValidationResult, 
  FileUploadOptions, 
  FileUploadResult, 
  VirusScanResult 
} from './fileUploadService';
export type {
  EncryptionConfig,
  EncryptionKey,
  EncryptionResult,
  DecryptionResult,
  FileEncryptionMetadata
} from './encryptionService';
export type {
  StorageConfig,
  StorageOptions,
  StorageResult,
  RetrievalResult,
  FileStorageMetadata,
  ListingOptions,
  ListingResult
} from './fileStorageService';
export type {
  DocumentQueryOptions,
  DocumentUpdateRequest,
  DocumentOperationResult,
  DocumentListResult,
  DocumentStatistics
} from './documentService';
export type {
  FolderCreateRequest,
  FolderUpdateRequest,
  FolderQueryOptions,
  FolderOperationResult,
  FolderListResult,
  FolderContentsResult,
  HierarchyValidationResult
} from './folderService';
export type {
  Tag,
  TagCreateRequest,
  TagUpdateRequest,
  TagQueryOptions,
  TagOperationResult,
  TagListResult,
  TagAssignmentResult,
  TagStatistics,
  DocumentTagAssignment
} from './taggingService';
export type {
  ContentExtractionResult,
  ExtractedMetadata,
  ContentIndexingResult,
  IndexedContent,
  ExtractedEntity,
  ContentProcessingOptions
} from './contentExtractionService';
export type {
  SearchQuery,
  SearchFilters,
  SearchResult,
  SearchResults,
  SearchFacets,
  SearchOptions,
  AutoCompleteSuggestion
} from './searchService';
export type {
  TemplateProcessingOptions,
  VariableValidationError,
  DocumentGenerationResult,
  TemplateProcessingResult
} from './templateProcessingService';
export type {
  TemplateFilter,
  TemplateAccessControl,
  TemplateStorageResult
} from './templateManagementService';
export type {
  VersionCreateOptions,
  VersionQueryOptions,
  VersionOperationResult,
  VersionListResult,
  VersionComparisonResult,
  VersionRestorationResult
} from './versionControlService';

export type {
  ComparisonOptions,
  DetailedComparison,
  EnhancedVersionDifference,
  ComparisonStatistics,
  ComparisonMetadata
} from './documentComparisonService';

export type {
  VisualizationOptions,
  HtmlDiffOutput,
  SideBySideComparison,
  DiffColumn,
  DiffLine
} from './diffVisualizationService';

export type {
  SharingOperationResult,
  PermissionGrantResult,
  ShareLinkResult,
  PermissionListResult,
  ShareLinkListResult,
  ShareLinkOptions,
  PermissionQueryOptions
} from './documentSharingService';

export type {
  EditSession,
  EditRegion,
  EditOperation,
  EditPosition,
  ConflictDetection,
  EditConflict,
  ConflictResolution,
  DocumentLock,
  CollaborationState,
  ConcurrentEditingResult,
  SessionResult,
  OperationResult,
  LockResult,
  CollaborationStateResult
} from './concurrentEditingService';

export {
  LockType,
  OperationType,
  ConflictType,
  ResolutionStrategy
} from './concurrentEditingService';

export type {
  Notification,
  NotificationData,
  NotificationPreferences,
  NotificationTemplate,
  NotificationDelivery,
  NotificationBatch,
  NotificationResult,
  NotificationCreateResult,
  NotificationListResult,
  NotificationPreferencesResult,
  DeliveryResult,
  CreateNotificationOptions,
  NotificationQueryOptions
} from './notificationService';

export {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  NotificationStatus,
  DeliveryStatus,
  BatchStatus,
  NotificationFrequency
} from './notificationService';

// Service initialization and health check
export const initializeServices = async (): Promise<boolean> => {
  try {
    // Test Supabase connection
    const connectionTest = await supabaseService.testConnection();
    if (!connectionTest) {
      console.error('❌ Supabase connection test failed');
      return false;
    }

    // Check database initialization status
    const initStatus = await databaseInitService.getInitializationStatus();
    if (!initStatus.initialized) {
      console.warn('⚠️ Database not fully initialized');
      console.log('Run databaseInitService.initializeSchema() to initialize');
    }

    // Test file storage
    const storageStats = await fileStorageService.getStorageStats();
    console.log(`📁 Storage initialized with ${storageStats.totalFiles} files`);

    // Test encryption service
    const encryptionConfig = encryptionService.validateConfig();
    if (!encryptionConfig.isValid) {
      console.error('❌ Encryption service configuration invalid:', encryptionConfig.errors);
      return false;
    }

    // Test version control service
    console.log('📝 Version Control Service initialized');

    console.log('✅ Document Management Services initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    return false;
  }
};

// Service health check
export const checkServicesHealth = async (): Promise<{
  supabase: boolean;
  database: boolean;
  storage: boolean;
  encryption: boolean;
  versionControl: boolean;
}> => {
  try {
    const supabaseHealth = await supabaseService.testConnection();
    
    const initStatus = await databaseInitService.getInitializationStatus();
    const databaseHealth = initStatus.tablesExist;
    const storageHealth = initStatus.bucketExists;

    // Test encryption service
    const encryptionConfig = encryptionService.validateConfig();
    const encryptionHealth = encryptionConfig.isValid;

    // Version control service is always healthy if database is healthy
    const versionControlHealth = databaseHealth;

    return {
      supabase: supabaseHealth,
      database: databaseHealth,
      storage: storageHealth,
      encryption: encryptionHealth,
      versionControl: versionControlHealth
    };
  } catch (error) {
    return {
      supabase: false,
      database: false,
      storage: false,
      encryption: false,
      versionControl: false
    };
  }
};
