/**
 * Secondary Translation Service Tests
 * 
 * Unit tests for the secondary translation service to ensure proper
 * rule-based translation, hybrid methods, and content intent detection.
 */

import { SecondaryTranslationService } from './SecondaryTranslationService';
import {
  Language,
  TranslationMethod,
  CleanedContent,
  LegalCategory,
  ComplexityLevel,
  AudienceType
} from '../types';

describe('SecondaryTranslationService', () => {
  let service: SecondaryTranslationService;

  beforeEach(() => {
    service = new SecondaryTranslationService();
  });

  describe('translateWithRuleBasedMethod', () => {
    it('should translate Arabic legal text to French using dictionary', async () => {
      const content: CleanedContent = {
        cleanedText: 'قانون مدني محكمة حكم',
        removedElements: [],
        cleaningActions: [],
        originalLength: 15,
        cleanedLength: 15,
        confidence: 1.0,
        processingTime: 0
      };

      const result = await service.translateWithRuleBasedMethod(content, Language.FRENCH);

      expect(result.method).toBe(TranslationMethod.RULE_BASED);
      expect(result.result).toContain('code civil');
      expect(result.result).toContain('tribunal');
      expect(result.result).toContain('jugement');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should translate French legal text to Arabic using dictionary', async () => {
      const content: CleanedContent = {
        cleanedText: 'code civil tribunal jugement',
        removedElements: [],
        cleaningActions: [],
        originalLength: 25,
        cleanedLength: 25,
        confidence: 1.0,
        processingTime: 0
      };

      const result = await service.translateWithRuleBasedMethod(content, Language.ARABIC);

      expect(result.method).toBe(TranslationMethod.RULE_BASED);
      expect(result.result).toContain('قانون مدني');
      expect(result.result).toContain('محكمة');
      expect(result.result).toContain('حكم');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle legal phrases with pattern matching', async () => {
      const content: CleanedContent = {
        cleanedText: 'وفقا لأحكام المادة 15 من القانون',
        removedElements: [],
        cleaningActions: [],
        originalLength: 30,
        cleanedLength: 30,
        confidence: 1.0,
        processingTime: 0
      };

      const result = await service.translateWithRuleBasedMethod(content, Language.FRENCH);

      expect(result.method).toBe(TranslationMethod.RULE_BASED);
      expect(result.result).toContain('conformément aux dispositions de l\'article 15');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should return low confidence for non-legal text', async () => {
      const content: CleanedContent = {
        cleanedText: 'hello world this is not legal text',
        removedElements: [],
        cleaningActions: [],
        originalLength: 33,
        cleanedLength: 33,
        confidence: 1.0,
        processingTime: 0
      };

      const result = await service.translateWithRuleBasedMethod(content, Language.ARABIC);

      expect(result.method).toBe(TranslationMethod.RULE_BASED);
      expect(result.confidence).toBeLessThan(0.7);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle empty text gracefully', async () => {
      const content: CleanedContent = {
        cleanedText: '',
        removedElements: [],
        cleaningActions: [],
        originalLength: 0,
        cleanedLength: 0,
        confidence: 1.0,
        processingTime: 0
      };

      const result = await service.translateWithRuleBasedMethod(content, Language.FRENCH);

      expect(result.method).toBe(TranslationMethod.RULE_BASED);
      expect(result.result).toBe('');
      expect(result.confidence).toBe(0);
    });
  });

  describe('translateWithHybridMethod', () => {
    it('should combine multiple translation methods', async () => {
      const content: CleanedContent = {
        cleanedText: 'قانون تجاري شركة تاجر',
        removedElements: [],
        cleaningActions: [],
        originalLength: 20,
        cleanedLength: 20,
        confidence: 1.0,
        processingTime: 0
      };

      const methods = [
        TranslationMethod.RULE_BASED,
        TranslationMethod.LEGAL_DICTIONARY,
        TranslationMethod.TEMPLATE_BASED
      ];

      const result = await service.translateWithHybridMethod(content, Language.FRENCH, methods);

      expect(result.method).toBe(TranslationMethod.HYBRID);
      expect(result.result).toContain('code de commerce');
      expect(result.result).toContain('société');
      expect(result.result).toContain('commerçant');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.metadata?.methodsUsed).toEqual(methods);
    });

    it('should select best translation from multiple candidates', async () => {
      const content: CleanedContent = {
        cleanedText: 'محكمة الاستئناف قررت',
        removedElements: [],
        cleaningActions: [],
        originalLength: 18,
        cleanedLength: 18,
        confidence: 1.0,
        processingTime: 0
      };

      const methods = [TranslationMethod.RULE_BASED, TranslationMethod.LEGAL_DICTIONARY];

      const result = await service.translateWithHybridMethod(content, Language.FRENCH, methods);

      expect(result.method).toBe(TranslationMethod.HYBRID);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.metadata?.translationCandidates).toBeGreaterThan(0);
    });
  });

  describe('detectContentIntent', () => {
    it('should detect criminal law category', async () => {
      const text = 'قانون جنائي جريمة عقوبة محكمة جنائية';

      const intent = await service.detectContentIntent(text);

      expect(intent.category).toBe(LegalCategory.CRIMINAL_LAW);
      expect(intent.context.jurisdiction).toBe('Algeria');
      expect(intent.confidence).toBeGreaterThan(0);
    });

    it('should detect commercial law category', async () => {
      const text = 'قانون تجاري شركة تاجر سجل تجاري';

      const intent = await service.detectContentIntent(text);

      expect(intent.category).toBe(LegalCategory.COMMERCIAL_LAW);
      expect(intent.context.lawType).toBe('commercial');
    });

    it('should detect family law category', async () => {
      const text = 'أحوال شخصية زواج طلاق نفقة حضانة';

      const intent = await service.detectContentIntent(text);

      expect(intent.category).toBe(LegalCategory.FAMILY_LAW);
      expect(intent.context.lawType).toBe('famille');
    });

    it('should assess text complexity correctly', async () => {
      const simpleText = 'قانون محكمة';
      const complexText = 'وفقا لأحكام المادة الخامسة عشرة من القانون المدني الجزائري رقم 75-58 المؤرخ في 26 سبتمبر 1975 والمعدل والمتمم بموجب الأمر رقم 05-10 المؤرخ في 20 يونيو 2005، تقرر المحكمة العليا في قرارها الصادر بتاريخ';

      const simpleIntent = await service.detectContentIntent(simpleText);
      const complexIntent = await service.detectContentIntent(complexText);

      expect(simpleIntent.complexity).toBe(ComplexityLevel.SIMPLE);
      expect(complexIntent.complexity).toBe(ComplexityLevel.EXPERT);
    });

    it('should infer appropriate audience', async () => {
      const judgeText = 'محكمة الاستئناف تقرر';
      const lawyerText = 'محامي يدافع عن موكله';

      const judgeIntent = await service.detectContentIntent(judgeText);
      const lawyerIntent = await service.detectContentIntent(lawyerText);

      expect(judgeIntent.audience).toBe(AudienceType.JUDGE);
      expect(lawyerIntent.audience).toBe(AudienceType.LAWYER);
    });

    it('should default to civil law for unclear content', async () => {
      const unclearText = 'نص قانوني غير واضح';

      const intent = await service.detectContentIntent(unclearText);

      expect(intent.category).toBe(LegalCategory.CIVIL_LAW);
      expect(intent.audience).toBe(AudienceType.LEGAL_PROFESSIONAL);
    });
  });

  describe('error handling', () => {
    it('should handle translation errors gracefully', async () => {
      // Mock a scenario that would cause an error
      const invalidContent: CleanedContent = {
        cleanedText: null as any, // Invalid input
        removedElements: [],
        cleaningActions: [],
        originalLength: 0,
        cleanedLength: 0,
        confidence: 1.0,
        processingTime: 0
      };

      const result = await service.translateWithRuleBasedMethod(invalidContent, Language.FRENCH);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.confidence).toBe(0);
      expect(result.result).toBe('');
    });

    it('should handle intent detection errors gracefully', async () => {
      const result = await service.detectContentIntent(null as any);

      expect(result.category).toBe(LegalCategory.CIVIL_LAW);
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('performance', () => {
    it('should complete translation within reasonable time', async () => {
      const content: CleanedContent = {
        cleanedText: 'قانون مدني محكمة حكم التزام عقد مسؤولية تعويض',
        removedElements: [],
        cleaningActions: [],
        originalLength: 40,
        cleanedLength: 40,
        confidence: 1.0,
        processingTime: 0
      };

      const startTime = Date.now();
      const result = await service.translateWithRuleBasedMethod(content, Language.FRENCH);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle concurrent translations', async () => {
      const content: CleanedContent = {
        cleanedText: 'قانون جنائي جريمة',
        removedElements: [],
        cleaningActions: [],
        originalLength: 15,
        cleanedLength: 15,
        confidence: 1.0,
        processingTime: 0
      };

      const promises = Array(5).fill(null).map(() => 
        service.translateWithRuleBasedMethod(content, Language.FRENCH)
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.method).toBe(TranslationMethod.RULE_BASED);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('legal terminology accuracy', () => {
    it('should preserve legal terminology consistency', async () => {
      const content: CleanedContent = {
        cleanedText: 'المحكمة العليا قررت نقض الحكم الصادر عن محكمة الاستئناف',
        removedElements: [],
        cleaningActions: [],
        originalLength: 50,
        cleanedLength: 50,
        confidence: 1.0,
        processingTime: 0
      };

      const result = await service.translateWithRuleBasedMethod(content, Language.FRENCH);

      expect(result.result).toContain('Cour suprême');
      expect(result.result).toContain('cassation');
      expect(result.result).toContain('cour d\'appel');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should handle specialized legal domains', async () => {
      const commercialContent: CleanedContent = {
        cleanedText: 'شركة ذات مسؤولية محدودة رأس مال أسهم',
        removedElements: [],
        cleaningActions: [],
        originalLength: 35,
        cleanedLength: 35,
        confidence: 1.0,
        processingTime: 0
      };

      const result = await service.translateWithRuleBasedMethod(commercialContent, Language.FRENCH);

      expect(result.result).toContain('société');
      expect(result.result).toContain('capital');
      expect(result.result).toContain('actions');
    });
  });
});