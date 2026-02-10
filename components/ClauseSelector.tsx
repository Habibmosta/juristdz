import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Check, AlertCircle, BookOpen, FileText } from 'lucide-react';
import { Language } from '../types';
import { 
  CLAUSE_CATEGORIES, 
  CLAUSES_STANDARDS, 
  Clause,
  getClausesByCategory,
  getClausesForDocument,
  getMandatoryClauses,
  populateClause
} from '../data/clausesStandards';

interface ClauseSelectorProps {
  language: Language;
  documentType: string;
  selectedClauses: string[]; // IDs des clauses sélectionnées
  onClausesChange: (clauseIds: string[]) => void;
  variables?: { [key: string]: string }; // Variables pour remplir les clauses
}

const ClauseSelector: React.FC<ClauseSelectorProps> = ({
  language,
  documentType,
  selectedClauses,
  onClausesChange,
  variables = {}
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [previewClause, setPreviewClause] = useState<Clause | null>(null);
  const [customClause, setCustomClause] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const availableClauses = getClausesForDocument(documentType);
  const mandatoryClauses = getMandatoryClauses(documentType);

  useEffect(() => {
    // Ajouter automatiquement les clauses obligatoires
    const mandatoryIds = mandatoryClauses.map(c => c.id);
    const missingMandatory = mandatoryIds.filter(id => !selectedClauses.includes(id));
    
    if (missingMandatory.length > 0) {
      onClausesChange([...selectedClauses, ...missingMandatory]);
    }
  }, [documentType]);

  const toggleClause = (clauseId: string) => {
    const clause = CLAUSES_STANDARDS.find(c => c.id === clauseId);
    
    // Ne pas permettre de désélectionner les clauses obligatoires
    if (clause?.mandatory && selectedClauses.includes(clauseId)) {
      return;
    }

    if (selectedClauses.includes(clauseId)) {
      onClausesChange(selectedClauses.filter(id => id !== clauseId));
    } else {
      onClausesChange([...selectedClauses, clauseId]);
    }
  };

  const getClauseText = (clause: Clause): string => {
    return populateClause(clause, variables, language);
  };

  const categoriesWithClauses = CLAUSE_CATEGORIES.filter(cat =>
    availableClauses.some(clause => clause.category === cat.id)
  );

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <BookOpen size={20} />
            {language === 'ar' ? 'البنود القانونية' : 'Clauses Juridiques'}
          </h3>
          <p className="text-sm text-slate-600">
            {language === 'ar' 
              ? `${selectedClauses.length} بند محدد (${mandatoryClauses.length} إجباري)`
              : `${selectedClauses.length} clauses sélectionnées (${mandatoryClauses.length} obligatoires)`}
          </p>
        </div>
        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="flex items-center gap-2 px-4 py-2 bg-legal-blue text-white rounded-lg hover:opacity-90 text-sm"
        >
          <Plus size={16} />
          {language === 'ar' ? 'بند مخصص' : 'Clause personnalisée'}
        </button>
      </div>

      {/* Clause personnalisée */}
      {showCustomInput && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border-2 border-dashed border-slate-300">
          <label className="block text-sm font-bold mb-2">
            {language === 'ar' ? 'أضف بنداً مخصصاً' : 'Ajouter une clause personnalisée'}
          </label>
          <textarea
            value={customClause}
            onChange={(e) => setCustomClause(e.target.value)}
            className="w-full p-3 border rounded-lg h-32"
            placeholder={language === 'ar' 
              ? 'اكتب البند المخصص هنا...'
              : 'Écrivez votre clause personnalisée ici...'}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                // TODO: Ajouter la clause personnalisée
                setCustomClause('');
                setShowCustomInput(false);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => {
                setCustomClause('');
                setShowCustomInput(false);
              }}
              className="px-4 py-2 bg-slate-300 rounded-lg text-sm"
            >
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>
          </div>
        </div>
      )}

      {/* Catégories */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
            activeCategory === ''
              ? 'bg-legal-blue text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {language === 'ar' ? 'الكل' : 'Toutes'}
        </button>
        {categoriesWithClauses.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
              activeCategory === category.id
                ? 'bg-legal-blue text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'ar' ? category.name_ar : category.name_fr}
          </button>
        ))}
      </div>

      {/* Liste des clauses */}
      <div className="space-y-3">
        {availableClauses
          .filter(clause => !activeCategory || clause.category === activeCategory)
          .map(clause => {
            const isSelected = selectedClauses.includes(clause.id);
            const isMandatory = clause.mandatory;

            return (
              <div
                key={clause.id}
                className={`border rounded-lg p-4 transition ${
                  isSelected
                    ? 'border-legal-blue bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 bg-white dark:bg-slate-800'
                } ${isMandatory ? 'border-l-4 border-l-legal-gold' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleClause(clause.id)}
                        disabled={isMandatory}
                        className="w-4 h-4"
                      />
                      <h4 className="font-bold text-sm" dir="auto">
                        {language === 'ar' ? clause.name_ar : clause.name_fr}
                      </h4>
                      {isMandatory && (
                        <span className="text-xs bg-legal-gold text-white px-2 py-0.5 rounded">
                          {language === 'ar' ? 'إجباري' : 'Obligatoire'}
                        </span>
                      )}
                    </div>

                    {clause.legal_reference && (
                      <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                        <FileText size={12} />
                        {clause.legal_reference}
                      </p>
                    )}

                    {isSelected && (
                      <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded border">
                        <p className="text-sm whitespace-pre-wrap" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                          {getClauseText(clause)}
                        </p>
                        
                        {clause.variables && clause.variables.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-slate-500 mb-1">
                              {language === 'ar' ? 'المتغيرات المطلوبة:' : 'Variables requises:'}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {clause.variables.map(variable => {
                                const hasValue = variables[variable];
                                return (
                                  <span
                                    key={variable}
                                    className={`text-xs px-2 py-1 rounded ${
                                      hasValue
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {variable}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewClause(clause)}
                      className="p-2 hover:bg-slate-100 rounded transition"
                      title={language === 'ar' ? 'معاينة' : 'Aperçu'}
                    >
                      <FileText size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Modal de prévisualisation */}
      {previewClause && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-legal-blue text-white p-4 flex justify-between items-center">
              <h3 className="font-bold" dir="auto">
                {language === 'ar' ? previewClause.name_ar : previewClause.name_fr}
              </h3>
              <button
                onClick={() => setPreviewClause(null)}
                className="p-2 hover:bg-white/20 rounded transition"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {previewClause.legal_reference && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200">
                  <p className="text-sm font-bold mb-1">
                    {language === 'ar' ? 'المرجع القانوني:' : 'Référence légale:'}
                  </p>
                  <p className="text-sm">{previewClause.legal_reference}</p>
                </div>
              )}

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  {getClauseText(previewClause)}
                </p>
              </div>

              {previewClause.notes && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200">
                  <p className="text-sm font-bold mb-1 flex items-center gap-2">
                    <AlertCircle size={14} />
                    {language === 'ar' ? 'ملاحظات:' : 'Notes:'}
                  </p>
                  <p className="text-sm">{previewClause.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Avertissement variables manquantes */}
      {selectedClauses.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {language === 'ar'
              ? 'تأكد من ملء جميع المتغيرات المطلوبة في البنود المحددة'
              : 'Assurez-vous de remplir toutes les variables requises dans les clauses sélectionnées'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClauseSelector;
