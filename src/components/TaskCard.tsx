import { useState } from 'react';
import { Trash2, ChevronRight, CheckCircle2, Tag, Calendar, UserCheck, AlertTriangle } from 'lucide-react';
import type { Task, KanbanColumnId } from '../types';
import { QUADRANTS, PRIORITY_CONFIG } from '../types';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onMoveColumn?: (id: string, col: KanbanColumnId) => void;
  onEdit: (task: Task) => void;
  onDelegate?: (task: Task) => void;
  compact?: boolean;
}

export function TaskCard({ task, onDelete, onMoveColumn, onEdit, onDelegate, compact }: TaskCardProps) {
  const [showActions, setShowActions] = useState(false);
  const q = QUADRANTS[task.quadrant];
  const p = PRIORITY_CONFIG[task.priority];
  const isDone = task.column === 'done';

  const followUpOverdue = task.delegatedTo && !task.followUpDone && task.followUpDate
    && new Date(task.followUpDate) < new Date();

  return (
    <div
      className={`
        group relative rounded-xl border transition-all duration-150 cursor-pointer
        ${isDone ? 'opacity-60' : ''}
        ${q.bg} ${q.border}
        hover:scale-[1.01] hover:shadow-lg hover:shadow-black/30
        ${compact ? 'p-3' : 'p-4'}
      `}
      onClick={() => onEdit(task)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Priority dot + quadrant badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`shrink-0 w-2 h-2 rounded-full ${p.dot}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${q.color}`}>
            {q.shortLabel}
          </span>
        </div>
        <div className={`transition-opacity duration-150 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Title */}
      <p className={`font-semibold text-sm leading-snug mb-2 ${isDone ? 'line-through text-gray-500' : 'text-white'}`}>
        {task.title}
      </p>

      {/* Description */}
      {!compact && task.description && (
        <p className="text-xs text-gray-400 mb-2 leading-relaxed line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Delegation badge */}
      {task.delegatedTo && (
        <div className={`flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg border text-[10px] font-semibold
          ${followUpOverdue
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : task.followUpDone
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
          }`}
        >
          {followUpOverdue ? <AlertTriangle size={10} /> : <UserCheck size={10} />}
          <span>
            {task.followUpDone ? '✓ Followed up' : followUpOverdue ? '⚠ Follow-up overdue' : '→'} {task.delegatedTo}
          </span>
        </div>
      )}

      {/* Commitment note */}
      {task.commitmentNote && !task.delegatedTo && (
        <div className="flex items-start gap-1.5 mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <ChevronRight size={12} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-300 leading-relaxed">{task.commitmentNote}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {task.tags.slice(0, 2).map(tag => (
            <span key={tag} className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
              <Tag size={8} />
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <Calendar size={9} />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {onDelegate && (task.quadrant === 'delegate' || task.delegatedTo) && (
            <button
              onClick={e => { e.stopPropagation(); onDelegate(task); }}
              className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors
                ${task.delegatedTo
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-amber-500 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:border-amber-400/30'
                }`}
              title={task.delegatedTo ? 'Update delegation' : 'Delegate this task'}
            >
              <UserCheck size={10} />
              {task.delegatedTo ? 'Update' : 'Delegate'}
            </button>
          )}
          {onMoveColumn && !isDone && (
            <button
              onClick={e => {
                e.stopPropagation();
                const next: KanbanColumnId = task.column === 'backlog' ? 'in-progress' : 'done';
                onMoveColumn(task.id, next);
              }}
              className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-emerald-400 transition-colors"
              title="Move to next stage"
            >
              <CheckCircle2 size={13} />
            </button>
          )}
          {isDone && <CheckCircle2 size={13} className="text-emerald-400" />}
        </div>
      </div>
    </div>
  );
}
