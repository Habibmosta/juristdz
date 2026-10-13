import { LegalContext } from '@/types/ai';
import { RagContextBlock } from './ragService';

/**
 * Injecte un bloc de contexte RAG dans un prompt LLM.
 * Le contexte est clairement délimité pour que le LLM sache ce qui est "source"
 * vs ce qui est "demande utilisateur".
 */
export function injectRagContext(prompt: string, context: RagContextBlock | null): string {
  if (!context || context.results.length === 0) {
    return prompt;
  }

  return `SOURCES JURIDIQUES PERTINENTES (extraits de la base de connaissances):
"""
${context.formatted}
"""

RÈGLES:
- Tu DOIS te baser prioritairement sur les sources ci-dessus.
- Cite les références (ex: "Selon l'Article X du Code Y") quand tu t'appuies sur une source.
- Si les sources ne contiennent pas la réponse, indique-le explicitement.
- N'invente JAMAIS de référence légale qui n'apparaît pas dans les sources.

DEMANDE UTILISATEUR:
${prompt}`;
}

/**
 * Extrait les sources réellement citées par le LLM dans sa réponse.
 * Permet de lister les références dans la sortie finale du draft.
 */
export function extractCitedSources(
  response: string,
  context: RagContextBlock | null
): string[] {
  if (!context) return [];
  const cited: string[] = [];
  for (const r of context.results) {
    const ref = r.referenceCode ?? r.title;
    if (ref && response.includes(ref)) {
      cited.push(ref);
    }
  }
  return Array.from(new Set(cited));
}

/**
 * Filtre le contexte RAG selon le contexte juridique (domaine + juridiction).
 */
export function buildRagFiltersFromContext(
  legalContext: LegalContext
): {
  domain?: string;
  jurisdiction?: string;
  language?: 'fr' | 'ar';
} {
  const filters: {
    domain?: string;
    jurisdiction?: string;
    language?: 'fr' | 'ar';
  } = {};
  if (legalContext.legalDomain) filters.domain = legalContext.legalDomain;
  filters.jurisdiction = legalContext.jurisdiction ?? 'Algeria';
  if (legalContext.language === 'fr' || legalContext.language === 'ar') {
    filters.language = legalContext.language;
  }
  return filters;
}
