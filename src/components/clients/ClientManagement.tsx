import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { 
  Users, Plus, Search, Filter, Phone, Mail, MapPin, 
  Briefcase, DollarSign, Calendar, MoreVertical, Edit2,
  Trash2, Eye, FileText, TrendingUp
} from 'lucide-react';
import { ClientService } from '../../services/clientService';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  totalCases: number;
  activeCases: number;
  totalRevenue: number;
  lastContact?: Date;
  notes?: string;
  tags?: string[];
}

interface ClientManagementProps {
  language: Language;
  userId: string;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ language, userId }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const isAr = language === 'ar';

  useEffect(() => {
    loadClients();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [clients, searchTerm]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const loadedClients = await ClientService.getClients(userId);
      setClients(loadedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    if (searchTerm) {
      filtered = filtered.filter(c => 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
      );
    }

    setFilteredClients(filtered);
  };

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.activeCases > 0).length,
    totalRevenue: clients.reduce((sum, c) => sum + c.totalRevenue, 0),
    newThisMonth: clients.filter(c => {
      const clientDate = new Date(c.createdAt);
      const now = new Date();
      return clientDate.getMonth() === now.getMonth() && clientDate.getFullYear() === now.getFullYear();
    }).length
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 md:p-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-slate-100">
              {isAr ? 'إدارة العملاء' : 'Gestion des Clients'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr ? 'قاعدة بيانات العملاء الشاملة' : 'Base de données complète de vos clients'}
            </p>
          </div>
          <button 
            onClick={() => {/* TODO: Open create client modal */}}
            className="px-6 py-3 bg-legal-gold text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-legal-gold/20 hover:bg-legal-gold/90 active:scale-95 transition-all"
          >
            <Plus size={20} />
            {isAr ? 'عميل جديد' : 'Nouveau Client'}
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{isAr ? 'إجمالي العملاء' : 'Total Clients'}</span>
              <Users size={20} className="text-legal-gold" />
            </div>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{isAr ? 'عملاء نشطون' : 'Clients Actifs'}</span>
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{isAr ? 'الإيرادات' : 'Revenus'}</span>
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.totalRevenue.toLocaleString()} DA</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{isAr ? 'جدد هذا الشهر' : 'Nouveaux ce mois'}</span>
              <Calendar size={20} className="text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.newThisMonth}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder={isAr ? 'البحث عن عميل...' : 'Rechercher un client...'} 
              className="bg-transparent border-none outline-none w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Clients Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-gold"></div>
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {isAr ? 'العميل' : 'Client'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {isAr ? 'الاتصال' : 'Contact'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {isAr ? 'الملفات' : 'Dossiers'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {isAr ? 'الإيرادات' : 'Revenus'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {isAr ? 'آخر اتصال' : 'Dernier Contact'}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {isAr ? 'إجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {filteredClients.map(client => (
                    <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-legal-gold/10 text-legal-gold rounded-full flex items-center justify-center font-bold">
                            {client.firstName[0]}{client.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium">{client.firstName} {client.lastName}</p>
                            {client.tags && client.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {client.tags.slice(0, 2).map((tag, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Mail size={14} className="text-legal-gold" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Phone size={14} className="text-legal-gold" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Briefcase size={16} className="text-slate-400" />
                          <span className="font-medium">{client.activeCases}</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-500">{client.totalCases}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-green-600">
                          {client.totalRevenue.toLocaleString()} DA
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {client.lastContact ? client.lastContact.toLocaleDateString() : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedClient(client)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title={isAr ? 'عرض' : 'Voir'}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title={isAr ? 'تعديل' : 'Modifier'}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                            title={isAr ? 'حذف' : 'Supprimer'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400">
            <Users size={60} className="mx-auto mb-4 opacity-20" />
            <p>{isAr ? 'لا يوجد عملاء' : 'Aucun client trouvé'}</p>
          </div>
        )}
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedClient(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{selectedClient.firstName} {selectedClient.lastName}</h2>
                <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</p>
                  <p className="font-medium">{selectedClient.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">{isAr ? 'الهاتف' : 'Téléphone'}</p>
                  <p className="font-medium">{selectedClient.phone || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500 mb-1">{isAr ? 'العنوان' : 'Adresse'}</p>
                  <p className="font-medium">{selectedClient.address || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">{isAr ? 'الملفات النشطة' : 'Dossiers Actifs'}</p>
                  <p className="text-2xl font-bold text-green-600">{selectedClient.activeCases}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">{isAr ? 'إجمالي الملفات' : 'Total Dossiers'}</p>
                  <p className="text-2xl font-bold">{selectedClient.totalCases}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">{isAr ? 'الإيرادات' : 'Revenus'}</p>
                  <p className="text-xl font-bold text-blue-600">{selectedClient.totalRevenue.toLocaleString()} DA</p>
                </div>
              </div>

              {selectedClient.notes && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">{isAr ? 'ملاحظات' : 'Notes'}</p>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                    {selectedClient.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
