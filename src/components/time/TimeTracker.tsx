import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, DollarSign, Calendar, FileText, TrendingUp } from 'lucide-react';
import { InvoiceService } from '../../services/invoiceService';
import type { TimeEntry } from '../../types/client.types';
import { useAuth } from '../../hooks/useAuth';

export const TimeTracker: React.FC = () => {
  const { user } = useAuth();
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Formulaire pour démarrer un timer
  const [timerForm, setTimerForm] = useState({
    description: '',
    activity_type: 'consultation' as const,
    hourly_rate: 15000, // 15 000 DA/heure par défaut
    billable: true
  });

  useEffect(() => {
    if (user) {
      loadTimeEntries();
      loadStats();
      checkActiveTimer();
    }
  }, [user]);

  // Mettre à jour le chronomètre chaque seconde
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeTimer) {
      interval = setInterval(() => {
        const start = new Date(activeTimer.start_time).getTime();
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - start) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  const checkActiveTimer = async () => {
    if (!user) return;
    
    try {
      const entries = await InvoiceService.getTimeEntries(user.id);
      const active = entries.find(e => !e.end_time);
      if (active) {
        setActiveTimer(active);
        const start = new Date(active.start_time).getTime();
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - start) / 1000));
      }
    } catch (error) {
      console.error('Erreur vérification timer actif:', error);
    }
  };

  const loadTimeEntries = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const entries = await InvoiceService.getTimeEntries(user.id);
      setTimeEntries(entries);
    } catch (error) {
      console.error('Erreur chargement entrées:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const stats = await InvoiceService.getTimeStats(user.id);
      setStats(stats);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleStartTimer = async () => {
    if (!user || !timerForm.description.trim()) return;
    
    try {
      const entry = await InvoiceService.startTimer(user.id, {
        description: timerForm.description,
        activity_type: timerForm.activity_type,
        hourly_rate: timerForm.hourly_rate,
        billable: timerForm.billable
      });
      
      setActiveTimer(entry);
      setElapsedSeconds(0);
      setTimerForm({ ...timerForm, description: '' });
    } catch (error) {
      console.error('Erreur démarrage timer:', error);
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    
    try {
      await InvoiceService.stopTimer(activeTimer.id);
      setActiveTimer(null);
      setElapsedSeconds(0);
      loadTimeEntries();
      loadStats();
    } catch (error) {
      console.error('Erreur arrêt timer:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateAmount = () => {
    if (!activeTimer) return 0;
    const hours = elapsedSeconds / 3600;
    return hours * (timerForm.hourly_rate || 0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <Clock className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gestion du Temps</h1>
            <p className="text-slate-400">Time Tracking comme Clio - Facturez au temps passé</p>
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-2xl font-bold">{stats.billableHours.toFixed(1)}h</span>
              </div>
              <p className="text-slate-400 text-sm">Heures Facturables</p>
              <p className="text-emerald-400 text-xs mt-1">{stats.uninvoicedHours.toFixed(1)}h non facturées</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-2xl font-bold">{formatCurrency(stats.billableAmount)}</span>
              </div>
              <p className="text-slate-400 text-sm">Montant Facturable</p>
              <p className="text-blue-400 text-xs mt-1">{formatCurrency(stats.uninvoicedAmount)} à facturer</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-2xl font-bold">{formatCurrency(stats.averageHourlyRate)}</span>
              </div>
              <p className="text-slate-400 text-sm">Taux Horaire Moyen</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <FileText className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-2xl font-bold">{stats.uninvoicedEntries}</span>
              </div>
              <p className="text-slate-400 text-sm">Entrées Non Facturées</p>
            </div>
          </div>
        )}

        {/* Chronomètre */}
        <div className="bg-gradient-to-br from-emerald-900/20 to-blue-900/20 border border-emerald-500/30 rounded-2xl p-8 mb-8">
          {activeTimer ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="text-6xl font-bold text-emerald-400 mb-4">
                  {formatTime(elapsedSeconds)}
                </div>
                <p className="text-xl text-slate-300 mb-2">{activeTimer.description}</p>
                <p className="text-slate-400">
                  {activeTimer.activity_type} • {formatCurrency(activeTimer.hourly_rate || 0)}/h
                </p>
                <p className="text-2xl font-bold text-emerald-400 mt-4">
                  {formatCurrency(calculateAmount())}
                </p>
              </div>
              <button
                onClick={handleStopTimer}
                className="px-8 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-3 mx-auto"
              >
                <Square className="w-6 h-6" />
                Arrêter le Chronomètre
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-bold mb-4">Démarrer un Chronomètre</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Description de l'activité..."
                    value={timerForm.description}
                    onChange={(e) => setTimerForm({ ...timerForm, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <select
                    value={timerForm.activity_type}
                    onChange={(e) => setTimerForm({ ...timerForm, activity_type: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="consultation">Consultation</option>
                    <option value="research">Recherche</option>
                    <option value="drafting">Rédaction</option>
                    <option value="court">Audience</option>
                    <option value="phone">Téléphone</option>
                    <option value="email">Email</option>
                    <option value="travel">Déplacement</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Taux horaire (DA)"
                    value={timerForm.hourly_rate}
                    onChange={(e) => setTimerForm({ ...timerForm, hourly_rate: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={timerForm.billable}
                    onChange={(e) => setTimerForm({ ...timerForm, billable: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-emerald-500"
                  />
                  Facturable
                </label>
                <button
                  onClick={handleStartTimer}
                  disabled={!timerForm.description.trim()}
                  className="ml-auto px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Démarrer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Liste des entrées récentes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Entrées Récentes</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucune entrée de temps</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeEntries.slice(0, 10).map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-slate-800 rounded-xl hover:bg-slate-750 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium mb-1">{entry.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>{entry.activity_type}</span>
                      <span>•</span>
                      <span>{new Date(entry.start_time).toLocaleDateString('fr-FR')}</span>
                      {entry.duration_minutes && (
                        <>
                          <span>•</span>
                          <span>{formatDuration(entry.duration_minutes)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">
                      {formatCurrency(entry.amount || 0)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {entry.billable && (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                          Facturable
                        </span>
                      )}
                      {entry.invoiced && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                          Facturé
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
