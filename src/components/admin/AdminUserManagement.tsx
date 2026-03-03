import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Plus, Edit2, CheckCircle, XCircle, Search, Trash2, Filter, AlertTriangle } from 'lucide-react';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profession: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  subscription?: {
    plan: string;
    documents_used: number;
    documents_limit: number;
    cases_limit: number;
    expires_at: string;
    is_active: boolean;
  };
}

// Couleurs par profession
const PROFESSION_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  avocat: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Avocat' },
  notaire: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Notaire' },
  huissier: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Huissier' },
  magistrat: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Magistrat' },
  etudiant: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Étudiant' },
  juriste_entreprise: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Juriste' },
  admin: { bg: 'bg-legal-gold/20', text: 'text-legal-gold', label: 'Admin' }
};

// Composant StatCard
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    red: 'bg-red-500/10 text-red-400',
    gold: 'bg-legal-gold/10 text-legal-gold'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} mb-4`}>
        {icon}
      </div>
      <p className="text-slate-400 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};

// Composant UserRow
const UserRow: React.FC<{
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}> = ({ user, onEdit, onDelete, onRefresh }) => {
  const toggleActive = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const professionColor = PROFESSION_COLORS[user.profession] || PROFESSION_COLORS.avocat;

  return (
    <tr className="hover:bg-slate-800/50 transition-colors">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium">{user.first_name} {user.last_name}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${professionColor.bg} ${professionColor.text}`}>
          {professionColor.label}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          user.subscription?.plan === 'pro' ? 'bg-legal-gold/20 text-legal-gold' :
          user.subscription?.plan === 'cabinet' ? 'bg-purple-500/20 text-purple-400' :
          'bg-slate-700 text-slate-300'
        }`}>
          {user.subscription?.plan || 'free'}
        </span>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm">
          {user.subscription?.documents_used || 0} / {user.subscription?.documents_limit === -1 ? '∞' : user.subscription?.documents_limit || 5}
        </p>
      </td>
      <td className="px-6 py-4">
        {user.is_active ? (
          <span className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            Actif
          </span>
        ) : (
          <span className="flex items-center gap-2 text-red-400">
            <XCircle className="w-4 h-4" />
            Inactif
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="Modifier"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={toggleActive}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title={user.is_active ? 'Désactiver' : 'Activer'}
          >
            {user.is_active ? (
              <XCircle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-900/50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Composant principal
export const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Filtres
  const [filterProfession, setFilterProfession] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subsError) throw subsError;

      const usersWithSubs = profiles.map(profile => ({
        ...profile,
        subscription: subscriptions.find(sub => sub.user_id === profile.id)
      }));

      setUsers(usersWithSubs);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${user.first_name} ${user.last_name}?\n\nCette action est irréversible et supprimera:\n- Le profil utilisateur\n- L'abonnement\n- Tous les dossiers\n- Tous les documents`)) {
      return;
    }

    try {
      // 1. Supprimer les documents
      const { error: docsError } = await supabase
        .from('documents')
        .delete()
        .eq('user_id', user.id);

      if (docsError) console.error('Erreur suppression documents:', docsError);

      // 2. Supprimer les dossiers
      const { error: casesError } = await supabase
        .from('cases')
        .delete()
        .eq('user_id', user.id);

      if (casesError) console.error('Erreur suppression dossiers:', casesError);

      // 3. Supprimer l'abonnement
      const { error: subError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (subError) console.error('Erreur suppression abonnement:', subError);

      // 4. Supprimer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 5. Supprimer l'utilisateur auth (optionnel, nécessite service_role)
      // Note: Cela nécessiterait la clé service_role, on laisse l'utilisateur dans auth.users

      alert('Utilisateur supprimé avec succès!');
      loadUsers();
    } catch (error: any) {
      console.error('Erreur suppression utilisateur:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    // Filtre par recherche
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre par profession
    const matchesProfession = filterProfession === 'all' || user.profession === filterProfession;
    
    // Filtre par statut
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active) ||
      (filterStatus === 'pending' && !user.is_active); // En attente = inactif
    
    // Filtre par plan
    const matchesPlan = filterPlan === 'all' || user.subscription?.plan === filterPlan;
    
    return matchesSearch && matchesProfession && matchesStatus && matchesPlan;
  });

  // Séparer les utilisateurs en attente
  const pendingUsers = filteredUsers.filter(u => !u.is_active && !u.is_admin);
  const activeUsers = filteredUsers.filter(u => u.is_active || u.is_admin);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-legal-gold" />
            <div>
              <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
              <p className="text-slate-400">Gérez les comptes et abonnements</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-legal-gold text-slate-950 rounded-xl font-bold hover:bg-legal-gold/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Créer un Utilisateur
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Utilisateurs"
            value={users.length}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Actifs"
            value={users.filter(u => u.is_active).length}
            icon={<CheckCircle className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="En Attente"
            value={users.filter(u => !u.is_active && !u.is_admin).length}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="gold"
          />
          <StatCard
            title="Admins"
            value={users.filter(u => u.is_admin).length}
            icon={<Users className="w-6 h-6" />}
            color="red"
          />
        </div>

        <div className="mb-6 space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par email ou nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-legal-gold"
            />
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-400 font-medium">Filtres:</span>
            </div>

            {/* Filtre Profession */}
            <select
              value={filterProfession}
              onChange={(e) => setFilterProfession(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-legal-gold"
            >
              <option value="all">Toutes les professions</option>
              <option value="avocat">Avocat</option>
              <option value="notaire">Notaire</option>
              <option value="huissier">Huissier</option>
              <option value="magistrat">Magistrat</option>
              <option value="etudiant">Étudiant</option>
              <option value="juriste_entreprise">Juriste d'Entreprise</option>
              <option value="admin">Admin</option>
            </select>

            {/* Filtre Statut */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-legal-gold"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="pending">En attente de validation</option>
            </select>

            {/* Filtre Plan */}
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-legal-gold"
            >
              <option value="all">Tous les plans</option>
              <option value="free">Gratuit</option>
              <option value="pro">Pro</option>
              <option value="cabinet">Cabinet</option>
            </select>

            {/* Compteur résultats */}
            <span className="text-sm text-slate-400 ml-auto">
              {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-gold mx-auto"></div>
            <p className="mt-4 text-slate-400">Chargement...</p>
          </div>
        ) : (
          <>
            {/* Section En Attente */}
            {pendingUsers.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Comptes en Attente de Validation</h2>
                    <p className="text-slate-400 text-sm">{pendingUsers.length} compte{pendingUsers.length > 1 ? 's' : ''} à valider</p>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-amber-500/30 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-amber-900/20">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Utilisateur</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Profession</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date d'inscription</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {pendingUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium">{user.first_name} {user.last_name}</p>
                              <p className="text-sm text-slate-400">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${PROFESSION_COLORS[user.profession]?.bg || 'bg-slate-700'} ${PROFESSION_COLORS[user.profession]?.text || 'text-slate-300'}`}>
                              {PROFESSION_COLORS[user.profession]?.label || user.profession}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-400">
                              {new Date(user.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  if (confirm(`Activer le compte de ${user.first_name} ${user.last_name} ?`)) {
                                    try {
                                      const { error: profileError } = await supabase
                                        .from('profiles')
                                        .update({ is_active: true })
                                        .eq('id', user.id);

                                      if (profileError) throw profileError;

                                      const { error: subError } = await supabase
                                        .from('subscriptions')
                                        .update({ is_active: true, status: 'active' })
                                        .eq('user_id', user.id);

                                      if (subError) console.error('Subscription update error:', subError);

                                      alert('Compte activé avec succès!');
                                      loadUsers();
                                    } catch (error: any) {
                                      alert('Erreur: ' + error.message);
                                    }
                                  }
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Activer
                              </button>
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                title="Voir les détails"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-2 hover:bg-red-900/50 rounded-lg transition-colors"
                                title="Refuser et supprimer"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section Utilisateurs Actifs */}
            <div>
              <h2 className="text-xl font-bold mb-4">Utilisateurs {activeUsers.length > 0 ? 'Actifs' : ''}</h2>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Utilisateur</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Profession</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Plan</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Documents</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Statut</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {activeUsers.map(user => (
                      <UserRow
                        key={user.id}
                        user={user}
                        onEdit={() => setSelectedUser(user)}
                        onDelete={() => handleDeleteUser(user)}
                        onRefresh={loadUsers}
                      />
                    ))}
                    {activeUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          Aucun utilisateur actif trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadUsers();
            }}
          />
        )}

        {selectedUser && (
          <EditUserModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onSuccess={() => {
              setSelectedUser(null);
              loadUsers();
            }}
          />
        )}
      </div>
    </div>
  );
};
