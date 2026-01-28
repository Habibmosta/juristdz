
import { DocumentTemplate } from "./types";

export const UI_TRANSLATIONS = {
  fr: {
    sidebar_title: "JuristDZ",
    sidebar_subtitle: "IA Cabinet Avocat",
    menu_dashboard: "Tableau de Bord",
    menu_research: "Recherche (V1)",
    menu_drafting: "Rédaction (V2)",
    menu_analysis: "Audit (V2)",
    menu_cases: "Dossiers (V2)",
    menu_main: "MENU PRINCIPAL",
    menu_help: "Centre d'Aide",
    menu_billing: "Abonnement",
    menu_admin: "Administration",
    menu_share: "Partager l'accès",
    share_success: "Lien de test copié !",
    mode_secure: "Mode Sécurisé",
    mode_secure_desc: "Vos échanges sont privés. Vérifiez toujours avec les textes officiels (JORA).",
    
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
    menu_research: "بحث سريع (V1)",
    menu_drafting: "تحريرActe (V2)",
    menu_analysis: "تدقيق (V2)",
    menu_cases: "ملفاتي (V2)",
    menu_main: "القائمة الرئيسية",
    menu_help: "مركز المساعدة",
    menu_billing: "اشتراكي",
    menu_admin: "لوحة التحكم",
    menu_share: "مشاركة الرابط",
    share_success: "تم نسخ الرابط بنجاح!",
    mode_secure: "وضع آمن",
    mode_secure_desc: "محادثاتك خاصة. يرجى دائماً التحقق من الجريدة الرسمية.",

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
  {
    id: 'mise_en_demeure',
    name: 'Mise en Demeure',
    name_ar: 'إعــــذار (Mise en Demeure)',
    description: 'Sommation de payer ou d\'exécuter une obligation.',
    description_ar: 'تنبيه بالوفاء بدين أو تنفيذ التزام قبل المتابعة القضائية.',
    prompt: 'Rédige une mise en demeure formelle selon le droit algérien pour : ',
    prompt_ar: 'قم بتحرير إعذار رسمي (Mise en demeure) وفق القانون الجزائري للحالة التالية: ',
    structure: ["En-tête", "Identité créancier/débiteur", "Objet : MISE EN DEMEURE", "Exposé des faits", "Sommation", "Délai", "Signature"],
    structure_ar: ["الرأسية (المحامي/المحضر)", "هوية العارض (الدائن)", "هوية المعروض ضده (المدين)", "الموضوع: إعــــذار", "وقائع موجزة", "التكليف بالوفاء", "المهلة الممنوحة", "تنبيه بالمتابعة القضائية", "الإمضاء"],
    inputGuide: "Nom client, Adversaire, Nature dette, Montant, Délai.",
    inputGuide_ar: "اسم الموكل، اسم الخصم، طبيعة الدين (فاتورة، إيجار)، المبلغ، وتاريخ الاستحقاق."
  },
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
    inputGuide_ar: "المحكمة، الزوج والزوجة، نوع الطلاق (تطليق، خلع، تراضي)، الطلبات الفرعية."
  },
  {
    id: 'contrat_travail',
    name: 'Contrat de Travail (CDI)',
    name_ar: 'عقد عمل غير محدد المدة (CDI)',
    description: 'Contrat de travail conforme à la loi 90-11.',
    description_ar: 'عقد عمل خاضع للقانون 90-11 المتعلق بعلاقات العمل.',
    prompt: 'Rédige un contrat de travail CDI selon la loi 90-11 algérienne : ',
    prompt_ar: 'قم بتحرير عقد عمل غير محدد المدة (CDI) وفق القانون 90-11 الجزائري: ',
    structure: ["Employeur/Salarié", "Poste et Missions", "Lieu de travail", "Rémunération", "Période d'essai", "Congés", "Signatures"],
    structure_ar: ["تحديد الأطراف (المستخدم/العامل)", "المنصب والمهام", "مكان العمل", "الأجر والمنح", "فترة التجربة", "العطل والراحة", "التوقيعات"],
    inputGuide: "Entreprise, Salarié, Poste, Salaire.",
    inputGuide_ar: "اسم الشركة، اسم العامل، المنصب، الراتب الأساسي."
  }
];
