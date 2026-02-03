/**
 * Cache Quality Manager - Advanced cache invalidation and quality maintenance
 * 
 * Implements intelligent cache invalidation strategies, quality-based maintenance,
 * and proactive cache health monitoring to ensure only high-quality, pure translations
 * are served from cache while maintaining optimal performance.
 */

import {
  PureTranslationResult,
  TranslationRequest,
  Language,
  ContentType,
  TranslationMethod,
  QualityMetrics,
  ViolationType,
  Severity
} from '../types';
import { IntelligentTranslationCache, CacheEntry } from './IntelligentTranslationCache';
import { PurityValidationSystem } from './PurityValidationSystem';
import { defaultLogger } from '../utils/Logger';
import { pureTranslationConfig } from '../config/PureTranslationConfig';

export interface QualityMaintenanceConfig {
  enableProactiveValidation: boolean;
  enableQualityDecayDetection: boolean;
  enableContextualInvalidation: boolean;
  enableUserFeedbackIntegration: boolean;
  qualityThreshold: number;
  purityThreshold: number;
  maxCacheAge: number;
  validationInterval: number;
  qualityDecayRate: number;
  contextSimilarityThreshold: number;
}

export interface CacheQualityMetrics {
  totalEntries: number;
  highQualityEntries: number;
  lowQualityEntries: number;
  expiredEntries: number;
  invalidatedEntries: number;
  averageQuality: number;
  averagePurity: number;
  qualityDistribution: Map<number, number>;
  invalidationReasons: Map<string, number>;
  maintenanceEfficiency: number;
}

export interface InvalidationRule {
  id: string;
  name: string;
  condition: (entry: CacheEntry) => boolean;
  priority: number;
  reason: string;
  enabled: boolean;
}

export interface QualityAlert {
  id: string;
  type: 'quality_degradation' | 'purity_violation' | 'context_mismatch' | 'user_feedback';
  severity: Severity;
  message: string;
  affectedEntries: string[];
  timestamp: Date;
  resolved: boolean;
  action: string;
}

export interface ContextualPattern {
  pattern: string;
  contentType: ContentType;
  languagePair: string;
  frequency: number;
  lastSeen: Date;
  qualityImpact: number;
}

export class CacheQualityManager {
  private cache: IntelligentTranslationCache;
  private purityValidator: PurityValidationSystem;
  private config: QualityMaintenanceConfig;
  
  // Quality tracking
  private qualityMetrics: CacheQualityMetrics;
  private qualityHistory: CacheQualityMetrics[] = [];
  
  // Invalidation rules
  private invalidationRules: Map<string, InvalidationRule> = new Map();
  
  // Quality alerts
  private activeAlerts: Map<string, QualityAlert> = new Map();
  private alertHistory: QualityAlert[] = [];
  
  // Contextual patterns
  private contextualPatterns: Map<string, ContextualPattern> = new Map();
  
  // User feedback integration
  private userFeedbackQueue: Array<{
    cacheKey: string;
    feedback: 'positive' | 'negative';
    reason?: string;
    timestamp: Date;
  }> = [];
  
  // Maintenance intervals
  private maintenanceInterval: NodeJS.Timeout;
  private validationInterval: NodeJS.Timeout;
  
  // Performance tracking
  private invalidationCount = 0;
  private validationCount = 0;
  private qualityImprovements = 0;

  constructor(
    cache: IntelligentTranslationCache,
    config?: Partial<QualityMaintenanceConfig>
  ) {
    this.cache = cache;
    this.purityValidator = new PurityValidationSystem();
    
    this.config = {
      enableProactiveValidation: true,
      enableQualityDecayDetection: true,
      enableContextualInvalidation: true,
      enableUserFeedbackIntegration: true,
      qualityThreshold: 90,
      purityThreshold: 100,
      maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      validationInterval: 60 * 60 * 1000, // 1 hour
      qualityDecayRate: 0.1, // 10% per day
      contextSimilarityThreshold: 0.8,
      ...config
    };

    this.initializeComponents();
    this.startMaintenanceProcesses();

    defaultLogger.info('Cache Quality Manager initialized', {
      proactiveValidation: this.config.enableProactiveValidation,
      qualityDecayDetection: this.config.enableQualityDecayDetection,
      contextualInvalidation: this.config.enableContextualInvalidation,
      qualityThreshold: this.config.qualityThreshold
    }, 'CacheQualityManager');
  }

  /**
   * Validate cache entry quality and invalidate if necessary
   */
  async validateCacheEntry(key: string, entry: CacheEntry): Promise<boolean> {
    this.validationCount++;
    
    try {
      // Check basic quality thresholds
      if (entry.quality < this.config.qualityThreshold) {
        await this.invalidateEntry(key, 'quality_threshold_breach');
        return false;
      }

      // Check purity if zero tolerance is enabled
      if (pureTranslationConfig.isZeroToleranceEnabled()) {
        const purityResult = await this.purityValidator.validatePurity(
          entry.result.translatedText,
          entry.metadata.targetLanguage
        );

        if (!purityResult.isPure || purityResult.purityScore.overall < this.config.purityThreshold) {
          await this.invalidateEntry(key, 'purity_violation');
          this.createQualityAlert('purity_violation', 'critical', 
            `Cache entry failed purity validation: ${purityResult.purityScore.overall}%`, [key]);
          return false;
        }
      }

      // Check for quality decay
      if (this.config.enableQualityDecayDetection) {
        const decayedQuality = this.calculateQualityDecay(entry);
        if (decayedQuality < this.config.qualityThreshold) {
          await this.invalidateEntry(key, 'quality_decay');
          return false;
        }
      }

      // Check contextual relevance
      if (this.config.enableContextualInvalidation) {
        const contextualRelevance = await this.validateContextualRelevance(entry);
        if (!contextualRelevance) {
          await this.invalidateEntry(key, 'contextual_mismatch');
          return false;
        }
      }

      // Apply custom invalidation rules
      for (const rule of this.invalidationRules.values()) {
        if (rule.enabled && rule.condition(entry)) {
          await this.invalidateEntry(key, rule.reason);
          return false;
        }
      }

      return true;

    } catch (error) {
      defaultLogger.error('Cache entry validation failed', {
        key,
        error: error.message
      }, 'CacheQualityManager');

      return false;
    }
  }

  /**
   * Process user feedback for cache quality improvement
   */
  async processUserFeedback(
    cacheKey: string,
    feedback: 'positive' | 'negative',
    reason?: string
  ): Promise<void> {
    if (!this.config.enableUserFeedbackIntegration) return;

    this.userFeedbackQueue.push({
      cacheKey,
      feedback,
      reason,
      timestamp: new Date()
    });

    // Process negative feedback immediately
    if (feedback === 'negative') {
      await this.handleNegativeFeedback(cacheKey, reason);
    }

    defaultLogger.info('User feedback processed', {
      cacheKey,
      feedback,
      reason,
      queueSize: this.userFeedbackQueue.length
    }, 'CacheQualityManager');
  }

  /**
   * Perform comprehensive cache quality maintenance
   */
  async performQualityMaintenance(): Promise<void> {
    const startTime = Date.now();
    
    defaultLogger.info('Starting cache quality maintenance', {
      totalEntries: await this.getCacheSize()
    }, 'CacheQualityManager');

    try {
      // Update quality metrics
      await this.updateQualityMetrics();

      // Process user feedback
      await this.processUserFeedbackQueue();

      // Validate cache entries
      if (this.config.enableProactiveValidation) {
        await this.performProactiveValidation();
      }

      // Detect and handle quality degradation
      if (this.config.enableQualityDecayDetection) {
        await this.detectQualityDegradation();
      }

      // Update contextual patterns
      if (this.config.enableContextualInvalidation) {
        await this.updateContextualPatterns();
      }

      // Clean up resolved alerts
      this.cleanupResolvedAlerts();

      // Record maintenance completion
      const maintenanceTime = Date.now() - startTime;
      this.recordMaintenanceMetrics(maintenanceTime);

      defaultLogger.info('Cache quality maintenance completed', {
        maintenanceTime,
        invalidatedEntries: this.invalidationCount,
        activeAlerts: this.activeAlerts.size,
        averageQuality: this.qualityMetrics.averageQuality
      }, 'CacheQualityManager');

    } catch (error) {
      defaultLogger.error('Cache quality maintenance failed', {
        error: error.message
      }, 'CacheQualityManager');
    }
  }

  /**
   * Get comprehensive quality metrics
   */
  getQualityMetrics(): CacheQualityMetrics {
    return { ...this.qualityMetrics };
  }

  /**
   * Get active quality alerts
   */
  getActiveAlerts(): QualityAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get cache health assessment
   */
  async getCacheHealthAssessment(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
    recommendations: string[];
    metrics: CacheQualityMetrics;
  }> {
    await this.updateQualityMetrics();
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let score = 100;

    // Check average quality
    if (this.qualityMetrics.averageQuality < this.config.qualityThreshold) {
      issues.push(`Low average quality: ${this.qualityMetrics.averageQuality.toFixed(2)}`);
      recommendations.push('Enable proactive validation and quality decay detection');
      status = 'warning';
      score -= 20;
    }

    // Check purity compliance
    if (this.qualityMetrics.averagePurity < this.config.purityThreshold) {
      issues.push(`Purity violations detected: ${this.qualityMetrics.averagePurity.toFixed(2)}%`);
      recommendations.push('Increase purity validation frequency');
      status = 'critical';
      score -= 30;
    }

    // Check expired entries
    const expiredRatio = this.qualityMetrics.expiredEntries / this.qualityMetrics.totalEntries;
    if (expiredRatio > 0.1) {
      issues.push(`High expired entry ratio: ${(expiredRatio * 100).toFixed(2)}%`);
      recommendations.push('Reduce cache TTL or increase maintenance frequency');
      status = status === 'critical' ? 'critical' : 'warning';
      score -= 15;
    }

    // Check active alerts
    const criticalAlerts = Array.from(this.activeAlerts.values())
      .filter(alert => alert.severity === 'critical').length;
    
    if (criticalAlerts > 0) {
      issues.push(`${criticalAlerts} critical quality alerts`);
      recommendations.push('Address critical quality issues immediately');
      status = 'critical';
      score -= 25;
    }

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations,
      metrics: this.qualityMetrics
    };
  }

  /**
   * Add custom invalidation rule
   */
  addInvalidationRule(rule: InvalidationRule): void {
    this.invalidationRules.set(rule.id, rule);
    
    defaultLogger.info('Invalidation rule added', {
      ruleId: rule.id,
      ruleName: rule.name,
      priority: rule.priority
    }, 'CacheQualityManager');
  }

  /**
   * Remove invalidation rule
   */
  removeInvalidationRule(ruleId: string): void {
    this.invalidationRules.delete(ruleId);
    
    defaultLogger.info('Invalidation rule removed', {
      ruleId
    }, 'CacheQualityManager');
  }

  /**
   * Private helper methods
   */
  private initializeComponents(): void {
    // Initialize quality metrics
    this.qualityMetrics = {
      totalEntries: 0,
      highQualityEntries: 0,
      lowQualityEntries: 0,
      expiredEntries: 0,
      invalidatedEntries: 0,
      averageQuality: 0,
      averagePurity: 0,
      qualityDistribution: new Map(),
      invalidationReasons: new Map(),
      maintenanceEfficiency: 0
    };

    // Initialize default invalidation rules
    this.initializeDefaultInvalidationRules();
  }

  private initializeDefaultInvalidationRules(): void {
    const defaultRules: InvalidationRule[] = [
      {
        id: 'age_limit',
        name: 'Age Limit Rule',
        condition: (entry) => {
          const age = Date.now() - entry.createdAt.getTime();
          return age > this.config.maxCacheAge;
        },
        priority: 1,
        reason: 'exceeded_age_limit',
        enabled: true
      },
      {
        id: 'zero_purity',
        name: 'Zero Purity Rule',
        condition: (entry) => entry.result.purityScore < 100 && pureTranslationConfig.isZeroToleranceEnabled(),
        priority: 10,
        reason: 'zero_tolerance_violation',
        enabled: true
      },
      {
        id: 'low_confidence',
        name: 'Low Confidence Rule',
        condition: (entry) => entry.result.confidence < 0.5,
        priority: 5,
        reason: 'low_confidence',
        enabled: true
      },
      {
        id: 'fallback_method',
        name: 'Fallback Method Rule',
        condition: (entry) => entry.result.method === TranslationMethod.FALLBACK_GENERATED,
        priority: 3,
        reason: 'fallback_method_used',
        enabled: false // Disabled by default as fallback might still be valuable
      }
    ];

    defaultRules.forEach(rule => {
      this.invalidationRules.set(rule.id, rule);
    });
  }

  private async invalidateEntry(key: string, reason: string): Promise<void> {
    await this.cache.invalidate(key);
    this.invalidationCount++;
    
    // Update invalidation reasons
    const currentCount = this.qualityMetrics.invalidationReasons.get(reason) || 0;
    this.qualityMetrics.invalidationReasons.set(reason, currentCount + 1);

    defaultLogger.debug('Cache entry invalidated', {
      key,
      reason,
      totalInvalidations: this.invalidationCount
    }, 'CacheQualityManager');
  }

  private calculateQualityDecay(entry: CacheEntry): number {
    const age = Date.now() - entry.createdAt.getTime();
    const ageInDays = age / (24 * 60 * 60 * 1000);
    const decayFactor = Math.pow(1 - this.config.qualityDecayRate, ageInDays);
    
    return entry.quality * decayFactor;
  }

  private async validateContextualRelevance(entry: CacheEntry): Promise<boolean> {
    // Check if the cached translation is still contextually relevant
    // This would involve checking against current contextual patterns
    
    const languagePair = `${entry.metadata.sourceLanguage}_${entry.metadata.targetLanguage}`;
    const patternKey = `${entry.metadata.contentType}_${languagePair}`;
    const pattern = this.contextualPatterns.get(patternKey);
    
    if (pattern) {
      const timeSinceLastSeen = Date.now() - pattern.lastSeen.getTime();
      const relevanceThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      return timeSinceLastSeen < relevanceThreshold;
    }
    
    return true; // Assume relevant if no pattern data
  }

  private async handleNegativeFeedback(cacheKey: string, reason?: string): Promise<void> {
    // Immediately invalidate the entry
    await this.invalidateEntry(cacheKey, 'negative_user_feedback');
    
    // Create quality alert
    this.createQualityAlert('user_feedback', 'high',
      `Negative user feedback received: ${reason || 'No reason provided'}`, [cacheKey]);
    
    // Learn from the feedback to improve future caching decisions
    await this.learnFromFeedback(cacheKey, reason);
  }

  private async learnFromFeedback(cacheKey: string, reason?: string): Promise<void> {
    // This would implement machine learning to improve cache quality
    // For now, just log the learning opportunity
    defaultLogger.info('Learning from user feedback', {
      cacheKey,
      reason,
      learningOpportunity: true
    }, 'CacheQualityManager');
  }

  private createQualityAlert(
    type: QualityAlert['type'],
    severity: Severity,
    message: string,
    affectedEntries: string[]
  ): void {
    const alert: QualityAlert = {
      id: this.generateAlertId(),
      type,
      severity,
      message,
      affectedEntries,
      timestamp: new Date(),
      resolved: false,
      action: this.getRecommendedAction(type, severity)
    };

    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    defaultLogger.warn('Quality alert created', {
      alertId: alert.id,
      type,
      severity,
      affectedCount: affectedEntries.length
    }, 'CacheQualityManager');
  }

  private getRecommendedAction(type: QualityAlert['type'], severity: Severity): string {
    switch (type) {
      case 'quality_degradation':
        return severity === 'critical' ? 'Immediate cache invalidation' : 'Increase validation frequency';
      case 'purity_violation':
        return 'Invalidate affected entries and review purity validation';
      case 'context_mismatch':
        return 'Update contextual patterns and invalidate mismatched entries';
      case 'user_feedback':
        return 'Investigate user concerns and improve quality thresholds';
      default:
        return 'Review and address quality issues';
    }
  }

  private async updateQualityMetrics(): Promise<void> {
    // This would integrate with the actual cache to get real metrics
    // For now, provide mock implementation
    const cacheStats = await this.cache.getStats();
    
    this.qualityMetrics.totalEntries = cacheStats.size;
    this.qualityMetrics.averageQuality = 92; // Mock value
    this.qualityMetrics.averagePurity = 98; // Mock value
    this.qualityMetrics.highQualityEntries = Math.floor(cacheStats.size * 0.8);
    this.qualityMetrics.lowQualityEntries = Math.floor(cacheStats.size * 0.1);
    this.qualityMetrics.expiredEntries = Math.floor(cacheStats.size * 0.05);
    this.qualityMetrics.invalidatedEntries = this.invalidationCount;
    
    // Calculate maintenance efficiency
    const totalMaintenance = this.validationCount + this.invalidationCount;
    this.qualityMetrics.maintenanceEfficiency = totalMaintenance > 0 
      ? this.qualityImprovements / totalMaintenance 
      : 0;
  }

  private async processUserFeedbackQueue(): Promise<void> {
    const feedbackToProcess = this.userFeedbackQueue.splice(0, 100); // Process in batches
    
    for (const feedback of feedbackToProcess) {
      if (feedback.feedback === 'positive') {
        // Positive feedback - could be used to reinforce quality patterns
        this.qualityImprovements++;
      }
      // Negative feedback is already processed immediately
    }

    if (feedbackToProcess.length > 0) {
      defaultLogger.info('User feedback queue processed', {
        processedCount: feedbackToProcess.length,
        remainingCount: this.userFeedbackQueue.length
      }, 'CacheQualityManager');
    }
  }

  private async performProactiveValidation(): Promise<void> {
    // This would validate a sample of cache entries proactively
    // For now, just log the validation activity
    const sampleSize = Math.min(100, await this.getCacheSize());
    
    defaultLogger.debug('Performing proactive validation', {
      sampleSize,
      validationCount: this.validationCount
    }, 'CacheQualityManager');
  }

  private async detectQualityDegradation(): Promise<void> {
    // Compare current quality metrics with historical data
    if (this.qualityHistory.length > 0) {
      const previousMetrics = this.qualityHistory[this.qualityHistory.length - 1];
      const qualityDrop = previousMetrics.averageQuality - this.qualityMetrics.averageQuality;
      
      if (qualityDrop > 5) { // 5% quality drop
        this.createQualityAlert('quality_degradation', 'warning',
          `Quality degradation detected: ${qualityDrop.toFixed(2)}% drop`, []);
      }
    }
    
    // Record current metrics in history
    this.qualityHistory.push({ ...this.qualityMetrics });
    
    // Keep only recent history
    if (this.qualityHistory.length > 24) { // Keep 24 hours of history
      this.qualityHistory.shift();
    }
  }

  private async updateContextualPatterns(): Promise<void> {
    // This would analyze cache usage patterns and update contextual relevance
    // For now, just log the pattern update activity
    defaultLogger.debug('Updating contextual patterns', {
      patternCount: this.contextualPatterns.size
    }, 'CacheQualityManager');
  }

  private cleanupResolvedAlerts(): void {
    const resolvedAlerts: string[] = [];
    
    for (const [alertId, alert] of this.activeAlerts.entries()) {
      // Auto-resolve old alerts
      const age = Date.now() - alert.timestamp.getTime();
      if (age > 24 * 60 * 60 * 1000) { // 24 hours
        alert.resolved = true;
        resolvedAlerts.push(alertId);
      }
    }

    resolvedAlerts.forEach(alertId => {
      this.activeAlerts.delete(alertId);
    });

    if (resolvedAlerts.length > 0) {
      defaultLogger.info('Resolved old quality alerts', {
        resolvedCount: resolvedAlerts.length,
        activeCount: this.activeAlerts.size
      }, 'CacheQualityManager');
    }
  }

  private recordMaintenanceMetrics(maintenanceTime: number): void {
    // Record maintenance performance metrics
    defaultLogger.debug('Maintenance metrics recorded', {
      maintenanceTime,
      invalidationCount: this.invalidationCount,
      validationCount: this.validationCount,
      qualityImprovements: this.qualityImprovements
    }, 'CacheQualityManager');
  }

  private async getCacheSize(): Promise<number> {
    const stats = await this.cache.getStats();
    return stats.size;
  }

  private startMaintenanceProcesses(): void {
    // Start regular maintenance
    this.maintenanceInterval = setInterval(() => {
      this.performQualityMaintenance();
    }, this.config.validationInterval);

    // Start validation process
    this.validationInterval = setInterval(() => {
      if (this.config.enableProactiveValidation) {
        this.performProactiveValidation();
      }
    }, this.config.validationInterval / 2);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
    }
    
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
    }

    this.activeAlerts.clear();
    this.contextualPatterns.clear();
    this.userFeedbackQueue = [];
    this.invalidationRules.clear();
  }
}