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
  '01': { code: '01', name_fr: 'Adrar', name_ar: 'أدرار', code_postal_prefix: '01', tribunaux: [{ name_fr: 'Tribunal d\'Adrar', name_ar: 'محكمة أدرار', address: 'Adrar', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière d\'Adrar', name_ar: 'المحافظة العقارية أدرار', address: 'Adrar', circonscription: ['Adrar'] }], barreau: { name_fr: 'Barreau d\'Adrar', name_ar: 'نقابة المحامين أدرار', address: 'Adrar' }, chambre_notaires: { name_fr: 'Chambre des Notaires d\'Adrar', name_ar: 'غرفة الموثقين أدرار', address: 'Adrar' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers d\'Adrar', name_ar: 'غرفة المحضرين أدرار', address: 'Adrar' }, format_rc: '01/XXXXXXXX', format_nif: '099901XXXXXXXXX', specificites: [] },
  '02': { code: '02', name_fr: 'Chlef', name_ar: 'الشلف', code_postal_prefix: '02', tribunaux: [{ name_fr: 'Tribunal de Chlef', name_ar: 'محكمة الشلف', address: 'Chlef', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Chlef', name_ar: 'المحافظة العقارية الشلف', address: 'Chlef', circonscription: ['Chlef'] }], barreau: { name_fr: 'Barreau de Chlef', name_ar: 'نقابة المحامين الشلف', address: 'Chlef' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Chlef', name_ar: 'غرفة الموثقين الشلف', address: 'Chlef' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Chlef', name_ar: 'غرفة المحضرين الشلف', address: 'Chlef' }, format_rc: '02/XXXXXXXX', format_nif: '099902XXXXXXXXX', specificites: [] },
  '03': { code: '03', name_fr: 'Laghouat', name_ar: 'الأغواط', code_postal_prefix: '03', tribunaux: [{ name_fr: 'Tribunal de Laghouat', name_ar: 'محكمة الأغواط', address: 'Laghouat', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Laghouat', name_ar: 'المحافظة العقارية الأغواط', address: 'Laghouat', circonscription: ['Laghouat'] }], barreau: { name_fr: 'Barreau de Laghouat', name_ar: 'نقابة المحامين الأغواط', address: 'Laghouat' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Laghouat', name_ar: 'غرفة الموثقين الأغواط', address: 'Laghouat' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Laghouat', name_ar: 'غرفة المحضرين الأغواط', address: 'Laghouat' }, format_rc: '03/XXXXXXXX', format_nif: '099903XXXXXXXXX', specificites: [] },
  '04': { code: '04', name_fr: 'Oum El Bouaghi', name_ar: 'أم البواقي', code_postal_prefix: '04', tribunaux: [{ name_fr: 'Tribunal d\'Oum El Bouaghi', name_ar: 'محكمة أم البواقي', address: 'Oum El Bouaghi', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière d\'Oum El Bouaghi', name_ar: 'المحافظة العقارية أم البواقي', address: 'Oum El Bouaghi', circonscription: ['Oum El Bouaghi'] }], barreau: { name_fr: 'Barreau d\'Oum El Bouaghi', name_ar: 'نقابة المحامين أم البواقي', address: 'Oum El Bouaghi' }, chambre_notaires: { name_fr: 'Chambre des Notaires d\'Oum El Bouaghi', name_ar: 'غرفة الموثقين أم البواقي', address: 'Oum El Bouaghi' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers d\'Oum El Bouaghi', name_ar: 'غرفة المحضرين أم البواقي', address: 'Oum El Bouaghi' }, format_rc: '04/XXXXXXXX', format_nif: '099904XXXXXXXXX', specificites: [] },
  '05': { code: '05', name_fr: 'Batna', name_ar: 'باتنة', code_postal_prefix: '05', tribunaux: [{ name_fr: 'Tribunal de Batna', name_ar: 'محكمة باتنة', address: 'Batna', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Batna', name_ar: 'المحافظة العقارية باتنة', address: 'Batna', circonscription: ['Batna'] }], barreau: { name_fr: 'Barreau de Batna', name_ar: 'نقابة المحامين باتنة', address: 'Batna' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Batna', name_ar: 'غرفة الموثقين باتنة', address: 'Batna' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Batna', name_ar: 'غرفة المحضرين باتنة', address: 'Batna' }, format_rc: '05/XXXXXXXX', format_nif: '099905XXXXXXXXX', specificites: [] },
  '07': { code: '07', name_fr: 'Biskra', name_ar: 'بسكرة', code_postal_prefix: '07', tribunaux: [{ name_fr: 'Tribunal de Biskra', name_ar: 'محكمة بسكرة', address: 'Biskra', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Biskra', name_ar: 'المحافظة العقارية بسكرة', address: 'Biskra', circonscription: ['Biskra'] }], barreau: { name_fr: 'Barreau de Biskra', name_ar: 'نقابة المحامين بسكرة', address: 'Biskra' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Biskra', name_ar: 'غرفة الموثقين بسكرة', address: 'Biskra' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Biskra', name_ar: 'غرفة المحضرين بسكرة', address: 'Biskra' }, format_rc: '07/XXXXXXXX', format_nif: '099907XXXXXXXXX', specificites: [] },
  '08': { code: '08', name_fr: 'Béchar', name_ar: 'بشار', code_postal_prefix: '08', tribunaux: [{ name_fr: 'Tribunal de Béchar', name_ar: 'محكمة بشار', address: 'Béchar', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Béchar', name_ar: 'المحافظة العقارية بشار', address: 'Béchar', circonscription: ['Béchar'] }], barreau: { name_fr: 'Barreau de Béchar', name_ar: 'نقابة المحامين بشار', address: 'Béchar' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Béchar', name_ar: 'غرفة الموثقين بشار', address: 'Béchar' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Béchar', name_ar: 'غرفة المحضرين بشار', address: 'Béchar' }, format_rc: '08/XXXXXXXX', format_nif: '099908XXXXXXXXX', specificites: [] },
  '10': { code: '10', name_fr: 'Bouira', name_ar: 'البويرة', code_postal_prefix: '10', tribunaux: [{ name_fr: 'Tribunal de Bouira', name_ar: 'محكمة البويرة', address: 'Bouira', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Bouira', name_ar: 'المحافظة العقارية البويرة', address: 'Bouira', circonscription: ['Bouira'] }], barreau: { name_fr: 'Barreau de Bouira', name_ar: 'نقابة المحامين البويرة', address: 'Bouira' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Bouira', name_ar: 'غرفة الموثقين البويرة', address: 'Bouira' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Bouira', name_ar: 'غرفة المحضرين البويرة', address: 'Bouira' }, format_rc: '10/XXXXXXXX', format_nif: '099910XXXXXXXXX', specificites: [] },
  '11': { code: '11', name_fr: 'Tamanrasset', name_ar: 'تمنراست', code_postal_prefix: '11', tribunaux: [{ name_fr: 'Tribunal de Tamanrasset', name_ar: 'محكمة تمنراست', address: 'Tamanrasset', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Tamanrasset', name_ar: 'المحافظة العقارية تمنراست', address: 'Tamanrasset', circonscription: ['Tamanrasset'] }], barreau: { name_fr: 'Barreau de Tamanrasset', name_ar: 'نقابة المحامين تمنراست', address: 'Tamanrasset' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Tamanrasset', name_ar: 'غرفة الموثقين تمنراست', address: 'Tamanrasset' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Tamanrasset', name_ar: 'غرفة المحضرين تمنراست', address: 'Tamanrasset' }, format_rc: '11/XXXXXXXX', format_nif: '099911XXXXXXXXX', specificites: [] },
  '12': { code: '12', name_fr: 'Tébessa', name_ar: 'تبسة', code_postal_prefix: '12', tribunaux: [{ name_fr: 'Tribunal de Tébessa', name_ar: 'محكمة تبسة', address: 'Tébessa', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Tébessa', name_ar: 'المحافظة العقارية تبسة', address: 'Tébessa', circonscription: ['Tébessa'] }], barreau: { name_fr: 'Barreau de Tébessa', name_ar: 'نقابة المحامين تبسة', address: 'Tébessa' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Tébessa', name_ar: 'غرفة الموثقين تبسة', address: 'Tébessa' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Tébessa', name_ar: 'غرفة المحضرين تبسة', address: 'Tébessa' }, format_rc: '12/XXXXXXXX', format_nif: '099912XXXXXXXXX', specificites: [] },
  '13': { code: '13', name_fr: 'Tlemcen', name_ar: 'تلمسان', code_postal_prefix: '13', tribunaux: [{ name_fr: 'Tribunal de Tlemcen', name_ar: 'محكمة تلمسان', address: 'Tlemcen', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Tlemcen', name_ar: 'المحافظة العقارية تلمسان', address: 'Tlemcen', circonscription: ['Tlemcen'] }], barreau: { name_fr: 'Barreau de Tlemcen', name_ar: 'نقابة المحامين تلمسان', address: 'Tlemcen' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Tlemcen', name_ar: 'غرفة الموثقين تلمسان', address: 'Tlemcen' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Tlemcen', name_ar: 'غرفة المحضرين تلمسان', address: 'Tlemcen' }, format_rc: '13/XXXXXXXX', format_nif: '099913XXXXXXXXX', specificites: [] },
  '14': { code: '14', name_fr: 'Tiaret', name_ar: 'تيارت', code_postal_prefix: '14', tribunaux: [{ name_fr: 'Tribunal de Tiaret', name_ar: 'محكمة تيارت', address: 'Tiaret', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Tiaret', name_ar: 'المحافظة العقارية تيارت', address: 'Tiaret', circonscription: ['Tiaret'] }], barreau: { name_fr: 'Barreau de Tiaret', name_ar: 'نقابة المحامين تيارت', address: 'Tiaret' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Tiaret', name_ar: 'غرفة الموثقين تيارت', address: 'Tiaret' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Tiaret', name_ar: 'غرفة المحضرين تيارت', address: 'Tiaret' }, format_rc: '14/XXXXXXXX', format_nif: '099914XXXXXXXXX', specificites: [] },
  '17': { code: '17', name_fr: 'Djelfa', name_ar: 'الجلفة', code_postal_prefix: '17', tribunaux: [{ name_fr: 'Tribunal de Djelfa', name_ar: 'محكمة الجلفة', address: 'Djelfa', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Djelfa', name_ar: 'المحافظة العقارية الجلفة', address: 'Djelfa', circonscription: ['Djelfa'] }], barreau: { name_fr: 'Barreau de Djelfa', name_ar: 'نقابة المحامين الجلفة', address: 'Djelfa' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Djelfa', name_ar: 'غرفة الموثقين الجلفة', address: 'Djelfa' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Djelfa', name_ar: 'غرفة المحضرين الجلفة', address: 'Djelfa' }, format_rc: '17/XXXXXXXX', format_nif: '099917XXXXXXXXX', specificites: [] },
  '18': { code: '18', name_fr: 'Jijel', name_ar: 'جيجل', code_postal_prefix: '18', tribunaux: [{ name_fr: 'Tribunal de Jijel', name_ar: 'محكمة جيجل', address: 'Jijel', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Jijel', name_ar: 'المحافظة العقارية جيجل', address: 'Jijel', circonscription: ['Jijel'] }], barreau: { name_fr: 'Barreau de Jijel', name_ar: 'نقابة المحامين جيجل', address: 'Jijel' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Jijel', name_ar: 'غرفة الموثقين جيجل', address: 'Jijel' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Jijel', name_ar: 'غرفة المحضرين جيجل', address: 'Jijel' }, format_rc: '18/XXXXXXXX', format_nif: '099918XXXXXXXXX', specificites: [] },
  '20': { code: '20', name_fr: 'Saïda', name_ar: 'سعيدة', code_postal_prefix: '20', tribunaux: [{ name_fr: 'Tribunal de Saïda', name_ar: 'محكمة سعيدة', address: 'Saïda', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Saïda', name_ar: 'المحافظة العقارية سعيدة', address: 'Saïda', circonscription: ['Saïda'] }], barreau: { name_fr: 'Barreau de Saïda', name_ar: 'نقابة المحامين سعيدة', address: 'Saïda' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Saïda', name_ar: 'غرفة الموثقين سعيدة', address: 'Saïda' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Saïda', name_ar: 'غرفة المحضرين سعيدة', address: 'Saïda' }, format_rc: '20/XXXXXXXX', format_nif: '099920XXXXXXXXX', specificites: [] },
  '21': { code: '21', name_fr: 'Skikda', name_ar: 'سكيكدة', code_postal_prefix: '21', tribunaux: [{ name_fr: 'Tribunal de Skikda', name_ar: 'محكمة سكيكدة', address: 'Skikda', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Skikda', name_ar: 'المحافظة العقارية سكيكدة', address: 'Skikda', circonscription: ['Skikda'] }], barreau: { name_fr: 'Barreau de Skikda', name_ar: 'نقابة المحامين سكيكدة', address: 'Skikda' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Skikda', name_ar: 'غرفة الموثقين سكيكدة', address: 'Skikda' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Skikda', name_ar: 'غرفة المحضرين سكيكدة', address: 'Skikda' }, format_rc: '21/XXXXXXXX', format_nif: '099921XXXXXXXXX', specificites: [] },
  '22': { code: '22', name_fr: 'Sidi Bel Abbès', name_ar: 'سيدي بلعباس', code_postal_prefix: '22', tribunaux: [{ name_fr: 'Tribunal de Sidi Bel Abbès', name_ar: 'محكمة سيدي بلعباس', address: 'Sidi Bel Abbès', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Sidi Bel Abbès', name_ar: 'المحافظة العقارية سيدي بلعباس', address: 'Sidi Bel Abbès', circonscription: ['Sidi Bel Abbès'] }], barreau: { name_fr: 'Barreau de Sidi Bel Abbès', name_ar: 'نقابة المحامين سيدي بلعباس', address: 'Sidi Bel Abbès' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Sidi Bel Abbès', name_ar: 'غرفة الموثقين سيدي بلعباس', address: 'Sidi Bel Abbès' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Sidi Bel Abbès', name_ar: 'غرفة المحضرين سيدي بلعباس', address: 'Sidi Bel Abbès' }, format_rc: '22/XXXXXXXX', format_nif: '099922XXXXXXXXX', specificites: [] },
  '24': { code: '24', name_fr: 'Guelma', name_ar: 'قالمة', code_postal_prefix: '24', tribunaux: [{ name_fr: 'Tribunal de Guelma', name_ar: 'محكمة قالمة', address: 'Guelma', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Guelma', name_ar: 'المحافظة العقارية قالمة', address: 'Guelma', circonscription: ['Guelma'] }], barreau: { name_fr: 'Barreau de Guelma', name_ar: 'نقابة المحامين قالمة', address: 'Guelma' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Guelma', name_ar: 'غرفة الموثقين قالمة', address: 'Guelma' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Guelma', name_ar: 'غرفة المحضرين قالمة', address: 'Guelma' }, format_rc: '24/XXXXXXXX', format_nif: '099924XXXXXXXXX', specificites: [] },
  '26': { code: '26', name_fr: 'Médéa', name_ar: 'المدية', code_postal_prefix: '26', tribunaux: [{ name_fr: 'Tribunal de Médéa', name_ar: 'محكمة المدية', address: 'Médéa', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Médéa', name_ar: 'المحافظة العقارية المدية', address: 'Médéa', circonscription: ['Médéa'] }], barreau: { name_fr: 'Barreau de Médéa', name_ar: 'نقابة المحامين المدية', address: 'Médéa' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Médéa', name_ar: 'غرفة الموثقين المدية', address: 'Médéa' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Médéa', name_ar: 'غرفة المحضرين المدية', address: 'Médéa' }, format_rc: '26/XXXXXXXX', format_nif: '099926XXXXXXXXX', specificites: [] },
  '27': { code: '27', name_fr: 'Mostaganem', name_ar: 'مستغانم', code_postal_prefix: '27', tribunaux: [{ name_fr: 'Tribunal de Mostaganem', name_ar: 'محكمة مستغانم', address: 'Mostaganem', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Mostaganem', name_ar: 'المحافظة العقارية مستغانم', address: 'Mostaganem', circonscription: ['Mostaganem'] }], barreau: { name_fr: 'Barreau de Mostaganem', name_ar: 'نقابة المحامين مستغانم', address: 'Mostaganem' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Mostaganem', name_ar: 'غرفة الموثقين مستغانم', address: 'Mostaganem' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Mostaganem', name_ar: 'غرفة المحضرين مستغانم', address: 'Mostaganem' }, format_rc: '27/XXXXXXXX', format_nif: '099927XXXXXXXXX', specificites: [] },
  '28': { code: '28', name_fr: 'M\'Sila', name_ar: 'المسيلة', code_postal_prefix: '28', tribunaux: [{ name_fr: 'Tribunal de M\'Sila', name_ar: 'محكمة المسيلة', address: 'M\'Sila', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de M\'Sila', name_ar: 'المحافظة العقارية المسيلة', address: 'M\'Sila', circonscription: ['M\'Sila'] }], barreau: { name_fr: 'Barreau de M\'Sila', name_ar: 'نقابة المحامين المسيلة', address: 'M\'Sila' }, chambre_notaires: { name_fr: 'Chambre des Notaires de M\'Sila', name_ar: 'غرفة الموثقين المسيلة', address: 'M\'Sila' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de M\'Sila', name_ar: 'غرفة المحضرين المسيلة', address: 'M\'Sila' }, format_rc: '28/XXXXXXXX', format_nif: '099928XXXXXXXXX', specificites: [] },
  '29': { code: '29', name_fr: 'Mascara', name_ar: 'معسكر', code_postal_prefix: '29', tribunaux: [{ name_fr: 'Tribunal de Mascara', name_ar: 'محكمة معسكر', address: 'Mascara', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Mascara', name_ar: 'المحافظة العقارية معسكر', address: 'Mascara', circonscription: ['Mascara'] }], barreau: { name_fr: 'Barreau de Mascara', name_ar: 'نقابة المحامين معسكر', address: 'Mascara' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Mascara', name_ar: 'غرفة الموثقين معسكر', address: 'Mascara' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Mascara', name_ar: 'غرفة المحضرين معسكر', address: 'Mascara' }, format_rc: '29/XXXXXXXX', format_nif: '099929XXXXXXXXX', specificites: [] },
  '30': { code: '30', name_fr: 'Ouargla', name_ar: 'ورقلة', code_postal_prefix: '30', tribunaux: [{ name_fr: 'Tribunal de Ouargla', name_ar: 'محكمة ورقلة', address: 'Ouargla', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Ouargla', name_ar: 'المحافظة العقارية ورقلة', address: 'Ouargla', circonscription: ['Ouargla'] }], barreau: { name_fr: 'Barreau de Ouargla', name_ar: 'نقابة المحامين ورقلة', address: 'Ouargla' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Ouargla', name_ar: 'غرفة الموثقين ورقلة', address: 'Ouargla' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Ouargla', name_ar: 'غرفة المحضرين ورقلة', address: 'Ouargla' }, format_rc: '30/XXXXXXXX', format_nif: '099930XXXXXXXXX', specificites: [] },
  '32': { code: '32', name_fr: 'El Bayadh', name_ar: 'البيض', code_postal_prefix: '32', tribunaux: [{ name_fr: 'Tribunal de El Bayadh', name_ar: 'محكمة البيض', address: 'El Bayadh', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de El Bayadh', name_ar: 'المحافظة العقارية البيض', address: 'El Bayadh', circonscription: ['El Bayadh'] }], barreau: { name_fr: 'Barreau de El Bayadh', name_ar: 'نقابة المحامين البيض', address: 'El Bayadh' }, chambre_notaires: { name_fr: 'Chambre des Notaires de El Bayadh', name_ar: 'غرفة الموثقين البيض', address: 'El Bayadh' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de El Bayadh', name_ar: 'غرفة المحضرين البيض', address: 'El Bayadh' }, format_rc: '32/XXXXXXXX', format_nif: '099932XXXXXXXXX', specificites: [] },
  '33': { code: '33', name_fr: 'Illizi', name_ar: 'إليزي', code_postal_prefix: '33', tribunaux: [{ name_fr: 'Tribunal de Illizi', name_ar: 'محكمة إليزي', address: 'Illizi', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Illizi', name_ar: 'المحافظة العقارية إليزي', address: 'Illizi', circonscription: ['Illizi'] }], barreau: { name_fr: 'Barreau de Illizi', name_ar: 'نقابة المحامين إليزي', address: 'Illizi' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Illizi', name_ar: 'غرفة الموثقين إليزي', address: 'Illizi' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Illizi', name_ar: 'غرفة المحضرين إليزي', address: 'Illizi' }, format_rc: '33/XXXXXXXX', format_nif: '099933XXXXXXXXX', specificites: [] },
  '34': { code: '34', name_fr: 'Bordj Bou Arréridj', name_ar: 'برج بوعريريج', code_postal_prefix: '34', tribunaux: [{ name_fr: 'Tribunal de Bordj Bou Arréridj', name_ar: 'محكمة برج بوعريريج', address: 'Bordj Bou Arréridj', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Bordj Bou Arréridj', name_ar: 'المحافظة العقارية برج بوعريريج', address: 'Bordj Bou Arréridj', circonscription: ['Bordj Bou Arréridj'] }], barreau: { name_fr: 'Barreau de Bordj Bou Arréridj', name_ar: 'نقابة المحامين برج بوعريريج', address: 'Bordj Bou Arréridj' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Bordj Bou Arréridj', name_ar: 'غرفة الموثقين برج بوعريريج', address: 'Bordj Bou Arréridj' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Bordj Bou Arréridj', name_ar: 'غرفة المحضرين برج بوعريريج', address: 'Bordj Bou Arréridj' }, format_rc: '34/XXXXXXXX', format_nif: '099934XXXXXXXXX', specificites: [] },
  '35': { code: '35', name_fr: 'Boumerdès', name_ar: 'بومرداس', code_postal_prefix: '35', tribunaux: [{ name_fr: 'Tribunal de Boumerdès', name_ar: 'محكمة بومرداس', address: 'Boumerdès', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Boumerdès', name_ar: 'المحافظة العقارية بومرداس', address: 'Boumerdès', circonscription: ['Boumerdès'] }], barreau: { name_fr: 'Barreau de Boumerdès', name_ar: 'نقابة المحامين بومرداس', address: 'Boumerdès' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Boumerdès', name_ar: 'غرفة الموثقين بومرداس', address: 'Boumerdès' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Boumerdès', name_ar: 'غرفة المحضرين بومرداس', address: 'Boumerdès' }, format_rc: '35/XXXXXXXX', format_nif: '099935XXXXXXXXX', specificites: [] },
  '36': { code: '36', name_fr: 'El Tarf', name_ar: 'الطارف', code_postal_prefix: '36', tribunaux: [{ name_fr: 'Tribunal de El Tarf', name_ar: 'محكمة الطارف', address: 'El Tarf', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de El Tarf', name_ar: 'المحافظة العقارية الطارف', address: 'El Tarf', circonscription: ['El Tarf'] }], barreau: { name_fr: 'Barreau de El Tarf', name_ar: 'نقابة المحامين الطارف', address: 'El Tarf' }, chambre_notaires: { name_fr: 'Chambre des Notaires de El Tarf', name_ar: 'غرفة الموثقين الطارف', address: 'El Tarf' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de El Tarf', name_ar: 'غرفة المحضرين الطارف', address: 'El Tarf' }, format_rc: '36/XXXXXXXX', format_nif: '099936XXXXXXXXX', specificites: [] },
  '37': { code: '37', name_fr: 'Tindouf', name_ar: 'تندوف', code_postal_prefix: '37', tribunaux: [{ name_fr: 'Tribunal de Tindouf', name_ar: 'محكمة تندوف', address: 'Tindouf', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Tindouf', name_ar: 'المحافظة العقارية تندوف', address: 'Tindouf', circonscription: ['Tindouf'] }], barreau: { name_fr: 'Barreau de Tindouf', name_ar: 'نقابة المحامين تندوف', address: 'Tindouf' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Tindouf', name_ar: 'غرفة الموثقين تندوف', address: 'Tindouf' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Tindouf', name_ar: 'غرفة المحضرين تندوف', address: 'Tindouf' }, format_rc: '37/XXXXXXXX', format_nif: '099937XXXXXXXXX', specificites: [] },
  '38': { code: '38', name_fr: 'Tissemsilt', name_ar: 'تيسمسيلت', code_postal_prefix: '38', tribunaux: [{ name_fr: 'Tribunal de Tissemsilt', name_ar: 'محكمة تيسمسيلت', address: 'Tissemsilt', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Tissemsilt', name_ar: 'المحافظة العقارية تيسمسيلت', address: 'Tissemsilt', circonscription: ['Tissemsilt'] }], barreau: { name_fr: 'Barreau de Tissemsilt', name_ar: 'نقابة المحامين تيسمسيلت', address: 'Tissemsilt' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Tissemsilt', name_ar: 'غرفة الموثقين تيسمسيلت', address: 'Tissemsilt' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Tissemsilt', name_ar: 'غرفة المحضرين تيسمسيلت', address: 'Tissemsilt' }, format_rc: '38/XXXXXXXX', format_nif: '099938XXXXXXXXX', specificites: [] },
  '39': { code: '39', name_fr: 'El Oued', name_ar: 'الوادي', code_postal_prefix: '39', tribunaux: [{ name_fr: 'Tribunal de El Oued', name_ar: 'محكمة الوادي', address: 'El Oued', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de El Oued', name_ar: 'المحافظة العقارية الوادي', address: 'El Oued', circonscription: ['El Oued'] }], barreau: { name_fr: 'Barreau de El Oued', name_ar: 'نقابة المحامين الوادي', address: 'El Oued' }, chambre_notaires: { name_fr: 'Chambre des Notaires de El Oued', name_ar: 'غرفة الموثقين الوادي', address: 'El Oued' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de El Oued', name_ar: 'غرفة المحضرين الوادي', address: 'El Oued' }, format_rc: '39/XXXXXXXX', format_nif: '099939XXXXXXXXX', specificites: [] },
  '40': { code: '40', name_fr: 'Khenchela', name_ar: 'خنشلة', code_postal_prefix: '40', tribunaux: [{ name_fr: 'Tribunal de Khenchela', name_ar: 'محكمة خنشلة', address: 'Khenchela', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Khenchela', name_ar: 'المحافظة العقارية خنشلة', address: 'Khenchela', circonscription: ['Khenchela'] }], barreau: { name_fr: 'Barreau de Khenchela', name_ar: 'نقابة المحامين خنشلة', address: 'Khenchela' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Khenchela', name_ar: 'غرفة الموثقين خنشلة', address: 'Khenchela' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Khenchela', name_ar: 'غرفة المحضرين خنشلة', address: 'Khenchela' }, format_rc: '40/XXXXXXXX', format_nif: '099940XXXXXXXXX', specificites: [] },
  '41': { code: '41', name_fr: 'Souk Ahras', name_ar: 'سوق أهراس', code_postal_prefix: '41', tribunaux: [{ name_fr: 'Tribunal de Souk Ahras', name_ar: 'محكمة سوق أهراس', address: 'Souk Ahras', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Souk Ahras', name_ar: 'المحافظة العقارية سوق أهراس', address: 'Souk Ahras', circonscription: ['Souk Ahras'] }], barreau: { name_fr: 'Barreau de Souk Ahras', name_ar: 'نقابة المحامين سوق أهراس', address: 'Souk Ahras' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Souk Ahras', name_ar: 'غرفة الموثقين سوق أهراس', address: 'Souk Ahras' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Souk Ahras', name_ar: 'غرفة المحضرين سوق أهراس', address: 'Souk Ahras' }, format_rc: '41/XXXXXXXX', format_nif: '099941XXXXXXXXX', specificites: [] },
  '42': { code: '42', name_fr: 'Tipaza', name_ar: 'تيبازة', code_postal_prefix: '42', tribunaux: [{ name_fr: 'Tribunal de Tipaza', name_ar: 'محكمة تيبازة', address: 'Tipaza', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Tipaza', name_ar: 'المحافظة العقارية تيبازة', address: 'Tipaza', circonscription: ['Tipaza'] }], barreau: { name_fr: 'Barreau de Tipaza', name_ar: 'نقابة المحامين تيبازة', address: 'Tipaza' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Tipaza', name_ar: 'غرفة الموثقين تيبازة', address: 'Tipaza' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Tipaza', name_ar: 'غرفة المحضرين تيبازة', address: 'Tipaza' }, format_rc: '42/XXXXXXXX', format_nif: '099942XXXXXXXXX', specificites: [] },
  '43': { code: '43', name_fr: 'Mila', name_ar: 'ميلة', code_postal_prefix: '43', tribunaux: [{ name_fr: 'Tribunal de Mila', name_ar: 'محكمة ميلة', address: 'Mila', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Mila', name_ar: 'المحافظة العقارية ميلة', address: 'Mila', circonscription: ['Mila'] }], barreau: { name_fr: 'Barreau de Mila', name_ar: 'نقابة المحامين ميلة', address: 'Mila' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Mila', name_ar: 'غرفة الموثقين ميلة', address: 'Mila' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Mila', name_ar: 'غرفة المحضرين ميلة', address: 'Mila' }, format_rc: '43/XXXXXXXX', format_nif: '099943XXXXXXXXX', specificites: [] },
  '44': { code: '44', name_fr: 'Aïn Defla', name_ar: 'عين الدفلى', code_postal_prefix: '44', tribunaux: [{ name_fr: 'Tribunal de Aïn Defla', name_ar: 'محكمة عين الدفلى', address: 'Aïn Defla', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Aïn Defla', name_ar: 'المحافظة العقارية عين الدفلى', address: 'Aïn Defla', circonscription: ['Aïn Defla'] }], barreau: { name_fr: 'Barreau de Aïn Defla', name_ar: 'نقابة المحامين عين الدفلى', address: 'Aïn Defla' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Aïn Defla', name_ar: 'غرفة الموثقين عين الدفلى', address: 'Aïn Defla' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Aïn Defla', name_ar: 'غرفة المحضرين عين الدفلى', address: 'Aïn Defla' }, format_rc: '44/XXXXXXXX', format_nif: '099944XXXXXXXXX', specificites: [] },
  '45': { code: '45', name_fr: 'Naâma', name_ar: 'النعامة', code_postal_prefix: '45', tribunaux: [{ name_fr: 'Tribunal de Naâma', name_ar: 'محكمة النعامة', address: 'Naâma', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Naâma', name_ar: 'المحافظة العقارية النعامة', address: 'Naâma', circonscription: ['Naâma'] }], barreau: { name_fr: 'Barreau de Naâma', name_ar: 'نقابة المحامين النعامة', address: 'Naâma' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Naâma', name_ar: 'غرفة الموثقين النعامة', address: 'Naâma' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Naâma', name_ar: 'غرفة المحضرين النعامة', address: 'Naâma' }, format_rc: '45/XXXXXXXX', format_nif: '099945XXXXXXXXX', specificites: [] },
  '46': { code: '46', name_fr: 'Aïn Témouchent', name_ar: 'عين تموشنت', code_postal_prefix: '46', tribunaux: [{ name_fr: 'Tribunal de Aïn Témouchent', name_ar: 'محكمة عين تموشنت', address: 'Aïn Témouchent', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Aïn Témouchent', name_ar: 'المحافظة العقارية عين تموشنت', address: 'Aïn Témouchent', circonscription: ['Aïn Témouchent'] }], barreau: { name_fr: 'Barreau de Aïn Témouchent', name_ar: 'نقابة المحامين عين تموشنت', address: 'Aïn Témouchent' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Aïn Témouchent', name_ar: 'غرفة الموثقين عين تموشنت', address: 'Aïn Témouchent' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Aïn Témouchent', name_ar: 'غرفة المحضرين عين تموشنت', address: 'Aïn Témouchent' }, format_rc: '46/XXXXXXXX', format_nif: '099946XXXXXXXXX', specificites: [] },
  '47': { code: '47', name_fr: 'Ghardaïa', name_ar: 'غرداية', code_postal_prefix: '47', tribunaux: [{ name_fr: 'Tribunal de Ghardaïa', name_ar: 'محكمة غرداية', address: 'Ghardaïa', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Ghardaïa', name_ar: 'المحافظة العقارية غرداية', address: 'Ghardaïa', circonscription: ['Ghardaïa'] }], barreau: { name_fr: 'Barreau de Ghardaïa', name_ar: 'نقابة المحامين غرداية', address: 'Ghardaïa' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Ghardaïa', name_ar: 'غرفة الموثقين غرداية', address: 'Ghardaïa' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Ghardaïa', name_ar: 'غرفة المحضرين غرداية', address: 'Ghardaïa' }, format_rc: '47/XXXXXXXX', format_nif: '099947XXXXXXXXX', specificites: [] },
  '48': { code: '48', name_fr: 'Relizane', name_ar: 'غليزان', code_postal_prefix: '48', tribunaux: [{ name_fr: 'Tribunal de Relizane', name_ar: 'محكمة غليزان', address: 'Relizane', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Relizane', name_ar: 'المحافظة العقارية غليزان', address: 'Relizane', circonscription: ['Relizane'] }], barreau: { name_fr: 'Barreau de Relizane', name_ar: 'نقابة المحامين غليزان', address: 'Relizane' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Relizane', name_ar: 'غرفة الموثقين غليزان', address: 'Relizane' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Relizane', name_ar: 'غرفة المحضرين غليزان', address: 'Relizane' }, format_rc: '48/XXXXXXXX', format_nif: '099948XXXXXXXXX', specificites: [] },
  '49': { code: '49', name_fr: 'Timimoun', name_ar: 'تيميمون', code_postal_prefix: '49', tribunaux: [{ name_fr: 'Tribunal de Timimoun', name_ar: 'محكمة تيميمون', address: 'Timimoun', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Timimoun', name_ar: 'المحافظة العقارية تيميمون', address: 'Timimoun', circonscription: ['Timimoun'] }], barreau: { name_fr: 'Barreau de Timimoun', name_ar: 'نقابة المحامين تيميمون', address: 'Timimoun' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Timimoun', name_ar: 'غرفة الموثقين تيميمون', address: 'Timimoun' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Timimoun', name_ar: 'غرفة المحضرين تيميمون', address: 'Timimoun' }, format_rc: '49/XXXXXXXX', format_nif: '099949XXXXXXXXX', specificites: [] },
  '50': { code: '50', name_fr: 'Bordj Badji Mokhtar', name_ar: 'برج باجي مختار', code_postal_prefix: '50', tribunaux: [{ name_fr: 'Tribunal de Bordj Badji Mokhtar', name_ar: 'محكمة برج باجي مختار', address: 'Bordj Badji Mokhtar', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Bordj Badji Mokhtar', name_ar: 'المحافظة العقارية برج باجي مختار', address: 'Bordj Badji Mokhtar', circonscription: ['Bordj Badji Mokhtar'] }], barreau: { name_fr: 'Barreau de Bordj Badji Mokhtar', name_ar: 'نقابة المحامين برج باجي مختار', address: 'Bordj Badji Mokhtar' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Bordj Badji Mokhtar', name_ar: 'غرفة الموثقين برج باجي مختار', address: 'Bordj Badji Mokhtar' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Bordj Badji Mokhtar', name_ar: 'غرفة المحضرين برج باجي مختار', address: 'Bordj Badji Mokhtar' }, format_rc: '50/XXXXXXXX', format_nif: '099950XXXXXXXXX', specificites: [] },
  '51': { code: '51', name_fr: 'Ouled Djellal', name_ar: 'أولاد جلال', code_postal_prefix: '51', tribunaux: [{ name_fr: 'Tribunal de Ouled Djellal', name_ar: 'محكمة أولاد جلال', address: 'Ouled Djellal', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Ouled Djellal', name_ar: 'المحافظة العقارية أولاد جلال', address: 'Ouled Djellal', circonscription: ['Ouled Djellal'] }], barreau: { name_fr: 'Barreau de Ouled Djellal', name_ar: 'نقابة المحامين أولاد جلال', address: 'Ouled Djellal' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Ouled Djellal', name_ar: 'غرفة الموثقين أولاد جلال', address: 'Ouled Djellal' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Ouled Djellal', name_ar: 'غرفة المحضرين أولاد جلال', address: 'Ouled Djellal' }, format_rc: '51/XXXXXXXX', format_nif: '099951XXXXXXXXX', specificites: [] },
  '52': { code: '52', name_fr: 'Béni Abbès', name_ar: 'بني عباس', code_postal_prefix: '52', tribunaux: [{ name_fr: 'Tribunal de Béni Abbès', name_ar: 'محكمة بني عباس', address: 'Béni Abbès', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Béni Abbès', name_ar: 'المحافظة العقارية بني عباس', address: 'Béni Abbès', circonscription: ['Béni Abbès'] }], barreau: { name_fr: 'Barreau de Béni Abbès', name_ar: 'نقابة المحامين بني عباس', address: 'Béni Abbès' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Béni Abbès', name_ar: 'غرفة الموثقين بني عباس', address: 'Béni Abbès' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Béni Abbès', name_ar: 'غرفة المحضرين بني عباس', address: 'Béni Abbès' }, format_rc: '52/XXXXXXXX', format_nif: '099952XXXXXXXXX', specificites: [] },
  '53': { code: '53', name_fr: 'In Salah', name_ar: 'عين صالح', code_postal_prefix: '53', tribunaux: [{ name_fr: 'Tribunal de In Salah', name_ar: 'محكمة عين صالح', address: 'In Salah', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de In Salah', name_ar: 'المحافظة العقارية عين صالح', address: 'In Salah', circonscription: ['In Salah'] }], barreau: { name_fr: 'Barreau de In Salah', name_ar: 'نقابة المحامين عين صالح', address: 'In Salah' }, chambre_notaires: { name_fr: 'Chambre des Notaires de In Salah', name_ar: 'غرفة الموثقين عين صالح', address: 'In Salah' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de In Salah', name_ar: 'غرفة المحضرين عين صالح', address: 'In Salah' }, format_rc: '53/XXXXXXXX', format_nif: '099953XXXXXXXXX', specificites: [] },
  '54': { code: '54', name_fr: 'In Guezzam', name_ar: 'عين قزام', code_postal_prefix: '54', tribunaux: [{ name_fr: 'Tribunal de In Guezzam', name_ar: 'محكمة عين قزام', address: 'In Guezzam', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de In Guezzam', name_ar: 'المحافظة العقارية عين قزام', address: 'In Guezzam', circonscription: ['In Guezzam'] }], barreau: { name_fr: 'Barreau de In Guezzam', name_ar: 'نقابة المحامين عين قزام', address: 'In Guezzam' }, chambre_notaires: { name_fr: 'Chambre des Notaires de In Guezzam', name_ar: 'غرفة الموثقين عين قزام', address: 'In Guezzam' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de In Guezzam', name_ar: 'غرفة المحضرين عين قزام', address: 'In Guezzam' }, format_rc: '54/XXXXXXXX', format_nif: '099954XXXXXXXXX', specificites: [] },
  '55': { code: '55', name_fr: 'Touggourt', name_ar: 'تقرت', code_postal_prefix: '55', tribunaux: [{ name_fr: 'Tribunal de Touggourt', name_ar: 'محكمة تقرت', address: 'Touggourt', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Touggourt', name_ar: 'المحافظة العقارية تقرت', address: 'Touggourt', circonscription: ['Touggourt'] }], barreau: { name_fr: 'Barreau de Touggourt', name_ar: 'نقابة المحامين تقرت', address: 'Touggourt' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Touggourt', name_ar: 'غرفة الموثقين تقرت', address: 'Touggourt' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Touggourt', name_ar: 'غرفة المحضرين تقرت', address: 'Touggourt' }, format_rc: '55/XXXXXXXX', format_nif: '099955XXXXXXXXX', specificites: [] },
  '56': { code: '56', name_fr: 'Djanet', name_ar: 'جانت', code_postal_prefix: '56', tribunaux: [{ name_fr: 'Tribunal de Djanet', name_ar: 'محكمة جانت', address: 'Djanet', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de Djanet', name_ar: 'المحافظة العقارية جانت', address: 'Djanet', circonscription: ['Djanet'] }], barreau: { name_fr: 'Barreau de Djanet', name_ar: 'نقابة المحامين جانت', address: 'Djanet' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Djanet', name_ar: 'غرفة الموثقين جانت', address: 'Djanet' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Djanet', name_ar: 'غرفة المحضرين جانت', address: 'Djanet' }, format_rc: '56/XXXXXXXX', format_nif: '099956XXXXXXXXX', specificites: [] },
  '57': { code: '57', name_fr: 'El M\'Ghair', name_ar: 'المغير', code_postal_prefix: '57', tribunaux: [{ name_fr: 'Tribunal de El M\'Ghair', name_ar: 'محكمة المغير', address: 'El M\'Ghair', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de El M\'Ghair', name_ar: 'المحافظة العقارية المغير', address: 'El M\'Ghair', circonscription: ['El M\'Ghair'] }], barreau: { name_fr: 'Barreau de El M\'Ghair', name_ar: 'نقابة المحامين المغير', address: 'El M\'Ghair' }, chambre_notaires: { name_fr: 'Chambre des Notaires de El M\'Ghair', name_ar: 'غرفة الموثقين المغير', address: 'El M\'Ghair' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de El M\'Ghair', name_ar: 'غرفة المحضرين المغير', address: 'El M\'Ghair' }, format_rc: '57/XXXXXXXX', format_nif: '099957XXXXXXXXX', specificites: [] },
  '58': { code: '58', name_fr: 'El Meniaa', name_ar: 'المنيعة', code_postal_prefix: '58', tribunaux: [{ name_fr: 'Tribunal de El Meniaa', name_ar: 'محكمة المنيعة', address: 'El Meniaa', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de El Meniaa', name_ar: 'المحافظة العقارية المنيعة', address: 'El Meniaa', circonscription: ['El Meniaa'] }], barreau: { name_fr: 'Barreau de El Meniaa', name_ar: 'نقابة المحامين المنيعة', address: 'El Meniaa' }, chambre_notaires: { name_fr: 'Chambre des Notaires de El Meniaa', name_ar: 'غرفة الموثقين المنيعة', address: 'El Meniaa' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de El Meniaa', name_ar: 'غرفة المحضرين المنيعة', address: 'El Meniaa' }, format_rc: '58/XXXXXXXX', format_nif: '099958XXXXXXXXX', specificites: [] },
  
  // Nouvelles wilayas ajoutées en novembre 2025
  '59': { code: '59', name_fr: 'Aflou', name_ar: 'أفلو', code_postal_prefix: '59', tribunaux: [{ name_fr: 'Tribunal d\'Aflou', name_ar: 'محكمة أفلو', address: 'Aflou', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière d\'Aflou', name_ar: 'المحافظة العقارية أفلو', address: 'Aflou', circonscriptions: ['Aflou'] }, barreau: { name_fr: 'Barreau d\'Aflou', name_ar: 'نقابة المحامين أفلو', address: 'Aflou' }, chambre_notaires: { name_fr: 'Chambre des Notaires d\'Aflou', name_ar: 'غرفة الموثقين أفلو', address: 'Aflou' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers d\'Aflou', name_ar: 'غرفة المحضرين أفلو', address: 'Aflou' }, format_rc: '59/XXXXXXXX', format_nif: '099959XXXXXXXXX', specificites: [] },
  '60': { code: '60', name_fr: 'Barika', name_ar: 'باريكة', code_postal_prefix: '60', tribunaux: [{ name_fr: 'Tribunal de Barika', name_ar: 'محكمة باريكة', address: 'Barika', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière de Barika', name_ar: 'المحافظة العقارية باريكة', address: 'Barika', circonscriptions: ['Barika'] }, barreau: { name_fr: 'Barreau de Barika', name_ar: 'نقابة المحامين باريكة', address: 'Barika' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Barika', name_ar: 'غرفة الموثقين باريكة', address: 'Barika' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Barika', name_ar: 'غرفة المحضرين باريكة', address: 'Barika' }, format_rc: '60/XXXXXXXX', format_nif: '099960XXXXXXXXX', specificites: [] },
  '61': { code: '61', name_fr: 'Ksar Chellala', name_ar: 'قصر الشلالة', code_postal_prefix: '61', tribunaux: [{ name_fr: 'Tribunal de Ksar Chellala', name_ar: 'محكمة قصر الشلالة', address: 'Ksar Chellala', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière de Ksar Chellala', name_ar: 'المحافظة العقارية قصر الشلالة', address: 'Ksar Chellala', circonscriptions: ['Ksar Chellala'] }, barreau: { name_fr: 'Barreau de Ksar Chellala', name_ar: 'نقابة المحامين قصر الشلالة', address: 'Ksar Chellala' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Ksar Chellala', name_ar: 'غرفة الموثقين قصر الشلالة', address: 'Ksar Chellala' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Ksar Chellala', name_ar: 'غرفة المحضرين قصر الشلالة', address: 'Ksar Chellala' }, format_rc: '61/XXXXXXXX', format_nif: '099961XXXXXXXXX', specificites: [] },
  '62': { code: '62', name_fr: 'Messaad', name_ar: 'مسعد', code_postal_prefix: '62', tribunaux: [{ name_fr: 'Tribunal de Messaad', name_ar: 'محكمة مسعد', address: 'Messaad', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière de Messaad', name_ar: 'المحافظة العقارية مسعد', address: 'Messaad', circonscriptions: ['Messaad'] }, barreau: { name_fr: 'Barreau de Messaad', name_ar: 'نقابة المحامين مسعد', address: 'Messaad' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Messaad', name_ar: 'غرفة الموثقين مسعد', address: 'Messaad' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Messaad', name_ar: 'غرفة المحضرين مسعد', address: 'Messaad' }, format_rc: '62/XXXXXXXX', format_nif: '099962XXXXXXXXX', specificites: [] },
  '63': { code: '63', name_fr: 'Aïn Oussera', name_ar: 'عين وسارة', code_postal_prefix: '63', tribunaux: [{ name_fr: 'Tribunal d\'Aïn Oussera', name_ar: 'محكمة عين وسارة', address: 'Aïn Oussera', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière d\'Aïn Oussera', name_ar: 'المحافظة العقارية عين وسارة', address: 'Aïn Oussera', circonscriptions: ['Aïn Oussera'] }, barreau: { name_fr: 'Barreau d\'Aïn Oussera', name_ar: 'نقابة المحامين عين وسارة', address: 'Aïn Oussera' }, chambre_notaires: { name_fr: 'Chambre des Notaires d\'Aïn Oussera', name_ar: 'غرفة الموثقين عين وسارة', address: 'Aïn Oussera' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers d\'Aïn Oussera', name_ar: 'غرفة المحضرين عين وسارة', address: 'Aïn Oussera' }, format_rc: '63/XXXXXXXX', format_nif: '099963XXXXXXXXX', specificites: [] },
  '64': { code: '64', name_fr: 'Boussaâda', name_ar: 'بوسعادة', code_postal_prefix: '64', tribunaux: [{ name_fr: 'Tribunal de Boussaâda', name_ar: 'محكمة بوسعادة', address: 'Boussaâda', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière de Boussaâda', name_ar: 'المحافظة العقارية بوسعادة', address: 'Boussaâda', circonscriptions: ['Boussaâda'] }, barreau: { name_fr: 'Barreau de Boussaâda', name_ar: 'نقابة المحامين بوسعادة', address: 'Boussaâda' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Boussaâda', name_ar: 'غرفة الموثقين بوسعادة', address: 'Boussaâda' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Boussaâda', name_ar: 'غرفة المحضرين بوسعادة', address: 'Boussaâda' }, format_rc: '64/XXXXXXXX', format_nif: '099964XXXXXXXXX', specificites: [] },
  '65': { code: '65', name_fr: 'El Abiodh Sidi Cheikh', name_ar: 'الأبيض سيدي الشيخ', code_postal_prefix: '65', tribunaux: [{ name_fr: 'Tribunal d\'El Abiodh Sidi Cheikh', name_ar: 'محكمة الأبيض سيدي الشيخ', address: 'El Abiodh Sidi Cheikh', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière d\'El Abiodh Sidi Cheikh', name_ar: 'المحافظة العقارية الأبيض سيدي الشيخ', address: 'El Abiodh Sidi Cheikh', circonscriptions: ['El Abiodh Sidi Cheikh'] }, barreau: { name_fr: 'Barreau d\'El Abiodh Sidi Cheikh', name_ar: 'نقابة المحامين الأبيض سيدي الشيخ', address: 'El Abiodh Sidi Cheikh' }, chambre_notaires: { name_fr: 'Chambre des Notaires d\'El Abiodh Sidi Cheikh', name_ar: 'غرفة الموثقين الأبيض سيدي الشيخ', address: 'El Abiodh Sidi Cheikh' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers d\'El Abiodh Sidi Cheikh', name_ar: 'غرفة المحضرين الأبيض سيدي الشيخ', address: 'El Abiodh Sidi Cheikh' }, format_rc: '65/XXXXXXXX', format_nif: '099965XXXXXXXXX', specificites: [] },
  '66': { code: '66', name_fr: 'El Kantara', name_ar: 'القنطرة', code_postal_prefix: '66', tribunaux: [{ name_fr: 'Tribunal d\'El Kantara', name_ar: 'محكمة القنطرة', address: 'El Kantara', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière d\'El Kantara', name_ar: 'المحافظة العقارية القنطرة', address: 'El Kantara', circonscriptions: ['El Kantara'] }, barreau: { name_fr: 'Barreau d\'El Kantara', name_ar: 'نقابة المحامين القنطرة', address: 'El Kantara' }, chambre_notaires: { name_fr: 'Chambre des Notaires d\'El Kantara', name_ar: 'غرفة الموثقين القنطرة', address: 'El Kantara' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers d\'El Kantara', name_ar: 'غرفة المحضرين القنطرة', address: 'El Kantara' }, format_rc: '66/XXXXXXXX', format_nif: '099966XXXXXXXXX', specificites: [] },
  '67': { code: '67', name_fr: 'Bir El Ater', name_ar: 'بئر العاتر', code_postal_prefix: '67', tribunaux: [{ name_fr: 'Tribunal de Bir El Ater', name_ar: 'محكمة بئر العاتر', address: 'Bir El Ater', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière de Bir El Ater', name_ar: 'المحافظة العقارية بئر العاتر', address: 'Bir El Ater', circonscriptions: ['Bir El Ater'] }, barreau: { name_fr: 'Barreau de Bir El Ater', name_ar: 'نقابة المحامين بئر العاتر', address: 'Bir El Ater' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Bir El Ater', name_ar: 'غرفة الموثقين بئر العاتر', address: 'Bir El Ater' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Bir El Ater', name_ar: 'غرفة المحضرين بئر العاتر', address: 'Bir El Ater' }, format_rc: '67/XXXXXXXX', format_nif: '099967XXXXXXXXX', specificites: [] },
  '68': { code: '68', name_fr: 'Ksar El Boukhari', name_ar: 'قصر البخاري', code_postal_prefix: '68', tribunaux: [{ name_fr: 'Tribunal de Ksar El Boukhari', name_ar: 'محكمة قصر البخاري', address: 'Ksar El Boukhari', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière de Ksar El Boukhari', name_ar: 'المحافظة العقارية قصر البخاري', address: 'Ksar El Boukhari', circonscriptions: ['Ksar El Boukhari'] }, barreau: { name_fr: 'Barreau de Ksar El Boukhari', name_ar: 'نقابة المحامين قصر البخاري', address: 'Ksar El Boukhari' }, chambre_notaires: { name_fr: 'Chambre des Notaires de Ksar El Boukhari', name_ar: 'غرفة الموثقين قصر البخاري', address: 'Ksar El Boukhari' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de Ksar El Boukhari', name_ar: 'غرفة المحضرين قصر البخاري', address: 'Ksar El Boukhari' }, format_rc: '68/XXXXXXXX', format_nif: '099968XXXXXXXXX', specificites: [] },
  '69': { code: '69', name_fr: 'El Aricha', name_ar: 'العريشة', code_postal_prefix: '69', tribunaux: [{ name_fr: 'Tribunal d\'El Aricha', name_ar: 'محكمة العريشة', address: 'El Aricha', type: 'premiere_instance' }], conservation_fonciere: { name_fr: 'Conservation Foncière d\'El Aricha', name_ar: 'المحافظة العقارية العريشة', address: 'El Aricha', circonscriptions: ['El Aricha'] }, barreau: { name_fr: 'Barreau d\'El Aricha', name_ar: 'نقابة المحامين العريشة', address: 'El Aricha' }, chambre_notaires: { name_fr: 'Chambre des Notaires d\'El Aricha', name_ar: 'غرفة الموثقين العريشة', address: 'El Aricha' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers d\'El Aricha', name_ar: 'غرفة المحضرين العريشة', address: 'El Aricha' }, format_rc: '69/XXXXXXXX', format_nif: '099969XXXXXXXXX', specificites: [] }
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

// Liste complète des 69 wilayas d'Algérie (mise à jour novembre 2025)
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
  { code: '58', name_fr: 'El Meniaa', name_ar: 'المنيعة' },
  // Nouvelles wilayas ajoutées en novembre 2025
  { code: '59', name_fr: 'Aflou', name_ar: 'أفلو' },
  { code: '60', name_fr: 'Barika', name_ar: 'باريكة' },
  { code: '61', name_fr: 'Ksar Chellala', name_ar: 'قصر الشلالة' },
  { code: '62', name_fr: 'Messaad', name_ar: 'مسعد' },
  { code: '63', name_fr: 'Aïn Oussera', name_ar: 'عين وسارة' },
  { code: '64', name_fr: 'Boussaâda', name_ar: 'بوسعادة' },
  { code: '65', name_fr: 'El Abiodh Sidi Cheikh', name_ar: 'الأبيض سيدي الشيخ' },
  { code: '66', name_fr: 'El Kantara', name_ar: 'القنطرة' },
  { code: '67', name_fr: 'Bir El Ater', name_ar: 'بئر العاتر' },
  { code: '68', name_fr: 'Ksar El Boukhari', name_ar: 'قصر البخاري' },
  { code: '69', name_fr: 'El Aricha', name_ar: 'العريشة' }
];

// Liste de toutes les wilayas pour les sélecteurs
export const WILAYAS_LIST = ALL_WILAYAS;
