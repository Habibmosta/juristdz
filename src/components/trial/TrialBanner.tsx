import React, { useState } from 'react';
import { Clock, AlertTriangle, XCircle } from 'lucide-react';
import { useAccountStatus } from '../../hooks/useAccountStatus';
import { useAuth } from '../../hooks/useAuth';
import type { Language } from '../../types';
import SubscriptionPaymentModal from '../billing/SubscriptionPaymentModal';

interface TrialBannerProps {
  language: Language;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ language }) => {
  const { accountStatus, loading } = useAccountStatus();
  const { profile } = useAuth();
  const isAr = language === 'ar';
  const [showPayment, setShowPayment] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<'pro' | 'cabinet'>('pro');

  if (loading || !accountStatus || !profile) return null;
  if (accountStatus.status === 'active') return null;

  const openPayment = (plan: 'pro' | 'cabinet' = 'pro') => {
    setPaymentPlan(plan);
    setShowPayment(true);
  };

  // Compte bloqué
  if (accountStatus.status === 'blocked') {
    return (
      <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3">
          <XCircle size={20} />
          <div>
            <p className="font-bold">{isAr ? '⛔ حسابك محظور' : '⛔ Compte bloqué'}</p>
            {accountStatus.suspensionReason && <p className="text-sm opacity-90">{accountStatus.suspensionReason}</p>}
          </div>
        </div>
        <a href="mailto:contact@juristdz.com" className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors">
          {isAr ? 'اتصل بنا' : 'Nous contacter'}
        </a>
      </div>
    );
  }

  // Compte suspendu — essai expiré
  if (accountStatus.status === 'suspended') {
    return (
      <>
        <div className="bg-orange-600 text-white px-6 py-3 flex items-center justify-between" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} />
            <div>
              <p className="font-bold">{isAr ? '⚠️ انتهت فترة التجربة' : '⚠️ Essai terminé'}</p>
              <p className="text-sm opacity-90">
                {isAr ? 'حسابك في وضع القراءة فقط. فعّل اشتراكك للمتابعة.' : 'Votre compte est en lecture seule. Activez votre abonnement pour continuer.'}
              </p>
            </div>
          </div>
          <button onClick={() => openPayment('pro')} className="px-4 py-2 bg-white text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition-colors">
            {isAr ? 'تفعيل الاشتراك' : 'Activer mon abonnement'}
          </button>
        </div>
        {showPayment && (
          <SubscriptionPaymentModal userId={profile.id} plan={paymentPlan} language={language}
            onClose={() => setShowPayment(false)} onSuccess={() => { setShowPayment(false); window.location.reload(); }} />
        )}
      </>
    );
  }

  // Compte en essai
  if (accountStatus.status === 'trial') {
    const { daysRemaining, usage } = accountStatus;
    const isExpiringSoon = daysRemaining <= 2;

    return (
      <>
        <div
          className={`px-6 py-3 flex items-center justify-between ${isExpiringSoon ? 'bg-orange-500' : 'bg-blue-600'} text-white`}
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
                    ? `${usage.casesCount}/${usage.casesLimit} ملفات • ${usage.clientsCount}/${usage.clientsLimit} عملاء`
                    : `${usage.casesCount}/${usage.casesLimit} dossiers • ${usage.clientsCount}/${usage.clientsLimit} clients`}
                </p>
              )}
            </div>
          </div>
          <button onClick={() => openPayment('pro')} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition-colors">
            {isAr ? 'تفعيل الآن' : 'Activer maintenant'}
          </button>
        </div>
        {showPayment && (
          <SubscriptionPaymentModal userId={profile.id} plan={paymentPlan} language={language}
            onClose={() => setShowPayment(false)} onSuccess={() => { setShowPayment(false); window.location.reload(); }} />
        )}
      </>
    );
  }

  return null;
};

export default TrialBanner;
