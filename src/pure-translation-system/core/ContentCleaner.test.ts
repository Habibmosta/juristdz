/**
 * Content Cleaner Tests
 * 
 * Tests for the aggressive content cleaning system, focusing on
 * user-reported problematic content and zero-tolerance policies.
 */

import { ContentCleaner } from './ContentCleaner';
import { PatternType, Severity } from '../types';

describe('ContentCleaner', () => {
  let cleaner: ContentCleaner;

  beforeEach(() => {
    cleaner = new ContentCleaner();
  });

  describe('User-Reported Problematic Content', () => {
    it('should clean the specific user-reported mixed content string', async () => {
      const problematicText = 'محامي دي زاد متصل محامي Pro تحليل ملفات V2 AUTO-TRANSLATE';
      
      const result = await cleaner.cleanMixedContent(problematicText);
      
      expect(result.cleanedText).not.toContain('Pro');
      expect(result.cleanedText).not.toContain('V2');
      expect(result.cleanedText).not.toContain('AUTO-TRANSLATE');
      expect(result.removedElements.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should clean corrupted character strings with Cyrillic', async () => {
      const problematicText = 'الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة';
      
      const result = await cleaner.cleanMixedContent(problematicText);
      
      expect(result.cleanedText).not.toContain('Defined');
      expect(result.cleanedText).not.toContain('процедة');
      expect(result.removedElements.some(el => el.type === PatternType.CYRILLIC_CHARACTERS)).toBe(true);
      expect(result.removedElements.some(el => el.type === PatternType.ENGLISH_FRAGMENTS)).toBe(true);
    });
  });

  describe('Cyrillic Character Removal', () => {
    it('should remove all Cyrillic characters', () => {
      const textWithCyrillic = 'النص العربي процедة والمزيد من النص';
      
      const cleaned = cleaner.removeCorruptedCharacters(textWithCyrillic);
      
      expect(cleaned).not.toMatch(/[\u0400-\u04FF]/);
      expect(cleaned).toContain('النص العربي');
      expect(cleaned).toContain('والمزيد من النص');
    });
  });

  describe('UI Element Removal', () => {
    it('should remove all UI elements and system artifacts', () => {
      const textWithUI = 'النص القانوني AUTO-TRANSLATE Pro V2 JuristDZ';
      
      const cleaned = cleaner.eliminateUIElements(textWithUI);
      
      expect(cleaned).not.toContain('AUTO-TRANSLATE');
      expect(cleaned).not.toContain('Pro');
      expect(cleaned).not.toContain('V2');
      expect(cleaned).not.toContain('JuristDZ');
      expect(cleaned).toContain('النص القانوني');
    });
  });

  describe('English Fragment Removal', () => {
    it('should remove English legal fragments from Arabic text', async () => {
      const mixedText = 'الشهود Defined في المادة Article 1 من قانون Law الإجراءات';
      
      const result = await cleaner.cleanMixedContent(mixedText);
      
      expect(result.cleanedText).not.toContain('Defined');
      expect(result.cleanedText).not.toContain('Article');
      expect(result.cleanedText).not.toContain('Law');
      expect(result.cleanedText).toContain('الشهود');
      expect(result.cleanedText).toContain('في المادة');
    });
  });

  describe('Pattern Detection', () => {
    it('should detect all types of problematic patterns', () => {
      const problematicText = 'محامي Pro تحليل V2 AUTO-TRANSLATE процедة Defined';
      
      const patterns = cleaner.detectProblematicPatterns(problematicText);
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.type === PatternType.UI_ELEMENTS)).toBe(true);
      expect(patterns.some(p => p.type === PatternType.CYRILLIC_CHARACTERS)).toBe(true);
      expect(patterns.some(p => p.type === PatternType.ENGLISH_FRAGMENTS)).toBe(true);
    });

    it('should assign appropriate severity levels', () => {
      const problematicText = 'النص процедة AUTO-TRANSLATE';
      
      const patterns = cleaner.detectProblematicPatterns(problematicText);
      
      const cyrillicPattern = patterns.find(p => p.type === PatternType.CYRILLIC_CHARACTERS);
      const uiPattern = patterns.find(p => p.type === PatternType.UI_ELEMENTS);
      
      expect(cyrillicPattern?.severity).toBe(Severity.CRITICAL);
      expect(uiPattern?.severity).toBe(Severity.HIGH);
    });
  });

  describe('Encoding Normalization', () => {
    it('should normalize text encoding properly', () => {
      const textWithEncodingIssues = 'النص العربي\u200B\u200C\u200D';
      
      const normalized = cleaner.normalizeEncoding(textWithEncodingIssues);
      
      expect(normalized).toBe('النص العربي');
    });
  });

  describe('Cleaning Validation', () => {
    it('should validate that cleaning was successful', async () => {
      const problematicText = 'محامي Pro V2 AUTO-TRANSLATE';
      const result = await cleaner.cleanMixedContent(problematicText);
      
      const validation = cleaner.validateCleaning(problematicText, result.cleanedText);
      
      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBeGreaterThan(0);
      expect(validation.issues.length).toBe(0);
    });

    it('should detect if cleaning failed', () => {
      const original = 'محامي Pro V2';
      const stillProblematic = 'محامي Pro نظيف'; // Still contains "Pro"
      
      const validation = cleaner.validateCleaning(original, stillProblematic);
      
      expect(validation.isValid).toBe(false);
      expect(validation.confidence).toBe(0);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics Tracking', () => {
    it('should track cleaning statistics', async () => {
      await cleaner.cleanMixedContent('محامي Pro V2');
      await cleaner.cleanMixedContent('نص نظيف');
      
      const stats = cleaner.getStats();
      
      expect(stats.totalCleaned).toBe(2);
      expect(stats.averageCleaningTime).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', async () => {
      const result = await cleaner.cleanMixedContent('');
      
      expect(result.cleanedText).toBe('');
      expect(result.removedElements.length).toBe(0);
      expect(result.confidence).toBe(1.0);
    });

    it('should handle text with only Arabic content', async () => {
      const arabicText = 'النص العربي الصحيح والنظيف';
      
      const result = await cleaner.cleanMixedContent(arabicText);
      
      expect(result.cleanedText).toBe(arabicText.trim());
      expect(result.removedElements.length).toBe(0);
      expect(result.confidence).toBe(1.0);
    });

    it('should handle extremely corrupted content', async () => {
      const corruptedText = 'محامي Pro V2 AUTO-TRANSLATE процедة Defined JuristDZ';
      
      const result = await cleaner.cleanMixedContent(corruptedText);
      
      expect(result.cleanedText).toContain('محامي');
      expect(result.cleanedText).not.toContain('Pro');
      expect(result.cleanedText).not.toContain('процедة');
      expect(result.removedElements.length).toBeGreaterThan(5);
    });
  });
});