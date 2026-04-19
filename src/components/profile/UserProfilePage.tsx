/**
 * Page Profil utilisateur — éditable
 * Nom, prénom, téléphone, organisation, numéro d'inscription, photo
 */
import React, { useState, useRef } from 'react';
import { Language, EnhancedUserProfile, UserRole } from '../../../types';
import {
  User, Mail, Phone, Building, Hash, Camera, Save,
  CheckCircle, AlertCircle, Shield, Star, Clock
} from 'lucide-react';
import TwoFactorSetup from '../auth/TwoFactorSetup';
import AuditLogViewer from '../admin/AuditLogViewer';

interface Props {
  user: EnhancedUserProfile;
  language: Language;
  onUpdate?: (updated: Partial<EnhancedUserProfile>) => void;
}

const ROLE_LABELS: Record<UserRole, { fr: string; ar: string }> = {
  [UserRole.AVOCAT]:            { fr: 'Avocat',                    ar: 'محامي' },
  [UserRole.NOTAIRE]:           { fr: 'Notaire',                   ar: 'موثق' },
  [UserRole.HUISSIER]:          { fr: 'Huissier de Justice',       ar: 'محضر قضائي' },
  [UserRole.MAGISTRAT]:         { fr: 'Magistrat',                 ar: 'قاضي' },
  [UserRole.ETUDIANT]:          { fr: 'Étudiant en Droit',         ar: 'طالب حقوق' },
  [UserRole.JURISTE_ENTREPRISE]:{ fr: 'Juriste d\'Entreprise',     ar: 'مستشار قانوني' },
  [UserRole.ADMIN]:             { fr: 'Administrateur',            ar: 'مدير النظام' },
};

const PLAN_CONFIG = {
  free:    { label: { fr: 'Gratuit',  ar: 'مجاني'  }, color: 'text-slate-500',  bg: 'bg-slate-100 dark:bg-slate-800' },
  pro:     { label: { fr: 'Pro',      ar: 'برو'    }, color: 'text-blue-600',   bg: 'bg-blue-100 dark:bg-blue-900/20' },
  cabinet: { label: { fr: 'Cabinet',  ar: 'مكتب'  }, color: 'text-amber-600',  bg: 'bg-amber-100 dark:bg-amber-900/20' },
};

export default function UserProfilePage({ user, language, onUpdate }: Props) {
  const isAr = language === 'ar';
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName:  user.lastName  || '',
    phone:     user.phoneNumber || '',
    organization: user.organizationName || '',
    registrationNumber: user.registrationNumber || '',
    bio: (user as any).bio || '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>((user as any).avatarUrl || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError(isAr ? 'الحجم الأقصى 2 ميغابايت' : 'Taille max 2 Mo');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { supabase } = await import('../../../src/lib/supabase');

      // Upload avatar if changed
      let avatarUrl = (user as any).avatarUrl || null;
      if (avatarPreview && avatarPreview !== avatarUrl && avatarPreview.startsWith('data:')) {
        const base64 = avatarPreview.split(',')[1];
        const byteArr = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const blob = new Blob([byteArr], { type: 'image/jpeg' });
        const path = `avatars/${user.id}.jpg`;
        const { error: upErr } = await supabase.storage.from('profiles').upload(path, blob, { upsert: true });
        if (!upErr) {
          const { data } = supabase.storage.from('profiles').getPublicUrl(path);
          avatarUrl = data.publicUrl;
        }
      }

      const updates: any = {
        first_name: form.firstName,
        last_name:  form.lastName,
        phone:      form.phone,
        organization_name: form.organization,
        registration_number: form.registrationNumber,
        bio: form.bio,
        updated_at: new Date().toISOString(),
      };
      if (avatarUrl) updates.avatar_url = avatarUrl;

      const { error: dbErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (dbErr) throw dbErr;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onUpdate?.({
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phone,
        organizationName: form.organization,
        registrationNumber: form.registrationNumber,
      });
    } catch (err: any) {
      setError(err.message || (isAr ? 'خطأ في الحفظ' : 'Erreur lors de la sauvegarde'));
    } finally {
      setSaving(false);
    }
  };

  const plan = user.subscriptionPlan || 'free';
  const planCfg = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.free;
  const roleLabel = ROLE_LABELS[user.activeRole];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <User className="text-legal-gold" size={32} />
            {isAr ? 'الملف الشخصي' : 'Mon Profil'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isAr ? 'تعديل معلوماتك الشخصية والمهنية' : 'Modifier vos informations personnelles et professionnelles'}
          </p>
        </div>

        {/* Avatar + Plan card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-legal-gold/10 border-4 border-legal-gold/30 flex items-center justify-center overflow-hidden">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  : <User size={40} className="text-legal-gold" />
                }
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-legal-gold text-white rounded-full flex items-center justify-center shadow-md hover:bg-legal-gold/90 transition-colors"
              >
                <Camera size={14} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-slate-500 text-sm">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
                <span className="px-3 py-1 bg-legal-gold/10 text-legal-gold text-xs font-bold rounded-full">
                  {isAr ? roleLabel?.ar : roleLabel?.fr}
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${planCfg.bg} ${planCfg.color}`}>
                  <Star size={10} className="inline mr-1" />
                  {isAr ? planCfg.label.ar : planCfg.label.fr}
                </span>
                {user.trial_ends_at && new Date(user.trial_ends_at) > new Date() && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 text-xs font-bold rounded-full">
                    <Clock size={10} className="inline mr-1" />
                    {isAr ? 'تجربة مجانية' : 'Essai gratuit'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <User size={18} className="text-legal-gold" />
            {isAr ? 'المعلومات الشخصية' : 'Informations Personnelles'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'الاسم' : 'Prénom'}
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                className="mt-1 w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-legal-gold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'اللقب' : 'Nom'}
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                className="mt-1 w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-legal-gold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Mail size={12} />
              {isAr ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="mt-1 w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-sm text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">
              {isAr ? 'لا يمكن تغيير البريد الإلكتروني' : 'L\'email ne peut pas être modifié'}
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Phone size={12} />
              {isAr ? 'رقم الهاتف' : 'Téléphone'}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="0555 123 456"
              className="mt-1 w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-legal-gold"
            />
          </div>
        </div>

        {/* Professional info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Shield size={18} className="text-legal-gold" />
            {isAr ? 'المعلومات المهنية' : 'Informations Professionnelles'}
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Building size={12} />
              {isAr ? 'المنظمة / المكتب' : 'Organisation / Cabinet'}
            </label>
            <input
              type="text"
              value={form.organization}
              onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
              placeholder={isAr ? 'مكتب المحاماة...' : 'Cabinet juridique...'}
              className="mt-1 w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-legal-gold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Hash size={12} />
              {isAr ? 'رقم التسجيل المهني' : 'N° d\'inscription professionnelle'}
            </label>
            <input
              type="text"
              value={form.registrationNumber}
              onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))}
              placeholder="ALG/2024/001"
              className="mt-1 w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-legal-gold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isAr ? 'نبذة مختصرة' : 'Biographie courte'}
            </label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={3}
              placeholder={isAr ? 'نبذة عن مسيرتك المهنية...' : 'Quelques mots sur votre parcours...'}
              className="mt-1 w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-legal-gold resize-none"
            />
          </div>
        </div>

        {/* Save button */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-red-600 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-legal-gold text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-legal-gold/90 transition-colors disabled:opacity-60"
        >
          {saved
            ? <><CheckCircle size={18} /> {isAr ? 'تم الحفظ!' : 'Sauvegardé!'}</>
            : saving
            ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {isAr ? 'جاري الحفظ...' : 'Sauvegarde...'}</>
            : <><Save size={18} /> {isAr ? 'حفظ التغييرات' : 'Sauvegarder les modifications'}</>
          }
        </button>

        {/* 2FA Section */}
        <TwoFactorSetup
          language={language}
          mfaEnabled={user.mfaEnabled ?? false}
          onUpdate={(enabled) => onUpdate({ ...user, mfaEnabled: enabled })}
        />

        {/* Audit log */}
        <AuditLogViewer userId={user.id} language={language} />

      </div>
    </div>
  );
}
