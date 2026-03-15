import React, { useState } from 'react';
import { Language } from '../../../types';
import { Briefcase, User, Clock, AlertCircle, ChevronRight, GripVertical } from 'lucide-react';

interface KanbanCase {
  id: string;
  title: string;
  clientName: string;
  priority?: string;
  caseType?: string;
  deadline?: string | Date | null;
  status: string;
  created_at?: string;
  createdAt?: Date;
  case_number?: string;
  [key: string]: any;
}

interface CaseKanbanViewProps {
  cases: KanbanCase[];
  language: Language;
  onCaseClick: (id: string) => void;
  onStatusChange: (caseId: string, newStatus: string) => void;
}

const COLUMNS = [
  { id: 'nouveau',      labelFr: 'Nouveau',    labelAr: 'جديد',         color: 'border-slate-400',  bg: 'bg-slate-50 dark:bg-slate-900',   dot: 'bg-slate-400'  },
  { id: 'en_cours',     labelFr: 'En cours',   labelAr: 'جاري',         color: 'border-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/30',  dot: 'bg-blue-400'   },
  { id: 'audience',     labelFr: 'Audience',   labelAr: 'جلسة',         color: 'border-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/30',dot: 'bg-amber-400'  },
  { id: 'jugement',     labelFr: 'Jugement',   labelAr: 'حكم',          color: 'border-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30',dot:'bg-purple-400' },
  { id: 'cloture',      labelFr: 'Clôturé',    labelAr: 'مغلق',         color: 'border-green-400',  bg: 'bg-green-50 dark:bg-green-950/30',dot: 'bg-green-400'  },
];

// Map existing DB statuses to kanban columns
function normalizeStatus(status: string): string {
  const map: Record<string, string> = {
    active: 'en_cours',
    nouveau: 'nouveau',
    new: 'nouveau',
    en_cours: 'en_cours',
    in_progress: 'en_cours',
    audience: 'audience',
    hearing: 'audience',
    jugement: 'jugement',
    judgment: 'jugement',
    cloture: 'cloture',
    closed: 'cloture',
    archived: 'cloture',
  };
  return map[status?.toLowerCase()] ?? 'nouveau';
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  urgente: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  haute:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  normale: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low:     'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const PRIORITY_ICONS: Record<string, string> = {
  urgent: '🔴', urgente: '🔴',
  high: '🟠', haute: '🟠',
  medium: '🟡', normale: '🟡',
  low: '⚪',
};

const CaseKanbanView: React.FC<CaseKanbanViewProps> = ({ cases, language, onCaseClick, onStatusChange }) => {
  const isAr = language === 'ar';
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Group cases by normalized status
  const grouped = COLUMNS.reduce<Record<string, KanbanCase[]>>((acc, col) => {
    acc[col.id] = cases.filter(c => normalizeStatus(c.status) === col.id);
    return acc;
  }, {});

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== colId) {
      onStatusChange(draggedId, colId);
    }
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  const isDeadlineSoon = (deadline?: string | Date | null): boolean => {
    if (!deadline) return false;
    const d = new Date(deadline);
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  const isDeadlinePast = (deadline?: string | Date | null): boolean => {
    if (!deadline) return false;
    return new Date(deadline).getTime() < Date.now();
  };

  return (
    <div className="w-full overflow-x-auto pb-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map(col => {
          const colCases = grouped[col.id] ?? [];
          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              className={`flex flex-col w-72 rounded-2xl border-t-4 ${col.color} ${col.bg} transition-all ${
                isOver ? 'ring-2 ring-legal-gold ring-offset-2' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column header */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                    {isAr ? col.labelAr : col.labelFr}
                  </span>
                </div>
                <span className="text-xs font-bold bg-white dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border dark:border-slate-700">
                  {colCases.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-3 px-3 pb-4 min-h-[120px]">
                {colCases.map(c => {
                  const isDragging = draggedId === c.id;
                  const soon = isDeadlineSoon(c.deadline);
                  const past = isDeadlinePast(c.deadline);
                  const priorityKey = (c.priority ?? 'low').toLowerCase();

                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onCaseClick(c.id)}
                      className={`bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-4 cursor-pointer shadow-sm hover:shadow-md hover:border-legal-gold/40 transition-all select-none ${
                        isDragging ? 'opacity-40 scale-95' : 'opacity-100'
                      }`}
                    >
                      {/* Top row: grip + priority */}
                      <div className="flex items-center justify-between mb-2">
                        <GripVertical size={14} className="text-slate-300 cursor-grab active:cursor-grabbing" />
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[priorityKey] ?? PRIORITY_COLORS.low}`}>
                          {PRIORITY_ICONS[priorityKey] ?? '⚪'} {isAr ? priorityKey : priorityKey}
                        </span>
                      </div>

                      {/* Case number */}
                      {c.case_number && (
                        <p className="text-[10px] text-slate-400 font-mono mb-1">{c.case_number}</p>
                      )}

                      {/* Title */}
                      <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 line-clamp-2 mb-2 leading-snug">
                        {c.title}
                      </h4>

                      {/* Client */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                        <User size={11} className="text-legal-gold flex-shrink-0" />
                        <span className="truncate">{c.clientName}</span>
                      </div>

                      {/* Footer: date + deadline */}
                      <div className="flex items-center justify-between pt-2 border-t dark:border-slate-800">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock size={10} />
                          {c.created_at
                            ? new Date(c.created_at).toLocaleDateString('fr-DZ')
                            : c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString('fr-DZ')
                            : '—'}
                        </div>
                        {c.deadline && (
                          <div className={`flex items-center gap-1 text-[10px] font-semibold ${
                            past ? 'text-red-500' : soon ? 'text-amber-500' : 'text-slate-400'
                          }`}>
                            {(past || soon) && <AlertCircle size={10} />}
                            {new Date(c.deadline).toLocaleDateString('fr-DZ')}
                          </div>
                        )}
                      </div>

                      {/* Move to next column quick action */}
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const idx = COLUMNS.findIndex(col => col.id === normalizeStatus(c.status));
                            if (idx < COLUMNS.length - 1) {
                              onStatusChange(c.id, COLUMNS[idx + 1].id);
                            }
                          }}
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-legal-gold transition-colors"
                          title={isAr ? 'الخطوة التالية' : 'Étape suivante'}
                        >
                          <ChevronRight size={12} />
                          {isAr ? 'التالي' : 'Suivant'}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Drop zone hint when empty */}
                {colCases.length === 0 && (
                  <div className={`flex-1 flex items-center justify-center rounded-xl border-2 border-dashed py-8 transition-colors ${
                    isOver ? 'border-legal-gold bg-legal-gold/5' : 'border-slate-200 dark:border-slate-800'
                  }`}>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'اسحب هنا' : 'Déposer ici'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CaseKanbanView;
