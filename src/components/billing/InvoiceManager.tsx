import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Send, Eye, DollarSign, Calendar, User } from 'lucide-react';
import type { Language } from '../../types';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { LimitChecker } from '../trial/LimitChecker';
import { Sparkline } from '../charts/MiniChart';
import { useAppToast } from '../../contexts/ToastContext';
import { exportCSV, exportExcel, INVOICE_EXPORT_COLUMNS } from '../../services/exportService';
import AlgerianPaymentModal from './AlgerianPaymentModal';

interface InvoiceManagerProps {
  userId: string;
  language: Language;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  case_id?: string;
  case_title?: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  items: InvoiceItem[];
  notes?: string;
  created_at: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export const InvoiceManager: React.FC<InvoiceManagerProps> = ({ userId, language }) => {
  const { toast } = useAppToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  
  const isAr = language === 'ar';

  useEffect(() => {
    loadInvoices();
  }, [userId]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (first_name, last_name, company_name),
          cases (case_number, title)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formattedInvoices = data.map(inv => ({
          ...inv,
          client_name: inv.clients?.company_name || 
                      `${inv.clients?.first_name} ${inv.clients?.last_name}`,
          case_title: inv.cases ? `${inv.cases.case_number} - ${inv.cases.title}` : undefined
        }));
        setInvoices(formattedInvoices);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'sent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { fr: string; ar: string }> = {
      draft: { fr: 'Brouillon', ar: 'مسودة' },
      sent: { fr: 'Envoyée', ar: 'مرسلة' },
      paid: { fr: 'Payée', ar: 'مدفوعة' },
      overdue: { fr: 'En retard', ar: 'متأخرة' },
      cancelled: { fr: 'Annulée', ar: 'ملغاة' }
    };
    return isAr ? labels[status]?.ar : labels[status]?.fr;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const generatePDF = async (invoice: Invoice) => {
    try {
      const { downloadInvoicePDF } = await import('../../utils/invoicePDF');
      const { supabase } = await import('../../lib/supabase');
      
      // Charger les infos de l'avocat
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('id', userId)
        .single();
      
      const lawyerInfo = {
        name: profile ? `${profile.first_name} ${profile.last_name}` : 'Avocat',
        email: profile?.email,
        phone: profile?.phone,
        address: 'Alger, Algérie', // À personnaliser
        nif: '' // À ajouter dans le profil
      };
      
      downloadInvoicePDF(invoice, lawyerInfo);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast(isAr ? 'خطأ في إنشاء PDF' : 'Erreur lors de la génération du PDF', 'error');
    }
  };

  const sendInvoice = async (invoice: Invoice) => {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { getInvoicePDFBlob } = await import('../../utils/invoicePDF');
      const { sendInvoiceEmail } = await import('../../services/emailService');
      
      // Charger les infos de l'avocat
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('id', userId)
        .single();
      
      const lawyerInfo = {
        name: profile ? `${profile.first_name} ${profile.last_name}` : 'Avocat',
        email: profile?.email,
        phone: profile?.phone,
        address: 'Alger, Algérie',
        nif: ''
      };
      
      // Générer le PDF
      const pdfBlob = getInvoicePDFBlob(invoice, lawyerInfo);
      
      // Charger l'email du client
      const { data: client } = await supabase
        .from('clients')
        .select('email, first_name, last_name')
        .eq('id', invoice.client_id)
        .single();
      
      if (!client?.email) {
        toast(isAr ? 'العميل ليس لديه بريد إلكتروني' : 'Le client n\'a pas d\'email', 'warning');
        return;
      }
      
      // Envoyer l'email
      const sent = await sendInvoiceEmail(
        client.email,
        `${client.first_name} ${client.last_name}`,
        invoice.invoice_number,
        invoice.total,
        pdfBlob
      );
      
      // Mettre à jour le statut
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (error) throw error;

      if (sent) {
        toast(isAr ? 'تم إرسال الفاتورة بنجاح' : 'Facture envoyée avec succès', 'success');
      } else {
        toast(isAr ? 'تم فتح البريد الإلكتروني' : 'Client email ouvert', 'info');
      }
      
      loadInvoices();
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast(isAr ? 'خطأ في الإرسال' : 'Erreur lors de l\'envoi', 'error');
    }
  };

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.total, 0),
    paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    unpaidAmount: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.total, 0)
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {isAr ? 'الفواتير' : 'Facturation'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isAr ? 'إدارة الفواتير والمدفوعات' : 'Gestion des factures et paiements'}
          </p>
        </div>
        <LimitChecker resourceType="invoice" language={language}>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            {isAr ? 'فاتورة جديدة' : 'Nouvelle Facture'}
          </button>
        </LimitChecker>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(invoices, INVOICE_EXPORT_COLUMNS, `factures-${new Date().toISOString().slice(0,10)}`)}
            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm"
          >
            <Download size={16} />CSV
          </button>
          <button
            onClick={() => exportExcel(invoices, INVOICE_EXPORT_COLUMNS, `factures-${new Date().toISOString().slice(0,10)}`)}
            className="px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl font-medium flex items-center gap-2 hover:bg-green-100 dark:hover:bg-green-900/40 transition-all text-sm"
          >
            <Download size={16} />Excel
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">{isAr ? 'المجموع' : 'Total'}</span>
            <Sparkline values={[2,4,3,5,4,6,stats.total]} color="#2563eb" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <FileText size={18} className="text-blue-600" />
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">{isAr ? 'مدفوعة' : 'Payées'}</span>
            <Sparkline values={[1,2,2,3,3,4,stats.paid]} color="#16a34a" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <DollarSign size={18} className="text-green-600" />
            <p className="text-3xl font-bold text-green-600">{stats.paid}</p>
          </div>
          <p className="text-xs text-slate-500 mt-1">{formatAmount(stats.paidAmount)}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">{isAr ? 'قيد الانتظار' : 'En attente'}</span>
            <Sparkline values={[1,2,1,3,2,3,stats.sent]} color="#ea580c" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Calendar size={18} className="text-orange-600" />
            <p className="text-3xl font-bold text-orange-600">{stats.sent}</p>
          </div>
          <p className="text-xs text-slate-500 mt-1">{formatAmount(stats.unpaidAmount)}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">{isAr ? 'متأخرة' : 'En retard'}</span>
            <Sparkline values={[0,1,0,1,1,0,stats.overdue]} color="#ef4444" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <FileText size={18} className="text-red-600" />
            <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800">
        <div className="p-6 border-b dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isAr ? 'قائمة الفواتير' : 'Liste des Factures'}
          </h2>
        </div>

        <div className="divide-y dark:divide-slate-800">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : invoices.length > 0 ? (
            invoices.map(invoice => (
              <div
                key={invoice.id}
                className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {invoice.invoice_number}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      <p className="flex items-center gap-2">
                        <User size={14} />
                        {invoice.client_name}
                      </p>
                      {invoice.case_title && (
                        <p className="flex items-center gap-2">
                          <FileText size={14} />
                          {invoice.case_title}
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <Calendar size={14} />
                        {isAr ? 'تاريخ الإصدار' : 'Émise le'}: {new Date(invoice.issue_date).toLocaleDateString()}
                        {' | '}
                        {isAr ? 'تاريخ الاستحقاق' : 'Échéance'}: {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600 mb-3">
                      {formatAmount(invoice.total)}
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title={isAr ? 'عرض' : 'Voir'}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => generatePDF(invoice)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title={isAr ? 'تحميل PDF' : 'Télécharger PDF'}
                      >
                        <Download size={18} />
                      </button>
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => sendInvoice(invoice)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-blue-600"
                          title={isAr ? 'إرسال' : 'Envoyer'}
                        >
                          <Send size={18} />
                        </button>
                      )}
                      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <button
                          onClick={() => setPaymentInvoice(invoice)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                          title={isAr ? 'تسجيل الدفع' : 'Enregistrer paiement'}
                        >
                          {isAr ? 'دفع' : 'Payer'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400">
              <FileText size={48} className="mx-auto mb-3 opacity-20" />
              <p>{isAr ? 'لا توجد فواتير' : 'Aucune facture'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          userId={userId}
          language={language}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadInvoices();
          }}
        />
      )}

      {/* Payment Modal */}
      {paymentInvoice && (
        <AlgerianPaymentModal
          language={language}
          invoiceNumber={paymentInvoice.invoice_number}
          amount={paymentInvoice.total}
          clientName={paymentInvoice.client_name}
          onConfirm={async (method, reference) => {
            const { supabase } = await import('../../lib/supabase');
            const { error } = await supabase
              .from('invoices')
              .update({
                status: 'paid',
                paid_at: new Date().toISOString(),
                payment_method: method,
                payment_reference: reference || null,
              })
              .eq('id', paymentInvoice.id);
            if (error) throw error;
            try {
              const { auditService } = await import('../../services/auditService');
              await auditService.log({ user_id: userId, action: 'invoice.paid', resource_type: 'invoice', resource_id: paymentInvoice.id, details: { method, amount: paymentInvoice.total } });
            } catch {}
            loadInvoices();
          }}
          onClose={() => setPaymentInvoice(null)}
        />
      )}
    </div>
  );
};

export default InvoiceManager;
