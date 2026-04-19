import React, { useState, useEffect } from 'react';
import { Activity, FileText, Users, DollarSign, Calendar, Clock } from 'lucide-react';
import type { Language } from '@/types';

interface ActivityItem {
  id: string;
  type: 'case' | 'client' | 'invoice' | 'event' | 'document';
  label: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

interface RecentActivityWidgetProps {
  userId: string;
  language: Language;
}

const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({ userId, language }) => {
  const isAr = language === 'ar';
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [userId]);

  const load = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');

      const [casesRes, clientsRes, invoicesRes] = await Promise.all([
        supabase.from('cases').select('id, title, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(3),
        supabase.from('clients').select('id, first_name, last_name, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(2),
        supabase.from('invoices').select('id, invoice_number, total_amount, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(2),
      ]);

      const activity: ActivityItem[] = [];

      (casesRes.data || []).forEach(c => activity.push({
        id: c.id, type: 'case',
        label: c.title || (isAr ? 'ملف' : 'Dossier'),
        time: c.updated_at,
        icon: <FileText size={13} />, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      }));

      (clientsRes.data || []).forEach(c => activity.push({
        id: c.id, type: 'client',
        label: `${c.first_name} ${c.last_name}`,
        time: c.created_at,
        icon: <Users size={13} />, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
      }));

      (invoicesRes.data || []).forEach(inv => activity.push({
        id: inv.id, type: 'invoice',
        label: `${inv.invoice_number} — ${(inv.total_amount || 0).toLocaleString()} DA`,
        time: inv.updated_at,
        icon: <DollarSign size={13} />, color: 'text-green-500 bg-green-50 dark:bg-green-900/20',
      }));

      // Sort by time desc
      activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setItems(activity.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (isoDate: string) => {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return isAr ? `منذ ${days} يوم` : `il y a ${days}j`;
    if (hours > 0) return isAr ? `منذ ${hours} ساعة` : `il y a ${hours}h`;
    if (mins > 0) return isAr ? `منذ ${mins} دقيقة` : `il y a ${mins}min`;
    return isAr ? 'الآن' : 'à l\'instant';
  };

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-300">
        <Activity size={15} className="text-legal-gold" />
        {isAr ? 'النشاط الأخير' : 'Activité Récente'}
      </h3>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{item.label}</p>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
              <Clock size={9} />
              {formatRelativeTime(item.time)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivityWidget;
