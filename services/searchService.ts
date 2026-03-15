/**
 * Search service — local implementation (no backend API required)
 * Provides jurisprudence and legal text search using local mock data.
 */
import type {
  SearchQuery,
  SearchResult,
  JurisprudenceResult,
  LegalText,
  LegalDomain,
  Jurisdiction,
} from '../types/search';

// ─── Static filter options ────────────────────────────────────────────────────

const DOMAINS: LegalDomain[] = [
  'civil', 'penal', 'commercial', 'administratif',
  'travail', 'famille', 'immobilier', 'fiscal',
  'constitutionnel', 'international',
];

const JURISDICTIONS: Jurisdiction[] = [
  'cour_supreme', 'conseil_etat', 'tribunal_administratif',
  'cour_appel', 'tribunal', 'tribunal_commerce',
];

// ─── Mock jurisprudence data ──────────────────────────────────────────────────

const MOCK_JURISPRUDENCE: JurisprudenceResult[] = [
  {
    id: 'j1',
    caseNumber: 'CS/2022/1234',
    date: '2022-03-15',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'civil',
    summary: 'Arrêt relatif à la responsabilité contractuelle et aux dommages-intérêts en droit civil algérien.',
    keywords: ['responsabilité', 'contrat', 'dommages-intérêts', 'droit civil'],
    precedentValue: 'binding',
    relevanceScore: 0.95,
  },
  {
    id: 'j2',
    caseNumber: 'CE/2021/567',
    date: '2021-11-20',
    court: { id: 'ce', name: 'Conseil d\'État', jurisdiction: 'conseil_etat' },
    legalDomain: 'administratif',
    summary: 'Décision portant sur l\'excès de pouvoir dans les actes administratifs.',
    keywords: ['excès de pouvoir', 'acte administratif', 'annulation'],
    precedentValue: 'binding',
    relevanceScore: 0.88,
  },
  {
    id: 'j3',
    caseNumber: 'CA/ALGER/2023/890',
    date: '2023-06-10',
    court: { id: 'ca-alger', name: 'Cour d\'Appel d\'Alger', jurisdiction: 'cour_appel' },
    legalDomain: 'commercial',
    summary: 'Litige commercial relatif à un contrat de fourniture et à la résolution pour inexécution.',
    keywords: ['contrat commercial', 'résolution', 'inexécution', 'fourniture'],
    precedentValue: 'persuasive',
    relevanceScore: 0.82,
  },
  {
    id: 'j4',
    caseNumber: 'CS/2020/2201',
    date: '2020-09-05',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'famille',
    summary: 'Arrêt relatif à la garde des enfants et à la pension alimentaire après divorce.',
    keywords: ['divorce', 'garde', 'pension alimentaire', 'droit de la famille'],
    precedentValue: 'binding',
    relevanceScore: 0.79,
  },
  {
    id: 'j5',
    caseNumber: 'TC/ORAN/2022/445',
    date: '2022-07-18',
    court: { id: 'tc-oran', name: 'Tribunal de Commerce d\'Oran', jurisdiction: 'tribunal_commerce' },
    legalDomain: 'commercial',
    summary: 'Procédure de faillite et liquidation judiciaire d\'une société commerciale.',
    keywords: ['faillite', 'liquidation', 'société', 'créanciers'],
    precedentValue: 'informative',
    relevanceScore: 0.74,
  },
  {
    id: 'j6',
    caseNumber: 'CS/2023/3301',
    date: '2023-01-25',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'travail',
    summary: 'Licenciement abusif et indemnisation du salarié — application de la loi 90-11.',
    keywords: ['licenciement', 'travail', 'indemnisation', 'loi 90-11'],
    precedentValue: 'binding',
    relevanceScore: 0.91,
  },
];

const MOCK_LEGAL_TEXTS: LegalText[] = [
  {
    id: 'lt1',
    reference: 'Ordonnance 75-58',
    title: 'Code Civil Algérien',
    domain: 'civil',
    publicationDate: '1975-09-26',
    content: 'Code civil algérien régissant les obligations, contrats, responsabilité civile et droits réels.',
    joraReference: 'JORA n°78 du 30/09/1975',
  },
  {
    id: 'lt2',
    reference: 'Loi 08-09',
    title: 'Code de Procédure Civile et Administrative (CPCA)',
    domain: 'civil',
    publicationDate: '2008-02-25',
    content: 'Procédures civiles et administratives devant les juridictions algériennes.',
    joraReference: 'JORA n°21 du 23/04/2008',
  },
  {
    id: 'lt3',
    reference: 'Ordonnance 66-156',
    title: 'Code Pénal Algérien',
    domain: 'penal',
    publicationDate: '1966-06-08',
    content: 'Infractions et peines applicables en droit pénal algérien.',
    joraReference: 'JORA n°49 du 11/06/1966',
  },
  {
    id: 'lt4',
    reference: 'Loi 90-11',
    title: 'Loi relative aux relations de travail',
    domain: 'travail',
    publicationDate: '1990-04-21',
    content: 'Relations individuelles et collectives de travail, contrat de travail, licenciement.',
    joraReference: 'JORA n°17 du 25/04/1990',
  },
  {
    id: 'lt5',
    reference: 'Loi 07-11',
    title: 'Code de Procédure Pénale',
    domain: 'penal',
    publicationDate: '2007-11-25',
    content: 'Procédures pénales, instruction, jugement et voies de recours.',
    joraReference: 'JORA n°76 du 25/11/2007',
  },
];

// ─── Suggestion keywords ──────────────────────────────────────────────────────

const SUGGESTION_KEYWORDS = [
  'responsabilité civile', 'contrat de travail', 'licenciement abusif',
  'divorce', 'garde des enfants', 'pension alimentaire', 'succession',
  'faillite', 'liquidation judiciaire', 'appel', 'cassation',
  'excès de pouvoir', 'acte administratif', 'prescription', 'délai',
  'dommages-intérêts', 'résolution du contrat', 'nullité', 'exécution forcée',
  'saisie', 'hypothèque', 'bail commercial', 'loyer', 'expulsion',
  'société commerciale', 'SARL', 'SPA', 'associés', 'gérant',
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function scoreMatch(text: string, query: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return 1;
  const words = q.split(/\s+/);
  const matched = words.filter(w => t.includes(w)).length;
  return matched / words.length;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class SearchService {
  async searchJurisprudence(query: SearchQuery): Promise<SearchResult<JurisprudenceResult>> {
    const q = query.text.toLowerCase();
    const results = MOCK_JURISPRUDENCE
      .filter(j => {
        if (query.filters?.domain && j.legalDomain !== query.filters.domain) return false;
        if (query.filters?.jurisdiction && j.court.jurisdiction !== query.filters.jurisdiction) return false;
        const score = scoreMatch(j.summary || '', q) + scoreMatch((j.keywords || []).join(' '), q);
        return score > 0;
      })
      .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
      .slice(0, query.pageSize ?? 50);

    return {
      query,
      items: results,
      total: results.length,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 50,
      took: 12,
    };
  }

  async searchLegalTexts(query: SearchQuery): Promise<SearchResult<LegalText>> {
    const q = query.text.toLowerCase();
    const results = MOCK_LEGAL_TEXTS
      .filter(t => {
        if (query.filters?.domain && t.domain !== query.filters.domain) return false;
        const score = scoreMatch(t.title, q) + scoreMatch(t.content, q) + scoreMatch(t.reference, q);
        return score > 0;
      })
      .slice(0, query.pageSize ?? 50);

    return {
      query,
      items: results,
      total: results.length,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 50,
      took: 8,
    };
  }

  async getSearchSuggestions(partialQuery: string): Promise<string[]> {
    if (partialQuery.length < 2) return [];
    const q = partialQuery.toLowerCase();
    return SUGGESTION_KEYWORDS
      .filter(k => k.toLowerCase().includes(q))
      .slice(0, 6);
  }

  async getSearchFilters(): Promise<{ domains: LegalDomain[]; jurisdictions: Jurisdiction[] }> {
    return { domains: DOMAINS, jurisdictions: JURISDICTIONS };
  }
}

export const searchService = new SearchService();
