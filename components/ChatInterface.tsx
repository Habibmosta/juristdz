import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender, AppMode, Language, UserFeedback } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { improvedTranslationService } from '../services/improvedTranslationService';
import { Send, Bot, User, BookOpen, ExternalLink, RefreshCw, Mic, ThumbsUp, ThumbsDown, MessageSquare, Share2, Check, Languages, AlertTriangle, History, ChevronUp, ChevronDown, Clock } from 'lucide-react';
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
  translationQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  translationError?: string | undefined;
}

// Search session interface for history management
interface SearchSession {
  id: string;
  query: string;
  timestamp: Date;
  messages: TranslatableMessage[];
  isActive: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ language, userId }) => {
  const t = UI_TRANSLATIONS[language];
  const [input, setInput] = useState('');
  const [currentMessages, setCurrentMessages] = useState<TranslatableMessage[]>([]);
  const [searchSessions, setSearchSessions] = useState<SearchSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState<{msgId: string, isPositive: boolean} | null>(null);
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      const history = await databaseService.getMessages(userId);
      
      if (history.length > 0) {
        // Group messages into search sessions
        const sessions = groupMessagesIntoSessions(history);
        setSearchSessions(sessions);
        
        // Set the most recent session as active
        if (sessions.length > 0) {
          const latestSession = sessions[0];
          setActiveSessionId(latestSession.id);
          setCurrentMessages(latestSession.messages);
        }
      } else {
        // Create welcome session
        const welcomeSession: SearchSession = {
          id: 'welcome',
          query: t.chat_welcome,
          timestamp: new Date(),
          messages: [{
            id: 'welcome',
            text: t.chat_welcome,
            sender: Sender.BOT,
            timestamp: new Date(),
            originalText: t.chat_welcome,
            originalLang: language,
            isTranslated: false,
            translationQuality: 'excellent'
          }],
          isActive: true
        };
        setSearchSessions([welcomeSession]);
        setActiveSessionId('welcome');
        setCurrentMessages(welcomeSession.messages);
      }
      
      setIsLoading(false);
    };
    loadHistory();
  }, [userId, language, t.chat_welcome]);

  // Group messages into search sessions based on user queries
  const groupMessagesIntoSessions = (messages: Message[]): SearchSession[] => {
    const sessions: SearchSession[] = [];
    let currentSession: SearchSession | null = null;

    messages.forEach((msg, index) => {
      const translatableMsg: TranslatableMessage = {
        ...msg,
        originalText: msg.text,
        originalLang: improvedTranslationService.detectLanguage(msg.text),
        isTranslated: false,
        translationQuality: 'excellent'
      };

      if (msg.sender === Sender.USER) {
        // Start new session for each user query
        currentSession = {
          id: `session-${Date.now()}-${index}`,
          query: msg.text.substring(0, 50) + (msg.text.length > 50 ? '...' : ''),
          timestamp: msg.timestamp,
          messages: [translatableMsg],
          isActive: false
        };
        sessions.unshift(currentSession); // Add to beginning for reverse chronological order
      } else if (currentSession) {
        // Add bot response to current session
        currentSession.messages.push(translatableMsg);
      }
    });

    return sessions;
  };

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
    setCurrentMessages(prev => prev.map(m => m.id === feedbackInput.msgId ? { ...m, feedback: { isPositive: feedbackInput.isPositive, comment } } : m));
    setFeedbackInput(null);
    setComment('');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const detectedLang = improvedTranslationService.detectLanguage(input);
    const userMsg: TranslatableMessage = { 
      id: Date.now().toString(), 
      text: input, 
      sender: Sender.USER, 
      timestamp: new Date(),
      originalText: input,
      originalLang: detectedLang,
      isTranslated: false,
      translationQuality: 'excellent'
    };
    
    // Create new search session
    const newSessionId = `session-${Date.now()}`;
    const newSession: SearchSession = {
      id: newSessionId,
      query: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
      timestamp: new Date(),
      messages: [userMsg],
      isActive: true
    };
    
    // Add new session at the beginning (most recent first)
    setSearchSessions(prev => [newSession, ...prev.map(s => ({ ...s, isActive: false }))]);
    setActiveSessionId(newSessionId);
    setCurrentMessages([userMsg]);
    setInput('');
    setIsLoading(true);
    
    // Scroll to top for new results
    setTimeout(() => {
      messagesTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    await databaseService.saveMessage(userId, userMsg);
    
    const history = currentMessages.map(m => ({ 
      role: m.sender === Sender.USER ? 'user' : 'model', 
      parts: [{ text: m.originalText || m.text }] 
    }));
    
    const response = await sendMessageToGemini(userMsg.originalText || userMsg.text, history, AppMode.RESEARCH, detectedLang);
    
    // CRITICAL: Bot response is always in the same language as the user query initially
    const botMsg: TranslatableMessage = { 
      id: (Date.now() + 1).toString(), 
      text: response.text, 
      sender: Sender.BOT, 
      timestamp: new Date(), 
      citations: response.citations,
      originalText: response.text,
      originalLang: detectedLang, // Bot responds in same language as user query
      isTranslated: false,
      translationQuality: 'excellent'
    };
    
    // CRITICAL FIX: Don't auto-translate the response here
    // Let the useEffect handle translation when user changes language
    
    // Update current messages and session
    const updatedMessages = [userMsg, botMsg];
    setCurrentMessages(updatedMessages);
    
    // Update the session with the bot response
    setSearchSessions(prev => prev.map(session => 
      session.id === newSessionId 
        ? { ...session, messages: updatedMessages }
        : session
    ));
    
    await databaseService.saveMessage(userId, botMsg);
    setIsLoading(false);
  };

  // Function to switch to a different search session
  const switchToSession = (sessionId: string) => {
    const session = searchSessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setCurrentMessages(session.messages);
      setSearchSessions(prev => prev.map(s => ({ ...s, isActive: s.id === sessionId })));
      
      // Scroll to top when switching sessions
      setTimeout(() => {
        messagesTopRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative">
      {/* Top reference for scrolling */}
      <div ref={messagesTopRef} />
      
      <div className="bg-white dark:bg-slate-900 border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-serif flex items-center gap-2">
            {t.chat_header} 
            <span className="text-[10px] text-red-500 ml-2 border border-red-200 px-1 rounded">BÊTA TEST</span>
          </h2>
          <p className="text-sm text-slate-500">{t.chat_subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bouton de traduction intégré */}
          <button 
            onClick={async () => {
              console.log(`🔄 Traduction manuelle vers ${language}`);
              
              if (currentMessages.length === 0) {
                console.log('Aucun message à traduire');
                return;
              }
              
              try {
                const translatedMessages = await Promise.all(
                  currentMessages.map(async (message) => {
                    const sourceText = message.originalText || message.text;
                    const sourceLang = message.originalLang || improvedTranslationService.detectLanguage(sourceText);
                    
                    console.log(`📝 Traduction: "${sourceText.substring(0, 50)}..." de ${sourceLang} vers ${language}`);
                    
                    // Si même langue, retourner le texte original
                    if (sourceLang === language) {
                      return {
                        ...message,
                        text: sourceText,
                        isTranslated: false,
                        translationQuality: 'excellent' as const,
                        translationError: undefined
                      };
                    }

                    try {
                      const translatedText = await improvedTranslationService.translateText(
                        sourceText,
                        sourceLang,
                        language
                      );

                      console.log(`✅ Résultat: "${translatedText.substring(0, 50)}..."`);

                      const isSuccessful = translatedText !== sourceText && 
                                         translatedText.trim().length > 0;
                      
                      return {
                        ...message,
                        text: isSuccessful ? translatedText : sourceText,
                        originalText: sourceText,
                        originalLang: sourceLang,
                        isTranslated: isSuccessful,
                        translationQuality: (isSuccessful ? 'good' : 'poor') as const,
                        translationError: isSuccessful ? undefined : 'Traduction échouée'
                      };
                    } catch (error) {
                      console.error('❌ Erreur de traduction:', error);
                      return {
                        ...message,
                        text: sourceText,
                        originalText: sourceText,
                        originalLang: sourceLang,
                        isTranslated: false,
                        translationQuality: 'poor' as const,
                        translationError: `Erreur: ${error}`
                      };
                    }
                  })
                );

                console.log(`✨ Traduction terminée`);
                setCurrentMessages(translatedMessages);
                
                // Mettre à jour la session active
                if (activeSessionId) {
                  setSearchSessions(prev => prev.map(session => 
                    session.id === activeSessionId 
                      ? { ...session, messages: translatedMessages }
                      : session
                  ));
                }
                
              } catch (error) {
                console.error('❌ Erreur de traduction globale:', error);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all"
          >
            <Languages size={16} />
            {language === 'ar' ? 'ترجمة الرسائل' : 'Traduire les messages'}
          </button>
          
          {/* Search History Toggle */}
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
                {searchSessions.length > 1 && (
                  <span className="bg-legal-gold text-white rounded-full px-2 py-0.5 text-[10px] ml-1">
                    {searchSessions.length}
                  </span>
                )}
              </>
            )}
          </button>
          
          <button 
            onClick={handleCopyLink}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-legal-blue text-white hover:opacity-90'}`}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            {copied ? (language === 'ar' ? 'تم النسخ' : 'Copié !') : (language === 'ar' ? 'نسخ رابط التجربة' : 'Lien de test')}
          </button>
        </div>
      </div>

      {/* Search History Panel */}
      {showHistory && searchSessions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border-b px-6 py-4 max-h-48 overflow-y-auto">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Clock size={14} />
            {language === 'ar' ? 'سجل البحث' : 'Historique des recherches'}
          </h3>
          <div className="space-y-2">
            {searchSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => switchToSession(session.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  session.id === activeSessionId
                    ? 'bg-legal-blue text-white border-legal-blue'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" dir="auto">
                      {session.query}
                    </p>
                    <p className={`text-xs mt-1 ${
                      session.id === activeSessionId ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {session.timestamp.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${
                    session.id === activeSessionId ? 'text-blue-100' : 'text-slate-400'
                  }`}>
                    <MessageSquare size={12} />
                    {session.messages.length}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {currentMessages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === Sender.USER ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.sender === Sender.USER ? 'bg-slate-700' : 'bg-legal-gold'}`}>
              {msg.sender === Sender.USER ? <User size={16} className="text-white" /> : <Bot size={20} className="text-white" />}
            </div>
            <div className={`max-w-[80%] relative group`}>
              <div className={`rounded-2xl px-6 py-4 shadow-sm border ${msg.sender === Sender.USER ? 'bg-white dark:bg-slate-900' : 'bg-white dark:bg-slate-900 border-s-4 border-legal-gold'}`}>
                <div className="prose prose-sm dark:prose-invert font-serif" dir="auto">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                
                {/* Translation indicator with quality */}
                {msg.isTranslated && (
                  <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                    <Languages size={12} />
                    <span className={`${
                      msg.translationQuality === 'excellent' ? 'text-green-500' :
                      msg.translationQuality === 'good' ? 'text-blue-500' :
                      msg.translationQuality === 'fair' ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {language === 'ar' ? 'مترجم تلقائياً' : 'Traduit automatiquement'}
                      {msg.translationQuality && msg.translationQuality !== 'excellent' && (
                        <span className="ml-1">({msg.translationQuality})</span>
                      )}
                    </span>
                  </div>
                )}
                
                {/* Translation error indicator */}
                {msg.translationError && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-red-500 bg-red-50 p-2 rounded">
                    <AlertTriangle size={12} />
                    <span>Erreur de traduction: {msg.translationError}</span>
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