import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Language } from '../../types';
import { getCommunesByWilaya } from '../../data/communesAlgerie';

interface FormData {
  // Vendeur
  vendeurNom: string;
  vendeurPrenom: string;
  vendeurNomPere: string;
  vendeurPrenomPere: string;
  vendeurNomMere: string;
  vendeurPrenomMere: string;
  vendeurDateNaissance: string;
  vendeurLieuNaissance: string;
  vendeurCIN: string;
  vendeurAdresse: string;
  vendeurCommune: string;
  vendeurWilaya: string;
  vendeurTelephone: string;
  
  // Acheteur
  acheteurNom: string;
  acheteurPrenom: string;
  acheteurNomPere: string;
  acheteurPrenomPere: string;
  acheteurNomMere: string;
  acheteurPrenomMere: string;
  acheteurDateNaissance: string;
  acheteurLieuNaissance: string;
  acheteurCIN: string;
  acheteurAdresse: string;
  acheteurCommune: string;
  acheteurWilaya: string;
  acheteurTelephone: string;
  
  // Bien
  natureBien: string;
  adresseBien: string;
  superficie: string;
  numeroTitreFoncier: string;
  descriptionBien: string;
  
  // Prix
  prixVente: string;
  modalitePaiement: string;
  dateSignature: string;
}

interface SimpleFormModalProps {
  language: Language;
  onSubmit: (data: FormData) => void;
  onClose: () => void;
}

const SimpleFormModal: React.FC<SimpleFormModalProps> = ({ language, onSubmit, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    vendeurNom: '', vendeurPrenom: '', vendeurNomPere: '', vendeurPrenomPere: '',
    vendeurNomMere: '', vendeurPrenomMere: '', vendeurDateNaissance: '',
    vendeurLieuNaissance: '', vendeurCIN: '', vendeurAdresse: '', vendeurCommune: '',
    vendeurWilaya: '', vendeurTelephone: '',
    
    acheteurNom: '', acheteurPrenom: '', acheteurNomPere: '', acheteurPrenomPere: '',
    acheteurNomMere: '', acheteurPrenomMere: '', acheteurDateNaissance: '',
    acheteurLieuNaissance: '', acheteurCIN: '', acheteurAdresse: '', acheteurCommune: '',
    acheteurWilaya: '', acheteurTelephone: '',
    
    natureBien: '', adresseBien: '', superficie: '', numeroTitreFoncier: '',
    descriptionBien: '',
    
    prixVente: '', modalitePaiement: 'COMPTANT', 
    dateSignature: new Date().toISOString().split('T')[0]
  });

  const [currentSection, setCurrentSection] = useState<'vendeur' | 'acheteur' | 'bien' | 'prix'>('vendeur');
  
  const [communesVendeur, setCommunesVendeur] = useState<any[]>([]);
  const [communesAcheteur, setCommunesAcheteur] = useState<any[]>([]);

  // Charger les communes quand la wilaya change
  useEffect(() => {
    if (formData.vendeurWilaya) {
      const wilayaCode = wilayas.find(w => w.name === formData.vendeurWilaya)?.code || '';
      const communes = getCommunesByWilaya(wilayaCode);
      setCommunesVendeur(communes);
    } else {
      setCommunesVendeur([]);
    }
  }, [formData.vendeurWilaya]);

  useEffect(() => {
    if (formData.acheteurWilaya) {
      const wilayaCode = wilayas.find(w => w.name === formData.acheteurWilaya)?.code || '';
      const communes = getCommunesByWilaya(wilayaCode);
      setCommunesAcheteur(communes);
    } else {
      setCommunesAcheteur([]);
    }
  }, [formData.acheteurWilaya]);

  const wilayas = [
    { code: '01', name: 'Adrar', nameAr: 'أدرار' },
    { code: '02', name: 'Chlef', nameAr: 'الشلف' },
    { code: '03', name: 'Laghouat', nameAr: 'الأغواط' },
    { code: '04', name: 'Oum El Bouaghi', nameAr: 'أم البواقي' },
    { code: '05', name: 'Batna', nameAr: 'باتنة' },
    { code: '06', name: 'Béjaïa', nameAr: 'بجاية' },
    { code: '07', name: 'Biskra', nameAr: 'بسكرة' },
    { code: '08', name: 'Béchar', nameAr: 'بشار' },
    { code: '09', name: 'Blida', nameAr: 'البليدة' },
    { code: '10', name: 'Bouira', nameAr: 'البويرة' },
    { code: '11', name: 'Tamanrasset', nameAr: 'تمنراست' },
    { code: '12', name: 'Tébessa', nameAr: 'تبسة' },
    { code: '13', name: 'Tlemcen', nameAr: 'تلمسان' },
    { code: '14', name: 'Tiaret', nameAr: 'تيارت' },
    { code: '15', name: 'Tizi Ouzou', nameAr: 'تيزي وزو' },
    { code: '16', name: 'Alger', nameAr: 'الجزائر' },
    { code: '17', name: 'Djelfa', nameAr: 'الجلفة' },
    { code: '18', name: 'Jijel', nameAr: 'جيجل' },
    { code: '19', name: 'Sétif', nameAr: 'سطيف' },
    { code: '20', name: 'Saïda', nameAr: 'سعيدة' },
    { code: '21', name: 'Skikda', nameAr: 'سكيكدة' },
    { code: '22', name: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس' },
    { code: '23', name: 'Annaba', nameAr: 'عنابة' },
    { code: '24', name: 'Guelma', nameAr: 'قالمة' },
    { code: '25', name: 'Constantine', nameAr: 'قسنطينة' },
    { code: '26', name: 'Médéa', nameAr: 'المدية' },
    { code: '27', name: 'Mostaganem', nameAr: 'مستغانم' },
    { code: '28', name: "M'Sila", nameAr: 'المسيلة' },
    { code: '29', name: 'Mascara', nameAr: 'معسكر' },
    { code: '30', name: 'Ouargla', nameAr: 'ورقلة' },
    { code: '31', name: 'Oran', nameAr: 'وهران' },
    { code: '32', name: 'El Bayadh', nameAr: 'البيض' },
    { code: '33', name: 'Illizi', nameAr: 'إليزي' },
    { code: '34', name: 'Bordj Bou Arréridj', nameAr: 'برج بوعريريج' },
    { code: '35', name: 'Boumerdès', nameAr: 'بومرداس' },
    { code: '36', name: 'El Tarf', nameAr: 'الطارف' },
    { code: '37', name: 'Tindouf', nameAr: 'تندوف' },
    { code: '38', name: 'Tissemsilt', nameAr: 'تيسمسيلت' },
    { code: '39', name: 'El Oued', nameAr: 'الوادي' },
    { code: '40', name: 'Khenchela', nameAr: 'خنشلة' },
    { code: '41', name: 'Souk Ahras', nameAr: 'سوق أهراس' },
    { code: '42', name: 'Tipaza', nameAr: 'تيبازة' },
    { code: '43', name: 'Mila', nameAr: 'ميلة' },
    { code: '44', name: 'Aïn Defla', nameAr: 'عين الدفلى' },
    { code: '45', name: 'Naâma', nameAr: 'النعامة' },
    { code: '46', name: 'Aïn Témouchent', nameAr: 'عين تموشنت' },
    { code: '47', name: 'Ghardaïa', nameAr: 'غرداية' },
    { code: '48', name: 'Relizane', nameAr: 'غليزان' },
    { code: '49', name: 'Timimoun', nameAr: 'تيميمون' },
    { code: '50', name: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار' },
    { code: '51', name: 'Ouled Djellal', nameAr: 'أولاد جلال' },
    { code: '52', name: 'Béni Abbès', nameAr: 'بني عباس' },
    { code: '53', name: 'In Salah', nameAr: 'عين صالح' },
    { code: '54', name: 'In Guezzam', nameAr: 'عين قزام' },
    { code: '55', name: 'Touggourt', nameAr: 'تقرت' },
    { code: '56', name: 'Djanet', nameAr: 'جانت' },
    { code: '57', name: "El M'Ghair", nameAr: 'المغير' },
    { code: '58', name: 'El Meniaa', nameAr: 'المنيعة' }
  ];

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isAr = language === 'ar';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isAr ? 'نموذج بيانات الوثيقة' : 'Formulaire de Saisie'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-slate-700">
          <button
            onClick={() => setCurrentSection('vendeur')}
            className={`flex-1 py-3 px-4 font-semibold ${
              currentSection === 'vendeur'
                ? 'bg-legal-gold text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {isAr ? 'البائع' : 'Vendeur'}
          </button>
          <button
            onClick={() => setCurrentSection('acheteur')}
            className={`flex-1 py-3 px-4 font-semibold ${
              currentSection === 'acheteur'
                ? 'bg-legal-gold text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {isAr ? 'المشتري' : 'Acheteur'}
          </button>
          <button
            onClick={() => setCurrentSection('bien')}
            className={`flex-1 py-3 px-4 font-semibold ${
              currentSection === 'bien'
                ? 'bg-legal-gold text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {isAr ? 'العقار' : 'Bien'}
          </button>
          <button
            onClick={() => setCurrentSection('prix')}
            className={`flex-1 py-3 px-4 font-semibold ${
              currentSection === 'prix'
                ? 'bg-legal-gold text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {isAr ? 'الثمن' : 'Prix'}
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Section Vendeur */}
          {currentSection === 'vendeur' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.vendeurNom}
                    onChange={(e) => handleChange('vendeurNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="Ex: BENALI"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.vendeurPrenom}
                    onChange={(e) => handleChange('vendeurPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="Ex: Ahmed"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'لقب الأب' : 'Nom du père'} *
                  </label>
                  <input
                    type="text"
                    value={formData.vendeurNomPere}
                    onChange={(e) => handleChange('vendeurNomPere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اسم الأب' : 'Prénom du père'} *
                  </label>
                  <input
                    type="text"
                    value={formData.vendeurPrenomPere}
                    onChange={(e) => handleChange('vendeurPrenomPere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'لقب الأم' : 'Nom de la mère'} *
                  </label>
                  <input
                    type="text"
                    value={formData.vendeurNomMere}
                    onChange={(e) => handleChange('vendeurNomMere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اسم الأم' : 'Prénom de la mère'} *
                  </label>
                  <input
                    type="text"
                    value={formData.vendeurPrenomMere}
                    onChange={(e) => handleChange('vendeurPrenomMere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
                  </label>
                  <input
                    type="text"
                    value={formData.vendeurCIN}
                    onChange={(e) => handleChange('vendeurCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="18 chiffres"
                    maxLength={18}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.vendeurDateNaissance}
                    onChange={(e) => handleChange('vendeurDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.vendeurAdresse}
                  onChange={(e) => handleChange('vendeurAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="Ex: 15 Rue Didouche Mourad, Alger"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الولاية' : 'Wilaya'}
                  </label>
                  <select
                    value={formData.vendeurWilaya}
                    onChange={(e) => handleChange('vendeurWilaya', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="" className="text-slate-900 dark:text-slate-100">-- {isAr ? 'اختر' : 'Sélectionner'} --</option>
                    {wilayas.map(w => (
                      <option key={w.code} value={w.name} className="text-slate-900 dark:text-slate-100">
                        {w.code} - {isAr ? w.nameAr : w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'البلدية' : 'Commune'}
                  </label>
                  <select
                    value={formData.vendeurCommune}
                    onChange={(e) => handleChange('vendeurCommune', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    disabled={!formData.vendeurWilaya}
                  >
                    <option value="" className="text-slate-900 dark:text-slate-100">-- {isAr ? 'اختر' : 'Sélectionner'} --</option>
                    {communesVendeur.map(c => (
                      <option key={c.code} value={c.name_fr} className="text-slate-900 dark:text-slate-100">
                        {isAr ? c.name_ar : c.name_fr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الهاتف' : 'Téléphone'}
                  </label>
                  <input
                    type="tel"
                    value={formData.vendeurTelephone}
                    onChange={(e) => handleChange('vendeurTelephone', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="0555123456"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section Acheteur - Mêmes champs */}
          {currentSection === 'acheteur' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اللقب' : 'Nom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.acheteurNom}
                    onChange={(e) => handleChange('acheteurNom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الاسم' : 'Prénom'} *
                  </label>
                  <input
                    type="text"
                    value={formData.acheteurPrenom}
                    onChange={(e) => handleChange('acheteurPrenom', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'لقب الأب' : 'Nom du père'} *
                  </label>
                  <input
                    type="text"
                    value={formData.acheteurNomPere}
                    onChange={(e) => handleChange('acheteurNomPere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اسم الأب' : 'Prénom du père'} *
                  </label>
                  <input
                    type="text"
                    value={formData.acheteurPrenomPere}
                    onChange={(e) => handleChange('acheteurPrenomPere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'لقب الأم' : 'Nom de la mère'} *
                  </label>
                  <input
                    type="text"
                    value={formData.acheteurNomMere}
                    onChange={(e) => handleChange('acheteurNomMere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'اسم الأم' : 'Prénom de la mère'} *
                  </label>
                  <input
                    type="text"
                    value={formData.acheteurPrenomMere}
                    onChange={(e) => handleChange('acheteurPrenomMere', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم بطاقة التعريف' : 'Numéro CIN'} *
                  </label>
                  <input
                    type="text"
                    value={formData.acheteurCIN}
                    onChange={(e) => handleChange('acheteurCIN', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    maxLength={18}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'تاريخ الميلاد' : 'Date de naissance'} *
                  </label>
                  <input
                    type="date"
                    value={formData.acheteurDateNaissance}
                    onChange={(e) => handleChange('acheteurDateNaissance', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'العنوان' : 'Adresse'} *
                </label>
                <input
                  type="text"
                  value={formData.acheteurAdresse}
                  onChange={(e) => handleChange('acheteurAdresse', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الولاية' : 'Wilaya'}
                  </label>
                  <select
                    value={formData.acheteurWilaya}
                    onChange={(e) => handleChange('acheteurWilaya', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="" className="text-slate-900 dark:text-slate-100">-- {isAr ? 'اختر' : 'Sélectionner'} --</option>
                    {wilayas.map(w => (
                      <option key={w.code} value={w.name} className="text-slate-900 dark:text-slate-100">
                        {w.code} - {isAr ? w.nameAr : w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'البلدية' : 'Commune'}
                  </label>
                  <select
                    value={formData.acheteurCommune}
                    onChange={(e) => handleChange('acheteurCommune', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    disabled={!formData.acheteurWilaya}
                  >
                    <option value="" className="text-slate-900 dark:text-slate-100">-- {isAr ? 'اختر' : 'Sélectionner'} --</option>
                    {communesAcheteur.map(c => (
                      <option key={c.code} value={c.name_fr} className="text-slate-900 dark:text-slate-100">
                        {isAr ? c.name_ar : c.name_fr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'الهاتف' : 'Téléphone'}
                  </label>
                  <input
                    type="tel"
                    value={formData.acheteurTelephone}
                    onChange={(e) => handleChange('acheteurTelephone', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    placeholder="0555123456"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section Bien */}
          {currentSection === 'bien' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'طبيعة العقار' : 'Nature du bien'} *
                </label>
                <select
                  value={formData.natureBien}
                  onChange={(e) => handleChange('natureBien', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="" className="text-slate-900 dark:text-slate-100">-- {isAr ? 'اختر' : 'Sélectionner'} --</option>
                  <option value="APPARTEMENT" className="text-slate-900 dark:text-slate-100">{isAr ? 'شقة' : 'Appartement'}</option>
                  <option value="VILLA" className="text-slate-900 dark:text-slate-100">{isAr ? 'فيلا' : 'Villa'}</option>
                  <option value="TERRAIN" className="text-slate-900 dark:text-slate-100">{isAr ? 'أرض' : 'Terrain'}</option>
                  <option value="LOCAL_COMMERCIAL" className="text-slate-900 dark:text-slate-100">{isAr ? 'محل تجاري' : 'Local commercial'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'عنوان العقار' : 'Adresse du bien'} *
                </label>
                <input
                  type="text"
                  value={formData.adresseBien}
                  onChange={(e) => handleChange('adresseBien', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'المساحة (م²)' : 'Superficie (m²)'} *
                  </label>
                  <input
                    type="number"
                    value={formData.superficie}
                    onChange={(e) => handleChange('superficie', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                    {isAr ? 'رقم السند العقاري' : 'Numéro titre foncier'}
                  </label>
                  <input
                    type="text"
                    value={formData.numeroTitreFoncier}
                    onChange={(e) => handleChange('numeroTitreFoncier', e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'وصف العقار' : 'Description'}
                </label>
                <textarea
                  value={formData.descriptionBien}
                  onChange={(e) => handleChange('descriptionBien', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Section Prix */}
          {currentSection === 'prix' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'ثمن البيع (دج)' : 'Prix de vente (DA)'} *
                </label>
                <input
                  type="number"
                  value={formData.prixVente}
                  onChange={(e) => handleChange('prixVente', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  placeholder="5000000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'طريقة الدفع' : 'Modalité de paiement'} *
                </label>
                <select
                  value={formData.modalitePaiement}
                  onChange={(e) => handleChange('modalitePaiement', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="COMPTANT" className="text-slate-900 dark:text-slate-100">{isAr ? 'نقداً' : 'Comptant'}</option>
                  <option value="ECHELONNE" className="text-slate-900 dark:text-slate-100">{isAr ? 'على أقساط' : 'Échelonné'}</option>
                  <option value="CHEQUE" className="text-slate-900 dark:text-slate-100">{isAr ? 'شيك' : 'Chèque'}</option>
                  <option value="VIREMENT" className="text-slate-900 dark:text-slate-100">{isAr ? 'تحويل بنكي' : 'Virement'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-900 dark:text-slate-100">
                  {isAr ? 'تاريخ التوقيع' : 'Date de signature'} *
                </label>
                <input
                  type="date"
                  value={formData.dateSignature}
                  onChange={(e) => handleChange('dateSignature', e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t dark:border-slate-700 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isAr ? 'إلغاء' : 'Annuler'}
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-legal-gold text-white rounded-lg hover:bg-legal-gold/90 flex items-center gap-2"
          >
            <Check size={20} />
            {isAr ? 'حفظ' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleFormModal;
