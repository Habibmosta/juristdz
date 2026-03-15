import React, { useState, useEffect } from 'react';
import { Case, Language } from '../../types';
import { 
  Briefcase, Plus, Search, Filter, MoreVertical, ChevronRight, 
  Clock, User, Calendar, TrendingUp, AlertCircle, Grid, List,
  SortAsc, Tag, DollarSign
} from 'lucide-react';
import { CaseService } from '../../services/caseService';
import CaseDetailView from './CaseDetailView';
import { useRoleTerminology } from '../../hooks/useRoleTerminology';
import { LimitChecker } from '../trial/LimitChecker';
import { useAppToast } from '../../contexts/ToastContext';

interface EnhancedCaseManagementProps {
  language: Language;
  userId: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
}

const EnhancedCaseManagement: React.FC<EnhancedCaseManagementProps> = ({ language, userId }) => {
  const { t } = useRoleTerminology(language);
  const { toast } = useAppToast();
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    caseNumber: '', // Auto-généré
    caseObject: '', // Objet du dossier
    courtReference: '', // Référence tribunal (optionnelle)
    courtName: '', // Nom du tribunal
    judgeName: '', // Nom du juge
    opposingParty: '', // Partie adverse
    opposingLawyer: '', // Avocat adverse
    description: '',
    caseType: '',
    caseStage: 'initial_consultation' as 'initial_consultation' | 'investigation' | 'filing' | 'discovery' | 'trial' | 'appeal' | 'closed',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    estimatedValue: '',
    deadline: '', // Date limite - VISIBLE PAR DÉFAUT
    nextHearingDate: '',
    statuteOfLimitations: '',
    billingType: 'hourly' as 'hourly' | 'flat_fee' | 'contingency' | 'pro_bono',
    hourlyRate: '',
    flatFee: '',
    contingencyPercentage: '',
    retainerAmount: '',
    notes: '',
    // Nouveaux champs
    assignedLawyer: '', // Sera rempli automatiquement avec le nom de l'avocat connecté
    documentsToCollect: [] as string[], // Documents à collecter
    initialConsultationDate: '', // Date de consultation initiale
    clientObjective: '', // Objectif du client
    legalStrategy: '', // Stratégie juridique
    estimatedDuration: '', // Durée estimée (en mois)
    riskLevel: 'medium' as 'low' | 'medium' | 'high', // Niveau de risque
    successProbability: '', // Probabilité de succès (%)
  });
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [documentChecklist, setDocumentChecklist] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]); // Documents sélectionnés à collecter
  const [customDocument, setCustomDocument] = useState(''); // Pour ajouter des documents personnalisés
  const isAr = language === 'ar';

  useEffect(() => {
    loadCases();
    loadClients();
    loadLawyerInfo(); // Charger les infos de l'avocat connecté
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [cases, searchTerm, filterStatus, filterPriority]);

  const loadCases = async () => {
    setLoading(true);
    try {
      const loadedCases = await CaseService.getCases(userId);
      setCases(loadedCases);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, company_name')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadLawyerInfo = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      
      // Charger les informations depuis la table profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      if (data && !error) {
        const lawyerName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        // Pré-remplir l'avocat assigné avec le nom de l'avocat connecté
        setFormData(prev => ({
          ...prev,
          assignedLawyer: lawyerName || 'Avocat'
        }));
      } else {
        // Fallback: utiliser un nom par défaut
        console.warn('Could not load lawyer info, using default');
        setFormData(prev => ({
          ...prev,
          assignedLawyer: 'Avocat'
        }));
      }
    } catch (error) {
      console.error('Error loading lawyer info:', error);
      // Fallback: utiliser un nom par défaut
      setFormData(prev => ({
        ...prev,
        assignedLawyer: 'Avocat'
      }));
    }
  };

  const applyFilters = () => {
    let filtered = [...cases];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(c => c.priority === filterPriority);
    }

    setFilteredCases(filtered);
  };

  // Get document checklist based on case type
  const getDocumentChecklist = (caseType: string): string[] => {
    const checklists: Record<string, string[]> = {
      civil: [
        'Copie CIN client',
        'Acte de propriété',
        'Contrat litigieux',
        'Correspondances',
        'Preuves documentaires'
      ],
      penal: [
        'Copie CIN client',
        'Procès-verbal',
        'Citation à comparaître',
        'Certificat médical (si applicable)',
        'Témoignages'
      ],
      commercial: [
        'Registre de commerce',
        'Statuts société',
        'Contrats commerciaux',
        'Factures',
        'Correspondances commerciales'
      ],
      family: [
        'Copie CIN',
        'Acte de mariage',
        'Acte de naissance enfants',
        'Justificatifs revenus',
        'Certificat résidence'
      ],
      administrative: [
        'Copie CIN',
        'Décision administrative contestée',
        'Recours gracieux',
        'Justificatifs',
        'Correspondances'
      ],
      labor: [
        'Copie CIN',
        'Contrat de travail',
        'Bulletins de paie',
        'Certificat de travail',
        'Correspondances employeur'
      ]
    };
    return checklists[caseType] || [];
  };

  // Update checklist when case type changes
  useEffect(() => {
    if (formData.caseType) {
      const checklist = getDocumentChecklist(formData.caseType);
      setDocumentChecklist(checklist);
      // Pré-sélectionner tous les documents par défaut
      setSelectedDocuments(checklist);
    }
  }, [formData.caseType]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      toast(isAr ? 'يرجى اختيار عميل' : 'Veuillez sélectionner un client', 'warning');
      return;
    }
    
    try {
      const { supabase } = await import('../../lib/supabase');
      
      // Get client info
      const selectedClient = clients.find(c => c.id === formData.clientId);
      if (!selectedClient) {
        toast(isAr ? 'العميل غير موجود' : 'Client introuvable', 'error');
        return;
      }
      
      // Conflict check - check if opposing party is an existing client
      if (formData.opposingParty) {
        const { data: conflictClients } = await supabase
          .from('clients')
          .select('id, first_name, last_name')
          .eq('user_id', userId)
          .or(`first_name.ilike.%${formData.opposingParty}%,last_name.ilike.%${formData.opposingParty}%,company_name.ilike.%${formData.opposingParty}%`);
        
        if (conflictClients && conflictClients.length > 0) {
          const confirmConflict = confirm(
            isAr 
              ? `⚠️ تحذير: الطرف المقابل "${formData.opposingParty}" قد يكون عميلاً موجوداً. هل تريد المتابعة؟`
              : `⚠️ Attention: La partie adverse "${formData.opposingParty}" pourrait être un client existant. Continuer?`
          );
          if (!confirmConflict) return;
        }
      }
      
      // Generate case number if not provided
      let caseNumber = formData.caseNumber;
      if (!caseNumber) {
        // Get the count of cases for this user to generate next number
        const { count } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        
        const nextNumber = (count || 0) + 1;
        const year = new Date().getFullYear();
        caseNumber = `DZ-${year}-${String(nextNumber).padStart(4, '0')}`;
      }
      
      // Build title from case object and client name
      const title = `${formData.caseObject} - ${selectedClient.first_name} ${selectedClient.last_name}`;
      
      // Prepare required documents checklist avec les documents sélectionnés
      const requiredDocs = selectedDocuments.map(doc => ({
        name: doc,
        received: false,
        receivedDate: null,
        required: true
      }));
      
      // Préparer les données avec les noms de colonnes exacts de la base
      const insertData: any = {
        user_id: userId,
        case_number: caseNumber,
        title: title,
        case_object: formData.caseObject,
        description: formData.description,
        case_type: formData.caseType || 'civil',
        status: 'nouveau',
        priority: formData.priority || 'normale',
        opened_date: new Date().toISOString().split('T')[0],
        
        // Client info
        client_id: formData.clientId,
        client_phone: selectedClient.phone || null,
        client_email: selectedClient.email || null,
        client_address: null,
        
        // Court info
        court_reference: formData.courtReference || null,
        court_name: formData.courtName || null,
        judge_name: formData.judgeName || null,
        case_reference: formData.courtReference || null,
        
        // Parties
        adverse_party_name: formData.opposingParty || null,
        adverse_party_lawyer: formData.opposingLawyer || null,
        opposing_party: formData.opposingParty || null,
        opposing_lawyer: formData.opposingLawyer || null,
        
        // Dates
        deadline: formData.deadline || null,
        next_hearing_date: formData.nextHearingDate ? formData.nextHearingDate.split('T')[0] : null,
        statute_of_limitations: formData.statuteOfLimitations || null,
        
        // Workflow
        case_stage: formData.caseStage || 'initial_consultation',
        
        // Financial
        estimated_value: formData.estimatedValue ? parseFloat(formData.estimatedValue) : null,
        billing_type: formData.billingType || 'hourly',
        hourly_rate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        flat_fee: formData.flatFee ? parseFloat(formData.flatFee) : null,
        contingency_percentage: formData.contingencyPercentage ? parseFloat(formData.contingencyPercentage) : null,
        retainer_amount: formData.retainerAmount ? parseFloat(formData.retainerAmount) : null,
        
        // Conflict check
        conflict_checked: formData.opposingParty ? true : false,
        conflict_check_date: formData.opposingParty ? new Date().toISOString() : null,
        
        // Documents and notes
        required_documents: requiredDocs,
        notes: formData.notes || null,
        tags: null,
        
        // Nouveaux champs professionnels
        assigned_lawyer: formData.assignedLawyer || null,
        initial_consultation_date: formData.initialConsultationDate || null,
        client_objective: formData.clientObjective || null,
        legal_strategy: formData.legalStrategy || null,
        estimated_duration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null,
        risk_level: formData.riskLevel || 'medium',
        success_probability: formData.successProbability ? parseFloat(formData.successProbability) : null
      };
      
      const { data, error } = await supabase
        .from('cases')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error creating case:', error);
        throw error;
      }

      // Reset form and close modal
      setFormData({
        clientId: '',
        caseNumber: '',
        caseObject: '',
        courtReference: '',
        courtName: '',
        judgeName: '',
        opposingParty: '',
        opposingLawyer: '',
        description: '',
        caseType: '',
        caseStage: 'initial_consultation',
        priority: 'medium',
        estimatedValue: '',
        deadline: '',
        nextHearingDate: '',
        statuteOfLimitations: '',
        billingType: 'hourly',
        hourlyRate: '',
        flatFee: '',
        contingencyPercentage: '',
        retainerAmount: '',
        notes: ''
      });
      setClientSearchTerm('');
      setDocumentChecklist([]);
      setShowAdvancedFields(false);
      setShowCreateModal(false);
      
      // Reload cases then notify
      await loadCases();
      
      toast(isAr 
        ? `تم إنشاء الملف بنجاح! رقم الملف: ${caseNumber}`
        : `Dossier créé avec succès! Numéro: ${caseNumber}`, 'success');
    } catch (error) {
      console.error('Error creating case:', error);
      toast(isAr ? 'خطأ في إنشاء الملف' : 'Erreur lors de la création du dossier', 'error');
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      default: return '⚪';
    }
  };

  // If a case is selected, show detail view
  if (selectedCaseId) {
    return (
      <CaseDetailView
        caseId={selectedCaseId}
        language={language}
        userId={userId}
        onBack={() => setSelectedCaseId(null)}
      />
    );
  }

  // Statistics
  const stats = {
    total: cases.length,
    active: cases.filter(c => c.status === 'active' || c.status === 'nouveau').length,
    urgent: cases.filter(c => c.priority === 'urgent' || c.priority === 'urgente').length,
    thisMonth: cases.filter(c => {
      const dateField = c.created_at || c.createdAt || c.opened_date;
      if (!dateField) return false;
      const caseDate = new Date(dateField);
      const now = new Date();
      return caseDate.getMonth() === now.getMonth() && caseDate.getFullYear() === now.getFullYear();
    }).length
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 md:p-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-slate-100">
              {isAr ? t.case(true) : t.case(true)}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAr 
                ? `إدارة شاملة ${t.case(true).toLowerCase()}` 
                : `Gestion complète de vos ${t.case(true).toLowerCase()}`}
            </p>
          </div>
          <LimitChecker resourceType="case" language={language}>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-legal-gold text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-legal-gold/20 hover:bg-legal-gold/90 active:scale-95 transition-all"
            >
              <Plus size={20} />
              {t.createCase()}
            </button>
          </LimitChecker>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{isAr ? 'المجموع' : 'Total'}</span>
              <Briefcase size={20} className="text-legal-gold" />
            </div>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{isAr ? 'نشط' : 'Actifs'}</span>
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{isAr ? 'عاجل' : 'Urgents'}</span>
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.urgent}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{isAr ? 'هذا الشهر' : 'Ce mois'}</span>
              <Calendar size={20} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.thisMonth}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder={isAr 
                  ? `البحث عن ${t.case(false)} أو ${t.client(false)}...` 
                  : `Rechercher un ${t.case(false).toLowerCase()} ou ${t.client(false).toLowerCase()}...`} 
                className="bg-transparent border-none outline-none w-full text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl border transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-legal-gold text-white border-legal-gold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl border transition-colors ${
                  viewMode === 'list'
                    ? 'bg-legal-gold text-white border-legal-gold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <List size={18} />
              </button>
            </div>

            {/* Filters Button */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 text-slate-500 hover:text-legal-gold transition-colors"
            >
              <Filter size={18} />
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t dark:border-slate-800 flex flex-wrap gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-2 block">{isAr ? 'الحالة' : 'Statut'}</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 text-sm"
                >
                  <option value="all">{isAr ? 'الكل' : 'Tous'}</option>
                  <option value="active">{isAr ? 'نشط' : 'Actifs'}</option>
                  <option value="archived">{isAr ? 'مؤرشف' : 'Archivés'}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-2 block">{isAr ? 'الأولوية' : 'Priorité'}</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700 text-sm"
                >
                  <option value="all">{isAr ? 'الكل' : 'Toutes'}</option>
                  <option value="urgent">{isAr ? 'عاجل' : 'Urgent'}</option>
                  <option value="high">{isAr ? 'عالي' : 'Élevée'}</option>
                  <option value="medium">{isAr ? 'متوسط' : 'Moyenne'}</option>
                  <option value="low">{isAr ? 'منخفض' : 'Basse'}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Cases Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-gold"></div>
          </div>
        ) : filteredCases.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredCases.map(c => (
              <div 
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className={`group bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 transition-all cursor-pointer hover:shadow-xl hover:scale-[1.02] ${
                  viewMode === 'list' ? 'p-4' : 'p-6'
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:bg-legal-gold/10 group-hover:text-legal-gold transition-colors">
                        <Briefcase size={24} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getPriorityIcon(c.priority)}</span>
                        <button className="p-1 text-slate-300 hover:text-slate-600 dark:hover:text-slate-100">
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-1 dark:text-white line-clamp-1">{c.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                      <User size={12} className="text-legal-gold" />
                      {c.clientName}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-6 h-8 italic">
                      {c.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t dark:border-slate-800">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <Clock size={12} />
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : 
                         c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 
                         new Date().toLocaleDateString()}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        c.status === 'active' || c.status === 'nouveau' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.status.toUpperCase()}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <Briefcase size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{c.title}</h3>
                      <p className="text-sm text-slate-500">{c.clientName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getPriorityIcon(c.priority)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.status.toUpperCase()}
                      </span>
                      <ChevronRight size={20} className="text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="col-span-full py-20 text-center text-slate-400">
            <Briefcase size={60} className="mx-auto mb-4 opacity-20" />
            <p>{isAr ? `لا توجد ${t.case(true)}` : `Aucun ${t.case(false).toLowerCase()} trouvé`}</p>
          </div>
        )}
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{t.createCase()}</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  ✕
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateCase} className="p-6 space-y-4">
              {/* Client Selection with Search */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'العميل' : 'Client'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required={!formData.clientId}
                    value={clientSearchTerm}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder={isAr ? 'ابحث عن عميل...' : 'Rechercher un client...'}
                    className="w-full px-4 py-3 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  />
                  <User className="absolute right-3 top-3.5 text-slate-400" size={18} />
                </div>
                
                {/* Client Dropdown */}
                {showClientDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {clients
                      .filter(c => {
                        const searchLower = clientSearchTerm.toLowerCase();
                        return (
                          c.first_name.toLowerCase().includes(searchLower) ||
                          c.last_name.toLowerCase().includes(searchLower) ||
                          c.email?.toLowerCase().includes(searchLower) ||
                          c.phone?.includes(searchLower) ||
                          c.company_name?.toLowerCase().includes(searchLower)
                        );
                      })
                      .map(client => (
                        <div
                          key={client.id}
                          onClick={() => {
                            setFormData({...formData, clientId: client.id});
                            setClientSearchTerm(`${client.first_name} ${client.last_name}`);
                            setShowClientDropdown(false);
                          }}
                          className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b dark:border-slate-700 last:border-b-0 ${
                            formData.clientId === client.id ? 'bg-legal-gold/10' : ''
                          }`}
                        >
                          <div className="font-medium">{client.first_name} {client.last_name}</div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                            {client.email && <span>📧 {client.email}</span>}
                            {client.phone && <span>📱 {client.phone}</span>}
                          </div>
                          {client.company_name && (
                            <div className="text-xs text-slate-400 mt-1">🏢 {client.company_name}</div>
                          )}
                        </div>
                      ))}
                    {clients.filter(c => {
                      const searchLower = clientSearchTerm.toLowerCase();
                      return (
                        c.first_name.toLowerCase().includes(searchLower) ||
                        c.last_name.toLowerCase().includes(searchLower) ||
                        c.email?.toLowerCase().includes(searchLower) ||
                        c.phone?.includes(searchLower)
                      );
                    }).length === 0 && (
                      <div className="p-4 text-center text-slate-400">
                        {isAr ? 'لا يوجد عملاء' : 'Aucun client trouvé'}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Selected Client Display */}
                {formData.clientId && !showClientDropdown && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm font-medium">{clientSearchTerm}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({...formData, clientId: ''});
                        setClientSearchTerm('');
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      {isAr ? 'إزالة' : 'Retirer'}
                    </button>
                  </div>
                )}
              </div>

              {/* Case Number - Auto-generated */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {isAr ? 'رقم الملف' : 'Numéro de dossier'}
                    </label>
                    <p className="text-xs text-slate-500">
                      {isAr ? 'يتم إنشاؤه تلقائيًا' : 'Généré automatiquement'}
                    </p>
                  </div>
                  <div className="text-lg font-mono font-bold text-legal-gold">
                    {formData.caseNumber || `DZ-${new Date().getFullYear()}-####`}
                  </div>
                </div>
              </div>

              {/* Case Object */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'موضوع الملف' : 'Objet du dossier'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.caseObject}
                  onChange={(e) => setFormData({...formData, caseObject: e.target.value})}
                  placeholder={isAr ? 'مثال: دعوى طلاق' : 'Ex: Divorce contentieux'}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? 'وصف قصير للموضوع القانوني' : 'Description courte du sujet juridique'}
                </p>
              </div>

              {/* Court Reference */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'رقم القيد بالمحكمة' : 'Référence tribunal'}
                  <span className="text-slate-400 text-xs ml-2">{isAr ? '(اختياري)' : '(optionnel)'}</span>
                </label>
                <input
                  type="text"
                  value={formData.courtReference}
                  onChange={(e) => setFormData({...formData, courtReference: e.target.value})}
                  placeholder={isAr ? 'مثال: RG 24/00123' : 'Ex: RG 24/00123'}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? 'رقم التسجيل في المحكمة إن وجد' : 'Numéro d\'enregistrement au tribunal si disponible'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'الوصف' : 'Description'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={isAr ? 'وصف موجز للملف...' : 'Description brève du dossier...'}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAr ? 'نوع الملف' : 'Type de dossier'}
                  </label>
                  <select
                    value={formData.caseType}
                    onChange={(e) => setFormData({...formData, caseType: e.target.value})}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  >
                    <option value="">{isAr ? 'اختر النوع' : 'Sélectionner'}</option>
                    <option value="civil">{isAr ? 'مدني' : 'Civil'}</option>
                    <option value="penal">{isAr ? 'جزائي' : 'Pénal'}</option>
                    <option value="commercial">{isAr ? 'تجاري' : 'Commercial'}</option>
                    <option value="family">{isAr ? 'أسرة' : 'Famille'}</option>
                    <option value="administrative">{isAr ? 'إداري' : 'Administratif'}</option>
                    <option value="labor">{isAr ? 'عمل' : 'Travail'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isAr ? 'الأولوية' : 'Priorité'}
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                    className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                  >
                    <option value="low">{isAr ? 'منخفضة' : 'Basse'}</option>
                    <option value="medium">{isAr ? 'متوسطة' : 'Moyenne'}</option>
                    <option value="high">{isAr ? 'عالية' : 'Haute'}</option>
                    <option value="urgent">{isAr ? 'عاجلة' : 'Urgente'}</option>
                  </select>
                </div>
              </div>

              {/* Date Limite - VISIBLE PAR DÉFAUT */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'الموعد النهائي' : 'Date limite'} <span className="text-orange-500">⚠️</span>
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? 'تاريخ مهم لإدارة الملف' : 'Date importante pour la gestion du dossier'}
                </p>
              </div>

              {/* Avocat Assigné - PRÉ-REMPLI */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'المحامي المكلف' : 'Avocat assigné'} <span className="text-green-500">✓</span>
                </label>
                <input
                  type="text"
                  value={formData.assignedLawyer}
                  onChange={(e) => setFormData({...formData, assignedLawyer: e.target.value})}
                  placeholder={isAr ? 'اسم المحامي' : 'Nom de l\'avocat'}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? 'تم التعبئة تلقائياً من ملفك الشخصي' : 'Pré-rempli automatiquement depuis votre profil'}
                </p>
              </div>

              {/* SECTION CONSULTATION INITIALE */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">💼</span>
                  <h3 className="font-bold text-sm text-purple-700 dark:text-purple-300">
                    {isAr ? 'الاستشارة الأولية' : 'Consultation Initiale'}
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    {isAr ? 'تاريخ الاستشارة' : 'Date de consultation'}
                  </label>
                  <input
                    type="date"
                    value={formData.initialConsultationDate}
                    onChange={(e) => setFormData({...formData, initialConsultationDate: e.target.value})}
                    className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    {isAr ? 'هدف العميل' : 'Objectif du client'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.clientObjective}
                    onChange={(e) => setFormData({...formData, clientObjective: e.target.value})}
                    placeholder={isAr ? 'ما الذي يريد العميل تحقيقه؟' : 'Que souhaite obtenir le client?'}
                    className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    {isAr ? 'الاستراتيجية القانونية' : 'Stratégie juridique envisagée'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.legalStrategy}
                    onChange={(e) => setFormData({...formData, legalStrategy: e.target.value})}
                    placeholder={isAr ? 'الخطة القانونية المقترحة...' : 'Approche juridique proposée...'}
                    className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* SECTION ÉVALUATION DU DOSSIER */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📊</span>
                  <h3 className="font-bold text-sm text-orange-700 dark:text-orange-300">
                    {isAr ? 'تقييم الملف' : 'Évaluation du Dossier'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      {isAr ? 'مستوى المخاطر' : 'Niveau de risque'}
                    </label>
                    <select
                      value={formData.riskLevel}
                      onChange={(e) => setFormData({...formData, riskLevel: e.target.value as any})}
                      className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="low">🟢 {isAr ? 'منخفض' : 'Faible'}</option>
                      <option value="medium">🟡 {isAr ? 'متوسط' : 'Moyen'}</option>
                      <option value="high">🔴 {isAr ? 'عالي' : 'Élevé'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">
                      {isAr ? 'احتمالية النجاح (%)' : 'Probabilité de succès (%)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.successProbability}
                      onChange={(e) => setFormData({...formData, successProbability: e.target.value})}
                      placeholder="75"
                      className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    {isAr ? 'المدة المقدرة (بالأشهر)' : 'Durée estimée (en mois)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({...formData, estimatedDuration: e.target.value})}
                    placeholder="12"
                    className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {isAr ? 'المدة المتوقعة لإنهاء الملف' : 'Durée prévue pour clôturer le dossier'}
                  </p>
                </div>

                {/* Jauge visuelle de probabilité */}
                {formData.successProbability && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">
                        {isAr ? 'احتمالية النجاح' : 'Probabilité de succès'}
                      </span>
                      <span className="font-bold text-orange-600">{formData.successProbability}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          parseInt(formData.successProbability) >= 70 ? 'bg-green-500' :
                          parseInt(formData.successProbability) >= 40 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${formData.successProbability}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION DOCUMENTS À COLLECTER - INTERACTIVE */}
              {documentChecklist.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📋</span>
                    <h3 className="font-bold text-sm text-blue-700 dark:text-blue-300">
                      {isAr ? 'الوثائق المطلوبة' : 'Documents à Collecter'}
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    {documentChecklist.map((doc, idx) => (
                      <label 
                        key={idx} 
                        className="flex items-center gap-3 p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(doc)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocuments([...selectedDocuments, doc]);
                            } else {
                              setSelectedDocuments(selectedDocuments.filter(d => d !== doc));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{doc}</span>
                      </label>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                      {isAr 
                        ? `${selectedDocuments.length} من ${documentChecklist.length} وثيقة محددة`
                        : `${selectedDocuments.length} sur ${documentChecklist.length} documents sélectionnés`}
                    </p>
                    
                    {/* Ajouter un document personnalisé */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customDocument}
                        onChange={(e) => setCustomDocument(e.target.value)}
                        placeholder={isAr ? 'إضافة وثيقة أخرى...' : 'Ajouter un autre document...'}
                        className="flex-1 px-3 py-2 text-xs border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && customDocument.trim()) {
                            e.preventDefault();
                            setDocumentChecklist([...documentChecklist, customDocument.trim()]);
                            setSelectedDocuments([...selectedDocuments, customDocument.trim()]);
                            setCustomDocument('');
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customDocument.trim()) {
                            setDocumentChecklist([...documentChecklist, customDocument.trim()]);
                            setSelectedDocuments([...selectedDocuments, customDocument.trim()]);
                            setCustomDocument('');
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        {isAr ? 'إضافة' : 'Ajouter'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Fields Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium text-sm flex items-center justify-between transition-colors"
              >
                <span>{isAr ? 'خيارات متقدمة' : 'Options avancées'}</span>
                <span className="text-lg">{showAdvancedFields ? '▼' : '▶'}</span>
              </button>

              {/* Advanced Fields */}
              {showAdvancedFields && (
                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700">
                  <h3 className="font-bold text-sm text-legal-gold">
                    {isAr ? '⚖️ معلومات المحكمة والأطراف' : '⚖️ Tribunal et Parties'}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {isAr ? 'اسم المحكمة' : 'Nom du tribunal'}
                      </label>
                      <input
                        type="text"
                        value={formData.courtName}
                        onChange={(e) => setFormData({...formData, courtName: e.target.value})}
                        placeholder={isAr ? 'محكمة الجزائر' : 'Tribunal d\'Alger'}
                        className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {isAr ? 'اسم القاضي' : 'Nom du juge'}
                      </label>
                      <input
                        type="text"
                        value={formData.judgeName}
                        onChange={(e) => setFormData({...formData, judgeName: e.target.value})}
                        placeholder={isAr ? 'القاضي...' : 'Juge...'}
                        className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {isAr ? 'الطرف المقابل' : 'Partie adverse'}
                      </label>
                      <input
                        type="text"
                        value={formData.opposingParty}
                        onChange={(e) => setFormData({...formData, opposingParty: e.target.value})}
                        placeholder={isAr ? 'اسم الطرف المقابل' : 'Nom de la partie adverse'}
                        className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {isAr ? 'محامي الطرف المقابل' : 'Avocat adverse'}
                      </label>
                      <input
                        type="text"
                        value={formData.opposingLawyer}
                        onChange={(e) => setFormData({...formData, opposingLawyer: e.target.value})}
                        placeholder={isAr ? 'اسم المحامي' : 'Nom de l\'avocat'}
                        className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                      />
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-legal-gold mt-6">
                    {isAr ? '📅 التواريخ والمواعيد' : '📅 Dates et Échéances'}
                  </h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {isAr ? 'الموعد النهائي' : 'Date limite'}
                      </label>
                      <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                        className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {isAr ? 'الجلسة القادمة' : 'Prochaine audience'}
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.nextHearingDate}
                        onChange={(e) => setFormData({...formData, nextHearingDate: e.target.value})}
                        className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {isAr ? 'التقادم' : 'Prescription'}
                      </label>
                      <input
                        type="date"
                        value={formData.statuteOfLimitations}
                        onChange={(e) => setFormData({...formData, statuteOfLimitations: e.target.value})}
                        className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                      />
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-legal-gold mt-6">
                    {isAr ? '💰 الفوترة والأتعاب' : '💰 Facturation et Honoraires'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {isAr ? 'نوع الفوترة' : 'Type de facturation'}
                      </label>
                      <select
                        value={formData.billingType}
                        onChange={(e) => setFormData({...formData, billingType: e.target.value as any})}
                        className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                      >
                        <option value="hourly">{isAr ? 'بالساعة' : 'Horaire'}</option>
                        <option value="flat_fee">{isAr ? 'مبلغ ثابت' : 'Forfaitaire'}</option>
                        <option value="contingency">{isAr ? 'نسبة من النتيجة' : 'Au succès'}</option>
                        <option value="pro_bono">{isAr ? 'مجاني' : 'Pro bono'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {isAr ? 'القيمة المقدرة (DA)' : 'Valeur estimée (DA)'}
                      </label>
                      <input
                        type="number"
                        value={formData.estimatedValue}
                        onChange={(e) => setFormData({...formData, estimatedValue: e.target.value})}
                        placeholder="500000"
                        className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                      />
                    </div>
                  </div>

                  {formData.billingType === 'hourly' && (
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {isAr ? 'السعر بالساعة (DA)' : 'Taux horaire (DA)'}
                      </label>
                      <input
                        type="number"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                        placeholder="15000"
                        className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                      />
                    </div>
                  )}

                  {formData.billingType === 'flat_fee' && (
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {isAr ? 'المبلغ الثابت (DA)' : 'Montant forfaitaire (DA)'}
                      </label>
                      <input
                        type="number"
                        value={formData.flatFee}
                        onChange={(e) => setFormData({...formData, flatFee: e.target.value})}
                        placeholder="100000"
                        className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                      />
                    </div>
                  )}

                  {formData.billingType === 'contingency' && (
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {isAr ? 'النسبة المئوية (%)' : 'Pourcentage (%)'}
                      </label>
                      <input
                        type="number"
                        value={formData.contingencyPercentage}
                        onChange={(e) => setFormData({...formData, contingencyPercentage: e.target.value})}
                        placeholder="30"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-1">
                      {isAr ? 'الأتعاب المسبقة (DA)' : 'Provision (DA)'}
                    </label>
                    <input
                      type="number"
                      value={formData.retainerAmount}
                      onChange={(e) => setFormData({...formData, retainerAmount: e.target.value})}
                      placeholder="50000"
                      className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                    />
                  </div>

                  <h3 className="font-bold text-sm text-legal-gold mt-6">
                    {isAr ? '📝 معلومات إضافية' : '📝 Informations complémentaires'}
                  </h3>

                  <div>
                    <label className="block text-xs font-medium mb-1">
                      {isAr ? 'مرحلة الملف' : 'Étape du dossier'}
                    </label>
                    <select
                      value={formData.caseStage}
                      onChange={(e) => setFormData({...formData, caseStage: e.target.value as any})}
                      className="w-full px-3 py-2 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
                    >
                      <option value="initial_consultation">{isAr ? 'استشارة أولية' : 'Consultation initiale'}</option>
                      <option value="investigation">{isAr ? 'تحقيق' : 'Investigation'}</option>
                      <option value="filing">{isAr ? 'إيداع' : 'Dépôt'}</option>
                      <option value="discovery">{isAr ? 'تحضير' : 'Instruction'}</option>
                      <option value="trial">{isAr ? 'محاكمة' : 'Procès'}</option>
                      <option value="appeal">{isAr ? 'استئناف' : 'Appel'}</option>
                      <option value="closed">{isAr ? 'مغلق' : 'Clôturé'}</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'ملاحظات' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setClientSearchTerm('');
                    setDocumentChecklist([]);
                    setShowAdvancedFields(false);
                    setFormData({
                      clientId: '',
                      caseNumber: '',
                      caseObject: '',
                      courtReference: '',
                      courtName: '',
                      judgeName: '',
                      opposingParty: '',
                      opposingLawyer: '',
                      description: '',
                      caseType: '',
                      caseStage: 'initial_consultation',
                      priority: 'medium',
                      estimatedValue: '',
                      deadline: '',
                      nextHearingDate: '',
                      statuteOfLimitations: '',
                      billingType: 'hourly',
                      hourlyRate: '',
                      flatFee: '',
                      contingencyPercentage: '',
                      retainerAmount: '',
                      notes: ''
                    });
                  }}
                  className="flex-1 px-6 py-3 border dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-legal-gold text-white rounded-xl font-bold hover:bg-legal-gold/90 transition-colors"
                >
                  {isAr ? 'إنشاء' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCaseManagement;
