import { useState } from 'react';
import { Trash2, CheckCircle2, Tag, Calendar, UserCheck, AlertTriangle } from 'lucide-react';
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
  const [hover, setHover] = useState(false);
  const p = PRIORITY_CONFIG[task.priority];
  const q = QUADRANTS[task.quadrant];
  const isDone = task.column === 'done';
  const followUpOverdue = task.delegatedTo && !task.followUpDone && task.followUpDate
    && new Date(task.followUpDate) < new Date();

  return (
    <div
      className={`
        group relative rounded-xl border border-[#2A2640] bg-[#1E1C28]
        shadow-sm shadow-black/40
        transition-colors cursor-pointer
        ${isDone ? 'opacity-50' : 'hover:border-violet-500/30 hover:bg-[#24222F]'}
        ${compact ? 'p-3' : 'p-3.5'}
      `}
      onClick={() => onEdit(task)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Top row: priority + quadrant + delete */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.dot}`} />
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${q.color}`}>{q.shortLabel}</span>
        <div className="flex-1" />
        <button
          onClick={e => { e.stopPropagation(); onDelete(task.id); }}
          className={`p-1 rounded text-gray-700 hover:text-red-400 transition-colors ${hover ? 'opacity-100' : 'opacity-0'}`}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Title */}
      <p className={`text-sm leading-snug mb-2 ${isDone ? 'line-through text-gray-600' : 'text-gray-100'}`}>
        {task.title}
      </p>

      {/* Description */}
      {!compact && task.description && (
        <p className="text-xs text-gray-600 mb-2 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      {/* Delegation */}
      {task.delegatedTo && (
        <div className={`flex items-center gap-1.5 mb-2 text-[11px] ${
          followUpOverdue ? 'text-red-400' : task.followUpDone ? 'text-emerald-500' : 'text-amber-500'
        }`}>
          {followUpOverdue ? <AlertTriangle size={10} /> : <UserCheck size={10} />}
          <span>{task.followUpDone ? '✓' : followUpOverdue ? '⚠' : '→'} {task.delegatedTo}</span>
        </div>
      )}

      {/* Commitment note */}
      {task.commitmentNote && !task.delegatedTo && (
        <p className="text-[11px] text-amber-600 mb-2 leading-relaxed">{task.commitmentNote}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {task.tags.slice(0, 2).map(tag => (
            <span key={tag} className="flex items-center gap-1 text-[10px] text-gray-700 px-1.5 py-0.5 rounded bg-white/[0.04] border border-[#2A2640]">
              <Tag size={7} />
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {task.dueDate && (
            <span className="text-[10px] text-gray-700 flex items-center gap-1">
              <Calendar size={9} />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {onDelegate && (task.quadrant === 'delegate' || task.delegatedTo) && (
            <button
              onClick={e => { e.stopPropagation(); onDelegate(task); }}
              className="text-[10px] text-amber-600 hover:text-amber-400 transition-colors"
            >
              {task.delegatedTo ? 'Update' : 'Delegate'}
            </button>
          )}
          {onMoveColumn && !isDone && (
            <button
              onClick={e => {
                e.stopPropagation();
                onMoveColumn(task.id, task.column === 'backlog' ? 'in-progress' : 'done');
              }}
              className="p-0.5 rounded text-gray-700 hover:text-emerald-500 transition-colors"
            >
              <CheckCircle2 size={12} />
            </button>
          )}
          {isDone && <CheckCircle2 size={12} className="text-emerald-600" />}
        </div>
      </div>
    </div>
  );
}
