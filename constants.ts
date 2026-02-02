
import { DocumentTemplate } from "./types";

export const UI_TRANSLATIONS = {
  fr: {
    sidebar_title: "JuristDZ",
    sidebar_subtitle: "IA Cabinet Avocat",
    menu_dashboard: "Tableau de Bord",
    menu_research: "Recherche Juridique",
    menu_drafting: "Rédaction",
    menu_analysis: "Analyse",
    menu_cases: "Dossiers",
    menu_admin: "Administration",
    menu_docs: "Documentation",
    menu_main: "MENU PRINCIPAL",
    menu_help: "Centre d'Aide",
    menu_billing: "Abonnement",
    menu_share: "Partager l'accès",
    share_success: "Lien de test copié !",
    mode_secure: "Mode Sécurisé",
    mode_secure_desc: "Données protégées et chiffrées. Vérifiez toujours avec le JORA.",
    
    dash_welcome: "Bonjour Maître,",
    dash_subtitle: "Bienvenue dans votre cabinet numérique.",
    dash_v1_title: "Assistant IA (V1)",
    dash_v1_desc: "Posez vos questions juridiques rapides et consultez la jurisprudence.",
    dash_v2_title: "Espace Professionnel (V2)",
    dash_v2_desc: "Gérez vos clients, rédigez vos actes et auditez vos dossiers complexes.",
    dash_btn_chat: "Lancer un Chat",
    dash_btn_case: "Ouvrir un Dossier",
    
    case_title: "Gestion des Affaires",
    case_subtitle: "Organisez vos recherches par dossier client.",
    case_new: "Nouveau Dossier",
    case_empty: "Aucun dossier actif.",
    case_client: "Client",
    case_status: "Statut",
    case_date: "Ouverture",
    
    draft_title: "Rédaction d'Actes",
    draft_subtitle: "Sélectionnez un modèle pour commencer.",
    draft_edit_mode: "Mode Édition",
    draft_preview_mode: "Aperçu Final",
    draft_btn_generate: "Générer le Document",
    draft_btn_generating: "Rédaction en cours...",
    draft_generated: "Document Prêt",
    draft_copy: "Copier le texte",
    draft_print: "Imprimer l'Acte",

    chat_header: "Recherche Juridique",
    chat_subtitle: "Expertise Droit Algérien",
    chat_loading: "Consultation des bases de données...",
    chat_placeholder: "Posez votre question (ex: Procédure de divorce par khol)...",
    chat_welcome: "Bienvenue Maître. Je suis prêt à vous assister dans vos recherches juridiques algériennes.",
    chat_source: "Sources Lexales",
    
    analysis_title: "Audit de Documents",
    analysis_subtitle: "Détection de risques et analyse de clauses.",
    analysis_ph: "Collez le texte juridique ici ou téléchargez une image pour analyse...",
    analysis_waiting_title: "Document requis",
    analysis_waiting_desc: "Téléchargez ou collez le document pour lancer l'audit IA.",
    analysis_btn_start: "Lancer l'Audit",
    analysis_btn_running: "Audit en cours...",
    analysis_task_risk: "Risques",
    analysis_task_summary: "Synthèse",
    analysis_task_clauses: "Clauses"
  },
  ar: {
    sidebar_title: "محامي دي زاد",
    sidebar_subtitle: "ذكاء اصطناعي للمحاماة",
    menu_dashboard: "لوحة التحكم",
    menu_research: "بحث قانوني",
    menu_drafting: "تحرير",
    menu_analysis: "تحليل",
    menu_cases: "ملفات",
    menu_admin: "إدارة",
    menu_docs: "وثائق",
    menu_main: "القائمة الرئيسية",
    menu_help: "مركز المساعدة",
    menu_billing: "اشتراكي",
    menu_share: "مشاركة الرابط",
    share_success: "تم نسخ الرابط بنجاح!",
    mode_secure: "وضع آمن",
    mode_secure_desc: "جميع البيانات محمية ومشفرة. تحقق دائماً من الجريدة الرسمية.",

    dash_welcome: "أهلاً بك يا أستاذ،",
    dash_subtitle: "مرحباً بك في مكتبك الرقمي المطور.",
    dash_v1_title: "مساعد الذكاء الاصطناعي (V1)",
    dash_v1_desc: "اطرح أسئلتك القانونية السريعة واطلع على الاجتهادات القضائية.",
    dash_v2_title: "المساحة الاحترافية (V2)",
    dash_v2_desc: "سير ملفات الموكلين، حرر العقود وقم بتدقيق الوثائق المعقدة.",
    dash_btn_chat: "بدء محادثة",
    dash_btn_case: "فتح ملف قضائي",

    case_title: "تسيير القضايا",
    case_subtitle: "نظم أبحاثك حسب ملفات الموكلين.",
    case_new: "ملف جديد",
    case_empty: "لا توجد ملفات نشطة.",
    case_client: "الموكل",
    case_status: "الحالة",
    case_date: "تاريخ الافتتاح",

    draft_title: "تحرير العقود والعرائض",
    draft_subtitle: "اختر نموذجاً للبدء.",
    draft_edit_mode: "وضع التحرير",
    draft_preview_mode: "المعاينة النهائية",
    draft_btn_generate: "إنشاء الوثيقة",
    draft_btn_generating: "جارٍ التحرير...",
    draft_generated: "الوثيقة جاهزة",
    draft_copy: "نسخ النص",
    draft_print: "طباعة الوثيقة",

    chat_header: "بحث قانوني",
    chat_subtitle: "خبرة في القانون الجزائري",
    chat_loading: "جارٍ فحص القواعد القانونية...",
    chat_placeholder: "اطرح سؤالك القانوني (مثال: إجراءات الطلاق بالخلع)...",
    chat_welcome: "أهلاً بك يا أستاذ. أنا مستعد لمساعدتك في أبحاثك القانونية الجزائرية.",
    chat_source: "المصادر القانونية",

    analysis_title: "تدقيق المستندات",
    analysis_subtitle: "كشف المخاطر وتحليل البنود.",
    analysis_ph: "الصق النص القانوني هنا أو قم بتحميل صورة للتدقيق...",
    analysis_waiting_title: "المستند مطلوب",
    analysis_waiting_desc: "قم برفع أو لصق المستند لبدء التدقيق بالذكاء الاصطناعي.",
    analysis_btn_start: "بدء التدقيق",
    analysis_btn_running: "جارٍ التدقيق...",
    analysis_task_risk: "المخاطر",
    analysis_task_summary: "ملخص",
    analysis_task_clauses: "البنود"
  }
};

export const SYSTEM_INSTRUCTION_RESEARCH = `
Tu es JuristDZ, une intelligence artificielle experte en droit algérien.
Tes connaissances couvrent la Constitution Algérienne, le Code Civil, le Code Pénal, le Code de la Famille, le Code de Commerce, etc.
Règles :
1. Professionnel, précis, structuré (utilise des listes).
2. Cite toujours les articles de loi algériens (ex: Article 124 du Code Civil).
3. Adapte-toi à la langue de l'utilisateur (Arabe ou Français).
4. Si l'information est incertaine, suggère de vérifier le JORA.
`;

export const SYSTEM_INSTRUCTION_DRAFTING = `
Tu es un expert en rédaction d'actes juridiques algériens (avocat/notaire).
Produis des documents prêts à l'impression avec des mentions légales standard en Algérie.
Si la question est en arabe, utilise un arabe littéraire juridique soutenu.
Respecte la mise en forme formelle (Tribunal, Objet, Attendu que, Par ces motifs).
`;

export const SYSTEM_INSTRUCTION_ANALYSIS = `
Tu es un analyste juridique spécialisé dans l'audit de contrats et de jugements en Algérie.
Ta mission est de protéger les intérêts de l'avocat en détectant les clauses léonines ou les erreurs de procédure.
`;

export const TEMPLATES: DocumentTemplate[] = [
  // ==================== TEMPLATES POUR AVOCAT ====================
  
  // === DROIT DE LA FAMILLE ===
  {
    id: 'requete_divorce',
    name: 'Requête de Divorce',
    name_ar: 'عريضة افتتاح دعوى طلاق',
    description: 'Requête pour le tribunal (Famille).',
    description_ar: 'عريضة لافتتاح دعوى فك الرابطة الزوجية (شؤون الأسرة).',
    prompt: 'Rédige une requête de divorce selon le Code de la Famille : ',
    prompt_ar: 'قم بتحرير عريضة افتتاح دعوى طلاق وفق قانون الأسرة الجزائري: ',
    structure: ["Tribunal", "Parties", "Exposé des faits", "Dispositif (Demandes)", "Pièces jointes"],
    structure_ar: ["الجهة القضائية (محكمة شؤون الأسرة)", "المدعي والمدعى عليه", "عرض الوقائع", "الطلبات (الطلاق، الحضانة، النفقة)", "قائمة المستندات"],
    inputGuide: "Tribunal, Époux, Type divorce (Khol, etc).",
    inputGuide_ar: "المحكمة، الزوج والزوجة، نوع الطلاق (تطليق، خلع، تراضي)، الطلبات الفرعية.",
    roles: ['avocat']
  },
  {
    id: 'requete_pension_alimentaire',
    name: 'Requête Pension Alimentaire',
    name_ar: 'عريضة طلب نفقة',
    description: 'Demande de pension alimentaire pour enfants ou épouse.',
    description_ar: 'طلب نفقة للأطفال أو الزوجة.',
    prompt: 'Rédige une requête de pension alimentaire selon le Code de la Famille : ',
    prompt_ar: 'قم بتحرير عريضة طلب نفقة وفق قانون الأسرة: ',
    structure: ["Tribunal", "Demandeur", "Débiteur", "Besoins", "Ressources", "Montant"],
    structure_ar: ["المحكمة", "الطالب", "المدين", "الحاجيات", "الموارد", "المبلغ"],
    inputGuide: "Bénéficiaire, Débiteur, Revenus, Charges.",
    inputGuide_ar: "المستفيد، المدين، الدخل، الأعباء.",
    roles: ['avocat']
  },
  {
    id: 'requete_garde_enfants',
    name: 'Requête Garde d\'Enfants',
    name_ar: 'عريضة طلب حضانة',
    description: 'Demande de garde ou modification de garde.',
    description_ar: 'طلب حضانة أو تعديل الحضانة.',
    prompt: 'Rédige une requête de garde d\'enfants selon le Code de la Famille : ',
    prompt_ar: 'قم بتحرير عريضة طلب حضانة وفق قانون الأسرة: ',
    structure: ["Tribunal", "Parents", "Enfants", "Intérêt de l'enfant", "Conditions", "Demandes"],
    structure_ar: ["المحكمة", "الوالدان", "الأطفال", "مصلحة الطفل", "الشروط", "الطلبات"],
    inputGuide: "Enfants, Âges, Situation des parents.",
    inputGuide_ar: "الأطفال، الأعمار، وضعية الوالدين.",
    roles: ['avocat']
  },
  {
    id: 'requete_succession',
    name: 'Requête en Succession',
    name_ar: 'عريضة ميراث',
    description: 'Demande de partage successoral ou contestation.',
    description_ar: 'طلب قسمة تركة أو منازعة في الميراث.',
    prompt: 'Rédige une requête en matière successorale selon le droit algérien : ',
    prompt_ar: 'قم بتحرير عريضة في مسائل الميراث وفق القانون الجزائري: ',
    structure: ["Tribunal", "Héritiers", "Défunt", "Patrimoine", "Partage", "Contestations"],
    structure_ar: ["المحكمة", "الورثة", "المتوفى", "التركة", "القسمة", "المنازعات"],
    inputGuide: "Défunt, Héritiers, Biens, Contestations.",
    inputGuide_ar: "المتوفى، الورثة، الأموال، المنازعات.",
    roles: ['avocat']
  },

  // === DROIT CIVIL ===
  {
    id: 'conclusions_civiles',
    name: 'Conclusions Civiles',
    name_ar: 'مذكرة دفاع مدنية',
    description: 'Mémoire de défense ou demande devant tribunal civil.',
    description_ar: 'مذكرة دفاع أو طلب أمام المحكمة المدنية.',
    prompt: 'Rédige des conclusions civiles selon la procédure algérienne : ',
    prompt_ar: 'قم بتحرير مذكرة دفاع مدنية وفق الإجراءات الجزائرية: ',
    structure: ["Tribunal", "Parties", "En fait", "En droit", "Par ces motifs"],
    structure_ar: ["المحكمة", "الأطراف", "في الوقائع", "في القانون", "لهذه الأسباب"],
    inputGuide: "Affaire, Arguments factuels et juridiques.",
    inputGuide_ar: "القضية، الحجج الواقعية والقانونية.",
    roles: ['avocat']
  },
  {
    id: 'assignation_civile',
    name: 'Assignation Civile',
    name_ar: 'كلف بالحضور مدني',
    description: 'Citation à comparaître devant tribunal civil.',
    description_ar: 'استدعاء للمثول أمام المحكمة المدنية.',
    prompt: 'Rédige une assignation civile selon le Code de Procédure Civile : ',
    prompt_ar: 'قم بتحرير كلف بالحضور مدني وفق قانون الإجراءات المدنية: ',
    structure: ["Huissier", "Demandeur", "Défendeur", "Objet", "Tribunal", "Date"],
    structure_ar: ["المحضر", "المدعي", "المدعى عليه", "الموضوع", "المحكمة", "التاريخ"],
    inputGuide: "Parties, Objet du litige, Tribunal compétent.",
    inputGuide_ar: "الأطراف، موضوع النزاع، المحكمة المختصة.",
    roles: ['avocat']
  },
  {
    id: 'requete_dommages_interets',
    name: 'Requête Dommages-Intérêts',
    name_ar: 'عريضة طلب تعويض',
    description: 'Demande de réparation de préjudice.',
    description_ar: 'طلب تعويض عن ضرر.',
    prompt: 'Rédige une requête en dommages-intérêts selon le Code Civil : ',
    prompt_ar: 'قم بتحرير عريضة طلب تعويض وفق القانون المدني: ',
    structure: ["Tribunal", "Victime", "Responsable", "Faute", "Préjudice", "Lien causal", "Évaluation"],
    structure_ar: ["المحكمة", "المضرور", "المسؤول", "الخطأ", "الضرر", "الرابطة السببية", "التقييم"],
    inputGuide: "Faits, Préjudice subi, Responsable, Montant.",
    inputGuide_ar: "الوقائع، الضرر المتكبد، المسؤول، المبلغ.",
    roles: ['avocat']
  },
  {
    id: 'requete_expulsion',
    name: 'Requête d\'Expulsion',
    name_ar: 'عريضة طرد',
    description: 'Demande d\'expulsion de locataire.',
    description_ar: 'طلب طرد مستأجر.',
    prompt: 'Rédige une requête d\'expulsion selon la législation algérienne : ',
    prompt_ar: 'قم بتحرير عريضة طرد وفق التشريع الجزائري: ',
    structure: ["Tribunal", "Bailleur", "Locataire", "Bail", "Manquements", "Demandes"],
    structure_ar: ["المحكمة", "المؤجر", "المستأجر", "عقد الإيجار", "الإخلالات", "الطلبات"],
    inputGuide: "Propriétaire, Locataire, Motifs d'expulsion.",
    inputGuide_ar: "المالك، المستأجر، أسباب الطرد.",
    roles: ['avocat']
  },

  // === DROIT PÉNAL ===
  {
    id: 'requete_penale',
    name: 'Requête Pénale',
    name_ar: 'عريضة جزائية',
    description: 'Constitution de partie civile ou plainte.',
    description_ar: 'تكوين طرف مدني أو شكوى جزائية.',
    prompt: 'Rédige une requête pénale selon le Code de Procédure Pénale : ',
    prompt_ar: 'قم بتحرير عريضة جزائية وفق قانون الإجراءات الجزائية: ',
    structure: ["Parquet/Tribunal", "Plaignant", "Faits", "Qualification", "Demandes"],
    structure_ar: ["النيابة/المحكمة", "المشتكي", "الوقائع", "التكييف القانوني", "الطلبات"],
    inputGuide: "Infraction, Préjudice, Preuves.",
    inputGuide_ar: "الجريمة، الضرر، الأدلة.",
    roles: ['avocat']
  },
  {
    id: 'constitution_partie_civile',
    name: 'Constitution de Partie Civile',
    name_ar: 'تكوين طرف مدني',
    description: 'Se constituer partie civile dans une procédure pénale.',
    description_ar: 'تكوين طرف مدني في إجراءات جزائية.',
    prompt: 'Rédige une constitution de partie civile selon le CPP : ',
    prompt_ar: 'قم بتحرير تكوين طرف مدني وفق قانون الإجراءات الجزائية: ',
    structure: ["Juridiction", "Victime", "Infraction", "Préjudice", "Demandes", "Pièces"],
    structure_ar: ["الجهة القضائية", "الضحية", "الجريمة", "الضرر", "الطلبات", "المستندات"],
    inputGuide: "Victime, Infraction, Préjudice matériel/moral.",
    inputGuide_ar: "الضحية، الجريمة، الضرر المادي/المعنوي.",
    roles: ['avocat']
  },
  {
    id: 'memoire_defense_penale',
    name: 'Mémoire de Défense Pénale',
    name_ar: 'مذكرة دفاع جزائية',
    description: 'Plaidoirie écrite en matière pénale.',
    description_ar: 'مرافعة مكتوبة في المسائل الجزائية.',
    prompt: 'Rédige un mémoire de défense pénale selon la procédure algérienne : ',
    prompt_ar: 'قم بتحرير مذكرة دفاع جزائية وفق الإجراءات الجزائرية: ',
    structure: ["Juridiction", "Prévenu", "Faits reprochés", "Moyens de défense", "Demandes"],
    structure_ar: ["الجهة القضائية", "المتهم", "الوقائع المنسوبة", "وسائل الدفاع", "الطلبات"],
    inputGuide: "Accusé, Charges, Moyens de défense, Circonstances.",
    inputGuide_ar: "المتهم، التهم، وسائل الدفاع، الظروف.",
    roles: ['avocat']
  },

  // === DROIT COMMERCIAL ===
  {
    id: 'requete_commerciale',
    name: 'Requête Commerciale',
    name_ar: 'عريضة تجارية',
    description: 'Litige entre commerçants ou sociétés.',
    description_ar: 'نزاع بين التجار أو الشركات.',
    prompt: 'Rédige une requête commerciale selon le Code de Commerce : ',
    prompt_ar: 'قم بتحرير عريضة تجارية وفق القانون التجاري: ',
    structure: ["Tribunal de Commerce", "Parties", "Relation commerciale", "Litige", "Demandes"],
    structure_ar: ["المحكمة التجارية", "الأطراف", "العلاقة التجارية", "النزاع", "الطلبات"],
    inputGuide: "Entreprises, Contrat, Litige, Montants.",
    inputGuide_ar: "الشركات، العقد، النزاع، المبالغ.",
    roles: ['avocat']
  },
  {
    id: 'requete_faillite',
    name: 'Requête en Faillite',
    name_ar: 'عريضة إفلاس',
    description: 'Demande d\'ouverture de procédure collective.',
    description_ar: 'طلب فتح إجراءات جماعية.',
    prompt: 'Rédige une requête en faillite selon le droit algérien : ',
    prompt_ar: 'قم بتحرير عريضة إفلاس وفق القانون الجزائري: ',
    structure: ["Tribunal", "Débiteur", "Créanciers", "Situation financière", "Demandes"],
    structure_ar: ["المحكمة", "المدين", "الدائنون", "الوضعية المالية", "الطلبات"],
    inputGuide: "Entreprise débitrice, Dettes, Créanciers.",
    inputGuide_ar: "الشركة المدينة، الديون، الدائنون.",
    roles: ['avocat']
  },

  // === DROIT ADMINISTRATIF ===
  {
    id: 'recours_administratif',
    name: 'Recours Administratif',
    name_ar: 'طعن إداري',
    description: 'Contestation d\'acte administratif.',
    description_ar: 'طعن في قرار إداري.',
    prompt: 'Rédige un recours administratif selon le droit algérien : ',
    prompt_ar: 'قم بتحرير طعن إداري وفق القانون الجزائري: ',
    structure: ["Juridiction", "Requérant", "Administration", "Acte contesté", "Moyens", "Demandes"],
    structure_ar: ["الجهة القضائية", "الطاعن", "الإدارة", "القرار المطعون فيه", "الوسائل", "الطلبات"],
    inputGuide: "Administration, Acte contesté, Motifs d'illégalité.",
    inputGuide_ar: "الإدارة، القرار المطعون فيه، أسباب عدم المشروعية.",
    roles: ['avocat']
  },

  // === PROCÉDURES D'URGENCE ===
  {
    id: 'requete_refere',
    name: 'Requête en Référé',
    name_ar: 'عريضة استعجال',
    description: 'Demande de mesures urgentes.',
    description_ar: 'طلب تدابير عاجلة.',
    prompt: 'Rédige une requête en référé selon la procédure d\'urgence : ',
    prompt_ar: 'قم بتحرير عريضة استعجال وفق إجراءات الاستعجال: ',
    structure: ["Juge des référés", "Demandeur", "Urgence", "Mesures", "Justification"],
    structure_ar: ["قاضي الأمور المستعجلة", "الطالب", "الاستعجال", "التدابير", "التبرير"],
    inputGuide: "Urgence, Mesures demandées, Justification.",
    inputGuide_ar: "الاستعجال، التدابير المطلوبة، التبرير.",
    roles: ['avocat']
  }
];

// TEMPLATES POUR NOTAIRE
export const NOTAIRE_TEMPLATES: DocumentTemplate[] = [
  // === ACTES DE VENTE ===
  {
    id: 'acte_vente_immobiliere',
    name: 'Acte de Vente Immobilière',
    name_ar: 'عقد بيع عقاري',
    description: 'Acte authentique de vente d\'un bien immobilier.',
    description_ar: 'عقد رسمي لبيع عقار.',
    prompt: 'Rédige un acte de vente immobilière authentique selon le droit algérien : ',
    prompt_ar: 'قم بتحرير عقد بيع عقاري رسمي وفق القانون الجزائري: ',
    structure: ["Comparution", "Désignation du bien", "Prix", "Conditions", "Formalités"],
    structure_ar: ["المثول", "وصف العقار", "الثمن", "الشروط", "الإجراءات"],
    inputGuide: "Vendeur, Acheteur, Bien, Prix, Localisation.",
    inputGuide_ar: "البائع، المشتري، العقار، الثمن، الموقع.",
    roles: ['notaire']
  },
  {
    id: 'acte_vente_mobiliere',
    name: 'Acte de Vente Mobilière',
    name_ar: 'عقد بيع منقول',
    description: 'Vente de biens meubles (véhicules, fonds de commerce).',
    description_ar: 'بيع أموال منقولة (مركبات، محل تجاري).',
    prompt: 'Rédige un acte de vente mobilière selon le droit algérien : ',
    prompt_ar: 'قم بتحرير عقد بيع منقول وفق القانون الجزائري: ',
    structure: ["Parties", "Bien vendu", "Prix", "Garanties", "Livraison"],
    structure_ar: ["الأطراف", "المال المبيع", "الثمن", "الضمانات", "التسليم"],
    inputGuide: "Bien mobilier, État, Prix, Garanties.",
    inputGuide_ar: "المال المنقول، الحالة، الثمن، الضمانات.",
    roles: ['notaire']
  },
  {
    id: 'acte_vente_fonds_commerce',
    name: 'Acte de Vente Fonds de Commerce',
    name_ar: 'عقد بيع محل تجاري',
    description: 'Cession de fonds de commerce avec clientèle.',
    description_ar: 'تنازل عن محل تجاري مع الزبائن.',
    prompt: 'Rédige un acte de vente de fonds de commerce selon le Code de Commerce : ',
    prompt_ar: 'قم بتحرير عقد بيع محل تجاري وفق القانون التجاري: ',
    structure: ["Cédant", "Cessionnaire", "Fonds", "Éléments", "Prix", "Garanties", "Publicité"],
    structure_ar: ["المتنازل", "المتنازل له", "المحل", "العناصر", "الثمن", "الضمانات", "الإشهار"],
    inputGuide: "Fonds de commerce, Éléments, Chiffre d'affaires, Prix.",
    inputGuide_ar: "المحل التجاري، العناصر، رقم الأعمال، الثمن.",
    roles: ['notaire']
  },

  // === TESTAMENTS ET SUCCESSIONS ===
  {
    id: 'testament_authentique',
    name: 'Testament Authentique',
    name_ar: 'وصية رسمية',
    description: 'Testament reçu par acte authentique.',
    description_ar: 'وصية محررة بعقد رسمي.',
    prompt: 'Rédige un testament authentique selon le droit algérien : ',
    prompt_ar: 'قم بتحرير وصية رسمية وفق القانون الجزائري: ',
    structure: ["Testateur", "Dispositions", "Légataires", "Exécuteur", "Formalités"],
    structure_ar: ["الموصي", "التصرفات", "الموصى لهم", "منفذ الوصية", "الإجراءات"],
    inputGuide: "Testateur, Biens, Héritiers, Dispositions spéciales.",
    inputGuide_ar: "الموصي، الأموال، الورثة، التصرفات الخاصة.",
    roles: ['notaire']
  },
  {
    id: 'testament_olographe_depot',
    name: 'Dépôt Testament Olographe',
    name_ar: 'إيداع وصية بخط اليد',
    description: 'Dépôt et authentification d\'un testament olographe.',
    description_ar: 'إيداع وتوثيق وصية مكتوبة بخط اليد.',
    prompt: 'Rédige un acte de dépôt de testament olographe : ',
    prompt_ar: 'قم بتحرير عقد إيداع وصية بخط اليد: ',
    structure: ["Déposant", "Testament", "Vérifications", "Conservation", "Formalités"],
    structure_ar: ["المودع", "الوصية", "التحققات", "الحفظ", "الإجراءات"],
    inputGuide: "Testateur, Testament manuscrit, Témoins.",
    inputGuide_ar: "الموصي، الوصية المخطوطة، الشهود.",
    roles: ['notaire']
  },
  {
    id: 'acte_partage_successoral',
    name: 'Acte de Partage Successoral',
    name_ar: 'عقد قسمة تركة',
    description: 'Partage des biens entre héritiers.',
    description_ar: 'قسمة الأموال بين الورثة.',
    prompt: 'Rédige un acte de partage successoral selon le droit algérien : ',
    prompt_ar: 'قم بتحرير عقد قسمة تركة وفق القانون الجزائري: ',
    structure: ["Héritiers", "Défunt", "Inventaire", "Évaluation", "Lots", "Attribution"],
    structure_ar: ["الورثة", "المتوفى", "الجرد", "التقييم", "الحصص", "التوزيع"],
    inputGuide: "Héritiers, Biens successoraux, Évaluations.",
    inputGuide_ar: "الورثة، أموال التركة، التقييمات.",
    roles: ['notaire']
  },

  // === CONTRATS DE MARIAGE ET FAMILLE ===
  {
    id: 'contrat_mariage',
    name: 'Contrat de Mariage',
    name_ar: 'عقد زواج',
    description: 'Acte de mariage et régime matrimonial.',
    description_ar: 'عقد زواج ونظام الأموال بين الزوجين.',
    prompt: 'Rédige un contrat de mariage selon le Code de la Famille : ',
    prompt_ar: 'قم بتحرير عقد زواج وفق قانون الأسرة: ',
    structure: ["Époux", "Régime matrimonial", "Donations", "Conditions", "Témoins"],
    structure_ar: ["الزوجان", "نظام الأموال", "الهبات", "الشروط", "الشهود"],
    inputGuide: "Époux, Régime souhaité, Biens apportés.",
    inputGuide_ar: "الزوجان، النظام المالي المرغوب، الأموال المجلبة.",
    roles: ['notaire']
  },
  {
    id: 'changement_regime_matrimonial',
    name: 'Changement Régime Matrimonial',
    name_ar: 'تغيير النظام المالي للزواج',
    description: 'Modification du régime matrimonial.',
    description_ar: 'تعديل النظام المالي بين الزوجين.',
    prompt: 'Rédige un acte de changement de régime matrimonial : ',
    prompt_ar: 'قم بتحرير عقد تغيير النظام المالي للزواج: ',
    structure: ["Époux", "Régime actuel", "Nouveau régime", "Motifs", "Liquidation"],
    structure_ar: ["الزوجان", "النظام الحالي", "النظام الجديد", "الأسباب", "التصفية"],
    inputGuide: "Époux, Régime actuel, Nouveau régime souhaité.",
    inputGuide_ar: "الزوجان، النظام الحالي، النظام الجديد المرغوب.",
    roles: ['notaire']
  },

  // === DONATIONS ===
  {
    id: 'donation_entre_epoux',
    name: 'Donation Entre Époux',
    name_ar: 'هبة بين الزوجين',
    description: 'Donation entre époux (au dernier vivant).',
    description_ar: 'هبة بين الزوجين (للباقي على قيد الحياة).',
    prompt: 'Rédige une donation entre époux selon le droit algérien : ',
    prompt_ar: 'قم بتحرير هبة بين الزوجين وفق القانون الجزائري: ',
    structure: ["Donateur", "Donataire", "Biens donnés", "Conditions", "Révocabilité"],
    structure_ar: ["الواهب", "الموهوب له", "الأموال الموهوبة", "الشروط", "قابلية الإلغاء"],
    inputGuide: "Époux donateur, Biens donnés, Conditions.",
    inputGuide_ar: "الزوج الواهب، الأموال الموهوبة، الشروط.",
    roles: ['notaire']
  },
  {
    id: 'donation_partage',
    name: 'Donation-Partage',
    name_ar: 'هبة-قسمة',
    description: 'Donation avec partage anticipé entre héritiers.',
    description_ar: 'هبة مع قسمة مسبقة بين الورثة.',
    prompt: 'Rédige une donation-partage selon le droit algérien : ',
    prompt_ar: 'قم بتحرير هبة-قسمة وفق القانون الجزائري: ',
    structure: ["Donateur", "Donataires", "Biens", "Lots", "Égalité", "Rapport"],
    structure_ar: ["الواهب", "الموهوب لهم", "الأموال", "الحصص", "المساواة", "الرد"],
    inputGuide: "Donateur, Héritiers, Biens à partager.",
    inputGuide_ar: "الواهب، الورثة، الأموال المراد قسمتها.",
    roles: ['notaire']
  },
  {
    id: 'donation_simple',
    name: 'Donation Simple',
    name_ar: 'هبة بسيطة',
    description: 'Donation ordinaire entre vifs.',
    description_ar: 'هبة عادية بين الأحياء.',
    prompt: 'Rédige une donation simple selon le Code Civil : ',
    prompt_ar: 'قم بتحرير هبة بسيطة وفق القانون المدني: ',
    structure: ["Donateur", "Donataire", "Bien donné", "Acceptation", "Charges"],
    structure_ar: ["الواهب", "الموهوب له", "المال الموهوب", "القبول", "الأعباء"],
    inputGuide: "Donateur, Bénéficiaire, Bien donné, Charges.",
    inputGuide_ar: "الواهب، المستفيد، المال الموهوب، الأعباء.",
    roles: ['notaire']
  },

  // === SOCIÉTÉS ===
  {
    id: 'constitution_sarl',
    name: 'Constitution SARL',
    name_ar: 'تأسيس شركة ذات مسؤولية محدودة',
    description: 'Acte constitutif de SARL.',
    description_ar: 'عقد تأسيس شركة ذات مسؤولية محدودة.',
    prompt: 'Rédige un acte de constitution de SARL selon le Code de Commerce : ',
    prompt_ar: 'قم بتحرير عقد تأسيس شركة ذات مسؤولية محدودة وفق القانون التجاري: ',
    structure: ["Associés", "Dénomination", "Objet", "Capital", "Gérance", "Statuts"],
    structure_ar: ["الشركاء", "التسمية", "الغرض", "رأس المال", "الإدارة", "القانون الأساسي"],
    inputGuide: "Associés, Capital, Objet social, Gérant.",
    inputGuide_ar: "الشركاء، رأس المال، الغرض الاجتماعي، المسير.",
    roles: ['notaire']
  },
  {
    id: 'constitution_spa',
    name: 'Constitution SPA',
    name_ar: 'تأسيس شركة مساهمة',
    description: 'Acte constitutif de Société par Actions.',
    description_ar: 'عقد تأسيس شركة مساهمة.',
    prompt: 'Rédige un acte de constitution de SPA selon le Code de Commerce : ',
    prompt_ar: 'قم بتحرير عقد تأسيس شركة مساهمة وفق القانون التجاري: ',
    structure: ["Fondateurs", "Capital", "Actions", "Conseil d'administration", "Statuts"],
    structure_ar: ["المؤسسون", "رأس المال", "الأسهم", "مجلس الإدارة", "القانون الأساسي"],
    inputGuide: "Fondateurs, Capital social, Nombre d'actions.",
    inputGuide_ar: "المؤسسون، رأس المال الاجتماعي، عدد الأسهم.",
    roles: ['notaire']
  },
  {
    id: 'cession_parts_sociales',
    name: 'Cession de Parts Sociales',
    name_ar: 'تنازل عن حصص اجتماعية',
    description: 'Cession de parts dans une société.',
    description_ar: 'تنازل عن حصص في شركة.',
    prompt: 'Rédige un acte de cession de parts sociales : ',
    prompt_ar: 'قم بتحرير عقد تنازل عن حصص اجتماعية: ',
    structure: ["Cédant", "Cessionnaire", "Société", "Parts cédées", "Prix", "Agrément"],
    structure_ar: ["المتنازل", "المتنازل له", "الشركة", "الحصص المتنازل عنها", "الثمن", "الموافقة"],
    inputGuide: "Cédant, Cessionnaire, Parts, Prix, Société.",
    inputGuide_ar: "المتنازل، المتنازل له، الحصص، الثمن، الشركة.",
    roles: ['notaire']
  },

  // === PROCURATIONS ===
  {
    id: 'procuration_generale',
    name: 'Procuration Générale',
    name_ar: 'وكالة عامة',
    description: 'Procuration pour tous actes d\'administration.',
    description_ar: 'وكالة لجميع أعمال الإدارة.',
    prompt: 'Rédige une procuration générale selon le droit algérien : ',
    prompt_ar: 'قم بتحرير وكالة عامة وفق القانون الجزائري: ',
    structure: ["Mandant", "Mandataire", "Pouvoirs", "Durée", "Révocation"],
    structure_ar: ["الموكل", "الوكيل", "الصلاحيات", "المدة", "الإلغاء"],
    inputGuide: "Mandant, Mandataire, Étendue des pouvoirs.",
    inputGuide_ar: "الموكل، الوكيل، نطاق الصلاحيات.",
    roles: ['notaire']
  },
  {
    id: 'procuration_speciale',
    name: 'Procuration Spéciale',
    name_ar: 'وكالة خاصة',
    description: 'Procuration pour acte déterminé.',
    description_ar: 'وكالة لعمل محدد.',
    prompt: 'Rédige une procuration spéciale selon le droit algérien : ',
    prompt_ar: 'قم بتحرير وكالة خاصة وفق القانون الجزائري: ',
    structure: ["Mandant", "Mandataire", "Acte spécifique", "Conditions", "Limites"],
    structure_ar: ["الموكل", "الوكيل", "العمل المحدد", "الشروط", "الحدود"],
    inputGuide: "Mandant, Mandataire, Acte précis à accomplir.",
    inputGuide_ar: "الموكل، الوكيل، العمل المحدد المراد إنجازه.",
    roles: ['notaire']
  },

  // === PRÊTS ET GARANTIES ===
  {
    id: 'reconnaissance_dette',
    name: 'Reconnaissance de Dette',
    name_ar: 'إقرار بالدين',
    description: 'Acte constatant une créance.',
    description_ar: 'عقد إثبات دين.',
    prompt: 'Rédige une reconnaissance de dette selon le Code Civil : ',
    prompt_ar: 'قم بتحرير إقرار بالدين وفق القانون المدني: ',
    structure: ["Débiteur", "Créancier", "Montant", "Cause", "Modalités", "Intérêts"],
    structure_ar: ["المدين", "الدائن", "المبلغ", "السبب", "الطرق", "الفوائد"],
    inputGuide: "Débiteur, Créancier, Montant, Échéance.",
    inputGuide_ar: "المدين، الدائن، المبلغ، تاريخ الاستحقاق.",
    roles: ['notaire']
  },
  {
    id: 'hypotheque_conventionnelle',
    name: 'Hypothèque Conventionnelle',
    name_ar: 'رهن رسمي اتفاقي',
    description: 'Constitution d\'hypothèque sur immeuble.',
    description_ar: 'إنشاء رهن رسمي على عقار.',
    prompt: 'Rédige un acte d\'hypothèque conventionnelle : ',
    prompt_ar: 'قم بتحرير عقد رهن رسمي اتفاقي: ',
    structure: ["Débiteur", "Créancier", "Immeuble", "Créance", "Rang", "Inscription"],
    structure_ar: ["المدين", "الدائن", "العقار", "الدين", "المرتبة", "القيد"],
    inputGuide: "Débiteur, Créancier, Immeuble, Montant garanti.",
    inputGuide_ar: "المدين، الدائن، العقار، المبلغ المضمون.",
    roles: ['notaire']
  },

  // === BAUX ET LOCATIONS ===
  {
    id: 'bail_commercial',
    name: 'Bail Commercial',
    name_ar: 'عقد إيجار تجاري',
    description: 'Contrat de location commerciale.',
    description_ar: 'عقد إيجار لأغراض تجارية.',
    prompt: 'Rédige un bail commercial selon le droit algérien : ',
    prompt_ar: 'قم بتحرير عقد إيجار تجاري وفق القانون الجزائري: ',
    structure: ["Bailleur", "Preneur", "Local", "Loyer", "Durée", "Charges", "Renouvellement"],
    structure_ar: ["المؤجر", "المستأجر", "المحل", "الأجرة", "المدة", "الأعباء", "التجديد"],
    inputGuide: "Propriétaire, Locataire, Local commercial, Loyer.",
    inputGuide_ar: "المالك، المستأجر، المحل التجاري، الأجرة.",
    roles: ['notaire']
  },
  {
    id: 'bail_habitation',
    name: 'Bail d\'Habitation',
    name_ar: 'عقد إيجار سكني',
    description: 'Contrat de location à usage d\'habitation.',
    description_ar: 'عقد إيجار للاستعمال السكني.',
    prompt: 'Rédige un bail d\'habitation selon le droit algérien : ',
    prompt_ar: 'قم بتحرير عقد إيجار سكني وفق القانون الجزائري: ',
    structure: ["Bailleur", "Locataire", "Logement", "Loyer", "Charges", "Dépôt de garantie", "Durée"],
    structure_ar: ["المؤجر", "المستأجر", "المسكن", "الأجرة", "الأعباء", "التأمين", "المدة"],
    inputGuide: "Propriétaire, Locataire, Logement, Loyer mensuel.",
    inputGuide_ar: "المالك، المستأجر، المسكن، الأجرة الشهرية.",
    roles: ['notaire']
  },
  {
    id: 'bail_emphyteotique',
    name: 'Bail Emphytéotique',
    name_ar: 'عقد حكر',
    description: 'Bail de très longue durée sur terrain.',
    description_ar: 'عقد إيجار طويل المدى على أرض.',
    prompt: 'Rédige un bail emphytéotique selon le droit algérien : ',
    prompt_ar: 'قم بتحرير عقد حكر وفق القانون الجزائري: ',
    structure: ["Bailleur", "Emphytéote", "Terrain", "Redevance", "Durée", "Constructions", "Obligations"],
    structure_ar: ["المؤجر", "المحتكر", "الأرض", "الإتاوة", "المدة", "البناءات", "الالتزامات"],
    inputGuide: "Propriétaire, Emphytéote, Terrain, Redevance annuelle.",
    inputGuide_ar: "المالك، المحتكر، الأرض، الإتاوة السنوية.",
    roles: ['notaire']
  },

  // === ACTES DIVERS ===
  {
    id: 'certificat_heredite',
    name: 'Certificat d\'Hérédité',
    name_ar: 'شهادة وراثة',
    description: 'Acte établissant la qualité d\'héritier.',
    description_ar: 'عقد إثبات صفة الوارث.',
    prompt: 'Rédige un certificat d\'hérédité selon le droit algérien : ',
    prompt_ar: 'قم بتحرير شهادة وراثة وفق القانون الجزائري: ',
    structure: ["Défunt", "Héritiers", "Filiation", "Parts héréditaires", "Certification"],
    structure_ar: ["المتوفى", "الورثة", "النسب", "الأنصبة الشرعية", "الشهادة"],
    inputGuide: "Défunt, Héritiers, Liens de parenté, Biens.",
    inputGuide_ar: "المتوفى، الورثة، صلة القرابة، الأموال.",
    roles: ['notaire']
  },
  {
    id: 'acte_notoriete',
    name: 'Acte de Notoriété',
    name_ar: 'عقد شهرة',
    description: 'Constatation de faits notoires.',
    description_ar: 'إثبات وقائع مشهورة.',
    prompt: 'Rédige un acte de notoriété selon le droit algérien : ',
    prompt_ar: 'قم بتحرير عقد شهرة وفق القانون الجزائري: ',
    structure: ["Comparants", "Faits", "Témoignages", "Notoriété", "Certification"],
    structure_ar: ["الحاضرون", "الوقائع", "الشهادات", "الشهرة", "التوثيق"],
    inputGuide: "Faits à établir, Témoins, Preuves.",
    inputGuide_ar: "الوقائع المراد إثباتها، الشهود، الأدلة.",
    roles: ['notaire']
  },
  {
    id: 'inventaire_succession',
    name: 'Inventaire de Succession',
    name_ar: 'جرد تركة',
    description: 'Inventaire détaillé des biens successoraux.',
    description_ar: 'جرد مفصل لأموال التركة.',
    prompt: 'Rédige un inventaire de succession selon le droit algérien : ',
    prompt_ar: 'قم بتحرير جرد تركة وفق القانون الجزائري: ',
    structure: ["Défunt", "Héritiers", "Biens immobiliers", "Biens mobiliers", "Dettes", "Évaluation"],
    structure_ar: ["المتوفى", "الورثة", "العقارات", "المنقولات", "الديون", "التقييم"],
    inputGuide: "Défunt, Héritiers, Liste des biens, Évaluations.",
    inputGuide_ar: "المتوفى، الورثة، قائمة الأموال، التقييمات.",
    roles: ['notaire']
  },
  {
    id: 'mainlevee_hypotheque',
    name: 'Mainlevée d\'Hypothèque',
    name_ar: 'رفع الرهن الرسمي',
    description: 'Radiation d\'inscription hypothécaire.',
    description_ar: 'شطب قيد الرهن الرسمي.',
    prompt: 'Rédige une mainlevée d\'hypothèque selon le droit algérien : ',
    prompt_ar: 'قم بتحرير رفع رهن رسمي وفق القانون الجزائري: ',
    structure: ["Créancier", "Débiteur", "Immeuble", "Hypothèque", "Extinction", "Radiation"],
    structure_ar: ["الدائن", "المدين", "العقار", "الرهن", "الانقضاء", "الشطب"],
    inputGuide: "Créancier, Débiteur, Immeuble, Hypothèque éteinte.",
    inputGuide_ar: "الدائن، المدين، العقار، الرهن المنقضي.",
    roles: ['notaire']
  },
  {
    id: 'bail_commercial_algerian',
    name: 'Bail Commercial Algérien',
    name_ar: 'عقد إيجار تجاري جزائري',
    description: 'Contrat de bail commercial selon le droit algérien.',
    description_ar: 'عقد إيجار تجاري وفق القانون الجزائري.',
    prompt: 'Rédige un bail commercial selon le droit algérien : ',
    prompt_ar: 'قم بتحرير عقد إيجار تجاري وفق القانون الجزائري: ',
    structure: ["Bailleur", "Preneur", "Local", "Loyer", "Durée", "Renouvellement"],
    structure_ar: ["المؤجر", "المستأجر", "المحل", "الأجرة", "المدة", "التجديد"],
    inputGuide: "Propriétaire, Locataire, Local, Loyer, Durée.",
    inputGuide_ar: "المالك، المستأجر، المحل، الأجرة، المدة.",
    roles: ['notaire']
  },
  {
    id: 'bail_emphyteotique',
    name: 'Bail Emphytéotique',
    name_ar: 'عقد إيجار طويل الأمد',
    description: 'Bail de très longue durée (18-99 ans).',
    description_ar: 'عقد إيجار طويل جداً (18-99 سنة).',
    prompt: 'Rédige un bail emphytéotique selon le droit algérien : ',
    prompt_ar: 'قم بتحرير عقد إيجار طويل الأمد وفق القانون الجزائري: ',
    structure: ["Bailleur", "Emphytéote", "Immeuble", "Redevance", "Améliorations", "Durée"],
    structure_ar: ["المؤجر", "المستأجر طويل الأمد", "العقار", "الإتاوة", "التحسينات", "المدة"],
    inputGuide: "Propriétaire, Emphytéote, Terrain, Redevance, Durée.",
    inputGuide_ar: "المالك، المستأجر طويل الأمد، الأرض، الإتاوة، المدة.",
    roles: ['notaire']
  }
];

// TEMPLATES POUR HUISSIER
export const HUISSIER_TEMPLATES: DocumentTemplate[] = [
  // === SOMMATIONS ET MISES EN DEMEURE ===
  {
    id: 'mise_en_demeure',
    name: 'Mise en Demeure',
    name_ar: 'إعــــذار',
    description: 'Sommation de payer ou d\'exécuter une obligation.',
    description_ar: 'تنبيه بالوفاء بدين أو تنفيذ التزام قبل المتابعة القضائية.',
    prompt: 'Rédige une mise en demeure formelle selon le droit algérien pour : ',
    prompt_ar: 'قم بتحرير إعذار رسمي وفق القانون الجزائري للحالة التالية: ',
    structure: ["En-tête", "Identité créancier/débiteur", "Objet : MISE EN DEMEURE", "Exposé des faits", "Sommation", "Délai", "Signature"],
    structure_ar: ["الرأسية", "هوية الدائن/المدين", "الموضوع: إعــــذار", "وقائع موجزة", "التكليف بالوفاء", "المهلة", "الإمضاء"],
    inputGuide: "Nom client, Adversaire, Nature dette, Montant, Délai.",
    inputGuide_ar: "اسم الموكل، اسم الخصم، طبيعة الدين، المبلغ، المهلة.",
    roles: ['huissier']
  },
  {
    id: 'sommation_payer',
    name: 'Sommation de Payer',
    name_ar: 'تكليف بالدفع',
    description: 'Commandement de payer une dette liquide et exigible.',
    description_ar: 'أمر بدفع دين سائل ومستحق الأداء.',
    prompt: 'Rédige une sommation de payer selon le Code de Procédure Civile : ',
    prompt_ar: 'قم بتحرير تكليف بالدفع وفق قانون الإجراءات المدنية: ',
    structure: ["Huissier", "Créancier", "Débiteur", "Créance", "Commandement", "Délai", "Saisie"],
    structure_ar: ["المحضر", "الدائن", "المدين", "الدين", "الأمر", "المهلة", "الحجز"],
    inputGuide: "Créancier, Débiteur, Montant dû, Titre exécutoire.",
    inputGuide_ar: "الدائن، المدين، المبلغ المستحق، السند التنفيذي.",
    roles: ['huissier']
  },
  {
    id: 'sommation_quitter_lieux',
    name: 'Sommation de Quitter les Lieux',
    name_ar: 'تكليف بإخلاء الأماكن',
    description: 'Commandement d\'expulsion de locataire.',
    description_ar: 'أمر بطرد المستأجر من العقار.',
    prompt: 'Rédige une sommation de quitter les lieux selon la législation algérienne : ',
    prompt_ar: 'قم بتحرير تكليف بإخلاء الأماكن وفق التشريع الجزائري: ',
    structure: ["Huissier", "Bailleur", "Locataire", "Bail", "Manquements", "Commandement", "Délai"],
    structure_ar: ["المحضر", "المؤجر", "المستأجر", "عقد الإيجار", "الإخلالات", "الأمر", "المهلة"],
    inputGuide: "Propriétaire, Locataire, Motifs d'expulsion, Délai.",
    inputGuide_ar: "المالك، المستأجر، أسباب الطرد، المهلة.",
    roles: ['huissier']
  },

  // === SIGNIFICATIONS ===
  {
    id: 'exploit_signification',
    name: 'Exploit de Signification',
    name_ar: 'محضر تبليغ',
    description: 'Signification d\'acte judiciaire ou extrajudiciaire.',
    description_ar: 'تبليغ عمل قضائي أو خارج عن القضاء.',
    prompt: 'Rédige un exploit de signification selon le Code de Procédure Civile : ',
    prompt_ar: 'قم بتحرير محضر تبليغ وفق قانون الإجراءات المدنية: ',
    structure: ["Huissier", "Destinataire", "Acte à signifier", "Modalités", "Certification"],
    structure_ar: ["المحضر القضائي", "المبلغ إليه", "العمل المبلغ", "طريقة التبليغ", "الشهادة"],
    inputGuide: "Acte à signifier, Destinataire, Adresse.",
    inputGuide_ar: "العمل المراد تبليغه، المبلغ إليه، العنوان.",
    roles: ['huissier']
  },
  {
    id: 'signification_jugement',
    name: 'Signification de Jugement',
    name_ar: 'تبليغ حكم',
    description: 'Signification d\'une décision de justice.',
    description_ar: 'تبليغ قرار قضائي.',
    prompt: 'Rédige une signification de jugement selon la procédure algérienne : ',
    prompt_ar: 'قم بتحرير تبليغ حكم وفق الإجراءات الجزائرية: ',
    structure: ["Huissier", "Tribunal", "Parties", "Jugement", "Signification", "Voies de recours"],
    structure_ar: ["المحضر", "المحكمة", "الأطراف", "الحكم", "التبليغ", "طرق الطعن"],
    inputGuide: "Tribunal, Parties, Date jugement, Dispositif.",
    inputGuide_ar: "المحكمة، الأطراف، تاريخ الحكم، المنطوق.",
    roles: ['huissier']
  },
  {
    id: 'signification_assignation',
    name: 'Signification d\'Assignation',
    name_ar: 'تبليغ كلف بالحضور',
    description: 'Signification d\'une citation à comparaître.',
    description_ar: 'تبليغ استدعاء للمثول.',
    prompt: 'Rédige une signification d\'assignation selon le CPC : ',
    prompt_ar: 'قم بتحرير تبليغ كلف بالحضور وفق قانون الإجراءات المدنية: ',
    structure: ["Huissier", "Demandeur", "Défendeur", "Assignation", "Tribunal", "Date audience"],
    structure_ar: ["المحضر", "المدعي", "المدعى عليه", "الكلف بالحضور", "المحكمة", "تاريخ الجلسة"],
    inputGuide: "Demandeur, Défendeur, Tribunal, Date audience.",
    inputGuide_ar: "المدعي، المدعى عليه، المحكمة، تاريخ الجلسة.",
    roles: ['huissier']
  },

  // === CONSTATS ===
  {
    id: 'pv_constat',
    name: 'PV de Constat',
    name_ar: 'محضر معاينة',
    description: 'Procès-verbal de constatation matérielle.',
    description_ar: 'محضر معاينة مادية للوقائع.',
    prompt: 'Rédige un PV de constat selon les règles de l\'huissier : ',
    prompt_ar: 'قم بتحرير محضر معاينة وفق قواعد المحضر القضائي: ',
    structure: ["Huissier", "Lieu", "Constatations", "Témoins", "Certification"],
    structure_ar: ["المحضر", "المكان", "المعاينات", "الشهود", "الشهادة"],
    inputGuide: "Lieu, Faits à constater, Témoins éventuels.",
    inputGuide_ar: "المكان، الوقائع المراد معاينتها، الشهود المحتملون.",
    roles: ['huissier']
  },
  {
    id: 'constat_degats',
    name: 'Constat de Dégâts',
    name_ar: 'محضر معاينة أضرار',
    description: 'Constatation de dommages matériels.',
    description_ar: 'معاينة الأضرار المادية.',
    prompt: 'Rédige un constat de dégâts selon la procédure d\'huissier : ',
    prompt_ar: 'قم بتحرير محضر معاينة أضرار وفق إجراءات المحضر: ',
    structure: ["Huissier", "Lieu", "Dégâts", "Causes", "Évaluation", "Photos"],
    structure_ar: ["المحضر", "المكان", "الأضرار", "الأسباب", "التقييم", "الصور"],
    inputGuide: "Lieu des dégâts, Nature des dommages, Causes.",
    inputGuide_ar: "مكان الأضرار، طبيعة الأضرار، الأسباب.",
    roles: ['huissier']
  },
  {
    id: 'constat_etat_lieux',
    name: 'Constat d\'État des Lieux',
    name_ar: 'محضر معاينة حالة الأماكن',
    description: 'Constatation de l\'état d\'un bien immobilier.',
    description_ar: 'معاينة حالة عقار.',
    prompt: 'Rédige un constat d\'état des lieux selon les règles notariales : ',
    prompt_ar: 'قم بتحرير محضر معاينة حالة الأماكن وفق القواعد التوثيقية: ',
    structure: ["Huissier", "Bien", "État général", "Détails par pièce", "Équipements", "Observations"],
    structure_ar: ["المحضر", "العقار", "الحالة العامة", "تفاصيل كل غرفة", "التجهيزات", "الملاحظات"],
    inputGuide: "Adresse du bien, Type (entrée/sortie), Parties présentes.",
    inputGuide_ar: "عنوان العقار، النوع (دخول/خروج)، الأطراف الحاضرة.",
    roles: ['huissier']
  },

  // === SAISIES ===
  {
    id: 'pv_saisie_mobiliere',
    name: 'PV de Saisie Mobilière',
    name_ar: 'محضر حجز منقولات',
    description: 'Saisie de biens meubles du débiteur.',
    description_ar: 'حجز أموال منقولة للمدين.',
    prompt: 'Rédige un PV de saisie mobilière selon le Code de Procédure Civile : ',
    prompt_ar: 'قم بتحرير محضر حجز منقولات وفق قانون الإجراءات المدنية: ',
    structure: ["Huissier", "Créancier", "Débiteur", "Titre", "Biens saisis", "Gardien", "Vente"],
    structure_ar: ["المحضر", "الدائن", "المدين", "السند", "الأموال المحجوزة", "الحارس", "البيع"],
    inputGuide: "Créancier, Débiteur, Titre exécutoire, Biens à saisir.",
    inputGuide_ar: "الدائن، المدين، السند التنفيذي، الأموال المراد حجزها.",
    roles: ['huissier']
  },
  {
    id: 'pv_saisie_immobiliere',
    name: 'PV de Saisie Immobilière',
    name_ar: 'محضر حجز عقاري',
    description: 'Saisie d\'un bien immobilier.',
    description_ar: 'حجز عقار.',
    prompt: 'Rédige un PV de saisie immobilière selon la procédure algérienne : ',
    prompt_ar: 'قم بتحرير محضر حجز عقاري وفق الإجراءات الجزائرية: ',
    structure: ["Huissier", "Créancier", "Débiteur", "Immeuble", "Saisie", "Publicité", "Vente"],
    structure_ar: ["المحضر", "الدائن", "المدين", "العقار", "الحجز", "الإشهار", "البيع"],
    inputGuide: "Créancier, Débiteur, Immeuble, Titre exécutoire.",
    inputGuide_ar: "الدائن، المدين، العقار، السند التنفيذي.",
    roles: ['huissier']
  },
  {
    id: 'pv_saisie_arret',
    name: 'PV de Saisie-Arrêt',
    name_ar: 'محضر حجز لدى الغير',
    description: 'Saisie de créances entre les mains d\'un tiers.',
    description_ar: 'حجز ديون لدى الغير.',
    prompt: 'Rédige un PV de saisie-arrêt selon le droit algérien : ',
    prompt_ar: 'قم بتحرير محضر حجز لدى الغير وفق القانون الجزائري: ',
    structure: ["Huissier", "Créancier", "Débiteur", "Tiers saisi", "Créances", "Déclaration"],
    structure_ar: ["المحضر", "الدائن", "المدين", "الغير المحجوز لديه", "الديون", "التصريح"],
    inputGuide: "Créancier, Débiteur, Tiers saisi (banque, employeur).",
    inputGuide_ar: "الدائن، المدين، الغير المحجوز لديه (بنك، مستخدم).",
    roles: ['huissier']
  },

  // === EXPULSIONS ===
  {
    id: 'pv_expulsion',
    name: 'PV d\'Expulsion',
    name_ar: 'محضر طرد',
    description: 'Procès-verbal d\'expulsion de locataire.',
    description_ar: 'محضر طرد مستأجر.',
    prompt: 'Rédige un PV d\'expulsion selon la procédure algérienne : ',
    prompt_ar: 'قم بتحرير محضر طرد وفق الإجراءات الجزائرية: ',
    structure: ["Huissier", "Jugement", "Propriétaire", "Locataire", "Expulsion", "Biens", "Remise"],
    structure_ar: ["المحضر", "الحكم", "المالك", "المستأجر", "الطرد", "الأموال", "التسليم"],
    inputGuide: "Jugement d'expulsion, Propriétaire, Locataire, Biens.",
    inputGuide_ar: "حكم الطرد، المالك، المستأجر، الأموال.",
    roles: ['huissier']
  },
  {
    id: 'remise_cles',
    name: 'Remise de Clés',
    name_ar: 'تسليم المفاتيح',
    description: 'Procès-verbal de remise de clés.',
    description_ar: 'محضر تسليم المفاتيح.',
    prompt: 'Rédige un PV de remise de clés selon les règles d\'huissier : ',
    prompt_ar: 'قم بتحرير محضر تسليم المفاتيح وفق قواعد المحضر: ',
    structure: ["Huissier", "Remettant", "Bénéficiaire", "Local", "Clés", "État", "Remise"],
    structure_ar: ["المحضر", "المسلم", "المستلم", "المحل", "المفاتيح", "الحالة", "التسليم"],
    inputGuide: "Remettant, Bénéficiaire, Local, Nombre de clés.",
    inputGuide_ar: "المسلم، المستلم، المحل، عدد المفاتيح.",
    roles: ['huissier']
  },

  // === VENTES AUX ENCHÈRES ===
  {
    id: 'pv_vente_encheres',
    name: 'PV de Vente aux Enchères',
    name_ar: 'محضر بيع بالمزاد العلني',
    description: 'Procès-verbal de vente publique aux enchères.',
    description_ar: 'محضر بيع عمومي بالمزايدة.',
    prompt: 'Rédige un PV de vente aux enchères selon la procédure algérienne : ',
    prompt_ar: 'قم بتحرير محضر بيع بالمزاد العلني وفق الإجراءات الجزائرية: ',
    structure: ["Huissier", "Saisie", "Bien", "Enchères", "Adjudication", "Prix", "Acquéreur"],
    structure_ar: ["المحضر", "الحجز", "المال", "المزايدة", "الرسو", "الثمن", "المشتري"],
    inputGuide: "Bien à vendre, Mise à prix, Enchérisseurs, Adjudicataire.",
    inputGuide_ar: "المال المراد بيعه، الثمن الأساسي، المزايدون، الراسي عليه المزاد.",
    roles: ['huissier']
  },
  {
    id: 'cahier_charges_vente',
    name: 'Cahier des Charges de Vente',
    name_ar: 'دفتر شروط البيع',
    description: 'Conditions de vente aux enchères publiques.',
    description_ar: 'شروط البيع بالمزاد العلني.',
    prompt: 'Rédige un cahier des charges de vente selon les règles d\'enchères : ',
    prompt_ar: 'قم بتحرير دفتر شروط البيع وفق قواعد المزايدة: ',
    structure: ["Bien", "Mise à prix", "Conditions", "Modalités", "Garanties", "Frais"],
    structure_ar: ["المال", "الثمن الأساسي", "الشروط", "الطرق", "الضمانات", "المصاريف"],
    inputGuide: "Bien à vendre, Mise à prix, Conditions particulières.",
    inputGuide_ar: "المال المراد بيعه، الثمن الأساسي، الشروط الخاصة.",
    roles: ['huissier']
  },

  // === PROTÊTS ===
  {
    id: 'protêt_cheque',
    name: 'Protêt de Chèque',
    name_ar: 'احتجاج شيك',
    description: 'Constatation de non-paiement d\'un chèque.',
    description_ar: 'إثبات عدم دفع شيك.',
    prompt: 'Rédige un protêt de chèque selon le Code de Commerce : ',
    prompt_ar: 'قم بتحرير احتجاج شيك وفق القانون التجاري: ',
    structure: ["Huissier", "Porteur", "Tiré", "Chèque", "Présentation", "Refus", "Protêt"],
    structure_ar: ["المحضر", "الحامل", "المسحوب عليه", "الشيك", "التقديم", "الرفض", "الاحتجاج"],
    inputGuide: "Porteur du chèque, Banque, Montant, Date émission.",
    inputGuide_ar: "حامل الشيك، البنك، المبلغ، تاريخ الإصدار.",
    roles: ['huissier']
  },
  {
    id: 'protêt_effet_commerce',
    name: 'Protêt d\'Effet de Commerce',
    name_ar: 'احتجاج سند تجاري',
    description: 'Constatation de non-paiement d\'une traite.',
    description_ar: 'إثبات عدم دفع كمبيالة.',
    prompt: 'Rédige un protêt d\'effet de commerce selon le droit commercial : ',
    prompt_ar: 'قم بتحرير احتجاج سند تجاري وفق القانون التجاري: ',
    structure: ["Huissier", "Porteur", "Tiré", "Effet", "Échéance", "Refus", "Protêt"],
    structure_ar: ["المحضر", "الحامل", "المسحوب عليه", "السند", "الاستحقاق", "الرفض", "الاحتجاج"],
    inputGuide: "Porteur, Tiré, Effet de commerce, Échéance.",
    inputGuide_ar: "الحامل، المسحوب عليه، السند التجاري، الاستحقاق.",
    roles: ['huissier']
  }
];

// TEMPLATES POUR MAGISTRAT
export const MAGISTRAT_TEMPLATES: DocumentTemplate[] = [
  // === JUGEMENTS CIVILS ===
  {
    id: 'jugement_civil',
    name: 'Jugement Civil',
    name_ar: 'حكم مدني',
    description: 'Décision de tribunal civil.',
    description_ar: 'قرار محكمة مدنية.',
    prompt: 'Rédige un jugement civil selon la procédure algérienne : ',
    prompt_ar: 'قم بتحرير حكم مدني وفق الإجراءات الجزائرية: ',
    structure: ["Tribunal", "Parties", "Procédure", "Motifs", "Dispositif"],
    structure_ar: ["المحكمة", "الأطراف", "الإجراءات", "الأسباب", "المنطوق"],
    inputGuide: "Affaire, Parties, Prétentions, Moyens.",
    inputGuide_ar: "القضية، الأطراف، الطلبات، الوسائل.",
    roles: ['magistrat']
  },
  {
    id: 'jugement_divorce',
    name: 'Jugement de Divorce',
    name_ar: 'حكم طلاق',
    description: 'Décision de dissolution du mariage.',
    description_ar: 'قرار فك الرابطة الزوجية.',
    prompt: 'Rédige un jugement de divorce selon le Code de la Famille : ',
    prompt_ar: 'قم بتحرير حكم طلاق وفق قانون الأسرة: ',
    structure: ["Tribunal", "Époux", "Motifs", "Divorce", "Conséquences", "Dispositif"],
    structure_ar: ["المحكمة", "الزوجان", "الأسباب", "الطلاق", "الآثار", "المنطوق"],
    inputGuide: "Époux, Type de divorce, Enfants, Biens.",
    inputGuide_ar: "الزوجان، نوع الطلاق، الأطفال، الأموال.",
    roles: ['magistrat']
  },
  {
    id: 'jugement_commercial',
    name: 'Jugement Commercial',
    name_ar: 'حكم تجاري',
    description: 'Décision de tribunal de commerce.',
    description_ar: 'قرار محكمة تجارية.',
    prompt: 'Rédige un jugement commercial selon le Code de Commerce : ',
    prompt_ar: 'قم بتحرير حكم تجاري وفق القانون التجاري: ',
    structure: ["Tribunal", "Parties", "Litige", "Analyse", "Décision"],
    structure_ar: ["المحكمة", "الأطراف", "النزاع", "التحليل", "القرار"],
    inputGuide: "Entreprises, Litige commercial, Montants, Preuves.",
    inputGuide_ar: "الشركات، النزاع التجاري، المبالغ، الأدلة.",
    roles: ['magistrat']
  },

  // === ORDONNANCES ===
  {
    id: 'ordonnance_refere',
    name: 'Ordonnance de Référé',
    name_ar: 'أمر استعجالي',
    description: 'Décision en urgence du juge des référés.',
    description_ar: 'قرار عاجل من قاضي الأمور المستعجلة.',
    prompt: 'Rédige une ordonnance de référé selon la procédure d\'urgence : ',
    prompt_ar: 'قم بتحرير أمر استعجالي وفق إجراءات الاستعجال: ',
    structure: ["Juge", "Demandeur", "Urgence", "Mesures", "Exécution"],
    structure_ar: ["القاضي", "الطالب", "الاستعجال", "التدابير", "التنفيذ"],
    inputGuide: "Urgence, Mesures demandées, Justification.",
    inputGuide_ar: "الاستعجال، التدابير المطلوبة، التبرير.",
    roles: ['magistrat']
  },
  {
    id: 'ordonnance_injonction_payer',
    name: 'Ordonnance d\'Injonction de Payer',
    name_ar: 'أمر أداء',
    description: 'Procédure simplifiée de recouvrement.',
    description_ar: 'إجراء مبسط لاستيفاء الديون.',
    prompt: 'Rédige une ordonnance d\'injonction de payer selon le CPC : ',
    prompt_ar: 'قم بتحرير أمر أداء وفق قانون الإجراءات المدنية: ',
    structure: ["Tribunal", "Créancier", "Débiteur", "Créance", "Injonction"],
    structure_ar: ["المحكمة", "الدائن", "المدين", "الدين", "الأمر"],
    inputGuide: "Créancier, Débiteur, Montant, Justificatifs.",
    inputGuide_ar: "الدائن، المدين، المبلغ، المبررات.",
    roles: ['magistrat']
  },
  {
    id: 'ordonnance_provision',
    name: 'Ordonnance de Provision',
    name_ar: 'أمر بالأداء المؤقت',
    description: 'Allocation d\'une provision en cours d\'instance.',
    description_ar: 'منح مبلغ مؤقت أثناء سير الدعوى.',
    prompt: 'Rédige une ordonnance de provision selon la procédure civile : ',
    prompt_ar: 'قم بتحرير أمر بالأداء المؤقت وفق الإجراءات المدنية: ',
    structure: ["Juge", "Demandeur", "Besoins", "Provision", "Conditions"],
    structure_ar: ["القاضي", "الطالب", "الحاجيات", "المبلغ المؤقت", "الشروط"],
    inputGuide: "Demandeur, Besoins urgents, Montant demandé.",
    inputGuide_ar: "الطالب، الحاجيات العاجلة، المبلغ المطلوب.",
    roles: ['magistrat']
  },

  // === DÉCISIONS PÉNALES ===
  {
    id: 'jugement_penal',
    name: 'Jugement Pénal',
    name_ar: 'حكم جزائي',
    description: 'Décision de tribunal correctionnel.',
    description_ar: 'قرار محكمة جنحية.',
    prompt: 'Rédige un jugement pénal selon le Code de Procédure Pénale : ',
    prompt_ar: 'قم بتحرير حكم جزائي وفق قانون الإجراءات الجزائية: ',
    structure: ["Tribunal", "Prévenu", "Faits", "Qualification", "Peine"],
    structure_ar: ["المحكمة", "المتهم", "الوقائع", "التكييف", "العقوبة"],
    inputGuide: "Prévenu, Infraction, Circonstances, Peine.",
    inputGuide_ar: "المتهم، الجريمة، الظروف، العقوبة.",
    roles: ['magistrat']
  },
  {
    id: 'arret_cour',
    name: 'Arrêt de Cour',
    name_ar: 'قرار محكمة',
    description: 'Décision de cour d\'appel.',
    description_ar: 'قرار محكمة الاستئناف.',
    prompt: 'Rédige un arrêt de cour selon la procédure d\'appel : ',
    prompt_ar: 'قم بتحرير قرار محكمة وفق إجراءات الاستئناف: ',
    structure: ["Cour", "Parties", "Jugement", "Moyens d\'appel", "Décision"],
    structure_ar: ["المحكمة", "الأطراف", "الحكم المستأنف", "أوجه الاستئناف", "القرار"],
    inputGuide: "Jugement attaqué, Moyens d\'appel, Parties.",
    inputGuide_ar: "الحكم المطعون فيه، أوجه الطعن، الأطراف.",
    roles: ['magistrat']
  },

  // === ORDONNANCES ADMINISTRATIVES ===
  {
    id: 'ordonnance_non_lieu',
    name: 'Ordonnance de Non-Lieu',
    name_ar: 'أمر بألا وجه للمتابعة',
    description: 'Décision de classement sans suite.',
    description_ar: 'قرار بحفظ الملف.',
    prompt: 'Rédige une ordonnance de non-lieu selon le CPP : ',
    prompt_ar: 'قم بتحرير أمر بألا وجه للمتابعة وفق قانون الإجراءات الجزائية: ',
    structure: ["Juge", "Affaire", "Enquête", "Motifs", "Non-lieu"],
    structure_ar: ["القاضي", "القضية", "التحقيق", "الأسباب", "عدم المتابعة"],
    inputGuide: "Affaire, Enquête menée, Motifs de classement.",
    inputGuide_ar: "القضية، التحقيق المنجز، أسباب الحفظ.",
    roles: ['magistrat']
  },
  {
    id: 'ordonnance_renvoi',
    name: 'Ordonnance de Renvoi',
    name_ar: 'أمر بالإحالة',
    description: 'Décision de renvoi devant tribunal.',
    description_ar: 'قرار إحالة أمام المحكمة.',
    prompt: 'Rédige une ordonnance de renvoi selon la procédure pénale : ',
    prompt_ar: 'قم بتحرير أمر بالإحالة وفق الإجراءات الجزائية: ',
    structure: ["Juge", "Inculpé", "Charges", "Qualification", "Renvoi"],
    structure_ar: ["القاضي", "المتهم", "التهم", "التكييف", "الإحالة"],
    inputGuide: "Inculpé, Charges retenues, Tribunal compétent.",
    inputGuide_ar: "المتهم، التهم المحتفظ بها، المحكمة المختصة.",
    roles: ['magistrat']
  },

  // === DÉCISIONS FAMILIALES ===
  {
    id: 'jugement_garde',
    name: 'Jugement de Garde',
    name_ar: 'حكم حضانة',
    description: 'Décision sur la garde des enfants.',
    description_ar: 'قرار بشأن حضانة الأطفال.',
    prompt: 'Rédige un jugement de garde selon le Code de la Famille : ',
    prompt_ar: 'قم بتحرير حكم حضانة وفق قانون الأسرة: ',
    structure: ["Tribunal", "Parents", "Enfants", "Intérêt", "Attribution"],
    structure_ar: ["المحكمة", "الوالدان", "الأطفال", "المصلحة", "الإسناد"],
    inputGuide: "Parents, Enfants, Âges, Situation familiale.",
    inputGuide_ar: "الوالدان، الأطفال، الأعمار، الوضعية العائلية.",
    roles: ['magistrat']
  },
  {
    id: 'jugement_pension',
    name: 'Jugement de Pension',
    name_ar: 'حكم نفقة',
    description: 'Décision sur la pension alimentaire.',
    description_ar: 'قرار بشأن النفقة.',
    prompt: 'Rédige un jugement de pension selon le Code de la Famille : ',
    prompt_ar: 'قم بتحرير حكم نفقة وفق قانون الأسرة: ',
    structure: ["Tribunal", "Créancier", "Débiteur", "Besoins", "Ressources", "Montant"],
    structure_ar: ["المحكمة", "المستحق", "المدين", "الحاجيات", "الموارد", "المبلغ"],
    inputGuide: "Bénéficiaire, Débiteur, Revenus, Charges, Enfants.",
    inputGuide_ar: "المستفيد، المدين، الدخل، الأعباء، الأطفال.",
    roles: ['magistrat']
  },

  // === DÉCISIONS SUCCESSORALES ===
  {
    id: 'jugement_succession',
    name: 'Jugement de Succession',
    name_ar: 'حكم ميراث',
    description: 'Décision sur le partage successoral.',
    description_ar: 'قرار بشأن قسمة التركة.',
    prompt: 'Rédige un jugement de succession selon le droit algérien : ',
    prompt_ar: 'قم بتحرير حكم ميراث وفق القانون الجزائري: ',
    structure: ["Tribunal", "Défunt", "Héritiers", "Patrimoine", "Partage"],
    structure_ar: ["المحكمة", "المتوفى", "الورثة", "التركة", "القسمة"],
    inputGuide: "Défunt, Héritiers, Biens successoraux, Contestations.",
    inputGuide_ar: "المتوفى، الورثة، أموال التركة، المنازعات.",
    roles: ['magistrat']
  },

  // === MESURES CONSERVATOIRES ===
  {
    id: 'ordonnance_saisie_conservatoire',
    name: 'Ordonnance de Saisie Conservatoire',
    name_ar: 'أمر حجز تحفظي',
    description: 'Autorisation de saisie conservatoire.',
    description_ar: 'إذن بالحجز التحفظي.',
    prompt: 'Rédige une ordonnance de saisie conservatoire selon le CPC : ',
    prompt_ar: 'قم بتحرير أمر حجز تحفظي وفق قانون الإجراءات المدنية: ',
    structure: ["Juge", "Créancier", "Débiteur", "Créance", "Biens", "Autorisation"],
    structure_ar: ["القاضي", "الدائن", "المدين", "الدين", "الأموال", "الإذن"],
    inputGuide: "Créancier, Débiteur, Créance, Biens à saisir.",
    inputGuide_ar: "الدائن، المدين، الدين، الأموال المراد حجزها.",
    roles: ['magistrat']
  }
];

// TEMPLATES POUR JURISTE D'ENTREPRISE
export const JURISTE_TEMPLATES: DocumentTemplate[] = [
  // === CONTRATS DE TRAVAIL ===
  {
    id: 'contrat_travail_cdi',
    name: 'Contrat de Travail (CDI)',
    name_ar: 'عقد عمل غير محدد المدة',
    description: 'Contrat de travail conforme à la loi 90-11.',
    description_ar: 'عقد عمل خاضع للقانون 90-11 المتعلق بعلاقات العمل.',
    prompt: 'Rédige un contrat de travail CDI selon la loi 90-11 algérienne : ',
    prompt_ar: 'قم بتحرير عقد عمل غير محدد المدة وفق القانون 90-11 الجزائري: ',
    structure: ["Employeur/Salarié", "Poste et Missions", "Lieu de travail", "Rémunération", "Période d'essai", "Congés", "Signatures"],
    structure_ar: ["تحديد الأطراف", "المنصب والمهام", "مكان العمل", "الأجر والمنح", "فترة التجربة", "العطل والراحة", "التوقيعات"],
    inputGuide: "Entreprise, Salarié, Poste, Salaire.",
    inputGuide_ar: "اسم الشركة، اسم العامل، المنصب، الراتب الأساسي.",
    roles: ['juriste_entreprise']
  },
  {
    id: 'contrat_travail_cdd',
    name: 'Contrat de Travail (CDD)',
    name_ar: 'عقد عمل محدد المدة',
    description: 'Contrat de travail à durée déterminée.',
    description_ar: 'عقد عمل محدد المدة.',
    prompt: 'Rédige un contrat de travail CDD selon la loi 90-11 : ',
    prompt_ar: 'قم بتحرير عقد عمل محدد المدة وفق القانون 90-11: ',
    structure: ["Parties", "Motif CDD", "Durée", "Poste", "Rémunération", "Renouvellement"],
    structure_ar: ["الأطراف", "مبرر التوقيت", "المدة", "المنصب", "الأجر", "التجديد"],
    inputGuide: "Entreprise, Salarié, Motif, Durée, Poste.",
    inputGuide_ar: "الشركة، العامل، المبرر، المدة، المنصب.",
    roles: ['juriste_entreprise']
  },
  {
    id: 'avenant_contrat_travail',
    name: 'Avenant au Contrat de Travail',
    name_ar: 'ملحق عقد العمل',
    description: 'Modification du contrat de travail.',
    description_ar: 'تعديل عقد العمل.',
    prompt: 'Rédige un avenant au contrat de travail selon la loi 90-11 : ',
    prompt_ar: 'قم بتحرير ملحق عقد العمل وفق القانون 90-11: ',
    structure: ["Parties", "Contrat initial", "Modifications", "Nouvelles conditions", "Signatures"],
    structure_ar: ["الأطراف", "العقد الأصلي", "التعديلات", "الشروط الجديدة", "التوقيعات"],
    inputGuide: "Employeur, Salarié, Modifications apportées.",
    inputGuide_ar: "المستخدم، العامل، التعديلات المدخلة.",
    roles: ['juriste_entreprise']
  },

  // === CONTRATS COMMERCIAUX ===
  {
    id: 'contrat_commercial',
    name: 'Contrat Commercial',
    name_ar: 'عقد تجاري',
    description: 'Contrat entre entreprises selon le Code de Commerce.',
    description_ar: 'عقد بين الشركات وفق القانون التجاري.',
    prompt: 'Rédige un contrat commercial selon le Code de Commerce algérien : ',
    prompt_ar: 'قم بتحرير عقد تجاري وفق القانون التجاري الجزائري: ',
    structure: ["Parties", "Objet", "Prix", "Livraison", "Garanties", "Résiliation"],
    structure_ar: ["الأطراف", "الموضوع", "الثمن", "التسليم", "الضمانات", "الفسخ"],
    inputGuide: "Entreprises, Produit/Service, Conditions.",
    inputGuide_ar: "الشركات، المنتج/الخدمة، الشروط.",
    roles: ['juriste_entreprise']
  },
  {
    id: 'contrat_distribution',
    name: 'Contrat de Distribution',
    name_ar: 'عقد توزيع',
    description: 'Accord de distribution commerciale.',
    description_ar: 'اتفاقية التوزيع التجاري.',
    prompt: 'Rédige un contrat de distribution selon le droit commercial : ',
    prompt_ar: 'قم بتحرير عقد توزيع وفق القانون التجاري: ',
    structure: ["Fournisseur", "Distributeur", "Produits", "Territoire", "Exclusivité", "Conditions"],
    structure_ar: ["المورد", "الموزع", "المنتجات", "المنطقة", "الحصرية", "الشروط"],
    inputGuide: "Fournisseur, Distributeur, Produits, Zone géographique.",
    inputGuide_ar: "المورد، الموزع، المنتجات، المنطقة الجغرافية.",
    roles: ['juriste_entreprise']
  },
  {
    id: 'contrat_franchise',
    name: 'Contrat de Franchise',
    name_ar: 'عقد امتياز تجاري',
    description: 'Accord de franchise commerciale.',
    description_ar: 'اتفاقية الامتياز التجاري.',
    prompt: 'Rédige un contrat de franchise selon le droit algérien : ',
    prompt_ar: 'قم بتحرير عقد امتياز تجاري وفق القانون الجزائري: ',
    structure: ["Franchiseur", "Franchisé", "Concept", "Redevances", "Formation", "Territoire"],
    structure_ar: ["مانح الامتياز", "المستفيد", "المفهوم", "الإتاوات", "التكوين", "المنطقة"],
    inputGuide: "Franchiseur, Franchisé, Concept, Redevances.",
    inputGuide_ar: "مانح الامتياز، المستفيد، المفهوم، الإتاوات.",
    roles: ['juriste_entreprise']
  },

  // === CONTRATS DE PRESTATION ===
  {
    id: 'contrat_prestation_services',
    name: 'Contrat de Prestation de Services',
    name_ar: 'عقد تقديم خدمات',
    description: 'Contrat de services entre entreprises.',
    description_ar: 'عقد خدمات بين الشركات.',
    prompt: 'Rédige un contrat de prestation de services selon le droit algérien : ',
    prompt_ar: 'قم بتحرير عقد تقديم خدمات وفق القانون الجزائري: ',
    structure: ["Prestataire", "Client", "Services", "Modalités", "Prix", "Responsabilités"],
    structure_ar: ["مقدم الخدمة", "العميل", "الخدمات", "الطرق", "الثمن", "المسؤوليات"],
    inputGuide: "Prestataire, Client, Services, Durée, Prix.",
    inputGuide_ar: "مقدم الخدمة، العميل، الخدمات، المدة، الثمن.",
    roles: ['juriste_entreprise']
  },
  {
    id: 'contrat_maintenance',
    name: 'Contrat de Maintenance',
    name_ar: 'عقد صيانة',
    description: 'Contrat de maintenance technique.',
    description_ar: 'عقد الصيانة التقنية.',
    prompt: 'Rédige un contrat de maintenance selon les standards techniques : ',
    prompt_ar: 'قم بتحرير عقد صيانة وفق المعايير التقنية: ',
    structure: ["Prestataire", "Client", "Équipements", "Interventions", "Garanties", "Tarifs"],
    structure_ar: ["مقدم الخدمة", "العميل", "المعدات", "التدخلات", "الضمانات", "التعريفات"],
    inputGuide: "Prestataire, Client, Équipements, Type maintenance.",
    inputGuide_ar: "مقدم الخدمة، العميل، المعدات، نوع الصيانة.",
    roles: ['juriste_entreprise']
  },

  // === CONTRATS INFORMATIQUES ===
  {
    id: 'contrat_licence_logiciel',
    name: 'Contrat de Licence Logiciel',
    name_ar: 'عقد ترخيص برمجيات',
    description: 'Licence d\'utilisation de logiciel.',
    description_ar: 'ترخيص استخدام البرمجيات.',
    prompt: 'Rédige un contrat de licence logiciel selon le droit de la propriété intellectuelle : ',
    prompt_ar: 'قم بتحرير عقد ترخيص برمجيات وفق قانون الملكية الفكرية: ',
    structure: ["Éditeur", "Utilisateur", "Logiciel", "Droits", "Restrictions", "Support"],
    structure_ar: ["الناشر", "المستخدم", "البرنامج", "الحقوق", "القيود", "الدعم"],
    inputGuide: "Éditeur, Utilisateur, Logiciel, Type de licence.",
    inputGuide_ar: "الناشر، المستخدم، البرنامج، نوع الترخيص.",
    roles: ['juriste_entreprise']
  },
  {
    id: 'contrat_developpement_logiciel',
    name: 'Contrat de Développement Logiciel',
    name_ar: 'عقد تطوير برمجيات',
    description: 'Contrat de développement sur mesure.',
    description_ar: 'عقد التطوير حسب الطلب.',
    prompt: 'Rédige un contrat de développement logiciel selon les standards IT : ',
    prompt_ar: 'قم بتحرير عقد تطوير برمجيات وفق معايير تكنولوجيا المعلومات: ',
    structure: ["Développeur", "Client", "Cahier des charges", "Livraisons", "Propriété", "Maintenance"],
    structure_ar: ["المطور", "العميل", "دفتر الشروط", "التسليمات", "الملكية", "الصيانة"],
    inputGuide: "Développeur, Client, Projet, Spécifications, Budget.",
    inputGuide_ar: "المطور، العميل، المشروع، المواصفات، الميزانية.",
    roles: ['juriste_entreprise']
  },

  // === CONTRATS IMMOBILIERS D'ENTREPRISE ===
  {
    id: 'bail_commercial_entreprise',
    name: 'Bail Commercial d\'Entreprise',
    name_ar: 'عقد إيجار تجاري للشركة',
    description: 'Location de locaux commerciaux pour entreprise.',
    description_ar: 'إيجار محلات تجارية للشركة.',
    prompt: 'Rédige un bail commercial d\'entreprise selon le droit algérien : ',
    prompt_ar: 'قم بتحرير عقد إيجار تجاري للشركة وفق القانون الجزائري: ',
    structure: ["Bailleur", "Société", "Locaux", "Destination", "Loyer", "Charges", "Durée"],
    structure_ar: ["المؤجر", "الشركة", "المحلات", "الغرض", "الأجرة", "الأعباء", "المدة"],
    inputGuide: "Propriétaire, Société, Locaux, Usage, Loyer.",
    inputGuide_ar: "المالك، الشركة، المحلات، الاستعمال، الأجرة.",
    roles: ['juriste_entreprise']
  },
  {
    id: 'promesse_vente_entreprise',
    name: 'Promesse de Vente Immobilière',
    name_ar: 'وعد بالبيع العقاري',
    description: 'Promesse de vente pour acquisition d\'entreprise.',
    description_ar: 'وعد بالبيع لاقتناء الشركة.',
    prompt: 'Rédige une promesse de vente immobilière pour entreprise : ',
    prompt_ar: 'قم بتحرير وعد بالبيع العقاري للشركة: ',
    structure: ["Promettant", "Bénéficiaire", "Bien", "Prix", "Conditions", "Délai"],
    structure_ar: ["الواعد", "المستفيد", "العقار", "الثمن", "الشروط", "المهلة"],
    inputGuide: "Vendeur, Acheteur, Bien, Prix, Conditions suspensives.",
    inputGuide_ar: "البائع، المشتري، العقار، الثمن، الشروط الواقفة.",
    roles: ['juriste_entreprise']
  },

  // === CONTRATS FINANCIERS ===
  {
    id: 'contrat_pret_entreprise',
    name: 'Contrat de Prêt d\'Entreprise',
    name_ar: 'عقد قرض للشركة',
    description: 'Contrat de financement d\'entreprise.',
    description_ar: 'عقد تمويل الشركة.',
    prompt: 'Rédige un contrat de prêt d\'entreprise selon la réglementation bancaire : ',
    prompt_ar: 'قم بتحرير عقد قرض للشركة وفق التنظيم المصرفي: ',
    structure: ["Prêteur", "Emprunteur", "Montant", "Taux", "Garanties", "Remboursement"],
    structure_ar: ["المقرض", "المقترض", "المبلغ", "المعدل", "الضمانات", "التسديد"],
    inputGuide: "Banque, Entreprise, Montant, Taux, Garanties.",
    inputGuide_ar: "البنك، الشركة، المبلغ، المعدل، الضمانات.",
    roles: ['juriste_entreprise']
  },
  {
    id: 'contrat_leasing',
    name: 'Contrat de Leasing',
    name_ar: 'عقد إيجار تمويلي',
    description: 'Contrat de crédit-bail mobilier.',
    description_ar: 'عقد الإيجار التمويلي للمنقولات.',
    prompt: 'Rédige un contrat de leasing selon la réglementation algérienne : ',
    prompt_ar: 'قم بتحرير عقد إيجار تمويلي وفق التنظيم الجزائري: ',
    structure: ["Crédit-bailleur", "Crédit-preneur", "Bien", "Loyers", "Option d'achat", "Assurance"],
    structure_ar: ["المؤجر التمويلي", "المستأجر", "المال", "الأجرة", "خيار الشراء", "التأمين"],
    inputGuide: "Société de leasing, Entreprise, Équipement, Durée.",
    inputGuide_ar: "شركة الإيجار التمويلي، الشركة، المعدات، المدة.",
    roles: ['juriste_entreprise']
  },

  // === CONTRATS DE PARTENARIAT ===
  {
    id: 'accord_partenariat',
    name: 'Accord de Partenariat',
    name_ar: 'اتفاقية شراكة',
    description: 'Accord de coopération entre entreprises.',
    description_ar: 'اتفاقية تعاون بين الشركات.',
    prompt: 'Rédige un accord de partenariat selon le droit des affaires : ',
    prompt_ar: 'قم بتحرير اتفاقية شراكة وفق قانون الأعمال: ',
    structure: ["Partenaires", "Objectifs", "Contributions", "Gouvernance", "Partage", "Durée"],
    structure_ar: ["الشركاء", "الأهداف", "المساهمات", "الحوكمة", "التقاسم", "المدة"],
    inputGuide: "Partenaires, Objectifs communs, Contributions de chacun.",
    inputGuide_ar: "الشركاء، الأهداف المشتركة، مساهمة كل طرف.",
    roles: ['juriste_entreprise']
  },
  {
    id: 'joint_venture',
    name: 'Joint-Venture',
    name_ar: 'مشروع مشترك',
    description: 'Accord de coentreprise.',
    description_ar: 'اتفاقية مشروع مشترك.',
    prompt: 'Rédige un accord de joint-venture selon le droit algérien : ',
    prompt_ar: 'قم بتحرير اتفاقية مشروع مشترك وفق القانون الجزائري: ',
    structure: ["Parties", "Projet", "Apports", "Gestion", "Résultats", "Sortie"],
    structure_ar: ["الأطراف", "المشروع", "المساهمات", "التسيير", "النتائج", "الخروج"],
    inputGuide: "Entreprises, Projet commun, Apports, Répartition.",
    inputGuide_ar: "الشركات، المشروع المشترك، المساهمات، التوزيع.",
    roles: ['juriste_entreprise']
  },

  // === PROPRIÉTÉ INTELLECTUELLE ===
  {
    id: 'contrat_cession_marque',
    name: 'Contrat de Cession de Marque',
    name_ar: 'عقد تنازل عن علامة تجارية',
    description: 'Cession de droits de marque.',
    description_ar: 'تنازل عن حقوق العلامة التجارية.',
    prompt: 'Rédige un contrat de cession de marque selon le droit de la propriété intellectuelle : ',
    prompt_ar: 'قم بتحرير عقد تنازل عن علامة تجارية وفق قانون الملكية الفكرية: ',
    structure: ["Cédant", "Cessionnaire", "Marque", "Droits", "Prix", "Garanties"],
    structure_ar: ["المتنازل", "المتنازل له", "العلامة", "الحقوق", "الثمن", "الضمانات"],
    inputGuide: "Propriétaire, Acquéreur, Marque, Prix, Territoire.",
    inputGuide_ar: "المالك، المشتري، العلامة، الثمن، المنطقة.",
    roles: ['juriste_entreprise']
  },
  {
    id: 'accord_confidentialite',
    name: 'Accord de Confidentialité (NDA)',
    name_ar: 'اتفاقية السرية',
    description: 'Accord de non-divulgation d\'informations.',
    description_ar: 'اتفاقية عدم إفشاء المعلومات.',
    prompt: 'Rédige un accord de confidentialité selon les standards internationaux : ',
    prompt_ar: 'قم بتحرير اتفاقية السرية وفق المعايير الدولية: ',
    structure: ["Parties", "Informations", "Obligations", "Exceptions", "Durée", "Sanctions"],
    structure_ar: ["الأطراف", "المعلومات", "الالتزامات", "الاستثناءات", "المدة", "الجزاءات"],
    inputGuide: "Parties, Type d'informations, Durée de confidentialité.",
    inputGuide_ar: "الأطراف، نوع المعلومات، مدة السرية.",
    roles: ['juriste_entreprise']
  }
];

// TEMPLATES POUR ÉTUDIANT
export const ETUDIANT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'consultation_juridique',
    name: 'Consultation Juridique',
    name_ar: 'استشارة قانونية',
    description: 'Analyse juridique d\'un cas pratique.',
    description_ar: 'تحليل قانوني لحالة عملية.',
    prompt: 'Rédige une consultation juridique selon la méthodologie algérienne : ',
    prompt_ar: 'قم بتحرير استشارة قانونية وفق المنهجية الجزائرية: ',
    structure: ["Faits", "Problème juridique", "Règle applicable", "Application", "Solution"],
    structure_ar: ["الوقائع", "المشكلة القانونية", "القاعدة المطبقة", "التطبيق", "الحل"],
    inputGuide: "Cas pratique, Question juridique posée.",
    inputGuide_ar: "الحالة العملية، السؤال القانوني المطروح.",
    roles: ['etudiant']
  },
  {
    id: 'memoire_recherche',
    name: 'Mémoire de Recherche',
    name_ar: 'مذكرة بحث',
    description: 'Plan et structure de mémoire juridique.',
    description_ar: 'خطة وهيكل مذكرة قانونية.',
    prompt: 'Élabore un plan de mémoire juridique selon les standards académiques : ',
    prompt_ar: 'قم بوضع خطة مذكرة قانونية وفق المعايير الأكاديمية: ',
    structure: ["Introduction", "Problématique", "Plan", "Développement", "Conclusion"],
    structure_ar: ["المقدمة", "الإشكالية", "الخطة", "التطوير", "الخاتمة"],
    inputGuide: "Sujet de recherche, Problématique, Sources.",
    inputGuide_ar: "موضوع البحث، الإشكالية، المصادر.",
    roles: ['etudiant']
  }
];
