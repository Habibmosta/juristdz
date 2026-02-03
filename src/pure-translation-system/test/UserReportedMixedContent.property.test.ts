/**
 * User-Reported Mixed Content Property-Based Tests - Task 13.1
 * 
 * Property-based tests for user-reported mixed content patterns using fast-check.
 * Tests universal properties that should hold for all variations of problematic content.
 * 
 * **Feature: pure-translation-system, Property 1: Complete Language Purity**
 * **Validates: Requirements 1.1, 1.2, 1.4, 2.1, 2.2, 3.2, 3.3**
 * 
 * **Feature: pure-translation-system, Property 2: Aggressive Content Preprocessing**
 * **Validates: Requirements 2.4, 3.1, 3.4, 3.5, 8.1, 8.2**
 */

import * as fc from 'fast-check';
import { ContentCleaner } from '../core/ContentCleaner';
import { PureTranslationSystemIntegration } from '../PureTranslationSystemIntegration';
import {
  TranslationRequest,
  Language,
  ContentType,
  TranslationPriority,
  PatternType
} from '../types';

describe('User-Reported Mixed Content Property-Based Tests', () => {
  let contentCleaner: ContentCleaner;
  let translationSystem: PureTranslationSystemIntegration;

  beforeEach(() => {
    contentCleaner = new ContentCleaner();
    translationSystem = PureTranslationSystemIntegration.createDevelopment();
  });

  // Custom generators for user-reported problematic patterns
  const userReportedUIElements = fc.constantFrom(
    'AUTO-TRANSLATE', 'Pro', 'V2', 'JuristDZ', 'JURIST', 'DZ'
  );

  const cyrillicFragments = fc.constantFrom(
    'процедة', 'процедуры', 'процедур', 'процедуре'
  );

  const englishLegalFragments = fc.constantFrom(
    'Defined', 'Article', 'Law', 'Criminal', 'Procedure', 'Code', 'Section', 'Chapter'
  );

  const arabicLegalTerms = fc.constantFrom(
    'محامي', 'الشهود', 'المادة', 'قانون', 'الإجراءات', 'الجنائية', 'تحليل', 'ملفات'
  );

  const versionNumbers = fc.constantFrom(
    'V1', 'V2', 'V3', 'v1.0', 'v2.0', '1.0', '2.0'
  );

  // Generator for mixed content similar to user reports
  const userReportedMixedContentGenerator = fc.tuple(
    arabicLegalTerms,
    userReportedUIElements,
    arabicLegalTerms,
    versionNumbers,
    userReportedUIElements
  ).map(([arabic1, ui1, arabic2, version, ui2]) => 
    `${arabic1} ${ui1} ${arabic2} ${version} ${ui2}`
  );

  // Generator for corrupted character patterns
  const corruptedCharacterGenerator = fc.tuple(
    arabicLegalTerms,
    englishLegalFragments,
    arabicLegalTerms,
    cyrillicFragments
  ).map(([arabic1, english, arabic2, cyrillic]) => 
    `${arabic1} ${english} ${arabic2} ${cyrillic}`
  );

  // Generator for concatenated problematic patterns (like user reports)
  const concatenatedProblematicGenerator = fc.tuple(
    arabicLegalTerms,
    userReportedUIElements,
    versionNumbers,
    userReportedUIElements,
    cyrillicFragments,
    englishLegalFragments
  ).map(([arabic, ui1, version, ui2, cyrillic, english]) => 
    `${arabic}${ui1}${version}${ui2}${cyrillic}${english}`
  );

  // Generator for legal content with mixed contamination
  const legalMixedContentGenerator = fc.tuple(
    arabicLegalTerms,
    englishLegalFragments,
    fc.integer({ min: 1, max: 99 }),
    arabicLegalTerms,
    englishLegalFragments,
    arabicLegalTerms
  ).map(([arabic1, english1, number, arabic2, english2, arabic3]) => 
    `${arabic1} ${english1} ${number} ${arabic2} ${english2} ${arabic3}`
  );

  describe('Property 1: Complete Language Purity', () => {
    test('Property 1.1: All cleaned content must be free of UI elements', async () => {
      await fc.assert(
        fc.asyncProperty(
          userReportedMixedContentGenerator,
          async (problematicText: string) => {
            // Act
            const result = await contentCleaner.cleanMixedContent(problematicText);
            
            // Assert - No UI elements should remain
            const uiElements = ['AUTO-TRANSLATE', 'Pro', 'V2', 'JuristDZ', 'JURIST', 'DZ'];
            const hasUIElements = uiElements.some(element => 
              result.cleanedText.includes(element)
            );
            
            expect(hasUIElements).toBe(false);
            
            // Should record UI element removal
            const hasUIRemoval = result.removedElements.some(el => 
              el.type === PatternType.UI_ELEMENTS
            );
            if (uiElements.some(el => problematicText.includes(el))) {
              expect(hasUIRemoval).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 1.2: All cleaned content must be free of Cyrillic characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          corruptedCharacterGenerator,
          async (problematicText: string) => {
            // Act
            const result = await contentCleaner.cleanMixedContent(problematicText);
            
            // Assert - No Cyrillic characters should remain
            const cyrillicPattern = /[\u0400-\u04FF]/;
            expect(cyrillicPattern.test(result.cleanedText)).toBe(false);
            
            // Should record Cyrillic removal if present in original
            if (cyrillicPattern.test(problematicText)) {
              const hasCyrillicRemoval = result.removedElements.some(el => 
                el.type === PatternType.CYRILLIC_CHARACTERS
              );
              expect(hasCyrillicRemoval).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 1.3: All cleaned content must be free of English fragments', async () => {
      await fc.assert(
        fc.asyncProperty(
          legalMixedContentGenerator,
          async (problematicText: string) => {
            // Act
            const result = await contentCleaner.cleanMixedContent(problematicText);
            
            // Assert - No English legal fragments should remain
            const englishFragments = ['Defined', 'Article', 'Law', 'Criminal', 'Procedure', 'Code'];
            const hasEnglishFragments = englishFragments.some(fragment => 
              result.cleanedText.includes(fragment)
            );
            
            expect(hasEnglishFragments).toBe(false);
            
            // Should preserve Arabic content
            const arabicPattern = /[\u0600-\u06FF]/;
            if (arabicPattern.test(problematicText)) {
              expect(arabicPattern.test(result.cleanedText)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 1.4: Translation system must achieve high purity for all user-reported patterns', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            userReportedMixedContentGenerator,
            corruptedCharacterGenerator,
            concatenatedProblematicGenerator
          ),
          async (problematicText: string) => {
            // Arrange
            const request: TranslationRequest = {
              text: problematicText,
              sourceLanguage: Language.ARABIC,
              targetLanguage: Language.FRENCH,
              contentType: ContentType.LEGAL_DOCUMENT,
              priority: TranslationPriority.HIGH
            };

            // Act
            const result = await translationSystem.translateContent(request);
            
            // Assert - Must achieve high purity
            expect(result.purityScore).toBeGreaterThanOrEqual(90);
            
            // Must not contain any problematic patterns
            const problematicPatterns = [
              'AUTO-TRANSLATE', 'Pro', 'V2', 'Defined', 'процедة', 'JuristDZ'
            ];
            
            const hasProblematicContent = problematicPatterns.some(pattern => 
              result.translatedText.includes(pattern)
            );
            
            expect(hasProblematicContent).toBe(false);
            
            // Should have valid translation
            expect(result.translatedText.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 } // Reduced for translation system tests
      );
    });
  });

  describe('Property 2: Aggressive Content Preprocessing', () => {
    test('Property 2.1: All problematic patterns must be detected before processing', async () => {
      await fc.assert(
        fc.asyncProperty(
          concatenatedProblematicGenerator,
          async (problematicText: string) => {
            // Act
            const patterns = contentCleaner.detectProblematicPatterns(problematicText);
            
            // Assert - Should detect all types of problems present
            const hasUIElements = /AUTO-TRANSLATE|Pro|V2|JuristDZ/.test(problematicText);
            const hasCyrillic = /[\u0400-\u04FF]/.test(problematicText);
            const hasEnglish = /Defined|Article|Law|Criminal/.test(problematicText);
            
            if (hasUIElements) {
              expect(patterns.some(p => p.type === PatternType.UI_ELEMENTS)).toBe(true);
            }
            
            if (hasCyrillic) {
              expect(patterns.some(p => p.type === PatternType.CYRILLIC_CHARACTERS)).toBe(true);
            }
            
            if (hasEnglish) {
              expect(patterns.some(p => p.type === PatternType.ENGLISH_FRAGMENTS)).toBe(true);
            }
            
            // All detected patterns should have valid positions
            patterns.forEach(pattern => {
              expect(pattern.position).toBeGreaterThanOrEqual(0);
              expect(pattern.position).toBeLessThan(problematicText.length);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 2.2: Cleaning must preserve meaningful Arabic content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            arabicLegalTerms,
            userReportedUIElements,
            arabicLegalTerms
          ).map(([arabic1, ui, arabic2]) => `${arabic1} ${ui} ${arabic2}`),
          async (mixedText: string) => {
            // Act
            const result = await contentCleaner.cleanMixedContent(mixedText);
            
            // Assert - Should preserve Arabic legal terms
            const originalArabicTerms = mixedText.match(/[\u0600-\u06FF]+/g) || [];
            const cleanedArabicTerms = result.cleanedText.match(/[\u0600-\u06FF]+/g) || [];
            
            // Should have some Arabic content preserved
            expect(cleanedArabicTerms.length).toBeGreaterThan(0);
            
            // Should remove UI elements
            expect(result.cleanedText).not.toContain('AUTO-TRANSLATE');
            expect(result.cleanedText).not.toContain('Pro');
            expect(result.cleanedText).not.toContain('V2');
            
            // Should have recorded cleaning actions
            expect(result.cleaningActions.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 2.3: Cleaning validation must correctly identify success/failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          userReportedMixedContentGenerator,
          async (problematicText: string) => {
            // Act
            const result = await contentCleaner.cleanMixedContent(problematicText);
            const validation = contentCleaner.validateCleaning(problematicText, result.cleanedText);
            
            // Assert - Validation should be consistent with actual cleaning
            const stillHasProblems = contentCleaner.detectProblematicPatterns(result.cleanedText).length > 0;
            
            expect(validation.isValid).toBe(!stillHasProblems);
            
            if (validation.isValid) {
              expect(validation.confidence).toBeGreaterThan(0);
              expect(validation.issues.length).toBe(0);
            } else {
              expect(validation.confidence).toBe(0);
              expect(validation.issues.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 2.4: Enhanced cleaning must handle concatenated patterns', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            arabicLegalTerms,
            userReportedUIElements,
            versionNumbers,
            userReportedUIElements
          ).map(([arabic, ui1, version, ui2]) => `${arabic}${ui1}${version}${ui2}`),
          async (concatenatedText: string) => {
            // Act
            const result = await contentCleaner.cleanMixedContent(concatenatedText);
            
            // Assert - Should separate and clean concatenated patterns
            expect(result.cleanedText).not.toContain('Pro');
            expect(result.cleanedText).not.toContain('V2');
            expect(result.cleanedText).not.toContain('AUTO-TRANSLATE');
            
            // Should preserve Arabic content even when concatenated
            const hasArabic = /[\u0600-\u06FF]/.test(result.cleanedText);
            expect(hasArabic).toBe(true);
            
            // Should have multiple removal actions for concatenated patterns
            expect(result.removedElements.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Zero Tolerance Policy Enforcement', () => {
    test('Property 3.1: Production system must enforce 100% purity or use fallback', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            userReportedMixedContentGenerator,
            corruptedCharacterGenerator
          ),
          async (problematicText: string) => {
            // Arrange - Use production system with zero tolerance
            const zeroToleranceSystem = PureTranslationSystemIntegration.createProduction();
            const request: TranslationRequest = {
              text: problematicText,
              sourceLanguage: Language.ARABIC,
              targetLanguage: Language.FRENCH,
              contentType: ContentType.LEGAL_DOCUMENT,
              priority: TranslationPriority.HIGH
            };

            // Act
            const result = await zeroToleranceSystem.translateContent(request);
            
            // Assert - Must achieve 100% purity OR use fallback
            const meetsZeroTolerance = result.purityScore === 100 || result.metadata.fallbackUsed;
            expect(meetsZeroTolerance).toBe(true);
            
            // Must not contain any problematic patterns regardless
            const problematicPatterns = [
              'AUTO-TRANSLATE', 'Pro', 'V2', 'Defined', 'процедة', 'JuristDZ'
            ];
            
            const hasProblematicContent = problematicPatterns.some(pattern => 
              result.translatedText.includes(pattern)
            );
            
            expect(hasProblematicContent).toBe(false);
          }
        ),
        { numRuns: 30 } // Reduced for production system tests
      );
    });

    test('Property 3.2: All translations must be completely pure in target language', async () => {
      await fc.assert(
        fc.asyncProperty(
          userReportedMixedContentGenerator,
          async (problematicText: string) => {
            // Arrange
            const request: TranslationRequest = {
              text: problematicText,
              sourceLanguage: Language.ARABIC,
              targetLanguage: Language.FRENCH,
              contentType: ContentType.LEGAL_DOCUMENT,
              priority: TranslationPriority.HIGH
            };

            // Act
            const result = await translationSystem.translateContent(request);
            
            // Assert - Must be completely pure French
            const arabicPattern = /[\u0600-\u06FF]/;
            const cyrillicPattern = /[\u0400-\u04FF]/;
            
            expect(arabicPattern.test(result.translatedText)).toBe(false);
            expect(cyrillicPattern.test(result.translatedText)).toBe(false);
            
            // Should not contain mixed scripts
            expect(result.translatedText).toContainNoMixedContent();
            expect(result.translatedText).toHaveNoCorruptedCharacters();
            expect(result.translatedText).toHaveNoUIElements();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 4: Performance and Consistency', () => {
    test('Property 4.1: Cleaning performance must be consistent across all patterns', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            userReportedMixedContentGenerator,
            corruptedCharacterGenerator,
            concatenatedProblematicGenerator
          ),
          async (problematicText: string) => {
            // Act
            const startTime = Date.now();
            const result = await contentCleaner.cleanMixedContent(problematicText);
            const processingTime = Date.now() - startTime;
            
            // Assert - Should process in reasonable time
            expect(processingTime).toBeLessThan(5000); // Less than 5 seconds
            
            // Should always return valid result
            expect(result.cleanedText).toBeDefined();
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
            
            // Should track processing metrics
            expect(result.originalLength).toBe(problematicText.length);
            expect(result.cleanedLength).toBe(result.cleanedText.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Property 4.2: Repeated cleaning must be idempotent', async () => {
      await fc.assert(
        fc.asyncProperty(
          userReportedMixedContentGenerator,
          async (problematicText: string) => {
            // Act - Clean twice
            const firstResult = await contentCleaner.cleanMixedContent(problematicText);
            const secondResult = await contentCleaner.cleanMixedContent(firstResult.cleanedText);
            
            // Assert - Second cleaning should not change anything
            expect(secondResult.cleanedText).toBe(firstResult.cleanedText);
            expect(secondResult.removedElements.length).toBe(0);
            expect(secondResult.confidence).toBe(1.0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Regression Prevention', () => {
    test('Property 5.1: All variations of user-reported patterns must be cleaned', async () => {
      // Generator for variations of the original user-reported patterns
      const userReportedVariationsGenerator = fc.oneof(
        // Variations of "محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE"
        fc.tuple(
          fc.constantFrom('محامي', 'المحامي'),
          fc.constantFrom('Pro', 'PRO', 'pro'),
          fc.constantFrom('تحليل', 'تحليل ملفات'),
          fc.constantFrom('V2', 'V1', 'V3', 'v2'),
          fc.constantFrom('AUTO-TRANSLATE', 'AUTO_TRANSLATE', 'AUTOTRANSLATE')
        ).map(([lawyer, pro, analysis, version, autoTranslate]) => 
          `${lawyer} دي زاد متصل ${lawyer} ${pro} ${analysis} ${version} ${autoTranslate}`
        ),
        
        // Variations of "الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة"
        fc.tuple(
          fc.constantFrom('الشهود', 'الشاهد'),
          fc.constantFrom('Defined', 'DEFINED', 'defined'),
          fc.integer({ min: 1, max: 999 }),
          fc.constantFrom('процедة', 'процедуры', 'процедур')
        ).map(([witnesses, defined, articleNum, procedure]) => 
          `${witnesses} ${defined} في المادة ${articleNum} من قانون الإجراءات الجنائية ال ${procedure}`
        )
      );

      await fc.assert(
        fc.asyncProperty(
          userReportedVariationsGenerator,
          async (variationText: string) => {
            // Act
            const result = await contentCleaner.cleanMixedContent(variationText);
            
            // Assert - All variations should be cleaned
            expect(result.cleanedText).not.toMatch(/Pro|PRO|pro/i);
            expect(result.cleanedText).not.toMatch(/V\d+|v\d+/);
            expect(result.cleanedText).not.toMatch(/AUTO.?TRANSLATE/i);
            expect(result.cleanedText).not.toMatch(/Defined|DEFINED|defined/);
            expect(result.cleanedText).not.toMatch(/процедة|процедуры|процедур/);
            
            // Should preserve Arabic legal content
            const hasArabic = /[\u0600-\u06FF]/.test(result.cleanedText);
            expect(hasArabic).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});