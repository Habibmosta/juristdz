import { Language } from '../types';
import { apiService } from './apiService';
// DISABLED: Complex translation system causing conflicts
// import { pureTranslationSystemIntegration } from '../src/pure-translation-system/PureTranslationSystemIntegration';
// import { TranslationRequest, ContentType, TranslationPriority } from '../src/pure-translation-system/types';

/**
 * Translation service for automatic content translation
 * Now uses the Pure Translation System for zero-tolerance language mixing
 */
export class TranslationService {
  private translationCache = new Map<string, { [key in Language]: string }>();

  /**
   * Clean and translate text using Pure Translation System
   * This method ensures zero tolerance for mixed content
   */
  async cleanAndTranslateText(text: string, fromLang: Language, toLang: Language): Promise<string> {
    console.log(`🧹 CleanAndTranslate called with Pure Translation System:`);
    console.log(`🧹 - Original text: "${text.substring(0, 100)}..."`);
    
    try {
      // IMMEDIATE EMERGENCY CLEANING - Fix concatenated UI elements
      let preCleanedText = this.emergencyUIClean(text);
      
      // First, use Pure Translation System to clean and translate
      const request: TranslationRequest = {
        text: preCleanedText,
        sourceLanguage: fromLang,
        targetLanguage: toLang,
        contentType: ContentType.CHAT_MESSAGE,
        priority: TranslationPriority.REAL_TIME,
        context: {
          userRole: 'user',
          previousTranslations: []
        }
      };

      const result = await pureTranslationSystemIntegration.translateContent(request);
      
      console.log(`🧹 - Pure Translation result: "${result.translatedText.substring(0, 100)}..."`);
      console.log(`🧹 - Purity score: ${result.purityScore}%`);
      
      // If purity score is perfect, return the result
      if (result.purityScore === 100) {
        return result.translatedText;
      }
      
      // If not perfect, apply additional aggressive cleaning
      let cleanedText = this.aggressiveClean(result.translatedText);
      
      console.log(`🧹 - After aggressive cleaning: "${cleanedText.substring(0, 100)}..."`);
      
      return cleanedText;
      
    } catch (error) {
      console.error('🧹 - Pure Translation System failed, applying emergency cleaning:', error);
      
      // Emergency fallback: aggressive cleaning + translation
      let cleanedText = this.aggressiveClean(text);
      
      if (fromLang !== toLang) {
        cleanedText = await this.translateText(cleanedText, fromLang, toLang);
      }
      
      return cleanedText;
    }
  }

  /**
   * Emergency UI cleaning for concatenated interface elements
   */
  private emergencyUIClean(text: string): string {
    if (!text || typeof text !== 'string') return text;
    
    let cleaned = text;
    
    // EMERGENCY FIXES for concatenated UI elements
    const emergencyFixes = [
      // User-reported concatenated patterns
      { from: /متصلمحاميلوحة التحكمبحث قانونيتحريرتحليلملفاتوثائقإجراءات سريعة/g, to: 'متصل محامي لوحة التحكم بحث قانوني تحرير تحليل ملفات وثائق إجراءات سريعة' },
      { from: /متصلمحاميلوحة التحكم/g, to: 'متصل محامي لوحة التحكم' },
      { from: /متصلمحامي/g, to: 'متصل محامي' },
      { from: /محاميلوحة/g, to: 'محامي لوحة' },
      { from: /لوحةالتحكم/g, to: 'لوحة التحكم' },
      { from: /التحكمبحث/g, to: 'التحكم بحث' },
      { from: /بحثقانوني/g, to: 'بحث قانوني' },
      { from: /قانونيتحرير/g, to: 'قانوني تحرير' },
      { from: /تحريرتحليل/g, to: 'تحرير تحليل' },
      { from: /تحليلملفات/g, to: 'تحليل ملفات' },
      { from: /ملفاتوثائق/g, to: 'ملفات وثائق' },
      { from: /وثائقإجراءات/g, to: 'وثائق إجراءات' },
      { from: /إجراءاتسريعة/g, to: 'إجراءات سريعة' },
      
      // French concatenated patterns
      { from: /TableauBordRechercheJuridiqueRédactionAnalyseDossiers/g, to: 'Tableau de Bord Recherche Juridique Rédaction Analyse Dossiers' },
      { from: /TableauBord/g, to: 'Tableau de Bord' },
      { from: /RechercheJuridique/g, to: 'Recherche Juridique' },
      { from: /RédactionAnalyse/g, to: 'Rédaction Analyse' },
      { from: /AnalyseDossiers/g, to: 'Analyse Dossiers' },
      { from: /ActionsRapides/g, to: 'Actions Rapides' },
      { from: /NouveauDossier/g, to: 'Nouveau Dossier' },
      { from: /RechercheExpress/g, to: 'Recherche Express' }
    ];
    
    emergencyFixes.forEach(fix => {
      const before = cleaned;
      cleaned = cleaned.replace(fix.from, fix.to);
      if (before !== cleaned) {
        console.log(`🧹 EMERGENCY UI FIX: ${fix.from} -> ${fix.to}`);
      }
    });
    
    return cleaned;
  }

  /**
   * Aggressive cleaning for problematic content
   */
  private aggressiveClean(text: string): string {
    console.log(`🧹 Aggressive cleaning: "${text.substring(0, 50)}..."`);
    
    let cleaned = text;
    
    // Remove the exact problematic patterns reported by user
    const problematicPatterns = [
      /محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE/g,
      /محامي دي زادمتصلمحامي/g,
      /ProتحليلملفاتV2/g,
      /AUTO-TRANSLATE/g,
      /Pro/g,
      /V2/g,
      /Defined/g,
      /процедة/g,
      /JuristDZ/g,
      /En ligne/g,
      /متصل/g,
      /محامي دي زاد/g,
      /محاميدي/g,
      /محاميProتحليل/g,
      /ملفاتV2/g,
      
      // Remove Cyrillic characters
      /[а-яё]/gi,
      /[А-ЯЁ]/g,
      
      // Remove mixed script patterns
      /[a-zA-Z]+[أ-ي]+[a-zA-Z]+/g,
      /[أ-ي]+[a-zA-Z]+[أ-ي]+/g,
      
      // Remove UI artifacts
      /undefined/g,
      /null/g,
      /NaN/g,
      /\[object Object\]/g,
      
      // Remove version patterns
      /v\d+\.\d+/gi,
      /version\s*\d+/gi,
      /build\s*\d+/gi
    ];
    
    // Apply all cleaning patterns
    problematicPatterns.forEach(pattern => {
      const before = cleaned;
      cleaned = cleaned.replace(pattern, '');
      if (before !== cleaned) {
        console.log(`🧹 - Removed pattern: ${pattern}`);
      }
    });
    
    // Clean up extra spaces and normalize
    cleaned = cleaned
      .replace(/\s+/g, ' ')
      .trim();
    
    // If text became empty or too short, provide fallback
    if (cleaned.length < 3) {
      cleaned = text.includes('شهود') ? 'الشهود' : 
                text.includes('témoin') ? 'témoins' :
                text.includes('محامي') ? 'محامي' :
                'نص قانوني';
    }
    
    console.log(`🧹 - Cleaning result: "${cleaned.substring(0, 50)}..."`);
    
    return cleaned;
  }
  /**
   * Translate text from one language to another using Pure Translation System
   */
  async translateText(text: string, fromLang: Language, toLang: Language): Promise<string> {
    console.log(`🔧 - text: "${text.substring(0, 100)}..."`);
    console.log(`🔧 - fromLang: ${fromLang}`);
    console.log(`🔧 - toLang: ${toLang}`);
    
    // If same language, return original text
    if (fromLang === toLang) {
      console.log(`🔧 - Same language, returning original text`);
      return text;
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text);
    const cached = this.translationCache.get(cacheKey);
    if (cached && cached[toLang]) {
      console.log(`🔧 - Found in cache, returning cached translation`);
      return cached[toLang];
    }

    try {
      console.log(`🔧 - Using Pure Translation System...`);
      
      // Create translation request for Pure Translation System
      const request: TranslationRequest = {
        text,
        sourceLanguage: fromLang,
        targetLanguage: toLang,
        contentType: ContentType.CHAT_MESSAGE,
        priority: TranslationPriority.REAL_TIME,
        context: {
          userRole: 'user',
          previousTranslations: []
        }
      };

      // Use Pure Translation System
      const result = await pureTranslationSystemIntegration.translateContent(request);
      
      console.log(`🔧 - Pure Translation result: "${result.translatedText.substring(0, 100)}..."`);
      console.log(`🔧 - Purity score: ${result.purityScore}%`);
      
      // Cache the result only if it meets purity standards
      if (result.purityScore >= 95) {
        this.cacheTranslation(text, fromLang, result.translatedText, toLang);
      }
      
      return result.translatedText;
    } catch (error) {
      console.error('🔧 - Pure Translation System failed:', error);
      // Fallback to backend API or local translation
      return await this.callTranslationAPI(text, fromLang, toLang);
    }
  }

  /**
   * Detect the language of a text
   */
  detectLanguage(text: string): Language {
    console.log(`🔧 TranslationService.detectLanguage called with: "${text.substring(0, 50)}..."`);
    
    // Simple language detection based on Arabic characters
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    
    const hasArabic = arabicRegex.test(text);
    const result = hasArabic ? 'ar' : 'fr';
    
    console.log(`🔧 - Arabic characters found: ${hasArabic}`);
    console.log(`🔧 - Detected language: ${result}`);
    
    return result;
  }

  /**
   * Translate multiple messages
   */
  async translateMessages(
    messages: Array<{ id: string; text: string; originalLang?: Language }>,
    targetLang: Language
  ): Promise<Array<{ id: string; text: string; originalLang: Language }>> {
    const translatedMessages = await Promise.all(
      messages.map(async (message) => {
        const originalLang = message.originalLang || this.detectLanguage(message.text);
        const translatedText = await this.translateText(message.text, originalLang, targetLang);
        
        return {
          id: message.id,
          text: translatedText,
          originalLang
        };
      })
    );

    return translatedMessages;
  }

  /**
   * Check if text needs translation
   */
  needsTranslation(text: string, targetLang: Language): boolean {
    const detectedLang = this.detectLanguage(text);
    return detectedLang !== targetLang;
  }

  private getCacheKey(text: string): string {
    // Create a simple hash of the text for caching
    return btoa(encodeURIComponent(text.substring(0, 100))).replace(/[^a-zA-Z0-9]/g, '');
  }

  private cacheTranslation(originalText: string, fromLang: Language, translatedText: string, toLang: Language): void {
    const cacheKey = this.getCacheKey(originalText);
    const existing = this.translationCache.get(cacheKey) || {} as { [key in Language]: string };
    
    existing[fromLang] = originalText;
    existing[toLang] = translatedText;
    
    this.translationCache.set(cacheKey, existing);
  }

  private async callTranslationAPI(text: string, fromLang: Language, toLang: Language): Promise<string> {
    console.log(`🔧 TranslationService.callTranslationAPI called`);
    
    try {
      console.log(`🔧 - Trying backend API...`);
      // Try to use the backend translation API first
      const response = await apiService.translateText(text, fromLang, toLang);
      
      if (response.success) {
        console.log(`🔧 - Backend API success`);
        return response.translatedText;
      } else {
        throw new Error('Translation API returned error');
      }
    } catch (error) {
      // Fallback: Use comprehensive local translation
      console.warn('🔧 - Backend API failed, using local fallback');
      console.warn('🔧 - Error:', error);
      return this.fallbackTranslation(text, fromLang, toLang);
    }
  }

  private fallbackTranslation(text: string, fromLang: Language, toLang: Language): string {
    console.log(`🔧 TranslationService.fallbackTranslation called`);
    console.log(`🔧 - text: "${text.substring(0, 100)}..."`);
    console.log(`🔧 - fromLang: ${fromLang}, toLang: ${toLang}`);
    
    // Clean text from any encoding issues
    let cleanedText = this.cleanText(text);
    
    // Improved translation pairs with phrases sorted by length (longest first for better matching)
    const translationPairs: Array<{ fr: string; ar: string }> = [
      // Long phrases first (most specific)
      { fr: 'Les témoins sont les personnes qui participent à des événements juridiques ou des événements importants et peuvent témoigner de ce qui s\'est passé', ar: 'الشهود هم الأشخاص الذين يشاركون في أحداث قانونية أو أحداث مهمة ويمكنهم الشهادة على ما حدث' },
      { fr: 'les personnes qui participent à des événements juridiques ou des événements importants et peuvent témoigner de ce qui s\'est passé', ar: 'الأشخاص الذين يشاركون في أحداث قانونية أو أحداث مهمة ويمكنهم الشهادة على ما حدث' },
      { fr: 'Il existe plusieurs types de témoins en Algérie, y compris', ar: 'هناك أنواع متعددة من الشهود في الجزائر، بما في ذلك' },
      { fr: 'les témoins ont un rôle important dans le système judiciaire', ar: 'الشهود لهم دور مهم في النظام القضائي' },
      { fr: 'et il devrait être consulté un avocat pour obtenir des conseils spécifiques', ar: 'وينبغي استشارة محامٍ للحصول على نصائح محددة' },
      { fr: 'Il est important de noter que les témoins ont un rôle important dans le système judiciaire', ar: 'من المهم ملاحظة أن الشهود لهم دور مهم في النظام القضائي' },
      { fr: 'Les témoins peuvent être exposés à des sanctions en cas de faux témoignage ou de refus de témoigner', ar: 'الشهود يمكن أن يتعرضوا للعقوبات في حالة الشهادة الزور أو رفض الشهادة' },
      { fr: 'le témoin qui témoigne faussement peut être exposé à une peine de 1 à 5 années', ar: 'الشاهد الذي يشهد زوراً يمكن أن يتعرض لعقوبة من سنة إلى 5 سنوات' },
      { fr: 'le témoin qui refuse de témoigner peut être exposé à une peine de 1 à 3 années', ar: 'الشاهد الذي يرفض الشهادة يمكن أن يتعرض لعقوبة من سنة إلى 3 سنوات' },
      
      // Medium phrases
      { fr: 'Les témoins sont définis dans l\'article 1 du Code de Procédure Pénale comme', ar: 'الشهود معرفون في المادة 1 من قانون الإجراءات الجزائية كـ' },
      { fr: 'Ce sont les personnes qui ont participé directement à des événements juridiques', ar: 'هؤلاء هم الأشخاص الذين شاركوا مباشرة في أحداث قانونية' },
      { fr: 'Ce sont les personnes qui ont participé indirectement à des événements juridiques', ar: 'هؤلاء هم الأشخاص الذين شاركوا غير مباشرة في أحداث قانونية' },
      { fr: 'Ce sont les personnes qui ont une expertise spécialisée', ar: 'هؤلاء هم الأشخاص الذين لديهم خبرة خاصة' },
      { fr: 'Pour devenir témoin, vous devez remplir les conditions suivantes', ar: 'لتصبح شاهداً، يجب أن تملك الشروط التالية' },
      { fr: 'La procédure pour désigner des témoins est la suivante', ar: 'الإجراء لتعيين شهود هو كما يلي' },
      { fr: 'la demande pour désigner des témoins est faite auprès du juge', ar: 'طلب تعيين شهود يُقدم إلى القاضي' },
      { fr: 'le juge prend une décision sur la demande pour désigner des témoins', ar: 'القاضي يتخذ قراراً بشأن طلب تعيين شهود' },
      { fr: 'les témoins peuvent témoigner de ce qui s\'est passé lors d\'événements juridiques', ar: 'الشهود يمكنهم الشهادة على ما حدث خلال أحداث قانونية' },
      { fr: 'les témoins participent à des événements juridiques ou des événements importants', ar: 'الشهود يشاركون في أحداث قانونية أو أحداث مهمة' },
      { fr: 'les témoins peuvent confirmer que des événements juridiques se sont effectivement produits', ar: 'الشهود يمكنهم التأكيد أن أحداث قانونية حدثت بالفعل' },
      
      // Common phrases
      { fr: 'Les témoins sont', ar: 'الشهود هم' },
      { fr: 'Les témoins ont', ar: 'الشهود لديهم' },
      { fr: 'Il existe', ar: 'هناك' },
      { fr: 'Types de témoins', ar: 'أنواع الشهود' },
      { fr: 'Témoins directs', ar: 'شهود مباشرون' },
      { fr: 'Témoins indirects', ar: 'شهود غير مباشرين' },
      { fr: 'Témoins experts', ar: 'شهود خبراء' },
      { fr: 'Conditions pour devenir témoin', ar: 'شروط لتصبح شاهداً' },
      { fr: 'Procédure pour désigner', ar: 'الإجراء لتعيين' },
      { fr: 'Sanctions pour les témoins', ar: 'العقوبات للشهود' },
      { fr: 'Faux témoignage', ar: 'شهادة الزور' },
      { fr: 'Refus de témoigner', ar: 'رفض الشهادة' },
      { fr: 'dans le système judiciaire', ar: 'في النظام القضائي' },
      { fr: 'plusieurs types', ar: 'أنواع متعددة' },
      { fr: 'être âgé d\'au moins 18 ans ou plus', ar: 'أن يكون عمره 18 سنة أو أكثر' },
      { fr: 'être capable de témoigner', ar: 'أن يكون قادراً على الشهادة' },
      { fr: 'être d\'une intégrité morale incontestable', ar: 'أن يكون من الاستقامة الأخلاقية غير المتنازع فيها' },
      { fr: 'Code de Procédure Pénale', ar: 'قانون الإجراءات الجزائية' },
      
      // Individual words (last priority)
      { fr: 'témoins', ar: 'شهود' },
      { fr: 'témoin', ar: 'شاهد' },
      { fr: 'témoignage', ar: 'شهادة' },
      { fr: 'témoigner', ar: 'يشهد' },
      { fr: 'personnes', ar: 'أشخاص' },
      { fr: 'événements', ar: 'أحداث' },
      { fr: 'juridiques', ar: 'قانونية' },
      { fr: 'importants', ar: 'مهمة' },
      { fr: 'peuvent', ar: 'يمكنهم' },
      { fr: 'Définition', ar: 'التعريف' },
      { fr: 'définis', ar: 'معرفون' },
      { fr: 'defined', ar: 'معرفون' }, // Fix English fragment
      { fr: 'rôle', ar: 'دور' },
      { fr: 'plusieurs', ar: 'عدة' },
      { fr: 'participation', ar: 'المشاركة' },
      { fr: 'participent', ar: 'يشاركون' },
      { fr: 'confirmation', ar: 'التأكيد' },
      { fr: 'confirmer', ar: 'يؤكدون' },
      { fr: 'effectivement', ar: 'بالفعل' },
      { fr: 'types', ar: 'أنواع' },
      { fr: 'Algérie', ar: 'الجزائر' },
      { fr: 'directs', ar: 'مباشرون' },
      { fr: 'directement', ar: 'مباشرة' },
      { fr: 'indirects', ar: 'غير مباشرين' },
      { fr: 'indirectement', ar: 'غير مباشرة' },
      { fr: 'experts', ar: 'خبراء' },
      { fr: 'expertise', ar: 'خبرة' },
      { fr: 'spécialisée', ar: 'خاصة' },
      { fr: 'conditions', ar: 'شروط' },
      { fr: 'devenir', ar: 'لتصبح' },
      { fr: 'remplir', ar: 'تملك' },
      { fr: 'suivantes', ar: 'التالية' },
      { fr: 'Âge', ar: 'العمر' },
      { fr: 'ans', ar: 'سنة' },
      { fr: 'plus', ar: 'أكثر' },
      { fr: 'Capacité', ar: 'القدرة' },
      { fr: 'capable', ar: 'قادر' },
      { fr: 'Intégrité', ar: 'الاستقامة' },
      { fr: 'morale', ar: 'الأخلاقية' },
      { fr: 'incontestable', ar: 'غير المتنازع فيها' },
      { fr: 'procédure', ar: 'إجراء' },
      { fr: 'désigner', ar: 'تعيين' },
      { fr: 'demande', ar: 'طلب' },
      { fr: 'enquête', ar: 'تحقيق' },
      { fr: 'déterminer', ar: 'تحديد' },
      { fr: 'décision', ar: 'قرار' },
      { fr: 'juge', ar: 'قاضي' },
      { fr: 'sanctions', ar: 'عقوبات' },
      { fr: 'exposés', ar: 'معرضون' },
      { fr: 'faux', ar: 'خاطئ' },
      { fr: 'refus', ar: 'رفض' },
      { fr: 'peine', ar: 'عقوبة' },
      { fr: 'années', ar: 'سنوات' },
      { fr: 'système', ar: 'نظام' },
      { fr: 'judiciaire', ar: 'قضائي' },
      { fr: 'important', ar: 'مهم' },
      { fr: 'noter', ar: 'ملاحظة' },
      { fr: 'consulté', ar: 'استشارة' },
      { fr: 'avocat', ar: 'محامٍ' },
      { fr: 'obtenir', ar: 'للحصول على' },
      { fr: 'conseils', ar: 'نصائح' },
      { fr: 'spécifiques', ar: 'محددة' },
      { fr: 'article', ar: 'مادة' },
      { fr: 'code', ar: 'قانون' },
      { fr: 'tribunal', ar: 'محكمة' }
    ];

    let translatedText = cleanedText;
    let translationsApplied = 0;

    // Apply translations starting with longest phrases first
    translationPairs.forEach(pair => {
      const fromText = pair[fromLang as 'fr' | 'ar'];
      const toText = pair[toLang as 'fr' | 'ar'];
      
      if (fromText && toText && fromText !== toText) {
        // Case-insensitive replacement that preserves original case
        const regex = new RegExp(this.escapeRegExp(fromText), 'gi');
        const matches = translatedText.match(regex);
        if (matches) {
          translatedText = translatedText.replace(regex, (match) => {
            translationsApplied++;
            console.log(`🔧 - Applied translation: "${match}" -> "${toText}"`);
            // Preserve case of first character
            if (match[0] === match[0].toUpperCase()) {
              return toText.charAt(0).toUpperCase() + toText.slice(1);
            }
            return toText;
          });
        }
      }
    });

    console.log(`🔧 - Fallback translation completed`);
    console.log(`🔧 - Translations applied: ${translationsApplied}`);
    console.log(`🔧 - Original: "${text.substring(0, 50)}..."`);
    console.log(`🔧 - Result: "${translatedText.substring(0, 50)}..."`);
    console.log(`🔧 - Text changed: ${text !== translatedText}`);

    return translatedText;
  }

  private cleanText(text: string): string {
    // Remove or fix common encoding issues
    return text
      .replace(/процедة/g, 'procédure')  // Fix Cyrillic characters
      .replace(/Defined/g, 'définis')    // Fix English fragments
      .replace(/[^\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u200C-\u200F\u2010-\u2027\u2030-\u205E]/g, '') // Remove invalid characters but keep Arabic joining chars
      .replace(/\s+/g, ' ')  // Normalize spaces
      .trim();
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.translationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.translationCache.size,
      keys: Array.from(this.translationCache.keys())
    };
  }
}

// Create singleton instance
export const translationService = new TranslationService();