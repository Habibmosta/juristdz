/**
 * OCR Service — extraction de texte depuis images/PDF scannés
 * Utilise OCR.space API (gratuit jusqu'à 25k pages/mois, support arabe)
 * https://ocr.space/ocrapi
 *
 * Clé API gratuite : https://ocr.space/ocrapi/freekey
 * Variable d'environnement : VITE_OCR_SPACE_API_KEY
 */

export interface OcrResult {
  text: string;
  language: 'fr' | 'ar' | 'mixed';
  confidence: number;       // 0-100
  pages: number;
  rawResponse?: any;
}

export interface ExtractedJurisprudenceFields {
  case_number?: string;
  decision_date?: string;   // YYYY-MM-DD
  court_name?: string;
  summary_fr?: string;
  summary_ar?: string;
  legal_references?: string[];
  keywords?: string[];
}

// ─── Patterns d'extraction pour les décisions algériennes ────────────────────

const PATTERNS = {
  // Numéros de dossier : CS/Civ/2022/1234, N°1234/22, Dossier n°...
  caseNumber: [
    /(?:CS|CA|TC|TA|CE)\/\w+\/\d{4}\/\d+/i,
    /[Nn]°\s*(\d{4,}\/\d{2,4})/,
    /[Dd]ossier\s+[Nn]°?\s*(\d[\d\/\-]+)/,
    /[Qq]uatre-vingt[- ]\w+\s+(\d{4,})/,
  ],
  // Dates : 15/03/2022, 15 mars 2022, 2022-03-15
  date: [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
    /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,
  ],
  // Juridictions
  court: [
    /[Cc]our\s+[Ss]uprême/,
    /[Cc]onseil\s+d['']État/,
    /[Cc]our\s+d[''][Aa]ppel\s+(?:de\s+)?(\w+)/,
    /[Tt]ribunal\s+(?:de\s+[Cc]ommerce|[Aa]dministratif|[Cc]ivil)\s+(?:de\s+)?(\w+)?/,
  ],
  // Références légales : Art. 176 C.Civ, Loi 90-11, Ordonnance 75-58
  legalRef: /(?:Art(?:icle)?\.?\s*\d+(?:\s+(?:bis|ter))?\s+(?:C\.Civ|C\.Com|C\.Pén|CPCA|CPP|CF|CPF)|(?:Loi|Ordonnance|Décret)\s+\d{2,4}[-\/]\d{2,4})/gi,
  // Mots arabes (pour détecter contenu arabe)
  arabic: /[\u0600-\u06FF]{3,}/,
};

const MONTH_MAP: Record<string, string> = {
  janvier: '01', février: '02', mars: '03', avril: '04',
  mai: '05', juin: '06', juillet: '07', août: '08',
  septembre: '09', octobre: '10', novembre: '11', décembre: '12',
};

// ─── Extraction intelligente des champs depuis le texte OCR ──────────────────

export function extractFieldsFromText(text: string): ExtractedJurisprudenceFields {
  const fields: ExtractedJurisprudenceFields = {};
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Numéro de dossier
  for (const pattern of PATTERNS.caseNumber) {
    const match = text.match(pattern);
    if (match) {
      fields.case_number = match[0].trim();
      break;
    }
  }

  // Date
  for (const pattern of PATTERNS.date) {
    const match = text.match(pattern);
    if (match) {
      if (pattern === PATTERNS.date[0]) {
        // DD/MM/YYYY
        fields.decision_date = `${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`;
      } else if (pattern === PATTERNS.date[1]) {
        // DD mois YYYY
        const month = MONTH_MAP[match[2].toLowerCase()] || '01';
        fields.decision_date = `${match[3]}-${month}-${match[1].padStart(2,'0')}`;
      } else {
        // YYYY-MM-DD
        fields.decision_date = `${match[1]}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`;
      }
      break;
    }
  }

  // Juridiction
  for (const pattern of PATTERNS.court) {
    const match = text.match(pattern);
    if (match) {
      fields.court_name = match[0].trim();
      break;
    }
  }

  // Références légales
  const refs = text.match(PATTERNS.legalRef);
  if (refs) {
    fields.legal_references = [...new Set(refs.map(r => r.trim()))].slice(0, 10);
  }

  // Résumé : prendre les 3-5 premières lignes substantielles (>30 chars)
  const substantialLines = lines.filter(l => l.length > 30 && !l.match(/^\d+$/) && !l.match(/^[A-Z\s]{2,}:$/));
  if (substantialLines.length > 0) {
    const summaryLines = substantialLines.slice(0, 5).join(' ');
    // Détecter si arabe ou français
    if (PATTERNS.arabic.test(summaryLines)) {
      fields.summary_ar = summaryLines.substring(0, 800);
    } else {
      fields.summary_fr = summaryLines.substring(0, 800);
    }
  }

  // Mots-clés automatiques depuis le texte
  const autoKeywords = extractKeywords(text);
  if (autoKeywords.length > 0) {
    fields.keywords = autoKeywords;
  }

  return fields;
}

// Extraction de mots-clés juridiques depuis le texte
function extractKeywords(text: string): string[] {
  const legalTerms = [
    'responsabilité', 'contrat', 'nullité', 'prescription', 'dommages-intérêts',
    'licenciement', 'divorce', 'succession', 'faillite', 'liquidation',
    'appel', 'cassation', 'opposition', 'exécution', 'saisie',
    'hypothèque', 'bail', 'loyer', 'expulsion', 'indemnité',
    'faute', 'préjudice', 'réparation', 'résolution', 'résiliation',
    'garde', 'pension alimentaire', 'héritage', 'testament',
    'société', 'gérant', 'associés', 'fonds de commerce',
    'marchés publics', 'acte administratif', 'excès de pouvoir',
    'escroquerie', 'abus de confiance', 'détournement', 'corruption',
  ];
  const lower = text.toLowerCase();
  return legalTerms.filter(term => lower.includes(term)).slice(0, 8);
}

// ─── Appel API OCR.space ──────────────────────────────────────────────────────

const OCR_API_URL = 'https://api.ocr.space/parse/image';
const API_KEY = import.meta.env.VITE_OCR_SPACE_API_KEY || 'helloworld'; // clé démo limitée

export async function performOcr(file: File): Promise<OcrResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('apikey', API_KEY);
  formData.append('language', 'ara+fre');   // Arabe + Français
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2');         // Engine 2 = meilleur pour arabe

  const response = await fetch(OCR_API_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`OCR API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage?.[0] || 'OCR processing failed');
  }

  const parsedResults = data.ParsedResults || [];
  const fullText = parsedResults.map((r: any) => r.ParsedText || '').join('\n');
  const avgConfidence = parsedResults.reduce((sum: number, r: any) => sum + (r.TextOverlay?.Lines?.length || 0), 0);

  // Détecter la langue dominante
  const hasArabic = PATTERNS.arabic.test(fullText);
  const hasFrench = /[a-zA-ZÀ-ÿ]{3,}/.test(fullText);
  const language: OcrResult['language'] = hasArabic && hasFrench ? 'mixed' : hasArabic ? 'ar' : 'fr';

  return {
    text: fullText,
    language,
    confidence: Math.min(95, 60 + avgConfidence),
    pages: parsedResults.length,
    rawResponse: data,
  };
}

// ─── OCR depuis URL (pour PDF déjà en ligne) ─────────────────────────────────

export async function performOcrFromUrl(url: string): Promise<OcrResult> {
  const formData = new FormData();
  formData.append('url', url);
  formData.append('apikey', API_KEY);
  formData.append('language', 'ara+fre');
  formData.append('OCREngine', '2');

  const response = await fetch(OCR_API_URL, { method: 'POST', body: formData });
  if (!response.ok) throw new Error(`OCR API error: ${response.status}`);

  const data = await response.json();
  if (data.IsErroredOnProcessing) throw new Error(data.ErrorMessage?.[0] || 'OCR failed');

  const fullText = (data.ParsedResults || []).map((r: any) => r.ParsedText || '').join('\n');
  const hasArabic = PATTERNS.arabic.test(fullText);
  const hasFrench = /[a-zA-ZÀ-ÿ]{3,}/.test(fullText);

  return {
    text: fullText,
    language: hasArabic && hasFrench ? 'mixed' : hasArabic ? 'ar' : 'fr',
    confidence: 75,
    pages: data.ParsedResults?.length || 1,
  };
}
