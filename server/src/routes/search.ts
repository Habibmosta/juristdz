import { Router } from 'express';
import { Request, Response } from 'express';
import { legalSearchService } from '@/services/legalSearchService';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';
import { logger } from '@/utils/logger';
import { 
  SearchQuery, 
  LegalDomain, 
  Jurisdiction, 
  SortOption,
  SearchFilter 
} from '@/types/search';
import { ResourceType, ActionType } from '@/types/rbac';

const router = Router();

// Apply authentication to all search routes
router.use(authMiddleware);

/**
 * Search jurisprudence
 * POST /api/search/jurisprudence
 * Validates: Requirements 3.1, 3.3 - Jurisprudence search with relevance ranking
 */
router.post('/jurisprudence', 
  rbacMiddleware(ResourceType.JURISPRUDENCE, ActionType.SEARCH),
  async (req: Request, res: Response) => {
    try {
      const {
        text,
        filters = [],
        jurisdiction,
        dateRange,
        domain,
        maxResults = 50,
        sortBy = SortOption.RELEVANCE,
        language = 'fr'
      } = req.body;

      // Validate required fields
      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          error: 'Search text is required',
          code: 'MISSING_SEARCH_TEXT'
        });
      }

      if (text.length > 500) {
        return res.status(400).json({
          error: 'Search text too long (max 500 characters)',
          code: 'SEARCH_TEXT_TOO_LONG'
        });
      }

      // Build search query
      const searchQuery: SearchQuery = {
        text: text.trim(),
        filters: filters as SearchFilter[],
        jurisdiction: jurisdiction as Jurisdiction,
        dateRange: dateRange ? {
          from: dateRange.from ? new Date(dateRange.from) : undefined,
          to: dateRange.to ? new Date(dateRange.to) : undefined
        } : undefined,
        domain: domain as LegalDomain,
        maxResults: Math.min(maxResults, 100), // Limit to 100 results
        sortBy: sortBy as SortOption,
        language
      };

      // Log search for analytics
      logger.info('Jurisprudence search request', {
        userId: req.user?.id,
        searchText: text,
        filtersCount: filters.length,
        domain,
        jurisdiction
      });

      // Execute search
      const results = await legalSearchService.searchJurisprudence(searchQuery);

      // Log search completion
      logger.info('Jurisprudence search completed', {
        userId: req.user?.id,
        resultsCount: results.results.length,
        totalCount: results.totalCount,
        searchTime: results.searchTime
      });

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      logger.error('Jurisprudence search error:', error);
      res.status(500).json({
        error: 'Search failed',
        code: 'SEARCH_ERROR'
      });
    }
  }
);

/**
 * Search legal texts (codes, laws, regulations)
 * POST /api/search/legal-texts
 * Validates: Requirements 3.2 - Legal text search by keywords and references
 */
router.post('/legal-texts',
  rbacMiddleware(ResourceType.LEGAL_TEXT, ActionType.SEARCH),
  async (req: Request, res: Response) => {
    try {
      const {
        text,
        filters = [],
        domain,
        maxResults = 50,
        sortBy = SortOption.RELEVANCE,
        language = 'fr'
      } = req.body;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          error: 'Search text is required',
          code: 'MISSING_SEARCH_TEXT'
        });
      }

      const searchQuery: SearchQuery = {
        text: text.trim(),
        filters: filters as SearchFilter[],
        domain: domain as LegalDomain,
        maxResults: Math.min(maxResults, 100),
        sortBy: sortBy as SortOption,
        language
      };

      logger.info('Legal texts search request', {
        userId: req.user?.id,
        searchText: text,
        domain
      });

      const results = await legalSearchService.searchLegalTexts(searchQuery);

      logger.info('Legal texts search completed', {
        userId: req.user?.id,
        resultsCount: results.results.length,
        searchTime: results.searchTime
      });

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      logger.error('Legal texts search error:', error);
      res.status(500).json({
        error: 'Legal texts search failed',
        code: 'LEGAL_TEXTS_SEARCH_ERROR'
      });
    }
  }
);

/**
 * Get related cases for a specific case
 * GET /api/search/related-cases/:caseId
 * Validates: Requirements 3.4 - Related case discovery
 */
router.get('/related-cases/:caseId',
  rbacMiddleware(ResourceType.JURISPRUDENCE, ActionType.READ),
  async (req: Request, res: Response) => {
    try {
      const { caseId } = req.params;

      if (!caseId) {
        return res.status(400).json({
          error: 'Case ID is required',
          code: 'MISSING_CASE_ID'
        });
      }

      logger.info('Related cases request', {
        userId: req.user?.id,
        caseId
      });

      const relatedCases = await legalSearchService.getRelatedCases(caseId);

      res.json({
        success: true,
        data: relatedCases
      });

    } catch (error) {
      logger.error('Related cases error:', error);
      res.status(500).json({
        error: 'Failed to get related cases',
        code: 'RELATED_CASES_ERROR'
      });
    }
  }
);

/**
 * Get search suggestions for autocomplete
 * GET /api/search/suggestions?q=partial_query
 * Validates: Requirements 3.5 - Alternative term suggestions
 */
router.get('/suggestions',
  rbacMiddleware(ResourceType.SEARCH, ActionType.READ),
  async (req: Request, res: Response) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      const suggestions = await legalSearchService.suggestSearchTerms(q.trim());

      res.json({
        success: true,
        data: suggestions
      });

    } catch (error) {
      logger.error('Search suggestions error:', error);
      res.status(500).json({
        error: 'Failed to get suggestions',
        code: 'SUGGESTIONS_ERROR'
      });
    }
  }
);

/**
 * Analyze legal document for key concepts and references
 * POST /api/search/analyze-document
 * Validates: Requirements 3.1 - Legal document analysis
 */
router.post('/analyze-document',
  rbacMiddleware(ResourceType.DOCUMENT, ActionType.ANALYZE),
  async (req: Request, res: Response) => {
    try {
      const { document } = req.body;

      if (!document || typeof document !== 'string' || document.trim().length === 0) {
        return res.status(400).json({
          error: 'Document content is required',
          code: 'MISSING_DOCUMENT'
        });
      }

      if (document.length > 50000) {
        return res.status(400).json({
          error: 'Document too long (max 50,000 characters)',
          code: 'DOCUMENT_TOO_LONG'
        });
      }

      logger.info('Document analysis request', {
        userId: req.user?.id,
        documentLength: document.length
      });

      const analysis = await legalSearchService.analyzeLegalDocument(document);

      logger.info('Document analysis completed', {
        userId: req.user?.id,
        keyTermsCount: analysis.keyTerms.length,
        precedentsCount: analysis.precedents.length
      });

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      logger.error('Document analysis error:', error);
      res.status(500).json({
        error: 'Document analysis failed',
        code: 'DOCUMENT_ANALYSIS_ERROR'
      });
    }
  }
);

/**
 * Get search filters and facets
 * GET /api/search/filters
 */
router.get('/filters',
  rbacMiddleware(ResourceType.SEARCH, ActionType.READ),
  async (req: Request, res: Response) => {
    try {
      // Return available filter options
      const filters = {
        domains: Object.values(LegalDomain),
        jurisdictions: Object.values(Jurisdiction),
        sortOptions: Object.values(SortOption),
        courtTypes: ['civil', 'criminal', 'commercial', 'administrative', 'supreme'],
        documentTypes: ['code', 'law', 'decree', 'regulation', 'ordinance']
      };

      res.json({
        success: true,
        data: filters
      });

    } catch (error) {
      logger.error('Get filters error:', error);
      res.status(500).json({
        error: 'Failed to get filters',
        code: 'FILTERS_ERROR'
      });
    }
  }
);

export default router;