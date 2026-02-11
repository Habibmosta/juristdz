import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini } from '../services/geminiService';
import { autoTranslationService } from '../services/autoTranslationService';
import { wilayaTemplateService } from '../services/wilayaTemplateService';
import { clauseService } from '../services/clauseService';
import { 
  TEMPLATES, 
  NOTAIRE_TEMPLATES, 
  HUISSIER_TEMPLATES, 
  MAGISTRAT_TEMPLATES, 
  JURISTE_TEMPLATES, 
  ETUDIANT_TEMPLATES, 
  UI_TRANSLATIONS 
} from '../constants';
import { AppMode, Language, UserRole } from '../types';
import { 
  FileText, Download, CheckCircle, ChevronRight, PenTool, Eye, 
  Printer, Share2, Check, Edit3, Save, Scale, Settings, Languages,
  MapPin, BookOpen, Plus, Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import StructuredLegalForm from './StructuredLegalForm';
import ActeVenteForm from './forms/ActeVenteForm';
import WilayaSelector from './WilayaSelector';
import ClauseSelector from './ClauseSelector';
import TemplateContribution from './TemplateContribution';

interface EnhancedDraftingInterfaceProps {
  language: Language;
  userRole?: UserRole;
  userId: string;
}

type ConfigStep = 'template' | 'wilaya' | 'clauses' | 'details';

const EnhancedDraftingInterface: React.FC<EnhancedDraftingInterfaceProps> = ({ 
  language, 
  userRole = UserRole.AVOCAT,
  userId 
}) => {
  const t = UI_TRANSLATIONS[language];
  
  // Configuration steps
  const [currentStep, setCurrentStep] = useState<ConfigStep>('template');
  const [showContribution, setShowContribution] = useState(false);
  
  // Template selection
  const getTemplatesForRole = (role: UserRole) => {
    switch (role) {
      case UserRole.AVOCAT: return TEMPLATES;
      case UserRole.NOTAIRE: return NOTAIRE_TEMPLATES;
      case UserRole.HUISSIER: return HUISSIER_TEMPLATES;
      case UserRole.MAGISTRAT: return MAGISTRAT_TEMPLATES;
      case UserRole.JURISTE_ENTREPRISE: return JURISTE_TEMPLATES;
      case UserRole.ETUDIANT: return ETUDIANT_TEMPLATES;
      case UserRole.ADMIN:
        return [...TEMPLATES, ...NOTAIRE_TEMPLATES, ...HUISSIER_TEMPLATES, 
                ...MAGISTRAT_TEMPLATES, ...JURISTE_TEMPLATES, ...ETUDIANT_TEMPLATES];
      default: return TEMPLATES;
    }
  };
  
  const availableTemplates = getTemplatesForRole(userRole);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(availableTemplates[0]?.id || '');
  
  // Wilaya selection
  const [selectedWilaya, setSelectedWilaya] = useState<string>('');
  const [selectedTribunal, setSelectedTribunal] = useState<string>('');
  
  // Clauses selection
  const [selectedClauses, setSelectedClauses] = useState<string[]>([]);
  const [clauseVariables, setClauseVariables] = useState<{ [key: string]: string }>({});
  
  // Form data
  const [details, setDetails] = useState('');
  const [structuredFormData, setStructuredFormData] = useState<any>({});
  const [useStructuredForm, setUseStructuredForm] = useState(true);
  
  // Document state
  const [generatedDoc, setGeneratedDoc] = useState('');
  const [originalDoc, setOriginalDoc] = useState('');
  const [originalDocLang, setOriginalDocLang] = useState<Language>('fr');
  const [isDocTranslated, setIsDocTranslated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // UI state
  const [mobileTab, setMobileTab] = useState<'config' | 'preview'>('config');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const componentId = `enhanced-drafting-${userRole}`;
  const selectedTemplate = availableTemplates.find(t => t.id === selectedTemplateId) || availableTemplates[0];

  // Auto translation
  useEffect(() => {
    autoTranslationService.registerComponent(componentId, handleAutoTranslation);
    return () => autoTranslationService.unregisterComponent(componentId);
  }, []);

  const handleAutoTranslation = async (newLanguage: Language) => {
    if (!generatedDoc || !originalDoc) return;

    if (originalDocLang === newLanguage) {
      setGeneratedDoc(originalDoc);
      setIsDocTranslated(false);
      return;
    }

    setIsTranslating(true);
    try {
      const translatedDoc = await autoTranslationService.translateContent(
        originalDoc,
        originalDocLang,
        newLanguage
      );

      if (translatedDoc !== originalDoc && translatedDoc.trim().length > 0) {
        setGeneratedDoc(translatedDoc);
        setIsDocTranslated(true);
      } else {
        setGeneratedDoc(originalDoc);
        setIsDocTranslated(false);
      }
    } catch (error) {
      console.error('Auto translation failed:', error);
      setGeneratedDoc(originalDoc);
      setIsDocTranslated(false);
    } finally {
      setIsTranslating(false);
    }
  };

  const getName = (tpl: any) => language === 'ar' ? tpl.name_ar : tpl.name;
  const getDesc = (tpl: any) => language === 'ar' ? tpl.description_ar : tpl.description;

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    
    setMobileTab('preview');
    setIsGenerating(true);

    try {
      let basePrompt = language === 'ar' ? selectedTemplate.prompt_ar : selectedTemplate.prompt;
      let documentContent = '';

      // 1. Ajouter l'en-tête spécifique à la wilaya
      if (selectedWilaya && selectedTribunal) {
        const header = wilayaTemplateService.generateDocumentHeader(
          selectedWilaya,
          selectedTribunal,
          language
        );
        documentContent += header + '\n\n';
      }

      // 2. Ajouter les clauses sélectionnées
      if (selectedClauses.length > 0) {
        const clauseTemplate = {
          documentType: selectedTemplateId,
          selectedClauseIds: selectedClauses,
          variables: { ...clauseVariables, ...structuredFormData },
          customClauses: []
        };
        
        const clausesText = clauseService.generateDocumentWithClauses(clauseTemplate, language);
        documentContent += clausesText + '\n\n';
      }

      // 3. Construire le prompt avec les données structurées
      let prompt = basePrompt;
      
      if (useStructuredForm && Object.keys(structuredFormData).length > 0) {
        prompt += '\n\nInformations fournies :\n';
        
        // Informations de la personne
        if (structuredFormData.personnePhysique) {
          const p = structuredFormData.personnePhysique;
          if (p.nom && p.prenom) {
            prompt += `\nPersonne concernée : ${p.prenom} ${p.nom}`;
            if (p.dateNaissance) prompt += `, né(e) le ${p.dateNaissance}`;
            if (p.lieuNaissance) prompt += ` à ${p.lieuNaissance}`;
            if (p.adresse) prompt += `, demeurant à ${p.adresse}`;
          }
        }
        
        // Informations du cabinet
        if (structuredFormData.cabinet) {
          const c = structuredFormData.cabinet;
          if (c.nomCabinet && c.nomPraticien) {
            prompt += `\n\nCabinet : ${c.nomCabinet}`;
            prompt += `\nReprésenté par Maître ${c.prenomPraticien} ${c.nomPraticien}`;
          }
        }
      }
      
      // Détails supplémentaires
      if (details.trim()) {
        prompt += `\n\nDétails spécifiques :\n${details}`;
      }

      // 4. Si on a déjà du contenu (clauses), demander à l'IA de compléter
      if (documentContent.trim()) {
        prompt += `\n\nDocument de base déjà généré :\n${documentContent}`;
        prompt += '\n\nVeuillez compléter ce document en ajoutant les sections manquantes et en assurant la cohérence juridique.';
      } else {
        prompt += '\n\nVeuillez rédiger le document juridique complet en respectant la forme légale algérienne.';
      }

      // 5. Générer avec l'IA
      const response = await sendMessageToGemini(prompt, [], AppMode.DRAFTING, language);
      
      // 6. Combiner le contenu pré-généré avec la réponse de l'IA
      let finalDocument = documentContent.trim() ? documentContent + '\n\n' + response.text : response.text;

      // 7. Appliquer les variables de wilaya si nécessaire
      if (selectedWilaya) {
        finalDocument = wilayaTemplateService.populateTemplate(
          finalDocument,
          selectedWilaya,
          selectedTribunal
        );
      }

      setOriginalDoc(finalDocument);
      setOriginalDocLang(language);
      setGeneratedDoc(finalDocument);
      setIsDocTranslated(false);
      
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-doc');
    if (printContent) {
      const win = window.open('', '', 'height=700,width=800');
      if (win) {
        win.document.write('<html><head><title>Document Juridique</title>');
        win.document.write('<style>body { font-family: serif; font-size: 14px; line-height: 1.6; padding: 40px; background: white; color: black; } </style>');
        win.document.write('</head><body dir="' + (language === 'ar' ? 'rtl' : 'ltr') + '">');
        win.document.write(generatedDoc.replace(/\n/g, '<br/>'));
        win.document.write('</body></html>');
        win.document.close();
        win.print();
      }
    }
  };

  const steps: { id: ConfigStep; label_fr: string; label_ar: string; icon: any }[] = [
    { id: 'template', label_fr: 'Modèle', label_ar: 'النموذج', icon: FileText },
    { id: 'wilaya', label_fr: 'Wilaya', label_ar: 'الولاية', icon: MapPin },
    { id: 'clauses', label_fr: 'Clauses', label_ar: 'البنود', icon: BookOpen },
    { id: 'details', label_fr: 'Détails', label_ar: 'التفاصيل', icon: Edit3 }
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 'template': return !!selectedTemplateId;
      case 'wilaya': return true; // Optional
      case 'clauses': return true; // Optional
      case 'details': return useStructuredForm ? Object.keys(structuredFormData).length > 0 || details.trim() : details.trim();
      default: return false;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Configuration Sidebar */}
      <div className={`w-full md:w-96 bg-white dark:bg-slate-900 border-e dark:border-slate-800 flex flex-col h-full overflow-hidden ${mobileTab === 'config' ? 'flex' : 'hidden md:flex'}`}>
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-serif flex items-center gap-2">
              {t.draft_title}
              {isTranslating && (
                <Languages size={16} className="animate-pulse text-blue-500" />
              )}
            </h2>
            <button
              onClick={() => setShowContribution(true)}
              className="p-2 bg-legal-blue text-white rounded-lg hover:opacity-90"
              title={language === 'ar' ? 'مساهمة بنموذج' : 'Contribuer un template'}
            >
              <Plus size={16} />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex-1 p-2 rounded-lg text-xs font-bold transition ${
                      isActive ? 'bg-legal-blue text-white' :
                      isCompleted ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon size={14} className="mx-auto mb-1" />
                    <div className="truncate">
                      {language === 'ar' ? step.label_ar : step.label_fr}
                    </div>
                  </button>
                  {index < steps.length - 1 && (
                    <ChevronRight size={12} className="text-slate-300" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1: Template Selection */}
          {currentStep === 'template' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm mb-3">
                {language === 'ar' ? 'اختر نموذج الوثيقة' : 'Sélectionner un modèle'}
              </h3>
              {availableTemplates.map(tpl => (
                <button 
                  key={tpl.id} 
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition ${
                    selectedTemplateId === tpl.id 
                      ? 'border-legal-gold bg-amber-50 dark:bg-amber-900/10 text-legal-gold shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-legal-gold/50'
                  }`}
                >
                  <div className="font-bold">{getName(tpl)}</div>
                  <div className="text-xs opacity-70 mt-1">{getDesc(tpl)}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Wilaya Selection */}
          {currentStep === 'wilaya' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">
                  {language === 'ar' ? 'معلومات الولاية (اختياري)' : 'Informations Wilaya (optionnel)'}
                </h3>
                <span className="text-xs text-slate-500">
                  {language === 'ar' ? 'اختياري' : 'Optionnel'}
                </span>
              </div>
              <WilayaSelector
                language={language}
                selectedWilaya={selectedWilaya}
                onWilayaChange={setSelectedWilaya}
                showDetails={true}
              />
            </div>
          )}

          {/* Step 3: Clauses Selection */}
          {currentStep === 'clauses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">
                  {language === 'ar' ? 'البنود القانونية (اختياري)' : 'Clauses juridiques (optionnel)'}
                </h3>
                <span className="text-xs text-slate-500">
                  {language === 'ar' ? 'اختياري' : 'Optionnel'}
                </span>
              </div>
              <ClauseSelector
                language={language}
                documentType={selectedTemplateId}
                selectedClauses={selectedClauses}
                onClausesChange={setSelectedClauses}
                variables={clauseVariables}
              />
            </div>
          )}

          {/* Step 4: Details */}
          {currentStep === 'details' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">
                  {language === 'ar' ? 'تفاصيل الوثيقة' : 'Détails du document'}
                </h3>
                <button
                  onClick={() => setUseStructuredForm(!useStructuredForm)}
                  className={`p-2 rounded-lg transition ${
                    useStructuredForm ? 'bg-legal-gold text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                  title={useStructuredForm ? 'Mode texte libre' : 'Formulaire structuré'}
                >
                  <Settings size={14} />
                </button>
              </div>

              {useStructuredForm ? (
                <div className="space-y-4">
                  {/* Utiliser le formulaire professionnel pour acte de vente */}
                  {selectedTemplateId === 'acte_vente_immobiliere' ? (
                    <ActeVenteForm
                      language={language}
                      onFormChange={setStructuredFormData}
                      onComplete={() => {
                        // Passer automatiquement à la génération
                        console.log('Formulaire complété, prêt pour génération');
                      }}
                    />
                  ) : (
                    <StructuredLegalForm
                      templateId={selectedTemplateId}
                      language={language}
                      onFormChange={setStructuredFormData}
                    />
                  )}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-2">
                      {language === 'ar' ? 'تفاصيل إضافية' : 'Détails complémentaires'}
                    </label>
                    <textarea 
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm"
                      placeholder={language === 'ar' ? 'معلومات إضافية...' : 'Informations supplémentaires...'}
                    />
                  </div>
                </div>
              ) : (
                <textarea 
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full h-64 p-3 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm"
                  placeholder={language === 'ar' ? 'اكتب تفاصيل القضية...' : 'Décrivez les détails de l\'affaire...'}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t dark:border-slate-800 space-y-2">
          <div className="flex gap-2">
            {currentStep !== 'template' && (
              <button
                onClick={() => {
                  const currentIndex = steps.findIndex(s => s.id === currentStep);
                  if (currentIndex > 0) setCurrentStep(steps[currentIndex - 1].id);
                }}
                className="flex-1 py-3 border rounded-xl font-bold text-sm"
              >
                {language === 'ar' ? 'السابق' : 'Précédent'}
              </button>
            )}
            {currentStep !== 'details' ? (
              <button
                onClick={() => {
                  const currentIndex = steps.findIndex(s => s.id === currentStep);
                  if (currentIndex < steps.length - 1) setCurrentStep(steps[currentIndex + 1].id);
                }}
                disabled={!canProceed()}
                className="flex-1 py-3 bg-legal-blue text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {language === 'ar' ? 'التالي' : 'Suivant'}
              </button>
            ) : (
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !canProceed()}
                className="flex-1 py-3 bg-legal-gold text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FileText size={18} />
                )}
                {isGenerating ? (language === 'ar' ? 'جاري التوليد...' : 'Génération...') : (language === 'ar' ? 'توليد الوثيقة' : 'Générer')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview & Editor */}
      <div className={`flex-1 flex flex-col h-full bg-slate-100 dark:bg-slate-950 p-4 md:p-8 overflow-y-auto ${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
        {generatedDoc ? (
          <div className="max-w-3xl mx-auto w-full space-y-4">
            <div className="flex justify-between items-center px-4">
              <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border">
                <button 
                  onClick={() => setIsEditing(false)} 
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${!isEditing ? 'bg-legal-gold text-white' : 'text-slate-500'}`}
                >
                  <Eye size={14} className="inline mr-1" />
                  {language === 'ar' ? 'معاينة' : 'Aperçu'}
                </button>
                <button 
                  onClick={() => setIsEditing(true)} 
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${isEditing ? 'bg-legal-gold text-white' : 'text-slate-500'}`}
                >
                  <Edit3 size={14} className="inline mr-1" />
                  {language === 'ar' ? 'تحرير' : 'Éditer'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                {isDocTranslated && (
                  <div className="flex items-center gap-1 text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">
                    <Languages size={12} />
                    <span className="text-xs font-bold">
                      {language === 'ar' ? 'مترجم' : 'Traduit'}
                    </span>
                  </div>
                )}
                <button onClick={handlePrint} className="p-2 bg-white rounded-xl shadow-sm border hover:text-legal-gold">
                  <Printer size={20} />
                </button>
                <button onClick={() => navigator.clipboard.writeText(generatedDoc)} className="p-2 bg-white rounded-xl shadow-sm border hover:text-legal-gold">
                  <Download size={20} />
                </button>
              </div>
            </div>

            <div id="printable-doc" className="bg-white shadow-2xl p-10 md:p-16 rounded-xl border min-h-[842px] relative">
              <div className="border-b-2 border-legal-gold/20 pb-8 mb-12 flex justify-between items-start opacity-40">
                <div className="text-xs font-bold uppercase tracking-widest font-serif">
                  {selectedWilaya ? `Wilaya de ${selectedWilaya}` : 'Cabinet Juridique'}
                </div>
                <Scale size={32} className="text-legal-gold" />
              </div>

              {isEditing ? (
                <textarea 
                  value={generatedDoc}
                  onChange={(e) => setGeneratedDoc(e.target.value)}
                  className="w-full h-[600px] font-serif leading-loose outline-none bg-transparent resize-none"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              ) : (
                <div className="prose prose-slate max-w-none font-serif leading-loose" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                </div>
              )}

              <div className="absolute bottom-20 right-20 w-32 h-32 border-4 border-dashed border-legal-gold/10 rounded-full flex items-center justify-center rotate-12 opacity-30">
                <span className="text-xs font-bold text-legal-gold text-center uppercase">
                  JuristDZ
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <Layers size={80} className="mb-6 text-slate-300" />
            <h3 className="text-xl font-serif">
              {language === 'ar' ? 'جاهز للتوليد' : 'Prêt pour la génération'}
            </h3>
            <p className="max-w-xs mx-auto text-sm mt-2">
              {language === 'ar' 
                ? 'أكمل الخطوات وانقر على توليد للحصول على وثيقة قانونية كاملة'
                : 'Complétez les étapes et cliquez sur Générer pour obtenir un document juridique complet'}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex gap-2">
        <button 
          onClick={() => setMobileTab('config')} 
          className={`flex-1 py-3 text-xs font-bold rounded-xl ${mobileTab === 'config' ? 'bg-legal-gold text-white' : 'text-slate-500'}`}
        >
          Configuration
        </button>
        <button 
          onClick={() => setMobileTab('preview')} 
          className={`flex-1 py-3 text-xs font-bold rounded-xl ${mobileTab === 'preview' ? 'bg-legal-gold text-white' : 'text-slate-500'}`}
        >
          Document
        </button>
      </div>

      {/* Template Contribution Modal */}
      {showContribution && (
        <TemplateContribution
          language={language}
          userRole={userRole}
          userId={userId}
          onClose={() => setShowContribution(false)}
        />
      )}
    </div>
  );
};

export default EnhancedDraftingInterface;
