import React, { useState } from 'react';
import { Language, EnhancedUserProfile } from '../../types';
import { UI_TRANSLATIONS } from '../../constants';
import { 
  Building, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Plus,
  Search,
  Filter,
  Bell,
  BarChart3,
  Users,
  Calendar,
  Briefcase,
  Scale,
  BookOpen,
  Target,
  Zap
} from 'lucide-react';

interface JuristeEntrepriseInterfaceProps {
  user: EnhancedUserProfile;
  language: Language;
  theme?: 'light' | 'dark';
}

interface AlerteConformite {
  id: string;
  titre: string;
  domaine: string;
  niveau: 'info' | 'attention' | 'critique';
  dateEcheance: Date;
  statut: 'nouveau' | 'en_cours' | 'resolu';
  description: string;
}

interface ContratEnCours {
  id: string;
  nom: string;
  contrepartie: string;
  type: string;
  valeur: number;
  dateSignature?: Date;
  dateEcheance: Date;
  statut: 'negociation' | 'revision' | 'signe' | 'expire';
  risque: 'faible' | 'moyen' | 'eleve';
}

interface VeilleJuridique {
  id: string;
  titre: string;
  source: string;
  domaine: string;
  datePublication: Date;
  impact: 'faible' | 'moyen' | 'fort';
  resume: string;
}

/**
 * Specialized interface for Juriste Entreprise (Corporate Lawyer) role
 * Features: Legal watch, contract management, compliance analysis
 * Validates: Requirements 2.6 - Corporate lawyer interface with compliance and contracts
 */
const JuristeEntrepriseInterface: React.FC<JuristeEntrepriseInterfaceProps> = ({
  user,
  language,
  theme = 'light'
}) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';
  
  // Mock data for compliance alerts
  const [alertesConformite] = useState<AlerteConformite[]>([
    {
      id: '1',
      titre: 'Mise à jour RGPD - Nouvelles obligations',
      domaine: 'Protection des données',
      niveau: 'critique',
      dateEcheance: new Date('2024-03-20'),
      statut: 'nouveau',
      description: 'Nouvelles obligations concernant le consentement explicite'
    },
    {
      id: '2',
      titre: 'Déclaration fiscale trimestrielle',
      domaine: 'Fiscal',
      niveau: 'attention',
      dateEcheance: new Date('2024-03-31'),
      statut: 'en_cours',
      description: 'Préparation de la déclaration TVA Q1 2024'
    },
    {
      id: '3',
      titre: 'Renouvellement licences logiciels',
      domaine: 'Propriété intellectuelle',
      niveau: 'info',
      dateEcheance: new Date('2024-04-15'),
      statut: 'nouveau',
      description: 'Renouvellement des licences Microsoft Office'
    }
  ]);

  // Mock data for contracts
  const [contratsEnCours] = useState<ContratEnCours[]>([
    {
      id: '1',
      nom: 'Contrat de fourniture IT',
      contrepartie: 'TechSolutions SARL',
      type: 'Fourniture',
      valeur: 2500000,
      dateSignature: new Date('2024-01-15'),
      dateEcheance: new Date('2024-12-31'),
      statut: 'signe',
      risque: 'faible'
    },
    {
      id: '2',
      nom: 'Accord de partenariat commercial',
      contrepartie: 'Global Trading SPA',
      type: 'Partenariat',
      valeur: 5000000,
      dateEcheance: new Date('2024-06-30'),
      statut: 'negociation',
      risque: 'moyen'
    },
    {
      id: '3',
      nom: 'Contrat de maintenance',
      contrepartie: 'Maintenance Pro',
      type: 'Service',
      valeur: 800000,
      dateSignature: new Date('2023-12-01'),
      dateEcheance: new Date('2024-03-25'),
      statut: 'expire',
      risque: 'eleve'
    }
  ]);

  // Mock data for legal watch
  const [veilleJuridique] = useState<VeilleJuridique[]>([
    {
      id: '1',
      titre: 'Nouvelle loi sur la protection des consommateurs',
      source: 'JORA n° 15/2024',
      domaine: 'Droit commercial',
      datePublication: new Date('2024-03-01'),
      impact: 'fort',
      resume: 'Renforcement des obligations d\'information précontractuelle'
    },
    {
      id: '2',
      titre: 'Circulaire fiscale - Déductions TVA',
      source: 'Direction Générale des Impôts',
      domaine: 'Droit fiscal',
      datePublication: new Date('2024-02-28'),
      impact: 'moyen',
      resume: 'Nouvelles conditions de déduction de la TVA sur les véhicules'
    }
  ]);

  const [statistiques] = useState({
    alertesActives: 8,
    contratsGeres: 24,
    conformiteScore: 92,
    veilleNouveautes: 15
  });

  const getNiveauColor = (niveau: string) => {
    switch (niveau) {
      case 'info': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'attention': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'critique': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRisqueColor = (risque: string) => {
    switch (risque) {
      case 'faible': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'moyen': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'eleve': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'nouveau': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'en_cours': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'resolu': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'negociation': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'revision': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'signe': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'expire': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'nouveau': return <Bell size={14} />;
      case 'en_cours': return <Clock size={14} />;
      case 'resolu': return <CheckCircle size={14} />;
      case 'negociation': return <Users size={14} />;
      case 'revision': return <FileText size={14} />;
      case 'signe': return <CheckCircle size={14} />;
      case 'expire': return <XCircle size={14} />;
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
              <Building className="text-indigo-600" size={32} />
              {isAr ? 'المستشار القانوني للشركة' : 'Direction Juridique Entreprise'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr ? `مرحباً ${user.firstName} - إدارة الامتثال والعقود` : `Bienvenue ${user.firstName} - Gestion de la conformité et des contrats`}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:border-indigo-600 transition-colors">
              <BarChart3 size={16} className="inline mr-2" />
              {isAr ? 'التقارير' : 'Rapports'}
            </button>
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
              <Plus size={18} />
              {isAr ? 'عقد جديد' : 'Nouveau Contrat'}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {statistiques.alertesActives}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'تنبيهات الامتثال' : 'Alertes Conformité'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'تتطلب اهتماماً' : 'Nécessitent attention'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                <FileText size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {statistiques.contratsGeres}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'العقود المُدارة' : 'Contrats Gérés'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'نشطة ومعلقة' : 'Actifs et en cours'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                <Shield size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {statistiques.conformiteScore}%
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'نقاط الامتثال' : 'Score Conformité'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'ممتاز' : 'Excellent'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {statistiques.veilleNouveautes}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'تحديثات قانونية' : 'Veille Juridique'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'هذا الأسبوع' : 'Cette semaine'}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Compliance Alerts & Contracts */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Compliance Alerts */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <AlertTriangle size={20} className="text-red-500" />
                  {isAr ? 'تنبيهات الامتثال' : 'Alertes de Conformité'}
                </h2>
                <div className="flex items-center gap-3">
                  <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <Filter size={16} />
                  </button>
                  <button className="text-sm text-red-500 hover:underline">
                    {isAr ? 'عرض الكل' : 'Voir tout'}
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {alertesConformite.map(alerte => (
                  <div key={alerte.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-red-500 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">
                            {alerte.titre}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getNiveauColor(alerte.niveau)}`}>
                            {alerte.niveau === 'critique' && <Zap size={12} />}
                            {isAr ? 
                              (alerte.niveau === 'info' ? 'معلومات' : 
                               alerte.niveau === 'attention' ? 'انتباه' : 'حرج') :
                              alerte.niveau.toUpperCase()
                            }
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatutColor(alerte.statut)}`}>
                            {getStatutIcon(alerte.statut)}
                            {isAr ? 
                              (alerte.statut === 'nouveau' ? 'جديد' : 
                               alerte.statut === 'en_cours' ? 'جاري' : 'محلول') :
                              alerte.statut.replace('_', ' ').toUpperCase()
                            }
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400 mb-3">
                          <div className="flex items-center gap-2">
                            <Scale size={14} />
                            <span><strong>{isAr ? 'المجال:' : 'Domaine:'}</strong> {alerte.domaine}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span className="text-red-600 font-bold">
                              <strong>{isAr ? 'الموعد النهائي:' : 'Échéance:'}</strong> {alerte.dateEcheance.toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-2">{alerte.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contracts */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <FileText size={20} className="text-blue-500" />
                  {isAr ? 'العقود الجارية' : 'Contrats en Cours'}
                </h2>
                <button className="text-sm text-blue-500 hover:underline">
                  {isAr ? 'عرض الكل' : 'Voir tout'}
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {contratsEnCours.map(contrat => (
                  <div key={contrat.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-500 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">
                            {contrat.nom}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatutColor(contrat.statut)}`}>
                            {getStatutIcon(contrat.statut)}
                            {isAr ? 
                              (contrat.statut === 'negociation' ? 'تفاوض' : 
                               contrat.statut === 'revision' ? 'مراجعة' : 
                               contrat.statut === 'signe' ? 'موقع' : 'منتهي') :
                              contrat.statut.toUpperCase()
                            }
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRisqueColor(contrat.risque)}`}>
                            {isAr ? 
                              (contrat.risque === 'faible' ? 'خطر منخفض' : 
                               contrat.risque === 'moyen' ? 'خطر متوسط' : 'خطر عالي') :
                              `RISQUE ${contrat.risque.toUpperCase()}`
                            }
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400 mb-3">
                          <div className="flex items-center gap-2">
                            <Building size={14} />
                            <span><strong>{isAr ? 'الطرف المقابل:' : 'Contrepartie:'}</strong> {contrat.contrepartie}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase size={14} />
                            <span><strong>{isAr ? 'النوع:' : 'Type:'}</strong> {contrat.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target size={14} />
                            <span className="text-green-600 font-bold">
                              <strong>{isAr ? 'القيمة:' : 'Valeur:'}</strong> {contrat.valeur.toLocaleString()} DA
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span className={contrat.statut === 'expire' ? 'text-red-600 font-bold' : ''}>
                              <strong>{isAr ? 'الانتهاء:' : 'Échéance:'}</strong> {contrat.dateEcheance.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                          <Download size={16} />
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
            
            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Building size={18} className="text-indigo-600" />
                {isAr ? 'إجراءات سريعة' : 'Actions Rapides'}
              </h3>
              
              <div className="space-y-3">
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'صياغة عقد تجاري' : 'Rédiger Contrat Commercial'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'تحليل المخاطر' : 'Analyse de Risques'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <BarChart3 size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'تقرير الامتثال' : 'Rapport de Conformité'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Search size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'بحث في التشريعات' : 'Recherche Réglementaire'}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Legal Watch */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen size={18} className="text-purple-600" />
                {isAr ? 'الرقابة القانونية' : 'Veille Juridique'}
              </h3>
              
              <div className="space-y-4">
                {veilleJuridique.map(veille => (
                  <div key={veille.id} className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-purple-600 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        veille.impact === 'fort' ? 'bg-red-500' : 
                        veille.impact === 'moyen' ? 'bg-amber-500' : 'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
                          {veille.titre}
                        </h4>
                        <div className="text-xs text-slate-500 mb-2">
                          {veille.source} • {veille.domaine} • {veille.datePublication.toLocaleDateString()}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {veille.resume}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 transition-colors">
                  {isAr ? 'عرض جميع التحديثات' : 'Voir Toutes les Mises à Jour'}
                </button>
              </div>
            </div>

            {/* Compliance Score */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl border border-green-200 dark:border-green-800 p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-800 dark:text-green-200">
                <Shield size={18} />
                {isAr ? 'نقاط الامتثال' : 'Score de Conformité'}
              </h3>
              
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {statistiques.conformiteScore}%
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  {isAr ? 'ممتاز - استمر هكذا!' : 'Excellent - Continuez ainsi !'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700 dark:text-green-300">
                    {isAr ? 'حماية البيانات' : 'Protection données'}
                  </span>
                  <span className="font-bold">95%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700 dark:text-green-300">
                    {isAr ? 'الامتثال المالي' : 'Conformité fiscale'}
                  </span>
                  <span className="font-bold">88%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700 dark:text-green-300">
                    {isAr ? 'قانون العمل' : 'Droit du travail'}
                  </span>
                  <span className="font-bold">94%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-600/80 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-2">
                {isAr ? 'معلومات الشركة' : 'Informations Entreprise'}
              </h3>
              <p className="text-indigo-100 text-sm">
                {user.organizationName ? 
                  (isAr ? `يعمل في: ${user.organizationName}` : `Direction Juridique - ${user.organizationName}`) :
                  (isAr ? 'يرجى تحديث معلومات الشركة' : 'Veuillez mettre à jour vos informations d\'entreprise')
                }
              </p>
              <p className="text-indigo-100 text-xs mt-1">
                {isAr ? 'مستشار قانوني معتمد - متخصص في قانون الشركات والامتثال' : 'Juriste certifié - Spécialisé en droit des sociétés et conformité'}
              </p>
            </div>
            <Building size={48} className="text-indigo-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JuristeEntrepriseInterface;