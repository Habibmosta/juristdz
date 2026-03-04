import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Plus, Calendar, DollarSign, FileText } from 'lucide-react';
import { Language } from '../../types';

interface TimeEntry {
  id: string;
  caseId: string;
  caseName: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  hourlyRate: number;
  isBillable: boolean;
  activity: string;
  userId: string;
}

interface TimeTrackerProps {
  language: Language;
  userId: string;
  caseId?: string;
  caseName?: string;
  onSave?: (entry: TimeEntry) => void;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({ 
  language, 
  userId, 
  caseId: initialCaseId, 
  caseName: initialCaseName,
  onSave 
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pausedTime, setPausedTime] = useState(0);
  
  // Form state
  const [caseId, setCaseId] = useState(initialCaseId || '');
  const [caseName, setCaseName] = useState(initialCaseName || '');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState(5000); // 5000 DA/hour default
  const [isBillable, setIsBillable] = useState(true);
  const [activity, setActivity] = useState('consultation');
  
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualDuration, setManualDuration] = useState({ hours: 0, minutes: 0 });

  const t = {
    fr: {
      title: 'Gestion du Temps',
      timer: 'Chronomètre',
      manualEntry: 'Saisie Manuelle',
      start: 'Démarrer',
      pause: 'Pause',
      resume: 'Reprendre',
      stop: 'Arrêter',
      save: 'Enregistrer',
      cancel: 'Annuler',
      case: 'Dossier',
      selectCase: 'Sélectionner un dossier',
      description: 'Description',
      descriptionPlaceholder: 'Décrivez l\'activité...',
      activity: 'Type d\'activité',
      hourlyRate: 'Taux horaire (DA)',
      billable: 'Facturable',
      nonBillable: 'Non facturable',
      duration: 'Durée',
      hours: 'Heures',
      minutes: 'Minutes',
      amount: 'Montant',
      activities: {
        consultation: 'Consultation',
        research: 'Recherche',
        drafting: 'Rédaction',
        hearing: 'Audience',
        meeting: 'Réunion',
        phone: 'Appel téléphonique',
        email: 'Email',
        travel: 'Déplacement',
        other: 'Autre'
      }
    },
    ar: {
      title: 'إدارة الوقت',
      timer: 'مؤقت',
      manualEntry: 'إدخال يدوي',
      start: 'بدء',
      pause: 'إيقاف مؤقت',
      resume: 'استئناف',
      stop: 'إيقاف',
      save: 'حفظ',
      cancel: 'إلغاء',
      case: 'ملف',
      selectCase: 'اختر ملفاً',
      description: 'الوصف',
      descriptionPlaceholder: 'صف النشاط...',
      activity: 'نوع النشاط',
      hourlyRate: 'السعر بالساعة (دج)',
      billable: 'قابل للفوترة',
      nonBillable: 'غير قابل للفوترة',
      duration: 'المدة',
      hours: 'ساعات',
      minutes: 'دقائق',
      amount: 'المبلغ',
      activities: {
        consultation: 'استشارة',
        research: 'بحث',
        drafting: 'صياغة',
        hearing: 'جلسة',
        meeting: 'اجتماع',
        phone: 'مكالمة هاتفية',
        email: 'بريد إلكتروني',
        travel: 'تنقل',
        other: 'أخرى'
      }
    }
  };

  const text = t[language];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(new Date());
    setElapsedTime(0);
    setPausedTime(0);
  };

  const handlePause = () => {
    setIsPaused(true);
    setPausedTime(elapsedTime);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    if (elapsedTime > 0) {
      saveTimeEntry(elapsedTime / 60); // Convert to minutes
    }
    resetTimer();
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedTime(0);
    setStartTime(null);
    setPausedTime(0);
  };

  const saveTimeEntry = (durationMinutes: number) => {
    const entry: TimeEntry = {
      id: `time_${Date.now()}`,
      caseId,
      caseName,
      description,
      startTime: startTime || new Date(),
      endTime: new Date(),
      duration: Math.round(durationMinutes),
      hourlyRate,
      isBillable,
      activity,
      userId
    };

    if (onSave) {
      onSave(entry);
    }

    // Reset form
    setDescription('');
    setShowManualEntry(false);
    setManualDuration({ hours: 0, minutes: 0 });
  };

  const handleManualSave = () => {
    const totalMinutes = manualDuration.hours * 60 + manualDuration.minutes;
    if (totalMinutes > 0) {
      saveTimeEntry(totalMinutes);
    }
  };

  const calculateAmount = (durationMinutes: number) => {
    return (durationMinutes / 60) * hourlyRate;
  };

  const currentAmount = isRunning 
    ? calculateAmount(elapsedTime / 60)
    : calculateAmount(manualDuration.hours * 60 + manualDuration.minutes);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-legal-gold/10 rounded-xl">
            <Clock className="w-6 h-6 text-legal-gold" />
          </div>
          <h2 className="text-2xl font-bold text-white">{text.title}</h2>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowManualEntry(false)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              !showManualEntry
                ? 'bg-legal-gold text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Play className="w-4 h-4 inline mr-2" />
            {text.timer}
          </button>
          <button
            onClick={() => setShowManualEntry(true)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              showManualEntry
                ? 'bg-legal-gold text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            {text.manualEntry}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
        {!showManualEntry ? (
          /* Timer Mode */
          <div className="space-y-6">
            {/* Timer Display */}
            <div className="text-center py-8">
              <div className="text-6xl font-mono font-bold text-legal-gold mb-4">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-slate-400">
                {text.amount}: {currentAmount.toLocaleString('fr-DZ')} DA
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center gap-4">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  {text.start}
                </button>
              ) : (
                <>
                  {!isPaused ? (
                    <button
                      onClick={handlePause}
                      className="px-8 py-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                      <Pause className="w-5 h-5" />
                      {text.pause}
                    </button>
                  ) : (
                    <button
                      onClick={handleResume}
                      className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      {text.resume}
                    </button>
                  )}
                  <button
                    onClick={handleStop}
                    className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <Square className="w-5 h-5" />
                    {text.stop}
                  </button>
                </>
              )}
            </div>

            {/* Form Fields */}
            {isRunning && (
              <div className="space-y-4 pt-6 border-t border-slate-800">
                <TimeEntryForm
                  language={language}
                  text={text}
                  caseId={caseId}
                  setCaseId={setCaseId}
                  caseName={caseName}
                  setCaseName={setCaseName}
                  description={description}
                  setDescription={setDescription}
                  activity={activity}
                  setActivity={setActivity}
                  hourlyRate={hourlyRate}
                  setHourlyRate={setHourlyRate}
                  isBillable={isBillable}
                  setIsBillable={setIsBillable}
                />
              </div>
            )}
          </div>
        ) : (
          /* Manual Entry Mode */
          <div className="space-y-6">
            <TimeEntryForm
              language={language}
              text={text}
              caseId={caseId}
              setCaseId={setCaseId}
              caseName={caseName}
              setCaseName={setCaseName}
              description={description}
              setDescription={setDescription}
              activity={activity}
              setActivity={setActivity}
              hourlyRate={hourlyRate}
              setHourlyRate={setHourlyRate}
              isBillable={isBillable}
              setIsBillable={setIsBillable}
            />

            {/* Manual Duration Input */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {text.hours}
                </label>
                <input
                  type="number"
                  min="0"
                  value={manualDuration.hours}
                  onChange={(e) => setManualDuration(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-legal-gold focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {text.minutes}
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={manualDuration.minutes}
                  onChange={(e) => setManualDuration(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-legal-gold focus:border-transparent"
                />
              </div>
            </div>

            {/* Amount Display */}
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <div className="text-sm text-slate-400 mb-1">{text.amount}</div>
              <div className="text-3xl font-bold text-legal-gold">
                {currentAmount.toLocaleString('fr-DZ')} DA
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleManualSave}
                disabled={manualDuration.hours === 0 && manualDuration.minutes === 0}
                className="flex-1 px-6 py-3 bg-legal-gold hover:bg-legal-gold/90 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold transition-all"
              >
                {text.save}
              </button>
              <button
                onClick={() => {
                  setShowManualEntry(false);
                  setManualDuration({ hours: 0, minutes: 0 });
                }}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-medium transition-all"
              >
                {text.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Separate form component to avoid duplication
const TimeEntryForm: React.FC<any> = ({
  language,
  text,
  caseId,
  setCaseId,
  caseName,
  setCaseName,
  description,
  setDescription,
  activity,
  setActivity,
  hourlyRate,
  setHourlyRate,
  isBillable,
  setIsBillable
}) => {
  return (
    <>
      {/* Case Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">
          <FileText className="w-4 h-4 inline mr-2" />
          {text.case}
        </label>
        <input
          type="text"
          value={caseName}
          onChange={(e) => setCaseName(e.target.value)}
          placeholder={text.selectCase}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-legal-gold focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">
          {text.description}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={text.descriptionPlaceholder}
          rows={3}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-legal-gold focus:border-transparent resize-none"
        />
      </div>

      {/* Activity Type */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">
          {text.activity}
        </label>
        <select
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-legal-gold focus:border-transparent"
        >
          {Object.entries(text.activities).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Hourly Rate */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">
          <DollarSign className="w-4 h-4 inline mr-2" />
          {text.hourlyRate}
        </label>
        <input
          type="number"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(parseInt(e.target.value) || 0)}
          min="0"
          step="1000"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-legal-gold focus:border-transparent"
        />
      </div>

      {/* Billable Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsBillable(!isBillable)}
          className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
            isBillable
              ? 'bg-green-600 text-white'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {text.billable}
        </button>
        <button
          onClick={() => setIsBillable(!isBillable)}
          className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
            !isBillable
              ? 'bg-red-600 text-white'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {text.nonBillable}
        </button>
      </div>
    </>
  );
};

export default TimeTracker;
