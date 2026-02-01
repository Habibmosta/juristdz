import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { createMinutierRoutes } from '../routes/minutier.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import {
  CreerActeRequest,
  TypeActe,
  StatutActe,
  TypeCopie,
  DemanderCopieRequest,
  ArchivageRequest,
  TypeSauvegarde,
  MinutierRecherche
} from '../types/minutier.js';

// Mock dependencies
jest.mock('../middleware/auth.js');
jest.mock('../middleware/rbacMiddleware.js');
jest.mock('../services/minutierService.js');

const mockDb = {
  query: jest.fn(),
} as unknown as Pool;

const mockUser = {
  id: 'notaire-123',
  role: 'Notaire',
  email: 'notaire@test.com'
};

describe('Minutier Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });
    
    // Mock RBAC middleware
    (checkPermission as jest.Mock).mockImplementation(() => (req: any, res: any, next: any) => next());
    
    // Setup routes
    app.use('/api/minutier', createMinutierRoutes(mockDb));
    
    jest.clearAllMocks();
  });

  describe('POST /api/minutier/actes', () => {
    const validActeRequest: CreerActeRequest = {
      typeActe: TypeActe.VENTE_IMMOBILIERE,
      objet: 'Vente d\'un appartement situé à Alger',
      parties: [
        {
          type: 'personne_physique',
          civilite: 'monsieur',
          nom: 'Dupont',
          prenom: 'Jean',
          nationalite: 'Française',
          adresse: {
            rue: '123 Rue de la Paix',
            ville: 'Alger',
            codePostal: '16000',
            wilaya: 'Alger',
            pays: 'Algérie'
          },
          pieceIdentite: {
            type: 'carte_identite',
            numero: '123456789',
            dateDelivrance: new Date('2020-01-01'),
            lieuDelivrance: 'Alger'
          },
          qualite: 'vendeur'
        },
        {
          type: 'personne_physique',
          civilite: 'madame',
          nom: 'Martin',
          prenom: 'Marie',
          nationalite: 'Française',
          adresse: {
            rue: '456 Avenue de la République',
            ville: 'Alger',
            codePostal: '16000',
            wilaya: 'Alger',
            pays: 'Algérie'
          },
          pieceIdentite: {
            type: 'carte_identite',
            numero: '987654321',
            dateDelivrance: new Date('2020-01-01'),
            lieuDelivrance: 'Alger'
          },
          qualite: 'acquereur'
        }
      ],
      contenu: {
        preambule: 'Par devant nous, Maître [Nom du Notaire], notaire à [Ville]',
        comparution: 'Ont comparu les parties ci-après désignées',
        expose: 'Le vendeur déclare être propriétaire de l\'immeuble décrit ci-après',
        dispositif: 'Le vendeur vend et l\'acquéreur achète l\'immeuble suivant',
        clauses: [
          {
            id: 'clause-1',
            type: 'prix',
            titre: 'Prix de vente',
            contenu: 'Le prix de vente est fixé à la somme de 150.000 DZD',
            ordre: 1,
            obligatoire: true
          }
        ],
        mentions: [
          {
            id: 'mention-1',
            type: 'lecture',
            contenu: 'Lecture faite, les parties ont signé',
            obligatoire: true
          }
        ],
        conclusion: 'En foi de quoi nous avons dressé le présent acte'
      },
      metadonnees: {
        mots_cles: ['vente', 'immobilier', 'appartement'],
        references_legales: ['Code civil art. 1582', 'Code civil art. 1583'],
        montant: 150000,
        devise: 'DZD',
        superficie: 85,
        localisation: 'Alger Centre',
        numero_parcelle: 'P123456',
        references_cadastrales: ['Section A, Parcelle 123']
      }
    };

    it('should create acte authentique successfully', async () => {
      const mockActe = {
        id: 'acte-123',
        numeroMinutier: '2024-000001',
        numeroRepertoire: 'REP-2024-0001',
        dateActe: new Date(),
        typeActe: TypeActe.VENTE_IMMOBILIERE,
        objet: validActeRequest.objet,
        parties: validActeRequest.parties,
        notaireId: mockUser.id,
        statut: StatutActe.BROUILLON,
        hashIntegrite: 'hash123',
        chiffrementCle: 'key123',
        metadonnees: validActeRequest.metadonnees,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock MinutierService.creerActe
      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.creerActe = jest.fn().mockResolvedValue(mockActe);

      const response = await request(app)
        .post('/api/minutier/actes')
        .send(validActeRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expect.objectContaining({
        id: mockActe.id,
        numeroMinutier: mockActe.numeroMinutier,
        typeActe: mockActe.typeActe
      }));
      expect(response.body.message).toBe('Acte authentique créé avec succès');
    });

    it('should reject non-notaire users', async () => {
      // Mock non-notaire user
      (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
        req.user = { ...mockUser, role: 'Avocat' };
        next();
      });

      const response = await request(app)
        .post('/api/minutier/actes')
        .send(validActeRequest)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Seuls les notaires peuvent créer des actes authentiques');
    });

    it('should handle service errors gracefully', async () => {
      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.creerActe = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/minutier/actes')
        .send(validActeRequest)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erreur lors de la création de l\'acte authentique');
    });
  });

  describe('GET /api/minutier/actes/:acteId', () => {
    it('should retrieve acte authentique successfully', async () => {
      const acteId = 'acte-123';
      const mockActe = {
        id: acteId,
        numeroMinutier: '2024-000001',
        notaireId: mockUser.id,
        typeActe: TypeActe.VENTE_IMMOBILIERE,
        statut: StatutActe.SIGNE
      };

      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.obtenirActeParId = jest.fn().mockResolvedValue(mockActe);

      const response = await request(app)
        .get(`/api/minutier/actes/${acteId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(acteId);
    });

    it('should return 404 for non-existent acte', async () => {
      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.obtenirActeParId = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/minutier/actes/inexistant')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Acte authentique non trouvé');
    });

    it('should reject access to acte from different notaire', async () => {
      const mockActe = {
        id: 'acte-123',
        notaireId: 'autre-notaire',
        typeActe: TypeActe.VENTE_IMMOBILIERE
      };

      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.obtenirActeParId = jest.fn().mockResolvedValue(mockActe);

      const response = await request(app)
        .get('/api/minutier/actes/acte-123')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Accès non autorisé à cet acte');
    });
  });

  describe('POST /api/minutier/recherche', () => {
    it('should search actes with criteria', async () => {
      const searchCriteria: MinutierRecherche = {
        typeActe: TypeActe.VENTE_IMMOBILIERE,
        dateDebut: new Date('2024-01-01'),
        dateFin: new Date('2024-12-31'),
        page: 1,
        limite: 10
      };

      const mockResults = {
        actes: [
          {
            id: 'acte-1',
            numeroMinutier: '2024-000001',
            typeActe: TypeActe.VENTE_IMMOBILIERE,
            objet: 'Vente appartement',
            statut: StatutActe.SIGNE
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1,
        facettes: []
      };

      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.rechercherActes = jest.fn().mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/api/minutier/recherche')
        .send(searchCriteria)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.actes).toHaveLength(1);
      expect(response.body.data.total).toBe(1);
    });

    it('should handle empty search results', async () => {
      const mockResults = {
        actes: [],
        total: 0,
        page: 1,
        totalPages: 0,
        facettes: []
      };

      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.rechercherActes = jest.fn().mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/api/minutier/recherche')
        .send({ objet: 'inexistant' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.actes).toHaveLength(0);
    });
  });

  describe('POST /api/minutier/copies-conformes', () => {
    const validCopieRequest: DemanderCopieRequest = {
      acteId: 'acte-123',
      typeCopie: TypeCopie.COPIE_CONFORME,
      demandeur: {
        nom: 'Martin',
        prenom: 'Pierre',
        qualite: 'acquéreur',
        adresse: {
          rue: '456 Avenue de la République',
          ville: 'Alger',
          codePostal: '16000',
          wilaya: 'Alger',
          pays: 'Algérie'
        },
        pieceIdentite: {
          type: 'carte_identite',
          numero: '987654321',
          dateDelivrance: new Date('2020-01-01'),
          lieuDelivrance: 'Alger'
        },
        motifDemande: 'Besoin pour démarches administratives'
      },
      motifDemande: 'Démarches administratives'
    };

    it('should generate copie conforme successfully', async () => {
      const mockCopie = {
        id: 'copie-123',
        acteId: 'acte-123',
        typeCopie: TypeCopie.COPIE_CONFORME,
        numeroCopie: 'COPIE_CONFORME-001',
        dateGeneration: new Date(),
        validiteJuridique: true
      };

      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.genererCopieConforme = jest.fn().mockResolvedValue(mockCopie);

      const response = await request(app)
        .post('/api/minutier/copies-conformes')
        .send(validCopieRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockCopie.id);
      expect(response.body.message).toBe('Copie conforme générée avec succès');
    });

    it('should handle acte not found error', async () => {
      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.genererCopieConforme = jest.fn()
        .mockRejectedValue(new Error('Acte non trouvé ou accès non autorisé'));

      const response = await request(app)
        .post('/api/minutier/copies-conformes')
        .send(validCopieRequest)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Acte non trouvé ou accès non autorisé');
    });

    it('should handle unsigned acte error', async () => {
      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.genererCopieConforme = jest.fn()
        .mockRejectedValue(new Error('L\'acte doit être signé pour générer une copie conforme'));

      const response = await request(app)
        .post('/api/minutier/copies-conformes')
        .send(validCopieRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('L\'acte doit être signé pour générer une copie conforme');
    });
  });

  describe('POST /api/minutier/archivage', () => {
    const validArchivageRequest: ArchivageRequest = {
      acteId: 'acte-123',
      emplacementPhysique: 'Armoire A, Étagère 3',
      dureeConservation: 30,
      typesSauvegarde: [TypeSauvegarde.LOCALE, TypeSauvegarde.CLOUD]
    };

    it('should archive acte successfully', async () => {
      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.archiverActe = jest.fn().mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/minutier/archivage')
        .send(validArchivageRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Acte archivé avec succès');
    });

    it('should handle acte not found during archiving', async () => {
      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.archiverActe = jest.fn()
        .mockRejectedValue(new Error('Acte non trouvé ou accès non autorisé'));

      const response = await request(app)
        .post('/api/minutier/archivage')
        .send(validArchivageRequest)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Acte non trouvé ou accès non autorisé');
    });
  });

  describe('GET /api/minutier/dashboard', () => {
    it('should return dashboard data', async () => {
      const mockDashboard = {
        statistiques: {
          notaireId: mockUser.id,
          periode: { dateDebut: new Date(), dateFin: new Date() },
          nombreActes: 10,
          repartitionTypeActe: { [TypeActe.VENTE_IMMOBILIERE]: 5 },
          montantTotal: 1000000,
          montantMoyen: 100000,
          nombreCopies: 3,
          evolutionMensuelle: [],
          topClients: []
        },
        actesRecents: [],
        actesEnCours: [],
        copiesEnAttente: [],
        alertes: []
      };

      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.obtenirTableauDeBord = jest.fn().mockResolvedValue(mockDashboard);

      const response = await request(app)
        .get('/api/minutier/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statistiques).toBeDefined();
      expect(response.body.data.actesRecents).toBeDefined();
    });
  });

  describe('GET /api/minutier/statistiques', () => {
    it('should return minutier statistics', async () => {
      const mockStats = {
        nombre_actes: '10',
        actes_signes: '8',
        actes_archives: '5',
        montant_total: '1000000',
        montant_moyen: '100000',
        types_actes_differents: '3'
      };

      const mockRepartition = [
        { type_acte: TypeActe.VENTE_IMMOBILIERE, nombre: '5' },
        { type_acte: TypeActe.DONATION, nombre: '3' },
        { type_acte: TypeActe.SUCCESSION, nombre: '2' }
      ];

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockStats] })
        .mockResolvedValueOnce({ rows: mockRepartition });

      const response = await request(app)
        .get('/api/minutier/statistiques')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nombre_actes).toBe('10');
      expect(response.body.data.repartitionTypeActe).toBeDefined();
    });

    it('should handle date range filters', async () => {
      const mockStats = { nombre_actes: '5' };
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockStats] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/minutier/statistiques')
        .query({
          dateDebut: '2024-01-01',
          dateFin: '2024-12-31'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.periode.dateDebut).toBe('2024-01-01');
      expect(response.body.data.periode.dateFin).toBe('2024-12-31');
    });
  });

  describe('GET /api/minutier/types-actes', () => {
    it('should return available acte types', async () => {
      const response = await request(app)
        .get('/api/minutier/types-actes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const firstType = response.body.data[0];
      expect(firstType).toHaveProperty('value');
      expect(firstType).toHaveProperty('label');
    });
  });

  describe('GET /api/minutier/types-copies', () => {
    it('should return available copy types', async () => {
      const response = await request(app)
        .get('/api/minutier/types-copies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const firstType = response.body.data[0];
      expect(firstType).toHaveProperty('value');
      expect(firstType).toHaveProperty('label');
    });
  });

  describe('POST /api/minutier/verification-integrite/:acteId', () => {
    it('should verify acte integrity', async () => {
      const acteId = 'acte-123';
      const mockActe = {
        id: acteId,
        notaireId: mockUser.id
      };

      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.obtenirActeParId = jest.fn().mockResolvedValue(mockActe);

      (mockDb.query as jest.Mock).mockResolvedValue({ 
        rows: [{ integrite_ok: true }] 
      });

      const response = await request(app)
        .post(`/api/minutier/verification-integrite/${acteId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.integriteOk).toBe(true);
      expect(response.body.data.message).toContain('préservée');
    });

    it('should detect compromised integrity', async () => {
      const acteId = 'acte-123';
      const mockActe = {
        id: acteId,
        notaireId: mockUser.id
      };

      const { MinutierService } = require('../services/minutierService.js');
      MinutierService.prototype.obtenirActeParId = jest.fn().mockResolvedValue(mockActe);

      (mockDb.query as jest.Mock).mockResolvedValue({ 
        rows: [{ integrite_ok: false }] 
      });

      const response = await request(app)
        .post(`/api/minutier/verification-integrite/${acteId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.integriteOk).toBe(false);
      expect(response.body.data.message).toContain('compromise');
    });
  });

  describe('GET /api/minutier/alertes', () => {
    it('should return minutier alerts', async () => {
      const mockAlertes = [
        {
          id: 'alerte-1',
          type: 'signature_manquante',
          message: 'Signature manquante pour l\'acte 2024-000001',
          acte_id: 'acte-123',
          date_alerte: new Date(),
          priorite: 'haute',
          traitee: false
        }
      ];

      (mockDb.query as jest.Mock).mockResolvedValue({ rows: mockAlertes });

      const response = await request(app)
        .get('/api/minutier/alertes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('signature_manquante');
    });
  });

  describe('PUT /api/minutier/alertes/:alerteId/traiter', () => {
    it('should mark alert as processed', async () => {
      const alerteId = 'alerte-123';

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: alerteId }] }) // verification
        .mockResolvedValueOnce({ rows: [] }); // update

      const response = await request(app)
        .put(`/api/minutier/alertes/${alerteId}/traiter`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Alerte marquée comme traitée');
    });

    it('should handle non-existent alert', async () => {
      const alerteId = 'inexistant';

      (mockDb.query as jest.Mock).mockResolvedValue({ rows: [] });

      const response = await request(app)
        .put(`/api/minutier/alertes/${alerteId}/traiter`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Alerte non trouvée ou accès non autorisé');
    });
  });
});