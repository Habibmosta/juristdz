/**
 * Template Management Service
 * 
 * Implements template storage, retrieval, and role-based access control
 * for the Document Management System.
 * 
 * Requirements: 3.1, 3.2
 */

import {
  Template,
  TemplateDefinition,
  TemplateVariable,
  TemplateCategory,
  Language,
  ValidationResult
} from '../../../types/document-management';
import { UserRole } from '../../../types';
import { supabaseService } from './supabaseService';
import { languageFormattingService } from '../utils/languageFormatting';

export interface TemplateFilter {
  category?: TemplateCategory;
  language?: Language;
  userRole?: UserRole;
  isActive?: boolean;
  searchQuery?: string;
}

export interface TemplateAccessControl {
  templateId: string;
  allowedRoles: UserRole[];
  isPublic: boolean;
  createdBy: string;
  organizationId?: string;
}

export interface TemplateStorageResult {
  success: boolean;
  templateId?: string;
  error?: string;
  validationErrors?: string[];
}

/**
 * Template Management Service Class
 * Handles all template-related operations including storage, retrieval, and access control
 */
export class TemplateManagementService {
  private readonly tableName = 'templates';
  private readonly accessControlTable = 'template_access_control';

  /**
   * Retrieve templates based on user role and filters
   * Requirement 3.1: Provide role-specific templates based on user type
   */
  async getTemplatesByRole(
    userRole: UserRole, 
    language: Language = Language.FRENCH,
    filters?: TemplateFilter
  ): Promise<Template[]> {
    try {
      // Build query with role-based filtering
      let query = supabaseService.getClient()
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .contains('applicable_roles', [userRole])
        .eq('language', language);

      // Apply additional filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      // Order by category and name
      query = query.order('category').order('name');

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to retrieve templates: ${error.message}`);
      }

      // Transform database records to Template objects
      return (data || []).map(this.transformDatabaseRecordToTemplate);
    } catch (error) {
      console.error('Error retrieving templates by role:', error);
      throw error;
    }
  }

  /**
   * Get a specific template by ID with role validation
   * Requirement 3.2: Display customizable variables and fields
   */
  async getTemplateById(templateId: string, userRole: UserRole): Promise<Template | null> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from(this.tableName)
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Template not found
        }
        throw new Error(`Failed to retrieve template: ${error.message}`);
      }

      const template = this.transformDatabaseRecordToTemplate(data);

      // Check role-based access
      if (!this.hasRoleAccess(template, userRole)) {
        throw new Error('Access denied: User role not authorized for this template');
      }

      return template;
    } catch (error) {
      console.error('Error retrieving template by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new template with role-based access control
   */
  async createTemplate(
    templateDefinition: TemplateDefinition,
    createdBy: string,
    organizationId?: string
  ): Promise<TemplateStorageResult> {
    try {
      // Validate template definition
      const validation = this.validateTemplateDefinition(templateDefinition);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Template validation failed',
          validationErrors: validation.errors.map(e => e.message)
        };
      }

      // Prepare template data for storage
      const templateData = {
        name: templateDefinition.name,
        description: templateDefinition.description,
        category: templateDefinition.category,
        language: templateDefinition.language,
        applicable_roles: templateDefinition.applicableRoles,
        content: templateDefinition.content,
        variables: JSON.stringify(templateDefinition.variables),
        created_by: createdBy,
        updated_by: createdBy,
        is_active: true,
        version: 1,
        organization_id: organizationId
      };

      const { data, error } = await supabaseService.getClient()
        .from(this.tableName)
        .insert(templateData)
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to create template: ${error.message}`);
      }

      // Create access control entry
      await this.createAccessControlEntry(data.id, templateDefinition.applicableRoles, createdBy, organizationId);

      return {
        success: true,
        templateId: data.id
      };
    } catch (error) {
      console.error('Error creating template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<TemplateDefinition>,
    updatedBy: string,
    userRole: UserRole
  ): Promise<TemplateStorageResult> {
    try {
      // Check if template exists and user has access
      const existingTemplate = await this.getTemplateById(templateId, userRole);
      if (!existingTemplate) {
        return {
          success: false,
          error: 'Template not found or access denied'
        };
      }

      // Validate updates
      if (updates.variables) {
        const validation = this.validateTemplateVariables(updates.variables);
        if (!validation.isValid) {
          return {
            success: false,
            error: 'Template variable validation failed',
            validationErrors: validation.errors.map(e => e.message)
          };
        }
      }

      // Prepare update data
      const updateData: any = {
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.category) updateData.category = updates.category;
      if (updates.language) updateData.language = updates.language;
      if (updates.applicableRoles) updateData.applicable_roles = updates.applicableRoles;
      if (updates.content) updateData.content = updates.content;
      if (updates.variables) updateData.variables = JSON.stringify(updates.variables);

      const { error } = await supabaseService.getClient()
        .from(this.tableName)
        .update(updateData)
        .eq('id', templateId);

      if (error) {
        throw new Error(`Failed to update template: ${error.message}`);
      }

      // Update access control if roles changed
      if (updates.applicableRoles) {
        await this.updateAccessControlEntry(templateId, updates.applicableRoles);
      }

      return {
        success: true,
        templateId
      };
    } catch (error) {
      console.error('Error updating template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete a template (soft delete)
   */
  async deleteTemplate(templateId: string, deletedBy: string, userRole: UserRole): Promise<boolean> {
    try {
      // Check if template exists and user has access
      const existingTemplate = await this.getTemplateById(templateId, userRole);
      if (!existingTemplate) {
        return false;
      }

      const { error } = await supabaseService.getClient()
        .from(this.tableName)
        .update({
          is_active: false,
          updated_by: deletedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      if (error) {
        throw new Error(`Failed to delete template: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }

  /**
   * Get templates by category with role filtering
   */
  async getTemplatesByCategory(
    category: TemplateCategory,
    userRole: UserRole,
    language: Language = Language.FRENCH
  ): Promise<Template[]> {
    return this.getTemplatesByRole(userRole, language, { category });
  }

  /**
   * Get templates by language with role filtering
   * Requirement 3.5: Support both French and Arabic language templates
   */
  async getTemplatesByLanguage(
    language: Language,
    userRole: UserRole,
    category?: TemplateCategory
  ): Promise<Template[]> {
    return this.getTemplatesByRole(userRole, language, { category });
  }

  /**
   * Create language-specific template with proper validation
   * Requirement 3.5: Multi-language template support
   */
  async createLanguageTemplate(
    templateDefinition: TemplateDefinition,
    createdBy: string,
    organizationId?: string
  ): Promise<TemplateStorageResult> {
    try {
      // Validate template definition with language-specific rules
      const validation = this.validateLanguageTemplateDefinition(templateDefinition);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Template validation failed',
          validationErrors: validation.errors.map(e => e.message)
        };
      }

      // Apply language-specific formatting to template content
      const formattingOptions = {
        language: templateDefinition.language,
        preserveFormatting: true,
        useLocalizedNumbers: false, // Keep placeholders as-is
        useLocalizedDates: false, // Keep placeholders as-is
        applyTypographyRules: true
      };

      const formattedContent = languageFormattingService.formatContent(
        templateDefinition.content,
        formattingOptions
      );

      // Create template with formatted content
      const enhancedDefinition: TemplateDefinition = {
        ...templateDefinition,
        content: formattedContent.content
      };

      return this.createTemplate(enhancedDefinition, createdBy, organizationId);
    } catch (error) {
      console.error('Error creating language template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Convert template to another language
   * Requirement 3.5: Multi-language template support
   */
  async convertTemplateLanguage(
    sourceTemplateId: string,
    targetLanguage: Language,
    newName: string,
    createdBy: string,
    userRole: UserRole
  ): Promise<TemplateStorageResult> {
    try {
      const sourceTemplate = await this.getTemplateById(sourceTemplateId, userRole);
      if (!sourceTemplate) {
        return {
          success: false,
          error: 'Source template not found or access denied'
        };
      }

      // Convert content to target language
      const conversion = languageFormattingService.convertContentLanguage(
        sourceTemplate.content,
        sourceTemplate.language,
        targetLanguage
      );

      // Create new template definition
      const convertedDefinition: TemplateDefinition = {
        name: newName,
        description: `${sourceTemplate.description} (Converted to ${targetLanguage})`,
        category: sourceTemplate.category,
        language: targetLanguage,
        applicableRoles: sourceTemplate.applicableRoles,
        content: conversion.convertedContent,
        variables: sourceTemplate.variables // Variables remain the same, only labels might need translation
      };

      const result = await this.createLanguageTemplate(convertedDefinition, createdBy);

      if (result.success && conversion.requiresManualReview) {
        return {
          ...result,
          validationErrors: [
            'Template converted successfully but requires manual review for text translation',
            ...conversion.notes
          ]
        };
      }

      return result;
    } catch (error) {
      console.error('Error converting template language:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get available languages for templates
   */
  async getAvailableTemplateLanguages(userRole: UserRole): Promise<Language[]> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from(this.tableName)
        .select('language')
        .eq('is_active', true)
        .contains('applicable_roles', [userRole]);

      if (error) {
        throw new Error(`Failed to retrieve available languages: ${error.message}`);
      }

      // Get unique languages
      const languages = [...new Set((data || []).map(record => record.language))];
      return languages as Language[];
    } catch (error) {
      console.error('Error retrieving available template languages:', error);
      return [Language.FRENCH]; // Default fallback
    }
  }

  /**
   * Validate template definition with language-specific rules
   */
  private validateLanguageTemplateDefinition(templateDef: TemplateDefinition): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    // Standard validation first
    const standardValidation = this.validateTemplateDefinition(templateDef);
    errors.push(...standardValidation.errors);

    // Language-specific validation
    const languageValidation = languageFormattingService.validateLanguageContent(
      templateDef.content,
      templateDef.language
    );

    if (!languageValidation.isValid) {
      errors.push(...languageValidation.warnings.map(warning => ({
        field: 'content',
        message: warning
      })));
    }

    // Add suggestions as warnings (non-blocking)
    languageValidation.suggestions.forEach(suggestion => {
      errors.push({
        field: 'content',
        message: `Suggestion: ${suggestion}`
      });
    });

    // Validate language-specific variable labels
    if (templateDef.variables) {
      templateDef.variables.forEach((variable, index) => {
        if (templateDef.language === Language.ARABIC) {
          // Check if Arabic variables have Arabic labels
          if (!/[\u0600-\u06FF]/.test(variable.label)) {
            errors.push({
              field: `variables[${index}].label`,
              message: `Arabic template should have Arabic labels for variable: ${variable.name}`
            });
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Search templates with role-based filtering
   */
  async searchTemplates(
    searchQuery: string,
    userRole: UserRole,
    language: Language = Language.FRENCH,
    category?: TemplateCategory
  ): Promise<Template[]> {
    return this.getTemplatesByRole(userRole, language, { searchQuery, category });
  }

  /**
   * Get template variables for a specific template
   * Requirement 3.2: Display customizable variables and fields
   */
  async getTemplateVariables(templateId: string, userRole: UserRole): Promise<TemplateVariable[]> {
    try {
      const template = await this.getTemplateById(templateId, userRole);
      if (!template) {
        throw new Error('Template not found or access denied');
      }

      return template.variables;
    } catch (error) {
      console.error('Error retrieving template variables:', error);
      throw error;
    }
  }

  /**
   * Validate template definition
   */
  private validateTemplateDefinition(templateDef: TemplateDefinition): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    // Required fields validation
    if (!templateDef.name || templateDef.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Template name is required' });
    }

    if (!templateDef.content || templateDef.content.trim().length === 0) {
      errors.push({ field: 'content', message: 'Template content is required' });
    }

    if (!templateDef.applicableRoles || templateDef.applicableRoles.length === 0) {
      errors.push({ field: 'applicableRoles', message: 'At least one applicable role is required' });
    }

    // Validate variables
    if (templateDef.variables) {
      const variableValidation = this.validateTemplateVariables(templateDef.variables);
      if (!variableValidation.isValid) {
        errors.push(...variableValidation.errors);
      }
    }

    // Validate content has variable placeholders if variables are defined
    if (templateDef.variables && templateDef.variables.length > 0) {
      const missingVariables = templateDef.variables.filter(variable => 
        !templateDef.content.includes(`{{${variable.name}}}`)
      );
      
      if (missingVariables.length > 0) {
        errors.push({
          field: 'content',
          message: `Template content missing placeholders for variables: ${missingVariables.map(v => v.name).join(', ')}`
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate template variables
   */
  private validateTemplateVariables(variables: TemplateVariable[]): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];
    const variableNames = new Set<string>();

    variables.forEach((variable, index) => {
      const fieldPrefix = `variables[${index}]`;

      // Required fields
      if (!variable.name || variable.name.trim().length === 0) {
        errors.push({ field: `${fieldPrefix}.name`, message: 'Variable name is required' });
      } else {
        // Check for duplicate names
        if (variableNames.has(variable.name)) {
          errors.push({ field: `${fieldPrefix}.name`, message: `Duplicate variable name: ${variable.name}` });
        }
        variableNames.add(variable.name);

        // Validate name format (alphanumeric and underscore only)
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.name)) {
          errors.push({ field: `${fieldPrefix}.name`, message: 'Variable name must start with letter or underscore and contain only alphanumeric characters and underscores' });
        }
      }

      if (!variable.label || variable.label.trim().length === 0) {
        errors.push({ field: `${fieldPrefix}.label`, message: 'Variable label is required' });
      }

      if (!variable.type) {
        errors.push({ field: `${fieldPrefix}.type`, message: 'Variable type is required' });
      }

      // Validate validation rules if present
      if (variable.validation) {
        variable.validation.forEach((rule, ruleIndex) => {
          if (!rule.type || !rule.message) {
            errors.push({ 
              field: `${fieldPrefix}.validation[${ruleIndex}]`, 
              message: 'Validation rule must have type and message' 
            });
          }
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user role has access to template
   */
  private hasRoleAccess(template: Template, userRole: UserRole): boolean {
    return template.applicableRoles.includes(userRole);
  }

  /**
   * Transform database record to Template object
   */
  private transformDatabaseRecordToTemplate(record: any): Template {
    return {
      id: record.id,
      name: record.name,
      description: record.description || '',
      category: record.category,
      language: record.language,
      applicableRoles: record.applicable_roles || [],
      content: record.content,
      variables: record.variables ? JSON.parse(record.variables) : [],
      createdAt: new Date(record.created_at),
      createdBy: record.created_by,
      updatedAt: new Date(record.updated_at || record.created_at),
      updatedBy: record.updated_by || record.created_by,
      isActive: record.is_active,
      version: record.version || 1
    };
  }

  /**
   * Create access control entry for template
   */
  private async createAccessControlEntry(
    templateId: string,
    allowedRoles: UserRole[],
    createdBy: string,
    organizationId?: string
  ): Promise<void> {
    const accessControlData = {
      template_id: templateId,
      allowed_roles: allowedRoles,
      is_public: false,
      created_by: createdBy,
      organization_id: organizationId
    };

    const { error } = await supabaseService.getClient()
      .from(this.accessControlTable)
      .insert(accessControlData);

    if (error) {
      console.error('Failed to create access control entry:', error);
      // Don't throw error as template creation was successful
    }
  }

  /**
   * Update access control entry for template
   */
  private async updateAccessControlEntry(templateId: string, allowedRoles: UserRole[]): Promise<void> {
    const { error } = await supabaseService.getClient()
      .from(this.accessControlTable)
      .update({ allowed_roles: allowedRoles })
      .eq('template_id', templateId);

    if (error) {
      console.error('Failed to update access control entry:', error);
      // Don't throw error as template update was successful
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateUsageStats(templateId: string): Promise<{
    usageCount: number;
    lastUsed?: Date;
    popularVariables: string[];
  }> {
    try {
      // This would typically query a usage tracking table
      // For now, return mock data structure
      return {
        usageCount: 0,
        lastUsed: undefined,
        popularVariables: []
      };
    } catch (error) {
      console.error('Error retrieving template usage stats:', error);
      return {
        usageCount: 0,
        lastUsed: undefined,
        popularVariables: []
      };
    }
  }

  /**
   * Clone an existing template
   */
  async cloneTemplate(
    sourceTemplateId: string,
    newName: string,
    createdBy: string,
    userRole: UserRole
  ): Promise<TemplateStorageResult> {
    try {
      const sourceTemplate = await this.getTemplateById(sourceTemplateId, userRole);
      if (!sourceTemplate) {
        return {
          success: false,
          error: 'Source template not found or access denied'
        };
      }

      const clonedTemplateDefinition: TemplateDefinition = {
        name: newName,
        description: `Cloned from: ${sourceTemplate.name}`,
        category: sourceTemplate.category,
        language: sourceTemplate.language,
        applicableRoles: sourceTemplate.applicableRoles,
        content: sourceTemplate.content,
        variables: sourceTemplate.variables
      };

      return this.createTemplate(clonedTemplateDefinition, createdBy);
    } catch (error) {
      console.error('Error cloning template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate template definition with language-specific rules
   */
  private validateLanguageTemplateDefinition(templateDef: TemplateDefinition): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    // Standard validation first
    const standardValidation = this.validateTemplateDefinition(templateDef);
    errors.push(...standardValidation.errors);

    // Language-specific validation
    const languageValidation = languageFormattingService.validateLanguageContent(
      templateDef.content,
      templateDef.language
    );

    if (!languageValidation.isValid) {
      errors.push(...languageValidation.warnings.map(warning => ({
        field: 'content',
        message: warning
      })));
    }

    // Add suggestions as warnings (non-blocking)
    languageValidation.suggestions.forEach(suggestion => {
      errors.push({
        field: 'content',
        message: `Suggestion: ${suggestion}`
      });
    });

    // Validate language-specific variable labels
    if (templateDef.variables) {
      templateDef.variables.forEach((variable, index) => {
        if (templateDef.language === Language.ARABIC) {
          // Check if Arabic variables have Arabic labels
          if (!/[\u0600-\u06FF]/.test(variable.label)) {
            errors.push({
              field: `variables[${index}].label`,
              message: `Arabic template should have Arabic labels for variable: ${variable.name}`
            });
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const templateManagementService = new TemplateManagementService();