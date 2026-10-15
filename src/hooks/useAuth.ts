import { useState, useEffect, useCallback } from 'react';
import { authService, tokenStorage } from '../services/authService';
import { UserRole } from '../../types';

export interface EnhancedUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profession: UserRole;
  registrationNumber?: string;
  barreauId?: string;
  organizationName?: string;
  phoneNumber?: string;
  languages: string[];
  specializations: string[];
  roles: string[];
  activeRole: string;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  professionalInfo?: any;
  account_status?: string;
  subscriptionPlan?: string;
  trial_ends_at?: string;
  payment_status?: string;
  created_at?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<EnhancedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from API
  const loadProfile = useCallback(async () => {
    try {
      const userProfile = await authService.getProfile();

      if (!userProfile) {
        setProfile(null);
        setUser(null);
        return null;
      }

      // Convert to EnhancedUserProfile format
      const enhancedProfile: EnhancedUserProfile = {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        profession: mapProfessionToRole(userProfile.profession),
        registrationNumber: userProfile.registrationNumber || '',
        barreauId: userProfile.barreauId || '',
        organizationName: userProfile.organizationName || '',
        phoneNumber: userProfile.phoneNumber || '',
        languages: userProfile.languages || ['fr'],
        specializations: userProfile.specializations || [],
        roles: userProfile.roles || [userProfile.profession],
        activeRole: userProfile.activeRole || userProfile.profession,
        isActive: userProfile.isActive ?? true,
        emailVerified: userProfile.emailVerified ?? false,
        mfaEnabled: userProfile.mfaEnabled ?? false,
        account_status: userProfile.account_status,
        subscriptionPlan: userProfile.subscriptionPlan,
        trial_ends_at: userProfile.trial_ends_at,
        payment_status: userProfile.payment_status,
        created_at: userProfile.created_at,
      };

      setProfile(enhancedProfile);
      setUser({ id: userProfile.id, email: userProfile.email });
      return enhancedProfile;
    } catch (error) {
      console.error('Error loading profile:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    const initAuth = async () => {
      if (tokenStorage.hasTokens()) {
        await loadProfile();
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, [loadProfile]);

  const login = async (credentials: { email: string; password: string; mfaCode?: string }) => {
    setLoading(true);
    try {
      const result = await authService.login(credentials);

      if (result.success && result.user) {
        await loadProfile();
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Erreur de connexion'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur réseau'
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      const result = await authService.register(userData);
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Erreur réseau'
      };
    }
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<EnhancedUserProfile>) => {
    try {
      const success = await authService.updateProfile(updates);
      if (success) {
        await loadProfile();
      }
      return success;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const requireAuth = (): boolean => {
    return !!profile;
  };

  const requireRole = (requiredRole: UserRole): boolean => {
    if (!profile) return false;
    return profile.roles.includes(requiredRole) || profile.activeRole === requiredRole;
  };

  return {
    user,
    profile,
    loading,
    login,
    register,
    signOut,
    updateProfile,
    requireAuth,
    requireRole,
    isAuthenticated: tokenStorage.hasTokens(),
  };
};

// Helper function to map profession to UserRole
export function mapProfessionToRole(profession: string): UserRole {
  switch (profession.toLowerCase()) {
    case 'admin':
      return UserRole.ADMIN;
    case 'avocat':
      return UserRole.AVOCAT;
    case 'notaire':
      return UserRole.NOTAIRE;
    case 'huissier':
      return UserRole.HUISSIER;
    case 'magistrat':
      return UserRole.MAGISTRAT;
    case 'etudiant':
      return UserRole.ETUDIANT;
    case 'juriste_entreprise':
      return UserRole.JURISTE_ENTREPRISE;
    default:
      console.warn(`Unknown profession: ${profession}, defaulting to AVOCAT`);
      return UserRole.AVOCAT;
  }
}
