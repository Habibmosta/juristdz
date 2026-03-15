import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Language } from '../../../types';
import { ChevronLeft, ChevronRight, Clock, DollarSign, TrendingUp } from 'lucide-react';

interface WeeklyTimeReportProps {
  userId: string;
  language: Language;
}

interface DayEntry {
  date: string;
  label: string;
  totalMinutes: number;
  billableMinutes: number;
  amount: number;
  entries: { description: string; duration_minutes: number; is_billable: boolean; case_name?: string }[];
}

const WeeklyTimeReport: React.FC<WeeklyTimeReportProps> = ({ userId, language }) => {
  const isAr = language === 'ar';
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const [days, setDays] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const getWeekBounds = (offset: number) => {
    const now = new Date();
    // Algerian week starts Friday (5), but we'll use Mon-Sun for display
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
  };

  useEffect(() => {
    loadWeek();
  }, [userId, weekOffset]);

  const loadWeek = async () => {
    setLoading(true);
    try {
      const { monday, sunday } = getWeekBounds(weekOffset);

      const { data } = await supabase
        .from('time_entries')
        .select('start_time, duration_minutes, is_billable, hourly_rate, description, cases(title)')
        .eq('user_id', userId)
        .gte('start_time', monday.toISOString())
        .lte('start_time', sunday.toISOString())
        .not('duration_minutes', 'is', null)
        .order('start_time');

      // Build 7-day structure
      const dayMap: Record<string, DayEntry> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const key = d.toISOString().split('T')[0];
        dayMap[key] = {
          date: key,
          label: d.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', { weekday: 'short', day: 'numeric' }),
          totalMinutes: 0,
          billableMinutes: 0,
          amount: 0,
          entries: [],
        };
      }

      (data || []).forEach((e: any) => {
        const key = e.start_time.split('T')[0];
        if (!dayMap[key]) return;
        const mins = e.duration_minutes || 0;
        dayMap[key].totalMinutes += mins;
        if (e.is_billable) {
          dayMap[key].billableMinutes += mins;
          dayMap[key].amount += (mins / 60) * (e.hourly_rate || 0);
        }
        dayMap[key].entries.push({
          description: e.description,
          duration_minutes: mins,
          is_billable: e.is_billable,
          case_name: e.cases?.title,
        });
      });

      setDays(Object.values(dayMap));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? m + 'm' : ''}` : `${m}m`;
  };

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(n);

  const totalMins = days.reduce((s, d) => s + d.totalMinutes, 0);
  const billableMins = days.reduce((s, d) => s + d.billableMinutes, 0);
  const totalAmount = days.reduce((s, d) => s + d.amount, 0);
  const maxMins = Math.max(...days.map(d => d.totalMinutes), 1);

  const { monday, sunday } = getWeekBounds(weekOffset);
  const weekLabel = `${monday.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className={`space-y-6 ${isAr ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-legal-gold" />
          {isAr ? 'تقرير الأسبوع' : 'Rapport Hebdomadaire'}
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(p => p - 1)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          </button>
          <span className="text-sm text-slate-300 min-w-[180px] text-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset(p => p + 1)} disabled={weekOffset >= 0} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-40">
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
          {weekOffset < 0 && (
            <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-xs bg-legal-gold text-white rounded-lg">
              {isAr ? 'الأسبوع الحالي' : 'Semaine actuelle'}
            </button>
          )}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">{isAr ? 'إجمالي الوقت' : 'Total temps'}</span>
          </div>
          <p className="text-2xl font-bold text-white">{fmt(totalMins)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400">{isAr ? 'قابل للفوترة' : 'Facturable'}</span>
          </div>
          <p className="text-2xl font-bold text-white">{fmt(billableMins)}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalMins > 0 ? Math.round((billableMins / totalMins) * 100) : 0}%
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-legal-gold" />
            <span className="text-xs text-slate-400">{isAr ? 'المبلغ' : 'Montant'}</span>
          </div>
          <p className="text-2xl font-bold text-legal-gold">{fmtMoney(totalAmount)}</p>
        </div>
      </div>

      {/* Bar chart by day */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-gold" />
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <div className="flex items-end gap-3 h-32">
            {days.map((day, i) => {
              const heightPct = (day.totalMinutes / maxMins) * 100;
              const billablePct = day.totalMinutes > 0 ? (day.billableMinutes / day.totalMinutes) * 100 : 0;
              const isToday = day.date === new Date().toISOString().split('T')[0];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: '96px' }}>
                    {day.totalMinutes > 0 ? (
                      <div
                        className={`w-full rounded-t-md relative overflow-hidden ${isToday ? 'ring-2 ring-legal-gold' : ''}`}
                        style={{ height: `${Math.max(heightPct, 4)}%`, backgroundColor: '#334155' }}
                        title={`${day.label}: ${fmt(day.totalMinutes)}`}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-legal-gold/70 rounded-t-md"
                          style={{ height: `${billablePct}%` }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-1 bg-slate-700 rounded" />
                    )}
                  </div>
                  <span className={`text-xs ${isToday ? 'text-legal-gold font-bold' : 'text-slate-500'}`}>
                    {day.label}
                  </span>
                  {day.totalMinutes > 0 && (
                    <span className="text-xs text-slate-400">{fmt(day.totalMinutes)}</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-legal-gold/70 inline-block" />{isAr ? 'قابل للفوترة' : 'Facturable'}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-600 inline-block" />{isAr ? 'غير قابل' : 'Non facturable'}</span>
          </div>
        </div>
      )}

      {/* Day details */}
      <div className="space-y-3">
        {days.filter(d => d.entries.length > 0).map((day, i) => (
          <div key={i} className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50">
              <span className="font-semibold text-slate-200 text-sm">{day.label}</span>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{fmt(day.totalMinutes)}</span>
                {day.amount > 0 && <span className="text-legal-gold">{fmtMoney(day.amount)}</span>}
              </div>
            </div>
            <div className="divide-y divide-slate-700/30">
              {day.entries.map((e, j) => (
                <div key={j} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm text-slate-300">{e.description}</p>
                    {e.case_name && <p className="text-xs text-slate-500 mt-0.5">📁 {e.case_name}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">{fmt(e.duration_minutes)}</span>
                    {e.is_billable && <span className="text-green-400">●</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!loading && days.every(d => d.entries.length === 0) && (
          <div className="text-center py-10 text-slate-500">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">{isAr ? 'لا توجد إدخالات هذا الأسبوع' : 'Aucune entrée cette semaine'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyTimeReport;
