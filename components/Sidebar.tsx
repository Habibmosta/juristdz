
import React, { useState, useEffect } from 'react';
import { AppMode, Language, UserStats } from '../types';
import { Scale, FileText, Search, ShieldCheck, Globe, HelpCircle, CreditCard, Crown, Settings, Zap, UserCircle, Sun, Moon, Book, Share2, Check, QrCode, X, Briefcase, LayoutDashboard, Wifi, WifiOff } from 'lucide-react';
import { UI_TRANSLATIONS } from '../constants';

interface SidebarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onOpenHelp: () => void;
  onOpenBilling: () => void;
  userStats: UserStats;
  onChangeRole: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentMode, setMode, language, setLanguage, theme, toggleTheme, onOpenHelp, onOpenBilling, userStats, onChangeRole 
}) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const getCleanShareUrl = () => {
    // Force la récupération de l'URL racine sans les paramètres de session ou de blob
    return window.location.protocol + '//' + window.location.host + '/';
  };

  const handleCopy = () => {
    const shareUrl = getCleanShareUrl();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getCleanShareUrl())}`;

  return (
    <>
      <div className={`hidden md:flex w-64 flex-col h-full shadow-xl flex-shrink-0 border-e transition-all duration-300 z-20 print:hidden ${
        theme === 'light' 
          ? 'bg-white border-slate-200 text-slate-800' 
          : 'bg-legal-blue border-white/5 text-white'
      }`}>
        <div className={`p-6 border-b flex items-center gap-3 transition-colors ${
          theme === 'light' ? 'border-slate-100' : 'border-slate-700/50'
        }`}>
          <div className="p-2 bg-legal-gold rounded-xl shrink-0 shadow-lg shadow-legal-gold/20">
             <Scale className="w-6 h-6 text-white" />
          </div>
          <div className="overflow-hidden">
            <h1 className={`font-bold text-xl tracking-tight truncate leading-tight ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>{isAr ? 'محامي دي زاد' : 'JuristDZ'}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
               <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
               <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">
                  {isOnline ? (isAr ? 'متصل' : 'En ligne') : (isAr ? 'غير متصل' : 'Hors ligne')}
               </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          
          {/* Mode Admin: Menu simplifié */}
          {currentMode === AppMode.ADMIN ? (
            <>
              <button
                onClick={() => setMode(AppMode.DASHBOARD)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-4 ${
                  theme === 'light' ? 'text-slate-600 hover:bg-slate-50 border border-slate-200' : 'text-slate-400 hover:bg-slate-800/50 border border-slate-700'
                }`}
              >
                <LayoutDashboard size={18} />
                <span className="font-bold text-sm">{isAr ? 'العودة إلى لوحة التحكم' : 'Retour au Dashboard'}</span>
              </button>

              <div className="px-2 mb-2">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  theme === 'light' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {isAr ? 'إدارة المنصة' : 'Administration'}
                </p>
              </div>

              <button
                onClick={() => setMode(AppMode.ADMIN)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all bg-red-600 text-white shadow-lg"
              >
                <Settings size={18} />
                <span className="font-medium text-sm">{isAr ? 'إدارة SaaS' : 'Gestion SaaS'}</span>
              </button>

              <div className={`mt-6 p-4 rounded-xl ${theme === 'light' ? 'bg-red-50 border border-red-100' : 'bg-red-900/20 border border-red-800'}`}>
                <div className="flex items-start gap-2 mb-2">
                  <ShieldCheck size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-900 dark:text-red-200 mb-1">
                      {isAr ? 'وضع المسؤول' : 'Mode Administrateur'}
                    </p>
                    <p className="text-[10px] text-red-700 dark:text-red-300 leading-relaxed">
                      {isAr ? 'وصول كامل إلى إدارة المنظمات والاشتراكات والمستخدمين' : 'Accès complet à la gestion des organisations, abonnements et utilisateurs'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Mode Normal: Menu complet */
            <>
              <button
                onClick={() => setMode(AppMode.DASHBOARD)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-4 ${
                  currentMode === AppMode.DASHBOARD 
                    ? 'bg-legal-gold text-white shadow-lg shadow-legal-gold/20' 
                    : theme === 'light' ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <LayoutDashboard size={18} />
                <span className="font-bold text-sm">{t.menu_dashboard}</span>
              </button>

              <div className="px-2 mb-2">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  theme === 'light' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {isAr ? 'المساحة المهنية' : 'Suite Métier'}
                </p>
              </div>

              {[
                { mode: AppMode.CASES, label: t.menu_cases, icon: Briefcase },
                { mode: AppMode.DRAFTING, label: t.menu_drafting, icon: FileText },
                { mode: AppMode.ANALYSIS, label: t.menu_analysis, icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = currentMode === item.mode;
                
                return (
                  <button
                    key={item.mode}
                    onClick={() => setMode(item.mode)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group ${
                      isActive 
                        ? 'bg-legal-blue text-white shadow-lg' 
                        : theme === 'light' ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                  </button>
                );
              })}

              <div className="px-2 mt-6 mb-2">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  theme === 'light' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {isAr ? 'مساعد ذكي' : 'Assistant IA'}
                </p>
              </div>

              <button
                onClick={() => setMode(AppMode.RESEARCH)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                  currentMode === AppMode.RESEARCH 
                    ? 'bg-legal-blue text-white shadow-lg' 
                    : theme === 'light' ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <Search size={18} />
                <span className="font-medium text-sm">{t.menu_research}</span>
              </button>

              <div className={`pt-6 mt-6 border-t space-y-1 ${theme === 'light' ? 'border-slate-100' : 'border-slate-800/50'}`}>
                {userStats.role === 'admin' && (
                  <button
                    onClick={() => setMode(AppMode.ADMIN)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                      theme === 'light' ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <Settings size={18} />
                    <span className="font-medium text-sm">{t.menu_admin}</span>
                  </button>
                )}
            </>
          )}
            <button onClick={() => setShowShareModal(true)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:text-legal-gold transition-colors">
              <Share2 size={16} /> {t.menu_share}
            </button>
            <div className="flex gap-1 px-4 py-2">
               <button onClick={toggleTheme} title="Changer de thème" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
               </button>
               <button 
                 onClick={() => {
                   const newLanguage = language === 'fr' ? 'ar' : 'fr';
                   console.log(`🔧 Sidebar language switch: ${language} -> ${newLanguage}`);
                   setLanguage(newLanguage);
                 }} 
                 className="px-2 py-1 text-[10px] font-bold border rounded-lg hover:border-legal-gold text-slate-500 transition-colors uppercase"
               >
                  {language}
               </button>
            </div>
          </div>
        </nav>

        <div className="mt-auto p-4">
           <div className={`p-4 rounded-2xl border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex items-center gap-2 mb-2">
                 <Zap size={14} className="text-legal-gold" />
                 <span className="text-[10px] font-bold text-slate-500">
                   {isAr ? 'مكتب افتراضي' : 'CABINET VIRTUEL'}
                 </span>
              </div>
              <p className="text-[9px] text-slate-400 leading-tight">
                {isAr ? 'هذا الإصدار التجريبي مخصص للاختبارات المهنية. البيانات محلية.' : 'Cette version béta est réservée aux tests métiers. Les données sont locales.'}
              </p>
           </div>
        </div>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
             <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold flex items-center gap-2">
                     <Share2 className="text-legal-gold" /> {t.menu_share}
                   </h2>
                   <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                     <X size={20} />
                   </button>
                </div>
                <div className="space-y-6">
                   <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                      <div className="bg-white p-3 rounded-2xl shadow-inner mb-4">
                        <img src={qrUrl} alt="QR Code" className="w-32 h-32" />
                      </div>
                      <p className="text-[10px] text-slate-500 text-center uppercase font-bold tracking-widest px-4">
                        {isAr ? 'امسح الرمز لفتح التطبيق' : 'Scanner pour ouvrir sur un autre appareil'}
                      </p>
                   </div>
                   
                   <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 p-4 rounded-2xl">
                      <div className="flex gap-3">
                         <ShieldCheck size={18} className="text-amber-600 shrink-0" />
                         <p className="text-[10px] text-amber-800 dark:text-amber-200 leading-relaxed">
                            <strong>{isAr ? 'ملاحظة:' : 'Note :'}</strong> {isAr ? 'في بيئة الاختبار هذه، تأكد من أن جلسة Google Cloud الخاصة بك لا تزال نشطة حتى يبقى الرابط قابلاً للوصول.' : 'Dans cet environnement de test, assurez-vous que votre session Google Cloud est toujours active pour que le lien reste accessible.'}
                         </p>
                      </div>
                   </div>

                   <button onClick={handleCopy} className="w-full py-4 bg-legal-blue dark:bg-legal-gold text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                      {copied ? <Check size={18} /> : <Share2 size={18} />}
                      {copied ? (isAr ? 'تم نسخ رابط المكتب!' : 'Lien de Cabinet Copié !') : (isAr ? 'نسخ الرابط الأساسي' : 'Copier l\'URL Racine')}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
