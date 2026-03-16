import React, { useState } from 'react';
import { X, FileText, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { CGU_FR, CGU_AR, CGU_VERSION } from '../../legal/cgu';
import { CGV_FR, CGV_AR, CGV_VERSION } from '../../legal/cgv';
import type { Language } from '../../../types';

interface Props {
  language: Language;
  mode: 'signup' | 'payment'; // signup = CGU seules, payment = CGU + CGV
  onAccept: () => void;
  onDecline: () => void;
}

const LegalAcceptanceModal: React.FC<Props> = ({ language, mode, onAccept, onDecline }) => {
  const isAr = language === 'ar';
  const [expandedCGU, setExpandedCGU] = useState(false);
  const [expandedCGV, setExpandedCGV] = useState(false);
  const [checkedCGU, setCheckedCGU] = useState(false);
  const [checkedCGV, setCheckedCGV] = useState(false);
  const [checkedDisclaimer, setCheckedDisclaimer] = useState(false);

  const canAccept = checkedCGU && checkedDisclaimer && (mode === 'signup' || checkedCGV);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-legal-gold/10 rounded-xl">
              <ShieldCheck size={22} className="text-legal-gold" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {isAr ? 'الشروط القانونية' : 'Conditions légales'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'يرجى قراءة والموافقة على الشروط للمتابعة' : 'Veuillez lire et accepter les conditions pour continuer'}
              </p>
            </div>
          </div>
          <button onClick={onDecline} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Content scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Disclaimer IA — toujours visible en premier */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1">
                  {isAr ? 'تحذير مهم — حدود الذكاء الاصطناعي' : 'Avertissement important — Limites de l\'IA'}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  {isAr
                    ? 'JuristDZ هي أداة مساعدة فقط. النتائج التي ينتجها الذكاء الاصطناعي لا تُعدّ استشارة قانونية ولا تحل محل رأي محامٍ أو أي مهني قانوني مؤهل. أنت وحدك المسؤول عن القرارات المتخذة بناءً على هذه المعلومات.'
                    : 'JuristDZ est un outil d\'assistance uniquement. Les résultats produits par l\'IA ne constituent pas un conseil juridique et ne remplacent pas l\'avis d\'un avocat ou d\'un professionnel du droit qualifié. Vous êtes seul responsable des décisions prises sur la base de ces informations.'}
                </p>
              </div>
            </div>
          </div>

          {/* CGU */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedCGU(!expandedCGU)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  {isAr ? `شروط الاستخدام العامة (v${CGU_VERSION})` : `Conditions Générales d'Utilisation (v${CGU_VERSION})`}
                </span>
              </div>
              {expandedCGU ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            {expandedCGU && (
              <div className="border-t dark:border-slate-700 p-4 max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-800/50">
                <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">
                  {isAr ? CGU_AR : CGU_FR}
                </pre>
              </div>
            )}
          </div>

          {/* CGV (seulement pour paiement) */}
          {mode === 'payment' && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedCGV(!expandedCGV)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-slate-500" />
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {isAr ? `الشروط العامة للبيع (v${CGV_VERSION})` : `Conditions Générales de Vente (v${CGV_VERSION})`}
                  </span>
                </div>
                {expandedCGV ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>
              {expandedCGV && (
                <div className="border-t dark:border-slate-700 p-4 max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-800/50">
                  <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">
                    {isAr ? CGV_AR : CGV_FR}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Checkboxes d'acceptation */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                onClick={() => setCheckedCGU(!checkedCGU)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  checkedCGU ? 'bg-legal-gold border-legal-gold' : 'border-slate-300 dark:border-slate-600 group-hover:border-legal-gold'
                }`}
              >
                {checkedCGU && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {isAr
                  ? 'لقد قرأت وأوافق على شروط الاستخدام العامة'
                  : "J'ai lu et j'accepte les Conditions Générales d'Utilisation"}
              </span>
            </label>

            {mode === 'payment' && (
              <label className="flex items-start gap-3 cursor-pointer group">
                <div
                  onClick={() => setCheckedCGV(!checkedCGV)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    checkedCGV ? 'bg-legal-gold border-legal-gold' : 'border-slate-300 dark:border-slate-600 group-hover:border-legal-gold'
                  }`}
                >
                  {checkedCGV && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {isAr
                    ? 'لقد قرأت وأوافق على الشروط العامة للبيع وسياسة الاسترداد'
                    : "J'ai lu et j'accepte les Conditions Générales de Vente et la politique de remboursement"}
                </span>
              </label>
            )}

            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                onClick={() => setCheckedDisclaimer(!checkedDisclaimer)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  checkedDisclaimer ? 'bg-legal-gold border-legal-gold' : 'border-slate-300 dark:border-slate-600 group-hover:border-legal-gold'
                }`}
              >
                {checkedDisclaimer && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {isAr
                  ? 'أفهم أن JuristDZ هي أداة مساعدة فقط ولا تحل محل الاستشارة القانونية المتخصصة'
                  : "Je comprends que JuristDZ est un outil d'assistance et ne remplace pas une consultation juridique professionnelle"}
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t dark:border-slate-800 flex gap-3 flex-shrink-0">
          <button
            onClick={onDecline}
            className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {isAr ? 'رفض' : 'Refuser'}
          </button>
          <button
            onClick={onAccept}
            disabled={!canAccept}
            className="flex-2 flex-grow py-3 bg-legal-gold text-slate-900 rounded-xl font-bold hover:bg-legal-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            {isAr ? 'أوافق وأتابع' : 'J\'accepte et je continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalAcceptanceModal;
