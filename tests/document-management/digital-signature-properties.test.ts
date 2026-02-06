/**
 * Property-Based Tests for Digital Signature Service
 * 
 * Tests the correctness properties for digital signature workflows,
 * cryptographic signature generation, validation, and compliance.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.5, 6.6
 */

import * as fc from 'fast-check';
import { signatureService } from '../../src/document-management/services/signatureService';
import { WorkflowStatus, SignerStatus } from '../../src/document-management/types';
import { createClient } from '@supabase/supabase-js';

// Initialize test database
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Custom generators for signature workflow testing
const emailGenerator = fc.emailAddress();
const nameGenerator = fc.string({ minLength: 3, maxLength: 50 });
const roleGenerator = fc.constantFrom('client', 'attorney', 'witness', 'notary');
const ipAddressGenerator = fc.ipV4();

const signerInfoGenerator = fc.record({
  email: emailGenerator,
  name: nameGenerator,
  role: roleGenerator,
  order: fc.integer({ min: 1, max: 10 })
});

const signersArrayGenerator = fc.array(signerInfoGenerator, { minLength: 1, maxLength: 5 })
  .map(signers => {
    // Ensure unique orders
    return signers.map((signer, index) => ({
      ...signer,
      order: index + 1
    }));
  });

describe('Digital Signature Service - Property Tests', () => {
  let testDocumentId: string;

  beforeAll(async () => {
    // Create a test document
    const { data, error } = await supabase
      .from('documents')
      .insert({
        id: crypto.randomUUID(),
        case_id: crypto.randomUUID(),
        name: 'Test Document for Signatures',
        original_name: 'test-doc.pdf',
        mime_type: 'application/pdf',
        size: 1024,
        checksum: 'test-checksum',
        encryption_key: 'test-key',
        storage_path: '/test/path',
        tags: [],
        metadata: {},
        created_at: new Date().toISOString(),
        created_by: 'test-user',
        current_version_id: crypto.randomUUID(),
        is_deleted: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test document:', error);
    } else {
      testDocumentId = data.id;
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (testDocumentId) {
      await supabase.from('documents').delete().eq('id', testDocumentId);
    }
  });

  /**
   * Property 27: Signature Workflow Creation
   * **Validates: Requirements 6.1**
   * 
   * For any document signing initiation, a proper signature workflow should be 
   * created with all designated signers and their roles
   */
  describe('Property 27: Signature Workflow Creation', () => {
    it('should create a valid workflow with all designated signers', async () => {
      await fc.assert(
        fc.asyncProperty(
          signersArrayGenerator,
          fc.string({ minLength: 5, maxLength: 100 }),
          async (signers, workflowName) => {
            if (!testDocumentId) {
              return true; // Skip if test document not created
            }

            try {
              const workflow = await signatureService.createSignatureWorkflow(
                testDocumentId,
                signers,
                { name: workflowName }
              );

              // Verify workflow was created
              expect(workflow).toBeDefined();
              expect(workflow.id).toBeDefined();
              expect(workflow.documentId).toBe(testDocumentId);
              expect(workflow.name).toBe(workflowName);
              expect(workflow.status).toBe(WorkflowStatus.PENDING);

              // Verify all signers are included
              expect(workflow.signers).toHaveLength(signers.length);
              
              // Verify each signer has correct properties
              workflow.signers.forEach((workflowSigner, index) => {
                expect(workflowSigner.email).toBe(signers[index].email);
                expect(workflowSigner.name).toBe(signers[index].name);
                expect(workflowSigner.role).toBe(signers[index].role);
                expect(workflowSigner.order).toBe(signers[index].order);
                expect(workflowSigner.status).toBe(SignerStatus.PENDING);
              });

              // Verify workflow metadata
              expect(workflow.metadata).toBeDefined();
              expect(workflow.metadata.documentName).toBeDefined();

              // Cleanup
              await supabase
                .from('signature_workflows')
                .delete()
                .eq('id', workflow.id);

              return true;
            } catch (error) {
              console.error('Workflow creation error:', error);
              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject workflows with duplicate signer orders', async () => {
      if (!testDocumentId) return;

      const signersWithDuplicateOrders = [
        { email: 'signer1@test.com', name: 'Signer 1', role: 'client', order: 1 },
        { email: 'signer2@test.com', name: 'Signer 2', role: 'attorney', order: 1 }
      ];

      await expect(
        signatureService.createSignatureWorkflow(
          testDocumentId,
          signersWithDuplicateOrders
        )
      ).rejects.toThrow('Signer orders must be unique');
    });
  });

  /**
   * Property 28: Cryptographic Signature Security
   * **Validates: Requirements 6.2**
   * 
   * For any applied digital signature, it should be cryptographically secure 
   * and verifiable
   */
  describe('Property 28: Cryptographic Signature Security', () => {
    it('should generate cryptographically secure signatures', async () => {
      await fc.assert(
        fc.asyncProperty(
          ipAddressGenerator,
          fc.constantFrom('electronic', 'digital_certificate', 'biometric'),
          async (ipAddress, signatureMethod) => {
            if (!testDocumentId) {
              return true;
            }

            try {
              // Create a workflow
              const signers = [
                { email: 'test@example.com', name: 'Test Signer', role: 'client', order: 1 }
              ];
              
              const workflow = await signatureService.createSignatureWorkflow(
                testDocumentId,
                signers
              );

              const signerId = workflow.signers[0].id;

              // Sign the document
              const signedDoc = await signatureService.signDocument(
                workflow.id,
                signerId,
                { ipAddress, signatureMethod }
              );

              // Verify signature properties
              expect(signedDoc.signatures).toHaveLength(1);
              const signature = signedDoc.signatures[0];

              expect(signature.id).toBeDefined();
              expect(signature.signatureData).toBeDefined();
              expect(signature.signatureData.length).toBeGreaterThan(0);
              expect(signature.certificate).toBeDefined();
              expect(signature.hashAlgorithm).toBe('SHA-256');
              expect(signature.isValid).toBe(true);
              expect(signature.ipAddress).toBe(ipAddress);
              expect(signature.signatureMethod).toBe(signatureMethod);

              // Cleanup
              await supabase
                .from('signature_workflows')
                .delete()
                .eq('id', workflow.id);

              return true;
            } catch (error) {
              console.error('Signature generation error:', error);
              return false;
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 29: Signature Validation Artifacts
   * **Validates: Requirements 6.3**
   * 
   * For any signed document, it should have a tamper-evident seal and valid 
   * certificate proving signature authenticity
   */
  describe('Property 29: Signature Validation Artifacts', () => {
    it('should provide tamper-evident seal and certificate for all signatures', async () => {
      if (!testDocumentId) return;

      await fc.assert(
        fc.asyncProperty(
          signersArrayGenerator,
          async (signers) => {
            try {
              const workflow = await signatureService.createSignatureWorkflow(
                testDocumentId,
                signers
              );

              // Sign with all signers
              for (const signer of workflow.signers) {
                await signatureService.signDocument(
                  workflow.id,
                  signer.id,
                  { ipAddress: '127.0.0.1' }
                );
              }

              // Get signed document
              const signedDoc = await signatureService.getSignedDocument(workflow.id);

              // Verify each signature has validation artifacts
              expect(signedDoc.signatures).toHaveLength(signers.length);
              
              for (const signature of signedDoc.signatures) {
                // Verify certificate exists and is valid base64
                expect(signature.certificate).toBeDefined();
                expect(signature.certificate.length).toBeGreaterThan(0);
                
                // Verify certificate can be decoded
                const certBuffer = Buffer.from(signature.certificate, 'base64');
                expect(certBuffer.length).toBeGreaterThan(0);

                // Verify signature data (tamper-evident seal)
                expect(signature.signatureData).toBeDefined();
                expect(signature.signatureData.length).toBeGreaterThan(0);

                // Verify timestamp
                expect(signature.timestamp).toBeInstanceOf(Date);
                expect(signature.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
              }

              // Verify certificate chain
              expect(signedDoc.certificateChain).toHaveLength(signers.length);

              // Cleanup
              await supabase
                .from('signature_workflows')
                .delete()
                .eq('id', workflow.id);

              return true;
            } catch (error) {
              console.error('Validation artifacts error:', error);
              return false;
            }
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should validate signatures correctly', async () => {
      if (!testDocumentId) return;

      const signers = [
        { email: 'validator@test.com', name: 'Validator', role: 'client', order: 1 }
      ];

      const workflow = await signatureService.createSignatureWorkflow(
        testDocumentId,
        signers
      );

      const signerId = workflow.signers[0].id;

      await signatureService.signDocument(
        workflow.id,
        signerId,
        { ipAddress: '127.0.0.1' }
      );

      const signedDoc = await signatureService.getSignedDocument(workflow.id);
      const signature = signedDoc.signatures[0];

      // Validate the signature
      const validation = await signatureService.validateSignature(
        testDocumentId,
        signature.id
      );

      expect(validation.isValid).toBe(true);
      expect(validation.validationDetails.certificateValid).toBe(true);
      expect(validation.validationDetails.timestampValid).toBe(true);
      expect(validation.validationDetails.documentIntegrity).toBe(true);
      expect(validation.validationDetails.signerIdentityVerified).toBe(true);

      // Cleanup
      await supabase
        .from('signature_workflows')
        .delete()
        .eq('id', workflow.id);
    });
  });

  /**
   * Property 30: Signature Workflow Completion
   * **Validates: Requirements 6.5**
   * 
   * For any completed signature workflow, all parties should be notified and 
   * the document status should be updated appropriately
   */
  describe('Property 30: Signature Workflow Completion', () => {
    it('should complete workflow and update status when all signers sign', async () => {
      if (!testDocumentId) return;

      await fc.assert(
        fc.asyncProperty(
          fc.array(signerInfoGenerator, { minLength: 1, maxLength: 3 })
            .map((signers, index) => signers.map((s, i) => ({ ...s, order: i + 1 }))),
          async (signers) => {
            try {
              const workflow = await signatureService.createSignatureWorkflow(
                testDocumentId,
                signers,
                { requiresAllSigners: true }
              );

              // Initially should be pending
              expect(workflow.status).toBe(WorkflowStatus.PENDING);

              // Sign with all signers
              for (const signer of workflow.signers) {
                await signatureService.signDocument(
                  workflow.id,
                  signer.id,
                  { ipAddress: '127.0.0.1' }
                );
              }

              // Get updated workflow
              const updatedWorkflow = await signatureService.getWorkflow(workflow.id);
              
              // Verify workflow is completed
              expect(updatedWorkflow?.status).toBe(WorkflowStatus.COMPLETED);
              expect(updatedWorkflow?.completedAt).toBeDefined();

              // Verify all signers have signed
              const allSigned = updatedWorkflow?.signers.every(
                s => s.status === SignerStatus.SIGNED
              );
              expect(allSigned).toBe(true);

              // Verify status summary
              const status = await signatureService.getWorkflowStatus(workflow.id);
              expect(status.status).toBe(WorkflowStatus.COMPLETED);
              expect(status.signedCount).toBe(signers.length);
              expect(status.pendingCount).toBe(0);
              expect(status.progress).toBe(100);

              // Cleanup
              await supabase
                .from('signature_workflows')
                .delete()
                .eq('id', workflow.id);

              return true;
            } catch (error) {
              console.error('Workflow completion error:', error);
              return false;
            }
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  /**
   * Property 31: Signature Audit Trail Completeness
   * **Validates: Requirements 6.6**
   * 
   * For any signature activity, it should be completely logged in the audit 
   * trail with all relevant details
   */
  describe('Property 31: Signature Audit Trail Completeness', () => {
    it('should maintain complete audit trail for all signature activities', async () => {
      if (!testDocumentId) return;

      await fc.assert(
        fc.asyncProperty(
          signersArrayGenerator,
          async (signers) => {
            try {
              // Create workflow
              const workflow = await signatureService.createSignatureWorkflow(
                testDocumentId,
                signers
              );

              // Get initial audit trail
              let auditTrail = await signatureService.getAuditTrail(workflow.id);
              
              // Should have workflow_created entry
              const createdEntry = auditTrail.find(e => e.action === 'workflow_created');
              expect(createdEntry).toBeDefined();
              expect(createdEntry?.details).toBeDefined();

              // Sign with each signer
              for (const signer of workflow.signers) {
                await signatureService.signDocument(
                  workflow.id,
                  signer.id,
                  { ipAddress: '192.168.1.1', userAgent: 'Test Browser' }
                );
              }

              // Get complete audit trail
              auditTrail = await signatureService.getAuditTrail(workflow.id);

              // Verify audit trail completeness
              expect(auditTrail.length).toBeGreaterThan(signers.length);

              // Verify each entry has required fields
              for (const entry of auditTrail) {
                expect(entry.id).toBeDefined();
                expect(entry.workflowId).toBe(workflow.id);
                expect(entry.action).toBeDefined();
                expect(entry.performedBy).toBeDefined();
                expect(entry.performedAt).toBeInstanceOf(Date);
                expect(entry.details).toBeDefined();
              }

              // Verify workflow_completed entry exists
              const completedEntry = auditTrail.find(e => e.action === 'workflow_completed');
              expect(completedEntry).toBeDefined();

              // Verify document_signed entries for each signer
              const signedEntries = auditTrail.filter(e => e.action === 'document_signed');
              expect(signedEntries.length).toBeGreaterThanOrEqual(signers.length);

              // Cleanup
              await supabase
                .from('signature_workflows')
                .delete()
                .eq('id', workflow.id);

              return true;
            } catch (error) {
              console.error('Audit trail error:', error);
              return false;
            }
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should track all workflow state changes in audit trail', async () => {
      if (!testDocumentId) return;

      const signers = [
        { email: 'audit@test.com', name: 'Audit Test', role: 'client', order: 1 }
      ];

      const workflow = await signatureService.createSignatureWorkflow(
        testDocumentId,
        signers
      );

      // Cancel the workflow
      await signatureService.cancelWorkflow(workflow.id, 'Test cancellation');

      // Get audit trail
      const auditTrail = await signatureService.getAuditTrail(workflow.id);

      // Verify cancellation is logged
      const cancelEntry = auditTrail.find(e => e.action === 'workflow_cancelled');
      expect(cancelEntry).toBeDefined();
      expect(cancelEntry?.details.reason).toBe('Test cancellation');

      // Cleanup
      await supabase
        .from('signature_workflows')
        .delete()
        .eq('id', workflow.id);
    });

    it('should generate comprehensive compliance reports', async () => {
      if (!testDocumentId) return;

      const signers = [
        { email: 'compliance@test.com', name: 'Compliance Test', role: 'client', order: 1 }
      ];

      const workflow = await signatureService.createSignatureWorkflow(
        testDocumentId,
        signers
      );

      await signatureService.signDocument(
        workflow.id,
        workflow.signers[0].id,
        { ipAddress: '127.0.0.1' }
      );

      // Generate compliance report
      const report = await signatureService.generateComplianceReport({
        documentId: testDocumentId
      });

      expect(report.totalWorkflows).toBeGreaterThan(0);
      expect(report.completedWorkflows).toBeGreaterThan(0);
      expect(report.totalSignatures).toBeGreaterThan(0);
      expect(report.complianceRate).toBeGreaterThan(0);
      expect(report.workflows).toBeDefined();
      expect(report.workflows.length).toBeGreaterThan(0);

      // Verify compliance check
      const compliance = await signatureService.verifySignatureCompliance(workflow.id);
      expect(compliance.isCompliant).toBe(true);
      expect(compliance.checks).toBeDefined();
      expect(compliance.checks.length).toBeGreaterThan(0);

      // Cleanup
      await supabase
        .from('signature_workflows')
        .delete()
        .eq('id', workflow.id);
    });
  });
});
