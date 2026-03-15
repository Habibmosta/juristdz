import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, MapPin, Bell, FileText } from 'lucide-react';
import type { Language } from '../../types';
import { useAppToast } from '../../contexts/ToastContext';

interface CreateEventModalProps {
  userId: string;
  language: Language;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date;
}

interface Case {
  id: string;
  case_number: string;
  title: string;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  userId,
  language,
  onClose,
  onSuccess,
  initialDate
}) => {
  const isAr = language === 'ar';
  const { toast } = useAppToast();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'meeting' as 'hearing' | 'meeting' | 'deadline' | 'consultation' | 'other',
    caseId: '',
    startDate: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endDate: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endTime: '10:00',
    allDay: false,
    location: '',
    locationType: 'office' as 'court' | 'office' | 'client' | 'online' | 'other',
    reminderMinutes: 30,
    color: '#3b82f6',
    notes: ''
  });

  useEffect(() => {
    loadCases();
  }, [userId]);

  const loadCases = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, title')
        .eq('user_id', userId)
        .in('status', ['nouveau', 'en_cours', 'audience'])
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCases(data);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast(isAr ? 'يرجى إدخال عنوان' : 'Veuillez entrer un titre', 'warning');
      return;
    }

    setLoading(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      
      // Construire les timestamps
      const startTime = formData.allDay 
        ? `${formData.startDate}T00:00:00`
        : `${formData.startDate}T${formData.startTime}:00`;
      const endTime = formData.allDay
        ? `${formData.endDate}T23:59:59`
        : `${formData.endDate}T${formData.endTime}:00`;

      // Vérifier les conflits d'horaire
      const { data: conflicts } = await supabase
        .rpc('check_schedule_conflict', {
          p_user_id: userId,
          p_start_time: startTime,
          p_end_time: endTime
        });

      if (conflicts && conflicts.length > 0) {
        const confirmOverlap = confirm(
          isAr 
            ? `⚠️ تحذير: يوجد تعارض مع حدث آخر "${conflicts[0].conflict_title}". هل تريد المتابعة؟`
            : `⚠️ Attention: Conflit avec "${conflicts[0].conflict_title}". Continuer?`
        );
        if (!confirmOverlap) {
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('calendar_events')
        .insert([{
          user_id: userId,
          case_id: formData.caseId || null,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          event_type: formData.eventType,
          start_time: startTime,
          end_time: endTime,
          all_day: formData.allDay,
          location: formData.location.trim() || null,
          location_type: formData.locationType,
          reminder_minutes: formData.reminderMinutes || null,
          color: formData.color,
          notes: formData.notes.trim() || null,
          status: 'scheduled'
        }]);

      if (error) throw error;

      toast(isAr ? 'تم إنشاء الحدث بنجاح' : 'Événement créé avec succès', 'success');
      onSuccess();
    } catch (error) {
      console.error('Error creating event:', error);
      toast(isAr ? 'خطأ في إنشاء الحدث' : 'Erreur lors de la création', 'error');
    } finally {
      setLoading(false);
    }
  };

  const eventTypeColors: Record<string, string> = {
    hearing: '#ef4444',
    meeting: '#3b82f6',
    deadline: '#f97316',
    consultation: '#10b981',
    other: '#64748b'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-2xl font-bold">
            {isAr ? 'حدث جديد' : 'Nouvel Événement'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'العنوان' : 'Titre'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={isAr ? 'مثال: اجتماع مع العميل' : 'Ex: Réunion avec le client'}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Type d'événement */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'النوع' : 'Type'} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(['hearing', 'meeting', 'deadline', 'consultation', 'other'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, eventType: type, color: eventTypeColors[type] })}
                  className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                    formData.eventType === type
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {type === 'hearing' && (isAr ? '⚖️ جلسة' : '⚖️ Audience')}
                  {type === 'meeting' && (isAr ? '👥 اجتماع' : '👥 Réunion')}
                  {type === 'deadline' && (isAr ? '⏰ موعد' : '⏰ Échéance')}
                  {type === 'consultation' && (isAr ? '💼 استشارة' : '💼 Consultation')}
                  {type === 'other' && (isAr ? '📅 آخر' : '📅 Autre')}
                </button>
              ))}
            </div>
          </div>

          {/* Dossier */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'الملف (اختياري)' : 'Dossier (optionnel)'}
            </label>
            <select
              value={formData.caseId}
              onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">{isAr ? 'بدون ملف' : 'Sans dossier'}</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.case_number} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Journée entière */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allDay}
                onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">
                {isAr ? 'طوال اليوم' : 'Toute la journée'}
              </span>
            </label>
          </div>

          {/* Date et heure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {isAr ? 'تاريخ البداية' : 'Date de début'} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {!formData.allDay && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'وقت البداية' : 'Heure de début'}
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {isAr ? 'تاريخ النهاية' : 'Date de fin'} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {!formData.allDay && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'وقت النهاية' : 'Heure de fin'}
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Lieu */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'المكان' : 'Lieu'}
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={isAr ? 'مثال: محكمة الجزائر' : 'Ex: Tribunal d\'Alger'}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Type de lieu */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'نوع المكان' : 'Type de lieu'}
            </label>
            <select
              value={formData.locationType}
              onChange={(e) => setFormData({ ...formData, locationType: e.target.value as any })}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="court">{isAr ? '⚖️ محكمة' : '⚖️ Tribunal'}</option>
              <option value="office">{isAr ? '🏢 مكتب' : '🏢 Cabinet'}</option>
              <option value="client">{isAr ? '👤 عميل' : '👤 Chez le client'}</option>
              <option value="online">{isAr ? '💻 عبر الإنترنت' : '💻 En ligne'}</option>
              <option value="other">{isAr ? '📍 آخر' : '📍 Autre'}</option>
            </select>
          </div>

          {/* Rappel */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'التذكير' : 'Rappel'}
            </label>
            <select
              value={formData.reminderMinutes}
              onChange={(e) => setFormData({ ...formData, reminderMinutes: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="0">{isAr ? 'بدون تذكير' : 'Aucun rappel'}</option>
              <option value="15">{isAr ? '15 دقيقة قبل' : '15 minutes avant'}</option>
              <option value="30">{isAr ? '30 دقيقة قبل' : '30 minutes avant'}</option>
              <option value="60">{isAr ? '1 ساعة قبل' : '1 heure avant'}</option>
              <option value="120">{isAr ? '2 ساعة قبل' : '2 heures avant'}</option>
              <option value="1440">{isAr ? '1 يوم قبل' : '1 jour avant'}</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'الوصف' : 'Description'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder={isAr ? 'تفاصيل إضافية...' : 'Détails supplémentaires...'}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'ملاحظات' : 'Notes'}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder={isAr ? 'ملاحظات خاصة...' : 'Notes privées...'}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save size={20} />
                  {isAr ? 'حفظ' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
