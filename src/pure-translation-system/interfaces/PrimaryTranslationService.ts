/**
 * Primary Translation Service Interface
 * 
 * Interface for AI-based translation service with legal context awareness
 * and terminology preservation for the Pure Translation System.
 */

import {
  Language,
  TranslationAttempt,
  TranslationMethod,
  LegalContext
} from '../types';

export interface IPrimaryTranslationService {
  /**
   * Translate content using AI with legal context awareness
   * @param text Text to translate
   * @param sourceLanguage Source language of the text
   * @param targetLanguage Target language for translation
   * @param legalContext Optional legal context for enhanced translation
   * @returns Translation attempt with confidence and metadata
   */
  translateWithLegalContext(
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    legalContext?: LegalContext
  ): Promise<TranslationAttempt>;

  /**
   * Apply legal terminology preservation to translated text
   * @param text Text to process
   * @param sourceLanguage Source language
   * @param targetLanguage Target language
   * @returns Text with legal terminology properly applied
   */
  applyLegalTerminology(
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): string;

  /**
   * Calculate translation confidence score
   * @param originalText Original text before translation
   * @param translatedText Translated text
   * @param method Translation method used
   * @returns Confidence score between 0 and 1
   */
  calculateConfidence(
    originalText: string,
    translatedText: string,
    method: TranslationMethod
  ): number;
}