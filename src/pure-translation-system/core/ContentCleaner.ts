/**
 * Content Cleaner Implementation
 * 
 * Aggressive content cleaning system that removes all problematic characters,
 * UI elements, and mixed language fragments before translation processing.
 * 
 * Implements zero-tolerance policies for:
 * - Cyrillic characters (e.g., "процедة")
 * - UI elements (e.g., "AUTO-TRANSLATE", "Pro", "V2")
 * - English fragments (e.g., "Defined")
 * - Corrupted encoding and invalid Unicode
 * - Mixed script contamination
 */

import {
  CleanedContent,
  ProblematicPattern,
  Language,
  CleaningAction,
  RemovedElement,
  PatternType,
  Severity,
  CleaningActionType,
  TextPosition
} from '../types';

import { 
  IContentCleaner, 
  CleaningRule, 
  CleaningValidation, 
  CleaningStats 
} from '../interfaces/ContentCleaner';

import { 
  SpecializedPatternCleaner, 
  SpecializedCleaningResult 
} from './SpecializedPatternCleaner';

import { defaultLogger } from '../utils/Logger';

export class ContentCleaner implements IContentCleaner {
  private cleaningStats: CleaningStats;
  private customRules: CleaningRule[];
  private specializedCleaner: SpecializedPatternCleaner;

  // Predefined problematic patterns based on user reports
  private readonly CYRILLIC_PATTERN = /[\u0400-\u04FF]+/g;
  private readonly UI_ELEMENTS_PATTERN = /(AUTO-TRANSLATE|Pro|V2|Defined|JuristDZ|JURIST|DZ|AUTO|TRANSLATE|محاميProتحليلملفاتV2AUTO-TRANSLATE)/gi;
  private readonly ENGLISH_FRAGMENTS_PATTERN = /\b(Defined|in|the|Article|of|Law|Criminal|Procedure|Code|Section|Chapter|Paragraph)\b/gi;
  private readonly MIXED_SCRIPT_PATTERN = /[\u0600-\u06FF][\u0000-\u007F]+[\u0600-\u06FF]|[\u0000-\u007F][\u0600-\u06FF]+[\u0000-\u007F]/g;
  private readonly VERSION_NUMBERS_PATTERN = /\b(V\d+|v\d+|\d+\.\d+|\d+\.\d+\.\d+)\b/g;
  private readonly CORRUPTED_ENCODING_PATTERN = /[^\u0000-\u007F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  
  // Specific user-reported problematic strings
  private readonly USER_REPORTED_PATTERNS = [
    /محامي\s*دي\s*زاد\s*متصل\s*محامي\s*Pro\s*تحليل\s*ملفات\s*V2\s*AUTO-TRANSLATE/gi,
    /الشهود\s*Defined\s*في\s*المادة\s*\d+\s*من\s*قانون\s*الإجراءات\s*الجنائية\s*ال\s*процедة/gi,
  ];

  /**
   * Enhance script separation logic
   */
  async enhanceScriptSeparation(): Promise<void> {
    // Add enhanced script separation patterns
    this.customRules.push({
      name: 'enhanced_script_separation',
      pattern: /[\u0600-\u06FF]+[\u0000-\u007F]+[\u0600-\u06FF]+/g,
      action: CleaningActionType.CLEAN,
      priority: 1,
      description: 'Enhanced script separation for mixed Arabic-Latin content'
    });
    
    defaultLogger.info('Enhanced script separation logic added', {}, 'ContentCleaner');
  }

  /**
   * Enhance encoding validation
   */
  async enhanceEncodingValidation(): Promise<void> {
    // Add more comprehensive encoding validation patterns
    this.customRules.push({
      name: 'enhanced_encoding_validation',
      pattern: /[^\u0000-\u007F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]/g,
      action: CleaningActionType.REMOVE,
      priority: 1,
      description: 'Enhanced encoding validation for corrupted characters'
    });
    
    defaultLogger.info('Enhanced encoding validation added', {}, 'ContentCleaner');
  }

  /**
   * Enhance pre-translation analysis
   */
  async enhancePreTranslationAnalysis(): Promise<void> {
    // Add comprehensive pre-translation content analysis
    this.customRules.push({
      name: 'pre_translation_analysis',
      pattern: /(AUTO-TRANSLATE|Pro|V2|Defined|JuristDZ|محاميProتحليلملفاتV2AUTO-TRANSLATE)/gi,
      action: CleaningActionType.REMOVE,
      priority: 1,
      description: 'Enhanced pre-translation content analysis'
    });
    
    defaultLogger.info('Enhanced pre-translation analysis added', {}, 'ContentCleaner');
  }

  /**
   * Add cleaning patterns from feedback
   */
  async addCleaningPatterns(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      this.customRules.push({
        name: `feedback_pattern_${Date.now()}`,
        pattern: new RegExp(this.escapeRegExp(pattern), 'gi'),
        action: CleaningActionType.REMOVE,
        priority: 1,
        description: `Pattern added from user feedback: ${pattern}`
      });
    }
    
    defaultLogger.info('Cleaning patterns added from feedback', {
      patternsCount: patterns.length
    }, 'ContentCleaner');
  }

  /**
   * Update cleaning rules
   */
  async updateCleaningRules(details: any): Promise<void> {
    if (details.patterns) {
      await this.addCleaningPatterns(details.patterns);
    }
    
    defaultLogger.info('Cleaning rules updated', { details }, 'ContentCleaner');
  }

  /**
   * Escape regular expression special characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  constructor() {
    this.cleaningStats = {
      totalCleaned: 0,
      patternsRemoved: new Map(),
      averageCleaningTime: 0,
      successRate: 100
    };
    this.customRules = [];
    this.specializedCleaner = new SpecializedPatternCleaner();
  }

  /**
   * Main content cleaning method - removes all problematic content
   * Enhanced with specialized cleaning for user-reported patterns
   */
  async cleanMixedContent(text: string): Promise<CleanedContent> {
    const startTime = Date.now();
    const originalLength = text.length;
    let cleanedText = text;
    const removedElements: RemovedElement[] = [];
    const cleaningActions: CleaningAction[] = [];

    try {
      // Step 1: Apply specialized cleaning for user-reported patterns first
      const specializedResult = await this.specializedCleaner.applySpecializedCleaning(cleanedText);
      cleanedText = specializedResult.cleanedText;
      removedElements.push(...specializedResult.removedElements);
      cleaningActions.push(...specializedResult.cleaningActions);

      defaultLogger.info('Applied specialized cleaning', {
        rulesApplied: specializedResult.appliedRules.length,
        userReportedPatternsFound: specializedResult.userReportedPatternsFound,
        regressionPrevented: specializedResult.regressionPrevented
      }, 'ContentCleaner');

      // Step 2: Remove user-reported problematic patterns (legacy patterns not covered by specialized cleaner)
      const userReportedResult = this.removeUserReportedPatterns(cleanedText);
      cleanedText = userReportedResult.text;
      removedElements.push(...userReportedResult.removedElements);
      cleaningActions.push(...userReportedResult.actions);

      // Step 3: Remove Cyrillic characters
      const cyrillicResult = this.removeCyrillicCharacters(cleanedText);
      cleanedText = cyrillicResult.text;
      removedElements.push(...cyrillicResult.removedElements);
      cleaningActions.push(...cyrillicResult.actions);

      // Step 4: Remove UI elements
      const uiResult = this.removeUIElements(cleanedText);
      cleanedText = uiResult.text;
      removedElements.push(...uiResult.removedElements);
      cleaningActions.push(...uiResult.actions);

      // Step 5: Remove English fragments
      const englishResult = this.removeEnglishFragments(cleanedText);
      cleanedText = englishResult.text;
      removedElements.push(...englishResult.removedElements);
      cleaningActions.push(...englishResult.actions);

      // Step 6: Clean mixed scripts
      const mixedScriptResult = this.cleanMixedScripts(cleanedText);
      cleanedText = mixedScriptResult.text;
      removedElements.push(...mixedScriptResult.removedElements);
      cleaningActions.push(...mixedScriptResult.actions);

      // Step 7: Remove version numbers and technical identifiers
      const versionResult = this.removeVersionNumbers(cleanedText);
      cleanedText = versionResult.text;
      removedElements.push(...versionResult.removedElements);
      cleaningActions.push(...versionResult.actions);

      // Step 8: Normalize encoding
      cleanedText = this.normalizeEncoding(cleanedText);

      // Step 9: Final cleanup - remove extra whitespace
      cleanedText = this.finalCleanup(cleanedText);

      // Step 10: Validate that specialized cleaning was successful
      const validationResult = await this.specializedCleaner.validateCleaning(text, cleanedText);
      if (!validationResult.isClean) {
        defaultLogger.warn('Specialized cleaning validation failed', {
          remainingIssues: validationResult.remainingIssues.length,
          regressionDetected: validationResult.regressionDetected
        }, 'ContentCleaner');
      }

      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, removedElements.length > 0);

      return {
        cleanedText,
        removedElements,
        cleaningActions,
        originalLength,
        cleanedLength: cleanedText.length,
        confidence: this.calculateCleaningConfidence(removedElements, originalLength),
        processingTime
      };

    } catch (error) {
      defaultLogger.error('Content cleaning failed', {
        error: error.message,
        textLength: text.length
      }, 'ContentCleaner');
      
      throw new Error(`Content cleaning failed: ${error.message}`);
    }
  }

  /**
   * Remove user-reported problematic patterns
   */
  private removeUserReportedPatterns(text: string): { text: string; removedElements: RemovedElement[]; actions: CleaningAction[] } {
    let cleanedText = text;
    const removedElements: RemovedElement[] = [];
    const actions: CleaningAction[] = [];

    this.USER_REPORTED_PATTERNS.forEach((pattern, index) => {
      const matches = Array.from(cleanedText.matchAll(pattern));
      matches.forEach(match => {
        if (match.index !== undefined) {
          removedElements.push({
            type: PatternType.USER_REPORTED,
            content: match[0],
            position: { start: match.index, end: match.index + match[0].length },
            reason: `User-reported problematic pattern ${index + 1}`
          });

          actions.push({
            type: CleaningActionType.REMOVE,
            pattern: pattern.source,
            position: { start: match.index, end: match.index + match[0].length },
            reason: 'User-reported mixed content elimination'
          });
        }
      });

      cleanedText = cleanedText.replace(pattern, ' ');
    });

    return { text: cleanedText, removedElements, actions };
  }

  /**
   * Remove Cyrillic characters completely
   */
  private removeCyrillicCharacters(text: string): { text: string; removedElements: RemovedElement[]; actions: CleaningAction[] } {
    const removedElements: RemovedElement[] = [];
    const actions: CleaningAction[] = [];
    
    const matches = Array.from(text.matchAll(this.CYRILLIC_PATTERN));
    matches.forEach(match => {
      if (match.index !== undefined) {
        removedElements.push({
          type: PatternType.CYRILLIC_CHARACTERS,
          content: match[0],
          position: { start: match.index, end: match.index + match[0].length },
          reason: 'Cyrillic characters not allowed in Arabic/French legal content'
        });

        actions.push({
          type: CleaningActionType.REMOVE,
          pattern: this.CYRILLIC_PATTERN.source,
          position: { start: match.index, end: match.index + match[0].length },
          reason: 'Zero tolerance for Cyrillic characters'
        });
      }
    });

    const cleanedText = text.replace(this.CYRILLIC_PATTERN, ' ');
    return { text: cleanedText, removedElements, actions };
  }

  /**
   * Remove UI elements and system artifacts
   */
  private removeUIElements(text: string): { text: string; removedElements: RemovedElement[]; actions: CleaningAction[] } {
    const removedElements: RemovedElement[] = [];
    const actions: CleaningAction[] = [];
    
    const matches = Array.from(text.matchAll(this.UI_ELEMENTS_PATTERN));
    matches.forEach(match => {
      if (match.index !== undefined) {
        removedElements.push({
          type: PatternType.UI_ELEMENTS,
          content: match[0],
          position: { start: match.index, end: match.index + match[0].length },
          reason: 'UI elements contaminate legal content'
        });

        actions.push({
          type: CleaningActionType.REMOVE,
          pattern: this.UI_ELEMENTS_PATTERN.source,
          position: { start: match.index, end: match.index + match[0].length },
          reason: 'Professional legal content must not contain UI elements'
        });
      }
    });

    const cleanedText = text.replace(this.UI_ELEMENTS_PATTERN, ' ');
    return { text: cleanedText, removedElements, actions };
  }

  /**
   * Remove English fragments from Arabic content
   */
  private removeEnglishFragments(text: string): { text: string; removedElements: RemovedElement[]; actions: CleaningAction[] } {
    const removedElements: RemovedElement[] = [];
    const actions: CleaningAction[] = [];
    
    const matches = Array.from(text.matchAll(this.ENGLISH_FRAGMENTS_PATTERN));
    matches.forEach(match => {
      if (match.index !== undefined) {
        removedElements.push({
          type: PatternType.ENGLISH_FRAGMENTS,
          content: match[0],
          position: { start: match.index, end: match.index + match[0].length },
          reason: 'English fragments violate language purity'
        });

        actions.push({
          type: CleaningActionType.REMOVE,
          pattern: this.ENGLISH_FRAGMENTS_PATTERN.source,
          position: { start: match.index, end: match.index + match[0].length },
          reason: 'Zero tolerance for English fragments in Arabic content'
        });
      }
    });

    const cleanedText = text.replace(this.ENGLISH_FRAGMENTS_PATTERN, ' ');
    return { text: cleanedText, removedElements, actions };
  }

  /**
   * Clean mixed script contamination
   */
  private cleanMixedScripts(text: string): { text: string; removedElements: RemovedElement[]; actions: CleaningAction[] } {
    const removedElements: RemovedElement[] = [];
    const actions: CleaningAction[] = [];
    
    const matches = Array.from(text.matchAll(this.MIXED_SCRIPT_PATTERN));
    matches.forEach(match => {
      if (match.index !== undefined) {
        removedElements.push({
          type: PatternType.MIXED_SCRIPTS,
          content: match[0],
          position: { start: match.index, end: match.index + match[0].length },
          reason: 'Mixed script patterns violate purity requirements'
        });

        actions.push({
          type: CleaningActionType.CLEAN,
          pattern: this.MIXED_SCRIPT_PATTERN.source,
          position: { start: match.index, end: match.index + match[0].length },
          reason: 'Separate mixed scripts for pure content'
        });
      }
    });

    // For mixed scripts, we try to preserve Arabic parts and remove Latin parts
    const cleanedText = text.replace(this.MIXED_SCRIPT_PATTERN, (match) => {
      // Extract Arabic characters and preserve them
      const arabicParts = match.match(/[\u0600-\u06FF]+/g);
      return arabicParts ? arabicParts.join(' ') : ' ';
    });

    return { text: cleanedText, removedElements, actions };
  }

  /**
   * Remove version numbers and technical identifiers
   */
  private removeVersionNumbers(text: string): { text: string; removedElements: RemovedElement[]; actions: CleaningAction[] } {
    const removedElements: RemovedElement[] = [];
    const actions: CleaningAction[] = [];
    
    const matches = Array.from(text.matchAll(this.VERSION_NUMBERS_PATTERN));
    matches.forEach(match => {
      if (match.index !== undefined) {
        removedElements.push({
          type: PatternType.VERSION_NUMBERS,
          content: match[0],
          position: { start: match.index, end: match.index + match[0].length },
          reason: 'Version numbers are technical artifacts'
        });

        actions.push({
          type: CleaningActionType.REMOVE,
          pattern: this.VERSION_NUMBERS_PATTERN.source,
          position: { start: match.index, end: match.index + match[0].length },
          reason: 'Legal content should not contain version numbers'
        });
      }
    });

    const cleanedText = text.replace(this.VERSION_NUMBERS_PATTERN, ' ');
    return { text: cleanedText, removedElements, actions };
  }

  /**
   * Remove corrupted characters and normalize encoding
   */
  removeCorruptedCharacters(text: string): string {
    return text.replace(this.CORRUPTED_ENCODING_PATTERN, '');
  }

  /**
   * Eliminate UI elements (public interface method)
   */
  eliminateUIElements(text: string): string {
    return text.replace(this.UI_ELEMENTS_PATTERN, ' ');
  }

  /**
   * Normalize text encoding
   */
  normalizeEncoding(text: string): string {
    try {
      // Remove corrupted characters
      let normalized = this.removeCorruptedCharacters(text);
      
      // Normalize Unicode
      normalized = normalized.normalize('NFC');
      
      // Ensure proper UTF-8 encoding
      normalized = decodeURIComponent(encodeURIComponent(normalized));
      
      return normalized;
    } catch (error) {
      // If normalization fails, return cleaned version
      return this.removeCorruptedCharacters(text);
    }
  }

  /**
   * Final cleanup - remove extra whitespace and format
   */
  private finalCleanup(text: string): string {
    return text
      .replace(/\s+/g, ' ')  // Multiple spaces to single space
      .replace(/^\s+|\s+$/g, '')  // Trim start and end
      .replace(/\s+([.،؛:])/g, '$1')  // Remove space before punctuation
      .replace(/([.،؛:])\s+/g, '$1 ');  // Ensure single space after punctuation
  }

  /**
   * Detect problematic patterns in text
   */
  detectProblematicPatterns(text: string): ProblematicPattern[] {
    const patterns: ProblematicPattern[] = [];

    // Check for Cyrillic characters
    const cyrillicMatches = Array.from(text.matchAll(this.CYRILLIC_PATTERN));
    cyrillicMatches.forEach(match => {
      if (match.index !== undefined) {
        patterns.push({
          pattern: match[0],
          type: PatternType.CYRILLIC_CHARACTERS,
          position: match.index,
          severity: Severity.CRITICAL,
          action: CleaningActionType.REMOVE
        });
      }
    });

    // Check for UI elements
    const uiMatches = Array.from(text.matchAll(this.UI_ELEMENTS_PATTERN));
    uiMatches.forEach(match => {
      if (match.index !== undefined) {
        patterns.push({
          pattern: match[0],
          type: PatternType.UI_ELEMENTS,
          position: match.index,
          severity: Severity.HIGH,
          action: CleaningActionType.REMOVE
        });
      }
    });

    // Check for English fragments
    const englishMatches = Array.from(text.matchAll(this.ENGLISH_FRAGMENTS_PATTERN));
    englishMatches.forEach(match => {
      if (match.index !== undefined) {
        patterns.push({
          pattern: match[0],
          type: PatternType.ENGLISH_FRAGMENTS,
          position: match.index,
          severity: Severity.HIGH,
          action: CleaningActionType.REMOVE
        });
      }
    });

    // Check for mixed scripts
    const mixedMatches = Array.from(text.matchAll(this.MIXED_SCRIPT_PATTERN));
    mixedMatches.forEach(match => {
      if (match.index !== undefined) {
        patterns.push({
          pattern: match[0],
          type: PatternType.MIXED_SCRIPTS,
          position: match.index,
          severity: Severity.CRITICAL,
          action: CleaningActionType.CLEAN
        });
      }
    });

    return patterns;
  }

  /**
   * Calculate cleaning confidence based on removed elements
   */
  private calculateCleaningConfidence(removedElements: RemovedElement[], originalLength: number): number {
    if (removedElements.length === 0) {
      return 1.0; // Perfect confidence if nothing needed cleaning
    }

    const totalRemovedLength = removedElements.reduce((sum, element) => 
      sum + (element.position.end - element.position.start), 0);
    
    const removalRatio = totalRemovedLength / originalLength;
    
    // Higher removal ratio means lower confidence in the original content
    // But higher confidence in our cleaning process
    if (removalRatio > 0.5) {
      return 0.6; // Low confidence - too much problematic content
    } else if (removalRatio > 0.2) {
      return 0.8; // Medium confidence - moderate cleaning needed
    } else {
      return 0.95; // High confidence - minimal cleaning needed
    }
  }

  /**
   * Update cleaning statistics
   */
  private updateStats(processingTime: number, hadProblems: boolean): void {
    this.cleaningStats.totalCleaned++;
    
    // Update average processing time
    const totalTime = this.cleaningStats.averageCleaningTime * (this.cleaningStats.totalCleaned - 1) + processingTime;
    this.cleaningStats.averageCleaningTime = totalTime / this.cleaningStats.totalCleaned;
    
    // Update success rate (successful cleaning)
    if (hadProblems) {
      const successfulCleanings = Math.floor(this.cleaningStats.successRate * (this.cleaningStats.totalCleaned - 1) / 100);
      this.cleaningStats.successRate = ((successfulCleanings + 1) / this.cleaningStats.totalCleaned) * 100;
    }
  }

  /**
   * Add custom cleaning rule
   */
  addCustomRule(rule: CleaningRule): void {
    this.customRules.push(rule);
  }

  /**
   * Validate cleaning result
   */
  validateCleaning(original: string, cleaned: string): CleaningValidation {
    const hasProblematicPatterns = this.detectProblematicPatterns(cleaned).length > 0;
    
    return {
      isValid: !hasProblematicPatterns,
      confidence: hasProblematicPatterns ? 0 : 1,
      issues: hasProblematicPatterns ? ['Problematic patterns still detected'] : [],
      recommendations: hasProblematicPatterns ? ['Apply additional cleaning rules'] : []
    };
  }

  /**
   * Get cleaning statistics
   */
  getStats(): CleaningStats {
    return { ...this.cleaningStats };
  }

  /**
   * Get specialized cleaner instance for advanced operations
   */
  getSpecializedCleaner(): SpecializedPatternCleaner {
    return this.specializedCleaner;
  }

  /**
   * Add user-reported pattern for specialized cleaning
   */
  async addUserReportedPattern(pattern: string, description: string): Promise<string> {
    return this.specializedCleaner.addCleaningRule({
      id: `user_reported_${Date.now()}`,
      name: `User Reported: ${description}`,
      pattern: new RegExp(this.escapeRegExp(pattern), 'gi'),
      type: PatternType.USER_REPORTED,
      severity: Severity.HIGH,
      action: CleaningActionType.REMOVE,
      description: `User reported problematic pattern: ${description}`,
      userReported: true,
      replacementStrategy: 'remove',
      priority: 1,
      enabled: true
    });
  }

  /**
   * Get comprehensive cleaning statistics including specialized cleaner
   */
  getComprehensiveStats(): {
    basic: CleaningStats;
    specialized: ReturnType<SpecializedPatternCleaner['getCleaningStats']>;
  } {
    return {
      basic: this.getStats(),
      specialized: this.specializedCleaner.getCleaningStats()
    };
  }

  /**
   * Enhance script separation logic
   */
  async enhanceScriptSeparation(): Promise<void> {
    // Add enhanced script separation patterns
    this.customRules.push({
      name: 'enhanced_script_separation',
      pattern: /[\u0600-\u06FF]+[\u0000-\u007F]+[\u0600-\u06FF]+/g,
      action: CleaningActionType.CLEAN,
      priority: 1,
      description: 'Enhanced script separation for mixed Arabic-Latin content'
    });
    
    defaultLogger.info('Enhanced script separation logic added', {}, 'ContentCleaner');
  }

  /**
   * Enhance encoding validation
   */
  async enhanceEncodingValidation(): Promise<void> {
    // Add more comprehensive encoding validation patterns
    this.customRules.push({
      name: 'enhanced_encoding_validation',
      pattern: /[^\u0000-\u007F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]/g,
      action: CleaningActionType.REMOVE,
      priority: 1,
      description: 'Enhanced encoding validation for corrupted characters'
    });
    
    defaultLogger.info('Enhanced encoding validation added', {}, 'ContentCleaner');
  }

  /**
   * Enhance pre-translation analysis
   */
  async enhancePreTranslationAnalysis(): Promise<void> {
    // Add comprehensive pre-translation content analysis
    this.customRules.push({
      name: 'pre_translation_analysis',
      pattern: /(AUTO-TRANSLATE|Pro|V2|Defined|JuristDZ|محاميProتحليلملفاتV2AUTO-TRANSLATE)/gi,
      action: CleaningActionType.REMOVE,
      priority: 1,
      description: 'Enhanced pre-translation content analysis'
    });
    
    defaultLogger.info('Enhanced pre-translation analysis added', {}, 'ContentCleaner');
  }

  /**
   * Add cleaning patterns from feedback
   */
  async addCleaningPatterns(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      this.customRules.push({
        name: `feedback_pattern_${Date.now()}`,
        pattern: new RegExp(this.escapeRegExp(pattern), 'gi'),
        action: CleaningActionType.REMOVE,
        priority: 1,
        description: `Pattern added from user feedback: ${pattern}`
      });
    }
    
    defaultLogger.info('Cleaning patterns added from feedback', {
      patternsCount: patterns.length
    }, 'ContentCleaner');
  }

  /**
   * Update cleaning rules
   */
  async updateCleaningRules(details: any): Promise<void> {
    if (details.patterns) {
      await this.addCleaningPatterns(details.patterns);
    }
    
    defaultLogger.info('Cleaning rules updated', { details }, 'ContentCleaner');
  }

  /**
   * Escape regular expression special characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}