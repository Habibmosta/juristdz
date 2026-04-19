import { useState, useEffect } from 'react';

interface SidebarStats {
  activeCases: number;
  pendingInvoices: number;
  todayEvents: number;
  loading: boolean;
}

export const useSidebarStats = (userId: string | null): SidebarStats => {
  const [stats, setStats] = useState<SidebarStats>({
    activeCases: 0,
    pendingInvoices: 0,
    todayEvents: 0,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setStats(s => ({ ...s, loading: false }));
      return undefined;
    }
    let cancelled = false;

    const load = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

        const [casesRes, invoicesRes, eventsRes] = await Promise.all([
          supabase.from('cases').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
          supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['pending', 'overdue']),
          supabase.from('calendar_events').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('start_time', startOfDay).lte('start_time', endOfDay),
        ]);

        if (!cancelled) {
          setStats({
            activeCases: casesRes.count ?? 0,
            pendingInvoices: invoicesRes.count ?? 0,
            todayEvents: eventsRes.count ?? 0,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) setStats(s => ({ ...s, loading: false }));
      }
    };

    load();
    // Refresh every 5 minutes
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [userId]);

  return stats;
};
