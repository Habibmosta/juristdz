
import React from 'react';
import { AppMode, Language, UserStats, UserRole, EnhancedUserProfile } from '../types';
import { UI_TRANSLATIONS } from '../constants';
import { MessageSquare, Briefcase, FileText, ShieldCheck, ArrowRight, Star, Clock, ShieldAlert } from 'lucide-react';
import { ROLE_INTERFACE_CONFIG } from '../config/roleRouting';
import DashboardWidget from './widgets/DashboardWidget';
import ApiTestComponent from './ApiTestComponent';
import {
  AvocatInterface,
  NotaireInterface,
  HuissierInterface,
  MagistratInterface,
  EtudiantInterface,
  JuristeEntrepriseInterface,
  AdminInterface
} from './interfaces';

interface DashboardProps {
  language: Language;
  user: UserStats;
  enhancedUser?: EnhancedUserProfile;
  setMode: (mode: AppMode) => void;
  showSpecializedInterface?: boolean;
  theme?: 'light' | 'dark';
}

const Dashboard: React.FC<DashboardProps> = ({ language, user, enhancedUser, setMode, showSpecializedInterface = false, theme = 'light' }) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';

  // Map legacy user role to new UserRole enum
  const mapUserRole = (legacyRole: string): UserRole => {
    switch (legacyRole) {
      case 'admin':
        return UserRole.ADMIN;
      case 'user':
        return UserRole.AVOCAT;
      case 'tester':
        return UserRole.ETUDIANT;
      default:
        return UserRole.AVOCAT;
    }
  };

  const userRole = mapUserRole(user.role);
  const roleConfig = ROLE_INTERFACE_CONFIG[userRole];

  // If specialized interface is requested and we have enhanced user data, show the specialized interface
  if (showSpecializedInterface && enhancedUser) {
    switch (enhancedUser.activeRole) {
      case UserRole.AVOCAT:
        return <AvocatInterface user={enhancedUser} language={language} theme={theme} />;
      case UserRole.NOTAIRE:
        return <NotaireInterface user={enhancedUser} language={language} theme={theme} />;
      case UserRole.HUISSIER:
        return <HuissierInterface user={enhancedUser} language={language} theme={theme} />;
      case UserRole.MAGISTRAT:
        return <MagistratInterface user={enhancedUser} language={language} theme={theme} />;
      case UserRole.ETUDIANT:
        return <EtudiantInterface user={enhancedUser} language={language} theme={theme} />;
      case UserRole.JURISTE_ENTREPRISE:
        return <JuristeEntrepriseInterface user={enhancedUser} language={language} theme={theme} />;
      case UserRole.ADMIN:
        return <AdminInterface user={enhancedUser} language={language} theme={theme} />;
      default:
        // Fall back to default dashboard
        break;
    }
  }

  // Get role-specific dashboard widgets
  const getWidgetData = () => {
    // Mock data - in real implementation, this would come from API
    return {
      activeCases: 12,
      recentSearches: 8,
      pendingDeadlines: 3,
      monthlyRevenue: '45,200',
      documentDrafts: 5,
      totalUsers: 1247,
      systemHealth: '99.8%',
      dailyActiveUsers: 342,
      learningProgress: '78%',
      recentExercises: 5,
      studyMaterials: 24
    };
  };

  const widgetData = getWidgetData();

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-12" dir={isAr ? 'rtl' : 'ltr'}>
       <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Hero Section */}
          <div className={`relative overflow-hidden rounded-[2.5rem] p-10 md:p-16 text-white shadow-2xl border border-white/5 bg-gradient-to-br from-${roleConfig.primaryColor} to-${roleConfig.primaryColor}/80`}>
             <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="px-3 py-1 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">
                      {getRoleDisplayName(userRole, isAr)} - {isAr ? 'إصدار مهني' : 'Édition Professionnelle'} V2.0
                   </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold font-serif mb-4 leading-tight">{t.dash_welcome}</h1>
                <p className="text-white/80 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">{t.dash_subtitle}</p>
                
                <div className="flex flex-wrap gap-4">
                   <div className="flex items-center gap-3 px-5 py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl border border-white/20 backdrop-blur-md cursor-help">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span className="text-sm font-bold">{user.credits} {isAr ? 'رصيد قانوني' : 'Crédits Juridiques'}</span>
                   </div>
                   <div className="flex items-center gap-3 px-5 py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl border border-white/20 backdrop-blur-md uppercase tracking-wider">
                      <Star size={16} className="text-white" />
                      <span className="text-sm font-bold italic">{user.plan}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Role-specific Dashboard Widgets */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {isAr ? 'لوحة التحكم المخصصة' : 'Tableau de Bord Personnalisé'}
              </h2>
              <div className="text-sm text-slate-500">
                {getRoleDisplayName(userRole, isAr)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roleConfig.dashboardWidgets.map((widgetType, index) => (
                <DashboardWidget
                  key={`${widgetType}-${index}`}
                  type={widgetType}
                  userRole={userRole}
                  language={language}
                  data={widgetData}
                />
              ))}
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             
             {/* V1 - Assistant */}
             <div className="group bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-blue-500/20 transition-all duration-500">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                   <MessageSquare size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-4">{t.dash_v1_title}</h2>
                <p className="text-slate-500 mb-10 leading-relaxed text-sm">{t.dash_v1_desc}</p>
                <button 
                  onClick={() => setMode(AppMode.RESEARCH)}
                  className="px-8 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold flex items-center gap-3 group-hover:bg-legal-blue group-hover:text-white transition-all w-full md:w-auto justify-center"
                >
                   {t.dash_btn_chat}
                   <ArrowRight size={18} />
                </button>
             </div>

             {/* V2 - Professional Tools */}
             <div className="group bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border-2 border-legal-gold/20 shadow-lg hover:shadow-2xl hover:border-legal-gold/50 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-6 right-6 flex items-center gap-2">
                   <span className="bg-legal-gold text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-legal-gold/20">
                     {getRoleAccessLevel(userRole, isAr)}
                   </span>
                </div>
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-legal-gold rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                   {getRoleIcon(userRole)}
                </div>
                <h2 className="text-2xl font-bold mb-4">{t.dash_v2_title}</h2>
                <p className="text-slate-500 mb-10 leading-relaxed text-sm">{t.dash_v2_desc}</p>
                <button 
                  onClick={() => setMode(getPreferredV2Mode(userRole))}
                  className="px-8 py-4 bg-legal-gold text-white rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-legal-gold/20 active:scale-95 transition-all w-full md:w-auto justify-center"
                >
                   {getV2ButtonText(userRole, isAr)}
                   <ArrowRight size={18} />
                </button>
             </div>

          </div>

          {/* Environment Alert */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 p-6 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
             <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800/30 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                <ShieldAlert size={24} />
             </div>
             <div className="flex-1 text-center md:text-left">
                <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm mb-1">
                  {isAr ? 'بيئة ما قبل الإنتاج' : 'Environnement de Pré-production'}
                </h4>
                <p className="text-amber-700 dark:text-amber-300 text-xs">
                   {isAr 
                     ? 'هذا الرابط مؤقت للتحقق المهني. للتثبيت الدائم في المكتب، يرجى الاتصال بالدعم التقني.'
                     : 'Ce lien est un accès temporaire pour validation métier. Pour une installation permanente au cabinet, veuillez contacter le support technique.'
                   }
                </p>
             </div>
             <button className="px-6 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 rounded-xl text-[10px] font-black uppercase text-amber-700 dark:text-amber-200 hover:bg-amber-100 transition-colors">
                {isAr ? 'معرفة المزيد' : 'En savoir plus'}
             </button>
          </div>

          {/* API Test Component */}
          <div className="mt-8">
            <ApiTestComponent language={language} />
          </div>

       </div>
    </div>
  );
};

// Helper functions for role-specific content
function getRoleDisplayName(role: UserRole, isAr: boolean): string {
  const names = {
    [UserRole.AVOCAT]: isAr ? 'محامي' : 'Avocat',
    [UserRole.NOTAIRE]: isAr ? 'موثق' : 'Notaire',
    [UserRole.HUISSIER]: isAr ? 'محضر قضائي' : 'Huissier',
    [UserRole.MAGISTRAT]: isAr ? 'قاضي' : 'Magistrat',
    [UserRole.ETUDIANT]: isAr ? 'طالب قانون' : 'Étudiant en Droit',
    [UserRole.JURISTE_ENTREPRISE]: isAr ? 'مستشار قانوني' : 'Juriste d\'Entreprise',
    [UserRole.ADMIN]: isAr ? 'مدير النظام' : 'Administrateur'
  };
  return names[role];
}

function getRoleAccessLevel(role: UserRole, isAr: boolean): string {
  const levels = {
    [UserRole.AVOCAT]: isAr ? 'وصول كامل' : 'Accès Maître',
    [UserRole.NOTAIRE]: isAr ? 'وصول موثق' : 'Accès Notaire',
    [UserRole.HUISSIER]: isAr ? 'وصول محضر' : 'Accès Huissier',
    [UserRole.MAGISTRAT]: isAr ? 'وصول قضائي' : 'Accès Magistrat',
    [UserRole.ETUDIANT]: isAr ? 'وصول تعليمي' : 'Accès Étudiant',
    [UserRole.JURISTE_ENTREPRISE]: isAr ? 'وصول مؤسسي' : 'Accès Entreprise',
    [UserRole.ADMIN]: isAr ? 'وصول إداري' : 'Accès Admin'
  };
  return levels[role];
}

function getRoleIcon(role: UserRole): React.ReactNode {
  const icons = {
    [UserRole.AVOCAT]: <Briefcase size={32} />,
    [UserRole.NOTAIRE]: <FileText size={32} />,
    [UserRole.HUISSIER]: <ShieldCheck size={32} />,
    [UserRole.MAGISTRAT]: <Briefcase size={32} />,
    [UserRole.ETUDIANT]: <Briefcase size={32} />,
    [UserRole.JURISTE_ENTREPRISE]: <Briefcase size={32} />,
    [UserRole.ADMIN]: <Briefcase size={32} />
  };
  return icons[role];
}

function getPreferredV2Mode(role: UserRole): AppMode {
  const modes = {
    [UserRole.AVOCAT]: AppMode.CASES,
    [UserRole.NOTAIRE]: AppMode.DRAFTING,
    [UserRole.HUISSIER]: AppMode.DRAFTING,
    [UserRole.MAGISTRAT]: AppMode.RESEARCH,
    [UserRole.ETUDIANT]: AppMode.RESEARCH,
    [UserRole.JURISTE_ENTREPRISE]: AppMode.ANALYSIS,
    [UserRole.ADMIN]: AppMode.ADMIN
  };
  return modes[role];
}

function getV2ButtonText(role: UserRole, isAr: boolean): string {
  const texts = {
    [UserRole.AVOCAT]: isAr ? 'فتح ملف قضائي' : 'Ouvrir un Dossier',
    [UserRole.NOTAIRE]: isAr ? 'تحرير عقد' : 'Rédiger un Acte',
    [UserRole.HUISSIER]: isAr ? 'تحرير استدعاء' : 'Rédiger un Exploit',
    [UserRole.MAGISTRAT]: isAr ? 'بحث متقدم' : 'Recherche Avancée',
    [UserRole.ETUDIANT]: isAr ? 'بدء التعلم' : 'Commencer l\'Apprentissage',
    [UserRole.JURISTE_ENTREPRISE]: isAr ? 'تحليل الامتثال' : 'Analyse Conformité',
    [UserRole.ADMIN]: isAr ? 'إدارة النظام' : 'Administration'
  };
  return texts[role];
}

export default Dashboard;
