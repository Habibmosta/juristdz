import React, { useState, useEffect } from 'react';
import { ClipboardList, RefreshCw, Search, User, Clock, Filter } from 'lucide-react';
import { auditService, AuditLog } from '../../services/auditService';
import type { Language } from '../../../types';

interface AuditLogViewerProps {
  userId: string;
  language: Language;
  adminView?: boolean; // if true, loads all users' logs
}

const ACTION_LABELS: Record<string, { fr: string; ar: string; color: string }> = {
  'case.create':        { fr: 'Dossier créé',       ar: 'إنشاء ملف',       color: 'bg-green-100 text-green-700' },
  'case.update':        { fr: 'Dossier modifié',     ar: 'تعديل ملف',       color: 'bg-blue-100 text-blue-700' },
  'case.delete':        { fr: 'Dossier supprimé',    ar: 'حذف ملف',         color: 'bg-red-100 text-red-700' },
  'case.status_change': { fr: 'Statut modifié',      ar: 'تغيير الحالة',    color: 'bg-amber-100 text-amber-700' },
  'client.create':      { fr: 'Client créé',         ar: 'إنشاء عميل',      color: 'bg-green-100 text-green-700' },
  'client.update':      { fr: 'Client modifié',      ar: 'تعديل عميل',      color: 'bg-blue-100 text-blue-700' },
  'client.delete':      { fr: 'Client supprimé',     ar: 'حذف عميل',        color: 'bg-red-100 text-red-700' },
  'invoice.create':     { fr: 'Facture créée',       ar: 'إنشاء فاتورة',    color: 'bg-green-100 text-green-700' },
  'invoice.paid':       { fr: 'Facture payée',       ar: 'دفع فاتورة',      color: 'bg-emerald-100 text-emerald-700' },
  'invoice.delete':     { fr: 'Facture supprimée',   ar: 'حذف فاتورة',      color: 'bg-red-100 text-red-700' },
  'document.create':    { fr: 'Document créé',       ar: 'إنشاء وثيقة',     color: 'bg-purple-100 text-purple-700' },
  'document.export':    { fr: 'Document exporté',    ar: 'تصدير وثيقة',     color: 'bg-indigo-100 text-indigo-700' },
  'profile.update':     { fr: 'Profil modifié',      ar: 'تعديل الملف الشخصي', color: 'bg-slate-100 text-slate-700' },
  'auth.login':         { fr: 'Connexion',           ar: 'تسجيل دخول',      color: 'bg-teal-100 text-teal-700' },
  'auth.logout':        { fr: 'Déconnexion',         ar: 'تسجيل خروج',      color: 'bg-slate-100 text-slate-500' },
  'auth.2fa_enable':    { fr: '2FA activé',          ar: 'تفعيل 2FA',       color: 'bg-green-100 text-green-700' },
  'auth.2fa_disable':   { fr: '2FA désactivé',       ar: 'إلغاء 2FA',       color: 'bg-orange-100 text-orange-700' },
};

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ userId, language, adminView = false }) => {
  const isAr = language === 'ar';
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filtered, setFiltered] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const load = async () => {
    setLoading(true);
    const data = await auditService.getLogs(userId, 100);
    setLogs(data);
    setFiltered(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  useEffect(() => {
    let result = [...logs];
    if (filterAction !== 'all') result = result.filter(l => l.action.startsWith(filterAction));
    if (search) result = result.filter(l =>
      l.action.includes(search.toLowerCase()) ||
      l.resource_type?.includes(search.toLowerCase()) ||
      l.resource_id?.includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [logs, search, filterAction]);

  const getLabel = (action: string) => {
    const entry = ACTION_LABELS[action];
    if (!entry) return { label: action, color: 'bg-slate-100 text-slate-500' };
    return { label: isAr ? entry.ar : entry.fr, color: entry.color };
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={20} className="text-legal-gold" />
          <h3 className="font-bold text-lg">{isAr ? 'سجل الأنشطة' : 'Journal d\'activité'}</h3>
        </div>
        <button onClick={load} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title={isAr ? 'تحديث' : 'Actualiser'}>
          <RefreshCw size={16} className={loading ? 'animate-spin text-legal-gold' : 'text-slate-400'} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث...' : 'Rechercher...'}
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 text-sm"
        >
          <option value="all">{isAr ? 'الكل' : 'Tous'}</option>
          <option value="case">{isAr ? 'الملفات' : 'Dossiers'}</option>
          <option value="client">{isAr ? 'العملاء' : 'Clients'}</option>
          <option value="invoice">{isAr ? 'الفواتير' : 'Factures'}</option>
          <option value="document">{isAr ? 'الوثائق' : 'Documents'}</option>
          <option value="auth">{isAr ? 'المصادقة' : 'Authentification'}</option>
        </select>
      </div>

      {/* Log list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-gold" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <ClipboardList size={40} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">{isAr ? 'لا توجد أنشطة مسجلة' : 'Aucune activité enregistrée'}</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filtered.map(log => {
            const { label, color } = getLabel(log.action);
            return (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex-shrink-0 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>{label}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {log.resource_id && (
                    <p className="text-xs text-slate-500 font-mono truncate">{log.resource_type} #{log.resource_id.slice(0, 8)}</p>
                  )}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-xs text-slate-400 truncate">{JSON.stringify(log.details)}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 flex-shrink-0">
                  <Clock size={10} />
                  {new Date(log.created_at).toLocaleString('fr-DZ', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
