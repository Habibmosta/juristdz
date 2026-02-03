/**
 * Specialized Pattern Cleaner for User-Reported Content
 * 
 * This module implements targeted cleaning rules specifically designed for
 * user-reported mixed content patterns. It provides enhanced detection,
 * specialized cleaning procedures, and validation to prevent regression
 * of previously fixed issues.
 * 
 * Task 13.2: Implement specialized cleaning for user-reported patterns
 * Requirements: 2.4, 3.5, 8.1, 8.2
 */

import {
  CleanedContent,
  ProblematicPattern,
  PatternType,
  Severity,
  CleaningActionType,
  RemovedElement,
  CleaningAction,
  TextPosition,
  Language
} from '../types';
import { defaultLogger } from '../utils/Logger';
import { RegressionPreventionValidator } from './RegressionPreventionValidator';

export interface SpecializedCleaningRule {
  id: string;
  name: string;
  pattern: RegExp;
  type: PatternType;
  severity: Severity;
  action: CleaningActionType;
  description: string;
  userReported: boolean;
  replacementStrategy: 'remove' | 'replace' | 'separate' | 'normalize';
  replacement?: string;
  priority: number;
  enabled: boolean;
  createdDate: Date;
  lastUsed?: Date;
  usageCount: number;
}

export interface SpecializedCleaningResult extends CleanedContent {
  appliedRules: SpecializedCleaningRule[];
  regressionPrevented: boolean;
  userReportedPatternsFound: number;
  specializedActionsApplied: number;
}

export interface ValidationResult {
  isClean: boolean;
  remainingIssues: ProblematicPattern[];
  regressionDetected: boolean;
  confidence: number;
  recommendations: string[];
}

export class SpecializedPatternCleaner {
  private cleaningRules: Map<string, SpecializedCleaningRule> = new Map();
  private regressionPatterns: Set<string> = new Set();
  private regressionValidator: RegressionPreventionValidator;
  private cleaningStats = {
    totalCleanings: 0,
    userReportedPatternsRemoved: 0,
    regressionsPreventedCount: 0,
    averageProcessingTime: 0
  };

  constructor() {
    this.initializeSpecializedRules();
    this.initializeRegressionPatterns();
    this.regressionValidator = new RegressionPreventionValidator();
    
    defaultLogger.info('Specialized Pattern Cleaner initialized', {
      rulesCount: this.cleaningRules.size,
      regressionPatternsCount: this.regressionPatterns.size
    }, 'SpecializedPatternCleaner');
  }

  /**
   * Initialize specialized cleaning rules for user-reported patterns
   */
  private initializeSpecializedRules(): void {
    // Rule 1: Complete user-reported mixed content string
    this.addCleaningRule({
      id: 'user_reported_complete_1',
      name: 'Complete Mixed Content String 1',
      pattern: /محامي\s*دي\s*زاد\s*متصل\s*محامي\s*Pro\s*تحليل\s*ملفات\s*V2\s*AUTO-TRANSLATE/gi,
      type: PatternType.USER_REPORTED,
      severity: Severity.CRITICAL,
      action: CleaningActionType.CLEAN,
      description: 'User-reported complete mixed content string with Arabic, English UI elements',
      userReported: true,
      replacementStrategy: 'separate',
      replacement: 'محامي متصل تحليل ملفات',
      priority: 1,
      enabled: true
    });

    // Rule 2: Legal text with corrupted characters
    this.addCleaningRule({
      id: 'user_reported_legal_corrupted',
      name: 'Legal Text with Corrupted Characters',
      pattern: /الشهود\s*Defined\s*في\s*المادة\s*\d*\s*من\s*قانون\s*الإجراءات\s*الجنائية\s*ال\s*процедة/gi,
      type: PatternType.USER_REPORTED,
      severity: Severity.CRITICAL,
      action: CleaningActionType.CLEAN,
      description: 'User-reported legal text with English and Cyrillic contamination',
      userReported: true,
      replacementStrategy: 'separate',
      replacement: 'الشهود في المادة من قانون الإجراءات الجنائية',
      priority: 1,
      enabled: true
    });

    // Rule 3: Concatenated UI elements with Arabic
    this.addCleaningRule({
      id: 'concatenated_ui_arabic',
      name: 'Concatenated UI Elements with Arabic',
      pattern: /محامي(Pro|V2|AUTO-TRANSLATE|Defined|JuristDZ)+/gi,
      type: PatternType.UI_ELEMENTS,
      severity: Severity.HIGH,
      action: CleaningActionType.CLEAN,
      description: 'Arabic text concatenated with UI elements',
      userReported: true,
      replacementStrategy: 'separate',
      replacement: 'محامي',
      priority: 2,
      enabled: true
    });

    // Rule 4: Cyrillic contamination in Arabic legal text
    this.addCleaningRule({
      id: 'cyrillic_arabic_legal',
      name: 'Cyrillic in Arabic Legal Context',
      pattern: /([\u0600-\u06FF]+)\s*процедة\s*([\u0600-\u06FF]*)/gi,
      type: PatternType.CYRILLIC_CHARACTERS,
      severity: Severity.CRITICAL,
      action: CleaningActionType.CLEAN,
      description: 'Cyrillic characters contaminating Arabic legal text',
      userReported: true,
      replacementStrategy: 'separate',
      replacement: '$1 $2',
      priority: 1,
      enabled: true
    });

    // Rule 5: English fragments in Arabic legal terminology
    this.addCleaningRule({
      id: 'english_arabic_legal_terms',
      name: 'English Fragments in Arabic Legal Terms',
      pattern: /([\u0600-\u06FF]+)\s*(Defined|Article|Law|Criminal|Procedure)\s*([\u0600-\u06FF]*)/gi,
      type: PatternType.ENGLISH_FRAGMENTS,
      severity: Severity.HIGH,
      action: CleaningActionType.CLEAN,
      description: 'English legal fragments mixed with Arabic terms',
      userReported: true,
      replacementStrategy: 'separate',
      replacement: '$1 $3',
      priority: 2,
      enabled: true
    });

    // Rule 6: UI version indicators mixed with content
    this.addCleaningRule({
      id: 'ui_version_mixed',
      name: 'UI Version Indicators Mixed with Content',
      pattern: /([\u0600-\u06FF]+)(Pro|V2|AUTO-TRANSLATE)([\u0600-\u06FF]*)/gi,
      type: PatternType.UI_ELEMENTS,
      severity: Severity.HIGH,
      action: CleaningActionType.CLEAN,
      description: 'UI version indicators mixed with Arabic content',
      userReported: true,
      replacementStrategy: 'separate',
      replacement: '$1 $3',
      priority: 2,
      enabled: true
    });

    // Rule 7: System artifacts in legal content
    this.addCleaningRule({
      id: 'system_artifacts_legal',
      name: 'System Artifacts in Legal Content',
      pattern: /([\u0600-\u06FF]+)\s*(JuristDZ|JURIST|DZ)\s*([\u0600-\u06FF]*)/gi,
      type: PatternType.SYSTEM_ARTIFACTS,
      severity: Severity.MEDIUM,
      action: CleaningActionType.REMOVE,
      description: 'System artifacts contaminating legal content',
      userReported: true,
      replacementStrategy: 'separate',
      replacement: '$1 $3',
      priority: 3,
      enabled: true
    });

    // Rule 8: Multiple UI elements concatenated
    this.addCleaningRule({
      id: 'multiple_ui_concatenated',
      name: 'Multiple UI Elements Concatenated',
      pattern: /(Pro)(V2)(AUTO-TRANSLATE)/gi,
      type: PatternType.UI_ELEMENTS,
      severity: Severity.HIGH,
      action: CleaningActionType.REMOVE,
      description: 'Multiple UI elements concatenated together',
      userReported: true,
      replacementStrategy: 'remove',
      priority: 2,
      enabled: true
    });

    // Rule 9: Mixed script boundaries
    this.addCleaningRule({
      id: 'mixed_script_boundaries',
      name: 'Mixed Script Boundaries',
      pattern: /([\u0600-\u06FF])([a-zA-Z])([\u0600-\u06FF])/g,
      type: PatternType.MIXED_SCRIPTS,
      severity: Severity.HIGH,
      action: CleaningActionType.CLEAN,
      description: 'Mixed script boundaries without proper separation',
      userReported: true,
      replacementStrategy: 'separate',
      replacement: '$1 $3',
      priority: 2,
      enabled: true
    });

    // Rule 10: Encoding corruption patterns
    this.addCleaningRule({
      id: 'encoding_corruption_specific',
      name: 'Specific Encoding Corruption Patterns',
      pattern: /[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g,
      type: PatternType.CORRUPTED_ENCODING,
      severity: Severity.HIGH,
      action: CleaningActionType.REMOVE,
      description: 'Specific encoding corruption and control characters',
      userReported: false,
      replacementStrategy: 'remove',
      priority: 1,
      enabled: true
    });
  }

  /**
   * Initialize patterns that should trigger regression prevention
   */
  private initializeRegressionPatterns(): void {
    // Add patterns that were previously reported and fixed
    this.regressionPatterns.add('محامي Pro تحليل');
    this.regressionPatterns.add('الشهود Defined في');
    this.regressionPatterns.add('قانون процедة الإجراءات');
    this.regressionPatterns.add('محاميProV2AUTO-TRANSLATE');
    this.regressionPatterns.add('JuristDZ Pro V2');
    this.regressionPatterns.add('AUTO-TRANSLATE محامي');
    this.regressionPatterns.add('Defined في المادة');
    this.regressionPatterns.add('процедة الجنائية');
  }

  /**
   * Apply specialized cleaning to text
   */
  async applySpecializedCleaning(text: string, targetLanguage?: Language): Promise<SpecializedCleaningResult> {
    const startTime = Date.now();
    let cleanedText = text;
    const removedElements: RemovedElement[] = [];
    const cleaningActions: CleaningAction[] = [];
    const appliedRules: SpecializedCleaningRule[] = [];
    let userReportedPatternsFound = 0;
    let specializedActionsApplied = 0;

    try {
      // Sort rules by priority (lower number = higher priority)
      const sortedRules = Array.from(this.cleaningRules.values())
        .filter(rule => rule.enabled)
        .sort((a, b) => a.priority - b.priority);

      // Apply each rule in priority order
      for (const rule of sortedRules) {
        const ruleResult = this.applyCleaningRule(cleanedText, rule);
        
        if (ruleResult.applied) {
          cleanedText = ruleResult.cleanedText;
          removedElements.push(...ruleResult.removedElements);
          cleaningActions.push(...ruleResult.cleaningActions);
          appliedRules.push(rule);
          
          // Update rule usage statistics
          rule.lastUsed = new Date();
          rule.usageCount++;
          
          if (rule.userReported) {
            userReportedPatternsFound++;
          }
          specializedActionsApplied++;

          defaultLogger.debug('Applied specialized cleaning rule', {
            ruleId: rule.id,
            ruleName: rule.name,
            removedCount: ruleResult.removedElements.length
          }, 'SpecializedPatternCleaner');
        }
      }

      // Check for regression prevention
      const regressionPrevented = this.checkRegressionPrevention(text, cleanedText);

      // Final cleanup and normalization
      cleanedText = this.finalizeCleanedText(cleanedText);

      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, userReportedPatternsFound, regressionPrevented);

      const result: SpecializedCleaningResult = {
        cleanedText,
        removedElements,
        cleaningActions,
        originalLength: text.length,
        cleanedLength: cleanedText.length,
        confidence: this.calculateCleaningConfidence(removedElements, appliedRules, text.length),
        processingTime,
        appliedRules,
        regressionPrevented,
        userReportedPatternsFound,
        specializedActionsApplied
      };

      defaultLogger.info('Specialized cleaning completed', {
        originalLength: text.length,
        cleanedLength: cleanedText.length,
        rulesApplied: appliedRules.length,
        userReportedPatternsFound,
        regressionPrevented,
        processingTime
      }, 'SpecializedPatternCleaner');

      return result;

    } catch (error) {
      defaultLogger.error('Specialized cleaning failed', {
        error: error.message,
        textLength: text.length
      }, 'SpecializedPatternCleaner');

      throw new Error(`Specialized cleaning failed: ${error.message}`);
    }
  }

  /**
   * Apply a single cleaning rule to text
   */
  private applyCleaningRule(text: string, rule: SpecializedCleaningRule): {
    applied: boolean;
    cleanedText: string;
    removedElements: RemovedElement[];
    cleaningActions: CleaningAction[];
  } {
    const removedElements: RemovedElement[] = [];
    const cleaningActions: CleaningAction[] = [];
    let cleanedText = text;
    let applied = false;

    // Find all matches for this rule
    const matches = Array.from(text.matchAll(rule.pattern));

    if (matches.length > 0) {
      applied = true;

      // Process matches in reverse order to maintain position accuracy
      matches.reverse().forEach(match => {
        if (match.index !== undefined) {
          const position: TextPosition = {
            start: match.index,
            end: match.index + match[0].length
          };

          // Record what was removed
          removedElements.push({
            type: rule.type,
            content: match[0],
            position,
            reason: rule.description
          });

          // Record the cleaning action
          cleaningActions.push({
            type: rule.action,
            pattern: rule.pattern.source,
            position,
            reason: `Applied specialized rule: ${rule.name}`
          });
        }
      });

      // Apply the replacement strategy
      switch (rule.replacementStrategy) {
        case 'remove':
          cleanedText = text.replace(rule.pattern, '');
          break;
        case 'replace':
          cleanedText = text.replace(rule.pattern, rule.replacement || '');
          break;
        case 'separate':
          cleanedText = text.replace(rule.pattern, rule.replacement || ' ');
          break;
        case 'normalize':
          cleanedText = text.replace(rule.pattern, (match) => {
            return this.normalizeMatch(match, rule);
          });
          break;
      }
    }

    return {
      applied,
      cleanedText,
      removedElements,
      cleaningActions
    };
  }

  /**
   * Normalize a matched pattern according to rule specifications
   */
  private normalizeMatch(match: string, rule: SpecializedCleaningRule): string {
    // Apply normalization based on pattern type
    switch (rule.type) {
      case PatternType.CORRUPTED_ENCODING:
        return ''; // Remove corrupted characters
      case PatternType.MIXED_SCRIPTS:
        // Try to separate scripts
        const arabicParts = match.match(/[\u0600-\u06FF]+/g);
        return arabicParts ? arabicParts.join(' ') : ' ';
      default:
        return rule.replacement || ' ';
    }
  }

  /**
   * Check if regression prevention was triggered
   */
  private checkRegressionPrevention(originalText: string, cleanedText: string): boolean {
    let regressionPrevented = false;

    for (const pattern of this.regressionPatterns) {
      if (originalText.includes(pattern) && !cleanedText.includes(pattern)) {
        regressionPrevented = true;
        this.cleaningStats.regressionsPreventedCount++;
        
        defaultLogger.info('Regression prevented', {
          pattern: pattern.substring(0, 50),
          originalContained: true,
          cleanedContained: false
        }, 'SpecializedPatternCleaner');
      }
    }

    return regressionPrevented;
  }

  /**
   * Finalize cleaned text with proper formatting
   */
  private finalizeCleanedText(text: string): string {
    return text
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove leading/trailing whitespace
      .trim()
      // Fix punctuation spacing for Arabic
      .replace(/\s+([.،؛:])/g, '$1')
      .replace(/([.،؛:])\s+/g, '$1 ')
      // Remove empty parentheses or brackets
      .replace(/\(\s*\)/g, '')
      .replace(/\[\s*\]/g, '')
      .replace(/\{\s*\}/g, '');
  }

  /**
   * Calculate confidence score for cleaning operation
   */
  private calculateCleaningConfidence(
    removedElements: RemovedElement[],
    appliedRules: SpecializedCleaningRule[],
    originalLength: number
  ): number {
    if (removedElements.length === 0) {
      return 1.0; // Perfect confidence if nothing needed cleaning
    }

    // Base confidence on rule specificity and user reporting
    let confidence = 0.7; // Base confidence for specialized cleaning

    // Increase confidence for user-reported patterns
    const userReportedRules = appliedRules.filter(rule => rule.userReported);
    confidence += userReportedRules.length * 0.1;

    // Increase confidence for high-priority rules
    const highPriorityRules = appliedRules.filter(rule => rule.priority <= 2);
    confidence += highPriorityRules.length * 0.05;

    // Decrease confidence if too much content was removed
    const totalRemovedLength = removedElements.reduce((sum, element) => 
      sum + (element.position.end - element.position.start), 0);
    const removalRatio = totalRemovedLength / originalLength;
    
    if (removalRatio > 0.7) {
      confidence -= 0.3; // Significant content removal
    } else if (removalRatio > 0.4) {
      confidence -= 0.1; // Moderate content removal
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Validate that cleaning was successful and no regression occurred
   */
  async validateCleaning(originalText: string, cleanedText: string): Promise<ValidationResult> {
    const remainingIssues: ProblematicPattern[] = [];
    let regressionDetected = false;

    // Use regression validator for comprehensive validation
    const regressionValidation = await this.regressionValidator.validateNoRegression(
      originalText,
      cleanedText,
      'specialized_cleaning'
    );

    regressionDetected = regressionValidation.hasRegression;

    // Check for remaining problematic patterns using our rules
    for (const rule of this.cleaningRules.values()) {
      if (!rule.enabled) continue;

      const matches = Array.from(cleanedText.matchAll(rule.pattern));
      matches.forEach(match => {
        if (match.index !== undefined) {
          remainingIssues.push({
            pattern: match[0],
            type: rule.type,
            position: match.index,
            severity: rule.severity,
            action: rule.action
          });
        }
      });
    }

    // Check for regression patterns
    for (const pattern of this.regressionPatterns) {
      if (cleanedText.includes(pattern)) {
        regressionDetected = true;
        remainingIssues.push({
          pattern,
          type: PatternType.USER_REPORTED,
          position: cleanedText.indexOf(pattern),
          severity: Severity.CRITICAL,
          action: CleaningActionType.REMOVE
        });
      }
    }

    const isClean = remainingIssues.length === 0 && !regressionDetected;
    const confidence = isClean ? 1.0 : Math.max(0.1, regressionValidation.confidence);

    const recommendations: string[] = [...regressionValidation.recommendations];
    if (!isClean) {
      recommendations.push('Apply additional cleaning rules');
      if (regressionDetected) {
        recommendations.push('Address regression patterns immediately');
      }
      recommendations.push('Consider manual review of remaining issues');
    }

    return {
      isClean,
      remainingIssues,
      regressionDetected,
      confidence,
      recommendations
    };
  }

  /**
   * Add a new specialized cleaning rule
   */
  addCleaningRule(config: Omit<SpecializedCleaningRule, 'createdDate' | 'lastUsed' | 'usageCount'>): string {
    const rule: SpecializedCleaningRule = {
      ...config,
      createdDate: new Date(),
      usageCount: 0
    };

    this.cleaningRules.set(rule.id, rule);

    defaultLogger.info('Added specialized cleaning rule', {
      ruleId: rule.id,
      ruleName: rule.name,
      type: rule.type,
      userReported: rule.userReported
    }, 'SpecializedPatternCleaner');

    return rule.id;
  }

  /**
   * Update an existing cleaning rule
   */
  updateCleaningRule(ruleId: string, updates: Partial<SpecializedCleaningRule>): boolean {
    const rule = this.cleaningRules.get(ruleId);
    if (!rule) {
      return false;
    }

    Object.assign(rule, updates);

    defaultLogger.info('Updated specialized cleaning rule', {
      ruleId,
      updates: Object.keys(updates)
    }, 'SpecializedPatternCleaner');

    return true;
  }

  /**
   * Remove a cleaning rule
   */
  removeCleaningRule(ruleId: string): boolean {
    const removed = this.cleaningRules.delete(ruleId);
    
    if (removed) {
      defaultLogger.info('Removed specialized cleaning rule', {
        ruleId
      }, 'SpecializedPatternCleaner');
    }

    return removed;
  }

  /**
   * Add a pattern to regression prevention list
   */
  addRegressionPattern(pattern: string): void {
    this.regressionPatterns.add(pattern);
    
    defaultLogger.info('Added regression prevention pattern', {
      pattern: pattern.substring(0, 50)
    }, 'SpecializedPatternCleaner');
  }

  /**
   * Get cleaning statistics
   */
  getCleaningStats(): {
    totalCleanings: number;
    userReportedPatternsRemoved: number;
    regressionsPreventedCount: number;
    averageProcessingTime: number;
    activeRules: number;
    userReportedRules: number;
    regressionPatternsCount: number;
  } {
    const activeRules = Array.from(this.cleaningRules.values()).filter(rule => rule.enabled).length;
    const userReportedRules = Array.from(this.cleaningRules.values()).filter(rule => rule.userReported).length;

    return {
      ...this.cleaningStats,
      activeRules,
      userReportedRules,
      regressionPatternsCount: this.regressionPatterns.size
    };
  }

  /**
   * Get all cleaning rules
   */
  getCleaningRules(): SpecializedCleaningRule[] {
    return Array.from(this.cleaningRules.values());
  }

  /**
   * Get regression patterns
   */
  getRegressionPatterns(): string[] {
    return Array.from(this.regressionPatterns);
  }

  /**
   * Get regression prevention validator
   */
  getRegressionValidator(): RegressionPreventionValidator {
    return this.regressionValidator;
  }

  /**
   * Run comprehensive regression tests
   */
  async runRegressionTests(): Promise<any> {
    const cleaningFunction = async (text: string) => {
      const result = await this.applySpecializedCleaning(text);
      return {
        cleanedText: result.cleanedText,
        confidence: result.confidence,
        processingTime: result.processingTime
      };
    };

    return await this.regressionValidator.runRegressionTests(cleaningFunction);
  }

  /**
   * Update statistics
   */
  private updateStats(processingTime: number, userReportedPatternsFound: number, regressionPrevented: boolean): void {
    this.cleaningStats.totalCleanings++;
    this.cleaningStats.userReportedPatternsRemoved += userReportedPatternsFound;
    
    if (regressionPrevented) {
      this.cleaningStats.regressionsPreventedCount++;
    }

    // Update average processing time
    const totalTime = this.cleaningStats.averageProcessingTime * (this.cleaningStats.totalCleanings - 1) + processingTime;
    this.cleaningStats.averageProcessingTime = totalTime / this.cleaningStats.totalCleanings;
  }

  /**
   * Export configuration for backup or sharing
   */
  exportConfiguration(): string {
    const config = {
      cleaningRules: Array.from(this.cleaningRules.entries()).map(([id, rule]) => ({
        id,
        ...rule,
        pattern: rule.pattern.source, // Convert RegExp to string
        flags: rule.pattern.flags
      })),
      regressionPatterns: Array.from(this.regressionPatterns),
      stats: this.cleaningStats
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from backup
   */
  importConfiguration(configJson: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const config = JSON.parse(configJson);
      const errors: string[] = [];
      let imported = 0;

      // Import cleaning rules
      if (config.cleaningRules) {
        config.cleaningRules.forEach((ruleData: any) => {
          try {
            const rule: SpecializedCleaningRule = {
              ...ruleData,
              pattern: new RegExp(ruleData.pattern, ruleData.flags || 'gi')
            };
            this.cleaningRules.set(rule.id, rule);
            imported++;
          } catch (error) {
            errors.push(`Failed to import rule ${ruleData.id}: ${error.message}`);
          }
        });
      }

      // Import regression patterns
      if (config.regressionPatterns) {
        config.regressionPatterns.forEach((pattern: string) => {
          this.regressionPatterns.add(pattern);
        });
      }

      return { success: errors.length === 0, imported, errors };
    } catch (error) {
      return { success: false, imported: 0, errors: [`Import failed: ${error.message}`] };
    }
  }
}