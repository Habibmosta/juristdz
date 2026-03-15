import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Sender, AppMode, Language } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { Send, Bot, User, Languages, Share2, Check, History, ChevronUp, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UI_TRANSLATIONS } from '../constants';
import { useAppToast } from '../src/contexts/ToastContext';

interface ChatInterfaceProps {
  language: Language;
  userId: string;
}

interface AutoTranslatableMessage extends Message {
  originalText: string;
  originalLang: Language;
  translatedText?: string;
  isTranslated: boolean;
  searchTopic?: string; // Nouveau: sujet de recherche extrait
}

interface ConversationThread {
  id: string;
  topic: string;
  messages: AutoTranslatableMessage[];
  timestamp: Date;
}

const ImprovedChatInterface: React.FC<ChatInterfaceProps> = ({ language, userId }) => {
  const t = UI_TRANSLATIONS[language];
  const { toast } = useAppToast();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AutoTranslatableMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationThreads, setConversationThreads] = useState<ConversationThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(language);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const componentId = `chat-${userId}`;

  const extractSearchTopic = (userMessage: string): string => {
    // Nettoyer le message
    const cleaned = userMessage.trim().toLowerCase();
    
    console.log(`🔍 Extraction sujet pour: "${cleaned.substring(0, 100)}..."`);
    
    // Mots-clés juridiques algériens pour identifier le sujet (français + arabe)
    const legalTopics = {
      // === FRANÇAIS ===
      'registre de commerce': 'Registre de Commerce',
      'commerce': 'Droit Commercial',
      'société': 'Droit des Sociétés',
      'contrat': 'Droit des Contrats',
      'mariage': 'Droit de la Famille - Mariage',
      'divorce': 'Droit de la Famille - Divorce',
      'famille': 'Droit de la Famille',
      'héritage': 'Droit des Successions',
      'succession': 'Droit des Successions',
      'propriété': 'Droit de la Propriété',
      'bail': 'Droit Immobilier',
      'travail': 'Droit du Travail',
      'employé': 'Droit du Travail',
      'salaire': 'Droit du Travail',
      'pénal': 'Droit Pénal',
      'crime': 'Droit Pénal',
      'tribunal': 'Procédure Judiciaire',
      'juge': 'Procédure Judiciaire',
      'avocat': 'Profession d\'Avocat',
      'notaire': 'Actes Notariés',
      'huissier': 'Exécution des Jugements',
      'constitution': 'Droit Constitutionnel',
      'administrative': 'Droit Administratif',
      'fiscal': 'Droit Fiscal',
      'douane': 'Droit Douanier',
      'droits': 'Droits Fondamentaux',
      'droit': 'Question Juridique',
      'loi': 'Législation',
      'code': 'Code Juridique',
      'juridique': 'Question Juridique',
      'légal': 'Question Légale',
      'procédure': 'Procédure Juridique',
      'algérie': 'Droit Algérien',
      'algérien': 'Droit Algérien',
      'comment': 'Conseil Juridique',
      'puis-je': 'Conseil Juridique',
      'que faire': 'Conseil Juridique',
      'quels sont': 'Information Juridique',
      'quelles sont': 'Information Juridique',
      
      // === ARABE ===
      // Droit de la famille
      'زواج': 'قانون الأسرة - الزواج',
      'طلاق': 'قانون الأسرة - الطلاق',
      'أسرة': 'قانون الأسرة',
      'عائلة': 'قانون الأسرة',
      'ميراث': 'قانون المواريث',
      'وراثة': 'قانون المواريث',
      'حضانة': 'قانون الأسرة - الحضانة',
      'نفقة': 'قانون الأسرة - النفقة',
      
      // Droit commercial
      'تجارة': 'القانون التجاري',
      'تاجر': 'القانون التجاري',
      'سجل تجاري': 'السجل التجاري',
      'شركة': 'قانون الشركات',
      'عقد': 'قانون العقود',
      'بيع': 'قانون البيع',
      'شراء': 'قانون الشراء',
      
      // Droit du travail
      'عمل': 'قانون العمل',
      'عامل': 'قانون العمل',
      'موظف': 'قانون العمل',
      'راتب': 'قانون العمل',
      'أجر': 'قانون العمل',
      'إجازة': 'قانون العمل',
      'تقاعد': 'قانون التقاعد',
      
      // Droit pénal
      'جريمة': 'القانون الجنائي',
      'جنحة': 'القانون الجنائي',
      'مخالفة': 'القانون الجنائي',
      'عقوبة': 'القانون الجنائي',
      'سجن': 'القانون الجنائي',
      'غرامة': 'القانون الجنائي',
      
      // Procédures judiciaires
      'محكمة': 'الإجراءات القضائية',
      'قاضي': 'الإجراءات القضائية',
      'دعوى': 'الإجراءات القضائية',
      'حكم': 'الإجراءات القضائية',
      'استئناف': 'الإجراءات القضائية',
      'تنفيذ': 'تنفيذ الأحكام',
      
      // Professions juridiques
      'محامي': 'مهنة المحاماة',
      'موثق': 'الأعمال التوثيقية',
      'كاتب ضبط': 'الإجراءات القضائية',
      'محضر قضائي': 'تنفيذ الأحكام',
      
      // Droit immobilier
      'عقار': 'القانون العقاري',
      'ملكية': 'قانون الملكية',
      'إيجار': 'قانون الإيجار',
      'كراء': 'قانون الإيجار',
      'بناء': 'قانون البناء',
      'أرض': 'القانون العقاري',
      
      // Droit administratif
      'إدارة': 'القانون الإداري',
      'بلدية': 'القانون الإداري',
      'ولاية': 'القانون الإداري',
      'وزارة': 'القانون الإداري',
      'موظف عمومي': 'قانون الوظيفة العمومية',
      
      // Termes généraux
      'حقوق': 'الحقوق الأساسية',
      'حق': 'سؤال قانوني',
      'قانون': 'سؤال قانوني',
      'قانوني': 'سؤال قانوني',
      'شرعي': 'سؤال قانوني',
      'نظام': 'النظام القانوني',
      'دستور': 'القانون الدستوري',
      'جزائر': 'القانون الجزائري',
      'جزائري': 'القانون الجزائري',
      
      // Questions courantes en arabe
      'كيف': 'استشارة قانونية',
      'ماذا': 'استشارة قانونية',
      'هل يمكن': 'استشارة قانونية',
      'ما هي': 'معلومات قانونية',
      'أريد': 'طلب قانوني'
    };
    
    // Chercher le sujet le plus pertinent
    for (const [keyword, topic] of Object.entries(legalTopics)) {
      if (cleaned.includes(keyword)) {
        console.log(`🔍 Sujet trouvé: "${topic}" (mot-clé: "${keyword}")`);
        return topic;
      }
    }
    
    // Si aucun mot-clé spécifique, extraire les premiers mots significatifs
    const words = cleaned.split(' ').filter(word => 
      word.length > 3 && 
      !['comment', 'quelle', 'quels', 'quelles', 'dans', 'pour', 'avec', 'sans', 'selon', 'vous', 'votre', 'cette', 'cette', 'كيف', 'ماذا', 'هذا', 'هذه', 'التي', 'الذي'].includes(word)
    );
    
    if (words.length > 0) {
      const extractedTopic = words.slice(0, 3).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      console.log(`🔍 Sujet extrait des mots: "${extractedTopic}"`);
      return extractedTopic;
    }
    
    console.log(`🔍 Sujet par défaut: "Question Juridique"`);
    return 'Question Juridique';
  };

  const createNewThread = (userMessage: AutoTranslatableMessage): ConversationThread => {
    const topic = extractSearchTopic(userMessage.text);
    const threadId = `thread-${Date.now()}`;
    
    return {
      id: threadId,
      topic,
      messages: [userMessage],
      timestamp: new Date()
    };
  };

  const addMessageToCurrentThread = (message: AutoTranslatableMessage) => {
    if (currentThreadId) {
      setConversationThreads(prev => 
        prev.map(thread => 
          thread.id === currentThreadId 
            ? { ...thread, messages: [...thread.messages, message] }
            : thread
        )
      );
    }
  };

  const detectLanguage = (text: string): Language => {
    if (!text || typeof text !== 'string') return 'fr';
    
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u200C-\u200F]/g;
    const arabicMatches = text.match(arabicRegex);
    const arabicCount = arabicMatches ? arabicMatches.length : 0;
    
    const latinRegex = /[A-Za-zÀ-ÿ]/g;
    const latinMatches = text.match(latinRegex);
    const latinCount = latinMatches ? latinMatches.length : 0;
    
    return arabicCount > latinCount ? 'ar' : 'fr';
  };

  const cleanUIContent = (text: string): string => {
    if (!text || typeof text !== 'string') return text;
    
    console.log(`🧹 NETTOYAGE RADICAL - Début: "${text.substring(0, 100)}..."`);
    
    // ÉTAPE 0: Si le texte contient trop d'éléments UI, le rejeter complètement
    const uiIndicators = [
      'محامي دي زاد', 'متصلمحامي', 'مكتب المحاماة', 'نظام إدارة قانونية',
      'لوحة التحكم', 'بحث قانوني', 'تحريرPro', 'تحليلملفات', 'ملفاتV2',
      'وثائقإجراءات سريعة', '+ ملف جديد', '+ بحث سريع', 'arوضع آمن',
      'خبرة في القانون الجزائري', 'عرض السجل', 'نسخ رابط',
      'أنتمترجم', 'JuristDZ', '🔄إعادة تعيين', '🧹تنظيف', 'إرسال'
      // SUPPRIMÉ: 'ترجمة الرسائل' - ne pas supprimer le bouton de traduction !
    ];
    
    let uiCount = 0;
    uiIndicators.forEach(indicator => {
      if (text.includes(indicator)) {
        uiCount++;
      }
    });
    
    // Si plus de 3 indicateurs UI, rejeter complètement le texte
    if (uiCount > 3) {
      console.log(`🧹 REJET COMPLET - Trop d'éléments UI détectés: ${uiCount}`);
      return '';
    }
    
    let cleaned = text;
    
    // ÉTAPE 1: Supprimer TOUS les patterns exacts du nouveau rapport utilisateur
    const exactUIPatterns = [
      // NOUVEAU: Patterns du dernier rapport utilisateur
      'محامي دي زادمتصلمحاميمكتب المحاماةمكتب المحاماةنظام إدارة قانونيةلوحة التحكمبحث قانونيتحريرProتحليلملفاتV2وثائقإجراءات سريعة+ ملف جديد+ بحث سريعarوضع آمنجميع البيانات محمية ومشفرة. تحقق دائماً من الجريدة الرسمية.بحث قانونيخبرة في القانون الجزائري🔄إعادة تعيين🧹تنظيفترجمة الرسائلعرض السجلنسخ رابطأنتمترجم',
      
      // Patterns individuels
      'محامي دي زادمتصلمحاميمكتب المحاماةمكتب المحاماةنظام إدارة قانونية',
      'لوحة التحكمبحث قانونيتحريرProتحليلملفاتV2وثائق',
      'إجراءات سريعة+ ملف جديد+ بحث سريعarوضع آمن',
      'جميع البيانات محمية ومشفرة. تحقق دائماً من الجريدة الرسمية.',
      'بحث قانونيخبرة في القانون الجزائري🔄إعادة تعيين🧹تنظيف',
      'عرض السجلنسخ رابطأنتمترجم',
      // SUPPRIMÉ: 'ترجمة الرسائلعرض السجلنسخ رابطأنتمترجم' - ne pas supprimer le bouton de traduction !
      
      // Éléments individuels
      'محامي دي زاد', 'متصلمحامي', 'مكتب المحاماة', 'نظام إدارة قانونية',
      'لوحة التحكم', 'بحث قانوني', 'تحريرPro', 'تحليلملفات', 'ملفاتV2',
      'وثائقإجراءات سريعة', '+ ملف جديد', '+ بحث سريع', 'arوضع آمن',
      'خبرة في القانون الجزائري', 'عرض السجل', 'نسخ رابط',
      'أنتمترجم', '🔄إعادة تعيين', '🧹تنظيف',
      // SUPPRIMÉ: 'ترجمة الرسائل' - ne pas supprimer le bouton de traduction !
      
      // Artifacts techniques
      'JuristDZ', 'AUTO-TRANSLATE', 'Defined', 'процедة', 'إرسال',
      
      // NOUVEAU: Patterns de mélange spécifiques du rapport
      'la الأسرة', 'La الأسرة', 'Le الزواج', 'le الزواج', 'Le الطلاق', 'le الطلاق',
      'du قانون', 'de la الأسرة', 'المادة', 'les الحقوق', 'الحماية', 'ses الوالدين',
      'leur الطفل', 'le الحق', 'la الحضانة', 'La النسب', 'la النسب', 'La الوصاية',
      'la الوصاية', 'un الوالد'
    ];
    
    // Supprimer tous les patterns exacts
    exactUIPatterns.forEach(pattern => {
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(escapedPattern, 'g'), '');
    });
    
    // ÉTAPE 2: Supprimer les mélanges arabe-français spécifiques
    const mixedLanguagePatterns = [
      // Patterns français-arabe mélangés
      /\b[A-Za-zÀ-ÿ]+\s+[\u0600-\u06FF]+/g, // Mot français suivi d'arabe
      /[\u0600-\u06FF]+\s+[A-Za-zÀ-ÿ]+/g, // Mot arabe suivi de français
      /\b[A-Za-zÀ-ÿ]+[\u0600-\u06FF]+/g, // Français collé à l'arabe
      /[\u0600-\u06FF]+[A-Za-zÀ-ÿ]+/g, // Arabe collé au français
      
      // Patterns spécifiques problématiques
      /Pro(?=[\u0600-\u06FF])/g,
      /V2(?=[\u0600-\u06FF])/g,
      /ar(?=[\u0600-\u06FF])/g,
      
      // Émojis et caractères spéciaux
      /🔄|🧹|📋|⚖️|🏛️|📊|📈|💼|🔍|📝|📄|📋|✅|❌|⭐|🌟/g,
      
      // Suppression des doublons de mots
      /(\b\w+\b)(\s+\1\b)+/g,
      
      // Nettoyage des espaces et caractères
      /\s{2,}/g, // Espaces multiples
      /[\r\n\t]+/g, // Sauts de ligne et tabulations
    ];
    
    mixedLanguagePatterns.forEach(pattern => {
      if (pattern.toString().includes('(\\b\\w+\\b)')) {
        // Pattern spécial pour les doublons
        cleaned = cleaned.replace(pattern, '$1');
      } else if (pattern.toString().includes('\\s{2,}')) {
        // Pattern pour les espaces multiples
        cleaned = cleaned.replace(pattern, ' ');
      } else {
        // Autres patterns
        cleaned = cleaned.replace(pattern, '');
      }
    });
    
    // ÉTAPE 3: Vérification de pureté linguistique ULTRA STRICTE
    cleaned = cleaned.trim();
    
    if (cleaned.length === 0) {
      console.log(`🧹 REJET - Texte complètement nettoyé`);
      return '';
    }
    
    const arabicChars = (cleaned.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
    const latinChars = (cleaned.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
    const totalChars = cleaned.replace(/\s/g, '').length;
    
    if (totalChars > 0) {
      const arabicRatio = arabicChars / totalChars;
      const latinRatio = latinChars / totalChars;
      
      console.log(`🧹 Analyse linguistique: Arabic ${Math.round(arabicRatio * 100)}%, Latin ${Math.round(latinRatio * 100)}%`);
      
      // ULTRA STRICT: Si plus de 5% de mélange, rejeter
      if (arabicRatio > 0.05 && latinRatio > 0.05) {
        console.log(`🧹 REJET - Mélange linguistique détecté`);
        return '';
      }
      
      // Si moins de 20 caractères utiles, rejeter
      if (totalChars < 20) {
        console.log(`🧹 REJET - Texte trop court: ${totalChars} caractères`);
        return '';
      }
    }
    
    console.log(`🧹 SUCCÈS - Nettoyage terminé: "${cleaned.substring(0, 50)}..."`);
    return cleaned;
  };

  const getDirectTranslation = async (text: string, fromLang: Language, toLang: Language): Promise<string> => {
    if (!text || typeof text !== 'string') return text;
    if (fromLang === toLang) return text;
    
    console.log(`🔧 TRADUCTION GRATUITE VIA GEMINI: ${fromLang} -> ${toLang}`);
    console.log(`🔧 Texte à traduire: "${text.substring(0, 100)}..."`);
    
    try {
      // Nettoyer le texte avant traduction
      const cleanedText = cleanUIContent(text);
      if (!cleanedText || cleanedText.length < 10) {
        console.log(`🔧 Texte trop court après nettoyage`);
        return text;
      }
      
      // Créer le prompt de traduction pour Gemini
      const targetLanguage = toLang === 'ar' ? 'arabe' : 'français';
      const sourceLanguage = fromLang === 'ar' ? 'arabe' : 'français';
      
      const translationPrompt = `Traduis ce texte du ${sourceLanguage} vers l'${targetLanguage}. Réponds UNIQUEMENT avec la traduction directe, sans explications ni instructions.

${cleanedText}`;

      // Utiliser Gemini pour la traduction
      const response = await sendMessageToGemini(
        translationPrompt,
        [], // Pas d'historique pour la traduction
        AppMode.RESEARCH,
        toLang
      );
      
      let translatedText = response.text.trim();
      
      // NETTOYAGE: Supprimer les instructions qui peuvent apparaître dans la réponse
      const instructionPatterns = [
        // Instructions en français
        /RÈGLES IMPORTANTES:.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
        /- Traduis UNIQUEMENT.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
        /- Garde la même structure.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
        /- Traduis tous les termes.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
        /- Ne mélange JAMAIS.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
        /- Réponds UNIQUEMENT.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
        /TEXTE À TRADUIRE:.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
        
        // Préfixes parasites français
        /^Voici la traduction du texte\s*:\s*/gm,
        /^Voici la traduction\s*:\s*/gm,
        /^Traduction\s*:\s*/gm,
        /^La traduction est\s*:\s*/gm,
        /^Bien sûr\.\s*/gm,
        /^Certainement\.\s*/gm,
        
        // Préfixes parasites arabes
        /^ترجمر.*?(?=\n|$)/gm,
        /^إليك الترجمة\s*:\s*/gm,
        /^الترجمة هي\s*:\s*/gm,
        /^بالطبع\.\s*/gm,
        
        // Instructions génériques
        /^Traduis.*?(?=\n|$)/gm,
        /^RÈGLES.*?(?=\n|$)/gm,
        
        // Nettoyage des phrases d'introduction
        /^(Voici|Here is|إليك|هنا).*?traduction.*?:\s*/gmi
      ];
      
      instructionPatterns.forEach(pattern => {
        translatedText = translatedText.replace(pattern, '');
      });
      
      // Nettoyer les espaces multiples et les sauts de ligne excessifs
      translatedText = translatedText
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\s+|\s+$/g, '')
        .trim();
      
      // Vérifier que la traduction n'est pas vide
      if (!translatedText || translatedText.length < 10) {
        console.log(`🔧 Traduction vide, retour au texte original`);
        return cleanedText;
      }
      
      console.log(`🔧 Traduction réussie: "${translatedText.substring(0, 100)}..."`);
      return translatedText;
      
    } catch (error) {
      console.error(`🔧 Erreur traduction Gemini:`, error);
      // En cas d'erreur, retourner le texte nettoyé
      return cleanUIContent(text);
    }
  };

  const handleAutoTranslation = useCallback(async (newLanguage: Language, messagesToTranslate: AutoTranslatableMessage[]) => {
    if (messagesToTranslate.length === 0) {
      return messagesToTranslate;
    }

    setIsTranslating(true);

    try {
      const translatedMessages = await Promise.all(
        messagesToTranslate.map(async (message) => {
          if (message.originalLang === newLanguage) {
            return {
              ...message,
              text: message.originalText,
              isTranslated: false,
              translatedText: undefined
            };
          }

          try {
            // FIXED: Use getDirectTranslation (Gemini AI) instead of hardcoded autoTranslationService
            const translatedText = await getDirectTranslation(
              message.originalText,
              message.originalLang,
              newLanguage
            );

            const isSuccessfulTranslation = translatedText !== message.originalText && 
                                          translatedText.trim().length > 0;

            return {
              ...message,
              text: isSuccessfulTranslation ? translatedText : message.originalText,
              translatedText: isSuccessfulTranslation ? translatedText : undefined,
              isTranslated: isSuccessfulTranslation
            };
          } catch (error) {
            console.error('Translation failed:', error);
            return {
              ...message,
              text: message.originalText,
              isTranslated: false,
              translatedText: undefined
            };
          }
        })
      );
      
      return translatedMessages;
    } catch (error) {
      console.error('Auto translation batch failed:', error);
      return messagesToTranslate;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const loadConversationThreads = useCallback(async () => {
    try {
      console.log(`📚 CHARGEMENT DES THREADS - Début pour utilisateur: ${userId}`);
      const history = await databaseService.getMessages(userId);
      
      console.log(`📚 Messages trouvés dans l'historique: ${history.length}`);
      
      if (history.length === 0) {
        console.log(`📚 Aucun message dans l'historique`);
        setConversationThreads([]);
        return;
      }
      
      // Grouper les messages par threads basés sur les sujets
      const threads: ConversationThread[] = [];
      let currentThread: ConversationThread | null = null;
      
      // Trier les messages par timestamp
      const sortedHistory = history.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      console.log(`📚 Messages triés: ${sortedHistory.length}`);
      
      sortedHistory.forEach((msg, index) => {
        console.log(`📚 Traitement message ${index + 1}/${sortedHistory.length}: ${msg.sender} - "${msg.text.substring(0, 50)}..."`);
        
        const cleanedText = cleanUIContent(msg.text);
        if (!cleanedText || cleanedText.length < 10) {
          console.log(`📚 Message ignoré (trop court ou contaminé): "${msg.text.substring(0, 30)}..."`);
          return;
        }
        
        const autoTranslatableMsg: AutoTranslatableMessage = {
          ...msg,
          text: cleanedText,
          originalText: cleanedText,
          originalLang: detectLanguage(cleanedText),
          isTranslated: false
        };
        
        // Si c'est un message utilisateur, créer un nouveau thread
        if (msg.sender === Sender.USER) {
          const topic = extractSearchTopic(cleanedText);
          console.log(`📚 Nouveau thread détecté: "${topic}" pour message: "${cleanedText.substring(0, 50)}..."`);
          
          currentThread = {
            id: `thread-${msg.timestamp}-${Date.now()}`,
            topic,
            messages: [autoTranslatableMsg],
            timestamp: new Date(msg.timestamp)
          };
          threads.push(currentThread);
        } else if (currentThread) {
          // Si c'est une réponse bot, l'ajouter au thread actuel
          console.log(`📚 Ajout réponse bot au thread: "${currentThread.topic}"`);
          currentThread.messages.push(autoTranslatableMsg);
        } else {
          // Si pas de thread actuel et que c'est une réponse bot, essayer d'extraire un sujet quand même
          const topic = extractSearchTopic(cleanedText);
          console.log(`📚 Création thread pour réponse bot orpheline avec sujet: "${topic}"`);
          currentThread = {
            id: `thread-bot-${msg.timestamp}-${Date.now()}`,
            topic: topic !== 'Question Juridique' ? topic : 'Réponse Système',
            messages: [autoTranslatableMsg],
            timestamp: new Date(msg.timestamp)
          };
          threads.push(currentThread);
        }
      });
      
      // Trier les threads par timestamp (plus récent en premier)
      threads.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      console.log(`📚 ✅ Threads créés: ${threads.length}`);
      threads.forEach((thread, index) => {
        console.log(`📚 Thread ${index + 1}: "${thread.topic}" (${thread.messages.length} messages)`);
      });
      
      setConversationThreads(threads);
      
    } catch (error) {
      console.error('📚 ❌ Erreur chargement threads:', error);
      setConversationThreads([]);
    }
  }, [userId]);

  const getLocalizedPreview = async (text: string, targetLanguage: Language): Promise<string> => {
    // Si le texte est déjà dans la bonne langue, le retourner
    const textLanguage = detectLanguage(text);
    if (textLanguage === targetLanguage) {
      return text.substring(0, 120) + (text.length > 120 ? '...' : '');
    }
    
    // Si l'interface est en arabe mais le texte est en français
    if (targetLanguage === 'ar' && textLanguage === 'fr') {
      // Créer un aperçu générique en arabe
      if (text.toLowerCase().includes('droit')) {
        return 'سؤال قانوني حول الحقوق والقوانين الجزائرية...';
      }
      if (text.toLowerCase().includes('famille')) {
        return 'استفسار حول قانون الأسرة والأحوال الشخصية...';
      }
      if (text.toLowerCase().includes('travail')) {
        return 'سؤال حول قانون العمل والعلاقات المهنية...';
      }
      return 'محادثة قانونية - اضغط للعرض والترجمة';
    }
    
    // Si l'interface est en français mais le texte est en arabe
    if (targetLanguage === 'fr' && textLanguage === 'ar') {
      return 'Conversation juridique - cliquez pour voir et traduire';
    }
    
    return text.substring(0, 120) + (text.length > 120 ? '...' : '');
  };

  const formatTopicForDisplay = (topic: string, displayLanguage: Language): string => {
    // Si le sujet est déjà dans la bonne langue, le retourner tel quel
    if (displayLanguage === 'ar' && /[\u0600-\u06FF]/.test(topic)) {
      return topic; // Déjà en arabe
    }
    if (displayLanguage === 'fr' && !/[\u0600-\u06FF]/.test(topic)) {
      return topic; // Déjà en français
    }
    
    // Traductions des sujets courants
    const topicTranslations: Record<string, { fr: string; ar: string }> = {
      'Droit de la Famille': { fr: 'Droit de la Famille', ar: 'قانون الأسرة' },
      'Droit de la Famille - Mariage': { fr: 'Droit de la Famille - Mariage', ar: 'قانون الأسرة - الزواج' },
      'Droit de la Famille - Divorce': { fr: 'Droit de la Famille - Divorce', ar: 'قانون الأسرة - الطلاق' },
      'Droit Commercial': { fr: 'Droit Commercial', ar: 'القانون التجاري' },
      'Registre de Commerce': { fr: 'Registre de Commerce', ar: 'السجل التجاري' },
      'Droit des Contrats': { fr: 'Droit des Contrats', ar: 'قانون العقود' },
      'Droit du Travail': { fr: 'Droit du Travail', ar: 'قانون العمل' },
      'Droit Pénal': { fr: 'Droit Pénal', ar: 'القانون الجنائي' },
      'Procédure Judiciaire': { fr: 'Procédure Judiciaire', ar: 'الإجراءات القضائية' },
      'Droits Fondamentaux': { fr: 'Droits Fondamentaux', ar: 'الحقوق الأساسية' },
      'Question Juridique': { fr: 'Question Juridique', ar: 'سؤال قانوني' },
      'Conseil Juridique': { fr: 'Conseil Juridique', ar: 'استشارة قانونية' },
      'Réponse Système': { fr: 'Réponse Système', ar: 'رد النظام' }
    };
    
    // Chercher une traduction
    for (const [key, translations] of Object.entries(topicTranslations)) {
      if (topic === key || topic === translations.fr || topic === translations.ar) {
        return translations[displayLanguage];
      }
    }
    
    // Si pas de traduction trouvée, retourner le sujet original
    return topic;
  };

  const selectThread = (thread: ConversationThread) => {
    console.log(`📖 Selecting thread: ${thread.topic}`);
    setMessages(thread.messages);
    setCurrentThreadId(thread.id);
    setShowHistory(false); // Fermer le panneau des sujets
  };

  const loadMessages = useCallback(async (initialLoad = false) => {
    setIsLoading(true);
    try {
      const history = await databaseService.getMessages(userId);
      
      if (history.length > 0) {
        // NOUVEAU: Supprimer les messages dupliqués de manière ULTRA stricte
        const uniqueMessages = [];
        const seenMessages = new Set();
        const seenContent = new Set();
        
        history.forEach(message => {
          // Nettoyer le message avant de créer la clé
          const cleanedText = cleanUIContent(message.text);
          
          // Si le message est complètement nettoyé (contenu UI), l'ignorer
          if (!cleanedText || cleanedText.length < 10) {
            console.log(`🧹 Message ignoré (contenu UI): "${message.text.substring(0, 50)}..."`);
            return;
          }
          
          // Créer une clé unique basée sur le contenu nettoyé et l'expéditeur
          const messageKey = `${message.sender}-${cleanedText.trim().substring(0, 200)}`;
          
          // Vérifier aussi le contenu exact pour éviter les doublons parfaits
          const contentHash = `${message.sender}-${cleanedText.trim()}`;
          
          if (!seenMessages.has(messageKey) && !seenContent.has(contentHash)) {
            seenMessages.add(messageKey);
            seenContent.add(contentHash);
            
            // Sauvegarder le message avec le texte nettoyé
            uniqueMessages.push({
              ...message,
              text: cleanedText
            });
          } else {
            console.log(`🧹 Message dupliqué ignoré: "${cleanedText.substring(0, 50)}..."`);
          }
        });
        
        // ÉTAPE SUPPLÉMENTAIRE: Supprimer les messages qui se répètent exactement
        const finalMessages = [];
        const exactContent = new Set();
        
        uniqueMessages.forEach(message => {
          const exactKey = `${message.sender}:${message.text.trim()}`;
          if (!exactContent.has(exactKey)) {
            exactContent.add(exactKey);
            finalMessages.push(message);
          } else {
            console.log(`🧹 Doublon exact supprimé: "${message.text.substring(0, 30)}..."`);
          }
        });
        
        console.log(`🧹 Messages avant dédoublonnage: ${history.length}`);
        console.log(`🧹 Messages après premier nettoyage: ${uniqueMessages.length}`);
        console.log(`🧹 Messages après nettoyage final: ${finalMessages.length}`);
        
        const autoTranslatableMessages: AutoTranslatableMessage[] = finalMessages.map(msg => ({
          ...msg,
          originalText: msg.text,
          originalLang: detectLanguage(msg.text),
          isTranslated: false
        }));
        
        // DÉSACTIVÉ: Traduction automatique pour éviter la duplication
        // const translatedMessages = await handleAutoTranslation(language, autoTranslatableMessages);
        setMessages(autoTranslatableMessages);
      } else if (initialLoad) {
        // Ne créer le message de bienvenue que lors du chargement initial
        const currentTranslations = UI_TRANSLATIONS[currentLanguage];
        const welcomeMessage: AutoTranslatableMessage = {
          id: 'welcome',
          text: currentTranslations.chat_welcome,
          sender: Sender.BOT,
          timestamp: new Date(),
          originalText: currentTranslations.chat_welcome,
          originalLang: currentLanguage,
          isTranslated: false
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentLanguage]); // Supprimé language et t.chat_welcome des dépendances

  useEffect(() => {
    // Charger les messages seulement au montage initial du composant
    loadMessages(true);
    loadConversationThreads();
  }, [userId]); // Supprimé loadMessages et loadConversationThreads des dépendances

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentLanguage !== language) {
      console.log(`🔄 Language changed from ${currentLanguage} to ${language} - PRESERVING CURRENT CONVERSATION`);
      
      // NOUVEAU: Préserver la conversation actuelle lors du changement de langue
      // Ne pas recharger les messages, juste mettre à jour la langue courante
      setCurrentLanguage(language);
      
      // Mettre à jour le message de bienvenue s'il n'y a qu'un seul message (le message de bienvenue)
      if (messages.length === 1 && messages[0].id === 'welcome') {
        const newTranslations = UI_TRANSLATIONS[language];
        const updatedWelcomeMessage: AutoTranslatableMessage = {
          id: 'welcome',
          text: newTranslations.chat_welcome,
          sender: Sender.BOT,
          timestamp: new Date(),
          originalText: newTranslations.chat_welcome,
          originalLang: language,
          isTranslated: false
        };
        setMessages([updatedWelcomeMessage]);
      }
      
      // Optionnel: Traduire automatiquement les messages actuels si l'utilisateur le souhaite
      // Cette fonctionnalité est maintenant disponible via le bouton de traduction manuel
    }
  }, [language, messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const detectedLang = detectLanguage(input);
    const userMsg: AutoTranslatableMessage = { 
      id: Date.now().toString(), 
      text: input, 
      sender: Sender.USER, 
      timestamp: new Date(),
      originalText: input,
      originalLang: detectedLang,
      isTranslated: false
    };
    
    // Créer un nouveau thread ou ajouter au thread actuel
    if (!currentThreadId || messages.length === 0) {
      const newThread = createNewThread(userMsg);
      setConversationThreads(prev => [...prev, newThread]);
      setCurrentThreadId(newThread.id);
    } else {
      addMessageToCurrentThread(userMsg);
    }
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    
    await databaseService.saveMessage(userId, userMsg);
    
    try {
      const history = messages.map(m => ({ 
        role: m.sender === Sender.USER ? 'user' : 'model', 
        parts: [{ text: m.originalText }] 
      }));
      
      const response = await sendMessageToGemini(userMsg.originalText, history, AppMode.RESEARCH, language);
      
      const botMsg: AutoTranslatableMessage = { 
        id: (Date.now() + 1).toString(), 
        text: response.text, 
        sender: Sender.BOT, 
        timestamp: new Date(), 
        citations: response.citations,
        originalText: response.text,
        originalLang: language,
        isTranslated: false
      };
      
      // Ajouter la réponse au thread actuel
      addMessageToCurrentThread(botMsg);
      
      setMessages(prev => [...prev, botMsg]);
      await databaseService.saveMessage(userId, botMsg);
      
      // Recharger les threads de conversation après avoir ajouté un nouveau message
      await loadConversationThreads();
    } catch (error) {
      console.error('Failed to get AI response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* RESPONSIVE Header */}
      <div className="bg-white dark:bg-slate-900 border-b px-3 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 font-serif flex items-center gap-2 truncate">
              {t.chat_header}
              {isTranslating && (
                <div className="flex items-center gap-1 text-blue-500">
                  <Languages size={16} className="animate-pulse" />
                  <span className="text-xs hidden sm:inline">
                    {language === 'ar' ? 'ترجمة تلقائية...' : 'Traduction automatique...'}
                  </span>
                </div>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 truncate">{t.chat_subtitle}</p>
          </div>
          
          {/* RESPONSIVE Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Mobile: Compact buttons */}
            <div className="flex sm:hidden items-center gap-1">
              <button 
                onClick={async () => {
                  await databaseService.clearMessages(userId);
                  setMessages([]);
                  await loadMessages();
                }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all"
                title={language === 'ar' ? 'إعادة تعيين' : 'Reset'}
              >
                🔄
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    const { emergencyDatabaseCleaner } = await import('../services/emergencyDatabaseCleaner');
                    const analysis = await emergencyDatabaseCleaner.analyzeContamination(userId);
                    if (analysis.contaminatedMessages > 0) {
                      const result = await emergencyDatabaseCleaner.cleanUserDatabase(userId);
                      await loadMessages();
                      toast(`${result.contaminatedMessages} messages supprimés`, 'success');
                    } else {
                      toast('Aucun message contaminé', 'info');
                    }
                  } catch (error) {
                    toast('Erreur nettoyage', 'error');
                  }
                }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-all"
                title={language === 'ar' ? 'تنظيف' : 'Nettoyer'}
              >
                🗄️
              </button>
              
              <button 
                onClick={async () => await loadConversationThreads()}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-all"
                title={language === 'ar' ? 'إعادة تحميل' : 'Recharger'}
              >
                📚
              </button>
              
              <button 
                onClick={async () => {
                  if (messages.length === 0) return;
                  setIsTranslating(true);
                  try {
                    const translatedMessages = await Promise.all(
                      messages.map(async (message) => {
                        if (message.originalLang === language) {
                          return { ...message, text: message.originalText, isTranslated: false };
                        }
                        try {
                          const translatedText = await getDirectTranslation(message.originalText, message.originalLang, language);
                          return { ...message, text: translatedText, translatedText, isTranslated: true };
                        } catch (error) {
                          return { ...message, text: message.originalText, isTranslated: false };
                        }
                      })
                    );
                    setMessages(translatedMessages);
                  } catch (error) {
                    console.error('Translation error:', error);
                  } finally {
                    setIsTranslating(false);
                  }
                }}
                disabled={isTranslating || messages.length === 0}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50"
                title={language === 'ar' ? 'ترجمة' : 'Traduire'}
              >
                <Languages size={14} className={isTranslating ? 'animate-pulse' : ''} />
              </button>
              
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  showHistory ? 'bg-legal-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={language === 'ar' ? 'المواضيع' : 'Sujets'}
              >
                <History size={14} />
                {showHistory ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
              
              <button 
                onClick={handleCopyLink}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  copied ? 'bg-green-500 text-white' : 'bg-legal-blue text-white hover:opacity-90'
                }`}
                title={copied ? (language === 'ar' ? 'تم النسخ' : 'Copié') : (language === 'ar' ? 'نسخ' : 'Copier')}
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
              </button>
            </div>

            {/* Desktop: Full buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <button 
                onClick={async () => {
                  console.log('🔄 RÉINITIALISATION COMPLÈTE');
                  try {
                    await databaseService.clearMessages(userId);
                    console.log('🔄 Messages supprimés de la base de données');
                  } catch (error) {
                    console.error('🔄 Erreur suppression DB:', error);
                  }
                  setMessages([]);
                  await loadMessages();
                  console.log('🔄 ✅ Réinitialisation complète terminée');
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all"
              >
                🔄
                {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
              </button>
              
              <button 
                onClick={async () => {
                  console.log('🚨 NETTOYAGE DE BASE DE DONNÉES - Début');
                  try {
                    const { emergencyDatabaseCleaner } = await import('../services/emergencyDatabaseCleaner');
                    const analysis = await emergencyDatabaseCleaner.analyzeContamination(userId);
                    console.log(`🚨 Analyse: ${analysis.contaminatedMessages}/${analysis.totalMessages} messages contaminés`);
                    
                    if (analysis.contaminatedMessages > 0) {
                      const result = await emergencyDatabaseCleaner.cleanUserDatabase(userId);
                      console.log(`🚨 Nettoyage terminé: ${result.contaminatedMessages} supprimés, ${result.cleanedMessages} conservés`);
                      await loadMessages();
                      toast(`Nettoyage: ${result.contaminatedMessages} supprimés, ${result.cleanedMessages} conservés`, 'success');
                    } else {
                      console.log('🚨 Aucune contamination détectée');
                      toast('Aucun message contaminé trouvé.', 'info');
                    }
                  } catch (error) {
                    console.error('🚨 Erreur nettoyage DB:', error);
                    toast('Erreur lors du nettoyage de la base de données.', 'error');
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-all"
              >
                🗄️
                {language === 'ar' ? 'تنظيف قاعدة البيانات' : 'Nettoyer DB'}
              </button>
              
              <button 
                onClick={async () => {
                  console.log('🔍 RECHARGEMENT FORCÉ DES THREADS');
                  await loadConversationThreads();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-all"
              >
                📚
                {language === 'ar' ? 'إعادة تحميل المواضيع' : 'Recharger sujets'}
              </button>
              
              <button 
                onClick={async () => {
                  console.log('🔧 TRADUCTION GRATUITE VIA GEMINI - Début');
                  console.log(`🔧 Langue cible: ${language}`);
                  console.log(`🔧 Nombre de messages: ${messages.length}`);
                  
                  if (messages.length === 0) {
                    console.log('🔧 Aucun message à traduire');
                    return;
                  }
                  
                  setIsTranslating(true);
                  
                  try {
                    const translatedMessages = await Promise.all(
                      messages.map(async (message) => {
                        if (message.originalLang === language) {
                          return {
                            ...message,
                            text: message.originalText,
                            isTranslated: false,
                            translatedText: undefined
                          };
                        }

                        try {
                          const translatedText = await getDirectTranslation(message.originalText, message.originalLang, language);
                          console.log(`🔧 Message traduit: "${message.originalText.substring(0, 30)}..." → "${translatedText.substring(0, 30)}..."`);

                          return {
                            ...message,
                            text: translatedText,
                            originalText: message.originalText,
                            originalLang: message.originalLang,
                            translatedText: translatedText,
                            isTranslated: true
                          };
                        } catch (error) {
                          console.error(`🔧 Erreur traduction message ${message.id}:`, error);
                          return {
                            ...message,
                            text: message.originalText,
                            isTranslated: false,
                            translatedText: undefined
                          };
                        }
                      })
                    );
                    
                    setMessages(translatedMessages);
                    console.log('🔧 ✅ Traduction via Gemini terminée');
                    
                  } catch (error) {
                    console.error('🔧 ❌ Erreur traduction globale:', error);
                  } finally {
                    setIsTranslating(false);
                  }
                }}
                disabled={isTranslating || messages.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Languages size={16} className={isTranslating ? 'animate-pulse' : ''} />
                {isTranslating ? (
                  language === 'ar' ? 'جاري الترجمة...' : 'Traduction en cours...'
                ) : (
                  language === 'ar' ? 'ترجمة الرسائل' : 'Traduire les messages'
                )}
              </button>
              
              <button 
                onClick={() => {
                  console.log(`🔍 Topics toggle clicked: ${showHistory} -> ${!showHistory}`);
                  console.log(`🔍 Conversation threads: ${conversationThreads.length}`);
                  setShowHistory(!showHistory);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  showHistory ? 'bg-legal-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <History size={14} />
                {showHistory ? (
                  <>
                    <ChevronUp size={12} />
                    {language === 'ar' ? 'إخفاء المواضيع' : 'Masquer sujets'}
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} />
                    {language === 'ar' ? 'مواضيع البحث' : 'Sujets de recherche'}
                  </>
                )}
              </button>
              
              <button 
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  copied ? 'bg-green-500 text-white' : 'bg-legal-blue text-white hover:opacity-90'
                }`}
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                {copied ? (language === 'ar' ? 'تم النسخ' : 'Copié !') : (language === 'ar' ? 'نسخ رابط' : 'Copier lien')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RESPONSIVE Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
        {showHistory ? (
          // RESPONSIVE History Interface
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center py-3 sm:py-4">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-full text-xs sm:text-sm text-blue-800 dark:text-blue-200 font-medium">
                <History size={16} />
                <span>
                  {language === 'ar' 
                    ? `📚 مواضيع البحث (${conversationThreads.length} موضوع)`
                    : `📚 Sujets de recherche (${conversationThreads.length} sujets)`
                  }
                </span>
              </div>
              
              {/* Debug info - hidden on mobile */}
              <div className="mt-2 text-xs text-slate-500 hidden sm:block">
                {language === 'ar' 
                  ? `الرسائل الحالية: ${messages.length} | المواضيع المحملة: ${conversationThreads.length} | معرف المستخدم: ${userId.substring(0, 8)}...`
                  : `Messages actuels: ${messages.length} | Threads chargés: ${conversationThreads.length} | User ID: ${userId.substring(0, 8)}...`
                }
              </div>
            </div>
            
            {conversationThreads.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <div className="text-slate-500 dark:text-slate-400 space-y-2">
                  <div className="text-base sm:text-lg">
                    {language === 'ar' 
                      ? '🔍 لا توجد مواضيع بحث بعد'
                      : '🔍 Aucun sujet de recherche encore'
                    }
                  </div>
                  <div className="text-sm">
                    {language === 'ar' 
                      ? 'ابدأ محادثة جديدة لإنشاء أول موضوع!'
                      : 'Commencez une nouvelle conversation!'
                    }
                  </div>
                  <div className="text-xs text-slate-400 mt-4">
                    {language === 'ar' 
                      ? `المحادثة الحالية: ${messages.length} رسالة`
                      : `Conversation actuelle: ${messages.length} messages`
                    }
                  </div>
                  
                  {messages.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <button
                        onClick={async () => {
                          console.log('🔄 Création thread à partir conversation actuelle');
                          await loadConversationThreads();
                        }}
                        className="px-3 sm:px-4 py-2 bg-legal-blue text-white rounded-lg text-xs sm:text-sm hover:opacity-90 transition-all"
                      >
                        {language === 'ar' 
                          ? 'إنشاء موضوع من المحادثة'
                          : 'Créer un sujet'
                        }
                      </button>
                      
                      <button
                        onClick={async () => {
                          console.log('🔄 Régénération intelligente des sujets');
                          const userMessages = messages.filter(m => m.sender === Sender.USER);
                          if (userMessages.length > 0) {
                            const firstUserMsg = userMessages[0];
                            const topic = extractSearchTopic(firstUserMsg.text);
                            
                            const newThread: ConversationThread = {
                              id: `thread-manual-${Date.now()}`,
                              topic,
                              messages: messages,
                              timestamp: new Date()
                            };
                            
                            setConversationThreads([newThread]);
                            console.log(`🔄 Thread manuel créé: "${topic}"`);
                          }
                        }}
                        className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg text-xs sm:text-sm hover:opacity-90 transition-all"
                      >
                        {language === 'ar' 
                          ? 'تحليل ذكي للموضوع'
                          : 'Analyse intelligente'
                        }
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {messages.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <button
                      onClick={() => setShowHistory(false)}
                      className="w-full bg-legal-gold text-white p-3 sm:p-4 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <ChevronDown size={16} className="rotate-90" />
                      {language === 'ar' 
                        ? 'العودة إلى المحادثة الحالية'
                        : 'Retour à la conversation actuelle'
                      }
                    </button>
                  </div>
                )}
                
                <div className="grid gap-2 sm:gap-3">
                {conversationThreads.map((thread) => (
                  <div 
                    key={thread.id}
                    onClick={() => selectThread(thread)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-legal-gold rounded-full flex-shrink-0"></div>
                          <h3 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 truncate">
                            {formatTopicForDisplay(thread.topic, language)}
                          </h3>
                        </div>
                        
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {thread.messages.length > 0 && (
                            <div className="line-clamp-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                              {(() => {
                                const messageText = thread.messages[0].text;
                                const messageLanguage = detectLanguage(messageText);
                                
                                if (messageLanguage === language) {
                                  return messageText.substring(0, 100) + (messageText.length > 100 ? '...' : '');
                                }
                                
                                if (language === 'ar' && messageLanguage === 'fr') {
                                  if (messageText.toLowerCase().includes('droit')) {
                                    return 'سؤال قانوني حول الحقوق والقوانين الجزائرية...';
                                  }
                                  if (messageText.toLowerCase().includes('famille')) {
                                    return 'استفسار حول قانون الأسرة والأحوال الشخصية...';
                                  }
                                  if (messageText.toLowerCase().includes('travail')) {
                                    return 'سؤال حول قانون العمل والعلاقات المهنية...';
                                  }
                                  return 'محادثة قانونية - اضغط للعرض والترجمة';
                                }
                                
                                if (language === 'fr' && messageLanguage === 'ar') {
                                  return 'Conversation juridique - cliquez pour voir et traduire';
                                }
                                
                                return messageText.substring(0, 100) + (messageText.length > 100 ? '...' : '');
                              })()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            💬 {thread.messages.length} {language === 'ar' ? 'رسالة' : 'messages'}
                          </span>
                          <span className="hidden sm:inline">
                            {new Date(thread.timestamp).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-legal-blue rounded-full flex items-center justify-center">
                          <ChevronDown size={12} sm:size={14} className="text-white rotate-[-90deg]" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        ) : (
          // RESPONSIVE Messages Interface
          <>
            {messages.length > 5 && (
              <div className="text-center py-3 sm:py-4">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-full text-xs sm:text-sm text-green-800 dark:text-green-200 font-medium">
                  <History size={16} />
                  <span>
                    {language === 'ar' 
                      ? `✅ المحادثة الحالية (${messages.length} رسالة)`
                      : `✅ Conversation actuelle (${messages.length} messages)`
                    }
                  </span>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-2 sm:gap-4 ${message.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-3xl ${message.sender === Sender.USER ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-center gap-2 mb-2 ${message.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-1.5 sm:p-2 rounded-full ${message.sender === Sender.USER ? 'bg-legal-blue' : 'bg-legal-gold'}`}>
                      {message.sender === Sender.USER ? (
                        <User size={16} className="text-white" />
                      ) : (
                        <Bot size={16} className="text-white" />
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {message.sender === Sender.USER ? (language === 'ar' ? 'أنت' : 'Vous') : 'JuristDZ'}
                    </span>
                    {message.isTranslated && (
                      <div className="flex items-center gap-1 text-blue-500">
                        <Languages size={12} />
                        <span className="text-[10px] hidden sm:inline">
                          {language === 'ar' ? 'مترجم' : 'Traduit'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className={`p-3 sm:p-4 rounded-2xl shadow-sm ${
                      message.sender === Sender.USER 
                        ? 'bg-legal-blue text-white ml-4 sm:ml-8' 
                        : 'bg-white dark:bg-slate-800 border mr-4 sm:mr-8'
                    }`} 
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    <div className="prose prose-sm max-w-none text-sm sm:text-base">
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                    
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold mb-2 text-slate-500">Sources :</p>
                        <div className="space-y-1">
                          {message.citations.map((citation, idx) => (
                            <a 
                              key={idx} 
                              href={citation.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="block text-xs text-blue-600 hover:underline truncate"
                            >
                              {citation.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border mr-4 sm:mr-8">
              <div className="w-2 h-2 bg-legal-gold rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-legal-gold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-legal-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-xs text-slate-500 ml-2">
                {language === 'ar' ? 'يكتب...' : 'Rédaction...'}
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* RESPONSIVE Input Area */}
      <div className="bg-white dark:bg-slate-900 border-t p-3 sm:p-6">
        <div className="flex gap-2 sm:gap-4 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={language === 'ar' ? 'اطرح سؤالاً قانونياً...' : 'Posez votre question juridique...'}
            className="flex-1 p-3 sm:p-4 border rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-legal-gold dark:bg-slate-800 dark:border-slate-700 text-sm sm:text-base"
            disabled={isLoading}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 sm:px-6 py-3 sm:py-4 bg-legal-blue text-white rounded-xl sm:rounded-2xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={18} />
            <span className="hidden sm:inline">
              {language === 'ar' ? 'إرسال' : 'Envoyer'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImprovedChatInterface;