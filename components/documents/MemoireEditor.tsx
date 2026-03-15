import React, { useState } from 'react';
import { FileText, Save, Download, X, Plus } from 'lucide-react';
import { Language } from '../../types';
import { useAppToast } from '../../src/contexts/ToastContext';
import { professionalDataService } from '../../src/services/professionalDataService';
import { useAuth } from '../../src/hooks/useAuth';

interface MemoireEditorProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const MemoireEditor: React.FC<MemoireEditorProps> = ({
  isOpen,
  onClose,
  language
}) => {
  const isAr = language === 'ar';
  const { toast } = useAppToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [memoire, setMemoire] = useState({
    title: '',
    caseNumber: '',
    court: '',
    parties: { demandeur: '', defendeur: '' },
    faits: '',
    droit: '',
    pretentions: '',
    conclusion: ''
  });

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await professionalDataService.create(user.id, 'avocat', {
        title: memoire.title || (isAr ? 'مذكرة جديدة' : 'Nouveau mémoire'),
        description: memoire.faits,
        status: 'draft',
        metadata: {
          type: 'memoire',
          caseNumber: memoire.caseNumber,
          court: memoire.court,
          parties: memoire.parties,
          droit: memoire.droit,
          pretentions: memoire.pretentions,
          conclusion: memoire.conclusion
        }
      });
      toast(isAr ? 'تم الحفظ بنجاح' : 'Sauvegardé avec succès', 'success');
    } catch (err) {
      console.error('Error saving memoire:', err);
      toast(isAr ? 'خطأ في الحفظ' : 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    // Generate document
    const content = `
MÉMOIRE

Affaire N°: ${memoire.caseNumber}
Juridiction: ${memoire.court}

PARTIES:
Demandeur: ${memoire.parties.demandeur}
Défendeur: ${memoire.parties.defendeur}

EXPOSÉ DES FAITS:
${memoire.faits}

EN DROIT:
${memoire.droit}

PRÉTENTIONS:
${memoire.pretentions}

CONCLUSION:
${memoire.conclusion}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoire-${memoire.caseNumber || 'nouveau'}.txt`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="text-legal-blue" />
            {isAr ? 'صياغة مذكرة' : 'Rédiger un Mémoire'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-legal-blue text-white rounded-lg font-bold flex items-center gap-2 hover:bg-legal-blue/90 disabled:opacity-60"
            >
              <Save size={18} />
              {isSaving ? (isAr ? 'جاري الحفظ...' : 'Sauvegarde...') : (isAr ? 'حفظ' : 'Sauvegarder')}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-legal-gold text-white rounded-lg font-bold flex items-center gap-2 hover:bg-legal-gold/90"
            >
              <Download size={18} />
              {isAr ? 'تحميل' : 'Télécharger'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* En-tête du mémoire */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'معلومات القضية' : 'Informations de l\'affaire'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'رقم القضية' : 'N° d\'affaire'}
                </label>
                <input
                  type="text"
                  value={memoire.caseNumber}
                  onChange={(e) => setMemoire({ ...memoire, caseNumber: e.target.value })}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg dark:bg-slate-900"
                  placeholder={isAr ? 'مثال: 2024/123' : 'Ex: 2024/123'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'المحكمة' : 'Juridiction'}
                </label>
                <input
                  type="text"
                  value={memoire.court}
                  onChange={(e) => setMemoire({ ...memoire, court: e.target.value })}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg dark:bg-slate-900"
                  placeholder={isAr ? 'مثال: محكمة الجزائر' : 'Ex: Tribunal d\'Alger'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'المدعي' : 'Demandeur'}
                </label>
                <input
                  type="text"
                  value={memoire.parties.demandeur}
                  onChange={(e) => setMemoire({ 
                    ...memoire, 
                    parties: { ...memoire.parties, demandeur: e.target.value }
                  })}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg dark:bg-slate-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'المدعى عليه' : 'Défendeur'}
                </label>
                <input
                  type="text"
                  value={memoire.parties.defendeur}
                  onChange={(e) => setMemoire({ 
                    ...memoire, 
                    parties: { ...memoire.parties, defendeur: e.target.value }
                  })}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Exposé des faits */}
          <div>
            <label className="block text-sm font-bold mb-2">
              {isAr ? 'عرض الوقائع' : 'EXPOSÉ DES FAITS'}
            </label>
            <textarea
              value={memoire.faits}
              onChange={(e) => setMemoire({ ...memoire, faits: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-lg dark:bg-slate-800 font-mono text-sm"
              placeholder={isAr 
                ? 'اكتب الوقائع هنا...' 
                : 'Décrivez les faits de manière chronologique et précise...'}
            />
          </div>

          {/* En droit */}
          <div>
            <label className="block text-sm font-bold mb-2">
              {isAr ? 'من الناحية القانونية' : 'EN DROIT'}
            </label>
            <textarea
              value={memoire.droit}
              onChange={(e) => setMemoire({ ...memoire, droit: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-lg dark:bg-slate-800 font-mono text-sm"
              placeholder={isAr 
                ? 'اذكر النصوص القانونية والاجتهادات القضائية...' 
                : 'Citez les textes de loi, jurisprudence et doctrine applicables...'}
            />
            <div className="mt-2 flex gap-2">
              <button className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                + {isAr ? 'إضافة مادة قانونية' : 'Ajouter article de loi'}
              </button>
              <button className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
                + {isAr ? 'إضافة اجتهاد قضائي' : 'Ajouter jurisprudence'}
              </button>
            </div>
          </div>

          {/* Prétentions */}
          <div>
            <label className="block text-sm font-bold mb-2">
              {isAr ? 'الطلبات' : 'PRÉTENTIONS'}
            </label>
            <textarea
              value={memoire.pretentions}
              onChange={(e) => setMemoire({ ...memoire, pretentions: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-lg dark:bg-slate-800 font-mono text-sm"
              placeholder={isAr 
                ? 'حدد طلباتك بدقة...' 
                : 'Énoncez clairement vos demandes...'}
            />
          </div>

          {/* Conclusion */}
          <div>
            <label className="block text-sm font-bold mb-2">
              {isAr ? 'الخلاصة' : 'CONCLUSION'}
            </label>
            <textarea
              value={memoire.conclusion}
              onChange={(e) => setMemoire({ ...memoire, conclusion: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-lg dark:bg-slate-800 font-mono text-sm"
              placeholder={isAr 
                ? 'اختتم مذكرتك...' 
                : 'Concluez votre mémoire...'}
            />
          </div>

          {/* Templates suggérés */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h4 className="font-bold text-sm mb-2 text-amber-900 dark:text-amber-200">
              {isAr ? 'قوالب مقترحة' : 'Templates suggérés'}
            </h4>
            <div className="flex flex-wrap gap-2">
              <button className="text-xs px-3 py-1 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-50">
                {isAr ? 'مذكرة دفاع' : 'Mémoire en défense'}
              </button>
              <button className="text-xs px-3 py-1 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-50">
                {isAr ? 'مذكرة رد' : 'Mémoire en réplique'}
              </button>
              <button className="text-xs px-3 py-1 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-50">
                {isAr ? 'مذكرة استئناف' : 'Mémoire d\'appel'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoireEditor;
