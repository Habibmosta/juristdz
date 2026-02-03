/**
 * Translation Gateway Interface
 * 
 * Central entry point for all translation requests in the Pure Translation System.
 * Coordinates between different system components and manages translation lifecycle.
 */

import {
  TranslationRequest,
  PureTranslationResult,
  QualityReport,
  TranslationIssue,
  TranslationMetrics
} from '../types';

export interface ITranslationGateway {
  /**
   * Translate content with zero tolerance for language mixing
   * @param request Translation request with content and parameters
   * @returns Pure translation result with quality metrics
   */
  translateContent(request: TranslationRequest): Promise<PureTranslationResult>;

  /**
   * Validate translation quality against purity standards
   * @param text Text to validate
   * @param targetLang Target language for validation
   * @returns Detailed quality report
   */
  validateTranslationQuality(text: string, targetLang: string): Promise<QualityReport>;

  /**
   * Report translation issues for system improvement
   * @param issue Translation issue reported by user
   */
  reportTranslationIssue(issue: TranslationIssue): Promise<void>;

  /**
   * Get comprehensive translation metrics
   * @returns System-wide translation metrics
   */
  getTranslationMetrics(): Promise<TranslationMetrics>;

  /**
   * Process multiple translation requests concurrently
   * @param requests Array of translation requests
   * @returns Array of pure translation results
   */
  translateBatch(requests: TranslationRequest[]): Promise<PureTranslationResult[]>;

  /**
   * Get translation status for monitoring
   * @param requestId Translation request ID
   * @returns Current status of translation request
   */
  getTranslationStatus(requestId: string): Promise<TranslationStatus>;
}

export interface TranslationStatus {
  requestId: string;
  status: TranslationStatusType;
  progress: number;
  estimatedCompletion?: Date;
  currentStep?: string;
  errors?: string[];
}

export enum TranslationStatusType {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  VALIDATING = 'validating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}