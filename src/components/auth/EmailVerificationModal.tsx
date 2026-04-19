import React from 'react';
import { Mail, CheckCircle, X } from 'lucide-react';
import type { Language } from '@/types';

interface EmailVerificationModalProps {
  email: string;
  language: Language;
  onClose: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({ email, language, onClose }) => {
  const isAr = language === 'ar';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
          
          <div className="text-center">
            <div className="inline-flex p-3 sm:p-4 bg-white/20 rounded-full mb-3 sm:mb-4">
              <Mail size={40} className="sm:w-12 sm:h-12" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              {isAr ? '📧 تحقق من بريدك الإلكتروني' : '📧 Vérifiez votre email'}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-4 sm:space-y-6">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {isAr 
                ? 'لقد أرسلنا رسالة تأكيد إلى:'
                : 'Nous avons envoyé un email de confirmation à:'}
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-6">
              <p className="font-bold text-blue-600 text-lg break-all">
                {email}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <p className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <CheckCircle size={20} className="text-blue-600" />
              {isAr ? 'الخطوات التالية:' : 'Prochaines étapes:'}
            </p>
            <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>{isAr ? 'افتح صندوق بريدك الإلكتروني' : 'Ouvrez votre boîte email'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>{isAr ? 'ابحث عن رسالة من JuristDZ' : 'Cherchez un email de JuristDZ'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>{isAr ? 'انقر على رابط التأكيد' : 'Cliquez sur le lien de confirmation'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>{isAr ? 'سجل الدخول وابدأ تجربتك المجانية لمدة 7 أيام!' : 'Connectez-vous et commencez votre essai gratuit de 7 jours!'}</span>
              </li>
            </ol>
          </div>

          {/* Trial Benefits */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border-2 border-green-200 dark:border-green-800">
            <p className="font-bold text-slate-900 dark:text-slate-100 mb-3">
              {isAr ? '🎁 تجربتك المجانية تتضمن:' : '🎁 Votre essai gratuit inclut:'}
            </p>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span>{isAr ? '7 أيام وصول كامل' : '7 jours d\'accès complet'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span>{isAr ? '3 ملفات قضائية' : '3 dossiers juridiques'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span>{isAr ? '5 عملاء' : '5 clients'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span>{isAr ? '3 فواتير' : '3 factures'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span>{isAr ? 'جميع الميزات متاحة' : 'Toutes les fonctionnalités'}</span>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>{isAr ? '⚠️ لم تستلم البريد؟' : '⚠️ Vous n\'avez pas reçu l\'email?'}</strong>
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              {isAr 
                ? 'تحقق من مجلد البريد العشوائي (Spam) أو اتصل بنا على contact@juristdz.com'
                : 'Vérifiez vos spams ou contactez-nous à contact@juristdz.com'}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg"
          >
            {isAr ? 'فهمت! 👍' : 'J\'ai compris! 👍'}
          </button>

          <p className="text-xs text-center text-slate-500">
            {isAr 
              ? 'يمكنك إغلاق هذه النافذة بأمان'
              : 'Vous pouvez fermer cette fenêtre en toute sécurité'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;
