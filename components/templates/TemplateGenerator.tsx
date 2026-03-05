import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { Language } from '../../types';
import { X, Download, Save, Loader2, FileText } from 'lucide-react';

interface Variable {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface Template {
  id: string;
  name: string;
  content: string;
  variables: Variable[];
}

interface TemplateGeneratorProps {
  template: Template;
  caseId?: string;
  userId: string;
  language: Language;
  onClose: () => void;
  onGenerated: () => void;
}

const TemplateGenerator: React.FC<TemplateGeneratorProps> = ({
  template,
  caseId,
  userId,
  language,
  onClose,
  onGenerated
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [caseData, setCaseData] = useState<any>(null);
  const isAr = language === 'ar';

  useEffect(() => {
    if (caseId) {
      loadCaseData();
    }
  }, [caseId]);

  const loadCaseData = async () => {
    if (!caseId) return;

    try {
      const { data: caseInfo } = await supabase
        .from('cases')
        .select('*, clients(*)')
        .eq('id', caseId)
        .single();

      if (caseInfo) {
        setCaseData(caseInfo);
        // Pré-remplir les variables avec les données du dossier
        prefillVariables(caseInfo);
      }
    } catch (error) {
      console.error('Error loading case data:', error);
    }
  };

  const prefillVariables = (caseInfo: any) => {
    const prefilled: Record<string, string> = {};
    
    // Mapping des variables communes
    if (caseInfo.clients) {
      prefilled['nom_client'] = caseInfo.clients.name || '';
      prefilled['adresse_client'] = caseInfo.clients.address || '';
      prefilled['nom_demandeur'] = caseInfo.clients.name || '';
      prefilled['adresse_demandeur'] = caseInfo.clients.address || '';
    }
    
    prefilled['date'] = new Date().toLocaleDateString('fr-FR');
    prefilled['annee'] = new Date().getFullYear().toString();
    prefilled['ville'] = 'Alger'; // À personnaliser
    
    setFormData(prefilled);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Appeler la fonction SQL pour générer le document
      const { data, error } = await supabase
        .rpc('generate_document_from_template', {
          p_template_id: template.id,
          p_variables: formData
        });

      if (error) throw error;

      setGeneratedContent(data);
    } catch (error) {
      console.error('Error generating document:', error);
      alert(isAr ? 'حدث خطأ في إنشاء الوثيقة' : 'Erreur lors de la génération du document');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!caseId) {
      downloadDocument();
      return;
    }

    setSaving(true);
    try {
      // Créer un fichier et l'uploader
      const fileName = `${template.name}_${new Date().getTime()}.txt`;
      const blob = new Blob([generatedContent], { type: 'text/plain' });
      const file = new File([blob], fileName);

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('case-documents')
        .upload(`${userId}/${caseId}/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Enregistrer dans la table case_documents
      const { error: dbError } = await supabase
        .from('case_documents')
        .insert({
          case_id: caseId,
          user_id: userId,
          file_name: fileName,
          storage_path: uploadData.path,
          file_size: blob.size,
          file_type: 'text/plain',
          document_type: 'contract',
          title: template.name,
          created_by: userId
        });

      if (dbError) throw dbError;

      alert(isAr ? 'تم حفظ الوثيقة بنجاح' : 'Document sauvegardé avec succès');
      onGenerated();
    } catch (error) {
      console.error('Error saving document:', error);
      alert(isAr ? 'حدث خطأ في حفظ الوثيقة' : 'Erreur lors de la sauvegarde du document');
    } finally {
      setSaving(false);
    }
  };

  const downloadDocument = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="w-full max-w-6xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border dark:border-slate-800 pointer-events-auto flex flex-col"
          dir={isAr ? 'rtl' : 'ltr'}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b dark:border-slate-800">
            <div className="flex items-center gap-3">
              <FileText size={24} className="text-legal-gold" />
              <div>
                <h2 className="text-xl font-bold">{template.name}</h2>
                <p className="text-sm text-slate-500">
                  {isAr ? 'املأ المتغيرات لإنشاء الوثيقة' : 'Remplissez les variables pour générer le document'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg mb-4">
                  {isAr ? 'المتغيرات' : 'Variables'}
                </h3>
                {template.variables?.map((variable) => (
                  <div key={variable.name}>
                    <label className="block text-sm font-medium mb-2">
                      {variable.label}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {variable.type === 'textarea' ? (
                      <textarea
                        value={formData[variable.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [variable.name]: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
                        required={variable.required}
                      />
                    ) : (
                      <input
                        type={variable.type}
                        value={formData[variable.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [variable.name]: e.target.value })}
                        className="w-full px-4 py-2 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
                        required={variable.required}
                      />
                    )}
                  </div>
                ))}

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-legal-gold text-white rounded-xl hover:bg-legal-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>{isAr ? 'جاري الإنشاء...' : 'Génération...'}</span>
                    </>
                  ) : (
                    <>
                      <FileText size={20} />
                      <span>{isAr ? 'إنشاء الوثيقة' : 'Générer le document'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg mb-4">
                  {isAr ? 'معاينة' : 'Aperçu'}
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 min-h-[400px] max-h-[600px] overflow-y-auto border dark:border-slate-700">
                  {generatedContent ? (
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {generatedContent}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <div className="text-center">
                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                        <p>{isAr ? 'املأ النموذج وانقر على "إنشاء الوثيقة"' : 'Remplissez le formulaire et cliquez sur "Générer"'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {generatedContent && (
                  <div className="flex gap-3">
                    <button
                      onClick={downloadDocument}
                      className="flex-1 px-4 py-2 border dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      <span>{isAr ? 'تحميل' : 'Télécharger'}</span>
                    </button>
                    {caseId && (
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>{isAr ? 'جاري الحفظ...' : 'Sauvegarde...'}</span>
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            <span>{isAr ? 'حفظ في الملف' : 'Sauvegarder dans le dossier'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TemplateGenerator;
