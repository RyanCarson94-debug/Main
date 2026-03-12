import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Task, KanbanColumnId } from '../types';
import { COLUMNS } from '../types';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onMoveColumn: (id: string, col: KanbanColumnId) => void;
  onDelegateTask?: (task: Task) => void;
}

export function KanbanBoard({ tasks, onAddTask, onEditTask, onDeleteTask, onMoveColumn, onDelegateTask }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanColumnId | null>(null);

  const columnOrder: KanbanColumnId[] = ['backlog', 'in-progress', 'done'];

  const columnTasks = (col: KanbanColumnId) =>
    tasks.filter(t => t.column === col);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, col: KanbanColumnId) => {
    e.preventDefault();
    if (draggedId) {
      onMoveColumn(draggedId, col);
    }
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, col: KanbanColumnId) => {
    e.preventDefault();
    setDragOverCol(col);
  };

  const completedCount = tasks.filter(t => t.column === 'done').length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-white">Task Board</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {completedCount}/{totalCount} tasks done &middot; {progressPct}% complete
          </p>
        </div>
        <button
          onClick={onAddTask}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-95"
        >
          <Plus size={16} />
          New Task
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Columns */}
      <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
        {columnOrder.map(colId => {
          const col = COLUMNS[colId];
          const colTasks = columnTasks(colId);
          const isOver = dragOverCol === colId;

          return (
            <div
              key={colId}
              className={`
                flex-1 min-w-[280px] flex flex-col rounded-2xl border transition-all duration-150
                ${isOver
                  ? 'border-purple-500/50 bg-purple-500/5'
                  : 'border-[#2D1F5E] bg-white/2'
                }
              `}
              onDragOver={e => handleDragOver(e, colId)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={e => handleDrop(e, colId)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D1F5E]">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.accent}`} />
                  <span className={`font-bold text-sm ${col.color}`}>{col.label}</span>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-gray-600 text-xs text-center">
                    <span className="text-2xl mb-1">
                      {colId === 'backlog' ? '📥' : colId === 'in-progress' ? '⚡' : '✅'}
                    </span>
                    {colId === 'backlog' ? 'Add tasks above' : colId === 'in-progress' ? 'Move tasks here' : 'Completed tasks appear here'}
                  </div>
                ) : (
                  colTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={e => handleDragStart(e, task.id)}
                      onDragEnd={() => setDraggedId(null)}
                      className={`transition-opacity ${draggedId === task.id ? 'opacity-40' : 'opacity-100'}`}
                    >
                      <TaskCard
                        task={task}
                        onDelete={onDeleteTask}
                        onMoveColumn={onMoveColumn}
                        onEdit={onEditTask}
                        onDelegate={onDelegateTask}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Add button for backlog */}
              {colId === 'backlog' && (
                <button
                  onClick={onAddTask}
                  className="flex items-center gap-2 mx-3 mb-3 px-3 py-2 rounded-xl border border-dashed border-[#2D1F5E] text-gray-600 hover:text-gray-400 hover:border-gray-600 text-xs font-medium transition-colors"
                >
                  <Plus size={12} />
                  Add task
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
