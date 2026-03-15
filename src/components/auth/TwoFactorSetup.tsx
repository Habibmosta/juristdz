import React, { useState } from 'react';
import { Shield, ShieldCheck, ShieldOff, Smartphone, Copy, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppToast } from '../../contexts/ToastContext';
import type { Language } from '../../../types';

interface TwoFactorSetupProps {
  language: Language;
  mfaEnabled: boolean;
  onUpdate: (enabled: boolean) => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ language, mfaEnabled, onUpdate }) => {
  const { toast } = useAppToast();
  const isAr = language === 'ar';
  const [step, setStep] = useState<'idle' | 'qr' | 'verify' | 'disable'>('idle');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep('qr');
    } catch (err: any) {
      toast(err.message || (isAr ? 'خطأ في التفعيل' : 'Erreur lors de l\'activation'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast(isAr ? 'أدخل رمزاً مكوناً من 6 أرقام' : 'Entrez un code à 6 chiffres', 'warning');
      return;
    }
    setLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) throw verifyError;

      toast(isAr ? 'تم تفعيل المصادقة الثنائية بنجاح' : 'Authentification à deux facteurs activée', 'success');
      setStep('idle');
      setCode('');
      onUpdate(true);
    } catch (err: any) {
      toast(err.message || (isAr ? 'رمز غير صحيح' : 'Code incorrect'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];
      if (!totpFactor) throw new Error('No TOTP factor found');

      const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
      if (error) throw error;

      toast(isAr ? 'تم إلغاء تفعيل المصادقة الثنائية' : 'Authentification à deux facteurs désactivée', 'info');
      setStep('idle');
      onUpdate(false);
    } catch (err: any) {
      toast(err.message || (isAr ? 'خطأ في الإلغاء' : 'Erreur lors de la désactivation'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-6">
      <div className="flex items-center gap-3 mb-4">
        {mfaEnabled
          ? <ShieldCheck size={24} className="text-green-500" />
          : <Shield size={24} className="text-slate-400" />}
        <div>
          <h3 className="font-bold text-lg">{isAr ? 'المصادقة الثنائية (2FA)' : 'Authentification à deux facteurs'}</h3>
          <p className="text-sm text-slate-500">
            {mfaEnabled
              ? (isAr ? 'مفعّلة — حسابك محمي' : 'Activée — votre compte est protégé')
              : (isAr ? 'غير مفعّلة — يُنصح بالتفعيل' : 'Désactivée — activation recommandée')}
          </p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
          mfaEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {mfaEnabled ? (isAr ? 'مفعّل' : 'Activé') : (isAr ? 'غير مفعّل' : 'Désactivé')}
        </span>
      </div>

      {/* Idle state */}
      {step === 'idle' && (
        <div className="flex gap-3">
          {!mfaEnabled ? (
            <button
              onClick={handleEnroll}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-legal-gold text-white rounded-xl font-medium hover:bg-legal-gold/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
              {isAr ? 'تفعيل 2FA' : 'Activer 2FA'}
            </button>
          ) : (
            <button
              onClick={() => setStep('disable')}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
            >
              <ShieldOff size={16} />
              {isAr ? 'إلغاء التفعيل' : 'Désactiver'}
            </button>
          )}
        </div>
      )}

      {/* QR Code step */}
      {step === 'qr' && (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            {isAr
              ? 'امسح رمز QR باستخدام تطبيق Google Authenticator أو Authy'
              : 'Scannez le QR code avec Google Authenticator ou Authy'}
          </div>
          {qrCode && (
            <div className="flex justify-center">
              <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48 rounded-xl border-4 border-white shadow-lg" />
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500 mb-1">{isAr ? 'أو أدخل المفتاح يدوياً:' : 'Ou entrez la clé manuellement :'}</p>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
              <code className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{secret}</code>
              <button onClick={copySecret} className="text-slate-400 hover:text-legal-gold transition-colors">
                {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              {isAr ? 'أدخل الرمز من التطبيق للتحقق:' : 'Entrez le code de l\'application pour vérifier :'}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setStep('idle'); setCode(''); }} className="flex-1 px-4 py-2.5 border dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
            <button onClick={handleVerify} disabled={loading || code.length !== 6} className="flex-1 px-4 py-2.5 bg-legal-gold text-white rounded-xl font-medium hover:bg-legal-gold/90 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isAr ? 'تحقق وتفعيل' : 'Vérifier et activer'}
            </button>
          </div>
        </div>
      )}

      {/* Disable confirmation */}
      {step === 'disable' && (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
            {isAr ? '⚠️ سيؤدي هذا إلى إزالة الحماية الإضافية من حسابك.' : '⚠️ Cela supprimera la protection supplémentaire de votre compte.'}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('idle')} className="flex-1 px-4 py-2.5 border dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
            <button onClick={handleDisable} disabled={loading} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isAr ? 'تأكيد الإلغاء' : 'Confirmer la désactivation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
