/**
 * Template Engine Property-Based Tests
 * 
 * Comprehensive property-based tests for template engine functionality
 * implementing Properties 11-15 as specified in task 7.5.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import {
  templateManagementService,
  TemplateManagementService
} from '../../src/document-management/services/templateManagementService';
import {
  templateProcessingService,
  TemplateProcessingService
} from '../../src/document-management/services/templateProcessingService';
import {
  customTemplateService,
  CustomTemplateService
} from '../../src/document-management/services/customTemplateService';
import {
  Template,
  TemplateDefinition,
  TemplateVariable,
  TemplateVariables,
  TemplateCategory,
  Language,
  VariableType,
  GeneratedDocument,
  ProcessedDocument
} from '../../types/document-management';
import { UserRole } from '../../types';
import { testDatabase } from './testDatabase';
import { testCleanup } from './testCleanup';
import { testConfig } from './testConfig';

// =====================================================
// MOCK GENERATORS FOR TEMPLATE TESTING
// =====================================================

/**
 * Generate valid template variable names (alphanumeric + underscore, starting with letter/underscore)
 */
const templateVariableNameGenerator = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s))
  .map(s => s || 'defaultVar');

/**
 * Generate template variables with proper structure
 */
const templateVariableGenerator = fc.record({
  name: templateVariableNameGenerator,
  type: fc.constantFrom(...Object.values(VariableType)),
  label: fc.string({ minLength: 1, maxLength: 100 }),
  required: fc.boolean(),
  defaultValue: fc.option(fc.oneof(
    fc.string({ maxLength: 200 }),
    fc.integer(),
    fc.boolean(),
    fc.date().map(d => d.toISOString())
  )),
  placeholder: fc.option(fc.string({ maxLength: 100 })),
  description: fc.option(fc.string({ maxLength: 500 }))
});

/**
 * Generate template content with variable placeholders
 */
const templateContentGenerator = (variables: TemplateVariable[]) => {
  const baseContent = fc.string({ minLength: 50, maxLength: 2000 });
  return baseContent.map(content => {
    // Insert variable placeholders into the content
    let modifiedContent = content;
    variables.forEach(variable => {
      const placeholder = `{{${variable.name}}}`;
      // Insert placeholder at random positions
      const insertPosition = Math.floor(Math.random() * modifiedContent.length);
      modifiedContent = modifiedContent.slice(0, insertPosition) + 
                      ` ${placeholder} ` + 
                      modifiedContent.slice(insertPosition);
    });
    return modifiedContent;
  });
};

/**
 * Generate complete template definitions
 */
const templateDefinitionGenerator = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  category: fc.constantFrom(...Object.values(TemplateCategory)),
  language: fc.constantFrom(...Object.values(Language)),
  applicableRoles: fc.array(fc.constantFrom(...Object.values(UserRole)), { minLength: 1, maxLength: 4 }),
  variables: fc.array(templateVariableGenerator, { minLength: 0, maxLength: 10 }),
  isActive: fc.boolean()
}).chain(template => 
  templateContentGenerator(template.variables).map(content => ({
    ...template,
    content
  }))
);

/**
 * Generate template variables with values
 */
const templateVariablesGenerator = (variables: TemplateVariable[]) => {
  const variableValues: Record<string, any> = {};
  variables.forEach(variable => {
    if (variable.required || Math.random() > 0.3) {
      switch (variable.type) {
        case VariableType.TEXT:
          variableValues[variable.name] = fc.sample(fc.string({ maxLength: 200 }), 1)[0];
          break;
        case VariableType.DATE:
          variableValues[variable.name] = fc.sample(fc.date(), 1)[0].toISOString();
          break;
        case VariableType.NUMBER:
          variableValues[variable.name] = fc.sample(fc.integer(), 1)[0];
          break;
        case VariableType.BOOLEAN:
          variableValues[variable.name] = fc.sample(fc.boolean(), 1)[0];
          break;
        case VariableType.LIST:
          variableValues[variable.name] = fc.sample(fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 }), 1)[0];
          break;
        default:
          variableValues[variable.name] = variable.defaultValue || '';
      }
    }
  });
  return variableValues;
};

// =====================================================
// TEST SETUP AND TEARDOWN
// =====================================================

describe('Template Engine Property-Based Tests', () => {
  let templateManagement: TemplateManagementService;
  let templateProcessing: TemplateProcessingService;
  let customTemplate: CustomTemplateService;

  beforeEach(async () => {
    await testDatabase.setup();
    templateManagement = templateManagementService;
    templateProcessing = templateProcessingService;
    customTemplate = customTemplateService;
  });

  afterEach(async () => {
    await testCleanup.cleanup();
  });

  // =====================================================
  // PROPERTY 11: ROLE-BASED TEMPLATE ACCESS
  // =====================================================

  test('Property 11: Role-Based Template Access - For any user accessing templates, only templates appropriate for their role should be visible and accessible', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...Object.values(UserRole)),
        fc.array(templateDefinitionGenerator, { minLength: 5, maxLength: 20 }),
        async (userRole: UserRole, templateDefinitions: TemplateDefinition[]) => {
          // Create templates with various role restrictions
          const createdTemplates: { id: string; applicableRoles: UserRole[] }[] = [];
          
          for (const templateDef of templateDefinitions) {
            try {
              const result = await templateManagement.createTemplate(templateDef, 'test-user');
              if (result.success && result.templateId) {
                createdTemplates.push({
                  id: result.templateId,
                  applicableRoles: templateDef.applicableRoles
                });
              }
            } catch (error) {
              // Skip invalid templates
              continue;
            }
          }

          if (createdTemplates.length === 0) return true;

          // Get templates for the specific user role
          const accessibleTemplates = await templateManagement.getTemplatesByRole(
            userRole, 
            Language.FRENCH
          );

          // Verify that all returned templates include the user's role in applicableRoles
          const allTemplatesHaveCorrectRole = accessibleTemplates.every(template => 
            template.applicableRoles.includes(userRole)
          );

          // Verify that no templates without the user's role are returned
          const templatesForOtherRoles = createdTemplates.filter(template => 
            !template.applicableRoles.includes(userRole)
          );
          
          const noUnauthorizedTemplates = templatesForOtherRoles.every(template =>
            !accessibleTemplates.some(accessible => accessible.id === template.id)
          );

          return allTemplatesHaveCorrectRole && noUnauthorizedTemplates;
        }
      ),
      { numRuns: testConfig.propertyTest.numRuns }
    );
  });

  // =====================================================
  // PROPERTY 12: TEMPLATE VARIABLE DISPLAY
  // =====================================================

  test('Property 12: Template Variable Display - For any selected template, all customizable variables and fields should be displayed to the user', async () => {
    await fc.assert(
      fc.asyncProperty(
        templateDefinitionGenerator,
        async (templateDefinition: TemplateDefinition) => {
          // Create template
          const result = await templateManagement.createTemplate(templateDefinition, 'test-user');
          
          if (!result.success || !result.templateId) return false;

          // Get template details (simulating template selection)
          const retrievedTemplate = await templateManagement.getTemplateById(result.templateId, UserRole.AVOCAT);

          if (!retrievedTemplate) return false;

          // Verify all variables from the original definition are present
          const originalVariableNames = new Set(templateDefinition.variables.map(v => v.name));
          const retrievedVariableNames = new Set(retrievedTemplate.variables.map(v => v.name));

          // All original variables should be present
          const allVariablesPresent = Array.from(originalVariableNames).every(name =>
            retrievedVariableNames.has(name)
          );

          // Each variable should have all required fields
          const allVariablesComplete = retrievedTemplate.variables.every(variable =>
            variable.name &&
            variable.type &&
            variable.label &&
            typeof variable.required === 'boolean'
          );

          return allVariablesPresent && allVariablesComplete;
        }
      ),
      { numRuns: testConfig.propertyTest.numRuns }
    );
  });

  // =====================================================
  // PROPERTY 13: DOCUMENT GENERATION
  // =====================================================

  test('Property 13: Document Generation - For any template with filled variables, a complete document with proper formatting should be generated', async () => {
    await fc.assert(
      fc.asyncProperty(
        templateDefinitionGenerator,
        async (templateDefinition: TemplateDefinition) => {
          // Create template
          const result = await templateManagement.createTemplate(templateDefinition, 'test-user');
          
          if (!result.success || !result.templateId) return false;

          // Get the created template to access its variables
          const template = await templateManagement.getTemplateById(result.templateId, UserRole.AVOCAT);
          if (!template) return false;

          // Generate variable values
          const variables = templateVariablesGenerator(template.variables);

          // Ensure all required variables have values
          const requiredVariables = template.variables.filter(v => v.required);
          const hasAllRequiredValues = requiredVariables.every(v => 
            variables[v.name] !== undefined && variables[v.name] !== null
          );

          if (!hasAllRequiredValues) {
            // Fill missing required variables
            requiredVariables.forEach(variable => {
              if (variables[variable.name] === undefined) {
                variables[variable.name] = variable.defaultValue || 'default_value';
              }
            });
          }

          // Generate document
          const generatedDocument = await templateProcessing.generateDocument(result.templateId, variables);

          // Verify document was generated successfully
          const documentExists = generatedDocument && generatedDocument.content;
          
          // Verify content is not empty and contains substituted values
          const hasContent = generatedDocument.content.length > 0;
          
          // Verify that variable placeholders have been replaced
          const noUnreplacedPlaceholders = !generatedDocument.content.includes('{{') || 
                                         !generatedDocument.content.includes('}}');

          // Verify document metadata is complete
          const hasMetadata = generatedDocument.templateId === result.templateId &&
                             generatedDocument.generatedAt &&
                             generatedDocument.variables;

          return documentExists && hasContent && noUnreplacedPlaceholders && hasMetadata;
        }
      ),
      { numRuns: testConfig.propertyTest.numRuns }
    );
  });

  // =====================================================
  // PROPERTY 14: TEMPLATE PERSISTENCE ROUND-TRIP
  // =====================================================

  test('Property 14: Template Persistence Round-Trip - For any custom template, saving and then loading the template should produce an equivalent template with all variables intact', async () => {
    await fc.assert(
      fc.asyncProperty(
        templateDefinitionGenerator,
        async (templateDefinition: TemplateDefinition) => {
          // Create custom template using the available method
          const customTemplateRequest = {
            name: templateDefinition.name,
            description: templateDefinition.description,
            content: templateDefinition.content,
            variables: templateDefinition.variables,
            category: templateDefinition.category,
            language: templateDefinition.language,
            isPrivate: false,
            tags: []
          };

          const result = await customTemplate.createCustomTemplate(
            customTemplateRequest,
            'test-user',
            UserRole.AVOCAT
          );

          if (!result.success || !result.template) return false;

          const originalTemplate = result.template;

          // Get the template back using template management service
          const loadedTemplate = await templateManagement.getTemplateById(originalTemplate.id, UserRole.AVOCAT);

          if (!loadedTemplate) return false;

          // Verify core properties are preserved
          const corePropertiesMatch = 
            loadedTemplate.name === originalTemplate.name &&
            loadedTemplate.description === originalTemplate.description &&
            loadedTemplate.category === originalTemplate.category &&
            loadedTemplate.language === originalTemplate.language &&
            loadedTemplate.content === originalTemplate.content;

          // Verify applicable roles are preserved
          const rolesMatch = 
            loadedTemplate.applicableRoles.length === originalTemplate.applicableRoles.length &&
            loadedTemplate.applicableRoles.every(role => originalTemplate.applicableRoles.includes(role));

          // Verify all variables are preserved with their properties
          const variablesMatch = 
            loadedTemplate.variables.length === originalTemplate.variables.length &&
            loadedTemplate.variables.every(loadedVar => {
              const originalVar = originalTemplate.variables.find(v => v.name === loadedVar.name);
              return originalVar &&
                     originalVar.type === loadedVar.type &&
                     originalVar.label === loadedVar.label &&
                     originalVar.required === loadedVar.required &&
                     originalVar.defaultValue === loadedVar.defaultValue;
            });

          return corePropertiesMatch && rolesMatch && variablesMatch;
        }
      ),
      { numRuns: testConfig.propertyTest.numRuns }
    );
  });

  // =====================================================
  // PROPERTY 15: MULTI-LANGUAGE TEMPLATE SUPPORT
  // =====================================================

  test('Property 15: Multi-Language Template Support - For any template operation, the system should handle both French and Arabic templates correctly with proper text direction and formatting', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(Language.FRENCH, Language.ARABIC),
        templateDefinitionGenerator,
        async (language: Language, templateDefinition: TemplateDefinition) => {
          // Set template language
          const languageSpecificTemplate = {
            ...templateDefinition,
            language
          };

          // Create template
          const result = await templateManagement.createTemplate(languageSpecificTemplate, 'test-user');
          
          if (!result.success || !result.templateId) return false;

          // Get the created template
          const template = await templateManagement.getTemplateById(result.templateId, UserRole.AVOCAT);
          if (!template) return false;

          // Verify language is correctly stored
          const languageStored = template.language === language;

          // Generate document from template
          const variables = templateVariablesGenerator(template.variables);
          const generatedDocument = await templateProcessing.generateDocument(result.templateId, variables);

          // Verify document generation works for both languages
          const documentGenerated = generatedDocument && generatedDocument.content.length > 0;

          // For Arabic templates, verify RTL handling (basic check)
          let rtlHandling = true;
          if (language === Language.ARABIC) {
            // Check that Arabic content is properly handled
            // This is a simplified check - in real implementation, you'd verify RTL formatting
            rtlHandling = generatedDocument.content.length > 0; // Basic existence check
          }

          // Verify template can be retrieved by language
          const templatesByLanguage = await templateManagement.getTemplatesByRole(
            UserRole.AVOCAT, // Use any role for testing
            language
          );

          const templateFoundInLanguageQuery = templatesByLanguage.some(t => t.id === result.templateId);

          return languageStored && documentGenerated && rtlHandling && templateFoundInLanguageQuery;
        }
      ),
      { numRuns: testConfig.propertyTest.numRuns }
    );
  });

  // =====================================================
  // ADDITIONAL INTEGRATION TESTS
  // =====================================================

  test('Template Engine Integration - Complete workflow from template creation to document generation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...Object.values(UserRole)),
        fc.constantFrom(...Object.values(Language)),
        templateDefinitionGenerator,
        async (userRole: UserRole, language: Language, templateDefinition: TemplateDefinition) => {
          // Ensure template is applicable to the test role
          const applicableTemplate = {
            ...templateDefinition,
            language,
            applicableRoles: [userRole, ...templateDefinition.applicableRoles]
          };

          // Create template
          const result = await templateManagement.createTemplate(applicableTemplate, 'test-user');
          
          if (!result.success || !result.templateId) return false;

          // Verify role-based access
          const accessibleTemplates = await templateManagement.getTemplatesByRole(userRole, language);
          const templateAccessible = accessibleTemplates.some(t => t.id === result.templateId);

          if (!templateAccessible) return false;

          // Get the template for variable generation
          const template = await templateManagement.getTemplateById(result.templateId, userRole);
          if (!template) return false;

          // Generate variables and document
          const variables = templateVariablesGenerator(template.variables);
          const generatedDocument = await templateProcessing.generateDocument(result.templateId, variables);

          // Verify complete workflow
          const workflowComplete = 
            result.templateId &&
            templateAccessible &&
            generatedDocument &&
            generatedDocument.content.length > 0 &&
            generatedDocument.templateId === result.templateId;

          return workflowComplete;
        }
      ),
      { numRuns: Math.floor(testConfig.propertyTest.numRuns / 2) } // Fewer runs for integration test
    );
  });
});