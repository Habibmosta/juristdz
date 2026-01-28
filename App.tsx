
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import DraftingInterface from './components/DraftingInterface';
import AnalysisInterface from './components/AnalysisInterface';
import AdminDashboard from './components/AdminDashboard';
import Documentation from './components/Documentation';
import CaseManagement from './components/CaseManagement';
import Dashboard from './components/Dashboard';
import { AppMode, Language, UserStats, LicenseKey, Transaction, Case } from './types';
import { databaseService } from './services/databaseService';
import { supabase } from './services/supabaseClient';
import { X, Check, Crown, CreditCard, ShieldCheck, Loader2, ArrowRight, Star, Wifi, Database, Share2, AlertTriangle, FolderOpen, Plus } from 'lucide-react';
import { UI_TRANSLATIONS } from './constants';

const App: React.FC = () => {
  const [currentMode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [language, setLanguage] = useState<Language>('fr');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('juristdz_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  const [showBilling, setShowBilling] = useState(false);
  
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Cases State
  const [cases, setCases] = useState<Case[]>([
    { id: '1', title: 'Litige Foncier El Madania', clientName: 'Mr. Ahmed B.', description: 'Contestation de titre de propriété datant de 2012.', createdAt: new Date(), status: 'active' },
    { id: '2', title: 'Divorce Benamrane', clientName: 'Mme. Sarah L.', description: 'Requête de khol et garde des enfants.', createdAt: new Date(), status: 'active' }
  ]);
  const [activeCaseId, setActiveCaseId] = useState<string>('1');

  useEffect(() => {
    const initApp = async () => {
      let userId = localStorage.getItem('juristdz_user_id');
      if (!userId) {
        userId = 'USR-' + Math.floor(Math.random() * 1000000);
        localStorage.setItem('juristdz_user_id', userId);
      }

      const profile = await databaseService.getProfile(userId);
      if (profile) {
        setUserStats(profile);
      } else {
        const newProfile: UserStats = {
          id: userId, email: 'maitre.demo@barreau.dz', credits: 5, plan: 'free', isPro: false, role: 'admin', joinedAt: new Date()
        };
        await databaseService.upsertProfile(newProfile);
        setUserStats(newProfile);
      }
      setIsDataLoaded(true);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('juristdz_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  if (!isDataLoaded || !userStats) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-12 h-12 text-legal-gold animate-spin mb-4" />
        <p className="font-serif italic text-slate-400">Authentification Cabinet JuristDZ...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      <Sidebar 
        currentMode={currentMode} 
        setMode={setMode} 
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenHelp={() => {}}
        onOpenBilling={() => setShowBilling(true)}
        userStats={userStats}
        onChangeRole={() => {}}
      />
      
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        {currentMode === AppMode.DASHBOARD && (
          <Dashboard 
            language={language} 
            user={userStats} 
            setMode={setMode} 
          />
        )}
        {currentMode === AppMode.CASES && (
          <CaseManagement 
            language={language} 
            cases={cases} 
            activeCaseId={activeCaseId} 
            onSelectCase={(id) => { setActiveCaseId(id); setMode(AppMode.RESEARCH); }} 
          />
        )}
        {currentMode === AppMode.RESEARCH && <ChatInterface language={language} userId={userStats.id} />}
        {currentMode === AppMode.DRAFTING && <DraftingInterface language={language} />}
        {currentMode === AppMode.ANALYSIS && <AnalysisInterface language={language} />}
        {currentMode === AppMode.ADMIN && (
          <AdminDashboard language={language} users={[userStats]} licenseKeys={[]} transactions={[]} onGenerateKey={() => {}} onSetUserPlan={() => {}} />
        )}
        {currentMode === AppMode.DOCS && <Documentation language={language} />}
      </main>
    </div>
  );
};

export default App;
