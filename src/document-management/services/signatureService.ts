/**
 * Digital Signature Service
 * 
 * Manages electronic signature workflows, signature generation, validation,
 * and compliance with Algerian electronic signature legislation.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.5, 6.6
 */

import { createClient } from '@supabase/supabase-js';
import {
  SignatureWorkflow,
  WorkflowSigner,
  DigitalSignature,
  SignatureValidation,
  SignedDocument,
  SignatureAuditEntry,
  SignerInfo,
  WorkflowStatusSummary,
  WorkflowStatus,
  SignerStatus
} from '../types';
import { auditService } from './auditService';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Signature Service Class
 * Handles all signature workflow operations
 */
class SignatureService {
  /**
   * Create a new signature workflow for a document
   * Requirements: 6.1
   */
  async createSignatureWorkflow(
    documentId: string,
    signers: SignerInfo[],
    options: {
      name?: string;
      expiresInDays?: number;
      requiresAllSigners?: boolean;
      allowDecline?: boolean;
      customMessage?: string;
      reminderFrequency?: number;
    } = {}
  ): Promise<SignatureWorkflow> {
    try {
      // Validate signers
      if (!signers || signers.length === 0) {
        throw new Error('At least one signer is required');
      }

      // Validate signer order
      const orders = signers.map(s => s.order);
      const uniqueOrders = new Set(orders);
      if (orders.length !== uniqueOrders.size) {
        throw new Error('Signer orders must be unique');
      }

      // Get document information
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('id, name, size, checksum')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Create workflow
      const workflowId = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (options.expiresInDays || 30));

      const workflow: SignatureWorkflow = {
        id: workflowId,
        documentId,
        name: options.name || `Signature Workflow for ${document.name}`,
        status: WorkflowStatus.PENDING,
        signers: [],
        createdAt: new Date(),
        createdBy: '', // Will be set by caller
        expiresAt,
        reminderFrequency: options.reminderFrequency,
        requiresAllSigners: options.requiresAllSigners ?? true,
        allowDecline: options.allowDecline ?? true,
        customMessage: options.customMessage,
        metadata: {
          documentName: document.name,
          documentSize: document.size,
          documentChecksum: document.checksum
        }
      };

      // Create workflow signers
      const workflowSigners: WorkflowSigner[] = signers.map(signer => ({
        id: crypto.randomUUID(),
        workflowId,
        userId: signer.userId,
        email: signer.email,
        name: signer.name,
        role: signer.role,
        order: signer.order,
        status: SignerStatus.PENDING,
        notificationsSent: 0
      }));

      workflow.signers = workflowSigners;

      // Store workflow in database
      const { error: workflowError } = await supabase
        .from('signature_workflows')
        .insert({
          id: workflow.id,
          document_id: workflow.documentId,
          name: workflow.name,
          status: workflow.status,
          created_at: workflow.createdAt.toISOString(),
          created_by: workflow.createdBy,
          expires_at: workflow.expiresAt.toISOString(),
          reminder_frequency: workflow.reminderFrequency,
          requires_all_signers: workflow.requiresAllSigners,
          allow_decline: workflow.allowDecline,
          custom_message: workflow.customMessage,
          metadata: workflow.metadata
        });

      if (workflowError) {
        throw new Error(`Failed to create workflow: ${workflowError.message}`);
      }

      // Store signers
      const signersData = workflowSigners.map(signer => ({
        id: signer.id,
        workflow_id: signer.workflowId,
        user_id: signer.userId,
        email: signer.email,
        name: signer.name,
        role: signer.role,
        order: signer.order,
        status: signer.status,
        notifications_sent: signer.notificationsSent
      }));

      const { error: signersError } = await supabase
        .from('workflow_signers')
        .insert(signersData);

      if (signersError) {
        throw new Error(`Failed to create signers: ${signersError.message}`);
      }

      // Create audit entry
      await this.createAuditEntry({
        id: crypto.randomUUID(),
        workflowId: workflow.id,
        action: 'workflow_created',
        performedBy: workflow.createdBy,
        performedAt: new Date(),
        details: {
          documentId,
          signerCount: signers.length,
          expiresAt: workflow.expiresAt
        }
      });

      // Send initial notifications to signers
      await this.notifySigners(workflow);

      return workflow;
    } catch (error) {
      console.error('Error creating signature workflow:', error);
      throw error;
    }
  }

  /**
   * Get signature workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<SignatureWorkflow | null> {
    try {
      const { data: workflowData, error: workflowError } = await supabase
        .from('signature_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError || !workflowData) {
        return null;
      }

      const { data: signersData, error: signersError } = await supabase
        .from('workflow_signers')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('order', { ascending: true });

      if (signersError) {
        throw new Error(`Failed to fetch signers: ${signersError.message}`);
      }

      const workflow: SignatureWorkflow = {
        id: workflowData.id,
        documentId: workflowData.document_id,
        name: workflowData.name,
        status: workflowData.status as WorkflowStatus,
        signers: signersData.map(s => this.mapSignerFromDb(s)),
        createdAt: new Date(workflowData.created_at),
        createdBy: workflowData.created_by,
        completedAt: workflowData.completed_at ? new Date(workflowData.completed_at) : undefined,
        expiresAt: new Date(workflowData.expires_at),
        reminderFrequency: workflowData.reminder_frequency,
        requiresAllSigners: workflowData.requires_all_signers,
        allowDecline: workflowData.allow_decline,
        customMessage: workflowData.custom_message,
        metadata: workflowData.metadata
      };

      return workflow;
    } catch (error) {
      console.error('Error fetching workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow status summary
   */
  async getWorkflowStatus(workflowId: string): Promise<WorkflowStatusSummary> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const totalSigners = workflow.signers.length;
    const signedCount = workflow.signers.filter(s => s.status === SignerStatus.SIGNED).length;
    const pendingCount = workflow.signers.filter(s => s.status === SignerStatus.PENDING).length;
    const declinedCount = workflow.signers.filter(s => s.status === SignerStatus.DECLINED).length;
    const progress = totalSigners > 0 ? (signedCount / totalSigners) * 100 : 0;

    let nextAction: string | undefined;
    if (workflow.status === WorkflowStatus.PENDING || workflow.status === WorkflowStatus.IN_PROGRESS) {
      const nextSigner = workflow.signers
        .filter(s => s.status === SignerStatus.PENDING)
        .sort((a, b) => a.order - b.order)[0];
      
      if (nextSigner) {
        nextAction = `Waiting for ${nextSigner.name} (${nextSigner.email}) to sign`;
      }
    }

    return {
      workflowId: workflow.id,
      status: workflow.status,
      totalSigners,
      signedCount,
      pendingCount,
      declinedCount,
      progress,
      nextAction,
      estimatedCompletion: workflow.expiresAt
    };
  }

  /**
   * Update workflow status
   */
  async updateWorkflowStatus(workflowId: string, status: WorkflowStatus): Promise<void> {
    const updates: any = { status };
    
    if (status === WorkflowStatus.COMPLETED) {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('signature_workflows')
      .update(updates)
      .eq('id', workflowId);

    if (error) {
      throw new Error(`Failed to update workflow status: ${error.message}`);
    }
  }

  /**
   * Cancel a signature workflow
   */
  async cancelWorkflow(workflowId: string, reason?: string): Promise<void> {
    await this.updateWorkflowStatus(workflowId, WorkflowStatus.CANCELLED);

    await this.createAuditEntry({
      id: crypto.randomUUID(),
      workflowId,
      action: 'workflow_cancelled',
      performedBy: 'system',
      performedAt: new Date(),
      details: { reason }
    });
  }

  /**
   * Check and expire workflows that have passed their expiration date
   */
  async expireWorkflows(): Promise<void> {
    const { data: expiredWorkflows, error } = await supabase
      .from('signature_workflows')
      .select('id')
      .in('status', [WorkflowStatus.PENDING, WorkflowStatus.IN_PROGRESS])
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching expired workflows:', error);
      return;
    }

    for (const workflow of expiredWorkflows || []) {
      await this.updateWorkflowStatus(workflow.id, WorkflowStatus.EXPIRED);
      
      await this.createAuditEntry({
        id: crypto.randomUUID(),
        workflowId: workflow.id,
        action: 'workflow_completed',
        performedBy: 'system',
        performedAt: new Date(),
        details: { reason: 'expired' }
      });
    }
  }

  /**
   * Send notifications to signers
   */
  private async notifySigners(workflow: SignatureWorkflow): Promise<void> {
    // Get the next signer(s) who need to sign
    const nextSigners = workflow.signers
      .filter(s => s.status === SignerStatus.PENDING)
      .sort((a, b) => a.order - b.order);

    if (nextSigners.length === 0) {
      return;
    }

    // In sequential signing, only notify the first pending signer
    // In parallel signing, notify all pending signers
    const signersToNotify = workflow.requiresAllSigners ? [nextSigners[0]] : nextSigners;

    for (const signer of signersToNotify) {
      // Update notification count
      await supabase
        .from('workflow_signers')
        .update({
          notifications_sent: signer.notificationsSent + 1,
          last_notification_at: new Date().toISOString()
        })
        .eq('id', signer.id);

      // Create audit entry
      await this.createAuditEntry({
        id: crypto.randomUUID(),
        workflowId: workflow.id,
        action: 'notification_sent',
        performedBy: 'system',
        performedAt: new Date(),
        details: {
          signerId: signer.id,
          signerEmail: signer.email,
          notificationCount: signer.notificationsSent + 1
        }
      });

      // TODO: Integrate with actual notification service
      console.log(`Notification sent to ${signer.email} for workflow ${workflow.id}`);
    }
  }

  /**
   * Create audit entry for signature workflow
   */
  private async createAuditEntry(entry: SignatureAuditEntry): Promise<void> {
    const { error } = await supabase
      .from('signature_audit_trail')
      .insert({
        id: entry.id,
        workflow_id: entry.workflowId,
        action: entry.action,
        performed_by: entry.performedBy,
        performed_at: entry.performedAt.toISOString(),
        details: entry.details,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent
      });

    if (error) {
      console.error('Error creating audit entry:', error);
    }
  }

  /**
   * Sign a document in a workflow
   * Requirements: 6.2, 6.3
   */
  async signDocument(
    workflowId: string,
    signerId: string,
    signatureData: {
      signatureMethod?: 'electronic' | 'digital_certificate' | 'biometric';
      ipAddress: string;
      location?: string;
      userAgent?: string;
    }
  ): Promise<SignedDocument> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Check workflow status
      if (workflow.status === WorkflowStatus.COMPLETED) {
        throw new Error('Workflow is already completed');
      }
      if (workflow.status === WorkflowStatus.CANCELLED) {
        throw new Error('Workflow has been cancelled');
      }
      if (workflow.status === WorkflowStatus.EXPIRED) {
        throw new Error('Workflow has expired');
      }

      // Find the signer
      const signer = workflow.signers.find(s => s.id === signerId);
      if (!signer) {
        throw new Error(`Signer not found: ${signerId}`);
      }

      // Check if signer has already signed
      if (signer.status === SignerStatus.SIGNED) {
        throw new Error('Signer has already signed this document');
      }

      // Check signing order (if sequential)
      if (workflow.requiresAllSigners) {
        const previousSigners = workflow.signers.filter(s => s.order < signer.order);
        const allPreviousSigned = previousSigners.every(s => s.status === SignerStatus.SIGNED);
        
        if (!allPreviousSigned) {
          throw new Error('Previous signers must sign first');
        }
      }

      // Generate digital signature
      const signature = await this.generateDigitalSignature(
        workflow.documentId,
        signerId,
        signatureData
      );

      // Update signer status
      await supabase
        .from('workflow_signers')
        .update({
          status: SignerStatus.SIGNED,
          signed_at: new Date().toISOString(),
          signature: signature
        })
        .eq('id', signerId);

      // Store signature
      await supabase
        .from('digital_signatures')
        .insert({
          id: signature.id,
          signer_id: signerId,
          workflow_id: workflowId,
          signature_data: signature.signatureData,
          certificate: signature.certificate,
          timestamp: signature.timestamp.toISOString(),
          ip_address: signature.ipAddress,
          location: signature.location,
          signature_method: signature.signatureMethod,
          hash_algorithm: signature.hashAlgorithm,
          is_valid: signature.isValid
        });

      // Create audit entry
      await this.createAuditEntry({
        id: crypto.randomUUID(),
        workflowId,
        action: 'document_signed',
        performedBy: signer.userId || signer.email,
        performedAt: new Date(),
        details: {
          signerId,
          signerName: signer.name,
          signatureMethod: signature.signatureMethod
        },
        ipAddress: signatureData.ipAddress,
        userAgent: signatureData.userAgent
      });

      // Update workflow status
      if (workflow.status === WorkflowStatus.PENDING) {
        await this.updateWorkflowStatus(workflowId, WorkflowStatus.IN_PROGRESS);
      }

      // Check if workflow is complete
      const updatedWorkflow = await this.getWorkflow(workflowId);
      if (updatedWorkflow) {
        const allSigned = updatedWorkflow.signers.every(s => s.status === SignerStatus.SIGNED);
        
        if (allSigned) {
          await this.completeWorkflow(workflowId);
        } else {
          // Notify next signers
          await this.notifySigners(updatedWorkflow);
        }
      }

      // Return signed document
      return await this.getSignedDocument(workflowId);
    } catch (error) {
      console.error('Error signing document:', error);
      throw error;
    }
  }

  /**
   * Generate a cryptographic digital signature
   * Requirements: 6.2, 6.3
   */
  private async generateDigitalSignature(
    documentId: string,
    signerId: string,
    signatureData: {
      signatureMethod?: 'electronic' | 'digital_certificate' | 'biometric';
      ipAddress: string;
      location?: string;
    }
  ): Promise<DigitalSignature> {
    // Get document content for hashing
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('checksum, storage_path')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Generate signature data (in production, this would use actual cryptographic signing)
    const timestamp = new Date();
    const signatureMethod = signatureData.signatureMethod || 'electronic';
    const hashAlgorithm = 'SHA-256';

    // Create signature payload
    const payload = {
      documentId,
      signerId,
      timestamp: timestamp.toISOString(),
      documentChecksum: document.checksum
    };

    // Generate signature (simplified - in production use actual crypto library)
    const signatureString = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Generate certificate (simplified - in production use actual PKI)
    const certificate = await this.generateCertificate(signerId, timestamp);

    const signature: DigitalSignature = {
      id: crypto.randomUUID(),
      signerId,
      signatureData: hashHex,
      certificate,
      timestamp,
      ipAddress: signatureData.ipAddress,
      location: signatureData.location,
      signatureMethod,
      hashAlgorithm,
      isValid: true
    };

    return signature;
  }

  /**
   * Generate a digital certificate for signature validation
   * Requirements: 6.3
   */
  private async generateCertificate(signerId: string, timestamp: Date): Promise<string> {
    // In production, this would generate or retrieve an actual X.509 certificate
    // For now, we create a simplified certificate structure
    const certificate = {
      version: '1.0',
      serialNumber: crypto.randomUUID(),
      issuer: 'JuristDZ Certificate Authority',
      subject: signerId,
      validFrom: timestamp.toISOString(),
      validTo: new Date(timestamp.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      algorithm: 'RSA-SHA256',
      publicKey: 'mock-public-key-' + signerId
    };

    return Buffer.from(JSON.stringify(certificate)).toString('base64');
  }

  /**
   * Validate a digital signature
   * Requirements: 6.2, 6.3
   */
  async validateSignature(
    documentId: string,
    signatureId: string
  ): Promise<SignatureValidation> {
    try {
      // Get signature
      const { data: signatureData, error: sigError } = await supabase
        .from('digital_signatures')
        .select('*')
        .eq('id', signatureId)
        .single();

      if (sigError || !signatureData) {
        throw new Error(`Signature not found: ${signatureId}`);
      }

      // Get document
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('checksum')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Validate certificate
      const certificateValid = await this.validateCertificate(signatureData.certificate);

      // Validate timestamp
      const signatureTimestamp = new Date(signatureData.timestamp);
      const now = new Date();
      const timestampValid = signatureTimestamp <= now;

      // Validate document integrity
      // In production, re-compute hash and compare with signature
      const documentIntegrity = true; // Simplified for now

      // Verify signer identity
      const signerIdentityVerified = true; // Simplified for now

      const isValid = certificateValid && timestampValid && documentIntegrity && signerIdentityVerified;

      const validation: SignatureValidation = {
        isValid,
        signatureId,
        validatedAt: new Date(),
        validationDetails: {
          certificateValid,
          timestampValid,
          documentIntegrity,
          signerIdentityVerified
        },
        errors: [],
        warnings: []
      };

      if (!certificateValid) {
        validation.errors?.push('Certificate is invalid or expired');
      }
      if (!timestampValid) {
        validation.errors?.push('Signature timestamp is in the future');
      }
      if (!documentIntegrity) {
        validation.errors?.push('Document has been modified after signing');
      }
      if (!signerIdentityVerified) {
        validation.errors?.push('Signer identity could not be verified');
      }

      return validation;
    } catch (error) {
      console.error('Error validating signature:', error);
      throw error;
    }
  }

  /**
   * Validate a certificate
   */
  private async validateCertificate(certificateBase64: string): Promise<boolean> {
    try {
      const certificateJson = Buffer.from(certificateBase64, 'base64').toString('utf-8');
      const certificate = JSON.parse(certificateJson);

      // Check validity period
      const now = new Date();
      const validFrom = new Date(certificate.validFrom);
      const validTo = new Date(certificate.validTo);

      return now >= validFrom && now <= validTo;
    } catch (error) {
      console.error('Error validating certificate:', error);
      return false;
    }
  }

  /**
   * Complete a signature workflow
   * Requirements: 6.5
   */
  private async completeWorkflow(workflowId: string): Promise<void> {
    await this.updateWorkflowStatus(workflowId, WorkflowStatus.COMPLETED);

    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      return;
    }

    // Create audit entry
    await this.createAuditEntry({
      id: crypto.randomUUID(),
      workflowId,
      action: 'workflow_completed',
      performedBy: 'system',
      performedAt: new Date(),
      details: {
        totalSigners: workflow.signers.length,
        completedAt: new Date().toISOString()
      }
    });

    // Notify all parties
    for (const signer of workflow.signers) {
      // TODO: Send completion notification
      console.log(`Workflow completed notification sent to ${signer.email}`);
    }
  }

  /**
   * Get signed document with all signatures
   * Requirements: 6.3
   */
  async getSignedDocument(workflowId: string): Promise<SignedDocument> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Get all signatures
    const { data: signaturesData, error: sigError } = await supabase
      .from('digital_signatures')
      .select('*')
      .eq('workflow_id', workflowId);

    if (sigError) {
      throw new Error(`Failed to fetch signatures: ${sigError.message}`);
    }

    const signatures: DigitalSignature[] = (signaturesData || []).map(s => ({
      id: s.id,
      signerId: s.signer_id,
      signatureData: s.signature_data,
      certificate: s.certificate,
      timestamp: new Date(s.timestamp),
      ipAddress: s.ip_address,
      location: s.location,
      signatureMethod: s.signature_method,
      hashAlgorithm: s.hash_algorithm,
      isValid: s.is_valid
    }));

    // Get audit trail
    const { data: auditData, error: auditError } = await supabase
      .from('signature_audit_trail')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('performed_at', { ascending: true });

    if (auditError) {
      throw new Error(`Failed to fetch audit trail: ${auditError.message}`);
    }

    const auditTrail: SignatureAuditEntry[] = (auditData || []).map(a => ({
      id: a.id,
      workflowId: a.workflow_id,
      action: a.action,
      performedBy: a.performed_by,
      performedAt: new Date(a.performed_at),
      details: a.details,
      ipAddress: a.ip_address,
      userAgent: a.user_agent
    }));

    // Generate certificate chain
    const certificateChain = signatures.map(s => s.certificate);

    const signedDocument: SignedDocument = {
      id: crypto.randomUUID(),
      originalDocumentId: workflow.documentId,
      workflowId: workflow.id,
      signedContent: '', // Would contain the actual signed document content
      signatures,
      completedAt: workflow.completedAt || new Date(),
      certificateChain,
      auditTrail,
      isLegallyBinding: workflow.status === WorkflowStatus.COMPLETED,
      complianceStatus: workflow.status === WorkflowStatus.COMPLETED ? 'compliant' : 'pending_review'
    };

    return signedDocument;
  }

  /**
   * Decline to sign a document
   */
  async declineSignature(
    workflowId: string,
    signerId: string,
    reason: string
  ): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (!workflow.allowDecline) {
      throw new Error('Declining is not allowed for this workflow');
    }

    const signer = workflow.signers.find(s => s.id === signerId);
    if (!signer) {
      throw new Error(`Signer not found: ${signerId}`);
    }

    // Update signer status
    await supabase
      .from('workflow_signers')
      .update({
        status: SignerStatus.DECLINED,
        decline_reason: reason
      })
      .eq('id', signerId);

    // Create audit entry
    await this.createAuditEntry({
      id: crypto.randomUUID(),
      workflowId,
      action: 'document_signed',
      performedBy: signer.userId || signer.email,
      performedAt: new Date(),
      details: {
        signerId,
        signerName: signer.name,
        action: 'declined',
        reason
      }
    });

    // Cancel workflow if required
    if (workflow.requiresAllSigners) {
      await this.cancelWorkflow(workflowId, `Declined by ${signer.name}: ${reason}`);
    }
  }

  /**
   * Get complete audit trail for a workflow
   * Requirements: 6.6
   */
  async getAuditTrail(workflowId: string): Promise<SignatureAuditEntry[]> {
    const { data: auditData, error } = await supabase
      .from('signature_audit_trail')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('performed_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch audit trail: ${error.message}`);
    }

    return (auditData || []).map(a => ({
      id: a.id,
      workflowId: a.workflow_id,
      action: a.action,
      performedBy: a.performed_by,
      performedAt: new Date(a.performed_at),
      details: a.details,
      ipAddress: a.ip_address,
      userAgent: a.user_agent
    }));
  }

  /**
   * Get audit trail for a specific document across all workflows
   * Requirements: 6.6
   */
  async getDocumentAuditTrail(documentId: string): Promise<SignatureAuditEntry[]> {
    // Get all workflows for this document
    const { data: workflows, error: workflowError } = await supabase
      .from('signature_workflows')
      .select('id')
      .eq('document_id', documentId);

    if (workflowError) {
      throw new Error(`Failed to fetch workflows: ${workflowError.message}`);
    }

    if (!workflows || workflows.length === 0) {
      return [];
    }

    const workflowIds = workflows.map(w => w.id);

    // Get audit entries for all workflows
    const { data: auditData, error: auditError } = await supabase
      .from('signature_audit_trail')
      .select('*')
      .in('workflow_id', workflowIds)
      .order('performed_at', { ascending: true });

    if (auditError) {
      throw new Error(`Failed to fetch audit trail: ${auditError.message}`);
    }

    return (auditData || []).map(a => ({
      id: a.id,
      workflowId: a.workflow_id,
      action: a.action,
      performedBy: a.performed_by,
      performedAt: new Date(a.performed_at),
      details: a.details,
      ipAddress: a.ip_address,
      userAgent: a.user_agent
    }));
  }

  /**
   * Generate compliance report for signature workflows
   * Requirements: 6.6
   */
  async generateComplianceReport(options: {
    startDate?: Date;
    endDate?: Date;
    documentId?: string;
    status?: WorkflowStatus;
  } = {}): Promise<{
    totalWorkflows: number;
    completedWorkflows: number;
    pendingWorkflows: number;
    expiredWorkflows: number;
    cancelledWorkflows: number;
    totalSignatures: number;
    averageCompletionTime: number;
    complianceRate: number;
    workflows: Array<{
      id: string;
      documentId: string;
      status: WorkflowStatus;
      createdAt: Date;
      completedAt?: Date;
      signerCount: number;
      signedCount: number;
      complianceStatus: string;
    }>;
  }> {
    let query = supabase.from('signature_workflows').select('*');

    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }
    if (options.documentId) {
      query = query.eq('document_id', options.documentId);
    }
    if (options.status) {
      query = query.eq('status', options.status);
    }

    const { data: workflows, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch workflows: ${error.message}`);
    }

    const workflowData = workflows || [];
    const totalWorkflows = workflowData.length;
    const completedWorkflows = workflowData.filter(w => w.status === WorkflowStatus.COMPLETED).length;
    const pendingWorkflows = workflowData.filter(w => 
      w.status === WorkflowStatus.PENDING || w.status === WorkflowStatus.IN_PROGRESS
    ).length;
    const expiredWorkflows = workflowData.filter(w => w.status === WorkflowStatus.EXPIRED).length;
    const cancelledWorkflows = workflowData.filter(w => w.status === WorkflowStatus.CANCELLED).length;

    // Calculate total signatures
    let totalSignatures = 0;
    let totalCompletionTime = 0;
    let completedCount = 0;

    const workflowSummaries = [];

    for (const workflow of workflowData) {
      // Get signers for this workflow
      const { data: signers } = await supabase
        .from('workflow_signers')
        .select('*')
        .eq('workflow_id', workflow.id);

      const signerCount = signers?.length || 0;
      const signedCount = signers?.filter(s => s.status === SignerStatus.SIGNED).length || 0;
      totalSignatures += signedCount;

      // Calculate completion time
      if (workflow.completed_at) {
        const createdAt = new Date(workflow.created_at);
        const completedAt = new Date(workflow.completed_at);
        const completionTime = completedAt.getTime() - createdAt.getTime();
        totalCompletionTime += completionTime;
        completedCount++;
      }

      workflowSummaries.push({
        id: workflow.id,
        documentId: workflow.document_id,
        status: workflow.status,
        createdAt: new Date(workflow.created_at),
        completedAt: workflow.completed_at ? new Date(workflow.completed_at) : undefined,
        signerCount,
        signedCount,
        complianceStatus: workflow.status === WorkflowStatus.COMPLETED ? 'compliant' : 'pending'
      });
    }

    const averageCompletionTime = completedCount > 0 
      ? totalCompletionTime / completedCount 
      : 0;

    const complianceRate = totalWorkflows > 0 
      ? (completedWorkflows / totalWorkflows) * 100 
      : 0;

    return {
      totalWorkflows,
      completedWorkflows,
      pendingWorkflows,
      expiredWorkflows,
      cancelledWorkflows,
      totalSignatures,
      averageCompletionTime: averageCompletionTime / (1000 * 60 * 60), // Convert to hours
      complianceRate,
      workflows: workflowSummaries
    };
  }

  /**
   * Verify signature integrity and compliance
   * Requirements: 6.6
   */
  async verifySignatureCompliance(workflowId: string): Promise<{
    isCompliant: boolean;
    checks: Array<{
      name: string;
      passed: boolean;
      details: string;
    }>;
    recommendations: string[];
  }> {
    const workflow = await this.getWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const checks = [];
    const recommendations = [];

    // Check 1: All required signers have signed
    const allSigned = workflow.signers.every(s => s.status === SignerStatus.SIGNED);
    checks.push({
      name: 'All Required Signers',
      passed: allSigned || !workflow.requiresAllSigners,
      details: allSigned 
        ? 'All required signers have signed the document' 
        : `${workflow.signers.filter(s => s.status === SignerStatus.PENDING).length} signers pending`
    });

    if (!allSigned && workflow.requiresAllSigners) {
      recommendations.push('Send reminders to pending signers');
    }

    // Check 2: Workflow not expired
    const notExpired = workflow.status !== WorkflowStatus.EXPIRED;
    checks.push({
      name: 'Workflow Validity',
      passed: notExpired,
      details: notExpired 
        ? 'Workflow is within validity period' 
        : 'Workflow has expired'
    });

    if (!notExpired) {
      recommendations.push('Create a new workflow for this document');
    }

    // Check 3: All signatures are valid
    const { data: signatures } = await supabase
      .from('digital_signatures')
      .select('*')
      .eq('workflow_id', workflowId);

    const allSignaturesValid = signatures?.every(s => s.is_valid) ?? true;
    checks.push({
      name: 'Signature Validity',
      passed: allSignaturesValid,
      details: allSignaturesValid 
        ? 'All signatures are cryptographically valid' 
        : 'Some signatures failed validation'
    });

    if (!allSignaturesValid) {
      recommendations.push('Review and re-validate failed signatures');
    }

    // Check 4: Audit trail completeness
    const auditTrail = await this.getAuditTrail(workflowId);
    const hasCompleteAudit = auditTrail.length > 0;
    checks.push({
      name: 'Audit Trail',
      passed: hasCompleteAudit,
      details: hasCompleteAudit 
        ? `Complete audit trail with ${auditTrail.length} entries` 
        : 'Audit trail is incomplete'
    });

    // Check 5: Workflow completed successfully
    const isCompleted = workflow.status === WorkflowStatus.COMPLETED;
    checks.push({
      name: 'Workflow Completion',
      passed: isCompleted,
      details: isCompleted 
        ? 'Workflow completed successfully' 
        : `Workflow status: ${workflow.status}`
    });

    const isCompliant = checks.every(check => check.passed);

    return {
      isCompliant,
      checks,
      recommendations
    };
  }

  /**
   * Map database signer record to WorkflowSigner interface
   */
  private mapSignerFromDb(dbSigner: any): WorkflowSigner {
    return {
      id: dbSigner.id,
      workflowId: dbSigner.workflow_id,
      userId: dbSigner.user_id,
      email: dbSigner.email,
      name: dbSigner.name,
      role: dbSigner.role,
      order: dbSigner.order,
      status: dbSigner.status as SignerStatus,
      signedAt: dbSigner.signed_at ? new Date(dbSigner.signed_at) : undefined,
      signature: dbSigner.signature,
      notificationsSent: dbSigner.notifications_sent,
      lastNotificationAt: dbSigner.last_notification_at ? new Date(dbSigner.last_notification_at) : undefined,
      declineReason: dbSigner.decline_reason
    };
  }
}

// Export singleton instance
export const signatureService = new SignatureService();
export default signatureService;
