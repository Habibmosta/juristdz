import React, { useState, useEffect } from 'react';
import { Language, Case } from '../../types';
import { UI_TRANSLATIONS } from '../../constants';
import { X, Save, User, Phone, Mail, MapPin, FileText, Calendar, DollarSign, AlertTriangle } from 'lucide-react';

interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (caseData: Partial<Case>) => void;
  language: Language;
  theme?: 'light' | 'dark';
  case_: Case;
}

const EditCaseModal: React.FC<EditCaseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  language,
  theme = 'light',
  case_
}) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';

  // Form state initialized with existing case data
  const [formData, setFormData] = useState({
    title: case_.title,
    clientName: case_.clientName,
    clientPhone: case_.clientPhone || '',
    clientEmail: case_.clientEmail || '',
    clientAddress: case_.clientAddress || '',
    description: case_.description,
    caseType: case_.caseType || '',
    priority: case_.priority || 'medium',
    estimatedValue: case_.estimatedValue || '',
    deadline: case_.deadline ? case_.deadline.toISOString().split('T')[0] : '',
    notes: case_.notes || '',
    assignedLawyer: case_.assignedLawyer || ''
  });

  // Update form data when case changes
  useEffect(() => {
    setFormData({
      title: case_.title,
      clientName: case_.clientName,
      clientPhone: case_.clientPhone || '',
      clientEmail: case_.clientEmail || '',
      clientAddress: case_.clientAddress || '',
      description: case_.description,
      caseType: case_.caseType || '',
      priority: case_.priority || 'medium',
      estimatedValue: case_.estimatedValue || '',
      deadline: case_.deadline ? case_.deadline.toISOString().split('T')[0] : '',
      notes: case_.notes || '',
      assignedLawyer: case_.assignedLawyer || ''
    });
  }, [case_]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const caseData: Partial<Case> = {
        ...formData,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue.toString()) : undefined,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
        lastUpdated: new Date()
      };

      await onSubmit(caseData);
      onClose();
    } catch (error) {
      console.error('Error updating case:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText size={20} className="text-legal-blue" />
            {isAr ? 'تعديل الملف' : 'Modifier le Dossier'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column - Case Information */}
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-legal-blue" />
                  {isAr ? 'معلومات الملف' : 'Informations du Dossier'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {isAr ? 'عنوان الملف *' : 'Titre du dossier *'}
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:border-transparent"
                      placeholder={isAr ? 'أدخل عنوان الملف' : 'Entrez le titre du dossier'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {isAr ? 'وصف الملف *' : 'Description du dossier *'}
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:border-transparent resize-none"
                      placeholder={isAr ? 'وصف مفصل للملف' : 'Description détaillée du dossier'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {isAr ? 'نوع الملف' : 'Type de dossier'}
                      </label>
                      <select
                        name="caseType"
                        value={formData.caseType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:border-transparent"
                      >
                        <option value="">{isAr ? 'اختر النوع' : 'Sélectionner le type'}</option>
                        <option value="Droit Civil">{isAr ? 'القانون المدني' : 'Droit Civil'}</option>
                        <option value="Droit Commercial">{isAr ? 'القانون التجاري' : 'Droit Commercial'}</option>
                        <option value="Droit de la Famille">{isAr ? 'قانون الأسرة' : 'Droit de la Famille'}</option>
                        <option value="Droit Pénal">{isAr ? 'القانون الجنائي' : 'Droit Pénal'}</option>
                        <option value="Droit du Travail">{isAr ? 'قانون العمل' : 'Droit du Travail'}</option>
                        <option value="Droit Immobilier">{isAr ? 'القانون العقاري' : 'Droit Immobilier'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <AlertTriangle size={16} className="inline mr-1" />
                        {isAr ? 'الأولوية' : 'Priorité'}
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:border-transparent"
                      >
                        <option value="low">{isAr ? 'منخفضة' : 'Faible'}</option>
                        <option value="medium">{isAr ? 'متوسطة' : 'Moyenne'}</option>
                        <option value="high">{isAr ? 'عالية' : 'Élevée'}</option>
                        <option value="urgent">{isAr ? 'عاجلة' : 'Urgente'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <DollarSign size={16} className="inline mr-1" />
                        {isAr ? 'القيمة المقدرة (دج)' : 'Valeur estimée (DA)'}
                      </label>
                      <input
                        type="number"
                        name="estimatedValue"
                        value={formData.estimatedValue}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:border-transparent"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Calendar size={16} className="inline mr-1" />
                        {isAr ? 'الموعد النهائي' : 'Date limite'}
                      </label>
                      <input
                        type="date"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Client Information */}
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <User size={18} className="text-legal-blue" />
                  {isAr ? 'معلومات العميل' : 'Informations Client'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {isAr ? 'اسم العميل *' : 'Nom du client *'}
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:border-transparent"
                      placeholder={isAr ? 'الاسم الكامل للعميل' : 'Nom complet du client'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <Phone size={16} className="inline mr-1" />
                      {isAr ? 'رقم الهاتف' : 'Numéro de téléphone'}
                    </label>
                    <input
                      type="tel"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:border-transparent"
                      placeholder="+213 XXX XXX XXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <Mail size={16} className="inline mr-1" />
                      {isAr ? 'البريد الإلكتروني' : 'Adresse email'}
                    </label>
                    <input
                      type="email"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:border-transparent"
                      placeholder="client@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <MapPin size={16} className="inline mr-1" />
                      {isAr ? 'العنوان' : 'Adresse'}
                    </label>
                    <textarea
                      name="clientAddress"
                      value={formData.clientAddress}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:border-transparent resize-none"
                      placeholder={isAr ? 'العنوان الكامل للعميل' : 'Adresse complète du client'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {isAr ? 'المحامي المكلف' : 'Avocat assigné'}
                    </label>
                    <input
                      type="text"
                      name="assignedLawyer"
                      value={formData.assignedLawyer}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:border-transparent"
                      placeholder={isAr ? 'اسم المحامي' : 'Nom de l\'avocat'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {isAr ? 'ملاحظات' : 'Notes'}
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:border-transparent resize-none"
                      placeholder={isAr ? 'ملاحظات إضافية حول الملف' : 'Notes supplémentaires sur le dossier'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors"
            >
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-legal-blue text-white rounded-xl font-medium hover:bg-legal-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isAr ? 'جاري الحفظ...' : 'Enregistrement...'}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isAr ? 'حفظ التغييرات' : 'Enregistrer les modifications'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCaseModal;