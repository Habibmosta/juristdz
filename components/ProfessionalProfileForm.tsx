import React, { useState, useEffect } from 'react';
import { EnhancedUserProfile, UserRole, ProfessionalInfo, Language } from '../types';
import { 
  User, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Save, 
  AlertCircle,
  CheckCircle,
  Scale,
  FileSignature,
  Gavel
} from 'lucide-react';

interface ProfessionalProfileFormProps {
  user: EnhancedUserProfile;
  language: Language;
  onSave: (professionalInfo: ProfessionalInfo) => Promise<void>;
  onClose?: () => void;
}

const ProfessionalProfileForm: React.FC<ProfessionalProfileFormProps> = ({
  user,
  language,
  onSave,
  onClose
}) => {
  const isAr = language === 'ar';
  const [formData, setFormData] = useState<ProfessionalInfo>(user.professionalInfo || {});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (field: keyof ProfessionalInfo, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validation selon le rôle
    if (user.profession === UserRole.AVOCAT) {
      if (!formData.barreauInscription) {
        newErrors.barreauInscription = isAr ? 'حقل إلزامي' : 'Champ obligatoire';
      }
      if (!formData.numeroInscription) {
        newErrors.numeroInscription = isAr ? 'حقل إلزامي' : 'Champ obligatoire';
      }
      if (!formData.cabinetAddress) {
        newErrors.cabinetAddress = isAr ? 'حقل إلزامي' : 'Champ obligatoire';
      }
      if (!formData.cabinetPhone) {
        newErrors.cabinetPhone = isAr ? 'حقل إلزامي' : 'Champ obligatoire';
      }
    } else if (user.profession === UserRole.NOTAIRE) {
      if (!formData.chambreNotariale) {
        newErrors.chambreNotariale = isAr ? 'حقل إلزامي' : 'Champ obligatoire';
      }
      if (!formData.numeroMatricule) {
        newErrors.numeroMatricule = isAr ? 'حقل إلزامي' : 'Champ obligatoire';
      }
      if (!formData.etudeAddress) {
        newErrors.etudeAddress = isAr ? 'حقل إلزامي' : 'Champ obligatoire';
      }
    } else if (user.profession === UserRole.HUISSIER) {
      if (!formData.chambreHuissiers) {
        newErrors.chambreHuissiers = isAr ? 'حقل إلزامي' : 'Champ obligatoire';
      }
      if (!formData.numeroAgrement) {
        newErrors.numeroAgrement = isAr ? 'حقل إلزامي' : 'Champ obligatoire';
      }
      if (!formData.bureauAddress) {
        newErrors.bureauAddress = isAr ? 'حقل إلزامي' : 'Champ obligatoire';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error('Error saving professional info:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderAvocatFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <Scale size={16} className="inline mr-2" />
            {isAr ? 'نقابة المحامين' : 'Barreau d\'inscription'} *
          </label>
          <input
            type="text"
            value={formData.barreauInscription || ''}
            onChange={(e) => handleChange('barreauInscription', e.target.value)}
            placeholder={isAr ? 'مثال: نقابة المحامين بالجزائر' : 'Ex: Barreau d\'Alger'}
            className={`w-full p-3 border rounded-lg ${
              errors.barreauInscription ? 'border-red-500' : 'border-slate-300'
            } dark:bg-slate-800 dark:border-slate-700`}
          />
          {errors.barreauInscription && (
            <p className="text-red-500 text-xs mt-1">{errors.barreauInscription}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <FileText size={16} className="inline mr-2" />
            {isAr ? 'رقم التسجيل' : 'Numéro d\'inscription'} *
          </label>
          <input
            type="text"
            value={formData.numeroInscription || ''}
            onChange={(e) => handleChange('numeroInscription', e.target.value)}
            placeholder={isAr ? 'مثال: A/12345/2020' : 'Ex: A/12345/2020'}
            className={`w-full p-3 border rounded-lg ${
              errors.numeroInscription ? 'border-red-500' : 'border-slate-300'
            } dark:bg-slate-800 dark:border-slate-700`}
          />
          {errors.numeroInscription && (
            <p className="text-red-500 text-xs mt-1">{errors.numeroInscription}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          <Building size={16} className="inline mr-2" />
          {isAr ? 'اسم المكتب' : 'Nom du cabinet'}
        </label>
        <input
          type="text"
          value={formData.cabinetName || ''}
          onChange={(e) => handleChange('cabinetName', e.target.value)}
          placeholder={isAr ? 'مثال: مكتب الأستاذ بلقاسمي' : 'Ex: Cabinet Maître Belkacemi'}
          className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          <MapPin size={16} className="inline mr-2" />
          {isAr ? 'عنوان المكتب' : 'Adresse du cabinet'} *
        </label>
        <input
          type="text"
          value={formData.cabinetAddress || ''}
          onChange={(e) => handleChange('cabinetAddress', e.target.value)}
          placeholder={isAr ? 'مثال: 15 شارع ديدوش مراد، الجزائر' : 'Ex: 15 Rue Didouche Mourad, Alger'}
          className={`w-full p-3 border rounded-lg ${
            errors.cabinetAddress ? 'border-red-500' : 'border-slate-300'
          } dark:bg-slate-800 dark:border-slate-700`}
        />
        {errors.cabinetAddress && (
          <p className="text-red-500 text-xs mt-1">{errors.cabinetAddress}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <Phone size={16} className="inline mr-2" />
            {isAr ? 'الهاتف' : 'Téléphone'} *
          </label>
          <input
            type="tel"
            value={formData.cabinetPhone || ''}
            onChange={(e) => handleChange('cabinetPhone', e.target.value)}
            placeholder="+213 21 XX XX XX"
            className={`w-full p-3 border rounded-lg ${
              errors.cabinetPhone ? 'border-red-500' : 'border-slate-300'
            } dark:bg-slate-800 dark:border-slate-700`}
          />
          {errors.cabinetPhone && (
            <p className="text-red-500 text-xs mt-1">{errors.cabinetPhone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <Mail size={16} className="inline mr-2" />
            {isAr ? 'البريد الإلكتروني' : 'Email'}
          </label>
          <input
            type="email"
            value={formData.cabinetEmail || ''}
            onChange={(e) => handleChange('cabinetEmail', e.target.value)}
            placeholder="contact@cabinet.dz"
            className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
      </div>
    </>
  );

  const renderNotaireFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <FileSignature size={16} className="inline mr-2" />
            {isAr ? 'الغرفة الوطنية للموثقين' : 'Chambre des Notaires'} *
          </label>
          <input
            type="text"
            value={formData.chambreNotariale || ''}
            onChange={(e) => handleChange('chambreNotariale', e.target.value)}
            placeholder={isAr ? 'مثال: الغرفة الوطنية للموثقين بالجزائر' : 'Ex: Chambre des Notaires d\'Alger'}
            className={`w-full p-3 border rounded-lg ${
              errors.chambreNotariale ? 'border-red-500' : 'border-slate-300'
            } dark:bg-slate-800 dark:border-slate-700`}
          />
          {errors.chambreNotariale && (
            <p className="text-red-500 text-xs mt-1">{errors.chambreNotariale}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <FileText size={16} className="inline mr-2" />
            {isAr ? 'رقم القيد' : 'Numéro de matricule'} *
          </label>
          <input
            type="text"
            value={formData.numeroMatricule || ''}
            onChange={(e) => handleChange('numeroMatricule', e.target.value)}
            placeholder={isAr ? 'مثال: N/456/2018' : 'Ex: N/456/2018'}
            className={`w-full p-3 border rounded-lg ${
              errors.numeroMatricule ? 'border-red-500' : 'border-slate-300'
            } dark:bg-slate-800 dark:border-slate-700`}
          />
          {errors.numeroMatricule && (
            <p className="text-red-500 text-xs mt-1">{errors.numeroMatricule}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          <Building size={16} className="inline mr-2" />
          {isAr ? 'اسم المكتب' : 'Nom de l\'étude'}
        </label>
        <input
          type="text"
          value={formData.etudeNotariale || ''}
          onChange={(e) => handleChange('etudeNotariale', e.target.value)}
          placeholder={isAr ? 'مثال: مكتب التوثيق بن علي' : 'Ex: Étude Notariale Benali'}
          className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          <MapPin size={16} className="inline mr-2" />
          {isAr ? 'عنوان المكتب' : 'Adresse de l\'étude'} *
        </label>
        <input
          type="text"
          value={formData.etudeAddress || ''}
          onChange={(e) => handleChange('etudeAddress', e.target.value)}
          placeholder={isAr ? 'مثال: 8 شارع زيغود يوسف، الجزائر' : 'Ex: 8 Boulevard Zighout Youcef, Alger'}
          className={`w-full p-3 border rounded-lg ${
            errors.etudeAddress ? 'border-red-500' : 'border-slate-300'
          } dark:bg-slate-800 dark:border-slate-700`}
        />
        {errors.etudeAddress && (
          <p className="text-red-500 text-xs mt-1">{errors.etudeAddress}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <Phone size={16} className="inline mr-2" />
            {isAr ? 'الهاتف' : 'Téléphone'}
          </label>
          <input
            type="tel"
            value={formData.etudePhone || ''}
            onChange={(e) => handleChange('etudePhone', e.target.value)}
            placeholder="+213 21 YY YY YY"
            className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <Mail size={16} className="inline mr-2" />
            {isAr ? 'البريد الإلكتروني' : 'Email'}
          </label>
          <input
            type="email"
            value={formData.etudeEmail || ''}
            onChange={(e) => handleChange('etudeEmail', e.target.value)}
            placeholder="contact@notaire.dz"
            className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
      </div>
    </>
  );

  const renderHuissierFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <Gavel size={16} className="inline mr-2" />
            {isAr ? 'الغرفة الوطنية للمحضرين' : 'Chambre des Huissiers'} *
          </label>
          <input
            type="text"
            value={formData.chambreHuissiers || ''}
            onChange={(e) => handleChange('chambreHuissiers', e.target.value)}
            placeholder={isAr ? 'مثال: الغرفة الوطنية للمحضرين بوهران' : 'Ex: Chambre des Huissiers d\'Oran'}
            className={`w-full p-3 border rounded-lg ${
              errors.chambreHuissiers ? 'border-red-500' : 'border-slate-300'
            } dark:bg-slate-800 dark:border-slate-700`}
          />
          {errors.chambreHuissiers && (
            <p className="text-red-500 text-xs mt-1">{errors.chambreHuissiers}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <FileText size={16} className="inline mr-2" />
            {isAr ? 'رقم الاعتماد' : 'Numéro d\'agrément'} *
          </label>
          <input
            type="text"
            value={formData.numeroAgrement || ''}
            onChange={(e) => handleChange('numeroAgrement', e.target.value)}
            placeholder={isAr ? 'مثال: H/789/2019' : 'Ex: H/789/2019'}
            className={`w-full p-3 border rounded-lg ${
              errors.numeroAgrement ? 'border-red-500' : 'border-slate-300'
            } dark:bg-slate-800 dark:border-slate-700`}
          />
          {errors.numeroAgrement && (
            <p className="text-red-500 text-xs mt-1">{errors.numeroAgrement}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          <Building size={16} className="inline mr-2" />
          {isAr ? 'اسم المكتب' : 'Nom du bureau'}
        </label>
        <input
          type="text"
          value={formData.bureauHuissier || ''}
          onChange={(e) => handleChange('bureauHuissier', e.target.value)}
          placeholder={isAr ? 'مثال: مكتب المحضر خليفي' : 'Ex: Bureau d\'Huissier Khelifi'}
          className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          <MapPin size={16} className="inline mr-2" />
          {isAr ? 'عنوان المكتب' : 'Adresse du bureau'} *
        </label>
        <input
          type="text"
          value={formData.bureauAddress || ''}
          onChange={(e) => handleChange('bureauAddress', e.target.value)}
          placeholder={isAr ? 'مثال: 42 شارع العربي بن مهيدي، وهران' : 'Ex: 42 Rue Larbi Ben M\'hidi, Oran'}
          className={`w-full p-3 border rounded-lg ${
            errors.bureauAddress ? 'border-red-500' : 'border-slate-300'
          } dark:bg-slate-800 dark:border-slate-700`}
        />
        {errors.bureauAddress && (
          <p className="text-red-500 text-xs mt-1">{errors.bureauAddress}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <Phone size={16} className="inline mr-2" />
            {isAr ? 'الهاتف' : 'Téléphone'}
          </label>
          <input
            type="tel"
            value={formData.bureauPhone || ''}
            onChange={(e) => handleChange('bureauPhone', e.target.value)}
            placeholder="+213 41 ZZ ZZ ZZ"
            className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            <Mail size={16} className="inline mr-2" />
            {isAr ? 'البريد الإلكتروني' : 'Email'}
          </label>
          <input
            type="email"
            value={formData.bureauEmail || ''}
            onChange={(e) => handleChange('bureauEmail', e.target.value)}
            placeholder="contact@huissier.dz"
            className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User size={24} className="text-legal-blue" />
            {isAr ? 'المعلومات المهنية' : 'Informations Professionnelles'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isAr 
              ? 'هذه المعلومات ستظهر في الوثائق القانونية التي تقوم بإنشائها'
              : 'Ces informations apparaîtront dans les documents juridiques que vous générez'}
          </p>
        </div>
        {saveSuccess && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
            <CheckCircle size={20} />
            <span className="font-medium">{isAr ? 'تم الحفظ بنجاح' : 'Enregistré avec succès'}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Champs spécifiques selon le rôle */}
        {user.profession === UserRole.AVOCAT && renderAvocatFields()}
        {user.profession === UserRole.NOTAIRE && renderNotaireFields()}
        {user.profession === UserRole.HUISSIER && renderHuissierFields()}

        {/* Champs communs */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
            {isAr ? 'معلومات إضافية' : 'Informations Complémentaires'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                <MapPin size={16} className="inline mr-2" />
                {isAr ? 'ولاية الممارسة' : 'Wilaya d\'exercice'}
              </label>
              <input
                type="text"
                value={formData.wilayaExercice || ''}
                onChange={(e) => handleChange('wilayaExercice', e.target.value)}
                placeholder={isAr ? 'مثال: الجزائر' : 'Ex: Alger'}
                className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                <FileText size={16} className="inline mr-2" />
                {isAr ? 'سنوات الخبرة' : 'Années d\'expérience'}
              </label>
              <input
                type="number"
                value={formData.anneesExperience || ''}
                onChange={(e) => handleChange('anneesExperience', parseInt(e.target.value))}
                placeholder="5"
                min="0"
                className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Message d'avertissement si champs manquants */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 dark:text-red-200">
                {isAr ? 'يرجى ملء جميع الحقول الإلزامية' : 'Veuillez remplir tous les champs obligatoires'}
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {isAr 
                  ? 'هذه المعلومات ضرورية لإنشاء وثائق قانونية صحيحة'
                  : 'Ces informations sont nécessaires pour générer des documents juridiques valides'}
              </p>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-legal-blue text-white rounded-lg font-bold flex items-center gap-2 hover:bg-legal-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isAr ? 'جاري الحفظ...' : 'Enregistrement...'}
              </>
            ) : (
              <>
                <Save size={20} />
                {isAr ? 'حفظ المعلومات' : 'Enregistrer'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfessionalProfileForm;
