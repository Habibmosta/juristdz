import React, { useState } from 'react';
import { Clock, BarChart2 } from 'lucide-react';
import { Language } from '@/types';
import TimeTracker from './TimeTracker';
import TimeEntriesList from './TimeEntriesList';
import WeeklyTimeReport from './WeeklyTimeReport';
import { timeTrackingService } from '../../services/timeTrackingService';

interface TimeManagementProps {
  language: Language;
  userId: string;
  caseId?: string;
  caseName?: string;
}

const TimeManagement: React.FC<TimeManagementProps> = ({ language, userId, caseId, caseName }) => {
  const [tab, setTab] = useState<'tracker' | 'report'>('tracker');
  const [refreshKey, setRefreshKey] = useState(0);
  const isAr = language === 'ar';

  const handleSaveTimeEntry = async (entry: any) => {
    try {
      const timeEntry = {
        user_id: userId,
        case_id: entry.caseId,
        case_name: entry.caseName,
        description: entry.description,
        start_time: entry.startTime.toISOString(),
        end_time: entry.endTime?.toISOString(),
        duration: entry.duration,
        hourly_rate: entry.hourlyRate,
        is_billable: entry.isBillable,
        activity: entry.activity
      };
      const saved = await timeTrackingService.createTimeEntry(timeEntry);
      if (saved) setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving time entry:', error);
    }
  };

  const tabs = [
    { id: 'tracker' as const, label: isAr ? 'المؤقت والسجل' : 'Chrono & Historique', icon: Clock },
    { id: 'report' as const, label: isAr ? 'تقرير أسبوعي' : 'Rapport Semaine', icon: BarChart2 },
  ];

  return (
    <div className={`p-6 space-y-6 ${isAr ? 'rtl' : 'ltr'}`}>
      {/* Tab switcher */}
      <div className="flex gap-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-legal-gold text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tracker' && (
        <div className="space-y-8">
          <TimeTracker language={language} userId={userId} caseId={caseId} />
          <TimeEntriesList key={refreshKey} language={language} userId={userId} caseId={caseId} />
        </div>
      )}

      {tab === 'report' && (
        <WeeklyTimeReport userId={userId} language={language} />
      )}
    </div>
  );
};

export default TimeManagement;
