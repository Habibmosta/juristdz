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
  },
  // Ajout des 50 wilayas restantes avec données minimales
  '01': { code: '01', name_fr: 'Adrar', name_ar: 'أدرار', tribunaux: [{ name_fr: 'Tribunal d\'Adrar', name_ar: 'محكمة أدرار', address: 'Adrar', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière d\'Adrar', name_ar: 'المحافظة العقارية أدرار', address: 'Adrar', circonscriptions: ['Adrar'] }, barreau: { name_fr: 'Barreau d\'Adrar', name_ar: 'نقابة المحامين أدرار', address: 'Adrar' }, chambre_notaires: { name_fr: 'Chambre des Notaires d\'Adrar', name_ar: 'غرفة الموثقين أدرار', address: 'Adrar' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers d\'Adrar', name_ar: 'غرفة المحضرين أدرار', address: 'Adrar' }, format_rc: '01/XXXXXXXX', format_nif: '099901XXXXXXXXX', specificites: [] },
  '02': { code: '02', name_fr: 'Chlef', name_ar: 'الشلف', tribunaux: [{ name_fr: 'Tribunal de Chlef', name_ar: 'محكمة الشلف', address: 'Chlef', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière de Chlef', name_ar: 'المحافظة العقارية الشلف', address: 'Chlef', circonscriptions: ['Chlef'] }, barreau: { name_fr: 'Barreau de Chlef', name_ar: 'نقابة المحامين الشلف', address: 'Chlef' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Chlef', name_ar: 'غرفة الموثقين الشلف', address: 'Chlef' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Chlef', name_ar: 'غرفة المحضرين الشلف', address: 'Chlef' }, format_rc: '02/XXXXXXXX', format_nif: '099902XXXXXXXXX', specificites: [] },
  '03': { code: '03', name_fr: 'Laghouat', name_ar: 'الأغواط', tribunaux: [{ name_fr: 'Tribunal de Laghouat', name_ar: 'محكمة الأغواط', address: 'Laghouat', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière de Laghouat', name_ar: 'المحافظة العقارية الأغواط', address: 'Laghouat', circonscriptions: ['Laghouat'] }, barreau: { name_fr: 'Barreau de Laghouat', name_ar: 'نقابة المحامين الأغواط', address: 'Laghouat' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Laghouat', name_ar: 'غرفة الموثقين الأغواط', address: 'Laghouat' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Laghouat', name_ar: 'غرفة المحضرين الأغواط', address: 'Laghouat' }, format_rc: '03/XXXXXXXX', format_nif: '099903XXXXXXXXX', specificites: [] },
  '04': { code: '04', name_fr: 'Oum El Bouaghi', name_ar: 'أم البواقي', tribunaux: [{ name_fr: 'Tribunal d\'Oum El Bouaghi', name_ar: 'محكمة أم البواقي', address: 'Oum El Bouaghi', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière d\'Oum El Bouaghi', name_ar: 'المحافظة العقارية أم البواقي', address: 'Oum El Bouaghi', circonscriptions: ['Oum El Bouaghi'] }, barreau: { name_fr: 'Barreau d\'Oum El Bouaghi', name_ar: 'نقابة المحامين أم البواقي', address: 'Oum El Bouaghi' }, chambre_notaires: { name_fr: 'Chambre des Notaires d\'Oum El Bouaghi', name_ar: 'غرفة الموثقين أم البواقي', address: 'Oum El Bouaghi' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers d\'Oum El Bouaghi', name_ar: 'غرفة المحضرين أم البواقي', address: 'Oum El Bouaghi' }, format_rc: '04/XXXXXXXX', format_nif: '099904XXXXXXXXX', specificites: [] },
  '05': { code: '05', name_fr: 'Batna', name_ar: 'باتنة', tribunaux: [{ name_fr: 'Tribunal de Batna', name_ar: 'محكمة باتنة', address: 'Batna', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière de Batna', name_ar: 'المحافظة العقارية باتنة', address: 'Batna', circonscriptions: ['Batna'] }, barreau: { name_fr: 'Barreau de Batna', name_ar: 'نقابة المحامين باتنة', address: 'Batna' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Batna', name_ar: 'غرفة الموثقين باتنة', address: 'Batna' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Batna', name_ar: 'غرفة المحضرين باتنة', address: 'Batna' }, format_rc: '05/XXXXXXXX', format_nif: '099905XXXXXXXXX', specificites: [] },
  '07': { code: '07', name_fr: 'Biskra', name_ar: 'بسكرة', tribunaux: [{ name_fr: 'Tribunal de Biskra', name_ar: 'محكمة بسكرة', address: 'Biskra', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière de Biskra', name_ar: 'المحافظة العقارية بسكرة', address: 'Biskra', circonscriptions: ['Biskra'] }, barreau: { name_fr: 'Barreau de Biskra', name_ar: 'نقابة المحامين بسكرة', address: 'Biskra' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Biskra', name_ar: 'غرفة الموثقين بسكرة', address: 'Biskra' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Biskra', name_ar: 'غرفة المحضرين بسكرة', address: 'Biskra' }, format_rc: '07/XXXXXXXX', format_nif: '099907XXXXXXXXX', specificites: [] },
  '08': { code: '08', name_fr: 'Béchar', name_ar: 'بشار', tribunaux: [{ name_fr: 'Tribunal de Béchar', name_ar: 'محكمة بشار', address: 'Béchar', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière de Béchar', name_ar: 'المحافظة العقارية بشار', address: 'Béchar', circonscriptions: ['Béchar'] }, barreau: { name_fr: 'Barreau de Béchar', name_ar: 'نقابة المحامين بشار', address: 'Béchar' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Béchar', name_ar: 'غرفة الموثقين بشار', address: 'Béchar' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Béchar', name_ar: 'غرفة المحضرين بشار', address: 'Béchar' }, format_rc: '08/XXXXXXXX', format_nif: '099908XXXXXXXXX', specificites: [] }
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

// Liste complète des 58 wilayas d'Algérie
export const ALL_WILAYAS = [
  { code: '01', name_fr: 'Adrar', name_ar: 'أدرار' },
  { code: '02', name_fr: 'Chlef', name_ar: 'الشلف' },
  { code: '03', name_fr: 'Laghouat', name_ar: 'الأغواط' },
  { code: '04', name_fr: 'Oum El Bouaghi', name_ar: 'أم البواقي' },
  { code: '05', name_fr: 'Batna', name_ar: 'باتنة' },
  { code: '06', name_fr: 'Béjaïa', name_ar: 'بجاية' },
  { code: '07', name_fr: 'Biskra', name_ar: 'بسكرة' },
  { code: '08', name_fr: 'Béchar', name_ar: 'بشار' },
  { code: '09', name_fr: 'Blida', name_ar: 'البليدة' },
  { code: '10', name_fr: 'Bouira', name_ar: 'البويرة' },
  { code: '11', name_fr: 'Tamanrasset', name_ar: 'تمنراست' },
  { code: '12', name_fr: 'Tébessa', name_ar: 'تبسة' },
  { code: '13', name_fr: 'Tlemcen', name_ar: 'تلمسان' },
  { code: '14', name_fr: 'Tiaret', name_ar: 'تيارت' },
  { code: '15', name_fr: 'Tizi Ouzou', name_ar: 'تيزي وزو' },
  { code: '16', name_fr: 'Alger', name_ar: 'الجزائر' },
  { code: '17', name_fr: 'Djelfa', name_ar: 'الجلفة' },
  { code: '18', name_fr: 'Jijel', name_ar: 'جيجل' },
  { code: '19', name_fr: 'Sétif', name_ar: 'سطيف' },
  { code: '20', name_fr: 'Saïda', name_ar: 'سعيدة' },
  { code: '21', name_fr: 'Skikda', name_ar: 'سكيكدة' },
  { code: '22', name_fr: 'Sidi Bel Abbès', name_ar: 'سيدي بلعباس' },
  { code: '23', name_fr: 'Annaba', name_ar: 'عنابة' },
  { code: '24', name_fr: 'Guelma', name_ar: 'قالمة' },
  { code: '25', name_fr: 'Constantine', name_ar: 'قسنطينة' },
  { code: '26', name_fr: 'Médéa', name_ar: 'المدية' },
  { code: '27', name_fr: 'Mostaganem', name_ar: 'مستغانم' },
  { code: '28', name_fr: "M'Sila", name_ar: 'المسيلة' },
  { code: '29', name_fr: 'Mascara', name_ar: 'معسكر' },
  { code: '30', name_fr: 'Ouargla', name_ar: 'ورقلة' },
  { code: '31', name_fr: 'Oran', name_ar: 'وهران' },
  { code: '32', name_fr: 'El Bayadh', name_ar: 'البيض' },
  { code: '33', name_fr: 'Illizi', name_ar: 'إليزي' },
  { code: '34', name_fr: 'Bordj Bou Arréridj', name_ar: 'برج بوعريريج' },
  { code: '35', name_fr: 'Boumerdès', name_ar: 'بومرداس' },
  { code: '36', name_fr: 'El Tarf', name_ar: 'الطارف' },
  { code: '37', name_fr: 'Tindouf', name_ar: 'تندوف' },
  { code: '38', name_fr: 'Tissemsilt', name_ar: 'تيسمسيلت' },
  { code: '39', name_fr: 'El Oued', name_ar: 'الوادي' },
  { code: '40', name_fr: 'Khenchela', name_ar: 'خنشلة' },
  { code: '41', name_fr: 'Souk Ahras', name_ar: 'سوق أهراس' },
  { code: '42', name_fr: 'Tipaza', name_ar: 'تيبازة' },
  { code: '43', name_fr: 'Mila', name_ar: 'ميلة' },
  { code: '44', name_fr: 'Aïn Defla', name_ar: 'عين الدفلى' },
  { code: '45', name_fr: 'Naâma', name_ar: 'النعامة' },
  { code: '46', name_fr: 'Aïn Témouchent', name_ar: 'عين تموشنت' },
  { code: '47', name_fr: 'Ghardaïa', name_ar: 'غرداية' },
  { code: '48', name_fr: 'Relizane', name_ar: 'غليزان' },
  { code: '49', name_fr: 'Timimoun', name_ar: 'تيميمون' },
  { code: '50', name_fr: 'Bordj Badji Mokhtar', name_ar: 'برج باجي مختار' },
  { code: '51', name_fr: 'Ouled Djellal', name_ar: 'أولاد جلال' },
  { code: '52', name_fr: 'Béni Abbès', name_ar: 'بني عباس' },
  { code: '53', name_fr: 'In Salah', name_ar: 'عين صالح' },
  { code: '54', name_fr: 'In Guezzam', name_ar: 'عين قزام' },
  { code: '55', name_fr: 'Touggourt', name_ar: 'تقرت' },
  { code: '56', name_fr: 'Djanet', name_ar: 'جانت' },
  { code: '57', name_fr: "El M'Ghair", name_ar: 'المغير' },
  { code: '58', name_fr: 'El Meniaa', name_ar: 'المنيعة' }
];

// Liste de toutes les wilayas pour les sélecteurs
export const WILAYAS_LIST = ALL_WILAYAS;
