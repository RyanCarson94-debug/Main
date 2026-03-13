import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Zap, Play, Pause, RotateCcw, Check, Plus, Trash2,
  Sparkles, Loader2, AlertCircle, Timer, Layers,
  ChevronRight, Coffee,
} from 'lucide-react';
import type { Task, FocusStep, TaskFocus } from '../types';
import { QUADRANTS, PRIORITY_CONFIG } from '../types';
import { generateTaskBreakdown } from '../services/claudeApi';

// ─── Constants ────────────────────────────────────────────────────────────────

const POMODORO_MINUTES = 25;
const BREAK_MINUTES = 5;

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const QUADRANT_ORDER: Record<string, number> = { 'do-now': 0, 'schedule': 1, 'delegate': 2, 'drop': 3 };

// Energy level grouping by tag keywords
const ENERGY_GROUPS: { label: string; color: string; bg: string; border: string; keywords: string[] }[] = [
  { label: 'Deep Work',    color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', keywords: ['strategy', 'planning', 'design', 'write', 'writing', 'analysis', 'research', 'build'] },
  { label: 'People Work',  color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',  keywords: ['meeting', 'team', '1:1', 'feedback', 'leadership', 'coaching', 'stakeholder'] },
  { label: 'Admin',        color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20', keywords: ['admin', 'email', 'report', 'update', 'review', 'track', 'jira', 'slack'] },
  { label: 'Quick Wins',   color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20',keywords: ['quick', 'short', 'small', 'simple', 'easy', 'approve', 'sign'] },
];

function getEnergyGroup(task: Task): string {
  const haystack = [...task.tags, task.title, task.description ?? ''].join(' ').toLowerCase();
  for (const group of ENERGY_GROUPS) {
    if (group.keywords.some(kw => haystack.includes(kw))) return group.label;
  }
  return 'Other';
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FocusViewProps {
  tasks: Task[];
  focusMap: Record<string, TaskFocus>;
  onSetSteps: (taskId: string, steps: FocusStep[]) => void;
  onToggleStep: (taskId: string, stepId: string) => void;
  onAddStep: (taskId: string, text: string, estimate?: number) => void;
  onDeleteStep: (taskId: string, stepId: string) => void;
  onClearSteps: (taskId: string) => void;
}

// ─── Pomodoro Timer ───────────────────────────────────────────────────────────

function PomodoroTimer({ taskTitle }: { taskTitle: string }) {
  const [isBreak, setIsBreak] = useState(false);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_MINUTES * 60);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = isBreak ? BREAK_MINUTES * 60 : POMODORO_MINUTES * 60;
  const progress = 1 - secondsLeft / totalSeconds;

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const tick = useCallback(() => {
    setSecondsLeft(prev => {
      if (prev <= 1) {
        setRunning(false);
        if (!isBreak) setSessions(s => s + 1);
        setIsBreak(b => !b);
        return isBreak ? POMODORO_MINUTES * 60 : BREAK_MINUTES * 60;
      }
      return prev - 1;
    });
  }, [isBreak]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, tick]);

  const reset = () => {
    setRunning(false);
    setIsBreak(false);
    setSecondsLeft(POMODORO_MINUTES * 60);
  };

  // SVG ring
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-[#1C1C1F] border border-[#2C2C30]">
      <div className="flex items-center gap-2">
        {isBreak
          ? <><Coffee size={13} className="text-emerald-400" /><span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Break</span></>
          : <><Timer size={13} className="text-purple-400" /><span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Focus</span></>
        }
        {sessions > 0 && (
          <span className="text-[10px] text-gray-600">
            {sessions} session{sessions !== 1 ? 's' : ''} done
          </span>
        )}
      </div>

      {/* Ring */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#1e1a3a" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={isBreak ? '#10b981' : '#a855f7'}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white tabular-nums">{mins}:{secs}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center max-w-[160px] truncate" title={taskTitle}>
        {taskTitle}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          className="p-2 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-colors"
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={() => setRunning(r => !r)}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
            running
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : isBreak
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-purple-600 text-white hover:bg-purple-500'
          }`}
        >
          {running ? <Pause size={15} /> : <Play size={15} />}
          {running ? 'Pause' : 'Start'}
        </button>
      </div>
    </div>
  );
}

// ─── Step List ────────────────────────────────────────────────────────────────

function StepList({
  taskId: _taskId,
  steps,
  onToggle,
  onDelete,
  onAdd,
}: {
  taskId: string;
  steps: FocusStep[];
  onToggle: (stepId: string) => void;
  onDelete: (stepId: string) => void;
  onAdd: (text: string, estimate?: number) => void;
}) {
  const [newText, setNewText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const done = steps.filter(s => s.done).length;
  const totalMins = steps.reduce((sum, s) => sum + (s.estimateMinutes ?? 0), 0);

  const submit = () => {
    if (!newText.trim()) return;
    onAdd(newText.trim());
    setNewText('');
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      {steps.length > 0 && (
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-1.5 rounded-full bg-[#2D1F5E] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${steps.length ? (done / steps.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 shrink-0">
            {done}/{steps.length}
            {totalMins > 0 && <span className="text-gray-700"> · ~{totalMins}m</span>}
          </span>
        </div>
      )}

      {/* Steps */}
      {steps.map((step, i) => (
        <div
          key={step.id}
          className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
            step.done ? 'bg-white/[0.02] border border-white/5 opacity-50' : 'bg-[#1C1C1F] border border-[#2C2C30]'
          }`}
        >
          <button
            onClick={() => onToggle(step.id)}
            className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
              step.done
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-gray-600 hover:border-purple-400'
            }`}
          >
            {step.done && <Check size={10} className="text-white" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm leading-relaxed ${step.done ? 'line-through text-gray-600' : 'text-gray-200'}`}>
              <span className="text-gray-600 mr-1.5">{i + 1}.</span>
              {step.text}
            </p>
            {step.estimateMinutes && (
              <span className="text-[11px] text-gray-600">~{step.estimateMinutes} min</span>
            )}
          </div>
          <button
            onClick={() => onDelete(step.id)}
            className="shrink-0 p-1 rounded text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}

      {/* Add step */}
      <div className="flex items-center gap-2 mt-1">
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a step…"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          className="flex-1 px-3 py-2 rounded-xl bg-[#1C1C1F] border border-[#2C2C30] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
        />
        <button
          onClick={submit}
          disabled={!newText.trim()}
          className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-white/10 hover:bg-purple-600/30 transition-colors disabled:opacity-30"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Batch Tab ────────────────────────────────────────────────────────────────

function BatchTab({ tasks }: { tasks: Task[] }) {
  const activeTasks = tasks.filter(t => t.column !== 'done');

  const groups = useMemo(() => {
    const groupMap: Record<string, Task[]> = {};
    for (const task of activeTasks) {
      const label = getEnergyGroup(task);
      if (!groupMap[label]) groupMap[label] = [];
      groupMap[label].push(task);
    }
    return groupMap;
  }, [activeTasks]);

  // Tag-based batches: tasks sharing the same tag
  const tagBatches = useMemo(() => {
    const tagMap: Record<string, Task[]> = {};
    for (const task of activeTasks) {
      for (const tag of task.tags) {
        if (!tagMap[tag]) tagMap[tag] = [];
        tagMap[tag].push(task);
      }
    }
    return Object.entries(tagMap)
      .filter(([, ts]) => ts.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);
  }, [activeTasks]);

  return (
    <div className="space-y-6 overflow-y-auto pb-4">
      {/* ADHD tip */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <Zap size={14} className="shrink-0 text-amber-400 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Batching Tip</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Group tasks by mental energy type — switching between deep work and admin costs ~20 minutes of refocus time. Do all your admin in one go, then protect a block for deep work.
          </p>
        </div>
      </div>

      {/* Energy groups */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">By Energy Type</p>
        <div className="space-y-3">
          {ENERGY_GROUPS.map(group => {
            const groupTasks = groups[group.label] ?? [];
            if (groupTasks.length === 0) return null;
            return (
              <div key={group.label} className={`p-4 rounded-xl border ${group.bg} ${group.border}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={13} className={group.color} />
                  <p className={`text-xs font-bold uppercase tracking-widest ${group.color}`}>{group.label}</p>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${group.bg} ${group.color} border ${group.border}`}>
                    {groupTasks.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {groupTasks.map(task => {
                    const qCfg = QUADRANTS[task.quadrant];
                    const pCfg = PRIORITY_CONFIG[task.priority];
                    return (
                      <div key={task.id} className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pCfg.dot}`} />
                        <p className="text-xs text-gray-300 flex-1 truncate">{task.title}</p>
                        <span className={`text-[10px] font-bold ${qCfg.color}`}>{qCfg.shortLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {(groups['Other'] ?? []).length > 0 && (
            <div className="p-4 rounded-xl border bg-gray-500/5 border-gray-500/15">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Other</p>
              <div className="space-y-1.5">
                {groups['Other'].map(task => (
                  <div key={task.id} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_CONFIG[task.priority].dot}`} />
                    <p className="text-xs text-gray-400 flex-1 truncate">{task.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tag batches */}
      {tagBatches.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Do These Together (Same Tag)</p>
          <div className="space-y-2">
            {tagBatches.map(([tag, tagTasks]) => (
              <div key={tag} className="p-3 rounded-xl bg-[#1C1C1F] border border-[#2C2C30]">
                <p className="text-xs font-bold text-purple-400 mb-2">#{tag} <span className="text-gray-600 font-normal">({tagTasks.length} tasks)</span></p>
                <div className="space-y-1">
                  {tagTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2">
                      <ChevronRight size={11} className="text-gray-600 shrink-0" />
                      <p className="text-xs text-gray-400 truncate">{task.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function FocusView({
  tasks,
  focusMap,
  onSetSteps,
  onToggleStep,
  onAddStep,
  onDeleteStep,
  onClearSteps,
}: FocusViewProps) {
  const [tab, setTab] = useState<'focus' | 'batch'>('focus');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const activeTasks = useMemo(() =>
    tasks
      .filter(t => t.column !== 'done')
      .sort((a, b) => {
        const qDiff = QUADRANT_ORDER[a.quadrant] - QUADRANT_ORDER[b.quadrant];
        if (qDiff !== 0) return qDiff;
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      }),
    [tasks]
  );

  const selectedTask = activeTasks.find(t => t.id === selectedTaskId) ?? activeTasks[0] ?? null;
  const focus = selectedTask ? focusMap[selectedTask.id] : null;
  const steps = focus?.steps ?? [];

  const handleAiBreakdown = async () => {
    if (!selectedTask) return;
    setAiLoading(true);
    setAiError(null);
    await generateTaskBreakdown(
      selectedTask,
      (rawSteps) => {
        const steps: FocusStep[] = rawSteps.map(s => ({
          id: crypto.randomUUID(),
          text: s.text,
          estimateMinutes: s.estimateMinutes,
          done: false,
        }));
        onSetSteps(selectedTask.id, steps);
        setAiLoading(false);
      },
      (err) => {
        setAiError(err);
        setAiLoading(false);
      },
    );
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header + tabs */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-amber-400" />
          <h1 className="text-xl font-black text-white">Focus Mode</h1>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1C1C1F] border border-[#2C2C30]">
          {(['focus', 'batch'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                tab === t
                  ? 'bg-purple-600/40 text-purple-200 border border-purple-500/40'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'focus' ? 'Focus' : 'Batch'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'batch' ? (
        <BatchTab tasks={activeTasks} />
      ) : (
        <div className="flex-1 flex gap-4 min-h-0">
          {/* ── Left: Task picker ── */}
          <div className="w-[220px] shrink-0 flex flex-col gap-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1 px-1">Your Tasks</p>
            {activeTasks.length === 0 && (
              <p className="text-xs text-gray-600 italic px-1">No active tasks</p>
            )}
            {activeTasks.map(task => {
              const active = (selectedTask?.id ?? null) === task.id || (!selectedTaskId && task === activeTasks[0]);
              const qCfg = QUADRANTS[task.quadrant];
              const pCfg = PRIORITY_CONFIG[task.priority];
              const taskSteps = focusMap[task.id]?.steps ?? [];
              const doneSteps = taskSteps.filter(s => s.done).length;

              return (
                <button
                  key={task.id}
                  onClick={() => { setSelectedTaskId(task.id); setAiError(null); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                    active
                      ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/20 border border-white/10'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pCfg.dot}`} />
                    <span className={`text-[10px] font-bold ${qCfg.color}`}>{qCfg.shortLabel}</span>
                  </div>
                  <p className={`text-xs font-semibold leading-snug ${active ? 'text-white' : 'text-gray-400'}`}>
                    {task.title}
                  </p>
                  {taskSteps.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 h-1 rounded-full bg-[#2D1F5E] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500/60"
                          style={{ width: `${(doneSteps / taskSteps.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-600">{doneSteps}/{taskSteps.length}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Right: Focus panel ── */}
          {!selectedTask ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-600">Select a task to focus on</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto">
              {/* Task header */}
              <div className="shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${QUADRANTS[selectedTask.quadrant].color}`}>
                    {QUADRANTS[selectedTask.quadrant].label}
                  </span>
                  <span className={`text-[10px] font-bold ${PRIORITY_CONFIG[selectedTask.priority].color}`}>
                    · {PRIORITY_CONFIG[selectedTask.priority].label}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white leading-tight">{selectedTask.title}</h2>
                {selectedTask.description && (
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{selectedTask.description}</p>
                )}
              </div>

              {/* Two-column layout: timer + steps */}
              <div className="flex gap-4 flex-1 min-h-0">
                {/* Timer column */}
                <div className="w-[200px] shrink-0 space-y-4">
                  <PomodoroTimer taskTitle={selectedTask.title} />

                  {/* ADHD strategy tip */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1.5">ADHD Strategy</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {selectedTask.quadrant === 'do-now'
                        ? 'This is urgent. Do the first step only — don\'t think about the rest yet.'
                        : selectedTask.priority === 'critical' || selectedTask.priority === 'high'
                          ? 'High priority. Set a 25-min focus block. Tell someone you\'re starting to create accountability.'
                          : 'Use the timer. When it rings, you\'re done — even if it\'s not perfect. Done beats perfect.'
                      }
                    </p>
                  </div>
                </div>

                {/* Steps column */}
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  {/* AI breakdown controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex-1">Steps</p>
                    {steps.length > 0 && (
                      <button
                        onClick={() => onClearSteps(selectedTask.id)}
                        className="text-[11px] text-gray-600 hover:text-red-400 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                    <button
                      onClick={handleAiBreakdown}
                      disabled={aiLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-300 border border-white/10 hover:bg-purple-600/30 transition-colors disabled:opacity-50"
                    >
                      {aiLoading
                        ? <><Loader2 size={12} className="animate-spin" />Breaking down…</>
                        : <><Sparkles size={12} />AI Breakdown</>
                      }
                    </button>
                  </div>

                  {aiError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 shrink-0">
                      <AlertCircle size={13} className="shrink-0 text-red-400 mt-0.5" />
                      <p className="text-xs text-red-400">{aiError}</p>
                    </div>
                  )}

                  {steps.length === 0 && !aiLoading && (
                    <div className="py-6 text-center">
                      <Sparkles size={24} className="text-gray-700 mx-auto mb-2" />
                      <p className="text-xs text-gray-600">No steps yet.</p>
                      <p className="text-xs text-gray-700 mt-0.5">Hit "AI Breakdown" or add steps manually below.</p>
                    </div>
                  )}

                  {aiLoading && (
                    <div className="py-6 flex items-center justify-center gap-2 text-xs text-purple-400">
                      <Loader2 size={14} className="animate-spin" />
                      Thinking through the steps…
                    </div>
                  )}

                  {!aiLoading && (
                    <StepList
                      taskId={selectedTask.id}
                      steps={steps}
                      onToggle={stepId => onToggleStep(selectedTask.id, stepId)}
                      onDelete={stepId => onDeleteStep(selectedTask.id, stepId)}
                      onAdd={(text, est) => onAddStep(selectedTask.id, text, est)}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
