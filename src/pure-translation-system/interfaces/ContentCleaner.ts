/**
 * Content Cleaner Interface
 * 
 * Aggressive content cleaning system that removes all problematic characters,
 * UI elements, and mixed language fragments before translation processing.
 */

import {
  CleanedContent,
  ProblematicPattern,
  Language,
  CleaningAction,
  RemovedElement
} from '../types';

export interface IContentCleaner {
  /**
   * Clean mixed content with aggressive removal of problematic elements
   * @param text Input text with potential mixed content
   * @returns Cleaned content ready for pure translation
   */
  cleanMixedContent(text: string): Promise<CleanedContent>;

  /**
   * Remove corrupted characters including Cyrillic and encoding artifacts
   * @param text Input text with potential corrupted characters
   * @returns Text with corrupted characters removed
   */
  removeCorruptedCharacters(text: string): string;

  /**
   * Eliminate UI elements and system artifacts
   * @param text Input text with potential UI contamination
   * @returns Text with UI elements removed
   */
  eliminateUIElements(text: string): string;

  /**
   * Normalize text encoding and format
   * @param text Input text with potential encoding issues
   * @returns Text with normalized encoding
   */
  normalizeEncoding(text: string): string;

  /**
   * Detect problematic patterns in text
   * @param text Input text to analyze
   * @returns Array of detected problematic patterns
   */
  detectProblematicPatterns(text: string): ProblematicPattern[];

  /**
   * Add custom cleaning rule
   * @param rule Custom cleaning rule to add
   */
  addCustomRule(rule: CleaningRule): void;

  /**
   * Validate cleaning result
   * @param original Original text before cleaning
   * @param cleaned Text after cleaning
   * @returns Cleaning validation result
   */
  validateCleaning(original: string, cleaned: string): CleaningValidation;

  /**
   * Get cleaning statistics
   * @returns Statistics about cleaning operations
   */
  getStats(): CleaningStats;
}

export interface CleaningRule {
  pattern: string | RegExp;
  replacement: string;
  description: string;
  priority: number;
  enabled: boolean;
}

export interface CleaningValidation {
  isValid: boolean;
  confidence: number;
  issues: string[];
  recommendations: string[];
}

export interface CleaningStats {
  totalCleaned: number;
  patternsRemoved: Map<string, number>;
  averageCleaningTime: number;
  successRate: number;
}