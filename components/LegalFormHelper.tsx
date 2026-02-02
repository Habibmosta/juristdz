import React, { useState } from 'react';
import { Language } from '../types';
import { HelpCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface LegalFormHelperProps {
  templateId: string;
  language: Language;
  currentSection: string;
}

const LegalFormHelper: React.FC<LegalFormHelperProps> = ({ templateId, language, currentSection }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isAr = language === 'ar';

  const helpContent = {
    fr: {
      identite: {
        title: 'Informations d\'Identité - Mentions Obligatoires',
        content: [
          '✅ Nom et prénom complets (sans abréviations)',
          '✅ Filiation complète : nom et prénom du père ET de la mère',
          '✅ Date et lieu de naissance précis',
          '✅ Nationalité (obligatoire pour les étrangers)',
          '✅ Profession exercée actuellement',
          '✅ Adresse complète et actuelle de domicile',
          '✅ Document d\'identité avec numéro, date et lieu de délivrance',
          '',
          '⚠️ ATTENTION : Toutes ces informations sont obligatoires selon l\'article 324 du Code de Procédure Civile algérien.',
          '',
          '📋 Documents acceptés :',
          '• Carte d\'Identité Nationale (CIN)',
          '• Passeport algérien ou étranger',
          '• Permis de conduire (pour identification)',
          '• Carte de séjour (pour les étrangers)'
        ]
      },
      cabinet: {
        title: 'Informations du Cabinet - Mentions Professionnelles',
        content: [
          '✅ Nom complet du cabinet ou étude',
          '✅ Adresse complète du cabinet',
          '✅ Téléphone et email (recommandés)',
          '✅ Nom et prénom du praticien',
          '✅ Qualité : Avocat, Notaire, ou Huissier',
          '✅ Numéro d\'inscription au tableau',
          '✅ Barreau ou chambre d\'appartenance',
          '',
          '⚠️ IMPORTANT : Ces mentions sont obligatoires pour la validité de l\'acte.',
          '',
          '📋 Exemples :',
          '• Avocat : "Maître [Nom], Avocat au Barreau d\'Alger, inscrit sous le n° [X]"',
          '• Notaire : "Maître [Nom], Notaire à [Ville], membre de la Chambre des Notaires"'
        ]
      },
      tribunal: {
        title: 'Juridiction Compétente - Règles de Compétence',
        content: [
          '✅ Nom exact du tribunal compétent',
          '✅ Type de juridiction selon la matière',
          '✅ Adresse complète du tribunal',
          '✅ Wilaya de rattachement',
          '',
          '⚠️ RÈGLES DE COMPÉTENCE :',
          '• Tribunal de la famille : divorce, filiation, succession',
          '• Tribunal civil : contrats, responsabilité, propriété',
          '• Tribunal de commerce : litiges entre commerçants',
          '• Tribunal pénal : infractions et constitution de partie civile',
          '',
          '📍 COMPÉTENCE TERRITORIALE :',
          '• Domicile du défendeur (règle générale)',
          '• Lieu du contrat ou du fait dommageable',
          '• Situation de l\'immeuble (actions réelles)'
        ]
      }
    },
    ar: {
      identite: {
        title: 'معلومات الهوية - البيانات الإجبارية',
        content: [
          '✅ الاسم واللقب كاملين (بدون اختصارات)',
          '✅ النسب الكامل: اسم ولقب الأب والأم',
          '✅ تاريخ ومكان الميلاد بدقة',
          '✅ الجنسية (إجباري للأجانب)',
          '✅ المهنة المزاولة حالياً',
          '✅ العنوان الكامل والحالي للسكن',
          '✅ وثيقة الهوية مع الرقم وتاريخ ومكان الإصدار',
          '',
          '⚠️ تنبيه: جميع هذه المعلومات إجبارية وفقاً للمادة 324 من قانون الإجراءات المدنية الجزائري.',
          '',
          '📋 الوثائق المقبولة:',
          '• بطاقة التعريف الوطنية',
          '• جواز السفر الجزائري أو الأجنبي',
          '• رخصة السياقة (للتعريف)',
          '• بطاقة الإقامة (للأجانب)'
        ]
      },
      cabinet: {
        title: 'معلومات المكتب - البيانات المهنية',
        content: [
          '✅ الاسم الكامل للمكتب أو الدراسة',
          '✅ العنوان الكامل للمكتب',
          '✅ الهاتف والبريد الإلكتروني (مستحسن)',
          '✅ اسم ولقب الممارس',
          '✅ الصفة: محامي، موثق، أو محضر قضائي',
          '✅ رقم القيد في الجدول',
          '✅ النقابة أو الغرفة المنتمي إليها',
          '',
          '⚠️ مهم: هذه البيانات إجبارية لصحة العقد.',
          '',
          '📋 أمثلة:',
          '• محامي: "الأستاذ [الاسم]، محامي لدى نقابة الجزائر، مقيد تحت رقم [X]"',
          '• موثق: "الأستاذ [الاسم]، موثق بـ[المدينة]، عضو غرفة الموثقين"'
        ]
      },
      tribunal: {
        title: 'الجهة القضائية المختصة - قواعد الاختصاص',
        content: [
          '✅ الاسم الدقيق للمحكمة المختصة',
          '✅ نوع الجهة القضائية حسب الموضوع',
          '✅ العنوان الكامل للمحكمة',
          '✅ الولاية التابعة لها',
          '',
          '⚠️ قواعد الاختصاص:',
          '• محكمة شؤون الأسرة: الطلاق، النسب، الميراث',
          '• المحكمة المدنية: العقود، المسؤولية، الملكية',
          '• المحكمة التجارية: النزاعات بين التجار',
          '• المحكمة الجزائية: الجرائم وتكوين الطرف المدني',
          '',
          '📍 الاختصاص الإقليمي:',
          '• موطن المدعى عليه (القاعدة العامة)',
          '• مكان العقد أو الفعل الضار',
          '• موقع العقار (الدعاوى العينية)'
        ]
      }
    }
  };

  const currentHelp = helpContent[language][currentSection as keyof typeof helpContent[typeof language]];

  if (!currentHelp) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        title={isAr ? 'مساعدة قانونية' : 'Aide juridique'}
      >
        <HelpCircle size={18} />
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 z-50 w-96 max-w-[90vw] bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Info size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                {currentHelp.title}
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400" dir={isAr ? 'rtl' : 'ltr'}>
            {currentHelp.content.map((line, index) => (
              <div key={index}>
                {line === '' ? (
                  <div className="h-2" />
                ) : line.startsWith('✅') ? (
                  <div className="flex items-start gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{line.substring(2)}</span>
                  </div>
                ) : line.startsWith('⚠️') ? (
                  <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 font-medium">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{line.substring(2)}</span>
                  </div>
                ) : line.startsWith('📋') || line.startsWith('📍') ? (
                  <div className="font-medium text-slate-700 dark:text-slate-300 mt-3">
                    {line}
                  </div>
                ) : line.startsWith('•') ? (
                  <div className="ml-4 text-slate-600 dark:text-slate-400">
                    {line}
                  </div>
                ) : (
                  <div>{line}</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <AlertTriangle size={14} />
              <span>
                {isAr 
                  ? 'تحقق دائماً من الجريدة الرسمية للتحديثات القانونية'
                  : 'Vérifiez toujours le JORA pour les mises à jour légales'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalFormHelper;