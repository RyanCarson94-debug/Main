import { useState, useMemo } from 'react';
import { CalendarDays, Clock, Plus, ChevronRight } from 'lucide-react';
import type { Task, QuadrantId } from '../types';
import { PRIORITY_CONFIG, QUADRANTS } from '../types';

interface DayPlannerViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onAddTask: (quadrant?: QuadrantId) => void;
}

type Slot = 'morning' | 'afternoon' | 'evening' | 'unscheduled';

const SLOTS: { id: Slot; label: string; hours: string; emoji: string }[] = [
  { id: 'morning',     label: 'Morning',     hours: '8am – 12pm', emoji: '🌅' },
  { id: 'afternoon',   label: 'Afternoon',   hours: '12pm – 5pm', emoji: '☀️' },
  { id: 'evening',     label: 'Evening',     hours: '5pm – 8pm',  emoji: '🌆' },
  { id: 'unscheduled', label: 'Unscheduled', hours: 'No time set', emoji: '📋' },
];

const today = new Date().toISOString().split('T')[0];

function fmtMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

export function DayPlannerView({ tasks, onEditTask, onAddTask }: DayPlannerViewProps) {
  const [slotMap, setSlotMap] = useState<Record<string, Slot>>({});
  const [dragId, setDragId] = useState<string | null>(null);

  const todayTasks = useMemo(() => tasks.filter(t =>
    t.column !== 'done' && (
      t.dueDate === today ||
      t.quadrant === 'do-now' ||
      t.column === 'in-progress'
    )
  ).sort((a, b) => {
    const po: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (po[a.priority] ?? 9) - (po[b.priority] ?? 9);
  }), [tasks]);

  const totalEstimate = todayTasks.reduce((s, t) => s + (t.estimateMinutes ?? 0), 0);
  const scheduledEstimate = todayTasks.filter(t => slotMap[t.id] && slotMap[t.id] !== 'unscheduled').reduce((s, t) => s + (t.estimateMinutes ?? 0), 0);

  const tasksBySlot = (slot: Slot) => todayTasks.filter(t => (slotMap[t.id] ?? 'unscheduled') === slot);

  const handleDrop = (slot: Slot) => {
    if (dragId) setSlotMap(m => ({ ...m, [dragId]: slot }));
    setDragId(null);
  };

  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <CalendarDays className="text-violet-400" size={24} />
            Day Planner
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          {totalEstimate > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Estimated total</p>
              <p className="text-sm font-bold text-white">{fmtMinutes(totalEstimate)}</p>
              {scheduledEstimate > 0 && <p className="text-[10px] text-violet-400">{fmtMinutes(scheduledEstimate)} planned</p>}
            </div>
          )}
          <button
            onClick={() => onAddTask('do-now')}
            className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            <Plus size={14} /> Add task
          </button>
        </div>
      </div>

      {todayTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-16">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-sm font-semibold text-gray-500">Nothing urgent today</p>
          <p className="text-xs text-gray-700 mt-1 mb-4">Tasks due today or in your Do Now quadrant show up here</p>
          <button onClick={() => onAddTask('do-now')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 text-sm font-semibold transition-colors hover:bg-violet-600/30">
            <Plus size={13} /> Plan something
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SLOTS.map(slot => {
              const slotTasks = tasksBySlot(slot.id);
              const slotEstimate = slotTasks.reduce((s, t) => s + (t.estimateMinutes ?? 0), 0);
              return (
                <div
                  key={slot.id}
                  className={`flex flex-col rounded-2xl border min-h-[200px] transition-colors ${
                    dragId ? 'border-violet-500/40 bg-violet-500/5' : 'border-[#2A2640] bg-[#1A1824]'
                  }`}
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={() => handleDrop(slot.id)}
                >
                  <div className="px-3 py-2.5 border-b border-[#2A2640] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                        <span>{slot.emoji}</span> {slot.label}
                      </p>
                      <p className="text-[10px] text-gray-600">{slot.hours}</p>
                    </div>
                    {slotEstimate > 0 && (
                      <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full">
                        {fmtMinutes(slotEstimate)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 p-2 space-y-1.5">
                    {slotTasks.map(task => (
                      <PlannerTaskCard
                        key={task.id}
                        task={task}
                        onEdit={() => onEditTask(task)}
                        onDragStart={() => setDragId(task.id)}
                        onDragEnd={() => setDragId(null)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tips */}
          <div className="mt-4 p-3 rounded-xl border border-[#2A2640] bg-[#1A1824] flex items-start gap-2.5">
            <span className="text-sm">💡</span>
            <p className="text-xs text-gray-500">
              Drag tasks between time blocks to plan your day. Set time estimates on tasks (in the edit modal) to see totals per block and avoid over-scheduling.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function PlannerTaskCard({
  task,
  onEdit,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  onEdit: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const p = PRIORITY_CONFIG[task.priority];
  const q = QUADRANTS[task.quadrant];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onEdit}
      className="group flex items-start gap-2 p-2.5 rounded-xl bg-[#1E1C28] border border-[#2A2640] hover:border-violet-500/30 cursor-grab active:cursor-grabbing transition-colors"
    >
      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${p.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-200 leading-snug truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] ${q.color}`}>{q.shortLabel}</span>
          {task.estimateMinutes && (
            <span className="flex items-center gap-0.5 text-[10px] text-gray-600">
              <Clock size={8} /> {fmtMinutes(task.estimateMinutes)}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={11} className="text-gray-700 group-hover:text-gray-500 shrink-0 mt-1 transition-colors" />
    </div>
  );
}
