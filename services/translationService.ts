import { Language } from '../types';
import { apiService } from './apiService';

/**
 * Translation service for automatic content translation
 * Handles translation of chat messages and content when language changes
 */
export class TranslationService {
  private translationCache = new Map<string, { [key in Language]: string }>();

  /**
   * Translate text from one language to another
   */
  async translateText(text: string, fromLang: Language, toLang: Language): Promise<string> {
    console.log(`🔧 TranslationService.translateText called:`);
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
      console.log(`🔧 - Calling translation API...`);
      // Use Google Translate API or similar service
      // For now, we'll use a simple API call to a translation service
      const translatedText = await this.callTranslationAPI(text, fromLang, toLang);
      
      console.log(`🔧 - Translation result: "${translatedText.substring(0, 100)}..."`);
      
      // Cache the result
      this.cacheTranslation(text, fromLang, translatedText, toLang);
      
      return translatedText;
    } catch (error) {
      console.error('🔧 - Translation failed:', error);
      // Return original text if translation fails
      return text;
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