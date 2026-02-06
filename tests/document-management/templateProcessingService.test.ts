/**
 * Template Processing Service Tests
 * 
 * Tests for variable substitution, document generation, and legal document formatting
 * Requirements: 3.3, 3.6
 */

import {
  templateProcessingService,
  TemplateProcessingService,
  TemplateProcessingOptions,
  DocumentGenerationResult
} from '../../src/document-management/services/templateProcessingService';
import {
  Template,
  TemplateVariable,
  TemplateVariables,
  TemplateCategory,
  VariableType,
  Language
} from '../../types/document-management';
import { UserRole } from '../../types';

// Mock the template management service
jest.mock('../../src/document-management/services/templateManagementService', () => ({
  templateManagementService: {
    getTemplateById: jest.fn()
  }
}));

describe('TemplateProcessingService', () => {
  let service: TemplateProcessingService;
  let mockTemplate: Template;
  let mockVariables: TemplateVariables;

  beforeEach(() => {
    service = new TemplateProcessingService();
    
    // Create mock template
    mockTemplate = {
      id: 'template-1',
      name: 'Contract Template',
      description: 'A basic contract template',
      category: TemplateCategory.CONTRACT,
      language: Language.FRENCH,
      applicableRoles: [UserRole.AVOCAT],
      content: `
        Contrat entre {{client_name}} et {{company_name}}.
        
        Date: {{contract_date}}
        Montant: {{amount}} DA
        
        {{#if has_warranty}}
        Garantie: {{warranty_period}} mois
        {{/if}}
        
        {{#each services}}
        - Service: {{this}}
        {{/each}}
        
        Signé le {{signature_date}}.
      `,
      variables: [
        {
          name: 'client_name',
          type: VariableType.TEXT,
          label: 'Nom du client',
          required: true
        },
        {
          name: 'company_name',
          type: VariableType.TEXT,
          label: 'Nom de l\'entreprise',
          required: true
        },
        {
          name: 'contract_date',
          type: VariableType.DATE,
          label: 'Date du contrat',
          required: true
        },
        {
          name: 'amount',
          type: VariableType.NUMBER,
          label: 'Montant',
          required: true
        },
        {
          name: 'has_warranty',
          type: VariableType.BOOLEAN,
          label: 'Garantie incluse',
          required: false
        },
        {
          name: 'warranty_period',
          type: VariableType.NUMBER,
          label: 'Période de garantie (mois)',
          required: false
        },
        {
          name: 'services',
          type: VariableType.LIST,
          label: 'Services',
          required: false
        },
        {
          name: 'signature_date',
          type: VariableType.DATE,
          label: 'Date de signature',
          required: true
        }
      ],
      createdAt: new Date(),
      createdBy: 'user-1',
      updatedAt: new Date(),
      updatedBy: 'user-1',
      isActive: true,
      version: 1
    };

    // Create mock variables
    mockVariables = {
      client_name: 'Jean Dupont',
      company_name: 'SARL TechCorp',
      contract_date: '2024-01-15',
      amount: 50000,
      has_warranty: true,
      warranty_period: 12,
      services: ['Développement web', 'Maintenance', 'Support technique'],
      signature_date: '2024-01-20'
    };
  });

  describe('processTemplate', () => {
    it('should process simple variable substitutions', async () => {
      const simpleTemplate: Template = {
        ...mockTemplate,
        content: 'Hello {{client_name}}, welcome to {{company_name}}!',
        variables: [
          {
            name: 'client_name',
            type: VariableType.TEXT,
            label: 'Client Name',
            required: true
          },
          {
            name: 'company_name',
            type: VariableType.TEXT,
            label: 'Company Name',
            required: true
          }
        ]
      };

      const variables = {
        client_name: 'John Doe',
        company_name: 'Acme Corp'
      };

      const result = await service.processTemplate(simpleTemplate, variables);

      expect(result.content).toBe('Hello John Doe, welcome to Acme Corp!');
      expect(result.metadata.templateId).toBe(simpleTemplate.id);
      expect(result.metadata.variables).toEqual(variables);
    });

    it('should process conditional blocks correctly', async () => {
      const result = await service.processTemplate(mockTemplate, mockVariables);

      expect(result.content).toContain('Garantie: 12 mois');
    });

    it('should hide conditional blocks when condition is false', async () => {
      const variablesWithoutWarranty = {
        ...mockVariables,
        has_warranty: false
      };

      const result = await service.processTemplate(mockTemplate, variablesWithoutWarranty);

      expect(result.content).not.toContain('Garantie:');
    });

    it('should process loop blocks correctly', async () => {
      const result = await service.processTemplate(mockTemplate, mockVariables);

      expect(result.content).toContain('- Service: Développement web');
      expect(result.content).toContain('- Service: Maintenance');
      expect(result.content).toContain('- Service: Support technique');
    });

    it('should format dates correctly for French locale', async () => {
      const options: TemplateProcessingOptions = {
        language: Language.FRENCH
      };

      const result = await service.processTemplate(mockTemplate, mockVariables, options);

      // Check that dates are formatted in French format
      expect(result.content).toContain('15/01/2024');
      expect(result.content).toContain('20/01/2024');
    });

    it('should format numbers correctly for French locale', async () => {
      const options: TemplateProcessingOptions = {
        language: Language.FRENCH
      };

      const result = await service.processTemplate(mockTemplate, mockVariables, options);

      // Check that numbers are formatted with French locale
      expect(result.content).toContain('50 000 DA');
    });

    it('should apply legal document formatting', async () => {
      const options: TemplateProcessingOptions = {
        outputFormat: 'html',
        preserveFormatting: true
      };

      const result = await service.processTemplate(mockTemplate, options);

      // Check that HTML formatting is applied
      expect(result.content).toContain('<p>');
      expect(result.content).toContain('</p>');
    });
  });

  describe('validateTemplateVariables', () => {
    it('should validate required variables', () => {
      const incompleteVariables = {
        client_name: 'John Doe'
        // Missing required variables
      };

      const result = service.validateTemplateVariables(mockTemplate, incompleteVariables);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3); // Missing company_name, contract_date, signature_date
      expect(result.errors[0].message).toContain('company_name');
    });

    it('should validate variable types', () => {
      const invalidVariables = {
        ...mockVariables,
        amount: 'not a number',
        contract_date: 'invalid date'
      };

      const result = service.validateTemplateVariables(mockTemplate, invalidVariables);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'amount')).toBe(true);
      expect(result.errors.some(e => e.field === 'contract_date')).toBe(true);
    });

    it('should pass validation with correct variables', () => {
      const result = service.validateTemplateVariables(mockTemplate, mockVariables);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow optional variables to be missing', () => {
      const variablesWithoutOptional = {
        client_name: 'John Doe',
        company_name: 'Acme Corp',
        contract_date: '2024-01-15',
        amount: 50000,
        signature_date: '2024-01-20'
        // Missing optional variables: has_warranty, warranty_period, services
      };

      const result = service.validateTemplateVariables(mockTemplate, variablesWithoutOptional);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Arabic language support', () => {
    it('should apply Arabic formatting correctly', async () => {
      const arabicTemplate: Template = {
        ...mockTemplate,
        language: Language.ARABIC,
        content: 'عقد بين {{client_name}} و {{company_name}}. التاريخ: {{contract_date}}'
      };

      const arabicVariables = {
        client_name: 'أحمد محمد',
        company_name: 'شركة التقنية',
        contract_date: '2024-01-15'
      };

      const options: TemplateProcessingOptions = {
        language: Language.ARABIC
      };

      const result = await service.processTemplate(arabicTemplate, arabicVariables, options);

      // Check that Arabic text is present
      expect(result.content).toContain('أحمد محمد');
      expect(result.content).toContain('شركة التقنية');
      
      // Check that RTL markers are applied (this is a simplified check)
      expect(result.content).toContain('\u202E');
    });

    it('should format Arabic numbers correctly', async () => {
      const arabicTemplate: Template = {
        ...mockTemplate,
        language: Language.ARABIC,
        content: 'المبلغ: {{amount}} دينار'
      };

      const options: TemplateProcessingOptions = {
        language: Language.ARABIC
      };

      const result = await service.processTemplate(arabicTemplate, { amount: 12345 }, options);

      // Check that numbers are converted to Eastern Arabic numerals
      expect(result.content).toContain('١٢٣٤٥');
    });
  });

  describe('generateDocument', () => {
    beforeEach(() => {
      // Mock the template management service
      const { templateManagementService } = require('../../src/document-management/services/templateManagementService');
      templateManagementService.getTemplateById.mockResolvedValue(mockTemplate);
    });

    it('should generate document successfully with valid inputs', async () => {
      const result = await service.generateDocument(
        'template-1',
        mockVariables,
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(result.document).toBeDefined();
      expect(result.document?.templateId).toBe('template-1');
      expect(result.document?.generatedBy).toBe('user-1');
      expect(result.document?.content).toContain('Jean Dupont');
      expect(result.document?.content).toContain('SARL TechCorp');
    });

    it('should return error when template not found', async () => {
      const { templateManagementService } = require('../../src/document-management/services/templateManagementService');
      templateManagementService.getTemplateById.mockResolvedValue(null);

      const result = await service.generateDocument(
        'nonexistent-template',
        mockVariables,
        'user-1'
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Template not found or access denied');
    });

    it('should generate document with validation warnings', async () => {
      const invalidVariables = {
        ...mockVariables,
        amount: 'invalid number'
      };

      const result = await service.generateDocument(
        'template-1',
        invalidVariables,
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.length).toBeGreaterThan(0);
    });
  });

  describe('output formats', () => {
    it('should generate HTML output', async () => {
      const options: TemplateProcessingOptions = {
        outputFormat: 'html'
      };

      const result = await service.processTemplate(mockTemplate, mockVariables, options);

      expect(result.content).toContain('<p>');
      expect(result.content).toContain('</p>');
      expect(result.content).toContain('<br>');
    });

    it('should generate Markdown output', async () => {
      const templateWithFormatting: Template = {
        ...mockTemplate,
        content: 'Contract for <strong>{{client_name}}</strong> with <em>{{company_name}}</em>'
      };

      const options: TemplateProcessingOptions = {
        outputFormat: 'markdown'
      };

      const result = await service.processTemplate(templateWithFormatting, mockVariables, options);

      expect(result.content).toContain('**Jean Dupont**');
      expect(result.content).toContain('*SARL TechCorp*');
    });

    it('should generate plain text output', async () => {
      const options: TemplateProcessingOptions = {
        outputFormat: 'text'
      };

      const result = await service.processTemplate(mockTemplate, mockVariables, options);

      // Should not contain HTML tags
      expect(result.content).not.toContain('<p>');
      expect(result.content).not.toContain('</p>');
    });
  });

  describe('error handling', () => {
    it('should handle template processing errors gracefully', async () => {
      const invalidTemplate: Template = {
        ...mockTemplate,
        content: '{{unclosed_variable'
      };

      await expect(
        service.processTemplate(invalidTemplate, mockVariables)
      ).rejects.toThrow();
    });

    it('should handle missing variables gracefully', async () => {
      const templateWithMissingVar: Template = {
        ...mockTemplate,
        content: 'Hello {{missing_variable}}!'
      };

      const result = await service.processTemplate(templateWithMissingVar, {});

      // Should keep placeholder for missing variables
      expect(result.content).toContain('{{missing_variable}}');
    });
  });
});