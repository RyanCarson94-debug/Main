import {
  LayoutDashboard, Grid2x2, Target, BarChart2, Users, Zap, UserCheck,
  BookOpen, Bell, BrainCircuit, Home, Compass, BookMarked, CalendarCheck,
  LogOut, Network, Search, UserCog,
} from 'lucide-react';
import type { View } from '../types';

interface SidebarProps {
  view: View;
  onViewChange: (v: View) => void;
  onLogout: () => void;
  onSearch: () => void;
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
      { id: 'dashboard',    label: 'Dashboard',   icon: <Home size={14} /> },
      { id: 'dump',         label: 'Brain Dump',  icon: <BrainCircuit size={14} />, badge: c => c.dumpInbox },
      { id: 'focus',        label: 'Focus Mode',  icon: <Zap size={14} /> },
    ],
  },
  {
    label: 'Tasks',
    items: [
      { id: 'kanban',       label: 'Task Board',  icon: <LayoutDashboard size={14} /> },
      { id: 'eisenhower',   label: 'Eisenhower',  icon: <Grid2x2 size={14} /> },
      { id: 'delegations',  label: 'Delegations', icon: <UserCheck size={14} />, badge: c => c.delegationAlerts },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'updates',         label: '1:1 Briefings',  icon: <Bell size={14} />,    badge: c => c.pendingUpdates },
      { id: 'first-team',      label: 'First Team',     icon: <Users size={14} /> },
      { id: 'direct-reports',  label: 'Direct Reports', icon: <UserCog size={14} /> },
      { id: 'stakeholders',    label: 'Stakeholders',   icon: <Network size={14} /> },
    ],
  },
  {
    label: 'Strategy',
    items: [
      { id: 'north-star',    label: 'North Star',    icon: <Compass size={14} /> },
      { id: 'okrs',          label: 'OKRs',          icon: <Target size={14} /> },
      { id: 'weekly-review', label: 'Weekly Review', icon: <CalendarCheck size={14} /> },
    ],
  },
  {
    label: 'Thinking',
    items: [
      { id: 'decision-log', label: 'Decision Log', icon: <BookMarked size={14} />, badge: c => c.overdueCommitments },
      { id: 'swot',         label: 'SWOT',          icon: <BarChart2 size={14} /> },
      { id: 'frameworks',   label: 'Frameworks',    icon: <BookOpen size={14} /> },
    ],
  },
];

export function Sidebar({ view, onViewChange, onLogout, onSearch, taskCounts }: SidebarProps) {
  return (
    <aside className="w-[200px] shrink-0 flex flex-col h-full border-r border-[#2A2640] bg-[#1A1826]">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#2A2640]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center shrink-0 shadow-sm shadow-violet-900/60">
            <Zap size={13} className="text-white" />
          </div>
          <p className="text-sm font-semibold text-white tracking-tight">ADHD Leader</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <button
          onClick={onSearch}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2A2640] text-gray-600 hover:text-gray-400 hover:border-[#3A3650] transition-all text-xs"
        >
          <Search size={12} />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="text-[10px] text-gray-700 px-1 py-0.5 rounded bg-white/5 border border-[#2A2640]">⌘K</kbd>
        </button>
      </div>

      {/* Urgent signal — only if there's something to act on */}
      {taskCounts.doNow > 0 && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg border border-[#2A2640] bg-[#1E1C28]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <p className="text-xs text-gray-400">
              <span className="font-semibold text-white">{taskCounts.doNow}</span> urgent
              {taskCounts.inProgress > 0 && <> · <span className="font-semibold text-white">{taskCounts.inProgress}</span> active</>}
            </p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-widest px-2 mb-1">{group.label}</p>
            <div className="space-y-px">
              {group.items.map(item => {
                const active = view === item.id;
                const badgeCount = item.badge ? item.badge(taskCounts) : 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
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
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-[#2A2640]">
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
}
