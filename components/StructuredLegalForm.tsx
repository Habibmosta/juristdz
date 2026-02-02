import React, { useState } from 'react';
import { PersonnePhysique, PersonneMorale, InformationsCabinet, InformationsTribunal, BienImmobilier, InformationsFinancieres } from '../types/legalForms';
import { Language } from '../types';
import { User, Building, FileText, Calendar, MapPin, Phone, Mail, Scale, Gavel, ChevronRight, ChevronDown, Check, AlertCircle } from 'lucide-react';
import MultiplePartiesForm from './MultiplePartiesForm';

interface StructuredLegalFormProps {
  templateId: string;
  language: Language;
  onFormChange: (formData: any) => void;
}

const StructuredLegalForm: React.FC<StructuredLegalFormProps> = ({ templateId, language, onFormChange }) => {
  const isAr = language === 'ar';
  
  // États pour les différentes sections
  const [personnePhysique, setPersonnePhysique] = useState<Partial<PersonnePhysique>>({});
  const [cabinet, setCabinet] = useState<Partial<InformationsCabinet>>({});
  const [tribunal, setTribunal] = useState<Partial<InformationsTribunal>>({});
  const [vendeurs, setVendeurs] = useState<PersonnePhysique[]>([]);
  const [acheteurs, setAcheteurs] = useState<PersonnePhysique[]>([]);
  
  // État pour les sections ouvertes/fermées
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['identite']));

  // Traductions simplifiées
  const t = {
    fr: {
      identite: 'Identité de la Personne',
      cabinet: 'Cabinet Juridique',
      tribunal: 'Tribunal Compétent',
      
      // Champs identité
      nom: 'Nom de famille',
      prenom: 'Prénom',
      nomPere: 'Nom du père',
      prenomPere: 'Prénom du père',
      nomMere: 'Nom de la mère',
      prenomMere: 'Prénom de la mère',
      dateNaissance: 'Date de naissance',
      lieuNaissance: 'Lieu de naissance',
      nationalite: 'Nationalité',
      situationFamiliale: 'Situation familiale',
      profession: 'Profession',
      adresse: 'Adresse complète',
      commune: 'Commune',
      daira: 'Daïra',
      wilaya: 'Wilaya',
      
      // Documents
      typeDocument: 'Type de document',
      numeroDocument: 'Numéro',
      dateDelivrance: 'Date de délivrance',
      lieuDelivrance: 'Lieu de délivrance',
      
      // Cabinet
      nomCabinet: 'Nom du cabinet',
      nomPraticien: 'Nom du praticien',
      prenomPraticien: 'Prénom du praticien',
      qualitePraticien: 'Qualité',
      adresseCabinet: 'Adresse du cabinet',
      telephoneCabinet: 'Téléphone',
      
      // Tribunal
      nomTribunal: 'Nom du tribunal',
      typeTribunal: 'Type de juridiction',
      adresseTribunal: 'Adresse',
      
      // Placeholders
      placeholders: {
        nom: 'Ex: BENALI',
        prenom: 'Ex: Ahmed Mohamed',
        nomPere: 'Ex: BENALI',
        prenomPere: 'Ex: Mohamed',
        adresse: 'Ex: 15 Rue Didouche Mourad, Alger Centre',
        commune: 'Ex: Alger Centre',
        daira: 'Ex: Sidi M\'Hamed',
        numeroDocument: 'Ex: 1234567890123456',
        telephoneCabinet: 'Ex: 021 XX XX XX',
        lieuNaissance: 'Ex: Alger',
        nationalite: 'Ex: Algérienne',
        profession: 'Ex: Enseignant'
      }
    },
    ar: {
      identite: 'هوية الشخص',
      cabinet: 'المكتب القانوني',
      tribunal: 'المحكمة المختصة',
      
      nom: 'اللقب',
      prenom: 'الاسم',
      nomPere: 'لقب الأب',
      prenomPere: 'اسم الأب',
      nomMere: 'لقب الأم',
      prenomMere: 'اسم الأم',
      dateNaissance: 'تاريخ الميلاد',
      lieuNaissance: 'مكان الميلاد',
      nationalite: 'الجنسية',
      situationFamiliale: 'الحالة المدنية',
      profession: 'المهنة',
      adresse: 'العنوان الكامل',
      commune: 'البلدية',
      daira: 'الدائرة',
      wilaya: 'الولاية',
      
      typeDocument: 'نوع الوثيقة',
      numeroDocument: 'الرقم',
      dateDelivrance: 'تاريخ الإصدار',
      lieuDelivrance: 'مكان الإصدار',
      
      nomCabinet: 'اسم المكتب',
      nomPraticien: 'لقب الممارس',
      prenomPraticien: 'اسم الممارس',
      qualitePraticien: 'الصفة',
      adresseCabinet: 'عنوان المكتب',
      telephoneCabinet: 'الهاتف',
      
      nomTribunal: 'اسم المحكمة',
      typeTribunal: 'نوع الجهة القضائية',
      adresseTribunal: 'العنوان',
      
      placeholders: {
        nom: 'مثال: بن علي',
        prenom: 'مثال: أحمد محمد',
        nomPere: 'مثال: بن علي',
        prenomPere: 'مثال: محمد',
        adresse: 'مثال: 15 شارع ديدوش مراد، وسط الجزائر',
        commune: 'مثال: وسط الجزائر',
        daira: 'مثال: سيدي امحمد',
        numeroDocument: 'مثال: 1234567890123456',
        telephoneCabinet: 'مثال: 021 XX XX XX',
        lieuNaissance: 'مثال: الجزائر',
        nationalite: 'مثال: جزائرية',
        profession: 'مثال: أستاذ'
      }
    }
  };

  const labels = t[language];

  // Options pour les listes déroulantes
  const options = {
    typeDocument: {
      CIN: isAr ? 'بطاقة التعريف الوطنية' : 'Carte d\'identité nationale',
      PASSEPORT: isAr ? 'جواز السفر' : 'Passeport',
      PERMIS_CONDUIRE: isAr ? 'رخصة السياقة' : 'Permis de conduire'
    },
    situationFamiliale: {
      CELIBATAIRE: isAr ? 'أعزب/عزباء' : 'Célibataire',
      MARIE: isAr ? 'متزوج/متزوجة' : 'Marié(e)',
      DIVORCE: isAr ? 'مطلق/مطلقة' : 'Divorcé(e)',
      VEUF: isAr ? 'أرمل/أرملة' : 'Veuf/Veuve'
    },
    qualitePraticien: {
      AVOCAT: isAr ? 'محامي' : 'Avocat',
      NOTAIRE: isAr ? 'موثق' : 'Notaire',
      HUISSIER: isAr ? 'محضر قضائي' : 'Huissier de justice'
    },
    typeTribunal: {
      CIVIL: isAr ? 'المحكمة المدنية' : 'Tribunal civil',
      FAMILLE: isAr ? 'محكمة شؤون الأسرة' : 'Tribunal de la famille',
      COMMERCIAL: isAr ? 'المحكمة التجارية' : 'Tribunal de commerce',
      PENAL: isAr ? 'المحكمة الجزائية' : 'Tribunal pénal'
    },
    wilayas: {
      '01': '01 - ' + (isAr ? 'أدرار' : 'Adrar'),
      '02': '02 - ' + (isAr ? 'الشلف' : 'Chlef'),
      '03': '03 - ' + (isAr ? 'الأغواط' : 'Laghouat'),
      '04': '04 - ' + (isAr ? 'أم البواقي' : 'Oum El Bouaghi'),
      '05': '05 - ' + (isAr ? 'باتنة' : 'Batna'),
      '06': '06 - ' + (isAr ? 'بجاية' : 'Béjaïa'),
      '07': '07 - ' + (isAr ? 'بسكرة' : 'Biskra'),
      '08': '08 - ' + (isAr ? 'بشار' : 'Béchar'),
      '09': '09 - ' + (isAr ? 'البليدة' : 'Blida'),
      '10': '10 - ' + (isAr ? 'البويرة' : 'Bouira'),
      '11': '11 - ' + (isAr ? 'تمنراست' : 'Tamanrasset'),
      '12': '12 - ' + (isAr ? 'تبسة' : 'Tébessa'),
      '13': '13 - ' + (isAr ? 'تلمسان' : 'Tlemcen'),
      '14': '14 - ' + (isAr ? 'تيارت' : 'Tiaret'),
      '15': '15 - ' + (isAr ? 'تيزي وزو' : 'Tizi Ouzou'),
      '16': '16 - ' + (isAr ? 'الجزائر' : 'Alger'),
      '17': '17 - ' + (isAr ? 'الجلفة' : 'Djelfa'),
      '18': '18 - ' + (isAr ? 'جيجل' : 'Jijel'),
      '19': '19 - ' + (isAr ? 'سطيف' : 'Sétif'),
      '20': '20 - ' + (isAr ? 'سعيدة' : 'Saïda'),
      '21': '21 - ' + (isAr ? 'سكيكدة' : 'Skikda'),
      '22': '22 - ' + (isAr ? 'سيدي بلعباس' : 'Sidi Bel Abbès'),
      '23': '23 - ' + (isAr ? 'عنابة' : 'Annaba'),
      '24': '24 - ' + (isAr ? 'قالمة' : 'Guelma'),
      '25': '25 - ' + (isAr ? 'قسنطينة' : 'Constantine'),
      '26': '26 - ' + (isAr ? 'المدية' : 'Médéa'),
      '27': '27 - ' + (isAr ? 'مستغانم' : 'Mostaganem'),
      '28': '28 - ' + (isAr ? 'المسيلة' : 'M\'Sila'),
      '29': '29 - ' + (isAr ? 'معسكر' : 'Mascara'),
      '30': '30 - ' + (isAr ? 'ورقلة' : 'Ouargla'),
      '31': '31 - ' + (isAr ? 'وهران' : 'Oran'),
      '32': '32 - ' + (isAr ? 'البيض' : 'El Bayadh'),
      '33': '33 - ' + (isAr ? 'إليزي' : 'Illizi'),
      '34': '34 - ' + (isAr ? 'برج بوعريريج' : 'Bordj Bou Arréridj'),
      '35': '35 - ' + (isAr ? 'بومرداس' : 'Boumerdès'),
      '36': '36 - ' + (isAr ? 'الطارف' : 'El Tarf'),
      '37': '37 - ' + (isAr ? 'تندوف' : 'Tindouf'),
      '38': '38 - ' + (isAr ? 'تيسمسيلت' : 'Tissemsilt'),
      '39': '39 - ' + (isAr ? 'الوادي' : 'El Oued'),
      '40': '40 - ' + (isAr ? 'خنشلة' : 'Khenchela'),
      '41': '41 - ' + (isAr ? 'سوق أهراس' : 'Souk Ahras'),
      '42': '42 - ' + (isAr ? 'تيبازة' : 'Tipaza'),
      '43': '43 - ' + (isAr ? 'ميلة' : 'Mila'),
      '44': '44 - ' + (isAr ? 'عين الدفلى' : 'Aïn Defla'),
      '45': '45 - ' + (isAr ? 'النعامة' : 'Naâma'),
      '46': '46 - ' + (isAr ? 'عين تموشنت' : 'Aïn Témouchent'),
      '47': '47 - ' + (isAr ? 'غرداية' : 'Ghardaïa'),
      '48': '48 - ' + (isAr ? 'غليزان' : 'Relizane'),
      '49': '49 - ' + (isAr ? 'تيميمون' : 'Timimoun'),
      '50': '50 - ' + (isAr ? 'برج باجي مختار' : 'Bordj Badji Mokhtar'),
      '51': '51 - ' + (isAr ? 'أولاد جلال' : 'Ouled Djellal'),
      '52': '52 - ' + (isAr ? 'بني عباس' : 'Béni Abbès'),
      '53': '53 - ' + (isAr ? 'عين صالح' : 'In Salah'),
      '54': '54 - ' + (isAr ? 'عين قزام' : 'In Guezzam'),
      '55': '55 - ' + (isAr ? 'توقرت' : 'Touggourt'),
      '56': '56 - ' + (isAr ? 'جانت' : 'Djanet'),
      '57': '57 - ' + (isAr ? 'المغير' : 'El M\'Ghair'),
      '58': '58 - ' + (isAr ? 'المنيعة' : 'El Meniaa')
    }
  };

  // Fonction pour basculer l'ouverture d'une section
  const toggleSection = (section: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(section)) {
      newOpenSections.delete(section);
    } else {
      newOpenSections.add(section);
    }
    setOpenSections(newOpenSections);
  };

  // Fonction pour vérifier si une section est complète
  const isSectionComplete = (section: string): boolean => {
    switch (section) {
      case 'identite':
        return !!(personnePhysique.nom && personnePhysique.prenom && 
                 personnePhysique.nomPere && personnePhysique.nomMere);
      case 'cabinet':
        return !!(cabinet.nomCabinet && cabinet.nomPraticien && cabinet.qualitePraticien);
      case 'tribunal':
        return !!(tribunal.nomTribunal && tribunal.typeTribunal);
      default:
        return false;
    }
  };

  // Composant pour un champ de saisie
  const InputField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'date' | 'select';
    options?: Record<string, string>;
    placeholder?: string;
    required?: boolean;
  }> = ({ label, value, onChange, type = 'text', options, placeholder, required = false }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-legal-gold focus:border-transparent outline-none transition-all"
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
          className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-legal-gold focus:border-transparent outline-none transition-all"
          dir={isAr ? 'rtl' : 'ltr'}
        />
      )}
    </div>
  );

  // Composant pour une section pliable
  const CollapsibleSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    sectionKey: string;
    children: React.ReactNode;
  }> = ({ title, icon, sectionKey, children }) => {
    const isOpen = openSections.has(sectionKey);
    const isComplete = isSectionComplete(sectionKey);

    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-legal-gold/10 text-legal-gold">
              {icon}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
              <p className="text-sm text-slate-500">
                {isComplete ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check size={14} />
                    {isAr ? 'مكتمل' : 'Complété'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle size={14} />
                    {isAr ? 'مطلوب' : 'Requis'}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isComplete && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check size={14} className="text-white" />
              </div>
            )}
            {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
        </button>
        
        {isOpen && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Mise à jour du formulaire parent
  React.useEffect(() => {
    const formData = {
      personnePhysique,
      cabinet,
      tribunal
    };
    onFormChange(formData);
  }, [personnePhysique, cabinet, tribunal, onFormChange]);

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Section Identité */}
      <CollapsibleSection
        title={labels.identite}
        icon={<User size={20} />}
        sectionKey="identite"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={labels.nom}
            value={personnePhysique.nom || ''}
            onChange={(value) => setPersonnePhysique(prev => ({ ...prev, nom: value }))}
            placeholder={labels.placeholders.nom}
            required
          />
          <InputField
            label={labels.prenom}
            value={personnePhysique.prenom || ''}
            onChange={(value) => setPersonnePhysique(prev => ({ ...prev, prenom: value }))}
            placeholder={labels.placeholders.prenom}
            required
          />
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            {isAr ? 'النسب' : 'Filiation'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={labels.nomPere}
              value={personnePhysique.nomPere || ''}
              onChange={(value) => setPersonnePhysique(prev => ({ ...prev, nomPere: value }))}
              placeholder={labels.placeholders.nomPere}
              required
            />
            <InputField
              label={labels.prenomPere}
              value={personnePhysique.prenomPere || ''}
              onChange={(value) => setPersonnePhysique(prev => ({ ...prev, prenomPere: value }))}
              placeholder={labels.placeholders.prenomPere}
              required
            />
            <InputField
              label={labels.nomMere}
              value={personnePhysique.nomMere || ''}
              onChange={(value) => setPersonnePhysique(prev => ({ ...prev, nomMere: value }))}
              required
            />
            <InputField
              label={labels.prenomMere}
              value={personnePhysique.prenomMere || ''}
              onChange={(value) => setPersonnePhysique(prev => ({ ...prev, prenomMere: value }))}
              required
            />
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            {isAr ? 'وثيقة الهوية' : 'Document d\'identité'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={labels.typeDocument}
              value={personnePhysique.typeDocument || ''}
              onChange={(value) => setPersonnePhysique(prev => ({ ...prev, typeDocument: value as any }))}
              type="select"
              options={options.typeDocument}
              required
            />
            <InputField
              label={labels.numeroDocument}
              value={personnePhysique.numeroDocument || ''}
              onChange={(value) => setPersonnePhysique(prev => ({ ...prev, numeroDocument: value }))}
              placeholder={labels.placeholders.numeroDocument}
              required
            />
            <InputField
              label={labels.dateDelivrance}
              value={personnePhysique.dateDelivrance || ''}
              onChange={(value) => setPersonnePhysique(prev => ({ ...prev, dateDelivrance: value }))}
              type="date"
            />
            <InputField
              label={labels.lieuDelivrance}
              value={personnePhysique.lieuDelivrance || ''}
              onChange={(value) => setPersonnePhysique(prev => ({ ...prev, lieuDelivrance: value }))}
            />
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            {isAr ? 'معلومات شخصية' : 'Informations personnelles'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={labels.dateNaissance}
              value={personnePhysique.dateNaissance || ''}
              onChange={(value) => setPersonnePhysique(prev => ({ ...prev, dateNaissance: value }))}
              type="date"
            />
            <InputField
              label={labels.lieuNaissance}
              value={personnePhysique.lieuNaissance || ''}
              onChange={(value) => setPersonnePhysique(prev => ({ ...prev, lieuNaissance: value }))}
              placeholder={labels.placeholders.lieuNaissance}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <InputField
              label={labels.nationalite}
              value={personnePhysique.nationalite || ''}
              onChange={(value) => setPersonnePhysique(prev => ({ ...prev, nationalite: value }))}
              placeholder={labels.placeholders.nationalite}
            />
            <InputField
              label={labels.situationFamiliale}
              value={personnePhysique.situationFamiliale || ''}
              onChange={(value) => setPersonnePhysique(prev => ({ ...prev, situationFamiliale: value as any }))}
              type="select"
              options={options.situationFamiliale}
            />
          </div>
          <InputField
            label={labels.profession}
            value={personnePhysique.profession || ''}
            onChange={(value) => setPersonnePhysique(prev => ({ ...prev, profession: value }))}
            placeholder={labels.placeholders.profession}
          />
          
          {/* Champs spécifiques pour les femmes mariées */}
          {personnePhysique.situationFamiliale === 'MARIE' && (
            <div className="mt-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
              <h4 className="text-sm font-semibold text-pink-700 dark:text-pink-300 mb-3 flex items-center gap-2">
                <span>💒</span>
                {isAr ? 'معلومات الزواج' : 'Informations matrimoniales'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label={isAr ? 'اسم العائلة قبل الزواج' : 'Nom de jeune fille'}
                  value={personnePhysique.nomJeuneFille || ''}
                  onChange={(value) => setPersonnePhysique(prev => ({ ...prev, nomJeuneFille: value }))}
                  placeholder={isAr ? 'مثال: خليفي' : 'Ex: KHELIFI'}
                />
                <div></div>
                <InputField
                  label={isAr ? 'لقب الزوج' : 'Nom de l\'époux'}
                  value={personnePhysique.nomEpoux || ''}
                  onChange={(value) => setPersonnePhysique(prev => ({ ...prev, nomEpoux: value }))}
                  placeholder={isAr ? 'مثال: سالم' : 'Ex: SALEM'}
                />
                <InputField
                  label={isAr ? 'اسم الزوج' : 'Prénom de l\'époux'}
                  value={personnePhysique.prenomEpoux || ''}
                  onChange={(value) => setPersonnePhysique(prev => ({ ...prev, prenomEpoux: value }))}
                  placeholder={isAr ? 'مثال: كريم' : 'Ex: Karim'}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            {isAr ? 'العنوان' : 'Adresse'}
          </h4>
          <div className="space-y-4">
            <InputField
              label={labels.adresse}
              value={personnePhysique.adresse || ''}
              onChange={(value) => setPersonnePhysique(prev => ({ ...prev, adresse: value }))}
              placeholder={labels.placeholders.adresse}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label={labels.commune}
                value={personnePhysique.commune || ''}
                onChange={(value) => setPersonnePhysique(prev => ({ ...prev, commune: value }))}
                placeholder={labels.placeholders.commune}
              />
              <InputField
                label={labels.daira}
                value={personnePhysique.daira || ''}
                onChange={(value) => setPersonnePhysique(prev => ({ ...prev, daira: value }))}
                placeholder={labels.placeholders.daira}
              />
              <InputField
                label={labels.wilaya}
                value={personnePhysique.wilaya || ''}
                onChange={(value) => setPersonnePhysique(prev => ({ ...prev, wilaya: value }))}
                type="select"
                options={options.wilayas}
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section Cabinet */}
      <CollapsibleSection
        title={labels.cabinet}
        icon={<Scale size={20} />}
        sectionKey="cabinet"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={labels.nomCabinet}
            value={cabinet.nomCabinet || ''}
            onChange={(value) => setCabinet(prev => ({ ...prev, nomCabinet: value }))}
            required
          />
          <InputField
            label={labels.adresseCabinet}
            value={cabinet.adresseCabinet || ''}
            onChange={(value) => setCabinet(prev => ({ ...prev, adresseCabinet: value }))}
          />
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            {isAr ? 'الممارس' : 'Praticien'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={labels.nomPraticien}
              value={cabinet.nomPraticien || ''}
              onChange={(value) => setCabinet(prev => ({ ...prev, nomPraticien: value }))}
              required
            />
            <InputField
              label={labels.prenomPraticien}
              value={cabinet.prenomPraticien || ''}
              onChange={(value) => setCabinet(prev => ({ ...prev, prenomPraticien: value }))}
              required
            />
            <InputField
              label={labels.qualitePraticien}
              value={cabinet.qualitePraticien || ''}
              onChange={(value) => setCabinet(prev => ({ ...prev, qualitePraticien: value as any }))}
              type="select"
              options={options.qualitePraticien}
              required
            />
            <InputField
              label={labels.telephoneCabinet}
              value={cabinet.telephoneCabinet || ''}
              onChange={(value) => setCabinet(prev => ({ ...prev, telephoneCabinet: value }))}
              placeholder={labels.placeholders.telephoneCabinet}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Section Tribunal */}
      <CollapsibleSection
        title={labels.tribunal}
        icon={<Gavel size={20} />}
        sectionKey="tribunal"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={labels.nomTribunal}
            value={tribunal.nomTribunal || ''}
            onChange={(value) => setTribunal(prev => ({ ...prev, nomTribunal: value }))}
            required
          />
          <InputField
            label={labels.typeTribunal}
            value={tribunal.typeTribunal || ''}
            onChange={(value) => setTribunal(prev => ({ ...prev, typeTribunal: value as any }))}
            type="select"
            options={options.typeTribunal}
            required
          />
          <InputField
            label={labels.adresseTribunal}
            value={tribunal.adresseTribunal || ''}
            onChange={(value) => setTribunal(prev => ({ ...prev, adresseTribunal: value }))}
          />
          <InputField
            label={labels.wilaya}
            value={tribunal.wilayaTribunal || ''}
            onChange={(value) => setTribunal(prev => ({ ...prev, wilayaTribunal: value }))}
            type="select"
            options={options.wilayas}
          />
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default StructuredLegalForm;