
import React, { useState, useEffect } from 'react';
import RoleBasedLayout from './components/RoleBasedLayout';
import ChatInterface from './components/ChatInterface';
import DraftingInterface from './components/DraftingInterface';
import AnalysisInterface from './components/AnalysisInterface';
import AdminDashboard from './components/AdminDashboard';
import Documentation from './components/Documentation';
import CaseManagement from './components/CaseManagement';
import Dashboard from './components/Dashboard';
import { AppMode, Language, UserStats, LicenseKey, Transaction, Case, UserRole, EnhancedUserProfile } from './types';
import { databaseService } from './services/databaseService';
import { supabase } from './services/supabaseClient';
import { routingService } from './services/routingService';
import { getDefaultMode } from './config/roleRouting';
import { Loader2, AlertTriangle } from 'lucide-react';
import { UI_TRANSLATIONS } from './constants';

const App: React.FC = () => {
  const [currentMode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [language, setLanguage] = useState<Language>('fr');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('juristdz_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  
  const [userProfile, setUserProfile] = useState<EnhancedUserProfile | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Legacy state for backward compatibility
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cases, setCases] = useState<Case[]>([
    { id: '1', title: 'Litige Foncier El Madania', clientName: 'Mr. Ahmed B.', description: 'Contestation de titre de propriété datant de 2012.', createdAt: new Date(), status: 'active' },
    { id: '2', title: 'Divorce Benamrane', clientName: 'Mme. Sarah L.', description: 'Requête de khol et garde des enfants.', createdAt: new Date(), status: 'active' }
  ]);
  const [activeCaseId, setActiveCaseId] = useState<string>('1');

  useEffect(() => {
    const initApp = async () => {
      try {
        let userId = localStorage.getItem('juristdz_user_id');
        if (!userId) {
          userId = 'USR-' + Math.floor(Math.random() * 1000000);
          localStorage.setItem('juristdz_user_id', userId);
        }

        // Try to get existing profile
        const profile = await databaseService.getProfile(userId);
        
        let enhancedProfile: EnhancedUserProfile;
        
        if (profile) {
          // Convert legacy profile to enhanced profile
          enhancedProfile = {
            id: profile.id,
            email: profile.email,
            firstName: 'Maître',
            lastName: 'Demo',
            profession: mapLegacyRole(profile.role),
            registrationNumber: 'ALG-2024-001',
            barreauId: 'BARREAU-ALGER',
            organizationName: 'Cabinet Demo',
            phoneNumber: '+213 555 123 456',
            languages: ['fr', 'ar'],
            specializations: ['Droit Civil', 'Droit Commercial'],
            roles: [UserRole.AVOCAT, UserRole.NOTAIRE, UserRole.HUISSIER, UserRole.MAGISTRAT, UserRole.ETUDIANT, UserRole.JURISTE_ENTREPRISE, UserRole.ADMIN], // Demo: tous les rôles
            activeRole: UserRole.AVOCAT, // Toujours commencer par Avocat
            isActive: true,
            emailVerified: true,
            mfaEnabled: false
          };
        } else {
          // Create new enhanced profile
          enhancedProfile = {
            id: userId,
            email: 'maitre.demo@barreau.dz',
            firstName: 'Maître',
            lastName: 'Demo',
            profession: UserRole.AVOCAT,
            registrationNumber: 'ALG-2024-001',
            barreauId: 'BARREAU-ALGER',
            organizationName: 'Cabinet Demo',
            phoneNumber: '+213 555 123 456',
            languages: ['fr', 'ar'],
            specializations: ['Droit Civil', 'Droit Commercial'],
            roles: [UserRole.AVOCAT, UserRole.NOTAIRE, UserRole.HUISSIER, UserRole.MAGISTRAT, UserRole.ETUDIANT, UserRole.JURISTE_ENTREPRISE, UserRole.ADMIN], // Demo: tous les rôles
            activeRole: UserRole.AVOCAT,
            isActive: true,
            emailVerified: true,
            mfaEnabled: false
          };

          // Save legacy profile for backward compatibility
          const legacyProfile: UserStats = {
            id: userId,
            email: enhancedProfile.email,
            credits: 5,
            plan: 'free',
            isPro: false,
            role: 'admin',
            joinedAt: new Date()
          };
          await databaseService.upsertProfile(legacyProfile);
        }

        setUserProfile(enhancedProfile);
        
        // Initialize routing service
        routingService.setCurrentUser(enhancedProfile);
        
        // Set default mode for user's role
        const defaultMode = getDefaultMode(enhancedProfile.activeRole);
        setMode(defaultMode);
        
        setIsDataLoaded(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setAuthError('Failed to initialize application. Please refresh the page.');
        setIsDataLoaded(true);
      }
    };

    initApp();
  }, []);

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
    if (!userProfile) return;
    
    const updatedProfile = {
      ...userProfile,
      activeRole: newRole
    };
    
    setUserProfile(updatedProfile);
    routingService.setCurrentUser(updatedProfile);
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

  // Helper function to map legacy roles to new UserRole enum
  function mapLegacyRole(legacyRole: string): UserRole {
    switch (legacyRole) {
      case 'admin':
        return UserRole.ADMIN;
      case 'user':
        return UserRole.AVOCAT;
      case 'tester':
        return UserRole.ETUDIANT;
      default:
        return UserRole.AVOCAT;
    }
  }

  // Loading state
  if (!isDataLoaded) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-12 h-12 text-legal-gold animate-spin mb-4" />
        <p className="font-serif italic text-slate-400">Initialisation Cabinet JuristDZ...</p>
        <p className="text-xs text-slate-500 mt-2">Configuration du système de routage par rôle...</p>
      </div>
    );
  }

  // Error state
  if (authError || !userProfile) {
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
              {authError || 'Profil utilisateur non disponible'}
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
    id: userProfile.id,
    email: userProfile.email,
    credits: 5,
    plan: 'free',
    isPro: false,
    role: userProfile.activeRole === UserRole.ADMIN ? 'admin' : 'user',
    joinedAt: new Date()
  };

  return (
    <RoleBasedLayout
      user={userProfile}
      currentMode={currentMode}
      language={language}
      theme={theme}
      onModeChange={handleModeChange}
      onRoleSwitch={handleRoleSwitch}
      onLanguageChange={setLanguage}
      onThemeToggle={toggleTheme}
    >
      {currentMode === AppMode.DASHBOARD && (
        <Dashboard 
          language={language} 
          user={legacyUserStats} 
          enhancedUser={userProfile}
          setMode={setMode} 
          showSpecializedInterface={true}
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
      {currentMode === AppMode.RESEARCH && (
        <ChatInterface 
          language={language} 
          userId={userProfile.id} 
        />
      )}
      {currentMode === AppMode.DRAFTING && (
        <DraftingInterface 
          language={language} 
          userRole={userProfile.activeRole}
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
      {currentMode === AppMode.DOCS && (
        <Documentation 
          language={language} 
        />
      )}
    </RoleBasedLayout>
  );
};

export default App;
