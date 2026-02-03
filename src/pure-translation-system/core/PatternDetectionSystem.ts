/**
 * Pattern Detection and Blacklist Management System
 * 
 * Proactive detection of problematic patterns before translation,
 * dynamic blacklist management, and enhanced cleaning procedures
 * for risky content to prevent language mixing issues.
 */

import {
  ProblematicPattern,
  PatternType,
  Severity,
  CleaningActionType,
  Language,
  TextPosition
} from '../types';
import { defaultLogger } from '../utils/Logger';
import { pureTranslationConfig } from '../config/PureTranslationConfig';

export interface PatternDetectionResult {
  hasProblematicPatterns: boolean;
  detectedPatterns: ProblematicPattern[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: string[];
  confidence: number;
}

export interface BlacklistEntry {
  id: string;
  pattern: string | RegExp;
  type: PatternType;
  severity: Severity;
  description: string;
  addedDate: Date;
  lastDetected?: Date;
  detectionCount: number;
  isActive: boolean;
  source: 'user_report' | 'system_detection' | 'manual_addition';
}

export class PatternDetectionSystem {
  private blacklist: Map<string, BlacklistEntry> = new Map();
  private patternCache: Map<string, PatternDetectionResult> = new Map();
  private readonly maxCacheSize = 5000;
  
  // Pre-compiled regex patterns for performance
  private compiledPatterns: Map<string, RegExp> = new Map();
  
  // Pattern categories for organized detection
  private readonly patternCategories = {
    cyrillic: [
      /[а-яё]+/gi,
      /процедة/gi,
      /[а-я][أ-ي]/gi, // Cyrillic followed by Arabic
      /[أ-ي][а-я]/gi  // Arabic followed by Cyrillic
    ],
    
    uiArtifacts: [
      /undefined/gi,
      /null/gi,
      /NaN/gi,
      /\[object Object\]/gi,
      /Defined/gi,
      /AUTO-TRANSLATE/gi,
      /Pro/gi,
      /V2/gi,
      /version\s*\d+/gi,
      /build\s*\d+/gi
    ],
    
    mixedScripts: [
      /[أ-ي]+[a-zA-Z]+[أ-ي]+/g, // Arabic-Latin-Arabic
      /[a-zA-Z]+[أ-ي]+[a-zA-Z]+/g, // Latin-Arabic-Latin
      /[أ-ي]+\s+[a-zA-Z]+\s+[أ-ي]+/g, // Arabic word Latin word Arabic word
      /[a-zA-Z]+\s+[أ-ي]+\s+[a-zA-Z]+/g // Latin word Arabic word Latin word
    ],
    
    userReported: [
      /محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE/gi,
      /الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة/gi
    ],
    
    encodingIssues: [
      /\uFFFD/g, // Replacement character
      /[^\u0000-\u007F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]/g
    ]
  };

  constructor() {
    this.initializeBlacklist();
    this.compilePatterns();
    
    defaultLogger.info('Pattern Detection System initialized', {
      blacklistSize: this.blacklist.size,
      patternCategories: Object.keys(this.patternCategories).length,
      compiledPatterns: this.compiledPatterns.size
    }, 'PatternDetectionSystem');
  }

  /**
   * Initialize blacklist with known problematic patterns
   */
  private initializeBlacklist(): void {
    // Add Cyrillic patterns
    this.patternCategories.cyrillic.forEach((pattern, index) => {
      this.addToBlacklist({
        pattern,
        type: PatternType.CYRILLIC_CHARACTERS,
        severity: Severity.CRITICAL,
        description: `Cyrillic character pattern ${index + 1}`,
        source: 'system_detection'
      });
    });

    // Add UI artifact patterns
    this.patternCategories.uiArtifacts.forEach((pattern, index) => {
      this.addToBlacklist({
        pattern,
        type: PatternType.UI_ARTIFACTS,
        severity: Severity.HIGH,
        description: `UI artifact pattern ${index + 1}`,
        source: 'system_detection'
      });
    });

    // Add mixed script patterns
    this.patternCategories.mixedScripts.forEach((pattern, index) => {
      this.addToBlacklist({
        pattern,
        type: PatternType.MIXED_SCRIPTS,
        severity: Severity.CRITICAL,
        description: `Mixed script pattern ${index + 1}`,
        source: 'system_detection'
      });
    });

    // Add user-reported patterns
    this.patternCategories.userReported.forEach((pattern, index) => {
      this.addToBlacklist({
        pattern,
        type: PatternType.USER_REPORTED,
        severity: Severity.CRITICAL,
        description: `User-reported problematic content ${index + 1}`,
        source: 'user_report'
      });
    });

    // Add encoding issue patterns
    this.patternCategories.encodingIssues.forEach((pattern, index) => {
      this.addToBlacklist({
        pattern,
        type: PatternType.CORRUPTED_ENCODING,
        severity: Severity.HIGH,
        description: `Encoding issue pattern ${index + 1}`,
        source: 'system_detection'
      });
    });
  }

  /**
   * Compile patterns for performance optimization
   */
  private compilePatterns(): void {
    this.blacklist.forEach((entry, id) => {
      if (typeof entry.pattern === 'string') {
        try {
          // Convert string patterns to regex with global flag
          const regexPattern = new RegExp(entry.pattern, 'gi');
          this.compiledPatterns.set(id, regexPattern);
        } catch (error) {
          defaultLogger.warn('Failed to compile pattern', {
            patternId: id,
            pattern: entry.pattern,
            error: error.message
          }, 'PatternDetectionSystem');
        }
      } else {
        this.compiledPatterns.set(id, entry.pattern);
      }
    });
  }

  /**
   * Detect problematic patterns in text before translation
   */
  async detectProblematicPatterns(text: string, language?: Language): Promise<PatternDetectionResult> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(text, language);
    if (this.patternCache.has(cacheKey)) {
      return this.patternCache.get(cacheKey)!;
    }

    try {
      const detectedPatterns: ProblematicPattern[] = [];
      let highestSeverity: Severity = Severity.INFO;

      // Scan text with all active blacklist patterns
      for (const [id, entry] of this.blacklist) {
        if (!entry.isActive) continue;

        const pattern = this.compiledPatterns.get(id);
        if (!pattern) continue;

        const matches = this.findPatternMatches(text, pattern);
        
        if (matches.length > 0) {
          // Update detection statistics
          entry.lastDetected = new Date();
          entry.detectionCount += matches.length;

          // Create problematic pattern entries
          matches.forEach(match => {
            detectedPatterns.push({
              pattern: match.content,
              type: entry.type,
              position: match.position,
              severity: entry.severity,
              action: this.getRecommendedAction(entry.type, entry.severity)
            });
          });

          // Track highest severity
          if (this.getSeverityLevel(entry.severity) > this.getSeverityLevel(highestSeverity)) {
            highestSeverity = entry.severity;
          }
        }
      }

      // Calculate risk level and confidence
      const riskLevel = this.calculateRiskLevel(detectedPatterns, highestSeverity);
      const confidence = this.calculateConfidence(detectedPatterns, text.length);
      const recommendedActions = this.generateRecommendedActions(detectedPatterns, riskLevel);

      const result: PatternDetectionResult = {
        hasProblematicPatterns: detectedPatterns.length > 0,
        detectedPatterns,
        riskLevel,
        recommendedActions,
        confidence
      };

      // Cache the result
      this.cacheResult(cacheKey, result);

      const processingTime = Date.now() - startTime;
      
      defaultLogger.debug('Pattern detection completed', {
        textLength: text.length,
        patternsDetected: detectedPatterns.length,
        riskLevel,
        confidence,
        processingTime
      }, 'PatternDetectionSystem');

      return result;

    } catch (error) {
      defaultLogger.error('Pattern detection failed', {
        error: error.message,
        textLength: text.length
      }, 'PatternDetectionSystem');

      // Return safe default result
      return {
        hasProblematicPatterns: true, // Assume problematic for safety
        detectedPatterns: [],
        riskLevel: 'high',
        recommendedActions: ['Apply aggressive content cleaning'],
        confidence: 0.5
      };
    }
  }

  /**
   * Add pattern to blacklist
   */
  addToBlacklist(config: {
    pattern: string | RegExp;
    type: PatternType;
    severity: Severity;
    description: string;
    source: 'user_report' | 'system_detection' | 'manual_addition';
  }): string {
    const id = this.generateBlacklistId();
    
    const entry: BlacklistEntry = {
      id,
      pattern: config.pattern,
      type: config.type,
      severity: config.severity,
      description: config.description,
      addedDate: new Date(),
      detectionCount: 0,
      isActive: true,
      source: config.source
    };

    this.blacklist.set(id, entry);
    
    // Compile the new pattern
    if (typeof config.pattern === 'string') {
      try {
        const regexPattern = new RegExp(config.pattern, 'gi');
        this.compiledPatterns.set(id, regexPattern);
      } catch (error) {
        defaultLogger.warn('Failed to compile new pattern', {
          patternId: id,
          error: error.message
        }, 'PatternDetectionSystem');
      }
    } else {
      this.compiledPatterns.set(id, config.pattern);
    }

    // Clear cache to ensure new pattern is used
    this.patternCache.clear();

    defaultLogger.info('Pattern added to blacklist', {
      patternId: id,
      type: config.type,
      severity: config.severity,
      source: config.source
    }, 'PatternDetectionSystem');

    return id;
  }

  /**
   * Remove pattern from blacklist
   */
  removeFromBlacklist(patternId: string): boolean {
    const entry = this.blacklist.get(patternId);
    if (!entry) {
      return false;
    }

    this.blacklist.delete(patternId);
    this.compiledPatterns.delete(patternId);
    this.patternCache.clear(); // Clear cache

    defaultLogger.info('Pattern removed from blacklist', {
      patternId,
      type: entry.type,
      detectionCount: entry.detectionCount
    }, 'PatternDetectionSystem');

    return true;
  }

  /**
   * Update pattern in blacklist
   */
  updateBlacklistEntry(patternId: string, updates: Partial<BlacklistEntry>): boolean {
    const entry = this.blacklist.get(patternId);
    if (!entry) {
      return false;
    }

    // Update entry
    Object.assign(entry, updates);

    // Recompile pattern if it was changed
    if (updates.pattern) {
      if (typeof updates.pattern === 'string') {
        try {
          const regexPattern = new RegExp(updates.pattern, 'gi');
          this.compiledPatterns.set(patternId, regexPattern);
        } catch (error) {
          defaultLogger.warn('Failed to recompile updated pattern', {
            patternId,
            error: error.message
          }, 'PatternDetectionSystem');
          return false;
        }
      } else {
        this.compiledPatterns.set(patternId, updates.pattern);
      }
    }

    this.patternCache.clear(); // Clear cache

    defaultLogger.info('Blacklist entry updated', {
      patternId,
      updates: Object.keys(updates)
    }, 'PatternDetectionSystem');

    return true;
  }

  /**
   * Get enhanced cleaning procedures for risky content
   */
  getEnhancedCleaningProcedures(detectionResult: PatternDetectionResult): {
    procedures: string[];
    aggressiveMode: boolean;
    customPatterns: (string | RegExp)[];
  } {
    const procedures: string[] = [];
    const customPatterns: (string | RegExp)[] = [];
    let aggressiveMode = false;

    if (detectionResult.riskLevel === 'critical') {
      aggressiveMode = true;
      procedures.push('Apply zero-tolerance cleaning');
      procedures.push('Remove all detected problematic patterns');
      procedures.push('Validate encoding integrity');
      procedures.push('Apply script separation');
    }

    if (detectionResult.riskLevel === 'high') {
      procedures.push('Apply enhanced pattern removal');
      procedures.push('Normalize character encoding');
      procedures.push('Remove UI artifacts');
    }

    // Add specific patterns for targeted cleaning
    detectionResult.detectedPatterns.forEach(pattern => {
      if (pattern.type === PatternType.CYRILLIC_CHARACTERS) {
        customPatterns.push(/[а-яё]+/gi);
        procedures.push('Remove all Cyrillic characters');
      }
      
      if (pattern.type === PatternType.UI_ARTIFACTS) {
        customPatterns.push(/undefined|null|NaN|\[object Object\]/gi);
        procedures.push('Remove UI artifacts and system messages');
      }
      
      if (pattern.type === PatternType.MIXED_SCRIPTS) {
        customPatterns.push(/[أ-ي]+[a-zA-Z]+|[a-zA-Z]+[أ-ي]+/g);
        procedures.push('Separate mixed script content');
      }
    });

    return {
      procedures,
      aggressiveMode,
      customPatterns
    };
  }

  /**
   * Report new problematic pattern from user feedback
   */
  reportProblematicPattern(
    text: string,
    description: string,
    severity: Severity = Severity.HIGH
  ): string {
    // Analyze the text to extract the problematic pattern
    const extractedPattern = this.extractProblematicPattern(text);
    
    const patternId = this.addToBlacklist({
      pattern: extractedPattern,
      type: PatternType.USER_REPORTED,
      severity,
      description: `User reported: ${description}`,
      source: 'user_report'
    });

    defaultLogger.info('User reported problematic pattern', {
      patternId,
      originalText: text.substring(0, 100),
      extractedPattern: extractedPattern.toString(),
      description
    }, 'PatternDetectionSystem');

    return patternId;
  }

  /**
   * Get blacklist statistics
   */
  getBlacklistStats(): {
    totalPatterns: number;
    activePatterns: number;
    patternsByType: { [key: string]: number };
    patternsBySeverity: { [key: string]: number };
    topDetectedPatterns: { id: string; count: number; description: string }[];
  } {
    const stats = {
      totalPatterns: this.blacklist.size,
      activePatterns: 0,
      patternsByType: {} as { [key: string]: number },
      patternsBySeverity: {} as { [key: string]: number },
      topDetectedPatterns: [] as { id: string; count: number; description: string }[]
    };

    // Calculate statistics
    const detectionCounts: { id: string; count: number; description: string }[] = [];

    this.blacklist.forEach((entry, id) => {
      if (entry.isActive) {
        stats.activePatterns++;
      }

      // Count by type
      stats.patternsByType[entry.type] = (stats.patternsByType[entry.type] || 0) + 1;

      // Count by severity
      stats.patternsBySeverity[entry.severity] = (stats.patternsBySeverity[entry.severity] || 0) + 1;

      // Track detection counts
      if (entry.detectionCount > 0) {
        detectionCounts.push({
          id,
          count: entry.detectionCount,
          description: entry.description
        });
      }
    });

    // Sort by detection count and take top 10
    stats.topDetectedPatterns = detectionCounts
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  /**
   * Helper methods
   */
  private findPatternMatches(text: string, pattern: RegExp): { content: string; position: TextPosition }[] {
    const matches: { content: string; position: TextPosition }[] = [];
    let match;

    // Reset regex lastIndex to ensure proper matching
    pattern.lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      matches.push({
        content: match[0],
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      });

      // Prevent infinite loop for zero-length matches
      if (match[0].length === 0) {
        pattern.lastIndex++;
      }
    }

    return matches;
  }

  private calculateRiskLevel(
    patterns: ProblematicPattern[],
    highestSeverity: Severity
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (patterns.length === 0) return 'low';

    const criticalPatterns = patterns.filter(p => p.severity === Severity.CRITICAL);
    const highPatterns = patterns.filter(p => p.severity === Severity.HIGH);

    if (criticalPatterns.length > 0 || highestSeverity === Severity.CRITICAL) {
      return 'critical';
    }

    if (highPatterns.length > 2 || highestSeverity === Severity.HIGH) {
      return 'high';
    }

    if (patterns.length > 3) {
      return 'medium';
    }

    return 'low';
  }

  private calculateConfidence(patterns: ProblematicPattern[], textLength: number): number {
    if (patterns.length === 0) return 1.0;

    // Base confidence on pattern density and severity
    const patternDensity = patterns.length / Math.max(textLength / 100, 1);
    const severityWeight = patterns.reduce((sum, p) => sum + this.getSeverityLevel(p.severity), 0);
    
    const confidence = Math.min(1.0, 0.5 + (patternDensity * 0.2) + (severityWeight * 0.1));
    return Math.round(confidence * 100) / 100;
  }

  private generateRecommendedActions(
    patterns: ProblematicPattern[],
    riskLevel: string
  ): string[] {
    const actions: string[] = [];

    if (riskLevel === 'critical') {
      actions.push('Apply zero-tolerance cleaning immediately');
      actions.push('Block translation until content is cleaned');
      actions.push('Generate emergency fallback content');
    }

    if (patterns.some(p => p.type === PatternType.CYRILLIC_CHARACTERS)) {
      actions.push('Remove all Cyrillic characters');
    }

    if (patterns.some(p => p.type === PatternType.UI_ARTIFACTS)) {
      actions.push('Remove UI artifacts and system messages');
    }

    if (patterns.some(p => p.type === PatternType.MIXED_SCRIPTS)) {
      actions.push('Apply script separation and cleaning');
    }

    if (patterns.some(p => p.type === PatternType.CORRUPTED_ENCODING)) {
      actions.push('Fix character encoding issues');
    }

    if (actions.length === 0) {
      actions.push('Apply standard content cleaning');
    }

    return actions;
  }

  private getRecommendedAction(type: PatternType, severity: Severity): CleaningActionType {
    if (severity === Severity.CRITICAL) {
      return CleaningActionType.REMOVE;
    }

    switch (type) {
      case PatternType.CYRILLIC_CHARACTERS:
      case PatternType.UI_ARTIFACTS:
        return CleaningActionType.REMOVE;
      case PatternType.MIXED_SCRIPTS:
        return CleaningActionType.CLEAN;
      case PatternType.CORRUPTED_ENCODING:
        return CleaningActionType.NORMALIZE;
      default:
        return CleaningActionType.FILTER;
    }
  }

  private getSeverityLevel(severity: Severity): number {
    switch (severity) {
      case Severity.CRITICAL: return 4;
      case Severity.HIGH: return 3;
      case Severity.MEDIUM: return 2;
      case Severity.LOW: return 1;
      default: return 0;
    }
  }

  private extractProblematicPattern(text: string): RegExp {
    // Simple pattern extraction - escape special regex characters
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escapedText, 'gi');
  }

  private generateBlacklistId(): string {
    return `bl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(text: string, language?: Language): string {
    const textHash = this.hashText(text);
    return `${textHash}_${language || 'any'}`;
  }

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private cacheResult(key: string, result: PatternDetectionResult): void {
    if (this.patternCache.size >= this.maxCacheSize) {
      const firstKey = this.patternCache.keys().next().value;
      this.patternCache.delete(firstKey);
    }
    this.patternCache.set(key, result);
  }

  /**
   * Public utility methods
   */
  public clearCache(): void {
    this.patternCache.clear();
    defaultLogger.info('Pattern detection cache cleared', {}, 'PatternDetectionSystem');
  }

  public exportBlacklist(): string {
    const exportData = Array.from(this.blacklist.entries()).map(([id, entry]) => ({
      id,
      ...entry,
      pattern: entry.pattern.toString() // Convert RegExp to string for serialization
    }));
    
    return JSON.stringify(exportData, null, 2);
  }

  public importBlacklist(jsonData: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const importData = JSON.parse(jsonData);
      const errors: string[] = [];
      let imported = 0;

      importData.forEach((item: any) => {
        try {
          // Reconstruct pattern from string if needed
          let pattern = item.pattern;
          if (typeof pattern === 'string' && pattern.startsWith('/') && pattern.includes('/')) {
            // Extract regex pattern and flags
            const lastSlash = pattern.lastIndexOf('/');
            const patternStr = pattern.slice(1, lastSlash);
            const flags = pattern.slice(lastSlash + 1);
            pattern = new RegExp(patternStr, flags);
          }

          this.addToBlacklist({
            pattern,
            type: item.type,
            severity: item.severity,
            description: item.description,
            source: item.source || 'manual_addition'
          });
          
          imported++;
        } catch (error) {
          errors.push(`Failed to import pattern ${item.id}: ${error.message}`);
        }
      });

      return { success: errors.length === 0, imported, errors };
    } catch (error) {
      return { success: false, imported: 0, errors: [`Import failed: ${error.message}`] };
    }
  }
}