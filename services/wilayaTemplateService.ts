import { getWilayaData, getTribunauxByWilaya, getFormatRC, getFormatNIF } from '../data/wilayaSpecificData';

export interface WilayaTemplateVariables {
  // Informations de la wilaya
  wilaya_code: string;
  wilaya_name_fr: string;
  wilaya_name_ar: string;
  
  // Tribunal
  tribunal_name_fr?: string;
  tribunal_name_ar?: string;
  tribunal_address?: string;
  tribunal_phone?: string;
  
  // Conservation Foncière
  conservation_name_fr?: string;
  conservation_name_ar?: string;
  conservation_address?: string;
  conservation_phone?: string;
  
  // Barreau
  barreau_name_fr?: string;
  barreau_name_ar?: string;
  barreau_address?: string;
  barreau_phone?: string;
  
  // Formats
  format_rc: string;
  format_nif: string;
  
  // Spécificités
  specificites?: string[];
}

class WilayaTemplateService {
  /**
   * Obtenir les variables spécifiques à une wilaya pour un template
   */
  getWilayaVariables(wilayaCode: string, tribunalName?: string): WilayaTemplateVariables | null {
    const wilayaData = getWilayaData(wilayaCode);
    if (!wilayaData) return null;

    const variables: WilayaTemplateVariables = {
      wilaya_code: wilayaData.code,
      wilaya_name_fr: wilayaData.name_fr,
      wilaya_name_ar: wilayaData.name_ar,
      format_rc: wilayaData.format_rc,
      format_nif: wilayaData.format_nif,
      specificites: wilayaData.specificites
    };

    // Ajouter les informations du tribunal si spécifié
    if (tribunalName && wilayaData.tribunaux.length > 0) {
      const tribunal = wilayaData.tribunaux.find(t => t.name_fr === tribunalName) || wilayaData.tribunaux[0];
      variables.tribunal_name_fr = tribunal.name_fr;
      variables.tribunal_name_ar = tribunal.name_ar;
      variables.tribunal_address = tribunal.address;
      variables.tribunal_phone = tribunal.phone;
    }

    // Ajouter les informations de la conservation foncière
    if (wilayaData.conservation_fonciere.length > 0) {
      const cf = wilayaData.conservation_fonciere[0];
      variables.conservation_name_fr = cf.name_fr;
      variables.conservation_name_ar = cf.name_ar;
      variables.conservation_address = cf.address;
      variables.conservation_phone = cf.phone;
    }

    // Ajouter les informations du barreau
    if (wilayaData.barreau) {
      variables.barreau_name_fr = wilayaData.barreau.name_fr;
      variables.barreau_name_ar = wilayaData.barreau.name_ar;
      variables.barreau_address = wilayaData.barreau.address;
      variables.barreau_phone = wilayaData.barreau.phone;
    }

    return variables;
  }

  /**
   * Remplacer les variables dans un template avec les données de la wilaya
   */
  populateTemplate(template: string, wilayaCode: string, tribunalName?: string): string {
    const variables = this.getWilayaVariables(wilayaCode, tribunalName);
    if (!variables) return template;

    let populatedTemplate = template;

    // Remplacer toutes les variables
    Object.entries(variables).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const regex = new RegExp(`\\[${key.toUpperCase()}\\]`, 'g');
        populatedTemplate = populatedTemplate.replace(regex, value);
      }
    });

    return populatedTemplate;
  }

  /**
   * Générer un en-tête de document spécifique à une wilaya
   */
  generateDocumentHeader(
    wilayaCode: string,
    tribunalName: string,
    language: 'fr' | 'ar'
  ): string {
    const variables = this.getWilayaVariables(wilayaCode, tribunalName);
    if (!variables) return '';

    if (language === 'ar') {
      return `
الجمهورية الجزائرية الديمقراطية الشعبية
وزارة العدل

${variables.tribunal_name_ar || ''}
ولاية ${variables.wilaya_name_ar}

العنوان: ${variables.tribunal_address || ''}
${variables.tribunal_phone ? `الهاتف: ${variables.tribunal_phone}` : ''}
      `.trim();
    } else {
      return `
RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
MINISTÈRE DE LA JUSTICE

${variables.tribunal_name_fr || ''}
Wilaya de ${variables.wilaya_name_fr}

Adresse: ${variables.tribunal_address || ''}
${variables.tribunal_phone ? `Tél: ${variables.tribunal_phone}` : ''}
      `.trim();
    }
  }

  /**
   * Générer un pied de page avec les coordonnées du barreau
   */
  generateBarreauFooter(wilayaCode: string, language: 'fr' | 'ar'): string {
    const variables = this.getWilayaVariables(wilayaCode);
    if (!variables || !variables.barreau_name_fr) return '';

    if (language === 'ar') {
      return `
${variables.barreau_name_ar}
العنوان: ${variables.barreau_address}
${variables.barreau_phone ? `الهاتف: ${variables.barreau_phone}` : ''}
      `.trim();
    } else {
      return `
${variables.barreau_name_fr}
Adresse: ${variables.barreau_address}
${variables.barreau_phone ? `Tél: ${variables.barreau_phone}` : ''}
      `.trim();
    }
  }

  /**
   * Valider un numéro RC selon le format de la wilaya
   */
  validateRC(rc: string, wilayaCode: string): { valid: boolean; message?: string } {
    const format = getFormatRC(wilayaCode);
    const pattern = format.replace(/X/g, '\\d');
    const regex = new RegExp(`^${pattern}$`);

    if (!regex.test(rc)) {
      return {
        valid: false,
        message: `Le format du RC doit être: ${format}`
      };
    }

    return { valid: true };
  }

  /**
   * Valider un NIF selon le format de la wilaya
   */
  validateNIF(nif: string, wilayaCode: string): { valid: boolean; message?: string } {
    const format = getFormatNIF(wilayaCode);
    const pattern = format.replace(/X/g, '\\d');
    const regex = new RegExp(`^${pattern}$`);

    if (!regex.test(nif)) {
      return {
        valid: false,
        message: `Le format du NIF doit être: ${format}`
      };
    }

    return { valid: true };
  }

  /**
   * Obtenir les clauses spécifiques à une wilaya
   */
  getWilayaSpecificClauses(wilayaCode: string, language: 'fr' | 'ar'): string[] {
    const variables = this.getWilayaVariables(wilayaCode);
    if (!variables || !variables.specificites) return [];

    // Pour l'instant, retourner les spécificités telles quelles
    // Dans une version future, on pourrait avoir des traductions
    return variables.specificites;
  }

  /**
   * Générer un template d'acte de vente immobilière spécifique à une wilaya
   */
  generateActeVenteImmobiliere(
    wilayaCode: string,
    tribunalName: string,
    language: 'fr' | 'ar'
  ): string {
    const header = this.generateDocumentHeader(wilayaCode, tribunalName, language);
    const variables = this.getWilayaVariables(wilayaCode, tribunalName);

    if (language === 'ar') {
      return `
${header}

عقد بيع عقاري

بين الموقعين أدناه:

الطرف الأول (البائع):
الاسم الكامل: [NOM_VENDEUR]
تاريخ ومكان الميلاد: [DATE_NAISSANCE_VENDEUR] في [LIEU_NAISSANCE_VENDEUR]
العنوان: [ADRESSE_VENDEUR]
رقم بطاقة التعريف الوطنية: [CIN_VENDEUR]

والطرف الثاني (المشتري):
الاسم الكامل: [NOM_ACHETEUR]
تاريخ ومكان الميلاد: [DATE_NAISSANCE_ACHETEUR] في [LIEU_NAISSANCE_ACHETEUR]
العنوان: [ADRESSE_ACHETEUR]
رقم بطاقة التعريف الوطنية: [CIN_ACHETEUR]

موضوع العقد:

يقر الطرف الأول ببيعه للطرف الثاني الذي يقبل شراء العقار التالي:

وصف العقار:
الطبيعة: [NATURE_BIEN]
المساحة: [SUPERFICIE] متر مربع
الموقع: [ADRESSE_BIEN]، ${variables?.wilaya_name_ar}
رقم السند العقاري: [NUMERO_TITRE_FONCIER]
القسم المساحي: [SECTION_CADASTRALE]

${variables?.conservation_name_ar ? `المحافظة العقارية: ${variables.conservation_name_ar}` : ''}

الثمن والشروط المالية:

الثمن الإجمالي: [PRIX_VENTE] دينار جزائري
طريقة الدفع: [MODALITE_PAIEMENT]
تاريخ التوقيع: [DATE_SIGNATURE]

الضمانات والأعباء:

[GARANTIES_VENDEUR]
[SERVITUDES]
[CHARGES]

${variables?.specificites ? '\nخصوصيات محلية:\n' + variables.specificites.map(s => `- ${s}`).join('\n') : ''}

حرر في ${variables?.wilaya_name_ar}، بتاريخ [DATE_SIGNATURE]

إمضاء البائع                    إمضاء المشتري
      `.trim();
    } else {
      return `
${header}

ACTE DE VENTE IMMOBILIÈRE

Entre les soussignés:

PREMIÈRE PARTIE (Vendeur):
Nom complet: [NOM_VENDEUR]
Né(e) le [DATE_NAISSANCE_VENDEUR] à [LIEU_NAISSANCE_VENDEUR]
Demeurant à [ADRESSE_VENDEUR]
Carte d'identité nationale n° [CIN_VENDEUR]

ET DEUXIÈME PARTIE (Acheteur):
Nom complet: [NOM_ACHETEUR]
Né(e) le [DATE_NAISSANCE_ACHETEUR] à [LIEU_NAISSANCE_ACHETEUR]
Demeurant à [ADRESSE_ACHETEUR]
Carte d'identité nationale n° [CIN_ACHETEUR]

OBJET DU CONTRAT:

La première partie déclare vendre à la deuxième partie qui accepte d'acheter le bien immobilier suivant:

Désignation du bien:
Nature: [NATURE_BIEN]
Superficie: [SUPERFICIE] m²
Situation: [ADRESSE_BIEN], Wilaya de ${variables?.wilaya_name_fr}
Numéro du titre foncier: [NUMERO_TITRE_FONCIER]
Section cadastrale: [SECTION_CADASTRALE]

${variables?.conservation_name_fr ? `Conservation Foncière: ${variables.conservation_name_fr}` : ''}

PRIX ET CONDITIONS FINANCIÈRES:

Prix total: [PRIX_VENTE] Dinars Algériens
Modalité de paiement: [MODALITE_PAIEMENT]
Date de signature: [DATE_SIGNATURE]

GARANTIES ET CHARGES:

[GARANTIES_VENDEUR]
[SERVITUDES]
[CHARGES]

${variables?.specificites ? '\nSpécificités locales:\n' + variables.specificites.map(s => `- ${s}`).join('\n') : ''}

Fait à ${variables?.wilaya_name_fr}, le [DATE_SIGNATURE]

Signature du Vendeur              Signature de l'Acheteur
      `.trim();
    }
  }

  /**
   * Générer un template de requête spécifique à une wilaya
   */
  generateRequeteDivorce(
    wilayaCode: string,
    tribunalName: string,
    language: 'fr' | 'ar'
  ): string {
    const header = this.generateDocumentHeader(wilayaCode, tribunalName, language);
    const variables = this.getWilayaVariables(wilayaCode, tribunalName);

    if (language === 'ar') {
      return `
${header}

عريضة افتتاح دعوى طلاق

السيد رئيس ${variables?.tribunal_name_ar || 'المحكمة'}

المدعي:
الاسم الكامل: [NOM_DEMANDEUR]
تاريخ ومكان الميلاد: [DATE_NAISSANCE_DEMANDEUR]
العنوان: [ADRESSE_DEMANDEUR]
المهنة: [PROFESSION_DEMANDEUR]

ضد

المدعى عليه:
الاسم الكامل: [NOM_DEFENDEUR]
تاريخ ومكان الميلاد: [DATE_NAISSANCE_DEFENDEUR]
العنوان: [ADRESSE_DEFENDEUR]
المهنة: [PROFESSION_DEFENDEUR]

الموضوع: طلب الطلاق

عرض الوقائع:

تم عقد الزواج بتاريخ [DATE_MARIAGE] في [LIEU_MARIAGE]
عقد الزواج رقم: [NUMERO_ACTE_MARIAGE]
نوع الطلاق المطلوب: [TYPE_DIVORCE]

الأسباب:
[MOTIFS_DIVORCE]

الأساس القانوني:

طبقاً لأحكام المادة 53 من قانون الأسرة الجزائري

الطلبات:

لهذه الأسباب، يلتمس المدعي من سيادتكم:
- [DEMANDE_1]
- [DEMANDE_2]
- [DEMANDE_3]

قائمة المستندات المرفقة:
- نسخة من عقد الزواج
- نسخة من بطاقة التعريف الوطنية
- [AUTRES_PIECES]

حرر في ${variables?.wilaya_name_ar}، بتاريخ [DATE_SIGNATURE]

المحامي
[NOM_AVOCAT]
${variables?.barreau_name_ar || 'نقابة المحامين'}
      `.trim();
    } else {
      return `
${header}

REQUÊTE EN DIVORCE

Monsieur le Président du ${variables?.tribunal_name_fr || 'Tribunal'}

DEMANDEUR:
Nom complet: [NOM_DEMANDEUR]
Né(e) le [DATE_NAISSANCE_DEMANDEUR]
Demeurant à [ADRESSE_DEMANDEUR]
Profession: [PROFESSION_DEMANDEUR]

CONTRE

DÉFENDEUR:
Nom complet: [NOM_DEFENDEUR]
Né(e) le [DATE_NAISSANCE_DEFENDEUR]
Demeurant à [ADRESSE_DEFENDEUR]
Profession: [PROFESSION_DEFENDEUR]

OBJET: Demande de divorce

EXPOSÉ DES FAITS:

Mariage célébré le [DATE_MARIAGE] à [LIEU_MARIAGE]
Acte de mariage n° [NUMERO_ACTE_MARIAGE]
Type de divorce demandé: [TYPE_DIVORCE]

MOTIFS:
[MOTIFS_DIVORCE]

FONDEMENT JURIDIQUE:

Conformément aux dispositions de l'article 53 du Code de la Famille algérien

PAR CES MOTIFS:

Plaise au Tribunal de:
- [DEMANDE_1]
- [DEMANDE_2]
- [DEMANDE_3]

PIÈCES JOINTES:
- Copie de l'acte de mariage
- Copie de la carte d'identité nationale
- [AUTRES_PIECES]

Fait à ${variables?.wilaya_name_fr}, le [DATE_SIGNATURE]

L'Avocat
[NOM_AVOCAT]
${variables?.barreau_name_fr || 'Barreau'}
      `.trim();
    }
  }
}

export const wilayaTemplateService = new WilayaTemplateService();
