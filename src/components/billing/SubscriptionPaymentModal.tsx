import React, { useState, useEffect } from 'react';
import {
  X, CreditCard, Smartphone, Check, Loader2,
  ExternalLink, Copy, AlertCircle, CheckCircle2, ArrowLeft
} from 'lucide-react';
import type { Language } from '../../../types';
import { paymentService, PLAN_PRICES, type SubscriptionPlan, type PaymentGateway } from '../../services/paymentService';
import { useAppToast } from '../../contexts/ToastContext';

interface Props {
  userId: string;
  plan: SubscriptionPlan;
  language: Language;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'choose_gateway' | 'paypal_pending' | 'baridimob_instructions' | 'confirm_ref' | 'success';

const SubscriptionPaymentModal: React.FC<Props> = ({ userId, plan, language, onClose, onSuccess }) => {
  const isAr = language === 'ar';
  const { toast } = useAppToast();
  const prices = PLAN_PRICES[plan];

  const [step, setStep] = useState<Step>('choose_gateway');
  const [gateway, setGateway] = useState<PaymentGateway | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [baridimobInfo, setBaridimobInfo] = useState<ReturnType<typeof paymentService.getBaridiMobInstructions> | null>(null);
  const [copied, setCopied] = useState(false);

  // Détecter retour PayPal via URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const gw = params.get('gateway');
    const oid = params.get('orderId');
    const pl = params.get('plan');

    if (payment === 'success' && gw === 'paypal' && oid && pl) {
      setGateway('paypal');
      setOrderId(oid);
      setStep('confirm_ref');
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSelectGateway = async (gw: PaymentGateway) => {
    setLoading(true);
    setGateway(gw);
    try {
      const result = await paymentService.createOrder(userId, plan, gw);
      if (!result.success || !result.orderId) throw new Error(result.error);
      setOrderId(result.orderId);

      if (gw === 'paypal') {
        const url = paymentService.initiatePayPal(pla
n, result.orderId);
        window.open(url, '_blank');
        setStep('paypal_pending');
      } else {
        const info = paymentService.getBaridiMobInstructions(plan, result.orderId);
        setBaridimobInfo(info);
        setStep('baridimob_instructions');
      }
    } catch (err: any) {
      toast(isAr ? 'خطأ في إنشاء الطلب' : 'Erreur lors de la création de la commande', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!transactionRef.trim()) {
      toast(isAr ? 'يرجى إدخال رقم المعاملة' : 'Veuillez entrer le numéro de transaction', 'warning');
      return;
    }
    if (!orderId || !gateway) return;
    setLoading(true);
    try {
      const result = await paymentService.confirmPayment(orderId, userId, plan, gateway, transactionRef.trim());
      if (!result.success) throw new Error(result.error);
      setStep('success');
      setTimeout(() => { onSuccess(); onClose(); }, 2500);
    } catch (err: any) {
      toast(isAr ? 'خطأ في تأكيد الدفع' : 'Erreur lors de la confirmation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-800">
          <div className="flex items-center gap-3">
            {step !== 'choose_gateway' && step !== 'success' && (
              <button onClick={() => setStep('choose_gateway')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="font-bold text-lg">
                {isAr ? 'تفعيل الاشتراك' : 'Activer l\'abonnement'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? `خطة ${prices.label}` : `Plan ${prices.label}`} — {prices.dzd.toLocaleString()} DA/mois
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">

          {/* STEP 1 — Choisir la passerelle */}
          {step === 'choose_gateway' && (
            <div className="space-y-4">
              <p className={`text-sm text-slate-500 dark:text-slate-400 mb-4`}>
                {isAr ? 'اختر طريقة الدفع:' : 'Choisissez votre mode de paiement :'}
              </p>

              {/* PayPal */}
              <button
                onClick={() => handleSelectGateway('paypal')}
                disabled={loading}
                className="w-full flex items-center gap-4 p-4 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 rounded-2xl hover:border-blue-400 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-[#003087] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200">PayPal</p>
                  <p className="text-xs text-slate-500">{isAr ? 'دفع دولي آمن' : 'Paiement international sécurisé'} — ${prices.usd} USD</p>
                </div>
                {loading && gateway === 'paypal' ? <Loader2 size={18} className="animate-spin text-blue-500" /> : <ExternalLink size={18} className="text-slate-400 group-hover:text-blue-500" />}
              </button>

              {/* BaridiMob */}
              <button
                onClick={() => handleSelectGateway('baridimob')}
                disabled={loading}
                className="w-full flex items-center gap-4 p-4 border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 rounded-2xl hover:border-green-400 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Smartphone size={22} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200">BaridiMob</p>
                  <p className="text-xs text-slate-500">{isAr ? 'تحويل بريدي موب — الجزائر' : 'Virement BaridiMob — Algérie'} — {prices.dzd.toLocaleString()} DA</p>
                </div>
                {loading && gateway === 'baridimob' ? <Loader2 size={18} className="animate-spin text-green-500" /> : <CreditCard size={18} className="text-slate-400 group-hover:text-green-500" />}
              </button>

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-500">
                <AlertCircle size={14} className="flex-shrink-0" />
                {isAr
                  ? 'جميع المدفوعات آمنة. سيتم تفعيل حسابك فور التحقق من الدفع.'
                  : 'Tous les paiements sont sécurisés. Votre compte sera activé dès vérification du paiement.'}
              </div>
            </div>
          )}

          {/* STEP 2a — PayPal en attente */}
          {step === 'paypal_pending' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink size={28} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">
                  {isAr ? 'أكمل الدفع على PayPal' : 'Complétez le paiement sur PayPal'}
                </h3>
                <p className="text-sm text-slate-500">
                  {isAr
                    ? 'تم فتح نافذة PayPal. بعد الدفع، ستعود تلقائياً لهذه الصفحة.'
                    : 'La fenêtre PayPal a été ouverte. Après le paiement, vous serez redirigé automatiquement.'}
                </p>
              </div>
              <button
                onClick={() => setStep('confirm_ref')}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                {isAr ? 'لقد أتممت الدفع ←' : 'J\'ai effectué le paiement →'}
              </button>
            </div>
          )}

          {/* STEP 2b — Instructions BaridiMob */}
          {step === 'baridimob_instructions' && baridimobInfo && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-green-800 dark:text-green-300">
                    {isAr ? 'تفاصيل التحويل' : 'Détails du virement'}
                  </p>
                  <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-mono">
                    {baridimobInfo.reference}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isAr ? 'المبلغ:' : 'Montant :'}</span>
                    <span className="font-bold text-green-700 dark:text-green-400">{baridimobInfo.amount.toLocaleString()} DA</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">{isAr ? 'رقم الحساب:' : 'RIB :'}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{baridimobInfo.rib}</span>
                      <button onClick={() => copyToClipboard(baridimobInfo.rib)} className="p-1 hover:bg-green-100 dark:hover:bg-green-900/50 rounded">
                        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-slate-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isAr ? 'المرجع:' : 'Référence :'}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">{baridimobInfo.reference}</span>
                      <button onClick={() => copyToClipboard(baridimobInfo.reference)} className="p-1 hover:bg-green-100 dark:hover:bg-green-900/50 rounded">
                        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-slate-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{isAr ? 'خطوات التحويل:' : 'Étapes :'}</p>
                {(isAr ? baridimobInfo.steps_ar : baridimobInfo.steps).map((step, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="w-5 h-5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">{step}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep('confirm_ref')}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                {isAr ? 'لقد أجريت التحويل ←' : 'J\'ai effectué le virement →'}
              </button>
            </div>
          )}

          {/* STEP 3 — Confirmer la référence */}
          {step === 'confirm_ref' && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <h3 className="font-bold text-lg mb-1">
                  {isAr ? 'أدخل رقم المعاملة' : 'Entrez le numéro de transaction'}
                </h3>
                <p className="text-sm text-slate-500">
                  {gateway === 'paypal'
                    ? (isAr ? 'رقم معاملة PayPal (يبدأ بـ PAYID أو TXN)' : 'Numéro de transaction PayPal (commence par PAYID ou TXN)')
                    : (isAr ? 'رقم معاملة BaridiMob المرسل إليك برسالة SMS' : 'Numéro de transaction BaridiMob reçu par SMS')}
                </p>
              </div>

              <input
                type="text"
                value={transactionRef}
                onChange={e => setTransactionRef(e.target.value)}
                placeholder={gateway === 'paypal' ? 'PAYID-XXXXXXXXXXXXXXXX' : 'BM-XXXXXXXXXX'}
                className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none font-mono text-sm"
                autoFocus
              />

              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                {isAr
                  ? 'سيتم التحقق من الدفع خلال 24 ساعة. ستتلقى إشعاراً بالبريد الإلكتروني عند التفعيل.'
                  : 'Le paiement sera vérifié sous 24h. Vous recevrez un email de confirmation à l\'activation.'}
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={loading || !transactionRef.trim()}
                className="w-full py-3 bg-legal-gold text-slate-900 rounded-xl font-bold hover:bg-legal-gold/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {isAr ? 'تأكيد الدفع' : 'Confirmer le paiement'}
              </button>
            </div>
          )}

          {/* STEP 4 — Succès */}
          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <h3 className="font-bold text-xl text-green-700 dark:text-green-400">
                {isAr ? 'تم تفعيل اشتراكك!' : 'Abonnement activé !'}
              </h3>
              <p className="text-sm text-slate-500">
                {isAr
                  ? `مرحباً بك في خطة ${prices.label}. يمكنك الآن الاستفادة من جميع الميزات.`
                  : `Bienvenue dans le plan ${prices.label}. Vous pouvez maintenant profiter de toutes les fonctionnalités.`}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SubscriptionPaymentModal;
