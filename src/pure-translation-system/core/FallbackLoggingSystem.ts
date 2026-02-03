/**
 * Fallback Logging System
 * 
 * Implements detailed failure logging for system improvement,
 * tracking fallback activations, emergency content generation,
 * and error escalation patterns.
 * 
 * Requirements: 6.5
 */

import {
  TranslationRequest,
  PureTranslationResult,
  TranslationError,
  SystemError,
  ErrorRecoveryAction,
  FallbackContent,
  Language,
  Severity,
  ContentIntent,
  TranslationMethod,
  FallbackMethod
} from '../types';

import { defaultLogger, LogLevel } from '../utils/Logger';

export interface FallbackLogEntry {
  id: string;
  timestamp: Date;
  requestId: string;
  userId?: string;
  originalRequest: TranslationRequest;
  failureReason: string;
  errorType: string;
  errorSeverity: Severity;
  fallbackMethod: FallbackMethod;
  emergencyContentUsed: boolean;
  recoveryAttempts: RecoveryAttemptLog[];
  systemState: SystemStateSnapshot;
  userImpact: UserImpactAssessment;
  improvementSuggestions: ImprovementSuggestion[];
  processingTime: number;
  qualityMetrics: FallbackQualityMetrics;
  escalationLevel: EscalationLevel;
  notificationsSent: NotificationRecord[];
}

export interface RecoveryAttemptLog {
  attemptNumber: number;
  strategy: string;
  action: ErrorRecoveryAction;
  timestamp: Date;
  success: boolean;
  processingTime: number;
  errorMessage?: string;
  confidence?: number;
  qualityScore?: number;
  methodUsed?: TranslationMethod;
}

export interface SystemStateSnapshot {
  primaryTranslationAvailable: boolean;
  secondaryTranslationAvailable: boolean;
  fallbackGeneratorAvailable: boolean;
  validationSystemAvailable: boolean;
  cacheAvailable: boolean;
  networkConnectivity: boolean;
  systemLoad: number;
  errorRate: number;
  memoryUsage: number;
  activeConnections: number;
  timestamp: Date;
}

export interface UserImpactAssessment {
  impactLevel: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
  userType: 'anonymous' | 'registered' | 'premium' | 'admin';
  expectedQualityLoss: number;
  userExperienceDegradation: number;
  businessImpact: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ImprovementSuggestion {
  category: 'system' | 'algorithm' | 'data' | 'configuration' | 'infrastructure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImpact: string;
  implementationComplexity: 'low' | 'medium' | 'high';
  estimatedEffort: string;
  relatedPatterns: string[];
}

export interface FallbackQualityMetrics {
  purityScore: number;
  terminologyAccuracy: number;
  contextualRelevance: number;
  readabilityScore: number;
  professionalismScore: number;
  userSatisfactionEstimate: number;
  confidenceScore: number;
}

export enum EscalationLevel {
  NONE = 'none',
  AUTOMATIC = 'automatic',
  TEAM_NOTIFICATION = 'team_notification',
  ADMIN_ALERT = 'admin_alert',
  CRITICAL_INCIDENT = 'critical_incident',
  EMERGENCY_RESPONSE = 'emergency_response'
}

export interface NotificationRecord {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'dashboard';
  recipient: string;
  timestamp: Date;
  success: boolean;
  message: string;
  escalationLevel: EscalationLevel;
}

export interface FallbackAnalytics {
  totalFallbacks: number;
  fallbacksByType: Map<FallbackMethod, number>;
  fallbacksByErrorType: Map<string, number>;
  averageRecoveryTime: number;
  successRate: number;
  userImpactDistribution: Map<string, number>;
  improvementOpportunities: ImprovementOpportunity[];
  trendAnalysis: FallbackTrendAnalysis;
}

export interface ImprovementOpportunity {
  pattern: string;
  frequency: number;
  impact: number;
  recommendation: string;
  estimatedReduction: number;
}

export interface FallbackTrendAnalysis {
  period: 'hour' | 'day' | 'week' | 'month';
  trend: 'improving' | 'worsening' | 'stable';
  changeRate: number;
  predictions: FallbackPrediction[];
}

export interface FallbackPrediction {
  timeframe: Date;
  predictedFallbacks: number;
  confidence: number;
  riskFactors: string[];
}

export class FallbackLoggingSystem {
  private fallbackLogs: Map<string, FallbackLogEntry> = new Map();
  private maxLogEntries = 10000;
  private analyticsCache: FallbackAnalytics | null = null;
  private analyticsCacheExpiry: Date | null = null;
  private readonly cacheValidityMs = 5 * 60 * 1000; // 5 minutes

  constructor() {
    defaultLogger.info('Fallback Logging System initialized', {
      maxLogEntries: this.maxLogEntries
    }, 'FallbackLoggingSystem');
  }

  /**
   * Log fallback activation with comprehensive details
   */
  async logFallbackActivation(
    originalRequest: TranslationRequest,
    error: TranslationError | SystemError,
    recoveryAttempts: RecoveryAttemptLog[],
    fallbackResult: PureTranslationResult,
    systemState: SystemStateSnapshot
  ): Promise<string> {
    const logId = this.generateLogId();
    
    // Assess user impact
    const userImpact = this.assessUserImpact(originalRequest, error, fallbackResult);
    
    // Generate improvement suggestions
    const improvementSuggestions = await this.generateImprovementSuggestions(
      error,
      recoveryAttempts,
      systemState
    );
    
    // Determine escalation level
    const escalationLevel = this.determineEscalationLevel(error, userImpact, recoveryAttempts);
    
    // Calculate quality metrics
    const qualityMetrics = this.calculateFallbackQualityMetrics(fallbackResult);
    
    const logEntry: FallbackLogEntry = {
      id: logId,
      timestamp: new Date(),
      requestId: originalRequest.userId || 'anonymous',
      userId: originalRequest.userId,
      originalRequest,
      failureReason: error.message,
      errorType: error.code,
      errorSeverity: error.severity || Severity.HIGH,
      fallbackMethod: this.determineFallbackMethod(fallbackResult.method),
      emergencyContentUsed: fallbackResult.method === TranslationMethod.FALLBACK_GENERATED,
      recoveryAttempts,
      systemState,
      userImpact,
      improvementSuggestions,
      processingTime: fallbackResult.processingTime,
      qualityMetrics,
      escalationLevel,
      notificationsSent: []
    };

    // Store log entry
    this.fallbackLogs.set(logId, logEntry);
    
    // Maintain log size limit
    this.maintainLogSizeLimit();
    
    // Log to system logger
    await this.logToSystemLogger(logEntry);
    
    // Trigger notifications if needed
    if (escalationLevel !== EscalationLevel.NONE) {
      await this.triggerNotifications(logEntry);
    }
    
    // Invalidate analytics cache
    this.analyticsCache = null;
    
    defaultLogger.info('Fallback activation logged', {
      logId,
      errorType: error.code,
      fallbackMethod: logEntry.fallbackMethod,
      escalationLevel,
      userImpact: userImpact.impactLevel
    }, 'FallbackLoggingSystem');
    
    return logId;
  }

  /**
   * Log emergency content generation
   */
  async logEmergencyContentGeneration(
    originalRequest: TranslationRequest,
    emergencyContent: string,
    reason: string,
    systemState: SystemStateSnapshot
  ): Promise<string> {
    const logId = this.generateLogId();
    
    // Create synthetic error for emergency content
    const emergencyError: SystemError = {
      code: 'EMERGENCY_CONTENT_REQUIRED',
      message: reason,
      severity: Severity.CRITICAL,
      timestamp: new Date(),
      context: { emergencyContent: true }
    };
    
    // Create synthetic fallback result
    const emergencyResult: PureTranslationResult = {
      translatedText: emergencyContent,
      purityScore: 100,
      qualityMetrics: {
        purityScore: 100,
        terminologyAccuracy: 90,
        contextualRelevance: 30, // Low relevance for emergency content
        readabilityScore: 95,
        professionalismScore: 100,
        encodingIntegrity: 100
      },
      processingTime: 0,
      method: TranslationMethod.FALLBACK_GENERATED,
      confidence: 0.3,
      warnings: [{
        code: 'EMERGENCY_CONTENT',
        message: 'Emergency content provided due to system failure'
      }],
      metadata: {
        requestId: originalRequest.userId || 'anonymous',
        timestamp: new Date(),
        processingSteps: [{
          step: 'emergency_content_generation',
          duration: 0,
          success: true,
          details: { reason }
        }],
        fallbackUsed: true,
        cacheHit: false
      }
    };
    
    // Log as critical fallback
    return await this.logFallbackActivation(
      originalRequest,
      emergencyError,
      [], // No recovery attempts for emergency content
      emergencyResult,
      systemState
    );
  }

  /**
   * Generate comprehensive fallback analytics
   */
  async generateFallbackAnalytics(timeRange?: { start: Date; end: Date }): Promise<FallbackAnalytics> {
    // Check cache validity
    if (this.analyticsCache && this.analyticsCacheExpiry && new Date() < this.analyticsCacheExpiry) {
      return this.analyticsCache;
    }
    
    const logs = Array.from(this.fallbackLogs.values());
    const filteredLogs = timeRange 
      ? logs.filter(log => log.timestamp >= timeRange.start && log.timestamp <= timeRange.end)
      : logs;
    
    const analytics: FallbackAnalytics = {
      totalFallbacks: filteredLogs.length,
      fallbacksByType: this.calculateFallbacksByType(filteredLogs),
      fallbacksByErrorType: this.calculateFallbacksByErrorType(filteredLogs),
      averageRecoveryTime: this.calculateAverageRecoveryTime(filteredLogs),
      successRate: this.calculateSuccessRate(filteredLogs),
      userImpactDistribution: this.calculateUserImpactDistribution(filteredLogs),
      improvementOpportunities: await this.identifyImprovementOpportunities(filteredLogs),
      trendAnalysis: this.analyzeFallbackTrends(filteredLogs)
    };
    
    // Cache results
    this.analyticsCache = analytics;
    this.analyticsCacheExpiry = new Date(Date.now() + this.cacheValidityMs);
    
    return analytics;
  }

  /**
   * Get fallback logs with filtering options
   */
  getFallbackLogs(options?: {
    errorType?: string;
    escalationLevel?: EscalationLevel;
    timeRange?: { start: Date; end: Date };
    limit?: number;
  }): FallbackLogEntry[] {
    let logs = Array.from(this.fallbackLogs.values());
    
    if (options?.errorType) {
      logs = logs.filter(log => log.errorType === options.errorType);
    }
    
    if (options?.escalationLevel) {
      logs = logs.filter(log => log.escalationLevel === options.escalationLevel);
    }
    
    if (options?.timeRange) {
      logs = logs.filter(log => 
        log.timestamp >= options.timeRange!.start && 
        log.timestamp <= options.timeRange!.end
      );
    }
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (options?.limit) {
      logs = logs.slice(0, options.limit);
    }
    
    return logs;
  }

  /**
   * Get critical fallback incidents requiring immediate attention
   */
  getCriticalIncidents(): FallbackLogEntry[] {
    return this.getFallbackLogs({
      escalationLevel: EscalationLevel.CRITICAL_INCIDENT
    });
  }

  /**
   * Export fallback logs for external analysis
   */
  async exportFallbackLogs(format: 'json' | 'csv', timeRange?: { start: Date; end: Date }): Promise<string> {
    const logs = this.getFallbackLogs({ timeRange });
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      return this.convertLogsToCSV(logs);
    }
  }

  /**
   * Clear old logs to maintain performance
   */
  clearOldLogs(olderThan: Date): number {
    const initialSize = this.fallbackLogs.size;
    
    for (const [id, log] of this.fallbackLogs.entries()) {
      if (log.timestamp < olderThan) {
        this.fallbackLogs.delete(id);
      }
    }
    
    const clearedCount = initialSize - this.fallbackLogs.size;
    
    if (clearedCount > 0) {
      defaultLogger.info('Cleared old fallback logs', {
        clearedCount,
        remainingCount: this.fallbackLogs.size
      }, 'FallbackLoggingSystem');
    }
    
    return clearedCount;
  }

  // Private helper methods

  private generateLogId(): string {
    return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private assessUserImpact(
    request: TranslationRequest,
    error: TranslationError | SystemError,
    result: PureTranslationResult
  ): UserImpactAssessment {
    let impactLevel: UserImpactAssessment['impactLevel'] = 'minimal';
    let urgencyLevel: UserImpactAssessment['urgencyLevel'] = 'low';
    
    // Assess based on error severity
    if (error.severity === Severity.CRITICAL) {
      impactLevel = 'severe';
      urgencyLevel = 'critical';
    } else if (error.severity === Severity.HIGH) {
      impactLevel = 'significant';
      urgencyLevel = 'high';
    } else if (error.severity === Severity.MEDIUM) {
      impactLevel = 'moderate';
      urgencyLevel = 'medium';
    }
    
    // Assess based on request priority
    if (request.priority === 'urgent' || request.priority === 'real_time') {
      urgencyLevel = 'critical';
      if (impactLevel === 'minimal') impactLevel = 'moderate';
    }
    
    // Calculate quality loss
    const expectedQualityLoss = Math.max(0, 95 - result.qualityMetrics.purityScore);
    const userExperienceDegradation = result.confidence < 0.5 ? 70 : 30;
    
    return {
      impactLevel,
      userType: request.userId ? 'registered' : 'anonymous',
      expectedQualityLoss,
      userExperienceDegradation,
      businessImpact: impactLevel === 'severe' ? 80 : impactLevel === 'significant' ? 60 : 30,
      urgencyLevel
    };
  }

  private async generateImprovementSuggestions(
    error: TranslationError | SystemError,
    recoveryAttempts: RecoveryAttemptLog[],
    systemState: SystemStateSnapshot
  ): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    
    // System-level suggestions
    if (systemState.systemLoad > 0.8) {
      suggestions.push({
        category: 'infrastructure',
        priority: 'high',
        description: 'System load is consistently high, consider scaling resources',
        expectedImpact: 'Reduce fallback rate by 30-40%',
        implementationComplexity: 'medium',
        estimatedEffort: '2-3 days',
        relatedPatterns: ['high_load', 'performance_degradation']
      });
    }
    
    // Algorithm improvements
    if (recoveryAttempts.length > 2) {
      suggestions.push({
        category: 'algorithm',
        priority: 'medium',
        description: 'Multiple recovery attempts suggest need for better error prediction',
        expectedImpact: 'Reduce recovery time by 50%',
        implementationComplexity: 'high',
        estimatedEffort: '1-2 weeks',
        relatedPatterns: ['multiple_recovery_attempts', 'prediction_accuracy']
      });
    }
    
    // Data quality suggestions
    if (error.code.includes('validation') || error.code.includes('purity')) {
      suggestions.push({
        category: 'data',
        priority: 'high',
        description: 'Validation failures suggest need for better input cleaning',
        expectedImpact: 'Reduce validation failures by 60%',
        implementationComplexity: 'medium',
        estimatedEffort: '3-5 days',
        relatedPatterns: ['validation_failure', 'input_quality']
      });
    }
    
    return suggestions;
  }

  private determineEscalationLevel(
    error: TranslationError | SystemError,
    userImpact: UserImpactAssessment,
    recoveryAttempts: RecoveryAttemptLog[]
  ): EscalationLevel {
    // Critical incidents
    if (error.severity === Severity.CRITICAL || userImpact.impactLevel === 'severe') {
      return EscalationLevel.CRITICAL_INCIDENT;
    }
    
    // Admin alerts
    if (error.severity === Severity.HIGH || recoveryAttempts.length > 3) {
      return EscalationLevel.ADMIN_ALERT;
    }
    
    // Team notifications
    if (error.severity === Severity.MEDIUM || userImpact.impactLevel === 'significant') {
      return EscalationLevel.TEAM_NOTIFICATION;
    }
    
    // Automatic logging only
    return EscalationLevel.AUTOMATIC;
  }

  private calculateFallbackQualityMetrics(result: PureTranslationResult): FallbackQualityMetrics {
    return {
      purityScore: result.purityScore,
      terminologyAccuracy: result.qualityMetrics.terminologyAccuracy,
      contextualRelevance: result.qualityMetrics.contextualRelevance,
      readabilityScore: result.qualityMetrics.readabilityScore,
      professionalismScore: result.qualityMetrics.professionalismScore,
      userSatisfactionEstimate: Math.max(0, result.confidence * 100 - 20), // Estimate based on confidence
      confidenceScore: result.confidence * 100
    };
  }

  private determineFallbackMethod(translationMethod: TranslationMethod): FallbackMethod {
    switch (translationMethod) {
      case TranslationMethod.FALLBACK_GENERATED:
        return FallbackMethod.CONTEXT_GENERATED;
      case TranslationMethod.TEMPLATE_BASED:
        return FallbackMethod.TEMPLATE_BASED;
      case TranslationMethod.LEGAL_DICTIONARY:
        return FallbackMethod.DICTIONARY_LOOKUP;
      case TranslationMethod.RULE_BASED:
        return FallbackMethod.RULE_BASED;
      default:
        return FallbackMethod.EMERGENCY_GENERIC;
    }
  }

  private maintainLogSizeLimit(): void {
    if (this.fallbackLogs.size > this.maxLogEntries) {
      const entries = Array.from(this.fallbackLogs.entries());
      entries.sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
      
      const toRemove = entries.slice(0, this.fallbackLogs.size - this.maxLogEntries);
      toRemove.forEach(([id]) => this.fallbackLogs.delete(id));
      
      defaultLogger.info('Maintained fallback log size limit', {
        removedEntries: toRemove.length,
        currentSize: this.fallbackLogs.size
      }, 'FallbackLoggingSystem');
    }
  }

  private async logToSystemLogger(logEntry: FallbackLogEntry): Promise<void> {
    const logLevel = this.getLogLevelForEscalation(logEntry.escalationLevel);
    
    defaultLogger.log(logLevel, 'Fallback activation logged', {
      logId: logEntry.id,
      errorType: logEntry.errorType,
      fallbackMethod: logEntry.fallbackMethod,
      escalationLevel: logEntry.escalationLevel,
      userImpact: logEntry.userImpact.impactLevel,
      processingTime: logEntry.processingTime,
      qualityScore: logEntry.qualityMetrics.purityScore,
      improvementSuggestions: logEntry.improvementSuggestions.length
    }, 'FallbackLoggingSystem');
  }

  private getLogLevelForEscalation(escalationLevel: EscalationLevel): LogLevel {
    switch (escalationLevel) {
      case EscalationLevel.CRITICAL_INCIDENT:
      case EscalationLevel.EMERGENCY_RESPONSE:
        return LogLevel.CRITICAL;
      case EscalationLevel.ADMIN_ALERT:
        return LogLevel.ERROR;
      case EscalationLevel.TEAM_NOTIFICATION:
        return LogLevel.WARN;
      default:
        return LogLevel.INFO;
    }
  }

  private async triggerNotifications(logEntry: FallbackLogEntry): Promise<void> {
    // This would integrate with actual notification systems
    // For now, we'll just log the notification intent
    
    const notifications: NotificationRecord[] = [];
    
    switch (logEntry.escalationLevel) {
      case EscalationLevel.CRITICAL_INCIDENT:
        notifications.push({
          type: 'email',
          recipient: 'admin@juristdz.com',
          timestamp: new Date(),
          success: true,
          message: `Critical fallback incident: ${logEntry.errorType}`,
          escalationLevel: logEntry.escalationLevel
        });
        break;
        
      case EscalationLevel.ADMIN_ALERT:
        notifications.push({
          type: 'slack',
          recipient: '#alerts',
          timestamp: new Date(),
          success: true,
          message: `Fallback alert: ${logEntry.errorType}`,
          escalationLevel: logEntry.escalationLevel
        });
        break;
        
      case EscalationLevel.TEAM_NOTIFICATION:
        notifications.push({
          type: 'dashboard',
          recipient: 'team',
          timestamp: new Date(),
          success: true,
          message: `Fallback notification: ${logEntry.errorType}`,
          escalationLevel: logEntry.escalationLevel
        });
        break;
    }
    
    logEntry.notificationsSent = notifications;
    
    defaultLogger.info('Notifications triggered for fallback', {
      logId: logEntry.id,
      escalationLevel: logEntry.escalationLevel,
      notificationCount: notifications.length
    }, 'FallbackLoggingSystem');
  }

  // Analytics helper methods
  private calculateFallbacksByType(logs: FallbackLogEntry[]): Map<FallbackMethod, number> {
    const counts = new Map<FallbackMethod, number>();
    
    logs.forEach(log => {
      const current = counts.get(log.fallbackMethod) || 0;
      counts.set(log.fallbackMethod, current + 1);
    });
    
    return counts;
  }

  private calculateFallbacksByErrorType(logs: FallbackLogEntry[]): Map<string, number> {
    const counts = new Map<string, number>();
    
    logs.forEach(log => {
      const current = counts.get(log.errorType) || 0;
      counts.set(log.errorType, current + 1);
    });
    
    return counts;
  }

  private calculateAverageRecoveryTime(logs: FallbackLogEntry[]): number {
    if (logs.length === 0) return 0;
    
    const totalTime = logs.reduce((sum, log) => sum + log.processingTime, 0);
    return totalTime / logs.length;
  }

  private calculateSuccessRate(logs: FallbackLogEntry[]): number {
    if (logs.length === 0) return 100;
    
    const successfulFallbacks = logs.filter(log => 
      log.qualityMetrics.purityScore >= 95 && 
      log.qualityMetrics.confidenceScore >= 30
    ).length;
    
    return (successfulFallbacks / logs.length) * 100;
  }

  private calculateUserImpactDistribution(logs: FallbackLogEntry[]): Map<string, number> {
    const distribution = new Map<string, number>();
    
    logs.forEach(log => {
      const impact = log.userImpact.impactLevel;
      const current = distribution.get(impact) || 0;
      distribution.set(impact, current + 1);
    });
    
    return distribution;
  }

  private async identifyImprovementOpportunities(logs: FallbackLogEntry[]): Promise<ImprovementOpportunity[]> {
    const opportunities: ImprovementOpportunity[] = [];
    
    // Analyze error patterns
    const errorCounts = this.calculateFallbacksByErrorType(logs);
    
    errorCounts.forEach((count, errorType) => {
      if (count > 5) { // Frequent error
        opportunities.push({
          pattern: `Frequent ${errorType} errors`,
          frequency: count,
          impact: count * 10, // Simple impact calculation
          recommendation: `Investigate and fix root cause of ${errorType} errors`,
          estimatedReduction: Math.min(80, count * 5)
        });
      }
    });
    
    return opportunities.sort((a, b) => b.impact - a.impact);
  }

  private analyzeFallbackTrends(logs: FallbackLogEntry[]): FallbackTrendAnalysis {
    // Simple trend analysis - in production this would be more sophisticated
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentLogs = logs.filter(log => log.timestamp >= dayAgo);
    const olderLogs = logs.filter(log => log.timestamp < dayAgo);
    
    const recentRate = recentLogs.length;
    const olderRate = olderLogs.length;
    
    let trend: 'improving' | 'worsening' | 'stable' = 'stable';
    let changeRate = 0;
    
    if (olderRate > 0) {
      changeRate = ((recentRate - olderRate) / olderRate) * 100;
      
      if (changeRate > 10) {
        trend = 'worsening';
      } else if (changeRate < -10) {
        trend = 'improving';
      }
    }
    
    return {
      period: 'day',
      trend,
      changeRate,
      predictions: [{
        timeframe: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        predictedFallbacks: Math.max(0, recentRate + (recentRate * changeRate / 100)),
        confidence: 0.7,
        riskFactors: trend === 'worsening' ? ['increasing_error_rate', 'system_degradation'] : []
      }]
    };
  }

  private convertLogsToCSV(logs: FallbackLogEntry[]): string {
    const headers = [
      'ID', 'Timestamp', 'Error Type', 'Fallback Method', 'User Impact',
      'Processing Time', 'Quality Score', 'Escalation Level', 'Improvement Suggestions'
    ];
    
    const rows = logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.errorType,
      log.fallbackMethod,
      log.userImpact.impactLevel,
      log.processingTime.toString(),
      log.qualityMetrics.purityScore.toString(),
      log.escalationLevel,
      log.improvementSuggestions.length.toString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}