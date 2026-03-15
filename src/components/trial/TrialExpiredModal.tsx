import React from 'react';
import { AlertCircle, Check, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppToast } from '../../contexts/ToastContext';

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPlan: 'pro' | 'cabinet';
  isAr?: boolean;
}

export const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({
  isOpen,
  onClose,
  userPlan,
  isAr = false
}) => {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useAppToast();

  if (!isOpen) return null;

  const planPrice = userPlan === 'pro' ? '15,000' : '50,000';
  const planName = userPlan === 'pro' ? 'Pro' : 'Cabinet';

  const handleContinueWithPlan = async () => {
    setLoading(true);
    try {
      // Appeler la fonction pour convertir l'essai en payant
      const { data, error } = await supabase.rpc('convert_trial_to_paid', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      if (data.success) {
        toast(isAr 
          ? 'تم تفعيل اشتراكك بنجاح!'
          : 'Votre abonnement a été activé avec succès!', 'success');
        window.location.reload();
      } else {
        toast(data.message, 'error');
      }
    } catch (error: any) {
      console.error('Erreur conversion:', error);
      toast(isAr 
        ? 'حدث خطأ. يرجى المحاولة مرة أخرى.'
        : 'Une erreur est survenue. Veuillez réessayer.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngradeToFree = async () => {
    if (!confirm(isAr 
      ? 'هل أنت متأكد أنك تريد العودة إلى الخطة المجانية؟'
      : 'Êtes-vous sûr de vouloir retourner au plan gratuit?')) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('downgrade_to_free', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      if (data.success) {
        toast(isAr 
          ? 'تم التبديل إلى الخطة المجانية'
          : 'Vous êtes maintenant sur le plan gratuit', 'success');
        window.location.reload();
      } else {
        toast(data.message, 'error');
      }
    } catch (error: any) {
      console.error('Erreur downgrade:', error);
      toast(isAr 
        ? 'حدث خطأ. يرجى المحاولة مرة أخرى.'
        : 'Une erreur est survenue. Veuillez réessayer.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'انتهت فترتك التجريبية' : 'Votre essai est terminé'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isAr 
                  ? 'اختر خطة للمتابعة'
                  : 'Choisissez une option pour continuer'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-slate-700 dark:text-slate-300">
              {isAr 
                ? `لقد استمتعت بجميع ميزات ${planName} خلال الأيام السبعة الماضية. هل تريد المتابعة؟`
                : `Vous avez profité de toutes les fonctionnalités ${planName} pendant 7 jours. Voulez-vous continuer?`}
            </p>
          </div>

          {/* Option 1: Continuer avec le plan payant */}
          <div className="border-2 border-legal-gold bg-legal-gold/5 dark:bg-legal-gold/10 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {isAr ? `متابعة مع ${planName}` : `Continuer avec ${planName}`}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{planPrice}</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {isAr ? 'دج/شهر' : 'DZD/mois'}
                  </span>
                </div>
              </div>
              <div className="px-3 py-1 bg-legal-gold text-slate-900 rounded-full text-xs font-bold">
                {isAr ? 'موصى به' : 'RECOMMANDÉ'}
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-legal-gold flex-shrink-0" />
                {isAr ? 'جميع الميزات التي استخدمتها' : 'Toutes les fonctionnalités que vous avez utilisées'}
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-legal-gold flex-shrink-0" />
                {isAr ? 'لا فقدان للبيانات' : 'Aucune perte de données'}
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-legal-gold flex-shrink-0" />
                {isAr ? 'يمكنك الإلغاء في أي وقت' : 'Annulation possible à tout moment'}
              </li>
            </ul>

            <button
              onClick={handleContinueWithPlan}
              disabled={loading}
              className="w-full px-6 py-3 bg-legal-gold hover:bg-legal-gold/90 text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isAr ? 'متابعة مع' : 'Continuer avec'} {planName}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Option 2: Plan gratuit */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {isAr ? 'العودة إلى الخطة المجانية' : 'Retourner au plan gratuit'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {isAr 
                ? '50 رصيد/شهر، 10 رصيد/يوم، ميزات محدودة'
                : '50 crédits/mois, 10 crédits/jour, fonctionnalités limitées'}
            </p>
            <button
              onClick={handleDowngradeToFree}
              disabled={loading}
              className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAr ? 'العودة إلى المجاني' : 'Retour au gratuit'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            {isAr 
              ? 'لديك أسئلة؟ اتصل بنا على support@juristdz.com'
              : 'Des questions ? Contactez-nous à support@juristdz.com'}
          </p>
        </div>
      </div>
    </div>
  );
};
