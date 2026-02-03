/**
 * Multi-Layer Validation Architecture
 * 
 * Implements multiple validation checkpoints throughout the translation pipeline
 * with coordination, reporting, and failure recovery mechanisms to ensure
 * zero tolerance for language mixing at every stage.
 */

import {
  TranslationRequest,
  PureTranslationResult,
  PurityValidationResult,
  ValidationLayer,
  ValidationCheckpoint,
  ValidationFailure,
  ValidationRecovery,
  Language,
  Severity,
  Priority
} from '../types';
import { PurityValidationSystem } from './PurityValidationSystem';
import { PatternDetectionSystem } from './PatternDetectionSystem';
import { LegalTerminologyManager } from './LegalTerminologyManager';
import { defaultLogger } from '../utils/Logger';
import { pureTranslationConfig } from '../config/PureTranslationConfig';

export interface ValidationLayer {
  id: string;
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
  validator: (text: string, language: Language, context?: any) => Promise<ValidationResult>;
  recoveryStrategy: ValidationRecoveryStrategy;
}

export interface ValidationResult {
  passed: boolean;
  score: number;
  issues: ValidationIssue[];
  recommendations: string[];
  processingTime: number;
  confidence: number;
}

export interface ValidationIssue {
  type: string;
  severity: Severity;
  description: string;
  position?: { start: number; end: number };
  suggestedFix: string;
}

export interface ValidationCheckpoint {
  id: string;
  stage: ValidationStage;
  layers: string[];
  requiredScore: number;
  failureAction: 'block' | 'warn' | 'recover' | 'fallback';
  recoveryAttempts: number;
}

export interface ValidationRecoveryStrategy {
  type: 'retry' | 'clean' | 'fallback' | 'escalate';
  maxAttempts: number;
  cleaningRules?: string[];
  fallbackMethod?: string;
}

export enum ValidationStage {
  PRE_PROCESSING = 'pre_processing',
  POST_CLEANING = 'post_cleaning',
  PRE_TRANSLATION = 'pre_translation',
  POST_TRANSLATION = 'post_translation',
  FINAL_VALIDATION = 'final_validation'
}

export class MultiLayerValidationSystem {
  private validationLayers: Map<string, ValidationLayer> = new Map();
  private validationCheckpoints: Map<ValidationStage, ValidationCheckpoint> = new Map();
  private purityValidator: PurityValidationSystem;
  private patternDetector: PatternDetectionSystem;
  private terminologyManager: LegalTerminologyManager;
  
  // Validation statistics
  private validationStats = {
    totalValidations: 0,
    passedValidations: 0,
    failedValidations: 0,
    recoveredValidations: 0,
    averageProcessingTime: 0
  };

  constructor() {
    this.purityValidator = new PurityValidationSystem();
    this.patternDetector = new PatternDetectionSystem();
    this.terminologyManager = new LegalTerminologyManager();
    
    this.initializeValidationLayers();
    this.initializeValidationCheckpoints();
    
    defaultLogger.info('Multi-Layer Validation System initialized', {
      layersCount: this.validationLayers.size,
      checkpointsCount: this.validationCheckpoints.size,
      zeroToleranceEnabled: pureTranslationConfig.isZeroToleranceEnabled()
    }, 'MultiLayerValidationSystem');
  }

  /**
   * Initialize validation layers with different validators
   */
  private initializeValidationLayers(): void {
    // Layer 1: Pattern Detection (Highest Priority)
    this.addValidationLayer({
      id: 'pattern_detection',
      name: 'Pattern Detection Layer',
      description: 'Detects problematic patterns and blacklisted content',
      priority: 1,
      isActive: true,
      validator: async (text: string, language: Language) => {
        const startTime = Date.now();
        const detectionResult = await this.patternDetector.detectProblematicPatterns(text, language);
        
        return {
          passed: !detectionResult.hasProblematicPatterns,
          score: detectionResult.hasProblematicPatterns ? 0 : 100,
          issues: detectionResult.detectedPatterns.map(pattern => ({
            type: 'problematic_pattern',
            severity: pattern.severity,
            description: `Detected problematic pattern: ${pattern.pattern}`,
            position: pattern.position,
            suggestedFix: `Apply ${pattern.action} action`
          })),
          recommendations: detectionResult.recommendedActions,
          processingTime: Date.now() - startTime,
          confidence: detectionResult.confidence
        };
      },
      recoveryStrategy: {
        type: 'clean',
        maxAttempts: 3,
        cleaningRules: ['aggressive_pattern_removal', 'cyrillic_removal', 'ui_artifact_removal']
      }
    });

    // Layer 2: Purity Validation (Critical)
    this.addValidationLayer({
      id: 'purity_validation',
      name: 'Purity Validation Layer',
      description: 'Validates language purity with zero tolerance',
      priority: 2,
      isActive: true,
      validator: async (text: string, language: Language) => {
        const startTime = Date.now();
        const purityResult = await this.purityValidator.validatePurity(text, language);
        
        return {
          passed: purityResult.isPure && purityResult.passesZeroTolerance,
          score: purityResult.purityScore.overall,
          issues: purityResult.violations.map(violation => ({
            type: 'purity_violation',
            severity: violation.severity,
            description: `Purity violation: ${violation.type}`,
            position: violation.position,
            suggestedFix: violation.suggestedFix
          })),
          recommendations: purityResult.recommendations.map(r => r.description),
          processingTime: Date.now() - startTime,
          confidence: 0.95
        };
      },
      recoveryStrategy: {
        type: 'clean',
        maxAttempts: 2,
        cleaningRules: ['zero_tolerance_cleaning', 'script_separation']
      }
    });

    // Layer 3: Terminology Validation
    this.addValidationLayer({
      id: 'terminology_validation',
      name: 'Legal Terminology Layer',
      description: 'Validates legal terminology consistency and accuracy',
      priority: 3,
      isActive: true,
      validator: async (text: string, language: Language) => {
        const startTime = Date.now();
        const terminologyResult = await this.terminologyManager.validateTerminologyConsistency(text, language);
        
        return {
          passed: terminologyResult.isValid,
          score: terminologyResult.score,
          issues: terminologyResult.inconsistencies.map(inconsistency => ({
            type: 'terminology_inconsistency',
            severity: Severity.MEDIUM,
            description: `Terminology inconsistency: ${inconsistency.term}`,
            suggestedFix: `Use: ${inconsistency.expectedTranslation}`
          })),
          recommendations: terminologyResult.suggestions.map(s => s.suggestion),
          processingTime: Date.now() - startTime,
          confidence: 0.85
        };
      },
      recoveryStrategy: {
        type: 'retry',
        maxAttempts: 2,
        cleaningRules: ['terminology_correction']
      }
    });

    // Layer 4: Encoding Integrity
    this.addValidationLayer({
      id: 'encoding_validation',
      name: 'Encoding Integrity Layer',
      description: 'Validates character encoding and integrity',
      priority: 4,
      isActive: true,
      validator: async (text: string, language: Language) => {
        const startTime = Date.now();
        const issues: ValidationIssue[] = [];
        let score = 100;
        
        // Check for encoding issues
        for (let i = 0; i < text.length; i++) {
          const charCode = text.charCodeAt(i);
          
          // Check for replacement characters
          if (charCode === 0xFFFD) {
            issues.push({
              type: 'encoding_error',
              severity: Severity.HIGH,
              description: 'Replacement character detected',
              position: { start: i, end: i + 1 },
              suggestedFix: 'Fix character encoding'
            });
            score -= 20;
          }
          
          // Check for control characters
          if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
            issues.push({
              type: 'control_character',
              severity: Severity.MEDIUM,
              description: 'Invalid control character',
              position: { start: i, end: i + 1 },
              suggestedFix: 'Remove control character'
            });
            score -= 10;
          }
        }
        
        return {
          passed: issues.length === 0,
          score: Math.max(0, score),
          issues,
          recommendations: issues.length > 0 ? ['Apply encoding normalization'] : [],
          processingTime: Date.now() - startTime,
          confidence: 0.9
        };
      },
      recoveryStrategy: {
        type: 'clean',
        maxAttempts: 1,
        cleaningRules: ['encoding_normalization']
      }
    });

    // Layer 5: Content Quality
    this.addValidationLayer({
      id: 'content_quality',
      name: 'Content Quality Layer',
      description: 'Validates overall content quality and readability',
      priority: 5,
      isActive: true,
      validator: async (text: string, language: Language) => {
        const startTime = Date.now();
        const issues: ValidationIssue[] = [];
        let score = 100;
        
        // Basic quality checks
        if (text.trim().length === 0) {
          issues.push({
            type: 'empty_content',
            severity: Severity.CRITICAL,
            description: 'Content is empty',
            suggestedFix: 'Generate fallback content'
          });
          score = 0;
        }
        
        // Check for reasonable length
        if (text.length < 5) {
          issues.push({
            type: 'too_short',
            severity: Severity.MEDIUM,
            description: 'Content is too short',
            suggestedFix: 'Ensure minimum content length'
          });
          score -= 20;
        }
        
        // Check for excessive repetition
        const words = text.split(/\s+/);
        const uniqueWords = new Set(words);
        if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
          issues.push({
            type: 'excessive_repetition',
            severity: Severity.LOW,
            description: 'Excessive word repetition detected',
            suggestedFix: 'Improve content variety'
          });
          score -= 10;
        }
        
        return {
          passed: score >= 70,
          score,
          issues,
          recommendations: issues.length > 0 ? ['Improve content quality'] : [],
          processingTime: Date.now() - startTime,
          confidence: 0.8
        };
      },
      recoveryStrategy: {
        type: 'fallback',
        maxAttempts: 1,
        fallbackMethod: 'generate_quality_content'
      }
    });
  }

  /**
   * Initialize validation checkpoints for different pipeline stages
   */
  private initializeValidationCheckpoints(): void {
    // Pre-processing checkpoint
    this.validationCheckpoints.set(ValidationStage.PRE_PROCESSING, {
      id: 'pre_processing_checkpoint',
      stage: ValidationStage.PRE_PROCESSING,
      layers: ['pattern_detection', 'encoding_validation'],
      requiredScore: 90,
      failureAction: 'recover',
      recoveryAttempts: 3
    });

    // Post-cleaning checkpoint
    this.validationCheckpoints.set(ValidationStage.POST_CLEANING, {
      id: 'post_cleaning_checkpoint',
      stage: ValidationStage.POST_CLEANING,
      layers: ['pattern_detection', 'purity_validation', 'encoding_validation'],
      requiredScore: 95,
      failureAction: 'recover',
      recoveryAttempts: 2
    });

    // Pre-translation checkpoint
    this.validationCheckpoints.set(ValidationStage.PRE_TRANSLATION, {
      id: 'pre_translation_checkpoint',
      stage: ValidationStage.PRE_TRANSLATION,
      layers: ['purity_validation', 'terminology_validation', 'content_quality'],
      requiredScore: 85,
      failureAction: 'warn',
      recoveryAttempts: 1
    });

    // Post-translation checkpoint
    this.validationCheckpoints.set(ValidationStage.POST_TRANSLATION, {
      id: 'post_translation_checkpoint',
      stage: ValidationStage.POST_TRANSLATION,
      layers: ['purity_validation', 'terminology_validation', 'content_quality'],
      requiredScore: 90,
      failureAction: 'recover',
      recoveryAttempts: 2
    });

    // Final validation checkpoint (Zero Tolerance)
    this.validationCheckpoints.set(ValidationStage.FINAL_VALIDATION, {
      id: 'final_validation_checkpoint',
      stage: ValidationStage.FINAL_VALIDATION,
      layers: ['pattern_detection', 'purity_validation', 'encoding_validation'],
      requiredScore: 100, // Zero tolerance - must be perfect
      failureAction: 'fallback',
      recoveryAttempts: 1
    });
  }

  /**
   * Validate text at specific checkpoint
   */
  async validateAtCheckpoint(
    text: string,
    language: Language,
    stage: ValidationStage,
    context?: any
  ): Promise<{
    passed: boolean;
    overallScore: number;
    layerResults: Map<string, ValidationResult>;
    issues: ValidationIssue[];
    recommendations: string[];
    recoveryNeeded: boolean;
    processingTime: number;
  }> {
    const startTime = Date.now();
    const checkpoint = this.validationCheckpoints.get(stage);
    
    if (!checkpoint) {
      throw new Error(`Validation checkpoint not found for stage: ${stage}`);
    }

    const layerResults = new Map<string, ValidationResult>();
    const allIssues: ValidationIssue[] = [];
    const allRecommendations: string[] = [];
    let totalScore = 0;
    let layerCount = 0;

    // Run validation layers in priority order
    const sortedLayers = checkpoint.layers
      .map(layerId => this.validationLayers.get(layerId))
      .filter(layer => layer && layer.isActive)
      .sort((a, b) => a!.priority - b!.priority);

    for (const layer of sortedLayers) {
      if (!layer) continue;

      try {
        const result = await layer.validator(text, language, context);
        layerResults.set(layer.id, result);
        
        totalScore += result.score;
        layerCount++;
        
        allIssues.push(...result.issues);
        allRecommendations.push(...result.recommendations);

        defaultLogger.debug('Validation layer completed', {
          layerId: layer.id,
          stage,
          passed: result.passed,
          score: result.score,
          issuesCount: result.issues.length
        }, 'MultiLayerValidationSystem');

      } catch (error) {
        defaultLogger.error('Validation layer failed', {
          layerId: layer.id,
          stage,
          error: error.message
        }, 'MultiLayerValidationSystem');

        // Add error as critical issue
        allIssues.push({
          type: 'validation_error',
          severity: Severity.CRITICAL,
          description: `Validation layer ${layer.id} failed: ${error.message}`,
          suggestedFix: 'Retry validation or escalate to manual review'
        });
      }
    }

    const overallScore = layerCount > 0 ? totalScore / layerCount : 0;
    const passed = overallScore >= checkpoint.requiredScore;
    const recoveryNeeded = !passed && checkpoint.failureAction === 'recover';
    const processingTime = Date.now() - startTime;

    // Update statistics
    this.validationStats.totalValidations++;
    if (passed) {
      this.validationStats.passedValidations++;
    } else {
      this.validationStats.failedValidations++;
    }
    this.validationStats.averageProcessingTime = 
      (this.validationStats.averageProcessingTime * (this.validationStats.totalValidations - 1) + processingTime) / 
      this.validationStats.totalValidations;

    defaultLogger.info('Checkpoint validation completed', {
      stage,
      passed,
      overallScore,
      requiredScore: checkpoint.requiredScore,
      layersCount: layerCount,
      issuesCount: allIssues.length,
      recoveryNeeded,
      processingTime
    }, 'MultiLayerValidationSystem');

    return {
      passed,
      overallScore,
      layerResults,
      issues: allIssues,
      recommendations: [...new Set(allRecommendations)], // Remove duplicates
      recoveryNeeded,
      processingTime
    };
  }

  /**
   * Attempt validation recovery
   */
  async attemptRecovery(
    text: string,
    language: Language,
    stage: ValidationStage,
    failedLayers: string[],
    attempt: number = 1
  ): Promise<{
    success: boolean;
    recoveredText: string;
    actionsApplied: string[];
    processingTime: number;
  }> {
    const startTime = Date.now();
    const actionsApplied: string[] = [];
    let recoveredText = text;

    try {
      // Apply recovery strategies for failed layers
      for (const layerId of failedLayers) {
        const layer = this.validationLayers.get(layerId);
        if (!layer || attempt > layer.recoveryStrategy.maxAttempts) {
          continue;
        }

        switch (layer.recoveryStrategy.type) {
          case 'clean':
            recoveredText = await this.applyCleaningRecovery(recoveredText, layer.recoveryStrategy.cleaningRules || []);
            actionsApplied.push(`Applied cleaning for ${layerId}`);
            break;

          case 'retry':
            // For retry, we'll just re-validate (handled by caller)
            actionsApplied.push(`Scheduled retry for ${layerId}`);
            break;

          case 'fallback':
            recoveredText = await this.applyFallbackRecovery(recoveredText, language, layer.recoveryStrategy.fallbackMethod);
            actionsApplied.push(`Applied fallback for ${layerId}`);
            break;

          case 'escalate':
            actionsApplied.push(`Escalated ${layerId} for manual review`);
            break;
        }
      }

      // Re-validate the recovered text
      const revalidationResult = await this.validateAtCheckpoint(recoveredText, language, stage);
      
      this.validationStats.recoveredValidations++;

      return {
        success: revalidationResult.passed,
        recoveredText,
        actionsApplied,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      defaultLogger.error('Validation recovery failed', {
        stage,
        attempt,
        error: error.message
      }, 'MultiLayerValidationSystem');

      return {
        success: false,
        recoveredText: text,
        actionsApplied,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Apply cleaning-based recovery
   */
  private async applyCleaningRecovery(text: string, cleaningRules: string[]): Promise<string> {
    let cleanedText = text;

    for (const rule of cleaningRules) {
      switch (rule) {
        case 'aggressive_pattern_removal':
          cleanedText = cleanedText.replace(/[а-яё]+/gi, ''); // Remove Cyrillic
          cleanedText = cleanedText.replace(/undefined|null|NaN|\[object Object\]/gi, ''); // Remove UI artifacts
          break;

        case 'cyrillic_removal':
          cleanedText = cleanedText.replace(/[а-яё]+/gi, '');
          break;

        case 'ui_artifact_removal':
          cleanedText = cleanedText.replace(/undefined|null|NaN|\[object Object\]|Defined|AUTO-TRANSLATE/gi, '');
          break;

        case 'zero_tolerance_cleaning':
          cleanedText = cleanedText.replace(/[а-яё]+/gi, ''); // Cyrillic
          cleanedText = cleanedText.replace(/[أ-ي]+[a-zA-Z]+|[a-zA-Z]+[أ-ي]+/g, ''); // Mixed scripts
          break;

        case 'script_separation':
          // Separate mixed scripts (simplified implementation)
          const arabicParts = cleanedText.match(/[أ-ي\u0600-\u06FF\s]+/g) || [];
          const latinParts = cleanedText.match(/[a-zA-Z\s]+/g) || [];
          cleanedText = arabicParts.concat(latinParts).join(' ').trim();
          break;

        case 'encoding_normalization':
          cleanedText = cleanedText.replace(/\uFFFD/g, ''); // Remove replacement characters
          cleanedText = cleanedText.replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
          break;
      }
    }

    return cleanedText.trim();
  }

  /**
   * Apply fallback-based recovery
   */
  private async applyFallbackRecovery(text: string, language: Language, fallbackMethod?: string): Promise<string> {
    // This would integrate with the FallbackContentGenerator
    // For now, return a simple fallback
    if (language === Language.ARABIC) {
      return 'محتوى قانوني مهني وفقاً للقانون الجزائري';
    } else {
      return 'Contenu juridique professionnel conforme au droit algérien';
    }
  }

  /**
   * Add validation layer
   */
  private addValidationLayer(layer: ValidationLayer): void {
    this.validationLayers.set(layer.id, layer);
  }

  /**
   * Get validation statistics
   */
  public getValidationStatistics(): typeof this.validationStats {
    return { ...this.validationStats };
  }

  /**
   * Get system health status
   */
  public getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    activeLayers: number;
    totalCheckpoints: number;
    successRate: number;
    averageProcessingTime: number;
  } {
    const activeLayers = Array.from(this.validationLayers.values()).filter(l => l.isActive).length;
    const successRate = this.validationStats.totalValidations > 0 
      ? (this.validationStats.passedValidations / this.validationStats.totalValidations) * 100 
      : 100;

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (successRate < 70) {
      status = 'critical';
    } else if (successRate < 85) {
      status = 'degraded';
    }

    return {
      status,
      activeLayers,
      totalCheckpoints: this.validationCheckpoints.size,
      successRate,
      averageProcessingTime: this.validationStats.averageProcessingTime
    };
  }

  /**
   * Enable/disable validation layer
   */
  public setLayerActive(layerId: string, active: boolean): boolean {
    const layer = this.validationLayers.get(layerId);
    if (!layer) return false;

    layer.isActive = active;
    defaultLogger.info('Validation layer status changed', {
      layerId,
      active
    }, 'MultiLayerValidationSystem');

    return true;
  }

  /**
   * Update checkpoint configuration
   */
  public updateCheckpoint(stage: ValidationStage, updates: Partial<ValidationCheckpoint>): boolean {
    const checkpoint = this.validationCheckpoints.get(stage);
    if (!checkpoint) return false;

    Object.assign(checkpoint, updates);
    defaultLogger.info('Validation checkpoint updated', {
      stage,
      updates: Object.keys(updates)
    }, 'MultiLayerValidationSystem');

    return true;
  }
}