import React, { useState, useEffect } from 'react';
import { Language, EnhancedUserProfile } from '../../types';
import {
  Settings, Users, BarChart3, Shield, Database, Server, Activity,
  AlertTriangle, CheckCircle, TrendingUp, Clock, Eye, Edit, Trash2,
  Plus, Search, Download, Wifi, Lock, Building, CreditCard, Gavel,
  Filter, Scale, BookOpen, Briefcase, GraduationCap, Building2, Star
} from 'lucide-react';
import OrganizationManagement from './admin/OrganizationManagement';
import SubscriptionManagement from './admin/SubscriptionManagement';
import JurisprudenceValidationPanel from '../jurisprudence/JurisprudenceValidationPanel';
import AdminPaymentsPanel from '../../src/components/billing/AdminPaymentsPanel';

interface AdminInterfaceProps {
  user: EnhancedUserProfile;
  language: Language;
  theme?: 'light' | 'dark';
}

interface UtilisateurSysteme {
  id: string;
  nom: string;
  email: string;
  role: string;
  profession: string;
  organisation: string;
  dernierAcces: Date;
  statut: 'actif' | 'inactif' | 'suspendu';
  credits: number;
  plan: string;
}

// Config rôle → couleur + icône + label
const ROLE_CONFIG: Record<string, {
  label_fr: string; label_ar: string;
  color: string; icon: React.ReactNode;
}> = {
  avocat:             { label_fr: 'Avocat',           label_ar: 'محامي',         color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',    icon: <Scale size={11} /> },
  notaire:            { label_fr: 'Notaire',           label_ar: 'موثق',          color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: <BookOpen size={11} /> },
  huissier:           { label_fr: 'Huissier',          label_ar: 'محضر',          color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', icon: <Briefcase size={11} /> },
  magistrat:          { label_fr: 'Magistrat',         label_ar: 'قاضي',          color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',       icon: <Gavel size={11} /> },
  etudiant:           { label_fr: 'Étudiant',          label_ar: 'طالب',          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: <GraduationCap size={11} /> },
  juriste_entreprise: { label_fr: 'Juriste Entreprise',label_ar: 'مستشار قانوني', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',   icon: <Building2 size={11} /> },
  admin:              { label_fr: 'Administrateur',    label_ar: 'مدير',          color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',    icon: <Shield size={11} /> },
};

const PLAN_CONFIG: Record<string, { label: string; color: string }> = {
  free:    { label: 'Gratuit', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  pro:     { label: 'Pro',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  cabinet: { label: 'Cabinet', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

interface MetriqueSysteme {
  nom: string;
  valeur: string | number;
  unite?: string;
  tendance: 'hausse' | 'baisse' | 'stable';
  statut: 'bon' | 'attention' | 'critique';
}

type AdminTab = 'overview' | 'organizations' | 'subscriptions' | 'payments' | 'jurisprudence';

const AdminInterface: React.FC<AdminInterfaceProps> = ({ user, language, theme = 'light' }) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurSysteme[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [statistiques, setStatistiques] = useState({
    utilisateursTotal: 0,
    utilisateursActifs: 0,
    requetesJour: 0,
    uptimeSysteme: 99.9,
  });

  // Comptage par rôle pour les badges du filtre
  const roleCount = utilisateurs.reduce<Record<string, number>>((acc, u) => {
    const r = u.profession || u.role || 'avocat';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  // Utilisateurs filtrés
  const utilisateursFiltres = utilisateurs.filter(u => {
    const role = u.profession || u.role || 'avocat';
    const matchRole   = filterRole === 'all' || role === filterRole;
    const matchStatut = filterStatut === 'all' || u.statut === filterStatut;
    const matchSearch = !searchTerm ||
      u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.organisation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchStatut && matchSearch;
  });

  const metriques: MetriqueSysteme[] = [
    { nom: isAr ? 'Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ† Ø§Ù„Ù†Ø´Ø·ÙˆÙ†' : 'Utilisateurs Actifs', valeur: statistiques.utilisateursActifs, tendance: 'hausse', statut: 'bon' },
    { nom: isAr ? 'Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ/ÙŠÙˆÙ…' : 'Requetes IA/jour', valeur: statistiques.requetesJour, tendance: 'hausse', statut: 'bon' },
    { nom: isAr ? 'ÙˆÙ‚Øª Ø§Ù„ØªØ´ØºÙŠÙ„' : 'Uptime Systeme', valeur: statistiques.uptimeSysteme, unite: '%', tendance: 'stable', statut: 'bon' },
    { nom: isAr ? 'Ø§Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†' : 'Total Utilisateurs', valeur: statistiques.utilisateursTotal, tendance: 'hausse', statut: 'bon' },
  ];

  useEffect(() => { loadRealData(); }, []);

  const loadRealData = async () => {
    try {
      setLoading(true);
      const { supabase } = await import('../../src/lib/supabase');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, profession, organization_name, is_active, subscription_plan, credits_remaining, account_status, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (profilesError) {
        console.error('AdminInterface profiles error:', profilesError);
      }

      if (profiles) {
        const mapped: UtilisateurSysteme[] = profiles.map((p: any) => ({
          id: p.id,
          nom: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email,
          email: p.email,
          role: p.profession || 'avocat',
          profession: p.profession || 'avocat',
          organisation: p.organization_name || '-',
          dernierAcces: p.last_sign_in_at ? new Date(p.last_sign_in_at) : new Date(0),
          statut: p.account_status === 'suspended' ? 'suspendu' : p.is_active === false ? 'inactif' : 'actif',
          credits: p.credits_remaining || 0,
          plan: p.subscription_plan || 'free',
        }));
        setUtilisateurs(mapped);
        const actifs = mapped.filter(u => u.statut === 'actif').length;
        setStatistiques(s => ({ ...s, utilisateursTotal: mapped.length, utilisateursActifs: actifs }));
      }

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { count: reqCount } = await supabase
        .from('documents').select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      setStatistiques(s => ({ ...s, requetesJour: reqCount || 0 }));
    } catch (err) {
      console.error('AdminInterface loadRealData error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut: string) => {
    const map: Record<string, string> = {
      actif:    'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      inactif:  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
      suspendu: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      bon:      'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      attention:'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
      critique: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    };
    return map[statut] || 'bg-slate-100 text-slate-700';
  };

  const getTendanceIcon = (tendance: string) => {
    if (tendance === 'hausse') return <TrendingUp size={14} className="text-green-500" />;
    if (tendance === 'baisse') return <TrendingUp size={14} className="text-red-500 rotate-180" />;
    return <div className="w-3 h-0.5 bg-slate-400 rounded" />;
  };

  const tabClass = (tab: AdminTab) =>
    `px-4 py-3 rounded-xl font-bold text-sm transition-all ${
      activeTab === tab
        ? 'bg-red-600 text-white shadow-lg'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
    }`;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <Settings className="text-red-600" size={32} />
              {isAr ? 'Ù„ÙˆØ­Ø© ØªØ­ÙƒÙ… Ø§Ù„Ù…Ø¯ÙŠØ±' : 'Administration Systeme'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr ? `Ù…Ø±Ø­Ø¨Ø§ ${user.firstName}` : `Bienvenue ${user.firstName} - Gestion complete de la plateforme`}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:border-red-600 transition-colors">
              <Download size={16} className="inline mr-2" />
              {isAr ? 'ØªØµØ¯ÙŠØ± Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª' : 'Export Donnees'}
            </button>
            <button className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
              <Plus size={18} />
              {isAr ? 'Ù…Ø³ØªØ®Ø¯Ù… Ø¬Ø¯ÙŠØ¯' : 'Nouvel Utilisateur'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
              <BarChart3 size={16} className="inline mr-2" />
              {isAr ? 'Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø©' : "Vue d'ensemble"}
            </button>
            <button onClick={() => setActiveTab('organizations')} className={tabClass('organizations')}>
              <Building size={16} className="inline mr-2" />
              {isAr ? 'Ø§Ù„Ù…Ù†Ø¸Ù…Ø§Øª' : 'Organisations'}
            </button>
            <button onClick={() => setActiveTab('subscriptions')} className={tabClass('subscriptions')}>
              <CreditCard size={16} className="inline mr-2" />
              {isAr ? 'Ø§Ù„Ø§Ø´ØªØ±Ø§ÙƒØ§Øª' : 'Abonnements'}
            </button>
            <button onClick={() => setActiveTab('payments')} className={tabClass('payments')}>
              <CreditCard size={16} className="inline mr-2" />
              {isAr ? 'Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª' : 'Paiements'}
            </button>
            <button onClick={() => setActiveTab('jurisprudence')} className={tabClass('jurisprudence')}>
              <Gavel size={16} className="inline mr-2" />
              {isAr ? 'Ø§Ù„Ø§Ø¬ØªÙ‡Ø§Ø¯ Ø§Ù„Ù‚Ø¶Ø§Ø¦ÙŠ' : 'Jurisprudence'}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl"><Users size={20} /></div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{statistiques.utilisateursTotal}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{isAr ? 'إجمالي المستخدمين' : 'Utilisateurs Total'}</h3>
                <p className="text-xs text-slate-500 mt-1">{statistiques.utilisateursActifs} {isAr ? 'نشط' : 'actifs'}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl"><Activity size={20} /></div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{statistiques.requetesJour}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{isAr ? 'طلبات يومية' : 'Requetes/Jour'}</h3>
                <p className="text-xs text-slate-500 mt-1">+12% vs hier</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl"><Server size={20} /></div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{statistiques.uptimeSysteme}%</span>
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{isAr ? 'وقت التشغيل' : 'Uptime Systeme'}</h3>
                <p className="text-xs text-slate-500 mt-1">{isAr ? 'ممتاز' : 'Excellent'}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl"><AlertTriangle size={20} /></div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">0</span>
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{isAr ? 'تنبيهات نشطة' : 'Alertes Actives'}</h3>
                <p className="text-xs text-slate-500 mt-1">0 {isAr ? 'حرجة' : 'critiques'}</p>
              </div>
            </div>

            {/* Role breakdown bar */}
            {utilisateurs.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <Shield size={16} className="text-slate-400" />
                  {isAr ? 'توزيع المستخدمين حسب الدور' : 'Répartition par rôle'}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(ROLE_CONFIG).filter(([key]) => roleCount[key]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setFilterRole(filterRole === key ? 'all' : key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                        filterRole === key
                          ? 'border-current shadow-md scale-105'
                          : 'border-transparent hover:border-current hover:scale-105'
                      } ${cfg.color}`}
                    >
                      <span className="text-base">{cfg.icon}</span>
                      <div className="text-left">
                        <div className="text-xs font-bold">{isAr ? cfg.label_ar : cfg.label_fr}</div>
                        <div className="text-lg font-black leading-none">{roleCount[key]}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {/* Users Management */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  {/* Header */}
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-lg flex items-center gap-2">
                        <Users size={20} className="text-blue-500" />
                        {isAr ? 'إدارة المستخدمين' : 'Gestion Utilisateurs'}
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                          {utilisateursFiltres.length}/{utilisateurs.length}
                        </span>
                      </h2>
                    </div>

                    {/* Search + Filters row */}
                    <div className="flex flex-wrap gap-3">
                      {/* Search */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 min-w-[180px]">
                        <Search size={14} className="text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          placeholder={isAr ? 'بحث بالاسم أو البريد...' : 'Nom, email, organisation...'}
                          className="bg-transparent border-none outline-none text-sm w-full"
                        />
                      </div>

                      {/* Role filter */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <Filter size={14} className="text-slate-400 shrink-0" />
                        <select
                          value={filterRole}
                          onChange={e => setFilterRole(e.target.value)}
                          className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <option value="all">{isAr ? 'كل الأدوار' : 'Tous les rôles'}</option>
                          {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>
                              {isAr ? cfg.label_ar : cfg.label_fr} {roleCount[key] ? `(${roleCount[key]})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status filter */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <select
                          value={filterStatut}
                          onChange={e => setFilterStatut(e.target.value)}
                          className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <option value="all">{isAr ? 'كل الحالات' : 'Tous les statuts'}</option>
                          <option value="actif">{isAr ? 'نشط' : 'Actif'}</option>
                          <option value="inactif">{isAr ? 'غير نشط' : 'Inactif'}</option>
                          <option value="suspendu">{isAr ? 'موقوف' : 'Suspendu'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Role quick-filter chips */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => setFilterRole('all')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          filterRole === 'all'
                            ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isAr ? 'الكل' : 'Tous'} ({utilisateurs.length})
                      </button>
                      {Object.entries(ROLE_CONFIG).filter(([key]) => roleCount[key]).map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() => setFilterRole(filterRole === key ? 'all' : key)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            filterRole === key ? cfg.color + ' ring-2 ring-offset-1 ring-current' : cfg.color + ' opacity-70 hover:opacity-100'
                          }`}
                        >
                          {cfg.icon}
                          {isAr ? cfg.label_ar : cfg.label_fr} ({roleCount[key]})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* User list */}
                  <div className="p-4 space-y-2 max-h-[520px] overflow-y-auto">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto" />
                        <p className="mt-3 text-slate-400 text-sm">{isAr ? 'جاري التحميل...' : 'Chargement...'}</p>
                      </div>
                    ) : utilisateursFiltres.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">
                        <Users size={40} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{isAr ? 'لا يوجد مستخدمون' : 'Aucun utilisateur trouvé'}</p>
                        {(filterRole !== 'all' || filterStatut !== 'all' || searchTerm) && (
                          <button
                            onClick={() => { setFilterRole('all'); setFilterStatut('all'); setSearchTerm(''); }}
                            className="mt-2 text-xs text-blue-500 hover:underline"
                          >
                            {isAr ? 'إعادة تعيين الفلاتر' : 'Réinitialiser les filtres'}
                          </button>
                        )}
                      </div>
                    ) : utilisateursFiltres.map(u => {
                      const roleKey = u.profession || u.role || 'avocat';
                      const roleCfg = ROLE_CONFIG[roleKey] || ROLE_CONFIG['avocat'];
                      const planCfg = PLAN_CONFIG[u.plan] || PLAN_CONFIG['free'];
                      const initials = u.nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                      return (
                        <div key={u.id} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group">
                          {/* Avatar */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${roleCfg.color}`}>
                            {initials}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{u.nom}</span>
                              {/* Role badge */}
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${roleCfg.color}`}>
                                {roleCfg.icon}
                                {isAr ? roleCfg.label_ar : roleCfg.label_fr}
                              </span>
                              {/* Status badge */}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatutColor(u.statut)}`}>
                                {u.statut === 'actif' ? (isAr ? 'نشط' : 'ACTIF') :
                                 u.statut === 'suspendu' ? (isAr ? 'موقوف' : 'SUSPENDU') :
                                 (isAr ? 'غير نشط' : 'INACTIF')}
                              </span>
                              {/* Plan badge */}
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${planCfg.color}`}>
                                <Star size={9} />
                                {planCfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-slate-500 truncate">{u.email}</p>
                              {u.organisation !== '-' && (
                                <span className="text-slate-300 dark:text-slate-600">·</span>
                              )}
                              {u.organisation !== '-' && (
                                <p className="text-xs text-slate-400 truncate">{u.organisation}</p>
                              )}
                            </div>
                          </div>

                          {/* Last access */}
                          <div className="hidden md:flex flex-col items-end shrink-0">
                            <span className="text-[10px] text-slate-400">
                              {u.dernierAcces.getTime() === 0
                                ? (isAr ? 'لم يتصل' : 'Jamais')
                                : u.dernierAcces.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR')}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title={isAr ? 'عرض' : 'Voir'}>
                              <Eye size={14} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title={isAr ? 'تعديل' : 'Modifier'}>
                              <Edit size={14} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title={isAr ? 'حذف' : 'Supprimer'}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-green-500" />
                    {isAr ? 'Ù…Ù‚Ø§ÙŠÙŠØ³ Ø§Ù„Ù†Ø¸Ø§Ù…' : 'Metriques Systeme'}
                  </h3>
                  <div className="space-y-3">
                    {metriques.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.nom}</span>
                            {getTendanceIcon(m.tendance)}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{m.valeur}{m.unite}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatutColor(m.statut)}`}>{m.statut}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl border border-green-200 dark:border-green-800 p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CheckCircle size={18} />
                    {isAr ? 'Ø­Ø§Ù„Ø© Ø§Ù„Ù†Ø¸Ø§Ù…' : 'Etat du Systeme'}
                  </h3>
                  {[
                    { icon: <Server size={14} />, label: isAr ? 'Ø§Ù„Ø®ÙˆØ§Ø¯Ù…' : 'Serveurs' },
                    { icon: <Database size={14} />, label: isAr ? 'Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª' : 'Base de donnees' },
                    { icon: <Wifi size={14} />, label: isAr ? 'Ø§Ù„Ø´Ø¨ÙƒØ©' : 'Reseau' },
                    { icon: <Lock size={14} />, label: isAr ? 'Ø§Ù„Ø§Ù…Ø§Ù†' : 'Securite' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-green-600">{item.icon}<span className="text-sm text-green-700 dark:text-green-300">{item.label}</span></div>
                      <span className="text-xs font-bold text-green-600">OK</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'organizations' && (
          <OrganizationManagement language={language} theme={theme} />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionManagement language={language} theme={theme} />
        )}

        {activeTab === 'payments' && (
          <AdminPaymentsPanel language={language} />
        )}

        {activeTab === 'jurisprudence' && (
          <JurisprudenceValidationPanel adminId={user.id} language={language} theme={theme} />
        )}

      </div>
    </div>
  );
};

export default AdminInterface;
