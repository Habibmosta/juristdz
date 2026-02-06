/**
 * Template Management Service Tests
 * 
 * Unit tests for the template management service implemented in task 7.1
 * Tests template storage, retrieval, and role-based access control.
 * 
 * Requirements: 3.1, 3.2
 */

import { TemplateManagementService } from '../../src/document-management/services/templateManagementService';
import {
  Template,
  TemplateDefinition,
  TemplateCategory,
  VariableType,
  Language
} from '../../types/document-management';
import { UserRole } from '../../types';

// Mock Supabase service
jest.mock('../../src/document-management/services/supabaseService');