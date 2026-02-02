// Données géographiques de l'Algérie - Wilayas, Daïras et Communes principales

export interface Wilaya {
  code: string;
  name_fr: string;
  name_ar: string;
  dairas: Daira[];
}

export interface Daira {
  name_fr: string;
  name_ar: string;
  communes: string[];
}

export const WILAYAS_DATA: Wilaya[] = [
  {
    code: '01',
    name_fr: 'Adrar',
    name_ar: 'أدرار',
    dairas: [
      { name_fr: 'Adrar', name_ar: 'أدرار', communes: ['Adrar', 'Bouda', 'Ouled Ahmed Timmi'] },
      { name_fr: 'Timimoun', name_ar: 'تيميمون', communes: ['Timimoun', 'Ouled Said', 'Aougrout'] },
      { name_fr: 'Aoulef', name_ar: 'أولف', communes: ['Aoulef', 'Timekten', 'Akabli'] }
    ]
  },
  {
    code: '02',
    name_fr: 'Chlef',
    name_ar: 'الشلف',
    dairas: [
      { name_fr: 'Chlef', name_ar: 'الشلف', communes: ['Chlef', 'Sendjas', 'Boukadir'] },
      { name_fr: 'Ténès', name_ar: 'تنس', communes: ['Ténès', 'Sidi Akkacha', 'Abou El Hassan'] },
      { name_fr: 'El Karimia', name_ar: 'الكريمية', communes: ['El Karimia', 'Aïn Merane', 'Oued Goussine'] }
    ]
  },
  {
    code: '16',
    name_fr: 'Alger',
    name_ar: 'الجزائر',
    dairas: [
      { name_fr: 'Sidi M\'Hamed', name_ar: 'سيدي امحمد', communes: ['Alger Centre', 'El Madania', 'Hamma El Annasser'] },
      { name_fr: 'El Harrach', name_ar: 'الحراش', communes: ['El Harrach', 'Oued Smar', 'Bourouba'] },
      { name_fr: 'Dar El Beïda', name_ar: 'دار البيضاء', communes: ['Dar El Beïda', 'Bab Ezzouar', 'Bordj El Kiffan'] },
      { name_fr: 'Zeralda', name_ar: 'زرالدة', communes: ['Zeralda', 'Mahelma', 'Rahmania'] },
      { name_fr: 'Cheraga', name_ar: 'شراقة', communes: ['Cheraga', 'Dely Ibrahim', 'El Achour'] },
      { name_fr: 'Draria', name_ar: 'درارية', communes: ['Draria', 'Douera', 'Ouled Chebel'] },
      { name_fr: 'Birtouta', name_ar: 'بئر توتة', communes: ['Birtouta', 'Tessala El Merdja', 'Saoula'] },
      { name_fr: 'El Biar', name_ar: 'الأبيار', communes: ['El Biar', 'Bouzareah', 'Ben Aknoun'] },
      { name_fr: 'Bab El Oued', name_ar: 'باب الوادي', communes: ['Bab El Oued', 'Bologhine', 'Casbah'] },
      { name_fr: 'Hussein Dey', name_ar: 'حسين داي', communes: ['Hussein Dey', 'Kouba', 'Bourouba'] },
      { name_fr: 'Constantine', name_ar: 'قسنطينة', communes: ['Mohammadia', 'El Mouradia', 'Bachdjerrah'] },
      { name_fr: 'Rouiba', name_ar: 'الرويبة', communes: ['Rouiba', 'Reghaia', 'Heuraoua'] },
      { name_fr: 'Baraki', name_ar: 'براقي', communes: ['Baraki', 'Sidi Moussa', 'Eucalyptus'] }
    ]
  },
  {
    code: '31',
    name_fr: 'Oran',
    name_ar: 'وهران',
    dairas: [
      { name_fr: 'Oran', name_ar: 'وهران', communes: ['Oran', 'Bir El Djir', 'Es Senia'] },
      { name_fr: 'Arzew', name_ar: 'أرزيو', communes: ['Arzew', 'Bethioua', 'Sidi Benyebka'] },
      { name_fr: 'Aïn El Turck', name_ar: 'عين الترك', communes: ['Aïn El Turck', 'El Ançor', 'Bousfer'] },
      { name_fr: 'Gdyel', name_ar: 'قديل', communes: ['Gdyel', 'Hassi Bounif', 'Sidi Chami'] }
    ]
  },
  {
    code: '25',
    name_fr: 'Constantine',
    name_ar: 'قسنطينة',
    dairas: [
      { name_fr: 'Constantine', name_ar: 'قسنطينة', communes: ['Constantine', 'Hamma Bouziane', 'Didouche Mourad'] },
      { name_fr: 'El Khroub', name_ar: 'الخروب', communes: ['El Khroub', 'Aïn Smara', 'Ouled Rahmoune'] },
      { name_fr: 'Zighoud Youcef', name_ar: 'زيغود يوسف', communes: ['Zighoud Youcef', 'Beni Hamiden', 'Ibn Ziad'] }
    ]
  },
  {
    code: '09',
    name_fr: 'Blida',
    name_ar: 'البليدة',
    dairas: [
      { name_fr: 'Blida', name_ar: 'البليدة', communes: ['Blida', 'Ouled Yaïch', 'Chréa'] },
      { name_fr: 'Boufarik', name_ar: 'بوفاريك', communes: ['Boufarik', 'Soumaa', 'Chebli'] },
      { name_fr: 'Larbaa', name_ar: 'الأربعاء', communes: ['Larbaa', 'Meftah', 'Souhane'] }
    ]
  }
];

// Fonction pour obtenir les daïras d'une wilaya
export function getDairasByWilaya(wilayaCode: string): Daira[] {
  const wilaya = WILAYAS_DATA.find(w => w.code === wilayaCode);
  return wilaya ? wilaya.dairas : [];
}

// Fonction pour obtenir les communes d'une daïra
export function getCommunesByDaira(wilayaCode: string, dairaName: string): string[] {
  const wilaya = WILAYAS_DATA.find(w => w.code === wilayaCode);
  if (!wilaya) return [];
  
  const daira = wilaya.dairas.find(d => d.name_fr === dairaName || d.name_ar === dairaName);
  return daira ? daira.communes : [];
}

// Liste complète des 58 wilayas
export const ALL_WILAYAS = {
  '01': { fr: 'Adrar', ar: 'أدرار' },
  '02': { fr: 'Chlef', ar: 'الشلف' },
  '03': { fr: 'Laghouat', ar: 'الأغواط' },
  '04': { fr: 'Oum El Bouaghi', ar: 'أم البواقي' },
  '05': { fr: 'Batna', ar: 'باتنة' },
  '06': { fr: 'Béjaïa', ar: 'بجاية' },
  '07': { fr: 'Biskra', ar: 'بسكرة' },
  '08': { fr: 'Béchar', ar: 'بشار' },
  '09': { fr: 'Blida', ar: 'البليدة' },
  '10': { fr: 'Bouira', ar: 'البويرة' },
  '11': { fr: 'Tamanrasset', ar: 'تمنراست' },
  '12': { fr: 'Tébessa', ar: 'تبسة' },
  '13': { fr: 'Tlemcen', ar: 'تلمسان' },
  '14': { fr: 'Tiaret', ar: 'تيارت' },
  '15': { fr: 'Tizi Ouzou', ar: 'تيزي وزو' },
  '16': { fr: 'Alger', ar: 'الجزائر' },
  '17': { fr: 'Djelfa', ar: 'الجلفة' },
  '18': { fr: 'Jijel', ar: 'جيجل' },
  '19': { fr: 'Sétif', ar: 'سطيف' },
  '20': { fr: 'Saïda', ar: 'سعيدة' },
  '21': { fr: 'Skikda', ar: 'سكيكدة' },
  '22': { fr: 'Sidi Bel Abbès', ar: 'سيدي بلعباس' },
  '23': { fr: 'Annaba', ar: 'عنابة' },
  '24': { fr: 'Guelma', ar: 'قالمة' },
  '25': { fr: 'Constantine', ar: 'قسنطينة' },
  '26': { fr: 'Médéa', ar: 'المدية' },
  '27': { fr: 'Mostaganem', ar: 'مستغانم' },
  '28': { fr: 'M\'Sila', ar: 'المسيلة' },
  '29': { fr: 'Mascara', ar: 'معسكر' },
  '30': { fr: 'Ouargla', ar: 'ورقلة' },
  '31': { fr: 'Oran', ar: 'وهران' },
  '32': { fr: 'El Bayadh', ar: 'البيض' },
  '33': { fr: 'Illizi', ar: 'إليزي' },
  '34': { fr: 'Bordj Bou Arréridj', ar: 'برج بوعريريج' },
  '35': { fr: 'Boumerdès', ar: 'بومرداس' },
  '36': { fr: 'El Tarf', ar: 'الطارف' },
  '37': { fr: 'Tindouf', ar: 'تندوف' },
  '38': { fr: 'Tissemsilt', ar: 'تيسمسيلت' },
  '39': { fr: 'El Oued', ar: 'الوادي' },
  '40': { fr: 'Khenchela', ar: 'خنشلة' },
  '41': { fr: 'Souk Ahras', ar: 'سوق أهراس' },
  '42': { fr: 'Tipaza', ar: 'تيبازة' },
  '43': { fr: 'Mila', ar: 'ميلة' },
  '44': { fr: 'Aïn Defla', ar: 'عين الدفلى' },
  '45': { fr: 'Naâma', ar: 'النعامة' },
  '46': { fr: 'Aïn Témouchent', ar: 'عين تموشنت' },
  '47': { fr: 'Ghardaïa', ar: 'غرداية' },
  '48': { fr: 'Relizane', ar: 'غليزان' },
  '49': { fr: 'Timimoun', ar: 'تيميمون' },
  '50': { fr: 'Bordj Badji Mokhtar', ar: 'برج باجي مختار' },
  '51': { fr: 'Ouled Djellal', ar: 'أولاد جلال' },
  '52': { fr: 'Béni Abbès', ar: 'بني عباس' },
  '53': { fr: 'In Salah', ar: 'عين صالح' },
  '54': { fr: 'In Guezzam', ar: 'عين قزام' },
  '55': { fr: 'Touggourt', ar: 'توقرت' },
  '56': { fr: 'Djanet', ar: 'جانت' },
  '57': { fr: 'El M\'Ghair', ar: 'المغير' },
  '58': { fr: 'El Meniaa', ar: 'المنيعة' }
};