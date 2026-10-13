/**
 * Helpers pour forcer le LLM à répondre en JSON structuré.
 *
 * Stratégie:
 *  1. Prompt système qui exige du JSON valide
 *  2. Schema Zod (optionnel) pour validation stricte
 *  3. Extraction robuste qui gère ```json```, texte avant/après, JSON tronqué
 *  4. Retry avec consigne de "réponds UNIQUEMENT en JSON" si échec
 */

export interface JsonExtractionResult<T> {
  data: T;
  raw: string;
  attempts: number;
}

export class JsonParseError extends Error {
  constructor(
    message: string,
    public readonly rawResponse: string,
    public readonly underlyingError?: unknown
  ) {
    super(message);
    this.name = 'JsonParseError';
  }
}

/**
 * Extrait le premier objet/tableau JSON d'une chaîne qui peut contenir
 * du texte autour (fences markdown, prose avant/après).
 */
export function extractJsonString(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;

  // 1. Fence ```json ... ```
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }

  // 2. Premier objet JSON équilibré {...}
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = raw.substring(firstBrace, lastBrace + 1);
    if (isLikelyJson(candidate)) return candidate;
  }

  // 3. Premier tableau JSON [...]
  const firstBracket = raw.indexOf('[');
  const lastBracket = raw.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = raw.substring(firstBracket, lastBracket + 1);
    if (isLikelyJson(candidate)) return candidate;
  }

  return null;
}

function isLikelyJson(s: string): boolean {
  const trimmed = s.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

/**
 * Tente de parser une chaîne en JSON, en essayant de "réparer" les erreurs
 * courantes (virgules trailing, quotes simples, JSON tronqué).
 */
export function safeJsonParse<T = unknown>(raw: string): T {
  const candidate = extractJsonString(raw);
  if (!candidate) {
    throw new JsonParseError('No JSON found in response', raw);
  }

  // Tentative directe
  try {
    return JSON.parse(candidate) as T;
  } catch (firstError) {
    // Tenter une réparation légère
    const repaired = attemptRepair(candidate);
    try {
      return JSON.parse(repaired) as T;
    } catch (secondError) {
      throw new JsonParseError(
        'Failed to parse JSON after repair attempt',
        raw,
        secondError
      );
    }
  }
}

function attemptRepair(s: string): string {
  let result = s;

  // Retirer trailing commas avant } ou ]
  result = result.replace(/,(\s*[}\]])/g, '$1');

  // Quotes simples → doubles (risqué, mais utile pour FR)
  // On ne fait ça que si on détecte aucune double-quote au top level
  const hasDoubleQuotes = (result.match(/"/g) ?? []).length > 4;
  if (!hasDoubleQuotes) {
    result = result.replace(/'/g, '"');
  }

  // NaN, undefined, etc. ne sont pas du JSON valide → null
  result = result.replace(/\bNaN\b/g, 'null');
  result = result.replace(/\bundefined\b/g, 'null');

  return result;
}

/**
 * Construit un prompt système qui force la sortie en JSON.
 * Combine avec un schéma en langage naturel.
 */
export function buildJsonForcedPrompt(schemaDescription: string): string {
  return `RÉPONDS UNIQUEMENT EN JSON VALIDE.
Aucun texte avant ou après, aucune explication en prose.
Utilise EXACTEMENT la structure suivante :

${schemaDescription}

Si tu ne peux pas répondre, renvoie un objet avec "error" et "reason".
Réponds en JSON, rien d'autre.`;
}
