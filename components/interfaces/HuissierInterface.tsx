import React, { useState, useEffect } from 'react';
import { Language, EnhancedUserProfile } from '../../types';
import { UI_TRANSLATIONS } from '../../constants';
import NewConstatHuissierModal from '../modals/NewConstatatHuissierModal';
import { useDashboardData } from '../../src/hooks/useDashboardData';
import { UserRole } from '../../types';
import { EXPLOIT_TYPE_LABELS, EXPLOIT_STATUS_CONFIG } from '../../src/services/bailiffService';
import { Sparkline } from '../../src/components/charts/MiniChart';
import { 
  Gavel, 
  FileText, 
  Calculator, 
  Clock, 
  DollarSign, 
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Eye,
  Download,
  TrendingUp,
  Users,
  Calendar,
  Truck,
  Home,
  Building,
  Scale
} from 'lucide-react';

interface HuissierInterfaceProps {
  user: EnhancedUserProfile;
  language: Language;
  theme?: 'light' | 'dark';
}

interface Exploit {
  id: string;
  numero: string;
  type: string;
  debiteur: string;
  creancier: string;
  montant: number;
  adresse: string;
  dateCreation: Date;
  dateSignification?: Date;
  statut: 'preparation' | 'signifie' | 'execute';
}

interface ProcedureExecution {
  id: string;
  type: string;
  debiteur: string;
  montantDu: number;
  biensSaisis: string[];
  statut: 'en_cours' | 'suspendue' | 'terminee';
}

/**
 * Specialized interface for Huissier (Bailiff) role
 * Features: Exploit drafting, signification fees calculation, execution procedures
 * Validates: Requirements 2.3 - Huissier interface with exploits and fee calculations
 */
const HuissierInterface: React.FC<HuissierInterfaceProps> = ({
  user,
  language,
  theme = 'light'
}) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';
  
  // Modal state
  const [showNewConstatModal, setShowNewConstatModal] = useState(false);
  
  // Real data from new hook
  const dash = useDashboardData(user.id, UserRole.HUISSIER);

  const formatDA = (n: number) => `${Math.round(n).toLocaleString('fr-DZ')} DA`;

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'preparation': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'signifie': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'execute': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'en_cours': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'suspendue': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'terminee': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'preparation': return <Clock size={14} />;
      case 'signifie': return <CheckCircle size={14} />;
      case 'execute': return <CheckCircle size={14} />;
      case 'en_cours': return <Clock size={14} />;
      case 'suspendue': return <AlertTriangle size={14} />;
      case 'terminee': return <CheckCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <Gavel className="text-green-600" size={32} />
              {isAr ? 'مكتب التنفيذ' : 'Étude d\'Huissier de Justice'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr ? `مرحباً الأستاذ ${user.firstName} - التبليغ والتنفيذ` : `Bienvenue Maître ${user.lastName} - Signification et Exécution`}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:border-green-600 transition-colors">
              <Calculator size={16} className="inline mr-2" />
              {isAr ? 'حاسبة الرسوم' : 'Calculateur'}
            </button>
            <button 
              onClick={() => setShowNewConstatModal(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={18} />
              {isAr ? 'استدعاء جديد' : 'Nouvel Exploit'}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                <FileText size={20} />
              </div>
              <Sparkline values={[3,5,4,7,6,8,dash.exploitsExecuted]} color="#16a34a" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{dash.exploitsExecuted}</span>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mt-1">
              {isAr ? 'الاستدعاءات المبلغة' : 'Exploits Signifiés'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{isAr ? 'هذا الشهر' : 'Ce mois-ci'}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                <DollarSign size={20} />
              </div>
              <Sparkline values={[20,35,28,45,40,55,70]} color="#2563eb" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatDA(dash.exploitsTotalFees)}</span>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mt-1">
              {isAr ? 'الرسوم المحصلة (دج)' : 'Frais Perçus (DA)'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{isAr ? 'وفقاً للتعريفة الرسمية' : 'Selon tarif officiel'}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl">
                <Scale size={20} />
              </div>
              <Sparkline values={[1,2,3,2,4,3,dash.exploitsPending]} color="#ea580c" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{dash.exploitsPending}</span>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mt-1">
              {isAr ? 'إجراءات التنفيذ' : 'Procédures en Cours'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{isAr ? 'قيد التنفيذ' : 'En cours d\'exécution'}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <Sparkline values={[1,3,2,4,3,5,dash.urgentDeadlines + dash.overdueDeadlines]} color={dash.urgentDeadlines + dash.overdueDeadlines > 0 ? '#ef4444' : '#22c55e'} />
            </div>
            <span className="text-2xl font-bold">
              {dash.urgentDeadlines + dash.overdueDeadlines > 0
                ? <span className="text-red-500">{dash.urgentDeadlines + dash.overdueDeadlines}</span>
                : <span className="text-green-500">0</span>
              }
            </span>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mt-1">
              {isAr ? 'معدل الاسترداد' : 'Délais urgents'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{isAr ? 'مواعيد تحتاج متابعة' : 'À surveiller'}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Exploits */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Exploits List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <FileText size={20} className="text-green-600" />
                  {isAr ? 'الاستدعاءات الأخيرة' : 'Exploits Récents'}
                </h2>
                <button className="text-sm text-green-600 hover:underline">
                  {isAr ? 'عرض الكل' : 'Voir tout'}
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {dash.loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-slate-400">{isAr ? 'جاري التحميل...' : 'Chargement...'}</p>
                  </div>
                ) : dash.recentExploits.length === 0 ? (
                  <div className="text-center py-12">
                    <Gavel size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                    <p className="text-slate-400 mb-4">
                      {isAr ? 'لا توجد إجراءات بعد' : 'Aucun exploit pour le moment'}
                    </p>
                    <button
                      onClick={() => setShowNewConstatModal(true)}
                      className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                    >
                      {isAr ? 'إنشاء أول إجراء' : 'Créer votre premier exploit'}
                    </button>
                  </div>
                ) : (
                  dash.recentExploits.map(exploit => (
                  <div key={exploit.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-green-600 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-bold text-green-600">
                            {exploit.exploit_number}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${EXPLOIT_STATUS_CONFIG[exploit.status as keyof typeof EXPLOIT_STATUS_CONFIG]?.bg || ''} ${EXPLOIT_STATUS_CONFIG[exploit.status as keyof typeof EXPLOIT_STATUS_CONFIG]?.color || ''}`}>
                            {isAr
                              ? EXPLOIT_STATUS_CONFIG[exploit.status as keyof typeof EXPLOIT_STATUS_CONFIG]?.ar
                              : EXPLOIT_STATUS_CONFIG[exploit.status as keyof typeof EXPLOIT_STATUS_CONFIG]?.fr}
                          </span>
                        </div>
                        
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                          {isAr
                            ? EXPLOIT_TYPE_LABELS[exploit.exploit_type as keyof typeof EXPLOIT_TYPE_LABELS]?.ar
                            : EXPLOIT_TYPE_LABELS[exploit.exploit_type as keyof typeof EXPLOIT_TYPE_LABELS]?.fr}
                        </h3>
                        
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Users size={14} />
                            <span><strong>{isAr ? 'المُبلَّغ:' : 'Destinataire:'}</strong> {exploit.recipient_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building size={14} />
                            <span><strong>{isAr ? 'الطالب:' : 'Requérant:'}</strong> {exploit.requester_name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(exploit.exploit_date).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-DZ')}
                      </span>
                    </div>
                  </div>
                )))}
              </div>
              </div>
            </div>

            {/* Délais urgents */}
            {dash.upcomingDeadlines.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <AlertTriangle size={20} className="text-orange-500" />
                  {isAr ? 'المواعيد القانونية العاجلة' : 'Délais Légaux Urgents'}
                </h2>
              </div>
              <div className="p-4 space-y-2">
                {dash.upcomingDeadlines.map((d, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${d.status === 'overdue' ? 'bg-red-900/20 border border-red-800' : 'bg-orange-900/20 border border-orange-800'}`}>
                    <span className="text-sm text-slate-300">{isAr && d.title_ar ? d.title_ar : d.title}</span>
                    <span className={`text-xs font-bold ${d.status === 'overdue' ? 'text-red-400' : 'text-orange-400'}`}>
                      {d.days_remaining < 0 ? `${Math.abs(d.days_remaining)}j retard` : `${d.days_remaining}j`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">
                            {procedure.type}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatutColor(procedure.statut)}`}>
                            {getStatutIcon(procedure.statut)}
                            {isAr ? 
                              (procedure.statut === 'en_cours' ? 'جاري' : 
                               procedure.statut === 'suspendue' ? 'معلق' : 'منتهي') :
                              procedure.statut.replace('_', ' ').toUpperCase()
                            }
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400 mb-3">
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Gavel size={18} className="text-green-600" />
                {isAr ? 'إجراءات سريعة' : 'Actions Rapides'}
              </h3>
              
              <div className="space-y-3">
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-green-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'أمر بالدفع' : 'Commandement de Payer'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-green-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Scale size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'استدعاء للمحكمة' : 'Assignation en Justice'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-green-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Calculator size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'حساب رسوم التبليغ' : 'Calculer Frais de Signification'}
                    </span>
                  </div>
                </button>
              </div>
            </div>
                  <label className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">
                    {isAr ? 'نوع الإجراء' : 'Type d\'acte'}
                  </label>
                  <select className="w-full mt-1 p-2 border border-green-200 dark:border-green-700 rounded-lg text-sm bg-white dark:bg-slate-800">
                    <option>{isAr ? 'أمر بالدفع' : 'Commandement de payer'}</option>
                    <option>{isAr ? 'استدعاء' : 'Assignation'}</option>
                    <option>{isAr ? 'محضر حجز' : 'Procès-verbal de saisie'}</option>
                  </select>
                </div>
            {/* Contact Information */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Phone size={18} className="text-green-600" />
                {isAr ? 'معلومات الاتصال' : 'Informations de Contact'}
              </h3>
              <div className="space-y-3 text-sm">
                {user.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <Phone size={14} className="text-slate-400" />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Mail size={14} className="text-slate-400" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-gradient-to-r from-green-600 to-green-600/80 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-2">
                {isAr ? 'معلومات مهنية' : 'Informations Professionnelles'}
              </h3>
              <p className="text-green-100 text-sm">
                {user.registrationNumber
                  ? (isAr ? `رقم التسجيل: ${user.registrationNumber}` : `N° d'inscription: ${user.registrationNumber}`)
                  : (isAr ? 'يرجى تحديث معلوماتك المهنية' : 'Veuillez mettre à jour vos informations professionnelles')}
              </p>
            </div>
            <Gavel size={48} className="text-green-200" />
          </div>
        </div>
      </div>

      <NewConstatHuissierModal
        isOpen={showNewConstatModal}
        onClose={() => setShowNewConstatModal(false)}
        onSave={() => {}}
        language={language}
        theme={theme}
      />
    </div>
  );
};

export default HuissierInterface;