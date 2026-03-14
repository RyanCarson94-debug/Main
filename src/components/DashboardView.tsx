import { useState, useMemo, useEffect } from 'react';
import {
  Zap, Clock, CheckCircle2, AlertTriangle, BrainCircuit, Target,
  Bell, UserCheck, TrendingUp, ChevronRight, Sparkles, X, RefreshCw,
  CalendarClock, Video, FolderKanban, Telescope, Circle, Sun, ArrowRight,
  MessageSquareWarning, ShieldAlert,
} from 'lucide-react';
import type { Task, OKR, Update, Project, Meeting, QuarterlyPlan, HardConversation, Decision, Commitment } from '../types';
import { QUADRANTS, PRIORITY_CONFIG, ENERGY_CONFIG } from '../types';
import type { View } from '../types';
import { streamSituationReport, recommendNextTask } from '../services/claudeApi';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DashboardViewProps {
  tasks:              Task[];
  okrs:               OKR[];
  updates:            Update[];
  projects:           Project[];
  meetings:           Meeting[];
  quarterlyPlans:     QuarterlyPlan[];
  hardConversations:  HardConversation[];
  decisions:          Decision[];
  commitments:        Commitment[];
  dumpInboxCount:     number;
  delegationAlerts:   number;
  onViewChange:       (view: View) => void;
  onEditTask:         (task: Task) => void;
  onSelectProject:    (id: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OKR_STATUS_COLOR = (pct: number) =>
  pct >= 70 ? 'text-emerald-300' : pct >= 40 ? 'text-amber-300' : 'text-red-400';

const PROJECT_STATUS = {
  'at-risk': { label: 'At Risk',  color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  'blocked':  { label: 'Blocked', color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/20'   },
};

const QUARTER_COLORS: Record<number, string> = { 1: 'text-sky-300', 2: 'text-emerald-300', 3: 'text-amber-300', 4: 'text-violet-300' };

function formatTime(t: string | undefined): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'am' : 'pm';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, count, sub, colorClass, icon, onClick }: {
  label: string; count: number; sub?: string; colorClass: string;
  icon: React.ReactNode; onClick?: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`text-left p-4 rounded-2xl border shadow-md shadow-black/40 transition-all hover:scale-[1.02] active:scale-[0.99] group ${colorClass}`}>
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

function SectionHeader({ icon, title, count, onNavigate }: {
  icon: React.ReactNode; title: string; count?: number; onNavigate?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="text-violet-400">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-gray-300">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400">{count}</span>
        )}
      </div>
      {onNavigate && (
        <button onClick={onNavigate} className="text-[11px] text-gray-600 hover:text-violet-400 flex items-center gap-0.5 transition-colors">
          See all <ChevronRight size={11} />
        </button>
      )}
    </div>
  );
}

function DashTaskCard({ task, onClick, urgent = false }: {
  task: Task; onClick: () => void; urgent?: boolean;
}) {
  const q      = QUADRANTS[task.quadrant];
  const p      = PRIORITY_CONFIG[task.priority];
  const energy = task.energy ? ENERGY_CONFIG[task.energy] : null;
  return (
    <button onClick={onClick}
      className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all group ${
        urgent ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
               : 'bg-[#1E1C28] border-[#2A2640] hover:border-purple-500/40'
      }`}>
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

const ALERT_COLORS = {
  red:    'bg-red-500/10 border-red-500/20 text-red-400',
  amber:  'bg-amber-500/10 border-amber-500/20 text-amber-400',
  blue:   'bg-blue-500/10 border-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
};

function AlertRow({ label, color, onClick }: { label: string; color: keyof typeof ALERT_COLORS; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:opacity-90 ${ALERT_COLORS[color]}`}>
      <span>{label}</span>
      <ChevronRight size={13} className="opacity-60" />
    </button>
  );
}

function QuickNavTile({ icon, label, badge, onClick }: { icon: React.ReactNode; label: string; badge?: number; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="relative flex flex-col items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-purple-500/20 transition-all text-left">
      <span className="text-gray-500">{icon}</span>
      <span className="text-xs font-semibold text-gray-400">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">{badge}</span>
      )}
    </button>
  );
}

// ─── Weekly Rhythm Card ───────────────────────────────────────────────────────

const RHYTHM_KEY = 'adhd-rhythm-dismissed';

function WeeklyRhythmCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="relative rounded-2xl border border-[#2A2640] bg-[#1A1824] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-violet-500 to-sky-500" />
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-0.5">Your Weekly Rhythm</p>
            <p className="text-xs text-gray-500">The operating cadence that works for ADHD leaders</p>
          </div>
          <button onClick={onDismiss} className="text-gray-700 hover:text-gray-500 transition-colors ml-2 shrink-0 mt-0.5">
            <X size={13} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {[
            { day: 'Mon', action: 'Triage Brain Dump', color: 'border-violet-500/20 bg-violet-500/5 text-violet-300' },
            { day: 'Daily', action: 'Focus Mode · 1 Pomodoro', color: 'border-sky-500/20 bg-sky-500/5 text-sky-300' },
            { day: 'Daily', action: 'Check Delegations', color: 'border-amber-500/20 bg-amber-500/5 text-amber-300' },
            { day: 'Fri', action: 'Weekly Review', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' },
          ].map((item, i) => (
            <div key={i} className={`rounded-xl border px-2.5 py-2 ${item.color}`}>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">{item.day}</p>
              <p className="text-[11px] font-semibold leading-snug">{item.action}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 mb-3">
          <span className="text-xs">📄</span>
          <p className="text-[11px] text-gray-400 flex-1">
            <span className="font-semibold text-white">Personal README</span> — fill in once, share with your team so they know how to work with you.
            <span className="text-gray-600"> Find it under People in the nav.</span>
          </p>
        </div>
        <button onClick={onDismiss}
          className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
          Got it — don't show again
        </button>
      </div>
    </div>
  );
}

// ─── Focus Recommendation Card ────────────────────────────────────────────────

function FocusRecommendationCard({ task, reason, loading, onDismiss, onFocus }: {
  task?: string; reason?: string; loading: boolean;
  onDismiss: () => void; onFocus: () => void;
}) {
  if (!loading && !task) return null;
  return (
    <div className="relative rounded-2xl border overflow-hidden bg-gradient-to-r from-violet-500/10 to-sky-500/10 border-violet-500/25">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-sky-400 to-violet-500" />
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
          <Zap size={14} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-0.5">Focus on this now</p>
          {loading ? (
            <div className="flex items-center gap-2">
              <Circle size={10} className="text-violet-500 animate-pulse" />
              <p className="text-xs text-gray-500">Finding your best next task…</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-bold text-white truncate">{task}</p>
              {reason && <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{reason}</p>}
            </>
          )}
        </div>
        {!loading && task && (
          <button onClick={onFocus}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors shrink-0">
            Focus <ArrowRight size={11} />
          </button>
        )}
        <button onClick={onDismiss} className="text-gray-700 hover:text-gray-400 transition-colors shrink-0">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Start My Day Modal ────────────────────────────────────────────────────────

function StartMyDayModal({
  step, onNext, onClose, onViewChange,
  overdueTasks, dumpInboxCount, delegationAlerts,
  focusTask, focusReason,
}: {
  step: number; onNext: () => void; onClose: () => void; onViewChange: (v: View) => void;
  overdueTasks: number; dumpInboxCount: number; delegationAlerts: number;
  focusTask?: string; focusReason?: string;
}) {
  const totalAlerts = overdueTasks + dumpInboxCount + delegationAlerts;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-[#2A2640] bg-[#1A1826] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-sky-400 to-emerald-400" />

        {/* Step indicators */}
        <div className="flex gap-1 px-5 pt-4">
          {[1,2,3].map(s => (
            <div key={s} className={`h-0.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-violet-500' : 'bg-white/10'}`} />
          ))}
        </div>

        <button onClick={onClose} className="absolute top-3 right-4 text-gray-600 hover:text-gray-400 transition-colors">
          <X size={16} />
        </button>

        <div className="px-5 py-4">
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Sun size={16} className="text-amber-400" />
                <p className="text-sm font-black text-white">Morning catch-up</p>
              </div>
              {totalAlerts === 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <p className="text-sm text-emerald-300 font-medium">All clear — nothing urgent overnight.</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {overdueTasks > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                      <span className="text-sm text-red-300">{overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}</span>
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">needs action</span>
                    </div>
                  )}
                  {dumpInboxCount > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <span className="text-sm text-purple-300">{dumpInboxCount} item{dumpInboxCount > 1 ? 's' : ''} in brain dump</span>
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">to triage</span>
                    </div>
                  )}
                  {delegationAlerts > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <span className="text-sm text-amber-300">{delegationAlerts} delegation{delegationAlerts > 1 ? 's' : ''} need follow-up</span>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">overdue</span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 mb-4">You'll handle these — let's find your ONE focus first.</p>
              <button onClick={onNext}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                Pick my focus <ArrowRight size={14} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-violet-400" />
                <p className="text-sm font-black text-white">Your ONE focus today</p>
              </div>
              {focusTask ? (
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 mb-4">
                  <p className="text-sm font-bold text-white mb-1">{focusTask}</p>
                  {focusReason && <p className="text-[11px] text-gray-400">{focusReason}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 mb-4">
                  <Circle size={12} className="text-violet-500 animate-pulse" />
                  <p className="text-sm text-gray-500">Finding your best task…</p>
                </div>
              )}
              <p className="text-xs text-gray-500 mb-4">Everything else can wait. This is the one thing that moves the needle today.</p>
              <button onClick={onNext}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                Let's go <ArrowRight size={14} />
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <p className="text-sm font-black text-white">You're set</p>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                {focusTask
                  ? <>Start with <span className="text-white font-semibold">"{focusTask}"</span>. Use Focus Mode to break it down and run a Pomodoro.</>
                  : <>Open Focus Mode to pick a task, break it into steps, and start your first Pomodoro.</>
                }
              </p>
              <div className="space-y-2">
                <button onClick={() => { onViewChange('focus'); onClose(); }}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  Open Focus Mode <ArrowRight size={14} />
                </button>
                <button onClick={onClose}
                  className="w-full py-2 rounded-xl text-gray-500 hover:text-gray-300 text-sm transition-colors">
                  Go to dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Situation Report Panel ───────────────────────────────────────────────────

function SituationReportPanel({ text, loading, error, onClose }: {
  text: string; loading: boolean; error: string; onClose: () => void;
}) {
  if (!text && !loading && !error) return null;

  // Render markdown headers as styled elements
  const lines = text.split('\n');
  return (
    <div className="relative rounded-2xl border bg-[#1A1824] border-violet-500/25 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-sky-400 to-emerald-400" />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className={`text-violet-400 ${loading ? 'animate-pulse' : ''}`} />
            <span className="text-[11px] font-black text-violet-400 uppercase tracking-widest">Situation Report</span>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors"><X size={14} /></button>
        </div>
        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : loading && !text ? (
          <div className="flex items-center gap-2 py-2">
            <Circle size={12} className="text-violet-500 animate-pulse" />
            <p className="text-sm text-gray-500">Analysing your situation…</p>
          </div>
        ) : (
          <div className="text-sm text-gray-200 leading-relaxed space-y-2">
            {lines.map((line, i) => {
              if (line.startsWith('## ')) return (
                <p key={i} className="text-[11px] font-black text-violet-400 uppercase tracking-widest mt-3 first:mt-0">{line.slice(3)}</p>
              );
              if (line.startsWith('- ')) return (
                <p key={i} className="text-sm text-gray-300 pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-violet-500">{line.slice(2)}</p>
              );
              if (line.trim()) return <p key={i} className="text-sm text-white font-medium">{line}</p>;
              return null;
            })}
            {loading && <span className="inline-block w-1.5 h-3.5 bg-violet-400 animate-pulse ml-0.5" />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quarter Banner ───────────────────────────────────────────────────────────

function QuarterBanner({ plan, onClick }: { plan: QuarterlyPlan; onClick: () => void }) {
  const qColor = QUARTER_COLORS[plan.quarterNum];
  return (
    <button onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-2xl bg-[#1A1824] border border-[#2A2640] hover:border-violet-500/40 transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Telescope size={13} className="text-violet-400" />
            <span className={`font-black text-base ${qColor}`}>Q{plan.quarterNum}</span>
            <span className="text-gray-500 text-sm">{plan.year}</span>
            {plan.theme && <span className="text-gray-400 text-sm italic">— "{plan.theme}"</span>}
          </div>
          {plan.focusAreas.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {plan.focusAreas.map((f, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300">{f}</span>
              ))}
            </div>
          )}
        </div>
        <ChevronRight size={13} className="text-gray-700 group-hover:text-violet-400 transition-colors shrink-0 ml-2" />
      </div>
    </button>
  );
}

// ─── Today's Meeting Card ─────────────────────────────────────────────────────

function MeetingCard({ meeting, onClick }: { meeting: Meeting; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-3.5 py-2.5 rounded-xl bg-[#1E1C28] border border-[#2A2640] hover:border-sky-500/30 transition-all group">
      <div className="flex items-center gap-2.5">
        <Video size={12} className="text-sky-400 shrink-0" />
        <span className="flex-1 text-sm text-gray-200 truncate group-hover:text-white transition-colors">{meeting.title}</span>
        {meeting.time && <span className="text-[11px] text-sky-400 font-semibold shrink-0">{formatTime(meeting.time)}</span>}
      </div>
      {meeting.attendees.length > 0 && (
        <p className="text-[11px] text-gray-600 mt-0.5 ml-[22px] truncate">{meeting.attendees.slice(0, 4).join(', ')}</p>
      )}
    </button>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const cfg = PROJECT_STATUS[project.status as 'at-risk' | 'blocked'];
  return (
    <button onClick={onClick}
      className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all group ${cfg.bg} ${cfg.border} hover:opacity-90`}>
      <div className="flex items-center gap-2.5">
        <FolderKanban size={12} className={`${cfg.color} shrink-0`} />
        <span className={`flex-1 text-sm truncate group-hover:text-white transition-colors ${cfg.color}`}>{project.title}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border} shrink-0`}>{cfg.label}</span>
      </div>
      {project.notes && (
        <p className="text-[11px] text-gray-600 mt-0.5 ml-[22px] truncate">{project.notes}</p>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardView({
  tasks, okrs, updates, projects, meetings, quarterlyPlans, hardConversations, decisions, commitments,
  dumpInboxCount, delegationAlerts, onViewChange, onEditTask, onSelectProject,
}: DashboardViewProps) {
  const [reportText,    setReportText]    = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError,   setReportError]   = useState('');
  const [reportVisible, setReportVisible] = useState(false);

  // Focus recommendation
  const [focusRec,          setFocusRec]          = useState<{ taskId: string; task: string; reason: string } | null>(null);
  const [focusRecLoading,   setFocusRecLoading]   = useState(false);
  const [focusRecDismissed, setFocusRecDismissed] = useState(false);

  // Start My Day modal
  const [showStartMyDay, setShowStartMyDay] = useState(false);
  const [startStep,      setStartStep]      = useState(1);

  // Weekly rhythm card
  const [showRhythm, setShowRhythm] = useState(() => {
    try { return localStorage.getItem(RHYTHM_KEY) !== '1'; } catch { return true; }
  });
  const dismissRhythm = () => {
    setShowRhythm(false);
    try { localStorage.setItem(RHYTHM_KEY, '1'); } catch { /* ignore */ }
  };

  const now      = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr  = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const currentQuarterPlan = useMemo(() => {
    const month = now.getMonth();
    const year  = now.getFullYear();
    const qNum  = Math.floor(month / 3) + 1;
    const qStr  = `Q${qNum} ${year}`;
    return quarterlyPlans.find(p => p.quarter === qStr && (p.status === 'active' || p.status === 'draft')) ?? null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quarterlyPlans]);

  const {
    overdueTasks, dueTodayTasks, doNowTasks, inProgressTasks,
    doneThisWeek, pendingUpdatesCount, totalAlerts, okrSnapshot,
    todayMeetings, atRiskProjects,
  } = useMemo(() => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const overdueSet   = new Set<string>();
    const dueTodaySet  = new Set<string>();
    const overdueArr:   Task[] = [];
    const dueTodayArr:  Task[] = [];
    const doNowArr:     Task[] = [];
    const inProgressArr: Task[] = [];
    let doneCount = 0;

    for (const t of tasks) {
      if (t.column === 'done') {
        if (t.completedAt && new Date(t.completedAt) >= weekStart) doneCount++;
        continue;
      }
      if (t.column === 'in-progress') inProgressArr.push(t);
      if (t.dueDate && t.dueDate < todayStr) { overdueArr.push(t); overdueSet.add(t.id); }
      else if (t.dueDate === todayStr) { dueTodayArr.push(t); dueTodaySet.add(t.id); }
      if (t.quadrant === 'do-now' && !overdueSet.has(t.id) && !dueTodaySet.has(t.id)) doNowArr.push(t);
    }

    const pendingCount = updates.reduce(
      (sum, u) => sum + (u.recipientIds.some(id => !u.discussedWith.includes(id)) ? 1 : 0), 0,
    );

    const snapshot = okrs.slice(0, 3).map(okr => ({
      ...okr,
      avgProgress: okr.keyResults.length > 0
        ? Math.round(okr.keyResults.reduce((s, kr) => s + kr.progress, 0) / okr.keyResults.length)
        : 0,
    }));

    const todayMtgs   = meetings.filter(m => m.date === todayStr && m.status === 'upcoming')
      .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    const atRisk = projects.filter(p => p.status === 'at-risk' || p.status === 'blocked');

    return {
      overdueTasks: overdueArr,
      dueTodayTasks: dueTodayArr,
      doNowTasks: doNowArr,
      inProgressTasks: inProgressArr,
      doneThisWeek: doneCount,
      pendingUpdatesCount: pendingCount,
      totalAlerts: delegationAlerts + pendingCount + dumpInboxCount + overdueArr.length,
      okrSnapshot: snapshot,
      todayMeetings: todayMtgs,
      atRiskProjects: atRisk,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, updates, okrs, projects, meetings, delegationAlerts, dumpInboxCount, todayStr]);

  // Auto-load focus recommendation on mount
  useEffect(() => {
    const activeTasks = tasks.filter(t => t.column !== 'done');
    if (activeTasks.length === 0) return;
    setFocusRecLoading(true);
    recommendNextTask(
      activeTasks,
      rec => { setFocusRec(rec); setFocusRecLoading(false); },
      ()  => { setFocusRecLoading(false); },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leadership pulse: hard conversations needing action
  const { overdueConvos, readyConvos, overdueCommitmentsCount } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const overdueC  = hardConversations.filter(c =>
      (c.status === 'planning' || c.status === 'ready') && c.targetDate && c.targetDate < today
    );
    const readyC = hardConversations.filter(c => c.status === 'ready' && (!c.targetDate || c.targetDate >= today));
    const overdueCommit = commitments.filter(c => !c.done && c.dueDate && c.dueDate < today).length;
    return { overdueConvos: overdueC, readyConvos: readyC, overdueCommitmentsCount: overdueCommit };
  }, [hardConversations, commitments]);

  const handleGetBriefed = async () => {
    setReportVisible(true);
    setReportLoading(true);
    setReportText('');
    setReportError('');
    await streamSituationReport(
      {
        quarterlyPlan:    currentQuarterPlan,
        okrs,
        projects,
        tasks,
        decisions,
        hardConversations,
      },
      chunk => setReportText(prev => prev + chunk),
      ()    => setReportLoading(false),
      err   => { setReportError(err); setReportLoading(false); },
    );
  };

  const handleProjectClick = (p: Project) => {
    onSelectProject(p.id);
    onViewChange('projects');
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
            <button onClick={() => onViewChange('kanban')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">{doneThisWeek} done this week</span>
            </button>
          )}
          {hour < 12 && (
            <button
              onClick={() => { setStartStep(1); setShowStartMyDay(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 text-amber-400 text-xs font-bold transition-colors animate-pulse"
            >
              <Sun size={13} />
              Start my day
            </button>
          )}
          <button
            onClick={reportVisible ? () => setReportVisible(false) : handleGetBriefed}
            disabled={reportLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/15 text-violet-400 text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Sparkles size={13} className={reportLoading ? 'animate-pulse' : ''} />
            {reportLoading ? 'Analysing…' : reportVisible ? 'Hide brief' : 'Get briefed'}
          </button>
        </div>
      </div>

      {/* ── Quarter Banner ── */}
      {currentQuarterPlan && (
        <QuarterBanner plan={currentQuarterPlan} onClick={() => onViewChange('quarterly-planning')} />
      )}

      {/* ── Focus Recommendation ── */}
      {!focusRecDismissed && (focusRecLoading || focusRec) && (
        <FocusRecommendationCard
          task={focusRec?.task}
          reason={focusRec?.reason}
          loading={focusRecLoading}
          onDismiss={() => setFocusRecDismissed(true)}
          onFocus={() => onViewChange('focus')}
        />
      )}

      {/* ── Situation Report ── */}
      {reportVisible && (
        <SituationReportPanel
          text={reportText}
          loading={reportLoading}
          error={reportError}
          onClose={() => { setReportVisible(false); setReportText(''); setReportError(''); }}
        />
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Overdue"      count={overdueTasks.length}
          sub={overdueTasks.length === 0 ? 'all clear' : 'need attention'}
          colorClass={overdueTasks.length > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/[0.03] border-white/5 text-gray-500'}
          icon={<CalendarClock size={16} />} onClick={() => onViewChange('kanban')} />
        <StatCard label="Do Now"       count={doNowTasks.length + overdueTasks.length + dueTodayTasks.length}
          sub="urgent tasks"
          colorClass="bg-amber-500/10 border-amber-500/20 text-amber-400"
          icon={<Zap size={16} />} onClick={() => onViewChange('eisenhower')} />
        <StatCard label="Done This Week" count={doneThisWeek}
          sub={doneThisWeek === 0 ? "let's go" : 'great work'}
          colorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          icon={<CheckCircle2 size={16} />} />
        <StatCard label="Projects at Risk" count={atRiskProjects.length}
          sub={atRiskProjects.length === 0 ? 'all healthy' : 'need attention'}
          colorClass={atRiskProjects.length > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-white/[0.03] border-white/5 text-gray-500'}
          icon={<FolderKanban size={16} />} onClick={() => onViewChange('projects')} />
      </div>

      {/* ── Weekly Rhythm Card (first-run onboarding) ── */}
      {showRhythm && <WeeklyRhythmCard onDismiss={dismissRhythm} />}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: tasks + meetings */}
        <div className="lg:col-span-3 space-y-5">

          {/* Today's Meetings */}
          {todayMeetings.length > 0 && (
            <section>
              <SectionHeader icon={<Video size={13} className="text-sky-400" />} title="Today's Meetings" count={todayMeetings.length} onNavigate={() => onViewChange('meetings')} />
              <div className="space-y-1.5">
                {todayMeetings.map(m => <MeetingCard key={m.id} meeting={m} onClick={() => onViewChange('meetings')} />)}
              </div>
            </section>
          )}

          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <section>
              <SectionHeader icon={<CalendarClock size={13} className="text-red-400" />} title="Overdue" count={overdueTasks.length} onNavigate={() => onViewChange('kanban')} />
              <div className="space-y-1.5">
                {overdueTasks.slice(0, 4).map(task => <DashTaskCard key={task.id} task={task} onClick={() => onEditTask(task)} urgent />)}
              </div>
            </section>
          )}

          {/* Due Today */}
          {dueTodayTasks.length > 0 && (
            <section>
              <SectionHeader icon={<Clock size={13} className="text-amber-400" />} title="Due Today" count={dueTodayTasks.length} />
              <div className="space-y-1.5">
                {dueTodayTasks.map(task => <DashTaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />)}
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
                {doNowTasks.slice(0, 4).map(task => <DashTaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />)}
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
                {inProgressTasks.slice(0, 4).map(task => <DashTaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />)}
              </div>
            )}
          </section>
        </div>

        {/* Right: alerts + OKRs + projects + quick nav */}
        <div className="lg:col-span-2 space-y-5">

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
                  <button key={okr.id} onClick={() => onViewChange('okrs')}
                    className="w-full text-left p-3 rounded-xl bg-[#1E1C28] border border-[#2A2640] hover:border-white/10 transition-all">
                    <p className="text-xs font-semibold text-gray-300 truncate mb-2">{okr.objective}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all" style={{ width: `${okr.avgProgress}%` }} />
                      </div>
                      <span className={`text-[11px] font-black shrink-0 tabular-nums ${OKR_STATUS_COLOR(okr.avgProgress)}`}>{okr.avgProgress}%</span>
                    </div>
                  </button>
                ))}
                <p className="text-[10px] text-gray-700 px-1 pt-0.5">
                  Live data ·{' '}
                  <button onClick={() => onViewChange('okrs')} className="text-gray-600 hover:text-gray-400 underline transition-colors">
                    update progress in OKRs
                  </button>
                </p>
              </div>
            </section>
          )}

          {/* Projects at Risk / Blocked */}
          {atRiskProjects.length > 0 && (
            <section>
              <SectionHeader icon={<FolderKanban size={13} className="text-amber-400" />} title="Projects Needing Attention" onNavigate={() => onViewChange('projects')} />
              <div className="space-y-1.5">
                {atRiskProjects.slice(0, 4).map(p => <ProjectCard key={p.id} project={p} onClick={() => handleProjectClick(p)} />)}
              </div>
            </section>
          )}

          {/* Leadership Pulse */}
          {(overdueConvos.length > 0 || readyConvos.length > 0 || overdueCommitmentsCount > 0) && (
            <section>
              <SectionHeader icon={<ShieldAlert size={13} className="text-rose-400" />} title="Leadership Pulse" />
              <div className="space-y-1.5">
                {overdueCommitmentsCount > 0 && (
                  <AlertRow
                    label={`${overdueCommitmentsCount} overdue commitment${overdueCommitmentsCount > 1 ? 's' : ''}`}
                    color="red"
                    onClick={() => onViewChange('decision-log')}
                  />
                )}
                {overdueConvos.length > 0 && (
                  <AlertRow
                    label={`${overdueConvos.length} hard convo${overdueConvos.length > 1 ? 's' : ''} past target date`}
                    color="amber"
                    onClick={() => onViewChange('hard-conversations')}
                  />
                )}
                {readyConvos.length > 0 && (
                  <button onClick={() => onViewChange('hard-conversations')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:opacity-90 bg-blue-500/10 border-blue-500/20 text-blue-400">
                    <div className="flex items-center gap-2">
                      <MessageSquareWarning size={12} />
                      <span>{readyConvos.length} conversation{readyConvos.length > 1 ? 's' : ''} ready to have</span>
                    </div>
                    <ChevronRight size={13} className="opacity-60" />
                  </button>
                )}
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

      {/* ── Start My Day Modal ── */}
      {showStartMyDay && (
        <StartMyDayModal
          step={startStep}
          onNext={() => setStartStep(s => s + 1)}
          onClose={() => { setShowStartMyDay(false); setStartStep(1); }}
          onViewChange={onViewChange}
          overdueTasks={overdueTasks.length}
          dumpInboxCount={dumpInboxCount}
          delegationAlerts={delegationAlerts}
          focusTask={focusRec?.task}
          focusReason={focusRec?.reason}
        />
      )}
    </div>
  );
}
