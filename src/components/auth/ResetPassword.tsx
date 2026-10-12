import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/authService';

type Language = 'fr' | 'ar';

const T = {
  fr: {
    title: 'Nouveau mot de passe',
    subtitle: 'Choisissez un nouveau mot de passe pour votre compte JuristDZ.',
    password: 'Nouveau mot de passe',
    confirm: 'Confirmer le mot de passe',
    submit: 'Réinitialiser le mot de passe',
    loading: 'Réinitialisation en cours...',
    mismatch: 'Les deux mots de passe ne correspondent pas.',
    tooShort: 'Le mot de passe doit contenir au moins 8 caractères.',
    invalidLink: 'Lien de réinitialisation invalide ou expiré. Demandez un nouveau lien depuis la page de connexion.',
    success: 'Mot de passe mis à jour avec succès. Vous pouvez vous connecter.',
    back: 'Retour à la connexion',
    noToken: 'Aucun jeton de réinitialisation détecté dans le lien.',
    redirect: 'Redirection vers la connexion...'
  },
  ar: {
    title: 'كلمة مرور جديدة',
    subtitle: 'اختر كلمة مرور جديدة لحسابك على JuristDZ.',
    password: 'كلمة المرور الجديدة',
    confirm: 'تأكيد كلمة المرور',
    submit: 'إعادة تعيين كلمة المرور',
    loading: 'جارٍ إعادة التعيين...',
    mismatch: 'كلمتا المرور غير متطابقتين.',
    tooShort: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.',
    invalidLink: 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية. اطلب رابطاً جديداً من صفحة تسجيل الدخول.',
    success: 'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.',
    back: 'العودة إلى تسجيل الدخول',
    noToken: 'لم يتم العثور على رمز إعادة التعيين في الرابط.',
    redirect: 'جارٍ التحويل إلى تسجيل الدخول...'
  }
};

const ResetPassword: React.FC = () => {
  const [language, setLanguage] = useState<Language>('fr');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const t = T[language];
  const isAr = language === 'ar';

  useEffect(() => {
    const savedTheme = localStorage.getItem('juristdz_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);

    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token'));
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const goHome = () => {
    window.history.replaceState({}, '', '/');
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t.tooShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.mismatch);
      return;
    }
    if (!token) return;

    setLoading(true);
    try {
      const result = await authService.confirmResetPassword(token, password);
      if (!result.success) {
        setError(result.error || t.invalidLink);
        return;
      }
      setSuccess(true);
      setTimeout(goHome, 3000);
    } catch (err: any) {
      setError(err?.message || t.invalidLink);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-slate-100 via-white to-slate-100'} flex items-center justify-center p-4 sm:p-6 lg:p-8`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md lg:max-w-lg">
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

        <div className={`${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} backdrop-blur-xl rounded-2xl border shadow-2xl overflow-hidden`}>
          <div className={`p-3 sm:p-4 border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-slate-50'} flex items-center justify-between`}>
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
              >
                🇩🇿 AR
              </button>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-slate-700/50 hover:bg-slate-700 text-amber-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
              aria-label="theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {success ? (
              <div className="text-center" data-testid="reset-success">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-900/20 mb-4">
                  <CheckCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <h2 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.success}</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t.redirect}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-legal-gold/15">
                    <KeyRound className="w-5 h-5 text-legal-gold" />
                  </div>
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.title}</h2>
                </div>
                <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t.subtitle}</p>

                {!token && (
                  <div className="mb-4 bg-red-900/20 border border-red-800 rounded-xl p-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-red-200 text-sm">{t.noToken}</p>
                  </div>
                )}

                {error && (
                  <div className="mb-4 bg-red-900/20 border border-red-800 rounded-xl p-3 flex items-center gap-2" data-testid="reset-error">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{t.password}</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${
                        theme === 'dark'
                          ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-legal-gold'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-legal-gold'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{t.confirm}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${
                        theme === 'dark'
                          ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-legal-gold'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-legal-gold'
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full py-3 bg-legal-gold text-white rounded-xl font-bold hover:bg-legal-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? t.loading : t.submit}
                  </button>
                </form>

                <button
                  onClick={goHome}
                  className={`mt-6 w-full flex items-center justify-center gap-1.5 text-sm transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <ArrowLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                  {t.back}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
