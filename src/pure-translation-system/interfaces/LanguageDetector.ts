/**
 * Language Detector Interface
 * 
 * Interface for robust language detection and validation system
 * supporting Arabic and French with character script analysis.
 */

import {
  Language,
  LanguageDetectionResult,
  ScriptAnalysis,
  EncodingValidation,
  PurityValidationResult
} from '../types';

export interface ILanguageDetector {
  /**
   * Detect the primary language of the given text
   * @param text Input text to analyze
   * @returns Language detection result with confidence and analysis
   */
  detectLanguage(text: string): Promise<LanguageDetectionResult>;

  /**
   * Analyze character scripts in the text
   * @param text Input text to analyze
   * @returns Detailed script analysis including percentages and positions
   */
  analyzeCharacterScripts(text: string): ScriptAnalysis;

  /**
   * Validate language purity (100% target language)
   * @param text Input text to validate
   * @param targetLanguage Expected language for purity validation
   * @returns Purity validation result with violations and recommendations
   */
  validateLanguagePurity(text: string, targetLanguage: Language): Promise<PurityValidationResult>;

  /**
   * Validate character encoding integrity
   * @param text Input text to validate encoding
   * @returns Encoding validation result with issues and recommendations
   */
  validateEncoding(text: string): EncodingValidation;
}