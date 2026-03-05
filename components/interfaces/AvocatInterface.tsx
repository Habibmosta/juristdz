import React, { useState, useEffect } from 'react';
import { Language, Case, EnhancedUserProfile } from '../../types';
import { SearchResult, JurisprudenceResult, LegalText } from '../../types/search';
import { UI_TRANSLATIONS } from '../../constants';
import AdvancedSearch from '../search/AdvancedSearch';
import SearchResults from '../search/SearchResults';
import NewCaseModal from '../modals/NewCaseModal';
import EditCaseModal from '../modals/EditCaseModal';
import { CaseDetailModal } from '../cases/CaseDetailModal';
import LawyerCalendarModal from '../calendar/LawyerCalendarModal';
import MemoireEditor from '../documents/MemoireEditor';
import HonorairesCalculator from '../billing/HonorairesCalculator';
import { searchService } from '../../services/searchService';
import { caseService } from '../../services/caseService';
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
  Calculator,
  CheckCircle,
  RefreshCw,
  Edit3,
  Trash2,
  X,
  Eye
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
  
  // Case management state
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showEditCaseModal, setShowEditCaseModal] = useState(false);
  const [showCaseDetail, setShowCaseDetail] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [viewingCase, setViewingCase] = useState<Case | null>(null);
  const [activeCases, setActiveCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [caseStats, setCaseStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Additional UI states
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMemoireForm, setShowMemoireForm] = useState(false);
  const [showHonorairesCalc, setShowHonorairesCalc] = useState(false);
  
  // Events state
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  // Load cases and statistics on component mount
  useEffect(() => {
    loadCases();
    loadCaseStatistics();
    loadUpcomingEvents();
  }, []);

  // Filter cases based on search and priority
  useEffect(() => {
    let filtered = activeCases;
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(case_ =>
        case_.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        case_.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        case_.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        case_.caseType?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(case_ => case_.priority === priorityFilter);
    }
    
    setFilteredCases(filtered);
  }, [activeCases, searchQuery, priorityFilter]);

  const loadCases = async () => {
    setIsLoadingCases(true);
    try {
      // Use the updated case service which handles multi-user SAAS automatically
      const cases = await caseService.getActiveCases();
      setActiveCases(cases);
      
      // Log which service is being used
      if (caseService.isUsingMultiUser()) {
        console.log('✅ Cases loaded from Multi-User SAAS database');
      } else if (caseService.isUsingSupabase()) {
        console.log('⚠️ Cases loaded from single-user Supabase database');
      } else {
        console.log('⚠️ Cases loaded from local storage');
      }
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setIsLoadingCases(false);
    }
  };

  const loadCaseStatistics = async () => {
    try {
      const stats = await caseService.getCaseStatistics();
      setCaseStats(stats);
    } catch (error) {
      console.error('Error loading case statistics:', error);
    }
  };

  const loadUpcomingEvents = async () => {
    setLoadingEvents(true);
    try {
      const { supabase } = await import('../../src/lib/supabase');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      console.log('🔍 Chargement des événements...');
      console.log('📅 Période:', today.toISOString(), 'à', thirtyDaysLater.toISOString());
      console.log('👤 User ID:', user.id);

      // Charger depuis calendar_events (utilise start_time)
      const calendarResult = await supabase
        .from('calendar_events')
        .select(`
          *,
          cases:case_id (
            id,
            title
          )
        `)
        .eq('user_id', user.id)
        .not('start_time', 'is', null)
        .gte('start_time', today.toISOString())
        .lte('start_time', thirtyDaysLater.toISOString())
        .order('start_time', { ascending: true });

      console.log('📆 calendar_events:', calendarResult.data?.length || 0, calendarResult.error);

      // Charger depuis case_events (utilise event_date)
      const todayDate = today.toISOString().split('T')[0];
      const thirtyDaysDate = thirtyDaysLater.toISOString().split('T')[0];
      
      const caseEventsResult = await supabase
        .from('case_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('event_date', todayDate)
        .lte('event_date', thirtyDaysDate)
        .order('event_date', { ascending: true });

      console.log('📋 case_events:', caseEventsResult.data?.length || 0, caseEventsResult.error);

      // Charger les titres des dossiers pour case_events
      let caseTitles: Record<string, string> = {};
      if (caseEventsResult.data && caseEventsResult.data.length > 0) {
        const caseIds = [...new Set(caseEventsResult.data.map(e => e.case_id).filter(Boolean))];
        if (caseIds.length > 0) {
          const casesResult = await supabase
            .from('cases')
            .select('id, title')
            .in('id', caseIds);
          
          if (casesResult.data) {
            caseTitles = Object.fromEntries(
              casesResult.data.map(c => [c.id, c.title])
            );
          }
        }
      }

      // Formater les événements de calendar_events
      const calendarEvents = (calendarResult.data || []).map(event => {
        const eventDateTime = new Date(event.start_time);
        const eventDate = eventDateTime.toISOString().split('T')[0];
        const eventTime = event.is_all_day ? null : eventDateTime.toTimeString().split(' ')[0].substring(0, 5);
        
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          event_date: eventDate,
          event_time: eventTime,
          event_type: event.event_type || 'other',
          location: event.location,
          case_id: event.case_id,
          case_title: event.cases?.title,
          source: 'calendar'
        };
      });

      // Formater les événements de case_events
      const caseEvents = (caseEventsResult.data || []).map(event => {
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          event_date: event.event_date,
          event_time: event.event_time,
          event_type: event.event_type || 'other',
          location: event.location,
          case_id: event.case_id,
          case_title: caseTitles[event.case_id] || null,
          source: 'case'
        };
      });

      // Fusionner les deux sources
      const allEvents = [...calendarEvents, ...caseEvents];

      console.log('✅ Total événements:', allEvents.length);

      // Trier par date et heure
      allEvents.sort((a, b) => {
        const dateTimeA = new Date(`${a.event_date}T${a.event_time || '00:00'}`);
        const dateTimeB = new Date(`${b.event_date}T${b.event_time || '00:00'}`);
        return dateTimeA.getTime() - dateTimeB.getTime();
      });

      const finalEvents = allEvents.slice(0, 10);
      console.log('🎯 Événements finaux à afficher:', finalEvents);
      
      setUpcomingEvents(finalEvents);
    } catch (error) {
      console.error('❌ Error loading upcoming events:', error);
      setUpcomingEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Handle new case creation
  const handleCreateCase = async (caseData: Partial<Case>) => {
    try {
      const newCase = await caseService.createCase(caseData);
      setActiveCases(prev => [newCase, ...prev]);
      loadCaseStatistics(); // Refresh stats
      
      if (caseService.isUsingMultiUser()) {
        console.log('✅ Case created successfully in Multi-User SAAS:', newCase);
      } else if (caseService.isUsingSupabase()) {
        console.log('✅ Case created successfully in Supabase:', newCase);
      } else {
        console.log('✅ Case created successfully in local storage:', newCase);
      }
    } catch (error) {
      console.error('Error creating case:', error);
    }
  };

  // Handle case update
  const handleUpdateCase = async (caseData: Partial<Case>) => {
    if (!editingCase) return;
    
    try {
      const updatedCase = await caseService.updateCase(editingCase.id, caseData);
      if (updatedCase) {
        setActiveCases(prev => prev.map(c => c.id === editingCase.id ? updatedCase : c));
        loadCaseStatistics(); // Refresh stats
        setEditingCase(null);
        setShowEditCaseModal(false);
        console.log('Case updated successfully:', updatedCase);
      }
    } catch (error) {
      console.error('Error updating case:', error);
    }
  };

  // Handle case deletion (archive)
  const handleDeleteCase = async (caseId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من أرشفة هذا الملف؟' : 'Êtes-vous sûr de vouloir archiver ce dossier ?')) {
      return;
    }
    
    try {
      const success = await caseService.deleteCase(caseId);
      if (success) {
        setActiveCases(prev => prev.filter(c => c.id !== caseId));
        loadCaseStatistics(); // Refresh stats
        console.log('Case archived successfully');
      }
    } catch (error) {
      console.error('Error archiving case:', error);
    }
  };

  // Handle view case
  const handleViewCase = (case_: Case) => {
    setViewingCase(case_);
    setShowCaseDetail(true);
  };

  // Handle edit case
  const handleEditCase = (case_: Case) => {
    setEditingCase(case_);
    setShowEditCaseModal(true);
  };

  // Load upcoming deadlines from real cases
  const upcomingDeadlines = React.useMemo(() => {
    if (!activeCases || activeCases.length === 0) return [];
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return activeCases
      .filter(c => c.deadline && new Date(c.deadline) >= now && new Date(c.deadline) <= thirtyDaysFromNow)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5) // Limit to 5 most urgent
      .map(c => ({
        case: c.title,
        deadline: c.deadline ? new Date(c.deadline).toLocaleDateString('fr-FR') : '',
        type: c.caseType || 'Échéance'
      }));
  }, [activeCases]);

  // Get updated monthly stats from case service
  const monthlyStats = caseStats ? {
    revenue: caseStats.totalEstimatedValue.toLocaleString(),
    newCases: caseStats.activeCases,
    closedCases: caseStats.archivedCases,
    billableHours: 156 // This would come from time tracking
  } : {
    revenue: '0',
    newCases: 0,
    closedCases: 0,
    billableHours: 0
  };

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
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className={`px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${
                showCalendar 
                  ? 'bg-legal-blue text-white border-legal-blue' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-legal-blue'
              }`}
            >
              <Calendar size={16} className="inline mr-2" />
              {isAr ? 'الأجندة' : 'Agenda'}
            </button>
            <button 
              onClick={() => setShowNewCaseModal(true)}
              className="px-6 py-2 bg-legal-blue text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:bg-legal-blue/90"
            >
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
                {caseStats?.activeCases || activeCases.length}
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
                {caseStats?.upcomingDeadlines || upcomingDeadlines.length}
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
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({filteredCases.length})
                </span>
              </h2>
              <button 
                onClick={() => setShowNewCaseModal(true)}
                className="px-4 py-2 bg-legal-blue text-white rounded-xl font-medium flex items-center gap-2 hover:bg-legal-blue/90 transition-colors"
              >
                <Plus size={16} />
                {isAr ? 'ملف جديد' : 'Nouveau Dossier'}
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={isAr ? 'البحث في الملفات...' : 'Rechercher dans les dossiers...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Priority Filter */}
                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-legal-blue focus:border-transparent"
                  >
                    <option value="all">{isAr ? 'جميع الأولويات' : 'Toutes priorités'}</option>
                    <option value="urgent">{isAr ? 'عاجل' : 'Urgent'}</option>
                    <option value="high">{isAr ? 'عالي' : 'Élevé'}</option>
                    <option value="medium">{isAr ? 'متوسط' : 'Moyen'}</option>
                    <option value="low">{isAr ? 'منخفض' : 'Faible'}</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {isLoadingCases ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw size={24} className="animate-spin text-legal-blue" />
                  <span className="ml-2 text-slate-500">
                    {isAr ? 'جاري تحميل القضايا...' : 'Chargement des dossiers...'}
                  </span>
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 mb-4">
                    {searchQuery || priorityFilter !== 'all' ? 
                      (isAr ? 'لا توجد نتائج' : 'Aucun résultat trouvé') :
                      (isAr ? 'لا توجد قضايا نشطة حالياً' : 'Aucun dossier actif pour le moment')
                    }
                  </p>
                  {!searchQuery && priorityFilter === 'all' && (
                    <button 
                      onClick={() => setShowNewCaseModal(true)}
                      className="px-4 py-2 bg-legal-blue text-white rounded-xl font-medium flex items-center gap-2 mx-auto hover:bg-legal-blue/90 transition-colors"
                    >
                      <Plus size={16} />
                      {isAr ? 'إنشاء أول قضية' : 'Créer le premier dossier'}
                    </button>
                  )}
                </div>
              ) : (
                filteredCases.map(case_ => (
                  <div 
                    key={case_.id} 
                    className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-legal-blue hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleViewCase(case_)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-legal-blue dark:group-hover:text-blue-400 transition-colors">
                          {case_.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                          <User size={14} />
                          {case_.clientName}
                          {case_.clientPhone && (
                            <>
                              <span className="text-slate-300">•</span>
                              <Phone size={12} />
                              <span className="text-xs">{case_.clientPhone}</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                          {case_.description}
                        </p>
                        {case_.caseType && (
                          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                            {case_.caseType}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCase(case_);
                          }}
                          className="p-2 text-slate-400 hover:text-legal-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title={isAr ? 'عرض الملف' : 'Voir le dossier'}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCase(case_);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title={isAr ? 'تعديل الملف' : 'Modifier le dossier'}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCase(case_.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={isAr ? 'أرشفة الملف' : 'Archiver le dossier'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>
                          {isAr ? 'تاريخ الإنشاء:' : 'Créé le'} {case_.createdAt.toLocaleDateString()}
                        </span>
                        {case_.priority && (
                          <span className={`px-2 py-1 rounded-full font-bold ${
                            case_.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                            case_.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                            case_.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          }`}>
                            {case_.priority === 'urgent' ? (isAr ? 'عاجل' : 'URGENT') :
                             case_.priority === 'high' ? (isAr ? 'عالي' : 'ÉLEVÉ') :
                             case_.priority === 'medium' ? (isAr ? 'متوسط' : 'MOYEN') :
                             (isAr ? 'منخفض' : 'FAIBLE')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                          {isAr ? 'نشط' : 'ACTIF'}
                        </span>
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-legal-blue dark:group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                
                <button 
                  onClick={() => setShowMemoireForm(true)}
                  className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-legal-blue transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'صياغة مذكرة' : 'Rédiger un Mémoire'}
                    </span>
                  </div>
                </button>
                
                <button 
                  onClick={() => setShowHonorairesCalc(true)}
                  className="w-full p-3 text-left border border-slate-200 dark:border-slate-800 rounded-xl hover:border-legal-blue transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calculator size={16} className="text-slate-500" />
                    <span className="text-sm font-medium">
                      {isAr ? 'حساب الأتعاب' : 'Calculer Honoraires'}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Searches - Hidden for now, will be implemented with search tracking */}
            {/* 
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen size={18} className="text-legal-blue" />
                {isAr ? 'البحوث الأخيرة' : 'Recherches Récentes'}
              </h3>
              
              <div className="text-center py-4">
                <BookOpen size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm text-slate-500">
                  {isAr ? 'لا توجد بحوث حديثة' : 'Aucune recherche récente'}
                </p>
              </div>
            </div>
            */}

            {/* Upcoming Deadlines */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                {isAr ? 'المواعيد القادمة' : 'Échéances Prochaines'}
              </h3>
              
              {upcomingDeadlines.length > 0 ? (
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
              ) : (
                <div className="text-center py-4">
                  <Clock size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-sm text-slate-500">
                    {isAr ? 'لا توجد مواعيد قادمة' : 'Aucune échéance prochaine'}
                  </p>
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Calendar size={18} className="text-legal-gold" />
                  {isAr ? 'الأحداث القادمة' : 'Événements à venir'}
                </h3>
                <button
                  onClick={() => setShowCalendar(true)}
                  className="text-xs text-legal-blue hover:text-legal-blue/80 font-medium"
                >
                  {isAr ? 'عرض الكل' : 'Voir tout'}
                </button>
              </div>
              
              {loadingEvents ? (
                <div className="text-center py-4">
                  <RefreshCw size={24} className="mx-auto text-slate-300 animate-spin mb-2" />
                  <p className="text-sm text-slate-500">
                    {isAr ? 'جاري التحميل...' : 'Chargement...'}
                  </p>
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 5).map((event) => {
                    const eventDate = new Date(event.event_date);
                    const isToday = eventDate.toDateString() === new Date().toDateString();
                    const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                    
                    const getEventTypeColor = (type: string) => {
                      switch (type) {
                        case 'hearing': return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400';
                        case 'meeting': return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400';
                        case 'deadline': return 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400';
                        case 'call': return 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400';
                        case 'email': return 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400';
                        case 'document': return 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400';
                        default: return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400';
                      }
                    };

                    const getEventTypeLabel = (type: string) => {
                      const labels = {
                        hearing: isAr ? 'جلسة' : 'Audience',
                        meeting: isAr ? 'اجتماع' : 'Réunion',
                        deadline: isAr ? 'موعد نهائي' : 'Échéance',
                        call: isAr ? 'مكالمة' : 'Appel',
                        email: isAr ? 'بريد إلكتروني' : 'Email',
                        document: isAr ? 'وثيقة' : 'Document',
                        other: isAr ? 'آخر' : 'Autre'
                      };
                      return labels[type as keyof typeof labels] || type;
                    };

                    return (
                      <div 
                        key={event.id} 
                        className={`p-3 border rounded-xl ${getEventTypeColor(event.event_type)} ${
                          isToday ? 'ring-2 ring-legal-gold' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate">
                              {event.title}
                            </div>
                            {event.case_title && (
                              <div className="text-xs opacity-75 truncate mt-0.5">
                                {event.case_title}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs">
                              <Clock size={12} />
                              {isToday ? (
                                <span className="font-bold">
                                  {isAr ? 'اليوم' : 'Aujourd\'hui'}
                                  {event.event_time && ` - ${event.event_time}`}
                                </span>
                              ) : isTomorrow ? (
                                <span className="font-bold">
                                  {isAr ? 'غداً' : 'Demain'}
                                  {event.event_time && ` - ${event.event_time}`}
                                </span>
                              ) : (
                                <span>
                                  {eventDate.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', { 
                                    weekday: 'short', 
                                    day: 'numeric', 
                                    month: 'short' 
                                  })}
                                  {event.event_time && ` - ${event.event_time}`}
                                </span>
                              )}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                                <MapPin size={12} />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                            {getEventTypeLabel(event.event_type)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Calendar size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-sm text-slate-500 mb-3">
                    {isAr ? 'لا توجد أحداث قادمة' : 'Aucun événement à venir'}
                  </p>
                  <button
                    onClick={() => setShowCalendar(true)}
                    className="text-xs text-legal-blue hover:text-legal-blue/80 font-medium"
                  >
                    {isAr ? 'إضافة حدث' : 'Ajouter un événement'}
                  </button>
                </div>
              )}
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

      {/* New Case Modal */}
      <NewCaseModal
        isOpen={showNewCaseModal}
        onClose={() => setShowNewCaseModal(false)}
        onSave={handleCreateCase}
        language={language}
        theme={theme}
      />

      {/* Edit Case Modal */}
      {editingCase && (
        <EditCaseModal
          isOpen={showEditCaseModal}
          onClose={() => {
            setShowEditCaseModal(false);
            setEditingCase(null);
          }}
          onSubmit={handleUpdateCase}
          language={language}
          theme={theme}
          case_={editingCase}
        />
      )}

      {/* Case Detail Modal */}
      {viewingCase && (
        <CaseDetailModal
          case_={viewingCase}
          isOpen={showCaseDetail}
          onClose={() => {
            setShowCaseDetail(false);
            setViewingCase(null);
          }}
          onEdit={() => {
            setEditingCase(viewingCase);
            setShowEditCaseModal(true);
          }}
          language={language}
        />
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <LawyerCalendarModal
          isOpen={showCalendar}
          onClose={() => setShowCalendar(false)}
          language={language}
          userId={user.id}
        />
      )}

      {/* Mémoire Editor */}
      {showMemoireForm && (
        <MemoireEditor
          isOpen={showMemoireForm}
          onClose={() => setShowMemoireForm(false)}
          language={language}
        />
      )}

      {/* Honoraires Calculator */}
      {showHonorairesCalc && (
        <HonorairesCalculator
          isOpen={showHonorairesCalc}
          onClose={() => setShowHonorairesCalc(false)}
          language={language}
        />
      )}
    </div>
  );
};

export default AvocatInterface;