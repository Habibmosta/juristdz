import React, { useState, useEffect, useCallback } from 'react';
import {
  Gavel, Plus, Search, CheckCircle2, XCircle,
  Trash2, X, Clock, DollarSign, Calculator, Download
} from 'lucide-react';
import { pdfExportService } from '../../services/pdfExportService';
import {
  bailiffService, BailiffExploit, ExploitType, ExploitStatus,
  EXPLOIT_TYPE_LABELS, EXPLOIT_STATUS_CONFIG,
  calculateBailiffFees,
} from '../../services/bailiffService';
import { Language } from '../../../types';

interface Props { language: Language; userId: string; }

export default function BailiffRegistry({ language, userId }: Props) {
  const isAr = language === 'ar';
  const [exploits, setExploits] = useState<BailiffExploit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [showFeeCalc, setShowFeeCalc] = useState(false);
  const [nextNumber, setNextNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ total: 0, executed: 0, pending: 0, failed: 0, totalFees: 0 });

  // Fee calculator state
  const [calcType, setCalcType] = useState<ExploitType>('signification_jugement');
  const [calcDistance, setCalcDistance] = useState('0');
  const [calcAmount, setCalcAmount] = useState('0');

  const [form, setForm] = useState({
    exploit_type: 'signification_jugement' as ExploitType,
    requester_name: '',
    requester_address: '',
    recipient_name: '',
    recipient_address: '',
    recipient_nin: '',
    exploit_date: new Date().toISOString().split('T')[0],
    court_reference: '',
    case_description: '',
    amount_claimed: '',
    bailiff_fees: '',
    travel_fees: '',
    notes: '',
    status: 'pending' as ExploitStatus,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [data, s] = await Promise.all([
        bailiffService.getAll(userId),
        bailiffService.getStats(userId),
      ]);
      setExploits(data);
      setStats(s);
    } catch { setError(isAr ? 'خطأ في التحميل' : 'Erreur de chargement'); }
    finally { setLoading(false); }
  }, [userId, isAr]);

  useEffect(() => { load(); }, [load]);

  const openForm = async () => {
    try {
      const { exploit_num } = await bailiffService.getNextNumber(userId);
      setNextNumber(exploit_num);
    } catch { setNextNumber('E/—'); }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await bailiffService.create(userId, {
        ...form,
        amount_claimed: form.amount_claimed ? Number(form.amount_claimed) : undefined,
        bailiff_fees: form.bailiff_fees ? Number(form.bailiff_fees) : undefined,
        travel_fees: form.travel_fees ? Number(form.travel_fees) : undefined,
      });
      setShowForm(false);
      await load();
    } catch (e: any) {
      setError(e.message || (isAr ? 'خطأ في الإضافة' : 'Erreur'));
    } finally { setSubmitting(false); }
  };

  const handleStatus = async (id: string, status: ExploitStatus) => {
    const details = status === 'executed' ? { execution_date: new Date().toISOString().split('T')[0] } : undefined;
    await bailiffService.updateStatus(id, status, details);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? 'حذف هذا المحضر؟' : 'Supprimer cet exploit ?')) return;
    await bailiffService.delete(id);
    await load();
  };

  const filtered = exploits.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.exploit_number.toLowerCase().includes(q)
      || e.recipient_name.toLowerCase().includes(q)
      || e.requester_name.toLowerCase().includes(q);
    return matchSearch
      && (filterStatus === 'all' || e.status === filterStatus)
      && (filterType === 'all' || e.exploit_type === filterType);
  });

  const feeCalcResult = calculateBailiffFees(calcType, Number(calcDistance) || 0, Number(calcAmount) || 0);
  const formatDA = (n: number) => `${Math.round(n).toLocaleString('fr-DZ')} DA`;

  const exportExploitPdf = (ex: BailiffExploit) => {
    const typeLabel = isAr ? EXPLOIT_TYPE_LABELS[ex.exploit_type]?.ar : EXPLOIT_TYPE_LABELS[ex.exploit_type]?.fr;
    const cfg = EXPLOIT_STATUS_CONFIG[ex.status];
    const content = [
      `${isAr ? 'رقم المحضر' : 'Numéro d\'exploit'}: ${ex.exploit_number}`,
      `${isAr ? 'النوع' : 'Type'}: ${typeLabel}`,
      `${isAr ? 'الحالة' : 'Statut'}: ${isAr ? cfg.ar : cfg.fr}`,
      `${isAr ? 'التاريخ' : 'Date'}: ${new Date(ex.exploit_date).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-DZ')}`,
      '',
      `${isAr ? 'الطالب (المُوكِّل)' : 'Requérant'}: ${ex.requester_name}`,
      ex.requester_address ? `${isAr ? 'عنوان الطالب' : 'Adresse requérant'}: ${ex.requester_address}` : '',
      '',
      `${isAr ? 'المُبلَّغ إليه' : 'Destinataire'}: ${ex.recipient_name}`,
      `${isAr ? 'عنوان المُبلَّغ' : 'Adresse destinataire'}: ${ex.recipient_address}`,
      ex.recipient_nin ? `NIN: ${ex.recipient_nin}` : '',
      '',
      ex.court_reference ? `${isAr ? 'مرجع الحكم' : 'Référence jugement'}: ${ex.court_reference}` : '',
      ex.case_description ? `${isAr ? 'وصف القضية' : 'Description'}: ${ex.case_description}` : '',
      '',
      ex.amount_claimed ? `${isAr ? 'المبلغ المطالب به' : 'Montant réclamé'}: ${ex.amount_claimed.toLocaleString('fr-DZ')} DA` : '',
      ex.bailiff_fees ? `${isAr ? 'أتعاب الحضور' : 'Émoluments'}: ${ex.bailiff_fees.toLocaleString('fr-DZ')} DA` : '',
      ex.travel_fees ? `${isAr ? 'مصاريف التنقل' : 'Frais déplacement'}: ${ex.travel_fees.toLocaleString('fr-DZ')} DA` : '',
      ex.notes ? `\n${isAr ? 'ملاحظات' : 'Notes'}: ${ex.notes}` : '',
    ].filter(Boolean).join('\n');

    pdfExportService.exportDocument({
      title: `${typeLabel} — ${ex.exploit_number}`,
      content,
      language: isAr ? 'ar' : 'fr',
      date: new Date(ex.exploit_date),
      footer: `JuristDZ — ${isAr ? 'سجل المحاضر والإجراءات' : 'Registre des Exploits'}`,
    });
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-white p-4 md:p-6 ${isAr ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-900/30 rounded-xl border border-green-700/50">
            <Gavel className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{isAr ? 'سجل المحاضر والإجراءات' : 'Registre des Exploits'}</h1>
            <p className="text-xs text-slate-400">{isAr ? 'الترقيم التلقائي — السنة الجارية' : `Numérotation automatique — ${new Date().getFullYear()}`}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFeeCalc(!showFeeCalc)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm transition-colors"
          >
            <Calculator className="w-4 h-4 text-green-400" />
            {isAr ? 'حساب الأتعاب' : 'Calculer frais'}
          </button>
          <button
            onClick={openForm}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isAr ? 'محضر جديد' : 'Nouvel exploit'}
          </button>
        </div>
      </div>

      {/* Fee Calculator Panel */}
      {showFeeCalc && (
        <div className="bg-slate-900 border border-green-800/50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            {isAr ? 'حاسبة أتعاب الحضور' : 'Calculateur d\'émoluments'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <select
              value={calcType}
              onChange={e => setCalcType(e.target.value as ExploitType)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            >
              {Object.entries(EXPLOIT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{isAr ? v.ar : v.fr}</option>
              ))}
            </select>
            <input
              type="number"
              value={calcDistance}
              onChange={e => setCalcDistance(e.target.value)}
              placeholder={isAr ? 'المسافة (كم)' : 'Distance (km)'}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
            />
            <input
              type="number"
              value={calcAmount}
              onChange={e => setCalcAmount(e.target.value)}
              placeholder={isAr ? 'المبلغ المطالب به (دج)' : 'Montant réclamé (DA)'}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {feeCalcResult.breakdown.map((b, i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-2 text-xs">
                <p className="text-slate-400 truncate">{isAr ? b.label_ar : b.label_fr}</p>
                <p className="text-white font-medium mt-0.5">{formatDA(b.amount)}</p>
              </div>
            ))}
            <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-2 text-xs">
              <p className="text-green-400">{isAr ? 'المجموع' : 'TOTAL TTC'}</p>
              <p className="text-green-300 font-bold mt-0.5">{formatDA(feeCalcResult.total)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label_fr: 'Total', label_ar: 'الإجمالي', value: stats.total, color: 'text-white', bg: 'bg-slate-800' },
          { label_fr: 'En attente', label_ar: 'في الانتظار', value: stats.pending, color: 'text-slate-300', bg: 'bg-slate-800' },
          { label_fr: 'Exécutés', label_ar: 'منفذة', value: stats.executed, color: 'text-green-400', bg: 'bg-green-900/20 border border-green-800' },
          { label_fr: 'Infructueux', label_ar: 'فاشلة', value: stats.failed, color: 'text-red-400', bg: 'bg-red-900/20 border border-red-800' },
          { label_fr: 'Honoraires', label_ar: 'الأتعاب', value: formatDA(stats.totalFees), color: 'text-amber-400', bg: 'bg-amber-900/20 border border-amber-800' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-3`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400">{isAr ? s.label_ar : s.label_fr}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث...' : 'Rechercher...'}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500"
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300">
          <option value="all">{isAr ? 'كل الأنواع' : 'Tous types'}</option>
          {Object.entries(EXPLOIT_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{isAr ? v.ar : v.fr}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300">
          <option value="all">{isAr ? 'كل الحالات' : 'Tous statuts'}</option>
          {(['pending', 'executed', 'failed', 'cancelled'] as ExploitStatus[]).map(s => (
            <option key={s} value={s}>{isAr ? EXPLOIT_STATUS_CONFIG[s].ar : EXPLOIT_STATUS_CONFIG[s].fr}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-red-300 text-sm">{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4 text-red-400" /></button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Gavel className="w-6 h-6 animate-pulse mr-2" />
          {isAr ? 'جاري التحميل...' : 'Chargement...'}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Gavel className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{isAr ? 'لا توجد محاضر' : 'Aucun exploit enregistré'}</p>
          <button onClick={openForm} className="mt-3 text-green-400 text-sm hover:underline">
            {isAr ? '+ إضافة أول محضر' : '+ Créer le premier exploit'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(ex => {
            const cfg = EXPLOIT_STATUS_CONFIG[ex.status];
            return (
              <div key={ex.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-green-400 text-sm font-bold">{ex.exploit_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {isAr ? cfg.ar : cfg.fr}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                        {isAr ? EXPLOIT_TYPE_LABELS[ex.exploit_type]?.ar : EXPLOIT_TYPE_LABELS[ex.exploit_type]?.fr}
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      {isAr ? 'المطلوب: ' : 'Req: '}<span className="text-slate-300">{ex.requester_name}</span>
                      <span className="text-slate-500 mx-2">→</span>
                      {isAr ? 'المبلَّغ: ' : 'Dest: '}<span className="text-slate-300">{ex.recipient_name}</span>
                    </p>
                    {ex.case_description && <p className="text-xs text-slate-400 mt-0.5 truncate">{ex.case_description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span>{new Date(ex.exploit_date).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-DZ')}</span>
                      {ex.amount_claimed && <span className="text-amber-400/80">{formatDA(ex.amount_claimed)}</span>}
                      {ex.court_reference && <span className="text-slate-500">Réf: {ex.court_reference}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {ex.status === 'pending' && (
                      <>
                        <button onClick={() => handleStatus(ex.id, 'executed')}
                          title={isAr ? 'تم التنفيذ' : 'Marquer exécuté'}
                          className="p-1.5 rounded-lg bg-green-900/20 hover:bg-green-800/40 text-green-400 transition-colors">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleStatus(ex.id, 'failed')}
                          title={isAr ? 'فاشل' : 'Infructueux'}
                          className="p-1.5 rounded-lg bg-red-900/20 hover:bg-red-800/40 text-red-400 transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => exportExploitPdf(ex)}
                      title={isAr ? 'تصدير PDF' : 'Exporter PDF'}
                      className="p-1.5 rounded-lg bg-blue-900/20 hover:bg-blue-800/40 text-blue-400 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(ex.id)}
                      className="p-1.5 rounded-lg bg-red-900/20 hover:bg-red-800/40 text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h2 className="font-bold text-lg">{isAr ? 'محضر جديد' : 'Nouvel exploit'}</h2>
                <p className="text-xs text-green-400 font-mono mt-0.5">{nextNumber}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'نوع الإجراء' : 'Type d\'exploit'} *</label>
                  <select value={form.exploit_type} onChange={e => setForm(f => ({ ...f, exploit_type: e.target.value as ExploitType }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white">
                    {Object.entries(EXPLOIT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{isAr ? v.ar : v.fr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'تاريخ الإجراء' : 'Date'} *</label>
                  <input type="date" value={form.exploit_date} onChange={e => setForm(f => ({ ...f, exploit_date: e.target.value }))}
                    required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'الطالب (المُوكِّل)' : 'Requérant'} *</label>
                  <input type="text" value={form.requester_name} onChange={e => setForm(f => ({ ...f, requester_name: e.target.value }))}
                    required placeholder={isAr ? 'اسم الطالب' : 'Nom du requérant'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'المُبلَّغ إليه' : 'Destinataire'} *</label>
                  <input type="text" value={form.recipient_name} onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))}
                    required placeholder={isAr ? 'اسم المُبلَّغ' : 'Nom du destinataire'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'عنوان المُبلَّغ' : 'Adresse du destinataire'} *</label>
                <input type="text" value={form.recipient_address} onChange={e => setForm(f => ({ ...f, recipient_address: e.target.value }))}
                  required placeholder={isAr ? 'العنوان الكامل' : 'Adresse complète'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'مرجع الحكم/العقد' : 'Référence jugement/acte'}</label>
                  <input type="text" value={form.court_reference} onChange={e => setForm(f => ({ ...f, court_reference: e.target.value }))}
                    placeholder="N° dossier / jugement"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'المبلغ المطالب به (دج)' : 'Montant réclamé (DA)'}</label>
                  <input type="number" value={form.amount_claimed} onChange={e => setForm(f => ({ ...f, amount_claimed: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'أتعاب الحضور (دج)' : 'Émoluments (DA)'}</label>
                  <input type="number" value={form.bailiff_fees} onChange={e => setForm(f => ({ ...f, bailiff_fees: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'مصاريف التنقل (دج)' : 'Frais déplacement (DA)'}</label>
                  <input type="number" value={form.travel_fees} onChange={e => setForm(f => ({ ...f, travel_fees: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm transition-colors">
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors">
                  {submitting ? '...' : (isAr ? 'تسجيل المحضر' : 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
