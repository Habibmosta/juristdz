
import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender, AppMode, Language, UserFeedback } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { Send, Bot, User, BookOpen, ExternalLink, RefreshCw, Mic, ThumbsUp, ThumbsDown, MessageSquare, Share2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UI_TRANSLATIONS } from '../constants';

interface ChatInterfaceProps {
  language: Language;
  userId: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ language, userId }) => {
  const t = UI_TRANSLATIONS[language];
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState<{msgId: string, isPositive: boolean} | null>(null);
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      const history = await databaseService.getMessages(userId);
      setMessages(history.length > 0 ? history : [{
        id: 'welcome',
        text: t.chat_welcome,
        sender: Sender.BOT,
        timestamp: new Date()
      }]);
      setIsLoading(false);
    };
    loadHistory();
  }, [userId, language]);

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
    const userMsg: Message = { id: Date.now().toString(), text: input, sender: Sender.USER, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    await databaseService.saveMessage(userId, userMsg);
    const history = messages.map(m => ({ role: m.sender === Sender.USER ? 'user' : 'model', parts: [{ text: m.text }] }));
    const response = await sendMessageToGemini(userMsg.text, history, AppMode.RESEARCH, language);
    const botMsg: Message = { id: (Date.now() + 1).toString(), text: response.text, sender: Sender.BOT, timestamp: new Date(), citations: response.citations };
    setMessages(prev => [...prev, botMsg]);
    await databaseService.saveMessage(userId, botMsg);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative">
      <div className="bg-white dark:bg-slate-900 border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-serif">{t.chat_header} <span className="text-[10px] text-red-500 ml-2 border border-red-200 px-1 rounded">BÊTA TEST</span></h2>
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
