/**
 * Widget de rappels rapides — stockage localStorage, zéro SQL
 * Intégrable dans n'importe quel dashboard
 */
import React, { useState, useEffect } from 'react';
import { Bell, Plus, X, Check, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Language } from '../../../types';

interface Reminder {
  id: string;
  text: string;
  text_ar?: string;
  dueDate: string; // ISO date string
  priority: 'low' | 'medium' | 'high';
  done: boolean;
  createdAt: string;
}

interface Props {
  language: Language;
  userId: string;
  compact?: boolean; // mode compact pour sidebar
}

const PRIORITY_CONFIG = {
  high:   { color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',    dot: 'bg-red-500'    },
  medium: { color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  low:    { color: 'text-slate-400',  bg: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' },
};

export default function ReminderWidget({ language, userId, compact = false }: Props) {
  const isAr = language === 'ar';
  const storageKey = `juristdz_reminders_${userId}`;

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [form, setForm] = useState({ text: '', dueDate: '', priority: 'medium' as Reminder['priority'] });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setReminders(JSON.parse(stored));
    } catch {}
  }, [storageKey]);

  const save = (updated: Reminder[]) => {
    setReminders(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const addReminder = () => {
    if (!form.text.trim() || !form.dueDate) return;
    const newReminder: Reminder = {
      id: Date.now().toString(),
      text: form.text.trim(),
      dueDate: form.dueDate,
      priority: form.priority,
      done: false,
      createdAt: new Date().toISOString(),
    };
    save([newReminder, ...reminders]);
    setForm({ text: '', dueDate: '', priority: 'medium' });
    setShowForm(false);
  };

  const toggleDone = (id: string) => {
    save(reminders.map(r => r.id === id ? { ...r, done: !r.done } : r));
  };

  const deleteReminder = (id: string) => {
    save(reminders.filter(r => r.id !== id));
  };

  const getDaysLeft = (dueDate: string): number => {
    const due = new Date(dueDate);
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const pending = reminders.filter(r => !r.done).sort((a, b) => {
    // Sort by priority then date
    const pOrder = { high: 0, medium: 1, low: 2 };
    if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
  const done = reminders.filter(r => r.done).slice(0, 3);
  const overdueCount = pending.filter(r => getDaysLeft(r.dueDate) < 0).length;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm ${compact ? '' : 'border-slate-200'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-legal-gold" />
          <h3 className="font-bold text-sm">
            {isAr ? 'التذكيرات' : 'Rappels'}
          </h3>
          {overdueCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {overdueCount}
            </span>
          )}
          {pending.length > 0 && overdueCount === 0 && (
            <span className="bg-legal-gold text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-legal-gold transition-colors"
            title={isAr ? 'إضافة تذكير' : 'Ajouter un rappel'}
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3">
          {/* Add form */}
          {showForm && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 space-y-2">
              <input
                type="text"
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                placeholder={isAr ? 'نص التذكير...' : 'Texte du rappel...'}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-legal-gold"
                onKeyDown={e => e.key === 'Enter' && addReminder()}
                autoFocus
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-legal-gold"
                />
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as Reminder['priority'] }))}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-sm outline-none"
                >
                  <option value="high">{isAr ? '🔴 عاجل' : '🔴 Urgent'}</option>
                  <option value="medium">{isAr ? '🟡 متوسط' : '🟡 Moyen'}</option>
                  <option value="low">{isAr ? '⚪ منخفض' : '⚪ Faible'}</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addReminder}
                  disabled={!form.text.trim() || !form.dueDate}
                  className="flex-1 py-1.5 bg-legal-gold text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-legal-gold/90 transition-colors"
                >
                  {isAr ? 'إضافة' : 'Ajouter'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-sm transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
              </div>
            </div>
          )}

          {/* Pending reminders */}
          {pending.length === 0 && !showForm && (
            <div className="text-center py-4 text-slate-400 text-sm">
              <Bell size={24} className="mx-auto mb-2 opacity-30" />
              {isAr ? 'لا توجد تذكيرات' : 'Aucun rappel'}
            </div>
          )}

          {pending.map(r => {
            const days = getDaysLeft(r.dueDate);
            const cfg = PRIORITY_CONFIG[r.priority];
            const isOverdue = days < 0;
            const isToday = days === 0;
            return (
              <div key={r.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${cfg.bg}`}>
                <button
                  onClick={() => toggleDone(r.id)}
                  className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    r.done ? 'bg-green-500 border-green-500' : `border-current ${cfg.color}`
                  }`}
                >
                  {r.done && <Check size={10} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{r.text}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock size={10} className={isOverdue ? 'text-red-500' : isToday ? 'text-amber-500' : 'text-slate-400'} />
                    <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : isToday ? 'text-amber-500' : 'text-slate-400'}`}>
                      {isOverdue
                        ? (isAr ? `متأخر ${Math.abs(days)} يوم` : `En retard ${Math.abs(days)}j`)
                        : isToday
                        ? (isAr ? 'اليوم' : "Aujourd'hui")
                        : (isAr ? `${days} يوم` : `${days}j`)}
                    </span>
                    {isOverdue && <AlertTriangle size={10} className="text-red-500" />}
                  </div>
                </div>
                <button
                  onClick={() => deleteReminder(r.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}

          {/* Done (collapsed) */}
          {done.length > 0 && (
            <div className="pt-2 border-t dark:border-slate-800">
              <p className="text-xs text-slate-400 mb-2">{isAr ? 'مكتمل' : 'Terminés'}</p>
              {done.map(r => (
                <div key={r.id} className="flex items-center gap-2 py-1 opacity-50">
                  <button onClick={() => toggleDone(r.id)} className="w-4 h-4 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check size={10} className="text-white" />
                  </button>
                  <span className="text-xs text-slate-500 line-through truncate flex-1">{r.text}</span>
                  <button onClick={() => deleteReminder(r.id)} className="text-slate-300 hover:text-red-400">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
