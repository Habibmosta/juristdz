import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Users, Bell } from 'lucide-react';
import type { Language } from '../../types';
import { CreateEventModal } from './CreateEventModal';

interface CalendarViewProps {
  userId: string;
  language: Language;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: 'hearing' | 'meeting' | 'deadline' | 'consultation' | 'other';
  location?: string;
  case_id?: string;
  case_title?: string;
  attendees?: string[];
  reminder_minutes?: number;
  color?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ userId, language }) => {
  const isAr = language === 'ar';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [userId, currentDate, view]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      
      // Calculer la plage de dates selon la vue
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          cases (case_number, title)
        `)
        .eq('user_id', userId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time');

      if (!error && data) {
        const formattedEvents = data.map(event => ({
          ...event,
          case_title: event.cases ? `${event.cases.case_number} - ${event.cases.title}` : undefined
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
    } else if (view === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date;
  };

  const getViewEndDate = () => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      date.setHours(23, 59, 59, 999);
    } else if (view === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day + 6);
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(23, 59, 59, 999);
    }
    return date;
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Jours du mois précédent
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Jours du mois actuel
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

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      hearing: 'bg-red-100 text-red-700 border-red-200',
      meeting: 'bg-blue-100 text-blue-700 border-blue-200',
      deadline: 'bg-orange-100 text-orange-700 border-orange-200',
      consultation: 'bg-green-100 text-green-700 border-green-200',
      other: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return colors[type] || colors.other;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'hearing': return '⚖️';
      case 'meeting': return '👥';
      case 'deadline': return '⏰';
      case 'consultation': return '💼';
      default: return '📅';
    }
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

  const monthNames = isAr 
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const dayNames = isAr
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const days = getDaysInMonth();
  const today = new Date();

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {isAr ? 'التقويم' : 'Calendrier'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isAr ? 'إدارة المواعيد والأحداث' : 'Gestion des rendez-vous et événements'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          {isAr ? 'حدث جديد' : 'Nouvel Événement'}
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-4">
        <div className="flex items-center justify-between">
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
            
            <h2 className="text-xl font-bold ml-4">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>

          {/* View Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isAr ? 'شهر' : 'Mois'}
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isAr ? 'أسبوع' : 'Semaine'}
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isAr ? 'يوم' : 'Jour'}
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid - Month View */}
      {view === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b dark:border-slate-800">
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center font-bold text-sm text-slate-600 dark:text-slate-400">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="min-h-[120px] border-b border-r dark:border-slate-800 bg-slate-50 dark:bg-slate-950" />;
              }

              const dayEvents = getEventsForDate(day);
              const isToday = day.toDateString() === today.toDateString();
              const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[120px] border-b border-r dark:border-slate-800 p-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className={`text-sm font-bold mb-2 ${
                    isToday ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : ''
                  }`}>
                    {day.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs px-2 py-1 rounded border ${getEventColor(event.event_type)} truncate`}
                      >
                        {getEventIcon(event.event_type)} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-500 px-2">
                        +{dayEvents.length - 3} {isAr ? 'المزيد' : 'plus'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week/Day View - À implémenter */}
      {(view === 'week' || view === 'day') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6">
          <p className="text-center text-slate-500">
            {isAr ? 'عرض الأسبوع/اليوم قيد التطوير' : 'Vue semaine/jour en développement'}
          </p>
        </div>
      )}

      {/* Events List for Selected Date */}
      {selectedDate && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold mb-4">
            {isAr ? 'أحداث' : 'Événements'} - {selectedDate.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR')}
          </h3>
          
          <div className="space-y-3">
            {getEventsForDate(selectedDate).map(event => (
              <div key={event.id} className="p-4 border dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getEventIcon(event.event_type)}</span>
                    <div>
                      <h4 className="font-bold">{event.title}</h4>
                      {event.case_title && (
                        <p className="text-sm text-slate-500">📁 {event.case_title}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getEventColor(event.event_type)}`}>
                    {event.event_type}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <p className="flex items-center gap-2">
                    <Clock size={14} />
                    {new Date(event.start_time).toLocaleTimeString(isAr ? 'ar-DZ' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {new Date(event.end_time).toLocaleTimeString(isAr ? 'ar-DZ' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  
                  {event.location && (
                    <p className="flex items-center gap-2">
                      <MapPin size={14} />
                      {event.location}
                    </p>
                  )}
                  
                  {event.reminder_minutes && (
                    <p className="flex items-center gap-2">
                      <Bell size={14} />
                      {isAr ? `تذكير قبل ${event.reminder_minutes} دقيقة` : `Rappel ${event.reminder_minutes} min avant`}
                    </p>
                  )}
                </div>
                
                {event.description && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 italic">
                    {event.description}
                  </p>
                )}
              </div>
            ))}
            
            {getEventsForDate(selectedDate).length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <CalendarIcon size={48} className="mx-auto mb-3 opacity-20" />
                <p>{isAr ? 'لا توجد أحداث' : 'Aucun événement'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          userId={userId}
          language={language}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadEvents();
          }}
          initialDate={selectedDate || undefined}
        />
      )}
    </div>
  );
};

export default CalendarView;
