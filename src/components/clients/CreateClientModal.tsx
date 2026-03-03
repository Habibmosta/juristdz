import React, { useState } from 'react';
import { X, User, Building2, Mail, Phone, MapPin, FileText, Save } from 'lucide-react';
import { ClientService } from '../../services/clientService';
import type { Client } from '../../types/client.types';

interface CreateClientModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: (client: Client) => void;
}

export const CreateClientModal: React.FC<CreateClientModalProps> = ({ userId, onClose, onSuccess }) => {
  const [clientType, setClientType] = useState<'individual' | 'company'>('individual');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    cin: '',
    nif: '',
    rc: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    wilaya: '',
    postal_code: '',
    profession: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const wilayas = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
    'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger',
    'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma',
    'Constantine', 'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh',
    'Illizi', 'Bordj Bou Arreridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued',
    'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
    'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal', 'Béni Abbès',
    'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', 'El M\'Ghair', 'El Meniaa'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (clientType === 'individual' && (!formData.first_name || !formData.last_name)) {
        throw new Error('Le prénom et le nom sont obligatoires');
      }
      if (clientType === 'company' && !formData.company_name) {
        throw new Error('Le nom de l\'entreprise est obligatoire');
      }

      const client = await ClientService.createClient(userId, {
        ...formData,
        client_type: clientType,
        status: 'active'
      });

      onSuccess(client);
    } catch (err: any) {
      console.error('Erreur création client:', err);
      setError(err.message || 'Erreur lors de la création du client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Nouveau Client</h2>
              <p className="text-slate-400 text-sm">Créer une fiche client complète</p>
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

          {/* Type de client */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Type de Client
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setClientType('individual')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  clientType === 'individual'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <User className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <p className="font-medium">Particulier</p>
              </button>
              <button
                type="button"
                onClick={() => setClientType('company')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  clientType === 'company'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <Building2 className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <p className="font-medium">Entreprise</p>
              </button>
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations {clientType === 'company' ? 'de l\'Entreprise' : 'Personnelles'}
            </h3>

            {clientType === 'company' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom de l'Entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  placeholder="SARL Exemple"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {clientType === 'company' ? 'Prénom du Contact' : 'Prénom'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ahmed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {clientType === 'company' ? 'Nom du Contact' : 'Nom'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  placeholder="Benali"
                />
              </div>
            </div>

            {/* Identification */}
            <div className="grid grid-cols-3 gap-4">
              {clientType === 'individual' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    CIN
                  </label>
                  <input
                    type="text"
                    value={formData.cin}
                    onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="123456789"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      NIF
                    </label>
                    <input
                      type="text"
                      value={formData.nif}
                      onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      placeholder="123456789012345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      RC
                    </label>
                    <input
                      type="text"
                      value={formData.rc}
                      onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      placeholder="16/00-1234567"
                    />
                  </div>
                </>
              )}
              {clientType === 'individual' && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Profession
                  </label>
                  <input
                    type="text"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="Commerçant, Médecin, etc."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  placeholder="client@example.dz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  placeholder="021 XX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mobile
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  placeholder="0555 XX XX XX"
                />
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Adresse
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Adresse Complète
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                placeholder="Rue, Numéro, Quartier..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  placeholder="Alger"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Wilaya
                </label>
                <select
                  value={formData.wilaya}
                  onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Sélectionner...</option>
                  {wilayas.map(wilaya => (
                    <option key={wilaya} value={wilaya}>{wilaya}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Code Postal
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  placeholder="16000"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              placeholder="Notes privées sur le client..."
            />
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
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Création...' : 'Créer le Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
