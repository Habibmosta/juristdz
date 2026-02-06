/**
 * Custom Template Editor Component
 * 
 * Provides a rich interface for creating and editing custom templates
 * with real-time preview, variable management, and collaborative features.
 * 
 * Requirements: 3.4 - Custom template creation and editing
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Template,
  TemplateVariable,
  TemplateCategory,
  Language,
  VariableType
} from '../../../types/document-management';
import { UserRole } from '../../../types';
import { customTemplateService, TemplateEditor, CustomTemplateCreationRequest } from '../services/customTemplateService';
import { templateManagementService } from '../services/templateManagementService';

interface CustomTemplateEditorProps {
  templateId?: string;
  userId: string;
  userRole: UserRole;
  onSave?: (template: Template) => void;
  onCancel?: () => void;
  onPreview?: (content: string) => void;
  readOnly?: boolean;
  collaborative?: boolean;
}

interface EditorState {
  name: string;
  description: string;
  category: TemplateCategory;
  language: Language;
  content: string;
  variables: TemplateVariable[];
  isPrivate: boolean;
  shareWithRoles: UserRole[];
  shareWithUsers: string[];
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: Date;
  errors: string[];
  warnings: string[];
}

const CustomTemplateEditor: React.FC<CustomTemplateEditorProps> = ({
  templateId,
  userId,
  userRole,
  onSave,
  onCancel,
  onPreview,
  readOnly = false,
  collaborative = false
}) => {
  const [editorState, setEditorState] = useState<EditorState>({
    name: '',
    description: '',
    category: TemplateCategory.CONTRACT,
    language: Language.FRENCH,
    content: '',
    variables: [],
    isPrivate: true,
    shareWithRoles: [],
    shareWithUsers: [],
    isDirty: false,
    isSaving: false,
    errors: [],
    warnings: []
  });

  const [previewContent, setPreviewContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showVariableEditor, setShowVariableEditor] = useState<boolean>(false);
  const [selectedVariable, setSelectedVariable] = useState<TemplateVariable | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load existing template if editing
  useEffect(() => {
    if (templateId) {
      loadTemplate();
    } else {
      initializeNewTemplate();
    }
  }, [templateId]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && editorState.isDirty && !readOnly) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 5000); // Auto-save after 5 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editorState.isDirty, autoSaveEnabled, readOnly]);

  // Load existing template if editing
  const loadTemplate = async () => {
    if (!templateId) return;

    try {
      const template = await templateManagementService.getTemplateById(templateId, userRole);
      if (template) {
        setEditorState(prev => ({
          ...prev,
          name: template.name,
          description: template.description,
          category: template.category,
          language: template.language,
          content: template.content,
          variables: template.variables,
          isDirty: false,
          errors: [],
          warnings: []
        }));
      }
    } catch (error) {
      setEditorState(prev => ({
        ...prev,
        errors: [error instanceof Error ? error.message : 'Failed to load template']
      }));
    }
  };

  // Initialize new template with defaults
  const initializeNewTemplate = async () => {
    try {
      const editor = await customTemplateService.createTemplateEditor();
      setEditorState(prev => ({
        ...prev,
        content: editor.content,
        variables: editor.variables,
        isDirty: false
      }));
    } catch (error) {
      setEditorState(prev => ({
        ...prev,
        errors: [error instanceof Error ? error.message : 'Failed to initialize template']
      }));
    }
  };

  // Auto-save handler
  const handleAutoSave = async () => {
    if (!editorState.isDirty || readOnly) return;

    try {
      setEditorState(prev => ({ ...prev, isSaving: true }));

      if (templateId) {
        // Update existing template
        const result = await customTemplateService.updateCustomTemplate(
          templateId,
          {
            name: editorState.name,
            description: editorState.description,
            content: editorState.content,
            variables: editorState.variables,
            isPrivate: editorState.isPrivate,
            shareWithRoles: editorState.shareWithRoles,
            shareWithUsers: editorState.shareWithUsers
          },
          userId,
          userRole
        );

        if (result.success) {
          setEditorState(prev => ({
            ...prev,
            isDirty: false,
            lastSaved: new Date(),
            errors: []
          }));
        } else {
          setEditorState(prev => ({
            ...prev,
            errors: [result.error || 'Auto-save failed']
          }));
        }
      }
    } catch (error) {
      setEditorState(prev => ({
        ...prev,
        errors: [error instanceof Error ? error.message : 'Auto-save failed']
      }));
    } finally {
      setEditorState(prev => ({ ...prev, isSaving: false }));
    }
  };

  // Save template handler
  const handleSave = async () => {
    if (readOnly) return;

    try {
      setEditorState(prev => ({ ...prev, isSaving: true, errors: [] }));

      const templateRequest: CustomTemplateCreationRequest = {
        name: editorState.name,
        description: editorState.description,
        category: editorState.category,
        language: editorState.language,
        content: editorState.content,
        variables: editorState.variables,
        isPrivate: editorState.isPrivate,
        shareWithRoles: editorState.shareWithRoles,
        shareWithUsers: editorState.shareWithUsers
      };

      let result;
      if (templateId) {
        // Update existing template
        result = await customTemplateService.updateCustomTemplate(
          templateId,
          templateRequest,
          userId,
          userRole
        );
      } else {
        // Create new template
        result = await customTemplateService.createCustomTemplate(
          templateRequest,
          userId,
          userRole
        );
      }

      if (result.success) {
        setEditorState(prev => ({
          ...prev,
          isDirty: false,
          lastSaved: new Date(),
          errors: []
        }));

        if (result.template && onSave) {
          onSave(result.template);
        }
      } else {
        setEditorState(prev => ({
          ...prev,
          errors: result.validationErrors || [result.error || 'Save failed']
        }));
      }
    } catch (error) {
      setEditorState(prev => ({
        ...prev,
        errors: [error instanceof Error ? error.message : 'Save failed']
      }));
    } finally {
      setEditorState(prev => ({ ...prev, isSaving: false }));
    }
  };

  // Generate preview
  const handlePreview = async () => {
    try {
      const preview = await customTemplateService.generateTemplatePreview(
        editorState.content,
        editorState.variables,
        editorState.language
      );
      setPreviewContent(preview);
      setShowPreview(true);
      
      if (onPreview) {
        onPreview(preview);
      }
    } catch (error) {
      setEditorState(prev => ({
        ...prev,
        errors: [error instanceof Error ? error.message : 'Preview generation failed']
      }));
    }
  };

  // Handle content change
  const handleContentChange = (content: string) => {
    setEditorState(prev => ({
      ...prev,
      content,
      isDirty: true
    }));
  };

  // Handle variable changes
  const handleVariableChange = (variables: TemplateVariable[]) => {
    setEditorState(prev => ({
      ...prev,
      variables,
      isDirty: true
    }));
  };

  // Add new variable
  const handleAddVariable = () => {
    const newVariable: TemplateVariable = {
      name: `variable${editorState.variables.length + 1}`,
      type: VariableType.TEXT,
      label: `Variable ${editorState.variables.length + 1}`,
      required: false,
      placeholder: 'Enter value'
    };

    setEditorState(prev => ({
      ...prev,
      variables: [...prev.variables, newVariable],
      isDirty: true
    }));
    setSelectedVariable(newVariable);
    setShowVariableEditor(true);
  };

  // Edit variable
  const handleEditVariable = (variable: TemplateVariable) => {
    setSelectedVariable(variable);
    setShowVariableEditor(true);
  };

  // Delete variable
  const handleDeleteVariable = (variableName: string) => {
    setEditorState(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v.name !== variableName),
      isDirty: true
    }));
  };

  // Update variable
  const handleUpdateVariable = (updatedVariable: TemplateVariable) => {
    setEditorState(prev => ({
      ...prev,
      variables: prev.variables.map(v => 
        v.name === selectedVariable?.name ? updatedVariable : v
      ),
      isDirty: true
    }));
    setSelectedVariable(null);
    setShowVariableEditor(false);
  };

  // Insert variable into content
  const handleInsertVariable = (variableName: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const placeholder = `{{${variableName}}}`;
    
    const newContent = 
      editorState.content.substring(0, start) + 
      placeholder + 
      editorState.content.substring(end);

    handleContentChange(newContent);

    // Set cursor position after inserted placeholder
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  return (
    <div className="custom-template-editor h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {templateId ? 'Modifier le modèle' : 'Nouveau modèle personnalisé'}
          </h2>
          {editorState.isSaving && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Sauvegarde...
            </div>
          )}
          {editorState.lastSaved && (
            <div className="text-sm text-gray-500">
              Dernière sauvegarde: {editorState.lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
            className={`px-3 py-1 text-sm rounded ${
              autoSaveEnabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Sauvegarde auto: {autoSaveEnabled ? 'ON' : 'OFF'}
          </button>
          
          <button
            onClick={handlePreview}
            className="px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            disabled={!editorState.content.trim()}
          >
            Aperçu
          </button>
          
          <button
            onClick={handleSave}
            disabled={!editorState.isDirty || editorState.isSaving || readOnly}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editorState.isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {editorState.errors.length > 0 && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreurs:</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {editorState.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Messages */}
      {editorState.warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Avertissements:</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {editorState.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Template Details */}
        <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du modèle *
              </label>
              <input
                type="text"
                value={editorState.name}
                onChange={(e) => setEditorState(prev => ({ 
                  ...prev, 
                  name: e.target.value, 
                  isDirty: true 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez le nom du modèle"
                disabled={readOnly}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editorState.description}
                onChange={(e) => setEditorState(prev => ({ 
                  ...prev, 
                  description: e.target.value, 
                  isDirty: true 
                }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description du modèle"
                disabled={readOnly}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={editorState.category}
                  onChange={(e) => setEditorState(prev => ({ 
                    ...prev, 
                    category: e.target.value as TemplateCategory, 
                    isDirty: true 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={readOnly}
                >
                  <option value={TemplateCategory.CONTRACT}>Contrat</option>
                  <option value={TemplateCategory.MOTION}>Requête</option>
                  <option value={TemplateCategory.BRIEF}>Mémoire</option>
                  <option value={TemplateCategory.NOTICE}>Avis</option>
                  <option value={TemplateCategory.AGREEMENT}>Accord</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Langue
                </label>
                <select
                  value={editorState.language}
                  onChange={(e) => setEditorState(prev => ({ 
                    ...prev, 
                    language: e.target.value as Language, 
                    isDirty: true 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={readOnly}
                >
                  <option value={Language.FRENCH}>Français</option>
                  <option value={Language.ARABIC}>العربية</option>
                </select>
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editorState.isPrivate}
                  onChange={(e) => setEditorState(prev => ({ 
                    ...prev, 
                    isPrivate: e.target.checked, 
                    isDirty: true 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={readOnly}
                />
                <span className="ml-2 text-sm text-gray-700">Modèle privé</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Les modèles privés ne sont visibles que par vous
              </p>
            </div>

            {/* Variables Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Variables</h3>
                <button
                  onClick={handleAddVariable}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={readOnly}
                >
                  + Ajouter
                </button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {editorState.variables.map((variable, index) => (
                  <div
                    key={variable.name}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {variable.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {{variable.name}} - {variable.type}
                        {variable.required && <span className="text-red-500"> *</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleInsertVariable(variable.name)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Insérer dans le contenu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditVariable(variable)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        disabled={readOnly}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteVariable(variable.name)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        disabled={readOnly}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Content Editor */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Contenu du modèle</h3>
            <p className="text-xs text-gray-500 mt-1">
              Utilisez {{nomVariable}} pour insérer des variables
            </p>
          </div>
          
          <div className="flex-1 p-4">
            <textarea
              ref={contentTextareaRef}
              value={editorState.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
              placeholder="Entrez le contenu de votre modèle ici..."
              disabled={readOnly}
              style={{ 
                direction: editorState.language === Language.ARABIC ? 'rtl' : 'ltr',
                textAlign: editorState.language === Language.ARABIC ? 'right' : 'left'
              }}
            />
          </div>
        </div>

        {/* Right Panel - Preview */}
        {showPreview && (
          <div className="w-1/3 border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Aperçu</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div 
                className="prose prose-sm max-w-none"
                style={{ 
                  direction: editorState.language === Language.ARABIC ? 'rtl' : 'ltr',
                  textAlign: editorState.language === Language.ARABIC ? 'right' : 'left'
                }}
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Variable Editor Modal */}
      {showVariableEditor && selectedVariable && (
        <VariableEditorModal
          variable={selectedVariable}
          onSave={handleUpdateVariable}
          onCancel={() => {
            setSelectedVariable(null);
            setShowVariableEditor(false);
          }}
          readOnly={readOnly}
        />
      )}
    </div>
  );
};

// Variable Editor Modal Component
interface VariableEditorModalProps {
  variable: TemplateVariable;
  onSave: (variable: TemplateVariable) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

const VariableEditorModal: React.FC<VariableEditorModalProps> = ({
  variable,
  onSave,
  onCancel,
  readOnly = false
}) => {
  const [editedVariable, setEditedVariable] = useState<TemplateVariable>({ ...variable });

  const handleSave = () => {
    if (!editedVariable.name.trim() || !editedVariable.label.trim()) {
      return;
    }
    onSave(editedVariable);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {variable.name ? 'Modifier la variable' : 'Nouvelle variable'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de la variable *
            </label>
            <input
              type="text"
              value={editedVariable.name}
              onChange={(e) => setEditedVariable(prev => ({ 
                ...prev, 
                name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="nomVariable"
              disabled={readOnly}
            />
            <p className="text-xs text-gray-500 mt-1">
              Lettres, chiffres et underscore uniquement
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Libellé *
            </label>
            <input
              type="text"
              value={editedVariable.label}
              onChange={(e) => setEditedVariable(prev => ({ 
                ...prev, 
                label: e.target.value 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nom affiché à l'utilisateur"
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={editedVariable.type}
              onChange={(e) => setEditedVariable(prev => ({ 
                ...prev, 
                type: e.target.value as VariableType 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={readOnly}
            >
              <option value={VariableType.TEXT}>Texte</option>
              <option value={VariableType.DATE}>Date</option>
              <option value={VariableType.NUMBER}>Nombre</option>
              <option value={VariableType.BOOLEAN}>Booléen</option>
              <option value={VariableType.LIST}>Liste</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={editedVariable.placeholder || ''}
              onChange={(e) => setEditedVariable(prev => ({ 
                ...prev, 
                placeholder: e.target.value 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Texte d'aide pour l'utilisateur"
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editedVariable.required}
                onChange={(e) => setEditedVariable(prev => ({ 
                  ...prev, 
                  required: e.target.checked 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={readOnly}
              />
              <span className="ml-2 text-sm text-gray-700">Variable obligatoire</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!editedVariable.name.trim() || !editedVariable.label.trim() || readOnly}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomTemplateEditor;