// Bibliothèque de clauses standards — pratique juridique algérienne

export interface Clause {
  id: string;
  category: string;
  subcategory?: string;
  name_fr: string;
  name_ar: string;
  text_fr: string;
  text_ar: string;
  applicable_to: string[];
  mandatory?: boolean;
  legal_reference?: string;
  notes?: string;
  variables?: string[];
}

export interface ClauseCategory {
  id: string;
  name_fr: string;
  name_ar: string;
  description_fr: string;
  description_ar: string;
}

export const CLAUSE_CATEGORIES: ClauseCategory[] = [
  { id: 'identification', name_fr: 'Identification des Parties', name_ar: 'تحديد هوية الأطراف', description_fr: 'Clauses d\'identification complète des parties', description_ar: 'بنود تحديد هوية الأطراف' },
  { id: 'objet', name_fr: 'Objet du Contrat', name_ar: 'موضوع العقد', description_fr: 'Clauses définissant l\'objet du contrat', description_ar: 'بنود تحدد موضوع العقد' },
  { id: 'prix_paiement', name_fr: 'Prix et Paiement', name_ar: 'الثمن والدفع', description_fr: 'Clauses relatives au prix et paiement', description_ar: 'بنود الثمن وطرق الدفع' },
  { id: 'garanties', name_fr: 'Garanties et Sûretés', name_ar: 'الضمانات والكفالات', description_fr: 'Clauses de garantie et sûreté', description_ar: 'بنود الضمان والكفالة' },
  { id: 'obligations', name_fr: 'Obligations des Parties', name_ar: 'التزامات الأطراف', description_fr: 'Obligations de chaque partie', description_ar: 'التزامات كل طرف' },
  { id: 'travail', name_fr: 'Droit du Travail', name_ar: 'قانون العمل', description_fr: 'Clauses contrats de travail (Loi 90-11)', description_ar: 'بنود عقود العمل (القانون 90-11)' },
  { id: 'societe', name_fr: 'Droit des Sociétés', name_ar: 'قانون الشركات', description_fr: 'Constitution et gestion des sociétés', description_ar: 'تأسيس وإدارة الشركات' },
  { id: 'notarial', name_fr: 'Actes Notariaux', name_ar: 'العقود الرسمية', description_fr: 'Actes notariaux algériens', description_ar: 'العقود الرسمية الجزائرية' },
  { id: 'huissier', name_fr: 'Actes d\'Huissier', name_ar: 'أعمال المحضر القضائي', description_fr: 'Constats, significations, saisies', description_ar: 'المحاضر والتبليغات والحجوزات' },
  { id: 'avocat', name_fr: 'Actes d\'Avocat', name_ar: 'أعمال المحامي', description_fr: 'Requêtes, conclusions, mises en demeure', description_ar: 'العرائض والمذكرات والإنذارات' },
  { id: 'commercial', name_fr: 'Clauses Commerciales', name_ar: 'البنود التجارية', description_fr: 'Clauses spécifiques aux contrats commerciaux', description_ar: 'بنود العقود التجارية' },
  { id: 'famille', name_fr: 'Droit de la Famille', name_ar: 'قانون الأسرة', description_fr: 'Clauses droit de la famille algérien', description_ar: 'بنود قانون الأسرة الجزائري' },
  { id: 'protection', name_fr: 'Clauses de Protection', name_ar: 'بنود الحماية', description_fr: 'Non-concurrence, confidentialité, force majeure', description_ar: 'عدم المنافسة، السرية، القوة القاهرة' },
];

// ═══════════════════════════════════════════════════════════════════════════
// CLAUSES STANDARDS
// ═══════════════════════════════════════════════════════════════════════════
export const CLAUSES_STANDARDS: Clause[] = [

  // ── IDENTIFICATION DES PARTIES ──────────────────────────────────────────
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
  {
    id: 'id_avocat',
    category: 'identification',
    subcategory: 'avocat',
    name_fr: 'Identification Avocat',
    name_ar: 'تحديد هوية المحامي',
    text_fr: `Maître [NOM_AVOCAT] [PRENOM_AVOCAT], Avocat inscrit au Barreau de [BARREAU], dont le cabinet est sis à [ADRESSE_CABINET], agissant au nom et pour le compte de son client [NOM_CLIENT], en vertu d'une procuration sous seing privé en date du [DATE_PROCURATION].`,
    text_ar: `الأستاذ [NOM_AVOCAT] [PRENOM_AVOCAT]، محامٍ مقيد في هيئة محامي [BARREAU]، مكتبه الكائن في [ADRESSE_CABINET]، يتصرف باسم ولحساب موكله [NOM_CLIENT]، بموجب توكيل عرفي مؤرخ في [DATE_PROCURATION].`,
    applicable_to: ['requete', 'conclusions', 'mise_en_demeure'],
    mandatory: true,
    variables: ['NOM_AVOCAT', 'PRENOM_AVOCAT', 'BARREAU', 'ADRESSE_CABINET', 'NOM_CLIENT', 'DATE_PROCURATION']
  },
  {
    id: 'id_huissier',
    category: 'identification',
    subcategory: 'huissier',
    name_fr: 'Identification Huissier de Justice',
    name_ar: 'تحديد هوية المحضر القضائي',
    text_fr: `Maître [NOM_HUISSIER] [PRENOM_HUISSIER], Huissier de Justice, titulaire d'un office sis à [ADRESSE_OFFICE], dans le ressort du Tribunal de [TRIBUNAL], soussigné, certifie avoir accompli les diligences ci-après relatées.`,
    text_ar: `الأستاذ [NOM_HUISSIER] [PRENOM_HUISSIER]، محضر قضائي، صاحب مكتب كائن في [ADRESSE_OFFICE]، في دائرة اختصاص محكمة [TRIBUNAL]، الموقع أدناه، يشهد بأنه قام بالإجراءات المبينة فيما يلي.`,
    applicable_to: ['constat', 'signification', 'commandement', 'pv_saisie'],
    mandatory: true,
    variables: ['NOM_HUISSIER', 'PRENOM_HUISSIER', 'ADRESSE_OFFICE', 'TRIBUNAL']
  },
  {
    id: 'id_notaire',
    category: 'identification',
    subcategory: 'notaire',
    name_fr: 'Identification Notaire',
    name_ar: 'تحديد هوية الموثق',
    text_fr: `Maître [NOM_NOTAIRE] [PRENOM_NOTAIRE], Notaire, titulaire d'une étude notariale sise à [ADRESSE_ETUDE], dans le ressort de la Chambre des Notaires de [CHAMBRE], soussigné, a reçu le présent acte authentique.`,
    text_ar: `الأستاذ [NOM_NOTAIRE] [PRENOM_NOTAIRE]، موثق، صاحب مكتب توثيق كائن في [ADRESSE_ETUDE]، في دائرة اختصاص غرفة الموثقين لـ[CHAMBRE]، الموقع أدناه، تلقى هذا العقد الرسمي.`,
    applicable_to: ['acte_vente_immobiliere', 'donation', 'testament', 'constitution_societe', 'hypotheque'],
    mandatory: true,
    variables: ['NOM_NOTAIRE', 'PRENOM_NOTAIRE', 'ADRESSE_ETUDE', 'CHAMBRE']
  },

  // ── OBJET DU CONTRAT ────────────────────────────────────────────────────
  {
    id: 'objet_vente_immobiliere',
    category: 'objet',
    subcategory: 'vente',
    name_fr: 'Objet — Vente Immobilière',
    name_ar: 'الموضوع — بيع عقاري',
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
    name_fr: 'Objet — Bail d\'Habitation',
    name_ar: 'الموضوع — إيجار سكني',
    text_fr: `Le bailleur donne à bail au locataire qui accepte, un logement à usage d'habitation situé à [ADRESSE_LOGEMENT], composé de [NOMBRE_PIECES] pièces principales, cuisine, salle de bain, et dépendances, d'une superficie totale de [SUPERFICIE] m².`,
    text_ar: `يؤجر المؤجر للمستأجر الذي يقبل، مسكناً للاستعمال السكني يقع في [ADRESSE_LOGEMENT]، يتكون من [NOMBRE_PIECES] غرف رئيسية، مطبخ، حمام، وملحقات، بمساحة إجمالية قدرها [SUPERFICIE] م².`,
    applicable_to: ['bail_habitation'],
    mandatory: true,
    legal_reference: 'Loi 07-05 relative au bail à usage d\'habitation',
    variables: ['ADRESSE_LOGEMENT', 'NOMBRE_PIECES', 'SUPERFICIE']
  },
  {
    id: 'objet_bail_commercial',
    category: 'objet',
    subcategory: 'bail',
    name_fr: 'Objet — Bail Commercial',
    name_ar: 'الموضوع — إيجار تجاري',
    text_fr: `Le bailleur donne à bail au preneur qui accepte, un local à usage commercial situé à [ADRESSE_LOCAL], d'une superficie de [SUPERFICIE] m², pour y exercer exclusivement l'activité de [ACTIVITE_COMMERCIALE], conformément au registre de commerce n° [RC_PRENEUR]. Le bail est consenti pour une durée de [DUREE] ans à compter du [DATE_DEBUT].`,
    text_ar: `يؤجر المؤجر للمستأجر الذي يقبل، محلاً للاستعمال التجاري يقع في [ADRESSE_LOCAL]، بمساحة [SUPERFICIE] م²، لممارسة نشاط [ACTIVITE_COMMERCIALE] حصراً، وفقاً للسجل التجاري رقم [RC_PRENEUR]. يُبرم الإيجار لمدة [DUREE] سنوات ابتداءً من [DATE_DEBUT].`,
    applicable_to: ['bail_commercial'],
    mandatory: true,
    legal_reference: 'Articles 169 à 196 du Code de Commerce',
    variables: ['ADRESSE_LOCAL', 'SUPERFICIE', 'ACTIVITE_COMMERCIALE', 'RC_PRENEUR', 'DUREE', 'DATE_DEBUT']
  },
  {
    id: 'objet_contrat_travail_cdi',
    category: 'objet',
    subcategory: 'travail',
    name_fr: 'Objet — Contrat de Travail CDI',
    name_ar: 'الموضوع — عقد عمل غير محدد المدة',
    text_fr: `L'employeur engage le salarié pour occuper le poste de [POSTE] au sein de [NOM_ENTREPRISE], à compter du [DATE_EMBAUCHE], pour une durée indéterminée. Le salarié exercera ses fonctions au lieu de travail situé à [LIEU_TRAVAIL], sous l'autorité de [SUPERIEUR_HIERARCHIQUE].`,
    text_ar: `يوظف صاحب العمل العامل لشغل منصب [POSTE] في [NOM_ENTREPRISE]، ابتداءً من [DATE_EMBAUCHE]، لمدة غير محددة. يمارس العامل مهامه في مكان العمل الكائن في [LIEU_TRAVAIL]، تحت سلطة [SUPERIEUR_HIERARCHIQUE].`,
    applicable_to: ['contrat_travail_cdi'],
    mandatory: true,
    legal_reference: 'Articles 11 et suivants de la Loi 90-11',
    variables: ['POSTE', 'NOM_ENTREPRISE', 'DATE_EMBAUCHE', 'LIEU_TRAVAIL', 'SUPERIEUR_HIERARCHIQUE']
  },
  {
    id: 'objet_contrat_travail_cdd',
    category: 'objet',
    subcategory: 'travail',
    name_fr: 'Objet — Contrat de Travail CDD',
    name_ar: 'الموضوع — عقد عمل محدد المدة',
    text_fr: `L'employeur engage le salarié pour occuper le poste de [POSTE] au sein de [NOM_ENTREPRISE], pour une durée déterminée de [DUREE] mois, du [DATE_DEBUT] au [DATE_FIN], pour le motif suivant : [MOTIF_CDD]. À l'échéance du terme, le contrat prendra fin de plein droit.`,
    text_ar: `يوظف صاحب العمل العامل لشغل منصب [POSTE] في [NOM_ENTREPRISE]، لمدة محددة قدرها [DUREE] أشهر، من [DATE_DEBUT] إلى [DATE_FIN]، للسبب التالي: [MOTIF_CDD]. عند انتهاء الأجل، ينتهي العقد من تلقاء نفسه.`,
    applicable_to: ['contrat_travail_cdd'],
    mandatory: true,
    legal_reference: 'Article 12 de la Loi 90-11',
    variables: ['POSTE', 'NOM_ENTREPRISE', 'DUREE', 'DATE_DEBUT', 'DATE_FIN', 'MOTIF_CDD']
  },
  {
    id: 'objet_donation',
    category: 'objet',
    subcategory: 'notarial',
    name_fr: 'Objet — Donation entre Vifs',
    name_ar: 'الموضوع — هبة بين الأحياء',
    text_fr: `Le donateur déclare faire donation entre vifs et irrévocable au donataire qui accepte, d'un bien [NATURE_BIEN] situé à [ADRESSE_BIEN], d'une superficie de [SUPERFICIE] m², inscrit au livre foncier sous le numéro [NUMERO_TF]. Cette donation est faite à titre gratuit, sans charge ni condition, en avancement d'hoirie.`,
    text_ar: `يقر الواهب بهبته بين الأحياء وبصفة نهائية للموهوب له الذي يقبل، [NATURE_BIEN] الكائن في [ADRESSE_BIEN]، بمساحة [SUPERFICIE] م²، المقيد في الدفتر العقاري تحت رقم [NUMERO_TF]. تتم هذه الهبة بصفة مجانية، دون أعباء أو شروط، على سبيل التقدم في الإرث.`,
    applicable_to: ['donation'],
    mandatory: true,
    legal_reference: 'Articles 202 à 215 du Code de la Famille',
    variables: ['NATURE_BIEN', 'ADRESSE_BIEN', 'SUPERFICIE', 'NUMERO_TF']
  },
  {
    id: 'objet_contrat_entreprise',
    category: 'objet',
    subcategory: 'commercial',
    name_fr: 'Objet — Contrat d\'Entreprise',
    name_ar: 'الموضوع — عقد مقاولة',
    text_fr: `L'entrepreneur s'engage à réaliser pour le compte du maître d'ouvrage les travaux suivants : [DESCRIPTION_TRAVAUX], conformément aux plans et cahier des charges annexés au présent contrat. Les travaux seront exécutés à [LIEU_TRAVAUX] et devront être achevés au plus tard le [DATE_LIVRAISON].`,
    text_ar: `يلتزم المقاول بإنجاز لحساب صاحب المشروع الأشغال التالية: [DESCRIPTION_TRAVAUX]، وفقاً للمخططات ودفتر الشروط المرفقين بهذا العقد. تُنجز الأشغال في [LIEU_TRAVAUX] ويجب إتمامها في أجل أقصاه [DATE_LIVRAISON].`,
    applicable_to: ['contrat_entreprise'],
    mandatory: true,
    legal_reference: 'Articles 549 à 565 du Code Civil',
    variables: ['DESCRIPTION_TRAVAUX', 'LIEU_TRAVAUX', 'DATE_LIVRAISON']
  },

  // ── PRIX ET PAIEMENT ────────────────────────────────────────────────────
  {
    id: 'prix_vente_comptant',
    category: 'prix_paiement',
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
    text_ar: `يدفع الثمن على النحو التالي: دفعة مقدمة قدرها [MONTANT_ACOMPTE] دج مدفوعة اليوم مع الإبراء، والباقي البالغ [MONTANT_SOLDE] دج يدفع على [NOMBRE_ECHEANCES] قسط شهري بقيمة [MONTANT_ECHEANCE] دج لكل قسط، يستحق القسط الأول في [DATE_PREMIERE_ECHEANCE].`,
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
  {
    id: 'salaire_mensuel',
    category: 'prix_paiement',
    subcategory: 'travail',
    name_fr: 'Salaire et Rémunération',
    name_ar: 'الأجر والمكافأة',
    text_fr: `En contrepartie de son travail, le salarié percevra un salaire mensuel brut de [MONTANT_SALAIRE] DA ([SALAIRE_LETTRES]), payable le [JOUR_PAIEMENT] de chaque mois par virement bancaire sur le compte n° [COMPTE_BANCAIRE]. Ce salaire inclut toutes les primes et indemnités légales obligatoires.`,
    text_ar: `مقابل عمله، يتقاضى العامل أجراً شهرياً إجمالياً قدره [MONTANT_SALAIRE] دج ([SALAIRE_LETTRES])، يُدفع في [JOUR_PAIEMENT] من كل شهر بتحويل بنكي على الحساب رقم [COMPTE_BANCAIRE]. يشمل هذا الأجر جميع العلاوات والتعويضات القانونية الإلزامية.`,
    applicable_to: ['contrat_travail_cdi', 'contrat_travail_cdd'],
    mandatory: true,
    legal_reference: 'Articles 80 à 87 de la Loi 90-11',
    variables: ['MONTANT_SALAIRE', 'SALAIRE_LETTRES', 'JOUR_PAIEMENT', 'COMPTE_BANCAIRE']
  },
  {
    id: 'honoraires_avocat',
    category: 'prix_paiement',
    subcategory: 'avocat',
    name_fr: 'Convention d\'Honoraires',
    name_ar: 'اتفاقية الأتعاب',
    text_fr: `Les honoraires de Maître [NOM_AVOCAT] sont fixés à [MONTANT_HONORAIRES] DA pour la présente affaire, dont [PROVISION] DA versés à titre de provision ce jour, dont quittance. Le solde sera réglé au plus tard à l'issue de la procédure. En cas de succès, un honoraire de résultat de [HONORAIRE_RESULTAT] DA sera dû.`,
    text_ar: `تُحدد أتعاب الأستاذ [NOM_AVOCAT] بـ[MONTANT_HONORAIRES] دج عن هذه القضية، منها [PROVISION] دج مدفوعة على سبيل المؤونة اليوم مع الإبراء. يُسدد الباقي في أجل أقصاه نهاية الإجراءات. في حالة النجاح، تُستحق أتعاب نتيجة قدرها [HONORAIRE_RESULTAT] دج.`,
    applicable_to: ['convention_honoraires'],
    mandatory: true,
    legal_reference: 'Loi 13-07 relative à l\'organisation de la profession d\'avocat',
    variables: ['NOM_AVOCAT', 'MONTANT_HONORAIRES', 'PROVISION', 'HONORAIRE_RESULTAT']
  },

  // ── GARANTIES ET SÛRETÉS ────────────────────────────────────────────────
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
  {
    id: 'hypotheque_conventionnelle',
    category: 'garanties',
    subcategory: 'notarial',
    name_fr: 'Hypothèque Conventionnelle',
    name_ar: 'الرهن الرسمي الاتفاقي',
    text_fr: `En garantie du remboursement du prêt de [MONTANT_PRET] DA consenti par [NOM_PRETEUR], le débiteur constitue au profit du créancier une hypothèque de premier rang sur le bien immobilier situé à [ADRESSE_BIEN], inscrit au livre foncier sous le numéro [NUMERO_TF]. Cette hypothèque est inscrite pour un montant de [MONTANT_HYPOTHEQUE] DA, en principal, intérêts et accessoires.`,
    text_ar: `ضماناً لسداد القرض البالغ [MONTANT_PRET] دج الممنوح من [NOM_PRETEUR]، يُنشئ المدين لصالح الدائن رهناً رسمياً من الدرجة الأولى على العقار الكائن في [ADRESSE_BIEN]، المقيد في الدفتر العقاري تحت رقم [NUMERO_TF]. يُقيد هذا الرهن بمبلغ [MONTANT_HYPOTHEQUE] دج، أصلاً وفوائد وملحقات.`,
    applicable_to: ['hypotheque', 'pret_immobilier'],
    mandatory: true,
    legal_reference: 'Articles 882 à 935 du Code Civil',
    variables: ['MONTANT_PRET', 'NOM_PRETEUR', 'ADRESSE_BIEN', 'NUMERO_TF', 'MONTANT_HYPOTHEQUE']
  },
  {
    id: 'cautionnement_solidaire',
    category: 'garanties',
    name_fr: 'Cautionnement Solidaire',
    name_ar: 'الكفالة التضامنية',
    text_fr: `Monsieur/Madame [NOM_CAUTION], se porte caution solidaire et indivisible du débiteur principal [NOM_DEBITEUR] envers le créancier [NOM_CREANCIER], pour le paiement de toutes sommes dues en principal, intérêts, frais et accessoires, dans la limite de [MONTANT_CAUTION] DA. La caution renonce expressément au bénéfice de discussion et de division.`,
    text_ar: `يتكفل السيد/السيدة [NOM_CAUTION] كفالة تضامنية وغير قابلة للتجزئة عن المدين الأصلي [NOM_DEBITEUR] تجاه الدائن [NOM_CREANCIER]، لدفع جميع المبالغ المستحقة أصلاً وفوائد ومصاريف وملحقات، في حدود [MONTANT_CAUTION] دج. يتنازل الكفيل صراحةً عن حق المناقشة والتقسيم.`,
    applicable_to: ['contrat_commercial', 'pret_immobilier', 'bail_commercial'],
    legal_reference: 'Articles 644 à 673 du Code Civil',
    variables: ['NOM_CAUTION', 'NOM_DEBITEUR', 'NOM_CREANCIER', 'MONTANT_CAUTION']
  },

  // ── OBLIGATIONS DES PARTIES ─────────────────────────────────────────────
  {
    id: 'obligation_delivrance',
    category: 'obligations',
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
    id: 'obligation_entretien_bailleur',
    category: 'obligations',
    name_fr: 'Obligations d\'Entretien du Bailleur',
    name_ar: 'التزامات الصيانة للمؤجر',
    text_fr: `Le bailleur s'oblige à délivrer au locataire le logement en bon état d'habitabilité et à effectuer pendant toute la durée du bail les réparations nécessaires autres que locatives, notamment les grosses réparations définies par l'article 470 du Code Civil.`,
    text_ar: `يلتزم المؤجر بتسليم المسكن للمستأجر في حالة جيدة للسكن وبإجراء طوال مدة الإيجار الإصلاحات الضرورية غير الإيجارية، لا سيما الإصلاحات الكبرى المحددة في المادة 470 من القانون المدني.`,
    applicable_to: ['bail_habitation'],
    mandatory: true,
    legal_reference: 'Articles 469-470 du Code Civil'
  },
  {
    id: 'obligation_usage_locataire',
    category: 'obligations',
    name_fr: 'Obligation d\'Usage Conforme',
    name_ar: 'التزام الاستعمال المطابق',
    text_fr: `Le locataire s'oblige à user du logement loué en bon père de famille, conformément à la destination qui lui a été donnée par le bail. Il ne pourra y apporter aucune modification sans l'accord écrit préalable du bailleur.`,
    text_ar: `يلتزم المستأجر باستعمال المسكن المؤجر كرب أسرة صالح، وفقاً للغرض الذي خصص له في عقد الإيجار. ولا يجوز له إدخال أي تعديل عليه دون موافقة كتابية مسبقة من المؤجر.`,
    applicable_to: ['bail_habitation', 'bail_commercial'],
    mandatory: true,
    legal_reference: 'Article 506 du Code Civil'
  },
  {
    id: 'periode_essai',
    category: 'obligations',
    subcategory: 'travail',
    name_fr: 'Période d\'Essai',
    name_ar: 'فترة التجربة',
    text_fr: `Le présent contrat est soumis à une période d'essai de [DUREE_ESSAI] mois, durant laquelle chacune des parties peut y mettre fin sans préavis ni indemnité. À l'issue de cette période, si aucune des parties n'a manifesté sa volonté d'y mettre fin, le contrat sera définitivement confirmé.`,
    text_ar: `يخضع هذا العقد لفترة تجربة مدتها [DUREE_ESSAI] أشهر، يمكن لأي من الطرفين خلالها إنهاؤه دون إشعار مسبق أو تعويض. عند انتهاء هذه الفترة، إذا لم يُعبّر أي من الطرفين عن رغبته في إنهائه، يُعتبر العقد مؤكداً نهائياً.`,
    applicable_to: ['contrat_travail_cdi', 'contrat_travail_cdd'],
    mandatory: false,
    legal_reference: 'Article 17 de la Loi 90-11',
    variables: ['DUREE_ESSAI']
  },
  {
    id: 'obligation_fidelite_salarie',
    category: 'obligations',
    subcategory: 'travail',
    name_fr: 'Obligation de Fidélité et Discrétion',
    name_ar: 'التزام الولاء والتحفظ',
    text_fr: `Le salarié s'engage à consacrer l'intégralité de son activité professionnelle à l'employeur, à ne pas exercer d'activité concurrente pendant la durée du contrat, et à observer la plus stricte discrétion sur toutes les informations confidentielles dont il aurait connaissance dans l'exercice de ses fonctions.`,
    text_ar: `يلتزم العامل بتكريس كامل نشاطه المهني لصاحب العمل، وعدم ممارسة أي نشاط منافس طوال مدة العقد، والحفاظ على السرية التامة بشأن جميع المعلومات السرية التي يطلع عليها في إطار مهامه.`,
    applicable_to: ['contrat_travail_cdi', 'contrat_travail_cdd'],
    mandatory: false,
    legal_reference: 'Article 7 de la Loi 90-11'
  },

  // ── DROIT DU TRAVAIL (Loi 90-11) ────────────────────────────────────────
  {
    id: 'conge_annuel',
    category: 'travail',
    name_fr: 'Congé Annuel',
    name_ar: 'العطلة السنوية',
    text_fr: `Le salarié bénéficiera d'un congé annuel payé de [NOMBRE_JOURS_CONGE] jours ouvrables par an, conformément aux dispositions de la Loi 90-11. Les dates de congé seront fixées d'un commun accord entre l'employeur et le salarié, en tenant compte des nécessités du service.`,
    text_ar: `يستفيد العامل من عطلة سنوية مدفوعة الأجر مدتها [NOMBRE_JOURS_CONGE] يوم عمل في السنة، وفقاً لأحكام القانون 90-11. تُحدد مواعيد العطلة باتفاق مشترك بين صاحب العمل والعامل، مع مراعاة متطلبات العمل.`,
    applicable_to: ['contrat_travail_cdi', 'contrat_travail_cdd'],
    mandatory: true,
    legal_reference: 'Articles 26 à 30 de la Loi 90-11',
    variables: ['NOMBRE_JOURS_CONGE']
  },
  {
    id: 'preavis_licenciement',
    category: 'travail',
    name_fr: 'Préavis de Licenciement',
    name_ar: 'مهلة الإخطار عند الفصل',
    text_fr: `En cas de rupture du contrat à l'initiative de l'employeur pour motif valable, un préavis de [DUREE_PREAVIS] mois sera observé, sauf en cas de faute grave. En cas de démission, le salarié est tenu d'observer un préavis de [DUREE_PREAVIS_DEMISSION] mois. L'indemnité de licenciement sera calculée conformément à l'article 73 de la Loi 90-11.`,
    text_ar: `في حالة فسخ العقد بمبادرة من صاحب العمل لسبب مشروع، تُراعى مهلة إخطار مدتها [DUREE_PREAVIS] أشهر، إلا في حالة الخطأ الجسيم. في حالة الاستقالة، يلتزم العامل بمهلة إخطار مدتها [DUREE_PREAVIS_DEMISSION] أشهر. تُحسب تعويضات الفصل وفقاً للمادة 73 من القانون 90-11.`,
    applicable_to: ['contrat_travail_cdi'],
    mandatory: false,
    legal_reference: 'Articles 73 et 74 de la Loi 90-11',
    variables: ['DUREE_PREAVIS', 'DUREE_PREAVIS_DEMISSION']
  },
  {
    id: 'certificat_travail',
    category: 'travail',
    name_fr: 'Certificat de Travail',
    name_ar: 'شهادة العمل',
    text_fr: `Je soussigné [NOM_EMPLOYEUR], [QUALITE_EMPLOYEUR] de [NOM_ENTREPRISE], certifie que Monsieur/Madame [NOM_SALARIE] [PRENOM_SALARIE], a été employé(e) dans notre établissement du [DATE_DEBUT] au [DATE_FIN], en qualité de [POSTE]. Ce certificat lui est délivré pour servir et valoir ce que de droit.`,
    text_ar: `أنا الموقع أدناه [NOM_EMPLOYEUR]، [QUALITE_EMPLOYEUR] لـ[NOM_ENTREPRISE]، أشهد بأن السيد/السيدة [NOM_SALARIE] [PRENOM_SALARIE]، كان(ت) موظفاً(ة) في مؤسستنا من [DATE_DEBUT] إلى [DATE_FIN]، بصفة [POSTE]. سُلّمت له/لها هذه الشهادة لتُقدَّم حيثما يلزم.`,
    applicable_to: ['certificat_travail'],
    mandatory: true,
    legal_reference: 'Article 68 de la Loi 90-11',
    variables: ['NOM_EMPLOYEUR', 'QUALITE_EMPLOYEUR', 'NOM_ENTREPRISE', 'NOM_SALARIE', 'PRENOM_SALARIE', 'DATE_DEBUT', 'DATE_FIN', 'POSTE']
  },
  {
    id: 'reglement_interieur',
    category: 'travail',
    name_fr: 'Référence au Règlement Intérieur',
    name_ar: 'الإحالة إلى النظام الداخلي',
    text_fr: `Le salarié déclare avoir pris connaissance du règlement intérieur de [NOM_ENTREPRISE] et s'engage à le respecter en toutes ses dispositions. Un exemplaire du règlement intérieur lui a été remis ce jour, dont il reconnaît la réception.`,
    text_ar: `يُقر العامل بأنه اطلع على النظام الداخلي لـ[NOM_ENTREPRISE] ويلتزم باحترام جميع أحكامه. سُلّم له نسخة من النظام الداخلي اليوم، ويُقر باستلامها.`,
    applicable_to: ['contrat_travail_cdi', 'contrat_travail_cdd'],
    mandatory: false,
    legal_reference: 'Article 73 de la Loi 90-11',
    variables: ['NOM_ENTREPRISE']
  },

  // ── DROIT DES SOCIÉTÉS ──────────────────────────────────────────────────
  {
    id: 'constitution_sarl',
    category: 'societe',
    name_fr: 'Constitution SARL — Objet Social',
    name_ar: 'تأسيس ش.ذ.م.م — الغرض الاجتماعي',
    text_fr: `La société a pour objet : [OBJET_SOCIAL]. Et généralement, toutes opérations industrielles, commerciales, financières, mobilières et immobilières se rattachant directement ou indirectement à l'objet social ou susceptibles d'en faciliter l'extension ou le développement.`,
    text_ar: `غرض الشركة: [OBJET_SOCIAL]. وبصفة عامة، جميع العمليات الصناعية والتجارية والمالية والمنقولة والعقارية المرتبطة مباشرة أو غير مباشرة بالغرض الاجتماعي أو التي من شأنها تسهيل توسعه أو تطويره.`,
    applicable_to: ['statuts_sarl', 'constitution_societe'],
    mandatory: true,
    legal_reference: 'Articles 564 à 589 du Code de Commerce',
    variables: ['OBJET_SOCIAL']
  },
  {
    id: 'capital_social_sarl',
    category: 'societe',
    name_fr: 'Capital Social SARL',
    name_ar: 'رأس المال الاجتماعي ش.ذ.م.م',
    text_fr: `Le capital social est fixé à [MONTANT_CAPITAL] Dinars Algériens ([CAPITAL_LETTRES]), divisé en [NOMBRE_PARTS] parts sociales de [VALEUR_PART] DA chacune, entièrement souscrites et libérées, réparties entre les associés comme suit : [REPARTITION_PARTS].`,
    text_ar: `يُحدد رأس المال الاجتماعي بـ[MONTANT_CAPITAL] دينار جزائري ([CAPITAL_LETTRES])، مقسماً إلى [NOMBRE_PARTS] حصة اجتماعية بقيمة [VALEUR_PART] دج لكل حصة، مكتتبة ومحررة بالكامل، موزعة بين الشركاء على النحو التالي: [REPARTITION_PARTS].`,
    applicable_to: ['statuts_sarl', 'constitution_societe'],
    mandatory: true,
    legal_reference: 'Article 566 du Code de Commerce',
    variables: ['MONTANT_CAPITAL', 'CAPITAL_LETTRES', 'NOMBRE_PARTS', 'VALEUR_PART', 'REPARTITION_PARTS']
  },
  {
    id: 'gerance_sarl',
    category: 'societe',
    name_fr: 'Gérance de la SARL',
    name_ar: 'إدارة ش.ذ.م.م',
    text_fr: `La société est gérée par Monsieur/Madame [NOM_GERANT], associé(e), nommé(e) gérant(e) pour une durée [DUREE_MANDAT], avec les pouvoirs les plus étendus pour agir en toutes circonstances au nom de la société, dans la limite de l'objet social. Le gérant représente la société vis-à-vis des tiers et en justice.`,
    text_ar: `تُدار الشركة من قِبل السيد/السيدة [NOM_GERANT]، الشريك(ة)، المعيّن(ة) مديراً(ة) لمدة [DUREE_MANDAT]، بأوسع الصلاحيات للتصرف في جميع الظروف باسم الشركة، في حدود الغرض الاجتماعي. يمثل المدير الشركة أمام الغير وأمام القضاء.`,
    applicable_to: ['statuts_sarl', 'constitution_societe'],
    mandatory: true,
    legal_reference: 'Articles 577 à 583 du Code de Commerce',
    variables: ['NOM_GERANT', 'DUREE_MANDAT']
  },
  {
    id: 'cession_parts_sociales',
    category: 'societe',
    name_fr: 'Cession de Parts Sociales',
    name_ar: 'التنازل عن الحصص الاجتماعية',
    text_fr: `Monsieur/Madame [NOM_CEDANT] cède et transporte à Monsieur/Madame [NOM_CESSIONNAIRE], qui accepte, [NOMBRE_PARTS_CEDEES] parts sociales de la société [NOM_SOCIETE], numérotées de [NUMERO_DEBUT] à [NUMERO_FIN], au prix global de [PRIX_CESSION] DA, dont quittance. Cette cession est soumise à l'agrément des associés conformément aux statuts.`,
    text_ar: `يتنازل السيد/السيدة [NOM_CEDANT] ويحول للسيد/السيدة [NOM_CESSIONNAIRE] الذي يقبل، عن [NOMBRE_PARTS_CEDEES] حصة اجتماعية في شركة [NOM_SOCIETE]، مرقمة من [NUMERO_DEBUT] إلى [NUMERO_FIN]، بثمن إجمالي قدره [PRIX_CESSION] دج مع الإبراء. يخضع هذا التنازل لموافقة الشركاء وفقاً للنظام الأساسي.`,
    applicable_to: ['cession_parts', 'statuts_sarl'],
    mandatory: false,
    legal_reference: 'Article 571 du Code de Commerce',
    variables: ['NOM_CEDANT', 'NOM_CESSIONNAIRE', 'NOMBRE_PARTS_CEDEES', 'NOM_SOCIETE', 'NUMERO_DEBUT', 'NUMERO_FIN', 'PRIX_CESSION']
  },

  // ── ACTES NOTARIAUX ─────────────────────────────────────────────────────
  {
    id: 'preambule_acte_notarial',
    category: 'notarial',
    name_fr: 'Préambule Acte Notarial',
    name_ar: 'ديباجة العقد الرسمي',
    text_fr: `L'an [ANNEE], le [JOUR] du mois de [MOIS], par-devant Maître [NOM_NOTAIRE], Notaire à [VILLE_NOTAIRE], ont comparu les parties ci-après désignées, lesquelles ont requis le notaire soussigné de recevoir le présent acte authentique dont la teneur suit.`,
    text_ar: `في سنة [ANNEE]، يوم [JOUR] من شهر [MOIS]، أمام الأستاذ [NOM_NOTAIRE]، موثق في [VILLE_NOTAIRE]، مثل الأطراف المعيّنون فيما يلي، الذين طلبوا من الموثق الموقع أدناه تلقي هذا العقد الرسمي الذي مضمونه ما يلي.`,
    applicable_to: ['acte_vente_immobiliere', 'donation', 'testament', 'constitution_societe', 'hypotheque'],
    mandatory: true,
    variables: ['ANNEE', 'JOUR', 'MOIS', 'NOM_NOTAIRE', 'VILLE_NOTAIRE']
  },
  {
    id: 'testament_wasiya',
    category: 'notarial',
    subcategory: 'succession',
    name_fr: 'Testament (Wasiya)',
    name_ar: 'الوصية',
    text_fr: `Je soussigné(e) [NOM_TESTATEUR], sain(e) de corps et d'esprit, déclare faire les dispositions testamentaires suivantes, conformément aux articles 184 à 201 du Code de la Famille : Je lègue à [NOM_LEGATAIRE], [LIEN_PARENTE], la quotité disponible de mes biens, soit [QUOTITE] de ma succession, consistant en [DESCRIPTION_BIENS]. Cette disposition ne pourra excéder le tiers de mes biens.`,
    text_ar: `أنا الموقع أدناه [NOM_TESTATEUR]، سليم العقل والجسم، أُعلن عن الوصايا التالية، وفقاً للمواد من 184 إلى 201 من قانون الأسرة: أوصي لـ[NOM_LEGATAIRE]، [LIEN_PARENTE]، بالجزء المتاح من أموالي، أي [QUOTITE] من تركتي، المتمثلة في [DESCRIPTION_BIENS]. لا يمكن أن تتجاوز هذه الوصية ثلث أموالي.`,
    applicable_to: ['testament'],
    mandatory: false,
    legal_reference: 'Articles 184 à 201 du Code de la Famille',
    variables: ['NOM_TESTATEUR', 'NOM_LEGATAIRE', 'LIEN_PARENTE', 'QUOTITE', 'DESCRIPTION_BIENS']
  },
  {
    id: 'procuration_notariale',
    category: 'notarial',
    name_fr: 'Procuration Notariale',
    name_ar: 'التوكيل الرسمي',
    text_fr: `Je soussigné(e) [NOM_MANDANT], donne par les présentes procuration à Monsieur/Madame [NOM_MANDATAIRE], pour me représenter et agir en mon nom pour : [OBJET_PROCURATION]. Le mandataire aura tous pouvoirs pour accomplir tous actes nécessaires à l'exécution du présent mandat, y compris signer tous documents et percevoir toutes sommes. La présente procuration est valable jusqu'au [DATE_EXPIRATION].`,
    text_ar: `أنا الموقع أدناه [NOM_MANDANT]، أُفوّض بموجب هذا التوكيل السيد/السيدة [NOM_MANDATAIRE]، لتمثيلي والتصرف باسمي من أجل: [OBJET_PROCURATION]. يملك الوكيل جميع الصلاحيات لإنجاز جميع الأعمال اللازمة لتنفيذ هذا التوكيل، بما في ذلك التوقيع على جميع الوثائق وتحصيل جميع المبالغ. هذا التوكيل صالح حتى [DATE_EXPIRATION].`,
    applicable_to: ['procuration'],
    mandatory: true,
    legal_reference: 'Articles 571 à 605 du Code Civil',
    variables: ['NOM_MANDANT', 'NOM_MANDATAIRE', 'OBJET_PROCURATION', 'DATE_EXPIRATION']
  },
  {
    id: 'partage_succession',
    category: 'notarial',
    subcategory: 'succession',
    name_fr: 'Acte de Partage Successoral',
    name_ar: 'عقد قسمة التركة',
    text_fr: `Les héritiers de feu [NOM_DEFUNT], décédé le [DATE_DECES] à [LIEU_DECES], à savoir : [LISTE_HERITIERS], ont procédé au partage amiable de la succession comprenant les biens suivants : [DESCRIPTION_BIENS_SUCCESSION]. Chaque héritier reçoit en pleine propriété les biens qui lui sont attribués conformément au tableau de répartition annexé.`,
    text_ar: `قام ورثة المرحوم [NOM_DEFUNT]، المتوفى بتاريخ [DATE_DECES] في [LIEU_DECES]، وهم: [LISTE_HERITIERS]، بالقسمة الودية للتركة المشتملة على الأموال التالية: [DESCRIPTION_BIENS_SUCCESSION]. يتسلم كل وارث بالملكية التامة الأموال المخصصة له وفقاً لجدول التوزيع المرفق.`,
    applicable_to: ['partage_succession'],
    mandatory: true,
    legal_reference: 'Articles 163 à 183 du Code de la Famille',
    variables: ['NOM_DEFUNT', 'DATE_DECES', 'LIEU_DECES', 'LISTE_HERITIERS', 'DESCRIPTION_BIENS_SUCCESSION']
  },
  {
    id: 'pret_immobilier',
    category: 'notarial',
    name_fr: 'Contrat de Prêt Immobilier',
    name_ar: 'عقد القرض العقاري',
    text_fr: `[NOM_PRETEUR] consent à [NOM_EMPRUNTEUR] un prêt immobilier d'un montant de [MONTANT_PRET] DA, remboursable en [NOMBRE_ECHEANCES] mensualités de [MONTANT_MENSUALITE] DA, au taux d'intérêt annuel de [TAUX_INTERET]%, à compter du [DATE_DEBUT_REMBOURSEMENT]. Ce prêt est garanti par une hypothèque de premier rang sur le bien immobilier situé à [ADRESSE_BIEN].`,
    text_ar: `يمنح [NOM_PRETEUR] لـ[NOM_EMPRUNTEUR] قرضاً عقارياً بمبلغ [MONTANT_PRET] دج، يُسدد على [NOMBRE_ECHEANCES] قسطاً شهرياً بقيمة [MONTANT_MENSUALITE] دج، بمعدل فائدة سنوي قدره [TAUX_INTERET]%، ابتداءً من [DATE_DEBUT_REMBOURSEMENT]. يُضمن هذا القرض برهن رسمي من الدرجة الأولى على العقار الكائن في [ADRESSE_BIEN].`,
    applicable_to: ['pret_immobilier'],
    mandatory: true,
    legal_reference: 'Articles 450 à 463 du Code Civil',
    variables: ['NOM_PRETEUR', 'NOM_EMPRUNTEUR', 'MONTANT_PRET', 'NOMBRE_ECHEANCES', 'MONTANT_MENSUALITE', 'TAUX_INTERET', 'DATE_DEBUT_REMBOURSEMENT', 'ADRESSE_BIEN']
  },

  // ── ACTES D'HUISSIER ────────────────────────────────────────────────────
  {
    id: 'constat_huissier',
    category: 'huissier',
    name_fr: 'Procès-Verbal de Constat',
    name_ar: 'محضر معاينة',
    text_fr: `L'an [ANNEE], le [DATE_CONSTAT] à [HEURE_CONSTAT], à la requête de [NOM_REQUERANT], Maître [NOM_HUISSIER], Huissier de Justice, s'est transporté à [ADRESSE_CONSTAT] et a constaté ce qui suit : [DESCRIPTION_CONSTAT]. Le présent constat a été dressé en présence de [TEMOINS] et signé par toutes les parties présentes.`,
    text_ar: `في سنة [ANNEE]، بتاريخ [DATE_CONSTAT] الساعة [HEURE_CONSTAT]، بناءً على طلب [NOM_REQUERANT]، انتقل الأستاذ [NOM_HUISSIER]، المحضر القضائي، إلى [ADRESSE_CONSTAT] وعاين ما يلي: [DESCRIPTION_CONSTAT]. حُرر هذا المحضر بحضور [TEMOINS] ووقّع عليه جميع الحاضرون.`,
    applicable_to: ['constat'],
    mandatory: true,
    variables: ['ANNEE', 'DATE_CONSTAT', 'HEURE_CONSTAT', 'NOM_REQUERANT', 'NOM_HUISSIER', 'ADRESSE_CONSTAT', 'DESCRIPTION_CONSTAT', 'TEMOINS']
  },
  {
    id: 'signification_jugement',
    category: 'huissier',
    name_fr: 'Signification de Jugement',
    name_ar: 'تبليغ حكم قضائي',
    text_fr: `L'an [ANNEE], le [DATE_SIGNIFICATION], à la requête de [NOM_REQUERANT], Maître [NOM_HUISSIER], Huissier de Justice, a signifié à Monsieur/Madame [NOM_SIGNIFIE], demeurant à [ADRESSE_SIGNIFIE], le jugement rendu le [DATE_JUGEMENT] par [JURIDICTION], sous le numéro [NUMERO_JUGEMENT], dont copie certifiée conforme est annexée au présent acte. Délai d'appel : [DELAI_APPEL] jours à compter de la présente signification.`,
    text_ar: `في سنة [ANNEE]، بتاريخ [DATE_SIGNIFICATION]، بناءً على طلب [NOM_REQUERANT]، بلّغ الأستاذ [NOM_HUISSIER]، المحضر القضائي، السيد/السيدة [NOM_SIGNIFIE]، الساكن(ة) في [ADRESSE_SIGNIFIE]، الحكم الصادر بتاريخ [DATE_JUGEMENT] عن [JURIDICTION]، تحت رقم [NUMERO_JUGEMENT]، المرفقة نسخة مطابقة للأصل منه بهذا المحضر. أجل الاستئناف: [DELAI_APPEL] يوماً من تاريخ هذا التبليغ.`,
    applicable_to: ['signification'],
    mandatory: true,
    legal_reference: 'Articles 406 à 420 du CPCA',
    variables: ['ANNEE', 'DATE_SIGNIFICATION', 'NOM_REQUERANT', 'NOM_HUISSIER', 'NOM_SIGNIFIE', 'ADRESSE_SIGNIFIE', 'DATE_JUGEMENT', 'JURIDICTION', 'NUMERO_JUGEMENT', 'DELAI_APPEL']
  },
  {
    id: 'commandement_payer',
    category: 'huissier',
    name_fr: 'Commandement de Payer',
    name_ar: 'أمر بالدفع',
    text_fr: `L'an [ANNEE], le [DATE_COMMANDEMENT], à la requête de [NOM_CREANCIER], Maître [NOM_HUISSIER], Huissier de Justice, a fait commandement à Monsieur/Madame [NOM_DEBITEUR], demeurant à [ADRESSE_DEBITEUR], de payer dans un délai de [DELAI_PAIEMENT] jours la somme de [MONTANT_DU] DA ([MONTANT_LETTRES]), en vertu de [TITRE_EXECUTOIRE], sous peine de saisie de ses biens.`,
    text_ar: `في سنة [ANNEE]، بتاريخ [DATE_COMMANDEMENT]، بناءً على طلب [NOM_CREANCIER]، أنذر الأستاذ [NOM_HUISSIER]، المحضر القضائي، السيد/السيدة [NOM_DEBITEUR]، الساكن(ة) في [ADRESSE_DEBITEUR]، بدفع مبلغ [MONTANT_DU] دج ([MONTANT_LETTRES]) في أجل [DELAI_PAIEMENT] يوماً، بموجب [TITRE_EXECUTOIRE]، وإلا تعرض للحجز على أمواله.`,
    applicable_to: ['commandement'],
    mandatory: true,
    legal_reference: 'Articles 600 à 620 du CPCA',
    variables: ['ANNEE', 'DATE_COMMANDEMENT', 'NOM_CREANCIER', 'NOM_HUISSIER', 'NOM_DEBITEUR', 'ADRESSE_DEBITEUR', 'DELAI_PAIEMENT', 'MONTANT_DU', 'MONTANT_LETTRES', 'TITRE_EXECUTOIRE']
  },
  {
    id: 'pv_saisie_arret',
    category: 'huissier',
    name_fr: 'Procès-Verbal de Saisie-Arrêt',
    name_ar: 'محضر الحجز لدى الغير',
    text_fr: `L'an [ANNEE], le [DATE_SAISIE], à la requête de [NOM_SAISISSANT], créancier de [NOM_DEBITEUR] pour la somme de [MONTANT_CREANCE] DA, Maître [NOM_HUISSIER], Huissier de Justice, a procédé à une saisie-arrêt entre les mains de [NOM_TIERS_SAISI], tiers saisi, demeurant à [ADRESSE_TIERS], sur toutes sommes et valeurs que ce dernier peut devoir au débiteur.`,
    text_ar: `في سنة [ANNEE]، بتاريخ [DATE_SAISIE]، بناءً على طلب [NOM_SAISISSANT]، دائن [NOM_DEBITEUR] بمبلغ [MONTANT_CREANCE] دج، أجرى الأستاذ [NOM_HUISSIER]، المحضر القضائي، حجزاً لدى الغير بين يدي [NOM_TIERS_SAISI]، المحجوز لديه، الساكن في [ADRESSE_TIERS]، على جميع المبالغ والقيم التي قد يكون مديناً بها للمدين.`,
    applicable_to: ['pv_saisie'],
    mandatory: true,
    legal_reference: 'Articles 645 à 680 du CPCA',
    variables: ['ANNEE', 'DATE_SAISIE', 'NOM_SAISISSANT', 'NOM_DEBITEUR', 'MONTANT_CREANCE', 'NOM_HUISSIER', 'NOM_TIERS_SAISI', 'ADRESSE_TIERS']
  },
  {
    id: 'constat_etat_lieux',
    category: 'huissier',
    name_fr: 'Constat d\'État des Lieux',
    name_ar: 'محضر معاينة حالة المحل',
    text_fr: `À la requête de [NOM_REQUERANT], Maître [NOM_HUISSIER], Huissier de Justice, s'est transporté le [DATE_CONSTAT] au [ADRESSE_BIEN] et a procédé à la description détaillée de l'état des lieux : [DESCRIPTION_ETAT_LIEUX]. Le présent constat vaut état des lieux contradictoire entre les parties.`,
    text_ar: `بناءً على طلب [NOM_REQUERANT]، انتقل الأستاذ [NOM_HUISSIER]، المحضر القضائي، بتاريخ [DATE_CONSTAT] إلى [ADRESSE_BIEN] وأجرى وصفاً تفصيلياً لحالة المحل: [DESCRIPTION_ETAT_LIEUX]. يُعدّ هذا المحضر معاينة تناقضية لحالة المحل بين الطرفين.`,
    applicable_to: ['constat', 'bail_habitation', 'bail_commercial'],
    mandatory: false,
    variables: ['NOM_REQUERANT', 'NOM_HUISSIER', 'DATE_CONSTAT', 'ADRESSE_BIEN', 'DESCRIPTION_ETAT_LIEUX']
  },

  // ── ACTES D'AVOCAT ──────────────────────────────────────────────────────
  {
    id: 'mise_en_demeure',
    category: 'avocat',
    name_fr: 'Mise en Demeure',
    name_ar: 'إنذار رسمي',
    text_fr: `Par la présente lettre recommandée avec accusé de réception, Maître [NOM_AVOCAT], agissant au nom et pour le compte de [NOM_CLIENT], met en demeure Monsieur/Madame [NOM_DESTINATAIRE] de [OBJET_MISE_EN_DEMEURE] dans un délai de [DELAI] jours à compter de la réception des présentes. À défaut, mon client se verra contraint d'engager toutes procédures judiciaires utiles à la défense de ses droits, sans autre avertissement.`,
    text_ar: `بموجب هذه الرسالة المضمونة مع الإشعار بالاستلام، يُنذر الأستاذ [NOM_AVOCAT]، المتصرف باسم ولحساب [NOM_CLIENT]، السيد/السيدة [NOM_DESTINATAIRE] بـ[OBJET_MISE_EN_DEMEURE] في أجل [DELAI] يوماً من تاريخ استلام هذا الإنذار. وإلا، سيُضطر موكلي إلى اتخاذ جميع الإجراءات القضائية اللازمة للدفاع عن حقوقه، دون أي إنذار آخر.`,
    applicable_to: ['mise_en_demeure'],
    mandatory: true,
    variables: ['NOM_AVOCAT', 'NOM_CLIENT', 'NOM_DESTINATAIRE', 'OBJET_MISE_EN_DEMEURE', 'DELAI']
  },
  {
    id: 'requete_introductive',
    category: 'avocat',
    name_fr: 'Requête Introductive d\'Instance',
    name_ar: 'عريضة افتتاح الدعوى',
    text_fr: `À Monsieur/Madame le Président du [JURIDICTION],\n\nMaître [NOM_AVOCAT], Avocat au Barreau de [BARREAU], agissant au nom et pour le compte de [NOM_DEMANDEUR], a l'honneur de vous exposer ce qui suit :\n\nFAITS : [EXPOSE_FAITS]\n\nEN DROIT : [MOYENS_DROIT]\n\nPAR CES MOTIFS, il est demandé au Tribunal de bien vouloir : [DEMANDES]. Sous toutes réserves de droit.`,
    text_ar: `إلى السيد/السيدة رئيس [JURIDICTION]،\n\nالأستاذ [NOM_AVOCAT]، محامٍ في هيئة محامي [BARREAU]، المتصرف باسم ولحساب [NOM_DEMANDEUR]، يشرف بعرض ما يلي:\n\nالوقائع: [EXPOSE_FAITS]\n\nمن الناحية القانونية: [MOYENS_DROIT]\n\nلهذه الأسباب، يُطلب من المحكمة التفضل بـ: [DEMANDES]. مع التحفظ على جميع الحقوق.`,
    applicable_to: ['requete'],
    mandatory: true,
    legal_reference: 'Articles 13 à 25 du CPCA',
    variables: ['JURIDICTION', 'NOM_AVOCAT', 'BARREAU', 'NOM_DEMANDEUR', 'EXPOSE_FAITS', 'MOYENS_DROIT', 'DEMANDES']
  },
  {
    id: 'conclusions_fond',
    category: 'avocat',
    name_fr: 'Conclusions au Fond',
    name_ar: 'مذكرة في الموضوع',
    text_fr: `Pour [NOM_PARTIE], représenté(e) par Maître [NOM_AVOCAT],\n\nPLAISE AU TRIBUNAL :\n\nVu les pièces versées aux débats,\nVu les articles [ARTICLES_LOI],\n\nDire et juger que [PRETENTIONS_PRINCIPALES].\nCondamner [NOM_ADVERSE] à payer à [NOM_PARTIE] la somme de [MONTANT_DEMANDE] DA à titre de [NATURE_DEMANDE].\nCondamner [NOM_ADVERSE] aux entiers dépens.`,
    text_ar: `لصالح [NOM_PARTIE]، الممثل(ة) من قِبل الأستاذ [NOM_AVOCAT]،\n\nيُرجى من المحكمة:\n\nبالنظر إلى الوثائق المقدمة في المناقشات،\nبالنظر إلى المواد [ARTICLES_LOI]،\n\nالتصريح بأن [PRETENTIONS_PRINCIPALES].\nإلزام [NOM_ADVERSE] بدفع مبلغ [MONTANT_DEMANDE] دج لـ[NOM_PARTIE] على سبيل [NATURE_DEMANDE].\nإلزام [NOM_ADVERSE] بجميع المصاريف القضائية.`,
    applicable_to: ['conclusions'],
    mandatory: false,
    variables: ['NOM_PARTIE', 'NOM_AVOCAT', 'ARTICLES_LOI', 'PRETENTIONS_PRINCIPALES', 'NOM_ADVERSE', 'MONTANT_DEMANDE', 'NATURE_DEMANDE']
  },
  {
    id: 'requete_refere',
    category: 'avocat',
    name_fr: 'Requête en Référé',
    name_ar: 'طلب استعجالي',
    text_fr: `À Monsieur/Madame le Président du [JURIDICTION], statuant en matière de référé,\n\nMaître [NOM_AVOCAT] expose qu'il y a urgence à ce que le Tribunal ordonne [MESURE_DEMANDEE], en raison de [MOTIF_URGENCE]. Cette mesure est justifiée par l'existence d'un trouble manifestement illicite / d'un dommage imminent consistant en [DESCRIPTION_TROUBLE]. Il est demandé de statuer en urgence.`,
    text_ar: `إلى السيد/السيدة رئيس [JURIDICTION]، الفاصل في المسائل الاستعجالية،\n\nيعرض الأستاذ [NOM_AVOCAT] أنه يوجد استعجال لأن يأمر القضاء بـ[MESURE_DEMANDEE]، بسبب [MOTIF_URGENCE]. هذا الإجراء مبرر بوجود اضطراب صريح غير مشروع / ضرر وشيك يتمثل في [DESCRIPTION_TROUBLE]. يُطلب الفصل باستعجال.`,
    applicable_to: ['requete_refere'],
    mandatory: false,
    legal_reference: 'Articles 299 à 310 du CPCA',
    variables: ['JURIDICTION', 'NOM_AVOCAT', 'MESURE_DEMANDEE', 'MOTIF_URGENCE', 'DESCRIPTION_TROUBLE']
  },
  {
    id: 'appel_jugement',
    category: 'avocat',
    name_fr: 'Déclaration d\'Appel',
    name_ar: 'تصريح بالاستئناف',
    text_fr: `Maître [NOM_AVOCAT], agissant au nom de [NOM_APPELANT], déclare interjeter appel du jugement rendu le [DATE_JUGEMENT] par [JURIDICTION_PREMIER_DEGRE], sous le numéro [NUMERO_JUGEMENT], qui a [DISPOSITIF_JUGEMENT]. L'appel est formé dans le délai légal de [DELAI_APPEL] jours. Les moyens d'appel seront développés dans les conclusions à venir.`,
    text_ar: `يُعلن الأستاذ [NOM_AVOCAT]، المتصرف باسم [NOM_APPELANT]، استئنافه للحكم الصادر بتاريخ [DATE_JUGEMENT] عن [JURIDICTION_PREMIER_DEGRE]، تحت رقم [NUMERO_JUGEMENT]، الذي قضى بـ[DISPOSITIF_JUGEMENT]. يُقدَّم الاستئناف في الأجل القانوني البالغ [DELAI_APPEL] يوماً. ستُطرح أسباب الاستئناف في المذكرات اللاحقة.`,
    applicable_to: ['appel'],
    mandatory: true,
    legal_reference: 'Articles 323 à 340 du CPCA',
    variables: ['NOM_AVOCAT', 'NOM_APPELANT', 'DATE_JUGEMENT', 'JURIDICTION_PREMIER_DEGRE', 'NUMERO_JUGEMENT', 'DISPOSITIF_JUGEMENT', 'DELAI_APPEL']
  },

  // ── DROIT DE LA FAMILLE ─────────────────────────────────────────────────
  {
    id: 'mariage_regime_legal',
    category: 'famille',
    name_fr: 'Régime Matrimonial',
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
    name_fr: 'Garde des Enfants',
    name_ar: 'حضانة الأطفال',
    text_fr: `La garde des enfants mineurs [NOMS_ENFANTS] est confiée à [PARENT_GARDIEN], conformément aux dispositions des articles 62 à 72 du Code de la Famille. Le parent non gardien bénéficie d'un droit de visite et d'hébergement à exercer [MODALITES_VISITE].`,
    text_ar: `تسند حضانة الأطفال القصر [NOMS_ENFANTS] إلى [PARENT_GARDIEN]، طبقاً لأحكام المواد من 62 إلى 72 من قانون الأسرة. يستفيد الوالد غير الحاضن من حق الزيارة والإيواء يمارس [MODALITES_VISITE].`,
    applicable_to: ['requete_garde_enfants', 'jugement_divorce'],
    mandatory: true,
    legal_reference: 'Articles 62 à 72 du Code de la Famille',
    variables: ['NOMS_ENFANTS', 'PARENT_GARDIEN', 'MODALITES_VISITE']
  },
  {
    id: 'divorce_khol',
    category: 'famille',
    name_fr: 'Divorce par Khol\'',
    name_ar: 'الطلاق بالخلع',
    text_fr: `L'épouse [NOM_EPOUSE] demande le divorce par khol' de son époux [NOM_EPOUX], en contrepartie du remboursement de la totalité de la dot reçue, soit la somme de [MONTANT_MAHR] DA. Les époux déclarent n'avoir aucune réclamation l'un envers l'autre, sous réserve des droits des enfants.`,
    text_ar: `تطلب الزوجة [NOM_EPOUSE] الطلاق بالخلع من زوجها [NOM_EPOUX]، مقابل رد جميع المهر المستلم، أي مبلغ [MONTANT_MAHR] دج. يُقر الزوجان بعدم وجود أي مطالبة بينهما، مع التحفظ على حقوق الأطفال.`,
    applicable_to: ['divorce_khol'],
    mandatory: false,
    legal_reference: 'Article 54 du Code de la Famille',
    variables: ['NOM_EPOUSE', 'NOM_EPOUX', 'MONTANT_MAHR']
  },
  {
    id: 'kafala',
    category: 'famille',
    name_fr: 'Kafala (Recueil Légal)',
    name_ar: 'الكفالة',
    text_fr: `Monsieur/Madame [NOM_KAFIL], demeurant à [ADRESSE_KAFIL], s'engage à prendre en charge l'enfant [NOM_ENFANT], né(e) le [DATE_NAISSANCE_ENFANT], à assurer son entretien, son éducation et sa protection, conformément aux dispositions des articles 116 à 125 du Code de la Famille algérien.`,
    text_ar: `يلتزم السيد/السيدة [NOM_KAFIL]، الساكن(ة) في [ADRESSE_KAFIL]، بكفالة الطفل [NOM_ENFANT]، المولود(ة) بتاريخ [DATE_NAISSANCE_ENFANT]، وضمان إعالته وتربيته وحمايته، وفقاً لأحكام المواد من 116 إلى 125 من قانون الأسرة الجزائري.`,
    applicable_to: ['kafala'],
    mandatory: true,
    legal_reference: 'Articles 116 à 125 du Code de la Famille',
    variables: ['NOM_KAFIL', 'ADRESSE_KAFIL', 'NOM_ENFANT', 'DATE_NAISSANCE_ENFANT']
  },

  // ── CLAUSES COMMERCIALES ────────────────────────────────────────────────
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
  },
  {
    id: 'renouvellement_bail_commercial',
    category: 'commercial',
    name_fr: 'Renouvellement Bail Commercial',
    name_ar: 'تجديد الإيجار التجاري',
    text_fr: `À l'expiration du bail, le preneur bénéficie d'un droit au renouvellement conformément aux articles 169 et suivants du Code de Commerce. Le bailleur qui entend s'opposer au renouvellement doit notifier son refus au preneur par acte d'huissier au moins [DELAI_CONGE] mois avant l'expiration du bail, sous peine de devoir verser une indemnité d'éviction.`,
    text_ar: `عند انتهاء الإيجار، يستفيد المستأجر من حق التجديد وفقاً للمواد 169 وما يليها من قانون التجارة. يجب على المؤجر الذي يعتزم الاعتراض على التجديد إخطار المستأجر برفضه بموجب محضر قضائي قبل [DELAI_CONGE] أشهر على الأقل من انتهاء الإيجار، وإلا وجب عليه دفع تعويض الإخلاء.`,
    applicable_to: ['bail_commercial'],
    mandatory: false,
    legal_reference: 'Articles 169 à 196 du Code de Commerce',
    variables: ['DELAI_CONGE']
  },
  {
    id: 'sous_traitance',
    category: 'commercial',
    name_fr: 'Clause de Sous-Traitance',
    name_ar: 'بند المقاولة من الباطن',
    text_fr: `L'entrepreneur ne pourra sous-traiter tout ou partie des travaux sans l'accord écrit préalable du maître d'ouvrage. En cas de sous-traitance autorisée, l'entrepreneur demeure seul responsable de l'exécution des travaux vis-à-vis du maître d'ouvrage et garantit la bonne exécution par le sous-traitant.`,
    text_ar: `لا يجوز للمقاول المقاولة من الباطن على كل أو جزء من الأشغال دون موافقة كتابية مسبقة من صاحب المشروع. في حالة المقاولة من الباطن المرخصة، يبقى المقاول وحده مسؤولاً عن تنفيذ الأشغال تجاه صاحب المشروع ويضمن حسن التنفيذ من قِبل المقاول من الباطن.`,
    applicable_to: ['contrat_entreprise'],
    mandatory: false,
    legal_reference: 'Article 554 du Code Civil'
  },

  // ── CLAUSES DE PROTECTION ───────────────────────────────────────────────
  {
    id: 'clause_confidentialite',
    category: 'protection',
    name_fr: 'Clause de Confidentialité',
    name_ar: 'بند السرية',
    text_fr: `Chaque partie s'engage à garder strictement confidentiels tous les renseignements, données, documents et informations de toute nature, désignés comme confidentiels ou dont la nature confidentielle est évidente, auxquels elle aura accès dans le cadre du présent contrat. Cette obligation de confidentialité survivra à l'expiration ou à la résiliation du contrat pendant une durée de [DUREE_CONFIDENTIALITE] ans.`,
    text_ar: `يلتزم كل طرف بالحفاظ على سرية تامة لجميع المعلومات والبيانات والوثائق والمعطيات من أي طبيعة كانت، المصنفة سرية أو التي تبدو طبيعتها السرية واضحة، التي يطلع عليها في إطار هذا العقد. يبقى هذا الالتزام بالسرية سارياً بعد انتهاء العقد أو فسخه لمدة [DUREE_CONFIDENTIALITE] سنوات.`,
    applicable_to: ['contrat_commercial', 'contrat_travail_cdi', 'contrat_travail_cdd', 'statuts_sarl'],
    mandatory: false,
    variables: ['DUREE_CONFIDENTIALITE']
  },
  {
    id: 'clause_non_concurrence',
    category: 'protection',
    name_fr: 'Clause de Non-Concurrence',
    name_ar: 'بند عدم المنافسة',
    text_fr: `Pendant une durée de [DUREE_NON_CONCURRENCE] ans à compter de la cessation du contrat, et dans un rayon de [PERIMETRE] km autour de [LIEU_REFERENCE], le salarié/associé s'interdit d'exercer, directement ou indirectement, toute activité concurrente à celle de [NOM_ENTREPRISE]. En contrepartie, une indemnité mensuelle de [MONTANT_INDEMNITE] DA sera versée pendant toute la durée de cette interdiction.`,
    text_ar: `لمدة [DUREE_NON_CONCURRENCE] سنوات من تاريخ انتهاء العقد، وفي نطاق [PERIMETRE] كم حول [LIEU_REFERENCE]، يمتنع العامل/الشريك عن ممارسة أي نشاط منافس لنشاط [NOM_ENTREPRISE]، مباشرةً أو بصفة غير مباشرة. في المقابل، يُدفع تعويض شهري قدره [MONTANT_INDEMNITE] دج طوال مدة هذا الحظر.`,
    applicable_to: ['contrat_travail_cdi', 'cession_parts', 'contrat_commercial'],
    mandatory: false,
    variables: ['DUREE_NON_CONCURRENCE', 'PERIMETRE', 'LIEU_REFERENCE', 'NOM_ENTREPRISE', 'MONTANT_INDEMNITE']
  },
  {
    id: 'force_majeure',
    category: 'protection',
    name_fr: 'Clause de Force Majeure',
    name_ar: 'بند القوة القاهرة',
    text_fr: `Aucune des parties ne sera tenue responsable de l'inexécution de ses obligations contractuelles si cette inexécution résulte d'un cas de force majeure, c'est-à-dire d'un événement imprévisible, irrésistible et extérieur aux parties, tel que catastrophe naturelle, guerre, émeute, décision gouvernementale ou épidémie. La partie invoquant la force majeure devra en informer l'autre partie dans les [DELAI_NOTIFICATION] jours suivant la survenance de l'événement.`,
    text_ar: `لا يُعدّ أي من الطرفين مسؤولاً عن عدم تنفيذ التزاماته التعاقدية إذا كان عدم التنفيذ ناتجاً عن قوة قاهرة، أي حدث لا يمكن توقعه ولا مقاومته وخارج عن إرادة الطرفين، كالكوارث الطبيعية والحروب والاضطرابات وقرارات الحكومة والأوبئة. يجب على الطرف المحتج بالقوة القاهرة إخطار الطرف الآخر في غضون [DELAI_NOTIFICATION] يوماً من وقوع الحدث.`,
    applicable_to: ['all'],
    mandatory: false,
    legal_reference: 'Article 127 du Code Civil',
    variables: ['DELAI_NOTIFICATION']
  },
  {
    id: 'clause_hardship',
    category: 'protection',
    name_fr: 'Clause de Hardship (Imprévision)',
    name_ar: 'بند الظروف الطارئة',
    text_fr: `Si des circonstances économiques imprévisibles survenues après la conclusion du contrat rendent l'exécution des obligations d'une partie excessivement onéreuse, cette partie pourra demander la renégociation du contrat. En cas d'échec de la renégociation dans un délai de [DELAI_RENEG] jours, les parties pourront saisir le juge pour révision ou résolution du contrat.`,
    text_ar: `إذا طرأت ظروف اقتصادية غير متوقعة بعد إبرام العقد تجعل تنفيذ التزامات أحد الطرفين مرهقاً بشكل مفرط، يمكن لهذا الطرف طلب إعادة التفاوض على العقد. في حالة فشل إعادة التفاوض في أجل [DELAI_RENEG] يوماً، يمكن للطرفين اللجوء إلى القضاء لمراجعة العقد أو فسخه.`,
    applicable_to: ['contrat_commercial', 'bail_commercial', 'contrat_entreprise'],
    mandatory: false,
    legal_reference: 'Article 107 du Code Civil',
    variables: ['DELAI_RENEG']
  },
  {
    id: 'clause_election_domicile',
    category: 'protection',
    name_fr: 'Élection de Domicile',
    name_ar: 'اختيار الموطن',
    text_fr: `Pour l'exécution des présentes et de leurs suites, les parties font élection de domicile en leurs adresses respectives indiquées en tête du présent acte. Toute notification, mise en demeure ou signification sera valablement faite à ces adresses.`,
    text_ar: `لتنفيذ هذا العقد وما يترتب عليه، يختار الطرفان موطنهما في عنوانيهما المذكورين في صدر هذا العقد. يُعدّ أي إخطار أو إنذار أو تبليغ صحيحاً إذا وُجّه إلى هذين العنوانين.`,
    applicable_to: ['all'],
    mandatory: false
  },
  {
    id: 'clause_attribution_juridiction',
    category: 'protection',
    name_fr: 'Attribution de Juridiction',
    name_ar: 'تحديد الاختصاص القضائي',
    text_fr: `En cas de litige relatif à l'interprétation ou à l'exécution du présent contrat, les parties conviennent d'attribuer compétence exclusive au Tribunal de [TRIBUNAL_COMPETENT], nonobstant pluralité de défendeurs ou appel en garantie.`,
    text_ar: `في حالة نزاع يتعلق بتفسير أو تنفيذ هذا العقد، يتفق الطرفان على منح الاختصاص الحصري لمحكمة [TRIBUNAL_COMPETENT]، بصرف النظر عن تعدد المدعى عليهم أو الدعوى بالضمان.`,
    applicable_to: ['contrat_commercial', 'bail_commercial', 'contrat_entreprise'],
    mandatory: false,
    variables: ['TRIBUNAL_COMPETENT']
  },
  {
    id: 'clause_integralite',
    category: 'protection',
    name_fr: 'Clause d\'Intégralité',
    name_ar: 'بند الاتفاق الكامل',
    text_fr: `Le présent contrat constitue l'intégralité de l'accord entre les parties et annule et remplace tous accords, négociations, représentations et engagements antérieurs, écrits ou verbaux, relatifs à son objet. Toute modification du présent contrat devra faire l'objet d'un avenant écrit signé par les deux parties.`,
    text_ar: `يُشكّل هذا العقد الاتفاق الكامل بين الطرفين ويلغي ويحل محل جميع الاتفاقيات والمفاوضات والتصريحات والتعهدات السابقة، المكتوبة أو الشفهية، المتعلقة بموضوعه. يجب أن يكون أي تعديل على هذا العقد موضوع ملحق مكتوب موقع من الطرفين.`,
    applicable_to: ['all'],
    mandatory: false
  },
  {
    id: 'clause_divisibilite',
    category: 'protection',
    name_fr: 'Clause de Divisibilité',
    name_ar: 'بند قابلية التجزئة',
    text_fr: `Si l'une quelconque des dispositions du présent contrat est déclarée nulle ou inapplicable par une décision judiciaire définitive, les autres dispositions demeureront en vigueur et conserveront leur plein effet. Les parties s'engagent à remplacer la disposition nulle par une disposition valide qui se rapproche le plus possible de l'intention initiale des parties.`,
    text_ar: `إذا أُعلن بطلان أي من أحكام هذا العقد أو عدم قابليتها للتطبيق بموجب حكم قضائي نهائي، تبقى الأحكام الأخرى سارية وتحتفظ بكامل أثرها. يلتزم الطرفان باستبدال الحكم الباطل بحكم صحيح يقترب قدر الإمكان من النية الأصلية للطرفين.`,
    applicable_to: ['all'],
    mandatory: false
  },
];

// ─── Fonctions utilitaires ────────────────────────────────────────────────────

export function getClausesByCategory(categoryId: string): Clause[] {
  return CLAUSES_STANDARDS.filter(c => c.category === categoryId);
}

export function getClausesForDocument(documentType: string): Clause[] {
  return CLAUSES_STANDARDS.filter(c =>
    c.applicable_to.includes(documentType) || c.applicable_to.includes('all')
  );
}

export function getMandatoryClauses(documentType: string): Clause[] {
  return getClausesForDocument(documentType).filter(c => c.mandatory);
}

export function populateClause(
  clause: Clause,
  variables: { [key: string]: string },
  language: 'fr' | 'ar'
): string {
  let text = language === 'ar' ? clause.text_ar : clause.text_fr;

  Object.entries(variables).forEach(([key, value]) => {
    if (value) {
      const regex = new RegExp(`\\[${key}\\]`, 'gi');
      text = text.replace(regex, value);
    }
  });

  // Supprimer les placeholders non remplis
  text = text.replace(/\[[\w\s_-]+\]/g, '');
  text = text.replace(/\s+/g, ' ').replace(/\s+([,;.!?])/g, '$1').trim();

  return text;
}
