import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2,
  AlertCircle,
  Filter,
  ChevronDown,
  User,
  Calendar,
  Flag
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Language } from '../../types';
import TaskForm from './TaskForm';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
  category?: string;
  completed_at?: string;
  created_at: string;
}

interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
  completion_rate: number;
}

interface TaskListProps {
  caseId: string;
  userId: string;
  language: Language;
}

const TaskList: React.FC<TaskListProps> = ({ caseId, userId, language }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const isAr = language === 'ar';

  useEffect(() => {
    loadTasks();
    loadStats();
  }, [caseId]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('case_tasks')
        .select('*')
        .eq('case_id', caseId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTasks(data);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_case_task_stats', { p_case_id: caseId });

      if (!error && data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const updates: any = { status: newStatus };
    
    if (newStatus === 'done') {
      updates.completed_at = new Date().toISOString();
    } else {
      updates.completed_at = null;
    }

    const { error } = await supabase
      .from('case_tasks')
      .update(updates)
      .eq('id', task.id);

    if (!error) {
      await loadTasks();
      await loadStats();
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذه المهمة؟' : 'Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return;
    }

    const { error } = await supabase
      .from('case_tasks')
      .delete()
      .eq('id', taskId);

    if (!error) {
      await loadTasks();
      await loadStats();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-slate-600 bg-slate-50 border-slate-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, { fr: string; ar: string }> = {
      urgent: { fr: 'Urgent', ar: 'عاجل' },
      high: { fr: 'Haute', ar: 'عالية' },
      normal: { fr: 'Normale', ar: 'عادية' },
      low: { fr: 'Basse', ar: 'منخفضة' }
    };
    return labels[priority]?.[language] || priority;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { fr: string; ar: string }> = {
      todo: { fr: 'À faire', ar: 'للإنجاز' },
      in_progress: { fr: 'En cours', ar: 'قيد التنفيذ' },
      done: { fr: 'Terminé', ar: 'منتهي' }
    };
    return labels[status]?.[language] || status;
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'done') return false;
    return new Date(task.due_date) < new Date();
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const groupedTasks = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    done: filteredTasks.filter(t => t.status === 'done')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700">
            <p className="text-sm text-slate-500 mb-1">{isAr ? 'المجموع' : 'Total'}</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-600 mb-1">{isAr ? 'للإنجاز' : 'À faire'}</p>
            <p className="text-2xl font-bold text-blue-600">{stats.todo}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-600 mb-1">{isAr ? 'قيد التنفيذ' : 'En cours'}</p>
            <p className="text-2xl font-bold text-orange-600">{stats.in_progress}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-600 mb-1">{isAr ? 'منتهي' : 'Terminé'}</p>
            <p className="text-2xl font-bold text-green-600">{stats.done}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 mb-1">{isAr ? 'متأخر' : 'En retard'}</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </div>
        </div>
      )}

      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
          >
            <option value="all">{isAr ? 'كل الحالات' : 'Tous les statuts'}</option>
            <option value="todo">{isAr ? 'للإنجاز' : 'À faire'}</option>
            <option value="in_progress">{isAr ? 'قيد التنفيذ' : 'En cours'}</option>
            <option value="done">{isAr ? 'منتهي' : 'Terminé'}</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
          >
            <option value="all">{isAr ? 'كل الأولويات' : 'Toutes les priorités'}</option>
            <option value="urgent">{isAr ? 'عاجل' : 'Urgent'}</option>
            <option value="high">{isAr ? 'عالية' : 'Haute'}</option>
            <option value="normal">{isAr ? 'عادية' : 'Normale'}</option>
            <option value="low">{isAr ? 'منخفضة' : 'Basse'}</option>
          </select>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-legal-gold text-white rounded-xl hover:bg-legal-gold/90 transition-colors"
        >
          <Plus size={18} />
          <span>{isAr ? 'إضافة مهمة' : 'Ajouter une tâche'}</span>
        </button>
      </div>

      {/* Task Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* À faire */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Circle size={20} className="text-blue-500" />
            <h3 className="font-bold text-lg">{isAr ? 'للإنجاز' : 'À faire'}</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
              {groupedTasks.todo.length}
            </span>
          </div>
          {groupedTasks.todo.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              language={language}
              onToggle={toggleTaskStatus}
              onEdit={(task) => {
                setEditingTask(task);
                setShowForm(true);
              }}
              onDelete={deleteTask}
              getPriorityColor={getPriorityColor}
              getPriorityLabel={getPriorityLabel}
              isOverdue={isOverdue}
            />
          ))}
        </div>

        {/* En cours */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-orange-500" />
            <h3 className="font-bold text-lg">{isAr ? 'قيد التنفيذ' : 'En cours'}</h3>
            <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">
              {groupedTasks.in_progress.length}
            </span>
          </div>
          {groupedTasks.in_progress.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              language={language}
              onToggle={toggleTaskStatus}
              onEdit={(task) => {
                setEditingTask(task);
                setShowForm(true);
              }}
              onDelete={deleteTask}
              getPriorityColor={getPriorityColor}
              getPriorityLabel={getPriorityLabel}
              isOverdue={isOverdue}
            />
          ))}
        </div>

        {/* Terminé */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={20} className="text-green-500" />
            <h3 className="font-bold text-lg">{isAr ? 'منتهي' : 'Terminé'}</h3>
            <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full">
              {groupedTasks.done.length}
            </span>
          </div>
          {groupedTasks.done.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              language={language}
              onToggle={toggleTaskStatus}
              onEdit={(task) => {
                setEditingTask(task);
                setShowForm(true);
              }}
              onDelete={deleteTask}
              getPriorityColor={getPriorityColor}
              getPriorityLabel={getPriorityLabel}
              isOverdue={isOverdue}
            />
          ))}
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          caseId={caseId}
          userId={userId}
          language={language}
          task={editingTask}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
          onSave={async () => {
            await loadTasks();
            await loadStats();
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

// Task Card Component
const TaskCard: React.FC<{
  task: Task;
  language: Language;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  getPriorityColor: (priority: string) => string;
  getPriorityLabel: (priority: string) => string;
  isOverdue: (task: Task) => boolean;
}> = ({ task, language, onToggle, onEdit, onDelete, getPriorityColor, getPriorityLabel, isOverdue }) => {
  const isAr = language === 'ar';
  const overdue = isOverdue(task);

  return (
    <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 hover:shadow-md transition-shadow ${
      task.status === 'done' ? 'opacity-60' : ''
    } ${overdue ? 'border-l-4 border-l-red-500' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task)}
          className="mt-1 flex-shrink-0"
        >
          {task.status === 'done' ? (
            <CheckCircle2 size={20} className="text-green-500" />
          ) : (
            <Circle size={20} className="text-slate-400 hover:text-legal-gold" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className={`font-medium ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}>
              {task.title}
            </h4>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onEdit(task)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-sm text-slate-500 mb-3 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
              <Flag size={10} className="inline mr-1" />
              {getPriorityLabel(task.priority)}
            </span>

            {task.due_date && (
              <span className={`text-xs px-2 py-1 rounded ${
                overdue ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
              }`}>
                <Calendar size={10} className="inline mr-1" />
                {new Date(task.due_date).toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR')}
              </span>
            )}

            {overdue && (
              <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 font-bold">
                <AlertCircle size={10} className="inline mr-1" />
                {isAr ? 'متأخر' : 'En retard'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskList;
