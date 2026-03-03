/**
 * Document Upload Modal - Upload de documents avec drag & drop
 * Sprint 1: Interface utilisateur
 * Date: 03/03/2026
 */

import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, File, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { documentService, DocumentCategory } from '../../services/documentService';
import { Language } from '../../../types';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  onUploadSuccess: () => void;
  language: Language;
  theme?: 'light' | 'dark';
}

const CATEGORY_LABELS: Record<DocumentCategory, { fr: string; ar: string }> = {
  piece: { fr: 'Pièce jointe', ar: 'وثيقة مرفقة' },
  conclusion: { fr: 'Conclusion / Mémoire', ar: 'مذكرة / خلاصة' },
  jugement: { fr: 'Jugement / Ordonnance', ar: 'حكم / أمر' },
  correspondance: { fr: 'Correspondance', ar: 'مراسلات' },
  contrat: { fr: 'Contrat', ar: 'عقد' },
  autre: { fr: 'Autre', ar: 'أخرى' },
};

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  caseId,
  onUploadSuccess,
  language,
  theme = 'light',
}) => {
  const isAr = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>('autre');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form
  const resetForm = useCallback(() => {
    setSelectedFile(null);
    setCategory('autre');
    setDescription('');
    setTags('');
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  }, [isUploading, resetForm, onClose]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
    setSuccess(false);
  }, []);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setError(isAr ? 'الرجاء اختيار ملف' : 'Veuillez sélectionner un fichier');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simuler la progression (Supabase ne fournit pas de progression native)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload
      await documentService.uploadDocument(caseId, selectedFile, {
        category,
        description: description.trim() || undefined,
        tags: tags.trim() ? tags.split(',').map(t => t.trim()) : undefined,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(true);

      // Attendre un peu pour montrer le succès
      setTimeout(() => {
        onUploadSuccess();
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || (isAr ? 'فشل تحميل الملف' : 'Échec du téléchargement'));
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={`w-full max-w-2xl rounded-2xl shadow-2xl ${
          theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Upload className="text-legal-blue" size={24} />
            {isAr ? 'تحميل مستند' : 'Télécharger un Document'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className={`p-2 rounded-lg transition-colors ${
              isUploading 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-200
              ${isDragging 
                ? 'border-legal-blue bg-blue-50 dark:bg-blue-900/20' 
                : theme === 'dark'
                  ? 'border-slate-700 hover:border-slate-600'
                  : 'border-slate-300 hover:border-slate-400'
              }
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
              className="hidden"
              disabled={isUploading}
            />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-4">
                <File size={48} className="text-legal-blue" />
                <div className="text-left">
                  <p className="font-bold text-lg">{selectedFile.name}</p>
                  <p className="text-sm text-slate-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload size={48} className="mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-medium mb-2">
                  {isAr 
                    ? 'اسحب وأفلت الملف هنا أو انقر للاختيار' 
                    : 'Glissez-déposez un fichier ici ou cliquez pour sélectionner'}
                </p>
                <p className="text-sm text-slate-500">
                  {isAr 
                    ? 'PDF, Word, Images (حتى 100 ميغابايت)' 
                    : 'PDF, Word, Images (jusqu\'à 100 MB)'}
                </p>
              </>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'الفئة' : 'Catégorie'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              disabled={isUploading}
              className={`
                w-full px-4 py-3 rounded-xl border transition-colors
                ${theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 focus:border-legal-blue'
                  : 'bg-white border-slate-300 focus:border-legal-blue'
                }
                focus:outline-none focus:ring-2 focus:ring-legal-blue/20
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {Object.entries(CATEGORY_LABELS).map(([value, labels]) => (
                <option key={value} value={value}>
                  {isAr ? labels.ar : labels.fr}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'الوصف (اختياري)' : 'Description (optionnel)'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              rows={3}
              placeholder={isAr ? 'أضف وصفاً للمستند...' : 'Ajoutez une description du document...'}
              className={`
                w-full px-4 py-3 rounded-xl border transition-colors resize-none
                ${theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 focus:border-legal-blue placeholder-slate-500'
                  : 'bg-white border-slate-300 focus:border-legal-blue placeholder-slate-400'
                }
                focus:outline-none focus:ring-2 focus:ring-legal-blue/20
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'الكلمات المفتاحية (اختياري)' : 'Tags (optionnel)'}
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={isUploading}
              placeholder={isAr ? 'مثال: عقد، إيجار، 2026' : 'Ex: contrat, bail, 2026'}
              className={`
                w-full px-4 py-3 rounded-xl border transition-colors
                ${theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 focus:border-legal-blue placeholder-slate-500'
                  : 'bg-white border-slate-300 focus:border-legal-blue placeholder-slate-400'
                }
                focus:outline-none focus:ring-2 focus:ring-legal-blue/20
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            />
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'افصل بين الكلمات بفاصلة' : 'Séparez les tags par des virgules'}
            </p>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{isAr ? 'جاري التحميل...' : 'Téléchargement en cours...'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-legal-blue transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">
                {isAr ? 'تم تحميل المستند بنجاح!' : 'Document téléchargé avec succès !'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className={`
              px-6 py-3 rounded-xl font-medium transition-colors
              ${theme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700'
                : 'bg-slate-100 hover:bg-slate-200'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isAr ? 'إلغاء' : 'Annuler'}
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || success}
            className={`
              px-6 py-3 rounded-xl font-bold text-white transition-all
              flex items-center gap-2
              ${!selectedFile || isUploading || success
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-legal-blue hover:bg-legal-blue/90 shadow-lg hover:shadow-xl'
              }
            `}
          >
            {isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {isAr ? 'جاري التحميل...' : 'Téléchargement...'}
              </>
            ) : (
              <>
                <Upload size={18} />
                {isAr ? 'تحميل' : 'Télécharger'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
