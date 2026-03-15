/**
 * Service — Registre des exploits d'huissier
 * Numérotation: E/YYYY/NNNN
 * Sources: CPCA, Décret exécutif 91-45 (tarifs huissiers)
 */
import { supabase } from '../lib/supabase';

export type ExploitType =
  | 'signification_jugement'
  | 'signification_acte'
  | 'commandement_payer'
  | 'saisie_arret'
  | 'saisie_execution'
  | 'saisie_conservatoire'
  | 'pv_constat'
  | 'pv_carence'
  | 'pv_remise'
  | 'sommation'
  | 'signification_divorce'
  | 'autre';

export type ExploitStatus = 'pending' | 'executed' | 'failed' | 'cancelled';

export interface BailiffExploit {
  id: string;
  user_id: string;
  exploit_number: string;
  exploit_year: number;
  sequence_number: number;
  exploit_type: ExploitType;
  exploit_type_label?: string;
  // Requérant (mandant)
  requester_name: string;
  requester_address?: string;
  // Destinataire (signifié)
  recipient_name: string;
  recipient_address: string;
  recipient_nin?: string;
  // Détails
  exploit_date: string;
  execution_date?: string;
  court_reference?: string;    // Référence jugement/acte
  case_description?: string;
  amount_claimed?: number;     // Montant réclamé (si commandement)
  // Frais
  bailiff_fees?: number;
  travel_fees?: number;
  // Statut
  status: ExploitStatus;
  failure_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const EXPLOIT_TYPE_LABELS: Record<ExploitType, { fr: string; ar: string }> = {
  signification_jugement:  { fr: 'Signification de Jugement',      ar: 'تبليغ حكم' },
  signification_acte:      { fr: 'Signification d\'Acte',          ar: 'تبليغ عقد' },
  commandement_payer:      { fr: 'Commandement de Payer',          ar: 'أمر بالدفع' },
  saisie_arret:            { fr: 'Saisie-Arrêt',                   ar: 'حجز لدى الغير' },
  saisie_execution:        { fr: 'Saisie-Exécution',               ar: 'حجز تنفيذي' },
  saisie_conservatoire:    { fr: 'Saisie Conservatoire',           ar: 'حجز تحفظي' },
  pv_constat:              { fr: 'PV de Constat',                  ar: 'محضر معاينة' },
  pv_carence:              { fr: 'PV de Carence',                  ar: 'محضر امتناع' },
  pv_remise:               { fr: 'PV de Remise',                   ar: 'محضر تسليم' },
  sommation:               { fr: 'Sommation',                      ar: 'إنذار' },
  signification_divorce:   { fr: 'Signification de Divorce',       ar: 'تبليغ طلاق' },
  autre:                   { fr: 'Autre exploit',                  ar: 'إجراء آخر' },
};

export const EXPLOIT_STATUS_CONFIG: Record<ExploitStatus, { fr: string; ar: string; color: string; bg: string }> = {
  pending:   { fr: 'En attente',  ar: 'في الانتظار', color: 'text-slate-300',  bg: 'bg-slate-700' },
  executed:  { fr: 'Exécuté',    ar: 'منفذ',         color: 'text-green-300',  bg: 'bg-green-900/40 border border-green-700' },
  failed:    { fr: 'Infructueux', ar: 'فاشل',         color: 'text-red-300',    bg: 'bg-red-900/40 border border-red-700' },
  cancelled: { fr: 'Annulé',     ar: 'ملغى',          color: 'text-slate-400',  bg: 'bg-slate-800' },
};

// ── Calcul des frais d'huissier (Décret 91-45 + LF 2024) ─────────────────────
export interface BailiffFeesResult {
  baseAmount: number;
  travelFees: number;
  timbreFiscal: number;
  tva: number;
  total: number;
  breakdown: { label_fr: string; label_ar: string; amount: number }[];
}

export function calculateBailiffFees(exploitType: ExploitType, distanceKm = 0, amountClaimed = 0): BailiffFeesResult {
  // Tarifs de base par type d'exploit (DA)
  const BASE_FEES: Record<ExploitType, number> = {
    signification_jugement:  2500,
    signification_acte:      2000,
    commandement_payer:      3000,
    saisie_arret:            5000,
    saisie_execution:        amountClaimed > 0 ? Math.max(amountClaimed * 0.02, 5000) : 5000,
    saisie_conservatoire:    4000,
    pv_constat:              4500,
    pv_carence:              2500,
    pv_remise:               2000,
    sommation:               2000,
    signification_divorce:   2500,
    autre:                   2000,
  };

  const baseAmount = BASE_FEES[exploitType];
  const travelFees = distanceKm > 0 ? distanceKm * 25 : 0; // 25 DA/km
  const timbreFiscal = 200;
  const subtotal = baseAmount + travelFees + timbreFiscal;
  const tva = Math.round(subtotal * 0.19);
  const total = subtotal + tva;

  return {
    baseAmount,
    travelFees,
    timbreFiscal,
    tva,
    total,
    breakdown: [
      { label_fr: 'Émoluments de base',    label_ar: 'الأتعاب الأساسية',       amount: baseAmount },
      { label_fr: `Frais de déplacement (${distanceKm} km)`, label_ar: `مصاريف التنقل (${distanceKm} كم)`, amount: travelFees },
      { label_fr: 'Timbre fiscal',          label_ar: 'الطابع الجبائي',          amount: timbreFiscal },
      { label_fr: 'TVA (19%)',              label_ar: 'الرسم على القيمة المضافة (19٪)', amount: tva },
    ],
  };
}

// ── CRUD Supabase ─────────────────────────────────────────────────────────────
export const bailiffService = {
  async getAll(userId: string, year?: number): Promise<BailiffExploit[]> {
    let query = supabase
      .from('bailiff_exploits')
      .select('*')
      .eq('user_id', userId)
      .order('sequence_number', { ascending: false });
    if (year) query = query.eq('exploit_year', year);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getNextNumber(userId: string): Promise<{ sequence_num: number; exploit_num: string }> {
    const year = new Date().getFullYear();
    const { data, error } = await supabase.rpc('get_next_exploit_number', {
      p_user_id: userId,
      p_year: year,
    });
    if (error) throw error;
    return data?.[0] || { sequence_num: 1, exploit_num: `E/${year}/0001` };
  },

  async create(userId: string, payload: Omit<BailiffExploit, 'id' | 'user_id' | 'exploit_number' | 'exploit_year' | 'sequence_number' | 'created_at' | 'updated_at'>): Promise<BailiffExploit> {
    const year = new Date().getFullYear();
    const { sequence_num, exploit_num } = await this.getNextNumber(userId);
    const { data, error } = await supabase
      .from('bailiff_exploits')
      .insert([{ user_id: userId, exploit_number: exploit_num, exploit_year: year, sequence_number: sequence_num, ...payload }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: ExploitStatus, details?: { execution_date?: string; failure_reason?: string }): Promise<void> {
    const { error } = await supabase
      .from('bailiff_exploits')
      .update({ status, ...details })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('bailiff_exploits').delete().eq('id', id);
    if (error) throw error;
  },

  async getStats(userId: string): Promise<{ total: number; executed: number; pending: number; failed: number; totalFees: number }> {
    const year = new Date().getFullYear();
    const { data, error } = await supabase
      .from('bailiff_exploits')
      .select('status, bailiff_fees, travel_fees')
      .eq('user_id', userId)
      .eq('exploit_year', year);
    if (error) throw error;
    const acts = data || [];
    return {
      total: acts.length,
      executed: acts.filter(a => a.status === 'executed').length,
      pending: acts.filter(a => a.status === 'pending').length,
      failed: acts.filter(a => a.status === 'failed').length,
      totalFees: acts.reduce((s, a) => s + (Number(a.bailiff_fees) || 0) + (Number(a.travel_fees) || 0), 0),
    };
  },
};
