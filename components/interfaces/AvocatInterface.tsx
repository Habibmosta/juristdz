import React, { useState, useEffect } from 'react';
import { Language, Case, EnhancedUserProfile } from '../../types';
import { SearchResult, JurisprudenceResult, LegalText } from '../../types/search';
import { UI_TRANSLATIONS } from '../../constants';
import AdvancedSearch from '../search/AdvancedSearch';
import SearchResults from '../search/SearchResults';
import { searchService } from '../../services/searchService';
import { 
  Scale, 
  Search, 
  Briefcase, 
  FileText, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar,
  AlertTriangle,
  TrendingUp,
  Plus,
  Filter,
  MoreVertical,
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  Gavel,
  BookOpen,
  Calculator
} from 'lucide-react';

interface AvocatInterfaceProps {
  user: EnhancedUserProfile;
  language: Language;
  theme?: 'light' | 'dark';
}

/**
 * Specialized interface for Avocat (Lawyer) role
 * Features: Case management, jurisprudence search, client billing, document drafting
 * Validates: Requirements 2.1 - Avocat interface with specialized tools
 */
const AvocatInterface: React.FC<AvocatInterfaceProps> = ({
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
  
  // Mock data - in real implementation, this would come from API
  const [activeCases, setActiveCases] = useState<Case[]>([
    {
      id: '1',
      title: 'Affaire Benali vs. Société SARL',
      clientName: 'M. Ahmed Benali',
      description: 'Litige commercial concernant un contrat de fourniture',
      createdAt: new Date('2024-01-15'),
      status: 'active'
    },
    {
      id: '2', 
      title: 'Divorce contentieux Mme Khadija',
      clientName: 'Mme Khadija Mansouri',
      description: 'Procédure de divorce avec garde d\'enfants',
      createdAt: new Date('2024-02-01'),
      status: 'active'
    }
  ]);

  const [recentSearches] = useState([
    'Jurisprudence divorce garde enfants',
    'Code civil algérien article 87',
    'Contrat commercial nullité'
  ]);

  const [upcomingDeadlines] = useState([
    { case: 'Affaire Benali', deadline: '2024-03-15', type: 'Dépôt conclusions' },
    { case: 'Divorce Mansouri', deadline: '2024-03-20', type: 'Audience' }
  ]);

  const [monthlyStats] = useState({
    revenue: '125,400',
    newCases: 8,
    closedCases: 5,
    billableHours: 156
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

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <Scale className="text-legal-blue" size={32} />
              {isAr ? 'مكتب المحاماة' : 'Cabinet d\'Avocat'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr ? `مرحباً ${user.firstName} - إدارة شاملة للقضايا والعملاء` : `Bienvenue Maître ${user.lastName} - Gestion complète de votre cabinet`}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className={`px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${
                showSearch 
                  ? 'bg-legal-blue text-white border-legal-blue' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-legal-blue'
              }`}
            >
              <Search size={16} className="inline mr-2" />
              {isAr ? 'البحث القانوني' : 'Recherche Juridique'}
            </button>
            <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:border-legal-blue transition-colors">
              <Calendar size={16} className="inline mr-2" />
              {isAr ? 'الأجندة' : 'Agenda'}
            </button>
            <button className="px-6 py-2 bg-legal-blue text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
              <Plus size={18} />
              {isAr ? 'قضية جديدة' : 'Nouveau Dossier'}
            </button>
          </div>
        </div>

        {/* Search Interface */}
        {showSearch && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Search size={20} className="text-legal-blue" />
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
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                <Briefcase size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {activeCases.length}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'القضايا النشطة' : 'Dossiers Actifs'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? '+2 هذا الأسبوع' : '+2 cette semaine'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                <DollarSign size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {monthlyStats.revenue}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'الإيرادات الشهرية' : 'CA Mensuel (DA)'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? '+15% مقارنة بالشهر الماضي' : '+15% vs mois dernier'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                <Clock size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {upcomingDeadlines.length}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'المواعيد العاجلة' : 'Délais Urgents'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'خلال 7 أيام' : 'Dans les 7 jours'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {monthlyStats.billableHours}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {isAr ? 'ساعات قابلة للفوترة' : 'Heures Facturables'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'هذا الشهر' : 'Ce mois-ci'}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Cases */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Briefcase size={20} className="text-legal-blue" />
                {isAr ? 'القضايا النشطة' : 'Dossiers en Cours'}
              </h2>
              <button className="text-sm text-legal-blue hover:underline">
                {isAr ? 'عرض الكل' : 'Voir tout'}
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {activeCases.map(case_ => (
                <div key={case_.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-legal-blue transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                        {case_.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <User size={14} />
                        {case_.clientName}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {case_.description}
                      </p>
                    </div>
                    <button className="p-1 text-slate-400 hover:text-slate-600">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500">
                      {isAr ? 'تاريخ الإنشاء:' : 'Créé le'} {case_.createdAt.toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                        {isAr ? 'نشط' : 'ACTIF'}
                      </span>
                      <ChevronRight size={16} className="text-slate-400" />
                    </div>
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
                <Gavel size={18} className="text-legal-blue" />
                {isAr ? 'إجراءات سريعة' : 'Actions Rapides'}
              </h3>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setShowSearch(true)}
                  className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-legal-blue transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Search size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'بحث في الاجتهاد القضائي' : 'Recherche Jurisprudentielle'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-legal-blue transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'صياغة مذكرة' : 'Rédiger un Mémoire'}
                    </span>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-legal-blue transition-colors">
                  <div className="flex items-center gap-3">
                    <Calculator size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'حساب الأتعاب' : 'Calculer Honoraires'}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Searches */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen size={18} className="text-legal-blue" />
                {isAr ? 'البحوث الأخيرة' : 'Recherches Récentes'}
              </h3>
              
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button key={index} className="w-full p-2 text-left text-sm text-slate-600 dark:text-slate-400 hover:text-legal-blue transition-colors">
                    • {search}
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                {isAr ? 'المواعيد القادمة' : 'Échéances Prochaines'}
              </h3>
              
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <div className="font-bold text-sm text-amber-900 dark:text-amber-200">
                      {deadline.case}
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      {deadline.type} - {deadline.deadline}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Barreau Information */}
        <div className="bg-gradient-to-r from-legal-blue to-legal-blue/80 text-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-2">
                {isAr ? 'معلومات النقابة' : 'Informations Barreau'}
              </h3>
              <p className="text-blue-100 text-sm">
                {user.barreauId ? 
                  (isAr ? `مسجل في نقابة: ${user.barreauId}` : `Inscrit au Barreau: ${user.barreauId}`) :
                  (isAr ? 'يرجى تحديث معلومات النقابة' : 'Veuillez mettre à jour vos informations de barreau')
                }
              </p>
              {user.registrationNumber && (
                <p className="text-blue-100 text-xs mt-1">
                  {isAr ? `رقم التسجيل: ${user.registrationNumber}` : `N° d'inscription: ${user.registrationNumber}`}
                </p>
              )}
            </div>
            <Scale size={48} className="text-blue-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvocatInterface;