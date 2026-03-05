import React, { useState } from 'react';
import { Language } from '../../types';
import { X, FileSignature, Users, DollarSign, Calendar, MapPin } from 'lucide-react';

interface NewActeNotarialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (acte: any) => void;
  language: Language;
  theme?: 'light' | 'dark';
}

const NewActeNotarialModal: React.FC<NewActeNotarialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  language,
  theme = 'light'
}) => {
  const isAr = language === 'ar';

  const [formData, setFormData] = useState({
    type: '',
    parties: ['', ''],
    objet: '',
    montant: '',
    lieu: '',
    dateSignature: '',
    notes: ''
  });

  const typesActes = [
    { value: 'vente', label: isAr ? 'عقد بيع' : 'Vente immobilière' },
    { value: 'donation', label: isAr ? 'هبة' : 'Donation' },
    { value: 'mariage', label: isAr ? 'عقد زواج' : 'Contrat de mariage' },
    { value: 'testament', label: isAr ? 'وصية' : 'Testament' },
    { value: 'succession', label: isAr ? 'إرث' : 'Succession' },
    { value: 'hypotheque', label: isAr ? 'رهن' : 'Hypothèque' },
    { value: 'bail', label: isAr ? 'عقد إيجار' : 'Bail commercial' },
    { value: 'societe', label: isAr ? 'شركة' : 'Constitution de société' },
    { value: 'autre', label: isAr ? 'آخر' : 'Autre' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newActe = {
      id: Date.now().toString(),
      numero: `2024/${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      type: typesActes.find(t => t.value === formData.type)?.label || formData.type,
      parties: formData.parties.filter(p => p.trim()),
      objet: formData.objet,
      montant: formData.montant ? parseFloat(formData.montant) : undefined,
      lieu: formData.lieu,
      dateSignature: formData.dateSignature ? new Date(formData.dateSignature) : undefined,
      dateCreation: new Date(),
      statut: 'brouillon',
      notes: formData.notes
    };

    onSave(newActe);
    onClose();
    
    // Reset form
    setFormData({
      type: '',
      parties: ['', ''],
      objet: '',
      montant: '',
      lieu: '',
      dateSignature: '',
      notes: ''
    });
  };

  const addPartie = () => {
    setFormData(prev => ({
      ...prev,
      parties: [...prev.parties, '']
    }));
  };

  const updatePartie = (index: number, value: string) => {
    const newParties = [...formData.parties];
    newParties[index] = value;
    setFormData(prev => ({ ...prev, parties: newParties }));
  };

  const removePartie = (index: number) => {
    if (formData.parties.length > 2) {
      const newParties = formData.parties.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, parties: newParties }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden ${
        theme === 'light' ? 'bg-white' : 'bg-slate-900'
      }`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-legal-blue to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSignature size={24} />
              <h2 className="text-2xl font-bold">
                {isAr ? 'إنشاء عقد جديد' : 'Nouvel Acte Notarié'}
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
            
            {/* Type d'acte */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {isAr ? 'نوع العقد' : 'Type d\'acte'} *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-blue"
                required
              >
                <option value="">{isAr ? 'اختر نوع العقد' : 'Sélectionner le type d\'acte'}</option>
                {typesActes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Parties */}
            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                <Users size={16} />
                {isAr ? 'الأطراف' : 'Parties'} *
              </label>
              {formData.parties.map((partie, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={partie}
                    onChange={(e) => updatePartie(index, e.target.value)}
                    placeholder={`${isAr ? 'الطرف' : 'Partie'} ${index + 1}`}
                    className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-blue"
                    required
                  />
                  {formData.parties.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removePartie(index)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPartie}
                className="text-sm text-legal-blue hover:underline"
              >
                + {isAr ? 'إضافة طرف' : 'Ajouter une partie'}
              </button>
            </div>

            {/* Objet */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {isAr ? 'موضوع العقد' : 'Objet de l\'acte'} *
              </label>
              <textarea
                value={formData.objet}
                onChange={(e) => setFormData(prev => ({ ...prev, objet: e.target.value }))}
                placeholder={isAr ? 'وصف موضوع العقد' : 'Description de l\'objet de l\'acte'}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-blue resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-blue"
                />
              </div>

              {/* Date de signature */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  {isAr ? 'تاريخ التوقيع' : 'Date de signature'}
                </label>
                <input
                  type="date"
                  value={formData.dateSignature}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateSignature: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-blue"
                />
              </div>
            </div>

            {/* Lieu */}
            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                <MapPin size={16} />
                {isAr ? 'مكان التوقيع' : 'Lieu de signature'}
              </label>
              <input
                type="text"
                value={formData.lieu}
                onChange={(e) => setFormData(prev => ({ ...prev, lieu: e.target.value }))}
                placeholder={isAr ? 'المكان' : 'Lieu'}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-blue"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {isAr ? 'ملاحظات' : 'Notes'}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={isAr ? 'ملاحظات إضافية' : 'Notes additionnelles'}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-blue resize-none"
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
              className="px-6 py-2.5 bg-legal-blue text-white rounded-xl font-medium hover:bg-legal-blue/90 transition-colors"
            >
              {isAr ? 'إنشاء العقد' : 'Créer l\'acte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewActeNotarialModal;
