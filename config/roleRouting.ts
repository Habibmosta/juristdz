import { AppMode, UserRole, RoleRouteConfig } from '../types';

/**
 * Role-based routing configuration
 * Defines which modes each role can access and their default landing page
 * Validates: Requirements 2.1-2.7 - Role-specific interfaces
 */
export const ROLE_ROUTING_CONFIG: Record<UserRole, RoleRouteConfig> = {
  [UserRole.AVOCAT]: {
    role: UserRole.AVOCAT,
    allowedModes: [
      AppMode.DASHBOARD,
      AppMode.RESEARCH,
      AppMode.DRAFTING,
      AppMode.ANALYSIS,
      AppMode.CASES,
      AppMode.DOCS
    ],
    defaultMode: AppMode.DASHBOARD,
    restrictedFeatures: []
  },

  [UserRole.NOTAIRE]: {
    role: UserRole.NOTAIRE,
    allowedModes: [
      AppMode.DASHBOARD,
      AppMode.RESEARCH,
      AppMode.DRAFTING,
      AppMode.ANALYSIS,
      AppMode.DOCS
    ],
    defaultMode: AppMode.DASHBOARD,
    restrictedFeatures: ['case_management'] // Notaires don't use case management like avocats
  },

  [UserRole.HUISSIER]: {
    role: UserRole.HUISSIER,
    allowedModes: [
      AppMode.DASHBOARD,
      AppMode.RESEARCH,
      AppMode.DRAFTING,
      AppMode.ANALYSIS,
      AppMode.DOCS
    ],
    defaultMode: AppMode.DASHBOARD,
    restrictedFeatures: ['case_management']
  },

  [UserRole.MAGISTRAT]: {
    role: UserRole.MAGISTRAT,
    allowedModes: [
      AppMode.DASHBOARD,
      AppMode.RESEARCH,
      AppMode.ANALYSIS,
      AppMode.DOCS
    ],
    defaultMode: AppMode.RESEARCH, // Magistrats primarily use research
    restrictedFeatures: ['drafting', 'case_management', 'billing']
  },

  [UserRole.ETUDIANT]: {
    role: UserRole.ETUDIANT,
    allowedModes: [
      AppMode.DASHBOARD,
      AppMode.RESEARCH,
      AppMode.DOCS
    ],
    defaultMode: AppMode.RESEARCH,
    restrictedFeatures: [
      'advanced_drafting',
      'case_management', 
      'billing',
      'analysis',
      'professional_templates'
    ]
  },

  [UserRole.JURISTE_ENTREPRISE]: {
    role: UserRole.JURISTE_ENTREPRISE,
    allowedModes: [
      AppMode.DASHBOARD,
      AppMode.RESEARCH,
      AppMode.DRAFTING,
      AppMode.ANALYSIS,
      AppMode.DOCS
    ],
    defaultMode: AppMode.DASHBOARD,
    restrictedFeatures: ['case_management', 'notary_features', 'court_procedures']
  },

  [UserRole.ADMIN]: {
    role: UserRole.ADMIN,
    allowedModes: [
      AppMode.DASHBOARD,
      AppMode.RESEARCH,
      AppMode.DRAFTING,
      AppMode.ANALYSIS,
      AppMode.CASES,
      AppMode.ADMIN,
      AppMode.DOCS
    ],
    defaultMode: AppMode.ADMIN,
    restrictedFeatures: []
  }
};

/**
 * Check if a user role can access a specific mode
 */
export function canAccessMode(userRole: UserRole, mode: AppMode): boolean {
  const config = ROLE_ROUTING_CONFIG[userRole];
  return config ? config.allowedModes.includes(mode) : false;
}

/**
 * Get the default mode for a user role
 */
export function getDefaultMode(userRole: UserRole): AppMode {
  const config = ROLE_ROUTING_CONFIG[userRole];
  return config ? config.defaultMode : AppMode.DASHBOARD;
}

/**
 * Check if a user role has access to a specific feature
 */
export function hasFeatureAccess(userRole: UserRole, feature: string): boolean {
  const config = ROLE_ROUTING_CONFIG[userRole];
  return config ? !config.restrictedFeatures?.includes(feature) : false;
}

/**
 * Get all allowed modes for a user role
 */
export function getAllowedModes(userRole: UserRole): AppMode[] {
  const config = ROLE_ROUTING_CONFIG[userRole];
  return config ? config.allowedModes : [AppMode.DASHBOARD];
}

/**
 * Role-specific interface configurations
 * Defines UI elements and features available to each role
 */
export const ROLE_INTERFACE_CONFIG = {
  [UserRole.AVOCAT]: {
    primaryColor: 'legal-blue',
    features: {
      caseManagement: true,
      clientBilling: true,
      courtDocuments: true,
      jurisprudenceSearch: true,
      contractDrafting: true,
      documentAnalysis: true
    },
    dashboardWidgets: [
      'active_cases',
      'recent_research',
      'pending_deadlines',
      'billing_summary',
      'document_drafts'
    ]
  },

  [UserRole.NOTAIRE]: {
    primaryColor: 'amber-600',
    features: {
      acteAuthentique: true,
      minutierElectronique: true,
      registrationCalculations: true,
      jurisprudenceSearch: true,
      contractDrafting: true,
      documentAnalysis: true
    },
    dashboardWidgets: [
      'recent_actes',
      'minutier_stats',
      'registration_fees',
      'document_drafts',
      'client_appointments'
    ]
  },

  [UserRole.HUISSIER]: {
    primaryColor: 'green-600',
    features: {
      exploitDrafting: true,
      significationFees: true,
      executionProcedures: true,
      jurisprudenceSearch: true,
      documentAnalysis: true
    },
    dashboardWidgets: [
      'pending_significations',
      'execution_procedures',
      'fee_calculations',
      'document_drafts',
      'recent_research'
    ]
  },

  [UserRole.MAGISTRAT]: {
    primaryColor: 'purple-600',
    features: {
      judgmentDrafting: true,
      jurisprudenceSearch: true,
      caseAnalysis: true,
      legalResearch: true
    },
    dashboardWidgets: [
      'pending_cases',
      'recent_judgments',
      'jurisprudence_updates',
      'legal_research',
      'court_statistics'
    ]
  },

  [UserRole.ETUDIANT]: {
    primaryColor: 'blue-500',
    features: {
      learningMode: true,
      basicResearch: true,
      educationalContent: true,
      practiceExercises: true
    },
    dashboardWidgets: [
      'learning_progress',
      'recent_exercises',
      'educational_content',
      'study_materials',
      'practice_tests'
    ]
  },

  [UserRole.JURISTE_ENTREPRISE]: {
    primaryColor: 'indigo-600',
    features: {
      contractDrafting: true,
      complianceAnalysis: true,
      legalWatch: true,
      jurisprudenceSearch: true,
      documentAnalysis: true
    },
    dashboardWidgets: [
      'compliance_alerts',
      'contract_drafts',
      'legal_updates',
      'risk_analysis',
      'regulatory_changes'
    ]
  },

  [UserRole.ADMIN]: {
    primaryColor: 'red-600',
    features: {
      userManagement: true,
      systemConfiguration: true,
      analytics: true,
      contentModeration: true,
      billingManagement: true
    },
    dashboardWidgets: [
      'user_statistics',
      'system_health',
      'usage_analytics',
      'revenue_metrics',
      'support_tickets'
    ]
  }
};