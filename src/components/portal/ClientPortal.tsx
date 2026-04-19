import React, { useState, useEffect } from 'react';
import { FileText, MessageSquare, Download, Eye, Lock, User, Calendar, DollarSign, Bell, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { Language } from '@/types';

interface ClientPortalProps {
  clientId: string;
  language: Language;
}

// ─── Invoices Tab ────────────────────────────────────────────────────────────
interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
}

const InvoicesTab: React.FC<{ clientId: string; isAr: boolean }> = ({ clientId, isAr }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase');
        const { data } = await supabase
          .from('invoices')
          .select('id, invoice_number, invoice_date, due_date, total_amount, status, description')
          .eq('client_id', clientId)
          .neq('status', 'draft')
          .order('invoice_date', { ascending: false });
        if (data) setInvoices(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clientId]);

  const statusConfig: Record<string, { label: string; labelAr: string; icon: React.ReactNode; cls: string }> = {
    sent:      { label: 'Envoyée',   labelAr: 'مرسلة',    icon: <Clock size={14} />,        cls: 'bg-blue-100 text-blue-700' },
    paid:      { label: 'Payée',     labelAr: 'مدفوعة',   icon: <CheckCircle size={14} />,  cls: 'bg-green-100 text-green-700' },
    overdue:   { label: 'En retard', labelAr: 'متأخرة',   icon: <AlertCircle size={14} />,  cls: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Annulée',   labelAr: 'ملغاة',    icon: <AlertCircle size={14} />,  cls: 'bg-slate-100 text-slate-500' },
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(n);

  const total = invoices.reduce((s, i) => s + i.total_amount, 0);
  const paid  = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total_amount, 0);
  const due   = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + i.total_amount, 0);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: isAr ? 'الإجمالي' : 'Total facturé', value: fmt(total), cls: 'text-white' },
          { label: isAr ? 'مدفوع' : 'Payé', value: fmt(paid), cls: 'text-green-400' },
          { label: isAr ? 'مستحق' : 'Restant dû', value: fmt(due), cls: 'text-orange-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-5 text-center">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {invoices.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <DollarSign size={48} className="mx-auto mb-3 opacity-20" />
          <p>{isAr ? 'لا توجد فواتير' : 'Aucune facture'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => {
            const s = statusConfig[inv.status] || statusConfig.sent;
            return (
              <div key={inv.id} className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{inv.invoice_number}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isAr ? 'تاريخ' : 'Date'}: {new Date(inv.invoice_date).toLocaleDateString()}
                      {inv.due_date && ` · ${isAr ? 'الاستحقاق' : 'Échéance'}: ${new Date(inv.due_date).toLocaleDateString()}`}
                    </p>
                    {inv.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{inv.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
                    {s.icon}
                    {isAr ? s.labelAr : s.label}
                  </span>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100 min-w-[100px] text-right">
                    {fmt(inv.total_amount)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface Case {
  id: string;
  case_number: string;
  title: string;
  status: string;
  opened_date: string;
  next_hearing_date?: string;
  description: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploaded_at: string;
  case_id: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'lawyer' | 'client';
  created_at: string;
  read: boolean;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({ clientId, language }) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'cases' | 'documents' | 'messages' | 'invoices'>('cases');
  const [cases, setCases] = useState<Case[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [clientId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../../lib/supabase');

      if (activeTab === 'cases') {
        const { data } = await supabase
          .from('cases')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });
        if (data) setCases(data);
      } else if (activeTab === 'documents') {
        const { data } = await supabase
          .from('documents')
          .select('*')
          .eq('client_id', clientId)
          .eq('shared_with_client', true)
          .order('uploaded_at', { ascending: false });
        if (data) setDocuments(data);
      } else if (activeTab === 'messages') {
        const { data } = await supabase
          .from('client_messages')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });
        if (data) setMessages(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { supabase } = await import('../../lib/supabase');
      const { error } = await supabase
        .from('client_messages')
        .insert([{
          client_id: clientId,
          content: newMessage.trim(),
          sender: 'client',
          read: false
        }]);

      if (!error) {
        setNewMessage('');
        loadData();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      nouveau: 'bg-blue-100 text-blue-700',
      en_cours: 'bg-yellow-100 text-yellow-700',
      audience: 'bg-orange-100 text-orange-700',
      cloture: 'bg-green-100 text-green-700',
      archive: 'bg-slate-100 text-slate-700'
    };
    return colors[status] || colors.nouveau;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            {isAr ? 'بوابة العميل' : 'Portail Client'}
          </h1>
          <p className="text-blue-100">
            {isAr ? 'تابع ملفاتك ووثائقك' : 'Suivez vos dossiers et documents'}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-2 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('cases')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'cases'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText size={20} />
              {isAr ? 'الملفات' : 'Dossiers'}
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'documents'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Download size={20} />
              {isAr ? 'الوثائق' : 'Documents'}
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'messages'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare size={20} />
              {isAr ? 'الرسائل' : 'Messages'}
              {messages.filter(m => !m.read && m.sender === 'lawyer').length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {messages.filter(m => !m.read && m.sender === 'lawyer').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'invoices'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <DollarSign size={20} />
              {isAr ? 'الفواتير' : 'Factures'}
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Cases Tab */}
            {activeTab === 'cases' && (
              <div className="space-y-4">
                {cases.map(c => (
                  <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{c.title}</h3>
                        <p className="text-sm text-slate-500">{c.case_number}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(c.status)}`}>
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-400 mb-4">{c.description}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        {isAr ? 'تاريخ الفتح' : 'Ouvert le'}: {new Date(c.opened_date).toLocaleDateString()}
                      </div>
                      {c.next_hearing_date && (
                        <div className="flex items-center gap-2 text-orange-600 font-medium">
                          <Bell size={16} />
                          {isAr ? 'الجلسة القادمة' : 'Prochaine audience'}: {new Date(c.next_hearing_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {cases.length === 0 && (
                  <div className="text-center py-20 text-slate-400">
                    <FileText size={48} className="mx-auto mb-3 opacity-20" />
                    <p>{isAr ? 'لا توجد ملفات' : 'Aucun dossier'}</p>
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                {documents.map(doc => (
                  <div key={doc.id} className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6 flex items-center justify-between hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <FileText size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold">{doc.name}</h4>
                        <p className="text-sm text-slate-500">
                          {(doc.size / 1024).toFixed(2)} KB • {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {documents.length === 0 && (
                  <div className="text-center py-20 text-slate-400">
                    <Download size={48} className="mx-auto mb-3 opacity-20" />
                    <p>{isAr ? 'لا توجد وثائق' : 'Aucun document'}</p>
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 overflow-hidden">
                <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-4 rounded-2xl ${
                          msg.sender === 'client'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        <p className="mb-2">{msg.content}</p>
                        <p className={`text-xs ${msg.sender === 'client' ? 'text-blue-100' : 'text-slate-500'}`}>
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {messages.length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                      <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                      <p>{isAr ? 'لا توجد رسائل' : 'Aucun message'}</p>
                    </div>
                  )}
                </div>
                
                <div className="border-t dark:border-slate-800 p-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={isAr ? 'اكتب رسالة...' : 'Écrivez un message...'}
                      className="flex-1 px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      onClick={sendMessage}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                    >
                      {isAr ? 'إرسال' : 'Envoyer'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <InvoicesTab clientId={clientId} isAr={isAr} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClientPortal;
