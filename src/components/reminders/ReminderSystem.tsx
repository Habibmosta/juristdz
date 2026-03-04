import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { 
  Bell, Plus, Clock, CheckCircle, X, Calendar, AlertCircle,
  Repeat, Trash2, Edit2, Filter, Search
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Reminder {
  id: string;
  user_id: string;
  case_id?: string;
  title: string;
  description?: string;
  reminder_date: string;
  is_completed: boolean;
  is_recurring: boolean;
  recurrence_pattern?: string;
  completed_at?: string;
  created_at: string;
}

interface ReminderSystemProps {
  language: Language;
  userId: string;
  caseId?: string; // Optional: filter by case
  compact?: boolean; // For dashboard widget
}

const ReminderSystem: React.FC<ReminderSystemProps> = ({ 
  language, 
  userId, 
  caseId,
  compact = false 
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('pending');
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    reminder_date: '',
    is_recurring: false,
    recurrence_pattern: 'daily'
  });
  const isAr = language === 'ar';

  useEffect(() => {
    loadReminders();
    
    // Check for due reminders every minute
    const interval = setInterval(checkDueReminders, 60000);
    return () => clearInterval(interval);
  }, [userId, caseId]);

  useEffect(() => {
    applyFilters();
  }, [reminders, searchTerm, filterStatus]);

  const loadReminders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('reminder_date', { ascending: true });

      if (caseId) {
        query = query.eq('case_id', caseId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reminders];

    // Status filter
    if (filterStatus === 'pending') {
      filtered = filtered.filter(r => !r.is_completed);
    } else if (filterStatus === 'completed') {
      filtered = filtered.filter(r => r.is_completed);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReminders(filtered);
  };

  const checkDueReminders = () => {
    const now = new Date();
    reminders.forEach(reminder => {
      if (!reminder.is_completed) {
        const reminderDate = new Date(reminder.reminder_date);
        if (reminderDate <= now) {
          showNotification(reminder);
        }
      }
    });
  };

  const showNotification = (reminder: Reminder) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('JuristDZ - Rappel', {
        body: reminder.title,
        icon: '/logo.png',
        badge: '/logo.png'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.title.trim() || !newReminder.reminder_date) return;

    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert([{
          user_id: userId,
          case_id: caseId || null,
          title: newReminder.title,
          description: newReminder.description,
          reminder_date: newReminder.reminder_date,
          is_recurring: newReminder.is_recurring,
          recurrence_pattern: newReminder.is_recurring ? newReminder.recurrence_pattern : null,
          is_completed: false
        }])
        .select()
        .single();

      if (error) throw error;

      setReminders(prev => [...prev, data]);
      setShowAddModal(false);
      setNewReminder({
        title: '',
        description: '',
        reminder_date: '',
        is_recurring: false,
        recurrence_pattern: 'daily'
      });

      // Request notification permission if not already granted
      requestNotificationPermission();
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
  };

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ 
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', reminderId);

      if (error) throw error;

      setReminders(prev => prev.map(r => 
        r.id === reminderId 
          ? { ...r, is_completed: true, completed_at: new Date().toISOString() }
          : r
      ));
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا التذكير؟' : 'Êtes-vous sûr de supprimer ce rappel ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) {
      return isAr ? 'متأخر' : 'En retard';
    }
    if (diffMins < 60) return isAr ? `خلال ${diffMins} دقيقة` : `Dans ${diffMins} min`;
    if (diffHours < 24) return isAr ? `خلال ${diffHours} ساعة` : `Dans ${diffHours}h`;
    if (diffDays < 7) return isAr ? `خلال ${diffDays} يوم` : `Dans ${diffDays}j`;
    
    return date.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const upcomingReminders = filteredReminders.filter(r => !r.is_completed).slice(0, compact ? 5 : undefined);
  const overdueCount = reminders.filter(r => !r.is_completed && isOverdue(r.reminder_date)).length;

  if (compact) {
    // Compact widget for dashboard
    return (
      <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Bell size={18} className="text-legal-gold" />
            {isAr ? 'التذكيرات' : 'Rappels'}
            {overdueCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {overdueCount}
              </span>
            )}
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {upcomingReminders.length > 0 ? (
          <div className="space-y-2">
            {upcomingReminders.map(reminder => (
              <div
                key={reminder.id}
                className={`p-3 rounded-xl border transition-colors ${
                  isOverdue(reminder.reminder_date)
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleCompleteReminder(reminder.id)}
                    className="mt-0.5 p-1 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    <CheckCircle size={16} className="text-slate-400" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{reminder.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={12} className={isOverdue(reminder.reminder_date) ? 'text-red-500' : 'text-slate-400'} />
                      <span className={`text-xs ${isOverdue(reminder.reminder_date) ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                        {formatDate(reminder.reminder_date)}
                      </span>
                      {reminder.is_recurring && (
                        <Repeat size={12} className="text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-sm">
            <Bell size={32} className="mx-auto mb-2 opacity-20" />
            <p>{isAr ? 'لا توجد تذكيرات' : 'Aucun rappel'}</p>
          </div>
        )}

        {/* Add Reminder Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">{isAr ? 'تذكير جديد' : 'Nouveau Rappel'}</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{isAr ? 'العنوان' : 'Titre'}</label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    placeholder={isAr ? 'عنوان التذكير...' : 'Titre du rappel...'}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{isAr ? 'التاريخ والوقت' : 'Date et Heure'}</label>
                  <input
                    type="datetime-local"
                    value={newReminder.reminder_date}
                    onChange={(e) => setNewReminder({ ...newReminder, reminder_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{isAr ? 'الوصف' : 'Description'}</label>
                  <textarea
                    value={newReminder.description}
                    onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                    placeholder={isAr ? 'وصف التذكير...' : 'Description du rappel...'}
                    rows={2}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-gold resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={newReminder.is_recurring}
                    onChange={(e) => setNewReminder({ ...newReminder, is_recurring: e.target.checked })}
                    className="w-4 h-4 text-legal-gold focus:ring-legal-gold rounded"
                  />
                  <label htmlFor="recurring" className="text-sm font-medium">
                    {isAr ? 'تذكير متكرر' : 'Rappel récurrent'}
                  </label>
                </div>

                {newReminder.is_recurring && (
                  <div>
                    <label className="block text-sm font-medium mb-2">{isAr ? 'التكرار' : 'Récurrence'}</label>
                    <select
                      value={newReminder.recurrence_pattern}
                      onChange={(e) => setNewReminder({ ...newReminder, recurrence_pattern: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-gold"
                    >
                      <option value="daily">{isAr ? 'يومي' : 'Quotidien'}</option>
                      <option value="weekly">{isAr ? 'أسبوعي' : 'Hebdomadaire'}</option>
                      <option value="monthly">{isAr ? 'شهري' : 'Mensuel'}</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {isAr ? 'إلغاء' : 'Annuler'}
                  </button>
                  <button
                    onClick={handleAddReminder}
                    disabled={!newReminder.title.trim() || !newReminder.reminder_date}
                    className="flex-1 px-4 py-2 bg-legal-gold text-white rounded-xl font-medium hover:bg-legal-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAr ? 'إضافة' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full page view
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 md:p-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <Bell className="text-legal-gold" size={32} />
              {isAr ? 'التذكيرات' : 'Rappels'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr ? 'إدارة التذكيرات والمواعيد النهائية' : 'Gestion des rappels et échéances'}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-legal-gold text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-legal-gold/20 hover:bg-legal-gold/90 active:scale-95 transition-all"
          >
            <Plus size={20} />
            {isAr ? 'تذكير جديد' : 'Nouveau Rappel'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={isAr ? 'البحث في التذكيرات...' : 'Rechercher dans les rappels...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-gold"
            />
          </div>

          <div className="flex gap-2">
            {['all', 'pending', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-legal-gold text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-legal-gold'
                }`}
              >
                {status === 'all' ? (isAr ? 'الكل' : 'Tous') :
                 status === 'pending' ? (isAr ? 'قيد الانتظار' : 'En attente') :
                 (isAr ? 'مكتمل' : 'Complétés')}
              </button>
            ))}
          </div>
        </div>

        {/* Reminders List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-gold"></div>
          </div>
        ) : filteredReminders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReminders.map(reminder => (
              <div
                key={reminder.id}
                className={`p-6 rounded-2xl border transition-all ${
                  reminder.is_completed
                    ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                    : isOverdue(reminder.reminder_date)
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => !reminder.is_completed && handleCompleteReminder(reminder.id)}
                      className={`mt-1 p-2 rounded-lg transition-colors ${
                        reminder.is_completed
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-600'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      disabled={reminder.is_completed}
                    >
                      <CheckCircle size={20} />
                    </button>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg mb-1 ${reminder.is_completed ? 'line-through' : ''}`}>
                        {reminder.title}
                      </h3>
                      {reminder.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {reminder.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock size={14} className={isOverdue(reminder.reminder_date) && !reminder.is_completed ? 'text-red-500' : 'text-slate-400'} />
                          <span className={isOverdue(reminder.reminder_date) && !reminder.is_completed ? 'text-red-600 font-bold' : 'text-slate-500'}>
                            {formatDate(reminder.reminder_date)}
                          </span>
                        </div>
                        {reminder.is_recurring && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Repeat size={14} />
                            <span className="text-xs">{reminder.recurrence_pattern}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Bell size={60} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">
              {searchTerm || filterStatus !== 'all'
                ? (isAr ? 'لا توجد تذكيرات مطابقة' : 'Aucun rappel correspondant')
                : (isAr ? 'لا توجد تذكيرات بعد' : 'Aucun rappel pour le moment')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReminderSystem;
