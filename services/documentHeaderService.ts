import { EnhancedUserProfile, UserRole, Language } from '../types';
import { wilayaTemplateService } from './wilayaTemplateService';

interface DocumentHeaderParams {
  documentType: 'requete' | 'assignation' | 'acte' | 'exploit' | 'conclusions';
  professional: EnhancedUserProfile;
  wilaya?: string;
  tribunal?: string;
  destinataire?: 'president_tribunal' | 'juge_referes' | 'procureur' | 'qui_de_droit' | string;
  objet: string;
  reference?: string;
  date: Date;
  language: Language;
}

class DocumentHeaderService {
  
  /**
   * Générer l'en-tête complet d'un document juridique professionnel
   */
  generateDocumentHeader(params: DocumentHeaderParams): string {
    let header = '';
    
    // 1. EN-TÊTE OFFICIEL (si tribunal sélectionné)
    if (params.tribunal && params.wilaya) {
      const officialHeader = wilayaTemplateService.generateDocumentHeader(
        params.wilaya,
        params.tribunal,
        params.language
      );
      header += officialHeader + '\n\n';
      header += this.generateSeparator() + '\n\n';
    }
    
    // 2. IDENTIFICATION DU PROFESSIONNEL RÉDACTEUR
    header += this.generateProfessionalIdentity(params.professional, params.language);
    header += '\n\n';
    
    // 3. DESTINATAIRE
    if (params.destinataire) {
      header += this.generateDestinataire(
        params.destinataire, 
        params.tribunal, 
        params.language
      );
      header += '\n\n';
    }
    
    // 4. OBJET ET RÉFÉRENCE
    header += this.generateObjetReference(
      params.objet, 
      params.reference, 
      params.language
    );
    header += '\n\n';
    
    // 5. DATE ET LIEU
    const lieu = this.extractLieu(params.professional, params.wilaya);
    header += this.generateDateLieu(lieu, params.date, params.language);
    header += '\n\n';
    
    header += this.generateSeparator() + '\n\n';
    
    return header;
  }

  /**
   * Générer l'identification complète du professionnel
   */
  private generateProfessionalIdentity(professional: EnhancedUserProfile, language: Language): string {
    const info = professional.professionalInfo;
    const isAr = language === 'ar';
    
    if (!info) {
      // Fallback si pas d'infos professionnelles
      return isAr ?
        `الأستاذ ${professional.firstName} ${professional.lastName}` :
        `Maître ${professional.firstName} ${professional.lastName}`;
    }
    
    let identity = '';
    
    if (professional.profession === UserRole.AVOCAT) {
      identity = isAr ? 
        `الأستاذ ${professional.firstName} ${professional.lastName}
محامٍ مسجل في ${info.barreauInscription || 'نقابة المحامين'}
رقم التسجيل: ${info.numeroInscription || '[رقم التسجيل]'}
${info.cabinetName || ''}
${info.cabinetAddress || '[العنوان]'}
الهاتف: ${info.cabinetPhone || '[الهاتف]'}${info.cabinetEmail ? `\nالبريد الإلكتروني: ${info.cabinetEmail}` : ''}` :
        `Maître ${professional.firstName} ${professional.lastName}
Avocat inscrit au ${info.barreauInscription || 'Barreau'}
N° d'inscription: ${info.numeroInscription || '[N° inscription]'}
${info.cabinetName || ''}
${info.cabinetAddress || '[Adresse]'}
Tél: ${info.cabinetPhone || '[Téléphone]'}${info.cabinetEmail ? `\nEmail: ${info.cabinetEmail}` : ''}`;
    } 
    else if (professional.profession === UserRole.NOTAIRE) {
      identity = isAr ?
        `الأستاذ ${professional.firstName} ${professional.lastName}
موثق مسجل في ${info.chambreNotariale || 'الغرفة الوطنية للموثقين'}
رقم القيد: ${info.numeroMatricule || '[رقم القيد]'}
${info.etudeNotariale || ''}
${info.etudeAddress || '[العنوان]'}
الهاتف: ${info.etudePhone || '[الهاتف]'}${info.etudeEmail ? `\nالبريد الإلكتروني: ${info.etudeEmail}` : ''}` :
        `Maître ${professional.firstName} ${professional.lastName}
Notaire inscrit à la ${info.chambreNotariale || 'Chambre des Notaires'}
N° de matricule: ${info.numeroMatricule || '[N° matricule]'}
${info.etudeNotariale || ''}
${info.etudeAddress || '[Adresse]'}
Tél: ${info.etudePhone || '[Téléphone]'}${info.etudeEmail ? `\nEmail: ${info.etudeEmail}` : ''}`;
    }
    else if (professional.profession === UserRole.HUISSIER) {
      identity = isAr ?
        `الأستاذ ${professional.firstName} ${professional.lastName}
محضر قضائي معتمد لدى ${info.chambreHuissiers || 'الغرفة الوطنية للمحضرين'}
رقم الاعتماد: ${info.numeroAgrement || '[رقم الاعتماد]'}
${info.bureauHuissier || ''}
${info.bureauAddress || '[العنوان]'}
الهاتف: ${info.bureauPhone || '[الهاتف]'}${info.bureauEmail ? `\nالبريد الإلكتروني: ${info.bureauEmail}` : ''}` :
        `Maître ${professional.firstName} ${professional.lastName}
Huissier de Justice assermenté
Chambre: ${info.chambreHuissiers || 'Chambre des Huissiers'}
N° d'agrément: ${info.numeroAgrement || '[N° agrément]'}
${info.bureauHuissier || ''}
${info.bureauAddress || '[Adresse]'}
Tél: ${info.bureauPhone || '[Téléphone]'}${info.bureauEmail ? `\nEmail: ${info.bureauEmail}` : ''}`;
    }
    else {
      // Autres rôles (Magistrat, Juriste, etc.)
      identity = isAr ?
        `${professional.firstName} ${professional.lastName}
${this.getRoleName(professional.profession, language)}` :
        `${professional.firstName} ${professional.lastName}
${this.getRoleName(professional.profession, language)}`;
    }
    
    return identity.trim();
  }
  
  /**
   * Générer le destinataire du document
   */
  private generateDestinataire(
    destinataire: string, 
    tribunal: string | undefined, 
    language: Language
  ): string {
    const isAr = language === 'ar';
    
    switch (destinataire) {
      case 'president_tribunal':
        return isAr ?
          `إلى السيد رئيس ${tribunal || 'المحكمة'}` :
          `À Monsieur le Président du ${tribunal || 'Tribunal'}`;
      
      case 'juge_referes':
        return isAr ?
          `إلى السيد قاضي الأمور المستعجلة لدى ${tribunal || 'المحكمة'}` :
          `À Monsieur le Juge des Référés du ${tribunal || 'Tribunal'}`;
      
      case 'procureur':
        return isAr ?
          `إلى السيد وكيل الجمهورية لدى ${tribunal || 'المحكمة'}` :
          `À Monsieur le Procureur de la République près le ${tribunal || 'Tribunal'}`;
      
      case 'qui_de_droit':
        return isAr ?
          `إلى من يهمه الأمر` :
          `À qui de droit`;
      
      default:
        // Destinataire personnalisé
        return destinataire;
    }
  }
  
  /**
   * Générer l'objet et la référence
   */
  private generateObjetReference(
    objet: string, 
    reference: string | undefined, 
    language: Language
  ): string {
    const isAr = language === 'ar';
    let result = '';
    
    result += isAr ? `الموضوع: ${objet}` : `Objet: ${objet}`;
    
    if (reference) {
      result += '\n';
      result += isAr ? `المرجع: ${reference}` : `Référence: ${reference}`;
    }
    
    return result;
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
      `${lieu}، في ${dateStr}` :
      `${lieu}, le ${dateStr}`;
  }
  
  /**
   * Extraire le lieu depuis le profil professionnel
   */
  private extractLieu(professional: EnhancedUserProfile, wilaya?: string): string {
    const info = professional.professionalInfo;
    
    if (wilaya) {
      // Convertir le code wilaya en nom
      const wilayaData = wilayaTemplateService.getWilayaVariables(wilaya);
      if (wilayaData) {
        return wilayaData.wilaya_name_fr;
      }
      return wilaya; // Fallback si pas trouvé
    }
    
    if (info?.wilayaExercice) {
      return info.wilayaExercice;
    }
    
    // Extraire la ville depuis l'adresse
    if (professional.profession === UserRole.AVOCAT && info?.cabinetAddress) {
      const parts = info.cabinetAddress.split(',');
      return parts[parts.length - 1].trim();
    }
    
    if (professional.profession === UserRole.NOTAIRE && info?.etudeAddress) {
      const parts = info.etudeAddress.split(',');
      return parts[parts.length - 1].trim();
    }
    
    if (professional.profession === UserRole.HUISSIER && info?.bureauAddress) {
      const parts = info.bureauAddress.split(',');
      return parts[parts.length - 1].trim();
    }
    
    return 'Alger'; // Fallback
  }
  
  /**
   * Générer un séparateur visuel
   */
  private generateSeparator(): string {
    return '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  }
  
  /**
   * Obtenir le nom du rôle en français ou arabe
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
}

export const documentHeaderService = new DocumentHeaderService();
