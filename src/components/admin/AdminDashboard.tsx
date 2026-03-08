import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, Clock, TrendingUp, AlertCircle, Calendar, 
  CheckCircle, XCircle, Timer, Award, Filter, Mail, 
  UserCheck, UserX, Shield 
} from 'lucide-react';

interface UserWithSubscription {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profession: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  account_status: string;
  subscription: {
    plan: string;
    status: string;
    expires_at: string;
    trial_ends_at: string;
    is_active: boolean;
    documents_used: number;
    documents_limit: number;
    cases_limit: number;
  } | null;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  freeUsers: number;
  trialUsers: number;
  paidUsers: number;
  expiringSoon: number;
  expired: number;
  unverifiedEmails: number;
}

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    freeUsers: 0,
    trialUsers: 0,
    paidUsers: 0,
    expiringSoon: 0,
    expired: 0,
    unverifiedEmails: 0
  });
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les profils
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Charger les abonnements
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subsError) throw subsError;

      // Combiner les données
      const usersWithSubs: UserWithSubscription[] = profiles.map(profile => ({
        ...profile,
        subscription: subscriptions.find(sub => sub.user_id === profile.id) || null
      }));

      setUsers(usersWithSubs);
      calculateStats(usersWithSubs);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersData: UserWithSubscription[]) => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const newStats: Stats = {
      totalUsers: usersData.length,
      activeUsers: usersData.filter(u => u.is_active).length,
      freeUsers: usersData.filter(u => 
        u.subscription?.plan === 'free' && 
        u.subscription?.status === 'active'
      ).length,
      trialUsers: usersData.filter(u => 
        u.subscription?.status === 'trial' || 
        u.subscription?.status === 'pending'
      ).length,
      paidUsers: usersData.filter(u => 
        u.subscription?.plan !== 'free' && 
        u.subscription?.status === 'active'
      ).length,
      expiringSoon: usersData.filter(u => {
        if (!u.subscription) return false;
        const expiryDate = new Date(u.subscription.trial_ends_at || u.subscription.expires_at);
        return expiryDate > now && expiryDate <= sevenDaysFromNow;
      }).length,
      expired: usersData.filter(u => {
        if (!u.subscription) return false;
        const expiryDate = new Date(u.subscription.trial_ends_at || u.subscription.expires_at);
        return expiryDate < now && u.subscription.status !== 'active';
      }).length,
      unverifiedEmails: usersData.filter(u => !u.email_verified).length
    };

    setStats(newStats);
  };

  const getDaysRemaining = (user: UserWithSubscription): number | null => {
    if (!user.subscription) return null;
    
    const now = new Date();
    const expiryDate = new Date(
      user.subscription.trial_ends_at || user.subscription.expires_at
    );
    
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getStatusColor = (daysRemaining: number | null, status: string) => {
    if (daysRemaining === null) return 'text-slate-400';
    if (status === 'active' && daysRemaining > 30) return 'text-green-400';
    if (daysRemaining <= 0) return 'text-red-400';
    if (daysRemaining <= 3) return 'text-red-400';
    if (daysRemaining <= 7) return 'text-amber-400';
    return 'text-blue-400';
  };

  const getStatusBadge = (user: UserWithSubscription) => {
    const daysRemaining = getDaysRemaining(user);
    const status = user.subscription?.status || 'unknown';

    if (status === 'trial' || status === 'pending') {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400">
          Essai gratuit
        </span>
      );
    }

    if (status === 'active' && user.subscription?.plan !== 'free') {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400">
          Payant actif
        </span>
      );
    }

    if (status === 'suspended' || (daysRemaining !== null && daysRemaining <= 0)) {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400">
          Expiré
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-500/20 text-slate-400">
        Gratuit
      </span>
    );
  };

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      free: 'Gratuit',
      pro: 'Pro',
      cabinet: 'Cabinet',
      trial: 'Essai'
    };
    return labels[plan] || plan;
  };

  // Activer l'email d'un utilisateur
  const handleActivateEmail = async (userId: string, userEmail: string) => {
    if (!confirm(`Voulez-vous activer l'email de ${userEmail} ?`)) {
      return;
    }

    setActionLoading(userId);

    try {
      const { data, error } = await supabase.rpc('admin_activate_user_email', {
        p_user_id: userId
      });

      if (error) throw error;

      if (data.success) {
        alert(`✅ ${data.message}\n\nEmail: ${data.user_email}`);
        // Recharger les données
        await loadData();
      } else {
        alert(`❌ Erreur: ${data.message}`);
      }
    } catch (error: any) {
      console.error('Erreur activation email:', error);
      alert(`❌ Erreur lors de l'activation: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Désactiver un utilisateur
  const handleDeactivateUser = async (userId: string, userEmail: string) => {
    if (!confirm(`⚠️ Voulez-vous désactiver le compte de ${userEmail} ?\n\nL'utilisateur ne pourra plus se connecter.`)) {
      return;
    }

    setActionLoading(userId);

    try {
      const { data, error } = await supabase.rpc('admin_deactivate_user', {
        p_user_id: userId
      });

      if (error) throw error;

      if (data.success) {
        alert(`✅ ${data.message}`);
        await loadData();
      } else {
        alert(`❌ Erreur: ${data.message}`);
      }
    } catch (error: any) {
      console.error('Erreur désactivation:', error);
      alert(`❌ Erreur lors de la désactivation: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Réactiver un utilisateur
  const handleReactivateUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Voulez-vous réactiver le compte de ${userEmail} ?`)) {
      return;
    }

    setActionLoading(userId);

    try {
      const { data, error } = await supabase.rpc('admin_reactivate_user', {
        p_user_id: userId
      });

      if (error) throw error;

      if (data.success) {
        alert(`✅ ${data.message}`);
        await loadData();
      } else {
        alert(`❌ Erreur: ${data.message}`);
      }
    } catch (error: any) {
      console.error('Erreur réactivation:', error);
      alert(`❌ Erreur lors de la réactivation: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filterCategory === 'all') return true;
    
    const daysRemaining = getDaysRemaining(user);
    const status = user.subscription?.status || 'unknown';
    const plan = user.subscription?.plan || 'free';

    switch (filterCategory) {
      case 'free':
        return plan === 'free' && status === 'active';
      case 'trial':
        return status === 'trial' || status === 'pending';
      case 'paid':
        return status === 'active' && plan !== 'free';
      case 'expiring':
        return daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7;
      case 'expired':
        return daysRemaining !== null && daysRemaining <= 0;
      case 'unverified':
        return !user.email_verified;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-gold mx-auto"></div>
          <p className="mt-4 text-slate-400">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-legal-gold" />
            <h1 className="text-3xl font-bold">Tableau de Bord Admin</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Vue d'ensemble des abonnements et statistiques
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Utilisateurs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-3xl font-bold">{stats.totalUsers}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Total Utilisateurs</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              {stats.activeUsers} actifs
            </p>
          </div>

          {/* Essais Gratuits */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Timer className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-3xl font-bold">{stats.trialUsers}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Essais Gratuits (7j)</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              En période d'essai
            </p>
          </div>

          {/* Utilisateurs Gratuits */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-500/10 rounded-lg">
                <Users className="w-6 h-6 text-slate-400" />
              </div>
              <span className="text-3xl font-bold">{stats.freeUsers}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Plan Gratuit</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              Utilisateurs gratuits
            </p>
          </div>

          {/* Abonnements Payants */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Award className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-3xl font-bold">{stats.paidUsers}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Abonnements Payants</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              Pro & Cabinet actifs
            </p>
          </div>

          {/* Expirent Bientôt */}
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-3xl font-bold text-amber-400">{stats.expiringSoon}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Expirent dans 7 jours</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
              ⚠️ Nécessite attention
            </p>
          </div>

          {/* Expirés */}
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-3xl font-bold text-red-400">{stats.expired}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Abonnements Expirés</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
              ❌ Accès suspendu
            </p>
          </div>

          {/* Taux de Conversion */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-legal-gold/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-legal-gold" />
              </div>
              <span className="text-3xl font-bold text-legal-gold">
                {stats.trialUsers > 0 
                  ? Math.round((stats.paidUsers / (stats.trialUsers + stats.paidUsers)) * 100)
                  : 0}%
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Taux de Conversion</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              Essai → Payant
            </p>
          </div>

          {/* Emails Non Vérifiés */}
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <Mail className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-3xl font-bold text-amber-400">{stats.unverifiedEmails}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Emails Non Vérifiés</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
              ⚠️ Nécessite activation
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-400 font-medium">Catégorie:</span>
          </div>

          <button
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterCategory === 'all'
                ? 'bg-legal-gold text-slate-950'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-legal-gold'
            }`}
          >
            Tous ({users.length})
          </button>

          <button
            onClick={() => setFilterCategory('trial')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterCategory === 'trial'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-blue-500'
            }`}
          >
            Essais gratuits ({stats.trialUsers})
          </button>

          <button
            onClick={() => setFilterCategory('free')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterCategory === 'free'
                ? 'bg-slate-500 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-slate-500'
            }`}
          >
            Gratuits ({stats.freeUsers})
          </button>

          <button
            onClick={() => setFilterCategory('paid')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterCategory === 'paid'
                ? 'bg-green-500 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-green-500'
            }`}
          >
            Payants ({stats.paidUsers})
          </button>

          <button
            onClick={() => setFilterCategory('expiring')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterCategory === 'expiring'
                ? 'bg-amber-500 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-amber-500'
            }`}
          >
            Expirent bientôt ({stats.expiringSoon})
          </button>

          <button
            onClick={() => setFilterCategory('expired')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterCategory === 'expired'
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-red-500'
            }`}
          >
            Expirés ({stats.expired})
          </button>

          <button
            onClick={() => setFilterCategory('unverified')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterCategory === 'unverified'
                ? 'bg-amber-500 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-amber-500'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-1" />
            Non vérifiés ({stats.unverifiedEmails})
          </button>
        </div>

        {/* Table des Utilisateurs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Catégorie
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Temps Restant
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Date d'Expiration
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredUsers.map(user => {
                  const daysRemaining = getDaysRemaining(user);
                  const statusColor = getStatusColor(daysRemaining, user.subscription?.status || '');
                  const expiryDate = user.subscription 
                    ? new Date(user.subscription.trial_ends_at || user.subscription.expires_at)
                    : null;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {getPlanLabel(user.subscription?.plan || 'free')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {daysRemaining !== null ? (
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${statusColor}`} />
                            <span className={`font-bold ${statusColor}`}>
                              {daysRemaining > 0 
                                ? `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`
                                : 'Expiré'
                              }
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {expiryDate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {expiryDate.toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Actif</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Inactif</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Bouton Activer Email */}
                          {!user.email_verified && (
                            <button
                              onClick={() => handleActivateEmail(user.id, user.email)}
                              disabled={actionLoading === user.id}
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Activer l'email"
                            >
                              {actionLoading === user.id ? (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          
                          {/* Bouton Désactiver/Réactiver */}
                          {user.is_active ? (
                            <button
                              onClick={() => handleDeactivateUser(user.id, user.email)}
                              disabled={actionLoading === user.id}
                              className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Désactiver l'utilisateur"
                            >
                              {actionLoading === user.id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <UserX className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateUser(user.id, user.email)}
                              disabled={actionLoading === user.id}
                              className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Réactiver l'utilisateur"
                            >
                              {actionLoading === user.id ? (
                                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          
                          {/* Badge Email Non Vérifié */}
                          {!user.email_verified && (
                            <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Non vérifié
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun utilisateur dans cette catégorie</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Légende */}
        <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Légende des couleurs
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">&gt; 30 jours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">8-30 jours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">4-7 jours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">≤ 3 jours ou expiré</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
