import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Language } from '../../../types';
import { 
  TrendingUp, TrendingDown, DollarSign, Briefcase, 
  Users, Clock, Target, Calendar, Award, AlertCircle,
  BarChart3, PieChart, Activity
} from 'lucide-react';
import { BarChart, LineChart, DonutChart } from '../charts/MiniChart';

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    yearly: number;
    growth: number;
  };
  cases: {
    total: number;
    active: number;
    won: number;
    lost: number;
    successRate: number;
    avgDuration: number;
  };
  clients: {
    total: number;
    active: number;
    topClients: Array<{ name: string; revenue: number }>;
  };
  performance: {
    billableHours: number;
    avgCaseValue: number;
    collectionRate: number;
  };
}

interface AdvancedAnalyticsProps {
  language: Language;
  userId: string;
}

const translations = {
  fr: {
    title: 'Statistiques Avancées',
    subtitle: 'Analyse complète de votre activité',
    revenue: 'Chiffre d\'affaires',
    cases: 'Dossiers',
    clients: 'Clients',
    performance: 'Performance',
    total: 'Total',
    monthly: 'Ce mois',
    yearly: 'Cette année',
    growth: 'Croissance',
    active: 'Actifs',
    won: 'Gagnés',
    lost: 'Perdus',
    successRate: 'Taux de réussite',
    avgDuration: 'Durée moyenne',
    topClients: 'Meilleurs clients',
    billableHours: 'Heures facturables',
    avgCaseValue: 'Valeur moyenne dossier',
    collectionRate: 'Taux de recouvrement',
    days: 'jours',
    hours: 'heures',
    overview: 'Vue d\'ensemble',
    trends: 'Tendances',
    forecast: 'Prévisions',
    noData: 'Aucune donnée disponible',
    loadingData: 'Chargement des données...',
    thisMonth: 'Ce mois',
    lastMonth: 'Mois dernier',
    thisYear: 'Cette année',
    comparison: 'Comparaison',
    vs: 'vs',
  },
  ar: {
    title: 'إحصائيات متقدمة',
    subtitle: 'تحليل شامل لنشاطك',
    revenue: 'رقم الأعمال',
    cases: 'الملفات',
    clients: 'العملاء',
    performance: 'الأداء',
    total: 'المجموع',
    monthly: 'هذا الشهر',
    yearly: 'هذه السنة',
    growth: 'النمو',
    active: 'نشط',
    won: 'مكسوب',
    lost: 'مفقود',
    successRate: 'معدل النجاح',
    avgDuration: 'المدة المتوسطة',
    topClients: 'أفضل العملاء',
    billableHours: 'ساعات قابلة للفوترة',
    avgCaseValue: 'القيمة المتوسطة للملف',
    collectionRate: 'معدل التحصيل',
    days: 'أيام',
    hours: 'ساعات',
    overview: 'نظرة عامة',
    trends: 'الاتجاهات',
    forecast: 'التوقعات',
    noData: 'لا توجد بيانات متاحة',
    loadingData: 'جاري تحميل البيانات...',
    thisMonth: 'هذا الشهر',
    lastMonth: 'الشهر الماضي',
    thisYear: 'هذه السنة',
    comparison: 'المقارنة',
    vs: 'مقابل',
  }
};

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ language, userId }) => {
  const t = translations[language];
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenue: { total: 0, monthly: 0, yearly: 0, growth: 0 },
    cases: { total: 0, active: 0, won: 0, lost: 0, successRate: 0, avgDuration: 0 },
    clients: { total: 0, active: 0, topClients: [] },
    performance: { billableHours: 0, avgCaseValue: 0, collectionRate: 0 }
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [userId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load revenue data
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId);

      // Load cases data
      const { data: cases } = await supabase
        .from('cases')
        .select('*')
        .eq('user_id', userId);

      // Load clients data
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId);

      // Calculate revenue analytics
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const totalRevenue = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
      const monthlyRevenue = invoices?.filter(inv => {
        const date = new Date(inv.invoice_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

      const lastMonthRevenue = invoices?.filter(inv => {
        const date = new Date(inv.invoice_date);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      }).reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

      const yearlyRevenue = invoices?.filter(inv => {
        const date = new Date(inv.invoice_date);
        return date.getFullYear() === currentYear;
      }).reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

      const growth = lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // Calculate cases analytics
      const totalCases = cases?.length || 0;
      const activeCases = cases?.filter(c => c.status === 'active').length || 0;
      const wonCases = cases?.filter(c => c.status === 'won').length || 0;
      const lostCases = cases?.filter(c => c.status === 'lost').length || 0;
      const successRate = (wonCases + lostCases) > 0 
        ? (wonCases / (wonCases + lostCases)) * 100 
        : 0;

      // Calculate average case duration
      const completedCases = cases?.filter(c => c.status === 'won' || c.status === 'lost') || [];
      const avgDuration = completedCases.length > 0
        ? completedCases.reduce((sum, c) => {
            const start = new Date(c.created_at);
            const end = new Date(c.updated_at);
            return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / completedCases.length
        : 0;

      // Calculate clients analytics
      const totalClients = clients?.length || 0;
      const activeClients = clients?.filter(c => c.is_active).length || 0;

      // Calculate top clients by revenue
      const clientRevenue = new Map<string, number>();
      invoices?.forEach(inv => {
        if (inv.client_id) {
          const current = clientRevenue.get(inv.client_id) || 0;
          clientRevenue.set(inv.client_id, current + inv.total_amount);
        }
      });

      const topClients = Array.from(clientRevenue.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([clientId, revenue]) => {
          const client = clients?.find(c => c.id === clientId);
          return {
            name: client ? `${client.first_name} ${client.last_name}` : 'Client inconnu',
            revenue
          };
        });

      // Calculate performance metrics
      const paidInvoices = invoices?.filter(inv => inv.status === 'paid') || [];
      const collectionRate = invoices && invoices.length > 0
        ? (paidInvoices.length / invoices.length) * 100
        : 0;

      const avgCaseValue = totalCases > 0 ? totalRevenue / totalCases : 0;

      // Heures facturables depuis la vraie table time_entries
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('duration_minutes')
        .eq('user_id', userId)
        .eq('is_billable', true)
        .not('duration_minutes', 'is', null);

      const billableHours = timeEntries
        ? Math.round(timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60)
        : 0;

      // Monthly revenue for last 6 months
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return { month: d.getMonth(), year: d.getFullYear(), label: d.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'short' }) };
      });
      const monthlyData = months.map(m => ({
        label: m.label,
        value: invoices?.filter(inv => {
          const d = new Date(inv.invoice_date);
          return d.getMonth() === m.month && d.getFullYear() === m.year;
        }).reduce((s, inv) => s + inv.total_amount, 0) || 0,
      }));
      setMonthlyRevenue(monthlyData);

      setAnalytics({
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
          yearly: yearlyRevenue,
          growth
        },
        cases: {
          total: totalCases,
          active: activeCases,
          won: wonCases,
          lost: lostCases,
          successRate,
          avgDuration
        },
        clients: {
          total: totalClients,
          active: activeClients,
          topClients
        },
        performance: {
          billableHours,
          avgCaseValue,
          collectionRate
        }
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-gold mx-auto mb-4"></div>
          <p className="text-slate-400">{t.loadingData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
        <p className="text-slate-400">{t.subtitle}</p>
      </div>

      {/* Revenue Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-legal-gold" />
          {t.revenue}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">{t.total}</span>
              <BarChart3 className="w-5 h-5 text-legal-gold" />
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(analytics.revenue.total)}</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">{t.monthly}</span>
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(analytics.revenue.monthly)}</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">{t.yearly}</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(analytics.revenue.yearly)}</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">{t.growth}</span>
              {analytics.revenue.growth >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <p className={`text-2xl font-bold ${analytics.revenue.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent(analytics.revenue.growth)}
            </p>
          </div>
        </div>
      </div>

      {/* Cases Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-legal-gold" />
          {t.cases}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm">{t.overview}</span>
              <Activity className="w-5 h-5 text-legal-gold" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">{t.total}</span>
                <span className="text-white font-bold">{analytics.cases.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">{t.active}</span>
                <span className="text-blue-400 font-bold">{analytics.cases.active}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">{t.won}</span>
                <span className="text-green-400 font-bold">{analytics.cases.won}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">{t.lost}</span>
                <span className="text-red-400 font-bold">{analytics.cases.lost}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">{t.successRate}</span>
              <Award className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-4xl font-bold text-white mb-2">{formatPercent(analytics.cases.successRate)}</p>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${analytics.cases.successRate}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">{t.avgDuration}</span>
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-4xl font-bold text-white">{Math.round(analytics.cases.avgDuration)}</p>
            <p className="text-slate-400 text-sm mt-1">{t.days}</p>
          </div>
        </div>
      </div>

      {/* Clients & Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Clients */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-legal-gold" />
            {t.clients}
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-300">{t.total}</span>
              <span className="text-2xl font-bold text-white">{analytics.clients.total}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-300">{t.active}</span>
              <span className="text-2xl font-bold text-green-400">{analytics.clients.active}</span>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">{t.topClients}</h3>
              <div className="space-y-2">
                {analytics.clients.topClients.length > 0 ? (
                  analytics.clients.topClients.map((client, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-legal-gold/20 flex items-center justify-center">
                          <span className="text-legal-gold font-bold text-sm">{index + 1}</span>
                        </div>
                        <span className="text-slate-300">{client.name}</span>
                      </div>
                      <span className="text-white font-semibold">{formatCurrency(client.revenue)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-4">{t.noData}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-legal-gold" />
            {t.performance}
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-sm">{t.billableHours}</span>
                <span className="text-2xl font-bold text-white">{analytics.performance.billableHours}</span>
              </div>
              <div className="text-slate-500 text-xs">{t.hours}</div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-sm">{t.avgCaseValue}</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(analytics.performance.avgCaseValue)}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-sm">{t.collectionRate}</span>
                <span className="text-2xl font-bold text-white">{formatPercent(analytics.performance.collectionRate)}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-legal-gold h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.performance.collectionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue trend */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-legal-gold" />
            {language === 'ar' ? 'تطور الإيرادات (6 أشهر)' : 'Évolution CA (6 mois)'}
          </h2>
          {monthlyRevenue.some(m => m.value > 0) ? (
            <LineChart data={monthlyRevenue} height={140} color="#d4a017" />
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-500 text-sm">{t.noData}</div>
          )}
        </div>

        {/* Cases donut */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-legal-gold" />
            {language === 'ar' ? 'توزيع الملفات' : 'Répartition des dossiers'}
          </h2>
          {analytics.cases.total > 0 ? (
            <DonutChart data={[
              { label: language === 'ar' ? 'نشط' : 'Actifs', value: analytics.cases.active, color: '#3b82f6' },
              { label: language === 'ar' ? 'مكسوب' : 'Gagnés', value: analytics.cases.won, color: '#22c55e' },
              { label: language === 'ar' ? 'مفقود' : 'Perdus', value: analytics.cases.lost, color: '#ef4444' },
            ].filter(d => d.value > 0)} size={110} />
          ) : (
            <div className="h-24 flex items-center justify-center text-slate-500 text-sm">{t.noData}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
