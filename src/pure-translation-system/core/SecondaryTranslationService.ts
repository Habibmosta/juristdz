/**
 * Secondary Translation Service
 * 
 * Rule-based translation service with hybrid approach as fallback for primary AI translation.
 * Implements dictionary-based translation with legal terminology focus and pattern matching
 * for the Pure Translation System with zero tolerance for language mixing.
 * 
 * Features:
 * - Rule-based translation with legal dictionary
 * - Pattern matching for legal phrases
 * - Hybrid approach combining multiple methods
 * - Template-based translation for common legal structures
 * - Enhanced fallback mechanisms
 * - Legal context preservation
 */

import {
  Language,
  TranslationAttempt,
  TranslationMethod,
  LegalContext,
  LegalDomain,
  TranslationError,
  TranslationWarning,
  Severity,
  CleanedContent,
  ContentIntent,
  LegalCategory,
  ComplexityLevel,
  AudienceType
} from '../types';

import { ISecondaryTranslationService } from '../interfaces/SecondaryTranslationService';

export class SecondaryTranslationService implements ISecondaryTranslationService {
  
  // Extended legal dictionary for rule-based translation
  private readonly COMPREHENSIVE_LEGAL_DICTIONARY_AR_FR = new Map([
    // Basic Legal Terms
    ['قانون', 'loi'],
    ['قانون مدني', 'code civil'],
    ['قانون جنائي', 'code pénal'],
    ['قانون تجاري', 'code de commerce'],
    ['قانون إداري', 'droit administratif'],
    ['دستور', 'constitution'],
    ['نظام', 'règlement'],
    ['مرسوم', 'décret'],
    ['قرار', 'arrêt'],
    ['حكم', 'jugement'],
    ['أمر', 'ordonnance'],
    
    // Legal Procedures
    ['إجراءات', 'procédure'],
    ['دعوى', 'action en justice'],
    ['طعن', 'recours'],
    ['استئناف', 'appel'],
    ['نقض', 'cassation'],
    ['تنفيذ', 'exécution'],
    ['تبليغ', 'signification'],
    ['استدعاء', 'citation'],
    ['جلسة', 'audience'],
    ['مرافعة', 'plaidoirie'],
    
    // Legal Entities and Roles
    ['محكمة', 'tribunal'],
    ['قاضي', 'juge'],
    ['محامي', 'avocat'],
    ['نائب عام', 'procureur général'],
    ['وكيل الجمهورية', 'procureur de la République'],
    ['كاتب ضبط', 'greffier'],
    ['خبير', 'expert'],
    ['شاهد', 'témoin'],
    ['متهم', 'accusé'],
    ['مدعي', 'demandeur'],
    ['مدعى عليه', 'défendeur'],
    
    // Civil Law Terms
    ['عقد', 'contrat'],
    ['التزام', 'obligation'],
    ['حق', 'droit'],
    ['ملكية', 'propriété'],
    ['حيازة', 'possession'],
    ['انتفاع', 'usufruit'],
    ['رهن', 'hypothèque'],
    ['ضمان', 'garantie'],
    ['تأمين', 'assurance'],
    ['ضرر', 'dommage'],
    ['تعويض', 'indemnisation'],
    ['مسؤولية', 'responsabilité'],
    
    // Criminal Law Terms
    ['جريمة', 'crime'],
    ['جنحة', 'délit'],
    ['مخالفة', 'contravention'],
    ['عقوبة', 'peine'],
    ['غرامة', 'amende'],
    ['حبس', 'emprisonnement'],
    ['سجن', 'réclusion'],
    ['إعدام', 'peine de mort'],
    ['عفو', 'grâce'],
    ['تقادم', 'prescription'],
    ['شروع', 'tentative'],
    ['اشتراك', 'complicité'],
    
    // Commercial Law Terms
    ['شركة', 'société'],
    ['تاجر', 'commerçant'],
    ['سجل تجاري', 'registre de commerce'],
    ['إفلاس', 'faillite'],
    ['تسوية قضائية', 'redressement judiciaire'],
    ['تصفية', 'liquidation'],
    ['أسهم', 'actions'],
    ['حصص', 'parts sociales'],
    ['رأس مال', 'capital social'],
    ['أرباح', 'bénéfices'],
    
    // Family Law Terms
    ['زواج', 'mariage'],
    ['طلاق', 'divorce'],
    ['خلع', 'khula'],
    ['نفقة', 'pension alimentaire'],
    ['حضانة', 'garde d\'enfants'],
    ['ولاية', 'tutelle'],
    ['وصاية', 'curatelle'],
    ['ميراث', 'succession'],
    ['وصية', 'testament'],
    ['هبة', 'donation'],
    
    // Administrative Law Terms
    ['إدارة', 'administration'],
    ['موظف', 'fonctionnaire'],
    ['خدمة عامة', 'service public'],
    ['مرفق عام', 'service public'],
    ['قرار إداري', 'décision administrative'],
    ['عقد إداري', 'contrat administratif'],
    ['نزع الملكية', 'expropriation'],
    ['منفعة عامة', 'utilité publique'],
    
    // Constitutional Law Terms
    ['سلطة تشريعية', 'pouvoir législatif'],
    ['سلطة تنفيذية', 'pouvoir exécutif'],
    ['سلطة قضائية', 'pouvoir judiciaire'],
    ['برلمان', 'parlement'],
    ['مجلس شعبي وطني', 'assemblée populaire nationale'],
    ['مجلس الأمة', 'conseil de la nation'],
    ['رئيس الجمهورية', 'président de la République'],
    ['حكومة', 'gouvernement'],
    ['وزير', 'ministre'],
    
    // Legal Procedures and Documents
    ['عريضة', 'requête'],
    ['مذكرة', 'mémoire'],
    ['دفوع', 'moyens de défense'],
    ['أدلة', 'preuves'],
    ['شهادة', 'témoignage'],
    ['خبرة', 'expertise'],
    ['معاينة', 'constat'],
    ['تحقيق', 'enquête'],
    ['استجواب', 'interrogatoire'],
    ['مواجهة', 'confrontation']
  ]);

  private readonly COMPREHENSIVE_LEGAL_DICTIONARY_FR_AR = new Map(
    Array.from(this.COMPREHENSIVE_LEGAL_DICTIONARY_AR_FR.entries()).map(([ar, fr]) => [fr, ar])
  );

  // Legal phrase patterns for rule-based translation
  private readonly LEGAL_PHRASE_PATTERNS_AR_FR = new Map([
    // Procedural phrases
    ['وفقا لأحكام المادة (\\d+)', 'conformément aux dispositions de l\'article $1'],
    ['بموجب القانون رقم (\\d+)', 'en vertu de la loi n° $1'],
    ['طبقا للمادة (\\d+)', 'selon l\'article $1'],
    ['في إطار تطبيق', 'dans le cadre de l\'application de'],
    ['مع مراعاة أحكام', 'sous réserve des dispositions de'],
    ['دون الإخلال بـ', 'sans préjudice de'],
    ['في جميع الأحوال', 'en tout état de cause'],
    ['على وجه الخصوص', 'en particulier'],
    ['بصفة استثنائية', 'à titre exceptionnel'],
    ['في أجل أقصاه (\\d+)', 'dans un délai maximum de $1'],
    
    // Court proceedings
    ['تقرر المحكمة', 'le tribunal décide'],
    ['حكمت المحكمة', 'le tribunal a jugé'],
    ['قررت المحكمة', 'le tribunal a décidé'],
    ['أمرت المحكمة', 'le tribunal a ordonné'],
    ['رفضت المحكمة', 'le tribunal a rejeté'],
    ['قبلت المحكمة', 'le tribunal a accepté'],
    ['أيدت محكمة الاستئناف', 'la cour d\'appel a confirmé'],
    ['نقضت المحكمة العليا', 'la Cour suprême a cassé'],
    
    // Legal obligations
    ['يلتزم الطرف الأول', 'la première partie s\'engage'],
    ['يتعهد الطرف الثاني', 'la seconde partie s\'engage'],
    ['من حق المدعي', 'le demandeur a le droit de'],
    ['على المدعى عليه', 'le défendeur doit'],
    ['يحق للمحكمة', 'le tribunal peut'],
    ['يجب على القاضي', 'le juge doit'],
    
    // Legal consequences
    ['يترتب على ذلك', 'il en résulte'],
    ['يستتبع ذلك', 'cela entraîne'],
    ['يؤدي إلى', 'cela conduit à'],
    ['ينجم عن ذلك', 'il en découle'],
    ['يستوجب ذلك', 'cela nécessite']
  ]);

  private readonly LEGAL_PHRASE_PATTERNS_FR_AR = new Map([
    // Procedural phrases
    ['conformément aux dispositions de l\'article (\\d+)', 'وفقا لأحكام المادة $1'],
    ['en vertu de la loi n° (\\d+)', 'بموجب القانون رقم $1'],
    ['selon l\'article (\\d+)', 'طبقا للمادة $1'],
    ['dans le cadre de l\'application de', 'في إطار تطبيق'],
    ['sous réserve des dispositions de', 'مع مراعاة أحكام'],
    ['sans préjudice de', 'دون الإخلال بـ'],
    ['en tout état de cause', 'في جميع الأحوال'],
    ['en particulier', 'على وجه الخصوص'],
    ['à titre exceptionnel', 'بصفة استثنائية'],
    ['dans un délai maximum de (\\d+)', 'في أجل أقصاه $1'],
    
    // Court proceedings
    ['le tribunal décide', 'تقرر المحكمة'],
    ['le tribunal a jugé', 'حكمت المحكمة'],
    ['le tribunal a décidé', 'قررت المحكمة'],
    ['le tribunal a ordonné', 'أمرت المحكمة'],
    ['le tribunal a rejeté', 'رفضت المحكمة'],
    ['le tribunal a accepté', 'قبلت المحكمة'],
    ['la cour d\'appel a confirmé', 'أيدت محكمة الاستئناف'],
    ['la Cour suprême a cassé', 'نقضت المحكمة العليا']
  ]);

  // Template-based translations for common legal structures
  private readonly LEGAL_TEMPLATES = new Map([
    // Contract templates
    ['contract_parties_ar', 'بين الطرف الأول: {party1} والطرف الثاني: {party2}'],
    ['contract_parties_fr', 'entre la première partie : {party1} et la seconde partie : {party2}'],
    
    // Court decision templates
    ['court_decision_ar', 'حكمت المحكمة {court} في القضية رقم {case_number}'],
    ['court_decision_fr', 'le tribunal {court} a jugé dans l\'affaire n° {case_number}'],
    
    // Legal article references
    ['article_ref_ar', 'المادة {number} من {law}'],
    ['article_ref_fr', 'l\'article {number} du {law}']
  ]);

  constructor() {
    // Initialize secondary translation service
  }

  /**
   * Translate using rule-based method with legal dictionary
   */
  async translateWithRuleBasedMethod(
    content: CleanedContent,
    targetLanguage: Language
  ): Promise<TranslationAttempt> {
    const startTime = Date.now();
    const errors: TranslationError[] = [];
    const warnings: TranslationWarning[] = [];

    try {
      const sourceLanguage = this.detectSourceLanguage(content.cleanedText);
      
      // Step 1: Apply dictionary-based translation
      let translatedText = this.applyDictionaryTranslation(
        content.cleanedText,
        sourceLanguage,
        targetLanguage
      );

      // Step 2: Apply phrase pattern matching
      translatedText = this.applyPhrasePatterns(
        translatedText,
        sourceLanguage,
        targetLanguage
      );

      // Step 3: Apply template-based translation for structured content
      translatedText = this.applyTemplateTranslation(
        translatedText,
        sourceLanguage,
        targetLanguage
      );

      // Step 4: Post-process for consistency
      translatedText = this.postProcessRuleBasedTranslation(
        translatedText,
        targetLanguage
      );

      // Step 5: Calculate confidence
      const confidence = this.calculateRuleBasedConfidence(
        content.cleanedText,
        translatedText,
        sourceLanguage,
        targetLanguage
      );

      const processingTime = Date.now() - startTime;

      // Add warnings for potential issues
      if (confidence < 0.6) {
        warnings.push({
          code: 'LOW_RULE_CONFIDENCE',
          message: 'Rule-based translation confidence is low',
          suggestion: 'Consider hybrid method or manual review'
        });
      }

      return {
        result: translatedText,
        method: TranslationMethod.RULE_BASED,
        confidence,
        processingTime,
        errors,
        warnings,
        metadata: {
          dictionaryMatches: this.countDictionaryMatches(content.cleanedText, sourceLanguage),
          patternMatches: this.countPatternMatches(content.cleanedText, sourceLanguage),
          templateUsed: this.detectTemplateUsage(content.cleanedText)
        }
      };

    } catch (error) {
      errors.push({
        code: 'RULE_TRANSLATION_FAILED',
        message: `Rule-based translation failed: ${error.message}`,
        severity: Severity.HIGH,
        recoverable: true,
        context: { textLength: content.cleanedText.length }
      });

      return {
        result: '',
        method: TranslationMethod.RULE_BASED,
        confidence: 0,
        processingTime: Date.now() - startTime,
        errors,
        warnings,
        metadata: { failed: true, error: error.message }
      };
    }
  }

  /**
   * Translate using hybrid method combining multiple approaches
   */
  async translateWithHybridMethod(
    content: CleanedContent,
    targetLanguage: Language,
    methods: TranslationMethod[]
  ): Promise<TranslationAttempt> {
    const startTime = Date.now();
    const errors: TranslationError[] = [];
    const warnings: TranslationWarning[] = [];

    try {
      const sourceLanguage = this.detectSourceLanguage(content.cleanedText);
      
      // Combine multiple translation approaches
      const translations: { text: string; confidence: number; method: TranslationMethod }[] = [];

      // Apply rule-based translation
      if (methods.includes(TranslationMethod.RULE_BASED)) {
        const ruleResult = await this.translateWithRuleBasedMethod(content, targetLanguage);
        if (ruleResult.result) {
          translations.push({
            text: ruleResult.result,
            confidence: ruleResult.confidence,
            method: TranslationMethod.RULE_BASED
          });
        }
      }

      // Apply dictionary-based translation
      if (methods.includes(TranslationMethod.LEGAL_DICTIONARY)) {
        const dictResult = this.applyDictionaryTranslation(
          content.cleanedText,
          sourceLanguage,
          targetLanguage
        );
        const dictConfidence = this.calculateDictionaryConfidence(
          content.cleanedText,
          dictResult,
          sourceLanguage
        );
        translations.push({
          text: dictResult,
          confidence: dictConfidence,
          method: TranslationMethod.LEGAL_DICTIONARY
        });
      }

      // Apply template-based translation
      if (methods.includes(TranslationMethod.TEMPLATE_BASED)) {
        const templateResult = this.applyTemplateTranslation(
          content.cleanedText,
          sourceLanguage,
          targetLanguage
        );
        const templateConfidence = this.calculateTemplateConfidence(
          content.cleanedText,
          templateResult
        );
        translations.push({
          text: templateResult,
          confidence: templateConfidence,
          method: TranslationMethod.TEMPLATE_BASED
        });
      }

      // Select best translation or combine results
      const bestTranslation = this.selectBestHybridResult(translations);
      
      const processingTime = Date.now() - startTime;

      return {
        result: bestTranslation.text,
        method: TranslationMethod.HYBRID,
        confidence: bestTranslation.confidence,
        processingTime,
        errors,
        warnings,
        metadata: {
          methodsUsed: methods,
          translationCandidates: translations.length,
          selectedMethod: bestTranslation.method
        }
      };

    } catch (error) {
      errors.push({
        code: 'HYBRID_TRANSLATION_FAILED',
        message: `Hybrid translation failed: ${error.message}`,
        severity: Severity.HIGH,
        recoverable: true,
        context: { methods, textLength: content.cleanedText.length }
      });

      return {
        result: '',
        method: TranslationMethod.HYBRID,
        confidence: 0,
        processingTime: Date.now() - startTime,
        errors,
        warnings,
        metadata: { failed: true, error: error.message }
      };
    }
  }

  /**
   * Detect content intent for contextual translation
   */
  async detectContentIntent(text: string): Promise<ContentIntent> {
    const legalCategory = this.detectLegalCategory(text);
    const concepts = this.extractLegalConcepts(text);
    const complexity = this.assessComplexity(text);
    const audience = this.inferAudience(text);
    
    return {
      category: legalCategory,
      concepts,
      context: {
        jurisdiction: 'Algeria',
        lawType: this.inferLawType(legalCategory),
        procedureType: this.inferProcedureType(text),
        courtLevel: this.inferCourtLevel(text),
        caseType: this.inferCaseType(text)
      },
      complexity,
      audience,
      confidence: this.calculateIntentConfidence(text, legalCategory, concepts)
    };
  }

  /**
   * Apply dictionary-based translation
   */
  private applyDictionaryTranslation(
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): string {
    let translated = text;

    if (sourceLanguage === Language.ARABIC && targetLanguage === Language.FRENCH) {
      // Apply Arabic to French dictionary
      this.COMPREHENSIVE_LEGAL_DICTIONARY_AR_FR.forEach((frenchTerm, arabicTerm) => {
        const regex = new RegExp(`\\b${this.escapeRegex(arabicTerm)}\\b`, 'g');
        translated = translated.replace(regex, frenchTerm);
      });
    } else if (sourceLanguage === Language.FRENCH && targetLanguage === Language.ARABIC) {
      // Apply French to Arabic dictionary
      this.COMPREHENSIVE_LEGAL_DICTIONARY_FR_AR.forEach((arabicTerm, frenchTerm) => {
        const regex = new RegExp(`\\b${this.escapeRegex(frenchTerm)}\\b`, 'gi');
        translated = translated.replace(regex, arabicTerm);
      });
    }

    return translated;
  }

  /**
   * Apply phrase pattern matching
   */
  private applyPhrasePatterns(
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): string {
    let translated = text;

    if (sourceLanguage === Language.ARABIC && targetLanguage === Language.FRENCH) {
      this.LEGAL_PHRASE_PATTERNS_AR_FR.forEach((frenchPattern, arabicPattern) => {
        const regex = new RegExp(arabicPattern, 'g');
        translated = translated.replace(regex, frenchPattern);
      });
    } else if (sourceLanguage === Language.FRENCH && targetLanguage === Language.ARABIC) {
      this.LEGAL_PHRASE_PATTERNS_FR_AR.forEach((arabicPattern, frenchPattern) => {
        const regex = new RegExp(frenchPattern, 'gi');
        translated = translated.replace(regex, arabicPattern);
      });
    }

    return translated;
  }

  /**
   * Apply template-based translation
   */
  private applyTemplateTranslation(
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): string {
    // This would implement template matching and replacement
    // For now, return the text as-is
    return text;
  }

  /**
   * Post-process rule-based translation
   */
  private postProcessRuleBasedTranslation(text: string, targetLanguage: Language): string {
    let processed = text;

    // Language-specific post-processing
    if (targetLanguage === Language.ARABIC) {
      // Arabic text formatting
      processed = processed
        .replace(/\s+([،؛:])/g, '$1') // Remove space before Arabic punctuation
        .replace(/([،؛:])\s*/g, '$1 ') // Ensure space after punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    } else if (targetLanguage === Language.FRENCH) {
      // French text formatting
      processed = processed
        .replace(/\s+([.,:;!?])/g, '$1') // Remove space before punctuation
        .replace(/([.,:;!?])\s*/g, '$1 ') // Ensure space after punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    }

    return processed;
  }

  /**
   * Calculate rule-based translation confidence
   */
  private calculateRuleBasedConfidence(
    originalText: string,
    translatedText: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): number {
    let confidence = 0.6; // Base confidence for rule-based method

    // Factor 1: Dictionary match coverage
    const dictionaryMatches = this.countDictionaryMatches(originalText, sourceLanguage);
    const totalWords = originalText.split(/\s+/).length;
    const coverageRatio = dictionaryMatches / totalWords;
    confidence += coverageRatio * 0.3;

    // Factor 2: Pattern match success
    const patternMatches = this.countPatternMatches(originalText, sourceLanguage);
    if (patternMatches > 0) {
      confidence += Math.min(0.2, patternMatches * 0.05);
    }

    // Factor 3: Translation completeness
    if (translatedText.length === 0) {
      confidence = 0;
    } else if (translatedText.length < originalText.length * 0.3) {
      confidence -= 0.2;
    }

    // Factor 4: No mixed scripts in output
    const hasMixedScripts = this.detectMixedScripts(translatedText, targetLanguage);
    if (hasMixedScripts) {
      confidence -= 0.3;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Select best result from hybrid translation candidates
   */
  private selectBestHybridResult(
    translations: { text: string; confidence: number; method: TranslationMethod }[]
  ): { text: string; confidence: number; method: TranslationMethod } {
    if (translations.length === 0) {
      return { text: '', confidence: 0, method: TranslationMethod.HYBRID };
    }

    // Sort by confidence and select the best
    translations.sort((a, b) => b.confidence - a.confidence);
    
    // Could implement more sophisticated combination logic here
    return translations[0];
  }

  /**
   * Detect source language from text
   */
  private detectSourceLanguage(text: string): Language {
    const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
    
    return arabicChars > latinChars ? Language.ARABIC : Language.FRENCH;
  }

  /**
   * Count dictionary matches in text
   */
  private countDictionaryMatches(text: string, sourceLanguage: Language): number {
    let matches = 0;
    
    if (sourceLanguage === Language.ARABIC) {
      this.COMPREHENSIVE_LEGAL_DICTIONARY_AR_FR.forEach((_, arabicTerm) => {
        if (text.includes(arabicTerm)) matches++;
      });
    } else if (sourceLanguage === Language.FRENCH) {
      this.COMPREHENSIVE_LEGAL_DICTIONARY_FR_AR.forEach((_, frenchTerm) => {
        if (text.toLowerCase().includes(frenchTerm.toLowerCase())) matches++;
      });
    }
    
    return matches;
  }

  /**
   * Count pattern matches in text
   */
  private countPatternMatches(text: string, sourceLanguage: Language): number {
    let matches = 0;
    
    if (sourceLanguage === Language.ARABIC) {
      this.LEGAL_PHRASE_PATTERNS_AR_FR.forEach((_, pattern) => {
        const regex = new RegExp(pattern, 'g');
        const patternMatches = text.match(regex);
        if (patternMatches) matches += patternMatches.length;
      });
    } else if (sourceLanguage === Language.FRENCH) {
      this.LEGAL_PHRASE_PATTERNS_FR_AR.forEach((_, pattern) => {
        const regex = new RegExp(pattern, 'gi');
        const patternMatches = text.match(regex);
        if (patternMatches) matches += patternMatches.length;
      });
    }
    
    return matches;
  }

  /**
   * Detect template usage in text
   */
  private detectTemplateUsage(text: string): boolean {
    // Simple template detection logic
    return text.includes('{') && text.includes('}');
  }

  /**
   * Calculate dictionary-based confidence
   */
  private calculateDictionaryConfidence(
    originalText: string,
    translatedText: string,
    sourceLanguage: Language
  ): number {
    const matches = this.countDictionaryMatches(originalText, sourceLanguage);
    const totalWords = originalText.split(/\s+/).length;
    return Math.min(0.8, (matches / totalWords) * 1.2);
  }

  /**
   * Calculate template-based confidence
   */
  private calculateTemplateConfidence(originalText: string, translatedText: string): number {
    const hasTemplate = this.detectTemplateUsage(originalText);
    return hasTemplate ? 0.7 : 0.3;
  }

  /**
   * Detect mixed scripts in text
   */
  private detectMixedScripts(text: string, targetLanguage: Language): boolean {
    const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
    
    if (targetLanguage === Language.ARABIC) {
      return latinChars > arabicChars * 0.1;
    } else if (targetLanguage === Language.FRENCH) {
      return arabicChars > latinChars * 0.1;
    }
    
    return false;
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Detect legal category from text
   */
  private detectLegalCategory(text: string): LegalCategory {
    // Simple category detection based on keywords
    if (text.includes('جنائي') || text.includes('pénal') || text.includes('crime')) {
      return LegalCategory.CRIMINAL_LAW;
    } else if (text.includes('تجاري') || text.includes('commercial') || text.includes('شركة')) {
      return LegalCategory.COMMERCIAL_LAW;
    } else if (text.includes('إداري') || text.includes('administratif')) {
      return LegalCategory.ADMINISTRATIVE_LAW;
    } else if (text.includes('أحوال شخصية') || text.includes('famille') || text.includes('زواج')) {
      return LegalCategory.FAMILY_LAW;
    }
    
    return LegalCategory.CIVIL_LAW; // Default
  }

  /**
   * Extract legal concepts from text
   */
  private extractLegalConcepts(text: string): any[] {
    // Placeholder for concept extraction logic
    return [];
  }

  /**
   * Assess text complexity
   */
  private assessComplexity(text: string): ComplexityLevel {
    const wordCount = text.split(/\s+/).length;
    const legalTermCount = this.countDictionaryMatches(text, this.detectSourceLanguage(text));
    
    if (wordCount > 500 || legalTermCount > 10) {
      return ComplexityLevel.EXPERT;
    } else if (wordCount > 200 || legalTermCount > 5) {
      return ComplexityLevel.COMPLEX;
    } else if (wordCount > 50 || legalTermCount > 2) {
      return ComplexityLevel.MODERATE;
    }
    
    return ComplexityLevel.SIMPLE;
  }

  /**
   * Infer target audience
   */
  private inferAudience(text: string): AudienceType {
    // Simple audience inference
    if (text.includes('محكمة') || text.includes('tribunal')) {
      return AudienceType.JUDGE;
    } else if (text.includes('محامي') || text.includes('avocat')) {
      return AudienceType.LAWYER;
    }
    
    return AudienceType.LEGAL_PROFESSIONAL;
  }

  /**
   * Infer law type from category
   */
  private inferLawType(category: LegalCategory): string {
    switch (category) {
      case LegalCategory.CIVIL_LAW: return 'civil';
      case LegalCategory.CRIMINAL_LAW: return 'pénal';
      case LegalCategory.COMMERCIAL_LAW: return 'commercial';
      case LegalCategory.ADMINISTRATIVE_LAW: return 'administratif';
      case LegalCategory.FAMILY_LAW: return 'famille';
      default: return 'général';
    }
  }

  /**
   * Infer procedure type from text
   */
  private inferProcedureType(text: string): string | undefined {
    if (text.includes('استئناف') || text.includes('appel')) {
      return 'appel';
    } else if (text.includes('نقض') || text.includes('cassation')) {
      return 'cassation';
    }
    return undefined;
  }

  /**
   * Infer court level from text
   */
  private inferCourtLevel(text: string): string | undefined {
    if (text.includes('المحكمة العليا') || text.includes('Cour suprême')) {
      return 'supreme';
    } else if (text.includes('محكمة الاستئناف') || text.includes('cour d\'appel')) {
      return 'appeal';
    } else if (text.includes('محكمة') || text.includes('tribunal')) {
      return 'first_instance';
    }
    return undefined;
  }

  /**
   * Infer case type from text
   */
  private inferCaseType(text: string): string | undefined {
    if (text.includes('مدني') || text.includes('civil')) {
      return 'civil';
    } else if (text.includes('جنائي') || text.includes('pénal')) {
      return 'criminal';
    } else if (text.includes('تجاري') || text.includes('commercial')) {
      return 'commercial';
    }
    return undefined;
  }

  /**
   * Calculate intent detection confidence
   */
  private calculateIntentConfidence(
    text: string,
    category: LegalCategory,
    concepts: any[]
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence based on legal terminology
    const legalTermCount = this.countDictionaryMatches(text, this.detectSourceLanguage(text));
    confidence += Math.min(0.3, legalTermCount * 0.05);
    
    // Boost confidence based on text length
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 20) {
      confidence += 0.1;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }
}