import React, { useEffect, useState } from 'react';
import { CreditCard, Clock, CheckCircle2, XCircle, AlertTriangle, RefreshCw, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppToast } from '../../contexts/ToastContext';
import type { Language } from '../../../types';

interface Props {
  language: Language;
}

interface PaymentOrder {
  id: string;
  user_id: string;
  plan: string;
  amount_dzd: number;
  amount_usd: number;
  gateway: string;
  status: string;
  reference: string | null;
  created_at: string;
  confirmed_at: string | null;
  profiles?: { first_name: string; last_name: string; email: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  failed:    'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const AdminPaymentsPanel: React.FC<Props> = ({ language }) => {
  const isAr = language === 'ar';
  const { toast } = useAppToast();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_orders')
        .select('*, profiles(first_name, last_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      toast(isAr ? 'خطأ في تحميل المدفوعات' : 'Erreur chargement paiements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validatePayment = async (order: PaymentOrder) => {
    if (!confirm(isAr
      ? `تأكيد تفعيل اشتراك ${order.plan} للمستخدم؟`
      : `Confirmer l'activation de l'abonnement ${order.plan} pour cet utilisateur ?`)) return;

    setValidating(order.id);
    try {
      // 1. Marquer la commande comme complétée
      const { error: orderErr } = await supabase
        .from('payment_orders')
        .update({ status: 'completed', confirmed_at: new Date().toISOString() })
        .eq('id', order.id);
      if (orderErr) throw orderErr;

      // 2. Activer l'abonnement (1 mois)
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      const { error: subErr } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: order.user_id,
          plan: order.plan,
          status: 'active',
          payment_method: order.gateway,
          last_payment_ref: order.reference,
          expires_at: expiresAt.toISOString(),
          trial_ends_at: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (subErr) throw subErr;

      toast(isAr ? 'تم تفعيل الاشتراك بنجاح' : 'Abonnement activé avec succès', 'success');
      loadOrders();
    } catch (err: any) {
      toast(isAr ? 'خطأ في التفعيل' : "Erreur lors de l'activation", 'error');
    } finally {
      setValidating(null);
    }
  };

  const rejectPayment = async (orderId: string) => {
    if (!confirm(isAr ? 'رفض هذا الدفع؟' : 'Rejeter ce paiement ?')) return;
    try {
      await supabase.from('payment_orders').update({ status: 'failed' }).eq('id', orderId);
      toast(isAr ? 'تم رفض الدفع' : 'Paiement rejeté', 'success');
      loadOrders();
    } catch {
      toast(isAr ? 'خطأ' : 'Erreur', 'error');
    }
  };

  const filtered = orders.filter(o => filter === 'all' ? true : o.status === filter);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard size={22} className="text-legal-gold" />
            {isAr ? 'إدارة المدفوعات' : 'Gestion des paiements'}
          </h2>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 font-medium mt-1">
              {isAr ? `${pendingCount} دفعة في انتظار التحقق` : `${pendingCount} paiement(s) en attente de validation`}
            </p>
          )}
        </div>
        <button onClick={loadOrders} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <RefreshCw size={18} className={loading ? 'animate-spin text-slate-400' : 'text-slate-400'} />
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {(['pending', 'completed', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === f ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-400'
            }`}
          >
            {f === 'pending'   ? (isAr ? 'قيد الانتظار' : 'En attente') :
             f === 'completed' ? (isAr ? 'مكتملة' : 'Complétés') :
                                 (isAr ? 'الكل' : 'Tous')}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y dark:divide-slate-800">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-legal-gold mx-auto" />
            <p className="mt-3 text-slate-400 text-sm">{isAr ? 'جاري التحميل...' : 'Chargement...'}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
            <p>{isAr ? 'لا توجد مدفوعات' : 'Aucun paiement'}</p>
          </div>
        ) : filtered.map(order => {
          const userName = order.profiles
            ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() || order.profiles.email
            : order.user_id.slice(0, 8);

          return (
            <div key={order.id} className="p-5 flex items-center gap-4">
              {/* Icône statut */}
              <div className="flex-shrink-0">
                {order.status === 'completed' ? <CheckCircle2 size={22} className="text-green-500" /> :
                 order.status === 'pending'   ? <Clock size={22} className="text-amber-500" /> :
                                                <XCircle size={22} className="text-red-500" />}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <User size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{userName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${STATUS_COLORS[order.status] || STATUS_COLORS.cancelled}`}>
                    {order.status === 'pending'   ? (isAr ? 'انتظار' : 'En attente') :
                     order.status === 'completed' ? (isAr ? 'مكتمل' : 'Complété') :
                     order.status === 'failed'    ? (isAr ? 'مرفوض' : 'Rejeté') :
                                                    (isAr ? 'ملغى' : 'Annulé')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="capitalize font-medium">{order.plan} · {order.gateway}</span>
                  <span>{order.amount_dzd.toLocaleString()} DA</span>
                  {order.reference && <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{order.reference}</span>}
                  <span>{new Date(order.created_at).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR')}</span>
                </div>
              </div>

              {/* Actions (seulement pour pending) */}
              {order.status === 'pending' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => validatePayment(order)}
                    disabled={validating === order.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} />
                    {isAr ? 'تفعيل' : 'Valider'}
                  </button>
                  <button
                    onClick={() => rejectPayment(order.id)}
                    disabled={validating === order.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={15} />
                    {isAr ? 'رفض' : 'Rejeter'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPaymentsPanel;
