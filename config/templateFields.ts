// Configuration des champs spécifiques par template

export interface TemplateFieldConfig {
  templateId: string;
  requiredSections: string[];
  specificFields?: {
    [section: string]: string[];
  };
  validationRules?: {
    [field: string]: (value: any) => boolean;
  };
  helpTexts?: {
    [field: string]: {
      fr: string;
      ar: string;
    };
  };
}

export const TEMPLATE_FIELD_CONFIGS: TemplateFieldConfig[] = [
  // Requête de Divorce
  {
    templateId: 'requete_divorce',
    requiredSections: ['identite', 'cabinet', 'tribunal', 'mariage'],
    specificFields: {
      mariage: ['dateMariage', 'lieuMariage', 'numeroActeMariage', 'typeDivorce', 'motifs'],
      enfants: ['nombreEnfants', 'detailsEnfants'],
      demandes: ['pensionAlimentaire', 'gardeEnfants', 'logementFamilial']
    },
    helpTexts: {
      typeDivorce: {
        fr: 'Khol (divorce à la demande de l\'épouse), Tatliq (divorce judiciaire), Mubarat (divorce par consentement mutuel), Faskh (annulation)',
        ar: 'خلع (طلاق بطلب من الزوجة)، تطليق (طلاق قضائي)، مبارات (طلاق بالتراضي)، فسخ (إبطال)'
      },
      motifs: {
        fr: 'Détaillez les motifs du divorce selon l\'article 53 du Code de la Famille',
        ar: 'فصل أسباب الطلاق وفقاً للمادة 53 من قانون الأسرة'
      }
    }
  },

  // Acte de Vente Immobilière
  {
    templateId: 'acte_vente_immobiliere',
    requiredSections: ['identite', 'cabinet', 'bien', 'financier'],
    specificFields: {
      bien: ['natureBien', 'superficie', 'adresseBien', 'numeroTitreFoncier', 'sectionCadastrale'],
      financier: ['prixVente', 'modalitePaiement', 'dateSignature'],
      garanties: ['garantiesVendeur', 'servitudes', 'charges']
    },
    validationRules: {
      prixVente: (value: string) => /^\d+(\.\d{2})?$/.test(value),
      superficie: (value: string) => /^\d+(\.\d{2})?\s*(m²|ha)$/.test(value)
    },
    helpTexts: {
      numeroTitreFoncier: {
        fr: 'Numéro du titre foncier ou acte de propriété (obligatoire pour la publicité foncière)',
        ar: 'رقم السند العقاري أو عقد الملكية (إجباري للشهر العقاري)'
      },
      prixVente: {
        fr: 'Prix en dinars algériens (DZD) - Format: 1500000.00',
        ar: 'الثمن بالدينار الجزائري - الشكل: 1500000.00'
      }
    }
  },

  // Testament Authentique
  {
    templateId: 'testament_authentique',
    requiredSections: ['identite', 'cabinet', 'dispositions'],
    specificFields: {
      dispositions: ['typeDispositions', 'legataires', 'biens', 'conditions'],
      execution: ['executeurTestamentaire', 'modalitesExecution']
    },
    helpTexts: {
      typeDispositions: {
        fr: 'Legs particulier, legs universel, ou legs à titre universel selon le Code Civil',
        ar: 'وصية خاصة، وصية شاملة، أو وصية بصفة شاملة وفق القانون المدني'
      }
    }
  },

  // Procuration
  {
    templateId: 'procuration_generale',
    requiredSections: ['identite', 'cabinet', 'pouvoirs'],
    specificFields: {
      pouvoirs: ['typePouvoirs', 'descriptionPouvoirs', 'dureeValidite', 'conditionsRevocation'],
      mandataire: ['identiteMandataire', 'acceptationMandataire']
    },
    helpTexts: {
      typePouvoirs: {
        fr: 'Générale (tous actes d\'administration) ou Spéciale (acte déterminé)',
        ar: 'عامة (جميع أعمال الإدارة) أو خاصة (عمل محدد)'
      }
    }
  },

  // Requête Commerciale
  {
    templateId: 'requete_commerciale',
    requiredSections: ['identite', 'cabinet', 'tribunal', 'commercial'],
    specificFields: {
      commercial: ['numeroRC', 'numeroNIF', 'relationCommerciale', 'litige', 'montantLitige'],
      preuves: ['factures', 'contrats', 'correspondances']
    },
    validationRules: {
      numeroRC: (value: string) => /^\d{2}\/\d{8}$/.test(value), // Format: 16/12345678
      numeroNIF: (value: string) => /^\d{15}$/.test(value) // 15 chiffres
    },
    helpTexts: {
      numeroRC: {
        fr: 'Numéro du Registre de Commerce - Format: 16/12345678',
        ar: 'رقم السجل التجاري - الشكل: 16/12345678'
      },
      numeroNIF: {
        fr: 'Numéro d\'Identification Fiscale (15 chiffres)',
        ar: 'رقم التعريف الجبائي (15 رقم)'
      }
    }
  },

  // Constitution SARL
  {
    templateId: 'constitution_sarl',
    requiredSections: ['identite', 'cabinet', 'societe'],
    specificFields: {
      societe: ['denominationSociale', 'objetSocial', 'capitalSocial', 'siegeSocial', 'duree'],
      associes: ['listeAssocies', 'repartitionParts', 'apports'],
      gerance: ['gerant', 'pouvoirsGerant', 'remuneration']
    },
    validationRules: {
      capitalSocial: (value: string) => parseInt(value) >= 100000, // Capital minimum SARL
      duree: (value: string) => parseInt(value) <= 99 // Durée maximum 99 ans
    },
    helpTexts: {
      capitalSocial: {
        fr: 'Capital social minimum: 100.000 DZD pour une SARL',
        ar: 'رأس المال الأدنى: 100.000 دج للشركة ذات المسؤولية المحدودة'
      },
      objetSocial: {
        fr: 'Activité principale de la société (conforme à la nomenclature des activités)',
        ar: 'النشاط الرئيسي للشركة (وفق تصنيف الأنشطة)'
      }
    }
  }
];

// Fonction pour obtenir la configuration d'un template
export function getTemplateConfig(templateId: string): TemplateFieldConfig | undefined {
  return TEMPLATE_FIELD_CONFIGS.find(config => config.templateId === templateId);
}

// Fonction pour valider les données d'un formulaire
export function validateTemplateData(templateId: string, data: any): { isValid: boolean; errors: string[] } {
  const config = getTemplateConfig(templateId);
  if (!config) return { isValid: true, errors: [] };

  const errors: string[] = [];

  // Validation des règles spécifiques
  if (config.validationRules) {
    Object.entries(config.validationRules).forEach(([field, validator]) => {
      const value = getNestedValue(data, field);
      if (value && !validator(value)) {
        errors.push(`Champ ${field} invalide`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Fonction utilitaire pour accéder aux valeurs imbriquées
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}