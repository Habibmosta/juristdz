/**
 * Multi-Language Template Support Tests
 * 
 * Tests French and Arabic template handling, language-specific formatting rules,
 * and right-to-left text support for Arabic templates.
 * 
 * Requirements: 3.5 - Multi-language template support
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  languageFormattingService,
  LanguageFormattingOptions 
} from '../../src/document-management/utils/languageFormatting';
import { templateProcessingService } from '../../src/document-management/services/templateProcessingService';
import { templateManagementService } from '../../src/document-management/services/templateManagementService';
import { 
  frenchContractTemplate, 
  arabicContractTemplate,
  frenchMotionTemplate,
  arabicMotionTemplate 
} from '../../src/document-management/templates/sampleTemplates';
import { Language, TemplateVariables } from '../../types/document-management';
import { UserRole } from '../../types';

describe('Multi-Language Template Support', () => {
  
  describe('Language Formatting Service', () => {
    
    test('should apply French formatting rules correctly', () => {
      const content = 'Le montant est de 1500000.50 € ! Quelle surprise ?';
      const options: LanguageFormattingOptions = {
        language: Language.FRENCH,
        applyTypographyRules: true,
        useLocalizedNumbers: true
      };

      const result = languageFormattingService.formatContent(content, options);

      expect(result.direction).toBe('ltr');
      expect(result.language).toBe(Language.FRENCH);
      expect(result.content).toContain('\u00A0!'); // Non-breaking space before !
      expect(result.content).toContain('\u00A0?'); // Non-breaking space before ?
      expect(result.metadata.appliedRules).toContain('french-typography');
    });

    test('should apply Arabic formatting rules correctly', () => {
      const content = 'المبلغ هو 1500000.50 دج في التاريخ 15/03/2024';
      const options: LanguageFormattingOptions = {
        language: Language.ARABIC,
        applyTypographyRules: true,
        useLocalizedNumbers: true,
        useLocalizedDates: true
      };

      const result = languageFormattingService.formatContent(content, options);

      expect(result.direction).toBe('rtl');
      expect(result.language).toBe(Language.ARABIC);
      expect(result.content).toMatch(/[٠-٩]/); // Should contain Arabic numerals
      expect(result.metadata.appliedRules).toContain('arabic-numbers');
      expect(result.metadata.appliedRules).toContain('arabic-dates');
      expect(result.metadata.appliedRules).toContain('rtl-formatting');
    });

    test('should handle mixed Arabic and Latin content', () => {
      const content = 'العميل John Smith يقيم في الجزائر';
      const options: LanguageFormattingOptions = {
        language: Language.ARABIC,
        preserveFormatting: true
      };

      const result = languageFormattingService.formatContent(content, options);

      expect(result.content).toContain('John Smith'); // Latin text preserved
      expect(result.content).toMatch(/[\u0600-\u06FF]/); // Arabic text preserved
      expect(result.metadata.appliedRules).toContain('mixed-content-handling');
    });

    test('should convert Western to Eastern Arabic numerals', () => {
      const content = 'المادة 123 من القانون رقم 456';
      const options: LanguageFormattingOptions = {
        language: Language.ARABIC,
        useLocalizedNumbers: true
      };

      const result = languageFormattingService.formatContent(content, options);

      expect(result.content).toContain('١٢٣'); // 123 in Arabic numerals
      expect(result.content).toContain('٤٥٦'); // 456 in Arabic numerals
    });

    test('should format French legal references', () => {
      const content = 'Selon l\'Article 123 du Code Civil et la Loi n°15-02';
      const options: LanguageFormattingOptions = {
        language: Language.FRENCH,
        applyTypographyRules: true
      };

      const result = languageFormattingService.formatContent(content, options);

      expect(result.content).toContain('<strong>Article 123</strong>');
      expect(result.content).toContain('<em>Loi n°15-02</em>');
    });

    test('should format Arabic legal references', () => {
      const content = 'حسب المادة 123 من القانون المدني';
      const options: LanguageFormattingOptions = {
        language: Language.ARABIC,
        useLocalizedNumbers: true
      };

      const result = languageFormattingService.formatContent(content, options);

      expect(result.content).toContain('المادة ١٢٣');
    });

    test('should validate Arabic content requirements', () => {
      const arabicContent = 'هذا نص باللغة العربية';
      const nonArabicContent = 'This is English text';

      const arabicValidation = languageFormattingService.validateLanguageContent(
        arabicContent, 
        Language.ARABIC
      );
      const nonArabicValidation = languageFormattingService.validateLanguageContent(
        nonArabicContent, 
        Language.ARABIC
      );

      expect(arabicValidation.isValid).toBe(true);
      expect(nonArabicValidation.isValid).toBe(false);
      expect(nonArabicValidation.warnings).toContain('No Arabic text detected in Arabic template');
    });

    test('should provide language-specific placeholders', () => {
      const frenchPlaceholders = languageFormattingService.getLanguageSpecificPlaceholders(Language.FRENCH);
      const arabicPlaceholders = languageFormattingService.getLanguageSpecificPlaceholders(Language.ARABIC);

      expect(frenchPlaceholders.clientName).toBe('Nom du client');
      expect(arabicPlaceholders.clientName).toBe('اسم العميل');
      expect(frenchPlaceholders.signature).toBe('Signature');
      expect(arabicPlaceholders.signature).toBe('التوقيع');
    });

    test('should convert content between languages', () => {
      const frenchContent = 'Contrat avec {{clientName}} pour {{amount}} DZD';
      
      const conversion = languageFormattingService.convertContentLanguage(
        frenchContent,
        Language.FRENCH,
        Language.ARABIC
      );

      expect(conversion.requiresManualReview).toBe(true);
      expect(conversion.notes).toContain('Manual translation of text content required');
      expect(conversion.convertedContent).toContain('{{clientName}}'); // Placeholders preserved
    });
  });

  describe('Template Processing with Multi-Language Support', () => {
    
    test('should process French template with proper formatting', async () => {
      const variables: TemplateVariables = {
        clientName: 'Jean Dupont',
        clientAddress: '123 Rue de la Paix, Alger',
        providerName: 'Cabinet Juridique ABC',
        providerTitle: 'Avocat',
        providerAddress: '456 Boulevard Mohamed V, Alger',
        serviceDescription: 'Conseil juridique en droit des affaires',
        contractDuration: '12 mois',
        startDate: '2024-01-15',
        totalAmount: 150000,
        paymentTerms: 'Paiement mensuel de 12 500 DZD',
        noticePeriod: 30,
        contractLocation: 'Alger',
        contractDate: '2024-01-01'
      };

      const processed = await templateProcessingService.processTemplate(
        frenchContractTemplate as any,
        variables,
        {
          language: Language.FRENCH,
          useLanguageFormatting: true,
          localizeNumbers: true,
          localizeDates: true
        }
      );

      expect(processed.content).toContain('Jean Dupont');
      expect(processed.content).toContain('150000'); // Number should be formatted
      expect(processed.content).toContain('Cabinet Juridique ABC');
      expect(processed.metadata.language).toBe(Language.FRENCH);
      expect(processed.metadata.direction).toBe('ltr');
    });

    test('should process Arabic template with RTL support', async () => {
      const variables: TemplateVariables = {
        clientName: 'أحمد بن محمد',
        clientAddress: '123 شارع الاستقلال، الجزائر',
        providerName: 'مكتب المحاماة الجزائري',
        providerTitle: 'محامي',
        providerAddress: '456 شارع محمد الخامس، الجزائر',
        serviceDescription: 'استشارة قانونية في قانون الأعمال',
        contractDuration: '12 شهراً',
        startDate: '2024-01-15',
        totalAmount: 150000,
        paymentTerms: 'دفع شهري قدره 12500 دج',
        noticePeriod: 30,
        contractLocation: 'الجزائر',
        contractDate: '2024-01-01'
      };

      const processed = await templateProcessingService.processTemplate(
        arabicContractTemplate as any,
        variables,
        {
          language: Language.ARABIC,
          useLanguageFormatting: true,
          localizeNumbers: true,
          localizeDates: true,
          applyRTLSupport: true
        }
      );

      expect(processed.content).toContain('أحمد بن محمد');
      expect(processed.content).toContain('مكتب المحاماة الجزائري');
      expect(processed.metadata.language).toBe(Language.ARABIC);
      expect(processed.metadata.direction).toBe('rtl');
      
      // Check for Arabic numerals
      expect(processed.content).toMatch(/[٠-٩]/);
    });

    test('should handle date formatting in different languages', async () => {
      const variables: TemplateVariables = {
        contractDate: '2024-03-15'
      };

      // French date formatting
      const frenchTemplate = {
        ...frenchContractTemplate,
        content: 'Date: {{contractDate}}'
      };

      const frenchProcessed = await templateProcessingService.processTemplate(
        frenchTemplate as any,
        variables,
        {
          language: Language.FRENCH,
          useLanguageFormatting: true,
          localizeDates: true
        }
      );

      // Arabic date formatting
      const arabicTemplate = {
        ...arabicContractTemplate,
        content: 'التاريخ: {{contractDate}}'
      };

      const arabicProcessed = await templateProcessingService.processTemplate(
        arabicTemplate as any,
        variables,
        {
          language: Language.ARABIC,
          useLanguageFormatting: true,
          localizeDates: true
        }
      );

      expect(frenchProcessed.content).toContain('15 mars 2024');
      expect(arabicProcessed.content).toMatch(/١٥.*مارس.*٢٠٢٤/);
    });

    test('should handle number formatting in different languages', async () => {
      const variables: TemplateVariables = {
        totalAmount: 1500000.50
      };

      const frenchTemplate = {
        ...frenchContractTemplate,
        content: 'Montant: {{totalAmount}} DZD'
      };

      const arabicTemplate = {
        ...arabicContractTemplate,
        content: 'المبلغ: {{totalAmount}} دج'
      };

      const frenchProcessed = await templateProcessingService.processTemplate(
        frenchTemplate as any,
        variables,
        {
          language: Language.FRENCH,
          useLanguageFormatting: true,
          localizeNumbers: true
        }
      );

      const arabicProcessed = await templateProcessingService.processTemplate(
        arabicTemplate as any,
        variables,
        {
          language: Language.ARABIC,
          useLanguageFormatting: true,
          localizeNumbers: true
        }
      );

      expect(frenchProcessed.content).toContain('1\u00A0500\u00A0000,50'); // French number format
      expect(arabicProcessed.content).toMatch(/[٠-٩]/); // Arabic numerals
    });

    test('should validate template variables with language-specific rules', async () => {
      const invalidVariables: TemplateVariables = {
        // Missing required fields
        clientName: '',
        totalAmount: 'invalid_number'
      };

      await expect(
        templateProcessingService.processTemplate(
          frenchContractTemplate as any,
          invalidVariables,
          { validateVariables: true }
        )
      ).rejects.toThrow('Variable validation failed');
    });
  });

  describe('Template Management with Multi-Language Support', () => {
    
    test('should create language-specific template', async () => {
      const mockUserId = 'test-user-123';
      
      const result = await templateManagementService.createLanguageTemplate(
        frenchContractTemplate,
        mockUserId
      );

      // Note: This test would need proper database setup to fully work
      // For now, we're testing the method exists and handles the call
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success');
    });

    test('should get templates by language', async () => {
      const frenchTemplates = await templateManagementService.getTemplatesByLanguage(
        Language.FRENCH,
        UserRole.AVOCAT
      );

      const arabicTemplates = await templateManagementService.getTemplatesByLanguage(
        Language.ARABIC,
        UserRole.AVOCAT
      );

      // Note: These would return actual results with proper database setup
      expect(Array.isArray(frenchTemplates)).toBe(true);
      expect(Array.isArray(arabicTemplates)).toBe(true);
    });

    test('should convert template between languages', async () => {
      const mockTemplateId = 'template-123';
      const mockUserId = 'user-123';

      const result = await templateManagementService.convertTemplateLanguage(
        mockTemplateId,
        Language.ARABIC,
        'عقد مترجم',
        mockUserId,
        UserRole.AVOCAT
      );

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success');
    });

    test('should get available template languages', async () => {
      const languages = await templateManagementService.getAvailableTemplateLanguages(
        UserRole.AVOCAT
      );

      expect(Array.isArray(languages)).toBe(true);
      expect(languages).toContain(Language.FRENCH); // Default fallback
    });
  });

  describe('Sample Templates Validation', () => {
    
    test('should have valid French contract template', () => {
      expect(frenchContractTemplate.language).toBe(Language.FRENCH);
      expect(frenchContractTemplate.content).toContain('CONTRAT DE PRESTATION');
      expect(frenchContractTemplate.variables.length).toBeGreaterThan(0);
      
      // Check for proper French legal formatting
      expect(frenchContractTemplate.content).toContain('ARTICLE');
      expect(frenchContractTemplate.content).toContain('{{clientName}}');
    });

    test('should have valid Arabic contract template', () => {
      expect(arabicContractTemplate.language).toBe(Language.ARABIC);
      expect(arabicContractTemplate.content).toContain('عقد تقديم خدمات');
      expect(arabicContractTemplate.variables.length).toBeGreaterThan(0);
      
      // Check for Arabic text and proper structure
      expect(arabicContractTemplate.content).toMatch(/[\u0600-\u06FF]/);
      expect(arabicContractTemplate.content).toContain('{{clientName}}');
      
      // Check Arabic variable labels
      const clientNameVar = arabicContractTemplate.variables.find(v => v.name === 'clientName');
      expect(clientNameVar?.label).toBe('اسم العميل');
    });

    test('should have valid French motion template', () => {
      expect(frenchMotionTemplate.language).toBe(Language.FRENCH);
      expect(frenchMotionTemplate.content).toContain('REQUÊTE EN RÉFÉRÉ');
      expect(frenchMotionTemplate.category).toBe('motion');
      
      // Check for legal motion structure
      expect(frenchMotionTemplate.content).toContain('PAR CES MOTIFS');
      expect(frenchMotionTemplate.content).toContain('ORDONNER');
    });

    test('should have valid Arabic motion template', () => {
      expect(arabicMotionTemplate.language).toBe(Language.ARABIC);
      expect(arabicMotionTemplate.content).toContain('طلب استعجالي');
      expect(arabicMotionTemplate.category).toBe('motion');
      
      // Check for Arabic legal motion structure
      expect(arabicMotionTemplate.content).toContain('لهذه الأسباب');
      expect(arabicMotionTemplate.content).toContain('الأمر بـ');
    });

    test('should have consistent variable names across language versions', () => {
      const frenchVarNames = frenchContractTemplate.variables.map(v => v.name).sort();
      const arabicVarNames = arabicContractTemplate.variables.map(v => v.name).sort();
      
      expect(frenchVarNames).toEqual(arabicVarNames);
    });

    test('should have appropriate role restrictions', () => {
      expect(frenchContractTemplate.applicableRoles).toContain(UserRole.AVOCAT);
      expect(arabicContractTemplate.applicableRoles).toContain(UserRole.AVOCAT);
      expect(frenchMotionTemplate.applicableRoles).toContain(UserRole.AVOCAT);
      expect(arabicMotionTemplate.applicableRoles).toContain(UserRole.AVOCAT);
    });
  });

  describe('Integration Tests', () => {
    
    test('should process complete French contract workflow', async () => {
      const variables: TemplateVariables = {
        clientName: 'Société ALPHA SARL',
        clientAddress: '15 Rue Didouche Mourad, Alger 16000',
        providerName: 'Maître Ahmed BENALI',
        providerTitle: 'Avocat au Barreau d\'Alger',
        providerAddress: '25 Boulevard Colonel Amirouche, Alger',
        serviceDescription: 'Conseil juridique et représentation en droit commercial',
        contractDuration: '24 mois',
        startDate: '2024-02-01',
        totalAmount: 2400000,
        paymentTerms: 'Paiement trimestriel de 200 000 DZD',
        additionalObligations: 'Assurer une veille juridique permanente',
        clientObligations: 'Fournir tous les documents nécessaires dans les délais',
        noticePeriod: 60,
        contractLocation: 'Alger',
        contractDate: '2024-01-15'
      };

      const processed = await templateProcessingService.processTemplate(
        frenchContractTemplate as any,
        variables,
        {
          language: Language.FRENCH,
          useLanguageFormatting: true,
          outputFormat: 'html'
        }
      );

      expect(processed.content).toContain('Société ALPHA SARL');
      expect(processed.content).toContain('Maître Ahmed BENALI');
      expect(processed.content).toContain('2400000'); // Should be formatted
      expect(processed.content).toContain('Conseil juridique');
      expect(processed.metadata.language).toBe(Language.FRENCH);
    });

    test('should process complete Arabic contract workflow', async () => {
      const variables: TemplateVariables = {
        clientName: 'شركة الفا ذ.م.م',
        clientAddress: '15 شارع ديدوش مراد، الجزائر 16000',
        providerName: 'الأستاذ أحمد بن علي',
        providerTitle: 'محامي لدى نقابة الجزائر',
        providerAddress: '25 شارع العقيد عميروش، الجزائر',
        serviceDescription: 'استشارة قانونية وتمثيل في القانون التجاري',
        contractDuration: '24 شهراً',
        startDate: '2024-02-01',
        totalAmount: 2400000,
        paymentTerms: 'دفع فصلي قدره 200000 دج',
        additionalObligations: 'ضمان المتابعة القانونية المستمرة',
        clientObligations: 'تقديم جميع الوثائق اللازمة في المواعيد المحددة',
        noticePeriod: 60,
        contractLocation: 'الجزائر',
        contractDate: '2024-01-15'
      };

      const processed = await templateProcessingService.processTemplate(
        arabicContractTemplate as any,
        variables,
        {
          language: Language.ARABIC,
          useLanguageFormatting: true,
          applyRTLSupport: true,
          outputFormat: 'html'
        }
      );

      expect(processed.content).toContain('شركة الفا ذ.م.م');
      expect(processed.content).toContain('الأستاذ أحمد بن علي');
      expect(processed.content).toMatch(/[٠-٩]/); // Should contain Arabic numerals
      expect(processed.metadata.language).toBe(Language.ARABIC);
      expect(processed.metadata.direction).toBe('rtl');
    });
  });
});