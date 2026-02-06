/**
 * Template Processing Engine Service
 * 
 * Implements variable substitution, document generation, and legal document formatting
 * for the Document Management System.
 * 
 * Requirements: 3.3, 3.6
 */

import {
  Template,
  TemplateVariable,
  TemplateVariables,
  GeneratedDocument,
  ProcessedDocument,
  ValidationResult,
  VariableType,
  Language
} from '../../../types/document-management';
import { templateManagementService } from './templateManagementService';
import { 
  languageFormattingService, 
  LanguageFormattingOptions,
  FormattedContent 
} from '../utils/languageFormatting';

export interface TemplateProcessingOptions {
  preserveFormatting?: boolean;
  validateVariables?: boolean;
  generateMetadata?: boolean;
  outputFormat?: 'html' | 'text' | 'markdown';
  language?: Language;
  useLanguageFormatting?: boolean;
  applyRTLSupport?: boolean;
  localizeNumbers?: boolean;
  localizeDates?: boolean;
}

export interface VariableValidationError {
  variableName: string;
  expectedType: VariableType;
  actualValue: any;
  message: string;
}

export interface DocumentGenerationResult {
  success: boolean;
  document?: GeneratedDocument;
  errors?: string[];
  warnings?: string[];
  validationErrors?: VariableValidationError[];
}

export interface TemplateProcessingResult {
  success: boolean;
  content?: string;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    processedVariables: string[];
    missingVariables: string[];
    processingTime: number;
    languageFormatting?: FormattedContent;
  };
}

/**
 * Template Processing Engine Class
 * Handles variable substitution, document generation, and formatting
 */
export class TemplateProcessingService {
  private readonly variablePattern = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  private readonly conditionalPattern = /\{\{\s*#if\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}(.*?)\{\{\s*\/if\s*\}\}/gs;
  private readonly loopPattern = /\{\{\s*#each\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}(.*?)\{\{\s*\/each\s*\}\}/gs;

  /**
   * Process template with variables and generate document
   * Requirement 3.3: Generate complete document with proper formatting
   * Requirement 3.5: Multi-language template support with French and Arabic
   */
  async processTemplate(
    template: Template,
    variables: TemplateVariables,
    options: TemplateProcessingOptions = {}
  ): Promise<ProcessedDocument> {
    const startTime = Date.now();

    try {
      // Use template language if not specified in options
      const language = options.language || template.language;
      
      // Validate variables if requested
      if (options.validateVariables !== false) {
        const validation = this.validateTemplateVariables(template, variables);
        if (!validation.isValid) {
          throw new Error(`Variable validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }

      // Process template content
      let processedContent = template.content;
      const processedVariables: string[] = [];
      const missingVariables: string[] = [];

      // Process conditional blocks first
      processedContent = this.processConditionals(processedContent, variables);

      // Process loops
      processedContent = this.processLoops(processedContent, variables);

      // Process simple variable substitutions with language-aware formatting
      processedContent = processedContent.replace(this.variablePattern, (match, variableName) => {
        if (variables.hasOwnProperty(variableName)) {
          processedVariables.push(variableName);
          const value = variables[variableName];
          return this.formatVariableValue(variableName, value, template.variables, { ...options, language });
        } else {
          missingVariables.push(variableName);
          return match; // Keep placeholder if variable not provided
        }
      });

      // Apply language-specific formatting
      let languageFormatting: FormattedContent | undefined;
      if (options.useLanguageFormatting !== false) {
        const formattingOptions: LanguageFormattingOptions = {
          language,
          preserveFormatting: options.preserveFormatting,
          useLocalizedNumbers: options.localizeNumbers,
          useLocalizedDates: options.localizeDates,
          applyTypographyRules: true
        };

        languageFormatting = languageFormattingService.formatContent(processedContent, formattingOptions);
        processedContent = languageFormatting.content;
      }

      // Apply legal document formatting (now language-aware)
      if (options.preserveFormatting !== false) {
        processedContent = this.applyLegalDocumentFormatting(processedContent, { ...options, language });
      }

      const processingTime = Date.now() - startTime;

      return {
        content: processedContent,
        metadata: {
          templateId: template.id,
          variables,
          processedAt: new Date(),
          language,
          direction: language === Language.ARABIC ? 'rtl' : 'ltr',
          languageFormatting
        }
      };

    } catch (error) {
      throw new Error(`Template processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate document from template with full validation and error handling
   * Requirement 3.3: Generate complete document with proper formatting
   */
  async generateDocument(
    templateId: string,
    variables: TemplateVariables,
    userId: string,
    options: TemplateProcessingOptions = {}
  ): Promise<DocumentGenerationResult> {
    try {
      // Get template (assuming user has access - validation done in template service)
      const template = await templateManagementService.getTemplateById(templateId, 'avocat' as any); // TODO: Get actual user role
      if (!template) {
        return {
          success: false,
          errors: ['Template not found or access denied']
        };
      }

      // Validate variables
      const validation = this.validateTemplateVariables(template, variables);
      const validationErrors = validation.errors.map(e => ({
        variableName: e.field,
        expectedType: 'text' as VariableType, // TODO: Get actual expected type
        actualValue: variables[e.field],
        message: e.message
      }));

      // Process template even with validation warnings
      const processed = await this.processTemplate(template, variables, options);

      // Generate document metadata
      const generatedDocument: GeneratedDocument = {
        id: this.generateDocumentId(),
        templateId: template.id,
        content: processed.content,
        variables,
        generatedAt: new Date(),
        generatedBy: userId,
        format: options.outputFormat || 'html'
      };

      const warnings: string[] = [];
      if (validationErrors.length > 0) {
        warnings.push(`Some variables failed validation but document was generated`);
      }

      return {
        success: true,
        document: generatedDocument,
        warnings,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined
      };

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Validate template variables against their definitions
   * Requirement 3.3: Add template validation and error handling
   */
  validateTemplateVariables(template: Template, variables: TemplateVariables): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    for (const templateVar of template.variables) {
      const value = variables[templateVar.name];

      // Check required variables
      if (templateVar.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: templateVar.name,
          message: `Required variable '${templateVar.label}' is missing`
        });
        continue;
      }

      // Skip validation for optional empty variables
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Type validation
      const typeValidation = this.validateVariableType(templateVar, value);
      if (typeValidation) {
        errors.push(typeValidation);
      }

      // Custom validation rules
      if (templateVar.validation) {
        for (const rule of templateVar.validation) {
          const ruleValidation = this.validateVariableRule(templateVar, value, rule);
          if (ruleValidation) {
            errors.push(ruleValidation);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Apply legal document formatting
   * Requirement 3.6: Implement proper legal document formatting
   */
  private applyLegalDocumentFormatting(
    content: string,
    options: TemplateProcessingOptions
  ): string {
    let formatted = content;

    // Apply language-specific formatting
    if (options.language === Language.ARABIC) {
      formatted = this.applyArabicFormatting(formatted);
    } else {
      formatted = this.applyFrenchFormatting(formatted);
    }

    // Apply legal document structure formatting
    formatted = this.applyLegalStructureFormatting(formatted, options);

    // Apply output format
    switch (options.outputFormat) {
      case 'html':
        formatted = this.convertToHTML(formatted);
        break;
      case 'markdown':
        formatted = this.convertToMarkdown(formatted);
        break;
      case 'text':
      default:
        // Keep as plain text
        break;
    }

    return formatted;
  }

  /**
   * Apply Arabic-specific formatting
   * Requirement 3.6: Support Arabic language templates with proper formatting
   */
  private applyArabicFormatting(content: string): string {
    // Apply right-to-left text direction
    let formatted = content;

    // Ensure proper Arabic text flow
    formatted = formatted.replace(/\n/g, '\n');
    
    // Add RTL markers for mixed content
    formatted = formatted.replace(
      /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+)/g,
      '\u202E$1\u202C'
    );

    // Format Arabic dates
    formatted = this.formatArabicDates(formatted);

    // Format Arabic numbers
    formatted = this.formatArabicNumbers(formatted);

    return formatted;
  }

  /**
   * Apply French-specific formatting
   * Requirement 3.6: Support French language templates with proper formatting
   */
  private applyFrenchFormatting(content: string): string {
    let formatted = content;

    // Format French dates
    formatted = this.formatFrenchDates(formatted);

    // Apply French typography rules
    formatted = formatted.replace(/\s+([!?:;])/g, '\u00A0$1'); // Non-breaking space before punctuation
    formatted = formatted.replace(/«\s*/g, '«\u00A0'); // Non-breaking space after opening guillemets
    formatted = formatted.replace(/\s*»/g, '\u00A0»'); // Non-breaking space before closing guillemets

    return formatted;
  }

  /**
   * Apply legal document structure formatting
   */
  private applyLegalStructureFormatting(
    content: string,
    options: TemplateProcessingOptions
  ): string {
    let formatted = content;

    // Format article numbers and sections
    formatted = formatted.replace(/^(\d+\.\s*)/gm, '<strong>$1</strong>');
    
    // Format legal references
    formatted = formatted.replace(
      /\b(Article\s+\d+|Art\.\s*\d+|Loi\s+n°\s*[\d-]+)\b/gi,
      '<em>$1</em>'
    );

    // Format dates in legal format
    formatted = this.formatLegalDates(formatted);

    // Format monetary amounts
    formatted = this.formatMonetaryAmounts(formatted);

    return formatted;
  }

  /**
   * Process conditional blocks in template
   */
  private processConditionals(content: string, variables: TemplateVariables): string {
    return content.replace(this.conditionalPattern, (match, variableName, blockContent) => {
      const value = variables[variableName];
      
      // Show block if variable is truthy
      if (value && value !== '' && value !== 0 && value !== false) {
        return blockContent;
      }
      
      return ''; // Hide block if variable is falsy
    });
  }

  /**
   * Process loop blocks in template
   */
  private processLoops(content: string, variables: TemplateVariables): string {
    return content.replace(this.loopPattern, (match, variableName, blockContent) => {
      const arrayValue = variables[variableName];
      
      if (!Array.isArray(arrayValue)) {
        return ''; // Skip if not an array
      }
      
      return arrayValue.map((item, index) => {
        let itemContent = blockContent;
        
        // Replace {{this}} with current item
        itemContent = itemContent.replace(/\{\{\s*this\s*\}\}/g, String(item));
        
        // Replace {{@index}} with current index
        itemContent = itemContent.replace(/\{\{\s*@index\s*\}\}/g, String(index));
        
        // If item is an object, replace {{property}} with item.property
        if (typeof item === 'object' && item !== null) {
          for (const [key, value] of Object.entries(item)) {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
            itemContent = itemContent.replace(regex, String(value));
          }
        }
        
        return itemContent;
      }).join('');
    });
  }

  /**
   * Format variable value based on its type and definition
   */
  private formatVariableValue(
    variableName: string,
    value: any,
    templateVariables: TemplateVariable[],
    options: TemplateProcessingOptions
  ): string {
    const templateVar = templateVariables.find(v => v.name === variableName);
    
    if (!templateVar) {
      return String(value);
    }

    switch (templateVar.type) {
      case VariableType.DATE:
        return this.formatDate(value, options.language);
      
      case VariableType.NUMBER:
        return this.formatNumber(value, options.language);
      
      case VariableType.BOOLEAN:
        return this.formatBoolean(value, options.language);
      
      case VariableType.LIST:
        return Array.isArray(value) ? value.join(', ') : String(value);
      
      case VariableType.TEXT:
      default:
        return String(value);
    }
  }

  /**
   * Validate variable type
   */
  private validateVariableType(
    templateVar: TemplateVariable,
    value: any
  ): { field: string; message: string } | null {
    switch (templateVar.type) {
      case VariableType.DATE:
        if (!this.isValidDate(value)) {
          return {
            field: templateVar.name,
            message: `Variable '${templateVar.label}' must be a valid date`
          };
        }
        break;
      
      case VariableType.NUMBER:
        if (isNaN(Number(value))) {
          return {
            field: templateVar.name,
            message: `Variable '${templateVar.label}' must be a valid number`
          };
        }
        break;
      
      case VariableType.BOOLEAN:
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          return {
            field: templateVar.name,
            message: `Variable '${templateVar.label}' must be a boolean value`
          };
        }
        break;
      
      case VariableType.LIST:
        if (!Array.isArray(value) && typeof value !== 'string') {
          return {
            field: templateVar.name,
            message: `Variable '${templateVar.label}' must be an array or comma-separated string`
          };
        }
        break;
    }

    return null;
  }

  /**
   * Validate variable against custom rules
   */
  private validateVariableRule(
    templateVar: TemplateVariable,
    value: any,
    rule: any
  ): { field: string; message: string } | null {
    switch (rule.type) {
      case 'required':
        if (!value || value === '') {
          return {
            field: templateVar.name,
            message: rule.message || `Variable '${templateVar.label}' is required`
          };
        }
        break;
      
      case 'minLength':
        if (String(value).length < rule.value) {
          return {
            field: templateVar.name,
            message: rule.message || `Variable '${templateVar.label}' must be at least ${rule.value} characters`
          };
        }
        break;
      
      case 'maxLength':
        if (String(value).length > rule.value) {
          return {
            field: templateVar.name,
            message: rule.message || `Variable '${templateVar.label}' must not exceed ${rule.value} characters`
          };
        }
        break;
      
      case 'pattern':
        const regex = new RegExp(rule.value);
        if (!regex.test(String(value))) {
          return {
            field: templateVar.name,
            message: rule.message || `Variable '${templateVar.label}' format is invalid`
          };
        }
        break;
      
      case 'range':
        const numValue = Number(value);
        if (numValue < rule.value.min || numValue > rule.value.max) {
          return {
            field: templateVar.name,
            message: rule.message || `Variable '${templateVar.label}' must be between ${rule.value.min} and ${rule.value.max}`
          };
        }
        break;
    }

    return null;
  }

  // Utility methods for formatting
  private formatDate(value: any, language?: Language): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return String(value);
    }

    if (language === Language.ARABIC) {
      return date.toLocaleDateString('ar-DZ');
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  }

  private formatNumber(value: any, language?: Language): string {
    const num = Number(value);
    if (isNaN(num)) {
      return String(value);
    }

    if (language === Language.ARABIC) {
      return num.toLocaleString('ar-DZ');
    } else {
      return num.toLocaleString('fr-FR');
    }
  }

  private formatBoolean(value: any, language?: Language): string {
    const boolValue = Boolean(value);
    
    if (language === Language.ARABIC) {
      return boolValue ? 'نعم' : 'لا';
    } else {
      return boolValue ? 'Oui' : 'Non';
    }
  }

  private formatArabicDates(content: string): string {
    // Convert Gregorian dates to Arabic format
    return content.replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, (match) => {
      const date = new Date(match);
      return date.toLocaleDateString('ar-DZ');
    });
  }

  private formatArabicNumbers(content: string): string {
    // Convert Western Arabic numerals to Eastern Arabic numerals
    const westernToEastern = {
      '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
      '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
    };
    
    return content.replace(/[0-9]/g, (digit) => westernToEastern[digit as keyof typeof westernToEastern] || digit);
  }

  private formatFrenchDates(content: string): string {
    // Format dates in French legal format
    return content.replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, (match) => {
      const date = new Date(match);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    });
  }

  private formatLegalDates(content: string): string {
    // Format dates in legal document format
    return content.replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, (match) => {
      const date = new Date(match);
      return `le ${date.getDate()} ${this.getMonthName(date.getMonth())} ${date.getFullYear()}`;
    });
  }

  private formatMonetaryAmounts(content: string): string {
    // Format monetary amounts in legal format
    return content.replace(/(\d+(?:\.\d{2})?)\s*(DA|DZD|€|EUR)/gi, (match, amount, currency) => {
      const num = parseFloat(amount);
      const formatted = num.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
      return `${formatted} ${currency.toUpperCase()}`;
    });
  }

  private convertToHTML(content: string): string {
    let html = content;
    
    // Convert line breaks to HTML
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraphs
    html = `<p>${html}</p>`;
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    
    return html;
  }

  private convertToMarkdown(content: string): string {
    // Basic text to markdown conversion
    let markdown = content;
    
    // Convert strong tags to markdown
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
    markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
    
    return markdown;
  }

  private isValidDate(value: any): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private getMonthName(monthIndex: number): string {
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    return months[monthIndex] || '';
  }

  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const templateProcessingService = new TemplateProcessingService();
