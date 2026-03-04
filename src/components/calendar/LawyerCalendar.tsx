import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { 
  Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin,
  User, X, Edit2, Trash2, Filter, Briefcase, Phone, Mail
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CalendarEvent {
  id: string;
  user_id: string;
  case_id?: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_all_day: boolean;
  attendees?: string[];
  status: string;
  created_at: string;
}

interface LawyerCalendarProps {
  language: Language;
  userId: string;
}

const LawyerCalendar: React.FC<LawyerCalendarProps> = ({ language, userId }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'meeting',
    start_time: '',
    end_time: '',
    location: '',
    is_all_day: false
  });
  const isAr = language === 'ar';

  useEffect(() => {
    loadEvents();
  }, [userId, currentDate, view]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const startOfPeriod = getStartOfPeriod();
      const endOfPeriod = getEndOfPeriod();

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startOfPeriod.toISOString())
        .lte('start_time', endOfPeriod.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartOfPeriod = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      return date;
    } else if (view === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);
      return date;
    } else {
      date.setHours(0, 0, 0, 0);
      return date;
    }
  };

  const getEndOfPeriod = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      date.setHours(23, 59, 59, 999);
      return date;
    } else if (view === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day + 6);
      date.setHours(23, 59, 59, 999);
      return date;
    } else {
      date.setHours(23, 59, 59, 999);
      return date;
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.start_time) return;

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          user_id: userId,
          title: newEvent.title,
          description: newEvent.description,
          event_type: newEvent.event_type,
          start_time: newEvent.start_time,
          end_time: newEvent.end_time || newEvent.start_time,
          location: newEvent.location,
          is_all_day: newEvent.is_all_day,
          status: 'scheduled'
        }])
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => [...prev, data]);
      setShowAddModal(false);
      setNewEvent({
        title: '',
        description: '',
        event_type: 'meeting',
        start_time: '',
        end_time: '',
        location: '',
        is_all_day: false
      });
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا الحدث؟' : 'Êtes-vous sûr de supprimer cet événement ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'hearing': return 'bg-red-500 border-red-600';
      case 'meeting': return 'bg-blue-500 border-blue-600';
      case 'deadline': return 'bg-orange-500 border-orange-600';
      case 'appointment': return 'bg-green-500 border-green-600';
      default: return 'bg-slate-500 border-slate-600';
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, { fr: string; ar: string }> = {
      hearing: { fr: 'Audience', ar: 'جلسة' },
      meeting: { fr: 'Réunion', ar: 'اجتماع' },
      deadline: { fr: 'Échéance', ar: 'موعد نهائي' },
      appointment: { fr: 'Rendez-vous', ar: 'موعد' },
      other: { fr: 'Autre', ar: 'آخر' }
    };
    return labels[type]?.[language] || type;
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(isAr ? 'ar-DZ' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (view === 'month') navigateMonth(direction);
    else if (view === 'week') navigateWeek(direction);
    else navigateDay(direction);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', {
    month: 'long',
    year: 'numeric'
  });

  const weekDays = isAr
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(e => e.event_type === filterType);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 md:p-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <Calendar className="text-legal-gold" size={32} />
              {isAr ? 'الأجندة' : 'Agenda'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr ? 'إدارة المواعيد والجلسات' : 'Gestion des rendez-vous et audiences'}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-legal-gold text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-legal-gold/20 hover:bg-legal-gold/90 active:scale-95 transition-all"
          >
            <Plus size={20} />
            {isAr ? 'حدث جديد' : 'Nouvel Événement'}
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800">
          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('prev')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {isAr ? 'اليوم' : 'Aujourd\'hui'}
            </button>
            <button
              onClick={() => navigate('next')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            <h2 className="text-xl font-bold ml-4">{monthName}</h2>
          </div>

          {/* View Switcher */}
          <div className="flex gap-2">
            {['month', 'week', 'day'].map(v => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === v
                    ? 'bg-legal-gold text-white'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {v === 'month' ? (isAr ? 'شهر' : 'Mois') :
                 v === 'week' ? (isAr ? 'أسبوع' : 'Semaine') :
                 (isAr ? 'يوم' : 'Jour')}
              </button>
            ))}
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-gold"
          >
            <option value="all">{isAr ? 'جميع الأنواع' : 'Tous les types'}</option>
            <option value="hearing">{isAr ? 'جلسات' : 'Audiences'}</option>
            <option value="meeting">{isAr ? 'اجتماعات' : 'Réunions'}</option>
            <option value="deadline">{isAr ? 'مواعيد نهائية' : 'Échéances'}</option>
            <option value="appointment">{isAr ? 'مواعيد' : 'Rendez-vous'}</option>
          </select>
        </div>

        {/* Calendar Grid - Month View */}
        {view === 'month' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 overflow-hidden">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 border-b dark:border-slate-800">
              {weekDays.map(day => (
                <div key={day} className="p-3 text-center font-bold text-sm text-slate-600 dark:text-slate-400 border-r dark:border-slate-800 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7">
              {getDaysInMonth().map((date, index) => {
                const dayEvents = date ? getEventsForDate(date) : [];
                const isToday = date && date.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b dark:border-slate-800 last:border-r-0 ${
                      !date ? 'bg-slate-50 dark:bg-slate-950' : 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
                    }`}
                    onClick={() => date && setSelectedDate(date)}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-bold mb-2 ${
                          isToday ? 'w-7 h-7 bg-legal-gold text-white rounded-full flex items-center justify-center' : ''
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded border-l-2 ${getEventColor(event.event_type)} bg-opacity-10 truncate`}
                            >
                              {formatTime(event.start_time)} {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-slate-500 pl-1">
                              +{dayEvents.length - 3} {isAr ? 'المزيد' : 'plus'}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View - Week/Day */}
        {(view === 'week' || view === 'day') && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-gold"></div>
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="space-y-4">
                {filteredEvents.map(event => (
                  <div
                    key={event.id}
                    className="p-4 rounded-xl border dark:border-slate-800 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-1 h-full rounded-full ${getEventColor(event.event_type)}`}></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getEventColor(event.event_type)}`}>
                              {getEventTypeLabel(event.event_type)}
                            </span>
                            <span className="text-sm text-slate-500">
                              {formatTime(event.start_time)} - {formatTime(event.end_time)}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                              {event.description}
                            </p>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <MapPin size={14} />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">
                  {isAr ? 'لا توجد أحداث' : 'Aucun événement'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Add Event Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">{isAr ? 'حدث جديد' : 'Nouvel Événement'}</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{isAr ? 'النوع' : 'Type'}</label>
                  <select
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-gold"
                  >
                    <option value="hearing">{isAr ? 'جلسة' : 'Audience'}</option>
                    <option value="meeting">{isAr ? 'اجتماع' : 'Réunion'}</option>
                    <option value="deadline">{isAr ? 'موعد نهائي' : 'Échéance'}</option>
                    <option value="appointment">{isAr ? 'موعد' : 'Rendez-vous'}</option>
                    <option value="other">{isAr ? 'آخر' : 'Autre'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{isAr ? 'العنوان' : 'Titre'}</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder={isAr ? 'عنوان الحدث...' : 'Titre de l\'événement...'}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{isAr ? 'البداية' : 'Début'}</label>
                    <input
                      type="datetime-local"
                      value={newEvent.start_time}
                      onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{isAr ? 'النهاية' : 'Fin'}</label>
                    <input
                      type="datetime-local"
                      value={newEvent.end_time}
                      onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{isAr ? 'المكان' : 'Lieu'}</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder={isAr ? 'مكان الحدث...' : 'Lieu de l\'événement...'}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{isAr ? 'الوصف' : 'Description'}</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder={isAr ? 'وصف الحدث...' : 'Description de l\'événement...'}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-gold resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="all-day"
                    checked={newEvent.is_all_day}
                    onChange={(e) => setNewEvent({ ...newEvent, is_all_day: e.target.checked })}
                    className="w-4 h-4 text-legal-gold focus:ring-legal-gold rounded"
                  />
                  <label htmlFor="all-day" className="text-sm font-medium">
                    {isAr ? 'طوال اليوم' : 'Toute la journée'}
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {isAr ? 'إلغاء' : 'Annuler'}
                  </button>
                  <button
                    onClick={handleAddEvent}
                    disabled={!newEvent.title.trim() || !newEvent.start_time}
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
    </div>
  );
};

export default LawyerCalendar;
