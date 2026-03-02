import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, User, Mail, Lock, Briefcase, Calendar } from 'lucide-react';

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    profession: 'avocat',
    plan: 'free',
    documentsLimit: 5,
    casesLimit: 3
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Créer l'utilisateur dans auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          profession: formData.profession
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Utilisateur non créé');

      // 2. Créer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          profession: formData.profession,
          is_admin: false,
          is_active: true
        });

      if (profileError) throw profileError;

      // 3. Créer l'abonnement
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: authData.user.id,
          plan: formData.plan,
          status: 'active',
          documents_used: 0,
          documents_limit: formData.plan === 'pro' ? -1 : formData.documentsLimit,
          cases_limit: formData.plan === 'pro' ? -1 : formData.casesLimit,
          is_active: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (subError) throw subError;

      onSuccess();
    } catch (err: any) {
      console.error('Erreur création utilisateur:', err);
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-legal-gold/10 rounded-lg">
              <User className="w-6 h-6 text-legal-gold" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Créer un Utilisateur</h2>
              <p className="text-slate-400 text-sm">Nouveau compte avec abonnement</p>
            </div>
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

          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Informations Personnelles</h3>
            
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
                  placeholder="Ahmed"
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
                  placeholder="Benali"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-legal-gold"
                placeholder="ahmed.benali@example.dz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Mot de passe
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-legal-gold"
                placeholder="Minimum 6 caractères"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Briefcase className="w-4 h-4 inline mr-2" />
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
          </div>

          {/* Abonnement */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Abonnement</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
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
                <option value="free">Gratuit (5 documents, 30 jours)</option>
                <option value="pro">Pro (Illimité)</option>
                <option value="cabinet">Cabinet (Illimité, Multi-utilisateurs)</option>
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
                    max="100"
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
                    max="50"
                    value={formData.casesLimit}
                    onChange={(e) => setFormData({ ...formData, casesLimit: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-legal-gold"
                  />
                </div>
              </div>
            )}
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
              className="flex-1 px-6 py-3 bg-legal-gold text-slate-950 rounded-xl font-bold hover:bg-legal-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer l\'Utilisateur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
