import React, { useState } from 'react';
import { Users, Clock, FileText, BarChart3, FolderOpen, FileEdit, MessageSquare, BookOpen } from 'lucide-react';
import { ClientManagement } from '../clients/ClientManagement';
import { TimeTracker } from '../time/TimeTracker';
import { InvoiceManagement } from '../invoices/InvoiceManagement';

type LawyerView = 'dashboard' | 'clients' | 'time' | 'invoices' | 'cases' | 'documents' | 'chat' | 'docs';

export const LawyerDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<LawyerView>('dashboard');

  const menuItems = [
    { id: 'dashboard' as LawyerView, label: 'Tableau de Bord', icon: BarChart3, color: 'blue' },
    { id: 'clients' as LawyerView, label: 'Clients', icon: Users, color: 'purple' },
    { id: 'time' as LawyerView, label: 'Temps', icon: Clock, color: 'emerald' },
    { id: 'invoices' as LawyerView, label: 'Factures', icon: FileText, color: 'amber' },
    { id: 'cases' as LawyerView, label: 'Dossiers', icon: FolderOpen, color: 'cyan' },
    { id: 'documents' as LawyerView, label: 'Documents', icon: FileEdit, color: 'pink' },
    { id: 'chat' as LawyerView, label: 'Assistant IA', icon: MessageSquare, color: 'green' },
    { id: 'docs' as LawyerView, label: 'Documentation', icon: BookOpen, color: 'slate' },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'clients':
        return <ClientManagement />;
      case 'time':
        return <TimeTracker />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentView} />;
      default:
        return (
          <div className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Fonctionnalité en développement</h2>
              <p className="text-slate-400">Cette section sera bientôt disponible</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-white">JuristDZ</h1>
          <p className="text-sm text-slate-400">Cabinet d'Avocat</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? `bg-${item.color}-500/20 text-${item.color}-400 border border-${item.color}-500/30`
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 text-center">
            Version 2.0 - Mars 2026
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardView: React.FC<{ onNavigate: (view: LawyerView) => void }> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Tableau de Bord</h1>
          <p className="text-slate-400">Vue d'ensemble de votre activité</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <QuickActionCard
            title="Nouveau Client"
            description="Ajouter un client"
            icon={Users}
            color="purple"
            onClick={() => onNavigate('clients')}
          />
          <QuickActionCard
            title="Démarrer Timer"
            description="Suivre votre temps"
            icon={Clock}
            color="emerald"
            onClick={() => onNavigate('time')}
          />
          <QuickActionCard
            title="Nouvelle Facture"
            description="Créer une facture"
            icon={FileText}
            color="amber"
            onClick={() => onNavigate('invoices')}
          />
          <QuickActionCard
            title="Nouveau Dossier"
            description="Créer un dossier"
            icon={FolderOpen}
            color="cyan"
            onClick={() => onNavigate('cases')}
          />
        </div>

        {/* Features Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeatureCard
            title="Gestion des Clients"
            description="Gérez vos clients comme Clio - Fiches complètes, statistiques, facturation"
            icon={Users}
            color="purple"
            features={[
              'Fiches clients complètes',
              'Statistiques par client',
              'Liaison avec dossiers',
              'Recherche avancée'
            ]}
            onClick={() => onNavigate('clients')}
          />
          <FeatureCard
            title="Time Tracking"
            description="Suivez votre temps comme Clio - Chronomètre, taux horaire, facturation auto"
            icon={Clock}
            color="emerald"
            features={[
              'Chronomètre en temps réel',
              'Calcul automatique montants',
              'Heures facturables',
              'Conversion en facture'
            ]}
            onClick={() => onNavigate('time')}
          />
          <FeatureCard
            title="Facturation Pro"
            description="Facturez comme Clio - Génération auto, suivi paiements, statistiques"
            icon={FileText}
            color="amber"
            features={[
              'Génération automatique',
              'Suivi des paiements',
              'Taux de collection',
              'Factures en retard'
            ]}
            onClick={() => onNavigate('invoices')}
          />
          <FeatureCard
            title="Assistant IA"
            description="Génération de documents juridiques - 15+ types de documents"
            icon={MessageSquare}
            color="green"
            features={[
              'Requêtes et conclusions',
              'Contrats et actes',
              'Correspondances',
              'Bilingue FR/AR'
            ]}
            onClick={() => onNavigate('chat')}
          />
        </div>
      </div>
    </div>
  );
};

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: any;
  color: string;
  onClick: () => void;
}> = ({ title, description, icon: Icon, color, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-${color}-500/50 transition-all text-left group`}
    >
      <div className={`p-3 bg-${color}-500/10 rounded-lg w-fit mb-4 group-hover:bg-${color}-500/20 transition-colors`}>
        <Icon className={`w-6 h-6 text-${color}-400`} />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </button>
  );
};

const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon: any;
  color: string;
  features: string[];
  onClick: () => void;
}> = ({ title, description, icon: Icon, color, features, onClick }) => {
  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 bg-${color}-500/10 rounded-lg`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-slate-400 text-sm">{description}</p>
        </div>
      </div>
      <ul className="space-y-2 mb-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
            <div className={`w-1.5 h-1.5 rounded-full bg-${color}-400`} />
            {feature}
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        className={`w-full px-4 py-2 bg-${color}-600 text-white rounded-lg font-medium hover:bg-${color}-700 transition-colors`}
      >
        Accéder
      </button>
    </div>
  );
};
