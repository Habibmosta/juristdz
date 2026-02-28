import { EnhancedUserProfile, UserRole, Language } from '../types';

interface SignatureBlockParams {
  professional: EnhancedUserProfile;
  date: Date;
  lieu: string;
  language: Language;
  includePiecesJointes?: boolean;
  piecesJointes?: string[];
}

class DocumentSignatureService {
  
  /**
   * Générer le bloc de signature complet pour un document juridique
   */
  generateSignatureBlock(params: SignatureBlockParams): string {
    let signature = '';
    
    // 1. Séparateur
    signature += this.generateSeparator() + '\n\n';
    
    // 2. Date et lieu
    signature += this.generateDateLieu(params.lieu, params.date, params.language);
    signature += '\n\n';
    
    // 3. Mention de signature
    signature += this.generateSignatureMention(params.language);
    signature += '\n\n';
    
    // 4. Identité du signataire
    signature += this.generateSignataireIdentity(params.professional, params.language);
    signature += '\n\n';
    
    // 5. Pièces jointes (optionnel)
    if (params.includePiecesJointes && params.piecesJointes && params.piecesJointes.length > 0) {
      signature += this.generateSeparator() + '\n\n';
      signature += this.generatePiecesJointes(params.piecesJointes, params.language);
    }
    
    return signature;
  }
  
  /**
   * Générer la date et le lieu
   */
  private generateDateLieu(lieu: string, date: Date, language: Language): string {
    const isAr = language === 'ar';
    const dateStr = date.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    return isAr ?
      `حرر في ${lieu}، بتاريخ ${dateStr}` :
      `Fait à ${lieu}, le ${dateStr}`;
  }
  
  /**
   * Générer la mention de signature
   */
  private generateSignatureMention(language: Language): string {
    const isAr = language === 'ar';
    
    return isAr ?
      `التوقيع والختم` :
      `Signature et cachet`;
  }
  
  /**
   * Générer l'identité du signataire
   */
  private generateSignataireIdentity(professional: EnhancedUserProfile, language: Language): string {
    const info = professional.professionalInfo;
    const isAr = language === 'ar';
    
    let identity = '';
    
    if (professional.profession === UserRole.AVOCAT) {
      identity = isAr ?
        `الأستاذ ${professional.firstName} ${professional.lastName}
محامٍ لدى ${info?.barreauInscription || 'نقابة المحامين'}
رقم ${info?.numeroInscription || '[رقم التسجيل]'}` :
        `Maître ${professional.firstName} ${professional.lastName}
Avocat au ${info?.barreauInscription || 'Barreau'}
N° ${info?.numeroInscription || '[N° inscription]'}`;
    }
    else if (professional.profession === UserRole.NOTAIRE) {
      identity = isAr ?
        `الأستاذ ${professional.firstName} ${professional.lastName}
موثق معتمد
رقم القيد: ${info?.numeroMatricule || '[رقم القيد]'}` :
        `Maître ${professional.firstName} ${professional.lastName}
Notaire assermenté
N° de matricule: ${info?.numeroMatricule || '[N° matricule]'}`;
    }
    else if (professional.profession === UserRole.HUISSIER) {
      identity = isAr ?
        `الأستاذ ${professional.firstName} ${professional.lastName}
محضر قضائي معتمد
رقم الاعتماد: ${info?.numeroAgrement || '[رقم الاعتماد]'}` :
        `Maître ${professional.firstName} ${professional.lastName}
Huissier de Justice assermenté
N° d'agrément: ${info?.numeroAgrement || '[N° agrément]'}`;
    }
    else {
      identity = isAr ?
        `${professional.firstName} ${professional.lastName}
${this.getRoleName(professional.profession, language)}` :
        `${professional.firstName} ${professional.lastName}
${this.getRoleName(professional.profession, language)}`;
    }
    
    return identity.trim();
  }
  
  /**
   * Générer la liste des pièces jointes
   */
  private generatePiecesJointes(pieces: string[], language: Language): string {
    const isAr = language === 'ar';
    let result = '';
    
    result += isAr ? 'المستندات المرفقة:' : 'PIÈCES JOINTES:';
    result += '\n';
    
    pieces.forEach((piece, index) => {
      result += `${index + 1}. ${piece}\n`;
    });
    
    return result.trim();
  }
  
  /**
   * Générer un séparateur visuel
   */
  private generateSeparator(): string {
    return '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  }
  
  /**
   * Obtenir le nom du rôle
   */
  private getRoleName(role: UserRole, language: Language): string {
    const isAr = language === 'ar';
    
    const roleNames: { [key in UserRole]: { fr: string; ar: string } } = {
      [UserRole.AVOCAT]: { fr: 'Avocat', ar: 'محامٍ' },
      [UserRole.NOTAIRE]: { fr: 'Notaire', ar: 'موثق' },
      [UserRole.HUISSIER]: { fr: 'Huissier de Justice', ar: 'محضر قضائي' },
      [UserRole.MAGISTRAT]: { fr: 'Magistrat', ar: 'قاضٍ' },
      [UserRole.JURISTE_ENTREPRISE]: { fr: 'Juriste d\'Entreprise', ar: 'مستشار قانوني' },
      [UserRole.ETUDIANT]: { fr: 'Étudiant en Droit', ar: 'طالب قانون' },
      [UserRole.ADMIN]: { fr: 'Administrateur', ar: 'مدير' }
    };
    
    return isAr ? roleNames[role].ar : roleNames[role].fr;
  }
  
  /**
   * Générer une liste de pièces jointes standard selon le type de document
   */
  generateStandardPiecesJointes(documentType: string, language: Language): string[] {
    const isAr = language === 'ar';
    
    const standardPieces: { [key: string]: { fr: string[]; ar: string[] } } = {
      'requete_divorce': {
        fr: [
          'Copie intégrale de l\'acte de mariage',
          'Copie CIN du demandeur',
          'Certificat de résidence',
          'Actes de naissance des enfants (le cas échéant)'
        ],
        ar: [
          'نسخة كاملة من عقد الزواج',
          'نسخة من بطاقة التعريف الوطنية للطالب',
          'شهادة إقامة',
          'شهادات ميلاد الأطفال (إن وجدت)'
        ]
      },
      'requete_pension_alimentaire': {
        fr: [
          'Copie CIN du demandeur',
          'Actes de naissance des enfants',
          'Justificatifs de revenus du débiteur',
          'Justificatifs des charges (factures, frais de scolarité, etc.)'
        ],
        ar: [
          'نسخة من بطاقة التعريف الوطنية',
          'شهادات ميلاد الأطفال',
          'إثباتات دخل المدين',
          'إثباتات النفقات (فواتير، مصاريف مدرسية، إلخ)'
        ]
      },
      'requete_succession': {
        fr: [
          'Acte de décès',
          'Actes de naissance des héritiers',
          'Certificat d\'hérédité',
          'Titres de propriété des biens',
          'Relevés bancaires'
        ],
        ar: [
          'شهادة وفاة',
          'شهادات ميلاد الورثة',
          'شهادة الوراثة',
          'سندات ملكية الأموال',
          'كشوف حسابات بنكية'
        ]
      },
      'default': {
        fr: [
          'Copie CIN',
          'Certificat de résidence',
          'Pièces justificatives'
        ],
        ar: [
          'نسخة من بطاقة التعريف',
          'شهادة إقامة',
          'الوثائق الثبوتية'
        ]
      }
    };
    
    const pieces = standardPieces[documentType] || standardPieces['default'];
    return isAr ? pieces.ar : pieces.fr;
  }
}

export const documentSignatureService = new DocumentSignatureService();
