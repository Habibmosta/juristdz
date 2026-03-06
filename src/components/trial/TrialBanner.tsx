import React from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAccountStatus } from '../../hooks/useAccountStatus';
import type { Language } from '../../types';

interface TrialBannerProps {
  language: Language;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ language }) => {
  const { accountStatus, loading } = useAccountStatus();
  const isAr = language === 'ar';

  if (loading || !accountStatus) return null;

  // Ne rien afficher pour les comptes actifs
  if (accountStatus.status === 'active') return null;

  // Compte bloqué
  if (accountStatus.status === 'blocked') {
    return (
      <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3">
          <XCircle size={20} />
          <div>
            <p className="font-bold">
              {isAr ? '⛔ حسابك محظور' : '⛔ Compte bloqué'}
            </p>
            {accountStatus.suspensionReason && (
              <p className="text-sm opacity-90">{accountStatus.suspensionReason}</p>
            )}
          </div>
        </div>
        <a
          href="mailto:contact@juristdz.com"
          className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors"
        >
          {isAr ? 'اتصل بنا' : 'Nous contacter'}
        </a>
      </div>
    );
  }

  // Compte suspendu
  if (accountStatus.status === 'suspended') {
    return (
      <div className="bg-orange-600 text-white px-6 py-3 flex items-center justify-between" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} />
          <div>
            <p className="font-bold">
              {isAr ? '⚠️ انتهت فترة التجربة' : '⚠️ Essai terminé'}
            </p>
            <p className="text-sm opacity-90">
              {isAr 
                ? 'حسابك في وضع القراءة فقط. اتصل بالإدارة لتفعيل حسابك.'
                : 'Votre compte est en lecture seule. Contactez l\'administration pour l\'activer.'}
            </p>
          </div>
        </div>
        <a
          href="mailto:contact@juristdz.com"
          className="px-4 py-2 bg-white text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition-colors"
        >
          {isAr ? 'تفعيل الحساب' : 'Activer mon compte'}
        </a>
      </div>
    );
  }

  // Compte en essai
  if (accountStatus.status === 'trial') {
    const { daysRemaining, usage } = accountStatus;
    const isExpiringSoon = daysRemaining <= 2;

    return (
      <div 
        className={`px-6 py-3 flex items-center justify-between ${
          isExpiringSoon ? 'bg-orange-500' : 'bg-blue-600'
        } text-white`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3">
          <Clock size={20} />
          <div>
            <p className="font-bold">
              {isAr 
                ? `⏰ فترة تجريبية: ${daysRemaining} ${daysRemaining === 1 ? 'يوم' : 'أيام'} متبقية`
                : `⏰ Essai gratuit: ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`}
            </p>
            {usage && (
              <p className="text-sm opacity-90">
                {isAr 
                  ? `${usage.casesCount}/${usage.casesLimit} ملفات • ${usage.clientsCount}/${usage.clientsLimit} عملاء • ${usage.invoicesCount}/${usage.invoicesLimit} فواتير`
                  : `${usage.casesCount}/${usage.casesLimit} dossiers • ${usage.clientsCount}/${usage.clientsLimit} clients • ${usage.invoicesCount}/${usage.invoicesLimit} factures`}
              </p>
            )}
          </div>
        </div>
        <a
          href="mailto:contact@juristdz.com?subject=Activation compte JuristDZ"
          className="px-4 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors"
        >
          {isAr ? 'تفعيل الآن' : 'Activer maintenant'}
        </a>
      </div>
    );
  }

  return null;
};

export default TrialBanner;
