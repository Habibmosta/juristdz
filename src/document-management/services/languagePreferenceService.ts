import { Language } from '../types';
import { supabaseService } from './supabaseService';

/**
 * Language Preference Service
 * Manages user language preferences and interface localization
 * 
 * Requirements: 8.4 - Multi-language platform consistency
 */

interface LanguagePreference {
  userId: string;
  language: Language;
  updatedAt: Date;
}

interface LanguagePreferenceResult {
  success: boolean;
  language?: Language;
  error?: string;
}

class LanguagePreferenceService {
  private readonly STORAGE_KEY = 'dms_language_preference';
  private currentLanguage: Language = Language.FRENCH;

  /**
   * Get user's language preference
   * First checks database, then local storage, then browser settings
   */
  async getUserLanguagePreference(userId: string): Promise<Language> {
    try {
      // Try to get from database
      const dbPreference = await this.getLanguageFromDatabase(userId);
      if (dbPreference) {
        this.currentLanguage = dbPreference;
        this.saveToLocalStorage(dbPreference);
        return dbPreference;
      }

      // Try local storage
      const localPreference = this.getFromLocalStorage();
      if (localPreference) {
        this.currentLanguage = localPreference;
        return localPreference;
      }

      // Try browser language
      const browserLanguage = this.detectBrowserLanguage();
      this.currentLanguage = browserLanguage;
      return browserLanguage;
    } catch (error) {
      console.error('Error getting language preference:', error);
      return Language.FRENCH; // Default fallback
    }
  }

  /**
   * Set user's language preference
   * Saves to both database and local storage
   */
  async setUserLanguagePreference(
    userId: string,
    language: Language
  ): Promise<LanguagePreferenceResult> {
    try {
      // Validate language
      if (!Object.values(Language).includes(language)) {
        return {
          success: false,
          error: 'Invalid language',
        };
      }

      // Save to database
      const saved = await this.saveLanguageToDatabase(userId, language);
      if (!saved) {
        return {
          success: false,
          error: 'Failed to save to database',
        };
      }

      // Save to local storage
      this.saveToLocalStorage(language);

      // Update current language
      this.currentLanguage = language;

      // Update document direction
      this.updateDocumentDirection(language);

      return {
        success: true,
        language,
      };
    } catch (error) {
      console.error('Error setting language preference:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Detect browser language
   */
  private detectBrowserLanguage(): Language {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    
    if (browserLang) {
      const langCode = browserLang.toLowerCase().split('-')[0];
      
      if (langCode === 'ar') {
        return Language.ARABIC;
      }
      if (langCode === 'fr') {
        return Language.FRENCH;
      }
    }

    // Default to French
    return Language.FRENCH;
  }

  /**
   * Save language preference to local storage
   */
  private saveToLocalStorage(language: Language): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, language);
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  /**
   * Get language preference from local storage
   */
  private getFromLocalStorage(): Language | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && Object.values(Language).includes(stored as Language)) {
        return stored as Language;
      }
    } catch (error) {
      console.error('Error reading from local storage:', error);
    }
    return null;
  }

  /**
   * Get language preference from database
   */
  private async getLanguageFromDatabase(userId: string): Promise<Language | null> {
    try {
      const client = supabaseService.getClient();
      const { data, error } = await client
        .from('user_preferences')
        .select('language')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return data.language as Language;
    } catch (error) {
      console.error('Error getting language from database:', error);
      return null;
    }
  }

  /**
   * Save language preference to database
   */
  private async saveLanguageToDatabase(
    userId: string,
    language: Language
  ): Promise<boolean> {
    try {
      const client = supabaseService.getClient();
      const { error } = await client
        .from('user_preferences')
        .upsert({
          user_id: userId,
          language,
          updated_at: new Date().toISOString(),
        });

      return !error;
    } catch (error) {
      console.error('Error saving language to database:', error);
      return false;
    }
  }

  /**
   * Update document direction based on language
   */
  private updateDocumentDirection(language: Language): void {
    const direction = language === Language.ARABIC ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }

  /**
   * Get text direction for language
   */
  getTextDirection(language: Language): 'ltr' | 'rtl' {
    return language === Language.ARABIC ? 'rtl' : 'ltr';
  }

  /**
   * Check if language is RTL
   */
  isRTL(language: Language): boolean {
    return language === Language.ARABIC;
  }

  /**
   * Get language display name
   */
  getLanguageDisplayName(language: Language, inLanguage?: Language): string {
    const displayNames: Record<Language, Record<Language, string>> = {
      [Language.FRENCH]: {
        [Language.FRENCH]: 'Français',
        [Language.ARABIC]: 'الفرنسية',
      },
      [Language.ARABIC]: {
        [Language.FRENCH]: 'Arabe',
        [Language.ARABIC]: 'العربية',
      },
    };

    const targetLang = inLanguage || this.currentLanguage;
    return displayNames[language][targetLang] || language;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Language[] {
    return Object.values(Language);
  }

  /**
   * Validate language code
   */
  isValidLanguage(language: string): language is Language {
    return Object.values(Language).includes(language as Language);
  }
}

// Export singleton instance
export const languagePreferenceService = new LanguagePreferenceService();
