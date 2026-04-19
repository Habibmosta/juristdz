import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface AccountUsage {
  casesCount: number;
  clientsCount: number;
  documentsCount: number;
  invoicesCount: number;
  casesLimit: number | null;
  clientsLimit: number | null;
  documentsLimit: number | null;
  invoicesLimit: number | null;
  canCreateCase: boolean;
  canCreateClient: boolean;
  canCreateDocument: boolean;
  canCreateInvoice: boolean;
}

export interface AccountStatus {
  status: 'trial' | 'suspended' | 'active' | 'blocked' | 'expired';
  isTrialExpired: boolean;
  daysRemaining: number;
  trialEndsAt: Date | null;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  usage: AccountUsage | null;
  canAccess: boolean;
  isReadOnly: boolean;
  suspensionReason: string | null;
}

export const useAccountStatus = () => {
  const { profile } = useAuth();
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }

    loadAccountStatus();
  }, [profile]);

  const loadAccountStatus = async () => {
    if (!profile) return;

    try {
      const { supabase } = await import('../lib/supabase');

      // Récupérer les statistiques d'utilisation
      const { data: usage, error } = await supabase
        .rpc('get_account_usage', { p_user_id: profile.id })
        .single();

      if (error) {
        console.error('Error loading account usage:', error);
      }

      // Calculer les jours restants
      const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
      const now = new Date();
      const daysRemaining = trialEndsAt 
        ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const isTrialExpired = profile.account_status === 'trial' && daysRemaining <= 0;

      // Déterminer les permissions
      const canAccess = profile.account_status !== 'blocked';
      const isReadOnly = profile.account_status === 'suspended';

      setAccountStatus({
        status: profile.account_status as any,
        isTrialExpired,
        daysRemaining: Math.max(0, daysRemaining),
        trialEndsAt,
        paymentStatus: profile.payment_status as any || 'pending',
        usage: usage ? {
          casesCount: (usage as any).cases_count || 0,
          clientsCount: (usage as any).clients_count || 0,
          documentsCount: (usage as any).documents_count || 0,
          invoicesCount: (usage as any).invoices_count || 0,
          casesLimit: (usage as any).cases_limit,
          clientsLimit: (usage as any).clients_limit,
          documentsLimit: (usage as any).documents_limit,
          invoicesLimit: (usage as any).invoices_limit,
          canCreateCase: (usage as any).can_create_case,
          canCreateClient: (usage as any).can_create_client,
          canCreateDocument: (usage as any).can_create_document,
          canCreateInvoice: (usage as any).can_create_invoice,
        } : null,
        canAccess,
        isReadOnly,
        suspensionReason: profile.suspension_reason || null,
      });
    } catch (error) {
      console.error('Error in loadAccountStatus:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanCreate = (resourceType: 'case' | 'client' | 'document' | 'invoice'): boolean => {
    if (!accountStatus || !accountStatus.usage) return false;

    switch (resourceType) {
      case 'case':
        return accountStatus.usage.canCreateCase;
      case 'client':
        return accountStatus.usage.canCreateClient;
      case 'document':
        return accountStatus.usage.canCreateDocument;
      case 'invoice':
        return accountStatus.usage.canCreateInvoice;
      default:
        return false;
    }
  };

  const getLimitMessage = (resourceType: 'case' | 'client' | 'document' | 'invoice', language: 'fr' | 'ar' = 'fr'): string => {
    if (!accountStatus || !accountStatus.usage) return '';

    const messages = {
      fr: {
        case: `Limite atteinte: ${accountStatus.usage.casesCount}/${accountStatus.usage.casesLimit} dossiers. Activez votre compte pour créer plus de dossiers.`,
        client: `Limite atteinte: ${accountStatus.usage.clientsCount}/${accountStatus.usage.clientsLimit} clients. Activez votre compte pour ajouter plus de clients.`,
        document: `Limite atteinte: ${accountStatus.usage.documentsCount}/${accountStatus.usage.documentsLimit} documents. Activez votre compte pour ajouter plus de documents.`,
        invoice: `Limite atteinte: ${accountStatus.usage.invoicesCount}/${accountStatus.usage.invoicesLimit} factures. Activez votre compte pour créer plus de factures.`,
      },
      ar: {
        case: `تم الوصول إلى الحد: ${accountStatus.usage.casesCount}/${accountStatus.usage.casesLimit} ملفات. قم بتفعيل حسابك لإنشاء المزيد.`,
        client: `تم الوصول إلى الحد: ${accountStatus.usage.clientsCount}/${accountStatus.usage.clientsLimit} عملاء. قم بتفعيل حسابك لإضافة المزيد.`,
        document: `تم الوصول إلى الحد: ${accountStatus.usage.documentsCount}/${accountStatus.usage.documentsLimit} وثائق. قم بتفعيل حسابك لإضافة المزيد.`,
        invoice: `تم الوصول إلى الحد: ${accountStatus.usage.invoicesCount}/${accountStatus.usage.invoicesLimit} فواتير. قم بتفعيل حسابك لإنشاء المزيد.`,
      }
    };

    return messages[language][resourceType];
  };

  const refreshStatus = () => {
    loadAccountStatus();
  };

  return {
    accountStatus,
    loading,
    checkCanCreate,
    getLimitMessage,
    refreshStatus,
  };
};
