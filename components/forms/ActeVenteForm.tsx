import React, { useState } from 'react';
import { Language } from '../../types';
import { ChevronRight, ChevronLeft, Check, Home, User, DollarSign, FileText, Shield } from 'lucide-react';
import ProfessionalInput from './ProfessionalInput';
import { 
  validateCIN, 
  validatePhoneAlgeria, 
  validateAmount, 
  validateBirthDate,
  validateName,
  validateAddress,
  amountToWords
} from '../../utils/algerianValidators';

interface ActeVenteData {
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
  vendeurDateCIN: string;
  vendeurLieuCIN: string;
  vendeurAdresse: string;
  vendeurCommune: string;
  vendeurWilaya: string;
  vendeurProfession: string;
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
  acheteurDateCIN: string;
  acheteurLieuCIN: string;
  acheteurAdresse: string;
  acheteurCommune: string;
  acheteurWilaya: string;
  acheteurProfession: string;
  acheteurTelephone: string;
  
  // Bien
  natureBien: string;
  adresseBien: string;
  superficie: string;
  numeroTitreFoncier: string;
  sectionCadastrale: string;
  conservationFonciere: string;
  descriptionBien: string;
  
  // Prix
  prixVente: string;
  modalitePaiement: string;
  dateSignature: string;
  
  // Garanties
  garantieEviction: boolean;
  garantieVicesCaches: boolean;
  servitudes: string;
  charges: string;
}

interface ActeVenteFormProps {
  language: Language;
  onFormChange: (data: ActeVenteData) => void;
  onComplete: () => void;
}

type Step = 'vendeur' | 'acheteur' | 'bien' | 'prix' | 'garanties';

const ActeVenteForm: React.FC<ActeVenteFormProps> = ({ language, onFormChange, onComplete }) => {
  const isAr = language === 'ar';
  
  const [currentStep, setCurrentStep] = useState<Step>('vendeur');
  const [formData, setFormData] = useState<ActeVenteData>({
    vendeurNom: '', vendeurPrenom: '', vendeurNomPere: '', vendeurPrenomPere: '',
    vendeurNomMere: '', vendeurPrenomMere: '', vendeurDateNaissance: '',
    vendeurLieuNaissance: '', vendeurCIN: '', vendeurDateCIN: '', vendeurLieuCIN: '',
    vendeurAdresse: '', vendeurCommune: '', vendeurWilaya: '', vendeurProfession: '',
    vendeurTelephone: '',
    
    acheteurNom: '', acheteurPrenom: '', acheteurNomPere: '', acheteurPrenomPere: '',
    acheteurNomMere: '', acheteurPrenomMere: '', acheteurDateNaissance: '',
    acheteurLieuNaissance: '', acheteurCIN: '', acheteurDateCIN: '', acheteurLieuCIN: '',
    acheteurAdresse: '', acheteurCommune: '', acheteurWilaya: '', acheteurProfession: '',
    acheteurTelephone: '',
    
    natureBien: '', adresseBien: '', superficie: '', numeroTitreFoncier: '',
    sectionCadastrale: '', conservationFonciere: '', descriptionBien: '',
    
    prixVente: '', modalitePaiement: 'COMPTANT', dateSignature: new Date().toISOString().split('T')[0],
    
    garantieEviction: true, garantieVicesCaches: true, servitudes: '', charges: ''
  });

  const updateField = (field: keyof ActeVenteData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      onFormChange(newData);
      return newData;
    });
  };

  const steps: { id: Step; label_fr: string; label_ar: string; icon: any }[] = [
    { id: 'vendeur', label_fr: 'Vendeur', label_ar: 'البائع', icon: User },
    { id: 'acheteur', label_fr: 'Acheteur', label_ar: 'المشتري', icon: User },
    { id: 'bien', label_fr: 'Bien', label_ar: 'العقار', icon: Home },
    { id: 'prix', label_fr: 'Prix', label_ar: 'الثمن', icon: DollarSign },
    { id: 'garanties', label_fr: 'Garanties', label_ar: 'الضمانات', icon: Shield }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const canGoNext = () => {
    // Validation basique pour passer à l'étape suivante
    switch (currentStep) {
      case 'vendeur':
        return formData.vendeurNom && formData.vendeurPrenom && formData.vendeurCIN;
      case 'acheteur':
        return formData.acheteurNom && formData.acheteurPrenom && formData.acheteurCIN;
      case 'bien':
        return formData.natureBien && formData.adresseBien && formData.superficie;
      case 'prix':
        return formData.prixVente && formData.modalitePaiement;
      case 'garanties':
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    } else {
      onComplete();
    }
  };

  const goPrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const wilayas = [
    { value: '16', label: '16 - ' + (isAr ? 'الجزائر' : 'Alger') },
    { value: '31', label: '31 - ' + (isAr ? 'وهران' : 'Oran') },
    { value: '25', label: '25 - ' + (isAr ? 'قسنطينة' : 'Constantine') },
    // ... autres wilayas
  ];

  return (
    <div className="space-y-6">
      {/* Barre de progression */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;
            
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col items-center gap-2 transition-all ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                >
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${isActive ? 'bg-legal-gold text-white shadow-lg' : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-slate-200 dark:bg-slate-700 text-slate-500' : ''}
                  `}>
                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                  </div>
                  <span className={`text-xs font-medium ${
                    isActive ? 'text-legal-gold' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {isAr ? step.label_ar : step.label_fr}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isAr ? 'الخطوة' : 'Étape'} {currentStepIndex + 1} {isAr ? 'من' : 'sur'} {steps.length}
          </p>
        </div>
      </div>

      {/* Contenu du formulaire */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-3">
          {React.createElement(steps[currentStepIndex].icon, { size: 28, className: 'text-legal-gold' })}
          {isAr ? steps[currentStepIndex].label_ar : steps[currentStepIndex].label_fr}
        </h2>

        {/* Étape Vendeur */}
        {currentStep === 'vendeur' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfessionalInput
                label={isAr ? 'اللقب' : 'Nom de famille'}
                value={formData.vendeurNom}
                onChange={(v) => updateField('vendeurNom', v)}
                required
                placeholder="Ex: BENALI"
                helpText="Nom tel qu'il apparaît sur la CIN"
                example="BENALI, KHELIFI, SALEM"
                legalRef="Art. 324 Code de Procédure Civile"
                validator={validateName}
                language={language}
              />
              <ProfessionalInput
                label={isAr ? 'الاسم' : 'Prénom'}
                value={formData.vendeurPrenom}
                onChange={(v) => updateField('vendeurPrenom', v)}
                required
                placeholder="Ex: Ahmed Mohamed"
                validator={validateName}
                language={language}
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                {isAr ? 'النسب (إجباري)' : 'Filiation (obligatoire)'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfessionalInput
                  label={isAr ? 'لقب الأب' : 'Nom du père'}
                  value={formData.vendeurNomPere}
                  onChange={(v) => updateField('vendeurNomPere', v)}
                  required
                  validator={validateName}
                  language={language}
                />
                <ProfessionalInput
                  label={isAr ? 'اسم الأب' : 'Prénom du père'}
                  value={formData.vendeurPrenomPere}
                  onChange={(v) => updateField('vendeurPrenomPere', v)}
                  required
                  validator={validateName}
                  language={language}
                />
                <ProfessionalInput
                  label={isAr ? 'لقب الأم' : 'Nom de la mère'}
                  value={formData.vendeurNomMere}
                  onChange={(v) => updateField('vendeurNomMere', v)}
                  required
                  validator={validateName}
                  language={language}
                />
                <ProfessionalInput
                  label={isAr ? 'اسم الأم' : 'Prénom de la mère'}
                  value={formData.vendeurPrenomMere}
                  onChange={(v) => updateField('vendeurPrenomMere', v)}
                  required
                  validator={validateName}
                  language={language}
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-4">
                {isAr ? 'وثيقة الهوية' : 'Document d\'identité'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfessionalInput
                  label={isAr ? 'رقم بطاقة التعريف الوطنية' : 'Numéro CIN'}
                  value={formData.vendeurCIN}
                  onChange={(v) => updateField('vendeurCIN', v)}
                  required
                  placeholder="123456789012345678"
                  helpText="18 chiffres exactement"
                  example="123456789012345678"
                  validator={validateCIN}
                  language={language}
                  maxLength={18}
                />
                <ProfessionalInput
                  label={isAr ? 'تاريخ الإصدار' : 'Date de délivrance'}
                  value={formData.vendeurDateCIN}
                  onChange={(v) => updateField('vendeurDateCIN', v)}
                  type="date"
                  language={language}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfessionalInput
                label={isAr ? 'تاريخ الميلاد' : 'Date de naissance'}
                value={formData.vendeurDateNaissance}
                onChange={(v) => updateField('vendeurDateNaissance', v)}
                type="date"
                required
                validator={validateBirthDate}
                language={language}
              />
              <ProfessionalInput
                label={isAr ? 'مكان الميلاد' : 'Lieu de naissance'}
                value={formData.vendeurLieuNaissance}
                onChange={(v) => updateField('vendeurLieuNaissance', v)}
                required
                placeholder="Ex: Alger"
                language={language}
              />
            </div>

            <ProfessionalInput
              label={isAr ? 'العنوان الكامل' : 'Adresse complète'}
              value={formData.vendeurAdresse}
              onChange={(v) => updateField('vendeurAdresse', v)}
              required
              placeholder="Ex: 15 Rue Didouche Mourad, Alger Centre"
              helpText="Adresse actuelle et complète"
              validator={validateAddress}
              language={language}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ProfessionalInput
                label={isAr ? 'البلدية' : 'Commune'}
                value={formData.vendeurCommune}
                onChange={(v) => updateField('vendeurCommune', v)}
                required
                language={language}
              />
              <ProfessionalInput
                label={isAr ? 'الولاية' : 'Wilaya'}
                value={formData.vendeurWilaya}
                onChange={(v) => updateField('vendeurWilaya', v)}
                type="select"
                options={wilayas}
                required
                language={language}
              />
              <ProfessionalInput
                label={isAr ? 'الهاتف' : 'Téléphone'}
                value={formData.vendeurTelephone}
                onChange={(v) => updateField('vendeurTelephone', v)}
                type="tel"
                placeholder="0555123456"
                validator={validatePhoneAlgeria}
                language={language}
              />
            </div>
          </div>
        )}

        {/* Étape Acheteur */}
        {currentStep === 'acheteur' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfessionalInput
                label={isAr ? 'اللقب' : 'Nom de famille'}
                value={formData.acheteurNom}
                onChange={(v) => updateField('acheteurNom', v)}
                required
                placeholder="Ex: KHELIFI"
                helpText="Nom tel qu'il apparaît sur la CIN"
                example="KHELIFI, SALEM, MEZIANE"
                legalRef="Art. 324 Code de Procédure Civile"
                validator={validateName}
                language={language}
              />
              <ProfessionalInput
                label={isAr ? 'الاسم' : 'Prénom'}
                value={formData.acheteurPrenom}
                onChange={(v) => updateField('acheteurPrenom', v)}
                required
                placeholder="Ex: Karim"
                validator={validateName}
                language={language}
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                {isAr ? 'النسب (إجباري)' : 'Filiation (obligatoire)'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfessionalInput
                  label={isAr ? 'لقب الأب' : 'Nom du père'}
                  value={formData.acheteurNomPere}
                  onChange={(v) => updateField('acheteurNomPere', v)}
                  required
                  validator={validateName}
                  language={language}
                />
                <ProfessionalInput
                  label={isAr ? 'اسم الأب' : 'Prénom du père'}
                  value={formData.acheteurPrenomPere}
                  onChange={(v) => updateField('acheteurPrenomPere', v)}
                  required
                  validator={validateName}
                  language={language}
                />
                <ProfessionalInput
                  label={isAr ? 'لقب الأم' : 'Nom de la mère'}
                  value={formData.acheteurNomMere}
                  onChange={(v) => updateField('acheteurNomMere', v)}
                  required
                  validator={validateName}
                  language={language}
                />
                <ProfessionalInput
                  label={isAr ? 'اسم الأم' : 'Prénom de la mère'}
                  value={formData.acheteurPrenomMere}
                  onChange={(v) => updateField('acheteurPrenomMere', v)}
                  required
                  validator={validateName}
                  language={language}
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-4">
                {isAr ? 'وثيقة الهوية' : 'Document d\'identité'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfessionalInput
                  label={isAr ? 'رقم بطاقة التعريف الوطنية' : 'Numéro CIN'}
                  value={formData.acheteurCIN}
                  onChange={(v) => updateField('acheteurCIN', v)}
                  required
                  placeholder="123456789012345678"
                  helpText="18 chiffres exactement"
                  example="123456789012345678"
                  validator={validateCIN}
                  language={language}
                  maxLength={18}
                />
                <ProfessionalInput
                  label={isAr ? 'تاريخ الإصدار' : 'Date de délivrance'}
                  value={formData.acheteurDateCIN}
                  onChange={(v) => updateField('acheteurDateCIN', v)}
                  type="date"
                  language={language}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfessionalInput
                label={isAr ? 'تاريخ الميلاد' : 'Date de naissance'}
                value={formData.acheteurDateNaissance}
                onChange={(v) => updateField('acheteurDateNaissance', v)}
                type="date"
                required
                validator={validateBirthDate}
                language={language}
              />
              <ProfessionalInput
                label={isAr ? 'مكان الميلاد' : 'Lieu de naissance'}
                value={formData.acheteurLieuNaissance}
                onChange={(v) => updateField('acheteurLieuNaissance', v)}
                required
                placeholder="Ex: Oran"
                language={language}
              />
            </div>

            <ProfessionalInput
              label={isAr ? 'العنوان الكامل' : 'Adresse complète'}
              value={formData.acheteurAdresse}
              onChange={(v) => updateField('acheteurAdresse', v)}
              required
              placeholder="Ex: 25 Boulevard de la République, Oran"
              helpText="Adresse actuelle et complète"
              validator={validateAddress}
              language={language}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ProfessionalInput
                label={isAr ? 'البلدية' : 'Commune'}
                value={formData.acheteurCommune}
                onChange={(v) => updateField('acheteurCommune', v)}
                required
                language={language}
              />
              <ProfessionalInput
                label={isAr ? 'الولاية' : 'Wilaya'}
                value={formData.acheteurWilaya}
                onChange={(v) => updateField('acheteurWilaya', v)}
                type="select"
                options={wilayas}
                required
                language={language}
              />
              <ProfessionalInput
                label={isAr ? 'الهاتف' : 'Téléphone'}
                value={formData.acheteurTelephone}
                onChange={(v) => updateField('acheteurTelephone', v)}
                type="tel"
                placeholder="0555123456"
                validator={validatePhoneAlgeria}
                language={language}
              />
            </div>
          </div>
        )}

        {currentStep === 'bien' && (
          <div className="space-y-6">
            <ProfessionalInput
              label={isAr ? 'طبيعة العقار' : 'Nature du bien'}
              value={formData.natureBien}
              onChange={(v) => updateField('natureBien', v)}
              type="select"
              options={[
                { value: 'APPARTEMENT', label: isAr ? 'شقة' : 'Appartement' },
                { value: 'VILLA', label: isAr ? 'فيلا' : 'Villa' },
                { value: 'TERRAIN', label: isAr ? 'أرض' : 'Terrain' },
                { value: 'LOCAL_COMMERCIAL', label: isAr ? 'محل تجاري' : 'Local commercial' },
                { value: 'GARAGE', label: isAr ? 'مرآب' : 'Garage' },
                { value: 'FERME', label: isAr ? 'مزرعة' : 'Ferme' }
              ]}
              required
              helpText="Type de bien immobilier"
              language={language}
            />
            
            <ProfessionalInput
              label={isAr ? 'عنوان العقار' : 'Adresse du bien'}
              value={formData.adresseBien}
              onChange={(v) => updateField('adresseBien', v)}
              required
              placeholder="Ex: 25 Rue Larbi Ben M'hidi, Alger"
              helpText="Adresse complète et précise du bien"
              validator={validateAddress}
              language={language}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfessionalInput
                label={isAr ? 'المساحة (م²)' : 'Superficie (m²)'}
                value={formData.superficie}
                onChange={(v) => updateField('superficie', v)}
                type="number"
                required
                placeholder="85"
                helpText="Superficie en mètres carrés"
                example="85, 120, 250"
                language={language}
              />
              <ProfessionalInput
                label={isAr ? 'رقم السند العقاري' : 'Numéro titre foncier'}
                value={formData.numeroTitreFoncier}
                onChange={(v) => updateField('numeroTitreFoncier', v)}
                required
                placeholder="Ex: 12345/16"
                helpText="Numéro du titre de propriété"
                example="12345/16, 67890/31"
                legalRef="Conservation Foncière"
                language={language}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfessionalInput
                label={isAr ? 'القسم المساحي' : 'Section cadastrale'}
                value={formData.sectionCadastrale}
                onChange={(v) => updateField('sectionCadastrale', v)}
                placeholder="Ex: A-123"
                helpText="Référence cadastrale"
                language={language}
              />
              <ProfessionalInput
                label={isAr ? 'المحافظة العقارية' : 'Conservation foncière'}
                value={formData.conservationFonciere}
                onChange={(v) => updateField('conservationFonciere', v)}
                placeholder="Ex: Conservation Foncière d'Alger Centre"
                language={language}
              />
            </div>

            <ProfessionalInput
              label={isAr ? 'وصف العقار' : 'Description du bien'}
              value={formData.descriptionBien}
              onChange={(v) => updateField('descriptionBien', v)}
              type="textarea"
              placeholder={isAr ? 'وصف تفصيلي للعقار...' : 'Description détaillée du bien...'}
              helpText="Caractéristiques, état, équipements, etc."
              language={language}
              maxLength={500}
            />
          </div>
        )}

        {currentStep === 'prix' && (
          <div className="space-y-6">
            <ProfessionalInput
              label={isAr ? 'ثمن البيع (دج)' : 'Prix de vente (DA)'}
              value={formData.prixVente}
              onChange={(v) => updateField('prixVente', v)}
              type="number"
              required
              placeholder="5000000"
              helpText="Montant total en Dinars Algériens"
              example="5000000, 10000000, 25000000"
              legalRef="Art. 351 Code Civil - Prix déterminé"
              validator={validateAmount}
              language={language}
            />
            
            {formData.prixVente && parseFloat(formData.prixVente) > 0 && (
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Check size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                      {isAr ? 'المبلغ بالحروف:' : 'Montant en lettres:'}
                    </p>
                    <p className="text-lg font-bold text-green-800 dark:text-green-200">
                      {amountToWords(parseFloat(formData.prixVente))} dinars algériens
                    </p>
                  </div>
                </div>
              </div>
            )}

            <ProfessionalInput
              label={isAr ? 'طريقة الدفع' : 'Modalité de paiement'}
              value={formData.modalitePaiement}
              onChange={(v) => updateField('modalitePaiement', v)}
              type="select"
              options={[
                { value: 'COMPTANT', label: isAr ? 'نقداً' : 'Comptant' },
                { value: 'ECHELONNE', label: isAr ? 'على أقساط' : 'Échelonné' },
                { value: 'CHEQUE', label: isAr ? 'شيك' : 'Chèque' },
                { value: 'VIREMENT', label: isAr ? 'تحويل بنكي' : 'Virement bancaire' }
              ]}
              required
              helpText="Mode de règlement du prix"
              language={language}
            />

            <ProfessionalInput
              label={isAr ? 'تاريخ التوقيع' : 'Date de signature'}
              value={formData.dateSignature}
              onChange={(v) => updateField('dateSignature', v)}
              type="date"
              required
              helpText="Date de conclusion de la vente"
              language={language}
            />
          </div>
        )}

        {currentStep === 'garanties' && (
          <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
                <Shield size={20} />
                {isAr ? 'الضمانات القانونية' : 'Garanties légales'}
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.garantieEviction}
                    onChange={(e) => updateField('garantieEviction', e.target.checked)}
                    className="mt-1 w-5 h-5 text-legal-gold rounded focus:ring-legal-gold"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {isAr ? 'ضمان الاستحقاق' : 'Garantie d\'éviction'}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {isAr 
                        ? 'يضمن البائع للمشتري عدم التعرض له في ملكيته'
                        : 'Le vendeur garantit l\'acquéreur contre tout trouble de jouissance'}
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                      ⚖️ Art. 371-379 Code Civil
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.garantieVicesCaches}
                    onChange={(e) => updateField('garantieVicesCaches', e.target.checked)}
                    className="mt-1 w-5 h-5 text-legal-gold rounded focus:ring-legal-gold"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {isAr ? 'ضمان العيوب الخفية' : 'Garantie des vices cachés'}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {isAr 
                        ? 'يضمن البائع العيوب الخفية التي تنقص من قيمة العقار'
                        : 'Le vendeur garantit les défauts cachés qui diminuent la valeur du bien'}
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                      ⚖️ Art. 379-383 Code Civil
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <ProfessionalInput
              label={isAr ? 'الارتفاقات' : 'Servitudes'}
              value={formData.servitudes}
              onChange={(v) => updateField('servitudes', v)}
              type="textarea"
              placeholder={isAr ? 'حق المرور، حق الارتفاق...' : 'Droit de passage, servitudes...'}
              helpText="Servitudes grevant le bien (si applicable)"
              language={language}
            />

            <ProfessionalInput
              label={isAr ? 'الأعباء والتكاليف' : 'Charges et frais'}
              value={formData.charges}
              onChange={(v) => updateField('charges', v)}
              type="textarea"
              placeholder={isAr ? 'الضرائب، رسوم التسجيل...' : 'Taxes, frais d\'enregistrement...'}
              helpText="Répartition des frais entre vendeur et acheteur"
              language={language}
            />
          </div>
        )}
      </div>

      {/* Boutons de navigation */}
      <div className="flex gap-4">
        {currentStepIndex > 0 && (
          <button
            onClick={goPrevious}
            className="flex-1 py-4 px-6 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
          >
            <ChevronLeft size={20} />
            {isAr ? 'السابق' : 'Précédent'}
          </button>
        )}
        
        <button
          onClick={goNext}
          disabled={!canGoNext()}
          className="flex-1 py-4 px-6 bg-legal-gold text-white rounded-xl font-semibold hover:bg-legal-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {currentStepIndex === steps.length - 1 ? (
            <>
              <Check size={20} />
              {isAr ? 'إنهاء' : 'Terminer'}
            </>
          ) : (
            <>
              {isAr ? 'التالي' : 'Suivant'}
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ActeVenteForm;
