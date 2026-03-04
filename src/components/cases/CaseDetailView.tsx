import React, { useState, useEffect } from 'react';
import { Case, Language } from '../../types';
import { 
  ArrowLeft, Calendar, Clock, User, Phone, Mail, MapPin, 
  FileText, DollarSign, AlertCircle, CheckCircle, Edit2, 
  Trash2, Plus, Upload, Download, Eye, MessageSquare,
  Tag, TrendingUp, Activity
} from 'lucide-react';
import { CaseService } from '../../services/caseService';
import { DocumentService } from '../../services/documentService';
import { ClientService } from '../../services/clientService';
import CaseTimeline from './CaseTimeline';

interface CaseDetailViewProps {
  caseId: string;
  language: Language;
  onBack: () => void;
  userId: string;
}

const CaseDetailView: React.FC<CaseDetailViewProps> = ({ caseId, language, onBack, userId }) => {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'timeline' | 'billing'>('overview');
  const [loading, setLoading] = useState(true);
  const isAr = language === 'ar';

  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const loadCaseData = async () => {
    setLoading(true);
    try {
      // Load case data from Supabase
      const cases = await CaseService.getCases(userId, { status: 'active' });
      const foundCase = cases.find(c => c.id === caseId);
      if (foundCase) {
        setCaseData(foundCase);
      }
    } catch (error) {
      console.error('Error loading case:', error);
    } finally {
      setLoading(false);
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
        <p className="text-slate-500">{isAr ? 'الملف غير موجود' : 'Dossier introuvable'}</p>
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
              <p className="text-sm text-slate-500">{isAr ? 'رقم الملف:' : 'N° Dossier:'} {caseData.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-xl text-sm font-bold border ${getPriorityColor(caseData.priority)}`}>
              {caseData.priority?.toUpperCase() || 'NORMAL'}
            </span>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              <Edit2 size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6">
          {[
            { id: 'overview', label: isAr ? 'نظرة عامة' : 'Vue d\'ensemble', icon: Activity },
            { id: 'documents', label: isAr ? 'المستندات' : 'Documents', icon: FileText },
            { id: 'timeline', label: isAr ? 'الجدول الزمني' : 'Timeline', icon: Clock },
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
                  {isAr ? 'معلومات العميل' : 'Informations Client'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'الاسم' : 'Nom'}</p>
                    <p className="font-medium">{caseData.clientName}</p>
                  </div>
                  {caseData.clientPhone && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">{isAr ? 'الهاتف' : 'Téléphone'}</p>
                      <p className="font-medium flex items-center gap-2">
                        <Phone size={14} className="text-legal-gold" />
                        {caseData.clientPhone}
                      </p>
                    </div>
                  )}
                  {caseData.clientEmail && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</p>
                      <p className="font-medium flex items-center gap-2">
                        <Mail size={14} className="text-legal-gold" />
                        {caseData.clientEmail}
                      </p>
                    </div>
                  )}
                  {caseData.clientAddress && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500 mb-1">{isAr ? 'العنوان' : 'Adresse'}</p>
                      <p className="font-medium flex items-center gap-2">
                        <MapPin size={14} className="text-legal-gold" />
                        {caseData.clientAddress}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Case Details */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4">{isAr ? 'تفاصيل الملف' : 'Détails du Dossier'}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{isAr ? 'الوصف' : 'Description'}</p>
                    <p className="text-slate-700 dark:text-slate-300">{caseData.description}</p>
                  </div>
                  {caseData.notes && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">{isAr ? 'ملاحظات' : 'Notes'}</p>
                      <p className="text-slate-700 dark:text-slate-300">{caseData.notes}</p>
                    </div>
                  )}
                  {caseData.tags && caseData.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-500 mb-2">{isAr ? 'الوسوم' : 'Tags'}</p>
                      <div className="flex flex-wrap gap-2">
                        {caseData.tags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4">{isAr ? 'إحصائيات سريعة' : 'Statistiques'}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{isAr ? 'تاريخ الإنشاء' : 'Créé le'}</span>
                    <span className="font-medium">{caseData.createdAt.toLocaleDateString()}</span>
                  </div>
                  {caseData.deadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{isAr ? 'الموعد النهائي' : 'Échéance'}</span>
                      <span className="font-medium text-orange-600">{caseData.deadline.toLocaleDateString()}</span>
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
                  <button className="w-full px-4 py-3 bg-legal-gold text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-legal-gold/90 transition-colors">
                    <Plus size={18} />
                    {isAr ? 'إضافة مستند' : 'Ajouter Document'}
                  </button>
                  <button className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <MessageSquare size={18} />
                    {isAr ? 'إضافة ملاحظة' : 'Ajouter Note'}
                  </button>
                  <button className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <Calendar size={18} />
                    {isAr ? 'جدولة موعد' : 'Planifier RDV'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{isAr ? 'المستندات' : 'Documents du Dossier'}</h3>
              <button className="px-4 py-2 bg-legal-gold text-white rounded-xl font-medium flex items-center gap-2">
                <Upload size={18} />
                {isAr ? 'رفع مستند' : 'Télécharger'}
              </button>
            </div>
            <div className="text-center py-12 text-slate-400">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p>{isAr ? 'لا توجد مستندات بعد' : 'Aucun document pour le moment'}</p>
            </div>
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
    </div>
  );
};

export default CaseDetailView;
