/**
 * Panneau latéral d'historique des versions d'un document
 */
import React, { useState, useEffect } from 'react';
import { documentVersionService, DocumentVersion } from '../../services/documentVersionService';
import { Language } from '../../../types';
import { History, Clock, RotateCcw, Trash2, ChevronDown, ChevronUp, FileText, X } from 'lucide-react';

interface DocumentVersionHistoryProps {
  userId: string;
  documentId: string;
  language: Language;
  onRestore: (content: string, version: DocumentVersion) => void;
  onClose: () => void;
}

const DocumentVersionHistory: React.FC<DocumentVersionHistoryProps> = ({
  userId,
  documentId,
  language,
  onRestore,
  onClose,
}) => {
  const isAr = language === 'ar';
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [documentId]);

  const load = async () => {
    setLoading(true);
    const data = await documentVersionService.getVersions(userId, documentId);
    setVersions(data);
    setLoading(false);
  };

  const handleRestore = async (version: DocumentVersion) => {
    setRestoringId(version.id);
    onRestore(version.content, version);
    setTimeout(() => setRestoringId(null), 1000);
  };

  const handleDelete = async (versionId: string) => {
    if (!confirm(isAr ? 'حذف هذه النسخة؟' : 'Supprimer cette version ?')) return;
    await documentVersionService.deleteVersion(userId, versionId);
    setVersions(prev => prev.filter(v => v.id !== versionId));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(isAr ? 'ar-DZ' : 'fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <History size={18} className="text-legal-blue" />
          {isAr ? 'سجل النسخ' : 'Historique des versions'}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            {isAr ? 'جاري التحميل...' : 'Chargement...'}
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">
              {isAr ? 'لا توجد نسخ محفوظة' : 'Aucune version sauvegardée'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isAr ? 'سيتم الحفظ تلقائياً عند التوليد' : 'Sauvegarde auto à chaque génération'}
            </p>
          </div>
        ) : (
          versions.map((version, index) => (
            <div
              key={version.id}
              className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
            >
              {/* Version header */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setExpandedId(expandedId === version.id ? null : version.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      index === 0
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      v{version.version_number}
                      {index === 0 && (isAr ? ' (الأحدث)' : ' (actuelle)')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                    <Clock size={11} />
                    {formatDate(version.created_at)}
                  </div>
                  {version.change_summary && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
                      {version.change_summary}
                    </p>
                  )}
                  {version.word_count && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {version.word_count} {isAr ? 'كلمة' : 'mots'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {expandedId === version.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {/* Expanded preview + actions */}
              {expandedId === version.id && (
                <div className="border-t border-slate-200 dark:border-slate-700">
                  {/* Preview */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">
                      {version.content.substring(0, 400)}{version.content.length > 400 ? '...' : ''}
                    </pre>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 p-3 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => handleRestore(version)}
                      disabled={restoringId === version.id || index === 0}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                        index === 0
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-legal-blue text-white hover:bg-legal-blue/90'
                      }`}
                    >
                      <RotateCcw size={12} />
                      {restoringId === version.id
                        ? (isAr ? 'جاري الاستعادة...' : 'Restauration...')
                        : (isAr ? 'استعادة' : 'Restaurer')
                      }
                    </button>
                    {index !== 0 && (
                      <button
                        onClick={() => handleDelete(version.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title={isAr ? 'حذف' : 'Supprimer'}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentVersionHistory;
