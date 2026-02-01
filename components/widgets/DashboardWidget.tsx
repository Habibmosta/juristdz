import React from 'react';
import { UserRole, Language } from '../../types';
import { 
  Briefcase, 
  FileText, 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Scale,
  FileSignature,
  Gavel,
  Crown,
  GraduationCap,
  Building
} from 'lucide-react';

interface DashboardWidgetProps {
  type: string;
  userRole: UserRole;
  language: Language;
  theme?: 'light' | 'dark';
  data?: any;
}

/**
 * Role-specific dashboard widget component
 * Renders different widgets based on user role and widget type
 * Validates: Requirements 2.1-2.7 - Role-specific dashboard elements
 */
const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  type,
  userRole,
  language,
  theme = 'light',
  data = {}
}) => {
  const isAr = language === 'ar';

  // Widget configurations by role and type
  const getWidgetConfig = (widgetType: string, role: UserRole) => {
    const configs: Record<UserRole, Record<string, any>> = {
      [UserRole.AVOCAT]: {
        active_cases: {
          title: isAr ? 'القضايا النشطة' : 'Dossiers Actifs',
          icon: Briefcase,
          color: 'blue',
          value: data.activeCases || 12,
          subtitle: isAr ? 'قضية جارية' : 'affaires en cours',
          trend: '+2 cette semaine'
        },
        recent_research: {
          title: isAr ? 'البحوث الأخيرة' : 'Recherches Récentes',
          icon: FileText,
          color: 'green',
          value: data.recentSearches || 8,
          subtitle: isAr ? 'بحث هذا الأسبوع' : 'recherches cette semaine',
          trend: 'Jurisprudence civile'
        },
        pending_deadlines: {
          title: isAr ? 'المواعيد المعلقة' : 'Délais Urgents',
          icon: Clock,
          color: 'amber',
          value: data.pendingDeadlines || 3,
          subtitle: isAr ? 'موعد هذا الشهر' : 'échéances ce mois',
          trend: '2 dans 48h'
        },
        billing_summary: {
          title: isAr ? 'ملخص الفواتير' : 'Facturation',
          icon: DollarSign,
          color: 'emerald',
          value: data.monthlyRevenue || '45,200',
          subtitle: isAr ? 'دج هذا الشهر' : 'DA ce mois',
          trend: '+12% vs mois dernier'
        },
        document_drafts: {
          title: isAr ? 'مسودات الوثائق' : 'Brouillons',
          icon: FileText,
          color: 'purple',
          value: data.documentDrafts || 5,
          subtitle: isAr ? 'مسودة في الانتظار' : 'brouillons en attente',
          trend: '2 requêtes, 3 mémoires'
        }
      },
      
      [UserRole.NOTAIRE]: {
        recent_actes: {
          title: isAr ? 'العقود الأخيرة' : 'Actes Récents',
          icon: FileSignature,
          color: 'amber',
          value: data.recentActes || 15,
          subtitle: isAr ? 'عقد هذا الشهر' : 'actes ce mois',
          trend: 'Ventes immobilières'
        },
        minutier_stats: {
          title: isAr ? 'إحصائيات الأرشيف' : 'Statistiques Minutier',
          icon: BookOpen,
          color: 'blue',
          value: data.minutierCount || 1247,
          subtitle: isAr ? 'عقد مؤرشف' : 'actes archivés',
          trend: 'Depuis 2020'
        },
        registration_fees: {
          title: isAr ? 'رسوم التسجيل' : 'Droits d\'Enregistrement',
          icon: DollarSign,
          color: 'green',
          value: data.registrationFees || '28,500',
          subtitle: isAr ? 'دج هذا الشهر' : 'DA ce mois',
          trend: 'Calculés automatiquement'
        }
      },

      [UserRole.HUISSIER]: {
        pending_significations: {
          title: isAr ? 'التبليغات المعلقة' : 'Significations en Attente',
          icon: Gavel,
          color: 'orange',
          value: data.pendingSignifications || 8,
          subtitle: isAr ? 'تبليغ للمعالجة' : 'significations à traiter',
          trend: '3 urgentes'
        },
        execution_procedures: {
          title: isAr ? 'إجراءات التنفيذ' : 'Procédures d\'Exécution',
          icon: Scale,
          color: 'red',
          value: data.executionProcedures || 4,
          subtitle: isAr ? 'إجراء جاري' : 'procédures en cours',
          trend: '2 saisies immobilières'
        },
        fee_calculations: {
          title: isAr ? 'حساب الرسوم' : 'Calcul des Frais',
          icon: DollarSign,
          color: 'green',
          value: data.monthlyFees || '18,750',
          subtitle: isAr ? 'دج هذا الشهر' : 'DA ce mois',
          trend: 'Tarif officiel 2024'
        }
      },

      [UserRole.MAGISTRAT]: {
        pending_cases: {
          title: isAr ? 'القضايا المعلقة' : 'Affaires en Instance',
          icon: Crown,
          color: 'purple',
          value: data.pendingCases || 23,
          subtitle: isAr ? 'قضية للبت' : 'dossiers à juger',
          trend: '5 audiences cette semaine'
        },
        recent_judgments: {
          title: isAr ? 'الأحكام الأخيرة' : 'Jugements Récents',
          icon: FileText,
          color: 'blue',
          value: data.recentJudgments || 12,
          subtitle: isAr ? 'حكم هذا الشهر' : 'jugements ce mois',
          trend: 'Civil et commercial'
        },
        jurisprudence_updates: {
          title: isAr ? 'تحديثات الاجتهاد' : 'Mises à Jour Jurisprudence',
          icon: BookOpen,
          color: 'emerald',
          value: data.jurisprudenceUpdates || 6,
          subtitle: isAr ? 'تحديث جديد' : 'nouvelles décisions',
          trend: 'Cour Suprême'
        }
      },

      [UserRole.ETUDIANT]: {
        learning_progress: {
          title: isAr ? 'تقدم التعلم' : 'Progression d\'Apprentissage',
          icon: GraduationCap,
          color: 'blue',
          value: data.learningProgress || '78%',
          subtitle: isAr ? 'مكتمل' : 'complété',
          trend: 'Droit civil avancé'
        },
        recent_exercises: {
          title: isAr ? 'التمارين الأخيرة' : 'Exercices Récents',
          icon: CheckCircle,
          color: 'green',
          value: data.recentExercises || 5,
          subtitle: isAr ? 'تمرين مكتمل' : 'exercices terminés',
          trend: '85% de réussite'
        },
        study_materials: {
          title: isAr ? 'مواد الدراسة' : 'Matériel d\'Étude',
          icon: BookOpen,
          color: 'purple',
          value: data.studyMaterials || 24,
          subtitle: isAr ? 'مورد متاح' : 'ressources disponibles',
          trend: '3 nouveaux cours'
        }
      },

      [UserRole.JURISTE_ENTREPRISE]: {
        compliance_alerts: {
          title: isAr ? 'تنبيهات الامتثال' : 'Alertes Conformité',
          icon: AlertCircle,
          color: 'red',
          value: data.complianceAlerts || 2,
          subtitle: isAr ? 'تنبيه نشط' : 'alertes actives',
          trend: 'RGPD et fiscalité'
        },
        contract_drafts: {
          title: isAr ? 'مسودات العقود' : 'Projets de Contrats',
          icon: FileText,
          color: 'blue',
          value: data.contractDrafts || 7,
          subtitle: isAr ? 'مسودة في المراجعة' : 'brouillons en révision',
          trend: 'Contrats commerciaux'
        },
        legal_updates: {
          title: isAr ? 'التحديثات القانونية' : 'Veille Juridique',
          icon: TrendingUp,
          color: 'emerald',
          value: data.legalUpdates || 12,
          subtitle: isAr ? 'تحديث هذا الأسبوع' : 'mises à jour cette semaine',
          trend: 'Droit des sociétés'
        }
      },

      [UserRole.ADMIN]: {
        user_statistics: {
          title: isAr ? 'إحصائيات المستخدمين' : 'Statistiques Utilisateurs',
          icon: Users,
          color: 'blue',
          value: data.totalUsers || 1247,
          subtitle: isAr ? 'مستخدم نشط' : 'utilisateurs actifs',
          trend: '+15 ce mois'
        },
        system_health: {
          title: isAr ? 'صحة النظام' : 'État du Système',
          icon: CheckCircle,
          color: 'green',
          value: data.systemHealth || '99.8%',
          subtitle: isAr ? 'وقت التشغيل' : 'uptime',
          trend: 'Tous services opérationnels'
        },
        usage_analytics: {
          title: isAr ? 'تحليلات الاستخدام' : 'Analytiques d\'Usage',
          icon: TrendingUp,
          color: 'purple',
          value: data.dailyActiveUsers || 342,
          subtitle: isAr ? 'مستخدم يومي' : 'utilisateurs quotidiens',
          trend: '+8% cette semaine'
        }
      }
    };

    return configs[role]?.[widgetType];
  };

  const config = getWidgetConfig(type, userRole);
  
  if (!config) {
    return null;
  }

  const Icon = config.icon;
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800'
  };

  return (
    <div className={`rounded-2xl border p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${
      theme === 'light' 
        ? 'bg-white border-slate-200 hover:border-slate-300' 
        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl border ${colorClasses[config.color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">
            {config.value}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {config.subtitle}
          </p>
        </div>
      </div>
      
      <div>
        <h3 className="font-bold text-sm mb-2">
          {config.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {config.trend}
        </p>
      </div>
    </div>
  );
};

export default DashboardWidget;