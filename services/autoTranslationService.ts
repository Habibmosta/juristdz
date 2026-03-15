import { Language } from '../types';
// DISABLED: Complex translation system causing conflicts
// import { pureTranslationSystemIntegration } from '../src/pure-translation-system/PureTranslationSystemIntegration';
// import { TranslationRequest, ContentType, TranslationPriority } from '../src/pure-translation-system/types';

/**
 * Auto Translation Service using Pure Translation System
 * Handles automatic content translation with zero tolerance for language mixing
 */
export class AutoTranslationService {
  private static instance: AutoTranslationService;
  private currentLanguage: Language = 'fr';
  private translationCallbacks: Map<string, (newLanguage: Language) => void> = new Map();
  private isTranslating = false;

  private constructor() {}

  static getInstance(): AutoTranslationService {
    if (!AutoTranslationService.instance) {
      AutoTranslationService.instance = new AutoTranslationService();
    }
    return AutoTranslationService.instance;
  }

  /**
   * Set the current language and trigger automatic translation
   */
  setLanguage(newLanguage: Language): void {
    console.log(`🌐 AutoTranslationService: Language change ${this.currentLanguage} -> ${newLanguage}`);
    console.log(`🌐 AutoTranslationService: Registered components: ${this.translationCallbacks.size}`);
    console.log(`🌐 AutoTranslationService: Component IDs:`, Array.from(this.translationCallbacks.keys()));
    
    if (this.currentLanguage === newLanguage) {
      console.log(`🌐 AutoTranslationService: Same language, no translation needed`);
      return;
    }

    if (this.isTranslating) {
      console.log(`🌐 AutoTranslationService: Translation in progress, ignoring request`);
      return;
    }

    const previousLanguage = this.currentLanguage;
    this.currentLanguage = newLanguage;
    this.isTranslating = true;

    console.log(`🌐 AutoTranslationService: Notifying ${this.translationCallbacks.size} components`);

    // Notify all registered components about the language change
    setTimeout(() => {
      this.translationCallbacks.forEach((callback, componentId) => {
        try {
          console.log(`🌐 AutoTranslationService: Triggering translation for ${componentId}`);
          callback(newLanguage);
        } catch (error) {
          console.error(`🌐 AutoTranslationService: Error in callback for ${componentId}:`, error);
        }
      });

      // Release translation lock after all callbacks are processed
      setTimeout(() => {
        this.isTranslating = false;
        console.log(`🌐 AutoTranslationService: Translation cycle completed`);
      }, 1000);
    }, 100);
  }

  /**
   * Register a component for automatic translation
   */
  registerComponent(componentId: string, callback: (newLanguage: Language) => void): void {
    console.log(`🌐 AutoTranslationService: Registering component ${componentId}`);
    this.translationCallbacks.set(componentId, callback);
  }

  /**
   * Unregister a component
   */
  unregisterComponent(componentId: string): void {
    console.log(`🌐 AutoTranslationService: Unregistering component ${componentId}`);
    this.translationCallbacks.delete(componentId);
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Check if translation is in progress
   */
  isTranslationInProgress(): boolean {
    return this.isTranslating;
  }

  /**
   * SIMPLIFIED: Translate content using Gemini API
   * Note: appelé directement par les composants — pas de lock global ici
   */
  async translateContent(
    content: string, 
    fromLang?: Language, 
    toLang?: Language
  ): Promise<string> {
    const sourceLang = fromLang || this.detectLanguage(content);
    const targetLang = toLang || this.currentLanguage;

    if (sourceLang === targetLang) {
      return content;
    }

    try {
      const translatedDoc = await this.translateWithGemini(content, sourceLang, targetLang);
      if (this.verifyTranslationQuality(translatedDoc, targetLang)) {
        return translatedDoc;
      } else {
        return this.getUltraCleanFallbackTranslation(content, sourceLang, targetLang);
      }
    } catch (error) {
      console.error(`🌐 Translation error:`, error);
      return this.getUltraCleanFallbackTranslation(content, sourceLang, targetLang);
    }
  }

  /**
   * Translate content using Groq API (same as document generation)
   */
  private async translateWithGemini(
    content: string,
    fromLang: Language,
    toLang: Language
  ): Promise<string> {
    // Use Groq API instead of Gemini for translation
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    const sourceLangName = fromLang === 'ar' ? 'arabe' : 'français';
    const targetLangName = toLang === 'ar' ? 'arabe' : 'français';

    const prompt = `Tu es un traducteur juridique professionnel spécialisé dans le droit algérien.

TÂCHE: Traduire ce document juridique du ${sourceLangName} vers le ${targetLangName}.

RÈGLES CRITIQUES:
1. Traduire TOUT le contenu sans exception
2. Conserver EXACTEMENT la structure et la mise en forme
3. Conserver les numéros, dates, montants, noms propres
4. Traduire les termes juridiques avec précision
5. NE PAS ajouter de commentaires ou d'explications
6. NE PAS mélanger les langues - UNIQUEMENT du ${targetLangName}
7. Conserver les séparateurs (━━━), les sauts de ligne, les espaces
8. Traduire les formules notariales correctement

DOCUMENT À TRADUIRE:

${content}

TRADUCTION EN ${targetLangName.toUpperCase()}:`;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: 0.1,
          max_tokens: 8192,
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content || '';

    if (!translatedText) {
      throw new Error('Empty translation response');
    }

    return translatedText.trim();
  }

  /**
   * Clean mixed content aggressively
   */
  private cleanMixedContent(text: string): string {
    if (!text || typeof text !== 'string') return text;
    
    let cleaned = text;
    
    // Aggressive cleaning patterns based on user report
    const cleaningPatterns = [
      // Remove translation artifacts completely
      { from: /مترجم\[Optimized Translation:[^\]]*\]/g, to: '' },
      { from: /\[Optimized Translation:[^\]]*\]/g, to: '' },
      { from: /Optimized Translation:/g, to: '' },
      { from: /AUTO-TRANSLATE/g, to: '' },
      
      // Fix specific mixed patterns from user report
      { from: /متصلAvocat d'Avocat/g, to: 'متصل' },
      { from: /متصلAvocat/g, to: 'متصل' },
      { from: /Avocat d'Avocat/g, to: 'Avocat' },
      { from: /لوحة التحكمبحث قانوني/g, to: 'لوحة التحكم | بحث قانوني' },
      { from: /بحث قانونيتحرير/g, to: 'بحث قانوني | تحرير' },
      { from: /تحريرActes/g, to: 'تحرير العقود' },
      { from: /Actesتحليل/g, to: 'العقود | تحليل' },
      { from: /تحليلوثائق/g, to: 'تحليل | وثائق' },
      { from: /وثائقدفتر التوثيق/g, to: 'وثائق | دفتر التوثيق' },
      { from: /دفتر التوثيق\+ عقد جديد/g, to: 'دفتر التوثيق | عقد جديد' },
      { from: /عقد جديدبحث في الأرشيف/g, to: 'عقد جديد | بحث في الأرشيف' },
      { from: /بحث في الأرشيفar/g, to: 'بحث في الأرشيف | ar' },
      { from: /arوضع آمن/g, to: 'ar | وضع آمن' },
      { from: /وضع آمنجميع البيانات/g, to: 'وضع آمن | جميع البيانات' },
      
      // Remove problematic artifacts
      { from: /Pro(?=[أ-ي])/g, to: '' },
      { from: /V2(?=[أ-ي])/g, to: '' },
      { from: /Defined/g, to: '' },
      { from: /процедة/g, to: 'procédure' },
      
      // General mixed script patterns
      { from: /([أ-ي]+)([A-Za-z]+)([أ-ي]*)/g, to: '$1 | $2 | $3' },
      { from: /([A-Za-z]+)([أ-ي]+)([A-Za-z]*)/g, to: '$1 | $2 | $3' },
      
      // Clean up pipes and spaces
      { from: /\s*\|\s*/g, to: ' | ' },
      { from: /\|\s*\|/g, to: ' | ' },
      { from: /^\s*\|\s*/g, to: '' },
      { from: /\s*\|\s*$/g, to: '' },
      { from: /\s+/g, to: ' ' }
    ];
    
    cleaningPatterns.forEach(pattern => {
      const before = cleaned;
      cleaned = cleaned.replace(pattern.from, pattern.to);
      if (before !== cleaned) {
        console.log(`🧹 Applied cleaning: ${pattern.from} -> ${pattern.to}`);
      }
    });
    
    return cleaned.trim();
  }

  /**
   * Verify translation quality — documents juridiques contiennent des noms propres en latin,
   * donc on vérifie juste que la traduction n'est pas vide et a une longueur raisonnable.
   */
  private verifyTranslationQuality(text: string, targetLang: Language): boolean {
    if (!text || text.trim().length < 50) {
      console.log(`🌐 Quality check: FAILED — response too short`);
      return false;
    }

    const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
    const latinChars = (text.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
    const totalChars = text.replace(/[\s\d\W]/g, '').length;

    if (totalChars === 0) return true;

    const arabicRatio = arabicChars / totalChars;
    const latinRatio = latinChars / totalChars;

    console.log(`🌐 Quality check: Arabic ${Math.round(arabicRatio * 100)}%, Latin ${Math.round(latinRatio * 100)}%`);

    if (targetLang === 'ar') {
      // Documents juridiques algériens contiennent des noms propres, adresses, numéros en latin
      // Seuil abaissé à 30% — on vérifie juste qu'il y a du contenu arabe
      const isGoodQuality = arabicRatio > 0.30;
      console.log(`🌐 Quality check: ${isGoodQuality ? '✅ PASSED' : '❌ FAILED'} (Arabic: ${Math.round(arabicRatio * 100)}%)`);
      return isGoodQuality;
    } else {
      const isGoodQuality = latinRatio > 0.30;
      console.log(`🌐 Quality check: ${isGoodQuality ? '✅ PASSED' : '❌ FAILED'} (Latin: ${Math.round(latinRatio * 100)}%)`);
      return isGoodQuality;
    }
  }

  /**
   * Fallback: retourner le contenu original plutôt que de le détruire
   */
  private getUltraCleanFallbackTranslation(originalContent: string, fromLang: Language, toLang: Language): string {
    console.warn(`🌐 Translation quality failed — returning original content unchanged`);
    return originalContent;
  }

  /**
   * Simple language detection
   */
  private detectLanguage(text: string): Language {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    return arabicRegex.test(text) ? 'ar' : 'fr';
  }

  /**
   * Clear all registered components
   */
  clearAll(): void {
    console.log(`🌐 AutoTranslationService: Clearing all ${this.translationCallbacks.size} components`);
    this.translationCallbacks.clear();
    this.isTranslating = false;
  }
}

// Export singleton instance
export const autoTranslationService = AutoTranslationService.getInstance();