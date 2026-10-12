import { config } from '@/config/environment';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock external services for testing
jest.mock('@/database/connection', () => {
  const mockQuery = jest.fn().mockImplementation((sql: string, params?: unknown[]) => {
    // Retourner des références de test pour les requêtes sur legal_references
    if (/FROM\s+legal_references/i.test(sql)) {
      return Promise.resolve({
        rows: [
          { id: '1', type: 'law', reference: 'Code de commerce', title: 'Droit commercial', article: null, url: null }
        ]
      });
    }
    // Retourner des règles de conformité par défaut
    if (/FROM\s+compliance_rules/i.test(sql)) {
      // Adapter au domaine demandé (param $1)
      const domainMatch = sql.match(/WHERE\s+domain\s+=\s+\$1/i);
      const domain = domainMatch && params ? (params[0] as string) : null;
      const ruleName = domain === 'labor' ? 'Droit du travail' : 'Forme générale';
      const ruleCategory = domain === 'labor' ? 'labor' : 'form';
      return Promise.resolve({
        rows: [
          { id: 'r1', name: ruleName, description: 'Description de la règle', category: ruleCategory, jurisdiction: 'Algeria', legal_basis: '[]', severity: 'high', is_active: true, last_updated: new Date().toISOString() }
        ]
      });
    }
    return Promise.resolve({ rows: [] });
  });

  return {
    db: {
      query: mockQuery,
      getClient: jest.fn(),
      transaction: jest.fn().mockImplementation(async (cb: (client: { query: jest.Mock }) => Promise<unknown>) => {
        const client = { query: jest.fn().mockResolvedValue({ rows: [] }) };
        return cb(client);
      }),
      testConnection: jest.fn().mockResolvedValue(true),
    },
    connectDatabase: jest.fn().mockResolvedValue(undefined),
    closeDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

// Mock the AI client to avoid real network calls during tests
jest.mock('@/services/aiClient', () => {
  const mockGenerate = jest.fn().mockImplementation((request: { prompt?: string }) => {
    const prompt = request?.prompt ?? '';

    // Si c'est une demande de conformité
    if (/CONFORMITÉ|conformit/i.test(prompt)) {
      return Promise.resolve({
        content: `PROBLÈMES IDENTIFIÉS:
- [critique] Mentions obligatoires absentes du contrat
- [moyenne] Références légales insuffisantes

SUGGESTIONS D'AMÉLIORATION:
- Ajouter les mentions légales requises par le Code civil
- Préciser les références aux articles applicables

RÉFÉRENCES LÉGALES:
- Code civil algérien
- Code de commerce

ÉVALUATION DES RISQUES:
Risque modéré, corrections nécessaires.`,
        usage: { promptTokens: 10, completionTokens: 50, totalTokens: 60 },
        model: 'gemini-2.5-flash',
        finishReason: 'STOP',
        processingTime: 100
      });
    }

    // Si c'est une demande d'amélioration
    if (/AMÉLIORATION/i.test(prompt)) {
      return Promise.resolve({
        content: `STRUCTURE:
- Ajouter des paragraphes
- Structurer en sections

CONTENU:
- Préciser les références légales
- Développer les arguments`,
        usage: { promptTokens: 10, completionTokens: 30, totalTokens: 40 },
        model: 'gemini-2.5-flash',
        finishReason: 'STOP',
        processingTime: 100
      });
    }

    // Si c'est une demande d'explication
    if (/Explique|EXPLIQU/i.test(prompt)) {
      const isAdvanced = /advanced|expert/i.test(prompt);
      return Promise.resolve({
        content: isAdvanced
          ? 'A'.repeat(500) + ' DÉFINITION: Longue définition avancée. CONTEXTE: Contexte juridique algérien détaillé avec jurisprudence.'
          : 'B'.repeat(150) + ' DÉFINITION: Définition courte. CONTEXTE: Contexte juridique algérien.',
        usage: { promptTokens: 10, completionTokens: 30, totalTokens: 40 },
        model: 'gemini-2.5-flash',
        finishReason: 'STOP',
        processingTime: 100
      });
    }

    // Réponse par défaut (JSON forcé pour les drafts)
    return Promise.resolve({
      content: '{"title": "Document de test", "content": "Contenu juridique de test avec Article 124 du Code civil mentionné.", "requiredVariables": [], "optionalVariables": [], "warnings": [], "keyLegalReferences": ["Article 124 du Code civil"]}',
      usage: { promptTokens: 10, completionTokens: 30, totalTokens: 40 },
      model: 'gemini-2.5-flash',
      finishReason: 'STOP',
      processingTime: 100
    });
  });
  return {
    aiClient: {
      generate: mockGenerate,
      generateWithGemini: mockGenerate,
      generateWithGroq: mockGenerate,
      validateLegalResponse: jest.fn().mockReturnValue(true)
    },
    AIRequest: {},
    AIResponse: {}
  };
});

// Mock embedding service
jest.mock('@/services/embeddingService', () => {
  const fixedEmbedding = new Array(768).fill(0.01);
  return {
    EmbeddingService: class {
      chunkText(text: string) {
        return [text];
      }
      get dimension() {
        return 768;
      }
      async embed(_text: string) {
        return fixedEmbedding;
      }
      async embedBatch(texts: string[]) {
        return texts.map((t) => ({ text: t, embedding: fixedEmbedding }));
      }
    },
    embeddingService: {
      chunkText(text: string) {
        return [text];
      },
      get dimension() {
        return 768;
      },
      async embed(_text: string) {
        return fixedEmbedding;
      },
      async embedBatch(texts: string[]) {
        return texts.map((t) => ({ text: t, embedding: fixedEmbedding }));
      }
    }
  };
});

// Mock RAG service to return predictable results
jest.mock('@/services/ragService', () => ({
  ragService: {
    search: jest.fn().mockResolvedValue([]),
    buildContextBlock: jest.fn().mockResolvedValue(null)
  }
}));

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Test database setup functions
export async function setupTestDatabase(): Promise<void> {
  // Mock database setup for testing
  console.log('Setting up test database...');
}

export async function cleanupTestDatabase(): Promise<void> {
  // Mock database cleanup for testing
  console.log('Cleaning up test database...');
}