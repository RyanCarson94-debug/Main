import { Plus } from 'lucide-react';
import type { Task, QuadrantId } from '../types';
import { QUADRANTS } from '../types';
import { TaskCard } from './TaskCard';

interface EisenhowerMatrixProps {
  tasks: Task[];
  onAddTask: (quadrant?: QuadrantId) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onMoveQuadrant: (id: string, quadrant: QuadrantId) => void;
  onDelegateTask: (task: Task) => void;
}

const QUADRANT_LAYOUT: { id: QuadrantId; emoji: string }[] = [
  { id: 'do-now', emoji: '🔥' },
  { id: 'schedule', emoji: '📅' },
  { id: 'delegate', emoji: '🤝' },
  { id: 'drop', emoji: '🗑️' },
];

export function EisenhowerMatrix({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onMoveQuadrant,
  onDelegateTask,
}: EisenhowerMatrixProps) {
  const quadrantTasks = (qId: QuadrantId) =>
    tasks.filter(t => t.quadrant === qId && t.column !== 'done');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-white">Eisenhower Matrix</h2>
          <p className="text-gray-400 text-sm mt-0.5">Prioritize by urgency &amp; importance</p>
        </div>
        <button
          onClick={() => onAddTask()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-95"
        >
          <Plus size={16} />
          New Task
        </button>
      </div>

      {/* Axis labels */}
      <div className="flex mb-2 pl-[52px] gap-4">
        <div className="flex-1 text-center">
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest">🔥 Urgent</span>
        </div>
        <div className="flex-1 text-center">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">📅 Not Urgent</span>
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* Y-axis labels */}
        <div className="flex flex-col gap-3 w-[44px] shrink-0">
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest rotate-[-90deg] whitespace-nowrap">
              ⭐ Important
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest rotate-[-90deg] whitespace-nowrap">
              Not Important
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
          {QUADRANT_LAYOUT.map(({ id, emoji }) => {
            const q = QUADRANTS[id];
            const qTasks = quadrantTasks(id);

            return (
              <div
                key={id}
                className={`
                  flex flex-col rounded-2xl border overflow-hidden
                  ${q.bg} ${q.border}
                `}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData('taskId');
                  if (taskId) onMoveQuadrant(taskId, id);
                }}
              >
                {/* Quadrant header */}
                <div className={`flex items-center justify-between px-3 py-2 border-b ${q.border}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{emoji}</span>
                    <div>
                      <p className={`text-xs font-black uppercase tracking-wide ${q.color}`}>{q.label}</p>
                      <p className="text-[10px] text-gray-500">{q.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/5 ${q.color}`}>
                      {qTasks.length}
                    </span>
                    <button
                      onClick={() => onAddTask(id)}
                      className={`p-1 rounded-lg hover:bg-white/10 ${q.color} transition-colors`}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Tasks */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {qTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-16 text-gray-600 text-xs">
                      Drop tasks here
                    </div>
                  ) : (
                    qTasks.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
                      >
                        <TaskCard
                          task={task}
                          onDelete={onDeleteTask}
                          onEdit={onEditTask}
                          onDelegate={onDelegateTask}
                          compact
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
