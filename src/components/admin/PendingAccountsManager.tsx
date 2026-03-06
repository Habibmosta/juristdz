import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock, DollarSign, Briefcase, Mail, Phone } from 'lucide-react';
import type { Language } from '../../types';

interface PendingAccountsManagerProps {
  language: Language;
  adminId: string;
}

interface PendingAccount {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  account_status: 'trial' | 'suspended';
  trial_started_at: string;
  trial_ends_at: string;
  days_remaining: number;
  cases_count: number;
  clients_count: number;
  created_at: string;
  last_login_at?: string;
  login_count: number;
  phone?: string;
}

export const PendingAccountsManager: React.FC<PendingAccountsManagerProps> = ({ language, adminId }) => {
  const [accounts, setAccounts] = useState<PendingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<PendingAccount | null>(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [blockReason, setBlockReason] = useState('');
  
  const isAr = language === 'ar';

  useEffect(() => {
    loadPendingAccounts();
  }, []);

  const loadPendingAccounts = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { data, error } = await supabase
        .from('pending_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading pending accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const activateAccount = async () => {
    if (!selectedAccount) return;

    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { error } = await supabase.rpc('activate_account', {
        p_user_id: selectedAccount.id,
        p_admin_id: adminId,
        p_payment_amount: paymentAmount ? parseFloat(paymentAmount) : null,
        p_payment_reference: paymentReference || null
      });

      if (error) throw error;

      alert(isAr 
        ? `✅ تم تفعيل حساب ${selectedAccount.first_name} ${selectedAccount.last_name}`
        : `✅ Compte de ${selectedAccount.first_name} ${selectedAccount.last_name} activé`
      );

      setShowActivateModal(false);
      setSelectedAccount(null);
      setPaymentAmount('');
      setPaymentReference('');
      loadPendingAccounts();
    } catch (error) {
      console.error('Error activating account:', error);
      alert(isAr ? 'خطأ في التفعيل' : 'Erreur lors de l\'activation');
    }
  };

  const blockAccount = async () => {
    if (!selectedAccount || !blockReason) {
      alert(isAr ? 'يرجى إدخال سبب الحظر' : 'Veuillez entrer une raison');
      return;
    }

    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { error } = await supabase.rpc('block_account', {
        p_user_id: selectedAccount.id,
        p_admin_id: adminId,
        p_reason: blockReason
      });

      if (error) throw error;

      alert(isAr 
        ? `⛔ تم حظر حساب ${selectedAccount.first_name} ${selectedAccount.last_name}`
        : `⛔ Compte de ${selectedAccount.first_name} ${selectedAccount.last_name} bloqué`
      );

      setShowBlockModal(false);
      setSelectedAccount(null);
      setBlockReason('');
      loadPendingAccounts();
    } catch (error) {
      console.error('Error blocking account:', error);
      alert(isAr ? 'خطأ في الحظر' : 'Erreur lors du blocage');
    }
  };

  const getStatusColor = (status: string, daysRemaining: number) => {
    if (status === 'suspended') return 'bg-red-100 text-red-700 border-red-200';
    if (daysRemaining <= 1) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (daysRemaining <= 3) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const stats = {
    total: accounts.length,
    trial: accounts.filter(a => a.account_status === 'trial').length,
    suspended: accounts.filter(a => a.account_status === 'suspended').length,
    expiringSoon: accounts.filter(a => a.account_status === 'trial' && a.days_remaining <= 2).length
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {isAr ? 'إدارة الحسابات المعلقة' : 'Gestion des Comptes en Attente'}
        </h1>
        <p className="text-slate-500 mt-1">
          {isAr ? 'مراجعة وتفعيل الحسابات التجريبية' : 'Révision et activation des comptes d\'essai'}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">{isAr ? 'المجموع' : 'Total'}</span>
            <Users size={20} className="text-blue-600" />
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">{isAr ? 'تجريبي' : 'En essai'}</span>
            <Clock size={20} className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.trial}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">{isAr ? 'معلق' : 'Suspendus'}</span>
            <XCircle size={20} className="text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.suspended}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">{isAr ? 'ينتهي قريباً' : 'Expire bientôt'}</span>
            <Clock size={20} className="text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600">{stats.expiringSoon}</p>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800">
        <div className="p-6 border-b dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isAr ? 'قائمة الحسابات' : 'Liste des Comptes'}
          </h2>
        </div>

        <div className="divide-y dark:divide-slate-800">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : accounts.length > 0 ? (
            accounts.map(account => (
              <div
                key={account.id}
                className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {account.first_name?.[0]}{account.last_name?.[0]}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {account.first_name} {account.last_name}
                        </h3>
                        <p className="text-sm text-slate-500">{account.email}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(account.account_status, account.days_remaining)}`}>
                        {account.account_status === 'trial' 
                          ? `${account.days_remaining} ${isAr ? 'أيام' : 'jours'}`
                          : isAr ? 'معلق' : 'Suspendu'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Mail size={14} className="text-blue-600" />
                        {account.email}
                      </div>
                      {account.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Phone size={14} className="text-green-600" />
                          {account.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Briefcase size={14} className="text-purple-600" />
                        {account.cases_count} {isAr ? 'ملفات' : 'dossiers'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Users size={14} className="text-orange-600" />
                        {account.clients_count} {isAr ? 'عملاء' : 'clients'}
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      {isAr ? 'تاريخ التسجيل' : 'Inscrit le'}: {new Date(account.created_at).toLocaleDateString()}
                      {account.last_login_at && (
                        <> • {isAr ? 'آخر اتصال' : 'Dernière connexion'}: {new Date(account.last_login_at).toLocaleDateString()}</>
                      )}
                      {' • '}{account.login_count} {isAr ? 'اتصالات' : 'connexions'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedAccount(account);
                        setShowActivateModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      {isAr ? 'تفعيل' : 'Activer'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAccount(account);
                        setShowBlockModal(true);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      {isAr ? 'حظر' : 'Bloquer'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400">
              <Users size={48} className="mx-auto mb-3 opacity-20" />
              <p>{isAr ? 'لا توجد حسابات معلقة' : 'Aucun compte en attente'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Activate Modal */}
      {showActivateModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowActivateModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b dark:border-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {isAr ? 'تفعيل الحساب' : 'Activer le Compte'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                <p className="font-bold text-blue-900 dark:text-blue-100">
                  {selectedAccount.first_name} {selectedAccount.last_name}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">{selectedAccount.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'مبلغ الدفع (اختياري)' : 'Montant du paiement (optionnel)'}
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00 DZD"
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'مرجع الدفع (اختياري)' : 'Référence de paiement (optionnel)'}
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder={isAr ? 'رقم الإيصال، الشيك، إلخ.' : 'N° reçu, chèque, etc.'}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-600 outline-none"
                />
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                <p className="text-sm text-green-800 dark:text-green-200">
                  {isAr 
                    ? '✅ سيحصل المستخدم على وصول كامل وغير محدود لجميع الميزات'
                    : '✅ L\'utilisateur aura un accès complet et illimité à toutes les fonctionnalités'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowActivateModal(false)}
                  className="flex-1 px-6 py-3 border dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  onClick={activateAccount}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                >
                  {isAr ? 'تفعيل' : 'Activer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowBlockModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b dark:border-slate-800">
              <h2 className="text-2xl font-bold text-red-600">
                {isAr ? 'حظر الحساب' : 'Bloquer le Compte'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                <p className="font-bold text-red-900 dark:text-red-100">
                  {selectedAccount.first_name} {selectedAccount.last_name}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">{selectedAccount.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'سبب الحظر' : 'Raison du blocage'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder={isAr ? 'أدخل سبب الحظر...' : 'Entrez la raison du blocage...'}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-red-600 outline-none resize-none"
                />
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {isAr 
                    ? '⚠️ سيتم حظر المستخدم من الوصول إلى النظام بالكامل'
                    : '⚠️ L\'utilisateur sera bloqué de tout accès au système'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="flex-1 px-6 py-3 border dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  onClick={blockAccount}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                >
                  {isAr ? 'حظر' : 'Bloquer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingAccountsManager;
