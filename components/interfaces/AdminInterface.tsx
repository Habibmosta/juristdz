import React, { useState, useEffect } from 'react';
import { Language, EnhancedUserProfile } from '../../types';
import {
  Settings, Users, BarChart3, Shield, Database, Server, Activity,
  AlertTriangle, CheckCircle, TrendingUp, Clock, Eye, Edit, Trash2,
  Plus, Search, Download, Wifi, Lock, Building, CreditCard, Gavel,
  Filter, Scale, BookOpen, Briefcase, GraduationCap, Building2, Star,
  X, Save, UserCheck, UserX, Ban, RefreshCw, Mail, Phone, Hash
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

// Config r├┤le ÔåÆ couleur + ic├┤ne + label
const ROLE_CONFIG: Record<string, {
  label_fr: string; label_ar: string;
  color: string; icon: React.ReactNode;
}> = {
  avocat:             { label_fr: 'Avocat',           label_ar: '┘àÏ¡Ïº┘à┘è',         color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',    icon: <Scale size={11} /> },
  notaire:            { label_fr: 'Notaire',           label_ar: '┘à┘êÏ½┘é',          color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: <BookOpen size={11} /> },
  huissier:           { label_fr: 'Huissier',          label_ar: '┘àÏ¡ÏÂÏ▒',          color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', icon: <Briefcase size={11} /> },
  magistrat:          { label_fr: 'Magistrat',         label_ar: '┘éÏºÏÂ┘è',          color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',       icon: <Gavel size={11} /> },
  etudiant:           { label_fr: '├ëtudiant',          label_ar: 'ÏÀÏº┘äÏ¿',          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: <GraduationCap size={11} /> },
  juriste_entreprise: { label_fr: 'Juriste Entreprise',label_ar: '┘àÏ│Ï¬Ï┤ÏºÏ▒ ┘éÏº┘å┘ê┘å┘è', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',   icon: <Building2 size={11} /> },
  admin:              { label_fr: 'Administrateur',    label_ar: '┘àÏ»┘èÏ▒',          color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',    icon: <Shield size={11} /> },
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

// Modal state types
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
  const [statistiques, setStatistiques] = useState({
    utilisateursTotal: 0, utilisateursActifs: 0, requetesJour: 0, uptimeSysteme: 99.9,
  });

  // CRUD modal state
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

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openModal = (u: UtilisateurSysteme, mode: 'view' | 'edit' | 'delete') => {
    document.body.style.overflow = 'hidden';
    setSelectedUser(u);
    setModalMode(mode);
    if (mode === 'edit') {
      const [firstName, ...rest] = u.nom.split(' ');
      setEditForm({
        firstName: firstName || '',
        lastName: rest.join(' ') || '',
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

  const closeModal = () => { setSelectedUser(null); setModalMode(null); document.body.style.overflow = ''; };

  const [resetLoading, setResetLoading] = useState(false);
  const [showForcePassword, setShowForcePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [forcePasswordLoading, setForcePasswordLoading] = useState(false);

  const handleForcePassword = async () => {
    if (!selectedUser) return;
    if (newPassword.length < 8) {
      showToast('Le mot de passe doit contenir au moins 8 caract├¿res', 'error');
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
      showToast(`Mot de passe mis ├á jour pour ${selectedUser.nom}`);
      setShowForcePassword(false);
      setNewPassword('');
    } catch (e: any) {
      showToast(e.message || 'Erreur lors de la mise ├á jour', 'error');
    } finally {
      setForcePasswordLoading(false);
    }
  };

  const handleResetPassword = async (email: string, nom: string) => {
    if (!confirm(`Envoyer un email de r├®initialisation du mot de passe ├á ${email} ?`)) return;
    setResetLoading(true);
    try {
      const { supabase } = await import('../../src/lib/supabase');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      showToast(`Email de r├®initialisation envoy├® ├á ${email}`);
    } catch (e: any) {
      showToast(e.message || 'Erreur lors de l\'envoi', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const { supabase } = await import('../../src/lib/supabase');
      const { data, error } = await supabase.rpc('admin_update_user_profile', {
        p_user_id:        selectedUser.id,
        p_first_name:     editForm.firstName || null,
        p_last_name:      editForm.lastName || null,
        p_profession:     editForm.profession || null,
        p_organization:   editForm.organisation || null,
        p_account_status: editForm.accountStatus || null,
        p_subscription_plan: editForm.plan || null,
        p_credits:        editForm.credits ? parseInt(editForm.credits) : null,
        p_is_admin:       editForm.isAdmin,
      });
      if (error) throw error;
      if ((data as any)?.success === false) throw new Error((data as any).message);
      showToast('Profil mis ├á jour avec succ├¿s');
      closeModal();
      loadRealData();
    } catch (e: any) {
      showToast(e.message || 'Erreur lors de la mise ├á jour', 'error');
    } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const { supabase } = await import('../../src/lib/supabase');
      const { data, error } = await supabase.rpc('admin_delete_user', {
        p_user_id: selectedUser.id,
        p_reason:  deleteReason || 'Supprim├® par administrateur',
      });
      if (error) throw error;
      showToast('Compte bloqu├® et d├®sactiv├®');
      closeModal();
      loadRealData();
    } catch (e: any) {
      showToast(e.message || 'Erreur lors de la suppression', 'error');
    } finally { setActionLoading(false); }
  };

  const handleQuickAction = async (u: UtilisateurSysteme, action: 'activate' | 'suspend' | 'deactivate' | 'reactivate') => {
    setActionLoading(true);
    try {
      const { supabase } = await import('../../src/lib/supabase');
      let rpc = '';
      if (action === 'activate')   rpc = 'admin_activate_account';
      if (action === 'suspend')    rpc = 'admin_suspend_account';
      if (action === 'deactivate') rpc = 'admin_deactivate_user';
      if (action === 'reactivate') rpc = 'admin_reactivate_user';
      const { error } = await supabase.rpc(rpc, { p_user_id: u.id });
      if (error) throw error;
      showToast(`Action effectu├®e sur ${u.nom}`);
      loadRealData();
    } catch (e: any) {
      showToast(e.message || 'Erreur', 'error');
    } finally { setActionLoading(false); }
  };

  // Comptage par r├┤le pour les badges du filtre
  const roleCount = utilisateurs.reduce<Record<string, number>>((acc, u) => {
    const r = u.profession || u.role || 'avocat';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  // Utilisateurs filtr├®s
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
    { nom: isAr ? '├ÿ┬º├ÖÔÇ×├ÖÔÇª├ÿ┬│├ÿ┬¬├ÿ┬«├ÿ┬»├ÖÔÇª├Ö╦å├ÖÔÇá ├ÿ┬º├ÖÔÇ×├ÖÔÇá├ÿ┬┤├ÿ┬À├Ö╦å├ÖÔÇá' : 'Utilisateurs Actifs', valeur: statistiques.utilisateursActifs, tendance: 'hausse', statut: 'bon' },
    { nom: isAr ? '├ÿ┬À├ÖÔÇ×├ÿ┬¿├ÿ┬º├ÿ┬¬ ├ÿ┬º├ÖÔÇ×├ÿ┬░├ÖãÆ├ÿ┬º├ÿ┬í ├ÿ┬º├ÖÔÇ×├ÿ┬º├ÿ┬Á├ÿ┬À├ÖÔÇá├ÿ┬º├ÿ┬╣├Ö┼á/├Ö┼á├Ö╦å├ÖÔÇª' : 'Requetes IA/jour', valeur: statistiques.requetesJour, tendance: 'hausse', statut: 'bon' },
    { nom: isAr ? '├Ö╦å├ÖÔÇÜ├ÿ┬¬ ├ÿ┬º├ÖÔÇ×├ÿ┬¬├ÿ┬┤├ÿ┬║├Ö┼á├ÖÔÇ×' : 'Uptime Systeme', valeur: statistiques.uptimeSysteme, unite: '%', tendance: 'stable', statut: 'bon' },
    { nom: isAr ? '├ÿ┬º├ÿ┬¼├ÖÔÇª├ÿ┬º├ÖÔÇ×├Ö┼á ├ÿ┬º├ÖÔÇ×├ÖÔÇª├ÿ┬│├ÿ┬¬├ÿ┬«├ÿ┬»├ÖÔÇª├Ö┼á├ÖÔÇá' : 'Total Utilisateurs', valeur: statistiques.utilisateursTotal, tendance: 'hausse', statut: 'bon' },
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
    <>
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <Settings className="text-red-600" size={32} />
              {isAr ? '├ÖÔÇ×├Ö╦å├ÿ┬¡├ÿ┬® ├ÿ┬¬├ÿ┬¡├ÖãÆ├ÖÔÇª ├ÿ┬º├ÖÔÇ×├ÖÔÇª├ÿ┬»├Ö┼á├ÿ┬▒' : 'Administration Systeme'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr ? `├ÖÔÇª├ÿ┬▒├ÿ┬¡├ÿ┬¿├ÿ┬º ${user.firstName}` : `Bienvenue ${user.firstName} - Gestion complete de la plateforme`}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:border-red-600 transition-colors">
              <Download size={16} className="inline mr-2" />
              {isAr ? '├ÿ┬¬├ÿ┬Á├ÿ┬»├Ö┼á├ÿ┬▒ ├ÿ┬º├ÖÔÇ×├ÿ┬¿├Ö┼á├ÿ┬º├ÖÔÇá├ÿ┬º├ÿ┬¬' : 'Export Donnees'}
            </button>
            <button className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
              <Plus size={18} />
              {isAr ? '├ÖÔÇª├ÿ┬│├ÿ┬¬├ÿ┬«├ÿ┬»├ÖÔÇª ├ÿ┬¼├ÿ┬»├Ö┼á├ÿ┬»' : 'Nouvel Utilisateur'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
              <BarChart3 size={16} className="inline mr-2" />
              {isAr ? '├ÖÔÇá├ÿ┬©├ÿ┬▒├ÿ┬® ├ÿ┬╣├ÿ┬º├ÖÔÇª├ÿ┬®' : "Vue d'ensemble"}
            </button>
            <button onClick={() => setActiveTab('organizations')} className={tabClass('organizations')}>
              <Building size={16} className="inline mr-2" />
              {isAr ? '├ÿ┬º├ÖÔÇ×├ÖÔÇª├ÖÔÇá├ÿ┬©├ÖÔÇª├ÿ┬º├ÿ┬¬' : 'Organisations'}
            </button>
            <button onClick={() => setActiveTab('subscriptions')} className={tabClass('subscriptions')}>
              <CreditCard size={16} className="inline mr-2" />
              {isAr ? '├ÿ┬º├ÖÔÇ×├ÿ┬º├ÿ┬┤├ÿ┬¬├ÿ┬▒├ÿ┬º├ÖãÆ├ÿ┬º├ÿ┬¬' : 'Abonnements'}
            </button>
            <button onClick={() => setActiveTab('payments')} className={tabClass('payments')}>
              <CreditCard size={16} className="inline mr-2" />
              {isAr ? '├ÿ┬º├ÖÔÇ×├ÖÔÇª├ÿ┬»├Ö┬ü├Ö╦å├ÿ┬╣├ÿ┬º├ÿ┬¬' : 'Paiements'}
            </button>
            <button onClick={() => setActiveTab('jurisprudence')} className={tabClass('jurisprudence')}>
              <Gavel size={16} className="inline mr-2" />
              {isAr ? '├ÿ┬º├ÖÔÇ×├ÿ┬º├ÿ┬¼├ÿ┬¬├ÖÔÇí├ÿ┬º├ÿ┬» ├ÿ┬º├ÖÔÇ×├ÖÔÇÜ├ÿ┬Â├ÿ┬º├ÿ┬ª├Ö┼á' : 'Jurisprudence'}
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
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{isAr ? 'ÏÑÏ¼┘àÏº┘ä┘è Ïº┘ä┘àÏ│Ï¬Ï«Ï»┘à┘è┘å' : 'Utilisateurs Total'}</h3>
                <p className="text-xs text-slate-500 mt-1">{statistiques.utilisateursActifs} {isAr ? '┘åÏ┤ÏÀ' : 'actifs'}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl"><Activity size={20} /></div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{statistiques.requetesJour}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{isAr ? 'ÏÀ┘äÏ¿ÏºÏ¬ ┘è┘ê┘à┘èÏ®' : 'Requetes/Jour'}</h3>
                <p className="text-xs text-slate-500 mt-1">+12% vs hier</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl"><Server size={20} /></div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{statistiques.uptimeSysteme}%</span>
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{isAr ? '┘ê┘éÏ¬ Ïº┘äÏ¬Ï┤Ï║┘è┘ä' : 'Uptime Systeme'}</h3>
                <p className="text-xs text-slate-500 mt-1">{isAr ? '┘à┘àÏ¬ÏºÏ▓' : 'Excellent'}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl"><AlertTriangle size={20} /></div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">0</span>
                </div>
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{isAr ? 'Ï¬┘åÏ¿┘è┘çÏºÏ¬ ┘åÏ┤ÏÀÏ®' : 'Alertes Actives'}</h3>
                <p className="text-xs text-slate-500 mt-1">0 {isAr ? 'Ï¡Ï▒Ï¼Ï®' : 'critiques'}</p>
              </div>
            </div>

            {/* Role breakdown bar */}
            {utilisateurs.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <Shield size={16} className="text-slate-400" />
                  {isAr ? 'Ï¬┘êÏ▓┘èÏ╣ Ïº┘ä┘àÏ│Ï¬Ï«Ï»┘à┘è┘å Ï¡Ï│Ï¿ Ïº┘äÏ»┘êÏ▒' : 'R├®partition par r├┤le'}
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
                        {isAr ? 'ÏÑÏ»ÏºÏ▒Ï® Ïº┘ä┘àÏ│Ï¬Ï«Ï»┘à┘è┘å' : 'Gestion Utilisateurs'}
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
                          placeholder={isAr ? 'Ï¿Ï¡Ï½ Ï¿Ïº┘äÏºÏ│┘à Ïú┘ê Ïº┘äÏ¿Ï▒┘èÏ»...' : 'Nom, email, organisation...'}
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
                          <option value="all">{isAr ? '┘â┘ä Ïº┘äÏúÏ»┘êÏºÏ▒' : 'Tous les r├┤les'}</option>
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
                          <option value="all">{isAr ? '┘â┘ä Ïº┘äÏ¡Ïº┘äÏºÏ¬' : 'Tous les statuts'}</option>
                          <option value="actif">{isAr ? '┘åÏ┤ÏÀ' : 'Actif'}</option>
                          <option value="inactif">{isAr ? 'Ï║┘èÏ▒ ┘åÏ┤ÏÀ' : 'Inactif'}</option>
                          <option value="suspendu">{isAr ? '┘à┘ê┘é┘ê┘ü' : 'Suspendu'}</option>
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
                        {isAr ? 'Ïº┘ä┘â┘ä' : 'Tous'} ({utilisateurs.length})
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
                        <p className="mt-3 text-slate-400 text-sm">{isAr ? 'Ï¼ÏºÏ▒┘è Ïº┘äÏ¬Ï¡┘à┘è┘ä...' : 'Chargement...'}</p>
                      </div>
                    ) : utilisateursFiltres.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">
                        <Users size={40} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{isAr ? '┘äÏº ┘è┘êÏ¼Ï» ┘àÏ│Ï¬Ï«Ï»┘à┘ê┘å' : 'Aucun utilisateur trouv├®'}</p>
                        {(filterRole !== 'all' || filterStatut !== 'all' || searchTerm) && (
                          <button
                            onClick={() => { setFilterRole('all'); setFilterStatut('all'); setSearchTerm(''); }}
                            className="mt-2 text-xs text-blue-500 hover:underline"
                          >
                            {isAr ? 'ÏÑÏ╣ÏºÏ»Ï® Ï¬Ï╣┘è┘è┘å Ïº┘ä┘ü┘äÏºÏ¬Ï▒' : 'R├®initialiser les filtres'}
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
                                {u.statut === 'actif' ? (isAr ? '┘åÏ┤ÏÀ' : 'ACTIF') :
                                 u.statut === 'suspendu' ? (isAr ? '┘à┘ê┘é┘ê┘ü' : 'SUSPENDU') :
                                 (isAr ? 'Ï║┘èÏ▒ ┘åÏ┤ÏÀ' : 'INACTIF')}
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
                                <span className="text-slate-300 dark:text-slate-600">┬À</span>
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
                                ? (isAr ? '┘ä┘à ┘èÏ¬ÏÁ┘ä' : 'Jamais')
                                : u.dernierAcces.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR')}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => openModal(u, 'view')}
                              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Voir le profil"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => openModal(u, 'edit')}
                              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => openModal(u, 'delete')}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Bloquer / Supprimer"
                            >
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
                    {isAr ? '├ÖÔÇª├ÖÔÇÜ├ÿ┬º├Ö┼á├Ö┼á├ÿ┬│ ├ÿ┬º├ÖÔÇ×├ÖÔÇá├ÿ┬©├ÿ┬º├ÖÔÇª' : 'Metriques Systeme'}
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
                    {isAr ? '├ÿ┬¡├ÿ┬º├ÖÔÇ×├ÿ┬® ├ÿ┬º├ÖÔÇ×├ÖÔÇá├ÿ┬©├ÿ┬º├ÖÔÇª' : 'Etat du Systeme'}
                  </h3>
                  {[
                    { icon: <Server size={14} />, label: isAr ? '├ÿ┬º├ÖÔÇ×├ÿ┬«├Ö╦å├ÿ┬º├ÿ┬»├ÖÔÇª' : 'Serveurs' },
                    { icon: <Database size={14} />, label: isAr ? '├ÖÔÇÜ├ÿ┬º├ÿ┬╣├ÿ┬»├ÿ┬® ├ÿ┬º├ÖÔÇ×├ÿ┬¿├Ö┼á├ÿ┬º├ÖÔÇá├ÿ┬º├ÿ┬¬' : 'Base de donnees' },
                    { icon: <Wifi size={14} />, label: isAr ? '├ÿ┬º├ÖÔÇ×├ÿ┬┤├ÿ┬¿├ÖãÆ├ÿ┬®' : 'Reseau' },
                    { icon: <Lock size={14} />, label: isAr ? '├ÿ┬º├ÖÔÇ×├ÿ┬º├ÖÔÇª├ÿ┬º├ÖÔÇá' : 'Securite' },
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

      {/* ÔöÇÔöÇ TOAST ÔöÇÔöÇ */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-white font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ÔöÇÔöÇ MODAL VIEW ÔöÇÔöÇ */}
      {modalMode === 'view' && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-bold text-lg flex items-center gap-2"><Eye size={18} className="text-blue-500" /> Profil utilisateur</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Nom complet', value: selectedUser.nom },
                { label: 'Email', value: selectedUser.email },
                { label: 'R├┤le', value: ROLE_CONFIG[selectedUser.profession]?.label_fr || selectedUser.profession },
                { label: 'Organisation', value: selectedUser.organisation },
                { label: 'Plan', value: PLAN_CONFIG[selectedUser.plan]?.label || selectedUser.plan },
                { label: 'Cr├®dits', value: String(selectedUser.credits) },
                { label: 'Statut', value: selectedUser.statut },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{value || 'ÔÇö'}</span>
                </div>
              ))}
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={() => { closeModal(); openModal(selectedUser, 'edit'); }} className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2">
                <Edit size={15} /> Modifier
              </button>
              <button
                onClick={() => handleResetPassword(selectedUser.email, selectedUser.nom)}
                disabled={resetLoading}
                className="px-4 py-2.5 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                title="Envoyer email de r├®initialisation mot de passe"
              >
                {resetLoading ? <RefreshCw size={15} className="animate-spin" /> : <Mail size={15} />}
                R├®init. MDP
              </button>
              <button onClick={closeModal} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ÔöÇÔöÇ MODAL EDIT ÔöÇÔöÇ */}
      {modalMode === 'edit' && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900">
              <h2 className="font-bold text-lg flex items-center gap-2"><Edit size={18} className="text-amber-500" /> Modifier ÔÇö {selectedUser.nom}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pr├®nom</label>
                  <input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom</label>
                  <input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">R├┤le / Profession</label>
                <select value={editForm.profession} onChange={e => setEditForm(f => ({ ...f, profession: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400">
                  {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label_fr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organisation / Cabinet</label>
                <input value={editForm.organisation} onChange={e => setEditForm(f => ({ ...f, organisation: e.target.value }))}
                  placeholder="Nom du cabinet..."
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</label>
                  <select value={editForm.plan} onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="free">Gratuit</option>
                    <option value="pro">Pro</option>
                    <option value="cabinet">Cabinet</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cr├®dits</label>
                  <input type="number" value={editForm.credits} onChange={e => setEditForm(f => ({ ...f, credits: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statut du compte</label>
                <select value={editForm.accountStatus} onChange={e => setEditForm(f => ({ ...f, accountStatus: e.target.value }))}
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="active">Actif</option>
                  <option value="trial">Essai</option>
                  <option value="suspended">Suspendu</option>
                  <option value="blocked">Bloqu├®</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800">
                <input type="checkbox" checked={editForm.isAdmin} onChange={e => setEditForm(f => ({ ...f, isAdmin: e.target.checked }))}
                  className="w-4 h-4 accent-rose-600" />
                <div>
                  <span className="text-sm font-bold text-rose-700 dark:text-rose-400">Administrateur plateforme</span>
                  <p className="text-xs text-rose-500">Acc├¿s complet ├á toutes les fonctions admin</p>
                </div>
              </label>
            </div>
            <div className="p-6 pt-0 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <button onClick={handleSaveEdit} disabled={actionLoading}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {actionLoading ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                Enregistrer
              </button>
              <button
                onClick={() => handleResetPassword(selectedUser.email, selectedUser.nom)}
                disabled={resetLoading}
                className="px-4 py-2.5 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                title="Envoyer un email de r├®initialisation du mot de passe"
              >
                {resetLoading ? <RefreshCw size={15} className="animate-spin" /> : <Mail size={15} />}
                MDP
              </button>
              <button
                onClick={() => setShowForcePassword(v => !v)}
                className="px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                title="Forcer un nouveau mot de passe"
              >
                <Lock size={15} />
                Forcer MDP
              </button>
              <button onClick={closeModal} className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Annuler
              </button>
            </div>

            {/* Force password inline section */}
            {showForcePassword && (
              <div className="mx-6 mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 space-y-3">
                <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  ­ƒöÉ Forcer un nouveau mot de passe
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Le mot de passe sera chang├® imm├®diatement. Les sessions actives seront invalid├®es.
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Nouveau mot de passe (min. 8 caract├¿res)"
                    className="flex-1 px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <button
                    onClick={handleForcePassword}
                    disabled={forcePasswordLoading || newPassword.length < 8}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {forcePasswordLoading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    Appliquer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ÔöÇÔöÇ MODAL DELETE ÔöÇÔöÇ */}
      {modalMode === 'delete' && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between p-6 border-b border-red-100 dark:border-red-900">
              <h2 className="font-bold text-lg flex items-center gap-2 text-red-600"><Ban size={18} /> Bloquer le compte</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ÔÜá´©Å Le compte de <strong>{selectedUser.nom}</strong> ({selectedUser.email}) sera <strong>bloqu├® et d├®sactiv├®</strong>. L'utilisateur ne pourra plus se connecter.
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
        </div>
      )}
    </>
  );
};

export default AdminInterface;
