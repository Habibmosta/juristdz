import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Plus, Edit2, Trash2, CheckCircle, XCircle, Search } from 'lucide-react';
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
      
      // Charger les utilisateurs avec leurs abonnements
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
        {/* Header */}
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

        {/* Statistiques */}
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

        {/* Recherche */}
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

        {/* Liste des utilisateurs */}
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

        {/* Modal Création */}
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadUsers();
            }}
          />
        )}

        {/* Modal Édition */}
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
