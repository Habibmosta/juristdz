import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSignature, Plus, Search, Filter, Eye, CheckCircle2,
  Trash2, X, ChevronDown, BookOpen, TrendingUp, DollarSign, Download
} from 'lucide-react';
import { pdfExportService } from '../../services/pdfExportService';
import {
  notarialActService,
  NotarialAct, ActType, ActStatus,
  ACT_TYPE_LABELS, ACT_STATUS_CONFIG,
} from '../../services/notarialActService';
import { Language } from '../../../types';

interface Props {
  language: Language;
  userId: string;
}

const STATUS_FLOW: ActStatus[] = ['draft', 'signed', 'registered', 'delivered'];

const STATUS_BADGE: Record<ActStatus, string> = {
  draft:      'bg-slate-700 text-slate-300',
  signed:     'bg-blue-900/40 text-blue-300 border border-blue-700',
  registered: 'bg-amber-900/40 text-amber-300 border border-amber-700',
  delivered:  'bg-green-900/40 text-green-300 border border-green-700',
};

export default function NotarialRegistry({ language, userId }: Props) {
  const isAr = language === 'ar';
  const [acts, setActs] = useState<NotarialAct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [nextNumber, setNextNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ total: 0, byType: {}, byStatus: {}, totalValue: 0 });

  // Form state
  const [form, setForm] = useState({
    act_type: 'vente_immobiliere' as ActType,
    act_type_label: '',
    party_first_name: '',
    party_last_name: '',
    party_nin: '',
    party_address: '',
    counterparty_name: '',
    act_date: new Date().toISOString().split('T')[0],
    act_object: '',
    property_address: '',
    act_value: '',
    registration_fees: '',
    notary_fees: '',
    notes: '',
    status: 'draft' as ActStatus,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [data, s] = await Promise.all([
        notarialActService.getAll(userId),
        notarialActService.getStats(userId),
      ]);
      setActs(data);
      setStats(s);
    } catch {
      setError(isAr ? 'خطأ في التحميل' : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [userId, isAr]);

  useEffect(() => { load(); }, [load]);

  const openForm = async () => {
    try {
      const { act_num } = await notarialActService.getNextNumber(userId);
      setNextNumber(act_num);
      setShowForm(true);
    } catch {
      setNextNumber('N/—');
      setShowForm(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await notarialActService.create(userId, {
        ...form,
        act_value: form.act_value ? Number(form.act_value) : undefined,
        registration_fees: form.registration_fees ? Number(form.registration_fees) : undefined,
        notary_fees: form.notary_fees ? Number(form.notary_fees) : undefined,
      });
      setShowForm(false);
      setForm({ ...form, party_first_name: '', party_last_name: '', party_nin: '', party_address: '', counterparty_name: '', act_object: '', property_address: '', act_value: '', registration_fees: '', notary_fees: '', notes: '' });
      await load();
    } catch (e: any) {
      setError(e.message || (isAr ? 'خطأ في الإضافة' : 'Erreur lors de l\'ajout'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: ActStatus) => {
    await notarialActService.updateStatus(id, status);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? 'حذف هذا العقد؟' : 'Supprimer cet acte ?')) return;
    await notarialActService.delete(id);
    await load();
  };

  const filtered = acts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.act_number.toLowerCase().includes(q)
      || a.party_last_name.toLowerCase().includes(q)
      || a.party_first_name.toLowerCase().includes(q)
      || (a.act_object || '').toLowerCase().includes(q);
    const matchType = filterType === 'all' || a.act_type === filterType;
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const exportActPdf = (act: NotarialAct) => {
    const typeLabel = isAr ? ACT_TYPE_LABELS[act.act_type]?.ar : ACT_TYPE_LABELS[act.act_type]?.fr;
    const statusLabel = isAr ? ACT_STATUS_CONFIG[act.status].ar : ACT_STATUS_CONFIG[act.status].fr;
    const content = [
      `${isAr ? 'رقم العقد' : 'Numéro d\'acte'}: ${act.act_number}`,
      `${isAr ? 'النوع' : 'Type'}: ${typeLabel}`,
      `${isAr ? 'الحالة' : 'Statut'}: ${statusLabel}`,
      `${isAr ? 'التاريخ' : 'Date'}: ${new Date(act.act_date).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-DZ')}`,
      '',
      `${isAr ? 'الطرف الأول' : 'Partie principale'}: ${act.party_last_name} ${act.party_first_name}`,
      act.party_nin ? `NIN: ${act.party_nin}` : '',
      act.party_address ? `${isAr ? 'العنوان' : 'Adresse'}: ${act.party_address}` : '',
      act.counterparty_name ? `${isAr ? 'الطرف الثاني' : 'Contre-partie'}: ${act.counterparty_name}` : '',
      '',
      act.act_object ? `${isAr ? 'موضوع العقد' : 'Objet'}: ${act.act_object}` : '',
      act.property_address ? `${isAr ? 'عنوان العقار' : 'Bien immobilier'}: ${act.property_address}` : '',
      '',
      act.act_value ? `${isAr ? 'قيمة العقد' : 'Valeur'}: ${act.act_value.toLocaleString('fr-DZ')} DA` : '',
      act.registration_fees ? `${isAr ? 'حقوق التسجيل' : 'Droits d\'enregistrement'}: ${act.registration_fees.toLocaleString('fr-DZ')} DA` : '',
      act.notary_fees ? `${isAr ? 'أتعاب الموثق' : 'Honoraires notaire'}: ${act.notary_fees.toLocaleString('fr-DZ')} DA` : '',
      act.notes ? `\n${isAr ? 'ملاحظات' : 'Notes'}: ${act.notes}` : '',
    ].filter(Boolean).join('\n');

    pdfExportService.exportDocument({
      title: `${typeLabel} — ${act.act_number}`,
      content,
      language: isAr ? 'ar' : 'fr',
      date: new Date(act.act_date),
      footer: `JuristDZ — ${isAr ? 'سجل العقود التوثيقية' : 'Registre des Actes Notariés'}`,
    });
  };

  const formatDA = (n?: number) => n ? `${n.toLocaleString('fr-DZ')} DA` : '—';

  return (
    <div className={`min-h-screen bg-slate-950 text-white p-4 md:p-6 ${isAr ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-900/30 rounded-xl border border-amber-700/50">
            <FileSignature className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{isAr ? 'سجل العقود التوثيقية' : 'Registre des Actes Notariés'}</h1>
            <p className="text-xs text-slate-400">{isAr ? 'الترقيم التلقائي — السنة الجارية' : `Numérotation automatique — ${new Date().getFullYear()}`}</p>
          </div>
        </div>
        <button
          onClick={openForm}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isAr ? 'عقد جديد' : 'Nouvel acte'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-amber-900/20 border border-amber-800 rounded-xl p-3">
          <BookOpen className="w-5 h-5 text-amber-400 mb-1" />
          <div className="text-2xl font-bold text-amber-400">{stats.total}</div>
          <div className="text-xs text-slate-400">{isAr ? 'إجمالي العقود' : 'Actes total'}</div>
        </div>
        <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-3">
          <CheckCircle2 className="w-5 h-5 text-blue-400 mb-1" />
          <div className="text-2xl font-bold text-blue-400">{(stats.byStatus as any)['signed'] || 0}</div>
          <div className="text-xs text-slate-400">{isAr ? 'موقعة' : 'Signés'}</div>
        </div>
        <div className="bg-green-900/20 border border-green-800 rounded-xl p-3">
          <TrendingUp className="w-5 h-5 text-green-400 mb-1" />
          <div className="text-2xl font-bold text-green-400">{(stats.byStatus as any)['delivered'] || 0}</div>
          <div className="text-xs text-slate-400">{isAr ? 'مسلّمة' : 'Délivrés'}</div>
        </div>
        <div className="bg-purple-900/20 border border-purple-800 rounded-xl p-3">
          <DollarSign className="w-5 h-5 text-purple-400 mb-1" />
          <div className="text-lg font-bold text-purple-400">{formatDA(stats.totalValue)}</div>
          <div className="text-xs text-slate-400">{isAr ? 'القيمة الإجمالية' : 'Valeur totale'}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث...' : 'Rechercher...'}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300"
        >
          <option value="all">{isAr ? 'كل الأنواع' : 'Tous types'}</option>
          {Object.entries(ACT_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{isAr ? v.ar : v.fr}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300"
        >
          <option value="all">{isAr ? 'كل الحالات' : 'Tous statuts'}</option>
          {STATUS_FLOW.map(s => (
            <option key={s} value={s}>{isAr ? ACT_STATUS_CONFIG[s].ar : ACT_STATUS_CONFIG[s].fr}</option>
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

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <FileSignature className="w-6 h-6 animate-pulse mr-2" />
          {isAr ? 'جاري التحميل...' : 'Chargement...'}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{isAr ? 'لا توجد عقود' : 'Aucun acte enregistré'}</p>
          <button onClick={openForm} className="mt-3 text-amber-400 text-sm hover:underline">
            {isAr ? '+ إضافة أول عقد' : '+ Créer le premier acte'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(act => (
            <div key={act.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-amber-400 text-sm font-bold">{act.act_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[act.status]}`}>
                      {isAr ? ACT_STATUS_CONFIG[act.status].ar : ACT_STATUS_CONFIG[act.status].fr}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                      {isAr ? ACT_TYPE_LABELS[act.act_type]?.ar : ACT_TYPE_LABELS[act.act_type]?.fr}
                    </span>
                  </div>
                  <p className="font-medium text-sm">
                    {act.party_last_name} {act.party_first_name}
                    {act.counterparty_name && <span className="text-slate-400"> / {act.counterparty_name}</span>}
                  </p>
                  {act.act_object && <p className="text-xs text-slate-400 mt-0.5 truncate">{act.act_object}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span>{new Date(act.act_date).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-DZ')}</span>
                    {act.act_value && <span className="text-amber-400/80">{formatDA(act.act_value)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Avancer le statut */}
                  {act.status !== 'delivered' && (
                    <button
                      onClick={() => handleStatusChange(act.id, STATUS_FLOW[STATUS_FLOW.indexOf(act.status) + 1])}
                      title={isAr ? 'تقدم الحالة' : 'Avancer le statut'}
                      className="p-1.5 rounded-lg bg-amber-900/20 hover:bg-amber-800/40 text-amber-400 transition-colors text-xs"
                    >
                      <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                    </button>
                  )}
                  <button
                    onClick={() => exportActPdf(act)}
                    title={isAr ? 'تصدير PDF' : 'Exporter PDF'}
                    className="p-1.5 rounded-lg bg-blue-900/20 hover:bg-blue-800/40 text-blue-400 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(act.id)}
                    className="p-1.5 rounded-lg bg-red-900/20 hover:bg-red-800/40 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h2 className="font-bold text-lg">{isAr ? 'عقد توثيقي جديد' : 'Nouvel acte notarié'}</h2>
                <p className="text-xs text-amber-400 font-mono mt-0.5">{nextNumber}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'نوع العقد' : 'Type d\'acte'} *</label>
                  <select
                    value={form.act_type}
                    onChange={e => setForm(f => ({ ...f, act_type: e.target.value as ActType }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
                  >
                    {Object.entries(ACT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{isAr ? v.ar : v.fr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'تاريخ العقد' : 'Date de l\'acte'} *</label>
                  <input
                    type="date"
                    value={form.act_date}
                    onChange={e => setForm(f => ({ ...f, act_date: e.target.value }))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              {/* Partie principale */}
              <div className="border border-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-2 font-medium">{isAr ? 'الطرف الأول' : 'Partie principale'}</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={form.party_last_name}
                    onChange={e => setForm(f => ({ ...f, party_last_name: e.target.value }))}
                    required
                    placeholder={isAr ? 'اللقب *' : 'Nom *'}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
                  />
                  <input
                    type="text"
                    value={form.party_first_name}
                    onChange={e => setForm(f => ({ ...f, party_first_name: e.target.value }))}
                    required
                    placeholder={isAr ? 'الاسم *' : 'Prénom *'}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
                  />
                  <input
                    type="text"
                    value={form.party_nin}
                    onChange={e => setForm(f => ({ ...f, party_nin: e.target.value }))}
                    placeholder={isAr ? 'رقم التعريف الوطني' : 'NIN'}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
                  />
                  <input
                    type="text"
                    value={form.counterparty_name}
                    onChange={e => setForm(f => ({ ...f, counterparty_name: e.target.value }))}
                    placeholder={isAr ? 'الطرف الثاني (اختياري)' : 'Contre-partie (optionnel)'}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Objet et bien */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'موضوع العقد' : 'Objet de l\'acte'}</label>
                <input
                  type="text"
                  value={form.act_object}
                  onChange={e => setForm(f => ({ ...f, act_object: e.target.value }))}
                  placeholder={isAr ? 'وصف موجز للعقد' : 'Description succincte'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500"
                />
              </div>

              {/* Valeurs financières */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'قيمة العقد (دج)' : 'Valeur (DA)'}</label>
                  <input
                    type="number"
                    value={form.act_value}
                    onChange={e => setForm(f => ({ ...f, act_value: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'حقوق التسجيل' : 'Droits enreg.'}</label>
                  <input
                    type="number"
                    value={form.registration_fees}
                    onChange={e => setForm(f => ({ ...f, registration_fees: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">{isAr ? 'أتعاب الموثق' : 'Honoraires'}</label>
                  <input
                    type="number"
                    value={form.notary_fees}
                    onChange={e => setForm(f => ({ ...f, notary_fees: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500"
                  />
                </div>
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
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
                >
                  {submitting ? '...' : (isAr ? 'تسجيل العقد' : 'Enregistrer l\'acte')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
