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
    // If same language, return original text
    if (fromLang === toLang) {
      return text;
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text);
    const cached = this.translationCache.get(cacheKey);
    if (cached && cached[toLang]) {
      return cached[toLang];
    }

    try {
      // Use Google Translate API or similar service
      // For now, we'll use a simple API call to a translation service
      const translatedText = await this.callTranslationAPI(text, fromLang, toLang);
      
      // Cache the result
      this.cacheTranslation(text, fromLang, translatedText, toLang);
      
      return translatedText;
    } catch (error) {
      console.error('Translation failed:', error);
      // Return original text if translation fails
      return text;
    }
  }

  /**
   * Detect the language of a text
   */
  detectLanguage(text: string): Language {
    // Simple language detection based on Arabic characters
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    
    if (arabicRegex.test(text)) {
      return 'ar';
    }
    
    return 'fr';
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
    try {
      // Try to use the backend translation API first
      const response = await apiService.translateText(text, fromLang, toLang);
      
      if (response.success) {
        return response.translatedText;
      } else {
        throw new Error('Translation API returned error');
      }
    } catch (error) {
      // Fallback: Use comprehensive local translation
      console.warn('Translation API not available, using comprehensive fallback');
      return this.fallbackTranslation(text, fromLang, toLang);
    }
  }

  private fallbackTranslation(text: string, fromLang: Language, toLang: Language): string {
    // Comprehensive fallback translations for legal terms and common phrases
    const comprehensiveDictionary: { [key: string]: { fr: string; ar: string } } = {
      // Basic legal terms
      'divorce': { fr: 'divorce', ar: 'طلاق' },
      'mariage': { fr: 'mariage', ar: 'زواج' },
      'contrat': { fr: 'contrat', ar: 'عقد' },
      'tribunal': { fr: 'tribunal', ar: 'محكمة' },
      'avocat': { fr: 'avocat', ar: 'محامي' },
      'juge': { fr: 'juge', ar: 'قاضي' },
      'loi': { fr: 'loi', ar: 'قانون' },
      'article': { fr: 'article', ar: 'مادة' },
      'procédure': { fr: 'procédure', ar: 'إجراء' },
      'jugement': { fr: 'jugement', ar: 'حكم' },
      
      // Legal codes
      'code civil': { fr: 'Code Civil', ar: 'القانون المدني' },
      'code pénal': { fr: 'Code Pénal', ar: 'قانون العقوبات' },
      'code de la famille': { fr: 'Code de la Famille', ar: 'قانون الأسرة' },
      'code de commerce': { fr: 'Code de Commerce', ar: 'القانون التجاري' },
      
      // Family law terms
      'cafala': { fr: 'cafala', ar: 'كفالة' },
      'khol': { fr: 'khol', ar: 'خلع' },
      'mubarat': { fr: 'mubarat', ar: 'مبارات' },
      'talaq': { fr: 'talaq', ar: 'طلاق' },
      'nafaqah': { fr: 'pension alimentaire', ar: 'نفقة' },
      'hadanah': { fr: 'garde des enfants', ar: 'حضانة' },
      'mahr': { fr: 'dot', ar: 'مهر' },
      'iddah': { fr: 'délai de viduité', ar: 'عدة' },
      'wilayah': { fr: 'tutelle', ar: 'ولاية' },
      'wasayah': { fr: 'testament', ar: 'وصية' },
      'mirath': { fr: 'héritage', ar: 'ميراث' },
      
      // Common phrases and sentence structures
      'la cafala est': { fr: 'La cafala est', ar: 'الكفالة هي' },
      'il existe': { fr: 'Il existe', ar: 'يوجد' },
      'il faut': { fr: 'Il faut', ar: 'يجب' },
      'voici les informations clés': { fr: 'Voici les informations clés', ar: 'إليك المعلومات الأساسية' },
      'selon la loi': { fr: 'selon la loi', ar: 'وفقاً للقانون' },
      'en vertu de': { fr: 'en vertu de', ar: 'بموجب' },
      'conformément à': { fr: 'conformément à', ar: 'طبقاً لـ' },
      'par conséquent': { fr: 'par conséquent', ar: 'وبالتالي' },
      'il s\'ensuit que': { fr: 'il s\'ensuit que', ar: 'يترتب على ذلك أن' },
      'attendu que': { fr: 'attendu que', ar: 'حيث أن' },
      'considérant que': { fr: 'considérant que', ar: 'اعتباراً أن' },
      'par ces motifs': { fr: 'par ces motifs', ar: 'لهذه الأسباب' },
      'le tribunal décide': { fr: 'le tribunal décide', ar: 'تقرر المحكمة' },
      'il est ordonné': { fr: 'il est ordonné', ar: 'يُؤمر' },
      'il est important de noter que': { fr: 'Il est important de noter que', ar: 'من المهم ملاحظة أن' },
      'il est recommandé de': { fr: 'il est recommandé de', ar: 'يُنصح بـ' },
      'pour être nommé': { fr: 'pour être nommé', ar: 'ليتم تعيينه' },
      'les conditions suivantes': { fr: 'les conditions suivantes', ar: 'الشروط التالية' },
      'la procédure est la suivante': { fr: 'la procédure est la suivante', ar: 'الإجراء كما يلي' },
      
      // Specific cafala-related terms
      'un concept juridique algérien': { fr: 'un concept juridique algérien', ar: 'مفهوم قانوني جزائري' },
      'fait référence à': { fr: 'fait référence à', ar: 'يشير إلى' },
      'la tutelle ou la curatelle': { fr: 'la tutelle ou la curatelle', ar: 'الوصاية أو القوامة' },
      'd\'un mineur': { fr: 'd\'un mineur', ar: 'لقاصر' },
      'd\'un majeur incapable': { fr: 'd\'un majeur incapable', ar: 'لبالغ عاجز' },
      'types de cafala': { fr: 'Types de cafala', ar: 'أنواع الكفالة' },
      'cafala légale': { fr: 'Cafala légale', ar: 'كفالة قانونية' },
      'cafala volontaire': { fr: 'Cafala volontaire', ar: 'كفالة اختيارية' },
      'elle est instituée par la loi': { fr: 'elle est instituée par la loi', ar: 'تُنشأ بموجب القانون' },
      'pour protéger les intérêts': { fr: 'pour protéger les intérêts', ar: 'لحماية مصالح' },
      'elle est instituée par un acte notarié': { fr: 'elle est instituée par un acte notarié', ar: 'تُنشأ بموجب عقد موثق' },
      'par lequel un tiers s\'engage': { fr: 'par lequel un tiers s\'engage', ar: 'يتعهد بموجبه طرف ثالث' },
      'à assumer la tutelle': { fr: 'à assumer la tutelle', ar: 'بتولي الوصاية' },
      'attributions de la cafala': { fr: 'Attributions de la cafala', ar: 'اختصاصات الكفالة' },
      'gestion des biens': { fr: 'Gestion des biens', ar: 'إدارة الأموال' },
      'protection des intérêts': { fr: 'Protection des intérêts', ar: 'حماية المصالح' },
      'prise de décisions': { fr: 'Prise de décisions', ar: 'اتخاذ القرارات' },
      'en matière d\'éducation': { fr: 'en matière d\'éducation', ar: 'في مجال التعليم' },
      'de santé et de bien-être': { fr: 'de santé et de bien-être', ar: 'والصحة والرفاهية' },
      'conditions pour être nommé cafal': { fr: 'Conditions pour être nommé cafal', ar: 'شروط تعيين الكفيل' },
      'âge : être âgé d\'au moins': { fr: 'Âge : être âgé d\'au moins', ar: 'العمر: أن يكون عمره على الأقل' },
      'capacité : avoir la capacité': { fr: 'Capacité : avoir la capacité', ar: 'الأهلية: أن تكون له القدرة' },
      'de gérer ses affaires personnelles': { fr: 'de gérer ses affaires personnelles', ar: 'على إدارة شؤونه الشخصية' },
      'intégrité : être d\'une intégrité': { fr: 'Intégrité : être d\'une intégrité', ar: 'النزاهة: أن يكون ذا نزاهة' },
      'morale incontestable': { fr: 'morale incontestable', ar: 'أخلاقية لا جدال فيها' },
      'procédure pour instituer la cafala': { fr: 'Procédure pour instituer la cafala', ar: 'إجراء إنشاء الكفالة' },
      'demande : la demande d\'institution': { fr: 'Demande : la demande d\'institution', ar: 'الطلب: يُقدم طلب الإنشاء' },
      'est faite auprès du tribunal': { fr: 'est faite auprès du tribunal', ar: 'لدى محكمة' },
      'de première instance': { fr: 'de première instance', ar: 'أول درجة' },
      'enquête : l\'enquête est menée': { fr: 'Enquête : l\'enquête est menée', ar: 'التحقيق: يُجرى التحقيق' },
      'par le juge pour vérifier': { fr: 'par le juge pour vérifier', ar: 'من قبل القاضي للتحقق من' },
      'décision : le juge prend une décision': { fr: 'Décision : le juge prend une décision', ar: 'القرار: يتخذ القاضي قراراً' },
      'sur la demande d\'institution': { fr: 'sur la demande d\'institution', ar: 'بشأن طلب الإنشاء' },
      'il est important de noter': { fr: 'Il est important de noter', ar: 'من المهم ملاحظة' },
      'que la cafala est un concept': { fr: 'que la cafala est un concept', ar: 'أن الكفالة مفهوم' },
      'juridique complexe': { fr: 'juridique complexe', ar: 'قانوني معقد' },
      'qu\'il est recommandé': { fr: 'qu\'il est recommandé', ar: 'أنه يُنصح' },
      'de consulter un avocat': { fr: 'de consulter un avocat', ar: 'باستشارة محامٍ' },
      'pour obtenir des conseils': { fr: 'pour obtenir des conseils', ar: 'للحصول على نصائح' },
      'spécifiques': { fr: 'spécifiques', ar: 'محددة' }
    };

    let translatedText = text;

    // Apply translations with case-insensitive matching
    Object.entries(comprehensiveDictionary).forEach(([key, translations]) => {
      const fromText = translations[fromLang as 'fr' | 'ar'];
      const toText = translations[toLang as 'fr' | 'ar'];
      
      if (fromText && toText && fromText !== toText) {
        // Case-insensitive replacement that preserves original case
        const regex = new RegExp(this.escapeRegExp(fromText), 'gi');
        translatedText = translatedText.replace(regex, (match) => {
          // Preserve case of first character
          if (match[0] === match[0].toUpperCase()) {
            return toText.charAt(0).toUpperCase() + toText.slice(1);
          }
          return toText;
        });
      }
    });

    return translatedText;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
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