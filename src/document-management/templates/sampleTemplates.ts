/**
 * Sample Multi-Language Templates
 * 
 * Demonstrates French and Arabic template support with proper formatting,
 * right-to-left text support, and language-specific variables.
 * 
 * Requirements: 3.5 - Multi-language template support
 */

import { TemplateDefinition, TemplateCategory, VariableType, Language } from '../../../types/document-management';
import { UserRole } from '../../../types';

/**
 * French Contract Template
 */
export const frenchContractTemplate: TemplateDefinition = {
  name: 'Contrat de Prestation de Services',
  description: 'Modèle de contrat de prestation de services en français avec formatage juridique approprié',
  category: TemplateCategory.CONTRACT,
  language: Language.FRENCH,
  applicableRoles: [UserRole.AVOCAT, UserRole.NOTAIRE, UserRole.JURISTE_ENTREPRISE],
  content: `CONTRAT DE PRESTATION DE SERVICES

Entre les soussignés :

{{clientName}}, domicilié(e) à {{clientAddress}}, ci-après dénommé(e) « le Client »,

Et

{{providerName}}, {{providerTitle}}, domicilié(e) à {{providerAddress}}, ci-après dénommé(e) « le Prestataire »,

Il a été convenu ce qui suit :

ARTICLE 1 - OBJET DU CONTRAT

Le présent contrat a pour objet {{serviceDescription}}.

ARTICLE 2 - DURÉE

Le présent contrat est conclu pour une durée de {{contractDuration}}, à compter du {{startDate}}.

ARTICLE 3 - PRIX ET MODALITÉS DE PAIEMENT

Le prix des prestations s'élève à {{totalAmount}} DZD, payable selon les modalités suivantes :
{{paymentTerms}}

ARTICLE 4 - OBLIGATIONS DU PRESTATAIRE

Le Prestataire s'engage à :
- Exécuter les prestations avec diligence et professionnalisme
- Respecter les délais convenus
- {{additionalObligations}}

ARTICLE 5 - OBLIGATIONS DU CLIENT

Le Client s'engage à :
- Fournir toutes les informations nécessaires
- Régler les sommes dues aux échéances convenues
- {{clientObligations}}

ARTICLE 6 - RÉSILIATION

Le présent contrat peut être résilié par l'une ou l'autre des parties moyennant un préavis de {{noticePeriod}} jours.

Fait à {{contractLocation}}, le {{contractDate}}, en deux exemplaires originaux.

Le Client                           Le Prestataire
{{clientName}}                      {{providerName}}

Signature :                         Signature :`,
  variables: [
    {
      name: 'clientName',
      type: VariableType.TEXT,
      label: 'Nom du client',
      required: true,
      placeholder: 'Nom complet du client'
    },
    {
      name: 'clientAddress',
      type: VariableType.TEXT,
      label: 'Adresse du client',
      required: true,
      placeholder: 'Adresse complète'
    },
    {
      name: 'providerName',
      type: VariableType.TEXT,
      label: 'Nom du prestataire',
      required: true,
      placeholder: 'Nom complet du prestataire'
    },
    {
      name: 'providerTitle',
      type: VariableType.TEXT,
      label: 'Titre du prestataire',
      required: false,
      placeholder: 'Avocat, Notaire, etc.'
    },
    {
      name: 'providerAddress',
      type: VariableType.TEXT,
      label: 'Adresse du prestataire',
      required: true,
      placeholder: 'Adresse complète'
    },
    {
      name: 'serviceDescription',
      type: VariableType.TEXT,
      label: 'Description des services',
      required: true,
      placeholder: 'Description détaillée des prestations'
    },
    {
      name: 'contractDuration',
      type: VariableType.TEXT,
      label: 'Durée du contrat',
      required: true,
      placeholder: 'Ex: 12 mois'
    },
    {
      name: 'startDate',
      type: VariableType.DATE,
      label: 'Date de début',
      required: true
    },
    {
      name: 'totalAmount',
      type: VariableType.NUMBER,
      label: 'Montant total (DZD)',
      required: true,
      placeholder: 'Montant en dinars algériens'
    },
    {
      name: 'paymentTerms',
      type: VariableType.TEXT,
      label: 'Modalités de paiement',
      required: true,
      placeholder: 'Conditions de paiement'
    },
    {
      name: 'additionalObligations',
      type: VariableType.TEXT,
      label: 'Obligations supplémentaires du prestataire',
      required: false
    },
    {
      name: 'clientObligations',
      type: VariableType.TEXT,
      label: 'Obligations supplémentaires du client',
      required: false
    },
    {
      name: 'noticePeriod',
      type: VariableType.NUMBER,
      label: 'Période de préavis (jours)',
      required: true,
      defaultValue: 30
    },
    {
      name: 'contractLocation',
      type: VariableType.TEXT,
      label: 'Lieu de signature',
      required: true,
      placeholder: 'Ville de signature'
    },
    {
      name: 'contractDate',
      type: VariableType.DATE,
      label: 'Date de signature',
      required: true
    }
  ]
};

/**
 * Arabic Contract Template
 */
export const arabicContractTemplate: TemplateDefinition = {
  name: 'عقد تقديم خدمات',
  description: 'نموذج عقد تقديم خدمات باللغة العربية مع التنسيق القانوني المناسب',
  category: TemplateCategory.CONTRACT,
  language: Language.ARABIC,
  applicableRoles: [UserRole.AVOCAT, UserRole.NOTAIRE, UserRole.JURISTE_ENTREPRISE],
  content: `عقد تقديم خدمات

بين الموقعين أدناه:

{{clientName}}، المقيم في {{clientAddress}}، المشار إليه فيما بعد بـ "العميل"

و

{{providerName}}، {{providerTitle}}، المقيم في {{providerAddress}}، المشار إليه فيما بعد بـ "مقدم الخدمة"

تم الاتفاق على ما يلي:

المادة الأولى - موضوع العقد

يهدف هذا العقد إلى {{serviceDescription}}.

المادة الثانية - المدة

يُبرم هذا العقد لمدة {{contractDuration}}، اعتباراً من {{startDate}}.

المادة الثالثة - السعر وشروط الدفع

يبلغ سعر الخدمات {{totalAmount}} دج، يُدفع وفقاً للشروط التالية:
{{paymentTerms}}

المادة الرابعة - التزامات مقدم الخدمة

يتعهد مقدم الخدمة بـ:
- تنفيذ الخدمات بعناية ومهنية
- احترام المواعيد المتفق عليها
- {{additionalObligations}}

المادة الخامسة - التزامات العميل

يتعهد العميل بـ:
- تقديم جميع المعلومات اللازمة
- دفع المبالغ المستحقة في المواعيد المحددة
- {{clientObligations}}

المادة السادسة - الإنهاء

يمكن لأي من الطرفين إنهاء هذا العقد بإشعار مسبق مدته {{noticePeriod}} يوماً.

حُرر في {{contractLocation}}، بتاريخ {{contractDate}}، من نسختين أصليتين.

العميل                           مقدم الخدمة
{{clientName}}                    {{providerName}}

التوقيع:                         التوقيع:`,
  variables: [
    {
      name: 'clientName',
      type: VariableType.TEXT,
      label: 'اسم العميل',
      required: true,
      placeholder: 'الاسم الكامل للعميل'
    },
    {
      name: 'clientAddress',
      type: VariableType.TEXT,
      label: 'عنوان العميل',
      required: true,
      placeholder: 'العنوان الكامل'
    },
    {
      name: 'providerName',
      type: VariableType.TEXT,
      label: 'اسم مقدم الخدمة',
      required: true,
      placeholder: 'الاسم الكامل لمقدم الخدمة'
    },
    {
      name: 'providerTitle',
      type: VariableType.TEXT,
      label: 'لقب مقدم الخدمة',
      required: false,
      placeholder: 'محامي، كاتب عدل، إلخ'
    },
    {
      name: 'providerAddress',
      type: VariableType.TEXT,
      label: 'عنوان مقدم الخدمة',
      required: true,
      placeholder: 'العنوان الكامل'
    },
    {
      name: 'serviceDescription',
      type: VariableType.TEXT,
      label: 'وصف الخدمات',
      required: true,
      placeholder: 'وصف مفصل للخدمات'
    },
    {
      name: 'contractDuration',
      type: VariableType.TEXT,
      label: 'مدة العقد',
      required: true,
      placeholder: 'مثال: ١٢ شهراً'
    },
    {
      name: 'startDate',
      type: VariableType.DATE,
      label: 'تاريخ البداية',
      required: true
    },
    {
      name: 'totalAmount',
      type: VariableType.NUMBER,
      label: 'المبلغ الإجمالي (دج)',
      required: true,
      placeholder: 'المبلغ بالدينار الجزائري'
    },
    {
      name: 'paymentTerms',
      type: VariableType.TEXT,
      label: 'شروط الدفع',
      required: true,
      placeholder: 'شروط الدفع'
    },
    {
      name: 'additionalObligations',
      type: VariableType.TEXT,
      label: 'التزامات إضافية لمقدم الخدمة',
      required: false
    },
    {
      name: 'clientObligations',
      type: VariableType.TEXT,
      label: 'التزامات إضافية للعميل',
      required: false
    },
    {
      name: 'noticePeriod',
      type: VariableType.NUMBER,
      label: 'فترة الإشعار المسبق (أيام)',
      required: true,
      defaultValue: 30
    },
    {
      name: 'contractLocation',
      type: VariableType.TEXT,
      label: 'مكان التوقيع',
      required: true,
      placeholder: 'مدينة التوقيع'
    },
    {
      name: 'contractDate',
      type: VariableType.DATE,
      label: 'تاريخ التوقيع',
      required: true
    }
  ]
};

/**
 * French Legal Motion Template
 */
export const frenchMotionTemplate: TemplateDefinition = {
  name: 'Requête en Référé',
  description: 'Modèle de requête en référé avec formatage juridique français',
  category: TemplateCategory.MOTION,
  language: Language.FRENCH,
  applicableRoles: [UserRole.AVOCAT],
  content: `TRIBUNAL DE {{courtLocation}}

REQUÊTE EN RÉFÉRÉ

L'AN {{currentYear}}

Et le {{requestDate}}

À {{requestTime}} heures

Par la présente requête, {{lawyerName}}, Avocat au Barreau de {{barLocation}}, agissant pour et au nom de {{clientName}}, demeurant à {{clientAddress}},

A L'HONNEUR D'EXPOSER :

{{factualBackground}}

PAR CES MOTIFS :

Il plaît à Monsieur le Président du Tribunal de {{courtLocation}}, statuant en référé :

ORDONNER :
{{requestedOrders}}

CONDAMNER la partie adverse aux dépens et à la somme de {{legalFees}} DZD au titre de l'article 700 du Code de Procédure Civile.

Sous toutes réserves.

Fait à {{requestLocation}}, le {{requestDate}}

{{lawyerName}}
Avocat au Barreau de {{barLocation}}`,
  variables: [
    {
      name: 'courtLocation',
      type: VariableType.TEXT,
      label: 'Lieu du tribunal',
      required: true,
      placeholder: 'Ex: Alger'
    },
    {
      name: 'currentYear',
      type: VariableType.NUMBER,
      label: 'Année courante',
      required: true,
      defaultValue: new Date().getFullYear()
    },
    {
      name: 'requestDate',
      type: VariableType.DATE,
      label: 'Date de la requête',
      required: true
    },
    {
      name: 'requestTime',
      type: VariableType.TEXT,
      label: 'Heure de la requête',
      required: true,
      placeholder: 'Ex: 14:30'
    },
    {
      name: 'lawyerName',
      type: VariableType.TEXT,
      label: 'Nom de l\'avocat',
      required: true
    },
    {
      name: 'barLocation',
      type: VariableType.TEXT,
      label: 'Barreau',
      required: true,
      placeholder: 'Ex: Alger'
    },
    {
      name: 'clientName',
      type: VariableType.TEXT,
      label: 'Nom du client',
      required: true
    },
    {
      name: 'clientAddress',
      type: VariableType.TEXT,
      label: 'Adresse du client',
      required: true
    },
    {
      name: 'factualBackground',
      type: VariableType.TEXT,
      label: 'Exposé des faits',
      required: true,
      placeholder: 'Description détaillée des faits et du droit'
    },
    {
      name: 'requestedOrders',
      type: VariableType.TEXT,
      label: 'Demandes',
      required: true,
      placeholder: 'Ordonnances demandées'
    },
    {
      name: 'legalFees',
      type: VariableType.NUMBER,
      label: 'Honoraires (DZD)',
      required: true,
      defaultValue: 50000
    },
    {
      name: 'requestLocation',
      type: VariableType.TEXT,
      label: 'Lieu de rédaction',
      required: true
    }
  ]
};

/**
 * Arabic Legal Motion Template
 */
export const arabicMotionTemplate: TemplateDefinition = {
  name: 'طلب استعجالي',
  description: 'نموذج طلب استعجالي بالتنسيق القانوني العربي',
  category: TemplateCategory.MOTION,
  language: Language.ARABIC,
  applicableRoles: [UserRole.AVOCAT],
  content: `محكمة {{courtLocation}}

طلب استعجالي

سنة {{currentYear}}

وفي {{requestDate}}

الساعة {{requestTime}}

بموجب هذا الطلب، {{lawyerName}}، محامي لدى نقابة {{barLocation}}، نيابة عن {{clientName}}، المقيم في {{clientAddress}}،

يتشرف بعرض ما يلي:

{{factualBackground}}

لهذه الأسباب:

يرجى من السيد رئيس محكمة {{courtLocation}}، بصفته قاضي الأمور المستعجلة:

الأمر بـ:
{{requestedOrders}}

إلزام الطرف المقابل بالمصاريف ومبلغ {{legalFees}} دج كأتعاب محاماة.

مع حفظ جميع الحقوق.

حُرر في {{requestLocation}}، بتاريخ {{requestDate}}

{{lawyerName}}
محامي لدى نقابة {{barLocation}}`,
  variables: [
    {
      name: 'courtLocation',
      type: VariableType.TEXT,
      label: 'مكان المحكمة',
      required: true,
      placeholder: 'مثال: الجزائر'
    },
    {
      name: 'currentYear',
      type: VariableType.NUMBER,
      label: 'السنة الحالية',
      required: true,
      defaultValue: new Date().getFullYear()
    },
    {
      name: 'requestDate',
      type: VariableType.DATE,
      label: 'تاريخ الطلب',
      required: true
    },
    {
      name: 'requestTime',
      type: VariableType.TEXT,
      label: 'وقت الطلب',
      required: true,
      placeholder: 'مثال: ١٤:٣٠'
    },
    {
      name: 'lawyerName',
      type: VariableType.TEXT,
      label: 'اسم المحامي',
      required: true
    },
    {
      name: 'barLocation',
      type: VariableType.TEXT,
      label: 'النقابة',
      required: true,
      placeholder: 'مثال: الجزائر'
    },
    {
      name: 'clientName',
      type: VariableType.TEXT,
      label: 'اسم العميل',
      required: true
    },
    {
      name: 'clientAddress',
      type: VariableType.TEXT,
      label: 'عنوان العميل',
      required: true
    },
    {
      name: 'factualBackground',
      type: VariableType.TEXT,
      label: 'عرض الوقائع',
      required: true,
      placeholder: 'وصف مفصل للوقائع والقانون'
    },
    {
      name: 'requestedOrders',
      type: VariableType.TEXT,
      label: 'الطلبات',
      required: true,
      placeholder: 'الأوامر المطلوبة'
    },
    {
      name: 'legalFees',
      type: VariableType.NUMBER,
      label: 'الأتعاب (دج)',
      required: true,
      defaultValue: 50000
    },
    {
      name: 'requestLocation',
      type: VariableType.TEXT,
      label: 'مكان التحرير',
      required: true
    }
  ]
};

/**
 * All sample templates
 */
export const sampleTemplates: TemplateDefinition[] = [
  frenchContractTemplate,
  arabicContractTemplate,
  frenchMotionTemplate,
  arabicMotionTemplate
];

/**
 * Get sample templates by language
 */
export function getSampleTemplatesByLanguage(language: Language): TemplateDefinition[] {
  return sampleTemplates.filter(template => template.language === language);
}

/**
 * Get sample templates by category
 */
export function getSampleTemplatesByCategory(category: TemplateCategory): TemplateDefinition[] {
  return sampleTemplates.filter(template => template.category === category);
}

/**
 * Get sample template by name
 */
export function getSampleTemplateByName(name: string): TemplateDefinition | undefined {
  return sampleTemplates.find(template => template.name === name);
}