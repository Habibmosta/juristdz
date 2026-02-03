import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Sender, AppMode, Language } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { Send, Bot, User, Languages, Share2, Check, History, ChevronUp, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UI_TRANSLATIONS } from '../constants';

interface ChatInterfaceProps {
  language: Language;
  userId: string;
}

interface AutoTranslatableMessage extends Message {
  originalText: string;
  originalLang: Language;
  translatedText?: string;
  isTranslated: boolean;
}

const ImprovedChatInterface: React.FC<ChatInterfaceProps> = ({ language, userId }) => {
  const t = UI_TRANSLATIONS[language];
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AutoTranslatableMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(language);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const componentId = `chat-${userId}`;

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

  const loadMessages = useCallback(async () => {
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
      } else {
        const welcomeMessage: AutoTranslatableMessage = {
          id: 'welcome',
          text: t.chat_welcome,
          sender: Sender.BOT,
          timestamp: new Date(),
          originalText: t.chat_welcome,
          originalLang: language,
          isTranslated: false
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, language, t.chat_welcome]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentLanguage !== language) {
      console.log(`🔄 Language changed from ${currentLanguage} to ${language} - AUTOMATIC TRANSLATION DISABLED`);
      
      // DÉSACTIVÉ: Traduction automatique pour éviter la duplication
      // L'utilisateur doit maintenant cliquer sur le bouton de traduction manuellement
      
      setCurrentLanguage(language);
    }
  }, [language]);

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
      
      setMessages(prev => [...prev, botMsg]);
      await databaseService.saveMessage(userId, botMsg);
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
      <div className="bg-white dark:bg-slate-900 border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-serif flex items-center gap-2">
            {t.chat_header}
            {isTranslating && (
              <div className="flex items-center gap-1 text-blue-500">
                <Languages size={16} className="animate-pulse" />
                <span className="text-xs">
                  {language === 'ar' ? 'ترجمة تلقائية...' : 'Traduction automatique...'}
                </span>
              </div>
            )}
          </h2>
          <p className="text-sm text-slate-500">{t.chat_subtitle}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Bouton de réinitialisation complète */}
          <button 
            onClick={async () => {
              console.log('🔄 RÉINITIALISATION COMPLÈTE');
              
              // Supprimer tous les messages de la base de données
              try {
                await databaseService.clearMessages(userId);
                console.log('🔄 Messages supprimés de la base de données');
              } catch (error) {
                console.error('🔄 Erreur suppression DB:', error);
              }
              
              // Réinitialiser l'état local
              setMessages([]);
              
              // Recharger les messages (qui seront vides)
              await loadMessages();
              
              console.log('🔄 ✅ Réinitialisation complète terminée');
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition-all"
          >
            🔄
            {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
          </button>
          
          {/* Bouton de nettoyage de base de données */}
          <button 
            onClick={async () => {
              console.log('🚨 NETTOYAGE DE BASE DE DONNÉES - Début');
              
              try {
                // Import dynamique du service de nettoyage
                const { emergencyDatabaseCleaner } = await import('../services/emergencyDatabaseCleaner');
                
                // Analyser d'abord la contamination
                const analysis = await emergencyDatabaseCleaner.analyzeContamination(userId);
                console.log(`🚨 Analyse: ${analysis.contaminatedMessages}/${analysis.totalMessages} messages contaminés`);
                
                if (analysis.contaminatedMessages > 0) {
                  // Nettoyer la base de données
                  const result = await emergencyDatabaseCleaner.cleanUserDatabase(userId);
                  console.log(`🚨 Nettoyage terminé: ${result.contaminatedMessages} supprimés, ${result.cleanedMessages} conservés`);
                  
                  // Recharger les messages
                  await loadMessages();
                  
                  alert(`Nettoyage terminé!\n${result.contaminatedMessages} messages contaminés supprimés\n${result.cleanedMessages} messages propres conservés`);
                } else {
                  console.log('🚨 Aucune contamination détectée');
                  alert('Aucun message contaminé trouvé dans votre historique.');
                }
                
              } catch (error) {
                console.error('🚨 Erreur nettoyage DB:', error);
                alert('Erreur lors du nettoyage de la base de données.');
              }
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-all"
          >
            🗄️
            {language === 'ar' ? 'تنظيف قاعدة البيانات' : 'Nettoyer DB'}
          </button>
          
          {/* Bouton de traduction avec Gemini AI */}
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
                    // Si même langue, garder l'original
                    if (message.originalLang === language) {
                      return {
                        ...message,
                        text: message.originalText,
                        isTranslated: false,
                        translatedText: undefined
                      };
                    }

                    // Différente langue - appliquer la traduction via Gemini
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
                      // En cas d'erreur, garder l'original
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
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              showHistory ? 'bg-legal-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History size={14} />
            {showHistory ? (
              <>
                <ChevronUp size={12} />
                {language === 'ar' ? 'إخفاء السجل' : 'Masquer historique'}
              </>
            ) : (
              <>
                <ChevronDown size={12} />
                {language === 'ar' ? 'عرض السجل' : 'Afficher historique'}
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

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-4 ${message.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl ${message.sender === Sender.USER ? 'order-2' : 'order-1'}`}>
              <div className={`flex items-center gap-2 mb-2 ${message.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2 rounded-full ${message.sender === Sender.USER ? 'bg-legal-blue' : 'bg-legal-gold'}`}>
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
                    <span className="text-[10px]">
                      {language === 'ar' ? 'مترجم' : 'Traduit'}
                    </span>
                  </div>
                )}
              </div>
              
              <div 
                className={`p-4 rounded-2xl shadow-sm ${
                  message.sender === Sender.USER 
                    ? 'bg-legal-blue text-white ml-8' 
                    : 'bg-white dark:bg-slate-800 border mr-8'
                }`} 
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <div className="prose prose-sm max-w-none">
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
                          className="block text-xs text-blue-600 hover:underline"
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
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border mr-8">
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

      <div className="bg-white dark:bg-slate-900 border-t p-6">
        <div className="flex gap-4 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={language === 'ar' ? 'اطرح سؤالاً قانونياً...' : 'Posez votre question juridique...'}
            className="flex-1 p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-legal-gold dark:bg-slate-800 dark:border-slate-700"
            disabled={isLoading}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-6 py-4 bg-legal-blue text-white rounded-2xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={18} />
            {language === 'ar' ? 'إرسال' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImprovedChatInterface;