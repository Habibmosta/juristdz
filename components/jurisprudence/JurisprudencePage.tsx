import React, { useState, useEffect, useCallback } from 'react';
import {
  Gavel, Search, Filter, BookOpen, Scale, Calendar,
  Tag, ChevronDown, ChevronUp,
  TrendingUp, Users, Database, Award, X, Loader2,
  FileText, MapPin, AlertCircle
} from 'lucide-react';
import { Language } from '../../types';
import { jurisprudenceService, JurisprudenceEntry } from '../../services/jurisprudenceService';
import ContributeJurisprudenceModal from './ContributeJurisprudenceModal';

interface Props {
  language: Language;
  theme?: 'light' | 'dark';
  userId?: string;
  userRole?: string;
}

const DOMAINS = [
  { value: '', label_fr: 'Tous les domaines', label_ar: 'جميع المجالات' },
  { value: 'civil', label_fr: 'Civil', label_ar: 'مدني' },
  { value: 'penal', label_fr: 'Pénal', label_ar: 'جنائي' },
  { value: 'commercial', label_fr: 'Commercial', label_ar: 'تجاري' },
  { value: 'administratif', label_fr: 'Administratif', label_ar: 'إداري' },
  { value: 'travail', label_fr: 'Travail', label_ar: 'عمل' },
  { value: 'famille', label_fr: 'Famille', label_ar: 'أسرة' },
  { value: 'immobilier', label_fr: 'Immobilier', label_ar: 'عقاري' },
  { value: 'fiscal', label_fr: 'Fiscal', label_ar: 'ضرائب' },
];

const JURISDICTIONS = [
  { value: '', label_fr: 'Toutes les juridictions', label_ar: 'جميع الجهات' },
  { value: 'cour_supreme', label_fr: 'Cour Suprême', label_ar: 'المحكمة العليا' },
  { value: 'conseil_etat', label_fr: "Conseil d'État", label_ar: 'مجلس الدولة' },
  { value: 'cour_appel', label_fr: "Cour d'Appel", label_ar: 'محكمة الاستئناف' },
  { value: 'tribunal_administratif', label_fr: 'Tribunal Administratif', label_ar: 'المحكمة الإدارية' },
  { value: 'tribunal_commerce', label_fr: 'Tribunal de Commerce', label_ar: 'المحكمة التجارية' },
  { value: 'tribunal', label_fr: 'Tribunal', label_ar: 'المحكمة الابتدائية' },
];

const PRECEDENT_COLORS: Record<string, string> = {
  binding:    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  persuasive: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
  informative:'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
};

const DOMAIN_COLORS: Record<string, string> = {
  civil: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  penal: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  commercial: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  administratif: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  travail: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  famille: 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300',
  immobilier: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
  fiscal: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const JurisprudencePage: React.FC<Props> = ({ language, theme = 'light', userId, userRole }) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<JurisprudenceEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showContribute, setShowContribute] = useState(false);
  const [stats, setStats] = useState({ total: 0, domains: 0 });
  const [took, setTook] = useState<number | null>(null);

  const loadInitial = useCallback(async () => {
    try {
      const { supabase } = await import('../../src/lib/supabase');
      const { data, count } = await supabase
        .from('jurisprudence')
        .select('*', { count: 'exact' })
        .eq('status', 'validated')
        .order('decision_date', { ascending: false })
        .limit(20);
      setResults((data || []) as JurisprudenceEntry[]);
      setTotal(count || 0);
      const domains = new Set((data || []).map((e: any) => e.legal_domain)).size;
      setStats({ total: count || 0, domains });
    } catch {
      const r = await jurisprudenceService.search({ text: 'droit', page: 1, pageSize: 20 });
      setResults(r.items as any);
      setTotal(r.total);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  const handleSearch = async () => {
    if (!query.trim() && !domain && !jurisdiction) return;
    setLoading(true);
    setTook(null);
    const t0 = Date.now();
    try {
      const { supabase } = await import('../../src/lib/supabase');
      let q = supabase
        .from('jurisprudence')
        .select('*', { count: 'exact' })
        .eq('status', 'validated');
      if (domain) q = q.eq('legal_domain', domain);
      if (jurisdiction) q = q.eq('jurisdiction', jurisdiction);
      if (dateFrom) q = q.gte('decision_date', dateFrom);
      if (dateTo) q = q.lte('decision_date', dateTo);
      if (query.trim()) {
        q = q.or(
          `summary_fr.ilike.%${query}%,summary_ar.ilike.%${query}%,case_number.ilike.%${query}%`
        );
      }
      const { data, count } = await q.order('decision_date', { ascending: false }).limit(50);
      setResults((data || []) as JurisprudenceEntry[]);
      setTotal(count || 0);
      setTook(Date.now() - t0);
    } catch {
      const r = await jurisprudenceService.search({
        text: query || 'droit',
        filters: { domain: domain as any, jurisdiction: jurisdiction as any, dateFrom, dateTo },
        page: 1, pageSize: 50,
      });
      setResults(r.items as any);
      setTotal(r.total);
      setTook(Date.now() - t0);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery(''); setDomain(''); setJurisdiction('');
    setDateFrom(''); setDateTo(''); setTook(null);
    loadInitial();
  };

  const inputClass = `p-3 border rounded-xl focus:outline-none focus:border-legal-blue text-sm transition-colors ${
    isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
  }`;

  const cardClass = `border rounded-2xl overflow-hidden transition-all hover:shadow-lg ${
    isDark ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'
  }`;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`} dir={isAr ? 'rtl' : 'ltr'}>

      {/* Hero */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b`}>
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-legal-blue/10 text-legal-blue rounded-full text-sm font-bold mb-4">
              <Award size={14} />
              {isAr ? 'أول قاعدة اجتهاد قضائي جزائري رقمية' : 'Première base jurisprudentielle algérienne numérique'}
            </div>
            <h1 className={`text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'قاعدة الاجتهاد القضائي الجزائري' : 'Jurisprudence Algérienne'}
            </h1>
            <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isAr
                ? 'ابحث في قرارات المحكمة العليا، مجلس الدولة، محاكم الاستئناف والمحاكم الابتدائية'
                : "Recherchez dans les arrêts de la Cour Suprême, du Conseil d'État, des Cours d'Appel et Tribunaux"}
            </p>
          </div>

          {/* Stats bar */}
          <div className="flex justify-center gap-8 mb-8">
            {[
              { icon: <Database size={16} />, value: stats.total, label_fr: 'Décisions', label_ar: 'قرار' },
              { icon: <Scale size={16} />, value: stats.domains || 8, label_fr: 'Domaines', label_ar: 'مجال' },
              { icon: <Users size={16} />, value: '∞', label_fr: 'Contributeurs', label_ar: 'مساهم' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className={`flex items-center justify-center gap-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <span className="text-legal-blue">{s.icon}</span>
                  {s.value}
                </div>
                <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isAr ? s.label_ar : s.label_fr}
                </div>
              </div>
            ))}
          </div>

          {/* Search bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={isAr ? 'ابحث: مسؤولية، طلاق، إفلاس...' : 'Rechercher : responsabilité, divorce, faillite...'}
                className={`w-full pl-12 pr-4 py-4 text-base border-2 rounded-2xl focus:outline-none focus:border-legal-blue ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200'
                }`}
              />
              {query && (
                <button onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-4 bg-legal-blue text-white rounded-2xl font-bold hover:bg-legal-blue/90 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {isAr ? 'بحث' : 'Rechercher'}
            </button>
          </div>

          {/* Filter toggle + contribute */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                showFilters ? 'text-legal-blue bg-blue-50 dark:bg-blue-900/20' : `${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`
              }`}
            >
              <Filter size={14} />
              {isAr ? 'فلاتر متقدمة' : 'Filtres avancés'}
              {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {userId && (
              <button
                onClick={() => setShowContribute(true)}
                className="flex items-center gap-2 px-4 py-2 bg-legal-gold text-white rounded-xl text-sm font-bold hover:bg-legal-gold/90"
              >
                <Gavel size={14} />
                {isAr ? 'أضف قراراً' : 'Contribuer'}
              </button>
            )}
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className={`mt-4 p-4 rounded-2xl border grid grid-cols-2 md:grid-cols-4 gap-3 ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <select value={domain} onChange={e => setDomain(e.target.value)} className={inputClass}>
                {DOMAINS.map(d => <option key={d.value} value={d.value}>{isAr ? d.label_ar : d.label_fr}</option>)}
              </select>
              <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} className={inputClass}>
                {JURISDICTIONS.map(j => <option key={j.value} value={j.value}>{isAr ? j.label_ar : j.label_fr}</option>)}
              </select>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className={inputClass} placeholder={isAr ? 'من تاريخ' : 'Date début'} />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className={inputClass} placeholder={isAr ? 'إلى تاريخ' : 'Date fin'} />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {initialLoading ? (
              <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {isAr ? 'جاري التحميل...' : 'Chargement...'}</span>
            ) : (
              <span>
                <span className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{total}</span>
                {' '}{isAr ? 'قرار' : 'décision(s)'}
                {took != null && <span className="ml-2 text-xs">— {took}ms</span>}
              </span>
            )}
          </div>

          {/* Domain quick filters */}
          <div className="hidden md:flex gap-2 flex-wrap justify-end">
            {DOMAINS.slice(1, 5).map(d => (
              <button
                key={d.value}
                onClick={() => { setDomain(domain === d.value ? '' : d.value); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  domain === d.value
                    ? 'bg-legal-blue text-white'
                    : `${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`
                }`}
              >
                {isAr ? d.label_ar : d.label_fr}
              </button>
            ))}
          </div>
        </div>

        {/* Entry cards */}
        {initialLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className={`h-40 rounded-2xl animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <p className={`text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isAr ? 'لا توجد نتائج' : 'Aucun résultat'}
            </p>
            <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {isAr ? 'جرب مصطلحات أخرى أو قم بتعديل الفلاتر' : "Essayez d'autres termes ou modifiez les filtres"}
            </p>
            <button onClick={clearSearch} className="mt-4 px-4 py-2 text-legal-blue text-sm hover:underline">
              {isAr ? 'إعادة تعيين البحث' : 'Réinitialiser la recherche'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map(entry => {
              const isExpanded = expandedId === entry.id;
              const domainObj = DOMAINS.find(d => d.value === entry.legal_domain);
              const jurisObj = JURISDICTIONS.find(j => j.value === entry.jurisdiction);

              return (
                <div key={entry.id} className={cardClass}>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {domainObj && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${DOMAIN_COLORS[entry.legal_domain] || 'bg-slate-100 text-slate-700'}`}>
                              <Scale size={10} className="inline mr-1" />
                              {isAr ? domainObj.label_ar : domainObj.label_fr}
                            </span>
                          )}
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${PRECEDENT_COLORS[entry.precedent_value]}`}>
                            {entry.precedent_value === 'binding' ? (isAr ? 'ملزم' : 'Contraignant') :
                             entry.precedent_value === 'persuasive' ? (isAr ? 'مقنع' : 'Persuasif') :
                             (isAr ? 'إعلامي' : 'Informatif')}
                          </span>
                        </div>

                        {/* Case number + court */}
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className={`font-mono font-bold text-sm px-2 py-1 rounded ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                            {entry.case_number}
                          </span>
                          <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {entry.court_name}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className={`flex flex-wrap gap-4 text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(entry.decision_date).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                          {jurisObj && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {isAr ? jurisObj.label_ar : jurisObj.label_fr}
                            </span>
                          )}
                        </div>

                        {/* Summary */}
                        <p className={`text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-3'} ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {entry.summary_fr}
                        </p>

                        {/* Keywords */}
                        {entry.keywords?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {entry.keywords.slice(0, 5).map((kw, i) => (
                              <button
                                key={i}
                                onClick={() => { setQuery(kw); handleSearch(); }}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full transition-colors hover:bg-legal-blue hover:text-white ${
                                  isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                <Tag size={9} />{kw}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Legal references */}
                        {entry.legal_references?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.legal_references.map((ref, i) => (
                              <span key={i} className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs rounded font-mono">
                                {ref}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className={`p-2 rounded-lg flex-shrink-0 transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>

                    {/* Expanded: Arabic summary + full text + cited decisions */}
                    {isExpanded && (
                      <div className={`mt-6 pt-6 border-t space-y-4 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                        {entry.summary_ar && (
                          <div>
                            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <BookOpen size={12} /> {isAr ? 'الملخص بالعربية' : 'Résumé en arabe'}
                            </h4>
                            <p className="text-sm leading-relaxed" dir="rtl">{entry.summary_ar}</p>
                          </div>
                        )}
                        {entry.full_text_fr && (
                          <div>
                            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <FileText size={12} /> {isAr ? 'النص الكامل' : 'Texte intégral'}
                            </h4>
                            <div className={`text-sm leading-relaxed p-4 rounded-xl max-h-64 overflow-y-auto ${isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
                              {entry.full_text_fr}
                            </div>
                          </div>
                        )}
                        {entry.cited_decisions?.length > 0 && (
                          <div>
                            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {isAr ? 'القرارات المستشهد بها' : 'Décisions citées'}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {entry.cited_decisions.map((cd, i) => (
                                <button
                                  key={i}
                                  onClick={() => { setQuery(cd); handleSearch(); }}
                                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded font-mono hover:bg-legal-blue hover:text-white transition-colors ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                                >
                                  {cd}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA contribute (bottom, non-logged users) */}
        {!userId && (
          <div className={`mt-12 p-8 rounded-2xl border text-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <TrendingUp size={32} className="mx-auto text-legal-blue mb-3" />
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isAr ? 'ساهم في إثراء قاعدة البيانات' : 'Contribuez à enrichir la base'}
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isAr
                ? 'انضم إلى المحامين والقضاة والموثقين الذين يساهمون في بناء أول قاعدة اجتهاد قضائي جزائري رقمية'
                : 'Rejoignez les avocats, magistrats et notaires qui construisent la première base jurisprudentielle algérienne numérique'}
            </p>
            <div className="flex gap-3 justify-center">
              <a href="#" className="px-6 py-3 bg-legal-blue text-white rounded-xl font-bold text-sm hover:bg-legal-blue/90">
                {isAr ? 'إنشاء حساب مجاني' : 'Créer un compte gratuit'}
              </a>
              <a href="#" className="px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                {isAr ? 'تعرف على المنصة' : 'En savoir plus'}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Contribute modal */}
      {showContribute && userId && (
        <ContributeJurisprudenceModal
          userId={userId}
          userRole={userRole}
          language={language}
          theme={theme}
          onClose={() => setShowContribute(false)}
          onSuccess={() => { setShowContribute(false); loadInitial(); }}
        />
      )}
    </div>
  );
};

export default JurisprudencePage;
