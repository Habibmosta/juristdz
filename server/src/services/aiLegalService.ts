import { logger } from '@/utils/logger';
import { config } from '@/config/environment';
import { aiClient, AIRequest } from './aiClient';
import { db } from '@/database/connection';
import {
  AILegalService as IAILegalService,
  LegalContext,
  DocumentDraft,
  ComplianceAnalysis,
  Suggestion,
  Explanation,
  ValidationResult,
  GeneratedClause,
  ContractReview,
  LegalEntity,
  DocumentSummary,
  TranslationResult,
  ClauseType,
  ClauseContext,
  ReviewType,
  SummaryType,
  ExplanationLevel,
  ComplianceIssue,
  ImprovementSuggestion,
  RiskAssessment,
  AIModelConfig,
  ComplianceRule,
  TextLocation,
  LogicalGap,
  Evidence,
  CounterArgument,
  DraftSuggestion,
  EntityType,
  LegalEntity as ILegalEntity,
  EntityAttribute,
  EntityRelationship
} from '@/types/ai';
import { DocumentType, DocumentCategory } from '@/types/document';
import { LegalDomain, LegalReference } from '@/types/search';
import { Profession } from '@/types/auth';

export class AILegalService implements IAILegalService {
  private readonly modelConfig: AIModelConfig = {
    model: 'gpt-4',
    version: '2024-01',
    temperature: 0.3,
    maxTokens: 4000,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    stopSequences: [],
    customPrompts: {},
    domainSpecificSettings: {}
  };

  /**
   * Generate document draft using AI
   * Validates: Requirements 4.5, 4.6 - AI-assisted document generation
   */
  async generateDocumentDraft(type: DocumentType, context: LegalContext): Promise<DocumentDraft> {
    try {
      logger.info('Generating document draft', { type, userRole: context.userRole, domain: context.legalDomain });

      // Build context-specific prompt
      const prompt = this.buildDocumentPrompt(type, context);
      
      // Call AI service
      const aiRequest: AIRequest = {
        prompt,
        context,
        maxTokens: 3000,
        temperature: 0.3,
        model: 'gemini-pro'
      };

      const aiResponse = await aiClient.generate(aiRequest);
      
      // Parse and structure the response
      const draft = this.parseDocumentDraft(aiResponse.content, type, context, aiResponse);
      
      // Add legal references and suggestions
      draft.legalReferences = await this.findRelevantLegalReferences(draft.content, context);
      draft.suggestions = await this.generateDraftSuggestions(draft.content, context);
      
      // Validate the generated content
      const isValid = aiClient.validateLegalResponse(aiResponse, context);
      if (!isValid) {
        draft.warnings.push('Le contenu généré nécessite une révision manuelle');
      }

      logger.info('Document draft generated successfully', { 
        type, 
        wordCount: draft.content.split(' ').length,
        suggestionsCount: draft.suggestions.length,
        confidence: draft.confidence
      });

      return draft;

    } catch (error) {
      logger.error('Document draft generation error:', error);
      throw new Error('Failed to generate document draft');
    }
  }

  /**
   * Analyze document compliance with Algerian law
   * Validates: Requirements 4.5, 4.6 - Legal compliance validation
   */
  async analyzeCompliance(document: string, domain: LegalDomain): Promise<ComplianceAnalysis> {
    try {
      logger.info('Analyzing document compliance', { domain, documentLength: document.length });

      // Get applicable compliance rules for the domain
      const rules = await this.getComplianceRules(domain);
      
      // Build compliance analysis prompt
      const prompt = this.buildCompliancePrompt(document, domain, rules);
      
      const aiRequest: AIRequest = {
        prompt,
        context: { 
          userRole: Profession.AVOCAT, 
          legalDomain: domain, 
          jurisdiction: 'Algeria',
          language: 'fr'
        } as LegalContext,
        maxTokens: 2500,
        temperature: 0.2 // Lower temperature for more consistent analysis
      };

      const aiResponse = await aiClient.generate(aiRequest);
      
      // Parse AI response to extract compliance issues
      const issues = await this.parseComplianceIssues(aiResponse.content, rules);
      const suggestions = await this.parseImprovementSuggestions(aiResponse.content);
      
      // Calculate overall compliance score
      const overallScore = this.calculateComplianceScore(issues, document.length);
      
      // Assess risks
      const riskAssessment = this.assessComplianceRisks(issues, domain);

      const analysis: ComplianceAnalysis = {
        isCompliant: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
        overallScore,
        issues,
        suggestions,
        confidence: Math.min(0.95, aiResponse.usage.totalTokens / 1000 * 0.1 + 0.7), // Confidence based on analysis depth
        legalReferences: this.extractLegalReferences(issues),
        checkedRules: rules,
        summary: this.generateComplianceSummary(issues, overallScore),
        riskAssessment
      };

      logger.info('Compliance analysis completed', { 
        overallScore, 
        issuesCount: issues.length, 
        isCompliant: analysis.isCompliant,
        confidence: analysis.confidence
      });

      return analysis;

    } catch (error) {
      logger.error('Compliance analysis error:', error);
      throw new Error('Failed to analyze document compliance');
    }
  }

  /**
   * Suggest improvements for legal document
   * Validates: Requirements 4.6 - AI-powered improvement suggestions
   */
  async suggestImprovements(document: string, userRole: Profession): Promise<Suggestion[]> {
    try {
      logger.info('Generating improvement suggestions', { userRole, documentLength: document.length });

      const suggestions: Suggestion[] = [];

      // Build comprehensive analysis prompt
      const prompt = this.buildImprovementPrompt(document, userRole);
      
      const aiRequest: AIRequest = {
        prompt,
        context: { 
          userRole, 
          language: 'fr',
          jurisdiction: 'Algeria'
        } as LegalContext,
        maxTokens: 2000,
        temperature: 0.4
      };

      const aiResponse = await aiClient.generate(aiRequest);
      
      // Parse AI response to extract different types of suggestions
      const parsedSuggestions = await this.parseImprovementResponse(aiResponse.content, document);
      suggestions.push(...parsedSuggestions);

      // Add role-specific suggestions
      const roleSpecificSuggestions = await this.generateRoleSpecificSuggestions(document, userRole);
      suggestions.push(...roleSpecificSuggestions);

      // Sort by priority and confidence
      suggestions.sort((a, b) => {
        if (a.priority !== b.priority) {
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.confidence - a.confidence;
      });

      // Limit to top 20 suggestions to avoid overwhelming the user
      const finalSuggestions = suggestions.slice(0, 20);

      logger.info('Improvement suggestions generated', { 
        totalSuggestions: finalSuggestions.length,
        highPriority: finalSuggestions.filter(s => s.priority === 'high').length,
        averageConfidence: finalSuggestions.reduce((sum, s) => sum + s.confidence, 0) / finalSuggestions.length
      });

      return finalSuggestions;

    } catch (error) {
      logger.error('Improvement suggestions error:', error);
      throw new Error('Failed to generate improvement suggestions');
    }
  }

  /**
   * Explain legal concept with context
   * Validates: Requirements 8.1-8.4 - Educational explanations for students
   */
  async explainLegalConcept(concept: string, level: ExplanationLevel): Promise<Explanation> {
    try {
      logger.info('Explaining legal concept', { concept, level });

      // Build explanation prompt based on level
      const prompt = this.buildExplanationPrompt(concept, level);
      
      const aiRequest: AIRequest = {
        prompt,
        context: { 
          userRole: level === ExplanationLevel.BEGINNER ? Profession.ETUDIANT : Profession.AVOCAT,
          language: 'fr',
          jurisdiction: 'Algeria',
          legalDomain: this.inferDomainFromConcept(concept)
        } as LegalContext,
        maxTokens: level === ExplanationLevel.EXPERT ? 3000 : 2000,
        temperature: 0.3
      };

      const aiResponse = await aiClient.generate(aiRequest);

      // Find related legal references
      const legalBasis = await this.findConceptReferences(concept);
      
      // Generate examples based on level
      const examples = await this.generateConceptExamples(concept, level);

      // Parse AI response
      const parsedContent = this.parseExplanationResponse(aiResponse.content);

      const explanation: Explanation = {
        concept,
        definition: parsedContent.definition,
        context: parsedContent.context,
        examples,
        relatedConcepts: parsedContent.relatedConcepts,
        legalBasis,
        practicalApplications: parsedContent.practicalApplications,
        commonMisunderstandings: parsedContent.commonMisunderstandings,
        level,
        language: 'fr',
        lastUpdated: new Date(),
        sources: parsedContent.sources
      };

      // Store explanation for future reference
      await this.storeExplanation(explanation);

      logger.info('Legal concept explained successfully', { 
        concept, 
        level,
        definitionLength: explanation.definition.length,
        examplesCount: explanation.examples.length
      });

      return explanation;

    } catch (error) {
      logger.error('Legal concept explanation error:', error);
      throw new Error('Failed to explain legal concept');
    }
  }

  /**
   * Validate legal reasoning in argument
   * Validates: Requirements - Legal reasoning validation
   */
  async validateLegalReasoning(argument: string): Promise<ValidationResult> {
    try {
      logger.info('Validating legal reasoning', { argumentLength: argument.length });

      // Analyze logical structure
      const logicalGaps = await this.findLogicalGaps(argument);
      
      // Find supporting evidence
      const supportingEvidence = await this.findSupportingEvidence(argument);
      
      // Generate counter-arguments
      const counterArguments = await this.generateCounterArguments(argument);
      
      // Calculate validity score
      const score = this.calculateReasoningScore(logicalGaps, supportingEvidence, counterArguments);
      
      const result: ValidationResult = {
        isValid: score >= 70,
        score,
        strengths: this.identifyReasoningStrengths(argument, supportingEvidence),
        weaknesses: this.identifyReasoningWeaknesses(logicalGaps),
        logicalGaps,
        supportingEvidence,
        counterArguments,
        recommendations: this.generateReasoningRecommendations(logicalGaps, supportingEvidence),
        confidence: 0.8,
        reasoning: this.generateReasoningExplanation(score, logicalGaps, supportingEvidence)
      };

      logger.info('Legal reasoning validated', { score, isValid: result.isValid });

      return result;

    } catch (error) {
      logger.error('Legal reasoning validation error:', error);
      throw new Error('Failed to validate legal reasoning');
    }
  }

  /**
   * Generate legal clause
   */
  async generateClause(clauseType: ClauseType, context: ClauseContext): Promise<GeneratedClause> {
    try {
      logger.info('Generating legal clause', { clauseType, contractType: context.contractType });

      const prompt = this.buildClausePrompt(clauseType, context);
      const aiResponse = await this.callAIService(prompt, { 
        userRole: Profession.AVOCAT, 
        language: context.language 
      } as LegalContext);

      const clause: GeneratedClause = {
        type: clauseType,
        title: this.extractClauseTitle(aiResponse, clauseType),
        content: this.extractClauseContent(aiResponse),
        alternatives: this.extractClauseAlternatives(aiResponse),
        explanation: this.extractClauseExplanation(aiResponse),
        legalBasis: await this.findClauseLegalBasis(clauseType, context),
        riskLevel: this.assessClauseRisk(clauseType, context),
        customization: this.generateClauseCustomization(clauseType, context),
        precedents: await this.findClausePrecedents(clauseType),
        warnings: this.generateClauseWarnings(clauseType, context),
        confidence: 0.85
      };

      logger.info('Legal clause generated successfully', { clauseType });

      return clause;

    } catch (error) {
      logger.error('Clause generation error:', error);
      throw new Error('Failed to generate legal clause');
    }
  }

  /**
   * Review contract comprehensively
   */
  async reviewContract(contract: string, reviewType: ReviewType): Promise<ContractReview> {
    try {
      logger.info('Reviewing contract', { reviewType, contractLength: contract.length });

      // This is a placeholder implementation
      // In production, this would involve sophisticated contract analysis
      
      const review: ContractReview = {
        summary: {
          contractType: 'General Contract',
          parties: ['Party A', 'Party B'],
          keyTerms: [],
          mainObligations: [],
          criticalIssues: [],
          overallAssessment: 'Contract requires review'
        },
        sections: [],
        riskAnalysis: {
          overallRisk: 'medium',
          riskCategories: [],
          mitigationStrategies: [],
          dealBreakers: [],
          negotiationPoints: []
        },
        recommendations: [],
        missingClauses: [],
        redFlags: [],
        score: 75,
        confidence: 0.8,
        reviewTime: 15
      };

      logger.info('Contract review completed', { score: review.score });

      return review;

    } catch (error) {
      logger.error('Contract review error:', error);
      throw new Error('Failed to review contract');
    }
  }

  /**
   * Extract legal entities from document
   */
  async extractLegalEntities(document: string): Promise<LegalEntity[]> {
    try {
      logger.info('Extracting legal entities', { documentLength: document.length });

      // Placeholder implementation
      const entities: LegalEntity[] = [];

      logger.info('Legal entities extracted', { entitiesCount: entities.length });

      return entities;

    } catch (error) {
      logger.error('Legal entity extraction error:', error);
      throw new Error('Failed to extract legal entities');
    }
  }

  /**
   * Summarize legal document
   */
  async summarizeDocument(document: string, summaryType: SummaryType): Promise<DocumentSummary> {
    try {
      logger.info('Summarizing document', { summaryType, documentLength: document.length });

      // Placeholder implementation
      const summary: DocumentSummary = {
        type: summaryType,
        summary: 'Document summary placeholder',
        keyPoints: [],
        mainParties: [],
        importantDates: [],
        financialTerms: [],
        legalImplications: [],
        actionItems: [],
        confidence: 0.8,
        originalLength: document.length,
        summaryLength: 200,
        compressionRatio: 0.1
      };

      logger.info('Document summarized successfully', { 
        compressionRatio: summary.compressionRatio 
      });

      return summary;

    } catch (error) {
      logger.error('Document summarization error:', error);
      throw new Error('Failed to summarize document');
    }
  }

  /**
   * Translate legal text between French and Arabic
   */
  async translateLegalText(
    text: string, 
    fromLang: 'fr' | 'ar', 
    toLang: 'fr' | 'ar'
  ): Promise<TranslationResult> {
    try {
      logger.info('Translating legal text', { fromLang, toLang, textLength: text.length });

      // Placeholder implementation
      const result: TranslationResult = {
        originalText: text,
        translatedText: `[Translated from ${fromLang} to ${toLang}] ${text}`,
        fromLanguage: fromLang,
        toLanguage: toLang,
        confidence: 0.85,
        alternatives: [],
        terminology: [],
        warnings: [],
        preservedElements: [],
        qualityScore: 85
      };

      logger.info('Legal text translated successfully', { 
        qualityScore: result.qualityScore 
      });

      return result;

    } catch (error) {
      logger.error('Legal text translation error:', error);
      throw new Error('Failed to translate legal text');
    }
  }

  // Private helper methods

  private buildDocumentPrompt(type: DocumentType, context: LegalContext): string {
    const roleInstructions = this.getRoleSpecificInstructions(context.userRole);
    const domainContext = this.getDomainContext(context.legalDomain);
    
    return `
      Generate a ${type} document for a ${context.userRole} in ${context.jurisdiction}.
      Legal domain: ${context.legalDomain}
      Language: ${context.language}
      
      ${roleInstructions}
      ${domainContext}
      
      Client information: ${JSON.stringify(context.clientInfo)}
      Case information: ${JSON.stringify(context.caseInfo)}
      
      Requirements:
      - Follow Algerian legal standards
      - Use appropriate legal terminology
      - Include necessary legal references
      - Structure according to professional standards
      - Consider urgency level: ${context.urgency}
      - Complexity level: ${context.complexity}
      
      ${context.customInstructions || ''}
    `;
  }

  private getRoleSpecificInstructions(role: Profession): string {
    const instructions = {
      [Profession.AVOCAT]: 'Focus on advocacy, client representation, and procedural requirements.',
      [Profession.NOTAIRE]: 'Ensure authenticity, legal formalities, and proper witnessing procedures.',
      [Profession.HUISSIER]: 'Include proper service procedures, legal notifications, and enforcement actions.',
      [Profession.MAGISTRAT]: 'Focus on judicial reasoning, legal precedents, and decision-making framework.',
      [Profession.JURISTE_ENTREPRISE]: 'Consider business context, commercial implications, and corporate compliance.',
      [Profession.ETUDIANT]: 'Provide educational context and simplified explanations.',
      [Profession.ADMIN]: 'Focus on administrative and regulatory compliance.'
    };

    return instructions[role] || '';
  }

  private getDomainContext(domain: LegalDomain): string {
    const contexts = {
      [LegalDomain.CIVIL]: 'Apply civil law principles, personal rights, and obligations.',
      [LegalDomain.COMMERCIAL]: 'Consider commercial law, business transactions, and trade regulations.',
      [LegalDomain.CRIMINAL]: 'Follow criminal procedure, evidence rules, and penal code provisions.',
      [LegalDomain.ADMINISTRATIVE]: 'Apply administrative law, public service regulations, and governmental procedures.',
      [LegalDomain.FAMILY]: 'Consider family law, personal status, and domestic relations.',
      [LegalDomain.LABOR]: 'Apply employment law, worker rights, and labor regulations.',
      [LegalDomain.TAX]: 'Consider tax law, fiscal obligations, and revenue regulations.',
      [LegalDomain.CONSTITUTIONAL]: 'Apply constitutional principles and fundamental rights.',
      [LegalDomain.INTERNATIONAL]: 'Consider international law, treaties, and cross-border regulations.'
    };

    return contexts[domain] || '';
  }

  private async callAIService(prompt: string, context: LegalContext): Promise<string> {
    // Placeholder for actual AI service integration
    // In production, this would call OpenAI, Claude, or other AI services
    
    logger.info('Calling AI service', { promptLength: prompt.length });
    
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return `AI generated response for: ${prompt.substring(0, 100)}...`;
  }

  private parseDocumentDraft(aiResponse: string, type: DocumentType, context: LegalContext, usage: any): DocumentDraft {
    // Extract structured content from AI response
    const sections = this.extractDocumentSections(aiResponse);
    
    return {
      content: aiResponse,
      title: `${type} - ${new Date().toLocaleDateString('fr-FR')}`,
      type,
      category: this.getDocumentCategory(type),
      metadata: {
        generatedAt: new Date(),
        model: 'gemini-pro',
        version: this.modelConfig.version,
        parameters: {
          temperature: this.modelConfig.temperature,
          maxTokens: this.modelConfig.maxTokens
        },
        tokens: usage,
        processingTime: usage.processingTime || 1000
      },
      suggestions: [],
      confidence: this.calculateDraftConfidence(aiResponse, context),
      estimatedCompletionTime: this.estimateCompletionTime(type, context),
      requiredVariables: this.extractRequiredVariables(aiResponse),
      optionalVariables: this.extractOptionalVariables(aiResponse),
      legalReferences: [],
      warnings: this.generateDraftWarnings(aiResponse, context)
    };
  }

  private buildCompliancePrompt(document: string, domain: LegalDomain, rules: ComplianceRule[]): string {
    return `
ANALYSE DE CONFORMITÉ JURIDIQUE

Document à analyser:
${document}

Domaine juridique: ${domain}
Droit applicable: Droit algérien

Règles de conformité à vérifier:
${rules.map(rule => `- ${rule.name}: ${rule.description}`).join('\n')}

INSTRUCTIONS:
1. Analysez le document par rapport à chaque règle de conformité
2. Identifiez les problèmes de conformité avec leur gravité (critique, élevée, moyenne, faible)
3. Proposez des améliorations spécifiques
4. Citez les références légales pertinentes
5. Évaluez les risques juridiques

FORMAT DE RÉPONSE:
PROBLÈMES IDENTIFIÉS:
[Liste des problèmes avec gravité et localisation]

SUGGESTIONS D'AMÉLIORATION:
[Améliorations recommandées]

RÉFÉRENCES LÉGALES:
[Citations des textes applicables]

ÉVALUATION DES RISQUES:
[Analyse des risques juridiques]
    `;
  }

  private buildImprovementPrompt(document: string, userRole: Profession): string {
    const roleContext = this.getRoleSpecificInstructions(userRole);
    
    return `
ANALYSE D'AMÉLIORATION DE DOCUMENT JURIDIQUE

Document à analyser:
${document}

Rôle de l'utilisateur: ${userRole}
Contexte professionnel: ${roleContext}

INSTRUCTIONS:
Analysez le document et proposez des améliorations dans les domaines suivants:

1. STRUCTURE ET ORGANISATION
   - Logique de présentation
   - Hiérarchisation des arguments
   - Clarté de l'exposition

2. CONTENU JURIDIQUE
   - Précision des références légales
   - Solidité des arguments juridiques
   - Complétude de l'analyse

3. STYLE ET RÉDACTION
   - Clarté de l'expression
   - Terminologie juridique appropriée
   - Concision et efficacité

4. CONFORMITÉ PROCÉDURALE
   - Respect des formes légales
   - Mentions obligatoires
   - Délais et procédures

FORMAT DE RÉPONSE:
Pour chaque amélioration suggérée, indiquez:
- Type: [structure/contenu/style/conformité]
- Priorité: [haute/moyenne/faible]
- Description: [explication détaillée]
- Texte original: [si applicable]
- Texte suggéré: [proposition d'amélioration]
- Justification: [raison de l'amélioration]
    `;
  }

  private async parseComplianceIssues(aiResponse: string, rules: ComplianceRule[]): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];
    
    // Parse AI response to extract compliance issues
    const problemsSection = this.extractSection(aiResponse, 'PROBLÈMES IDENTIFIÉS');
    if (problemsSection) {
      const problemLines = problemsSection.split('\n').filter(line => line.trim().startsWith('-'));
      
      for (let i = 0; i < problemLines.length; i++) {
        const line = problemLines[i];
        const issue = this.parseComplianceIssueLine(line, rules, i);
        if (issue) {
          issues.push(issue);
        }
      }
    }

    return issues;
  }

  private parseComplianceIssueLine(line: string, rules: ComplianceRule[], index: number): ComplianceIssue | null {
    // Extract issue information from line
    const severityMatch = line.match(/\[(critique|élevée|moyenne|faible)\]/i);
    const severity = severityMatch ? this.mapSeverity(severityMatch[1]) : 'medium';
    
    const description = line.replace(/^-\s*/, '').replace(/\[.*?\]/g, '').trim();
    
    if (!description) return null;

    return {
      id: `issue_${index}`,
      type: 'error',
      severity,
      title: description.substring(0, 100),
      description,
      location: { start: 0, end: 0 },
      rule: rules[0] || this.getDefaultRule(),
      legalBasis: [],
      impact: this.getImpactForSeverity(severity)
    };
  }

  private async parseImprovementSuggestions(aiResponse: string): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    
    const suggestionsSection = this.extractSection(aiResponse, 'SUGGESTIONS D\'AMÉLIORATION');
    if (suggestionsSection) {
      const suggestionBlocks = suggestionsSection.split('\n\n').filter(block => block.trim());
      
      for (let i = 0; i < suggestionBlocks.length; i++) {
        const suggestion = this.parseImprovementSuggestionBlock(suggestionBlocks[i], i);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions;
  }

  private parseImprovementSuggestionBlock(block: string, index: number): ImprovementSuggestion | null {
    const lines = block.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length === 0) return null;

    return {
      id: `suggestion_${index}`,
      type: 'content',
      title: lines[0].substring(0, 100),
      description: lines.join(' '),
      after: '', // Would be extracted from AI response
      impact: 'medium',
      effort: 'medium',
      confidence: 0.8
    };
  }

  private async parseImprovementResponse(aiResponse: string, document: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    
    // Parse different types of suggestions from AI response
    const sections = ['STRUCTURE', 'CONTENU', 'STYLE', 'CONFORMITÉ'];
    
    for (const section of sections) {
      const sectionContent = this.extractSection(aiResponse, section);
      if (sectionContent) {
        const sectionSuggestions = this.parseSectionSuggestions(sectionContent, section.toLowerCase(), document);
        suggestions.push(...sectionSuggestions);
      }
    }

    return suggestions;
  }

  private parseSectionSuggestions(content: string, type: string, document: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const lines = content.split('\n').filter(line => line.trim().startsWith('-'));
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/^-\s*/, '').trim();
      if (line) {
        suggestions.push({
          id: `${type}_${i}`,
          type: type as any,
          title: line.substring(0, 50),
          description: line,
          location: { start: 0, end: 0 },
          original: '',
          suggested: '',
          reason: `Amélioration suggérée pour ${type}`,
          confidence: 0.8,
          priority: 'medium',
          category: type
        });
      }
    }

    return suggestions;
  }

  private async generateRoleSpecificSuggestions(document: string, userRole: Profession): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    
    // Add role-specific validation rules
    switch (userRole) {
      case Profession.AVOCAT:
        suggestions.push(...await this.generateAvocatSuggestions(document));
        break;
      case Profession.NOTAIRE:
        suggestions.push(...await this.generateNotaireSuggestions(document));
        break;
      case Profession.HUISSIER:
        suggestions.push(...await this.generateHuissierSuggestions(document));
        break;
      case Profession.MAGISTRAT:
        suggestions.push(...await this.generateMagistratSuggestions(document));
        break;
    }

    return suggestions;
  }

  private parseExplanationResponse(aiResponse: string): {
    definition: string;
    context: string;
    relatedConcepts: string[];
    practicalApplications: string[];
    commonMisunderstandings: string[];
    sources: string[];
  } {
    return {
      definition: this.extractSection(aiResponse, 'DÉFINITION') || aiResponse.substring(0, 300),
      context: this.extractSection(aiResponse, 'CONTEXTE') || '',
      relatedConcepts: this.extractListSection(aiResponse, 'CONCEPTS LIÉS'),
      practicalApplications: this.extractListSection(aiResponse, 'APPLICATIONS PRATIQUES'),
      commonMisunderstandings: this.extractListSection(aiResponse, 'ERREURS COURANTES'),
      sources: this.extractListSection(aiResponse, 'SOURCES')
    };
  }

  private inferDomainFromConcept(concept: string): LegalDomain {
    const conceptLower = concept.toLowerCase();
    
    if (conceptLower.includes('contrat') || conceptLower.includes('commercial')) {
      return LegalDomain.COMMERCIAL;
    } else if (conceptLower.includes('pénal') || conceptLower.includes('crime')) {
      return LegalDomain.CRIMINAL;
    } else if (conceptLower.includes('famille') || conceptLower.includes('mariage')) {
      return LegalDomain.FAMILY;
    } else if (conceptLower.includes('travail') || conceptLower.includes('emploi')) {
      return LegalDomain.LABOR;
    } else if (conceptLower.includes('administratif') || conceptLower.includes('public')) {
      return LegalDomain.ADMINISTRATIVE;
    }
    
    return LegalDomain.CIVIL; // Default
  }

  private async storeExplanation(explanation: Explanation): Promise<void> {
    try {
      await db.query(
        `INSERT INTO legal_explanations (concept, definition, context, level, language, content, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (concept, level, language) DO UPDATE SET
         definition = EXCLUDED.definition,
         context = EXCLUDED.context,
         content = EXCLUDED.content,
         updated_at = CURRENT_TIMESTAMP`,
        [
          explanation.concept,
          explanation.definition,
          explanation.context,
          explanation.level,
          explanation.language,
          JSON.stringify(explanation),
          new Date()
        ]
      );
    } catch (error) {
      logger.error('Failed to store explanation:', error);
      // Non-critical error, continue without storing
    }
  }

  private getDocumentCategory(type: DocumentType): DocumentCategory {
    const categoryMap = {
      [DocumentType.REQUETE]: DocumentCategory.PROCEDURE,
      [DocumentType.CONCLUSION]: DocumentCategory.PROCEDURE,
      [DocumentType.MEMOIRE]: DocumentCategory.PROCEDURE,
      [DocumentType.CONTRAT]: DocumentCategory.CONTRAT,
      [DocumentType.ACTE_AUTHENTIQUE]: DocumentCategory.ACTE_NOTARIE,
      [DocumentType.EXPLOIT]: DocumentCategory.SIGNIFICATION,
      [DocumentType.JUGEMENT]: DocumentCategory.DECISION_JUSTICE,
      [DocumentType.CONSULTATION]: DocumentCategory.CONSULTATION
    };

    return categoryMap[type] || DocumentCategory.AUTRE;
  }

  private async findRelevantLegalReferences(content: string, context: LegalContext): Promise<LegalReference[]> {
    // Placeholder implementation
    return [];
  }

  private async generateDraftSuggestions(content: string, context: LegalContext): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  private async getComplianceRules(domain: LegalDomain): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  private async analyzeAgainstRule(document: string, rule: any): Promise<{ issues: ComplianceIssue[]; suggestions: ImprovementSuggestion[] }> {
    // Placeholder implementation
    return { issues: [], suggestions: [] };
  }

  private calculateComplianceScore(issues: ComplianceIssue[], documentLength: number): number {
    // Simple scoring algorithm
    let score = 100;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    return Math.max(0, score);
  }

  private assessComplianceRisks(issues: ComplianceIssue[], domain: LegalDomain): RiskAssessment {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;

    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (criticalIssues > 0) {
      overallRisk = 'critical';
    } else if (highIssues > 2) {
      overallRisk = 'high';
    } else if (highIssues > 0 || issues.length > 5) {
      overallRisk = 'medium';
    }

    return {
      overallRisk,
      riskFactors: [],
      mitigationStrategies: [],
      recommendedActions: [],
      timeline: 'Immediate action required for critical issues'
    };
  }

  private extractLegalReferences(issues: ComplianceIssue[]): LegalReference[] {
    const references: LegalReference[] = [];
    
    for (const issue of issues) {
      references.push(...issue.legalBasis);
    }

    // Remove duplicates
    return references.filter((ref, index, self) => 
      index === self.findIndex(r => r.reference === ref.reference)
    );
  }

  private generateComplianceSummary(issues: ComplianceIssue[], score: number): string {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;

    if (criticalCount > 0) {
      return `Document has ${criticalCount} critical compliance issues that must be addressed immediately.`;
    } else if (highCount > 0) {
      return `Document has ${highCount} high-priority compliance issues requiring attention.`;
    } else if (score >= 90) {
      return 'Document shows excellent compliance with legal requirements.';
    } else if (score >= 70) {
      return 'Document shows good compliance with minor issues to address.';
    } else {
      return 'Document requires significant improvements to meet compliance standards.';
    }
  }

  // Additional placeholder methods for completeness
  private async analyzeDocumentStructure(document: string, userRole: Profession): Promise<Suggestion[]> {
    return [];
  }

  private async analyzeLegalContent(document: string, userRole: Profession): Promise<Suggestion[]> {
    return [];
  }

  private async analyzeStyleAndClarity(document: string): Promise<Suggestion[]> {
    return [];
  }

  private buildExplanationPrompt(concept: string, level: ExplanationLevel): string {
    return `Explain the legal concept "${concept}" at ${level} level in French for Algerian law context.`;
  }

  private extractDefinition(response: string): string {
    return response.substring(0, 200) + '...';
  }

  private extractContext(response: string): string {
    return 'Legal context explanation...';
  }

  private async generateConceptExamples(concept: string, level: ExplanationLevel): Promise<any[]> {
    return [];
  }

  private extractRelatedConcepts(response: string): string[] {
    return [];
  }

  private async findConceptReferences(concept: string): Promise<LegalReference[]> {
    return [];
  }

  private extractPracticalApplications(response: string): string[] {
    return [];
  }

  private extractMisunderstandings(response: string): string[] {
    return [];
  }

  private extractSources(response: string): string[] {
    return [];
  }

  private async findLogicalGaps(argument: string): Promise<any[]> {
    return [];
  }

  private async findSupportingEvidence(argument: string): Promise<any[]> {
    return [];
  }

  private async generateCounterArguments(argument: string): Promise<any[]> {
    return [];
  }

  private calculateReasoningScore(logicalGaps: any[], supportingEvidence: any[], counterArguments: any[]): number {
    return 75; // Placeholder score
  }

  private identifyReasoningStrengths(argument: string, evidence: any[]): string[] {
    return [];
  }

  private identifyReasoningWeaknesses(gaps: any[]): string[] {
    return [];
  }

  private generateReasoningRecommendations(gaps: any[], evidence: any[]): string[] {
    return [];
  }

  private generateReasoningExplanation(score: number, gaps: any[], evidence: any[]): string {
    return `Reasoning analysis completed with score ${score}`;
  }

  private buildClausePrompt(clauseType: ClauseType, context: ClauseContext): string {
    return `Generate a ${clauseType} clause for ${context.contractType} in ${context.language}`;
  }

  private extractClauseTitle(response: string, type: ClauseType): string {
    return `${type} Clause`;
  }

  private extractClauseContent(response: string): string {
    return response;
  }

  private extractClauseAlternatives(response: string): string[] {
    return [];
  }

  private extractClauseExplanation(response: string): string {
    return 'Clause explanation...';
  }

  private async findClauseLegalBasis(type: ClauseType, context: ClauseContext): Promise<LegalReference[]> {
    return [];
  }

  private assessClauseRisk(type: ClauseType, context: ClauseContext): 'low' | 'medium' | 'high' {
    return 'medium';
  }

  private generateClauseCustomization(type: ClauseType, context: ClauseContext): any[] {
    return [];
  }

  private async findClausePrecedents(type: ClauseType): Promise<string[]> {
    return [];
  }

  private generateClauseWarnings(type: ClauseType, context: ClauseContext): string[] {
    return [];
  }
}

export const aiLegalService = new AILegalService();

  // Additional helper methods for enhanced AI functionality

  private extractDocumentSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const sectionRegex = /^([A-Z][A-Z\s]+):?\s*$/gm;
    
    let match;
    let lastIndex = 0;
    let lastSection = '';

    while ((match = sectionRegex.exec(content)) !== null) {
      if (lastSection) {
        sections[lastSection] = content.substring(lastIndex, match.index).trim();
      }
      lastSection = match[1].trim();
      lastIndex = match.index + match[0].length;
    }

    if (lastSection) {
      sections[lastSection] = content.substring(lastIndex).trim();
    }

    return sections;
  }

  private calculateDraftConfidence(content: string, context: LegalContext): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence based on content quality indicators
    if (content.includes('Article') || content.includes('Loi')) {
      confidence += 0.1; // Has legal references
    }
    
    if (content.length > 500) {
      confidence += 0.05; // Substantial content
    }

    if (context.precedents && context.precedents.length > 0) {
      confidence += 0.1; // Has precedent context
    }

    // Adjust based on complexity
    if (context.complexity === 'complex') {
      confidence -= 0.1;
    } else if (context.complexity === 'simple') {
      confidence += 0.05;
    }

    return Math.min(0.95, confidence);
  }

  private estimateCompletionTime(type: DocumentType, context: LegalContext): number {
    const baseTime = {
      [DocumentType.REQUETE]: 45,
      [DocumentType.CONCLUSION]: 60,
      [DocumentType.MEMOIRE]: 90,
      [DocumentType.CONTRAT]: 75,
      [DocumentType.ACTE_AUTHENTIQUE]: 120,
      [DocumentType.EXPLOIT]: 30,
      [DocumentType.JUGEMENT]: 180
    };

    let time = baseTime[type] || 60;

    // Adjust based on complexity
    if (context.complexity === 'complex') {
      time *= 1.5;
    } else if (context.complexity === 'simple') {
      time *= 0.7;
    }

    // Adjust based on urgency
    if (context.urgency === 'high') {
      time *= 0.8; // Less time for review
    }

    return Math.round(time);
  }

  private extractRequiredVariables(content: string): string[] {
    const variables: string[] = [];
    const variableRegex = /\{\{(\w+)\}\}/g;
    
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  private extractOptionalVariables(content: string): string[] {
    const variables: string[] = [];
    const optionalRegex = /\{\{#if\s+(\w+)\}\}/g;
    
    let match;
    while ((match = optionalRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  private generateDraftWarnings(content: string, context: LegalContext): string[] {
    const warnings: string[] = [];

    // Check for potential issues
    if (content.length < 200) {
      warnings.push('Le document généré est très court, vérifiez qu\'il contient tous les éléments nécessaires');
    }

    if (!content.includes('Article') && !content.includes('Loi')) {
      warnings.push('Aucune référence légale détectée, ajoutez les références appropriées');
    }

    if (context.urgency === 'high') {
      warnings.push('Document généré en urgence, révision approfondie recommandée');
    }

    if (context.complexity === 'complex') {
      warnings.push('Affaire complexe, validation par un expert recommandée');
    }

    return warnings;
  }

  private extractSection(content: string, sectionName: string): string | null {
    const regex = new RegExp(`${sectionName}:?\\s*\\n([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s]+:|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractListSection(content: string, sectionName: string): string[] {
    const section = this.extractSection(content, sectionName);
    if (!section) return [];

    return section
      .split('\n')
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  private mapSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    const mapping: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
      'critique': 'critical',
      'élevée': 'high',
      'moyenne': 'medium',
      'faible': 'low'
    };
    return mapping[severity.toLowerCase()] || 'medium';
  }

  private getDefaultRule(): ComplianceRule {
    return {
      id: 'default',
      name: 'Règle générale',
      description: 'Conformité générale au droit algérien',
      category: 'general',
      jurisdiction: 'Algeria',
      legalBasis: [],
      severity: 'medium',
      isActive: true,
      lastUpdated: new Date()
    };
  }

  private getImpactForSeverity(severity: 'critical' | 'high' | 'medium' | 'low'): string {
    const impacts = {
      critical: 'Risque juridique majeur, action immédiate requise',
      high: 'Risque juridique important, correction recommandée',
      medium: 'Risque juridique modéré, amélioration suggérée',
      low: 'Risque juridique faible, optimisation possible'
    };
    return impacts[severity];
  }

  private async generateAvocatSuggestions(document: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Check for procedural requirements
    if (!document.includes('PAR CES MOTIFS')) {
      suggestions.push({
        id: 'avocat_motifs',
        type: 'structure',
        title: 'Formule de conclusion manquante',
        description: 'Ajoutez la formule "PAR CES MOTIFS" avant les demandes',
        location: { start: 0, end: 0 },
        original: '',
        suggested: 'PAR CES MOTIFS\n\nIl vous plaît...',
        reason: 'Formule procédurale obligatoire pour les conclusions d\'avocat',
        confidence: 0.9,
        priority: 'high',
        category: 'procedure'
      });
    }

    // Check for legal references
    if (!document.includes('Article') && !document.includes('Loi')) {
      suggestions.push({
        id: 'avocat_references',
        type: 'legal',
        title: 'Références légales manquantes',
        description: 'Ajoutez des références aux textes légaux applicables',
        location: { start: 0, end: 0 },
        original: '',
        suggested: '',
        reason: 'Les références légales renforcent l\'argumentation juridique',
        confidence: 0.8,
        priority: 'medium',
        category: 'legal'
      });
    }

    return suggestions;
  }

  private async generateNotaireSuggestions(document: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Check for notarial formalities
    if (!document.includes('L\'an') || !document.includes('Par-devant')) {
      suggestions.push({
        id: 'notaire_formule',
        type: 'structure',
        title: 'Formule notariale manquante',
        description: 'Ajoutez la formule d\'ouverture notariale standard',
        location: { start: 0, end: 0 },
        original: '',
        suggested: 'L\'an deux mille... et le...\nPar-devant Maître..., Notaire...',
        reason: 'Formule obligatoire pour les actes authentiques',
        confidence: 0.95,
        priority: 'high',
        category: 'formality'
      });
    }

    return suggestions;
  }

  private async generateHuissierSuggestions(document: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Check for signification formalities
    if (!document.includes('J\'ai') || !document.includes('Huissier de Justice')) {
      suggestions.push({
        id: 'huissier_qualite',
        type: 'structure',
        title: 'Qualité d\'huissier manquante',
        description: 'Précisez votre qualité d\'huissier de justice',
        location: { start: 0, end: 0 },
        original: '',
        suggested: 'J\'ai, [Nom], Huissier de Justice près le [Tribunal]...',
        reason: 'Mention obligatoire de la qualité pour les exploits',
        confidence: 0.9,
        priority: 'high',
        category: 'formality'
      });
    }

    return suggestions;
  }

  private async generateMagistratSuggestions(document: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Check for judgment structure
    if (!document.includes('Au nom du peuple algérien')) {
      suggestions.push({
        id: 'magistrat_formule',
        type: 'structure',
        title: 'Formule républicaine manquante',
        description: 'Ajoutez la formule "Au nom du peuple algérien"',
        location: { start: 0, end: 0 },
        original: '',
        suggested: 'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE\nAu nom du peuple algérien',
        reason: 'Formule constitutionnelle obligatoire pour les décisions de justice',
        confidence: 0.95,
        priority: 'high',
        category: 'constitutional'
      });
    }

    return suggestions;
  }

  private async getComplianceRules(domain: LegalDomain): Promise<ComplianceRule[]> {
    try {
      const result = await db.query(
        'SELECT * FROM compliance_rules WHERE domain = $1 AND is_active = true ORDER BY severity DESC',
        [domain]
      );

      if (result && (result as any).rows.length > 0) {
        return (result as any).rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          category: row.category,
          jurisdiction: row.jurisdiction,
          legalBasis: JSON.parse(row.legal_basis || '[]'),
          severity: row.severity,
          isActive: row.is_active,
          lastUpdated: new Date(row.last_updated)
        }));
      }
    } catch (error) {
      logger.error('Failed to get compliance rules from database:', error);
    }

    // Return default rules if database query fails
    return this.getDefaultComplianceRules(domain);
  }

  private getDefaultComplianceRules(domain: LegalDomain): ComplianceRule[] {
    const commonRules: ComplianceRule[] = [
      {
        id: 'general_form',
        name: 'Forme générale',
        description: 'Le document doit respecter les formes légales requises',
        category: 'form',
        jurisdiction: 'Algeria',
        legalBasis: [
          {
            type: 'law',
            reference: 'Code de procédure civile et administrative',
            title: 'Dispositions générales sur les actes'
          }
        ],
        severity: 'high',
        isActive: true,
        lastUpdated: new Date()
      },
      {
        id: 'legal_references',
        name: 'Références légales',
        description: 'Le document doit contenir les références légales appropriées',
        category: 'content',
        jurisdiction: 'Algeria',
        legalBasis: [],
        severity: 'medium',
        isActive: true,
        lastUpdated: new Date()
      }
    ];

    // Add domain-specific rules
    switch (domain) {
      case LegalDomain.CIVIL:
        commonRules.push({
          id: 'civil_procedure',
          name: 'Procédure civile',
          description: 'Respect des règles de procédure civile algérienne',
          category: 'procedure',
          jurisdiction: 'Algeria',
          legalBasis: [
            {
              type: 'law',
              reference: 'Code de procédure civile et administrative',
              title: 'Procédure civile'
            }
          ],
          severity: 'high',
          isActive: true,
          lastUpdated: new Date()
        });
        break;

      case LegalDomain.COMMERCIAL:
        commonRules.push({
          id: 'commercial_law',
          name: 'Droit commercial',
          description: 'Conformité au code de commerce algérien',
          category: 'commercial',
          jurisdiction: 'Algeria',
          legalBasis: [
            {
              type: 'law',
              reference: 'Code de commerce',
              title: 'Dispositions commerciales'
            }
          ],
          severity: 'high',
          isActive: true,
          lastUpdated: new Date()
        });
        break;

      case LegalDomain.LABOR:
        commonRules.push({
          id: 'labor_law',
          name: 'Droit du travail',
          description: 'Conformité à la législation du travail algérienne',
          category: 'labor',
          jurisdiction: 'Algeria',
          legalBasis: [
            {
              type: 'law',
              reference: 'Loi 90-11',
              title: 'Relations de travail'
            }
          ],
          severity: 'high',
          isActive: true,
          lastUpdated: new Date()
        });
        break;
    }

    return commonRules;
  }

  private async findRelevantLegalReferences(content: string, context: LegalContext): Promise<LegalReference[]> {
    const references: LegalReference[] = [];

    try {
      // Search for legal references in database based on content keywords
      const keywords = this.extractKeywords(content);
      const keywordQuery = keywords.join(' | ');

      const result = await db.query(
        `SELECT DISTINCT lr.* FROM legal_references lr
         WHERE to_tsvector('french', lr.title || ' ' || lr.reference) @@ plainto_tsquery('french', $1)
         AND lr.domain = $2
         ORDER BY ts_rank(to_tsvector('french', lr.title || ' ' || lr.reference), plainto_tsquery('french', $1)) DESC
         LIMIT 10`,
        [keywordQuery, context.legalDomain]
      );

      if (result && (result as any).rows.length > 0) {
        references.push(...(result as any).rows.map((row: any) => ({
          type: row.type,
          reference: row.reference,
          title: row.title,
          article: row.article,
          url: row.url
        })));
      }
    } catch (error) {
      logger.error('Failed to find legal references:', error);
    }

    // Add default references if none found
    if (references.length === 0) {
      references.push(...this.getDefaultLegalReferences(context.legalDomain));
    }

    return references;
  }

  private getDefaultLegalReferences(domain: LegalDomain): LegalReference[] {
    const references: Record<LegalDomain, LegalReference[]> = {
      [LegalDomain.CIVIL]: [
        {
          type: 'law',
          reference: 'Code civil algérien',
          title: 'Dispositions générales du droit civil'
        },
        {
          type: 'law',
          reference: 'Code de procédure civile et administrative',
          title: 'Procédure civile'
        }
      ],
      [LegalDomain.COMMERCIAL]: [
        {
          type: 'law',
          reference: 'Code de commerce',
          title: 'Droit commercial algérien'
        }
      ],
      [LegalDomain.CRIMINAL]: [
        {
          type: 'law',
          reference: 'Code pénal',
          title: 'Droit pénal algérien'
        },
        {
          type: 'law',
          reference: 'Code de procédure pénale',
          title: 'Procédure pénale'
        }
      ],
      [LegalDomain.LABOR]: [
        {
          type: 'law',
          reference: 'Loi 90-11',
          title: 'Relations de travail'
        }
      ],
      [LegalDomain.ADMINISTRATIVE]: [
        {
          type: 'law',
          reference: 'Code de procédure civile et administrative',
          title: 'Procédure administrative'
        }
      ],
      [LegalDomain.FAMILY]: [
        {
          type: 'law',
          reference: 'Code de la famille',
          title: 'Droit de la famille algérien'
        }
      ],
      [LegalDomain.TAX]: [
        {
          type: 'law',
          reference: 'Code des impôts directs',
          title: 'Fiscalité algérienne'
        }
      ],
      [LegalDomain.CONSTITUTIONAL]: [
        {
          type: 'law',
          reference: 'Constitution algérienne',
          title: 'Loi fondamentale'
        }
      ],
      [LegalDomain.INTERNATIONAL]: [
        {
          type: 'law',
          reference: 'Conventions internationales',
          title: 'Droit international applicable'
        }
      ]
    };

    return references[domain] || references[LegalDomain.CIVIL];
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction for legal content
    const legalTerms = [
      'contrat', 'obligation', 'responsabilité', 'dommage', 'préjudice',
      'nullité', 'résolution', 'résiliation', 'force majeure', 'faute',
      'prescription', 'délai', 'procédure', 'jugement', 'arrêt',
      'cassation', 'appel', 'première instance', 'compétence', 'juridiction',
      'signification', 'exploit', 'commandement', 'saisie', 'exécution',
      'acte authentique', 'notaire', 'testament', 'succession', 'donation',
      'travail', 'emploi', 'salaire', 'licenciement', 'grève',
      'société', 'commerce', 'fonds de commerce', 'bail commercial'
    ];

    const words = content.toLowerCase().split(/\W+/);
    return legalTerms.filter(term => words.includes(term));
  }

  private async generateDraftSuggestions(content: string, context: LegalContext): Promise<DraftSuggestion[]> {
    const suggestions: DraftSuggestion[] = [];

    // Analyze content structure
    if (!content.includes('\n\n')) {
      suggestions.push({
        type: 'improvement',
        section: 'structure',
        suggested: 'Ajoutez des paragraphes pour améliorer la lisibilité',
        reason: 'La structure en paragraphes facilite la lecture',
        confidence: 0.8,
        priority: 'medium'
      });
    }

    // Check for legal formalities based on role
    if (context.userRole === Profession.AVOCAT && !content.includes('Sous toutes réserves')) {
      suggestions.push({
        type: 'addition',
        section: 'conclusion',
        suggested: 'Ajoutez "Sous toutes réserves" à la fin du document',
        reason: 'Formule de précaution standard pour les avocats',
        confidence: 0.9,
        priority: 'high'
      });
    }

    return suggestions;
  }

  // Remove the old callAIService method and replace references
  private async callAIService(prompt: string, context: LegalContext): Promise<string> {
    const aiRequest: AIRequest = {
      prompt,
      context,
      maxTokens: 2000,
      temperature: 0.3
    };

    const response = await aiClient.generate(aiRequest);
    return response.content;
  }
}