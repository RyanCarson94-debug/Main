import { useState } from 'react';
import {
  LayoutDashboard, Grid2x2, Target, BarChart2, Users, Zap, UserCheck,
  BookOpen, Bell, BrainCircuit, Home, Compass, BookMarked, CalendarCheck,
  LogOut, Network, Search, UserCog, Bot, Keyboard, CalendarDays, X, Video,
  FolderKanban, MessageSquareWarning, Telescope, ScrollText, BadgeCheck,
  ChevronDown, ChevronRight, Flame, FileText, Cloud, CloudOff, Loader,
  MessageCircle, Star,
} from 'lucide-react';
import type { View } from '../types';
import type { SaveSyncStatus } from '../store';

interface SidebarProps {
  view: View;
  onViewChange: (v: View) => void;
  onLogout: () => void;
  onSearch: () => void;
  onToggleAICoach: () => void;
  onShowShortcuts: () => void;
  aiCoachOpen: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  saveSyncStatus?: SaveSyncStatus;
  onForceCloudPull?: () => void;
  taskCounts: {
    doNow: number;
    inProgress: number;
    delegationAlerts: number;
    pendingUpdates: number;
    dumpInbox: number;
    overdueCommitments: number;
  };
}

type NavGroup = {
  label: string;
  items: { id: View; label: string; icon: React.ReactNode; badge?: (counts: SidebarProps['taskCounts']) => number }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Daily',
    items: [
      { id: 'dashboard',   label: 'Dashboard',    icon: <Home size={14} /> },
      { id: 'day-planner', label: 'Day Planner',  icon: <CalendarDays size={14} /> },
      { id: 'meetings',    label: 'Meetings',     icon: <Video size={14} /> },
      { id: 'dump',        label: 'Brain Dump',   icon: <BrainCircuit size={14} />, badge: c => c.dumpInbox },
      { id: 'focus',       label: 'Focus Mode',   icon: <Zap size={14} /> },
    ],
  },
  {
    label: 'Tasks & Projects',
    items: [
      { id: 'kanban',      label: 'Task Board',   icon: <LayoutDashboard size={14} /> },
      { id: 'eisenhower',  label: 'Eisenhower',   icon: <Grid2x2 size={14} /> },
      { id: 'delegations', label: 'Delegations',  icon: <UserCheck size={14} />, badge: c => c.delegationAlerts },
      { id: 'projects',    label: 'Projects',     icon: <FolderKanban size={14} /> },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'updates',            label: '1:1 Briefings',      icon: <Bell size={14} />,                badge: c => c.pendingUpdates },
      { id: 'one-on-one',         label: '1:1 Notes',          icon: <MessageCircle size={14} /> },
      { id: 'people-dashboard',   label: 'People Dashboard',   icon: <Users size={14} /> },
      { id: 'first-team',         label: 'First Team',         icon: <UserCog size={14} /> },
      { id: 'hard-conversations', label: 'Hard Conversations', icon: <MessageSquareWarning size={14} /> },
      { id: 'direct-reports',     label: 'Direct Reports',     icon: <Star size={14} /> },
      { id: 'stakeholders',       label: 'Stakeholders',       icon: <Network size={14} /> },
      { id: 'personal-readme',    label: 'Personal README',    icon: <FileText size={14} /> },
    ],
  },
  {
    label: 'Strategy',
    items: [
      { id: 'north-star',         label: 'North Star',         icon: <Compass size={14} /> },
      { id: 'okrs',               label: 'OKRs',               icon: <Target size={14} /> },
      { id: 'quarterly-planning', label: 'Quarterly Planning', icon: <Telescope size={14} /> },
      { id: 'weekly-review',      label: 'Weekly Review',      icon: <CalendarCheck size={14} /> },
      { id: 'decision-log',       label: 'Decision Log',       icon: <BookMarked size={14} />, badge: c => c.overdueCommitments },
    ],
  },
  {
    label: 'Reference',
    items: [
      { id: 'role-clarity',  label: 'Role Clarity',  icon: <ScrollText size={14} /> },
      { id: 'role-charters', label: 'Role Charters', icon: <BadgeCheck size={14} /> },
      { id: 'swot',          label: 'SWOT',          icon: <BarChart2 size={14} /> },
      { id: 'frameworks',    label: 'Frameworks',    icon: <BookOpen size={14} /> },
    ],
  },
];

// ─── Starting kit helper ──────────────────────────────────────────────────────

const ROLE_KIT: Record<string, { id: View; label: string }[]> = {
  ic: [
    { id: 'focus',       label: 'Focus Mode' },
    { id: 'dump',        label: 'Brain Dump' },
    { id: 'eisenhower',  label: 'Eisenhower Matrix' },
    { id: 'day-planner', label: 'Day Planner' },
  ],
  lead: [
    { id: 'dashboard',         label: 'Dashboard' },
    { id: 'delegations',       label: 'Delegations' },
    { id: 'one-on-one',        label: '1:1 Notes' },
    { id: 'hard-conversations', label: 'Hard Conversations' },
  ],
  senior: [
    { id: 'dashboard',        label: 'Dashboard' },
    { id: 'dump',             label: 'Brain Dump' },
    { id: 'people-dashboard', label: 'People Dashboard' },
    { id: 'decision-log',     label: 'Decision Log' },
  ],
};

// ─── Streak helper ────────────────────────────────────────────────────────────

function markRestDay(): void {
  try {
    const today = new Date().toISOString().split('T')[0];
    // Persist as streak-last so the next open continues the streak
    localStorage.setItem('adhd-streak-last', today);
    localStorage.setItem(`adhd-rest-day-${today}`, '1');
  } catch { /* ignore */ }
}

function isRestDay(date: string): boolean {
  try { return localStorage.getItem(`adhd-rest-day-${date}`) === '1'; } catch { return false; }
}

function getStreak(): { count: number; isWelcomeBack: boolean; isRestToday: boolean } {
  try {
    const today     = new Date().toISOString().split('T')[0];
    const last      = localStorage.getItem('adhd-streak-last');
    const count     = parseInt(localStorage.getItem('adhd-streak-count') ?? '0', 10);

    if (last === today) return { count, isWelcomeBack: false, isRestToday: isRestDay(today) };

    // Forgive up to 1 missed day, or if that day was a declared rest day
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const dayBefore = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    const continuing = last === yesterday || last === dayBefore || isRestDay(yesterday);
    const isWelcomeBack = last === dayBefore && !isRestDay(yesterday);
    const newCount = continuing ? count + 1 : 1;
    localStorage.setItem('adhd-streak-last', today);
    localStorage.setItem('adhd-streak-count', String(newCount));
    return { count: newCount, isWelcomeBack, isRestToday: false };
  } catch {
    return { count: 0, isWelcomeBack: false, isRestToday: false };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({
  view, onViewChange, onLogout, onSearch, onToggleAICoach, onShowShortcuts,
  aiCoachOpen, mobileOpen, onMobileClose, taskCounts, saveSyncStatus = 'idle', onForceCloudPull,
}: SidebarProps) {
  const navigate = (v: View) => { onViewChange(v); onMobileClose(); };
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('adhd-sidebar-collapsed');
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set(['People', 'Strategy', 'Reference']);
    } catch { return new Set(['People', 'Strategy', 'Reference']); }
  });
  const toggleGroup = (label: string) =>
    setCollapsed(prev => {
      const n = new Set(prev);
      if (n.has(label)) n.delete(label); else n.add(label);
      try { localStorage.setItem('adhd-sidebar-collapsed', JSON.stringify([...n])); } catch { /* ignore */ }
      return n;
    });

  const [{ count: streak, isWelcomeBack, isRestToday }, setStreakState] = useState(() => getStreak());
  const handleRestDay = () => {
    markRestDay();
    setStreakState(s => ({ ...s, isRestToday: true }));
  };

  // Starting kit (role-based onboarding shortcut section)
  const [kitRole]      = useState<string | null>(() => { try { return localStorage.getItem('adhd-onboarding-role'); } catch { return null; } });
  const [kitDismissed, setKitDismissed] = useState<boolean>(() => { try { return localStorage.getItem('adhd-kit-dismissed') === '1'; } catch { return false; } });
  const [visitedKitViews, setVisitedKitViews] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('adhd-kit-visited') ?? '[]') as string[]); } catch { return new Set(); }
  });
  const kitViews = kitRole ? (ROLE_KIT[kitRole] ?? null) : null;

  // Track current view in kit visited set; auto-dismiss once all visited
  const handleKitNavigate = (id: View) => {
    if (kitViews) {
      const next = new Set(visitedKitViews).add(id);
      setVisitedKitViews(next);
      try { localStorage.setItem('adhd-kit-visited', JSON.stringify([...next])); } catch { /* ignore */ }
      if (next.size >= kitViews.length) {
        setKitDismissed(true);
        try { localStorage.setItem('adhd-kit-dismissed', '1'); } catch { /* ignore */ }
      }
    }
    navigate(id);
  };

  const dismissKit = () => {
    setKitDismissed(true);
    try { localStorage.setItem('adhd-kit-dismissed', '1'); } catch { /* ignore */ }
  };

  const inner = (
    <aside className="w-[200px] shrink-0 flex flex-col h-full border-r border-[#2A2640] bg-[#1A1826]">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#2A2640] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center shrink-0 shadow-sm shadow-violet-900/60">
            <Zap size={13} className="text-white" />
          </div>
          <p className="text-sm font-semibold text-white tracking-tight">ADHD Leader</p>
        </div>
        <button onClick={onMobileClose} className="md:hidden p-1 text-gray-600 hover:text-gray-300 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <button
          onClick={() => { onSearch(); onMobileClose(); }}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2A2640] text-gray-600 hover:text-gray-400 hover:border-[#3A3650] transition-all text-xs"
        >
          <Search size={12} />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="text-[10px] text-gray-700 px-1 py-0.5 rounded bg-white/5 border border-[#2A2640]">⌘K</kbd>
        </button>
      </div>

      {/* AI Coach button */}
      <div className="px-3 pt-2">
        <button
          onClick={() => { onToggleAICoach(); onMobileClose(); }}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            aiCoachOpen
              ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
              : 'border-[#2A2640] text-gray-600 hover:text-gray-300 hover:border-[#3A3650]'
          }`}
        >
          <Bot size={12} />
          <span className="flex-1 text-left">AI Coach</span>
          {aiCoachOpen && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />}
        </button>
      </div>

      {/* Urgent signal */}
      {taskCounts.doNow > 0 && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-lg border border-[#2A2640] bg-[#1E1C28]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <p className="text-xs text-gray-400">
              <span className="font-semibold text-white">{taskCounts.doNow}</span> urgent
              {taskCounts.inProgress > 0 && <> · <span className="font-semibold text-white">{taskCounts.inProgress}</span> active</>}
            </p>
          </div>
        </div>
      )}

      {/* Starting kit (dismissible, progress-tracked) */}
      {kitViews && !kitDismissed && (
        <div className="mx-3 mt-2 p-3 rounded-xl border border-violet-500/20 bg-violet-500/5 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Starting Kit</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600">{visitedKitViews.size}/{kitViews.length} explored</span>
              <button onClick={dismissKit} className="text-gray-700 hover:text-gray-500 transition-colors">
                <X size={11} />
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-0.5 rounded-full bg-[#2A2640] mb-2 overflow-hidden">
            <div className="h-full rounded-full bg-violet-500 transition-all"
              style={{ width: `${kitViews.length > 0 ? (visitedKitViews.size / kitViews.length) * 100 : 0}%` }} />
          </div>
          <div className="space-y-px">
            {kitViews.map(item => {
              const visited = visitedKitViews.has(item.id);
              return (
                <button key={item.id} onClick={() => handleKitNavigate(item.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                    view === item.id
                      ? 'bg-violet-500/20 text-white font-semibold'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${visited ? 'bg-emerald-500' : 'bg-violet-500/60'}`} />
                  <span className={visited ? 'line-through opacity-60' : ''}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map(group => {
          const isCollapsed = collapsed.has(group.label);
          const groupBadge = group.items.reduce((sum, item) => sum + (item.badge ? item.badge(taskCounts) : 0), 0);
          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-2 mb-1 group"
              >
                <p className="text-[10px] font-semibold text-gray-700 group-hover:text-gray-500 uppercase tracking-widest transition-colors">{group.label}</p>
                <div className="flex items-center gap-1">
                  {isCollapsed && groupBadge > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500">{groupBadge}</span>
                  )}
                  {isCollapsed
                    ? <ChevronRight size={10} className="text-gray-700 group-hover:text-gray-500 transition-colors" />
                    : <ChevronDown  size={10} className="text-gray-700 group-hover:text-gray-500 transition-colors" />
                  }
                </div>
              </button>
              {!isCollapsed && (
                <div className="space-y-px">
                  {group.items.map(item => {
                    const active     = view === item.id;
                    const badgeCount = item.badge ? item.badge(taskCounts) : 0;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                          active
                            ? 'bg-violet-500/15 border border-violet-500/20 text-white'
                            : 'border border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <span className={`shrink-0 ${active ? 'text-violet-400' : ''}`}>{item.icon}</span>
                        <span className="flex-1 text-left text-[13px]">{item.label}</span>
                        {badgeCount > 0 && (
                          <span className={`text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full ${
                            active ? 'bg-violet-500/20 text-violet-300' : 'bg-white/[0.06] text-gray-500'
                          }`}>
                            {badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-[#2A2640] space-y-px">
        {/* Cloud sync indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 mb-0.5">
          {saveSyncStatus === 'saving' && (
            <>
              <Loader size={11} className="text-violet-400 animate-spin" />
              <span className="text-[11px] text-gray-600">Saving…</span>
            </>
          )}
          {saveSyncStatus === 'saved' && (
            <>
              <Cloud size={11} className="text-emerald-500" />
              <span className="text-[11px] text-emerald-600">Saved to cloud</span>
            </>
          )}
          {saveSyncStatus === 'error' && (
            <>
              <CloudOff size={11} className="text-red-500" />
              <span className="text-[11px] text-red-500">Sync failed</span>
            </>
          )}
          {saveSyncStatus === 'idle' && (
            <>
              <Cloud size={11} className="text-gray-700" />
              <span className="text-[11px] text-gray-700">Cloud sync on</span>
            </>
          )}
          {onForceCloudPull && saveSyncStatus !== 'saving' && (
            <button
              onClick={onForceCloudPull}
              title="Pull latest data from cloud — use if this device is out of sync"
              className="ml-auto text-[10px] text-gray-600 hover:text-violet-400 transition-colors underline underline-offset-2"
            >
              Pull
            </button>
          )}
        </div>
        {/* Streak */}
        {streak > 0 && (
          <div className="px-2.5 mb-1 space-y-1">
            <div className="flex items-center gap-2">
              <Flame size={13} className={isRestToday ? 'text-blue-400' : streak >= 7 ? 'text-orange-400' : streak >= 3 ? 'text-amber-400' : 'text-gray-600'} />
              <span className="text-[12px] text-gray-600 flex-1">
                {isRestToday ? (
                  <span className="text-blue-400 font-bold">Rest day 💙</span>
                ) : isWelcomeBack ? (
                  <span className="text-emerald-400 font-bold">Welcome back</span>
                ) : (
                  <>
                    <span className={`font-bold ${streak >= 7 ? 'text-orange-400' : streak >= 3 ? 'text-amber-400' : 'text-gray-500'}`}>{streak}</span>
                    {' '}day streak
                  </>
                )}
              </span>
            </div>
            {!isRestToday && (
              <button
                onClick={handleRestDay}
                title="Protect your streak — rest days count too"
                className="w-full flex items-center justify-center gap-1.5 py-1 rounded-lg border border-blue-500/20 bg-blue-500/5 text-[11px] text-blue-500 hover:bg-blue-500/15 hover:text-blue-300 hover:border-blue-500/40 transition-all font-medium"
              >
                💙 Rest day — this counts too
              </button>
            )}
          </div>
        )}
        <button
          onClick={() => { onShowShortcuts(); onMobileClose(); }}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] text-gray-700 hover:text-gray-400 hover:bg-white/[0.04] transition-colors"
        >
          <Keyboard size={14} />
          <span>Shortcuts</span>
          <kbd className="ml-auto text-[10px] text-gray-700 px-1 py-0.5 rounded bg-white/5 border border-[#2A2640]">?</kbd>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] text-gray-700 hover:text-gray-400 hover:bg-white/[0.04] transition-colors"
        >
          <LogOut size={14} />
          <span>Lock</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden md:block h-full shrink-0">{inner}</div>

      {/* Mobile: slide-in drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} />
          <div className="relative">{inner}</div>
        </div>
      )}
    </>
  );
}
