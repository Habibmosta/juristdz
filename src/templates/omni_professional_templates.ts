/**
 * OmniProfessionalTemplates - La bibliothèque exhaustive des actes juridiques algériens
 *
 * Ce fichier centralise tous les modèles de documents pour chaque rôle professionnel.
 * Chaque modèle est conçu pour forcer l'IA à adopter la structure et la terminologie
 * exacte du droit algérien.
 */

export interface ProfessionalTemplate {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  prompt: string;
  prompt_ar: string;
  structure: string[];
  structure_ar: string[];
  inputGuide: string;
  inputGuide_ar: string;
  roles: string[];
  category: 'CONTENTIEUX' | 'AUTHENTIQUE' | 'EXECUTION' | 'CONFORMITE' | 'DECISION';
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const OMNI_TEMPLATES: ProfessionalTemplate[] = [
  // ==========================================================================================
  // ⚖️ AVOCATS : LE CONTENTIEUX ET LA STRATÉGIE
  // ==========================================================================================

  // --- Recours & Cassation (Ultra-Haute Complexité) ---
  {
    id: 'recours_cassation',
    name: 'Pourvoi en Cassation',
    name_ar: 'طعن بالنقض',
    description: 'Recours devant la Cour Suprême basé sur la violation de la loi.',
    description_ar: 'طعن أمام المحكمة العليا بناءً على خرق القانون.',
    prompt: 'Rédige un mémoire de pourvoi en cassation devant la Cour Suprême algérienne. Focus absolu sur les moyens de cassation (violation de la loi, défaut de base légale, contradiction de motifs).',
    prompt_ar: 'قم بتحرير مذكرة طعن بالنقض أمام المحكمة العليا الجزائرية. التركيز المطلق على وسائل النقض (خرق القانون، نقص التسبيب، تناقض الأحكام).',
    structure: ["Cour Suprême", "Pourvoyeur/Défendeur", "Décision attaquée", "Moyens de cassation (Détails)", "Demande de cassation"],
    structure_ar: ["المحكمة العليا", "الطاعن/المطعون ضده", "القرار المطعون فيه", "وسائل النقض (تفصيل)", "طلبات النقض"],
    inputGuide: "Arrêt attaqué, Articles de loi violés, Erreurs de droit.",
    inputGuide_ar: "القرار المطعون فيه، المواد القانونية المخروقة، الأخطاء القانونية.",
    roles: ['avocat'],
    category: 'CONTENTIEUX',
    complexity: 'HIGH'
  },
  {
    id: 'plainte_partie_civile',
    name: 'Plainte avec Constitution de Partie Civile',
    name_ar: 'شكوى مع تكوين طرف مدني',
    description: 'Plainte pénale visant à obtenir réparation du préjudice.',
    description_ar: 'شكوى جزائية تهدف إلى الحصول على تعويض عن الضرر.',
    prompt: 'Rédige une plainte avec constitution de partie civile selon le Code de Procédure Pénale algérien.',
    prompt_ar: 'قم بتحرير شكوى مع تكوين طرف مدني وفق قانون الإجراءات الجزائية الجزائري.',
    structure: ["Procureur/Juge d'instruction", "Plaignant", "Mis en cause", "Faits criminels", "Qualification juridique", "Dommages et Intérêts"],
    structure_ar: ["وكيل الجمهورية/قاضي التحقيق", "الشاكي", "المشتكى منه", "الوقائع الإجرامية", "التكييف القانوني", "التعويضات"],
    inputGuide: "Infraction, Preuves, Préjudice subi.",
    inputGuide_ar: "الجريمة، الأدلة، الضرر المتكبد.",
    roles: ['avocat'],
    category: 'CONTENTIEUX',
    complexity: 'MEDIUM'
  },
  {
    id: 'mise_en_liberte',
    name: 'Demande de Mise en Liberté Provisoire',
    name_ar: 'طلب الإفراج المؤقت',
    description: 'Requête visant à sortir un prévenu de la détention provisoire.',
    description_ar: 'طلب يهدف إلى إخراج المتهم من الحبس المؤقت.',
    prompt: 'Rédige une demande de mise en liberté provisoire. Argumente sur l\'absence de risque de fuite, de pression sur les témoins et la garantie de représentation.',
    prompt_ar: 'قم بتحرير طلب للإفراج المؤقت. برر غياب خطر الهروب، أو التأثير على الشهود، مع ضمان حضور المتهم.',
    structure: ["Juge d\'Instruction/Chambre d\'Accusation", "Identité du détenu", "Rappel des faits", "Arguments pour la liberté", "Demande formelle"],
    structure_ar: ["قاضي التحقيق/غرفة الاتهام", "هوية الموقوف", "تذكير بالوقائع", "حجج الإفراج", "الطلب الرسمي"],
    inputGuide: "Identité, Date d'incarcération, Garanties (domicile, famille), Motif de la demande.",
    inputGuide_ar: "الهوية، تاريخ الحبس، الضمانات (السكن، العائلة)، سبب الطلب.",
    roles: ['avocat'],
    category: 'CONTENTIEUX',
    complexity: 'MEDIUM'
  },
  {
    id: 'recours_excès_pouvoir',
    name: 'Recours pour Excès de Pouvoir',
    name_ar: 'طعن بتجاوز السلطة',
    description: 'Action visant l\'annulation d\'une décision administrative illégale.',
    description_ar: 'دعوى تهدف إلى إلغاء قرار إداري غير قانوني.',
    prompt: 'Rédige un recours pour excès de pouvoir devant le tribunal administratif algérien. Analyse la légalité externe (compétence, forme) et interne (fond, motif) de l\'acte.',
    prompt_ar: 'قم بتحرير طعن بتجاوز السلطة أمام المحكمة الإدارية الجزائرية. حلل الشرعية الخارجية (الاختصاص، الشكل) والداخلية (الموضوع، السبب) للقرار.',
    structure: ["Tribunal Administratif", "Requérant", "Administration défenderesse", "Décision attaquée", "Moyens d\'annulation", "Conclusions"],
    structure_ar: ["المحكمة الإدارية", "الطاعن", "الإدارة المدعى عليها", "القرار المطعون فيه", "أسباب الإلغاء", "الطلبات"],
    inputGuide: "Décision administrative, Date de notification, Motifs de l\'illégalité.",
    inputGuide_ar: "القرار الإداري، تاريخ التبليغ، أسباب عدم المشروعية.",
    roles: ['avocat'],
    category: 'CONTENTIEUX',
    complexity: 'HIGH'
  },

  // --- Procédure Civile, Sociale & Commerciale ---
  {
    id: 'memoire_appel',
    name: 'Mémoire en Appel',
    name_ar: 'مذكرة استئناف',
    description: 'Argumentation pour infirmer un jugement de première instance.',
    description_ar: 'مذكرة لاستئناف حكم ابتدائي.',
    prompt: 'Rédige un mémoire en appel. Analyse les erreurs du premier juge et développe les nouveaux moyens de droit.',
    prompt_ar: 'قم بتحرير مذكرة استئناف. حلل أخطاء قاضي الدرجة الأولى وفصل في الوسائل القانونية الجديدة.',
    structure: ["Cour d'Appel", "Parties", "Critique du jugement attaqué", "Arguments de fond", "Demandes"],
    structure_ar: ["مجلس القضاء", "الأطراف", "نقد الحكم المطعون فيه", "الحجج الموضوعية", "الطلبات"],
    inputGuide: "Jugement de 1ère instance, Points de contestation.",
    inputGuide_ar: "حكم الدرجة الأولى، نقاط الاعتراض.",
    roles: ['avocat'],
    category: 'CONTENTIEUX',
    complexity: 'MEDIUM'
  },
  {
    id: 'assignation_divorce',
    name: 'Assignation en Divorce',
    name_ar: 'تكليف بالحضور للطلاق',
    description: 'Acte initial pour engager une procédure de divorce.',
    description_ar: 'الإجراء الأولي لبدء إجراءات الطلاق.',
    prompt: 'Rédige une assignation en divorce. Détaille les griefs (ou le motif de rupture) et les demandes concernant la garde des enfants et la pension.',
    prompt_ar: 'قم بتحرير تكليف بالحضور للطلاق. فصل في الأسباب (أو مبررات الفراق) والطلبات المتعلقة بحضانة الأطفال والنفقة.',
    structure: ["Tribunal de la famille", "Époux/Épouse", "Exposé des faits", "Moyens juridiques", "Demandes (Garde, Pension, Logement)"],
    structure_ar: ["محكمة شؤون الأسرة", "الزوج/الزوجة", "عرض الوقائع", "الأسباب القانونية", "الطلبات (الحضانة، النفقة، السكن)"],
    inputGuide: "Identité des conjoints, Enfants, Motifs du divorce, Demandes financières.",
    inputGuide_ar: "هوية الزوجين، الأطفال، أسباب الطلاق، الطلبات المالية.",
    roles: ['avocat'],
    category: 'CONTENTIEUX',
    complexity: 'MEDIUM'
  },
  {
    id: 'injonction_payer',
    name: 'Requête en Injonction de Payer',
    name_ar: 'طلب أمر بالأداء',
    description: 'Procédure rapide pour obtenir le paiement d\'une créance certaine, liquide et exigible.',
    description_ar: 'إجراء سريع للحصول على دفع دين مؤكد، محدد ومستحق.',
    prompt: 'Rédige une requête en injonction de payer selon le Code de Procédure Civile et Administrative algérien.',
    prompt_ar: 'قم بتحرير طلب أمر بالأداء وفق قانون الإجراءات المدنية والإدارية الجزائري.',
    structure: ["Président du Tribunal", "Créancier", "Débiteur", "Preuve de la créance", "Montant exact", "Demande d\'ordonnance"],
    structure_ar: ["رئيس المحكمة", "الدائن", "المدين", "إثبات الدين", "المبلغ الدقيق", "طلب صدور الأمر"],
    inputGuide: "Factures impayées, Contrat, Montant exact, Identité du débiteur.",
    inputGuide_ar: "الفواتير غير المدفوعة، العقد، المبلغ الدقيق، هوية المدين.",
    roles: ['avocat'],
    category: 'CONTENTIEUX',
    complexity: 'LOW'
  },
  {
    id: 'requete_prudhommale',
    name: 'Requête devant le Tribunal Social',
    name_ar: 'عريضة أمام القسم الاجتماعي',
    description: 'Recours pour licenciement abusif, rappels de salaires ou litiges sociaux.',
    description_ar: 'دعوى عن الفصل التعسفي، مستحقات الرواتب أو النزاعات الاجتماعية.',
    prompt: 'Rédige une requête devant le tribunal social. Focalise-toi sur la violation du contrat de travail et la loi 90-11. Demande des dommages et intérêts pour préjudice subi.',
    prompt_ar: 'قم بتحرير عريضة أمام القسم الاجتماعي. ركز على خرق عقد العمل والقانون 90-11. طالب بتعويضات عن الضررات المتكبدة.',
    structure: ["Tribunal Social", "Salarié/Employeur", "Ancienneté et Poste", "Faits du litige", "Moyens juridiques", "Demandes (Indemnités, Salaires)"],
    structure_ar: ["القسم الاجتماعي", "العامل/المستخدم", "الأقدمية والمنصب", "وقائع النزاع", "الأسانيد القانونية", "الطلبات (التعويضات، الرواتب)"],
    inputGuide: "Contrat de travail, Date de licenciement, Salaire mensuel, Motif du litige.",
    inputGuide_ar: "عقد العمل، تاريخ التسريح، الراتب الشهري، سبب النزاع.",
    roles: ['avocat'],
    category: 'CONTENTIEUX',
    complexity: 'MEDIUM'
  },
  {
    id: 'convention_transaction',
    name: 'Convention de Transaction',
    name_ar: 'اتفاقية صلح',
    description: 'Accord amiable pour mettre fin à un litige sans passer par le juge.',
    description_ar: 'اتفاق ودي لإنهاء نزاع دون اللجوء إلى القضاء.',
    prompt: 'Rédige une convention de transaction définitive et irrévocable selon le Code Civil algérien.',
    prompt_ar: 'قم بتحرير اتفاقية صلح نهائية وغير قابلة للرجوع وفق القانون المدني الجزائري.',
    structure: ["Parties", "Objet du litige", "Concessions mutuelles", "Désistement d\'action", "Confidentialité"],
    structure_ar: ["الأطراف", "موضوع النزاع", "التنازلات المتبادلة", "التنازل عن الدعوى", "السرية"],
    inputGuide: "Litige, Montant du règlement, Obligations des parties.",
    inputGuide_ar: "النزاع، مبلغ التسوية, التزامات الأطراف.",
    roles: ['avocat', 'juriste_entreprise'],
    category: 'CONTENTIEUX',
    complexity: 'MEDIUM'
  },
  {
    id: 'memoire_appel',
    name: 'Mémoire en Appel',
    name_ar: 'مذكرة استئناف',
    description: 'Argumentation pour infirmer un jugement de première instance.',
    description_ar: 'مذكرة لاستئناف حكم ابتدائي.',
    prompt: 'Rédige un mémoire en appel. Analyse les erreurs du premier juge et développe les nouveaux moyens de droit.',
    prompt_ar: 'قم بتحرير مذكرة استئناف. حلل أخطاء قاضي الدرجة الأولى وفصل في الوسائل القانونية الجديدة.',
    structure: ["Cour d'Appel", "Parties", "Critique du jugement attaqué", "Arguments de fond", "Demandes"],
    structure_ar: ["مجلس القضاء", "الأطراف", "نقد الحكم المطعون فيه", "الحجج الموضوعية", "الطلبات"],
    inputGuide: "Jugement de 1ère instance, Points de contestation.",
    inputGuide_ar: "حكم الدرجة الأولى، نقاط الاعتراض.",
    roles: ['avocat'],
    category: 'CONTENTIEUX',
    complexity: 'MEDIUM'
  },
  {
    id: 'assignation_divorce',
    name: 'Assignation en Divorce',
    name_ar: 'تكليف بالحضور للطلاق',
    description: 'Acte initial pour engager une procédure de divorce.',
    description_ar: 'الإجراء الأولي لبدء إجراءات الطلاق.',
    prompt: 'Rédige une assignation en divorce. Détaille les griefs (ou le motif de rupture) et les demandes concernant la garde des enfants et la pension.',
    prompt_ar: 'قم بتحرير تكليف بالحضور للطلاق. فصل في الأسباب (أو مبررات الفراق) والطلبات المتعلقة بحضانة الأطفال والنفقة.',
    structure: ["Tribunal de la famille", "Époux/Épouse", "Exposé des faits", "Moyens juridiques", "Demandes (Garde, Pension, Logement)"],
    structure_ar: ["محكمة شؤون الأسرة", "الزوج/الزوجة", "عرض الوقائع", "الأسباب القانونية", "الطلبات (الحضانة، النفقة، السكن)"],
    inputGuide: "Identité des conjoints, Enfants, Motifs du divorce, Demandes financières.",
    inputGuide_ar: "هوية الزوجين، الأطفال، أسباب الطلاق، الطلبات المالية.",
    roles: ['avocat'],
    category: 'CONTENTIEUX',
    complexity: 'MEDIUM'
  },
  {
    id: 'injonction_payer',
    name: 'Requête en Injonction de Payer',
    name_ar: 'طلب أمر بالأداء',
    description: 'Procédure rapide pour obtenir le paiement d\'une créance certaine, liquide et exigible.',
    description_ar: 'إجراء سريع للحصول على دفع دين مؤكد، محدد ومستحق.',
    prompt: 'Rédige une requête en injonction de payer selon le Code de Procédure Civile et Administrative algérien.',
    prompt_ar: 'قم بتحرير طلب أمر بالأداء وفق قانون الإجراءات المدنية والإدارية الجزائري.',
    structure: ["Président du Tribunal", "Créancier", "Débiteur", "Preuve de la créance", "Montant exact", "Demande d\'ordonnance"],
    structure_ar: ["رئيس المحكمة", "الدائن", "المدين", "إثبات الدين", "المبلغ الدقيق", "طلب صدور الأمر"],
    inputGuide: "Factures impayées, Contrat, Montant exact, Identité du débiteur.",
    inputGuide_ar: "الفواتير غير المدفوعة، العقد، المبلغ الدقيق، هوية المدين.",
    roles: ['avocat'],
    category: 'CONTENTIEUX',
    complexity: 'LOW'
  },
  {
    id: 'requete_prudhommale',
    name: 'Requête devant le Tribunal Social',
    name_ar: 'عريضة أمام القسم الاجتماعي',
    description: 'Recours pour licenciement abusif, rappels de salaires ou litiges sociaux.',
    description_ar: 'دعوى عن الفصل التعسفي، مستحقات الرواتب أو النزاعات الاجتماعية.',
    prompt: 'Rédige une requête devant le tribunal social. Focalise-toi sur la violation du contrat de travail et la loi 90-11. Demande des dommages et intérêts pour préjudice subi.',
    prompt_ar: 'قم بتحرير عريضة أمام القسم الاجتماعي. ركز على خرق عقد العمل والقانون 90-11. طالب بتعويضات عن الضررات المتكبدة.',
    structure: ["Tribunal Social", "Salarié/Employeur", "Ancienneté et Poste", "Faits du litige", "Moyens juridiques", "Demandes (Indemnités, Salaires)"],
    structure_ar: ["القسم الاجتماعي", "العامل/المستخدم", "الأقدمية والمنصب", "وقائع النزاع", "الأسانيد القانونية", "الطلبات (التعويضات، الرواتب)"],
    inputGuide: "Contrat de travail, Date de licenciement, Salaire mensuel, Motif du litige.",
    inputGuide_ar: "عقد العمل، تاريخ التسريح، الراتب الشهري، سبب النزاع.",
    roles: ['avocat'],
    category: 'CONTENTIEUX',
    complexity: 'MEDIUM'
  },
  {
    id: 'convention_transaction',
    name: 'Convention de Transaction',
    name_ar: 'اتفاقية صلح',
    description: 'Accord amiable pour mettre fin à un litige sans passer par le juge.',
    description_ar: 'اتفاق ودي لإنهاء نزاع دون اللجوء إلى القضاء.',
    prompt: 'Rédige une convention de transaction définitive et irrévocable selon le Code Civil algérien.',
    prompt_ar: 'قم بتحرير اتفاقية صلح نهائية وغير قابلة للرجوع وفق القانون المدني الجزائري.',
    structure: ["Parties", "Objet du litige", "Concessions mutuelles", "Désistement d\'action", "Confidentialité"],
    structure_ar: ["الأطراف", "موضوع النزاع", "التنازلات المتبادلة", "التنازل عن الدعوى", "السرية"],
    inputGuide: "Litige, Montant du règlement, Obligations des parties.",
    inputGuide_ar: "النزاع، مبلغ التسوية, التزامات الأطراف.",
    roles: ['avocat', 'juriste_entreprise'],
    category: 'CONTENTIEUX',
    complexity: 'MEDIUM'
  },

  // ==========================================================================================
  // 🖋️ NOTAIRES : L'AUTHENTICITÉ ET LE PATRIMOINE
  // ==========================================================================================

  {
    id: 'donation_partage',
    name: 'Acte de Donation-Partage',
    name_ar: 'عقد هبة وقسمة',
    description: 'Anticipation de la succession pour éviter les conflits familiaux.',
    description_ar: 'توزيع مسبق للميراث لتجنب النزاعات العائلية.',
    prompt: 'Rédige un acte de donation-partage authentique. Respecte scrupuleusement la distinction entre la part d\'avance et la part de réserve.',
    prompt_ar: 'قم بتحرير عقد هبة وقسمة رسمي. احترم بدقة التمييز بين الحصة المسبقة وحصة الاحتياط.',
    structure: ["Comparution", "Inventaire des biens", " Lots attribués", "Acceptation des donataires", "Droit de retour", "Clôture"],
    structure_ar: ["المثول", "جرد الأموال", "الحصص الموزعة", "قبول الموهوب لهم", "حق الرد", "الخاتمة"],
    inputGuide: "Donateur, Héritiers, Liste des biens, Valeurs.",
    inputGuide_ar: "الواهب، الورثة، قائمة الأموال، القيم.",
    roles: ['notaire'],
    category: 'AUTHENTIQUE',
    complexity: 'HIGH'
  },
  {
    id: 'vente_immobiliere',
    name: 'Acte de Vente Immobilière',
    name_ar: 'عقد بيع عقاري',
    description: 'Transfert de propriété d\'un bien immobilier.',
    description_ar: 'نقل ملكية عقار.',
    prompt: 'Rédige un acte de vente immobilière authentique. Précise l\'origine de propriété, la désignation cadastrale exacte et les modalités de paiement.',
    prompt_ar: 'قم بتحرير عقد بيع عقاري رسمي. حدد أصل الملكية، الوصف العقاري الدقيق وطريقة الدفع.',
    structure: ["Comparution", "Désignation du bien", "Origine de propriété", "Prix et Modalités de paiement", "Jouissance", "L\'enregistrement"],
    structure_ar: ["المثول", "وصف العقار", "أصل الملكية", "الثمن وطريقة الدفع", "الانتفاع", "الشهر العقاري"],
    inputGuide: "Vendeur, Acheteur, Prix, Coordonnées cadastrales, Mode de paiement.",
    inputGuide_ar: "البائع، المشتري، الثمن، المعلومات العقارية، طريقة الدفع.",
    roles: ['notaire'],
    category: 'AUTHENTIQUE',
    complexity: 'MEDIUM'
  },
  {
    id: 'bail_commercial',
    name: 'Bail Commercial',
    name_ar: 'عقد إيجار تجاري',
    description: 'Contrat de location d\'un local à usage commercial.',
    description_ar: 'عقد إيجار محل لاستعمال تجاري.',
    prompt: 'Rédige un contrat de bail commercial. Détaille la durée, le montant du loyer, la révision triennale et les obligations d\'entretien.',
    prompt_ar: 'قم بتحرير عقد إيجار تجاري. فصل في المدة، مبلغ الإيجار، المراجعة كل ثلاث سنوات والتزامات الصيانة.',
    structure: ["Bailleur et Preneur", "Désignation du local", "Durée du bail", "Loyer et charges", "Destination des lieux", "Clause de résiliation"],
    structure_ar: ["المؤجر والمستأجر", "وصف المحل", "مدة الإيجار", "الإيجار والأعباء", "وجهة الاستعمال", "بند الفسخ"],
    inputGuide: "Propriétaire, Locataire, Montant loyer, Durée, Activité commerciale.",
    inputGuide_ar: "المالك، المستأجر، مبلغ الإيجار، المدة، النشاط التجاري.",
    roles: ['notaire', 'juriste_entreprise'],
    category: 'AUTHENTIQUE',
    complexity: 'MEDIUM'
  },
  {
    id: 'contrat_bail_commercial_complex',
    name: 'Bail Commercial avec Clause de Rachat',
    name_ar: 'عقد إيجار تجاري مع بند الاسترداد',
    description: 'Bail commercial complexe incluant des modalités de rachat du fonds de commerce.',
    description_ar: 'عقد إيجار تجاري معقد يتضمن كيفيات استرداد الأصل التجاري.',
    prompt: 'Rédige un bail commercial complexe. Intègre des clauses précises sur la destination des lieux, la révision du loyer indexée, et une clause de rachat prioritaire du fonds de commerce en cas de cession.',
    prompt_ar: 'قم بتحرير عقد إيجار تجاري معقد. أدرج بنوداً دقيقة حول وجهة الاستعمال، مراجعة الإيجار المرتبطة بالمؤشر، وبند أولوية استرداد الأصل التجاري في حالة التنازل.',
    structure: ["Parties", "Désignation et Destination", "Loyer et Indexation", "Obligations de maintenance", "Clause de Rachat du Fonds", "Résiliation et Litiges"],
    structure_ar: ["الأطراف", "الوصف ووجهة الاستعمال", "الإيجار والمؤشر", "التزامات الصيانة", "بند استرداد الأصل التجاري", "الفسخ والنزاعات"],
    inputGuide: "Montant loyer, Indice de référence, Conditions de rachat, Durée.",
    inputGuide_ar: "مبلغ الإيجار، مؤشر المراجعة، شروط الاسترداد، المدة.",
    roles: ['notaire', 'juriste_entreprise'],
    category: 'AUTHENTIQUE',
    complexity: 'HIGH'
  },
  {
    id: 'statuts_sarl',
    name: 'Statuts de SARL',
    name_ar: 'القانون الأساسي لشركة ذات مسؤولية محدودة',
    description: 'Constitution complète d\'une société commerciale.',
    description_ar: 'تأسيس كامل لشركة تجارية ذات مسؤولية محدودة.',
    prompt: 'Rédige les statuts complets d\'une SARL conformément au Code de Commerce algérien, incluant la gérance et la répartition du capital.',
    prompt_ar: 'قم بتحرير القانون الأساسي الكامل لشركة ذات مسؤولية محدودة وفق القانون التجاري الجزائري، بما في ذلك التسيير وتوزيع رأس المال.',
    structure: ["Dénomination et Objet", "Siège Social", "Capital et Apports", "Gérance", "Assemblées", "Liquidation"],
    structure_ar: ["التسمية والغرض", "المقر الاجتماعي", "رأس المال والحصص", "التسيير", "الجمعيات العامة", "التصفية"],
    inputGuide: "Nom société, Capital, Associés, Gérant, Objet social.",
    inputGuide_ar: "اسم الشركة، رأس المال، الشركاء، المسير، الغرض الاجتماعي.",
    roles: ['notaire'],
    category: 'AUTHENTIQUE',
    complexity: 'MEDIUM'
  },
  {
    id: 'testament_authentique',
    name: 'Testament Authentique',
    name_ar: 'وصية رسمية',
    description: 'Acte par lequel une personne dispose de ses biens pour après son décès.',
    description_ar: 'عقد يتصرف بموجبه الشخص في أمواله لما بعد وفاته.',
    prompt: 'Rédige un testament authentique. Respecte scrupuleusement la part disponible (le tiers) et les interdits de la loi algérienne sur les successions.',
    prompt_ar: 'قم بتحرير وصية رسمية. احترم بدقة الثلث المتاح وممنوعات القانون الجزائري في المواريث.',
    structure: ["Identité du Testateur", "Désignation des legs", "Montant/Nature des biens", "Exécuteur testamentaire", "Clôture"],
    structure_ar: ["هوية الموصي", "تحديد الوصايا", "قيمة/طبيعة الأموال", "المنفذ للوصية", "الخاتمة"],
    inputGuide: "Nom testateur, Bénéficiaires, Biens légués, Conditions.",
    inputGuide_ar: "اسم الموصي، المستفيدون، الأموال الموصى بها، الشروط.",
    roles: ['notaire'],
    category: 'AUTHENTIQUE',
    complexity: 'HIGH'
  },
  {
    id: 'hypotheque_conventionnelle',
    name: 'Acte d\'Hypothèque Conventionnelle',
    name_ar: 'عقد رهن اتفاقي',
    description: 'Garantie réelle sur un bien immobilier pour sécuriser une créance.',
    description_ar: 'ضمان عيني على عقار لتأمين دين.',
    prompt: 'Rédige un acte d\'hypothèque conventionnelle. Précise la nature de la créance garantie et les conditions de réalisation.',
    prompt_ar: 'قم بتحرير عقد رهن اتفاقي. حدد بدقة طبيعة الدين المضمون وشروط التنفيذ.',
    structure: ["Créancier et Débiteur", "Désignation du bien hypothéqué", "Montant garanti", "Obligations du débiteur", "L\'inscription foncière"],
    structure_ar: ["الدائن والمدين", "وصف العقار المرهون", "المبلغ المضمون", "التزامات المدين", "الشهر العقاري"],
    inputGuide: "Montant du prêt, Bien immobilier, Durée du remboursement.",
    inputGuide_ar: "مبلغ القرض، العقار، مدة التسديد.",
    roles: ['notaire'],
    category: 'AUTHENTIQUE',
    complexity: 'MEDIUM'
  },

  // ==========================================================================================
  // 📜 HUISSIERS : L'EXÉCUTION ET LA PREUVE
  // ==========================================================================================

  {
    id: 'pv_constat_abandon_poste',
    name: 'PV de Constat d\'Abandon de Poste',
    name_ar: 'محضر معاينة ترك منصب العمل',
    description: 'Constat officiel de l\'absence d\'un salarié à son poste.',
    description_ar: 'معاينة رسمية لغياب عامل عن منصب عمله.',
    prompt: 'Rédige un PV de constat d\'abandon de poste. Décris précisément l\'absence, la date, l\'heure et les témoins éventuels. Reste strictement factuel.',
    prompt_ar: 'قم بتحرير محضر معاينة ترك منصب العمل. صف الغياب بدقة، التاريخ، الساعة والشهود إن وجدوا. ابق موضوعياً تماماً.',
    structure: ["Identité de l\'Huissier", "Lieu du constat", "Heure et Date", "Observations factuelles", "Clôture"],
    structure_ar: ["هوية المحضر", "مكان المعاينة", "الوقت والتاريخ", "الملاحظات المادية", "الخاتمة"],
    inputGuide: "Entreprise, Nom employé, Heure de passage, Observations.",
    inputGuide_ar: "المؤسسة، اسم الموظف، ساعة المرور، الملاحظات.",
    roles: ['huissier'],
    category: 'EXECUTION',
    complexity: 'LOW'
  },
  {
    id: 'pv_constat_dommages',
    name: 'PV de Constat de Dommages',
    name_ar: 'محضر معاينة أضرار',
    description: 'Constat technique de dégâts matériels pour assurance ou litige.',
    description_ar: 'معاينة تقنية لأضرار مادية من أجل التأمين أو النزاعات.',
    prompt: 'Rédige un PV de constat de dommages. Utilise un vocabulaire technique précis, décris l\'état des lieux et l\'ampleur des dégâts sans interprétation.',
    prompt_ar: 'قم بتحرير محضر معاينة أضرار. استخدم مصطلحات تقنية دقيقة، صف حالة المكان وحجم الأضرار دون أي تأويل.',
    structure: ["Identité de l\'Huissier", "Lieu et Date", "Description détaillée des dommages", "Photos et Pièces jointes", "Clôture"],
    structure_ar: ["هوية المحضر", "المكان والتاريخ", "وصف تفصيلي للأضرار", "الصور والمرفقات", "الخاتمة"],
    inputGuide: "Lieu, Nature des dégâts (incendie, eau, etc.), Mesures prises.",
    inputGuide_ar: "المكان، طبيعة الأضرار (حريق، مياه، إلخ)، الإجراءات المتخذة.",
    roles: ['huissier'],
    category: 'EXECUTION',
    complexity: 'MEDIUM'
  },
  {
    id: 'signification_acte',
    name: 'PV de Signification d\'Acte',
    name_ar: 'محضر تبليغ سند',
    description: 'Notification officielle d\'un acte juridique à une partie.',
    description_ar: 'تبليغ رسمي لسند قانوني إلى طرف ما.',
    prompt: 'Rédige un PV de signification. Précise si la remise est faite à la personne, à domicile ou par voie de placard.',
    prompt_ar: 'قم بتحرير محضر تبليغ. حدد ما إذا كان التسليم تم للشخص نفسه، في المنزل أو عن طريق التعليق.',
    structure: ["L\'Huissier", "Destinataire", "Acte signifié", "Mode de remise", "Date et Heure", "Clôture"],
    structure_ar: ["المحضر", "المرسل إليه", "السند المبلغ", "طريقة التسليم", "التاريخ والساعة", "الخاتمة"],
    inputGuide: "Nom destinataire, Acte (Jugement/Assignation), Date, Lieu.",
    inputGuide_ar: "اسم المرسل إليه، السند (حكم/تكليف بالحضور)، التاريخ، المكان.",
    roles: ['huissier'],
    category: 'EXECUTION',
    complexity: 'LOW'
  },
  {
    id: 'saisie_conservatoire',
    name: 'PV de Saisie-Conservatoire',
    name_ar: 'محضر حجز تحفظي',
    description: 'Saisie de biens pour empêcher l\'organisation d\'insolvabilité.',
    description_ar: 'حجز الأموال لمنع تهريبها أو إخفاؤها.',
    prompt: 'Rédige un procès-verbal de saisie-conservatoire. Sois extrêmement précis sur la description des biens saisis et la base légale de la saisie.',
    prompt_ar: 'قم بتحرير محضر حجز تحفظي. كن دقيقاً جداً في وصف الأموال المحجوزة والأساس القانوني للحجز.',
    structure: ["L\'Huissier", "Le Créancier", "Le Débiteur", "Titre exécutoire/Ordonnance", "Inventaire des biens", "Notification"],
    structure_ar: ["المحضر القضائي", "الدائن", "المدين", "السند التنفيذي/الأمر", "جرد الأموال", "التبليغ"],
    inputGuide: "Ordonnance du juge, Liste des biens, Valeur estimée.",
    inputGuide_ar: "أمر القاضي، قائمة الأموال، القيمة التقديرية.",
    roles: ['huissier'],
    category: 'EXECUTION',
    complexity: 'HIGH'
  },
  {
    id: 'commandement_payer',
    name: 'Commandement de Payer',
    name_ar: 'تكليف بالدفع',
    description: 'Dernier avertissement formel avant la saisie effective.',
    description_ar: 'إنذار رسمي أخير قبل البدء في إجراءات الحجز.',
    prompt: 'Rédige un commandement de payer ferme. Mentionne expressément les délais légaux et les conséquences du non-paiement.',
    prompt_ar: 'قم بتحرير تكليف بالدفع حازم. اذكر صراحة المهل القانونية وعواقب عدم الدفع.',
    structure: ["Huissier", "Débiteur", "Titre exécutoire", "Montant principal et frais", "Délai d\'exécution", "Avertissement saisie"],
    structure_ar: ["المحضر", "المدين", "السند التنفيذي", "المبلغ الأصلي والمصاريف", "مهلة التنفيذ", "التحذير من الحجز"],
    inputGuide: "Montant total, Titre exécutoire, Date limite.",
    inputGuide_ar: "المبلغ الإجمالي، السند التنفيذي، التاريخ النهائي.",
    roles: ['huissier'],
    category: 'EXECUTION',
    complexity: 'LOW'
  },

  // ==========================================================================================
  // 🏢 JURISTES D\'ENTREPRISE : CONFORMITÉ ET STRATÉGIE
  // ==========================================================================================

  {
    id: 'contrat_prestation_services',
    name: 'Contrat de Prestation de Services',
    name_ar: 'عقد تقديم خدمات',
    description: 'Contrat régissant la relation entre un prestataire et un client.',
    description_ar: 'عقد ينظم العلاقة بين مقدم خدمة وعميل.',
    prompt: 'Rédige un contrat de prestation de services détaillé. Focus sur le périmètre de la mission, les délais de livraison, les modalités de paiement et la responsabilité.',
    prompt_ar: 'قم بتحرير عقد تقديم خدمات مفصل. ركز على نطاق المهمة، مواعيد التسليم، طرق الدفع والمسؤولية.',
    structure: ["Parties", "Objet du Contrat", "Obligations du Prestataire", "Obligations du Client", "Prix et Paiement", "Résiliation", "Litiges"],
    structure_ar: ["الأطراف", "موضوع العقد", "التزامات مقدم الخدمة", "التزامات العميل", "الثمن والدفع", "فسخ العقد", "النزاعات"],
    inputGuide: "Identité des parties, Description service, Prix, Durée, Conditions de livraison.",
    inputGuide_ar: "هوية الأطراف، وصف الخدمة، الثمن، المدة، شروط التسليم.",
    roles: ['juriste_entreprise'],
    category: 'CONFORMITE',
    complexity: 'MEDIUM'
  },
  {
    id: 'accord_confidentialite',
    name: 'Accord de Confidentialité (NDA)',
    name_ar: 'اتفاقية سرية المعلومات',
    description: 'Accord pour protéger les informations sensibles.',
    description_ar: 'اتفاقية لحماية المعلومات السرية.',
    prompt: 'Rédige un accord de confidentialité strict entre deux entreprises. Précise la nature des informations confidentielles et la durée de l\'obligation.',
    prompt_ar: 'قم بتحرير اتفاقية سرية صارمة بين شركتين. حدد طبيعة المعلومات السرية ومدة الالتزام.',
    structure: ["Parties", "Définition des Informations Confidentielles", "Engagements de Non-Divulgation", "Exceptions", "Durée", "Sanctions"],
    structure_ar: ["الأطراف", "تعريف المعلومات السرية", "التزامات عدم الإفشاء", "الاستثناءات", "المدة", "العقوبات"],
    inputGuide: "Parties, Type d\'infos (techniques, financières), Durée du secret.",
    inputGuide_ar: "الأطراف، نوع المعلومات (تقنية، مالية)، مدة السرية.",
    roles: ['juriste_entreprise'],
    category: 'CONFORMITE',
    complexity: 'MEDIUM'
  },
  {
    id: 'note_conseil_juridique',
    name: 'Note de Conseil Juridique',
    name_ar: 'مذكرة استشارية قانونية',
    description: 'Analyse d\'un risque et recommandation stratégique pour la direction.',
    description_ar: 'تحليل للمخاطر وتوصية استراتيجique للإدارة.',
    prompt: 'Rédige une note de conseil juridique. Analyse la situation, identifie les risques (Faible/Moyen/Haut) et propose 3 options de résolution.',
    prompt_ar: 'قم بتحرير مذكرة استشارية قانونية. حلل الوضعية، حدد المخاطر (منخفضة/متوسطة/عالية) واقترح 3 خيارات للحل.',
    structure: ["Objet", "Analyse des faits", "Cadre légal applicable", "Analyse des risques", "Recommandations Stratégiques"],
    structure_ar: ["الموضوع", "تحليل الوقائع", "الإطار القانوني المطبق", "تحليل المخاطر", "التوصيات الاستراتيجية"],
    inputGuide: "Situation problème, Objectif de l'entreprise, Contraintes.",
    inputGuide_ar: "الوضعية الإشكالية، هدف الشركة، القيود.",
    roles: ['juriste_entreprise'],
    category: 'CONFORMITE',
    complexity: 'HIGH'
  },
  {
    id: 'reglement_interieur',
    name: 'Règlement Intérieur d\'Entreprise',
    name_ar: 'النظام الداخلي للمؤسسة',
    description: 'Document régissant la discipline et l\'organisation interne.',
    description_ar: 'وثيقة تنظم الانضباط والتنظيم الداخلي للمؤسسة.',
    prompt: 'Rédige un règlement intérieur complet et conforme à la loi 90-11 relative aux relations de travail en Algérie.',
    prompt_ar: 'قم بتحرير نظام داخلي كامل ومطابق للقانون 90-11 المتعلق بعلاقات العمل في الجزائر.',
    structure: ["Dispositions Générales", "Organisation du Travail", "Hygiène et Sécurité", "Discipline et Sanctions", "Droits et Obligations"],
    structure_ar: ["أحكام عامة", "تنظيم العمل", "النظافة والأمن", "الانضباط والعقوبات", "الحقوق والالتزامات"],
    inputGuide: "Secteur d'activité, Nombre d'employés, Horaires, Règles spécifiques.",
    inputGuide_ar: "قطاع النشاط، عدد العمال، توقيت العمل، قواعد خاصة.",
    roles: ['juriste_entreprise'],
    category: 'CONFORMITE',
    complexity: 'MEDIUM'
  },

  // ==========================================================================================
  // 💎 DOMAINES RARE ET HAUTE COMPLEXITÉ (Savoir Absolu)
  // ==========================================================================================

  // --- Droit Minier et Énergétique ---
  {
    id: 'contrat_exploitation_miniere',
    name: 'Contrat d\'Exploitation Minière',
    name_ar: 'عقد استغلال منجمي',
    description: 'Convention complexe entre l\'État et un opérateur pour l\'extraction de ressources.',
    description_ar: 'اتفاقية معقدة بين الدولة ومستثمر لاستخراج الموارد المعدنية.',
    prompt: 'Rédige un contrat d\'exploitation minière conformément à la loi minière algérienne. Détaille les zones de concession, les redevances minières, les obligations environnementales et la clause de stabilité fiscale.',
    prompt_ar: 'قم بتحرير عقد استغلال منجمي وفقاً لقانون المناجم الجزائري. فصل في مناطق الامتياز، الإتاوات المنجمية، الالتزامات البيئية وبند الاستقرار الضريبي.',
    structure: ["Parties (État/Opérateur)", "Objet et Périmètre de la Concession", "Redevances et Fiscalité", "Normes Environnementales et Sociales", "Durée et Renouvellement", "Règlement des Différends (Arbitrage)"],
    structure_ar: ["الأطراف (الدولة/المستثمر)", "موضوع ونطاق الامتياز", "الإتاوات والضرائب", "المعايير البيئية والاجتماعية", "المدة والتجديد", "تسوية النزاعات (التحكيم)"],
    inputGuide: "Zone géographique, Type de minerai, Montant des investissements, Durée de concession.",
    inputGuide_ar: "المنطقة الجغرافية، نوع المعدن، مبلغ الاستثمارات، مدة الامتياز.",
    roles: ['avocat', 'juriste_entreprise'],
    category: 'CONFORMITE',
    complexity: 'HIGH'
  },
  {
    id: 'convention_partenariat_energie',
    name: 'Convention de Partenariat Énergétique (Hydrocarbures)',
    name_ar: 'اتفاقية شراكة طاقوية (المحروقات)',
    description: 'Accord de partage de production ou de services dans le secteur des hydrocarbures.',
    description_ar: 'اتفاقية تقاسم الإنتاج أو خدمات في قطاع المحروقات.',
    prompt: 'Rédige une convention de partenariat énergétique. Focus sur le partage des coûts (cost recovery), le partage de la production et la conformité aux règles de SONATRACH et de l\'ALNAFT.',
    prompt_ar: 'قم بتحرير اتفاقية شراكة طاقوية. ركز على تقاسم التكاليف (استرداد التكاليف)، تقاسم الإنتاج والامتثال لقواعد سوناطراك والوكالة الوطنية لرفع التحديات (ALNAFT).',
    structure: ["Cadre Juridique", "Plan de Développement", "Mécanisme de Partage de Production", "Obligations Fiscales", "Transfert de Technologie", "Force Majeure"],
    structure_ar: ["الإطار القانوني", "مخطط التطوير", "آلية تقاسم الإنتاج", "الالتزامات الضريبية", "نقل التكنولوجيا", "القوة القاهرة"],
    inputGuide: "Type de gisement, Pourcentages de partage, Investissements prévus.",
    inputGuide_ar: "نوع الحقل، نسب التقاسم، الاستثمارات المتوقعة.",
    roles: ['avocat', 'juriste_entreprise'],
    category: 'CONFORMITE',
    complexity: 'HIGH'
  },

  // --- Propriété Intellectuelle & Digitale ---
  {
    id: 'contrat_licence_logiciel',
    name: 'Contrat de Licence de Logiciel (SaaS)',
    name_ar: 'عقد ترخيص برمجيات (SaaS)',
    description: 'Cession de droits d\'utilisation d\'un logiciel avec maintenance et SLA.',
    description_ar: 'تنازل عن حقوق استخدام برنامج مع الصيانة واتفاقية مستوى الخدمة.',
    prompt: 'Rédige un contrat de licence SaaS. Précise les droits d\'utilisation, la propriété intellectuelle (IP), la protection des données (loi 18-07) et les niveaux de service (SLA).',
    prompt_ar: 'قم بتحرير عقد ترخيص برمجيات (SaaS). حدد حقوق الاستخدام، الملكية الفكرية، حماية البيانات (القانون 18-07) ومستويات الخدمة (SLA).',
    structure: ["Définitions", "Octroi de Licence", "Conditions Financières", "Propriété Intellectuelle", "Protection des Données et Confidentialité", "SLA et Maintenance"],
    structure_ar: ["التعاريف", "منح الترخيص", "الشروط المالية", "الملكية الفكرية", "حماية البيانات والسرية", "اتفاقية مستوى الخدمة والصيانة"],
    inputGuide: "Nom du logiciel, Durée, Coût, Indicateurs de performance (uptime).",
    inputGuide_ar: "اسم البرنامج، المدة، التكلفة، مؤشرات الأداء (وقت التشغيل).",
    roles: ['juriste_entreprise', 'avocat'],
    category: 'CONFORMITE',
    complexity: 'MEDIUM'
  },
  {
    id: 'cession_droits_auteur',
    name: 'Contrat de Cession de Droits d\'Auteur',
    name_ar: 'عقد تنازل عن حقوق المؤلف',
    description: 'Transfert de droits de propriété intellectuelle sur une œuvre.',
    description_ar: 'نقل حقوق الملكية الفكرية لعمل مؤلف.',
    prompt: 'Rédige un contrat de cession de droits d\'auteur. Détaille précisément les droits cédés (reproduction, représentation), la durée, le territoire (Algérie/Monde) et la rémunération.',
    prompt_ar: 'قم بتحرير عقد تنازل عن حقوق المؤلف. فصل بدقة في الحقوق المتنازل عنها (النسخ، التمثيل)، المدة، النطاق الجغرافي (الجزائر/العالم) والمقابل المادي.',
    structure: ["Identification de l\'Œuvre", "Étendue de la Cession", "Durée et Territoire", "Prix et Modalités de Paiement", "Garantie d\'Éviction"],
    structure_ar: ["تحديد العمل", "نطاق التنازل", "المدة والنطاق الجغرافي", "الثمن وطرق الدفع", "ضمان عدم التعرض"],
    inputGuide: "Description de l\'œuvre, Droits transférés, Montant, Durée.",
    inputGuide_ar: "وصف العمل، الحقوق المنقولة، المبلغ، المدة.",
    roles: ['avocat', 'juriste_entreprise'],
    category: 'CONFORMITE',
    complexity: 'MEDIUM'
  },

  // --- Procédures Collectives (Faillite / Redressement) ---
  {
    id: 'demande_ouverture_redressement',
    name: 'Requête en Ouverture de Redressement Judiciaire',
    name_ar: 'طلب فتح إجراءات التسوية القضائية',
    description: 'Action pour sauver une entreprise en état de cessation de paiements.',
    description_ar: 'إجراء لإنقاذ مؤسسة في حالة التوقف عن الدفع.',
    prompt: 'Rédige une requête en ouverture de redressement judiciaire. Démontre l\'état de cessation de paiements tout en prouvant la viabilité économique de l\'entreprise à moyen terme.',
    prompt_ar: 'قم بتحرير طلب فتح إجراءات التسوية القضائية. أثبت حالة التوقف عن الدفع مع إثبات الجدوى الاقتصادية للمؤسسة على المدى المتوسط.',
    structure: ["Tribunal Commercial", "État des Dettes", "Justification de la Cessation de Paiements", "Plan de Sauvegarde Proposé", "Demande de Désignation d\'un Mandataire"],
    structure_ar: ["المحكمة التجارية", "بيان الديون", "تبرير التوقف عن الدفع", "مخطط الإنقاذ المقترح", "طلب تعيين وكيل قضائي"],
    inputGuide: "Bilan financier, Liste des créanciers, Causes de la crise, Mesures de redressement.",
    inputGuide_ar: "الميزانية المالية، قائمة الدائنين، أسباب الأزمة، إجراءات التسوية.",
    roles: ['avocat'],
    category: 'CONTENTIEUX',
    complexity: 'HIGH'
  },
  {
    id: 'plan_cession_faillite',
    name: 'Plan de Cession dans le cadre d\'une Liquidation',
    name_ar: 'مخطط التنازل في إطار التصفية القضائية',
    description: 'Organisation de la vente des actifs pour désintéresser les créanciers.',
    description_ar: 'تنظيم بيع الأصول لتسديد الدائنين.',
    prompt: 'Rédige un projet de plan de cession. Détaille la répartition des actifs, l\'ordre de priorité des créanciers et les modalités de transfert des contrats de travail.',
    prompt_ar: 'قم بتحرير مشروع مخطط تنازل. فصل في توزيع الأصول، ترتيب أولويات الدائنين وكيفيات نقل عقود العمل.',
    structure: ["Inventaire des Actifs", "Évaluation des Biens", "Ordre de Distribution des Fonds", "Sort des Salariés", "Calendrier de Cession"],
    structure_ar: ["جرد الأصول", "تقييم الأموال", "ترتيب توزيع الأموال", "مصير العمال", "الجدول الزمني للتنازل"],
    inputGuide: "Valeur des actifs, Liste des dettes prioritaires, Nombre d\'employés.",
    inputGuide_ar: "قيمة الأصول، قائمة الديون ذات الأولوية، عدد العمال.",
    roles: ['avocat', 'magistrat'],
    category: 'DECISION',
    complexity: 'HIGH'
  },

  // --- Droit Maritime et Transport ---
  {
    id: 'contrat_affretement_navire',
    name: 'Contrat d\'Affrètement de Navire (Charter Party)',
    name_ar: 'عقد استئجار سفينة',
    description: 'Contrat de location de navire pour le transport de marchandises.',
    description_ar: 'عقد استئجار سفينة لنقل البضائع.',
    prompt: 'Rédige un contrat d\'affrètement (Time Charter ou Voyage Charter). Précise le fret, les surestaries (demurrage), les conditions de chargement et la responsabilité en cas d\'avarie.',
    prompt_ar: 'قم بتحرير عقد استئجار سفينة (زمني أو رحلة). حدد أجرة الشحن، غرامات التأخير (Surestaries)، شروط الشحن والمسؤولية في حالة التلف.',
    structure: ["Propriétaire et Affréteur", "Désignation du Navire", "Lieu de Chargement et Déchargement", "Fret et Surestaries", "Responsabilités et Assurances", "Droit applicable"],
    structure_ar: ["المالك والمستأجر", "وصف السفينة", "مكان الشحن والتفريغ", "أجرة الشحن وغرامات التأخير", "المسؤوليات والتأمينات", "القانون المطبق"],
    inputGuide: "Type de marchandise, Tonnage, Port de départ/arrivée, Prix du fret.",
    inputGuide_ar: "نوع البضاعة، الحمولة، ميناء القيام/الوصول، سعر الشحن.",
    roles: ['avocat', 'juriste_entreprise'],
    category: 'CONFORMITE',
    complexity: 'HIGH'
  },
  {
    id: 'requete_saisie_navire',
    name: 'Requête en Saisie Conservatoire de Navire',
    name_ar: 'طلب حجز تحفظي لسفينة',
    description: 'Mesure d\'urgence pour immobiliser un navire en cas de créance maritime.',
    description_ar: 'إجراء مستعجل لشل حركة سفينة في حالة وجود دين بحري.',
    prompt: 'Rédige une requête en saisie conservatoire de navire. Justifie la créance maritime et l\'urgence pour éviter que le navire ne quitte les eaux territoriales algériennes.',
    prompt_ar: 'قم بتحرير طلب حجز تحفظي لسفينة. برر الدين البحري والاستعجال لمنع السفينة من مغادرة المياه الإقليمية الجزائرية.',
    structure: ["Tribunal compétent", "Créancier", "Propriétaire du navire", "Nature de la créance maritime", "Identification du navire (IMO)", "Demande de saisie"],
    structure_ar: ["المحكمة المختصة", "الدائن", "مالك السفينة", "طبيعة الدين البحري", "تعريف السفينة (IMO)", "طلب الحجز"],
    inputGuide: "Nom du navire, IMO, Montant de la créance, Preuve du contrat de transport.",
    inputGuide_ar: "اسم السفينة، رقم IMO، مبلغ الدين، إثبات عقد النقل.",
    roles: ['avocat'],
    category: 'CONTENTIEUX',
    complexity: 'HIGH'
  },

  // ==========================================================================================
  // 🏛️ MAGISTRATS : LA DÉCISION ET LA MOTIVATION
  // ==========================================================================================

  {
    id: 'ordonnance_refere',
    name: 'Ordonnance de Référé',
    name_ar: 'أمر استعجالي',
    description: 'Décision rapide prise en urgence pour prévenir un dommage imminent.',
    description_ar: 'قرار سريع يتخذ في حالة الاستعجال لمنع ضرر وشيك.',
    prompt: 'Rédige une ordonnance de référé. Justifie l\'urgence et le péril imminent, et prononce la mesure conservatoire.',
    prompt_ar: 'قم بتحرير أمر استعجالي. برر حالة الاستعجال والخطر الوشيك، واقضِ بالتدبير التحفظي.',
    structure: ["Tribunal", "Parties", "Urgence constatée", "Analyse du péril", "Le Dispositif (L\'Ordonnance)"],
    structure_ar: ["المحكمة", "الأطراف", "الاستعجال المثبت", "تحليل الخطر", "المنطوق (الأمر)"],
    inputGuide: "Fait urgent, Préjudice imminent, Mesure demandée.",
    inputGuide_ar: "الواقعة المستعجلة، الضرر الوشيك، التدبير المطلوب.",
    roles: ['magistrat'],
    category: 'DECISION',
    complexity: 'MEDIUM'
  },
  {
    id: 'jugement_fond_motivé',
    name: 'Jugement de Fond Motivé',
    name_ar: 'حكم في الموضوع مسبب',
    description: 'Décision finale tranchant le litige après instruction complète.',
    description_ar: 'قرار نهائي يفصل في النزاع بعد تحقيق كامل.',
    prompt: 'Rédige un jugement de fond. Développe une motivation juridique rigoureuse en répondant à chaque moyen soulevé par les parties.',
    prompt_ar: 'قم بتحرير حكم في الموضوع. طور تسبيباً قانونياً صارماً بالرد على كل وسيلة أثارها الخصوم.',
    structure: ["L\'identité du Tribunal", "Rappel des faits et procédures", "Analyse des arguments", "Motivation juridique", "Le Dispositif"],
    structure_ar: ["هوية المحكمة", "تذكير بالوقائع والإجراءات", "تحليل الحجج", "التسبيب القانوني", "المنطوق"],
    inputGuide: "faits, Arguments des parties, Lois applicables, Décision finale.",
    inputGuide_ar: "الوقائع، حجج الأطراف، القوانين المطبقة، القرار النهائي.",
    roles: ['magistrat'],
    category: 'DECISION',
    complexity: 'HIGH'
  }
];
