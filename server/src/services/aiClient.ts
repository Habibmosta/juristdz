import { config } from '@/config/environment';
import { logger } from '@/utils/logger';
import { LegalContext, AIModelConfig } from '@/types/ai';

export interface AIRequest {
  prompt: string;
  context?: LegalContext;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
  processingTime: number;
}

export class AIClient {
  private readonly geminiApiKey: string;
  private readonly groqApiKey: string;
  private readonly defaultConfig: AIModelConfig;

  constructor() {
    this.geminiApiKey = config.apis.gemini;
    this.groqApiKey = config.apis.groq;
    this.defaultConfig = {
      model: 'gemini-pro',
      version: '1.0',
      temperature: 0.3,
      maxTokens: 4000,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
      stopSequences: [],
      customPrompts: {},
      domainSpecificSettings: {}
    };
  }

  /**
   * Generate text using Gemini API
   */
  async generateWithGemini(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Calling Gemini API', { 
        promptLength: request.prompt.length,
        model: request.model || 'gemini-pro'
      });

      // Prepare the request payload
      const payload = {
        contents: [{
          parts: [{
            text: this.buildContextualPrompt(request.prompt, request.context)
          }]
        }],
        generationConfig: {
          temperature: request.temperature || this.defaultConfig.temperature,
          maxOutputTokens: request.maxTokens || this.defaultConfig.maxTokens,
          topP: this.defaultConfig.topP,
          candidateCount: 1
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };

      // Make API call (placeholder - would use actual HTTP client)
      const response = await this.callGeminiAPI(payload);
      
      const processingTime = Date.now() - startTime;

      // Parse response
      const aiResponse: AIResponse = {
        content: response.candidates[0].content.parts[0].text,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        },
        model: 'gemini-pro',
        finishReason: response.candidates[0].finishReason || 'STOP',
        processingTime
      };

      logger.info('Gemini API call completed', {
        processingTime,
        totalTokens: aiResponse.usage.totalTokens,
        finishReason: aiResponse.finishReason
      });

      return aiResponse;

    } catch (error) {
      logger.error('Gemini API call failed:', error);
      throw new Error('AI service temporarily unavailable');
    }
  }

  /**
   * Generate text using Groq API (for faster inference)
   */
  async generateWithGroq(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Calling Groq API', { 
        promptLength: request.prompt.length,
        model: request.model || 'mixtral-8x7b-32768'
      });

      const payload = {
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(request.context)
          },
          {
            role: 'user',
            content: request.prompt
          }
        ],
        model: request.model || 'mixtral-8x7b-32768',
        temperature: request.temperature || this.defaultConfig.temperature,
        max_tokens: request.maxTokens || this.defaultConfig.maxTokens,
        top_p: this.defaultConfig.topP,
        stream: false
      };

      // Make API call (placeholder)
      const response = await this.callGroqAPI(payload);
      
      const processingTime = Date.now() - startTime;

      const aiResponse: AIResponse = {
        content: response.choices[0].message.content,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        },
        model: response.model,
        finishReason: response.choices[0].finish_reason,
        processingTime
      };

      logger.info('Groq API call completed', {
        processingTime,
        totalTokens: aiResponse.usage.totalTokens,
        finishReason: aiResponse.finishReason
      });

      return aiResponse;

    } catch (error) {
      logger.error('Groq API call failed:', error);
      throw new Error('AI service temporarily unavailable');
    }
  }

  /**
   * Choose the best AI service based on request type
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    // Use Groq for faster responses, Gemini for complex legal analysis
    const useGroq = request.maxTokens && request.maxTokens < 2000;
    
    if (useGroq) {
      return this.generateWithGroq(request);
    } else {
      return this.generateWithGemini(request);
    }
  }

  /**
   * Build contextual prompt with legal domain knowledge
   */
  private buildContextualPrompt(prompt: string, context?: LegalContext): string {
    if (!context) {
      return prompt;
    }

    const contextualPrompt = `
CONTEXTE JURIDIQUE ALGÉRIEN:
- Rôle utilisateur: ${context.userRole}
- Domaine juridique: ${context.legalDomain}
- Juridiction: ${context.jurisdiction}
- Langue: ${context.language}
- Niveau d'urgence: ${context.urgency || 'normal'}
- Complexité: ${context.complexity || 'medium'}

INSTRUCTIONS SPÉCIFIQUES:
- Respecter le droit algérien et les spécificités locales
- Utiliser la terminologie juridique appropriée
- Fournir des références légales pertinentes
- Adapter le niveau de détail au rôle de l'utilisateur
- Répondre en ${context.language === 'ar' ? 'arabe' : 'français'}

${context.customInstructions ? `INSTRUCTIONS PERSONNALISÉES:\n${context.customInstructions}\n` : ''}

DEMANDE:
${prompt}
    `;

    return contextualPrompt;
  }

  /**
   * Build system prompt for chat-based models
   */
  private buildSystemPrompt(context?: LegalContext): string {
    if (!context) {
      return 'Vous êtes un assistant juridique spécialisé dans le droit algérien.';
    }

    return `
Vous êtes un assistant juridique expert spécialisé dans le droit algérien.

PROFIL UTILISATEUR:
- Rôle: ${context.userRole}
- Domaine: ${context.legalDomain}
- Juridiction: ${context.jurisdiction}

DIRECTIVES:
1. Respectez strictement le droit algérien
2. Utilisez la terminologie juridique précise
3. Fournissez des références légales (codes, lois, décrets)
4. Adaptez votre réponse au niveau professionnel de l'utilisateur
5. Soyez précis et professionnel
6. Mentionnez les risques juridiques le cas échéant
7. Répondez en ${context.language === 'ar' ? 'arabe' : 'français'}

SPÉCIALISATION PAR RÔLE:
- Avocat: Focus sur la plaidoirie, procédure, représentation client
- Notaire: Focus sur l'authenticité, formalités, actes authentiques
- Huissier: Focus sur les significations, exécutions, constats
- Magistrat: Focus sur la jurisprudence, motivation, décisions
- Étudiant: Explications pédagogiques, exemples concrets
- Juriste Entreprise: Conformité, contrats, conseil juridique
- Admin: Gestion, réglementation, supervision
    `;
  }

  /**
   * Placeholder for actual Gemini API call
   */
  private async callGeminiAPI(payload: any): Promise<any> {
    // In production, this would make an actual HTTP request to Gemini API
    // For now, return a mock response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      candidates: [{
        content: {
          parts: [{
            text: `Réponse générée par Gemini pour: ${JSON.stringify(payload).substring(0, 100)}...`
          }]
        },
        finishReason: 'STOP'
      }],
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 200,
        totalTokenCount: 300
      }
    };
  }

  /**
   * Placeholder for actual Groq API call
   */
  private async callGroqAPI(payload: any): Promise<any> {
    // In production, this would make an actual HTTP request to Groq API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      choices: [{
        message: {
          content: `Réponse générée par Groq pour: ${payload.messages[1].content.substring(0, 100)}...`
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 80,
        completion_tokens: 150,
        total_tokens: 230
      },
      model: payload.model
    };
  }

  /**
   * Validate AI response for legal content
   */
  validateLegalResponse(response: AIResponse, context?: LegalContext): boolean {
    // Basic validation - in production, implement more sophisticated checks
    const content = response.content.toLowerCase();
    
    // Check for harmful content
    const harmfulPatterns = [
      'illegal advice',
      'violate the law',
      'break regulations'
    ];
    
    for (const pattern of harmfulPatterns) {
      if (content.includes(pattern)) {
        logger.warn('Potentially harmful AI response detected', { pattern });
        return false;
      }
    }

    // Check for appropriate legal language
    if (context?.userRole === 'etudiant') {
      // For students, ensure educational tone
      const educationalIndicators = ['par exemple', 'il faut noter', 'en pratique'];
      const hasEducationalTone = educationalIndicators.some(indicator => 
        content.includes(indicator)
      );
      
      if (!hasEducationalTone && response.content.length > 500) {
        logger.info('Response may need more educational context for student');
      }
    }

    return true;
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<{
    totalRequests: number;
    totalTokens: number;
    averageResponseTime: number;
    errorRate: number;
  }> {
    // Placeholder - in production, track actual usage
    return {
      totalRequests: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      errorRate: 0
    };
  }
}

export const aiClient = new AIClient();