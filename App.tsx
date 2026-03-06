
import React, { useState, useEffect } from 'react';
import RoleBasedLayout from './components/RoleBasedLayout';
import ChatInterface from './components/ImprovedChatInterface';
import EnhancedDraftingInterface from './components/EnhancedDraftingInterface';
import AnalysisInterface from './components/AnalysisInterface';
import AdminDashboard from './components/AdminDashboard';
import Documentation from './components/Documentation';
import CaseManagement from './components/CaseManagement';
import Dashboard from './components/Dashboard';
import AvocatInterface from './components/interfaces/AvocatInterface';
import AuthForm from './src/components/auth/AuthForm';
import ClientManagement from './src/components/clients/ClientManagement';
import EnhancedCaseManagement from './src/components/cases/EnhancedCaseManagement';
import LawyerCalendar from './src/components/calendar/LawyerCalendar';
import ReminderSystem from './src/components/reminders/ReminderSystem';
import InvoiceManagement from './src/components/billing/InvoiceManagement';
import AdvancedAnalytics from './src/components/analytics/AdvancedAnalytics';
import AlgerianCalculator from './src/components/tools/AlgerianCalculator';
// Nouveaux composants professionnels
import InvoiceManager from './src/components/billing/InvoiceManager';
import CalendarView from './src/components/calendar/CalendarView';
import ClientPortal from './src/components/portal/ClientPortal';
import TimeTracker from './src/components/time/TimeTracker';
// Composants Trial System
import TrialBanner from './src/components/trial/TrialBanner';
import WelcomeModal from './src/components/trial/WelcomeModal';
import PendingAccountsManager from './src/components/admin/PendingAccountsManager';
import { useAccountStatus } from './src/hooks/useAccountStatus';
import { AppMode, Language, UserStats, LicenseKey, Transaction, Case, UserRole, EnhancedUserProfile } from './types';
import { databaseService } from './services/databaseService';
import { routingService } from './services/routingService';
import { autoTranslationService } from './services/autoTranslationService';
import { demoSetup } from './services/demoSetup';
import { getDefaultMode } from './config/roleRouting';
import { useAuth } from './src/hooks/useAuth';
import { Loader2, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  // Use Supabase authentication
  const { user, profile, loading: authLoading, signOut } = useAuth();
  
  const [currentMode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [language, setLanguage] = useState<Language>('fr');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('juristdz_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [translationSystemReady, setTranslationSystemReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Account status
  const { accountStatus, loading: accountLoading } = useAccountStatus();
  
  // Legacy state for backward compatibility
  // Note: Setters prefixed with _ are kept for potential future use but not currently used
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([]);
  const [transactions, _setTransactions] = useState<Transaction[]>([]);
  const [cases, _setCases] = useState<Case[]>([]); // Empty - real cases loaded from database
  const [activeCaseId, setActiveCaseId] = useState<string>('');

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize translation system
        setTranslationSystemReady(true);
        console.log('✅ Simple translation system ready');

        // If user is authenticated, initialize routing (only once)
        if (profile && !isInitialized) {
          routingService.setCurrentUser(profile);
          const defaultMode = getDefaultMode(profile.activeRole);
          setMode(defaultMode);
          setIsInitialized(true);
          
          // Vérifier si c'est la première connexion (afficher modal de bienvenue)
          const hasSeenWelcome = localStorage.getItem(`welcome_seen_${profile.id}`);
          if (!hasSeenWelcome && profile.account_status === 'trial') {
            setShowWelcomeModal(true);
            localStorage.setItem(`welcome_seen_${profile.id}`, 'true');
          }
        }
        
        setIsDataLoaded(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setAuthError('Failed to initialize application. Please refresh the page.');
        setIsDataLoaded(true);
      }
    };

    initApp();
  }, [profile, isInitialized]);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('juristdz_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    if (!profile) return;
    
    const updatedProfile = {
      ...profile,
      activeRole: newRole
    };
    
    routingService.setCurrentUser(updatedProfile);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    console.log(`🌐 App: Language change requested: ${language} -> ${newLanguage}`);
    setLanguage(newLanguage);
    
    // Simple notification to translation service
    autoTranslationService.setLanguage(newLanguage);
  };

  const generateLicenseKey = () => {
    const newKey: LicenseKey = {
      key: 'JDZ-' + Math.random().toString(36).substring(2, 15).toUpperCase(),
      plan: 'pro',
      isUsed: false,
      createdAt: new Date(),
    };
    setLicenseKeys(prev => [...prev, newKey]);
  };

  const setUserPlan = (userId: string, isPro: boolean) => {
    // Legacy function for backward compatibility
    console.log('Legacy setUserPlan called:', userId, isPro);
  };

  // Loading state
  if (authLoading || !isDataLoaded || !translationSystemReady) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-12 h-12 text-legal-gold animate-spin mb-4" />
        <p className="font-serif italic text-slate-400">Initialisation Cabinet JuristDZ...</p>
        {!translationSystemReady ? (
          <p className="text-xs text-slate-500 mt-2">Configuration du système de traduction...</p>
        ) : authLoading ? (
          <p className="text-xs text-slate-500 mt-2">Vérification de l'authentification...</p>
        ) : (
          <p className="text-xs text-slate-500 mt-2">Configuration du système de routage...</p>
        )}
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!user || !profile) {
    return <AuthForm onSuccess={() => {}} />;
  }

  // Error state
  if (authError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white p-8">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-900/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-xl">Erreur d'Authentification</h2>
              <p className="text-slate-400 text-sm">Impossible de charger le profil utilisateur</p>
            </div>
          </div>
          
          <div className="bg-red-900/10 border border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-200 text-sm">
              {authError}
            </p>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-legal-gold text-white rounded-xl font-bold hover:bg-legal-gold/90 transition-colors"
          >
            Recharger l'Application
          </button>
        </div>
      </div>
    );
  }

  // Convert enhanced profile to legacy UserStats for backward compatibility
  const legacyUserStats: UserStats = {
    id: profile.id,
    email: profile.email,
    credits: 5,
    plan: 'free',
    isPro: false,
    role: 'admin', // Force admin pour accéder à l'interface SaaS
    joinedAt: new Date()
  };

  return (
    <RoleBasedLayout
      user={profile}
      currentMode={currentMode}
      language={language}
      theme={theme}
      onModeChange={handleModeChange}
      onRoleSwitch={handleRoleSwitch}
      onLanguageChange={handleLanguageChange}
      onThemeToggle={toggleTheme}
    >
      {/* Trial Banner */}
      <TrialBanner language={language} />
      
      {/* Welcome Modal */}
      {showWelcomeModal && accountStatus && (
        <WelcomeModal
          language={language}
          daysRemaining={accountStatus.daysRemaining}
          onClose={() => setShowWelcomeModal(false)}
        />
      )}
      
      {currentMode === AppMode.DASHBOARD && (
        <Dashboard 
          language={language} 
          user={legacyUserStats} 
          enhancedUser={profile}
          setMode={setMode} 
          showSpecializedInterface={true}
          theme={theme}
        />
      )}
      {currentMode === AppMode.CASES && (
        <EnhancedCaseManagement 
          language={language} 
          userId={profile.id} 
        />
      )}
      {currentMode === AppMode.CLIENTS && (
        <ClientManagement 
          language={language} 
          userId={profile.id} 
        />
      )}
      {currentMode === AppMode.CALENDAR && (
        <CalendarView 
          language={language} 
          userId={profile.id} 
        />
      )}
      {currentMode === AppMode.REMINDERS && (
        <ReminderSystem 
          language={language} 
          userId={profile.id} 
        />
      )}
      {currentMode === AppMode.BILLING && (
        <InvoiceManager 
          language={language} 
          userId={profile.id} 
        />
      )}
      {currentMode === AppMode.TIME_TRACKING && (
        <TimeTracker 
          language={language} 
          userId={profile.id} 
        />
      )}
      {currentMode === AppMode.CLIENT_PORTAL && (
        <ClientPortal 
          clientId={profile.id}
          language={language} 
        />
      )}
      {currentMode === AppMode.ANALYTICS && (
        <AdvancedAnalytics 
          language={language} 
          userId={profile.id} 
        />
      )}
      {currentMode === AppMode.TOOLS && (
        <AlgerianCalculator 
          language={language} 
        />
      )}
      {currentMode === AppMode.RESEARCH && (
        <ChatInterface 
          language={language} 
          userId={profile.id} 
        />
      )}
      {currentMode === AppMode.DRAFTING && (
        <EnhancedDraftingInterface 
          language={language} 
          userRole={profile.activeRole}
          userId={profile.id}
        />
      )}
      {currentMode === AppMode.ANALYSIS && (
        <AnalysisInterface 
          language={language} 
        />
      )}
      {currentMode === AppMode.ADMIN && (
        <AdminDashboard 
          language={language} 
          users={[legacyUserStats]} 
          licenseKeys={licenseKeys} 
          transactions={transactions} 
          onGenerateKey={generateLicenseKey} 
          onSetUserPlan={setUserPlan} 
        />
      )}
      {currentMode === AppMode.PENDING_ACCOUNTS && (
        <PendingAccountsManager 
          language={language} 
          adminId={profile.id}
        />
      )}
      {currentMode === AppMode.DOCS && (
        <Documentation 
          language={language} 
        />
      )}
    </RoleBasedLayout>
  );
};

export default App;
