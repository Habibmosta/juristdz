import { Router } from 'express';
import { algerianSpecificitiesService } from '@/services/algerianSpecificitiesService';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';
import { logger } from '@/utils/logger';

const router = Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

/**
 * GET /api/algerian-specificities/courts
 * Obtient la liste des tribunaux algériens
 */
router.get('/courts', rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'administrateur_plateforme']), async (req, res) => {
  try {
    const { wilaya, type, ville } = req.query;
    
    let query = 'SELECT * FROM algerian_courts WHERE is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (wilaya) {
      query += ` AND wilaya = $${paramIndex}`;
      params.push(wilaya);
      paramIndex++;
    }

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (ville) {
      query += ` AND ville ILIKE $${paramIndex}`;
      params.push(`%${ville}%`);
      paramIndex++;
    }

    query += ' ORDER BY wilaya, ville, name';

    const db = algerianSpecificitiesService['db'];
    const result = await db.query(query, params);

    const courts = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      nameArabic: row.name_arabic,
      type: row.type,
      wilaya: row.wilaya,
      ville: row.ville,
      adresse: row.adresse,
      telephone: row.telephone,
      email: row.email,
      specialites: JSON.parse(row.specialites || '[]'),
      horaires: JSON.parse(row.horaires)
    }));

    res.json({
      success: true,
      data: courts,
      total: courts.length
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des tribunaux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tribunaux'
    });
  }
});

/**
 * GET /api/algerian-specificities/courts/:id
 * Obtient les détails d'un tribunal spécifique
 */
router.get('/courts/:id', rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'administrateur_plateforme']), async (req, res) => {
  try {
    const { id } = req.params;
    const court = await algerianSpecificitiesService.getCourtSpecificities(id);

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'Tribunal non trouvé'
      });
    }

    res.json({
      success: true,
      data: court
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du tribunal:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du tribunal'
    });
  }
});

/**
 * GET /api/algerian-specificities/barreaux
 * Obtient la liste des barreaux algériens
 */
router.get('/barreaux', rbacMiddleware(['avocat', 'administrateur_plateforme']), async (req, res) => {
  try {
    const { wilaya, ville } = req.query;
    
    let query = 'SELECT * FROM algerian_barreaux WHERE is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (wilaya) {
      query += ` AND wilaya = $${paramIndex}`;
      params.push(wilaya);
      paramIndex++;
    }

    if (ville) {
      query += ` AND ville ILIKE $${paramIndex}`;
      params.push(`%${ville}%`);
      paramIndex++;
    }

    query += ' ORDER BY wilaya, ville, name';

    const db = algerianSpecificitiesService['db'];
    const result = await db.query(query, params);

    const barreaux = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      nameArabic: row.name_arabic,
      wilaya: row.wilaya,
      ville: row.ville,
      adresse: row.adresse,
      telephone: row.telephone,
      email: row.email,
      siteWeb: row.site_web,
      batonnier: row.batonnier,
      nombreAvocats: row.nombre_avocats,
      specialites: JSON.parse(row.specialites || '[]')
    }));

    res.json({
      success: true,
      data: barreaux,
      total: barreaux.length
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des barreaux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des barreaux'
    });
  }
});

/**
 * GET /api/algerian-specificities/barreaux/:id/baremes
 * Obtient les barèmes d'honoraires d'un barreau
 */
router.get('/barreaux/:id/baremes', rbacMiddleware(['avocat', 'administrateur_plateforme']), async (req, res) => {
  try {
    const { id } = req.params;
    const baremes = await algerianSpecificitiesService.getBaremeHonoraires(id);

    if (!baremes) {
      return res.status(404).json({
        success: false,
        message: 'Barème non trouvé pour ce barreau'
      });
    }

    res.json({
      success: true,
      data: baremes
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du barème:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du barème'
    });
  }
});

/**
 * POST /api/algerian-specificities/calculate-fees
 * Calcule les honoraires selon le barème algérien
 */
router.post('/calculate-fees', rbacMiddleware(['avocat', 'administrateur_plateforme']), async (req, res) => {
  try {
    const { barreauId, typePrestation, specialite, complexite, distance } = req.body;

    if (!barreauId || !typePrestation) {
      return res.status(400).json({
        success: false,
        message: 'barreauId et typePrestation sont requis'
      });
    }

    const calculation = await algerianSpecificitiesService.calculateAlgerianFees(
      barreauId,
      typePrestation,
      specialite,
      complexite || 'simple',
      distance
    );

    res.json({
      success: true,
      data: calculation
    });

  } catch (error) {
    logger.error('Erreur lors du calcul des honoraires:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors du calcul des honoraires'
    });
  }
});

/**
 * POST /api/algerian-specificities/calculate-delay
 * Calcule les délais selon le calendrier judiciaire algérien
 */
router.post('/calculate-delay', rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'administrateur_plateforme']), async (req, res) => {
  try {
    const { dateDebut, nombreJours, tribunalId } = req.body;

    if (!dateDebut || !nombreJours) {
      return res.status(400).json({
        success: false,
        message: 'dateDebut et nombreJours sont requis'
      });
    }

    const startDate = new Date(dateDebut);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format de date invalide'
      });
    }

    const calculation = await algerianSpecificitiesService.calculateAlgerianDelay(
      startDate,
      parseInt(nombreJours),
      tribunalId
    );

    res.json({
      success: true,
      data: calculation
    });

  } catch (error) {
    logger.error('Erreur lors du calcul de délai:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors du calcul de délai'
    });
  }
});

/**
 * GET /api/algerian-specificities/procedures
 * Obtient la liste des procédures spécifiques algériennes
 */
router.get('/procedures', rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'administrateur_plateforme']), async (req, res) => {
  try {
    const { domaine, tribunal } = req.query;
    
    let query = 'SELECT * FROM specific_procedures WHERE is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (domaine) {
      query += ` AND domaine = $${paramIndex}`;
      params.push(domaine);
      paramIndex++;
    }

    if (tribunal) {
      query += ` AND tribunal = $${paramIndex}`;
      params.push(tribunal);
      paramIndex++;
    }

    query += ' ORDER BY domaine, nom';

    const db = algerianSpecificitiesService['db'];
    const result = await db.query(query, params);

    const procedures = result.rows.map(row => ({
      id: row.id,
      nom: row.nom,
      nomArabe: row.nom_arabe,
      tribunal: row.tribunal,
      domaine: row.domaine,
      etapes: JSON.parse(row.etapes),
      delais: JSON.parse(row.delais),
      documents: JSON.parse(row.documents),
      frais: JSON.parse(row.frais),
      specificites: JSON.parse(row.specificites || '[]')
    }));

    res.json({
      success: true,
      data: procedures,
      total: procedures.length
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des procédures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des procédures'
    });
  }
});

/**
 * GET /api/algerian-specificities/procedures/:id
 * Obtient les détails d'une procédure spécifique
 */
router.get('/procedures/:id', rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'administrateur_plateforme']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = algerianSpecificitiesService['db'];
    const result = await db.query('SELECT * FROM specific_procedures WHERE id = $1 AND is_active = true', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Procédure non trouvée'
      });
    }

    const row = result.rows[0];
    const procedure = {
      id: row.id,
      nom: row.nom,
      nomArabe: row.nom_arabe,
      tribunal: row.tribunal,
      domaine: row.domaine,
      etapes: JSON.parse(row.etapes),
      delais: JSON.parse(row.delais),
      documents: JSON.parse(row.documents),
      frais: JSON.parse(row.frais),
      specificites: JSON.parse(row.specificites || '[]')
    };

    res.json({
      success: true,
      data: procedure
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération de la procédure:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la procédure'
    });
  }
});

/**
 * GET /api/algerian-specificities/judicial-calendar/:year
 * Obtient le calendrier judiciaire pour une année
 */
router.get('/judicial-calendar/:year', rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'administrateur_plateforme']), async (req, res) => {
  try {
    const { year } = req.params;
    const annee = parseInt(year);

    if (isNaN(annee) || annee < 2020 || annee > 2030) {
      return res.status(400).json({
        success: false,
        message: 'Année invalide'
      });
    }

    const db = algerianSpecificitiesService['db'];
    const result = await db.query('SELECT * FROM judicial_calendar WHERE annee = $1', [annee]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Calendrier judiciaire non trouvé pour cette année'
      });
    }

    const row = result.rows[0];
    const calendar = {
      annee: row.annee,
      joursOuvres: JSON.parse(row.jours_ouvres),
      joursChomes: JSON.parse(row.jours_chomes),
      vacancesJudiciaires: JSON.parse(row.vacances_judiciaires),
      evenementsSpeciaux: JSON.parse(row.evenements_speciaux || '[]')
    };

    res.json({
      success: true,
      data: calendar
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du calendrier judiciaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du calendrier judiciaire'
    });
  }
});

/**
 * GET /api/algerian-specificities/wilayas
 * Obtient la liste des wilayas avec leurs tribunaux et barreaux
 */
router.get('/wilayas', rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'administrateur_plateforme']), async (req, res) => {
  try {
    const db = algerianSpecificitiesService['db'];
    
    // Obtenir les wilayas avec leurs tribunaux
    const courtsQuery = `
      SELECT wilaya, COUNT(*) as nombre_tribunaux, 
             array_agg(DISTINCT type) as types_tribunaux
      FROM algerian_courts 
      WHERE is_active = true 
      GROUP BY wilaya 
      ORDER BY wilaya
    `;
    
    const courtsResult = await db.query(courtsQuery);
    
    // Obtenir les wilayas avec leurs barreaux
    const barreauxQuery = `
      SELECT wilaya, COUNT(*) as nombre_barreaux,
             SUM(nombre_avocats) as total_avocats
      FROM algerian_barreaux 
      WHERE is_active = true 
      GROUP BY wilaya 
      ORDER BY wilaya
    `;
    
    const barreauxResult = await db.query(barreauxQuery);
    
    // Combiner les résultats
    const wilayasMap = new Map();
    
    courtsResult.rows.forEach(row => {
      wilayasMap.set(row.wilaya, {
        wilaya: row.wilaya,
        nombreTribunaux: parseInt(row.nombre_tribunaux),
        typesTribunaux: row.types_tribunaux,
        nombreBarreaux: 0,
        totalAvocats: 0
      });
    });
    
    barreauxResult.rows.forEach(row => {
      const existing = wilayasMap.get(row.wilaya) || {
        wilaya: row.wilaya,
        nombreTribunaux: 0,
        typesTribunaux: []
      };
      
      existing.nombreBarreaux = parseInt(row.nombre_barreaux);
      existing.totalAvocats = parseInt(row.total_avocats || 0);
      
      wilayasMap.set(row.wilaya, existing);
    });

    const wilayas = Array.from(wilayasMap.values());

    res.json({
      success: true,
      data: wilayas,
      total: wilayas.length
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des wilayas:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des wilayas'
    });
  }
});

export default router;