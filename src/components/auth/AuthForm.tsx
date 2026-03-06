import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Building, Hash, Briefcase, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { EmailVerificationModal } from './EmailVerificationModal';

interface AuthFormProps {
  onSuccess: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot-password';
type Profession = 'avocat' | 'notaire' | 'huissier' | 'magistrat' | 'etudiant' | 'juriste_entreprise';

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profession, setProfession] = useState<Profession>('avocat');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const professions: { value: Profession; label: string; icon: string }[] = [
    { value: 'avocat', label: 'Avocat', icon: '⚖️' },
    { value: 'notaire', label: 'Notaire', icon: '📜' },
    { value: 'huissier', label: 'Huissier de Justice', icon: '📋' },
    { value: 'magistrat', label: 'Magistrat', icon: '👨‍⚖️' },
    { value: 'etudiant', label: 'Étudiant en Droit', icon: '🎓' },
    { value: 'juriste_entreprise', label: 'Juriste d\'Entreprise', icon: '💼' }
  ];

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      if (data.user) {
        // ✅ NOUVEAU: Vérifier si l'email est confirmé
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setError('Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.');
          return;
        }

        // Vérifier si le compte est actif
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_active, first_name, last_name, account_status')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile check error:', profileError);
          throw new Error('Erreur lors de la vérification du profil');
        }

        // Vérifier le statut du compte
        if (profile.account_status === 'blocked') {
          await supabase.auth.signOut();
          setError('Votre compte a été bloqué. Veuillez contacter l\'administration.');
          return;
        }

        if (!profile.is_active) {
          await supabase.auth.signOut();
          setError('Votre compte est en attente de validation par un administrateur. Vous recevrez un email une fois votre compte activé.');
          return;
        }

        setSuccess('Connexion réussie!');
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            profession,
            registration_number: registrationNumber,
            organization_name: organizationName,
            phone_number: phoneNumber
          }
        }
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // 2. Create profile with is_active = false (waiting for admin approval)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            profession,
            registration_number: registrationNumber,
            organization_name: organizationName,
            phone_number: phoneNumber,
            is_admin: false,
            is_active: false // En attente de validation admin
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error('Erreur lors de la création du profil');
        }

        // 3. Create subscription with is_active = false
        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: authData.user.id,
            plan: 'free',
            status: 'pending', // En attente
            documents_used: 0,
            documents_limit: 5,
            cases_limit: 3,
            is_active: false,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (subError) {
          console.error('Subscription creation error:', subError);
        }

        // ✅ NOUVEAU: Afficher le modal de vérification d'email
        setRegisteredEmail(email);
        setShowEmailVerification(true);
        
        // Déconnecter l'utilisateur car son compte n'est pas encore actif
        await supabase.auth.signOut();
      }
    } catch (err: any) {
      // Améliorer le message d'erreur pour les doublons d'email
      let errorMessage = err.message || 'Erreur lors de la création du compte';
      
      if (err.message?.includes('already registered') || err.message?.includes('User already registered')) {
        errorMessage = 'Cet email est déjà utilisé. Essayez de vous connecter ou utilisez "Mot de passe oublié".';
      } else if (err.message?.includes('email')) {
        errorMessage = 'Email invalide. Veuillez vérifier votre adresse email.';
      } else if (err.message?.includes('password')) {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (resetError) throw resetError;

      setSuccess('Un email de réinitialisation a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception.');
      
      // Retour au mode connexion après 5 secondes
      setTimeout(() => {
        setMode('signin');
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-legal-gold to-amber-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚖️</span>
            </div>
            <h1 className="text-3xl font-bold text-white">JuristDZ</h1>
          </div>
          <p className="text-slate-400">Assistant IA Juridique Algérien</p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-xl">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                mode === 'signin'
                  ? 'bg-legal-gold text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-legal-gold text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-200 text-sm">{success}</p>
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent"
                    placeholder="maitre@barreau.dz"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                    title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-legal-gold text-white rounded-lg font-bold hover:bg-legal-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-sm text-slate-400 hover:text-legal-gold transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">Réinitialiser le mot de passe</h3>
                <p className="text-sm text-slate-400">
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent"
                    placeholder="maitre@barreau.dz"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-legal-gold text-white rounded-lg font-bold hover:bg-legal-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </button>

              {/* Back to Sign In */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-sm text-slate-400 hover:text-legal-gold transition-colors"
                >
                  ← Retour à la connexion
                </button>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Prénom
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent"
                      placeholder="Ahmed"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent"
                    placeholder="Benali"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Profession
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value as Profession)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent appearance-none cursor-pointer"
                    required
                  >
                    {professions.map((prof) => (
                      <option key={prof.value} value={prof.value}>
                        {prof.icon} {prof.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email professionnel
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent"
                    placeholder="maitre@barreau.dz"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                    title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Minimum 6 caractères</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    N° Inscription
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent"
                      placeholder="A/12345/2024"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent"
                      placeholder="+213 555 123 456"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Cabinet/Organisation
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent"
                    placeholder="Cabinet Benali & Associés"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-legal-gold text-white rounded-lg font-bold hover:bg-legal-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          En vous connectant, vous acceptez nos conditions d'utilisation
        </p>
      </div>

      {/* Email Verification Modal */}
      {showEmailVerification && (
        <EmailVerificationModal
          email={registeredEmail}
          language="fr"
          onClose={() => {
            setShowEmailVerification(false);
            setMode('signin');
          }}
        />
      )}
    </div>
  );
};

export default AuthForm;
