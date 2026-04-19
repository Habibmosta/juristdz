import React from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, FileText, Tag, AlertCircle, Clock, Briefcase } from 'lucide-react';
import type { Case } from '../../types';

interface CaseDetailModalProps {
  case_: Case;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  language: 'fr' | 'ar';
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  case_,
  isOpen,
  onClose,
  onEdit,
  language
}) => {
  if (!isOpen) return null;

  const isAr = language === 'ar';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return isAr ? 'عاجل' : 'Urgent';
      case 'high': return isAr ? 'عالي' : 'Élevé';
      case 'medium': return isAr ? 'متوسط' : 'Moyen';
      case 'low': return isAr ? 'منخفض' : 'Faible';
      default: return priority;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-legal-blue to-blue-600 text-white p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase size={24} />
                <h2 className="text-2xl font-bold">{case_.title}</h2>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(case_.priority || 'medium')}`}>
                  {getPriorityLabel(case_.priority || 'medium')}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {case_.status === 'active' ? (isAr ? 'نشط' : 'Actif') : 
                   case_.status === 'archived' ? (isAr ? 'مؤرشف' : 'Archivé') :
                   (isAr ? 'معلق' : 'En attente')}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <User size={20} className="text-legal-blue" />
                {isAr ? 'معلومات العميل' : 'Informations Client'}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User size={16} className="text-slate-400 mt-1" />
                  <div>
                    <p className="text-xs text-slate-500">{isAr ? 'الاسم' : 'Nom'}</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{case_.clientName}</p>
                  </div>
                </div>

                {case_.clientPhone && (
                  <div className="flex items-start gap-3">
                    <Phone size={16} className="text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">{isAr ? 'الهاتف' : 'Téléphone'}</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{case_.clientPhone}</p>
                    </div>
                  </div>
                )}

                {case_.clientEmail && (
                  <div className="flex items-start gap-3">
                    <Mail size={16} className="text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">{isAr ? 'البريد الإلكتروني' : 'Email'}</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{case_.clientEmail}</p>
                    </div>
                  </div>
                )}

                {case_.clientAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">{isAr ? 'العنوان' : 'Adresse'}</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{case_.clientAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Case Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <FileText size={20} className="text-legal-blue" />
                {isAr ? 'معلومات الملف' : 'Informations Dossier'}
              </h3>
              
              <div className="space-y-3">
                {case_.caseNumber && (
                  <div className="flex items-start gap-3">
                    <Tag size={16} className="text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">{isAr ? 'رقم الملف' : 'Numéro'}</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{case_.caseNumber}</p>
                    </div>
                  </div>
                )}

                {case_.caseType && (
                  <div className="flex items-start gap-3">
                    <Briefcase size={16} className="text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">{isAr ? 'نوع الملف' : 'Type'}</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{case_.caseType}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-slate-400 mt-1" />
                  <div>
                    <p className="text-xs text-slate-500">{isAr ? 'تاريخ الإنشاء' : 'Date de création'}</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {case_.createdAt.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {case_.nextHearing && (
                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-orange-500 mt-1" />
                    <div>
                      <p className="text-xs text-slate-500">{isAr ? 'الجلسة القادمة' : 'Prochaine audience'}</p>
                      <p className="font-medium text-orange-600 dark:text-orange-400">
                        {new Date(case_.nextHearing).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {case_.description && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                <FileText size={20} className="text-legal-blue" />
                {isAr ? 'الوصف' : 'Description'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                {case_.description}
              </p>
            </div>
          )}

          {/* Notes */}
          {case_.notes && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                <AlertCircle size={20} className="text-legal-blue" />
                {isAr ? 'ملاحظات' : 'Notes'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                {case_.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {isAr ? 'إغلاق' : 'Fermer'}
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="px-6 py-2.5 bg-legal-blue text-white rounded-xl font-medium hover:bg-legal-blue/90 transition-colors"
            >
              {isAr ? 'تعديل الملف' : 'Modifier le dossier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
