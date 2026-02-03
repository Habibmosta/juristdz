/**
 * Secondary Translation Service Interface
 * 
 * Interface for rule-based and hybrid translation methods as fallback
 * for the primary AI translation service in the Pure Translation System.
 */

import {
  Language,
  TranslationAttempt,
  TranslationMethod,
  CleanedContent,
  ContentIntent
} from '../types';

export interface ISecondaryTranslationService {
  /**
   * Translate using rule-based method with legal dictionary
   * @param content Cleaned content ready for translation
   * @param targetLanguage Target language for translation
   * @returns Rule-based translation attempt
   */
  translateWithRuleBasedMethod(
    content: CleanedContent,
    targetLanguage: Language
  ): Promise<TranslationAttempt>;

  /**
   * Translate using hybrid method combining multiple approaches
   * @param content Cleaned content for translation
   * @param targetLanguage Target language for translation
   * @param methods Array of methods to combine in hybrid approach
   * @returns Hybrid translation attempt
   */
  translateWithHybridMethod(
    content: CleanedContent,
    targetLanguage: Language,
    methods: TranslationMethod[]
  ): Promise<TranslationAttempt>;

  /**
   * Detect content intent for contextual translation
   * @param text Input text to analyze for intent
   * @returns Detected content intent with legal context
   */
  detectContentIntent(text: string): Promise<ContentIntent>;
}