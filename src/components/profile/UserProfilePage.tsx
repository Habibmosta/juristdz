import React, { useState } from 'react';
import { Language, UserRole } from '../../../types';
import { EnhancedUserProfile } from '../../hooks/useAuth';
import { User, Phone, Building, Hash, Save, CheckCircle, AlertCircle } from 'lucide-react';
import TwoFactorSetup from '../auth/TwoFactorSetup';
import AuditLogViewer from '../admin/AuditLogViewer';
import { API_URL } from '../../config/apiConfig';

interface Props {
  user: EnhancedUserProfile;
  language: Language;
  onUpdate?: (updated: Partial<EnhancedUserProfile>) => void;
}

const PLAN_CONFIG = {
  free:    { label: { fr: 'Gratuit',  ar: 'مجاني'  }, color: 'text-slate-500',  bg: 'bg-slate-100' },
  pro:     { label: { fr: 'Pro',      ar: 'برو'    }, color: 'text-blue-600',   bg: 'bg-blue-100' },
  cabinet: { label: { fr: 'Cabinet',  ar: 'مكتب'  }, color: 'text-amber-600',  bg: 'bg-amber-100' },
};

export default function UserProfilePage({ user, language, onUpdate }: Props) {
  const isAr = language === 'ar';

  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName:  user.lastName  || '',
    phone:     user.phoneNumber || '',
    organization: user.organizationName || '',
    registrationNumber: user.registrationNumber || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('juristdz_access_token');
      if (!token) throw new Error('Pas de token');
      
      const updates = {
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phone,
        organizationName: form.organization,
        registrationNumber: form.registrationNumber,
      };
      
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur serveur');
      }
      
      setSaved(true);
      setTimeout(() => { setSaved(false); window.location.reload(); }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const plan = user.subscriptionPlan || 'free';
  const planCfg = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.free;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <User className="text-yellow-500" size={32} />
          {isAr ? 'الملف الشخصي' : 'Mon Profil'}
        </h1>

        <div className="bg-white rounded-2xl border p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">{isAr ? 'الاسم' : 'Prénom'}</label>
              <input type="text" value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))}
                className="mt-1 w-full px-4 py-2.5 border rounded-xl bg-slate-50" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">{isAr ? 'اللقب' : 'Nom'}</label>
              <input type="text" value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))}
                className="mt-1 w-full px-4 py-2.5 border rounded-xl bg-slate-50" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase"><Phone size={12} /> {isAr ? 'الهاتف' : 'Téléphone'}</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                className="mt-1 w-full px-4 py-2.5 border rounded-xl bg-slate-50" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase"><Building size={12} /> {isAr ? 'المكتب' : 'Organisation'}</label>
              <input type="text" value={form.organization} onChange={e => setForm(f => ({...f, organization: e.target.value}))}
                className="mt-1 w-full px-4 py-2.5 border rounded-xl bg-slate-50" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase"><Hash size={12} /> {isAr ? 'رقم التسجيل' : 'N° Inscription'}</label>
              <input type="text" value={form.registrationNumber} onChange={e => setForm(f => ({...f, registrationNumber: e.target.value}))}
                className="mt-1 w-full px-4 py-2.5 border rounded-xl bg-slate-50" />
            </div>
          </div>
        </div>

        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"><AlertCircle size={16} /> {error}</div>}

        <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-yellow-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {saved ? <><CheckCircle size={18} /> {isAr ? 'تم!' : 'Sauvegardé!'}</> : saving ? '...' : <><Save size={18} /> {isAr ? 'حفظ' : 'Sauvegarder'}</>}
        </button>

        <TwoFactorSetup language={language} mfaEnabled={user.mfaEnabled ?? false} onUpdate={(enabled) => onUpdate?.({ ...user, mfaEnabled: enabled })} />
        <AuditLogViewer userId={user.id} language={language} />
      </div>
    </div>
  );
}