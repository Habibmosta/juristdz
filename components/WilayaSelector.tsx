import React, { useState, useEffect } from 'react';
import { MapPin, Building2, Scale, FileText, Info } from 'lucide-react';
import { Language } from '../types';
import { 
  WILAYAS_LIST, 
  getWilayaData, 
  getTribunauxByWilaya,
  getFormatRC,
  getFormatNIF,
  WilayaData 
} from '../data/wilayaSpecificData';

interface WilayaSelectorProps {
  language: Language;
  selectedWilaya?: string;
  onWilayaChange: (wilayaCode: string) => void;
  showDetails?: boolean;
}

const WilayaSelector: React.FC<WilayaSelectorProps> = ({
  language,
  selectedWilaya,
  onWilayaChange,
  showDetails = false
}) => {
  const [wilayaData, setWilayaData] = useState<WilayaData | null>(null);
  const [selectedTribunal, setSelectedTribunal] = useState<string>('');

  useEffect(() => {
    if (selectedWilaya) {
      const data = getWilayaData(selectedWilaya);
      setWilayaData(data);
    } else {
      setWilayaData(null);
    }
  }, [selectedWilaya]);

  return (
    <div className="space-y-4">
      {/* Sélecteur de Wilaya */}
      <div>
        <label className="block text-sm font-bold mb-2 flex items-center gap-2">
          <MapPin size={16} />
          {language === 'ar' ? 'الولاية' : 'Wilaya'}
        </label>
        <select
          value={selectedWilaya || ''}
          onChange={(e) => onWilayaChange(e.target.value)}
          className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <option value="">
            {language === 'ar' ? 'اختر الولاية' : 'Sélectionner une wilaya'}
          </option>
          {WILAYAS_LIST.map(wilaya => (
            <option key={wilaya.code} value={wilaya.code}>
              {wilaya.code} - {language === 'ar' ? wilaya.name_ar : wilaya.name_fr}
            </option>
          ))}
        </select>
      </div>

      {/* Détails de la Wilaya */}
      {showDetails && wilayaData && (
        <div className="space-y-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          {/* Tribunaux */}
          <div>
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <Scale size={16} />
              {language === 'ar' ? 'المحاكم' : 'Tribunaux'}
            </h3>
            <select
              value={selectedTribunal}
              onChange={(e) => setSelectedTribunal(e.target.value)}
              className="w-full p-2 border rounded text-sm"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="">
                {language === 'ar' ? 'اختر المحكمة' : 'Sélectionner un tribunal'}
              </option>
              {wilayaData.tribunaux.map((tribunal, index) => (
                <option key={index} value={tribunal.name_fr}>
                  {language === 'ar' ? tribunal.name_ar : tribunal.name_fr}
                </option>
              ))}
            </select>
            
            {selectedTribunal && (
              <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded border text-xs space-y-1">
                {wilayaData.tribunaux
                  .filter(t => t.name_fr === selectedTribunal)
                  .map((tribunal, index) => (
                    <div key={index}>
                      <p className="font-bold">
                        {language === 'ar' ? tribunal.name_ar : tribunal.name_fr}
                      </p>
                      <p className="text-slate-600">{tribunal.address}</p>
                      {tribunal.phone && (
                        <p className="text-slate-600">
                          {language === 'ar' ? 'الهاتف:' : 'Tél:'} {tribunal.phone}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Conservation Foncière */}
          {wilayaData.conservation_fonciere.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Building2 size={16} />
                {language === 'ar' ? 'المحافظة العقارية' : 'Conservation Foncière'}
              </h3>
              <div className="space-y-2">
                {wilayaData.conservation_fonciere.map((cf, index) => (
                  <div key={index} className="p-3 bg-white dark:bg-slate-900 rounded border text-xs">
                    <p className="font-bold">
                      {language === 'ar' ? cf.name_ar : cf.name_fr}
                    </p>
                    <p className="text-slate-600">{cf.address}</p>
                    {cf.phone && (
                      <p className="text-slate-600">
                        {language === 'ar' ? 'الهاتف:' : 'Tél:'} {cf.phone}
                      </p>
                    )}
                    <p className="text-slate-500 mt-1">
                      {language === 'ar' ? 'الدائرة:' : 'Circonscription:'} {cf.circonscription.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barreau */}
          {wilayaData.barreau && (
            <div>
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Scale size={16} />
                {language === 'ar' ? 'نقابة المحامين' : 'Barreau'}
              </h3>
              <div className="p-3 bg-white dark:bg-slate-900 rounded border text-xs">
                <p className="font-bold">
                  {language === 'ar' ? wilayaData.barreau.name_ar : wilayaData.barreau.name_fr}
                </p>
                <p className="text-slate-600">{wilayaData.barreau.address}</p>
                {wilayaData.barreau.phone && (
                  <p className="text-slate-600">
                    {language === 'ar' ? 'الهاتف:' : 'Tél:'} {wilayaData.barreau.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Formats RC et NIF */}
          <div>
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <FileText size={16} />
              {language === 'ar' ? 'الأرقام الرسمية' : 'Numéros Officiels'}
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-white dark:bg-slate-900 rounded border">
                <span className="font-bold">
                  {language === 'ar' ? 'السجل التجاري:' : 'Registre de Commerce:'}
                </span>
                <code className="ml-2 text-legal-blue">{wilayaData.format_rc}</code>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded border">
                <span className="font-bold">
                  {language === 'ar' ? 'رقم التعريف الجبائي:' : 'NIF:'}
                </span>
                <code className="ml-2 text-legal-blue">{wilayaData.format_nif}</code>
              </div>
            </div>
          </div>

          {/* Spécificités */}
          {wilayaData.specificites && wilayaData.specificites.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Info size={16} />
                {language === 'ar' ? 'خصوصيات محلية' : 'Spécificités Locales'}
              </h3>
              <ul className="space-y-1 text-xs">
                {wilayaData.specificites.map((spec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-legal-gold mt-1">•</span>
                    <span className="text-slate-600">{spec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WilayaSelector;
