import express from 'express';
import { aiLegalService } from '@/services/aiLegalService';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';
import { logger } from '@/utils/logger';
import { DocumentType } from '@/types/document';
import { LegalDomain } from '@/types/search';
import { Profession } from '@/types/auth';
import { 
  LegalContext, 
  ExplanationLevel, 
  ClauseType, 
  ReviewType, 
  SummaryType 
} from '@/types/ai';

const router = express.Router();

// Apply authentication to all AI routes
router.use(authMiddleware);

/**
 * Generate document draft
 * POST /api/ai/generate-document
 */
router.post('/generate-document', 
  rbacMiddleware('document', 'create'),
  async (req, res) => {
    try {
      const { type, context } = req.body;

      // Validate input
      if (!type || !Object.values(DocumentType).includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid document type'
        });
      }

      // Build legal context
      const legalContext: LegalContext = {
        userRole: req.user?.activeRole as Profession,
        jurisdiction: 'Algeria',
        legalDomain: context.legalDomain || LegalDomain.CIVIL,
        language: context.language || 'fr',
        urgency: context.urgency || 'medium',
        complexity: context.complexity || 'medium',
        clientInfo: context.clientInfo,
        caseInfo: context.caseInfo,
        customInstructions: context.customInstructions
      };

      const draft = await aiLegalService.generateDocumentDraft(type, legalContext);

      logger.info('Document draft generated via API', {
        userId: req.user?.userId,
        type,
        confidence: draft.confidence
      });

      res.json({
        success: true,
        data: draft
      });

    } catch (error) {
      logger.error('Document generation API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate document draft'
      });
    }
  }
);

/**
 * Analyze document compliance
 * POST /api/ai/analyze-compliance
 */
router.post('/analyze-compliance',
  rbacMiddleware('document', 'analyze'),
  async (req, res) => {
    try {
      const { document, domain } = req.body;

      if (!document || typeof document !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Document content is required'
        });
      }

      if (!domain || !Object.values(LegalDomain).includes(domain)) {
        return res.status(400).json({
          success: false,
          error: 'Valid legal domain is required'
        });
      }

      const analysis = await aiLegalService.analyzeCompliance(document, domain);

      logger.info('Compliance analysis completed via API', {
        userId: req.user?.userId,
        domain,
        overallScore: analysis.overallScore,
        issuesCount: analysis.issues.length
      });

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      logger.error('Compliance analysis API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze document compliance'
      });
    }
  }
);

/**
 * Get improvement suggestions
 * POST /api/ai/suggest-improvements
 */
router.post('/suggest-improvements',
  rbacMiddleware('document', 'analyze'),
  async (req, res) => {
    try {
      const { document } = req.body;

      if (!document || typeof document !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Document content is required'
        });
      }

      const userRole = req.user?.activeRole as Profession;
      const suggestions = await aiLegalService.suggestImprovements(document, userRole);

      logger.info('Improvement suggestions generated via API', {
        userId: req.user?.userId,
        userRole,
        suggestionsCount: suggestions.length
      });

      res.json({
        success: true,
        data: suggestions
      });

    } catch (error) {
      logger.error('Improvement suggestions API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate improvement suggestions'
      });
    }
  }
);

/**
 * Explain legal concept
 * POST /api/ai/explain-concept
 */
router.post('/explain-concept',
  rbacMiddleware('search', 'read'), // Students and professionals can access explanations
  async (req, res) => {
    try {
      const { concept, level } = req.body;

      if (!concept || typeof concept !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Legal concept is required'
        });
      }

      const explanationLevel = level || ExplanationLevel.INTERMEDIATE;
      if (!Object.values(ExplanationLevel).includes(explanationLevel)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid explanation level'
        });
      }

      const explanation = await aiLegalService.explainLegalConcept(concept, explanationLevel);

      logger.info('Legal concept explained via API', {
        userId: req.user?.userId,
        concept,
        level: explanationLevel
      });

      res.json({
        success: true,
        data: explanation
      });

    } catch (error) {
      logger.error('Legal concept explanation API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to explain legal concept'
      });
    }
  }
);

/**
 * Validate legal reasoning
 * POST /api/ai/validate-reasoning
 */
router.post('/validate-reasoning',
  rbacMiddleware('document', 'analyze'),
  async (req, res) => {
    try {
      const { argument } = req.body;

      if (!argument || typeof argument !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Legal argument is required'
        });
      }

      const validation = await aiLegalService.validateLegalReasoning(argument);

      logger.info('Legal reasoning validated via API', {
        userId: req.user?.userId,
        score: validation.score,
        isValid: validation.isValid
      });

      res.json({
        success: true,
        data: validation
      });

    } catch (error) {
      logger.error('Legal reasoning validation API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate legal reasoning'
      });
    }
  }
);

/**
 * Generate legal clause
 * POST /api/ai/generate-clause
 */
router.post('/generate-clause',
  rbacMiddleware('document', 'create'),
  async (req, res) => {
    try {
      const { clauseType, context } = req.body;

      if (!clauseType || !Object.values(ClauseType).includes(clauseType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid clause type'
        });
      }

      if (!context || !context.contractType) {
        return res.status(400).json({
          success: false,
          error: 'Contract context is required'
        });
      }

      const clause = await aiLegalService.generateClause(clauseType, context);

      logger.info('Legal clause generated via API', {
        userId: req.user?.userId,
        clauseType,
        contractType: context.contractType
      });

      res.json({
        success: true,
        data: clause
      });

    } catch (error) {
      logger.error('Clause generation API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate legal clause'
      });
    }
  }
);

/**
 * Review contract
 * POST /api/ai/review-contract
 */
router.post('/review-contract',
  rbacMiddleware('document', 'analyze'),
  async (req, res) => {
    try {
      const { contract, reviewType } = req.body;

      if (!contract || typeof contract !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Contract content is required'
        });
      }

      const type = reviewType || ReviewType.COMPREHENSIVE;
      if (!Object.values(ReviewType).includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid review type'
        });
      }

      const review = await aiLegalService.reviewContract(contract, type);

      logger.info('Contract reviewed via API', {
        userId: req.user?.userId,
        reviewType: type,
        score: review.score
      });

      res.json({
        success: true,
        data: review
      });

    } catch (error) {
      logger.error('Contract review API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to review contract'
      });
    }
  }
);

/**
 * Extract legal entities
 * POST /api/ai/extract-entities
 */
router.post('/extract-entities',
  rbacMiddleware('document', 'analyze'),
  async (req, res) => {
    try {
      const { document } = req.body;

      if (!document || typeof document !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Document content is required'
        });
      }

      const entities = await aiLegalService.extractLegalEntities(document);

      logger.info('Legal entities extracted via API', {
        userId: req.user?.userId,
        entitiesCount: entities.length
      });

      res.json({
        success: true,
        data: entities
      });

    } catch (error) {
      logger.error('Entity extraction API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to extract legal entities'
      });
    }
  }
);

/**
 * Summarize document
 * POST /api/ai/summarize-document
 */
router.post('/summarize-document',
  rbacMiddleware('document', 'read'),
  async (req, res) => {
    try {
      const { document, summaryType } = req.body;

      if (!document || typeof document !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Document content is required'
        });
      }

      const type = summaryType || SummaryType.EXECUTIVE;
      if (!Object.values(SummaryType).includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid summary type'
        });
      }

      const summary = await aiLegalService.summarizeDocument(document, type);

      logger.info('Document summarized via API', {
        userId: req.user?.userId,
        summaryType: type,
        compressionRatio: summary.compressionRatio
      });

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      logger.error('Document summarization API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to summarize document'
      });
    }
  }
);

/**
 * Translate legal text
 * POST /api/ai/translate-text
 */
router.post('/translate-text',
  rbacMiddleware('document', 'read'),
  async (req, res) => {
    try {
      const { text, fromLang, toLang } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Text content is required'
        });
      }

      if (!fromLang || !toLang || !['fr', 'ar'].includes(fromLang) || !['fr', 'ar'].includes(toLang)) {
        return res.status(400).json({
          success: false,
          error: 'Valid source and target languages are required (fr, ar)'
        });
      }

      if (fromLang === toLang) {
        return res.status(400).json({
          success: false,
          error: 'Source and target languages must be different'
        });
      }

      const translation = await aiLegalService.translateLegalText(text, fromLang, toLang);

      logger.info('Legal text translated via API', {
        userId: req.user?.userId,
        fromLang,
        toLang,
        qualityScore: translation.qualityScore
      });

      res.json({
        success: true,
        data: translation
      });

    } catch (error) {
      logger.error('Translation API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to translate legal text'
      });
    }
  }
);

/**
 * Get AI service usage statistics (Admin only)
 * GET /api/ai/usage-stats
 */
router.get('/usage-stats',
  rbacMiddleware('system', 'monitor'),
  async (req, res) => {
    try {
      // This would typically query the ai_service_usage table
      const stats = {
        totalRequests: 0,
        requestsByType: {},
        averageResponseTime: 0,
        successRate: 0,
        userSatisfaction: 0,
        mostUsedFeatures: [],
        errorTypes: {},
        costAnalysis: {
          totalCost: 0,
          costByFeature: {},
          averageCostPerRequest: 0,
          tokenUsage: {
            input: 0,
            output: 0,
            total: 0
          }
        }
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Usage stats API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve usage statistics'
      });
    }
  }
);

/**
 * Submit feedback for AI-generated content
 * POST /api/ai/feedback
 */
router.post('/feedback',
  authMiddleware,
  async (req, res) => {
    try {
      const { contentId, rating, feedback } = req.body;

      if (!contentId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Valid content ID and rating (1-5) are required'
        });
      }

      // Store feedback in database
      // This would update the ai_generated_content table or ai_service_usage table

      logger.info('AI feedback submitted', {
        userId: req.user?.userId,
        contentId,
        rating
      });

      res.json({
        success: true,
        message: 'Feedback submitted successfully'
      });

    } catch (error) {
      logger.error('Feedback submission API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit feedback'
      });
    }
  }
);

export default router;