import React, { useState } from 'react';
import { Upload, FileText, Save, X, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { Language, UserRole } from '../types';
import { UI_TRANSLATIONS } from '../constants';

interface TemplateContributionProps {
  language: Language;
  userRole: UserRole;
  userId: string;
  onClose: () => void;
}

interface TemplateField {
  name: string;
  label_fr: string;
  label_ar: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select';
  required: boolean;
  options?: string[];
}

const TemplateContribution: React.FC<TemplateContributionProps> = ({ 
  language, 
  userRole, 
  userId,
  onClose 
}) => {
  const [step, setStep] = useState<'info' | 'structure' | 'preview' | 'success'>('info');
  const [templateData, setTemplateData] = useState({
    name_fr: '',
    name_ar: '',
    description_fr: '',
    description_ar: '',
    category: '',
    wilaya: '',
    tribunal: '',
    source: 'cabinet', // cabinet, tribunal, notaire, huissier
    isPublic: false,
    fields: [] as TemplateField[]
  });
  const [fileContent, setFileContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  const categories = {
    avocat: [
      { id: 'famille', fr: 'Droit de la Famille', ar: 'قانون الأسرة' },
      { id: 'civil', fr: 'Droit Civil', ar: 'القانون المدني' },
      { id: 'penal', fr: 'Droit Pénal', ar: 'القانون الجزائي' },
      { id: 'commercial', fr: 'Droit Commercial', ar: 'القانون التجاري' },
      { id: 'administratif', fr: 'Droit Administratif', ar: 'القانون الإداري' },
      { id: 'travail', fr: 'Droit du Travail', ar: 'قانون العمل' }
    ],
    notaire: [
      { id: 'vente', fr: 'Actes de Vente', ar: 'عقود البيع' },
      { id: 'succession', fr: 'Successions', ar: 'المواريث' },
      { id: 'societe', fr: 'Sociétés', ar: 'الشركات' },
      { id: 'donation', fr: 'Donations', ar: 'الهبات' },
      { id: 'bail', fr: 'Baux', ar: 'عقود الإيجار' }
    ],
    huissier: [
      { id: 'signification', fr: 'Significations', ar: 'التبليغات' },
      { id: 'constat', fr: 'Constats', ar: 'المعاينات' },
      { id: 'execution', fr: 'Exécutions', ar: 'التنفيذ' },
      { id: 'saisie', fr: 'Saisies', ar: 'الحجوزات' }
    ]
  };

  const wilayas = [
    'Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif', 'Tlemcen',
    'Béjaïa', 'Tizi Ouzou', 'Biskra', 'Ouargla', 'Mostaganem', 'Chlef', 'Skikda'
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      
      // Analyse automatique du contenu pour extraire la structure
      analyzeTemplate(content);
    };
    reader.readAsText(file);
  };

  const analyzeTemplate = (content: string) => {
    // Détection automatique des champs dans le template
    const fieldPatterns = [
      /\[NOM[_\s]+(DEMANDEUR|DEFENDEUR|CLIENT|PARTIE)\]/gi,
      /\[PRENOM[_\s]+(DEMANDEUR|DEFENDEUR|CLIENT|PARTIE)\]/gi,
      /\[ADRESSE\]/gi,
      /\[DATE[_\s]+(NAISSANCE|MARIAGE|SIGNATURE)\]/gi,
      /\[MONTANT\]/gi,
      /\[TRIBUNAL\]/gi,
      /\[NUMERO[_\s]+(DOSSIER|RC|NIF)\]/gi
    ];

    const detectedFields: TemplateField[] = [];
    
    fieldPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const fieldName = match.replace(/[\[\]]/g, '').toLowerCase().replace(/\s+/g, '_');
          if (!detectedFields.find(f => f.name === fieldName)) {
            detectedFields.push({
              name: fieldName,
              label_fr: match.replace(/[\[\]]/g, ''),
              label_ar: translateFieldToArabic(match),
              type: determineFieldType(match),
              required: true
            });
          }
        });
      }
    });

    setTemplateData(prev => ({ ...prev, fields: detectedFields }));
  };

  const translateFieldToArabic = (field: string): string => {
    const translations: { [key: string]: string } = {
      'NOM': 'الاسم',
      'PRENOM': 'اللقب',
      'ADRESSE': 'العنوان',
      'DATE': 'التاريخ',
      'MONTANT': 'المبلغ',
      'TRIBUNAL': 'المحكمة',
      'NUMERO': 'الرقم',
      'DEMANDEUR': 'المدعي',
      'DEFENDEUR': 'المدعى عليه',
      'CLIENT': 'الموكل',
      'PARTIE': 'الطرف'
    };

    let translated = field;
    Object.entries(translations).forEach(([fr, ar]) => {
      translated = translated.replace(new RegExp(fr, 'gi'), ar);
    });
    return translated;
  };

  const determineFieldType = (field: string): 'text' | 'textarea' | 'number' | 'date' => {
    if (field.includes('DATE')) return 'date';
    if (field.includes('MONTANT') || field.includes('NUMERO')) return 'number';
    if (field.includes('ADRESSE') || field.includes('DESCRIPTION')) return 'textarea';
    return 'text';
  };

  const addCustomField = () => {
    setTemplateData(prev => ({
      ...prev,
      fields: [...prev.fields, {
        name: '',
        label_fr: '',
        label_ar: '',
        type: 'text',
        required: false
      }]
    }));
  };

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    setTemplateData(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === index ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (index: number) => {
    setTemplateData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!templateData.name_fr || !templateData.name_ar) {
      setError(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs requis');
      return;
    }

    if (!fileContent) {
      setError(language === 'ar' ? 'يرجى تحميل ملف النموذج' : 'Veuillez télécharger le fichier template');
      return;
    }

    try {
      // Sauvegarder dans Supabase
      const contribution = {
        user_id: userId,
        user_role: userRole,
        template_data: templateData,
        template_content: fileContent,
        status: 'pending_review',
        created_at: new Date().toISOString()
      };

      // TODO: Implémenter l'appel API Supabase
      console.log('Template contribution:', contribution);

      setStep('success');
    } catch (err) {
      setError(language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Erreur lors de la sauvegarde');
      console.error(err);
    }
  };

  const currentCategories = categories[userRole as keyof typeof categories] || categories.avocat;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-legal-blue to-blue-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold" dir="auto">
              {language === 'ar' ? 'مساهمة بنموذج حقيقي' : 'Contribuer un Template Réel'}
            </h2>
            <p className="text-sm opacity-90 mt-1" dir="auto">
              {language === 'ar' 
                ? 'شارك النماذج المستخدمة في مكتبك لإثراء المنصة' 
                : 'Partagez les modèles utilisés dans votre cabinet pour enrichir la plateforme'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 border-b">
          {['info', 'structure', 'preview', 'success'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step === s ? 'bg-legal-blue text-white' : 
                ['info', 'structure', 'preview'].indexOf(step) > i ? 'bg-green-500 text-white' : 
                'bg-slate-300 text-slate-600'
              }`}>
                {i + 1}
              </div>
              {i < 3 && <div className="w-12 h-1 bg-slate-300" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {step === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    {language === 'ar' ? 'اسم النموذج (فرنسي)' : 'Nom du Template (Français)'}
                  </label>
                  <input
                    type="text"
                    value={templateData.name_fr}
                    onChange={(e) => setTemplateData(prev => ({ ...prev, name_fr: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Ex: Requête de Divorce"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">
                    {language === 'ar' ? 'اسم النموذج (عربي)' : 'Nom du Template (Arabe)'}
                  </label>
                  <input
                    type="text"
                    value={templateData.name_ar}
                    onChange={(e) => setTemplateData(prev => ({ ...prev, name_ar: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    placeholder="مثال: عريضة طلاق"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    {language === 'ar' ? 'الفئة' : 'Catégorie'}
                  </label>
                  <select
                    value={templateData.category}
                    onChange={(e) => setTemplateData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">{language === 'ar' ? 'اختر الفئة' : 'Choisir une catégorie'}</option>
                    {currentCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {language === 'ar' ? cat.ar : cat.fr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">
                    {language === 'ar' ? 'الولاية' : 'Wilaya'}
                  </label>
                  <select
                    value={templateData.wilaya}
                    onChange={(e) => setTemplateData(prev => ({ ...prev, wilaya: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">{language === 'ar' ? 'اختر الولاية' : 'Choisir une wilaya'}</option>
                    {wilayas.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">
                  {language === 'ar' ? 'المحكمة / الجهة' : 'Tribunal / Juridiction'}
                </label>
                <input
                  type="text"
                  value={templateData.tribunal}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, tribunal: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  placeholder={language === 'ar' ? 'مثال: محكمة الجزائر' : 'Ex: Tribunal d\'Alger'}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">
                  {language === 'ar' ? 'تحميل ملف النموذج' : 'Télécharger le fichier template'}
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-legal-blue transition">
                  <input
                    type="file"
                    accept=".txt,.doc,.docx,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload size={48} className="mx-auto mb-4 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      {language === 'ar' 
                        ? 'انقر لتحميل ملف (.txt, .doc, .docx, .pdf)' 
                        : 'Cliquez pour télécharger (.txt, .doc, .docx, .pdf)'}
                    </p>
                    {fileContent && (
                      <p className="text-green-600 mt-2 flex items-center justify-center gap-2">
                        <CheckCircle size={16} />
                        {language === 'ar' ? 'تم التحميل بنجاح' : 'Fichier chargé avec succès'}
                      </p>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="public"
                  checked={templateData.isPublic}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="public" className="text-sm">
                  {language === 'ar' 
                    ? 'جعل هذا النموذج متاحاً لجميع المستخدمين' 
                    : 'Rendre ce template accessible à tous les utilisateurs'}
                </label>
              </div>
            </div>
          )}

          {step === 'structure' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800" dir="auto">
                  {language === 'ar'
                    ? 'تم اكتشاف الحقول التالية تلقائياً. يمكنك تعديلها أو إضافة حقول جديدة.'
                    : 'Les champs suivants ont été détectés automatiquement. Vous pouvez les modifier ou ajouter de nouveaux champs.'}
                </p>
              </div>

              <div className="space-y-4">
                {templateData.fields.map((field, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        value={field.label_fr}
                        onChange={(e) => updateField(index, { label_fr: e.target.value })}
                        placeholder="Label (Français)"
                        className="p-2 border rounded"
                      />
                      <input
                        type="text"
                        value={field.label_ar}
                        onChange={(e) => updateField(index, { label_ar: e.target.value })}
                        placeholder="Label (العربية)"
                        className="p-2 border rounded"
                        dir="rtl"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value as any })}
                        className="p-2 border rounded"
                      >
                        <option value="text">Texte</option>
                        <option value="textarea">Texte long</option>
                        <option value="number">Nombre</option>
                        <option value="date">Date</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                        />
                        {language === 'ar' ? 'إجباري' : 'Obligatoire'}
                      </label>
                      <button
                        onClick={() => removeField(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addCustomField}
                className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-legal-blue transition flex items-center justify-center gap-2 text-slate-600"
              >
                <Plus size={20} />
                {language === 'ar' ? 'إضافة حقل جديد' : 'Ajouter un champ'}
              </button>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4">
                  {language === 'ar' ? 'معاينة النموذج' : 'Aperçu du Template'}
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>{language === 'ar' ? 'الاسم:' : 'Nom:'}</strong> {templateData.name_fr} / {templateData.name_ar}</p>
                  <p><strong>{language === 'ar' ? 'الفئة:' : 'Catégorie:'}</strong> {templateData.category}</p>
                  <p><strong>{language === 'ar' ? 'الولاية:' : 'Wilaya:'}</strong> {templateData.wilaya}</p>
                  <p><strong>{language === 'ar' ? 'المحكمة:' : 'Tribunal:'}</strong> {templateData.tribunal}</p>
                  <p><strong>{language === 'ar' ? 'عدد الحقول:' : 'Nombre de champs:'}</strong> {templateData.fields.length}</p>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
                <h4 className="font-bold mb-2">{language === 'ar' ? 'محتوى النموذج:' : 'Contenu du template:'}</h4>
                <pre className="text-xs whitespace-pre-wrap">{fileContent}</pre>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12">
              <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-2xl font-bold mb-2">
                {language === 'ar' ? 'شكراً لمساهمتك!' : 'Merci pour votre contribution !'}
              </h3>
              <p className="text-slate-600 mb-6" dir="auto">
                {language === 'ar'
                  ? 'سيتم مراجعة النموذج من قبل فريقنا وإضافته إلى المنصة قريباً.'
                  : 'Votre template sera examiné par notre équipe et ajouté à la plateforme prochainement.'}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-legal-blue text-white rounded-lg hover:opacity-90"
              >
                {language === 'ar' ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step !== 'success' && (
          <div className="border-t p-4 flex justify-between bg-slate-50 dark:bg-slate-800">
            <button
              onClick={() => {
                if (step === 'info') onClose();
                else if (step === 'structure') setStep('info');
                else if (step === 'preview') setStep('structure');
              }}
              className="px-6 py-2 border rounded-lg hover:bg-slate-100"
            >
              {language === 'ar' ? 'رجوع' : 'Retour'}
            </button>
            <button
              onClick={() => {
                if (step === 'info') setStep('structure');
                else if (step === 'structure') setStep('preview');
                else if (step === 'preview') handleSubmit();
              }}
              className="px-6 py-2 bg-legal-blue text-white rounded-lg hover:opacity-90 flex items-center gap-2"
            >
              {step === 'preview' ? <Save size={20} /> : null}
              {step === 'info' && (language === 'ar' ? 'التالي' : 'Suivant')}
              {step === 'structure' && (language === 'ar' ? 'معاينة' : 'Aperçu')}
              {step === 'preview' && (language === 'ar' ? 'حفظ' : 'Enregistrer')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateContribution;
