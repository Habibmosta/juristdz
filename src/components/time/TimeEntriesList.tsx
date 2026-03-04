import React, { useState, useEffect } from 'react';
import { Clock, Calendar, DollarSign, FileText, Trash2, Edit2, Download, Filter } from 'lucide-react';
import { Language } from '../../types';
import { timeTrackingService, TimeEntry, TimeStats } from '../../services/timeTrackingService';

interface TimeEntriesListProps {
  language: Language;
  userId: string;
  caseId?: string;
}

const TimeEntriesList: React.FC<TimeEntriesListProps> = ({ language, userId, caseId }) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [stats, setStats] = useState<TimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'billable' | 'nonBillable'>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  const t = {
    fr: {
      title: 'Historique du Temps',
      stats: 'Statistiques',
      totalHours: 'Total Heures',
      billableHours: 'Heures Facturables',
      nonBillableHours: 'Heures Non Facturables',
      totalAmount: 'Montant Total',
      entries: 'Entrées',
      filter: 'Filtrer',
      all: 'Tout',
      billable: 'Facturable',
      nonBillable: 'Non Facturable',
      dateRange: 'Période',
      week: 'Cette Semaine',
      month: 'Ce Mois',
      year: 'Cette Année',
      allTime: 'Tout',
      export: 'Exporter CSV',
      noEntries: 'Aucune entrée de temps',
      date: 'Date',
      case: 'Dossier',
      description: 'Description',
      activity: 'Activité',
      duration: 'Durée',
      rate: 'Taux',
      amount: 'Montant',
      actions: 'Actions',
      delete: 'Supprimer',
      edit: 'Modifier',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer cette entrée?',
      activities: {
        consultation: 'Consultation',
        research: 'Recherche',
        drafting: 'Rédaction',
        hearing: 'Audience',
        meeting: 'Réunion',
        phone: 'Appel',
        email: 'Email',
        travel: 'Déplacement',
        other: 'Autre'
      }
    },
    ar: {
      title: 'سجل الوقت',
      stats: 'إحصائيات',
      totalHours: 'إجمالي الساعات',
      billableHours: 'ساعات قابلة للفوترة',
      nonBillableHours: 'ساعات غير قابلة للفوترة',
      totalAmount: 'المبلغ الإجمالي',
      entries: 'إدخالات',
      filter: 'تصفية',
      all: 'الكل',
      billable: 'قابل للفوترة',
      nonBillable: 'غير قابل للفوترة',
      dateRange: 'الفترة',
      week: 'هذا الأسبوع',
      month: 'هذا الشهر',
      year: 'هذه السنة',
      allTime: 'الكل',
      export: 'تصدير CSV',
      noEntries: 'لا توجد إدخالات وقت',
      date: 'التاريخ',
      case: 'الملف',
      description: 'الوصف',
      activity: 'النشاط',
      duration: 'المدة',
      rate: 'السعر',
      amount: 'المبلغ',
      actions: 'إجراءات',
      delete: 'حذف',
      edit: 'تعديل',
      confirmDelete: 'هل أنت متأكد من حذف هذا الإدخال؟',
      activities: {
        consultation: 'استشارة',
        research: 'بحث',
        drafting: 'صياغة',
        hearing: 'جلسة',
        meeting: 'اجتماع',
        phone: 'مكالمة',
        email: 'بريد إلكتروني',
        travel: 'تنقل',
        other: 'أخرى'
      }
    }
  };

  const text = t[language];

  useEffect(() => {
    loadData();
  }, [userId, caseId, filter, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters: any = { caseId };

      // Date range filter
      const now = new Date();
      if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filters.startDate = weekAgo;
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filters.startDate = monthAgo;
      } else if (dateRange === 'year') {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        filters.startDate = yearAgo;
      }

      // Billable filter
      if (filter === 'billable') {
        filters.isBillable = true;
      } else if (filter === 'nonBillable') {
        filters.isBillable = false;
      }

      const [entriesData, statsData] = await Promise.all([
        timeTrackingService.getTimeEntries(userId, filters),
        timeTrackingService.getTimeStats(userId, filters)
      ]);

      setEntries(entriesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading time data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(text.confirmDelete)) {
      const success = await timeTrackingService.deleteTimeEntry(id);
      if (success) {
        loadData();
      }
    }
  };

  const handleExport = () => {
    const filename = `time_entries_${new Date().toISOString().split('T')[0]}.csv`;
    timeTrackingService.downloadCSV(entries, filename);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-slate-400">{text.totalHours}</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.totalHours.toFixed(1)}h
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-sm text-slate-400">{text.billableHours}</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.billableHours.toFixed(1)}h
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-400">{text.nonBillableHours}</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.nonBillableHours.toFixed(1)}h
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-legal-gold" />
              <span className="text-sm text-slate-400">{text.totalAmount}</span>
            </div>
            <div className="text-2xl font-bold text-legal-gold">
              {stats.totalAmount.toLocaleString('fr-DZ')} DA
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">{text.filter}:</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-legal-gold text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {text.all}
            </button>
            <button
              onClick={() => setFilter('billable')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'billable'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {text.billable}
            </button>
            <button
              onClick={() => setFilter('nonBillable')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'nonBillable'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {text.nonBillable}
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-legal-gold focus:border-transparent"
            >
              <option value="week">{text.week}</option>
              <option value="month">{text.month}</option>
              <option value="year">{text.year}</option>
              <option value="all">{text.allTime}</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {text.export}
          </button>
        </div>
      </div>

      {/* Entries List */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">{text.noEntries}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {text.date}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {text.case}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {text.activity}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {text.description}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {text.duration}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {text.amount}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {text.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {entries.map((entry) => {
                  const amount = entry.is_billable ? (entry.duration / 60) * entry.hourly_rate : 0;
                  
                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                        {new Date(entry.start_time).toLocaleDateString('fr-DZ')}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          {entry.case_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs">
                          {text.activities[entry.activity as keyof typeof text.activities] || entry.activity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate">
                        {entry.description}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                        {formatDuration(entry.duration)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {entry.is_billable ? (
                          <span className="text-green-400 font-medium">
                            {amount.toLocaleString('fr-DZ')} DA
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1 hover:bg-red-900/20 rounded text-red-400 hover:text-red-300 transition-colors"
                            title={text.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeEntriesList;
