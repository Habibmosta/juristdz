import { getDb } from '@/database/connection';
import { logger } from '@/utils/logger';

/**
 * Service d'adaptation aux spécificités locales algériennes
 * Implémente les procédures spécifiques aux tribunaux et barreaux algériens
 */

export interface AlgerianCourt {
  id: string;
  name: string;
  nameArabic: string;
  type: 'tribunal_premiere_instance' | 'cour_appel' | 'cour_supreme' | 'conseil_etat' | 'tribunal_administratif' | 'tribunal_commercial';
  wilaya: string;
  ville: string;
  adresse: string;
  telephone?: string;
  email?: string;
  president?: string;
  procureur?: string;
  greffierChef?: string;
  specialites: string[];
  horaires: CourtSchedule;
  calendrierJudiciaire: JudicialCalendar;
  isActive: boolean;
}

export interface CourtSchedule {
  ouverture: string; // Format HH:mm
  fermeture: string;
  joursOuverture: string[]; // ['lundi', 'mardi', ...]
  pauseDejeneur?: {
    debut: string;
    fin: string;
  };
  horairesRamadan?: {
    ouverture: string;
    fermeture: string;
  };
}

export interface JudicialCalendar {
  vacancesJudiciaires: VacationPeriod[];
  joursChomes: string[]; // Dates des jours chômés
  delaisSpeciaux: SpecialDelay[];
}

export interface VacationPeriod {
  nom: string;
  dateDebut: Date;
  dateFin: Date;
  type: 'vacances_ete' | 'vacances_hiver' | 'ramadan' | 'aid';
}

export interface SpecialDelay {
  procedure: string;
  delaiNormal: number; // en jours
  delaiRamadan?: number;
  delaiVacances?: number;
  description: string;
}

export interface AlgerianBarreau {
  id: string;
  name: string;
  nameArabic: string;
  wilaya: string;
  ville: string;
  adresse: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  batonnier: string;
  secretaireGeneral?: string;
  tresorier?: string;
  nombreAvocats: number;
  baremes: BaremeHonoraires;
  reglementInterieur: string;
  specialites: string[];
  isActive: boolean;
}

export interface BaremeHonoraires {
  version: string;
  dateEntreeVigueur: Date;
  consultations: {
    simple: number;
    complexe: number;
    urgente: number;
  };
  procedures: {
    requete: number;
    conclusion: number;
    plaidoirie: number;
    appel: number;
    cassation: number;
  };
  contrats: {
    simple: number;
    complexe: number;
    commercial: number;
  };
  coefficientsSpecialites: Record<string, number>;
  fraisDeplacementParKm: number;
  tauxTVA: number;
}

export interface ProcedureSpecifique {
  id: string;
  nom: string;
  nomArabe: string;
  tribunal: string;
  domaine: 'civil' | 'penal' | 'commercial' | 'administratif' | 'social';
  etapes: EtapeProcedure[];
  delais: DelaisProcedure;
  documents: DocumentRequis[];
  frais: FraisProcedure;
  specificites: string[];
}

export interface EtapeProcedure {
  ordre: number;
  nom: string;
  nomArabe: string;
  description: string;
  delaiMax: number; // en jours
  documentsRequis: string[];
  acteurs: string[]; // avocat, greffier, juge, etc.
  obligatoire: boolean;
}

export interface DelaisProcedure {
  delaiAppel: number;
  delaiCassation: number;
  delaiExecution: number;
  delaisSpeciaux: Record<string, number>;
}

export interface DocumentRequis {
  nom: string;
  nomArabe: string;
  obligatoire: boolean;
  nombreExemplaires: number;
  format: string;
  validite?: number; // en jours
}

export interface FraisProcedure {
  droitEnregistrement: number;
  timbreFiscal: number;
  fraisSignification: number;
  fraisExpertise?: number;
  autresFrais: Record<string, number>;
}

export interface CalendrierJudiciaire {
  annee: number;
  joursOuvres: Date[];
  joursChomes: Date[];
  vacancesJudiciaires: VacationPeriod[];
  evenementsSpeciaux: EvenementJudiciaire[];
}

export interface EvenementJudiciaire {
  nom: string;
  nomArabe: string;
  date: Date;
  type: 'formation' | 'ceremonie' | 'conference' | 'assemblee';
  lieu?: string;
  description?: string;
}

export class AlgerianSpecificitiesService {
  private readonly db = getDb();
  private readonly tribunaux: Map<string, AlgerianCourt> = new Map();
  private readonly barreaux: Map<string, AlgerianBarreau> = new Map();
  private calendrierJudiciaire?: CalendrierJudiciaire;

  constructor() {
    this.initializeAlgerianSpecificities();
  }

  /**
   * Initialise les spécificités algériennes
   */
  async initializeAlgerianSpecificities(): Promise<void> {
    try {
      await this.createSpecificitiesTables();
      await this.loadAlgerianCourts();
      await this.loadAlgerianBarreaux();
      await this.loadJudicialCalendar();
      await this.loadSpecificProcedures();
      logger.info('Spécificités algériennes initialisées avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation des spécificités algériennes:', error);
    }
  }

  /**
   * Charge les tribunaux algériens
   */
  async loadAlgerianCourts(): Promise<void> {
    const tribunaux = [
      {
        id: 'tpi-alger',
        name: 'Tribunal de Première Instance d\'Alger',
        nameArabic: 'محكمة الدرجة الأولى بالجزائر',
        type: 'tribunal_premiere_instance' as const,
        wilaya: 'Alger',
        ville: 'Alger',
        adresse: 'Place des Martyrs, Alger',
        telephone: '+213 21 73 45 67',
        specialites: ['civil', 'commercial', 'social', 'penal'],
        horaires: {
          ouverture: '08:00',
          fermeture: '16:30',
          joursOuverture: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi'],
          pauseDejeneur: { debut: '12:00', fin: '13:30' },
          horairesRamadan: { ouverture: '09:00', fermeture: '15:00' }
        }
      },
      {
        id: 'ca-alger',
        name: 'Cour d\'Appel d\'Alger',
        nameArabic: 'محكمة الاستئناف بالجزائر',
        type: 'cour_appel' as const,
        wilaya: 'Alger',
        ville: 'Alger',
        adresse: 'Rue Larbi Ben M\'hidi, Alger',
        telephone: '+213 21 63 28 91',
        specialites: ['civil', 'commercial', 'social', 'penal'],
        horaires: {
          ouverture: '08:00',
          fermeture: '16:30',
          joursOuverture: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi']
        }
      },
      {
        id: 'cs-alger',
        name: 'Cour Suprême',
        nameArabic: 'المحكمة العليا',
        type: 'cour_supreme' as const,
        wilaya: 'Alger',
        ville: 'Alger',
        adresse: 'Ben Aknoun, Alger',
        telephone: '+213 21 91 23 45',
        specialites: ['cassation_civile', 'cassation_penale', 'cassation_sociale'],
        horaires: {
          ouverture: '08:00',
          fermeture: '16:30',
          joursOuverture: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi']
        }
      }
    ];

    for (const tribunal of tribunaux) {
      await this.saveAlgerianCourt({
        ...tribunal,
        calendrierJudiciaire: {
          vacancesJudiciaires: [
            {
              nom: 'Vacances d\'été',
              dateDebut: new Date('2024-07-15'),
              dateFin: new Date('2024-09-15'),
              type: 'vacances_ete'
            }
          ],
          joursChomes: ['vendredi', 'samedi'],
          delaisSpeciaux: [
            {
              procedure: 'appel',
              delaiNormal: 30,
              delaiRamadan: 45,
              description: 'Délai d\'appel standard'
            }
          ]
        },
        isActive: true
      });
    }
  }

  /**
   * Charge les barreaux algériens
   */
  async loadAlgerianBarreaux(): Promise<void> {
    const barreaux = [
      {
        id: 'barreau-alger',
        name: 'Barreau d\'Alger',
        nameArabic: 'نقابة محامي الجزائر',
        wilaya: 'Alger',
        ville: 'Alger',
        adresse: 'Rue Didouche Mourad, Alger',
        telephone: '+213 21 63 45 78',
        email: 'contact@barreau-alger.dz',
        batonnier: 'Maître Ahmed BENALI',
        nombreAvocats: 2500,
        specialites: ['civil', 'penal', 'commercial', 'administratif', 'social'],
        baremes: {
          version: '2024.1',
          dateEntreeVigueur: new Date('2024-01-01'),
          consultations: {
            simple: 5000, // DA
            complexe: 15000,
            urgente: 25000
          },
          procedures: {
            requete: 20000,
            conclusion: 30000,
            plaidoirie: 50000,
            appel: 75000,
            cassation: 100000
          },
          contrats: {
            simple: 25000,
            complexe: 75000,
            commercial: 150000
          },
          coefficientsSpecialites: {
            'droit_des_affaires': 1.5,
            'droit_immobilier': 1.3,
            'droit_penal': 1.4,
            'droit_famille': 1.0
          },
          fraisDeplacementParKm: 50,
          tauxTVA: 19
        }
      },
      {
        id: 'barreau-oran',
        name: 'Barreau d\'Oran',
        nameArabic: 'نقابة محامي وهران',
        wilaya: 'Oran',
        ville: 'Oran',
        adresse: 'Boulevard de la Révolution, Oran',
        telephone: '+213 41 33 45 67',
        batonnier: 'Maître Fatima KHELIFI',
        nombreAvocats: 1200,
        specialites: ['civil', 'penal', 'commercial', 'maritime'],
        baremes: {
          version: '2024.1',
          dateEntreeVigueur: new Date('2024-01-01'),
          consultations: {
            simple: 4500,
            complexe: 13500,
            urgente: 22500
          },
          procedures: {
            requete: 18000,
            conclusion: 27000,
            plaidoirie: 45000,
            appel: 67500,
            cassation: 90000
          },
          contrats: {
            simple: 22500,
            complexe: 67500,
            commercial: 135000
          },
          coefficientsSpecialites: {
            'droit_maritime': 1.6,
            'droit_des_affaires': 1.4,
            'droit_immobilier': 1.2
          },
          fraisDeplacementParKm: 45,
          tauxTVA: 19
        }
      }
    ];

    for (const barreau of barreaux) {
      await this.saveAlgerianBarreau({
        ...barreau,
        reglementInterieur: 'Règlement intérieur du barreau selon la loi 91-04',
        isActive: true
      });
    }
  }

  /**
   * Charge le calendrier judiciaire algérien
   */
  async loadJudicialCalendar(): Promise<void> {
    const annee = new Date().getFullYear();
    
    // Jours chômés fixes en Algérie
    const joursChomesFixes = [
      `${annee}-01-01`, // Nouvel An
      `${annee}-05-01`, // Fête du Travail
      `${annee}-07-05`, // Fête de l'Indépendance
      `${annee}-11-01`, // Anniversaire de la Révolution
    ];

    // Jours chômés religieux (dates approximatives, à ajuster selon le calendrier lunaire)
    const joursChomesReligieux = [
      `${annee}-04-21`, // Aïd el-Fitr (exemple)
      `${annee}-06-28`, // Aïd el-Adha (exemple)
      `${annee}-07-19`, // Nouvel An Hégire (exemple)
      `${annee}-09-27`, // Mawlid (exemple)
    ];

    const calendrier: CalendrierJudiciaire = {
      annee,
      joursOuvres: this.generateWorkingDays(annee),
      joursChomes: [...joursChomesFixes, ...joursChomesReligieux].map(d => new Date(d)),
      vacancesJudiciaires: [
        {
          nom: 'Vacances d\'été',
          dateDebut: new Date(`${annee}-07-15`),
          dateFin: new Date(`${annee}-09-15`),
          type: 'vacances_ete'
        },
        {
          nom: 'Vacances d\'hiver',
          dateDebut: new Date(`${annee}-12-20`),
          dateFin: new Date(`${annee + 1}-01-05`),
          type: 'vacances_hiver'
        }
      ],
      evenementsSpeciaux: [
        {
          nom: 'Assemblée Générale du Barreau',
          nomArabe: 'الجمعية العامة للنقابة',
          date: new Date(`${annee}-03-15`),
          type: 'assemblee',
          lieu: 'Siège du Barreau'
        }
      ]
    };

    await this.saveJudicialCalendar(calendrier);
    this.calendrierJudiciaire = calendrier;
  }

  /**
   * Charge les procédures spécifiques algériennes
   */
  async loadSpecificProcedures(): Promise<void> {
    const procedures = [
      {
        id: 'procedure-divorce-algerien',
        nom: 'Procédure de divorce en droit algérien',
        nomArabe: 'إجراءات الطلاق في القانون الجزائري',
        tribunal: 'tribunal_premiere_instance',
        domaine: 'civil' as const,
        etapes: [
          {
            ordre: 1,
            nom: 'Tentative de conciliation',
            nomArabe: 'محاولة الصلح',
            description: 'Tentative obligatoire de conciliation devant le juge',
            delaiMax: 30,
            documentsRequis: ['acte_mariage', 'piece_identite'],
            acteurs: ['avocat', 'juge', 'parties'],
            obligatoire: true
          },
          {
            ordre: 2,
            nom: 'Dépôt de la requête',
            nomArabe: 'إيداع العريضة',
            description: 'Dépôt de la requête en divorce au greffe',
            delaiMax: 15,
            documentsRequis: ['requete_divorce', 'acte_mariage', 'acte_naissance_enfants'],
            acteurs: ['avocat', 'greffier'],
            obligatoire: true
          }
        ],
        delais: {
          delaiAppel: 30,
          delaiCassation: 60,
          delaiExecution: 30,
          delaisSpeciaux: {
            'conciliation': 30,
            'enquete_sociale': 45
          }
        },
        documents: [
          {
            nom: 'Acte de mariage',
            nomArabe: 'عقد الزواج',
            obligatoire: true,
            nombreExemplaires: 2,
            format: 'original + copie',
            validite: 90
          }
        ],
        frais: {
          droitEnregistrement: 1000,
          timbreFiscal: 200,
          fraisSignification: 500,
          autresFrais: {
            'expertise_sociale': 5000
          }
        },
        specificites: [
          'Application du Code de la famille algérien',
          'Prise en compte du statut personnel musulman',
          'Procédure de conciliation obligatoire'
        ]
      }
    ];

    for (const procedure of procedures) {
      await this.saveSpecificProcedure(procedure);
    }
  }

  /**
   * Calcule les délais selon le calendrier judiciaire algérien
   */
  async calculateAlgerianDelay(
    dateDebut: Date,
    nombreJours: number,
    tribunalId?: string
  ): Promise<{
    dateEcheance: Date;
    joursOuvres: number;
    joursChomes: number;
    vacancesIncluses: VacationPeriod[];
    ajustements: string[];
  }> {
    try {
      if (!this.calendrierJudiciaire) {
        await this.loadJudicialCalendar();
      }

      const ajustements: string[] = [];
      let dateCalcul = new Date(dateDebut);
      let joursRestants = nombreJours;
      let joursOuvres = 0;
      let joursChomes = 0;
      const vacancesIncluses: VacationPeriod[] = [];

      while (joursRestants > 0) {
        dateCalcul.setDate(dateCalcul.getDate() + 1);

        // Vérifier si c'est un jour chômé
        const estJourChome = this.isHoliday(dateCalcul);
        
        // Vérifier si c'est pendant les vacances judiciaires
        const vacancesEnCours = this.getVacationPeriod(dateCalcul);
        
        if (estJourChome) {
          joursChomes++;
          ajustements.push(`Jour chômé: ${dateCalcul.toLocaleDateString('fr-FR')}`);
        } else if (vacancesEnCours) {
          if (!vacancesIncluses.find(v => v.nom === vacancesEnCours.nom)) {
            vacancesIncluses.push(vacancesEnCours);
            ajustements.push(`Vacances judiciaires: ${vacancesEnCours.nom}`);
          }
          // Pendant les vacances, les délais peuvent être suspendus
          ajustements.push(`Délai suspendu pendant ${vacancesEnCours.nom}`);
        } else {
          // Jour ouvré normal
          joursOuvres++;
          joursRestants--;
        }
      }

      // Ajustements spéciaux pour le Ramadan
      if (this.isRamadanPeriod(dateDebut, dateCalcul)) {
        ajustements.push('Période de Ramadan: horaires réduits appliqués');
      }

      return {
        dateEcheance: dateCalcul,
        joursOuvres,
        joursChomes,
        vacancesIncluses,
        ajustements
      };

    } catch (error) {
      logger.error('Erreur lors du calcul de délai algérien:', error);
      throw error;
    }
  }

  /**
   * Obtient les barèmes d'honoraires pour un barreau
   */
  async getBaremeHonoraires(barreauId: string): Promise<BaremeHonoraires | null> {
    try {
      const query = 'SELECT baremes FROM algerian_barreaux WHERE id = $1 AND is_active = true';
      const result = await this.db.query(query, [barreauId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return JSON.parse(result.rows[0].baremes);

    } catch (error) {
      logger.error('Erreur lors de la récupération du barème:', error);
      return null;
    }
  }

  /**
   * Calcule les honoraires selon le barème algérien
   */
  async calculateAlgerianFees(
    barreauId: string,
    typePrestation: string,
    specialite?: string,
    complexite: 'simple' | 'complexe' = 'simple',
    distance?: number
  ): Promise<{
    honorairesBase: number;
    coefficient: number;
    honorairesAjustes: number;
    fraisDeplacementParKm: number;
    totalFraisDeplacementParKm: number;
    tva: number;
    totalTTC: number;
    devise: string;
    details: string[];
  }> {
    try {
      const bareme = await this.getBaremeHonoraires(barreauId);
      if (!bareme) {
        throw new Error(`Barème non trouvé pour le barreau ${barreauId}`);
      }

      let honorairesBase = 0;
      const details: string[] = [];

      // Déterminer les honoraires de base selon le type de prestation
      if (typePrestation === 'consultation') {
        honorairesBase = complexite === 'simple' ? bareme.consultations.simple : bareme.consultations.complexe;
        details.push(`Consultation ${complexite}: ${honorairesBase} DA`);
      } else if (bareme.procedures[typePrestation as keyof typeof bareme.procedures]) {
        honorairesBase = bareme.procedures[typePrestation as keyof typeof bareme.procedures];
        details.push(`${typePrestation}: ${honorairesBase} DA`);
      } else if (bareme.contrats[typePrestation as keyof typeof bareme.contrats]) {
        honorairesBase = bareme.contrats[typePrestation as keyof typeof bareme.contrats];
        details.push(`${typePrestation}: ${honorairesBase} DA`);
      } else {
        throw new Error(`Type de prestation non reconnu: ${typePrestation}`);
      }

      // Appliquer le coefficient de spécialité
      let coefficient = 1.0;
      if (specialite && bareme.coefficientsSpecialites[specialite]) {
        coefficient = bareme.coefficientsSpecialites[specialite];
        details.push(`Coefficient spécialité ${specialite}: x${coefficient}`);
      }

      const honorairesAjustes = honorairesBase * coefficient;

      // Calculer les frais de déplacement
      const totalFraisDeplacementParKm = distance ? distance * bareme.fraisDeplacementParKm : 0;
      if (totalFraisDeplacementParKm > 0) {
        details.push(`Frais déplacement (${distance} km): ${totalFraisDeplacementParKm} DA`);
      }

      // Calculer la TVA
      const sousTotal = honorairesAjustes + totalFraisDeplacementParKm;
      const tva = sousTotal * (bareme.tauxTVA / 100);
      const totalTTC = sousTotal + tva;

      details.push(`Sous-total HT: ${sousTotal} DA`);
      details.push(`TVA (${bareme.tauxTVA}%): ${tva} DA`);
      details.push(`Total TTC: ${totalTTC} DA`);

      return {
        honorairesBase,
        coefficient,
        honorairesAjustes,
        fraisDeplacementParKm: bareme.fraisDeplacementParKm,
        totalFraisDeplacementParKm,
        tva,
        totalTTC,
        devise: 'DA',
        details
      };

    } catch (error) {
      logger.error('Erreur lors du calcul des honoraires algériens:', error);
      throw error;
    }
  }

  /**
   * Obtient les spécificités d'un tribunal
   */
  async getCourtSpecificities(tribunalId: string): Promise<AlgerianCourt | null> {
    try {
      const query = 'SELECT * FROM algerian_courts WHERE id = $1 AND is_active = true';
      const result = await this.db.query(query, [tribunalId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        nameArabic: row.name_arabic,
        type: row.type,
        wilaya: row.wilaya,
        ville: row.ville,
        adresse: row.adresse,
        telephone: row.telephone,
        email: row.email,
        president: row.president,
        procureur: row.procureur,
        greffierChef: row.greffier_chef,
        specialites: JSON.parse(row.specialites || '[]'),
        horaires: JSON.parse(row.horaires),
        calendrierJudiciaire: JSON.parse(row.calendrier_judiciaire),
        isActive: row.is_active
      };

    } catch (error) {
      logger.error('Erreur lors de la récupération des spécificités du tribunal:', error);
      return null;
    }
  }

  // Méthodes privées

  private async createSpecificitiesTables(): Promise<void> {
    // Table des tribunaux algériens
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS algerian_courts (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        name_arabic VARCHAR(500),
        type VARCHAR(100) NOT NULL,
        wilaya VARCHAR(100) NOT NULL,
        ville VARCHAR(100) NOT NULL,
        adresse TEXT,
        telephone VARCHAR(50),
        email VARCHAR(255),
        president VARCHAR(255),
        procureur VARCHAR(255),
        greffier_chef VARCHAR(255),
        specialites JSONB DEFAULT '[]'::jsonb,
        horaires JSONB NOT NULL,
        calendrier_judiciaire JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des barreaux algériens
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS algerian_barreaux (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        name_arabic VARCHAR(500),
        wilaya VARCHAR(100) NOT NULL,
        ville VARCHAR(100) NOT NULL,
        adresse TEXT,
        telephone VARCHAR(50),
        email VARCHAR(255),
        site_web VARCHAR(255),
        batonnier VARCHAR(255) NOT NULL,
        secretaire_general VARCHAR(255),
        tresorier VARCHAR(255),
        nombre_avocats INTEGER DEFAULT 0,
        baremes JSONB NOT NULL,
        reglement_interieur TEXT,
        specialites JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des procédures spécifiques
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS specific_procedures (
        id VARCHAR(255) PRIMARY KEY,
        nom VARCHAR(500) NOT NULL,
        nom_arabe VARCHAR(500),
        tribunal VARCHAR(100) NOT NULL,
        domaine VARCHAR(50) NOT NULL,
        etapes JSONB NOT NULL,
        delais JSONB NOT NULL,
        documents JSONB NOT NULL,
        frais JSONB NOT NULL,
        specificites JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table du calendrier judiciaire
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS judicial_calendar (
        annee INTEGER PRIMARY KEY,
        jours_ouvres JSONB NOT NULL,
        jours_chomes JSONB NOT NULL,
        vacances_judiciaires JSONB NOT NULL,
        evenements_speciaux JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Index pour les recherches
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_courts_wilaya ON algerian_courts (wilaya)
    `);
    
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_barreaux_wilaya ON algerian_barreaux (wilaya)
    `);
  }

  private async saveAlgerianCourt(court: AlgerianCourt): Promise<void> {
    const query = `
      INSERT INTO algerian_courts (
        id, name, name_arabic, type, wilaya, ville, adresse, telephone, email,
        president, procureur, greffier_chef, specialites, horaires, 
        calendrier_judiciaire, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        name_arabic = EXCLUDED.name_arabic,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.db.query(query, [
      court.id, court.name, court.nameArabic, court.type, court.wilaya, court.ville,
      court.adresse, court.telephone, court.email, court.president, court.procureur,
      court.greffierChef, JSON.stringify(court.specialites), JSON.stringify(court.horaires),
      JSON.stringify(court.calendrierJudiciaire), court.isActive
    ]);
  }

  private async saveAlgerianBarreau(barreau: AlgerianBarreau): Promise<void> {
    const query = `
      INSERT INTO algerian_barreaux (
        id, name, name_arabic, wilaya, ville, adresse, telephone, email, site_web,
        batonnier, secretaire_general, tresorier, nombre_avocats, baremes,
        reglement_interieur, specialites, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        batonnier = EXCLUDED.batonnier,
        baremes = EXCLUDED.baremes,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.db.query(query, [
      barreau.id, barreau.name, barreau.nameArabic, barreau.wilaya, barreau.ville,
      barreau.adresse, barreau.telephone, barreau.email, barreau.siteWeb,
      barreau.batonnier, barreau.secretaireGeneral, barreau.tresorier,
      barreau.nombreAvocats, JSON.stringify(barreau.baremes), barreau.reglementInterieur,
      JSON.stringify(barreau.specialites), barreau.isActive
    ]);
  }

  private async saveSpecificProcedure(procedure: ProcedureSpecifique): Promise<void> {
    const query = `
      INSERT INTO specific_procedures (
        id, nom, nom_arabe, tribunal, domaine, etapes, delais, documents, frais, specificites
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        nom = EXCLUDED.nom,
        etapes = EXCLUDED.etapes,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.db.query(query, [
      procedure.id, procedure.nom, procedure.nomArabe, procedure.tribunal, procedure.domaine,
      JSON.stringify(procedure.etapes), JSON.stringify(procedure.delais),
      JSON.stringify(procedure.documents), JSON.stringify(procedure.frais),
      JSON.stringify(procedure.specificites)
    ]);
  }

  private async saveJudicialCalendar(calendar: CalendrierJudiciaire): Promise<void> {
    const query = `
      INSERT INTO judicial_calendar (
        annee, jours_ouvres, jours_chomes, vacances_judiciaires, evenements_speciaux
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (annee) DO UPDATE SET
        jours_ouvres = EXCLUDED.jours_ouvres,
        jours_chomes = EXCLUDED.jours_chomes,
        vacances_judiciaires = EXCLUDED.vacances_judiciaires,
        evenements_speciaux = EXCLUDED.evenements_speciaux,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.db.query(query, [
      calendar.annee,
      JSON.stringify(calendar.joursOuvres),
      JSON.stringify(calendar.joursChomes),
      JSON.stringify(calendar.vacancesJudiciaires),
      JSON.stringify(calendar.evenementsSpeciaux)
    ]);
  }

  private generateWorkingDays(year: number): Date[] {
    const workingDays: Date[] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // En Algérie, les jours ouvrés sont du dimanche au jeudi
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 5 && dayOfWeek !== 6) { // Pas vendredi (5) ni samedi (6)
        workingDays.push(new Date(date));
      }
    }

    return workingDays;
  }

  private isHoliday(date: Date): boolean {
    if (!this.calendrierJudiciaire) return false;
    
    return this.calendrierJudiciaire.joursChomes.some(holiday => 
      holiday.toDateString() === date.toDateString()
    );
  }

  private getVacationPeriod(date: Date): VacationPeriod | null {
    if (!this.calendrierJudiciaire) return null;
    
    return this.calendrierJudiciaire.vacancesJudiciaires.find(vacation =>
      date >= vacation.dateDebut && date <= vacation.dateFin
    ) || null;
  }

  private isRamadanPeriod(startDate: Date, endDate: Date): boolean {
    // Logique simplifiée - en production, intégrer avec un calendrier islamique
    const currentYear = startDate.getFullYear();
    const ramadanStart = new Date(currentYear, 3, 1); // Approximation
    const ramadanEnd = new Date(currentYear, 4, 1);
    
    return (startDate <= ramadanEnd && endDate >= ramadanStart);
  }
}

export const algerianSpecificitiesService = new AlgerianSpecificitiesService();