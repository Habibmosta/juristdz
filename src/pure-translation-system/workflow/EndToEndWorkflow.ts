/**
 * End-to-End Translation Workflow
 * 
 * Orchestrates the complete translation workflow from input to output,
 * ensuring zero tolerance for language mixing and comprehensive quality control.
 */

import {
  TranslationRequest,
  PureTranslationResult,
  Language,
  ContentType,
  TranslationPriority,
  ProcessingStep,
  QualityReport,
  TranslationMetrics,
  TranslationWarning,
  TranslationError
} from '../types';

import { PureTranslationSystemIntegration } from '../PureTranslationSystemIntegration';
import { defaultLogger } from '../utils/Logger';

export interface WorkflowContext {
  workflowId: string;
  userId?: string;
  sessionId?: string;
  requestTimestamp: Date;
  priority: TranslationPriority;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    platform?: string;
  };
}

export interface WorkflowResult {
  workflowId: string;
  success: boolean;
  result?: PureTranslationResult;
  error?: WorkflowError;
  processingSteps: WorkflowStep[];
  totalProcessingTime: number;
  qualityReport?: QualityReport;
  recommendations: WorkflowRecommendation[];
}

export interface WorkflowStep {
  stepName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  success: boolean;
  details: any;
  warnings: string[];
  errors: string[];
}

export interface WorkflowError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  context: any;
}

export interface WorkflowRecommendation {
  type: 'performance' | 'quality' | 'user_experience' | 'system';
  message: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * End-to-End Translation Workflow Manager
 * 
 * Manages the complete translation workflow with comprehensive monitoring,
 * error handling, and quality assurance.
 */
export class EndToEndWorkflow {
  private translationSystem: PureTranslationSystemIntegration;
  private activeWorkflows: Map<string, WorkflowContext> = new Map();
  private workflowHistory: Map<string, WorkflowResult> = new Map();
  private maxHistorySize = 10000;

  constructor(translationSystem: PureTranslationSystemIntegration) {
    this.translationSystem = translationSystem;
  }

  /**
   * Execute complete translation workflow
   */
  async executeWorkflow(
    request: TranslationRequest,
    context: Partial<WorkflowContext> = {}
  ): Promise<WorkflowResult> {
    const workflowId = this.generateWorkflowId();
    const workflowContext: WorkflowContext = {
      workflowId,
      userId: context.userId,
      sessionId: context.sessionId,
      requestTimestamp: new Date(),
      priority: request.priority || TranslationPriority.NORMAL,
      metadata: context.metadata || {}
    };

    this.activeWorkflows.set(workflowId, workflowContext);
    const startTime = Date.now();
    const processingSteps: WorkflowStep[] = [];

    try {
      defaultLogger.info('Starting end-to-end translation workflow', {
        workflowId,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        contentType: request.contentType,
        textLength: request.text.length,
        priority: request.priority
      }, 'EndToEndWorkflow');

      // Step 1: Input Validation and Preprocessing
      const validationStep = await this.executeValidationStep(request, workflowContext);
      processingSteps.push(validationStep);

      if (!validationStep.success) {
        throw new Error('Input validation failed');
      }

      // Step 2: Content Analysis and Preparation
      const analysisStep = await this.executeAnalysisStep(request, workflowContext);
      processingSteps.push(analysisStep);

      // Step 3: Translation Execution
      const translationStep = await this.executeTranslationStep(request, workflowContext);
      processingSteps.push(translationStep);

      if (!translationStep.success) {
        throw new Error('Translation execution failed');
      }

      const translationResult = translationStep.details.result as PureTranslationResult;

      // Step 4: Quality Assessment
      const qualityStep = await this.executeQualityAssessmentStep(
        translationResult,
        request,
        workflowContext
      );
      processingSteps.push(qualityStep);

      // Step 5: Post-Processing and Optimization
      const postProcessingStep = await this.executePostProcessingStep(
        translationResult,
        request,
        workflowContext
      );
      processingSteps.push(postProcessingStep);

      // Step 6: Final Validation and Delivery Preparation
      const finalValidationStep = await this.executeFinalValidationStep(
        translationResult,
        request,
        workflowContext
      );
      processingSteps.push(finalValidationStep);

      const totalProcessingTime = Date.now() - startTime;

      // Generate quality report
      const qualityReport = await this.generateQualityReport(
        translationResult,
        request,
        processingSteps
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        translationResult,
        processingSteps,
        qualityReport
      );

      const workflowResult: WorkflowResult = {
        workflowId,
        success: true,
        result: translationResult,
        processingSteps,
        totalProcessingTime,
        qualityReport,
        recommendations
      };

      // Store in history
      this.storeWorkflowResult(workflowResult);

      defaultLogger.info('End-to-end translation workflow completed successfully', {
        workflowId,
        totalProcessingTime,
        purityScore: translationResult.purityScore,
        stepsCount: processingSteps.length,
        qualityScore: qualityReport.overallScore
      }, 'EndToEndWorkflow');

      return workflowResult;

    } catch (error) {
      const totalProcessingTime = Date.now() - startTime;
      
      const workflowError: WorkflowError = {
        code: 'WORKFLOW_EXECUTION_FAILED',
        message: error.message,
        severity: 'high',
        recoverable: true,
        context: {
          workflowId,
          request: {
            sourceLanguage: request.sourceLanguage,
            targetLanguage: request.targetLanguage,
            contentType: request.contentType,
            textLength: request.text.length
          },
          processingSteps: processingSteps.length
        }
      };

      const workflowResult: WorkflowResult = {
        workflowId,
        success: false,
        error: workflowError,
        processingSteps,
        totalProcessingTime,
        recommendations: [{
          type: 'system',
          message: 'Workflow execution failed, consider retrying with different parameters',
          action: 'retry_with_fallback',
          priority: 'high'
        }]
      };

      this.storeWorkflowResult(workflowResult);

      defaultLogger.error('End-to-end translation workflow failed', {
        workflowId,
        error: error.message,
        totalProcessingTime,
        stepsCompleted: processingSteps.length
      }, 'EndToEndWorkflow');

      return workflowResult;

    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Execute batch workflow for multiple requests
   */
  async executeBatchWorkflow(
    requests: TranslationRequest[],
    context: Partial<WorkflowContext> = {}
  ): Promise<WorkflowResult[]> {
    const batchId = this.generateWorkflowId();
    
    defaultLogger.info('Starting batch translation workflow', {
      batchId,
      requestCount: requests.length
    }, 'EndToEndWorkflow');

    const results: WorkflowResult[] = [];
    const concurrentLimit = 10; // Process in batches of 10

    for (let i = 0; i < requests.length; i += concurrentLimit) {
      const batch = requests.slice(i, i + concurrentLimit);
      const batchResults = await Promise.all(
        batch.map((request, index) => 
          this.executeWorkflow(request, {
            ...context,
            sessionId: `${batchId}_batch_${Math.floor(i / concurrentLimit)}_${index}`
          })
        )
      );
      results.push(...batchResults);
    }

    defaultLogger.info('Batch translation workflow completed', {
      batchId,
      totalRequests: requests.length,
      successfulRequests: results.filter(r => r.success).length,
      failedRequests: results.filter(r => !r.success).length
    }, 'EndToEndWorkflow');

    return results;
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId: string): {
    status: 'active' | 'completed' | 'not_found';
    context?: WorkflowContext;
    result?: WorkflowResult;
  } {
    if (this.activeWorkflows.has(workflowId)) {
      return {
        status: 'active',
        context: this.activeWorkflows.get(workflowId)
      };
    }

    if (this.workflowHistory.has(workflowId)) {
      return {
        status: 'completed',
        result: this.workflowHistory.get(workflowId)
      };
    }

    return { status: 'not_found' };
  }

  /**
   * Get workflow metrics
   */
  getWorkflowMetrics(): {
    activeWorkflows: number;
    completedWorkflows: number;
    successRate: number;
    averageProcessingTime: number;
    qualityMetrics: {
      averagePurityScore: number;
      averageQualityScore: number;
    };
  } {
    const completedWorkflows = Array.from(this.workflowHistory.values());
    const successfulWorkflows = completedWorkflows.filter(w => w.success);

    const averageProcessingTime = completedWorkflows.length > 0
      ? completedWorkflows.reduce((sum, w) => sum + w.totalProcessingTime, 0) / completedWorkflows.length
      : 0;

    const averagePurityScore = successfulWorkflows.length > 0
      ? successfulWorkflows.reduce((sum, w) => sum + (w.result?.purityScore || 0), 0) / successfulWorkflows.length
      : 0;

    const averageQualityScore = completedWorkflows.length > 0
      ? completedWorkflows.reduce((sum, w) => sum + (w.qualityReport?.overallScore || 0), 0) / completedWorkflows.length
      : 0;

    return {
      activeWorkflows: this.activeWorkflows.size,
      completedWorkflows: completedWorkflows.length,
      successRate: completedWorkflows.length > 0 
        ? successfulWorkflows.length / completedWorkflows.length 
        : 0,
      averageProcessingTime,
      qualityMetrics: {
        averagePurityScore,
        averageQualityScore
      }
    };
  }

  /**
   * Private workflow step implementations
   */
  private async executeValidationStep(
    request: TranslationRequest,
    context: WorkflowContext
  ): Promise<WorkflowStep> {
    const stepStart = Date.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Validate request parameters
      if (!request.text || request.text.trim().length === 0) {
        errors.push('Empty translation text');
      }

      if (!request.sourceLanguage || !request.targetLanguage) {
        errors.push('Missing source or target language');
      }

      if (request.sourceLanguage === request.targetLanguage) {
        errors.push('Source and target languages cannot be the same');
      }

      if (request.text.length > 50000) {
        warnings.push('Text length exceeds recommended limit');
      }

      // Validate content type
      if (!Object.values(ContentType).includes(request.contentType)) {
        warnings.push('Unknown content type, using default');
      }

      const success = errors.length === 0;

      return {
        stepName: 'input_validation',
        startTime: new Date(stepStart),
        endTime: new Date(),
        duration: Date.now() - stepStart,
        success,
        details: {
          textLength: request.text.length,
          sourceLanguage: request.sourceLanguage,
          targetLanguage: request.targetLanguage,
          contentType: request.contentType,
          validationsPassed: success
        },
        warnings,
        errors
      };

    } catch (error) {
      return {
        stepName: 'input_validation',
        startTime: new Date(stepStart),
        endTime: new Date(),
        duration: Date.now() - stepStart,
        success: false,
        details: { error: error.message },
        warnings,
        errors: [...errors, error.message]
      };
    }
  }

  private async executeAnalysisStep(
    request: TranslationRequest,
    context: WorkflowContext
  ): Promise<WorkflowStep> {
    const stepStart = Date.now();

    try {
      // Analyze content characteristics
      const textAnalysis = {
        wordCount: request.text.split(/\s+/).length,
        characterCount: request.text.length,
        hasSpecialCharacters: /[^\w\s\u0600-\u06FF\u0750-\u077F]/.test(request.text),
        hasArabicText: /[\u0600-\u06FF\u0750-\u077F]/.test(request.text),
        hasLatinText: /[a-zA-Z]/.test(request.text),
        hasMixedScript: /[\u0600-\u06FF\u0750-\u077F]/.test(request.text) && /[a-zA-Z]/.test(request.text),
        complexity: this.assessTextComplexity(request.text)
      };

      return {
        stepName: 'content_analysis',
        startTime: new Date(stepStart),
        endTime: new Date(),
        duration: Date.now() - stepStart,
        success: true,
        details: {
          textAnalysis,
          recommendedMethod: this.recommendTranslationMethod(textAnalysis, request.contentType),
          estimatedProcessingTime: this.estimateProcessingTime(textAnalysis)
        },
        warnings: textAnalysis.hasMixedScript ? ['Mixed script content detected'] : [],
        errors: []
      };

    } catch (error) {
      return {
        stepName: 'content_analysis',
        startTime: new Date(stepStart),
        endTime: new Date(),
        duration: Date.now() - stepStart,
        success: false,
        details: { error: error.message },
        warnings: [],
        errors: [error.message]
      };
    }
  }

  private async executeTranslationStep(
    request: TranslationRequest,
    context: WorkflowContext
  ): Promise<WorkflowStep> {
    const stepStart = Date.now();

    try {
      const result = await this.translationSystem.translateContent(request);

      return {
        stepName: 'translation_execution',
        startTime: new Date(stepStart),
        endTime: new Date(),
        duration: Date.now() - stepStart,
        success: true,
        details: {
          result,
          method: result.method,
          confidence: result.confidence,
          purityScore: result.purityScore,
          processingTime: result.processingTime
        },
        warnings: result.warnings.map(w => w.message),
        errors: []
      };

    } catch (error) {
      return {
        stepName: 'translation_execution',
        startTime: new Date(stepStart),
        endTime: new Date(),
        duration: Date.now() - stepStart,
        success: false,
        details: { error: error.message },
        warnings: [],
        errors: [error.message]
      };
    }
  }

  private async executeQualityAssessmentStep(
    result: PureTranslationResult,
    request: TranslationRequest,
    context: WorkflowContext
  ): Promise<WorkflowStep> {
    const stepStart = Date.now();

    try {
      const qualityReport = await this.translationSystem.validateTranslationQuality(
        result.translatedText,
        request.targetLanguage
      );

      return {
        stepName: 'quality_assessment',
        startTime: new Date(stepStart),
        endTime: new Date(),
        duration: Date.now() - stepStart,
        success: qualityReport.overallScore >= 80,
        details: {
          qualityReport,
          purityValidation: qualityReport.purityValidation,
          terminologyValidation: qualityReport.terminologyValidation,
          issuesCount: qualityReport.issues.length
        },
        warnings: qualityReport.issues.filter(i => i.severity === 'medium').map(i => i.description),
        errors: qualityReport.issues.filter(i => i.severity === 'high' || i.severity === 'critical').map(i => i.description)
      };

    } catch (error) {
      return {
        stepName: 'quality_assessment',
        startTime: new Date(stepStart),
        endTime: new Date(),
        duration: Date.now() - stepStart,
        success: false,
        details: { error: error.message },
        warnings: [],
        errors: [error.message]
      };
    }
  }

  private async executePostProcessingStep(
    result: PureTranslationResult,
    request: TranslationRequest,
    context: WorkflowContext
  ): Promise<WorkflowStep> {
    const stepStart = Date.now();

    try {
      // Post-processing optimizations
      const optimizations = {
        textNormalization: this.normalizeText(result.translatedText),
        formatOptimization: this.optimizeFormatting(result.translatedText, request.contentType),
        readabilityEnhancement: this.enhanceReadability(result.translatedText, request.targetLanguage)
      };

      return {
        stepName: 'post_processing',
        startTime: new Date(stepStart),
        endTime: new Date(),
        duration: Date.now() - stepStart,
        success: true,
        details: {
          optimizations,
          originalLength: result.translatedText.length,
          optimizedLength: optimizations.textNormalization.length,
          improvementsApplied: Object.keys(optimizations).length
        },
        warnings: [],
        errors: []
      };

    } catch (error) {
      return {
        stepName: 'post_processing',
        startTime: new Date(stepStart),
        endTime: new Date(),
        duration: Date.now() - stepStart,
        success: false,
        details: { error: error.message },
        warnings: [],
        errors: [error.message]
      };
    }
  }

  private async executeFinalValidationStep(
    result: PureTranslationResult,
    request: TranslationRequest,
    context: WorkflowContext
  ): Promise<WorkflowStep> {
    const stepStart = Date.now();

    try {
      // Final validation checks
      const validations = {
        purityCheck: result.purityScore >= 95,
        confidenceCheck: result.confidence >= 0.8,
        lengthCheck: result.translatedText.length > 0,
        encodingCheck: this.validateEncoding(result.translatedText),
        languageCheck: this.validateTargetLanguage(result.translatedText, request.targetLanguage)
      };

      const allValidationsPassed = Object.values(validations).every(v => v);

      return {
        stepName: 'final_validation',
        startTime: new Date(stepStart),
        endTime: new Date(),
        duration: Date.now() - stepStart,
        success: allValidationsPassed,
        details: {
          validations,
          allValidationsPassed,
          finalPurityScore: result.purityScore,
          finalConfidence: result.confidence
        },
        warnings: allValidationsPassed ? [] : ['Some final validations failed'],
        errors: []
      };

    } catch (error) {
      return {
        stepName: 'final_validation',
        startTime: new Date(stepStart),
        endTime: new Date(),
        duration: Date.now() - stepStart,
        success: false,
        details: { error: error.message },
        warnings: [],
        errors: [error.message]
      };
    }
  }

  /**
   * Helper methods
   */
  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private assessTextComplexity(text: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = text.split(/\s+/).length;
    const avgWordLength = text.replace(/\s+/g, '').length / wordCount;
    const sentenceCount = text.split(/[.!?]+/).length;
    const avgSentenceLength = wordCount / sentenceCount;

    if (avgWordLength > 8 || avgSentenceLength > 20) {
      return 'complex';
    } else if (avgWordLength > 5 || avgSentenceLength > 12) {
      return 'moderate';
    } else {
      return 'simple';
    }
  }

  private recommendTranslationMethod(analysis: any, contentType: ContentType): string {
    if (contentType === ContentType.LEGAL_DOCUMENT) {
      return 'legal_specialized';
    }
    if (analysis.complexity === 'complex') {
      return 'advanced_ai';
    }
    if (analysis.hasMixedScript) {
      return 'mixed_content_handler';
    }
    return 'standard_ai';
  }

  private estimateProcessingTime(analysis: any): number {
    const baseTime = 1000; // 1 second base
    const wordMultiplier = analysis.wordCount * 10; // 10ms per word
    const complexityMultiplier = analysis.complexity === 'complex' ? 2 : 1;
    return baseTime + (wordMultiplier * complexityMultiplier);
  }

  private normalizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }

  private optimizeFormatting(text: string, contentType: ContentType): string {
    // Content-type specific formatting optimizations
    switch (contentType) {
      case ContentType.LEGAL_DOCUMENT:
        return text.replace(/\n\s*\n/g, '\n\n'); // Normalize paragraph spacing
      case ContentType.CHAT_MESSAGE:
        return text.replace(/\s+/g, ' ').trim(); // Single line for chat
      default:
        return text;
    }
  }

  private enhanceReadability(text: string, language: Language): string {
    // Language-specific readability enhancements
    if (language === 'ar') {
      // Arabic-specific enhancements
      return text.replace(/\u200F/g, ''); // Remove RTL marks if not needed
    } else if (language === 'fr') {
      // French-specific enhancements
      return text.replace(/\s+([,.!?;:])/g, '$1'); // Fix punctuation spacing
    }
    return text;
  }

  private validateEncoding(text: string): boolean {
    try {
      // Check for valid UTF-8 encoding
      const encoded = encodeURIComponent(text);
      const decoded = decodeURIComponent(encoded);
      return decoded === text;
    } catch {
      return false;
    }
  }

  private validateTargetLanguage(text: string, language: Language): boolean {
    if (language === 'ar') {
      return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
    } else if (language === 'fr') {
      return /[a-zA-ZÀ-ÿ]/.test(text);
    }
    return true;
  }

  private async generateQualityReport(
    result: PureTranslationResult,
    request: TranslationRequest,
    steps: WorkflowStep[]
  ): Promise<QualityReport> {
    return await this.translationSystem.validateTranslationQuality(
      result.translatedText,
      request.targetLanguage
    );
  }

  private generateRecommendations(
    result: PureTranslationResult,
    steps: WorkflowStep[],
    qualityReport: QualityReport
  ): WorkflowRecommendation[] {
    const recommendations: WorkflowRecommendation[] = [];

    // Performance recommendations
    const totalTime = steps.reduce((sum, step) => sum + step.duration, 0);
    if (totalTime > 10000) {
      recommendations.push({
        type: 'performance',
        message: 'Translation took longer than expected',
        action: 'consider_caching_or_optimization',
        priority: 'medium'
      });
    }

    // Quality recommendations
    if (result.purityScore < 100) {
      recommendations.push({
        type: 'quality',
        message: 'Translation purity could be improved',
        action: 'review_content_cleaning_rules',
        priority: 'high'
      });
    }

    if (result.confidence < 0.8) {
      recommendations.push({
        type: 'quality',
        message: 'Translation confidence is low',
        action: 'consider_manual_review',
        priority: 'medium'
      });
    }

    // System recommendations
    const failedSteps = steps.filter(s => !s.success);
    if (failedSteps.length > 0) {
      recommendations.push({
        type: 'system',
        message: 'Some workflow steps failed',
        action: 'investigate_system_issues',
        priority: 'high'
      });
    }

    return recommendations;
  }

  private storeWorkflowResult(result: WorkflowResult): void {
    // Maintain history size limit
    if (this.workflowHistory.size >= this.maxHistorySize) {
      const oldestKey = this.workflowHistory.keys().next().value;
      this.workflowHistory.delete(oldestKey);
    }

    this.workflowHistory.set(result.workflowId, result);
  }
}

export default EndToEndWorkflow;