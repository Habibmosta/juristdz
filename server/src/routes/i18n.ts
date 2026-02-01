import { Router, Request, Response } from 'express';
import { I18nService } from '../services/i18nService.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import { logger } from '../utils/logger.js';
import { 
  SupportedLocale, 
  LegalDomain,
  BilingualSearch,
  TranslationRequest as ITranslationRequest,
  Priority,
  LegalTerminology
} from '../types/i18n.js';

export function createI18nRoutes(i18nService: I18nService): Router {
  const router = Router();

  /**
   * Get current locale
   * GET /api/i18n/locale
   */
  router.get('/locale', (req: Request, res: Response) => {
    try {
      const currentLocale = i18nService.getCurrentLocale();
      res.json({
        success: true,
        data: {
          currentLocale,
          availableLocales: i18nService.getAvailableLocales(),
          isRTL: i18nService.isRTL()
        }
      });
    } catch (error) {
      logger.error('Error getting current locale', { error });
      res.status(500).json({
        error: 'Failed to get current locale',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Set locale
   * POST /api/i18n/locale
   */
  router.post('/locale', async (req: Request, res: Response) => {
    try {
      const { locale } = req.body;
      
      if (!locale || !Object.values(SupportedLocale).includes(locale)) {
        return res.status(400).json({
          error: 'Invalid locale',
          supportedLocales: Object.values(SupportedLocale)
        });
      }

      await i18nService.setLocale(locale);
      
      res.json({
        success: true,
        data: {
          locale,
          isRTL: i18nService.isRTL(locale)
        }
      });
    } catch (error) {
      logger.error('Error setting locale', { error, body: req.body });
      res.status(500).json({
        error: 'Failed to set locale',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get translations for a namespace
   * GET /api/i18n/translations/:namespace
   */
  router.get('/translations/:namespace', async (req: Request, res: Response) => {
    try {
      const { namespace } = req.params;
      const locale = req.query.locale as SupportedLocale || i18nService.getCurrentLocale();

      const translations = await i18nService.loadTranslations(namespace, locale);
      
      res.json({
        success: true,
        data: {
          namespace,
          locale,
          translations
        }
      });
    } catch (error) {
      logger.error('Error loading translations', { error, params: req.params, query: req.query });
      res.status(500).json({
        error: 'Failed to load translations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Translate a key
   * POST /api/i18n/translate
   */
  router.post('/translate', (req: Request, res: Response) => {
    try {
      const { key, params, locale } = req.body;
      
      if (!key) {
        return res.status(400).json({
          error: 'Translation key is required'
        });
      }

      const translation = i18nService.translate(key, params, locale);
      
      res.json({
        success: true,
        data: {
          key,
          translation,
          locale: locale || i18nService.getCurrentLocale()
        }
      });
    } catch (error) {
      logger.error('Error translating key', { error, body: req.body });
      res.status(500).json({
        error: 'Failed to translate key',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Search legal terms
   * GET /api/i18n/legal-terms/search
   */
  router.get('/legal-terms/search', async (req: Request, res: Response) => {
    try {
      const { term, locale, domain } = req.query;
      
      if (!term) {
        return res.status(400).json({
          error: 'Search term is required'
        });
      }

      const searchLocale = (locale as SupportedLocale) || i18nService.getCurrentLocale();
      const searchDomain = domain as LegalDomain;

      const results = await i18nService.searchLegalTerm(
        term as string, 
        searchLocale, 
        searchDomain
      );
      
      res.json({
        success: true,
        data: {
          term,
          locale: searchLocale,
          domain: searchDomain,
          results,
          count: results.length
        }
      });
    } catch (error) {
      logger.error('Error searching legal terms', { error, query: req.query });
      res.status(500).json({
        error: 'Failed to search legal terms',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get legal term by ID
   * GET /api/i18n/legal-terms/:id
   */
  router.get('/legal-terms/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const locale = req.query.locale as SupportedLocale || i18nService.getCurrentLocale();

      const term = await i18nService.translateLegalTerm(id, locale);
      
      if (!term) {
        return res.status(404).json({
          error: 'Legal term not found'
        });
      }

      res.json({
        success: true,
        data: term
      });
    } catch (error) {
      logger.error('Error getting legal term', { error, params: req.params });
      res.status(500).json({
        error: 'Failed to get legal term',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Perform bilingual search
   * POST /api/i18n/search/bilingual
   */
  router.post('/search/bilingual', async (req: Request, res: Response) => {
    try {
      const searchParams: BilingualSearch = {
        query: req.body.query,
        locale: req.body.locale || i18nService.getCurrentLocale(),
        searchBothLanguages: req.body.searchBothLanguages || false,
        transliterationEnabled: req.body.transliterationEnabled || false,
        fuzzyMatch: req.body.fuzzyMatch || false
      };

      if (!searchParams.query) {
        return res.status(400).json({
          error: 'Search query is required'
        });
      }

      const results = await i18nService.performBilingualSearch(searchParams);
      
      res.json({
        success: true,
        data: {
          searchParams,
          results,
          count: results.length
        }
      });
    } catch (error) {
      logger.error('Error performing bilingual search', { error, body: req.body });
      res.status(500).json({
        error: 'Failed to perform bilingual search',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Format date
   * POST /api/i18n/format/date
   */
  router.post('/format/date', (req: Request, res: Response) => {
    try {
      const { date, format, locale } = req.body;
      
      if (!date) {
        return res.status(400).json({
          error: 'Date is required'
        });
      }

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format'
        });
      }

      const formattedDate = i18nService.formatDate(dateObj, format, locale);
      
      res.json({
        success: true,
        data: {
          originalDate: date,
          formattedDate,
          format,
          locale: locale || i18nService.getCurrentLocale()
        }
      });
    } catch (error) {
      logger.error('Error formatting date', { error, body: req.body });
      res.status(500).json({
        error: 'Failed to format date',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Format number
   * POST /api/i18n/format/number
   */
  router.post('/format/number', (req: Request, res: Response) => {
    try {
      const { number, format, locale } = req.body;
      
      if (number === undefined || number === null) {
        return res.status(400).json({
          error: 'Number is required'
        });
      }

      const numValue = parseFloat(number);
      if (isNaN(numValue)) {
        return res.status(400).json({
          error: 'Invalid number format'
        });
      }

      const formattedNumber = i18nService.formatNumber(numValue, format, locale);
      
      res.json({
        success: true,
        data: {
          originalNumber: number,
          formattedNumber,
          format,
          locale: locale || i18nService.getCurrentLocale()
        }
      });
    } catch (error) {
      logger.error('Error formatting number', { error, body: req.body });
      res.status(500).json({
        error: 'Failed to format number',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Format currency
   * POST /api/i18n/format/currency
   */
  router.post('/format/currency', (req: Request, res: Response) => {
    try {
      const { amount, currency, locale } = req.body;
      
      if (amount === undefined || amount === null) {
        return res.status(400).json({
          error: 'Amount is required'
        });
      }

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue)) {
        return res.status(400).json({
          error: 'Invalid amount format'
        });
      }

      const formattedCurrency = i18nService.formatCurrency(amountValue, currency, locale);
      
      res.json({
        success: true,
        data: {
          originalAmount: amount,
          formattedCurrency,
          currency: currency || 'DZD',
          locale: locale || i18nService.getCurrentLocale()
        }
      });
    } catch (error) {
      logger.error('Error formatting currency', { error, body: req.body });
      res.status(500).json({
        error: 'Failed to format currency',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get RTL configuration
   * GET /api/i18n/rtl
   */
  router.get('/rtl', (req: Request, res: Response) => {
    try {
      const locale = req.query.locale as SupportedLocale;
      const rtlConfig = i18nService.getRTLConfig(locale);
      
      res.json({
        success: true,
        data: rtlConfig
      });
    } catch (error) {
      logger.error('Error getting RTL config', { error, query: req.query });
      res.status(500).json({
        error: 'Failed to get RTL configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get translation statistics
   * GET /api/i18n/stats
   */
  router.get('/stats', 
    authenticateToken,
    checkPermission('i18n', 'read'),
    async (req: Request, res: Response) => {
      try {
        const namespace = req.query.namespace as string;
        const stats = await i18nService.getTranslationStats(namespace);
        
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        logger.error('Error getting translation stats', { error, query: req.query });
        res.status(500).json({
          error: 'Failed to get translation statistics',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Add translation (Admin only)
   * POST /api/i18n/translations
   */
  router.post('/translations',
    authenticateToken,
    checkPermission('i18n', 'admin'),
    (req: Request, res: Response) => {
      try {
        const { key, value, locale, namespace } = req.body;
        
        if (!key || !value || !locale) {
          return res.status(400).json({
            error: 'Key, value, and locale are required'
          });
        }

        i18nService.addTranslation(key, value, locale, namespace);
        
        res.json({
          success: true,
          message: 'Translation added successfully',
          data: { key, value, locale, namespace }
        });
      } catch (error) {
        logger.error('Error adding translation', { error, body: req.body });
        res.status(500).json({
          error: 'Failed to add translation',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Get supported locales
   * GET /api/i18n/locales
   */
  router.get('/locales', (req: Request, res: Response) => {
    try {
      const locales = i18nService.getAvailableLocales();
      
      res.json({
        success: true,
        data: {
          supportedLocales: locales,
          currentLocale: i18nService.getCurrentLocale(),
          rtlLocales: locales.filter(locale => i18nService.isRTL(locale))
        }
      });
    } catch (error) {
      logger.error('Error getting supported locales', { error });
      res.status(500).json({
        error: 'Failed to get supported locales',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}

// Create and export the i18n router with database connection
import { db } from '../database/connection.js';

const i18nService = new I18nService(db);
export const i18nRouter = createI18nRoutes(i18nService);