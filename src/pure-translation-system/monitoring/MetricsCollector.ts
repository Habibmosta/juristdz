/**
 * Metrics Collector - Comprehensive metrics collection for Pure Translation System
 * 
 * Collects and aggregates performance, quality, and usage metrics
 * for monitoring and improving the translation system.
 */

import { 
  TranslationMetrics, 
  MethodMetrics, 
  TimeRange, 
  TranslationMethod, 
  IssueType,
  EventType,
  TranslationEvent,
  PureTranslationResult,
  TranslationRequest
} from '../types';
import { defaultLogger } from '../utils/Logger';

export interface MetricEntry {
  timestamp: Date;
  type: string;
  value: number;
  metadata?: any;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: any;
}

export class MetricsCollector {
  private metrics: Map<string, MetricEntry[]> = new Map();
  private events: TranslationEvent[] = [];
  private readonly maxEventHistory = 10000;
  private readonly maxMetricHistory = 50000;

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Initialize metric collections
    this.metrics.set('translation_count', []);
    this.metrics.set('purity_scores', []);
    this.metrics.set('processing_times', []);
    this.metrics.set('quality_scores', []);
    this.metrics.set('failure_count', []);
    this.metrics.set('method_usage', []);
    this.metrics.set('user_satisfaction', []);
    this.metrics.set('cache_hits', []);
    this.metrics.set('cache_misses', []);
  }

  public recordTranslationStart(request: TranslationRequest): void {
    this.recordEvent({
      type: EventType.TRANSLATION_STARTED,
      timestamp: new Date(),
      data: {
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        contentType: request.contentType,
        priority: request.priority,
        textLength: request.text.length
      },
      severity: 'info',
      source: 'MetricsCollector'
    });

    this.recordMetric('translation_count', 1, { 
      type: 'start',
      contentType: request.contentType 
    });

    defaultLogger.debug('Translation started', {
      requestId: request.context?.userId,
      textLength: request.text.length,
      contentType: request.contentType
    }, 'MetricsCollector');
  }

  public recordTranslationComplete(
    request: TranslationRequest, 
    result: PureTranslationResult
  ): void {
    this.recordEvent({
      type: EventType.TRANSLATION_COMPLETED,
      timestamp: new Date(),
      data: {
        purityScore: result.purityScore,
        processingTime: result.processingTime,
        method: result.method,
        confidence: result.confidence,
        qualityScore: result.qualityMetrics.purityScore
      },
      severity: 'info',
      source: 'MetricsCollector'
    });

    // Record various metrics
    this.recordMetric('purity_scores', result.purityScore);
    this.recordMetric('processing_times', result.processingTime);
    this.recordMetric('quality_scores', result.qualityMetrics.purityScore);
    this.recordMetric('method_usage', 1, { method: result.method });

    // Check for quality issues
    if (result.purityScore < 100) {
      this.recordPurityViolation(result);
    }

    defaultLogger.info('Translation completed', {
      purityScore: result.purityScore,
      processingTime: result.processingTime,
      method: result.method,
      warningsCount: result.warnings.length
    }, 'MetricsCollector');
  }

  public recordTranslationFailure(
    request: TranslationRequest, 
    error: Error, 
    method?: TranslationMethod
  ): void {
    this.recordEvent({
      type: EventType.TRANSLATION_FAILED,
      timestamp: new Date(),
      data: {
        error: error.message,
        method,
        contentType: request.contentType,
        textLength: request.text.length
      },
      severity: 'error',
      source: 'MetricsCollector'
    });

    this.recordMetric('failure_count', 1, { 
      method,
      errorType: error.name,
      contentType: request.contentType 
    });

    defaultLogger.error('Translation failed', {
      error: error.message,
      method,
      contentType: request.contentType
    }, 'MetricsCollector');
  }

  public recordPurityViolation(result: PureTranslationResult): void {
    this.recordEvent({
      type: EventType.PURITY_VIOLATION,
      timestamp: new Date(),
      data: {
        purityScore: result.purityScore,
        method: result.method,
        warningsCount: result.warnings.length,
        violations: result.warnings.map(w => w.code)
      },
      severity: 'warn',
      source: 'MetricsCollector'
    });

    defaultLogger.warn('Purity violation detected', {
      purityScore: result.purityScore,
      method: result.method,
      violations: result.warnings.length
    }, 'MetricsCollector');
  }

  public recordFallbackTriggered(reason: string, method: TranslationMethod): void {
    this.recordEvent({
      type: EventType.FALLBACK_TRIGGERED,
      timestamp: new Date(),
      data: {
        reason,
        originalMethod: method
      },
      severity: 'warn',
      source: 'MetricsCollector'
    });

    this.recordMetric('fallback_count', 1, { reason, originalMethod: method });

    defaultLogger.warn('Fallback triggered', {
      reason,
      originalMethod: method
    }, 'MetricsCollector');
  }

  public recordCacheHit(key: string): void {
    this.recordMetric('cache_hits', 1, { key });
  }

  public recordCacheMiss(key: string): void {
    this.recordMetric('cache_misses', 1, { key });
  }

  public recordUserFeedback(
    translationId: string, 
    isPositive: boolean, 
    comment?: string
  ): void {
    this.recordEvent({
      type: EventType.USER_FEEDBACK_RECEIVED,
      timestamp: new Date(),
      data: {
        translationId,
        isPositive,
        comment
      },
      severity: 'info',
      source: 'MetricsCollector'
    });

    this.recordMetric('user_satisfaction', isPositive ? 1 : 0, {
      translationId,
      comment: comment ? 'provided' : 'none'
    });
  }

  public recordPerformanceMetric(metric: PerformanceMetric): void {
    this.recordMetric(`performance_${metric.name}`, metric.value, {
      unit: metric.unit,
      context: metric.context
    });
  }

  private recordMetric(name: string, value: number, metadata?: any): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const entries = this.metrics.get(name)!;
    entries.push({
      timestamp: new Date(),
      type: name,
      value,
      metadata
    });

    // Maintain maximum history size
    if (entries.length > this.maxMetricHistory) {
      entries.splice(0, entries.length - this.maxMetricHistory);
    }
  }

  private recordEvent(event: TranslationEvent): void {
    this.events.push(event);

    // Maintain maximum event history
    if (this.events.length > this.maxEventHistory) {
      this.events.shift();
    }
  }

  public getMetrics(timeRange?: TimeRange): TranslationMetrics {
    const now = new Date();
    const defaultRange: TimeRange = {
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: now
    };

    const range = timeRange || defaultRange;
    const filteredEvents = this.events.filter(
      event => event.timestamp >= range.start && event.timestamp <= range.end
    );

    const totalTranslations = this.getMetricCount('translation_count', range);
    const purityScores = this.getMetricValues('purity_scores', range);
    const pureTranslations = purityScores.filter(score => score === 100).length;
    const failures = this.getMetricCount('failure_count', range);
    const processingTimes = this.getMetricValues('processing_times', range);
    const qualityScores = this.getMetricValues('quality_scores', range);

    return {
      totalTranslations,
      pureTranslations,
      purityRate: totalTranslations > 0 ? (pureTranslations / totalTranslations) * 100 : 0,
      averageQualityScore: this.calculateAverage(qualityScores),
      failureRate: totalTranslations > 0 ? (failures / totalTranslations) * 100 : 0,
      averageProcessingTime: this.calculateAverage(processingTimes),
      userSatisfactionScore: this.calculateUserSatisfaction(range),
      issuesByType: this.getIssuesByType(filteredEvents),
      methodEffectiveness: this.getMethodEffectiveness(range),
      timeRange: range
    };
  }

  private getMetricCount(metricName: string, timeRange: TimeRange): number {
    const entries = this.metrics.get(metricName) || [];
    return entries.filter(
      entry => entry.timestamp >= timeRange.start && entry.timestamp <= timeRange.end
    ).length;
  }

  private getMetricValues(metricName: string, timeRange: TimeRange): number[] {
    const entries = this.metrics.get(metricName) || [];
    return entries
      .filter(entry => entry.timestamp >= timeRange.start && entry.timestamp <= timeRange.end)
      .map(entry => entry.value);
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private calculateUserSatisfaction(timeRange: TimeRange): number {
    const satisfactionScores = this.getMetricValues('user_satisfaction', timeRange);
    return this.calculateAverage(satisfactionScores) * 100; // Convert to percentage
  }

  private getIssuesByType(events: TranslationEvent[]): Map<IssueType, number> {
    const issueMap = new Map<IssueType, number>();
    
    events.forEach(event => {
      if (event.type === EventType.PURITY_VIOLATION) {
        const violations = event.data.violations || [];
        violations.forEach((violation: string) => {
          const issueType = this.mapViolationToIssueType(violation);
          issueMap.set(issueType, (issueMap.get(issueType) || 0) + 1);
        });
      }
    });

    return issueMap;
  }

  private mapViolationToIssueType(violation: string): IssueType {
    // Map violation codes to issue types
    switch (violation) {
      case 'MIXED_SCRIPTS':
        return IssueType.LANGUAGE_MIXING;
      case 'CORRUPTED_CHARACTERS':
        return IssueType.CORRUPTED_CHARACTERS;
      case 'POOR_TERMINOLOGY':
        return IssueType.POOR_TERMINOLOGY;
      case 'ENCODING_ERROR':
        return IssueType.ENCODING_ERROR;
      default:
        return IssueType.LANGUAGE_MIXING;
    }
  }

  private getMethodEffectiveness(timeRange: TimeRange): Map<TranslationMethod, MethodMetrics> {
    const methodMap = new Map<TranslationMethod, MethodMetrics>();
    const methodUsage = this.metrics.get('method_usage') || [];
    
    // Initialize all methods
    Object.values(TranslationMethod).forEach(method => {
      methodMap.set(method, {
        successRate: 0,
        averageQuality: 0,
        averageTime: 0,
        userPreference: 0,
        totalUsage: 0
      });
    });

    // Calculate metrics for each method
    methodUsage
      .filter(entry => entry.timestamp >= timeRange.start && entry.timestamp <= timeRange.end)
      .forEach(entry => {
        const method = entry.metadata?.method as TranslationMethod;
        if (method && methodMap.has(method)) {
          const metrics = methodMap.get(method)!;
          metrics.totalUsage += entry.value;
        }
      });

    return methodMap;
  }

  public getRecentEvents(count = 100): TranslationEvent[] {
    return this.events.slice(-count);
  }

  public getEventsByType(eventType: EventType, count = 100): TranslationEvent[] {
    return this.events
      .filter(event => event.type === eventType)
      .slice(-count);
  }

  public clearMetrics(): void {
    this.metrics.clear();
    this.events = [];
    this.initializeMetrics();
    defaultLogger.info('Metrics cleared', {}, 'MetricsCollector');
  }

  public exportMetrics(): string {
    const exportData = {
      metrics: Object.fromEntries(this.metrics),
      events: this.events,
      exportTimestamp: new Date().toISOString()
    };
    return JSON.stringify(exportData, null, 2);
  }

  public getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: any;
  } {
    const recentMetrics = this.getMetrics();
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check purity rate
    if (recentMetrics.purityRate < 95) {
      issues.push(`Low purity rate: ${recentMetrics.purityRate.toFixed(2)}%`);
      status = 'warning';
    }

    if (recentMetrics.purityRate < 90) {
      status = 'critical';
    }

    // Check failure rate
    if (recentMetrics.failureRate > 5) {
      issues.push(`High failure rate: ${recentMetrics.failureRate.toFixed(2)}%`);
      status = status === 'critical' ? 'critical' : 'warning';
    }

    // Check processing time
    if (recentMetrics.averageProcessingTime > 10000) {
      issues.push(`Slow processing: ${recentMetrics.averageProcessingTime}ms average`);
      status = status === 'critical' ? 'critical' : 'warning';
    }

    return {
      status,
      issues,
      metrics: {
        purityRate: recentMetrics.purityRate,
        failureRate: recentMetrics.failureRate,
        averageProcessingTime: recentMetrics.averageProcessingTime,
        totalTranslations: recentMetrics.totalTranslations
      }
    };
  }
}