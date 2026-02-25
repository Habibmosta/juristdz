import React, { useState, useEffect } from 'react';
import { Language } from '../../../types';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2,
  Check,
  TrendingUp,
  DollarSign,
  Users,
  Star,
  Package
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  max_users: number;
  max_cases: number;
  max_storage_gb: number;
  features: any;
  is_active: boolean;
  is_popular: boolean;
  subscriber_count?: number;
}

interface SubscriptionManagementProps {
  language: Language;
  theme?: 'light' | 'dark';
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  language,
  theme = 'light'
}) => {
  const isAr = language === 'ar';
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    mrr: 0
  });

  useEffect(() => {
    loadPlans();
    loadStats();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Count subscribers for each plan
      const plansWithCounts = await Promise.all(
        (data || []).map(async (plan) => {
          const { count } = await supabase
            .from('organizations')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_plan_id', plan.id)
            .eq('subscription_status', 'active');
          
          return { ...plan, subscriber_count: count || 0 };
        })
      );

      setPlans(plansWithCounts);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Active subscriptions
      const { count: activeCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'active');

      // Trial subscriptions
      const { count: trialCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'trial');

      // Calculate MRR (Monthly Recurring Revenue)
      const { data: activeOrgs } = await supabase
        .from('organizations')
        .select(`
          subscription_plans (
            monthly_price
          )
        `)
        .eq('subscription_status', 'active');

      const mrr = activeOrgs?.reduce((sum, org: any) => {
        return sum + (org.subscription_plans?.monthly_price || 0);
      }, 0) || 0;

      setStats({
        totalRevenue: mrr * 12, // ARR
        activeSubscriptions: activeCount || 0,
        trialSubscriptions: trialCount || 0,
        mrr
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const formatPrice = (price: number, currency: string = 'DZD') => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <CreditCard className="text-red-600" size={28} />
            {isAr ? 'إدارة الاشتراكات' : 'Gestion des Abonnements'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isAr ? `${plans.length} خطة متاحة` : `${plans.length} plans disponibles`}
          </p>
        </div>
        
        <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
          <Plus size={18} />
          {isAr ? 'خطة جديدة' : 'Nouveau Plan'}
        </button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl">
              <DollarSign size={20} />
            </div>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <h3 className="font-bold text-sm text-green-700 dark:text-green-300 mb-1">
            {isAr ? 'الإيرادات الشهرية' : 'MRR'}
          </h3>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {formatPrice(stats.mrr)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {isAr ? 'إيرادات شهرية متكررة' : 'Revenus mensuels récurrents'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <Users size={20} />
            </div>
          </div>
          <h3 className="font-bold text-sm text-blue-700 dark:text-blue-300 mb-1">
            {isAr ? 'اشتراكات نشطة' : 'Abonnements Actifs'}
          </h3>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {stats.activeSubscriptions}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {isAr ? 'عملاء يدفعون' : 'Clients payants'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl">
              <Package size={20} />
            </div>
          </div>
          <h3 className="font-bold text-sm text-amber-700 dark:text-amber-300 mb-1">
            {isAr ? 'فترات تجريبية' : 'Essais Gratuits'}
          </h3>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
            {stats.trialSubscriptions}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            {isAr ? 'في فترة تجريبية' : 'En période d\'essai'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <h3 className="font-bold text-sm text-purple-700 dark:text-purple-300 mb-1">
            {isAr ? 'الإيرادات السنوية' : 'ARR'}
          </h3>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {formatPrice(stats.totalRevenue)}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {isAr ? 'إيرادات سنوية متكررة' : 'Revenus annuels récurrents'}
          </p>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div 
            key={plan.id}
            className={`bg-white dark:bg-slate-900 rounded-2xl border-2 p-6 transition-all hover:shadow-xl ${
              plan.is_popular 
                ? 'border-red-600 shadow-lg' 
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100">
                    {plan.display_name}
                  </h3>
                  {plan.is_popular && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                      <Star size={12} />
                      {isAr ? 'شائع' : 'Populaire'}
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {plan.description}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                  <Edit size={16} />
                </button>
                <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {formatPrice(plan.monthly_price)}
                </span>
                <span className="text-sm text-slate-500">
                  {isAr ? '/ شهر' : '/ mois'}
                </span>
              </div>
              <div className="text-sm text-slate-500">
                {isAr ? 'أو' : 'ou'} {formatPrice(plan.yearly_price)} {isAr ? '/ سنة' : '/ an'}
                <span className="text-green-600 font-bold ml-2">
                  ({isAr ? 'وفر' : 'Économisez'} {Math.round((1 - (plan.yearly_price / (plan.monthly_price * 12))) * 100)}%)
                </span>
              </div>
            </div>

            {/* Limits */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {isAr ? 'المستخدمين' : 'Utilisateurs'}
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {plan.max_users === -1 ? (isAr ? 'غير محدود' : 'Illimité') : plan.max_users}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {isAr ? 'الملفات' : 'Dossiers'}
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {plan.max_cases === -1 ? (isAr ? 'غير محدود' : 'Illimité') : plan.max_cases}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {isAr ? 'التخزين' : 'Stockage'}
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {plan.max_storage_gb} GB
                </span>
              </div>
            </div>

            {/* Features */}
            {plan.features && Object.keys(plan.features).length > 0 && (
              <div className="space-y-2 mb-6">
                {Object.entries(plan.features).map(([key, value]) => (
                  value && (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <Check size={16} className="text-green-500 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400">
                        {key.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Subscribers */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {isAr ? 'المشتركين' : 'Abonnés'}
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {plan.subscriber_count || 0}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                plan.is_active 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {plan.is_active ? (isAr ? 'نشط' : 'Actif') : (isAr ? 'غير نشط' : 'Inactif')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <CreditCard size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">
            {isAr ? 'لم يتم العثور على خطط اشتراك' : 'Aucun plan d\'abonnement trouvé'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
