/**
 * Hook de notifications in-app
 * Agrège: délais urgents, factures impayées, rappels, nouveaux dossiers
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../../types';

export type NotifType = 'deadline' | 'invoice' | 'reminder' | 'case' | 'system';
export type NotifLevel = 'info' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  type: NotifType;
  level: NotifLevel;
  title: string;
  title_ar?: string;
  message: string;
  message_ar?: string;
  link_mode?: string;
  created_at: string;
  read: boolean;
}

const STORAGE_KEY = 'juristdz_read_notifs';

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function markRead(id: string) {
  const ids = getReadIds();
  ids.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function useNotifications(userId: string | null, role: UserRole | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const readIds = getReadIds();
    const notifs: AppNotification[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    try {
      // ── Délais légaux urgents ──────────────────────────────
      const { data: deadlines } = await supabase
        .from('legal_deadlines')
        .select('id, title, title_ar, deadline_date, status')
        .eq('user_id', userId)
        .in('status', ['urgent', 'overdue'])
        .order('deadline_date', { ascending: true })
        .limit(5);

      (deadlines || []).forEach(d => {
        const daysLeft = Math.ceil((new Date(d.deadline_date).getTime() - now.getTime()) / 86400000);
        notifs.push({
          id: `deadline_${d.id}`,
          type: 'deadline',
          level: d.status === 'overdue' ? 'error' : 'warning',
          title: d.status === 'overdue' ? 'Délai dépassé' : 'Délai urgent',
          title_ar: d.status === 'overdue' ? 'أجل منتهي' : 'أجل عاجل',
          message: d.status === 'overdue'
            ? `${d.title} — En retard de ${Math.abs(daysLeft)} jour(s)`
            : `${d.title} — ${daysLeft} jour(s) restant(s)`,
          message_ar: d.status === 'overdue'
            ? `${d.title_ar || d.title} — متأخر بـ ${Math.abs(daysLeft)} يوم`
            : `${d.title_ar || d.title} — ${daysLeft} يوم متبقي`,
          link_mode: 'DEADLINES',
          created_at: new Date().toISOString(),
          read: readIds.has(`deadline_${d.id}`),
        });
      });

      // ── Factures impayées (avocat/notaire/huissier) ────────
      if (role !== UserRole.ETUDIANT && role !== UserRole.MAGISTRAT) {
        const { data: invoices } = await supabase
          .from('invoices')
          .select('id, invoice_number, total_amount, due_date, client_id')
          .eq('user_id', userId)
          .eq('status', 'sent')
          .lt('due_date', todayStr)
          .limit(3);

        (invoices || []).forEach(inv => {
          notifs.push({
            id: `invoice_${inv.id}`,
            type: 'invoice',
            level: 'warning',
            title: 'Facture impayée',
            title_ar: 'فاتورة غير مدفوعة',
            message: `Facture ${inv.invoice_number} — ${inv.total_amount?.toLocaleString()} DA`,
            message_ar: `فاتورة ${inv.invoice_number} — ${inv.total_amount?.toLocaleString()} دج`,
            link_mode: 'BILLING',
            created_at: new Date().toISOString(),
            read: readIds.has(`invoice_${inv.id}`),
          });
        });
      }

      // ── Rappels du jour ────────────────────────────────────
      const { data: reminders } = await supabase
        .from('reminders')
        .select('id, title, reminder_date')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .lte('reminder_date', todayStr)
        .limit(3);

      (reminders || []).forEach(r => {
        notifs.push({
          id: `reminder_${r.id}`,
          type: 'reminder',
          level: 'info',
          title: 'Rappel',
          title_ar: 'تذكير',
          message: r.title,
          message_ar: r.title,
          link_mode: 'REMINDERS',
          created_at: new Date().toISOString(),
          read: readIds.has(`reminder_${r.id}`),
        });
      });

      // Trier: non-lus d'abord, puis par niveau
      notifs.sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        const lvl = { error: 0, warning: 1, info: 2 };
        return lvl[a.level] - lvl[b.level];
      });

      setNotifications(notifs);
    } catch (err) {
      console.error('useNotifications error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000); // refresh every 5min
    return () => clearInterval(interval);
  }, [load]);

  const markAsRead = useCallback((id: string) => {
    markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    notifications.forEach(n => markRead(n.id));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead, refresh: load };
}
