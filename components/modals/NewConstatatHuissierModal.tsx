import React, { useState } from 'react';
import { Language } from '../../types';
import { X, FileCheck, User, MapPin, Calendar, Clock, DollarSign } from 'lucide-react';

interface NewConstatHuissierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (constat: any) => void;
  language: Language;
  theme?: 'light' | 'dark';
}

const NewConstatHuissierModal: React.FC<NewConstatHuissierModalProps> = ({
  isOpen,
  onClose,
  onSave,
  language,
  theme = 'light'
}) => {
  const isAr = language === 'ar';

  const [formData, setFormData] = useState({
    type: '',
    requérant: '',
    destinataire: '',
    objet: '',
    adresse: '',
    dateExecution: '',
    heureExecution: '',
    montant: '',
    notes: ''
  });

  const typesConstats = [
    { value: 'signification', label: isAr ? 'تبليغ' : 'Signification' },
    { value: 'constat', label: isAr ? 'معاينة' : 'Constat' },
    { value: 'saisie', label: isAr ? 'حجز' : 'Saisie' },
    { value: 'expulsion', label: isAr ? 'طرد' : 'Expulsion' },
    { value: 'protêt', label: isAr ? 'احتجاج' : 'Protêt' },
    { value: 'sommation', label: isAr ? 'إنذار' : 'Sommation de payer' },
    { value: 'inventaire', label: isAr ? 'جرد' : 'Inventaire' },
    { value: 'pv', label: isAr ? 'محضر' : 'Procès-verbal' },
    { value: 'autre', label: isAr ? 'آخر' : 'Autre' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newConstat = {
      id: Date.now().toString(),
      numero: `2024/${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      type: typesConstats.find(t => t.value === formData.type)?.label || formData.type,
      requérant: formData.requérant,
      destinataire: formData.destinataire,
      objet: formData.objet,
      adresse: formData.adresse,
      dateExecution: formData.dateExecution ? new Date(formData.dateExecution) : undefined,
      heureExecution: formData.heureExecution,
      montant: formData.montant ? parseFloat(formData.montant) : undefined,
      dateCreation: new Date(),
      statut: 'en_attente',
      notes: formData.notes
    };

    onSave(newConstat);
    onClose();
    
    // Reset form
    setFormData({
      type: '',
      requérant: '',
      destinataire: '',
      objet: '',
      adresse: '',
      dateExecution: '',
      heureExecution: '',
      montant: '',
      notes: ''
    });
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
              <FileCheck size={24} />
              <h2 className="text-2xl font-bold">
                {isAr ? 'إنشاء إجراء جديد' : 'Nouvel Acte d\'Huissier'}
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
                {isAr ? 'نوع الإجراء' : 'Type d\'acte'} *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-blue"
                required
              >
                <option value="">{isAr ? 'اختر نوع الإجراء' : 'Sélectionner le type d\'acte'}</option>
                {typesConstats.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Requérant */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <User size={16} />
                  {isAr ? 'الطالب' : 'Requérant'} *
                </label>
                <input
                  type="text"
                  value={formData.requérant}
                  onChange={(e) => setFormData(prev => ({ ...prev, requérant: e.target.value }))}
                  placeholder={isAr ? 'اسم الطالب' : 'Nom du requérant'}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-blue"
                  required
                />
              </div>

              {/* Destinataire */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <User size={16} />
                  {isAr ? 'المرسل إليه' : 'Destinataire'} *
                </label>
                <input
                  type="text"
                  value={formData.destinataire}
                  onChange={(e) => setFormData(prev => ({ ...prev, destinataire: e.target.value }))}
                  placeholder={isAr ? 'اسم المرسل إليه' : 'Nom du destinataire'}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-blue"
                  required
                />
              </div>
            </div>

            {/* Objet */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {isAr ? 'موضوع الإجراء' : 'Objet de l\'acte'} *
              </label>
              <textarea
                value={formData.objet}
                onChange={(e) => setFormData(prev => ({ ...prev, objet: e.target.value }))}
                placeholder={isAr ? 'وصف موضوع الإجراء' : 'Description de l\'objet'}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-blue resize-none"
                required
              />
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                <MapPin size={16} />
                {isAr ? 'عنوان التنفيذ' : 'Adresse d\'exécution'} *
              </label>
              <input
                type="text"
                value={formData.adresse}
                onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
                placeholder={isAr ? 'العنوان الكامل' : 'Adresse complète'}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-blue"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date d'exécution */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  {isAr ? 'تاريخ التنفيذ' : 'Date d\'exécution'}
                </label>
                <input
                  type="date"
                  value={formData.dateExecution}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateExecution: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-blue"
                />
              </div>

              {/* Heure */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Clock size={16} />
                  {isAr ? 'الساعة' : 'Heure'}
                </label>
                <input
                  type="time"
                  value={formData.heureExecution}
                  onChange={(e) => setFormData(prev => ({ ...prev, heureExecution: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-legal-blue"
                />
              </div>

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
              {isAr ? 'إنشاء الإجراء' : 'Créer l\'acte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewConstatHuissierModal;
