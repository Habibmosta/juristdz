import React from 'react';
import { UserRole } from '../../types';
import { hasFeatureAccess } from '../../config/roleRouting';
import { Lock } from 'lucide-react';

interface RoleAwareCardProps {
  userRole: UserRole;
  requiredFeature?: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  showLocked?: boolean;
  lockedMessage?: string;
  theme?: 'light' | 'dark';
}

/**
 * Role-aware card component
 * Shows content based on user role permissions, with locked state for restricted content
 * Validates: Requirements 1.3 - Role-based access control for UI components
 */
const RoleAwareCard: React.FC<RoleAwareCardProps> = ({
  userRole,
  requiredFeature,
  children,
  className = '',
  title,
  description,
  showLocked = true,
  lockedMessage,
  theme = 'light'
}) => {
  const hasAccess = requiredFeature ? hasFeatureAccess(userRole, requiredFeature) : true;

  const baseClasses = `rounded-2xl border transition-all duration-200 ${
    theme === 'light' 
      ? 'bg-white border-slate-200' 
      : 'bg-slate-900 border-slate-800'
  }`;

  // If no access and showLocked is false, don't render
  if (!hasAccess && !showLocked) {
    return null;
  }

  // Render locked state
  if (!hasAccess && showLocked) {
    return (
      <div className={`${baseClasses} ${className} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-slate-200/50 dark:from-slate-800/50 dark:to-slate-900/50 backdrop-blur-sm z-10" />
        
        <div className="relative z-20 p-6">
          {title && (
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-xl">
                <Lock className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-600 dark:text-slate-400">
                  {title}
                </h3>
                {description && (
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    {description}
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">
                  Fonctionnalité Restreinte
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  {lockedMessage || `Cette fonctionnalité n'est pas disponible pour le rôle ${userRole}`}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Blurred content preview */}
        <div className="absolute inset-0 z-0 opacity-30 blur-sm pointer-events-none">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Render normal accessible content
  return (
    <div className={`${baseClasses} ${className} hover:shadow-lg hover:border-legal-gold/20`}>
      {title && (
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-lg">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className={title ? 'p-6' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export default RoleAwareCard;