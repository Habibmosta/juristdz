/**
 * Custom Template Service
 * 
 * Implements custom template creation, editing, saving, and sharing functionality
 * for the Document Management System.
 * 
 * Requirements: 3.4 - Custom template creation and reuse capabilities
 */

import {
  Template,
  TemplateDefinition,
  TemplateVariable,
  TemplateCategory,
  Language,
  ValidationResult,
  Permission,
  DocumentPermission
} from '../../../types/document-management';
import { UserRole } from '../../../types';
import { supabaseService } from './supabaseService';
import { templateManagementService } from './templateManagementService';
import { languageFormattingService } from '../utils/languageFormatting';

export interface CustomTemplateCreationRequest {
  name: string;
  description: string;
  category: TemplateCategory;
  language: Language;
  content: string;
  variables: TemplateVariable[];
  isPrivate?: boolean;
  shareWithRoles?: UserRole[];
  shareWithUsers?: string[]; // User IDs
}

export interface CustomTemplateUpdateRequest {
  name?: string;
  description?: string;
  content?: string;
  variables?: TemplateVariable[];
  isPrivate?: boolean;
  shareWithRoles?: UserRole[];
  shareWithUsers?: string[];
}

export interface TemplateShareRequest {
  templateId: string;
  shareWithUsers?: string[]; // User IDs
  shareWithRoles?: UserRole[];
  permissions: Permission[];
  message?: string;
  expiresAt?: Date;
}

export interface TemplateShareResult {
  success: boolean;
  shareId?: string;
  shareLink?: string;
  error?: string;
}

export interface CustomTemplateResult {
  success: boolean;
  templateId?: string;
  template?: Template;
  error?: string;
  validationErrors?: string[];
}

export interface TemplateEditor {
  templateId: string;
  content: string;
  variables: TemplateVariable[];
  previewContent?: string;
  lastSaved?: Date;
  isDirty: boolean;
}

export interface TemplateLibrary {
  personalTemplates: Template[];
  sharedTemplates: Template[];
  publicTemplates: Template[];
  favoriteTemplates: Template[];
}

/**
 * Custom Template Service Class
 * Handles custom template creation, editing, saving, and sharing
 */
export class CustomTemplateService {
  private readonly customTemplatesTable = 'custom_templates';
  private readonly templateSharesTable = 'template_shares';
  private readonly templateFavoritesTable = 'template_favorites';

  /**
   * Create a new custom template
   * Requirement 3.4: Add custom template creation and editing
   */
  async createCustomTemplate(
    request: CustomTemplateCreationRequest,
    createdBy: string,
    userRole: UserRole,
    organizationId?: string
  ): Promise<CustomTemplateResult> {
    try {
      // Validate the template creation request
      const validation = this.validateCustomTemplateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Template validation failed',
          validationErrors: validation.errors.map(e => e.message)
        };
      }

      // Determine applicable roles
      let applicableRoles: UserRole[];
      if (request.isPrivate) {
        applicableRoles = [userRole]; // Only creator can use private templates
      } else if (request.shareWithRoles && request.shareWithRoles.length > 0) {
        applicableRoles = [...new Set([userRole, ...request.shareWithRoles])];
      } else {
        applicableRoles = [userRole];
      }

      // Create template definition
      const templateDefinition: TemplateDefinition = {
        name: request.name,
        description: request.description,
        category: request.category,
        language: request.language,
        applicableRoles,
        content: request.content,
        variables: request.variables
      };

      // Create the template using the template management service
      const result = await templateManagementService.createTemplate(
        templateDefinition,
        createdBy,
        organizationId
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          validationErrors: result.validationErrors
        };
      }

      // Mark as custom template and handle sharing
      await this.markAsCustomTemplate(result.templateId!, createdBy, request.isPrivate || false);

      // Handle user-specific sharing
      if (request.shareWithUsers && request.shareWithUsers.length > 0) {
        await this.shareTemplateWithUsers(
          result.templateId!,
          request.shareWithUsers,
          [Permission.VIEW, Permission.EDIT],
          createdBy
        );
      }

      // Get the created template
      const template = await templateManagementService.getTemplateById(result.templateId!, userRole);

      return {
        success: true,
        templateId: result.templateId,
        template: template || undefined
      };

    } catch (error) {
      console.error('Error creating custom template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update an existing custom template
   * Requirement 3.4: Add custom template creation and editing
   */
  async updateCustomTemplate(
    templateId: string,
    updates: CustomTemplateUpdateRequest,
    updatedBy: string,
    userRole: UserRole
  ): Promise<CustomTemplateResult> {
    try {
      // Check if user has permission to edit this template
      const hasPermission = await this.hasTemplatePermission(templateId, updatedBy, Permission.EDIT);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Permission denied: You do not have edit access to this template'
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

      // Prepare template updates
      const templateUpdates: Partial<TemplateDefinition> = {};
      if (updates.name) templateUpdates.name = updates.name;
      if (updates.description) templateUpdates.description = updates.description;
      if (updates.content) templateUpdates.content = updates.content;
      if (updates.variables) templateUpdates.variables = updates.variables;

      // Handle role sharing updates
      if (updates.shareWithRoles !== undefined) {
        const currentTemplate = await templateManagementService.getTemplateById(templateId, userRole);
        if (currentTemplate) {
          const newApplicableRoles = updates.shareWithRoles.length > 0 
            ? [...new Set([userRole, ...updates.shareWithRoles])]
            : [userRole];
          templateUpdates.applicableRoles = newApplicableRoles;
        }
      }

      // Update the template
      const result = await templateManagementService.updateTemplate(
        templateId,
        templateUpdates,
        updatedBy,
        userRole
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          validationErrors: result.validationErrors
        };
      }

      // Update privacy settings
      if (updates.isPrivate !== undefined) {
        await this.updateTemplatePrivacy(templateId, updates.isPrivate);
      }

      // Handle user-specific sharing updates
      if (updates.shareWithUsers !== undefined) {
        await this.updateTemplateUserSharing(
          templateId,
          updates.shareWithUsers,
          [Permission.VIEW, Permission.EDIT],
          updatedBy
        );
      }

      // Get the updated template
      const template = await templateManagementService.getTemplateById(templateId, userRole);

      return {
        success: true,
        templateId,
        template: template || undefined
      };

    } catch (error) {
      console.error('Error updating custom template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Save template as a new custom template (clone and customize)
   * Requirement 3.4: Implement template saving and reuse capabilities
   */
  async saveAsCustomTemplate(
    sourceTemplateId: string,
    customName: string,
    customizations: Partial<CustomTemplateCreationRequest>,
    savedBy: string,
    userRole: UserRole
  ): Promise<CustomTemplateResult> {
    try {
      // Get the source template
      const sourceTemplate = await templateManagementService.getTemplateById(sourceTemplateId, userRole);
      if (!sourceTemplate) {
        return {
          success: false,
          error: 'Source template not found or access denied'
        };
      }

      // Create custom template request based on source template
      const customTemplateRequest: CustomTemplateCreationRequest = {
        name: customName,
        description: customizations.description || `Custom template based on: ${sourceTemplate.name}`,
        category: customizations.category || sourceTemplate.category,
        language: customizations.language || sourceTemplate.language,
        content: customizations.content || sourceTemplate.content,
        variables: customizations.variables || sourceTemplate.variables,
        isPrivate: customizations.isPrivate !== undefined ? customizations.isPrivate : true,
        shareWithRoles: customizations.shareWithRoles,
        shareWithUsers: customizations.shareWithUsers
      };

      return this.createCustomTemplate(customTemplateRequest, savedBy, userRole);

    } catch (error) {
      console.error('Error saving as custom template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Share a template with specific users or roles
   * Requirement 3.4: Create template sharing and permissions
   */
  async shareTemplate(request: TemplateShareRequest, sharedBy: string): Promise<TemplateShareResult> {
    try {
      // Check if user has permission to share this template
      const hasPermission = await this.hasTemplatePermission(request.templateId, sharedBy, Permission.SHARE);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Permission denied: You do not have share access to this template'
        };
      }

      // Generate share ID
      const shareId = this.generateShareId();

      // Create share record
      const shareData = {
        id: shareId,
        template_id: request.templateId,
        shared_by: sharedBy,
        shared_with_users: request.shareWithUsers || [],
        shared_with_roles: request.shareWithRoles || [],
        permissions: request.permissions,
        message: request.message,
        expires_at: request.expiresAt?.toISOString(),
        created_at: new Date().toISOString(),
        is_active: true
      };

      const { error } = await supabaseService.getClient()
        .from(this.templateSharesTable)
        .insert(shareData);

      if (error) {
        throw new Error(`Failed to create template share: ${error.message}`);
      }

      // Create individual permission records for users
      if (request.shareWithUsers && request.shareWithUsers.length > 0) {
        await this.createUserPermissions(
          request.templateId,
          request.shareWithUsers,
          request.permissions,
          sharedBy,
          request.expiresAt
        );
      }

      // Generate share link
      const shareLink = this.generateShareLink(shareId);

      return {
        success: true,
        shareId,
        shareLink
      };

    } catch (error) {
      console.error('Error sharing template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user's custom template library
   * Requirement 3.4: Implement template saving and reuse capabilities
   */
  async getTemplateLibrary(userId: string, userRole: UserRole): Promise<TemplateLibrary> {
    try {
      // Get personal templates (created by user)
      const personalTemplates = await this.getPersonalTemplates(userId, userRole);

      // Get shared templates (shared with user)
      const sharedTemplates = await this.getSharedTemplates(userId, userRole);

      // Get public templates (available to user's role)
      const publicTemplates = await this.getPublicTemplates(userRole);

      // Get favorite templates
      const favoriteTemplates = await this.getFavoriteTemplates(userId, userRole);

      return {
        personalTemplates,
        sharedTemplates,
        publicTemplates,
        favoriteTemplates
      };

    } catch (error) {
      console.error('Error getting template library:', error);
      return {
        personalTemplates: [],
        sharedTemplates: [],
        publicTemplates: [],
        favoriteTemplates: []
      };
    }
  }

  /**
   * Create a template editor session
   * Requirement 3.4: Add custom template creation and editing
   */
  async createTemplateEditor(
    templateId?: string,
    userId?: string,
    userRole?: UserRole
  ): Promise<TemplateEditor> {
    try {
      let content = '';
      let variables: TemplateVariable[] = [];
      let actualTemplateId = templateId;

      if (templateId && userId && userRole) {
        // Load existing template
        const template = await templateManagementService.getTemplateById(templateId, userRole);
        if (template) {
          content = template.content;
          variables = template.variables;
        }
      } else {
        // Create new template editor
        actualTemplateId = this.generateTempTemplateId();
        content = this.getDefaultTemplateContent();
        variables = this.getDefaultTemplateVariables();
      }

      return {
        templateId: actualTemplateId || this.generateTempTemplateId(),
        content,
        variables,
        previewContent: undefined,
        lastSaved: undefined,
        isDirty: false
      };

    } catch (error) {
      console.error('Error creating template editor:', error);
      throw error;
    }
  }

  /**
   * Generate preview of template with sample data
   * Requirement 3.4: Add custom template creation and editing
   */
  async generateTemplatePreview(
    content: string,
    variables: TemplateVariable[],
    language: Language = Language.FRENCH
  ): Promise<string> {
    try {
      // Generate sample data for variables
      const sampleVariables: Record<string, any> = {};
      variables.forEach(variable => {
        sampleVariables[variable.name] = this.generateSampleVariableValue(variable);
      });

      // Use template processing service to generate preview
      const { templateProcessingService } = await import('./templateProcessingService');
      
      // Create a temporary template object
      const tempTemplate: Template = {
        id: 'preview',
        name: 'Preview',
        description: 'Template Preview',
        category: TemplateCategory.CONTRACT,
        language,
        applicableRoles: [],
        content,
        variables,
        createdAt: new Date(),
        createdBy: 'preview',
        updatedAt: new Date(),
        updatedBy: 'preview',
        isActive: true,
        version: 1
      };

      const processed = await templateProcessingService.processTemplate(
        tempTemplate,
        sampleVariables,
        {
          preserveFormatting: true,
          validateVariables: false,
          outputFormat: 'html',
          language,
          useLanguageFormatting: true
        }
      );

      return processed.content;

    } catch (error) {
      console.error('Error generating template preview:', error);
      return content; // Return original content if preview fails
    }
  }

  /**
   * Add template to favorites
   */
  async addToFavorites(templateId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseService.getClient()
        .from(this.templateFavoritesTable)
        .insert({
          template_id: templateId,
          user_id: userId,
          created_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Error adding template to favorites:', error);
      return false;
    }
  }

  /**
   * Remove template from favorites
   */
  async removeFromFavorites(templateId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseService.getClient()
        .from(this.templateFavoritesTable)
        .delete()
        .eq('template_id', templateId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Error removing template from favorites:', error);
      return false;
    }
  }

  /**
   * Get template sharing information
   */
  async getTemplateShares(templateId: string, userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from(this.templateSharesTable)
        .select('*')
        .eq('template_id', templateId)
        .eq('shared_by', userId)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to get template shares: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting template shares:', error);
      return [];
    }
  }

  /**
   * Revoke template sharing
   */
  async revokeTemplateShare(shareId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseService.getClient()
        .from(this.templateSharesTable)
        .update({ is_active: false })
        .eq('id', shareId)
        .eq('shared_by', userId);

      return !error;
    } catch (error) {
      console.error('Error revoking template share:', error);
      return false;
    }
  }

  // Private helper methods

  private validateCustomTemplateRequest(request: CustomTemplateCreationRequest): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    // Required fields validation
    if (!request.name || request.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Template name is required' });
    }

    if (!request.content || request.content.trim().length === 0) {
      errors.push({ field: 'content', message: 'Template content is required' });
    }

    // Validate variables
    if (request.variables && request.variables.length > 0) {
      const variableValidation = this.validateTemplateVariables(request.variables);
      if (!variableValidation.isValid) {
        errors.push(...variableValidation.errors);
      }
    }

    // Validate content has variable placeholders if variables are defined
    if (request.variables && request.variables.length > 0) {
      const missingVariables = request.variables.filter(variable => 
        !request.content.includes(`{{${variable.name}}}`)
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
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async markAsCustomTemplate(templateId: string, createdBy: string, isPrivate: boolean): Promise<void> {
    try {
      const { error } = await supabaseService.getClient()
        .from(this.customTemplatesTable)
        .insert({
          template_id: templateId,
          created_by: createdBy,
          is_private: isPrivate,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to mark as custom template:', error);
      }
    } catch (error) {
      console.error('Error marking as custom template:', error);
    }
  }

  private async hasTemplatePermission(templateId: string, userId: string, permission: Permission): Promise<boolean> {
    try {
      // Check if user is the creator
      const { data: template } = await supabaseService.getClient()
        .from('templates')
        .select('created_by')
        .eq('id', templateId)
        .single();

      if (template && template.created_by === userId) {
        return true; // Creator has all permissions
      }

      // Check explicit permissions
      const { data: permissions } = await supabaseService.getClient()
        .from('document_permissions')
        .select('permission')
        .eq('document_id', templateId)
        .eq('user_id', userId);

      if (permissions && permissions.some(p => p.permission === permission)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking template permission:', error);
      return false;
    }
  }

  private async shareTemplateWithUsers(
    templateId: string,
    userIds: string[],
    permissions: Permission[],
    sharedBy: string
  ): Promise<void> {
    try {
      await this.createUserPermissions(templateId, userIds, permissions, sharedBy);
    } catch (error) {
      console.error('Error sharing template with users:', error);
    }
  }

  private async createUserPermissions(
    templateId: string,
    userIds: string[],
    permissions: Permission[],
    grantedBy: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      const permissionRecords = userIds.flatMap(userId =>
        permissions.map(permission => ({
          document_id: templateId,
          user_id: userId,
          permission,
          granted_by: grantedBy,
          granted_at: new Date().toISOString(),
          expires_at: expiresAt?.toISOString()
        }))
      );

      const { error } = await supabaseService.getClient()
        .from('document_permissions')
        .insert(permissionRecords);

      if (error) {
        console.error('Failed to create user permissions:', error);
      }
    } catch (error) {
      console.error('Error creating user permissions:', error);
    }
  }

  private async updateTemplatePrivacy(templateId: string, isPrivate: boolean): Promise<void> {
    try {
      const { error } = await supabaseService.getClient()
        .from(this.customTemplatesTable)
        .update({ is_private: isPrivate })
        .eq('template_id', templateId);

      if (error) {
        console.error('Failed to update template privacy:', error);
      }
    } catch (error) {
      console.error('Error updating template privacy:', error);
    }
  }

  private async updateTemplateUserSharing(
    templateId: string,
    userIds: string[],
    permissions: Permission[],
    updatedBy: string
  ): Promise<void> {
    try {
      // Remove existing user permissions
      await supabaseService.getClient()
        .from('document_permissions')
        .delete()
        .eq('document_id', templateId)
        .eq('granted_by', updatedBy);

      // Add new permissions
      if (userIds.length > 0) {
        await this.createUserPermissions(templateId, userIds, permissions, updatedBy);
      }
    } catch (error) {
      console.error('Error updating template user sharing:', error);
    }
  }

  private async getPersonalTemplates(userId: string, userRole: UserRole): Promise<Template[]> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from('templates')
        .select('*')
        .eq('created_by', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get personal templates: ${error.message}`);
      }

      return (data || []).map(this.transformDatabaseRecordToTemplate);
    } catch (error) {
      console.error('Error getting personal templates:', error);
      return [];
    }
  }

  private async getSharedTemplates(userId: string, userRole: UserRole): Promise<Template[]> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from('templates')
        .select(`
          *,
          document_permissions!inner(user_id)
        `)
        .eq('document_permissions.user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get shared templates: ${error.message}`);
      }

      return (data || []).map(this.transformDatabaseRecordToTemplate);
    } catch (error) {
      console.error('Error getting shared templates:', error);
      return [];
    }
  }

  private async getPublicTemplates(userRole: UserRole): Promise<Template[]> {
    try {
      return await templateManagementService.getTemplatesByRole(userRole);
    } catch (error) {
      console.error('Error getting public templates:', error);
      return [];
    }
  }

  private async getFavoriteTemplates(userId: string, userRole: UserRole): Promise<Template[]> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from('templates')
        .select(`
          *,
          template_favorites!inner(user_id)
        `)
        .eq('template_favorites.user_id', userId)
        .eq('is_active', true)
        .order('template_favorites.created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get favorite templates: ${error.message}`);
      }

      return (data || []).map(this.transformDatabaseRecordToTemplate);
    } catch (error) {
      console.error('Error getting favorite templates:', error);
      return [];
    }
  }

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

  private generateShareId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateShareLink(shareId: string): string {
    // This would typically be a full URL to the template sharing page
    return `/templates/shared/${shareId}`;
  }

  private generateTempTemplateId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultTemplateContent(): string {
    return `# Nouveau Modèle

Ceci est un nouveau modèle personnalisé. Vous pouvez utiliser des variables en les entourant de doubles accolades, par exemple : {{nomClient}}.

## Section 1

Contenu de la section 1 avec la variable {{dateDocument}}.

## Section 2

Contenu de la section 2 avec la variable {{montant}}.

---

Créé le {{dateCreation}} par {{auteur}}.`;
  }

  private getDefaultTemplateVariables(): TemplateVariable[] {
    return [
      {
        name: 'nomClient',
        type: 'text' as any,
        label: 'Nom du client',
        required: true,
        placeholder: 'Entrez le nom du client'
      },
      {
        name: 'dateDocument',
        type: 'date' as any,
        label: 'Date du document',
        required: true,
        defaultValue: new Date().toISOString().split('T')[0]
      },
      {
        name: 'montant',
        type: 'number' as any,
        label: 'Montant',
        required: false,
        placeholder: '0.00'
      },
      {
        name: 'dateCreation',
        type: 'date' as any,
        label: 'Date de création',
        required: false,
        defaultValue: new Date().toISOString().split('T')[0]
      },
      {
        name: 'auteur',
        type: 'text' as any,
        label: 'Auteur',
        required: false,
        placeholder: 'Nom de l\'auteur'
      }
    ];
  }

  private generateSampleVariableValue(variable: TemplateVariable): any {
    switch (variable.type) {
      case 'text':
        return variable.name === 'nomClient' ? 'Jean Dupont' :
               variable.name === 'auteur' ? 'Maître Martin' :
               `Exemple ${variable.label}`;
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'number':
        return variable.name === 'montant' ? '1500.00' : '42';
      case 'boolean':
        return true;
      case 'list':
        return ['Option 1', 'Option 2'];
      default:
        return `Exemple ${variable.label}`;
    }
  }
}

// Export singleton instance
export const customTemplateService = new CustomTemplateService();
