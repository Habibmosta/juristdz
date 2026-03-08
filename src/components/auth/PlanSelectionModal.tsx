import React, { useState } from 'react';
import { Check, X, Sparkles, Users } from 'lucide-react';

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: 'free' | 'pro' | 'cabinet') => void;
  isAr?: boolean;
}

export const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  isAr = false
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'cabinet'>('pro');

  if (!isOpen) return null;

  const handleContinue = () => {
    onSelectPlan(selectedPlan);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isAr ? 'اختر خطتك' : 'Choisissez votre plan'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {isAr 
              ? 'ابدأ بخطة مجانية أو جرب Pro مجانًا لمدة 7 أيام'
              : 'Commencez avec un plan gratuit ou essayez Pro gratuitement pendant 7 jours'}
          </p>
        </div>

        {/* Plans */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan Gratuit */}
          <div
            onClick={() => setSelectedPlan('free')}
            className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
              selectedPlan === 'free'
                ? 'border-slate-500 bg-slate-50 dark:bg-slate-800/50'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            {selectedPlan === 'free' && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {isAr ? 'مجاني' : 'Gratuit'}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">0</span>
                <span className="text-slate-600 dark:text-slate-400">
                  {isAr ? 'دج/شهر' : 'DZD/mois'}
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? '50 رصيد/شهر' : '50 crédits/mois'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? '10 رصيد/يوم' : '10 crédits/jour'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? 'بحث قانوني' : 'Recherche juridique'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? 'ملف واحد' : '1 dossier'}
                </span>
              </li>
            </ul>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'مجاني للأبد' : 'Gratuit pour toujours'}
            </p>
          </div>

          {/* Plan Pro - RECOMMANDÉ */}
          <div
            onClick={() => setSelectedPlan('pro')}
            className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
              selectedPlan === 'pro'
                ? 'border-legal-gold bg-legal-gold/5 dark:bg-legal-gold/10'
                : 'border-slate-200 dark:border-slate-700 hover:border-legal-gold/50'
            }`}
          >
            {/* Badge Recommandé */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="bg-legal-gold text-slate-900 px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {isAr ? 'موصى به' : 'RECOMMANDÉ'}
              </div>
            </div>

            {selectedPlan === 'pro' && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-legal-gold rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-slate-900" />
                </div>
              </div>
            )}

            <div className="mb-4 mt-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {isAr ? 'برو' : 'Pro'}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">15,000</span>
                <span className="text-slate-600 dark:text-slate-400">
                  {isAr ? 'دج/شهر' : 'DZD/mois'}
                </span>
              </div>
              <p className="text-sm text-legal-gold font-semibold mt-1">
                {isAr ? '🎁 تجربة مجانية لمدة 7 أيام' : '🎁 Essai gratuit 7 jours'}
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-legal-gold flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {isAr ? '500 رصيد/شهر' : '500 crédits/mois'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-legal-gold flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {isAr ? '100 رصيد/يوم' : '100 crédits/jour'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-legal-gold flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? 'جميع الميزات' : 'Toutes les fonctionnalités'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-legal-gold flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? 'ملفات غير محدودة' : 'Dossiers illimités'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-legal-gold flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? 'صياغة تلقائية' : 'Rédaction automatique'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-legal-gold flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? 'تحليل الاجتهاد القضائي' : 'Analyse jurisprudence'}
                </span>
              </li>
            </ul>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr 
                ? 'بطاقة مطلوبة (لن يتم الخصم خلال الفترة التجريبية)'
                : 'Carte requise (pas débitée pendant l\'essai)'}
            </p>
          </div>

          {/* Plan Cabinet */}
          <div
            onClick={() => setSelectedPlan('cabinet')}
            className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
              selectedPlan === 'cabinet'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          >
            {selectedPlan === 'cabinet' && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {isAr ? 'مكتب' : 'Cabinet'}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">50,000</span>
                <span className="text-slate-600 dark:text-slate-400">
                  {isAr ? 'دج/شهر' : 'DZD/mois'}
                </span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-1">
                {isAr ? '🎁 تجربة مجانية لمدة 7 أيام' : '🎁 Essai gratuit 7 jours'}
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {isAr ? 'أرصدة غير محدودة' : 'Crédits illimités'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {isAr ? 'مستخدمون متعددون' : 'Multi-utilisateurs'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? 'دعم ذو أولوية' : 'Support prioritaire'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? 'تدريب مدرج' : 'Formation incluse'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? 'مدير حساب مخصص' : 'Gestionnaire dédié'}
                </span>
              </li>
            </ul>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr 
                ? 'مثالي للمكاتب الكبيرة'
                : 'Idéal pour les grands cabinets'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {selectedPlan === 'free' ? (
                isAr ? 'لا حاجة لبطاقة ائتمان' : 'Aucune carte requise'
              ) : (
                isAr 
                  ? 'يمكنك الإلغاء في أي وقت خلال الفترة التجريبية'
                  : 'Annulez à tout moment pendant l\'essai'
              )}
            </div>
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-legal-gold hover:bg-legal-gold/90 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              {isAr ? 'متابعة' : 'Continuer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
