/**
 * Hook unifié pour les données du dashboard
 * Agrège: cases, legal_deadlines, notarial_acts, bailiff_exploits, invoices, time_entries
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../../types';
import { legalDeadlineService } from '../services/legalDeadlineService';

export interface DashboardData {
  // Commun
  urgentDeadlines: number;
  overdueDeadlines: number;
  upcomingDeadlines: { title: string; title_ar?: string; deadline_date: string; days_remaining: number; status: string }[];

  // Avocat
  activeCases: number;
  totalCases: number;
  urgentCases: number;
  recentCases: { id: string; title: string; clientName: string; status: string; priority?: string; createdAt: string }[];
  monthlyRevenue: number;
  billableHours: number;

  // Notaire
  notarialActsTotal: number;
  notarialActsMonth: number;
  notarialActsValue: number;
  notarialActsByStatus: Record<string, number>;
  recentNotarialActs: { id: string; act_number: string; act_type: string; party_last_name: string; party_first_name: string; act_date: string; status: string; act_value?: number }[];

  // Huissier
  exploitsTotal: number;
  exploitsMonth: number;
  exploitsPending: number;
  exploitsExecuted: number;
  exploitsFailed: number;
  exploitsTotalFees: number;
  recentExploits: { id: string; exploit_number: string; exploit_type: string; recipient_name: string; requester_name: string; exploit_date: string; status: string }[];

  loading: boolean;
}

const EMPTY: DashboardData = {
  urgentDeadlines: 0, overdueDeadlines: 0, upcomingDeadlines: [],
  activeCases: 0, totalCases: 0, urgentCases: 0, recentCases: [], monthlyRevenue: 0, billableHours: 0,
  notarialActsTotal: 0, notarialActsMonth: 0, notarialActsValue: 0, notarialActsByStatus: {}, recentNotarialActs: [],
  exploitsTotal: 0, exploitsMonth: 0, exploitsPending: 0, exploitsExecuted: 0, exploitsFailed: 0, exploitsTotalFees: 0, recentExploits: [],
  loading: true,
};

export function useDashboardData(userId: string | null, role: UserRole | null): DashboardData {
  const [data, setData] = useState<DashboardData>(EMPTY);

  const load = useCallback(async () => {
    if (!userId) { setData({ ...EMPTY, loading: false }); return; }

    try {
      const year = new Date().getFullYear();
      const monthStart = new Date(year, new Date().getMonth(), 1).toISOString().split('T')[0];

      // ── Délais urgents (tous rôles concernés) ──────────────────────────────
      const deadlinesPromise = legalDeadlineService.getUpcoming(userId, 7).catch(() => []);

      // ── Cases (Avocat, Magistrat, Juriste) ────────────────────────────────
      const casesPromise = (role === UserRole.AVOCAT || role === UserRole.MAGISTRAT || role === UserRole.JURISTE_ENTREPRISE)
        ? supabase.from('cases').select('id,title,client_name,status,priority,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
        : Promise.resolve({ data: [], error: null });

      // ── Actes notariés (Notaire) ───────────────────────────────────────────
      const notarialPromise = role === UserRole.NOTAIRE
        ? supabase.from('notarial_acts').select('id,act_number,act_type,party_last_name,party_first_name,act_date,status,act_value,act_year').eq('user_id', userId).order('sequence_number', { ascending: false }).limit(50)
        : Promise.resolve({ data: [], error: null });

      // ── Exploits huissier ─────────────────────────────────────────────────
      const exploitsPromise = role === UserRole.HUISSIER
        ? supabase.from('bailiff_exploits').select('id,exploit_number,exploit_type,recipient_name,requester_name,exploit_date,status,bailiff_fees,travel_fees,exploit_year').eq('user_id', userId).order('sequence_number', { ascending: false }).limit(50)
        : Promise.resolve({ data: [], error: null });

      // ── Heures facturables (semaine en cours) ─────────────────────────────
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const timePromise = supabase
        .from('time_entries')
        .select('duration_minutes')
        .eq('user_id', userId)
        .eq('is_billable', true)
        .gte('start_time', weekStart.toISOString())
        .not('duration_minutes', 'is', null);

      const [deadlines, casesRes, notarialRes, exploitsRes, timeRes] = await Promise.all([
        deadlinesPromise, casesPromise, notarialPromise, exploitsPromise, timePromise,
      ]);

      // Process deadlines
      const urgentDeadlines = deadlines.filter(d => d.status === 'urgent').length;
      const overdueDeadlines = deadlines.filter(d => d.status === 'overdue').length;
      const upcomingDeadlines = deadlines.slice(0, 5).map(d => ({
        title: d.title, title_ar: d.title_ar, deadline_date: d.deadline_date,
        days_remaining: d.days_remaining, status: d.status,
      }));

      // Process cases
      const cases = casesRes.data || [];
      const activeCases = cases.filter((c: any) => c.status === 'active').length;
      const urgentCases = cases.filter((c: any) => c.priority === 'urgent' || c.priority === 'high').length;
      const recentCases = cases.slice(0, 5).map((c: any) => ({
        id: c.id, title: c.title, clientName: c.client_name,
        status: c.status, priority: c.priority, createdAt: c.created_at,
      }));

      // Process notarial acts
      const acts = notarialRes.data || [];
      const actsThisYear = acts.filter((a: any) => a.act_year === year);
      const actsThisMonth = acts.filter((a: any) => a.act_date >= monthStart);
      const notarialActsByStatus: Record<string, number> = {};
      let notarialActsValue = 0;
      actsThisYear.forEach((a: any) => {
        notarialActsByStatus[a.status] = (notarialActsByStatus[a.status] || 0) + 1;
        if (a.act_value) notarialActsValue += Number(a.act_value);
      });

      // Process exploits
      const exploits = exploitsRes.data || [];
      const exploitsThisYear = exploits.filter((e: any) => e.exploit_year === year);
      const exploitsThisMonth = exploits.filter((e: any) => e.exploit_date >= monthStart);
      let exploitsTotalFees = 0;
      exploitsThisYear.forEach((e: any) => {
        exploitsTotalFees += (Number(e.bailiff_fees) || 0) + (Number(e.travel_fees) || 0);
      });

      setData({
        urgentDeadlines, overdueDeadlines, upcomingDeadlines,
        activeCases, totalCases: cases.length, urgentCases, recentCases, monthlyRevenue: 0,
        billableHours: Math.round((timeRes.data || []).reduce((s: number, e: any) => s + (e.duration_minutes || 0), 0) / 60),
        notarialActsTotal: actsThisYear.length,
        notarialActsMonth: actsThisMonth.length,
        notarialActsValue,
        notarialActsByStatus,
        recentNotarialActs: acts.slice(0, 5),
        exploitsTotal: exploitsThisYear.length,
        exploitsMonth: exploitsThisMonth.length,
        exploitsPending: exploitsThisYear.filter((e: any) => e.status === 'pending').length,
        exploitsExecuted: exploitsThisYear.filter((e: any) => e.status === 'executed').length,
        exploitsFailed: exploitsThisYear.filter((e: any) => e.status === 'failed').length,
        exploitsTotalFees,
        recentExploits: exploits.slice(0, 5),
        loading: false,
      });
    } catch (err) {
      console.error('useDashboardData error:', err);
      setData({ ...EMPTY, loading: false });
    }
  }, [userId, role]);

  useEffect(() => { load(); }, [load]);

  return data;
}
