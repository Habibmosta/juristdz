import { Pool } from 'pg';
import { MinutierService } from '../services/minutierService.js';
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

// Mock database
const mockDb = {
  connect: jest.fn(),
  query: jest.fn(),
} as unknown as Pool;

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

describe('MinutierService', () => {
  let minutierService: MinutierService;

  beforeEach(() => {
    minutierService = new MinutierService(mockDb);
    jest.clearAllMocks();
    
    (mockDb.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  describe('creerActe', () => {
    const mockRequest: CreerActeRequest = {
      typeActe: TypeActe.VENTE_IMMOBILIERE,
      objet: 'Vente d\'un appartement',
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
        }
      ],
      contenu: {
        preambule: 'Par devant nous...',
        comparution: 'Ont comparu...',
        expose: 'Exposé des faits...',
        dispositif: 'Il a été convenu...',
        clauses: [],
        mentions: [],
        conclusion: 'En foi de quoi...'
      },
      metadonnees: {
        mots_cles: ['vente', 'immobilier'],
        references_legales: ['Code civil art. 1582'],
        montant: 150000,
        devise: 'DZD'
      }
    };

    it('should create a new acte authentique successfully', async () => {
      const notaireId = 'notaire-123';
      const mockActeId = 'acte-123';
      
      // Mock database responses
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ prochain_numero: 1 }] }) // genererNumeroMinutier
        .mockResolvedValueOnce({ rows: [{ prochain_numero: 1 }] }) // genererNumeroRepertoire
        .mockResolvedValueOnce({ rows: [{ prochain_numero: 1 }] }) // genererNumeroArchive
        .mockResolvedValueOnce({ rows: [{ id: mockActeId }] }) // INSERT acte
        .mockResolvedValueOnce({ rows: [] }) // INSERT archivage
        .mockResolvedValueOnce({ rows: [] }) // INSERT sauvegarde 1
        .mockResolvedValueOnce({ rows: [] }); // INSERT sauvegarde 2

      // Mock obtenirActeParId
      jest.spyOn(minutierService, 'obtenirActeParId').mockResolvedValue({
        id: mockActeId,
        numeroMinutier: '2024-000001',
        numeroRepertoire: 'REP-2024-0001',
        dateActe: new Date(),
        typeActe: TypeActe.VENTE_IMMOBILIERE,
        objet: mockRequest.objet,
        parties: mockRequest.parties,
        notaireId,
        etude: {
          id: notaireId,
          nom: 'Étude Test',
          adresse: mockRequest.parties[0].adresse,
          telephone: '',
          email: '',
          numeroAgrement: '',
          chambreNotaires: ''
        },
        contenu: mockRequest.contenu,
        signatures: [],
        annexes: [],
        statut: StatutActe.BROUILLON,
        hashIntegrite: 'hash123',
        chiffrementCle: 'key123',
        metadonnees: mockRequest.metadonnees,
        archivage: {
          numeroArchive: 'ARC-2024-000001',
          emplacementNumerique: '/archives/numeriques/2024/ARC-2024-000001',
          dureeConservation: 30,
          statutArchivage: 'actif',
          sauvegardes: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      const result = await minutierService.creerActe(mockRequest, notaireId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockActeId);
      expect(result.typeActe).toBe(TypeActe.VENTE_IMMOBILIERE);
      expect(result.statut).toBe(StatutActe.BROUILLON);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should rollback transaction on error', async () => {
      const notaireId = 'notaire-123';
      
      mockClient.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(minutierService.creerActe(mockRequest, notaireId))
        .rejects.toThrow('Database error');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('rechercherActes', () => {
    it('should search actes with basic criteria', async () => {
      const notaireId = 'notaire-123';
      const criteres: MinutierRecherche = {
        typeActe: TypeActe.VENTE_IMMOBILIERE,
        dateDebut: new Date('2024-01-01'),
        dateFin: new Date('2024-12-31'),
        page: 1,
        limite: 10
      };

      const mockActes = [
        {
          id: 'acte-1',
          numero_minutier: '2024-000001',
          type_acte: TypeActe.VENTE_IMMOBILIERE,
          objet: 'Vente appartement',
          parties: JSON.stringify([]),
          metadonnees: JSON.stringify({}),
          statut: StatutActe.SIGNE,
          created_at: new Date(),
          updated_at: new Date(),
          total_count: '1'
        }
      ];

      (mockDb.query as jest.Mock).mockResolvedValue({ rows: mockActes });

      const result = await minutierService.rechercherActes(criteres, notaireId);

      expect(result).toBeDefined();
      expect(result.actes).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle empty search results', async () => {
      const notaireId = 'notaire-123';
      const criteres: MinutierRecherche = {
        objet: 'inexistant'
      };

      (mockDb.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await minutierService.rechercherActes(criteres, notaireId);

      expect(result.actes).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('genererCopieConforme', () => {
    const mockRequest: DemanderCopieRequest = {
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
      const notaireId = 'notaire-123';
      const mockCopieId = 'copie-123';

      // Mock acte existant et signé
      jest.spyOn(minutierService, 'obtenirActeParId').mockResolvedValue({
        id: 'acte-123',
        notaireId,
        statut: StatutActe.SIGNE,
        contenu: {
          preambule: 'Par devant nous...',
          comparution: 'Ont comparu...',
          expose: 'Exposé des faits...',
          dispositif: 'Il a été convenu...',
          clauses: [],
          mentions: [],
          conclusion: 'En foi de quoi...'
        }
      } as any);

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ prochain_numero: 1 }] }) // genererNumeroCopie
        .mockResolvedValueOnce({ rows: [{ id: mockCopieId }] }) // INSERT copie
        .mockResolvedValueOnce({ rows: [] }) // signerCopieConforme
        .mockResolvedValueOnce({ rows: [] }); // appliquerCachetsNotariaux

      // Mock obtenirCopieParId
      jest.spyOn(minutierService, 'obtenirCopieParId' as any).mockResolvedValue({
        id: mockCopieId,
        acteId: 'acte-123',
        typeCopie: TypeCopie.COPIE_CONFORME,
        numeroCopie: 'COPIE_CONFORME-001'
      });

      const result = await minutierService.genererCopieConforme(mockRequest, notaireId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockCopieId);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should reject if acte is not signed', async () => {
      const notaireId = 'notaire-123';

      jest.spyOn(minutierService, 'obtenirActeParId').mockResolvedValue({
        id: 'acte-123',
        notaireId,
        statut: StatutActe.BROUILLON
      } as any);

      await expect(minutierService.genererCopieConforme(mockRequest, notaireId))
        .rejects.toThrow('L\'acte doit être signé pour générer une copie conforme');
    });

    it('should reject if acte does not belong to notaire', async () => {
      const notaireId = 'notaire-123';

      jest.spyOn(minutierService, 'obtenirActeParId').mockResolvedValue({
        id: 'acte-123',
        notaireId: 'autre-notaire',
        statut: StatutActe.SIGNE
      } as any);

      await expect(minutierService.genererCopieConforme(mockRequest, notaireId))
        .rejects.toThrow('Acte non trouvé ou accès non autorisé');
    });
  });

  describe('archiverActe', () => {
    const mockRequest: ArchivageRequest = {
      acteId: 'acte-123',
      emplacementPhysique: 'Armoire A, Étagère 3',
      dureeConservation: 30,
      typesSauvegarde: [TypeSauvegarde.LOCALE, TypeSauvegarde.CLOUD]
    };

    it('should archive acte successfully', async () => {
      const notaireId = 'notaire-123';

      jest.spyOn(minutierService, 'obtenirActeParId').mockResolvedValue({
        id: 'acte-123',
        notaireId,
        statut: StatutActe.SIGNE
      } as any);

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // UPDATE statut acte
        .mockResolvedValueOnce({ rows: [] }) // UPDATE archivage_info
        .mockResolvedValueOnce({ rows: [] }) // INSERT sauvegarde 1
        .mockResolvedValueOnce({ rows: [] }); // INSERT sauvegarde 2

      await minutierService.archiverActe(mockRequest, notaireId);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should reject if acte does not exist', async () => {
      const notaireId = 'notaire-123';

      jest.spyOn(minutierService, 'obtenirActeParId').mockResolvedValue(null);

      await expect(minutierService.archiverActe(mockRequest, notaireId))
        .rejects.toThrow('Acte non trouvé ou accès non autorisé');
    });
  });

  describe('obtenirTableauDeBord', () => {
    it('should return dashboard data', async () => {
      const notaireId = 'notaire-123';

      // Mock all dashboard methods
      jest.spyOn(minutierService, 'obtenirStatistiques' as any).mockResolvedValue({
        notaireId,
        periode: { dateDebut: new Date(), dateFin: new Date() },
        nombreActes: 10,
        repartitionTypeActe: {},
        montantTotal: 1000000,
        montantMoyen: 100000,
        nombreCopies: 5,
        evolutionMensuelle: [],
        topClients: []
      });

      jest.spyOn(minutierService, 'obtenirActesRecents' as any).mockResolvedValue([]);
      jest.spyOn(minutierService, 'obtenirActesEnCours' as any).mockResolvedValue([]);
      jest.spyOn(minutierService, 'obtenirCopiesEnAttente' as any).mockResolvedValue([]);
      jest.spyOn(minutierService, 'obtenirAlertes' as any).mockResolvedValue([]);

      const result = await minutierService.obtenirTableauDeBord(notaireId);

      expect(result).toBeDefined();
      expect(result.statistiques).toBeDefined();
      expect(result.actesRecents).toBeDefined();
      expect(result.actesEnCours).toBeDefined();
      expect(result.copiesEnAttente).toBeDefined();
      expect(result.alertes).toBeDefined();
    });
  });

  describe('obtenirActeParId', () => {
    it('should return acte with decrypted content', async () => {
      const acteId = 'acte-123';
      const mockRow = {
        id: acteId,
        numero_minutier: '2024-000001',
        numero_repertoire: 'REP-2024-0001',
        date_acte: new Date(),
        type_acte: TypeActe.VENTE_IMMOBILIERE,
        objet: 'Vente appartement',
        parties: JSON.stringify([]),
        notaire_id: 'notaire-123',
        contenu_chiffre: 'encrypted_content',
        hash_integrite: 'hash123',
        chiffrement_cle: 'key123',
        metadonnees: JSON.stringify({}),
        statut: StatutActe.SIGNE,
        numero_archive: 'ARC-2024-000001',
        created_at: new Date(),
        updated_at: new Date()
      };

      (mockDb.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

      // Mock decryption and integrity check
      jest.spyOn(minutierService, 'dechiffrerContenu' as any).mockReturnValue('{"preambule": "Par devant nous..."}');
      jest.spyOn(minutierService, 'verifierIntegrite' as any).mockResolvedValue(true);

      const result = await minutierService.obtenirActeParId(acteId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(acteId);
      expect(result!.numeroMinutier).toBe('2024-000001');
    });

    it('should return null if acte not found', async () => {
      const acteId = 'inexistant';

      (mockDb.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await minutierService.obtenirActeParId(acteId);

      expect(result).toBeNull();
    });
  });
});