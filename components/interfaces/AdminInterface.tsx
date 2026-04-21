import React, { useState, useEffect } from 'react';
import { Language, EnhancedUserProfile } from '../../types';
import {
  Settings, Users, BarChart3, Shield, Database, Server, Activity,
  AlertTriangle, CheckCircle, TrendingUp, Eye, Edit, Trash2,
  Plus, Search, Download, Wifi, Lock, Building, CreditCard, Gavel,
  Filter, Scale, BookOpen, Briefcase, GraduationCap, Building2, Star,
  X, Save, Ban, RefreshCw, Mail
} from 'lucide-react';
import OrganizationManagement from './admin/OrganizationManagement';
import SubscriptionManagement from './admin/SubscriptionManagement';
import JurisprudenceValidationPanel from '../jurisprudence/JurisprudenceValidationPanel';
import AdminPaymentsPanel from '../../src/components/billing/AdminPaymentsPanel';
import Modal from '../../src/components/common/Modal';

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

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  avocat:             { label: 'Avocat',            color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',    icon: <Scale size={11} /> },
  notaire:            { label: 'Notaire',            color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: <BookOpen size={11} /> },
  huissier:           { label: 'Huissier',           color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', icon: <Briefcase size={11} /> },
  magistrat:          { label: 'Magistrat',          color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',       icon: <Gavel size={11} /> },
  etudiant:           { label: 'Etudiant',           color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: <GraduationCap size={11} /> },
  juriste_entreprise: { label: 'Juriste Entreprise', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',   icon: <Building2 size={11} /> },
  admin:              { label: 'Administrateur',     color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',    icon: <Shield size={11} /> },
};

const PLAN_CONFIG: Record<string, { label: string; color: string }> = {
  free:    { label: 'Gratuit', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  pro:     { label: 'Pro',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  cabinet: { label: 'Cabinet', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

type AdminTab = 'overview' | 'organizations' | 'subscriptions' | 'payments' | 'jurisprudence';

interface EditForm {
  firstName: string; lastName: string; profession: string;
  organisation: string; plan: string; credits: string;
  accountStatus: string; isAdmin: boolean;
}

const AdminInterface: React.FC<AdminInterfaceProps> = ({ user, language, theme = 'light' }) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurSysteme[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [statistiques, setStatistiques] = useState({ total: 0, actifs: 0, requetes: 0, uptime: 99.9 });

  const [selectedUser, setSelectedUser] = useState<UtilisateurSysteme | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'delete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: '', lastName: '', profession: 'avocat',
    organisation: '', plan: 'free', credits: '5',
    accountStatus: 'active', isAdmin: false,
  });
  const [deleteReason, setDeleteReason] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [showForcePassword, setShowForcePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [forcePasswordLoading, setForcePasswordLoading] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openModal = (u: UtilisateurSysteme, mode: 'view' | 'edit' | 'delete') => {
    document.body.style.overflow = 'hidden';
    setSelectedUser(u);
    setModalMode(mode);
    setShowForcePassword(false);
    setNewPassword('');
    if (mode === 'edit') {
      const parts = u.nom.split(' ');
      setEditForm({
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        profession: u.profession || 'avocat',
        organisation: u.organisation === '-' ? '' : u.organisation,
        plan: u.plan || 'free',
        credits: String(u.credits || 5),
        accountStatus: u.statut === 'actif' ? 'active' : u.statut === 'suspendu' ? 'suspended' : 'blocked',
        isAdmin: u.profession === 'admin',
      });
    }
    setDeleteReason('');
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalMode(null);
    document.body.style.overflow = '';
  };

  const handleForcePassword = async () => {
    if (!selectedUser || newPassword.length < 8) {
      showToast('Minimum 8 caracteres', 'error');
      return;
    }
    setForcePasswordLoading(true);
    try {
      const { supabase } = await import('../../src/lib/supabase');
      const { data, error } = await supabase.rpc('admin_force_password', {
        p_user_id: selectedUser.id,
        p_new_password: newPassword,
      });
      if (error) throw error;
      if ((data as any)?.success === false) throw new Error((data as any).message);
      showToast('Mot de passe mis a jour');
      setShowForcePassword(false);
      setNewPassword('');
    } catch (e: any) {
      showToast(e.message || 'Erreur', 'error');
    } finally { setForcePasswordLoading(false); }
  };

  const handleResetPassword = async (email: string) => {
    if (!confirm('Envoyer un email de reinitialisation a ' + email + ' ?')) return;
    setResetLoading(true);
    try {
      const { supabase } = await import('../../src/lib/supabase');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      showToast('Email envoye a ' + email);
    } catch (e: any) {
      showToast(e.message || 'Erreur', 'error');
    } finally { setResetLoading(false); }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const { supabase } = await import('../../src/lib/supabase');
      const { data, error } = await supabase.rpc('admin_update_user_profile', {
        p_user_id: selectedUser.id,
        p_first_name: editForm.firstName || null,
        p_last_name: editForm.lastName || null,
        p_profession: editForm.profession || null,
        p_organization: editForm.organisation || null,
        p_account_status: editForm.accountStatus || null,
        p_subscription_plan: editForm.plan || null,
        p_credits: editForm.credits ? parseInt(editForm.credits) : null,
        p_is_admin: editForm.isAdmin,
      });
      if (error) throw error;
      if ((data as any)?.success === false) throw new Error((data as any).message);
      showToast('Profil mis a jour');
      closeModal();
      loadRealData();
    } catch (e: any) {
      showToast(e.message || 'Erreur', 'error');
    } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const { supabase } = await import('../../src/lib/supabase');
      await supabase.rpc('admin_delete_user', {
        p_user_id: selectedUser.id,
        p_reason: deleteReason || 'Supprime par administrateur',
      });
      showToast('Compte bloque');
      closeModal();
      loadRealData();
    } catch (e: any) {
      showToast(e.message || 'Erreur', 'error');
    } finally { setActionLoading(false); }
  };

  const roleCount = utilisateurs.reduce<Record<string, number>>((acc, u) => {
    const r = u.profession || 'avocat';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  const utilisateursFiltres = utilisateurs.filter(u => {
    const role = u.profession || 'avocat';
    if (filterRole !== 'all' && role !== filterRole) return false;
    if (filterStatut !== 'all' && u.statut !== filterStatut) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!u.nom.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !u.organisation.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  useEffect(() => { loadRealData(); }, []);

  const loadRealData = async () => {
    try {
      setLoading(true);
      const { supabase } = await import('../../src/lib/supabase');
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, profession, organization_name, is_active, subscription_plan, credits_remaining, account_status, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) console.error('AdminInterface profiles error:', error);
      if (profiles) {
        const mapped: UtilisateurSysteme[] = profiles.map((p: any) => ({
          id: p.id,
          nom: (p.first_name + ' ' + (p.last_name || '')).trim() || p.email,
          email: p.email,
          role: p.profession || 'avocat',
          profession: p.profession || 'avocat',
          organisation: p.organization_name || '-',
          dernierAcces: new Date(0),
          statut: p.account_status === 'suspended' ? 'suspendu' : p.is_active === false ? 'inactif' : 'actif',
          credits: p.credits_remaining || 0,
          plan: p.subscription_plan || 'free',
        }));
        setUtilisateurs(mapped);
        setStatistiques(s => ({ ...s, total: mapped.length, actifs: mapped.filter(u => u.statut === 'actif').length }));
      }
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { count } = await supabase.from('documents').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString());
      setStatistiques(s => ({ ...s, requetes: count || 0 }));
    } catch (err) {
      console.error('AdminInterface error:', err);
    } finally { setLoading(false); }
  };

  const getStatutColor = (statut: string) => {
    if (statut === 'actif') return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    if (statut === 'suspendu') return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  };

  const tabClass = (tab: AdminTab) =>
    'px-4 py-3 rounded-xl font-bold text-sm transition-all ' + (
      activeTab === tab ? 'bg-red-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
    );

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto space-y-8">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <Settings className="text-red-600" size={32} />
                Administration Systeme
              </h1>
              <p className="text-slate-500 mt-1">Bienvenue {user.firstName} - Gestion complete de la plateforme</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:border-red-600 transition-colors">
                <Download size={16} className="inline mr-2" />Export Donnees
              </button>
              <button className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg">
                <Plus size={18} />Nouvel Utilisateur
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setActiveTab('overview')} className={tabClass('overview')}><BarChart3 size={16} className="inline mr-2" />Vue ensemble</button>
              <button onClick={() => setActiveTab('organizations')} className={tabClass('organizations')}><Building size={16} className="inline mr-2" />Organisations</button>
              <button onClick={() => setActiveTab('subscriptions')} className={tabClass('subscriptions')}><CreditCard size={16} className="inline mr-2" />Abonnements</button>
              <button onClick={() => setActiveTab('payments')} className={tabClass('payments')}><CreditCard size={16} className="inline mr-2" />Paiements</button>
              <button onClick={() => setActiveTab('jurisprudence')} className={tabClass('jurisprudence')}><Gavel size={16} className="inline mr-2" />Jurisprudence</button>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl"><Users size={20} /></div>
                    <span className="text-2xl font-bold">{statistiques.total}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Utilisateurs Total</h3>
                  <p className="text-xs text-slate-500 mt-1">{statistiques.actifs} actifs</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl"><Activity size={20} /></div>
                    <span className="text-2xl font-bold">{statistiques.requetes}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Requetes/Jour</h3>
                  <p className="text-xs text-slate-500 mt-1">+12% vs hier</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl"><Server size={20} /></div>
                    <span className="text-2xl font-bold">{statistiques.uptime}%</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Uptime Systeme</h3>
                  <p className="text-xs text-slate-500 mt-1">Excellent</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl"><AlertTriangle size={20} /></div>
                    <span className="text-2xl font-bold">0</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Alertes Actives</h3>
                  <p className="text-xs text-slate-500 mt-1">0 critiques</p>
                </div>
              </div>

              {utilisateurs.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <Shield size={16} className="text-slate-400" />Repartition par role
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(ROLE_CONFIG).filter(([key]) => roleCount[key]).map(([key, cfg]) => (
                      <button key={key} onClick={() => setFilterRole(filterRole === key ? 'all' : key)}
                        className={'flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ' + (filterRole === key ? 'border-current shadow-md scale-105 ' : 'border-transparent hover:border-current hover:scale-105 ') + cfg.color}>
                        <span>{cfg.icon}</span>
                        <div className="text-left">
                          <div className="text-xs font-bold">{cfg.label}</div>
                          <div className="text-lg font-black leading-none">{roleCount[key]}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                          <Users size={20} className="text-blue-500" />
                          Gestion Utilisateurs
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                            {utilisateursFiltres.length}/{utilisateurs.length}
                          </span>
                        </h2>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 min-w-[180px]">
                          <Search size={14} className="text-slate-400 shrink-0" />
                          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Nom, email, organisation..."
                            className="bg-transparent border-none outline-none text-sm w-full" />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <Filter size={14} className="text-slate-400 shrink-0" />
                          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                            <option value="all">Tous les roles</option>
                            {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                              <option key={key} value={key}>{cfg.label} {roleCount[key] ? '(' + roleCount[key] + ')' : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                            <option value="all">Tous les statuts</option>
                            <option value="actif">Actif</option>
                            <option value="inactif">Inactif</option>
                            <option value="suspendu">Suspendu</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button onClick={() => setFilterRole('all')}
                          className={'px-3 py-1 rounded-full text-xs font-bold transition-all ' + (filterRole === 'all' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>
                          Tous ({utilisateurs.length})
                        </button>
                        {Object.entries(ROLE_CONFIG).filter(([key]) => roleCount[key]).map(([key, cfg]) => (
                          <button key={key} onClick={() => setFilterRole(filterRole === key ? 'all' : key)}
                            className={'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ' + (filterRole === key ? cfg.color + ' ring-2 ring-offset-1 ring-current' : cfg.color + ' opacity-70 hover:opacity-100')}>
                            {cfg.icon}{cfg.label} ({roleCount[key]})
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 space-y-2 max-h-[520px] overflow-y-auto">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto" />
                          <p className="mt-3 text-slate-400 text-sm">Chargement...</p>
                        </div>
                      ) : utilisateursFiltres.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                          <Users size={40} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Aucun utilisateur trouve</p>
                        </div>
                      ) : utilisateursFiltres.map(u => {
                        const roleCfg = ROLE_CONFIG[u.profession] || ROLE_CONFIG['avocat'];
                        const planCfg = PLAN_CONFIG[u.plan] || PLAN_CONFIG['free'];
                        const initials = u.nom.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                        return (
                          <div key={u.id} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group">
                            <div className={'w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ' + roleCfg.color}>{initials}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{u.nom}</span>
                                <span className={'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ' + roleCfg.color}>{roleCfg.icon}{roleCfg.label}</span>
                                <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + getStatutColor(u.statut)}>
                                  {u.statut === 'actif' ? 'ACTIF' : u.statut === 'suspendu' ? 'SUSPENDU' : 'INACTIF'}
                                </span>
                                <span className={'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ' + planCfg.color}><Star size={9} />{planCfg.label}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                {u.organisation !== '-' && <><span className="text-slate-300 dark:text-slate-600">·</span><p className="text-xs text-slate-400 truncate">{u.organisation}</p></>}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => openModal(u, 'view')} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Voir"><Eye size={14} /></button>
                              <button onClick={() => openModal(u, 'edit')} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors" title="Modifier"><Edit size={14} /></button>
                              <button onClick={() => openModal(u, 'delete')} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Bloquer"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-green-500" />Metriques Systeme</h3>
                    <div className="space-y-3">
                      {[
                        { nom: 'Utilisateurs Actifs', val: statistiques.actifs },
                        { nom: 'Requetes IA/jour', val: statistiques.requetes },
                        { nom: 'Uptime Systeme', val: statistiques.uptime + '%' },
                        { nom: 'Total Utilisateurs', val: statistiques.total },
                      ].map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.nom}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{m.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl border border-green-200 dark:border-green-800 p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-800 dark:text-green-200"><CheckCircle size={18} />Etat du Systeme</h3>
                    {[
                      { icon: <Server size={14} />, label: 'Serveurs' },
                      { icon: <Database size={14} />, label: 'Base de donnees' },
                      { icon: <Wifi size={14} />, label: 'Reseau' },
                      { icon: <Lock size={14} />, label: 'Securite' },
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

          {activeTab === 'organizations' && <OrganizationManagement language={language} theme={theme} />}
          {activeTab === 'subscriptions' && <SubscriptionManagement language={language} theme={theme} />}
          {activeTab === 'payments' && <AdminPaymentsPanel language={language} />}
          {activeTab === 'jurisprudence' && <JurisprudenceValidationPanel adminId={user.id} language={language} theme={theme} />}

        </div>
      </div>

      {toast && (
        <div className={'fixed bottom-6 right-6 z-[99999] px-5 py-3 rounded-xl shadow-xl text-white font-medium flex items-center gap-2 ' + (toast.type === 'success' ? 'bg-green-600' : 'bg-red-600')}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {modalMode === 'view' && selectedUser && (
        <Modal onClose={closeModal}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-bold text-lg flex items-center gap-2"><Eye size={18} className="text-blue-500" />Profil utilisateur</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: 'Nom complet', value: selectedUser.nom },
                { label: 'Email', value: selectedUser.email },
                { label: 'Role', value: ROLE_CONFIG[selectedUser.profession]?.label || selectedUser.profession },
                { label: 'Organisation', value: selectedUser.organisation },
                { label: 'Plan', value: PLAN_CONFIG[selectedUser.plan]?.label || selectedUser.plan },
                { label: 'Credits', value: String(selectedUser.credits) },
                { label: 'Statut', value: selectedUser.statut },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{value || '-'}</span>
                </div>
              ))}
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={() => { closeModal(); openModal(selectedUser, 'edit'); }}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2">
                <Edit size={15} />Modifier
              </button>
              <button onClick={closeModal}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modalMode === 'edit' && selectedUser && (
        <Modal onClose={closeModal}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 flex flex-col" style={{ maxHeight: 'min(90vh, 660px)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className={'w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 ' + (ROLE_CONFIG[selectedUser.profession] || ROLE_CONFIG['avocat']).color}>
                  {selectedUser.nom.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedUser.nom}</p>
                  <p className="text-xs text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><X size={18} /></button>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-700 shrink-0 px-6">
              <button onClick={() => setShowForcePassword(false)}
                className={'py-3 px-4 text-sm font-bold border-b-2 transition-colors -mb-px ' + (!showForcePassword ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
                <Edit size={13} className="inline mr-1.5" />Modifier le profil
              </button>
              <button onClick={() => setShowForcePassword(true)}
                className={'py-3 px-4 text-sm font-bold border-b-2 transition-colors -mb-px ' + (showForcePassword ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
                <Lock size={13} className="inline mr-1.5" />Mot de passe
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {toast && (
                <div className={'mx-6 mt-4 px-4 py-3 rounded-xl text-white text-sm font-medium flex items-center gap-2 ' + (toast.type === 'success' ? 'bg-green-600' : 'bg-red-600')}>
                  {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                  {toast.msg}
                </div>
              )}
              {!showForcePassword && (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Prenom</label>
                      <input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Nom</label>
                      <input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Role</label>
                      <select value={editForm.profession} onChange={e => setEditForm(f => ({ ...f, profession: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400">
                        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Statut</label>
                      <select value={editForm.accountStatus} onChange={e => setEditForm(f => ({ ...f, accountStatus: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400">
                        <option value="active">Actif</option>
                        <option value="trial">Essai</option>
                        <option value="suspended">Suspendu</option>
                        <option value="blocked">Bloque</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Organisation / Cabinet</label>
                    <input value={editForm.organisation} onChange={e => setEditForm(f => ({ ...f, organisation: e.target.value }))}
                      placeholder="Nom du cabinet..."
                      className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Plan</label>
                      <select value={editForm.plan} onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400">
                        <option value="free">Gratuit</option>
                        <option value="pro">Pro</option>
                        <option value="cabinet">Cabinet</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Credits</label>
                      <input type="number" value={editForm.credits} onChange={e => setEditForm(f => ({ ...f, credits: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800">
                    <input type="checkbox" checked={editForm.isAdmin} onChange={e => setEditForm(f => ({ ...f, isAdmin: e.target.checked }))} className="w-4 h-4 accent-rose-600" />
                    <div>
                      <span className="text-sm font-bold text-rose-700 dark:text-rose-400">Administrateur plateforme</span>
                      <p className="text-xs text-rose-500">Acces complet a toutes les fonctions admin</p>
                    </div>
                  </label>
                </div>
              )}

              {showForcePassword && (
                <div className="p-6 space-y-5">
                  <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl shrink-0"><Mail size={18} className="text-blue-600 dark:text-blue-400" /></div>
                      <div>
                        <h3 className="font-bold text-sm text-blue-800 dark:text-blue-200">Envoyer un lien de reinitialisation</h3>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">L utilisateur recoit un email avec un lien securise pour choisir son nouveau mot de passe.</p>
                      </div>
                    </div>
                    <button onClick={() => handleResetPassword(selectedUser.email)} disabled={resetLoading}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                      {resetLoading ? <RefreshCw size={15} className="animate-spin" /> : <Mail size={15} />}
                      Envoyer l email a {selectedUser.email}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <span className="text-xs text-slate-400 font-medium">OU</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="p-5 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl shrink-0"><Lock size={18} className="text-purple-600 dark:text-purple-400" /></div>
                      <div>
                        <h3 className="font-bold text-sm text-purple-800 dark:text-purple-200">Forcer un nouveau mot de passe</h3>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">Definissez directement le mot de passe. Les sessions actives seront invalidees.</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Nouveau mot de passe (min. 8 caracteres)"
                        className="w-full px-4 py-2.5 border border-purple-300 dark:border-purple-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-purple-400" />
                      {newPassword.length > 0 && newPassword.length < 8 && <p className="text-xs text-red-500">Minimum 8 caracteres ({newPassword.length}/8)</p>}
                      {newPassword.length >= 8 && <p className="text-xs text-green-600">Mot de passe valide</p>}
                      <button onClick={handleForcePassword} disabled={forcePasswordLoading || newPassword.length < 8}
                        className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {forcePasswordLoading ? <RefreshCw size={15} className="animate-spin" /> : <Lock size={15} />}
                        Appliquer le nouveau mot de passe
                      </button>                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0 flex gap-3">
              {!showForcePassword ? (
                <>
                  <button onClick={handleSaveEdit} disabled={actionLoading}
                    className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {actionLoading ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                    Enregistrer les modifications
                  </button>
                  <button onClick={closeModal} className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Annuler
                  </button>
                </>
              ) : (
                <button onClick={closeModal} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Fermer
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {modalMode === 'delete' && selectedUser && (
        <Modal onClose={closeModal}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between p-6 border-b border-red-100 dark:border-red-900">
              <h2 className="font-bold text-lg flex items-center gap-2 text-red-600"><Ban size={18} />Bloquer le compte</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Le compte de <strong>{selectedUser.nom}</strong> ({selectedUser.email}) sera bloque et desactive.
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Raison (optionnel)</label>
                <textarea value={deleteReason} onChange={e => setDeleteReason(e.target.value)}
                  rows={3} placeholder="Raison du blocage..."
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-red-400 resize-none" />
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={handleDelete} disabled={actionLoading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {actionLoading ? <RefreshCw size={15} className="animate-spin" /> : <Ban size={15} />}
                Bloquer le compte
              </button>
              <button onClick={closeModal} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AdminInterface;
