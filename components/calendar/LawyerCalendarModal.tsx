import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, X, MapPin, Users, FileText, Edit2, Trash2 } from 'lucide-react';
import { Language } from '../../types';
import { supabase } from '../../src/lib/supabase';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  event_type: 'hearing' | 'meeting' | 'deadline' | 'other';
  case_id?: string;
  case_title?: string;
}

interface LawyerCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  userId: string;
}

const LawyerCalendarModal: React.FC<LawyerCalendarModalProps> = ({
  isOpen,
  onClose,
  language,
  userId
}) => {
  const isAr = language === 'ar';
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    event_type: 'meeting' as const
  });

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen, currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          cases:case_id (
            id,
            title
          )
        `)
        .eq('user_id', userId)
        .gte('event_date', startOfMonth.toISOString())
        .lte('event_date', endOfMonth.toISOString())
        .order('event_date', { ascending: true });

      if (error) throw error;

      const formattedEvents = data?.map(event => ({
        ...event,
        case_title: event.cases?.title
      })) || [];

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.event_date) return;

    try {
      const { error } = await supabase
        .from('calendar_events')
        .insert([{
          user_id: userId,
          ...newEvent
        }]);

      if (error) throw error;

      setShowNewEventForm(false);
      setNewEvent({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        event_type: 'meeting'
      });
      loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.event_date === dateStr);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'hearing': return 'bg-red-100 text-red-700 border-red-200';
      case 'meeting': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'deadline': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'call': return 'bg-green-100 text-green-700 border-green-200';
      case 'email': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'document': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      hearing: isAr ? 'جلسة' : 'Audience',
      meeting: isAr ? 'اجتماع' : 'Réunion',
      deadline: isAr ? 'موعد نهائي' : 'Échéance',
      call: isAr ? 'مكالمة' : 'Appel',
      email: isAr ? 'بريد إلكتروني' : 'Email',
      document: isAr ? 'وثيقة' : 'Document',
      other: isAr ? 'آخر' : 'Autre'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (!isOpen) return null;

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Calendar className="text-legal-gold" />
            {isAr ? 'الأجندة' : 'Agenda'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              ←
            </button>
            <h3 className="text-xl font-bold">{monthName}</h3>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              →
            </button>
          </div>

          <button
            onClick={() => setShowNewEventForm(true)}
            className="w-full mb-6 px-4 py-3 bg-legal-blue text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-legal-blue/90"
          >
            <Plus size={20} />
            {isAr ? 'إضافة حدث' : 'Ajouter un événement'}
          </button>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className="text-center font-bold text-sm text-slate-500 py-2">
                {day}
              </div>
            ))}
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }
              const dayEvents = getEventsForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square p-2 rounded-lg border transition-all ${
                    isToday 
                      ? 'bg-legal-blue text-white border-legal-blue' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-legal-blue'
                  }`}
                >
                  <div className="text-sm font-bold">{day.getDate()}</div>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-1 mt-1 justify-center">
                      {dayEvents.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-legal-gold" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Events List */}
          {selectedDate && (
            <div className="mt-6 border-t dark:border-slate-800 pt-6">
              <h4 className="font-bold text-lg mb-4">
                {isAr ? 'أحداث' : 'Événements du'} {selectedDate.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR')}
              </h4>
              <div className="space-y-3">
                {getEventsForDate(selectedDate).map(event => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-xl border ${getEventTypeColor(event.event_type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-bold">{event.title}</div>
                        {event.event_time && (
                          <div className="text-sm flex items-center gap-1 mt-1">
                            <Clock size={14} />
                            {event.event_time}
                          </div>
                        )}
                        {event.location && (
                          <div className="text-sm flex items-center gap-1 mt-1">
                            <MapPin size={14} />
                            {event.location}
                          </div>
                        )}
                        {event.case_title && (
                          <div className="text-sm flex items-center gap-1 mt-1">
                            <FileText size={14} />
                            {event.case_title}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded">
                        {getEventTypeLabel(event.event_type)}
                      </span>
                    </div>
                  </div>
                ))}
                {getEventsForDate(selectedDate).length === 0 && (
                  <p className="text-center text-slate-500 py-8">
                    {isAr ? 'لا توجد أحداث' : 'Aucun événement'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* New Event Form */}
          {showNewEventForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">
                  {isAr ? 'حدث جديد' : 'Nouvel événement'}
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder={isAr ? 'العنوان' : 'Titre'}
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg dark:bg-slate-800"
                  />
                  <input
                    type="date"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg dark:bg-slate-800"
                  />
                  <input
                    type="time"
                    value={newEvent.event_time}
                    onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    placeholder={isAr ? 'الموقع' : 'Lieu'}
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg dark:bg-slate-800"
                  />
                  <select
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value as any })}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg dark:bg-slate-800"
                  >
                    <option value="meeting">{isAr ? 'اجتماع' : 'Réunion'}</option>
                    <option value="hearing">{isAr ? 'جلسة' : 'Audience'}</option>
                    <option value="deadline">{isAr ? 'موعد نهائي' : 'Échéance'}</option>
                    <option value="call">{isAr ? 'مكالمة' : 'Appel téléphonique'}</option>
                    <option value="email">{isAr ? 'بريد إلكتروني' : 'Email'}</option>
                    <option value="document">{isAr ? 'وثيقة' : 'Document à préparer'}</option>
                    <option value="other">{isAr ? 'آخر' : 'Autre'}</option>
                  </select>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateEvent}
                      className="flex-1 px-4 py-2 bg-legal-blue text-white rounded-lg font-bold"
                    >
                      {isAr ? 'إضافة' : 'Ajouter'}
                    </button>
                    <button
                      onClick={() => setShowNewEventForm(false)}
                      className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg font-bold"
                    >
                      {isAr ? 'إلغاء' : 'Annuler'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LawyerCalendarModal;
