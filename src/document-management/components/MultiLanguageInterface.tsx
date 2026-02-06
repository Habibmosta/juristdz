import React, { useState, useEffect } from 'react';
import { Language } from '../types';

interface MultiLanguageInterfaceProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  children?: React.ReactNode;
}

interface TranslationStrings {
  [key: string]: {
    [Language.FRENCH]: string;
    [Language.ARABIC]: string;
  };
}

// Translation strings for the document management interface
const translations: TranslationStrings = {
  documentManagement: {
    [Language.FRENCH]: 'Gestion des Documents',
    [Language.ARABIC]: 'إدارة الوثائق',
  },
  upload: {
    [Language.FRENCH]: 'Télécharger',
    [Language.ARABIC]: 'رفع',
  },
  download: {
    [Language.FRENCH]: 'Télécharger',
    [Language.ARABIC]: 'تحميل',
  },
  delete: {
    [Language.FRENCH]: 'Supprimer',
    [Language.ARABIC]: 'حذف',
  },
  search: {
    [Language.FRENCH]: 'Rechercher',
    [Language.ARABIC]: 'بحث',
  },
  filter: {
    [Language.FRENCH]: 'Filtrer',
    [Language.ARABIC]: 'تصفية',
  },
  newFolder: {
    [Language.FRENCH]: 'Nouveau Dossier',
    [Language.ARABIC]: 'مجلد جديد',
  },
  share: {
    [Language.FRENCH]: 'Partager',
    [Language.ARABIC]: 'مشاركة',
  },
  version: {
    [Language.FRENCH]: 'Version',
    [Language.ARABIC]: 'إصدار',
  },
  template: {
    [Language.FRENCH]: 'Modèle',
    [Language.ARABIC]: 'نموذج',
  },
  signature: {
    [Language.FRENCH]: 'Signature',
    [Language.ARABIC]: 'توقيع',
  },
  workflow: {
    [Language.FRENCH]: 'Flux de travail',
    [Language.ARABIC]: 'سير العمل',
  },
  fileName: {
    [Language.FRENCH]: 'Nom du fichier',
    [Language.ARABIC]: 'اسم الملف',
  },
  fileSize: {
    [Language.FRENCH]: 'Taille du fichier',
    [Language.ARABIC]: 'حجم الملف',
  },
  uploadDate: {
    [Language.FRENCH]: 'Date de téléchargement',
    [Language.ARABIC]: 'تاريخ الرفع',
  },
  modifiedDate: {
    [Language.FRENCH]: 'Date de modification',
    [Language.ARABIC]: 'تاريخ التعديل',
  },
  tags: {
    [Language.FRENCH]: 'Étiquettes',
    [Language.ARABIC]: 'الوسوم',
  },
  category: {
    [Language.FRENCH]: 'Catégorie',
    [Language.ARABIC]: 'الفئة',
  },
  permissions: {
    [Language.FRENCH]: 'Permissions',
    [Language.ARABIC]: 'الصلاحيات',
  },
  view: {
    [Language.FRENCH]: 'Voir',
    [Language.ARABIC]: 'عرض',
  },
  edit: {
    [Language.FRENCH]: 'Modifier',
    [Language.ARABIC]: 'تعديل',
  },
  comment: {
    [Language.FRENCH]: 'Commenter',
    [Language.ARABIC]: 'تعليق',
  },
  save: {
    [Language.FRENCH]: 'Enregistrer',
    [Language.ARABIC]: 'حفظ',
  },
  cancel: {
    [Language.FRENCH]: 'Annuler',
    [Language.ARABIC]: 'إلغاء',
  },
  close: {
    [Language.FRENCH]: 'Fermer',
    [Language.ARABIC]: 'إغلاق',
  },
  confirm: {
    [Language.FRENCH]: 'Confirmer',
    [Language.ARABIC]: 'تأكيد',
  },
  success: {
    [Language.FRENCH]: 'Succès',
    [Language.ARABIC]: 'نجح',
  },
  error: {
    [Language.FRENCH]: 'Erreur',
    [Language.ARABIC]: 'خطأ',
  },
  loading: {
    [Language.FRENCH]: 'Chargement...',
    [Language.ARABIC]: 'جاري التحميل...',
  },
  noResults: {
    [Language.FRENCH]: 'Aucun résultat',
    [Language.ARABIC]: 'لا توجد نتائج',
  },
  selectFile: {
    [Language.FRENCH]: 'Sélectionner un fichier',
    [Language.ARABIC]: 'اختر ملف',
  },
  dragDropFiles: {
    [Language.FRENCH]: 'Glisser-déposer des fichiers ici',
    [Language.ARABIC]: 'اسحب وأفلت الملفات هنا',
  },
  maxFileSize: {
    [Language.FRENCH]: 'Taille maximale : 50 Mo',
    [Language.ARABIC]: 'الحجم الأقصى: ٥٠ ميجابايت',
  },
  supportedFormats: {
    [Language.FRENCH]: 'Formats supportés : PDF, DOC, DOCX, JPG, PNG, TXT',
    [Language.ARABIC]: 'الصيغ المدعومة: PDF, DOC, DOCX, JPG, PNG, TXT',
  },
};

/**
 * Multi-language interface component for document management
 * Provides language switching and RTL support for Arabic
 */
export const MultiLanguageInterface: React.FC<MultiLanguageInterfaceProps> = ({
  currentLanguage,
  onLanguageChange,
  children,
}) => {
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  // Update text direction when language changes
  useEffect(() => {
    const newDirection = currentLanguage === Language.ARABIC ? 'rtl' : 'ltr';
    setDirection(newDirection);
    
    // Update document direction
    document.documentElement.dir = newDirection;
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  return (
    <div className={`multi-language-interface ${direction}`} dir={direction}>
      {children}
    </div>
  );
};

/**
 * Hook to access translation strings
 */
export const useTranslation = (language: Language) => {
  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return key; // Fallback to key if translation not found
  };

  return { t, language };
};

/**
 * Language switcher component
 */
interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  onLanguageChange,
  className = '',
}) => {
  return (
    <div className={`language-switcher ${className}`}>
      <button
        className={`language-button ${currentLanguage === Language.FRENCH ? 'active' : ''}`}
        onClick={() => onLanguageChange(Language.FRENCH)}
        aria-label="Switch to French"
      >
        Français
      </button>
      <button
        className={`language-button ${currentLanguage === Language.ARABIC ? 'active' : ''}`}
        onClick={() => onLanguageChange(Language.ARABIC)}
        aria-label="Switch to Arabic"
      >
        العربية
      </button>
    </div>
  );
};

/**
 * Localized text component
 */
interface LocalizedTextProps {
  textKey: string;
  language: Language;
  className?: string;
}

export const LocalizedText: React.FC<LocalizedTextProps> = ({
  textKey,
  language,
  className = '',
}) => {
  const { t } = useTranslation(language);
  return <span className={className}>{t(textKey)}</span>;
};

/**
 * Export translation strings for use in other components
 */
export { translations };
