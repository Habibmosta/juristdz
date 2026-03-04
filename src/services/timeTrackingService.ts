import { supabase } from '../lib/supabase';

export interface TimeEntry {
  id: string;
  user_id: string;
  case_id: string;
  case_name: string;
  description: string;
  start_time: string;
  end_time?: string;
  duration: number; // in minutes
  hourly_rate: number;
  is_billable: boolean;
  activity: string;
  created_at: string;
  updated_at: string;
}

export interface TimeStats {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  totalAmount: number;
  entriesCount: number;
}

class TimeTrackingService {
  /**
   * Create a new time entry
   */
  async createTimeEntry(entry: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>): Promise<TimeEntry | null> {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert([entry])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating time entry:', error);
      return null;
    }
  }

  /**
   * Get time entries for a user
   */
  async getTimeEntries(userId: string, filters?: {
    caseId?: string;
    startDate?: Date;
    endDate?: Date;
    isBillable?: boolean;
  }): Promise<TimeEntry[]> {
    try {
      let query = supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (filters?.caseId) {
        query = query.eq('case_id', filters.caseId);
      }

      if (filters?.startDate) {
        query = query.gte('start_time', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('start_time', filters.endDate.toISOString());
      }

      if (filters?.isBillable !== undefined) {
        query = query.eq('is_billable', filters.isBillable);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching time entries:', error);
      return [];
    }
  }

  /**
   * Get time entry by ID
   */
  async getTimeEntry(id: string): Promise<TimeEntry | null> {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching time entry:', error);
      return null;
    }
  }

  /**
   * Update a time entry
   */
  async updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry | null> {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating time entry:', error);
      return null;
    }
  }

  /**
   * Delete a time entry
   */
  async deleteTimeEntry(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting time entry:', error);
      return false;
    }
  }

  /**
   * Get time statistics for a user
   */
  async getTimeStats(userId: string, filters?: {
    caseId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<TimeStats> {
    try {
      const entries = await this.getTimeEntries(userId, filters);

      const stats: TimeStats = {
        totalHours: 0,
        billableHours: 0,
        nonBillableHours: 0,
        totalAmount: 0,
        entriesCount: entries.length
      };

      entries.forEach(entry => {
        const hours = entry.duration / 60;
        stats.totalHours += hours;

        if (entry.is_billable) {
          stats.billableHours += hours;
          stats.totalAmount += (hours * entry.hourly_rate);
        } else {
          stats.nonBillableHours += hours;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error calculating time stats:', error);
      return {
        totalHours: 0,
        billableHours: 0,
        nonBillableHours: 0,
        totalAmount: 0,
        entriesCount: 0
      };
    }
  }

  /**
   * Get time entries grouped by case
   */
  async getTimeEntriesByCase(userId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<Map<string, TimeEntry[]>> {
    try {
      const entries = await this.getTimeEntries(userId, filters);
      const grouped = new Map<string, TimeEntry[]>();

      entries.forEach(entry => {
        const caseId = entry.case_id;
        if (!grouped.has(caseId)) {
          grouped.set(caseId, []);
        }
        grouped.get(caseId)!.push(entry);
      });

      return grouped;
    } catch (error) {
      console.error('Error grouping time entries:', error);
      return new Map();
    }
  }

  /**
   * Get time entries grouped by activity
   */
  async getTimeEntriesByActivity(userId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<Map<string, TimeEntry[]>> {
    try {
      const entries = await this.getTimeEntries(userId, filters);
      const grouped = new Map<string, TimeEntry[]>();

      entries.forEach(entry => {
        const activity = entry.activity;
        if (!grouped.has(activity)) {
          grouped.set(activity, []);
        }
        grouped.get(activity)!.push(entry);
      });

      return grouped;
    } catch (error) {
      console.error('Error grouping time entries by activity:', error);
      return new Map();
    }
  }

  /**
   * Export time entries to CSV
   */
  exportToCSV(entries: TimeEntry[]): string {
    const headers = [
      'Date',
      'Case',
      'Description',
      'Activity',
      'Duration (hours)',
      'Hourly Rate',
      'Billable',
      'Amount'
    ];

    const rows = entries.map(entry => {
      const hours = (entry.duration / 60).toFixed(2);
      const amount = entry.is_billable ? (parseFloat(hours) * entry.hourly_rate).toFixed(2) : '0';
      
      return [
        new Date(entry.start_time).toLocaleDateString('fr-DZ'),
        entry.case_name,
        entry.description,
        entry.activity,
        hours,
        entry.hourly_rate.toString(),
        entry.is_billable ? 'Yes' : 'No',
        amount
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Download CSV file
   */
  downloadCSV(entries: TimeEntry[], filename: string = 'time_entries.csv') {
    const csv = this.exportToCSV(entries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Get unbilled time entries for a case
   */
  async getUnbilledTimeEntries(userId: string, caseId: string): Promise<TimeEntry[]> {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('case_id', caseId)
        .eq('is_billable', true)
        .is('invoice_id', null) // Not yet invoiced
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unbilled time entries:', error);
      return [];
    }
  }

  /**
   * Mark time entries as billed
   */
  async markAsBilled(entryIds: string[], invoiceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({ invoice_id: invoiceId })
        .in('id', entryIds);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking entries as billed:', error);
      return false;
    }
  }
}

export const timeTrackingService = new TimeTrackingService();
