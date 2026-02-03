
import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini } from '../services/geminiService';
import { autoTranslationService } from '../services/autoTranslationService';
import { 
  TEMPLATES, 
  NOTAIRE_TEMPLATES, 
  HUISSIER_TEMPLATES, 
  MAGISTRAT_TEMPLATES, 
  JURISTE_TEMPLATES, 
  ETUDIANT_TEMPLATES, 
  UI_TRANSLATIONS 
} from '../constants';
import { AppMode, Language, Citation, UserRole } from '../types';
import { FileText, Download, CheckCircle, List, ChevronRight, PenTool, Layout, Eye, ExternalLink, Printer, Mic, MicOff, Share2, Check, Edit3, Save, Scale, Settings, Languages } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import StructuredLegalForm from './StructuredLegalForm';

interface DraftingInterfaceProps {
  language: Language;
  userRole?: UserRole; // Ajouter le rôle utilisateur
}

const DraftingInterface: React.FC<DraftingInterfaceProps> = ({ language, userRole = UserRole.AVOCAT }) => {
  const t = UI_TRANSLATIONS[language];
  
  // Sélectionner les templates selon le rôle utilisateur
  const getTemplatesForRole = (role: UserRole) => {
    switch (role) {
      case UserRole.AVOCAT:
        return TEMPLATES;
      case UserRole.NOTAIRE:
        return NOTAIRE_TEMPLATES;
      case UserRole.HUISSIER:
        return HUISSIER_TEMPLATES;
      case UserRole.MAGISTRAT:
        return MAGISTRAT_TEMPLATES;
      case UserRole.JURISTE_ENTREPRISE:
        return JURISTE_TEMPLATES;
      case UserRole.ETUDIANT:
        return ETUDIANT_TEMPLATES;
      case UserRole.ADMIN:
        // Admin a accès à tous les templates pour test/démonstration
        return [...TEMPLATES, ...NOTAIRE_TEMPLATES, ...HUISSIER_TEMPLATES, ...MAGISTRAT_TEMPLATES, ...JURISTE_TEMPLATES, ...ETUDIANT_TEMPLATES];
      default:
        return TEMPLATES;
    }
  };
  
  const availableTemplates = getTemplatesForRole(userRole);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(availableTemplates[0]?.id || '');
  const [details, setDetails] = useState('');
  const [generatedDoc, setGeneratedDoc] = useState('');
  const [originalDoc, setOriginalDoc] = useState(''); // Store original document
  const [originalDocLang, setOriginalDocLang] = useState<Language>('fr'); // Store original language
  const [isDocTranslated, setIsDocTranslated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [mobileTab, setMobileTab] = useState<'config' | 'preview'>('config');
  const [useStructuredForm, setUseStructuredForm] = useState(true);
  const [structuredFormData, setStructuredFormData] = useState<any>({});

  const componentId = `drafting-${userRole}`;

  // Register for automatic translation
  useEffect(() => {
    console.log(`🔧 DraftingInterface: Registering for auto translation`);
    autoTranslationService.registerComponent(componentId, handleAutoTranslation);
    
    return () => {
      autoTranslationService.unregisterComponent(componentId);
    };
  }, []);

  const handleAutoTranslation = async (newLanguage: Language) => {
    console.log(`🔧 DraftingInterface: Auto translation triggered for ${newLanguage}`);
    
    if (!generatedDoc || !originalDoc) {
      console.log(`🔧 DraftingInterface: No document to translate`);
      return;
    }

    // If the original language matches the target language, show original document
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

      const isSuccessfulTranslation = translatedDoc !== originalDoc && 
                                    translatedDoc.trim().length > 0;

      if (isSuccessfulTranslation) {
        setGeneratedDoc(translatedDoc);
        setIsDocTranslated(true);
        console.log(`🔧 DraftingInterface: Document translated successfully`);
      } else {
        setGeneratedDoc(originalDoc);
        setIsDocTranslated(false);
        console.log(`🔧 DraftingInterface: Translation failed, showing original`);
      }
    } catch (error) {
      console.error('🔧 DraftingInterface: Auto translation failed:', error);
      setGeneratedDoc(originalDoc);
      setIsDocTranslated(false);
    } finally {
      setIsTranslating(false);
    }
  };

  const selectedTemplate = availableTemplates.find(t => t.id === selectedTemplateId) || availableTemplates[0];

  const getName = (tpl: any) => language === 'ar' ? tpl.name_ar : tpl.name;
  const getDesc = (tpl: any) => language === 'ar' ? tpl.description_ar : tpl.description;
  const getGuide = (tpl: any) => language === 'ar' ? tpl.inputGuide_ar : tpl.inputGuide;
  const getPrompt = (tpl: any) => language === 'ar' ? tpl.prompt_ar : tpl.prompt;

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    
    let prompt = getPrompt(selectedTemplate);
    
    if (useStructuredForm && Object.keys(structuredFormData).length > 0) {
      // Construire le prompt avec les données structurées
      prompt += '\n\nInformations fournies :\n';
      
      // Informations de la personne
      if (structuredFormData.personnePhysique) {
        const p = structuredFormData.personnePhysique;
        if (p.nom && p.prenom) {
          prompt += `\nPersonne concernée : ${p.prenom} ${p.nom}`;
          if (p.nomPere && p.prenomPere) {
            prompt += `, fils/fille de ${p.prenomPere} ${p.nomPere}`;
          }
          if (p.nomMere && p.prenomMere) {
            prompt += ` et de ${p.prenomMere} ${p.nomMere}`;
          }
          if (p.dateNaissance) {
            prompt += `, né(e) le ${p.dateNaissance}`;
          }
          if (p.lieuNaissance) {
            prompt += ` à ${p.lieuNaissance}`;
          }
          if (p.nationalite) {
            prompt += `, de nationalité ${p.nationalite}`;
          }
          if (p.profession) {
            prompt += `, profession : ${p.profession}`;
          }
          if (p.adresse) {
            prompt += `, demeurant à ${p.adresse}`;
          }
          if (p.commune && p.wilaya) {
            prompt += `, commune de ${p.commune}, wilaya de ${p.wilaya}`;
          }
          if (p.typeDocument && p.numeroDocument) {
            prompt += `, titulaire de la ${p.typeDocument} n° ${p.numeroDocument}`;
          }
          if (p.dateDelivrance && p.lieuDelivrance) {
            prompt += ` délivrée le ${p.dateDelivrance} à ${p.lieuDelivrance}`;
          }
        }
      }
      
      // Informations du cabinet
      if (structuredFormData.cabinet) {
        const c = structuredFormData.cabinet;
        if (c.nomCabinet && c.nomPraticien && c.prenomPraticien) {
          prompt += `\n\nCabinet : ${c.nomCabinet}`;
          prompt += `\nReprésenté par Maître ${c.prenomPraticien} ${c.nomPraticien}`;
          if (c.qualitePraticien) {
            prompt += `, ${c.qualitePraticien}`;
          }
          if (c.barreau) {
            prompt += ` au Barreau de ${c.barreau}`;
          }
          if (c.numeroTableau) {
            prompt += `, inscrit au tableau sous le n° ${c.numeroTableau}`;
          }
          if (c.adresseCabinet) {
            prompt += `\nAdresse du cabinet : ${c.adresseCabinet}`;
          }
          if (c.telephoneCabinet) {
            prompt += `\nTéléphone : ${c.telephoneCabinet}`;
          }
        }
      }
      
      // Informations du tribunal
      if (structuredFormData.tribunal) {
        const tr = structuredFormData.tribunal;
        if (tr.nomTribunal) {
          prompt += `\n\nJuridiction compétente : ${tr.nomTribunal}`;
          if (tr.typeTribunal) {
            prompt += ` (${tr.typeTribunal})`;
          }
          if (tr.adresseTribunal) {
            prompt += `\nAdresse : ${tr.adresseTribunal}`;
          }
          if (tr.wilayaTribunal) {
            prompt += `, ${tr.wilayaTribunal}`;
          }
        }
      }
      
      // Détails supplémentaires
      if (details.trim()) {
        prompt += `\n\nDétails spécifiques de l'affaire :\n${details}`;
      }
      
      prompt += '\n\nVeuillez rédiger le document juridique complet en respectant scrupuleusement la forme légale algérienne et en incluant toutes les mentions obligatoires.';
    } else {
      // Mode texte libre
      if (!details.trim()) return;
      prompt += ` ${details}.`;
    }
    
    setMobileTab('preview');
    setIsGenerating(true);
    const response = await sendMessageToGemini(prompt, [], AppMode.DRAFTING, language);
    
    // Store both original and current document
    setOriginalDoc(response.text);
    setOriginalDocLang(language);
    setGeneratedDoc(response.text);
    setIsDocTranslated(false);
    
    setIsGenerating(false);
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

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Configuration Sidebar */}
      <div className={`w-full md:w-80 bg-white dark:bg-slate-900 border-e dark:border-slate-800 flex flex-col h-full overflow-y-auto ${mobileTab === 'config' ? 'flex' : 'hidden md:flex'}`}>
         <div className="p-6 border-b dark:border-slate-800">
            <h2 className="text-xl font-bold font-serif mb-1 flex items-center gap-2">
              {t.draft_title}
              {isTranslating && (
                <div className="flex items-center gap-1 text-blue-500">
                  <Languages size={16} className="animate-pulse" />
                  <span className="text-xs">
                    {language === 'ar' ? 'ترجمة...' : 'Traduction...'}
                  </span>
                </div>
              )}
            </h2>
            <p className="text-xs text-slate-500">{t.draft_subtitle}</p>
         </div>
         
         <div className="p-4 space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modèles Verticaux</label>
              <button
                onClick={() => setUseStructuredForm(!useStructuredForm)}
                className={`p-2 rounded-lg transition-all ${useStructuredForm ? 'bg-legal-gold text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                title={useStructuredForm ? 'Passer au mode texte libre' : 'Passer au formulaire structuré'}
              >
                <Settings size={14} />
              </button>
            </div>
            
            <div className="space-y-2">
               {availableTemplates.map(tpl => (
                 <button 
                   key={tpl.id} 
                   onClick={() => setSelectedTemplateId(tpl.id)}
                   className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${selectedTemplateId === tpl.id ? 'border-legal-gold bg-amber-50 dark:bg-amber-900/10 text-legal-gold shadow-sm' : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                 >
                    <div className="font-bold">{getName(tpl)}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{getDesc(tpl)}</div>
                 </button>
               ))}
            </div>

            {useStructuredForm ? (
              <div className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {language === 'ar' ? 'نموذج منظم' : 'Formulaire Structuré'}
                  </label>
                  <div className="text-xs text-slate-500">
                    {Object.keys(structuredFormData).length > 0 && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={12} />
                        {language === 'ar' ? 'جاهز' : 'Prêt'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <StructuredLegalForm
                    templateId={selectedTemplateId}
                    language={language}
                    onFormChange={setStructuredFormData}
                  />
                </div>
              </div>
            ) : (
              <div className="pt-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Détails de l'affaire</label>
                <textarea 
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full h-40 p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-1 ring-legal-gold"
                  placeholder={getGuide(selectedTemplate)}
                />
              </div>
            )}
            
            {useStructuredForm && (
              <div className="pt-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  {language === 'ar' ? 'تفاصيل إضافية' : 'Détails Complémentaires'}
                </label>
                <textarea 
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-1 ring-legal-gold"
                  placeholder={language === 'ar' ? 'معلومات إضافية أو ظروف خاصة...' : 'Informations supplémentaires ou circonstances particulières...'}
                />
              </div>
            )}
         </div>

         <div className="mt-auto p-4 border-t dark:border-slate-800">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || (!useStructuredForm && !details.trim()) || (useStructuredForm && Object.keys(structuredFormData).length === 0 && !details.trim())}
              className="w-full py-4 bg-legal-blue dark:bg-legal-gold text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
               {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileText size={18} />}
               {isGenerating ? t.draft_btn_generating : t.draft_btn_generate}
            </button>
         </div>
      </div>

      {/* Preview & Editor */}
      <div className={`flex-1 flex flex-col h-full bg-slate-100 dark:bg-slate-950 p-4 md:p-8 overflow-y-auto ${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
         {generatedDoc ? (
            <div className="max-w-3xl mx-auto w-full space-y-4">
               <div className="flex justify-between items-center px-4">
                  <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border dark:border-slate-800">
                     <button onClick={() => setIsEditing(false)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!isEditing ? 'bg-legal-gold text-white shadow-md' : 'text-slate-500'}`}>{t.draft_preview_mode}</button>
                     <button onClick={() => setIsEditing(true)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isEditing ? 'bg-legal-gold text-white shadow-md' : 'text-slate-500'}`}>{t.draft_edit_mode}</button>
                  </div>
                  <div className="flex items-center gap-2">
                     {isDocTranslated && (
                       <div className="flex items-center gap-1 text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                         <Languages size={12} />
                         <span className="text-xs font-bold">
                           {language === 'ar' ? 'مترجم' : 'Traduit'}
                         </span>
                       </div>
                     )}
                     <button onClick={handlePrint} className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-legal-gold"><Printer size={20} /></button>
                     <button onClick={() => navigator.clipboard.writeText(generatedDoc)} className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-legal-gold"><Download size={20} /></button>
                  </div>
               </div>

               <div id="printable-doc" className="bg-white dark:bg-slate-900 shadow-2xl p-10 md:p-16 rounded-xl border dark:border-slate-800 min-h-[842px] relative transition-colors">
                  {/* Decorative Firm Header */}
                  <div className="border-b-2 border-legal-gold/20 pb-8 mb-12 flex justify-between items-start opacity-40">
                     <div className="text-[10px] font-bold uppercase tracking-widest font-serif">
                        Cabinet de Maître [Nom]<br/>
                        Barreau d'Alger
                     </div>
                     <Scale size={32} className="text-legal-gold" />
                  </div>

                  {isEditing ? (
                    <textarea 
                      value={generatedDoc}
                      onChange={(e) => setGeneratedDoc(e.target.value)}
                      className="w-full h-[600px] font-serif leading-loose outline-none bg-transparent resize-none text-slate-800 dark:text-slate-100"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  ) : (
                    <div className="prose prose-slate dark:prose-invert max-w-none font-serif leading-loose" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                       <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                    </div>
                  )}

                  {/* Stamp Placeholder */}
                  <div className="absolute bottom-20 right-20 w-32 h-32 border-4 border-dashed border-legal-gold/10 rounded-full flex items-center justify-center rotate-12 opacity-30 select-none">
                     <span className="text-[8px] font-bold text-legal-gold text-center uppercase tracking-tighter">Sceau du Cabinet<br/>Numérique JuristDZ</span>
                  </div>
               </div>
            </div>
         ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
               <PenTool size={80} className="mb-6 text-slate-300" />
               <h3 className="text-xl font-serif">Prêt pour la rédaction</h3>
               <p className="max-w-xs mx-auto text-sm mt-2">Sélectionnez un dossier et lancez la génération par IA pour obtenir un acte conforme.</p>
            </div>
         )}
      </div>

      {/* Mobile Footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-800 p-2 flex gap-2">
         <button onClick={() => setMobileTab('config')} className={`flex-1 py-3 text-xs font-bold rounded-xl ${mobileTab === 'config' ? 'bg-legal-gold text-white' : 'text-slate-500'}`}>Configuration</button>
         <button onClick={() => setMobileTab('preview')} className={`flex-1 py-3 text-xs font-bold rounded-xl ${mobileTab === 'preview' ? 'bg-legal-gold text-white' : 'text-slate-500'}`}>Document</button>
      </div>
    </div>
  );
};

export default DraftingInterface;
