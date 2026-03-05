import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Users, Calendar, File, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Language, AppMode } from '../../types';
import { useRoleTerminology } from '../../src/hooks/useRoleTerminology';

interface SearchResult {
  id: string;
  type: 'case' | 'client' | 'document' | 'event';
  title: string;
  subtitle?: string;
  metadata?: string;
  icon: React.ReactNode;
  color: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  userId: string;
  onNavigate: (mode: AppMode, id: string) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, language, userId, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useRoleTerminology(language);
  const isAr = language === 'ar';

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, userId]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Search in cases
      const { data: cases } = await supabase
        .from('cases')
        .select('id, title, case_number, status, client_id')
        .eq('user_id', userId)
        .or(`title.ilike.%${searchQuery}%,case_number.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5);

      if (cases) {
        cases.forEach(c => {
          searchResults.push({
            id: c.id,
            type: 'case',
            title: c.title || c.case_number,
            subtitle: c.case_number,
            metadata: c.status,
            icon: <FileText size={18} />,
            color: 'text-blue-500'
          });
        });
      }

      // Search in clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, email, phone')
        .eq('user_id', userId)
        .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(5);

      if (clients) {
        clients.forEach(c => {
          searchResults.push({
            id: c.id,
            type: 'client',
            title: c.name,
            subtitle: c.email || c.phone,
            icon: <Users size={18} />,
            color: 'text-purple-500'
          });
        });
      }

      // Search in documents
      const { data: documents } = await supabase
        .from('case_documents')
        .select('id, file_name, document_type, case_id, cases(title)')
        .eq('user_id', userId)
        .ilike('file_name', `%${searchQuery}%`)
        .limit(5);

      if (documents) {
        documents.forEach((d: any) => {
          searchResults.push({
            id: d.id,
            type: 'document',
            title: d.file_name,
            subtitle: d.cases?.title,
            metadata: d.document_type,
            icon: <File size={18} />,
            color: 'text-green-500'
          });
        });
      }

      // Search in events
      const { data: events } = await supabase
        .from('case_events')
        .select('id, title, event_type, event_date, case_id, cases(title)')
        .eq('user_id', userId)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5);

      if (events) {
        events.forEach((e: any) => {
          searchResults.push({
            id: e.id,
            type: 'event',
            title: e.title,
            subtitle: e.cases?.title,
            metadata: new Date(e.event_date).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR'),
            icon: <Calendar size={18} />,
            color: 'text-orange-500'
          });
        });
      }

      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(query);
    
    // Navigate based on type
    switch (result.type) {
      case 'case':
        onNavigate(AppMode.CASES, result.id);
        break;
      case 'client':
        onNavigate(AppMode.CLIENTS, result.id);
        break;
      case 'document':
      case 'event':
        // Navigate to case (documents and events are part of cases)
        onNavigate(AppMode.CASES, result.id);
        break;
    }
    
    onClose();
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      setQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'case':
        return t.case(true);
      case 'client':
        return t.client(true);
      case 'document':
        return t.document(true);
      case 'event':
        return t.event(true);
      default:
        return type;
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
        <div 
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border dark:border-slate-800 pointer-events-auto animate-in slide-in-from-top duration-300"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b dark:border-slate-800">
            <Search size={20} className="text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAr ? 'ابحث عن ملفات، عملاء، وثائق...' : 'Rechercher des dossiers, clients, documents...'}
              className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-slate-400"
            />
            {loading && <Loader2 size={20} className="text-legal-gold animate-spin" />}
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {!query.trim() && recentSearches.length > 0 && (
              <div className="p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {isAr ? 'عمليات البحث الأخيرة' : 'Recherches récentes'}
                </p>
                <div className="space-y-1">
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(search)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                    >
                      <Search size={14} className="inline mr-2 text-slate-400" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.trim() && results.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-400">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p>{isAr ? 'لا توجد نتائج' : 'Aucun résultat trouvé'}</p>
                <p className="text-sm mt-2">
                  {isAr ? 'جرب مصطلحات بحث مختلفة' : 'Essayez d\'autres termes de recherche'}
                </p>
              </div>
            )}

            {Object.entries(groupedResults).map(([type, items]) => (
              <div key={type} className="p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {getTypeLabel(type)}
                </p>
                <div className="space-y-1">
                  {items.map((result, idx) => {
                    const globalIndex = results.indexOf(result);
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          globalIndex === selectedIndex
                            ? 'bg-legal-gold/10 border border-legal-gold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className={result.color}>
                          {result.icon}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-sm text-slate-500 truncate">{result.subtitle}</p>
                          )}
                        </div>
                        {result.metadata && (
                          <span className="text-xs text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                            {result.metadata}
                          </span>
                        )}
                        <ChevronRight size={16} className="text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">↑↓</kbd> {isAr ? 'للتنقل' : 'Naviguer'}
              </span>
              <span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Enter</kbd> {isAr ? 'للفتح' : 'Ouvrir'}
              </span>
              <span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">Esc</kbd> {isAr ? 'للإغلاق' : 'Fermer'}
              </span>
            </div>
            <span>{results.length} {isAr ? 'نتيجة' : 'résultats'}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalSearch;
