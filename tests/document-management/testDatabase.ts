/**
 * Document Management System - Test Database Utilities
 * 
 * Provides utilities for setting up and cleaning up test database state
 * for property-based testing and integration tests.
 * 
 * Requirements: All (testing foundation)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getDMSConfig } from '../../src/document-management/config';

// Test database configuration
export interface TestDatabaseConfig {
  supabaseUrl: string;
  supabaseServiceKey: string; // Service key for admin operations
  testSchemaPrefix: string;
  cleanupAfterEach: boolean;
  cleanupAfterAll: boolean;
}

// Test database client (with service key for admin operations)
let testClient: SupabaseClient | null = null;

// Test data tracking for cleanup
const testDataTracker = {
  documents: new Set<string>(),
  folders: new Set<string>(),
  templates: new Set<string>(),
  workflows: new Set<string>(),
  users: new Set<string>(),
  cases: new Set<string>()
};

/**
 * Initialize test database client
 */
export const initializeTestDatabase = (): SupabaseClient => {
  if (!testClient) {
    const config = getDMSConfig();
    
    // Use service key for tests to bypass RLS
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
    
    if (!config.supabaseUrl || !serviceKey) {
      throw new Error('Test database configuration missing. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.');
    }
    
    testClient = createClient(config.supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });
  }
  
  return testClient;
};

/**
 * Create a test user for testing
 */
export const createTestUser = async (userData: {
  email: string;
  password: string;
  role?: string;
}): Promise<{ user: any; session: any }> => {
  const client = initializeTestDatabase();
  
  const { data, error } = await client.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
    user_metadata: {
      role: userData.role || 'avocat'
    }
  });
  
  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }
  
  // Track for cleanup
  if (data.user) {
    testDataTracker.users.add(data.user.id);
  }
  
  return data;
};

/**
 * Create a test case for document association
 */
export const createTestCase = async (userId: string, caseData: {
  title: string;
  description?: string;
  status?: string;
}): Promise<any> => {
  const client = initializeTestDatabase();
  
  const { data, error } = await client
    .from('cases')
    .insert({
      title: caseData.title,
      description: caseData.description || 'Test case for document management',
      status: caseData.status || 'active',
      user_id: userId,
      created_by: userId
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test case: ${error.message}`);
  }
  
  // Track for cleanup
  testDataTracker.cases.add(data.id);
  
  return data;
};

/**
 * Create test encryption key
 */
export const createTestEncryptionKey = async (userId: string): Promise<any> => {
  const client = initializeTestDatabase();
  
  const { data, error } = await client
    .from('encryption_keys')
    .insert({
      key_data: 'test-encryption-key-' + Math.random().toString(36),
      algorithm: 'AES-256',
      user_id: userId,
      is_active: true
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test encryption key: ${error.message}`);
  }
  
  return data;
};

/**
 * Create test folder structure
 */
export const createTestFolder = async (userId: string, caseId: string, folderData: {
  name: string;
  parentId?: string;
  level?: number;
}): Promise<any> => {
  const client = initializeTestDatabase();
  
  const level = folderData.level || 0;
  const path = folderData.parentId 
    ? `parent-path/${folderData.name}` // Simplified for testing
    : folderData.name;
  
  const { data, error } = await client
    .from('folders')
    .insert({
      case_id: caseId,
      name: folderData.name,
      parent_id: folderData.parentId || null,
      path: path,
      level: level,
      user_id: userId,
      created_by: userId
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test folder: ${error.message}`);
  }
  
  // Track for cleanup
  testDataTracker.folders.add(data.id);
  
  return data;
};

/**
 * Create test document
 */
export const createTestDocument = async (userId: string, caseId: string, documentData: {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  folderId?: string;
  tags?: string[];
  category?: string;
  confidentialityLevel?: string;
}): Promise<any> => {
  const client = initializeTestDatabase();
  
  // Create encryption key first
  const encryptionKey = await createTestEncryptionKey(userId);
  
  const { data, error } = await client
    .from('documents')
    .insert({
      case_id: caseId,
      folder_id: documentData.folderId || null,
      name: documentData.name,
      original_name: documentData.originalName,
      mime_type: documentData.mimeType,
      size_bytes: documentData.size,
      checksum: 'test-checksum-' + Math.random().toString(36),
      storage_path: `/test/${userId}/${documentData.name}`,
      encryption_key_id: encryptionKey.id,
      tags: documentData.tags || [],
      category: documentData.category || 'other',
      confidentiality_level: documentData.confidentialityLevel || 'internal',
      description: 'Test document',
      user_id: userId,
      created_by: userId
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test document: ${error.message}`);
  }
  
  // Track for cleanup
  testDataTracker.documents.add(data.id);
  
  return data;
};

/**
 * Create test template
 */
export const createTestTemplate = async (userId: string, templateData: {
  name: string;
  category: string;
  language: string;
  content: string;
  applicableRoles?: string[];
}): Promise<any> => {
  const client = initializeTestDatabase();
  
  const { data, error } = await client
    .from('templates')
    .insert({
      name: templateData.name,
      description: 'Test template',
      category: templateData.category,
      language: templateData.language,
      applicable_roles: templateData.applicableRoles || ['avocat'],
      content: templateData.content,
      variables: {},
      user_id: userId,
      created_by: userId,
      is_active: true
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test template: ${error.message}`);
  }
  
  // Track for cleanup
  testDataTracker.templates.add(data.id);
  
  return data;
};

/**
 * Create test signature workflow
 */
export const createTestSignatureWorkflow = async (userId: string, documentId: string): Promise<any> => {
  const client = initializeTestDatabase();
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
  
  const { data, error } = await client
    .from('signature_workflows')
    .insert({
      document_id: documentId,
      status: 'pending',
      user_id: userId,
      created_by: userId,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create test signature workflow: ${error.message}`);
  }
  
  // Track for cleanup
  testDataTracker.workflows.add(data.id);
  
  return data;
};

/**
 * Clean up test data for a specific entity type
 */
export const cleanupTestData = async (entityType: keyof typeof testDataTracker): Promise<void> => {
  const client = initializeTestDatabase();
  const ids = Array.from(testDataTracker[entityType]);
  
  if (ids.length === 0) return;
  
  try {
    let tableName: string;
    switch (entityType) {
      case 'documents':
        tableName = 'documents';
        break;
      case 'folders':
        tableName = 'folders';
        break;
      case 'templates':
        tableName = 'templates';
        break;
      case 'workflows':
        tableName = 'signature_workflows';
        break;
      case 'cases':
        tableName = 'cases';
        break;
      case 'users':
        // Users are cleaned up via auth.admin
        for (const userId of ids) {
          await client.auth.admin.deleteUser(userId);
        }
        testDataTracker.users.clear();
        return;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
    
    const { error } = await client
      .from(tableName)
      .delete()
      .in('id', ids);
    
    if (error) {
      console.warn(`Warning: Failed to cleanup ${entityType}:`, error.message);
    }
    
    testDataTracker[entityType].clear();
  } catch (error) {
    console.warn(`Warning: Error during ${entityType} cleanup:`, error);
  }
};

/**
 * Clean up all test data
 */
export const cleanupAllTestData = async (): Promise<void> => {
  // Clean up in dependency order (children first)
  await cleanupTestData('workflows');
  await cleanupTestData('documents');
  await cleanupTestData('folders');
  await cleanupTestData('templates');
  await cleanupTestData('cases');
  await cleanupTestData('users');
  
  // Also clean up any orphaned encryption keys
  const client = initializeTestDatabase();
  try {
    await client
      .from('encryption_keys')
      .delete()
      .like('key_data', 'test-encryption-key-%');
  } catch (error) {
    console.warn('Warning: Failed to cleanup test encryption keys:', error);
  }
};

/**
 * Reset test database to clean state
 */
export const resetTestDatabase = async (): Promise<void> => {
  await cleanupAllTestData();
  
  // Clear tracking sets
  Object.keys(testDataTracker).forEach(key => {
    (testDataTracker as any)[key].clear();
  });
};

/**
 * Verify database connection and schema
 */
export const verifyTestDatabaseSetup = async (): Promise<boolean> => {
  try {
    const client = initializeTestDatabase();
    
    // Test basic connectivity
    const { data: healthCheck, error: healthError } = await client
      .from('cases')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.error('Database health check failed:', healthError.message);
      return false;
    }
    
    // Verify required tables exist
    const requiredTables = [
      'documents',
      'folders',
      'document_versions',
      'templates',
      'signature_workflows',
      'workflow_signers',
      'document_permissions',
      'share_links',
      'document_comments',
      'audit_trail',
      'encryption_keys'
    ];
    
    for (const table of requiredTables) {
      const { error } = await client
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error(`Table ${table} not accessible:`, error.message);
        return false;
      }
    }
    
    console.log('✅ Test database setup verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Test database verification failed:', error);
    return false;
  }
};

/**
 * Create a complete test scenario with user, case, folder, and document
 */
export const createTestScenario = async (scenarioName: string = 'default'): Promise<{
  user: any;
  case: any;
  folder: any;
  document: any;
  encryptionKey: any;
}> => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  
  // Create test user
  const { user } = await createTestUser({
    email: `test-${scenarioName}-${timestamp}-${randomId}@example.com`,
    password: 'TestPassword123!',
    role: 'avocat'
  });
  
  // Create test case
  const testCase = await createTestCase(user.id, {
    title: `Test Case - ${scenarioName} - ${timestamp}`,
    description: `Test case for scenario: ${scenarioName}`,
    status: 'active'
  });
  
  // Create test folder
  const folder = await createTestFolder(user.id, testCase.id, {
    name: `Test Folder - ${scenarioName}`,
    level: 0
  });
  
  // Create encryption key
  const encryptionKey = await createTestEncryptionKey(user.id);
  
  // Create test document
  const document = await createTestDocument(user.id, testCase.id, {
    name: `test-document-${scenarioName}-${timestamp}.pdf`,
    originalName: `test-document-${scenarioName}.pdf`,
    mimeType: 'application/pdf',
    size: 1024 * 50, // 50KB
    folderId: folder.id,
    tags: ['test', scenarioName],
    category: 'contract',
    confidentialityLevel: 'internal'
  });
  
  return {
    user,
    case: testCase,
    folder,
    document,
    encryptionKey
  };
};

/**
 * Jest setup helper - call this in beforeAll
 */
export const setupTestDatabase = async (): Promise<void> => {
  const isSetup = await verifyTestDatabaseSetup();
  if (!isSetup) {
    throw new Error('Test database setup verification failed');
  }
};

/**
 * Jest cleanup helper - call this in afterEach
 */
export const cleanupAfterEach = async (): Promise<void> => {
  // Clean up test data but keep the database structure
  await cleanupAllTestData();
};

/**
 * Jest cleanup helper - call this in afterAll
 */
export const cleanupAfterAll = async (): Promise<void> => {
  await resetTestDatabase();
  
  // Close database connection
  if (testClient) {
    // Supabase client doesn't have an explicit close method
    testClient = null;
  }
};

// Export test data tracker for advanced cleanup scenarios
export { testDataTracker };