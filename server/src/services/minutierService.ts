import { Pool } from 'pg';
import crypto from 'crypto';
import {
  ActeAuthentique,
  CopieConforme,
  MinutierRecherche,
  ResultatRechercheMinutier,
  StatistiquesMinutier,
  CreerActeRequest,
  ModifierActeRequest,
  DemanderCopieRequest,
  ArchivageRequest,
  MinutierDashboard,
  TypeActe,
  StatutActe,
  StatutArchivage,
  TypeSauvegarde,
  StatutSauvegarde,
  TypeCopie,
  StatutCopie,
  AlerteMinutier,
  TypeAlerte,
  PrioriteAlerte
} from '../types/minutier.js';
import { logger } from '../utils/logger.js';

export class MinutierService {
  constructor(private db: Pool) {}

  /**
   * Créer un nouvel acte authentique avec numérotation automatique
   */
  async creerActe(request: CreerActeRequest, notaireId: string): Promise<ActeAuthentique> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Générer le numéro de minutier automatique
      const numeroMinutier = await this.genererNumeroMinutier(client, notaireId);
      const numeroRepertoire = await this.genererNumeroRepertoire(client, notaireId);

      // Créer le hash d'intégrité
      const contenuPourHash = JSON.stringify({
        typeActe: request.typeActe,
        objet: request.objet,
        parties: request.parties,
        contenu: request.contenu,
        timestamp: new Date().toISOString()
      });
      const hashIntegrite = crypto.createHash('sha256').update(contenuPourHash).digest('hex');

      // Générer la clé de chiffrement
      const chiffrementCle = crypto.randomBytes(32).toString('hex');

      // Chiffrer le contenu sensible
      const contenuChiffre = this.chiffrerContenu(JSON.stringify(request.contenu), chiffrementCle);

      // Créer l'acte
      const acteQuery = `
        INSERT INTO actes_authentiques (
          numero_minutier, numero_repertoire, date_acte, type_acte, objet,
          parties, notaire_id, contenu_chiffre, hash_integrite, chiffrement_cle,
          metadonnees, statut, numero_archive
        ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const numeroArchive = await this.genererNumeroArchive(client, notaireId);

      const acteResult = await client.query(acteQuery, [
        numeroMinutier,
        numeroRepertoire,
        request.typeActe,
        request.objet,
        JSON.stringify(request.parties),
        notaireId,
        contenuChiffre,
        hashIntegrite,
        chiffrementCle,
        JSON.stringify(request.metadonnees),
        StatutActe.BROUILLON,
        numeroArchive
      ]);

      const acteId = acteResult.rows[0].id;

      // Ajouter les annexes si présentes
      if (request.annexes && request.annexes.length > 0) {
        for (const annexe of request.annexes) {
          const annexeQuery = `
            INSERT INTO annexes_actes (acte_id, nom, type, taille, chemin_fichier, hash_fichier, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;

          const hashFichier = crypto.createHash('sha256').update(annexe.nom + Date.now()).digest('hex');
          
          await client.query(annexeQuery, [
            acteId,
            annexe.nom,
            annexe.type,
            annexe.taille,
            annexe.cheminFichier,
            hashFichier,
            annexe.description
          ]);
        }
      }

      // Créer l'entrée d'archivage
      await this.creerEntreeArchivage(client, acteId, numeroArchive);

      // Créer les sauvegardes initiales
      await this.creerSauvegardesInitiales(client, acteId);

      await client.query('COMMIT');

      const acte = await this.obtenirActeParId(acteId);
      
      logger.info('Acte authentique créé', { 
        acteId, 
        numeroMinutier, 
        typeActe: request.typeActe,
        notaireId 
      });

      return acte!;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors de la création de l\'acte', { error, request, notaireId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtenir un acte par son ID avec déchiffrement
   */
  async obtenirActeParId(acteId: string): Promise<ActeAuthentique | null> {
    try {
      const query = `
        SELECT aa.*, en.nom as etude_nom, en.adresse as etude_adresse,
               ai.date_archivage, ai.emplacement_physique, ai.emplacement_numerique,
               ai.duree_conservation, ai.statut_archivage
        FROM actes_authentiques aa
        LEFT JOIN etudes_notariales en ON aa.notaire_id = en.notaire_id
        LEFT JOIN archivage_info ai ON aa.id = ai.acte_id
        WHERE aa.id = $1
      `;

      const result = await this.db.query(query, [acteId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];

      // Déchiffrer le contenu
      const contenuDechiffre = this.dechiffrerContenu(row.contenu_chiffre, row.chiffrement_cle);

      // Vérifier l'intégrité
      const integrite = await this.verifierIntegrite(acteId, row.hash_integrite);
      if (!integrite) {
        logger.warn('Intégrité compromise pour l\'acte', { acteId });
        await this.creerAlerte(acteId, TypeAlerte.INTEGRITE_COMPROMISE, 'L\'intégrité de l\'acte a été compromise');
      }

      return this.mapRowToActe(row, contenuDechiffre);
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'acte', { error, acteId });
      throw error;
    }
  }

  /**
   * Rechercher dans le minutier avec critères multiples
   */
  async rechercherActes(criteres: MinutierRecherche, notaireId: string): Promise<ResultatRechercheMinutier> {
    try {
      let query = `
        SELECT aa.*, COUNT(*) OVER() as total_count
        FROM actes_authentiques aa
        WHERE aa.notaire_id = $1
      `;

      const params: any[] = [notaireId];
      let paramIndex = 2;

      // Construire les conditions de recherche
      if (criteres.numeroMinutier) {
        query += ` AND aa.numero_minutier ILIKE $${paramIndex}`;
        params.push(`%${criteres.numeroMinutier}%`);
        paramIndex++;
      }

      if (criteres.numeroRepertoire) {
        query += ` AND aa.numero_repertoire ILIKE $${paramIndex}`;
        params.push(`%${criteres.numeroRepertoire}%`);
        paramIndex++;
      }

      if (criteres.dateDebut) {
        query += ` AND aa.date_acte >= $${paramIndex}`;
        params.push(criteres.dateDebut);
        paramIndex++;
      }

      if (criteres.dateFin) {
        query += ` AND aa.date_acte <= $${paramIndex}`;
        params.push(criteres.dateFin);
        paramIndex++;
      }

      if (criteres.typeActe) {
        query += ` AND aa.type_acte = $${paramIndex}`;
        params.push(criteres.typeActe);
        paramIndex++;
      }

      if (criteres.objet) {
        query += ` AND aa.objet ILIKE $${paramIndex}`;
        params.push(`%${criteres.objet}%`);
        paramIndex++;
      }

      if (criteres.parties && criteres.parties.length > 0) {
        query += ` AND (`;
        const partieConditions = criteres.parties.map((partie, index) => {
          params.push(`%${partie}%`);
          return `aa.parties::text ILIKE $${paramIndex + index}`;
        });
        query += partieConditions.join(' OR ') + ')';
        paramIndex += criteres.parties.length;
      }

      if (criteres.montantMin !== undefined) {
        query += ` AND (aa.metadonnees->>'montant')::numeric >= $${paramIndex}`;
        params.push(criteres.montantMin);
        paramIndex++;
      }

      if (criteres.montantMax !== undefined) {
        query += ` AND (aa.metadonnees->>'montant')::numeric <= $${paramIndex}`;
        params.push(criteres.montantMax);
        paramIndex++;
      }

      if (criteres.statut) {
        query += ` AND aa.statut = $${paramIndex}`;
        params.push(criteres.statut);
        paramIndex++;
      }

      if (criteres.motsCles && criteres.motsCles.length > 0) {
        query += ` AND (`;
        const motsClesConditions = criteres.motsCles.map((mot, index) => {
          params.push(`%${mot}%`);
          return `(aa.objet ILIKE $${paramIndex + index} OR aa.metadonnees::text ILIKE $${paramIndex + index})`;
        });
        query += motsClesConditions.join(' OR ') + ')';
        paramIndex += criteres.motsCles.length;
      }

      // Tri
      const tri = criteres.tri || { champ: 'date_acte', ordre: 'desc' };
      const champTri = this.mapChampTri(tri.champ);
      query += ` ORDER BY ${champTri} ${tri.ordre.toUpperCase()}`;

      // Pagination
      const page = criteres.page || 1;
      const limite = criteres.limite || 20;
      const offset = (page - 1) * limite;

      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limite, offset);

      const result = await this.db.query(query, params);

      const actes = result.rows.map(row => {
        // Pour la recherche, on ne déchiffre pas le contenu complet pour des raisons de performance
        return this.mapRowToActeResume(row);
      });

      const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
      const totalPages = Math.ceil(total / limite);

      // Générer les facettes
      const facettes = await this.genererFacettes(criteres, notaireId);

      return {
        actes,
        total,
        page,
        totalPages,
        facettes
      };
    } catch (error) {
      logger.error('Erreur lors de la recherche dans le minutier', { error, criteres, notaireId });
      throw error;
    }
  }

  /**
   * Générer une copie conforme d'un acte
   */
  async genererCopieConforme(request: DemanderCopieRequest, notaireId: string): Promise<CopieConforme> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Vérifier que l'acte existe et appartient au notaire
      const acte = await this.obtenirActeParId(request.acteId);
      if (!acte || acte.notaireId !== notaireId) {
        throw new Error('Acte non trouvé ou accès non autorisé');
      }

      // Vérifier que l'acte est signé
      if (acte.statut !== StatutActe.SIGNE && acte.statut !== StatutActe.ENREGISTRE && acte.statut !== StatutActe.ARCHIVE) {
        throw new Error('L\'acte doit être signé pour générer une copie conforme');
      }

      // Générer le numéro de copie
      const numeroCopie = await this.genererNumeroCopie(client, request.acteId, request.typeCopie);

      // Générer le contenu de la copie selon le type
      const contenuCopie = await this.genererContenuCopie(acte, request.typeCopie);

      // Créer le hash de la copie
      const hashCopie = crypto.createHash('sha256').update(contenuCopie).digest('hex');

      // Créer la copie
      const copieQuery = `
        INSERT INTO copies_conformes (
          acte_id, type_copie, numero_copie, demandeur, notaire_id,
          contenu_copie, hash_copie, statut, validite_juridique
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const copieResult = await client.query(copieQuery, [
        request.acteId,
        request.typeCopie,
        numeroCopie,
        JSON.stringify(request.demandeur),
        notaireId,
        contenuCopie,
        hashCopie,
        StatutCopie.GENEREE,
        true
      ]);

      const copieId = copieResult.rows[0].id;

      // Créer la signature du notaire
      await this.signerCopieConforme(client, copieId, notaireId);

      // Ajouter les cachets notariaux
      await this.appliquerCachetsNotariaux(client, copieId);

      await client.query('COMMIT');

      const copie = await this.obtenirCopieParId(copieId);
      
      logger.info('Copie conforme générée', { 
        copieId, 
        acteId: request.acteId, 
        typeCopie: request.typeCopie,
        notaireId 
      });

      return copie!;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors de la génération de la copie conforme', { error, request, notaireId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Archiver un acte avec sauvegardes multiples
   */
  async archiverActe(request: ArchivageRequest, notaireId: string): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Vérifier que l'acte existe et appartient au notaire
      const acte = await this.obtenirActeParId(request.acteId);
      if (!acte || acte.notaireId !== notaireId) {
        throw new Error('Acte non trouvé ou accès non autorisé');
      }

      // Mettre à jour le statut de l'acte
      await client.query(
        'UPDATE actes_authentiques SET statut = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [StatutActe.ARCHIVE, request.acteId]
      );

      // Mettre à jour les informations d'archivage
      const dateDestructionPrevue = new Date();
      dateDestructionPrevue.setFullYear(dateDestructionPrevue.getFullYear() + request.dureeConservation);

      await client.query(`
        UPDATE archivage_info SET
          date_archivage = CURRENT_TIMESTAMP,
          emplacement_physique = $1,
          duree_conservation = $2,
          date_destruction_prevue = $3,
          statut_archivage = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE acte_id = $5
      `, [
        request.emplacementPhysique,
        request.dureeConservation,
        dateDestructionPrevue,
        StatutArchivage.ARCHIVE_DEFINITIVE,
        request.acteId
      ]);

      // Créer les sauvegardes demandées
      for (const typeSauvegarde of request.typesSauvegarde) {
        await this.creerSauvegarde(client, request.acteId, typeSauvegarde);
      }

      await client.query('COMMIT');

      logger.info('Acte archivé avec succès', { 
        acteId: request.acteId, 
        dureeConservation: request.dureeConservation,
        typesSauvegarde: request.typesSauvegarde,
        notaireId 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors de l\'archivage de l\'acte', { error, request, notaireId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtenir le tableau de bord du minutier
   */
  async obtenirTableauDeBord(notaireId: string): Promise<MinutierDashboard> {
    try {
      const [
        statistiques,
        actesRecents,
        actesEnCours,
        copiesEnAttente,
        alertes
      ] = await Promise.all([
        this.obtenirStatistiques(notaireId),
        this.obtenirActesRecents(notaireId, 10),
        this.obtenirActesEnCours(notaireId),
        this.obtenirCopiesEnAttente(notaireId),
        this.obtenirAlertes(notaireId)
      ]);

      return {
        statistiques,
        actesRecents,
        actesEnCours,
        copiesEnAttente,
        alertes
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération du tableau de bord', { error, notaireId });
      throw error;
    }
  }

  // Méthodes privées

  private async genererNumeroMinutier(client: any, notaireId: string): Promise<string> {
    const annee = new Date().getFullYear();
    
    const result = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(numero_minutier FROM '[0-9]+$') AS INTEGER)), 0) + 1 as prochain_numero
      FROM actes_authentiques 
      WHERE notaire_id = $1 AND EXTRACT(YEAR FROM date_acte) = $2
    `, [notaireId, annee]);

    const prochainNumero = result.rows[0].prochain_numero;
    return `${annee}-${prochainNumero.toString().padStart(6, '0')}`;
  }

  private async genererNumeroRepertoire(client: any, notaireId: string): Promise<string> {
    const annee = new Date().getFullYear();
    
    const result = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(numero_repertoire FROM '[0-9]+$') AS INTEGER)), 0) + 1 as prochain_numero
      FROM actes_authentiques 
      WHERE notaire_id = $1 AND EXTRACT(YEAR FROM date_acte) = $2
    `, [notaireId, annee]);

    const prochainNumero = result.rows[0].prochain_numero;
    return `REP-${annee}-${prochainNumero.toString().padStart(4, '0')}`;
  }

  private async genererNumeroArchive(client: any, notaireId: string): Promise<string> {
    const annee = new Date().getFullYear();
    
    const result = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(numero_archive FROM '[0-9]+$') AS INTEGER)), 0) + 1 as prochain_numero
      FROM archivage_info ai
      JOIN actes_authentiques aa ON ai.acte_id = aa.id
      WHERE aa.notaire_id = $1 AND EXTRACT(YEAR FROM aa.date_acte) = $2
    `, [notaireId, annee]);

    const prochainNumero = result.rows[0].prochain_numero;
    return `ARC-${annee}-${prochainNumero.toString().padStart(6, '0')}`;
  }

  private chiffrerContenu(contenu: string, cle: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', cle);
    let encrypted = cipher.update(contenu, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private dechiffrerContenu(contenuChiffre: string, cle: string): string {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', cle);
      let decrypted = decipher.update(contenuChiffre, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.error('Erreur lors du déchiffrement', { error });
      throw new Error('Impossible de déchiffrer le contenu de l\'acte');
    }
  }

  private async verifierIntegrite(acteId: string, hashAttendu: string): Promise<boolean> {
    try {
      // Recalculer le hash à partir des données actuelles
      const result = await this.db.query(
        'SELECT type_acte, objet, parties, contenu_chiffre FROM actes_authentiques WHERE id = $1',
        [acteId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const row = result.rows[0];
      const contenuPourHash = JSON.stringify({
        typeActe: row.type_acte,
        objet: row.objet,
        parties: JSON.parse(row.parties),
        contenu: row.contenu_chiffre
      });

      const hashCalcule = crypto.createHash('sha256').update(contenuPourHash).digest('hex');
      return hashCalcule === hashAttendu;
    } catch (error) {
      logger.error('Erreur lors de la vérification d\'intégrité', { error, acteId });
      return false;
    }
  }

  private async creerEntreeArchivage(client: any, acteId: string, numeroArchive: string): Promise<void> {
    const emplacementNumerique = `/archives/numeriques/${new Date().getFullYear()}/${numeroArchive}`;
    
    await client.query(`
      INSERT INTO archivage_info (
        acte_id, numero_archive, emplacement_numerique, 
        duree_conservation, statut_archivage
      ) VALUES ($1, $2, $3, $4, $5)
    `, [acteId, numeroArchive, emplacementNumerique, 30, StatutArchivage.ACTIF]);
  }

  private async creerSauvegardesInitiales(client: any, acteId: string): Promise<void> {
    const typesSauvegarde = [TypeSauvegarde.LOCALE, TypeSauvegarde.CLOUD];
    
    for (const type of typesSauvegarde) {
      await this.creerSauvegarde(client, acteId, type);
    }
  }

  private async creerSauvegarde(client: any, acteId: string, typeSauvegarde: TypeSauvegarde): Promise<void> {
    const emplacementSauvegarde = this.genererEmplacementSauvegarde(typeSauvegarde, acteId);
    const hashSauvegarde = crypto.randomBytes(32).toString('hex');
    const tailleSauvegarde = Math.floor(Math.random() * 1000000) + 100000; // Simulation

    await client.query(`
      INSERT INTO sauvegardes (
        acte_id, type_sauvegarde, emplacement_sauvegarde, 
        hash_sauvegarde, taille_sauvegarde, statut
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [acteId, typeSauvegarde, emplacementSauvegarde, hashSauvegarde, tailleSauvegarde, StatutSauvegarde.ACTIVE]);
  }

  private genererEmplacementSauvegarde(type: TypeSauvegarde, acteId: string): string {
    const timestamp = Date.now();
    switch (type) {
      case TypeSauvegarde.LOCALE:
        return `/backup/local/${acteId}_${timestamp}`;
      case TypeSauvegarde.CLOUD:
        return `s3://minutier-backup/${acteId}_${timestamp}`;
      case TypeSauvegarde.EXTERNE:
        return `/backup/externe/${acteId}_${timestamp}`;
      default:
        return `/backup/default/${acteId}_${timestamp}`;
    }
  }

  private async creerAlerte(acteId: string, type: TypeAlerte, message: string): Promise<void> {
    await this.db.query(`
      INSERT INTO alertes_minutier (acte_id, type, message, priorite)
      VALUES ($1, $2, $3, $4)
    `, [acteId, type, message, PrioriteAlerte.HAUTE]);
  }

  private mapRowToActe(row: any, contenuDechiffre: string): ActeAuthentique {
    return {
      id: row.id,
      numeroMinutier: row.numero_minutier,
      numeroRepertoire: row.numero_repertoire,
      dateActe: new Date(row.date_acte),
      typeActe: row.type_acte,
      objet: row.objet,
      parties: JSON.parse(row.parties),
      notaireId: row.notaire_id,
      etude: {
        id: row.notaire_id,
        nom: row.etude_nom,
        adresse: JSON.parse(row.etude_adresse || '{}'),
        telephone: '',
        email: '',
        numeroAgrement: '',
        chambreNotaires: ''
      },
      contenu: JSON.parse(contenuDechiffre),
      signatures: [], // À charger séparément
      annexes: [], // À charger séparément
      statut: row.statut,
      hashIntegrite: row.hash_integrite,
      chiffrementCle: row.chiffrement_cle,
      metadonnees: JSON.parse(row.metadonnees || '{}'),
      archivage: {
        dateArchivage: row.date_archivage ? new Date(row.date_archivage) : undefined,
        numeroArchive: row.numero_archive,
        emplacementPhysique: row.emplacement_physique,
        emplacementNumerique: row.emplacement_numerique,
        dureeConservation: row.duree_conservation,
        dateDestructionPrevue: row.date_destruction_prevue ? new Date(row.date_destruction_prevue) : undefined,
        statutArchivage: row.statut_archivage,
        sauvegardes: [] // À charger séparément
      },
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapRowToActeResume(row: any): ActeAuthentique {
    // Version allégée pour les résultats de recherche
    return {
      id: row.id,
      numeroMinutier: row.numero_minutier,
      numeroRepertoire: row.numero_repertoire,
      dateActe: new Date(row.date_acte),
      typeActe: row.type_acte,
      objet: row.objet,
      parties: JSON.parse(row.parties),
      notaireId: row.notaire_id,
      statut: row.statut,
      metadonnees: JSON.parse(row.metadonnees || '{}'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    } as ActeAuthentique;
  }

  private mapChampTri(champ: string): string {
    const mapping: Record<string, string> = {
      'date_acte': 'aa.date_acte',
      'numero_minutier': 'aa.numero_minutier',
      'type_acte': 'aa.type_acte',
      'parties': 'aa.parties',
      'montant': '(aa.metadonnees->>\'montant\')::numeric',
      'statut': 'aa.statut'
    };
    return mapping[champ] || 'aa.date_acte';
  }

  private async genererFacettes(criteres: MinutierRecherche, notaireId: string): Promise<any[]> {
    // Implémentation simplifiée des facettes
    return [
      {
        champ: 'type_acte',
        valeurs: [
          { valeur: 'vente_immobiliere', nombre: 45 },
          { valeur: 'donation', nombre: 23 },
          { valeur: 'succession', nombre: 18 }
        ]
      },
      {
        champ: 'statut',
        valeurs: [
          { valeur: 'signe', nombre: 67 },
          { valeur: 'en_preparation', nombre: 12 },
          { valeur: 'archive', nombre: 156 }
        ]
      }
    ];
  }

  // Méthodes pour le tableau de bord
  private async obtenirStatistiques(notaireId: string): Promise<StatistiquesMinutier> {
    // Implémentation simplifiée
    return {
      notaireId,
      periode: { dateDebut: new Date(), dateFin: new Date() },
      nombreActes: 0,
      repartitionTypeActe: {} as Record<TypeActe, number>,
      montantTotal: 0,
      montantMoyen: 0,
      nombreCopies: 0,
      evolutionMensuelle: [],
      topClients: []
    };
  }

  private async obtenirActesRecents(notaireId: string, limite: number): Promise<ActeAuthentique[]> {
    const result = await this.db.query(`
      SELECT * FROM actes_authentiques 
      WHERE notaire_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `, [notaireId, limite]);

    return result.rows.map(row => this.mapRowToActeResume(row));
  }

  private async obtenirActesEnCours(notaireId: string): Promise<ActeAuthentique[]> {
    const result = await this.db.query(`
      SELECT * FROM actes_authentiques 
      WHERE notaire_id = $1 AND statut IN ($2, $3, $4)
      ORDER BY created_at DESC
    `, [notaireId, StatutActe.BROUILLON, StatutActe.EN_PREPARATION, StatutActe.PRET_SIGNATURE]);

    return result.rows.map(row => this.mapRowToActeResume(row));
  }

  private async obtenirCopiesEnAttente(notaireId: string): Promise<CopieConforme[]> {
    // Implémentation simplifiée
    return [];
  }

  private async obtenirAlertes(notaireId: string): Promise<AlerteMinutier[]> {
    const result = await this.db.query(`
      SELECT am.* FROM alertes_minutier am
      JOIN actes_authentiques aa ON am.acte_id = aa.id
      WHERE aa.notaire_id = $1 AND am.traitee = false
      ORDER BY am.date_alerte DESC
      LIMIT 10
    `, [notaireId]);

    return result.rows.map(row => ({
      id: row.id,
      type: row.type,
      message: row.message,
      acteId: row.acte_id,
      dateAlerte: new Date(row.date_alerte),
      priorite: row.priorite,
      traitee: row.traitee
    }));
  }

  private async obtenirCopieParId(copieId: string): Promise<CopieConforme | null> {
    // Implémentation simplifiée
    return null;
  }

  private async genererNumeroCopie(client: any, acteId: string, typeCopie: TypeCopie): Promise<string> {
    const result = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(numero_copie FROM '[0-9]+$') AS INTEGER)), 0) + 1 as prochain_numero
      FROM copies_conformes 
      WHERE acte_id = $1 AND type_copie = $2
    `, [acteId, typeCopie]);

    const prochainNumero = result.rows[0].prochain_numero;
    return `${typeCopie.toUpperCase()}-${prochainNumero.toString().padStart(3, '0')}`;
  }

  private async genererContenuCopie(acte: ActeAuthentique, typeCopie: TypeCopie): Promise<string> {
    // Génération du contenu selon le type de copie
    let contenu = `COPIE CONFORME\n\n`;
    contenu += `Type: ${typeCopie}\n`;
    contenu += `Acte n° ${acte.numeroMinutier}\n`;
    contenu += `Date: ${acte.dateActe.toLocaleDateString('fr-FR')}\n`;
    contenu += `Objet: ${acte.objet}\n\n`;
    
    // Ajouter le contenu selon le type
    switch (typeCopie) {
      case TypeCopie.COPIE_CONFORME:
        contenu += JSON.stringify(acte.contenu, null, 2);
        break;
      case TypeCopie.EXTRAIT:
        contenu += `Extrait de l'acte concernant: ${acte.objet}`;
        break;
      default:
        contenu += `Document de type ${typeCopie}`;
    }

    return contenu;
  }

  private async signerCopieConforme(client: any, copieId: string, notaireId: string): Promise<void> {
    const signatureNumerique = crypto.randomBytes(64).toString('hex');
    const certificat = crypto.randomBytes(32).toString('hex');

    await client.query(`
      INSERT INTO signatures_notaire (copie_id, notaire_id, signature_numerique, certificat)
      VALUES ($1, $2, $3, $4)
    `, [copieId, notaireId, signatureNumerique, certificat]);
  }

  private async appliquerCachetsNotariaux(client: any, copieId: string): Promise<void> {
    const cachets = [
      { type: 'cachet_etude', empreinte: crypto.randomBytes(16).toString('hex') },
      { type: 'sceau_electronique', empreinte: crypto.randomBytes(16).toString('hex') }
    ];

    for (const cachet of cachets) {
      await client.query(`
        INSERT INTO cachets_notariaux (copie_id, type, empreinte, coordonnees)
        VALUES ($1, $2, $3, $4)
      `, [copieId, cachet.type, cachet.empreinte, JSON.stringify({ x: 100, y: 100, page: 1 })]);
    }
  }
}
// Create and export instance
import { db } from '@/database/connection';
export const minutierService = new MinutierService(db);