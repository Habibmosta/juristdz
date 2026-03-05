/**
 * Configuration professionnelle pour chaque métier juridique algérien
 * Chaque profession a son propre vocabulaire, ses types de dossiers, et ses workflows
 */

import { UserRole } from '../types';

export interface ProfessionConfig {
  role: UserRole;
  
  // Terminologie spécifique
  terminology: {
    dossier: string;           // "Dossier", "Acte", "Exploit", etc.
    dossiers: string;          // Pluriel
    nouveauDossier: string;    // "Nouveau dossier", "Nouvel acte", etc.
    client: string;            // "Client", "Partie", "Requérant", etc.
    clients: string;           // Pluriel
    document: string;          // "Document", "Pièce", "Annexe", etc.
    documents: string;         // Pluriel
    evenement: string;         // "Événement", "Rendez-vous", "Audience", etc.
    evenements: string;        // Pluriel
  };

  // Types de dossiers spécifiques à la profession
  dossierTypes: Array<{
    value: string;
    labelFr: string;
    labelAr: string;
    description?: string;
    icon?: string;
  }>;

  // Statuts de dossiers spécifiques
  dossierStatuses: Array<{
    value: string;
    labelFr: string;
    labelAr: string;
    color: string;
  }>;

  // Types d'événements spécifiques
  eventTypes: Array<{
    value: string;
    labelFr: string;
    labelAr: string;
    icon?: string;
  }>;

  // Champs spécifiques du formulaire
  specificFields: Array<{
    name: string;
    labelFr: string;
    labelAr: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea';
    required?: boolean;
    options?: Array<{ value: string; labelFr: string; labelAr: string }>;
  }>;

  // Couleur principale de l'interface
  primaryColor: string;
  
  // Icône principale
  icon: string;
}

export const PROFESSION_CONFIGS: Record<UserRole, ProfessionConfig> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // AVOCAT - Défense et représentation
  // ═══════════════════════════════════════════════════════════════════════════
  [UserRole.AVOCAT]: {
    role: UserRole.AVOCAT,
    terminology: {
      dossier: 'Dossier',
      dossiers: 'Dossiers',
      nouveauDossier: 'Nouveau Dossier',
      client: 'Client',
      clients: 'Clients',
      document: 'Pièce',
      documents: 'Pièces',
      evenement: 'Événement',
      evenements: 'Agenda'
    },
    dossierTypes: [
      { value: 'civil', labelFr: 'Droit Civil', labelAr: 'القانون المدني', icon: '⚖️' },
      { value: 'penal', labelFr: 'Droit Pénal', labelAr: 'القانون الجنائي', icon: '🔨' },
      { value: 'commercial', labelFr: 'Droit Commercial', labelAr: 'القانون التجاري', icon: '💼' },
      { value: 'famille', labelFr: 'Droit de la Famille', labelAr: 'قانون الأسرة', icon: '👨‍👩‍👧' },
      { value: 'travail', labelFr: 'Droit du Travail', labelAr: 'قانون العمل', icon: '👔' },
      { value: 'administratif', labelFr: 'Droit Administratif', labelAr: 'القانون الإداري', icon: '🏛️' },
      { value: 'immobilier', labelFr: 'Droit Immobilier', labelAr: 'القانون العقاري', icon: '🏠' }
    ],
    dossierStatuses: [
      { value: 'nouveau', labelFr: 'Nouveau', labelAr: 'جديد', color: 'blue' },
      { value: 'en_cours', labelFr: 'En cours', labelAr: 'قيد المعالجة', color: 'yellow' },
      { value: 'audience', labelFr: 'En audience', labelAr: 'في الجلسة', color: 'orange' },
      { value: 'jugement', labelFr: 'En jugement', labelAr: 'في الحكم', color: 'purple' },
      { value: 'appel', labelFr: 'En appel', labelAr: 'في الاستئناف', color: 'indigo' },
      { value: 'cloture', labelFr: 'Clôturé', labelAr: 'مغلق', color: 'green' },
      { value: 'archive', labelFr: 'Archivé', labelAr: 'مؤرشف', color: 'gray' }
    ],
    eventTypes: [
      { value: 'audience', labelFr: 'Audience', labelAr: 'جلسة', icon: '⚖️' },
      { value: 'rdv_client', labelFr: 'RDV Client', labelAr: 'موعد مع العميل', icon: '👤' },
      { value: 'depot_piece', labelFr: 'Dépôt de pièce', labelAr: 'إيداع وثيقة', icon: '📄' },
      { value: 'echeance', labelFr: 'Échéance', labelAr: 'موعد نهائي', icon: '⏰' },
      { value: 'expertise', labelFr: 'Expertise', labelAr: 'خبرة', icon: '🔍' },
      { value: 'conciliation', labelFr: 'Conciliation', labelAr: 'مصالحة', icon: '🤝' }
    ],
    specificFields: [
      { name: 'tribunal', labelFr: 'Tribunal', labelAr: 'المحكمة', type: 'text' },
      { name: 'juge', labelFr: 'Juge', labelAr: 'القاضي', type: 'text' },
      { name: 'partie_adverse', labelFr: 'Partie adverse', labelAr: 'الطرف المقابل', type: 'text' },
      { name: 'avocat_adverse', labelFr: 'Avocat adverse', labelAr: 'محامي الطرف المقابل', type: 'text' }
    ],
    primaryColor: 'legal-gold',
    icon: '⚖️'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTAIRE - Actes authentiques et formalités
  // ═══════════════════════════════════════════════════════════════════════════
  [UserRole.NOTAIRE]: {
    role: UserRole.NOTAIRE,
    terminology: {
      dossier: 'Acte',
      dossiers: 'Actes',
      nouveauDossier: 'Nouvel Acte',
      client: 'Partie',
      clients: 'Parties',
      document: 'Annexe',
      documents: 'Annexes',
      evenement: 'Rendez-vous',
      evenements: 'Rendez-vous'
    },
    dossierTypes: [
      { value: 'vente', labelFr: 'Vente immobilière', labelAr: 'بيع عقاري', icon: '🏠' },
      { value: 'donation', labelFr: 'Donation', labelAr: 'هبة', icon: '🎁' },
      { value: 'succession', labelFr: 'Succession', labelAr: 'ميراث', icon: '👨‍👩‍👧‍👦' },
      { value: 'hypotheque', labelFr: 'Hypothèque', labelAr: 'رهن', icon: '🏦' },
      { value: 'constitution_societe', labelFr: 'Constitution de société', labelAr: 'تأسيس شركة', icon: '🏢' },
      { value: 'procuration', labelFr: 'Procuration', labelAr: 'توكيل', icon: '📝' },
      { value: 'contrat_mariage', labelFr: 'Contrat de mariage', labelAr: 'عقد زواج', icon: '💍' },
      { value: 'bail', labelFr: 'Bail notarié', labelAr: 'عقد إيجار موثق', icon: '🔑' }
    ],
    dossierStatuses: [
      { value: 'brouillon', labelFr: 'Brouillon', labelAr: 'مسودة', color: 'gray' },
      { value: 'en_preparation', labelFr: 'En préparation', labelAr: 'قيد التحضير', color: 'blue' },
      { value: 'verification', labelFr: 'Vérification', labelAr: 'التحقق', color: 'yellow' },
      { value: 'signature_prevue', labelFr: 'Signature prévue', labelAr: 'التوقيع المقرر', color: 'orange' },
      { value: 'signe', labelFr: 'Signé', labelAr: 'موقع', color: 'green' },
      { value: 'enregistre', labelFr: 'Enregistré', labelAr: 'مسجل', color: 'teal' },
      { value: 'archive', labelFr: 'Archivé', labelAr: 'مؤرشف', color: 'gray' }
    ],
    eventTypes: [
      { value: 'signature', labelFr: 'Signature d\'acte', labelAr: 'توقيع العقد', icon: '✍️' },
      { value: 'rdv_parties', labelFr: 'RDV avec les parties', labelAr: 'موعد مع الأطراف', icon: '👥' },
      { value: 'verification_pieces', labelFr: 'Vérification des pièces', labelAr: 'التحقق من الوثائق', icon: '🔍' },
      { value: 'enregistrement', labelFr: 'Enregistrement', labelAr: 'التسجيل', icon: '📋' },
      { value: 'conservation_fonciere', labelFr: 'Conservation foncière', labelAr: 'المحافظة العقارية', icon: '🏛️' }
    ],
    specificFields: [
      { name: 'numero_repertoire', labelFr: 'N° Répertoire', labelAr: 'رقم الذخيرة', type: 'text' },
      { name: 'numero_minute', labelFr: 'N° Minute', labelAr: 'رقم المحضر', type: 'text' },
      { name: 'lieu_signature', labelFr: 'Lieu de signature', labelAr: 'مكان التوقيع', type: 'text' },
      { name: 'frais_enregistrement', labelFr: 'Frais d\'enregistrement (DA)', labelAr: 'رسوم التسجيل (دج)', type: 'number' }
    ],
    primaryColor: 'amber-600',
    icon: '📜'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HUISSIER - Significations et exécutions
  // ═══════════════════════════════════════════════════════════════════════════
  [UserRole.HUISSIER]: {
    role: UserRole.HUISSIER,
    terminology: {
      dossier: 'Exploit',
      dossiers: 'Exploits',
      nouveauDossier: 'Nouvel Exploit',
      client: 'Requérant',
      clients: 'Requérants',
      document: 'Pièce',
      documents: 'Pièces',
      evenement: 'Mission',
      evenements: 'Missions'
    },
    dossierTypes: [
      { value: 'signification', labelFr: 'Signification', labelAr: 'تبليغ', icon: '📨' },
      { value: 'execution', labelFr: 'Exécution forcée', labelAr: 'تنفيذ جبري', icon: '⚡' },
      { value: 'constat', labelFr: 'Constat', labelAr: 'معاينة', icon: '📸' },
      { value: 'saisie', labelFr: 'Saisie', labelAr: 'حجز', icon: '🔒' },
      { value: 'expulsion', labelFr: 'Expulsion', labelAr: 'طرد', icon: '🚪' },
      { value: 'commandement', labelFr: 'Commandement de payer', labelAr: 'إنذار بالدفع', icon: '💰' },
      { value: 'protêt', labelFr: 'Protêt', labelAr: 'احتجاج', icon: '📋' }
    ],
    dossierStatuses: [
      { value: 'recu', labelFr: 'Reçu', labelAr: 'مستلم', color: 'blue' },
      { value: 'en_cours', labelFr: 'En cours', labelAr: 'قيد التنفيذ', color: 'yellow' },
      { value: 'execute', labelFr: 'Exécuté', labelAr: 'منفذ', color: 'green' },
      { value: 'infructueux', labelFr: 'Infructueux', labelAr: 'غير مثمر', color: 'red' },
      { value: 'reporte', labelFr: 'Reporté', labelAr: 'مؤجل', color: 'orange' },
      { value: 'archive', labelFr: 'Archivé', labelAr: 'مؤرشف', color: 'gray' }
    ],
    eventTypes: [
      { value: 'signification', labelFr: 'Signification', labelAr: 'تبليغ', icon: '📨' },
      { value: 'execution', labelFr: 'Exécution', labelAr: 'تنفيذ', icon: '⚡' },
      { value: 'constat', labelFr: 'Constat', labelAr: 'معاينة', icon: '📸' },
      { value: 'rdv_parties', labelFr: 'RDV parties', labelAr: 'موعد الأطراف', icon: '👥' }
    ],
    specificFields: [
      { name: 'destinataire', labelFr: 'Destinataire', labelAr: 'المرسل إليه', type: 'text', required: true },
      { name: 'adresse_signification', labelFr: 'Adresse de signification', labelAr: 'عنوان التبليغ', type: 'textarea', required: true },
      { name: 'frais_deplacement', labelFr: 'Frais de déplacement (DA)', labelAr: 'مصاريف التنقل (دج)', type: 'number' },
      { name: 'numero_titre', labelFr: 'N° Titre exécutoire', labelAr: 'رقم السند التنفيذي', type: 'text' }
    ],
    primaryColor: 'green-600',
    icon: '⚡'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MAGISTRAT - Jugements et décisions
  // ═══════════════════════════════════════════════════════════════════════════
  [UserRole.MAGISTRAT]: {
    role: UserRole.MAGISTRAT,
    terminology: {
      dossier: 'Affaire',
      dossiers: 'Affaires',
      nouveauDossier: 'Nouvelle Affaire',
      client: 'Partie',
      clients: 'Parties',
      document: 'Pièce',
      documents: 'Pièces du dossier',
      evenement: 'Audience',
      evenements: 'Audiences'
    },
    dossierTypes: [
      { value: 'civil', labelFr: 'Civil', labelAr: 'مدني', icon: '⚖️' },
      { value: 'penal', labelFr: 'Pénal', labelAr: 'جزائي', icon: '🔨' },
      { value: 'commercial', labelFr: 'Commercial', labelAr: 'تجاري', icon: '💼' },
      { value: 'social', labelFr: 'Social', labelAr: 'اجتماعي', icon: '👔' },
      { value: 'administratif', labelFr: 'Administratif', labelAr: 'إداري', icon: '🏛️' }
    ],
    dossierStatuses: [
      { value: 'enrole', labelFr: 'Enrôlé', labelAr: 'مسجل', color: 'blue' },
      { value: 'instruction', labelFr: 'En instruction', labelAr: 'قيد التحقيق', color: 'yellow' },
      { value: 'audience', labelFr: 'En audience', labelAr: 'في الجلسة', color: 'orange' },
      { value: 'delibere', labelFr: 'En délibéré', labelAr: 'قيد المداولة', color: 'purple' },
      { value: 'juge', labelFr: 'Jugé', labelAr: 'محكوم', color: 'green' },
      { value: 'appel', labelFr: 'En appel', labelAr: 'مستأنف', color: 'indigo' }
    ],
    eventTypes: [
      { value: 'audience', labelFr: 'Audience', labelAr: 'جلسة', icon: '⚖️' },
      { value: 'delibere', labelFr: 'Mise en délibéré', labelAr: 'وضع قيد المداولة', icon: '⏳' },
      { value: 'prononce', labelFr: 'Prononcé du jugement', labelAr: 'النطق بالحكم', icon: '📢' }
    ],
    specificFields: [
      { name: 'numero_rg', labelFr: 'N° RG', labelAr: 'رقم الجدول', type: 'text', required: true },
      { name: 'chambre', labelFr: 'Chambre', labelAr: 'الغرفة', type: 'text' },
      { name: 'formation', labelFr: 'Formation', labelAr: 'التشكيلة', type: 'text' }
    ],
    primaryColor: 'purple-600',
    icon: '⚖️'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // JURISTE D'ENTREPRISE - Contrats et conformité
  // ═══════════════════════════════════════════════════════════════════════════
  [UserRole.JURISTE_ENTREPRISE]: {
    role: UserRole.JURISTE_ENTREPRISE,
    terminology: {
      dossier: 'Dossier',
      dossiers: 'Dossiers',
      nouveauDossier: 'Nouveau Dossier',
      client: 'Département',
      clients: 'Départements',
      document: 'Document',
      documents: 'Documents',
      evenement: 'Échéance',
      evenements: 'Échéances'
    },
    dossierTypes: [
      { value: 'contrat', labelFr: 'Contrat', labelAr: 'عقد', icon: '📄' },
      { value: 'contentieux', labelFr: 'Contentieux', labelAr: 'نزاع', icon: '⚖️' },
      { value: 'conformite', labelFr: 'Conformité', labelAr: 'امتثال', icon: '✅' },
      { value: 'social', labelFr: 'Droit social', labelAr: 'القانون الاجتماعي', icon: '👥' },
      { value: 'propriete_intellectuelle', labelFr: 'Propriété intellectuelle', labelAr: 'الملكية الفكرية', icon: '💡' },
      { value: 'reglementaire', labelFr: 'Réglementaire', labelAr: 'تنظيمي', icon: '📋' }
    ],
    dossierStatuses: [
      { value: 'nouveau', labelFr: 'Nouveau', labelAr: 'جديد', color: 'blue' },
      { value: 'analyse', labelFr: 'En analyse', labelAr: 'قيد التحليل', color: 'yellow' },
      { value: 'validation', labelFr: 'En validation', labelAr: 'قيد المصادقة', color: 'orange' },
      { value: 'valide', labelFr: 'Validé', labelAr: 'مصادق عليه', color: 'green' },
      { value: 'archive', labelFr: 'Archivé', labelAr: 'مؤرشف', color: 'gray' }
    ],
    eventTypes: [
      { value: 'reunion', labelFr: 'Réunion', labelAr: 'اجتماع', icon: '👥' },
      { value: 'echeance', labelFr: 'Échéance contractuelle', labelAr: 'موعد تعاقدي', icon: '⏰' },
      { value: 'audit', labelFr: 'Audit', labelAr: 'تدقيق', icon: '🔍' },
      { value: 'formation', labelFr: 'Formation', labelAr: 'تكوين', icon: '📚' }
    ],
    specificFields: [
      { name: 'departement', labelFr: 'Département concerné', labelAr: 'القسم المعني', type: 'text' },
      { name: 'reference_interne', labelFr: 'Référence interne', labelAr: 'المرجع الداخلي', type: 'text' },
      { name: 'niveau_risque', labelFr: 'Niveau de risque', labelAr: 'مستوى المخاطر', type: 'select', 
        options: [
          { value: 'faible', labelFr: 'Faible', labelAr: 'منخفض' },
          { value: 'moyen', labelFr: 'Moyen', labelAr: 'متوسط' },
          { value: 'eleve', labelFr: 'Élevé', labelAr: 'مرتفع' },
          { value: 'critique', labelFr: 'Critique', labelAr: 'حرج' }
        ]
      }
    ],
    primaryColor: 'indigo-600',
    icon: '💼'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTUDIANT - Mode apprentissage
  // ═══════════════════════════════════════════════════════════════════════════
  [UserRole.ETUDIANT]: {
    role: UserRole.ETUDIANT,
    terminology: {
      dossier: 'Cas pratique',
      dossiers: 'Cas pratiques',
      nouveauDossier: 'Nouveau Cas',
      client: 'Partie',
      clients: 'Parties',
      document: 'Document',
      documents: 'Documents',
      evenement: 'Exercice',
      evenements: 'Exercices'
    },
    dossierTypes: [
      { value: 'civil', labelFr: 'Droit Civil', labelAr: 'القانون المدني', icon: '⚖️' },
      { value: 'penal', labelFr: 'Droit Pénal', labelAr: 'القانون الجنائي', icon: '🔨' },
      { value: 'commercial', labelFr: 'Droit Commercial', labelAr: 'القانون التجاري', icon: '💼' },
      { value: 'administratif', labelFr: 'Droit Administratif', labelAr: 'القانون الإداري', icon: '🏛️' }
    ],
    dossierStatuses: [
      { value: 'en_cours', labelFr: 'En cours', labelAr: 'قيد الإنجاز', color: 'blue' },
      { value: 'termine', labelFr: 'Terminé', labelAr: 'منتهي', color: 'green' }
    ],
    eventTypes: [
      { value: 'exercice', labelFr: 'Exercice', labelAr: 'تمرين', icon: '📝' },
      { value: 'examen', labelFr: 'Examen', labelAr: 'امتحان', icon: '📋' }
    ],
    specificFields: [],
    primaryColor: 'blue-500',
    icon: '🎓'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Gestion système
  // ═══════════════════════════════════════════════════════════════════════════
  [UserRole.ADMIN]: {
    role: UserRole.ADMIN,
    terminology: {
      dossier: 'Dossier',
      dossiers: 'Dossiers',
      nouveauDossier: 'Nouveau Dossier',
      client: 'Utilisateur',
      clients: 'Utilisateurs',
      document: 'Document',
      documents: 'Documents',
      evenement: 'Événement',
      evenements: 'Événements'
    },
    dossierTypes: [],
    dossierStatuses: [],
    eventTypes: [],
    specificFields: [],
    primaryColor: 'red-600',
    icon: '⚙️'
  }
};

/**
 * Obtenir la configuration pour un rôle spécifique
 */
export function getProfessionConfig(role: UserRole): ProfessionConfig {
  return PROFESSION_CONFIGS[role] || PROFESSION_CONFIGS[UserRole.AVOCAT];
}

/**
 * Obtenir la terminologie pour un rôle spécifique
 */
export function getTerminology(role: UserRole) {
  return getProfessionConfig(role).terminology;
}

/**
 * Obtenir les types de dossiers pour un rôle spécifique
 */
export function getDossierTypes(role: UserRole) {
  return getProfessionConfig(role).dossierTypes;
}

/**
 * Obtenir les statuts de dossiers pour un rôle spécifique
 */
export function getDossierStatuses(role: UserRole) {
  return getProfessionConfig(role).dossierStatuses;
}

/**
 * Obtenir les types d'événements pour un rôle spécifique
 */
export function getEventTypes(role: UserRole) {
  return getProfessionConfig(role).eventTypes;
}
