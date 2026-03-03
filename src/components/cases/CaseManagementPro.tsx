import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, Search, Filter, Calendar, AlertCircle, CheckCircle, Clock, FileText, Users } from 'lucide-react';
import { CaseService } from '../../services/caseService';
import type { Case, CaseStats } from '../../types/case.types';
import { useAuth } from '../../hooks/useAuth';

export const CaseManagementPro: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [caseStats, setCaseStats] = useState<CaseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadCases();
      loadStats();
    }
  }, [user]);

  const loadCases = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await CaseService.getCases(user.id);
      setCases(data);
    } catch (error) {
      console.error('Erreur chargement dossiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const [stats, global] = await Promise.all([
        CaseService.getCaseStats(user.id),
        CaseService.getGlobalStats(user.id)
      ]);
      setCaseStats(stats);
      setGlobalStats(global);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.case_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || c.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nouveau': return 'bg-blue-500/20 text-blue-400';
      case 'en_cours': return 'bg-green-500/20 text-green-400';
      case 'audience': return 'bg-purple-500/20 text-purple-400';
      case 'jugement': return 'bg-amber-500/20 text-amber-400';
      case 'cloture': return 'bg-slate-500/20 text-slate-400';
      case 'archive': return 'bg-slate-700 text-slate-500';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'text-red-400';
      case 'haute': return 'text-orange-400';
      case 'normale': return 'text-blue-400';
      case 'basse': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'nouveau': 'Nouveau',
      'en_cours': 'En cours',
      'audience': 'Audience',
      'jugement': 'Jugement',
      'cloture': 'Clôturé',
      'archive': 'Archivé'
    };
    return labels[status] || status;
  };

  const getCaseTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'civil': 'Civil',
      'penal': 'Pénal',
      'commercial': 'Commercial',
      'administratif': 'Administratif',
      'famille': 'Famille',
      'travail': 'Travail',
      'autre': 'Autre'
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <FolderOpen className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gestion des Dossiers</h1>
              <p className="text-slate-400">Comme Clio - Dossiers complets avec documents et timeline</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau Dossier
          </button>
        </div>

        {/* Statistiques Globales */}
        {globalStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-cyan-500/10 rounded-lg">
                  <FolderOpen className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="text-2xl font-bold">{globalStats.totalCases}</span>
              </div>
              <p className="text-slate-400 text-sm">Total Dossiers</p>
              <p className="text-green-400 text-xs mt-1">{globalStats.activeCases} actifs</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-2xl font-bold">{globalStats.closedCases}</span>
              </div>
              <p className="text-slate-400 text-sm">Dossiers Clôturés</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-2xl font-bold">{globalStats.upcomingHearings}</span>
              </div>
              <p className="text-slate-400 text-sm">Audiences à Venir</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <span className="text-2xl font-bold">{globalStats.urgentCases}</span>
              </div>
              <p className="text-slate-400 text-sm">Dossiers Urgents</p>
            </div>
          </div>
        )}

        {/* Barre de recherche et filtres */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un dossier par titre ou numéro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-400" />
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="nouveau">Nouveau</option>
              <option value="en_cours">En cours</option>
              <option value="audience">Audience</option>
              <option value="jugement">Jugement</option>
              <option value="cloture">Clôturé</option>
              <option value="archive">Archivé</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Toutes les priorités</option>
              <option value="urgente">Urgente</option>
              <option value="haute">Haute</option>
              <option value="normale">Normale</option>
              <option value="basse">Basse</option>
            </select>

            <span className="text-sm text-slate-400 ml-auto">
              {filteredCases.length} dossier{filteredCases.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Liste des dossiers */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-slate-400">Chargement...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800">
            <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun dossier</h3>
            <p className="text-slate-400 mb-6">Créez votre premier dossier</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 transition-colors"
            >
              Créer un Dossier
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredCases.map(caseItem => {
              const stats = caseStats.find(s => s.id === caseItem.id);
              return (
                <div
                  key={caseItem.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-cyan-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{caseItem.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                          {getStatusLabel(caseItem.status)}
                        </span>
                        <span className={`text-sm font-medium ${getPriorityColor(caseItem.priority)}`}>
                          {caseItem.priority === 'urgente' && '🔴'}
                          {caseItem.priority === 'haute' && '🟠'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="font-mono">{caseItem.case_number}</span>
                        <span>•</span>
                        <span>{getCaseTypeLabel(caseItem.case_type)}</span>
                        {caseItem.court_name && (
                          <>
                            <span>•</span>
                            <span>{caseItem.court_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {caseItem.next_hearing_date && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 rounded-lg">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <div className="text-sm">
                          <p className="text-purple-400 font-medium">Prochaine audience</p>
                          <p className="text-slate-400">{new Date(caseItem.next_hearing_date).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {caseItem.description && (
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{caseItem.description}</p>
                  )}

                  {/* Statistiques du dossier */}
                  {stats && (
                    <div className="flex items-center gap-6 pt-4 border-t border-slate-800">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{stats.total_documents}</span>
                        <span className="text-slate-500">documents</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{stats.total_events}</span>
                        <span className="text-slate-500">événements</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{stats.completed_tasks}/{stats.total_tasks}</span>
                        <span className="text-slate-500">tâches</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{stats.total_clients}</span>
                        <span className="text-slate-500">clients</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
