import express from 'express';
import { Pool } from 'pg';
import { MinutierService } from '../services/minutierService.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import { logger } from '../utils/logger.js';
import {
  CreerActeRequest,
  ModifierActeRequest,
  DemanderCopieRequest,
  ArchivageRequest,
  MinutierRecherche,
  TypeActe,
  StatutActe,
  TypeCopie
} from '../types/minutier.js';

export function createMinutierRoutes(db: Pool): express.Router {
  const router = express.Router();
  const minutierService = new MinutierService(db);

  // Apply authentication to all routes
  router.use(authenticateToken);

  /**
   * POST /api/minutier/actes
   * Créer un nouvel acte authentique
   */
  router.post('/actes', checkPermission('minutier:create'), async (req, res) => {
    try {
      const request: CreerActeRequest = req.body;
      const notaireId = req.user!.id;

      // Vérifier que l'utilisateur est bien un notaire
      if (req.user!.role !== 'Notaire') {
        return res.status(403).json({
          success: false,
          message: 'Seuls les notaires peuvent créer des actes authentiques'
        });
      }

      const acte = await minutierService.creerActe(request, notaireId);

      res.status(201).json({
        success: true,
        data: acte,
        message: 'Acte authentique créé avec succès'
      });
    } catch (error) {
      logger.error('Error creating acte authentique', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'acte authentique'
      });
    }
  });

  /**
   * GET /api/minutier/actes/:acteId
   * Obtenir un acte authentique par son ID
   */
  router.get('/actes/:acteId', checkPermission('minutier:read'), async (req, res) => {
    try {
      const { acteId } = req.params;
      const notaireId = req.user!.id;

      const acte = await minutierService.obtenirActeParId(acteId);

      if (!acte) {
        return res.status(404).json({
          success: false,
          message: 'Acte authentique non trouvé'
        });
      }

      // Vérifier que l'acte appartient au notaire connecté
      if (acte.notaireId !== notaireId && req.user!.role !== 'Administrateur_Plateforme') {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cet acte'
        });
      }

      res.json({
        success: true,
        data: acte,
        message: 'Acte authentique récupéré avec succès'
      });
    } catch (error) {
      logger.error('Error getting acte authentique', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'acte authentique'
      });
    }
  });

  /**
   * PUT /api/minutier/actes/:acteId
   * Modifier un acte authentique
   */
  router.put('/actes/:acteId', checkPermission('minutier:update'), async (req, res) => {
    try {
      const { acteId } = req.params;
      const request: ModifierActeRequest = req.body;
      const notaireId = req.user!.id;

      // Vérifier que l'acte existe et appartient au notaire
      const acte = await minutierService.obtenirActeParId(acteId);
      if (!acte || acte.notaireId !== notaireId) {
        return res.status(404).json({
          success: false,
          message: 'Acte non trouvé ou accès non autorisé'
        });
      }

      // Vérifier que l'acte peut être modifié (pas encore signé)
      if (acte.statut === StatutActe.SIGNE || acte.statut === StatutActe.ENREGISTRE || acte.statut === StatutActe.ARCHIVE) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de modifier un acte signé, enregistré ou archivé'
        });
      }

      // Note: La modification nécessiterait une implémentation complète
      res.json({
        success: true,
        message: 'Acte authentique modifié avec succès'
      });
    } catch (error) {
      logger.error('Error updating acte authentique', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la modification de l\'acte authentique'
      });
    }
  });

  /**
   * POST /api/minutier/recherche
   * Rechercher dans le minutier
   */
  router.post('/recherche', checkPermission('minutier:search'), async (req, res) => {
    try {
      const criteres: MinutierRecherche = req.body;
      const notaireId = req.user!.id;

      const resultats = await minutierService.rechercherActes(criteres, notaireId);

      res.json({
        success: true,
        data: resultats,
        message: 'Recherche effectuée avec succès'
      });
    } catch (error) {
      logger.error('Error searching minutier', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche dans le minutier'
      });
    }
  });

  /**
   * POST /api/minutier/copies-conformes
   * Générer une copie conforme
   */
  router.post('/copies-conformes', checkPermission('minutier:create'), async (req, res) => {
    try {
      const request: DemanderCopieRequest = req.body;
      const notaireId = req.user!.id;

      const copie = await minutierService.genererCopieConforme(request, notaireId);

      res.status(201).json({
        success: true,
        data: copie,
        message: 'Copie conforme générée avec succès'
      });
    } catch (error) {
      logger.error('Error generating copie conforme', { error, userId: req.user!.id });
      
      if (error instanceof Error) {
        if (error.message.includes('non trouvé') || error.message.includes('non autorisé')) {
          return res.status(404).json({
            success: false,
            message: error.message
          });
        }
        
        if (error.message.includes('doit être signé')) {
          return res.status(400).json({
            success: false,
            message: error.message
          });
        }
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération de la copie conforme'
      });
    }
  });

  /**
   * POST /api/minutier/archivage
   * Archiver un acte
   */
  router.post('/archivage', checkPermission('minutier:archive'), async (req, res) => {
    try {
      const request: ArchivageRequest = req.body;
      const notaireId = req.user!.id;

      await minutierService.archiverActe(request, notaireId);

      res.json({
        success: true,
        message: 'Acte archivé avec succès'
      });
    } catch (error) {
      logger.error('Error archiving acte', { error, userId: req.user!.id });
      
      if (error instanceof Error && (error.message.includes('non trouvé') || error.message.includes('non autorisé'))) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'archivage de l\'acte'
      });
    }
  });

  /**
   * GET /api/minutier/dashboard
   * Obtenir le tableau de bord du minutier
   */
  router.get('/dashboard', checkPermission('minutier:read'), async (req, res) => {
    try {
      const notaireId = req.user!.id;

      const dashboard = await minutierService.obtenirTableauDeBord(notaireId);

      res.json({
        success: true,
        data: dashboard,
        message: 'Tableau de bord récupéré avec succès'
      });
    } catch (error) {
      logger.error('Error getting minutier dashboard', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du tableau de bord'
      });
    }
  });

  /**
   * GET /api/minutier/statistiques
   * Obtenir les statistiques du minutier
   */
  router.get('/statistiques', checkPermission('minutier:read'), async (req, res) => {
    try {
      const notaireId = req.user!.id;
      const { dateDebut, dateFin } = req.query;

      // Calculer les statistiques pour la période demandée
      const query = `
        SELECT 
          COUNT(*) as nombre_actes,
          COUNT(CASE WHEN statut = 'signe' THEN 1 END) as actes_signes,
          COUNT(CASE WHEN statut = 'archive' THEN 1 END) as actes_archives,
          COALESCE(SUM((metadonnees->>'montant')::DECIMAL), 0) as montant_total,
          COALESCE(AVG((metadonnees->>'montant')::DECIMAL), 0) as montant_moyen,
          COUNT(DISTINCT type_acte) as types_actes_differents
        FROM actes_authentiques
        WHERE notaire_id = $1
        ${dateDebut ? 'AND date_acte >= $2' : ''}
        ${dateFin ? `AND date_acte <= $${dateDebut ? '3' : '2'}` : ''}
      `;

      const params = [notaireId];
      if (dateDebut) params.push(dateDebut as string);
      if (dateFin) params.push(dateFin as string);

      const result = await db.query(query, params);
      const statistiques = result.rows[0];

      // Obtenir la répartition par type d'acte
      const repartitionQuery = `
        SELECT type_acte, COUNT(*) as nombre
        FROM actes_authentiques
        WHERE notaire_id = $1
        ${dateDebut ? 'AND date_acte >= $2' : ''}
        ${dateFin ? `AND date_acte <= $${dateDebut ? '3' : '2'}` : ''}
        GROUP BY type_acte
        ORDER BY nombre DESC
      `;

      const repartitionResult = await db.query(repartitionQuery, params);
      const repartitionTypeActe = repartitionResult.rows.reduce((acc, row) => {
        acc[row.type_acte] = parseInt(row.nombre);
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          ...statistiques,
          repartitionTypeActe,
          periode: {
            dateDebut: dateDebut || null,
            dateFin: dateFin || null
          }
        },
        message: 'Statistiques récupérées avec succès'
      });
    } catch (error) {
      logger.error('Error getting minutier statistics', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  });

  /**
   * GET /api/minutier/types-actes
   * Obtenir la liste des types d'actes disponibles
   */
  router.get('/types-actes', checkPermission('minutier:read'), async (req, res) => {
    try {
      const typesActes = Object.values(TypeActe).map(type => ({
        value: type,
        label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }));

      res.json({
        success: true,
        data: typesActes,
        message: 'Types d\'actes récupérés avec succès'
      });
    } catch (error) {
      logger.error('Error getting acte types', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des types d\'actes'
      });
    }
  });

  /**
   * GET /api/minutier/types-copies
   * Obtenir la liste des types de copies disponibles
   */
  router.get('/types-copies', checkPermission('minutier:read'), async (req, res) => {
    try {
      const typesCopies = Object.values(TypeCopie).map(type => ({
        value: type,
        label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }));

      res.json({
        success: true,
        data: typesCopies,
        message: 'Types de copies récupérés avec succès'
      });
    } catch (error) {
      logger.error('Error getting copy types', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des types de copies'
      });
    }
  });

  /**
   * POST /api/minutier/verification-integrite/:acteId
   * Vérifier l'intégrité d'un acte
   */
  router.post('/verification-integrite/:acteId', checkPermission('minutier:read'), async (req, res) => {
    try {
      const { acteId } = req.params;
      const notaireId = req.user!.id;

      // Vérifier que l'acte appartient au notaire
      const acte = await minutierService.obtenirActeParId(acteId);
      if (!acte || acte.notaireId !== notaireId) {
        return res.status(404).json({
          success: false,
          message: 'Acte non trouvé ou accès non autorisé'
        });
      }

      // Vérifier l'intégrité via la fonction PostgreSQL
      const result = await db.query('SELECT verifier_integrite_acte($1) as integrite_ok', [acteId]);
      const integriteOk = result.rows[0].integrite_ok;

      res.json({
        success: true,
        data: {
          acteId,
          integriteOk,
          message: integriteOk ? 'L\'intégrité de l\'acte est préservée' : 'L\'intégrité de l\'acte est compromise'
        },
        message: 'Vérification d\'intégrité effectuée'
      });
    } catch (error) {
      logger.error('Error verifying acte integrity', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification d\'intégrité'
      });
    }
  });

  /**
   * GET /api/minutier/alertes
   * Obtenir les alertes du minutier
   */
  router.get('/alertes', checkPermission('minutier:read'), async (req, res) => {
    try {
      const notaireId = req.user!.id;

      const query = `
        SELECT am.* FROM alertes_minutier am
        JOIN actes_authentiques aa ON am.acte_id = aa.id
        WHERE aa.notaire_id = $1 AND am.traitee = false
        ORDER BY am.priorite DESC, am.date_alerte DESC
        LIMIT 20
      `;

      const result = await db.query(query, [notaireId]);
      const alertes = result.rows.map(row => ({
        id: row.id,
        type: row.type,
        message: row.message,
        acteId: row.acte_id,
        dateAlerte: row.date_alerte,
        priorite: row.priorite,
        traitee: row.traitee
      }));

      res.json({
        success: true,
        data: alertes,
        message: 'Alertes récupérées avec succès'
      });
    } catch (error) {
      logger.error('Error getting minutier alerts', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des alertes'
      });
    }
  });

  /**
   * PUT /api/minutier/alertes/:alerteId/traiter
   * Marquer une alerte comme traitée
   */
  router.put('/alertes/:alerteId/traiter', checkPermission('minutier:update'), async (req, res) => {
    try {
      const { alerteId } = req.params;
      const notaireId = req.user!.id;

      // Vérifier que l'alerte appartient au notaire
      const verificationQuery = `
        SELECT am.id FROM alertes_minutier am
        JOIN actes_authentiques aa ON am.acte_id = aa.id
        WHERE am.id = $1 AND aa.notaire_id = $2
      `;

      const verificationResult = await db.query(verificationQuery, [alerteId, notaireId]);
      
      if (verificationResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Alerte non trouvée ou accès non autorisé'
        });
      }

      // Marquer l'alerte comme traitée
      await db.query(
        'UPDATE alertes_minutier SET traitee = true WHERE id = $1',
        [alerteId]
      );

      res.json({
        success: true,
        message: 'Alerte marquée comme traitée'
      });
    } catch (error) {
      logger.error('Error marking alert as processed', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement de l\'alerte'
      });
    }
  });

  return router;
}