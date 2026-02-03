/**
 * Legal Terminology Manager - Comprehensive French-Arabic Legal Dictionary
 * 
 * Manages legal terminology for the Algerian legal system with precise
 * French-Arabic translations for legal terms, ensuring consistency
 * and accuracy in legal document translation.
 */

import {
  LegalDictionary,
  LegalTermEntry,
  LegalTermTranslation,
  LegalDomain,
  LegalContext,
  LegalAuthority,
  ReferenceType,
  TermUsage,
  TermSource,
  Language,
  TerminologyValidation,
  TerminologyInconsistency,
  TerminologySuggestion
} from '../types';
import { ILegalTerminologyManager } from '../interfaces/LegalTerminologyManager';
import { defaultLogger } from '../utils/Logger';

export class LegalTerminologyManager implements ILegalTerminologyManager {
  private dictionaries: Map<LegalDomain, LegalDictionary> = new Map();
  private termCache: Map<string, LegalTermTranslation> = new Map();
  private lastUpdateTime: Date = new Date();

  constructor() {
    this.initializeDictionaries();
    this.loadAlgerianLegalTerminology();
  }

  /**
   * Initialize legal dictionaries for all domains
   */
  private initializeDictionaries(): void {
    Object.values(LegalDomain).forEach(domain => {
      this.dictionaries.set(domain, {
        domain,
        terms: new Map(),
        lastUpdated: new Date(),
        version: '1.0.0',
        authority: LegalAuthority.ALGERIAN_GOVERNMENT
      });
    });
  }

  /**
   * Update terminology from user feedback
   */
  async updateTerminologyFromFeedback(examples: string[]): Promise<void> {
    // Process feedback examples to identify terminology improvements
    for (const example of examples) {
      await this.processTerminologyFeedback(example);
    }
    
    defaultLogger.info('Terminology updated from feedback', {
      examplesProcessed: examples.length
    }, 'LegalTerminologyManager');
  }

  /**
   * Process individual terminology feedback
   */
  private async processTerminologyFeedback(example: string): Promise<void> {
    // Extract potential legal terms from the example
    const terms = this.extractLegalTerms(example);
    
    for (const term of terms) {
      // Check if term needs to be added or updated in dictionary
      await this.reviewTermForUpdate(term, example);
    }
  }

  /**
   * Extract legal terms from text
   */
  private extractLegalTerms(text: string): string[] {
    // Simple term extraction - could be enhanced with NLP
    const legalKeywords = [
      'محامي', 'قاضي', 'محكمة', 'قانون', 'مادة', 'فصل', 'باب',
      'avocat', 'juge', 'tribunal', 'loi', 'article', 'chapitre'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => 
      legalKeywords.some(keyword => word.includes(keyword)) ||
      word.length > 4 // Potential legal terms are usually longer
    );
  }

  /**
   * Review term for dictionary update
   */
  private async reviewTermForUpdate(term: string, context: string): Promise<void> {
    // Check if term exists in any dictionary
    let found = false;
    
    for (const dictionary of this.dictionaries.values()) {
      for (const [key, entry] of dictionary.terms.entries()) {
        if (entry.frenchTerm.toLowerCase().includes(term.toLowerCase()) ||
            entry.arabicTerm.includes(term)) {
          found = true;
          // Update examples with new context
          if (!entry.examples.includes(context)) {
            entry.examples.push(context);
          }
          break;
        }
      }
      if (found) break;
    }
    
    if (!found) {
      // Mark term for manual review and potential addition
      defaultLogger.info('New legal term identified for review', {
        term,
        context: context.substring(0, 100)
      }, 'LegalTerminologyManager');
    }
  }

  /**
   * Load comprehensive Algerian legal terminology
   */
  private loadAlgerianLegalTerminology(): void {
    // Civil Law Terms
    this.addTermsToDictionary(LegalDomain.CIVIL_LAW, [
      {
        frenchTerm: 'contrat',
        arabicTerm: 'عقد',
        definition: 'اتفاق بين طرفين أو أكثر ينشئ التزامات متبادلة',
        context: { jurisdiction: 'Algérie', lawType: 'Code civil' },
        examples: ['عقد البيع', 'عقد الإيجار', 'عقد العمل'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 54 من القانون المدني الجزائري',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'obligation',
        arabicTerm: 'التزام',
        definition: 'رابطة قانونية بين الدائن والمدين',
        context: { jurisdiction: 'Algérie', lawType: 'Code civil' },
        examples: ['التزام بالدفع', 'التزام بالتسليم', 'التزام بالضمان'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 106 من القانون المدني الجزائري',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'responsabilité civile',
        arabicTerm: 'المسؤولية المدنية',
        definition: 'التزام بتعويض الضرر الناتج عن الفعل الضار',
        context: { jurisdiction: 'Algérie', lawType: 'Code civil' },
        examples: ['مسؤولية عقدية', 'مسؤولية تقصيرية', 'مسؤولية شخصية'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 124 من القانون المدني الجزائري',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'dommages-intérêts',
        arabicTerm: 'التعويض',
        definition: 'مبلغ مالي يدفع لجبر الضرر',
        context: { jurisdiction: 'Algérie', lawType: 'Code civil' },
        examples: ['تعويض مادي', 'تعويض معنوي', 'تعويض كامل'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 131 من القانون المدني الجزائري',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'propriété',
        arabicTerm: 'الملكية',
        definition: 'حق عيني أصلي يخول صاحبه سلطات الاستعمال والاستغلال والتصرف',
        context: { jurisdiction: 'Algérie', lawType: 'Code civil' },
        examples: ['ملكية عقارية', 'ملكية منقولة', 'ملكية فكرية'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 674 من القانون المدني الجزائري',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      }
    ]);

    // Criminal Law Terms
    this.addTermsToDictionary(LegalDomain.CRIMINAL_LAW, [
      {
        frenchTerm: 'crime',
        arabicTerm: 'جناية',
        definition: 'فعل مجرم يعاقب عليه بعقوبة جنائية',
        context: { jurisdiction: 'Algérie', lawType: 'Code pénal' },
        examples: ['جناية القتل', 'جناية السرقة الموصوفة', 'جناية الخيانة'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 27 من قانون العقوبات الجزائري',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'délit',
        arabicTerm: 'جنحة',
        definition: 'فعل مجرم يعاقب عليه بعقوبة جنحية',
        context: { jurisdiction: 'Algérie', lawType: 'Code pénal' },
        examples: ['جنحة الضرب', 'جنحة السب', 'جنحة إتلاف الممتلكات'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 28 من قانون العقوبات الجزائري',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'contravention',
        arabicTerm: 'مخالفة',
        definition: 'فعل مجرم يعاقب عليه بعقوبة ضبطية',
        context: { jurisdiction: 'Algérie', lawType: 'Code pénal' },
        examples: ['مخالفة مرورية', 'مخالفة إدارية', 'مخالفة بسيطة'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 29 من قانون العقوبات الجزائري',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'accusé',
        arabicTerm: 'متهم',
        definition: 'شخص منسوب إليه ارتكاب جريمة',
        context: { jurisdiction: 'Algérie', lawType: 'Code de procédure pénale' },
        examples: ['متهم بالقتل', 'متهم بالسرقة', 'متهم بالاحتيال'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 100 من قانون الإجراءات الجزائية',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'victime',
        arabicTerm: 'ضحية',
        definition: 'شخص تضرر من الجريمة',
        context: { jurisdiction: 'Algérie', lawType: 'Code de procédure pénale' },
        examples: ['ضحية الاعتداء', 'ضحية السرقة', 'ضحية الاحتيال'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 72 من قانون الإجراءات الجزائية',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      }
    ]);

    // Commercial Law Terms
    this.addTermsToDictionary(LegalDomain.COMMERCIAL_LAW, [
      {
        frenchTerm: 'société',
        arabicTerm: 'شركة',
        definition: 'عقد بين شخصين أو أكثر لممارسة نشاط تجاري',
        context: { jurisdiction: 'Algérie', lawType: 'Code de commerce' },
        examples: ['شركة ذات مسؤولية محدودة', 'شركة مساهمة', 'شركة تضامن'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 416 من القانون التجاري الجزائري',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'commerçant',
        arabicTerm: 'تاجر',
        definition: 'شخص يمارس الأعمال التجارية بصفة اعتيادية',
        context: { jurisdiction: 'Algérie', lawType: 'Code de commerce' },
        examples: ['تاجر تجزئة', 'تاجر جملة', 'تاجر مستورد'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 1 من القانون التجاري الجزائري',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'faillite',
        arabicTerm: 'إفلاس',
        definition: 'حالة التوقف عن دفع الديون التجارية',
        context: { jurisdiction: 'Algérie', lawType: 'Code de commerce' },
        examples: ['إفلاس بسيط', 'إفلاس احتيالي', 'إفلاس تقصيري'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 215 من القانون التجاري الجزائري',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      }
    ]);

    // Administrative Law Terms
    this.addTermsToDictionary(LegalDomain.ADMINISTRATIVE_LAW, [
      {
        frenchTerm: 'décision administrative',
        arabicTerm: 'قرار إداري',
        definition: 'عمل قانوني انفرادي صادر عن السلطة الإدارية',
        context: { jurisdiction: 'Algérie', lawType: 'Droit administratif' },
        examples: ['قرار تعيين', 'قرار فصل', 'قرار ترقية'],
        references: [{
          type: ReferenceType.JURISPRUDENCE,
          citation: 'قرار مجلس الدولة الجزائري',
          authority: LegalAuthority.SUPREME_COURT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'recours administratif',
        arabicTerm: 'طعن إداري',
        definition: 'وسيلة قانونية للاعتراض على القرار الإداري',
        context: { jurisdiction: 'Algérie', lawType: 'Droit administratif' },
        examples: ['طعن هرمي', 'طعن ولائي', 'طعن بالإلغاء'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'قانون الإجراءات المدنية والإدارية',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      }
    ]);

    // Family Law Terms
    this.addTermsToDictionary(LegalDomain.FAMILY_LAW, [
      {
        frenchTerm: 'mariage',
        arabicTerm: 'زواج',
        definition: 'عقد شرعي بين رجل وامرأة',
        context: { jurisdiction: 'Algérie', lawType: 'Code de la famille' },
        examples: ['زواج شرعي', 'زواج مدني', 'زواج مختلط'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 4 من قانون الأسرة الجزائري',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'divorce',
        arabicTerm: 'طلاق',
        definition: 'حل الرابطة الزوجية',
        context: { jurisdiction: 'Algérie', lawType: 'Code de la famille' },
        examples: ['طلاق بالتراضي', 'طلاق للضرر', 'طلاق للشقاق'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 48 من قانون الأسرة الجزائري',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'garde des enfants',
        arabicTerm: 'حضانة الأطفال',
        definition: 'حق رعاية الطفل وتربيته',
        context: { jurisdiction: 'Algérie', lawType: 'Code de la famille' },
        examples: ['حضانة الأم', 'حضانة الأب', 'حضانة الجدة'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 65 من قانون الأسرة الجزائري',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      }
    ]);

    // Procedural Law Terms
    this.addTermsToDictionary(LegalDomain.PROCEDURAL_LAW, [
      {
        frenchTerm: 'action en justice',
        arabicTerm: 'دعوى قضائية',
        definition: 'حق اللجوء إلى القضاء لحماية حق أو مصلحة',
        context: { jurisdiction: 'Algérie', lawType: 'Code de procédure civile' },
        examples: ['دعوى مدنية', 'دعوى جزائية', 'دعوى إدارية'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 13 من قانون الإجراءات المدنية والإدارية',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'jugement',
        arabicTerm: 'حكم',
        definition: 'قرار قضائي صادر عن محكمة الدرجة الأولى',
        context: { jurisdiction: 'Algérie', lawType: 'Code de procédure civile' },
        examples: ['حكم ابتدائي', 'حكم نهائي', 'حكم غيابي'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 199 من قانون الإجراءات المدنية والإدارية',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      },
      {
        frenchTerm: 'appel',
        arabicTerm: 'استئناف',
        definition: 'طريق طعن عادي في الأحكام الابتدائية',
        context: { jurisdiction: 'Algérie', lawType: 'Code de procédure civile' },
        examples: ['استئناف مدني', 'استئناف جزائي', 'استئناف إداري'],
        references: [{
          type: ReferenceType.LAW,
          citation: 'المادة 323 من قانون الإجراءات المدنية والإدارية',
          authority: LegalAuthority.ALGERIAN_GOVERNMENT
        }],
        confidence: 1.0,
        lastVerified: new Date()
      }
    ]);

    defaultLogger.info('Legal terminology loaded', {
      totalTerms: this.getTotalTermsCount(),
      domains: Object.keys(LegalDomain).length
    }, 'LegalTerminologyManager');
  }

  /**
   * Add terms to a specific legal domain dictionary
   */
  private addTermsToDictionary(domain: LegalDomain, terms: LegalTermEntry[]): void {
    const dictionary = this.dictionaries.get(domain);
    if (!dictionary) return;

    terms.forEach(term => {
      dictionary.terms.set(term.frenchTerm.toLowerCase(), term);
      // Also index by Arabic term for reverse lookup
      dictionary.terms.set(term.arabicTerm, term);
    });

    dictionary.lastUpdated = new Date();
  }

  /**
   * Translate legal term with context awareness
   */
  async translateLegalTerm(
    term: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    context?: LegalContext
  ): Promise<LegalTermTranslation | null> {
    const cacheKey = `${term}_${sourceLanguage}_${targetLanguage}`;
    
    // Check cache first
    if (this.termCache.has(cacheKey)) {
      return this.termCache.get(cacheKey)!;
    }

    const normalizedTerm = term.toLowerCase().trim();
    let bestMatch: LegalTermEntry | null = null;
    let bestDomain: LegalDomain | null = null;

    // Search across all dictionaries
    for (const [domain, dictionary] of this.dictionaries) {
      const termEntry = dictionary.terms.get(normalizedTerm);
      if (termEntry) {
        bestMatch = termEntry;
        bestDomain = domain;
        break;
      }
    }

    if (!bestMatch || !bestDomain) {
      return null;
    }

    // Create translation result
    const translation: LegalTermTranslation = {
      originalTerm: term,
      translatedTerm: sourceLanguage === Language.FRENCH 
        ? bestMatch.arabicTerm 
        : bestMatch.frenchTerm,
      confidence: bestMatch.confidence,
      context: context || bestMatch.context,
      alternatives: this.getAlternativeTranslations(bestMatch, bestDomain),
      usage: TermUsage.FORMAL,
      source: TermSource.OFFICIAL_DICTIONARY
    };

    // Cache the result
    this.termCache.set(cacheKey, translation);

    return translation;
  }

  /**
   * Get alternative translations for a term
   */
  private getAlternativeTranslations(term: LegalTermEntry, domain: LegalDomain): string[] {
    // For now, return examples as alternatives
    return term.examples.slice(0, 3);
  }

  /**
   * Validate terminology consistency in text
   */
  async validateTerminologyConsistency(
    text: string,
    language: Language,
    context?: LegalContext
  ): Promise<TerminologyValidation> {
    const inconsistencies: TerminologyInconsistency[] = [];
    const suggestions: TerminologySuggestion[] = [];
    
    // Extract potential legal terms from text
    const potentialTerms = this.extractLegalTerms(text, language);
    
    let totalTerms = 0;
    let validTerms = 0;

    for (const term of potentialTerms) {
      totalTerms++;
      
      const translation = await this.translateLegalTerm(
        term,
        language,
        language === Language.FRENCH ? Language.ARABIC : Language.FRENCH,
        context
      );

      if (translation) {
        validTerms++;
        
        // Check if the term is used consistently
        if (translation.confidence < 0.8) {
          suggestions.push({
            term,
            suggestion: translation.translatedTerm,
            reason: 'Terme juridique avec traduction officielle disponible',
            confidence: translation.confidence
          });
        }
      } else {
        // Term not found in dictionary
        inconsistencies.push({
          term,
          expectedTranslation: 'Non trouvé dans le dictionnaire juridique',
          actualTranslation: term,
          confidence: 0.0,
          context: context || { jurisdiction: 'Algérie', lawType: 'Général' }
        });
      }
    }

    const score = totalTerms > 0 ? (validTerms / totalTerms) : 1.0;

    return {
      isValid: score >= 0.8,
      score,
      inconsistencies,
      suggestions
    };
  }

  /**
   * Extract potential legal terms from text
   */
  private extractLegalTerms(text: string, language: Language): string[] {
    const terms: string[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Check each word and phrase against our dictionaries
    for (const [domain, dictionary] of this.dictionaries) {
      for (const [key, termEntry] of dictionary.terms) {
        if (text.toLowerCase().includes(key.toLowerCase())) {
          terms.push(language === Language.FRENCH ? termEntry.frenchTerm : termEntry.arabicTerm);
        }
      }
    }

    return [...new Set(terms)]; // Remove duplicates
  }

  /**
   * Get legal dictionary for specific domain
   */
  getLegalDictionary(domain: LegalDomain): LegalDictionary | null {
    return this.dictionaries.get(domain) || null;
  }

  /**
   * Search terms by pattern
   */
  searchTerms(pattern: string, domain?: LegalDomain): LegalTermEntry[] {
    const results: LegalTermEntry[] = [];
    const searchPattern = pattern.toLowerCase();
    
    const domainsToSearch = domain ? [domain] : Array.from(this.dictionaries.keys());
    
    for (const searchDomain of domainsToSearch) {
      const dictionary = this.dictionaries.get(searchDomain);
      if (!dictionary) continue;
      
      for (const [key, term] of dictionary.terms) {
        if (key.includes(searchPattern) || 
            term.frenchTerm.toLowerCase().includes(searchPattern) ||
            term.arabicTerm.includes(searchPattern)) {
          results.push(term);
        }
      }
    }
    
    return results;
  }

  /**
   * Add custom legal term
   */
  addCustomTerm(domain: LegalDomain, term: LegalTermEntry): boolean {
    try {
      const dictionary = this.dictionaries.get(domain);
      if (!dictionary) return false;
      
      dictionary.terms.set(term.frenchTerm.toLowerCase(), term);
      dictionary.terms.set(term.arabicTerm, term);
      dictionary.lastUpdated = new Date();
      
      // Clear cache to ensure fresh lookups
      this.termCache.clear();
      
      defaultLogger.info('Custom legal term added', {
        domain,
        frenchTerm: term.frenchTerm,
        arabicTerm: term.arabicTerm
      }, 'LegalTerminologyManager');
      
      return true;
    } catch (error) {
      defaultLogger.error('Failed to add custom term', { error, domain, term }, 'LegalTerminologyManager');
      return false;
    }
  }

  /**
   * Update existing term
   */
  updateTerm(domain: LegalDomain, frenchTerm: string, updates: Partial<LegalTermEntry>): boolean {
    try {
      const dictionary = this.dictionaries.get(domain);
      if (!dictionary) return false;
      
      const existingTerm = dictionary.terms.get(frenchTerm.toLowerCase());
      if (!existingTerm) return false;
      
      const updatedTerm = { ...existingTerm, ...updates, lastVerified: new Date() };
      dictionary.terms.set(frenchTerm.toLowerCase(), updatedTerm);
      dictionary.lastUpdated = new Date();
      
      // Clear cache
      this.termCache.clear();
      
      return true;
    } catch (error) {
      defaultLogger.error('Failed to update term', { error, domain, frenchTerm }, 'LegalTerminologyManager');
      return false;
    }
  }

  /**
   * Get total terms count across all dictionaries
   */
  getTotalTermsCount(): number {
    let total = 0;
    for (const dictionary of this.dictionaries.values()) {
      total += dictionary.terms.size;
    }
    return Math.floor(total / 2); // Divide by 2 because each term is indexed twice (French and Arabic)
  }

  /**
   * Get dictionary statistics
   */
  getDictionaryStats(): { [domain: string]: number } {
    const stats: { [domain: string]: number } = {};
    
    for (const [domain, dictionary] of this.dictionaries) {
      stats[domain] = Math.floor(dictionary.terms.size / 2);
    }
    
    return stats;
  }

  /**
   * Clear term cache
   */
  clearCache(): void {
    this.termCache.clear();
    defaultLogger.info('Legal terminology cache cleared', {}, 'LegalTerminologyManager');
  }

  /**
   * Export dictionary to JSON
   */
  exportDictionary(domain?: LegalDomain): string {
    const dataToExport = domain 
      ? { [domain]: this.dictionaries.get(domain) }
      : Object.fromEntries(this.dictionaries);
    
    return JSON.stringify(dataToExport, null, 2);
  }

  /**
   * Get last update time
   */
  getLastUpdateTime(): Date {
    return this.lastUpdateTime;
  }
}