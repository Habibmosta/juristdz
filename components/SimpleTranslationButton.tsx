import React, { useState } from 'react';
import { Languages } from 'lucide-react';
import { Language } from '../types';
import { improvedTranslationService } from '../services/improvedTranslationService';

interface SimpleTranslationButtonProps {
  language: Language;
  messages: Array<{
    id: string;
    text: string;
    originalText?: string;
    originalLang?: Language;
    isTranslated?: boolean;
  }>;
  onTranslationComplete: (translatedMessages: Array<{
    id: string;
    text: string;
    originalText: string;
    originalLang: Language;
    isTranslated: boolean;
  }>) => void;
}

/**
 * Bouton de traduction simple et fiable
 * Traduit tous les messages vers la langue sélectionnée
 */
export const SimpleTranslationButton: React.FC<SimpleTranslationButtonProps> = ({
  language,
  messages,
  onTranslationComplete
}) => {
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (isTranslating || messages.length === 0) return;

    console.log(`🔄 Simple translation: Translating ${messages.length} messages to ${language}`);
    setIsTranslating(true);

    try {
      const translatedMessages = await Promise.all(
        messages.map(async (message) => {
          // Utiliser le texte original s'il existe, sinon le texte actuel
          const sourceText = message.originalText || message.text;
          
          // Détecter la langue source
          const sourceLang = message.originalLang || improvedTranslationService.detectLanguage(sourceText);
          
          console.log(`📝 Translating: "${sourceText.substring(0, 50)}..." from ${sourceLang} to ${language}`);
          
          // Si même langue, retourner le texte original
          if (sourceLang === language) {
            return {
              id: message.id,
              text: sourceText,
              originalText: sourceText,
              originalLang: sourceLang,
              isTranslated: false
            };
          }

          try {
            // Traduire le texte
            const translatedText = await improvedTranslationService.translateText(
              sourceText,
              sourceLang,
              language
            );

            console.log(`✅ Translation result: "${translatedText.substring(0, 50)}..."`);

            // Vérifier si la traduction a réussi
            const isSuccessful = translatedText !== sourceText && 
                               translatedText.trim().length > 0 &&
                               !translatedText.includes('Translation failed');

            return {
              id: message.id,
              text: isSuccessful ? translatedText : sourceText,
              originalText: sourceText,
              originalLang: sourceLang,
              isTranslated: isSuccessful
            };

          } catch (error) {
            console.error(`❌ Translation failed for message ${message.id}:`, error);
            
            // En cas d'erreur, retourner le texte original
            return {
              id: message.id,
              text: sourceText,
              originalText: sourceText,
              originalLang: sourceLang,
              isTranslated: false
            };
          }
        })
      );

      console.log(`✨ Simple translation completed successfully`);
      onTranslationComplete(translatedMessages);

    } catch (error) {
      console.error('❌ Batch translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <button 
      onClick={handleTranslate}
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
  );
};