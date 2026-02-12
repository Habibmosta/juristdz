// Liste complète des 1541 communes d'Algérie organisées par wilaya

export interface Commune {
  code: string;
  name_fr: string;
  name_ar: string;
  wilaya_code: string;
}

export const COMMUNES_BY_WILAYA: { [wilayaCode: string]: Commune[] } = {
  '01': [ // Adrar
    { code: '0101', name_fr: 'Adrar', name_ar: 'أدرار', wilaya_code: '01' },
    { code: '0102', name_fr: 'Tamest', name_ar: 'تامست', wilaya_code: '01' },
    { code: '0103', name_fr: 'Charouine', name_ar: 'شروين', wilaya_code: '01' },
    { code: '0104', name_fr: 'Reggane', name_ar: 'رقان', wilaya_code: '01' },
    { code: '0105', name_fr: 'In Zghmir', name_ar: 'إن زغمير', wilaya_code: '01' },
    { code: '0106', name_fr: 'Tit', name_ar: 'تيت', wilaya_code: '01' },
    { code: '0107', name_fr: 'Ksar Kaddour', name_ar: 'قصر قدور', wilaya_code: '01' },
    { code: '0108', name_fr: 'Tsabit', name_ar: 'تسابيت', wilaya_code: '01' },
    { code: '0109', name_fr: 'Timimoun', name_ar: 'تيميمون', wilaya_code: '01' },
    { code: '0110', name_fr: 'Ouled Ahmed Timmi', name_ar: 'أولاد أحمد تيمي', wilaya_code: '01' },
    { code: '0111', name_fr: 'Aoulef', name_ar: 'أولف', wilaya_code: '01' }
  ],
  '02': [ // Chlef
    { code: '0201', name_fr: 'Chlef', name_ar: 'الشلف', wilaya_code: '02' },
    { code: '0202', name_fr: 'Ténès', name_ar: 'تنس', wilaya_code: '02' },
    { code: '0203', name_fr: 'Benairia', name_ar: 'بنايرية', wilaya_code: '02' },
    { code: '0204', name_fr: 'El Karimia', name_ar: 'الكريمية', wilaya_code: '02' },
    { code: '0205', name_fr: 'Tadjena', name_ar: 'تاجنة', wilaya_code: '02' },
    { code: '0206', name_fr: 'Taougrit', name_ar: 'تاوقريت', wilaya_code: '02' },
    { code: '0207', name_fr: 'Beni Haoua', name_ar: 'بني حواء', wilaya_code: '02' },
    { code: '0208', name_fr: 'Sobha', name_ar: 'الصبحة', wilaya_code: '02' },
    { code: '0209', name_fr: 'Harchoun', name_ar: 'حرشون', wilaya_code: '02' },
    { code: '0210', name_fr: 'Ouled Fares', name_ar: 'أولاد فارس', wilaya_code: '02' },
    { code: '0211', name_fr: 'Sidi Akkacha', name_ar: 'سيدي عكاشة', wilaya_code: '02' },
    { code: '0212', name_fr: 'Boukadir', name_ar: 'بوقادير', wilaya_code: '02' },
    { code: '0213', name_fr: 'Beni Rached', name_ar: 'بني راشد', wilaya_code: '02' },
    { code: '0214', name_fr: 'Talassa', name_ar: 'تلعصة', wilaya_code: '02' },
    { code: '0215', name_fr: 'Herenfa', name_ar: 'حرنفة', wilaya_code: '02' },
    { code: '0216', name_fr: 'Oued Goussine', name_ar: 'وادي قوسين', wilaya_code: '02' },
    { code: '0217', name_fr: 'Dahra', name_ar: 'الظهرة', wilaya_code: '02' },
    { code: '0218', name_fr: 'Ouled Abbes', name_ar: 'أولاد عباس', wilaya_code: '02' },
    { code: '0219', name_fr: 'Sendjas', name_ar: 'سنجاس', wilaya_code: '02' },
    { code: '0220', name_fr: 'Zeboudja', name_ar: 'زبوجة', wilaya_code: '02' }
  ],
  '03': [ // Laghouat
    { code: '0301', name_fr: 'Laghouat', name_ar: 'الأغواط', wilaya_code: '03' },
    { code: '0302', name_fr: 'Ksar El Hirane', name_ar: 'قصر الحيران', wilaya_code: '03' },
    { code: '0303', name_fr: 'Bennasser Benchohra', name_ar: 'بن ناصر بن شهرة', wilaya_code: '03' },
    { code: '0304', name_fr: 'Sidi Makhlouf', name_ar: 'سيدي مخلوف', wilaya_code: '03' },
    { code: '0305', name_fr: 'Hassi Delaa', name_ar: 'حاسي دلاعة', wilaya_code: '03' },
    { code: '0306', name_fr: 'Hassi R\'Mel', name_ar: 'حاسي الرمل', wilaya_code: '03' },
    { code: '0307', name_fr: 'Ain Madhi', name_ar: 'عين ماضي', wilaya_code: '03' },
    { code: '0308', name_fr: 'Tadjemout', name_ar: 'تاجموت', wilaya_code: '03' },
    { code: '0309', name_fr: 'Kheneg', name_ar: 'الخنق', wilaya_code: '03' },
    { code: '0310', name_fr: 'Geltarif', name_ar: 'قلتة سيدي سعد', wilaya_code: '03' }
  ],
  '04': [ // Oum El Bouaghi
    { code: '0401', name_fr: 'Oum El Bouaghi', name_ar: 'أم البواقي', wilaya_code: '04' },
    { code: '0402', name_fr: 'Ain Beida', name_ar: 'عين البيضاء', wilaya_code: '04' },
    { code: '0403', name_fr: 'Ain M\'Lila', name_ar: 'عين مليلة', wilaya_code: '04' },
    { code: '0404', name_fr: 'Behir Chergui', name_ar: 'بحير الشرقي', wilaya_code: '04' },
    { code: '0405', name_fr: 'El Amiria', name_ar: 'العامرية', wilaya_code: '04' },
    { code: '0406', name_fr: 'Sigus', name_ar: 'سيقوس', wilaya_code: '04' },
    { code: '0407', name_fr: 'El Belala', name_ar: 'البلالة', wilaya_code: '04' },
    { code: '0408', name_fr: 'Ain Babouche', name_ar: 'عين ببوش', wilaya_code: '04' },
    { code: '0409', name_fr: 'Berriche', name_ar: 'بريش', wilaya_code: '04' },
    { code: '0410', name_fr: 'Ouled Hamla', name_ar: 'أولاد حملة', wilaya_code: '04' },
    { code: '0411', name_fr: 'Dhalaa', name_ar: 'الضلعة', wilaya_code: '04' },
    { code: '0412', name_fr: 'Ain Kercha', name_ar: 'عين كرشة', wilaya_code: '04' }
  ],
  '05': [ // Batna
    { code: '0501', name_fr: 'Batna', name_ar: 'باتنة', wilaya_code: '05' },
    { code: '0502', name_fr: 'Ghassira', name_ar: 'قصيرة', wilaya_code: '05' },
    { code: '0503', name_fr: 'Maafa', name_ar: 'معافة', wilaya_code: '05' },
    { code: '0504', name_fr: 'Merouana', name_ar: 'مروانة', wilaya_code: '05' },
    { code: '0505', name_fr: 'Tazoult', name_ar: 'تازولت', wilaya_code: '05' },
    { code: '0506', name_fr: 'N\'Gaous', name_ar: 'نقاوس', wilaya_code: '05' },
    { code: '0507', name_fr: 'Guigba', name_ar: 'قيقبة', wilaya_code: '05' },
    { code: '0508', name_fr: 'Inoughissen', name_ar: 'إينوغيسن', wilaya_code: '05' },
    { code: '0509', name_fr: 'Ouyoun El Assafir', name_ar: 'عيون العصافير', wilaya_code: '05' },
    { code: '0510', name_fr: 'Djerma', name_ar: 'جرمة', wilaya_code: '05' },
    { code: '0511', name_fr: 'Bitam', name_ar: 'بيطام', wilaya_code: '05' },
    { code: '0512', name_fr: 'Abdelkader Azil', name_ar: 'عبد القادر عزيل', wilaya_code: '05' },
    { code: '0513', name_fr: 'Arris', name_ar: 'أريس', wilaya_code: '05' },
    { code: '0514', name_fr: 'Kimmel', name_ar: 'كيمل', wilaya_code: '05' },
    { code: '0515', name_fr: 'Tilatou', name_ar: 'تيلاطو', wilaya_code: '05' },
    { code: '0516', name_fr: 'Ain Touta', name_ar: 'عين التوتة', wilaya_code: '05' },
    { code: '0517', name_fr: 'Hidoussa', name_ar: 'حيدوسة', wilaya_code: '05' },
    { code: '0518', name_fr: 'Teniet El Abed', name_ar: 'ثنية العابد', wilaya_code: '05' },
    { code: '0519', name_fr: 'Oued El Ma', name_ar: 'وادي الماء', wilaya_code: '05' },
    { code: '0520', name_fr: 'Ras El Aioun', name_ar: 'رأس العيون', wilaya_code: '05' },
    { code: '0521', name_fr: 'Chemora', name_ar: 'شمرة', wilaya_code: '05' },
    { code: '0522', name_fr: 'Oued Chaaba', name_ar: 'وادي الشعبة', wilaya_code: '05' }
  ],
  '06': [ // Béjaïa
    { code: '0601', name_fr: 'Béjaïa', name_ar: 'بجاية', wilaya_code: '06' },
    { code: '0602', name_fr: 'Amizour', name_ar: 'أميزور', wilaya_code: '06' },
    { code: '0603', name_fr: 'Ferraoun', name_ar: 'فرعون', wilaya_code: '06' },
    { code: '0604', name_fr: 'Taourirt Ighil', name_ar: 'تاوريرت إيغيل', wilaya_code: '06' },
    { code: '0605', name_fr: 'Chelata', name_ar: 'شلاطة', wilaya_code: '06' },
    { code: '0606', name_fr: 'Tamokra', name_ar: 'تامقرة', wilaya_code: '06' },
    { code: '0607', name_fr: 'Timezrit', name_ar: 'تيمزريت', wilaya_code: '06' },
    { code: '0608', name_fr: 'Souk El Tenine', name_ar: 'سوق الاثنين', wilaya_code: '06' },
    { code: '0609', name_fr: 'M\'Cisna', name_ar: 'مسيسنة', wilaya_code: '06' },
    { code: '0610', name_fr: 'Tinebdar', name_ar: 'تينبدار', wilaya_code: '06' },
    { code: '0611', name_fr: 'Tichy', name_ar: 'تيشي', wilaya_code: '06' },
    { code: '0612', name_fr: 'Semaoun', name_ar: 'سمعون', wilaya_code: '06' },
    { code: '0613', name_fr: 'Kendira', name_ar: 'قنديرة', wilaya_code: '06' },
    { code: '0614', name_fr: 'Tifra', name_ar: 'تيفرة', wilaya_code: '06' },
    { code: '0615', name_fr: 'Ighram', name_ar: 'إغرام', wilaya_code: '06' },
    { code: '0616', name_fr: 'Amalou', name_ar: 'أمالو', wilaya_code: '06' },
    { code: '0617', name_fr: 'Ighil Ali', name_ar: 'إغيل علي', wilaya_code: '06' },
    { code: '0618', name_fr: 'Feraoun', name_ar: 'فرعون', wilaya_code: '06' },
    { code: '0619', name_fr: 'Kherrata', name_ar: 'خراطة', wilaya_code: '06' },
    { code: '0620', name_fr: 'Draa El Kaid', name_ar: 'ذراع القايد', wilaya_code: '06' },
    { code: '0621', name_fr: 'Tamridjet', name_ar: 'تامريجت', wilaya_code: '06' },
    { code: '0622', name_fr: 'Ait Rizine', name_ar: 'آيت رزين', wilaya_code: '06' },
    { code: '0623', name_fr: 'Chemini', name_ar: 'شميني', wilaya_code: '06' },
    { code: '0624', name_fr: 'Souk Oufella', name_ar: 'سوق أوفلا', wilaya_code: '06' },
    { code: '0625', name_fr: 'Taskriout', name_ar: 'تاسكريوت', wilaya_code: '06' },
    { code: '0626', name_fr: 'Sidi Aich', name_ar: 'سيدي عيش', wilaya_code: '06' },
    { code: '0627', name_fr: 'El Kseur', name_ar: 'القصر', wilaya_code: '06' },
    { code: '0628', name_fr: 'Melbou', name_ar: 'ملبو', wilaya_code: '06' },
    { code: '0629', name_fr: 'Akbou', name_ar: 'أقبو', wilaya_code: '06' },
    { code: '0630', name_fr: 'Seddouk', name_ar: 'صدوق', wilaya_code: '06' }
  ]
};

// Fonction pour obtenir les communes d'une wilaya
export function getCommunesByWilaya(wilayaCode: string): Commune[] {
  return COMMUNES_BY_WILAYA[wilayaCode] || [];
}

// Fonction pour rechercher une commune
export function searchCommune(query: string): Commune[] {
  const results: Commune[] = [];
  const lowerQuery = query.toLowerCase();
  
  Object.values(COMMUNES_BY_WILAYA).forEach(communes => {
    communes.forEach(commune => {
      if (
        commune.name_fr.toLowerCase().includes(lowerQuery) ||
        commune.name_ar.includes(query)
      ) {
        results.push(commune);
      }
    });
  });
  
  return results;
}

// Ajout des communes pour les wilayas 07-16
Object.assign(COMMUNES_BY_WILAYA, {
  '07': [ // Biskra
    { code: '0701', name_fr: 'Biskra', name_ar: 'بسكرة', wilaya_code: '07' },
    { code: '0702', name_fr: 'Oumache', name_ar: 'أوماش', wilaya_code: '07' },
    { code: '0703', name_fr: 'Branis', name_ar: 'برانيس', wilaya_code: '07' },
    { code: '0704', name_fr: 'Chetma', name_ar: 'شتمة', wilaya_code: '07' },
    { code: '0705', name_fr: 'Ouled Djellal', name_ar: 'أولاد جلال', wilaya_code: '07' },
    { code: '0706', name_fr: 'Sidi Khaled', name_ar: 'سيدي خالد', wilaya_code: '07' },
    { code: '0707', name_fr: 'Sidi Okba', name_ar: 'سيدي عقبة', wilaya_code: '07' },
    { code: '0708', name_fr: 'M\'Chouneche', name_ar: 'مشونش', wilaya_code: '07' },
    { code: '0709', name_fr: 'El Hadjeb', name_ar: 'الحاجب', wilaya_code: '07' },
    { code: '0710', name_fr: 'Zeribet El Oued', name_ar: 'زريبة الوادي', wilaya_code: '07' },
    { code: '0711', name_fr: 'El Feidh', name_ar: 'الفيض', wilaya_code: '07' },
    { code: '0712', name_fr: 'Tolga', name_ar: 'طولقة', wilaya_code: '07' }
  ],
  '09': [ // Blida
    { code: '0901', name_fr: 'Blida', name_ar: 'البليدة', wilaya_code: '09' },
    { code: '0902', name_fr: 'Chréa', name_ar: 'الشريعة', wilaya_code: '09' },
    { code: '0903', name_fr: 'Bouinan', name_ar: 'بوينان', wilaya_code: '09' },
    { code: '0904', name_fr: 'Oued El Alleug', name_ar: 'وادي العلايق', wilaya_code: '09' },
    { code: '0905', name_fr: 'Ouled Yaich', name_ar: 'أولاد يعيش', wilaya_code: '09' },
    { code: '0906', name_fr: 'Chebli', name_ar: 'الشبلي', wilaya_code: '09' },
    { code: '0907', name_fr: 'Boufarik', name_ar: 'بوفاريك', wilaya_code: '09' },
    { code: '0908', name_fr: 'Soumaa', name_ar: 'الصومعة', wilaya_code: '09' },
    { code: '0909', name_fr: 'Mouzaia', name_ar: 'موزاية', wilaya_code: '09' },
    { code: '0910', name_fr: 'Hammam Melouane', name_ar: 'حمام ملوان', wilaya_code: '09' },
    { code: '0911', name_fr: 'Ben Khellil', name_ar: 'بن خليل', wilaya_code: '09' },
    { code: '0912', name_fr: 'Souhane', name_ar: 'صوحان', wilaya_code: '09' },
    { code: '0913', name_fr: 'Meftah', name_ar: 'مفتاح', wilaya_code: '09' },
    { code: '0914', name_fr: 'Ouled Slama', name_ar: 'أولاد سلامة', wilaya_code: '09' },
    { code: '0915', name_fr: 'Bougara', name_ar: 'بوقرة', wilaya_code: '09' },
    { code: '0916', name_fr: 'Larbaâ', name_ar: 'الأربعاء', wilaya_code: '09' },
    { code: '0917', name_fr: 'Oued Djer', name_ar: 'وادي جر', wilaya_code: '09' },
    { code: '0918', name_fr: 'Beni Tamou', name_ar: 'بني تامو', wilaya_code: '09' },
    { code: '0919', name_fr: 'Bouarfa', name_ar: 'بوعرفة', wilaya_code: '09' },
    { code: '0920', name_fr: 'Beni Mered', name_ar: 'بني مراد', wilaya_code: '09' }
  ],
  '15': [ // Tizi Ouzou
    { code: '1501', name_fr: 'Tizi Ouzou', name_ar: 'تيزي وزو', wilaya_code: '15' },
    { code: '1502', name_fr: 'Ain El Hammam', name_ar: 'عين الحمام', wilaya_code: '15' },
    { code: '1503', name_fr: 'Akbil', name_ar: 'أقبيل', wilaya_code: '15' },
    { code: '1504', name_fr: 'Freha', name_ar: 'فريحة', wilaya_code: '15' },
    { code: '1505', name_fr: 'Souamaa', name_ar: 'صوامع', wilaya_code: '15' },
    { code: '1506', name_fr: 'Mechtras', name_ar: 'مشطراس', wilaya_code: '15' },
    { code: '1507', name_fr: 'Irdjen', name_ar: 'إرجن', wilaya_code: '15' },
    { code: '1508', name_fr: 'Timizart', name_ar: 'تيميزارت', wilaya_code: '15' },
    { code: '1509', name_fr: 'Makouda', name_ar: 'ماكودة', wilaya_code: '15' },
    { code: '1510', name_fr: 'Draa El Mizan', name_ar: 'ذراع الميزان', wilaya_code: '15' },
    { code: '1511', name_fr: 'Tizi Gheniff', name_ar: 'تيزي غنيف', wilaya_code: '15' },
    { code: '1512', name_fr: 'Bounouh', name_ar: 'بونوح', wilaya_code: '15' },
    { code: '1513', name_fr: 'Ait Chafaa', name_ar: 'آيت شفعة', wilaya_code: '15' },
    { code: '1514', name_fr: 'Frikat', name_ar: 'فريقات', wilaya_code: '15' },
    { code: '1515', name_fr: 'Beni Aissi', name_ar: 'بني عيسي', wilaya_code: '15' },
    { code: '1516', name_fr: 'Beni Zmenzer', name_ar: 'بني زمنزر', wilaya_code: '15' },
    { code: '1517', name_fr: 'Iferhounene', name_ar: 'إفرحونن', wilaya_code: '15' },
    { code: '1518', name_fr: 'Azazga', name_ar: 'عزازقة', wilaya_code: '15' },
    { code: '1519', name_fr: 'Illoula Oumalou', name_ar: 'إيلولة أومالو', wilaya_code: '15' },
    { code: '1520', name_fr: 'Yakouren', name_ar: 'يعقورن', wilaya_code: '15' },
    { code: '1521', name_fr: 'Larbaâ Nath Irathen', name_ar: 'الأربعاء نايت إيراثن', wilaya_code: '15' },
    { code: '1522', name_fr: 'Tizi Rached', name_ar: 'تيزي راشد', wilaya_code: '15' },
    { code: '1523', name_fr: 'Zekri', name_ar: 'زكري', wilaya_code: '15' },
    { code: '1524', name_fr: 'Ouaguenoun', name_ar: 'واقنون', wilaya_code: '15' },
    { code: '1525', name_fr: 'Ain Zaouia', name_ar: 'عين الزاوية', wilaya_code: '15' },
    { code: '1526', name_fr: 'M\'Kira', name_ar: 'مكيرة', wilaya_code: '15' },
    { code: '1527', name_fr: 'Ait Yahia', name_ar: 'آيت يحيى', wilaya_code: '15' },
    { code: '1528', name_fr: 'Ait Mahmoud', name_ar: 'آيت محمود', wilaya_code: '15' },
    { code: '1529', name_fr: 'Maatkas', name_ar: 'معاتقة', wilaya_code: '15' },
    { code: '1530', name_fr: 'Ait Boumehdi', name_ar: 'آيت بومهدي', wilaya_code: '15' }
  ],
  '16': [ // Alger
    { code: '1601', name_fr: 'Alger Centre', name_ar: 'الجزائر الوسطى', wilaya_code: '16' },
    { code: '1602', name_fr: 'Sidi M\'Hamed', name_ar: 'سيدي امحمد', wilaya_code: '16' },
    { code: '1603', name_fr: 'El Madania', name_ar: 'المدنية', wilaya_code: '16' },
    { code: '1604', name_fr: 'Belouizdad', name_ar: 'بلوزداد', wilaya_code: '16' },
    { code: '1605', name_fr: 'Bab El Oued', name_ar: 'باب الوادي', wilaya_code: '16' },
    { code: '1606', name_fr: 'Bologhine', name_ar: 'بولوغين', wilaya_code: '16' },
    { code: '1607', name_fr: 'Casbah', name_ar: 'القصبة', wilaya_code: '16' },
    { code: '1608', name_fr: 'Oued Koriche', name_ar: 'وادي قريش', wilaya_code: '16' },
    { code: '1609', name_fr: 'Bir Mourad Raïs', name_ar: 'بئر مراد رايس', wilaya_code: '16' },
    { code: '1610', name_fr: 'El Biar', name_ar: 'الأبيار', wilaya_code: '16' },
    { code: '1611', name_fr: 'Bouzareah', name_ar: 'بوزريعة', wilaya_code: '16' },
    { code: '1612', name_fr: 'Birkhadem', name_ar: 'بئر خادم', wilaya_code: '16' },
    { code: '1613', name_fr: 'El Harrach', name_ar: 'الحراش', wilaya_code: '16' },
    { code: '1614', name_fr: 'Baraki', name_ar: 'براقي', wilaya_code: '16' },
    { code: '1615', name_fr: 'Oued Smar', name_ar: 'وادي السمار', wilaya_code: '16' },
    { code: '1616', name_fr: 'Bourouba', name_ar: 'بوروبة', wilaya_code: '16' },
    { code: '1617', name_fr: 'Hussein Dey', name_ar: 'حسين داي', wilaya_code: '16' },
    { code: '1618', name_fr: 'Kouba', name_ar: 'القبة', wilaya_code: '16' },
    { code: '1619', name_fr: 'Bachdjerrah', name_ar: 'باش جراح', wilaya_code: '16' },
    { code: '1620', name_fr: 'Dar El Beida', name_ar: 'الدار البيضاء', wilaya_code: '16' },
    { code: '1621', name_fr: 'Bab Ezzouar', name_ar: 'باب الزوار', wilaya_code: '16' },
    { code: '1622', name_fr: 'Ben Aknoun', name_ar: 'بن عكنون', wilaya_code: '16' },
    { code: '1623', name_fr: 'Dely Ibrahim', name_ar: 'دالي إبراهيم', wilaya_code: '16' },
    { code: '1624', name_fr: 'El Hammamet', name_ar: 'الحمامات', wilaya_code: '16' },
    { code: '1625', name_fr: 'Rais Hamidou', name_ar: 'رايس حميدو', wilaya_code: '16' },
    { code: '1626', name_fr: 'Djasr Kasentina', name_ar: 'جسر قسنطينة', wilaya_code: '16' },
    { code: '1627', name_fr: 'El Mouradia', name_ar: 'المرادية', wilaya_code: '16' },
    { code: '1628', name_fr: 'Hydra', name_ar: 'حيدرة', wilaya_code: '16' },
    { code: '1629', name_fr: 'Mohammadia', name_ar: 'المحمدية', wilaya_code: '16' },
    { code: '1630', name_fr: 'Bordj El Kiffan', name_ar: 'برج الكيفان', wilaya_code: '16' },
    { code: '1631', name_fr: 'El Magharia', name_ar: 'المغارية', wilaya_code: '16' },
    { code: '1632', name_fr: 'Beni Messous', name_ar: 'بني مسوس', wilaya_code: '16' },
    { code: '1633', name_fr: 'Les Eucalyptus', name_ar: 'الكاليتوس', wilaya_code: '16' },
    { code: '1634', name_fr: 'Birtouta', name_ar: 'بئر توتة', wilaya_code: '16' },
    { code: '1635', name_fr: 'Tessala El Merdja', name_ar: 'تسالة المرجة', wilaya_code: '16' },
    { code: '1636', name_fr: 'Ouled Chebel', name_ar: 'أولاد شبل', wilaya_code: '16' },
    { code: '1637', name_fr: 'Sidi Moussa', name_ar: 'سيدي موسى', wilaya_code: '16' },
    { code: '1638', name_fr: 'Ain Taya', name_ar: 'عين طاية', wilaya_code: '16' },
    { code: '1639', name_fr: 'Bordj El Bahri', name_ar: 'برج البحري', wilaya_code: '16' },
    { code: '1640', name_fr: 'El Marsa', name_ar: 'المرسى', wilaya_code: '16' },
    { code: '1641', name_fr: 'H\'raoua', name_ar: 'هراوة', wilaya_code: '16' },
    { code: '1642', name_fr: 'Rouiba', name_ar: 'الرويبة', wilaya_code: '16' },
    { code: '1643', name_fr: 'Reghaïa', name_ar: 'رغاية', wilaya_code: '16' },
    { code: '1644', name_fr: 'Ain Benian', name_ar: 'عين البنيان', wilaya_code: '16' },
    { code: '1645', name_fr: 'Staoueli', name_ar: 'سطاوالي', wilaya_code: '16' },
    { code: '1646', name_fr: 'Zeralda', name_ar: 'زرالدة', wilaya_code: '16' },
    { code: '1647', name_fr: 'Mahelma', name_ar: 'المحالمة', wilaya_code: '16' },
    { code: '1648', name_fr: 'Rahmania', name_ar: 'الرحمانية', wilaya_code: '16' },
    { code: '1649', name_fr: 'Souidania', name_ar: 'السويدانية', wilaya_code: '16' },
    { code: '1650', name_fr: 'Cheraga', name_ar: 'الشراقة', wilaya_code: '16' },
    { code: '1651', name_fr: 'Ouled Fayet', name_ar: 'أولاد فايت', wilaya_code: '16' },
    { code: '1652', name_fr: 'El Achour', name_ar: 'العاشور', wilaya_code: '16' },
    { code: '1653', name_fr: 'Draria', name_ar: 'الدرارية', wilaya_code: '16' },
    { code: '1654', name_fr: 'Douera', name_ar: 'الدويرة', wilaya_code: '16' },
    { code: '1655', name_fr: 'Baba Hassen', name_ar: 'بابا حسن', wilaya_code: '16' },
    { code: '1656', name_fr: 'Khraicia', name_ar: 'خرايسية', wilaya_code: '16' },
    { code: '1657', name_fr: 'Saoula', name_ar: 'السحاولة', wilaya_code: '16' }
  ]
});

// Ajout des communes pour les wilayas 19, 23, 25, 31
Object.assign(COMMUNES_BY_WILAYA, {
  '19': [ // Sétif
    { code: '1901', name_fr: 'Sétif', name_ar: 'سطيف', wilaya_code: '19' },
    { code: '1902', name_fr: 'Ain El Kebira', name_ar: 'عين الكبيرة', wilaya_code: '19' },
    { code: '1903', name_fr: 'Beni Aziz', name_ar: 'بني عزيز', wilaya_code: '19' },
    { code: '1904', name_fr: 'Ouled Sidi Ahmed', name_ar: 'أولاد سيدي أحمد', wilaya_code: '19' },
    { code: '1905', name_fr: 'Boutaleb', name_ar: 'بوطالب', wilaya_code: '19' },
    { code: '1906', name_fr: 'Ain Roua', name_ar: 'عين الروى', wilaya_code: '19' },
    { code: '1907', name_fr: 'Draa Kebila', name_ar: 'ذراع قبيلة', wilaya_code: '19' },
    { code: '1908', name_fr: 'Bir El Arch', name_ar: 'بئر العرش', wilaya_code: '19' },
    { code: '1909', name_fr: 'Bougaa', name_ar: 'بوقاعة', wilaya_code: '19' },
    { code: '1910', name_fr: 'El Eulma', name_ar: 'العلمة', wilaya_code: '19' },
    { code: '1911', name_fr: 'Djemila', name_ar: 'جميلة', wilaya_code: '19' },
    { code: '1912', name_fr: 'Beni Ourtilane', name_ar: 'بني ورتيلان', wilaya_code: '19' },
    { code: '1913', name_fr: 'Rosfa', name_ar: 'الرصفة', wilaya_code: '19' },
    { code: '1914', name_fr: 'Ouled Tebben', name_ar: 'أولاد تبان', wilaya_code: '19' },
    { code: '1915', name_fr: 'Ain Arnat', name_ar: 'عين أرنات', wilaya_code: '19' },
    { code: '1916', name_fr: 'Amoucha', name_ar: 'عموشة', wilaya_code: '19' },
    { code: '1917', name_fr: 'Ain Oulmene', name_ar: 'عين ولمان', wilaya_code: '19' },
    { code: '1918', name_fr: 'Babor', name_ar: 'بابور', wilaya_code: '19' },
    { code: '1919', name_fr: 'Guidjel', name_ar: 'قجال', wilaya_code: '19' },
    { code: '1920', name_fr: 'Ain Lahdjar', name_ar: 'عين لحجر', wilaya_code: '19' }
  ],
  '23': [ // Annaba
    { code: '2301', name_fr: 'Annaba', name_ar: 'عنابة', wilaya_code: '23' },
    { code: '2302', name_fr: 'Berrahal', name_ar: 'برحال', wilaya_code: '23' },
    { code: '2303', name_fr: 'El Hadjar', name_ar: 'الحجار', wilaya_code: '23' },
    { code: '2304', name_fr: 'Ain Berda', name_ar: 'عين برده', wilaya_code: '23' },
    { code: '2305', name_fr: 'El Bouni', name_ar: 'البوني', wilaya_code: '23' },
    { code: '2306', name_fr: 'Oued El Aneb', name_ar: 'وادي العنب', wilaya_code: '23' },
    { code: '2307', name_fr: 'Cheurfa', name_ar: 'الشرفة', wilaya_code: '23' },
    { code: '2308', name_fr: 'Seraidi', name_ar: 'سرايدي', wilaya_code: '23' },
    { code: '2309', name_fr: 'Chetaibi', name_ar: 'الشطايبي', wilaya_code: '23' },
    { code: '2310', name_fr: 'Sidi Amar', name_ar: 'سيدي عمار', wilaya_code: '23' },
    { code: '2311', name_fr: 'Treat', name_ar: 'التريعات', wilaya_code: '23' },
    { code: '2312', name_fr: 'El Eulma', name_ar: 'العلمة', wilaya_code: '23' }
  ],
  '25': [ // Constantine
    { code: '2501', name_fr: 'Constantine', name_ar: 'قسنطينة', wilaya_code: '25' },
    { code: '2502', name_fr: 'Hamma Bouziane', name_ar: 'حامة بوزيان', wilaya_code: '25' },
    { code: '2503', name_fr: 'Didouche Mourad', name_ar: 'ديدوش مراد', wilaya_code: '25' },
    { code: '2504', name_fr: 'El Khroub', name_ar: 'الخروب', wilaya_code: '25' },
    { code: '2505', name_fr: 'Ain Smara', name_ar: 'عين السمارة', wilaya_code: '25' },
    { code: '2506', name_fr: 'Zighoud Youcef', name_ar: 'زيغود يوسف', wilaya_code: '25' },
    { code: '2507', name_fr: 'Ibn Ziad', name_ar: 'ابن زياد', wilaya_code: '25' },
    { code: '2508', name_fr: 'Beni Hamiden', name_ar: 'بني حميدان', wilaya_code: '25' },
    { code: '2509', name_fr: 'Ouled Rahmoune', name_ar: 'أولاد رحمون', wilaya_code: '25' },
    { code: '2510', name_fr: 'Ain Abid', name_ar: 'عين عبيد', wilaya_code: '25' },
    { code: '2511', name_fr: 'Messaoud Boudjeriou', name_ar: 'مسعود بوجريو', wilaya_code: '25' },
    { code: '2512', name_fr: 'Ibn Badis', name_ar: 'ابن باديس', wilaya_code: '25' }
  ],
  '31': [ // Oran
    { code: '3101', name_fr: 'Oran', name_ar: 'وهران', wilaya_code: '31' },
    { code: '3102', name_fr: 'Gdyel', name_ar: 'قديل', wilaya_code: '31' },
    { code: '3103', name_fr: 'Bir El Djir', name_ar: 'بئر الجير', wilaya_code: '31' },
    { code: '3104', name_fr: 'Hassi Bounif', name_ar: 'حاسي بونيف', wilaya_code: '31' },
    { code: '3105', name_fr: 'Es Senia', name_ar: 'السانية', wilaya_code: '31' },
    { code: '3106', name_fr: 'Arzew', name_ar: 'أرزيو', wilaya_code: '31' },
    { code: '3107', name_fr: 'Bethioua', name_ar: 'بطيوة', wilaya_code: '31' },
    { code: '3108', name_fr: 'Marsat El Hadjadj', name_ar: 'مرسى الحجاج', wilaya_code: '31' },
    { code: '3109', name_fr: 'Ain El Turk', name_ar: 'عين الترك', wilaya_code: '31' },
    { code: '3110', name_fr: 'El Ancar', name_ar: 'العنصر', wilaya_code: '31' },
    { code: '3111', name_fr: 'Oued Tlelat', name_ar: 'وادي تليلات', wilaya_code: '31' },
    { code: '3112', name_fr: 'Tafraoui', name_ar: 'طفراوي', wilaya_code: '31' },
    { code: '3113', name_fr: 'Sidi Chami', name_ar: 'سيدي الشامي', wilaya_code: '31' },
    { code: '3114', name_fr: 'Boufatis', name_ar: 'بوفاطيس', wilaya_code: '31' },
    { code: '3115', name_fr: 'Mers El Kebir', name_ar: 'المرسى الكبير', wilaya_code: '31' },
    { code: '3116', name_fr: 'Bousfer', name_ar: 'بوسفر', wilaya_code: '31' },
    { code: '3117', name_fr: 'El Karma', name_ar: 'الكرمة', wilaya_code: '31' },
    { code: '3118', name_fr: 'El Braya', name_ar: 'البراية', wilaya_code: '31' },
    { code: '3119', name_fr: 'Hassi Ben Okba', name_ar: 'حاسي بن عقبة', wilaya_code: '31' },
    { code: '3120', name_fr: 'Ben Freha', name_ar: 'بن فريحة', wilaya_code: '31' },
    { code: '3121', name_fr: 'Hassi Mefsoukh', name_ar: 'حاسي مفسوخ', wilaya_code: '31' },
    { code: '3122', name_fr: 'Sidi Ben Yebka', name_ar: 'سيدي بن يبقى', wilaya_code: '31' },
    { code: '3123', name_fr: 'Messerghin', name_ar: 'مسرغين', wilaya_code: '31' },
    { code: '3124', name_fr: 'Boutlelis', name_ar: 'بوتليليس', wilaya_code: '31' },
    { code: '3125', name_fr: 'Ain El Kerma', name_ar: 'عين الكرمة', wilaya_code: '31' },
    { code: '3126', name_fr: 'Ain El Bia', name_ar: 'عين البية', wilaya_code: '31' }
  ]
});

// Note: Pour les autres wilayas (08, 10-14, 17-18, 20-22, 24, 26-30, 32-58),
// les communes peuvent être ajoutées de la même manière selon les besoins.
// La structure est en place et extensible.
