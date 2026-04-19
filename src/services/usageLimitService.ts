/**
 * SERVICE DE GESTION DES LIMITES D'UTILISATION
 * 
 * Ce service gère tous les cas de figure où un utilisateur atteint ses limites:
 * - Crédits épuisés
 * - Date d'expiration atteinte
 * - Quota de ressources dépassé
 * - Limites de fonctionnalités
 */

import { supabase } from '../lib/supabase';
import { SubscriptionPlan } from '../../types';

// Types de limites
export enum LimitType {
  CREDITS = 'credits',
  EXPIRATION = 'expiration',
  DAILY_QUOTA = 'daily_quota',
  MONTHLY_QUOTA = 'monthly_quota',
  FEATURE_ACCESS = 'feature_access',
  STORAGE = 'storage',
  API_CALLS = 'api_calls'
}

// Statut de la limite
export enum LimitStatus {
  OK = 'ok',
  WARNING = 'warning',      // 80-90% utilisé
  CRITICAL = 'critical',    // 90-100% utilisé
  EXCEEDED = 'exceeded'     // 100%+ utilisé
}

// Configuration des limites par plan
export const PLAN_LIMITS = {
  free: {
    credits: 50,
    dailyQuota: 10,
    monthlyQuota: 100,
    storageGB: 1,
    apiCallsPerDay: 50,
    features: ['research', 'basic_drafting'],
    expirationDays: 30
  },
  pro: {
    credits: 500,
    dailyQuota: 100,
    monthlyQuota: 1000,
    storageGB: 10,
    apiCallsPerDay: 500,
    features: ['research', 'drafting', 'analysis', 'cases', 'clients'],
    expirationDays: 365
  },
  cabinet: {
    credits: -1, // Illimité
    dailyQuota: -1, // Illimité
    monthlyQuota: -1, // Illimité
    storageGB: 100,
    apiCallsPerDay: -1, // Illimité
    features: ['all'],
    expirationDays: 365
  }
};

// Interface pour le résultat de vérification
export interface LimitCheckResult {
  allowed: boolean;
  status: LimitStatus;
  limitType: LimitType;
  current: number;
  limit: number;
  percentage: number;
  message: {
    fr: string;
    ar: string;
  };
  action: {
    type: 'block' | 'warn' | 'allow';
    redirectTo?: string;
    showUpgradeModal?: boolean;
  };
}

// Interface pour l'usage utilisateur
export interface UserUsage {
  userId: string;
  plan: SubscriptionPlan;
  credits: number;
  creditsUsedToday: number;
  creditsUsedThisMonth: number;
  apiCallsToday: number;
  storageUsedGB: number;
  expiresAt: Date | null;
  lastResetDate: Date;
}

export class UsageLimitService {
  
  /**
   * Vérifier tous les types de limites pour un utilisateur
   */
  async checkAllLimits(userId: string, action: string): Promise<LimitCheckResult> {
    const usage = await this.getUserUsage(userId);
    
    // 1. Vérifier l'expiration
    const expirationCheck = this.checkExpiration(usage);
    if (!expirationCheck.allowed) return expirationCheck;
    
    // 2. Vérifier les crédits
    const creditsCheck = this.checkCredits(usage);
    if (!creditsCheck.allowed) return creditsCheck;
    
    // 3. Vérifier le quota journalier
    const dailyQuotaCheck = this.checkDailyQuota(usage);
    if (!dailyQuotaCheck.allowed) return dailyQuotaCheck;
    
    // 4. Vérifier le quota mensuel
    const monthlyQuotaCheck = this.checkMonthlyQuota(usage);
    if (!monthlyQuotaCheck.allowed) return monthlyQuotaCheck;
    
    // 5. Vérifier les appels API
    const apiCallsCheck = this.checkApiCalls(usage);
    if (!apiCallsCheck.allowed) return apiCallsCheck;
    
    // 6. Vérifier le stockage
    const storageCheck = this.checkStorage(usage);
    if (!storageCheck.allowed) return storageCheck;
    
    // Tout est OK
    return {
      allowed: true,
      status: LimitStatus.OK,
      limitType: LimitType.CREDITS,
      current: usage.credits,
      limit: PLAN_LIMITS[usage.plan].credits,
      percentage: 0,
      message: {
        fr: 'Accès autorisé',
        ar: 'الوصول مسموح'
      },
      action: {
        type: 'allow'
      }
    };
  }
  
  /**
   * Vérifier l'expiration de l'abonnement
   */
  checkExpiration(usage: UserUsage): LimitCheckResult {
    if (!usage.expiresAt) {
      return {
        allowed: true,
        status: LimitStatus.OK,
        limitType: LimitType.EXPIRATION,
        current: 0,
        limit: 0,
        percentage: 0,
        message: { fr: 'Pas de date d\'expiration', ar: 'لا يوجد تاريخ انتهاء' },
        action: { type: 'allow' }
      };
    }
    
    const now = new Date();
    const daysRemaining = Math.ceil((usage.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Expiré
    if (daysRemaining <= 0) {
      return {
        allowed: false,
        status: LimitStatus.EXCEEDED,
        limitType: LimitType.EXPIRATION,
        current: 0,
        limit: 0,
        percentage: 100,
        message: {
          fr: `Votre abonnement a expiré le ${usage.expiresAt.toLocaleDateString('fr-FR')}. Veuillez renouveler votre abonnement pour continuer à utiliser JuristDZ.`,
          ar: `انتهت صلاحية اشتراكك في ${usage.expiresAt.toLocaleDateString('ar-DZ')}. يرجى تجديد اشتراكك لمواصلة استخدام منصة القانون الجزائري.`
        },
        action: {
          type: 'block',
          redirectTo: '/billing',
          showUpgradeModal: true
        }
      };
    }
    
    // Avertissement (moins de 7 jours)
    if (daysRemaining <= 7) {
      return {
        allowed: true,
        status: LimitStatus.WARNING,
        limitType: LimitType.EXPIRATION,
        current: daysRemaining,
        limit: 30,
        percentage: ((30 - daysRemaining) / 30) * 100,
        message: {
          fr: `⚠️ Votre abonnement expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}. Pensez à le renouveler pour éviter toute interruption de service.`,
          ar: `⚠️ ينتهي اشتراكك خلال ${daysRemaining} ${daysRemaining > 1 ? 'أيام' : 'يوم'}. فكر في تجديده لتجنب أي انقطاع في الخدمة.`
        },
        action: {
          type: 'warn',
          showUpgradeModal: false
        }
      };
    }
    
    return {
      allowed: true,
      status: LimitStatus.OK,
      limitType: LimitType.EXPIRATION,
      current: daysRemaining,
      limit: 30,
      percentage: 0,
      message: { fr: 'Abonnement actif', ar: 'الاشتراك نشط' },
      action: { type: 'allow' }
    };
  }
  
  /**
   * Vérifier les crédits disponibles
   */
  checkCredits(usage: UserUsage): LimitCheckResult {
    const limit = PLAN_LIMITS[usage.plan].credits;
    
    // Plan illimité
    if (limit === -1) {
      return {
        allowed: true,
        status: LimitStatus.OK,
        limitType: LimitType.CREDITS,
        current: -1,
        limit: -1,
        percentage: 0,
        message: { fr: 'Crédits illimités', ar: 'رصيد غير محدود' },
        action: { type: 'allow' }
      };
    }
    
    const percentage = (usage.credits / limit) * 100;
    
    // Crédits épuisés
    if (usage.credits <= 0) {
      return {
        allowed: false,
        status: LimitStatus.EXCEEDED,
        limitType: LimitType.CREDITS,
        current: 0,
        limit: limit,
        percentage: 100,
        message: {
          fr: `Vous avez épuisé vos ${limit} crédits. Passez à un plan supérieur pour continuer à utiliser JuristDZ sans interruption.`,
          ar: `لقد استنفدت رصيدك البالغ ${limit} نقطة. قم بالترقية إلى خطة أعلى لمواصلة استخدام المنصة دون انقطاع.`
        },
        action: {
          type: 'block',
          redirectTo: '/billing',
          showUpgradeModal: true
        }
      };
    }
    
    // Avertissement critique (moins de 10 crédits)
    if (usage.credits <= 10) {
      return {
        allowed: true,
        status: LimitStatus.CRITICAL,
        limitType: LimitType.CREDITS,
        current: usage.credits,
        limit: limit,
        percentage: percentage,
        message: {
          fr: `🚨 Attention! Il ne vous reste que ${usage.credits} crédits sur ${limit}. Rechargez rapidement pour éviter toute interruption.`,
          ar: `🚨 تنبيه! لم يتبق لك سوى ${usage.credits} نقطة من ${limit}. قم بإعادة الشحن بسرعة لتجنب أي انقطاع.`
        },
        action: {
          type: 'warn',
          showUpgradeModal: true
        }
      };
    }
    
    // Avertissement (moins de 20% restants)
    if (percentage < 20) {
      return {
        allowed: true,
        status: LimitStatus.WARNING,
        limitType: LimitType.CREDITS,
        current: usage.credits,
        limit: limit,
        percentage: percentage,
        message: {
          fr: `⚠️ Il vous reste ${usage.credits} crédits sur ${limit}. Pensez à recharger bientôt.`,
          ar: `⚠️ لديك ${usage.credits} نقطة متبقية من ${limit}. فكر في إعادة الشحن قريباً.`
        },
        action: {
          type: 'warn',
          showUpgradeModal: false
        }
      };
    }
    
    return {
      allowed: true,
      status: LimitStatus.OK,
      limitType: LimitType.CREDITS,
      current: usage.credits,
      limit: limit,
      percentage: percentage,
      message: { fr: `${usage.credits} crédits disponibles`, ar: `${usage.credits} نقطة متاحة` },
      action: { type: 'allow' }
    };
  }
  
  /**
   * Vérifier le quota journalier
   */
  checkDailyQuota(usage: UserUsage): LimitCheckResult {
    const limit = PLAN_LIMITS[usage.plan].dailyQuota;
    
    // Quota illimité
    if (limit === -1) {
      return {
        allowed: true,
        status: LimitStatus.OK,
        limitType: LimitType.DAILY_QUOTA,
        current: usage.creditsUsedToday,
        limit: -1,
        percentage: 0,
        message: { fr: 'Quota journalier illimité', ar: 'حصة يومية غير محدودة' },
        action: { type: 'allow' }
      };
    }
    
    const percentage = (usage.creditsUsedToday / limit) * 100;
    
    // Quota dépassé
    if (usage.creditsUsedToday >= limit) {
      const resetTime = new Date(usage.lastResetDate);
      resetTime.setDate(resetTime.getDate() + 1);
      resetTime.setHours(0, 0, 0, 0);
      
      const hoursUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60 * 60));
      
      return {
        allowed: false,
        status: LimitStatus.EXCEEDED,
        limitType: LimitType.DAILY_QUOTA,
        current: usage.creditsUsedToday,
        limit: limit,
        percentage: 100,
        message: {
          fr: `Vous avez atteint votre limite journalière de ${limit} requêtes. Votre quota sera réinitialisé dans ${hoursUntilReset}h. Passez au plan Pro pour des quotas plus élevés.`,
          ar: `لقد وصلت إلى حدك اليومي البالغ ${limit} طلب. سيتم إعادة تعيين حصتك خلال ${hoursUntilReset} ساعة. قم بالترقية إلى الخطة الاحترافية للحصول على حصص أعلى.`
        },
        action: {
          type: 'block',
          redirectTo: '/billing',
          showUpgradeModal: true
        }
      };
    }
    
    // Avertissement (plus de 80%)
    if (percentage >= 80) {
      return {
        allowed: true,
        status: LimitStatus.WARNING,
        limitType: LimitType.DAILY_QUOTA,
        current: usage.creditsUsedToday,
        limit: limit,
        percentage: percentage,
        message: {
          fr: `⚠️ Vous avez utilisé ${usage.creditsUsedToday}/${limit} requêtes aujourd'hui (${Math.round(percentage)}%).`,
          ar: `⚠️ لقد استخدمت ${usage.creditsUsedToday}/${limit} طلب اليوم (${Math.round(percentage)}%).`
        },
        action: {
          type: 'warn',
          showUpgradeModal: false
        }
      };
    }
    
    return {
      allowed: true,
      status: LimitStatus.OK,
      limitType: LimitType.DAILY_QUOTA,
      current: usage.creditsUsedToday,
      limit: limit,
      percentage: percentage,
      message: { fr: `${usage.creditsUsedToday}/${limit} requêtes aujourd'hui`, ar: `${usage.creditsUsedToday}/${limit} طلب اليوم` },
      action: { type: 'allow' }
    };
  }
  
  /**
   * Vérifier le quota mensuel
   */
  checkMonthlyQuota(usage: UserUsage): LimitCheckResult {
    const limit = PLAN_LIMITS[usage.plan].monthlyQuota;
    
    // Quota illimité
    if (limit === -1) {
      return {
        allowed: true,
        status: LimitStatus.OK,
        limitType: LimitType.MONTHLY_QUOTA,
        current: usage.creditsUsedThisMonth,
        limit: -1,
        percentage: 0,
        message: { fr: 'Quota mensuel illimité', ar: 'حصة شهرية غير محدودة' },
        action: { type: 'allow' }
      };
    }
    
    const percentage = (usage.creditsUsedThisMonth / limit) * 100;
    
    // Quota dépassé
    if (usage.creditsUsedThisMonth >= limit) {
      return {
        allowed: false,
        status: LimitStatus.EXCEEDED,
        limitType: LimitType.MONTHLY_QUOTA,
        current: usage.creditsUsedThisMonth,
        limit: limit,
        percentage: 100,
        message: {
          fr: `Vous avez atteint votre limite mensuelle de ${limit} requêtes. Passez au plan Pro pour continuer sans interruption.`,
          ar: `لقد وصلت إلى حدك الشهري البالغ ${limit} طلب. قم بالترقية إلى الخطة الاحترافية للمتابعة دون انقطاع.`
        },
        action: {
          type: 'block',
          redirectTo: '/billing',
          showUpgradeModal: true
        }
      };
    }
    
    // Avertissement (plus de 90%)
    if (percentage >= 90) {
      return {
        allowed: true,
        status: LimitStatus.CRITICAL,
        limitType: LimitType.MONTHLY_QUOTA,
        current: usage.creditsUsedThisMonth,
        limit: limit,
        percentage: percentage,
        message: {
          fr: `🚨 Vous avez utilisé ${usage.creditsUsedThisMonth}/${limit} requêtes ce mois (${Math.round(percentage)}%). Limite presque atteinte!`,
          ar: `🚨 لقد استخدمت ${usage.creditsUsedThisMonth}/${limit} طلب هذا الشهر (${Math.round(percentage)}%). الحد على وشك الوصول!`
        },
        action: {
          type: 'warn',
          showUpgradeModal: true
        }
      };
    }
    
    return {
      allowed: true,
      status: LimitStatus.OK,
      limitType: LimitType.MONTHLY_QUOTA,
      current: usage.creditsUsedThisMonth,
      limit: limit,
      percentage: percentage,
      message: { fr: `${usage.creditsUsedThisMonth}/${limit} requêtes ce mois`, ar: `${usage.creditsUsedThisMonth}/${limit} طلب هذا الشهر` },
      action: { type: 'allow' }
    };
  }
  
  /**
   * Vérifier les appels API
   */
  checkApiCalls(usage: UserUsage): LimitCheckResult {
    const limit = PLAN_LIMITS[usage.plan].apiCallsPerDay;
    
    // API illimitée
    if (limit === -1) {
      return {
        allowed: true,
        status: LimitStatus.OK,
        limitType: LimitType.API_CALLS,
        current: usage.apiCallsToday,
        limit: -1,
        percentage: 0,
        message: { fr: 'Appels API illimités', ar: 'مكالمات API غير محدودة' },
        action: { type: 'allow' }
      };
    }
    
    const percentage = (usage.apiCallsToday / limit) * 100;
    
    // Limite dépassée
    if (usage.apiCallsToday >= limit) {
      return {
        allowed: false,
        status: LimitStatus.EXCEEDED,
        limitType: LimitType.API_CALLS,
        current: usage.apiCallsToday,
        limit: limit,
        percentage: 100,
        message: {
          fr: `Vous avez atteint votre limite d'appels API (${limit}/jour). Réessayez demain ou passez au plan Pro.`,
          ar: `لقد وصلت إلى حد مكالمات API الخاص بك (${limit}/يوم). حاول مرة أخرى غداً أو قم بالترقية إلى الخطة الاحترافية.`
        },
        action: {
          type: 'block',
          redirectTo: '/billing',
          showUpgradeModal: true
        }
      };
    }
    
    return {
      allowed: true,
      status: LimitStatus.OK,
      limitType: LimitType.API_CALLS,
      current: usage.apiCallsToday,
      limit: limit,
      percentage: percentage,
      message: { fr: `${usage.apiCallsToday}/${limit} appels API aujourd'hui`, ar: `${usage.apiCallsToday}/${limit} مكالمة API اليوم` },
      action: { type: 'allow' }
    };
  }
  
  /**
   * Vérifier le stockage
   */
  checkStorage(usage: UserUsage): LimitCheckResult {
    const limit = PLAN_LIMITS[usage.plan].storageGB;
    const percentage = (usage.storageUsedGB / limit) * 100;
    
    // Stockage dépassé
    if (usage.storageUsedGB >= limit) {
      return {
        allowed: false,
        status: LimitStatus.EXCEEDED,
        limitType: LimitType.STORAGE,
        current: usage.storageUsedGB,
        limit: limit,
        percentage: 100,
        message: {
          fr: `Votre espace de stockage est plein (${usage.storageUsedGB}/${limit} GB). Supprimez des fichiers ou passez à un plan supérieur.`,
          ar: `مساحة التخزين الخاصة بك ممتلئة (${usage.storageUsedGB}/${limit} جيجابايت). احذف الملفات أو قم بالترقية إلى خطة أعلى.`
        },
        action: {
          type: 'block',
          redirectTo: '/billing',
          showUpgradeModal: true
        }
      };
    }
    
    // Avertissement (plus de 85%)
    if (percentage >= 85) {
      return {
        allowed: true,
        status: LimitStatus.WARNING,
        limitType: LimitType.STORAGE,
        current: usage.storageUsedGB,
        limit: limit,
        percentage: percentage,
        message: {
          fr: `⚠️ Stockage presque plein: ${usage.storageUsedGB.toFixed(2)}/${limit} GB (${Math.round(percentage)}%).`,
          ar: `⚠️ التخزين شبه ممتلئ: ${usage.storageUsedGB.toFixed(2)}/${limit} جيجابايت (${Math.round(percentage)}%).`
        },
        action: {
          type: 'warn',
          showUpgradeModal: false
        }
      };
    }
    
    return {
      allowed: true,
      status: LimitStatus.OK,
      limitType: LimitType.STORAGE,
      current: usage.storageUsedGB,
      limit: limit,
      percentage: percentage,
      message: { fr: `${usage.storageUsedGB.toFixed(2)}/${limit} GB utilisés`, ar: `${usage.storageUsedGB.toFixed(2)}/${limit} جيجابايت مستخدم` },
      action: { type: 'allow' }
    };
  }
  
  /**
   * Récupérer l'usage d'un utilisateur
   */
  async getUserUsage(userId: string): Promise<UserUsage> {
    if (!supabase) {
      // Fallback localStorage pour développement
      return {
        userId,
        plan: 'free',
        credits: 50,
        creditsUsedToday: 0,
        creditsUsedThisMonth: 0,
        apiCallsToday: 0,
        storageUsedGB: 0,
        expiresAt: null,
        lastResetDate: new Date()
      };
    }
    
    // Récupérer les données de l'abonnement
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Récupérer les statistiques d'usage (table peut ne pas exister encore)
    const { data: stats } = await supabase
      .from('usage_stats')
      .select('credits_used_today, credits_used_this_month, api_calls_today, storage_used_gb, last_reset_date')
      .eq('user_id', userId)
      .maybeSingle();
    
    return {
      userId,
      plan: subscription?.plan || 'free',
      credits: subscription?.credits_remaining || 0,
      creditsUsedToday: stats?.credits_used_today || 0,
      creditsUsedThisMonth: stats?.credits_used_this_month || 0,
      apiCallsToday: stats?.api_calls_today || 0,
      storageUsedGB: stats?.storage_used_gb || 0,
      expiresAt: subscription?.expires_at ? new Date(subscription.expires_at) : null,
      lastResetDate: stats?.last_reset_date ? new Date(stats.last_reset_date) : new Date()
    };
  }
  
  /**
   * Déduire des crédits après une action
   */
  async deductCredits(userId: string, amount: number): Promise<boolean> {
    if (!supabase) return true;
    
    const { error } = await supabase.rpc('deduct_credits', {
      p_user_id: userId,
      p_amount: amount
    });
    
    return !error;
  }
  
  /**
   * Incrémenter le compteur d'usage
   */
  async incrementUsage(userId: string, type: 'credits' | 'api_calls'): Promise<void> {
    if (!supabase) return;
    
    await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_type: type
    });
  }
}

// Export singleton
export const usageLimitService = new UsageLimitService();
