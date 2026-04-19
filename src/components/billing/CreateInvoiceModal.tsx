import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import type { Language } from '@/types';
import { useAppToast } from '../../contexts/ToastContext';

interface CreateInvoiceModalProps {
  userId: string;
  language: Language;
  onClose: () => void;
  onSuccess: () => void;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  email?: string;
}

interface Case {
  id: string;
  case_number: string;
  title: string;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  userId,
  language,
  onClose,
  onSuccess
}) => {
  const isAr = language === 'ar';
  const { toast } = useAppToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    clientId: '',
    caseId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    taxRate: 19, // TVA 19% en Algérie
    notes: ''
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 }
  ]);

  useEffect(() => {
    loadClients();
  }, [userId]);

  useEffect(() => {
    if (formData.clientId) {
      loadCases(formData.clientId);
    }
  }, [formData.clientId]);

  const loadClients = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, company_name, email')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('first_name');

      if (!error && data) {
        setClients(data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadCases = async (clientId: string) => {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, title')
        .eq('user_id', userId)
        .eq('client_id', clientId)
        .in('status', ['nouveau', 'en_cours', 'audience'])
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCases(data);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate amount
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * formData.taxRate) / 100;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      toast(isAr ? 'يرجى اختيار عميل' : 'Veuillez sélectionner un client', 'warning');
      return;
    }

    if (items.some(item => !item.description || item.quantity <= 0 || item.unit_price <= 0)) {
      toast(isAr ? 'يرجى ملء جميع عناصر الفاتورة' : 'Veuillez remplir tous les éléments', 'warning');
      return;
    }

    setLoading(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      
      // Generate invoice number
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${String((count || 0) + 1).padStart(4, '0')}`;
      
      const { subtotal, taxAmount, total } = calculateTotals();
      
      const { error } = await supabase
        .from('invoices')
        .insert([{
          user_id: userId,
          invoice_number: invoiceNumber,
          client_id: formData.clientId,
          case_id: formData.caseId || null,
          issue_date: formData.issueDate,
          due_date: formData.dueDate,
          status: 'draft',
          subtotal,
          tax_rate: formData.taxRate,
          tax_amount: taxAmount,
          total,
          items,
          notes: formData.notes || null
        }]);

      if (error) throw error;

      try {
        const { auditService } = await import('../../services/auditService');
        await auditService.log({ user_id: userId, action: 'invoice.create', resource_type: 'invoice', details: { invoice_number: invoiceNumber, total } });
      } catch {}

      toast(isAr 
        ? `تم إنشاء الفاتورة بنجاح! رقم: ${invoiceNumber}`
        : `Facture créée avec succès! Numéro: ${invoiceNumber}`, 'success');
      
      onSuccess();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast(isAr ? 'خطأ في إنشاء الفاتورة' : 'Erreur lors de la création', 'error');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-2xl font-bold">
            {isAr ? 'فاتورة جديدة' : 'Nouvelle Facture'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client & Case */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {isAr ? 'العميل' : 'Client'} <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value, caseId: '' })}
                className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">{isAr ? 'اختر عميل' : 'Sélectionner un client'}</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.company_name || `${client.first_name} ${client.last_name}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {isAr ? 'الملف (اختياري)' : 'Dossier (optionnel)'}
              </label>
              <select
                value={formData.caseId}
                onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
                disabled={!formData.clientId}
                className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-none disabled:opacity-50"
              >
                <option value="">{isAr ? 'بدون ملف' : 'Sans dossier'}</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} - {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {isAr ? 'تاريخ الإصدار' : 'Date d\'émission'} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {isAr ? 'تاريخ الاستحقاق' : 'Date d\'échéance'} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                min={formData.issueDate}
                className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">
                {isAr ? 'العناصر' : 'Éléments'} <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-green-200 transition-colors"
              >
                <Plus size={16} />
                {isAr ? 'إضافة' : 'Ajouter'}
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-4 border dark:border-slate-700 rounded-xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        required
                        placeholder={isAr ? 'الوصف' : 'Description'}
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        {isAr ? 'الكمية' : 'Quantité'}
                      </label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        {isAr ? 'السعر' : 'Prix unitaire'}
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        {isAr ? 'المبلغ' : 'Montant'}
                      </label>
                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-bold text-green-600">
                        {item.amount.toLocaleString()} DA
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {isAr ? 'المجموع الفرعي' : 'Sous-total'}
              </span>
              <span className="font-bold">{subtotal.toLocaleString()} DA</span>
            </div>

            <div className="flex justify-between text-sm items-center">
              <span className="text-slate-600 dark:text-slate-400">
                {isAr ? 'الضريبة' : 'TVA'}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 border dark:border-slate-700 rounded text-sm text-center"
                />
                <span className="text-xs">%</span>
                <span className="font-bold">{taxAmount.toLocaleString()} DA</span>
              </div>
            </div>

            <div className="pt-3 border-t dark:border-slate-700 flex justify-between text-lg">
              <span className="font-bold">{isAr ? 'المجموع' : 'Total'}</span>
              <span className="font-bold text-green-600">{total.toLocaleString()} DA</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'ملاحظات' : 'Notes'}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder={isAr ? 'ملاحظات إضافية...' : 'Notes additionnelles...'}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save size={20} />
                  {isAr ? 'حفظ' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoiceModal;
