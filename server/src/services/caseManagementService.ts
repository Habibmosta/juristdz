import { db } from '@/database/connection';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import {
  Case,
  Client,
  CaseDocument,
  CaseEvent,
  CaseNote,
  CaseContact,
  CaseDeadline,
  CaseTimeEntry,
  CaseExpense,
  CaseSearchCriteria,
  CaseSearchResult,
  CaseStatistics,
  CaseOverview,
  CreateClientRequest,
  CreateCaseRequest,
  UpdateCaseRequest,
  CreateCaseEventRequest,
  CreateCaseNoteRequest,
  CreateCaseDeadlineRequest,
  CreateTimeEntryRequest,
  CreateExpenseRequest,
  CaseStatus,
  ClientType,
  CaseSortOption
} from '@/types/case';

export class CaseManagementService {
  
  /**
   * Create a new client
   * Validates: Requirements 5.1 - Client management
   */
  async createClient(clientData: CreateClientRequest, userId: string, organizationId?: string): Promise<Client> {
    try {
      const clientId = uuidv4();
      
      const client: Client = {
        id: clientId,
        type: clientData.type,
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        companyName: clientData.companyName,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        city: clientData.city,
        country: 'Algeria',
        notes: clientData.notes,
        createdBy: userId,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      await this.saveClientToDatabase(client);

      logger.info('Client created successfully', { clientId, type: client.type, userId });
      return client;

    } catch (error) {
      logger.error('Client creation error:', error);
      throw new Error('Failed to create client');
    }
  }

  /**
   * Create a new case
   * Validates: Requirements 5.1, 5.2 - Case creation and organization
   */
  async createCase(caseData: CreateCaseRequest, userId: string, organizationId?: string): Promise<Case> {
    try {
      const caseId = uuidv4();
      
      // Generate case number
      const caseNumber = await this.generateCaseNumber(organizationId);
      
      const newCase: Case = {
        id: caseId,
        caseNumber,
        title: caseData.title,
        description: caseData.description,
        legalDomain: caseData.legalDomain,
        caseType: caseData.caseType,
        urgencyLevel: caseData.urgencyLevel || 'normal' as any,
        clientId: caseData.clientId,
        opposingParty: caseData.opposingParty,
        courtId: caseData.courtId,
        status: CaseStatus.OPEN,
        openedDate: new Date(),
        estimatedValue: caseData.estimatedValue,
        currency: 'DZD',
        feeArrangement: caseData.feeArrangement,
        hourlyRate: caseData.hourlyRate,
        fixedFee: caseData.fixedFee,
        assignedLawyerId: userId,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      await this.saveCaseToDatabase(newCase);

      logger.info('Case created successfully', { caseId, caseNumber, userId });
      return newCase;

    } catch (error) {
      logger.error('Case creation error:', error);
      throw new Error('Failed to create case');
    }
  }

  /**
   * Get case by ID with full details
   * Validates: Requirements 5.2 - Case access and organization
   */
  async getCase(caseId: string, userId: string): Promise<Case | null> {
    try {
      // Check access permissions
      const hasAccess = await this.checkCaseAccess(caseId, userId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get case details
      const result = await db.query(
        `SELECT c.*, cl.first_name as client_first_name, cl.last_name as client_last_name,
                cl.company_name as client_company_name, cl.type as client_type
         FROM cases c
         LEFT JOIN clients cl ON c.client_id = cl.id
         WHERE c.id = $1 AND c.is_active = true`,
        [caseId]
      );

      if (!result || (result as any).rows.length === 0) {
        return null;
      }

      const caseData = this.mapRowToCase((result as any).rows[0]);

      // Load related data
      caseData.documents = await this.getCaseDocuments(caseId);
      caseData.events = await this.getCaseEvents(caseId);
      caseData.notes = await this.getCaseNotes(caseId);
      caseData.contacts = await this.getCaseContacts(caseId);
      caseData.deadlines = await this.getCaseDeadlines(caseId);
      caseData.timeEntries = await this.getCaseTimeEntries(caseId);
      caseData.expenses = await this.getCaseExpenses(caseId);

      return caseData;

    } catch (error) {
      logger.error('Get case error:', error);
      throw new Error('Failed to retrieve case');
    }
  }

  /**
   * Update case information
   * Validates: Requirements 5.2 - Case management
   */
  async updateCase(caseId: string, updates: UpdateCaseRequest, userId: string): Promise<Case> {
    try {
      // Check access permissions
      const hasAccess = await this.checkCaseAccess(caseId, userId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Build update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.title !== undefined) {
        updateFields.push(`title = $${paramIndex++}`);
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(updates.description);
      }
      if (updates.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
        
        // Set closed date if status is closed
        if (updates.status === CaseStatus.CLOSED) {
          updateFields.push(`closed_date = CURRENT_DATE`);
        }
      }
      if (updates.urgencyLevel !== undefined) {
        updateFields.push(`urgency_level = $${paramIndex++}`);
        values.push(updates.urgencyLevel);
      }
      if (updates.opposingParty !== undefined) {
        updateFields.push(`opposing_party = $${paramIndex++}`);
        values.push(updates.opposingParty);
      }
      if (updates.opposingCounsel !== undefined) {
        updateFields.push(`opposing_counsel = $${paramIndex++}`);
        values.push(updates.opposingCounsel);
      }
      if (updates.courtId !== undefined) {
        updateFields.push(`court_id = $${paramIndex++}`);
        values.push(updates.courtId);
      }
      if (updates.judgeName !== undefined) {
        updateFields.push(`judge_name = $${paramIndex++}`);
        values.push(updates.judgeName);
      }
      if (updates.nextHearingDate !== undefined) {
        updateFields.push(`next_hearing_date = $${paramIndex++}`);
        values.push(updates.nextHearingDate);
      }
      if (updates.estimatedValue !== undefined) {
        updateFields.push(`estimated_value = $${paramIndex++}`);
        values.push(updates.estimatedValue);
      }
      if (updates.feeArrangement !== undefined) {
        updateFields.push(`fee_arrangement = $${paramIndex++}`);
        values.push(updates.feeArrangement);
      }
      if (updates.hourlyRate !== undefined) {
        updateFields.push(`hourly_rate = $${paramIndex++}`);
        values.push(updates.hourlyRate);
      }
      if (updates.fixedFee !== undefined) {
        updateFields.push(`fixed_fee = $${paramIndex++}`);
        values.push(updates.fixedFee);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      // Add updated_at and case ID
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(caseId);

      const query = `UPDATE cases SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
      await db.query(query, values);

      // Return updated case
      const updatedCase = await this.getCase(caseId, userId);
      if (!updatedCase) {
        throw new Error('Failed to retrieve updated case');
      }

      logger.info('Case updated successfully', { caseId, userId });
      return updatedCase;

    } catch (error) {
      logger.error('Case update error:', error);
      throw new Error('Failed to update case');
    }
  }

  /**
   * Search cases with advanced filtering
   * Validates: Requirements 5.2 - Case organization and search
   */
  async searchCases(criteria: CaseSearchCriteria, userId: string): Promise<CaseSearchResult> {
    try {
      const startTime = Date.now();

      // Build search query
      let query = `
        SELECT c.*, cl.first_name as client_first_name, cl.last_name as client_last_name,
               cl.company_name as client_company_name, cl.type as client_type
        FROM cases c
        LEFT JOIN clients cl ON c.client_id = cl.id
        WHERE c.is_active = true
        AND (c.assigned_lawyer_id = $1 OR c.supervising_lawyer_id = $1)
      `;

      const params: any[] = [userId];
      let paramIndex = 1;

      // Add search filters
      if (criteria.query) {
        query += ` AND (c.title ILIKE $${++paramIndex} OR c.description ILIKE $${paramIndex} OR c.case_number ILIKE $${paramIndex})`;
        params.push(`%${criteria.query}%`);
      }

      if (criteria.clientId) {
        query += ` AND c.client_id = $${++paramIndex}`;
        params.push(criteria.clientId);
      }

      if (criteria.status) {
        query += ` AND c.status = $${++paramIndex}`;
        params.push(criteria.status);
      }

      if (criteria.legalDomain) {
        query += ` AND c.legal_domain = $${++paramIndex}`;
        params.push(criteria.legalDomain);
      }

      if (criteria.caseType) {
        query += ` AND c.case_type = $${++paramIndex}`;
        params.push(criteria.caseType);
      }

      if (criteria.urgencyLevel) {
        query += ` AND c.urgency_level = $${++paramIndex}`;
        params.push(criteria.urgencyLevel);
      }

      if (criteria.dateRange) {
        if (criteria.dateRange.from) {
          query += ` AND c.opened_date >= $${++paramIndex}`;
          params.push(criteria.dateRange.from);
        }
        if (criteria.dateRange.to) {
          query += ` AND c.opened_date <= $${++paramIndex}`;
          params.push(criteria.dateRange.to);
        }
      }

      if (criteria.courtId) {
        query += ` AND c.court_id = $${++paramIndex}`;
        params.push(criteria.courtId);
      }

      if (criteria.hasUpcomingDeadlines) {
        query += ` AND EXISTS (
          SELECT 1 FROM case_deadlines cd 
          WHERE cd.case_id = c.id 
          AND cd.status = 'pending' 
          AND cd.deadline_date > CURRENT_TIMESTAMP
        )`;
      }

      // Add sorting
      const sortBy = criteria.sortBy || CaseSortOption.OPENED_DATE;
      const sortOrder = criteria.sortOrder || 'desc';
      
      switch (sortBy) {
        case CaseSortOption.CLIENT_NAME:
          query += ` ORDER BY COALESCE(cl.last_name, cl.company_name) ${sortOrder}`;
          break;
        default:
          query += ` ORDER BY c.${sortBy} ${sortOrder}`;
      }

      // Add pagination
      const limit = criteria.limit || 50;
      const offset = criteria.offset || 0;
      query += ` LIMIT $${++paramIndex} OFFSET $${++paramIndex}`;
      params.push(limit, offset);

      // Execute search
      const result = await db.query(query, params);
      const cases = (result as any).rows.map((row: any) => this.mapRowToCase(row));

      // Get total count
      const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*$/, '').replace(/LIMIT.*$/, '');
      const countResult = await db.query(countQuery, params.slice(0, -2));
      const totalCount = parseInt((countResult as any).rows[0].count);

      const searchTime = Date.now() - startTime;

      return {
        cases,
        totalCount,
        searchTime
      };

    } catch (error) {
      logger.error('Case search error:', error);
      throw new Error('Failed to search cases');
    }
  }

  /**
   * Get cases assigned to a lawyer
   * Validates: Requirements 5.2 - Case organization
   */
  async getLawyerCases(lawyerId: string, filters?: Partial<CaseSearchCriteria>): Promise<Case[]> {
    try {
      let query = `
        SELECT c.*, cl.first_name as client_first_name, cl.last_name as client_last_name,
               cl.company_name as client_company_name, cl.type as client_type
        FROM cases c
        LEFT JOIN clients cl ON c.client_id = cl.id
        WHERE c.is_active = true
        AND (c.assigned_lawyer_id = $1 OR c.supervising_lawyer_id = $1)
      `;

      const params: any[] = [lawyerId];
      let paramIndex = 1;

      if (filters?.status) {
        query += ` AND c.status = $${++paramIndex}`;
        params.push(filters.status);
      }

      if (filters?.legalDomain) {
        query += ` AND c.legal_domain = $${++paramIndex}`;
        params.push(filters.legalDomain);
      }

      query += ` ORDER BY c.opened_date DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${++paramIndex}`;
        params.push(filters.limit);
      }

      const result = await db.query(query, params);
      return (result as any).rows.map((row: any) => this.mapRowToCase(row));

    } catch (error) {
      logger.error('Get lawyer cases error:', error);
      throw new Error('Failed to retrieve lawyer cases');
    }
  }

  /**
   * Associate document with case
   * Validates: Requirements 5.2 - Document-case association
   */
  async associateDocumentWithCase(
    caseId: string,
    documentId: string,
    documentRole: string,
    userId: string,
    notes?: string
  ): Promise<CaseDocument> {
    try {
      // Check case access
      const hasAccess = await this.checkCaseAccess(caseId, userId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const associationId = uuidv4();
      const association: CaseDocument = {
        id: associationId,
        caseId,
        documentId,
        documentRole,
        addedBy: userId,
        addedAt: new Date(),
        notes
      };

      await db.query(
        `INSERT INTO case_documents (id, case_id, document_id, document_role, added_by, added_at, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (case_id, document_id) DO UPDATE SET
         document_role = $4, notes = $7, added_at = $6`,
        [associationId, caseId, documentId, documentRole, userId, association.addedAt, notes]
      );

      logger.info('Document associated with case', { caseId, documentId, userId });
      return association;

    } catch (error) {
      logger.error('Document association error:', error);
      throw new Error('Failed to associate document with case');
    }
  }

  /**
   * Add event to case
   * Validates: Requirements 5.2 - Case event tracking
   */
  async addCaseEvent(caseId: string, eventData: CreateCaseEventRequest, userId: string): Promise<CaseEvent> {
    try {
      // Check case access
      const hasAccess = await this.checkCaseAccess(caseId, userId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const eventId = uuidv4();
      const event: CaseEvent = {
        id: eventId,
        caseId,
        eventType: eventData.eventType,
        title: eventData.title,
        description: eventData.description,
        eventDate: eventData.eventDate,
        durationMinutes: eventData.durationMinutes,
        location: eventData.location,
        participants: eventData.participants || [],
        status: 'scheduled' as any,
        reminderDate: eventData.reminderDate,
        isBillable: eventData.isBillable || false,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveCaseEventToDatabase(event);

      logger.info('Case event added', { caseId, eventId, eventType: event.eventType, userId });
      return event;

    } catch (error) {
      logger.error('Add case event error:', error);
      throw new Error('Failed to add case event');
    }
  }

  /**
   * Add note to case
   * Validates: Requirements 5.2 - Case notes
   */
  async addCaseNote(caseId: string, noteData: CreateCaseNoteRequest, userId: string): Promise<CaseNote> {
    try {
      // Check case access
      const hasAccess = await this.checkCaseAccess(caseId, userId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const noteId = uuidv4();
      const note: CaseNote = {
        id: noteId,
        caseId,
        title: noteData.title,
        content: noteData.content,
        noteType: noteData.noteType || 'general' as any,
        isConfidential: noteData.isConfidential || false,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveCaseNoteToDatabase(note);

      logger.info('Case note added', { caseId, noteId, userId });
      return note;

    } catch (error) {
      logger.error('Add case note error:', error);
      throw new Error('Failed to add case note');
    }
  }

  /**
   * Add deadline to case
   * Validates: Requirements 5.3 - Deadline tracking
   */
  async addCaseDeadline(caseId: string, deadlineData: CreateCaseDeadlineRequest, userId: string): Promise<CaseDeadline> {
    try {
      // Check case access
      const hasAccess = await this.checkCaseAccess(caseId, userId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const deadlineId = uuidv4();
      const deadline: CaseDeadline = {
        id: deadlineId,
        caseId,
        title: deadlineData.title,
        description: deadlineData.description,
        deadlineDate: deadlineData.deadlineDate,
        deadlineType: deadlineData.deadlineType,
        priority: deadlineData.priority || 'medium' as any,
        status: 'pending' as any,
        notificationDaysBefore: deadlineData.notificationDaysBefore || [7, 3, 1],
        assignedTo: deadlineData.assignedTo,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveCaseDeadlineToDatabase(deadline);

      logger.info('Case deadline added', { caseId, deadlineId, deadlineDate: deadline.deadlineDate, userId });
      return deadline;

    } catch (error) {
      logger.error('Add case deadline error:', error);
      throw new Error('Failed to add case deadline');
    }
  }

  /**
   * Add time entry to case
   * Validates: Requirements - Time tracking for billing
   */
  async addTimeEntry(caseId: string, timeData: CreateTimeEntryRequest, userId: string): Promise<CaseTimeEntry> {
    try {
      // Check case access
      const hasAccess = await this.checkCaseAccess(caseId, userId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const entryId = uuidv4();
      
      // Calculate duration if not provided
      let durationMinutes = timeData.durationMinutes;
      if (!durationMinutes && timeData.endTime) {
        durationMinutes = Math.round((timeData.endTime.getTime() - timeData.startTime.getTime()) / (1000 * 60));
      }

      // Calculate total amount if billable
      let totalAmount: number | undefined;
      if (timeData.isBillable && timeData.hourlyRate && durationMinutes) {
        totalAmount = (durationMinutes / 60) * timeData.hourlyRate;
      }

      const timeEntry: CaseTimeEntry = {
        id: entryId,
        caseId,
        lawyerId: userId,
        startTime: timeData.startTime,
        endTime: timeData.endTime,
        durationMinutes,
        activityType: timeData.activityType,
        description: timeData.description,
        isBillable: timeData.isBillable || true,
        hourlyRate: timeData.hourlyRate,
        totalAmount,
        status: 'draft' as any,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveTimeEntryToDatabase(timeEntry);

      logger.info('Time entry added', { caseId, entryId, durationMinutes, userId });
      return timeEntry;

    } catch (error) {
      logger.error('Add time entry error:', error);
      throw new Error('Failed to add time entry');
    }
  }

  /**
   * Get case statistics for a lawyer
   * Validates: Requirements 5.5 - Reporting and statistics
   */
  async getCaseStatistics(lawyerId: string, startDate?: Date, endDate?: Date): Promise<CaseStatistics> {
    try {
      // Use database function for statistics
      const result = await db.query(
        'SELECT * FROM get_case_statistics($1, $2, $3)',
        [lawyerId, startDate, endDate]
      );

      const stats = (result as any).rows[0];

      // Get additional statistics
      const casesByStatus = await this.getCasesByStatus(lawyerId);
      const casesByDomain = await this.getCasesByDomain(lawyerId);
      const upcomingDeadlines = await this.getUpcomingDeadlines(lawyerId);
      const recentActivity = await this.getRecentCaseActivity(lawyerId);

      return {
        totalCases: parseInt(stats.total_cases),
        openCases: parseInt(stats.open_cases),
        closedCases: parseInt(stats.closed_cases),
        totalBillableHours: parseFloat(stats.total_billable_hours),
        totalRevenue: parseFloat(stats.total_revenue),
        averageCaseDuration: parseFloat(stats.avg_case_duration),
        casesByStatus,
        casesByDomain,
        upcomingDeadlines,
        recentActivity
      };

    } catch (error) {
      logger.error('Get case statistics error:', error);
      throw new Error('Failed to retrieve case statistics');
    }
  }

  // Private helper methods
  private async generateCaseNumber(organizationId?: string): Promise<string> {
    try {
      const result = await db.query(
        'SELECT generate_case_number($1) as case_number',
        [organizationId]
      );
      return (result as any).rows[0].case_number;
    } catch (error) {
      // Fallback to simple numbering
      const timestamp = Date.now().toString().slice(-6);
      return `CASE-${timestamp}`;
    }
  }

  private async checkCaseAccess(caseId: string, userId: string): Promise<boolean> {
    const result = await db.query(
      'SELECT id FROM cases WHERE id = $1 AND (assigned_lawyer_id = $2 OR supervising_lawyer_id = $2)',
      [caseId, userId]
    );
    return result && (result as any).rows.length > 0;
  }

  private async saveClientToDatabase(client: Client): Promise<void> {
    await db.query(
      `INSERT INTO clients (
        id, type, first_name, last_name, company_name, email, phone, address, city, country,
        notes, created_by, organization_id, created_at, updated_at, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        client.id, client.type, client.firstName, client.lastName, client.companyName,
        client.email, client.phone, client.address, client.city, client.country,
        client.notes, client.createdBy, client.organizationId, client.createdAt,
        client.updatedAt, client.isActive
      ]
    );
  }

  private async saveCaseToDatabase(caseData: Case): Promise<void> {
    await db.query(
      `INSERT INTO cases (
        id, case_number, title, description, legal_domain, case_type, urgency_level,
        client_id, opposing_party, court_id, status, opened_date, estimated_value,
        currency, fee_arrangement, hourly_rate, fixed_fee, assigned_lawyer_id,
        organization_id, created_at, updated_at, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
      [
        caseData.id, caseData.caseNumber, caseData.title, caseData.description,
        caseData.legalDomain, caseData.caseType, caseData.urgencyLevel,
        caseData.clientId, caseData.opposingParty, caseData.courtId,
        caseData.status, caseData.openedDate, caseData.estimatedValue,
        caseData.currency, caseData.feeArrangement, caseData.hourlyRate,
        caseData.fixedFee, caseData.assignedLawyerId, caseData.organizationId,
        caseData.createdAt, caseData.updatedAt, caseData.isActive
      ]
    );
  }

  private async saveCaseEventToDatabase(event: CaseEvent): Promise<void> {
    await db.query(
      `INSERT INTO case_events (
        id, case_id, event_type, title, description, event_date, duration_minutes,
        location, participants, status, reminder_date, is_billable, created_by,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        event.id, event.caseId, event.eventType, event.title, event.description,
        event.eventDate, event.durationMinutes, event.location,
        JSON.stringify(event.participants), event.status, event.reminderDate,
        event.isBillable, event.createdBy, event.createdAt, event.updatedAt
      ]
    );
  }

  private async saveCaseNoteToDatabase(note: CaseNote): Promise<void> {
    await db.query(
      `INSERT INTO case_notes (
        id, case_id, title, content, note_type, is_confidential, created_by,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        note.id, note.caseId, note.title, note.content, note.noteType,
        note.isConfidential, note.createdBy, note.createdAt, note.updatedAt
      ]
    );
  }

  private async saveCaseDeadlineToDatabase(deadline: CaseDeadline): Promise<void> {
    await db.query(
      `INSERT INTO case_deadlines (
        id, case_id, title, description, deadline_date, deadline_type, priority,
        status, notification_days_before, assigned_to, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        deadline.id, deadline.caseId, deadline.title, deadline.description,
        deadline.deadlineDate, deadline.deadlineType, deadline.priority,
        deadline.status, deadline.notificationDaysBefore, deadline.assignedTo,
        deadline.createdBy, deadline.createdAt, deadline.updatedAt
      ]
    );
  }

  private async saveTimeEntryToDatabase(timeEntry: CaseTimeEntry): Promise<void> {
    await db.query(
      `INSERT INTO case_time_entries (
        id, case_id, lawyer_id, start_time, end_time, duration_minutes,
        activity_type, description, is_billable, hourly_rate, total_amount,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        timeEntry.id, timeEntry.caseId, timeEntry.lawyerId, timeEntry.startTime,
        timeEntry.endTime, timeEntry.durationMinutes, timeEntry.activityType,
        timeEntry.description, timeEntry.isBillable, timeEntry.hourlyRate,
        timeEntry.totalAmount, timeEntry.status, timeEntry.createdAt, timeEntry.updatedAt
      ]
    );
  }

  private mapRowToCase(row: any): Case {
    return {
      id: row.id,
      caseNumber: row.case_number,
      title: row.title,
      description: row.description,
      legalDomain: row.legal_domain,
      caseType: row.case_type,
      urgencyLevel: row.urgency_level,
      clientId: row.client_id,
      opposingParty: row.opposing_party,
      opposingCounsel: row.opposing_counsel,
      courtId: row.court_id,
      courtName: row.court_name,
      judgeName: row.judge_name,
      caseReference: row.case_reference,
      status: row.status,
      openedDate: new Date(row.opened_date),
      closedDate: row.closed_date ? new Date(row.closed_date) : undefined,
      nextHearingDate: row.next_hearing_date ? new Date(row.next_hearing_date) : undefined,
      statuteLimitationsDate: row.statute_limitations_date ? new Date(row.statute_limitations_date) : undefined,
      estimatedValue: row.estimated_value,
      currency: row.currency,
      feeArrangement: row.fee_arrangement,
      hourlyRate: row.hourly_rate,
      fixedFee: row.fixed_fee,
      contingencyPercentage: row.contingency_percentage,
      assignedLawyerId: row.assigned_lawyer_id,
      supervisingLawyerId: row.supervising_lawyer_id,
      organizationId: row.organization_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isActive: row.is_active,
      client: row.client_first_name ? {
        id: row.client_id,
        type: row.client_type,
        firstName: row.client_first_name,
        lastName: row.client_last_name,
        companyName: row.client_company_name
      } as any : undefined
    };
  }

  // Additional helper methods for loading related data
  private async getCaseDocuments(caseId: string): Promise<CaseDocument[]> {
    const result = await db.query(
      'SELECT * FROM case_documents WHERE case_id = $1 ORDER BY added_at DESC',
      [caseId]
    );
    return (result as any).rows.map((row: any) => ({
      id: row.id,
      caseId: row.case_id,
      documentId: row.document_id,
      documentRole: row.document_role,
      addedBy: row.added_by,
      addedAt: new Date(row.added_at),
      notes: row.notes
    }));
  }

  private async getCaseEvents(caseId: string): Promise<CaseEvent[]> {
    const result = await db.query(
      'SELECT * FROM case_events WHERE case_id = $1 ORDER BY event_date DESC',
      [caseId]
    );
    return (result as any).rows.map((row: any) => ({
      id: row.id,
      caseId: row.case_id,
      eventType: row.event_type,
      title: row.title,
      description: row.description,
      eventDate: new Date(row.event_date),
      durationMinutes: row.duration_minutes,
      location: row.location,
      participants: JSON.parse(row.participants || '[]'),
      status: row.status,
      reminderDate: row.reminder_date ? new Date(row.reminder_date) : undefined,
      isBillable: row.is_billable,
      billableHours: row.billable_hours,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  private async getCaseNotes(caseId: string): Promise<CaseNote[]> {
    const result = await db.query(
      'SELECT * FROM case_notes WHERE case_id = $1 ORDER BY created_at DESC',
      [caseId]
    );
    return (result as any).rows.map((row: any) => ({
      id: row.id,
      caseId: row.case_id,
      title: row.title,
      content: row.content,
      noteType: row.note_type,
      isConfidential: row.is_confidential,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  private async getCaseContacts(caseId: string): Promise<CaseContact[]> {
    const result = await db.query(
      'SELECT * FROM case_contacts WHERE case_id = $1 ORDER BY created_at DESC',
      [caseId]
    );
    return (result as any).rows.map((row: any) => ({
      id: row.id,
      caseId: row.case_id,
      contactType: row.contact_type,
      firstName: row.first_name,
      lastName: row.last_name,
      company: row.company,
      title: row.title,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      address: row.address,
      notes: row.notes,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  private async getCaseDeadlines(caseId: string): Promise<CaseDeadline[]> {
    const result = await db.query(
      'SELECT * FROM case_deadlines WHERE case_id = $1 ORDER BY deadline_date ASC',
      [caseId]
    );
    return (result as any).rows.map((row: any) => ({
      id: row.id,
      caseId: row.case_id,
      title: row.title,
      description: row.description,
      deadlineDate: new Date(row.deadline_date),
      deadlineType: row.deadline_type,
      priority: row.priority,
      status: row.status,
      completedDate: row.completed_date ? new Date(row.completed_date) : undefined,
      notificationDaysBefore: row.notification_days_before,
      lastNotificationSent: row.last_notification_sent ? new Date(row.last_notification_sent) : undefined,
      assignedTo: row.assigned_to,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  private async getCaseTimeEntries(caseId: string): Promise<CaseTimeEntry[]> {
    const result = await db.query(
      'SELECT * FROM case_time_entries WHERE case_id = $1 ORDER BY start_time DESC',
      [caseId]
    );
    return (result as any).rows.map((row: any) => ({
      id: row.id,
      caseId: row.case_id,
      lawyerId: row.lawyer_id,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      durationMinutes: row.duration_minutes,
      activityType: row.activity_type,
      description: row.description,
      isBillable: row.is_billable,
      hourlyRate: row.hourly_rate,
      totalAmount: row.total_amount,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  private async getCaseExpenses(caseId: string): Promise<CaseExpense[]> {
    const result = await db.query(
      'SELECT * FROM case_expenses WHERE case_id = $1 ORDER BY expense_date DESC',
      [caseId]
    );
    return (result as any).rows.map((row: any) => ({
      id: row.id,
      caseId: row.case_id,
      expenseType: row.expense_type,
      description: row.description,
      amount: row.amount,
      currency: row.currency,
      expenseDate: new Date(row.expense_date),
      receiptNumber: row.receipt_number,
      vendor: row.vendor,
      status: row.status,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  private async getCasesByStatus(lawyerId: string): Promise<Record<CaseStatus, number>> {
    const result = await db.query(
      `SELECT status, COUNT(*) as count
       FROM cases 
       WHERE assigned_lawyer_id = $1 AND is_active = true
       GROUP BY status`,
      [lawyerId]
    );

    const statusCounts: Record<CaseStatus, number> = {
      [CaseStatus.OPEN]: 0,
      [CaseStatus.IN_PROGRESS]: 0,
      [CaseStatus.PENDING]: 0,
      [CaseStatus.CLOSED]: 0,
      [CaseStatus.ARCHIVED]: 0,
      [CaseStatus.CANCELLED]: 0
    };

    (result as any).rows.forEach((row: any) => {
      statusCounts[row.status as CaseStatus] = parseInt(row.count);
    });

    return statusCounts;
  }

  private async getCasesByDomain(lawyerId: string): Promise<Record<string, number>> {
    const result = await db.query(
      `SELECT legal_domain, COUNT(*) as count
       FROM cases 
       WHERE assigned_lawyer_id = $1 AND is_active = true
       GROUP BY legal_domain`,
      [lawyerId]
    );

    const domainCounts: Record<string, number> = {};
    (result as any).rows.forEach((row: any) => {
      domainCounts[row.legal_domain] = parseInt(row.count);
    });

    return domainCounts;
  }

  private async getUpcomingDeadlines(lawyerId: string): Promise<CaseDeadline[]> {
    const result = await db.query(
      `SELECT cd.*, c.title as case_title
       FROM case_deadlines cd
       JOIN cases c ON cd.case_id = c.id
       WHERE c.assigned_lawyer_id = $1 
       AND cd.status = 'pending'
       AND cd.deadline_date > CURRENT_TIMESTAMP
       ORDER BY cd.deadline_date ASC
       LIMIT 10`,
      [lawyerId]
    );

    return (result as any).rows.map((row: any) => ({
      id: row.id,
      caseId: row.case_id,
      title: row.title,
      description: row.description,
      deadlineDate: new Date(row.deadline_date),
      deadlineType: row.deadline_type,
      priority: row.priority,
      status: row.status,
      completedDate: row.completed_date ? new Date(row.completed_date) : undefined,
      notificationDaysBefore: row.notification_days_before,
      lastNotificationSent: row.last_notification_sent ? new Date(row.last_notification_sent) : undefined,
      assignedTo: row.assigned_to,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  private async getRecentCaseActivity(lawyerId: string): Promise<any[]> {
    // This would typically come from an activity log table
    // For now, return recent case events
    const result = await db.query(
      `SELECT ce.*, c.title as case_title
       FROM case_events ce
       JOIN cases c ON ce.case_id = c.id
       WHERE c.assigned_lawyer_id = $1
       ORDER BY ce.created_at DESC
       LIMIT 10`,
      [lawyerId]
    );

    return (result as any).rows.map((row: any) => ({
      id: row.id,
      caseId: row.case_id,
      caseTitle: row.case_title,
      activityType: row.event_type,
      description: row.title,
      timestamp: new Date(row.created_at),
      userId: row.created_by,
      userName: 'User' // Would need to join with users table
    }));
  }
}

export const caseManagementService = new CaseManagementService();