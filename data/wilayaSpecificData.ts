// Données spécifiques par wilaya pour l'Algérie

export interface TribunalInfo {
  name_fr: string;
  name_ar: string;
  address: string;
  phone?: string;
  fax?: string;
  email?: string;
  type: 'civil' | 'commercial' | 'administratif' | 'famille' | 'penal';
}

export interface ConservationFonciereInfo {
  name_fr: string;
  name_ar: string;
  address: string;
  phone?: string;
  email?: string;
  circonscription: string[];
}

export interface BarreauInfo {
  name_fr: string;
  name_ar: string;
  address: string;
  phone?: string;
  email?: string;
  president?: string;
}

export interface WilayaData {
  code: string;
  name_fr: string;
  name_ar: string;
  code_postal_prefix: string;
  tribunaux: TribunalInfo[];
  conservation_fonciere: ConservationFonciereInfo[];
  barreau?: BarreauInfo;
  chambre_notaires?: {
    name_fr: string;
    name_ar: string;
    address: string;
    phone?: string;
  };
  chambre_huissiers?: {
    name_fr: string;
    name_ar: string;
    address: string;
    phone?: string;
  };
  format_rc: string; // Format du Registre de Commerce
  format_nif: string; // Format du NIF
  specificites?: string[]; // Spécificités locales
}

export const WILAYAS_DATA: { [key: string]: WilayaData } = {
  '16': {
    code: '16',
    name_fr: 'Alger',
    name_ar: 'الجزائر',
    code_postal_prefix: '16',
    format_rc: '16/XXXXXXXX',
    format_nif: '099916XXXXXXXXX',
    tribunaux: [
      {
        name_fr: 'Tribunal de Sidi M\'Hamed',
        name_ar: 'محكمة سيدي امحمد',
        address: 'Place des Martyrs, Alger Centre',
        phone: '021 73 42 00',
        type: 'civil'
      },
      {
        name_fr: 'Tribunal de Bir Mourad Raïs',
        name_ar: 'محكمة بئر مراد رايس',
        address: 'Bir Mourad Raïs, Alger',
        type: 'civil'
      },
      {
        name_fr: 'Tribunal de Commerce d\'Alger',
        name_ar: 'المحكمة التجارية للجزائر',
        address: 'Rue Larbi Ben M\'hidi, Alger',
        phone: '021 73 50 00',
        type: 'commercial'
      },
      {
        name_fr: 'Tribunal Administratif d\'Alger',
        name_ar: 'المحكمة الإدارية للجزائر',
        address: 'Rue Didouche Mourad, Alger',
        type: 'administratif'
      }
    ],
    conservation_fonciere: [
      {
        name_fr: 'Conservation Foncière d\'Alger Centre',
        name_ar: 'المحافظة العقارية للجزائر الوسط',
        address: 'Rue Hassiba Ben Bouali, Alger',
        phone: '021 73 60 00',
        circonscription: ['Sidi M\'Hamed', 'Alger Centre', 'Casbah']
      },
      {
        name_fr: 'Conservation Foncière de Bir Mourad Raïs',
        name_ar: 'المحافظة العقارية لبئر مراد رايس',
        address: 'Bir Mourad Raïs, Alger',
        circonscription: ['Bir Mourad Raïs', 'Hydra', 'Ben Aknoun']
      }
    ],
    barreau: {
      name_fr: 'Barreau d\'Alger',
      name_ar: 'نقابة المحامين للجزائر',
      address: 'Rue Larbi Ben M\'hidi, Alger',
      phone: '021 73 45 00'
    },
    chambre_notaires: {
      name_fr: 'Chambre Régionale des Notaires d\'Alger',
      name_ar: 'الغرفة الجهوية للموثقين للجزائر',
      address: 'Rue Didouche Mourad, Alger',
      phone: '021 73 55 00'
    },
    chambre_huissiers: {
      name_fr: 'Chambre Régionale des Huissiers de Justice d\'Alger',
      name_ar: 'الغرفة الجهوية للمحضرين القضائيين للجزائر',
      address: 'Rue Hassiba Ben Bouali, Alger',
      phone: '021 73 65 00'
    },
    specificites: [
      'Mention obligatoire du secteur urbain pour les actes immobiliers',
      'Référence au plan d\'urbanisme d\'Alger pour les constructions',
      'Délais de traitement plus courts en raison de la charge'
    ]
  },
  '31': {
    code: '31',
    name_fr: 'Oran',
    name_ar: 'وهران',
    code_postal_prefix: '31',
    format_rc: '31/XXXXXXXX',
    format_nif: '099931XXXXXXXXX',
    tribunaux: [
      {
        name_fr: 'Tribunal d\'Oran',
        name_ar: 'محكمة وهران',
        address: 'Place du 1er Novembre, Oran',
        phone: '041 33 42 00',
        type: 'civil'
      },
      {
        name_fr: 'Tribunal de Commerce d\'Oran',
        name_ar: 'المحكمة التجارية لوهران',
        address: 'Boulevard de la Soummam, Oran',
        phone: '041 33 50 00',
        type: 'commercial'
      },
      {
        name_fr: 'Tribunal Administratif d\'Oran',
        name_ar: 'المحكمة الإدارية لوهران',
        address: 'Rue Larbi Ben M\'hidi, Oran',
        type: 'administratif'
      }
    ],
    conservation_fonciere: [
      {
        name_fr: 'Conservation Foncière d\'Oran',
        name_ar: 'المحافظة العقارية لوهران',
        address: 'Boulevard de la Révolution, Oran',
        phone: '041 33 60 00',
        circonscription: ['Oran', 'Bir El Djir', 'Es Senia']
      }
    ],
    barreau: {
      name_fr: 'Barreau d\'Oran',
      name_ar: 'نقابة المحامين لوهران',
      address: 'Place du 1er Novembre, Oran',
      phone: '041 33 45 00'
    },
    chambre_notaires: {
      name_fr: 'Chambre Régionale des Notaires d\'Oran',
      name_ar: 'الغرفة الجهوية للموثقين لوهران',
      address: 'Boulevard de la Soummam, Oran',
      phone: '041 33 55 00'
    },
    specificites: [
      'Mention du quartier obligatoire pour les actes notariés',
      'Référence au cadastre maritime pour les biens côtiers',
      'Procédures spécifiques pour le port d\'Oran'
    ]
  },
  '25': {
    code: '25',
    name_fr: 'Constantine',
    name_ar: 'قسنطينة',
    code_postal_prefix: '25',
    format_rc: '25/XXXXXXXX',
    format_nif: '099925XXXXXXXXX',
    tribunaux: [
      {
        name_fr: 'Tribunal de Constantine',
        name_ar: 'محكمة قسنطينة',
        address: 'Place des Martyrs, Constantine',
        phone: '031 92 42 00',
        type: 'civil'
      },
      {
        name_fr: 'Tribunal de Commerce de Constantine',
        name_ar: 'المحكمة التجارية لقسنطينة',
        address: 'Rue Larbi Ben M\'hidi, Constantine',
        phone: '031 92 50 00',
        type: 'commercial'
      }
    ],
    conservation_fonciere: [
      {
        name_fr: 'Conservation Foncière de Constantine',
        name_ar: 'المحافظة العقارية لقسنطينة',
        address: 'Boulevard de la République, Constantine',
        phone: '031 92 60 00',
        circonscription: ['Constantine', 'El Khroub', 'Ain Smara']
      }
    ],
    barreau: {
      name_fr: 'Barreau de Constantine',
      name_ar: 'نقابة المحامين لقسنطينة',
      address: 'Place des Martyrs, Constantine',
      phone: '031 92 45 00'
    },
    specificites: [
      'Mention des ponts pour la localisation des biens immobiliers',
      'Références topographiques spécifiques (rochers, ponts)',
      'Procédures particulières pour les biens en vieille ville'
    ]
  },
  '23': {
    code: '23',
    name_fr: 'Annaba',
    name_ar: 'عنابة',
    code_postal_prefix: '23',
    format_rc: '23/XXXXXXXX',
    format_nif: '099923XXXXXXXXX',
    tribunaux: [
      {
        name_fr: 'Tribunal d\'Annaba',
        name_ar: 'محكمة عنابة',
        address: 'Place de la Révolution, Annaba',
        phone: '038 86 42 00',
        type: 'civil'
      }
    ],
    conservation_fonciere: [
      {
        name_fr: 'Conservation Foncière d\'Annaba',
        name_ar: 'المحافظة العقارية لعنابة',
        address: 'Cours de la Révolution, Annaba',
        phone: '038 86 60 00',
        circonscription: ['Annaba', 'El Bouni', 'Sidi Amar']
      }
    ],
    barreau: {
      name_fr: 'Barreau d\'Annaba',
      name_ar: 'نقابة المحامين لعنابة',
      address: 'Place de la Révolution, Annaba',
      phone: '038 86 45 00'
    },
    specificites: [
      'Mention du secteur portuaire pour les biens côtiers',
      'Références au cadastre maritime',
      'Procédures spécifiques zone industrielle'
    ]
  },
  '09': {
    code: '09',
    name_fr: 'Blida',
    name_ar: 'البليدة',
    code_postal_prefix: '09',
    format_rc: '09/XXXXXXXX',
    format_nif: '099909XXXXXXXXX',
    tribunaux: [
      {
        name_fr: 'Tribunal de Blida',
        name_ar: 'محكمة البليدة',
        address: 'Place de l\'Indépendance, Blida',
        phone: '025 41 42 00',
        type: 'civil'
      }
    ],
    conservation_fonciere: [
      {
        name_fr: 'Conservation Foncière de Blida',
        name_ar: 'المحافظة العقارية للبليدة',
        address: 'Rue des Martyrs, Blida',
        phone: '025 41 60 00',
        circonscription: ['Blida', 'Boufarik', 'Bougara']
      }
    ],
    barreau: {
      name_fr: 'Barreau de Blida',
      name_ar: 'نقابة المحامين للبليدة',
      address: 'Place de l\'Indépendance, Blida',
      phone: '025 41 45 00'
    },
    specificites: [
      'Mention des terres agricoles (statut APFA)',
      'Références au périmètre de la Mitidja',
      'Procédures spécifiques pour les exploitations agricoles'
    ]
  },
  '15': {
    code: '15',
    name_fr: 'Tizi Ouzou',
    name_ar: 'تيزي وزو',
    code_postal_prefix: '15',
    format_rc: '15/XXXXXXXX',
    format_nif: '099915XXXXXXXXX',
    tribunaux: [
      {
        name_fr: 'Tribunal de Tizi Ouzou',
        name_ar: 'محكمة تيزي وزو',
        address: 'Boulevard Stiti Ali, Tizi Ouzou',
        phone: '026 21 42 00',
        type: 'civil'
      }
    ],
    conservation_fonciere: [
      {
        name_fr: 'Conservation Foncière de Tizi Ouzou',
        name_ar: 'المحافظة العقارية لتيزي وزو',
        address: 'Rue Larbi Ben M\'hidi, Tizi Ouzou',
        phone: '026 21 60 00',
        circonscription: ['Tizi Ouzou', 'Draa Ben Khedda', 'Azazga']
      }
    ],
    barreau: {
      name_fr: 'Barreau de Tizi Ouzou',
      name_ar: 'نقابة المحامين لتيزي وزو',
      address: 'Boulevard Stiti Ali, Tizi Ouzou',
      phone: '026 21 45 00'
    },
    specificites: [
      'Mention des biens collectifs (arch)',
      'Références aux terres de montagne',
      'Procédures spécifiques pour les biens indivisibles'
    ]
  },
  '06': {
    code: '06',
    name_fr: 'Béjaïa',
    name_ar: 'بجاية',
    code_postal_prefix: '06',
    format_rc: '06/XXXXXXXX',
    format_nif: '099906XXXXXXXXX',
    tribunaux: [
      {
        name_fr: 'Tribunal de Béjaïa',
        name_ar: 'محكمة بجاية',
        address: 'Place Gueydon, Béjaïa',
        phone: '034 21 42 00',
        type: 'civil'
      }
    ],
    conservation_fonciere: [
      {
        name_fr: 'Conservation Foncière de Béjaïa',
        name_ar: 'المحافظة العقارية لبجاية',
        address: 'Boulevard de la Liberté, Béjaïa',
        phone: '034 21 60 00',
        circonscription: ['Béjaïa', 'Akbou', 'El Kseur']
      }
    ],
    barreau: {
      name_fr: 'Barreau de Béjaïa',
      name_ar: 'نقابة المحامين لبجاية',
      address: 'Place Gueydon, Béjaïa',
      phone: '034 21 45 00'
    },
    specificites: [
      'Mention du cadastre maritime pour les biens côtiers',
      'Références au port de Béjaïa',
      'Procédures spécifiques zone industrielle portuaire'
    ]
  },
  '19': {
    code: '19',
    name_fr: 'Sétif',
    name_ar: 'سطيف',
    code_postal_prefix: '19',
    format_rc: '19/XXXXXXXX',
    format_nif: '099919XXXXXXXXX',
    tribunaux: [
      {
        name_fr: 'Tribunal de Sétif',
        name_ar: 'محكمة سطيف',
        address: 'Place de l\'Indépendance, Sétif',
        phone: '036 84 42 00',
        type: 'civil'
      }
    ],
    conservation_fonciere: [
      {
        name_fr: 'Conservation Foncière de Sétif',
        name_ar: 'المحافظة العقارية لسطيف',
        address: 'Boulevard du 1er Novembre, Sétif',
        phone: '036 84 60 00',
        circonscription: ['Sétif', 'El Eulma', 'Ain Arnat']
      }
    ],
    barreau: {
      name_fr: 'Barreau de Sétif',
      name_ar: 'نقابة المحامين لسطيف',
      address: 'Place de l\'Indépendance, Sétif',
      phone: '036 84 45 00'
    },
    specificites: [
      'Mention des terres agricoles céréalières',
      'Références aux hauts plateaux',
      'Procédures spécifiques pour les exploitations agricoles'
    ]
  }
};

// Fonction pour obtenir les données d'une wilaya
export function getWilayaData(wilayaCode: string): WilayaData | null {
  return WILAYAS_DATA[wilayaCode] || null;
}

// Fonction pour obtenir tous les tribunaux d'une wilaya
export function getTribunauxByWilaya(wilayaCode: string): TribunalInfo[] {
  const wilaya = getWilayaData(wilayaCode);
  return wilaya?.tribunaux || [];
}

// Fonction pour obtenir le format RC d'une wilaya
export function getFormatRC(wilayaCode: string): string {
  const wilaya = getWilayaData(wilayaCode);
  return wilaya?.format_rc || 'XX/XXXXXXXX';
}

// Fonction pour obtenir le format NIF d'une wilaya
export function getFormatNIF(wilayaCode: string): string {
  const wilaya = getWilayaData(wilayaCode);
  return wilaya?.format_nif || '0999XXXXXXXXXXXX';
}

// Fonction pour valider un numéro RC
export function validateRC(rc: string, wilayaCode: string): boolean {
  const format = getFormatRC(wilayaCode);
  const pattern = format.replace(/X/g, '\\d');
  const regex = new RegExp(`^${pattern}$`);
  return regex.test(rc);
}

// Fonction pour valider un NIF
export function validateNIF(nif: string, wilayaCode: string): boolean {
  const format = getFormatNIF(wilayaCode);
  const pattern = format.replace(/X/g, '\\d');
  const regex = new RegExp(`^${pattern}$`);
  return regex.test(nif);
}

// Liste de toutes les wilayas pour les sélecteurs
export const WILAYAS_LIST = Object.values(WILAYAS_DATA).map(w => ({
  code: w.code,
  name_fr: w.name_fr,
  name_ar: w.name_ar
})).sort((a, b) => parseInt(a.code) - parseInt(b.code));
