import { supabase } from '../lib/supabase';
import type { Invoice, InvoiceItem, TimeEntry, Payment } from '../types/client.types';

export class InvoiceService {
  // ═══════════════════════════════════════════════════════════════════════════
  // GESTION DES FACTURES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Générer un numéro de facture automatique
   */
  static async generateInvoiceNumber(userId: string): Promise<string> {
    const { data, error } = await supabase.rpc('generate_invoice_number', {
      p_user_id: userId
    });

    if (error) throw error;
    return data;
  }

  /**
   * Créer une nouvelle facture
   */
  static async createInvoice(userId: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    // Générer le numéro de facture si non fourni
    if (!invoiceData.invoice_number) {
      invoiceData.invoice_number = await this.generateInvoiceNumber(userId);
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        ...invoiceData,
        status: invoiceData.status || 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Récupérer toutes les factures
   */
  static async getInvoices(userId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('user_id', userId)
      .order('invoice_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Récupérer une facture avec ses lignes
   */
  static async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        items:invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mettre à jour une facture
   */
  static async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Supprimer une facture
   */
  static async deleteInvoice(invoiceId: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;
  }

  /**
   * Ajouter une ligne à une facture
   */
  static async addInvoiceItem(invoiceId: string, item: Partial<InvoiceItem>): Promise<InvoiceItem> {
    const { data, error } = await supabase
      .from('invoice_items')
      .insert({
        invoice_id: invoiceId,
        ...item
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Supprimer une ligne de facture
   */
  static async deleteInvoiceItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('invoice_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }

  /**
   * Marquer une facture comme envoyée
   */
  static async sendInvoice(invoiceId: string): Promise<Invoice> {
    return this.updateInvoice(invoiceId, { status: 'sent' });
  }

  /**
   * Marquer une facture comme payée
   */
  static async markAsPaid(invoiceId: string, paymentData: Partial<Payment>): Promise<Invoice> {
    // Créer le paiement
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) throw new Error('Facture introuvable');

    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: invoice.user_id,
        invoice_id: invoiceId,
        client_id: invoice.client_id,
        amount: paymentData.amount || invoice.total,
        payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
        payment_method: paymentData.payment_method || 'cash',
        reference: paymentData.reference,
        notes: paymentData.notes
      });

    if (paymentError) throw paymentError;

    // Mettre à jour la facture
    const newPaidAmount = (invoice.paid_amount || 0) + (paymentData.amount || invoice.total);
    const isPaid = newPaidAmount >= invoice.total;

    return this.updateInvoice(invoiceId, {
      paid_amount: newPaidAmount,
      status: isPaid ? 'paid' : 'sent',
      paid_date: isPaid ? (paymentData.payment_date || new Date().toISOString().split('T')[0]) : undefined
    });
  }

  /**
   * Récupérer les factures en retard
   */
  static async getOverdueInvoices(userId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('overdue_invoices')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Statistiques de facturation
   */
  static async getInvoiceStats(userId: string) {
    const invoices = await this.getInvoices(userId);

    const totalInvoices = invoices.length;
    const draftInvoices = invoices.filter(i => i.status === 'draft').length;
    const sentInvoices = invoices.filter(i => i.status === 'sent').length;
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;

    const totalBilled = invoices.reduce((sum, i) => sum + i.total, 0);
    const totalPaid = invoices.reduce((sum, i) => sum + i.paid_amount, 0);
    const totalOutstanding = totalBilled - totalPaid;

    const collectionRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;

    return {
      totalInvoices,
      draftInvoices,
      sentInvoices,
      paidInvoices,
      overdueInvoices,
      totalBilled,
      totalPaid,
      totalOutstanding,
      collectionRate
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTION DU TEMPS (TIME TRACKING)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Démarrer un chronomètre
   */
  static async startTimer(userId: string, data: Partial<TimeEntry>): Promise<TimeEntry> {
    const { data: entry, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: userId,
        start_time: new Date().toISOString(),
        ...data,
        billable: data.billable !== false
      })
      .select()
      .single();

    if (error) throw error;
    return entry;
  }

  /**
   * Arrêter un chronomètre
   */
  static async stopTimer(entryId: string): Promise<TimeEntry> {
    const { data, error } = await supabase
      .from('time_entries')
      .update({
        end_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Créer une entrée de temps manuelle
   */
  static async createTimeEntry(userId: string, entry: Partial<TimeEntry>): Promise<TimeEntry> {
    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: userId,
        ...entry,
        billable: entry.billable !== false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Récupérer les entrées de temps
   */
  static async getTimeEntries(userId: string, filters?: {
    caseId?: string;
    clientId?: string;
    billable?: boolean;
    invoiced?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<TimeEntry[]> {
    let query = supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (filters?.caseId) {
      query = query.eq('case_id', filters.caseId);
    }
    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    if (filters?.billable !== undefined) {
      query = query.eq('billable', filters.billable);
    }
    if (filters?.invoiced !== undefined) {
      query = query.eq('invoiced', filters.invoiced);
    }
    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('start_time', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Mettre à jour une entrée de temps
   */
  static async updateTimeEntry(entryId: string, updates: Partial<TimeEntry>): Promise<TimeEntry> {
    const { data, error } = await supabase
      .from('time_entries')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Supprimer une entrée de temps
   */
  static async deleteTimeEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
  }

  /**
   * Créer une facture à partir des entrées de temps
   */
  static async createInvoiceFromTimeEntries(
    userId: string,
    clientId: string,
    timeEntryIds: string[],
    invoiceData: Partial<Invoice>
  ): Promise<Invoice> {
    // Récupérer les entrées de temps
    const { data: timeEntries, error: entriesError } = await supabase
      .from('time_entries')
      .select('*')
      .in('id', timeEntryIds)
      .eq('billable', true)
      .eq('invoiced', false);

    if (entriesError) throw entriesError;
    if (!timeEntries || timeEntries.length === 0) {
      throw new Error('Aucune entrée de temps facturable trouvée');
    }

    // Créer la facture
    const invoice = await this.createInvoice(userId, {
      ...invoiceData,
      client_id: clientId
    });

    // Ajouter les lignes de facture
    for (const entry of timeEntries) {
      await this.addInvoiceItem(invoice.id, {
        item_type: 'time_entry',
        time_entry_id: entry.id,
        description: entry.description,
        quantity: (entry.duration_minutes || 0) / 60, // Convertir en heures
        unit_price: entry.hourly_rate || 0,
        amount: entry.amount || 0,
        sort_order: 0
      });

      // Marquer l'entrée comme facturée
      await this.updateTimeEntry(entry.id, {
        invoiced: true,
        invoice_id: invoice.id
      });
    }

    return this.getInvoice(invoice.id) as Promise<Invoice>;
  }

  /**
   * Statistiques de temps
   */
  static async getTimeStats(userId: string, filters?: {
    startDate?: string;
    endDate?: string;
  }) {
    const entries = await this.getTimeEntries(userId, filters);

    const totalEntries = entries.length;
    const billableEntries = entries.filter(e => e.billable).length;
    const invoicedEntries = entries.filter(e => e.invoiced).length;

    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const billableMinutes = entries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const invoicedMinutes = entries.filter(e => e.invoiced).reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

    const totalAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
    const billableAmount = entries.filter(e => e.billable).reduce((sum, e) => sum + (e.amount || 0), 0);
    const invoicedAmount = entries.filter(e => e.invoiced).reduce((sum, e) => sum + (e.amount || 0), 0);
    const uninvoicedAmount = billableAmount - invoicedAmount;

    return {
      totalEntries,
      billableEntries,
      invoicedEntries,
      uninvoicedEntries: billableEntries - invoicedEntries,
      totalHours: totalMinutes / 60,
      billableHours: billableMinutes / 60,
      invoicedHours: invoicedMinutes / 60,
      uninvoicedHours: (billableMinutes - invoicedMinutes) / 60,
      totalAmount,
      billableAmount,
      invoicedAmount,
      uninvoicedAmount,
      averageHourlyRate: billableMinutes > 0 ? (billableAmount / (billableMinutes / 60)) : 0
    };
  }
}
