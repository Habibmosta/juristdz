import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Language } from '../../types';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieChartIcon,
  Calendar
} from 'lucide-react';

interface ChartData {
  newCasesByMonth: { month: string; count: number }[];
  revenueByMonth: { month: string; amount: number }[];
  casesByType: { type: string; count: number }[];
  casesByStatus: { status: string; count: number }[];
}

interface DashboardChartsProps {
  userId: string;
  language: Language;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ userId, language }) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const isAr = language === 'ar';

  useEffect(() => {
    loadChartData();
  }, [userId]);

  const loadChartData = async () => {
    try {
      // Récupérer tous les dossiers
      const { data: cases } = await supabase
        .from('cases')
        .select('id, created_at, estimated_value, case_type, status')
        .eq('user_id', userId);

      if (!cases) return;

      // Nouveaux dossiers par mois (6 derniers mois)
      const newCasesByMonth = getLast6Months().map(month => {
        const count = cases.filter(c => {
          const caseMonth = new Date(c.created_at).toISOString().slice(0, 7);
          return caseMonth === month;
        }).length;
        return { month: formatMonth(month, language), count };
      });

      // Revenus par mois
      const revenueByMonth = getLast6Months().map(month => {
        const amount = cases
          .filter(c => new Date(c.created_at).toISOString().slice(0, 7) === month)
          .reduce((sum, c) => sum + (c.estimated_value || 0), 0);
        return { month: formatMonth(month, language), amount };
      });

      // Dossiers par type
      const typeCount: Record<string, number> = {};
      cases.forEach(c => {
        const type = c.case_type || 'autre';
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      const casesByType = Object.entries(typeCount)
        .map(([type, count]) => ({ type: translateCaseType(type, language), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Dossiers par statut
      const statusCount: Record<string, number> = {};
      cases.forEach(c => {
        const status = c.status || 'nouveau';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      const casesByStatus = Object.entries(statusCount)
        .map(([status, count]) => ({ status: translateStatus(status, language), count }));

      setChartData({
        newCasesByMonth,
        revenueByMonth,
        casesByType,
        casesByStatus
      });
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().slice(0, 7));
    }
    return months;
  };

  const formatMonth = (month: string, lang: Language) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', { 
      month: 'short',
      year: '2-digit'
    });
  };

  const translateCaseType = (type: string, lang: Language) => {
    const translations: Record<string, { fr: string; ar: string }> = {
      civil: { fr: 'Civil', ar: 'مدني' },
      penal: { fr: 'Pénal', ar: 'جزائي' },
      commercial: { fr: 'Commercial', ar: 'تجاري' },
      famille: { fr: 'Famille', ar: 'أسرة' },
      travail: { fr: 'Travail', ar: 'عمل' },
      autre: { fr: 'Autre', ar: 'أخرى' }
    };
    return translations[type]?.[lang] || type;
  };

  const translateStatus = (status: string, lang: Language) => {
    const translations: Record<string, { fr: string; ar: string }> = {
      nouveau: { fr: 'Nouveau', ar: 'جديد' },
      en_cours: { fr: 'En cours', ar: 'قيد المعالجة' },
      audience: { fr: 'Audience', ar: 'جلسة' },
      cloture: { fr: 'Clôturé', ar: 'مغلق' },
      archive: { fr: 'Archivé', ar: 'مؤرشف' }
    };
    return translations[status]?.[lang] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-gold"></div>
      </div>
    );
  }

  if (!chartData) return null;

  const maxNewCases = Math.max(...chartData.newCasesByMonth.map(d => d.count), 1);
  const maxRevenue = Math.max(...chartData.revenueByMonth.map(d => d.amount), 1);
  const totalCases = chartData.casesByStatus.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Nouveaux Dossiers par Mois */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <TrendingUp size={20} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-bold">
            {isAr ? 'الملفات الجديدة (6 أشهر الأخيرة)' : 'Nouveaux Dossiers (6 derniers mois)'}
          </h3>
        </div>
        <div className="space-y-3">
          {chartData.newCasesByMonth.map((data, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-sm text-slate-500 w-16">{data.month}</span>
              <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500 flex items-center justify-end px-3"
                  style={{ width: `${(data.count / maxNewCases) * 100}%` }}
                >
                  {data.count > 0 && (
                    <span className="text-white text-sm font-bold">{data.count}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenus par Mois */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <BarChart3 size={20} className="text-green-600" />
          </div>
          <h3 className="text-lg font-bold">
            {isAr ? 'الإيرادات (6 أشهر الأخيرة)' : 'Revenus (6 derniers mois)'}
          </h3>
        </div>
        <div className="space-y-3">
          {chartData.revenueByMonth.map((data, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-sm text-slate-500 w-16">{data.month}</span>
              <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500 flex items-center justify-end px-3"
                  style={{ width: `${(data.amount / maxRevenue) * 100}%` }}
                >
                  {data.amount > 0 && (
                    <span className="text-white text-xs font-bold">
                      {(data.amount / 1000).toFixed(0)}K
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dossiers par Type */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <PieChartIcon size={20} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-bold">
              {isAr ? 'الملفات حسب النوع' : 'Dossiers par Type'}
            </h3>
          </div>
          <div className="space-y-3">
            {chartData.casesByType.map((data, idx) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
                    <span className="text-sm">{data.type}</span>
                  </div>
                  <span className="text-sm font-bold">{data.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dossiers par Statut */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Calendar size={20} className="text-orange-600" />
            </div>
            <h3 className="text-lg font-bold">
              {isAr ? 'الملفات حسب الحالة' : 'Dossiers par Statut'}
            </h3>
          </div>
          <div className="space-y-3">
            {chartData.casesByStatus.map((data, idx) => {
              const percentage = totalCases > 0 ? (data.count / totalCases) * 100 : 0;
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{data.status}</span>
                    <span className="text-sm font-bold">{data.count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-legal-gold transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
