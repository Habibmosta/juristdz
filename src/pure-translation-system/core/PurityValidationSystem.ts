/**
 * Purity Validation System - Zero Tolerance Language Mixing Detection
 * 
 * Implements comprehensive purity validation with zero tolerance for mixed content.
 * Ensures 100% language purity by detecting and reporting any mixed scripts,
 * corrupted characters, or foreign language fragments.
 */

import {
  PurityValidationResult,
  PurityScore,
  PurityViolation,
  PurityRecommendation,
  ViolationType,
  RecommendationType,
  Severity,
  Priority,
  TextPosition,
  Language,
  PatternType
} from '../types';
import { IPurityValidationSystem } from '../interfaces/PurityValidationSystem';
import { defaultLogger } from '../utils/Logger';
import { pureTranslationConfig } from '../config/PureTranslationConfig';

export class PurityValidationSystem implements IPurityValidationSystem {
  
  // Arabic script Unicode ranges
  private readonly ARABIC_SCRIPT_RANGES = [
    [0x0600, 0x06FF], // Arabic
    [0x0750, 0x077F], // Arabic Supplement
    [0x08A0, 0x08FF], // Arabic Extended-A
    [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
    [0xFE70, 0xFEFF], // Arabic Presentation Forms-B
  ];

  // Latin script Unicode ranges
  private readonly LATIN_SCRIPT_RANGES = [
    [0x0041, 0x005A], // Basic Latin uppercase
    [0x0061, 0x007A], // Basic Latin lowercase
    [0x00C0, 0x00FF], // Latin-1 Supplement
    [0x0100, 0x017F], // Latin Extended-A
    [0x0180, 0x024F], // Latin Extended-B
  ];

  // Cyrillic script Unicode ranges (strictly forbidden)
  private readonly CYRILLIC_SCRIPT_RANGES = [
    [0x0400, 0x04FF], // Cyrillic
    [0x0500, 0x052F], // Cyrillic Supplement
    [0x2DE0, 0x2DFF], // Cyrillic Extended-A
    [0xA640, 0xA69F]  // Cyrillic Extended-B
  ];

  private validationThreshold: number = 1.0; // 100% purity required

  /**
   * Adjust validation thresholds
   */
  async adjustValidationThresholds(threshold: number): Promise<void> {
    this.validationThreshold = threshold;
    defaultLogger.info('Validation thresholds adjusted', {
      newThreshold: threshold
    }, 'PurityValidationSystem');
  }

  // Problematic patterns from user reports
  private readonly PROBLEMATIC_PATTERNS = [
    // User-reported mixed content
    /محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE/gi,
    /الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة/gi,
    
    // Individual problematic elements
    /процедة/gi, // Cyrillic characters
    /Defined/gi, // English UI artifacts
    /AUTO-TRANSLATE/gi, // System artifacts
    /V2/gi, // Version numbers
    /Pro/gi, // Product names
    
    // Mixed script patterns
    /[أ-ي]+[a-zA-Z]+[أ-ي]+/g, // Arabic-Latin-Arabic
    /[a-zA-Z]+[أ-ي]+[a-zA-Z]+/g, // Latin-Arabic-Latin
    /[أ-ي]+[а-яё]+/gi, // Arabic-Cyrillic
    /[а-яё]+[أ-ي]+/gi, // Cyrillic-Arabic
    
    // UI and system artifacts
    /undefined/gi,
    /null/gi,
    /NaN/gi,
    /\[object Object\]/gi,
    
    // Version and build patterns
    /v\d+\.\d+/gi,
    /version\s*\d+/gi,
    /build\s*\d+/gi,
    
    // Common corrupted patterns
    /[^\u0000-\u007F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]/g
  ];

  // Zero tolerance threshold - must be exactly 100%
  private readonly ZERO_TOLERANCE_THRESHOLD = 100;

  constructor() {
    defaultLogger.info('Purity Validation System initialized with zero tolerance policy', {
      threshold: this.ZERO_TOLERANCE_THRESHOLD,
      patternsCount: this.PROBLEMATIC_PATTERNS.length
    }, 'PurityValidationSystem');
  }

  /**
   * Validate text purity with zero tolerance policy
   */
  async validatePurity(text: string, expectedLanguage: Language): Promise<PurityValidationResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Calculate comprehensive purity score
      const purityScore = this.calculatePurityScore(text, expectedLanguage);
      
      // Step 2: Detect all violations
      const violations = this.detectViolations(text, expectedLanguage);
      
      // Step 3: Generate recommendations
      const recommendations = this.generateRecommendations(violations, purityScore);
      
      // Step 4: Apply zero tolerance policy
      const passesZeroTolerance = this.applyZeroTolerancePolicy(purityScore, violations);
      
      const result: PurityValidationResult = {
        isPure: passesZeroTolerance && purityScore.overall === 100,
        purityScore,
        violations,
        recommendations,
        passesZeroTolerance
      };

      const processingTime = Date.now() - startTime;
      
      defaultLogger.info('Purity validation completed', {
        overallScore: purityScore.overall,
        violationsCount: violations.length,
        passesZeroTolerance,
        processingTime
      }, 'PurityValidationSystem');

      return result;
      
    } catch (error) {
      defaultLogger.error('Purity validation failed', { error, textLength: text.length }, 'PurityValidationSystem');
      
      // Return failed validation result
      return {
        isPure: false,
        purityScore: {
          overall: 0,
          scriptPurity: 0,
          terminologyConsistency: 0,
          encodingIntegrity: 0,
          contextualCoherence: 0,
          uiElementsRemoved: 0
        },
        violations: [{
          type: ViolationType.ENCODING_ERROR,
          position: { start: 0, end: text.length },
          content: 'Validation system error',
          severity: Severity.CRITICAL,
          suggestedFix: 'System error - please retry',
          confidence: 1.0
        }],
        recommendations: [],
        passesZeroTolerance: false
      };
    }
  }

  /**
   * Calculate comprehensive purity score
   */
  private calculatePurityScore(text: string, expectedLanguage: Language): PurityScore {
    const scriptPurity = this.calculateScriptPurity(text, expectedLanguage);
    const terminologyConsistency = this.calculateTerminologyConsistency(text);
    const encodingIntegrity = this.calculateEncodingIntegrity(text);
    const contextualCoherence = this.calculateContextualCoherence(text, expectedLanguage);
    const uiElementsRemoved = this.calculateUIElementsScore(text);

    // Overall score is the minimum of all components (zero tolerance)
    const overall = Math.min(
      scriptPurity,
      terminologyConsistency,
      encodingIntegrity,
      contextualCoherence,
      uiElementsRemoved
    );

    return {
      overall,
      scriptPurity,
      terminologyConsistency,
      encodingIntegrity,
      contextualCoherence,
      uiElementsRemoved
    };
  }

  /**
   * Calculate script purity (Arabic vs Latin vs Other)
   */
  private calculateScriptPurity(text: string, expectedLanguage: Language): number {
    if (!text || text.trim().length === 0) return 100;

    let arabicChars = 0;
    let latinChars = 0;
    let cyrillicChars = 0;
    let otherChars = 0;
    let totalChars = 0;

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      
      // Skip whitespace and punctuation
      if (charCode <= 32 || (charCode >= 33 && charCode <= 47) || 
          (charCode >= 58 && charCode <= 64) || (charCode >= 91 && charCode <= 96) ||
          (charCode >= 123 && charCode <= 126)) {
        continue;
      }

      totalChars++;

      if (this.isArabicScript(charCode)) {
        arabicChars++;
      } else if (this.isLatinScript(charCode)) {
        latinChars++;
      } else if (this.isCyrillicScript(charCode)) {
        cyrillicChars++;
      } else {
        otherChars++;
      }
    }

    if (totalChars === 0) return 100;

    // Zero tolerance for Cyrillic characters
    if (cyrillicChars > 0) {
      return 0;
    }

    // Calculate purity based on expected language
    if (expectedLanguage === Language.ARABIC) {
      // For Arabic, allow some Latin for numbers and technical terms, but Arabic should dominate
      const arabicPercentage = (arabicChars / totalChars) * 100;
      const latinPercentage = (latinChars / totalChars) * 100;
      
      // Zero tolerance: Arabic text should be at least 80% Arabic script
      if (arabicPercentage < 80 && latinPercentage > 20) {
        return 0;
      }
      
      return arabicPercentage >= 90 ? 100 : Math.max(0, arabicPercentage);
    } else {
      // For French, should be primarily Latin script
      const latinPercentage = (latinChars / totalChars) * 100;
      const arabicPercentage = (arabicChars / totalChars) * 100;
      
      // Zero tolerance: French text should be at least 80% Latin script
      if (latinPercentage < 80 && arabicPercentage > 20) {
        return 0;
      }
      
      return latinPercentage >= 90 ? 100 : Math.max(0, latinPercentage);
    }
  }

  /**
   * Calculate terminology consistency score
   */
  private calculateTerminologyConsistency(text: string): number {
    // For now, return 100 if no obvious inconsistencies
    // This would be enhanced with actual terminology validation
    const hasInconsistentTerms = this.PROBLEMATIC_PATTERNS.some(pattern => pattern.test(text));
    return hasInconsistentTerms ? 0 : 100;
  }

  /**
   * Calculate encoding integrity score
   */
  private calculateEncodingIntegrity(text: string): number {
    // Check for corrupted characters and encoding issues
    let corruptedChars = 0;
    let totalChars = text.length;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charCode = text.charCodeAt(i);

      // Check for replacement characters (indicates encoding issues)
      if (charCode === 0xFFFD) {
        corruptedChars++;
      }

      // Check for control characters (except common whitespace)
      if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
        corruptedChars++;
      }

      // Check for suspicious character combinations
      if (this.isSuspiciousCharacter(char)) {
        corruptedChars++;
      }
    }

    if (totalChars === 0) return 100;
    
    const integrityPercentage = ((totalChars - corruptedChars) / totalChars) * 100;
    
    // Zero tolerance for corrupted characters
    return corruptedChars > 0 ? 0 : 100;
  }

  /**
   * Calculate contextual coherence score
   */
  private calculateContextualCoherence(text: string, expectedLanguage: Language): number {
    // Check for contextual coherence issues
    let coherenceIssues = 0;

    // Check for mixed language patterns
    const mixedPatterns = [
      /[أ-ي]+\s+[a-zA-Z]+\s+[أ-ي]+/g, // Arabic word Latin word Arabic word
      /[a-zA-Z]+\s+[أ-ي]+\s+[a-zA-Z]+/g, // Latin word Arabic word Latin word
    ];

    mixedPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        coherenceIssues += matches.length;
      }
    });

    // Zero tolerance for coherence issues
    return coherenceIssues > 0 ? 0 : 100;
  }

  /**
   * Calculate UI elements removal score
   */
  private calculateUIElementsScore(text: string): number {
    let uiElements = 0;

    // Check for UI artifacts
    const uiPatterns = [
      /undefined/gi,
      /null/gi,
      /NaN/gi,
      /\[object Object\]/gi,
      /AUTO-TRANSLATE/gi,
      /Defined/gi,
      /Pro/gi,
      /V2/gi
    ];

    uiPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        uiElements += matches.length;
      }
    });

    // Zero tolerance for UI elements
    return uiElements > 0 ? 0 : 100;
  }

  /**
   * Detect all purity violations
   */
  private detectViolations(text: string, expectedLanguage: Language): PurityViolation[] {
    const violations: PurityViolation[] = [];

    // Check for problematic patterns
    this.PROBLEMATIC_PATTERNS.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        violations.push({
          type: this.getViolationTypeFromPattern(pattern),
          position: { start: match.index, end: match.index + match[0].length },
          content: match[0],
          severity: Severity.CRITICAL,
          suggestedFix: this.getSuggestedFix(match[0], expectedLanguage),
          confidence: 1.0
        });
      }
    });

    // Check for script mixing
    const scriptViolations = this.detectScriptMixing(text, expectedLanguage);
    violations.push(...scriptViolations);

    // Check for Cyrillic characters (zero tolerance)
    const cyrillicViolations = this.detectCyrillicCharacters(text);
    violations.push(...cyrillicViolations);

    // Check for encoding issues
    const encodingViolations = this.detectEncodingIssues(text);
    violations.push(...encodingViolations);

    return violations;
  }

  /**
   * Detect script mixing violations
   */
  private detectScriptMixing(text: string, expectedLanguage: Language): PurityViolation[] {
    const violations: PurityViolation[] = [];
    let currentScript: 'arabic' | 'latin' | 'other' | null = null;
    let scriptChangePositions: number[] = [];

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      let charScript: 'arabic' | 'latin' | 'other' | null = null;

      if (this.isArabicScript(charCode)) {
        charScript = 'arabic';
      } else if (this.isLatinScript(charCode)) {
        charScript = 'latin';
      } else if (charCode > 32) { // Ignore whitespace
        charScript = 'other';
      }

      if (charScript && charScript !== currentScript) {
        if (currentScript !== null) {
          scriptChangePositions.push(i);
        }
        currentScript = charScript;
      }
    }

    // If we have script changes, create violations
    if (scriptChangePositions.length > 0) {
      scriptChangePositions.forEach(position => {
        violations.push({
          type: ViolationType.MIXED_SCRIPTS,
          position: { start: Math.max(0, position - 5), end: Math.min(text.length, position + 5) },
          content: text.substring(Math.max(0, position - 5), Math.min(text.length, position + 5)),
          severity: Severity.CRITICAL,
          suggestedFix: 'Remove mixed script content',
          confidence: 0.9
        });
      });
    }

    return violations;
  }

  /**
   * Detect Cyrillic characters (zero tolerance)
   */
  private detectCyrillicCharacters(text: string): PurityViolation[] {
    const violations: PurityViolation[] = [];

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      if (this.isCyrillicScript(charCode)) {
        violations.push({
          type: ViolationType.CYRILLIC_CHARACTERS,
          position: { start: i, end: i + 1 },
          content: text[i],
          severity: Severity.CRITICAL,
          suggestedFix: 'Remove Cyrillic character',
          confidence: 1.0
        });
      }
    }

    return violations;
  }

  /**
   * Detect encoding issues
   */
  private detectEncodingIssues(text: string): PurityViolation[] {
    const violations: PurityViolation[] = [];

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      
      // Check for replacement characters
      if (charCode === 0xFFFD) {
        violations.push({
          type: ViolationType.ENCODING_ERROR,
          position: { start: i, end: i + 1 },
          content: text[i],
          severity: Severity.CRITICAL,
          suggestedFix: 'Fix character encoding',
          confidence: 1.0
        });
      }
    }

    return violations;
  }

  /**
   * Generate recommendations based on violations
   */
  private generateRecommendations(
    violations: PurityViolation[], 
    purityScore: PurityScore
  ): PurityRecommendation[] {
    const recommendations: PurityRecommendation[] = [];

    if (purityScore.overall < 100) {
      recommendations.push({
        type: RecommendationType.CONTENT_CLEANING,
        description: 'Apply aggressive content cleaning to achieve 100% purity',
        action: 'Use ContentCleaner with aggressive settings',
        priority: Priority.URGENT
      });
    }

    if (violations.some(v => v.type === ViolationType.CYRILLIC_CHARACTERS)) {
      recommendations.push({
        type: RecommendationType.CONTENT_CLEANING,
        description: 'Remove all Cyrillic characters (zero tolerance policy)',
        action: 'Apply Cyrillic character removal filter',
        priority: Priority.URGENT
      });
    }

    if (violations.some(v => v.type === ViolationType.MIXED_SCRIPTS)) {
      recommendations.push({
        type: RecommendationType.CONTENT_CLEANING,
        description: 'Resolve mixed script issues',
        action: 'Separate content by language or apply script-specific cleaning',
        priority: Priority.HIGH
      });
    }

    if (violations.some(v => v.type === ViolationType.ENCODING_ERROR)) {
      recommendations.push({
        type: RecommendationType.ENCODING_FIX,
        description: 'Fix character encoding issues',
        action: 'Apply encoding normalization and validation',
        priority: Priority.HIGH
      });
    }

    return recommendations;
  }

  /**
   * Apply zero tolerance policy
   */
  private applyZeroTolerancePolicy(purityScore: PurityScore, violations: PurityViolation[]): boolean {
    const config = pureTranslationConfig.getConfig();
    
    if (!config.zeroToleranceEnabled) {
      return purityScore.overall >= config.minimumPurityScore;
    }

    // Zero tolerance: must be exactly 100% pure with no violations
    return purityScore.overall === 100 && violations.length === 0;
  }

  /**
   * Helper methods for character script detection
   */
  private isArabicScript(charCode: number): boolean {
    return this.ARABIC_SCRIPT_RANGES.some(([start, end]) => charCode >= start && charCode <= end);
  }

  private isLatinScript(charCode: number): boolean {
    return this.LATIN_SCRIPT_RANGES.some(([start, end]) => charCode >= start && charCode <= end);
  }

  private isCyrillicScript(charCode: number): boolean {
    return this.CYRILLIC_SCRIPT_RANGES.some(([start, end]) => charCode >= start && charCode <= end);
  }

  private isSuspiciousCharacter(char: string): boolean {
    // Check for characters that commonly indicate corruption
    const suspiciousChars = ['�', '?', '\uFFFD'];
    return suspiciousChars.includes(char);
  }

  /**
   * Get violation type from pattern
   */
  private getViolationTypeFromPattern(pattern: RegExp): ViolationType {
    const patternStr = pattern.toString();
    
    if (patternStr.includes('процедة') || patternStr.includes('[а-яё]')) {
      return ViolationType.CYRILLIC_CHARACTERS;
    }
    
    if (patternStr.includes('Defined') || patternStr.includes('AUTO-TRANSLATE')) {
      return ViolationType.UI_ARTIFACTS;
    }
    
    if (patternStr.includes('[أ-ي]+[a-zA-Z]+')) {
      return ViolationType.MIXED_SCRIPTS;
    }
    
    return ViolationType.FOREIGN_FRAGMENTS;
  }

  /**
   * Get suggested fix for violation
   */
  private getSuggestedFix(content: string, expectedLanguage: Language): string {
    if (content.includes('процедة')) {
      return 'Replace with: إجراء';
    }
    
    if (content.includes('Defined')) {
      return 'Remove UI artifact';
    }
    
    if (content.includes('AUTO-TRANSLATE')) {
      return 'Remove system artifact';
    }
    
    return expectedLanguage === Language.ARABIC 
      ? 'Replace with appropriate Arabic content'
      : 'Replace with appropriate French content';
  }

  /**
   * Quick purity check (optimized for performance)
   */
  async quickPurityCheck(text: string, expectedLanguage: Language): Promise<boolean> {
    // Fast check for obvious violations
    const hasCyrillic = /[а-яё]/gi.test(text);
    if (hasCyrillic) return false;

    const hasProblematicPatterns = this.PROBLEMATIC_PATTERNS.some(pattern => pattern.test(text));
    if (hasProblematicPatterns) return false;

    // Quick script ratio check
    const scriptPurity = this.calculateScriptPurity(text, expectedLanguage);
    return scriptPurity === 100;
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    totalPatterns: number;
    zeroToleranceEnabled: boolean;
    threshold: number;
  } {
    return {
      totalPatterns: this.PROBLEMATIC_PATTERNS.length,
      zeroToleranceEnabled: pureTranslationConfig.isZeroToleranceEnabled(),
      threshold: this.ZERO_TOLERANCE_THRESHOLD
    };
  }
}