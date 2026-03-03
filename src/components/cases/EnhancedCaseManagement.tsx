import React, { useState, useEffect } from 'react';
import { Case, Language } from '../../types';
import { 
  Briefcase, Plus, Search, Filter, MoreVertical, ChevronRight, 
  Clock, User, Calendar, TrendingUp, AlertCircle, Grid, List,
  SortAsc, Tag, DollarSign
} from 'lucide-react';
import { CaseService } from '../../services/caseService';
import CaseDetailView from './CaseDetailView';

interface EnhancedCaseManagementProps {
  language: Language;
  userId: string;
}

const EnhancedCaseManagement: React.FC<EnhancedCaseManagementProps> = ({ language, userId }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const isAr = language === 'ar';

  useEffect(() => {
    loadCases();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [cases, searchTerm, filterStatus, filterPriority]);

  const loadCases = async () => {
    setLoading(true);
    try {
      const loadedCases = await CaseService.getCases(userId);
      setCases(loadedCases);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cases];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(c => c.priority === filterPriority);
    }

    setFilteredCases(filtered);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      default: return '⚪';
    }
  };

  // If a case is selected, show detail view
  if (selectedCaseId) {
    return (
      <CaseDetailView
        caseId={selectedCaseId}
        language={language}
        userId={userId}
        onBack={() => setSelectedCaseId(null)}
      />
    );
  }

  // Statistics
  const stats = {
    total: cases.length,
    active: cases.filter(c => c.status === 'active').length,
    urgent: cases.filter(c => c.priority === 'urgent').length,
    thisMonth: cases.filter(c => {
      const caseDate = new Date(c.createdAt);
      const now = new Date();
      return caseDate.getMonth() === now.getMonth() && caseDate.getFullYear() === now.getFullYear();
    }).length
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 md:p-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-slate-100">
              {isAr ? 'إدارة الملفات' : 'Gestion des Dossiers'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr ? 'إدارة شاملة لملفات العملاء' : 'Gestion complète de vos dossiers clients'}
            </p>
          </div>
          <button 
            onClick={() => {/* TODO: Open create case modal */}}
            className="px-6 py-3 bg-legal-gold text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-legal-gold/20 hover:bg-legal-gold/90 active:scale-95 transition-all"
          >
            <Plus size={20} />
            {isAr ? 'ملف جديد' : 'Nouveau Dossier'}
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{isAr ? 'المجموع' : 'Total'}</span>
              <Briefcase size={20} className="text-legal-gold" />
            </div>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{isAr ? 'نشط' : 'Actifs'}</span>
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{isAr ? 'عاجل' : 'Urgents'}</span>
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.urgent}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{isAr ? 'هذا الشهر' : 'Ce mois'}</span>
              <Calendar size={20} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.thisMonth}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder={isAr ? 'البحث عن ملف أو عميل...' : 'Rechercher un dossier ou client...'} 
                className="bg-transparent border-none outline-none w-full text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl border transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-legal-gold text-white border-legal-gold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl border transition-colors ${
                  viewMode === 'list'
                    ? 'bg-legal-gold text-white border-legal-gold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <List size={18} />
              </button>
            </div>

            {/* Filters Button */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 text-slate-500 hover:text-legal-gold transition-colors"
            >
              <Filter size={18} />
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t dark:border-slate-800 flex flex-wrap gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-2 block">{isAr ? 'الحالة' : 'Statut'}</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 text-sm"
                >
                  <option value="all">{isAr ? 'الكل' : 'Tous'}</option>
                  <option value="active">{isAr ? 'نشط' : 'Actifs'}</option>
                  <option value="archived">{isAr ? 'مؤرشف' : 'Archivés'}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-2 block">{isAr ? 'الأولوية' : 'Priorité'}</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 text-sm"
                >
                  <option value="all">{isAr ? 'الكل' : 'Toutes'}</option>
                  <option value="urgent">{isAr ? 'عاجل' : 'Urgent'}</option>
                  <option value="high">{isAr ? 'عالي' : 'Élevée'}</option>
                  <option value="medium">{isAr ? 'متوسط' : 'Moyenne'}</option>
                  <option value="low">{isAr ? 'منخفض' : 'Basse'}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Cases Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-gold"></div>
          </div>
        ) : filteredCases.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredCases.map(c => (
              <div 
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className={`group bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 transition-all cursor-pointer hover:shadow-xl hover:scale-[1.02] ${
                  viewMode === 'list' ? 'p-4' : 'p-6'
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:bg-legal-gold/10 group-hover:text-legal-gold transition-colors">
                        <Briefcase size={24} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getPriorityIcon(c.priority)}</span>
                        <button className="p-1 text-slate-300 hover:text-slate-600 dark:hover:text-slate-100">
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-1 dark:text-white line-clamp-1">{c.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                      <User size={12} className="text-legal-gold" />
                      {c.clientName}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-6 h-8 italic">
                      {c.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t dark:border-slate-800">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <Clock size={12} />
                        {c.createdAt.toLocaleDateString()}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.status.toUpperCase()}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <Briefcase size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{c.title}</h3>
                      <p className="text-sm text-slate-500">{c.clientName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getPriorityIcon(c.priority)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.status.toUpperCase()}
                      </span>
                      <ChevronRight size={20} className="text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="col-span-full py-20 text-center text-slate-400">
            <Briefcase size={60} className="mx-auto mb-4 opacity-20" />
            <p>{isAr ? 'لا توجد ملفات' : 'Aucun dossier trouvé'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCaseManagement;
