import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Language } from '../../types';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date?: string;
  category?: string;
}

interface TaskFormProps {
  caseId: string;
  userId: string;
  language: Language;
  task?: Task | null;
  onClose: () => void;
  onSave: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ caseId, userId, language, task, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'normal',
    due_date: task?.due_date || '',
    category: task?.category || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isAr = language === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError(isAr ? 'العنوان مطلوب' : 'Le titre est requis');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (task) {
        // Update existing task
        const { error: updateError } = await supabase
          .from('case_tasks')
          .update({
            title: formData.title,
            description: formData.description || null,
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date || null,
            category: formData.category || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id);

        if (updateError) throw updateError;
      } else {
        // Create new task
        const { error: insertError } = await supabase
          .from('case_tasks')
          .insert({
            case_id: caseId,
            user_id: userId,
            title: formData.title,
            description: formData.description || null,
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date || null,
            category: formData.category || null,
            created_by: userId
          });

        if (insertError) throw insertError;
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving task:', err);
      setError(err.message || (isAr ? 'حدث خطأ' : 'Une erreur est survenue'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border dark:border-slate-800 pointer-events-auto"
          dir={isAr ? 'rtl' : 'ltr'}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b dark:border-slate-800">
            <h2 className="text-xl font-bold">
              {task 
                ? (isAr ? 'تعديل المهمة' : 'Modifier la tâche')
                : (isAr ? 'إضافة مهمة جديدة' : 'Ajouter une tâche')
              }
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {isAr ? 'العنوان' : 'Titre'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
                placeholder={isAr ? 'أدخل عنوان المهمة' : 'Entrez le titre de la tâche'}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {isAr ? 'الوصف' : 'Description'}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
                placeholder={isAr ? 'أدخل وصف المهمة (اختياري)' : 'Entrez la description (optionnel)'}
              />
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'الحالة' : 'Statut'}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
                >
                  <option value="todo">{isAr ? 'للإنجاز' : 'À faire'}</option>
                  <option value="in_progress">{isAr ? 'قيد التنفيذ' : 'En cours'}</option>
                  <option value="done">{isAr ? 'منتهي' : 'Terminé'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'الأولوية' : 'Priorité'}
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
                >
                  <option value="low">{isAr ? 'منخفضة' : 'Basse'}</option>
                  <option value="normal">{isAr ? 'عادية' : 'Normale'}</option>
                  <option value="high">{isAr ? 'عالية' : 'Haute'}</option>
                  <option value="urgent">{isAr ? 'عاجل' : 'Urgent'}</option>
                </select>
              </div>
            </div>

            {/* Due Date and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'تاريخ الاستحقاق' : 'Date d\'échéance'}
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {isAr ? 'الفئة' : 'Catégorie'}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
                >
                  <option value="">{isAr ? 'بدون فئة' : 'Aucune catégorie'}</option>
                  <option value="procedure">{isAr ? 'إجراء' : 'Procédure'}</option>
                  <option value="document">{isAr ? 'وثيقة' : 'Document'}</option>
                  <option value="client">{isAr ? 'عميل' : 'Client'}</option>
                  <option value="tribunal">{isAr ? 'محكمة' : 'Tribunal'}</option>
                  <option value="other">{isAr ? 'أخرى' : 'Autre'}</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-legal-gold text-white rounded-xl hover:bg-legal-gold/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>{isAr ? 'جاري الحفظ...' : 'Enregistrement...'}</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>{isAr ? 'حفظ' : 'Enregistrer'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default TaskForm;
