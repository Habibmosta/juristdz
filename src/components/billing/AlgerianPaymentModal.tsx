import React, { useState } from 'react';
import { CreditCard, Smartphone, Building2, Check, X, Loader2, AlertCircle } from 'lucide-react';
import type { Language } from '../../../types';
import { useAppToast } from '../../contexts/ToastContext';

interface AlgerianPaymentModalProps {
  language: Language;
  invoiceNumber: string;
  amount: number;
  clientName: string;
  onConfirm: (method: PaymentMethod, reference: string) => Promise<void>;
  onClose: () => void;
}

type PaymentMethod = 'cib' | 'edahabia' | 'baridimob' | 'virement' | 'especes' | 'cheque';

const METHODS: { id: PaymentMethod; labelFr: string; labelAr: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { id: 'cib',       labelFr: 'Carte CIB',      labelAr: 'بطاقة CIB',      icon: <CreditCard size={20} />,  color: 'border-blue-400 bg-blue-50 dark:bg-blue-950/30',    desc: 'Carte Interbancaire Algérienne' },
  { id: 'edahabia',  labelFr: 'Edahabia',        labelAr: 'الذهبية',         icon: <CreditCard size={20} />,  color: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30', desc: 'Carte Algérie Poste' },
  { id: 'baridimob', labelFr: 'BaridiMob',       labelAr: 'بريدي موب',       icon: <Smartphone size={20} />, color: 'border-green-400 bg-green-50 dark:bg-green-950/30',  desc: 'Paiement mobile Algérie Poste' },
  { id: 'virement',  labelFr: 'Virement bancaire',labelAr: 'تحويل بنكي',     icon: <Building2 size={20} />,  color: 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30', desc: 'Virement CCP / Banque' },
  { id: 'especes',   labelFr: 'Espèces',         labelAr: 'نقداً',           icon: <span className="text-lg">💵</span>, color: 'border-slate-300 bg-slate-50 dark:bg-slate-800', desc: 'Paiement en liquide' },
  { id: 'cheque',    labelFr: 'Chèque',          labelAr: 'شيك',             icon: <span className="text-lg">📄</span>, color: 'border-slate-300 bg-slate-50 dark:bg-slate-800', desc: 'Chèque bancaire ou CCP' },
];

const AlgerianPaymentModal: React.FC<AlgerianPaymentModalProps> = ({
  language, invoiceNumber, amount, clientName, onConfirm, onClose
}) => {
  const isAr = language === 'ar';
  const { toast } = useAppToast();
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);

  const formatAmount = (n: number) =>
    new Intl.NumberFormat('fr-DZ', { style: 'decimal', minimumFractionDigits: 2 }).format(n) + ' DA';

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await onConfirm(selected, reference);
      toast(isAr ? 'تم تسجيل الدفع بنجاح' : 'Paiement enregistré avec succès', 'success');
      onClose();
    } catch {
      toast(isAr ? 'خطأ في تسجيل الدفع' : 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-800">
          <div>
            <h2 className="font-bold text-lg">{isAr ? 'تسجيل الدفع' : 'Enregistrer le paiement'}</h2>
            <p className="text-xs text-slate-500">{invoiceNumber} · {clientName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Amount */}
          <div className="bg-legal-gold/10 border border-legal-gold/30 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">{isAr ? 'المبلغ المستحق' : 'Montant à encaisser'}</p>
            <p className="text-3xl font-bold text-legal-gold">{formatAmount(amount)}</p>
          </div>

          {/* Payment methods */}
          <div>
            <p className="text-sm font-medium mb-2">{isAr ? 'طريقة الدفع:' : 'Mode de paiement :'}</p>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                    selected === m.id
                      ? `${m.color} border-opacity-100 ring-2 ring-legal-gold ring-offset-1`
                      : `${m.color} border-opacity-50 hover:border-opacity-100`
                  }`}
                >
                  <span className="text-slate-600 dark:text-slate-300">{m.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{isAr ? m.labelAr : m.labelFr}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">{m.desc}</p>
                  </div>
                  {selected === m.id && <Check size={14} className="ml-auto text-legal-gold flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Reference */}
          {selected && !['especes'].includes(selected) && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {isAr ? 'رقم المرجع / التحويل' : 'Référence / N° de transaction'}
                <span className="text-slate-400 text-xs ml-1">({isAr ? 'اختياري' : 'optionnel'})</span>
              </label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder={selected === 'cib' ? 'Ex: TXN-2026-XXXXX' : selected === 'baridimob' ? 'Ex: BM-XXXXXXXX' : 'Référence...'}
                className="w-full px-4 py-2 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none text-sm"
              />
            </div>
          )}

          {/* Info CIB/Edahabia */}
          {(selected === 'cib' || selected === 'edahabia') && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-xs text-blue-700 dark:text-blue-300">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              {isAr
                ? 'تأكد من استلام إشعار الدفع من البنك قبل تأكيل الفاتورة.'
                : 'Vérifiez la réception de la confirmation bancaire avant de valider.'}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border dark:border-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected || loading}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {isAr ? 'تأكيد الدفع' : 'Confirmer le paiement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlgerianPaymentModal;
