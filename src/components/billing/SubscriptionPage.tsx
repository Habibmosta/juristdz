import React, { useEffect, useState } from 'react';
import { CreditCard, Calendar, CheckCircle2, Clock, AlertTriangle, RefreshCw, ArrowUpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Language } from '../../../types';
import SubscriptionPaymentModal from './SubscriptionPaymentModal';

interface Props {
  userId: string;
  language: Language;
}

interface SubscriptionData {
  plan: string;
  status: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  payment_method: string | null;
  last_payment_ref: string | null;
}

interface PaymentOrder {
  id: string;
  plan: string;
  amount_dzd: number;
  amount_usd: number;
  gateway: string;
  status: string;
  reference: string | null;
  created_at: string;
  confirmed_at: string | null;
}

const PLAN_LABELS: Record<string, { fr: string; ar: string; price: string }> = {
  free:    { fr: 'Gratuit',  ar: 'مجاني',    price: '0 DA' },
  pro:     { fr: 'Pro',      ar: 'برو',       price: '15 000 DA/mois' },
  cabinet: { fr: 'Cabinet',  ar: 'مكتب',      price: '50 000 DA/mois' },
};

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  trial:     'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  suspended: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  blocked:   'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  failed:    'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  cancelled: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
};

const SubscriptionPage: React.FC<Props> = ({ userId, language }) => {
  const isAr = language === 'ar';
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [renewPlan, setRenewPlan] = useState<'pro' | 'cabinet'>('pro');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subRes, ordersRes] = await Promise.all([
        supabase.from('subscriptions').select('plan, status, expires_at, trial_ends_at, payment_method, last_payment_ref').eq('user_id', userId).single(),
        supabase.from('payment_orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      ]);
      if (subRes.data) setSubscription(subRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
    } catch {}
    setLoading(false);
  };

  const openRenew = (plan: 'pro' | 'cabinet') => {
    setRenewPlan(plan);
    setShowPayment(true);
  };

  const getDaysRemaining = (dateStr: string | null) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-legal-gold"></div>
      </div>
    );
  }

  const plan = subscription?.plan || 'free';
  const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.free;
  const expiresAt = subscription?.expires_at || subscription?.trial_ends_at;
  const daysLeft = getDaysRemaining(expiresAt);
  const isTrial = subscription?.status === 'trial';
  const isActive = subscription?.status === 'active';
  const isPaid = plan !== 'free';

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
        <CreditCard size={28} className="text-legal-gold" />
        {isAr ? 'اشتراكي' : 'Mon abonnement'}
      </h1>

      {/* Carte plan actuel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">{isAr ? 'الخطة الحالية' : 'Plan actuel'}</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {isAr ? planInfo.ar : planInfo.fr}
            </h2>
            <p className="text-legal-gold font-semibold mt-1">{planInfo.price}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[subscription?.status || 'free'] || STATUS_COLORS.cancelled}`}>
            {isTrial
              ? (isAr ? 'تجريبي' : 'ESSAI')
              : isActive
                ? (isAr ? 'نشط' : 'ACTIF')
                : (isAr ? 'غير نشط' : 'INACTIF')}
          </span>
        </div>

        {/* Expiration */}
        {expiresAt && daysLeft !== null && (
          <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${
            daysLeft <= 3 ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800' :
            daysLeft <= 7 ? 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800' :
            'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
          }`}>
            {daysLeft <= 7 ? <AlertTriangle size={16} className="text-orange-500 flex-shrink-0" /> : <Calendar size={16} className="text-slate-400 flex-shrink-0" />}
            <div className="text-sm">
              <span className="font-medium">
                {isTrial
                  ? (isAr ? 'تنتهي التجربة في:' : "L'essai expire le :")
                  : (isAr ? 'ينتهي الاشتراك في:' : "L'abonnement expire le :")}
              </span>
              {' '}
              <span className={daysLeft <= 3 ? 'text-red-600 font-bold' : daysLeft <= 7 ? 'text-orange-600 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                {new Date(expiresAt).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR')}
                {' '}({daysLeft === 0
                  ? (isAr ? 'اليوم' : "aujourd'hui")
                  : `${daysLeft} ${isAr ? 'يوم' : 'jour' + (daysLeft > 1 ? 's' : '')}`})
              </span>
            </div>
          </div>
        )}

        {/* Méthode de paiement */}
        {subscription?.payment_method && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <CreditCard size={14} />
            {isAr ? 'طريقة الدفع:' : 'Méthode :'} <span className="font-medium capitalize">{subscription.payment_method}</span>
            {subscription.last_payment_ref && (
              <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {subscription.last_payment_ref}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          {isPaid && (
            <button
              onClick={() => openRenew(plan as 'pro' | 'cabinet')}
              className="flex items-center gap-2 px-4 py-2 bg-legal-gold text-slate-900 rounded-xl font-bold hover:bg-legal-gold/90 transition-colors"
            >
              <RefreshCw size={16} />
              {isAr ? 'تجديد الاشتراك' : 'Renouveler'}
            </button>
          )}
          {plan === 'pro' && (
            <button
              onClick={() => openRenew('cabinet')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white dark:bg-slate-700 rounded-xl font-bold hover:bg-slate-700 transition-colors"
            >
              <ArrowUpCircle size={16} />
              {isAr ? 'الترقية إلى Cabinet' : 'Passer à Cabinet'}
            </button>
          )}
          {plan === 'free' && (
            <>
              <button
                onClick={() => openRenew('pro')}
                className="flex items-center gap-2 px-4 py-2 bg-legal-gold text-slate-900 rounded-xl font-bold hover:bg-legal-gold/90 transition-colors"
              >
                <ArrowUpCircle size={16} />
                {isAr ? 'الاشتراك في Pro' : 'Passer à Pro'}
              </button>
              <button
                onClick={() => openRenew('cabinet')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white dark:bg-slate-700 rounded-xl font-bold hover:bg-slate-700 transition-colors"
              >
                <ArrowUpCircle size={16} />
                {isAr ? 'الاشتراك في Cabinet' : 'Passer à Cabinet'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Historique des paiements */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-5 border-b dark:border-slate-800">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Clock size={18} className="text-slate-400" />
            {isAr ? 'سجل المدفوعات' : 'Historique des paiements'}
          </h3>
        </div>
        <div className="divide-y dark:divide-slate-800">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">{isAr ? 'لا توجد مدفوعات بعد' : 'Aucun paiement pour le moment'}</p>
            </div>
          ) : orders.map(order => (
            <div key={order.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {order.status === 'completed'
                  ? <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                  : order.status === 'pending'
                    ? <Clock size={18} className="text-amber-500 flex-shrink-0" />
                    : <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />}
                <div>
                  <p className="font-medium text-sm text-slate-800 dark:text-slate-200">
                    {isAr ? `خطة ${order.plan}` : `Plan ${order.plan}`} — {order.gateway}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR')}
                    {order.reference && <span className="ml-2 font-mono">{order.reference}</span>}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-sm">{order.amount_dzd.toLocaleString()} DA</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[order.status] || STATUS_COLORS.cancelled}`}>
                  {order.status === 'completed' ? (isAr ? 'مكتمل' : 'Complété') :
                   order.status === 'pending'   ? (isAr ? 'قيد الانتظار' : 'En attente') :
                   order.status === 'failed'    ? (isAr ? 'فشل' : 'Échoué') :
                                                  (isAr ? 'ملغى' : 'Annulé')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPayment && (
        <SubscriptionPaymentModal
          userId={userId}
          plan={renewPlan}
          language={language}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); loadData(); }}
        />
      )}
    </div>
  );
};

export default SubscriptionPage;
