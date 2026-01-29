
import React, { useState, useEffect } from 'react';
import { UserStats, LicenseKey, Language, Transaction, UserFeedback, AppMode } from '../types';
import { Key, Users, ShieldCheck, ReceiptText, ThumbsUp, ThumbsDown, MessageSquareQuote, CheckCircle2, AlertTriangle, TrendingUp, Plus, Copy, Check, Hash, Database, Cloud, Share2, Globe, ExternalLink, Activity, Wifi, RefreshCw } from 'lucide-react';
import { UI_TRANSLATIONS } from '../constants';
import { databaseService } from '../services/databaseService';
import { supabase } from '../services/supabaseClient';

interface AdminDashboardProps {
  language: Language;
  users: UserStats[];
  licenseKeys: LicenseKey[];
  transactions: Transaction[];
  onGenerateKey: () => void;
  onSetUserPlan: (userId: string, isPro: boolean) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  language, users, licenseKeys, transactions, onGenerateKey, onSetUserPlan 
}) => {
  const t = UI_TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'users' | 'keys' | 'payments' | 'uat'>('uat');
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const isAr = language === 'ar';

  useEffect(() => {
    const loadFeedback = async () => {
      const data = await databaseService.getAllFeedback();
      setFeedbacks(data);
    };
    loadFeedback();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyUrl = (url: string) => {
    // Force l'URL de base pour éviter les liens blob ou session
    const finalUrl = window.location.origin;
    navigator.clipboard.writeText(finalUrl);
    setCopiedKey(url);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentUrl = window.location.origin;

  const positiveRate = feedbacks.length > 0 
    ? Math.round((feedbacks.filter(f => f.isPositive).length / feedbacks.length) * 100) 
    : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <ShieldCheck className="text-legal-blue dark:text-legal-gold" size={32} />
                {isAr ? 'مركز التحكم' : 'Cockpit Admin'}
              </h1>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${supabase ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {supabase ? 'Supabase Connecté' : 'Offline Mode'}
              </span>
            </div>
            <p className="text-slate-500 mt-1">Gestion des accès et validation du prototype.</p>
          </div>
          
          <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
             <button onClick={() => setActiveTab('uat')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'uat' ? 'bg-legal-blue text-white shadow-md' : 'text-slate-500'}`}>
                UAT & Partage
             </button>
             <button onClick={() => setActiveTab('keys')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'keys' ? 'bg-legal-blue text-white shadow-md' : 'text-slate-500'}`}>
                Licences
             </button>
             <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'users' ? 'bg-legal-blue text-white shadow-md' : 'text-slate-500'}`}>
                Clients
             </button>
          </div>
        </div>

        {activeTab === 'uat' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Globe className="text-legal-gold" size={20} />
                      Lien Public de Test
                    </h2>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      Partagez l'URL racine. Les liens temporaires "blob:" ne sont pas accessibles par d'autres utilisateurs.
                    </p>
                    <div className="flex flex-col gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 font-mono text-[10px] break-all">
                          {currentUrl}
                      </div>
                      <button 
                        onClick={() => handleCopyUrl(currentUrl)}
                        className="w-full py-4 bg-legal-blue text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                      >
                          {copiedKey === currentUrl ? <Check size={18} /> : <Share2 size={18} />}
                          {copiedKey === currentUrl ? 'Lien Copié !' : 'Partager l\'URL de base'}
                      </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                   <div>
                      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <Activity className="text-green-500" size={20} />
                        Santé du Prototype
                      </h2>
                      <p className="text-xs text-slate-500">Statut des services critiques.</p>
                   </div>
                   
                   <div className="space-y-3 mt-6">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800/50">
                        <span className="text-xs font-bold text-green-700">Serveur IA</span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-green-600">
                          <Wifi size={12} /> EN LIGNE
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
                        <span className="text-xs font-bold text-blue-700">Type de Session</span>
                        <span className="text-[10px] font-bold text-blue-600 uppercase">Cloud Preview</span>
                      </div>
                   </div>

                   <button 
                    onClick={() => window.location.reload()}
                    className="mt-6 text-[10px] font-bold text-slate-400 flex items-center gap-2 hover:text-legal-blue"
                   >
                     <RefreshCw size={12} /> Actualiser la session
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="text-green-500" size={20} />
                      <h3 className="font-bold text-slate-800 dark:text-white">Qualité Expertise</h3>
                   </div>
                   <div className="text-4xl font-black text-legal-blue dark:text-legal-gold">{positiveRate}%</div>
                   <p className="text-xs text-slate-400 mt-2">Score de satisfaction IA Juridique.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-3 mb-4">
                      <Users className="text-blue-500" size={20} />
                      <h3 className="font-bold text-slate-800 dark:text-white">Avocats Inscrits</h3>
                   </div>
                   <div className="text-4xl font-black text-legal-blue dark:text-legal-gold">{users.length}</div>
                   <p className="text-xs text-slate-400 mt-2">Nombre de Maîtres utilisant le test.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-3 mb-4">
                      <Key className="text-amber-500" size={20} />
                      <h3 className="font-bold text-slate-800 dark:text-white">Licences DZ</h3>
                   </div>
                   <div className="text-4xl font-black text-legal-blue dark:text-legal-gold">{licenseKeys.length}</div>
                   <p className="text-xs text-slate-400 mt-2">Codes générés pour la phase béta.</p>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center">
                   <h2 className="font-bold text-lg">Journal de Recette Juridique</h2>
                   <MessageSquareQuote className="text-slate-300" />
                </div>
                <div className="divide-y dark:divide-slate-800">
                   {feedbacks.length > 0 ? feedbacks.map(f => (
                     <div key={f.id} className="p-6 flex items-start gap-4">
                        <div className={`p-2 rounded-full ${f.isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                           {f.isPositive ? <ThumbsUp size={16} /> : <ThumbsDown size={16} />}
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between mb-1">
                              <span className="text-xs font-bold text-slate-400">Dossier #{f.id.substring(0,6)}</span>
                              <span className="text-xs text-slate-400">{f.timestamp.toLocaleDateString()}</span>
                           </div>
                           <p className="text-sm text-slate-800 dark:text-slate-200 italic">"{f.comment || 'Validé sans commentaire'}"</p>
                        </div>
                     </div>
                   )) : <div className="p-12 text-center text-slate-400">Aucun feedback d'expert enregistré.</div>}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="space-y-6">
             <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center">
                   <div>
                      <h2 className="font-bold text-lg">Générateur de Licences</h2>
                      <p className="text-sm text-slate-500 mt-1">Créez des codes d'accès pour les avocats</p>
                   </div>
                   <button 
                     onClick={onGenerateKey}
                     className="px-6 py-3 bg-legal-gold text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95 transition-all"
                   >
                      <Plus size={18} />
                      Générer une Licence
                   </button>
                </div>
                
                {licenseKeys.length > 0 ? (
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                           <tr>
                              <th className="px-8 py-4">Clé de Licence</th>
                              <th className="px-8 py-4">Plan</th>
                              <th className="px-8 py-4">Statut</th>
                              <th className="px-8 py-4">Utilisé par</th>
                              <th className="px-8 py-4">Date création</th>
                              <th className="px-8 py-4">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-800">
                           {licenseKeys.map(key => (
                             <tr key={key.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-8 py-4">
                                   <div className="flex items-center gap-2">
                                      <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono">
                                         {key.key}
                                      </code>
                                   </div>
                                </td>
                                <td className="px-8 py-4">
                                   <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                     key.plan === 'pro' ? 'bg-amber-100 text-amber-700' : 
                                     key.plan === 'cabinet' ? 'bg-purple-100 text-purple-700' : 
                                     'bg-slate-100 text-slate-600'
                                   }`}>
                                      {key.plan.toUpperCase()}
                                   </span>
                                </td>
                                <td className="px-8 py-4">
                                   <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                     key.isUsed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                   }`}>
                                      {key.isUsed ? 'UTILISÉE' : 'DISPONIBLE'}
                                   </span>
                                </td>
                                <td className="px-8 py-4">
                                   <span className="text-sm text-slate-600 dark:text-slate-400">
                                      {key.usedBy || '-'}
                                   </span>
                                </td>
                                <td className="px-8 py-4">
                                   <span className="text-sm text-slate-600 dark:text-slate-400">
                                      {key.createdAt.toLocaleDateString()}
                                   </span>
                                </td>
                                <td className="px-8 py-4">
                                   <button 
                                     onClick={() => handleCopy(key.key)}
                                     className="text-[10px] font-bold text-legal-blue dark:text-legal-gold hover:underline flex items-center gap-1"
                                   >
                                      {copiedKey === key.key ? <Check size={12} /> : <Copy size={12} />}
                                      {copiedKey === key.key ? 'Copié' : 'Copier'}
                                   </button>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                     <Key size={48} className="mx-auto mb-4 opacity-30" />
                     <p className="text-lg font-bold mb-2">Aucune licence générée</p>
                     <p className="text-sm">Cliquez sur "Générer une Licence" pour créer votre première clé d'accès.</p>
                  </div>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-3 mb-4">
                      <Key className="text-amber-500" size={20} />
                      <h3 className="font-bold text-slate-800 dark:text-white">Total Licences</h3>
                   </div>
                   <div className="text-4xl font-black text-legal-blue dark:text-legal-gold">{licenseKeys.length}</div>
                   <p className="text-xs text-slate-400 mt-2">Codes générés au total</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="text-green-500" size={20} />
                      <h3 className="font-bold text-slate-800 dark:text-white">Utilisées</h3>
                   </div>
                   <div className="text-4xl font-black text-legal-blue dark:text-legal-gold">
                      {licenseKeys.filter(k => k.isUsed).length}
                   </div>
                   <p className="text-xs text-slate-400 mt-2">Licences activées</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle className="text-blue-500" size={20} />
                      <h3 className="font-bold text-slate-800 dark:text-white">Disponibles</h3>
                   </div>
                   <div className="text-4xl font-black text-legal-blue dark:text-legal-gold">
                      {licenseKeys.filter(k => !k.isUsed).length}
                   </div>
                   <p className="text-xs text-slate-400 mt-2">Prêtes à être distribuées</p>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
             <div className="p-8 border-b dark:border-slate-800">
                <h2 className="font-bold text-lg">Gestion des Maîtres</h2>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <tr>
                         <th className="px-8 py-4">Avocat / Email</th>
                         <th className="px-8 py-4">Plan Actuel</th>
                         <th className="px-8 py-4">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y dark:divide-slate-800">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                           <td className="px-8 py-4">
                              <div className="text-sm font-bold">{u.email}</div>
                              <div className="text-[10px] text-slate-400">ID: {u.id}</div>
                           </td>
                           <td className="px-8 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${u.isPro ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                 {u.plan.toUpperCase()}
                              </span>
                           </td>
                           <td className="px-8 py-4">
                              <button 
                                onClick={() => onSetUserPlan(u.id, !u.isPro)}
                                className="text-[10px] font-bold text-legal-blue dark:text-legal-gold hover:underline"
                              >
                                {u.isPro ? 'Rétrograder' : 'Passer Pro'}
                              </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
