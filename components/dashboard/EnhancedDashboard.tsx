import React, { useState } from 'react';
import { Language } from '../../types';
import DashboardKPIs from './DashboardKPIs';
import DashboardCharts from './DashboardCharts';
import TopClients from './TopClients';
import InactiveCases from './InactiveCases';
import { BarChart3, Users, AlertCircle, TrendingUp } from 'lucide-react';

interface EnhancedDashboardProps {
  userId: string;
  language: Language;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({ userId, language }) => {
  const [activeView, setActiveView] = useState<'overview' | 'charts' | 'clients' | 'alerts'>('overview');
  const isAr = language === 'ar';

  return (
    <div className="p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {isAr ? 'لوحة التحكم' : 'Tableau de Bord'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isAr ? 'نظرة عامة على نشاطك' : 'Vue d\'ensemble de votre activité'}
          </p>
        </div>

        {/* View Selector */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveView('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeView === 'overview'
                ? 'bg-white dark:bg-slate-700 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <TrendingUp size={18} />
            <span className="text-sm font-medium">{isAr ? 'نظرة عامة' : 'Vue d\'ensemble'}</span>
          </button>
          <button
            onClick={() => setActiveView('charts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeView === 'charts'
                ? 'bg-white dark:bg-slate-700 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <BarChart3 size={18} />
            <span className="text-sm font-medium">{isAr ? 'الرسوم البيانية' : 'Graphiques'}</span>
          </button>
          <button
            onClick={() => setActiveView('clients')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeView === 'clients'
                ? 'bg-white dark:bg-slate-700 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Users size={18} />
            <span className="text-sm font-medium">{isAr ? 'العملاء' : 'Clients'}</span>
          </button>
          <button
            onClick={() => setActiveView('alerts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeView === 'alerts'
                ? 'bg-white dark:bg-slate-700 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{isAr ? 'التنبيهات' : 'Alertes'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          <DashboardKPIs userId={userId} language={language} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopClients userId={userId} language={language} />
            <InactiveCases userId={userId} language={language} />
          </div>
        </div>
      )}

      {activeView === 'charts' && (
        <DashboardCharts userId={userId} language={language} />
      )}

      {activeView === 'clients' && (
        <div className="grid grid-cols-1 gap-6">
          <TopClients userId={userId} language={language} showAll />
        </div>
      )}

      {activeView === 'alerts' && (
        <div className="grid grid-cols-1 gap-6">
          <InactiveCases userId={userId} language={language} showAll />
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboard;
