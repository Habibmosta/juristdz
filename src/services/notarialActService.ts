import { supabase } from '../lib/supabase';

export type ActType =
  | 'vente_immobiliere' | 'donation' | 'succession' | 'mariage' | 'divorce'
  | 'constitution_societe' | 'dissolution_societe' | 'procuration' | 'testament'
  | 'hypotheque' | 'mainlevee' | 'bail_commercial' | 'bail_habitation' | 'partage' | 'autre';

export type ActStatus = 'draft' | 'signed' | 'registered' | 'delivered';

export interface NotarialAct {
  id: string;
  user_id: string;
  act_number: string;
  act_year: number;
  sequence_number: number;
  act_type: ActType;
  act_type_label?: string;
  party_first_name: string;
  party_last_name: string;
  party_nin?: string;
  party_address?: string;
  counterparty_name?: string;
  counterparty_nin?: string;
  act_date: string;
  act_object?: string;
  property_address?: string;
  act_value?: number;
  registration_fees?: number;
  notary_fees?: number;
  status: ActStatus;
  registration_ref?: string;
  land_registry_ref?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const ACT_TYPE_LABELS: Record<ActType, { fr: string; ar: string }> = {
  vente_immobiliere:    { fr: 'Vente Immobilière',        ar: 'بيع عقاري' },
  donation:             { fr: 'Donation',                  ar: 'هبة' },
  succession:           { fr: 'Succession / Héritage',     ar: 'إرث / تركة' },
  mariage:              { fr: 'Contrat de Mariage',        ar: 'عقد زواج' },
  divorce:              { fr: 'Acte de Divorce',           ar: 'عقد طلاق' },
  constitution_societe: { fr: 'Constitution de Société',   ar: 'تأسيس شركة' },
  dissolution_societe:  { fr: 'Dissolution de Société',    ar: 'حل شركة' },
  procuration:          { fr: 'Procuration',               ar: 'توكيل' },
  testament:            { fr: 'Testament',                  ar: 'وصية' },
  hypotheque:           { fr: 'Hypothèque',                ar: 'رهن عقاري' },
  mainlevee:            { fr: 'Mainlevée',                  ar: 'رفع الرهن' },
  bail_commercial:      { fr: 'Bail Commercial',           ar: 'إيجار تجاري' },
  bail_habitation:      { fr: 'Bail d\'Habitation',        ar: 'إيجار سكني' },
  partage:              { fr: 'Acte de Partage',           ar: 'عقد قسمة' },
  autre:                { fr: 'Autre',                      ar: 'أخرى' },
};

export const ACT_STATUS_CONFIG: Record<ActStatus, { fr: string; ar: string; color: string }> = {
  draft:      { fr: 'Brouillon',   ar: 'مسودة',         color: 'text-slate-400' },
  signed:     { fr: 'Signé',       ar: 'موقع',           color: 'text-blue-400' },
  registered: { fr: 'Enregistré', ar: 'مسجل',           color: 'text-amber-400' },
  delivered:  { fr: 'Délivré',    ar: 'مسلّم',          color: 'text-green-400' },
};

export const notarialActService = {
  async getAll(userId: string, year?: number): Promise<NotarialAct[]> {
    let query = supabase
      .from('notarial_acts')
      .select('*')
      .eq('user_id', userId)
      .order('sequence_number', { ascending: false });

    if (year) query = query.eq('act_year', year);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getNextNumber(userId: string): Promise<{ sequence_num: number; act_num: string }> {
    const year = new Date().getFullYear();
    const { data, error } = await supabase.rpc('get_next_act_number', {
      p_user_id: userId,
      p_year: year,
    });
    if (error) throw error;
    return data[0] || { sequence_num: 1, act_num: `N/${year}/0001` };
  },

  async create(userId: string, payload: Omit<NotarialAct, 'id' | 'user_id' | 'act_number' | 'act_year' | 'sequence_number' | 'created_at' | 'updated_at'>): Promise<NotarialAct> {
    const year = new Date().getFullYear();
    const { sequence_num, act_num } = await this.getNextNumber(userId);

    const { data, error } = await supabase
      .from('notarial_acts')
      .insert([{
        user_id: userId,
        act_number: act_num,
        act_year: year,
        sequence_number: sequence_num,
        ...payload,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: ActStatus, refs?: { registration_ref?: string; land_registry_ref?: string }): Promise<void> {
    const { error } = await supabase
      .from('notarial_acts')
      .update({ status, ...refs })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('notarial_acts').delete().eq('id', id);
    if (error) throw error;
  },

  async getStats(userId: string): Promise<{ total: number; byType: Record<string, number>; byStatus: Record<string, number>; totalValue: number }> {
    const year = new Date().getFullYear();
    const { data, error } = await supabase
      .from('notarial_acts')
      .select('act_type, status, act_value')
      .eq('user_id', userId)
      .eq('act_year', year);

    if (error) throw error;
    const acts = data || [];

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalValue = 0;

    acts.forEach(a => {
      byType[a.act_type] = (byType[a.act_type] || 0) + 1;
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      if (a.act_value) totalValue += Number(a.act_value);
    });

    return { total: acts.length, byType, byStatus, totalValue };
  },
};
