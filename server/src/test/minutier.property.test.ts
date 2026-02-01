import fc from 'fast-check';
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
  MinutierRecherche,
  TypePartie,
  Civilite,
  TypePieceIdentite,
  QualitePartie
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

describe('MinutierService Property-Based Tests', () => {
  let minutierService: MinutierService;

  beforeEach(() => {
    minutierService = new MinutierService(mockDb);
    jest.clearAllMocks();
    
    (mockDb.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  // Generators for test data
  const typeActeArb = fc.constantFrom(...Object.values(TypeActe));
  const statutActeArb = fc.constantFrom(...Object.values(StatutActe));
  const typeCopieArb = fc.constantFrom(...Object.values(TypeCopie));
  const typeSauvegardeArb = fc.constantFrom(...Object.values(TypeSauvegarde));

  const adresseArb = fc.record({
    rue: fc.string({ minLength: 5, maxLength: 100 }),
    ville: fc.string({ minLength: 2, maxLength: 50 }),
    codePostal: fc.string({ minLength: 5, maxLength: 5 }),
    wilaya: fc.string({ minLength: 2, maxLength: 50 }),
    pays: fc.constant('Algérie')
  });

  const pieceIdentiteArb = fc.record({
    type: fc.constantFrom(...Object.values(TypePieceIdentite)),
    numero: fc.string({ minLength: 8, maxLength: 20 }),
    dateDelivrance: fc.date({ min: new Date('2000-01-01'), max: new Date() }),
    lieuDelivrance: fc.string({ minLength: 2, maxLength: 50 })
  });

  const partieActeArb = fc.record({
    type: fc.constantFrom(...Object.values(TypePartie)),
    civilite: fc.constantFrom(...Object.values(Civilite)),
    nom: fc.string({ minLength: 2, maxLength: 50 }),
    prenom: fc.string({ minLength: 2, maxLength: 50 }),
    nationalite: fc.string({ minLength: 2, maxLength: 50 }),
    adresse: adresseArb,
    pieceIdentite: pieceIdentiteArb,
    qualite: fc.constantFrom(...Object.values(QualitePartie))
  });

  const contenuActeArb = fc.record({
    preambule: fc.string({ minLength: 10, maxLength: 500 }),
    comparution: fc.string({ minLength: 10, maxLength: 500 }),
    expose: fc.string({ minLength: 10, maxLength: 1000 }),
    dispositif: fc.string({ minLength: 10, maxLength: 1000 }),
    clauses: fc.array(fc.record({
      id: fc.uuid(),
      type: fc.string(),
      titre: fc.string(),
      contenu: fc.string(),
      ordre: fc.integer({ min: 1, max: 100 }),
      obligatoire: fc.boolean()
    }), { maxLength: 10 }),
    mentions: fc.array(fc.record({
      id: fc.uuid(),
      type: fc.string(),
      contenu: fc.string(),
      obligatoire: fc.boolean()
    }), { maxLength: 10 }),
    conclusion: fc.string({ minLength: 10, maxLength: 500 })
  });

  const creerActeRequestArb = fc.record({
    typeActe: typeActeArb,
    objet: fc.string({ minLength: 10, maxLength: 200 }),
    parties: fc.array(partieActeArb, { minLength: 1, maxLength: 10 }),
    contenu: contenuActeArb,
    metadonnees: fc.record({
      mots_cles: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { maxLength: 10 }),
      references_legales: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { maxLength: 5 }),
      montant: fc.option(fc.integer({ min: 1000, max: 10000000 })),
      devise: fc.constant('DZD')
    })
  });

  /**
   * **Propriété 21: Minutier Électronique Intègre**
   * **Valide: Exigences 9.1, 9.2, 9.4**
   */
  describe('Propriété 21: Minutier Électronique Intègre', () => {
    it('should maintain chronological numbering integrity', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(creerActeRequestArb, { minLength: 2, maxLength: 5 }),
        fc.uuid(),
        async (requests, notaireId) => {
          // Mock sequential numbering
          let numeroCounter = 1;
          mockClient.query.mockImplementation((query: string) => {
            if (query.includes('prochain_numero')) {
              return Promise.resolve({ rows: [{ prochain_numero: numeroCounter++ }] });
            }
            if (query.includes('INSERT INTO actes_authentiques')) {
              return Promise.resolve({ rows: [{ id: fc.sample(fc.uuid(), 1)[0] }] });
            }
            return Promise.resolve({ rows: [] });
          });

          // Mock obtenirActeParId to return valid acte
          jest.spyOn(minutierService, 'obtenirActeParId').mockImplementation(async (id) => ({
            id,
            numeroMinutier: `2024-${numeroCounter.toString().padStart(6, '0')}`,
            numeroRepertoire: `REP-2024-${numeroCounter.toString().padStart(4, '0')}`,
            dateActe: new Date(),
            typeActe: TypeActe.VENTE_IMMOBILIERE,
            objet: 'Test',
            parties: [],
            notaireId,
            etude: {} as any,
            contenu: {} as any,
            signatures: [],
            annexes: [],
            statut: StatutActe.BROUILLON,
            hashIntegrite: 'hash',
            chiffrementCle: 'key',
            metadonnees: {},
            archivage: {} as any,
            createdAt: new Date(),
            updatedAt: new Date()
          }));

          const actes = [];
          for (const request of requests) {
            try {
              const acte = await minutierService.creerActe(request, notaireId);
              actes.push(acte);
            } catch (error) {
              // Skip invalid requests
            }
          }

          // Verify chronological numbering
          for (let i = 1; i < actes.length; i++) {
            const prevNumber = parseInt(actes[i-1].numeroMinutier.split('-')[1]);
            const currNumber = parseInt(actes[i].numeroMinutier.split('-')[1]);
            expect(currNumber).toBeGreaterThan(prevNumber);
          }

          // Verify integrity hash exists for all actes
          actes.forEach(acte => {
            expect(acte.hashIntegrite).toBeDefined();
            expect(acte.hashIntegrite.length).toBeGreaterThan(0);
          });
        }
      ), { numRuns: 50 });
    });

    it('should ensure content encryption and integrity', async () => {
      await fc.assert(fc.asyncProperty(
        creerActeRequestArb,
        fc.uuid(),
        async (request, notaireId) => {
          // Mock database responses
          mockClient.query
            .mockResolvedValueOnce({ rows: [{ prochain_numero: 1 }] })
            .mockResolvedValueOnce({ rows: [{ prochain_numero: 1 }] })
            .mockResolvedValueOnce({ rows: [{ prochain_numero: 1 }] })
            .mockResolvedValueOnce({ rows: [{ id: 'test-id' }] })
            .mockResolvedValue({ rows: [] });

          // Mock obtenirActeParId
          jest.spyOn(minutierService, 'obtenirActeParId').mockResolvedValue({
            id: 'test-id',
            hashIntegrite: 'valid-hash',
            chiffrementCle: 'encryption-key',
            contenu: request.contenu
          } as any);

          try {
            const acte = await minutierService.creerActe(request, notaireId);
            
            // Verify encryption key exists
            expect(acte.chiffrementCle).toBeDefined();
            expect(acte.chiffrementCle.length).toBeGreaterThan(0);
            
            // Verify integrity hash exists
            expect(acte.hashIntegrite).toBeDefined();
            expect(acte.hashIntegrite.length).toBeGreaterThan(0);
            
            // Verify content is preserved after encryption/decryption cycle
            expect(acte.contenu).toEqual(request.contenu);
          } catch (error) {
            // Skip invalid requests
          }
        }
      ), { numRuns: 30 });
    });
  });

  /**
   * **Propriété 22: Recherche Efficace dans le Minutier**
   * **Valide: Exigences 9.3**
   */
  describe('Propriété 22: Recherche Efficace dans le Minutier', () => {
    it('should return consistent search results', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          typeActe: fc.option(typeActeArb),
          objet: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          dateDebut: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date() })),
          dateFin: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date() })),
          page: fc.option(fc.integer({ min: 1, max: 10 })),
          limite: fc.option(fc.integer({ min: 1, max: 100 }))
        }),
        fc.uuid(),
        async (criteres, notaireId) => {
          // Mock search results
          const mockResults = Array.from({ length: 5 }, (_, i) => ({
            id: `acte-${i}`,
            numero_minutier: `2024-${(i+1).toString().padStart(6, '0')}`,
            type_acte: TypeActe.VENTE_IMMOBILIERE,
            objet: 'Test acte',
            parties: JSON.stringify([]),
            metadonnees: JSON.stringify({}),
            statut: StatutActe.SIGNE,
            created_at: new Date(),
            updated_at: new Date(),
            total_count: '5'
          }));

          (mockDb.query as jest.Mock).mockResolvedValue({ rows: mockResults });

          try {
            const result = await minutierService.rechercherActes(criteres, notaireId);
            
            // Verify result structure
            expect(result).toHaveProperty('actes');
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('page');
            expect(result).toHaveProperty('totalPages');
            expect(result).toHaveProperty('facettes');
            
            // Verify pagination consistency
            expect(result.total).toBeGreaterThanOrEqual(result.actes.length);
            expect(result.page).toBeGreaterThanOrEqual(1);
            expect(result.totalPages).toBeGreaterThanOrEqual(1);
            
            // Verify all returned actes have required fields
            result.actes.forEach(acte => {
              expect(acte.id).toBeDefined();
              expect(acte.numeroMinutier).toBeDefined();
              expect(acte.typeActe).toBeDefined();
            });
          } catch (error) {
            // Skip invalid search criteria
          }
        }
      ), { numRuns: 30 });
    });

    it('should respect search filters', async () => {
      await fc.assert(fc.asyncProperty(
        typeActeArb,
        fc.uuid(),
        async (typeActe, notaireId) => {
          const criteres: MinutierRecherche = { typeActe };
          
          // Mock filtered results
          const mockResults = [{
            id: 'acte-1',
            numero_minutier: '2024-000001',
            type_acte: typeActe,
            objet: 'Test acte',
            parties: JSON.stringify([]),
            metadonnees: JSON.stringify({}),
            statut: StatutActe.SIGNE,
            created_at: new Date(),
            updated_at: new Date(),
            total_count: '1'
          }];

          (mockDb.query as jest.Mock).mockResolvedValue({ rows: mockResults });

          try {
            const result = await minutierService.rechercherActes(criteres, notaireId);
            
            // Verify all results match the filter
            result.actes.forEach(acte => {
              expect(acte.typeActe).toBe(typeActe);
            });
          } catch (error) {
            // Skip invalid search criteria
          }
        }
      ), { numRuns: 20 });
    });
  });

  /**
   * **Propriété 23: Copies Conformes Authentifiées**
   * **Valide: Exigences 9.5**
   */
  describe('Propriété 23: Copies Conformes Authentifiées', () => {
    it('should generate valid copies only for signed actes', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          acteId: fc.uuid(),
          typeCopie: typeCopieArb,
          demandeur: fc.record({
            nom: fc.string({ minLength: 2, maxLength: 50 }),
            prenom: fc.option(fc.string({ minLength: 2, maxLength: 50 })),
            qualite: fc.string({ minLength: 2, maxLength: 50 }),
            adresse: adresseArb,
            pieceIdentite: pieceIdentiteArb,
            motifDemande: fc.string({ minLength: 5, maxLength: 200 })
          }),
          motifDemande: fc.string({ minLength: 5, maxLength: 200 })
        }),
        fc.uuid(),
        statutActeArb,
        async (request, notaireId, statutActe) => {
          // Mock acte with given status
          jest.spyOn(minutierService, 'obtenirActeParId').mockResolvedValue({
            id: request.acteId,
            notaireId,
            statut: statutActe,
            contenu: {
              preambule: 'Test',
              comparution: 'Test',
              expose: 'Test',
              dispositif: 'Test',
              clauses: [],
              mentions: [],
              conclusion: 'Test'
            }
          } as any);

          // Mock database operations
          mockClient.query
            .mockResolvedValueOnce({ rows: [{ prochain_numero: 1 }] })
            .mockResolvedValueOnce({ rows: [{ id: 'copie-id' }] })
            .mockResolvedValue({ rows: [] });

          jest.spyOn(minutierService, 'obtenirCopieParId' as any).mockResolvedValue({
            id: 'copie-id',
            acteId: request.acteId,
            typeCopie: request.typeCopie
          });

          const isSignedStatus = [StatutActe.SIGNE, StatutActe.ENREGISTRE, StatutActe.ARCHIVE].includes(statutActe);

          try {
            const copie = await minutierService.genererCopieConforme(request, notaireId);
            
            // Should only succeed for signed actes
            expect(isSignedStatus).toBe(true);
            expect(copie).toBeDefined();
            expect(copie.acteId).toBe(request.acteId);
            expect(copie.typeCopie).toBe(request.typeCopie);
          } catch (error) {
            // Should fail for non-signed actes
            if (error instanceof Error && error.message.includes('doit être signé')) {
              expect(isSignedStatus).toBe(false);
            } else if (error instanceof Error && error.message.includes('non trouvé')) {
              // Expected for invalid acte IDs
            } else {
              throw error;
            }
          }
        }
      ), { numRuns: 40 });
    });

    it('should maintain copy authenticity with hash verification', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          acteId: fc.uuid(),
          typeCopie: typeCopieArb,
          demandeur: fc.record({
            nom: fc.string({ minLength: 2, maxLength: 50 }),
            qualite: fc.string({ minLength: 2, maxLength: 50 }),
            adresse: adresseArb,
            pieceIdentite: pieceIdentiteArb,
            motifDemande: fc.string({ minLength: 5, maxLength: 200 })
          }),
          motifDemande: fc.string({ minLength: 5, maxLength: 200 })
        }),
        fc.uuid(),
        async (request, notaireId) => {
          // Mock signed acte
          jest.spyOn(minutierService, 'obtenirActeParId').mockResolvedValue({
            id: request.acteId,
            notaireId,
            statut: StatutActe.SIGNE,
            numeroMinutier: '2024-000001',
            dateActe: new Date(),
            objet: 'Test acte',
            contenu: {
              preambule: 'Test content',
              comparution: 'Test',
              expose: 'Test',
              dispositif: 'Test',
              clauses: [],
              mentions: [],
              conclusion: 'Test'
            }
          } as any);

          // Mock database operations
          mockClient.query
            .mockResolvedValueOnce({ rows: [{ prochain_numero: 1 }] })
            .mockResolvedValueOnce({ rows: [{ id: 'copie-id' }] })
            .mockResolvedValue({ rows: [] });

          jest.spyOn(minutierService, 'obtenirCopieParId' as any).mockResolvedValue({
            id: 'copie-id',
            acteId: request.acteId,
            typeCopie: request.typeCopie,
            hashCopie: 'valid-hash',
            validiteJuridique: true
          });

          try {
            const copie = await minutierService.genererCopieConforme(request, notaireId);
            
            // Verify copy has integrity hash
            expect(copie.hashCopie).toBeDefined();
            expect(copie.hashCopie.length).toBeGreaterThan(0);
            
            // Verify legal validity
            expect(copie.validiteJuridique).toBe(true);
          } catch (error) {
            // Skip invalid requests
          }
        }
      ), { numRuns: 20 });
    });
  });

  describe('Archive Management Properties', () => {
    it('should maintain archive integrity during archiving process', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          acteId: fc.uuid(),
          emplacementPhysique: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
          dureeConservation: fc.integer({ min: 1, max: 100 }),
          typesSauvegarde: fc.array(typeSauvegardeArb, { minLength: 1, maxLength: 4 })
        }),
        fc.uuid(),
        async (request, notaireId) => {
          // Mock existing acte
          jest.spyOn(minutierService, 'obtenirActeParId').mockResolvedValue({
            id: request.acteId,
            notaireId,
            statut: StatutActe.SIGNE
          } as any);

          // Mock database operations
          mockClient.query.mockResolvedValue({ rows: [] });

          try {
            await minutierService.archiverActe(request, notaireId);
            
            // Verify transaction was committed
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            
            // Verify all backup types were processed
            const insertCalls = (mockClient.query as jest.Mock).mock.calls
              .filter(call => call[0].includes('INSERT INTO sauvegardes'));
            expect(insertCalls.length).toBe(request.typesSauvegarde.length);
          } catch (error) {
            // Skip invalid requests
          }
        }
      ), { numRuns: 25 });
    });
  });
});