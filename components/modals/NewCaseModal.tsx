import React, { useState } from 'react';
import { Language, Case } from '../../types';
import { UI_TRANSLATIONS } from '../../constants';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Calendar, 
  DollarSign,
  AlertCircle,
  Save,
  Plus
} from 'lucide-react';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (caseData: Partial<Case>) => void;
  language: Language;
  theme?: 'light' | 'dark';
}

interface CaseFormData {
  title: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  description: string;
  caseType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedValue: string;
  deadline: string;
  notes: string;
}

const CASE_TYPES = {
  fr: [
    'Droit Civil',
    'Droit Commercial',
    'Droit Pénal',
    'Droit de la Famille',
    'Droit du Travail',
    'Droit Immobilier',
    'Droit Administratif',
    'Droit Fiscal',
    'Autre'
  ],
  ar: [
    'القانون المدني',
    'القانون التجاري',
    'القانون الجنائي',
    'قانون الأسرة',
    'قانون العمل',
    'القانون العقاري',
    'القانون الإداري',
    'القانون الضريبي',
    'أخرى'
  ]
};

const PRIORITY_LEVELS = {
  fr: {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Élevée',
    urgent: 'Urgente'
  },
  ar: {
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    urgent: 'عاجلة'
  }
};

/**
 * Modal for creating a new legal case/dossier
 * Features: Client information, case details, priority setting, deadline management
 */
const NewCaseModal: React.FC<NewCaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  language,
  theme = 'light'
}) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';

  // CSS classes for consistent styling
  const labelClass = `block text-sm font-bold mb-2 ${
    theme === 'light' ? 'text-slate-700' : 'text-slate-300'
  }`;
  
  const inputClass = (hasError = false) => `w-full p-3 border rounded-xl transition-colors ${
    hasError 
      ? 'border-red-500 focus:border-red-500' 
      : 'border-slate-200 dark:border-slate-700 focus:border-legal-blue'
  } ${
    theme === 'light' 
      ? 'bg-white text-slate-900' 
      : 'bg-slate-800 text-slate-100'
  }`;

  const [formData, setFormData] = useState<CaseFormData>({
    title: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    description: '',
    caseType: '',
    priority: 'medium',
    estimatedValue: '',
    deadline: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<CaseFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<CaseFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = isAr ? 'عنوان القضية مطلوب' : 'Le titre du dossier est requis';
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = isAr ? 'اسم العميل مطلوب' : 'Le nom du client est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = isAr ? 'وصف القضية مطلوب' : 'La description du dossier est requise';
    }

    if (!formData.caseType) {
      newErrors.caseType = isAr ? 'نوع القضية مطلوب' : 'Le type de dossier est requis';
    }

    if (formData.clientEmail && !isValidEmail(formData.clientEmail)) {
      newErrors.clientEmail = isAr ? 'البريد الإلكتروني غير صحيح' : 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (field: keyof CaseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create case object
      const newCase: Partial<Case> = {
        title: formData.title,
        clientName: formData.clientName,
        description: formData.description,
        status: 'active',
        createdAt: new Date(),
        // Additional fields that might be in extended Case interface
        clientPhone: formData.clientPhone,
        clientEmail: formData.clientEmail,
        clientAddress: formData.clientAddress,
        caseType: formData.caseType,
        priority: formData.priority,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
        notes: formData.notes
      };

      await onSave(newCase);
      
      // Reset form
      setFormData({
        title: '',
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        clientAddress: '',
        description: '',
        caseType: '',
        priority: 'medium',
        estimatedValue: '',
        deadline: '',
        notes: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating case:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
        theme === 'light' ? 'bg-white' : 'bg-slate-900'
      }`} dir={isAr ? 'rtl' : 'ltr'}>
        
        {/* Header */}
        <div className={`p-6 border-b ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-legal-blue/10 text-legal-blue rounded-xl">
                <Plus size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {isAr ? 'إنشاء ملف قضائي جديد' : 'Nouveau Dossier Juridique'}
                </h2>
                <p className="text-sm text-slate-500">
                  {isAr ? 'أدخل معلومات العميل وتفاصيل القضية' : 'Saisissez les informations client et les détails du dossier'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'light' 
                  ? 'hover:bg-slate-100 text-slate-500' 
                  : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* Case Information */}
          <div className="space-y-6">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${
              theme === 'light' ? 'text-slate-900' : 'text-slate-100'
            }`}>
              <FileText size={20} className="text-legal-blue" />
              {isAr ? 'معلومات القضية' : 'Informations du Dossier'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>
                  {isAr ? 'عنوان القضية *' : 'Titre du Dossier *'}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={inputClass(!!errors.title)}
                  placeholder={isAr ? 'مثال: قضية تجارية ضد شركة...' : 'Ex: Litige commercial contre société...'}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {isAr ? 'نوع القضية *' : 'Type de Dossier *'}
                </label>
                <select
                  value={formData.caseType}
                  onChange={(e) => handleInputChange('caseType', e.target.value)}
                  className={inputClass(!!errors.caseType)}
                >
                  <option value="">
                    {isAr ? 'اختر نوع القضية' : 'Sélectionnez le type'}
                  </option>
                  {CASE_TYPES[language].map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.caseType && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.caseType}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {isAr ? 'الأولوية' : 'Priorité'}
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as any)}
                  className={inputClass()}
                >
                  {Object.entries(PRIORITY_LEVELS[language]).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  {isAr ? 'القيمة المقدرة (دج)' : 'Valeur Estimée (DA)'}
                </label>
                <input
                  type="number"
                  value={formData.estimatedValue}
                  onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                  className={inputClass()}
                  placeholder={isAr ? '0' : '0'}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isAr ? 'الموعد النهائي' : 'Échéance'}
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  className={inputClass()}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  {isAr ? 'وصف القضية *' : 'Description du Dossier *'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`${inputClass(!!errors.description)} resize-none`}
                  placeholder={isAr ? 'اشرح تفاصيل القضية والوقائع الأساسية...' : 'Décrivez les détails du dossier et les faits principaux...'}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-6">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${
              theme === 'light' ? 'text-slate-900' : 'text-slate-100'
            }`}>
              <User size={20} className="text-legal-blue" />
              {isAr ? 'معلومات العميل' : 'Informations Client'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>
                  {isAr ? 'اسم العميل *' : 'Nom du Client *'}
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  className={inputClass(!!errors.clientName)}
                  placeholder={isAr ? 'الاسم الكامل للعميل' : 'Nom complet du client'}
                />
                {errors.clientName && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.clientName}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {isAr ? 'رقم الهاتف' : 'Téléphone'}
                </label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                  className={inputClass()}
                  placeholder={isAr ? '+213 XX XX XX XX' : '+213 XX XX XX XX'}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isAr ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                  className={inputClass(!!errors.clientEmail)}
                  placeholder={isAr ? 'client@example.com' : 'client@example.com'}
                />
                {errors.clientEmail && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.clientEmail}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {isAr ? 'العنوان' : 'Adresse'}
                </label>
                <input
                  type="text"
                  value={formData.clientAddress}
                  onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                  className={inputClass()}
                  placeholder={isAr ? 'العنوان الكامل' : 'Adresse complète'}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  {isAr ? 'ملاحظات إضافية' : 'Notes Additionnelles'}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className={`${inputClass()} resize-none`}
                  placeholder={isAr ? 'أي معلومات إضافية مهمة...' : 'Toute information supplémentaire importante...'}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 border rounded-xl font-medium transition-colors ${
                theme === 'light' 
                  ? 'border-slate-200 hover:bg-slate-50' 
                  : 'border-slate-700 hover:bg-slate-800'
              }`}
            >
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 bg-legal-blue text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-legal-blue/90'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isAr ? 'جاري الحفظ...' : 'Enregistrement...'}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isAr ? 'إنشاء الملف' : 'Créer le Dossier'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCaseModal;