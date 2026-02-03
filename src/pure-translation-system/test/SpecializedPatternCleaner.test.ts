/**
 * Specialized Pattern Cleaner Tests - Task 13.2
 * 
 * Comprehensive tests for the specialized cleaning system that targets
 * user-reported mixed content patterns with enhanced detection and validation
 * to prevent regression of fixed issues.
 * 
 * Tests Requirements: 2.4, 3.5, 8.1, 8.2
 */

import { SpecializedPatternCleaner } from '../core/SpecializedPatternCleaner';
import { ContentCleaner } from '../core/ContentCleaner';
import {
  PatternType,
  Severity,
  CleaningActionType,
  Language
} from '../types';

describe('Specialized Pattern Cleaner Tests - Task 13.2', () => {
  let specializedCleaner: SpecializedPatternCleaner;
  let contentCleaner: ContentCleaner;

  // User-reported problematic strings from Task 13.1
  const USER_REPORTED_PATTERNS = [
    'محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE',
    'الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة',
    'Les témoins sont Pro V2 الشهود AUTO-TRANSLATE',
    'Defined محامي процедة JuristDZ',
    'محامي Pro تحليل ملفات V2 AUTO-TRANSLATE',
    'JuristDZ Pro V2 محامي متصل تحليل ملفات'
  ];

  // Regression patterns that should never reappear
  const REGRESSION_PATTERNS = [
    'محامي Pro تحليل',
    'الشهود Defined في',
    'قانون процедة الإجراءات',
    'محاميProV2AUTO-TRANSLATE',
    'JuristDZ Pro V2',
    'AUTO-TRANSLATE محامي'
  ];

  beforeEach(() => {
    specializedCleaner = new SpecializedPatternCleaner();
    contentCleaner = new ContentCleaner();
  });

  describe('Specialized Cleaning Rules', () => {
    test('should have predefined specialized rules for user-reported patterns', () => {
      const rules = specializedCleaner.getCleaningRules();
      
      // Should have multiple specialized rules
      expect(rules.length).toBeGreaterThan(5);
      
      // Should have user-reported rules
      const userReportedRules = rules.filter(rule => rule.userReported);
      expect(userReportedRules.length).toBeGreaterThan(0);
      
      // Should have rules for different pattern types
      const patternTypes = new Set(rules.map(rule => rule.type));
      expect(patternTypes.has(PatternType.USER_REPORTED)).toBe(true);
      expect(patternTypes.has(PatternType.UI_ELEMENTS)).toBe(true);
      expect(patternTypes.has(PatternType.CYRILLIC_CHARACTERS)).toBe(true);
      expect(patternTypes.has(PatternType.ENGLISH_FRAGMENTS)).toBe(true);
    });

    test('should apply specialized cleaning to complete user-reported string', async () => {
      const problematicText = 'محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE';
      
      const result = await specializedCleaner.applySpecializedCleaning(problematicText);
      
      // Should remove UI elements
      expect(result.cleanedText).not.toContain('Pro');
      expect(result.cleanedText).not.toContain('V2');
      expect(result.cleanedText).not.toContain('AUTO-TRANSLATE');
      
      // Should preserve Arabic content
      expect(result.cleanedText).toContain('محامي');
      expect(result.cleanedText).toContain('تحليل');
      expect(result.cleanedText).toContain('ملفات');
      
      // Should have applied specialized rules
      expect(result.appliedRules.length).toBeGreaterThan(0);
      expect(result.userReportedPatternsFound).toBeGreaterThan(0);
      expect(result.specializedActionsApplied).toBeGreaterThan(0);
    });

    test('should clean legal text with corrupted characters', async () => {
      const legalText = 'الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة';
      
      const result = await specializedCleaner.applySpecializedCleaning(legalText);
      
      // Should remove English and Cyrillic contamination
      expect(result.cleanedText).not.toContain('Defined');
      expect(result.cleanedText).not.toContain('процедة');
      
      // Should preserve Arabic legal terminology
      expect(result.cleanedText).toContain('الشهود');
      expect(result.cleanedText).toContain('في المادة');
      expect(result.cleanedText).toContain('من قانون');
      expect(result.cleanedText).toContain('الإجراءات الجنائية');
      
      // Should have high confidence
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should handle concatenated UI elements with Arabic', async () => {
      const concatenatedText = 'محاميProV2AUTO-TRANSLATEتحليل';
      
      const result = await specializedCleaner.applySpecializedCleaning(concatenatedText);
      
      // Should separate and clean UI elements
      expect(result.cleanedText).not.toContain('Pro');
      expect(result.cleanedText).not.toContain('V2');
      expect(result.cleanedText).not.toContain('AUTO-TRANSLATE');
      
      // Should preserve Arabic words
      expect(result.cleanedText).toContain('محامي');
      expect(result.cleanedText).toContain('تحليل');
      
      // Should have applied multiple rules
      expect(result.appliedRules.length).toBeGreaterThan(1);
    });
  });

  describe('Enhanced Detection Capabilities', () => {
    test('should detect mixed script boundaries', async () => {
      const mixedText = 'محاميProتحليل';
      
      const result = await specializedCleaner.applySpecializedCleaning(mixedText);
      
      // Should clean mixed script boundaries
      expect(result.cleanedText).not.toContain('محاميPro');
      expect(result.cleanedText).not.toContain('Proتحليل');
      
      // Should preserve Arabic content with proper separation
      expect(result.cleanedText).toContain('محامي');
      expect(result.cleanedText).toContain('تحليل');
    });

    test('should handle encoding corruption patterns', async () => {
      const corruptedText = 'محامي\uFFFDتحليل\u0000ملفات';
      
      const result = await specializedCleaner.applySpecializedCleaning(corruptedText);
      
      // Should remove corrupted characters
      expect(result.cleanedText).not.toContain('\uFFFD');
      expect(result.cleanedText).not.toContain('\u0000');
      
      // Should preserve valid Arabic content
      expect(result.cleanedText).toContain('محامي');
      expect(result.cleanedText).toContain('تحليل');
      expect(result.cleanedText).toContain('ملفات');
    });

    test('should detect system artifacts in legal content', async () => {
      const artifactText = 'المادة JuristDZ من قانون JURIST الإجراءات DZ الجنائية';
      
      const result = await specializedCleaner.applySpecializedCleaning(artifactText);
      
      // Should remove system artifacts
      expect(result.cleanedText).not.toContain('JuristDZ');
      expect(result.cleanedText).not.toContain('JURIST');
      expect(result.cleanedText).not.toContain('DZ');
      
      // Should preserve legal terminology
      expect(result.cleanedText).toContain('المادة');
      expect(result.cleanedText).toContain('من قانون');
      expect(result.cleanedText).toContain('الإجراءات الجنائية');
    });
  });

  describe('Regression Prevention', () => {
    test('should prevent regression of previously fixed patterns', async () => {
      for (const regressionPattern of REGRESSION_PATTERNS) {
        const result = await specializedCleaner.applySpecializedCleaning(regressionPattern);
        
        // Should detect and prevent regression
        expect(result.regressionPrevented).toBe(true);
        
        // Should not contain the problematic pattern in output
        expect(result.cleanedText).not.toContain('Pro');
        expect(result.cleanedText).not.toContain('Defined');
        expect(result.cleanedText).not.toContain('процедة');
        expect(result.cleanedText).not.toContain('JuristDZ');
        expect(result.cleanedText).not.toContain('AUTO-TRANSLATE');
      }
    });

    test('should validate cleaning results for regression', async () => {
      const problematicText = 'محامي Pro V2 AUTO-TRANSLATE';
      
      const result = await specializedCleaner.applySpecializedCleaning(problematicText);
      const validation = await specializedCleaner.validateCleaning(problematicText, result.cleanedText);
      
      // Should pass validation
      expect(validation.isClean).toBe(true);
      expect(validation.remainingIssues.length).toBe(0);
      expect(validation.regressionDetected).toBe(false);
      expect(validation.confidence).toBeGreaterThan(0.8);
    });

    test('should detect if cleaning failed to prevent regression', async () => {
      const originalText = 'محامي Pro V2';
      const stillProblematic = 'محامي Pro نظيف'; // Still contains "Pro"
      
      const validation = await specializedCleaner.validateCleaning(originalText, stillProblematic);
      
      // Should detect remaining issues
      expect(validation.isClean).toBe(false);
      expect(validation.remainingIssues.length).toBeGreaterThan(0);
      expect(validation.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with ContentCleaner', () => {
    test('should integrate specialized cleaning with main content cleaner', async () => {
      const problematicText = 'محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE';
      
      const result = await contentCleaner.cleanMixedContent(problematicText);
      
      // Should apply specialized cleaning first
      expect(result.cleanedText).not.toContain('Pro');
      expect(result.cleanedText).not.toContain('V2');
      expect(result.cleanedText).not.toContain('AUTO-TRANSLATE');
      
      // Should preserve Arabic content
      expect(result.cleanedText).toContain('محامي');
      expect(result.cleanedText).toContain('تحليل');
      expect(result.cleanedText).toContain('ملفات');
      
      // Should have high confidence
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should provide access to specialized cleaner through content cleaner', () => {
      const specializedInstance = contentCleaner.getSpecializedCleaner();
      
      expect(specializedInstance).toBeInstanceOf(SpecializedPatternCleaner);
      
      const rules = specializedInstance.getCleaningRules();
      expect(rules.length).toBeGreaterThan(0);
    });

    test('should allow adding user-reported patterns through content cleaner', async () => {
      const newPattern = 'محامي NewUIElement تحليل';
      const description = 'New UI element contamination';
      
      const ruleId = await contentCleaner.addUserReportedPattern(newPattern, description);
      
      expect(ruleId).toBeTruthy();
      
      // Should clean the new pattern
      const result = await contentCleaner.cleanMixedContent(newPattern);
      expect(result.cleanedText).not.toContain('NewUIElement');
    });
  });

  describe('Performance and Statistics', () => {
    test('should track cleaning statistics', async () => {
      const initialStats = specializedCleaner.getCleaningStats();
      
      // Apply cleaning to multiple patterns
      for (const pattern of USER_REPORTED_PATTERNS.slice(0, 3)) {
        await specializedCleaner.applySpecializedCleaning(pattern);
      }
      
      const finalStats = specializedCleaner.getCleaningStats();
      
      // Should update statistics
      expect(finalStats.totalCleanings).toBeGreaterThan(initialStats.totalCleanings);
      expect(finalStats.userReportedPatternsRemoved).toBeGreaterThan(initialStats.userReportedPatternsRemoved);
      expect(finalStats.averageProcessingTime).toBeGreaterThan(0);
    });

    test('should provide comprehensive statistics through content cleaner', () => {
      const stats = contentCleaner.getComprehensiveStats();
      
      expect(stats.basic).toBeDefined();
      expect(stats.specialized).toBeDefined();
      expect(stats.specialized.activeRules).toBeGreaterThan(0);
      expect(stats.specialized.userReportedRules).toBeGreaterThan(0);
    });

    test('should process user-reported patterns efficiently', async () => {
      const startTime = Date.now();
      
      // Process all user-reported patterns
      for (const pattern of USER_REPORTED_PATTERNS) {
        await specializedCleaner.applySpecializedCleaning(pattern);
      }
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / USER_REPORTED_PATTERNS.length;
      
      // Should process efficiently
      expect(averageTime).toBeLessThan(1000); // Less than 1 second per pattern
    });
  });

  describe('Rule Management', () => {
    test('should allow adding custom specialized rules', () => {
      const ruleId = specializedCleaner.addCleaningRule({
        id: 'test_custom_rule',
        name: 'Test Custom Rule',
        pattern: /TestPattern/gi,
        type: PatternType.UI_ELEMENTS,
        severity: Severity.HIGH,
        action: CleaningActionType.REMOVE,
        description: 'Test custom cleaning rule',
        userReported: true,
        replacementStrategy: 'remove',
        priority: 1,
        enabled: true
      });
      
      expect(ruleId).toBe('test_custom_rule');
      
      const rules = specializedCleaner.getCleaningRules();
      const addedRule = rules.find(rule => rule.id === 'test_custom_rule');
      expect(addedRule).toBeDefined();
      expect(addedRule!.userReported).toBe(true);
    });

    test('should allow updating existing rules', () => {
      const rules = specializedCleaner.getCleaningRules();
      const firstRule = rules[0];
      
      const updated = specializedCleaner.updateCleaningRule(firstRule.id, {
        enabled: false,
        description: 'Updated description'
      });
      
      expect(updated).toBe(true);
      
      const updatedRules = specializedCleaner.getCleaningRules();
      const updatedRule = updatedRules.find(rule => rule.id === firstRule.id);
      expect(updatedRule!.enabled).toBe(false);
      expect(updatedRule!.description).toBe('Updated description');
    });

    test('should allow removing rules', () => {
      const initialRules = specializedCleaner.getCleaningRules();
      const ruleToRemove = initialRules[0];
      
      const removed = specializedCleaner.removeCleaningRule(ruleToRemove.id);
      expect(removed).toBe(true);
      
      const finalRules = specializedCleaner.getCleaningRules();
      expect(finalRules.length).toBe(initialRules.length - 1);
      expect(finalRules.find(rule => rule.id === ruleToRemove.id)).toBeUndefined();
    });
  });

  describe('Configuration Management', () => {
    test('should export configuration', () => {
      const config = specializedCleaner.exportConfiguration();
      
      expect(config).toBeTruthy();
      expect(typeof config).toBe('string');
      
      const parsed = JSON.parse(config);
      expect(parsed.cleaningRules).toBeDefined();
      expect(parsed.regressionPatterns).toBeDefined();
      expect(parsed.stats).toBeDefined();
    });

    test('should import configuration', () => {
      const originalConfig = specializedCleaner.exportConfiguration();
      const newCleaner = new SpecializedPatternCleaner();
      
      const importResult = newCleaner.importConfiguration(originalConfig);
      
      expect(importResult.success).toBe(true);
      expect(importResult.imported).toBeGreaterThan(0);
      expect(importResult.errors.length).toBe(0);
      
      // Should have same number of rules
      const originalRules = specializedCleaner.getCleaningRules();
      const importedRules = newCleaner.getCleaningRules();
      expect(importedRules.length).toBe(originalRules.length);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty text gracefully', async () => {
      const result = await specializedCleaner.applySpecializedCleaning('');
      
      expect(result.cleanedText).toBe('');
      expect(result.appliedRules.length).toBe(0);
      expect(result.userReportedPatternsFound).toBe(0);
      expect(result.confidence).toBe(1.0);
    });

    test('should handle text with no problematic patterns', async () => {
      const cleanText = 'هذا نص عربي نظيف بدون مشاكل';
      
      const result = await specializedCleaner.applySpecializedCleaning(cleanText);
      
      expect(result.cleanedText).toBe(cleanText);
      expect(result.appliedRules.length).toBe(0);
      expect(result.userReportedPatternsFound).toBe(0);
      expect(result.confidence).toBe(1.0);
    });

    test('should handle extremely corrupted content', async () => {
      const extremelyCorrupted = 'Pro V2 AUTO-TRANSLATE процедة Defined JuristDZ';
      
      const result = await specializedCleaner.applySpecializedCleaning(extremelyCorrupted);
      
      // Should remove all problematic elements
      expect(result.cleanedText).not.toContain('Pro');
      expect(result.cleanedText).not.toContain('V2');
      expect(result.cleanedText).not.toContain('AUTO-TRANSLATE');
      expect(result.cleanedText).not.toContain('процедة');
      expect(result.cleanedText).not.toContain('Defined');
      expect(result.cleanedText).not.toContain('JuristDZ');
      
      // Should have applied many rules
      expect(result.appliedRules.length).toBeGreaterThan(3);
      expect(result.specializedActionsApplied).toBeGreaterThan(3);
    });

    test('should handle invalid rule updates gracefully', () => {
      const updated = specializedCleaner.updateCleaningRule('nonexistent_rule', {
        enabled: false
      });
      
      expect(updated).toBe(false);
    });

    test('should handle invalid rule removal gracefully', () => {
      const removed = specializedCleaner.removeCleaningRule('nonexistent_rule');
      
      expect(removed).toBe(false);
    });
  });

  describe('Validation and Quality Assurance', () => {
    test('should validate all user-reported patterns are cleanable', async () => {
      for (const pattern of USER_REPORTED_PATTERNS) {
        const result = await specializedCleaner.applySpecializedCleaning(pattern);
        const validation = await specializedCleaner.validateCleaning(pattern, result.cleanedText);
        
        // Should successfully clean each pattern
        expect(validation.isClean).toBe(true);
        expect(validation.remainingIssues.length).toBe(0);
        expect(validation.confidence).toBeGreaterThan(0.5);
      }
    });

    test('should ensure no regression patterns remain after cleaning', async () => {
      for (const regressionPattern of REGRESSION_PATTERNS) {
        const result = await specializedCleaner.applySpecializedCleaning(regressionPattern);
        
        // Should not contain any known problematic elements
        expect(result.cleanedText).not.toContain('Pro');
        expect(result.cleanedText).not.toContain('V2');
        expect(result.cleanedText).not.toContain('AUTO-TRANSLATE');
        expect(result.cleanedText).not.toContain('Defined');
        expect(result.cleanedText).not.toContain('процедة');
        expect(result.cleanedText).not.toContain('JuristDZ');
        
        // Should have prevented regression
        expect(result.regressionPrevented).toBe(true);
      }
    });

    test('should maintain high confidence for specialized cleaning', async () => {
      const confidenceScores: number[] = [];
      
      for (const pattern of USER_REPORTED_PATTERNS) {
        const result = await specializedCleaner.applySpecializedCleaning(pattern);
        confidenceScores.push(result.confidence);
      }
      
      const averageConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
      
      // Should maintain high average confidence
      expect(averageConfidence).toBeGreaterThan(0.7);
      
      // No confidence score should be too low
      expect(Math.min(...confidenceScores)).toBeGreaterThan(0.5);
    });
  });
});