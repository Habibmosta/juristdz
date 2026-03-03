import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Building2, User, Mail, Phone, MapPin, TrendingUp, DollarSign, FileText, Calendar } from 'lucide-react';
import { ClientService } from '../../services/clientService';
import type { Client, ClientStats } from '../../types/client.types';
import { useAuth } from '../../hooks/useAuth';

export const ClientManagement: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientStats, setClientStats] = useState<ClientStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [globalStats, setGlobalStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadClients();
      loadStats();
    }
  }, [user]);

  const loadClients = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await ClientService.getClients(user.id);
      setClients(data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const [stats, global] = await Promise.all([
        ClientService.getClientStats(user.id),
        ClientService.getGlobalStats(user.id)
      ]);
      setClientStats(stats);
      setGlobalStats(global);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const handleSearch = async () => {
    if (!user) return;
    
    if (searchTerm.trim()) {
      try {
        const results = await ClientService.searchClients(user.id, searchTerm);
        setClients(results);
      } catch (error) {
        console.error('Erreur recherche:', error);
      }
    } else {
      loadClients();
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    const matchesType = filterType === 'all' || client.client_type === filterType;
    return matchesStatus && matchesType;
  });

  const getClientStats = (clientId: string) => {
    return clientStats.find(s => s.id === clientId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gestion des Clients</h1>
              <p className="text-slate-400">Comme Clio - Gérez vos clients et leur facturation</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau Client
          </button>
        </div>

        {/* Statistiques Globales */}
        {globalStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-2xl font-bold">{globalStats.totalClients}</span>
              </div>
              <p className="text-slate-400 text-sm">Total Clients</p>
              <p className="text-green-400 text-xs mt-1">{globalStats.activeClients} actifs</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-2xl font-bold">{formatCurrency(globalStats.totalBilled)}</span>
              </div>
              <p className="text-slate-400 text-sm">Total Facturé</p>
              <p className="text-green-400 text-xs mt-1">{globalStats.collectionRate.toFixed(1)}% collecté</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-2xl font-bold">{formatCurrency(globalStats.totalPaid)}</span>
              </div>
              <p className="text-slate-400 text-sm">Total Payé</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <FileText className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-2xl font-bold">{formatCurrency(globalStats.totalOutstanding)}</span>
              </div>
              <p className="text-slate-400 text-sm">En Attente</p>
            </div>
          </div>
        )}

        {/* Barre de recherche et filtres */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un client par nom, email, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="archived">Archivés</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="individual">Particuliers</option>
              <option value="company">Entreprises</option>
            </select>

            <span className="text-sm text-slate-400 ml-auto">
              {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Liste des clients */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-slate-400">Chargement...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun client</h3>
            <p className="text-slate-400 mb-6">Commencez par créer votre premier client</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              Créer un Client
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map(client => {
              const stats = getClientStats(client.id);
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500 transition-colors cursor-pointer"
                >
                  {/* En-tête client */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${
                        client.client_type === 'company' 
                          ? 'bg-purple-500/10' 
                          : 'bg-blue-500/10'
                      }`}>
                        {client.client_type === 'company' ? (
                          <Building2 className={`w-6 h-6 ${
                            client.client_type === 'company' 
                              ? 'text-purple-400' 
                              : 'text-blue-400'
                          }`} />
                        ) : (
                          <User className="w-6 h-6 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {client.client_type === 'company' 
                            ? client.company_name 
                            : `${client.first_name} ${client.last_name}`}
                        </h3>
                        {client.client_type === 'company' && (
                          <p className="text-sm text-slate-400">
                            {client.first_name} {client.last_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      client.status === 'active' 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {client.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  {/* Informations de contact */}
                  <div className="space-y-2 mb-4">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {(client.phone || client.mobile) && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Phone className="w-4 h-4" />
                        <span>{client.mobile || client.phone}</span>
                      </div>
                    )}
                    {client.city && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin className="w-4 h-4" />
                        <span>{client.city}{client.wilaya && `, ${client.wilaya}`}</span>
                      </div>
                    )}
                  </div>

                  {/* Statistiques */}
                  {stats && (
                    <div className="pt-4 border-t border-slate-800">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Dossiers</p>
                          <p className="text-lg font-bold">{stats.total_cases || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Factures</p>
                          <p className="text-lg font-bold">{stats.total_invoices || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Facturé</p>
                          <p className="text-sm font-semibold text-green-400">
                            {formatCurrency(stats.total_billed || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">En attente</p>
                          <p className="text-sm font-semibold text-amber-400">
                            {formatCurrency(stats.total_outstanding || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
