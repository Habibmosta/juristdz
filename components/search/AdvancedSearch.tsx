import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Scale, 
  FileText,
  Clock,
  ChevronDown,
  X,
  Loader2,
  AlertCircle,
  BookOpen,
  Gavel
} from 'lucide-react';
import type { 
  SearchQuery, 
  SearchResult, 
  JurisprudenceResult, 
  LegalText,
  LegalDomain, 
  Jurisdiction, 
  SortOption
} from '../../types/search';
import { Language } from '../../types';
import { searchService } from '../../services/searchService';
import { UI_TRANSLATIONS } from '../../constants';

interface AdvancedSearchProps {
  language: Language;
  theme?: 'light' | 'dark';
  onResultsChange?: (results: SearchResult<JurisprudenceResult | LegalText>) => void;
}

/**
 * Advanced search component for jurisprudence and legal texts
 * Validates: Requirements 3.2, 3.4, 3.5 - Advanced search with filters and suggestions
 */
const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  language,
  theme = 'light',
  onResultsChange
}) => {
  const t = UI_TRANSLATIONS[language];
  const isAr = language === 'ar';

  // Search state
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState<'jurisprudence' | 'legal_texts'>('jurisprudence');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<LegalDomain | ''>('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | ''>('');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [maxResults, setMaxResults] = useState(50);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Available filter options
  const [filterOptions, setFilterOptions] = useState<any>(null);

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const options = await searchService.getSearchFilters();
      setFilterOptions(options);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  // Handle search text changes with debounced suggestions
  const handleSearchTextChange = useCallback(
    debounce(async (text: string) => {
      if (text.length >= 2) {
        try {
          const suggestions = await searchService.getSearchSuggestions(text);
          setSuggestions(suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to get suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    handleSearchTextChange(searchText);
  }, [searchText, handleSearchTextChange]);

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setError(isAr ? 'يرجى إدخال نص البحث' : 'Veuillez saisir un texte de recherche');
      return;
    }

    setIsSearching(true);
    setError(null);
    setShowSuggestions(false);

    try {
      // Build search query
      const query: SearchQuery = {
        text: searchText.trim(),
        type: searchType,
        filters: {
          domain: selectedDomain || undefined,
          jurisdiction: selectedJurisdiction || undefined,
          dateFrom: dateRange.from || undefined,
          dateTo: dateRange.to || undefined,
        },
        sort: sortBy,
        page: 1,
        pageSize: maxResults,
      };

      // Execute search based on type
      let searchResults;
      if (searchType === 'jurisprudence') {
        searchResults = await searchService.searchJurisprudence(query);
      } else {
        searchResults = await searchService.searchLegalTexts(query);
      }

      setResults(searchResults);
      onResultsChange?.(searchResults);

    } catch (error) {
      console.error('Search error:', error);
      setError(isAr ? 'فشل في البحث. يرجى المحاولة مرة أخرى.' : 'Échec de la recherche. Veuillez réessayer.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchText(suggestion);
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setSelectedDomain('');
    setSelectedJurisdiction('');
    setDateRange({ from: '', to: '' });
    setSortBy('relevance');
    setMaxResults(50);
  };

  const getDomainLabel = (domain: LegalDomain): string => {
    const labels: Record<LegalDomain, string> = {
      civil: isAr ? 'مدني' : 'Civil',
      penal: isAr ? 'جنائي' : 'Pénal',
      commercial: isAr ? 'تجاري' : 'Commercial',
      administratif: isAr ? 'إداري' : 'Administratif',
      famille: isAr ? 'أسرة' : 'Famille',
      travail: isAr ? 'عمل' : 'Travail',
      fiscal: isAr ? 'ضرائب' : 'Fiscal',
      constitutionnel: isAr ? 'دستوري' : 'Constitutionnel',
      international: isAr ? 'دولي' : 'International',
      immobilier: isAr ? 'عقاري' : 'Immobilier',
    };
    return labels[domain] ?? domain;
  };

  const getJurisdictionLabel = (jurisdiction: Jurisdiction): string => {
    const labels: Record<Jurisdiction, string> = {
      cour_supreme: isAr ? 'المحكمة العليا' : 'Cour Suprême',
      conseil_etat: isAr ? 'مجلس الدولة' : 'Conseil d\'État',
      tribunal_administratif: isAr ? 'المحكمة الإدارية' : 'Tribunal Administratif',
      cour_appel: isAr ? 'محكمة الاستئناف' : 'Cour d\'Appel',
      tribunal: isAr ? 'المحكمة الابتدائية' : 'Tribunal',
      tribunal_commerce: isAr ? 'المحكمة التجارية' : 'Tribunal de Commerce',
    };
    return labels[jurisdiction] ?? jurisdiction;
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Search Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <Search className="text-legal-blue" size={28} />
          {isAr ? 'البحث المتقدم في القانون الجزائري' : 'Recherche Avancée - Droit Algérien'}
        </h2>
        <p className="text-slate-500 text-sm">
          {isAr ? 'ابحث في الاجتهاد القضائي والنصوص القانونية الجزائرية' : 'Recherchez dans la jurisprudence et les textes légaux algériens'}
        </p>
      </div>

      {/* Search Type Selector */}
      <div className="mb-4">
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          <button
            onClick={() => setSearchType('jurisprudence')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'jurisprudence'
                ? 'bg-white dark:bg-slate-700 text-legal-blue shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Gavel size={16} className="inline mr-2" />
            {isAr ? 'الاجتهاد القضائي' : 'Jurisprudence'}
          </button>
          <button
            onClick={() => setSearchType('legal_texts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'legal_texts'
                ? 'bg-white dark:bg-slate-700 text-legal-blue shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen size={16} className="inline mr-2" />
            {isAr ? 'النصوص القانونية' : 'Textes Légaux'}
          </button>
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="relative mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={isAr ? 'ابحث في القانون الجزائري...' : 'Rechercher dans le droit algérien...'}
            className={`w-full pl-12 pr-4 py-4 text-lg border-2 rounded-2xl focus:outline-none focus:border-legal-blue transition-colors ${
              theme === 'dark' 
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' 
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500'
            }`}
          />
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-lg border z-50 ${
            theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                  index === 0 ? 'rounded-t-xl' : ''
                } ${index === suggestions.length - 1 ? 'rounded-b-xl' : 'border-b border-slate-100 dark:border-slate-700'}`}
              >
                <Search size={14} className="inline mr-2 text-slate-400" />
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 border rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
            showFilters 
              ? 'border-legal-blue text-legal-blue bg-blue-50 dark:bg-blue-900/20' 
              : 'border-slate-200 dark:border-slate-700 hover:border-legal-blue'
          }`}
        >
          <Filter size={16} />
          {isAr ? 'المرشحات' : 'Filtres'}
          <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={handleSearch}
          disabled={isSearching || !searchText.trim()}
          className="px-6 py-2 bg-legal-blue text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-legal-blue/90 transition-colors"
        >
          {isSearching ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
          {isSearching ? (isAr ? 'جاري البحث...' : 'Recherche...') : (isAr ? 'بحث' : 'Rechercher')}
        </button>

        {(selectedDomain || selectedJurisdiction || dateRange.from || dateRange.to) && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex items-center gap-1"
          >
            <X size={14} />
            {isAr ? 'مسح المرشحات' : 'Effacer filtres'}
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className={`p-6 rounded-2xl border mb-6 ${
          theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Domain Filter */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                <Scale size={14} className="inline mr-1" />
                {isAr ? 'المجال القانوني' : 'Domaine Juridique'}
              </label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value as LegalDomain)}
                className={`w-full p-3 border rounded-xl focus:outline-none focus:border-legal-blue ${
                  theme === 'dark' 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <option value="">{isAr ? 'جميع المجالات' : 'Tous les domaines'}</option>
                {filterOptions?.domains?.map((domain: LegalDomain) => (
                  <option key={domain} value={domain}>
                    {getDomainLabel(domain)}
                  </option>
                ))}
              </select>
            </div>

            {/* Jurisdiction Filter */}
            {searchType === 'jurisprudence' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <MapPin size={14} className="inline mr-1" />
                  {isAr ? 'الجهة القضائية' : 'Juridiction'}
                </label>
                <select
                  value={selectedJurisdiction}
                  onChange={(e) => setSelectedJurisdiction(e.target.value as Jurisdiction)}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:border-legal-blue ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="">{isAr ? 'جميع الجهات' : 'Toutes les juridictions'}</option>
                  {filterOptions?.jurisdictions?.map((jurisdiction: Jurisdiction) => (
                    <option key={jurisdiction} value={jurisdiction}>
                      {getJurisdictionLabel(jurisdiction)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                <Calendar size={14} className="inline mr-1" />
                {isAr ? 'الفترة الزمنية' : 'Période'}
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className={`flex-1 p-3 border rounded-xl focus:outline-none focus:border-legal-blue text-sm ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className={`flex-1 p-3 border rounded-xl focus:outline-none focus:border-legal-blue text-sm ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                <Clock size={14} className="inline mr-1" />
                {isAr ? 'ترتيب النتائج' : 'Tri des résultats'}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`w-full p-3 border rounded-xl focus:outline-none focus:border-legal-blue ${
                  theme === 'dark' 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <option value="relevance">{isAr ? 'الصلة' : 'Pertinence'}</option>
                <option value="date_desc">{isAr ? 'الأحدث أولاً' : 'Plus récent'}</option>
                <option value="date_asc">{isAr ? 'الأقدم أولاً' : 'Plus ancien'}</option>
                <option value="court">{isAr ? 'الجهة القضائية' : 'Juridiction'}</option>
              </select>
            </div>

            {/* Max Results */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                <FileText size={14} className="inline mr-1" />
                {isAr ? 'عدد النتائج' : 'Nombre de résultats'}
              </label>
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value))}
                className={`w-full p-3 border rounded-xl focus:outline-none focus:border-legal-blue ${
                  theme === 'dark' 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <span className="text-red-800 dark:text-red-200">{error}</span>
        </div>
      )}

      {/* Search Results Summary */}
      {results && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                {results.total} {isAr ? 'نتيجة' : 'résultat(s)'} 
                {results.took != null && ` ${isAr ? 'في' : 'en'} ${results.took}ms`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default AdvancedSearch;