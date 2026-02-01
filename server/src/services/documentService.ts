import { db } from '@/database/connection';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import {
  Document,
  DocumentTemplate,
  DocumentType,
  DocumentCategory,
  DocumentStatus,
  ConfidentialityLevel,
  DocumentSearchCriteria,
  DocumentSearchResult,
  DocumentGenerationRequest,
  DocumentGenerationResult,
  TemplateVariables,
  DocumentVersion,
  ElectronicSignature,
  SignatureType,
  DocumentPermission,
  DocumentAction,
  ValidationError,
  DocumentExportOptions,
  BulkDocumentOperation,
  BulkOperationResult
} from '@/types/document';
import { Profession } from '@/types/auth';
import { LegalDomain } from '@/types/search';

export class DocumentService {
  private readonly maxVersions = 50;
  private readonly defaultRetentionYears = 10;

  /**
   * Create a new document from template
   * Validates: Requirements 4.1-4.4 - Role-specific document templates
   */
  async createDocument(
    template: DocumentTemplate, 
    data: TemplateVariables,
    userId: string,
    organizationId?: string
  ): Promise<Document> {
    try {
      logger.info('Creating document from template', { 
        templateId: template.id, 
        userId, 
        organizationId 
      });

      // Validate user has permission to use this template
      await this.validateTemplateAccess(template, userId);

      // Validate required variables
      const validationErrors = this.validateTemplateVariables(template, data);
      if (validationErrors.length > 0) {
        throw new Error(`Template validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }

      // Generate document content
      const content = this.processTemplate(template.template, data);
      
      // Calculate checksum
      const checksum = this.calculateChecksum(content);

      // Create document
      const documentId = uuidv4();
      const document: Document = {
        id: documentId,
        title: data.title || `${template.name} - ${new Date().toLocaleDateString()}`,
        type: template.type,
        category: template.category,
        content,
        metadata: {
          clientId: data.clientId,
          caseNumber: data.caseNumber,
          dossierNumber: data.dossierNumber,
          legalReferences: template.legalReferences,
          tags: data.tags || [],
          keywords: this.extractKeywords(content),
          customFields: data.customFields || {},
          retentionPeriod: this.defaultRetentionYears,
          relatedDocuments: [],
          attachments: [],
          wordCount: this.countWords(content),
          pageCount: this.estimatePages(content),
          checksum
        },
        ownerId: userId,
        organizationId,
        permissions: [],
        versions: [],
        signatures: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: DocumentStatus.DRAFT,
        templateId: template.id,
        isTemplate: false,
        language: template.language,
        confidentialityLevel: data.confidentialityLevel || ConfidentialityLevel.INTERNAL
      };

      // Save to database
      await this.saveDocumentToDatabase(document);

      // Create initial version
      await this.createDocumentVersion(document, 'Initial creation', userId);

      // Set default permissions
      await this.setDefaultPermissions(document, userId);

      // Update template usage statistics
      await this.updateTemplateUsage(template.id);

      logger.info('Document created successfully', { documentId, templateId: template.id });

      return document;

    } catch (error) {
      logger.error('Document creation error:', error);
      throw new Error('Failed to create document');
    }
  }

  /**
   * Generate document from template with variables
   * Validates: Requirements 4.1-4.4 - Template-based document generation
   */
  async generateFromTemplate(
    templateId: string, 
    variables: TemplateVariables,
    userId: string,
    organizationId?: string
  ): Promise<DocumentGenerationResult> {
    try {
      // Get template
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Validate template access
      await this.validateTemplateAccess(template, userId);

      // Validate variables
      const validationErrors = this.validateTemplateVariables(template, variables);
      const missingVariables = this.findMissingRequiredVariables(template, variables);

      // Generate document even with warnings
      const document = await this.createDocument(template, variables, userId, organizationId);

      const warnings: string[] = [];
      if (missingVariables.length > 0) {
        warnings.push(`Missing required variables: ${missingVariables.join(', ')}`);
      }

      return {
        document,
        warnings,
        missingVariables,
        validationErrors
      };

    } catch (error) {
      logger.error('Document generation error:', error);
      throw new Error('Failed to generate document');
    }
  }

  /**
   * Save document with versioning
   * Validates: Requirements - Document versioning and storage
   */
  async saveDocument(document: Document, userId: string, changes?: string): Promise<DocumentVersion> {
    try {
      // Update document metadata
      document.updatedAt = new Date();
      document.metadata.checksum = this.calculateChecksum(document.content);
      document.metadata.wordCount = this.countWords(document.content);
      document.metadata.pageCount = this.estimatePages(document.content);

      // Save to database
      await this.updateDocumentInDatabase(document);

      // Create new version
      const version = await this.createDocumentVersion(document, changes || 'Document updated', userId);

      // Clean up old versions if needed
      await this.cleanupOldVersions(document.id);

      logger.info('Document saved successfully', { documentId: document.id, version: version.version });

      return version;

    } catch (error) {
      logger.error('Document save error:', error);
      throw new Error('Failed to save document');
    }
  }

  /**
   * Get document by ID with permission check
   * Validates: Requirements - Secure document access
   */
  async getDocument(documentId: string, userId: string): Promise<Document | null> {
    try {
      // Get document from database
      const result = await db.query(
        `SELECT d.*, dt.name as template_name
         FROM documents d
         LEFT JOIN document_templates dt ON d.template_id = dt.id
         WHERE d.id = $1`,
        [documentId]
      );

      if (!result || (result as any).rows.length === 0) {
        return null;
      }

      const row = (result as any).rows[0];
      const document = this.mapRowToDocument(row);

      // Check permissions
      const hasAccess = await this.checkDocumentAccess(document, userId, DocumentAction.READ);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Load versions and signatures
      document.versions = await this.getDocumentVersions(documentId);
      document.signatures = await this.getDocumentSignatures(documentId);
      document.permissions = await this.getDocumentPermissions(documentId);

      return document;

    } catch (error) {
      logger.error('Get document error:', error);
      throw new Error('Failed to retrieve document');
    }
  }

  // Private helper methods will be added in the next part
  private async validateTemplateAccess(template: DocumentTemplate, userId: string): Promise<void> {
    const userRole = await this.getUserRole(userId);
    
    if (template.roleRestrictions.length > 0 && !template.roleRestrictions.includes(userRole)) {
      throw new Error('User role not authorized for this template');
    }

    if (template.organizationId) {
      const userOrgId = await this.getUserOrganizationId(userId);
      if (template.organizationId !== userOrgId && !template.isPublic) {
        throw new Error('Template not available for user organization');
      }
    }
  }

  private validateTemplateVariables(
    template: DocumentTemplate, 
    variables: TemplateVariables
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const variable of template.variables) {
      const value = variables[variable.name];

      if (variable.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: variable.name,
          message: `Required variable '${variable.name}' is missing`,
          code: 'REQUIRED_VARIABLE_MISSING',
          severity: 'error'
        });
        continue;
      }

      if (value !== undefined && variable.validation) {
        const validationError = this.validateVariableValue(variable, value);
        if (validationError) {
          errors.push(validationError);
        }
      }
    }

    return errors;
  }

  private validateVariableValue(variable: any, value: any): ValidationError | null {
    const validation = variable.validation;

    if (validation.minLength && typeof value === 'string' && value.length < validation.minLength) {
      return {
        field: variable.name,
        message: `Variable '${variable.name}' must be at least ${validation.minLength} characters`,
        code: 'MIN_LENGTH_VIOLATION',
        severity: 'error'
      };
    }

    if (validation.maxLength && typeof value === 'string' && value.length > validation.maxLength) {
      return {
        field: variable.name,
        message: `Variable '${variable.name}' must not exceed ${validation.maxLength} characters`,
        code: 'MAX_LENGTH_VIOLATION',
        severity: 'error'
      };
    }

    return null;
  }

  private findMissingRequiredVariables(
    template: DocumentTemplate, 
    variables: TemplateVariables
  ): string[] {
    return template.variables
      .filter(v => v.required && (variables[v.name] === undefined || variables[v.name] === null || variables[v.name] === ''))
      .map(v => v.name);
  }

  private processTemplate(template: string, variables: TemplateVariables): string {
    let content = template;

    // Replace variables in the format {{variableName}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, String(value || ''));
    }

    return content;
  }

  private calculateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  private countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  private estimatePages(content: string): number {
    const wordsPerPage = 250;
    const wordCount = this.countWords(content);
    return Math.ceil(wordCount / wordsPerPage);
  }

  // Database operations implementation
  private async saveDocumentToDatabase(document: Document): Promise<void> {
    const query = `
      INSERT INTO documents (
        id, title, type, category, content, metadata, owner_id, organization_id,
        created_at, updated_at, status, template_id, parent_document_id, is_template, 
        language, confidentiality_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `;

    await db.query(query, [
      document.id,
      document.title,
      document.type,
      document.category,
      document.content,
      JSON.stringify(document.metadata),
      document.ownerId,
      document.organizationId,
      document.createdAt,
      document.updatedAt,
      document.status,
      document.templateId,
      document.parentDocumentId,
      document.isTemplate,
      document.language,
      document.confidentialityLevel
    ]);
  }

  private async updateDocumentInDatabase(document: Document): Promise<void> {
    const query = `
      UPDATE documents SET
        title = $2, content = $3, metadata = $4, updated_at = $5, status = $6, 
        confidentiality_level = $7
      WHERE id = $1
    `;

    await db.query(query, [
      document.id,
      document.title,
      document.content,
      JSON.stringify(document.metadata),
      document.updatedAt,
      document.status,
      document.confidentialityLevel
    ]);
  }

  private async createDocumentVersion(
    document: Document, 
    changes: string, 
    userId: string
  ): Promise<DocumentVersion> {
    // Get current version number
    const versionResult = await db.query(
      'SELECT COALESCE(MAX(version), 0) as max_version FROM document_versions WHERE document_id = $1',
      [document.id]
    );
    
    const nextVersion = ((versionResult as any).rows[0].max_version || 0) + 1;

    const version: DocumentVersion = {
      id: uuidv4(),
      documentId: document.id,
      version: nextVersion,
      content: document.content,
      changes,
      createdBy: userId,
      createdAt: new Date(),
      isActive: true,
      checksum: this.calculateChecksum(document.content)
    };

    // Deactivate previous versions
    await db.query(
      'UPDATE document_versions SET is_active = false WHERE document_id = $1',
      [document.id]
    );

    // Insert new version
    await db.query(
      `INSERT INTO document_versions (id, document_id, version, content, changes, created_by, created_at, is_active, checksum)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [version.id, version.documentId, version.version, version.content, version.changes, 
       version.createdBy, version.createdAt, version.isActive, version.checksum]
    );

    return version;
  }

  private async cleanupOldVersions(documentId: string): Promise<void> {
    // Keep only the latest N versions
    await db.query(
      `DELETE FROM document_versions 
       WHERE document_id = $1 
       AND version NOT IN (
         SELECT version FROM document_versions 
         WHERE document_id = $1 
         ORDER BY version DESC 
         LIMIT $2
       )`,
      [documentId, this.maxVersions]
    );
  }

  private async setDefaultPermissions(document: Document, userId: string): Promise<void> {
    // Owner gets full permissions
    const permission: DocumentPermission = {
      id: uuidv4(),
      documentId: document.id,
      userId,
      permissions: [
        DocumentAction.READ,
        DocumentAction.WRITE,
        DocumentAction.DELETE,
        DocumentAction.SHARE,
        DocumentAction.SIGN,
        DocumentAction.EXPORT,
        DocumentAction.PRINT
      ],
      grantedBy: userId,
      grantedAt: new Date(),
      isActive: true
    };

    await db.query(
      `INSERT INTO document_permissions (id, document_id, user_id, permissions, granted_by, granted_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [permission.id, permission.documentId, permission.userId, permission.permissions,
       permission.grantedBy, permission.grantedAt, permission.isActive]
    );
  }

  private async updateTemplateUsage(templateId: string): Promise<void> {
    await db.query(
      `UPDATE document_templates SET 
       usage_count = usage_count + 1,
       last_used = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [templateId]
    );
  }

  private async getTemplate(templateId: string): Promise<DocumentTemplate | null> {
    const result = await db.query(
      'SELECT * FROM document_templates WHERE id = $1 AND is_active = true',
      [templateId]
    );

    if (!result || (result as any).rows.length === 0) {
      return null;
    }

    return this.mapRowToTemplate((result as any).rows[0]);
  }

  private mapRowToDocument(row: any): Document {
    return {
      id: row.id,
      title: row.title,
      type: row.type as DocumentType,
      category: row.category as DocumentCategory,
      content: row.content,
      metadata: JSON.parse(row.metadata || '{}'),
      ownerId: row.owner_id,
      organizationId: row.organization_id,
      permissions: [],
      versions: [],
      signatures: [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      status: row.status as DocumentStatus,
      templateId: row.template_id,
      parentDocumentId: row.parent_document_id,
      isTemplate: row.is_template,
      language: row.language,
      confidentialityLevel: row.confidentiality_level as ConfidentialityLevel
    };
  }

  private mapRowToTemplate(row: any): DocumentTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type as DocumentType,
      category: row.category as DocumentCategory,
      roleRestrictions: row.role_restrictions || [],
      template: row.template,
      variables: JSON.parse(row.variables || '[]'),
      legalReferences: JSON.parse(row.legal_references || '[]'),
      organizationId: row.organization_id,
      isPublic: row.is_public,
      isActive: row.is_active,
      version: row.version,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      usage: {
        totalUsage: row.usage_count || 0,
        lastUsed: row.last_used ? new Date(row.last_used) : undefined,
        popularVariables: [],
        averageCompletionTime: undefined
      },
      tags: row.tags || [],
      language: row.language,
      jurisdiction: row.jurisdiction,
      legalDomain: row.legal_domain as LegalDomain
    };
  }

  private async checkDocumentAccess(
    document: Document, 
    userId: string, 
    action: DocumentAction
  ): Promise<boolean> {
    // Owner always has access
    if (document.ownerId === userId) {
      return true;
    }

    // Check explicit permissions
    const result = await db.query(
      `SELECT permissions FROM document_permissions 
       WHERE document_id = $1 AND user_id = $2 AND is_active = true`,
      [document.id, userId]
    );

    if (result && (result as any).rows.length > 0) {
      const permissions = (result as any).rows[0].permissions;
      return permissions.includes(action);
    }

    return false;
  }

  private async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    const result = await db.query(
      'SELECT * FROM document_versions WHERE document_id = $1 ORDER BY version DESC',
      [documentId]
    );

    return (result as any).rows.map((row: any) => ({
      id: row.id,
      documentId: row.document_id,
      version: row.version,
      content: row.content,
      changes: row.changes,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      isActive: row.is_active,
      checksum: row.checksum
    }));
  }

  private async getDocumentSignatures(documentId: string): Promise<ElectronicSignature[]> {
    const result = await db.query(
      'SELECT * FROM document_signatures WHERE document_id = $1 ORDER BY timestamp DESC',
      [documentId]
    );

    return (result as any).rows.map((row: any) => ({
      id: row.id,
      documentId: row.document_id,
      signerId: row.signer_id,
      signerName: row.signer_name,
      signerRole: row.signer_role,
      signatureType: row.signature_type as SignatureType,
      signatureData: row.signature_data,
      certificate: row.certificate,
      timestamp: new Date(row.timestamp),
      ipAddress: row.ip_address,
      location: row.location,
      reason: row.reason,
      isValid: row.is_valid,
      validationData: row.validation_data ? JSON.parse(row.validation_data) : undefined
    }));
  }

  private async getDocumentPermissions(documentId: string): Promise<DocumentPermission[]> {
    const result = await db.query(
      'SELECT * FROM document_permissions WHERE document_id = $1 AND is_active = true',
      [documentId]
    );

    return (result as any).rows.map((row: any) => ({
      id: row.id,
      documentId: row.document_id,
      userId: row.user_id,
      roleId: row.role_id,
      organizationId: row.organization_id,
      permissions: row.permissions,
      grantedBy: row.granted_by,
      grantedAt: new Date(row.granted_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      isActive: row.is_active
    }));
  }

  private async getUserRole(userId: string): Promise<Profession> {
    const result = await db.query(
      'SELECT profession FROM user_profiles WHERE user_id = $1 AND is_primary = true',
      [userId]
    );

    if (result && (result as any).rows.length > 0) {
      return (result as any).rows[0].profession as Profession;
    }

    return Profession.ETUDIANT;
  }

  private async getUserOrganizationId(userId: string): Promise<string | undefined> {
    const result = await db.query(
      'SELECT barreau_id FROM user_profiles WHERE user_id = $1 AND is_primary = true',
      [userId]
    );

    if (result && (result as any).rows.length > 0) {
      return (result as any).rows[0].barreau_id;
    }

    return undefined;
  }

  /**
   * Search documents with advanced filtering
   * Validates: Requirements - Document search and filtering
   */
  async searchDocuments(
    criteria: DocumentSearchCriteria,
    userId: string
  ): Promise<DocumentSearchResult> {
    try {
      const startTime = Date.now();
      
      // Build search query
      let query = `
        SELECT d.*, ts_rank(to_tsvector('french', d.title || ' ' || d.content), plainto_tsquery('french', $1)) as rank
        FROM documents d
        LEFT JOIN document_permissions dp ON d.id = dp.document_id
        WHERE (
          d.owner_id = $2
          OR (dp.user_id = $2 AND dp.is_active = true AND 'read' = ANY(dp.permissions))
          OR d.confidentiality_level = 'public'
        )
      `;
      
      const params: any[] = [criteria.query || '', userId];
      let paramIndex = 2;

      // Add filters
      if (criteria.query) {
        query += ` AND to_tsvector('french', d.title || ' ' || d.content) @@ plainto_tsquery('french', $1)`;
      }

      if (criteria.type) {
        query += ` AND d.type = $${++paramIndex}`;
        params.push(criteria.type);
      }

      if (criteria.category) {
        query += ` AND d.category = $${++paramIndex}`;
        params.push(criteria.category);
      }

      if (criteria.status) {
        query += ` AND d.status = $${++paramIndex}`;
        params.push(criteria.status);
      }

      if (criteria.clientId) {
        query += ` AND d.metadata->>'clientId' = $${++paramIndex}`;
        params.push(criteria.clientId);
      }

      if (criteria.tags && criteria.tags.length > 0) {
        query += ` AND d.metadata->'tags' ?| $${++paramIndex}`;
        params.push(criteria.tags);
      }

      if (criteria.dateRange) {
        if (criteria.dateRange.from) {
          query += ` AND d.created_at >= $${++paramIndex}`;
          params.push(criteria.dateRange.from);
        }
        if (criteria.dateRange.to) {
          query += ` AND d.created_at <= $${++paramIndex}`;
          params.push(criteria.dateRange.to);
        }
      }

      if (criteria.confidentialityLevel) {
        query += ` AND d.confidentiality_level = $${++paramIndex}`;
        params.push(criteria.confidentialityLevel);
      }

      if (criteria.language) {
        query += ` AND d.language = $${++paramIndex}`;
        params.push(criteria.language);
      }

      // Add sorting
      const sortBy = criteria.sortBy || DocumentSortOption.UPDATED_AT;
      const sortOrder = criteria.sortOrder || 'desc';
      
      if (criteria.query && sortBy === DocumentSortOption.RELEVANCE) {
        query += ` ORDER BY rank DESC, d.updated_at DESC`;
      } else {
        query += ` ORDER BY d.${sortBy} ${sortOrder}`;
      }

      // Add pagination
      const limit = criteria.limit || 50;
      const offset = criteria.offset || 0;
      query += ` LIMIT $${++paramIndex} OFFSET $${++paramIndex}`;
      params.push(limit, offset);

      // Execute search
      const result = await db.query(query, params);
      const documents = (result as any).rows.map((row: any) => this.mapRowToDocument(row));

      // Get total count
      const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*$/, '').replace(/LIMIT.*$/, '');
      const countResult = await db.query(countQuery, params.slice(0, -2));
      const totalCount = parseInt((countResult as any).rows[0].count);

      const searchTime = Date.now() - startTime;

      // Log search for analytics
      await this.logSearch(userId, criteria, documents.length, searchTime);

      return {
        documents,
        totalCount,
        searchTime
      };

    } catch (error) {
      logger.error('Document search error:', error);
      throw new Error('Failed to search documents');
    }
  }

  /**
   * Get documents by user with filtering
   * Validates: Requirements - User document access
   */
  async getUserDocuments(
    userId: string,
    filters?: Partial<DocumentSearchCriteria>
  ): Promise<Document[]> {
    try {
      let query = `
        SELECT d.* FROM documents d
        LEFT JOIN document_permissions dp ON d.id = dp.document_id
        WHERE (
          d.owner_id = $1
          OR (dp.user_id = $1 AND dp.is_active = true AND 'read' = ANY(dp.permissions))
        )
      `;
      
      const params: any[] = [userId];
      let paramIndex = 1;

      if (filters?.type) {
        query += ` AND d.type = $${++paramIndex}`;
        params.push(filters.type);
      }

      if (filters?.status) {
        query += ` AND d.status = $${++paramIndex}`;
        params.push(filters.status);
      }

      query += ` ORDER BY d.updated_at DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${++paramIndex}`;
        params.push(filters.limit);
      }

      const result = await db.query(query, params);
      return (result as any).rows.map((row: any) => this.mapRowToDocument(row));

    } catch (error) {
      logger.error('Get user documents error:', error);
      throw new Error('Failed to retrieve user documents');
    }
  }

  /**
   * Delete document with permission check
   * Validates: Requirements - Secure document deletion
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    try {
      // Get document and check permissions
      const document = await this.getDocument(documentId, userId);
      if (!document) {
        throw new Error('Document not found');
      }

      const hasDeleteAccess = await this.checkDocumentAccess(document, userId, DocumentAction.DELETE);
      if (!hasDeleteAccess) {
        throw new Error('Access denied');
      }

      // Soft delete - mark as cancelled instead of hard delete
      await db.query(
        'UPDATE documents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [DocumentStatus.CANCELLED, documentId]
      );

      // Log activity
      await this.logDocumentActivity(documentId, userId, 'deleted');

      logger.info('Document deleted successfully', { documentId, userId });

    } catch (error) {
      logger.error('Document deletion error:', error);
      throw new Error('Failed to delete document');
    }
  }

  /**
   * Share document with user or role
   * Validates: Requirements - Document sharing and permissions
   */
  async shareDocument(
    documentId: string,
    shareWithUserId: string,
    permissions: DocumentAction[],
    sharedByUserId: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      // Check if user has share permission
      const document = await this.getDocument(documentId, sharedByUserId);
      if (!document) {
        throw new Error('Document not found');
      }

      const hasShareAccess = await this.checkDocumentAccess(document, sharedByUserId, DocumentAction.SHARE);
      if (!hasShareAccess) {
        throw new Error('Access denied');
      }

      // Create permission record
      const permission: DocumentPermission = {
        id: uuidv4(),
        documentId,
        userId: shareWithUserId,
        permissions,
        grantedBy: sharedByUserId,
        grantedAt: new Date(),
        expiresAt,
        isActive: true
      };

      await db.query(
        `INSERT INTO document_permissions (id, document_id, user_id, permissions, granted_by, granted_at, expires_at, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (document_id, user_id) 
         DO UPDATE SET permissions = $4, granted_at = $6, expires_at = $7, is_active = $8`,
        [permission.id, permission.documentId, permission.userId, permission.permissions,
         permission.grantedBy, permission.grantedAt, permission.expiresAt, permission.isActive]
      );

      // Log activity
      await this.logDocumentActivity(documentId, sharedByUserId, 'shared', {
        sharedWith: shareWithUserId,
        permissions
      });

      logger.info('Document shared successfully', { documentId, shareWithUserId, permissions });

    } catch (error) {
      logger.error('Document sharing error:', error);
      throw new Error('Failed to share document');
    }
  }

  /**
   * Export document to specified format
   * Validates: Requirements - Document export functionality
   */
  async exportDocument(
    documentId: string,
    userId: string,
    options: DocumentExportOptions
  ): Promise<Buffer> {
    try {
      // Get document and check permissions
      const document = await this.getDocument(documentId, userId);
      if (!document) {
        throw new Error('Document not found');
      }

      const hasExportAccess = await this.checkDocumentAccess(document, userId, DocumentAction.EXPORT);
      if (!hasExportAccess) {
        throw new Error('Access denied');
      }

      // Generate export based on format
      let exportData: Buffer;

      switch (options.format) {
        case 'pdf':
          exportData = await this.generatePDF(document, options);
          break;
        case 'docx':
          exportData = await this.generateDOCX(document, options);
          break;
        case 'html':
          exportData = Buffer.from(this.generateHTML(document, options), 'utf-8');
          break;
        case 'txt':
          exportData = Buffer.from(document.content, 'utf-8');
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // Log activity
      await this.logDocumentActivity(documentId, userId, 'exported', {
        format: options.format
      });

      return exportData;

    } catch (error) {
      logger.error('Document export error:', error);
      throw new Error('Failed to export document');
    }
  }

  /**
   * Bulk operations on multiple documents
   * Validates: Requirements - Bulk document operations
   */
  async bulkOperation(
    operation: BulkDocumentOperation,
    userId: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: [],
      failed: [],
      totalProcessed: operation.documentIds.length
    };

    for (const documentId of operation.documentIds) {
      try {
        switch (operation.operation) {
          case 'delete':
            await this.deleteDocument(documentId, userId);
            break;
          case 'archive':
            await this.updateDocumentStatus(documentId, DocumentStatus.ARCHIVED, userId);
            break;
          case 'change_status':
            if (operation.parameters?.status) {
              await this.updateDocumentStatus(documentId, operation.parameters.status, userId);
            }
            break;
          case 'add_tags':
            if (operation.parameters?.tags) {
              await this.addDocumentTags(documentId, operation.parameters.tags, userId);
            }
            break;
          case 'remove_tags':
            if (operation.parameters?.tags) {
              await this.removeDocumentTags(documentId, operation.parameters.tags, userId);
            }
            break;
          case 'change_owner':
            if (operation.parameters?.newOwnerId) {
              await this.changeDocumentOwner(documentId, operation.parameters.newOwnerId, userId);
            }
            break;
          default:
            throw new Error('Unsupported bulk operation');
        }
        
        result.successful.push(documentId);
        
      } catch (error) {
        result.failed.push({
          documentId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  // Private helper methods for bulk operations
  private async updateDocumentStatus(
    documentId: string, 
    status: DocumentStatus, 
    userId: string
  ): Promise<void> {
    const document = await this.getDocument(documentId, userId);
    if (!document) {
      throw new Error('Document not found');
    }

    const hasWriteAccess = await this.checkDocumentAccess(document, userId, DocumentAction.WRITE);
    if (!hasWriteAccess) {
      throw new Error('Access denied');
    }

    await db.query(
      'UPDATE documents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, documentId]
    );

    await this.logDocumentActivity(documentId, userId, 'status_changed', { newStatus: status });
  }

  private async addDocumentTags(
    documentId: string, 
    tags: string[], 
    userId: string
  ): Promise<void> {
    const document = await this.getDocument(documentId, userId);
    if (!document) {
      throw new Error('Document not found');
    }

    const hasWriteAccess = await this.checkDocumentAccess(document, userId, DocumentAction.WRITE);
    if (!hasWriteAccess) {
      throw new Error('Access denied');
    }

    const currentTags = document.metadata.tags || [];
    const newTags = [...new Set([...currentTags, ...tags])];

    await db.query(
      `UPDATE documents SET 
       metadata = jsonb_set(metadata, '{tags}', $1::jsonb),
       updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [JSON.stringify(newTags), documentId]
    );

    await this.logDocumentActivity(documentId, userId, 'tags_added', { tags });
  }

  private async removeDocumentTags(
    documentId: string, 
    tags: string[], 
    userId: string
  ): Promise<void> {
    const document = await this.getDocument(documentId, userId);
    if (!document) {
      throw new Error('Document not found');
    }

    const hasWriteAccess = await this.checkDocumentAccess(document, userId, DocumentAction.WRITE);
    if (!hasWriteAccess) {
      throw new Error('Access denied');
    }

    const currentTags = document.metadata.tags || [];
    const newTags = currentTags.filter(tag => !tags.includes(tag));

    await db.query(
      `UPDATE documents SET 
       metadata = jsonb_set(metadata, '{tags}', $1::jsonb),
       updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [JSON.stringify(newTags), documentId]
    );

    await this.logDocumentActivity(documentId, userId, 'tags_removed', { tags });
  }

  private async changeDocumentOwner(
    documentId: string, 
    newOwnerId: string, 
    userId: string
  ): Promise<void> {
    const document = await this.getDocument(documentId, userId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Only current owner or admin can change ownership
    if (document.ownerId !== userId) {
      throw new Error('Access denied');
    }

    await db.query(
      'UPDATE documents SET owner_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newOwnerId, documentId]
    );

    await this.logDocumentActivity(documentId, userId, 'owner_changed', { 
      oldOwnerId: document.ownerId, 
      newOwnerId 
    });
  }

  // Export format generators
  private async generatePDF(document: Document, options: DocumentExportOptions): Promise<Buffer> {
    // This would integrate with a PDF generation library like puppeteer or pdfkit
    // For now, return a placeholder
    const content = `
      Document: ${document.title}
      Type: ${document.type}
      Created: ${document.createdAt.toLocaleDateString()}
      
      ${document.content}
    `;
    
    return Buffer.from(content, 'utf-8');
  }

  private async generateDOCX(document: Document, options: DocumentExportOptions): Promise<Buffer> {
    // This would integrate with a DOCX generation library like docx
    // For now, return a placeholder
    const content = `
      Document: ${document.title}
      Type: ${document.type}
      Created: ${document.createdAt.toLocaleDateString()}
      
      ${document.content}
    `;
    
    return Buffer.from(content, 'utf-8');
  }

  private generateHTML(document: Document, options: DocumentExportOptions): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${document.title}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { border-bottom: 1px solid #ccc; padding-bottom: 20px; margin-bottom: 20px; }
          .content { line-height: 1.6; }
          .metadata { color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${document.title}</h1>
          <div class="metadata">
            Type: ${document.type} | Created: ${document.createdAt.toLocaleDateString()}
          </div>
        </div>
        <div class="content">
          ${document.content.replace(/\n/g, '<br>')}
        </div>
      </body>
      </html>
    `;
  }

  // Activity logging
  private async logDocumentActivity(
    documentId: string,
    userId: string,
    action: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO document_activity_log (document_id, user_id, action, details)
         VALUES ($1, $2, $3, $4)`,
        [documentId, userId, action, JSON.stringify(details || {})]
      );
    } catch (error) {
      logger.error('Failed to log document activity:', error);
      // Don't throw error for logging failures
    }
  }

  // Search logging for analytics
  private async logSearch(
    userId: string,
    criteria: DocumentSearchCriteria,
    resultsCount: number,
    searchTime: number
  ): Promise<void> {
    try {
      // This would log to search_logs table if it exists
      // For now, just log to application logs
      logger.info('Document search performed', {
        userId,
        query: criteria.query,
        resultsCount,
        searchTime
      });
    } catch (error) {
      logger.error('Failed to log search:', error);
    }
  }
}

export const documentService = new DocumentService();