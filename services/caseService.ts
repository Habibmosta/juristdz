import { Case } from '../types';
import { supabaseCaseService } from './supabaseCaseService';

/**
 * Enhanced Case Service with Supabase integration
 * Falls back to in-memory storage if Supabase is not available
 */
class CaseService {
  private cases: Case[] = [];
  private nextId = 1;
  private useSupabase = true;

  constructor() {
    // Check if Supabase is available
    this.useSupabase = supabaseCaseService.isAvailable();
    
    if (!this.useSupabase) {
      console.warn('⚠️ Supabase not available, falling back to in-memory storage');
      this.initializeMockData();
    } else {
      console.log('✅ Using Supabase for data persistence');
    }
  }

  /**
   * Get all cases
   */
  async getAllCases(): Promise<Case[]> {
    if (this.useSupabase) {
      try {
        return await supabaseCaseService.getAllCases();
      } catch (error) {
        console.error('Supabase error, falling back to local storage:', error);
        this.useSupabase = false;
        return this.getAllCasesLocal();
      }
    }
    return this.getAllCasesLocal();
  }

  /**
   * Get active cases only
   */
  async getActiveCases(): Promise<Case[]> {
    if (this.useSupabase) {
      try {
        return await supabaseCaseService.getActiveCases();
      } catch (error) {
        console.error('Supabase error, falling back to local storage:', error);
        this.useSupabase = false;
        return this.getActiveCasesLocal();
      }
    }
    return this.getActiveCasesLocal();
  }

  /**
   * Get cases by priority
   */
  async getCasesByPriority(priority: 'low' | 'medium' | 'high' | 'urgent'): Promise<Case[]> {
    if (this.useSupabase) {
      try {
        return await supabaseCaseService.getCasesByPriority(priority);
      } catch (error) {
        console.error('Supabase error, falling back to local storage:', error);
        this.useSupabase = false;
        return this.getCasesByPriorityLocal(priority);
      }
    }
    return this.getCasesByPriorityLocal(priority);
  }

  /**
   * Get cases with upcoming deadlines
   */
  async getUpcomingDeadlines(days: number = 7): Promise<Case[]> {
    if (this.useSupabase) {
      try {
        return await supabaseCaseService.getUpcomingDeadlines(days);
      } catch (error) {
        console.error('Supabase error, falling back to local storage:', error);
        this.useSupabase = false;
        return this.getUpcomingDeadlinesLocal(days);
      }
    }
    return this.getUpcomingDeadlinesLocal(days);
  }

  /**
   * Get case by ID
   */
  async getCaseById(id: string): Promise<Case | null> {
    if (this.useSupabase) {
      try {
        return await supabaseCaseService.getCaseById(id);
      } catch (error) {
        console.error('Supabase error, falling back to local storage:', error);
        this.useSupabase = false;
        return this.getCaseByIdLocal(id);
      }
    }
    return this.getCaseByIdLocal(id);
  }

  /**
   * Create a new case
   */
  async createCase(caseData: Partial<Case>): Promise<Case> {
    if (this.useSupabase) {
      try {
        const newCase = await supabaseCaseService.createCase(caseData);
        console.log('✅ Case saved to Supabase:', newCase.title);
        return newCase;
      } catch (error) {
        console.error('Supabase error, falling back to local storage:', error);
        this.useSupabase = false;
        return this.createCaseLocal(caseData);
      }
    }
    return this.createCaseLocal(caseData);
  }

  /**
   * Update an existing case
   */
  async updateCase(id: string, updates: Partial<Case>): Promise<Case | null> {
    if (this.useSupabase) {
      try {
        const updatedCase = await supabaseCaseService.updateCase(id, updates);
        if (updatedCase) {
          console.log('✅ Case updated in Supabase:', updatedCase.title);
        }
        return updatedCase;
      } catch (error) {
        console.error('Supabase error, falling back to local storage:', error);
        this.useSupabase = false;
        return this.updateCaseLocal(id, updates);
      }
    }
    return this.updateCaseLocal(id, updates);
  }

  /**
   * Delete a case (archive it)
   */
  async deleteCase(id: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const result = await supabaseCaseService.deleteCase(id);
        if (result) {
          console.log('✅ Case archived in Supabase');
        }
        return result;
      } catch (error) {
        console.error('Supabase error, falling back to local storage:', error);
        this.useSupabase = false;
        return this.deleteCaseLocal(id);
      }
    }
    return this.deleteCaseLocal(id);
  }

  /**
   * Search cases by title, client name, or description
   */
  async searchCases(query: string): Promise<Case[]> {
    if (this.useSupabase) {
      try {
        return await supabaseCaseService.searchCases(query);
      } catch (error) {
        console.error('Supabase error, falling back to local storage:', error);
        this.useSupabase = false;
        return this.searchCasesLocal(query);
      }
    }
    return this.searchCasesLocal(query);
  }

  /**
   * Get case statistics
   */
  async getCaseStatistics() {
    if (this.useSupabase) {
      try {
        return await supabaseCaseService.getCaseStatistics();
      } catch (error) {
        console.error('Supabase error, falling back to local storage:', error);
        this.useSupabase = false;
        return this.getCaseStatisticsLocal();
      }
    }
    return this.getCaseStatisticsLocal();
  }

  /**
   * Get cases grouped by type
   */
  async getCasesByType(): Promise<Record<string, Case[]>> {
    if (this.useSupabase) {
      try {
        return await supabaseCaseService.getCasesByType();
      } catch (error) {
        console.error('Supabase error, falling back to local storage:', error);
        this.useSupabase = false;
        return this.getCasesByTypeLocal();
      }
    }
    return this.getCasesByTypeLocal();
  }

  /**
   * Check if using Supabase
   */
  isUsingSupabase(): boolean {
    return this.useSupabase;
  }

  // ========================================
  // LOCAL STORAGE FALLBACK METHODS
  // ========================================

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

  private getAllCasesLocal(): Case[] {
    return [...this.cases].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private getActiveCasesLocal(): Case[] {
    return this.cases
      .filter(case_ => case_.status === 'active')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private getCasesByPriorityLocal(priority: 'low' | 'medium' | 'high' | 'urgent'): Case[] {
    return this.cases
      .filter(case_ => case_.priority === priority)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private getUpcomingDeadlinesLocal(days: number = 7): Case[] {
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

  private getCaseByIdLocal(id: string): Case | null {
    return this.cases.find(case_ => case_.id === id) || null;
  }

  private async createCaseLocal(caseData: Partial<Case>): Promise<Case> {
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

  private async updateCaseLocal(id: string, updates: Partial<Case>): Promise<Case | null> {
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

  private async deleteCaseLocal(id: string): Promise<boolean> {
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

  private searchCasesLocal(query: string): Case[] {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
      return this.getAllCasesLocal();
    }

    return this.cases.filter(case_ =>
      case_.title.toLowerCase().includes(searchTerm) ||
      case_.clientName.toLowerCase().includes(searchTerm) ||
      case_.description.toLowerCase().includes(searchTerm) ||
      case_.caseType?.toLowerCase().includes(searchTerm) ||
      case_.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private getCaseStatisticsLocal() {
    const activeCases = this.getActiveCasesLocal();
    const upcomingDeadlines = this.getUpcomingDeadlinesLocal();
    const highPriorityCases = this.getCasesByPriorityLocal('high');
    const urgentCases = this.getCasesByPriorityLocal('urgent');

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

  private getCasesByTypeLocal(): Record<string, Case[]> {
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