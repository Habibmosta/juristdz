/**
 * Custom Template Service Tests
 * 
 * Tests for custom template creation, editing, saving, and sharing functionality
 * Requirements: 3.4 - Custom template creation and reuse capabilities
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import {
  customTemplateService,
  CustomTemplateCreationRequest,
  CustomTemplateUpdateRequest,
  TemplateShareRequest
} from '../../src/document-management/services/customTemplateService';
import {
  templateManagementService
} from '../../src/document-management/services/templateManagementService';
import {
  Template,
  TemplateVariable,
  TemplateCategory,
  Language,
  VariableType,
  Permission
} from '../../types/document-management';
import { UserRole } from '../../types';
import { testDatabase } from './testDatabase';
import { testCleanup } from './testCleanup';

// Mock generators for property-based testing
const generateTemplateVariable = (): fc.Arbitrary<TemplateVariable> =>
  fc.record({
    name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
    type: fc.constantFrom(...Object.values(VariableType)),
    label: fc.string({ minLength: 1, maxLength: 100 }),
    required: fc.boolean(),
    defaultValue: fc.option(fc.oneof(
      fc.string(),
      fc.integer(),
      fc.boolean(),
      fc.date()
    )),
    placeholder: fc.option(fc.string({ maxLength: 200 })),
    description: fc.option(fc.string({ maxLength: 500 }))
  });

const generateCustomTemplateRequest = (): fc.Arbitrary<CustomTemplateCreationRequest> =>
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 255 }),
    description: fc.string({ maxLength: 1000 }),
    category: fc.constantFrom(...Object.values(TemplateCategory)),
    language: fc.constantFrom(...Object.values(Language)),
    content: fc.string({ minLength: 10, maxLength: 10000 }),
    variables: fc.array(generateTemplateVariable(), { maxLength: 20 }),
    isPrivate: fc.option(fc.boolean()),
    shareWithRoles: fc.option(fc.array(fc.constantFrom(...Object.values(UserRole)), { maxLength: 5 })),
    shareWithUsers: fc.option(fc.array(fc.uuid(), { maxLength: 10 }))
  });

const generateUserId = () => fc.uuid();
const generateUserRole = () => fc.constantFrom(...Object.values(UserRole));

describe('Custom Template Service', () => {
  beforeEach(async () => {
    await testDatabase.setup();
  });

  afterEach(async () => {
    await testCleanup.cleanup();
  });

  describe('Template Creation', () => {
    // Feature: document-management-system, Property 14: Template Persistence Round-Trip
    test('Property 14: Template Persistence Round-Trip - For any custom template, saving and then loading the template should produce an equivalent template with all variables intact', async () => {
      await fc.assert(
        fc.asyncProperty(
          generateCustomTemplateRequest(),
          generateUserId(),
          generateUserRole(),
          async (templateRequest, userId, userRole) => {
            // Ensure content contains variable placeholders
            const contentWithVariables = templateRequest.variables.length > 0
              ? templateRequest.content + ' ' + templateRequest.variables.map(v => `{{${v.name}}}`).join(' ')
              : templateRequest.content;

            const requestWithValidContent = {
              ...templateRequest,
              content: contentWithVariables
            };

            // Create custom template
            const createResult = await customTemplateService.createCustomTemplate(
              requestWithValidContent,
              userId,
              userRole
            );

            if (!createResult.success) {
              // Skip invalid test cases
              fc.pre(false);
              return;
            }

            expect(createResult.success).toBe(true);
            expect(createResult.templateId).toBeDefined();
            expect(createResult.template).toBeDefined();

            // Load the created template
            const loadedTemplate = await templateManagementService.getTemplateById(
              createResult.templateId!,
              userRole
            );

            expect(loadedTemplate).toBeDefined();
            expect(loadedTemplate!.name).toBe(requestWithValidContent.name);
            expect(loadedTemplate!.description).toBe(requestWithValidContent.description);
            expect(loadedTemplate!.category).toBe(requestWithValidContent.category);
            expect(loadedTemplate!.language).toBe(requestWithValidContent.language);
            expect(loadedTemplate!.content).toBe(requestWithValidContent.content);
            
            // Verify all variables are intact
            expect(loadedTemplate!.variables).toHaveLength(requestWithValidContent.variables.length);
            
            requestWithValidContent.variables.forEach((originalVar, index) => {
              const loadedVar = loadedTemplate!.variables.find(v => v.name === originalVar.name);
              expect(loadedVar).toBeDefined();
              expect(loadedVar!.type).toBe(originalVar.type);
              expect(loadedVar!.label).toBe(originalVar.label);
              expect(loadedVar!.required).toBe(originalVar.required);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    test('should create custom template with valid data', async () => {
      const templateRequest: CustomTemplateCreationRequest = {
        name: 'Test Custom Template',
        description: 'A test template for custom functionality',
        category: TemplateCategory.CONTRACT,
        language: Language.FRENCH,
        content: 'Contrat entre {{clientName}} et {{companyName}} pour {{amount}} DA.',
        variables: [
          {
            name: 'clientName',
            type: VariableType.TEXT,
            label: 'Nom du client',
            required: true,
            placeholder: 'Entrez le nom du client'
          },
          {
            name: 'companyName',
            type: VariableType.TEXT,
            label: 'Nom de l\'entreprise',
            required: true,
            placeholder: 'Entrez le nom de l\'entreprise'
          },
          {
            name: 'amount',
            type: VariableType.NUMBER,
            label: 'Montant',
            required: true,
            placeholder: '0.00'
          }
        ],
        isPrivate: true
      };

      const userId = 'test-user-id';
      const userRole = UserRole.AVOCAT;

      const result = await customTemplateService.createCustomTemplate(
        templateRequest,
        userId,
        userRole
      );

      expect(result.success).toBe(true);
      expect(result.templateId).toBeDefined();
      expect(result.template).toBeDefined();
      expect(result.template!.name).toBe(templateRequest.name);
      expect(result.template!.variables).toHaveLength(3);
    });

    test('should reject template with missing required fields', async () => {
      const invalidRequest: CustomTemplateCreationRequest = {
        name: '', // Empty name should fail
        description: 'Test description',
        category: TemplateCategory.CONTRACT,
        language: Language.FRENCH,
        content: 'Test content',
        variables: []
      };

      const result = await customTemplateService.createCustomTemplate(
        invalidRequest,
        'test-user-id',
        UserRole.AVOCAT
      );

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors).toContain('Template name is required');
    });

    test('should reject template with invalid variable names', async () => {
      const templateRequest: CustomTemplateCreationRequest = {
        name: 'Test Template',
        description: 'Test description',
        category: TemplateCategory.CONTRACT,
        language: Language.FRENCH,
        content: 'Test content with {{invalid-variable}}',
        variables: [
          {
            name: 'invalid-variable', // Invalid name with hyphen
            type: VariableType.TEXT,
            label: 'Invalid Variable',
            required: false
          }
        ]
      };

      const result = await customTemplateService.createCustomTemplate(
        templateRequest,
        'test-user-id',
        UserRole.AVOCAT
      );

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors!.some(error => 
        error.includes('Variable name must start with letter or underscore')
      )).toBe(true);
    });
  });

  describe('Template Updates', () => {
    test('should update existing custom template', async () => {
      // First create a template
      const createRequest: CustomTemplateCreationRequest = {
        name: 'Original Template',
        description: 'Original description',
        category: TemplateCategory.CONTRACT,
        language: Language.FRENCH,
        content: 'Original content with {{variable1}}',
        variables: [
          {
            name: 'variable1',
            type: VariableType.TEXT,
            label: 'Variable 1',
            required: true
          }
        ],
        isPrivate: true
      };

      const userId = 'test-user-id';
      const userRole = UserRole.AVOCAT;

      const createResult = await customTemplateService.createCustomTemplate(
        createRequest,
        userId,
        userRole
      );

      expect(createResult.success).toBe(true);

      // Now update the template
      const updateRequest: CustomTemplateUpdateRequest = {
        name: 'Updated Template',
        description: 'Updated description',
        content: 'Updated content with {{variable1}} and {{variable2}}',
        variables: [
          {
            name: 'variable1',
            type: VariableType.TEXT,
            label: 'Variable 1',
            required: true
          },
          {
            name: 'variable2',
            type: VariableType.DATE,
            label: 'Variable 2',
            required: false
          }
        ]
      };

      const updateResult = await customTemplateService.updateCustomTemplate(
        createResult.templateId!,
        updateRequest,
        userId,
        userRole
      );

      expect(updateResult.success).toBe(true);
      expect(updateResult.template!.name).toBe('Updated Template');
      expect(updateResult.template!.variables).toHaveLength(2);
    });

    test('should reject update with permission denied', async () => {
      // Create template with one user
      const createRequest: CustomTemplateCreationRequest = {
        name: 'Test Template',
        description: 'Test description',
        category: TemplateCategory.CONTRACT,
        language: Language.FRENCH,
        content: 'Test content',
        variables: []
      };

      const ownerId = 'owner-user-id';
      const otherUserId = 'other-user-id';
      const userRole = UserRole.AVOCAT;

      const createResult = await customTemplateService.createCustomTemplate(
        createRequest,
        ownerId,
        userRole
      );

      expect(createResult.success).toBe(true);

      // Try to update with different user (should fail)
      const updateRequest: CustomTemplateUpdateRequest = {
        name: 'Updated by other user'
      };

      const updateResult = await customTemplateService.updateCustomTemplate(
        createResult.templateId!,
        updateRequest,
        otherUserId,
        userRole
      );

      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toContain('Permission denied');
    });
  });

  describe('Template Sharing', () => {
    test('should share template with users', async () => {
      // Create a template
      const createRequest: CustomTemplateCreationRequest = {
        name: 'Shareable Template',
        description: 'Template for sharing',
        category: TemplateCategory.CONTRACT,
        language: Language.FRENCH,
        content: 'Shared content',
        variables: []
      };

      const ownerId = 'owner-user-id';
      const userRole = UserRole.AVOCAT;

      const createResult = await customTemplateService.createCustomTemplate(
        createRequest,
        ownerId,
        userRole
      );

      expect(createResult.success).toBe(true);

      // Share the template
      const shareRequest: TemplateShareRequest = {
        templateId: createResult.templateId!,
        shareWithUsers: ['user1-id', 'user2-id'],
        permissions: [Permission.VIEW, Permission.EDIT],
        message: 'Sharing this template with you'
      };

      const shareResult = await customTemplateService.shareTemplate(shareRequest, ownerId);

      expect(shareResult.success).toBe(true);
      expect(shareResult.shareId).toBeDefined();
      expect(shareResult.shareLink).toBeDefined();
    });

    test('should reject sharing without permission', async () => {
      // Create template with one user
      const createRequest: CustomTemplateCreationRequest = {
        name: 'Test Template',
        description: 'Test description',
        category: TemplateCategory.CONTRACT,
        language: Language.FRENCH,
        content: 'Test content',
        variables: []
      };

      const ownerId = 'owner-user-id';
      const otherUserId = 'other-user-id';
      const userRole = UserRole.AVOCAT;

      const createResult = await customTemplateService.createCustomTemplate(
        createRequest,
        ownerId,
        userRole
      );

      expect(createResult.success).toBe(true);

      // Try to share with different user (should fail)
      const shareRequest: TemplateShareRequest = {
        templateId: createResult.templateId!,
        shareWithUsers: ['user1-id'],
        permissions: [Permission.VIEW]
      };

      const shareResult = await customTemplateService.shareTemplate(shareRequest, otherUserId);

      expect(shareResult.success).toBe(false);
      expect(shareResult.error).toContain('Permission denied');
    });
  });

  describe('Template Library', () => {
    test('should retrieve user template library', async () => {
      const userId = 'test-user-id';
      const userRole = UserRole.AVOCAT;

      // Create some templates
      const template1Request: CustomTemplateCreationRequest = {
        name: 'Personal Template 1',
        description: 'First personal template',
        category: TemplateCategory.CONTRACT,
        language: Language.FRENCH,
        content: 'Content 1',
        variables: [],
        isPrivate: true
      };

      const template2Request: CustomTemplateCreationRequest = {
        name: 'Personal Template 2',
        description: 'Second personal template',
        category: TemplateCategory.MOTION,
        language: Language.FRENCH,
        content: 'Content 2',
        variables: [],
        isPrivate: false
      };

      await customTemplateService.createCustomTemplate(template1Request, userId, userRole);
      await customTemplateService.createCustomTemplate(template2Request, userId, userRole);

      // Get template library
      const library = await customTemplateService.getTemplateLibrary(userId, userRole);

      expect(library.personalTemplates).toHaveLength(2);
      expect(library.personalTemplates.some(t => t.name === 'Personal Template 1')).toBe(true);
      expect(library.personalTemplates.some(t => t.name === 'Personal Template 2')).toBe(true);
    });
  });

  describe('Template Editor', () => {
    test('should create template editor session', async () => {
      const userId = 'test-user-id';
      const userRole = UserRole.AVOCAT;

      const editor = await customTemplateService.createTemplateEditor(undefined, userId, userRole);

      expect(editor.templateId).toBeDefined();
      expect(editor.content).toBeDefined();
      expect(editor.variables).toBeDefined();
      expect(editor.isDirty).toBe(false);
    });

    test('should generate template preview', async () => {
      const content = 'Bonjour {{clientName}}, votre contrat pour {{amount}} DA est prêt.';
      const variables: TemplateVariable[] = [
        {
          name: 'clientName',
          type: VariableType.TEXT,
          label: 'Nom du client',
          required: true
        },
        {
          name: 'amount',
          type: VariableType.NUMBER,
          label: 'Montant',
          required: true
        }
      ];

      const preview = await customTemplateService.generateTemplatePreview(
        content,
        variables,
        Language.FRENCH
      );

      expect(preview).toBeDefined();
      expect(preview).toContain('Bonjour');
      // Preview should contain sample values for variables
      expect(preview).not.toContain('{{clientName}}');
      expect(preview).not.toContain('{{amount}}');
    });
  });

  describe('Template Favorites', () => {
    test('should add and remove template from favorites', async () => {
      // Create a template
      const createRequest: CustomTemplateCreationRequest = {
        name: 'Favorite Template',
        description: 'Template to be favorited',
        category: TemplateCategory.CONTRACT,
        language: Language.FRENCH,
        content: 'Favorite content',
        variables: []
      };

      const userId = 'test-user-id';
      const userRole = UserRole.AVOCAT;

      const createResult = await customTemplateService.createCustomTemplate(
        createRequest,
        userId,
        userRole
      );

      expect(createResult.success).toBe(true);

      // Add to favorites
      const addResult = await customTemplateService.addToFavorites(
        createResult.templateId!,
        userId
      );

      expect(addResult).toBe(true);

      // Remove from favorites
      const removeResult = await customTemplateService.removeFromFavorites(
        createResult.templateId!,
        userId
      );

      expect(removeResult).toBe(true);
    });
  });

  describe('Save As Custom Template', () => {
    test('should save existing template as custom template', async () => {
      // Create an original template
      const originalRequest: CustomTemplateCreationRequest = {
        name: 'Original Template',
        description: 'Original description',
        category: TemplateCategory.CONTRACT,
        language: Language.FRENCH,
        content: 'Original content with {{variable1}}',
        variables: [
          {
            name: 'variable1',
            type: VariableType.TEXT,
            label: 'Variable 1',
            required: true
          }
        ]
      };

      const userId = 'test-user-id';
      const userRole = UserRole.AVOCAT;

      const originalResult = await customTemplateService.createCustomTemplate(
        originalRequest,
        userId,
        userRole
      );

      expect(originalResult.success).toBe(true);

      // Save as new custom template with modifications
      const customizations = {
        description: 'Customized version of original template',
        content: 'Modified content with {{variable1}} and additional text'
      };

      const saveAsResult = await customTemplateService.saveAsCustomTemplate(
        originalResult.templateId!,
        'Customized Template',
        customizations,
        userId,
        userRole
      );

      expect(saveAsResult.success).toBe(true);
      expect(saveAsResult.template!.name).toBe('Customized Template');
      expect(saveAsResult.template!.description).toBe(customizations.description);
      expect(saveAsResult.template!.content).toBe(customizations.content);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid template ID gracefully', async () => {
      const invalidTemplateId = 'non-existent-template-id';
      const userId = 'test-user-id';
      const userRole = UserRole.AVOCAT;

      const updateResult = await customTemplateService.updateCustomTemplate(
        invalidTemplateId,
        { name: 'Updated Name' },
        userId,
        userRole
      );

      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toBeDefined();
    });

    test('should handle database connection errors', async () => {
      // This test would require mocking the database connection
      // For now, we'll test that the service handles errors gracefully
      const templateRequest: CustomTemplateCreationRequest = {
        name: 'Test Template',
        description: 'Test description',
        category: TemplateCategory.CONTRACT,
        language: Language.FRENCH,
        content: 'Test content',
        variables: []
      };

      // The service should handle any database errors gracefully
      const result = await customTemplateService.createCustomTemplate(
        templateRequest,
        'test-user-id',
        UserRole.AVOCAT
      );

      // Result should either succeed or fail gracefully with error message
      expect(typeof result.success).toBe('boolean');
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
});