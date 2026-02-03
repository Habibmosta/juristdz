/**
 * Primary Translation Service
 * 
 * AI-based translation service with legal context awareness and terminology preservation.
 * Implements the primary translation method for the Pure Translation System with
 * focus on Algerian legal content and zero tolerance for language mixing.
 * 
 * Features:
 * - AI-based translation with legal context
 * - Legal terminology preservation
 * - Translation confidence scoring
 * - Algerian legal system awareness
 * - Quality validation integration
 */

import {
  Language,
  TranslationRequest,
  TranslationAttempt,
  TranslationMethod,
  LegalContext,
  LegalDomain,
  ContentType,
  TranslationError,
  TranslationWarning,
  Severity
} from '../types';

import { IPrimaryTranslationService } from '../interfaces/PrimaryTranslationService';

export class PrimaryTranslationService implements IPrimaryTranslationService {
  
  // Legal terminology mappings for Algerian law
  private readonly LEGAL_TERMINOLOGY_AR_FR = new Map([
    // Civil Law
    ['قانون مدني', 'Code civil'],
    ['عقد', 'Contrat'],
    ['التزام', 'Obligation'],
    ['ضرر', 'Dommage'],
    ['تعويض', 'Indemnisation'],
    ['مسؤولية', 'Responsabilité'],
    
    // Criminal Law
    ['قانون جنائي', 'Code pénal'],
    ['جريمة', 'Crime'],
    ['جنحة', 'Délit'],
    ['مخالفة', 'Contravention'],
    ['عقوبة', 'Peine'],
    ['محكمة جنائية', 'Tribunal pénal'],
    
    // Procedural Law
    ['إجراءات', 'Procédure'],
    ['دعوى', 'Action en justice'],
    ['استئناف', 'Appel'],
    ['نقض', 'Cassation'],
    ['تنفيذ', 'Exécution'],
    ['حكم', 'Jugement'],
    ['قرار', 'Arrêt'],
    
    // Administrative Law
    ['قانون إداري', 'Droit administratif'],
    ['قرار إداري', 'Décision administrative'],
    ['طعن إداري', 'Recours administratif'],
    ['مجلس الدولة', 'Conseil d\'État'],
    
    // Commercial Law
    ['قانون تجاري', 'Code de commerce'],
    ['شركة', 'Société'],
    ['إفلاس', 'Faillite'],
    ['تاجر', 'Commerçant'],
    ['سجل تجاري', 'Registre de commerce'],
    
    // Family Law
    ['أحوال شخصية', 'Statut personnel'],
    ['زواج', 'Mariage'],
    ['طلاق', 'Divorce'],
    ['نفقة', 'Pension alimentaire'],
    ['حضانة', 'Garde d\'enfants'],
    ['ميراث', 'Succession'],
    
    // Constitutional Law
    ['دستور', 'Constitution'],
    ['مجلس دستوري', 'Conseil constitutionnel'],
    ['حقوق أساسية', 'Droits fondamentaux'],
    ['فصل السلطات', 'Séparation des pouvoirs']
  ]);

  private readonly LEGAL_TERMINOLOGY_FR_AR = new Map(
    Array.from(this.LEGAL_TERMINOLOGY_AR_FR.entries()).map(([ar, fr]) => [fr, ar])
  );

  // Common legal phrases and expressions
  private readonly LEGAL_PHRASES_AR_FR = new Map([
    ['وفقا للقانون', 'Conformément à la loi'],
    ['بموجب هذا القانون', 'En vertu de la présente loi'],
    ['في حدود القانون', 'Dans les limites de la loi'],
    ['طبقا لأحكام', 'Selon les dispositions de'],
    ['مع مراعاة', 'Sous réserve de'],
    ['دون الإخلال بـ', 'Sans préjudice de'],
    ['في جميع الأحوال', 'En tout état de cause'],
    ['على وجه الخصوص', 'En particulier'],
    ['بصفة استثنائية', 'À titre exceptionnel'],
    ['في أجل أقصاه', 'Dans un délai maximum de']
  ]);

  private readonly LEGAL_PHRASES_FR_AR = new Map(
    Array.from(this.LEGAL_PHRASES_AR_FR.entries()).map(([ar, fr]) => [fr, ar])
  );

  constructor() {
    // Initialize translation service
  }

  /**
   * Translate content using AI with legal context awareness
   */
  async translateWithLegalContext(
    text: string, 
    sourceLanguage: Language, 
    targetLanguage: Language, 
    legalContext?: LegalContext
  ): Promise<TranslationAttempt> {
    const startTime = Date.now();
    const errors: TranslationError[] = [];
    const warnings: TranslationWarning[] = [];

    try {
      // Step 1: Preprocess text for legal translation
      const preprocessedText = this.preprocessLegalText(text, sourceLanguage);
      
      // Step 2: Identify legal terminology
      const legalTerms = this.identifyLegalTerminology(preprocessedText, sourceLanguage);
      
      // Step 3: Apply legal context if provided
      const contextualizedText = legalContext 
        ? this.applyLegalContext(preprocessedText, legalContext, sourceLanguage)
        : preprocessedText;
      
      // Step 4: Perform AI translation with legal awareness
      const translatedText = await this.performAITranslation(
        contextualizedText, 
        sourceLanguage, 
        targetLanguage, 
        legalContext
      );
      
      // Step 5: Apply legal terminology preservation
      const terminologyPreservedText = this.preserveLegalTerminology(
        translatedText, 
        legalTerms, 
        sourceLanguage, 
        targetLanguage
      );
      
      // Step 6: Post-process for legal consistency
      const finalText = this.postProcessLegalTranslation(
        terminologyPreservedText, 
        targetLanguage, 
        legalContext
      );
      
      // Step 7: Calculate confidence score
      const confidence = this.calculateTranslationConfidence(
        text, 
        finalText, 
        legalTerms, 
        sourceLanguage, 
        targetLanguage
      );
      
      const processingTime = Date.now() - startTime;
      
      // Add warnings for potential issues
      if (legalTerms.length === 0) {
        warnings.push({
          code: 'NO_LEGAL_TERMS',
          message: 'No legal terminology detected in source text',
          suggestion: 'Verify if this is legal content'
        });
      }
      
      if (confidence < 0.7) {
        warnings.push({
          code: 'LOW_CONFIDENCE',
          message: 'Translation confidence is below recommended threshold',
          suggestion: 'Consider manual review or alternative translation method'
        });
      }

      return {
        result: finalText,
        method: TranslationMethod.PRIMARY_AI,
        confidence,
        processingTime,
        errors,
        warnings,
        metadata: {
          legalTermsFound: legalTerms.length,
          legalContext: legalContext || null,
          preprocessingApplied: true,
          terminologyPreserved: true
        }
      };

    } catch (error) {
      errors.push({
        code: 'TRANSLATION_FAILED',
        message: `Primary translation failed: ${error.message}`,
        severity: Severity.CRITICAL,
        recoverable: true,
        context: { sourceLanguage, targetLanguage, textLength: text.length }
      });

      return {
        result: '',
        method: TranslationMethod.PRIMARY_AI,
        confidence: 0,
        processingTime: Date.now() - startTime,
        errors,
        warnings,
        metadata: { failed: true, error: error.message }
      };
    }
  }

  /**
   * Apply legal terminology preservation
   */
  applyLegalTerminology(
    text: string, 
    sourceLanguage: Language, 
    targetLanguage: Language
  ): string {
    let processedText = text;
    
    if (sourceLanguage === Language.ARABIC && targetLanguage === Language.FRENCH) {
      // Apply Arabic to French legal terminology
      this.LEGAL_TERMINOLOGY_AR_FR.forEach((frenchTerm, arabicTerm) => {
        const regex = new RegExp(arabicTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        processedText = processedText.replace(regex, frenchTerm);
      });
      
      // Apply legal phrases
      this.LEGAL_PHRASES_AR_FR.forEach((frenchPhrase, arabicPhrase) => {
        const regex = new RegExp(arabicPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        processedText = processedText.replace(regex, frenchPhrase);
      });
      
    } else if (sourceLanguage === Language.FRENCH && targetLanguage === Language.ARABIC) {
      // Apply French to Arabic legal terminology
      this.LEGAL_TERMINOLOGY_FR_AR.forEach((arabicTerm, frenchTerm) => {
        const regex = new RegExp(frenchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        processedText = processedText.replace(regex, arabicTerm);
      });
      
      // Apply legal phrases
      this.LEGAL_PHRASES_FR_AR.forEach((arabicPhrase, frenchPhrase) => {
        const regex = new RegExp(frenchPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        processedText = processedText.replace(regex, arabicPhrase);
      });
    }
    
    return processedText;
  }

  /**
   * Calculate translation confidence score
   */
  calculateConfidence(
    originalText: string, 
    translatedText: string, 
    method: TranslationMethod
  ): number {
    let confidence = 0.8; // Base confidence for primary AI method
    
    // Adjust based on text length
    if (originalText.length < 10) {
      confidence -= 0.2; // Lower confidence for very short text
    } else if (originalText.length > 1000) {
      confidence -= 0.1; // Slightly lower confidence for very long text
    }
    
    // Adjust based on legal terminology presence
    const legalTermsCount = this.countLegalTerms(originalText);
    if (legalTermsCount > 0) {
      confidence += Math.min(0.1, legalTermsCount * 0.02); // Boost for legal content
    }
    
    // Adjust based on translation completeness
    if (translatedText.length === 0) {
      confidence = 0;
    } else if (translatedText.length < originalText.length * 0.5) {
      confidence -= 0.3; // Significant reduction for very short translation
    }
    
    // Ensure confidence is within valid range
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Preprocess legal text for translation
   */
  private preprocessLegalText(text: string, sourceLanguage: Language): string {
    let processed = text;
    
    // Normalize legal formatting
    processed = processed
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.،؛:])\s*([.،؛:])/g, '$1 $2') // Fix punctuation spacing
      .trim();
    
    // Handle legal numbering and references
    if (sourceLanguage === Language.ARABIC) {
      // Normalize Arabic legal references
      processed = processed
        .replace(/المادة\s*(\d+)/g, 'المادة $1') // Normalize article references
        .replace(/الفقرة\s*(\d+)/g, 'الفقرة $1') // Normalize paragraph references
        .replace(/البند\s*(\d+)/g, 'البند $1'); // Normalize item references
    } else if (sourceLanguage === Language.FRENCH) {
      // Normalize French legal references
      processed = processed
        .replace(/[Aa]rticle\s*(\d+)/g, 'Article $1')
        .replace(/[Aa]linéa\s*(\d+)/g, 'Alinéa $1')
        .replace(/[Pp]aragraphe\s*(\d+)/g, 'Paragraphe $1');
    }
    
    return processed;
  }

  /**
   * Identify legal terminology in text
   */
  private identifyLegalTerminology(text: string, sourceLanguage: Language): string[] {
    const foundTerms: string[] = [];
    
    if (sourceLanguage === Language.ARABIC) {
      this.LEGAL_TERMINOLOGY_AR_FR.forEach((_, arabicTerm) => {
        if (text.includes(arabicTerm)) {
          foundTerms.push(arabicTerm);
        }
      });
    } else if (sourceLanguage === Language.FRENCH) {
      this.LEGAL_TERMINOLOGY_FR_AR.forEach((_, frenchTerm) => {
        if (text.toLowerCase().includes(frenchTerm.toLowerCase())) {
          foundTerms.push(frenchTerm);
        }
      });
    }
    
    return foundTerms;
  }

  /**
   * Apply legal context to enhance translation
   */
  private applyLegalContext(
    text: string, 
    legalContext: LegalContext, 
    sourceLanguage: Language
  ): string {
    let contextualizedText = text;
    
    // Add context markers based on legal domain
    const contextPrefix = this.getContextPrefix(legalContext, sourceLanguage);
    if (contextPrefix) {
      contextualizedText = `${contextPrefix} ${text}`;
    }
    
    return contextualizedText;
  }

  /**
   * Get context prefix based on legal domain
   */
  private getContextPrefix(legalContext: LegalContext, sourceLanguage: Language): string {
    const domain = this.inferLegalDomain(legalContext);
    
    if (sourceLanguage === Language.ARABIC) {
      switch (domain) {
        case LegalDomain.CIVIL_LAW:
          return '[في إطار القانون المدني]';
        case LegalDomain.CRIMINAL_LAW:
          return '[في إطار القانون الجنائي]';
        case LegalDomain.COMMERCIAL_LAW:
          return '[في إطار القانون التجاري]';
        case LegalDomain.ADMINISTRATIVE_LAW:
          return '[في إطار القانون الإداري]';
        default:
          return '[في إطار القانون الجزائري]';
      }
    } else if (sourceLanguage === Language.FRENCH) {
      switch (domain) {
        case LegalDomain.CIVIL_LAW:
          return '[Dans le cadre du droit civil]';
        case LegalDomain.CRIMINAL_LAW:
          return '[Dans le cadre du droit pénal]';
        case LegalDomain.COMMERCIAL_LAW:
          return '[Dans le cadre du droit commercial]';
        case LegalDomain.ADMINISTRATIVE_LAW:
          return '[Dans le cadre du droit administratif]';
        default:
          return '[Dans le cadre du droit algérien]';
      }
    }
    
    return '';
  }

  /**
   * Infer legal domain from context
   */
  private inferLegalDomain(legalContext: LegalContext): LegalDomain {
    // Simple domain inference based on context
    if (legalContext.lawType?.includes('civil') || legalContext.lawType?.includes('مدني')) {
      return LegalDomain.CIVIL_LAW;
    } else if (legalContext.lawType?.includes('penal') || legalContext.lawType?.includes('جنائي')) {
      return LegalDomain.CRIMINAL_LAW;
    } else if (legalContext.lawType?.includes('commercial') || legalContext.lawType?.includes('تجاري')) {
      return LegalDomain.COMMERCIAL_LAW;
    } else if (legalContext.lawType?.includes('administratif') || legalContext.lawType?.includes('إداري')) {
      return LegalDomain.ADMINISTRATIVE_LAW;
    }
    
    return LegalDomain.CIVIL_LAW; // Default
  }

  /**
   * Perform AI translation (placeholder for actual AI service integration)
   */
  private async performAITranslation(
    text: string, 
    sourceLanguage: Language, 
    targetLanguage: Language, 
    legalContext?: LegalContext
  ): Promise<string> {
    // This is a placeholder for actual AI translation service integration
    // In a real implementation, this would call an AI service like Google Translate,
    // OpenAI, or a specialized legal translation service
    
    // For now, we'll apply our legal terminology mappings as a basic translation
    let translated = this.applyLegalTerminology(text, sourceLanguage, targetLanguage);
    
    // Remove context prefixes that were added for AI context
    translated = translated.replace(/^\[.*?\]\s*/, '');
    
    return translated;
  }

  /**
   * Preserve legal terminology in translation
   */
  private preserveLegalTerminology(
    translatedText: string, 
    originalLegalTerms: string[], 
    sourceLanguage: Language, 
    targetLanguage: Language
  ): string {
    let preserved = translatedText;
    
    // Ensure all identified legal terms are properly translated
    originalLegalTerms.forEach(term => {
      const correctTranslation = this.getCorrectLegalTermTranslation(term, sourceLanguage, targetLanguage);
      if (correctTranslation) {
        // Replace any incorrect translations with the correct legal terminology
        preserved = this.ensureCorrectTerminology(preserved, term, correctTranslation, targetLanguage);
      }
    });
    
    return preserved;
  }

  /**
   * Get correct legal term translation
   */
  private getCorrectLegalTermTranslation(
    term: string, 
    sourceLanguage: Language, 
    targetLanguage: Language
  ): string | null {
    if (sourceLanguage === Language.ARABIC && targetLanguage === Language.FRENCH) {
      return this.LEGAL_TERMINOLOGY_AR_FR.get(term) || null;
    } else if (sourceLanguage === Language.FRENCH && targetLanguage === Language.ARABIC) {
      return this.LEGAL_TERMINOLOGY_FR_AR.get(term) || null;
    }
    return null;
  }

  /**
   * Ensure correct terminology is used
   */
  private ensureCorrectTerminology(
    text: string, 
    originalTerm: string, 
    correctTranslation: string, 
    targetLanguage: Language
  ): string {
    // This would implement logic to find and replace incorrect translations
    // with the correct legal terminology
    return text; // Placeholder
  }

  /**
   * Post-process legal translation for consistency
   */
  private postProcessLegalTranslation(
    text: string, 
    targetLanguage: Language, 
    legalContext?: LegalContext
  ): string {
    let processed = text;
    
    // Apply language-specific legal formatting
    if (targetLanguage === Language.ARABIC) {
      // Arabic legal text formatting
      processed = processed
        .replace(/\s+([،؛:])/g, '$1') // Remove space before Arabic punctuation
        .replace(/([،؛:])\s*/g, '$1 ') // Ensure space after punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    } else if (targetLanguage === Language.FRENCH) {
      // French legal text formatting
      processed = processed
        .replace(/\s+([.,:;!?])/g, '$1') // Remove space before punctuation
        .replace(/([.,:;!?])\s*/g, '$1 ') // Ensure space after punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    }
    
    return processed;
  }

  /**
   * Calculate translation confidence based on multiple factors
   */
  private calculateTranslationConfidence(
    originalText: string, 
    translatedText: string, 
    legalTerms: string[], 
    sourceLanguage: Language, 
    targetLanguage: Language
  ): number {
    let confidence = 0.8; // Base confidence for primary AI
    
    // Factor 1: Legal terminology presence and preservation
    if (legalTerms.length > 0) {
      confidence += 0.1; // Boost for legal content
    }
    
    // Factor 2: Text length appropriateness
    const lengthRatio = translatedText.length / originalText.length;
    if (lengthRatio >= 0.5 && lengthRatio <= 2.0) {
      confidence += 0.05; // Reasonable length ratio
    } else {
      confidence -= 0.1; // Suspicious length ratio
    }
    
    // Factor 3: Language consistency (no mixed scripts in output)
    const hasMixedScripts = this.detectMixedScripts(translatedText, targetLanguage);
    if (hasMixedScripts) {
      confidence -= 0.3; // Significant penalty for mixed scripts
    }
    
    // Factor 4: Legal context appropriateness
    if (this.countLegalTerms(translatedText) > 0) {
      confidence += 0.05; // Boost for maintaining legal terminology
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Count legal terms in text
   */
  private countLegalTerms(text: string): number {
    let count = 0;
    
    // Count Arabic legal terms
    this.LEGAL_TERMINOLOGY_AR_FR.forEach((_, arabicTerm) => {
      if (text.includes(arabicTerm)) count++;
    });
    
    // Count French legal terms
    this.LEGAL_TERMINOLOGY_FR_AR.forEach((_, frenchTerm) => {
      if (text.toLowerCase().includes(frenchTerm.toLowerCase())) count++;
    });
    
    return count;
  }

  /**
   * Detect mixed scripts in translated text
   */
  private detectMixedScripts(text: string, targetLanguage: Language): boolean {
    const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
    
    if (targetLanguage === Language.ARABIC) {
      // Arabic text should have minimal Latin characters
      return latinChars > arabicChars * 0.1;
    } else if (targetLanguage === Language.FRENCH) {
      // French text should have minimal Arabic characters
      return arabicChars > latinChars * 0.1;
    }
    
    return false;
  }
}