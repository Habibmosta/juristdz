import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Calendar, DollarSign, FileText } from 'lucide-react';
import type { Language } from '../../types';
import { useAppToast } from '../../contexts/ToastContext';

interface TimeTrackerProps {
  userId: string;
  language: Language;
  caseId?: string;
}

interface TimeEntry {
  id: string;
  user_id: string;
  case_id?: string;
  case_title?: string;
  description: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  is_billable: boolean;
  hourly_rate?: number;
  amount?: number;
  status: 'running' | 'stopped' | 'billed';
  created_at: string;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({ userId, language, caseId }) => {
  const { toast } = useAppToast();
  const [isRunning, setIsRunning] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || '');
  const [isBillable, setIsBillable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState<number>(15000);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  
  const isAr = language === 'ar';

  useEffect(() => {
    loadCases();
    loadRecentEntries();
    checkRunningTimer();
    loadHourlyRate();
  }, [userId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && currentEntry) {
      interval = setInterval(() => {
        const start = new Date(currentEntry.start_time).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, currentEntry]);

  const loadHourlyRate = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data } = await supabase
        .from('profiles')
        .select('professional_info')
        .eq('id', userId)
        .single();
      if (data?.professional_info?.hourlyRate) {
        setHourlyRate(data.professional_info.hourlyRate);
      }
    } catch (_) {}
  };

  const loadCases = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, title')
        .eq('user_id', userId)
        .in('status', ['nouveau', 'en_cours', 'audience'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setCases(data);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const loadRecentEntries = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          cases (case_number, title)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        const entries = data.map(entry => ({
          ...entry,
          case_title: entry.cases ? `${entry.cases.case_number} - ${entry.cases.title}` : undefined
        }));
        setRecentEntries(entries);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const checkRunningTimer = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'running')
        .single();

      if (!error && data) {
        setCurrentEntry(data);
        setIsRunning(true);
        setDescription(data.description);
        setSelectedCaseId(data.case_id || '');
        setIsBillable(data.is_billable);
        setHourlyRate(data.hourly_rate || 15000);
      }
    } catch (error) {
      // No running timer
    }
  };

  const startTimer = async () => {
    if (!description.trim()) {
      toast(isAr ? 'يرجى إدخال وصف للنشاط' : 'Veuillez entrer une description', 'warning');
      return;
    }

    try {
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          user_id: userId,
          case_id: selectedCaseId || null,
          description: description.trim(),
          start_time: new Date().toISOString(),
          is_billable: isBillable,
          hourly_rate: isBillable ? hourlyRate : null,
          status: 'running'
        }])
        .select()
        .single();

      if (error) throw error;

      setCurrentEntry(data);
      setIsRunning(true);
      setElapsedTime(0);
    } catch (error) {
      console.error('Error starting timer:', error);
      toast(isAr ? 'خطأ في بدء المؤقت' : 'Erreur lors du démarrage', 'error');
    }
  };

  const stopTimer = async () => {
    if (!currentEntry) return;

    try {
      const { supabase } = await import('../../lib/supabase');
      const endTime = new Date();
      const startTime = new Date(currentEntry.start_time);
      const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
      const amount = isBillable && hourlyRate ? (durationMinutes / 60) * hourlyRate : null;

      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          amount: amount,
          status: 'stopped'
        })
        .eq('id', currentEntry.id);

      if (error) throw error;

      setIsRunning(false);
      setCurrentEntry(null);
      setElapsedTime(0);
      setDescription('');
      loadRecentEntries();
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast(isAr ? 'خطأ في إيقاف المؤقت' : 'Erreur lors de l\'arrêt', 'error');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Timer Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Clock size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {isAr ? 'تتبع الوقت' : 'Suivi du Temps'}
            </h2>
            <p className="text-sm text-slate-500">
              {isAr ? 'سجل وقت عملك على الملفات' : 'Enregistrez votre temps de travail'}
            </p>
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className="text-6xl font-mono font-bold text-blue-600 mb-2">
            {formatTime(elapsedTime)}
          </div>
          {isRunning && currentEntry && (
            <p className="text-sm text-slate-500">
              {isAr ? 'بدأ في' : 'Démarré à'} {new Date(currentEntry.start_time).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {isAr ? 'وصف النشاط' : 'Description de l\'activité'}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isRunning}
            placeholder={isAr ? 'مثال: مراجعة العقد، اجتماع مع العميل...' : 'Ex: Révision contrat, réunion client...'}
            className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
          />
        </div>

        {/* Case Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {isAr ? 'الملف (اختياري)' : 'Dossier (optionnel)'}
          </label>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            disabled={isRunning}
            className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
          >
            <option value="">{isAr ? 'بدون ملف' : 'Sans dossier'}</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>
                {c.case_number} - {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Billable & Rate */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBillable}
                onChange={(e) => setIsBillable(e.target.checked)}
                disabled={isRunning}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">
                {isAr ? 'قابل للفوترة' : 'Facturable'}
              </span>
            </label>
          </div>
          {isBillable && (
            <div>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                disabled={isRunning}
                placeholder={isAr ? 'السعر بالساعة' : 'Taux horaire'}
                className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
              />
              <p className="text-xs text-slate-500 mt-1">
                {isAr ? 'دج/ساعة' : 'DA/heure'}
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
            >
              <Play size={20} />
              {isAr ? 'بدء' : 'Démarrer'}
            </button>
          ) : (
            <button
              onClick={stopTimer}
              className="flex-1 px-6 py-4 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
            >
              <Square size={20} />
              {isAr ? 'إيقاف' : 'Arrêter'}
            </button>
          )}
        </div>
      </div>

      {/* Recent Entries */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">
          {isAr ? 'الأنشطة الأخيرة' : 'Activités Récentes'}
        </h3>

        <div className="space-y-3">
          {recentEntries.map(entry => (
            <div
              key={entry.id}
              className="p-4 border dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {entry.description}
                  </p>
                  {entry.case_title && (
                    <p className="text-sm text-slate-500 mt-1">
                      📁 {entry.case_title}
                    </p>
                  )}
                </div>
                {entry.is_billable && entry.amount && (
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatAmount(entry.amount)}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(entry.start_time).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {entry.duration_minutes ? formatDuration(entry.duration_minutes) : '-'}
                </span>
                {entry.is_billable && (
                  <span className="flex items-center gap-1 text-green-600">
                    <DollarSign size={12} />
                    {isAr ? 'قابل للفوترة' : 'Facturable'}
                  </span>
                )}
              </div>
            </div>
          ))}

          {recentEntries.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Clock size={48} className="mx-auto mb-3 opacity-20" />
              <p>{isAr ? 'لا توجد أنشطة مسجلة' : 'Aucune activité enregistrée'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
