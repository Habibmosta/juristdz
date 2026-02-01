import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Scale, 
  ExternalLink, 
  Eye, 
  Download,
  BookOpen,
  Gavel,
  Star,
  Clock,
  Users,
  ChevronRight,
  Tag
} from 'lucide-react';
import { 
  SearchResult, 
  JurisprudenceResult, 
  LegalText,
  PrecedentValue 
} from '../../types/search';
import { Language } from '../../types';

interface SearchResultsProps {
  results: SearchResult<JurisprudenceResult | LegalText>;
  searchType: 'jurisprudence' | 'legal_texts';
  language: Language;
  theme?: 'light' | 'dark';
  onResultClick?: (result: JurisprudenceResult | LegalText) => void;
}

/**
 * Search results display component
 * Validates: Requirements 3.3 - Results ranking and display
 */
const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  searchType,
  language,
  theme = 'light',
  onResultClick
}) => {
  const isAr = language === 'ar';
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedResults(newExpanded);
  };

  const getPrecedentValueColor = (value: PrecedentValue) => {
    switch (value) {
      case PrecedentValue.BINDING:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case PrecedentValue.PERSUASIVE:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      case PrecedentValue.INFORMATIVE:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getPrecedentValueLabel = (value: PrecedentValue) => {
    const labels = {
      [PrecedentValue.BINDING]: isAr ? 'ملزم' : 'Contraignant',
      [PrecedentValue.PERSUASIVE]: isAr ? 'مقنع' : 'Persuasif',
      [PrecedentValue.INFORMATIVE]: isAr ? 'إعلامي' : 'Informatif'
    };
    return labels[value] || value;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const highlightSearchTerms = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;
    
    const terms = searchQuery.split(' ').filter(term => term.length > 2);
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  };

  if (!results || results.results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          {searchType === 'jurisprudence' ? (
            <Gavel size={48} className="mx-auto text-slate-300" />
          ) : (
            <BookOpen size={48} className="mx-auto text-slate-300" />
          )}
        </div>
        <h3 className="text-lg font-medium text-slate-500 mb-2">
          {isAr ? 'لا توجد نتائج' : 'Aucun résultat trouvé'}
        </h3>
        <p className="text-slate-400 text-sm">
          {isAr ? 'جرب مصطلحات بحث مختلفة أو قم بتعديل المرشحات' : 'Essayez des termes différents ou modifiez les filtres'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {results.results.map((result) => {
        const isExpanded = expandedResults.has(result.id);
        const isJurisprudence = searchType === 'jurisprudence';
        const jurisprudenceResult = result as JurisprudenceResult;
        const legalTextResult = result as LegalText;

        return (
          <div
            key={result.id}
            className={`border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg ${
              theme === 'dark' 
                ? 'bg-slate-800 border-slate-700 hover:border-slate-600' 
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Result Header */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {isJurisprudence ? (
                      <Gavel className="text-legal-blue flex-shrink-0" size={20} />
                    ) : (
                      <BookOpen className="text-legal-blue flex-shrink-0" size={20} />
                    )}
                    
                    {isJurisprudence && (
                      <span className="text-sm font-mono text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {jurisprudenceResult.caseNumber}
                      </span>
                    )}
                    
                    {!isJurisprudence && (
                      <span className="text-sm font-mono text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {legalTextResult.reference}
                      </span>
                    )}

                    {isJurisprudence && jurisprudenceResult.precedentValue && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getPrecedentValueColor(jurisprudenceResult.precedentValue)}`}>
                        {getPrecedentValueLabel(jurisprudenceResult.precedentValue)}
                      </span>
                    )}

                    {jurisprudenceResult.relevanceScore && (
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-amber-500" />
                        <span className="text-xs text-slate-500">
                          {Math.round(jurisprudenceResult.relevanceScore * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 
                    className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 cursor-pointer hover:text-legal-blue transition-colors"
                    onClick={() => onResultClick?.(result)}
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSearchTerms(result.title, results.query.text) 
                    }}
                  />

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {isJurisprudence 
                        ? formatDate(jurisprudenceResult.date)
                        : formatDate(legalTextResult.publicationDate)
                      }
                    </div>

                    {isJurisprudence && (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        {jurisprudenceResult.court.name}
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Scale size={14} />
                      {isJurisprudence 
                        ? jurisprudenceResult.legalDomain
                        : legalTextResult.domain
                      }
                    </div>

                    {isJurisprudence && jurisprudenceResult.parties && jurisprudenceResult.parties.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        {jurisprudenceResult.parties.slice(0, 2).map(party => party.name).join(' vs ')}
                        {jurisprudenceResult.parties.length > 2 && '...'}
                      </div>
                    )}
                  </div>

                  {/* Summary/Content Preview */}
                  <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {isJurisprudence ? (
                      <p dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerms(
                          jurisprudenceResult.summary || jurisprudenceResult.fullText?.substring(0, 300) + '...' || '',
                          results.query.text
                        )
                      }} />
                    ) : (
                      <p dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerms(
                          legalTextResult.content.substring(0, 300) + '...',
                          results.query.text
                        )
                      }} />
                    )}
                  </div>

                  {/* Keywords */}
                  {isJurisprudence && jurisprudenceResult.keywords && jurisprudenceResult.keywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {jurisprudenceResult.keywords.slice(0, 5).map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full"
                        >
                          <Tag size={10} />
                          {keyword}
                        </span>
                      ))}
                      {jurisprudenceResult.keywords.length > 5 && (
                        <span className="text-xs text-slate-400">
                          +{jurisprudenceResult.keywords.length - 5} {isAr ? 'أخرى' : 'autres'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleExpanded(result.id)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    title={isExpanded ? (isAr ? 'إخفاء' : 'Réduire') : (isAr ? 'توسيع' : 'Développer')}
                  >
                    <Eye size={16} />
                  </button>
                  
                  {(jurisprudenceResult.documentUrl || legalTextResult.joraReference) && (
                    <button
                      onClick={() => window.open(jurisprudenceResult.documentUrl || '#', '_blank')}
                      className="p-2 text-slate-400 hover:text-legal-blue transition-colors"
                      title={isAr ? 'فتح المستند' : 'Ouvrir le document'}
                    >
                      <ExternalLink size={16} />
                    </button>
                  )}
                  
                  <button
                    className="p-2 text-slate-400 hover:text-legal-blue transition-colors"
                    title={isAr ? 'تحميل' : 'Télécharger'}
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className={`mt-6 pt-6 border-t ${
                  theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
                }`}>
                  {isJurisprudence ? (
                    <div className="space-y-4">
                      {/* Full Text Preview */}
                      {jurisprudenceResult.fullText && (
                        <div>
                          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">
                            {isAr ? 'النص الكامل' : 'Texte intégral'}
                          </h4>
                          <div 
                            className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-h-64 overflow-y-auto"
                            dangerouslySetInnerHTML={{ 
                              __html: highlightSearchTerms(jurisprudenceResult.fullText, results.query.text)
                            }}
                          />
                        </div>
                      )}

                      {/* Legal Citations */}
                      {jurisprudenceResult.citations && jurisprudenceResult.citations.length > 0 && (
                        <div>
                          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">
                            {isAr ? 'المراجع القانونية' : 'Références légales'}
                          </h4>
                          <div className="space-y-2">
                            {jurisprudenceResult.citations.map((citation, index) => (
                              <div key={index} className="text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-medium">{citation.reference}</span>
                                {citation.title && <span className="ml-2">- {citation.title}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Parties Details */}
                      {jurisprudenceResult.parties && jurisprudenceResult.parties.length > 0 && (
                        <div>
                          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">
                            {isAr ? 'الأطراف' : 'Parties'}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {jurisprudenceResult.parties.map((party, index) => (
                              <div key={index} className="text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-medium">{party.name}</span>
                                <span className="ml-2 text-xs text-slate-500">({party.type})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Full Legal Text */}
                      <div>
                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">
                          {isAr ? 'النص الكامل' : 'Texte complet'}
                        </h4>
                        <div 
                          className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-h-64 overflow-y-auto"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerms(legalTextResult.content, results.query.text)
                          }}
                        />
                      </div>

                      {/* JORA Reference */}
                      {legalTextResult.joraReference && (
                        <div>
                          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">
                            {isAr ? 'مرجع الجريدة الرسمية' : 'Référence JORA'}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {legalTextResult.joraReference}
                          </p>
                        </div>
                      )}

                      {/* Related Texts */}
                      {legalTextResult.relatedTexts && legalTextResult.relatedTexts.length > 0 && (
                        <div>
                          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">
                            {isAr ? 'النصوص ذات الصلة' : 'Textes connexes'}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {legalTextResult.relatedTexts.map((relatedText, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                              >
                                {relatedText}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Load More Button */}
      {results.totalCount > results.results.length && (
        <div className="text-center py-6">
          <button className="px-6 py-3 bg-legal-blue text-white rounded-xl font-medium hover:bg-legal-blue/90 transition-colors flex items-center gap-2 mx-auto">
            {isAr ? 'تحميل المزيد' : 'Charger plus'}
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;