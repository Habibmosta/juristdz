import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Plus, Edit2, CheckCircle, XCircle, Search } from 'lucide-react';
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
  onRefresh: () => void;
}> = ({ user, onEdit, onRefresh }) => {
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

  return (
    <tr className="hover:bg-slate-800/50 transition-colors">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium">{user.first_name} {user.last_name}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="px-3 py-1 bg-slate-800 rounded-full text-sm capitalize">
          {user.profession}
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

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            title="Inactifs"
            value={users.filter(u => !u.is_active).length}
            icon={<XCircle className="w-6 h-6" />}
            color="red"
          />
          <StatCard
            title="Admins"
            value={users.filter(u => u.is_admin).length}
            icon={<Users className="w-6 h-6" />}
            color="gold"
          />
        </div>

        <div className="mb-6">
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
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-gold mx-auto"></div>
            <p className="mt-4 text-slate-400">Chargement...</p>
          </div>
        ) : (
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
                {filteredUsers.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={() => setSelectedUser(user)}
                    onRefresh={loadUsers}
                  />
                ))}
              </tbody>
            </table>
          </div>
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
