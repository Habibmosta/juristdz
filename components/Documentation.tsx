
import React, { useState } from 'react';
import { Language, UserRole } from '../types';
import { Printer, BookOpen, Cpu, Database, UserCheck, ShieldAlert, Terminal, Rocket, Code, ChevronRight, Copy, Check, BarChart3, Coins, CreditCard as BillingIcon, ShieldEllipsis, FlaskConical, SearchCheck, Smartphone, Monitor, Scale, FileText, Gavel, Building2, GraduationCap, Briefcase, Home, MessageSquare, PenTool, FileSearch, HelpCircle, Video, Download, Mail, Clock, Timer } from 'lucide-react';

interface DocumentationProps {
  language: Language;
  userRole?: UserRole;
}

const Documentation: React.FC<DocumentationProps> = ({ language, userRole = UserRole.AVOCAT }) => {
  const isAr = language === 'ar';
  const [activeSection, setActiveSection] = useState<string>('start');
  
  const handlePrint = () => {
    const printContent = document.getElementById('printable-documentation');
    if (printContent) {
      const win = window.open('', '', 'height=800,width=1000');
      if (win) {
        win.document.write('<html><head><title>JuristDZ - Guide Utilisateur</title>');
        win.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        win.document.write('</head><body dir="' + (isAr ? 'rtl' : 'ltr') + '">');
        win.document.write('<div class="p-8">' + printContent.innerHTML + '</div>');
        win.document.write('<script>setTimeout(() => { window.print(); window.close(); }, 800);</script>');
        win.document.close();
      }
    }
  };

  const docTranslations = {
    fr: {
      title: "JuristDZ : Guide Complet",
      subtitle: "Documentation Professionnelle",
      
      // Navigation
      nav_start: "Démarrage",
      nav_features: "Fonctionnalités",
      nav_role_guide: "Guide par Rôle",
      nav_tutorials: "Tutoriels",
      nav_faq: "FAQ",
      nav_support: "Support",
      
      // Section Démarrage
      start_title: "Démarrage Rapide",
      start_welcome: "Bienvenue sur JuristDZ",
      start_desc: "JuristDZ est votre assistant juridique intelligent, conçu spécialement pour les professionnels du droit algérien.",
      
      access_title: "Accès Multi-Plateforme",
      laptop: "Sur Ordinateur",
      laptop_desc: "Ouvrez l'URL dans Chrome, Firefox ou Edge. Utilisez le mode plein écran (F11) pour une expérience immersive.",
      mobile: "Sur Smartphone",
      mobile_desc: "Scannez le lien ou tapez l'URL. Pour une expérience 'App native', utilisez l'option 'Ajouter à l'écran d'accueil' sur iPhone ou Android.",
      tablet: "Sur Tablette",
      tablet_desc: "Interface optimisée pour iPad et tablettes Android. Idéal pour les consultations en déplacement.",
      
      // Fonctionnalités
      features_title: "Fonctionnalités Principales",
      feat_research: "Recherche Juridique IA",
      feat_research_desc: "Recherche intelligente connectée au JORA (Journal Officiel de la République Algérienne). Trouvez instantanément les articles de loi, jurisprudences et textes réglementaires pertinents.",
      feat_research_cost: "Coût: 1 crédit par recherche",
      
      feat_drafting: "Rédaction d'Actes",
      feat_drafting_desc: "Générez des actes juridiques professionnels avec citations automatiques des articles de loi algériens. Templates adaptés à votre profession.",
      feat_drafting_cost: "Coût: 2 crédits par document",
      
      feat_analysis: "Analyse OCR de Documents",
      feat_analysis_desc: "Prenez une photo d'un contrat, jugement ou document juridique. L'IA analyse le contenu, détecte les clauses problématiques et identifie les risques juridiques.",
      feat_analysis_cost: "Coût: 3 crédits par analyse",
      
      // Guides par rôle
      role_guide_title: "Guide Spécifique à Votre Profession",
      
      // Avocat
      avocat_title: "Guide pour Avocats",
      avocat_use1: "Recherche de jurisprudence pour préparer vos plaidoiries",
      avocat_use2: "Rédaction de conclusions, requêtes et mémoires",
      avocat_use3: "Analyse de contrats pour vos clients",
      avocat_use4: "Gestion de dossiers et suivi des affaires",
      avocat_example: "Exemple: Recherchez 'responsabilité médicale' pour obtenir tous les articles pertinents du Code civil et pénal algérien, ainsi que la jurisprudence récente.",
      
      // Notaire
      notaire_title: "Guide pour Notaires",
      notaire_use1: "Vérification de la conformité des actes authentiques",
      notaire_use2: "Rédaction d'actes de vente, donation, succession",
      notaire_use3: "Recherche de textes sur le droit immobilier et foncier",
      notaire_use4: "Analyse de documents cadastraux et titres de propriété",
      notaire_example: "Exemple: Générez un acte de vente immobilière conforme au Code civil algérien avec toutes les mentions obligatoires.",
      
      // Huissier
      huissier_title: "Guide pour Huissiers de Justice",
      huissier_use1: "Rédaction de procès-verbaux de constat",
      huissier_use2: "Préparation de commandements de payer",
      huissier_use3: "Recherche sur les procédures d'exécution",
      huissier_use4: "Analyse de jugements pour exécution forcée",
      huissier_example: "Exemple: Rédigez un commandement de payer conforme au Code de procédure civile et administrative.",
      
      // Magistrat
      magistrat_title: "Guide pour Magistrats",
      magistrat_use1: "Recherche approfondie de jurisprudence",
      magistrat_use2: "Vérification de la conformité des procédures",
      magistrat_use3: "Analyse comparative de décisions similaires",
      magistrat_use4: "Consultation rapide du JORA et textes législatifs",
      magistrat_example: "Exemple: Recherchez la jurisprudence de la Cour Suprême sur un point de droit spécifique.",
      
      // Étudiant
      etudiant_title: "Guide pour Étudiants en Droit",
      etudiant_use1: "Recherche pour vos travaux et mémoires",
      etudiant_use2: "Compréhension des concepts juridiques complexes",
      etudiant_use3: "Préparation d'exercices pratiques (cas pratiques)",
      etudiant_use4: "Révision avec des exemples concrets",
      etudiant_example: "Exemple: Posez une question sur un concept difficile et obtenez une explication claire avec exemples.",
      
      // Juriste d'entreprise
      juriste_title: "Guide pour Juristes d'Entreprise",
      juriste_use1: "Rédaction et révision de contrats commerciaux",
      juriste_use2: "Veille juridique et réglementaire",
      juriste_use3: "Analyse de risques juridiques",
      juriste_use4: "Conformité et droit du travail",
      juriste_example: "Exemple: Analysez un contrat commercial pour identifier les clauses à risque.",
      
      // Tutoriels
      tutorials_title: "Tutoriels Pas à Pas",
      
      tuto1_title: "1. Effectuer une Recherche Juridique",
      tuto1_step1: "Cliquez sur l'icône 'Recherche' dans le menu",
      tuto1_step2: "Tapez votre question en français ou arabe",
      tuto1_step3: "L'IA analyse votre demande et recherche dans le JORA",
      tuto1_step4: "Consultez les résultats avec citations des articles",
      tuto1_step5: "Copiez ou exportez les résultats",
      
      tuto2_title: "2. Rédiger un Document Juridique",
      tuto2_step1: "Accédez à la section 'Rédaction'",
      tuto2_step2: "Choisissez un template adapté à votre besoin",
      tuto2_step3: "Remplissez les informations demandées",
      tuto2_step4: "L'IA génère le document avec citations légales",
      tuto2_step5: "Relisez, modifiez si nécessaire, puis téléchargez",
      
      tuto3_title: "3. Analyser un Document (OCR)",
      tuto3_step1: "Ouvrez la section 'Analyse'",
      tuto3_step2: "Prenez une photo ou uploadez un document",
      tuto3_step3: "L'OCR extrait le texte automatiquement",
      tuto3_step4: "L'IA analyse et identifie les points clés",
      tuto3_step5: "Consultez le rapport d'analyse détaillé",
      
      // FAQ
      faq_title: "Questions Fréquentes",
      
      faq1_q: "Comment fonctionnent les crédits ?",
      faq1_a: "Chaque action consomme des crédits : Recherche (1), Rédaction (2), Analyse (3). Le plan Gratuit offre 50 crédits/mois, Pro 500/mois, Cabinet illimité.",
      
      faq2_q: "Mes données sont-elles sécurisées ?",
      faq2_a: "Oui, toutes vos données sont chiffrées et stockées sur une base de données Supabase sécurisée. Nous ne partageons jamais vos informations.",
      
      faq3_q: "Puis-je utiliser JuristDZ hors ligne ?",
      faq3_a: "Non, une connexion internet est nécessaire pour accéder à la base de données JORA et aux fonctionnalités IA.",
      
      faq4_q: "Les documents générés sont-ils conformes ?",
      faq4_a: "Les documents sont générés selon les modèles légaux algériens, mais nous recommandons toujours une relecture par un professionnel.",
      
      faq5_q: "Comment passer au plan Pro ou Cabinet ?",
      faq5_a: "Cliquez sur votre profil, puis 'Abonnement'. Choisissez votre plan et suivez les instructions de paiement.",
      
      faq6_q: "Puis-je annuler mon abonnement ?",
      faq6_a: "Oui, vous pouvez annuler à tout moment depuis les paramètres. Votre accès reste actif jusqu'à la fin de la période payée.",
      
      // Support
      support_title: "Support & Assistance",
      support_desc: "Besoin d'aide ? Nous sommes là pour vous.",
      support_email: "Email: support@juristdz.com",
      support_hours: "Disponibilité: Lun-Ven 9h-18h",
      support_response: "Temps de réponse: < 24h",
      
      // Sécurité
      security_title: "Confidentialité & Sécurité",
      security_desc: "Vos données juridiques sont protégées par un chiffrement de niveau bancaire. Conformité RGPD et normes algériennes.",
      
      footer: "JuristDZ - Technologie Juridique Algérienne"
    },
    ar: {
      title: "محامي دي زاد: الدليل الشامل",
      subtitle: "الوثائق المهنية",
      
      // Navigation
      nav_start: "البداية",
      nav_features: "المميزات",
      nav_role_guide: "دليل حسب المهنة",
      nav_tutorials: "دروس تطبيقية",
      nav_faq: "أسئلة شائعة",
      nav_support: "الدعم",
      
      // Section Démarrage
      start_title: "البداية السريعة",
      start_welcome: "مرحباً بك في محامي دي زاد",
      start_desc: "محامي دي زاد هو مساعدك القانوني الذكي، مصمم خصيصاً لمحترفي القانون الجزائري.",
      
      access_title: "الوصول من مختلف الأجهزة",
      laptop: "على الحاسوب",
      laptop_desc: "افتح الرابط في كروم أو فايرفوكس أو إيدج. استخدم وضع ملء الشاشة (F11) لتجربة أفضل.",
      mobile: "على الهاتف الذكي",
      mobile_desc: "امسح الرابط أو اكتب العنوان. للحصول على تجربة 'تطبيق أصلي'، اختر 'إضافة إلى الشاشة الرئيسية'.",
      tablet: "على الجهاز اللوحي",
      tablet_desc: "واجهة محسّنة لأجهزة iPad والأجهزة اللوحية بنظام أندرويد. مثالي للاستشارات أثناء التنقل.",
      
      // Fonctionnalités
      features_title: "المميزات الرئيسية",
      feat_research: "البحث القانوني بالذكاء الاصطناعي",
      feat_research_desc: "بحث ذكي متصل بالجريدة الرسمية للجمهورية الجزائرية. اعثر فوراً على مواد القانون والاجتهادات القضائية والنصوص التنظيمية.",
      feat_research_cost: "التكلفة: 1 رصيد لكل بحث",
      
      feat_drafting: "تحرير الوثائق القانونية",
      feat_drafting_desc: "أنشئ وثائق قانونية احترافية مع اقتباسات تلقائية من مواد القانون الجزائري. قوالب مكيّفة حسب مهنتك.",
      feat_drafting_cost: "التكلفة: 2 رصيد لكل وثيقة",
      
      feat_analysis: "تحليل المستندات بتقنية OCR",
      feat_analysis_desc: "التقط صورة لعقد أو حكم أو وثيقة قانونية. يحلل الذكاء الاصطناعي المحتوى ويكتشف البنود الإشكالية والمخاطر القانونية.",
      feat_analysis_cost: "التكلفة: 3 أرصدة لكل تحليل",
      
      // Guides par rôle
      role_guide_title: "دليل خاص بمهنتك",
      
      // Avocat
      avocat_title: "دليل المحامين",
      avocat_use1: "البحث عن الاجتهادات القضائية لإعداد مرافعاتك",
      avocat_use2: "تحرير المذكرات والطلبات والعرائض",
      avocat_use3: "تحليل العقود لعملائك",
      avocat_use4: "إدارة الملفات ومتابعة القضايا",
      avocat_example: "مثال: ابحث عن 'المسؤولية الطبية' للحصول على جميع المواد ذات الصلة من القانون المدني والجنائي الجزائري.",
      
      // Notaire
      notaire_title: "دليل الموثقين",
      notaire_use1: "التحقق من مطابقة العقود الرسمية",
      notaire_use2: "تحرير عقود البيع والهبة والميراث",
      notaire_use3: "البحث في نصوص القانون العقاري والعقاري",
      notaire_use4: "تحليل الوثائق المساحية وسندات الملكية",
      notaire_example: "مثال: أنشئ عقد بيع عقاري مطابق للقانون المدني الجزائري مع جميع البيانات الإلزامية.",
      
      // Huissier
      huissier_title: "دليل المحضرين القضائيين",
      huissier_use1: "تحرير محاضر المعاينة",
      huissier_use2: "إعداد أوامر الدفع",
      huissier_use3: "البحث في إجراءات التنفيذ",
      huissier_use4: "تحليل الأحكام للتنفيذ الجبري",
      huissier_example: "مثال: حرّر أمر دفع مطابق لقانون الإجراءات المدنية والإدارية.",
      
      // Magistrat
      magistrat_title: "دليل القضاة",
      magistrat_use1: "بحث معمق في الاجتهادات القضائية",
      magistrat_use2: "التحقق من مطابقة الإجراءات",
      magistrat_use3: "تحليل مقارن للقرارات المماثلة",
      magistrat_use4: "استشارة سريعة للجريدة الرسمية والنصوص التشريعية",
      magistrat_example: "مثال: ابحث عن اجتهادات المحكمة العليا حول نقطة قانونية محددة.",
      
      // Étudiant
      etudiant_title: "دليل طلاب القانون",
      etudiant_use1: "البحث لأعمالك ومذكراتك",
      etudiant_use2: "فهم المفاهيم القانونية المعقدة",
      etudiant_use3: "إعداد التمارين العملية (الحالات العملية)",
      etudiant_use4: "المراجعة بأمثلة ملموسة",
      etudiant_example: "مثال: اطرح سؤالاً حول مفهوم صعب واحصل على شرح واضح مع أمثلة.",
      
      // Juriste d'entreprise
      juriste_title: "دليل المستشارين القانونيين للشركات",
      juriste_use1: "تحرير ومراجعة العقود التجارية",
      juriste_use2: "المتابعة القانونية والتنظيمية",
      juriste_use3: "تحليل المخاطر القانونية",
      juriste_use4: "الامتثال وقانون العمل",
      juriste_example: "مثال: حلل عقداً تجارياً لتحديد البنود الخطرة.",
      
      // Tutoriels
      tutorials_title: "دروس تطبيقية خطوة بخطوة",
      
      tuto1_title: "1. إجراء بحث قانوني",
      tuto1_step1: "انقر على أيقونة 'البحث' في القائمة",
      tuto1_step2: "اكتب سؤالك بالفرنسية أو العربية",
      tuto1_step3: "يحلل الذكاء الاصطناعي طلبك ويبحث في الجريدة الرسمية",
      tuto1_step4: "استشر النتائج مع اقتباسات المواد",
      tuto1_step5: "انسخ أو صدّر النتائج",
      
      tuto2_title: "2. تحرير وثيقة قانونية",
      tuto2_step1: "ادخل إلى قسم 'التحرير'",
      tuto2_step2: "اختر قالباً مناسباً لاحتياجك",
      tuto2_step3: "املأ المعلومات المطلوبة",
      tuto2_step4: "ينشئ الذكاء الاصطناعي الوثيقة مع الاقتباسات القانونية",
      tuto2_step5: "راجع، عدّل إذا لزم الأمر، ثم حمّل",
      
      tuto3_title: "3. تحليل مستند (OCR)",
      tuto3_step1: "افتح قسم 'التحليل'",
      tuto3_step2: "التقط صورة أو ارفع مستنداً",
      tuto3_step3: "يستخرج OCR النص تلقائياً",
      tuto3_step4: "يحلل الذكاء الاصطناعي ويحدد النقاط الرئيسية",
      tuto3_step5: "استشر تقرير التحليل المفصل",
      
      // FAQ
      faq_title: "أسئلة شائعة",
      
      faq1_q: "كيف تعمل الأرصدة؟",
      faq1_a: "كل إجراء يستهلك أرصدة: البحث (1)، التحرير (2)، التحليل (3). الخطة المجانية تقدم 50 رصيداً/شهر، Pro 500/شهر، Cabinet غير محدود.",
      
      faq2_q: "هل بياناتي آمنة؟",
      faq2_a: "نعم، جميع بياناتك مشفرة ومخزنة في قاعدة بيانات Supabase آمنة. لا نشارك معلوماتك أبداً.",
      
      faq3_q: "هل يمكنني استخدام محامي دي زاد دون اتصال بالإنترنت؟",
      faq3_a: "لا، يلزم اتصال بالإنترنت للوصول إلى قاعدة بيانات الجريدة الرسمية وميزات الذكاء الاصطناعي.",
      
      faq4_q: "هل الوثائق المُنشأة مطابقة؟",
      faq4_a: "تُنشأ الوثائق وفقاً للنماذج القانونية الجزائرية، لكننا نوصي دائماً بمراجعة من قبل محترف.",
      
      faq5_q: "كيف أنتقل إلى خطة Pro أو Cabinet؟",
      faq5_a: "انقر على ملفك الشخصي، ثم 'الاشتراك'. اختر خطتك واتبع تعليمات الدفع.",
      
      faq6_q: "هل يمكنني إلغاء اشتراكي؟",
      faq6_a: "نعم، يمكنك الإلغاء في أي وقت من الإعدادات. يبقى وصولك نشطاً حتى نهاية الفترة المدفوعة.",
      
      // Support
      support_title: "الدعم والمساعدة",
      support_desc: "تحتاج مساعدة؟ نحن هنا من أجلك.",
      support_email: "البريد الإلكتروني: support@juristdz.com",
      support_hours: "التوفر: الإثنين-الجمعة 9ص-6م",
      support_response: "وقت الاستجابة: < 24 ساعة",
      
      // Sécurité
      security_title: "السرية والأمان",
      security_desc: "بياناتك القانونية محمية بتشفير من المستوى المصرفي. الامتثال للقانون العام لحماية البيانات والمعايير الجزائرية.",
      
      footer: "محامي دي زاد - التكنولوجيا القانونية الجزائرية"
    }
  };

  const d = docTranslations[language] || docTranslations.fr;

  // Fonction pour obtenir l'icône et le contenu selon le rôle
  const getRoleContent = () => {
    switch (userRole) {
      case UserRole.AVOCAT:
        return {
          icon: <Scale className="w-6 h-6" />,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
          title: d.avocat_title,
          uses: [d.avocat_use1, d.avocat_use2, d.avocat_use3, d.avocat_use4],
          example: d.avocat_example
        };
      case UserRole.NOTAIRE:
        return {
          icon: <FileText className="w-6 h-6" />,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          title: d.notaire_title,
          uses: [d.notaire_use1, d.notaire_use2, d.notaire_use3, d.notaire_use4],
          example: d.notaire_example
        };
      case UserRole.HUISSIER:
        return {
          icon: <Gavel className="w-6 h-6" />,
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
          title: d.huissier_title,
          uses: [d.huissier_use1, d.huissier_use2, d.huissier_use3, d.huissier_use4],
          example: d.huissier_example
        };
      case UserRole.MAGISTRAT:
        return {
          icon: <Building2 className="w-6 h-6" />,
          color: "text-purple-500",
          bgColor: "bg-purple-500/10",
          title: d.magistrat_title,
          uses: [d.magistrat_use1, d.magistrat_use2, d.magistrat_use3, d.magistrat_use4],
          example: d.magistrat_example
        };
      case UserRole.ETUDIANT:
        return {
          icon: <GraduationCap className="w-6 h-6" />,
          color: "text-cyan-500",
          bgColor: "bg-cyan-500/10",
          title: d.etudiant_title,
          uses: [d.etudiant_use1, d.etudiant_use2, d.etudiant_use3, d.etudiant_use4],
          example: d.etudiant_example
        };
      case UserRole.JURISTE_ENTREPRISE:
        return {
          icon: <Briefcase className="w-6 h-6" />,
          color: "text-indigo-500",
          bgColor: "bg-indigo-500/10",
          title: d.juriste_title,
          uses: [d.juriste_use1, d.juriste_use2, d.juriste_use3, d.juriste_use4],
          example: d.juriste_example
        };
      default:
        return {
          icon: <Scale className="w-6 h-6" />,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
          title: d.avocat_title,
          uses: [d.avocat_use1, d.avocat_use2, d.avocat_use3, d.avocat_use4],
          example: d.avocat_example
        };
    }
  };

  const roleContent = getRoleContent();

  const sections = [
    { id: 'start', label: d.nav_start, icon: <Home className="w-4 h-4" /> },
    { id: 'features', label: d.nav_features, icon: <SearchCheck className="w-4 h-4" /> },
    { id: 'role', label: d.nav_role_guide, icon: roleContent.icon },
    { id: 'tutorials', label: d.nav_tutorials, icon: <Video className="w-4 h-4" /> },
    { id: 'faq', label: d.nav_faq, icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'support', label: d.nav_support, icon: <MessageSquare className="w-4 h-4" /> }
  ];

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{d.title}</h2>
          <p className="text-sm text-slate-500">{d.subtitle}</p>
        </div>
        
        <nav className="space-y-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-legal-gold text-slate-950 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {section.icon}
              <span className="text-sm">{section.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span className="text-sm font-medium">Imprimer</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 md:p-12">
        <div id="printable-documentation" className="max-w-4xl mx-auto space-y-12">
          
          {/* Section: Démarrage */}
          {activeSection === 'start' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-legal-gold/10 text-legal-gold rounded-xl flex items-center justify-center">
                    <Rocket size={24} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{d.start_welcome}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{d.start_desc}</p>
                  </div>
                </div>
              </div>

              {/* Accès Multi-Plateforme */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                    <Smartphone size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{d.access_title}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <Monitor className="text-legal-gold" size={24} />
                      <h3 className="font-bold text-slate-900 dark:text-white">{d.laptop}</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{d.laptop_desc}</p>
                  </div>
                  
                  <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <Smartphone className="text-legal-gold" size={24} />
                      <h3 className="font-bold text-slate-900 dark:text-white">{d.mobile}</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{d.mobile_desc}</p>
                  </div>
                  
                  <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <Monitor className="text-legal-gold" size={24} />
                      <h3 className="font-bold text-slate-900 dark:text-white">{d.tablet}</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{d.tablet_desc}</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Section: Fonctionnalités */}
          {activeSection === 'features' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-legal-gold/10 text-legal-gold rounded-xl flex items-center justify-center">
                  <SearchCheck size={24} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{d.features_title}</h1>
              </div>

              <div className="space-y-6">
                {/* Recherche */}
                <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                      <SearchCheck size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{d.feat_research}</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-3">{d.feat_research_desc}</p>
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                        <Coins size={14} />
                        {d.feat_research_cost}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rédaction */}
                <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center shrink-0">
                      <PenTool size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{d.feat_drafting}</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-3">{d.feat_drafting_desc}</p>
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                        <Coins size={14} />
                        {d.feat_drafting_cost}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Analyse */}
                <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center shrink-0">
                      <FileSearch size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{d.feat_analysis}</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-3">{d.feat_analysis_desc}</p>
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium">
                        <Coins size={14} />
                        {d.feat_analysis_cost}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Guide par Rôle */}
          {activeSection === 'role' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 ${roleContent.bgColor} ${roleContent.color} rounded-xl flex items-center justify-center`}>
                  {roleContent.icon}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{roleContent.title}</h1>
                  <p className="text-slate-600 dark:text-slate-400">{d.role_guide_title}</p>
                </div>
              </div>

              <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Cas d'usage principaux</h3>
                <div className="space-y-3">
                  {roleContent.uses.map((use, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <Check className="text-green-500 shrink-0 mt-0.5" size={20} />
                      <p className="text-slate-700 dark:text-slate-300">{use}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-gradient-to-br from-legal-gold/10 to-legal-gold/5 dark:from-legal-gold/20 dark:to-legal-gold/5 rounded-2xl border border-legal-gold/20">
                <div className="flex items-start gap-3 mb-3">
                  <BookOpen className="text-legal-gold shrink-0" size={24} />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Exemple pratique</h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300">{roleContent.example}</p>
              </div>
            </div>
          )}

          {/* Section: Tutoriels */}
          {activeSection === 'tutorials' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-legal-gold/10 text-legal-gold rounded-xl flex items-center justify-center">
                  <Video size={24} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{d.tutorials_title}</h1>
              </div>

              {/* Tutoriel 1 */}
              <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{d.tuto1_title}</h3>
                <div className="space-y-4">
                  {[d.tuto1_step1, d.tuto1_step2, d.tuto1_step3, d.tuto1_step4, d.tuto1_step5].map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0 font-bold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tutoriel 2 */}
              <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{d.tuto2_title}</h3>
                <div className="space-y-4">
                  {[d.tuto2_step1, d.tuto2_step2, d.tuto2_step3, d.tuto2_step4, d.tuto2_step5].map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0 font-bold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tutoriel 3 */}
              <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{d.tuto3_title}</h3>
                <div className="space-y-4">
                  {[d.tuto3_step1, d.tuto3_step2, d.tuto3_step3, d.tuto3_step4, d.tuto3_step5].map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center shrink-0 font-bold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section: FAQ */}
          {activeSection === 'faq' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-legal-gold/10 text-legal-gold rounded-xl flex items-center justify-center">
                  <HelpCircle size={24} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{d.faq_title}</h1>
              </div>

              <div className="space-y-4">
                {[
                  { q: d.faq1_q, a: d.faq1_a },
                  { q: d.faq2_q, a: d.faq2_a },
                  { q: d.faq3_q, a: d.faq3_a },
                  { q: d.faq4_q, a: d.faq4_a },
                  { q: d.faq5_q, a: d.faq5_a },
                  { q: d.faq6_q, a: d.faq6_a }
                ].map((faq, index) => (
                  <div key={index} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-start gap-3">
                      <ChevronRight className="text-legal-gold shrink-0 mt-1" size={20} />
                      {faq.q}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 pl-8">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Support */}
          {activeSection === 'support' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-legal-gold/10 text-legal-gold rounded-xl flex items-center justify-center">
                  <MessageSquare size={24} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{d.support_title}</h1>
              </div>

              <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-slate-600 dark:text-slate-400 mb-6">{d.support_desc}</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <Mail className="text-legal-gold" size={20} />
                    <span className="text-slate-700 dark:text-slate-300">{d.support_email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <Clock className="text-legal-gold" size={20} />
                    <span className="text-slate-700 dark:text-slate-300">{d.support_hours}</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <Timer className="text-legal-gold" size={20} />
                    <span className="text-slate-700 dark:text-slate-300">{d.support_response}</span>
                  </div>
                </div>
              </div>

              {/* Sécurité */}
              <div className="p-8 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl border border-green-500/20">
                <div className="flex items-start gap-3 mb-4">
                  <ShieldAlert className="text-green-500 shrink-0" size={24} />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{d.security_title}</h3>
                    <p className="text-slate-700 dark:text-slate-300">{d.security_desc}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-12 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">{d.footer}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
