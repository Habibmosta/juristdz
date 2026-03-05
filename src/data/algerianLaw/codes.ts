/**
 * Base de données des codes algériens
 * Source: Journal Officiel de la République Algérienne
 */

export interface LegalCode {
  id: string;
  title: string;
  title_ar: string;
  year: number;
  lastUpdate: string;
  articles: number;
  category: string;
  description: string;
  description_ar: string;
}

export const ALGERIAN_CODES: LegalCode[] = [
  {
    id: 'code_civil',
    title: 'Code Civil Algérien',
    title_ar: 'القانون المدني الجزائري',
    year: 1975,
    lastUpdate: '2023-07-15',
    articles: 1042,
    category: 'civil',
    description: 'Ordonnance n° 75-58 du 26 septembre 1975 portant code civil, modifiée et complétée',
    description_ar: 'الأمر رقم 75-58 المؤرخ في 26 سبتمبر 1975 المتضمن القانون المدني المعدل والمتمم'
  },
  {
    id: 'code_penal',
    title: 'Code Pénal Algérien',
    title_ar: 'قانون العقوبات الجزائري',
    year: 1966,
    lastUpdate: '2023-06-20',
    articles: 458,
    category: 'penal',
    description: 'Ordonnance n° 66-156 du 8 juin 1966 portant code pénal, modifiée et complétée',
    description_ar: 'الأمر رقم 66-156 المؤرخ في 8 يونيو 1966 المتضمن قانون العقوبات المعدل والمتمم'
  },
  {
    id: 'code_procedure_civile',
    title: 'Code de Procédure Civile et Administrative',
    title_ar: 'قانون الإجراءات المدنية والإدارية',
    year: 2008,
    lastUpdate: '2022-12-10',
    articles: 1061,
    category: 'procedure',
    description: 'Loi n° 08-09 du 25 février 2008 portant code de procédure civile et administrative',
    description_ar: 'القانون رقم 08-09 المؤرخ في 25 فبراير 2008 المتضمن قانون الإجراءات المدنية والإدارية'
  },
  {
    id: 'code_procedure_penale',
    title: 'Code de Procédure Pénale',
    title_ar: 'قانون الإجراءات الجزائية',
    year: 1966,
    lastUpdate: '2023-03-15',
    articles: 442,
    category: 'procedure',
    description: 'Ordonnance n° 66-155 du 8 juin 1966 portant code de procédure pénale, modifiée et complétée',
    description_ar: 'الأمر رقم 66-155 المؤرخ في 8 يونيو 1966 المتضمن قانون الإجراءات الجزائية المعدل والمتمم'
  },
  {
    id: 'code_commerce',
    title: 'Code de Commerce',
    title_ar: 'القانون التجاري',
    year: 1975,
    lastUpdate: '2023-01-20',
    articles: 853,
    category: 'commercial',
    description: 'Ordonnance n° 75-59 du 26 septembre 1975 portant code de commerce, modifiée et complétée',
    description_ar: 'الأمر رقم 75-59 المؤرخ في 26 سبتمبر 1975 المتضمن القانون التجاري المعدل والمتمم'
  },
  {
    id: 'code_famille',
    title: 'Code de la Famille',
    title_ar: 'قانون الأسرة',
    year: 1984,
    lastUpdate: '2005-02-27',
    articles: 224,
    category: 'family',
    description: 'Loi n° 84-11 du 9 juin 1984 portant code de la famille, modifiée par l\'ordonnance 05-02',
    description_ar: 'القانون رقم 84-11 المؤرخ في 9 يونيو 1984 المتضمن قانون الأسرة المعدل بالأمر 05-02'
  },
  {
    id: 'code_travail',
    title: 'Code du Travail',
    title_ar: 'قانون العمل',
    year: 1990,
    lastUpdate: '2023-05-10',
    articles: 145,
    category: 'labor',
    description: 'Loi n° 90-11 du 21 avril 1990 relative aux relations de travail, modifiée et complétée',
    description_ar: 'القانون رقم 90-11 المؤرخ في 21 أبريل 1990 المتعلق بعلاقات العمل المعدل والمتمم'
  },
  {
    id: 'code_douanes',
    title: 'Code des Douanes',
    title_ar: 'قانون الجمارك',
    year: 1979,
    lastUpdate: '2023-04-05',
    articles: 352,
    category: 'customs',
    description: 'Ordonnance n° 79-07 du 21 juillet 1979 portant code des douanes, modifiée et complétée',
    description_ar: 'الأمر رقم 79-07 المؤرخ في 21 يوليو 1979 المتضمن قانون الجمارك المعدل والمتمم'
  },
  {
    id: 'code_impots_directs',
    title: 'Code des Impôts Directs et Taxes Assimilées',
    title_ar: 'قانون الضرائب المباشرة والرسوم المماثلة',
    year: 1976,
    lastUpdate: '2024-01-01',
    articles: 358,
    category: 'tax',
    description: 'Ordonnance n° 76-101 du 9 décembre 1976, modifiée par les lois de finances successives',
    description_ar: 'الأمر رقم 76-101 المؤرخ في 9 ديسمبر 1976 المعدل بقوانين المالية المتعاقبة'
  },
  {
    id: 'code_tva',
    title: 'Code des Taxes sur le Chiffre d\'Affaires',
    title_ar: 'قانون الرسوم على رقم الأعمال',
    year: 1991,
    lastUpdate: '2024-01-01',
    articles: 142,
    category: 'tax',
    description: 'Loi n° 91-25 du 18 décembre 1991, modifiée par les lois de finances successives',
    description_ar: 'القانون رقم 91-25 المؤرخ في 18 ديسمبر 1991 المعدل بقوانين المالية المتعاقبة'
  },
  {
    id: 'code_investissement',
    title: 'Code de l\'Investissement',
    title_ar: 'قانون الاستثمار',
    year: 2022,
    lastUpdate: '2022-07-15',
    articles: 89,
    category: 'investment',
    description: 'Loi n° 22-18 du 24 juillet 2022 relative à l\'investissement',
    description_ar: 'القانون رقم 22-18 المؤرخ في 24 يوليو 2022 المتعلق بالاستثمار'
  },
  {
    id: 'code_marches_publics',
    title: 'Code des Marchés Publics',
    title_ar: 'قانون الصفقات العمومية',
    year: 2023,
    lastUpdate: '2023-09-20',
    articles: 256,
    category: 'public',
    description: 'Décret présidentiel n° 23-270 du 18 septembre 2023 portant réglementation des marchés publics',
    description_ar: 'المرسوم الرئاسي رقم 23-270 المؤرخ في 18 سبتمبر 2023 المتضمن تنظيم الصفقات العمومية'
  }
];

export const getCodeById = (id: string): LegalCode | undefined => {
  return ALGERIAN_CODES.find(code => code.id === id);
};

export const getCodesByCategory = (category: string): LegalCode[] => {
  return ALGERIAN_CODES.filter(code => code.category === category);
};

export const searchCodes = (query: string, language: 'fr' | 'ar' = 'fr'): LegalCode[] => {
  const lowerQuery = query.toLowerCase();
  return ALGERIAN_CODES.filter(code => {
    if (language === 'ar') {
      return code.title_ar.includes(query) || code.description_ar.includes(query);
    }
    return code.title.toLowerCase().includes(lowerQuery) || 
           code.description.toLowerCase().includes(lowerQuery);
  });
};
