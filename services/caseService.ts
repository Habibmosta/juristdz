import { Case } from '../types';

/**
 * Service for managing legal cases/dossiers
 * Handles CRUD operations for case management
 */
class CaseService {
  private cases: Case[] = [];
  private nextId = 1;

  constructor() {
    // Initialize with some mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    const mockCases: Case[] = [
      {
        id: '1',
        title: 'Affaire Benali vs. Société SARL',
        clientName: 'M. Ahmed Benali',
        clientPhone: '+213 555 123 456',
        clientEmail: 'ahmed.benali@email.com',
        clientAddress: '15 Rue Didouche Mourad, Alger',
        description: 'Litige commercial concernant un contrat de fourniture non respecté. Le client réclame des dommages-intérêts.',
        caseType: 'Droit Commercial',
        priority: 'high',
        estimatedValue: 2500000,
        deadline: new Date('2024-03-15'),
        createdAt: new Date('2024-01-15'),
        lastUpdated: new Date('2024-02-01'),
        status: 'active',
        notes: 'Client très préoccupé par les délais. Prévoir une médiation avant procès.',
        tags: ['commercial', 'contrat', 'fourniture'],
        assignedLawyer: 'Maître Dupont'
      },
      {
        id: '2',
        title: 'Divorce contentieux Mme Khadija',
        clientName: 'Mme Khadija Mansouri',
        clientPhone: '+213 555 987 654',
        clientEmail: 'khadija.mansouri@email.com',
        clientAddress: '42 Boulevard Mohamed V, Oran',
        description: 'Procédure de divorce contentieux avec demande de garde des enfants et pension alimentaire.',
        caseType: 'Droit de la Famille',
        priority: 'medium',
        estimatedValue: 500000,
        deadline: new Date('2024-03-20'),
        createdAt: new Date('2024-02-01'),
        lastUpdated: new Date('2024-02-10'),
        status: 'active',
        notes: 'Situation familiale complexe. Enfants mineurs impliqués.',
        tags: ['famille', 'divorce', 'garde'],
        assignedLawyer: 'Maître Martin'
      },
      {
        id: '3',
        title: 'Succession M. Brahim',
        clientName: 'Famille Brahim',
        clientPhone: '+213 555 456 789',
        clientEmail: 'famille.brahim@email.com',
        clientAddress: '8 Rue Larbi Ben M\'hidi, Constantine',
        description: 'Règlement de succession avec biens immobiliers et mobiliers. Plusieurs héritiers.',
        caseType: 'Droit Civil',
        priority: 'low',
        estimatedValue: 15000000,
        deadline: new Date('2024-04-30'),
        createdAt: new Date('2024-01-20'),
        lastUpdated: new Date('2024-02-05'),
        status: 'active',
        notes: 'Inventaire des biens en cours. Attendre expertise immobilière.',
        tags: ['succession', 'immobilier', 'héritage'],
        assignedLawyer: 'Maître Dubois'
      }
    ];

    this.cases = mockCases;
    this.nextId = mockCases.length + 1;
  }

  /**
   * Get all cases
   */
  getAllCases(): Case[] {
    return [...this.cases].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get active cases only
   */
  getActiveCases(): Case[] {
    return this.cases
      .filter(case_ => case_.status === 'active')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get cases by priority
   */
  getCasesByPriority(priority: 'low' | 'medium' | 'high' | 'urgent'): Case[] {
    return this.cases
      .filter(case_ => case_.priority === priority)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get cases with upcoming deadlines
   */
  getUpcomingDeadlines(days: number = 7): Case[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return this.cases
      .filter(case_ => 
        case_.deadline && 
        case_.deadline >= now && 
        case_.deadline <= futureDate &&
        case_.status === 'active'
      )
      .sort((a, b) => (a.deadline?.getTime() || 0) - (b.deadline?.getTime() || 0));
  }

  /**
   * Get case by ID
   */
  getCaseById(id: string): Case | null {
    return this.cases.find(case_ => case_.id === id) || null;
  }

  /**
   * Create a new case
   */
  async createCase(caseData: Partial<Case>): Promise<Case> {
    const newCase: Case = {
      id: this.nextId.toString(),
      title: caseData.title || '',
      clientName: caseData.clientName || '',
      description: caseData.description || '',
      createdAt: new Date(),
      lastUpdated: new Date(),
      status: 'active',
      ...caseData
    };

    this.cases.push(newCase);
    this.nextId++;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return newCase;
  }

  /**
   * Update an existing case
   */
  async updateCase(id: string, updates: Partial<Case>): Promise<Case | null> {
    const caseIndex = this.cases.findIndex(case_ => case_.id === id);
    
    if (caseIndex === -1) {
      return null;
    }

    this.cases[caseIndex] = {
      ...this.cases[caseIndex],
      ...updates,
      lastUpdated: new Date()
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return this.cases[caseIndex];
  }

  /**
   * Delete a case (archive it)
   */
  async deleteCase(id: string): Promise<boolean> {
    const caseIndex = this.cases.findIndex(case_ => case_.id === id);
    
    if (caseIndex === -1) {
      return false;
    }

    // Instead of deleting, we archive the case
    this.cases[caseIndex].status = 'archived';
    this.cases[caseIndex].lastUpdated = new Date();

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return true;
  }

  /**
   * Search cases by title, client name, or description
   */
  searchCases(query: string): Case[] {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
      return this.getAllCases();
    }

    return this.cases.filter(case_ =>
      case_.title.toLowerCase().includes(searchTerm) ||
      case_.clientName.toLowerCase().includes(searchTerm) ||
      case_.description.toLowerCase().includes(searchTerm) ||
      case_.caseType?.toLowerCase().includes(searchTerm) ||
      case_.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get case statistics
   */
  getCaseStatistics() {
    const activeCases = this.getActiveCases();
    const upcomingDeadlines = this.getUpcomingDeadlines();
    const highPriorityCases = this.getCasesByPriority('high');
    const urgentCases = this.getCasesByPriority('urgent');

    const totalEstimatedValue = activeCases.reduce((sum, case_) => 
      sum + (case_.estimatedValue || 0), 0
    );

    return {
      totalCases: this.cases.length,
      activeCases: activeCases.length,
      archivedCases: this.cases.filter(c => c.status === 'archived').length,
      upcomingDeadlines: upcomingDeadlines.length,
      highPriorityCases: highPriorityCases.length,
      urgentCases: urgentCases.length,
      totalEstimatedValue,
      averageEstimatedValue: activeCases.length > 0 ? totalEstimatedValue / activeCases.length : 0
    };
  }

  /**
   * Get cases grouped by type
   */
  getCasesByType(): Record<string, Case[]> {
    const grouped: Record<string, Case[]> = {};
    
    this.cases.forEach(case_ => {
      const type = case_.caseType || 'Non classé';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(case_);
    });

    return grouped;
  }

  /**
   * Export cases data (for backup or reporting)
   */
  exportCases(): string {
    return JSON.stringify(this.cases, null, 2);
  }

  /**
   * Import cases data (for restore or migration)
   */
  importCases(data: string): boolean {
    try {
      const importedCases = JSON.parse(data) as Case[];
      
      // Validate the data structure
      if (!Array.isArray(importedCases)) {
        return false;
      }

      // Basic validation of case objects
      const isValid = importedCases.every(case_ => 
        case_.id && case_.title && case_.clientName && case_.description
      );

      if (!isValid) {
        return false;
      }

      this.cases = importedCases;
      this.nextId = Math.max(...importedCases.map(c => parseInt(c.id))) + 1;
      
      return true;
    } catch (error) {
      console.error('Error importing cases:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
export const caseService = new CaseService();