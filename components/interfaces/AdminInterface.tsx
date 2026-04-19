import React, { useState, useEffect } from 'react';
import { Language, EnhancedUserProfile, UserRole } from '../../types';
import {
  Settings, Users, BarChart3, Shield, Database, Server, Activity,
  AlertTriangle, CheckCircle, TrendingUp, Clock, Eye, Edit, Trash2,
  Plus, Search, Download, Wifi, Lock, Building, CreditCard, Gavel, Filter
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
  role: UserRole;
  organisation: string;
  dernierAcces: Date;
  statut: 'actif' | 'inactif' | 'suspendu';
  credits: number;
}

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
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statistiques, setStatistiques] = useState({
    utilisateursTotal: 0,
    utilisateursActifs: 0,
    requetesJour: 0,
    uptimeSysteme: 99.9,
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

      // Charger les profils avec les colonnes existantes
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, profession, subscription_plan, credits_remaining, is_active, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (profilesError) {
        console.error('Erreur chargement profils:', profilesError);
        return;
      }

      if (profiles) {
        const mapped: UtilisateurSysteme[] = profiles.map((p: any) => ({
          id: p.id,
          nom: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email,
          email: p.email,
          role: (p.profession as UserRole) || UserRole.AVOCAT,
          organisation: '-',
          dernierAcces: p.created_at ? new Date(p.created_at) : new Date(0),
          statut: p.is_active === false ? 'inactif' : 'actif',
          credits: p.credits_remaining || 0,
        }));
        setUtilisateurs(mapped);
        const actifs = mapped.filter(u => u.statut === 'actif').length;
        setStatistiques(s => ({ ...s, utilisateursTotal: mapped.length, utilisateursActifs: actifs }));
      }

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { count: reqCount, error: docError } = await supabase
        .from('documents').select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (!docError) {
        setStatistiques(s => ({ ...s, requetesJour: reqCount || 0 }));
      }
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

  const getRoleBadgeColor = (role: UserRole) => {
    const map: Record<UserRole, string> = {
      [UserRole.AVOCAT]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      [UserRole.NOTAIRE]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      [UserRole.HUISSIER]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      [UserRole.MAGISTRAT]: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
      [UserRole.ETUDIANT]: 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 border-teal-200 dark:border-teal-800',
      [UserRole.JURISTE_ENTREPRISE]: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
      [UserRole.ADMIN]: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800',
    };
    return map[role] || 'bg-slate-100 text-slate-700';
  };

  const getRoleDisplayName = (role: UserRole, isAr: boolean): string => {
    const names: Record<UserRole, string> = {
      [UserRole.AVOCAT]: isAr ? 'محامي' : 'Avocat',
      [UserRole.NOTAIRE]: isAr ? 'موثق' : 'Notaire',
      [UserRole.HUISSIER]: isAr ? 'محضر قضائي' : 'Huissier',
      [UserRole.MAGISTRAT]: isAr ? 'قاضي' : 'Magistrat',
      [UserRole.ETUDIANT]: isAr ? 'طالب قانون' : 'Étudiant',
      [UserRole.JURISTE_ENTREPRISE]: isAr ? 'مستشار قانوني' : 'Juriste Entreprise',
      [UserRole.ADMIN]: isAr ? 'مدير' : 'Admin',
    };
    return names[role];
  };

  const getRoleFilterOptions = (isAr: boolean) => [
    { value: 'all', label: isAr ? 'الكل' : 'Tous les rôles' },
    { value: UserRole.AVOCAT, label: isAr ? 'محامون' : 'Avocats' },
    { value: UserRole.NOTAIRE, label: isAr ? 'موثقون' : 'Notaires' },
    { value: UserRole.HUISSIER, label: isAr ? 'محضرون' : 'Huissiers' },
    { value: UserRole.MAGISTRAT, label: isAr ? 'قضاة' : 'Magistrats' },
    { value: UserRole.ETUDIANT, label: isAr ? 'طلاب' : 'Étudiants' },
    { value: UserRole.JURISTE_ENTREPRISE, label: isAr ? 'مستشارون' : 'Juristes Entreprise' },
    { value: UserRole.ADMIN, label: isAr ? 'مدراء' : 'Administrateurs' },
  ];

  const filteredUtilisateurs = utilisateurs.filter(u =>
    roleFilter === 'all' ? true : u.role === roleFilter
  );

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
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{isAr ? 'Ø§Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†' : 'Utilisateurs Total'}</h3>
                <p className="text-xs text-slate-500 mt-1">{statistiques.utilisateursActifs} {isAr ? 'Ù†Ø´Ø·' : 'actifs'}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl"><Activity size={20} /></div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{statistiques.requetesJour}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{isAr ? 'Ø·Ù„Ø¨Ø§Øª ÙŠÙˆÙ…ÙŠØ©' : 'Requetes/Jour'}</h3>
                <p className="text-xs text-slate-500 mt-1">+12% vs hier</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl"><Server size={20} /></div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{statistiques.uptimeSysteme}%</span>
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{isAr ? 'ÙˆÙ‚Øª Ø§Ù„ØªØ´ØºÙŠÙ„' : 'Uptime Systeme'}</h3>
                <p className="text-xs text-slate-500 mt-1">{isAr ? 'Ù…Ù…ØªØ§Ø²' : 'Excellent'}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl"><AlertTriangle size={20} /></div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">0</span>
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{isAr ? 'ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ù†Ø´Ø·Ø©' : 'Alertes Actives'}</h3>
                <p className="text-xs text-slate-500 mt-1">0 {isAr ? 'Ø­Ø±Ø¬Ø©' : 'critiques'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {/* Users Management */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                      <Users size={20} className="text-blue-500" />
                      {isAr ? 'Ø§Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†' : 'Gestion Utilisateurs'}
                    </h2>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Filter size={14} className="text-slate-400" />
                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                          className="bg-transparent border-none outline-none text-sm font-medium cursor-pointer"
                        >
                          {getRoleFilterOptions(isAr).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Search size={14} className="text-slate-400" />
                        <input type="text" placeholder={isAr ? 'Ø§Ù„Ø¨Ø­Ø«...' : 'Rechercher...'} className="bg-transparent border-none outline-none text-sm w-32" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto" />
                        <p className="mt-3 text-slate-400 text-sm">{isAr ? 'Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...' : 'Chargement...'}</p>
                      </div>
                    ) : filteredUtilisateurs.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Users size={40} className="mx-auto mb-2 opacity-30" />
                        <p>{isAr ? 'لا يوجد مستخدمون' : 'Aucun utilisateur'}</p>
                        {roleFilter !== 'all' && (
                          <p className="text-sm mt-2">
                            {isAr ? 'جرب تصفية أخرى' : 'Essayez un autre filtre'}
                          </p>
                        )}
                      </div>
                    ) : filteredUtilisateurs.map(u => (
                      <div key={u.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-500 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                              {u.nom.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-bold text-slate-900 dark:text-slate-100">{u.nom}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatutColor(u.statut)}`}>
                                  {u.statut === 'actif' ? (isAr ? 'نشط' : 'ACTIF') : (isAr ? 'غير نشط' : 'INACTIF')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{u.email}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className={`px-2 py-0.5 rounded border font-medium ${getRoleBadgeColor(u.role)}`}>
                                  {getRoleDisplayName(u.role, isAr)}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>{u.credits} {isAr ? 'رصيد' : 'crédits'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Eye size={15} /></button>
                            <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit size={15} /></button>
                            <button className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
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
