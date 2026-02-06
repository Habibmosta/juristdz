import React, { useState, useEffect, useRef } from 'react';
import { Document, Language } from '../types';
import { useTranslation } from './MultiLanguageInterface';

/**
 * Mobile Document Interface Component
 * Provides responsive, touch-friendly document management for mobile devices
 * 
 * Requirements: 8.5 - Mobile responsiveness
 */

interface MobileDocumentInterfaceProps {
  documents: Document[];
  language: Language;
  onDocumentSelect: (document: Document) => void;
  onDocumentUpload: (file: File) => Promise<void>;
  onDocumentDelete: (documentId: string) => Promise<void>;
  onSearch: (query: string) => void;
}

export const MobileDocumentInterface: React.FC<MobileDocumentInterfaceProps> = ({
  documents,
  language,
  onDocumentSelect,
  onDocumentUpload,
  onDocumentDelete,
  onSearch,
}) => {
  const { t } = useTranslation(language);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        onSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  // Handle file upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onDocumentUpload(file);
      setShowUploadModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(t('error'));
    } finally {
      setIsUploading(false);
    }
  };

  // Handle document selection
  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
    onDocumentSelect(document);
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(language === Language.ARABIC ? 'ar' : 'fr', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="mobile-document-interface">
      {/* Header with search */}
      <div className="mobile-header">
        <div className="mobile-search-bar">
          <input
            type="text"
            className="mobile-search-input"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="mobile-search-button">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>
      </div>

      {/* Document list */}
      <div className="mobile-document-list">
        {documents.length === 0 ? (
          <div className="mobile-empty-state">
            <p>{t('noResults')}</p>
          </div>
        ) : (
          documents.map((document) => (
            <div
              key={document.id}
              className={`mobile-document-card ${
                selectedDocument?.id === document.id ? 'selected' : ''
              }`}
              onClick={() => handleDocumentClick(document)}
            >
              <div className="document-icon">
                {getFileIcon(document.mimeType)}
              </div>
              <div className="document-info">
                <h3 className="document-name">{document.name}</h3>
                <div className="document-meta">
                  <span className="document-size">{formatFileSize(document.size)}</span>
                  <span className="document-date">{formatDate(document.createdAt)}</span>
                </div>
                {document.tags && document.tags.length > 0 && (
                  <div className="document-tags">
                    {document.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="tag-badge">
                        {tag}
                      </span>
                    ))}
                    {document.tags.length > 3 && (
                      <span className="tag-badge">+{document.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
              <button
                className="document-menu-button"
                onClick={(e) => {
                  e.stopPropagation();
                  // Show context menu
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Floating action button for upload */}
      <button
        className="mobile-fab"
        onClick={() => setShowUploadModal(true)}
        aria-label={t('upload')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Upload modal */}
      {showUploadModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h2>{t('upload')}</h2>
              <button
                className="mobile-modal-close"
                onClick={() => setShowUploadModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mobile-modal-content">
              <div className="mobile-upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="mobile-file-input"
                  className="mobile-file-input"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  disabled={isUploading}
                />
                <label htmlFor="mobile-file-input" className="mobile-upload-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  <span>{isUploading ? t('loading') : t('selectFile')}</span>
                </label>
                <p className="mobile-upload-hint">{t('supportedFormats')}</p>
                <p className="mobile-upload-hint">{t('maxFileSize')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Get file icon based on MIME type
 */
const getFileIcon = (mimeType: string): JSX.Element => {
  if (mimeType.includes('pdf')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        <path d="M14 2v6h6M10 13h4M10 17h4M10 9h1" />
      </svg>
    );
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
      </svg>
    );
  }
  if (mimeType.includes('image')) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
      <path d="M14 2v6h6" />
    </svg>
  );
};

/**
 * Mobile Document Viewer Component
 * Provides touch-friendly document viewing
 */
interface MobileDocumentViewerProps {
  document: Document;
  language: Language;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
}

export const MobileDocumentViewer: React.FC<MobileDocumentViewerProps> = ({
  document,
  language,
  onClose,
  onDownload,
  onShare,
}) => {
  const { t } = useTranslation(language);
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));

  return (
    <div className="mobile-document-viewer">
      <div className="mobile-viewer-header">
        <button className="mobile-viewer-back" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="mobile-viewer-title">{document.name}</h2>
        <div className="mobile-viewer-actions">
          <button onClick={onShare} aria-label={t('share')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
            </svg>
          </button>
          <button onClick={onDownload} aria-label={t('download')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mobile-viewer-content" style={{ transform: `scale(${zoom})` }}>
        {/* Document content would be rendered here */}
        <div className="mobile-viewer-placeholder">
          <p>{t('loading')}</p>
        </div>
      </div>

      <div className="mobile-viewer-controls">
        <button onClick={handleZoomOut} aria-label="Zoom out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35M8 11h6" />
          </svg>
        </button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button onClick={handleZoomIn} aria-label="Zoom in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
          </svg>
        </button>
      </div>
    </div>
  );
};
