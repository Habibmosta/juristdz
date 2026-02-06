import { supabase } from './supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'avocat' | 'notaire' | 'huissier' | 'juriste_entreprise' | 'etudiant' | 'magistrat';
  organization_id: string;
  organization?: {
    id: string;
    name: string;
    type: string;
    subscription_status: string;
  };
  is_organization_admin: boolean;
  is_active: boolean;
}

/**
 * Authentication Service for SAAS Multi-User System
 * Handles user authentication, profiles, and organization context
 */
class AuthService {
  private currentUser: UserProfile | null = null;

  /**
   * Get current authenticated user with organization info
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase?.auth.getUser() || { data: { user: null } };
      
      if (!user) {
        this.currentUser = null;
        return null;
      }

      // Get user profile with organization info
      const { data: profile, error } = await supabase
        ?.from('user_profiles')
        .select(`
          *,
          organization:organizations(
            id,
            name,
            type,
            subscription_status
          )
        `)
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        console.error('Error fetching user profile:', error);
        this.currentUser = null;
        return null;
      }

      this.currentUser = profile as UserProfile;
      return this.currentUser;
    } catch (error) {
      console.error('Error getting current user:', error);
      this.currentUser = null;
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  /**
   * Check if user has specific role
   */
  async hasRole(role: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if user is organization admin
   */
  async isOrganizationAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.is_organization_admin === true;
  }

  /**
   * Get organization users (for collaboration features)
   */
  async getOrganizationUsers(): Promise<any[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user?.organization_id) {
        return [];
      }

      const { data, error } = await supabase
        ?.from('user_profiles')
        .select('id, first_name, last_name, role, email')
        .eq('organization_id', user.organization_id)
        .eq('is_active', true)
        .order('first_name');

      if (error) {
        console.error('Error fetching organization users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getOrganizationUsers:', error);
      return [];
    }
  }

  /**
   * Create demo user profile for testing
   * This would normally be handled by the signup process
   */
  async createDemoUserProfile(): Promise<UserProfile | null> {
    try {
      // First, get or create a demo organization
      let { data: org, error: orgError } = await supabase
        ?.from('organizations')
        .select('*')
        .eq('name', 'Cabinet de Démonstration')
        .single();

      if (orgError || !org) {
        console.log('Demo organization not found, using fallback');
        // Create a fallback organization object
        org = {
          id: 'demo-org-id',
          name: 'Cabinet de Démonstration',
          type: 'cabinet_avocat',
          subscription_status: 'trial'
        };
      }

      // Create demo user profile
      const demoProfile: UserProfile = {
        id: 'demo-user-id',
        email: 'demo@juristdz.com',
        first_name: 'Maître',
        last_name: 'Dupont',
        role: 'avocat',
        organization_id: org.id,
        organization: {
          id: org.id,
          name: org.name,
          type: org.type,
          subscription_status: org.subscription_status
        },
        is_organization_admin: true,
        is_active: true
      };

      // Cache the demo user for subsequent calls
      this.currentUser = demoProfile;

      return this.currentUser;
    } catch (error) {
      console.error('Error creating demo user profile:', error);
      return null;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      await supabase?.auth.signOut();
      this.currentUser = null;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  /**
   * Get cached current user (without API call)
   */
  getCachedUser(): UserProfile | null {
    return this.currentUser;
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return supabase !== null;
  }
}

// Create and export a singleton instance
export const authService = new AuthService();