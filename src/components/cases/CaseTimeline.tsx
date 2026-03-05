import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { 
  Clock, Plus, Filter, Search, FileText, Phone, Mail, 
  Calendar, User, Edit2, Trash2, MessageSquare, Briefcase,
  CheckCircle, AlertCircle, Info, TrendingUp, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CaseEvent {
  id: string;
  case_id: string;
  user_id: string;
  event_type: string;
  title: string;
  description?: string;
  metadata?: any;
  created_at: string;
}

interface CaseTimelineProps {
  caseId: string;
  language: Language;
  userId: string;
}

const CaseTimeline: React.FC<CaseTimelineProps> = ({ caseId, language, userId }) => {
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'note',
    event_date: new Date().toISOString().split('T')[0] // Date du jour par défaut
  });
  const isAr = language === 'ar';

  useEffect(() => {
    loadEvents();
  }, [caseId]);

  useEffect(() => {
    applyFilters();
  }, [events, searchTerm, filterType]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('case_events')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.event_type === filterType);
    }

    setFilteredEvents(filtered);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) return;

    try {
      const eventData: any = {
        case_id: caseId,
        user_id: userId,
        event_type: newEvent.event_type,
        title: newEvent.title,
        description: newEvent.description,
        event_date: newEvent.event_date,
        status: 'prevu'
      };

      const { data, error } = await supabase
        .from('case_events')
        .insert([eventData])
        .select()
        .single();

      if (error) {
        console.error('Error adding event:', error);
        alert(`Erreur: ${error.message}`);
        return;
      }

      setEvents(prev => [data, ...prev]);
      setShowAddModal(false);
      setNewEvent({ 
        title: '', 
        description: '', 
        event_type: 'note',
        event_date: new Date().toISOString().split('T')[0]
      });
      alert(isAr ? 'تمت إضافة الحدث بنجاح' : 'Événement ajouté avec succès');
    } catch (error) {
      console.error('Error adding event:', error);
      alert(isAr ? 'خطأ في إضافة الحدث' : 'Erreur lors de l\'ajout de l\'événement');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا الحدث؟' : 'Êtes-vous sûr de supprimer cet événement ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('case_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created': return <Briefcase size={16} className="text-blue-500" />;
      case 'updated': return <Edit2 size={16} className="text-green-500" />;
      case 'document_added': return <FileText size={16} className="text-purple-500" />;
      case 'note_added': return <MessageSquare size={16} className="text-yellow-500" />;
      case 'deadline_set': return <AlertCircle size={16} className="text-red-500" />;
      case 'hearing': return <Calendar size={16} className="text-orange-500" />;
      case 'meeting': return <User size={16} className="text-teal-500" />;
      case 'call': return <Phone size={16} className="text-indigo-500" />;
      case 'email': return <Mail size={16} className="text-pink-500" />;
      case 'completed': return <CheckCircle size={16} className="text-green-600" />;
      default: return <Info size={16} className="text-slate-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'created': return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'updated': return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'document_added': return 'bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'note_added': return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'deadline_set': return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'hearing': return 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'meeting': return 'bg-teal-100 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800';
      case 'call': return 'bg-indigo-100 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800';
      case 'email': return 'bg-pink-100 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800';
      case 'completed': return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default: return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, { fr: string; ar: string }> = {
      created: { fr: 'Création', ar: 'إنشاء' },
      updated: { fr: 'Modification', ar: 'تعديل' },
      document_added: { fr: 'Document ajouté', ar: 'مستند مضاف' },
      note_added: { fr: 'Note ajoutée', ar: 'ملاحظة مضافة' },
      note: { fr: 'Note', ar: 'ملاحظة' },
      deadline_set: { fr: 'Échéance fixée', ar: 'موعد نهائي محدد' },
      hearing: { fr: 'Audience', ar: 'جلسة' },
      meeting: { fr: 'Réunion', ar: 'اجتماع' },
      call: { fr: 'Appel téléphonique', ar: 'مكالمة هاتفية' },
      email: { fr: 'Email', ar: 'بريد إلكتروني' },
      completed: { fr: 'Complété', ar: 'مكتمل' }
    };
    return labels[type]?.[language] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isAr ? 'الآن' : 'À l\'instant';
    if (diffMins < 60) return isAr ? `منذ ${diffMins} دقيقة` : `Il y a ${diffMins} min`;
    if (diffHours < 24) return isAr ? `منذ ${diffHours} ساعة` : `Il y a ${diffHours}h`;
    if (diffDays < 7) return isAr ? `منذ ${diffDays} يوم` : `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const eventTypes = [
    { value: 'all', label: isAr ? 'الكل' : 'Tous' },
    { value: 'note', label: isAr ? 'ملاحظة' : 'Note' },
    { value: 'hearing', label: isAr ? 'جلسة' : 'Audience' },
    { value: 'meeting', label: isAr ? 'اجتماع' : 'Réunion' },
    { value: 'call', label: isAr ? 'مكالمة' : 'Appel' },
    { value: 'email', label: isAr ? 'بريد' : 'Email' },
    { value: 'document_added', label: isAr ? 'مستند' : 'Document' },
    { value: 'deadline_set', label: isAr ? 'موعد نهائي' : 'Échéance' }
  ];

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock size={20} className="text-legal-gold" />
            {isAr ? 'الجدول الزمني' : 'Chronologie du Dossier'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {isAr ? `${filteredEvents.length} حدث` : `${filteredEvents.length} événements`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-legal-gold text-white rounded-xl font-medium flex items-center gap-2 hover:bg-legal-gold/90 transition-colors"
        >
          <Plus size={18} />
          {isAr ? 'إضافة حدث' : 'Ajouter Événement'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isAr ? 'البحث في الأحداث...' : 'Rechercher dans les événements...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="pl-10 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent"
          >
            {eventTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-gold"></div>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>

          {/* Events */}
          <div className="space-y-6">
            {filteredEvents.map((event, index) => (
              <div key={event.id} className="relative pl-16">
                {/* Icon */}
                <div className={`absolute left-0 w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center ${getEventColor(event.event_type)}`}>
                  {getEventIcon(event.event_type)}
                </div>

                {/* Content */}
                <div className={`p-4 rounded-xl border ${getEventColor(event.event_type)}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          {getEventTypeLabel(event.event_type)}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          {formatDate(event.created_at)}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title={isAr ? 'حذف' : 'Supprimer'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <p className="text-slate-500">
            {searchTerm || filterType !== 'all'
              ? (isAr ? 'لا توجد أحداث مطابقة' : 'Aucun événement correspondant')
              : (isAr ? 'لا توجد أحداث بعد' : 'Aucun événement pour le moment')}
          </p>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{isAr ? 'إضافة حدث جديد' : 'Ajouter un Événement'}</h3>
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
                  {eventTypes.filter(t => t.value !== 'all').map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{isAr ? 'التاريخ' : 'Date'}</label>
                <input
                  type="date"
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-gold"
                />
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

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  onClick={handleAddEvent}
                  disabled={!newEvent.title.trim()}
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
};

export default CaseTimeline;
