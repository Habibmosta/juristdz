import { supabase } from '../lib/supabase';

export interface TrialInfo {
  plan: string;
  status: string;
  trial_ends_at: string | null;
  days_remaining: number;
  is_trial: boolean;
  is_expired: boolean;
}

export interface ConversionResult {
  success: boolean;
  message: string;
  plan?: string;
  expires_at?: string;
}

/**
 * Service pour gérer les essais gratuits
 */
export const trialService = {
  /**
   * Récupérer les informations d'essai de l'utilisateur
   */
  async getTrialInfo(userId: string): Promise<TrialInfo | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan, status, trial_ends_at, expires_at')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const now = new Date();
      const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
      const daysRemaining = trialEndsAt
        ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        plan: data.plan,
        status: data.status,
        trial_ends_at: data.trial_ends_at,
        days_remaining: Math.max(0, daysRemaining),
        is_trial: data.status === 'trial',
        is_expired: data.status === 'trial' && daysRemaining <= 0
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des infos d\'essai:', error);
      return null;
    }
  },

  /**
   * Convertir un essai en abonnement payant
   */
  async convertTrialToPaid(userId: string, paymentMethod: string = 'ccp'): Promise<ConversionResult> {
    try {
      const { data, error } = await supabase.rpc('convert_trial_to_paid', {
        p_user_id: userId,
        p_payment_method: paymentMethod
      });

      if (error) throw error;

      return data as ConversionResult;
    } catch (error: any) {
      console.error('Erreur lors de la conversion:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la conversion'
      };
    }
  },

  /**
   * Downgrade vers le plan gratuit
   */
  async downgradeToFree(userId: string): Promise<ConversionResult> {
    try {
      const { data, error } = await supabase.rpc('downgrade_to_free', {
        p_user_id: userId
      });

      if (error) throw error;

      return data as ConversionResult;
    } catch (error: any) {
      console.error('Erreur lors du downgrade:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors du downgrade'
      };
    }
  },

  /**
   * Récupérer les essais actifs (pour admin)
   */
  async getActiveTrials() {
    try {
      const { data, error } = await supabase
        .from('v_active_trials')
        .select('*')
        .order('days_remaining', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des essais actifs:', error);
      return [];
    }
  },

  /**
   * Récupérer les statistiques des essais (pour admin)
   */
  async getTrialStats() {
    try {
      const { data, error } = await supabase
        .from('v_trial_stats')
        .select('*')
        .single();

      if (error) throw error;

      return data || {
        active_trials: 0,
        expired_trials: 0,
        expiring_soon: 0,
        suspended_count: 0,
        free_users: 0,
        paid_users: 0
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      return {
        active_trials: 0,
        expired_trials: 0,
        expiring_soon: 0,
        suspended_count: 0,
        free_users: 0,
        paid_users: 0
      };
    }
  },

  /**
   * Vérifier si un essai est expiré
   */
  isTrialExpired(trialInfo: TrialInfo | null): boolean {
    if (!trialInfo || !trialInfo.is_trial) return false;
    return trialInfo.days_remaining <= 0;
  },

  /**
   * Vérifier si un essai expire bientôt (2 jours ou moins)
   */
  isTrialExpiringSoon(trialInfo: TrialInfo | null): boolean {
    if (!trialInfo || !trialInfo.is_trial) return false;
    return trialInfo.days_remaining > 0 && trialInfo.days_remaining <= 2;
  },

  /**
   * Formater le message de compte à rebours
   */
  getTrialCountdownMessage(trialInfo: TrialInfo | null, isAr: boolean = false): string {
    if (!trialInfo || !trialInfo.is_trial) return '';

    const days = trialInfo.days_remaining;

    if (days <= 0) {
      return isAr ? 'انتهت الفترة التجريبية' : 'Essai expiré';
    }

    if (days === 1) {
      return isAr ? 'يوم واحد متبقي' : '1 jour restant';
    }

    return isAr ? `${days} أيام متبقية` : `${days} jours restants`;
  }
};
