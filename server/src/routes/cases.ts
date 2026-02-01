import express from 'express';
import { caseManagementService } from '@/services/caseManagementService';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';
import { logger } from '@/utils/logger';
import {
  CreateClientRequest,
  CreateCaseRequest,
  UpdateCaseRequest,
  CreateCaseEventRequest,
  CreateCaseNoteRequest,
  CreateCaseDeadlineRequest,
  CreateTimeEntryRequest,
  CreateExpenseRequest,
  CaseSearchCriteria
} from '@/types/case';
import { Profession } from '@/types/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Apply RBAC middleware to restrict access to lawyers only
router.use(rbacMiddleware([Profession.AVOCAT]));

/**
 * Create a new client
 * POST /api/cases/clients
 */
router.post('/clients', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const clientData: CreateClientRequest = req.body;

    // Validate required fields
    if (!clientData.type) {
      return res.status(400).json({ error: 'Client type is required' });
    }

    if (clientData.type === 'individual' && (!clientData.firstName || !clientData.lastName)) {
      return res.status(400).json({ error: 'First name and last name are required for individual clients' });
    }

    if (clientData.type === 'company' && !clientData.companyName) {
      return res.status(400).json({ error: 'Company name is required for company clients' });
    }

    const client = await caseManagementService.createClient(
      clientData,
      userId,
      req.user?.organizationId
    );

    res.status(201).json({
      success: true,
      data: client
    });

  } catch (error) {
    logger.error('Create client error:', error);
    res.status(500).json({
      error: 'Failed to create client',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create a new case
 * POST /api/cases
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const caseData: CreateCaseRequest = req.body;

    // Validate required fields
    if (!caseData.title || !caseData.legalDomain || !caseData.caseType || !caseData.clientId) {
      return res.status(400).json({ 
        error: 'Title, legal domain, case type, and client ID are required' 
      });
    }

    const newCase = await caseManagementService.createCase(
      caseData,
      userId,
      req.user?.organizationId
    );

    res.status(201).json({
      success: true,
      data: newCase
    });

  } catch (error) {
    logger.error('Create case error:', error);
    res.status(500).json({
      error: 'Failed to create case',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Search cases
 * POST /api/cases/search
 */
router.post('/search', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const criteria: CaseSearchCriteria = req.body;
    const result = await caseManagementService.searchCases(criteria, userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Case search error:', error);
    res.status(500).json({
      error: 'Failed to search cases',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get lawyer's cases
 * GET /api/cases/my
 */
router.get('/my', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { status, legalDomain, limit } = req.query;
    const filters = {
      status: status as string,
      legalDomain: legalDomain as string,
      limit: limit ? parseInt(limit as string) : undefined
    };

    const cases = await caseManagementService.getLawyerCases(userId, filters);

    res.json({
      success: true,
      data: cases
    });

  } catch (error) {
    logger.error('Get lawyer cases error:', error);
    res.status(500).json({
      error: 'Failed to retrieve cases',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get case by ID
 * GET /api/cases/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const caseId = req.params.id;
    const caseData = await caseManagementService.getCase(caseId, userId);

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({
      success: true,
      data: caseData
    });

  } catch (error) {
    logger.error('Get case error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({
        error: 'Failed to retrieve case',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Update case
 * PUT /api/cases/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const caseId = req.params.id;
    const updates: UpdateCaseRequest = req.body;

    const updatedCase = await caseManagementService.updateCase(caseId, updates, userId);

    res.json({
      success: true,
      data: updatedCase
    });

  } catch (error) {
    logger.error('Update case error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({
        error: 'Failed to update case',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Associate document with case
 * POST /api/cases/:id/documents
 */
router.post('/:id/documents', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const caseId = req.params.id;
    const { documentId, documentRole, notes } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    const association = await caseManagementService.associateDocumentWithCase(
      caseId,
      documentId,
      documentRole || 'general',
      userId,
      notes
    );

    res.status(201).json({
      success: true,
      data: association
    });

  } catch (error) {
    logger.error('Associate document error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({
        error: 'Failed to associate document',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Add event to case
 * POST /api/cases/:id/events
 */
router.post('/:id/events', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const caseId = req.params.id;
    const eventData: CreateCaseEventRequest = req.body;

    // Validate required fields
    if (!eventData.eventType || !eventData.title || !eventData.eventDate) {
      return res.status(400).json({ 
        error: 'Event type, title, and event date are required' 
      });
    }

    // Convert date string to Date object
    eventData.eventDate = new Date(eventData.eventDate);

    const event = await caseManagementService.addCaseEvent(caseId, eventData, userId);

    res.status(201).json({
      success: true,
      data: event
    });

  } catch (error) {
    logger.error('Add case event error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({
        error: 'Failed to add case event',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Add note to case
 * POST /api/cases/:id/notes
 */
router.post('/:id/notes', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const caseId = req.params.id;
    const noteData: CreateCaseNoteRequest = req.body;

    // Validate required fields
    if (!noteData.content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const note = await caseManagementService.addCaseNote(caseId, noteData, userId);

    res.status(201).json({
      success: true,
      data: note
    });

  } catch (error) {
    logger.error('Add case note error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({
        error: 'Failed to add case note',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Add deadline to case
 * POST /api/cases/:id/deadlines
 */
router.post('/:id/deadlines', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const caseId = req.params.id;
    const deadlineData: CreateCaseDeadlineRequest = req.body;

    // Validate required fields
    if (!deadlineData.title || !deadlineData.deadlineDate || !deadlineData.deadlineType) {
      return res.status(400).json({ 
        error: 'Title, deadline date, and deadline type are required' 
      });
    }

    // Convert date string to Date object
    deadlineData.deadlineDate = new Date(deadlineData.deadlineDate);

    const deadline = await caseManagementService.addCaseDeadline(caseId, deadlineData, userId);

    res.status(201).json({
      success: true,
      data: deadline
    });

  } catch (error) {
    logger.error('Add case deadline error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({
        error: 'Failed to add case deadline',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Add time entry to case
 * POST /api/cases/:id/time-entries
 */
router.post('/:id/time-entries', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const caseId = req.params.id;
    const timeData: CreateTimeEntryRequest = req.body;

    // Validate required fields
    if (!timeData.startTime || !timeData.activityType || !timeData.description) {
      return res.status(400).json({ 
        error: 'Start time, activity type, and description are required' 
      });
    }

    // Convert date strings to Date objects
    timeData.startTime = new Date(timeData.startTime);
    if (timeData.endTime) {
      timeData.endTime = new Date(timeData.endTime);
    }

    const timeEntry = await caseManagementService.addTimeEntry(caseId, timeData, userId);

    res.status(201).json({
      success: true,
      data: timeEntry
    });

  } catch (error) {
    logger.error('Add time entry error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
    } else {
      res.status(500).json({
        error: 'Failed to add time entry',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * Get case statistics for lawyer
 * GET /api/cases/statistics
 */
router.get('/statistics/summary', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const statistics = await caseManagementService.getCaseStatistics(userId, start, end);

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    logger.error('Get case statistics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve case statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;