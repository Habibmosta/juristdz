import React, { useState } from 'react';
import { Language, EnhancedUserProfile } from '../../types';
import { SearchResult, JurisprudenceResult, LegalText } from '../../types/search';
import { UI_TRANSLATIONS } from '../../constants';
import AdvancedSearch from '../search/AdvancedSearch';
import SearchResults from '../search/SearchResults';
import { searchService } from '../../services/searchService';
import { 
  Crown, 
  FileText, 
  Search, 
  BookOpen, 
  Scale, 
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Gavel,
  Eye,
  Download,
  Plus,
  Filter,
  Building,
  MapPin
} from 'lucide-react';

interface MagistratInterfaceProps {
  user: EnhancedUserProfile;
  language: Language;
  theme?: 'light' | 'dark';
}

interface Affaire {
  id: string;
  numero: string;
  type: string;
  parties: string[];
  objet: string;
  dateAudience?: Date;
  statut: 'instruction' | 'delibere' | 'juge';
  urgence: 'normale' | 'urgente' | 'tres_urgente';
}

interface Jugement {
  id: string;
  numero: string;
  affaire: string;
  type: string;
  dateRendu: Date;
  dispositif: string;
  statut: 'definitif' | 'appel_possible' | 'appele';
}

/**
 * Specialized interface for Magistrat (Judge) role
 * Features: Judgment drafting, jurisprudence research, case analysis
 * Validates: Requirements 2.4 - Magistrat interface with judgment tools and research
 */
const MagistratInterface: React.FC<MagistratInterfaceProps> = ({
  user,
  language,
  theme = 'light'
}) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult<JurisprudenceResult | LegalText> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Mock data for pending cases
  const [affairesEnInstance] = useState<Affaire[]>([
    {
      id: '1',
      numero: '2024/C/0156',
      type: 'Civil - Responsabilité contractuelle',
      parties: ['SPA BATIMENT MODERNE', 'M. Ahmed Benali'],
      objet: 'Demande de dommages-intérêts pour malfaçons',
      dateAudience: new Date('2024-03-15'),
      statut: 'instruction',
      urgence: 'normale'
    },
    {
      id: '2',
      numero: '2024/C/0157',
      type: 'Commercial - Résolution de contrat',
      parties: ['SARL IMPORT-EXPORT', 'Banque Nationale d\'Algérie'],
      objet: 'Résolution de contrat de crédit commercial',
      dateAudience: new Date('2024-03-18'),
      statut: 'delibere',
      urgence: 'urgente'
    },
    {
      id: '3',
      numero: '2024/F/0089',
      type: 'Famille - Divorce',
      parties: ['Mme Fatima Khelifi', 'M. Yacine Khelifi'],
      objet: 'Divorce pour faute avec garde d\'enfants',
      dateAudience: new Date('2024-03-20'),
      statut: 'instruction',
      urgence: 'tres_urgente'
    }
  ]);

  // Mock data for recent judgments
  const [jugementsRecents] = useState<Jugement[]>([
    {
      id: '1',
      numero: '2024/J/0234',
      affaire: '2024/C/0145',
      type: 'Jugement au fond',
      dateRendu: new Date('2024-03-01'),
      dispositif: 'Condamne le défendeur au paiement de 2.500.000 DA',
      statut: 'definitif'
    },
    {
      id: '2',
      numero: '2024/J/0235',
      affaire: '2024/C/0148',
      type: 'Ordonnance de référé',
      dateRendu: new Date('2024-03-05'),
      dispositif: 'Ordonne la cessation des troubles de voisinage',
      statut: 'appel_possible'
    }
  ]);

  const [statistiques] = useState({
    affairesEnInstance: 23,
    jugementsRendus: 45,
    audiencesSemaine: 8,
    tauxConfirmation: 87
  });

  // Handle search functionality
  const handleSearch = async (query: any) => {
    setIsSearching(true);
    try {
      const results = await searchService.searchJurisprudence(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: JurisprudenceResult | LegalText) => {
    // Handle result click - could open in modal or navigate to detail view
    console.log('Result clicked:', result);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'instruction': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'delibere': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'juge': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'definitif': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'appel_possible': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'appele': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getUrgenceColor = (urgence: string) => {
    switch (urgence) {
      case 'normale': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      case 'urgente': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'tres_urgente': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'instruction': return <Clock size={14} />;
      case 'delibere': return <AlertTriangle size={14} />;
      case 'juge': return <CheckCircle size={14} />;
      case 'definitif': return <CheckCircle size={14} />;
      case 'appel_possible': return <AlertTriangle size={14} />;
      case 'appele': return <TrendingUp size={14} />;
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
              <Crown className="text-purple-600" size={32} />
              {isAr ? 'مكتب القضاء' : 'Bureau du Magistrat'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr ? `مرحباً سعادة القاضي ${user.firstName}` : `Bienvenue Monsieur/Madame le Juge ${user.lastName}`}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className={`px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${
                showSearch 
                  ? 'bg-purple-600 text-white border-purple-600' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-600'
              }`}
            >
              <Search size={16} className="inline mr-2" />
              {isAr ? 'بحث متقدم' : 'Recherche Avancée'}
            </button>
            <button className="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
              <Plus size={18} />
              {isAr ? 'حكم جديد' : 'Nouveau Jugement'}
            </button>
          </div>
        </div>

        {/* Search Interface */}
        {showSearch && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Search size={20} className="text-purple-600" />
                {isAr ? 'البحث في الاجتهاد القضائي والنصوص القانونية' : 'Recherche Jurisprudentielle et Textes Légaux'}
              </h2>
            </div>
            
            <div className="p-6">
              <AdvancedSearch
                language={language}
                theme={theme}
                onSearch={handleSearch}
                isLoading={isSearching}
              />
              
              {searchResults && (
                <div className="mt-8">
                  <SearchResults
                    results={searchResults}
                    searchType="jurisprudence"
                    language={language}
                    theme={theme}
                    onResultClick={handleResultClick}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                <Scale size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {statistiques.affairesEnInstance}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'القضايا المعلقة' : 'Affaires en Instance'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'للبت فيها' : 'À juger'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                <Gavel size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {statistiques.jugementsRendus}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'الأحكام الصادرة' : 'Jugements Rendus'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'هذا الشهر' : 'Ce mois-ci'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                <Calendar size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {statistiques.audiencesSemaine}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'جلسات هذا الأسبوع' : 'Audiences cette Semaine'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'مجدولة' : 'Programmées'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {statistiques.tauxConfirmation}%
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'معدل التأييد' : 'Taux de Confirmation'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'في الاستئناف' : 'En appel'}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Pending Cases */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Cases List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Scale size={20} className="text-purple-600" />
                  {isAr ? 'القضايا المعلقة' : 'Affaires en Instance'}
                </h2>
                <div className="flex items-center gap-3">
                  <button className="p-2 text-slate-400 hover:text-purple-600 transition-colors">
                    <Filter size={16} />
                  </button>
                  <button className="text-sm text-purple-600 hover:underline">
                    {isAr ? 'عرض الكل' : 'Voir tout'}
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {affairesEnInstance.map(affaire => (
                  <div key={affaire.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-purple-600 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-bold text-purple-600">
                            {affaire.numero}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatutColor(affaire.statut)}`}>
                            {getStatutIcon(affaire.statut)}
                            {isAr ? 
                              (affaire.statut === 'instruction' ? 'تحقيق' : 
                               affaire.statut === 'delibere' ? 'مداولة' : 'محكوم') :
                              affaire.statut.toUpperCase()
                            }
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getUrgenceColor(affaire.urgence)}`}>
                            {isAr ? 
                              (affaire.urgence === 'normale' ? 'عادي' : 
                               affaire.urgence === 'urgente' ? 'عاجل' : 'عاجل جداً') :
                              affaire.urgence.replace('_', ' ').toUpperCase()
                            }
                          </span>
                        </div>
                        
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                          {affaire.type}
                        </h3>
                        
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400 mb-3">
                          <div className="flex items-center gap-2">
                            <Users size={14} />
                            <span><strong>{isAr ? 'الأطراف:' : 'Parties:'}</strong> {affaire.parties.join(' c/ ')}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <FileText size={14} className="mt-0.5" />
                            <span><strong>{isAr ? 'الموضوع:' : 'Objet:'}</strong> {affaire.objet}</span>
                          </div>
                          {affaire.dateAudience && (
                            <div className="flex items-center gap-2">
                              <Calendar size={14} />
                              <span className="text-purple-600 font-bold">
                                {isAr ? 'الجلسة:' : 'Audience:'} {affaire.dateAudience.toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-purple-600 transition-colors">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-purple-600 transition-colors">
                          <FileText size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Judgments */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Gavel size={20} className="text-green-600" />
                  {isAr ? 'الأحكام الأخيرة' : 'Jugements Récents'}
                </h2>
                <button className="text-sm text-green-600 hover:underline">
                  {isAr ? 'عرض الكل' : 'Voir tout'}
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {jugementsRecents.map(jugement => (
                  <div key={jugement.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-green-600 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-bold text-green-600">
                            {jugement.numero}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatutColor(jugement.statut)}`}>
                            {getStatutIcon(jugement.statut)}
                            {isAr ? 
                              (jugement.statut === 'definitif' ? 'نهائي' : 
                               jugement.statut === 'appel_possible' ? 'قابل للاستئناف' : 'مستأنف') :
                              jugement.statut.replace('_', ' ').toUpperCase()
                            }
                          </span>
                        </div>
                        
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                          {jugement.type}
                        </h3>
                        
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400 mb-3">
                          <div className="flex items-center gap-2">
                            <FileText size={14} />
                            <span><strong>{isAr ? 'القضية:' : 'Affaire:'}</strong> {jugement.affaire}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Scale size={14} className="mt-0.5" />
                            <span><strong>{isAr ? 'المنطوق:' : 'Dispositif:'}</strong> {jugement.dispositif}</span>
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
                        {isAr ? 'تاريخ الصدور:' : 'Rendu le'} {jugement.dateRendu.toLocaleDateString()}
                      </span>
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
                <Crown size={18} className="text-purple-600" />
                {isAr ? 'إجراءات سريعة' : 'Actions Rapides'}
              </h3>
              
              <div className="space-y-3">
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-purple-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Gavel size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'صياغة حكم' : 'Rédiger un Jugement'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-purple-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'أمر على عريضة' : 'Ordonnance sur Requête'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-purple-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'أمر استعجالي' : 'Ordonnance de Référé'}
                    </span>
                  </div>
                </button>
                
                <button 
                  onClick={() => setShowSearch(true)}
                  className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-purple-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Search size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'بحث في الاجتهاد' : 'Recherche Jurisprudentielle'}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Jurisprudence Search */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen size={18} className="text-purple-600" />
                {isAr ? 'بحث متقدم' : 'Recherche Avancée'}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isAr ? 'المجال القانوني' : 'Domaine juridique'}
                  </label>
                  <select className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800">
                    <option>{isAr ? 'القانون المدني' : 'Droit civil'}</option>
                    <option>{isAr ? 'القانون التجاري' : 'Droit commercial'}</option>
                    <option>{isAr ? 'قانون الأسرة' : 'Droit de la famille'}</option>
                    <option>{isAr ? 'القانون الإداري' : 'Droit administratif'}</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isAr ? 'الكلمات المفتاحية' : 'Mots-clés'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'مسؤولية، عقد، ضرر...' : 'responsabilité, contrat, dommage...'}
                    className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isAr ? 'المحكمة' : 'Juridiction'}
                  </label>
                  <select className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800">
                    <option>{isAr ? 'المحكمة العليا' : 'Cour Suprême'}</option>
                    <option>{isAr ? 'مجلس الدولة' : 'Conseil d\'État'}</option>
                    <option>{isAr ? 'محكمة الاستئناف' : 'Cour d\'Appel'}</option>
                  </select>
                </div>
                
                <button className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 transition-colors">
                  {isAr ? 'بحث' : 'Rechercher'}
                </button>
              </div>
            </div>

            {/* Court Calendar */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-2xl border border-purple-200 dark:border-purple-800 p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-purple-800 dark:text-purple-200">
                <Calendar size={18} />
                {isAr ? 'جدول الجلسات' : 'Calendrier des Audiences'}
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-700">
                  <div className="font-bold text-sm text-purple-900 dark:text-purple-200">
                    {isAr ? 'اليوم - 14:00' : 'Aujourd\'hui - 14:00'}
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    {isAr ? 'قضية رقم 2024/C/0156' : 'Affaire n° 2024/C/0156'}
                  </div>
                </div>
                
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-700">
                  <div className="font-bold text-sm text-purple-900 dark:text-purple-200">
                    {isAr ? 'غداً - 09:30' : 'Demain - 09:30'}
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    {isAr ? 'قضية رقم 2024/C/0157' : 'Affaire n° 2024/C/0157'}
                  </div>
                </div>
                
                <button className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 transition-colors">
                  {isAr ? 'عرض الجدول الكامل' : 'Voir Planning Complet'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Court Information */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-600/80 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-2">
                {isAr ? 'معلومات المحكمة' : 'Informations Tribunal'}
              </h3>
              <p className="text-purple-100 text-sm">
                {user.organizationName ? 
                  (isAr ? `يعمل في: ${user.organizationName}` : `En fonction au: ${user.organizationName}`) :
                  (isAr ? 'يرجى تحديث معلومات المحكمة' : 'Veuillez mettre à jour vos informations de tribunal')
                }
              </p>
              <p className="text-purple-100 text-xs mt-1">
                {isAr ? 'قاضي معين - الجمهورية الجزائرية الديمقراطية الشعبية' : 'Magistrat assermenté - République Algérienne Démocratique et Populaire'}
              </p>
            </div>
            <Crown size={48} className="text-purple-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagistratInterface;