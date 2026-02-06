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
  X,
  Menu,
  ChevronLeft,
  ChevronRight
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
 * RESPONSIVE Role-based layout component
 * Provides the main layout structure with role-specific navigation and features
 * Validates: Requirements 2.1-2.7 - Role-specific interface adaptation
 * FULLY RESPONSIVE: Mobile-first design with professional UX
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isLanguageTransitioning, setIsLanguageTransitioning] = useState(false);

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

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const menuButton = document.getElementById('mobile-menu-button');
      
      if (isMobileSidebarOpen && sidebar && menuButton && 
          !sidebar.contains(event.target as Node) && 
          !menuButton.contains(event.target as Node)) {
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileSidebarOpen]);

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileSidebarOpen]);

  const updateNavigationItems = () => {
    routingService.setLanguage(language);
    const items = routingService.getNavigationItems(language);
    setNavigationItems(items);
  };

  // Smooth language transition handler
  const handleLanguageTransition = (newLanguage: Language) => {
    setIsLanguageTransitioning(true);
    
    // Add a small delay for smooth visual transition
    setTimeout(() => {
      onLanguageChange(newLanguage);
      
      // Reset transition state after animation completes
      setTimeout(() => {
        setIsLanguageTransitioning(false);
      }, 300);
    }, 150);
  };

  const handleNavigation = (targetMode: AppMode) => {
    const result = routingService.navigateToMode(targetMode);
    
    if (result.success) {
      onModeChange(result.mode);
      setShowAccessDenied(false);
      // Close mobile sidebar after navigation
      setIsMobileSidebarOpen(false);
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
    <div className={`flex h-screen overflow-hidden font-sans transition-all duration-500 ease-in-out dir-transition ${
      theme === 'light' 
        ? 'bg-slate-50 text-slate-900' 
        : 'bg-slate-950 text-slate-100'
    } ${isLanguageTransitioning ? 'language-transitioning' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Mobile Header */}
      <div className={`md:hidden fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 border-b transition-colors ${
        theme === 'light' 
          ? 'bg-white/95 backdrop-blur-sm border-slate-200' 
          : 'bg-slate-900/95 backdrop-blur-sm border-slate-800'
      }`}>
        <button
          id="mobile-menu-button"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className={`p-2 rounded-xl transition-colors ${
            theme === 'light' 
              ? 'hover:bg-slate-100 active:bg-slate-200' 
              : 'hover:bg-slate-800 active:bg-slate-700'
          }`}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-legal-gold rounded-lg">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <h1 className={`font-bold text-lg truncate ${
            theme === 'light' ? 'text-slate-900' : 'text-white'
          }`}>
            {t.sidebar_title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Language Toggle */}
          <button 
            onClick={() => {
              const newLanguage = language === 'fr' ? 'ar' : 'fr';
              handleLanguageTransition(newLanguage);
            }}
            className={`language-toggle relative w-10 h-6 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-legal-gold focus:ring-offset-2 transform hover:scale-105 btn-press ${
              language === 'ar' 
                ? 'bg-legal-gold/20' 
                : 'bg-slate-200 dark:bg-slate-700'
            } ${isLanguageTransitioning ? 'language-button-active animate-pulse' : ''}`}
            dir="ltr"
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow-lg transition-all duration-500 ease-out transform ${
              language === 'ar' 
                ? 'translate-x-4 bg-legal-gold' 
                : 'translate-x-0.5 bg-white dark:bg-slate-300'
            } ${isLanguageTransitioning ? 'scale-110' : ''}`}>
              <Globe size={10} className={`absolute inset-0 m-auto transition-all duration-500 ${
                language === 'ar' ? 'text-white' : 'text-legal-gold'
              } ${isLanguageTransitioning ? 'animate-spin' : ''}`} />
            </div>
          </button>

          {/* Mobile Theme Toggle */}
          <button 
            onClick={onThemeToggle}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'light' 
                ? 'hover:bg-slate-100 active:bg-slate-200' 
                : 'hover:bg-slate-800 active:bg-slate-700'
            }`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div 
        id="mobile-sidebar"
        className={`md:hidden fixed top-0 ${isAr ? 'right-0' : 'left-0'} z-50 w-80 h-full transform transition-transform duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : (isAr ? 'translate-x-full' : '-translate-x-full')
        } ${
          theme === 'light' 
            ? 'bg-white border-slate-200' 
            : 'bg-slate-900 border-slate-800'
        } border-${isAr ? 'l' : 'r'} shadow-2xl`}
      >
        <MobileSidebarContent 
          user={user}
          navigationItems={navigationItems}
          currentMode={currentMode}
          language={language}
          theme={theme}
          isOnline={isOnline}
          onNavigation={handleNavigation}
          onRoleSwitch={handleRoleSwitchInternal}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden md:flex ${
        isDesktopSidebarCollapsed ? 'w-20' : 'w-80'
      } flex-col h-full shadow-xl flex-shrink-0 border-e transition-all duration-500 ease-in-out z-20 print:hidden ${
        theme === 'light' 
          ? 'bg-white border-slate-200' 
          : 'bg-slate-900 border-slate-800'
      } ${isLanguageTransitioning ? 'transform scale-[0.995] opacity-95' : 'transform scale-100 opacity-100'}`}>
        
        {/* Desktop Sidebar Header */}
        <div className={`p-6 border-b transition-colors ${
          theme === 'light' ? 'border-slate-100' : 'border-slate-700/50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-legal-gold rounded-xl shrink-0 shadow-lg shadow-legal-gold/20">
                <Scale className="w-6 h-6 text-white" />
              </div>
              {!isDesktopSidebarCollapsed && (
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
              )}
            </div>
            
            {/* Desktop Sidebar Collapse Toggle */}
            <button
              onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'light' 
                  ? 'hover:bg-slate-100 active:bg-slate-200' 
                  : 'hover:bg-slate-800 active:bg-slate-700'
              }`}
              title={isDesktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isDesktopSidebarCollapsed ? 
                (isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />) : 
                (isAr ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)
              }
            </button>
          </div>

          {/* Role Switcher - Hidden when collapsed */}
          {!isDesktopSidebarCollapsed && (
            <RoleSwitcher
              currentRole={user.activeRole}
              availableRoles={user.roles}
              language={language}
              onRoleSwitch={handleRoleSwitchInternal}
              theme={theme}
            />
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <RoleBasedNavigation
            navigationItems={navigationItems}
            currentMode={currentMode}
            userRole={user.activeRole}
            language={language}
            onNavigate={handleNavigation}
            theme={theme}
            isCollapsed={isDesktopSidebarCollapsed}
          />
        </div>

        {/* Desktop Footer Controls */}
        {!isDesktopSidebarCollapsed && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={onThemeToggle}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title={theme === 'light' ? (isAr ? 'الوضع المظلم' : 'Mode sombre') : (isAr ? 'الوضع المضيء' : 'Mode clair')}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              
              {/* Desktop Language Toggle Switch */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium transition-all duration-300 ${language === 'fr' ? 'text-legal-gold font-semibold' : 'text-slate-400'}`}>
                  Fr
                </span>
                <button 
                  onClick={() => {
                    const newLanguage = language === 'fr' ? 'ar' : 'fr';
                    handleLanguageTransition(newLanguage);
                  }}
                  className={`language-toggle relative w-12 h-6 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-legal-gold focus:ring-offset-2 dark:focus:ring-offset-slate-900 hover:shadow-md transform hover:scale-105 btn-press ${
                    language === 'ar' 
                      ? 'bg-legal-gold/20 hover:bg-legal-gold/30' 
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                  } ${isLanguageTransitioning ? 'language-button-active animate-pulse' : ''}`}
                  title={language === 'fr' ? 'Basculer vers l\'arabe' : 'التبديل إلى الفرنسية'}
                  dir="ltr"
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow-lg transition-all duration-500 ease-out transform ${
                    language === 'ar' 
                      ? 'translate-x-6 bg-legal-gold scale-110' 
                      : 'translate-x-0.5 bg-white dark:bg-slate-300 scale-100'
                  } ${isLanguageTransitioning ? 'scale-125' : ''}`}>
                    <Globe size={12} className={`absolute inset-0 m-auto transition-all duration-500 ${
                      language === 'ar' ? 'text-white' : 'text-legal-gold'
                    } ${isLanguageTransitioning ? 'animate-spin' : ''}`} />
                  </div>
                </button>
                <span className={`text-xs font-medium transition-all duration-300 ${language === 'ar' ? 'text-legal-gold font-semibold' : 'text-slate-400'}`}>
                  ع
                </span>
              </div>
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
        )}
      </div>

      {/* Main Content */}
      <main className={`flex-1 relative flex flex-col h-full overflow-y-auto transition-all duration-500 ease-in-out ${
        isMobileSidebarOpen ? 'md:ml-0' : ''
      } pt-16 md:pt-0`}>
        <div className={`transition-all duration-500 ease-in-out h-full ${
          isLanguageTransitioning 
            ? 'opacity-90 transform scale-[0.99] blur-[0.5px]' 
            : 'opacity-100 transform scale-100 blur-0'
        } ${language === 'ar' ? 'content-slide-in-rtl' : 'content-slide-in-ltr'}`}>
          {children}
        </div>
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

// Mobile Sidebar Content Component
const MobileSidebarContent: React.FC<{
  user: EnhancedUserProfile;
  navigationItems: NavigationItem[];
  currentMode: AppMode;
  language: Language;
  theme: 'light' | 'dark';
  isOnline: boolean;
  onNavigation: (mode: AppMode) => void;
  onRoleSwitch: (role: UserRole) => void;
  onClose: () => void;
}> = ({ user, navigationItems, currentMode, language, theme, isOnline, onNavigation, onRoleSwitch, onClose }) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';

  return (
    <div className="flex flex-col h-full">
      {/* Mobile Header */}
      <div className={`p-6 border-b ${
        theme === 'light' ? 'border-slate-100' : 'border-slate-700/50'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-legal-gold rounded-xl shrink-0 shadow-lg shadow-legal-gold/20">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`font-bold text-xl tracking-tight ${
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
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'light' 
                ? 'hover:bg-slate-100 active:bg-slate-200' 
                : 'hover:bg-slate-800 active:bg-slate-700'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile Role Switcher */}
        <RoleSwitcher
          currentRole={user.activeRole}
          availableRoles={user.roles}
          language={language}
          onRoleSwitch={onRoleSwitch}
          theme={theme}
        />
      </div>

      {/* Mobile Navigation */}
      <div className="flex-1 p-4 overflow-y-auto">
        <RoleBasedNavigation
          navigationItems={navigationItems}
          currentMode={currentMode}
          userRole={user.activeRole}
          language={language}
          onNavigate={onNavigation}
          theme={theme}
        />
      </div>

      {/* Mobile Footer */}
      <div className={`p-4 border-t ${
        theme === 'light' ? 'border-slate-200' : 'border-slate-700'
      }`}>
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
  );
};

export default RoleBasedLayout;