import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini } from '../services/geminiService';
import { autoTranslationService } from '../services/autoTranslationService';
import { wilayaTemplateService } from '../services/wilayaTemplateService';
import { clauseService } from '../services/clauseService';
import { documentHeaderService } from '../services/documentHeaderService';
import { documentSignatureService } from '../services/documentSignatureService';
import {
  AVOCAT_TEMPLATES,
  NOTAIRE_TEMPLATES,
  HUISSIER_TEMPLATES,
  MAGISTRAT_TEMPLATES,
  JURISTE_TEMPLATES,
  ETUDIANT_TEMPLATES,
  UI_TRANSLATIONS
} from '../constants';
import { OMNI_TEMPLATES } from '../src/templates/omni_professional_templates';
import { AppMode, Language, UserRole, EnhancedUserProfile, ProfessionalInfo } from '../types';
import { 
  FileText, Download, CheckCircle, ChevronRight, PenTool, Eye, 
  Printer, Share2, Check, Edit3, Save, Scale, Languages,
  MapPin, BookOpen, Plus, Layers, User, AlertCircle, Search,
  RefreshCw, Zap, Tag, ChevronDown, ChevronUp, History
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import WilayaSelector from './WilayaSelector';
import ClauseSelector from './ClauseSelector';
import TemplateContribution from './TemplateContribution';
import DynamicLegalForm from './forms/DynamicLegalForm';
import ProfessionalProfileForm from './ProfessionalProfileForm';
import DocumentVersionHistory from '../src/components/documents/DocumentVersionHistory';
import SignatureModal from '../src/components/documents/SignatureModal';
import { useAppToast } from '../src/contexts/ToastContext';
import { documentVersionService } from '../src/services/documentVersionService';
import { pdfExportService } from '../src/services/pdfExportService';

interface EnhancedDraftingInterfaceProps {
  language: Language;
  userRole?: UserRole;
  userId: string;
  user?: EnhancedUserProfile; // Profil utilisateur complet
}

type ConfigStep = 'template' | 'wilaya' | 'clauses' | 'details';

const EnhancedDraftingInterface: React.FC<EnhancedDraftingInterfaceProps> = ({ 
  language, 
  userRole = UserRole.AVOCAT,
  userId,
  user
}) => {
  const t = UI_TRANSLATIONS[language];
  const { toast } = useAppToast();
  
  // Configuration steps
  const [currentStep, setCurrentStep] = useState<ConfigStep>('template');
  const [showContribution, setShowContribution] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Mock user profile if not provided (for backward compatibility)
  const [userProfile, setUserProfile] = useState<EnhancedUserProfile>(user || {
    id: userId,
    email: 'user@example.com',
    firstName: 'Utilisateur',
    lastName: 'Test',
    profession: userRole,
    roles: [userRole],
    activeRole: userRole,
    languages: [language],
    specializations: [],
    isActive: true,
    emailVerified: true,
    mfaEnabled: false
  });
  
  // Template selection
  const getTemplatesForRole = (role: UserRole) => {
    switch (role) {
      case UserRole.AVOCAT: return [...OMNI_TEMPLATES.filter(t => t.roles.includes('avocat')), ...AVOCAT_TEMPLATES];
      case UserRole.NOTAIRE: return [...OMNI_TEMPLATES.filter(t => t.roles.includes('notaire')), ...NOTAIRE_TEMPLATES];
      case UserRole.HUISSIER: return [...OMNI_TEMPLATES.filter(t => t.roles.includes('huissier')), ...HUISSIER_TEMPLATES];
      case UserRole.MAGISTRAT: return [...OMNI_TEMPLATES.filter(t => t.roles.includes('magistrat')), ...MAGISTRAT_TEMPLATES];
      case UserRole.JURISTE_ENTREPRISE: return [...OMNI_TEMPLATES.filter(t => t.roles.includes('juriste_entreprise')), ...JURISTE_TEMPLATES];
      case UserRole.ETUDIANT: return ETUDIANT_TEMPLATES;
      case UserRole.ADMIN:
        return [...OMNI_TEMPLATES, ...ETUDIANT_TEMPLATES];
      default: return [...OMNI_TEMPLATES.filter(t => t.roles.includes('avocat')), ...AVOCAT_TEMPLATES];
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
  const [showFormModal, setShowFormModal] = useState(false);
  
  // Document state
  const [generatedDoc, setGeneratedDoc] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<{ dataUrl: string; signedAt: string; signerName: string } | null>(null);
  const [originalDoc, setOriginalDoc] = useState('');
  const [originalDocLang, setOriginalDocLang] = useState<Language>('fr');
  const [isDocTranslated, setIsDocTranslated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // UI state
  const [mobileTab, setMobileTab] = useState<'config' | 'preview'>('config');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string>('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Group templates by category
  const getTemplateCategory = (id: string): { key: string; label_fr: string; label_ar: string } => {
    if (id.includes('divorce') || id.includes('pension') || id.includes('garde') || id.includes('succession') || id.includes('famille') || id.includes('kafala') || id.includes('mariage')) return { key: 'famille', label_fr: 'Droit de la Famille', label_ar: 'قانون الأسرة' };
    if (id.includes('penal') || id.includes('plainte') || id.includes('appel_penal') || id.includes('mise_en_demeure_penale')) return { key: 'penal', label_fr: 'Droit Pénal', label_ar: 'القانون الجزائي' };
    if (id.includes('vente') || id.includes('donation') || id.includes('hypotheque') || id.includes('bail') || id.includes('testament') || id.includes('notair')) return { key: 'notarial', label_fr: 'Actes Notariaux', label_ar: 'العقود التوثيقية' };
    if (id.includes('exploit') || id.includes('signification') || id.includes('constat') || id.includes('saisie') || id.includes('commandement')) return { key: 'huissier', label_fr: 'Actes d\'Huissier', label_ar: 'أعمال المحضر' };
    if (id.includes('commercial') || id.includes('faillite') || id.includes('societe') || id.includes('contrat_comm')) return { key: 'commercial', label_fr: 'Droit Commercial', label_ar: 'القانون التجاري' };
    if (id.includes('administratif') || id.includes('recours') || id.includes('admin')) return { key: 'administratif', label_fr: 'Droit Administratif', label_ar: 'القانون الإداري' };
    if (id.includes('travail') || id.includes('emploi') || id.includes('licenciement') || id.includes('contrat_travail')) return { key: 'travail', label_fr: 'Droit du Travail', label_ar: 'قانون العمل' };
    if (id.includes('etudiant') || id.includes('exercice') || id.includes('analyse')) return { key: 'etudiant', label_fr: 'Exercices', label_ar: 'تمارين' };
    return { key: 'civil', label_fr: 'Droit Civil', label_ar: 'القانون المدني' };
  };

  const filteredTemplates = availableTemplates.filter(tpl => {
    if (!templateSearch) return true;
    const q = templateSearch.toLowerCase();
    return (tpl.name?.toLowerCase().includes(q) || tpl.name_ar?.includes(q) || tpl.description?.toLowerCase().includes(q));
  });

  const groupedTemplates = filteredTemplates.reduce((acc, tpl) => {
    const cat = getTemplateCategory(tpl.id);

    // Strict role-based category filtering
    if (userRole === UserRole.AVOCAT && (cat.key === 'huissier' || cat.key === 'notarial')) return acc;
    if (userRole === UserRole.NOTAIRE && (cat.key === 'huissier' || cat.key === 'penal')) return acc;
    if (userRole === UserRole.HUISSIER && (cat.key === 'notarial' || cat.key === 'penal')) return acc;
    if (userRole === UserRole.MAGISTRAT && (cat.key === 'huissier' || cat.key === 'notarial')) return acc;

    if (!acc[cat.key]) acc[cat.key] = { ...cat, templates: [] };
    acc[cat.key].templates.push(tpl);
    return acc;
  }, {} as Record<string, { key: string; label_fr: string; label_ar: string; templates: typeof availableTemplates }>);

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Auto-fill form from professional profile
  const getProfileAutoFill = (): Record<string, string> => {
    if (!userProfile.professionalInfo) return {};
    const info = userProfile.professionalInfo;
    return {
      avocatNom: userProfile.lastName,
      avocatPrenom: userProfile.firstName,
      avocatAdresse: info.cabinetAddress || '',
      avocatTel: info.cabinetPhone || '',
      avocatEmail: info.cabinetEmail || '',
      avocatBarreau: info.barreauInscription || '',
      avocatNumero: info.numeroInscription || '',
    };
  };

  const componentId = `enhanced-drafting-${userRole}`;
  const selectedTemplate = availableTemplates.find(t => t.id === selectedTemplateId) || availableTemplates[0];

  const isTranslatingRef = React.useRef(false);

  // Traduction automatique quand la langue change
  useEffect(() => {
    const translateDocument = async () => {
      if (!originalDoc) return;
      if (language === originalDocLang) {
        setGeneratedDoc(originalDoc);
        setIsDocTranslated(false);
        return;
      }
      if (isTranslatingRef.current) return;

      isTranslatingRef.current = true;
      setIsTranslating(true);

      try {
        const translatedDoc = await autoTranslationService.translateContent(
          originalDoc,
          originalDocLang,
          language
        );
        setGeneratedDoc(translatedDoc);
        setIsDocTranslated(true);
      } catch (error) {
        console.error('🌐 Translation error:', error);
        setGeneratedDoc(originalDoc);
        setIsDocTranslated(false);
      } finally {
        isTranslatingRef.current = false;
        setIsTranslating(false);
      }
    };

    translateDocument();
  }, [language, originalDoc, originalDocLang]);

  // Autosave when generatedDoc changes in edit mode
  useEffect(() => {
    if (!generatedDoc || !currentDocumentId || !isEditing) return undefined;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await documentVersionService.saveVersion({
          userId,
          documentId: currentDocumentId,
          documentTitle: language === 'ar' ? (selectedTemplate?.name_ar || selectedTemplate?.name || 'Document') : (selectedTemplate?.name || 'Document'),
          templateId: selectedTemplateId,
          content: generatedDoc,
          language,
          changeSummary: language === 'ar' ? 'حفظ تلقائي' : 'Sauvegarde automatique',
        });
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch {
        setAutoSaveStatus('idle');
      }
    }, 2000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [generatedDoc, isEditing]);

  // Helper function to replace placeholders with form data
  const replacePlaceholdersWithFormData = (document: string, formData: any): string => {
    let result = document;
    
    // Mapping des champs du formulaire vers les placeholders courants
    const placeholderMappings: { [key: string]: string[] } = {
      // Demandeur
      'demandeurNom': ['[NOM]', '[NOM_DEMANDEUR]'],
      'demandeurPrenom': ['[PRENOM]', '[PRENOM_DEMANDEUR]'],
      'demandeurDateNaissance': ['[DATE_NAISSANCE]', '[DATE_NAISSANCE_DEMANDEUR]'],
      'demandeurLieuNaissance': ['[LIEU_NAISSANCE]', '[LIEU_NAISSANCE_DEMANDEUR]'],
      'demandeurCIN': ['[CIN]', '[CIN_DEMANDEUR]', '[NUMERO_CIN]'],
      'demandeurAdresse': ['[ADRESSE]', '[ADRESSE_DEMANDEUR]'],
      'demandeurProfession': ['[PROFESSION]', '[PROFESSION_DEMANDEUR]'],
      
      // Défendeur
      'defendeurNom': ['[NOM_DEFENDEUR]'],
      'defendeurPrenom': ['[PRENOM_DEFENDEUR]'],
      'defendeurDateNaissance': ['[DATE_NAISSANCE_DEFENDEUR]'],
      'defendeurLieuNaissance': ['[LIEU_NAISSANCE_DEFENDEUR]'],
      'defendeurCIN': ['[CIN_DEFENDEUR]'],
      'defendeurAdresse': ['[ADRESSE_DEFENDEUR]'],
      'defendeurProfession': ['[PROFESSION_DEFENDEUR]'],
      
      // Débiteur
      'debiteurNom': ['[NOM_DEBITEUR]'],
      'debiteurPrenom': ['[PRENOM_DEBITEUR]'],
      'debiteurDateNaissance': ['[DATE_NAISSANCE_DEBITEUR]'],
      'debiteurLieuNaissance': ['[LIEU_NAISSANCE_DEBITEUR]'],
      'debiteurCIN': ['[CIN_DEBITEUR]'],
      'debiteurAdresse': ['[ADRESSE_DEBITEUR]'],
      'debiteurProfession': ['[PROFESSION_DEBITEUR]'],
      
      // Défunt
      'defuntNom': ['[NOM_DEFUNT]'],
      'defuntPrenom': ['[PRENOM_DEFUNT]'],
      'defuntCIN': ['[CIN_DEFUNT]'],
      'dateDeces': ['[DATE_DECES]'],
      'lieuDeces': ['[LIEU_DECES]'],
      
      // Dates génériques
      'dateCIN': ['[DATE_CIN]'],
      'lieuCIN': ['[LIEU_CIN]'],
    };
    
    // Remplacer les placeholders avec les vraies valeurs
    Object.entries(formData).forEach(([fieldName, fieldValue]) => {
      if (fieldValue && fieldValue !== '') {
        // Utiliser les mappings définis
        if (placeholderMappings[fieldName]) {
          placeholderMappings[fieldName].forEach(placeholder => {
            result = result.replace(new RegExp(placeholder.replace(/[[\]]/g, '\\$&'), 'g'), String(fieldValue));
          });
        }
        
        // Aussi essayer de remplacer directement le nom du champ en majuscules
        const upperFieldName = fieldName.replace(/([A-Z])/g, '_$1').toUpperCase();
        result = result.replace(new RegExp(`\\[${upperFieldName}\\]`, 'g'), String(fieldValue));
      }
    });
    
    // Construire les identités complètes pour remplacer les patterns "[NOM] [PRENOM]"
    const identityPatterns = [
      { nom: 'demandeurNom', prenom: 'demandeurPrenom', pattern: /\[NOM\]\s*\[PRENOM\]/g },
      { nom: 'demandeurNom', prenom: 'demandeurPrenom', pattern: /\[NOM_DEMANDEUR\]\s*\[PRENOM_DEMANDEUR\]/g },
      { nom: 'defendeurNom', prenom: 'defendeurPrenom', pattern: /\[NOM_DEFENDEUR\]\s*\[PRENOM_DEFENDEUR\]/g },
      { nom: 'debiteurNom', prenom: 'debiteurPrenom', pattern: /\[NOM_DEBITEUR\]\s*\[PRENOM_DEBITEUR\]/g },
      { nom: 'defuntNom', prenom: 'defuntPrenom', pattern: /\[NOM_DEFUNT\]\s*\[PRENOM_DEFUNT\]/g },
    ];
    
    identityPatterns.forEach(({ nom, prenom, pattern }) => {
      if (formData[nom] && formData[prenom]) {
        const fullName = `${formData[prenom]} ${formData[nom]}`;
        result = result.replace(pattern, fullName);
      }
    });
    
    // Formater les dates au format français si elles sont au format ISO
    result = result.replace(/(\d{4})-(\d{2})-(\d{2})/g, (match, year, month, day) => {
      return `${day}/${month}/${year}`;
    });
    
    // Remplacer les placeholders de date génériques restants
    if (formData.demandeurDateNaissance) {
      const date = new Date(formData.demandeurDateNaissance);
      const formatted = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      result = result.replace(/\[DATE_NAISSANCE\]/g, formatted);
    }
    
    // Pour les CIN, si on n'a pas de date/lieu de délivrance, on les supprime proprement
    if (!formData.dateCIN) {
      result = result.replace(/,?\s*délivrée le \[DATE_CIN\]/g, '');
      result = result.replace(/,?\s*delivered on \[DATE_CIN\]/g, '');
    }
    if (!formData.lieuCIN) {
      result = result.replace(/\s*à \[LIEU_CIN\]/g, '');
      result = result.replace(/\s*at \[LIEU_CIN\]/g, '');
    }
    
    // Nettoyer les en-têtes vides générés par l'IA
    // Pattern: "Monsieur/Madame, né(e) le à, de nationalité..."
    const emptyHeaderPattern = /^Monsieur\/Madame[^.]*?profession\.\s*/i;
    result = result.replace(emptyHeaderPattern, '');
    
    // Nettoyer les lignes avec des champs vides consécutifs
    // Pattern: "né(e) le à" ou "délivrée le à"
    result = result.replace(/né\(e\)\s+le\s+à/gi, '');
    result = result.replace(/délivrée?\s+le\s+à/gi, '');
    result = result.replace(/,\s+profession\./gi, '');
    
    // Nettoyer les placeholders restants qui n'ont pas de valeur
    // Les remplacer par des mentions génériques plutôt que de les laisser vides
    result = result.replace(/\[DATE_CIN\]/gi, '');
    result = result.replace(/\[LIEU_CIN\]/gi, '');
    result = result.replace(/\[LIEU_NAISSANCE\]/gi, formData.demandeurLieuNaissance || formData.defendeurLieuNaissance || '');
    result = result.replace(/\[LIEU\]/gi, formData.selectedWilaya || formData.demandeurAdresse?.split(',')[0] || 'Alger');
    result = result.replace(/\[DATE\]/gi, new Date().toLocaleDateString('fr-FR'));
    result = result.replace(/\[MOIS\]/gi, new Date().toLocaleDateString('fr-FR', { month: 'long' }));
    result = result.replace(/\[ANNEE\]/gi, new Date().getFullYear().toString());
    
    // Nettoyer les mentions d'avocat/notaire si le demandeur n'est pas un professionnel
    result = result.replace(/\[Signature de l'avocat ou du notaire\]/gi, '');
    result = result.replace(/\[Adresse de l'avocat ou du notaire\]/gi, '');
    result = result.replace(/Avocat\/Notaire\s*\n/g, '');
    
    // Nettoyer les placeholders spécifiques aux enfants et garde
    if (formData.nomEnfant && formData.prenomEnfant) {
      result = result.replace(/\[noms? enfants?\]/gi, `${formData.prenomEnfant} ${formData.nomEnfant}`);
      result = result.replace(/\[nom enfant\]/gi, `${formData.prenomEnfant} ${formData.nomEnfant}`);
    } else {
      result = result.replace(/\[noms? enfants?\]/gi, '');
      result = result.replace(/\[nom enfant\]/gi, '');
    }
    
    // Parent gardien
    if (formData.demandeurNom && formData.demandeurPrenom) {
      result = result.replace(/\[parent gardien\]/gi, `${formData.demandeurPrenom} ${formData.demandeurNom}`);
    } else {
      result = result.replace(/\[parent gardien\]/gi, 'le parent demandeur');
    }
    
    // Modalités de visite
    if (formData.modalitesVisite) {
      result = result.replace(/\[modalites visite\]/gi, formData.modalitesVisite);
    } else {
      result = result.replace(/\[modalites visite\]/gi, 'selon les modalités à définir par le tribunal');
    }
    
    // Nettoyer les phrases avec placeholders vides entre crochets
    result = result.replace(/\s*\[[\w\s]+à compléter\]\s*/gi, ' ');
    result = result.replace(/\s*\[[\w\s]+à préciser\]\s*/gi, ' ');
    
    // Nettoyer les doubles espaces et espaces avant ponctuation
    result = result.replace(/\s+/g, ' ');
    result = result.replace(/\s+([,;.!?])/g, '$1');
    
    // Supprimer les lignes vides multiples
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // CRITIQUE: Supprimer TOUS les placeholders restants entre crochets
    // Ceci est la dernière ligne de défense
    result = result.replace(/\[([^\]]+)\]/g, (match, content) => {
      // Si c'est un placeholder de type variable, on le supprime
      if (content.match(/^[A-Z_\s]+$/i) || content.includes('à compléter') || content.includes('à préciser')) {
        console.warn(`🚨 Placeholder supprimé: ${match}`);
        return '';
      }
      // Sinon on le garde (pourrait être du contenu légitime)
      return match;
    });
    
    return result;
  };

  // Sync userProfile when user prop changes (loads professionalInfo from DB)
  useEffect(() => {
    if (user) {
      setUserProfile(user);
    }
  }, [user]);

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

  // Manual retranslation trigger
  const handleRetranslate = async () => {
    if (!originalDoc || isTranslatingRef.current) return;
    isTranslatingRef.current = true;
    setIsTranslating(true);
    try {
      const translated = await autoTranslationService.translateContent(originalDoc, originalDocLang, language);
      setGeneratedDoc(translated);
      setIsDocTranslated(true);
    } catch {
      setGeneratedDoc(originalDoc);
    } finally {
      isTranslatingRef.current = false;
      setIsTranslating(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'template': return !!selectedTemplateId;
      case 'wilaya': return true; // Optional
      case 'clauses': return true; // Optional
      case 'details': return Object.keys(structuredFormData).length > 0;
      default: return false;
    }
  };

  const handleSaveProfessionalInfo = async (professionalInfo: ProfessionalInfo) => {
    try {
      const { supabase } = await import('../src/lib/supabase');
      const { error } = await supabase
        .from('profiles')
        .update({ professional_info: professionalInfo })
        .eq('id', userId);

      if (error) throw error;

      setUserProfile({ ...userProfile, professionalInfo });
      setShowProfileModal(false);
    } catch (error) {
      console.error('Error saving professional info:', error);
      toast(language === 'ar' ? 
        'حدث خطأ أثناء حفظ المعلومات' :
        'Erreur lors de l\'enregistrement des informations', 'error');
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    
    // VÉRIFICATION DU PROFIL PROFESSIONNEL
    if (!userProfile.professionalInfo) {
      toast(language === 'ar' ? 
        'يرجى إكمال معلوماتك المهنية أولاً' :
        'Veuillez compléter votre profil professionnel', 'warning');
      setShowProfileModal(true);
      return;
    }
    
    // Vérifier les champs obligatoires selon le rôle
    const info = userProfile.professionalInfo;
    let missingFields: string[] = [];
    
    if (userProfile.profession === UserRole.AVOCAT) {
      if (!info.barreauInscription) missingFields.push(language === 'ar' ? 'نقابة المحامين' : 'Barreau');
      if (!info.numeroInscription) missingFields.push(language === 'ar' ? 'رقم التسجيل' : 'N° inscription');
      if (!info.cabinetAddress) missingFields.push(language === 'ar' ? 'عنوان المكتب' : 'Adresse cabinet');
      if (!info.cabinetPhone) missingFields.push(language === 'ar' ? 'الهاتف' : 'Téléphone');
    } else if (userProfile.profession === UserRole.NOTAIRE) {
      if (!info.chambreNotariale) missingFields.push(language === 'ar' ? 'الغرفة الوطنية' : 'Chambre Notariale');
      if (!info.numeroMatricule) missingFields.push(language === 'ar' ? 'رقم القيد' : 'N° matricule');
      if (!info.etudeAddress) missingFields.push(language === 'ar' ? 'عنوان المكتب' : 'Adresse étude');
    } else if (userProfile.profession === UserRole.HUISSIER) {
      if (!info.chambreHuissiers) missingFields.push(language === 'ar' ? 'الغرفة الوطنية' : 'Chambre Huissiers');
      if (!info.numeroAgrement) missingFields.push(language === 'ar' ? 'رقم الاعتماد' : 'N° agrément');
      if (!info.bureauAddress) missingFields.push(language === 'ar' ? 'عنوان المكتب' : 'Adresse bureau');
    }
    
    if (missingFields.length > 0) {
      toast((language === 'ar' ? 'حقول مفقودة: ' : 'Champs manquants: ') + missingFields.join(', '), 'warning');
      setShowProfileModal(true);
      return;
    }
    
    setMobileTab('preview');
    setIsGenerating(true);

    try {
      let basePrompt = language === 'ar' ? selectedTemplate.prompt_ar : selectedTemplate.prompt;
      let documentContent = '';

      // 1. GÉNÉRER L'EN-TÊTE PROFESSIONNEL COMPLET (seulement si profil complet)
      if (userProfile.professionalInfo) {
        // Déterminer le destinataire selon le type de document
        let destinataire: string = 'president_tribunal';
        if (selectedTemplateId.includes('refere')) {
          destinataire = 'juge_referes';
        } else if (selectedTemplateId.includes('penal') || selectedTemplateId.includes('plainte')) {
          destinataire = 'procureur';
        } else if (selectedTemplateId.includes('acte')) {
          destinataire = 'qui_de_droit';
        }
        
        // Générer l'en-tête professionnel
        const professionalHeader = documentHeaderService.generateDocumentHeader({
          documentType: selectedTemplateId.includes('requete') ? 'requete' : 
                        selectedTemplateId.includes('assignation') ? 'assignation' :
                        selectedTemplateId.includes('acte') ? 'acte' :
                        selectedTemplateId.includes('exploit') ? 'exploit' : 'conclusions',
          professional: userProfile,
          wilaya: selectedWilaya,
          tribunal: selectedTribunal,
          destinataire: destinataire,
          objet: language === 'ar' ? selectedTemplate.name_ar : selectedTemplate.name,
          reference: structuredFormData.reference,
          date: new Date(),
          language: language
        });
        
        documentContent = professionalHeader;
      }

      // 2. NE PAS ajouter les clauses automatiquement - elles seront générées par l'IA avec les bonnes données
      // Les clauses avec placeholders vides causent des problèmes
      // L'IA générera les clauses correctement remplies à partir du template et des données du formulaire

      // 3. Construire le prompt avec les données structurées
      let prompt = basePrompt;
      
      // INSTRUCTIONS UNIVERSELLES POUR TOUS LES DOCUMENTS
      prompt += '\n\n=== INSTRUCTIONS UNIVERSELLES ===\n';
      
      if (documentContent.trim()) {
        prompt += '⚠️ IMPORTANT: Un en-tête professionnel a déjà été généré ci-dessus.\n';
        prompt += 'NE GÉNÉREZ PAS d\'en-tête, de coordonnées professionnelles, ou de destinataire.\n';
        prompt += 'COMMENCEZ DIRECTEMENT par le contenu du document.\n\n';
      }
      
      prompt += '🎯 OBJECTIF: Générer UN SEUL document PROFESSIONNEL prêt à être signé et déposé.\n\n';
      
      prompt += '📋 RÈGLES ABSOLUES (TOUS DOCUMENTS):\n';
      prompt += '1. Utilisez UNIQUEMENT les données RÉELLES fournies dans le formulaire ci-dessous\n';
      prompt += '2. NE GÉNÉREZ JAMAIS de placeholders vides [] - INTERDIT ABSOLU\n';
      prompt += '3. Si une donnée manque, OMETTEZ la mention plutôt que de laisser un placeholder vide\n';
      prompt += '4. Identités COMPLÈTES: "Monsieur [Prénom Nom], né le [date] à [lieu], CIN n° [numéro], demeurant à [adresse], profession: [profession]"\n';
      prompt += '5. Dates: Format "JJ/MM/AAAA" ou en toutes lettres selon le type de document\n';
      prompt += '6. Montants: TOUJOURS en chiffres ET en toutes lettres (ex: "300 000 DA (TROIS CENT MILLE DINARS ALGÉRIENS)")\n';
      prompt += '7. Références juridiques: Articles EXACTS du code applicable\n';
      prompt += '8. Ton professionnel adapté au destinataire\n';
      prompt += '9. Structure claire avec sections numérotées\n';
      prompt += '10. UNE SEULE section de signatures à la fin (pas de répétitions)\n';
      prompt += '11. Pièces jointes: Liste numérotée et précise\n';
      prompt += '12. GÉNÉREZ UN SEUL DOCUMENT - pas de répétitions ou de versions multiples\n\n';
      
      prompt += '❌ INTERDICTIONS STRICTES:\n';
      prompt += '- JAMAIS de "Monsieur/Madame" indécis - choisissez selon le prénom\n';
      prompt += '- JAMAIS de "né(e) le à" vide - utilisez les vraies données ou omettez\n';
      prompt += '- JAMAIS de "Dinars Algériens ()" vide - montant complet requis\n';
      prompt += '- JAMAIS de répétitions (2 actes dans le même document, signatures 3 fois, etc.)\n';
      prompt += '- JAMAIS d\'en-tête générique si un en-tête professionnel existe déjà\n';
      prompt += '- JAMAIS de sections vides avec juste des placeholders\n';
      prompt += '- JAMAIS de texte générique type "Monsieur/Madame, de nationalité algérienne, titulaire de la carte..."\n\n';
      
      if (Object.keys(structuredFormData).length > 0) {
        prompt += '\n\n=== ⚠️ DONNÉES DU FORMULAIRE - UTILISEZ UNIQUEMENT CES INFORMATIONS ⚠️ ===\n';
        prompt += '🚨 RÈGLE CRITIQUE: Si une information n\'est PAS listée ci-dessous, NE L\'INVENTEZ PAS\n';
        prompt += '🚨 Si un champ est vide ci-dessous, OMETTEZ-LE du document (ne mettez pas de placeholder)\n\n';
        
        // Créer des groupes logiques de données
        const dataGroups: { [key: string]: { [key: string]: any } } = {};
        
        Object.entries(structuredFormData).forEach(([key, value]) => {
          if (value && value !== '') {
            // Extraire le préfixe (demandeur, defendeur, vendeur, acheteur, etc.)
            const match = key.match(/^([a-z]+[A-Z][a-z]+)/);
            const prefix = match ? match[1] : 'general';
            
            if (!dataGroups[prefix]) {
              dataGroups[prefix] = {};
            }
            
            // Extraire le nom du champ sans le préfixe
            const fieldName = key.replace(prefix, '');
            dataGroups[prefix][fieldName || key] = value;
          }
        });
        
        // Afficher les données par groupe avec formatage clair
        Object.entries(dataGroups).forEach(([groupName, fields]) => {
          // Formater le nom du groupe
          const readableGroupName = groupName
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/^./, str => str.toUpperCase());
          
          prompt += `━━━ ${readableGroupName.toUpperCase()} ━━━\n`;
          
          // Construire l'identité complète si on a nom et prénom
          if (fields['Nom'] && fields['Prenom']) {
            const prenom = fields['Prenom'];
            const nom = fields['Nom'];
            
            // Déterminer le genre selon le prénom
            const prenomsFeminins = ['fatima', 'khadija', 'aicha', 'amina', 'sarah', 'leila', 'nadia', 'samira', 'malika', 'zohra'];
            const isFeminin = prenomsFeminins.some(p => prenom.toLowerCase().includes(p));
            const civilite = isFeminin ? 'Madame' : 'Monsieur';
            
            prompt += `✅ Identité complète: ${civilite} ${prenom} ${nom}\n`;
            prompt += `✅ Civilité à utiliser: ${civilite} (${isFeminin ? 'féminin' : 'masculin'})\n`;
          }
          
          // Afficher tous les champs
          Object.entries(fields).forEach(([fieldName, fieldValue]) => {
            const readableFieldName = fieldName
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
              .trim();
            
            if (readableFieldName && readableFieldName !== 'Nom' && readableFieldName !== 'Prenom') {
              prompt += `✅ ${readableFieldName}: ${fieldValue}\n`;
            }
          });
          
          prompt += '\n';
        });
        
        prompt += '\n\n⚠️ INSTRUCTIONS CRITIQUES POUR LA GÉNÉRATION:\n';
        prompt += '1. 🚫 NE GÉNÉREZ JAMAIS de texte entre crochets [ ] - c\'est INTERDIT ABSOLU\n';
        prompt += '2. ✅ Utilisez UNIQUEMENT les données listées ci-dessus (marquées avec ✅)\n';
        prompt += '3. ✅ Utilisez les noms COMPLETS: "Prénom Nom" (ex: "Habib Belkacemi" pas "[NOM] [PRENOM]")\n';
        prompt += '4. ✅ Pour les dates: format "JJ/MM/AAAA" (ex: "04/02/1985" pas "[DATE_NAISSANCE]")\n';
        prompt += '5. ✅ Pour les CIN: numéro exact (ex: "845613165" pas "[CIN]")\n';
        prompt += '6. ✅ Pour les adresses: adresse complète (ex: "54, rue Hales Said" pas "[ADRESSE]")\n';
        prompt += '7. ✅ Pour les professions: profession exacte (ex: "Retraite" pas "[PROFESSION]")\n';
        prompt += '8. ✅ Utilisez la civilité indiquée (Monsieur/Madame) - ne mettez JAMAIS "Monsieur/Madame"\n';
        prompt += '9. ✅ VÉRIFIEZ les âges: calculez correctement l\'âge à partir de la date de naissance (nous sommes en 2026)\n';
        prompt += '10. 🚫 Si une info manque dans la liste ci-dessus, OMETTEZ-LA complètement (ne mettez pas de placeholder)\n';
        prompt += '11. ✅ Le document DOIT être prêt à signer - ZÉRO placeholder autorisé\n';
        prompt += '12. 🔍 RELISEZ votre document: si vous voyez [ ], c\'est une ERREUR GRAVE - recommencez\n';
        prompt += '13. 🚫 NE GÉNÉREZ QU\'UN SEUL DOCUMENT - pas de répétitions ou de versions multiples\n';
        prompt += '14. 🚫 NE GÉNÉREZ PAS de sections vides avec des placeholders génériques\n';
        
        prompt += '\n=== EXEMPLES DE REMPLACEMENT CORRECT ===\n';
        prompt += '❌ INCORRECT: "Monsieur [NOM] [PRENOM], né(e) le [DATE_NAISSANCE]"\n';
        prompt += '✅ CORRECT: "Monsieur Habib Belkacemi, né le 04/02/1985"\n\n';
        prompt += '❌ INCORRECT: "Monsieur/Madame, de nationalité algérienne, titulaire de la carte..."\n';
        prompt += '✅ CORRECT: "Monsieur Habib Belkacemi, né le 04/02/1985 à Mostaganem..."\n\n';
        prompt += '❌ INCORRECT: "Dinars Algériens ()"\n';
        prompt += '✅ CORRECT: "1 500 000 DA (UN MILLION CINQ CENT MILLE DINARS ALGÉRIENS)"\n\n';
        prompt += '❌ INCORRECT: Générer 2 actes dans le même document\n';
        prompt += '✅ CORRECT: UN SEUL acte complet avec toutes les informations\n\n';
        prompt += '❌ INCORRECT: "son fils, Fatima" (incohérence de genre)\n';
        prompt += '✅ CORRECT: "sa fille, Fatima" (Fatima est un prénom féminin)\n\n';
        prompt += '\n🚨 RÈGLE D\'OR: AUCUN CROCHET [ ] N\'EST AUTORISÉ DANS LE DOCUMENT FINAL!\n';
        prompt += '🚨 RÈGLE D\'OR 2: UN SEUL DOCUMENT - PAS DE RÉPÉTITIONS!\n';
      }
      
      // Détails supplémentaires
      if (details.trim()) {
        prompt += `\n\nDétails spécifiques supplémentaires:\n${details}`;
      }

      // 4. Instructions de génération
      prompt += '\n\n=== INSTRUCTIONS DE GÉNÉRATION ===\n';
      
      if (documentContent.trim()) {
        prompt += '⚠️ IMPORTANT: Un en-tête officiel a déjà été généré. NE GÉNÉREZ PAS d\'en-tête.\n';
        prompt += 'Commencez directement par le titre du document (ex: "ACTE DE VENTE DE FONDS DE COMMERCE")\n';
        prompt += 'Puis identifiez les parties avec leurs informations COMPLÈTES listées ci-dessus.\n\n';
      } else {
        prompt += 'Générez UN SEUL document juridique COMPLET.\n';
        prompt += 'Commencez par le titre du document (ex: "ACTE DE VENTE DE FONDS DE COMMERCE")\n';
        prompt += 'Puis identifiez les parties avec leurs informations COMPLÈTES listées ci-dessus.\n\n';
      }
      
      prompt += 'Rédigez UN SEUL document juridique PROFESSIONNEL en respectant:\n';
      prompt += '1. La forme légale algérienne\n';
      prompt += '2. La structure du document (voir ci-dessous)\n';
      prompt += '3. L\'utilisation de TOUTES les informations du formulaire (et SEULEMENT celles-ci)\n';
      prompt += '4. Un langage juridique formel et précis\n';
      prompt += '5. NE LAISSEZ AUCUN PLACEHOLDER - tout doit être rempli avec les vraies données\n';
      prompt += '6. NE GÉNÉREZ QU\'UN SEUL DOCUMENT - pas de répétitions\n';
      prompt += '7. NE GÉNÉREZ PAS de sections vides ou génériques\n';
      
      // Ajouter la structure spécifique selon le template
      if (selectedTemplate.structure) {
        const structure = language === 'ar' ? selectedTemplate.structure_ar : selectedTemplate.structure;
        if (structure && Array.isArray(structure)) {
          prompt += '\n=== STRUCTURE ATTENDUE ===\n';
          structure.forEach((section: string, index: number) => {
            prompt += `${index + 1}. ${section}\n`;
          });
        }
      }
      
      prompt += '\n=== RÈGLES CRITIQUES ===\n';
      prompt += '- NE GÉNÉREZ PAS de placeholders entre crochets []\n';
      prompt += '- NE GÉNÉREZ PAS d\'en-tête générique type "Monsieur/Madame, né(e) le à"\n';
      prompt += '- COMMENCEZ DIRECTEMENT par le titre du document (ex: "ACTE DE VENTE")\n';
      prompt += '- Utilisez les noms COMPLETS (ex: "Habib Belkacemi" pas "[NOM] [PRENOM]")\n';
      prompt += '- Formatez les montants: "120 000 DA" ou "120.000,00 DA"\n';
      prompt += '- Formatez les dates: "04 février 1985" ou "04/02/1985"\n';
      prompt += '- Pour la signature: indiquez "Fait à [ville], le [date]" puis "Signature du demandeur" (pas d\'avocat si c\'est le demandeur qui signe)\n';
      prompt += '- Le document doit être prêt à être signé et déposé au tribunal\n';
      prompt += '- Références juridiques précises (articles du Code civil, Code de procédure civile, etc.)\n';
      prompt += '- NE RÉPÉTEZ PAS les sections - une seule fois chaque partie\n';
      prompt += '- NE GÉNÉREZ PAS plusieurs blocs de signatures - un seul suffit à la fin\n';
      prompt += '- Si le template demande une structure notariale (PAR-DEVANT NOUS, ONT COMPARU, DONT ACTE), respectez-la EXACTEMENT\n';
      
      prompt += '\n=== EXEMPLE DE REMPLACEMENT ===\n';
      prompt += '❌ INCORRECT: "Monsieur [NOM] [PRENOM], né le [DATE_NAISSANCE]"\n';
      prompt += '✅ CORRECT: "Monsieur Habib Belkacemi, né le 04/02/1985"\n\n';
      prompt += '❌ INCORRECT: "Wilaya de 06"\n';
      prompt += '✅ CORRECT: "Wilaya de Béjaïa" ou "Tribunal de Béjaïa"\n\n';
      prompt += '❌ INCORRECT: Répéter 3 fois "Signature du vendeur"\n';
      prompt += '✅ CORRECT: Une seule section de signatures à la fin\n';

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

      // 8. POST-TRAITEMENT: Remplacer les placeholders restants avec les vraies données
      if (Object.keys(structuredFormData).length > 0) {
        finalDocument = replacePlaceholdersWithFormData(finalDocument, structuredFormData);
      }

      // 8.5. POST-TRAITEMENT: Convertir les codes wilaya en noms
      if (selectedWilaya) {
        const wilayaData = wilayaTemplateService.getWilayaVariables(selectedWilaya);
        if (wilayaData) {
          // Remplacer "Wilaya de XX" par "Wilaya de [Nom]"
          finalDocument = finalDocument.replace(/Wilaya de \d{2}/g, `Wilaya de ${wilayaData.wilaya_name_fr}`);
          // Remplacer "Fait à XX" par "Fait à [Nom]"
          finalDocument = finalDocument.replace(/Fait à \d{2}/g, `Fait à ${wilayaData.wilaya_name_fr}`);
          // Remplacer juste le code seul suivi d'une virgule
          finalDocument = finalDocument.replace(new RegExp(`^${selectedWilaya},`, 'gm'), `${wilayaData.wilaya_name_fr},`);
        }
      }

      // 8.6. POST-TRAITEMENT: Supprimer les sections vides génériques
      // Pattern: "Monsieur/Madame, né(e) le à, de nationalité..."
      finalDocument = finalDocument.replace(/Monsieur\/Madame[^.]*?profession\.\s*/gi, '');
      
      // Supprimer les lignes avec des champs vides consécutifs
      finalDocument = finalDocument.replace(/né\(e\)\s+le\s+à/gi, '');
      finalDocument = finalDocument.replace(/délivrée?\s+le\s+à/gi, '');
      finalDocument = finalDocument.replace(/,\s+profession\./gi, '');
      
      // Supprimer les montants vides
      finalDocument = finalDocument.replace(/Dinars Algériens \(\)\s*/gi, '');
      finalDocument = finalDocument.replace(/\(\s*\)\s*Dinars Algériens/gi, '');
      
      // 8.7. POST-TRAITEMENT: Détecter et supprimer les répétitions de documents
      // Si on trouve 2 fois "PAR-DEVANT NOUS" ou "ACTE DE VENTE", c'est une répétition
      const parDevantCount = (finalDocument.match(/PAR-DEVANT NOUS/gi) || []).length;
      if (parDevantCount > 1) {
        console.warn('🚨 Répétition détectée: plusieurs documents générés');
        // Garder seulement la première occurrence (du début jusqu'à la première signature)
        const firstSignatureIndex = finalDocument.indexOf('Signature du vendeur');
        if (firstSignatureIndex > 0) {
          // Trouver la fin du premier document (avant le deuxième "PAR-DEVANT NOUS")
          const secondParDevantIndex = finalDocument.indexOf('PAR-DEVANT NOUS', finalDocument.indexOf('PAR-DEVANT NOUS') + 1);
          if (secondParDevantIndex > 0) {
            finalDocument = finalDocument.substring(0, secondParDevantIndex);
          }
        }
      }

      // 9. GÉNÉRER LA SIGNATURE PROFESSIONNELLE
      // Convertir le code wilaya en nom
      let lieu = 'Alger'; // Fallback
      if (selectedWilaya) {
        const wilayaData = wilayaTemplateService.getWilayaVariables(selectedWilaya);
        lieu = wilayaData?.wilaya_name_fr || selectedWilaya;
      } else if (userProfile.professionalInfo?.wilayaExercice) {
        lieu = userProfile.professionalInfo.wilayaExercice;
      } else if (userProfile.professionalInfo?.cabinetAddress) {
        lieu = userProfile.professionalInfo.cabinetAddress.split(',').pop()?.trim() || 'Alger';
      }
      
      const piecesJointes = documentSignatureService.generateStandardPiecesJointes(
        selectedTemplateId,
        language
      );
      
      const signatureBlock = documentSignatureService.generateSignatureBlock({
        professional: userProfile,
        date: new Date(),
        lieu: lieu,
        language: language,
        includePiecesJointes: true,
        piecesJointes: piecesJointes
      });
      
      finalDocument = finalDocument + '\n\n' + signatureBlock;

      setOriginalDoc(finalDocument);
      setOriginalDocLang(language);
      setGeneratedDoc(finalDocument);
      setIsDocTranslated(false);

      // Auto-save version
      const docId = `${selectedTemplateId}_${userId}`;
      setCurrentDocumentId(docId);
      documentVersionService.saveVersion({
        userId,
        documentId: docId,
        documentTitle: language === 'ar' ? (selectedTemplate.name_ar || selectedTemplate.name) : selectedTemplate.name,
        templateId: selectedTemplateId,
        content: finalDocument,
        language,
        changeSummary: language === 'ar' ? 'توليد تلقائي' : 'Génération automatique',
      });
      
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

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50 dark:bg-slate-950 overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>

      {/* ── LEFT PANEL ── */}
      <div className={`w-full md:w-[420px] flex flex-col h-full bg-white dark:bg-slate-900 border-e dark:border-slate-800 overflow-hidden ${mobileTab === 'config' ? 'flex' : 'hidden md:flex'}`}>

        {/* Panel Header */}
        <div className="px-6 pt-6 pb-4 border-b dark:border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-legal-gold/20 flex items-center justify-center">
                <PenTool size={16} className="text-legal-gold" />
              </div>
              <h2 className="text-white font-bold text-lg font-serif">
                {language === 'ar' ? 'رداكتيون' : 'Rédaction'}
              </h2>
              {isTranslating && <Languages size={14} className="animate-pulse text-blue-400" />}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowProfileModal(true)}
                title={language === 'ar' ? 'الملف المهني' : 'Profil professionnel'}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-legal-gold/20 hover:bg-legal-gold/30 text-legal-gold rounded-lg text-xs font-bold transition"
              >
                <User size={13} />
                {language === 'ar' ? 'ملفي' : 'Profil'}
              </button>
              <button
                onClick={() => setShowContribution(true)}
                title={language === 'ar' ? 'مساهمة' : 'Contribuer'}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-1 mt-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const currentIndex = steps.findIndex(s => s.id === currentStep);
              const isActive = step.id === currentStep;
              const isCompleted = currentIndex > index;
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-legal-gold text-white shadow-lg shadow-legal-gold/30'
                        : isCompleted
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {isCompleted ? <CheckCircle size={12} /> : <Icon size={12} />}
                    <span className="hidden sm:inline">{language === 'ar' ? step.label_ar : step.label_fr}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-px ${isCompleted ? 'bg-green-500/40' : 'bg-white/10'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Global progress bar */}
          {(() => {
            const currentIndex = steps.findIndex(s => s.id === currentStep);
            const hasForm = Object.keys(structuredFormData).length > 0;
            const progress = currentIndex === 0 ? (selectedTemplateId ? 25 : 5)
              : currentIndex === 1 ? (selectedWilaya ? 50 : 40)
              : currentIndex === 2 ? 65
              : hasForm ? 100 : 80;
            return (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white/40 text-[10px]">{language === 'ar' ? 'التقدم' : 'Progression'}</span>
                  <span className="text-white/60 text-[10px] font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1">
                  <div className="bg-legal-gold h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">

          {/* STEP 1 — Template */}
          {currentStep === 'template' && (
            <div className="p-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={e => setTemplateSearch(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث في النماذج...' : 'Rechercher un modèle...'}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold/30 outline-none"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Grouped templates */}
              {Object.values(groupedTemplates).map(group => (
                <div key={group.key} className="border dark:border-slate-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleCategory(group.key)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Tag size={12} className="text-legal-gold" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        {language === 'ar' ? group.label_ar : group.label_fr}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                        {group.templates.length}
                      </span>
                    </div>
                    {expandedCategories.has(group.key)
                      ? <ChevronUp size={14} className="text-slate-400" />
                      : <ChevronDown size={14} className="text-slate-400" />}
                  </button>

                  {expandedCategories.has(group.key) && (
                    <div className="divide-y dark:divide-slate-800">
                      {group.templates.map(tpl => {
                        const isSelected = selectedTemplateId === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            onClick={() => { setSelectedTemplateId(tpl.id); setCurrentStep('wilaya'); }}
                            className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all ${
                              isSelected
                                ? 'bg-amber-50 dark:bg-amber-900/10'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                              isSelected ? 'border-legal-gold bg-legal-gold' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && <Check size={9} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold leading-tight ${isSelected ? 'text-legal-gold' : 'text-slate-800 dark:text-slate-200'}`}>
                                {getName(tpl)}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{getDesc(tpl)}</p>
                            </div>
                            {isSelected && <Zap size={13} className="text-legal-gold shrink-0 mt-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {Object.keys(groupedTemplates).length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  {language === 'ar' ? 'لا توجد نتائج' : 'Aucun résultat'}
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Wilaya */}
          {currentStep === 'wilaya' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <MapPin size={16} className="text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {language === 'ar'
                    ? 'اختيار الولاية يضيف تلقائياً معلومات المحكمة والبريد'
                    : 'Sélectionner la wilaya ajoute automatiquement les coordonnées du tribunal'}
                </p>
              </div>
              <WilayaSelector
                language={language}
                selectedWilaya={selectedWilaya}
                onWilayaChange={setSelectedWilaya}
                showDetails={true}
              />
            </div>
          )}

          {/* STEP 3 — Clauses */}
          {currentStep === 'clauses' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                <BookOpen size={16} className="text-purple-500 shrink-0" />
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  {language === 'ar'
                    ? 'البنود الإلزامية محددة مسبقاً. يمكنك إضافة بنود اختيارية.'
                    : 'Les clauses obligatoires sont pré-sélectionnées. Ajoutez des clauses optionnelles.'}
                </p>
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

          {/* STEP 4 — Details */}
          {currentStep === 'details' && (
            <div className="p-4 space-y-4">
              {/* Profil incomplet warning */}
              {!userProfile.professionalInfo && userRole !== UserRole.ETUDIANT && userRole !== UserRole.MAGISTRAT && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                  <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                      {language === 'ar' ? 'الملف المهني غير مكتمل' : 'Profil professionnel incomplet'}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5">
                      {language === 'ar' ? 'أضف معلوماتك لتوقيع الوثائق' : 'Ajoutez vos infos pour signer les documents'}
                    </p>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="mt-2 px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition"
                    >
                      {language === 'ar' ? 'إكمال الملف' : 'Compléter'}
                    </button>
                  </div>
                </div>
              )}

              {/* Auto-fill from profile hint */}
              {userProfile.professionalInfo && Object.keys(structuredFormData).length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                  <Zap size={14} className="text-green-600 shrink-0" />
                  <p className="text-xs text-green-700 dark:text-green-300 flex-1">
                    {language === 'ar'
                      ? 'سيتم ملء معلوماتك المهنية تلقائياً في الوثيقة'
                      : 'Vos informations professionnelles seront auto-remplies dans le document'}
                  </p>
                </div>
              )}

              {/* Formulaire CTA */}
              <div className={`rounded-2xl border-2 p-6 text-center transition-all ${
                Object.keys(structuredFormData).length > 0
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                  : 'border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30'
              }`}>
                {Object.keys(structuredFormData).length > 0 ? (
                  <>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                    <p className="font-bold text-green-700 dark:text-green-300 mb-1">
                      {language === 'ar' ? 'النموذج مكتمل' : 'Formulaire complété'}
                    </p>
                    {/* Progress bar */}
                    <div className="w-full bg-green-100 dark:bg-green-900/30 rounded-full h-1.5 mb-3">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (Object.keys(structuredFormData).filter(k => structuredFormData[k]).length / Math.max(1, Object.keys(structuredFormData).length)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 mb-4">
                      {Object.keys(structuredFormData).filter(k => structuredFormData[k]).length} / {Object.keys(structuredFormData).length} {language === 'ar' ? 'حقل مملوء' : 'champs renseignés'}
                    </p>
                    <button
                      onClick={() => setShowFormModal(true)}
                      className="px-5 py-2 border-2 border-green-400 text-green-700 dark:text-green-300 rounded-xl text-sm font-bold hover:bg-green-100 transition"
                    >
                      {language === 'ar' ? 'تعديل البيانات' : 'Modifier les données'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Edit3 size={24} className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'ar' ? 'أدخل بيانات الوثيقة' : 'Saisir les données du document'}
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      {language === 'ar'
                        ? 'معلومات الأطراف، التواريخ، المبالغ...'
                        : 'Parties, dates, montants, références...'}
                    </p>
                    <button
                      onClick={() => setShowFormModal(true)}
                      className="px-6 py-3 bg-legal-gold text-white rounded-xl font-bold hover:bg-legal-gold/90 transition shadow-lg shadow-legal-gold/20"
                    >
                      {language === 'ar' ? 'فتح النموذج' : 'Ouvrir le formulaire'}
                    </button>
                  </>
                )}
              </div>

              {/* Selected template recap */}
              {selectedTemplate && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700 space-y-2">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{language === 'ar' ? 'ملخص الوثيقة' : 'Récapitulatif'}</p>
                  <div className="flex items-center gap-2">
                    <FileText size={13} className="text-legal-gold shrink-0" />
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{getName(selectedTemplate)}</p>
                  </div>
                  {selectedWilaya && (
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-blue-500 shrink-0" />
                      <p className="text-xs text-slate-500">Wilaya {selectedWilaya}</p>
                    </div>
                  )}
                  {selectedClauses.length > 0 && (
                    <div className="flex items-center gap-2">
                      <BookOpen size={13} className="text-purple-500 shrink-0" />
                      <p className="text-xs text-slate-500">{selectedClauses.length} {language === 'ar' ? 'بند' : 'clause(s)'}</p>
                    </div>
                  )}
                  {userProfile.professionalInfo && (
                    <div className="flex items-center gap-2">
                      <User size={13} className="text-green-500 shrink-0" />
                      <p className="text-xs text-slate-500">
                        {userProfile.firstName} {userProfile.lastName}
                        {userProfile.professionalInfo.barreauInscription && ` — ${userProfile.professionalInfo.barreauInscription}`}
                        {userProfile.professionalInfo.chambreNotariale && ` — ${userProfile.professionalInfo.chambreNotariale}`}
                        {userProfile.professionalInfo.chambreHuissiers && ` — ${userProfile.professionalInfo.chambreHuissiers}`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex gap-2">
            {currentStep !== 'template' && (
              <button
                onClick={() => {
                  const idx = steps.findIndex(s => s.id === currentStep);
                  if (idx > 0) setCurrentStep(steps[idx - 1].id);
                }}
                className="px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:border-slate-300 transition"
              >
                {language === 'ar' ? '→' : '←'}
              </button>
            )}
            {currentStep !== 'details' ? (
              <button
                onClick={() => {
                  const idx = steps.findIndex(s => s.id === currentStep);
                  if (idx < steps.length - 1) setCurrentStep(steps[idx + 1].id);
                }}
                className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                {language === 'ar' ? 'السابق' : 'Suivant'}
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !canProceed()}
                className="flex-1 py-3 bg-legal-gold text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-legal-gold/90 transition shadow-lg shadow-legal-gold/20"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {language === 'ar' ? 'جاري التوليد...' : 'Génération en cours...'}
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    {language === 'ar' ? 'توليد الوثيقة' : 'Générer le document'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Preview ── */}
      <div className={`flex-1 flex h-full overflow-hidden bg-slate-100 dark:bg-slate-950 ${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
        {/* Document area */}
        <div className="flex-1 overflow-y-auto">
        {generatedDoc ? (
          <div className="max-w-4xl mx-auto w-full p-4 md:p-8 space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 px-4 py-2 shadow-sm">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setIsEditing(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${!isEditing ? 'bg-white dark:bg-slate-700 shadow text-legal-gold' : 'text-slate-500'}`}
                >
                  <Eye size={13} />
                  {language === 'ar' ? 'معاينة' : 'Aperçu'}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${isEditing ? 'bg-white dark:bg-slate-700 shadow text-legal-gold' : 'text-slate-500'}`}
                >
                  <Edit3 size={13} />
                  {language === 'ar' ? 'تحرير' : 'Éditer'}
                </button>
              </div>
              {isEditing && autoSaveStatus !== 'idle' && (
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
                  autoSaveStatus === 'saving'
                    ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-green-600 bg-green-50 dark:bg-green-900/20'
                }`}>
                  {autoSaveStatus === 'saving' ? (
                    <><div className="w-2.5 h-2.5 border border-amber-500 border-t-transparent rounded-full animate-spin" />{language === 'ar' ? 'جاري الحفظ...' : 'Sauvegarde...'}</>
                  ) : (
                    <><CheckCircle size={11} />{language === 'ar' ? 'محفوظ' : 'Sauvegardé'}</>
                  )}
                </span>
              )}
              <div className="flex items-center gap-2">
                {isDocTranslated && (
                  <span className="flex items-center gap-1 text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg text-xs font-bold">
                    <Languages size={11} />
                    {language === 'ar' ? 'مترجم' : 'Traduit'}
                  </span>
                )}
                {/* Retranslate button — shown when doc language differs from current UI language */}
                {originalDoc && originalDocLang !== language && (
                  <button
                    onClick={handleRetranslate}
                    disabled={isTranslating}
                    title={language === 'ar' ? 'إعادة الترجمة' : 'Retraduire'}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isTranslating ? 'animate-spin' : ''} />
                    {isTranslating
                      ? (language === 'ar' ? 'جاري...' : 'En cours...')
                      : (language === 'ar' ? 'ترجمة' : 'Traduire')}
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 transition"
                >
                  <Printer size={14} />
                  {language === 'ar' ? 'طباعة' : 'Imprimer'}
                </button>
                <button
                  onClick={() => setShowVersionHistory(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    showVersionHistory
                      ? 'bg-legal-blue text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                  title={language === 'ar' ? 'سجل النسخ' : 'Historique des versions'}
                >
                  <History size={14} />
                  {language === 'ar' ? 'النسخ' : 'Versions'}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedDoc)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 transition"
                >
                  <Download size={14} />
                  {language === 'ar' ? 'نسخ' : 'Copier'}
                </button>
                <button
                  onClick={() => pdfExportService.exportDocument({
                    title: language === 'ar' ? (selectedTemplate?.name_ar || selectedTemplate?.name || 'Document') : (selectedTemplate?.name || 'Document'),
                    content: generatedDoc,
                    language,
                    wilaya: selectedWilaya || undefined,
                  })}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
                >
                  <FileText size={14} />
                  {language === 'ar' ? 'PDF' : 'PDF'}
                </button>
                <button
                  onClick={() => setShowSignatureModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    signatureData
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                  title={language === 'ar' ? 'التوقيع الإلكتروني' : 'Signature électronique'}
                >
                  <PenTool size={14} />
                  {signatureData
                    ? (language === 'ar' ? 'موقّع ✓' : 'Signé ✓')
                    : (language === 'ar' ? 'توقيع' : 'Signer')}
                </button>
              </div>
            </div>

            {/* Document Sheet */}
            <div id="printable-doc" className="bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border dark:border-slate-800 overflow-hidden">
              {/* Document top bar */}
              <div className="flex items-center justify-between px-10 py-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Scale size={18} className="text-legal-gold" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 font-serif">
                    {selectedWilaya ? `Wilaya de ${selectedWilaya}` : 'JuristDZ'}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{new Date().toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
              </div>

              {/* Content */}
              <div className="p-10 md:p-16 min-h-[700px]">
                {isEditing ? (
                  <textarea
                    value={generatedDoc}
                    onChange={(e) => setGeneratedDoc(e.target.value)}
                    className="w-full h-[600px] font-serif text-sm leading-loose outline-none bg-transparent resize-none text-slate-800 dark:text-slate-200"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                ) : (
                  <div
                    className="prose prose-slate dark:prose-invert max-w-none font-serif text-sm leading-loose"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Watermark */}
              <div className="flex items-center justify-center py-4 border-t dark:border-slate-800">
                <span className="text-xs text-slate-300 dark:text-slate-700 font-serif tracking-widest uppercase">
                  JuristDZ — Document généré par IA
                </span>
              </div>

              {/* Signature block */}
              {signatureData && (
                <div className="px-10 pb-8 border-t dark:border-slate-800 pt-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">{language === 'ar' ? 'توقيع:' : 'Signature :'}</p>
                      <img src={signatureData.dataUrl} alt="Signature" className="h-16 object-contain" />
                      <p className="text-xs text-slate-500 mt-1 font-medium">{signatureData.signerName}</p>
                      <p className="text-[10px] text-slate-400">{new Date(signatureData.signedAt).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')}</p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <CheckCircle size={12} className="text-green-600" />
                        <span className="text-[10px] font-bold text-green-700 dark:text-green-400">
                          {language === 'ar' ? 'موقّع إلكترونياً' : 'Signé électroniquement'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-sm w-full text-center space-y-6">
              {/* Illustration */}
              <div className="relative mx-auto w-40 h-40">
                <div className="absolute inset-0 bg-legal-gold/5 rounded-3xl rotate-6"></div>
                <div className="absolute inset-0 bg-legal-gold/10 rounded-3xl -rotate-3"></div>
                <div className="relative bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 h-full flex items-center justify-center shadow-xl">
                  <div className="text-center">
                    <Scale size={40} className="text-legal-gold mx-auto mb-2" />
                    <div className="space-y-1.5 px-4">
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full w-4/5 mx-auto"></div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full w-3/5 mx-auto"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 font-serif mb-2">
                  {language === 'ar' ? 'وثيقتك ستظهر هنا' : 'Votre document apparaîtra ici'}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {language === 'ar'
                    ? 'أكمل الخطوات في اللوحة اليسرى ثم اضغط على "توليد الوثيقة"'
                    : 'Complétez les étapes dans le panneau gauche puis cliquez sur "Générer le document"'}
                </p>
              </div>

              {/* Steps recap */}
              <div className="grid grid-cols-2 gap-3 text-left">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  const currentIdx = steps.findIndex(s => s.id === currentStep);
                  const done = currentIdx > i;
                  const active = currentStep === step.id;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition ${
                        done ? 'border-green-200 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400'
                        : active ? 'border-legal-gold/40 bg-amber-50 dark:bg-amber-900/10 text-legal-gold'
                        : 'border-slate-100 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      {done ? <CheckCircle size={14} className="shrink-0" /> : <Icon size={14} className="shrink-0" />}
                      {language === 'ar' ? step.label_ar : step.label_fr}
                    </div>
                  );
                })}
              </div>

              {/* Profil warning */}
              {!userProfile.professionalInfo && userRole !== UserRole.ETUDIANT && userRole !== UserRole.MAGISTRAT && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700 text-left">
                  <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                      {language === 'ar' ? 'الملف المهني غير مكتمل' : 'Profil professionnel incomplet'}
                    </p>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 underline font-semibold"
                    >
                      {language === 'ar' ? 'إكمال الملف ←' : '→ Compléter mon profil'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>{/* end document area */}

        {/* Version History Panel */}
        {showVersionHistory && currentDocumentId && (
          <DocumentVersionHistory
            userId={userId}
            documentId={currentDocumentId}
            language={language}
            onRestore={(content, version) => {
              setGeneratedDoc(content);
              setOriginalDoc(content);
              setOriginalDocLang(version.language as Language);
              setIsDocTranslated(false);
            }}
            onClose={() => setShowVersionHistory(false)}
          />
        )}

        {/* Signature Modal */}
        {showSignatureModal && (
          <SignatureModal
            language={language}
            documentTitle={selectedTemplate ? (language === 'ar' ? selectedTemplate.name_ar : selectedTemplate.name) : 'Document'}
            signerName={user ? `${user.firstName} ${user.lastName}` : ''}
            onSign={(dataUrl, signedAt) => {
              setSignatureData({ dataUrl, signedAt, signerName: user ? `${user.firstName} ${user.lastName}` : '' });
              setShowSignatureModal(false);
              toast(language === 'ar' ? 'تم التوقيع بنجاح' : 'Document signé avec succès', 'success');
            }}
            onClose={() => setShowSignatureModal(false)}
          />
        )}
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-800 p-2 flex gap-2 z-10">
        <button
          onClick={() => setMobileTab('config')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition ${mobileTab === 'config' ? 'bg-legal-gold text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
        >
          {language === 'ar' ? 'الإعداد' : 'Configuration'}
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition ${mobileTab === 'preview' ? 'bg-legal-gold text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
        >
          {language === 'ar' ? 'الوثيقة' : 'Document'}
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

      {/* Form Modal */}
      {showFormModal && (
        <DynamicLegalForm
          language={language}
          templateId={selectedTemplateId}
          initialData={{ ...getProfileAutoFill(), ...structuredFormData }}
          onSubmit={(data) => {
            setStructuredFormData(data);
            setShowFormModal(false);
          }}
          onClose={() => setShowFormModal(false)}
        />
      )}

      {/* Modal Profil Professionnel */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ProfessionalProfileForm
              user={userProfile}
              language={language}
              onSave={handleSaveProfessionalInfo}
              onClose={() => setShowProfileModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDraftingInterface;
