/**
 * Document Card - Affichage compact d'un document
 * Sprint 1: Interface utilisateur
 * Date: 03/03/2026
 */

import React, { useState } from 'react';
import {
  FileText,
  File,
  Image,
  Download,
  Edit3,
  Trash2,
  MoreVertical,
  Eye,
  Tag,
  Calendar,
  HardDrive,
} from 'lucide-react';
import { CaseDocument, DocumentCategory } from '../../services/documentService';
import { Language } from '../../../types';

interface DocumentCardProps {
  document: CaseDocument;
  onView: (document: CaseDocument) => void;
  onDownload: (document: CaseDocument) => void;
  onEdit: (document: CaseDocument) => void;
  onDelete: (document: CaseDocument) => void;
  language: Language;
  theme?: 'light' | 'dark';
}

const CATEGORY_LABELS: Record<DocumentCategory, { fr: string; ar: string; color: string }> = {
  piece: { 
    fr: 'Pièce', 
    ar: 'وثيقة', 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
  },
  conclusion: { 
    fr: 'Conclusion', 
    ar: 'مذكرة', 
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' 
  },
  jugement: { 
    fr: 'Jugement', 
    ar: 'حكم', 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
  },
  correspondance: { 
    fr: 'Correspondance', 
    ar: 'مراسلة', 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
  },
  contrat: { 
    fr: 'Contrat', 
    ar: 'عقد', 
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' 
  },
  autre: { 
    fr: 'Autre', 
    ar: 'أخرى', 
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' 
  },
};

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDownload,
  onEdit,
  onDelete,
  language,
  theme = 'light',
}) => {
  const isAr = language === 'ar';
  const [showMenu, setShowMenu] = useState(false);

  // Get file icon based on type
  const getFileIcon = () => {
    const type = document.fileType.toLowerCase();
    const mimeType = document.mimeType.toLowerCase();

    if (type === 'pdf' || mimeType === 'application/pdf') {
      return <FileText size={40} className="text-red-500" />;
    }
    if (['doc', 'docx'].includes(type) || mimeType.includes('word')) {
      return <FileText size={40} className="text-blue-500" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif'].includes(type) || mimeType.includes('image')) {
      return <Image size={40} className="text-green-500" />;
    }
    return <File size={40} className="text-slate-500" />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(isAr ? 'ar-DZ' : 'fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Get category info
  const categoryInfo = CATEGORY_LABELS[document.category];

  return (
    <div
      className={`
        relative group rounded-xl border transition-all duration-200
        ${theme === 'dark'
          ? 'bg-slate-900 border-slate-800 hover:border-legal-blue'
          : 'bg-white border-slate-200 hover:border-legal-blue hover:shadow-md'
        }
      `}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Main Content */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* File Icon */}
          <div
            onClick={() => onView(document)}
            className="flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
          >
            {getFileIcon()}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            {/* File Name */}
            <h3
              onClick={() => onView(document)}
              className={`
                font-bold text-sm mb-1 cursor-pointer truncate
                ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}
                hover:text-legal-blue transition-colors
              `}
              title={document.fileName}
            >
              {document.fileName}
            </h3>

            {/* Description */}
            {document.description && (
              <p
                className={`
                  text-xs mb-2 line-clamp-2
                  ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}
                `}
                title={document.description}
              >
                {document.description}
              </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {/* File Size */}
              <div className="flex items-center gap-1">
                <HardDrive size={12} />
                <span>{formatFileSize(document.fileSize)}</span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{formatDate(document.createdAt)}</span>
              </div>

              {/* Category Badge */}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                {isAr ? categoryInfo.ar : categoryInfo.fr}
              </span>
            </div>

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Tag size={12} className="text-slate-400" />
                {document.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className={`
                      px-2 py-0.5 rounded-full text-xs
                      ${theme === 'dark'
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-slate-100 text-slate-600'
                      }
                    `}
                  >
                    {tag}
                  </span>
                ))}
                {document.tags.length > 3 && (
                  <span className="text-xs text-slate-400">
                    +{document.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`
                p-2 rounded-lg transition-colors
                ${theme === 'dark'
                  ? 'hover:bg-slate-800'
                  : 'hover:bg-slate-100'
                }
              `}
            >
              <MoreVertical size={16} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />

                {/* Menu */}
                <div
                  className={`
                    absolute ${isAr ? 'left-0' : 'right-0'} top-full mt-2 z-20
                    w-48 rounded-xl shadow-lg border overflow-hidden
                    ${theme === 'dark'
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-slate-200'
                    }
                  `}
                >
                  {/* View */}
                  <button
                    onClick={() => {
                      onView(document);
                      setShowMenu(false);
                    }}
                    className={`
                      w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                      ${theme === 'dark'
                        ? 'hover:bg-slate-800 text-slate-200'
                        : 'hover:bg-slate-50 text-slate-700'
                      }
                    `}
                  >
                    <Eye size={16} />
                    <span className="text-sm font-medium">
                      {isAr ? 'عرض' : 'Voir'}
                    </span>
                  </button>

                  {/* Download */}
                  <button
                    onClick={() => {
                      onDownload(document);
                      setShowMenu(false);
                    }}
                    className={`
                      w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                      ${theme === 'dark'
                        ? 'hover:bg-slate-800 text-slate-200'
                        : 'hover:bg-slate-50 text-slate-700'
                      }
                    `}
                  >
                    <Download size={16} />
                    <span className="text-sm font-medium">
                      {isAr ? 'تحميل' : 'Télécharger'}
                    </span>
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => {
                      onEdit(document);
                      setShowMenu(false);
                    }}
                    className={`
                      w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                      ${theme === 'dark'
                        ? 'hover:bg-slate-800 text-slate-200'
                        : 'hover:bg-slate-50 text-slate-700'
                      }
                    `}
                  >
                    <Edit3 size={16} />
                    <span className="text-sm font-medium">
                      {isAr ? 'تعديل' : 'Modifier'}
                    </span>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      onDelete(document);
                      setShowMenu(false);
                    }}
                    className={`
                      w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                      text-red-600 dark:text-red-400
                      ${theme === 'dark'
                        ? 'hover:bg-red-900/20'
                        : 'hover:bg-red-50'
                      }
                    `}
                  >
                    <Trash2 size={16} />
                    <span className="text-sm font-medium">
                      {isAr ? 'حذف' : 'Supprimer'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions (visible on hover) */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 p-3 flex items-center justify-center gap-2
          opacity-0 group-hover:opacity-100 transition-opacity
          ${theme === 'dark' ? 'bg-slate-800/95' : 'bg-slate-50/95'}
          backdrop-blur-sm rounded-b-xl
        `}
      >
        <button
          onClick={() => onView(document)}
          className={`
            flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors
            flex items-center justify-center gap-2
            ${theme === 'dark'
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              : 'bg-white hover:bg-slate-100 text-slate-700'
            }
          `}
        >
          <Eye size={14} />
          {isAr ? 'عرض' : 'Voir'}
        </button>
        <button
          onClick={() => onDownload(document)}
          className="px-3 py-2 bg-legal-blue hover:bg-legal-blue/90 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Download size={14} />
          {isAr ? 'تحميل' : 'Télécharger'}
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;
