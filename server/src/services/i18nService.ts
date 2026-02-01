import { Pool } from 'pg';
import {
  I18nService as II18nService,
  SupportedLocale,
  Translation,
  LegalTerminology,
  LegalDomain,
  I18nConfig,
  DateFormatConfig,
  NumberFormatConfig,
  RTLConfig,
  TranslationStats,
  LocalizedError,
  BilingualSearch,
  AlgerianLocalization
} from '../types/i18n.js';
import { logger } from '../utils/logger.js';

export class I18nService implements II18nService {
  private currentLocale: SupportedLocale = SupportedLocale.FRENCH;
  private translations: Map<string, Map<SupportedLocale, Translation>> = new Map();
  private config: I18nConfig;
  private algerianConfig: AlgerianLocalization;

  constructor(private db: Pool) {
    this.config = this.getDefaultConfig();
    this.algerianConfig = this.getAlgerianConfig();
    this.loadDefaultTranslations();
  }

  private getDefaultConfig(): I18nConfig {
    return {
      defaultLocale: SupportedLocale.FRENCH,
      supportedLocales: [
        SupportedLocale.FRENCH,
        SupportedLocale.ARABIC,
        SupportedLocale.FRENCH_ALGERIA,
        SupportedLocale.ARABIC_ALGERIA
      ],
      fallbackLocale: SupportedLocale.FRENCH,
      enableRTL: true,
      dateFormats: {
        [SupportedLocale.FRENCH]: {
          short: 'dd/MM/yyyy',
          medium: 'dd MMM yyyy',
          long: 'dd MMMM yyyy',
          full: 'EEEE dd MMMM yyyy',
          time: 'HH:mm',
          datetime: 'dd/MM/yyyy HH:mm'
        },
        [SupportedLocale.ARABIC]: {
          short: 'yyyy/MM/dd',
          medium: 'dd MMM yyyy',
          long: 'dd MMMM yyyy',
          full: 'EEEE dd MMMM yyyy',
          time: 'HH:mm',
          datetime: 'yyyy/MM/dd HH:mm'
        },
        [SupportedLocale.FRENCH_ALGERIA]: {
          short: 'dd/MM/yyyy',
          medium: 'dd MMM yyyy',
          long: 'dd MMMM yyyy',
          full: 'EEEE dd MMMM yyyy',
          time: 'HH:mm',
          datetime: 'dd/MM/yyyy HH:mm'
        },
        [SupportedLocale.ARABIC_ALGERIA]: {
          short: 'yyyy/MM/dd',
          medium: 'dd MMM yyyy',
          long: 'dd MMMM yyyy',
          full: 'EEEE dd MMMM yyyy',
          time: 'HH:mm',
          datetime: 'yyyy/MM/dd HH:mm'
        }
      },
      numberFormats: {
        [SupportedLocale.FRENCH]: {
          decimal: ',',
          currency: '€',
          percent: '%',
          thousand: ' '
        },
        [SupportedLocale.ARABIC]: {
          decimal: '٫',
          currency: 'د.ج',
          percent: '٪',
          thousand: '٬'
        },
        [SupportedLocale.FRENCH_ALGERIA]: {
          decimal: ',',
          currency: 'DA',
          percent: '%',
          thousand: ' '
        },
        [SupportedLocale.ARABIC_ALGERIA]: {
          decimal: '٫',
          currency: 'د.ج',
          percent: '٪',
          thousand: '٬'
        }
      }
    };
  }

  private getAlgerianConfig(): AlgerianLocalization {
    return {
      dateFormat: 'dd/mm/yyyy',
      timeFormat: '24h',
      weekStart: 'saturday',
      currency: 'DZD',
      numberFormat: 'european',
      calendarType: 'both'
    };
  }

  getCurrentLocale(): SupportedLocale {
    return this.currentLocale;
  }

  async setLocale(locale: SupportedLocale): Promise<void> {
    if (!this.config.supportedLocales.includes(locale)) {
      throw new Error(`Unsupported locale: ${locale}`);
    }

    this.currentLocale = locale;
    
    // Load translations for the new locale if not already loaded
    await this.ensureTranslationsLoaded(locale);
    
    logger.info('Locale changed', { locale });
  }

  translate(key: string, params?: Record<string, any>, locale?: SupportedLocale): string {
    const targetLocale = locale || this.currentLocale;
    const [namespace, ...keyParts] = key.split('.');
    const translationKey = keyParts.join('.');

    try {
      const namespaceTranslations = this.translations.get(namespace);
      if (!namespaceTranslations) {
        logger.warn('Translation namespace not found', { namespace, key });
        return key;
      }

      const localeTranslations = namespaceTranslations.get(targetLocale);
      if (!localeTranslations) {
        // Try fallback locale
        const fallbackTranslations = namespaceTranslations.get(this.config.fallbackLocale);
        if (!fallbackTranslations) {
          logger.warn('Translation not found in any locale', { key, locale: targetLocale });
          return key;
        }
        return this.interpolate(this.getNestedValue(fallbackTranslations, translationKey) || key, params);
      }

      const translation = this.getNestedValue(localeTranslations, translationKey);
      if (!translation) {
        logger.warn('Translation key not found', { key, locale: targetLocale });
        return key;
      }

      return this.interpolate(translation, params);
    } catch (error) {
      logger.error('Translation error', { error, key, locale: targetLocale });
      return key;
    }
  }

  translatePlural(key: string, count: number, params?: Record<string, any>, locale?: SupportedLocale): string {
    const targetLocale = locale || this.currentLocale;
    const pluralKey = this.getPluralKey(key, count, targetLocale);
    return this.translate(pluralKey, { ...params, count }, targetLocale);
  }

  formatDate(date: Date, format?: string, locale?: SupportedLocale): string {
    const targetLocale = locale || this.currentLocale;
    const formatConfig = this.config.dateFormats[targetLocale];
    const dateFormat = format || formatConfig.medium;

    try {
      return new Intl.DateTimeFormat(targetLocale, {
        dateStyle: this.getDateStyle(dateFormat),
        timeStyle: dateFormat.includes('HH:mm') ? 'short' : undefined
      }).format(date);
    } catch (error) {
      logger.error('Date formatting error', { error, date, format, locale: targetLocale });
      return date.toISOString();
    }
  }

  formatNumber(number: number, format?: string, locale?: SupportedLocale): string {
    const targetLocale = locale || this.currentLocale;
    
    try {
      return new Intl.NumberFormat(targetLocale, {
        style: format || 'decimal',
        minimumFractionDigits: format === 'currency' ? 2 : 0,
        maximumFractionDigits: format === 'currency' ? 2 : 2
      }).format(number);
    } catch (error) {
      logger.error('Number formatting error', { error, number, format, locale: targetLocale });
      return number.toString();
    }
  }

  formatCurrency(amount: number, currency?: string, locale?: SupportedLocale): string {
    const targetLocale = locale || this.currentLocale;
    const currencyCode = currency || this.algerianConfig.currency;

    try {
      return new Intl.NumberFormat(targetLocale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      logger.error('Currency formatting error', { error, amount, currency, locale: targetLocale });
      const numberFormat = this.config.numberFormats[targetLocale];
      return `${amount.toFixed(2)} ${numberFormat.currency}`;
    }
  }

  isRTL(locale?: SupportedLocale): boolean {
    const targetLocale = locale || this.currentLocale;
    return targetLocale === SupportedLocale.ARABIC || targetLocale === SupportedLocale.ARABIC_ALGERIA;
  }

  getAvailableLocales(): SupportedLocale[] {
    return this.config.supportedLocales;
  }

  async loadTranslations(namespace: string, locale: SupportedLocale): Promise<Translation> {
    try {
      const query = `
        SELECT key, value, context
        FROM translations
        WHERE namespace = $1 AND locale = $2 AND is_active = true
        ORDER BY key
      `;

      const result = await this.db.query(query, [namespace, locale]);
      const translations: Translation = {};

      for (const row of result.rows) {
        this.setNestedValue(translations, row.key, row.value);
      }

      // Cache the translations
      if (!this.translations.has(namespace)) {
        this.translations.set(namespace, new Map());
      }
      this.translations.get(namespace)!.set(locale, translations);

      logger.info('Translations loaded', { namespace, locale, count: result.rows.length });
      return translations;
    } catch (error) {
      logger.error('Error loading translations', { error, namespace, locale });
      return {};
    }
  }

  addTranslation(key: string, value: string, locale: SupportedLocale, namespace: string = 'common'): void {
    if (!this.translations.has(namespace)) {
      this.translations.set(namespace, new Map());
    }

    const namespaceTranslations = this.translations.get(namespace)!;
    if (!namespaceTranslations.has(locale)) {
      namespaceTranslations.set(locale, {});
    }

    const localeTranslations = namespaceTranslations.get(locale)!;
    this.setNestedValue(localeTranslations, key, value);

    logger.debug('Translation added', { key, value, locale, namespace });
  }

  async searchLegalTerm(term: string, locale: SupportedLocale, domain?: LegalDomain): Promise<LegalTerminology[]> {
    try {
      let query = `
        SELECT * FROM legal_terminology
        WHERE (
          LOWER(term_fr) LIKE LOWER($1) OR
          LOWER(term_ar) LIKE LOWER($1) OR
          LOWER(definition_fr) LIKE LOWER($1) OR
          LOWER(definition_ar) LIKE LOWER($1)
        )
      `;
      const params: any[] = [`%${term}%`];

      if (domain) {
        query += ` AND domain = $${params.length + 1}`;
        params.push(domain);
      }

      query += ` ORDER BY 
        CASE 
          WHEN LOWER(term_fr) = LOWER($1) OR LOWER(term_ar) = LOWER($1) THEN 1
          WHEN LOWER(term_fr) LIKE LOWER($1) OR LOWER(term_ar) LIKE LOWER($1) THEN 2
          ELSE 3
        END,
        term_fr
        LIMIT 50
      `;

      const result = await this.db.query(query, params);
      return result.rows.map(row => this.mapRowToLegalTerminology(row));
    } catch (error) {
      logger.error('Error searching legal terms', { error, term, locale, domain });
      return [];
    }
  }

  async translateLegalTerm(termId: string, targetLocale: SupportedLocale): Promise<LegalTerminology | null> {
    try {
      const query = 'SELECT * FROM legal_terminology WHERE id = $1';
      const result = await this.db.query(query, [termId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToLegalTerminology(result.rows[0]);
    } catch (error) {
      logger.error('Error translating legal term', { error, termId, targetLocale });
      return null;
    }
  }

  async getTranslationStats(namespace?: string): Promise<TranslationStats> {
    try {
      let query = 'SELECT COUNT(*) as total_keys FROM translations WHERE is_active = true';
      const params: any[] = [];

      if (namespace) {
        query += ' AND namespace = $1';
        params.push(namespace);
      }

      const totalResult = await this.db.query(query, params);
      const totalKeys = parseInt(totalResult.rows[0].total_keys);

      // Get translated keys count for each locale
      const translatedQuery = `
        SELECT locale, COUNT(*) as translated_count
        FROM translations
        WHERE is_active = true ${namespace ? 'AND namespace = $1' : ''}
        GROUP BY locale
      `;

      const translatedResult = await this.db.query(translatedQuery, params);
      const translatedKeys = translatedResult.rows.reduce((acc, row) => acc + parseInt(row.translated_count), 0);

      // Get missing keys
      const missingQuery = `
        SELECT DISTINCT key
        FROM translations t1
        WHERE is_active = true ${namespace ? 'AND namespace = $1' : ''}
        AND NOT EXISTS (
          SELECT 1 FROM translations t2
          WHERE t2.key = t1.key AND t2.locale = $${params.length + 1}
          AND t2.is_active = true
        )
      `;

      const missingParams = [...params, this.currentLocale];
      const missingResult = await this.db.query(missingQuery, missingParams);
      const missingKeys = missingResult.rows.map(row => row.key);

      return {
        totalKeys,
        translatedKeys,
        missingKeys,
        completionPercentage: totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error getting translation stats', { error, namespace });
      return {
        totalKeys: 0,
        translatedKeys: 0,
        missingKeys: [],
        completionPercentage: 0,
        lastUpdated: new Date()
      };
    }
  }

  async performBilingualSearch(searchParams: BilingualSearch): Promise<any[]> {
    try {
      const { query, locale, searchBothLanguages, transliterationEnabled, fuzzyMatch } = searchParams;
      
      let searchQuery = `
        SELECT DISTINCT d.*, 
               ts_rank(search_vector_fr, plainto_tsquery('french', $1)) as rank_fr,
               ts_rank(search_vector_ar, plainto_tsquery('arabic', $1)) as rank_ar
        FROM documents d
        WHERE 1=1
      `;
      const params: any[] = [query];

      if (searchBothLanguages) {
        searchQuery += ` AND (
          search_vector_fr @@ plainto_tsquery('french', $1) OR
          search_vector_ar @@ plainto_tsquery('arabic', $1)
        )`;
      } else {
        if (locale === SupportedLocale.FRENCH || locale === SupportedLocale.FRENCH_ALGERIA) {
          searchQuery += ` AND search_vector_fr @@ plainto_tsquery('french', $1)`;
        } else {
          searchQuery += ` AND search_vector_ar @@ plainto_tsquery('arabic', $1)`;
        }
      }

      if (fuzzyMatch) {
        searchQuery += ` OR similarity(title_fr, $1) > 0.3 OR similarity(title_ar, $1) > 0.3`;
      }

      searchQuery += ` ORDER BY 
        GREATEST(
          COALESCE(rank_fr, 0),
          COALESCE(rank_ar, 0)
        ) DESC,
        created_at DESC
        LIMIT 100
      `;

      const result = await this.db.query(searchQuery, params);
      return result.rows;
    } catch (error) {
      logger.error('Error performing bilingual search', { error, searchParams });
      return [];
    }
  }

  getRTLConfig(locale?: SupportedLocale): RTLConfig {
    const isRTL = this.isRTL(locale);
    return {
      enabled: isRTL,
      direction: isRTL ? 'rtl' : 'ltr',
      textAlign: isRTL ? 'right' : 'left',
      marginStart: isRTL ? 'margin-right' : 'margin-left',
      marginEnd: isRTL ? 'margin-left' : 'margin-right',
      paddingStart: isRTL ? 'padding-right' : 'padding-left',
      paddingEnd: isRTL ? 'padding-left' : 'padding-right'
    };
  }

  private async ensureTranslationsLoaded(locale: SupportedLocale): Promise<void> {
    const namespaces = ['common', 'auth', 'navigation', 'forms', 'errors', 'legal_terms'];
    
    for (const namespace of namespaces) {
      if (!this.translations.has(namespace) || !this.translations.get(namespace)!.has(locale)) {
        await this.loadTranslations(namespace, locale);
      }
    }
  }

  private loadDefaultTranslations(): void {
    // Load basic French translations
    this.addTranslation('welcome', 'Bienvenue', SupportedLocale.FRENCH, 'common');
    this.addTranslation('login', 'Connexion', SupportedLocale.FRENCH, 'auth');
    this.addTranslation('logout', 'Déconnexion', SupportedLocale.FRENCH, 'auth');
    this.addTranslation('dashboard', 'Tableau de bord', SupportedLocale.FRENCH, 'navigation');
    this.addTranslation('cases', 'Dossiers', SupportedLocale.FRENCH, 'navigation');
    this.addTranslation('documents', 'Documents', SupportedLocale.FRENCH, 'navigation');
    this.addTranslation('billing', 'Facturation', SupportedLocale.FRENCH, 'navigation');
    this.addTranslation('search', 'Recherche', SupportedLocale.FRENCH, 'navigation');
    this.addTranslation('profile', 'Profil', SupportedLocale.FRENCH, 'navigation');
    this.addTranslation('settings', 'Paramètres', SupportedLocale.FRENCH, 'navigation');

    // Load basic Arabic translations
    this.addTranslation('welcome', 'مرحباً', SupportedLocale.ARABIC, 'common');
    this.addTranslation('login', 'تسجيل الدخول', SupportedLocale.ARABIC, 'auth');
    this.addTranslation('logout', 'تسجيل الخروج', SupportedLocale.ARABIC, 'auth');
    this.addTranslation('dashboard', 'لوحة التحكم', SupportedLocale.ARABIC, 'navigation');
    this.addTranslation('cases', 'القضايا', SupportedLocale.ARABIC, 'navigation');
    this.addTranslation('documents', 'الوثائق', SupportedLocale.ARABIC, 'navigation');
    this.addTranslation('billing', 'الفوترة', SupportedLocale.ARABIC, 'navigation');
    this.addTranslation('search', 'البحث', SupportedLocale.ARABIC, 'navigation');
    this.addTranslation('profile', 'الملف الشخصي', SupportedLocale.ARABIC, 'navigation');
    this.addTranslation('settings', 'الإعدادات', SupportedLocale.ARABIC, 'navigation');

    // Legal terms
    this.addTranslation('avocat', 'Avocat', SupportedLocale.FRENCH, 'legal_terms');
    this.addTranslation('avocat', 'محامي', SupportedLocale.ARABIC, 'legal_terms');
    this.addTranslation('notaire', 'Notaire', SupportedLocale.FRENCH, 'legal_terms');
    this.addTranslation('notaire', 'كاتب عدل', SupportedLocale.ARABIC, 'legal_terms');
    this.addTranslation('huissier', 'Huissier de justice', SupportedLocale.FRENCH, 'legal_terms');
    this.addTranslation('huissier', 'محضر قضائي', SupportedLocale.ARABIC, 'legal_terms');
    this.addTranslation('magistrat', 'Magistrat', SupportedLocale.FRENCH, 'legal_terms');
    this.addTranslation('magistrat', 'قاضي', SupportedLocale.ARABIC, 'legal_terms');
  }

  private interpolate(template: string, params?: Record<string, any>): string {
    if (!params) return template;

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match;
    });
  }

  private getNestedValue(obj: any, path: string): string | undefined {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private getPluralKey(key: string, count: number, locale: SupportedLocale): string {
    // Simplified pluralization rules
    if (locale === SupportedLocale.ARABIC || locale === SupportedLocale.ARABIC_ALGERIA) {
      // Arabic pluralization rules
      if (count === 0) return `${key}.zero`;
      if (count === 1) return `${key}.one`;
      if (count === 2) return `${key}.two`;
      if (count >= 3 && count <= 10) return `${key}.few`;
      return `${key}.many`;
    } else {
      // French pluralization rules
      if (count === 0) return `${key}.zero`;
      if (count === 1) return `${key}.one`;
      return `${key}.other`;
    }
  }

  private getDateStyle(format: string): 'short' | 'medium' | 'long' | 'full' {
    if (format.includes('EEEE')) return 'full';
    if (format.includes('MMMM')) return 'long';
    if (format.includes('MMM')) return 'medium';
    return 'short';
  }

  private mapRowToLegalTerminology(row: any): LegalTerminology {
    return {
      id: row.id,
      domain: row.domain,
      termFr: row.term_fr,
      termAr: row.term_ar,
      definitionFr: row.definition_fr,
      definitionAr: row.definition_ar,
      synonymsFr: row.synonyms_fr ? JSON.parse(row.synonyms_fr) : undefined,
      synonymsAr: row.synonyms_ar ? JSON.parse(row.synonyms_ar) : undefined,
      context: row.context,
      profession: row.profession,
      source: row.source,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
// Create and export instance
export const i18nService = new I18nService();