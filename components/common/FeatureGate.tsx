import React from 'react';
import { UserRole } from '../../types';
import { hasFeatureAccess } from '../../config/roleRouting';

interface FeatureGateProps {
  userRole: UserRole;
  requiredFeature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Feature gate component
 * Conditionally renders content based on user role permissions
 * Validates: Requirements 1.3 - Role-based feature access control
 */
const FeatureGate: React.FC<FeatureGateProps> = ({
  userRole,
  requiredFeature,
  children,
  fallback,
  showFallback = false
}) => {
  const hasAccess = hasFeatureAccess(userRole, requiredFeature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  return null;
};

export default FeatureGate;