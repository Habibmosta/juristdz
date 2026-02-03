/**
 * Language Detection and Validation System
 * 
 * Robust language detection for Arabic and French with character script analysis
 * for purity validation and encoding integrity validation.
 * 
 * Supports:
 * - Arabic language detection with script analysis
 * - French language detection with proper encoding
 * - Character script purity validation
 * - Encoding integrity validation
 * - Mixed content detection and reporting
 */

import {
  Language,
  LanguageDetectionResult,
  ScriptAnalysis,
  EncodingValidation,
  PurityValidationResult,
  TextPosition,
  Severity
} from '../types';

import { ILanguageDetector } from '../interfaces/LanguageDetector';

export class LanguageDetector implements ILanguageDetector {
  
  // Arabic Unicode ranges
  private readonly ARABIC_RANGES = [
    [0x0600, 0x06FF], // Arabic
    [0x0750, 0x077F], // Arabic Supplement
    [0x08A0, 0x08FF], // Arabic Extended-A
    [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
    [0xFE70, 0xFEFF]  // Arabic Presentation Forms-B
  ];

  // French/Latin Unicode ranges
  private readonly LATIN_RANGES = [
    [0x0020, 0x007F], // Basic Latin
    [0x00A0, 0x00FF], // Latin-1 Supplement
    [0x0100, 0x017F], // Latin Extended-A
    [0x0180, 0x024F]  // Latin Extended-B
  ];

  // Common Arabic words for language detection
  private readonly ARABIC_INDICATORS = [
    'في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'التي', 'الذي', 'كان', 'كانت',
    'يكون', 'تكون', 'قانون', 'مادة', 'فقرة', 'باب', 'فصل', 'محكمة', 'قاضي',
    'محامي', 'دعوى', 'حكم', 'قرار', 'نص', 'أحكام', 'إجراءات', 'جنائية', 'مدنية'
  ];

  // Common French words for language detection
  private readonly FRENCH_INDICATORS = [
    'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'dans', 'sur',
    'avec', 'pour', 'par', 'est', 'sont', 'était', 'étaient', 'loi', 'article',
    'code', 'tribunal', 'juge', 'avocat', 'procédure', 'civil', 'pénal',
    'droit', 'justice', 'juridique', 'légal', 'règlement', 'décision'
  ];

  /**
   * Detect the primary language of the given text
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    const startTime = Date.now();
    
    try {
      // Clean text for analysis
      const cleanText = this.preprocessTextForDetection(text);
      
      // Perform script analysis
      const scriptAnalysis = this.analyzeCharacterScripts(cleanText);
      
      // Perform word-based detection
      const wordAnalysis = this.analyzeLanguageIndicators(cleanText);
      
      // Combine analyses for final detection
      const detectedLanguage = this.combineAnalyses(scriptAnalysis, wordAnalysis);
      
      // Calculate confidence
      const confidence = this.calculateDetectionConfidence(scriptAnalysis, wordAnalysis, detectedLanguage);
      
      const processingTime = Date.now() - startTime;
      
      return {
        detectedLanguage,
        confidence,
        scriptAnalysis,
        wordAnalysis,
        processingTime,
        alternativeLanguages: this.getAlternativeLanguages(scriptAnalysis, wordAnalysis, detectedLanguage),
        warnings: this.generateDetectionWarnings(scriptAnalysis, wordAnalysis)
      };
      
    } catch (error) {
      throw new Error(`Language detection failed: ${error.message}`);
    }
  }

  /**
   * Analyze character scripts in the text
   */
  analyzeCharacterScripts(text: string): ScriptAnalysis {
    let arabicCount = 0;
    let latinCount = 0;
    let otherCount = 0;
    let totalChars = 0;
    
    const mixedScriptPositions: TextPosition[] = [];
    let currentScript: 'arabic' | 'latin' | 'other' | null = null;
    let scriptChangePositions: number[] = [];
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charCode = char.charCodeAt(0);
      
      // Skip whitespace and punctuation for script analysis
      if (/\s/.test(char) || /[.,;:!?()[\]{}'"«»]/.test(char)) {
        continue;
      }
      
      totalChars++;
      let charScript: 'arabic' | 'latin' | 'other';
      
      if (this.isArabicCharacter(charCode)) {
        arabicCount++;
        charScript = 'arabic';
      } else if (this.isLatinCharacter(charCode)) {
        latinCount++;
        charScript = 'latin';
      } else {
        otherCount++;
        charScript = 'other';
      }
      
      // Detect script changes for mixed content detection
      if (currentScript && currentScript !== charScript) {
        scriptChangePositions.push(i);
        mixedScriptPositions.push({ start: i - 1, end: i + 1 });
      }
      currentScript = charScript;
    }
    
    const arabicPercentage = totalChars > 0 ? (arabicCount / totalChars) * 100 : 0;
    const latinPercentage = totalChars > 0 ? (latinCount / totalChars) * 100 : 0;
    const otherPercentage = totalChars > 0 ? (otherCount / totalChars) * 100 : 0;
    
    return {
      arabicCharacters: arabicCount,
      latinCharacters: latinCount,
      otherCharacters: otherCount,
      totalCharacters: totalChars,
      arabicPercentage,
      latinPercentage,
      otherPercentage,
      dominantScript: this.getDominantScript(arabicPercentage, latinPercentage, otherPercentage),
      mixedScriptPositions,
      scriptChangeCount: scriptChangePositions.length,
      isPureScript: scriptChangePositions.length === 0 && otherPercentage < 5
    };
  }

  /**
   * Validate language purity (100% target language)
   */
  async validateLanguagePurity(text: string, targetLanguage: Language): Promise<PurityValidationResult> {
    const detectionResult = await this.detectLanguage(text);
    const scriptAnalysis = detectionResult.scriptAnalysis;
    
    let isPure = false;
    let purityScore = 0;
    const violations = [];
    const recommendations = [];
    
    if (targetLanguage === Language.ARABIC) {
      isPure = scriptAnalysis.arabicPercentage >= 95 && scriptAnalysis.latinPercentage <= 5;
      purityScore = Math.max(0, scriptAnalysis.arabicPercentage - scriptAnalysis.latinPercentage);
      
      if (scriptAnalysis.latinPercentage > 5) {
        violations.push({
          type: 'FOREIGN_FRAGMENTS',
          position: { start: 0, end: text.length },
          content: 'Latin characters detected in Arabic text',
          severity: Severity.HIGH,
          suggestedFix: 'Remove or translate Latin fragments'
        });
      }
      
      if (scriptAnalysis.mixedScriptPositions.length > 0) {
        violations.push({
          type: 'MIXED_SCRIPTS',
          position: scriptAnalysis.mixedScriptPositions[0],
          content: 'Mixed script patterns detected',
          severity: Severity.CRITICAL,
          suggestedFix: 'Separate scripts or use pure Arabic'
        });
      }
      
    } else if (targetLanguage === Language.FRENCH) {
      isPure = scriptAnalysis.latinPercentage >= 95 && scriptAnalysis.arabicPercentage <= 5;
      purityScore = Math.max(0, scriptAnalysis.latinPercentage - scriptAnalysis.arabicPercentage);
      
      if (scriptAnalysis.arabicPercentage > 5) {
        violations.push({
          type: 'FOREIGN_FRAGMENTS',
          position: { start: 0, end: text.length },
          content: 'Arabic characters detected in French text',
          severity: Severity.HIGH,
          suggestedFix: 'Remove or translate Arabic fragments'
        });
      }
    }
    
    // Add recommendations based on violations
    if (violations.length > 0) {
      recommendations.push({
        type: 'CONTENT_CLEANING',
        description: 'Apply aggressive content cleaning to remove foreign fragments',
        action: 'Use ContentCleaner to eliminate mixed content',
        priority: 'HIGH'
      });
    }
    
    return {
      isPure,
      purityScore: {
        overall: purityScore,
        scriptPurity: isPure ? 100 : purityScore,
        terminologyConsistency: 100, // Will be calculated by terminology validator
        encodingIntegrity: 100, // Will be calculated by encoding validator
        contextualCoherence: detectionResult.confidence * 100,
        uiElementsRemoved: 0 // Will be set by content cleaner
      },
      violations,
      recommendations,
      passesZeroTolerance: isPure && violations.length === 0
    };
  }

  /**
   * Validate character encoding integrity
   */
  validateEncoding(text: string): EncodingValidation {
    const issues = [];
    let isValid = true;
    let confidence = 1.0;
    
    try {
      // Test UTF-8 encoding integrity
      const encoded = encodeURIComponent(text);
      const decoded = decodeURIComponent(encoded);
      
      if (decoded !== text) {
        issues.push('Text encoding/decoding mismatch detected');
        isValid = false;
        confidence -= 0.3;
      }
      
      // Check for invalid Unicode characters
      const invalidChars = [];
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        
        // Check for surrogate pairs issues
        if (charCode >= 0xD800 && charCode <= 0xDFFF) {
          if (charCode >= 0xD800 && charCode <= 0xDBFF) {
            // High surrogate - should be followed by low surrogate
            if (i + 1 >= text.length || text.charCodeAt(i + 1) < 0xDC00 || text.charCodeAt(i + 1) > 0xDFFF) {
              invalidChars.push({ char: text[i], position: i, reason: 'Unpaired high surrogate' });
              isValid = false;
            }
          } else {
            // Low surrogate - should be preceded by high surrogate
            if (i === 0 || text.charCodeAt(i - 1) < 0xD800 || text.charCodeAt(i - 1) > 0xDBFF) {
              invalidChars.push({ char: text[i], position: i, reason: 'Unpaired low surrogate' });
              isValid = false;
            }
          }
        }
        
        // Check for control characters (except common ones like newline, tab)
        if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
          invalidChars.push({ char: text[i], position: i, reason: 'Invalid control character' });
          isValid = false;
        }
      }
      
      if (invalidChars.length > 0) {
        issues.push(`Found ${invalidChars.length} invalid Unicode characters`);
        confidence -= Math.min(0.5, invalidChars.length * 0.1);
      }
      
      // Check for byte order mark (BOM) issues
      if (text.charCodeAt(0) === 0xFEFF) {
        issues.push('Byte Order Mark (BOM) detected at start of text');
        confidence -= 0.1;
      }
      
      // Normalize and compare
      const normalized = text.normalize('NFC');
      if (normalized !== text) {
        issues.push('Text normalization changed content - encoding may be inconsistent');
        confidence -= 0.2;
      }
      
    } catch (error) {
      issues.push(`Encoding validation error: ${error.message}`);
      isValid = false;
      confidence = 0;
    }
    
    return {
      isValid,
      confidence: Math.max(0, confidence),
      issues,
      normalizedText: text.normalize('NFC'),
      encoding: 'UTF-8',
      hasInvalidCharacters: issues.some(issue => issue.includes('invalid')),
      recommendations: isValid ? [] : [
        'Apply encoding normalization',
        'Remove invalid Unicode characters',
        'Validate text source encoding'
      ]
    };
  }

  /**
   * Preprocess text for language detection
   */
  private preprocessTextForDetection(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0020-\u007F\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Analyze language indicators (words)
   */
  private analyzeLanguageIndicators(text: string): { arabicScore: number; frenchScore: number; indicators: string[] } {
    const words = text.split(/\s+/);
    let arabicScore = 0;
    let frenchScore = 0;
    const foundIndicators: string[] = [];
    
    words.forEach(word => {
      if (this.ARABIC_INDICATORS.includes(word)) {
        arabicScore += 2;
        foundIndicators.push(`Arabic: ${word}`);
      }
      
      if (this.FRENCH_INDICATORS.includes(word)) {
        frenchScore += 2;
        foundIndicators.push(`French: ${word}`);
      }
    });
    
    return { arabicScore, frenchScore, indicators: foundIndicators };
  }

  /**
   * Combine script and word analyses for final language detection
   */
  private combineAnalyses(scriptAnalysis: ScriptAnalysis, wordAnalysis: any): Language {
    const scriptWeight = 0.7;
    const wordWeight = 0.3;
    
    const arabicScore = (scriptAnalysis.arabicPercentage * scriptWeight) + (wordAnalysis.arabicScore * wordWeight);
    const frenchScore = (scriptAnalysis.latinPercentage * scriptWeight) + (wordAnalysis.frenchScore * wordWeight);
    
    if (arabicScore > frenchScore && arabicScore > 30) {
      return Language.ARABIC;
    } else if (frenchScore > arabicScore && frenchScore > 30) {
      return Language.FRENCH;
    } else {
      // Default to Arabic if unclear (since this is for Algerian legal system)
      return scriptAnalysis.arabicPercentage > scriptAnalysis.latinPercentage ? Language.ARABIC : Language.FRENCH;
    }
  }

  /**
   * Calculate detection confidence
   */
  private calculateDetectionConfidence(scriptAnalysis: ScriptAnalysis, wordAnalysis: any, detectedLanguage: Language): number {
    let confidence = 0.5; // Base confidence
    
    if (detectedLanguage === Language.ARABIC) {
      confidence += Math.min(0.4, scriptAnalysis.arabicPercentage / 100);
      confidence += Math.min(0.1, wordAnalysis.arabicScore / 20);
    } else if (detectedLanguage === Language.FRENCH) {
      confidence += Math.min(0.4, scriptAnalysis.latinPercentage / 100);
      confidence += Math.min(0.1, wordAnalysis.frenchScore / 20);
    }
    
    // Reduce confidence for mixed content
    if (scriptAnalysis.mixedScriptPositions.length > 0) {
      confidence -= Math.min(0.3, scriptAnalysis.mixedScriptPositions.length * 0.1);
    }
    
    // Reduce confidence for low character count
    if (scriptAnalysis.totalCharacters < 10) {
      confidence -= 0.2;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Get alternative language possibilities
   */
  private getAlternativeLanguages(scriptAnalysis: ScriptAnalysis, wordAnalysis: any, detectedLanguage: Language): Language[] {
    const alternatives: Language[] = [];
    
    if (detectedLanguage === Language.ARABIC && scriptAnalysis.latinPercentage > 20) {
      alternatives.push(Language.FRENCH);
    } else if (detectedLanguage === Language.FRENCH && scriptAnalysis.arabicPercentage > 20) {
      alternatives.push(Language.ARABIC);
    }
    
    return alternatives;
  }

  /**
   * Generate detection warnings
   */
  private generateDetectionWarnings(scriptAnalysis: ScriptAnalysis, wordAnalysis: any): string[] {
    const warnings: string[] = [];
    
    if (scriptAnalysis.mixedScriptPositions.length > 0) {
      warnings.push('Mixed scripts detected - may affect translation quality');
    }
    
    if (scriptAnalysis.otherPercentage > 10) {
      warnings.push('High percentage of unrecognized characters detected');
    }
    
    if (scriptAnalysis.totalCharacters < 5) {
      warnings.push('Very short text - detection confidence may be low');
    }
    
    return warnings;
  }

  /**
   * Check if character is Arabic
   */
  private isArabicCharacter(charCode: number): boolean {
    return this.ARABIC_RANGES.some(([start, end]) => charCode >= start && charCode <= end);
  }

  /**
   * Check if character is Latin/French
   */
  private isLatinCharacter(charCode: number): boolean {
    return this.LATIN_RANGES.some(([start, end]) => charCode >= start && charCode <= end);
  }

  /**
   * Get dominant script from percentages
   */
  private getDominantScript(arabicPercentage: number, latinPercentage: number, otherPercentage: number): 'arabic' | 'latin' | 'mixed' | 'unknown' {
    if (arabicPercentage > 70) return 'arabic';
    if (latinPercentage > 70) return 'latin';
    if (arabicPercentage > 30 && latinPercentage > 30) return 'mixed';
    return 'unknown';
  }
}