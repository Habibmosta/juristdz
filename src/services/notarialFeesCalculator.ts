/**
 * Calculateur de droits et frais notariaux algériens
 * Sources: Code de l'Enregistrement, Loi de Finances, Décret exécutif 97-466
 */

export type ActTypeForFees =
  | 'vente_immobiliere'
  | 'donation'
  | 'succession'
  | 'constitution_societe'
  | 'procuration'
  | 'bail_commercial'
  | 'bail_habitation'
  | 'hypotheque'
  | 'partage';

export interface FeeBreakdown {
  label_fr: string;
  label_ar: string;
  base: number;
  rate: number;       // en %
  amount: number;
  reference: string;
}

export interface NotarialFeesResult {
  actType: ActTypeForFees;
  actValue: number;
  breakdown: FeeBreakdown[];
  totalFees: number;
  totalTaxes: number;
  grandTotal: number;
  notaryHonoraires: number;
  summary_fr: string;
  summary_ar: string;
}

// ── Barèmes algériens (source: Code de l'Enregistrement + LF 2024) ────────────

// Droits d'enregistrement proportionnels
const REGISTRATION_RATES: Record<ActTypeForFees, number> = {
  vente_immobiliere:    5,    // 5% Art. 220 CE
  donation:             2.5,  // 2.5% Art. 222 CE (entre époux/ascendants)
  succession:           3,    // 3% Art. 224 CE (ligne directe)
  constitution_societe: 0.5,  // 0.5% Art. 226 CE
  procuration:          0,    // Droit fixe
  bail_commercial:      2,    // 2% sur loyer annuel × durée
  bail_habitation:      1,    // 1% sur loyer annuel × durée
  hypotheque:           1,    // 1% Art. 228 CE
  partage:              2.5,  // 2.5% Art. 230 CE
};

// Taxe de Publicité Foncière (TPF)
const TPF_RATES: Record<ActTypeForFees, number> = {
  vente_immobiliere:    1,    // 1%
  donation:             0.5,
  succession:           0.5,
  constitution_societe: 0,
  procuration:          0,
  bail_commercial:      0,
  bail_habitation:      0,
  hypotheque:           0.5,
  partage:              0.5,
};

// Droits fixes (en DA) pour actes non proportionnels
const FIXED_FEES: Partial<Record<ActTypeForFees, number>> = {
  procuration: 1000,  // Droit fixe 1000 DA
};

// Honoraires notaire — barème indicatif (Décret 97-466)
function calculateNotaryHonoraires(actType: ActTypeForFees, actValue: number): number {
  if (actType === 'procuration') return 3000;

  // Barème dégressif
  let honoraires = 0;
  if (actValue <= 500_000) {
    honoraires = actValue * 0.02;          // 2%
  } else if (actValue <= 2_000_000) {
    honoraires = 500_000 * 0.02 + (actValue - 500_000) * 0.015;  // 1.5%
  } else if (actValue <= 10_000_000) {
    honoraires = 500_000 * 0.02 + 1_500_000 * 0.015 + (actValue - 2_000_000) * 0.01; // 1%
  } else {
    honoraires = 500_000 * 0.02 + 1_500_000 * 0.015 + 8_000_000 * 0.01 + (actValue - 10_000_000) * 0.005; // 0.5%
  }

  // Minimum 5000 DA
  return Math.max(honoraires, 5_000);
}

export function calculateNotarialFees(actType: ActTypeForFees, actValue: number): NotarialFeesResult {
  const breakdown: FeeBreakdown[] = [];

  // 1. Droits d'enregistrement
  const regRate = REGISTRATION_RATES[actType];
  const fixedFee = FIXED_FEES[actType];

  if (fixedFee !== undefined) {
    breakdown.push({
      label_fr: 'Droit fixe d\'enregistrement',
      label_ar: 'رسم التسجيل الثابت',
      base: 0,
      rate: 0,
      amount: fixedFee,
      reference: 'Art. 200 CE',
    });
  } else if (regRate > 0) {
    breakdown.push({
      label_fr: `Droits d'enregistrement (${regRate}%)`,
      label_ar: `رسوم التسجيل (${regRate}٪)`,
      base: actValue,
      rate: regRate,
      amount: Math.round(actValue * regRate / 100),
      reference: 'Code de l\'Enregistrement',
    });
  }

  // 2. Taxe de Publicité Foncière
  const tpfRate = TPF_RATES[actType];
  if (tpfRate > 0) {
    breakdown.push({
      label_fr: `Taxe de Publicité Foncière (${tpfRate}%)`,
      label_ar: `رسم الشهر العقاري (${tpfRate}٪)`,
      base: actValue,
      rate: tpfRate,
      amount: Math.round(actValue * tpfRate / 100),
      reference: 'Art. 361 CE',
    });
  }

  // 3. Taxe sur les actes notariés (TAN) — 0.5% plafonné à 50 000 DA
  if (actValue > 0 && actType !== 'procuration') {
    const tan = Math.min(Math.round(actValue * 0.005), 50_000);
    breakdown.push({
      label_fr: 'Taxe sur Actes Notariés (0.5% — plafond 50 000 DA)',
      label_ar: 'رسم العقود التوثيقية (0.5٪ — سقف 50,000 دج)',
      base: actValue,
      rate: 0.5,
      amount: tan,
      reference: 'Art. 253 CE',
    });
  }

  // 4. Droit de timbre — 200 DA par page (estimation 4 pages)
  const timbre = 800;
  breakdown.push({
    label_fr: 'Droit de timbre (200 DA/page × 4 pages)',
    label_ar: 'رسم الطابع (200 دج/صفحة × 4 صفحات)',
    base: 0,
    rate: 0,
    amount: timbre,
    reference: 'Art. 1 CT',
  });

  // 5. Honoraires notaire
  const honoraires = calculateNotaryHonoraires(actType, actValue);
  breakdown.push({
    label_fr: 'Honoraires du notaire (barème Décret 97-466)',
    label_ar: 'أتعاب الموثق (سلم المرسوم 97-466)',
    base: actValue,
    rate: 0,
    amount: Math.round(honoraires),
    reference: 'Décret exécutif 97-466',
  });

  // 6. TVA sur honoraires (19%)
  const tvaHonoraires = Math.round(honoraires * 0.19);
  breakdown.push({
    label_fr: 'TVA sur honoraires (19%)',
    label_ar: 'الرسم على القيمة المضافة على الأتعاب (19٪)',
    base: Math.round(honoraires),
    rate: 19,
    amount: tvaHonoraires,
    reference: 'Art. 2 CTCA',
  });

  const totalTaxes = breakdown
    .filter(b => b.label_fr !== 'Honoraires du notaire (barème Décret 97-466)' && b.label_fr !== 'TVA sur honoraires (19%)')
    .reduce((s, b) => s + b.amount, 0);

  const notaryHonoraires = Math.round(honoraires) + tvaHonoraires;
  const totalFees = breakdown.reduce((s, b) => s + b.amount, 0);

  const formatDA = (n: number) => `${n.toLocaleString('fr-DZ')} DA`;

  return {
    actType,
    actValue,
    breakdown,
    totalFees,
    totalTaxes,
    grandTotal: totalFees,
    notaryHonoraires,
    summary_fr: `Pour un acte de ${formatDA(actValue)}, le total des frais est de ${formatDA(totalFees)} dont ${formatDA(totalTaxes)} de taxes et ${formatDA(notaryHonoraires)} d'honoraires TTC.`,
    summary_ar: `لعقد بقيمة ${formatDA(actValue)}، إجمالي المصاريف ${formatDA(totalFees)} منها ${formatDA(totalTaxes)} رسوم و${formatDA(notaryHonoraires)} أتعاب شاملة الضريبة.`,
  };
}

export const ACT_TYPES_FOR_FEES: Record<ActTypeForFees, { fr: string; ar: string }> = {
  vente_immobiliere:    { fr: 'Vente Immobilière',       ar: 'بيع عقاري' },
  donation:             { fr: 'Donation',                 ar: 'هبة' },
  succession:           { fr: 'Succession / Héritage',    ar: 'إرث / تركة' },
  constitution_societe: { fr: 'Constitution de Société',  ar: 'تأسيس شركة' },
  procuration:          { fr: 'Procuration',              ar: 'توكيل' },
  bail_commercial:      { fr: 'Bail Commercial',          ar: 'إيجار تجاري' },
  bail_habitation:      { fr: 'Bail d\'Habitation',       ar: 'إيجار سكني' },
  hypotheque:           { fr: 'Hypothèque',               ar: 'رهن عقاري' },
  partage:              { fr: 'Acte de Partage',          ar: 'عقد قسمة' },
};
