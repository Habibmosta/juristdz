import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { caseManagementService } from '@/services/caseManagementService';
import { db } from '@/database/connection';
import {
  Case,
  Client,
  ClientType,
  CaseStatus,
  UrgencyLevel,
  FeeArrangement,
  EventType,
  NoteType,
  DeadlineType,
  Priority,
  ActivityType,
  CreateClientRequest,
  CreateCaseRequest,
  UpdateCaseRequest,
  CreateCaseEventRequest,
  CreateCaseNoteRequest,
  CreateCaseDeadlineRequest,
  CreateTimeEntryRequest,
  CaseSearchCriteria
} from '@/types/case';
import { LegalDomain } from '@/types/search';

// Mock database
jest.mock('@/database/connection');
const mockDb = db as jest.Mocked<typeof db>;

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('CaseManagementService', () => {
  const mockUserId = 'lawyer-123';
  const mockOrgId = 'org-456';
  const mockClientId = 'client-789';
  const mockCaseId = 'case-101';

  const mockClient: Client = {
    id: mockClientId,
    type: ClientType.INDIVIDUAL,
    firstName: 'Ahmed',
    lastName: 'Benali',
    email: 'ahmed.benali@email.com',
    phone: '+213555123456',
    address: '123 Rue Didouche Mourad',
    city: 'Alger',
    country: 'Algeria',
    createdBy: mockUserId,
    organizationId: mockOrgId,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };

  const mockCase: Case = {
    id: mockCaseId,
    caseNumber: '2024-ORG-0001',
    title: 'Affaire Benali vs. Société XYZ',
    description: 'Litige commercial concernant un contrat de fourniture',
    legalDomain: LegalDomain.COMMERCIAL,
    caseType: 'Litige contractuel',
    urgencyLevel: UrgencyLevel.NORMAL,
    clientId: mockClientId,
    opposingParty: 'Société XYZ SARL',
    status: CaseStatus.OPEN,
    openedDate: new Date(),
    estimatedValue: 500000,
    currency: 'DZD',
    feeArrangement: FeeArrangement.HOURLY,
    hourlyRate: 15000,
    assignedLawyerId: mockUserId,
    organizationId: mockOrgId,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createClient', () => {
    it('should create an individual client successfully', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // saveClientToDatabase

      const clientData: CreateClientRequest = {
        type: ClientType.INDIVIDUAL,
        firstName: 'Ahmed',
        lastName: 'Benali',
        email: 'ahmed.benali@email.com',
        phone: '+213555123456',
        address: '123 Rue Didouche Mourad',
        city: 'Alger'
      };

      const result = await caseManagementService.createClient(
        clientData,
        mockUserId,
        mockOrgId
      );

      expect(result).toBeDefined();
      expect(result.type).toBe(ClientType.INDIVIDUAL);
      expect(result.firstName).toBe('Ahmed');
      expect(result.lastName).toBe('Benali');
      expect(result.email).toBe('ahmed.benali@email.com');
      expect(result.createdBy).toBe(mockUserId);
      expect(result.organizationId).toBe(mockOrgId);
    });

    it('should create a company client successfully', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // saveClientToDatabase

      const clientData: CreateClientRequest = {
        type: ClientType.COMPANY,
        companyName: 'Entreprise Algérienne SARL',
        email: 'contact@entreprise-dz.com',
        phone: '+213555789012',
        address: '789 Zone Industrielle',
        city: 'Constantine'
      };

      const result = await caseManagementService.createClient(
        clientData,
        mockUserId,
        mockOrgId
      );

      expect(result).toBeDefined();
      expect(result.type).toBe(ClientType.COMPANY);
      expect(result.companyName).toBe('Entreprise Algérienne SARL');
      expect(result.email).toBe('contact@entreprise-dz.com');
      expect(result.createdBy).toBe(mockUserId);
    });
  });

  describe('createCase', () => {
    it('should create a case successfully', async () => {
      // Mock case number generation
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ case_number: '2024-ORG-0001' }] }) // generateCaseNumber
        .mockResolvedValueOnce({ rows: [] }); // saveCaseToDatabase

      const caseData: CreateCaseRequest = {
        title: 'Affaire Benali vs. Société XYZ',
        description: 'Litige commercial concernant un contrat de fourniture',
        legalDomain: LegalDomain.COMMERCIAL,
        caseType: 'Litige contractuel',
        urgencyLevel: UrgencyLevel.NORMAL,
        clientId: mockClientId,
        opposingParty: 'Société XYZ SARL',
        estimatedValue: 500000,
        feeArrangement: FeeArrangement.HOURLY,
        hourlyRate: 15000
      };

      const result = await caseManagementService.createCase(
        caseData,
        mockUserId,
        mockOrgId
      );

      expect(result).toBeDefined();
      expect(result.title).toBe(caseData.title);
      expect(result.legalDomain).toBe(caseData.legalDomain);
      expect(result.caseType).toBe(caseData.caseType);
      expect(result.clientId).toBe(caseData.clientId);
      expect(result.assignedLawyerId).toBe(mockUserId);
      expect(result.status).toBe(CaseStatus.OPEN);
      expect(result.caseNumber).toBe('2024-ORG-0001');
    });

    it('should set default values for optional fields', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ case_number: '2024-ORG-0002' }] })
        .mockResolvedValueOnce({ rows: [] });

      const caseData: CreateCaseRequest = {
        title: 'Simple Case',
        legalDomain: LegalDomain.CIVIL,
        caseType: 'General',
        clientId: mockClientId
      };

      const result = await caseManagementService.createCase(
        caseData,
        mockUserId,
        mockOrgId
      );

      expect(result.urgencyLevel).toBe(UrgencyLevel.NORMAL);
      expect(result.currency).toBe('DZD');
      expect(result.status).toBe(CaseStatus.OPEN);
      expect(result.isActive).toBe(true);
    });
  });

  describe('getCase', () => {
    it('should retrieve case with full details', async () => {
      const mockCaseRow = {
        id: mockCaseId,
        case_number: '2024-ORG-0001',
        title: 'Affaire Benali vs. Société XYZ',
        description: 'Litige commercial',
        legal_domain: LegalDomain.COMMERCIAL,
        case_type: 'Litige contractuel',
        urgency_level: UrgencyLevel.NORMAL,
        client_id: mockClientId,
        opposing_party: 'Société XYZ SARL',
        status: CaseStatus.OPEN,
        opened_date: new Date(),
        estimated_value: 500000,
        currency: 'DZD',
        fee_arrangement: FeeArrangement.HOURLY,
        hourly_rate: 15000,
        assigned_lawyer_id: mockUserId,
        organization_id: mockOrgId,
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        client_first_name: 'Ahmed',
        client_last_name: 'Benali',
        client_type: ClientType.INDIVIDUAL
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: mockCaseId }] }) // checkCaseAccess
        .mockResolvedValueOnce({ rows: [mockCaseRow] }) // getCase main query
        .mockResolvedValueOnce({ rows: [] }) // getCaseDocuments
        .mockResolvedValueOnce({ rows: [] }) // getCaseEvents
        .mockResolvedValueOnce({ rows: [] }) // getCaseNotes
        .mockResolvedValueOnce({ rows: [] }) // getCaseContacts
        .mockResolvedValueOnce({ rows: [] }) // getCaseDeadlines
        .mockResolvedValueOnce({ rows: [] }) // getCaseTimeEntries
        .mockResolvedValueOnce({ rows: [] }); // getCaseExpenses

      const result = await caseManagementService.getCase(mockCaseId, mockUserId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockCaseId);
      expect(result?.title).toBe('Affaire Benali vs. Société XYZ');
      expect(result?.assignedLawyerId).toBe(mockUserId);
      expect(result?.client?.firstName).toBe('Ahmed');
      expect(result?.documents).toBeDefined();
      expect(result?.events).toBeDefined();
      expect(result?.notes).toBeDefined();
    });

    it('should return null when case is not found', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: mockCaseId }] }) // checkCaseAccess
        .mockResolvedValueOnce({ rows: [] }); // getCase returns empty

      const result = await caseManagementService.getCase('non-existent-case', mockUserId);

      expect(result).toBeNull();
    });

    it('should throw error when user has no access to case', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // checkCaseAccess returns empty

      await expect(
        caseManagementService.getCase(mockCaseId, 'unauthorized-user')
      ).rejects.toThrow('Access denied');
    });
  });

  describe('updateCase', () => {
    it('should update case successfully', async () => {
      const updates: UpdateCaseRequest = {
        title: 'Updated Case Title',
        status: CaseStatus.IN_PROGRESS,
        urgencyLevel: UrgencyLevel.HIGH,
        opposingCounsel: 'Maître Dupont'
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: mockCaseId }] }) // checkCaseAccess
        .mockResolvedValueOnce({ rows: [] }) // update query
        .mockResolvedValueOnce({ rows: [{ id: mockCaseId }] }) // checkCaseAccess for getCase
        .mockResolvedValueOnce({ rows: [{ ...mockCase, title: updates.title, status: updates.status }] }) // getCase
        .mockResolvedValueOnce({ rows: [] }) // getCaseDocuments
        .mockResolvedValueOnce({ rows: [] }) // getCaseEvents
        .mockResolvedValueOnce({ rows: [] }) // getCaseNotes
        .mockResolvedValueOnce({ rows: [] }) // getCaseContacts
        .mockResolvedValueOnce({ rows: [] }) // getCaseDeadlines
        .mockResolvedValueOnce({ rows: [] }) // getCaseTimeEntries
        .mockResolvedValueOnce({ rows: [] }); // getCaseExpenses

      const result = await caseManagementService.updateCase(mockCaseId, updates, mockUserId);

      expect(result).toBeDefined();
      expect(result.title).toBe(updates.title);
      expect(result.status).toBe(updates.status);
    });

    it('should throw error when no fields to update', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: mockCaseId }] }); // checkCaseAccess

      await expect(
        caseManagementService.updateCase(mockCaseId, {}, mockUserId)
      ).rejects.toThrow('No fields to update');
    });
  });

  describe('searchCases', () => {
    it('should search cases with basic criteria', async () => {
      const mockSearchResults = [
        { ...mockCase, rank: 0.8 },
        { ...mockCase, id: 'case-456', rank: 0.6 }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: mockSearchResults }) // search query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // count query

      const criteria: CaseSearchCriteria = {
        query: 'Benali',
        status: CaseStatus.OPEN,
        legalDomain: LegalDomain.COMMERCIAL,
        limit: 10,
        offset: 0
      };

      const result = await caseManagementService.searchCases(criteria, mockUserId);

      expect(result).toBeDefined();
      expect(result.cases).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.searchTime).toBeGreaterThan(0);
    });

    it('should search cases with date range filter', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const criteria: CaseSearchCriteria = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31')
        }
      };

      const result = await caseManagementService.searchCases(criteria, mockUserId);

      expect(result).toBeDefined();
      expect(result.cases).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('associateDocumentWithCase', () => {
    it('should associate document with case successfully', async () => {
      const documentId = 'doc-123';
      const documentRole = 'evidence';
      const notes = 'Important evidence document';

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: mockCaseId }] }) // checkCaseAccess
        .mockResolvedValueOnce({ rows: [] }); // insert association

      const result = await caseManagementService.associateDocumentWithCase(
        mockCaseId,
        documentId,
        documentRole,
        mockUserId,
        notes
      );

      expect(result).toBeDefined();
      expect(result.caseId).toBe(mockCaseId);
      expect(result.documentId).toBe(documentId);
      expect(result.documentRole).toBe(documentRole);
      expect(result.notes).toBe(notes);
      expect(result.addedBy).toBe(mockUserId);
    });
  });

  describe('addCaseEvent', () => {
    it('should add case event successfully', async () => {
      const eventData: CreateCaseEventRequest = {
        eventType: EventType.HEARING,
        title: 'Audience préliminaire',
        description: 'Première audience devant le tribunal',
        eventDate: new Date('2024-03-15T10:00:00Z'),
        location: 'Tribunal de Commerce d\'Alger',
        isBillable: false
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: mockCaseId }] }) // checkCaseAccess
        .mockResolvedValueOnce({ rows: [] }); // saveCaseEventToDatabase

      const result = await caseManagementService.addCaseEvent(mockCaseId, eventData, mockUserId);

      expect(result).toBeDefined();
      expect(result.caseId).toBe(mockCaseId);
      expect(result.eventType).toBe(EventType.HEARING);
      expect(result.title).toBe(eventData.title);
      expect(result.eventDate).toEqual(eventData.eventDate);
      expect(result.createdBy).toBe(mockUserId);
    });
  });

  describe('addCaseNote', () => {
    it('should add case note successfully', async () => {
      const noteData: CreateCaseNoteRequest = {
        title: 'Stratégie de défense',
        content: 'Points clés à développer lors de l\'audience',
        noteType: NoteType.STRATEGY,
        isConfidential: true
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: mockCaseId }] }) // checkCaseAccess
        .mockResolvedValueOnce({ rows: [] }); // saveCaseNoteToDatabase

      const result = await caseManagementService.addCaseNote(mockCaseId, noteData, mockUserId);

      expect(result).toBeDefined();
      expect(result.caseId).toBe(mockCaseId);
      expect(result.title).toBe(noteData.title);
      expect(result.content).toBe(noteData.content);
      expect(result.noteType).toBe(NoteType.STRATEGY);
      expect(result.isConfidential).toBe(true);
      expect(result.createdBy).toBe(mockUserId);
    });
  });

  describe('addCaseDeadline', () => {
    it('should add case deadline successfully', async () => {
      const deadlineData: CreateCaseDeadlineRequest = {
        title: 'Dépôt des conclusions',
        description: 'Date limite pour déposer les conclusions écrites',
        deadlineDate: new Date('2024-04-01T17:00:00Z'),
        deadlineType: DeadlineType.FILING,
        priority: Priority.HIGH,
        notificationDaysBefore: [7, 3, 1]
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: mockCaseId }] }) // checkCaseAccess
        .mockResolvedValueOnce({ rows: [] }); // saveCaseDeadlineToDatabase

      const result = await caseManagementService.addCaseDeadline(mockCaseId, deadlineData, mockUserId);

      expect(result).toBeDefined();
      expect(result.caseId).toBe(mockCaseId);
      expect(result.title).toBe(deadlineData.title);
      expect(result.deadlineDate).toEqual(deadlineData.deadlineDate);
      expect(result.deadlineType).toBe(DeadlineType.FILING);
      expect(result.priority).toBe(Priority.HIGH);
      expect(result.notificationDaysBefore).toEqual([7, 3, 1]);
      expect(result.createdBy).toBe(mockUserId);
    });
  });

  describe('addTimeEntry', () => {
    it('should add time entry successfully', async () => {
      const timeData: CreateTimeEntryRequest = {
        startTime: new Date('2024-02-15T09:00:00Z'),
        endTime: new Date('2024-02-15T11:30:00Z'),
        activityType: ActivityType.RESEARCH,
        description: 'Recherche jurisprudentielle sur les contrats commerciaux',
        isBillable: true,
        hourlyRate: 15000
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: mockCaseId }] }) // checkCaseAccess
        .mockResolvedValueOnce({ rows: [] }); // saveTimeEntryToDatabase

      const result = await caseManagementService.addTimeEntry(mockCaseId, timeData, mockUserId);

      expect(result).toBeDefined();
      expect(result.caseId).toBe(mockCaseId);
      expect(result.lawyerId).toBe(mockUserId);
      expect(result.startTime).toEqual(timeData.startTime);
      expect(result.endTime).toEqual(timeData.endTime);
      expect(result.activityType).toBe(ActivityType.RESEARCH);
      expect(result.isBillable).toBe(true);
      expect(result.hourlyRate).toBe(15000);
      expect(result.durationMinutes).toBe(150); // 2.5 hours
      expect(result.totalAmount).toBe(37500); // 2.5 * 15000
    });

    it('should calculate duration when not provided', async () => {
      const timeData: CreateTimeEntryRequest = {
        startTime: new Date('2024-02-15T09:00:00Z'),
        endTime: new Date('2024-02-15T10:00:00Z'),
        activityType: ActivityType.DRAFTING,
        description: 'Rédaction de conclusions',
        isBillable: true,
        hourlyRate: 15000
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: mockCaseId }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await caseManagementService.addTimeEntry(mockCaseId, timeData, mockUserId);

      expect(result.durationMinutes).toBe(60); // 1 hour
      expect(result.totalAmount).toBe(15000); // 1 * 15000
    });
  });

  describe('getCaseStatistics', () => {
    it('should retrieve case statistics successfully', async () => {
      const mockStats = {
        total_cases: 25,
        open_cases: 15,
        closed_cases: 10,
        total_billable_hours: 150.5,
        total_revenue: 2257500,
        avg_case_duration: 45.2
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockStats] }) // get_case_statistics function
        .mockResolvedValueOnce({ rows: [{ status: 'open', count: '15' }, { status: 'closed', count: '10' }] }) // getCasesByStatus
        .mockResolvedValueOnce({ rows: [{ legal_domain: 'commercial', count: '12' }, { legal_domain: 'civil', count: '8' }] }) // getCasesByDomain
        .mockResolvedValueOnce({ rows: [] }) // getUpcomingDeadlines
        .mockResolvedValueOnce({ rows: [] }); // getRecentCaseActivity

      const result = await caseManagementService.getCaseStatistics(mockUserId);

      expect(result).toBeDefined();
      expect(result.totalCases).toBe(25);
      expect(result.openCases).toBe(15);
      expect(result.closedCases).toBe(10);
      expect(result.totalBillableHours).toBe(150.5);
      expect(result.totalRevenue).toBe(2257500);
      expect(result.averageCaseDuration).toBe(45.2);
      expect(result.casesByStatus).toBeDefined();
      expect(result.casesByDomain).toBeDefined();
    });
  });

  describe('getLawyerCases', () => {
    it('should retrieve lawyer cases with filters', async () => {
      const mockCases = [
        { ...mockCase, id: 'case-1' },
        { ...mockCase, id: 'case-2' }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockCases });

      const filters = {
        status: CaseStatus.OPEN,
        legalDomain: LegalDomain.COMMERCIAL,
        limit: 10
      };

      const result = await caseManagementService.getLawyerCases(mockUserId, filters);

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].assignedLawyerId).toBe(mockUserId);
    });
  });
});