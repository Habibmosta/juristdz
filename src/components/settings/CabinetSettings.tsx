import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Language, UserRole } from '../../../types';
import {
  SlidersHorizontal, Save, Building, Phone, Mail, MapPin,
  DollarSign, Clock, Globe, Bell, Shield, Palette, Check
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface CabinetSettingsProps {
  userId: string;
  language: Language;
  userRole: UserRole;
}

interface Settings {
  // Cabinet info
  cabinet_name: string;
  cabinet_address: string;
  cabinet_phone: string;
  cabinet_email: string;
  cabinet_website: string;
  wilaya: string;
  // Billing
  hourly_rate: number;
  currency: string;
  tva_rate: number;
  payment_terms: number; // jours
  // Preferences
  default_language: string;
  notifications_email: boolean;
  notifications_deadlines: boolean;
  notifications_invoices: boolean;
  auto_reminder_days: number;
  // Theme
  theme: 'light' | 'dark';
}

const defaultSettings: Settings = {
  cabinet_name: '',
  cabinet_address: '',
  cabinet_phone: '',
  cabinet_email: '',
  cabinet_website: '',
  wilaya: '',
  hourly_rate: 5000,
  currency: 'DZD',
  tva_rate: 19,
  payment_terms: 30,
  default_language: 'fr',
  notifications_email: true,
  notifications_deadlines: true,
  notifications_invoices: true,
  auto_reminder_days: 3,
  theme: 'dark',
};

const translations = {
  fr: {
    title: 'Paramètres du Cabinet',
    subtitle: 'Configurez vos informations professionnelles et préférences',
    cabinetInfo: 'Informations du Cabinet',
    cabinetName: 'Nom du cabinet',
    address: 'Adresse',
    phone: 'Téléphone',
    email: 'Email professionnel',
    website: 'Site web',
    wilaya: 'Wilaya',
    billing: 'Facturation',
    hourlyRate: 'Taux horaire (DA)',
    currency: 'Devise',
    tvaRate: 'Taux TVA (%)',
    paymentTerms: 'Délai de paiement (jours)',
    preferences: 'Préférences',
    defaultLanguage: 'Langue par défaut',
    notifications: 'Notifications',
    notifEmail: 'Notifications par email',
    notifDeadlines: 'Alertes délais légaux',
    notifInvoices: 'Rappels factures',
    reminderDays: 'Rappel avant échéance (jours)',
    save: 'Enregistrer',
    saved: 'Paramètres sauvegardés',
    loading: 'Chargement...',
    french: 'Français',
    arabic: 'Arabe',
  },
  ar: {
    title: 'إعدادات المكتب',
    subtitle: 'قم بتكوين معلوماتك المهنية وتفضيلاتك',
    cabinetInfo: 'معلومات المكتب',
    cabinetName: 'اسم المكتب',
    address: 'العنوان',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني المهني',
    website: 'الموقع الإلكتروني',
    wilaya: 'الولاية',
    billing: 'الفوترة',
    hourlyRate: 'السعر بالساعة (دج)',
    currency: 'العملة',
    tvaRate: 'نسبة الضريبة (%)',
    paymentTerms: 'أجل الدفع (أيام)',
    preferences: 'التفضيلات',
    defaultLanguage: 'اللغة الافتراضية',
    notifications: 'الإشعارات',
    notifEmail: 'إشعارات البريد الإلكتروني',
    notifDeadlines: 'تنبيهات المواعيد القانونية',
    notifInvoices: 'تذكيرات الفواتير',
    reminderDays: 'التذكير قبل الموعد (أيام)',
    save: 'حفظ',
    saved: 'تم حفظ الإعدادات',
    loading: 'جاري التحميل...',
    french: 'الفرنسية',
    arabic: 'العربية',
  }
};

const CabinetSettings: React.FC<CabinetSettingsProps> = ({ userId, language, userRole }) => {
  const t = translations[language];
  const { addToast } = useToast();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'cabinet' | 'billing' | 'preferences'>('cabinet');

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('cabinet_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data) {
        setSettings({ ...defaultSettings, ...data });
      } else {
        // Try to prefill from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (profile) {
          setSettings(prev => ({
            ...prev,
            cabinet_email: profile.email || '',
            cabinet_phone: profile.phone_number || '',
            cabinet_name: profile.organization_name || '',
          }));
        }
      }
    } catch (err) {
      // No settings yet, use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cabinet_settings')
        .upsert({ ...settings, user_id: userId, updated_at: new Date().toISOString() });

      if (error) throw error;

      // Persist theme preference
      localStorage.setItem('juristdz_theme', settings.theme);
      addToast(t.saved, 'success');
    } catch (err) {
      console.error('Error saving settings:', err);
      addToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-legal-gold"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'cabinet' as const, label: t.cabinetInfo, icon: Building },
    { id: 'billing' as const, label: t.billing, icon: DollarSign },
    { id: 'preferences' as const, label: t.preferences, icon: Bell },
  ];

  return (
    <div className={`p-6 max-w-3xl mx-auto ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <SlidersHorizontal className="w-8 h-8 text-legal-gold" />
          {t.title}
        </h1>
        <p className="text-slate-400">{t.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-legal-gold text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-5">
        {/* Cabinet Info Tab */}
        {activeTab === 'cabinet' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">{t.cabinetName}</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={settings.cabinet_name}
                    onChange={e => update('cabinet_name', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-legal-gold focus:outline-none"
                    placeholder="Cabinet Maître..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">{t.wilaya}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={settings.wilaya}
                    onChange={e => update('wilaya', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-legal-gold focus:outline-none"
                    placeholder="Alger"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-1.5">{t.address}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <textarea
                    value={settings.cabinet_address}
                    onChange={e => update('cabinet_address', e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-legal-gold focus:outline-none resize-none"
                    placeholder="15 Rue Didouche Mourad, Alger"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">{t.phone}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={settings.cabinet_phone}
                    onChange={e => update('cabinet_phone', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-legal-gold focus:outline-none"
                    placeholder="+213 21 XX XX XX"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">{t.email}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={settings.cabinet_email}
                    onChange={e => update('cabinet_email', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-legal-gold focus:outline-none"
                    placeholder="contact@cabinet.dz"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-1.5">{t.website}</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="url"
                    value={settings.cabinet_website}
                    onChange={e => update('cabinet_website', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-legal-gold focus:outline-none"
                    placeholder="https://www.cabinet.dz"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">{t.hourlyRate}</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  value={settings.hourly_rate}
                  onChange={e => update('hourly_rate', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-legal-gold focus:outline-none"
                  min={0}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">{t.tvaRate}</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  value={settings.tva_rate}
                  onChange={e => update('tva_rate', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-legal-gold focus:outline-none"
                  min={0} max={100}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">{t.paymentTerms}</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  value={settings.payment_terms}
                  onChange={e => update('payment_terms', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-legal-gold focus:outline-none"
                  min={0}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">{t.currency}</label>
              <select
                value={settings.currency}
                onChange={e => update('currency', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-legal-gold focus:outline-none"
              >
                <option value="DZD">DZD — Dinar Algérien</option>
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — Dollar</option>
              </select>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">{t.defaultLanguage}</label>
              <div className="flex gap-3">
                {(['fr', 'ar'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => update('default_language', lang)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      settings.default_language === lang
                        ? 'bg-legal-gold border-legal-gold text-white'
                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {lang === 'fr' ? t.french : t.arabic}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-3">{t.notifications}</label>
              <div className="space-y-3">
                {[
                  { key: 'notifications_email' as const, label: t.notifEmail },
                  { key: 'notifications_deadlines' as const, label: t.notifDeadlines },
                  { key: 'notifications_invoices' as const, label: t.notifInvoices },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer">
                    <span className="text-slate-300 text-sm">{item.label}</span>
                    <div
                      onClick={() => update(item.key, !settings[item.key])}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        settings[item.key] ? 'bg-legal-gold' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">{t.reminderDays}</label>
              <div className="relative">
                <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  value={settings.auto_reminder_days}
                  onChange={e => update('auto_reminder_days', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-legal-gold focus:outline-none"
                  min={1} max={30}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-3">
                <Palette className="inline w-4 h-4 mr-1" />
                Thème
              </label>
              <div className="flex gap-3">
                {(['dark', 'light'] as const).map(th => (
                  <button
                    key={th}
                    onClick={() => update('theme', th)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      settings.theme === th
                        ? 'bg-legal-gold border-legal-gold text-white'
                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {th === 'dark' ? '🌙 Sombre' : '☀️ Clair'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-legal-gold text-white rounded-xl font-semibold hover:bg-legal-gold/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {t.save}
        </button>
      </div>
    </div>
  );
};

export default CabinetSettings;
