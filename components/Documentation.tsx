
import React from 'react';
import { Language } from '../types';
import { Printer, BookOpen, Cpu, Database, UserCheck, ShieldAlert, Terminal, Rocket, Code, ChevronRight, Copy, Check, BarChart3, Coins, CreditCard as BillingIcon, ShieldEllipsis, FlaskConical, SearchCheck, Smartphone, Monitor } from 'lucide-react';

interface DocumentationProps {
  language: Language;
}

const Documentation: React.FC<DocumentationProps> = ({ language }) => {
  const isAr = language === 'ar';
  
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
      title: "JuristDZ : Guide de Déploiement",
      subtitle: "Mode d'emploi pour le Cabinet d'Avocat",
      sec_access: "1. Accès Multi-Plateforme",
      laptop: "Sur Ordinateur (Laptop)",
      laptop_desc: "Ouvrez l'URL dans Chrome ou Edge. Utilisez le mode plein écran (F11) pour une immersion totale.",
      mobile: "Sur Smartphone",
      mobile_desc: "Scannez le lien. Pour une expérience 'App', utilisez l'option 'Ajouter à l'écran d'accueil' sur votre iPhone ou Android.",
      sec_features: "2. Fonctionnalités Clés",
      feat1: "Recherche par Intelligence Artificielle connectée au JORA.",
      feat2: "Rédaction d'actes (Citations articles de loi algériens).",
      feat3: "Analyse OCR : Prenez une photo d'un contrat pour détecter les failles.",
      sec_security: "3. Confidentialité & Sécurité",
      sec_desc: "Toutes les données sont chiffrées et stockées sur votre instance Supabase dédiée.",
      footer: "JuristDZ - Technologie Avocat 3.0"
    },
    ar: {
      title: "محامي دي زاد: دليل النشر والاستخدام",
      subtitle: "دليل الاستخدام المهني لمكاتب المحاماة",
      sec_access: "1. الوصول من مختلف الأجهزة",
      laptop: "على الحاسوب",
      laptop_desc: "افتح الرابط في متصفح كروم. استخدم وضع ملء الشاشة لتجربة أفضل.",
      mobile: "على الهاتف الذكي",
      mobile_desc: "افتح الرابط في هاتفك. اختر 'إضافة إلى الشاشة الرئيسية' ليظهر التطبيق كأيقونة مستقلة.",
      sec_features: "2. المميزات الرئيسية",
      feat1: "بحث ذكي مربوط بالجريدة الرسمية الجزائرية.",
      feat2: "تحرير العقود والعرائض مع ذكر المواد القانونية.",
      feat3: "التعرف الضوئي: صور عقداً وسيقوم النظام بتحليل مخاطره فوراً.",
      sec_security: "3. السرية والأمان",
      sec_desc: "جميع المحادثات والملفات مشفرة ومحفوظة في قاعدة بيانات Supabase الخاصة بك.",
      footer: "محامي دي زاد - تقنيات المحاماة الحديثة"
    }
  };

  const d = docTranslations[language] || docTranslations.fr;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors">
      <div id="printable-documentation" className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className={isAr ? 'text-right' : 'text-left'}>
            <h1 className="text-4xl font-black text-legal-blue dark:text-legal-gold font-serif mb-2">{d.title}</h1>
            <p className="text-slate-500 flex items-center gap-2">
              <Rocket size={16} /> {d.subtitle}
            </p>
          </div>
          <button onClick={handlePrint} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-50">
             <Printer size={20} />
          </button>
        </div>

        {/* Section: Access */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
               <Smartphone size={24} />
             </div>
             <h2 className="text-2xl font-bold dark:text-white">{d.sec_access}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Monitor className="text-legal-gold" />
                  <h3 className="font-bold">{d.laptop}</h3>
                </div>
                <p className="text-sm text-slate-500">{d.laptop_desc}</p>
             </div>
             <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="text-legal-gold" />
                  <h3 className="font-bold">{d.mobile}</h3>
                </div>
                <p className="text-sm text-slate-500">{d.mobile_desc}</p>
             </div>
          </div>
        </section>

        {/* Features */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-legal-gold/10 text-legal-gold rounded-xl flex items-center justify-center">
               <SearchCheck size={24} />
             </div>
             <h2 className="text-2xl font-bold dark:text-white">{d.sec_features}</h2>
          </div>
          <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
             <div className="flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-xl">
                <Check className="text-green-500 shrink-0" />
                <p className="text-sm font-medium">{d.feat1}</p>
             </div>
             <div className="flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-xl">
                <Check className="text-green-500 shrink-0" />
                <p className="text-sm font-medium">{d.feat2}</p>
             </div>
             <div className="flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-xl">
                <Check className="text-green-500 shrink-0" />
                <p className="text-sm font-medium">{d.feat3}</p>
             </div>
          </div>
        </section>

        <div className="pt-12 border-t text-center">
           <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">{d.footer}</p>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
