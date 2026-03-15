/**
 * Search service — local implementation (no backend API required)
 * Provides jurisprudence and legal text search using local data.
 * Enriched with real Algerian legal references.
 */
import type {
  SearchQuery,
  SearchResult,
  JurisprudenceResult,
  LegalText,
  LegalDomain,
  Jurisdiction,
} from '../types/search';

// ─── Static filter options ────────────────────────────────────────────────────

const DOMAINS: LegalDomain[] = [
  'civil', 'penal', 'commercial', 'administratif',
  'travail', 'famille', 'immobilier', 'fiscal',
  'constitutionnel', 'international',
];

const JURISDICTIONS: Jurisdiction[] = [
  'cour_supreme', 'conseil_etat', 'tribunal_administratif',
  'cour_appel', 'tribunal', 'tribunal_commerce',
];

// ─── Mock jurisprudence data ──────────────────────────────────────────────────

const MOCK_JURISPRUDENCE: JurisprudenceResult[] = [
  // ── Droit Civil ──────────────────────────────────────────────────────────
  {
    id: 'j1',
    caseNumber: 'CS/Civ/2022/1234',
    date: '2022-03-15',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'civil',
    summary: 'Responsabilité contractuelle — dommages-intérêts. La Cour Suprême rappelle que la mise en demeure préalable est une condition de fond pour l\'engagement de la responsabilité contractuelle et l\'octroi de dommages-intérêts (Art. 176 C.Civ).',
    keywords: ['responsabilité contractuelle', 'dommages-intérêts', 'mise en demeure', 'Art. 176 C.Civ'],
    precedentValue: 'binding',
    relevanceScore: 0.95,
    citations: [{ reference: 'Art. 176 C.Civ', text: 'Mise en demeure préalable obligatoire' }],
  },
  {
    id: 'j2',
    caseNumber: 'CS/Civ/2021/889',
    date: '2021-06-10',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'civil',
    summary: 'Nullité du contrat pour vice du consentement — dol. La Cour confirme que le dol doit être déterminant et émaner du cocontractant pour entraîner la nullité relative du contrat (Art. 86 C.Civ).',
    keywords: ['nullité', 'vice du consentement', 'dol', 'contrat', 'Art. 86 C.Civ'],
    precedentValue: 'binding',
    relevanceScore: 0.90,
    citations: [{ reference: 'Art. 86 C.Civ', text: 'Dol déterminant du consentement' }],
  },
  {
    id: 'j3',
    caseNumber: 'CA/ALGER/2023/445',
    date: '2023-04-20',
    court: { id: 'ca-alger', name: 'Cour d\'Appel d\'Alger', jurisdiction: 'cour_appel' },
    legalDomain: 'civil',
    summary: 'Prescription extinctive — interruption par reconnaissance de dette. La Cour d\'Appel juge que la reconnaissance de dette par le débiteur interrompt le délai de prescription décennale (Art. 317 C.Civ).',
    keywords: ['prescription', 'interruption', 'reconnaissance de dette', 'Art. 317 C.Civ'],
    precedentValue: 'persuasive',
    relevanceScore: 0.82,
  },
  {
    id: 'j4',
    caseNumber: 'CS/Civ/2020/2201',
    date: '2020-09-05',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'civil',
    summary: 'Responsabilité délictuelle — accident de la circulation. Application de la loi 88-31 sur les accidents de la route : présomption de responsabilité du gardien du véhicule, renversement de la charge de la preuve.',
    keywords: ['responsabilité délictuelle', 'accident circulation', 'loi 88-31', 'gardien', 'présomption'],
    precedentValue: 'binding',
    relevanceScore: 0.88,
    citations: [{ reference: 'Loi 88-31', text: 'Accidents de la circulation routière' }],
  },
  {
    id: 'j5',
    caseNumber: 'CS/Civ/2023/3301',
    date: '2023-01-25',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'civil',
    summary: 'Exécution forcée — astreinte. La Cour Suprême admet le recours à l\'astreinte comme moyen de contrainte pour l\'exécution des obligations de faire, conformément aux articles 340 et suivants du CPCA.',
    keywords: ['exécution forcée', 'astreinte', 'obligation de faire', 'Art. 340 CPCA'],
    precedentValue: 'binding',
    relevanceScore: 0.85,
  },
  // ── Droit Commercial ─────────────────────────────────────────────────────
  {
    id: 'j6',
    caseNumber: 'TC/ALGER/2022/890',
    date: '2022-07-18',
    court: { id: 'tc-alger', name: 'Tribunal de Commerce d\'Alger', jurisdiction: 'tribunal_commerce' },
    legalDomain: 'commercial',
    summary: 'Résolution du contrat commercial pour inexécution — clause résolutoire. Le tribunal juge que la clause résolutoire expresse dispense le créancier de toute mise en demeure préalable dès lors que les conditions contractuelles sont réunies.',
    keywords: ['résolution', 'contrat commercial', 'clause résolutoire', 'inexécution', 'mise en demeure'],
    precedentValue: 'persuasive',
    relevanceScore: 0.82,
  },
  {
    id: 'j7',
    caseNumber: 'CS/Com/2021/567',
    date: '2021-11-20',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'commercial',
    summary: 'Faillite et liquidation judiciaire — déclaration de cessation des paiements. La Cour précise que le tribunal de commerce est seul compétent pour prononcer l\'ouverture de la procédure collective (Art. 215 C.Com).',
    keywords: ['faillite', 'liquidation judiciaire', 'cessation des paiements', 'Art. 215 C.Com', 'procédure collective'],
    precedentValue: 'binding',
    relevanceScore: 0.91,
    citations: [{ reference: 'Art. 215 C.Com', text: 'Compétence tribunal de commerce' }],
  },
  {
    id: 'j8',
    caseNumber: 'CA/ORAN/2022/334',
    date: '2022-05-12',
    court: { id: 'ca-oran', name: 'Cour d\'Appel d\'Oran', jurisdiction: 'cour_appel' },
    legalDomain: 'commercial',
    summary: 'Bail commercial — renouvellement et indemnité d\'éviction. La Cour rappelle que le bailleur qui refuse le renouvellement du bail commercial doit verser une indemnité d\'éviction au locataire commerçant (Art. 172 C.Com).',
    keywords: ['bail commercial', 'renouvellement', 'indemnité d\'éviction', 'Art. 172 C.Com', 'locataire commerçant'],
    precedentValue: 'persuasive',
    relevanceScore: 0.79,
  },
  {
    id: 'j9',
    caseNumber: 'CS/Com/2023/1102',
    date: '2023-09-14',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'commercial',
    summary: 'SARL — responsabilité du gérant pour faute de gestion. La Cour Suprême retient la responsabilité personnelle du gérant de SARL qui a commis des fautes de gestion ayant causé un préjudice à la société (Art. 566 C.Com).',
    keywords: ['SARL', 'gérant', 'responsabilité', 'faute de gestion', 'Art. 566 C.Com'],
    precedentValue: 'binding',
    relevanceScore: 0.87,
  },
  // ── Droit du Travail ─────────────────────────────────────────────────────
  {
    id: 'j10',
    caseNumber: 'CS/Trav/2023/3301',
    date: '2023-01-25',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'travail',
    summary: 'Licenciement abusif — indemnisation du salarié. La Cour Suprême confirme que le licenciement sans motif valable ouvre droit à une indemnité calculée sur la base de l\'ancienneté (Art. 73 Loi 90-11).',
    keywords: ['licenciement abusif', 'indemnisation', 'ancienneté', 'Art. 73 Loi 90-11', 'motif valable'],
    precedentValue: 'binding',
    relevanceScore: 0.95,
    citations: [{ reference: 'Art. 73 Loi 90-11', text: 'Indemnité de licenciement abusif' }],
  },
  {
    id: 'j11',
    caseNumber: 'CA/CONSTANTINE/2022/678',
    date: '2022-10-05',
    court: { id: 'ca-constantine', name: 'Cour d\'Appel de Constantine', jurisdiction: 'cour_appel' },
    legalDomain: 'travail',
    summary: 'Contrat de travail à durée déterminée — requalification en CDI. La Cour juge que le recours abusif aux CDD successifs pour des tâches permanentes entraîne la requalification en contrat à durée indéterminée (Art. 12 Loi 90-11).',
    keywords: ['CDD', 'CDI', 'requalification', 'contrat de travail', 'Art. 12 Loi 90-11'],
    precedentValue: 'persuasive',
    relevanceScore: 0.88,
  },
  {
    id: 'j12',
    caseNumber: 'CS/Trav/2021/2890',
    date: '2021-04-15',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'travail',
    summary: 'Accident du travail — faute inexcusable de l\'employeur. La Cour retient la faute inexcusable de l\'employeur qui n\'a pas pris les mesures de sécurité nécessaires, ouvrant droit à une majoration de la rente (Loi 83-13).',
    keywords: ['accident du travail', 'faute inexcusable', 'employeur', 'sécurité', 'Loi 83-13'],
    precedentValue: 'binding',
    relevanceScore: 0.86,
  },
  // ── Droit de la Famille ──────────────────────────────────────────────────
  {
    id: 'j13',
    caseNumber: 'CS/Fam/2022/1567',
    date: '2022-08-22',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'famille',
    summary: 'Divorce — garde des enfants et pension alimentaire. La Cour Suprême rappelle que la garde est accordée en priorité à la mère pour les enfants en bas âge, sauf intérêt supérieur de l\'enfant (Art. 64 CF).',
    keywords: ['divorce', 'garde des enfants', 'pension alimentaire', 'Art. 64 CF', 'intérêt de l\'enfant'],
    precedentValue: 'binding',
    relevanceScore: 0.92,
    citations: [{ reference: 'Art. 64 CF', text: 'Garde des enfants après divorce' }],
  },
  {
    id: 'j14',
    caseNumber: 'CA/ALGER/2023/789',
    date: '2023-03-10',
    court: { id: 'ca-alger', name: 'Cour d\'Appel d\'Alger', jurisdiction: 'cour_appel' },
    legalDomain: 'famille',
    summary: 'Succession — partage des biens héréditaires. La Cour applique les règles du droit musulman (fiqh) codifiées dans le Code de la Famille pour le calcul des parts successorales entre héritiers (Art. 126 CF).',
    keywords: ['succession', 'partage', 'héritiers', 'Art. 126 CF', 'droit musulman', 'fiqh'],
    precedentValue: 'persuasive',
    relevanceScore: 0.84,
  },
  {
    id: 'j15',
    caseNumber: 'CS/Fam/2020/3456',
    date: '2020-12-01',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'famille',
    summary: 'Khol\' — dissolution du mariage à la demande de l\'épouse. La Cour précise les conditions du khol\' et l\'obligation de restitution de la dot (mahr) par l\'épouse (Art. 54 CF).',
    keywords: ['khol\'', 'dissolution mariage', 'épouse', 'mahr', 'dot', 'Art. 54 CF'],
    precedentValue: 'binding',
    relevanceScore: 0.80,
  },
  // ── Droit Administratif ──────────────────────────────────────────────────
  {
    id: 'j16',
    caseNumber: 'CE/2021/567',
    date: '2021-11-20',
    court: { id: 'ce', name: 'Conseil d\'État', jurisdiction: 'conseil_etat' },
    legalDomain: 'administratif',
    summary: 'Excès de pouvoir — annulation d\'un acte administratif. Le Conseil d\'État annule un arrêté préfectoral pour détournement de pouvoir, l\'autorité administrative ayant utilisé ses prérogatives à des fins étrangères à l\'intérêt général.',
    keywords: ['excès de pouvoir', 'acte administratif', 'annulation', 'détournement de pouvoir', 'intérêt général'],
    precedentValue: 'binding',
    relevanceScore: 0.93,
  },
  {
    id: 'j17',
    caseNumber: 'CE/2022/1234',
    date: '2022-06-15',
    court: { id: 'ce', name: 'Conseil d\'État', jurisdiction: 'conseil_etat' },
    legalDomain: 'administratif',
    summary: 'Marchés publics — résiliation pour faute du titulaire. Le Conseil d\'État confirme le droit de l\'administration de résilier unilatéralement un marché public en cas de manquements graves du titulaire (Décret 15-247).',
    keywords: ['marchés publics', 'résiliation', 'faute', 'administration', 'Décret 15-247'],
    precedentValue: 'binding',
    relevanceScore: 0.89,
    citations: [{ reference: 'Décret 15-247', text: 'Marchés publics — résiliation unilatérale' }],
  },
  {
    id: 'j18',
    caseNumber: 'TA/ALGER/2023/456',
    date: '2023-07-20',
    court: { id: 'ta-alger', name: 'Tribunal Administratif d\'Alger', jurisdiction: 'tribunal_administratif' },
    legalDomain: 'administratif',
    summary: 'Responsabilité de l\'État — dommages causés par les travaux publics. Le tribunal retient la responsabilité sans faute de l\'État pour les dommages causés aux riverains par des travaux de voirie (Art. 140 C.Civ).',
    keywords: ['responsabilité État', 'travaux publics', 'dommages', 'riverains', 'Art. 140 C.Civ'],
    precedentValue: 'persuasive',
    relevanceScore: 0.78,
  },
  // ── Droit Pénal ──────────────────────────────────────────────────────────
  {
    id: 'j19',
    caseNumber: 'CS/Pen/2022/4501',
    date: '2022-11-08',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'penal',
    summary: 'Escroquerie — éléments constitutifs. La Cour Suprême rappelle que l\'escroquerie requiert la réunion de manœuvres frauduleuses, d\'une remise de fonds et d\'un préjudice (Art. 372 C.Pén).',
    keywords: ['escroquerie', 'manœuvres frauduleuses', 'préjudice', 'Art. 372 C.Pén'],
    precedentValue: 'binding',
    relevanceScore: 0.87,
    citations: [{ reference: 'Art. 372 C.Pén', text: 'Éléments constitutifs de l\'escroquerie' }],
  },
  {
    id: 'j20',
    caseNumber: 'CS/Pen/2023/2234',
    date: '2023-05-30',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'penal',
    summary: 'Abus de confiance — détournement de fonds. La Cour confirme la condamnation pour abus de confiance, l\'élément moral étant caractérisé par la conscience du détournement (Art. 376 C.Pén).',
    keywords: ['abus de confiance', 'détournement', 'fonds', 'Art. 376 C.Pén', 'élément moral'],
    precedentValue: 'binding',
    relevanceScore: 0.84,
  },
  // ── Droit Immobilier ─────────────────────────────────────────────────────
  {
    id: 'j21',
    caseNumber: 'CS/Civ/2022/3456',
    date: '2022-09-12',
    court: { id: 'cs', name: 'Cour Suprême', jurisdiction: 'cour_supreme' },
    legalDomain: 'immobilier',
    summary: 'Vente immobilière — publicité foncière et opposabilité aux tiers. La Cour rappelle que la vente immobilière n\'est opposable aux tiers qu\'après accomplissement des formalités de publicité foncière (Art. 793 C.Civ).',
    keywords: ['vente immobilière', 'publicité foncière', 'opposabilité', 'Art. 793 C.Civ', 'tiers'],
    precedentValue: 'binding',
    relevanceScore: 0.91,
    citations: [{ reference: 'Art. 793 C.Civ', text: 'Publicité foncière obligatoire' }],
  },
  {
    id: 'j22',
    caseNumber: 'CA/ALGER/2021/1123',
    date: '2021-08-18',
    court: { id: 'ca-alger', name: 'Cour d\'Appel d\'Alger', jurisdiction: 'cour_appel' },
    legalDomain: 'immobilier',
    summary: 'Bail d\'habitation — expulsion du locataire défaillant. La Cour confirme l\'expulsion après résiliation judiciaire du bail pour non-paiement de loyers, sous réserve du respect du délai de grâce (Loi 07-05).',
    keywords: ['bail habitation', 'expulsion', 'locataire', 'non-paiement', 'Loi 07-05', 'délai de grâce'],
    precedentValue: 'persuasive',
    relevanceScore: 0.83,
  },
  // ── Droit Fiscal ─────────────────────────────────────────────────────────
  {
    id: 'j23',
    caseNumber: 'CE/2022/890',
    date: '2022-04-25',
    court: { id: 'ce', name: 'Conseil d\'État', jurisdiction: 'conseil_etat' },
    legalDomain: 'fiscal',
    summary: 'Redressement fiscal — charge de la preuve. Le Conseil d\'État rappelle que la charge de la preuve incombe à l\'administration fiscale pour les redressements notifiés, le contribuable devant ensuite apporter la preuve contraire (Art. 19 CPF).',
    keywords: ['redressement fiscal', 'charge de la preuve', 'administration fiscale', 'Art. 19 CPF', 'contribuable'],
    precedentValue: 'binding',
    relevanceScore: 0.86,
  },
];

// ─── Mock legal texts data ────────────────────────────────────────────────────

const MOCK_LEGAL_TEXTS: LegalText[] = [
  // ── Codes fondamentaux ───────────────────────────────────────────────────
  {
    id: 'lt1',
    reference: 'Ordonnance 75-58 du 26/09/1975',
    title: 'Code Civil Algérien',
    domain: 'civil',
    publicationDate: '1975-09-26',
    content: 'Code civil algérien régissant les obligations, contrats, responsabilité civile, droits réels, successions et sûretés. Modifié par les ordonnances 05-10 et 07-05. Comprend les règles générales sur la formation et l\'exécution des contrats, la responsabilité délictuelle et contractuelle, les droits réels immobiliers et mobiliers.',
    joraReference: 'JORA n°78 du 30/09/1975',
  },
  {
    id: 'lt2',
    reference: 'Loi 08-09 du 25/02/2008',
    title: 'Code de Procédure Civile et Administrative (CPCA)',
    domain: 'civil',
    publicationDate: '2008-02-25',
    content: 'Procédures civiles et administratives devant les juridictions algériennes. Régit la compétence des tribunaux, les délais de procédure (appel 30 jours, cassation 60 jours, opposition 15 jours), les voies d\'exécution, les mesures conservatoires et les procédures d\'urgence (référé).',
    joraReference: 'JORA n°21 du 23/04/2008',
  },
  {
    id: 'lt3',
    reference: 'Ordonnance 66-156 du 08/06/1966',
    title: 'Code Pénal Algérien',
    domain: 'penal',
    publicationDate: '1966-06-08',
    content: 'Infractions et peines applicables en droit pénal algérien. Définit les crimes, délits et contraventions. Comprend les infractions contre les personnes (homicide, coups et blessures), contre les biens (vol, escroquerie Art. 372, abus de confiance Art. 376, détournement), les infractions économiques et financières.',
    joraReference: 'JORA n°49 du 11/06/1966',
  },
  {
    id: 'lt4',
    reference: 'Loi 90-11 du 21/04/1990',
    title: 'Loi relative aux relations de travail',
    domain: 'travail',
    publicationDate: '1990-04-21',
    content: 'Relations individuelles et collectives de travail en Algérie. Régit le contrat de travail (CDI/CDD Art. 12), les conditions de travail, la durée légale (40h/semaine), le licenciement (Art. 73 — indemnité pour licenciement abusif), la prescription biennale des actions en justice, les congés payés et la protection de la maternité.',
    joraReference: 'JORA n°17 du 25/04/1990',
  },
  {
    id: 'lt5',
    reference: 'Loi 07-11 du 25/11/2007',
    title: 'Code de Procédure Pénale (CPP)',
    domain: 'penal',
    publicationDate: '2007-11-25',
    content: 'Procédures pénales algériennes : instruction préparatoire, mise en examen, détention provisoire, jugement correctionnel et criminel, voies de recours (appel 10 jours Art. 418, pourvoi en cassation 8 jours Art. 495). Régit les droits de la défense et les garanties du procès équitable.',
    joraReference: 'JORA n°76 du 25/11/2007',
  },
  {
    id: 'lt6',
    reference: 'Loi 84-11 du 09/06/1984',
    title: 'Code de la Famille (CF)',
    domain: 'famille',
    publicationDate: '1984-06-09',
    content: 'Droit de la famille algérien fondé sur la charia islamique. Régit le mariage, le divorce (talaq, khol\' Art. 54, divorce judiciaire), la garde des enfants (Art. 64 — priorité à la mère), la pension alimentaire, la filiation, la kafala, les successions (Art. 126 — règles de dévolution successorale islamique) et le testament (wasiya).',
    joraReference: 'JORA n°24 du 12/06/1984',
  },
  {
    id: 'lt7',
    reference: 'Décret législatif 93-08 du 25/04/1993',
    title: 'Code de Commerce Algérien',
    domain: 'commercial',
    publicationDate: '1993-04-25',
    content: 'Droit commercial algérien : actes de commerce, commerçants, registre de commerce, sociétés commerciales (SARL Art. 566 — responsabilité du gérant, SPA, SNC), fonds de commerce, bail commercial (Art. 172 — indemnité d\'éviction), effets de commerce, procédures collectives (Art. 215 — faillite, liquidation judiciaire), prescription commerciale 5 ans.',
    joraReference: 'JORA n°27 du 27/04/1993',
  },
  {
    id: 'lt8',
    reference: 'Loi 90-25 du 18/11/1990',
    title: 'Loi portant orientation foncière',
    domain: 'immobilier',
    publicationDate: '1990-11-18',
    content: 'Régime foncier algérien : propriété privée, domaine national, terres agricoles, cession et acquisition de biens immobiliers. Établit les règles de la publicité foncière et de l\'opposabilité aux tiers des droits réels immobiliers.',
    joraReference: 'JORA n°49 du 18/11/1990',
  },
  {
    id: 'lt9',
    reference: 'Ordonnance 75-74 du 12/11/1975',
    title: 'Code de l\'Enregistrement',
    domain: 'fiscal',
    publicationDate: '1975-11-12',
    content: 'Droits d\'enregistrement applicables aux actes notariés, mutations immobilières, cessions de fonds de commerce et parts sociales. Taux applicables aux actes civils et commerciaux. Obligations déclaratives des notaires et huissiers.',
    joraReference: 'JORA n°91 du 18/11/1975',
  },
  {
    id: 'lt10',
    reference: 'Loi 06-01 du 20/02/2006',
    title: 'Loi relative à la prévention et à la lutte contre la corruption',
    domain: 'penal',
    publicationDate: '2006-02-20',
    content: 'Prévention et répression de la corruption en Algérie. Définit les infractions de corruption active et passive, le trafic d\'influence, le détournement de fonds publics, l\'enrichissement illicite. Crée l\'Organe National de Prévention et de Lutte contre la Corruption (ONPLC).',
    joraReference: 'JORA n°14 du 08/03/2006',
  },
  {
    id: 'lt11',
    reference: 'Loi 05-02 du 06/02/2005',
    title: 'Loi modifiant et complétant le Code Civil — Hypothèque et sûretés',
    domain: 'civil',
    publicationDate: '2005-02-06',
    content: 'Réforme du régime des sûretés réelles en droit algérien : hypothèque conventionnelle et légale, nantissement, gage, antichrèse. Renforcement de la protection des créanciers hypothécaires et des règles de publicité foncière.',
    joraReference: 'JORA n°11 du 09/02/2005',
  },
  {
    id: 'lt12',
    reference: 'Décret exécutif 15-247 du 16/09/2015',
    title: 'Réglementation des marchés publics',
    domain: 'administratif',
    publicationDate: '2015-09-16',
    content: 'Réglementation des marchés publics et délégations de service public en Algérie. Régit les procédures de passation (appel d\'offres, gré à gré), l\'exécution, la résiliation unilatérale par l\'administration, les pénalités de retard, le règlement des litiges et la commission des marchés.',
    joraReference: 'JORA n°50 du 20/09/2015',
  },
  {
    id: 'lt13',
    reference: 'Loi 83-13 du 02/07/1983',
    title: 'Loi relative aux accidents du travail et maladies professionnelles',
    domain: 'travail',
    publicationDate: '1983-07-02',
    content: 'Régime de réparation des accidents du travail et maladies professionnelles en Algérie. Définit l\'accident du travail, la faute inexcusable de l\'employeur, les rentes d\'incapacité, les prestations en nature et en espèces, et les recours contre les tiers responsables.',
    joraReference: 'JORA n°28 du 05/07/1983',
  },
  {
    id: 'lt14',
    reference: 'Loi 88-31 du 19/07/1988',
    title: 'Loi relative aux accidents de la circulation routière',
    domain: 'civil',
    publicationDate: '1988-07-19',
    content: 'Régime d\'indemnisation des victimes d\'accidents de la circulation en Algérie. Instaure une présomption de responsabilité du gardien du véhicule, un fonds de garantie automobile, et des règles spéciales d\'évaluation du préjudice corporel.',
    joraReference: 'JORA n°29 du 20/07/1988',
  },
  {
    id: 'lt15',
    reference: 'Ordonnance 03-11 du 26/08/2003',
    title: 'Loi relative à la monnaie et au crédit',
    domain: 'commercial',
    publicationDate: '2003-08-26',
    content: 'Régulation bancaire et financière en Algérie. Régit les établissements de crédit, la Banque d\'Algérie, les opérations bancaires, le crédit, les instruments de paiement, le contrôle des changes et la lutte contre le blanchiment d\'argent.',
    joraReference: 'JORA n°52 du 27/08/2003',
  },
  {
    id: 'lt16',
    reference: 'Loi 07-05 du 13/05/2007',
    title: 'Loi relative à la location à usage d\'habitation',
    domain: 'immobilier',
    publicationDate: '2007-05-13',
    content: 'Régime juridique de la location à usage d\'habitation en Algérie. Régit la formation du contrat de bail, les obligations du bailleur et du locataire, le loyer, les charges, la résiliation, l\'expulsion et les délais de grâce accordés au locataire défaillant.',
    joraReference: 'JORA n°31 du 13/05/2007',
  },
  {
    id: 'lt17',
    reference: 'Loi 04-02 du 23/06/2004',
    title: 'Loi fixant les règles applicables aux pratiques commerciales',
    domain: 'commercial',
    publicationDate: '2004-06-23',
    content: 'Protection du consommateur et régulation des pratiques commerciales en Algérie. Interdit les pratiques déloyales, la publicité mensongère, les ventes forcées. Régit les garanties légales, le service après-vente et les sanctions applicables aux professionnels.',
    joraReference: 'JORA n°41 du 27/06/2004',
  },
  {
    id: 'lt18',
    reference: 'Loi 09-01 du 25/02/2009',
    title: 'Code des Procédures Fiscales (CPF)',
    domain: 'fiscal',
    publicationDate: '2009-02-25',
    content: 'Procédures fiscales algériennes : vérification de comptabilité, contrôle fiscal, redressement (Art. 19 — charge de la preuve), contentieux fiscal, délais de prescription, garanties du contribuable, recours hiérarchique et juridictionnel devant le Conseil d\'État.',
    joraReference: 'JORA n°15 du 08/03/2009',
  },
];

// ─── Suggestion keywords ──────────────────────────────────────────────────────

const SUGGESTION_KEYWORDS = [
  'responsabilité civile', 'responsabilité contractuelle', 'responsabilité délictuelle',
  'contrat de travail', 'licenciement abusif', 'CDD CDI requalification',
  'divorce', 'garde des enfants', 'pension alimentaire', 'succession', 'khol\'',
  'faillite', 'liquidation judiciaire', 'procédure collective',
  'appel', 'cassation', 'opposition', 'prescription',
  'excès de pouvoir', 'acte administratif', 'marchés publics',
  'dommages-intérêts', 'résolution du contrat', 'nullité', 'exécution forcée',
  'saisie', 'hypothèque', 'bail commercial', 'bail habitation', 'expulsion',
  'SARL', 'SPA', 'gérant', 'associés', 'fonds de commerce',
  'escroquerie', 'abus de confiance', 'corruption', 'détournement',
  'vente immobilière', 'publicité foncière', 'redressement fiscal',
  'accident du travail', 'accident circulation', 'mise en demeure',
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function scoreMatch(text: string, query: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return 1;
  const words = q.split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return 0;
  const matched = words.filter(w => t.includes(w)).length;
  return matched / words.length;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class SearchService {
  async searchJurisprudence(query: SearchQuery): Promise<SearchResult<JurisprudenceResult>> {
    const q = query.text.toLowerCase();
    const results = MOCK_JURISPRUDENCE
      .filter(j => {
        if (query.filters?.domain && j.legalDomain !== query.filters.domain) return false;
        if (query.filters?.jurisdiction && j.court.jurisdiction !== query.filters.jurisdiction) return false;
        if (query.filters?.dateFrom && j.date < query.filters.dateFrom) return false;
        if (query.filters?.dateTo && j.date > query.filters.dateTo) return false;
        const score =
          scoreMatch(j.summary || '', q) +
          scoreMatch((j.keywords || []).join(' '), q) +
          scoreMatch(j.caseNumber, q);
        return score > 0;
      })
      .sort((a, b) => {
        if (query.sort === 'date_desc') return b.date.localeCompare(a.date);
        if (query.sort === 'date_asc') return a.date.localeCompare(b.date);
        return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
      })
      .slice(0, query.pageSize ?? 50);

    return {
      query,
      items: results,
      total: results.length,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 50,
      took: Math.floor(Math.random() * 20) + 5,
    };
  }

  async searchLegalTexts(query: SearchQuery): Promise<SearchResult<LegalText>> {
    const q = query.text.toLowerCase();
    const results = MOCK_LEGAL_TEXTS
      .filter(t => {
        if (query.filters?.domain && t.domain !== query.filters.domain) return false;
        if (query.filters?.dateFrom && t.publicationDate < query.filters.dateFrom) return false;
        if (query.filters?.dateTo && t.publicationDate > query.filters.dateTo) return false;
        const score =
          scoreMatch(t.title, q) +
          scoreMatch(t.content, q) +
          scoreMatch(t.reference, q);
        return score > 0;
      })
      .slice(0, query.pageSize ?? 50);

    return {
      query,
      items: results,
      total: results.length,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 50,
      took: Math.floor(Math.random() * 10) + 3,
    };
  }

  async getSearchSuggestions(partialQuery: string): Promise<string[]> {
    if (partialQuery.length < 2) return [];
    const q = partialQuery.toLowerCase();
    return SUGGESTION_KEYWORDS
      .filter(k => k.toLowerCase().includes(q))
      .slice(0, 6);
  }

  async getSearchFilters(): Promise<{ domains: LegalDomain[]; jurisdictions: Jurisdiction[] }> {
    return { domains: DOMAINS, jurisdictions: JURISDICTIONS };
  }
}

export const searchService = new SearchService();
