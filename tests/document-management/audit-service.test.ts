/**
 * Tests for Audit Service
 * 
 * Tests comprehensive audit logging with activity logging for all document operations,
 * audit trail generation and storage, and compliance reporting capabilities.
 * 
 * Requirements: 7.3, 7.6
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { auditService, AuditService } from '../../src/document-management/services/auditService';
import { supabaseService } from '../../src/document-management/services/supabaseService';
import { 
  AuditAction, 
  AuditCategory, 
  AuditSeverity, 
  AuditOutcome,
  ComplianceReportType,
  SecurityE