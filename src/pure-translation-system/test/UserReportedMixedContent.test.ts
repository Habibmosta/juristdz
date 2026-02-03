/**
 * User-Reported Mixed Content Tests - Task 13.1
 * 
 * Comprehensive tests for specific user-reported mixed content patterns
 * to ensure complete elimination of all problematic strings.
 * 
 * Tests exact problematic strings:
 * - "محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE"
 * - "الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة"
 * 
 * Validates complete elimination of all mixed content patterns.
 * Requirements: 1.1, 1.2, 2.1, 3.1, 3.2
 */

import * as fc from 'fast-check';
import { ContentCleaner } from '../core/ContentCleaner';
import { PureTranslationSystemIntegration } from '../PureTranslationSystemIntegration';
import {
  TranslationRequest,
  Language,
  ContentType,
  TranslationPriority,
  PatternType,
  Severity
} from '../types';

describe('User-Reported Mixed Content Tests - Task 13.1', () => {
  let contentCleaner: ContentCleaner;
  let translationSystem: PureTranslationSystemIntegration;

  // Exact user-reported problematic strings
  const USER_REPORTED_STRINGS = [
    'محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE',
    'الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة',
    'Les témoins sont Pro V2 الشهود AUTO-TRANSLATE',
    'Defined محامي процедة JuristDZ',
    'محامي Pro تحليل ملفات V2 AUTO-TRANSLATE',
    'JuristDZ Pro V2 محامي متصل تحليل ملفات'
  ];

  // Corrupted character patterns
  const CORRUPTED_PATTERNS = [
    'процедة', // Cyrillic in Arabic context
    'Defined', // English fragment in Arabic
    'AUTO-TRANSLATE', // UI element
    'Pro', // UI element
    'V2', // Version number
    'JuristDZ' // System identifier
  ];

  beforeEach(() => {
    contentCleaner = new ContentCleaner();
    translationSystem = PureTranslationSystemIntegration.createDevelopment();
  });

  describe('Exact User-Reported String Tests', () => {
    test('should completely clean the first user-reported string', async () => {
      const problematicText = 'محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE';
      
      const result = await contentCleaner.cleanMixedContent(problematicText);
      
      // Should remove all problematic elements
      expect(result.cleanedText).not.toContain('Pro');
      expect(result.cleanedText).not.toContain('V2');
      expect(result.cleanedText).not.toContain('AUTO-TRANSLATE');
      
      // Should preserve Arabic content
      expect(result.cleanedText).toContain('محامي');
      expect(result.cleanedText).toContain('تحليل');
      expect(result.cleanedText).toContain('ملفات');
      
      // Should have removed elements
      expect(result.removedElements.length).toBeGreaterThan(0);
      expect(result.removedElements.some(el => el.type === PatternType.UI_ELEMENTS)).toBe(true);
      
      // Should have high confidence in cleaning
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should completely clean the second user-reported string', async () => {
      const problematicText = 'الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة';
      
      const result = await contentCleaner.cleanMixedContent(problematicText);
      
      // Should remove all problematic elements
      expect(result.cleanedText).not.toContain('Defined');
      expect(result.cleanedText).not.toContain('процедة');
      
      // Should preserve Arabic legal content
      expect(result.cleanedText).toContain('الشهود');
      expect(result.cleanedText).toContain('في المادة');
      expect(result.cleanedText).toContain('من قانون');
      expect(result.cleanedText).toContain('الإجراءات الجنائية');
      
      // Should have removed both Cyrillic and English elements
      expect(result.removedElements.some(el => el.type === PatternType.CYRILLIC_CHARACTERS)).toBe(true);
      expect(result.removedElements.some(el => el.type === PatternType.ENGLISH_FRAGMENTS)).toBe(true);
    });

    test('should clean all user-reported strings completely', async () => {
      for (const problematicText of USER_REPORTED_STRINGS) {
        const result = await contentCleaner.cleanMixedContent(problematicText);
        
        // Verify no corrupted patterns remain
        for (const pattern of CORRUPTED_PATTERNS) {
          expect(result.cleanedText).not.toContain(pattern);
        }
        
        // Should have some Arabic content remaining (unless it was purely corrupted)
        const hasArabic = /[\u0600-\u06FF]/.test(result.cleanedText);
        const originalHasArabic = /[\u0600-\u06FF]/.test(problematicText);
        
        if (originalHasArabic) {
          expect(hasArabic).toBe(true);
        }
        
        // Should record cleaning actions
        expect(result.cleaningActions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Translation System Integration Tests', () => {
    test('should produce pure translations for user-reported content', async () => {
      for (const problematicText of USER_REPORTED_STRINGS) {
        const request: TranslationRequest = {
          text: problematicText,
          sourceLanguage: Language.ARABIC,
          targetLanguage: Language.FRENCH,
          contentType: ContentType.LEGAL_DOCUMENT,
          priority: TranslationPriority.HIGH
        };

        const result = await translationSystem.translateContent(request);
        
        // Should achieve high purity score
        expect(result.purityScore).toBeGreaterThanOrEqual(90);
        
        // Should not contain any problematic patterns
        for (const pattern of CORRUPTED_PATTERNS) {
          expect(result.translatedText).not.toContain(pattern);
        }
        
        // Should have translation result
        expect(result.translatedText.length).toBeGreaterThan(0);
        
        // Should not contain mixed scripts
        expect(result.translatedText).toContainNoMixedContent();
        expect(result.translatedText).toHaveNoCorruptedCharacters();
        expect(result.translatedText).toHaveNoUIElements();
      }
    });

    test('should handle corrupted character strings in legal context', async () => {
      const legalText = 'الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة';
      
      const request: TranslationRequest = {
        text: legalText,
        sourceLanguage: Language.ARABIC,
        targetLanguage: Language.FRENCH,
        contentType: ContentType.LEGAL_DOCUMENT,
        priority: TranslationPriority.HIGH,
        context: {
          legalDomain: 'criminal_law',
          documentType: 'legal_code',
          jurisdiction: 'Algeria'
        }
      };

      const result = await translationSystem.translateContent(request);
      
      // Should achieve perfect or near-perfect purity
      expect(result.purityScore).toBeGreaterThanOrEqual(95);
      
      // Should maintain legal terminology accuracy
      expect(result.qualityMetrics.terminologyAccuracy).toBeGreaterThanOrEqual(85);
      
      // Should be completely pure French
      expect(result.translatedText).toBeCompletelyPure('fr');
      
      // Should not contain any Arabic, Cyrillic, or English fragments
      expect(result.translatedText).not.toMatch(/[\u0600-\u06FF]/); // No Arabic
      expect(result.translatedText).not.toMatch(/[\u0400-\u04FF]/); // No Cyrillic
      expect(result.translatedText).not.toContain('Defined');
      expect(result.translatedText).not.toContain('процедة');
    });
  });

  describe('Pattern Detection Tests', () => {
    test('should detect all problematic patterns in user-reported content', () => {
      const problematicText = 'محامي Pro V2 AUTO-TRANSLATE процедة Defined';
      
      const patterns = contentCleaner.detectProblematicPatterns(problematicText);
      
      // Should detect UI elements
      expect(patterns.some(p => p.type === PatternType.UI_ELEMENTS && p.pattern === 'Pro')).toBe(true);
      expect(patterns.some(p => p.type === PatternType.UI_ELEMENTS && p.pattern === 'V2')).toBe(true);
      expect(patterns.some(p => p.type === PatternType.UI_ELEMENTS && p.pattern === 'AUTO-TRANSLATE')).toBe(true);
      
      // Should detect Cyrillic characters
      expect(patterns.some(p => p.type === PatternType.CYRILLIC_CHARACTERS)).toBe(true);
      
      // Should detect English fragments
      expect(patterns.some(p => p.type === PatternType.ENGLISH_FRAGMENTS && p.pattern === 'Defined')).toBe(true);
      
      // Should assign appropriate severity levels
      const cyrillicPattern = patterns.find(p => p.type === PatternType.CYRILLIC_CHARACTERS);
      const uiPattern = patterns.find(p => p.type === PatternType.UI_ELEMENTS);
      
      expect(cyrillicPattern?.severity).toBe(Severity.CRITICAL);
      expect(uiPattern?.severity).toBe(Severity.HIGH);
    });

    test('should detect user-reported specific patterns', () => {
      const userReportedText = 'محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE';
      
      const patterns = contentCleaner.detectProblematicPatterns(userReportedText);
      
      // Should detect multiple UI elements
      const uiPatterns = patterns.filter(p => p.type === PatternType.UI_ELEMENTS);
      expect(uiPatterns.length).toBeGreaterThanOrEqual(3); // Pro, V2, AUTO-TRANSLATE
      
      // All should be high or critical severity
      expect(patterns.every(p => p.severity === Severity.HIGH || p.severity === Severity.CRITICAL)).toBe(true);
    });
  });

  describe('Validation Tests', () => {
    test('should validate that cleaning was successful for all user-reported strings', async () => {
      for (const problematicText of USER_REPORTED_STRINGS) {
        const result = await contentCleaner.cleanMixedContent(problematicText);
        
        const validation = contentCleaner.validateCleaning(problematicText, result.cleanedText);
        
        expect(validation.isValid).toBe(true);
        expect(validation.confidence).toBeGreaterThan(0);
        expect(validation.issues.length).toBe(0);
      }
    });

    test('should detect if cleaning failed to remove problematic content', () => {
      const original = 'محامي Pro V2 AUTO-TRANSLATE';
      const stillProblematic = 'محامي Pro نظيف'; // Still contains "Pro"
      
      const validation = contentCleaner.validateCleaning(original, stillProblematic);
      
      expect(validation.isValid).toBe(false);
      expect(validation.confidence).toBe(0);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Stress Tests', () => {
    test('should handle extremely corrupted user-reported content', async () => {
      const extremelyCorrupted = 'محامي Pro V2 AUTO-TRANSLATE процедة Defined JuristDZ متصل تحليل ملفات';
      
      const result = await contentCleaner.cleanMixedContent(extremelyCorrupted);
      
      // Should remove all problematic elements
      expect(result.cleanedText).not.toContain('Pro');
      expect(result.cleanedText).not.toContain('V2');
      expect(result.cleanedText).not.toContain('AUTO-TRANSLATE');
      expect(result.cleanedText).not.toContain('процедة');
      expect(result.cleanedText).not.toContain('Defined');
      expect(result.cleanedText).not.toContain('JuristDZ');
      
      // Should preserve Arabic legal terms
      expect(result.cleanedText).toContain('محامي');
      expect(result.cleanedText).toContain('متصل');
      expect(result.cleanedText).toContain('تحليل');
      expect(result.cleanedText).toContain('ملفات');
      
      // Should have many removed elements
      expect(result.removedElements.length).toBeGreaterThan(5);
    });

    test('should handle concatenated problematic patterns', async () => {
      const concatenated = 'محاميProV2AUTO-TRANSLATEпроцедةDefined';
      
      const result = await contentCleaner.cleanMixedContent(concatenated);
      
      // Should separate and clean all problematic elements
      expect(result.cleanedText).not.toContain('Pro');
      expect(result.cleanedText).not.toContain('V2');
      expect(result.cleanedText).not.toContain('AUTO-TRANSLATE');
      expect(result.cleanedText).not.toContain('процедة');
      expect(result.cleanedText).not.toContain('Defined');
      
      // Should preserve Arabic content
      expect(result.cleanedText).toContain('محامي');
    });

    test('should handle mixed content with legal terminology', async () => {
      const legalMixed = 'المادة Article 1 من قانون Law الإجراءات Procedure الجنائية Criminal';
      
      const result = await contentCleaner.cleanMixedContent(legalMixed);
      
      // Should remove English legal fragments
      expect(result.cleanedText).not.toContain('Article');
      expect(result.cleanedText).not.toContain('Law');
      expect(result.cleanedText).not.toContain('Procedure');
      expect(result.cleanedText).not.toContain('Criminal');
      
      // Should preserve Arabic legal terms
      expect(result.cleanedText).toContain('المادة');
      expect(result.cleanedText).toContain('من قانون');
      expect(result.cleanedText).toContain('الإجراءات');
      expect(result.cleanedText).toContain('الجنائية');
    });
  });

  describe('Performance Tests', () => {
    test('should clean user-reported content efficiently', async () => {
      const startTime = Date.now();
      
      for (const problematicText of USER_REPORTED_STRINGS) {
        await contentCleaner.cleanMixedContent(problematicText);
      }
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / USER_REPORTED_STRINGS.length;
      
      // Should process each string in reasonable time
      expect(averageTime).toBeLessThan(1000); // Less than 1 second per string
    });

    test('should maintain performance with repeated cleaning', async () => {
      const problematicText = 'محامي Pro V2 AUTO-TRANSLATE процедة';
      const iterations = 100;
      
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        await contentCleaner.cleanMixedContent(problematicText);
      }
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / iterations;
      
      // Should maintain consistent performance
      expect(averageTime).toBeLessThan(100); // Less than 100ms per cleaning
    });
  });

  describe('Zero Tolerance Policy Tests', () => {
    test('should enforce zero tolerance for all user-reported patterns', async () => {
      for (const problematicText of USER_REPORTED_STRINGS) {
        const request: TranslationRequest = {
          text: problematicText,
          sourceLanguage: Language.ARABIC,
          targetLanguage: Language.FRENCH,
          contentType: ContentType.LEGAL_DOCUMENT,
          priority: TranslationPriority.HIGH
        };

        // Use production system with zero tolerance
        const zeroToleranceSystem = PureTranslationSystemIntegration.createProduction();
        const result = await zeroToleranceSystem.translateContent(request);
        
        // Should achieve 100% purity or use fallback
        expect(result.purityScore === 100 || result.metadata.fallbackUsed).toBe(true);
        
        // Should meet zero tolerance policy
        expect(result).toMeetZeroTolerancePolicy();
        
        // Should not contain any problematic patterns
        for (const pattern of CORRUPTED_PATTERNS) {
          expect(result.translatedText).not.toContain(pattern);
        }
      }
    });

    test('should trigger fallback for extremely corrupted content', async () => {
      const extremelyCorrupted = 'Pro V2 AUTO-TRANSLATE процедة Defined JuristDZ';
      
      const request: TranslationRequest = {
        text: extremelyCorrupted,
        sourceLanguage: Language.ARABIC,
        targetLanguage: Language.FRENCH,
        contentType: ContentType.LEGAL_DOCUMENT,
        priority: TranslationPriority.HIGH
      };

      const zeroToleranceSystem = PureTranslationSystemIntegration.createProduction();
      const result = await zeroToleranceSystem.translateContent(request);
      
      // Should use fallback for content with no meaningful Arabic
      expect(result.metadata.fallbackUsed).toBe(true);
      
      // Should still provide professional content
      expect(result.translatedText.length).toBeGreaterThan(0);
      expect(result.translatedText).toBeCompletelyPure('fr');
    });
  });

  describe('Regression Prevention Tests', () => {
    test('should prevent regression of previously fixed user-reported issues', async () => {
      // Test that previously reported and fixed patterns don't reappear
      const previouslyFixed = [
        'محامي Pro تحليل',
        'الشهود Defined في',
        'قانون процедة الإجراءات'
      ];

      for (const fixedPattern of previouslyFixed) {
        const result = await contentCleaner.cleanMixedContent(fixedPattern);
        
        // Should still clean these patterns
        expect(result.cleanedText).not.toContain('Pro');
        expect(result.cleanedText).not.toContain('Defined');
        expect(result.cleanedText).not.toContain('процедة');
        
        // Should maintain Arabic content
        const hasArabic = /[\u0600-\u06FF]/.test(result.cleanedText);
        expect(hasArabic).toBe(true);
      }
    });

    test('should handle new variations of user-reported patterns', async () => {
      // Test variations of the original problematic patterns
      const variations = [
        'محامي Pro تحليل ملفات V2',
        'الشهود Defined في المادة процедة',
        'AUTO-TRANSLATE محامي Pro V2'
      ];

      for (const variation of variations) {
        const result = await contentCleaner.cleanMixedContent(variation);
        
        // Should clean all variations
        expect(result.cleanedText).not.toContain('Pro');
        expect(result.cleanedText).not.toContain('V2');
        expect(result.cleanedText).not.toContain('AUTO-TRANSLATE');
        expect(result.cleanedText).not.toContain('Defined');
        expect(result.cleanedText).not.toContain('процедة');
        
        // Should preserve meaningful Arabic content
        const arabicContent = result.cleanedText.match(/[\u0600-\u06FF]+/g);
        expect(arabicContent).toBeTruthy();
        expect(arabicContent!.length).toBeGreaterThan(0);
      }
    });
  });
});