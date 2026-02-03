/**
 * Real-Time Quality Monitor - Advanced Quality Monitoring and Metrics Collection
 * 
 * Implements comprehensive real-time translation quality monitoring,
 * metrics collection and analysis, and quality threshold alerting system
 * for continuous quality assurance and improvement.
 */

import {
  QualityMetrics,
  TranslationRequest,
  PureTranslationResult,
  QualityReport,
  QualityIssue,
  IssueType,
  Severity,
  Language,
  TranslationMethod,
  EventType
} from '../types';
import { MetricsCollector } from './MetricsCollector';
import { defaultLogger } from '../utils/Logger';
import { pureTranslationConfig } from '../config/PureTranslationConfig';

export interface QualityAlert {
  id: string;
  type: 'threshold_breach' | 'quality_degradation' | 'system_anomaly' | 'user_complaint';
  severity: Severity;
  message: string;
  timestamp: Date;
  data: any;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export interface QualityThreshold {
  metric: string;
  minValue?: number;
  maxValue?: number;
  alertSeverity: Severity;
  enabled: boolean;
  description: string;
}

export interface QualityTrend {
  metric: string;
  timeRange: { start: Date; end: Date };
  values: { timestamp: Date; value: number }[];
  trend: 'improving' | 'stable' | 'declining';
  changeRate: number;
  confidence: number;
}

export interface SystemHealthMetrics {
  overallHealth: number; // 0-100
  purityRate: number;
  qualityScore: number;
  errorRate: number;
  processingSpeed: number;
  userSatisfaction: number;
  systemLoad: number;
  alertsCount: number;
  lastUpdated: Date;
}

export class RealTimeQualityMonitor {
  private metricsCollector: MetricsCollector;
  private qualityAlerts: Map<string, QualityAlert> = new Map();
  private qualityThresholds: Map<string, QualityThreshold> = new Map();
  private qualityHistory: QualityMetrics[] = [];
  private readonly maxHistorySize = 50000;
  
  // Real-time monitoring state
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private readonly monitoringFrequency = 5000; // 5 seconds
  
  // Quality statistics
  private qualityStats = {
    totalAssessments: 0,
    averageQualityScore: 0,
    purityViolations: 0,
    qualityImprovements: 0,
    alertsGenerated: 0,
    thresholdBreaches: 0
  };

  constructor() {
    this.metricsCollector = new MetricsCollector();
    this.initializeQualityThresholds();
    this.startRealTimeMonitoring();
    
    defaultLogger.info('Real-Time Quality Monitor initialized', {
      thresholdsCount: this.qualityThresholds.size,
      monitoringFrequency: this.monitoringFrequency,
      maxHistorySize: this.maxHistorySize
    }, 'RealTimeQualityMonitor');
  }

  /**
   * Initialize quality thresholds for alerting
   */
  private initializeQualityThresholds(): void {
    // Purity thresholds (zero tolerance)
    this.addQualityThreshold({
      metric: 'purity_score',
      minValue: 100, // Must be exactly 100%
      alertSeverity: Severity.CRITICAL,
      enabled: true,
      description: 'Zero tolerance purity requirement'
    });

    // Quality score thresholds
    this.addQualityThreshold({
      metric: 'overall_quality',
      minValue: 85,
      alertSeverity: Severity.HIGH,
      enabled: true,
      description: 'Minimum acceptable quality score'
    });

    // Processing time thresholds
    this.addQualityThreshold({
      metric: 'processing_time',
      maxValue: 30000, // 30 seconds
      alertSeverity: Severity.MEDIUM,
      enabled: true,
      description: 'Maximum acceptable processing time'
    });

    // Error rate thresholds
    this.addQualityThreshold({
      metric: 'error_rate',
      maxValue: 5, // 5%
      alertSeverity: Severity.HIGH,
      enabled: true,
      description: 'Maximum acceptable error rate'
    });

    // Terminology accuracy thresholds
    this.addQualityThreshold({
      metric: 'terminology_accuracy',
      minValue: 90,
      alertSeverity: Severity.MEDIUM,
      enabled: true,
      description: 'Minimum legal terminology accuracy'
    });

    // User satisfaction thresholds
    this.addQualityThreshold({
      metric: 'user_satisfaction',
      minValue: 80,
      alertSeverity: Severity.MEDIUM,
      enabled: true,
      description: 'Minimum user satisfaction score'
    });

    // System load thresholds
    this.addQualityThreshold({
      metric: 'system_load',
      maxValue: 85, // 85%
      alertSeverity: Severity.HIGH,
      enabled: true,
      description: 'Maximum system load before performance degradation'
    });
  }

  /**
   * Start real-time quality monitoring
   */
  private startRealTimeMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performQualityCheck();
    }, this.monitoringFrequency);

    defaultLogger.info('Real-time quality monitoring started', {
      frequency: this.monitoringFrequency
    }, 'RealTimeQualityMonitor');
  }

  /**
   * Stop real-time quality monitoring
   */
  private stopRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    this.isMonitoring = false;
    defaultLogger.info('Real-time quality monitoring stopped', {}, 'RealTimeQualityMonitor');
  }

  /**
   * Perform periodic quality check
   */
  private async performQualityCheck(): Promise<void> {
    try {
      // Get current system metrics
      const systemMetrics = this.metricsCollector.getMetrics();
      const systemHealth = this.metricsCollector.getSystemHealth();
      
      // Check quality thresholds
      await this.checkQualityThresholds(systemMetrics);
      
      // Analyze quality trends
      this.analyzeQualityTrends();
      
      // Update system health metrics
      this.updateSystemHealthMetrics(systemMetrics, systemHealth);
      
      // Clean up old data
      this.cleanupOldData();

    } catch (error) {
      defaultLogger.error('Quality monitoring check failed', {
        error: error.message
      }, 'RealTimeQualityMonitor');
    }
  }

  /**
   * Monitor translation quality in real-time
   */
  async monitorTranslationQuality(
    request: TranslationRequest,
    result: PureTranslationResult
  ): Promise<QualityReport> {
    const startTime = Date.now();
    
    try {
      // Extract quality metrics from result
      const qualityMetrics = result.qualityMetrics;
      
      // Add to quality history
      this.addToQualityHistory(qualityMetrics);
      
      // Check for immediate quality issues
      const qualityIssues = await this.detectQualityIssues(request, result, qualityMetrics);
      
      // Generate quality alerts if needed
      await this.generateQualityAlerts(qualityMetrics, qualityIssues);
      
      // Create quality report
      const qualityReport: QualityReport = {
        translationId: result.metadata.requestId,
        overallScore: this.calculateOverallQualityScore(qualityMetrics),
        purityValidation: {
          isPure: result.purityScore === 100,
          purityScore: {
            overall: result.purityScore,
            scriptPurity: qualityMetrics.purityScore,
            terminologyConsistency: qualityMetrics.terminologyAccuracy,
            encodingIntegrity: qualityMetrics.encodingIntegrity,
            contextualCoherence: qualityMetrics.contextualRelevance,
            uiElementsRemoved: 100
          },
          violations: [],
          recommendations: [],
          passesZeroTolerance: result.purityScore === 100
        },
        terminologyValidation: {
          isValid: qualityMetrics.terminologyAccuracy >= 90,
          score: qualityMetrics.terminologyAccuracy,
          inconsistencies: [],
          suggestions: []
        },
        issues: qualityIssues,
        recommendations: this.generateQualityRecommendations(qualityIssues, qualityMetrics),
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

      // Update statistics
      this.updateQualityStatistics(qualityReport);

      defaultLogger.debug('Translation quality monitored', {
        translationId: result.metadata.requestId,
        overallScore: qualityReport.overallScore,
        purityScore: result.purityScore,
        issuesCount: qualityIssues.length,
        processingTime: qualityReport.processingTime
      }, 'RealTimeQualityMonitor');

      return qualityReport;

    } catch (error) {
      defaultLogger.error('Quality monitoring failed', {
        translationId: result.metadata.requestId,
        error: error.message
      }, 'RealTimeQualityMonitor');

      // Return minimal quality report for error case
      return {
        translationId: result.metadata.requestId,
        overallScore: 0,
        purityValidation: {
          isPure: false,
          purityScore: {
            overall: 0,
            scriptPurity: 0,
            terminologyConsistency: 0,
            encodingIntegrity: 0,
            contextualCoherence: 0,
            uiElementsRemoved: 0
          },
          violations: [],
          recommendations: [],
          passesZeroTolerance: false
        },
        terminologyValidation: {
          isValid: false,
          score: 0,
          inconsistencies: [],
          suggestions: []
        },
        issues: [{
          type: IssueType.ENCODING_ERROR,
          severity: Severity.CRITICAL,
          description: 'Quality monitoring system error',
          position: { start: 0, end: 0 },
          suggestedFix: 'Retry quality assessment',
          impact: 'critical' as any,
          confidence: 1.0
        }],
        recommendations: [],
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Detect quality issues in translation
   */
  private async detectQualityIssues(
    request: TranslationRequest,
    result: PureTranslationResult,
    metrics: QualityMetrics
  ): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Critical purity issues (zero tolerance)
    if (metrics.purityScore < 100) {
      issues.push({
        type: IssueType.LANGUAGE_MIXING,
        severity: Severity.CRITICAL,
        description: `Purity violation: ${metrics.purityScore}% (requires 100%)`,
        position: { start: 0, end: result.translatedText.length },
        suggestedFix: 'Apply zero-tolerance content cleaning',
        impact: 'critical' as any,
        confidence: 0.95
      });
    }

    // Terminology accuracy issues
    if (metrics.terminologyAccuracy < 90) {
      issues.push({
        type: IssueType.POOR_TERMINOLOGY,
        severity: Severity.HIGH,
        description: `Low terminology accuracy: ${metrics.terminologyAccuracy}%`,
        position: { start: 0, end: result.translatedText.length },
        suggestedFix: 'Review and correct legal terminology',
        impact: 'high' as any,
        confidence: 0.8
      });
    }

    // Encoding integrity issues
    if (metrics.encodingIntegrity < 100) {
      issues.push({
        type: IssueType.ENCODING_ERROR,
        severity: Severity.HIGH,
        description: `Encoding integrity issues: ${metrics.encodingIntegrity}%`,
        position: { start: 0, end: result.translatedText.length },
        suggestedFix: 'Fix character encoding and remove corrupted characters',
        impact: 'high' as any,
        confidence: 0.9
      });
    }

    // Processing time issues
    if (result.processingTime > 30000) {
      issues.push({
        type: IssueType.READABILITY_ISSUE,
        severity: Severity.MEDIUM,
        description: `Slow processing: ${result.processingTime}ms`,
        position: { start: 0, end: 0 },
        suggestedFix: 'Optimize translation pipeline performance',
        impact: 'medium' as any,
        confidence: 1.0
      });
    }

    // Contextual relevance issues
    if (metrics.contextualRelevance < 80) {
      issues.push({
        type: IssueType.CONTEXT_LOSS,
        severity: Severity.MEDIUM,
        description: `Low contextual relevance: ${metrics.contextualRelevance}%`,
        position: { start: 0, end: result.translatedText.length },
        suggestedFix: 'Improve context awareness and domain-specific translation',
        impact: 'medium' as any,
        confidence: 0.7
      });
    }

    // Readability issues
    if (metrics.readabilityScore < 70) {
      issues.push({
        type: IssueType.READABILITY_ISSUE,
        severity: Severity.LOW,
        description: `Low readability: ${metrics.readabilityScore}%`,
        position: { start: 0, end: result.translatedText.length },
        suggestedFix: 'Improve sentence structure and clarity',
        impact: 'low' as any,
        confidence: 0.6
      });
    }

    return issues;
  }

  /**
   * Generate quality alerts based on metrics and issues
   */
  private async generateQualityAlerts(
    metrics: QualityMetrics,
    issues: QualityIssue[]
  ): Promise<void> {
    // Check for critical purity violations
    if (metrics.purityScore < 100) {
      await this.createAlert({
        type: 'threshold_breach',
        severity: Severity.CRITICAL,
        message: `CRITICAL: Purity violation detected (${metrics.purityScore}%). Zero tolerance policy requires 100% purity.`,
        data: { metric: 'purity_score', value: metrics.purityScore, threshold: 100 }
      });
    }

    // Check for quality degradation
    const recentQuality = this.getRecentAverageQuality();
    const overallQuality = this.calculateOverallQualityScore(metrics);
    
    if (recentQuality > 0 && overallQuality < recentQuality - 10) {
      await this.createAlert({
        type: 'quality_degradation',
        severity: Severity.HIGH,
        message: `Quality degradation detected: Current ${overallQuality}%, Recent average ${recentQuality}%`,
        data: { currentQuality: overallQuality, recentAverage: recentQuality }
      });
    }

    // Check for multiple critical issues
    const criticalIssues = issues.filter(issue => issue.severity === Severity.CRITICAL);
    if (criticalIssues.length > 1) {
      await this.createAlert({
        type: 'system_anomaly',
        severity: Severity.CRITICAL,
        message: `Multiple critical quality issues detected (${criticalIssues.length} issues)`,
        data: { criticalIssuesCount: criticalIssues.length, issues: criticalIssues }
      });
    }
  }

  /**
   * Check quality thresholds and generate alerts
   */
  private async checkQualityThresholds(systemMetrics: any): Promise<void> {
    for (const [metricName, threshold] of this.qualityThresholds) {
      if (!threshold.enabled) continue;

      const metricValue = this.extractMetricValue(systemMetrics, metricName);
      if (metricValue === null) continue;

      let thresholdBreached = false;
      let breachType = '';

      if (threshold.minValue !== undefined && metricValue < threshold.minValue) {
        thresholdBreached = true;
        breachType = 'below minimum';
      }

      if (threshold.maxValue !== undefined && metricValue > threshold.maxValue) {
        thresholdBreached = true;
        breachType = 'above maximum';
      }

      if (thresholdBreached) {
        await this.createAlert({
          type: 'threshold_breach',
          severity: threshold.alertSeverity,
          message: `Threshold breach: ${metricName} is ${breachType} (${metricValue} vs ${threshold.minValue || threshold.maxValue})`,
          data: { 
            metric: metricName, 
            value: metricValue, 
            threshold: threshold.minValue || threshold.maxValue,
            breachType 
          }
        });

        this.qualityStats.thresholdBreaches++;
      }
    }
  }

  /**
   * Analyze quality trends over time
   */
  private analyzeQualityTrends(): void {
    if (this.qualityHistory.length < 10) return; // Need minimum data points

    const recentHistory = this.qualityHistory.slice(-50); // Last 50 assessments
    const metrics = ['purityScore', 'terminologyAccuracy', 'contextualRelevance', 'readabilityScore'];

    metrics.forEach(metric => {
      const values = recentHistory.map(h => (h as any)[metric]).filter(v => v !== undefined);
      if (values.length < 5) return;

      const trend = this.calculateTrend(values);
      
      if (trend.trend === 'declining' && trend.changeRate < -5) {
        this.createAlert({
          type: 'quality_degradation',
          severity: Severity.MEDIUM,
          message: `Declining trend detected in ${metric}: ${trend.changeRate.toFixed(2)}% change`,
          data: { metric, trend }
        });
      }
    });
  }

  /**
   * Calculate trend for a series of values
   */
  private calculateTrend(values: number[]): QualityTrend {
    if (values.length < 2) {
      return {
        metric: '',
        timeRange: { start: new Date(), end: new Date() },
        values: [],
        trend: 'stable',
        changeRate: 0,
        confidence: 0
      };
    }

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    
    const changeRate = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (changeRate > 2) trend = 'improving';
    else if (changeRate < -2) trend = 'declining';

    return {
      metric: '',
      timeRange: { start: new Date(), end: new Date() },
      values: [],
      trend,
      changeRate,
      confidence: Math.min(1, values.length / 20) // Higher confidence with more data points
    };
  }

  /**
   * Create quality alert
   */
  private async createAlert(alertData: {
    type: QualityAlert['type'];
    severity: Severity;
    message: string;
    data: any;
  }): Promise<string> {
    const alertId = this.generateAlertId();
    
    const alert: QualityAlert = {
      id: alertId,
      type: alertData.type,
      severity: alertData.severity,
      message: alertData.message,
      timestamp: new Date(),
      data: alertData.data,
      acknowledged: false
    };

    this.qualityAlerts.set(alertId, alert);
    this.qualityStats.alertsGenerated++;

    // Log alert
    defaultLogger.warn('Quality alert generated', {
      alertId,
      type: alert.type,
      severity: alert.severity,
      message: alert.message
    }, 'RealTimeQualityMonitor');

    // Trigger alert notifications (would integrate with notification system)
    await this.triggerAlertNotifications(alert);

    return alertId;
  }

  /**
   * Trigger alert notifications
   */
  private async triggerAlertNotifications(alert: QualityAlert): Promise<void> {
    // This would integrate with external notification systems
    // For now, just log the alert
    if (alert.severity === Severity.CRITICAL) {
      console.error(`🚨 CRITICAL QUALITY ALERT: ${alert.message}`);
    } else if (alert.severity === Severity.HIGH) {
      console.warn(`⚠️ HIGH QUALITY ALERT: ${alert.message}`);
    }
  }

  /**
   * Helper methods
   */
  private addToQualityHistory(metrics: QualityMetrics): void {
    this.qualityHistory.push(metrics);
    
    if (this.qualityHistory.length > this.maxHistorySize) {
      this.qualityHistory.shift();
    }
  }

  private calculateOverallQualityScore(metrics: QualityMetrics): number {
    const weights = {
      purityScore: 0.4,
      terminologyAccuracy: 0.2,
      contextualRelevance: 0.15,
      readabilityScore: 0.1,
      professionalismScore: 0.1,
      encodingIntegrity: 0.05
    };

    return (
      (metrics.purityScore * weights.purityScore) +
      (metrics.terminologyAccuracy * weights.terminologyAccuracy) +
      (metrics.contextualRelevance * weights.contextualRelevance) +
      (metrics.readabilityScore * weights.readabilityScore) +
      (metrics.professionalismScore * weights.professionalismScore) +
      (metrics.encodingIntegrity * weights.encodingIntegrity)
    );
  }

  private generateQualityRecommendations(issues: QualityIssue[], metrics: QualityMetrics): any[] {
    const recommendations: any[] = [];

    if (metrics.purityScore < 100) {
      recommendations.push({
        type: 'content_cleaning',
        description: 'Apply zero-tolerance content cleaning',
        priority: 'urgent',
        estimatedImpact: 100 - metrics.purityScore
      });
    }

    if (metrics.terminologyAccuracy < 90) {
      recommendations.push({
        type: 'terminology_update',
        description: 'Update legal terminology dictionary',
        priority: 'high',
        estimatedImpact: 90 - metrics.terminologyAccuracy
      });
    }

    return recommendations;
  }

  private updateQualityStatistics(report: QualityReport): void {
    this.qualityStats.totalAssessments++;
    
    const currentAvg = this.qualityStats.averageQualityScore;
    const newScore = report.overallScore;
    
    this.qualityStats.averageQualityScore = 
      (currentAvg * (this.qualityStats.totalAssessments - 1) + newScore) / this.qualityStats.totalAssessments;

    if (report.purityValidation.purityScore.overall < 100) {
      this.qualityStats.purityViolations++;
    }
  }

  private getRecentAverageQuality(): number {
    if (this.qualityHistory.length === 0) return 0;
    
    const recent = this.qualityHistory.slice(-10);
    const scores = recent.map(h => this.calculateOverallQualityScore(h));
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private extractMetricValue(systemMetrics: any, metricName: string): number | null {
    switch (metricName) {
      case 'purity_score':
        return systemMetrics.purityRate || null;
      case 'overall_quality':
        return systemMetrics.averageQualityScore || null;
      case 'processing_time':
        return systemMetrics.averageProcessingTime || null;
      case 'error_rate':
        return systemMetrics.failureRate || null;
      case 'terminology_accuracy':
        return 90; // Would be calculated from actual data
      case 'user_satisfaction':
        return systemMetrics.userSatisfactionScore || null;
      case 'system_load':
        return 50; // Would be calculated from actual system metrics
      default:
        return null;
    }
  }

  private updateSystemHealthMetrics(systemMetrics: any, systemHealth: any): void {
    // This would update a comprehensive system health dashboard
    // For now, just log the current state
    defaultLogger.debug('System health updated', {
      purityRate: systemMetrics.purityRate,
      qualityScore: systemMetrics.averageQualityScore,
      errorRate: systemMetrics.failureRate,
      systemStatus: systemHealth.status
    }, 'RealTimeQualityMonitor');
  }

  private cleanupOldData(): void {
    // Remove old alerts (keep last 1000)
    if (this.qualityAlerts.size > 1000) {
      const sortedAlerts = Array.from(this.qualityAlerts.entries())
        .sort(([,a], [,b]) => b.timestamp.getTime() - a.timestamp.getTime());
      
      const toKeep = sortedAlerts.slice(0, 1000);
      this.qualityAlerts.clear();
      toKeep.forEach(([id, alert]) => this.qualityAlerts.set(id, alert));
    }
  }

  private addQualityThreshold(threshold: QualityThreshold): void {
    this.qualityThresholds.set(threshold.metric, threshold);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Public API methods
   */
  public getQualityStatistics(): typeof this.qualityStats {
    return { ...this.qualityStats };
  }

  public getActiveAlerts(): QualityAlert[] {
    return Array.from(this.qualityAlerts.values())
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.qualityAlerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    return true;
  }

  public getSystemHealthMetrics(): SystemHealthMetrics {
    const recentQuality = this.getRecentAverageQuality();
    const systemMetrics = this.metricsCollector.getMetrics();
    
    return {
      overallHealth: Math.min(100, recentQuality),
      purityRate: systemMetrics.purityRate,
      qualityScore: recentQuality,
      errorRate: systemMetrics.failureRate,
      processingSpeed: systemMetrics.averageProcessingTime,
      userSatisfaction: systemMetrics.userSatisfactionScore,
      systemLoad: 50, // Would be calculated from actual metrics
      alertsCount: this.getActiveAlerts().length,
      lastUpdated: new Date()
    };
  }

  public updateQualityThreshold(metric: string, updates: Partial<QualityThreshold>): boolean {
    const threshold = this.qualityThresholds.get(metric);
    if (!threshold) return false;

    Object.assign(threshold, updates);
    return true;
  }

  public getQualityTrends(timeRange?: { start: Date; end: Date }): QualityTrend[] {
    // This would return comprehensive quality trends analysis
    // For now, return empty array
    return [];
  }

  public shutdown(): void {
    this.stopRealTimeMonitoring();
    defaultLogger.info('Real-Time Quality Monitor shutdown completed', {}, 'RealTimeQualityMonitor');
  }
}