import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, ArrowUpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Language } from '../../../types';
import SubscriptionPaymentModal from './SubscriptionPaymentModal';

interface Props {
  userId: string;
  language: Language;
}

const SubscriptionExpiryBanner: React.FC<Props> = ({ userId, language }) => {
  const isAr = language === 'ar';
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [plan, setPlan] = useState<'pro' | 'cabinet'>('pro');
  const [dismissed, setDismissed] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status, expires_at')
        .eq('user_id', userId)
        .single();

      if (!data || data.status !== 'active' || !data.expires_at) return;
      // Cabinet avec expiration dans 10 ans = admin, pas de banner
      if (data.plan === 'cabinet') {
        const diff = new Date(data.expires_at).getTime() - Date.now();
        if (diff > 365 * 24 * 60 * 60 * 1000) return; // > 1 an = admin
      }

      const diff = new Date(data.expires_at).getTime() - Date.now();
      const days = Math.ceil(diff / 86400000);

      // Afficher seulement si expiration dans 7 jours ou moins
      if (days <= 7 && days >= 0) {
        setDaysLeft(days);
        setPlan(data.plan as 'pro' | 'cabinet');
      }
    };
    check();
  }, [userId]);

  if (daysLeft === null || dismissed) return null;

  const isUrgent = daysLeft <= 2;

  return (
    <>
      <div
        className={`px-6 py-3 flex items-center justify-between ${isUrgent ? 'bg-red-600' : 'bg-orange-500'} text-white`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="flex-shrink-0" />
          <p className="font-medium text-sm">
            {daysLeft === 0
              ? (isAr ? '⚠️ اشتراكك ينتهي اليوم!' : "⚠️ Votre abonnement expire aujourd'hui !")
              : isAr
                ? `⚠️ اشتراكك ينتهي خلال ${daysLeft} ${daysLeft === 1 ? 'يوم' : 'أيام'}`
                : `⚠️ Votre abonnement expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPayment(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-orange-600 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors"
          >
            <ArrowUpCircle size={15} />
            {isAr ? 'تجديد الآن' : 'Renouveler'}
          </button>
          <button onClick={() => setDismissed(true)} className="p-1 hover:bg-white/20 rounded transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {showPayment && (
        <SubscriptionPaymentModal
          userId={userId}
          plan={plan}
          language={language}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); setDismissed(true); }}
        />
      )}
    </>
  );
};

export default SubscriptionExpiryBanner;
