import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  modelId: string;
  domainJuridique: DomaineJuridique;
  configuration: ModelConfiguration;
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  GROQ = 'groq',
  MISTRAL = 'mistral',
  LOCAL = 'local'
}

export enum DomaineJuridique {
  DROIT_CIVIL = 'droit_civil',
  DROIT_PENAL = 'droit_penal',
  DROIT_COMMERCIAL = 'droit_commercial',
  DROIT_ADMINISTRATIF = 'droit_administratif',
  DROIT_CONSTITUTIONNEL = 'droit_constitutionnel',
  DROIT_INTERNATIONAL = 'droit_international',
  DROIT_TRAVAIL = 'droit_travail',
  DROIT_FAMILLE = 'droit_famille',
  DROIT_IMMOBILIER = 'droit_immobilier',
  DROIT_FISCAL = 'droit_fiscal',
  GENERAL = 'general'
}

export interface ModelConfiguration {
  apiKey?: string;
  baseUrl?: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt: string;
  contextWindow: number;
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  customParameters?: Record<string, any>;
}

export interface CreateAIModelRequest {
  name: string;
  provider: AIProvider;
  modelId: string;
  domainJuridique: DomaineJuridique;
  configuration: ModelConfiguration;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateAIModelRequest {
  name?: string;
  modelId?: string;
  configuration?: Partial<ModelConfiguration>;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface AIModelSearchCriteria {
  provider?: AIProvider;
  domainJuridique?: DomaineJuridique;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AIModelSearchResult {
  models: AIModelConfig[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AIUsageStatistics {
  modelId: string;
  modelName: string;
  totalRequests: number;
  totalTokens: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  costEstimate: number;
  lastUsed: Date;
}

export interface AIPerformanceMetrics {
  modelId: string;
  domainJuridique: DomaineJuridique;
  averageAccuracy: number;
  averageRelevance: number;
  userSatisfactionScore: number;
  responseQuality: number;
  complianceScore: number;
}

export interface AIPromptTemplate {
  id: string;
  name: string;
  domainJuridique: DomaineJuridique;
  taskType: AITaskType;
  template: string;
  variables: PromptVariable[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AITaskType {
  DOCUMENT_GENERATION = 'document_generation',
  LEGAL_ANALYSIS = 'legal_analysis',
  COMPLIANCE_CHECK = 'compliance_check',
  CONTRACT_REVIEW = 'contract_review',
  LEGAL_RESEARCH = 'legal_research',
  TRANSLATION = 'translation',
  SUMMARIZATION = 'summarization'
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
}

export class AIConfigService {
  constructor(private db: Pool) {}

  /**
   * Créer une nouvelle configuration de modèle IA
   */
  async createAIModel(request: CreateAIModelRequest, adminId: string): Promise<AIModelConfig> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Si c'est le modèle par défaut, désactiver les autres modèles par défaut du même domaine
      if (request.isDefault) {
        await client.query(`
          UPDATE ai_model_configs 
          SET is_default = false, updated_at = CURRENT_TIMESTAMP
          WHERE domain_juridique = $1 AND is_default = true
        `, [request.domainJuridique]);
      }

      // Créer le modèle
      const modelQuery = `
        INSERT INTO ai_model_configs (
          name, provider, model_id, domain_juridique, configuration,
          is_active, is_default, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const modelResult = await client.query(modelQuery, [
        request.name,
        request.provider,
        request.modelId,
        request.domainJuridique,
        JSON.stringify(request.configuration),
        request.isActive ?? true,
        request.isDefault ?? false,
        adminId
      ]);

      const modelId = modelResult.rows[0].id;

      // Créer l'entrée d'audit
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, 
          details, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        adminId,
        'CREATE_AI_MODEL',
        'ai_model',
        modelId,
        JSON.stringify({ 
          modelConfig: {
            name: request.name,
            provider: request.provider,
            domainJuridique: request.domainJuridique
          }
        }),
        null,
        null
      ]);

      await client.query('COMMIT');

      const model = await this.getAIModelById(modelId);
      
      logger.info('Configuration de modèle IA créée', { 
        modelId, 
        name: request.name,
        provider: request.provider,
        domainJuridique: request.domainJuridique,
        adminId 
      });

      return model!;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors de la création de la configuration IA', { error, request, adminId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtenir une configuration de modèle IA par ID
   */
  async getAIModelById(modelId: string): Promise<AIModelConfig | null> {
    try {
      const query = `
        SELECT amc.*, u.email as created_by_email
        FROM ai_model_configs amc
        LEFT JOIN users u ON amc.created_by = u.id
        WHERE amc.id = $1
      `;

      const result = await this.db.query(query, [modelId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToAIModel(result.rows[0]);
    } catch (error) {
      logger.error('Erreur lors de la récupération de la configuration IA', { error, modelId });
      throw error;
    }
  }

  /**
   * Mettre à jour une configuration de modèle IA
   */
  async updateAIModel(modelId: string, request: UpdateAIModelRequest, adminId: string): Promise<AIModelConfig> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Vérifier que le modèle existe
      const existingModel = await this.getAIModelById(modelId);
      if (!existingModel) {
        throw new Error('Configuration de modèle IA non trouvée');
      }

      // Si c'est le nouveau modèle par défaut, désactiver les autres
      if (request.isDefault) {
        await client.query(`
          UPDATE ai_model_configs 
          SET is_default = false, updated_at = CURRENT_TIMESTAMP
          WHERE domain_juridique = $1 AND is_default = true AND id != $2
        `, [existingModel.domainJuridique, modelId]);
      }

      // Construire la requête de mise à jour
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (request.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        updateValues.push(request.name);
        paramIndex++;
      }

      if (request.modelId !== undefined) {
        updateFields.push(`model_id = $${paramIndex}`);
        updateValues.push(request.modelId);
        paramIndex++;
      }

      if (request.configuration !== undefined) {
        // Fusionner avec la configuration existante
        const mergedConfig = { ...existingModel.configuration, ...request.configuration };
        updateFields.push(`configuration = $${paramIndex}`);
        updateValues.push(JSON.stringify(mergedConfig));
        paramIndex++;
      }

      if (request.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        updateValues.push(request.isActive);
        paramIndex++;
      }

      if (request.isDefault !== undefined) {
        updateFields.push(`is_default = $${paramIndex}`);
        updateValues.push(request.isDefault);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        throw new Error('Aucune modification fournie');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(modelId);

      const updateQuery = `
        UPDATE ai_model_configs SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      await client.query(updateQuery, updateValues);

      // Créer l'entrée d'audit
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, 
          details, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        adminId,
        'UPDATE_AI_MODEL',
        'ai_model',
        modelId,
        JSON.stringify({ 
          previousData: {
            name: existingModel.name,
            modelId: existingModel.modelId,
            isActive: existingModel.isActive,
            isDefault: existingModel.isDefault
          },
          newData: request
        }),
        null,
        null
      ]);

      await client.query('COMMIT');

      const updatedModel = await this.getAIModelById(modelId);
      
      logger.info('Configuration de modèle IA mise à jour', { 
        modelId, 
        changes: request,
        adminId 
      });

      return updatedModel!;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors de la mise à jour de la configuration IA', { error, modelId, request, adminId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Supprimer une configuration de modèle IA
   */
  async deleteAIModel(modelId: string, adminId: string): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Vérifier que le modèle existe
      const existingModel = await this.getAIModelById(modelId);
      if (!existingModel) {
        throw new Error('Configuration de modèle IA non trouvée');
      }

      // Empêcher la suppression du modèle par défaut s'il est le seul actif
      if (existingModel.isDefault) {
        const activeModelsCount = await client.query(`
          SELECT COUNT(*) as count
          FROM ai_model_configs
          WHERE domain_juridique = $1 AND is_active = true AND id != $2
        `, [existingModel.domainJuridique, modelId]);

        if (parseInt(activeModelsCount.rows[0].count) === 0) {
          throw new Error('Impossible de supprimer le seul modèle actif pour ce domaine juridique');
        }
      }

      // Soft delete
      await client.query(`
        UPDATE ai_model_configs SET 
          is_active = false,
          deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [modelId]);

      // Créer l'entrée d'audit
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, 
          details, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        adminId,
        'DELETE_AI_MODEL',
        'ai_model',
        modelId,
        JSON.stringify({ 
          deletedModel: {
            name: existingModel.name,
            provider: existingModel.provider,
            domainJuridique: existingModel.domainJuridique
          }
        }),
        null,
        null
      ]);

      await client.query('COMMIT');
      
      logger.info('Configuration de modèle IA supprimée', { 
        modelId, 
        name: existingModel.name,
        adminId 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors de la suppression de la configuration IA', { error, modelId, adminId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Rechercher des configurations de modèles IA
   */
  async searchAIModels(criteria: AIModelSearchCriteria): Promise<AIModelSearchResult> {
    try {
      let query = `
        SELECT amc.*, u.email as created_by_email, COUNT(*) OVER() as total_count
        FROM ai_model_configs amc
        LEFT JOIN users u ON amc.created_by = u.id
        WHERE amc.deleted_at IS NULL
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (criteria.provider) {
        query += ` AND amc.provider = $${paramIndex}`;
        params.push(criteria.provider);
        paramIndex++;
      }

      if (criteria.domainJuridique) {
        query += ` AND amc.domain_juridique = $${paramIndex}`;
        params.push(criteria.domainJuridique);
        paramIndex++;
      }

      if (criteria.isActive !== undefined) {
        query += ` AND amc.is_active = $${paramIndex}`;
        params.push(criteria.isActive);
        paramIndex++;
      }

      if (criteria.search) {
        query += ` AND (amc.name ILIKE $${paramIndex} OR amc.model_id ILIKE $${paramIndex})`;
        params.push(`%${criteria.search}%`);
        paramIndex++;
      }

      query += ` ORDER BY amc.domain_juridique, amc.is_default DESC, amc.name ASC`;

      // Pagination
      const page = criteria.page || 1;
      const limit = criteria.limit || 20;
      const offset = (page - 1) * limit;

      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await this.db.query(query, params);

      const models = result.rows.map(row => this.mapRowToAIModel(row));
      const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
      const totalPages = Math.ceil(total / limit);

      return {
        models,
        total,
        page,
        totalPages
      };
    } catch (error) {
      logger.error('Erreur lors de la recherche de configurations IA', { error, criteria });
      throw error;
    }
  }

  /**
   * Obtenir les statistiques d'utilisation des modèles IA
   */
  async getAIUsageStatistics(dateFrom?: Date, dateTo?: Date): Promise<AIUsageStatistics[]> {
    try {
      const query = `
        SELECT 
          amc.id as model_id,
          amc.name as model_name,
          COUNT(aul.id) as total_requests,
          COALESCE(SUM(aul.tokens_used), 0) as total_tokens,
          COALESCE(AVG(aul.response_time_ms), 0) as average_response_time,
          COALESCE(AVG(CASE WHEN aul.success = true THEN 1.0 ELSE 0.0 END) * 100, 0) as success_rate,
          COALESCE(AVG(CASE WHEN aul.success = false THEN 1.0 ELSE 0.0 END) * 100, 0) as error_rate,
          COALESCE(SUM(aul.cost_estimate), 0) as cost_estimate,
          MAX(aul.created_at) as last_used
        FROM ai_model_configs amc
        LEFT JOIN ai_usage_logs aul ON amc.id = aul.model_id
        WHERE amc.deleted_at IS NULL
        ${dateFrom ? 'AND aul.created_at >= $1' : ''}
        ${dateTo ? `AND aul.created_at <= $${dateFrom ? '2' : '1'}` : ''}
        GROUP BY amc.id, amc.name
        ORDER BY total_requests DESC
      `;

      const params: any[] = [];
      if (dateFrom) params.push(dateFrom);
      if (dateTo) params.push(dateTo);

      const result = await this.db.query(query, params);

      return result.rows.map(row => ({
        modelId: row.model_id,
        modelName: row.model_name,
        totalRequests: parseInt(row.total_requests),
        totalTokens: parseInt(row.total_tokens),
        averageResponseTime: parseFloat(row.average_response_time),
        successRate: parseFloat(row.success_rate),
        errorRate: parseFloat(row.error_rate),
        costEstimate: parseFloat(row.cost_estimate),
        lastUsed: row.last_used ? new Date(row.last_used) : new Date()
      }));
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques d\'utilisation IA', { error });
      throw error;
    }
  }

  /**
   * Tester une configuration de modèle IA
   */
  async testAIModel(modelId: string, testPrompt: string): Promise<{ success: boolean; response?: string; error?: string; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      const model = await this.getAIModelById(modelId);
      if (!model) {
        throw new Error('Configuration de modèle IA non trouvée');
      }

      if (!model.isActive) {
        throw new Error('Le modèle IA n\'est pas actif');
      }

      // Simuler un appel à l'API IA (à remplacer par l'implémentation réelle)
      const response = await this.simulateAICall(model, testPrompt);
      const responseTime = Date.now() - startTime;

      // Enregistrer le test dans les logs
      await this.db.query(`
        INSERT INTO ai_usage_logs (
          model_id, user_id, prompt, response, success, 
          response_time_ms, tokens_used, cost_estimate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        modelId,
        null, // Test par admin
        testPrompt,
        response,
        true,
        responseTime,
        Math.floor(testPrompt.length / 4), // Estimation approximative
        0.001 // Coût estimé
      ]);

      return {
        success: true,
        response,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Enregistrer l'erreur dans les logs
      await this.db.query(`
        INSERT INTO ai_usage_logs (
          model_id, user_id, prompt, error_message, success, response_time_ms
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        modelId,
        null,
        testPrompt,
        error instanceof Error ? error.message : 'Erreur inconnue',
        false,
        responseTime
      ]);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        responseTime
      };
    }
  }

  // Méthodes privées

  private mapRowToAIModel(row: any): AIModelConfig {
    return {
      id: row.id,
      name: row.name,
      provider: row.provider,
      modelId: row.model_id,
      domainJuridique: row.domain_juridique,
      configuration: JSON.parse(row.configuration),
      isActive: row.is_active,
      isDefault: row.is_default,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private async simulateAICall(model: AIModelConfig, prompt: string): Promise<string> {
    // Simulation d'un appel IA - à remplacer par l'implémentation réelle
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    return `Réponse simulée du modèle ${model.name} (${model.provider}) pour le domaine ${model.domainJuridique}:\n\n` +
           `Prompt reçu: "${prompt}"\n\n` +
           `Cette réponse est générée par le système de test. En production, elle serait générée par le modèle IA configuré.`;
  }
}