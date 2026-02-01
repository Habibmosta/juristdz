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
      // Use the backend translation API
      const response = await apiService.translateText(text, fromLang, toLang);
      
      if (response.success) {
        return response.translatedText;
      } else {
        throw new Error('Translation API returned error');
      }
    } catch (error) {
      // Fallback: Use browser's built-in translation or return original
      console.warn('Translation API not available, using fallback');
      return this.fallbackTranslation(text, fromLang, toLang);
    }
  }

  private fallbackTranslation(text: string, fromLang: Language, toLang: Language): string {
    // Simple fallback translations for common legal terms
    const legalTerms: { [key: string]: { fr: string; ar: string } } = {
      'divorce': { fr: 'divorce', ar: 'طلاق' },
      'mariage': { fr: 'mariage', ar: 'زواج' },
      'contrat': { fr: 'contrat', ar: 'عقد' },
      'tribunal': { fr: 'tribunal', ar: 'محكمة' },
      'avocat': { fr: 'avocat', ar: 'محامي' },
      'juge': { fr: 'juge', ar: 'قاضي' },
      'loi': { fr: 'loi', ar: 'قانون' },
      'article': { fr: 'article', ar: 'مادة' },
      'code civil': { fr: 'code civil', ar: 'القانون المدني' },
      'code pénal': { fr: 'code pénal', ar: 'قانون العقوبات' },
      'procédure': { fr: 'procédure', ar: 'إجراء' },
      'jugement': { fr: 'jugement', ar: 'حكم' },
      'appel': { fr: 'appel', ar: 'استئناف' },
      'cassation': { fr: 'cassation', ar: 'نقض' }
    };

    let translatedText = text;

    // Replace known legal terms
    Object.entries(legalTerms).forEach(([key, translations]) => {
      const fromText = translations[fromLang];
      const toText = translations[toLang];
      
      if (fromText && toText) {
        const regex = new RegExp(fromText, 'gi');
        translatedText = translatedText.replace(regex, toText);
      }
    });

    return translatedText;
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