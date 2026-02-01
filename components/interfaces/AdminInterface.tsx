import React, { useState } from 'react';
import { Language, EnhancedUserProfile } from '../../types';
import { UI_TRANSLATIONS } from '../../constants';
import { 
  Settings, 
  Users, 
  BarChart3, 
  Shield, 
  Database,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Bell,
  Globe,
  Zap,
  HardDrive,
  Cpu,
  Wifi,
  Lock
} from 'lucide-react';

interface AdminInterfaceProps {
  user: EnhancedUserProfile;
  language: Language;
  theme?: 'light' | 'dark';
}

interface UtilisateurSysteme {
  id: string;
  nom: string;
  email: string;
  role: string;
  organisation: string;
  dernierAcces: Date;
  statut: 'actif' | 'inactif' | 'suspendu';
  credits: number;
}

interface MetriqueSysteme {
  nom: string;
  valeur: string | number;
  unite?: string;
  tendance: 'hausse' | 'baisse' | 'stable';
  statut: 'bon' | 'attention' | 'critique';
}

interface AlerteSysteme {
  id: string;
  type: 'securite' | 'performance' | 'maintenance' | 'usage';
  titre: string;
  description: string;
  niveau: 'info' | 'attention' | 'critique';
  dateCreation: Date;
  statut: 'nouveau' | 'en_cours' | 'resolu';
}

/**
 * Specialized interface for Admin role
 * Features: User management, system configuration, analytics, platform administration
 * Validates: Requirements 2.7 - Admin interface with management and statistics
 */
const AdminInterface: React.FC<AdminInterfaceProps> = ({
  user,
  language,
  theme = 'light'
}) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';
  
  // Mock data for system users
  const [utilisateurs] = useState<UtilisateurSysteme[]>([
    {
      id: '1',
      nom: 'Maître Ahmed Benali',
      email: 'a.benali@avocat-alger.dz',
      role: 'Avocat',
      organisation: 'Barreau d\'Alger',
      dernierAcces: new Date('2024-03-10'),
      statut: 'actif',
      credits: 150
    },
    {
      id: '2',
      nom: 'Maître Fatima Khelifi',
      email: 'f.khelifi@notaire-oran.dz',
      role: 'Notaire',
      organisation: 'Chambre Notariale Oran',
      dernierAcces: new Date('2024-03-09'),
      statut: 'actif',
      credits: 200
    },
    {
      id: '3',
      nom: 'Dr. Mohamed Larbi',
      email: 'm.larbi@univ-alger.dz',
      role: 'Étudiant',
      organisation: 'Université d\'Alger',
      dernierAcces: new Date('2024-03-08'),
      statut: 'inactif',
      credits: 50
    }
  ]);

  // Mock data for system metrics
  const [metriques] = useState<MetriqueSysteme[]>([
    { nom: 'Utilisateurs Actifs', valeur: 1247, tendance: 'hausse', statut: 'bon' },
    { nom: 'Requêtes IA/jour', valeur: 8542, tendance: 'hausse', statut: 'bon' },
    { nom: 'Uptime Système', valeur: 99.8, unite: '%', tendance: 'stable', statut: 'bon' },
    { nom: 'Utilisation CPU', valeur: 45, unite: '%', tendance: 'stable', statut: 'bon' },
    { nom: 'Utilisation RAM', valeur: 68, unite: '%', tendance: 'hausse', statut: 'attention' },
    { nom: 'Stockage Utilisé', valeur: 2.4, unite: 'TB', tendance: 'hausse', statut: 'bon' }
  ]);

  // Mock data for system alerts
  const [alertes] = useState<AlerteSysteme[]>([
    {
      id: '1',
      type: 'performance',
      titre: 'Utilisation mémoire élevée',
      description: 'L\'utilisation de la RAM dépasse 65% depuis 2 heures',
      niveau: 'attention',
      dateCreation: new Date('2024-03-10T14:30:00'),
      statut: 'nouveau'
    },
    {
      id: '2',
      type: 'securite',
      titre: 'Tentatives de connexion suspectes',
      description: '15 tentatives de connexion échouées depuis la même IP',
      niveau: 'critique',
      dateCreation: new Date('2024-03-10T13:15:00'),
      statut: 'en_cours'
    },
    {
      id: '3',
      type: 'maintenance',
      titre: 'Mise à jour système disponible',
      description: 'Nouvelle version de sécurité disponible pour installation',
      niveau: 'info',
      dateCreation: new Date('2024-03-10T09:00:00'),
      statut: 'nouveau'
    }
  ]);

  const [statistiques] = useState({
    utilisateursTotal: 1247,
    utilisateursActifs: 342,
    requetesJour: 8542,
    uptimeSysteme: 99.8
  });

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'inactif': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      case 'suspendu': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'bon': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'attention': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'critique': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'nouveau': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'en_cours': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'resolu': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getNiveauColor = (niveau: string) => {
    switch (niveau) {
      case 'info': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'attention': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'critique': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'securite': return <Shield size={14} />;
      case 'performance': return <Activity size={14} />;
      case 'maintenance': return <Settings size={14} />;
      case 'usage': return <BarChart3 size={14} />;
      default: return <Bell size={14} />;
    }
  };

  const getTendanceIcon = (tendance: string) => {
    switch (tendance) {
      case 'hausse': return <TrendingUp size={14} className="text-green-500" />;
      case 'baisse': return <TrendingUp size={14} className="text-red-500 rotate-180" />;
      case 'stable': return <div className="w-3 h-0.5 bg-slate-400 rounded"></div>;
      default: return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <Settings className="text-red-600" size={32} />
              {isAr ? 'لوحة تحكم المدير' : 'Administration Système'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr ? `مرحباً ${user.firstName} - إدارة شاملة للمنصة` : `Bienvenue ${user.firstName} - Gestion complète de la plateforme`}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:border-red-600 transition-colors">
              <Download size={16} className="inline mr-2" />
              {isAr ? 'تصدير البيانات' : 'Export Données'}
            </button>
            <button className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
              <Plus size={18} />
              {isAr ? 'مستخدم جديد' : 'Nouvel Utilisateur'}
            </button>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                <Users size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {statistiques.utilisateursTotal}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'إجمالي المستخدمين' : 'Utilisateurs Total'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {statistiques.utilisateursActifs} {isAr ? 'نشط' : 'actifs'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                <Activity size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {statistiques.requetesJour}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'طلبات يومية' : 'Requêtes/Jour'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? '+12% مقارنة بالأمس' : '+12% vs hier'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
                <Server size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {statistiques.uptimeSysteme}%
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'وقت التشغيل' : 'Uptime Système'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'ممتاز' : 'Excellent'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {alertes.filter(a => a.statut !== 'resolu').length}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'تنبيهات نشطة' : 'Alertes Actives'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {alertes.filter(a => a.niveau === 'critique').length} {isAr ? 'حرجة' : 'critiques'}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Users & Alerts */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* System Alerts */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <AlertTriangle size={20} className="text-amber-500" />
                  {isAr ? 'تنبيهات النظام' : 'Alertes Système'}
                </h2>
                <div className="flex items-center gap-3">
                  <button className="p-2 text-slate-400 hover:text-amber-500 transition-colors">
                    <Filter size={16} />
                  </button>
                  <button className="text-sm text-amber-500 hover:underline">
                    {isAr ? 'عرض الكل' : 'Voir tout'}
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {alertes.map(alerte => (
                  <div key={alerte.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-500 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-1 rounded ${getNiveauColor(alerte.niveau)}`}>
                            {getTypeIcon(alerte.type)}
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">
                            {alerte.titre}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getNiveauColor(alerte.niveau)}`}>
                            {isAr ? 
                              (alerte.niveau === 'info' ? 'معلومات' : 
                               alerte.niveau === 'attention' ? 'انتباه' : 'حرج') :
                              alerte.niveau.toUpperCase()
                            }
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatutColor(alerte.statut)}`}>
                            {isAr ? 
                              (alerte.statut === 'nouveau' ? 'جديد' : 
                               alerte.statut === 'en_cours' ? 'جاري' : 'محلول') :
                              alerte.statut.replace('_', ' ').toUpperCase()
                            }
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {alerte.description}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock size={12} />
                          {alerte.dateCreation.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-amber-500 transition-colors">
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Users Management */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Users size={20} className="text-blue-500" />
                  {isAr ? 'إدارة المستخدمين' : 'Gestion Utilisateurs'}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Search size={14} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder={isAr ? 'البحث عن مستخدم...' : 'Rechercher utilisateur...'}
                      className="bg-transparent border-none outline-none text-sm w-40"
                    />
                  </div>
                  <button className="text-sm text-blue-500 hover:underline">
                    {isAr ? 'عرض الكل' : 'Voir tout'}
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {utilisateurs.map(utilisateur => (
                  <div key={utilisateur.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-500 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">
                            {utilisateur.nom}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatutColor(utilisateur.statut)}`}>
                            {isAr ? 
                              (utilisateur.statut === 'actif' ? 'نشط' : 
                               utilisateur.statut === 'inactif' ? 'غير نشط' : 'معلق') :
                              utilisateur.statut.toUpperCase()
                            }
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400 mb-2">
                          <div className="flex items-center gap-2">
                            <span><strong>{isAr ? 'البريد:' : 'Email:'}</strong> {utilisateur.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span><strong>{isAr ? 'الدور:' : 'Rôle:'}</strong> {utilisateur.role}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span><strong>{isAr ? 'المنظمة:' : 'Organisation:'}</strong> {utilisateur.organisation}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span><strong>{isAr ? 'الرصيد:' : 'Crédits:'}</strong> {utilisateur.credits}</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-slate-500">
                          {isAr ? 'آخر دخول:' : 'Dernier accès:'} {utilisateur.dernierAcces.toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* System Metrics */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-green-500" />
                {isAr ? 'مقاييس النظام' : 'Métriques Système'}
              </h3>
              
              <div className="space-y-4">
                {metriques.map((metrique, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {metrique.nom}
                        </span>
                        {getTendanceIcon(metrique.tendance)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {metrique.valeur}{metrique.unite}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${getStatutColor(metrique.statut)}`}>
                          {metrique.statut}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 py-2 bg-green-500 text-white rounded-lg font-bold text-sm hover:bg-green-600 transition-colors">
                {isAr ? 'تحديث المقاييس' : 'Actualiser Métriques'}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Zap size={18} className="text-red-600" />
                {isAr ? 'إجراءات سريعة' : 'Actions Rapides'}
              </h3>
              
              <div className="space-y-3">
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-red-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'إدارة المستخدمين' : 'Gestion Utilisateurs'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-red-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Settings size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'إعدادات النظام' : 'Configuration Système'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-red-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Database size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'نسخ احتياطي' : 'Sauvegarde Données'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-red-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'سجل الأمان' : 'Journal Sécurité'}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl border border-green-200 dark:border-green-800 p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-800 dark:text-green-200">
                <CheckCircle size={18} />
                {isAr ? 'حالة النظام' : 'État du Système'}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server size={14} className="text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-300">
                      {isAr ? 'الخوادم' : 'Serveurs'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-green-600">
                    {isAr ? 'تعمل' : 'OPÉRATIONNEL'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={14} className="text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-300">
                      {isAr ? 'قاعدة البيانات' : 'Base de données'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-green-600">
                    {isAr ? 'تعمل' : 'OPÉRATIONNEL'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi size={14} className="text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-300">
                      {isAr ? 'الشبكة' : 'Réseau'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-green-600">
                    {isAr ? 'تعمل' : 'OPÉRATIONNEL'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock size={14} className="text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-300">
                      {isAr ? 'الأمان' : 'Sécurité'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-green-600">
                    {isAr ? 'آمن' : 'SÉCURISÉ'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <div className="text-xs text-green-700 dark:text-green-300 text-center">
                  {isAr ? 'جميع الأنظمة تعمل بشكل طبيعي' : 'Tous les systèmes fonctionnent normalement'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Information */}
        <div className="bg-gradient-to-r from-red-600 to-red-600/80 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-2">
                {isAr ? 'إدارة المنصة' : 'Administration Plateforme'}
              </h3>
              <p className="text-red-100 text-sm">
                {isAr ? 'إدارة شاملة لمنصة JuristDZ - النظام القانوني الذكي للجزائر' : 'Gestion complète de la plateforme JuristDZ - Système juridique intelligent pour l\'Algérie'}
              </p>
              <p className="text-red-100 text-xs mt-1">
                {isAr ? 'مدير نظام معتمد - صلاحيات كاملة' : 'Administrateur système certifié - Accès complet'}
              </p>
            </div>
            <Settings size={48} className="text-red-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInterface;