import { useState, useMemo, useEffect } from 'react';
import {
  Zap, Clock, CheckCircle2, AlertTriangle, BrainCircuit, Target,
  Bell, UserCheck, TrendingUp, ChevronRight, Sparkles, X, RefreshCw,
  CalendarClock, Video, FolderKanban, Telescope, Circle, Sun, ArrowRight,
  MessageSquareWarning, ShieldAlert, Battery, Sunset,
  ClipboardList, User, Pencil,
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

// ─── Quick-win detection ──────────────────────────────────────────────────────

const QUICK_WIN_KEYWORDS = ['quick', 'short', 'small', 'simple', 'easy', 'approve', 'sign'];
function isQuickWin(task: Task): boolean {
  if (task.energy === 'quick-win') return true;
  const haystack = [...task.tags, task.title, task.description ?? ''].join(' ').toLowerCase();
  return QUICK_WIN_KEYWORDS.some(kw => haystack.includes(kw));
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

function NeedsAttentionSection({ overdueTasks, delegationAlerts, pendingUpdatesCount, dumpInboxCount, onViewChange }: {
  overdueTasks: Task[];
  delegationAlerts: number;
  pendingUpdatesCount: number;
  dumpInboxCount: number;
  onViewChange: (v: View) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const alerts: { label: string; color: keyof typeof ALERT_COLORS; onClick: () => void }[] = [];
  if (overdueTasks.length > 0) alerts.push({
    label: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} waiting on you`,
    color: 'red', onClick: () => onViewChange('kanban'),
  });
  if (delegationAlerts > 0) alerts.push({
    label: `${delegationAlerts} loop${delegationAlerts > 1 ? 's' : ''} ready to close`,
    color: 'amber', onClick: () => onViewChange('delegations'),
  });
  if (pendingUpdatesCount > 0) alerts.push({
    label: `${pendingUpdatesCount} person${pendingUpdatesCount > 1 ? 's' : ''} waiting for a briefing`,
    color: 'blue', onClick: () => onViewChange('updates'),
  });
  if (dumpInboxCount > 0) alerts.push({
    label: `${dumpInboxCount} thought${dumpInboxCount > 1 ? 's' : ''} captured, ready to triage`,
    color: 'purple', onClick: () => onViewChange('dump'),
  });

  if (alerts.length === 0) return null;

  const visible = expanded ? alerts : alerts.slice(0, 1);
  const hidden  = alerts.length - 1;

  return (
    <section>
      <SectionHeader icon={<AlertTriangle size={13} className="text-amber-400" />} title="Here to tackle" />
      <p className="text-[11px] text-gray-600 mb-2 px-0.5">Pick one and start.</p>
      <div className="space-y-1.5">
        {visible.map((a, i) => <AlertRow key={i} label={a.label} color={a.color} onClick={a.onClick} />)}
        {!expanded && hidden > 0 && (
          <button onClick={() => setExpanded(true)}
            className="w-full text-center text-xs text-gray-600 hover:text-amber-400 py-1.5 transition-colors">
            +{hidden} more thing{hidden > 1 ? 's' : ''} →
          </button>
        )}
        {expanded && hidden > 0 && (
          <button onClick={() => setExpanded(false)}
            className="w-full text-center text-xs text-gray-600 hover:text-gray-400 py-1.5 transition-colors">
            Show less
          </button>
        )}
      </div>
    </section>
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

// ─── Daily Energy Check-in ────────────────────────────────────────────────────

const ENERGY_KEY = 'adhd-energy-';
type EnergyLevel = 'charged' | 'getting-by' | 'low';

function getDailyEnergy(): EnergyLevel | null {
  try {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(ENERGY_KEY + today);
    return (stored as EnergyLevel) ?? null;
  } catch { return null; }
}

function saveDailyEnergy(level: EnergyLevel) {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(ENERGY_KEY + today, level);
  } catch { /* ignore */ }
}

const ENERGY_OPTIONS: { level: EnergyLevel; emoji: string; label: string; sub: string; color: string; bg: string; border: string }[] = [
  { level: 'charged',    emoji: '🔋', label: 'Charged',     sub: 'Full capacity today',    color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { level: 'getting-by', emoji: '😐', label: 'Getting by',  sub: 'Managing, not thriving', color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30'   },
  { level: 'low',        emoji: '🪫', label: 'Low energy',  sub: 'Minimal mode today',     color: 'text-gray-400',    bg: 'bg-gray-500/10',    border: 'border-gray-500/20'    },
];

function EnergyCheckIn({ onSelect }: { onSelect: (level: EnergyLevel) => void }) {
  return (
    <div className="rounded-2xl border border-[#2A2640] bg-[#1A1824] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-gray-500" />
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-1">
          <Battery size={14} className="text-violet-400" />
          <p className="text-xs font-black text-white uppercase tracking-widest">How are you showing up today?</p>
        </div>
        <p className="text-[11px] text-gray-600 mb-3">Your answer shapes what the dashboard surfaces for you.</p>
        <div className="grid grid-cols-3 gap-2">
          {ENERGY_OPTIONS.map(opt => (
            <button key={opt.level} onClick={() => onSelect(opt.level)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:scale-[1.03] ${opt.bg} ${opt.border}`}>
              <span className="text-xl">{opt.emoji}</span>
              <span className={`text-xs font-bold ${opt.color}`}>{opt.label}</span>
              <span className="text-[10px] text-gray-600 text-center leading-snug">{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EnergyBadge({ level, onClick }: { level: EnergyLevel; onClick: () => void }) {
  const opt = ENERGY_OPTIONS.find(o => o.level === level)!;
  return (
    <button onClick={onClick} title="Update your energy"
      className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors ${opt.bg} ${opt.border} ${opt.color}`}>
      <span>{opt.emoji}</span>
      <span className="hidden sm:inline">{opt.label}</span>
      <Pencil size={10} className="opacity-0 group-hover:opacity-70 transition-opacity" />
    </button>
  );
}

// ─── Daily Brief (3-card) ─────────────────────────────────────────────────────

function DailyBrief({ criticalTask, whoNeedsYou, openCommitment, energyLevel, onViewChange, onEditTask }: {
  criticalTask?: Task;
  whoNeedsYou?: string;
  openCommitment?: Commitment;
  energyLevel: EnergyLevel | null;
  onViewChange: (v: View) => void;
  onEditTask: (t: Task) => void;
}) {
  const isLow = energyLevel === 'low';
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={13} className="text-violet-400" />
          <p className="text-[11px] font-black text-violet-400 uppercase tracking-widest">
            {isLow ? 'One Thing Today' : 'Your Daily Brief'}
          </p>
          {!isLow && <p className="text-[10px] text-gray-600">— three things that matter today</p>}
          {isLow && <p className="text-[10px] text-gray-500">— low energy mode, just one focus</p>}
        </div>
        <div className={`grid grid-cols-1 ${isLow ? '' : 'sm:grid-cols-3'} gap-2`}>
          {/* Card 1: ONE task */}
          <button onClick={() => criticalTask ? onEditTask(criticalTask) : onViewChange('eisenhower')}
            className="text-left p-3 rounded-xl bg-[#1E1C28] border border-[#2A2640] hover:border-violet-500/40 transition-all group">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap size={11} className="text-amber-400" />
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Move this</span>
            </div>
            <p className="text-xs font-semibold text-white leading-snug group-hover:text-violet-200 transition-colors line-clamp-2">
              {criticalTask?.title ?? 'No urgent tasks — you\'re clear'}
            </p>
            {criticalTask && (
              <span className={`text-[10px] font-bold mt-1 inline-block ${PRIORITY_CONFIG[criticalTask.priority].color}`}>
                {PRIORITY_CONFIG[criticalTask.priority].label}
              </span>
            )}
          </button>

          {/* Card 2: Who needs you */}
          {!isLow && (
            <button onClick={() => onViewChange('updates')}
              className="text-left p-3 rounded-xl bg-[#1E1C28] border border-[#2A2640] hover:border-sky-500/40 transition-all group">
              <div className="flex items-center gap-1.5 mb-1.5">
                <User size={11} className="text-sky-400" />
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Who needs you</span>
              </div>
              <p className="text-xs font-semibold text-white leading-snug group-hover:text-sky-200 transition-colors line-clamp-2">
                {whoNeedsYou ?? 'No pending briefings'}
              </p>
            </button>
          )}

          {/* Card 3: Open commitment */}
          {!isLow && (
            <button onClick={() => onViewChange('decision-log')}
              className="text-left p-3 rounded-xl bg-[#1E1C28] border border-[#2A2640] hover:border-rose-500/40 transition-all group">
              <div className="flex items-center gap-1.5 mb-1.5">
                <ClipboardList size={11} className="text-rose-400" />
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">You promised</span>
              </div>
              <p className="text-xs font-semibold text-white leading-snug group-hover:text-rose-200 transition-colors line-clamp-2">
                {openCommitment
                  ? `"${openCommitment.what}"${openCommitment.to ? ` → ${openCommitment.to}` : ''}`
                  : 'No open commitments'}
              </p>
              {openCommitment?.dueDate && (
                <span className="text-[10px] text-gray-600 mt-1 inline-block">
                  due {new Date(openCommitment.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── End-of-Day Capture ───────────────────────────────────────────────────────

const EOD_KEY = 'adhd-eod-';

function getEodSubText(): string {
  const day = new Date().getDay(); // 0=Sun, 1=Mon … 6=Sat
  const nextNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Monday', 'Monday'];
  return `60 seconds. Prevents ${nextNames[day]} morning ambush.`;
}

function EndOfDayModal({ onClose, onDone }: { onClose: () => void; onDone?: () => void }) {
  const [carryForward, setCarryForward] = useState('');
  const [win, setWin] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(EOD_KEY + today, JSON.stringify({ carryForward, win, savedAt: new Date().toISOString() }));
    } catch { /* ignore */ }
    setSaved(true);
    onDone?.();
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-[#2A2640] bg-[#1A1826] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-rose-400 to-violet-500" />
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-600 hover:text-gray-400 transition-colors">
          <X size={16} />
        </button>
        <div className="px-5 py-4">
          {saved ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={32} className="text-emerald-400" />
              <p className="text-sm font-bold text-white">Parked for tomorrow</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Sunset size={16} className="text-amber-400" />
                <p className="text-sm font-black text-white">End of day — park it</p>
              </div>
              <p className="text-xs text-gray-500 mb-4">{getEodSubText()}</p>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                    One win today
                  </label>
                  <input
                    value={win}
                    onChange={e => setWin(e.target.value)}
                    placeholder="Something that moved forward, however small…"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1E1C28] border border-[#2A2640] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                    Carry forward to tomorrow
                  </label>
                  <textarea
                    value={carryForward}
                    onChange={e => setCarryForward(e.target.value)}
                    placeholder="What didn't get done that needs to move first thing tomorrow?"
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1E1C28] border border-[#2A2640] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors">
                  Park it for tomorrow
                </button>
                <button onClick={onClose}
                  className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors">
                  Skip
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding Modal ─────────────────────────────────────────────────────────

const ONBOARDING_KEY = 'adhd-onboarding-done';

type LeaderRole = 'ic' | 'lead' | 'senior';

const ROLE_OPTIONS: { role: LeaderRole; emoji: string; label: string; sub: string; views: string[] }[] = [
  {
    role: 'ic',
    emoji: '🎯',
    label: 'Individual Contributor',
    sub: 'Focus, tasks, getting things done',
    views: ['Focus Mode', 'Brain Dump', 'Eisenhower Matrix', 'Day Planner'],
  },
  {
    role: 'lead',
    emoji: '👥',
    label: 'Team Lead',
    sub: 'Managing people + doing the work',
    views: ['Dashboard', 'Delegations', '1:1 Notes', 'Hard Conversations'],
  },
  {
    role: 'senior',
    emoji: '🏛️',
    label: 'Senior Leader',
    sub: 'Strategy, stakeholders, leadership OS',
    views: ['Dashboard', 'Brain Dump', 'People Dashboard', 'Decision Log'],
  },
];

function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [selectedRole, setSelectedRole] = useState<LeaderRole | null>(null);
  const [step, setStep] = useState<'role' | 'tips'>('role');
  const [showSkipPicker, setShowSkipPicker] = useState(false);

  const chosen = ROLE_OPTIONS.find(o => o.role === selectedRole);

  const handleSelect = (role: LeaderRole) => {
    try { localStorage.setItem('adhd-onboarding-role', role); } catch { /* ignore */ }
    setSelectedRole(role);
    setStep('tips');
  };

  const handleDone = () => {
    try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* ignore */ }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleDone}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-[#2A2640] bg-[#1A1826] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-sky-400 to-emerald-400" />
        <button onClick={handleDone} className="absolute top-3 right-4 text-gray-600 hover:text-gray-400 transition-colors">
          <X size={16} />
        </button>
        <div className="px-5 py-5">
          {step === 'role' ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={15} className="text-violet-400" />
                <p className="text-sm font-black text-white">Welcome — what describes you?</p>
              </div>
              <p className="text-xs text-gray-500 mb-4">We'll surface the most relevant features first.</p>
              <div className="space-y-2">
                {ROLE_OPTIONS.map(opt => (
                  <button key={opt.role} onClick={() => handleSelect(opt.role)}
                    className="w-full text-left p-3.5 rounded-xl bg-[#1E1C28] border border-[#2A2640] hover:border-violet-500/40 transition-all group">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{opt.emoji}</span>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-violet-200 transition-colors">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.sub}</p>
                      </div>
                      <ChevronRight size={14} className="ml-auto text-gray-700 group-hover:text-violet-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
              {showSkipPicker ? (
                <div className="mt-3 p-3 rounded-xl bg-[#1E1C28] border border-[#2A2640]">
                  <p className="text-xs font-semibold text-gray-400 mb-2">Before you go — which best describes you?</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {ROLE_OPTIONS.map(opt => (
                      <button key={opt.role} onClick={() => handleSelect(opt.role)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252336] border border-[#2A2640] hover:border-violet-500/40 text-xs font-semibold text-gray-300 hover:text-violet-300 transition-all">
                        <span>{opt.emoji}</span> {opt.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleDone} className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
                    No thanks, skip completely
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowSkipPicker(true)} className="w-full mt-3 py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors">
                  Skip — I'll explore on my own
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{chosen?.emoji}</span>
                <p className="text-sm font-black text-white">Your starting toolkit</p>
              </div>
              <p className="text-xs text-gray-500 mb-4">These four features will give you 80% of the value. Everything else is there when you need it.</p>
              <div className="space-y-2 mb-4">
                {chosen?.views.map((v, i) => (
                  <div key={v} className="flex items-center gap-3 p-3 rounded-xl bg-[#1E1C28] border border-[#2A2640]">
                    <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-sm font-semibold text-white">{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-600 mb-3">All 25+ features are in the sidebar whenever you're ready for them.</p>
              <button onClick={handleDone}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                Let's go <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
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

  // Energy check-in
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(() => getDailyEnergy());
  const handleEnergySelect = (level: EnergyLevel) => {
    saveDailyEnergy(level);
    setEnergyLevel(level);
    // Clear override when energy is explicitly changed
    setEnergyOverride(false);
    try { sessionStorage.removeItem('adhd-energy-override'); } catch { /* ignore */ }
  };

  // Low-energy task override — persisted to sessionStorage so it survives navigation
  const [energyOverride, setEnergyOverride] = useState(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      return sessionStorage.getItem('adhd-energy-override') === today;
    } catch { return false; }
  });
  const applyEnergyOverride = () => {
    setEnergyOverride(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      sessionStorage.setItem('adhd-energy-override', today);
    } catch { /* ignore */ }
  };

  // Carry-forward from yesterday's EOD — dismissed state in sessionStorage (resets each day)
  const carryForward = useMemo(() => {
    try {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const raw = localStorage.getItem(EOD_KEY + yesterday);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { carryForward?: string };
      return parsed.carryForward?.trim() || null;
    } catch { return null; }
  }, []);
  const [carryForwardDismissed, setCarryForwardDismissed] = useState(() => {
    try { return sessionStorage.getItem('adhd-cf-dismissed') === '1'; } catch { return false; }
  });
  const dismissCarryForward = () => {
    setCarryForwardDismissed(true);
    try { sessionStorage.setItem('adhd-cf-dismissed', '1'); } catch { /* ignore */ }
  };

  // Streak (for milestone reinforcement — show once per milestone)
  const streakCount = useMemo(() => {
    try { return parseInt(localStorage.getItem('adhd-streak-count') ?? '0', 10); } catch { return 0; }
  }, []);
  const isMilestone = streakCount === 3 || (streakCount >= 7 && streakCount % 7 === 0);
  const [streakMilestoneDismissed, setStreakMilestoneDismissed] = useState(() => {
    if (!isMilestone) return true;
    try { return localStorage.getItem(`adhd-streak-seen-${streakCount}`) === '1'; } catch { return false; }
  });
  const streakMilestone = isMilestone && !streakMilestoneDismissed;
  const dismissStreakMilestone = () => {
    setStreakMilestoneDismissed(true);
    try { localStorage.setItem(`adhd-streak-seen-${streakCount}`, '1'); } catch { /* ignore */ }
  };

  // EOD done today (hide "Park today" button after completion)
  const [eodDoneToday, setEodDoneToday] = useState(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      return !!localStorage.getItem(EOD_KEY + today);
    } catch { return false; }
  });

  // Mid-day energy nudge: after 3pm if still charged
  const [midDayNudgeDismissed, setMidDayNudgeDismissed] = useState(() => {
    try { return sessionStorage.getItem('adhd-midday-dismissed') === '1'; } catch { return false; }
  });
  const dismissMidDayNudge = () => {
    setMidDayNudgeDismissed(true);
    try { sessionStorage.setItem('adhd-midday-dismissed', '1'); } catch { /* ignore */ }
  };

  // End-of-day capture
  const [showEOD, setShowEOD] = useState(() => {
    const h = new Date().getHours();
    if (h < 16) return false; // only prompt after 4pm
    try {
      const today = new Date().toISOString().split('T')[0];
      return !localStorage.getItem(EOD_KEY + today);
    } catch { return false; }
  });

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return localStorage.getItem(ONBOARDING_KEY) !== '1'; } catch { return false; }
  });

  const now      = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const showMidDayNudge = hour >= 15 && energyLevel === 'charged' && !midDayNudgeDismissed;
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

  // Daily Brief data
  const dailyBrief = useMemo(() => {
    const criticalTask = tasks
      .filter(t => t.column !== 'done')
      .sort((a, b) => {
        const pa = { critical: 0, high: 1, medium: 2, low: 3 }[a.priority] ?? 3;
        const pb = { critical: 0, high: 1, medium: 2, low: 3 }[b.priority] ?? 3;
        if (pa !== pb) return pa - pb;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      })[0];

    const personWithPendingUpdate = updates
      .map(u => ({
        u,
        pending: u.recipientIds.some(id => !u.discussedWith.includes(id)),
      }))
      .find(x => x.pending);
    const whoNeedsYou = personWithPendingUpdate
      ? `Update pending — ${personWithPendingUpdate.u.recipientIds.length} recipient${personWithPendingUpdate.u.recipientIds.length > 1 ? 's' : ''} not yet briefed`
      : undefined;

    const openCommitment = commitments
      .filter(c => !c.done)
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      })[0];

    return { criticalTask, whoNeedsYou, openCommitment };
  }, [tasks, updates, commitments]);

  // On low energy, prefer the most-actionable quick-win task for the brief
  const lowEnergyBriefTask = useMemo(() => {
    const active = tasks.filter(t => t.column !== 'done');
    const quickWins = active.filter(isQuickWin);
    const pool = quickWins.length > 0 ? quickWins : active;
    const PRIO: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return pool.sort((a, b) => (PRIO[a.priority] ?? 3) - (PRIO[b.priority] ?? 3))[0] ?? undefined;
  }, [tasks]);

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
          {/* End-of-day button (4pm+) */}
          {hour >= 16 && !eodDoneToday && (
            <button onClick={() => setShowEOD(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 text-amber-400 text-xs font-bold transition-colors">
              <Sunset size={13} />
              Park today
            </button>
          )}
          {hour >= 16 && eodDoneToday && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 size={13} />
              Parked
            </span>
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
          {/* Energy badge (tap to reset) */}
          {energyLevel && (
            <EnergyBadge level={energyLevel} onClick={() => setEnergyLevel(null)} />
          )}
          {energyLevel !== 'low' && (
            <button
              onClick={reportVisible ? () => setReportVisible(false) : handleGetBriefed}
              disabled={reportLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/15 text-violet-400 text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Sparkles size={13} className={reportLoading ? 'animate-pulse' : ''} />
              {reportLoading ? 'Analysing…' : reportVisible ? 'Hide brief' : 'Get briefed'}
            </button>
          )}
        </div>
      </div>

      {/* ── Streak milestone (shown once per milestone, then dismissible) ── */}
      {streakMilestone && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-base">🔥</span>
          <p className="text-xs font-bold text-amber-300 flex-1">
            {streakCount} day{streakCount !== 1 ? 's' : ''} in a row — that's real momentum. Keep it going.
          </p>
          <button onClick={dismissStreakMilestone} className="text-amber-600 hover:text-amber-400 transition-colors shrink-0">
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Mid-day energy nudge (after 3pm if still charged) ── */}
      {showMidDayNudge && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-500/5 border border-amber-500/15">
          <span className="text-base">🌤️</span>
          <p className="text-xs text-amber-300/80 flex-1">
            Afternoon check-in — still running charged? Tap your energy to update if things have shifted.
          </p>
          <button onClick={dismissMidDayNudge} className="text-gray-700 hover:text-gray-400 transition-colors shrink-0">
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Quarter Banner ── */}
      {currentQuarterPlan && (
        <QuarterBanner plan={currentQuarterPlan} onClick={() => onViewChange('quarterly-planning')} />
      )}

      {/* ── Energy Check-in (inline banner — non-blocking) ── */}
      {!energyLevel && (
        <div className="relative">
          <EnergyCheckIn onSelect={handleEnergySelect} />
        </div>
      )}

      {/* ── Carry-forward from yesterday ── */}
      {carryForward && !carryForwardDismissed && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
          <ArrowRight size={14} className="text-sky-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-0.5">Brought forward from yesterday</p>
            <p className="text-xs text-sky-200 leading-relaxed">{carryForward}</p>
          </div>
          <button onClick={dismissCarryForward} className="text-gray-700 hover:text-gray-400 transition-colors shrink-0">
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Daily Brief (always visible) ── */}
      <DailyBrief
        criticalTask={energyLevel === 'low' ? lowEnergyBriefTask : dailyBrief.criticalTask}
        whoNeedsYou={dailyBrief.whoNeedsYou}
        openCommitment={dailyBrief.openCommitment}
        energyLevel={energyLevel}
        onViewChange={onViewChange}
        onEditTask={onEditTask}
      />

      {/* ── Focus Recommendation (hidden when low/getting-by energy) ── */}
      {!focusRecDismissed && energyLevel === 'charged' && (focusRecLoading || focusRec) && (
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

      {/* ── Stats (adapt count to energy level) ── */}
      {energyLevel !== 'low' && (
        <div className={`grid gap-3 ${energyLevel === 'getting-by' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
          <StatCard label="Do Now" count={doNowTasks.length + overdueTasks.length + dueTodayTasks.length}
            sub="urgent tasks"
            colorClass="bg-amber-500/10 border-amber-500/20 text-amber-400"
            icon={<Zap size={16} />} onClick={() => onViewChange('eisenhower')} />
          <StatCard label="Done This Week" count={doneThisWeek}
            sub={doneThisWeek === 0 ? "let's go" : 'great work'}
            colorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            icon={<CheckCircle2 size={16} />} />
          {energyLevel !== 'getting-by' && (
            <>
              <StatCard label="Overdue" count={overdueTasks.length}
                sub={overdueTasks.length === 0 ? 'all clear' : 'tackle one at a time'}
                colorClass={overdueTasks.length > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/[0.03] border-white/5 text-gray-500'}
                icon={<CalendarClock size={16} />} onClick={() => onViewChange('kanban')} />
              <StatCard label="Projects at Risk" count={atRiskProjects.length}
                sub={atRiskProjects.length === 0 ? 'all healthy' : 'need attention'}
                colorClass={atRiskProjects.length > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-white/[0.03] border-white/5 text-gray-500'}
                icon={<FolderKanban size={16} />} onClick={() => onViewChange('projects')} />
            </>
          )}
        </div>
      )}

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

          {/* Low-energy minimal mode banner */}
          {energyLevel === 'low' && !energyOverride && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-500/10 border border-gray-500/20">
              <div className="flex items-center gap-2">
                <span className="text-base">🪫</span>
                <p className="text-xs font-bold text-gray-400">Minimal mode — showing quick wins only</p>
              </div>
              <button onClick={applyEnergyOverride}
                className="text-[11px] text-gray-600 hover:text-gray-300 transition-colors underline">
                Show all
              </button>
            </div>
          )}

          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <section>
              <SectionHeader icon={<CalendarClock size={13} className="text-red-400" />} title="Overdue" count={overdueTasks.length} onNavigate={() => onViewChange('kanban')} />
              <div className="space-y-1.5">
                {(energyLevel === 'low' && !energyOverride ? overdueTasks.filter(isQuickWin) : overdueTasks)
                  .slice(0, 4).map(task => <DashTaskCard key={task.id} task={task} onClick={() => onEditTask(task)} urgent />)}
                {energyLevel === 'low' && !energyOverride && overdueTasks.filter(isQuickWin).length === 0 && (
                  <p className="text-xs text-gray-600 px-1 italic">No quick wins in overdue — <button onClick={applyEnergyOverride} className="underline hover:text-gray-400">show all</button></p>
                )}
              </div>
            </section>
          )}

          {/* Due Today (hide on low energy unless override) */}
          {dueTodayTasks.length > 0 && energyLevel !== 'low' && (
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
            ) : (() => {
              const visible = (energyLevel === 'low' && !energyOverride ? doNowTasks.filter(isQuickWin) : doNowTasks).slice(0, 4);
              return visible.length === 0 && energyLevel === 'low' && !energyOverride ? (
                <div className="px-4 py-3 rounded-xl bg-gray-500/5 border border-gray-500/15">
                  <p className="text-xs text-gray-500">No quick wins in this list.</p>
                  <p className="text-[11px] text-gray-600 mt-1">
                    <button onClick={() => onViewChange('dump')} className="text-violet-400 hover:underline">Capture something small in Brain Dump</button>
                    {' '}or{' '}
                    <button onClick={applyEnergyOverride} className="underline hover:text-gray-400">show all tasks</button>.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {visible.map(task => <DashTaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />)}
                  {doNowTasks.length > 4 && (
                    <button onClick={() => onViewChange('eisenhower')} className="w-full text-center text-xs text-gray-600 hover:text-purple-400 py-1.5 transition-colors">
                      +{doNowTasks.length - 4} more →
                    </button>
                  )}
                </div>
              );
            })()}
          </section>

          {/* In Progress */}
          <section>
            <SectionHeader icon={<Clock size={13} className="text-purple-400" />} title="In Progress" count={inProgressTasks.length} onNavigate={() => onViewChange('kanban')} />
            {(() => {
              const visible = (energyLevel === 'low' && !energyOverride ? inProgressTasks.filter(isQuickWin) : inProgressTasks).slice(0, 4);
              if (visible.length === 0 && energyLevel === 'low' && !energyOverride && inProgressTasks.length > 0) {
                return (
                  <div className="px-4 py-3 rounded-xl bg-gray-500/5 border border-gray-500/15">
                    <p className="text-xs text-gray-500">Active tasks need more energy than you have right now.</p>
                    <p className="text-[11px] text-gray-600 mt-1">Rest, or <button onClick={applyEnergyOverride} className="underline hover:text-gray-400">show all anyway</button>.</p>
                  </div>
                );
              }
              if (visible.length === 0) return (
                <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-sm text-gray-600">Nothing active — pick a task to start</p>
                </div>
              );
              return <div className="space-y-1.5">{visible.map(task => <DashTaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />)}</div>;
            })()}
          </section>
        </div>

        {/* Right: alerts + OKRs + projects + quick nav */}
        <div className="lg:col-span-2 space-y-5">

          {/* Needs Attention */}
          {totalAlerts > 0 && (
            <NeedsAttentionSection
              overdueTasks={overdueTasks}
              delegationAlerts={delegationAlerts}
              pendingUpdatesCount={pendingUpdatesCount}
              dumpInboxCount={dumpInboxCount}
              onViewChange={onViewChange}
            />
          )}

          {/* OKR Snapshot (hidden on low; 1 item on getting-by) */}
          {okrSnapshot.length > 0 && energyLevel !== 'low' && (
            <section>
              <SectionHeader icon={<Target size={13} className="text-pink-400" />} title="OKR Snapshot" onNavigate={() => onViewChange('okrs')} />
              <div className="space-y-2">
                {(energyLevel === 'getting-by' ? okrSnapshot.slice(0, 1) : okrSnapshot).map(okr => (
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

          {/* Projects at Risk / Blocked (hidden on low energy) */}
          {atRiskProjects.length > 0 && energyLevel !== 'low' && (
            <section>
              <SectionHeader icon={<FolderKanban size={13} className="text-amber-400" />} title="Projects Needing Attention" onNavigate={() => onViewChange('projects')} />
              <div className="space-y-1.5">
                {atRiskProjects.slice(0, 4).map(p => <ProjectCard key={p.id} project={p} onClick={() => handleProjectClick(p)} />)}
              </div>
            </section>
          )}

          {/* Leadership Pulse (hidden on low energy to avoid anxiety induction) */}
          {energyLevel === 'low' && (overdueConvos.length > 0 || readyConvos.length > 0 || overdueCommitmentsCount > 0) && (
            <div className="px-3 py-2 rounded-xl bg-gray-500/5 border border-gray-500/15">
              <p className="text-[11px] text-gray-600">Leadership Pulse hidden — come back when you have more capacity.</p>
            </div>
          )}
          {(overdueConvos.length > 0 || readyConvos.length > 0 || overdueCommitmentsCount > 0) && energyLevel !== 'low' && (
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

      {/* ── End-of-day Capture ── */}
      {showEOD && <EndOfDayModal onClose={() => setShowEOD(false)} onDone={() => setEodDoneToday(true)} />}

      {/* ── Onboarding ── */}
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
    </div>
  );
}
