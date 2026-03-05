import React, { useState } from 'react';
import { Language } from '../../types';
import { X, FileText, Building, Users, Calendar, DollarSign, AlertCircle } from 'lucide-react';

interface NewContratModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contrat: any) => void;
  language: Language;
  theme?: 'light' | 'dark';
}

const NewContratModal: React.FC<NewContratModalProps> = ({
  isOpen,
  onClose,
  onSave,
  language,
  theme = 'light'
}) => {
  const isAr = language === 'ar';

  const [formData, setFormData] = useState({
    type: '',
    titre: '',
    partie1: '',
    partie2: '',
    objet: '',
    montant: '',
    dateDebut: '',
    dateFin: '',
    duree: '',
    clausesParticulieres: '',
    conformite: [] as string[],
    notes: ''
  });

  const typesContrats = [
    { value: 'travail', label: isAr ? 'عقد عمل' : 'Contrat de travail' },
    { value: 'prestation', label: isAr ? 'عقد خدمات' : 'Contrat de prestation' },
    { value: 'fourniture', label: isAr ? 'عقد توريد' : 'Contrat de fourniture' },
    { value: 'licence', label: isAr ? 'ترخيص' : 'Licence logicielle' },
    { value: 'confidentialite', label: isAr ? 'سرية' : 'Accord de confidentialité (NDA)' },
    { value: 'partenariat', label: isAr ? 'شراكة' : 'Accord de partenariat' },
    { value: 'bail', label: isAr ? 'إيجار' : 'Bail commercial' },
    { value: 'cession', label: isAr ? 'تنازل' : 'Cession de droits' },
    { value: 'autre', label: isAr ? 'آخر' : 'Autre' }
  ];

  const conformiteOptions = [
    { value: 'rgpd', label: isAr ? 'حماية البيانات' : 'RGPD / Protection des données' },
    { value: 'travail', label: isAr ? 'قانون العمل' : 'Code du travail' },
    { value: 'commercial', label: isAr ? 'قانون تجاري' : 'Droit commercial' },
    { value: 'fiscal', label: isAr ? 'قانون ضريبي' : 'Conformité fiscale' },
    { value: 'environnement', label: isAr ? 'بيئة' : 'Normes environnementales' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newContrat = {
      id: Date.now().toString(),
      numero: `CTR-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      type: typesContrats.find(t => t.value === formData.type)?.label || formData.type,
      titre: formData.titre,
      partie1: formData.partie1,
      partie2: formData.partie2,
      objet: formData.objet,
      montant: formData.montant ? parseFloat(formData.montant) : undefined,
      dateDebut: formData.dateDebut ? new Date(formData.dateDebut) : undefined,
      dateFin: formData.dateFin ? new Date(formData.dateFin) : undefined,
      duree: formData.duree,
      clausesParticulieres: formData.clausesParticulieres,
      conformite: formData.conformite,
      dateCreation: new Date(),
      statut: 'brouillon',
      notes: formData.notes
    };

    onSave(newContrat);
    onClose();
    
    // Reset form
    setFormData({
      type: '',
      titre: '',
      partie1: '',
      partie2: '',
      objet: '',
      montant: '',
      dateDebut: '',
      dateFin: '',
      duree: '',
      clausesParticulieres: '',
      conformite: [],
      notes: ''
    });
  };

  const toggleConformite = (value: string) => {
    setFormData(prev => ({
      ...prev,
      conformite: prev.conformite.includes(value)
        ? prev.conformite.filter(c => c !== value)
        : [...prev.conformite, value]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden ${
        theme === 'light' ? 'bg-white' : 'bg-slate-900'
      }`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={24} />
              <h2 className="text-2xl font-bold">
                {isAr ? 'عقد جديد' : 'Nouveau Contrat'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            
            {/* Type et Titre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  {isAr ? 'نوع العقد' : 'Type de contrat'} *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                >
                  <option value="">{isAr ? 'اختر النوع' : 'Sélectionner le type'}</option>
                  {typesContrats.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">
                  {isAr ? 'عنوان العقد' : 'Titre du contrat'} *
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                  placeholder={isAr ? 'عنوان مختصر' : 'Titre descriptif'}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Building size={16} />
                  {isAr ? 'الطرف الأول (الشركة)' : 'Partie 1 (Entreprise)'} *
                </label>
                <input
                  type="text"
                  value={formData.partie1}
                  onChange={(e) => setFormData(prev => ({ ...prev, partie1: e.target.value }))}
                  placeholder={isAr ? 'اسم الشركة' : 'Nom de l\'entreprise'}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Users size={16} />
                  {isAr ? 'الطرف الثاني' : 'Partie 2 (Cocontractant)'} *
                </label>
                <input
                  type="text"
                  value={formData.partie2}
                  onChange={(e) => setFormData(prev => ({ ...prev, partie2: e.target.value }))}
                  placeholder={isAr ? 'اسم الطرف الثاني' : 'Nom du cocontractant'}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>
            </div>

            {/* Objet */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {isAr ? 'موضوع العقد' : 'Objet du contrat'} *
              </label>
              <textarea
                value={formData.objet}
                onChange={(e) => setFormData(prev => ({ ...prev, objet: e.target.value }))}
                placeholder={isAr ? 'وصف موضوع العقد' : 'Description de l\'objet du contrat'}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Montant */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <DollarSign size={16} />
                  {isAr ? 'المبلغ (دج)' : 'Montant (DA)'}
                </label>
                <input
                  type="number"
                  value={formData.montant}
                  onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Date début */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  {isAr ? 'تاريخ البداية' : 'Date de début'}
                </label>
                <input
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateDebut: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Date fin */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  {isAr ? 'تاريخ الانتهاء' : 'Date de fin'}
                </label>
                <input
                  type="date"
                  value={formData.dateFin}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateFin: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Durée */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {isAr ? 'المدة' : 'Durée'}
              </label>
              <input
                type="text"
                value={formData.duree}
                onChange={(e) => setFormData(prev => ({ ...prev, duree: e.target.value }))}
                placeholder={isAr ? 'مثال: 12 شهرا' : 'Ex: 12 mois, 2 ans'}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Conformité */}
            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                <AlertCircle size={16} />
                {isAr ? 'الامتثال القانوني' : 'Conformité légale'}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {conformiteOptions.map(option => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.conformite.includes(option.value)
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.conformite.includes(option.value)}
                      onChange={() => toggleConformite(option.value)}
                      className="rounded text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clauses particulières */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {isAr ? 'بنود خاصة' : 'Clauses particulières'}
              </label>
              <textarea
                value={formData.clausesParticulieres}
                onChange={(e) => setFormData(prev => ({ ...prev, clausesParticulieres: e.target.value }))}
                placeholder={isAr ? 'بنود خاصة أو استثنائية' : 'Clauses spécifiques ou exceptionnelles'}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {isAr ? 'ملاحظات' : 'Notes internes'}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={isAr ? 'ملاحظات داخلية' : 'Notes internes (non visibles dans le contrat)'}
                rows={2}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              {isAr ? 'إنشاء العقد' : 'Créer le contrat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewContratModal;
