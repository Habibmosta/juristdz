/**
 * Fallback Content Generator Interface
 * 
 * Interface for intelligent fallback content generation when automatic
 * translation fails. Ensures zero tolerance policy by providing clean,
 * professional content instead of errors or mixed language content.
 */

import {
  Language,
  ContentIntent,
  FallbackContent,
  LegalDomain,
  LegalContext
} from '../types';

export interface IFallbackContentGenerator {
  /**
   * Generate intelligent fallback content based on detected intent
   * @param originalText Original text that failed translation
   * @param targetLanguage Target language for fallback content
   * @param failureReason Optional reason for translation failure
   * @returns Contextually appropriate fallback content
   */
  generateFallbackContent(
    originalText: string,
    targetLanguage: Language,
    failureReason?: string
  ): Promise<FallbackContent>;

  /**
   * Detect content intent from original text
   * @param text Text to analyze for intent detection
   * @returns Detected content intent with legal concepts and context
   */
  detectContentIntent(text: string): Promise<ContentIntent>;

  /**
   * Generate contextually appropriate content based on intent
   * @param intent Detected content intent
   * @param targetLanguage Target language for content generation
   * @returns Generated content appropriate for the detected intent
   */
  generateContextualContent(intent: ContentIntent, targetLanguage: Language): string;

  /**
   * Generate professional content for specific legal domain
   * @param domain Legal domain for content generation
   * @param targetLanguage Target language for content
   * @param context Optional legal context for customization
   * @returns Professional legal content for the specified domain
   */
  generateProfessionalContent(
    domain: LegalDomain,
    targetLanguage: Language,
    context?: LegalContext
  ): string;

  /**
   * Generate emergency fallback content for critical failures
   * @param targetLanguage Target language for emergency content
   * @param errorReason Optional error reason for logging
   * @returns Emergency fallback content with minimal but professional text
   */
  generateEmergencyFallback(targetLanguage: Language, errorReason?: string): FallbackContent;
}