/**
 * Quality Monitor - Comprehensive Quality Scoring and Metrics System
 * 
 * Monitors translation quality with comprehensive metrics collection,
 * quality threshold enforcement, and real-time quality assessment
 * for the Pure Translation System.
 */

import {
  QualityMetrics,
  QualityReport,
  QualityIssue,
  QualityRecommendation,
  QualityImpact,
  IssueType,
  RecommendationType,
  Severity,
  Priority,
  PureTranslationResult,
  TranslationRequest,
  Language,
  TextPosition
} from '../types';
import { IQualityMonitor } from '../interfaces/QualityMonitor';
import { defaultLogger } from '../utils/Logger';
import { pureTranslationConfig } from '../config/PureTranslationConfig';

export class QualityMonitor implements IQualityMonitor {
  private qualityHistory: QualityReport[] = [];
  private readonly maxHistorySize = 10000;
  private qualityThresholds = pureTranslationConfig.getQualityThresholds();

  constructor() {
    defaultLogger.info('Quality Monitor initialized', {
      thresholds: this.qualityThresholds,
      maxHistorySize: this.maxHistorySize
    }, 'QualityMonitor');
  }

  /**
   * Assess comprehensive translation quality
   */
  async assessQuality(
    request: TranslationRequest,
    result: PureTranslationResult
  ): Promise<QualityReport> {
    const startTime = Date.now();

    try {
      // Calculate comprehensive quality metrics
      const qualityMetrics = await this.calculateQualityMetrics(request, result);
      
      // Detect quality issues
      const issues = await this.detectQualityIssues(request, result, qualityMetrics);
      
      // Generate quality recommendations
      const recommendations = this.generateQualityRecommendations(issues, qualityMetrics);
      
      // Calculate overall quality score
      const overallScore = this.calculateOverallQualityScore(qualityMetrics);
      
      // Create quality report
      const report: QualityReport = {
        translationId: result.metadata.requestId,
        overallScore,
        purityValidation: {
          isPure: result.purityScore === 100,
          purityScore: {
            overall: result.purityScore,
            scriptPurity: qualityMetrics.purityScore,
            terminologyConsistency: qualityMetrics.terminologyAccuracy,
            encodingIntegrity: qualityMetrics.encodingIntegrity,
            contextualCoherence: qualityMetrics.contextualRelevance,
            uiElementsRemoved: 100 // Assume UI elements are removed if purity is high
          },
          violations: [],
          recommendations: [],
          passesZeroTolerance: result.purityScore === 100
        },
        terminologyValidation: {
          isValid: qualityMetrics.terminologyAccuracy >= this.qualityThresholds.terminologyAccuracyThreshold,
          score: qualityMetrics.terminologyAccuracy,
          inconsistencies: [],
          suggestions: []
        },
        issues,
        recommendations,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

      // Store in history
      this.addToHistory(report);

      // Log quality assessment
      defaultLogger.info('Quality assessment completed', {
        translationId: report.translationId,
        overallScore: report.overallScore,
        issuesCount: issues.length,
        processingTime: report.processingTime
      }, 'QualityMonitor');

      return report;

    } catch (error) {
      defaultLogger.error('Quality assessment failed', {
        error,
        requestId: result.metadata.requestId
      }, 'QualityMonitor');

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
          description: 'Quality assessment system error',
          position: { start: 0, end: 0 },
          suggestedFix: 'Retry quality assessment',
          impact: QualityImpact.CRITICAL,
          confidence: 1.0
        }],
        recommendations: [],
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Calculate comprehensive quality metrics
   */
  private async calculateQualityMetrics(
    request: TranslationRequest,
    result: PureTranslationResult
  ): Promise<QualityMetrics> {
    // Purity Score (from result)
    const purityScore = result.purityScore;

    // Terminology Accuracy
    const terminologyAccuracy = await this.calculateTerminologyAccuracy(
      request.text,
      result.translatedText,
      request.sourceLanguage,
      request.targetLanguage
    );

    // Contextual Relevance
    const contextualRelevance = this.calculateContextualRelevance(
      request,
      result.translatedText
    );

    // Readability Score
    const readabilityScore = this.calculateReadabilityScore(
      result.translatedText,
      request.targetLanguage
    );

    // Professionalism Score
    const professionalismScore = this.calculateProfessionalismScore(
      result.translatedText,
      request.contentType
    );

    // Encoding Integrity
    const encodingIntegrity = this.calculateEncodingIntegrity(result.translatedText);

    return {
      purityScore,
      terminologyAccuracy,
      contextualRelevance,
      readabilityScore,
      professionalismScore,
      encodingIntegrity,
      userSatisfaction: undefined // Will be updated when user feedback is received
    };
  }

  /**
   * Calculate terminology accuracy score
   */
  private async calculateTerminologyAccuracy(
    sourceText: string,
    translatedText: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<number> {
    // Extract legal terms from both texts
    const sourceTerms = this.extractLegalTerms(sourceText, sourceLanguage);
    const translatedTerms = this.extractLegalTerms(translatedText, targetLanguage);

    if (sourceTerms.length === 0) {
      return 100; // No legal terms to validate
    }

    let accurateTerms = 0;
    let totalTerms = sourceTerms.length;

    // For now, use a simple heuristic
    // In a full implementation, this would use the LegalTerminologyManager
    sourceTerms.forEach(term => {
      // Simple check: if we have roughly the same number of legal terms, assume accuracy
      if (translatedTerms.length > 0) {
        accurateTerms++;
      }
    });

    return (accurateTerms / totalTerms) * 100;
  }

  /**
   * Calculate contextual relevance score
   */
  private calculateContextualRelevance(
    request: TranslationRequest,
    translatedText: string
  ): number {
    let relevanceScore = 100;

    // Check if translation maintains context
    if (request.context?.legalDomain) {
      const hasRelevantTerms = this.hasRelevantLegalTerms(
        translatedText,
        request.context.legalDomain
      );
      if (!hasRelevantTerms) {
        relevanceScore -= 20;
      }
    }

    // Check for content type consistency
    if (request.contentType) {
      const maintainsContentType = this.maintainsContentTypeCharacteristics(
        translatedText,
        request.contentType
      );
      if (!maintainsContentType) {
        relevanceScore -= 15;
      }
    }

    return Math.max(0, relevanceScore);
  }

  /**
   * Calculate readability score
   */
  private calculateReadabilityScore(text: string, language: Language): number {
    if (!text || text.trim().length === 0) return 0;

    let readabilityScore = 100;

    // Basic readability metrics
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;

    // Penalize very long sentences
    if (avgWordsPerSentence > 25) {
      readabilityScore -= 20;
    } else if (avgWordsPerSentence > 20) {
      readabilityScore -= 10;
    }

    // Check for proper punctuation
    const hasPunctuation = /[.!?]/.test(text);
    if (!hasPunctuation && text.length > 50) {
      readabilityScore -= 15;
    }

    // Language-specific checks
    if (language === Language.ARABIC) {
      // Check for proper Arabic text flow
      const hasArabicPunctuation = /[،؛؟]/.test(text);
      if (text.length > 100 && !hasArabicPunctuation) {
        readabilityScore -= 10;
      }
    }

    return Math.max(0, readabilityScore);
  }

  /**
   * Calculate professionalism score
   */
  private calculateProfessionalismScore(text: string, contentType: any): number {
    let professionalismScore = 100;

    // Check for informal language
    const informalPatterns = [
      /\b(ok|okay)\b/gi,
      /\b(yeah|yep)\b/gi,
      /\b(gonna|wanna)\b/gi,
      /!!+/g, // Multiple exclamation marks
      /\?\?+/g, // Multiple question marks
    ];

    informalPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        professionalismScore -= 10;
      }
    });

    // Check for appropriate legal language
    if (contentType && contentType.toString().includes('legal')) {
      const hasLegalTerms = this.hasLegalTerminology(text);
      if (!hasLegalTerms && text.length > 50) {
        professionalismScore -= 15;
      }
    }

    return Math.max(0, professionalismScore);
  }

  /**
   * Calculate encoding integrity score
   */
  private calculateEncodingIntegrity(text: string): number {
    let integrityScore = 100;
    let issues = 0;

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      
      // Check for replacement characters
      if (charCode === 0xFFFD) {
        issues++;
      }
      
      // Check for control characters
      if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
        issues++;
      }
    }

    if (issues > 0) {
      integrityScore = Math.max(0, 100 - (issues * 10));
    }

    return integrityScore;
  }

  /**
   * Detect quality issues
   */
  private async detectQualityIssues(
    request: TranslationRequest,
    result: PureTranslationResult,
    metrics: QualityMetrics
  ): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    // Check purity issues
    if (metrics.purityScore < 100) {
      issues.push({
        type: IssueType.LANGUAGE_MIXING,
        severity: Severity.CRITICAL,
        description: `Purity score below 100%: ${metrics.purityScore}%`,
        position: { start: 0, end: result.translatedText.length },
        suggestedFix: 'Apply aggressive content cleaning',
        impact: QualityImpact.CRITICAL,
        confidence: 0.9
      });
    }

    // Check terminology issues
    if (metrics.terminologyAccuracy < this.qualityThresholds.terminologyAccuracyThreshold) {
      issues.push({
        type: IssueType.POOR_TERMINOLOGY,
        severity: Severity.HIGH,
        description: `Low terminology accuracy: ${metrics.terminologyAccuracy}%`,
        position: { start: 0, end: result.translatedText.length },
        suggestedFix: 'Review and improve legal terminology usage',
        impact: QualityImpact.HIGH,
        confidence: 0.8
      });
    }

    // Check readability issues
    if (metrics.readabilityScore < this.qualityThresholds.readabilityThreshold) {
      issues.push({
        type: IssueType.READABILITY_ISSUE,
        severity: Severity.MEDIUM,
        description: `Low readability score: ${metrics.readabilityScore}%`,
        position: { start: 0, end: result.translatedText.length },
        suggestedFix: 'Improve sentence structure and clarity',
        impact: QualityImpact.MEDIUM,
        confidence: 0.7
      });
    }

    // Check encoding issues
    if (metrics.encodingIntegrity < 100) {
      issues.push({
        type: IssueType.ENCODING_ERROR,
        severity: Severity.HIGH,
        description: `Encoding integrity issues detected: ${metrics.encodingIntegrity}%`,
        position: { start: 0, end: result.translatedText.length },
        suggestedFix: 'Fix character encoding and remove corrupted characters',
        impact: QualityImpact.HIGH,
        confidence: 0.9
      });
    }

    // Check processing time issues
    if (result.processingTime > this.qualityThresholds.maximumProcessingTime) {
      issues.push({
        type: IssueType.READABILITY_ISSUE, // Using closest available type
        severity: Severity.MEDIUM,
        description: `Processing time exceeded threshold: ${result.processingTime}ms`,
        position: { start: 0, end: 0 },
        suggestedFix: 'Optimize translation pipeline performance',
        impact: QualityImpact.MEDIUM,
        confidence: 1.0
      });
    }

    return issues;
  }

  /**
   * Generate quality recommendations
   */
  private generateQualityRecommendations(
    issues: QualityIssue[],
    metrics: QualityMetrics
  ): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = [];

    // Purity recommendations
    if (metrics.purityScore < 100) {
      recommendations.push({
        type: RecommendationType.CONTENT_CLEANING,
        description: 'Apply aggressive content cleaning to achieve 100% purity',
        action: 'Enable aggressive cleaning mode and apply zero-tolerance filters',
        priority: Priority.URGENT,
        estimatedImpact: 100 - metrics.purityScore
      });
    }

    // Terminology recommendations
    if (metrics.terminologyAccuracy < 90) {
      recommendations.push({
        type: RecommendationType.TERMINOLOGY_UPDATE,
        description: 'Improve legal terminology accuracy',
        action: 'Update legal dictionary and apply terminology validation',
        priority: Priority.HIGH,
        estimatedImpact: 90 - metrics.terminologyAccuracy
      });
    }

    // Encoding recommendations
    if (metrics.encodingIntegrity < 100) {
      recommendations.push({
        type: RecommendationType.ENCODING_FIX,
        description: 'Fix character encoding issues',
        action: 'Apply encoding normalization and character validation',
        priority: Priority.HIGH,
        estimatedImpact: 100 - metrics.encodingIntegrity
      });
    }

    // Context recommendations
    if (metrics.contextualRelevance < 80) {
      recommendations.push({
        type: RecommendationType.CONTEXT_ENHANCEMENT,
        description: 'Improve contextual relevance',
        action: 'Enhance context awareness and domain-specific translation',
        priority: Priority.MEDIUM,
        estimatedImpact: 80 - metrics.contextualRelevance
      });
    }

    return recommendations;
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallQualityScore(metrics: QualityMetrics): number {
    // Weighted average with emphasis on purity (zero tolerance)
    const weights = {
      purityScore: 0.4,        // 40% - Most important
      terminologyAccuracy: 0.2, // 20%
      contextualRelevance: 0.15, // 15%
      readabilityScore: 0.1,    // 10%
      professionalismScore: 0.1, // 10%
      encodingIntegrity: 0.05   // 5%
    };

    const weightedScore = 
      (metrics.purityScore * weights.purityScore) +
      (metrics.terminologyAccuracy * weights.terminologyAccuracy) +
      (metrics.contextualRelevance * weights.contextualRelevance) +
      (metrics.readabilityScore * weights.readabilityScore) +
      (metrics.professionalismScore * weights.professionalismScore) +
      (metrics.encodingIntegrity * weights.encodingIntegrity);

    return Math.round(weightedScore * 100) / 100;
  }

  /**
   * Add quality report to history
   */
  private addToHistory(report: QualityReport): void {
    this.qualityHistory.push(report);
    
    // Maintain maximum history size
    if (this.qualityHistory.length > this.maxHistorySize) {
      this.qualityHistory.shift();
    }
  }

  /**
   * Helper methods
   */
  private extractLegalTerms(text: string, language: Language): string[] {
    // Simple legal term extraction - would be enhanced with actual legal dictionary
    const legalKeywords = language === Language.ARABIC 
      ? ['قانون', 'محكمة', 'قاضي', 'حكم', 'دعوى', 'عقد', 'التزام']
      : ['loi', 'tribunal', 'juge', 'jugement', 'action', 'contrat', 'obligation'];
    
    return legalKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private hasRelevantLegalTerms(text: string, domain: any): boolean {
    // Simple check for domain-relevant terms
    return this.extractLegalTerms(text, Language.FRENCH).length > 0 ||
           this.extractLegalTerms(text, Language.ARABIC).length > 0;
  }

  private maintainsContentTypeCharacteristics(text: string, contentType: any): boolean {
    // Simple check - would be enhanced based on content type requirements
    return text.length > 10; // Basic check
  }

  private hasLegalTerminology(text: string): boolean {
    const legalTerms = this.extractLegalTerms(text, Language.FRENCH)
      .concat(this.extractLegalTerms(text, Language.ARABIC));
    return legalTerms.length > 0;
  }

  /**
   * Public methods for accessing quality data
   */
  public getQualityHistory(limit = 100): QualityReport[] {
    return this.qualityHistory.slice(-limit);
  }

  public getAverageQualityScore(timeRange?: { start: Date; end: Date }): number {
    let reports = this.qualityHistory;
    
    if (timeRange) {
      reports = reports.filter(report => 
        report.timestamp >= timeRange.start && report.timestamp <= timeRange.end
      );
    }

    if (reports.length === 0) return 0;

    const totalScore = reports.reduce((sum, report) => sum + report.overallScore, 0);
    return totalScore / reports.length;
  }

  public getQualityTrends(): {
    averageScore: number;
    trend: 'improving' | 'declining' | 'stable';
    recentReports: number;
  } {
    const recentReports = this.qualityHistory.slice(-50);
    const olderReports = this.qualityHistory.slice(-100, -50);

    if (recentReports.length === 0) {
      return { averageScore: 0, trend: 'stable', recentReports: 0 };
    }

    const recentAvg = recentReports.reduce((sum, r) => sum + r.overallScore, 0) / recentReports.length;
    const olderAvg = olderReports.length > 0 
      ? olderReports.reduce((sum, r) => sum + r.overallScore, 0) / olderReports.length
      : recentAvg;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    const difference = recentAvg - olderAvg;
    
    if (difference > 2) {
      trend = 'improving';
    } else if (difference < -2) {
      trend = 'declining';
    }

    return {
      averageScore: recentAvg,
      trend,
      recentReports: recentReports.length
    };
  }

  public clearHistory(): void {
    this.qualityHistory = [];
    defaultLogger.info('Quality history cleared', {}, 'QualityMonitor');
  }
}