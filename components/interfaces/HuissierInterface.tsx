import React, { useState } from 'react';
import { Language, EnhancedUserProfile } from '../../types';
import { UI_TRANSLATIONS } from '../../constants';
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
  
  // Mock data for exploits
  const [recentExploits] = useState<Exploit[]>([
    {
      id: '1',
      numero: '2024/H/001',
      type: 'Commandement de payer',
      debiteur: 'SARL BENALI FRERES',
      creancier: 'Banque Nationale d\'Algérie',
      montant: 2500000,
      adresse: '15 Rue Didouche Mourad, Alger',
      dateCreation: new Date('2024-03-01'),
      dateSignification: new Date('2024-03-02'),
      statut: 'signifie'
    },
    {
      id: '2',
      numero: '2024/H/002',
      type: 'Assignation en référé',
      debiteur: 'M. Ahmed Khelifi',
      creancier: 'SPA CONSTRUCTION MODERNE',
      montant: 850000,
      adresse: '42 Cité des Palmiers, Oran',
      dateCreation: new Date('2024-03-05'),
      statut: 'preparation'
    },
    {
      id: '3',
      numero: '2024/H/003',
      type: 'Procès-verbal de saisie',
      debiteur: 'Mme Fatima Boudiaf',
      creancier: 'Cabinet Médical Dr. Mansouri',
      montant: 125000,
      adresse: '8 Boulevard Zighout Youcef, Constantine',
      dateCreation: new Date('2024-03-08'),
      dateSignification: new Date('2024-03-10'),
      statut: 'execute'
    }
  ]);

  // Mock data for execution procedures
  const [proceduresExecution] = useState<ProcedureExecution[]>([
    {
      id: '1',
      type: 'Saisie immobilière',
      debiteur: 'M. Larbi Benali',
      montantDu: 5200000,
      biensSaisis: ['Appartement F4 - Hydra', 'Local commercial - Centre-ville'],
      statut: 'en_cours'
    },
    {
      id: '2',
      type: 'Saisie mobilière',
      debiteur: 'EURL TRANSPORT RAPIDE',
      montantDu: 1800000,
      biensSaisis: ['Camion Mercedes 2020', 'Équipements bureau'],
      statut: 'terminee'
    }
  ]);

  const [monthlyStats] = useState({
    exploitsSignifies: 28,
    fraisPerçus: '186,500',
    proceduresEnCours: 12,
    tauxRecouvrement: 78
  });

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
            <button className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
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
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {monthlyStats.exploitsSignifies}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'الاستدعاءات المبلغة' : 'Exploits Signifiés'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'هذا الشهر' : 'Ce mois-ci'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                <DollarSign size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {monthlyStats.fraisPerçus}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'الرسوم المحصلة (دج)' : 'Frais Perçus (DA)'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'وفقاً للتعريفة الرسمية' : 'Selon tarif officiel'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl">
                <Scale size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {monthlyStats.proceduresEnCours}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'إجراءات التنفيذ' : 'Procédures en Cours'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'قيد التنفيذ' : 'En cours d\'exécution'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {monthlyStats.tauxRecouvrement}%
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'معدل الاسترداد' : 'Taux de Recouvrement'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'متوسط سنوي' : 'Moyenne annuelle'}
            </p>
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
                {recentExploits.map(exploit => (
                  <div key={exploit.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-green-600 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-bold text-green-600">
                            {exploit.numero}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatutColor(exploit.statut)}`}>
                            {getStatutIcon(exploit.statut)}
                            {isAr ? 
                              (exploit.statut === 'preparation' ? 'قيد التحضير' : 
                               exploit.statut === 'signifie' ? 'مبلغ' : 'منفذ') :
                              exploit.statut.toUpperCase()
                            }
                          </span>
                        </div>
                        
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                          {exploit.type}
                        </h3>
                        
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Users size={14} />
                            <span><strong>{isAr ? 'المدين:' : 'Débiteur:'}</strong> {exploit.debiteur}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building size={14} />
                            <span><strong>{isAr ? 'الدائن:' : 'Créancier:'}</strong> {exploit.creancier}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} />
                            <span><strong>{isAr ? 'العنوان:' : 'Adresse:'}</strong> {exploit.adresse}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} />
                            <span className="text-green-600 font-bold">
                              {exploit.montant.toLocaleString()} DA
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-green-600 transition-colors">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-green-600 transition-colors">
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={12} />
                        {isAr ? 'تاريخ الإنشاء:' : 'Créé le'} {exploit.dateCreation.toLocaleDateString()}
                      </span>
                      {exploit.dateSignification && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle size={12} />
                          {isAr ? 'مبلغ في:' : 'Signifié le'} {exploit.dateSignification.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Procedures */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Scale size={20} className="text-orange-600" />
                  {isAr ? 'إجراءات التنفيذ' : 'Procédures d\'Exécution'}
                </h2>
                <button className="text-sm text-orange-600 hover:underline">
                  {isAr ? 'عرض الكل' : 'Voir tout'}
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {proceduresExecution.map(procedure => (
                  <div key={procedure.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-orange-600 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
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
                          <div className="flex items-center gap-2">
                            <Users size={14} />
                            <span><strong>{isAr ? 'المدين:' : 'Débiteur:'}</strong> {procedure.debiteur}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} />
                            <span className="text-red-600 font-bold">
                              {isAr ? 'المبلغ المستحق:' : 'Montant dû:'} {procedure.montantDu.toLocaleString()} DA
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <strong className="text-xs text-slate-500 uppercase tracking-wider">
                            {isAr ? 'الأموال المحجوزة:' : 'Biens saisis:'}
                          </strong>
                          <ul className="mt-1 space-y-1">
                            {procedure.biensSaisis.map((bien, index) => (
                              <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                {bien.includes('Appartement') || bien.includes('Local') ? <Home size={12} /> : <Truck size={12} />}
                                {bien}
                              </li>
                            ))}
                          </ul>
                        </div>
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
                    <Home size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'محضر حجز' : 'Procès-Verbal de Saisie'}
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

            {/* Fee Calculator */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl border border-green-200 dark:border-green-800 p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-800 dark:text-green-200">
                <Calculator size={18} />
                {isAr ? 'حاسبة الرسوم' : 'Calculateur de Frais'}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">
                    {isAr ? 'نوع الإجراء' : 'Type d\'acte'}
                  </label>
                  <select className="w-full mt-1 p-2 border border-green-200 dark:border-green-700 rounded-lg text-sm bg-white dark:bg-slate-800">
                    <option>{isAr ? 'أمر بالدفع' : 'Commandement de payer'}</option>
                    <option>{isAr ? 'استدعاء' : 'Assignation'}</option>
                    <option>{isAr ? 'محضر حجز' : 'Procès-verbal de saisie'}</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">
                    {isAr ? 'المبلغ (دج)' : 'Montant (DA)'}
                  </label>
                  <input
                    type="number"
                    placeholder="500000"
                    className="w-full mt-1 p-2 border border-green-200 dark:border-green-700 rounded-lg text-sm bg-white dark:bg-slate-800"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">
                    {isAr ? 'المسافة (كم)' : 'Distance (km)'}
                  </label>
                  <input
                    type="number"
                    placeholder="25"
                    className="w-full mt-1 p-2 border border-green-200 dark:border-green-700 rounded-lg text-sm bg-white dark:bg-slate-800"
                  />
                </div>
                
                <button className="w-full py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-colors">
                  {isAr ? 'حساب الرسوم' : 'Calculer les Frais'}
                </button>
                
                <div className="text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                  {isAr ? 'الحساب وفقاً للتعريفة الرسمية للمحضرين' : 'Calcul selon le tarif officiel des huissiers'}
                </div>
              </div>
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
                
                {user.organizationName && (
                  <div className="flex items-center gap-3">
                    <Building size={14} className="text-slate-400" />
                    <span>{user.organizationName}</span>
                  </div>
                )}
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
                {user.registrationNumber ? 
                  (isAr ? `رقم التسجيل: ${user.registrationNumber}` : `N° d'inscription: ${user.registrationNumber}`) :
                  (isAr ? 'يرجى تحديث معلوماتك المهنية' : 'Veuillez mettre à jour vos informations professionnelles')
                }
              </p>
              <p className="text-green-100 text-xs mt-1">
                {isAr ? 'محضر قضائي معتمد - الجمهورية الجزائرية' : 'Huissier de Justice assermenté - République Algérienne'}
              </p>
            </div>
            <Gavel size={48} className="text-green-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HuissierInterface;