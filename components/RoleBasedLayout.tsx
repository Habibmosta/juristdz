import React, { useState, useEffect } from 'react';
import { AppMode, UserRole, Language, EnhancedUserProfile } from '../types';
import { routingService, NavigationItem } from '../services/routingService';
import RoleBasedNavigation from './RoleBasedNavigation';
import RoleSwitcher from './RoleSwitcher';
import { 
  Scale, 
  Wifi, 
  WifiOff, 
  Sun, 
  Moon, 
  Globe,
  AlertTriangle,
  Shield,
  X
} from 'lucide-react';
import { UI_TRANSLATIONS } from '../constants';

interface RoleBasedLayoutProps {
  user: EnhancedUserProfile;
  currentMode: AppMode;
  language: Language;
  theme: 'light' | 'dark';
  onModeChange: (mode: AppMode) => void;
  onRoleSwitch: (newRole: UserRole) => void;
  onLanguageChange: (lang: Language) => void;
  onThemeToggle: () => void;
  children: React.ReactNode;
}

/**
 * Role-based layout component
 * Provides the main layout structure with role-specific navigation and features
 * Validates: Requirements 2.1-2.7 - Role-specific interface adaptation
 */
const RoleBasedLayout: React.FC<RoleBasedLayoutProps> = ({
  user,
  currentMode,
  language,
  theme,
  onModeChange,
  onRoleSwitch,
  onLanguageChange,
  onThemeToggle,
  children
}) => {
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('');

  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';

  // Initialize routing service with current user
  useEffect(() => {
    routingService.setCurrentUser(user);
    updateNavigationItems();
  }, [user]);

  // Update navigation items when user role changes
  useEffect(() => {
    updateNavigationItems();
  }, [user.activeRole, currentMode, language]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateNavigationItems = () => {
    routingService.setLanguage(language);
    const items = routingService.getNavigationItems(language);
    setNavigationItems(items);
  };

  const handleNavigation = (targetMode: AppMode) => {
    const result = routingService.navigateToMode(targetMode);
    
    if (result.success) {
      onModeChange(result.mode);
      setShowAccessDenied(false);
    } else {
      setAccessDeniedMessage(result.error || 'Access denied');
      setShowAccessDenied(true);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowAccessDenied(false);
      }, 3000);
    }
  };

  const handleRoleSwitchInternal = (newRole: UserRole) => {
    const result = routingService.switchRole(newRole);
    
    if (result.success) {
      onRoleSwitch(newRole);
      onModeChange(result.mode);
      updateNavigationItems();
    } else {
      setAccessDeniedMessage(result.error || 'Role switch failed');
      setShowAccessDenied(true);
      
      setTimeout(() => {
        setShowAccessDenied(false);
      }, 3000);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${
      theme === 'light' 
        ? 'bg-slate-50 text-slate-900' 
        : 'bg-slate-950 text-slate-100'
    }`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Sidebar */}
      <div className={`hidden md:flex w-80 flex-col h-full shadow-xl flex-shrink-0 border-e transition-all duration-300 z-20 print:hidden ${
        theme === 'light' 
          ? 'bg-white border-slate-200' 
          : 'bg-slate-900 border-slate-800'
      }`}>
        
        {/* Header */}
        <div className={`p-6 border-b transition-colors ${
          theme === 'light' ? 'border-slate-100' : 'border-slate-700/50'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-legal-gold rounded-xl shrink-0 shadow-lg shadow-legal-gold/20">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div className="overflow-hidden">
              <h1 className={`font-bold text-xl tracking-tight truncate leading-tight ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                {t.sidebar_title}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">
                  {isOnline ? (isAr ? 'متصل' : 'En ligne') : (isAr ? 'غير متصل' : 'Hors-ligne')}
                </span>
              </div>
            </div>
          </div>

          {/* Role Switcher */}
          <RoleSwitcher
            currentRole={user.activeRole}
            availableRoles={user.roles}
            language={language}
            onRoleSwitch={handleRoleSwitchInternal}
            theme={theme}
          />
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <RoleBasedNavigation
            navigationItems={navigationItems}
            currentMode={currentMode}
            userRole={user.activeRole}
            language={language}
            onNavigate={handleNavigation}
            theme={theme}
          />
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onThemeToggle}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={theme === 'light' ? (isAr ? 'الوضع المظلم' : 'Mode sombre') : (isAr ? 'الوضع المضيء' : 'Mode clair')}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            
            <button 
              onClick={() => {
                const newLanguage = language === 'fr' ? 'ar' : 'fr';
                console.log(`🔧 Language switch requested: ${language} -> ${newLanguage}`);
                onLanguageChange(newLanguage);
              }}
              className="px-3 py-1.5 text-xs font-bold border rounded-lg hover:border-legal-gold transition-colors uppercase"
            >
              {language}
            </button>
            
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <Globe size={16} />
            </button>
          </div>

          {/* Security Notice */}
          <div className={`p-3 rounded-xl border ${
            theme === 'light' 
              ? 'bg-slate-50 border-slate-100' 
              : 'bg-slate-800 border-slate-700'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={12} className="text-legal-gold" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                {isAr ? 'وضع آمن' : 'Mode Sécurisé'}
              </span>
            </div>
            <p className="text-[8px] text-slate-400 leading-tight">
              {isAr 
                ? 'جميع البيانات محمية ومشفرة. تحقق دائماً من الجريدة الرسمية.'
                : 'Données protégées et chiffrées. Vérifiez toujours avec le JORA.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        {children}
      </main>

      {/* Access Denied Modal */}
      {showAccessDenied && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`max-w-md w-full rounded-2xl shadow-2xl overflow-hidden ${
            theme === 'light' ? 'bg-white' : 'bg-slate-900'
          }`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {isAr ? 'وصول مرفوض' : 'Accès Refusé'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {isAr ? 'ليس لديك صلاحية للوصول' : 'Permissions insuffisantes'}
                  </p>
                </div>
                <button
                  onClick={() => setShowAccessDenied(false)}
                  className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {accessDeniedMessage}
                </p>
              </div>
              
              <p className="text-xs text-slate-500 text-center">
                {isAr 
                  ? 'يمكنك تبديل دورك أو الاتصال بالمدير للحصول على صلاحيات إضافية.'
                  : 'Vous pouvez changer de rôle ou contacter l\'administrateur pour obtenir des permissions supplémentaires.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 right-4 z-40 bg-red-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom duration-300">
          <WifiOff size={16} />
          <span className="text-sm font-medium">
            {isAr ? 'غير متصل' : 'Hors ligne'}
          </span>
        </div>
      )}
    </div>
  );
};

export default RoleBasedLayout;