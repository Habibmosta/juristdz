import { getDb } from '@/database/connection';
import { logger } from '@/utils/logger';

/**
 * Service d'intégration du système juridique algérien
 * Implémente l'intégration des codes algériens et de la base JORA
 */

export interface AlgerianLegalCode {
  id: string;
  name: string;
  type: 'civil' | 'penal' | 'commercial' | 'administratif' | 'procedure_civile' | 'procedure_penale';
  version: string;
  datePromulgation: Date;
  dateEntreeVigueur: Date;
  isActive: boolean;
  articles: LegalArticle[];
}

export interface LegalArticle {
  id: string;
  codeId: string;
  numero: string;
  titre: string;
  contenu: string;
  contenuArabe?: string;
  chapitre?: string;
  section?: string;
  dateModification?: Date;
  statut: 'actif' | 'abroge' | 'modifie';
  references: string[];
  motsClefs: string[];
}

export interface JORADocument {
  id: string;
  numero: string;
  annee: number;
  datePublication: Date;
  titre: string;
  titreArabe?: string;
  type: 'loi' | 'decret' | 'arrete' | 'ordonnance' | 'decision';
  ministere?: string;
  contenu: string;
  contenuArabe?: string;
  references: string[];
  motsClefs: string[];
  isActive: boolean;
}

export interface LegalReference {
  type: 'code' | 'jora' | 'jurisprudence';
  reference: string;
  article?: string;
  titre: string;
  url?: string;
  datePublication?: Date;
  pertinence: number;
}

export interface LegalSearchQuery {
  texte: string;
  langue?: 'fr' | 'ar';
  codes?: string[];
  types?: string[];
  dateDebut?: Date;
  dateFin?: Date;
  motsClefs?: string[];
  pertinenceMin?: number;
}

export interface LegalSearchResult {
  references: LegalReference[];
  suggestions: string[];
  totalResults: number;
  searchTime: number;
}

export class AlgerianLegalSystemService {
  private readonly db = getDb();
  private readonly codesAlgeriens: Map<string, AlgerianLegalCode> = new Map();
  private readonly joraIndex: Map<string, JORADocument> = new Map();

  constructor() {
    this.initializeAlgerianLegalSystem();
  }

  /**
   * Initialise le système juridique algérien avec les codes de base
   */
  async initializeAlgerianLegalSystem(): Promise<void> {
    try {
      await this.createLegalTables();
      await this.loadAlgerianCodes();
      await this.loadJORADocuments();
      logger.info('Système juridique algérien initialisé avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du système juridique algérien:', error);
    }
  }

  /**
   * Charge les codes algériens de base
   */
  async loadAlgerianCodes(): Promise<void> {
    const codesAlgeriens = [
      {
        id: 'code-civil-algerien',
        name: 'Code Civil Algérien',
        nameArabic: 'القانون المدني الجزائري',
        type: 'civil' as const,
        version: '2007',
        datePromulgation: new Date('1975-09-26'),
        dateEntreeVigueur: new Date('1975-09-26'),
        description: 'Code civil de la République Algérienne Démocratique et Populaire'
      },
      {
        id: 'code-penal-algerien',
        name: 'Code Pénal Algérien',
        nameArabic: 'قانون العقوبات الجزائري',
        type: 'penal' as const,
        version: '2006',
        datePromulgation: new Date('1966-06-08'),
        dateEntreeVigueur: new Date('1966-06-08'),
        description: 'Code pénal de la République Algérienne Démocratique et Populaire'
      },
      {
        id: 'code-commerce-algerien',
        name: 'Code de Commerce Algérien',
        nameArabic: 'القانون التجاري الجزائري',
        type: 'commercial' as const,
        version: '2005',
        datePromulgation: new Date('1975-09-26'),
        dateEntreeVigueur: new Date('1975-09-26'),
        description: 'Code de commerce de la République Algérienne Démocratique et Populaire'
      },
      {
        id: 'code-procedure-civile',
        name: 'Code de Procédure Civile et Administrative',
        nameArabic: 'قانون الإجراءات المدنية والإدارية',
        type: 'procedure_civile' as const,
        version: '2008',
        datePromulgation: new Date('2008-02-25'),
        dateEntreeVigueur: new Date('2009-04-23'),
        description: 'Code de procédure civile et administrative algérien'
      },
      {
        id: 'code-procedure-penale',
        name: 'Code de Procédure Pénale',
        nameArabic: 'قانون الإجراءات الجزائية',
        type: 'procedure_penale' as const,
        version: '2017',
        datePromulgation: new Date('1966-06-08'),
        dateEntreeVigueur: new Date('1966-06-08'),
        description: 'Code de procédure pénale algérien'
      }
    ];

    for (const code of codesAlgeriens) {
      await this.saveAlgerianCode(code);
      await this.loadCodeArticles(code.id);
    }
  }

  /**
   * Charge les articles d'un code spécifique
   */
  async loadCodeArticles(codeId: string): Promise<void> {
    // Articles de base pour chaque code (exemples représentatifs)
    const articlesParCode: Record<string, Partial<LegalArticle>[]> = {
      'code-civil-algerien': [
        {
          numero: '1',
          titre: 'Application de la loi dans le temps',
          contenu: 'La loi ne dispose que pour l\'avenir ; elle n\'a point d\'effet rétroactif.',
          contenuArabe: 'القانون لا يسري إلا على المستقبل ولا يكون له أثر رجعي',
          chapitre: 'Titre préliminaire',
          section: 'De la loi en général',
          motsClefs: ['loi', 'rétroactivité', 'application temporelle']
        },
        {
          numero: '2',
          titre: 'Ignorance de la loi',
          contenu: 'Nul n\'est censé ignorer la loi.',
          contenuArabe: 'لا يعذر أحد بجهل القانون',
          chapitre: 'Titre préliminaire',
          section: 'De la loi en général',
          motsClefs: ['ignorance', 'loi', 'présomption']
        },
        {
          numero: '40',
          titre: 'Personnalité juridique',
          contenu: 'Toute personne a le droit au respect de sa vie privée.',
          contenuArabe: 'لكل شخص الحق في احترام حياته الخاصة',
          chapitre: 'Livre I - Des personnes',
          section: 'Des droits de la personnalité',
          motsClefs: ['personnalité', 'vie privée', 'droits']
        }
      ],
      'code-penal-algerien': [
        {
          numero: '1',
          titre: 'Principe de légalité',
          contenu: 'Nulle infraction ne peut être établie, nulle peine ne peut être prononcée qu\'en vertu d\'une loi.',
          contenuArabe: 'لا جريمة ولا عقوبة إلا بنص',
          chapitre: 'Livre I - Dispositions générales',
          section: 'De la loi pénale',
          motsClefs: ['légalité', 'infraction', 'peine', 'loi']
        },
        {
          numero: '2',
          titre: 'Application de la loi pénale dans le temps',
          contenu: 'La loi pénale n\'a pas d\'effet rétroactif. Toutefois, les dispositions nouvelles s\'appliquent aux infractions commises avant leur entrée en vigueur et n\'ayant pas donné lieu à une condamnation passée en force de chose jugée lorsqu\'elles sont moins sévères que les dispositions anciennes.',
          contenuArabe: 'القانون الجنائي لا يسري بأثر رجعي، غير أن الأحكام الجديدة تطبق على الجرائم المرتكبة قبل نفاذها إذا كانت أخف من الأحكام السابقة',
          chapitre: 'Livre I - Dispositions générales',
          section: 'De la loi pénale',
          motsClefs: ['loi pénale', 'rétroactivité', 'application temporelle']
        }
      ],
      'code-commerce-algerien': [
        {
          numero: '1',
          titre: 'Actes de commerce par nature',
          contenu: 'Sont commerciaux par leur nature : 1° tout achat de biens meubles pour les revendre...',
          contenuArabe: 'تعتبر تجارية بطبيعتها: شراء المنقولات لإعادة بيعها...',
          chapitre: 'Livre I - Du commerce en général',
          section: 'Des actes de commerce',
          motsClefs: ['actes de commerce', 'nature', 'achat', 'revente']
        }
      ]
    };

    const articles = articlesParCode[codeId] || [];
    for (const article of articles) {
      await this.saveCodeArticle({
        id: `${codeId}-art-${article.numero}`,
        codeId,
        numero: article.numero!,
        titre: article.titre!,
        contenu: article.contenu!,
        contenuArabe: article.contenuArabe,
        chapitre: article.chapitre,
        section: article.section,
        statut: 'actif' as const,
        references: [],
        motsClefs: article.motsClefs || []
      });
    }
  }

  /**
   * Charge les documents JORA de base
   */
  async loadJORADocuments(): Promise<void> {
    const documentsJORA = [
      {
        numero: '44',
        annee: 2020,
        datePublication: new Date('2020-07-15'),
        titre: 'Constitution de la République Algérienne Démocratique et Populaire',
        titreArabe: 'دستور الجمهورية الجزائرية الديمقراطية الشعبية',
        type: 'loi' as const,
        contenu: 'Le peuple algérien est libre et souverain...',
        contenuArabe: 'الشعب الجزائري حر ومتسيد...',
        motsClefs: ['constitution', 'république', 'démocratie', 'souveraineté']
      },
      {
        numero: '78',
        annee: 2021,
        datePublication: new Date('2021-12-30'),
        titre: 'Loi de finances pour 2022',
        titreArabe: 'قانون المالية لسنة 2022',
        type: 'loi' as const,
        ministere: 'Ministère des Finances',
        contenu: 'Les ressources et les charges du budget général de l\'État...',
        contenuArabe: 'موارد وأعباء الميزانية العامة للدولة...',
        motsClefs: ['finances', 'budget', 'état', 'ressources']
      }
    ];

    for (const doc of documentsJORA) {
      await this.saveJORADocument({
        id: `jora-${doc.annee}-${doc.numero}`,
        numero: doc.numero,
        annee: doc.annee,
        datePublication: doc.datePublication,
        titre: doc.titre,
        titreArabe: doc.titreArabe,
        type: doc.type,
        ministere: doc.ministere,
        contenu: doc.contenu,
        contenuArabe: doc.contenuArabe,
        references: [],
        motsClefs: doc.motsClefs,
        isActive: true
      });
    }
  }

  /**
   * Recherche dans les références légales algériennes
   */
  async searchLegalReferences(query: LegalSearchQuery): Promise<LegalSearchResult> {
    const startTime = Date.now();
    
    try {
      const references: LegalReference[] = [];
      
      // Recherche dans les codes algériens
      const codeResults = await this.searchInCodes(query);
      references.push(...codeResults);
      
      // Recherche dans les documents JORA
      const joraResults = await this.searchInJORA(query);
      references.push(...joraResults);
      
      // Trier par pertinence
      references.sort((a, b) => b.pertinence - a.pertinence);
      
      // Filtrer par pertinence minimale
      const filteredReferences = query.pertinenceMin 
        ? references.filter(ref => ref.pertinence >= query.pertinenceMin!)
        : references;
      
      // Générer des suggestions
      const suggestions = await this.generateSearchSuggestions(query.texte);
      
      const searchTime = Date.now() - startTime;
      
      return {
        references: filteredReferences,
        suggestions,
        totalResults: filteredReferences.length,
        searchTime
      };
      
    } catch (error) {
      logger.error('Erreur lors de la recherche légale:', error);
      throw error;
    }
  }

  /**
   * Obtient les références d'un article spécifique
   */
  async getArticleReferences(codeId: string, articleNumber: string): Promise<LegalReference[]> {
    try {
      const query = `
        SELECT * FROM legal_articles 
        WHERE code_id = $1 AND numero = $2 AND statut = 'actif'
      `;
      
      const result = await this.db.query(query, [codeId, articleNumber]);
      
      if (result.rows.length === 0) {
        return [];
      }
      
      const article = result.rows[0];
      const references: LegalReference[] = [];
      
      // Ajouter la référence principale
      references.push({
        type: 'code',
        reference: `${codeId} - Art. ${articleNumber}`,
        article: articleNumber,
        titre: article.titre,
        pertinence: 1.0
      });
      
      // Ajouter les références croisées
      const crossRefs = JSON.parse(article.references || '[]');
      for (const ref of crossRefs) {
        references.push({
          type: 'code',
          reference: ref,
          titre: `Référence croisée: ${ref}`,
          pertinence: 0.8
        });
      }
      
      return references;
      
    } catch (error) {
      logger.error('Erreur lors de la récupération des références d\'article:', error);
      return [];
    }
  }

  /**
   * Valide une référence légale algérienne
   */
  async validateLegalReference(reference: string): Promise<{
    isValid: boolean;
    type?: 'code' | 'jora';
    details?: any;
    suggestions?: string[];
  }> {
    try {
      // Analyser le format de la référence
      const codeMatch = reference.match(/^(code-\w+)(?:\s*-\s*art\.?\s*(\d+))?/i);
      const joraMatch = reference.match(/^jora\s*(\d{4})\s*-\s*(\d+)/i);
      
      if (codeMatch) {
        const [, codeId, articleNum] = codeMatch;
        
        // Vérifier l'existence du code
        const codeQuery = 'SELECT * FROM algerian_codes WHERE id = $1 AND is_active = true';
        const codeResult = await this.db.query(codeQuery, [codeId]);
        
        if (codeResult.rows.length === 0) {
          return {
            isValid: false,
            suggestions: await this.suggestSimilarCodes(codeId)
          };
        }
        
        // Si un article est spécifié, vérifier son existence
        if (articleNum) {
          const articleQuery = 'SELECT * FROM legal_articles WHERE code_id = $1 AND numero = $2 AND statut = \'actif\'';
          const articleResult = await this.db.query(articleQuery, [codeId, articleNum]);
          
          if (articleResult.rows.length === 0) {
            return {
              isValid: false,
              type: 'code',
              suggestions: await this.suggestSimilarArticles(codeId, articleNum)
            };
          }
          
          return {
            isValid: true,
            type: 'code',
            details: articleResult.rows[0]
          };
        }
        
        return {
          isValid: true,
          type: 'code',
          details: codeResult.rows[0]
        };
      }
      
      if (joraMatch) {
        const [, annee, numero] = joraMatch;
        
        const joraQuery = 'SELECT * FROM jora_documents WHERE annee = $1 AND numero = $2 AND is_active = true';
        const joraResult = await this.db.query(joraQuery, [parseInt(annee), numero]);
        
        if (joraResult.rows.length === 0) {
          return {
            isValid: false,
            suggestions: await this.suggestSimilarJORA(annee, numero)
          };
        }
        
        return {
          isValid: true,
          type: 'jora',
          details: joraResult.rows[0]
        };
      }
      
      return {
        isValid: false,
        suggestions: ['Format de référence non reconnu. Utilisez: code-civil-algerien-art-123 ou jora-2021-45']
      };
      
    } catch (error) {
      logger.error('Erreur lors de la validation de référence:', error);
      return { isValid: false };
    }
  }

  /**
   * Obtient les statistiques du système juridique algérien
   */
  async getLegalSystemStatistics(): Promise<{
    codes: { total: number; actifs: number; parType: Record<string, number> };
    articles: { total: number; actifs: number; parCode: Record<string, number> };
    jora: { total: number; actifs: number; parAnnee: Record<string, number> };
    dernieresMisesAJour: Date[];
  }> {
    try {
      // Statistiques des codes
      const codesQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as actifs,
          type,
          COUNT(*) as count_by_type
        FROM algerian_codes 
        GROUP BY type
      `;
      const codesResult = await this.db.query(codesQuery);
      
      // Statistiques des articles
      const articlesQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE statut = 'actif') as actifs,
          code_id,
          COUNT(*) as count_by_code
        FROM legal_articles 
        GROUP BY code_id
      `;
      const articlesResult = await this.db.query(articlesQuery);
      
      // Statistiques JORA
      const joraQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as actifs,
          annee,
          COUNT(*) as count_by_year
        FROM jora_documents 
        GROUP BY annee
      `;
      const joraResult = await this.db.query(joraQuery);
      
      // Dernières mises à jour
      const updatesQuery = `
        SELECT DISTINCT date_modification 
        FROM legal_articles 
        WHERE date_modification IS NOT NULL 
        ORDER BY date_modification DESC 
        LIMIT 10
      `;
      const updatesResult = await this.db.query(updatesQuery);
      
      return {
        codes: {
          total: codesResult.rows.reduce((sum, row) => sum + parseInt(row.count_by_type), 0),
          actifs: codesResult.rows.reduce((sum, row) => sum + parseInt(row.actifs || 0), 0),
          parType: codesResult.rows.reduce((acc, row) => {
            acc[row.type] = parseInt(row.count_by_type);
            return acc;
          }, {} as Record<string, number>)
        },
        articles: {
          total: articlesResult.rows.reduce((sum, row) => sum + parseInt(row.count_by_code), 0),
          actifs: articlesResult.rows.reduce((sum, row) => sum + parseInt(row.actifs || 0), 0),
          parCode: articlesResult.rows.reduce((acc, row) => {
            acc[row.code_id] = parseInt(row.count_by_code);
            return acc;
          }, {} as Record<string, number>)
        },
        jora: {
          total: joraResult.rows.reduce((sum, row) => sum + parseInt(row.count_by_year), 0),
          actifs: joraResult.rows.reduce((sum, row) => sum + parseInt(row.actifs || 0), 0),
          parAnnee: joraResult.rows.reduce((acc, row) => {
            acc[row.annee] = parseInt(row.count_by_year);
            return acc;
          }, {} as Record<string, number>)
        },
        dernieresMisesAJour: updatesResult.rows.map(row => row.date_modification)
      };
      
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // Méthodes privées

  private async createLegalTables(): Promise<void> {
    // Table des codes algériens
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS algerian_codes (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        name_arabic VARCHAR(500),
        type VARCHAR(50) NOT NULL,
        version VARCHAR(50),
        date_promulgation DATE,
        date_entree_vigueur DATE,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des articles de codes
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS legal_articles (
        id VARCHAR(255) PRIMARY KEY,
        code_id VARCHAR(255) REFERENCES algerian_codes(id),
        numero VARCHAR(50) NOT NULL,
        titre VARCHAR(1000) NOT NULL,
        contenu TEXT NOT NULL,
        contenu_arabe TEXT,
        chapitre VARCHAR(500),
        section VARCHAR(500),
        date_modification DATE,
        statut VARCHAR(20) DEFAULT 'actif',
        references JSONB DEFAULT '[]'::jsonb,
        mots_clefs JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(code_id, numero)
      )
    `);

    // Table des documents JORA
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS jora_documents (
        id VARCHAR(255) PRIMARY KEY,
        numero VARCHAR(50) NOT NULL,
        annee INTEGER NOT NULL,
        date_publication DATE NOT NULL,
        titre VARCHAR(1000) NOT NULL,
        titre_arabe VARCHAR(1000),
        type VARCHAR(50) NOT NULL,
        ministere VARCHAR(500),
        contenu TEXT NOT NULL,
        contenu_arabe TEXT,
        references JSONB DEFAULT '[]'::jsonb,
        mots_clefs JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(annee, numero)
      )
    `);

    // Index pour les recherches
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_legal_articles_search 
      ON legal_articles USING gin(to_tsvector('french', titre || ' ' || contenu))
    `);

    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_jora_search 
      ON jora_documents USING gin(to_tsvector('french', titre || ' ' || contenu))
    `);

    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_legal_articles_mots_clefs 
      ON legal_articles USING gin(mots_clefs)
    `);
  }

  private async saveAlgerianCode(code: any): Promise<void> {
    const query = `
      INSERT INTO algerian_codes (
        id, name, name_arabic, type, version, date_promulgation, 
        date_entree_vigueur, description, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        name_arabic = EXCLUDED.name_arabic,
        version = EXCLUDED.version,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.db.query(query, [
      code.id,
      code.name,
      code.nameArabic,
      code.type,
      code.version,
      code.datePromulgation,
      code.dateEntreeVigueur,
      code.description,
      true
    ]);
  }

  private async saveCodeArticle(article: LegalArticle): Promise<void> {
    const query = `
      INSERT INTO legal_articles (
        id, code_id, numero, titre, contenu, contenu_arabe,
        chapitre, section, statut, references, mots_clefs
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (code_id, numero) DO UPDATE SET
        titre = EXCLUDED.titre,
        contenu = EXCLUDED.contenu,
        contenu_arabe = EXCLUDED.contenu_arabe,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.db.query(query, [
      article.id,
      article.codeId,
      article.numero,
      article.titre,
      article.contenu,
      article.contenuArabe,
      article.chapitre,
      article.section,
      article.statut,
      JSON.stringify(article.references),
      JSON.stringify(article.motsClefs)
    ]);
  }

  private async saveJORADocument(doc: JORADocument): Promise<void> {
    const query = `
      INSERT INTO jora_documents (
        id, numero, annee, date_publication, titre, titre_arabe,
        type, ministere, contenu, contenu_arabe, references, mots_clefs, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (annee, numero) DO UPDATE SET
        titre = EXCLUDED.titre,
        titre_arabe = EXCLUDED.titre_arabe,
        contenu = EXCLUDED.contenu,
        contenu_arabe = EXCLUDED.contenu_arabe,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.db.query(query, [
      doc.id,
      doc.numero,
      doc.annee,
      doc.datePublication,
      doc.titre,
      doc.titreArabe,
      doc.type,
      doc.ministere,
      doc.contenu,
      doc.contenuArabe,
      JSON.stringify(doc.references),
      JSON.stringify(doc.motsClefs),
      doc.isActive
    ]);
  }

  private async searchInCodes(query: LegalSearchQuery): Promise<LegalReference[]> {
    let sqlQuery = `
      SELECT la.*, ac.name as code_name
      FROM legal_articles la
      JOIN algerian_codes ac ON la.code_id = ac.id
      WHERE la.statut = 'actif' AND ac.is_active = true
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    // Recherche textuelle
    if (query.texte) {
      sqlQuery += ` AND (
        to_tsvector('french', la.titre || ' ' || la.contenu) @@ plainto_tsquery('french', $${paramIndex})
        OR la.mots_clefs @> $${paramIndex + 1}
      )`;
      params.push(query.texte, JSON.stringify([query.texte.toLowerCase()]));
      paramIndex += 2;
    }

    // Filtrer par codes
    if (query.codes && query.codes.length > 0) {
      sqlQuery += ` AND la.code_id = ANY($${paramIndex})`;
      params.push(query.codes);
      paramIndex++;
    }

    // Filtrer par dates
    if (query.dateDebut) {
      sqlQuery += ` AND la.date_modification >= $${paramIndex}`;
      params.push(query.dateDebut);
      paramIndex++;
    }

    if (query.dateFin) {
      sqlQuery += ` AND la.date_modification <= $${paramIndex}`;
      params.push(query.dateFin);
      paramIndex++;
    }

    sqlQuery += ' ORDER BY la.numero LIMIT 50';

    const result = await this.db.query(sqlQuery, params);
    
    return result.rows.map(row => ({
      type: 'code' as const,
      reference: `${row.code_id} - Art. ${row.numero}`,
      article: row.numero,
      titre: row.titre,
      datePublication: row.date_modification,
      pertinence: this.calculateRelevance(query.texte, row.titre + ' ' + row.contenu)
    }));
  }

  private async searchInJORA(query: LegalSearchQuery): Promise<LegalReference[]> {
    let sqlQuery = `
      SELECT * FROM jora_documents
      WHERE is_active = true
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    // Recherche textuelle
    if (query.texte) {
      sqlQuery += ` AND (
        to_tsvector('french', titre || ' ' || contenu) @@ plainto_tsquery('french', $${paramIndex})
        OR mots_clefs @> $${paramIndex + 1}
      )`;
      params.push(query.texte, JSON.stringify([query.texte.toLowerCase()]));
      paramIndex += 2;
    }

    // Filtrer par types
    if (query.types && query.types.length > 0) {
      sqlQuery += ` AND type = ANY($${paramIndex})`;
      params.push(query.types);
      paramIndex++;
    }

    // Filtrer par dates
    if (query.dateDebut) {
      sqlQuery += ` AND date_publication >= $${paramIndex}`;
      params.push(query.dateDebut);
      paramIndex++;
    }

    if (query.dateFin) {
      sqlQuery += ` AND date_publication <= $${paramIndex}`;
      params.push(query.dateFin);
      paramIndex++;
    }

    sqlQuery += ' ORDER BY date_publication DESC LIMIT 50';

    const result = await this.db.query(sqlQuery, params);
    
    return result.rows.map(row => ({
      type: 'jora' as const,
      reference: `JORA ${row.annee}-${row.numero}`,
      titre: row.titre,
      datePublication: row.date_publication,
      pertinence: this.calculateRelevance(query.texte, row.titre + ' ' + row.contenu)
    }));
  }

  private calculateRelevance(searchText: string, content: string): number {
    if (!searchText) return 0.5;
    
    const searchWords = searchText.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let score = 0;
    let totalWords = searchWords.length;
    
    for (const word of searchWords) {
      if (contentLower.includes(word)) {
        score += 1;
      }
    }
    
    return totalWords > 0 ? score / totalWords : 0;
  }

  private async generateSearchSuggestions(searchText: string): Promise<string[]> {
    // Suggestions basées sur les mots-clés fréquents
    const suggestionsQuery = `
      SELECT DISTINCT jsonb_array_elements_text(mots_clefs) as mot_clef, COUNT(*) as frequency
      FROM legal_articles
      WHERE jsonb_array_elements_text(mots_clefs) ILIKE $1
      GROUP BY mot_clef
      ORDER BY frequency DESC
      LIMIT 5
    `;
    
    const result = await this.db.query(suggestionsQuery, [`%${searchText}%`]);
    return result.rows.map(row => row.mot_clef);
  }

  private async suggestSimilarCodes(codeId: string): Promise<string[]> {
    const query = 'SELECT id, name FROM algerian_codes WHERE id ILIKE $1 AND is_active = true LIMIT 3';
    const result = await this.db.query(query, [`%${codeId}%`]);
    return result.rows.map(row => `${row.id} (${row.name})`);
  }

  private async suggestSimilarArticles(codeId: string, articleNum: string): Promise<string[]> {
    const query = `
      SELECT numero, titre FROM legal_articles 
      WHERE code_id = $1 AND numero ILIKE $2 AND statut = 'actif' 
      LIMIT 3
    `;
    const result = await this.db.query(query, [codeId, `%${articleNum}%`]);
    return result.rows.map(row => `Art. ${row.numero}: ${row.titre}`);
  }

  private async suggestSimilarJORA(annee: string, numero: string): Promise<string[]> {
    const query = `
      SELECT annee, numero, titre FROM jora_documents 
      WHERE (annee = $1 OR numero ILIKE $2) AND is_active = true 
      LIMIT 3
    `;
    const result = await this.db.query(query, [parseInt(annee), `%${numero}%`]);
    return result.rows.map(row => `JORA ${row.annee}-${row.numero}: ${row.titre}`);
  }
}

export const algerianLegalSystemService = new AlgerianLegalSystemService();