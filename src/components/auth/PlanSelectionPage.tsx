import React, { useState } from 'react';
import { Check, Zap, Users, Shield, Clock, TrendingUp } from 'lucide-react';

interface PlanSelectionPageProps {
  onSelectPlan: (plan: 'free' | 'trial') => void;
  isAr?: boolean;
}

export const PlanSelectionPage: React.FC<PlanSelectionPageProps> = ({ 
  onSelectPlan,
  isAr = false 
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'trial' | null>(null);

  const handleSelectPlan = (plan: 'free' | 'trial') => {
    setSelectedPlan(plan);
    onSelectPlan(plan);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-legal-gold" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              {isAr ? 'اختر خطتك' : 'Choisissez votre plan'}
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {isAr 
              ? 'ابدأ مع JuristDZ اليوم واكتشف قوة الذكاء الاصطناعي للقانون الجزائري'
              : 'Commencez avec JuristDZ aujourd\'hui et découvrez la puissance de l\'IA pour le droit algérien'
            }
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* Plan Essai Pro 7 Jours - RECOMMANDÉ */}
          <div 
            className={`relative bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all cursor-pointer ${
              selectedPlan === 'trial'
                ? 'border-legal-gold shadow-2xl scale-105'
                : 'border-legal-gold/50 hover:border-legal-gold hover:shadow-xl'
            }`}
            onClick={() => handleSelectPlan('trial')}
          >
            {/* Badge Recommandé */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-amber-500 to-legal-gold text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {isAr ? 'موصى به' : 'RECOMMANDÉ'}
              </span>
            </div>

            <div className="p-8 pt-12">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-legal-gold to-amber-600 rounded-2xl mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {isAr ? 'تجربة برو 7 أيام' : 'Essai Pro 7 Jours'}
                </h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-legal-gold">
                    {isAr ? 'مجاني' : 'Gratuit'}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {isAr ? 'لمدة 7 أيام' : 'pendant 7 jours'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  {isAr 
                    ? 'ثم 15,000 دج/شهر'
                    : 'Puis 15,000 DZD/mois'
                  }
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {isAr ? '500 رصيد/شهر' : '500 crédits/mois'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isAr ? '100 رصيد/يوم' : '100 crédits/jour'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {isAr ? 'بحث قانوني متقدم' : 'Recherche juridique avancée'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isAr ? 'الوصول إلى جميع القوانين والأحكام' : 'Accès à toutes les lois et jurisprudences'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {isAr ? 'صياغة تلقائية للوثائق' : 'Rédaction automatique de documents'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isAr ? 'عقود، دعاوى، مذكرات' : 'Contrats, requêtes, mémoires'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {isAr ? 'تحليل الاجتهاد القضائي' : 'Analyse de jurisprudence'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isAr ? 'تحليل ذكي للقرارات القضائية' : 'Analyse intelligente des décisions'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {isAr ? 'ملفات غير محدودة' : 'Dossiers illimités'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isAr ? 'إدارة جميع قضاياك' : 'Gérez tous vos cas'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {isAr ? 'دعم ذو أولوية' : 'Support prioritaire'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isAr ? 'مساعدة سريعة عبر البريد الإلكتروني' : 'Assistance rapide par email'}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan('trial')}
                className="w-full bg-gradient-to-r from-legal-gold to-amber-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Clock className="w-5 h-5" />
                {isAr ? 'ابدأ تجربتك المجانية' : 'Commencer l\'essai gratuit'}
              </button>

              {/* Note */}
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                {isAr 
                  ? '💳 لا يلزم بطاقة ائتمان • إلغاء في أي وقت'
                  : '💳 Aucune carte requise • Annulez à tout moment'
                }
              </p>
            </div>
          </div>

          {/* Plan Gratuit */}
          <div 
            className={`relative bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all cursor-pointer ${
              selectedPlan === 'free'
                ? 'border-blue-500 shadow-xl scale-105'
                : 'border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-lg'
            }`}
            onClick={() => handleSelectPlan('free')}
          >
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
                  <Users className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {isAr ? 'خطة مجانية' : 'Plan Gratuit'}
                </h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    {isAr ? 'مجاني' : 'Gratuit'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  {isAr ? 'للأبد' : 'Pour toujours'}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {isAr ? '50 رصيد/شهر' : '50 crédits/mois'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isAr ? '10 رصيد/يوم' : '10 crédits/jour'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {isAr ? 'بحث قانوني أساسي' : 'Recherche juridique de base'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isAr ? 'الوصول إلى القوانين الأساسية' : 'Accès aux lois essentielles'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {isAr ? 'ملف واحد' : '1 dossier'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isAr ? 'لتجربة النظام' : 'Pour tester le système'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {isAr ? 'دعم المجتمع' : 'Support communautaire'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isAr ? 'عبر المنتدى' : 'Via le forum'}
                    </p>
                  </div>
                </div>

                {/* Spacer pour aligner avec l'autre plan */}
                <div className="h-24"></div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan('free')}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                {isAr ? 'ابدأ مجانًا' : 'Commencer gratuitement'}
              </button>

              {/* Note */}
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                {isAr 
                  ? 'لا حاجة لبطاقة ائتمان'
                  : 'Aucune carte bancaire requise'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Comparaison */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            {isAr ? 'لماذا تختار التجربة المجانية؟' : 'Pourquoi choisir l\'essai gratuit ?'}
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-xl mb-3">
                <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                {isAr ? 'وصول كامل' : 'Accès complet'}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isAr 
                  ? 'جرب جميع الميزات المتقدمة لمدة 7 أيام'
                  : 'Testez toutes les fonctionnalités premium pendant 7 jours'
                }
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-xl mb-3">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                {isAr ? 'بدون مخاطر' : 'Sans risque'}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isAr 
                  ? 'لا حاجة لبطاقة ائتمان، إلغاء في أي وقت'
                  : 'Aucune carte requise, annulez à tout moment'
                }
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/10 rounded-xl mb-3">
                <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                {isAr ? 'قرار مستنير' : 'Décision éclairée'}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isAr 
                  ? 'اكتشف القيمة الحقيقية قبل الالتزام'
                  : 'Découvrez la vraie valeur avant de vous engager'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAr 
              ? 'هل لديك أسئلة؟ اتصل بنا على'
              : 'Des questions ? Contactez-nous à'
            }{' '}
            <a href="mailto:support@juristdz.com" className="text-legal-gold hover:underline">
              support@juristdz.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
