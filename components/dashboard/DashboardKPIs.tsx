import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Users,
  Calendar,
  Target
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { Language } from '../../types';

interface KPIData {
  activeCases: number;
  activeCasesChange: number;
  totalRevenue: number;
  revenueChange: number;
  successRate: number;
  successRateChange: number;
  billableHours: number;
  billableHoursChange: number;
  newCasesThisMonth: number;
  closedCasesThisMonth: number;
  averageCaseDuration: number;
  clientSatisfaction: number;
}

interface DashboardKPIsProps {
  userId: string;
  language: Language;
}

const DashboardKPIs: React.FC<DashboardKPIsProps> = ({ userId, language }) => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const isAr = language === 'ar';

  useEffect(() => {
    loadKPIs();
  }, [userId]);

  const loadKPIs = async () => {
    try {
      // Dossiers actifs
      const { data: activeCases } = await supabase
        .from('cases')
        .select('id, estimated_value, created_at, status')
        .eq('user_id', userId)
        .not('status', 'in', '(cloture,archive)');

      // Dossiers du mois dernier pour comparaison
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const { data: lastMonthCases } = await supabase
        .from('cases')
        .select('id')
        .eq('user_id', userId)
        .not('status', 'in', '(cloture,archive)')
        .lt('created_at', lastMonth.toISOString());

      // Nouveaux dossiers ce mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: newCases } = await supabase
        .from('cases')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());

      // Dossiers clôturés ce mois
      const { data: closedCases } = await supabase
        .from('cases')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['cloture', 'archive'])
        .gte('updated_at', startOfMonth.toISOString());

      // Calcul du CA
      const totalRevenue = activeCases?.reduce((sum, c) => sum + (c.estimated_value || 0), 0) || 0;
      
      // Calcul du taux de réussite (dossiers gagnés / dossiers terminés)
      const { data: wonCases } = await supabase
        .from('cases')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'cloture');

      const { data: allClosedCases } = await supabase
        .from('cases')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['cloture', 'archive']);

      const successRate = allClosedCases && allClosedCases.length > 0
        ? (wonCases?.length || 0) / allClosedCases.length * 100
        : 0;

      // Heures facturables (simulé - à remplacer par vraies données)
      const billableHours = (activeCases?.length || 0) * 15; // Moyenne 15h par dossier

      // Durée moyenne des dossiers
      const casesWithDuration = activeCases?.filter(c => c.created_at) || [];
      const avgDuration = casesWithDuration.length > 0
        ? casesWithDuration.reduce((sum, c) => {
            const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / casesWithDuration.length
        : 0;

      // Calcul des changements (vs mois dernier)
      const activeCasesChange = lastMonthCases 
        ? ((activeCases?.length || 0) - lastMonthCases.length) / (lastMonthCases.length || 1) * 100
        : 0;

      setKpiData({
        activeCases: activeCases?.length || 0,
        activeCasesChange,
        totalRevenue,
        revenueChange: 12.5, // Simulé
        successRate,
        successRateChange: 5.2, // Simulé
        billableHours,
        billableHoursChange: 8.3, // Simulé
        newCasesThisMonth: newCases?.length || 0,
        closedCasesThisMonth: closedCases?.length || 0,
        averageCaseDuration: Math.round(avgDuration),
        clientSatisfaction: 92 // Simulé
      });
    } catch (error) {
      console.error('Error loading KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isAr ? 'ar-DZ' : 'fr-FR', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-gold"></div>
      </div>
    );
  }

  if (!kpiData) return null;

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Main KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Dossiers Actifs */}
        <KPICard
          title={isAr ? 'الملفات النشطة' : 'Dossiers Actifs'}
          value={kpiData.activeCases}
          change={kpiData.activeCasesChange}
          icon={<FileText size={24} />}
          color="blue"
          language={language}
        />

        {/* Chiffre d'Affaires */}
        <KPICard
          title={isAr ? 'رقم الأعمال' : 'Chiffre d\'Affaires'}
          value={formatCurrency(kpiData.totalRevenue)}
          change={kpiData.revenueChange}
          icon={<DollarSign size={24} />}
          color="green"
          language={language}
          isNumeric={false}
        />

        {/* Taux de Réussite */}
        <KPICard
          title={isAr ? 'معدل النجاح' : 'Taux de Réussite'}
          value={`${kpiData.successRate.toFixed(1)}%`}
          change={kpiData.successRateChange}
          icon={<Target size={24} />}
          color="purple"
          language={language}
          isNumeric={false}
        />

        {/* Heures Facturables */}
        <KPICard
          title={isAr ? 'ساعات قابلة للفوترة' : 'Heures Facturables'}
          value={`${kpiData.billableHours}h`}
          change={kpiData.billableHoursChange}
          icon={<Clock size={24} />}
          color="orange"
          language={language}
          isNumeric={false}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Nouveaux Dossiers */}
        <SecondaryKPICard
          title={isAr ? 'ملفات جديدة هذا الشهر' : 'Nouveaux Dossiers ce Mois'}
          value={kpiData.newCasesThisMonth}
          icon={<Calendar size={20} />}
          color="blue"
        />

        {/* Dossiers Clôturés */}
        <SecondaryKPICard
          title={isAr ? 'ملفات مغلقة هذا الشهر' : 'Dossiers Clôturés ce Mois'}
          value={kpiData.closedCasesThisMonth}
          icon={<CheckCircle size={20} />}
          color="green"
        />

        {/* Durée Moyenne */}
        <SecondaryKPICard
          title={isAr ? 'متوسط المدة' : 'Durée Moyenne'}
          value={`${kpiData.averageCaseDuration}j`}
          icon={<Clock size={20} />}
          color="purple"
        />

        {/* Satisfaction Client */}
        <SecondaryKPICard
          title={isAr ? 'رضا العملاء' : 'Satisfaction Client'}
          value={`${kpiData.clientSatisfaction}%`}
          icon={<Users size={20} />}
          color="orange"
        />
      </div>

      {/* Alerts */}
      {kpiData.activeCases > 50 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-orange-900 dark:text-orange-100">
              {isAr ? 'تحذير: عدد كبير من الملفات النشطة' : 'Attention: Nombre élevé de dossiers actifs'}
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              {isAr 
                ? `لديك ${kpiData.activeCases} ملفًا نشطًا. فكر في إغلاق الملفات المنتهية.`
                : `Vous avez ${kpiData.activeCases} dossiers actifs. Pensez à clôturer les dossiers terminés.`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// KPI Card Component
const KPICard: React.FC<{
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
  language: Language;
  isNumeric?: boolean;
}> = ({ title, value, change, icon, color, language, isNumeric = true }) => {
  const isAr = language === 'ar';
  const isPositive = change >= 0;

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border dark:border-slate-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]} bg-opacity-10`}>
          <div className={`text-${color}-600`}>
            {icon}
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
          isPositive 
            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      </div>
      <h3 className="text-sm text-slate-500 dark:text-slate-400 mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-slate-400 mt-2">
        {isAr ? 'مقارنة بالشهر الماضي' : 'vs mois dernier'}
      </p>
    </div>
  );
};

// Secondary KPI Card Component
const SecondaryKPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border dark:border-slate-700">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <h3 className="text-sm text-slate-500 dark:text-slate-400 flex-1">{title}</h3>
      </div>
      <p className="text-2xl font-bold ml-11">{value}</p>
    </div>
  );
};

export default DashboardKPIs;
