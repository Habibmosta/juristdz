import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Language } from '../../types';
import { AlertCircle, Clock, FileText } from 'lucide-react';

interface InactiveCase {
  id: string;
  title: string;
  case_number: string;
  status: string;
  last_activity: string;
  days_inactive: number;
}

interface InactiveCasesProps {
  userId: string;
  language: Language;
  showAll?: boolean;
}

const InactiveCases: React.FC<InactiveCasesProps> = ({ userId, language, showAll = false }) => {
  const [cases, setCases] = useState<InactiveCase[]>([]);
  const [loading, setLoading] = useState(true);
  const isAr = language === 'ar';

  useEffect(() => {
    loadInactiveCases();
  }, [userId]);

  const loadInactiveCases = async () => {
    try {
      // Récupérer les dossiers actifs
      const { data: activeCases } = await supabase
        .from('cases')
        .select('id, title, case_number, status, updated_at')
        .eq('user_id', userId)
        .not('status', 'in', '(cloture,archive)')
        .order('updated_at', { ascending: true });

      if (!activeCases) return;

      // Calculer les jours d'inactivité
      const now = Date.now();
      const inactiveCases = activeCases
        .map(c => {
          const lastActivity = new Date(c.updated_at).getTime();
          const daysInactive = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
          return {
            ...c,
            last_activity: c.updated_at,
            days_inactive: daysInactive
          };
        })
        .filter(c => c.days_inactive >= 30) // Inactif depuis 30 jours ou plus
        .slice(0, showAll ? 20 : 5);

      setCases(inactiveCases);
    } catch (error) {
      console.error('Error loading inactive cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (days: number) => {
    if (days >= 90) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    if (days >= 60) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
    return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border dark:border-slate-700">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-gold"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
          <AlertCircle size={20} className="text-orange-600" />
        </div>
        <h3 className="text-lg font-bold">
          {isAr ? 'ملفات غير نشطة (>30 يوم)' : 'Dossiers Inactifs (>30j)'}
        </h3>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium text-green-600">
            {isAr ? '✓ جميع الملفات نشطة' : '✓ Tous les dossiers sont actifs'}
          </p>
          <p className="text-sm mt-2">
            {isAr ? 'لا توجد ملفات غير نشطة' : 'Aucun dossier inactif'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((caseItem) => (
            <div 
              key={caseItem.id}
              className="flex items-start gap-3 p-4 rounded-xl border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <AlertCircle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
              
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{caseItem.title}</p>
                <p className="text-sm text-slate-500">{caseItem.case_number}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(caseItem.days_inactive)}`}>
                  <Clock size={12} className="inline mr-1" />
                  {caseItem.days_inactive}j
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(caseItem.last_activity).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showAll && cases.length >= 5 && (
        <button className="w-full mt-4 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors">
          {isAr ? 'عرض الكل' : 'Voir tous les dossiers inactifs'}
        </button>
      )}

      {cases.length > 0 && (
        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            <AlertCircle size={14} className="inline mr-1" />
            {isAr 
              ? `${cases.length} ملف غير نشط. فكر في تحديثها أو إغلاقها.`
              : `${cases.length} dossier${cases.length > 1 ? 's' : ''} inactif${cases.length > 1 ? 's' : ''}. Pensez à les mettre à jour ou les clôturer.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default InactiveCases;
