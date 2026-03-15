import React, { useState } from 'react';
import { Calculator, FileSignature, Info, Printer } from 'lucide-react';
import {
  calculateNotarialFees,
  ACT_TYPES_FOR_FEES,
  ActTypeForFees,
  NotarialFeesResult,
} from '../../services/notarialFeesCalculator';
import { Language } from '../../../types';

interface Props { language: Language; }

const formatDA = (n: number) => `${Math.round(n).toLocaleString('fr-DZ')} DA`;

export default function NotarialFeesCalculator({ language }: Props) {
  const isAr = language === 'ar';
  const [actType, setActType] = useState<ActTypeForFees>('vente_immobiliere');
  const [actValue, setActValue] = useState('');
  const [result, setResult] = useState<NotarialFeesResult | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(actValue.replace(/\s/g, ''));
    if (!value || value <= 0) return;
    setResult(calculateNotarialFees(actType, value));
  };

  const handlePrint = () => window.print();

  return (
    <div className={`${isAr ? 'rtl' : 'ltr'} space-y-6`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-900/30 rounded-xl border border-amber-700/50">
          <FileSignature className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="font-bold text-white">
            {isAr ? 'حاسبة الرسوم التوثيقية' : 'Calculateur de Frais Notariaux'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr ? 'وفق قانون التسجيل والمرسوم 97-466' : 'Code de l\'Enregistrement + Décret 97-466'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={handleCalculate} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              {isAr ? 'نوع العقد' : 'Type d\'acte'}
            </label>
            <select
              value={actType}
              onChange={e => { setActType(e.target.value as ActTypeForFees); setResult(null); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
            >
              {Object.entries(ACT_TYPES_FOR_FEES).map(([k, v]) => (
                <option key={k} value={k}>{isAr ? v.ar : v.fr}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              {isAr ? 'قيمة العقد (دج)' : 'Valeur de l\'acte (DA)'}
            </label>
            <input
              type="number"
              value={actValue}
              onChange={e => setActValue(e.target.value)}
              required
              min="1"
              placeholder={isAr ? 'مثال: 5000000' : 'Ex: 5 000 000'}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500"
            />
          </div>

          <div className="flex items-start gap-2 bg-amber-900/10 border border-amber-800/40 rounded-xl p-3">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80">
              {isAr
                ? 'الأرقام تقديرية. تحقق دائماً من الجريدة الرسمية وقانون المالية الجاري.'
                : 'Montants indicatifs. Vérifiez toujours avec la JORA et la loi de finances en vigueur.'}
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            {isAr ? 'احسب الرسوم' : 'Calculer les frais'}
          </button>
        </form>

        {/* Result */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          {!result ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-slate-500">
              <Calculator className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">{isAr ? 'أدخل القيمة واضغط احسب' : 'Saisissez la valeur et calculez'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white text-sm">
                  {isAr ? 'تفصيل الرسوم' : 'Détail des frais'}
                </h3>
                <button onClick={handlePrint} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                {result.breakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 truncate">{isAr ? item.label_ar : item.label_fr}</p>
                      {item.reference && <p className="text-[10px] text-slate-500">{item.reference}</p>}
                    </div>
                    <span className="text-sm font-medium text-white ml-3 shrink-0">{formatDA(item.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-2 border-t border-slate-600">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{isAr ? 'إجمالي الرسوم والضرائب' : 'Total taxes & droits'}</span>
                  <span className="text-white font-medium">{formatDA(result.totalTaxes)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{isAr ? 'أتعاب الموثق (شاملة TVA)' : 'Honoraires notaire (TTC)'}</span>
                  <span className="text-white font-medium">{formatDA(result.notaryHonoraires)}</span>
                </div>
                <div className="flex justify-between items-center bg-amber-900/20 border border-amber-700/50 rounded-xl px-3 py-2.5 mt-2">
                  <span className="font-bold text-amber-300">{isAr ? 'المجموع الكلي' : 'TOTAL GÉNÉRAL'}</span>
                  <span className="font-bold text-amber-300 text-lg">{formatDA(result.grandTotal)}</span>
                </div>
              </div>

              {/* Summary */}
              <p className="text-xs text-slate-400 bg-slate-900/50 rounded-xl p-3 leading-relaxed">
                {isAr ? result.summary_ar : result.summary_fr}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
