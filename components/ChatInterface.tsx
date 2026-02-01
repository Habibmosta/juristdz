
import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender, AppMode, Language, UserFeedback } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { translationService } from '../services/translationService';
import { Send, Bot, User, BookOpen, ExternalLink, RefreshCw, Mic, ThumbsUp, ThumbsDown, MessageSquare, Share2, Check, Languages } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UI_TRANSLATIONS } from '../constants';

interface ChatInterfaceProps {
  language: Language;
  userId: string;
}

// Extended message interface with translation support
interface TranslatableMessage extends Message {
  originalText?: string;
  originalLang?: Language;
  isTranslated?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ language, userId }) => {
  const t = UI_TRANSLATIONS[language];
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<TranslatableMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState<{msgId: string, isPositive: boolean} | null>(null);
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [previousLanguage, setPreviousLanguage] = useState<Language>(language);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      const history = await databaseService.getMessages(userId);
      const translatableHistory: TranslatableMessage[] = history.length > 0 
        ? history.map(msg => ({
            ...msg,
            originalText: msg.text,
            originalLang: translationService.detectLanguage(msg.text),
            isTranslated: false
          }))
        : [{
            id: 'welcome',
            text: t.chat_welcome,
            sender: Sender.BOT,
            timestamp: new Date(),
            originalText: t.chat_welcome,
            originalLang: language,
            isTranslated: false
          }];
      
      setMessages(translatableHistory);
      setIsLoading(false);
    };
    loadHistory();
  }, [userId]);

  // Auto-translate messages when language changes
  useEffect(() => {
    const translateMessages = async () => {
      if (previousLanguage === language || messages.length === 0) {
        setPreviousLanguage(language);
        return;
      }

      console.log(`🌐 Language changed from ${previousLanguage} to ${language}, translating ${messages.length} messages`);
      setIsTranslating(true);
      
      try {
        const translatedMessages = await Promise.all(
          messages.map(async (message) => {
            // Skip if message is already in target language
            const detectedLang = message.originalLang || translationService.detectLanguage(message.originalText || message.text);
            
            console.log(`📝 Message: "${(message.originalText || message.text).substring(0, 50)}..." - Detected: ${detectedLang}, Target: ${language}`);
            
            if (detectedLang === language) {
              console.log(`✅ Already in target language, using original text`);
              return {
                ...message,
                text: message.originalText || message.text,
                isTranslated: false
              };
            }

            // Translate the message
            try {
              const translatedText = await translationService.translateText(
                message.originalText || message.text,
                detectedLang,
                language
              );

              console.log(`🔄 Translated: "${(message.originalText || message.text).substring(0, 30)}..." -> "${translatedText.substring(0, 30)}..."`);

              return {
                ...message,
                text: translatedText,
                originalText: message.originalText || message.text,
                originalLang: detectedLang,
                isTranslated: translatedText !== (message.originalText || message.text)
              };
            } catch (error) {
              console.error('❌ Failed to translate message:', error);
              return {
                ...message,
                originalText: message.originalText || message.text,
                originalLang: detectedLang,
                isTranslated: false
              };
            }
          })
        );

        console.log(`✨ Translation completed, updating ${translatedMessages.length} messages`);
        setMessages(translatedMessages);
      } catch (error) {
        console.error('❌ Translation batch failed:', error);
      } finally {
        setIsTranslating(false);
        setPreviousLanguage(language);
      }
    };

    // Add a small delay to ensure the effect runs after state updates
    const timeoutId = setTimeout(translateMessages, 100);
    return () => clearTimeout(timeoutId);
  }, [language]); // Only depend on language, not messages.length to avoid infinite loop

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (msgId: string, isPositive: boolean) => {
    setFeedbackInput({ msgId, isPositive });
  };

  const submitFeedback = async () => {
    if (!feedbackInput) return;
    const feedback: UserFeedback = {
      id: Date.now().toString(),
      userId,
      messageId: feedbackInput.msgId,
      isPositive: feedbackInput.isPositive,
      comment,
      mode: AppMode.RESEARCH,
      timestamp: new Date()
    };
    await databaseService.saveFeedback(feedback);
    setMessages(prev => prev.map(m => m.id === feedbackInput.msgId ? { ...m, feedback: { isPositive: feedbackInput.isPositive, comment } } : m));
    setFeedbackInput(null);
    setComment('');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const detectedLang = translationService.detectLanguage(input);
    const userMsg: TranslatableMessage = { 
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
    
    const history = messages.map(m => ({ 
      role: m.sender === Sender.USER ? 'user' : 'model', 
      parts: [{ text: m.originalText || m.text }] 
    }));
    
    const response = await sendMessageToGemini(userMsg.originalText || userMsg.text, history, AppMode.RESEARCH, detectedLang);
    
    const botMsg: TranslatableMessage = { 
      id: (Date.now() + 1).toString(), 
      text: response.text, 
      sender: Sender.BOT, 
      timestamp: new Date(), 
      citations: response.citations,
      originalText: response.text,
      originalLang: detectedLang,
      isTranslated: false
    };
    
    // If current UI language is different from detected language, translate the response
    if (language !== detectedLang) {
      try {
        const translatedResponse = await translationService.translateText(response.text, detectedLang, language);
        botMsg.text = translatedResponse;
        botMsg.isTranslated = true;
      } catch (error) {
        console.error('Failed to translate response:', error);
      }
    }
    
    setMessages(prev => [...prev, botMsg]);
    await databaseService.saveMessage(userId, botMsg);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative">
      <div className="bg-white dark:bg-slate-900 border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-serif flex items-center gap-2">
            {t.chat_header} 
            <span className="text-[10px] text-red-500 ml-2 border border-red-200 px-1 rounded">BÊTA TEST</span>
            {isTranslating && (
              <div className="flex items-center gap-1 text-blue-500">
                <Languages size={16} className="animate-pulse" />
                <span className="text-xs">
                  {language === 'ar' ? 'ترجمة...' : 'Traduction...'}
                </span>
              </div>
            )}
          </h2>
          <p className="text-sm text-slate-500">{t.chat_subtitle}</p>
        </div>
        <button 
          onClick={handleCopyLink}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-legal-blue text-white hover:opacity-90'}`}
        >
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          {copied ? (language === 'ar' ? 'تم النسخ' : 'Copié !') : (language === 'ar' ? 'نسخ رابط التجربة' : 'Lien de test')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === Sender.USER ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.sender === Sender.USER ? 'bg-slate-700' : 'bg-legal-gold'}`}>
              {msg.sender === Sender.USER ? <User size={16} className="text-white" /> : <Bot size={20} className="text-white" />}
            </div>
            <div className={`max-w-[80%] relative group`}>
              <div className={`rounded-2xl px-6 py-4 shadow-sm border ${msg.sender === Sender.USER ? 'bg-white dark:bg-slate-900' : 'bg-white dark:bg-slate-900 border-s-4 border-legal-gold'}`}>
                <div className="prose prose-sm dark:prose-invert font-serif" dir="auto">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                
                {/* Translation indicator */}
                {msg.isTranslated && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-blue-500 opacity-70">
                    <Languages size={12} />
                    <span>
                      {language === 'ar' ? 'مترجم تلقائياً' : 'Traduit automatiquement'}
                    </span>
                  </div>
                )}
                
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                    {msg.citations.map((c, i) => (
                      <a key={i} href={c.uri} target="_blank" className="flex items-center gap-1 text-[10px] bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border">
                        <ExternalLink size={10} /> {c.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === Sender.BOT && !msg.feedback && (
                <div className="absolute top-0 -right-12 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleFeedback(msg.id, true)} className="p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-green-500 hover:bg-green-50 shadow-sm"><ThumbsUp size={14} /></button>
                   <button onClick={() => handleFeedback(msg.id, false)} className="p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 shadow-sm"><ThumbsDown size={14} /></button>
                </div>
              )}
              {msg.feedback && (
                <div className={`mt-2 flex items-center gap-2 text-[10px] font-bold ${msg.feedback.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {msg.feedback.isPositive ? <ThumbsUp size={10} /> : <ThumbsDown size={10} />}
                  {language === 'ar' ? 'تم التحقق من قبل المحامي' : 'Validé par l\'expert'}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && <div className="flex items-center gap-2 text-slate-400 animate-pulse"><RefreshCw className="animate-spin" size={14}/> {t.chat_loading}</div>}
        <div ref={messagesEndRef} />
      </div>

      {feedbackInput && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl max-w-sm w-full border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                {feedbackInput.isPositive ? <ThumbsUp className="text-green-500" /> : <ThumbsDown className="text-red-500" />}
                {language === 'ar' ? 'تقييم دقة الإجابة' : 'Évaluer la précision'}
              </h4>
              <p className="text-xs text-slate-500 mb-4">{language === 'ar' ? 'هل الإجابة مطابقة للقانون الجزائري؟' : 'Cette réponse est-elle conforme au droit algérien ?'}</p>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={language === 'ar' ? 'أضف ملاحظاتك (مثال: المادة 12 غير صحيحة)' : 'Ajoutez une remarque (ex: Article 12 incorrect)'} className="w-full p-3 border rounded-xl text-sm mb-4 h-24 bg-slate-50 dark:bg-slate-800" />
              <div className="flex gap-2">
                <button onClick={() => setFeedbackInput(null)} className="flex-1 py-2 bg-slate-100 rounded-xl text-sm font-bold">Annuler</button>
                <button onClick={submitFeedback} className="flex-1 py-2 bg-legal-blue text-white rounded-xl text-sm font-bold">Envoyer</button>
              </div>
           </div>
        </div>
      )}

      <div className="p-4 bg-white dark:bg-slate-900 border-t shrink-0">
        <div className="max-w-4xl mx-auto flex gap-2 items-end">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.chat_placeholder} className="flex-1 px-4 py-4 border rounded-xl outline-none resize-none dark:bg-slate-800" rows={1} />
          <button onClick={handleSend} className="p-4 bg-legal-blue text-white rounded-xl"><Send size={20} /></button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
