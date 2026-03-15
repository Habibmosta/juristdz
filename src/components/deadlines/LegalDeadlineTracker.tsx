import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, AlertTriangle, CheckCircle2, Plus, Trash2,
  Filter, Calendar, BookOpen, ChevronDown, X, Bell
} from 'lucide-react';
import {
  legalDeadlineService,
  ALGERIAN_LEGAL_DEADLINES,
  LegalDeadline,
  DeadlineCategory,
  DeadlinePriority,
  calculateDeadlineDate,
} from '../../services/legalDeadlineService';
import { Language } from '../../../types';

interface Props {
  language: Language;
  userId: string;
}

const CATEGORY_LABELS: Record<DeadlineCategory, { fr: string; ar: string }> = {
  appel:         { fr: 'Appel',           ar: 'استئناف' },
  cassation:     { fr: 'Cassation',       ar: 'نقض' },
  opposition:    { fr: 'Opposition',      ar: 'معارضة' },
  prescription:  { fr: 'Prescription',   ar: 'تقادم' },
  signification: { fr: 'Signification',  ar: 'تبليغ' },
  execution:     { fr: 'Exécution',      ar: 'تنفيذ' },
  administratif: { fr: 'Administratif',  ar: 'إداري' },
  penal:         { fr: 'Pénal',          ar: 'جزائي' },
  custom:        { fr: 'Personnalisé',   ar: 'مخصص' },
};

const STATUS_CONFIG = {
  overdue:   { bg: 'bg-red-900/30',    border: 'border-red-700',    text: 'text-red-400',    label_fr: 'Dépassé',  label_ar: 'منتهي' },
  urgent:    { bg: 'bg-orange-900/30', border: 'border-orange-700', text: 'text-orange-400', label_fr: 'Urgent',   label_ar: 'عاجل' },
  upcoming:  { bg: 'bg-slate-800/50',  border: 'border-slate-700',  text: 'text-slate-400',  label_fr: 'À venir',  label_ar: 'قادم' },
  completed: { bg: 'bg-green-900/20',  border: 'border-green-800',  text: 'text-green-500',  label_fr: 'Terminé', label_ar: 'مكتمل' },
};

const PRESET_KEYS = Object.keys(ALGERIAN_LEGAL_DEADLINES) as (keyof typeof ALGERIAN_LEGAL_DEADLINES)[];

export default function LegalDeadlineTracker({ language, userId }: Props) {
  const isAr = language === 'ar';
  const [deadlines, setDeadlines] = useState<LegalDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  const [baseDate, setBaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [caseTitle, setCaseTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await legalDeadlineService.getAll(userId);
      setDeadlines(data);
    } catch (e) {
      setError(isAr ? 'خطأ في تحميل المواعيد' : 'Erreur lors du chargement des délais');
    } finally {
      setLoading(false);
    }
  }, [userId, isAr]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPreset && !customTitle) return;
    setSubmitting(true);
    try {
      const preset = selectedPreset ? ALGERIAN_LEGAL_DEADLINES[selectedPreset as keyof typeof ALGERIAN_LEGAL_DEADLINES] : null;
      await legalDeadlineService.create(userId, {
        title: preset ? preset.label_fr : customTitle,
        title_ar: preset ? preset.label_ar : undefined,
        category: preset ? preset.category : 'custom',
        base_date: baseDate,
        days_total: preset ? preset.days : 30,
        legal_reference: preset ? preset.reference : undefined,
        priority: preset ? preset.priority : 'medium' as DeadlinePriority,
        notes: notes || undefined,
      });
      setShowForm(false);
      setSelectedPreset('');
      setCustomTitle('');
      setNotes('');
      setCaseTitle('');
      await load();
    } catch (e) {
      setError(isAr ? 'خطأ في إضافة الموعد' : 'Erreur lors de l\'ajout');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id: string) => {
    await legalDeadlineService.markCompleted(id);
    await load();
  };

  const handleDelete = async (id: string) => {
    await legalDeadlineService.delete(id);
    await load();
  };

  const filtered = deadlines.filter(d => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    if (filterCategory !== 'all' && d.category !== filterCategory) return false;
    return true;
  });

  const counts = {
    overdue:  deadlines.filter(d => d.status === 'overdue').length,
    urgent:   deadlines.filter(d => d.status === 'urgent').length,
    upcoming: deadlines.filter(d => d.status === 'upcoming').length,
    completed:deadlines.filter(d => d.status === 'completed').length,
  };

  const previewDate = selectedPreset
    ? calculateDeadlineDate(new Date(baseDate), ALGERIAN_LEGAL_DEADLINES[selectedPreset as keyof typeof ALGERIAN_LEGAL_DEADLINES].days)
        .toLocaleDateString(isAr ? 'ar-DZ' : 'fr-DZ')
    : null;

  return (
    <div className={`min-h-screen bg-slate-950 text-white p-4 md:p-6 ${isAr ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-900/30 rounded-xl border border-orange-700/50">
            <Clock className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {isAr ? 'متابعة المواعيد القانونية' : 'Délais Légaux'}
            </h1>
            <p className="text-xs text-slate-400">
              {isAr ? 'المواعيد الإجرائية الجزائرية' : 'Procédures algériennes — CPCA / CPP / Code Civil'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isAr ? 'إضافة موعد' : 'Ajouter'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { key: 'overdue',   icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-900/20',    border: 'border-red-800',    label_fr: 'Dépassés',  label_ar: 'منتهية' },
          { key: 'urgent',    icon: Bell,          color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-800', label_fr: 'Urgents',   label_ar: 'عاجلة' },
          { key: 'upcoming',  icon: Clock,         color: 'text-blue-400',   bg: 'bg-blue-900/20',   border: 'border-blue-800',   label_fr: 'À venir',   label_ar: 'قادمة' },
          { key: 'completed', icon: CheckCircle2,  color: 'text-green-400',  bg: 'bg-green-900/20',  border: 'border-green-800',  label_fr: 'Terminés',  label_ar: 'مكتملة' },
        ].map(({ key, icon: Icon, color, bg, border, label_fr, label_ar }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
            className={`${bg} border ${border} rounded-xl p-3 text-left transition-all hover:scale-105 ${filterStatus === key ? 'ring-2 ring-white/20' : ''}`}
          >
            <Icon className={`w-5 h-5 ${color} mb-1`} />
            <div className={`text-2xl font-bold ${color}`}>{counts[key as keyof typeof counts]}</div>
            <div className="text-xs text-slate-400">{isAr ? label_ar : label_fr}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300"
        >
          <option value="all">{isAr ? 'كل الفئات' : 'Toutes catégories'}</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{isAr ? v.ar : v.fr}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-red-300 text-sm">{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4 text-red-400" /></button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Clock className="w-6 h-6 animate-spin mr-2" />
          {isAr ? 'جاري التحميل...' : 'Chargement...'}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{isAr ? 'لا توجد مواعيد' : 'Aucun délai enregistré'}</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-orange-400 text-sm hover:underline">
            {isAr ? '+ إضافة أول موعد' : '+ Ajouter le premier délai'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => {
            const cfg = STATUS_CONFIG[d.status];
            return (
              <div key={d.id} className={`${cfg.bg} border ${cfg.border} rounded-xl p-4 flex items-start gap-4`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.border} ${cfg.text}`}>
                      {isAr ? cfg.label_ar : cfg.label_fr}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                      {isAr ? CATEGORY_LABELS[d.category]?.ar : CATEGORY_LABELS[d.category]?.fr}
                    </span>
                    {d.legal_reference && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />{d.legal_reference}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-sm">{isAr && d.title_ar ? d.title_ar : d.title}</p>
                  {d.case_title && <p className="text-xs text-slate-400 mt-0.5">{d.case_title}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(d.deadline_date).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-DZ')}
                    </span>
                    <span className={`font-semibold ${cfg.text}`}>
                      {d.status === 'completed'
                        ? (isAr ? 'مكتمل' : 'Terminé')
                        : d.days_remaining < 0
                          ? `${Math.abs(d.days_remaining)}j ${isAr ? 'تأخر' : 'de retard'}`
                          : `${d.days_remaining}j ${isAr ? 'متبقية' : 'restants'}`
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {d.status !== 'completed' && (
                    <button
                      onClick={() => handleComplete(d.id)}
                      title={isAr ? 'تم' : 'Marquer terminé'}
                      className="p-1.5 rounded-lg bg-green-900/30 hover:bg-green-800/50 text-green-400 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(d.id)}
                    title={isAr ? 'حذف' : 'Supprimer'}
                    className="p-1.5 rounded-lg bg-red-900/20 hover:bg-red-800/40 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="font-bold text-lg">
                {isAr ? 'إضافة موعد قانوني' : 'Nouveau délai légal'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Preset selector */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  {isAr ? 'نوع الموعد القانوني' : 'Type de délai légal'}
                </label>
                <select
                  value={selectedPreset}
                  onChange={e => setSelectedPreset(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
                >
                  <option value="">{isAr ? 'موعد مخصص...' : 'Délai personnalisé...'}</option>
                  {PRESET_KEYS.map(key => {
                    const p = ALGERIAN_LEGAL_DEADLINES[key];
                    return (
                      <option key={key} value={key}>
                        {isAr ? p.label_ar : p.label_fr} — {p.days}j ({p.reference})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Custom title if no preset */}
              {!selectedPreset && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    {isAr ? 'عنوان الموعد' : 'Intitulé du délai'}
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    required={!selectedPreset}
                    placeholder={isAr ? 'مثال: طعن في الحكم' : 'Ex: Appel du jugement du 10/03/2026'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500"
                  />
                </div>
              )}

              {/* Base date */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  {isAr ? 'تاريخ البداية (تاريخ الحكم / التبليغ)' : 'Date de départ (jugement / signification)'}
                </label>
                <input
                  type="date"
                  value={baseDate}
                  onChange={e => setBaseDate(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
                />
              </div>

              {/* Preview */}
              {previewDate && (
                <div className="bg-orange-900/20 border border-orange-700/50 rounded-xl p-3 text-sm">
                  <span className="text-slate-400">{isAr ? 'تاريخ الانتهاء: ' : 'Date limite calculée : '}</span>
                  <span className="text-orange-300 font-semibold">{previewDate}</span>
                  <span className="text-slate-500 text-xs ml-2">
                    ({ALGERIAN_LEGAL_DEADLINES[selectedPreset as keyof typeof ALGERIAN_LEGAL_DEADLINES]?.days}j)
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  {isAr ? 'ملاحظات (اختياري)' : 'Notes (optionnel)'}
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none"
                  placeholder={isAr ? 'ملاحظات إضافية...' : 'Informations complémentaires...'}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!selectedPreset && !customTitle)}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
                >
                  {submitting ? '...' : (isAr ? 'إضافة' : 'Ajouter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
