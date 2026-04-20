import React, { useState, useEffect } from 'react';
import { Language, EnhancedUserProfile } from '../../types';
import {
  Settings, Users, BarChart3, Shield, Database, Server, Activity,
  AlertTriangle, CheckCircle, TrendingUp, Clock, Eye, Edit, Trash2,
  Plus, Search, Download, Wifi, Lock, Building, CreditCard, Gavel,
  Filter, Scale, BookOpen, Briefcase, GraduationCap, Building2, Star,
  X, Save, UserCheck, UserX, Ban, RefreshCw, Mail, Phone, Hash
} from 'lucide-react';
import OrganizationManagement from './admin/OrganizationManagement';
import SubscriptionManagement from './admin/SubscriptionManagement';
import JurisprudenceValidationPanel from '../jurisprudence/JurisprudenceValidationPanel';
import AdminPaymentsPanel from '../../src/components/billing/AdminPaymentsPanel';
import Modal from '../../src/components/common/Modal';
interface AdminInterfaceProps {
  user: EnhancedUserProfile;
  language: Language;
  theme?: 'light' | 'dark';
}

interface UtilisateurSysteme {
  id: string;
  nom: string;
  email: string;
  role: string;
  profession: string;
  organisation: string;
  dernierAcces: Date;
  statut: 'actif' | 'inactif' | 'suspendu';
  credits: number;
  plan: string;
}

// Config role -> couleur + icone + label
const ROLE_CONFIG: Record<string, {
  label_fr: string; label_ar: string;
  color: string; icon: React.ReactNode;
}> = {
  avocat:             { label_fr: 'Avocat',            label_ar: 'محامي',         color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',    icon: <Scale size={11} /> },
  notaire:            { label_fr: 'Notaire',            label_ar: 'موثق',          color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: <BookOpen size={11} /> },
  huissier:           { label_fr: 'Huissier',           label_ar: 'محضر',          color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', icon: <Briefcase size={11} /> },
  magistrat:          { label_fr: 'Magistrat',          label_ar: 'قاضي',          color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',       icon: <Gavel size={11} /> },
  etudiant:           { label_fr: 'Etudiant',           label_ar: 'طالب',          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: <GraduationCap size={11} /> },
  juriste_entreprise: { label_fr: 'Juriste Entreprise', label_ar: 'مستشار قانوني', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',   icon: <Building2 size={11} /> },
  admin:              { label_fr: 'Administrateur',     label_ar: 'مدير',          color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',    icon: <Shield size={11} /> },
};

const PLAN_CONFIG: Record<string, { label: string; color: string }> = {
  free:    { label: 'Gratuit', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  pro:     { label: 'Pro',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  cabinet: { label: 'Cabinet', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

interface MetriqueSysteme {
  nom: string;
  valeur: string | number;
  unite?: string;
  tendance: 'hausse' | 'baisse' | 'stable';
  statut: 'bon' | 'attention' | 'critique';
}

type AdminTab = 'overview' | 'organizations' | 'subscriptions' | 'payments' | 'jurisprudence';

// Modal state types
interface EditForm {
  firstName: string; lastName: string; profession: string;
  organisation: string; plan: string; credits: string;
  accountStatus: string; isAdmin: boolean;
}


      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-xl text-white font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* MODAL VIEW — Portal via z-index élevé */}
      {modalMode === 'view' && selectedUser && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Eye size={18} className="text-blue-500" /> Profil utilisateur
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: 'Nom complet', value: selectedUser.nom },
                { label: 'Email', value: selectedUser.email },
                { label: 'Role', value: ROLE_CONFIG[selectedUser.profession]?.label_fr || selectedUser.profession },
                { label: 'Organisation', value: selectedUser.organisation },
                { label: 'Plan', value: PLAN_CONFIG[selectedUser.plan]?.label || selectedUser.plan },
                { label: 'Credits', value: String(selectedUser.credits) },
                { label: 'Statut', value: selectedUser.statut },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{value || '-'}</span>
                </div>
              ))}
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={() => { closeModal(); openModal(selectedUser, 'edit'); }}
                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2">
                <Edit size={15} /> Modifier
              </button>
              <button onClick={closeModal}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT — onglets Profil / Mot de passe */}
      {modalMode === 'edit' && selectedUser && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
            style={{ maxHeight: 'min(90vh, 660px)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${(ROLE_CONFIG[selectedUser.profession] || ROLE_CONFIG['avocat']).color}`}>
                  {selectedUser.nom.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedUser.nom}</p>
                  <p className="text-xs text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Onglets */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 shrink-0 px-6">
              <button
                onClick={() => setShowForcePassword(false)}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors -mb-px ${
                  !showForcePassword ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Edit size={13} className="inline mr-1.5" />Modifier le profil
              </button>
              <button
                onClick={() => setShowForcePassword(true)}
                className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors -mb-px ${
                  showForcePassword ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Lock size={13} className="inline mr-1.5" />Mot de passe
              </button>
            </div>

            {/* Corps */}
            <div className="flex-1 overflow-y-auto">

              {/* Onglet 1 — Profil */}
              {!showForcePassword && (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Prenom</label>
                      <input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Nom</label>
                      <input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Role</label>
                      <select value={editForm.profession} onChange={e => setEditForm(f => ({ ...f, profession: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400">
                        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label_fr}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Statut</label>
                      <select value={editForm.accountStatus} onChange={e => setEditForm(f => ({ ...f, accountStatus: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400">
                        <option value="active">Actif</option>
                        <option value="trial">Essai</option>
                        <option value="suspended">Suspendu</option>
                        <option value="blocked">Bloque</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Organisation / Cabinet</label>
                    <input value={editForm.organisation} onChange={e => setEditForm(f => ({ ...f, organisation: e.target.value }))}
                      placeholder="Nom du cabinet..."
                      className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Plan</label>
                      <select value={editForm.plan} onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400">
                        <option value="free">Gratuit</option>
                        <option value="pro">Pro</option>
                        <option value="cabinet">Cabinet</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Credits</label>
                      <input type="number" value={editForm.credits} onChange={e => setEditForm(f => ({ ...f, credits: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800">
                    <input type="checkbox" checked={editForm.isAdmin} onChange={e => setEditForm(f => ({ ...f, isAdmin: e.target.checked }))} className="w-4 h-4 accent-rose-600" />
                    <div>
                      <span className="text-sm font-bold text-rose-700 dark:text-rose-400">Administrateur plateforme</span>
                      <p className="text-xs text-rose-500">Acces complet a toutes les fonctions admin</p>
                    </div>
                  </label>
                </div>
              )}

              {/* Onglet 2 — Mot de passe */}
              {showForcePassword && (
                <div className="p-6 space-y-5">
                  <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl shrink-0"><Mail size={18} className="text-blue-600 dark:text-blue-400" /></div>
                      <div>
                        <h3 className="font-bold text-sm text-blue-800 dark:text-blue-200">Envoyer un lien de reinitialisation</h3>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">L'utilisateur recoit un email avec un lien securise pour choisir son nouveau mot de passe.</p>
                      </div>
                    </div>
                    <button onClick={() => handleResetPassword(selectedUser.email, selectedUser.nom)} disabled={resetLoading}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                      {resetLoading ? <RefreshCw size={15} className="animate-spin" /> : <Mail size={15} />}
                      Envoyer l'email a {selectedUser.email}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <span className="text-xs text-slate-400 font-medium">OU</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="p-5 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl shrink-0"><Lock size={18} className="text-purple-600 dark:text-purple-400" /></div>
                      <div>
                        <h3 className="font-bold text-sm text-purple-800 dark:text-purple-200">Forcer un nouveau mot de passe</h3>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">Definissez directement le mot de passe. Les sessions actives seront invalidees.</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Nouveau mot de passe (min. 8 caracteres)"
                        className="w-full px-4 py-2.5 border border-purple-300 dark:border-purple-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-purple-400" />
                      {newPassword.length > 0 && newPassword.length < 8 && <p className="text-xs text-red-500">Minimum 8 caracteres ({newPassword.length}/8)</p>}
                      {newPassword.length >= 8 && <p className="text-xs text-green-600">Mot de passe valide</p>}
                      <button onClick={handleForcePassword} disabled={forcePasswordLoading || newPassword.length < 8}
                        className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {forcePasswordLoading ? <RefreshCw size={15} className="animate-spin" /> : <Lock size={15} />}
                        Appliquer le nouveau mot de passe
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0 flex gap-3">
              {!showForcePassword ? (
                <>
                  <button onClick={handleSaveEdit} disabled={actionLoading}
                    className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {actionLoading ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                    Enregistrer les modifications
                  </button>
                  <button onClick={closeModal} className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Annuler
                  </button>
                </>
              ) : (
                <button onClick={closeModal} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DELETE */}
      {modalMode === 'delete' && selectedUser && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between p-6 border-b border-red-100 dark:border-red-900">
              <h2 className="font-bold text-lg flex items-center gap-2 text-red-600"><Ban size={18} /> Bloquer le compte</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Le compte de <strong>{selectedUser.nom}</strong> ({selectedUser.email}) sera bloque et desactive.
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Raison (optionnel)</label>
                <textarea value={deleteReason} onChange={e => setDeleteReason(e.target.value)}
                  rows={3} placeholder="Raison du blocage..."
                  className="mt-1 w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-red-400 resize-none" />
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={handleDelete} disabled={actionLoading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {actionLoading ? <RefreshCw size={15} className="animate-spin" /> : <Ban size={15} />}
                Bloquer le compte
              </button>
              <button onClick={closeModal} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminInterface;
