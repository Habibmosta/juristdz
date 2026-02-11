import React, { useState } from 'react';
import { Check, X, HelpCircle, AlertCircle } from 'lucide-react';
import { Language } from '../../types';

interface ProfessionalInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'date' | 'tel' | 'number' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  example?: string;
  legalRef?: string;
  validator?: (value: string) => { valid: boolean; message?: string };
  language?: Language;
  disabled?: boolean;
  maxLength?: number;
}

const ProfessionalInput: React.FC<ProfessionalInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  options,
  placeholder,
  required = false,
  helpText,
  example,
  legalRef,
  validator,
  language = 'fr',
  disabled = false,
  maxLength
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [touched, setTouched] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message?: string } | null>(null);

  const isAr = language === 'ar';

  const handleChange = (newValue: string) => {
    onChange(newValue);
    
    if (validator && newValue) {
      const result = validator(newValue);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (validator && value) {
      const result = validator(value);
      setValidationResult(result);
    }
  };

  const showValidation = touched && value;
  const isValid = validationResult?.valid !== false;
  const showError = showValidation && !isValid;
  const showSuccess = showValidation && isValid && value.length > 0;

  const inputClasses = `
    w-full px-4 py-3 
    border-2 rounded-lg
    bg-white dark:bg-slate-800
    text-slate-900 dark:text-slate-100
    transition-all duration-200
    ${showError ? 'border-red-500 focus:border-red-600 focus:ring-red-200' : ''}
    ${showSuccess ? 'border-green-500 focus:border-green-600 focus:ring-green-200' : ''}
    ${!showValidation ? 'border-slate-300 dark:border-slate-600 focus:border-legal-gold focus:ring-legal-gold/20' : ''}
    focus:outline-none focus:ring-4
    disabled:bg-slate-100 disabled:cursor-not-allowed
    ${isAr ? 'text-right' : 'text-left'}
  `;

  return (
    <div className="space-y-2">
      {/* Label avec aide */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500">*</span>}
          {(helpText || example || legalRef) && (
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 transition-colors"
              title={isAr ? 'مساعدة' : 'Aide'}
            >
              <HelpCircle size={16} />
            </button>
          )}
        </label>
        
        {/* Indicateur de validation */}
        {showValidation && (
          <div className="flex items-center gap-1">
            {isValid ? (
              <Check size={16} className="text-green-600" />
            ) : (
              <X size={16} className="text-red-600" />
            )}
          </div>
        )}
      </div>

      {/* Aide contextuelle */}
      {showHelp && (helpText || example || legalRef) && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm space-y-2">
          {helpText && (
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-blue-900 dark:text-blue-100">{helpText}</p>
            </div>
          )}
          {example && (
            <div className="text-blue-700 dark:text-blue-300">
              <span className="font-medium">{isAr ? 'مثال:' : 'Exemple:'}</span> {example}
            </div>
          )}
          {legalRef && (
            <div className="text-blue-600 dark:text-blue-400 text-xs">
              <span className="font-medium">⚖️</span> {legalRef}
            </div>
          )}
        </div>
      )}

      {/* Champ de saisie */}
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className={inputClasses}
          disabled={disabled}
          required={required}
        >
          <option value="">-- {isAr ? 'اختر' : 'Sélectionner'} --</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={inputClasses + ' min-h-[100px] resize-y'}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          dir={isAr ? 'rtl' : 'ltr'}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={inputClasses}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          dir={isAr ? 'rtl' : 'ltr'}
        />
      )}

      {/* Message de validation */}
      {showError && validationResult?.message && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <X size={14} />
          <span>{validationResult.message}</span>
        </div>
      )}

      {/* Compteur de caractères */}
      {maxLength && value && (
        <div className="text-xs text-slate-500 text-right">
          {value.length} / {maxLength}
        </div>
      )}
    </div>
  );
};

export default ProfessionalInput;
