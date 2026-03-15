import { supabase } from '../lib/supabase';

export type DeadlineCategory =
  | 'appel' | 'cassation' | 'opposition' | 'prescription'
  | 'signification' | 'execution' | 'administratif' | 'penal' | 'custom';

export type DeadlineStatus = 'upcoming' | 'urgent' | 'overdue' | 'completed';
export type DeadlinePriority = 'low' | 'medium' | 'high' | 'critical';

export interface LegalDeadline {
  id: string;
  user_id: string;
  case_id?: string;
  case_title?: string;
  title: string;
  title_ar?: string;
  description?: string;
  category: DeadlineCategory;
  base_date: string;          // Date de départ (jugement, signification...)
  deadline_date: string;      // Date limite calculée
  days_total: number;         // Durée légale en jours
  days_remaining: number;     // Jours restants (calculé)
  status: DeadlineStatus;
  priority: DeadlinePriority;
  legal_reference?: string;   // Ex: "Art. 323 CPC"
  notes?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// ─── Délais légaux algériens (source: CPC, CPP, Code Civil) ───────────────────
export const ALGERIAN_LEGAL_DEADLINES = {
  // Code de Procédure Civile et Administrative (CPCA)
  appel_jugement: {
    days: 30,
    label_fr: 'Appel — Jugement contradictoire',
    label_ar: 'استئناف — حكم حضوري',
    reference: 'Art. 323 CPCA',
    category: 'appel' as DeadlineCategory,
    priority: 'critical' as DeadlinePriority,
  },
  appel_jugement_defaut: {
    days: 30,
    label_fr: 'Appel — Jugement par défaut',
    label_ar: 'استئناف — حكم غيابي',
    reference: 'Art. 323 CPCA',
    category: 'appel' as DeadlineCategory,
    priority: 'critical' as DeadlinePriority,
  },
  opposition_jugement: {
    days: 15,
    label_fr: 'Opposition — Jugement par défaut',
    label_ar: 'معارضة — حكم غيابي',
    reference: 'Art. 317 CPCA',
    category: 'opposition' as DeadlineCategory,
    priority: 'critical' as DeadlinePriority,
  },
  pourvoi_cassation: {
    days: 60,
    label_fr: 'Pourvoi en Cassation',
    label_ar: 'طعن بالنقض',
    reference: 'Art. 349 CPCA',
    category: 'cassation' as DeadlineCategory,
    priority: 'critical' as DeadlinePriority,
  },
  signification_jugement: {
    days: 3,
    label_fr: 'Signification du jugement (délai huissier)',
    label_ar: 'تبليغ الحكم',
    reference: 'Art. 406 CPCA',
    category: 'signification' as DeadlineCategory,
    priority: 'high' as DeadlinePriority,
  },
  execution_jugement: {
    days: 30,
    label_fr: 'Mise en exécution du jugement',
    label_ar: 'تنفيذ الحكم',
    reference: 'Art. 600 CPCA',
    category: 'execution' as DeadlineCategory,
    priority: 'high' as DeadlinePriority,
  },
  // Prescription civile (Code Civil)
  prescription_droit_commun: {
    days: 3650, // 10 ans
    label_fr: 'Prescription — Droit commun (10 ans)',
    label_ar: 'تقادم — القانون العام (10 سنوات)',
    reference: 'Art. 308 C.Civ',
    category: 'prescription' as DeadlineCategory,
    priority: 'medium' as DeadlinePriority,
  },
  prescription_commerciale: {
    days: 1825, // 5 ans
    label_fr: 'Prescription — Commerciale (5 ans)',
    label_ar: 'تقادم — تجاري (5 سنوات)',
    reference: 'Art. 29 C.Com',
    category: 'prescription' as DeadlineCategory,
    priority: 'medium' as DeadlinePriority,
  },
  prescription_responsabilite: {
    days: 1095, // 3 ans
    label_fr: 'Prescription — Responsabilité civile (3 ans)',
    label_ar: 'تقادم — المسؤولية المدنية (3 سنوات)',
    reference: 'Art. 133 C.Civ',
    category: 'prescription' as DeadlineCategory,
    priority: 'medium' as DeadlinePriority,
  },
  prescription_travail: {
    days: 730, // 2 ans
    label_fr: 'Prescription — Droit du travail (2 ans)',
    label_ar: 'تقادم — قانون العمل (سنتان)',
    reference: 'Art. 73 Loi 90-11',
    category: 'prescription' as DeadlineCategory,
    priority: 'medium' as DeadlinePriority,
  },
  // Pénal (CPP)
  appel_penal_correctionnel: {
    days: 10,
    label_fr: 'Appel pénal — Correctionnel',
    label_ar: 'استئناف جزائي — جنحي',
    reference: 'Art. 418 CPP',
    category: 'penal' as DeadlineCategory,
    priority: 'critical' as DeadlinePriority,
  },
  appel_penal_criminel: {
    days: 10,
    label_fr: 'Appel pénal — Criminel',
    label_ar: 'استئناف جزائي — جنائي',
    reference: 'Art. 418 CPP',
    category: 'penal' as DeadlineCategory,
    priority: 'critical' as DeadlinePriority,
  },
  pourvoi_cassation_penal: {
    days: 8,
    label_fr: 'Pourvoi en Cassation — Pénal',
    label_ar: 'طعن بالنقض — جزائي',
    reference: 'Art. 495 CPP',
    category: 'penal' as DeadlineCategory,
    priority: 'critical' as DeadlinePriority,
  },
  // Administratif
  recours_administratif: {
    days: 30,
    label_fr: 'Recours administratif préalable',
    label_ar: 'طعن إداري مسبق',
    reference: 'Art. 830 CPCA',
    category: 'administratif' as DeadlineCategory,
    priority: 'high' as DeadlinePriority,
  },
  appel_administratif: {
    days: 30,
    label_fr: 'Appel — Tribunal Administratif',
    label_ar: 'استئناف — المحكمة الإدارية',
    reference: 'Art. 902 CPCA',
    category: 'administratif' as DeadlineCategory,
    priority: 'critical' as DeadlinePriority,
  },
  pourvoi_conseil_etat: {
    days: 60,
    label_fr: 'Pourvoi — Conseil d\'État',
    label_ar: 'طعن — مجلس الدولة',
    reference: 'Art. 920 CPCA',
    category: 'administratif' as DeadlineCategory,
    priority: 'critical' as DeadlinePriority,
  },
};

// ─── Calcul de la date limite (jours ouvrables ou calendaires) ────────────────
export function calculateDeadlineDate(baseDate: Date, days: number, workingDaysOnly = false): Date {
  const result = new Date(baseDate);
  if (!workingDaysOnly) {
    result.setDate(result.getDate() + days);
    return result;
  }
  // Jours ouvrables (lundi-jeudi en Algérie, vendredi = demi-journée)
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 5 && day !== 6) added++; // Exclure vendredi et samedi
  }
  return result;
}

export function getDaysRemaining(deadlineDate: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dl = new Date(deadlineDate);
  dl.setHours(0, 0, 0, 0);
  return Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDeadlineStatus(daysRemaining: number, isCompleted: boolean): DeadlineStatus {
  if (isCompleted) return 'completed';
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 3) return 'urgent';
  return 'upcoming';
}

export function getDeadlinePriorityFromDays(daysRemaining: number): DeadlinePriority {
  if (daysRemaining < 0) return 'critical';
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 7) return 'high';
  if (daysRemaining <= 30) return 'medium';
  return 'low';
}

// ─── Service CRUD ─────────────────────────────────────────────────────────────
export const legalDeadlineService = {
  async getAll(userId: string): Promise<LegalDeadline[]> {
    const { data, error } = await supabase
      .from('legal_deadlines')
      .select('*, cases(case_number, title)')
      .eq('user_id', userId)
      .order('deadline_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => {
      const daysRemaining = getDaysRemaining(new Date(row.deadline_date));
      return {
        ...row,
        case_title: row.cases ? `${row.cases.case_number} — ${row.cases.title}` : undefined,
        days_remaining: daysRemaining,
        status: getDeadlineStatus(daysRemaining, row.is_completed),
      };
    });
  },

  async create(userId: string, payload: {
    title: string;
    title_ar?: string;
    description?: string;
    category: DeadlineCategory;
    base_date: string;
    days_total: number;
    legal_reference?: string;
    notes?: string;
    case_id?: string;
    priority: DeadlinePriority;
  }): Promise<LegalDeadline> {
    const deadlineDate = calculateDeadlineDate(new Date(payload.base_date), payload.days_total);

    const { data, error } = await supabase
      .from('legal_deadlines')
      .insert([{
        user_id: userId,
        case_id: payload.case_id || null,
        title: payload.title,
        title_ar: payload.title_ar || null,
        description: payload.description || null,
        category: payload.category,
        base_date: payload.base_date,
        deadline_date: deadlineDate.toISOString().split('T')[0],
        days_total: payload.days_total,
        legal_reference: payload.legal_reference || null,
        notes: payload.notes || null,
        priority: payload.priority,
        is_completed: false,
      }])
      .select()
      .single();

    if (error) throw error;
    const daysRemaining = getDaysRemaining(new Date(data.deadline_date));
    return { ...data, days_remaining: daysRemaining, status: getDeadlineStatus(daysRemaining, false) };
  },

  async markCompleted(id: string): Promise<void> {
    const { error } = await supabase
      .from('legal_deadlines')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('legal_deadlines').delete().eq('id', id);
    if (error) throw error;
  },

  async getUpcoming(userId: string, days = 7): Promise<LegalDeadline[]> {
    const limit = new Date();
    limit.setDate(limit.getDate() + days);
    const { data, error } = await supabase
      .from('legal_deadlines')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .lte('deadline_date', limit.toISOString().split('T')[0])
      .order('deadline_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(row => {
      const daysRemaining = getDaysRemaining(new Date(row.deadline_date));
      return { ...row, days_remaining: daysRemaining, status: getDeadlineStatus(daysRemaining, false) };
    });
  },
};
