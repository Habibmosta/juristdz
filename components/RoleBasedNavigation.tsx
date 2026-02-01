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
}

/**
 * Role-based navigation component
 * Renders navigation menu adapted to user's role and permissions
 * Validates: Requirements 2.1-2.7 - Role-specific interface elements
 */
const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  navigationItems,
  currentMode,
  userRole,
  language,
  onNavigate,
  theme
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
        icon: Scale
      },
      [UserRole.NOTAIRE]: {
        primary: 'bg-amber-600',
        secondary: 'text-amber-600',
        accent: 'border-amber-600',
        icon: FileSignature
      },
      [UserRole.HUISSIER]: {
        primary: 'bg-green-600',
        secondary: 'text-green-600',
        accent: 'border-green-600',
        icon: Gavel
      },
      [UserRole.MAGISTRAT]: {
        primary: 'bg-purple-600',
        secondary: 'text-purple-600',
        accent: 'border-purple-600',
        icon: Crown
      },
      [UserRole.ETUDIANT]: {
        primary: 'bg-blue-500',
        secondary: 'text-blue-500',
        accent: 'border-blue-500',
        icon: GraduationCap
      },
      [UserRole.JURISTE_ENTREPRISE]: {
        primary: 'bg-indigo-600',
        secondary: 'text-indigo-600',
        accent: 'border-indigo-600',
        icon: Building
      },
      [UserRole.ADMIN]: {
        primary: 'bg-red-600',
        secondary: 'text-red-600',
        accent: 'border-red-600',
        icon: Settings
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
        subtitle: isAr ? 'نظام إدارة قانونية' : 'Système Juridique'
      },
      [UserRole.NOTAIRE]: {
        title: isAr ? 'مكتب التوثيق' : 'Étude Notariale',
        subtitle: isAr ? 'العقود والتوثيق' : 'Actes & Authentification'
      },
      [UserRole.HUISSIER]: {
        title: isAr ? 'مكتب التنفيذ' : 'Étude d\'Huissier',
        subtitle: isAr ? 'التبليغ والتنفيذ' : 'Signification & Exécution'
      },
      [UserRole.MAGISTRAT]: {
        title: isAr ? 'مكتب القضاء' : 'Bureau Magistrat',
        subtitle: isAr ? 'الأحكام والقرارات' : 'Jugements & Décisions'
      },
      [UserRole.ETUDIANT]: {
        title: isAr ? 'طالب القانون' : 'Étudiant en Droit',
        subtitle: isAr ? 'التعلم والممارسة' : 'Apprentissage & Pratique'
      },
      [UserRole.JURISTE_ENTREPRISE]: {
        title: isAr ? 'المستشار القانوني' : 'Juriste d\'Entreprise',
        subtitle: isAr ? 'الامتثال والعقود' : 'Conformité & Contrats'
      },
      [UserRole.ADMIN]: {
        title: isAr ? 'إدارة النظام' : 'Administration',
        subtitle: isAr ? 'إعدادات المنصة' : 'Gestion Plateforme'
      }
    };

    return labels[role] || labels[UserRole.AVOCAT];
  };

  const roleLabels = getRoleSpecificLabels(userRole);

  return (
    <nav className="space-y-1">
      {/* Role Header */}
      <div className={`p-4 rounded-2xl border-2 ${roleStyles.accent} bg-gradient-to-r ${roleStyles.primary} text-white mb-6`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <RoleIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm">{roleLabels.title}</h3>
            <p className="text-xs opacity-80">{roleLabels.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="space-y-1">
        {navigationItems.map((item) => {
          const IconComponent = iconMap[item.icon as keyof typeof iconMap] || LayoutDashboard;
          const isActive = item.mode === currentMode;
          
          return (
            <button
              key={item.mode}
              onClick={() => onNavigate(item.mode)}
              disabled={!item.isAccessible}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? `${roleStyles.primary} text-white shadow-lg shadow-${roleStyles.primary}/20` 
                  : theme === 'light' 
                    ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              } ${
                !item.isAccessible 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:scale-[1.02]'
              }`}
            >
              <div className={`p-1 rounded-lg ${
                isActive 
                  ? 'bg-white/20' 
                  : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-700'
              }`}>
                <IconComponent size={18} />
              </div>
              
              <div className="flex-1 text-left">
                <span className="font-medium text-sm">{item.label}</span>
                {item.badge && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : `bg-${roleStyles.primary} text-white`
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Role-specific indicators */}
              {getRoleSpecificIndicator(item.mode, userRole) && (
                <div className="text-xs opacity-60">
                  {getRoleSpecificIndicator(item.mode, userRole)}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Role-specific quick actions */}
      {getRoleQuickActions(userRole, theme, roleStyles, language)}
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
 * Get role-specific quick actions
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
      <div className="mt-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
          {isAr ? 'إجراءات سريعة' : 'Actions Rapides'}
        </p>
        <div className="space-y-1">
          <button className="w-full text-left text-xs text-slate-500 hover:text-legal-blue transition-colors">
            {isAr ? '+ ملف جديد' : '+ Nouveau Dossier'}
          </button>
          <button className="w-full text-left text-xs text-slate-500 hover:text-legal-blue transition-colors">
            {isAr ? '+ بحث سريع' : '+ Recherche Express'}
          </button>
        </div>
      </div>
    ),
    [UserRole.NOTAIRE]: (
      <div className="mt-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
          {isAr ? 'دفتر التوثيق' : 'Minutier'}
        </p>
        <div className="space-y-1">
          <button className="w-full text-left text-xs text-slate-500 hover:text-amber-600 transition-colors">
            {isAr ? '+ عقد جديد' : '+ Nouvel Acte'}
          </button>
          <button className="w-full text-left text-xs text-slate-500 hover:text-amber-600 transition-colors">
            {isAr ? 'بحث في الأرشيف' : 'Rechercher Archive'}
          </button>
        </div>
      </div>
    ),
    [UserRole.ETUDIANT]: (
      <div className="mt-6 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
          {isAr ? 'وضع التعلم' : 'Mode Apprentissage'}
        </p>
        <div className="space-y-1">
          <button className="w-full text-left text-xs text-blue-500 hover:text-blue-700 transition-colors">
            {isAr ? '📚 درس اليوم' : '📚 Cours du Jour'}
          </button>
          <button className="w-full text-left text-xs text-blue-500 hover:text-blue-700 transition-colors">
            {isAr ? '🎯 تمارين' : '🎯 Exercices'}
          </button>
        </div>
      </div>
    ),
    [UserRole.ADMIN]: (
      <div className="mt-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
          {isAr ? 'النظام' : 'Système'}
        </p>
        <div className="space-y-1">
          <button className="w-full text-left text-xs text-red-500 hover:text-red-700 transition-colors">
            {isAr ? '⚡ حالة الخوادم' : '⚡ État Serveurs'}
          </button>
          <button className="w-full text-left text-xs text-red-500 hover:text-red-700 transition-colors">
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