import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAccountStatus } from '../../hooks/useAccountStatus';
import type { Language } from '@/types';

interface LimitCheckerProps {
  resourceType: 'case' | 'client' | 'document' | 'invoice';
  language: Language;
  children: React.ReactNode;
  onLimitReached?: () => void;
}

export const LimitChecker: React.FC<LimitCheckerProps> = ({
  resourceType,
  language,
  children,
  onLimitReached
}) => {
  const { accountStatus, checkCanCreate, getLimitMessage } = useAccountStatus();
  const isAr = language === 'ar';

  if (!accountStatus) return <>{children}</>;

  const canCreate = checkCanCreate(resourceType);

  if (!canCreate) {
    const message = getLimitMessage(resourceType, language);

    return (
      <div className="p-6 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
            <AlertTriangle size={24} className="text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-slate-100">
              {isAr ? '⚠️ تم الوصول إلى الحد' : '⚠️ Limite atteinte'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {message}
            </p>
            <a
              href="mailto:contact@juristdz.com?subject=Activation compte JuristDZ"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors"
            >
              {isAr ? '📧 تفعيل حسابي' : '📧 Activer mon compte'}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default LimitChecker;
