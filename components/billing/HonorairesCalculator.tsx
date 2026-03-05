import React, { useState } from 'react';
import { Calculator, DollarSign, X, FileText, Clock, TrendingUp } from 'lucide-react';
import { Language } from '../../types';

interface HonorairesCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const HonorairesCalculator: React.FC<HonorairesCalculatorProps> = ({
  isOpen,
  onClose,
  language
}) => {
  const isAr = language === 'ar';
  const [calculationType, setCalculationType] = useState<'hourly' | 'fixed' | 'percentage'>('hourly');
  const [hourlyRate, setHourlyRate] = useState(15000); // DZD per hour
  const [hours, setHours] = useState(0);
  const [fixedAmount, setFixedAmount] = useState(0);
  const [percentageBase, setPercentageBase] = useState(0);
  const [percentageRate, setPercentageRate] = useState(10);
  const [expenses, setExpenses] = useState(0);
  const [tva, setTva] = useState(19); // TVA algérienne

  const calculateTotal = () => {
    let subtotal = 0;
    
    switch (calculationType) {
      case 'hourly':
        subtotal = hourlyRate * hours;
        break;
      case 'fixed':
        subtotal = fixedAmount;
        break;
      case 'percentage':
        subtotal = (percentageBase * percentageRate) / 100;
        break;
    }
    
    const totalBeforeTax = subtotal + expenses;
    const tvaAmount = (totalBeforeTax * tva) / 100;
    const total = totalBeforeTax + tvaAmount;
    
    return {
      subtotal,
      expenses,
      totalBeforeTax,
      tvaAmount,
      total
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!isOpen) return null;

  const totals = calculateTotal();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Calculator className="text-legal-gold" />
            {isAr ? 'حاسبة الأتعاب' : 'Calculateur d\'Honoraires'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Type de calcul */}
          <div>
            <label className="block text-sm font-bold mb-3">
              {isAr ? 'نوع الحساب' : 'Type de calcul'}
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setCalculationType('hourly')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  calculationType === 'hourly'
                    ? 'border-legal-blue bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-legal-blue'
                }`}
              >
                <Clock className="mx-auto mb-2 text-legal-blue" size={24} />
                <div className="text-sm font-bold">
                  {isAr ? 'بالساعة' : 'Horaire'}
                </div>
              </button>
              
              <button
                onClick={() => setCalculationType('fixed')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  calculationType === 'fixed'
                    ? 'border-legal-blue bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-legal-blue'
                }`}
              >
                <DollarSign className="mx-auto mb-2 text-legal-blue" size={24} />
                <div className="text-sm font-bold">
                  {isAr ? 'مبلغ ثابت' : 'Forfait'}
                </div>
              </button>
              
              <button
                onClick={() => setCalculationType('percentage')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  calculationType === 'percentage'
                    ? 'border-legal-blue bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-legal-blue'
                }`}
              >
                <TrendingUp className="mx-auto mb-2 text-legal-blue" size={24} />
                <div className="text-sm font-bold">
                  {isAr ? 'نسبة مئوية' : 'Pourcentage'}
                </div>
              </button>
            </div>
          </div>

          {/* Calcul horaire */}
          {calculationType === 'hourly' && (
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'السعر بالساعة (دج)' : 'Taux horaire (DZD)'}
                </label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full px-4 py-3 border dark:border-slate-700 rounded-lg dark:bg-slate-900 text-lg font-bold"
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? 'السعر المعتاد: 10,000 - 30,000 دج/ساعة' : 'Tarif habituel: 10,000 - 30,000 DZD/h'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'عدد الساعات' : 'Nombre d\'heures'}
                </label>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-4 py-3 border dark:border-slate-700 rounded-lg dark:bg-slate-900 text-lg font-bold"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
          )}

          {/* Calcul forfaitaire */}
          {calculationType === 'fixed' && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
              <label className="block text-sm font-medium mb-2">
                {isAr ? 'المبلغ الثابت (دج)' : 'Montant forfaitaire (DZD)'}
              </label>
              <input
                type="number"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(Number(e.target.value))}
                className="w-full px-4 py-3 border dark:border-slate-700 rounded-lg dark:bg-slate-900 text-lg font-bold"
                min="0"
                step="10000"
              />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFixedAmount(50000)}
                  className="px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm hover:bg-slate-100"
                >
                  50,000 DZD
                </button>
                <button
                  onClick={() => setFixedAmount(100000)}
                  className="px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm hover:bg-slate-100"
                >
                  100,000 DZD
                </button>
                <button
                  onClick={() => setFixedAmount(200000)}
                  className="px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm hover:bg-slate-100"
                >
                  200,000 DZD
                </button>
                <button
                  onClick={() => setFixedAmount(500000)}
                  className="px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm hover:bg-slate-100"
                >
                  500,000 DZD
                </button>
              </div>
            </div>
          )}

          {/* Calcul au pourcentage */}
          {calculationType === 'percentage' && (
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'المبلغ الأساسي (دج)' : 'Montant de base (DZD)'}
                </label>
                <input
                  type="number"
                  value={percentageBase}
                  onChange={(e) => setPercentageBase(Number(e.target.value))}
                  className="w-full px-4 py-3 border dark:border-slate-700 rounded-lg dark:bg-slate-900 text-lg font-bold"
                  min="0"
                  step="10000"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? 'مثال: قيمة العقد، مبلغ النزاع' : 'Ex: valeur du contrat, montant du litige'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'النسبة المئوية (%)' : 'Pourcentage (%)'}
                </label>
                <input
                  type="number"
                  value={percentageRate}
                  onChange={(e) => setPercentageRate(Number(e.target.value))}
                  className="w-full px-4 py-3 border dark:border-slate-700 rounded-lg dark:bg-slate-900 text-lg font-bold"
                  min="0"
                  max="100"
                  step="0.5"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? 'النسبة المعتادة: 5% - 15%' : 'Taux habituel: 5% - 15%'}
                </p>
              </div>
            </div>
          )}

          {/* Frais et débours */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'المصاريف والنفقات (دج)' : 'Frais et débours (DZD)'}
            </label>
            <input
              type="number"
              value={expenses}
              onChange={(e) => setExpenses(Number(e.target.value))}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-lg dark:bg-slate-800"
              min="0"
              step="1000"
            />
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'مثال: رسوم التسجيل، نفقات التنقل، إلخ' : 'Ex: frais de greffe, déplacements, etc.'}
            </p>
          </div>

          {/* TVA */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'الرسم على القيمة المضافة (%)' : 'TVA (%)'}
            </label>
            <input
              type="number"
              value={tva}
              onChange={(e) => setTva(Number(e.target.value))}
              className="w-full px-4 py-3 border dark:border-slate-700 rounded-lg dark:bg-slate-800"
              min="0"
              max="100"
            />
            <p className="text-xs text-slate-500 mt-1">
              {isAr ? 'الرسم القانوني في الجزائر: 19%' : 'TVA légale en Algérie: 19%'}
            </p>
          </div>

          {/* Résumé */}
          <div className="bg-gradient-to-br from-legal-blue to-legal-blue/80 text-white rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-lg mb-4">
              {isAr ? 'الملخص' : 'Résumé'}
            </h3>
            
            <div className="flex justify-between items-center pb-3 border-b border-white/20">
              <span>{isAr ? 'الأتعاب' : 'Honoraires'}</span>
              <span className="font-bold text-xl">{formatCurrency(totals.subtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b border-white/20">
              <span>{isAr ? 'المصاريف' : 'Frais'}</span>
              <span className="font-bold text-xl">{formatCurrency(totals.expenses)}</span>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b border-white/20">
              <span>{isAr ? 'المجموع قبل الرسم' : 'Sous-total HT'}</span>
              <span className="font-bold text-xl">{formatCurrency(totals.totalBeforeTax)}</span>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b border-white/20">
              <span>{isAr ? `الرسم (${tva}%)` : `TVA (${tva}%)`}</span>
              <span className="font-bold text-xl">{formatCurrency(totals.tvaAmount)}</span>
            </div>
            
            <div className="flex justify-between items-center pt-3">
              <span className="text-2xl font-bold">{isAr ? 'المجموع الكلي' : 'TOTAL TTC'}</span>
              <span className="font-black text-3xl">{formatCurrency(totals.total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                alert(isAr ? 'سيتم إضافة ميزة إنشاء الفاتورة قريباً' : 'Génération de facture à venir');
              }}
              className="flex-1 px-6 py-3 bg-legal-gold text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-legal-gold/90"
            >
              <FileText size={20} />
              {isAr ? 'إنشاء فاتورة' : 'Générer facture'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HonorairesCalculator;
