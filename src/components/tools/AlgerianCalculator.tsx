import React, { useState } from 'react';
import { Language } from '../../../types';
import { 
  Calculator, Calendar, DollarSign, Scale, 
  Clock, FileText, TrendingUp, AlertCircle
} from 'lucide-react';
import {
  calculateProceduralDeadlines,
  calculateLegalInterest,
  calculateDamages,
  calculateCourtFees,
  calculateLawyerFees,
  calculateVAT
} from '../../services/algerianCalculations';

interface AlgerianCalculatorProps {
  language: Language;
}

const translations = {
  fr: {
    title: 'Calculateurs Juridiques Algériens',
    subtitle: 'Calculs automatiques conformes à la législation algérienne',
    deadlines: 'Délais Procéduraux',
    interest: 'Intérêts Légaux',
    damages: 'Dommages-Intérêts',
    courtFees: 'Frais de Justice',
    lawyerFees: 'Honoraires d\'Avocat',
    vat: 'TVA (19%)',
    calculate: 'Calculer',
    result: 'Résultat',
    startDate: 'Date de début',
    procedureType: 'Type de procédure',
    principal: 'Montant principal',
    endDate: 'Date de fin',
    rate: 'Taux (%)',
    damageType: 'Type de préjudice',
    severity: 'Gravité',
    claimAmount: 'Montant du litige',
    courtType: 'Type de juridiction',
    caseType: 'Type d\'affaire',
    complexity: 'Complexité',
    amountHT: 'Montant HT',
    simple: 'Simple',
    moderate: 'Modéré',
    complex: 'Complexe',
    light: 'Léger',
    severe: 'Grave',
  },
  ar: {
    title: 'الحاسبات القانونية الجزائرية',
    subtitle: 'حسابات تلقائية متوافقة مع التشريع الجزائري',
    deadlines: 'الآجال الإجرائية',
    interest: 'الفوائد القانونية',
    damages: 'التعويضات',
    courtFees: 'مصاريف القضاء',
    lawyerFees: 'أتعاب المحامي',
    vat: 'الرسم على القيمة المضافة (19%)',
    calculate: 'احسب',
    result: 'النتيجة',
    startDate: 'تاريخ البداية',
    procedureType: 'نوع الإجراء',
    principal: 'المبلغ الأصلي',
    endDate: 'تاريخ النهاية',
    rate: 'المعدل (%)',
    damageType: 'نوع الضرر',
    severity: 'الخطورة',
    claimAmount: 'مبلغ النزاع',
    courtType: 'نوع المحكمة',
    caseType: 'نوع القضية',
    complexity: 'التعقيد',
    amountHT: 'المبلغ قبل الضريبة',
    simple: 'بسيط',
    moderate: 'متوسط',
    complex: 'معقد',
    light: 'خفيف',
    severe: 'خطير',
  }
};

const AlgerianCalculator: React.FC<AlgerianCalculatorProps> = ({ language }) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'deadlines' | 'interest' | 'damages' | 'courtFees' | 'lawyerFees' | 'vat'>('deadlines');
  const [result, setResult] = useState<any>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR');
  };

  const handleDeadlineCalculation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const startDate = new Date(formData.get('startDate') as string);
    const procedureType = formData.get('procedureType') as string;
    
    const result = calculateProceduralDeadlines(startDate, procedureType);
    setResult(result);
  };

  const handleInterestCalculation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const principal = parseFloat(formData.get('principal') as string);
    const startDate = new Date(formData.get('startDate') as string);
    const endDate = new Date(formData.get('endDate') as string);
    const rate = parseFloat(formData.get('rate') as string) || 3.75;
    
    const result = calculateLegalInterest(principal, startDate, endDate, rate);
    setResult(result);
  };

  const handleDamagesCalculation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const damageType = formData.get('damageType') as string;
    const severity = formData.get('severity') as 'light' | 'moderate' | 'severe';
    
    const result = calculateDamages(damageType, severity);
    setResult(result);
  };

  const handleCourtFeesCalculation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const claimAmount = parseFloat(formData.get('claimAmount') as string);
    const courtType = formData.get('courtType') as 'civil' | 'commercial' | 'administrative';
    
    const result = calculateCourtFees(claimAmount, courtType);
    setResult(result);
  };

  const handleLawyerFeesCalculation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const caseType = formData.get('caseType') as string;
    const complexity = formData.get('complexity') as 'simple' | 'moderate' | 'complex';
    const claimAmount = parseFloat(formData.get('claimAmount') as string) || undefined;
    
    const result = calculateLawyerFees(caseType, complexity, claimAmount);
    setResult(result);
  };

  const handleVATCalculation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amountHT = parseFloat(formData.get('amountHT') as string);
    
    const result = calculateVAT(amountHT);
    setResult(result);
  };

  return (
    <div className={`p-6 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Calculator className="w-8 h-8 text-legal-gold" />
          {t.title}
        </h1>
        <p className="text-slate-400">{t.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'deadlines', label: t.deadlines, icon: Calendar },
          { id: 'interest', label: t.interest, icon: TrendingUp },
          { id: 'damages', label: t.damages, icon: Scale },
          { id: 'courtFees', label: t.courtFees, icon: FileText },
          { id: 'lawyerFees', label: t.lawyerFees, icon: DollarSign },
          { id: 'vat', label: t.vat, icon: Calculator }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              activeTab === tab.id
                ? 'bg-legal-gold text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          {activeTab === 'deadlines' && (
            <form onSubmit={handleDeadlineCalculation} className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">{t.startDate}</label>
                <input
                  type="date"
                  name="startDate"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-2">{t.procedureType}</label>
                <select
                  name="procedureType"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="appel_civil">Appel civil (30 jours)</option>
                  <option value="appel_commercial">Appel commercial (15 jours)</option>
                  <option value="appel_social">Appel social (15 jours)</option>
                  <option value="pourvoi_cassation">Pourvoi en cassation (60 jours)</option>
                  <option value="opposition_jugement">Opposition (10 jours)</option>
                  <option value="refere">Référé (15 jours)</option>
                  <option value="recours_administratif">Recours administratif (60 jours)</option>
                  <option value="appel_penal">Appel pénal (10 jours)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-legal-gold text-white rounded-xl hover:bg-legal-gold/90 transition-colors"
              >
                {t.calculate}
              </button>
            </form>
          )}

          {activeTab === 'interest' && (
            <form onSubmit={handleInterestCalculation} className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">{t.principal}</label>
                <input
                  type="number"
                  name="principal"
                  required
                  placeholder="100000"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-2">{t.startDate}</label>
                <input
                  type="date"
                  name="startDate"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-2">{t.endDate}</label>
                <input
                  type="date"
                  name="endDate"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-2">{t.rate}</label>
                <input
                  type="number"
                  name="rate"
                  step="0.01"
                  defaultValue="3.75"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-legal-gold text-white rounded-xl hover:bg-legal-gold/90 transition-colors"
              >
                {t.calculate}
              </button>
            </form>
          )}

          {activeTab === 'damages' && (
            <form onSubmit={handleDamagesCalculation} className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">{t.damageType}</label>
                <select
                  name="damageType"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="prejudice_corporel">Préjudice corporel</option>
                  <option value="prejudice_moral">Préjudice moral</option>
                  <option value="prejudice_materiel">Préjudice matériel</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-2">{t.severity}</label>
                <select
                  name="severity"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="light">{t.light}</option>
                  <option value="moderate">{t.moderate}</option>
                  <option value="severe">{t.severe}</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-legal-gold text-white rounded-xl hover:bg-legal-gold/90 transition-colors"
              >
                {t.calculate}
              </button>
            </form>
          )}

          {activeTab === 'courtFees' && (
            <form onSubmit={handleCourtFeesCalculation} className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">{t.claimAmount}</label>
                <input
                  type="number"
                  name="claimAmount"
                  required
                  placeholder="500000"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-2">{t.courtType}</label>
                <select
                  name="courtType"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="civil">Civil</option>
                  <option value="commercial">Commercial</option>
                  <option value="administrative">Administratif</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-legal-gold text-white rounded-xl hover:bg-legal-gold/90 transition-colors"
              >
                {t.calculate}
              </button>
            </form>
          )}

          {activeTab === 'lawyerFees' && (
            <form onSubmit={handleLawyerFeesCalculation} className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">{t.caseType}</label>
                <select
                  name="caseType"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="consultation">Consultation</option>
                  <option value="redaction">Rédaction</option>
                  <option value="procedure">Procédure</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-2">{t.complexity}</label>
                <select
                  name="complexity"
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="simple">{t.simple}</option>
                  <option value="moderate">{t.moderate}</option>
                  <option value="complex">{t.complex}</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-2">{t.claimAmount} (optionnel)</label>
                <input
                  type="number"
                  name="claimAmount"
                  placeholder="1000000"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-legal-gold text-white rounded-xl hover:bg-legal-gold/90 transition-colors"
              >
                {t.calculate}
              </button>
            </form>
          )}

          {activeTab === 'vat' && (
            <form onSubmit={handleVATCalculation} className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">{t.amountHT}</label>
                <input
                  type="number"
                  name="amountHT"
                  required
                  placeholder="100000"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-legal-gold text-white rounded-xl hover:bg-legal-gold/90 transition-colors"
              >
                {t.calculate}
              </button>
            </form>
          )}
        </div>

        {/* Result */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">{t.result}</h3>
          {result ? (
            <div className="space-y-4">
              {activeTab === 'deadlines' && (
                <>
                  <div className="p-4 bg-legal-gold/10 border border-legal-gold/30 rounded-lg">
                    <p className="text-legal-gold font-bold text-2xl">{formatDate(result.deadline)}</p>
                    <p className="text-slate-300 mt-2">{result.days} jours</p>
                  </div>
                  <p className="text-slate-400 text-sm">{language === 'ar' ? result.description_ar : result.description}</p>
                </>
              )}
              {activeTab === 'interest' && (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Intérêts:</span>
                      <span className="text-white font-bold">{formatCurrency(result.interest)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Total:</span>
                      <span className="text-legal-gold font-bold text-xl">{formatCurrency(result.total)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Durée:</span>
                      <span className="text-white">{result.days} jours</span>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm font-mono mt-4">{result.formula}</p>
                </>
              )}
              {activeTab === 'damages' && (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Minimum:</span>
                      <span className="text-white">{formatCurrency(result.minAmount)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Maximum:</span>
                      <span className="text-white">{formatCurrency(result.maxAmount)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-legal-gold/10 border border-legal-gold/30 rounded-lg">
                      <span className="text-legal-gold font-semibold">Recommandé:</span>
                      <span className="text-legal-gold font-bold text-xl">{formatCurrency(result.recommended)}</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mt-4">{language === 'ar' ? result.description_ar : result.description}</p>
                </>
              )}
              {activeTab === 'courtFees' && (
                <>
                  <div className="space-y-3">
                    {result.breakdown.map((item: string, index: number) => (
                      <div key={index} className="p-3 bg-slate-900/50 rounded-lg">
                        <p className="text-slate-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {activeTab === 'lawyerFees' && (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Minimum:</span>
                      <span className="text-white">{formatCurrency(result.minFee)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Maximum:</span>
                      <span className="text-white">{formatCurrency(result.maxFee)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-legal-gold/10 border border-legal-gold/30 rounded-lg">
                      <span className="text-legal-gold font-semibold">Recommandé:</span>
                      <span className="text-legal-gold font-bold text-xl">{formatCurrency(result.recommended)}</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mt-4">{language === 'ar' ? result.description_ar : result.description}</p>
                </>
              )}
              {activeTab === 'vat' && (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">Montant HT:</span>
                      <span className="text-white">{formatCurrency(result.amountHT)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">TVA (19%):</span>
                      <span className="text-white">{formatCurrency(result.vat)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-legal-gold/10 border border-legal-gold/30 rounded-lg">
                      <span className="text-legal-gold font-semibold">Total TTC:</span>
                      <span className="text-legal-gold font-bold text-xl">{formatCurrency(result.amountTTC)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <AlertCircle className="w-12 h-12 mb-3" />
              <p>Remplissez le formulaire et cliquez sur Calculer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlgerianCalculator;
