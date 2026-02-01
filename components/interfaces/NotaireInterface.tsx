import React, { useState } from 'react';
import { Language, EnhancedUserProfile } from '../../types';
import { UI_TRANSLATIONS } from '../../constants';
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
  TrendingUp
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
  
  // Mock data for notarial acts
  const [recentActes] = useState<Acte[]>([
    {
      id: '1',
      numero: '2024/001',
      type: 'Vente immobilière',
      parties: ['M. Benali Ahmed', 'Mme Khadija Mansouri'],
      objet: 'Appartement F3 - Alger Centre',
      dateCreation: new Date('2024-03-01'),
      montant: 15000000,
      statut: 'signe'
    },
    {
      id: '2',
      numero: '2024/002', 
      type: 'Contrat de mariage',
      parties: ['M. Yacine Boumediene', 'Mlle Amina Cherif'],
      objet: 'Régime de la communauté réduite aux acquêts',
      dateCreation: new Date('2024-03-05'),
      statut: 'brouillon'
    },
    {
      id: '3',
      numero: '2024/003',
      type: 'Testament',
      parties: ['M. Mohamed Larbi'],
      objet: 'Testament olographe avec legs particuliers',
      dateCreation: new Date('2024-03-08'),
      statut: 'archive'
    }
  ]);

  const [minutierStats] = useState({
    totalActes: 1247,
    actesMois: 15,
    droitsEnregistrement: '285,400',
    honoraires: '156,800'
  });

  const [searchTerm, setSearchTerm] = useState('');

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
            <button className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
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
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {minutierStats.actesMois}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
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
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {minutierStats.droitsEnregistrement}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
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
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {minutierStats.totalActes}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
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
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {minutierStats.honoraires}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'الأتعاب (دج)' : 'Honoraires (DA)'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'هذا الشهر' : 'Ce mois-ci'}
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
              {recentActes.map(acte => (
                <div key={acte.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-600 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-bold text-amber-600">
                          {acte.numero}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatutColor(acte.statut)}`}>
                          {getStatutIcon(acte.statut)}
                          {isAr ? 
                            (acte.statut === 'brouillon' ? 'مسودة' : acte.statut === 'signe' ? 'موقع' : 'مؤرشف') :
                            acte.statut.toUpperCase()
                          }
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                        {acte.type}
                      </h3>
                      
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <strong>{isAr ? 'الأطراف:' : 'Parties:'}</strong> {acte.parties.join(' / ')}
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <strong>{isAr ? 'الموضوع:' : 'Objet:'}</strong> {acte.objet}
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
              ))}
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
    </div>
  );
};

export default NotaireInterface;