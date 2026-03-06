import React from 'react';
import { X, CheckCircle, Clock, Users, FileText, DollarSign } from 'lucide-react';
import type { Language } from '../../types';

interface WelcomeModalProps {
  language: Language;
  onClose: () => void;
  daysRemaining: number;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ language, onClose, daysRemaining }) => {
  const isAr = language === 'ar';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="relative p-8 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="text-center">
            <div className="inline-flex p-4 bg-white/20 rounded-full mb-4">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-bold mb-2">
              {isAr ? '🎉 مرحباً بك في JuristDZ!' : '🎉 Bienvenue sur JuristDZ!'}
            </h2>
            <p className="text-blue-100 text-lg">
              {isAr 
                ? 'حسابك التجريبي مفعّل ومجاني لمدة 7 أيام'
                : 'Votre compte d\'essai est activé gratuitement pour 7 jours'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Timer */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
            <Clock size={32} className="mx-auto mb-3 text-blue-600" />
            <p className="text-2xl font-bold text-blue-600 mb-1">
              {daysRemaining} {isAr ? 'أيام' : 'jours'}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isAr ? 'للاستفادة من جميع الميزات' : 'pour profiter de toutes les fonctionnalités'}
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100">
              {isAr ? 'ما يمكنك فعله:' : 'Ce que vous pouvez faire:'}
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FileText size={20} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {isAr ? '3 ملفات قضائية' : '3 dossiers juridiques'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {isAr ? 'أنشئ وأدر ملفاتك القضائية' : 'Créez et gérez vos dossiers'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {isAr ? '5 عملاء' : '5 clients'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {isAr ? 'أضف معلومات عملائك' : 'Ajoutez vos clients'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <DollarSign size={20} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {isAr ? '3 فواتير' : '3 factures'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {isAr ? 'أنشئ فواتير احترافية' : 'Créez des factures professionnelles'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                <CheckCircle size={20} className="text-green-600 mt-1" />
                <div className="flex-1">
                  <p className="font-bold text-green-700 dark:text-green-400">
                    {isAr ? 'جميع الميزات متاحة!' : 'Toutes les fonctionnalités disponibles!'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {isAr 
                      ? 'التقويم، الفواتير، تتبع الوقت، البوابة، والمزيد...'
                      : 'Calendrier, facturation, suivi temps, portail client, et plus...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activation */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-slate-100">
              {isAr ? '🚀 للوصول الكامل غير المحدود' : '🚀 Pour un accès complet illimité'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {isAr 
                ? 'اتصل بنا لتفعيل حسابك والحصول على وصول غير محدود لجميع الميزات'
                : 'Contactez-nous pour activer votre compte et obtenir un accès illimité'}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:contact@juristdz.com?subject=Activation compte JuristDZ"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                📧 {isAr ? 'اتصل بنا' : 'Nous contacter'}
              </a>
              <a
                href="tel:+213XXXXXXXXX"
                className="px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                📱 {isAr ? 'اتصل' : 'Appeler'}
              </a>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-900 transition-all"
          >
            {isAr ? 'ابدأ الآن! 🚀' : 'Commencer maintenant! 🚀'}
          </button>

          <p className="text-xs text-center text-slate-500">
            {isAr 
              ? 'يمكنك إغلاق هذه النافذة في أي وقت. ستظهر البانر في الأعلى لتذكيرك بالأيام المتبقية.'
              : 'Vous pouvez fermer cette fenêtre à tout moment. Une bannière en haut vous rappellera les jours restants.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
