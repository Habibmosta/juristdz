import React, { useState } from 'react';
import { PersonnePhysique } from '../types/legalForms';
import { Language } from '../types';
import { User, Plus, Minus, Users, Heart } from 'lucide-react';

interface MultiplePartiesFormProps {
  language: Language;
  partieType: 'vendeurs' | 'acheteurs';
  parties: PersonnePhysique[];
  onPartiesChange: (parties: PersonnePhysique[]) => void;
}

const MultiplePartiesForm: React.FC<MultiplePartiesFormProps> = ({
  language,
  partieType,
  parties,
  onPartiesChange
}) => {
  const isAr = language === 'ar';

  const t = {
    fr: {
      vendeurs: 'Vendeurs',
      acheteurs: 'Acheteurs',
      addPerson: 'Ajouter une personne',
      removePerson: 'Retirer cette personne',
      person: 'Personne',
      
      // Champs
      nom: 'Nom de famille',
      prenom: 'Prénom',
      nomJeuneFille: 'Nom de jeune fille',
      nomEpoux: 'Nom de l\'époux',
      prenomEpoux: 'Prénom de l\'époux',
      situationFamiliale: 'Situation familiale',
      qualite: 'Qualité dans l\'acte',
      
      // Options
      situationOptions: {
        CELIBATAIRE: 'Célibataire',
        MARIE: 'Marié(e)',
        DIVORCE: 'Divorcé(e)',
        VEUF: 'Veuf/Veuve'
      },
      qualiteOptions: {
        VENDEUR: 'Vendeur',
        ACHETEUR: 'Acheteur',
        COPROPRIÉTAIRE: 'Copropriétaire'
      },
      
      // Placeholders
      placeholders: {
        nom: 'Ex: BENALI',
        prenom: 'Ex: Fatima',
        nomJeuneFille: 'Ex: KHELIFI (avant mariage)',
        nomEpoux: 'Ex: SALEM',
        prenomEpoux: 'Ex: Karim'
      }
    },
    ar: {
      vendeurs: 'البائعون',
      acheteurs: 'المشترون',
      addPerson: 'إضافة شخص',
      removePerson: 'حذف هذا الشخص',
      person: 'شخص',
      
      nom: 'اللقب',
      prenom: 'الاسم',
      nomJeuneFille: 'اسم العائلة قبل الزواج',
      nomEpoux: 'لقب الزوج',
      prenomEpoux: 'اسم الزوج',
      situationFamiliale: 'الحالة المدنية',
      qualite: 'الصفة في العقد',
      
      situationOptions: {
        CELIBATAIRE: 'أعزب/عزباء',
        MARIE: 'متزوج/متزوجة',
        DIVORCE: 'مطلق/مطلقة',
        VEUF: 'أرمل/أرملة'
      },
      qualiteOptions: {
        VENDEUR: 'بائع',
        ACHETEUR: 'مشتري',
        COPROPRIÉTAIRE: 'مالك مشترك'
      },
      
      placeholders: {
        nom: 'مثال: بن علي',
        prenom: 'مثال: فاطمة',
        nomJeuneFille: 'مثال: خليفي (قبل الزواج)',
        nomEpoux: 'مثال: سالم',
        prenomEpoux: 'مثال: كريم'
      }
    }
  };

  const labels = t[language];

  // Ajouter une nouvelle personne
  const addPerson = () => {
    const newPerson: Partial<PersonnePhysique> = {
      nom: '',
      prenom: '',
      situationFamiliale: 'CELIBATAIRE',
      qualite: partieType === 'vendeurs' ? 'VENDEUR' : 'ACHETEUR'
    };
    onPartiesChange([...parties, newPerson as PersonnePhysique]);
  };

  // Retirer une personne
  const removePerson = (index: number) => {
    const newParties = parties.filter((_, i) => i !== index);
    onPartiesChange(newParties);
  };

  // Mettre à jour une personne
  const updatePerson = (index: number, field: keyof PersonnePhysique, value: any) => {
    const newParties = [...parties];
    newParties[index] = { ...newParties[index], [field]: value };
    onPartiesChange(newParties);
  };

  // Composant pour un champ de saisie
  const InputField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'select';
    options?: Record<string, string>;
    placeholder?: string;
    required?: boolean;
  }> = ({ label, value, onChange, type = 'text', options, placeholder, required = false }) => (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-legal-gold focus:border-transparent outline-none"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <option value="">-- {isAr ? 'اختر' : 'Sélectionner'} --</option>
          {options && Object.entries(options).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-legal-gold focus:border-transparent outline-none"
          dir={isAr ? 'rtl' : 'ltr'}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-legal-gold" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            {labels[partieType]} ({parties.length})
          </h3>
        </div>
        <button
          onClick={addPerson}
          className="flex items-center gap-2 px-3 py-2 bg-legal-gold text-white rounded-lg text-sm hover:bg-legal-gold/90 transition-colors"
        >
          <Plus size={14} />
          {labels.addPerson}
        </button>
      </div>

      {parties.map((person, index) => (
        <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {labels.person} {index + 1}
              </span>
            </div>
            {parties.length > 1 && (
              <button
                onClick={() => removePerson(index)}
                className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs transition-colors"
              >
                <Minus size={12} />
                {labels.removePerson}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={labels.nom}
              value={person.nom || ''}
              onChange={(value) => updatePerson(index, 'nom', value)}
              placeholder={labels.placeholders.nom}
              required
            />
            <InputField
              label={labels.prenom}
              value={person.prenom || ''}
              onChange={(value) => updatePerson(index, 'prenom', value)}
              placeholder={labels.placeholders.prenom}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <InputField
              label={labels.situationFamiliale}
              value={person.situationFamiliale || ''}
              onChange={(value) => updatePerson(index, 'situationFamiliale', value)}
              type="select"
              options={labels.situationOptions}
            />
            <InputField
              label={labels.qualite}
              value={person.qualite || ''}
              onChange={(value) => updatePerson(index, 'qualite', value)}
              type="select"
              options={labels.qualiteOptions}
            />
          </div>

          {/* Champs spécifiques pour les femmes mariées */}
          {person.situationFamiliale === 'MARIE' && (
            <div className="mt-4 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={14} className="text-pink-600" />
                <span className="text-sm font-medium text-pink-700 dark:text-pink-300">
                  {isAr ? 'معلومات الزواج' : 'Informations matrimoniales'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label={labels.nomJeuneFille}
                  value={person.nomJeuneFille || ''}
                  onChange={(value) => updatePerson(index, 'nomJeuneFille', value)}
                  placeholder={labels.placeholders.nomJeuneFille}
                />
                <div></div> {/* Espace vide pour l'alignement */}
                <InputField
                  label={labels.nomEpoux}
                  value={person.nomEpoux || ''}
                  onChange={(value) => updatePerson(index, 'nomEpoux', value)}
                  placeholder={labels.placeholders.nomEpoux}
                />
                <InputField
                  label={labels.prenomEpoux}
                  value={person.prenomEpoux || ''}
                  onChange={(value) => updatePerson(index, 'prenomEpoux', value)}
                  placeholder={labels.placeholders.prenomEpoux}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {parties.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm">
            {isAr ? 'لا توجد أطراف مضافة' : 'Aucune partie ajoutée'}
          </p>
          <button
            onClick={addPerson}
            className="mt-2 text-legal-gold hover:underline text-sm"
          >
            {labels.addPerson}
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiplePartiesForm;