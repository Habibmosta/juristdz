import React, { useState, useEffect, useCallback } from 'react';
import {
  Gavel, CheckCircle, XCircle, Eye, Clock, Filter,
  ChevronDown, ChevronUp, AlertCircle, RefreshCw,
  User, Calendar, Scale, BookOpen, Tag, FileText
} from 'lucide-react';
import { Language } from '../../types';
import { jurisprudenceService, JurisprudenceEntry } from '../../services/jurisprudenceService';

interface Props {
  adminId: string;
  language: Language;
  theme?: 'light' | 'dark';
}

const STATUS_COLORS: Record<string, string> = {
  pending:      'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
  under_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  validated:    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  rejected:     'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
};

const DOMAIN_LABELS: Record<string, { fr: string; ar: string }> = {
  civil:          { fr: 'Civil',          ar: 'مدني' },
  penal:          { fr: 'Pénal',          ar: 'جنائي' },
  commercial:     { fr: 'Commercial',     ar: 'تجاري' },
  administratif:  { fr: 'Administratif',  ar: 'إداري' },
  travail:        { fr: 'Travail',        ar: 'عمل' },
  famille:        { fr: 'Famille',        ar: 'أسرة' },
  immobilier:     { fr: 'Immobilier',     ar: 'عقاري' },
  fiscal:         { fr: 'Fiscal',         ar: 'ضرائب' },
};

const PRECEDENT_COLORS: Record<string, string> = {
  binding:    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  persuasive: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
  informative:'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
};

const JurisprudenceValidationPanel: React.FC<Props> = ({ adminId, language, theme = 'light' }) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  const [entries, setEntries] = useState<JurisprudenceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review' | 'validated' | 'rejected'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, under_review: 0, validated: 0, rejected: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../../src/lib/supabase');
      const { data } = await supabase
        .from('jurisprudence')
        .select('*')
        .order('created_at', { ascending: true });

      const all = (data || []) as JurisprudenceEntry[];
      setEntries(all);
      setStats({
        pending:      all.filter(e => e.status === 'pending').length,
        under_review: all.filter(e => e.status === 'under_review').length,
        validated:    all.filter(e => e.status === 'validated').length,
        rejected:     all.filter(e => e.status === 'rejected').length,
      });
    } catch (err) {
      console.error('JurisprudenceValidationPanel load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? entries : entries.filter(e => e.status === filter);

  const handleValidate = async (id: string) => {
    setActionLoading(id);
    try {
      await jurisprudenceService.validate(id, adminId);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setActionLoading(id);
    try {
      await jurisprudenceService.reject(id, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkUnderReview = async (id: string) => {
    setActionLoading(id);
    try {
      const { supabase } = await import('../../src/lib/supabase');
      await supabase.from('jurisprudence').update({ status: 'under_review' }).eq('id', id);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const cardClass = `border rounded-2xl overflow-hidden transition-all ${
    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
  }`;

  const inputClass = `w-full p-3 border rounded-xl text-sm focus:outline-none focus:border-red-500 ${
    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'
  }`;

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Header + Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gavel className="text-red-600" size={22} />
            {isAr ? 'التحقق من الاجتهاد القضائي' : 'Validation Jurisprudentielle'}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isAr ? 'مراجعة وتحقق من المساهمات قبل النشر' : 'Examinez et validez les contributions avant publication'}
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {isAr ? 'تحديث' : 'Actualiser'}
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'pending',      label_fr: 'En attente',    label_ar: 'في الانتظار',  color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { key: 'under_review', label_fr: 'En révision',   label_ar: 'قيد المراجعة', color: 'text-blue-600',  bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { key: 'validated',    label_fr: 'Validées',      label_ar: 'محققة',         color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { key: 'rejected',     label_fr: 'Rejetées',      label_ar: 'مرفوضة',        color: 'text-red-600',   bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key as any)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              filter === s.key
                ? `${s.bg} border-current ${s.color}`
                : `${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} hover:border-slate-300`
            }`}
          >
            <div className={`text-2xl font-bold ${s.color}`}>{stats[s.key as keyof typeof stats]}</div>
            <div className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isAr ? s.label_ar : s.label_fr}
            </div>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-slate-400" />
        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {filtered.length} {isAr ? 'نتيجة' : 'entrée(s)'}
        </span>
        {filter !== 'all' && (
          <button onClick={() => setFilter('all')} className="text-xs text-red-600 hover:underline ml-2">
            {isAr ? 'عرض الكل' : 'Voir tout'}
          </button>
        )}
      </div>

      {/* Entries list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <RefreshCw size={32} className="mx-auto animate-spin mb-3" />
          {isAr ? 'جاري التحميل...' : 'Chargement...'}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Gavel size={48} className="mx-auto text-slate-300 mb-3" />
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isAr ? 'لا توجد مساهمات في هذه الفئة' : 'Aucune contribution dans cette catégorie'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(entry => {
            const isExpanded = expandedId === entry.id;
            const isRejecting = rejectingId === entry.id;
            const domainLabel = DOMAIN_LABELS[entry.legal_domain];

            return (
              <div key={entry.id} className={cardClass}>
                {/* Card header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[entry.status]}`}>
                          {entry.status === 'pending'      ? (isAr ? 'في الانتظار' : 'En attente') :
                           entry.status === 'under_review' ? (isAr ? 'قيد المراجعة' : 'En révision') :
                           entry.status === 'validated'    ? (isAr ? 'محقق' : 'Validé') :
                                                             (isAr ? 'مرفوض' : 'Rejeté')}
                        </span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${PRECEDENT_COLORS[entry.precedent_value]}`}>
                          {entry.precedent_value === 'binding'    ? (isAr ? 'ملزم' : 'Contraignant') :
                           entry.precedent_value === 'persuasive' ? (isAr ? 'مقنع' : 'Persuasif') :
                                                                    (isAr ? 'إعلامي' : 'Informatif')}
                        </span>
                        {domainLabel && (
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            <Scale size={10} className="inline mr-1" />
                            {isAr ? domainLabel.ar : domainLabel.fr}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                          {entry.source === 'official' ? '🏛️ Officiel' : `👤 ${entry.contributor_role || 'Contributeur'}`}
                        </span>
                      </div>

                      {/* Case number + court */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`font-mono font-bold text-sm px-2 py-1 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                          {entry.case_number}
                        </span>
                        <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {entry.court_name}
                        </span>
                      </div>

                      {/* Meta */}
                      <div className={`flex flex-wrap gap-4 text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(entry.decision_date).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {isAr ? 'أُضيف' : 'Soumis le'} {new Date(entry.created_at).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR')}
                        </span>
                      </div>

                      {/* Summary preview */}
                      <p className={`text-sm leading-relaxed line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {entry.summary_fr}
                      </p>

                      {/* Keywords */}
                      {entry.keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {entry.keywords.slice(0, 4).map((kw, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded-full">
                              <Tag size={9} />{kw}
                            </span>
                          ))}
                          {entry.keywords.length > 4 && (
                            <span className="text-xs text-slate-400">+{entry.keywords.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex-shrink-0"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>

                  {/* Action buttons */}
                  {entry.status !== 'validated' && entry.status !== 'rejected' && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      {entry.status === 'pending' && (
                        <button
                          onClick={() => handleMarkUnderReview(entry.id)}
                          disabled={actionLoading === entry.id}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          <Eye size={14} />
                          {isAr ? 'بدء المراجعة' : 'Mettre en révision'}
                        </button>
                      )}
                      <button
                        onClick={() => handleValidate(entry.id)}
                        disabled={actionLoading === entry.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={14} />
                        {actionLoading === entry.id ? '...' : (isAr ? 'تحقق ونشر' : 'Valider & Publier')}
                      </button>
                      <button
                        onClick={() => setRejectingId(isRejecting ? null : entry.id)}
                        disabled={actionLoading === entry.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        {isAr ? 'رفض' : 'Rejeter'}
                      </button>
                    </div>
                  )}

                  {/* Rejection reason input */}
                  {isRejecting && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        rows={2}
                        className={inputClass}
                        placeholder={isAr ? 'سبب الرفض (إلزامي)...' : 'Motif du rejet (obligatoire)...'}
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(entry.id)}
                          disabled={!rejectReason.trim() || actionLoading === entry.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                        >
                          {isAr ? 'تأكيد الرفض' : 'Confirmer le rejet'}
                        </button>
                        <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                          {isAr ? 'إلغاء' : 'Annuler'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rejection reason display */}
                  {entry.status === 'rejected' && entry.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{entry.rejection_reason}</span>
                    </div>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className={`border-t p-5 space-y-4 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                    {entry.summary_ar && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <BookOpen size={12} /> {isAr ? 'الملخص بالعربية' : 'Résumé en arabe'}
                        </h4>
                        <p className="text-sm leading-relaxed" dir="rtl">{entry.summary_ar}</p>
                      </div>
                    )}
                    {entry.full_text_fr && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <FileText size={12} /> {isAr ? 'النص الكامل' : 'Texte intégral'}
                        </h4>
                        <div className={`text-sm leading-relaxed max-h-48 overflow-y-auto p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                          {entry.full_text_fr}
                        </div>
                      </div>
                    )}
                    {entry.legal_references?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {isAr ? 'المراجع القانونية' : 'Références légales'}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {entry.legal_references.map((ref, i) => (
                            <span key={i} className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs rounded font-mono">
                              {ref}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {entry.cited_decisions?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {isAr ? 'القرارات المستشهد بها' : 'Décisions citées'}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {entry.cited_decisions.map((cd, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded font-mono">
                              {cd}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JurisprudenceValidationPanel;
