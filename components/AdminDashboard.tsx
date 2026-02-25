import React, { useState, useEffect } from 'react';
import { UserStats, LicenseKey, Language, Transaction } from '../types';
import { 
  Settings, 
  Users, 
  BarChart3, 
  Building,
  CreditCard,
  Plus,
  Download,
  Activity,
  Server,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { UI_TRANSLATIONS } from '../constants';
import OrganizationManagement from './interfaces/admin/OrganizationManagement';
import SubscriptionManagement from './interfaces/admin/SubscriptionManagement';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface AdminDashboardProps {
  language: Language;
  users: UserStats[];
  licenseKeys: LicenseKey[];
  transactions: Transaction[];
  onGenerateKey: () => void;
  onSetUserPlan: (userId: string, isPro: boolean) => void;
}

/**
 * Admin Dashboard - Interface SaaS complète
 * Gestion des organisations, abonnements, et statistiques système
 */
const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  language, 
  users, 
  licenseKeys, 
  transactions, 
  onGenerateKey, 
  onSetUserPlan 
}) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'subscriptions'>('overview');
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    systemUptime: 99.8
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Compter les organisations
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      // Compter les abonnements actifs
      const { count: activeCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'active');

      // Calculer le revenu (MRR * 12)
      const { data: activeOrgs } = await supabase
        .from('organizations')
        .select(`
          subscription_plans (
            monthly_price
          )
        `)
        .eq('subscription_status', 'active');

      const mrr = activeOrgs?.reduce((sum, org: any) => 
        sum + (org.subscription_plans?.monthly_price || 0), 0
      ) || 0;

      setStats({
        totalOrganizations: orgCount || 0,
        activeSubscriptions: activeCount || 0,
        totalRevenue: mrr * 12,
        systemUptime: 99.8
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <Settings className="text-red-600" size={32} />
              {isAr ? 'إدارة المنصة SaaS' : 'Administration Plateforme SaaS'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr ? 'إدارة شاملة للمنظمات والاشتراكات' : 'Gestion complète des organisations et abonnements'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:border-red-600 transition-colors">
              <Download size={16} className="inline mr-2" />
              {isAr ? 'تصدير' : 'Export'}
            </button>
            <button 
              onClick={onGenerateKey}
              className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={18} />
              {isAr ? 'جديد' : 'Nouveau'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'overview'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 size={16} className="inline mr-2" />
              {isAr ? 'نظرة عامة' : 'Vue d\'ensemble'}
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'organizations'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Building size={16} className="inline mr-2" />
              {isAr ? 'المنظمات' : 'Organisations'}
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'subscriptions'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <CreditCard size={16} className="inline mr-2" />
              {isAr ? 'الاشتراكات' : 'Abonnements'}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                    <Building size={20} />
                  </div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.totalOrganizations}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? 'إجمالي المنظمات' : 'Total Organisations'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.activeSubscriptions} {isAr ? 'نشط' : 'actives'}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                    <Activity size={20} />
                  </div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {users.length}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? 'المستخدمين' : 'Utilisateurs'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? 'إجمالي المستخدمين' : 'Total utilisateurs'}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
                    <Server size={20} />
                  </div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {stats.systemUptime}%
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? 'وقت التشغيل' : 'Uptime'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? 'ممتاز' : 'Excellent'}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                    <CreditCard size={20} />
                  </div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {new Intl.NumberFormat('fr-DZ', {
                      style: 'currency',
                      currency: 'DZD',
                      minimumFractionDigits: 0
                    }).format(stats.totalRevenue)}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  {isAr ? 'الإيرادات السنوية' : 'ARR'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? 'إيرادات متكررة' : 'Revenus récurrents'}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Users size={18} className="text-blue-500" />
                  {isAr ? 'المستخدمين الأخيرين' : 'Utilisateurs Récents'}
                </h3>
                <div className="space-y-3">
                  {users.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div>
                        <p className="font-medium text-sm">{user.name || 'Utilisateur'}</p>
                        <p className="text-xs text-slate-500">{user.role}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {user.credits} crédits
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  {isAr ? 'حالة النظام' : 'État du Système'}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-sm font-medium">{isAr ? 'قاعدة البيانات' : 'Base de données'}</span>
                    </div>
                    <span className="text-xs font-bold text-green-600">
                      {isAr ? 'تعمل' : 'OPÉRATIONNEL'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-sm font-medium">{isAr ? 'الخوادم' : 'Serveurs'}</span>
                    </div>
                    <span className="text-xs font-bold text-green-600">
                      {isAr ? 'تعمل' : 'OPÉRATIONNEL'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-sm font-medium">{isAr ? 'API' : 'API'}</span>
                    </div>
                    <span className="text-xs font-bold text-green-600">
                      {isAr ? 'تعمل' : 'OPÉRATIONNEL'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Info */}
            <div className="bg-gradient-to-r from-red-600 to-red-600/80 text-white rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-2">
                    {isAr ? 'منصة JuristDZ SaaS' : 'Plateforme JuristDZ SaaS'}
                  </h3>
                  <p className="text-red-100 text-sm">
                    {isAr ? 'نظام إدارة متعدد المستأجرين للمحترفين القانونيين' : 'Système de gestion multi-tenant pour professionnels du droit'}
                  </p>
                  <p className="text-red-100 text-xs mt-1">
                    {isAr ? 'إصدار 2.0 - بنية SaaS كاملة' : 'Version 2.0 - Architecture SaaS complète'}
                  </p>
                </div>
                <Settings size={48} className="text-red-200" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'organizations' && (
          <OrganizationManagement language={language} theme="light" />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionManagement language={language} theme="light" />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
