import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Building, Hash, Briefcase, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { EmailVerificationModal } from './EmailVerificationModal';
import { PlanSelectionModal } from './PlanSelectionModal';
import LegalAcceptanceModal from '../legal/LegalAcceptanceModal';

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
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [showLegalAcceptance, setShowLegalAcceptance] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'cabinet'>('free');
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profession, setProfession] = useState<Profession>('avocat');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const isAr = language === 'ar';

  // Password strength
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (pwd.length >= 12) score++;
    if (score <= 1) return { score, label: isAr ? 'ضعيف جداً' : 'Très faible', color: 'bg-red-500' };
    if (score === 2) return { score, label: isAr ? 'ضعيف' : 'Faible', color: 'bg-orange-500' };
    if (score === 3) return { score, label: isAr ? 'متوسط' : 'Moyen', color: 'bg-yellow-500' };
    if (score === 4) return { score, label: isAr ? 'قوي' : 'Fort', color: 'bg-green-500' };
    return { score, label: isAr ? 'قوي جداً' : 'Très fort', color: 'bg-emerald-500' };
  };

  const validateAlgerianPhone = (phone: string): boolean => {
    if (!phone) return true; // optional
    const cleaned = phone.replace(/[\s\-().]/g, '');
    return /^(\+213|0)(5|6|7)\d{8}$/.test(cleaned);
  };

  const validateForm = (): string | null => {
    if (!email.includes('@') || !email.includes('.')) return isAr ? 'بريد إلكتروني غير صالح' : 'Email invalide';
    if (password.length < 6) return isAr ? 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)' : 'Mot de passe trop court (6 caractères min)';
    if (phoneNumber && !validateAlgerianPhone(phoneNumber)) return isAr ? 'رقم الهاتف غير صالح (مثال: 0555 123 456)' : 'Numéro de téléphone invalide (ex: 0555 123 456)';
    return null;
  };

  // Traductions
  const t = {
    signin: isAr ? 'تسجيل الدخول' : 'Connexion',
    signup: isAr ? 'التسجيل' : 'Inscription',
    email: isAr ? 'البريد الإلكتروني' : 'Email',
    password: isAr ? 'كلمة المرور' : 'Mot de passe',
    firstName: isAr ? 'الاسم الأول' : 'Prénom',
    lastName: isAr ? 'اسم العائلة' : 'Nom',
    profession: isAr ? 'المهنة' : 'Profession',
    registrationNumber: isAr ? 'رقم التسجيل' : 'N° Inscription',
    phone: isAr ? 'الهاتف' : 'Téléphone',
    organization: isAr ? 'المنظمة/المكتب' : 'Cabinet/Organisation',
    forgotPassword: isAr ? 'نسيت كلمة المرور؟' : 'Mot de passe oublié ?',
    createAccount: isAr ? 'إنشاء حسابي' : 'Créer mon compte',
    signInButton: isAr ? 'تسجيل الدخول' : 'Se connecter',
    loading: isAr ? 'جاري التحميل...' : 'Chargement...',
    signingIn: isAr ? 'جاري تسجيل الدخول...' : 'Connexion...',
    creatingAccount: isAr ? 'جاري إنشاء الحساب...' : 'Création du compte...',
    minChars: isAr ? 'الحد الأدنى 6 أحرف' : 'Minimum 6 caractères',
    terms: isAr ? 'بالتسجيل، أنت توافق على شروط الاستخدام' : 'En vous connectant, vous acceptez nos conditions d\'utilisation',
    professionalEmail: isAr ? 'البريد الإلكتروني المهني' : 'Email professionnel',
    backToSignin: isAr ? '← العودة إلى تسجيل الدخول' : '← Retour à la connexion',
    resetPassword: isAr ? 'إعادة تعيين كلمة المرور' : 'Réinitialiser le mot de passe',
    resetPasswordDesc: isAr ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين' : 'Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe',
    sendResetLink: isAr ? 'إرسال رابط إعادة التعيين' : 'Envoyer le lien de réinitialisation',
    sending: isAr ? 'جاري الإرسال...' : 'Envoi en cours...',
    showPassword: isAr ? 'إظهار كلمة المرور' : 'Afficher le mot de passe',
    hidePassword: isAr ? 'إخفاء كلمة المرور' : 'Masquer le mot de passe',
    optional: isAr ? 'اختياري' : 'Optionnel',
  };

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
    
    // Valider les champs requis
    if (!email || !password || !firstName || !lastName) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    // Afficher d'abord les CGU, puis le modal de sélection de plan
    setShowLegalAcceptance(true);
  };

  const handleLegalAccepted = () => {
    setShowLegalAcceptance(false);
    setShowPlanSelection(true);
  };

  const handlePlanSelected = async (plan: 'free' | 'pro' | 'cabinet') => {
    setSelectedPlan(plan);
    setShowPlanSelection(false);
    setLoading(true);
    setError(null);

    try {
      // Créer l'utilisateur avec le plan choisi
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
            phone_number: phoneNumber,
            plan: plan  // ← IMPORTANT: Passer le plan choisi
          }
        }
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        
        // Afficher le modal de vérification d'email
        setRegisteredEmail(email);
        setShowEmailVerification(true);
        
        // Déconnecter l'utilisateur car son compte n'est pas encore actif
        await supabase.auth.signOut();
      }
    } catch (err: any) {
      // Améliorer le message d'erreur
      let errorMessage = err.message || 'Erreur lors de la création du compte';
      
      if (err.message?.includes('already registered') || err.message?.includes('User already registered')) {
        errorMessage = 'Cet email est déjà utilisé. Essayez de vous connecter ou utilisez "Mot de passe oublié".';
      } else if (err.message?.includes('already exists')) {
        errorMessage = 'Un profil existe déjà pour cet utilisateur.';
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-slate-100 via-white to-slate-100'} flex items-center justify-center p-4 sm:p-6 lg:p-8`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md lg:max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-legal-gold to-amber-600 rounded-xl flex items-center justify-center">
              <span className="text-xl sm:text-2xl">⚖️</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>JuristDZ</h1>
          </div>
          <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {isAr ? 'مساعد قانوني ذكي جزائري' : 'Assistant IA Juridique Algérien'}
          </p>
        </div>

        {/* Auth Card */}
        <div className={`${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} backdrop-blur-xl rounded-2xl border shadow-2xl overflow-hidden`}>
          {/* Header avec langue et mode */}
          <div className={`p-3 sm:p-4 border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-slate-50'} flex items-center justify-between flex-wrap gap-2`}>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('fr')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  language === 'fr'
                    ? 'bg-legal-gold text-white'
                    : theme === 'dark'
                    ? 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
                title="Français"
              >
                🇫🇷 FR
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  language === 'ar'
                    ? 'bg-legal-gold text-white'
                    : theme === 'dark'
                    ? 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
                title="العربية"
              >
                🇩🇿 AR
              </button>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Content avec scroll optimisé */}
          <div className="p-4 sm:p-6 lg:p-8 max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar pb-20 sm:pb-24">
            {/* Mode Toggle */}
            <div className={`flex gap-2 mb-4 sm:mb-6 p-1 rounded-xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-all ${
                  mode === 'signin'
                    ? 'bg-legal-gold text-white shadow-lg'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.signin}
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-all ${
                  mode === 'signup'
                    ? 'bg-legal-gold text-white shadow-lg'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.signup}
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
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 sm:py-3 ${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    } border rounded-lg focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent transition-all`}
                    placeholder="maitre@barreau.dz"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t.password}
                </label>
                <div className="relative">
                  <Lock className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full ${isAr ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-2.5 sm:py-3 ${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    } border rounded-lg focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent transition-all`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'} transition-colors`}
                    title={showPassword ? t.hidePassword : t.showPassword}
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
                className="w-full py-2.5 sm:py-3 bg-legal-gold text-white rounded-lg font-bold hover:bg-legal-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.signingIn}
                  </>
                ) : (
                  t.signInButton
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className={`text-sm ${theme === 'dark' ? 'text-slate-400 hover:text-legal-gold' : 'text-slate-600 hover:text-legal-gold'} transition-colors`}
                >
                  {t.forgotPassword}
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.resetPassword}</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t.resetPasswordDesc}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 sm:py-3 ${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    } border rounded-lg focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent transition-all`}
                    placeholder="maitre@barreau.dz"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 bg-legal-gold text-white rounded-lg font-bold hover:bg-legal-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.sending}
                  </>
                ) : (
                  t.sendResetLink
                )}
              </button>

              {/* Back to Sign In */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`text-sm ${theme === 'dark' ? 'text-slate-400 hover:text-legal-gold' : 'text-slate-600 hover:text-legal-gold'} transition-colors`}
                >
                  {t.backToSignin}
                </button>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4 pb-8">
              {/* Nom et Prénom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.firstName}
                  </label>
                  <div className="relative">
                    <User className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 ${
                        theme === 'dark' 
                          ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' 
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      } border rounded-lg focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent transition-all`}
                      placeholder="Ahmed"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.lastName}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`w-full px-4 py-2.5 ${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    } border rounded-lg focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent transition-all`}
                    placeholder="Benali"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t.professionalEmail}
                </label>
                <div className="relative">
                  <Mail className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 ${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    } border rounded-lg focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent transition-all`}
                    placeholder="maitre@barreau.dz"
                    required
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t.password}
                </label>
                <div className="relative">
                  <Lock className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full ${isAr ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-2.5 ${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    } border rounded-lg focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent transition-all`}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'} transition-colors`}
                    title={showPassword ? t.hidePassword : t.showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>{t.minChars}</p>
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && (() => {
                const strength = getPasswordStrength(password);
                return (
                  <div className="mt-1">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : (theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200')}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isAr ? 'قوة كلمة المرور: ' : 'Force: '}<span className="font-medium">{strength.label}</span>
                    </p>
                  </div>
                );
              })()}

              {/* Profession */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t.profession}
                </label>
                <div className="relative">
                  <Briefcase className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value as Profession)}
                    className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 ${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 border-slate-700 text-white' 
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    } border rounded-lg focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent appearance-none cursor-pointer transition-all`}
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

              {/* N° Inscription et Téléphone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.registrationNumber} <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>({t.optional})</span>
                  </label>
                  <div className="relative">
                    <Hash className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 ${
                        theme === 'dark' 
                          ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' 
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      } border rounded-lg focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent transition-all`}
                      placeholder="A/12345/2024"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {t.phone} <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>({t.optional})</span>
                  </label>
                  <div className="relative">
                    <Phone className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 ${
                        theme === 'dark' 
                          ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' 
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                      } border rounded-lg focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent transition-all`}
                      placeholder="+213 555 123 456"
                    />
                  </div>
                </div>
              </div>

              {/* Cabinet/Organisation */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t.organization} <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>({t.optional})</span>
                </label>
                <div className="relative">
                  <Building className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 ${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    } border rounded-lg focus:outline-none focus:ring-2 focus:ring-legal-gold focus:border-transparent transition-all`}
                    placeholder="Cabinet Benali & Associés"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 bg-legal-gold text-white rounded-lg font-bold hover:bg-legal-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.creatingAccount}
                  </>
                ) : (
                  t.createAccount
                )}
              </button>
            </form>
          )}
          </div>
        </div>

        {/* Footer */}
        <p className={`text-center text-xs sm:text-sm mt-4 sm:mt-6 px-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
          {t.terms}
        </p>
      </div>

      {/* Email Verification Modal */}
      {showEmailVerification && (
        <EmailVerificationModal
          email={registeredEmail}
          language={language}
          onClose={() => {
            setShowEmailVerification(false);
            setMode('signin');
          }}
        />
      )}

      {/* Legal Acceptance Modal — affiché avant la sélection du plan */}
      {showLegalAcceptance && (
        <LegalAcceptanceModal
          language={language}
          mode="signup"
          onAccept={handleLegalAccepted}
          onDecline={() => setShowLegalAcceptance(false)}
        />
      )}

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        isOpen={showPlanSelection}
        onClose={() => setShowPlanSelection(false)}
        onSelectPlan={handlePlanSelected}
        isAr={isAr}
      />
    </div>
  );
};

export default AuthForm;
