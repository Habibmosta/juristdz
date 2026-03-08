/**
 * MODAL D'AFFICHAGE DES LIMITES ATTEINTES
 * 
 * Ce composant affiche un modal adapté selon le type de limite atteinte
 * avec des messages clairs et des actions appropriées
 */

import React from 'react';
import { X, AlertTriangle, Clock, CreditCard, Database, Zap, TrendingUp } from 'lucide-react';
import { LimitCheckResult, LimitType, LimitStatus } from '../services/usageLimitService';
import { Language } from '../types';

interface LimitReachedModalProps {
  limitResult: LimitCheckResult;
  language: Language;
  onClose: () => void;
  onUpgrade: () => void;
}

const LimitReachedModal: React.FC<LimitReachedModalProps> = ({
  limitResult,
  language,
  onClose,
  onUpgrade
}) => {
  
  // Icône selon le type de limite
  const getIcon = () => {
    switch (limitResult.limitType) {
      case LimitType.CREDITS:
        return <CreditCard className="text-red-500" size={48} />;
      case LimitType.EXPIRATION:
        return <Clock className="text-orange-500" size={48} />;
      case LimitType.DAILY_QUOTA:
      case LimitType.MONTHLY_QUOTA:
        return <TrendingUp className="text-yellow-500" size={48} />;
      case LimitType.STORAGE:
        return <Database className="text-purple-500" size={48} />;
      case LimitType.API_CALLS:
        return <Zap className="text-blue-500" size={48} />;
      default:
        return <AlertTriangle className="text-red-500" size={48} />;
    }
  };
  
  // Couleur selon le statut
  const getStatusColor = () => {
    switch (limitResult.status) {
      case LimitStatus.WARNING:
        return 'bg-yellow-50 border-yellow-200';
      case LimitStatus.CRITICAL:
        return 'bg-orange-50 border-orange-200';
      case LimitStatus.EXCEEDED:
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };
  
  // Titre selon le statut
  const getTitle = () => {
    if (limitResult.status === LimitStatus.EXCEEDED) {
      return language === 'ar' ? 'تم الوصول إلى الحد الأقصى' : 'Limite Atteinte';
    } else if (limitResult.status === LimitStatus.CRITICAL) {
      return language === 'ar' ? 'تحذير حرج' : 'Avertissement Critique';
    } else {
      return language === 'ar' ? 'تنبيه' : 'Avertissement';
    }
  };
  
  // Texte du bouton d'action
  const getActionButtonText = () => {
    if (limitResult.action.type === 'block') {
      return language === 'ar' ? 'ترقية الآن' : 'Passer au Plan Pro';
    } else {
      return language === 'ar' ? 'عرض الخطط' : 'Voir les Plans';
    }
  };
  
  // Avantages du plan Pro
  const proFeatures = language === 'ar' ? [
    '500 نقطة شهرياً',
    '100 طلب يومي',
    '10 جيجابايت تخزين',
    'وصول غير محدود للميزات',
    'دعم ذو أولوية',
    'تحليلات متقدمة'
  ] : [
    '500 crédits mensuels',
    '100 requêtes par jour',
    '10 GB de stockage',
    'Accès illimité aux fonctionnalités',
    'Support prioritaire',
    'Analyses avancées'
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border-2 ${getStatusColor()} overflow-hidden`}>
        
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-md">
              {getIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {getTitle()}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {language === 'ar' ? 'يرجى اتخاذ إجراء للمتابعة' : 'Veuillez prendre une action pour continuer'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Message principal */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {limitResult.message[language]}
            </p>
          </div>
          
          {/* Barre de progression */}
          {limitResult.limit !== -1 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{language === 'ar' ? 'الاستخدام' : 'Utilisation'}</span>
                <span>
                  {limitResult.current} / {limitResult.limit} ({Math.round(limitResult.percentage)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    limitResult.percentage >= 90 ? 'bg-red-500' :
                    limitResult.percentage >= 70 ? 'bg-orange-500' :
                    limitResult.percentage >= 50 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(limitResult.percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Avantages du plan Pro (si modal de blocage) */}
          {limitResult.action.showUpgradeModal && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" />
                {language === 'ar' ? 'مزايا الخطة الاحترافية' : 'Avantages du Plan Pro'}
              </h3>
              <ul className="grid grid-cols-2 gap-3">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Comparaison des plans */}
          {limitResult.action.showUpgradeModal && (
            <div className="grid grid-cols-3 gap-4">
              
              {/* Plan Free */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                  {language === 'ar' ? 'مجاني' : 'Free'}
                </h4>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-3">0 DA</p>
                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <li>✓ 50 {language === 'ar' ? 'نقطة' : 'crédits'}</li>
                  <li>✓ 10 {language === 'ar' ? 'طلب/يوم' : 'req/jour'}</li>
                  <li>✓ 1 GB</li>
                </ul>
              </div>
              
              {/* Plan Pro */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-4 border-2 border-blue-400 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-bl-lg">
                  {language === 'ar' ? 'موصى به' : 'Recommandé'}
                </div>
                <h4 className="font-bold text-white mb-2">
                  {language === 'ar' ? 'احترافي' : 'Pro'}
                </h4>
                <p className="text-2xl font-bold text-white mb-3">
                  4,900 DA<span className="text-sm">/mois</span>
                </p>
                <ul className="space-y-2 text-xs text-blue-100">
                  <li>✓ 500 {language === 'ar' ? 'نقطة' : 'crédits'}</li>
                  <li>✓ 100 {language === 'ar' ? 'طلب/يوم' : 'req/jour'}</li>
                  <li>✓ 10 GB</li>
                </ul>
              </div>
              
              {/* Plan Cabinet */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                  {language === 'ar' ? 'مكتب' : 'Cabinet'}
                </h4>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-3">
                  14,900 DA<span className="text-sm">/mois</span>
                </p>
                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <li>✓ {language === 'ar' ? 'غير محدود' : 'Illimité'}</li>
                  <li>✓ {language === 'ar' ? 'غير محدود' : 'Illimité'}</li>
                  <li>✓ 100 GB</li>
                </ul>
              </div>
              
            </div>
          )}
          
        </div>
        
        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
          >
            {language === 'ar' ? 'إغلاق' : 'Fermer'}
          </button>
          <button
            onClick={onUpgrade}
            className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            {getActionButtonText()}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default LimitReachedModal;
