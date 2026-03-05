import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { Language } from '../../types';
import { Users, TrendingUp, DollarSign } from 'lucide-react';

interface ClientData {
  id: string;
  name: string;
  email?: string;
  caseCount: number;
  totalRevenue: number;
}

interface TopClientsProps {
  userId: string;
  language: Language;
  showAll?: boolean;
}

const TopClients: React.FC<TopClientsProps> = ({ userId, language, showAll = false }) => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const isAr = language === 'ar';

  useEffect(() => {
    loadTopClients();
  }, [userId]);

  const loadTopClients = async () => {
    try {
      // Récupérer tous les dossiers avec client_id
      const { data: cases } = await supabase
        .from('cases')
        .select('client_id, estimated_value')
        .eq('user_id', userId)
        .not('client_id', 'is', null);

      if (!cases) return;

      // Grouper par client
      const clientMap: Record<string, { caseCount: number; totalRevenue: number }> = {};
      cases.forEach(c => {
        if (!c.client_id) return;
        if (!clientMap[c.client_id]) {
          clientMap[c.client_id] = { caseCount: 0, totalRevenue: 0 };
        }
        clientMap[c.client_id].caseCount++;
        clientMap[c.client_id].totalRevenue += c.estimated_value || 0;
      });

      // Récupérer les infos des clients
      const clientIds = Object.keys(clientMap);
      if (clientIds.length === 0) {
        setClients([]);
        return;
      }

      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name, email')
        .in('id', clientIds);

      if (!clientsData) return;

      // Combiner les données
      const topClients = clientsData
        .map(client => ({
          ...client,
          caseCount: clientMap[client.id].caseCount,
          totalRevenue: clientMap[client.id].totalRevenue
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, showAll ? 20 : 5);

      setClients(topClients);
    } catch (error) {
      console.error('Error loading top clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isAr ? 'ar-DZ' : 'fr-FR', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border dark:border-slate-700">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-gold"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
          <Users size={20} className="text-purple-600" />
        </div>
        <h3 className="text-lg font-bold">
          {isAr ? 'أفضل العملاء حسب رقم الأعمال' : 'Top Clients par CA'}
        </h3>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Users size={48} className="mx-auto mb-4 opacity-20" />
          <p>{isAr ? 'لا يوجد عملاء بعد' : 'Aucun client pour le moment'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clients.map((client, idx) => (
            <div 
              key={client.id}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                idx === 1 ? 'bg-slate-200 text-slate-600' :
                idx === 2 ? 'bg-orange-100 text-orange-600' :
                'bg-slate-100 text-slate-500'
              }`}>
                {idx + 1}
              </div>

              {/* Client Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{client.name}</p>
                {client.email && (
                  <p className="text-sm text-slate-500 truncate">{client.email}</p>
                )}
              </div>

              {/* Stats */}
              <div className="text-right">
                <p className="font-bold text-legal-gold">{formatCurrency(client.totalRevenue)}</p>
                <p className="text-xs text-slate-500">
                  {client.caseCount} {isAr ? 'ملف' : 'dossier'}
                  {client.caseCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showAll && clients.length >= 5 && (
        <button className="w-full mt-4 px-4 py-2 text-sm text-legal-gold hover:bg-legal-gold/10 rounded-lg transition-colors">
          {isAr ? 'عرض الكل' : 'Voir tous les clients'}
        </button>
      )}
    </div>
  );
};

export default TopClients;
