import React, { useState, useRef } from 'react';
import { X, Gavel, Plus, Trash2, Send, AlertCircle, CheckCircle, Upload, Scan, Loader2, FileText, Eye } from 'lucide-react';
import { Language } from '../../types';
import { jurisprudenceService, ContributionPayload, PrecedentValue } from '../../services/jurisprudenceService';
import { performOcr, extractFieldsFromText } from '../../services/ocrService';

interface Props {
  userId: string;
  userRole?: string;
  language: Language;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onSuccess?: () => void;
}

const JURISDICTIONS = [
  { value: 'cour_supreme', label_fr: 'Cour Suprême', label_ar: 'المحكمة العليا' },
  { value: 'conseil_etat', label_fr: 'Conseil d\'État', label_ar: 'مجلس الدولة' },
  { value: 'tribunal_administratif', label_fr: 'Tribunal Administratif', label_ar: 'المحكمة الإدارية' },
  { value: 'cour_appel', label_fr: 'Cour d\'Appel', label_ar: 'محكمة الاستئناف' },
  { value: 'tribunal', label_fr: 'Tribunal', label_ar: 'المحكمة الابتدائية' },
  { value: 'tribunal_commerce', label_fr: 'Tribunal de Commerce', label_ar: 'المحكمة التجارية' },
];

const DOMAINS = [
  { value: 'civil', label_fr: 'Civil', label_ar: 'مدني' },
  { value: 'penal', label_fr: 'Pénal', label_ar: 'جنائي' },
  { value: 'commercial', label_fr: 'Commercial', label_ar: 'تجاري' },
  { value: 'administratif', label_fr: 'Administratif', label_ar: 'إداري' },
  { value: 'travail', label_fr: 'Travail', label_ar: 'عمل' },
  { value: 'famille', label_fr: 'Famille', label_ar: 'أسرة' },
  { value: 'immobilier', label_fr: 'Immobilier', label_ar: 'عقاري' },
  { value: 'fiscal', label_fr: 'Fiscal', label_ar: 'ضرائب' },
];

const PRECEDENT_VALUES: { value: PrecedentValue; label_fr: string; label_ar: string; color: string }[] = [
  { value: 'binding', label_fr: 'Contraignant', label_ar: 'ملزم', color: 'text-red-600' },
  { value: 'persuasive', label_fr: 'Persuasif', label_ar: 'مقنع', color: 'text-amber-600' },
  { value: 'informative', label_fr: 'Informatif', label_ar: 'إعلامي', color: 'text-blue-600' },
];

const ContributeJurisprudenceModal: React.FC<Props> = ({
  userId, userRole, language, theme = 'light', onClose, onSuccess
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<{ text: string; language: string; confidence: number; pages?: number } | null>(null);
  const [showOcrText, setShowOcrText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState<Partial<ContributionPayload>>({
    jurisdiction: '',
    legal_domain: '',
    precedent_value: 'informative',
    keywords: [],
    legal_references: [],
    cited_decisions: [],
    contributor_role: userRole || '',
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [refInput, setRefInput] = useState('');
  const [citedInput, setCitedInput] = useState('');

  const set = (field: keyof ContributionPayload, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const addTag = (field: 'keywords' | 'legal_references' | 'cited_decisions', value: string) => {
    if (!value.trim()) return;
    set(field, [...(form[field] || []), value.trim()]);
  };

  const removeTag = (field: 'keywords' | 'legal_references' | 'cited_decisions', index: number) => {
    set(field, (form[field] || []).filter((_, i) => i !== index));
  };

  const isStep1Valid = form.case_number && form.decision_date && form.jurisdiction && form.court_name && form.legal_domain;
  const isStep2Valid = form.summary_fr && form.summary_fr.length >= 50;

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/tiff', 'image/bmp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setError(isAr ? 'صيغة الملف غير مدعومة. استخدم JPG، PNG، TIFF أو PDF.' : 'Format non supporté. Utilisez JPG, PNG, TIFF ou PDF.');
      return;
    }

    setOcrLoading(true);
    setError(null);
    try {
      const result = await performOcr(file);
      setOcrResult(result);

      // Auto-fill form fields from extracted text
      const extracted = extractFieldsFromText(result.text);

      setForm(prev => ({
        ...prev,
        case_number:       extracted.case_number      || prev.case_number,
        decision_date:     extracted.decision_date    || prev.decision_date,
        court_name:        extracted.court_name       || prev.court_name,
        summary_fr:        extracted.summary_fr       || prev.summary_fr,
        summary_ar:        extracted.summary_ar       || prev.summary_ar,
        legal_references:  extracted.legal_references?.length
                             ? [...new Set([...(prev.legal_references || []), ...extracted.legal_references])]
                             : prev.legal_references,
        keywords:          extracted.keywords?.length
                             ? [...new Set([...(prev.keywords || []), ...extracted.keywords])]
                             : prev.keywords,
      }));

    } catch (err: any) {
      setError(isAr
        ? `فشل التعرف الضوئي على النص: ${err.message}`
        : `Échec de l'OCR : ${err.message}`);
    } finally {
      setOcrLoading(false);
      // Reset input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await jurisprudenceService.contribute(userId, form as ContributionPayload);
      setSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `w-full p-3 border rounded-xl focus:outline-none focus:border-legal-blue text-sm ${
    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
  }`;
  const labelClass = `block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className={`w-full max-w-md rounded-2xl p-8 text-center ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
          <CheckCircle size={56} className="mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">
            {isAr ? 'تم الإرسال بنجاح' : 'Contribution soumise'}
          </h3>
          <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isAr
              ? 'ستتم مراجعة مساهمتك من قبل فريق التحرير قبل نشرها.'
              : 'Votre contribution sera examinée par le comité éditorial avant publication.'}
          </p>
          <button onClick={onClose} className="px-6 py-3 bg-legal-blue text-white rounded-xl font-bold">
            {isAr ? 'إغلاق' : 'Fermer'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] ${isDark ? 'bg-slate-900' : 'bg-white'}`}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Gavel className="text-legal-blue" size={24} />
            <div>
              <h2 className="font-bold text-lg">
                {isAr ? 'المساهمة في قاعدة الاجتهاد القضائي' : 'Contribuer à la base jurisprudentielle'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isAr ? 'أضف قراراً قضائياً للمراجعة والنشر' : 'Soumettez une décision pour validation et publication'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* OCR Upload Zone */}
        <div className={`mx-6 mt-4 rounded-2xl border-2 border-dashed transition-colors ${
          ocrLoading
            ? 'border-legal-blue bg-blue-50 dark:bg-blue-900/10'
            : 'border-slate-200 dark:border-slate-700 hover:border-legal-blue'
        }`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/tiff,image/bmp,application/pdf"
            onChange={handleOcrUpload}
            className="hidden"
            id="ocr-upload"
          />
          <label htmlFor="ocr-upload" className={`flex items-center gap-3 p-4 cursor-pointer ${ocrLoading ? 'cursor-wait' : ''}`}>
            <div className={`p-2 rounded-xl flex-shrink-0 ${ocrLoading ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
              {ocrLoading
                ? <Loader2 size={20} className="text-legal-blue animate-spin" />
                : <Scan size={20} className="text-slate-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {ocrLoading
                  ? (isAr ? 'جاري التعرف الضوئي على النص...' : 'Reconnaissance de texte en cours...')
                  : (isAr ? 'مسح ضوئي لوثيقة (OCR)' : 'Scanner un document (OCR)')}
              </p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isAr
                  ? 'ارفع صورة أو PDF — سيتم استخراج البيانات تلقائياً (عربي + فرنسي)'
                  : 'Importez une image ou PDF — les champs seront remplis automatiquement (AR + FR)'}
              </p>
            </div>
            {!ocrLoading && (
              <Upload size={16} className="text-slate-400 flex-shrink-0" />
            )}
          </label>

          {/* OCR result banner */}
          {ocrResult && !ocrLoading && (
            <div className="px-4 pb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                <CheckCircle size={14} />
                <span>
                  {isAr ? 'تم الاستخراج' : 'Extraction réussie'} —{' '}
                  {ocrResult.pages} {isAr ? 'صفحة' : 'page(s)'},{' '}
                  {isAr ? 'لغة' : 'langue'}: {ocrResult.language === 'mixed' ? 'AR+FR' : ocrResult.language.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setShowOcrText(!showOcrText)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <Eye size={12} />
                {showOcrText ? (isAr ? 'إخفاء النص' : 'Masquer') : (isAr ? 'عرض النص' : 'Voir texte brut')}
              </button>
            </div>
          )}

          {/* Raw OCR text preview */}
          {showOcrText && ocrResult && (
            <div className={`mx-4 mb-3 p-3 rounded-xl text-xs font-mono max-h-32 overflow-y-auto ${
              isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-600'
            } border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              {ocrResult.text.substring(0, 1000)}{ocrResult.text.length > 1000 ? '...' : ''}
            </div>
          )}
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-6 pt-4">          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 text-sm font-medium ${step >= s ? 'text-legal-blue' : 'text-slate-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > s ? 'bg-green-500 text-white' : step === s ? 'bg-legal-blue text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>{step > s ? '✓' : s}</div>
                <span className="hidden sm:inline">
                  {s === 1 ? (isAr ? 'التعريف' : 'Identification') : s === 2 ? (isAr ? 'المحتوى' : 'Contenu') : (isAr ? 'المراجع' : 'Références')}
                </span>
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* STEP 1 — Identification */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{isAr ? 'رقم القرار *' : 'N° de décision *'}</label>
                  <input className={inputClass} placeholder="CS/Civ/2024/1234"
                    value={form.case_number || ''} onChange={e => set('case_number', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>{isAr ? 'تاريخ القرار *' : 'Date de la décision *'}</label>
                  <input type="date" className={inputClass}
                    value={form.decision_date || ''} onChange={e => set('decision_date', e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelClass}>{isAr ? 'الجهة القضائية *' : 'Juridiction *'}</label>
                <select className={inputClass} value={form.jurisdiction || ''} onChange={e => set('jurisdiction', e.target.value)}>
                  <option value="">{isAr ? '-- اختر --' : '-- Choisir --'}</option>
                  {JURISDICTIONS.map(j => (
                    <option key={j.value} value={j.value}>{isAr ? j.label_ar : j.label_fr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>{isAr ? 'اسم المحكمة *' : 'Nom de la juridiction *'}</label>
                <input className={inputClass} placeholder={isAr ? 'مثال: المحكمة العليا — الغرفة المدنية' : 'Ex: Cour Suprême — Chambre Civile'}
                  value={form.court_name || ''} onChange={e => set('court_name', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{isAr ? 'المجال القانوني *' : 'Domaine juridique *'}</label>
                  <select className={inputClass} value={form.legal_domain || ''} onChange={e => set('legal_domain', e.target.value)}>
                    <option value="">{isAr ? '-- اختر --' : '-- Choisir --'}</option>
                    {DOMAINS.map(d => (
                      <option key={d.value} value={d.value}>{isAr ? d.label_ar : d.label_fr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{isAr ? 'القيمة السابقة' : 'Valeur jurisprudentielle'}</label>
                  <select className={inputClass} value={form.precedent_value} onChange={e => set('precedent_value', e.target.value as PrecedentValue)}>
                    {PRECEDENT_VALUES.map(p => (
                      <option key={p.value} value={p.value}>{isAr ? p.label_ar : p.label_fr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>{isAr ? 'الولاية (للمحاكم المحلية)' : 'Wilaya (juridictions locales)'}</label>
                <input className={inputClass} placeholder={isAr ? 'مثال: الجزائر' : 'Ex: Alger'}
                  value={form.wilaya || ''} onChange={e => set('wilaya', e.target.value)} />
              </div>
            </>
          )}

          {/* STEP 2 — Contenu */}
          {step === 2 && (
            <>
              <div>
                <label className={labelClass}>{isAr ? 'ملخص القرار (بالفرنسية) *' : 'Résumé de la décision (FR) *'}</label>
                <textarea rows={5} className={inputClass}
                  placeholder={isAr ? 'ملخص القرار بالفرنسية (50 حرف على الأقل)...' : 'Résumé de la décision en français (min. 50 caractères)...'}
                  value={form.summary_fr || ''} onChange={e => set('summary_fr', e.target.value)} />
                <p className={`text-xs mt-1 ${(form.summary_fr?.length || 0) < 50 ? 'text-red-500' : 'text-green-500'}`}>
                  {form.summary_fr?.length || 0} / 50 {isAr ? 'حرف (الحد الأدنى)' : 'caractères (minimum)'}
                </p>
              </div>

              <div>
                <label className={labelClass}>{isAr ? 'ملخص القرار (بالعربية)' : 'Résumé de la décision (AR) — optionnel'}</label>
                <textarea rows={4} className={inputClass} dir="rtl"
                  placeholder="ملخص القرار بالعربية..."
                  value={form.summary_ar || ''} onChange={e => set('summary_ar', e.target.value)} />
              </div>

              <div>
                <label className={labelClass}>{isAr ? 'النص الكامل (بالفرنسية) — اختياري' : 'Texte intégral (FR) — optionnel'}</label>
                <textarea rows={6} className={inputClass}
                  placeholder={isAr ? 'النص الكامل للقرار...' : 'Texte intégral de la décision...'}
                  value={form.full_text_fr || ''} onChange={e => set('full_text_fr', e.target.value)} />
              </div>
            </>
          )}

          {/* STEP 3 — Références */}
          {step === 3 && (
            <>
              {/* Mots-clés */}
              <div>
                <label className={labelClass}>{isAr ? 'الكلمات المفتاحية' : 'Mots-clés'}</label>
                <div className="flex gap-2 mb-2">
                  <input className={`${inputClass} flex-1`}
                    placeholder={isAr ? 'أضف كلمة مفتاحية...' : 'Ajouter un mot-clé...'}
                    value={keywordInput} onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { addTag('keywords', keywordInput); setKeywordInput(''); }}} />
                  <button onClick={() => { addTag('keywords', keywordInput); setKeywordInput(''); }}
                    className="px-3 py-2 bg-legal-blue text-white rounded-xl">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(form.keywords || []).map((kw, i) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                      {kw}
                      <button onClick={() => removeTag('keywords', i)}><Trash2 size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Références légales */}
              <div>
                <label className={labelClass}>{isAr ? 'المراجع القانونية' : 'Références légales'}</label>
                <div className="flex gap-2 mb-2">
                  <input className={`${inputClass} flex-1`}
                    placeholder="Ex: Art. 176 C.Civ, Loi 90-11..."
                    value={refInput} onChange={e => setRefInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { addTag('legal_references', refInput); setRefInput(''); }}} />
                  <button onClick={() => { addTag('legal_references', refInput); setRefInput(''); }}
                    className="px-3 py-2 bg-legal-blue text-white rounded-xl">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(form.legal_references || []).map((ref, i) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs rounded-full font-mono">
                      {ref}
                      <button onClick={() => removeTag('legal_references', i)}><Trash2 size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Décisions citées */}
              <div>
                <label className={labelClass}>{isAr ? 'القرارات المستشهد بها' : 'Décisions citées'}</label>
                <div className="flex gap-2 mb-2">
                  <input className={`${inputClass} flex-1`}
                    placeholder="Ex: CS/Civ/2020/1234"
                    value={citedInput} onChange={e => setCitedInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { addTag('cited_decisions', citedInput); setCitedInput(''); }}} />
                  <button onClick={() => { addTag('cited_decisions', citedInput); setCitedInput(''); }}
                    className="px-3 py-2 bg-legal-blue text-white rounded-xl">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(form.cited_decisions || []).map((cd, i) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full font-mono">
                      {cd}
                      <button onClick={() => removeTag('cited_decisions', i)}><Trash2 size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Notice */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-800 dark:text-blue-300">
                <AlertCircle size={16} className="inline mr-2" />
                {isAr
                  ? 'ستخضع مساهمتك لمراجعة من قبل لجنة تحريرية قبل نشرها في قاعدة البيانات.'
                  : 'Votre contribution sera soumise à un comité éditorial avant publication dans la base de données.'}
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => step > 1 ? setStep((step - 1) as 1 | 2 | 3) : onClose()}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {step === 1 ? (isAr ? 'إلغاء' : 'Annuler') : (isAr ? 'السابق' : 'Précédent')}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as 2 | 3)}
              disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
              className="px-6 py-2 bg-legal-blue text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAr ? 'التالي' : 'Suivant'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <Send size={16} />
              {submitting ? (isAr ? 'جاري الإرسال...' : 'Envoi...') : (isAr ? 'إرسال للمراجعة' : 'Soumettre pour validation')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContributeJurisprudenceModal;
