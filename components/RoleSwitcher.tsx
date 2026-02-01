import React, { useState } from 'react';
import { 
  ChevronDown, 
  Scale, 
  FileSignature, 
  Gavel, 
  Crown, 
  GraduationCap, 
  Building, 
  Settings,
  Check,
  ArrowRight
} from 'lucide-react';
import { UserRole, Language } from '../types';

interface RoleSwitcherProps {
  currentRole: UserRole;
  availableRoles: UserRole[];
  language: Language;
  onRoleSwitch: (newRole: UserRole) => void;
  theme: 'light' | 'dark';
}

/**
 * Role switcher component for multi-role users
 * Allows users to switch between their assigned roles
 * Validates: Requirements 1.4 - Multi-role user management
 */
const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  availableRoles,
  language,
  onRoleSwitch,
  theme
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isAr = language === 'ar';

  // Only show if user has multiple roles
  if (availableRoles.length <= 1) {
    return null;
  }

  // Role configurations
  const roleConfigs = {
    [UserRole.AVOCAT]: {
      label: isAr ? 'محامي' : 'Avocat',
      description: isAr ? 'مكتب المحاماة' : 'Cabinet d\'Avocat',
      icon: Scale,
      color: 'legal-blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    [UserRole.NOTAIRE]: {
      label: isAr ? 'موثق' : 'Notaire',
      description: isAr ? 'مكتب التوثيق' : 'Étude Notariale',
      icon: FileSignature,
      color: 'amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800'
    },
    [UserRole.HUISSIER]: {
      label: isAr ? 'محضر قضائي' : 'Huissier',
      description: isAr ? 'مكتب التنفيذ' : 'Étude d\'Huissier',
      icon: Gavel,
      color: 'green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    [UserRole.MAGISTRAT]: {
      label: isAr ? 'قاضي' : 'Magistrat',
      description: isAr ? 'مكتب القضاء' : 'Bureau Magistrat',
      icon: Crown,
      color: 'purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    [UserRole.ETUDIANT]: {
      label: isAr ? 'طالب' : 'Étudiant',
      description: isAr ? 'طالب القانون' : 'Étudiant en Droit',
      icon: GraduationCap,
      color: 'blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-500 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    [UserRole.JURISTE_ENTREPRISE]: {
      label: isAr ? 'مستشار قانوني' : 'Juriste',
      description: isAr ? 'المستشار القانوني' : 'Juriste d\'Entreprise',
      icon: Building,
      color: 'indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-200 dark:border-indigo-800'
    },
    [UserRole.ADMIN]: {
      label: isAr ? 'مدير' : 'Admin',
      description: isAr ? 'إدارة النظام' : 'Administration',
      icon: Settings,
      color: 'red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800'
    }
  };

  const currentConfig = roleConfigs[currentRole];
  const CurrentIcon = currentConfig.icon;

  const handleRoleSwitch = (newRole: UserRole) => {
    setIsOpen(false);
    onRoleSwitch(newRole);
  };

  return (
    <div className="relative">
      {/* Current Role Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${
          currentConfig.borderColor
        } ${currentConfig.bgColor} hover:shadow-lg group`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-white/50 dark:bg-black/20 ${currentConfig.textColor}`}>
            <CurrentIcon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className={`font-bold text-sm ${currentConfig.textColor}`}>
              {currentConfig.label}
            </p>
            <p className="text-xs opacity-70">
              {currentConfig.description}
            </p>
          </div>
        </div>
        
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${currentConfig.textColor}`} 
        />
      </button>

      {/* Role Selection Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className={`absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border shadow-2xl overflow-hidden ${
            theme === 'light' 
              ? 'bg-white border-slate-200' 
              : 'bg-slate-900 border-slate-700'
          }`}>
            <div className="p-2">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {isAr ? 'تبديل الدور' : 'Changer de Rôle'}
                </p>
              </div>
              
              <div className="space-y-1 mt-2">
                {availableRoles.map((role) => {
                  const config = roleConfigs[role];
                  const RoleIcon = config.icon;
                  const isCurrentRole = role === currentRole;
                  
                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      disabled={isCurrentRole}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                        isCurrentRole
                          ? `${config.bgColor} ${config.textColor} cursor-default`
                          : theme === 'light'
                            ? 'hover:bg-slate-50 text-slate-700'
                            : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        isCurrentRole 
                          ? 'bg-white/50 dark:bg-black/20' 
                          : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'
                      } ${isCurrentRole ? config.textColor : ''}`}>
                        <RoleIcon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">
                          {config.label}
                        </p>
                        <p className="text-xs opacity-70">
                          {config.description}
                        </p>
                      </div>
                      
                      {isCurrentRole ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  {isAr 
                    ? 'سيتم إعادة توجيهك إلى الواجهة المناسبة' 
                    : 'Vous serez redirigé vers l\'interface appropriée'
                  }
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RoleSwitcher;