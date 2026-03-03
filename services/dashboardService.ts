import { supabase } from '../src/lib/supabase';

/**
 * Dashboard Service
 * Récupère les statistiques réelles depuis la base de données
 */
class DashboardService {
  /**
   * Get dashboard statistics for the current user
   */
  async getDashboardStats(userId: string) {
    try {
      // Get user's cases statistics
      const casesStats = await this.getCasesStatistics(userId);
      
      // Get user's documents statistics (if applicable)
      const documentsStats = await this.getDocumentsStatistics(userId);
      
      // Get user's subscription info
      const subscriptionInfo = await this.getSubscriptionInfo(userId);

      return {
        // Cases statistics
        activeCases: casesStats.activeCases,
        totalCases: casesStats.totalCases,
        pendingDeadlines: casesStats.pendingDeadlines,
        urgentCases: casesStats.urgentCases,
        casesByType: casesStats.casesByType,
        casesByPriority: casesStats.casesByPriority,
        
        // Documents statistics
        documentDrafts: documentsStats.drafts,
        totalDocuments: documentsStats.total,
        recentDocuments: documentsStats.recent,
        
        // Financial statistics
        estimatedValue: casesStats.totalEstimatedValue,
        monthlyRevenue: casesStats.monthlyEstimatedValue,
        
        // Subscription info
        plan: subscriptionInfo.plan,
        documentsUsed: subscriptionInfo.documentsUsed,
        documentsLimit: subscriptionInfo.documentsLimit,
        subscriptionStatus: subscriptionInfo.status,
        
        // Activity statistics
        recentSearches: 0, // TODO: Implement search tracking
        lastActivity: new Date()
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Get cases statistics for a user
   */
  private async getCasesStatistics(userId: string) {
    try {
      // Get all cases for the user
      const { data: cases, error } = await supabase
        ?.from('cases')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching cases:', error);
        return this.getDefaultCasesStats();
      }

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate statistics
      const activeCases = cases?.filter(c => c.status === 'active').length || 0;
      const totalCases = cases?.length || 0;
      
      // Cases with deadlines in the next 30 days
      const pendingDeadlines = cases?.filter(c => 
        c.deadline && 
        new Date(c.deadline) >= now && 
        new Date(c.deadline) <= thirtyDaysFromNow &&
        c.status === 'active'
      ).length || 0;

      // Urgent cases
      const urgentCases = cases?.filter(c => 
        c.priority === 'urgent' && c.status === 'active'
      ).length || 0;

      // Cases by type
      const casesByType: Record<string, number> = {};
      cases?.forEach(c => {
        if (c.case_type) {
          casesByType[c.case_type] = (casesByType[c.case_type] || 0) + 1;
        }
      });

      // Cases by priority
      const casesByPriority: Record<string, number> = {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      };
      cases?.forEach(c => {
        if (c.priority && c.status === 'active') {
          casesByPriority[c.priority] = (casesByPriority[c.priority] || 0) + 1;
        }
      });

      // Financial statistics
      const totalEstimatedValue = cases
        ?.filter(c => c.status === 'active')
        .reduce((sum, c) => sum + (parseFloat(c.estimated_value) || 0), 0) || 0;

      const monthlyEstimatedValue = cases
        ?.filter(c => 
          c.status === 'active' && 
          new Date(c.created_at) >= thisMonthStart
        )
        .reduce((sum, c) => sum + (parseFloat(c.estimated_value) || 0), 0) || 0;

      return {
        activeCases,
        totalCases,
        pendingDeadlines,
        urgentCases,
        casesByType,
        casesByPriority,
        totalEstimatedValue,
        monthlyEstimatedValue
      };
    } catch (error) {
      console.error('Error calculating cases statistics:', error);
      return this.getDefaultCasesStats();
    }
  }

  /**
   * Get documents statistics for a user
   */
  private async getDocumentsStatistics(userId: string) {
    try {
      const { data: documents, error } = await supabase
        ?.from('documents')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching documents:', error);
        return { drafts: 0, total: 0, recent: 0 };
      }

      const drafts = documents?.filter(d => d.status === 'draft').length || 0;
      const total = documents?.length || 0;
      
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recent = documents?.filter(d => 
        new Date(d.created_at) >= sevenDaysAgo
      ).length || 0;

      return { drafts, total, recent };
    } catch (error) {
      console.error('Error calculating documents statistics:', error);
      return { drafts: 0, total: 0, recent: 0 };
    }
  }

  /**
   * Get subscription info for a user
   */
  private async getSubscriptionInfo(userId: string) {
    try {
      const { data: subscription, error } = await supabase
        ?.from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !subscription) {
        console.error('Error fetching subscription:', error);
        return {
          plan: 'GRATUIT',
          documentsUsed: 0,
          documentsLimit: 5,
          status: 'active'
        };
      }

      return {
        plan: subscription.plan_type || 'GRATUIT',
        documentsUsed: subscription.documents_used || 0,
        documentsLimit: subscription.document_limit || 5,
        status: subscription.status || 'active'
      };
    } catch (error) {
      console.error('Error fetching subscription info:', error);
      return {
        plan: 'GRATUIT',
        documentsUsed: 0,
        documentsLimit: 5,
        status: 'active'
      };
    }
  }

  /**
   * Get default statistics (fallback)
   */
  private getDefaultStats() {
    return {
      activeCases: 0,
      totalCases: 0,
      pendingDeadlines: 0,
      urgentCases: 0,
      casesByType: {},
      casesByPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
      documentDrafts: 0,
      totalDocuments: 0,
      recentDocuments: 0,
      estimatedValue: 0,
      monthlyRevenue: 0,
      plan: 'GRATUIT',
      documentsUsed: 0,
      documentsLimit: 5,
      subscriptionStatus: 'active',
      recentSearches: 0,
      lastActivity: new Date()
    };
  }

  /**
   * Get default cases statistics (fallback)
   */
  private getDefaultCasesStats() {
    return {
      activeCases: 0,
      totalCases: 0,
      pendingDeadlines: 0,
      urgentCases: 0,
      casesByType: {},
      casesByPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
      totalEstimatedValue: 0,
      monthlyEstimatedValue: 0
    };
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return supabase !== null;
  }
}

// Create and export a singleton instance
export const dashboardService = new DashboardService();
