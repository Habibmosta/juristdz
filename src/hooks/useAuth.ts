import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { EnhancedUserProfile, UserRole } from '../../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<EnhancedUserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only update on actual auth changes, not on token refresh
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Just update the session without reloading profile
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string, retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Si le profil n'existe pas encore (trigger en cours), réessayer
        if (error.code === 'PGRST116' && retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 500));
          return loadProfile(userId, retryCount + 1);
        }
        throw error;
      }

      if (data) {
        // Convert database profile to EnhancedUserProfile
        const enhancedProfile: EnhancedUserProfile = {
          id: data.id,
          email: data.email,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          profession: mapProfessionToRole(data.profession),
          registrationNumber: data.registration_number || '',
          barreauId: data.barreau_id || '',
          organizationName: data.organization_name || '',
          phoneNumber: data.phone_number || '',
          languages: data.languages || ['fr'],
          specializations: data.specializations || [],
          roles: [mapProfessionToRole(data.profession)],
          activeRole: mapProfessionToRole(data.profession),
          isActive: data.is_active,
          emailVerified: data.email_verified,
          mfaEnabled: data.mfa_enabled,
          professionalInfo: data.professional_info || undefined,
          // Subscription & account fields
          account_status: data.account_status,
          subscriptionPlan: data.subscription_plan,
          trial_ends_at: data.trial_ends_at,
          payment_status: data.payment_status,
          suspension_reason: data.suspension_reason,
          created_at: data.created_at,
        };

        setProfile(enhancedProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<EnhancedUserProfile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          profession: updates.profession?.toLowerCase(),
          registration_number: updates.registrationNumber,
          barreau_id: updates.barreauId,
          organization_name: updates.organizationName,
          phone_number: updates.phoneNumber,
          languages: updates.languages,
          specializations: updates.specializations
        })
        .eq('id', user.id);

      if (error) throw error;
      await loadProfile(user.id);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const updateProfessionalInfo = async (professionalInfo: import('../../types').ProfessionalInfo) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ professional_info: professionalInfo })
        .eq('id', user.id);

      if (error) throw error;

      // Mettre à jour le profil local sans recharger
      setProfile(prev => prev ? { ...prev, professionalInfo } : prev);
    } catch (error) {
      console.error('Error updating professional info:', error);
      throw error;
    }
  };

  return {
    user,
    profile,
    session,
    loading,
    signOut,
    updateProfile,
    updateProfessionalInfo
  };
};

// Helper function to map profession to UserRole
function mapProfessionToRole(profession: string): UserRole {
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
