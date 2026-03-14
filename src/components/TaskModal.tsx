import { useState, useEffect } from 'react';
import { X, Plus, Tag, RefreshCw } from 'lucide-react';
import type { Task, QuadrantId, KanbanColumnId, Priority, EnergyLevel, RecurrenceType } from '../types';
import { QUADRANTS, PRIORITY_CONFIG, ENERGY_CONFIG } from '../types';

const RECURRENCE_OPTIONS: { value: RecurrenceType | 'none'; label: string }[] = [
  { value: 'none',     label: 'No repeat' },
  { value: 'daily',    label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly',   label: 'Weekly' },
  { value: 'monthly',  label: 'Monthly' },
];

interface TaskModalProps {
  task?: Task | null;
  onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const defaultTask: Omit<Task, 'id' | 'createdAt'> = {
  title: '',
  description: '',
  quadrant: 'do-now',
  column: 'backlog',
  priority: 'medium',
  tags: [],
  commitmentNote: '',
};

export function TaskModal({ task, onSave, onClose }: TaskModalProps) {
  const [form, setForm] = useState<Omit<Task, 'id' | 'createdAt'>>(
    task ? { ...task } : defaultTask
  );
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm(f => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-[#1A1035] border-t sm:border border-[#2A2640] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-[slideIn_0.2s_ease-out] overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2640]">
          <h2 className="text-lg font-bold text-white">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              autoFocus
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What needs to happen?"
              className="w-full bg-black/30 border border-[#2A2640] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={form.description ?? ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Add context or details..."
              rows={2}
              className="w-full bg-black/30 border border-[#2A2640] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Quadrant + Priority row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Quadrant
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(QUADRANTS) as QuadrantId[]).map(qId => {
                  const q = QUADRANTS[qId];
                  const selected = form.quadrant === qId;
                  return (
                    <button
                      key={qId}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, quadrant: qId }))}
                      className={`
                        text-xs font-semibold px-2 py-2 rounded-lg border transition-all
                        ${selected ? `${q.bg} ${q.border} ${q.color}` : 'border-[#2A2640] text-gray-500 hover:border-gray-500'}
                      `}
                    >
                      {q.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(pId => {
                  const p = PRIORITY_CONFIG[pId];
                  const selected = form.priority === pId;
                  return (
                    <button
                      key={pId}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, priority: pId }))}
                      className={`
                        flex items-center gap-1.5 text-xs font-semibold px-2 py-2 rounded-lg border transition-all
                        ${selected ? `bg-white/10 border-white/20 ${p.color}` : 'border-[#2A2640] text-gray-500 hover:border-gray-500'}
                      `}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stage */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Stage
            </label>
            <div className="flex gap-2">
              {(['backlog', 'in-progress', 'done'] as KanbanColumnId[]).map(col => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, column: col }))}
                  className={`
                    flex-1 text-xs font-semibold py-2 rounded-lg border capitalize transition-all
                    ${form.column === col
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                      : 'border-[#2A2640] text-gray-500 hover:border-gray-500'
                    }
                  `}
                >
                  {col.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Commitment Note */}
          <div>
            <label className="block text-xs font-semibold text-amber-500/70 uppercase tracking-wider mb-1.5">
              Commitment / Follow-through Note
            </label>
            <input
              value={form.commitmentNote ?? ''}
              onChange={e => setForm(f => ({ ...f, commitmentNote: e.target.value }))}
              placeholder="What's your next action or commitment?"
              className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-white text-sm placeholder-amber-900 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Tags
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {form.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/5 text-gray-300 border border-[#2A2640]">
                  <Tag size={9} />
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-gray-500 hover:text-red-400">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}}
                placeholder="Add tag..."
                className="flex-1 bg-black/30 border border-[#2A2640] rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button type="button" onClick={addTag} className="px-3 py-2 rounded-xl bg-white/5 border border-[#2A2640] text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Energy Level */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Energy Required
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(Object.keys(ENERGY_CONFIG) as EnergyLevel[]).map(eId => {
                const e = ENERGY_CONFIG[eId];
                const selected = form.energy === eId;
                return (
                  <button
                    key={eId}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, energy: eId }))}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-semibold transition-all ${
                      selected ? `${e.bg} ${e.border} ${e.color}` : 'border-[#2A2640] text-gray-500 hover:border-gray-500'
                    }`}
                  >
                    <span>{e.emoji}</span>
                    <span className="text-[10px] leading-none">{e.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date + Recurrence row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate ?? ''}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full bg-black/30 border border-[#2A2640] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                <RefreshCw size={11} /> Repeats
              </label>
              <select
                value={form.recurrence?.type ?? 'none'}
                onChange={e => {
                  const val = e.target.value as RecurrenceType | 'none';
                  setForm(f => ({ ...f, recurrence: val === 'none' ? undefined : { type: val } }));
                }}
                className="w-full bg-black/30 border border-[#2A2640] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                {RECURRENCE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Time estimate */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Time Estimate (minutes)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={form.estimateMinutes ?? ''}
                onChange={e => setForm(f => ({ ...f, estimateMinutes: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="e.g. 30"
                className="w-32 bg-black/30 border border-[#2A2640] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
              <div className="flex gap-1.5">
                {[15, 30, 60, 90].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, estimateMinutes: m }))}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      form.estimateMinutes === m
                        ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                        : 'border-[#2A2640] text-gray-500 hover:border-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#2A2640] text-gray-400 hover:text-white hover:border-gray-500 font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm  transition-all hover:shadow-lg hover:shadow-purple-500/25"
            >
              {task ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
