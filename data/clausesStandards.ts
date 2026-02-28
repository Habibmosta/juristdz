// Bibliothèque de clauses standards utilisées dans la pratique juridique algérienne

export interface Clause {
  id: string;
  category: string;
  subcategory?: string;
  name_fr: string;
  name_ar: string;
  text_fr: string;
  text_ar: string;
  applicable_to: string[]; // Types de documents
  mandatory?: boolean; // Clause obligatoire
  legal_reference?: string; // Référence légale
  notes?: string;
  variables?: string[]; // Variables à remplacer
}

export interface ClauseCategory {
  id: string;
  name_fr: string;
  name_ar: string;
  description_fr: string;
  description_ar: string;
}

// Catégories de clauses
export const CLAUSE_CATEGORIES: ClauseCategory[] = [
  {
    id: 'identification',
    name_fr: 'Identification des Parties',
    name_ar: 'تحديد هوية الأطراف',
    description_fr: 'Clauses d\'identification complète des parties contractantes',
    description_ar: 'بنود تحديد هوية الأطراف المتعاقدة بشكل كامل'
  },
  {
    id: 'objet',
    name_fr: 'Objet du Contrat',
    name_ar: 'موضوع العقد',
    description_fr: 'Clauses définissant l\'objet et la nature du contrat',
    description_ar: 'بنود تحدد موضوع وطبيعة العقد'
  },
  {
    id: 'prix_paiement',
    name_fr: 'Prix et Modalités de Paiement',
    name_ar: 'الثمن وطرق الدفع',
    description_fr: 'Clauses relatives au prix et aux conditions de paiement',
    description_ar: 'بنود متعلقة بالثمن وشروط الدفع'
  },
  {
    id: 'garanties',
    name_fr: 'Garanties et Sûretés',
    name_ar: 'الضمانات والكفالات',
    description_fr: 'Clauses de garantie et de sûreté',
    description_ar: 'بنود الضمان والكفالة'
  },
  {
    id: 'obligations',
    name_fr: 'Obligations des Parties',
    name_ar: 'التزامات الأطراف',
    description_fr: 'Clauses définissant les obligations de chaque partie',
    description_ar: 'بنود تحدد التزامات كل طرف'
  }
];

// Clauses standards - Partie 1
export const CLAUSES_STANDARDS: Clause[] = [
  // === IDENTIFICATION DES PARTIES ===
  {
    id: 'id_personne_physique',
    category: 'identification',
    name_fr: 'Identification Personne Physique',
    name_ar: 'تحديد هوية الشخص الطبيعي',
    text_fr: `Monsieur/Madame [NOM] [PRENOM], né(e) le [DATE_NAISSANCE] à [LIEU_NAISSANCE], de nationalité algérienne, titulaire de la carte d'identité nationale n° [CIN] délivrée le [DATE_CIN] à [LIEU_CIN], demeurant à [ADRESSE], profession [PROFESSION].`,
    text_ar: `السيد/السيدة [NOM] [PRENOM]، المولود(ة) بتاريخ [DATE_NAISSANCE] في [LIEU_NAISSANCE]، الجنسية الجزائرية، حامل(ة) بطاقة التعريف الوطنية رقم [CIN] المسلمة بتاريخ [DATE_CIN] في [LIEU_CIN]، الساكن(ة) في [ADRESSE]، المهنة [PROFESSION].`,
    applicable_to: ['all'],
    mandatory: true,
    variables: ['NOM', 'PRENOM', 'DATE_NAISSANCE', 'LIEU_NAISSANCE', 'CIN', 'DATE_CIN', 'LIEU_CIN', 'ADRESSE', 'PROFESSION']
  },
  {
    id: 'id_personne_morale',
    category: 'identification',
    name_fr: 'Identification Personne Morale',
    name_ar: 'تحديد هوية الشخص المعنوي',
    text_fr: `La société [DENOMINATION], [FORME_JURIDIQUE], au capital social de [CAPITAL] DA, dont le siège social est situé à [SIEGE_SOCIAL], immatriculée au Registre de Commerce sous le numéro [RC], identifiée au NIF sous le numéro [NIF], représentée par Monsieur/Madame [REPRESENTANT], agissant en qualité de [QUALITE].`,
    text_ar: `شركة [DENOMINATION]، [FORME_JURIDIQUE]، برأسمال قدره [CAPITAL] دج، مقرها الاجتماعي في [SIEGE_SOCIAL]، المسجلة في السجل التجاري تحت رقم [RC]، المعرفة برقم التعريف الجبائي [NIF]، يمثلها السيد/السيدة [REPRESENTANT]، بصفته(ها) [QUALITE].`,
    applicable_to: ['commercial', 'societe', 'bail_commercial'],
    mandatory: true,
    legal_reference: 'Code de Commerce algérien',
    variables: ['DENOMINATION', 'FORME_JURIDIQUE', 'CAPITAL', 'SIEGE_SOCIAL', 'RC', 'NIF', 'REPRESENTANT', 'QUALITE']
  },

  // === OBJET DU CONTRAT ===
  {
    id: 'objet_vente_immobiliere',
    category: 'objet',
    subcategory: 'vente',
    name_fr: 'Objet - Vente Immobilière',
    name_ar: 'الموضوع - بيع عقاري',
    text_fr: `Le vendeur déclare vendre et céder à l'acquéreur qui accepte et acquiert, un bien immobilier consistant en [NATURE_BIEN], d'une superficie de [SUPERFICIE] mètres carrés, situé à [ADRESSE_BIEN], inscrit au livre foncier sous le numéro [NUMERO_TITRE_FONCIER], section cadastrale [SECTION_CADASTRALE].`,
    text_ar: `يقر البائع ببيعه وتنازله للمشتري الذي يقبل ويشتري، عقاراً يتكون من [NATURE_BIEN]، بمساحة [SUPERFICIE] متر مربع، يقع في [ADRESSE_BIEN]، مقيد في الدفتر العقاري تحت رقم [NUMERO_TITRE_FONCIER]، القسم المساحي [SECTION_CADASTRALE].`,
    applicable_to: ['acte_vente_immobiliere'],
    mandatory: true,
    legal_reference: 'Articles 351 et suivants du Code Civil',
    variables: ['NATURE_BIEN', 'SUPERFICIE', 'ADRESSE_BIEN', 'NUMERO_TITRE_FONCIER', 'SECTION_CADASTRALE']
  },

  {
    id: 'objet_bail_habitation',
    category: 'objet',
    subcategory: 'bail',
    name_fr: 'Objet - Bail d\'Habitation',
    name_ar: 'الموضوع - إيجار سكني',
    text_fr: `Le bailleur donne à bail au locataire qui accepte, un logement à usage d'habitation situé à [ADRESSE_LOGEMENT], composé de [NOMBRE_PIECES] pièces principales, cuisine, salle de bain, et dépendances, d'une superficie totale de [SUPERFICIE] m².`,
    text_ar: `يؤجر المؤجر للمستأجر الذي يقبل، مسكناً للاستعمال السكني يقع في [ADRESSE_LOGEMENT]، يتكون من [NOMBRE_PIECES] غرف رئيسية، مطبخ، حمام، وملحقات، بمساحة إجمالية قدرها [SUPERFICIE] م².`,
    applicable_to: ['bail_habitation'],
    mandatory: true,
    legal_reference: 'Loi 07-05 relative au bail à usage d\'habitation',
    variables: ['ADRESSE_LOGEMENT', 'NOMBRE_PIECES', 'SUPERFICIE']
  },

  // === PRIX ET PAIEMENT ===
  {
    id: 'prix_vente_comptant',
    category: 'prix_paiement',
    subcategory: 'vente',
    name_fr: 'Prix de Vente au Comptant',
    name_ar: 'ثمن البيع نقداً',
    text_fr: `Cette vente est consentie et acceptée moyennant le prix principal de [PRIX_VENTE] Dinars Algériens ([PRIX_LETTRES]), que l'acquéreur s'oblige à payer au vendeur comptant et en espèces, dont quittance.`,
    text_ar: `يتم هذا البيع ويقبل مقابل ثمن أساسي قدره [PRIX_VENTE] دينار جزائري ([PRIX_LETTRES])، يلتزم المشتري بدفعه للبائع نقداً وحالاً، مع الإبراء.`,
    applicable_to: ['acte_vente_immobiliere', 'acte_vente_mobiliere'],
    mandatory: true,
    legal_reference: 'Article 351 du Code Civil',
    variables: ['PRIX_VENTE', 'PRIX_LETTRES']
  },

  {
    id: 'prix_echelonne',
    category: 'prix_paiement',
    name_fr: 'Paiement Échelonné',
    name_ar: 'الدفع على أقساط',
    text_fr: `Le prix sera payé de la manière suivante : un acompte de [MONTANT_ACOMPTE] DA versé ce jour, dont quittance, et le solde de [MONTANT_SOLDE] DA payable en [NOMBRE_ECHEANCES] échéances mensuelles de [MONTANT_ECHEANCE] DA chacune, la première échéance étant exigible le [DATE_PREMIERE_ECHEANCE].`,
    text_ar: `يدفع الثمن على النحو التالي: دفعة مقدمة قدرها [MONTANT_ACOMPTE] دج مدفوعة اليوم، مع الإبراء، والباقي البالغ [MONTANT_SOLDE] دج يدفع على [NOMBRE_ECHEANCES] قسط شهري بقيمة [MONTANT_ECHEANCE] دج لكل قسط، يستحق القسط الأول في [DATE_PREMIERE_ECHEANCE].`,
    applicable_to: ['acte_vente_immobiliere', 'contrat_commercial'],
    variables: ['MONTANT_ACOMPTE', 'MONTANT_SOLDE', 'NOMBRE_ECHEANCES', 'MONTANT_ECHEANCE', 'DATE_PREMIERE_ECHEANCE']
  },

  {
    id: 'loyer_mensuel',
    category: 'prix_paiement',
    subcategory: 'bail',
    name_fr: 'Loyer Mensuel',
    name_ar: 'الأجرة الشهرية',
    text_fr: `Ce bail est consenti et accepté moyennant un loyer mensuel de [MONTANT_LOYER] Dinars Algériens ([LOYER_LETTRES]), payable d'avance le [JOUR_PAIEMENT] de chaque mois, au domicile du bailleur ou en tout autre lieu qu'il indiquera.`,
    text_ar: `يتم هذا الإيجار ويقبل مقابل أجرة شهرية قدرها [MONTANT_LOYER] دينار جزائري ([LOYER_LETTRES])، تدفع مقدماً في [JOUR_PAIEMENT] من كل شهر، في موطن المؤجر أو في أي مكان آخر يحدده.`,
    applicable_to: ['bail_habitation', 'bail_commercial'],
    mandatory: true,
    legal_reference: 'Article 467 du Code Civil',
    variables: ['MONTANT_LOYER', 'LOYER_LETTRES', 'JOUR_PAIEMENT']
  },

  // === GARANTIES ===
  {
    id: 'garantie_eviction',
    category: 'garanties',
    name_fr: 'Garantie d\'Éviction',
    name_ar: 'ضمان التعرض',
    text_fr: `Le vendeur garantit l'acquéreur contre tout trouble et éviction quelconque, tant de son fait personnel que du fait d'un tiers ayant cause de lui. Il s'oblige à faire son affaire personnelle de toutes réclamations, actions ou poursuites qui pourraient être dirigées contre l'acquéreur.`,
    text_ar: `يضمن البائع للمشتري ضد أي تعرض أو إخلال كان، سواء من فعله الشخصي أو من فعل الغير الذي له سبب منه. ويلتزم بأن يجعل من شأنه الشخصي جميع المطالبات أو الدعاوى أو المتابعات التي قد توجه ضد المشتري.`,
    applicable_to: ['acte_vente_immobiliere', 'acte_vente_mobiliere'],
    mandatory: true,
    legal_reference: 'Articles 371 à 380 du Code Civil'
  },

  {
    id: 'garantie_vices_caches',
    category: 'garanties',
    name_fr: 'Garantie des Vices Cachés',
    name_ar: 'ضمان العيوب الخفية',
    text_fr: `Le vendeur garantit l'acquéreur contre les vices cachés de la chose vendue qui la rendent impropre à l'usage auquel on la destine, ou qui diminuent tellement cet usage que l'acquéreur ne l'aurait pas acquise, ou n'en aurait donné qu'un moindre prix, s'il les avait connus.`,
    text_ar: `يضمن البائع للمشتري العيوب الخفية في الشيء المبيع التي تجعله غير صالح للاستعمال المخصص له، أو تنقص من هذا الاستعمال بحيث أن المشتري لم يكن ليشتريه، أو لم يكن ليدفع إلا ثمناً أقل، لو علم بها.`,
    applicable_to: ['acte_vente_immobiliere', 'acte_vente_mobiliere'],
    mandatory: true,
    legal_reference: 'Articles 379 à 383 du Code Civil'
  },

  {
    id: 'depot_garantie',
    category: 'garanties',
    subcategory: 'bail',
    name_fr: 'Dépôt de Garantie',
    name_ar: 'التأمين',
    text_fr: `Le locataire verse ce jour entre les mains du bailleur, à titre de dépôt de garantie, une somme de [MONTANT_DEPOT] Dinars Algériens, représentant [NOMBRE_MOIS] mois de loyer. Cette somme sera restituée au locataire à la fin du bail, déduction faite des sommes qui pourraient lui être dues.`,
    text_ar: `يدفع المستأجر اليوم بين يدي المؤجر، على سبيل التأمين، مبلغاً قدره [MONTANT_DEPOT] دينار جزائري، يمثل [NOMBRE_MOIS] شهر من الأجرة. يرد هذا المبلغ للمستأجر عند نهاية الإيجار، بعد خصم المبالغ التي قد تكون مستحقة له.`,
    applicable_to: ['bail_habitation', 'bail_commercial'],
    legal_reference: 'Article 507 du Code Civil',
    variables: ['MONTANT_DEPOT', 'NOMBRE_MOIS']
  },

  // === OBLIGATIONS DES PARTIES ===
  {
    id: 'obligation_delivrance',
    category: 'obligations',
    subcategory: 'vendeur',
    name_fr: 'Obligation de Délivrance',
    name_ar: 'التزام التسليم',
    text_fr: `Le vendeur s'oblige à délivrer le bien vendu à l'acquéreur dans l'état où il se trouve actuellement, avec tous ses accessoires et dépendances, libre de toute occupation, dans un délai de [DELAI_DELIVRANCE] jours à compter de la signature des présentes.`,
    text_ar: `يلتزم البائع بتسليم المال المبيع للمشتري في الحالة التي هو عليها حالياً، مع جميع ملحقاته وتوابعه، خالياً من أي شغل، في أجل [DELAI_DELIVRANCE] يوماً من تاريخ التوقيع على هذا العقد.`,
    applicable_to: ['acte_vente_immobiliere', 'acte_vente_mobiliere'],
    mandatory: true,
    legal_reference: 'Article 367 du Code Civil',
    variables: ['DELAI_DELIVRANCE']
  },

  {
    id: 'obligation_paiement_prix',
    category: 'obligations',
    subcategory: 'acheteur',
    name_fr: 'Obligation de Payer le Prix',
    name_ar: 'التزام دفع الثمن',
    text_fr: `L'acquéreur s'oblige à payer le prix convenu aux époques et selon les modalités stipulées ci-dessus. À défaut de paiement à l'échéance, les sommes dues porteront intérêt au taux légal, sans mise en demeure préalable.`,
    text_ar: `يلتزم المشتري بدفع الثمن المتفق عليه في المواعيد ووفقاً للطرق المنصوص عليها أعلاه. في حالة عدم الدفع عند الاستحقاق، تحمل المبالغ المستحقة فائدة بالمعدل القانوني، دون حاجة إلى إعذار مسبق.`,
    applicable_to: ['acte_vente_immobiliere', 'acte_vente_mobiliere'],
    mandatory: true,
    legal_reference: 'Article 368 du Code Civil'
  },

  {
    id: 'obligation_entretien_bailleur',
    category: 'obligations',
    subcategory: 'bailleur',
    name_fr: 'Obligations d\'Entretien du Bailleur',
    name_ar: 'التزامات الصيانة للمؤجر',
    text_fr: `Le bailleur s'oblige à délivrer au locataire le logement en bon état d'habitabilité et à effectuer pendant toute la durée du bail les réparations nécessaires autres que locatives, notamment les grosses réparations définies par l'article 470 du Code Civil.`,
    text_ar: `يلتزم المؤجر بتسليم المسكن للمستأجر في حالة جيدة للسكن وبإجراء طوال مدة الإيجار الإصلاحات الضرورية غير الإيجارية، لا سيما الإصلاحات الكبرى المحددة في المادة 470 من القانون المدني.`,
    applicable_to: ['bail_habitation'],
    mandatory: true,
    legal_reference: 'Articles 469-470 du Code Civil'
  },

  {
    id: 'obligation_jouissance_paisible',
    category: 'obligations',
    subcategory: 'bailleur',
    name_fr: 'Garantie de Jouissance Paisible',
    name_ar: 'ضمان الانتفاع الهادئ',
    text_fr: `Le bailleur garantit au locataire la jouissance paisible du logement loué pendant toute la durée du bail. Il s'interdit de troubler cette jouissance par son fait personnel ou par le fait de personnes dont il doit répondre.`,
    text_ar: `يضمن المؤجر للمستأجر الانتفاع الهادئ بالمسكن المؤجر طوال مدة الإيجار. ويمتنع عن إزعاج هذا الانتفاع بفعله الشخصي أو بفعل أشخاص يجب عليه أن يجيب عنهم.`,
    applicable_to: ['bail_habitation', 'bail_commercial'],
    mandatory: true,
    legal_reference: 'Article 469 du Code Civil'
  },

  {
    id: 'obligation_usage_locataire',
    category: 'obligations',
    subcategory: 'locataire',
    name_fr: 'Obligation d\'Usage Conforme',
    name_ar: 'التزام الاستعمال المطابق',
    text_fr: `Le locataire s'oblige à user du logement loué en bon père de famille, conformément à la destination qui lui a été donnée par le bail. Il ne pourra y apporter aucune modification sans l'accord écrit préalable du bailleur.`,
    text_ar: `يلتزم المستأجر باستعمال المسكن المؤجر كرب أسرة صالح، وفقاً للغرض الذي خصص له في عقد الإيجار. ولا يجوز له إدخال أي تعديل عليه دون موافقة كتابية مسبقة من المؤجر.`,
    applicable_to: ['bail_habitation', 'bail_commercial'],
    mandatory: true,
    legal_reference: 'Article 506 du Code Civil'
  },

  // === CLAUSES SPÉCIFIQUES DROIT DE LA FAMILLE ===
  {
    id: 'mariage_regime_legal',
    category: 'famille',
    subcategory: 'mariage',
    name_fr: 'Régime Matrimonial Légal',
    name_ar: 'النظام القانوني للزواج',
    text_fr: `Les époux déclarent adopter le régime de la séparation des biens tel que prévu par le Code de la Famille algérien. Chaque époux conserve la propriété et la gestion de ses biens personnels acquis avant ou pendant le mariage.`,
    text_ar: `يقر الزوجان باعتماد نظام انفصال الأموال كما هو منصوص عليه في قانون الأسرة الجزائري. يحتفظ كل زوج بملكية وإدارة أمواله الشخصية المكتسبة قبل أو أثناء الزواج.`,
    applicable_to: ['contrat_mariage'],
    mandatory: false,
    legal_reference: 'Articles 36 et 37 du Code de la Famille'
  },

  {
    id: 'pension_alimentaire',
    category: 'famille',
    subcategory: 'divorce',
    name_fr: 'Pension Alimentaire',
    name_ar: 'النفقة',
    text_fr: `Conformément aux dispositions de l'article 75 du Code de la Famille, le débiteur s'oblige à verser une pension alimentaire mensuelle de [MONTANT_PENSION] DA au profit de [BENEFICIAIRE], payable le [JOUR_PAIEMENT] de chaque mois, par virement bancaire ou tout autre moyen de paiement.`,
    text_ar: `طبقاً لأحكام المادة 75 من قانون الأسرة، يلتزم المدين بدفع نفقة شهرية قدرها [MONTANT_PENSION] دج لصالح [BENEFICIAIRE]، تدفع في [JOUR_PAIEMENT] من كل شهر، عن طريق التحويل البنكي أو أي وسيلة دفع أخرى.`,
    applicable_to: ['requete_pension_alimentaire', 'jugement_divorce'],
    mandatory: true,
    legal_reference: 'Article 75 du Code de la Famille',
    variables: ['MONTANT_PENSION', 'BENEFICIAIRE', 'JOUR_PAIEMENT']
  },

  {
    id: 'garde_enfants',
    category: 'famille',
    subcategory: 'divorce',
    name_fr: 'Garde des Enfants',
    name_ar: 'حضانة الأطفال',
    text_fr: `La garde des enfants mineurs [NOMS_ENFANTS] est confiée à [PARENT_GARDIEN], conformément aux dispositions des articles 62 à 72 du Code de la Famille. Le parent non gardien bénéficie d'un droit de visite et d'hébergement à exercer [MODALITES_VISITE].`,
    text_ar: `تسند حضانة الأطفال القصر [NOMS_ENFANTS] إلى [PARENT_GARDIEN]، طبقاً لأحكام المواد من 62 إلى 72 من قانون الأسرة. يستفيد الوالد غير الحاضن من حق الزيارة والإيواء يمارس [MODALITES_VISITE].`,
    applicable_to: ['requete_garde_enfants', 'jugement_divorce'],
    mandatory: true,
    legal_reference: 'Articles 62 à 72 du Code de la Famille',
    variables: ['NOMS_ENFANTS', 'PARENT_GARDIEN', 'MODALITES_VISITE']
  },

  // === CLAUSES COMMERCIALES ===
  {
    id: 'clause_resolutoire',
    category: 'commercial',
    name_fr: 'Clause Résolutoire',
    name_ar: 'شرط الفسخ',
    text_fr: `À défaut de paiement à l'échéance de l'une quelconque des sommes dues, et un mois après une mise en demeure restée sans effet, la présente vente sera résolue de plein droit si bon semble au vendeur, sans qu'il soit besoin de remplir aucune formalité judiciaire.`,
    text_ar: `في حالة عدم الدفع عند استحقاق أي من المبالغ المستحقة، وبعد شهر من إعذار بقي دون أثر، يفسخ هذا البيع من تلقاء نفسه إذا رأى البائع ذلك، دون حاجة إلى استيفاء أي إجراء قضائي.`,
    applicable_to: ['acte_vente_immobiliere', 'contrat_commercial'],
    legal_reference: 'Article 119 du Code Civil'
  },

  {
    id: 'clause_penale',
    category: 'commercial',
    name_fr: 'Clause Pénale',
    name_ar: 'الشرط الجزائي',
    text_fr: `En cas d'inexécution de l'une quelconque des obligations du présent contrat, la partie défaillante sera tenue de payer à l'autre partie, à titre de clause pénale et sans mise en demeure préalable, une indemnité forfaitaire de [MONTANT_PENALITE] DA, sans préjudice de tous dommages et intérêts complémentaires.`,
    text_ar: `في حالة عدم تنفيذ أي من التزامات هذا العقد، يلتزم الطرف المخل بدفع للطرف الآخر، على سبيل الشرط الجزائي ودون إعذار مسبق، تعويضاً جزافياً قدره [MONTANT_PENALITE] دج، دون المساس بأي تعويضات إضافية.`,
    applicable_to: ['contrat_commercial', 'bail_commercial'],
    variables: ['MONTANT_PENALITE']
  }
];

// Fonction pour obtenir les clauses par catégorie
export function getClausesByCategory(categoryId: string): Clause[] {
  return CLAUSES_STANDARDS.filter(clause => clause.category === categoryId);
}

// Fonction pour obtenir les clauses applicables à un type de document
export function getClausesForDocument(documentType: string): Clause[] {
  return CLAUSES_STANDARDS.filter(clause => 
    clause.applicable_to.includes(documentType) || clause.applicable_to.includes('all')
  );
}

// Fonction pour obtenir les clauses obligatoires
export function getMandatoryClauses(documentType: string): Clause[] {
  return getClausesForDocument(documentType).filter(clause => clause.mandatory);
}

// Fonction pour remplacer les variables dans une clause
export function populateClause(clause: Clause, variables: { [key: string]: string }, language: 'fr' | 'ar'): string {
  let text = language === 'ar' ? clause.text_ar : clause.text_fr;
  
  // Remplacer les variables fournies
  Object.entries(variables).forEach(([key, value]) => {
    if (value && value !== '') {
      const regex = new RegExp(`\\[${key}\\]`, 'gi');
      text = text.replace(regex, value);
    }
  });
  
  // CRITIQUE: Nettoyer TOUS les placeholders restants
  // Supprimer les placeholders vides plutôt que de les laisser
  text = text.replace(/\[[\w\s_-]+\]/g, (match) => {
    console.warn(`🚨 Placeholder non rempli dans clause supprimé: ${match}`);
    return '';
  });
  
  // Nettoyer les espaces multiples et espaces avant ponctuation
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/\s+([,;.!?])/g, '$1');
  text = text.trim();
  
  return text;
}
