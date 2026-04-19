import React, { useState, useEffect } from 'react';
import { Language } from '@/types';
import type { Case } from '../../types/case.types';
import { 
  ArrowLeft, Calendar, Clock, User, Phone, Mail, MapPin, 
  FileText, DollarSign, AlertCircle, CheckCircle, Edit2, 
  Trash2, Plus, Upload, Download, Eye, MessageSquare,
  Tag, TrendingUp, Activity
} from 'lucide-react';
import { CaseService } from '../../services/caseService';
import { documentService } from '../../services/documentService';
import { ClientService } from '../../services/clientService';
import CaseTimeline from './CaseTimeline';
import { useRoleTerminology } from '../../hooks/useRoleTerminology';
import { useAppToast } from '../../contexts/ToastContext';

interface CaseDetailViewProps {
  caseId: string;
  language: Language;
  onBack: () => void;
  userId: string;
}

const CaseDetailView: React.FC<CaseDetailViewProps> = ({ caseId, language, onBack, userId }) => {
  const { t } = useRoleTerminology(language);
  const { toast } = useAppToast();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'timeline' | 'billing'>('overview');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const isAr = language === 'ar';

  useEffect(() => {
    loadCaseData();
    loadDocuments();
    loadUpcomingEvents();
  }, [caseId]);

  const loadCaseData = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      
      // 1. Charger le dossier
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .eq('user_id', userId)
        .single();

      if (caseError) {
        console.error('Error loading case:', caseError);
        return;
      }

      if (!caseData) {
        return;
      }

      // 2. Si le dossier a un client_id, charger les infos du client
      let clientData = null;
      if (caseData.client_id) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id, first_name, last_name, company_name, email, phone, mobile, address, city, wilaya, postal_code')
          .eq('id', caseData.client_id)
          .single();

        if (!clientError && client) {
          clientData = client;
        }
      }

      // 3. Fusionner les données
      const caseWithDates: Case = {
        ...caseData,
        createdAt: caseData.created_at ? new Date(caseData.created_at) : new Date(),
        deadline: caseData.deadline ? new Date(caseData.deadline) : undefined,
        // Utiliser les données du client si disponibles, sinon les colonnes directes
        clientName: clientData 
          ? (clientData.company_name || `${clientData.first_name} ${clientData.last_name}`.trim())
          : caseData.client_name,
        clientEmail: clientData?.email || caseData.client_email,
        clientPhone: clientData?.phone || clientData?.mobile || caseData.client_phone,
        clientAddress: clientData?.address 
          ? `${clientData.address}${clientData.city ? ', ' + clientData.city : ''}${clientData.wilaya ? ', ' + clientData.wilaya : ''}${clientData.postal_code ? ' ' + clientData.postal_code : ''}`
          : caseData.client_address,
      };
      
      setCaseData(caseWithDates);
    } catch (error) {
      console.error('Error loading case:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      
      
      const { data, error } = await supabase
        .from('case_documents')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading documents:', error);
      } else {
        setDocuments(data || []);
      }
    } catch (error) {
      console.error('❌ Error loading documents:', error);
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('case_events')
        .select('*')
        .eq('case_id', caseId)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(5);

      if (!error && data) {
        setUpcomingEvents(data);
      }
    } catch (error) {
      console.error('Error loading upcoming events:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      
      for (const file of Array.from(files)) {
        
        // 1. Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${userId}/${caseId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('case-documents')
          .upload(fileName, file);

        if (uploadError) {
          console.error('❌ Error uploading file:', uploadError);
          toast(`Erreur upload: ${uploadError.message}`, 'error');
          continue;
        }


        // 2. Get public URL
        const { data: urlData } = supabase.storage
          .from('case-documents')
          .getPublicUrl(fileName);


        // 3. Détecter le type de document basé sur l'extension et le nom
        const detectDocumentType = (filename: string, ext: string | undefined): string => {
          const lowerName = filename.toLowerCase();
          
          // Contrats
          if (lowerName.includes('contrat') || lowerName.includes('contract') || 
              lowerName.includes('accord') || lowerName.includes('convention')) {
            return 'contract';
          }
          
          // Documents judiciaires
          if (lowerName.includes('jugement') || lowerName.includes('ordonnance') || 
              lowerName.includes('arrêt') || lowerName.includes('décision') ||
              lowerName.includes('assignation') || lowerName.includes('citation')) {
            return 'court_document';
          }
          
          // Correspondance
          if (lowerName.includes('lettre') || lowerName.includes('courrier') || 
              lowerName.includes('email') || lowerName.includes('mail') ||
              lowerName.includes('correspondance')) {
            return 'correspondence';
          }
          
          // Preuves
          if (lowerName.includes('preuve') || lowerName.includes('evidence') || 
              lowerName.includes('photo') || lowerName.includes('capture') ||
              ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
            return 'evidence';
          }
          
          // Factures
          if (lowerName.includes('facture') || lowerName.includes('invoice') || 
              lowerName.includes('reçu') || lowerName.includes('receipt')) {
            return 'invoice';
          }
          
          // Procédures
          if (lowerName.includes('procédure') || lowerName.includes('procedure') || 
              lowerName.includes('requête') || lowerName.includes('demande')) {
            return 'procedure';
          }
          
          // Identité
          if (lowerName.includes('cin') || lowerName.includes('passeport') || 
              lowerName.includes('carte') || lowerName.includes('identité')) {
            return 'identity';
          }
          
          return 'other';
        };

        const documentType = detectDocumentType(file.name, fileExt);

        // 4. Save document metadata to database
        const docData = {
          case_id: caseId,
          user_id: userId,
          created_by: userId,
          file_name: file.name,
          storage_path: fileName,
          file_size: file.size,
          file_type: file.type,
          title: file.name,
          document_type: documentType,
          status: 'active',
          version: 1,
          is_confidential: false,
          created_at: new Date().toISOString()
        };
        

        const { data: insertData, error: dbError } = await supabase
          .from('case_documents')
          .insert(docData)
          .select();

        if (dbError) {
          console.error('❌ Error saving document metadata:', dbError);
          toast(`Erreur DB: ${dbError.message}`, 'error');
          continue;
        }
        
      }

      // Reload documents
      await loadDocuments();
      toast(isAr ? `تم رفع ${t.document(true)} بنجاح` : `${t.document(true)} téléchargés avec succès`, 'success');
    } catch (error) {
      console.error('❌ Error uploading documents:', error);
      toast(isAr ? `خطأ في رفع ${t.document(true)}` : `Erreur lors du téléchargement`, 'error');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { data, error } = await supabase.storage
        .from('case-documents')
        .download(doc.storage_path);

      if (error) {
        console.error('Error downloading file:', error);
        return;
      }

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleDeleteDocument = async (doc: any) => {
    if (!confirm(isAr ? `هل تريد حذف هذا ${t.document(false)}؟` : `Voulez-vous supprimer ce ${t.document(false).toLowerCase()} ?`)) {
      return;
    }

    try {
      const { supabase } = await import('../../lib/supabase');
      
      // 1. Delete from storage
      const { error: storageError } = await supabase.storage
        .from('case-documents')
        .remove([doc.storage_path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }

      // 2. Delete from database
      const { error: dbError } = await supabase
        .from('case_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) {
        console.error('Error deleting from database:', dbError);
        return;
      }

      // Reload documents
      await loadDocuments();
      toast(isAr ? `تم حذف ${t.document(false)}` : `${t.document(false)} supprimé`, 'success');
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      toast(isAr ? 'الرجاء إدخال ملاحظة' : 'Veuillez entrer une note', 'warning');
      return;
    }

    try {
      const { supabase } = await import('../../lib/supabase');
      
      const currentNotes = caseData?.notes || '';
      const newNotes = currentNotes 
        ? `${currentNotes}\n\n--- ${new Date().toLocaleString('fr-FR')} ---\n${noteText}`
        : `--- ${new Date().toLocaleString('fr-FR')} ---\n${noteText}`;

      const { error } = await supabase
        .from('cases')
        .update({ 
          notes: newNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error adding note:', error);
        toast(isAr ? 'خطأ في إضافة الملاحظة' : 'Erreur lors de l\'ajout de la note', 'error');
        return;
      }

      await loadCaseData();
      setShowNoteModal(false);
      setNoteText('');
      toast(isAr ? 'تمت إضافة الملاحظة' : 'Note ajoutée avec succès', 'success');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const openEditModal = () => {
    if (!caseData) return;
    
    setEditFormData({
      title: caseData.title,
      description: caseData.description || '',
      caseType: caseData.caseType || caseData.case_type || '',
      priority: caseData.priority || 'medium',
      estimatedValue: caseData.estimatedValue || caseData.estimated_value || '',
      deadline: caseData.deadline ? new Date(caseData.deadline).toISOString().split('T')[0] : '',
      clientName: caseData.clientName || caseData.client_name || '',
      clientPhone: caseData.clientPhone || caseData.client_phone || '',
      clientEmail: caseData.clientEmail || caseData.client_email || '',
      clientAddress: caseData.clientAddress || caseData.client_address || '',
      assignedLawyer: caseData.assignedLawyer || caseData.assigned_lawyer || '',
      notes: caseData.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateCase = async () => {
    if (!caseData) return;
    
    setSaving(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      
      const updateData = {
        title: editFormData.title,
        description: editFormData.description,
        case_type: editFormData.caseType,
        priority: editFormData.priority,
        estimated_value: editFormData.estimatedValue ? parseFloat(editFormData.estimatedValue) : null,
        deadline: editFormData.deadline || null,
        client_name: editFormData.clientName,
        client_phone: editFormData.clientPhone,
        client_email: editFormData.clientEmail,
        client_address: editFormData.clientAddress,
        assigned_lawyer: editFormData.assignedLawyer,
        notes: editFormData.notes,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('cases')
        .update(updateData)
        .eq('id', caseId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating case:', error);
        toast(isAr ? 'خطأ في تحديث الملف' : 'Erreur lors de la mise à jour', 'error');
        return;
      }

      await loadCaseData();
      setShowEditModal(false);
      toast(isAr ? 'تم تحديث الملف بنجاح' : 'Dossier mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Error updating case:', error);
      toast(isAr ? `خطأ في تحديث ${t.case(false)}` : `Erreur lors de la mise à jour du ${t.case(false).toLowerCase()}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-gold"></div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle size={48} className="text-slate-400 mb-4" />
        <p className="text-slate-500">{isAr ? `${t.case(false)} غير موجود` : `${t.case(false)} introuvable`}</p>
        <button onClick={onBack} className="mt-4 px-6 py-2 bg-legal-gold text-white rounded-xl">
          {isAr ? 'رجوع' : 'Retour'}
        </button>
      </div>
    );
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{caseData.title}</h1>
              <p className="text-sm text-slate-500">{isAr ? `رقم ${t.case(false)}:` : `N° ${t.case(false)}:`} {caseData.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-xl text-sm font-bold border ${getPriorityColor(caseData.priority)}`}>
              {caseData.priority?.toUpperCase() || 'NORMAL'}
            </span>
            <button 
              onClick={openEditModal}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              <Edit2 size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6">
          {[
            { id: 'overview', label: isAr ? 'نظرة عامة' : 'Vue d\'ensemble', icon: Activity },
            { id: 'documents', label: t.document(true), icon: FileText },
            { id: 'timeline', label: t.event(true), icon: Clock },
            { id: 'billing', label: isAr ? 'الفواتير' : 'Facturation', icon: DollarSign }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-legal-gold text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <User size={20} className="text-legal-gold" />
                  {isAr ? `معلومات ${t.client(false)}` : `Informations ${t.client(false)}`}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'الاسم' : 'Nom'}</p>
                    <p className="font-medium">{caseData.clientName || caseData.client_name || <span className="text-slate-400 italic">Non renseigné</span>}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'الهاتف' : 'Téléphone'}</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone size={14} className="text-legal-gold" />
                      {caseData.clientPhone || caseData.client_phone || <span className="text-slate-400 italic">Non renseigné</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</p>
                    <p className="font-medium flex items-center gap-2">
                      <Mail size={14} className="text-legal-gold" />
                      {caseData.clientEmail || caseData.client_email || <span className="text-slate-400 italic">Non renseigné</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'العنوان' : 'Adresse'}</p>
                    <p className="font-medium flex items-center gap-2">
                      <MapPin size={14} className="text-legal-gold" />
                      {caseData.clientAddress || caseData.client_address || <span className="text-slate-400 italic">Non renseigné</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Case Details */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-legal-gold" />
                  {isAr ? `تفاصيل ${t.case(false)}` : `Détails du ${t.case(false)}`}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Type de Dossier */}
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? `نوع ${t.case(false)}` : `Type de ${t.case(false).toLowerCase()}`}</p>
                    <p className="font-medium capitalize">
                      {caseData.caseType || caseData.case_type || <span className="text-slate-400 italic">Non renseigné</span>}
                    </p>
                  </div>
                  
                  {/* Avocat Assigné */}
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'المحامي المكلف' : 'Avocat assigné'}</p>
                    <p className="font-medium flex items-center gap-2">
                      <User size={14} className="text-legal-gold" />
                      {caseData.assignedLawyer || caseData.assigned_lawyer || <span className="text-slate-400 italic">Non assigné</span>}
                    </p>
                  </div>
                  
                  {/* Numéro de Dossier */}
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? `رقم ${t.case(false)}` : `Numéro de ${t.case(false).toLowerCase()}`}</p>
                    <p className="font-medium font-mono text-legal-gold">
                      {caseData.case_number || <span className="text-slate-400 italic">Non généré</span>}
                    </p>
                  </div>
                  
                  {/* Objet du Dossier */}
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? `موضوع ${t.case(false)}` : `Objet du ${t.case(false).toLowerCase()}`}</p>
                    <p className="font-medium">
                      {caseData.case_object || <span className="text-slate-400 italic">Non renseigné</span>}
                    </p>
                  </div>
                  
                  {/* Statut */}
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'الحالة' : 'Statut'}</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                      caseData.status === 'active' || caseData.status === 'nouveau' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {caseData.status?.toUpperCase() || 'NOUVEAU'}
                    </span>
                  </div>
                  
                  {/* Priorité */}
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'الأولوية' : 'Priorité'}</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(caseData.priority)}`}>
                      {caseData.priority?.toUpperCase() || 'NORMALE'}
                    </span>
                  </div>
                  
                  {/* Description */}
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'الوصف' : 'Description'}</p>
                    <p className="text-slate-700 dark:text-slate-300">{caseData.description || <span className="text-slate-400 italic">Aucune description</span>}</p>
                  </div>
                </div>
              </div>

              {/* Tribunal et Parties */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-legal-gold" />
                  {isAr ? 'المحكمة والأطراف' : 'Tribunal et Parties'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'المحكمة' : 'Tribunal'}</p>
                    <p className="font-medium">{caseData.court_name || <span className="text-slate-400 italic">Non renseigné</span>}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'القاضي' : 'Juge'}</p>
                    <p className="font-medium">{caseData.judge_name || <span className="text-slate-400 italic">Non renseigné</span>}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'الطرف المقابل' : 'Partie adverse'}</p>
                    <p className="font-medium">{caseData.opposing_party || caseData.adverse_party_name || <span className="text-slate-400 italic">Non renseigné</span>}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'محامي الطرف المقابل' : 'Avocat adverse'}</p>
                    <p className="font-medium">{caseData.opposing_lawyer || caseData.adverse_party_lawyer || <span className="text-slate-400 italic">Non renseigné</span>}</p>
                  </div>
                </div>
              </div>

              {/* Dates Importantes */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-legal-gold" />
                  {isAr ? 'التواريخ المهمة' : 'Dates Importantes'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'تاريخ الفتح' : 'Date d\'ouverture'}</p>
                    <p className="font-medium">
                      {(caseData.created_at || caseData.createdAt || caseData.opened_date) 
                        ? new Date(caseData.created_at || caseData.createdAt || caseData.opened_date).toLocaleDateString('fr-FR')
                        : <span className="text-slate-400 italic">Non renseigné</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'الموعد النهائي' : 'Date limite'}</p>
                    <p className="font-medium text-orange-600">
                      {caseData.deadline 
                        ? new Date(caseData.deadline).toLocaleDateString('fr-FR')
                        : <span className="text-slate-400 italic">Non définie</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'الجلسة القادمة' : 'Prochaine audience'}</p>
                    <p className="font-medium text-blue-600">
                      {caseData.next_hearing_date 
                        ? new Date(caseData.next_hearing_date).toLocaleDateString('fr-FR')
                        : <span className="text-slate-400 italic">Non planifiée</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'التقادم' : 'Prescription'}</p>
                    <p className="font-medium text-red-600">
                      {caseData.statute_of_limitations 
                        ? new Date(caseData.statute_of_limitations).toLocaleDateString('fr-FR')
                        : <span className="text-slate-400 italic">Non définie</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {caseData.notes && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <MessageSquare size={20} className="text-legal-gold" />
                    {isAr ? 'ملاحظات' : 'Notes'}
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{caseData.notes}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4">{isAr ? 'إحصائيات سريعة' : 'Statistiques'}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{isAr ? 'تاريخ الإنشاء' : 'Créé le'}</span>
                    <span className="font-medium">{new Date(caseData.createdAt as string | Date).toLocaleDateString()}</span>
                  </div>
                  {caseData.deadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{isAr ? 'الموعد النهائي' : 'Échéance'}</span>
                      <span className="font-medium text-orange-600">{new Date(caseData.deadline as string | Date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {caseData.estimatedValue && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{isAr ? 'القيمة المقدرة' : 'Valeur estimée'}</span>
                      <span className="font-medium text-green-600">{caseData.estimatedValue.toLocaleString()} DA</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{isAr ? 'الحالة' : 'Statut'}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      caseData.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {caseData.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4">{isAr ? 'إجراءات سريعة' : 'Actions Rapides'}</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveTab('documents')}
                    className="w-full px-4 py-3 bg-legal-gold text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-legal-gold/90 transition-colors"
                  >
                    <Plus size={18} />
                    {isAr ? `إضافة ${t.document(false)}` : `Ajouter ${t.document(false)}`}
                  </button>
                  <button 
                    onClick={() => setShowNoteModal(true)}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <MessageSquare size={18} />
                    {isAr ? 'إضافة ملاحظة' : 'Ajouter Note'}
                  </button>
                  <button 
                    onClick={() => setActiveTab('timeline')}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Calendar size={18} />
                    {isAr ? `جدولة ${t.event(false)}` : `Planifier ${t.event(false)}`}
                  </button>
                </div>
              </div>

              {/* Prochains Événements */}
              {upcomingEvents.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Clock size={20} className="text-legal-gold" />
                      {isAr ? `${t.event(true)} القادمة` : `Prochains ${t.event(true)}`}
                    </h3>
                    <button
                      onClick={() => setActiveTab('timeline')}
                      className="text-sm text-legal-gold hover:underline"
                    >
                      {isAr ? 'عرض الكل' : 'Voir tout'}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => {
                      const eventDate = new Date(event.event_date);
                      const isToday = eventDate.toDateString() === new Date().toDateString();
                      const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                      
                      return (
                        <div
                          key={event.id}
                          className="p-3 rounded-xl border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          onClick={() => setActiveTab('timeline')}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 p-2 rounded-lg ${
                              isToday ? 'bg-red-100 text-red-600' :
                              isTomorrow ? 'bg-orange-100 text-orange-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              <Calendar size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{event.title}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {isToday ? (isAr ? 'اليوم' : 'Aujourd\'hui') :
                                 isTomorrow ? (isAr ? 'غدا' : 'Demain') :
                                 eventDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                {event.event_time && ` • ${event.event_time.substring(0, 5)}`}
                              </p>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {event.event_type}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{isAr ? t.document(true) : `${t.document(true)} du ${t.case(false)}`}</h3>
              <label className="px-4 py-2 bg-legal-gold text-white rounded-xl font-medium flex items-center gap-2 cursor-pointer hover:bg-legal-gold/90 transition-colors">
                <Upload size={18} />
                {uploading ? (isAr ? 'جاري الرفع...' : 'Téléchargement...') : (isAr ? 'رفع مستند' : 'Télécharger')}
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            
            {documents.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                <p>{isAr ? `لا توجد ${t.document(true)}` : `Aucun ${t.document(false).toLowerCase()} pour le moment`}</p>
                <p className="text-sm mt-2">{isAr ? 'انقر على "رفع مستند" لإضافة ملفات' : 'Cliquez sur "Télécharger" pour ajouter des fichiers'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  // Fonction pour obtenir le badge du type de document
                  const getDocumentTypeBadge = (type: string) => {
                    const types: Record<string, { label: string; labelAr: string; color: string }> = {
                      contract: { label: 'Contrat', labelAr: 'عقد', color: 'bg-blue-100 text-blue-700' },
                      court_document: { label: 'Judiciaire', labelAr: 'قضائي', color: 'bg-purple-100 text-purple-700' },
                      correspondence: { label: 'Courrier', labelAr: 'مراسلة', color: 'bg-green-100 text-green-700' },
                      evidence: { label: 'Preuve', labelAr: 'دليل', color: 'bg-orange-100 text-orange-700' },
                      invoice: { label: 'Facture', labelAr: 'فاتورة', color: 'bg-yellow-100 text-yellow-700' },
                      procedure: { label: 'Procédure', labelAr: 'إجراء', color: 'bg-indigo-100 text-indigo-700' },
                      identity: { label: 'Identité', labelAr: 'هوية', color: 'bg-pink-100 text-pink-700' },
                      other: { label: 'Autre', labelAr: 'آخر', color: 'bg-slate-100 text-slate-700' }
                    };
                    
                    const typeInfo = types[type] || types.other;
                    return (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${typeInfo.color}`}>
                        {isAr ? typeInfo.labelAr : typeInfo.label}
                      </span>
                    );
                  };

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText size={24} className="text-legal-gold" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{doc.file_name}</p>
                            {getDocumentTypeBadge(doc.document_type)}
                          </div>
                          <p className="text-sm text-slate-500">
                            {new Date(doc.created_at).toLocaleDateString('fr-FR')} • {(doc.file_size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title={isAr ? 'تحميل' : 'Télécharger'}
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const { supabase } = await import('../../lib/supabase');
                              
                              // Essayer d'abord l'URL publique
                              const { data: publicData } = supabase.storage
                                .from('case-documents')
                                .getPublicUrl(doc.storage_path);
                              
                              // Si le bucket est privé, utiliser une signed URL
                              const { data: signedData, error } = await supabase.storage
                                .from('case-documents')
                                .createSignedUrl(doc.storage_path, 3600); // 1 heure
                              
                              const url = signedData?.signedUrl || publicData.publicUrl;
                              window.open(url, '_blank');
                            } catch (error) {
                              console.error('Error opening document:', error);
                              toast(isAr ? 'خطأ في فتح المستند' : 'Erreur lors de l\'ouverture du document', 'error');
                            }
                          }}
                          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title={isAr ? 'عرض' : 'Voir'}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                          title={isAr ? 'حذف' : 'Supprimer'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
            <CaseTimeline caseId={caseId} language={language} userId={userId} />
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{isAr ? 'الفواتير' : 'Facturation'}</h3>
              <button className="px-4 py-2 bg-legal-gold text-white rounded-xl font-medium flex items-center gap-2">
                <Plus size={18} />
                {isAr ? 'إنشاء فاتورة' : 'Créer Facture'}
              </button>
            </div>
            <div className="text-center py-12 text-slate-400">
              <DollarSign size={48} className="mx-auto mb-4 opacity-20" />
              <p>{isAr ? 'لا توجد فواتير بعد' : 'Aucune facture pour le moment'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{isAr ? 'تعديل الملف' : 'Modifier le Dossier'}</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations du Dossier */}
              <div>
                <h3 className="text-lg font-bold mb-4">{isAr ? `معلومات ${t.case(false)}` : `Informations du ${t.case(false)}`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      {isAr ? `عنوان ${t.case(false)}` : `Titre du ${t.case(false).toLowerCase()}`} *
                    </label>
                    <input
                      type="text"
                      value={editFormData.title || ''}
                      onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      {isAr ? `وصف ${t.case(false)}` : `Description du ${t.case(false).toLowerCase()}`} *
                    </label>
                    <textarea
                      value={editFormData.description || ''}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {isAr ? `نوع ${t.case(false)}` : `Type de ${t.case(false).toLowerCase()}`}
                    </label>
                    <select
                      value={editFormData.caseType || ''}
                      onChange={(e) => setEditFormData({...editFormData, caseType: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="">{isAr ? 'اختر النوع' : 'Sélectionner le type'}</option>
                      <option value="civil">{isAr ? 'مدني' : 'Droit Civil'}</option>
                      <option value="commercial">{isAr ? 'تجاري' : 'Droit Commercial'}</option>
                      <option value="family">{isAr ? 'أسري' : 'Droit de la Famille'}</option>
                      <option value="penal">{isAr ? 'جنائي' : 'Droit Pénal'}</option>
                      <option value="labor">{isAr ? 'عمل' : 'Droit du Travail'}</option>
                      <option value="real_estate">{isAr ? 'عقاري' : 'Droit Immobilier'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {isAr ? 'الأولوية' : 'Priorité'}
                    </label>
                    <select
                      value={editFormData.priority || 'medium'}
                      onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="low">{isAr ? 'منخفضة' : 'Faible'}</option>
                      <option value="medium">{isAr ? 'متوسطة' : 'Moyenne'}</option>
                      <option value="high">{isAr ? 'عالية' : 'Élevée'}</option>
                      <option value="urgent">{isAr ? 'عاجلة' : 'Urgente'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {isAr ? 'القيمة المقدرة (دج)' : 'Valeur estimée (DA)'}
                    </label>
                    <input
                      type="number"
                      value={editFormData.estimatedValue || ''}
                      onChange={(e) => setEditFormData({...editFormData, estimatedValue: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {isAr ? 'الموعد النهائي' : 'Date limite'}
                    </label>
                    <input
                      type="date"
                      value={editFormData.deadline || ''}
                      onChange={(e) => setEditFormData({...editFormData, deadline: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Informations Client */}
              <div>
                <h3 className="text-lg font-bold mb-4">{isAr ? `معلومات ${t.client(false)}` : `Informations ${t.client(false)}`}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {isAr ? `اسم ${t.client(false)}` : `Nom du ${t.client(false).toLowerCase()}`} *
                    </label>
                    <input
                      type="text"
                      value={editFormData.clientName || ''}
                      onChange={(e) => setEditFormData({...editFormData, clientName: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {isAr ? 'رقم الهاتف' : 'Numéro de téléphone'}
                    </label>
                    <input
                      type="tel"
                      value={editFormData.clientPhone || ''}
                      onChange={(e) => setEditFormData({...editFormData, clientPhone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {isAr ? 'البريد الإلكتروني' : 'Adresse email'}
                    </label>
                    <input
                      type="email"
                      value={editFormData.clientEmail || ''}
                      onChange={(e) => setEditFormData({...editFormData, clientEmail: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {isAr ? 'العنوان' : 'Adresse'}
                    </label>
                    <input
                      type="text"
                      value={editFormData.clientAddress || ''}
                      onChange={(e) => setEditFormData({...editFormData, clientAddress: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Avocat Assigné */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'المحامي المكلف' : 'Avocat assigné'}
                </label>
                <input
                  type="text"
                  value={editFormData.assignedLawyer || ''}
                  onChange={(e) => setEditFormData({...editFormData, assignedLawyer: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'ملاحظات' : 'Notes'}
                </label>
                <textarea
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800"
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t dark:border-slate-800">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 rounded-xl border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  disabled={saving}
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  onClick={handleUpdateCase}
                  className="px-6 py-3 bg-legal-gold text-white rounded-xl font-medium hover:bg-legal-gold/90 transition-colors disabled:opacity-50"
                  disabled={saving || !editFormData.title || !editFormData.description || !editFormData.clientName}
                >
                  {saving ? (isAr ? 'جاري الحفظ...' : 'Enregistrement...') : (isAr ? 'حفظ التعديلات' : 'Enregistrer les modifications')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNoteModal(false)}>
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{isAr ? 'إضافة ملاحظة' : 'Ajouter une Note'}</h2>
              <button 
                onClick={() => setShowNoteModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 min-h-[200px]"
                placeholder={isAr ? 'اكتب ملاحظتك هنا...' : 'Écrivez votre note ici...'}
                autoFocus
              />

              <div className="flex gap-3 justify-end mt-4">
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="px-6 py-3 rounded-xl border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  onClick={handleAddNote}
                  className="px-6 py-3 bg-legal-gold text-white rounded-xl font-medium hover:bg-legal-gold/90 transition-colors"
                  disabled={!noteText.trim()}
                >
                  {isAr ? 'إضافة' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetailView;
