import { logger } from '@/utils/logger';
import { db } from '@/database/connection';
import { aiClient, AIRequest, AIResponse } from './aiClient';
import { ragService } from './ragService';
import {
  injectRagContext,
  extractCitedSources,
  buildRagFiltersFromContext
} from './ragPromptHelper';
import { safeJsonParse, buildJsonForcedPrompt, JsonParseError } from '@/utils/jsonForcer';
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
  DraftSuggestion
} from '@/types/ai';
import { DocumentType, DocumentCategory } from '@/types/document';
import { LegalDomain, LegalReference } from '@/types/search';
import { Profession } from '@/types/auth';

interface DraftJsonSchema {
  title: string;
  content: string;
  requiredVariables: string[];
  optionalVariables: string[];
  warnings: string[];
  keyLegalReferences: string[];
}

export class AILegalService implements IAILegalService {
  private readonly modelConfig: AIModelConfig = {
    model: 'gemini-3.5-flash',
    version: '1.0',
    temperature: 0.3,
    maxTokens: 4000,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    stopSequences: [],
    customPrompts: {},
    domainSpecificSettings: {} as AIModelConfig['domainSpecificSettings']
  };

  // ============================================================
  // Public API: Document generation (RAG + JSON-forced POC)
  // ============================================================

  async generateDocumentDraft(type: DocumentType, context: LegalContext): Promise<DocumentDraft> {
    logger.info('Generating document draft', {
      type,
      userRole: context.userRole,
      domain: context.legalDomain
    });

    // 1. Retrieval : on cherche des sources pertinentes au domaine + juridiction
    const ragFilters = buildRagFiltersFromContext(context);
    const userQuery = this.buildDocumentPrompt(type, context);
    const ragContext = await ragService.buildContextBlock(userQuery, ragFilters, {
      topK: 6,
      minScore: 0.55
    });

    // 2. Construction du prompt enrichi par le RAG
    const enrichedPrompt = injectRagContext(userQuery, ragContext);

    // 3. Prompt système force le JSON (POC priorité 1.2)
    const jsonSchemaDescription = `{
  "title": "string - titre court et professionnel du document",
  "content": "string - corps COMPLET du document juridique, en ${context.language === 'ar' ? 'arabe' : 'français'}, avec titres, articles numérotés, sauts de ligne \\n\\n entre paragraphes",
  "requiredVariables": ["liste des variables {{nom}} que l'utilisateur doit renseigner"],
  "optionalVariables": ["liste des variables optionnelles {{#if nom}}"],
  "warnings": ["avertissements à afficher à l'utilisateur (champs manquants, validations, etc.)"],
  "keyLegalReferences": ["références citées dans le document, ex: 'Article 124 du Code civil'"]
}`;

    const jsonForcedSystem = buildJsonForcedPrompt(jsonSchemaDescription);

    const aiRequest: AIRequest = {
      prompt: enrichedPrompt,
      context: { ...context, customInstructions: jsonForcedSystem },
      maxTokens: 3500,
      temperature: 0.3,
      model: this.modelConfig.model
    };

    const aiResponse = await aiClient.generate(aiRequest);

    // 4. Parse JSON forcé (POC)
    const parsed = this.parseJsonDraftSafe(aiResponse, type, context);

    // 5. Calcul de confiance basé sur la présence de sources
    const confidence = this.calculateDraftConfidence(
      parsed.content,
      context,
      ragContext?.results.length ?? 0
    );

    // 6. Recherche de références juridiques finales (BDD + défauts)
    const legalReferences = await this.findRelevantLegalReferences(parsed.content, context);

    // 7. Suggestions de draft
    const suggestions = await this.generateDraftSuggestions(parsed.content, context);

    // 8. Validation globale
    const isValid = aiClient.validateLegalResponse(aiResponse, context);
    if (!isValid) {
      parsed.warnings.push('Le contenu généré nécessite une révision manuelle');
    }

    const draft: DocumentDraft = {
      content: parsed.content,
      title: parsed.title || `${type} - ${new Date().toLocaleDateString('fr-FR')}`,
      type,
      category: this.getDocumentCategory(type),
      metadata: {
        generatedAt: new Date(),
        model: this.modelConfig.model,
        version: this.modelConfig.version,
        parameters: {
          temperature: this.modelConfig.temperature,
          maxTokens: this.modelConfig.maxTokens
        },
        tokens: {
          input: aiResponse.usage.promptTokens,
          output: aiResponse.usage.completionTokens,
          total: aiResponse.usage.totalTokens
        },
        processingTime: aiResponse.processingTime
      },
      suggestions,
      confidence,
      estimatedCompletionTime: this.estimateCompletionTime(type, context),
      requiredVariables: parsed.requiredVariables,
      optionalVariables: parsed.optionalVariables,
      legalReferences,
      warnings: parsed.warnings
    };

    logger.info('Document draft generated successfully', {
      type,
      wordCount: draft.content.split(/\s+/).length,
      suggestionsCount: draft.suggestions.length,
      confidence: draft.confidence,
      ragSourcesUsed: ragContext?.results.length ?? 0
    });

    return draft;
  }

  // ============================================================
  // Public API: Compliance analysis (RAG)
  // ============================================================

  async analyzeCompliance(document: string, domain: LegalDomain): Promise<ComplianceAnalysis> {
    logger.info('Analyzing document compliance', { domain, documentLength: document.length });

    const rules = await this.getComplianceRules(domain);

    // RAG : règles pertinentes + jurisprudence comparable
    const ragContext = await ragService.buildContextBlock(
      `${domain} ${document.substring(0, 1000)}`,
      { domain, sourceType: ['compliance_rule', 'jurisprudence_case'] },
      { topK: 5, minScore: 0.5 }
    );

    const ragContextText = ragContext
      ? `\nJURISPRUDENCE ET RÈGLES PERTINENTES:\n${ragContext.formatted}\n`
      : '';

    const prompt = this.buildCompliancePrompt(document, domain, rules) + ragContextText;

    const aiRequest: AIRequest = {
      prompt,
      context: {
        userRole: Profession.AVOCAT,
        legalDomain: domain,
        jurisdiction: 'Algeria',
        language: 'fr'
      } as LegalContext,
      maxTokens: 2500,
      temperature: 0.2
    };

    const aiResponse = await aiClient.generate(aiRequest);

    const issues = await this.parseComplianceIssues(aiResponse.content, rules);
    const improvementSuggestions = await this.parseImprovementSuggestions(aiResponse.content);
    const overallScore = this.calculateComplianceScore(issues, document.length);
    const riskAssessment = this.assessComplianceRisks(issues, domain);

    return {
      isCompliant: issues.filter((i) => i.severity === 'critical' || i.severity === 'high')
        .length === 0,
      overallScore,
      issues,
      suggestions: improvementSuggestions,
      confidence: Math.min(0.95, aiResponse.usage.totalTokens / 1000 * 0.1 + 0.7),
      legalReferences: this.extractLegalReferences(issues),
      checkedRules: rules,
      summary: this.generateComplianceSummary(issues, overallScore),
      riskAssessment
    };
  }

  // ============================================================
  // Public API: Improvement suggestions (RAG)
  // ============================================================

  async suggestImprovements(document: string, userRole: Profession): Promise<Suggestion[]> {
    logger.info('Generating improvement suggestions', { userRole, documentLength: document.length });

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

    const suggestions = await this.parseImprovementResponse(aiResponse.content, document);
    const roleSuggestions = await this.generateRoleSpecificSuggestions(document, userRole);
    suggestions.push(...roleSuggestions);

    suggestions.sort((a, b) => {
      const order: Record<string, number> = { high: 3, medium: 2, low: 1 };
      if (a.priority !== b.priority) return order[b.priority] - order[a.priority];
      return b.confidence - a.confidence;
    });

    return suggestions.slice(0, 20);
  }

  // ============================================================
  // Public API: Explain concept (RAG)
  // ============================================================

  async explainLegalConcept(concept: string, level: ExplanationLevel): Promise<Explanation> {
    logger.info('Explaining legal concept', { concept, level });

    const domain = this.inferDomainFromConcept(concept);

    // 1. Chercher dans la base vectorielle
    const ragContext = await ragService.buildContextBlock(
      concept,
      { domain, sourceType: ['legal_article', 'legal_reference', 'jurisprudence_case'] },
      { topK: 4, minScore: 0.5 }
    );

    const basePrompt = this.buildExplanationPrompt(concept, level);
    const prompt = injectRagContext(basePrompt, ragContext);

    const aiRequest: AIRequest = {
      prompt,
      context: {
        userRole: level === ExplanationLevel.BEGINNER ? Profession.ETUDIANT : Profession.AVOCAT,
        language: 'fr',
        jurisdiction: 'Algeria',
        legalDomain: domain
      } as LegalContext,
      maxTokens: level === ExplanationLevel.EXPERT ? 3000 : 2000,
      temperature: 0.3
    };

    const aiResponse = await aiClient.generate(aiRequest);
    const parsedContent = this.parseExplanationResponse(aiResponse.content);

    const legalBasis = await this.findConceptReferences(concept);
    const examples = await this.generateConceptExamples(concept, level);

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
      sources: [
        ...parsedContent.sources,
        ...(ragContext?.results.map((r) => r.referenceCode ?? r.title) ?? [])
      ].filter((s, i, arr) => arr.indexOf(s) === i)
    };

    await this.storeExplanation(explanation);
    return explanation;
  }

  // ============================================================
  // Public API: Validate legal reasoning (RAG)
  // ============================================================

  async validateLegalReasoning(argument: string): Promise<ValidationResult> {
    logger.info('Validating legal reasoning', { argumentLength: argument.length });

    // RAG : chercher des éléments de jurisprudence qui supportent ou contredisent
    const ragContext = await ragService.buildContextBlock(
      argument.substring(0, 500),
      { sourceType: ['jurisprudence_case', 'legal_article'] },
      { topK: 5, minScore: 0.45 }
    );

    const logicalGaps = await this.findLogicalGaps(argument);
    const supportingEvidence = await this.findSupportingEvidence(argument, ragContext);
    const counterArguments = await this.generateCounterArguments(argument);
    const score = this.calculateReasoningScore(
      logicalGaps,
      supportingEvidence,
      counterArguments
    );

    return {
      isValid: score >= 70,
      score,
      strengths: this.identifyReasoningStrengths(argument, supportingEvidence),
      weaknesses: this.identifyReasoningWeaknesses(logicalGaps),
      logicalGaps,
      supportingEvidence,
      counterArguments,
      recommendations: this.generateReasoningRecommendations(logicalGaps, supportingEvidence),
      confidence: ragContext ? 0.85 : 0.7,
      reasoning: this.generateReasoningExplanation(score, logicalGaps, supportingEvidence)
    };
  }

  // ============================================================
  // Public API: Generate clause
  // ============================================================

  async generateClause(clauseType: ClauseType, context: ClauseContext): Promise<GeneratedClause> {
    logger.info('Generating legal clause', { clauseType, contractType: context.contractType });

    const ragContext = await ragService.buildContextBlock(
      `clause ${clauseType} contrat ${context.contractType}`,
      { sourceType: ['document_template', 'legal_reference'] },
      { topK: 4, minScore: 0.5 }
    );

    const prompt = injectRagContext(
      this.buildClausePrompt(clauseType, context),
      ragContext
    );

    const aiResponse = await this.callAIService(prompt, {
      userRole: Profession.AVOCAT,
      language: context.language,
      jurisdiction: context.jurisdiction
    } as LegalContext);

    return {
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
      confidence: ragContext ? 0.9 : 0.75
    };
  }

  // ============================================================
  // Public API: Review contract
  // ============================================================

  async reviewContract(contract: string, reviewType: ReviewType): Promise<ContractReview> {
    logger.info('Reviewing contract', { reviewType, contractLength: contract.length });

    const ragContext = await ragService.buildContextBlock(
      `revue contrat ${reviewType} ${contract.substring(0, 800)}`,
      { sourceType: ['legal_article', 'jurisprudence_case', 'compliance_rule'] },
      { topK: 6, minScore: 0.5 }
    );

    const prompt = `Effectue une revue de contrat de type "${reviewType}" selon le droit algérien.
${ragContext ? `\nRÉFÉRENCES PERTINENTES:\n${ragContext.formatted}\n` : ''}

CONTRAT À ANALYSER:
"""
${contract}
"""

RÉPONDS en JSON avec la structure: {summary, sections, riskAnalysis, recommendations, missingClauses, redFlags, score, confidence}`;

    const aiRequest: AIRequest = {
      prompt,
      context: {
        userRole: Profession.AVOCAT,
        language: 'fr',
        jurisdiction: 'Algeria',
        legalDomain: LegalDomain.CIVIL
      } as LegalContext,
      maxTokens: 3500,
      temperature: 0.2
    };

    const aiResponse = await aiClient.generate(aiRequest);

    // Tenter le JSON, fallback sur un objet minimal
    try {
      const parsed = safeJsonParse<Partial<ContractReview>>(aiResponse.content);
      return {
        summary: parsed.summary ?? {
          contractType: 'Contrat',
          parties: [],
          keyTerms: [],
          mainObligations: [],
          criticalIssues: [],
          overallAssessment: 'À examiner'
        },
        sections: parsed.sections ?? [],
        riskAnalysis: parsed.riskAnalysis ?? {
          overallRisk: 'medium',
          riskCategories: [],
          mitigationStrategies: [],
          dealBreakers: [],
          negotiationPoints: []
        },
        recommendations: parsed.recommendations ?? [],
        missingClauses: parsed.missingClauses ?? [],
        redFlags: parsed.redFlags ?? [],
        score: typeof parsed.score === 'number' ? parsed.score : 75,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
        reviewTime: 15
      };
    } catch (error) {
      logger.warn('Contract review JSON parse failed, returning minimal review', { error });
      return {
        summary: {
          contractType: 'Contrat',
          parties: [],
          keyTerms: [],
          mainObligations: [],
          criticalIssues: ['Analyse non structurée - révision manuelle recommandée'],
          overallAssessment: 'Contrat nécessitant une revue manuelle'
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
        score: 60,
        confidence: 0.5,
        reviewTime: 15
      };
    }
  }

  // ============================================================
  // Public API: Extract legal entities
  // ============================================================

  async extractLegalEntities(document: string): Promise<LegalEntity[]> {
    logger.info('Extracting legal entities', { documentLength: document.length });

    const prompt = `Extrais toutes les entités juridiques de ce document.
Types: person, organization, court, law, article, case, date, amount, address, contract, procedure.
Pour chaque entité: {type, text, confidence, attributes: [{name, value}], variations}.

DOCUMENT:
"""
${document.substring(0, 6000)}
"""

RÉPONDS en JSON: {entities: [...]}`;

    const aiRequest: AIRequest = {
      prompt,
      context: {
        userRole: Profession.AVOCAT,
        language: 'fr',
        jurisdiction: 'Algeria',
        legalDomain: LegalDomain.CIVIL
      } as LegalContext,
      maxTokens: 2500,
      temperature: 0.1
    };

    const aiResponse = await aiClient.generate(aiRequest);

    try {
      const parsed = safeJsonParse<{ entities: Array<{
        type: string;
        text: string;
        confidence?: number;
        attributes?: Array<{ name: string; value: string }>;
        variations?: string[];
      }> }>(aiResponse.content);

      return (parsed.entities ?? []).map((e, idx) => ({
        type: (e.type as LegalEntity['type']) ?? 'person',
        text: e.text,
        location: { start: 0, end: 0 },
        confidence: e.confidence ?? 0.8,
        attributes: (e.attributes ?? []).map((a) => ({
          name: a.name,
          value: a.value,
          confidence: 0.8
        })),
        relationships: [],
        variations: e.variations ?? []
      })).filter((_, idx) => idx >= 0); // noop
    } catch (error) {
      logger.warn('Entity extraction JSON parse failed', { error });
      return [];
    }
  }

  // ============================================================
  // Public API: Summarize document
  // ============================================================

  async summarizeDocument(document: string, summaryType: SummaryType): Promise<DocumentSummary> {
    logger.info('Summarizing document', { summaryType, documentLength: document.length });

    const prompt = `Résume ce document juridique. Type de résumé: ${summaryType}.
DOCUMENT:
"""
${document.substring(0, 8000)}
"""

RÉPONDS en JSON avec: {summary, keyPoints: [], mainParties: [], importantDates: [], financialTerms: [], legalImplications: [], actionItems: []}`;

    const aiRequest: AIRequest = {
      prompt,
      context: {
        userRole: Profession.AVOCAT,
        language: 'fr',
        jurisdiction: 'Algeria',
        legalDomain: LegalDomain.CIVIL
      } as LegalContext,
      maxTokens: 2000,
      temperature: 0.3
    };

    const aiResponse = await aiClient.generate(aiRequest);

    try {
      const parsed = safeJsonParse<{
        summary: string;
        keyPoints?: string[];
        mainParties?: string[];
        importantDates?: string[];
        financialTerms?: Array<{ type: string; value: number; description: string; context: string }>;
        legalImplications?: string[];
        actionItems?: Array<{ description: string; priority: string; status: string }>;
      }>(aiResponse.content);

      return {
        type: summaryType,
        summary: parsed.summary ?? '',
        keyPoints: parsed.keyPoints ?? [],
        mainParties: parsed.mainParties ?? [],
        importantDates: (parsed.importantDates ?? []).map((d) => new Date(d)),
        financialTerms: (parsed.financialTerms ?? []).map((f) => ({
          type: (f.type as 'amount' | 'percentage' | 'rate' | 'fee') ?? 'amount',
          value: f.value,
          description: f.description,
          context: f.context
        })),
        legalImplications: parsed.legalImplications ?? [],
        actionItems: (parsed.actionItems ?? []).map((a) => ({
          description: a.description,
          priority: (a.priority as 'high' | 'medium' | 'low') ?? 'medium',
          status: (a.status as 'pending' | 'in_progress' | 'completed') ?? 'pending'
        })),
        confidence: 0.85,
        originalLength: document.length,
        summaryLength: (parsed.summary ?? '').length,
        compressionRatio: document.length > 0 ? (parsed.summary?.length ?? 0) / document.length : 0
      };
    } catch (error) {
      logger.warn('Document summary JSON parse failed', { error });
      return {
        type: summaryType,
        summary: aiResponse.content.substring(0, 500),
        keyPoints: [],
        mainParties: [],
        importantDates: [],
        financialTerms: [],
        legalImplications: [],
        actionItems: [],
        confidence: 0.5,
        originalLength: document.length,
        summaryLength: 500,
        compressionRatio: 0.1
      };
    }
  }

  // ============================================================
  // Public API: Translate legal text
  // ============================================================

  async translateLegalText(
    text: string,
    fromLang: 'fr' | 'ar',
    toLang: 'fr' | 'ar'
  ): Promise<TranslationResult> {
    logger.info('Translating legal text', { fromLang, toLang, textLength: text.length });

    const prompt = `Traduis ce texte juridique du ${fromLang === 'fr' ? 'français' : 'arabe'} vers le ${toLang === 'fr' ? 'français' : 'arabe'}.
Préserve les références légales, les noms propres, les dates et les numéros.
Garde la terminologie juridique précise.

TEXTE:
"""
${text}
"""

RÉPONDS en JSON: {translatedText, terminology: [{original, translated, type, confidence}], warnings: [], preservedElements: [{type, text, reason}], qualityScore}`;

    const aiRequest: AIRequest = {
      prompt,
      context: {
        userRole: Profession.AVOCAT,
        language: toLang,
        jurisdiction: 'Algeria',
        legalDomain: LegalDomain.CIVIL
      } as LegalContext,
      maxTokens: 3000,
      temperature: 0.2
    };

    const aiResponse = await aiClient.generate(aiRequest);

    try {
      const parsed = safeJsonParse<{
        translatedText: string;
        terminology?: Array<{ original: string; translated: string; type: string; confidence: number }>;
        warnings?: string[];
        preservedElements?: Array<{ type: string; text: string; reason: string }>;
        qualityScore?: number;
      }>(aiResponse.content);

      return {
        originalText: text,
        translatedText: parsed.translatedText ?? aiResponse.content,
        fromLanguage: fromLang,
        toLanguage: toLang,
        confidence: (parsed.qualityScore ?? 85) / 100,
        alternatives: [],
        terminology: (parsed.terminology ?? []).map((t) => ({
          original: t.original,
          translated: t.translated,
          type: (t.type as 'legal_term' | 'technical_term' | 'proper_noun') ?? 'legal_term',
          confidence: t.confidence,
          alternatives: []
        })),
        warnings: parsed.warnings ?? [],
        preservedElements: (parsed.preservedElements ?? []).map((p) => ({
          type: (p.type as 'legal_reference' | 'date' | 'number' | 'name' | 'address') ?? 'legal_reference',
          text: p.text,
          location: { start: 0, end: 0 },
          reason: p.reason
        })),
        qualityScore: parsed.qualityScore ?? 85
      };
    } catch (error) {
      logger.warn('Translation JSON parse failed, returning raw content', { error });
      return {
        originalText: text,
        translatedText: aiResponse.content,
        fromLanguage: fromLang,
        toLanguage: toLang,
        confidence: 0.6,
        alternatives: [],
        terminology: [],
        warnings: ['Traduction non structurée - révision manuelle recommandée'],
        preservedElements: [],
        qualityScore: 60
      };
    }
  }

  // ============================================================
  // Private helpers - Prompt building
  // ============================================================

  private buildDocumentPrompt(type: DocumentType, context: LegalContext): string {
    const roleInstructions = this.getRoleSpecificInstructions(context.userRole);
    const domainContext = this.getDomainContext(context.legalDomain);

    return `Génère un(e) ${type} pour un ${context.userRole} en ${context.jurisdiction}.
Domaine juridique: ${context.legalDomain}
Langue: ${context.language === 'ar' ? 'arabe' : 'français'}
${roleInstructions}
${domainContext}

Informations client: ${JSON.stringify(context.clientInfo ?? {})}
Informations dossier: ${JSON.stringify(context.caseInfo ?? {})}

Exigences:
- Respecter le droit algérien et les standards professionnels
- Utiliser la terminologie juridique appropriée
- Inclure les références légales pertinentes
- Structurer selon les normes de la profession
- Niveau d'urgence: ${context.urgency ?? 'normal'}
- Complexité: ${context.complexity ?? 'medium'}

${context.customInstructions ?? ''}`;
  }

  private buildCompliancePrompt(document: string, domain: LegalDomain, rules: ComplianceRule[]): string {
    return `ANALYSE DE CONFORMITÉ JURIDIQUE

Document à analyser:
${document}

Domaine juridique: ${domain}
Droit applicable: Droit algérien

Règles de conformité à vérifier:
${rules.map((r) => `- ${r.name}: ${r.description}`).join('\n')}

INSTRUCTIONS:
1. Analyse le document par rapport à chaque règle
2. Identifie les problèmes de conformité avec leur gravité (critique, élevée, moyenne, faible)
3. Propose des améliorations spécifiques
4. Cite les références légales pertinentes
5. Évalue les risques juridiques

FORMAT DE RÉPONSE:
PROBLÈMES IDENTIFIÉS:
[Liste des problèmes avec gravité]

SUGGESTIONS D'AMÉLIORATION:
[Améliorations recommandées]

RÉFÉRENCES LÉGALES:
[Textes applicables]

ÉVALUATION DES RISQUES:
[Analyse des risques]`;
  }

  private buildImprovementPrompt(document: string, userRole: Profession): string {
    const roleContext = this.getRoleSpecificInstructions(userRole);

    return `ANALYSE D'AMÉLIORATION DE DOCUMENT JURIDIQUE

Document à analyser:
${document}

Rôle de l'utilisateur: ${userRole}
Contexte professionnel: ${roleContext}

INSTRUCTIONS: Analyse le document et propose des améliorations dans:
1. STRUCTURE ET ORGANISATION
2. CONTENU JURIDIQUE
3. STYLE ET RÉDACTION
4. CONFORMITÉ PROCÉDURALE

FORMAT:
Pour chaque suggestion, indique:
- Type: [structure/contenu/style/conformité]
- Priorité: [haute/moyenne/faible]
- Description: [explication]
- Texte original: [si applicable]
- Texte suggéré: [proposition]
- Justification: [raison]`;
  }

  private buildExplanationPrompt(concept: string, level: ExplanationLevel): string {
    return `Explique le concept juridique "${concept}" au niveau ${level} en français, droit algérien.

Format attendu:
DÉFINITION: [définition claire]
CONTEXTE: [contexte juridique algérien]
CONCEPTS LIÉS: [liste]
APPLICATIONS PRATIQUES: [liste]
ERREURS COURANTES: [liste]
SOURCES: [liste]`;
  }

  private buildClausePrompt(clauseType: ClauseType, context: ClauseContext): string {
    return `Génère une clause de type "${clauseType}" pour un contrat ${context.contractType} en ${context.language}.
Parties: ${context.parties.map((p) => p.name).join(', ')}
Juridiction: ${context.jurisdiction}
Valeur: ${context.value ?? 'N/A'}
Durée: ${context.duration ?? 'N/A'}
Niveau de risque: ${context.riskLevel}
Exigences: ${(context.customRequirements ?? []).join('; ')}`;
  }

  // ============================================================
  // Private helpers - Real AI call (FIXED: not a stub)
  // ============================================================

  private async callAIService(prompt: string, context: LegalContext): Promise<string> {
    const aiRequest: AIRequest = {
      prompt,
      context,
      maxTokens: 2000,
      temperature: 0.3,
      model: this.modelConfig.model
    };

    const response: AIResponse = await aiClient.generate(aiRequest);
    return response.content;
  }

  // ============================================================
  // Private helpers - JSON parsing for draft
  // ============================================================

  private parseJsonDraftSafe(
    aiResponse: AIResponse,
    type: DocumentType,
    context: LegalContext
  ): DraftJsonSchema {
    try {
      const parsed = safeJsonParse<DraftJsonSchema>(aiResponse.content);
      return {
        title: parsed.title ?? `${type} - ${new Date().toLocaleDateString('fr-FR')}`,
        content: parsed.content ?? aiResponse.content,
        requiredVariables: Array.isArray(parsed.requiredVariables) ? parsed.requiredVariables : [],
        optionalVariables: Array.isArray(parsed.optionalVariables) ? parsed.optionalVariables : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
        keyLegalReferences: Array.isArray(parsed.keyLegalReferences) ? parsed.keyLegalReferences : []
      };
    } catch (error) {
      if (error instanceof JsonParseError) {
        logger.warn('Draft JSON parse failed, falling back to raw content', {
          error: error.message
        });
      } else {
        logger.warn('Draft JSON parse failed with unknown error', { error });
      }

      // Fallback : texte brut + extraction heuristique
      return {
        title: `${type} - ${new Date().toLocaleDateString('fr-FR')}`,
        content: aiResponse.content,
        requiredVariables: this.extractRequiredVariables(aiResponse.content),
        optionalVariables: this.extractOptionalVariables(aiResponse.content),
        warnings: [
          'Le contenu généré n\'a pas pu être structuré automatiquement. ' +
          'Vérifiez la cohérence et la mise en forme.'
        ],
        keyLegalReferences: []
      };
    }
  }

  // ============================================================
  // Private helpers - Document structure parsing
  // ============================================================

  private extractRequiredVariables(content: string): string[] {
    const variables: string[] = [];
    const re = /\{\{(\w+)\}\}/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      if (!variables.includes(match[1])) variables.push(match[1]);
    }
    return variables;
  }

  private extractOptionalVariables(content: string): string[] {
    const variables: string[] = [];
    const re = /\{\{#if\s+(\w+)\}\}/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      if (!variables.includes(match[1])) variables.push(match[1]);
    }
    return variables;
  }

  private extractDocumentSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const re = /^([A-Z][A-Z\s]+):?\s*$/gm;
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    let lastSection = '';

    while ((match = re.exec(content)) !== null) {
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

  private calculateDraftConfidence(
    content: string,
    context: LegalContext,
    ragSourcesCount: number
  ): number {
    let confidence = 0.7;

    if (/article\s+\d+|loi\s+n?[°o]/i.test(content)) confidence += 0.1;
    if (content.length > 500) confidence += 0.05;

    // Bonus RAG : si des sources ont été trouvées, on est plus confiant
    if (ragSourcesCount > 0) confidence += Math.min(0.15, ragSourcesCount * 0.025);

    if (context.precedents && context.precedents.length > 0) confidence += 0.1;
    if (context.complexity === 'complex') confidence -= 0.1;
    else if (context.complexity === 'simple') confidence += 0.05;

    return Math.min(0.95, Math.max(0.3, confidence));
  }

  private estimateCompletionTime(type: DocumentType, context: LegalContext): number {
    const baseTime: Record<string, number> = {
      [DocumentType.REQUETE]: 45,
      [DocumentType.CONCLUSION]: 60,
      [DocumentType.MEMOIRE]: 90,
      [DocumentType.CONTRAT]: 75,
      [DocumentType.ACTE_AUTHENTIQUE]: 120,
      [DocumentType.EXPLOIT]: 30,
      [DocumentType.JUGEMENT]: 180
    };
    let time = baseTime[type] ?? 60;
    if (context.complexity === 'complex') time *= 1.5;
    else if (context.complexity === 'simple') time *= 0.7;
    if (context.urgency === 'high') time *= 0.8;
    return Math.round(time);
  }

  // ============================================================
  // Private helpers - Role & domain instructions
  // ============================================================

  private getRoleSpecificInstructions(role: Profession): string {
    const map: Record<Profession, string> = {
      [Profession.AVOCAT]: 'Focus sur la plaidoirie, la représentation client et les exigences procédurales.',
      [Profession.NOTAIRE]: 'Assure l\'authenticité, les formalités légales et la procédure de témoignage.',
      [Profession.HUISSIER]: 'Inclus les procédures de signification, notifications légales et mesures d\'exécution.',
      [Profession.MAGISTRAT]: 'Focus sur le raisonnement judiciaire, la jurisprudence et la motivation.',
      [Profession.JURISTE_ENTREPRISE]: 'Considère le contexte business, les implications commerciales et la conformité.',
      [Profession.ETUDIANT]: 'Fournis un contexte pédagogique et des explications simplifiées.',
      [Profession.ADMIN]: 'Focus sur la conformité administrative et réglementaire.'
    };
    return map[role] ?? '';
  }

  private getDomainContext(domain: LegalDomain): string {
    const map: Record<LegalDomain, string> = {
      [LegalDomain.CIVIL]: 'Applique les principes du droit civil, droits personnels et obligations.',
      [LegalDomain.COMMERCIAL]: 'Considère le droit commercial, les transactions et la réglementation.',
      [LegalDomain.CRIMINAL]: 'Suis la procédure pénale, les règles de preuve et le code pénal.',
      [LegalDomain.ADMINISTRATIVE]: 'Applique le droit administratif et les procédures contentieuses.',
      [LegalDomain.FAMILY]: 'Considère le droit de la famille, l\'état des personnes et les successions.',
      [LegalDomain.LABOR]: 'Applique le droit du travail, les droits des travailleurs et la réglementation.',
      [LegalDomain.TAX]: 'Considère le droit fiscal, les obligations fiscales et la réglementation.',
      [LegalDomain.CONSTITUTIONAL]: 'Applique les principes constitutionnels et les droits fondamentaux.',
      [LegalDomain.INTERNATIONAL]: 'Considère le droit international, les traités et les conventions.'
    };
    return map[domain] ?? '';
  }

  // ============================================================
  // Private helpers - Compliance parsing
  // ============================================================

  private async getComplianceRules(domain: LegalDomain): Promise<ComplianceRule[]> {
    try {
      const result = await db.query(
        `SELECT * FROM compliance_rules WHERE domain = $1 AND is_active = true ORDER BY severity DESC`,
        [domain]
      );
      const rows = (result as { rows: Array<Record<string, unknown>> }).rows ?? [];
      if (rows.length > 0) {
        return rows.map((row) => ({
          id: row.id as string,
          name: row.name as string,
          description: row.description as string,
          category: row.category as string,
          jurisdiction: (row.jurisdiction as string) ?? 'Algeria',
          legalBasis: JSON.parse((row.legal_basis as string) ?? '[]'),
          severity: row.severity as ComplianceRule['severity'],
          isActive: (row.is_active as boolean) ?? true,
          lastUpdated: new Date((row.last_updated as string) ?? Date.now())
        }));
      }
    } catch (error) {
      logger.error('Failed to get compliance rules from database:', error);
    }
    return this.getDefaultComplianceRules(domain);
  }

  private getDefaultComplianceRules(domain: LegalDomain): ComplianceRule[] {
    const common: ComplianceRule[] = [
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
    switch (domain) {
      case LegalDomain.CIVIL:
        common.push({
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
        common.push({
          id: 'commercial_law',
          name: 'Droit commercial',
          description: 'Conformité au code de commerce algérien',
          category: 'commercial',
          jurisdiction: 'Algeria',
          legalBasis: [
            { type: 'law', reference: 'Code de commerce', title: 'Dispositions commerciales' }
          ],
          severity: 'high',
          isActive: true,
          lastUpdated: new Date()
        });
        break;
      case LegalDomain.LABOR:
        common.push({
          id: 'labor_law',
          name: 'Droit du travail',
          description: 'Conformité à la législation du travail algérienne',
          category: 'labor',
          jurisdiction: 'Algeria',
          legalBasis: [{ type: 'law', reference: 'Loi 90-11', title: 'Relations de travail' }],
          severity: 'high',
          isActive: true,
          lastUpdated: new Date()
        });
        break;
      default:
        break;
    }
    return common;
  }

  private async parseComplianceIssues(
    aiResponse: string,
    rules: ComplianceRule[]
  ): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];
    const section = this.extractSection(aiResponse, 'PROBLÈMES IDENTIFIÉS');
    if (!section) return issues;
    const lines = section.split('\n').filter((l) => l.trim().startsWith('-'));
    lines.forEach((line, idx) => {
      const sev = line.match(/\[(critique|élevée|moyenne|faible)\]/i);
      const severity = sev ? this.mapSeverity(sev[1]) : 'medium';
      const description = line.replace(/^-\s*/, '').replace(/\[.*?\]/g, '').trim();
      if (!description) return;
      issues.push({
        id: `issue_${idx}`,
        type: 'error',
        severity,
        title: description.substring(0, 100),
        description,
        location: { start: 0, end: 0 },
        rule: rules[0] ?? this.getDefaultRule(),
        legalBasis: [],
        impact: this.getImpactForSeverity(severity)
      });
    });
    return issues;
  }

  private async parseImprovementSuggestions(aiResponse: string): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    const section = this.extractSection(aiResponse, "SUGGESTIONS D'AMÉLIORATION");
    if (!section) return suggestions;
    const blocks = section.split('\n\n').filter((b) => b.trim());
    blocks.forEach((block, idx) => {
      const lines = block.split('\n').map((l) => l.trim()).filter((l) => l);
      if (lines.length === 0) return;
      suggestions.push({
        id: `suggestion_${idx}`,
        type: 'content',
        title: lines[0].substring(0, 100),
        description: lines.join(' '),
        after: '',
        impact: 'medium',
        effort: 'medium',
        confidence: 0.8
      });
    });
    return suggestions;
  }

  private async parseImprovementResponse(aiResponse: string, _document: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    const sections = ['STRUCTURE', 'CONTENU', 'STYLE', 'CONFORMITÉ'];
    for (const section of sections) {
      const content = this.extractSection(aiResponse, section);
      if (content) {
        suggestions.push(...this.parseSectionSuggestions(content, section.toLowerCase()));
      }
    }
    return suggestions;
  }

  private parseSectionSuggestions(content: string, type: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const lines = content.split('\n').filter((l) => l.trim().startsWith('-'));
    lines.forEach((line, idx) => {
      const clean = line.replace(/^-\s*/, '').trim();
      if (clean) {
        suggestions.push({
          id: `${type}_${idx}`,
          type: type as Suggestion['type'],
          title: clean.substring(0, 50),
          description: clean,
          location: { start: 0, end: 0 },
          original: '',
          suggested: '',
          reason: `Amélioration suggérée pour ${type}`,
          confidence: 0.8,
          priority: 'medium',
          category: type
        });
      }
    });
    return suggestions;
  }

  private async generateRoleSpecificSuggestions(
    document: string,
    userRole: Profession
  ): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    switch (userRole) {
      case Profession.AVOCAT:
        suggestions.push(...(await this.generateAvocatSuggestions(document)));
        break;
      case Profession.NOTAIRE:
        suggestions.push(...(await this.generateNotaireSuggestions(document)));
        break;
      case Profession.HUISSIER:
        suggestions.push(...(await this.generateHuissierSuggestions(document)));
        break;
      case Profession.MAGISTRAT:
        suggestions.push(...(await this.generateMagistratSuggestions(document)));
        break;
    }
    return suggestions;
  }

  private async generateAvocatSuggestions(document: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
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
    if (!/article\s+\d+|loi\s+n?[°o]/i.test(document)) {
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
    if (!document.includes("L'an") || !document.includes('Par-devant')) {
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
    if (!document.includes("J'ai") || !document.includes('Huissier de Justice')) {
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

  // ============================================================
  // Private helpers - Draft suggestions, references, warnings
  // ============================================================

  private async generateDraftSuggestions(
    content: string,
    context: LegalContext
  ): Promise<DraftSuggestion[]> {
    const suggestions: DraftSuggestion[] = [];
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

  private async findRelevantLegalReferences(
    content: string,
    context: LegalContext
  ): Promise<LegalReference[]> {
    const references: LegalReference[] = [];
    try {
      const keywords = this.extractKeywords(content);
      if (keywords.length === 0) {
        return this.getDefaultLegalReferences(context.legalDomain);
      }
      const keywordQuery = keywords.join(' | ');
      const result = await db.query(
        `SELECT DISTINCT lr.* FROM legal_references lr
         WHERE to_tsvector('french', lr.title || ' ' || lr.reference) @@ plainto_tsquery('french', $1)
         AND lr.domain = $2
         ORDER BY ts_rank(to_tsvector('french', lr.title || ' ' || lr.reference), plainto_tsquery('french', $1)) DESC
         LIMIT 10`,
        [keywordQuery, context.legalDomain]
      );
      const rows = (result as { rows: Array<Record<string, unknown>> }).rows ?? [];
      if (rows.length > 0) {
        references.push(
          ...rows.map((row) => ({
            type: row.type as LegalReference['type'],
            reference: row.reference as string,
            title: row.title as string,
            article: row.article as string | undefined,
            url: row.url as string | undefined
          }))
        );
      }
    } catch (error) {
      logger.error('Failed to find legal references:', error);
    }
    if (references.length === 0) {
      references.push(...this.getDefaultLegalReferences(context.legalDomain));
    }
    return references;
  }

  private getDefaultLegalReferences(domain: LegalDomain): LegalReference[] {
    const references: Record<string, LegalReference[]> = {
      [LegalDomain.CIVIL]: [
        { type: 'law', reference: 'Code civil algérien', title: 'Dispositions générales du droit civil' },
        { type: 'law', reference: 'Code de procédure civile et administrative', title: 'Procédure civile' }
      ],
      [LegalDomain.COMMERCIAL]: [
        { type: 'law', reference: 'Code de commerce', title: 'Droit commercial algérien' }
      ],
      [LegalDomain.CRIMINAL]: [
        { type: 'law', reference: 'Code pénal', title: 'Droit pénal algérien' },
        { type: 'law', reference: 'Code de procédure pénale', title: 'Procédure pénale' }
      ],
      [LegalDomain.LABOR]: [
        { type: 'law', reference: 'Loi 90-11', title: 'Relations de travail' }
      ],
      [LegalDomain.ADMINISTRATIVE]: [
        { type: 'law', reference: 'Code de procédure civile et administrative', title: 'Procédure administrative' }
      ],
      [LegalDomain.FAMILY]: [
        { type: 'law', reference: 'Code de la famille', title: 'Droit de la famille algérien' }
      ],
      [LegalDomain.TAX]: [
        { type: 'law', reference: 'Code des impôts directs', title: 'Fiscalité algérienne' }
      ],
      [LegalDomain.CONSTITUTIONAL]: [
        { type: 'law', reference: 'Constitution algérienne', title: 'Loi fondamentale' }
      ],
      [LegalDomain.INTERNATIONAL]: [
        { type: 'law', reference: 'Conventions internationales', title: 'Droit international applicable' }
      ]
    };
    return references[domain] ?? references[LegalDomain.CIVIL];
  }

  private extractKeywords(content: string): string[] {
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
    return legalTerms.filter((term) => words.includes(term));
  }

  private calculateComplianceScore(issues: ComplianceIssue[], documentLength: number): number {
    let score = 100;
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }
    void documentLength; // reserved for length-weighted scoring
    return Math.max(0, score);
  }

  private assessComplianceRisks(issues: ComplianceIssue[], _domain: LegalDomain): RiskAssessment {
    const critical = issues.filter((i) => i.severity === 'critical').length;
    const high = issues.filter((i) => i.severity === 'high').length;
    let overallRisk: RiskAssessment['overallRisk'] = 'low';
    if (critical > 0) overallRisk = 'critical';
    else if (high > 2) overallRisk = 'high';
    else if (high > 0 || issues.length > 5) overallRisk = 'medium';
    return {
      overallRisk,
      riskFactors: [],
      mitigationStrategies: [],
      recommendedActions: [],
      timeline: 'Action immédiate requise pour les problèmes critiques'
    };
  }

  private extractLegalReferences(issues: ComplianceIssue[]): LegalReference[] {
    const refs: LegalReference[] = [];
    for (const i of issues) refs.push(...i.legalBasis);
    return refs.filter((ref, idx, self) => idx === self.findIndex((r) => r.reference === ref.reference));
  }

  private generateComplianceSummary(issues: ComplianceIssue[], score: number): string {
    const critical = issues.filter((i) => i.severity === 'critical').length;
    const high = issues.filter((i) => i.severity === 'high').length;
    if (critical > 0) return `Le document comporte ${critical} problème(s) critique(s) de conformité à corriger immédiatement.`;
    if (high > 0) return `Le document comporte ${high} problème(s) de haute priorité.`;
    if (score >= 90) return 'Excellente conformité aux exigences légales.';
    if (score >= 70) return 'Bonne conformité avec des problèmes mineurs à corriger.';
    return 'Améliorations significatives nécessaires pour atteindre la conformité.';
  }

  private parseExplanationResponse(aiResponse: string): {
    definition: string;
    context: string;
    relatedConcepts: string[];
    practicalApplications: string[];
    commonMisunderstandings: string[];
    sources: string[];
  } {
    const contextSection = this.extractSection(aiResponse, 'CONTEXTE');
    return {
      definition: this.extractSection(aiResponse, 'DÉFINITION') ?? aiResponse.substring(0, 300),
      context:
        contextSection && contextSection.length > 0
          ? contextSection
          : 'Contexte juridique algérien applicable à ce concept.',
      relatedConcepts: this.extractListSection(aiResponse, 'CONCEPTS LIÉS'),
      practicalApplications: this.extractListSection(aiResponse, 'APPLICATIONS PRATIQUES'),
      commonMisunderstandings: this.extractListSection(aiResponse, 'ERREURS COURANTES'),
      sources: this.extractListSection(aiResponse, 'SOURCES')
    };
  }

  private inferDomainFromConcept(concept: string): LegalDomain {
    const c = concept.toLowerCase();
    if (c.includes('contrat') || c.includes('commercial') || c.includes('société')) return LegalDomain.COMMERCIAL;
    if (c.includes('pénal') || c.includes('crime') || c.includes('délit')) return LegalDomain.CRIMINAL;
    if (c.includes('famille') || c.includes('mariage') || c.includes('divorce')) return LegalDomain.FAMILY;
    if (c.includes('travail') || c.includes('emploi') || c.includes('salarié')) return LegalDomain.LABOR;
    if (c.includes('administratif') || c.includes('public')) return LegalDomain.ADMINISTRATIVE;
    if (c.includes('fiscal') || c.includes('impôt') || c.includes('taxe')) return LegalDomain.TAX;
    return LegalDomain.CIVIL;
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
    }
  }

  private async findConceptReferences(concept: string): Promise<LegalReference[]> {
    try {
      const result = await db.query(
        `SELECT * FROM legal_references
         WHERE to_tsvector('french', title || ' ' || reference || ' ' || COALESCE(content, '')) @@ plainto_tsquery('french', $1)
         LIMIT 5`,
        [concept]
      );
      const rows = (result as { rows: Array<Record<string, unknown>> }).rows ?? [];
      return rows.map((row) => ({
        type: row.type as LegalReference['type'],
        reference: row.reference as string,
        title: row.title as string,
        article: row.article as string | undefined
      }));
    } catch (error) {
      logger.error('Failed to find concept references:', error);
      return [];
    }
  }

  private async generateConceptExamples(_concept: string, _level: ExplanationLevel): Promise<Explanation['examples']> {
    // Reserved for future: generation d'exemples contextualisés via RAG
    return [];
  }

  private async findLogicalGaps(argument: string): Promise<LogicalGap[]> {
    const gaps: LogicalGap[] = [];
    if (!/article\s+\d+|loi\s+n?[°o]/i.test(argument)) {
      gaps.push({
        type: 'missing_premise',
        description: 'Aucune référence légale citée pour appuyer le raisonnement',
        location: { start: 0, end: 0 },
        severity: 'high',
        suggestion: 'Ajoutez des références aux textes de loi applicables (ex: Code civil, Code pénal).'
      });
    }
    if (argument.split('.').filter((s) => s.trim().length > 0).length < 3) {
      gaps.push({
        type: 'unsupported_claim',
        description: 'Raisonnement trop court pour être convaincant',
        location: { start: 0, end: 0 },
        severity: 'medium',
        suggestion: 'Développez chaque argument avec des justifications et des preuves.'
      });
    }
    return gaps;
  }

  private async findSupportingEvidence(
    _argument: string,
    ragContext: { results: Array<{ referenceCode: string | null; title: string; score: number }> } | null
  ): Promise<Evidence[]> {
    if (!ragContext) return [];
    return ragContext.results
      .filter((r) => r.score >= 0.6)
      .map((r) => ({
        type: 'legal_precedent' as const,
        description: r.title,
        strength: r.score > 0.75 ? 'strong' : r.score > 0.6 ? 'moderate' : 'weak',
        relevance: r.score,
        source: {
          type: 'jurisprudence',
          reference: r.referenceCode ?? r.title,
          title: r.title
        }
      }));
  }

  private async generateCounterArguments(argument: string): Promise<CounterArgument[]> {
    const counters: CounterArgument[] = [];
    if (!/Article\s+\d+/.test(argument)) {
      counters.push({
        argument: 'L\'argument s\'appuie sur des affirmations sans fondement textuel précis',
        strength: 'strong'
      });
    }
    return counters;
  }

  private calculateReasoningScore(
    gaps: LogicalGap[],
    evidence: Evidence[],
    counters: CounterArgument[]
  ): number {
    let score = 100;
    // Pondération par sévérité des gaps
    for (const gap of gaps) {
      switch (gap.severity) {
        case 'critical': score -= 40; break;
        case 'high': score -= 25; break;
        case 'medium': score -= 15; break;
        case 'low': score -= 5; break;
      }
    }
    // Bonus pour les preuves solides, malus pour les contre-arguments
    score += evidence.filter((e) => e.strength === 'strong').length * 10;
    score += evidence.filter((e) => e.strength === 'moderate').length * 5;
    score -= counters.length * 10;
    // Si pas de preuves et des gaps, double pénalité
    if (gaps.length > 0 && evidence.length === 0) {
      score -= 15;
    }
    return Math.max(0, Math.min(100, score));
  }

  private identifyReasoningStrengths(argument: string, evidence: Evidence[]): string[] {
    const strengths: string[] = [];
    if (/article\s+\d+|loi\s+n?[°o]/i.test(argument)) {
      strengths.push('S\'appuie sur des références légales précises (articles, lois)');
    }
    if (argument.split(/[.!?]/).filter((s) => s.trim().length > 0).length >= 3) {
      strengths.push('Raisonnement structuré en plusieurs étapes argumentatives');
    }
    if (evidence.some((e) => e.strength === 'strong')) {
      strengths.push('S\'appuie sur des précédents jurisprudentiels solides');
    }
    return strengths;
  }

  private identifyReasoningWeaknesses(gaps: LogicalGap[]): string[] {
    return gaps.map((g) => g.description);
  }

  private generateReasoningRecommendations(gaps: LogicalGap[], evidence: Evidence[]): string[] {
    const recs: string[] = [];
    recs.push(...gaps.map((g) => g.suggestion));
    if (evidence.length === 0) {
      recs.push('Ajoutez des précédents ou des références légales pour renforcer l\'argumentation.');
    }
    return recs;
  }

  private generateReasoningExplanation(
    score: number,
    gaps: LogicalGap[],
    evidence: Evidence[]
  ): string {
    return `Score: ${score}/100. ${gaps.length} faille(s) identifiée(s), ${evidence.length} preuve(s) trouvée(s).`;
  }

  private extractClauseTitle(response: string, type: ClauseType): string {
    const lines = response.split('\n').filter((l) => l.trim());
    return lines[0]?.substring(0, 100) ?? `Clause ${type}`;
  }

  private extractClauseContent(response: string): string {
    return response.trim();
  }

  private extractClauseAlternatives(_response: string): string[] {
    return [];
  }

  private extractClauseExplanation(_response: string): string {
    return 'Clause générée selon les standards du droit algérien. Vérifiez l\'adéquation avec votre situation spécifique.';
  }

  private async findClauseLegalBasis(_type: ClauseType, _context: ClauseContext): Promise<LegalReference[]> {
    return this.getDefaultLegalReferences(_context.jurisdiction === 'Algeria' ? LegalDomain.CIVIL : LegalDomain.INTERNATIONAL);
  }

  private assessClauseRisk(_type: ClauseType, context: ClauseContext): 'low' | 'medium' | 'high' {
    return context.riskLevel;
  }

  private generateClauseCustomization(_type: ClauseType, _context: ClauseContext): unknown[] {
    return [];
  }

  private async findClausePrecedents(_type: ClauseType): Promise<string[]> {
    return [];
  }

  private generateClauseWarnings(_type: ClauseType, _context: ClauseContext): string[] {
    return ['Cette clause est fournie à titre indicatif. Une validation par un juriste est recommandée.'];
  }

  // ============================================================
  // Private helpers - Section / severity utilities
  // ============================================================

  private extractSection(content: string, sectionName: string): string | null {
    const re = new RegExp(`${sectionName}:?\\s*\\n([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s]+:|$)`, 'i');
    const match = content.match(re);
    return match ? match[1].trim() : null;
  }

  private extractListSection(content: string, sectionName: string): string[] {
    const section = this.extractSection(content, sectionName);
    if (!section) return [];
    return section
      .split('\n')
      .map((line) => line.replace(/^[-*]\s*/, '').trim())
      .filter((line) => line.length > 0);
  }

  private mapSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    const map: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
      critique: 'critical',
      élevée: 'high',
      moyenne: 'medium',
      faible: 'low'
    };
    return map[severity.toLowerCase()] ?? 'medium';
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
    return {
      critical: 'Risque juridique majeur, action immédiate requise',
      high: 'Risque juridique important, correction recommandée',
      medium: 'Risque juridique modéré, amélioration suggérée',
      low: 'Risque juridique faible, optimisation possible'
    }[severity];
  }

  private getDocumentCategory(type: DocumentType): DocumentCategory {
    const map: Partial<Record<DocumentType, DocumentCategory>> = {
      [DocumentType.REQUETE]: DocumentCategory.PROCEDURE,
      [DocumentType.CONCLUSION]: DocumentCategory.PROCEDURE,
      [DocumentType.MEMOIRE]: DocumentCategory.PROCEDURE,
      [DocumentType.CONTRAT]: DocumentCategory.CONTRAT,
      [DocumentType.ACTE_AUTHENTIQUE]: DocumentCategory.ACTE_NOTARIE,
      [DocumentType.EXPLOIT]: DocumentCategory.SIGNIFICATION,
      [DocumentType.JUGEMENT]: DocumentCategory.DECISION_JUSTICE,
      [DocumentType.CONSULTATION]: DocumentCategory.CONSULTATION
    };
    return map[type] ?? DocumentCategory.AUTRE;
  }
}

export const aiLegalService = new AILegalService();
