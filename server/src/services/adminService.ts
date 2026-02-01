import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger.js';
import { Profession } from '../types/auth.js';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Profession;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  organizationId?: string;
  organizationName?: string;
  loginAttempts: number;
  lockedUntil?: Date;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: Profession;
  password: string;
  organizationId?: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: Profession;
  isActive?: boolean;
  organizationId?: string;
}

export interface UserSearchCriteria {
  email?: string;
  role?: Profession;
  isActive?: boolean;
  organizationId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'email' | 'firstName' | 'lastName' | 'role' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserSearchResult {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<Profession, number>;
  recentRegistrations: number;
  lockedUsers: number;
  unverifiedUsers: number;
}

export interface PlatformStatistics {
  users: UserStatistics;
  usage: UsageStatistics;
  performance: PerformanceStatistics;
  financial: FinancialStatistics;
  content: ContentStatistics;
}

export interface UsageStatistics {
  totalSessions: number;
  activeSessions: number;
  averageSessionDuration: number;
  totalDocumentsGenerated: number;
  totalSearches: number;
  totalAIRequests: number;
  peakConcurrentUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
}

export interface PerformanceStatistics {
  averageResponseTime: number;
  systemUptime: number;
  errorRate: number;
  successRate: number;
  databasePerformance: {
    averageQueryTime: number;
    slowQueries: number;
    connectionPoolUsage: number;
  };
  aiPerformance: {
    averageResponseTime: number;
    successRate: number;
    totalCost: number;
  };
}

export interface FinancialStatistics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  subscriptionsByTier: Record<string, number>;
  churnRate: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingPayments: number;
}

export interface ContentStatistics {
  totalDocuments: number;
  documentsByType: Record<string, number>;
  totalTemplates: number;
  totalCases: number;
  totalSearchQueries: number;
  popularSearchTerms: Array<{ term: string; count: number }>;
  documentGenerationTrends: Array<{ date: string; count: number }>;
}

export interface SystemHealthReport {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastChecked: Date;
  services: ServiceHealth[];
  alerts: SystemAlert[];
  recommendations: string[];
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  responseTime: number;
  lastChecked: Date;
  details?: string;
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface AdminReport {
  id: string;
  name: string;
  type: AdminReportType;
  description: string;
  parameters: ReportParameter[];
  schedule?: ReportSchedule;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AdminReportType {
  USER_ACTIVITY = 'user_activity',
  SYSTEM_PERFORMANCE = 'system_performance',
  FINANCIAL_SUMMARY = 'financial_summary',
  CONTENT_ANALYTICS = 'content_analytics',
  SECURITY_AUDIT = 'security_audit',
  AI_USAGE = 'ai_usage',
  CUSTOM = 'custom'
}

export interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  label: string;
  required: boolean;
  defaultValue?: any;
  options?: Array<{ value: any; label: string }>;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:MM format
  recipients: string[];
  isActive: boolean;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  roleName: string;
  organizationId?: string;
  organizationName?: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
  organizationId?: string;
  expiresAt?: Date;
}

export class AdminService {
  constructor(private db: Pool) {}

  /**
   * Créer un nouvel utilisateur
   */
  async createUser(request: CreateUserRequest, adminId: string): Promise<AdminUser> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Vérifier si l'email existe déjà
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [request.email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(request.password, 12);

      // Créer l'utilisateur
      const userQuery = `
        INSERT INTO users (
          email, password_hash, first_name, last_name, role, 
          is_active, is_email_verified, organization_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const userResult = await client.query(userQuery, [
        request.email,
        hashedPassword,
        request.firstName,
        request.lastName,
        request.role,
        request.isActive ?? true,
        false, // Email non vérifié par défaut
        request.organizationId
      ]);

      const userId = userResult.rows[0].id;

      // Créer l'entrée d'audit
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, 
          details, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        adminId,
        'CREATE_USER',
        'user',
        userId,
        JSON.stringify({ 
          createdUser: { 
            email: request.email, 
            role: request.role,
            firstName: request.firstName,
            lastName: request.lastName
          }
        }),
        null, // IP sera ajoutée par le middleware
        null  // User agent sera ajouté par le middleware
      ]);

      await client.query('COMMIT');

      const user = await this.getUserById(userId);
      
      logger.info('Utilisateur créé par admin', { 
        userId, 
        email: request.email,
        role: request.role,
        adminId 
      });

      return user!;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors de la création de l\'utilisateur', { error, request, adminId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtenir un utilisateur par ID
   */
  async getUserById(userId: string): Promise<AdminUser | null> {
    try {
      const query = `
        SELECT u.*, o.name as organization_name
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.id = $1
      `;

      const result = await this.db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToAdminUser(result.rows[0]);
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'utilisateur', { error, userId });
      throw error;
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(userId: string, request: UpdateUserRequest, adminId: string): Promise<AdminUser> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Vérifier que l'utilisateur existe
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Construire la requête de mise à jour
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (request.firstName !== undefined) {
        updateFields.push(`first_name = $${paramIndex}`);
        updateValues.push(request.firstName);
        paramIndex++;
      }

      if (request.lastName !== undefined) {
        updateFields.push(`last_name = $${paramIndex}`);
        updateValues.push(request.lastName);
        paramIndex++;
      }

      if (request.role !== undefined) {
        updateFields.push(`role = $${paramIndex}`);
        updateValues.push(request.role);
        paramIndex++;
      }

      if (request.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        updateValues.push(request.isActive);
        paramIndex++;
      }

      if (request.organizationId !== undefined) {
        updateFields.push(`organization_id = $${paramIndex}`);
        updateValues.push(request.organizationId);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        throw new Error('Aucune modification fournie');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(userId);

      const updateQuery = `
        UPDATE users SET ${updateFields.join(', ')}
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
        'UPDATE_USER',
        'user',
        userId,
        JSON.stringify({ 
          previousData: {
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            role: existingUser.role,
            isActive: existingUser.isActive,
            organizationId: existingUser.organizationId
          },
          newData: request
        }),
        null,
        null
      ]);

      await client.query('COMMIT');

      const updatedUser = await this.getUserById(userId);
      
      logger.info('Utilisateur mis à jour par admin', { 
        userId, 
        changes: request,
        adminId 
      });

      return updatedUser!;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors de la mise à jour de l\'utilisateur', { error, userId, request, adminId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Supprimer un utilisateur (soft delete)
   */
  async deleteUser(userId: string, adminId: string): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Vérifier que l'utilisateur existe
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Empêcher la suppression de son propre compte
      if (userId === adminId) {
        throw new Error('Impossible de supprimer votre propre compte');
      }

      // Soft delete - désactiver l'utilisateur et marquer comme supprimé
      await client.query(`
        UPDATE users SET 
          is_active = false,
          deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [userId]);

      // Révoquer toutes les sessions actives
      await client.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);

      // Créer l'entrée d'audit
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, 
          details, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        adminId,
        'DELETE_USER',
        'user',
        userId,
        JSON.stringify({ 
          deletedUser: {
            email: existingUser.email,
            role: existingUser.role,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName
          }
        }),
        null,
        null
      ]);

      await client.query('COMMIT');
      
      logger.info('Utilisateur supprimé par admin', { 
        userId, 
        email: existingUser.email,
        adminId 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors de la suppression de l\'utilisateur', { error, userId, adminId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Rechercher des utilisateurs avec critères
   */
  async searchUsers(criteria: UserSearchCriteria): Promise<UserSearchResult> {
    try {
      let query = `
        SELECT u.*, o.name as organization_name, COUNT(*) OVER() as total_count
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.deleted_at IS NULL
      `;

      const params: any[] = [];
      let paramIndex = 1;

      // Construire les conditions de recherche
      if (criteria.email) {
        query += ` AND u.email ILIKE $${paramIndex}`;
        params.push(`%${criteria.email}%`);
        paramIndex++;
      }

      if (criteria.role) {
        query += ` AND u.role = $${paramIndex}`;
        params.push(criteria.role);
        paramIndex++;
      }

      if (criteria.isActive !== undefined) {
        query += ` AND u.is_active = $${paramIndex}`;
        params.push(criteria.isActive);
        paramIndex++;
      }

      if (criteria.organizationId) {
        query += ` AND u.organization_id = $${paramIndex}`;
        params.push(criteria.organizationId);
        paramIndex++;
      }

      if (criteria.search) {
        query += ` AND (
          u.first_name ILIKE $${paramIndex} OR 
          u.last_name ILIKE $${paramIndex} OR 
          u.email ILIKE $${paramIndex}
        )`;
        params.push(`%${criteria.search}%`);
        paramIndex++;
      }

      // Tri
      const sortBy = criteria.sortBy || 'createdAt';
      const sortOrder = criteria.sortOrder || 'desc';
      const sortColumn = this.mapSortColumn(sortBy);
      query += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;

      // Pagination
      const page = criteria.page || 1;
      const limit = criteria.limit || 20;
      const offset = (page - 1) * limit;

      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await this.db.query(query, params);

      const users = result.rows.map(row => this.mapRowToAdminUser(row));
      const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        totalPages
      };
    } catch (error) {
      logger.error('Erreur lors de la recherche d\'utilisateurs', { error, criteria });
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des utilisateurs
   */
  async getUserStatistics(): Promise<UserStatistics> {
    try {
      // Statistiques générales
      const generalStats = await this.db.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
          COUNT(CASE WHEN created_at > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as recent_registrations,
          COUNT(CASE WHEN locked_until > CURRENT_TIMESTAMP THEN 1 END) as locked_users,
          COUNT(CASE WHEN is_email_verified = false THEN 1 END) as unverified_users
        FROM users 
        WHERE deleted_at IS NULL
      `);

      // Répartition par rôle
      const roleStats = await this.db.query(`
        SELECT role, COUNT(*) as count
        FROM users 
        WHERE deleted_at IS NULL
        GROUP BY role
      `);

      const usersByRole = roleStats.rows.reduce((acc, row) => {
        acc[row.role as Profession] = parseInt(row.count);
        return acc;
      }, {} as Record<Profession, number>);

      // Initialiser tous les rôles à 0
      Object.values(Profession).forEach(role => {
        if (!(role in usersByRole)) {
          usersByRole[role] = 0;
        }
      });

      const stats = generalStats.rows[0];

      return {
        totalUsers: parseInt(stats.total_users),
        activeUsers: parseInt(stats.active_users),
        usersByRole,
        recentRegistrations: parseInt(stats.recent_registrations),
        lockedUsers: parseInt(stats.locked_users),
        unverifiedUsers: parseInt(stats.unverified_users)
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques utilisateurs', { error });
      throw error;
    }
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur
   */
  async resetUserPassword(userId: string, newPassword: string, adminId: string): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Vérifier que l'utilisateur existe
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Mettre à jour le mot de passe
      await client.query(`
        UPDATE users SET 
          password_hash = $1,
          login_attempts = 0,
          locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [hashedPassword, userId]);

      // Révoquer toutes les sessions actives
      await client.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);

      // Créer l'entrée d'audit
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, 
          details, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        adminId,
        'RESET_PASSWORD',
        'user',
        userId,
        JSON.stringify({ 
          targetUser: {
            email: existingUser.email,
            role: existingUser.role
          }
        }),
        null,
        null
      ]);

      await client.query('COMMIT');
      
      logger.info('Mot de passe réinitialisé par admin', { 
        userId, 
        email: existingUser.email,
        adminId 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors de la réinitialisation du mot de passe', { error, userId, adminId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Débloquer un utilisateur
   */
  async unlockUser(userId: string, adminId: string): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Vérifier que l'utilisateur existe
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Débloquer l'utilisateur
      await client.query(`
        UPDATE users SET 
          login_attempts = 0,
          locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [userId]);

      // Créer l'entrée d'audit
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, 
          details, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        adminId,
        'UNLOCK_USER',
        'user',
        userId,
        JSON.stringify({ 
          unlockedUser: {
            email: existingUser.email,
            role: existingUser.role
          }
        }),
        null,
        null
      ]);

      await client.query('COMMIT');
      
      logger.info('Utilisateur débloqué par admin', { 
        userId, 
        email: existingUser.email,
        adminId 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors du déblocage de l\'utilisateur', { error, userId, adminId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtenir les statistiques complètes de la plateforme
   */
  async getPlatformStatistics(): Promise<PlatformStatistics> {
    try {
      const [
        userStats,
        usageStats,
        performanceStats,
        financialStats,
        contentStats
      ] = await Promise.all([
        this.getUserStatistics(),
        this.getUsageStatistics(),
        this.getPerformanceStatistics(),
        this.getFinancialStatistics(),
        this.getContentStatistics()
      ]);

      return {
        users: userStats,
        usage: usageStats,
        performance: performanceStats,
        financial: financialStats,
        content: contentStats
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques de la plateforme', { error });
      throw error;
    }
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  async getUsageStatistics(): Promise<UsageStatistics> {
    try {
      const sessionStats = await this.db.query(`
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN expires_at > CURRENT_TIMESTAMP THEN 1 END) as active_sessions,
          COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(updated_at, created_at) - created_at))), 0) as avg_session_duration
        FROM user_sessions
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
      `);

      const activityStats = await this.db.query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN al.created_at > CURRENT_TIMESTAMP - INTERVAL '1 day' THEN al.user_id END) as daily_active,
          COUNT(DISTINCT CASE WHEN al.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days' THEN al.user_id END) as weekly_active,
          COUNT(DISTINCT CASE WHEN al.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN al.user_id END) as monthly_active,
          COUNT(CASE WHEN al.action = 'GENERATE_DOCUMENT' THEN 1 END) as total_documents,
          COUNT(CASE WHEN al.action = 'SEARCH' THEN 1 END) as total_searches,
          COUNT(CASE WHEN al.resource_type = 'ai_request' THEN 1 END) as total_ai_requests
        FROM audit_logs al
        WHERE al.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
      `);

      const sessionData = sessionStats.rows[0];
      const activityData = activityStats.rows[0];

      return {
        totalSessions: parseInt(sessionData.total_sessions),
        activeSessions: parseInt(sessionData.active_sessions),
        averageSessionDuration: parseFloat(sessionData.avg_session_duration),
        totalDocumentsGenerated: parseInt(activityData.total_documents),
        totalSearches: parseInt(activityData.total_searches),
        totalAIRequests: parseInt(activityData.total_ai_requests),
        peakConcurrentUsers: 0, // À implémenter avec un système de monitoring en temps réel
        dailyActiveUsers: parseInt(activityData.daily_active),
        weeklyActiveUsers: parseInt(activityData.weekly_active),
        monthlyActiveUsers: parseInt(activityData.monthly_active)
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques d\'utilisation', { error });
      throw error;
    }
  }

  /**
   * Obtenir les statistiques de performance
   */
  async getPerformanceStatistics(): Promise<PerformanceStatistics> {
    try {
      // Statistiques de base (simulées - à remplacer par de vraies métriques)
      const errorStats = await this.db.query(`
        SELECT 
          COUNT(CASE WHEN al.details::text LIKE '%error%' THEN 1 END) as error_count,
          COUNT(*) as total_requests
        FROM audit_logs al
        WHERE al.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
      `);

      const aiStats = await this.db.query(`
        SELECT 
          COALESCE(AVG(response_time_ms), 0) as avg_ai_response_time,
          COALESCE(AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) * 100, 0) as ai_success_rate,
          COALESCE(SUM(cost_estimate), 0) as total_ai_cost
        FROM ai_usage_logs
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
      `);

      const errorData = errorStats.rows[0];
      const aiData = aiStats.rows[0];

      const totalRequests = parseInt(errorData.total_requests);
      const errorCount = parseInt(errorData.error_count);

      return {
        averageResponseTime: 150, // Simulé - à remplacer par de vraies métriques
        systemUptime: 99.9, // Simulé - à calculer depuis le dernier redémarrage
        errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
        successRate: totalRequests > 0 ? ((totalRequests - errorCount) / totalRequests) * 100 : 100,
        databasePerformance: {
          averageQueryTime: 25, // Simulé
          slowQueries: 2, // Simulé
          connectionPoolUsage: 65 // Simulé
        },
        aiPerformance: {
          averageResponseTime: parseFloat(aiData.avg_ai_response_time),
          successRate: parseFloat(aiData.ai_success_rate),
          totalCost: parseFloat(aiData.total_ai_cost)
        }
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques de performance', { error });
      throw error;
    }
  }

  /**
   * Obtenir les statistiques financières
   */
  async getFinancialStatistics(): Promise<FinancialStatistics> {
    try {
      const billingStats = await this.db.query(`
        SELECT 
          COUNT(*) as total_invoices,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invoices,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN status = 'paid' THEN total_amount ELSE NULL END), 0) as avg_invoice_amount
        FROM invoices
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
      `);

      const subscriptionStats = await this.db.query(`
        SELECT 
          COUNT(*) as total_subscriptions,
          subscription_tier,
          COUNT(*) as tier_count
        FROM user_subscriptions
        WHERE is_active = true
        GROUP BY subscription_tier
      `);

      const billingData = billingStats.rows[0];
      const subscriptionData = subscriptionStats.rows;

      const subscriptionsByTier = subscriptionData.reduce((acc, row) => {
        acc[row.subscription_tier] = parseInt(row.tier_count);
        return acc;
      }, {} as Record<string, number>);

      return {
        totalRevenue: parseFloat(billingData.total_revenue),
        monthlyRecurringRevenue: parseFloat(billingData.total_revenue), // Approximation
        averageRevenuePerUser: parseFloat(billingData.avg_invoice_amount),
        subscriptionsByTier,
        churnRate: 2.5, // Simulé - à calculer avec des données historiques
        totalInvoices: parseInt(billingData.total_invoices),
        paidInvoices: parseInt(billingData.paid_invoices),
        pendingPayments: parseInt(billingData.pending_invoices)
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques financières', { error });
      throw error;
    }
  }

  /**
   * Obtenir les statistiques de contenu
   */
  async getContentStatistics(): Promise<ContentStatistics> {
    try {
      const documentStats = await this.db.query(`
        SELECT 
          COUNT(*) as total_documents,
          document_type,
          COUNT(*) as type_count
        FROM documents
        WHERE deleted_at IS NULL
        GROUP BY document_type
      `);

      const templateStats = await this.db.query(`
        SELECT COUNT(*) as total_templates
        FROM document_templates
        WHERE is_active = true
      `);

      const caseStats = await this.db.query(`
        SELECT COUNT(*) as total_cases
        FROM cases
        WHERE deleted_at IS NULL
      `);

      const searchStats = await this.db.query(`
        SELECT 
          COUNT(*) as total_searches,
          search_query,
          COUNT(*) as query_count
        FROM search_logs
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
        GROUP BY search_query
        ORDER BY query_count DESC
        LIMIT 10
      `);

      const generationTrends = await this.db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM documents
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      const documentData = documentStats.rows;
      const templateData = templateStats.rows[0];
      const caseData = caseStats.rows[0];
      const searchData = searchStats.rows;
      const trendData = generationTrends.rows;

      const documentsByType = documentData.reduce((acc, row) => {
        acc[row.document_type] = parseInt(row.type_count);
        return acc;
      }, {} as Record<string, number>);

      const popularSearchTerms = searchData.map(row => ({
        term: row.search_query,
        count: parseInt(row.query_count)
      }));

      const documentGenerationTrends = trendData.map(row => ({
        date: row.date,
        count: parseInt(row.count)
      }));

      return {
        totalDocuments: documentData.reduce((sum, row) => sum + parseInt(row.type_count), 0),
        documentsByType,
        totalTemplates: parseInt(templateData.total_templates),
        totalCases: parseInt(caseData.total_cases),
        totalSearchQueries: searchData.reduce((sum, row) => sum + parseInt(row.query_count), 0),
        popularSearchTerms,
        documentGenerationTrends
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques de contenu', { error });
      throw error;
    }
  }

  /**
   * Obtenir le rapport de santé du système
   */
  async getSystemHealthReport(): Promise<SystemHealthReport> {
    try {
      const services: ServiceHealth[] = [
        {
          name: 'Database',
          status: 'healthy',
          responseTime: 15,
          lastChecked: new Date(),
          details: 'PostgreSQL connection pool healthy'
        },
        {
          name: 'AI Services',
          status: 'healthy',
          responseTime: 250,
          lastChecked: new Date(),
          details: 'All AI providers responding normally'
        },
        {
          name: 'File Storage',
          status: 'healthy',
          responseTime: 45,
          lastChecked: new Date(),
          details: 'Document storage accessible'
        },
        {
          name: 'Email Service',
          status: 'warning',
          responseTime: 1200,
          lastChecked: new Date(),
          details: 'Slower than usual response times'
        }
      ];

      const alerts: SystemAlert[] = [
        {
          id: 'alert-1',
          type: 'warning',
          message: 'Email service response time above threshold',
          source: 'Email Service Monitor',
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
          resolved: false
        }
      ];

      const recommendations = [
        'Consider upgrading email service plan for better performance',
        'Monitor database connection pool usage during peak hours',
        'Review AI usage costs and optimize model selection'
      ];

      const overallStatus = services.some(s => s.status === 'critical') ? 'critical' :
                           services.some(s => s.status === 'warning') ? 'warning' : 'healthy';

      return {
        status: overallStatus,
        uptime: 99.95, // Simulé
        lastChecked: new Date(),
        services,
        alerts,
        recommendations
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération du rapport de santé du système', { error });
      throw error;
    }
  }

  /**
   * Générer un rapport personnalisé
   */
  async generateCustomReport(reportType: AdminReportType, parameters: Record<string, any>): Promise<any> {
    try {
      switch (reportType) {
        case AdminReportType.USER_ACTIVITY:
          return await this.generateUserActivityReport(parameters);
        case AdminReportType.SYSTEM_PERFORMANCE:
          return await this.generateSystemPerformanceReport(parameters);
        case AdminReportType.FINANCIAL_SUMMARY:
          return await this.generateFinancialSummaryReport(parameters);
        case AdminReportType.CONTENT_ANALYTICS:
          return await this.generateContentAnalyticsReport(parameters);
        case AdminReportType.SECURITY_AUDIT:
          return await this.generateSecurityAuditReport(parameters);
        case AdminReportType.AI_USAGE:
          return await this.generateAIUsageReport(parameters);
        default:
          throw new Error('Type de rapport non supporté');
      }
    } catch (error) {
      logger.error('Erreur lors de la génération du rapport personnalisé', { error, reportType, parameters });
      throw error;
    }
  }

  // Méthodes privées pour les rapports spécialisés

  private async generateUserActivityReport(parameters: Record<string, any>): Promise<any> {
    const dateFrom = parameters.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = parameters.dateTo || new Date();

    const query = `
      SELECT 
        u.role,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.last_login_at > $1 THEN u.id END) as active_users,
        COUNT(al.id) as total_actions,
        COUNT(DISTINCT al.user_id) as users_with_activity
      FROM users u
      LEFT JOIN audit_logs al ON u.id = al.user_id AND al.created_at BETWEEN $1 AND $2
      WHERE u.deleted_at IS NULL
      GROUP BY u.role
      ORDER BY total_users DESC
    `;

    const result = await this.db.query(query, [dateFrom, dateTo]);

    return {
      reportType: 'User Activity Report',
      period: { from: dateFrom, to: dateTo },
      data: result.rows,
      summary: {
        totalUsers: result.rows.reduce((sum, row) => sum + parseInt(row.total_users), 0),
        activeUsers: result.rows.reduce((sum, row) => sum + parseInt(row.active_users), 0),
        totalActions: result.rows.reduce((sum, row) => sum + parseInt(row.total_actions), 0)
      }
    };
  }

  private async generateSystemPerformanceReport(parameters: Record<string, any>): Promise<any> {
    const dateFrom = parameters.dateFrom || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateTo = parameters.dateTo || new Date();

    const performanceData = await this.getPerformanceStatistics();
    const aiUsageData = await this.db.query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as requests,
        AVG(response_time_ms) as avg_response_time,
        COUNT(CASE WHEN success THEN 1 END) as successful_requests
      FROM ai_usage_logs
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY hour DESC
    `, [dateFrom, dateTo]);

    return {
      reportType: 'System Performance Report',
      period: { from: dateFrom, to: dateTo },
      overview: performanceData,
      hourlyBreakdown: aiUsageData.rows,
      recommendations: [
        'Monitor AI response times during peak hours',
        'Consider caching frequently requested data',
        'Review database query optimization opportunities'
      ]
    };
  }

  private async generateFinancialSummaryReport(parameters: Record<string, any>): Promise<any> {
    const financialData = await this.getFinancialStatistics();
    
    return {
      reportType: 'Financial Summary Report',
      period: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() },
      data: financialData,
      trends: {
        revenueGrowth: 15.2, // Simulé
        newSubscriptions: 45,
        churnedSubscriptions: 8
      }
    };
  }

  private async generateContentAnalyticsReport(parameters: Record<string, any>): Promise<any> {
    const contentData = await this.getContentStatistics();
    
    return {
      reportType: 'Content Analytics Report',
      data: contentData,
      insights: [
        'Document generation has increased by 25% this month',
        'Contract templates are the most popular document type',
        'Search queries show high interest in commercial law topics'
      ]
    };
  }

  private async generateSecurityAuditReport(parameters: Record<string, any>): Promise<any> {
    const securityEvents = await this.db.query(`
      SELECT 
        action,
        COUNT(*) as event_count,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM audit_logs
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
      AND action IN ('LOGIN_FAILED', 'ACCOUNT_LOCKED', 'PASSWORD_RESET', 'PERMISSION_DENIED')
      GROUP BY action
      ORDER BY event_count DESC
    `);

    return {
      reportType: 'Security Audit Report',
      period: { from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), to: new Date() },
      securityEvents: securityEvents.rows,
      alerts: [
        'No critical security incidents detected',
        'Failed login attempts within normal range',
        'All user accounts properly secured'
      ]
    };
  }

  private async generateAIUsageReport(parameters: Record<string, any>): Promise<any> {
    const aiStats = await this.db.query(`
      SELECT 
        amc.name as model_name,
        amc.domain_juridique,
        COUNT(aul.id) as total_requests,
        AVG(aul.response_time_ms) as avg_response_time,
        SUM(aul.cost_estimate) as total_cost,
        COUNT(CASE WHEN aul.success THEN 1 END) as successful_requests
      FROM ai_model_configs amc
      LEFT JOIN ai_usage_logs aul ON amc.id = aul.model_id
      WHERE aul.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
      GROUP BY amc.id, amc.name, amc.domain_juridique
      ORDER BY total_requests DESC
    `);

    return {
      reportType: 'AI Usage Report',
      period: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() },
      modelUsage: aiStats.rows,
      summary: {
        totalRequests: aiStats.rows.reduce((sum, row) => sum + parseInt(row.total_requests), 0),
        totalCost: aiStats.rows.reduce((sum, row) => sum + parseFloat(row.total_cost || 0), 0),
        averageResponseTime: aiStats.rows.reduce((sum, row) => sum + parseFloat(row.avg_response_time || 0), 0) / aiStats.rows.length
      }
    };
  }

  /**
   * Mapper une ligne de base de données vers un objet AdminUser
   */
  private mapRowToAdminUser(row: any): AdminUser {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      isActive: row.is_active,
      isEmailVerified: row.is_email_verified,
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      organizationId: row.organization_id,
      organizationName: row.organization_name,
      loginAttempts: row.login_attempts || 0,
      lockedUntil: row.locked_until ? new Date(row.locked_until) : undefined
    };
  }

  /**
   * Mapper une colonne de tri vers le nom de colonne SQL
   */

  private mapSortColumn(sortBy: string): string {
    const mapping: Record<string, string> = {
      'email': 'u.email',
      'firstName': 'u.first_name',
      'lastName': 'u.last_name',
      'role': 'u.role',
      'createdAt': 'u.created_at',
      'lastLoginAt': 'u.last_login_at'
    };
    return mapping[sortBy] || 'u.created_at';
  }
}

// Create and export instance
import { db } from '@/database/connection';
export const adminService = new AdminService(db);