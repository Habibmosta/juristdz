import React, { useState } from 'react';
import { X, FileText, User, Calendar, AlertCircle, Save, MapPin, DollarSign } from 'lucide-react';
import { Language } from '../../types';

interface NotaireActeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (acteData: any) => void;
  language: Language;
  theme?: 'light' | 'dark';
}

interface ActeFormData {
  typeActe: string;
  numeroRepertoire: string;
  dateActe: string;
  parties: {
    nom: string;
    prenom: string;
    dateNaissance: string;
    lieuNaissance: string;
    adresse: string;
    cin: string;
  }[];
  objetActe: string;
  montant: string;
  fraisNotariaux: string;
  droitsEnregistrement: string;
  lieuSignature: string;
  observations: string;
}

const TYPES_ACTES = {
  fr: [
    'Vente Immobilière',
    'Donation',
    'Succession',
    'Partage',
    'Hypothèque',
    'Mainlevée',
    'Procuration',
    'Contrat de Mariage',
    'Testament',
    'Reconnaissance de Dette',
    'Bail Commercial',
    'Constitution de Société',
    'Autre'
  ],
  ar: [
    'بيع عقاري',
    'هبة',
    'ميراث',
    'قسمة',
    'رهن',
    'رفع الرهن',
    'توكيل',
    'عقد زواج',
    'وصية',
    'إقرار بالدين',
    'إيجار تجاري',
    'تأسيس شركة',
    'أخرى'
  ]
};

export const NotaireActeForm: React.FC<NotaireActeFormProps> = ({
  isOpen,
  onClose,
  onSave,
  language,
  theme = 'light'
}) => {
  const isAr = language === 'ar';

  const [formData, setFormData] = useState<ActeFormData>({
    typeActe: '',
    numeroRepertoire: '',
    dateActe: new Date().toISOString().split('T')[0],
    parties: [
      {
        nom: '',
        prenom: '',
        dateNaissance: '',
        lieuNaissance: '',
        adresse: '',
        cin: ''
      }
    ],
    objetActe: '',
    montant: '',
    fraisNotariaux: '',
    droitsEnregistrement: '',
    lieuSignature: '',
    observations: ''
  });

  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const labelClass = `block text-sm font-bold mb-2 ${
    theme === 'light' ? 'text-slate-700' : 'text-slate-300'
  }`;

  const inputClass = (hasError = false) => `w-full p-3 border rounded-xl transition-colors ${
    hasError
      ? 'border-red-500 focus:border-red-500'
      : theme === 'light'
        ? 'border-slate-200 focus:border-legal-blue'
        : 'border-slate-700 focus:border-legal-blue'
  } ${
    theme === 'light'
      ? 'bg-white text-slate-900'
      : 'bg-slate-800 text-slate-100'
  }`;

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.typeActe) {
      newErrors.typeActe = isAr ? 'نوع العقد مطلوب' : 'Le type d\'acte est requis';
    }

    if (!formData.objetActe.trim()) {
      newErrors.objetActe = isAr ? 'موضوع العقد مطلوب' : 'L\'objet de l\'acte est requis';
    }

    if (formData.parties.length === 0 || !formData.parties[0].nom.trim()) {
      newErrors.parties = isAr ? 'معلومات الأطراف مطلوبة' : 'Les informations des parties sont requises';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ActeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePartieChange = (index: number, field: string, value: string) => {
    const newParties = [...formData.parties];
    newParties[index] = { ...newParties[index], [field]: value };
    setFormData(prev => ({ ...prev, parties: newParties }));
  };

  const addPartie = () => {
    setFormData(prev => ({
      ...prev,
      parties: [
        ...prev.parties,
        {
          nom: '',
          prenom: '',
          dateNaissance: '',
          lieuNaissance: '',
          adresse: '',
          cin: ''
        }
      ]
    }));
  };

  const removePartie = (index: number) => {
    if (formData.parties.length > 1) {
      setFormData(prev => ({
        ...prev,
        parties: prev.parties.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        ...formData,
        type: 'acte_notarie',
        createdAt: new Date(),
        status: 'en_cours'
      });

      onClose();
    } catch (error) {
      console.error('Error creating acte:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`max-w-5xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
          theme === 'light' ? 'bg-white' : 'bg-slate-900'
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div
          className={`p-6 border-b ${
            theme === 'light' ? 'border-slate-200' : 'border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <FileText size={24} />
              </div>
              <div>
                <h2
                  className={`text-2xl font-bold ${
                    theme === 'light' ? 'text-slate-900' : 'text-slate-100'
                  }`}
                >
                  {isAr ? 'إنشاء عقد نوتاري جديد' : 'Nouvel Acte Notarié'}
                </h2>
                <p
                  className={`text-sm ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {isAr
                    ? 'أدخل معلومات الأطراف وتفاصيل العقد'
                    : 'Saisissez les informations des parties et les détails de l\'acte'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'light'
                  ? 'hover:bg-slate-100 text-slate-500'
                  : 'hover:bg-slate-700 text-slate-400'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Informations de l'Acte */}
          <div className="space-y-6">
            <h3
              className={`text-lg font-bold flex items-center gap-2 ${
                theme === 'light' ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              <FileText size={20} className="text-amber-600" />
              {isAr ? 'معلومات العقد' : 'Informations de l\'Acte'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelClass}>
                  {isAr ? 'نوع العقد *' : 'Type d\'Acte *'}
                </label>
                <select
                  value={formData.typeActe}
                  onChange={(e) => handleInputChange('typeActe', e.target.value)}
                  className={inputClass(!!errors.typeActe)}
                >
                  <option value="">
                    {isAr ? 'اختر نوع العقد' : 'Sélectionnez le type'}
                  </option>
                  {TYPES_ACTES[language].map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.typeActe && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.typeActe}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {isAr ? 'رقم الذخيرة' : 'N° Répertoire'}
                </label>
                <input
                  type="text"
                  value={formData.numeroRepertoire}
                  onChange={(e) => handleInputChange('numeroRepertoire', e.target.value)}
                  className={inputClass()}
                  placeholder={isAr ? 'مثال: 2026/123' : 'Ex: 2026/123'}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isAr ? 'تاريخ العقد' : 'Date de l\'Acte'}
                </label>
                <input
                  type="date"
                  value={formData.dateActe}
                  onChange={(e) => handleInputChange('dateActe', e.target.value)}
                  className={inputClass()}
                />
              </div>

              <div className="md:col-span-3">
                <label className={labelClass}>
                  {isAr ? 'موضوع العقد *' : 'Objet de l\'Acte *'}
                </label>
                <textarea
                  value={formData.objetActe}
                  onChange={(e) => handleInputChange('objetActe', e.target.value)}
                  rows={3}
                  className={`${inputClass(!!errors.objetActe)} resize-none`}
                  placeholder={isAr ? 'اشرح موضوع العقد بالتفصيل...' : 'Décrivez l\'objet de l\'acte en détail...'}
                />
                {errors.objetActe && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.objetActe}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3
                className={`text-lg font-bold flex items-center gap-2 ${
                  theme === 'light' ? 'text-slate-900' : 'text-slate-100'
                }`}
              >
                <User size={20} className="text-amber-600" />
                {isAr ? 'الأطراف' : 'Parties'}
              </h3>
              <button
                type="button"
                onClick={addPartie}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                {isAr ? '+ إضافة طرف' : '+ Ajouter une partie'}
              </button>
            </div>

            {formData.parties.map((partie, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border ${
                  theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
                    {isAr ? `الطرف ${index + 1}` : `Partie ${index + 1}`}
                  </h4>
                  {formData.parties.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePartie(index)}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      {isAr ? 'حذف' : 'Supprimer'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>
                      {isAr ? 'اللقب *' : 'Nom *'}
                    </label>
                    <input
                      type="text"
                      value={partie.nom}
                      onChange={(e) => handlePartieChange(index, 'nom', e.target.value)}
                      className={inputClass()}
                      placeholder={isAr ? 'اللقب' : 'Nom de famille'}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isAr ? 'الاسم *' : 'Prénom *'}
                    </label>
                    <input
                      type="text"
                      value={partie.prenom}
                      onChange={(e) => handlePartieChange(index, 'prenom', e.target.value)}
                      className={inputClass()}
                      placeholder={isAr ? 'الاسم' : 'Prénom'}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isAr ? 'تاريخ الميلاد' : 'Date de Naissance'}
                    </label>
                    <input
                      type="date"
                      value={partie.dateNaissance}
                      onChange={(e) => handlePartieChange(index, 'dateNaissance', e.target.value)}
                      className={inputClass()}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isAr ? 'مكان الميلاد' : 'Lieu de Naissance'}
                    </label>
                    <input
                      type="text"
                      value={partie.lieuNaissance}
                      onChange={(e) => handlePartieChange(index, 'lieuNaissance', e.target.value)}
                      className={inputClass()}
                      placeholder={isAr ? 'مكان الميلاد' : 'Lieu de naissance'}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isAr ? 'رقم بطاقة التعريف' : 'N° CIN'}
                    </label>
                    <input
                      type="text"
                      value={partie.cin}
                      onChange={(e) => handlePartieChange(index, 'cin', e.target.value)}
                      className={inputClass()}
                      placeholder={isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isAr ? 'العنوان' : 'Adresse'}
                    </label>
                    <input
                      type="text"
                      value={partie.adresse}
                      onChange={(e) => handlePartieChange(index, 'adresse', e.target.value)}
                      className={inputClass()}
                      placeholder={isAr ? 'العنوان الكامل' : 'Adresse complète'}
                    />
                  </div>
                </div>
              </div>
            ))}
            {errors.parties && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.parties}
              </p>
            )}
          </div>

          {/* Aspects Financiers */}
          <div className="space-y-6">
            <h3
              className={`text-lg font-bold flex items-center gap-2 ${
                theme === 'light' ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              <DollarSign size={20} className="text-amber-600" />
              {isAr ? 'الجوانب المالية' : 'Aspects Financiers'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelClass}>
                  {isAr ? 'المبلغ (دج)' : 'Montant (DA)'}
                </label>
                <input
                  type="number"
                  value={formData.montant}
                  onChange={(e) => handleInputChange('montant', e.target.value)}
                  className={inputClass()}
                  placeholder="0"
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isAr ? 'أتعاب النوتاري (دج)' : 'Frais Notariaux (DA)'}
                </label>
                <input
                  type="number"
                  value={formData.fraisNotariaux}
                  onChange={(e) => handleInputChange('fraisNotariaux', e.target.value)}
                  className={inputClass()}
                  placeholder="0"
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isAr ? 'رسوم التسجيل (دج)' : 'Droits d\'Enregistrement (DA)'}
                </label>
                <input
                  type="number"
                  value={formData.droitsEnregistrement}
                  onChange={(e) => handleInputChange('droitsEnregistrement', e.target.value)}
                  className={inputClass()}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Informations Complémentaires */}
          <div className="space-y-6">
            <h3
              className={`text-lg font-bold flex items-center gap-2 ${
                theme === 'light' ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              <MapPin size={20} className="text-amber-600" />
              {isAr ? 'معلومات إضافية' : 'Informations Complémentaires'}
            </h3>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className={labelClass}>
                  {isAr ? 'مكان التوقيع' : 'Lieu de Signature'}
                </label>
                <input
                  type="text"
                  value={formData.lieuSignature}
                  onChange={(e) => handleInputChange('lieuSignature', e.target.value)}
                  className={inputClass()}
                  placeholder={isAr ? 'مكان توقيع العقد' : 'Lieu de signature de l\'acte'}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isAr ? 'ملاحظات' : 'Observations'}
                </label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  rows={3}
                  className={`${inputClass()} resize-none`}
                  placeholder={isAr ? 'أي ملاحظات إضافية...' : 'Toute observation complémentaire...'}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
            className={`flex items-center justify-end gap-4 pt-6 border-t ${
              theme === 'light' ? 'border-slate-200' : 'border-slate-700'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 border rounded-xl font-medium transition-colors ${
                theme === 'light'
                  ? 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  : 'border-slate-600 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 bg-amber-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-600'
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
                  {isAr ? 'إنشاء العقد' : 'Créer l\'Acte'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
