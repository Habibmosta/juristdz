import React, { useState, useEffect } from 'react';
import { FolderOpen, Upload, Search, Filter, Download, Trash2, Eye, FileText, RefreshCw } from 'lucide-react';
import { documentService, CaseDocument, DocumentCategory } from '../../services/documentService';
import DocumentCard from './DocumentCard';
import DocumentUploadModal from './DocumentUploadModal';
import { useAppToast } from '../../contexts/ToastContext';
import { auditService } from '../../services/auditService';
import type { Language } from '../../../types';

interface DocumentManagerProps {
  userId: string;
  language: Language;
}

const CATEGORY_LABELS: Record<DocumentCategory | 'all', { fr: string; ar: string }> = {
  all:           { fr: 'Tous',           ar: 'الكل' },
  piece:         { fr: 'Pièces',         ar: 'وثائق' },
  conclusion:    { fr: 'Conclusions',    ar: 'مذكرات' },
  jugement:      { fr: 'Jugements',      ar: 'أحكام' },
  correspondance:{ fr: 'Correspondance', ar: 'مراسلات' },
  contrat:       { fr: 'Contrats',       ar: 'عقود' },
  autre:         { fr: 'Autres',         ar: 'أخرى' },
};

const DocumentManager: React.FC<DocumentManagerProps> = ({ userId, language }) => {
  const { toast } = useAppToast();
  const isAr = language === 'ar';

  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [cases, setCases] = useState<{ id: string; title: string; case_number: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | 'all'>('all');
  const [filterCase, setFilterCase] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCaseId, setUploadCaseId] = useState('');

  useEffect(() => { loadData(); }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../../lib/supabase');

      // Load all documents for this user
      const { data: docs } = await supabase
        .from('case_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (docs) setDocuments(docs.map(mapDoc));

      // Load cases for filter dropdown
      const { data: casesData } = await supabase
        .from('cases')
        .select('id, title, case_number')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (casesData) setCases(casesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const mapDoc = (d: any): CaseDocument => ({
    id: d.id, caseId: d.case_id, userId: d.user_id,
    fileName: d.file_name, fileSize: d.file_size, fileType: d.file_type,
    mimeType: d.mime_type, storagePath: d.storage_path, storageBucket: d.storage_bucket,
    category: d.category, description: d.description, tags: d.tags || [],
    version: d.version, parentDocumentId: d.parent_document_id,
    isLatestVersion: d.is_latest_version,
    createdAt: new Date(d.created_at), updatedAt: new Date(d.updated_at),
  });

  const handleView = async (doc: CaseDocument) => {
    try {
      const url = await documentService.getDocumentUrl(doc.id);
      window.open(url, '_blank');
    } catch {
      toast(isAr ? 'خطأ في فتح الملف' : 'Erreur lors de l\'ouverture', 'error');
    }
  };

  const handleDownload = async (doc: CaseDocument) => {
    try {
      const blob = await documentService.downloadDocument(doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = doc.fileName; a.click();
      URL.revokeObjectURL(url);
      auditService.log({ user_id: userId, action: 'document.export', resource_type: 'document', resource_id: doc.id });
    } catch {
      toast(isAr ? 'خطأ في التحميل' : 'Erreur lors du téléchargement', 'error');
    }
  };

  const handleDelete = async (doc: CaseDocument) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا المستند؟' : 'Supprimer ce document ?')) return;
    try {
      await documentService.deleteDocument(doc.id);
      auditService.log({ user_id: userId, action: 'document.delete' as any, resource_type: 'document', resource_id: doc.id });
      toast(isAr ? 'تم حذف المستند' : 'Document supprimé', 'success');
      loadData();
    } catch {
      toast(isAr ? 'خطأ في الحذف' : 'Erreur lors de la suppression', 'error');
    }
  };

  const handleEdit = async (doc: CaseDocument) => {
    // Simple inline edit — just show a toast for now, full edit modal can be added later
    toast(isAr ? 'قريباً: تعديل المستند' : 'Bientôt: modification du document', 'info');
  };

  const filtered = documents.filter(d => {
    const matchSearch = !search || d.fileName.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase()) ||
      d.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = filterCategory === 'all' || d.category === filterCategory;
    const matchCase = filterCase === 'all' || d.caseId === filterCase;
    return matchSearch && matchCat && matchCase;
  });

  const totalSize = documents.reduce((s, d) => s + d.fileSize, 0);
  const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FolderOpen className="text-legal-gold" size={32} />
              {isAr ? 'إدارة المستندات' : 'Gestion des Documents'}
            </h1>
            <p className="text-slate-500 mt-1">
              {documents.length} {isAr ? 'مستند' : 'document(s)'} · {formatSize(totalSize)}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={loadData} className="p-3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <RefreshCw size={18} className={loading ? 'animate-spin text-legal-gold' : 'text-slate-400'} />
            </button>
            <button
              onClick={() => {
                if (cases.length === 0) { toast(isAr ? 'أنشئ دوسيه أولاً' : 'Créez d\'abord un dossier', 'warning'); return; }
                setUploadCaseId(cases[0].id);
                setShowUpload(true);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-legal-gold text-white rounded-xl font-bold hover:bg-legal-gold/90 transition-colors"
            >
              <Upload size={18} />
              {isAr ? 'رفع مستند' : 'Téléverser'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['piece', 'conclusion', 'jugement', 'contrat'] as DocumentCategory[]).map(cat => {
            const count = documents.filter(d => d.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  filterCategory === cat
                    ? 'bg-legal-gold/10 border-legal-gold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-legal-gold/50'
                }`}
              >
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-slate-500 mt-1">{isAr ? CATEGORY_LABELS[cat].ar : CATEGORY_LABELS[cat].fr}</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isAr ? 'بحث في المستندات...' : 'Rechercher...'}
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as any)}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl text-sm"
          >
            {Object.entries(CATEGORY_LABELS).map(([val, labels]) => (
              <option key={val} value={val}>{isAr ? labels.ar : labels.fr}</option>
            ))}
          </select>

          <select
            value={filterCase}
            onChange={e => setFilterCase(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl text-sm max-w-48"
          >
            <option value="all">{isAr ? 'كل الدوسيهات' : 'Tous les dossiers'}</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>{c.case_number} — {c.title}</option>
            ))}
          </select>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-legal-gold" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <FileText size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">{isAr ? 'لا توجد مستندات' : 'Aucun document'}</p>
            <p className="text-sm mt-1">{isAr ? 'ارفع مستندك الأول' : 'Téléversez votre premier document'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(doc => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={handleView}
                onDownload={handleDownload}
                onEdit={handleEdit}
                onDelete={handleDelete}
                language={language}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4">{isAr ? 'اختر الدوسيه' : 'Choisir le dossier'}</h3>
            <select
              value={uploadCaseId}
              onChange={e => setUploadCaseId(e.target.value)}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 mb-4"
            >
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.case_number} — {c.title}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowUpload(false)} className="flex-1 px-4 py-2.5 border dark:border-slate-700 rounded-xl">
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                onClick={() => setShowUpload(false)}
                className="flex-1 px-4 py-2.5 bg-legal-gold text-white rounded-xl font-bold"
              >
                {isAr ? 'متابعة' : 'Continuer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DocumentUploadModal
        isOpen={showUpload && !!uploadCaseId}
        onClose={() => setShowUpload(false)}
        caseId={uploadCaseId}
        onUploadSuccess={() => {
          setShowUpload(false);
          auditService.log({ user_id: userId, action: 'document.create', resource_type: 'document' });
          loadData();
          toast(isAr ? 'تم رفع المستند بنجاح' : 'Document téléversé avec succès', 'success');
        }}
        language={language}
      />
    </div>
  );
};

export default DocumentManager;
