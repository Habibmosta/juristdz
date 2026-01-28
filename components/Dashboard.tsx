
import React from 'react';
import { AppMode, Language, UserStats } from '../types';
import { UI_TRANSLATIONS } from '../constants';
import { MessageSquare, Briefcase, FileText, ShieldCheck, Zap, ArrowRight, Star, Clock, ShieldAlert } from 'lucide-react';

interface DashboardProps {
  language: Language;
  user: UserStats;
  setMode: (mode: AppMode) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ language, user, setMode }) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-12" dir={isAr ? 'rtl' : 'ltr'}>
       <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-legal-blue dark:bg-slate-900 rounded-[2.5rem] p-10 md:p-16 text-white shadow-2xl border border-white/5">
             <div className="absolute top-0 right-0 w-96 h-96 bg-legal-gold/10 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="px-3 py-1 bg-legal-gold/20 text-legal-gold rounded-full text-[10px] font-black uppercase tracking-widest border border-legal-gold/30">
                      Édition Professionnelle V2.0
                   </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold font-serif mb-4 leading-tight">{t.dash_welcome}</h1>
                <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">{t.dash_subtitle}</p>
                
                <div className="flex flex-wrap gap-4">
                   <div className="flex items-center gap-3 px-5 py-3 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/10 backdrop-blur-md cursor-help">
                      <div className="w-2 h-2 rounded-full bg-legal-gold"></div>
                      <span className="text-sm font-bold">{user.credits} Crédits Juridiques</span>
                   </div>
                   <div className="flex items-center gap-3 px-5 py-3 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/10 backdrop-blur-md uppercase tracking-wider">
                      <Star size={16} className="text-legal-gold" />
                      <span className="text-sm font-bold italic">{user.plan}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Transition Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             
             {/* V1 - Assistant */}
             <div className="group bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-blue-500/20 transition-all duration-500">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                   <MessageSquare size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-4">{t.dash_v1_title}</h2>
                <p className="text-slate-500 mb-10 leading-relaxed text-sm">{t.dash_v1_desc}</p>
                <button 
                  onClick={() => setMode(AppMode.RESEARCH)}
                  className="px-8 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold flex items-center gap-3 group-hover:bg-legal-blue group-hover:text-white transition-all w-full md:w-auto justify-center"
                >
                   {t.dash_btn_chat}
                   <ArrowRight size={18} />
                </button>
             </div>

             {/* V2 - Professionnel */}
             <div className="group bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border-2 border-legal-gold/20 shadow-lg hover:shadow-2xl hover:border-legal-gold/50 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-6 right-6 flex items-center gap-2">
                   <span className="bg-legal-gold text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-legal-gold/20">Accès Maître</span>
                </div>
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-legal-gold rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                   <Briefcase size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-4">{t.dash_v2_title}</h2>
                <p className="text-slate-500 mb-10 leading-relaxed text-sm">{t.dash_v2_desc}</p>
                <button 
                  onClick={() => setMode(AppMode.CASES)}
                  className="px-8 py-4 bg-legal-gold text-white rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-legal-gold/20 active:scale-95 transition-all w-full md:w-auto justify-center"
                >
                   {t.dash_btn_case}
                   <ArrowRight size={18} />
                </button>
             </div>

          </div>

          {/* Alert for test environment */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 p-6 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
             <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800/30 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                <ShieldAlert size={24} />
             </div>
             <div className="flex-1 text-center md:text-left">
                <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm mb-1">Environnement de Pré-production</h4>
                <p className="text-amber-700 dark:text-amber-300 text-xs">
                   Ce lien est un accès temporaire pour validation métier. Pour une installation permanente au cabinet, veuillez contacter le support technique.
                </p>
             </div>
             <button className="px-6 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 rounded-xl text-[10px] font-black uppercase text-amber-700 dark:text-amber-200 hover:bg-amber-100 transition-colors">
                En savoir plus
             </button>
          </div>

          {/* Quick Stats / Recent Activity */}
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-bold flex items-center gap-3 font-serif">
                   <Clock size={24} className="text-legal-gold" />
                   Journal d'Activité Récente
                </h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                   { label: 'Rédaction d\'acte', date: 'Dernière session', icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                   { label: 'Recherche JORA', date: 'Session en cours', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                   { label: 'Audit Dossier', date: '3 dossiers actifs', icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/10' },
                ].map((item, i) => (
                  <div key={i} className="group flex items-center gap-5 p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-legal-gold/30 hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 cursor-pointer">
                     <div className={`p-4 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                        <item.icon size={24} />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{item.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">{item.date}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>

       </div>
    </div>
  );
};

export default Dashboard;
