import { useState } from 'react';
import {
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  Target,
  Bell,
  UserCheck,
  TrendingUp,
  ChevronRight,
  Sparkles,
  X,
  RefreshCw,
  CalendarClock,
} from 'lucide-react';
import type { Task, OKR, Update } from '../types';
import { QUADRANTS, PRIORITY_CONFIG, ENERGY_CONFIG } from '../types';
import type { View } from '../types';
import { recommendNextTask } from '../services/claudeApi';

interface DashboardViewProps {
  tasks: Task[];
  okrs: OKR[];
  updates: Update[];
  dumpInboxCount: number;
  delegationAlerts: number;
  onViewChange: (view: View) => void;
  onEditTask: (task: Task) => void;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, count, sub, colorClass, icon, onClick,
}: {
  label: string; count: number; sub?: string; colorClass: string;
  icon: React.ReactNode; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.99] group ${colorClass}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="opacity-70">{icon}</span>
        {onClick && <ChevronRight size={13} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
      </div>
      <p className="text-3xl font-black tabular-nums">{count}</p>
      <p className="text-xs font-bold uppercase tracking-widest opacity-70 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] opacity-50 mt-0.5">{sub}</p>}
    </button>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon, title, count, onNavigate,
}: {
  icon: React.ReactNode; title: string; count?: number; onNavigate?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500">{count}</span>
        )}
      </div>
      {onNavigate && (
        <button onClick={onNavigate} className="text-[11px] text-gray-600 hover:text-purple-400 flex items-center gap-0.5 transition-colors">
          See all <ChevronRight size={11} />
        </button>
      )}
    </div>
  );
}

// ─── Dashboard Task Card ──────────────────────────────────────────────────────

function DashTaskCard({
  task, onClick, urgent = false,
}: {
  task: Task; onClick: () => void; urgent?: boolean;
}) {
  const q = QUADRANTS[task.quadrant];
  const p = PRIORITY_CONFIG[task.priority];
  const energy = task.energy ? ENERGY_CONFIG[task.energy] : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all group ${
        urgent
          ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
          : 'bg-[#1C1C1F] border-[#2C2C30] hover:border-purple-500/40 hover:bg-[#1a1540]'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`w-2 h-2 rounded-full ${p.dot} shrink-0`} />
        <p className={`flex-1 text-sm truncate group-hover:text-white transition-colors ${urgent ? 'text-red-200' : 'text-gray-200'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          {energy && <span className="text-[11px]">{energy.emoji}</span>}
          {task.column === 'in-progress' && (
            <span className="text-[10px] font-bold text-purple-400 px-1.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/20">active</span>
          )}
          {task.recurrence && <RefreshCw size={10} className="text-gray-600" />}
          {task.dueDate && (
            <span className={`text-[10px] ${urgent ? 'text-red-400 font-bold' : 'text-gray-600'}`}>
              {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${q.bg} ${q.color} border ${q.border}`}>
            {q.shortLabel}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Alert Row ────────────────────────────────────────────────────────────────

const ALERT_COLORS = {
  red:    'bg-red-500/10 border-red-500/20 text-red-400',
  amber:  'bg-amber-500/10 border-amber-500/20 text-amber-400',
  blue:   'bg-blue-500/10 border-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
};

function AlertRow({ label, color, onClick }: { label: string; color: keyof typeof ALERT_COLORS; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:opacity-90 ${ALERT_COLORS[color]}`}
    >
      <span>{label}</span>
      <ChevronRight size={13} className="opacity-60" />
    </button>
  );
}

// ─── Quick Nav Tile ───────────────────────────────────────────────────────────

function QuickNavTile({ icon, label, badge, onClick }: { icon: React.ReactNode; label: string; badge?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-purple-500/20 transition-all text-left"
    >
      <span className="text-gray-500">{icon}</span>
      <span className="text-xs font-semibold text-gray-400">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">{badge}</span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardView({
  tasks, okrs, updates, dumpInboxCount, delegationAlerts, onViewChange, onEditTask,
}: DashboardViewProps) {
  const [whatNowLoading, setWhatNowLoading] = useState(false);
  const [whatNowResult, setWhatNowResult] = useState<{ taskId: string; task: string; reason: string } | null>(null);
  const [whatNowError, setWhatNowError] = useState('');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const overdueTasks = tasks.filter(t => t.column !== 'done' && t.dueDate && t.dueDate < todayStr);
  const dueTodayTasks = tasks.filter(t => t.column !== 'done' && t.dueDate === todayStr);
  const doNowTasks = tasks.filter(t => t.quadrant === 'do-now' && t.column !== 'done' && !overdueTasks.includes(t) && !dueTodayTasks.includes(t));
  const inProgressTasks = tasks.filter(t => t.column === 'in-progress');

  const weekStart = new Date();
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const doneThisWeek = tasks.filter(t => t.column === 'done' && t.completedAt && new Date(t.completedAt) >= weekStart).length;

  const pendingUpdatesCount = updates.reduce((sum, u) => sum + (u.recipientIds.some(id => !u.discussedWith.includes(id)) ? 1 : 0), 0);
  const totalAlerts = delegationAlerts + pendingUpdatesCount + dumpInboxCount + overdueTasks.length;

  const okrSnapshot = okrs.slice(0, 3).map(okr => ({
    ...okr,
    avgProgress: okr.keyResults.length > 0
      ? Math.round(okr.keyResults.reduce((s, kr) => s + kr.progress, 0) / okr.keyResults.length)
      : 0,
  }));

  const handleWhatNow = async () => {
    setWhatNowLoading(true);
    setWhatNowResult(null);
    setWhatNowError('');
    await recommendNextTask(
      tasks.filter(t => t.column !== 'done'),
      result => { setWhatNowResult(result); setWhatNowLoading(false); },
      err => { setWhatNowError(err); setWhatNowLoading(false); },
    );
  };

  return (
    <div className="h-full overflow-y-auto space-y-5 pb-4">
      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">{greeting}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          {doneThisWeek > 0 && (
            <button onClick={() => onViewChange('kanban')} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">{doneThisWeek} done this week</span>
            </button>
          )}
          <button
            onClick={handleWhatNow}
            disabled={whatNowLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15 text-purple-400 text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Sparkles size={13} className={whatNowLoading ? 'animate-pulse' : ''} />
            {whatNowLoading ? 'Thinking…' : 'What now?'}
          </button>
        </div>
      </div>

      {/* ── AI Recommendation ── */}
      {(whatNowResult || whatNowError) && (
        <div className={`relative rounded-2xl p-4 border ${whatNowError ? 'bg-red-500/5 border-red-500/20' : 'bg-purple-500/10 border-white/10'}`}>
          <button onClick={() => { setWhatNowResult(null); setWhatNowError(''); }} className="absolute top-3 right-3 text-gray-600 hover:text-gray-400">
            <X size={14} />
          </button>
          {whatNowError ? (
            <p className="text-sm text-red-400">{whatNowError}</p>
          ) : whatNowResult && (
            <>
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Sparkles size={10} /> AI Recommendation
              </p>
              <p className="text-sm font-bold text-white mb-1">{whatNowResult.task}</p>
              <p className="text-xs text-gray-400">{whatNowResult.reason}</p>
            </>
          )}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Overdue" count={overdueTasks.length} sub={overdueTasks.length === 0 ? 'all clear' : 'need attention'} colorClass={overdueTasks.length > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/[0.03] border-white/5 text-gray-500'} icon={<CalendarClock size={16} />} onClick={() => onViewChange('kanban')} />
        <StatCard label="Do Now" count={doNowTasks.length + overdueTasks.length + dueTodayTasks.length} sub="urgent tasks" colorClass="bg-amber-500/10 border-amber-500/20 text-amber-400" icon={<Zap size={16} />} onClick={() => onViewChange('eisenhower')} />
        <StatCard label="Done This Week" count={doneThisWeek} sub={doneThisWeek === 0 ? "let's go" : 'great work'} colorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-400" icon={<CheckCircle2 size={16} />} />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-5 gap-5">
        {/* Left: tasks */}
        <div className="col-span-3 space-y-5">
          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <section>
              <SectionHeader icon={<CalendarClock size={13} className="text-red-400" />} title="Overdue" count={overdueTasks.length} onNavigate={() => onViewChange('kanban')} />
              <div className="space-y-1.5">
                {overdueTasks.slice(0, 4).map(task => (
                  <DashTaskCard key={task.id} task={task} onClick={() => onEditTask(task)} urgent />
                ))}
              </div>
            </section>
          )}

          {/* Due Today */}
          {dueTodayTasks.length > 0 && (
            <section>
              <SectionHeader icon={<Clock size={13} className="text-amber-400" />} title="Due Today" count={dueTodayTasks.length} />
              <div className="space-y-1.5">
                {dueTodayTasks.map(task => (
                  <DashTaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />
                ))}
              </div>
            </section>
          )}

          {/* Do Now */}
          <section>
            <SectionHeader icon={<Zap size={13} className="text-red-400" />} title="Do Now" count={doNowTasks.length} onNavigate={() => onViewChange('eisenhower')} />
            {doNowTasks.length === 0 && overdueTasks.length === 0 && dueTodayTasks.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <p className="text-sm text-emerald-600 font-medium">No urgent tasks — you're clear</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {doNowTasks.slice(0, 4).map(task => (
                  <DashTaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />
                ))}
                {doNowTasks.length > 4 && (
                  <button onClick={() => onViewChange('eisenhower')} className="w-full text-center text-xs text-gray-600 hover:text-purple-400 py-1.5 transition-colors">
                    +{doNowTasks.length - 4} more →
                  </button>
                )}
              </div>
            )}
          </section>

          {/* In Progress */}
          <section>
            <SectionHeader icon={<Clock size={13} className="text-purple-400" />} title="In Progress" count={inProgressTasks.length} onNavigate={() => onViewChange('kanban')} />
            {inProgressTasks.length === 0 ? (
              <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-sm text-gray-600">Nothing active — pick a task to start</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {inProgressTasks.slice(0, 4).map(task => (
                  <DashTaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: alerts + OKRs + quick nav */}
        <div className="col-span-2 space-y-5">
          {/* Needs Attention */}
          {totalAlerts > 0 && (
            <section>
              <SectionHeader icon={<AlertTriangle size={13} className="text-amber-400" />} title="Needs Attention" />
              <div className="space-y-1.5">
                {overdueTasks.length > 0 && (
                  <AlertRow label={`${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`} color="red" onClick={() => onViewChange('kanban')} />
                )}
                {delegationAlerts > 0 && (
                  <AlertRow label={`${delegationAlerts} delegation follow-up${delegationAlerts > 1 ? 's' : ''} due`} color="amber" onClick={() => onViewChange('delegations')} />
                )}
                {pendingUpdatesCount > 0 && (
                  <AlertRow label={`${pendingUpdatesCount} pending 1:1 briefing${pendingUpdatesCount > 1 ? 's' : ''}`} color="blue" onClick={() => onViewChange('updates')} />
                )}
                {dumpInboxCount > 0 && (
                  <AlertRow label={`${dumpInboxCount} item${dumpInboxCount > 1 ? 's' : ''} in brain dump`} color="purple" onClick={() => onViewChange('dump')} />
                )}
              </div>
            </section>
          )}

          {/* OKR Snapshot */}
          {okrSnapshot.length > 0 && (
            <section>
              <SectionHeader icon={<Target size={13} className="text-pink-400" />} title="OKR Snapshot" onNavigate={() => onViewChange('okrs')} />
              <div className="space-y-2">
                {okrSnapshot.map(okr => (
                  <button key={okr.id} onClick={() => onViewChange('okrs')} className="w-full text-left p-3 rounded-xl bg-[#1C1C1F] border border-[#2C2C30] hover:border-white/10 transition-all">
                    <p className="text-xs font-semibold text-gray-300 truncate mb-2">{okr.objective}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all" style={{ width: `${okr.avgProgress}%` }} />
                      </div>
                      <span className="text-[11px] font-black text-purple-400 shrink-0 tabular-nums">{okr.avgProgress}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Quick Access */}
          <section>
            <SectionHeader icon={<TrendingUp size={13} className="text-gray-500" />} title="Quick Access" />
            <div className="grid grid-cols-2 gap-2">
              <QuickNavTile icon={<BrainCircuit size={15} />} label="Brain Dump" badge={dumpInboxCount || undefined} onClick={() => onViewChange('dump')} />
              <QuickNavTile icon={<Zap size={15} />} label="Focus Mode" onClick={() => onViewChange('focus')} />
              <QuickNavTile icon={<UserCheck size={15} />} label="Delegations" badge={delegationAlerts || undefined} onClick={() => onViewChange('delegations')} />
              <QuickNavTile icon={<Bell size={15} />} label="1:1 Briefings" badge={pendingUpdatesCount || undefined} onClick={() => onViewChange('updates')} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
