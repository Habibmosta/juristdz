/**
 * Integration Service
 * Wires all services together through API gateway for complete document lifecycle flows
 * Implements cross-service error handling and recovery
 * 
 * Requirements: All - Complete system integration
 */

import { apiGatewayService, ApiRequest, ApiResponse } from './apiGatewayService';
import { serviceOrchestrationService } from './serviceOrchestrationService';
import { documentService } from './documentService';
import { fileUploadService } from './fileUploadService';
import { fileStorageService } from './fileStorageService';
import { versionControlService } from './versionControlService';
import { searchService } from './searchService';
import { templateProcessingService } from './templateProcessingService';
import { workflowService } from './workflowService';
import { signatureService } from './signatureService';
import { accessControlService } from './accessControlService';
import { auditService } from './auditService';
import { Document, DocumentMetadata } from '../types';

export interface DocumentUploadFlow {
  file: File;
  caseId: string;
  metadata: DocumentMetadata;
  userId: string;
}

export interface DocumentUploadResult {
  success: boolean;
  document?: Document;
  error?: string;
  steps: {
    validation: boolean;
    upload: boolean;
    encryption: boolean;
    storage: boolean;
    indexing: boolean;
    audit: boolean;
  };
}

export interface DocumentWorkflowFlow {
  documentId: string;
  workflowType: string;
  participants: string[];
  userId: string;
}

export interface SignatureWorkflowFlow {
  documentId: string;
  signers: Array<{ userId: string; role: string }>;
  initiatorId: string;
}

class IntegrationService {
  /**
   * Complete document upload flow
   * Orchestrates: validation → upload → encryption → storage → indexing → audit
   */
  async completeDocumentUpload(
    flow: DocumentUploadFlow
  ): Promise<DocumentUploadResult> {
    const steps = {
      validation: false,
      upload: false,
      encryption: false,
      storage: false,
      indexing: false,
      audit: false,
    };

    try {
      // Step 1: Validate file
      const validationResult = await serviceOrchestrationService.executeWithRetry(
        'fileValidation',
        async () => {
          const result = await fileUploadService.validateFile(flow.file);
          if (!result.valid) {
            throw new Error(result.errors?.join(', ') || 'Validation failed');
          }
          return result;
        }
      );

      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error,
          steps,
        };
      }
      steps.validation = true;

      // Step 2: Upload and encrypt file
      const uploadResult = await serviceOrchestrationService.executeWithRetry(
        'fileUpload',
        async () => {
          const result = await fileUploadService.uploadFile(flow.file, {
            caseId: flow.caseId,
            userId: flow.userId,
          });
          if (!result.success) {
            throw new Error(result.error || 'Upload failed');
          }
          return result;
        }
      );

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error,
          steps,
        };
      }
      steps.upload = true;
      steps.encryption = true;

      // Step 3: Store in database
      const storageResult = await serviceOrchestrationService.executeWithRetry(
        'documentStorage',
        async () => {
          const document = await documentService.createDocument({
            name: flow.file.name,
            caseId: flow.caseId,
            metadata: flow.metadata,
            size: flow.file.size,
            mimeType: flow.file.type,
            userId: flow.userId,
          });
          return document;
        }
      );

      if (!storageResult.success || !storageResult.data) {
        return {
          success: false,
          error: storageResult.error,
          steps,
        };
      }
      steps.storage = true;

      const document = storageResult.data;

      // Step 4: Index for search
      const indexingResult = await serviceOrchestrationService.executeWithRetry(
        'searchIndexing',
        async () => {
          await searchService.indexDocument(document);
          return true;
        }
      );

      if (indexingResult.success) {
        steps.indexing = true;
      }

      // Step 5: Create audit log
      const auditResult = await serviceOrchestrationService.executeWithRetry(
        'auditLogging',
        async () => {
          await auditService.logActivity({
            userId: flow.userId,
            action: 'document_upload',
            resourceType: 'document',
            resourceId: document.id,
            details: {
              fileName: flow.file.name,
              fileSize: flow.file.size,
              caseId: flow.caseId,
            },
          });
          return true;
        }
      );

      if (auditResult.success) {
        steps.audit = true;
      }

      return {
        success: true,
        document,
        steps,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload flow failed',
        steps,
      };
    }
  }

  /**
   * Complete document workflow flow
   * Orchestrates: workflow creation → participant notification → progress tracking
   */
  async initiateDocumentWorkflow(
    flow: DocumentWorkflowFlow
  ): Promise<{ success: boolean; workflowId?: string; error?: string }> {
    try {
      // Create workflow
      const workflowResult = await serviceOrchestrationService.executeWithRetry(
        'workflowCreation',
        async () => {
          const workflow = await workflowService.createWorkflow({
            documentId: flow.documentId,
            type: flow.workflowType,
            participants: flow.participants,
            createdBy: flow.userId,
          });
          return workflow;
        }
      );

      if (!workflowResult.success || !workflowResult.data) {
        return {
          success: false,
          error: workflowResult.error,
        };
      }

      const workflow = workflowResult.data;

      // Notify participants (non-blocking)
      serviceOrchestrationService.executeWithRetry(
        'participantNotification',
        async () => {
          // Notification logic would go here
          return true;
        }
      );

      // Create audit log
      await auditService.logActivity({
        userId: flow.userId,
        action: 'workflow_initiated',
        resourceType: 'workflow',
        resourceId: workflow.id,
        details: {
          documentId: flow.documentId,
          workflowType: flow.workflowType,
          participantCount: flow.participants.length,
        },
      });

      return {
        success: true,
        workflowId: workflow.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Workflow initiation failed',
      };
    }
  }

  /**
   * Complete signature workflow flow
   * Orchestrates: workflow creation → signer notification → signature collection → completion
   */
  async initiateSignatureWorkflow(
    flow: SignatureWorkflowFlow
  ): Promise<{ success: boolean; workflowId?: string; error?: string }> {
    try {
      // Verify document access
      const accessCheck = await accessControlService.checkDocumentAccess(
        flow.documentId,
        flow.initiatorId,
        'sign'
      );

      if (!accessCheck.hasAccess) {
        return {
          success: false,
          error: 'Insufficient permissions',
        };
      }

      // Create signature workflow
      const workflowResult = await serviceOrchestrationService.executeWithRetry(
        'signatureWorkflow',
        async () => {
          const workflow = await signatureService.createSignatureWorkflow(
            flow.documentId,
            flow.signers.map((s) => ({
              userId: s.userId,
              role: s.role,
              email: '', // Would be fetched from user service
              name: '', // Would be fetched from user service
            }))
          );
          return workflow;
        }
      );

      if (!workflowResult.success || !workflowResult.data) {
        return {
          success: false,
          error: workflowResult.error,
        };
      }

      const workflow = workflowResult.data;

      // Create audit log
      await auditService.logActivity({
        userId: flow.initiatorId,
        action: 'signature_workflow_initiated',
        resourceType: 'signature_workflow',
        resourceId: workflow.id,
        details: {
          documentId: flow.documentId,
          signerCount: flow.signers.length,
        },
      });

      return {
        success: true,
        workflowId: workflow.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signature workflow failed',
      };
    }
  }

  /**
   * Complete document version flow
   * Orchestrates: version creation → comparison → storage → notification
   */
  async createDocumentVersion(
    documentId: string,
    content: Buffer,
    userId: string,
    description?: string
  ): Promise<{ success: boolean; versionId?: string; error?: string }> {
    try {
      // Create version
      const versionResult = await serviceOrchestrationService.executeWithRetry(
        'versionCreation',
        async () => {
          const version = await versionControlService.createVersion({
            documentId,
            content,
            userId,
            description,
          });
          return version;
        }
      );

      if (!versionResult.success || !versionResult.data) {
        return {
          success: false,
          error: versionResult.error,
        };
      }

      const version = versionResult.data;

      // Update search index
      serviceOrchestrationService.executeWithRetry(
        'searchUpdate',
        async () => {
          const document = await documentService.getDocument(documentId);
          if (document) {
            await searchService.updateIndex(document);
          }
          return true;
        }
      );

      // Create audit log
      await auditService.logActivity({
        userId,
        action: 'version_created',
        resourceType: 'document_version',
        resourceId: version.id,
        details: {
          documentId,
          versionNumber: version.versionNumber,
          description,
        },
      });

      return {
        success: true,
        versionId: version.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Version creation failed',
      };
    }
  }

  /**
   * Complete document search flow
   * Orchestrates: search → access control → result filtering → audit
   */
  async searchDocuments(
    query: string,
    userId: string,
    filters?: any
  ): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      // Execute search
      const searchResult = await serviceOrchestrationService.executeWithRetry(
        'documentSearch',
        async () => {
          const results = await searchService.search({
            query,
            filters,
            userId,
          });
          return results;
        }
      );

      if (!searchResult.success || !searchResult.data) {
        return {
          success: false,
          error: searchResult.error,
        };
      }

      // Filter results based on access control
      const filteredResults = await this.filterSearchResults(
        searchResult.data.results,
        userId
      );

      // Create audit log (non-blocking)
      auditService.logActivity({
        userId,
        action: 'document_search',
        resourceType: 'search',
        resourceId: 'search_query',
        details: {
          query,
          resultCount: filteredResults.length,
        },
      });

      return {
        success: true,
        results: filteredResults,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  /**
   * Filter search results based on user access
   */
  private async filterSearchResults(results: any[], userId: string): Promise<any[]> {
    const filtered: any[] = [];

    for (const result of results) {
      const accessCheck = await accessControlService.checkDocumentAccess(
        result.id,
        userId,
        'view'
      );

      if (accessCheck.hasAccess) {
        filtered.push(result);
      }
    }

    return filtered;
  }

  /**
   * Complete template generation flow
   * Orchestrates: template selection → variable filling → document generation → storage
   */
  async generateFromTemplate(
    templateId: string,
    variables: Record<string, any>,
    userId: string,
    caseId: string
  ): Promise<{ success: boolean; documentId?: string; error?: string }> {
    try {
      // Generate document from template
      const generationResult = await serviceOrchestrationService.executeWithRetry(
        'templateGeneration',
        async () => {
          const result = await templateProcessingService.generateDocument(
            templateId,
            variables
          );
          return result;
        }
      );

      if (!generationResult.success || !generationResult.data) {
        return {
          success: false,
          error: generationResult.error,
        };
      }

      const generated = generationResult.data;

      // Store generated document
      const storageResult = await serviceOrchestrationService.executeWithRetry(
        'documentStorage',
        async () => {
          const document = await documentService.createDocument({
            name: generated.name || 'Generated Document',
            caseId,
            metadata: {
              ...generated.metadata,
              generatedFromTemplate: templateId,
            },
            content: generated.content,
            userId,
          });
          return document;
        }
      );

      if (!storageResult.success || !storageResult.data) {
        return {
          success: false,
          error: storageResult.error,
        };
      }

      // Create audit log
      await auditService.logActivity({
        userId,
        action: 'document_generated_from_template',
        resourceType: 'document',
        resourceId: storageResult.data.id,
        details: {
          templateId,
          caseId,
        },
      });

      return {
        success: true,
        documentId: storageResult.data.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Template generation failed',
      };
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: any;
    timestamp: Date;
  }> {
    const orchestrationHealth = serviceOrchestrationService.getSystemHealth();
    const gatewayHealth = await apiGatewayService.healthCheck();

    const overallStatus =
      orchestrationHealth.status === 'unhealthy' || gatewayHealth.status === 'unhealthy'
        ? 'unhealthy'
        : orchestrationHealth.status === 'degraded' || gatewayHealth.status === 'degraded'
        ? 'degraded'
        : 'healthy';

    return {
      status: overallStatus,
      services: {
        orchestration: orchestrationHealth,
        gateway: gatewayHealth,
      },
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();
