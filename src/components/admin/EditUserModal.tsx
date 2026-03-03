import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, Trash2, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profession: string;
  is_admin: boolean;
  is_active: boolean;
  subscription?: {
    plan: string;
    documents_used: number;
    documents_limit: number;
    cases_limit: number;
    is_active: boolean;
  };
}

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: user.first_name,
    lastName: user.last_name,
    profession: user.profession,
    plan: user.subscription?.plan || 'free',
    documentsLimit: user.subscription?.documents_limit || 5,
    casesLimit: user.subscription?.cases_limit || 3,
    isActive: user.is_active,
    newPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Mettre à jour le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          profession: formData.profession,
          is_active: formData.isActive
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Mettre à jour l'abonnement
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          plan: formData.plan,
          documents_limit: formData.plan === 'pro' || formData.plan === 'cabinet' ? -1 : formData.documentsLimit,
          cases_limit: formData.plan === 'pro' || formData.plan === 'cabinet' ? -1 : formData.casesLimit,
          is_active: formData.isActive
        })
        .eq('user_id', user.id);

      if (subError) throw subError;

      // Changer le mot de passe si demandé
      if (formData.newPassword === 'SEND_RESET_EMAIL') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        
        if (resetError) {
          console.warn('Impossible d\'envoyer l\'email de réinitialisation:', resetError);
          throw new Error('Erreur lors de l\'envoi de l\'email de réinitialisation');
        }
      }

      onSuccess();
    } catch (err: any) {
      console.error('Erreur mise à jour:', err);
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Supprimer les documents
      const { error: docsError } = await supabase
        .from('documents')
        .delete()
        .eq('user_id', user.id);

      if (docsError) {
        console.error('Erreur suppression documents:', docsError);
        throw new Error('Erreur lors de la suppression des documents');
      }

      // 2. Supprimer les dossiers
      const { error: casesError } = await supabase
        .from('cases')
        .delete()
        .eq('user_id', user.id);

      if (casesError) {
        console.error('Erreur suppression dossiers:', casesError);
        throw new Error('Erreur lors de la suppression des dossiers');
      }

      // 3. Supprimer l'abonnement
      const { error: subError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (subError) {
        console.error('Erreur suppression abonnement:', subError);
        throw new Error('Erreur lors de la suppression de l\'abonnement');
      }

      // 4. Supprimer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('Erreur suppression profil:', profileError);
        throw new Error('Erreur lors de la suppression du profil');
      }

      // Note: L'utilisateur reste dans auth.users (nécessite service_role pour supprimer)
      // Mais il ne pourra plus se connecter car son profil n'existe plus

      onSuccess();
    } catch (err: any) {
      console.error('Erreur suppression:', err);
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Modifier l'Utilisateur</h2>
            <p className="text-slate-400 text-sm">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-xl text-red-400">
              {error}
            </div>
          )}

          {/* Informations */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Prénom
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-legal-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nom
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-legal-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Profession
            </label>
            <select
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-legal-gold"
            >
              <option value="avocat">Avocat</option>
              <option value="notaire">Notaire</option>
              <option value="huissier">Huissier</option>
              <option value="magistrat">Magistrat</option>
              <option value="etudiant">Étudiant</option>
              <option value="juriste_entreprise">Juriste d'Entreprise</option>
            </select>
          </div>

          {/* Abonnement */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Plan
            </label>
            <select
              value={formData.plan}
              onChange={(e) => {
                const plan = e.target.value;
                setFormData({
                  ...formData,
                  plan,
                  documentsLimit: plan === 'pro' || plan === 'cabinet' ? -1 : 5,
                  casesLimit: plan === 'pro' || plan === 'cabinet' ? -1 : 3
                });
              }}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-legal-gold"
            >
              <option value="free">Gratuit</option>
              <option value="pro">Pro (Illimité)</option>
              <option value="cabinet">Cabinet (Illimité)</option>
            </select>
          </div>

          {formData.plan === 'free' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Limite Documents
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.documentsLimit}
                  onChange={(e) => setFormData({ ...formData, documentsLimit: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-legal-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Limite Dossiers
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.casesLimit}
                  onChange={(e) => setFormData({ ...formData, casesLimit: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-legal-gold"
                />
              </div>
            </div>
          )}

          {/* Statut */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-legal-gold focus:ring-legal-gold"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-300">
              Compte actif
            </label>
          </div>

          {/* Changement de mot de passe */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Réinitialiser le mot de passe
            </label>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sendResetEmail"
                checked={formData.newPassword === 'SEND_RESET_EMAIL'}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  newPassword: e.target.checked ? 'SEND_RESET_EMAIL' : '' 
                })}
                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-legal-gold focus:ring-legal-gold"
              />
              <label htmlFor="sendResetEmail" className="text-sm text-slate-300">
                Envoyer un email de réinitialisation à l'utilisateur
              </label>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              L'utilisateur recevra un email avec un lien pour définir un nouveau mot de passe.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-legal-gold text-slate-950 rounded-xl font-bold hover:bg-legal-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          {/* Zone de suppression */}
          <div className="pt-4 border-t border-red-900/30">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Supprimer l'utilisateur
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-400">
                    <p className="font-semibold mb-1">Attention : Action irréversible</p>
                    <p>Toutes les données de l'utilisateur seront définitivement supprimées (profil, dossiers, documents).</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    {loading ? 'Suppression...' : 'Confirmer la suppression'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
