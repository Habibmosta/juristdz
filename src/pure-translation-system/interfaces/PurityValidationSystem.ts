/**
 * Purity Validation System Interface
 * 
 * Zero-tolerance validation system that ensures 100% language purity
 * and enforces strict quality standards for all translation outputs.
 */

import {
  PurityValidationResult,
  PurityScore,
  MixedContentDetection,
  PurityReport,
  Language,
  PurityViolation,
  QualityThresholds
} from '../types';

export interface IPurityValidationSystem {
  /**
   * Validate complete language purity with zero tolerance
   * @param text Text to validate for purity
   * @param targetLang Expected target language
   * @returns Comprehensive purity validation result
   */
  validatePurity(text: string, targetLang: Language): Promise<PurityValidationResult>;

  /**
   * Calculate detailed purity score across multiple dimensions
   * @param text Text to score for purity
   * @param targetLang Target language for scoring
   * @returns Multi-dimensional purity score
   */
  calculatePurityScore(text: string, targetLang: Language): Promise<PurityScore>;

  /**
   * Detect any mixed content with high precision
   * @param text Text to analyze for mixed content
   * @param targetLang Expected pure language
   * @returns Detailed mixed content detection results
   */
  detectMixedContent(text: string, targetLang: Language): Promise<MixedContentDetection>;

  /**
   * Enforce zero tolerance policy - reject any impure content
   * @param text Text to validate against zero tolerance
   * @param targetLang Target language for validation
   * @returns Boolean indicating if text passes zero tolerance
   */
  enforceZeroTolerance(text: string, targetLang: Language): Promise<boolean>;

  /**
   * Generate comprehensive purity report for analysis
   * @param text Text to analyze
   * @param targetLang Target language
   * @returns Detailed purity analysis report
   */
  generatePurityReport(text: string, targetLang: Language): Promise<PurityReport>;

  /**
   * Validate script consistency within target language
   * @param text Text to validate for script consistency
   * @param targetLang Target language script
   * @returns Script validation result
   */
  validateScriptConsistency(text: string, targetLang: Language): Promise<ScriptValidationResult>;

  /**
   * Check for encoding integrity and character validity
   * @param text Text to check for encoding issues
   * @returns Encoding validation result
   */
  validateEncodingIntegrity(text: string): Promise<EncodingValidationResult>;

  /**
   * Detect and classify purity violations
   * @param text Text to analyze for violations
   * @param targetLang Target language
   * @returns Array of detected purity violations
   */
  detectPurityViolations(text: string, targetLang: Language): Promise<PurityViolation[]>;

  /**
   * Configure purity validation thresholds and rules
   * @param config Validation configuration
   */
  configure(config: PurityValidationConfig): Promise<void>;

  /**
   * Get validation statistics for monitoring
   * @returns Validation performance statistics
   */
  getValidationStats(): Promise<ValidationStats>;
}

export interface MixedContentDetection {
  hasMixedContent: boolean;
  mixedSegments: MixedSegment[];
  purityPercentage: number;
  dominantLanguage: Language;
  languageDistribution: Map<Language, number>;
  confidence: number;
}

export interface MixedSegment {
  text: string;
  startPosition: number;
  endPosition: number;
  detectedLanguage: Language;
  confidence: number;
  violationType: string;
}

export interface PurityReport {
  overallPurity: number;
  scriptAnalysis: ScriptAnalysis;
  languageAnalysis: LanguageAnalysis;
  encodingAnalysis: EncodingAnalysis;
  violations: PurityViolation[];
  recommendations: PurityRecommendation[];
  processingTime: number;
  timestamp: Date;
}

export interface ScriptAnalysis {
  primaryScript: string;
  scriptDistribution: Map<string, number>;
  scriptConsistency: number;
  invalidCharacters: InvalidCharacter[];
}

export interface LanguageAnalysis {
  primaryLanguage: Language;
  languageDistribution: Map<Language, number>;
  languageConsistency: number;
  foreignFragments: ForeignFragment[];
}

export interface EncodingAnalysis {
  encoding: string;
  isValid: boolean;
  corruptedCharacters: CorruptedCharacter[];
  encodingConsistency: number;
}

export interface InvalidCharacter {
  character: string;
  position: number;
  unicodePoint: string;
  reason: string;
}

export interface ForeignFragment {
  text: string;
  startPosition: number;
  endPosition: number;
  detectedLanguage: Language;
  confidence: number;
}

export interface CorruptedCharacter {
  character: string;
  position: number;
  expectedCharacter?: string;
  corruptionType: string;
}

export interface ScriptValidationResult {
  isValid: boolean;
  scriptConsistency: number;
  primaryScript: string;
  scriptViolations: ScriptViolation[];
  recommendations: string[];
}

export interface ScriptViolation {
  character: string;
  position: number;
  expectedScript: string;
  actualScript: string;
  severity: string;
}

export interface EncodingValidationResult {
  isValid: boolean;
  encoding: string;
  encodingConsistency: number;
  encodingErrors: EncodingError[];
  recommendations: string[];
}

export interface EncodingError {
  position: number;
  character: string;
  errorType: string;
  suggestedFix: string;
}

export interface PurityValidationConfig {
  zeroToleranceEnabled: boolean;
  minimumPurityScore: number;
  scriptValidationEnabled: boolean;
  encodingValidationEnabled: boolean;
  customValidationRules: ValidationRule[];
  thresholds: QualityThresholds;
}

export interface ValidationRule {
  name: string;
  pattern: string | RegExp;
  severity: string;
  enabled: boolean;
  description: string;
}

export interface ValidationStats {
  totalValidations: number;
  pureValidations: number;
  purityRate: number;
  averageValidationTime: number;
  commonViolations: Map<string, number>;
  averagePurityScore: number;
}