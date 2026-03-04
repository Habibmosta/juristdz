import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Language } from '../../types';
import TimeTracker from './TimeTracker';
import TimeEntriesList from './TimeEntriesList';
import { timeTrackingService } from '../../services/timeTrackingService';

interface TimeManagementProps {
  language: Language;
  userId: string;
  caseId?: string;
  caseName?: string;
}

const TimeManagement: React.FC<TimeManagementProps> = ({ 
  language, 
  userId, 
  caseId, 
  caseName 
}) => {
  const [refreshKey, setRefreshKey] = useState(0);

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
      
      if (saved) {
        // Refresh the list
        setRefreshKey(prev => prev + 1);
        
        // Show success notification
        console.log('Time entry saved successfully');
      }
    } catch (error) {
      console.error('Error saving time entry:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Time Tracker */}
      <TimeTracker
        language={language}
        userId={userId}
        caseId={caseId}
        caseName={caseName}
        onSave={handleSaveTimeEntry}
      />

      {/* Time Entries List */}
      <TimeEntriesList
        key={refreshKey}
        language={language}
        userId={userId}
        caseId={caseId}
      />
    </div>
  );
};

export default TimeManagement;
