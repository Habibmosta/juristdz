import React from 'react';
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  ShieldCheck, 
  Briefcase, 
  Settings, 
  Book,
  Crown,
  GraduationCap,
  Building,
  Gavel,
  FileSignature,
  Scale
} from 'lucide-react';
import { AppMode, UserRole, Language } from '../types';
import { NavigationItem } from '../services/routingService';
import { UI_TRANSLATIONS } from '../constants';

interface RoleBasedNavigationProps {
  navigationItems: NavigationItem[];
  currentMode: AppMode;
  userRole: UserRole;
  language: Language;
  onNavigate: (mode: AppMode) => void;
  theme: 'light' | 'dark';
  isCollapsed?: boolean; // NEW: Support for collapsed sidebar
}

/**
 * RESPONSIVE Role-based navigation component
 * Renders navigation menu adapted to user's role and permissions
 * Validates: Requirements 2.1-2.7 - Role-specific interface elements
 * FULLY RESPONSIVE: Supports collapsed mode and mobile layouts
 */
const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  navigationItems,
  currentMode,
  userRole,
  language,
  onNavigate,
  theme,
  isCollapsed = false
}) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';

  // Icon mapping
  const iconMap = {
    LayoutDashboard,
    Search,
    FileText,
    ShieldCheck,
    Briefcase,
    Settings,
    Book
  };

  // Role-specific styling
  const getRoleStyles = (role: UserRole) => {
    const styles = {
      [UserRole.AVOCAT]: {
        primary: 'bg-legal-blue',
        secondary: 'text-legal-blue',
        accent: 'border-legal-blue',
        icon: Scale,
        gradient: 'from-legal-blue to-legal-blue/80'
      },
      [UserRole.NOTAIRE]: {
        primary: 'bg-amber-600',
        secondary: 'text-amber-600',
        accent: 'border-amber-600',
        icon: FileSignature,
        gradient: 'from-amber-600 to-amber-500'
      },
      [UserRole.HUISSIER]: {
        primary: 'bg-green-600',
        secondary: 'text-green-600',
        accent: 'border-green-600',
        icon: Gavel,
        gradient: 'from-green-600 to-green-500'
      },
      [UserRole.MAGISTRAT]: {
        primary: 'bg-purple-600',
        secondary: 'text-purple-600',
        accent: 'border-purple-600',
        icon: Crown,
        gradient: 'from-purple-600 to-purple-500'
      },
      [UserRole.ETUDIANT]: {
        primary: 'bg-blue-500',
        secondary: 'text-blue-500',
        accent: 'border-blue-500',
        icon: GraduationCap,
        gradient: 'from-blue-500 to-blue-400'
      },
      [UserRole.JURISTE_ENTREPRISE]: {
        primary: 'bg-indigo-600',
        secondary: 'text-indigo-600',
        accent: 'border-indigo-600',
        icon: Building,
        gradient: 'from-indigo-600 to-indigo-500'
      },
      [UserRole.ADMIN]: {
        primary: 'bg-red-600',
        secondary: 'text-red-600',
        accent: 'border-red-600',
        icon: Settings,
        gradient: 'from-red-600 to-red-500'
      }
    };

    return styles[role] || styles[UserRole.AVOCAT];
  };

  const roleStyles = getRoleStyles(userRole);
  const RoleIcon = roleStyles.icon;

  // Get role-specific labels
  const getRoleSpecificLabels = (role: UserRole) => {
    const labels = {
      [UserRole.AVOCAT]: {
        title: isAr ? 'مكتب المحاماة' : 'Cabinet d\'Avocat',
        subtitle: isAr ? 'نظام إدارة قانونية' : 'Système Juridique',
        short: isAr ? 'محاماة' : 'Avocat'
      },
      [UserRole.NOTAIRE]: {
        title: isAr ? 'مكتب التوثيق' : 'Étude Notariale',
        subtitle: isAr ? 'العقود والتوثيق' : 'Actes & Authentification',
        short: isAr ? 'توثيق' : 'Notaire'
      },
      [UserRole.HUISSIER]: {
        title: isAr ? 'مكتب التنفيذ' : 'Étude d\'Huissier',
        subtitle: isAr ? 'التبليغ والتنفيذ' : 'Signification & Exécution',
        short: isAr ? 'تنفيذ' : 'Huissier'
      },
      [UserRole.MAGISTRAT]: {
        title: isAr ? 'مكتب القضاء' : 'Bureau Magistrat',
        subtitle: isAr ? 'الأحكام والقرارات' : 'Jugements & Décisions',
        short: isAr ? 'قضاء' : 'Magistrat'
      },
      [UserRole.ETUDIANT]: {
        title: isAr ? 'طالب القانون' : 'Étudiant en Droit',
        subtitle: isAr ? 'التعلم والممارسة' : 'Apprentissage & Pratique',
        short: isAr ? 'طالب' : 'Étudiant'
      },
      [UserRole.JURISTE_ENTREPRISE]: {
        title: isAr ? 'المستشار القانوني' : 'Juriste d\'Entreprise',
        subtitle: isAr ? 'الامتثال والعقود' : 'Conformité & Contrats',
        short: isAr ? 'مستشار' : 'Juriste'
      },
      [UserRole.ADMIN]: {
        title: isAr ? 'إدارة النظام' : 'Administration',
        subtitle: isAr ? 'إعدادات المنصة' : 'Gestion Plateforme',
        short: isAr ? 'إدارة' : 'Admin'
      }
    };

    return labels[role] || labels[UserRole.AVOCAT];
  };

  const roleLabels = getRoleSpecificLabels(userRole);

  return (
    <nav className="space-y-1">
      {/* Role Header - Responsive */}
      <div className={`${
        isCollapsed ? 'p-2' : 'p-4'
      } rounded-2xl border-2 ${roleStyles.accent} bg-gradient-to-r ${roleStyles.gradient} text-white mb-6 transition-all duration-300`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className={`${
            isCollapsed ? 'p-1' : 'p-2'
          } bg-white/20 rounded-xl transition-all duration-300`}>
            <RoleIcon className={`${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'}`} />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm truncate">{roleLabels.title}</h3>
              <p className="text-xs opacity-80 truncate">{roleLabels.subtitle}</p>
            </div>
          )}
        </div>
        
        {/* Collapsed mode tooltip */}
        {isCollapsed && (
          <div className="mt-2 text-center">
            <p className="text-[10px] opacity-80 truncate">{roleLabels.short}</p>
          </div>
        )}
      </div>

      {/* Navigation Items - Responsive */}
      <div className="space-y-1">
        {navigationItems.map((item) => {
          const IconComponent = iconMap[item.icon as keyof typeof iconMap] || LayoutDashboard;
          const isActive = item.mode === currentMode;
          
          return (
            <div key={item.mode} className="relative group">
              <button
                onClick={() => onNavigate(item.mode)}
                disabled={!item.isAccessible}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                } rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? `${roleStyles.primary} text-white shadow-lg` 
                    : theme === 'light' 
                      ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                } ${
                  !item.isAccessible 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer hover:scale-[1.02]'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={`${
                  isCollapsed ? 'p-1' : 'p-1'
                } rounded-lg ${
                  isActive 
                    ? 'bg-white/20' 
                    : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-700'
                } transition-all duration-200`}>
                  <IconComponent size={isCollapsed ? 20 : 18} />
                </div>
                
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <span className="font-medium text-sm truncate block">{item.label}</span>
                    {item.badge && (
                      <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs rounded-full ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : `${roleStyles.primary} text-white`
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Role-specific indicators */}
                {!isCollapsed && getRoleSpecificIndicator(item.mode, userRole) && (
                  <div className="text-xs opacity-60 shrink-0">
                    {getRoleSpecificIndicator(item.mode, userRole)}
                  </div>
                )}
              </button>

              {/* Collapsed mode tooltip */}
              {isCollapsed && (
                <div className={`absolute ${
                  isAr ? 'right-full mr-2' : 'left-full ml-2'
                } top-1/2 -translate-y-1/2 z-50 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap`}>
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded">
                      {item.badge}
                    </span>
                  )}
                  {/* Tooltip arrow */}
                  <div className={`absolute top-1/2 -translate-y-1/2 ${
                    isAr ? 'left-full' : 'right-full'
                  } w-0 h-0 border-4 ${
                    isAr 
                      ? 'border-l-slate-900 border-y-transparent border-r-transparent' 
                      : 'border-r-slate-900 border-y-transparent border-l-transparent'
                  }`}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Role-specific quick actions - Hidden when collapsed */}
      {!isCollapsed && getRoleQuickActions(userRole, theme, roleStyles, language)}
    </nav>
  );
};

/**
 * Get role-specific indicators for navigation items
 */
function getRoleSpecificIndicator(mode: AppMode, role: UserRole): string | null {
  const indicators: Record<UserRole, Partial<Record<AppMode, string>>> = {
    [UserRole.AVOCAT]: {
      [AppMode.CASES]: 'V2',
      [AppMode.DRAFTING]: 'Pro'
    },
    [UserRole.NOTAIRE]: {
      [AppMode.DRAFTING]: 'Actes'
    },
    [UserRole.HUISSIER]: {
      [AppMode.DRAFTING]: 'Exploits'
    },
    [UserRole.MAGISTRAT]: {
      [AppMode.RESEARCH]: 'Avancé'
    },
    [UserRole.ETUDIANT]: {
      [AppMode.RESEARCH]: 'Éducatif',
      [AppMode.DOCS]: 'Cours'
    },
    [UserRole.JURISTE_ENTREPRISE]: {
      [AppMode.ANALYSIS]: 'Conformité'
    },
    [UserRole.ADMIN]: {
      [AppMode.ADMIN]: 'Système'
    }
  };

  return indicators[role]?.[mode] || null;
}

/**
 * Get role-specific quick actions - RESPONSIVE
 */
function getRoleQuickActions(
  role: UserRole, 
  theme: 'light' | 'dark',
  roleStyles: any,
  language: Language
): React.ReactNode {
  const isAr = language === 'ar';
  
  const quickActions: Record<UserRole, React.ReactNode> = {
    [UserRole.AVOCAT]: (
      <div className="mt-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-colors">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
          {isAr ? 'إجراءات سريعة' : 'Actions Rapides'}
        </p>
        <div className="space-y-1">
          <button className="w-full text-left text-xs text-slate-500 hover:text-legal-blue transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
            {isAr ? '+ ملف جديد' : '+ Nouveau Dossier'}
          </button>
          <button className="w-full text-left text-xs text-slate-500 hover:text-legal-blue transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
            {isAr ? '+ بحث سريع' : '+ Recherche Express'}
          </button>
        </div>
      </div>
    ),
    [UserRole.NOTAIRE]: (
      <div className="mt-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-colors">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
          {isAr ? 'دفتر التوثيق' : 'Minutier'}
        </p>
        <div className="space-y-1">
          <button className="w-full text-left text-xs text-slate-500 hover:text-amber-600 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
            {isAr ? '+ عقد جديد' : '+ Nouvel Acte'}
          </button>
          <button className="w-full text-left text-xs text-slate-500 hover:text-amber-600 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
            {isAr ? 'بحث في الأرشيف' : 'Rechercher Archive'}
          </button>
        </div>
      </div>
    ),
    [UserRole.ETUDIANT]: (
      <div className="mt-6 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 transition-colors">
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
          {isAr ? 'وضع التعلم' : 'Mode Apprentissage'}
        </p>
        <div className="space-y-1">
          <button className="w-full text-left text-xs text-blue-500 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/30">
            {isAr ? '📚 درس اليوم' : '📚 Cours du Jour'}
          </button>
          <button className="w-full text-left text-xs text-blue-500 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/30">
            {isAr ? '🎯 تمارين' : '🎯 Exercices'}
          </button>
        </div>
      </div>
    ),
    [UserRole.ADMIN]: (
      <div className="mt-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 transition-colors">
        <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
          {isAr ? 'النظام' : 'Système'}
        </p>
        <div className="space-y-1">
          <button className="w-full text-left text-xs text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-100 dark:hover:bg-red-800/30">
            {isAr ? '⚡ حالة الخوادم' : '⚡ État Serveurs'}
          </button>
          <button className="w-full text-left text-xs text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-100 dark:hover:bg-red-800/30">
            {isAr ? '👥 المستخدمون النشطون' : '👥 Utilisateurs Actifs'}
          </button>
        </div>
      </div>
    ),
    [UserRole.HUISSIER]: null,
    [UserRole.MAGISTRAT]: null,
    [UserRole.JURISTE_ENTREPRISE]: null
  };

  return quickActions[role];
}

export default RoleBasedNavigation;