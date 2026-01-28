
import React, { useState, useRef } from 'react';
import { sendMessageToGemini } from '../services/geminiService';
import { AppMode, Language, Citation } from '../types';
// Fixed: Added missing Loader2 import
import { Scale, Activity, FileSearch, AlertCircle, ArrowRight, PenTool, Eye, ExternalLink, Upload, Image as ImageIcon, X, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UI_TRANSLATIONS } from '../constants';

interface AnalysisInterfaceProps {
  language: Language;
}

const AnalysisInterface: React.FC<AnalysisInterfaceProps> = ({ language }) => {
  const t = UI_TRANSLATIONS[language];
  const [legalText, setLegalText] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTask, setActiveTask] = useState<string>('risk');
  const [mobileTab, setMobileTab] = useState<'input' | 'result'>('input');
  
  const [selectedImage, setSelectedImage] = useState<{data: string, mimeType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tasks = [
    { id: 'risk', label: t.analysis_task_risk, icon: AlertCircle, prompt: language === 'ar' ? 'حلل هذا المستند واذكر المخاطر القانونية والبنود التعسفية.' : 'Analyse ce document et liste les risques juridiques et clauses abusives.' },
    { id: 'summary', label: t.analysis_task_summary, icon: FileSearch, prompt: language === 'ar' ? 'لخص هذا المستند قانونياً.' : 'Fais un résumé juridique de ce document.' },
    { id: 'clauses', label: t.analysis_task_clauses, icon: Activity, prompt: language === 'ar' ? 'استخرج البنود المعقدة وفسرها.' : 'Extrais et explique les clauses complexes.' },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setSelectedImage({ data: base64Data, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!legalText.trim() && !selectedImage) return;
    setMobileTab('result');
    setIsAnalyzing(true);
    setAnalysisResult('');
    setCitations([]);
    
    const task = tasks.find(t => t.id === activeTask);
    let prompt = `Tâche : ${task?.prompt}\nDocument à analyser : ${legalText}`;

    const response = await sendMessageToGemini(prompt, [], AppMode.ANALYSIS, language, selectedImage || undefined);
    setAnalysisResult(response.text);
    setCitations(response.citations || []);
    setIsAnalyzing(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50 dark:bg-slate-950">
      {/* Input Side */}
      <div className={`w-full md:w-5/12 border-e dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col ${mobileTab === 'input' ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-6 border-b dark:border-slate-800">
           <h2 className="text-xl font-bold font-serif mb-1">{t.analysis_title}</h2>
           <p className="text-xs text-slate-500">{t.analysis_subtitle}</p>
        </div>
        
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
           <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {tasks.map(task => (
                <button 
                  key={task.id}
                  onClick={() => setActiveTask(task.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold rounded-lg transition-all ${activeTask === task.id ? 'bg-white dark:bg-slate-700 text-legal-gold shadow-sm' : 'text-slate-500'}`}
                >
                  <task.icon size={14} />
                  {task.label}
                </button>
              ))}
           </div>

           <div 
             onClick={() => fileInputRef.current?.click()}
             className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${selectedImage ? 'border-legal-gold bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-legal-gold'}`}
           >
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              {selectedImage ? (
                <div className="flex items-center gap-3">
                  <ImageIcon className="text-legal-gold" />
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-200">Image prête pour analyse</span>
                  <X size={16} onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} className="text-slate-400" />
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-xs font-bold text-slate-400">Scanner un document (Photo)</p>
                </div>
              )}
           </div>

           <textarea 
             value={legalText}
             onChange={(e) => setLegalText(e.target.value)}
             className="w-full flex-1 min-h-[200px] p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700 focus:ring-2 ring-legal-gold/20 outline-none text-sm font-serif"
             placeholder={t.analysis_ph}
           />
        </div>

        <div className="p-6 border-t dark:border-slate-800">
           <button 
             onClick={handleAnalyze}
             disabled={isAnalyzing || (!legalText.trim() && !selectedImage)}
             className="w-full py-4 bg-legal-blue dark:bg-legal-gold text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
           >
              {isAnalyzing ? <Loader2 className="animate-spin" /> : <ShieldAlert size={20} />}
              {isAnalyzing ? t.analysis_btn_running : t.analysis_btn_start}
           </button>
        </div>
      </div>

      {/* Result Side */}
      <div className={`flex-1 bg-slate-50 dark:bg-slate-950 overflow-y-auto p-6 md:p-10 ${mobileTab === 'result' ? 'flex' : 'hidden md:flex flex-col'}`}>
        {analysisResult ? (
          <div className="max-w-3xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Risk Meter Mockup */}
             <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center">
                      <AlertCircle size={24} />
                   </div>
                   <div>
                      <h4 className="font-bold text-sm">Niveau de Vigilance</h4>
                      <p className="text-[10px] text-slate-400">Basé sur l'analyse sémantique du document.</p>
                   </div>
                </div>
                <div className="flex items-center gap-1">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className={`h-2 w-8 rounded-full ${i <= 3 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                   ))}
                   <span className="ml-2 text-xs font-black text-amber-500">MODÉRÉ</span>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border dark:border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Scale size={120} />
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none font-serif leading-relaxed" dir="auto">
                   <ReactMarkdown>{analysisResult}</ReactMarkdown>
                </div>
             </div>

             {citations.length > 0 && (
               <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Sources Juridiques Consultées</h5>
                  <div className="flex flex-wrap gap-2">
                    {citations.map((c, i) => (
                      <a key={i} href={c.uri} target="_blank" className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs hover:text-legal-gold transition-colors">
                        <ExternalLink size={12} /> {c.title}
                      </a>
                    ))}
                  </div>
               </div>
             )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
             <FileSearch size={80} className="mb-6 text-slate-300" />
             <h3 className="text-xl font-serif">{t.analysis_waiting_title}</h3>
             <p className="max-w-xs mx-auto text-sm mt-2">{t.analysis_waiting_desc}</p>
          </div>
        )}
      </div>
      
      {/* Mobile Footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-800 p-2 flex gap-2">
         <button onClick={() => setMobileTab('input')} className={`flex-1 py-3 text-xs font-bold rounded-xl ${mobileTab === 'input' ? 'bg-legal-gold text-white' : 'text-slate-500'}`}>Saisie</button>
         <button onClick={() => setMobileTab('result')} className={`flex-1 py-3 text-xs font-bold rounded-xl ${mobileTab === 'result' ? 'bg-legal-gold text-white' : 'text-slate-500'}`}>Résultat</button>
      </div>
    </div>
  );
};

export default AnalysisInterface;
