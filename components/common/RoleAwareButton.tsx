import React from 'react';
import { UserRole } from '../../types';
import { hasFeatureAccess } from '../../config/roleRouting';

interface RoleAwareButtonProps {
  userRole: UserRole;
  requiredFeature?: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

/**
 * Role-aware button component
 * Automatically disables or hides based on user role permissions
 * Validates: Requirements 1.3 - Role-based access control for UI elements
 */
const RoleAwareButton: React.FC<RoleAwareButtonProps> = ({
  userRole,
  requiredFeature,
  children,
  onClick,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'md',
  tooltip
}) => {
  // Check if user has access to the required feature
  const hasAccess = requiredFeature ? hasFeatureAccess(userRole, requiredFeature) : true;
  
  // If no access, don't render the button
  if (!hasAccess) {
    return null;
  }

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-legal-blue hover:bg-legal-blue/90 text-white focus:ring-legal-blue/50 shadow-lg shadow-legal-blue/20',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 focus:ring-slate-500/50',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500/50 shadow-lg shadow-red-500/20',
    success: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500/50 shadow-lg shadow-green-500/20'
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed hover:bg-current';

  const finalClassName = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${disabled ? disabledClasses : 'hover:scale-[1.02] active:scale-[0.98]'}
    ${className}
  `.trim();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={finalClassName}
      title={tooltip}
    >
      {children}
    </button>
  );
};

export default RoleAwareButton;