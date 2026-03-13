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
    label: 'Daily Ops',
    items: [
      { id: 'dashboard',    label: 'Dashboard',   icon: <Home size={16} /> },
      { id: 'dump',         label: 'Brain Dump',  icon: <BrainCircuit size={16} />, badge: c => c.dumpInbox },
      { id: 'focus',        label: 'Focus Mode',  icon: <Zap size={16} /> },
    ],
  },
  {
    label: 'Tasks',
    items: [
      { id: 'kanban',       label: 'Task Board',  icon: <LayoutDashboard size={16} /> },
      { id: 'eisenhower',   label: 'Eisenhower',  icon: <Grid2x2 size={16} /> },
      { id: 'delegations',  label: 'Delegations', icon: <UserCheck size={16} />, badge: c => c.delegationAlerts },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'updates',         label: '1:1 Briefings',   icon: <Bell size={16} />,    badge: c => c.pendingUpdates },
      { id: 'first-team',      label: 'First Team',      icon: <Users size={16} /> },
      { id: 'direct-reports',  label: 'Direct Reports',  icon: <UserCog size={16} /> },
      { id: 'stakeholders',    label: 'Stakeholders',    icon: <Network size={16} /> },
    ],
  },
  {
    label: 'Strategy',
    items: [
      { id: 'north-star',    label: 'North Star',     icon: <Compass size={16} /> },
      { id: 'okrs',          label: 'OKRs',           icon: <Target size={16} /> },
      { id: 'weekly-review', label: 'Weekly Review',  icon: <CalendarCheck size={16} /> },
    ],
  },
  {
    label: 'Thinking',
    items: [
      { id: 'decision-log', label: 'Decision Log', icon: <BookMarked size={16} />, badge: c => c.overdueCommitments },
      { id: 'swot',         label: 'SWOT',          icon: <BarChart2 size={16} /> },
      { id: 'frameworks',   label: 'Frameworks',    icon: <BookOpen size={16} /> },
    ],
  },
];

export function Sidebar({ view, onViewChange, onLogout, onSearch, taskCounts }: SidebarProps) {
  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-full border-r border-[#2D1F5E] bg-[#0C0820]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#2D1F5E]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-white leading-none">LEAD</p>
            <p className="text-[10px] font-bold text-purple-400 tracking-widest uppercase">ADHD Mode</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <button
        onClick={onSearch}
        className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border border-[#2D1F5E] text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all text-xs"
      >
        <Search size={13} />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="text-[10px] px-1 py-0.5 rounded bg-white/5 border border-white/10">⌘K</kbd>
      </button>

      {/* Focus status */}
      {(taskCounts.doNow > 0 || taskCounts.inProgress > 0) && (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">🔥 Focus Now</p>
          {taskCounts.doNow > 0 && (
            <p className="text-xs text-gray-300"><span className="font-bold text-red-300">{taskCounts.doNow}</span> urgent tasks</p>
          )}
          {taskCounts.inProgress > 0 && (
            <p className="text-xs text-gray-300"><span className="font-bold text-purple-300">{taskCounts.inProgress}</span> in progress</p>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-1">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = view === item.id;
                const badgeCount = item.badge ? item.badge(taskCounts) : 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/20 text-white border border-purple-500/30'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className={active ? 'text-purple-400' : ''}>{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
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

      {/* Footer: lock button */}
      <div className="px-3 py-3 border-t border-[#2D1F5E]">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all"
        >
          <LogOut size={16} />
          <span>Lock</span>
        </button>
      </div>
    </aside>
  );
}
