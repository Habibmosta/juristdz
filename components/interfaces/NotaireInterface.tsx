import React, { useState, useEffect } from 'react';
import { Language, EnhancedUserProfile, AppMode } from '../../types';
import { UI_TRANSLATIONS } from '../../constants';
import NewActeNotarialModal from '../modals/NewActeNotarialModal';
import { useDashboardData } from '../../src/hooks/useDashboardData';
import { UserRole } from '../../types';
import { ACT_TYPE_LABELS, ACT_STATUS_CONFIG } from '../../src/services/notarialActService';
import { Sparkline } from '../../src/components/charts/MiniChart';
import { 
  FileSignature, 
  BookOpen, 
  Calculator, 
  Search, 
  Archive,
  Stamp,
  FileText,
  DollarSign,
  Calendar,
  Users,
  Plus,
  Eye,
  Download,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface NotaireInterfaceProps {
  user: EnhancedUserProfile;
  language: Language;
  theme?: 'light' | 'dark';
}

interface Acte {
  id: string;
  numero: string;
  type: string;
  parties: string[];
  objet: string;
  dateCreation: Date;
  montant?: number;
  statut: 'brouillon' | 'signe' | 'archive';
}

/**
 * Specialized interface for Notaire role
 * Features: Authentic acts drafting, electronic minutier, registration calculations
 * Validates: Requirements 2.2 - Notaire interface with authentic acts and minutier
 */
const NotaireInterface: React.FC<NotaireInterfaceProps> = ({
  user,
  language,
  theme = 'light'
}) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';
  
  // Modal state
  const [showNewActeModal, setShowNewActeModal] = useState(false);
  
  // Real data from new hook
  const dash = useDashboardData(user.id, UserRole.NOTAIRE);

  const formatDA = (n: number) => `${Math.round(n).toLocaleString('fr-DZ')} DA`;

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'brouillon': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'signe': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'archive': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'brouillon': return <FileText size={14} />;
      case 'signe': return <CheckCircle size={14} />;
      case 'archive': return <Archive size={14} />;
      default: return <FileText size={14} />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <FileSignature className="text-amber-600" size={32} />
              {isAr ? 'مكتب التوثيق' : 'Étude Notariale'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr ? `مرحباً الأستاذ ${user.firstName} - إدارة العقود والتوثيق` : `Bienvenue Maître ${user.lastName} - Gestion des actes authentiques`}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:border-amber-600 transition-colors">
              <Archive size={16} className="inline mr-2" />
              {isAr ? 'الأرشيف' : 'Minutier'}
            </button>
            <button 
              onClick={() => setShowNewActeModal(true)}
              className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={18} />
              {isAr ? 'عقد جديد' : 'Nouvel Acte'}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                <FileSignature size={20} />
              </div>
              <Sparkline values={[4,6,5,8,7,9,dash.notarialActsMonth]} color="#d97706" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {dash.notarialActsMonth}
            </span>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mt-1">
              {isAr ? 'العقود هذا الشهر' : 'Actes ce Mois'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? '+3 مقارنة بالشهر الماضي' : '+3 vs mois dernier'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                <DollarSign size={20} />
              </div>
              <Sparkline values={[50,70,60,90,80,100,120]} color="#16a34a" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatDA(dash.notarialActsValue)}
            </span>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mt-1">
              {isAr ? 'رسوم التسجيل (دج)' : 'Droits Enregistrement (DA)'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'محسوبة تلقائياً' : 'Calculés automatiquement'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                <BookOpen size={20} />
              </div>
              <Sparkline values={[10,15,20,25,30,35,dash.notarialActsTotal]} color="#2563eb" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {dash.notarialActsTotal}
            </span>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mt-1">
              {isAr ? 'إجمالي الأرشيف' : 'Total Minutier'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'منذ 2020' : 'Depuis 2020'}
            </p>
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
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'مواعيد عاجلة' : 'Délais urgents'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'تحتاج متابعة' : 'À surveiller'}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Acts */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <FileSignature size={20} className="text-amber-600" />
                {isAr ? 'العقود الأخيرة' : 'Actes Récents'}
              </h2>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder={isAr ? 'البحث في الأرشيف...' : 'Rechercher dans le minutier...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-40"
                  />
                </div>
                <button className="text-sm text-amber-600 hover:underline">
                  {isAr ? 'عرض الكل' : 'Voir tout'}
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {dash.loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
                  <p className="mt-4 text-slate-400">{isAr ? 'جاري التحميل...' : 'Chargement...'}</p>
                </div>
              ) : dash.recentNotarialActs.length === 0 ? (
                <div className="text-center py-12">
                  <FileSignature size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                  <p className="text-slate-400 mb-4">
                    {isAr ? 'لا توجد عقود بعد' : 'Aucun acte pour le moment'}
                  </p>
                  <button
                    onClick={() => setShowNewActeModal(true)}
                    className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors"
                  >
                    {isAr ? 'إنشاء أول عقد' : 'Créer votre premier acte'}
                  </button>
                </div>
              ) : (
                dash.recentNotarialActs.map(acte => (
                <div key={acte.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-600 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-bold text-amber-600">
                          {acte.act_number}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${ACT_STATUS_CONFIG[acte.status as keyof typeof ACT_STATUS_CONFIG]?.color || 'text-slate-400'}`}>
                          {isAr
                            ? ACT_STATUS_CONFIG[acte.status as keyof typeof ACT_STATUS_CONFIG]?.ar
                            : ACT_STATUS_CONFIG[acte.status as keyof typeof ACT_STATUS_CONFIG]?.fr}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                        {isAr
                          ? ACT_TYPE_LABELS[acte.act_type as keyof typeof ACT_TYPE_LABELS]?.ar
                          : ACT_TYPE_LABELS[acte.act_type as keyof typeof ACT_TYPE_LABELS]?.fr}
                      </h3>
                      
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <strong>{isAr ? 'الطرف:' : 'Partie:'}</strong> {acte.party_last_name} {acte.party_first_name}
                      </div>
                      
                      {acte.act_value && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                          <strong>{isAr ? 'القيمة:' : 'Valeur:'}</strong> {Number(acte.act_value).toLocaleString('fr-DZ')} DA
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-amber-600 transition-colors">
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(acte.act_date).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-DZ')}
                    </span>
                    {acte.status === 'signed' && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Shield size={12} />
                        {isAr ? 'موقع' : 'Signé'}
                      </div>
                    )}
                  </div>
                </div>
              )))}
            </div>
          </div>
                      </p>
                      
                      {acte.montant && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                          <strong>{isAr ? 'المبلغ:' : 'Montant:'}</strong> {acte.montant.toLocaleString()} DA
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-amber-600 transition-colors">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-amber-600 transition-colors">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {acte.dateCreation.toLocaleDateString()}
                    </span>
                    {acte.statut === 'signe' && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Shield size={12} />
                        {isAr ? 'مصدق رقمياً' : 'Certifié numérique'}
                      </div>
                    )}
                  </div>
                </div>
              )))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Stamp size={18} className="text-amber-600" />
                {isAr ? 'إجراءات سريعة' : 'Actions Rapides'}
              </h3>
              
              <div className="space-y-3">
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileSignature size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'عقد بيع عقاري' : 'Acte de Vente Immobilière'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'عقد زواج' : 'Contrat de Mariage'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'وصية' : 'Testament'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Calculator size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'حساب رسوم التسجيل' : 'Calculer Droits d\'Enregistrement'}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Minutier Search */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Archive size={18} className="text-amber-600" />
                {isAr ? 'البحث في الأرشيف' : 'Recherche Minutier'}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isAr ? 'رقم العقد' : 'Numéro d\'acte'}
                  </label>
                  <input
                    type="text"
                    placeholder="2024/001"
                    className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isAr ? 'اسم الطرف' : 'Nom des parties'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'البحث بالاسم...' : 'Rechercher par nom...'}
                    className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                
                <button className="w-full py-2 bg-amber-600 text-white rounded-lg font-bold text-sm hover:bg-amber-700 transition-colors">
                  {isAr ? 'بحث' : 'Rechercher'}
                </button>
              </div>
            </div>

            {/* Registration Fees Calculator */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl border border-amber-200 dark:border-amber-800 p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <Calculator size={18} />
                {isAr ? 'حاسبة الرسوم' : 'Calculateur de Droits'}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                    {isAr ? 'قيمة العقار (دج)' : 'Valeur du bien (DA)'}
                  </label>
                  <input
                    type="number"
                    placeholder="15000000"
                    className="w-full mt-1 p-2 border border-amber-200 dark:border-amber-700 rounded-lg text-sm bg-white dark:bg-slate-800"
                  />
                </div>
                
                <button className="w-full py-2 bg-amber-600 text-white rounded-lg font-bold text-sm hover:bg-amber-700 transition-colors">
                  {isAr ? 'حساب الرسوم' : 'Calculer'}
                </button>
                
                <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/20 p-2 rounded-lg">
                  {isAr ? 'الحساب وفقاً للتعريفة الرسمية الجزائرية' : 'Calcul selon le tarif officiel algérien'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chamber Information */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-600/80 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-2">
                {isAr ? 'معلومات الغرفة' : 'Informations Chambre Notariale'}
              </h3>
              <p className="text-amber-100 text-sm">
                {user.organizationName ? 
                  (isAr ? `مسجل في: ${user.organizationName}` : `Inscrit à: ${user.organizationName}`) :
                  (isAr ? 'يرجى تحديث معلومات الغرفة' : 'Veuillez mettre à jour vos informations de chambre')
                }
              </p>
              {user.registrationNumber && (
                <p className="text-amber-100 text-xs mt-1">
                  {isAr ? `رقم التسجيل: ${user.registrationNumber}` : `N° d'inscription: ${user.registrationNumber}`}
                </p>
              )}
            </div>
            <FileSignature size={48} className="text-amber-200" />
          </div>
        </div>
      </div>

      {/* New Acte Modal */}
      <NewActeNotarialModal
        isOpen={showNewActeModal}
        onClose={() => setShowNewActeModal(false)}
        onSave={async (newActe) => {
          try {
            // Créer l'acte dans Supabase
            await professionalDataService.create(user.id, 'notaire', {
              title: newActe.type,
              description: newActe.objet,
              status: 'draft',
              metadata: {
                numero: newActe.numero,
                type_acte: newActe.type,
                parties: newActe.parties,
                montant: newActe.montant
              }
            });
            
            // Recharger les données
            loadData();
            console.log('✅ Nouvel acte créé');
          } catch (error) {
            console.error('Erreur création acte:', error);
          }
        }}
        language={language}
        theme={theme}
      />
    </div>
  );
};

export default NotaireInterface;