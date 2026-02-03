/**
 * Emergency Content Generator
 * 
 * Generates safe, professional emergency content when all translation
 * methods fail, ensuring users never see corrupted or mixed-language text.
 * 
 * Requirements: 6.5
 */

import {
  TranslationRequest,
  Language,
  ContentType,
  LegalDomain,
  ContentIntent,
  FallbackContent,
  FallbackMethod,
  AudienceType,
  ComplexityLevel
} from '../types';

import { defaultLogger } from '../utils/Logger';

export interface EmergencyContentTemplate {
  id: string;
  language: Language;
  contentType: ContentType;
  legalDomain?: LegalDomain;
  audienceType: AudienceType;
  template: string;
  placeholders: Map<string, string>;
  professionalismScore: number;
  contextualRelevance: number;
  usageCount: number;
  lastUsed?: Date;
}

export interface EmergencyContentConfig {
  enableContextualGeneration: boolean;
  enableTemplatePersonalization: boolean;
  maxContentLength: number;
  minimumProfessionalismScore: number;
  fallbackToGeneric: boolean;
  includeContactInformation: boolean;
  includeApologyMessage: boolean;
}

export interface EmergencyContentMetrics {
  totalGenerations: number;
  generationsByLanguage: Map<Language, number>;
  generationsByContentType: Map<ContentType, number>;
  averageRelevanceScore: number;
  userFeedbackScore: number;
  templateEffectiveness: Map<string, number>;
}

export class EmergencyContentGenerator {
  private templates: Map<string, EmergencyContentTemplate> = new Map();
  private config: EmergencyContentConfig;
  private metrics: EmergencyContentMetrics;

  constructor(config?: Partial<EmergencyContentConfig>) {
    this.config = {
      enableContextualGeneration: true,
      enableTemplatePersonalization: true,
      maxContentLength: 500,
      minimumProfessionalismScore: 90,
      fallbackToGeneric: true,
      includeContactInformation: true,
      includeApologyMessage: false,
      ...config
    };

    this.metrics = {
      totalGenerations: 0,
      generationsByLanguage: new Map(),
      generationsByContentType: new Map(),
      averageRelevanceScore: 0,
      userFeedbackScore: 0,
      templateEffectiveness: new Map()
    };

    this.initializeEmergencyTemplates();
    
    defaultLogger.info('Emergency Content Generator initialized', {
      templatesCount: this.templates.size,
      config: this.config
    }, 'EmergencyContentGenerator');
  }

  /**
   * Generate emergency content for failed translation
   */
  async generateEmergencyContent(
    originalRequest: TranslationRequest,
    failureReason: string,
    contentIntent?: ContentIntent
  ): Promise<FallbackContent> {
    const startTime = Date.now();
    
    try {
      // Select appropriate template
      const template = this.selectBestTemplate(originalRequest, contentIntent);
      
      // Generate content from template
      const content = await this.generateFromTemplate(template, originalRequest, contentIntent);
      
      // Calculate confidence based on context match
      const confidence = this.calculateContentConfidence(template, originalRequest, contentIntent);
      
      // Update metrics
      this.updateMetrics(originalRequest, template, confidence);
      
      const result: FallbackContent = {
        content,
        confidence,
        method: this.determineGenerationMethod(template),
        context: contentIntent || this.createDefaultContentIntent(originalRequest),
        alternatives: await this.generateAlternatives(template, originalRequest)
      };
      
      defaultLogger.info('Emergency content generated', {
        templateId: template.id,
        language: originalRequest.targetLanguage,
        contentType: originalRequest.contentType,
        confidence,
        processingTime: Date.now() - startTime
      }, 'EmergencyContentGenerator');
      
      return result;
      
    } catch (error) {
      defaultLogger.error('Emergency content generation failed', {
        error: error.message,
        originalRequest: originalRequest.text.substring(0, 100)
      }, 'EmergencyContentGenerator');
      
      // Return absolute fallback
      return this.generateAbsoluteFallback(originalRequest);
    }
  }

  /**
   * Generate contextual emergency content based on detected intent
   */
  async generateContextualEmergencyContent(
    originalRequest: TranslationRequest,
    detectedIntent: ContentIntent,
    systemContext: any
  ): Promise<FallbackContent> {
    // Enhanced generation with system context
    const template = this.selectContextualTemplate(originalRequest, detectedIntent, systemContext);
    
    if (template) {
      const content = await this.generateContextualContent(template, originalRequest, detectedIntent, systemContext);
      
      return {
        content,
        confidence: 0.7, // Higher confidence for contextual content
        method: FallbackMethod.CONTEXT_GENERATED,
        context: detectedIntent,
        alternatives: await this.generateContextualAlternatives(template, originalRequest, detectedIntent)
      };
    }
    
    // Fall back to standard emergency content
    return this.generateEmergencyContent(originalRequest, 'contextual_generation_failed', detectedIntent);
  }

  /**
   * Get emergency content metrics and analytics
   */
  getEmergencyContentMetrics(): EmergencyContentMetrics {
    return { ...this.metrics };
  }

  /**
   * Update emergency content configuration
   */
  updateConfiguration(newConfig: Partial<EmergencyContentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    defaultLogger.info('Emergency content configuration updated', {
      newConfig
    }, 'EmergencyContentGenerator');
  }

  /**
   * Add custom emergency content template
   */
  addCustomTemplate(template: Omit<EmergencyContentTemplate, 'id' | 'usageCount' | 'lastUsed'>): string {
    const templateId = this.generateTemplateId();
    
    const fullTemplate: EmergencyContentTemplate = {
      ...template,
      id: templateId,
      usageCount: 0
    };
    
    this.templates.set(templateId, fullTemplate);
    
    defaultLogger.info('Custom emergency template added', {
      templateId,
      language: template.language,
      contentType: template.contentType
    }, 'EmergencyContentGenerator');
    
    return templateId;
  }

  /**
   * Remove emergency content template
   */
  removeTemplate(templateId: string): boolean {
    const removed = this.templates.delete(templateId);
    
    if (removed) {
      defaultLogger.info('Emergency template removed', { templateId }, 'EmergencyContentGenerator');
    }
    
    return removed;
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates(): EmergencyContentTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Test emergency content generation
   */
  async testEmergencyGeneration(
    language: Language,
    contentType: ContentType,
    legalDomain?: LegalDomain
  ): Promise<{ content: string; templateId: string; confidence: number }> {
    const testRequest: TranslationRequest = {
      text: 'Test content for emergency generation',
      sourceLanguage: language === Language.ARABIC ? Language.FRENCH : Language.ARABIC,
      targetLanguage: language,
      contentType,
      priority: 'normal',
      context: legalDomain ? { legalDomain } : undefined
    };
    
    const result = await this.generateEmergencyContent(testRequest, 'test_generation');
    
    return {
      content: result.content,
      templateId: 'test',
      confidence: result.confidence
    };
  }

  // Private methods

  private initializeEmergencyTemplates(): void {
    // Arabic templates
    this.addTemplate({
      language: Language.ARABIC,
      contentType: ContentType.LEGAL_DOCUMENT,
      audienceType: AudienceType.LEGAL_PROFESSIONAL,
      template: 'محتوى قانوني مهني متاح. نعتذر عن أي إزعاج، يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني للحصول على المساعدة.',
      placeholders: new Map([
        ['contact_info', 'الدعم الفني'],
        ['domain', 'قانوني']
      ]),
      professionalismScore: 95,
      contextualRelevance: 70
    });

    this.addTemplate({
      language: Language.ARABIC,
      contentType: ContentType.CHAT_MESSAGE,
      audienceType: AudienceType.GENERAL_PUBLIC,
      template: 'نعتذر، حدث خطأ في الترجمة. يرجى إعادة صياغة رسالتك أو الاتصال بالدعم.',
      placeholders: new Map([
        ['contact_info', 'الدعم']
      ]),
      professionalismScore: 90,
      contextualRelevance: 80
    });

    this.addTemplate({
      language: Language.ARABIC,
      contentType: ContentType.LEGAL_FORM,
      audienceType: AudienceType.LEGAL_PROFESSIONAL,
      template: 'نموذج قانوني مهني. للحصول على المساعدة في ملء هذا النموذج، يرجى الاتصال بالدعم القانوني.',
      placeholders: new Map([
        ['form_type', 'نموذج قانوني'],
        ['support', 'الدعم القانوني']
      ]),
      professionalismScore: 95,
      contextualRelevance: 85
    });

    // French templates
    this.addTemplate({
      language: Language.FRENCH,
      contentType: ContentType.LEGAL_DOCUMENT,
      audienceType: AudienceType.LEGAL_PROFESSIONAL,
      template: 'Contenu juridique professionnel disponible. Nous nous excusons pour tout inconvénient, veuillez réessayer ou contacter le support technique pour obtenir de l\'aide.',
      placeholders: new Map([
        ['contact_info', 'support technique'],
        ['domain', 'juridique']
      ]),
      professionalismScore: 95,
      contextualRelevance: 70
    });

    this.addTemplate({
      language: Language.FRENCH,
      contentType: ContentType.CHAT_MESSAGE,
      audienceType: AudienceType.GENERAL_PUBLIC,
      template: 'Désolé, une erreur de traduction s\'est produite. Veuillez reformuler votre message ou contacter le support.',
      placeholders: new Map([
        ['contact_info', 'support']
      ]),
      professionalismScore: 90,
      contextualRelevance: 80
    });

    this.addTemplate({
      language: Language.FRENCH,
      contentType: ContentType.LEGAL_FORM,
      audienceType: AudienceType.LEGAL_PROFESSIONAL,
      template: 'Formulaire juridique professionnel. Pour obtenir de l\'aide pour remplir ce formulaire, veuillez contacter le support juridique.',
      placeholders: new Map([
        ['form_type', 'formulaire juridique'],
        ['support', 'support juridique']
      ]),
      professionalismScore: 95,
      contextualRelevance: 85
    });

    // Generic fallback templates
    this.addTemplate({
      language: Language.ARABIC,
      contentType: ContentType.UI_TEXT,
      audienceType: AudienceType.GENERAL_PUBLIC,
      template: 'محتوى مهني متاح.',
      placeholders: new Map(),
      professionalismScore: 100,
      contextualRelevance: 50
    });

    this.addTemplate({
      language: Language.FRENCH,
      contentType: ContentType.UI_TEXT,
      audienceType: AudienceType.GENERAL_PUBLIC,
      template: 'Contenu professionnel disponible.',
      placeholders: new Map(),
      professionalismScore: 100,
      contextualRelevance: 50
    });

    defaultLogger.info('Emergency templates initialized', {
      totalTemplates: this.templates.size,
      arabicTemplates: Array.from(this.templates.values()).filter(t => t.language === Language.ARABIC).length,
      frenchTemplates: Array.from(this.templates.values()).filter(t => t.language === Language.FRENCH).length
    }, 'EmergencyContentGenerator');
  }

  private addTemplate(templateData: Omit<EmergencyContentTemplate, 'id' | 'usageCount' | 'lastUsed'>): void {
    const template: EmergencyContentTemplate = {
      ...templateData,
      id: this.generateTemplateId(),
      usageCount: 0
    };
    
    this.templates.set(template.id, template);
  }

  private selectBestTemplate(
    request: TranslationRequest,
    contentIntent?: ContentIntent
  ): EmergencyContentTemplate {
    const candidates = Array.from(this.templates.values()).filter(template => 
      template.language === request.targetLanguage
    );

    if (candidates.length === 0) {
      throw new Error(`No emergency templates available for language: ${request.targetLanguage}`);
    }

    // Score templates based on relevance
    const scoredTemplates = candidates.map(template => ({
      template,
      score: this.calculateTemplateScore(template, request, contentIntent)
    }));

    // Sort by score (highest first)
    scoredTemplates.sort((a, b) => b.score - a.score);

    return scoredTemplates[0].template;
  }

  private calculateTemplateScore(
    template: EmergencyContentTemplate,
    request: TranslationRequest,
    contentIntent?: ContentIntent
  ): number {
    let score = 0;

    // Content type match
    if (template.contentType === request.contentType) {
      score += 40;
    } else if (template.contentType === ContentType.UI_TEXT) {
      score += 10; // Generic fallback
    }

    // Legal domain match
    if (contentIntent?.category && template.legalDomain) {
      if (template.legalDomain.toString() === contentIntent.category.toString()) {
        score += 30;
      }
    }

    // Audience type consideration
    if (request.userId) {
      if (template.audienceType === AudienceType.LEGAL_PROFESSIONAL) {
        score += 20;
      }
    } else {
      if (template.audienceType === AudienceType.GENERAL_PUBLIC) {
        score += 15;
      }
    }

    // Professionalism and relevance
    score += template.professionalismScore * 0.1;
    score += template.contextualRelevance * 0.1;

    // Usage frequency (prefer less used templates for variety)
    score -= template.usageCount * 0.1;

    return score;
  }

  private async generateFromTemplate(
    template: EmergencyContentTemplate,
    request: TranslationRequest,
    contentIntent?: ContentIntent
  ): Promise<string> {
    let content = template.template;

    // Replace placeholders
    for (const [placeholder, defaultValue] of template.placeholders.entries()) {
      const value = this.getPlaceholderValue(placeholder, request, contentIntent) || defaultValue;
      content = content.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
    }

    // Apply personalization if enabled
    if (this.config.enableTemplatePersonalization) {
      content = this.personalizeContent(content, request, contentIntent);
    }

    // Ensure content length limits
    if (content.length > this.config.maxContentLength) {
      content = content.substring(0, this.config.maxContentLength - 3) + '...';
    }

    // Update template usage
    template.usageCount++;
    template.lastUsed = new Date();

    return content;
  }

  private getPlaceholderValue(
    placeholder: string,
    request: TranslationRequest,
    contentIntent?: ContentIntent
  ): string | null {
    switch (placeholder) {
      case 'domain':
        return contentIntent?.category || 'قانوني';
      case 'contact_info':
        return this.config.includeContactInformation ? 'الدعم الفني' : null;
      case 'form_type':
        return request.contentType === ContentType.LEGAL_FORM ? 'نموذج قانوني' : null;
      default:
        return null;
    }
  }

  private personalizeContent(
    content: string,
    request: TranslationRequest,
    contentIntent?: ContentIntent
  ): string {
    // Add context-specific information if available
    if (contentIntent?.complexity === ComplexityLevel.EXPERT) {
      const expertNote = request.targetLanguage === Language.ARABIC 
        ? ' (محتوى متخصص)'
        : ' (contenu spécialisé)';
      content += expertNote;
    }

    return content;
  }

  private calculateContentConfidence(
    template: EmergencyContentTemplate,
    request: TranslationRequest,
    contentIntent?: ContentIntent
  ): number {
    let confidence = 0.3; // Base confidence for emergency content

    // Increase confidence for exact matches
    if (template.contentType === request.contentType) {
      confidence += 0.2;
    }

    if (contentIntent && template.legalDomain) {
      if (template.legalDomain.toString() === contentIntent.category.toString()) {
        confidence += 0.2;
      }
    }

    // Factor in template quality
    confidence += (template.professionalismScore / 100) * 0.2;
    confidence += (template.contextualRelevance / 100) * 0.1;

    return Math.min(0.8, confidence); // Cap at 0.8 for emergency content
  }

  private updateMetrics(
    request: TranslationRequest,
    template: EmergencyContentTemplate,
    confidence: number
  ): void {
    this.metrics.totalGenerations++;

    // Update language metrics
    const langCount = this.metrics.generationsByLanguage.get(request.targetLanguage) || 0;
    this.metrics.generationsByLanguage.set(request.targetLanguage, langCount + 1);

    // Update content type metrics
    const typeCount = this.metrics.generationsByContentType.get(request.contentType) || 0;
    this.metrics.generationsByContentType.set(request.contentType, typeCount + 1);

    // Update template effectiveness
    const templateEffectiveness = this.metrics.templateEffectiveness.get(template.id) || 0;
    this.metrics.templateEffectiveness.set(template.id, templateEffectiveness + confidence);

    // Update average relevance score
    this.metrics.averageRelevanceScore = 
      (this.metrics.averageRelevanceScore * (this.metrics.totalGenerations - 1) + confidence) / 
      this.metrics.totalGenerations;
  }

  private determineGenerationMethod(template: EmergencyContentTemplate): FallbackMethod {
    if (template.contentType === ContentType.UI_TEXT) {
      return FallbackMethod.EMERGENCY_GENERIC;
    } else if (template.placeholders.size > 0) {
      return FallbackMethod.TEMPLATE_BASED;
    } else {
      return FallbackMethod.CONTEXT_GENERATED;
    }
  }

  private createDefaultContentIntent(request: TranslationRequest): ContentIntent {
    return {
      category: this.mapContentTypeToLegalCategory(request.contentType),
      concepts: [],
      context: {
        jurisdiction: 'Algeria',
        lawType: 'general'
      },
      complexity: ComplexityLevel.SIMPLE,
      audience: request.userId ? AudienceType.LEGAL_PROFESSIONAL : AudienceType.GENERAL_PUBLIC,
      confidence: 0.3
    };
  }

  private mapContentTypeToLegalCategory(contentType: ContentType): any {
    switch (contentType) {
      case ContentType.LEGAL_DOCUMENT:
      case ContentType.COURT_DOCUMENT:
        return 'civil_law';
      case ContentType.CONTRACT:
        return 'commercial_law';
      case ContentType.LEGAL_FORM:
        return 'procedural_law';
      default:
        return 'civil_law';
    }
  }

  private async generateAlternatives(
    template: EmergencyContentTemplate,
    request: TranslationRequest
  ): Promise<string[]> {
    const alternatives: string[] = [];

    // Find similar templates
    const similarTemplates = Array.from(this.templates.values()).filter(t => 
      t.language === template.language && 
      t.id !== template.id &&
      (t.contentType === template.contentType || t.contentType === ContentType.UI_TEXT)
    );

    // Generate up to 2 alternatives
    for (let i = 0; i < Math.min(2, similarTemplates.length); i++) {
      const altTemplate = similarTemplates[i];
      const altContent = await this.generateFromTemplate(altTemplate, request);
      alternatives.push(altContent);
    }

    return alternatives;
  }

  private selectContextualTemplate(
    request: TranslationRequest,
    intent: ContentIntent,
    systemContext: any
  ): EmergencyContentTemplate | null {
    // Enhanced template selection with system context
    const candidates = Array.from(this.templates.values()).filter(template => 
      template.language === request.targetLanguage &&
      template.legalDomain === intent.category
    );

    if (candidates.length === 0) {
      return null;
    }

    // Select based on system context (e.g., system load, error frequency)
    return candidates[0]; // Simplified selection
  }

  private async generateContextualContent(
    template: EmergencyContentTemplate,
    request: TranslationRequest,
    intent: ContentIntent,
    systemContext: any
  ): Promise<string> {
    // Enhanced content generation with system context
    let content = await this.generateFromTemplate(template, request, intent);

    // Add system-specific information if relevant
    if (systemContext.highErrorRate) {
      const systemNote = request.targetLanguage === Language.ARABIC 
        ? ' نحن نعمل على حل المشكلة.'
        : ' Nous travaillons à résoudre le problème.';
      content += systemNote;
    }

    return content;
  }

  private async generateContextualAlternatives(
    template: EmergencyContentTemplate,
    request: TranslationRequest,
    intent: ContentIntent
  ): Promise<string[]> {
    // Generate alternatives based on context
    return this.generateAlternatives(template, request);
  }

  private generateAbsoluteFallback(request: TranslationRequest): FallbackContent {
    const content = request.targetLanguage === Language.ARABIC 
      ? 'محتوى مهني متاح.'
      : 'Contenu professionnel disponible.';

    return {
      content,
      confidence: 0.2,
      method: FallbackMethod.EMERGENCY_GENERIC,
      context: this.createDefaultContentIntent(request),
      alternatives: []
    };
  }

  private generateTemplateId(): string {
    return `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}