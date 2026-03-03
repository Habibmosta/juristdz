import React, { useState, useEffect } from 'react';
import { FileText, Plus, Send, DollarSign, AlertCircle, CheckCircle, Clock, Download, Eye } from 'lucide-react';
import { InvoiceService } from '../../services/invoiceService';
import type { Invoice } from '../../types/client.types';
import { useAuth } from '../../hooks/useAuth';

export const InvoiceManagement: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadInvoices();
      loadStats();
    }
  }, [user]);

  const loadInvoices = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await InvoiceService.getInvoices(user.id);
      setInvoices(data);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const data = await InvoiceService.getInvoiceStats(user.id);
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filterStatus === 'all') return true;
    return invoice.status === filterStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-700 text-slate-300';
      case 'sent':
        return 'bg-blue-500/20 text-blue-400';
      case 'paid':
        return 'bg-green-500/20 text-green-400';
      case 'overdue':
        return 'bg-red-500/20 text-red-400';
      case 'cancelled':
        return 'bg-slate-700 text-slate-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4" />;
      case 'sent':
        return <Send className="w-4 h-4" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'sent':
        return 'Envoyée';
      case 'paid':
        return 'Payée';
      case 'overdue':
        return 'En retard';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Facturation</h1>
              <p className="text-slate-400">Comme Clio - Gérez vos factures et paiements</p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Facture
          </button>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-2xl font-bold">{stats.totalInvoices}</span>
              </div>
              <p className="text-slate-400 text-sm">Total Factures</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-slate-500">{stats.draftInvoices} brouillons</span>
                <span className="text-slate-600">•</span>
                <span className="text-blue-400">{stats.sentInvoices} envoyées</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-2xl font-bold">{formatCurrency(stats.totalBilled)}</span>
              </div>
              <p className="text-slate-400 text-sm">Total Facturé</p>
              <p className="text-purple-400 text-xs mt-1">{stats.collectionRate.toFixed(1)}% collecté</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-2xl font-bold">{formatCurrency(stats.totalPaid)}</span>
              </div>
              <p className="text-slate-400 text-sm">Total Payé</p>
              <p className="text-green-400 text-xs mt-1">{stats.paidInvoices} factures payées</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</span>
              </div>
              <p className="text-slate-400 text-sm">En Attente</p>
              {stats.overdueInvoices > 0 && (
                <p className="text-red-400 text-xs mt-1">{stats.overdueInvoices} en retard</p>
              )}
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex items-center gap-4 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillons</option>
            <option value="sent">Envoyées</option>
            <option value="paid">Payées</option>
            <option value="overdue">En retard</option>
            <option value="cancelled">Annulées</option>
          </select>

          <span className="text-sm text-slate-400 ml-auto">
            {filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Liste des factures */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-slate-400">Chargement...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucune facture</h3>
            <p className="text-slate-400 mb-6">Créez votre première facture</p>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors">
              Créer une Facture
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Numéro</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Client</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Échéance</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Montant</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Statut</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium">{invoice.invoice_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">
                        {invoice.client?.company_name || 
                         `${invoice.client?.first_name} ${invoice.client?.last_name}`}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-400">
                        {new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-400">
                        {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-purple-400">
                        {formatCurrency(invoice.total)}
                      </p>
                      {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total && (
                        <p className="text-xs text-green-400">
                          {formatCurrency(invoice.paid_amount)} payé
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Télécharger PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {invoice.status === 'draft' && (
                          <button
                            className="p-2 hover:bg-blue-900/50 rounded-lg transition-colors"
                            title="Envoyer"
                          >
                            <Send className="w-4 h-4 text-blue-400" />
                          </button>
                        )}
                        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                          <button
                            className="p-2 hover:bg-green-900/50 rounded-lg transition-colors"
                            title="Marquer comme payée"
                          >
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
