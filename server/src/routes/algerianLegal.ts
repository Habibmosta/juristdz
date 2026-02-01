import { Router, Request, Response } from 'express';
import { algerianLegalSystemService } from '@/services/algerianLegalSystemService';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';

/**
 * Routes pour le système juridique algérien
 * Accès aux codes algériens, JORA et références légales
 */

const router = Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

/**
 * GET /api/algerian-legal/search
 * Recherche dans les références légales algériennes
 */
router.get('/search',
  rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'etudiant', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const {
        texte,
        langue = 'fr',
        codes,
        types,
        dateDebut,
        dateFin,
        motsClefs,
        pertinenceMin = 0.1
      } = req.query;

      if (!texte) {
        return res.status(400).json({
          error: 'Paramètre de recherche "texte" requis'
        });
      }

      const searchQuery = {
        texte: texte as string,
        langue: langue as 'fr' | 'ar',
        codes: codes ? (codes as string).split(',') : undefined,
        types: types ? (types as string).split(',') : undefined,
        dateDebut: dateDebut ? new Date(dateDebut as string) : undefined,
        dateFin: dateFin ? new Date(dateFin as string) : undefined,
        motsClefs: motsClefs ? (motsClefs as string).split(',') : undefined,
        pertinenceMin: parseFloat(pertinenceMin as string)
      };

      const results = await algerianLegalSystemService.searchLegalReferences(searchQuery);

      res.json({
        success: true,
        data: results,
        query: searchQuery
      });

    } catch (error) {
      console.error('Erreur lors de la recherche légale:', error);
      res.status(500).json({
        error: 'Erreur lors de la recherche dans les références légales'
      });
    }
  }
);

/**
 * GET /api/algerian-legal/codes
 * Liste les codes algériens disponibles
 */
router.get('/codes',
  rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'etudiant', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { type, actif = 'true' } = req.query;

      // Construire la requête
      let query = 'SELECT * FROM algerian_codes WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (type) {
        query += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (actif === 'true') {
        query += ` AND is_active = true`;
      }

      query += ' ORDER BY name';

      const { getDb } = await import('@/database/connection');
      const db = getDb();
      const result = await db.query(query, params);

      const codes = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        nameArabic: row.name_arabic,
        type: row.type,
        version: row.version,
        datePromulgation: row.date_promulgation,
        dateEntreeVigueur: row.date_entree_vigueur,
        description: row.description,
        isActive: row.is_active
      }));

      res.json({
        success: true,
        data: codes,
        total: codes.length
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des codes:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des codes algériens'
      });
    }
  }
);

/**
 * GET /api/algerian-legal/codes/:codeId/articles
 * Récupère les articles d'un code spécifique
 */
router.get('/codes/:codeId/articles',
  rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'etudiant', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { codeId } = req.params;
      const { chapitre, section, statut = 'actif', limit = 50, offset = 0 } = req.query;

      let query = 'SELECT * FROM legal_articles WHERE code_id = $1';
      const params: any[] = [codeId];
      let paramIndex = 2;

      if (chapitre) {
        query += ` AND chapitre ILIKE $${paramIndex}`;
        params.push(`%${chapitre}%`);
        paramIndex++;
      }

      if (section) {
        query += ` AND section ILIKE $${paramIndex}`;
        params.push(`%${section}%`);
        paramIndex++;
      }

      if (statut) {
        query += ` AND statut = $${paramIndex}`;
        params.push(statut);
        paramIndex++;
      }

      query += ` ORDER BY CAST(numero AS INTEGER) LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string), parseInt(offset as string));

      const { getDb } = await import('@/database/connection');
      const db = getDb();
      const result = await db.query(query, params);

      const articles = result.rows.map(row => ({
        id: row.id,
        numero: row.numero,
        titre: row.titre,
        contenu: row.contenu,
        contenuArabe: row.contenu_arabe,
        chapitre: row.chapitre,
        section: row.section,
        dateModification: row.date_modification,
        statut: row.statut,
        references: JSON.parse(row.references || '[]'),
        motsClefs: JSON.parse(row.mots_clefs || '[]')
      }));

      res.json({
        success: true,
        data: articles,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: articles.length
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des articles:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des articles du code'
      });
    }
  }
);

/**
 * GET /api/algerian-legal/codes/:codeId/articles/:articleNumber
 * Récupère un article spécifique avec ses références
 */
router.get('/codes/:codeId/articles/:articleNumber',
  rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'etudiant', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { codeId, articleNumber } = req.params;

      const references = await algerianLegalSystemService.getArticleReferences(codeId, articleNumber);

      if (references.length === 0) {
        return res.status(404).json({
          error: 'Article non trouvé'
        });
      }

      // Récupérer les détails de l'article
      const { getDb } = await import('@/database/connection');
      const db = getDb();
      const articleQuery = 'SELECT * FROM legal_articles WHERE code_id = $1 AND numero = $2 AND statut = \'actif\'';
      const articleResult = await db.query(articleQuery, [codeId, articleNumber]);

      if (articleResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Article non trouvé'
        });
      }

      const article = articleResult.rows[0];

      res.json({
        success: true,
        data: {
          article: {
            id: article.id,
            numero: article.numero,
            titre: article.titre,
            contenu: article.contenu,
            contenuArabe: article.contenu_arabe,
            chapitre: article.chapitre,
            section: article.section,
            dateModification: article.date_modification,
            statut: article.statut,
            motsClefs: JSON.parse(article.mots_clefs || '[]')
          },
          references
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'article:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération de l\'article'
      });
    }
  }
);

/**
 * GET /api/algerian-legal/jora
 * Recherche dans les documents JORA
 */
router.get('/jora',
  rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'etudiant', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const {
        annee,
        numero,
        type,
        ministere,
        dateDebut,
        dateFin,
        texte,
        limit = 20,
        offset = 0
      } = req.query;

      let query = 'SELECT * FROM jora_documents WHERE is_active = true';
      const params: any[] = [];
      let paramIndex = 1;

      if (annee) {
        query += ` AND annee = $${paramIndex}`;
        params.push(parseInt(annee as string));
        paramIndex++;
      }

      if (numero) {
        query += ` AND numero = $${paramIndex}`;
        params.push(numero);
        paramIndex++;
      }

      if (type) {
        query += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (ministere) {
        query += ` AND ministere ILIKE $${paramIndex}`;
        params.push(`%${ministere}%`);
        paramIndex++;
      }

      if (dateDebut) {
        query += ` AND date_publication >= $${paramIndex}`;
        params.push(new Date(dateDebut as string));
        paramIndex++;
      }

      if (dateFin) {
        query += ` AND date_publication <= $${paramIndex}`;
        params.push(new Date(dateFin as string));
        paramIndex++;
      }

      if (texte) {
        query += ` AND (
          to_tsvector('french', titre || ' ' || contenu) @@ plainto_tsquery('french', $${paramIndex})
          OR mots_clefs @> $${paramIndex + 1}
        )`;
        params.push(texte, JSON.stringify([texte.toString().toLowerCase()]));
        paramIndex += 2;
      }

      query += ` ORDER BY date_publication DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string), parseInt(offset as string));

      const { getDb } = await import('@/database/connection');
      const db = getDb();
      const result = await db.query(query, params);

      const documents = result.rows.map(row => ({
        id: row.id,
        numero: row.numero,
        annee: row.annee,
        datePublication: row.date_publication,
        titre: row.titre,
        titreArabe: row.titre_arabe,
        type: row.type,
        ministere: row.ministere,
        contenu: row.contenu.substring(0, 500) + '...', // Aperçu
        motsClefs: JSON.parse(row.mots_clefs || '[]')
      }));

      res.json({
        success: true,
        data: documents,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: documents.length
        }
      });

    } catch (error) {
      console.error('Erreur lors de la recherche JORA:', error);
      res.status(500).json({
        error: 'Erreur lors de la recherche dans les documents JORA'
      });
    }
  }
);

/**
 * GET /api/algerian-legal/jora/:joraId
 * Récupère un document JORA complet
 */
router.get('/jora/:joraId',
  rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'etudiant', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { joraId } = req.params;

      const { getDb } = await import('@/database/connection');
      const db = getDb();
      const query = 'SELECT * FROM jora_documents WHERE id = $1 AND is_active = true';
      const result = await db.query(query, [joraId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Document JORA non trouvé'
        });
      }

      const document = result.rows[0];

      res.json({
        success: true,
        data: {
          id: document.id,
          numero: document.numero,
          annee: document.annee,
          datePublication: document.date_publication,
          titre: document.titre,
          titreArabe: document.titre_arabe,
          type: document.type,
          ministere: document.ministere,
          contenu: document.contenu,
          contenuArabe: document.contenu_arabe,
          references: JSON.parse(document.references || '[]'),
          motsClefs: JSON.parse(document.mots_clefs || '[]')
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du document JORA:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération du document JORA'
      });
    }
  }
);

/**
 * POST /api/algerian-legal/validate-reference
 * Valide une référence légale algérienne
 */
router.post('/validate-reference',
  rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { reference } = req.body;

      if (!reference) {
        return res.status(400).json({
          error: 'Référence légale requise'
        });
      }

      const validation = await algerianLegalSystemService.validateLegalReference(reference);

      res.json({
        success: true,
        data: validation
      });

    } catch (error) {
      console.error('Erreur lors de la validation de référence:', error);
      res.status(500).json({
        error: 'Erreur lors de la validation de la référence légale'
      });
    }
  }
);

/**
 * GET /api/algerian-legal/statistics
 * Récupère les statistiques du système juridique algérien
 */
router.get('/statistics',
  rbacMiddleware(['admin', 'magistrat']),
  async (req: Request, res: Response) => {
    try {
      const statistics = await algerianLegalSystemService.getLegalSystemStatistics();

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des statistiques du système juridique'
      });
    }
  }
);

/**
 * GET /api/algerian-legal/suggestions
 * Obtient des suggestions de recherche
 */
router.get('/suggestions',
  rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'etudiant', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { q } = req.query;

      if (!q || (q as string).length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      // Recherche de suggestions dans les mots-clés
      const { getDb } = await import('@/database/connection');
      const db = getDb();
      
      const suggestionsQuery = `
        SELECT DISTINCT jsonb_array_elements_text(mots_clefs) as suggestion, COUNT(*) as frequency
        FROM (
          SELECT mots_clefs FROM legal_articles WHERE statut = 'actif'
          UNION ALL
          SELECT mots_clefs FROM jora_documents WHERE is_active = true
        ) combined
        WHERE jsonb_array_elements_text(mots_clefs) ILIKE $1
        GROUP BY suggestion
        ORDER BY frequency DESC, suggestion
        LIMIT 10
      `;

      const result = await db.query(suggestionsQuery, [`%${q}%`]);
      const suggestions = result.rows.map(row => row.suggestion);

      res.json({
        success: true,
        data: suggestions
      });

    } catch (error) {
      console.error('Erreur lors de la génération de suggestions:', error);
      res.status(500).json({
        error: 'Erreur lors de la génération de suggestions'
      });
    }
  }
);

export { router as algerianLegalRouter };