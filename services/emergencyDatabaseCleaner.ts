/**
 * Service de nettoyage d'urgence de la base de données
 * Supprime automatiquement tous les messages contaminés par l'interface utilisateur
 */

import { databaseService } from './databaseService';

export class EmergencyDatabaseCleaner {
  private static instance: EmergencyDatabaseCleaner;

  private constructor() {}

  static getInstance(): EmergencyDatabaseCleaner {
    if (!EmergencyDatabaseCleaner.instance) {
      EmergencyDatabaseCleaner.instance = new EmergencyDatabaseCleaner();
    }
    return EmergencyDatabaseCleaner.instance;
  }

  /**
   * Indicateurs de contamination UI - si un message contient ces éléments, il est contaminé
   */
  private readonly UI_CONTAMINATION_INDICATORS = [
    // Interface utilisateur en arabe
    'محامي دي زاد', 'متصلمحامي', 'مكتب المحاماة', 'نظام إدارة قانونية',
    'لوحة التحكم', 'بحث قانوني', 'تحريرPro', 'تحليلملفات', 'ملفاتV2',
    'وثائقإجراءات سريعة', '+ ملف جديد', '+ بحث سريع', 'arوضع آمن',
    'خبرة في القانون الجزائري', 'ترجمة الرسائل', 'عرض السجل', 'نسخ رابط',
    'أنتمترجم', '🔄إعادة تعيين', '🧹تنظيف', 'إرسال',
    
    // Artifacts techniques
    'JuristDZ', 'AUTO-TRANSLATE', 'Defined', 'процедة',
    
    // Mélanges linguistiques problématiques
    'la الأسرة', 'La الأسرة', 'Le الزواج', 'le الزواج', 'Le الطلاق', 'le الطلاق',
    'du قانون', 'de la الأسرة', 'les الحقوق', 'الحماية', 'ses الوالدين',
    'leur الطفل', 'le الحق', 'la الحضانة', 'La النسب', 'la النسب', 
    'La الوصاية', 'la الوصاية', 'un الوالد'
  ];

  /**
   * Vérifie si un message est contaminé par l'interface utilisateur
   */
  private isMessageContaminated(messageText: string): boolean {
    if (!messageText || typeof messageText !== 'string') {
      return false;
    }

    let contaminationCount = 0;
    
    this.UI_CONTAMINATION_INDICATORS.forEach(indicator => {
      if (messageText.includes(indicator)) {
        contaminationCount++;
      }
    });

    // Si plus de 2 indicateurs de contamination, considérer comme contaminé
    return contaminationCount > 2;
  }

  /**
   * Vérifie si un message a un mélange linguistique excessif
   */
  private hasExcessiveLanguageMixing(messageText: string): boolean {
    if (!messageText || typeof messageText !== 'string') {
      return false;
    }

    const arabicChars = (messageText.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
    const latinChars = (messageText.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
    const totalChars = messageText.replace(/\s/g, '').length;

    if (totalChars === 0) return false;

    const arabicRatio = arabicChars / totalChars;
    const latinRatio = latinChars / totalChars;

    // Si plus de 10% de mélange dans les deux sens, considérer comme problématique
    return arabicRatio > 0.1 && latinRatio > 0.1;
  }

  /**
   * Nettoie la base de données d'un utilisateur spécifique
   */
  async cleanUserDatabase(userId: string): Promise<{
    totalMessages: number;
    contaminatedMessages: number;
    cleanedMessages: number;
    errors: string[];
  }> {
    console.log(`🚨 NETTOYAGE D'URGENCE - Début pour utilisateur: ${userId}`);
    
    const result = {
      totalMessages: 0,
      contaminatedMessages: 0,
      cleanedMessages: 0,
      errors: []
    };

    try {
      // Récupérer tous les messages de l'utilisateur
      const messages = await databaseService.getMessages(userId);
      result.totalMessages = messages.length;

      console.log(`🚨 Messages trouvés: ${messages.length}`);

      // Identifier les messages contaminés
      const contaminatedMessages = messages.filter(message => {
        const isContaminated = this.isMessageContaminated(message.text);
        const hasLanguageMixing = this.hasExcessiveLanguageMixing(message.text);
        
        if (isContaminated || hasLanguageMixing) {
          console.log(`🚨 Message contaminé détecté: "${message.text.substring(0, 50)}..."`);
          return true;
        }
        
        return false;
      });

      result.contaminatedMessages = contaminatedMessages.length;

      if (contaminatedMessages.length > 0) {
        console.log(`🚨 ${contaminatedMessages.length} messages contaminés détectés`);
        
        // Supprimer tous les messages et recommencer avec les messages propres
        await databaseService.clearMessages(userId);
        
        // Récupérer les messages propres
        const cleanMessages = messages.filter(message => {
          const isContaminated = this.isMessageContaminated(message.text);
          const hasLanguageMixing = this.hasExcessiveLanguageMixing(message.text);
          return !isContaminated && !hasLanguageMixing && message.text.trim().length >= 10;
        });

        // Sauvegarder les messages propres
        for (const message of cleanMessages) {
          try {
            await databaseService.saveMessage(userId, message);
          } catch (error) {
            result.errors.push(`Erreur sauvegarde message ${message.id}: ${error}`);
          }
        }

        result.cleanedMessages = cleanMessages.length;
        console.log(`🚨 ✅ Nettoyage terminé: ${result.contaminatedMessages} supprimés, ${result.cleanedMessages} conservés`);
      } else {
        console.log(`🚨 ✅ Aucun message contaminé trouvé`);
      }

    } catch (error) {
      const errorMessage = `Erreur lors du nettoyage: ${error}`;
      result.errors.push(errorMessage);
      console.error(`🚨 ❌ ${errorMessage}`);
    }

    return result;
  }

  /**
   * Nettoie tous les utilisateurs (fonction d'administration)
   */
  async cleanAllUsersDatabase(): Promise<{
    totalUsers: number;
    cleanedUsers: number;
    totalMessagesProcessed: number;
    totalContaminatedMessages: number;
    errors: string[];
  }> {
    console.log(`🚨 NETTOYAGE GLOBAL D'URGENCE - Début`);
    
    const globalResult = {
      totalUsers: 0,
      cleanedUsers: 0,
      totalMessagesProcessed: 0,
      totalContaminatedMessages: 0,
      errors: []
    };

    try {
      // Récupérer tous les utilisateurs
      const users = await databaseService.getAllUsers();
      globalResult.totalUsers = users.length;

      console.log(`🚨 Utilisateurs trouvés: ${users.length}`);

      for (const user of users) {
        try {
          const userResult = await this.cleanUserDatabase(user.id);
          
          globalResult.totalMessagesProcessed += userResult.totalMessages;
          globalResult.totalContaminatedMessages += userResult.contaminatedMessages;
          
          if (userResult.contaminatedMessages > 0) {
            globalResult.cleanedUsers++;
          }
          
          globalResult.errors.push(...userResult.errors);
          
        } catch (error) {
          const errorMessage = `Erreur nettoyage utilisateur ${user.id}: ${error}`;
          globalResult.errors.push(errorMessage);
          console.error(`🚨 ❌ ${errorMessage}`);
        }
      }

      console.log(`🚨 ✅ Nettoyage global terminé:`);
      console.log(`🚨   - Utilisateurs traités: ${globalResult.totalUsers}`);
      console.log(`🚨   - Utilisateurs nettoyés: ${globalResult.cleanedUsers}`);
      console.log(`🚨   - Messages traités: ${globalResult.totalMessagesProcessed}`);
      console.log(`🚨   - Messages contaminés supprimés: ${globalResult.totalContaminatedMessages}`);

    } catch (error) {
      const errorMessage = `Erreur lors du nettoyage global: ${error}`;
      globalResult.errors.push(errorMessage);
      console.error(`🚨 ❌ ${errorMessage}`);
    }

    return globalResult;
  }

  /**
   * Analyse la contamination sans nettoyer (mode diagnostic)
   */
  async analyzeContamination(userId: string): Promise<{
    totalMessages: number;
    contaminatedMessages: number;
    contaminationDetails: Array<{
      messageId: string;
      indicators: string[];
      hasLanguageMixing: boolean;
      preview: string;
    }>;
  }> {
    console.log(`🔍 ANALYSE DE CONTAMINATION - Utilisateur: ${userId}`);
    
    const analysis = {
      totalMessages: 0,
      contaminatedMessages: 0,
      contaminationDetails: []
    };

    try {
      const messages = await databaseService.getMessages(userId);
      analysis.totalMessages = messages.length;

      for (const message of messages) {
        const indicators = [];
        const hasLanguageMixing = this.hasExcessiveLanguageMixing(message.text);
        
        this.UI_CONTAMINATION_INDICATORS.forEach(indicator => {
          if (message.text.includes(indicator)) {
            indicators.push(indicator);
          }
        });

        if (indicators.length > 2 || hasLanguageMixing) {
          analysis.contaminatedMessages++;
          analysis.contaminationDetails.push({
            messageId: message.id,
            indicators,
            hasLanguageMixing,
            preview: message.text.substring(0, 100) + '...'
          });
        }
      }

      console.log(`🔍 Analyse terminée: ${analysis.contaminatedMessages}/${analysis.totalMessages} messages contaminés`);

    } catch (error) {
      console.error(`🔍 ❌ Erreur analyse: ${error}`);
    }

    return analysis;
  }
}

// Export singleton instance
export const emergencyDatabaseCleaner = EmergencyDatabaseCleaner.getInstance();