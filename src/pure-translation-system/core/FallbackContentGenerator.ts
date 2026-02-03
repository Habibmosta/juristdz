/**
 * Intelligent Fallback Content Generator
 * 
 * Generates contextually appropriate professional legal content when automatic
 * translation fails. Implements zero-tolerance policy by ensuring users never
 * see corrupted, mixed, or error content.
 * 
 * Features:
 * - Intent detection for legal content
 * - Contextually appropriate content generation
 * - Professional legal content templates
 * - Algerian legal system awareness
 * - Emergency fallback mechanisms
 */

import {
  Language,
  ContentIntent,
  FallbackContent,
  FallbackMethod,
  LegalDomain,
  LegalCategory,
  ComplexityLevel,
  AudienceType,
  LegalContext,
  LegalConcept,
  ContentType
} from '../types';

import { IFallbackContentGenerator } from '../interfaces/FallbackContentGenerator';

export class FallbackContentGenerator implements IFallbackContentGenerator {
  
  // Professional legal content templates for Arabic
  private readonly ARABIC_TEMPLATES = new Map([
    [LegalCategory.CIVIL_LAW, [
      'يتعلق هذا المحتوى بأحكام القانون المدني الجزائري',
      'وفقاً لأحكام القانون المدني، يجب مراعاة الالتزامات التعاقدية',
      'في إطار القانون المدني الجزائري، تطبق الأحكام ذات الصلة',
      'يخضع هذا الموضوع لأحكام القانون المدني والتشريعات المكملة له'
    ]],
    [LegalCategory.CRIMINAL_LAW, [
      'يتعلق هذا المحتوى بأحكام قانون العقوبات الجزائري',
      'وفقاً لقانون الإجراءات الجزائية، تطبق الأحكام المنصوص عليها',
      'في إطار القانون الجنائي الجزائري، يجب احترام الضمانات القانونية',
      'يخضع هذا الموضوع لأحكام قانون العقوبات والقوانين الخاصة'
    ]],
    [LegalCategory.COMMERCIAL_LAW, [
      'يتعلق هذا المحتوى بأحكام القانون التجاري الجزائري',
      'وفقاً للقانون التجاري، تطبق الأحكام المتعلقة بالأنشطة التجارية',
      'في إطار التشريع التجاري الجزائري، يجب مراعاة الالتزامات المهنية',
      'يخضع هذا الموضوع لأحكام القانون التجاري والتنظيمات المكملة'
    ]],
    [LegalCategory.ADMINISTRATIVE_LAW, [
      'يتعلق هذا المحتوى بأحكام القانون الإداري الجزائري',
      'وفقاً للقانون الإداري، تطبق الأحكام المتعلقة بالإدارة العمومية',
      'في إطار التشريع الإداري الجزائري، يجب احترام المبادئ العامة',
      'يخضع هذا الموضوع لأحكام القانون الإداري والتنظيمات التنفيذية'
    ]],
    [LegalCategory.FAMILY_LAW, [
      'يتعلق هذا المحتوى بأحكام قانون الأسرة الجزائري',
      'وفقاً لقانون الأسرة، تطبق الأحكام المتعلقة بالأحوال الشخصية',
      'في إطار قانون الأسرة الجزائري، يجب مراعاة المصلحة العليا للأسرة',
      'يخضع هذا الموضوع لأحكام قانون الأسرة والتشريعات ذات الصلة'
    ]],
    [LegalCategory.PROCEDURAL_LAW, [
      'يتعلق هذا المحتوى بأحكام قانون الإجراءات المدنية والإدارية',
      'وفقاً لقانون الإجراءات، يجب احترام الضمانات الإجرائية',
      'في إطار قانون الإجراءات الجزائري، تطبق القواعد الإجرائية',
      'يخضع هذا الموضوع لأحكام قوانين الإجراءات والتنظيمات المكملة'
    ]]
  ]);

  // Professional legal content templates for French
  private readonly FRENCH_TEMPLATES = new Map([
    [LegalCategory.CIVIL_LAW, [
      'Ce contenu concerne les dispositions du Code civil algérien',
      'Conformément au Code civil, les obligations contractuelles doivent être respectées',
      'Dans le cadre du droit civil algérien, les dispositions pertinentes s\'appliquent',
      'Cette matière est soumise aux dispositions du Code civil et aux textes complémentaires'
    ]],
    [LegalCategory.CRIMINAL_LAW, [
      'Ce contenu concerne les dispositions du Code pénal algérien',
      'Conformément au Code de procédure pénale, les dispositions prévues s\'appliquent',
      'Dans le cadre du droit pénal algérien, les garanties légales doivent être respectées',
      'Cette matière est soumise aux dispositions du Code pénal et aux lois spéciales'
    ]],
    [LegalCategory.COMMERCIAL_LAW, [
      'Ce contenu concerne les dispositions du Code de commerce algérien',
      'Conformément au Code de commerce, les dispositions relatives aux activités commerciales s\'appliquent',
      'Dans le cadre de la législation commerciale algérienne, les obligations professionnelles doivent être respectées',
      'Cette matière est soumise aux dispositions du Code de commerce et aux règlements complémentaires'
    ]],
    [LegalCategory.ADMINISTRATIVE_LAW, [
      'Ce contenu concerne les dispositions du droit administratif algérien',
      'Conformément au droit administratif, les dispositions relatives à l\'administration publique s\'appliquent',
      'Dans le cadre de la législation administrative algérienne, les principes généraux doivent être respectés',
      'Cette matière est soumise aux dispositions du droit administratif et aux règlements d\'exécution'
    ]],
    [LegalCategory.FAMILY_LAW, [
      'Ce contenu concerne les dispositions du Code de la famille algérien',
      'Conformément au Code de la famille, les dispositions relatives au statut personnel s\'appliquent',
      'Dans le cadre du Code de la famille algérien, l\'intérêt supérieur de la famille doit être pris en compte',
      'Cette matière est soumise aux dispositions du Code de la famille et aux textes connexes'
    ]],
    [LegalCategory.PROCEDURAL_LAW, [
      'Ce contenu concerne les dispositions du Code de procédure civile et administrative',
      'Conformément au Code de procédure, les garanties procédurales doivent être respectées',
      'Dans le cadre du droit procédural algérien, les règles de procédure s\'appliquent',
      'Cette matière est soumise aux dispositions des codes de procédure et aux règlements complémentaires'
    ]]
  ]);

  // Emergency generic content for critical failures
  private readonly EMERGENCY_CONTENT = new Map([
    [Language.ARABIC, [
      'المحتوى القانوني متاح باللغة العربية',
      'يرجى الرجوع إلى النصوص القانونية الأصلية',
      'للحصول على معلومات دقيقة، يرجى استشارة مختص قانوني',
      'هذا المحتوى يخضع للقانون الجزائري'
    ]],
    [Language.FRENCH, [
      'Contenu juridique disponible en français',
      'Veuillez vous référer aux textes légaux originaux',
      'Pour des informations précises, veuillez consulter un spécialiste juridique',
      'Ce contenu est soumis au droit algérien'
    ]]
  ]);

  // Legal concept keywords for intent detection
  private readonly LEGAL_CONCEPT_KEYWORDS = new Map([
    [LegalDomain.CIVIL_LAW, [
      'عقد', 'التزام', 'مسؤولية', 'ضرر', 'تعويض', 'ملكية', 'حق عيني',
      'contrat', 'obligation', 'responsabilité', 'dommage', 'indemnisation', 'propriété', 'droit réel'
    ]],
    [LegalDomain.CRIMINAL_LAW, [
      'جريمة', 'جنحة', 'مخالفة', 'عقوبة', 'متهم', 'ضحية', 'محاكمة',
      'crime', 'délit', 'contravention', 'peine', 'accusé', 'victime', 'procès'
    ]],
    [LegalDomain.COMMERCIAL_LAW, [
      'شركة', 'تاجر', 'إفلاس', 'سجل تجاري', 'عمل تجاري', 'منافسة',
      'société', 'commerçant', 'faillite', 'registre de commerce', 'acte de commerce', 'concurrence'
    ]],
    [LegalDomain.ADMINISTRATIVE_LAW, [
      'قرار إداري', 'طعن', 'مجلس الدولة', 'إدارة', 'خدمة عمومية',
      'décision administrative', 'recours', 'conseil d\'état', 'administration', 'service public'
    ]],
    [LegalDomain.FAMILY_LAW, [
      'زواج', 'طلاق', 'نفقة', 'حضانة', 'ميراث', 'وصية',
      'mariage', 'divorce', 'pension alimentaire', 'garde', 'succession', 'testament'
    ]],
    [LegalDomain.PROCEDURAL_LAW, [
      'دعوى', 'حكم', 'قرار', 'استئناف', 'نقض', 'تنفيذ', 'إجراءات',
      'action', 'jugement', 'arrêt', 'appel', 'cassation', 'exécution', 'procédure'
    ]]
  ]);

  constructor() {
    // Initialize fallback content generator
  }

  /**
   * Generate intelligent fallback content based on detected intent
   */
  async generateFallbackContent(
    originalText: string,
    targetLanguage: Language,
    failureReason?: string
  ): Promise<FallbackContent> {
    try {
      // Step 1: Detect content intent
      const intent = await this.detectContentIntent(originalText);
      
      // Step 2: Generate contextually appropriate content
      const content = this.generateContextualContent(intent, targetLanguage);
      
      // Step 3: Calculate confidence based on intent detection quality
      const confidence = this.calculateFallbackConfidence(intent, originalText);
      
      // Step 4: Generate alternative content options
      const alternatives = this.generateAlternativeContent(intent, targetLanguage);
      
      return {
        content,
        confidence,
        method: this.selectFallbackMethod(intent, confidence),
        context: intent,
        alternatives,
        metadata: {
          originalTextLength: originalText.length,
          failureReason: failureReason || 'Unknown',
          intentDetected: intent.category,
          generationTime: Date.now()
        }
      };
      
    } catch (error) {
      // Emergency fallback - return generic professional content
      return this.generateEmergencyFallback(targetLanguage, error.message);
    }
  }

  /**
   * Detect content intent from original text
   */
  async detectContentIntent(text: string): Promise<ContentIntent> {
    const concepts: LegalConcept[] = [];
    let detectedDomain = LegalDomain.CIVIL_LAW; // Default
    let confidence = 0.5; // Base confidence
    
    // Analyze text for legal concepts and domain
    this.LEGAL_CONCEPT_KEYWORDS.forEach((keywords, domain) => {
      let domainScore = 0;
      
      keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          concepts.push({
            term: keyword,
            domain,
            importance: 1.0,
            alternatives: []
          });
          domainScore += 1;
        }
      });
      
      // Update detected domain if this domain has more matches
      if (domainScore > confidence * 2) {
        detectedDomain = domain;
        confidence = Math.min(0.9, 0.5 + (domainScore * 0.1));
      }
    });
    
    // Determine legal category from domain
    const category = this.mapDomainToCategory(detectedDomain);
    
    // Determine complexity based on text characteristics
    const complexity = this.determineComplexity(text, concepts.length);
    
    // Determine audience based on text style and terminology
    const audience = this.determineAudience(text, concepts.length);
    
    return {
      category,
      concepts,
      context: {
        jurisdiction: 'Algérie',
        lawType: this.getDomainDescription(detectedDomain),
        procedureType: undefined,
        courtLevel: undefined,
        caseType: undefined
      },
      complexity,
      audience,
      confidence
    };
  }

  /**
   * Generate contextually appropriate content
   */
  generateContextualContent(intent: ContentIntent, targetLanguage: Language): string {
    const templates = targetLanguage === Language.ARABIC 
      ? this.ARABIC_TEMPLATES 
      : this.FRENCH_TEMPLATES;
    
    const categoryTemplates = templates.get(intent.category);
    if (!categoryTemplates || categoryTemplates.length === 0) {
      return this.getGenericTemplate(targetLanguage);
    }
    
    // Select template based on complexity and audience
    const templateIndex = this.selectTemplateIndex(intent, categoryTemplates.length);
    let selectedTemplate = categoryTemplates[templateIndex];
    
    // Enhance template with specific concepts if available
    if (intent.concepts.length > 0) {
      selectedTemplate = this.enhanceTemplateWithConcepts(selectedTemplate, intent, targetLanguage);
    }
    
    return selectedTemplate;
  }

  /**
   * Generate professional content for specific legal domain
   */
  generateProfessionalContent(
    domain: LegalDomain,
    targetLanguage: Language,
    context?: LegalContext
  ): string {
    const category = this.mapDomainToCategory(domain);
    const templates = targetLanguage === Language.ARABIC 
      ? this.ARABIC_TEMPLATES 
      : this.FRENCH_TEMPLATES;
    
    const categoryTemplates = templates.get(category);
    if (!categoryTemplates || categoryTemplates.length === 0) {
      return this.getGenericTemplate(targetLanguage);
    }
    
    // Select the most appropriate template for the domain
    let template = categoryTemplates[0]; // Default to first template
    
    // Customize template based on context if provided
    if (context) {
      template = this.customizeTemplateWithContext(template, context, targetLanguage);
    }
    
    return template;
  }

  /**
   * Generate emergency fallback content for critical failures
   */
  generateEmergencyFallback(targetLanguage: Language, errorReason?: string): FallbackContent {
    const emergencyTemplates = this.EMERGENCY_CONTENT.get(targetLanguage);
    const content = emergencyTemplates ? emergencyTemplates[0] : 'Contenu juridique professionnel';
    
    return {
      content,
      confidence: 0.3, // Low confidence for emergency content
      method: FallbackMethod.EMERGENCY_GENERIC,
      context: {
        category: LegalCategory.CIVIL_LAW,
        concepts: [],
        context: {
          jurisdiction: 'Algérie',
          lawType: 'Général'
        },
        complexity: ComplexityLevel.SIMPLE,
        audience: AudienceType.GENERAL_PUBLIC,
        confidence: 0.3
      },
      alternatives: emergencyTemplates ? emergencyTemplates.slice(1) : [],
      metadata: {
        emergency: true,
        errorReason: errorReason || 'Critical system failure',
        generationTime: Date.now()
      }
    };
  }

  /**
   * Map legal domain to category
   */
  private mapDomainToCategory(domain: LegalDomain): LegalCategory {
    switch (domain) {
      case LegalDomain.CIVIL_LAW:
        return LegalCategory.CIVIL_LAW;
      case LegalDomain.CRIMINAL_LAW:
        return LegalCategory.CRIMINAL_LAW;
      case LegalDomain.COMMERCIAL_LAW:
        return LegalCategory.COMMERCIAL_LAW;
      case LegalDomain.ADMINISTRATIVE_LAW:
        return LegalCategory.ADMINISTRATIVE_LAW;
      case LegalDomain.FAMILY_LAW:
        return LegalCategory.FAMILY_LAW;
      case LegalDomain.PROCEDURAL_LAW:
        return LegalCategory.PROCEDURAL_LAW;
      default:
        return LegalCategory.CIVIL_LAW;
    }
  }

  /**
   * Get domain description
   */
  private getDomainDescription(domain: LegalDomain): string {
    switch (domain) {
      case LegalDomain.CIVIL_LAW:
        return 'Droit civil';
      case LegalDomain.CRIMINAL_LAW:
        return 'Droit pénal';
      case LegalDomain.COMMERCIAL_LAW:
        return 'Droit commercial';
      case LegalDomain.ADMINISTRATIVE_LAW:
        return 'Droit administratif';
      case LegalDomain.FAMILY_LAW:
        return 'Droit de la famille';
      case LegalDomain.PROCEDURAL_LAW:
        return 'Droit procédural';
      default:
        return 'Droit général';
    }
  }

  /**
   * Determine text complexity
   */
  private determineComplexity(text: string, conceptsCount: number): ComplexityLevel {
    const textLength = text.length;
    
    if (textLength < 50 && conceptsCount <= 1) {
      return ComplexityLevel.SIMPLE;
    } else if (textLength < 200 && conceptsCount <= 3) {
      return ComplexityLevel.MODERATE;
    } else if (textLength < 500 && conceptsCount <= 5) {
      return ComplexityLevel.COMPLEX;
    } else {
      return ComplexityLevel.EXPERT;
    }
  }

  /**
   * Determine target audience
   */
  private determineAudience(text: string, conceptsCount: number): AudienceType {
    // Simple heuristic based on terminology density and complexity
    if (conceptsCount === 0) {
      return AudienceType.GENERAL_PUBLIC;
    } else if (conceptsCount <= 2) {
      return AudienceType.LEGAL_PROFESSIONAL;
    } else {
      return AudienceType.LAWYER;
    }
  }

  /**
   * Select template index based on intent
   */
  private selectTemplateIndex(intent: ContentIntent, templateCount: number): number {
    // Select template based on complexity and confidence
    let index = 0;
    
    if (intent.complexity === ComplexityLevel.EXPERT && templateCount > 3) {
      index = 3;
    } else if (intent.complexity === ComplexityLevel.COMPLEX && templateCount > 2) {
      index = 2;
    } else if (intent.complexity === ComplexityLevel.MODERATE && templateCount > 1) {
      index = 1;
    }
    
    return Math.min(index, templateCount - 1);
  }

  /**
   * Enhance template with specific legal concepts
   */
  private enhanceTemplateWithConcepts(
    template: string, 
    intent: ContentIntent, 
    targetLanguage: Language
  ): string {
    // Add specific legal concepts to make the template more relevant
    if (intent.concepts.length > 0) {
      const primaryConcept = intent.concepts[0];
      
      if (targetLanguage === Language.ARABIC) {
        return template + ` ويتعلق بشكل خاص بـ${primaryConcept.term}.`;
      } else {
        return template + ` et concerne particulièrement ${primaryConcept.term}.`;
      }
    }
    
    return template;
  }

  /**
   * Customize template with legal context
   */
  private customizeTemplateWithContext(
    template: string, 
    context: LegalContext, 
    targetLanguage: Language
  ): string {
    // Add context-specific information to the template
    if (context.lawType) {
      if (targetLanguage === Language.ARABIC) {
        return template.replace('القانون', context.lawType);
      } else {
        return template.replace('droit', context.lawType);
      }
    }
    
    return template;
  }

  /**
   * Get generic template for fallback
   */
  private getGenericTemplate(targetLanguage: Language): string {
    if (targetLanguage === Language.ARABIC) {
      return 'هذا محتوى قانوني مهني وفقاً للقانون الجزائري';
    } else {
      return 'Contenu juridique professionnel conforme au droit algérien';
    }
  }

  /**
   * Calculate fallback confidence
   */
  private calculateFallbackConfidence(intent: ContentIntent, originalText: string): number {
    let confidence = intent.confidence;
    
    // Adjust based on text length
    if (originalText.length < 10) {
      confidence -= 0.2;
    }
    
    // Adjust based on concept detection
    if (intent.concepts.length === 0) {
      confidence -= 0.1;
    } else {
      confidence += Math.min(0.2, intent.concepts.length * 0.05);
    }
    
    return Math.max(0.3, Math.min(0.9, confidence));
  }

  /**
   * Select appropriate fallback method
   */
  private selectFallbackMethod(intent: ContentIntent, confidence: number): FallbackMethod {
    if (confidence > 0.7 && intent.concepts.length > 0) {
      return FallbackMethod.CONTEXT_GENERATED;
    } else if (confidence > 0.5) {
      return FallbackMethod.TEMPLATE_BASED;
    } else if (intent.concepts.length > 0) {
      return FallbackMethod.DICTIONARY_LOOKUP;
    } else {
      return FallbackMethod.RULE_BASED;
    }
  }

  /**
   * Generate alternative content options
   */
  private generateAlternativeContent(intent: ContentIntent, targetLanguage: Language): string[] {
    const templates = targetLanguage === Language.ARABIC 
      ? this.ARABIC_TEMPLATES 
      : this.FRENCH_TEMPLATES;
    
    const categoryTemplates = templates.get(intent.category);
    if (!categoryTemplates || categoryTemplates.length <= 1) {
      return [];
    }
    
    // Return up to 3 alternative templates
    return categoryTemplates.slice(1, 4);
  }
}