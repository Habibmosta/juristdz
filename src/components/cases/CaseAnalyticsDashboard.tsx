import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';
import type { Language } from '../../types';

interface CaseAnalyticsDashboardProps {
  userId: string;
  language: Language;
}

interface CaseStats {
  totalCases: number;
  activeCases: number;
  avgSuccessProbability: number;
  highRiskCases: number;
  mediumRiskCases: number;
  lowRiskCases: number;
  avgDuration: number;
  casesWithStrategy: number;
  casesWithObjective: number;
}

export const CaseAnalyticsDashboard: React.FC<CaseAnalyticsDashboardProps> = ({ userId, language }) => {
  const [stats, setStats] = useState<CaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const isAr = language === 'ar';

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { data: cases, error } = await supabase
        .from('cases')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['nouveau', 'en_cours', 'audience']);

      if (error) throw error;

      if (cases) {
        const totalCases = cases.length;
        const activeCases = cases.filter(c => c.status !== 'cloture' && c.status !== 'archive').length;
        
        // Calculer la probabilité moyenne de succès
        const casesWithProbability = cases.filter(c => c.success_probability != null);
        const avgSuccessProbability = casesWithProbability.length > 0
          ? casesWithProbability.reduce((sum, c) => sum + (c.success_probability || 0), 0) / casesWithProbability.length
          : 0;

        // Compter par niveau de risque
        const highRiskCases = cases.filter(c => c.risk_level === 'high').length;
        const mediumRiskCases = cases.filter(c => c.risk_level === 'medium').length;
        const lowRiskCases = cases.filter(c => c.risk_level === 'low').length;

        // Durée moyenne estimée
        const casesWithDuration = cases.filter(c => c.estimated_duration != null);
        const avgDuration = casesWithDuration.length > 0
          ? casesWithDuration.reduce((sum, c) => sum + (c.estimated_duration || 0), 0) / casesWithDuration.length
          : 0;

        // Dossiers avec stratégie et objectif
        const casesWithStrategy = cases.filter(c => c.legal_strategy && c.legal_strategy.trim() !== '').length;
        const casesWithObjective = cases.filter(c => c.client_objective && c.client_objective.trim() !== '').length;

        setStats({
          totalCases,
          activeCases,
          avgSuccessProbability,
          highRiskCases,
          mediumRiskCases,
          lowRiskCases,
          avgDuration,
          casesWithStrategy,
          casesWithObjective
        });
      }
    } catch (error) {
      console.error('Error loading case stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-gold"></div>
      </div>
    );
  }

  if (!stats) return null;

  const successRate = stats.avgSuccessProbability;
  const completionRate = stats.totalCases > 0 
    ? ((stats.casesWithStrategy / stats.totalCases) * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-legal-gold to-orange-500 rounded-xl">
          <TrendingUp size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isAr ? 'تحليلات الملفات' : 'Analyses des Dossiers'}
          </h2>
          <p className="text-sm text-slate-500">
            {isAr ? 'نظرة شاملة على أداء ملفاتك' : 'Vue d\'ensemble de la performance de vos dossiers'}
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Taux de succès moyen */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <Target size={20} className="text-green-600" />
            </div>
            <span className="text-3xl font-bold text-green-600">
              {successRate.toFixed(0)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {isAr ? 'معدل النجاح المتوقع' : 'Taux de succès moyen'}
          </h3>
          <div className="mt-2 w-full bg-green-200 dark:bg-green-900/30 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

        {/* Dossiers actifs */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <CheckCircle size={20} className="text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-blue-600">
              {stats.activeCases}
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {isAr ? 'ملفات نشطة' : 'Dossiers actifs'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isAr ? `من أصل ${stats.totalCases} ملف` : `sur ${stats.totalCases} dossiers`}
          </p>
        </div>

        {/* Durée moyenne */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Clock size={20} className="text-purple-600" />
            </div>
            <span className="text-3xl font-bold text-purple-600">
              {stats.avgDuration.toFixed(0)}
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {isAr ? 'المدة المتوسطة' : 'Durée moyenne'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isAr ? 'أشهر' : 'mois'}
          </p>
        </div>

        {/* Taux de complétion */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
              <TrendingUp size={20} className="text-orange-600" />
            </div>
            <span className="text-3xl font-bold text-orange-600">
              {completionRate}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {isAr ? 'معدل الإكمال' : 'Taux de complétion'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isAr ? 'ملفات مع استراتيجية' : 'dossiers avec stratégie'}
          </p>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">
          {isAr ? 'توزيع المخاطر' : 'Répartition des Risques'}
        </h3>
        
        <div className="space-y-4">
          {/* High Risk */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">
                  {isAr ? 'مخاطر عالية' : 'Risque élevé'}
                </span>
              </div>
              <span className="text-sm font-bold text-red-600">
                {stats.highRiskCases} {isAr ? 'ملف' : 'dossiers'}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.totalCases > 0 ? (stats.highRiskCases / stats.totalCases) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Medium Risk */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium">
                  {isAr ? 'مخاطر متوسطة' : 'Risque moyen'}
                </span>
              </div>
              <span className="text-sm font-bold text-orange-600">
                {stats.mediumRiskCases} {isAr ? 'ملف' : 'dossiers'}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.totalCases > 0 ? (stats.mediumRiskCases / stats.totalCases) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Low Risk */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">
                  {isAr ? 'مخاطر منخفضة' : 'Risque faible'}
                </span>
              </div>
              <span className="text-sm font-bold text-green-600">
                {stats.lowRiskCases} {isAr ? 'ملف' : 'dossiers'}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.totalCases > 0 ? (stats.lowRiskCases / stats.totalCases) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stratégie */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={18} className="text-blue-600" />
            <h4 className="font-bold text-sm text-blue-900 dark:text-blue-100">
              {isAr ? 'الملفات مع استراتيجية' : 'Dossiers avec stratégie'}
            </h4>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {stats.casesWithStrategy} / {stats.totalCases}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {isAr 
              ? 'تحديد استراتيجية واضحة يزيد من فرص النجاح'
              : 'Définir une stratégie claire augmente les chances de succès'}
          </p>
        </div>

        {/* Objectifs */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Target size={18} className="text-purple-600" />
            <h4 className="font-bold text-sm text-purple-900 dark:text-purple-100">
              {isAr ? 'الملفات مع أهداف' : 'Dossiers avec objectifs'}
            </h4>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {stats.casesWithObjective} / {stats.totalCases}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {isAr 
              ? 'تحديد أهداف العميل يحسن التواصل والنتائج'
              : 'Définir les objectifs client améliore la communication'}
          </p>
        </div>
      </div>

      {/* Recommendations */}
      {(stats.highRiskCases > stats.totalCases * 0.3 || stats.avgSuccessProbability < 50) && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-orange-900 dark:text-orange-100 mb-2">
                {isAr ? '⚠️ توصيات' : '⚠️ Recommandations'}
              </h4>
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                {stats.highRiskCases > stats.totalCases * 0.3 && (
                  <li>
                    • {isAr 
                      ? `لديك ${stats.highRiskCases} ملفات عالية المخاطر. فكر في إعادة تقييم الاستراتيجية.`
                      : `Vous avez ${stats.highRiskCases} dossiers à haut risque. Envisagez de réévaluer la stratégie.`}
                  </li>
                )}
                {stats.avgSuccessProbability < 50 && (
                  <li>
                    • {isAr 
                      ? 'معدل النجاح المتوقع منخفض. ركز على الملفات ذات الاحتمالية الأعلى.'
                      : 'Taux de succès moyen faible. Concentrez-vous sur les dossiers à forte probabilité.'}
                  </li>
                )}
                {stats.casesWithStrategy < stats.totalCases * 0.7 && (
                  <li>
                    • {isAr 
                      ? 'أضف استراتيجية قانونية لمزيد من الملفات لتحسين التخطيط.'
                      : 'Ajoutez une stratégie juridique à plus de dossiers pour améliorer la planification.'}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseAnalyticsDashboard;
