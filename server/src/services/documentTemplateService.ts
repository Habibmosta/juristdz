import { 
  DocumentTemplate, 
  CreateTemplateRequest, 
  UpdateTemplateRequest,
  GenerateDocumentRequest,
  SearchTemplatesRequest,
  TemplateSearchResult,
  DocumentGenerationResult,
  TemplateValidationResult,
  Document,
  DocumentType,
  DocumentCategory,
  DocumentStatus,
  ConfidentialityLevel,
  VariableType,
  ValidationError,
  TemplateVariable
} from '../types/documents';
import { Profession } from '../types/auth';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class DocumentTemplateService {
  private templates: Map<string, DocumentTemplate> = new Map();
  private documents: Map<string, Document> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Create a new document template
   */
  async createTemplate(
    request: CreateTemplateRequest, 
    createdBy: string, 
    organizationId?: string
  ): Promise<DocumentTemplate> {
    try {
      // Validate template
      const validation = await this.validateTemplate(request);
      if (!validation.isValid) {
        throw new Error(`Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const template: DocumentTemplate = {
        id: uuidv4(),
        name: request.name,
        description: request.description,
        category: request.category,
        type: request.type,
        roleRestrictions: request.roleRestrictions,
        template: request.template,
        variables: request.variables,
        legalReferences: request.legalReferences,
        organizationId,
        isPublic: request.isPublic || false,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      this.templates.set(template.id, template);
      
      logger.info(`Template created: ${template.id} by user ${createdBy}`);
      return template;
    } catch (error) {
      logger.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(
    templateId: string, 
    request: UpdateTemplateRequest, 
    userId: string
  ): Promise<DocumentTemplate> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Check permissions (simplified - in real implementation, use RBAC)
      if (template.createdBy !== userId && !template.isPublic) {
        throw new Error('Insufficient permissions to update template');
      }

      const updatedTemplate: DocumentTemplate = {
        ...template,
        ...request,
        updatedAt: new Date()
      };

      // Validate if template content changed
      if (request.template || request.variables) {
        const validation = await this.validateTemplate(updatedTemplate);
        if (!validation.isValid) {
          throw new Error(`Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }

      this.templates.set(templateId, updatedTemplate);
      
      logger.info(`Template updated: ${templateId} by user ${userId}`);
      return updatedTemplate;
    } catch (error) {
      logger.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string, userId: s