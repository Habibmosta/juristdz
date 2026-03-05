import React, { useState } from 'react';
import { Language } from '../../types';
import { X, Gavel, FileText, Users, Calendar, Scale } from 'lucide-react';

interface NewJugementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (jugement: any) => void;
  language: Language;
  theme?: 'light' | 'dark';
}

const NewJugementModal: React.FC<NewJugementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  language,
  theme = 'light'
}) => {
  const isAr = language === 'ar';

  const [formData, setFormData] = useState({
    type: '',
    juridiction: '',
    numeroRG: '',
    demandeur: '',
    defendeur: '',
    objet: '',
    dateAudience: '',
    dateDelibere: '',
    dispositif: '',
    motifs: ''
  });

  const typesJugements = [
    { value: 'civil', label: isAr ? 'مدني' : 'Civil' },
    { value: 'penal', label: isAr ? 'جزائي' : 'Pénal' },
    { value: 'commercial', label: isAr ? 'تجاري' : 'Commercial' },
    { value: 'social', label: isAr ? 'اجتماعي' : 'Social' },
    { value: 'administratif', label: isAr ? 'إداري' : 'Administratif' },
    { value: 'famille', label: isAr ? 'أسرة' : 'Affaires familiales' }
  ];

  const juridictions = [
    { value: 'tribunal', label: isAr ? 'محكمة' : 'Tribunal' },
    { value: 'cour', label: isAr ? 'مجلس قضائي' : 'Cour' },
    { value: 'supreme', label: isAr ? 'محكمة عليا' : 'Cour Suprême' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newJugement = {
      id: Date.now().toString(),
      numeroRG: formData.numeroRG,
      type: typesJugements.find(t => t.value === formData.type)?.label || formData.type,
      juridiction: juridictions.find(j => j.value === formData.juridiction)?.label || formData.juridiction,
      demandeur: formData.demandeur,
      defendeur: formData.defendeur,
      objet: formData.objet,
      dateAudience: formData.dateAudience ? new Date(formData.dateAudience) : undefined,
      dateDelibere: formData.dateDelibere ? new Date(formData.dateDelibere) : undefined,
      dispositif: formData.dispositif,
      motifs: formData.motifs,
      dateCreation: new Date(),
      statut: 'en_delibere'
    };

    onSave(newJugement);
    onClose();
    
    // Reset form
    setFormData({
      type: '',
      juridiction: '',
      numeroRG: '',
      demandeur: '',
      defendeur: '',
      objet: '',
      dateAudience: '',
      dateDelibere: '',
      dispositif: '',
      motifs: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden ${
        theme === 'light' ? 'bg-white' : 'bg-slate-900'
      }`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gavel size={24} />
              <h2 className="text-2xl font-bold">
                {isAr ? 'حكم جديد' : 'Nouveau Jugement'}
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Scale size={16} />
                  {isAr ? 'النوع' : 'Type'} *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                >
                  <option value="">{isAr ? 'اختر النوع' : 'Sélectionner'}</option>
                  {typesJugements.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Juridiction */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  {isAr ? 'الجهة القضائية' : 'Juridiction'} *
                </label>
                <select
                  value={formData.juridiction}
                  onChange={(e) => setFormData(prev => ({ ...prev, juridiction: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                >
                  <option value="">{isAr ? 'اختر الجهة' : 'Sélectionner'}</option>
                  {juridictions.map(j => (
                    <option key={j.value} value={j.value}>{j.label}</option>
                  ))}
                </select>
              </div>

              {/* Numéro RG */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <FileText size={16} />
                  {isAr ? 'رقم الجدول' : 'N° RG'} *
                </label>
                <input
                  type="text"
                  value={formData.numeroRG}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroRG: e.target.value }))}
                  placeholder={isAr ? 'رقم الجدول' : 'Ex: 24/00123'}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Demandeur */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Users size={16} />
                  {isAr ? 'المدعي' : 'Demandeur'} *
                </label>
                <input
                  type="text"
                  value={formData.demandeur}
                  onChange={(e) => setFormData(prev => ({ ...prev, demandeur: e.target.value }))}
                  placeholder={isAr ? 'اسم المدعي' : 'Nom du demandeur'}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              {/* Défendeur */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Users size={16} />
                  {isAr ? 'المدعى عليه' : 'Défendeur'} *
                </label>
                <input
                  type="text"
                  value={formData.defendeur}
                  onChange={(e) => setFormData(prev => ({ ...prev, defendeur: e.target.value }))}
                  placeholder={isAr ? 'اسم المدعى عليه' : 'Nom du défendeur'}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>
            </div>

            {/* Objet */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {isAr ? 'موضوع النزاع' : 'Objet du litige'} *
              </label>
              <textarea
                value={formData.objet}
                onChange={(e) => setFormData(prev => ({ ...prev, objet: e.target.value }))}
                placeholder={isAr ? 'وصف موضوع النزاع' : 'Description de l\'objet du litige'}
                rows={2}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date d'audience */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  {isAr ? 'تاريخ الجلسة' : 'Date d\'audience'}
                </label>
                <input
                  type="date"
                  value={formData.dateAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateAudience: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Date de délibéré */}
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  {isAr ? 'تاريخ المداولة' : 'Date de délibéré'}
                </label>
                <input
                  type="date"
                  value={formData.dateDelibere}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateDelibere: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Dispositif */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {isAr ? 'المنطوق' : 'Dispositif'}
              </label>
              <textarea
                value={formData.dispositif}
                onChange={(e) => setFormData(prev => ({ ...prev, dispositif: e.target.value }))}
                placeholder={isAr ? 'منطوق الحكم' : 'Dispositif du jugement'}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
              />
            </div>

            {/* Motifs */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {isAr ? 'الأسباب' : 'Motifs'}
              </label>
              <textarea
                value={formData.motifs}
                onChange={(e) => setFormData(prev => ({ ...prev, motifs: e.target.value }))}
                placeholder={isAr ? 'أسباب الحكم' : 'Motifs du jugement'}
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
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
              className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              {isAr ? 'إنشاء الحكم' : 'Créer le jugement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewJugementModal;
