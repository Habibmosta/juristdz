import { AppMode, UserRole, EnhancedUserProfile, Language } from '../types';
import { 
  canAccessMode, 
  getDefaultMode, 
  hasFeatureAccess, 
  getAllowedModes,
  ROLE_INTERFACE_CONFIG 
} from '../config/roleRouting';
import { UI_TRANSLATIONS } from '../constants';

/**
 * Role-based routing service
 * Handles navigation permissions and role-specific routing logic
 * Validates: Requirements 2.1-2.7 - Role-specific interface adaptation
 */
export class RoutingService {
  private currentUser: EnhancedUserProfile | null = null;
  private currentMode: AppMode = AppMode.DASHBOARD;
  private navigationHistory: AppMode[] = [];
  private currentLanguage: Language = 'fr';

  /**
   * Set the current language for translations
   */
  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  /**
   * Set the current user and initialize routing
   */
  setCurrentUser(user: EnhancedUserProfile): void {
    this.currentUser = user;
    this.currentMode = getDefaultMode(user.activeRole);
    this.navigationHistory = [this.currentMode];
  }

  /**
   * Navigate to a specific mode with role-based validation
   * Validates: Requirements 1.3 - Permission verification for navigation
   */
  navigateToMode(targetMode: AppMode): { success: boolean; mode: AppMode; error?: string } {
    if (!this.currentUser) {
      return {
        success: false,
        mode: this.currentMode,
        error: 'User not authenticated'
      };
    }

    // Check if user can access this mode
    if (!canAccessMode(this.currentUser.activeRole, targetMode)) {
      return {
        success: false,
        mode: this.currentMode,
        error: `Access denied: ${this.currentUser.activeRole} role cannot access ${targetMode}`
      };
    }

    // Update current mode and history
    this.currentMode = targetMode;
    this.navigationHistory.push(targetMode);

    // Keep history limited to last 10 entries
    if (this.navigationHistory.length > 10) {
      this.navigationHistory = this.navigationHistory.slice(-10);
    }

    return {
      success: true,
      mode: targetMode
    };
  }

  /**
   * Switch user's active role and redirect to appropriate default mode
   * Validates: Requirements 1.4 - Multi-role management
   */
  switchRole(newRole: UserRole): { success: boolean; mode: AppMode; error?: string } {
    if (!this.currentUser) {
      return {
        success: false,
        mode: this.currentMode,
        error: 'User not authenticated'
      };
    }

    // Check if user has this role
    if (!this.currentUser.roles.includes(newRole)) {
      return {
        success: false,
        mode: this.currentMode,
        error: `User does not have ${newRole} role`
      };
    }

    // Update user's active role
    this.currentUser.activeRole = newRole;

    // Navigate to default mode for new role
    const defaultMode = getDefaultMode(newRole);
    const navigationResult = this.navigateToMode(defaultMode);

    return navigationResult;
  }

  /**
   * Get navigation menu items for current user role
   */
  getNavigationItems(language?: Language): NavigationItem[] {
    if (!this.currentUser) {
      return [];
    }

    const lang = language || this.currentLanguage;
    const allowedModes = getAllowedModes(this.currentUser.activeRole);
    const interfaceConfig = ROLE_INTERFACE_CONFIG[this.currentUser.activeRole];

    return allowedModes.map(mode => ({
      mode,
      label: this.getModeLabel(mode, lang),
      icon: this.getModeIcon(mode),
      isActive: mode === this.currentMode,
      isAccessible: true,
      badge: this.getModeBadge(mode),
      color: interfaceConfig.primaryColor
    }));
  }

  /**
   * Check if current user can access a specific feature
   */
  canAccessFeature(feature: string): boolean {
    if (!this.currentUser) {
      return false;
    }

    return hasFeatureAccess(this.currentUser.activeRole, feature);
  }

  /**
   * Get role-specific dashboard configuration
   */
  getDashboardConfig(): DashboardConfig {
    if (!this.currentUser) {
      return { widgets: [], features: {}, primaryColor: 'legal-blue' };
    }

    const interfaceConfig = ROLE_INTERFACE_CONFIG[this.currentUser.activeRole];
    
    return {
      widgets: interfaceConfig.dashboardWidgets,
      features: interfaceConfig.features,
      primaryColor: interfaceConfig.primaryColor,
      role: this.currentUser.activeRole
    };
  }

  /**
   * Get current navigation state
   */
  getCurrentState(): NavigationState {
    return {
      currentMode: this.currentMode,
      currentUser: this.currentUser,
      navigationHistory: [...this.navigationHistory],
      allowedModes: this.currentUser ? getAllowedModes(this.currentUser.activeRole) : []
    };
  }

  /**
   * Go back to previous mode in history
   */
  goBack(): { success: boolean; mode: AppMode } {
    if (this.navigationHistory.length <= 1) {
      return { success: false, mode: this.currentMode };
    }

    // Remove current mode from history
    this.navigationHistory.pop();
    
    // Get previous mode
    const previousMode = this.navigationHistory[this.navigationHistory.length - 1];
    
    // Navigate to previous mode (this will add it back to history)
    const result = this.navigateToMode(previousMode);
    
    // Remove the duplicate entry that was just added
    if (result.success) {
      this.navigationHistory.pop();
    }

    return result;
  }

  /**
   * Reset navigation to default mode for current role
   */
  resetToDefault(): { success: boolean; mode: AppMode } {
    if (!this.currentUser) {
      return { success: false, mode: this.currentMode };
    }

    const defaultMode = getDefaultMode(this.currentUser.activeRole);
    return this.navigateToMode(defaultMode);
  }

  // Private helper methods

  private getModeLabel(mode: AppMode, language: Language = 'fr'): string {
    const t = UI_TRANSLATIONS[language];
    
    const labels: Record<AppMode, string> = {
      [AppMode.DASHBOARD]: t.menu_dashboard,
      [AppMode.RESEARCH]: t.menu_research,
      [AppMode.DRAFTING]: t.menu_drafting,
      [AppMode.ANALYSIS]: t.menu_analysis,
      [AppMode.CASES]: t.menu_cases,
      [AppMode.ADMIN]: t.menu_admin,
      [AppMode.DOCS]: t.menu_docs
    };

    return labels[mode] || mode;
  }

  private getModeIcon(mode: AppMode): string {
    const icons: Record<AppMode, string> = {
      [AppMode.DASHBOARD]: 'LayoutDashboard',
      [AppMode.RESEARCH]: 'Search',
      [AppMode.DRAFTING]: 'FileText',
      [AppMode.ANALYSIS]: 'ShieldCheck',
      [AppMode.CASES]: 'Briefcase',
      [AppMode.ADMIN]: 'Settings',
      [AppMode.DOCS]: 'Book'
    };

    return icons[mode] || 'Circle';
  }

  private getModeBadge(mode: AppMode): string | undefined {
    // Role-specific badges could be added here
    // For example, showing notification counts, etc.
    return undefined;
  }
}

// Types for the routing service
export interface NavigationItem {
  mode: AppMode;
  label: string;
  icon: string;
  isActive: boolean;
  isAccessible: boolean;
  badge?: string;
  color: string;
}

export interface DashboardConfig {
  widgets: string[];
  features: Record<string, boolean>;
  primaryColor: string;
  role?: UserRole;
}

export interface NavigationState {
  currentMode: AppMode;
  currentUser: EnhancedUserProfile | null;
  navigationHistory: AppMode[];
  allowedModes: AppMode[];
}

// Create singleton instance
export const routingService = new RoutingService();