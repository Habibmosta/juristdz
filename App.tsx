
import React, { useState, useEffect } from 'react';
import { ToastProvider } from './src/contexts/ToastContext';
import RoleBasedLayout from './components/RoleBasedLayout';
import ChatInterface from './components/ImprovedChatInterface';
import EnhancedDraftingInterface from './components/EnhancedDraftingInterface';
import AnalysisInterface from './components/AnalysisInterface';
import { AdminDashboard } from './src/components/admin/AdminDashboard';
import Documentation from './components/Documentation';
import Dashboard from './components/Dashboard';
import AuthForm from './src/components/auth/AuthForm';
import ClientManagement from './src/components/clients/ClientManagement';
import EnhancedCaseManagement from './src/components/cases/EnhancedCaseManagement';
import ReminderSystem from './src/components/reminders/ReminderSystem';
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
import { TrialExpiredModal } from './src/components/trial/TrialExpiredModal';
import SubscriptionExpiryBanner from './src/components/billing/SubscriptionExpiryBanner';
import SubscriptionPage from './src/components/billing/SubscriptionPage';
import UsageAlertBanner from './src/components/billing/UsageAlertBanner';
import PendingAccountsManager from './src/components/admin/PendingAccountsManager';
import LegalDeadlineTracker from './src/components/deadlines/LegalDeadlineTracker';
import NotarialRegistry from './src/components/notarial/NotarialRegistry';
import BailiffRegistry from './src/components/bailiff/BailiffRegistry';
import UserProfilePage from './src/components/profile/UserProfilePage';
import DocumentManager from './src/components/documents/DocumentManager';
import CabinetSettings from './src/components/settings/CabinetSettings';
import TimeManagement from './src/components/time/TimeManagement';
import JurisprudencePage from './components/jurisprudence/JurisprudencePage';
import { useAccountStatus } from './src/hooks/useAccountStatus';
import { AppMode, Language, UserStats, UserRole, EnhancedUserProfile } from './types';
import { routingService } from './services/routingService';
import { autoTranslationService } from './services/autoTranslationService';
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
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  
  // Account status
  const { accountStatus, loading: accountLoading } = useAccountStatus();

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize translation system
        setTranslationSystemReady(true);

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
          
          // Vérifier si l'essai a expiré
          if (accountStatus?.status === 'expired') {
            setShowTrialExpiredModal(true);
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
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
    setLanguage(newLanguage);
    autoTranslationService.setLanguage(newLanguage);
  };

  const setUserPlan = (_userId: string, _isPro: boolean) => {
    // Legacy stub for backward compatibility
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

  const legacyUserStats: UserStats = {
    id: profile.id,
    email: profile.email,
    credits: (profile as any).credits ?? 5,
    plan: (profile as any).subscription?.plan || profile.subscriptionPlan || 'free',
    isPro: ['pro', 'cabinet'].includes((profile as any).subscription?.plan || profile.subscriptionPlan || ''),
    role: profile.activeRole === UserRole.ADMIN ? 'admin' : 'user',
    joinedAt: new Date(profile.created_at || Date.now())
  };

  return (
    <ToastProvider>
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
      {/* Subscription Expiry Banner (abonnements payants) */}
      <SubscriptionExpiryBanner userId={profile.id} language={language} />
      {/* Usage Alert Banner (crédits faibles / quotas dépassés) */}
      <UsageAlertBanner userId={profile.id} plan={(profile as any).subscription?.plan || profile.subscriptionPlan || 'free'} language={language} />
      
      {/* Welcome Modal */}
      {showWelcomeModal && accountStatus && (
        <WelcomeModal
          language={language}
          daysRemaining={accountStatus.daysRemaining}
          onClose={() => setShowWelcomeModal(false)}
        />
      )}

      {/* Trial Expired Modal */}
      {showTrialExpiredModal && profile && (
        <TrialExpiredModal
          isOpen={showTrialExpiredModal}
          onClose={() => setShowTrialExpiredModal(false)}
          userPlan={(profile.subscriptionPlan === 'cabinet' ? 'cabinet' : 'pro')}
          userId={profile.id}
          language={language}
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
          user={profile}
        />
      )}
      {currentMode === AppMode.ANALYSIS && (
        <AnalysisInterface 
          language={language} 
        />
      )}
      {currentMode === AppMode.ADMIN && (
        <AdminDashboard />
      )}
      {currentMode === AppMode.PENDING_ACCOUNTS && (
        <PendingAccountsManager 
          language={language} 
          adminId={profile.id}
        />
      )}
      {currentMode === AppMode.DEADLINES && (
        <LegalDeadlineTracker
          language={language}
          userId={profile.id}
        />
      )}
      {currentMode === AppMode.NOTARIAL_REGISTRY && (
        <NotarialRegistry
          language={language}
          userId={profile.id}
        />
      )}
      {currentMode === AppMode.BAILIFF_REGISTRY && (
        <BailiffRegistry
          language={language}
          userId={profile.id}
        />
      )}
      {currentMode === AppMode.PROFILE && (
        <UserProfilePage
          user={profile as EnhancedUserProfile}
          language={language}
          onUpdate={(_updated) => {
            // Profile updated - could trigger a re-fetch if needed
          }}
        />
      )}
      {currentMode === AppMode.DOCS && (
        <Documentation 
          language={language}
          userRole={profile?.profession as UserRole}
        />
      )}
      {currentMode === AppMode.DOCUMENTS && (
        <DocumentManager
          userId={profile.id}
          language={language}
        />
      )}
      {currentMode === AppMode.TIME_MANAGEMENT && (
        <TimeManagement
          language={language}
          userId={profile.id}
        />
      )}
      {currentMode === AppMode.SETTINGS && (
        <CabinetSettings
          userId={profile.id}
          language={language}
          userRole={profile.activeRole}
        />
      )}
      {currentMode === AppMode.JURISPRUDENCE && (
        <JurisprudencePage
          language={language}
          theme={theme}
          userId={profile.id}
          userRole={profile.profession}
        />
      )}
      {currentMode === AppMode.SUBSCRIPTION && (
        <SubscriptionPage
          userId={profile.id}
          language={language}
        />
      )}
    </RoleBasedLayout>
    </ToastProvider>
  );
};

export default App;
