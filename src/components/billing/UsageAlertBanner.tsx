import React, { useEffect, useState } from 'react';
import { AlertTriangle, Zap, X, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Language } from '../../../types';
import SubscriptionPaymentModal from './SubscriptionPaymentModal';

interface Props {
  userId: string;
  plan: string;
  language: Language;
}

interface AlertInfo {
  type: 'credits_low' | 'credits_empty' | 'quota_daily' | 'quota_monthly';
  level: 'warning' | 'critical' | 'exceeded';
  current: number;
  limit: number;
}

// Limites par plan (synchronisées avec PLAN_LIMITS dans usageLimitService)
const DAILY_LIMITS: Record<string, number> = { free: 10, pro: 100, cabinet: -1 };
const MONTHLY_LIMITS: Record<string, number> = { free: 100, pro: 1000, cabinet: -1 };
const CREDIT_LIMITS: Record<string, number> = { free: 50, pro: 500, cabinet: -1 };

const UsageAlertBanner: React.FC<Props> = ({ userId, plan, language }) => {
  const isAr = language === 'ar';
  const [alert, setAlert] = useState<AlertInfo | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    // Admin et plan cabinet = illimité, pas de banner
    if (plan === 'cabinet' || plan === 'admin') return;
    checkUsage();
    const interval = setInterval(checkUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, plan]);

  const checkUsage = async () => {
    if (plan === 'cabinet') return; // Cabinet = illimité

    try {
      const { data: stats } = await supabase
        .from('usage_stats')
        .select('credits_used_today, credits_used_this_month')
        .eq('user_id', userId)
        .single();

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('credits_remaining')
        .eq('user_id', userId)
        .single();

      const dailyLimit = DAILY_LIMITS[plan] ?? 10;
      const monthlyLimit = MONTHLY_LIMITS[plan] ?? 100;
      const creditLimit = CREDIT_LIMITS[plan] ?? 50;

      const usedToday = stats?.credits_used_today ?? 0;
      const usedMonth = stats?.credits_used_this_month ?? 0;
      const creditsLeft = sub?.credits_remaining ?? creditLimit;

      // Priorité : crédits épuisés > quota dépassé > critique > warning
      if (creditsLeft <= 0) {
        setAlert({ type: 'credits_empty', level: 'exceeded', current: 0, limit: creditLimit });
      } else if (creditsLeft <= Math.max(5, creditLimit * 0.1)) {
        setAlert({ type: 'credits_low', level: 'critical', current: creditsLeft, limit: creditLimit });
      } else if (dailyLimit > 0 && usedToday >= dailyLimit) {
        setAlert({ type: 'quota_daily', level: 'exceeded', current: usedToday, limit: dailyLimit });
      } else if (dailyLimit > 0 && usedToday >= dailyLimit * 0.9) {
        setAlert({ type: 'quota_daily', level: 'warning', current: usedToday, limit: dailyLimit });
      } else if (monthlyLimit > 0 && usedMonth >= monthlyLimit * 0.9) {
        setAlert({ type: 'quota_monthly', level: 'critical', current: usedMonth, limit: monthlyLimit });
      } else {
        setAlert(null);
      }
    } catch {
      // Silencieux — ne pas bloquer l'UI si la vérification échoue
    }
  };

  if (!alert || dismissed === alert.type + alert.level) return null;

  const isExceeded = alert.level === 'exceeded';
  const isCritical = alert.level === 'critical';

  const bgColor = isExceeded ? 'bg-red-600' : isCritical ? 'bg-orange-500' : 'bg-amber-400';
  const textColor = isExceeded || isCritical ? 'text-white' : 'text-amber-900';
  const btnColor = isExceeded || isCritical ? 'bg-white text-red-600' : 'bg-amber-900 text-white';

  const getMessage = () => {
    const pct = alert.limit > 0 ? Math.round((alert.current / alert.limit) * 100) : 100;
    switch (alert.type) {
      case 'credits_empty':
        return isAr
          ? '🚨 لقد استنفدت جميع أرصدتك. قم بترقية خطتك للمتابعة.'
          : '🚨 Vos crédits sont épuisés. Passez à un plan supérieur pour continuer.';
      case 'credits_low':
        return isAr
          ? `⚠️ ${alert.current} رصيد متبقٍ فقط (${100 - pct}% متبقٍ). قم بالترقية قريباً.`
          : `⚠️ Plus que ${alert.current} crédit(s) restant(s). Pensez à renouveler.`;
      case 'quota_daily':
        return isExceeded
          ? (isAr ? `🚨 تم استنفاد حصتك اليومية (${alert.current}/${alert.limit}). تجديد غداً.` : `🚨 Quota journalier atteint (${alert.current}/${alert.limit}). Renouvellement demain.`)
          : (isAr ? `⚠️ ${alert.current}/${alert.limit} طلب اليوم — الحصة اليومية على وشك الانتهاء.` : `⚠️ ${alert.current}/${alert.limit} requêtes aujourd'hui — quota journalier presque atteint.`);
      case 'quota_monthly':
        return isAr
          ? `🚨 ${alert.current}/${alert.limit} طلب هذا الشهر — الحصة الشهرية على وشك الانتهاء.`
          : `🚨 ${alert.current}/${alert.limit} requêtes ce mois — quota mensuel presque atteint.`;
    }
  };

  const canUpgrade = plan === 'free' || plan === 'pro';
  const upgradePlan: 'pro' | 'cabinet' = plan === 'free' ? 'pro' : 'cabinet';

  return (
    <>
      <div className={`${bgColor} ${textColor} px-6 py-2.5 flex items-center justify-between gap-4`} dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isExceeded ? <Zap size={16} className="flex-shrink-0" /> : <AlertTriangle size={16} className="flex-shrink-0" />}
          <p className="text-sm font-medium truncate">{getMessage()}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quota daily exceeded — juste attendre demain */}
          {alert.type === 'quota_daily' && isExceeded ? (
            <span className="text-xs opacity-80">{isAr ? 'يتجدد غداً' : 'Renouvellement demain'}</span>
          ) : canUpgrade ? (
            <button
              onClick={() => setShowPayment(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 ${btnColor} rounded-lg text-xs font-bold hover:opacity-90 transition-opacity`}
            >
              <ArrowUpCircle size={13} />
              {isAr ? 'ترقية' : 'Upgrader'}
            </button>
          ) : (
            <button
              onClick={checkUsage}
              className={`flex items-center gap-1.5 px-3 py-1.5 ${btnColor} rounded-lg text-xs font-bold hover:opacity-90 transition-opacity`}
            >
              <RefreshCw size={13} />
              {isAr ? 'تحديث' : 'Actualiser'}
            </button>
          )}
          <button
            onClick={() => setDismissed(alert.type + alert.level)}
            className="p-1 hover:bg-black/10 rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {showPayment && (
        <SubscriptionPaymentModal
          userId={userId}
          plan={upgradePlan}
          language={language}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); setAlert(null); }}
        />
      )}
    </>
  );
};

export default UsageAlertBanner;
