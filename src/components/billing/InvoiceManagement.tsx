import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Language } from '../../../types';
import { 
  FileText, Plus, Search, Filter, Download, Send, 
  CheckCircle, Clock, AlertCircle, Euro, Calendar,
  Eye, Edit, Trash2, DollarSign
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  payment_date?: string;
  payment_method?: string;
  notes?: string;
  case_id?: string;
  client_id?: string;
  case?: { title: string };
  client?: { first_name: string; last_name: string };
}

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  item_type: 'service' | 'expense';
}

interface InvoiceManagementProps {
  language: Language;
  userId: string;
}

const translations = {
  fr: {
    title: 'Facturation',
    newInvoice: 'Nouvelle Facture',
    search: 'Rechercher...',
    filter: 'Filtrer',
    all: 'Toutes',
    draft: 'Brouillon',
    sent: 'Envoyée',
    paid: 'Payée',
    overdue: 'En retard',
    invoiceNumber: 'N° Facture',
    date: 'Date',
    dueDate: 'Échéance',
    client: 'Client',
    case: 'Dossier',
    amount: 'Montant HT',
    tax: 'TVA',
    total: 'Total TTC',
    status: 'Statut',
    actions: 'Actions',
    view: 'Voir',
    edit: 'Modifier',
    delete: 'Supprimer',
    download: 'Télécharger PDF',
    send: 'Envoyer',
    markPaid: 'Marquer payée',
    noInvoices: 'Aucune facture',
    createFirst: 'Créez votre première facture',
    totalRevenue: 'Chiffre d\'affaires',
    pending: 'En attente',
    thisMonth: 'Ce mois',
  },
  ar: {
    title: 'الفوترة',
    newInvoice: 'فاتورة جديدة',
    search: 'بحث...',
    filter: 'تصفية',
    all: 'الكل',
    draft: 'مسودة',
    sent: 'مرسلة',
    paid: 'مدفوعة',
    overdue: 'متأخرة',
    invoiceNumber: 'رقم الفاتورة',
    date: 'التاريخ',
    dueDate: 'تاريخ الاستحقاق',
    client: 'العميل',
    case: 'الملف',
    amount: 'المبلغ قبل الضريبة',
    tax: 'الضريبة',
    total: 'المجموع',
    status: 'الحالة',
    actions: 'الإجراءات',
    view: 'عرض',
    edit: 'تعديل',
    delete: 'حذف',
    download: 'تحميل PDF',
    send: 'إرسال',
    markPaid: 'تحديد كمدفوعة',
    noInvoices: 'لا توجد فواتير',
    createFirst: 'أنشئ فاتورتك الأولى',
    totalRevenue: 'إجمالي الإيرادات',
    pending: 'قيد الانتظار',
    thisMonth: 'هذا الشهر',
  }
};

const InvoiceManagement: React.FC<InvoiceManagementProps> = ({ language, userId }) => {
  const t = translations[language];
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [userId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          case:cases(title),
          client:clients(first_name, last_name)
        `)
        .eq('user_id', userId)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.client && `${invoice.client.first_name} ${invoice.client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0),
    pending: invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').reduce((sum, inv) => sum + inv.total_amount, 0),
    thisMonth: invoices.filter(inv => {
      const date = new Date(inv.invoice_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, inv) => sum + inv.total_amount, 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-400 bg-green-900/20';
      case 'sent': return 'text-blue-400 bg-blue-900/20';
      case 'overdue': return 'text-red-400 bg-red-900/20';
      default: return 'text-slate-400 bg-slate-800/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-gold"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-slate-400">
            {invoices.length} {language === 'ar' ? 'فاتورة' : 'factures'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-legal-gold text-white rounded-xl hover:bg-legal-gold/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t.newInvoice}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-legal-gold/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-legal-gold" />
            </div>
            <span className="text-slate-400 text-sm">{t.totalRevenue}</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.total)}</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-slate-400 text-sm">{t.paid}</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.paid)}</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-400 text-sm">{t.pending}</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.pending)}</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-900/20 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-slate-400 text-sm">{t.thisMonth}</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.thisMonth)}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-legal-gold"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'draft', 'sent', 'paid', 'overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-3 rounded-xl transition-colors ${
                statusFilter === status
                  ? 'bg-legal-gold text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              {t[status as keyof typeof t]}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-slate-800/30 rounded-xl p-12 text-center border border-slate-700">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">{t.noInvoices}</h3>
          <p className="text-slate-400 mb-6">{t.createFirst}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-legal-gold text-white rounded-xl hover:bg-legal-gold/90 transition-colors"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            {t.newInvoice}
          </button>
        </div>
      ) : (
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t.invoiceNumber}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t.date}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t.client}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">{t.case}</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">{t.amount}</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">{t.total}</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">{t.status}</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-legal-gold">{invoice.invoice_number}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{formatDate(invoice.invoice_date)}</td>
                    <td className="px-6 py-4 text-slate-300">
                      {invoice.client ? `${invoice.client.first_name} ${invoice.client.last_name}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {invoice.case?.title || '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-300">{formatCurrency(invoice.amount)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-white">{formatCurrency(invoice.total_amount)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          {t[invoice.status as keyof typeof t]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-legal-gold transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-blue-400 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default InvoiceManagement;
