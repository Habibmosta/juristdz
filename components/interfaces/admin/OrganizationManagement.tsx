import React, { useState, useEffect } from 'react';
import { Language } from '../../../types';
import { 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  FileText,
  HardDrive,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Organization {
  id: string;
  name: string;
  type: string;
  subscription_status: string;
  subscription_plan_id: string;
  current_users: number;
  current_cases: number;
  current_storage_mb: number;
  trial_ends_at: string | null;
  created_at: string;
  plan_name?: string;
  max_users?: number;
  max_cases?: number;
  max_storage_gb?: number;
}

interface OrganizationManagementProps {
  language: Language;
  theme?: 'light' | 'dark';
}

const OrganizationManagement: React.FC<OrganizationManagementProps> = ({
  language,
  theme = 'light'
}) => {
  const isAr = language === 'ar';
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          subscription_plans (
            name,
            max_users,
            max_cases,
            max_storage_gb
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(org => ({
        ...org,
        plan_name: org.subscription_plans?.name,
        max_users: org.subscription_plans?.max_users,
        max_cases: org.subscription_plans?.max_cases,
        max_storage_gb: org.subscription_plans?.max_storage_gb
      })) || [];

      setOrganizations(formattedData);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'trial': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'past_due': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'suspended': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, { fr: string; ar: string }> = {
      cabinet_avocat: { fr: 'Cabinet Avocat', ar: 'مكتب محاماة' },
      etude_notaire: { fr: 'Étude Notaire', ar: 'مكتب توثيق' },
      etude_huissier: { fr: 'Étude Huissier', ar: 'مكتب محضر' },
      entreprise: { fr: 'Entreprise', ar: 'شركة' }
    };
    return isAr ? types[type]?.ar : types[type]?.fr;
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, { fr: string; ar: string }> = {
      active: { fr: 'Actif', ar: 'نشط' },
      trial: { fr: 'Essai', ar: 'تجريبي' },
      past_due: { fr: 'En retard', ar: 'متأخر' },
      cancelled: { fr: 'Annulé', ar: 'ملغى' },
      suspended: { fr: 'Suspendu', ar: 'معلق' }
    };
    return isAr ? statuses[status]?.ar : statuses[status]?.fr;
  };

  const calculateUsagePercent = (current: number, max: number) => {
    if (!max) return 0;
    return Math.round((current / max) * 100);
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || org.subscription_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
            <Building className="text-red-600" size={28} />
            {isAr ? 'إدارة المنظمات' : 'Gestion des Organisations'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isAr ? `${organizations.length} منظمة مسجلة` : `${organizations.length} organisations enregistrées`}
          </p>
        </div>
        
        <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
          <Plus size={18} />
          {isAr ? 'منظمة جديدة' : 'Nouvelle Organisation'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder={isAr ? 'البحث عن منظمة...' : 'Rechercher une organisation...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium"
          >
            <option value="all">{isAr ? 'جميع الحالات' : 'Tous les statuts'}</option>
            <option value="active">{isAr ? 'نشط' : 'Actif'}</option>
            <option value="trial">{isAr ? 'تجريبي' : 'Essai'}</option>
            <option value="past_due">{isAr ? 'متأخر' : 'En retard'}</option>
            <option value="cancelled">{isAr ? 'ملغى' : 'Annulé'}</option>
            <option value="suspended">{isAr ? 'معلق' : 'Suspendu'}</option>
          </select>
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrganizations.map(org => {
          const usersPercent = calculateUsagePercent(org.current_users, org.max_users || 1);
          const casesPercent = calculateUsagePercent(org.current_cases, org.max_cases || 1);
          const storagePercent = calculateUsagePercent(
            org.current_storage_mb, 
            (org.max_storage_gb || 1) * 1024
          );

          return (
            <div 
              key={org.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-red-600 transition-all cursor-pointer shadow-sm hover:shadow-lg"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1">
                    {org.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">
                      {getTypeLabel(org.type)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(org.subscription_status)}`}>
                      {getStatusLabel(org.subscription_status)}
                    </span>
                    {org.plan_name && (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        {org.plan_name}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                    <Eye size={16} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                    <Edit size={16} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="space-y-3">
                {/* Users */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Users size={14} />
                      <span>{isAr ? 'المستخدمين' : 'Utilisateurs'}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {org.current_users} / {org.max_users}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        usersPercent >= 90 ? 'bg-red-500' : 
                        usersPercent >= 70 ? 'bg-amber-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(usersPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Cases */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <FileText size={14} />
                      <span>{isAr ? 'الملفات' : 'Dossiers'}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {org.current_cases} / {org.max_cases}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        casesPercent >= 90 ? 'bg-red-500' : 
                        casesPercent >= 70 ? 'bg-amber-500' : 
                        'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(casesPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Storage */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <HardDrive size={14} />
                      <span>{isAr ? 'التخزين' : 'Stockage'}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {(org.current_storage_mb / 1024).toFixed(2)} / {org.max_storage_gb} GB
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        storagePercent >= 90 ? 'bg-red-500' : 
                        storagePercent >= 70 ? 'bg-amber-500' : 
                        'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(storagePercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>
                    {isAr ? 'تاريخ الإنشاء:' : 'Créé le:'} {new Date(org.created_at).toLocaleDateString()}
                  </span>
                </div>
                {org.trial_ends_at && org.subscription_status === 'trial' && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertCircle size={12} />
                    <span>
                      {isAr ? 'ينتهي في:' : 'Expire le:'} {new Date(org.trial_ends_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrganizations.length === 0 && (
        <div className="text-center py-12">
          <Building size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">
            {isAr ? 'لم يتم العثور على منظمات' : 'Aucune organisation trouvée'}
          </p>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;
