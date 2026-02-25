// Script pour générer les données manquantes des wilayas
// Génère le code TypeScript pour toutes les wilayas manquantes

const ALL_WILAYAS = {
  '10': { fr: 'Bouira', ar: 'البويرة' },
  '11': { fr: 'Tamanrasset', ar: 'تمنراست' },
  '12': { fr: 'Tébessa', ar: 'تبسة' },
  '13': { fr: 'Tlemcen', ar: 'تلمسان' },
  '14': { fr: 'Tiaret', ar: 'تيارت' },
  '17': { fr: 'Djelfa', ar: 'الجلفة' },
  '18': { fr: 'Jijel', ar: 'جيجل' },
  '20': { fr: 'Saïda', ar: 'سعيدة' },
  '21': { fr: 'Skikda', ar: 'سكيكدة' },
  '22': { fr: 'Sidi Bel Abbès', ar: 'سيدي بلعباس' },
  '24': { fr: 'Guelma', ar: 'قالمة' },
  '26': { fr: 'Médéa', ar: 'المدية' },
  '27': { fr: 'Mostaganem', ar: 'مستغانم' },
  '28': { fr: 'M\'Sila', ar: 'المسيلة' },
  '29': { fr: 'Mascara', ar: 'معسكر' },
  '30': { fr: 'Ouargla', ar: 'ورقلة' },
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
  '55': { fr: 'Touggourt', ar: 'تقرت' },
  '56': { fr: 'Djanet', ar: 'جانت' },
  '57': { fr: 'El M\'Ghair', ar: 'المغير' },
  '58': { fr: 'El Meniaa', ar: 'المنيعة' }
};

function generateWilayaData(code, nameFr, nameAr) {
  return `  '${code}': { code: '${code}', name_fr: '${nameFr}', name_ar: '${nameAr}', code_postal_prefix: '${code}', tribunaux: [{ name_fr: 'Tribunal de ${nameFr}', name_ar: 'محكمة ${nameAr}', address: '${nameFr}', type: 'civil' }], conservation_fonciere: [{ name_fr: 'Conservation Foncière de ${nameFr}', name_ar: 'المحافظة العقارية ${nameAr}', address: '${nameFr}', circonscription: ['${nameFr}'] }], barreau: { name_fr: 'Barreau de ${nameFr}', name_ar: 'نقابة المحامين ${nameAr}', address: '${nameFr}' }, chambre_notaires: { name_fr: 'Chambre des Notaires de ${nameFr}', name_ar: 'غرفة الموثقين ${nameAr}', address: '${nameFr}' }, chambre_huissiers: { name_fr: 'Chambre des Huissiers de ${nameFr}', name_ar: 'غرفة المحضرين ${nameAr}', address: '${nameFr}' }, format_rc: '${code}/XXXXXXXX', format_nif: '0999${code}XXXXXXXXX', specificites: [] },`;
}

console.log('// Wilayas manquantes (10-14, 17-18, 20-22, 24, 26-30, 32-58)\n');

Object.keys(ALL_WILAYAS).sort((a, b) => parseInt(a) - parseInt(b)).forEach(code => {
  const wilaya = ALL_WILAYAS[code];
  console.log(generateWilayaData(code, wilaya.fr, wilaya.ar));
});

console.log('\n// Total: ' + Object.keys(ALL_WILAYAS).length + ' wilayas générées');
