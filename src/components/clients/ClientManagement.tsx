import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { 
  Users, Plus, Search, Filter, Phone, Mail, MapPin, 
  Briefcase, DollarSign, Calendar, MoreVertical, Edit2,
  Trash2, Eye, FileText, TrendingUp
} from 'lucide-react';
import { LimitChecker } from '../trial/LimitChecker';
import { useAppToast } from '../../contexts/ToastContext';

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
  const { toast } = useAppToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    companyName: '',
    notes: ''
  });
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
      const { supabase } = await import('../../lib/supabase');
      
      // Charger clients + stats en une seule requête
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          cases:cases(id, status),
          invoices:invoices(total_amount, status)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedClients: Client[] = (data || []).map(client => {
        const allCases = client.cases || [];
        const allInvoices = client.invoices || [];
        return {
          id: client.id,
          firstName: client.first_name || '',
          lastName: client.last_name || '',
          email: client.email,
          phone: client.phone,
          address: client.address,
          createdAt: new Date(client.created_at),
          totalCases: allCases.length,
          activeCases: allCases.filter((c: any) => c.status === 'active').length,
          totalRevenue: allInvoices
            .filter((inv: any) => inv.status === 'paid')
            .reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0),
          lastContact: client.updated_at ? new Date(client.updated_at) : undefined,
          notes: client.notes,
          tags: []
        };
      });

      setClients(transformedClients);
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

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          user_id: userId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          postal_code: formData.postalCode || null,
          company_name: formData.companyName || null,
          notes: formData.notes || null,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Reset form and close modal
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        companyName: '',
        notes: ''
      });
      setShowCreateModal(false);
      
      // Reload clients
      loadClients();
    } catch (error) {
      console.error('Error creating client:', error);
      toast(isAr ? 'خطأ في إنشاء العميل' : 'Erreur lors de la création du client', 'error');
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { data, error } = await supabase
        .from('clients')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          postal_code: formData.postalCode || null,
          company_name: formData.companyName || null,
          notes: formData.notes || null
        })
        .eq('id', editingClient.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Reset form and close modal
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        companyName: '',
        notes: ''
      });
      setShowEditModal(false);
      setEditingClient(null);
      
      // Reload clients
      loadClients();
    } catch (error) {
      console.error('Error updating client:', error);
      toast(isAr ? 'خطأ في تحديث العميل' : 'Erreur lors de la mise à jour du client', 'error');
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: '',
      postalCode: '',
      companyName: '',
      notes: client.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return;
    }

    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', userId);

      if (error) throw error;

      // Reload clients
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast(isAr ? 'خطأ في حذف العميل' : 'Erreur lors de la suppression du client', 'error');
    }
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
          <LimitChecker resourceType="client" language={language}>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-legal-gold text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-legal-gold/20 hover:bg-legal-gold/90 active:scale-95 transition-all"
            >
              <Plus size={20} />
              {isAr ? 'عميل جديد' : 'Nouveau Client'}
            </button>
          </LimitChecker>
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
                            {client.firstName?.[0] || '?'}{client.lastName?.[0] || '?'}
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
                            onClick={() => openEditModal(client)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title={isAr ? 'تعديل' : 'Modifier'}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClient(client.id)}
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

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{isAr ? 'عميل جديد' : 'Nouveau Client'}</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  ✕
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAr ? 'الاسم الأول' : 'Prénom'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAr ? 'اسم العائلة' : 'Nom'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAr ? 'الهاتف' : 'Téléphone'}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'اسم الشركة' : 'Nom de l\'entreprise'}
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'العنوان' : 'Adresse'}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAr ? 'المدينة' : 'Ville'}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAr ? 'الرمز البريدي' : 'Code Postal'}
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'ملاحظات' : 'Notes'}
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-legal-gold text-white rounded-xl font-bold hover:bg-legal-gold/90 transition-colors"
                >
                  {isAr ? 'إنشاء' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{isAr ? 'تعديل العميل' : 'Modifier le Client'}</h2>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  ✕
                </button>
              </div>
            </div>
            <form onSubmit={handleEditClient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAr ? 'الاسم الأول' : 'Prénom'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAr ? 'اسم العائلة' : 'Nom'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAr ? 'الهاتف' : 'Téléphone'}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'اسم الشركة' : 'Nom de l\'entreprise'}
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'العنوان' : 'Adresse'}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAr ? 'المدينة' : 'Ville'}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAr ? 'الرمز البريدي' : 'Code Postal'}
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'ملاحظات' : 'Notes'}
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 border dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-legal-gold text-white rounded-xl font-bold hover:bg-legal-gold/90 transition-colors"
                >
                  {isAr ? 'حفظ' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
