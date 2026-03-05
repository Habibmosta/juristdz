/**
 * Service de calculs automatiques algériens
 * Calculs conformes à la législation algérienne
 */

/**
 * Calcul des délais procéduraux algériens
 */
export const calculateProceduralDeadlines = (
  startDate: Date,
  procedureType: string
): { deadline: Date; days: number; description: string; description_ar: string } => {
  const deadlines: Record<string, { days: number; description: string; description_ar: string }> = {
    'appel_civil': {
      days: 30,
      description: 'Délai d\'appel en matière civile (Article 336 CPCA)',
      description_ar: 'أجل الاستئناف في المواد المدنية (المادة 336 من قانون الإجراءات المدنية والإدارية)'
    },
    'appel_commercial': {
      days: 15,
      description: 'Délai d\'appel en matière commerciale (Article 336 CPCA)',
      description_ar: 'أجل الاستئناف في المواد التجارية (المادة 336 من قانون الإجراءات المدنية والإدارية)'
    },
    'appel_social': {
      days: 15,
      description: 'Délai d\'appel en matière sociale (Article 336 CPCA)',
      description_ar: 'أجل الاستئناف في المواد الاجتماعية (المادة 336 من قانون الإجراءات المدنية والإدارية)'
    },
    'pourvoi_cassation': {
      days: 60,
      description: 'Délai de pourvoi en cassation (Article 358 CPCA)',
      description_ar: 'أجل الطعن بالنقض (المادة 358 من قانون الإجراءات المدنية والإدارية)'
    },
    'opposition_jugement': {
      days: 10,
      description: 'Délai d\'opposition à un jugement par défaut (Article 325 CPCA)',
      description_ar: 'أجل المعارضة في حكم غيابي (المادة 325 من قانون الإجراءات المدنية والإدارية)'
    },
    'refere': {
      days: 15,
      description: 'Délai d\'appel d\'une ordonnance de référé (Article 309 CPCA)',
      description_ar: 'أجل استئناف أمر استعجالي (المادة 309 من قانون الإجراءات المدنية والإدارية)'
    },
    'recours_administratif': {
      days: 60,
      description: 'Délai de recours contentieux administratif (Article 829 CPCA)',
      description_ar: 'أجل الطعن الإداري (المادة 829 من قانون الإجراءات المدنية والإدارية)'
    },
    'appel_penal': {
      days: 10,
      description: 'Délai d\'appel en matière pénale (Article 416 CPP)',
      description_ar: 'أجل الاستئناف في المواد الجزائية (المادة 416 من قانون الإجراءات الجزائية)'
    }
  };

  const config = deadlines[procedureType] || deadlines['appel_civil'];
  const deadline = new Date(startDate);
  deadline.setDate(deadline.getDate() + config.days);

  return {
    deadline,
    days: config.days,
    description: config.description,
    description_ar: config.description_ar
  };
};

/**
 * Calcul des intérêts légaux algériens
 * Taux: 3,75% par an (Banque d'Algérie 2024)
 */
export const calculateLegalInterest = (
  principal: number,
  startDate: Date,
  endDate: Date = new Date(),
  rate: number = 3.75
): {
  interest: number;
  total: number;
  days: number;
  rate: number;
  formula: string;
} => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay);
  const years = days / 365;
  const interest = principal * (rate / 100) * years;
  const total = principal + interest;

  return {
    interest: Math.round(interest * 100) / 100,
    total: Math.round(total * 100) / 100,
    days,
    rate,
    formula: `${principal} × ${rate}% × (${days}/365) = ${interest.toFixed(2)} DA`
  };
};

/**
 * Calcul des dommages-intérêts (barème indicatif)
 */
export const calculateDamages = (
  damageType: string,
  severity: 'light' | 'moderate' | 'severe',
  specificAmount?: number
): {
  minAmount: number;
  maxAmount: number;
  recommended: number;
  description: string;
  description_ar: string;
} => {
  const damages: Record<string, Record<string, { min: number; max: number; desc: string; desc_ar: string }>> = {
    'prejudice_corporel': {
      'light': { 
        min: 50000, 
        max: 200000, 
        desc: 'Préjudice corporel léger (ITT < 15 jours)',
        desc_ar: 'ضرر جسدي خفيف (عجز مؤقت < 15 يوم)'
      },
      'moderate': { 
        min: 200000, 
        max: 1000000, 
        desc: 'Préjudice corporel modéré (ITT 15-90 jours)',
        desc_ar: 'ضرر جسدي متوسط (عجز مؤقت 15-90 يوم)'
      },
      'severe': { 
        min: 1000000, 
        max: 5000000, 
        desc: 'Préjudice corporel grave (IPP > 10%)',
        desc_ar: 'ضرر جسدي خطير (عجز دائم > 10%)'
      }
    },
    'prejudice_moral': {
      'light': { 
        min: 30000, 
        max: 100000, 
        desc: 'Préjudice moral léger',
        desc_ar: 'ضرر معنوي خفيف'
      },
      'moderate': { 
        min: 100000, 
        max: 500000, 
        desc: 'Préjudice moral modéré',
        desc_ar: 'ضرر معنوي متوسط'
      },
      'severe': { 
        min: 500000, 
        max: 2000000, 
        desc: 'Préjudice moral grave',
        desc_ar: 'ضرر معنوي خطير'
      }
    },
    'prejudice_materiel': {
      'light': { 
        min: 20000, 
        max: 100000, 
        desc: 'Préjudice matériel léger',
        desc_ar: 'ضرر مادي خفيف'
      },
      'moderate': { 
        min: 100000, 
        max: 500000, 
        desc: 'Préjudice matériel modéré',
        desc_ar: 'ضرر مادي متوسط'
      },
      'severe': { 
        min: 500000, 
        max: 3000000, 
        desc: 'Préjudice matériel grave',
        desc_ar: 'ضرر مادي خطير'
      }
    }
  };

  const config = damages[damageType]?.[severity] || damages['prejudice_moral'][severity];
  const recommended = specificAmount || Math.round((config.min + config.max) / 2);

  return {
    minAmount: config.min,
    maxAmount: config.max,
    recommended,
    description: config.desc,
    description_ar: config.desc_ar
  };
};

/**
 * Calcul des frais de justice algériens
 */
export const calculateCourtFees = (
  claimAmount: number,
  courtType: 'civil' | 'commercial' | 'administrative'
): {
  registrationFee: number;
  stampDuty: number;
  bailiffFee: number;
  total: number;
  breakdown: string[];
} => {
  // Droits d'enregistrement (barème progressif)
  let registrationFee = 0;
  if (claimAmount <= 100000) {
    registrationFee = 1000;
  } else if (claimAmount <= 500000) {
    registrationFee = 2000;
  } else if (claimAmount <= 1000000) {
    registrationFee = 3000;
  } else {
    registrationFee = 5000;
  }

  // Timbre judiciaire
  const stampDuty = courtType === 'commercial' ? 2000 : 1000;

  // Frais d'huissier (estimation)
  const bailiffFee = 5000;

  const total = registrationFee + stampDuty + bailiffFee;

  return {
    registrationFee,
    stampDuty,
    bailiffFee,
    total,
    breakdown: [
      `Droits d'enregistrement: ${registrationFee} DA`,
      `Timbre judiciaire: ${stampDuty} DA`,
      `Frais d'huissier: ${bailiffFee} DA`,
      `Total: ${total} DA`
    ]
  };
};

/**
 * Calcul des honoraires d'avocat (barème indicatif)
 */
export const calculateLawyerFees = (
  caseType: string,
  complexity: 'simple' | 'moderate' | 'complex',
  claimAmount?: number
): {
  minFee: number;
  maxFee: number;
  recommended: number;
  description: string;
  description_ar: string;
} => {
  const fees: Record<string, Record<string, { min: number; max: number; desc: string; desc_ar: string }>> = {
    'consultation': {
      'simple': { 
        min: 5000, 
        max: 10000, 
        desc: 'Consultation juridique simple',
        desc_ar: 'استشارة قانونية بسيطة'
      },
      'moderate': { 
        min: 10000, 
        max: 20000, 
        desc: 'Consultation juridique approfondie',
        desc_ar: 'استشارة قانونية معمقة'
      },
      'complex': { 
        min: 20000, 
        max: 50000, 
        desc: 'Consultation juridique complexe',
        desc_ar: 'استشارة قانونية معقدة'
      }
    },
    'redaction': {
      'simple': { 
        min: 10000, 
        max: 30000, 
        desc: 'Rédaction acte simple',
        desc_ar: 'تحرير عقد بسيط'
      },
      'moderate': { 
        min: 30000, 
        max: 80000, 
        desc: 'Rédaction acte modéré',
        desc_ar: 'تحرير عقد متوسط'
      },
      'complex': { 
        min: 80000, 
        max: 200000, 
        desc: 'Rédaction acte complexe',
        desc_ar: 'تحرير عقد معقد'
      }
    },
    'procedure': {
      'simple': { 
        min: 50000, 
        max: 150000, 
        desc: 'Procédure simple (1ère instance)',
        desc_ar: 'إجراء بسيط (محكمة أول درجة)'
      },
      'moderate': { 
        min: 150000, 
        max: 400000, 
        desc: 'Procédure modérée (appel)',
        desc_ar: 'إجراء متوسط (استئناف)'
      },
      'complex': { 
        min: 400000, 
        max: 1000000, 
        desc: 'Procédure complexe (cassation)',
        desc_ar: 'إجراء معقد (نقض)'
      }
    }
  };

  const config = fees[caseType]?.[complexity] || fees['consultation'][complexity];
  
  // Si montant du litige fourni, calculer honoraires proportionnels (5-10%)
  let recommended = Math.round((config.min + config.max) / 2);
  if (claimAmount && claimAmount > 0) {
    const proportionalFee = claimAmount * 0.075; // 7.5%
    recommended = Math.max(recommended, Math.min(proportionalFee, config.max));
  }

  return {
    minFee: config.min,
    maxFee: config.max,
    recommended: Math.round(recommended),
    description: config.desc,
    description_ar: config.desc_ar
  };
};

/**
 * Calcul de la TVA algérienne (19%)
 */
export const calculateVAT = (
  amountHT: number,
  rate: number = 19
): {
  amountHT: number;
  vat: number;
  amountTTC: number;
  rate: number;
} => {
  const vat = Math.round(amountHT * (rate / 100) * 100) / 100;
  const amountTTC = Math.round((amountHT + vat) * 100) / 100;

  return {
    amountHT,
    vat,
    amountTTC,
    rate
  };
};

export default {
  calculateProceduralDeadlines,
  calculateLegalInterest,
  calculateDamages,
  calculateCourtFees,
  calculateLawyerFees,
  calculateVAT
};
