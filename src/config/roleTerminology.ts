/**
 * Terminologie adaptée à chaque profession juridique
 * Pour dépasser la concurrence avec une interface ultra-personnalisée
 */

import { UserRole } from '../../types';

export interface RoleTerminology {
  // Terminologie principale
  case: { singular: string; plural: string; singularAr: string; pluralAr: string };
  client: { singular: string; plural: string; singularAr: string; pluralAr: string };
  document: { singular: string; plural: string; singularAr: string; pluralAr: string };
  event: { singular: string; plural: string; singularAr: string; pluralAr: string };
  
  // Actions
  createCase: { fr: string; ar: string };
  viewCase: { fr: string; ar: string };
  editCase: { fr: string; ar: string };
  closeCase: { fr: string; ar: string };
  
  // Statuts spécifiques
  statuses: {
    [key: string]: { fr: string; ar: string };
  };
  
  // Types de documents spécifiques
  documentTypes: {
    [key: string]: { fr: string; ar: string };
  };
  
  // Types d'événements spécifiques
  eventTypes: {
    [key: string]: { fr: string; ar: string };
  };
}

export const ROLE_TERMINOLOGY: Record<UserRole, RoleTerminology> = {
  [UserRole.AVOCAT]: {
    case: { 
      singular: 'Dossier', 
      plural: 'Dossiers',
      singularAr: 'ملف',
      pluralAr: 'ملفات'
    },
    client: { 
      singular: 'Client', 
      plural: 'Clients',
      singularAr: 'عميل',
      pluralAr: 'عملاء'
    },
    document: { 
      singular: 'Document', 
      plural: 'Documents',
      singularAr: 'وثيقة',
      pluralAr: 'وثائق'
    },
    event: { 
      singular: 'Événement', 
      plural: 'Événements',
      singularAr: 'حدث',
      pluralAr: 'أحداث'
    },
    createCase: { fr: 'Créer un dossier', ar: 'إنشاء ملف' },
    viewCase: { fr: 'Voir le dossier', ar: 'عرض الملف' },
    editCase: { fr: 'Modifier le dossier', ar: 'تعديل الملف' },
    closeCase: { fr: 'Clôturer le dossier', ar: 'إغلاق الملف' },
    statuses: {
      nouveau: { fr: 'Nouveau', ar: 'جديد' },
      en_cours: { fr: 'En cours', ar: 'قيد المعالجة' },
      audience: { fr: 'Audience', ar: 'جلسة' },
      jugement: { fr: 'Jugement', ar: 'حكم' },
      appel: { fr: 'Appel', ar: 'استئناف' },
      cloture: { fr: 'Clôturé', ar: 'مغلق' },
      archive: { fr: 'Archivé', ar: 'مؤرشف' }
    },
    documentTypes: {
      contract: { fr: 'Contrat', ar: 'عقد' },
      court_document: { fr: 'Document judiciaire', ar: 'وثيقة قضائية' },
      correspondence: { fr: 'Correspondance', ar: 'مراسلة' },
      evidence: { fr: 'Preuve', ar: 'دليل' },
      procedure: { fr: 'Procédure', ar: 'إجراء' },
      pleading: { fr: 'Plaidoirie', ar: 'مرافعة' }
    },
    eventTypes: {
      hearing: { fr: 'Audience', ar: 'جلسة' },
      meeting: { fr: 'Réunion client', ar: 'اجتماع مع العميل' },
      deadline: { fr: 'Échéance', ar: 'موعد نهائي' },
      filing: { fr: 'Dépôt', ar: 'إيداع' }
    }
  },

  [UserRole.NOTAIRE]: {
    case: { 
      singular: 'Acte', 
      plural: 'Actes',
      singularAr: 'عقد',
      pluralAr: 'عقود'
    },
    client: { 
      singular: 'Partie', 
      plural: 'Parties',
      singularAr: 'طرف',
      pluralAr: 'أطراف'
    },
    document: { 
      singular: 'Pièce', 
      plural: 'Pièces',
      singularAr: 'وثيقة',
      pluralAr: 'وثائق'
    },
    event: { 
      singular: 'Rendez-vous', 
      plural: 'Rendez-vous',
      singularAr: 'موعد',
      pluralAr: 'مواعيد'
    },
    createCase: { fr: 'Créer un acte', ar: 'إنشاء عقد' },
    viewCase: { fr: 'Voir l\'acte', ar: 'عرض العقد' },
    editCase: { fr: 'Modifier l\'acte', ar: 'تعديل العقد' },
    closeCase: { fr: 'Finaliser l\'acte', ar: 'إتمام العقد' },
    statuses: {
      nouveau: { fr: 'Brouillon', ar: 'مسودة' },
      en_cours: { fr: 'En préparation', ar: 'قيد التحضير' },
      verification: { fr: 'Vérification', ar: 'تحقق' },
      signature: { fr: 'Signature', ar: 'توقيع' },
      enregistrement: { fr: 'Enregistrement', ar: 'تسجيل' },
      finalise: { fr: 'Finalisé', ar: 'منجز' },
      archive: { fr: 'Archivé', ar: 'مؤرشف' }
    },
    documentTypes: {
      title_deed: { fr: 'Titre de propriété', ar: 'سند ملكية' },
      sale_contract: { fr: 'Contrat de vente', ar: 'عقد بيع' },
      donation: { fr: 'Donation', ar: 'هبة' },
      mortgage: { fr: 'Hypothèque', ar: 'رهن' },
      will: { fr: 'Testament', ar: 'وصية' },
      power_of_attorney: { fr: 'Procuration', ar: 'توكيل' }
    },
    eventTypes: {
      signature: { fr: 'Signature', ar: 'توقيع' },
      meeting: { fr: 'Rendez-vous parties', ar: 'موعد الأطراف' },
      registration: { fr: 'Enregistrement', ar: 'تسجيل' },
      verification: { fr: 'Vérification documents', ar: 'التحقق من الوثائق' }
    }
  },

  [UserRole.HUISSIER]: {
    case: { 
      singular: 'Exploit', 
      plural: 'Exploits',
      singularAr: 'إجراء',
      pluralAr: 'إجراءات'
    },
    client: { 
      singular: 'Requérant', 
      plural: 'Requérants',
      singularAr: 'طالب',
      pluralAr: 'طالبون'
    },
    document: { 
      singular: 'Procès-verbal', 
      plural: 'Procès-verbaux',
      singularAr: 'محضر',
      pluralAr: 'محاضر'
    },
    event: { 
      singular: 'Mission', 
      plural: 'Missions',
      singularAr: 'مهمة',
      pluralAr: 'مهام'
    },
    createCase: { fr: 'Créer un exploit', ar: 'إنشاء إجراء' },
    viewCase: { fr: 'Voir l\'exploit', ar: 'عرض الإجراء' },
    editCase: { fr: 'Modifier l\'exploit', ar: 'تعديل الإجراء' },
    closeCase: { fr: 'Clôturer l\'exploit', ar: 'إغلاق الإجراء' },
    statuses: {
      nouveau: { fr: 'Nouveau', ar: 'جديد' },
      en_cours: { fr: 'En cours', ar: 'قيد التنفيذ' },
      signification: { fr: 'Signification', ar: 'تبليغ' },
      execution: { fr: 'Exécution', ar: 'تنفيذ' },
      constat: { fr: 'Constat', ar: 'معاينة' },
      termine: { fr: 'Terminé', ar: 'منتهي' },
      archive: { fr: 'Archivé', ar: 'مؤرشف' }
    },
    documentTypes: {
      summons: { fr: 'Assignation', ar: 'استدعاء' },
      notification: { fr: 'Signification', ar: 'تبليغ' },
      report: { fr: 'Procès-verbal', ar: 'محضر' },
      execution: { fr: 'Commandement', ar: 'أمر تنفيذ' },
      inventory: { fr: 'Inventaire', ar: 'جرد' },
      assessment: { fr: 'Constat', ar: 'معاينة' }
    },
    eventTypes: {
      service: { fr: 'Signification', ar: 'تبليغ' },
      execution: { fr: 'Exécution', ar: 'تنفيذ' },
      assessment: { fr: 'Constat', ar: 'معاينة' },
      meeting: { fr: 'Rendez-vous', ar: 'موعد' }
    }
  },

  [UserRole.MAGISTRAT]: {
    case: { 
      singular: 'Affaire', 
      plural: 'Affaires',
      singularAr: 'قضية',
      pluralAr: 'قضايا'
    },
    client: { 
      singular: 'Partie', 
      plural: 'Parties',
      singularAr: 'طرف',
      pluralAr: 'أطراف'
    },
    document: { 
      singular: 'Pièce', 
      plural: 'Pièces',
      singularAr: 'وثيقة',
      pluralAr: 'وثائق'
    },
    event: { 
      singular: 'Audience', 
      plural: 'Audiences',
      singularAr: 'جلسة',
      pluralAr: 'جلسات'
    },
    createCase: { fr: 'Enregistrer une affaire', ar: 'تسجيل قضية' },
    viewCase: { fr: 'Voir l\'affaire', ar: 'عرض القضية' },
    editCase: { fr: 'Modifier l\'affaire', ar: 'تعديل القضية' },
    closeCase: { fr: 'Clôturer l\'affaire', ar: 'إغلاق القضية' },
    statuses: {
      nouveau: { fr: 'Enregistrée', ar: 'مسجلة' },
      instruction: { fr: 'Instruction', ar: 'تحقيق' },
      audience: { fr: 'Audience', ar: 'جلسة' },
      delibere: { fr: 'Délibéré', ar: 'مداولة' },
      jugement: { fr: 'Jugement rendu', ar: 'حكم صادر' },
      appel: { fr: 'En appel', ar: 'استئناف' },
      definitif: { fr: 'Définitif', ar: 'نهائي' }
    },
    documentTypes: {
      complaint: { fr: 'Plainte', ar: 'شكوى' },
      judgment: { fr: 'Jugement', ar: 'حكم' },
      order: { fr: 'Ordonnance', ar: 'أمر' },
      minutes: { fr: 'Procès-verbal', ar: 'محضر' },
      decision: { fr: 'Décision', ar: 'قرار' }
    },
    eventTypes: {
      hearing: { fr: 'Audience', ar: 'جلسة' },
      deliberation: { fr: 'Délibéré', ar: 'مداولة' },
      judgment: { fr: 'Prononcé', ar: 'نطق بالحكم' }
    }
  },

  [UserRole.JURISTE_ENTREPRISE]: {
    case: { 
      singular: 'Dossier juridique', 
      plural: 'Dossiers juridiques',
      singularAr: 'ملف قانوني',
      pluralAr: 'ملفات قانونية'
    },
    client: { 
      singular: 'Département', 
      plural: 'Départements',
      singularAr: 'قسم',
      pluralAr: 'أقسام'
    },
    document: { 
      singular: 'Document', 
      plural: 'Documents',
      singularAr: 'وثيقة',
      pluralAr: 'وثائق'
    },
    event: { 
      singular: 'Échéance', 
      plural: 'Échéances',
      singularAr: 'موعد',
      pluralAr: 'مواعيد'
    },
    createCase: { fr: 'Créer un dossier', ar: 'إنشاء ملف' },
    viewCase: { fr: 'Voir le dossier', ar: 'عرض الملف' },
    editCase: { fr: 'Modifier le dossier', ar: 'تعديل الملف' },
    closeCase: { fr: 'Clôturer le dossier', ar: 'إغلاق الملف' },
    statuses: {
      nouveau: { fr: 'Nouveau', ar: 'جديد' },
      analyse: { fr: 'Analyse', ar: 'تحليل' },
      validation: { fr: 'Validation', ar: 'مصادقة' },
      en_cours: { fr: 'En cours', ar: 'قيد المعالجة' },
      resolu: { fr: 'Résolu', ar: 'محلول' },
      archive: { fr: 'Archivé', ar: 'مؤرشف' }
    },
    documentTypes: {
      contract: { fr: 'Contrat', ar: 'عقد' },
      policy: { fr: 'Politique', ar: 'سياسة' },
      compliance: { fr: 'Conformité', ar: 'امتثال' },
      legal_opinion: { fr: 'Avis juridique', ar: 'رأي قانوني' },
      agreement: { fr: 'Convention', ar: 'اتفاقية' }
    },
    eventTypes: {
      deadline: { fr: 'Échéance', ar: 'موعد نهائي' },
      meeting: { fr: 'Réunion', ar: 'اجتماع' },
      review: { fr: 'Révision', ar: 'مراجعة' },
      compliance_check: { fr: 'Contrôle conformité', ar: 'فحص الامتثال' }
    }
  },

  [UserRole.ETUDIANT]: {
    case: { 
      singular: 'Cas pratique', 
      plural: 'Cas pratiques',
      singularAr: 'حالة عملية',
      pluralAr: 'حالات عملية'
    },
    client: { 
      singular: 'Client', 
      plural: 'Clients',
      singularAr: 'عميل',
      pluralAr: 'عملاء'
    },
    document: { 
      singular: 'Document', 
      plural: 'Documents',
      singularAr: 'وثيقة',
      pluralAr: 'وثائق'
    },
    event: { 
      singular: 'Exercice', 
      plural: 'Exercices',
      singularAr: 'تمرين',
      pluralAr: 'تمارين'
    },
    createCase: { fr: 'Créer un cas pratique', ar: 'إنشاء حالة عملية' },
    viewCase: { fr: 'Voir le cas', ar: 'عرض الحالة' },
    editCase: { fr: 'Modifier le cas', ar: 'تعديل الحالة' },
    closeCase: { fr: 'Terminer le cas', ar: 'إنهاء الحالة' },
    statuses: {
      nouveau: { fr: 'Non commencé', ar: 'لم يبدأ' },
      en_cours: { fr: 'En cours', ar: 'قيد الإنجاز' },
      termine: { fr: 'Terminé', ar: 'منتهي' }
    },
    documentTypes: {
      exercise: { fr: 'Exercice', ar: 'تمرين' },
      solution: { fr: 'Solution', ar: 'حل' }
    },
    eventTypes: {
      exam: { fr: 'Examen', ar: 'امتحان' },
      assignment: { fr: 'Devoir', ar: 'واجب' }
    }
  },

  [UserRole.ADMIN]: {
    case: { 
      singular: 'Dossier', 
      plural: 'Dossiers',
      singularAr: 'ملف',
      pluralAr: 'ملفات'
    },
    client: { 
      singular: 'Utilisateur', 
      plural: 'Utilisateurs',
      singularAr: 'مستخدم',
      pluralAr: 'مستخدمون'
    },
    document: { 
      singular: 'Document', 
      plural: 'Documents',
      singularAr: 'وثيقة',
      pluralAr: 'وثائق'
    },
    event: { 
      singular: 'Événement', 
      plural: 'Événements',
      singularAr: 'حدث',
      pluralAr: 'أحداث'
    },
    createCase: { fr: 'Créer un dossier', ar: 'إنشاء ملف' },
    viewCase: { fr: 'Voir le dossier', ar: 'عرض الملف' },
    editCase: { fr: 'Modifier le dossier', ar: 'تعديل الملف' },
    closeCase: { fr: 'Clôturer le dossier', ar: 'إغلاق الملف' },
    statuses: {
      nouveau: { fr: 'Nouveau', ar: 'جديد' },
      en_cours: { fr: 'En cours', ar: 'قيد المعالجة' },
      termine: { fr: 'Terminé', ar: 'منتهي' }
    },
    documentTypes: {
      document: { fr: 'Document', ar: 'وثيقة' }
    },
    eventTypes: {
      event: { fr: 'Événement', ar: 'حدث' }
    }
  }
};

/**
 * Obtenir la terminologie pour un rôle spécifique
 */
export function getTerminology(role: UserRole): RoleTerminology {
  return ROLE_TERMINOLOGY[role] || ROLE_TERMINOLOGY[UserRole.AVOCAT];
}

/**
 * Obtenir un terme traduit selon le rôle et la langue
 */
export function getTerm(
  role: UserRole, 
  category: keyof RoleTerminology, 
  language: 'fr' | 'ar',
  plural: boolean = false
): string {
  const terminology = getTerminology(role);
  const term = terminology[category];
  
  if (typeof term === 'object' && 'singular' in term) {
    if (language === 'ar') {
      return plural ? term.pluralAr : term.singularAr;
    }
    return plural ? term.plural : term.singular;
  }
  
  return '';
}
