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
import { AppMode, Language, UserRole, EnhancedUserProfile, ProfessionalInfo } from '../types';
import { 
  FileText, Download, CheckCircle, ChevronRight, PenTool, Eye, 
  Printer, Share2, Check, Edit3, Save, Scale, Languages,
  MapPin, BookOpen, Plus, Layers, User, AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import WilayaSelector from './WilayaSelector';
import ClauseSelector from './ClauseSelector';
import TemplateContribution from './TemplateContribution';
import DynamicLegalForm from './forms/DynamicLegalForm';
import ProfessionalProfileForm from './ProfessionalProfileForm';

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
      case UserRole.AVOCAT: return AVOCAT_TEMPLATES;
      case UserRole.NOTAIRE: return NOTAIRE_TEMPLATES;
      case UserRole.HUISSIER: return HUISSIER_TEMPLATES;
      case UserRole.MAGISTRAT: return MAGISTRAT_TEMPLATES;
      case UserRole.JURISTE_ENTREPRISE: return JURISTE_TEMPLATES;
      case UserRole.ETUDIANT: return ETUDIANT_TEMPLATES;
      case UserRole.ADMIN:
        return [...AVOCAT_TEMPLATES, ...NOTAIRE_TEMPLATES, ...HUISSIER_TEMPLATES, 
                ...MAGISTRAT_TEMPLATES, ...JURISTE_TEMPLATES, ...ETUDIANT_TEMPLATES];
      default: return AVOCAT_TEMPLATES;
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
      // TODO: Sauvegarder dans la base de données
      // await updateUserProfile(userProfile.id, { professionalInfo });
      
      setUserProfile({ ...userProfile, professionalInfo });
      setShowProfileModal(false);
      
      // Message de confirmation
      alert(language === 'ar' ? 
        'تم حفظ معلوماتك المهنية بنجاح' :
        'Vos informations professionnelles ont été enregistrées avec succès'
      );
    } catch (error) {
      console.error('Error saving professional info:', error);
      alert(language === 'ar' ? 
        'حدث خطأ أثناء حفظ المعلومات' :
        'Erreur lors de l\'enregistrement des informations'
      );
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    
    // VÉRIFICATION DU PROFIL PROFESSIONNEL
    if (!userProfile.professionalInfo) {
      alert(language === 'ar' ? 
        'يرجى إكمال معلوماتك المهنية أولاً لإنشاء وثائق قانونية صحيحة' :
        'Veuillez compléter votre profil professionnel avant de générer des documents juridiques'
      );
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
      alert(
        (language === 'ar' ? 'حقول مفقودة: ' : 'Champs manquants: ') + 
        missingFields.join(', ')
      );
      setShowProfileModal(true);
      return;
    }
    
    setMobileTab('preview');
    setIsGenerating(true);

    try {
      let basePrompt = language === 'ar' ? selectedTemplate.prompt_ar : selectedTemplate.prompt;
      let documentContent = '';

      // 1. GÉNÉRER L'EN-TÊTE PROFESSIONNEL COMPLET
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

      // 2. Ajouter les clauses sélectionnées
      if (selectedClauses.length > 0) {
        const clauseTemplate = {
          documentType: selectedTemplateId,
          selectedClauseIds: selectedClauses,
          variables: { ...clauseVariables, ...structuredFormData },
          customClauses: []
        };
        
        const clausesText = clauseService.generateDocumentWithClauses(clauseTemplate, language);
        documentContent += '\n\n' + clausesText;
      }

      // 3. Construire le prompt avec les données structurées
      let prompt = basePrompt;
      
      if (Object.keys(structuredFormData).length > 0) {
        prompt += '\n\n=== INFORMATIONS COMPLÈTES DU FORMULAIRE ===\n';
        prompt += '⚠️ UTILISEZ CES INFORMATIONS EXACTES - NE LAISSEZ AUCUN PLACEHOLDER VIDE\n\n';
        
        // Créer des groupes logiques de données
        const dataGroups: { [key: string]: { [key: string]: any } } = {};
        
        Object.entries(structuredFormData).forEach(([key, value]) => {
          if (value && value !== '') {
            // Extraire le préfixe (demandeur, defendeur, etc.)
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
        
        // Afficher les données par groupe
        Object.entries(dataGroups).forEach(([groupName, fields]) => {
          // Formater le nom du groupe
          const readableGroupName = groupName
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/^./, str => str.toUpperCase());
          
          prompt += `--- ${readableGroupName} ---\n`;
          
          // Construire l'identité complète si on a nom et prénom
          if (fields['Nom'] && fields['Prenom']) {
            prompt += `Identité complète: ${fields['Prenom']} ${fields['Nom']}\n`;
          }
          
          // Afficher tous les champs
          Object.entries(fields).forEach(([fieldName, fieldValue]) => {
            const readableFieldName = fieldName
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
              .trim();
            
            if (readableFieldName && readableFieldName !== 'Nom' && readableFieldName !== 'Prenom') {
              prompt += `${readableFieldName}: ${fieldValue}\n`;
            }
          });
          
          prompt += '\n';
        });
        
        prompt += '\n\n⚠️ INSTRUCTIONS CRITIQUES POUR LA GÉNÉRATION:\n';
        prompt += '1. NE GÉNÉREZ JAMAIS de texte entre crochets [ ] - c\'est INTERDIT\n';
        prompt += '2. Remplacez TOUS les placeholders par les VRAIES valeurs fournies ci-dessus\n';
        prompt += '3. Utilisez les noms COMPLETS: "Prénom Nom" (ex: "Djillali Ahmed" pas "[NOM] [PRENOM]")\n';
        prompt += '4. Pour les dates: format "JJ/MM/AAAA" (ex: "21/06/1990" pas "[DATE_NAISSANCE]")\n';
        prompt += '5. Pour les CIN: numéro exact (ex: "65312321" pas "[CIN]")\n';
        prompt += '6. Pour les adresses: adresse complète (ex: "Tamourassen" pas "[ADRESSE]")\n';
        prompt += '7. Pour les professions: profession exacte (ex: "taxieur" pas "[PROFESSION]")\n';
        prompt += '8. VÉRIFIEZ le genre: si le prénom est féminin (Fatima, Khadija), utilisez "Madame", "sa fille", "elle"\n';
        prompt += '9. VÉRIFIEZ les âges: calculez correctement l\'âge à partir de la date de naissance\n';
        prompt += '10. Si une info manque, utilisez une formulation générique SANS crochets\n';
        prompt += '11. Le document DOIT être prêt à signer - ZÉRO placeholder autorisé\n';
        prompt += '12. RELISEZ votre document: si vous voyez [ ], c\'est une ERREUR GRAVE\n';
        
        prompt += '\n=== EXEMPLES DE REMPLACEMENT CORRECT ===\n';
        prompt += '❌ INCORRECT: "Monsieur [NOM] [PRENOM], né(e) le [DATE_NAISSANCE]"\n';
        prompt += '✅ CORRECT: "Monsieur Djillali Ahmed, né le 21/06/1990"\n\n';
        prompt += '❌ INCORRECT: "son fils, Fatima" (incohérence de genre)\n';
        prompt += '✅ CORRECT: "sa fille, Fatima" (Fatima est un prénom féminin)\n\n';
        prompt += '❌ INCORRECT: "âgée de 5 ans, née le 05/12/2001" (incohérence d\'âge)\n';
        prompt += '✅ CORRECT: "âgée de 23 ans, née le 05/12/2001" (en 2026)\n\n';
        prompt += '❌ INCORRECT: "[noms enfants à compléter]"\n';
        prompt += '✅ CORRECT: "Fatima" (utilisez le vrai nom fourni)\n\n';
        prompt += '❌ INCORRECT: "Monsieur/Madame" (indécis)\n';
        prompt += '✅ CORRECT: "Monsieur" ou "Madame" (choisissez selon le prénom)\n\n';
        prompt += '\n🚨 RÈGLE D\'OR: AUCUN CROCHET [ ] N\'EST AUTORISÉ DANS LE DOCUMENT FINAL!\n';
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
        prompt += 'Puis identifiez les parties avec leurs informations COMPLÈTES.\n\n';
      } else {
        prompt += 'Générez un document juridique COMPLET.\n';
        prompt += 'Commencez par le titre du document (ex: "ACTE DE VENTE DE FONDS DE COMMERCE")\n';
        prompt += 'Puis identifiez les parties avec leurs informations COMPLÈTES.\n\n';
      }
      
      prompt += 'Rédigez un document juridique PROFESSIONNEL en respectant:\n';
      prompt += '1. La forme légale algérienne\n';
      prompt += '2. La structure du document (voir ci-dessous)\n';
      prompt += '3. L\'utilisation de TOUTES les informations du formulaire\n';
      prompt += '4. Un langage juridique formel et précis\n';
      prompt += '5. NE LAISSEZ AUCUN PLACEHOLDER - tout doit être rempli\n';
      
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
      
      prompt += '\n=== EXEMPLE DE REMPLACEMENT ===\n';
      prompt += '❌ INCORRECT: "Monsieur [NOM] [PRENOM], né le [DATE_NAISSANCE]"\n';
      prompt += '✅ CORRECT: "Monsieur Habib Belkacemi, né le 04/02/1985"\n\n';
      prompt += '❌ INCORRECT: "Wilaya de 06"\n';
      prompt += '✅ CORRECT: "Wilaya de Béjaïa" ou "Tribunal de Béjaïa"\n';

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
            <div className="flex gap-2">
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2 bg-legal-gold text-white rounded-lg hover:opacity-90"
                title={language === 'ar' ? 'المعلومات المهنية' : 'Profil Professionnel'}
              >
                <User size={16} />
              </button>
              <button
                onClick={() => setShowContribution(true)}
                className="p-2 bg-legal-blue text-white rounded-lg hover:opacity-90"
                title={language === 'ar' ? 'مساهمة بنموذج' : 'Contribuer un template'}
              >
                <Plus size={16} />
              </button>
            </div>
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

          {/* Step 4: Details - FORMULAIRE PROFESSIONNEL */}
          {currentStep === 'details' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <h3 className="text-lg font-bold mb-4">
                  {language === 'ar' ? 'معلومات الوثيقة' : 'Informations du document'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  {language === 'ar' 
                    ? 'انقر على الزر أدناه لفتح نموذج الإدخال'
                    : 'Cliquez sur le bouton ci-dessous pour ouvrir le formulaire de saisie'}
                </p>
                <button
                  onClick={() => setShowFormModal(true)}
                  className="px-8 py-4 bg-legal-gold text-white rounded-xl font-bold text-lg hover:bg-legal-gold/90 transition-colors shadow-lg"
                >
                  {language === 'ar' ? 'فتح نموذج الإدخال' : 'Ouvrir le formulaire'}
                </button>
                
                {Object.keys(structuredFormData).length > 0 && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                      <Check size={20} />
                      <span className="font-semibold">
                        {language === 'ar' ? 'تم ملء النموذج بنجاح' : 'Formulaire rempli avec succès'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
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

      {/* Form Modal */}
      {showFormModal && (
        <DynamicLegalForm
          language={language}
          templateId={selectedTemplateId}
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
