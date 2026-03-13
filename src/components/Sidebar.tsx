import { LayoutDashboard, Grid2x2, Target, BarChart2, Users, Zap, UserCheck, BookOpen, Bell } from 'lucide-react';
import type { View } from '../types';

interface SidebarProps {
  view: View;
  onViewChange: (v: View) => void;
  taskCounts: {
    doNow: number;
    inProgress: number;
    delegationAlerts: number;
    pendingUpdates: number;
  };
}

const NAV: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'focus', label: 'Focus Mode', icon: <Zap size={18} /> },
  { id: 'kanban', label: 'Task Board', icon: <LayoutDashboard size={18} /> },
  { id: 'eisenhower', label: 'Eisenhower', icon: <Grid2x2 size={18} /> },
  { id: 'delegations', label: 'Delegations', icon: <UserCheck size={18} /> },
  { id: 'okrs', label: 'OKRs', icon: <Target size={18} /> },
  { id: 'swot', label: 'SWOT', icon: <BarChart2 size={18} /> },
  { id: 'first-team', label: 'First Team', icon: <Users size={18} /> },
  { id: 'frameworks', label: 'Frameworks', icon: <BookOpen size={18} /> },
  { id: 'updates', label: '1:1 Briefings', icon: <Bell size={18} /> },
];

export function Sidebar({ view, onViewChange, taskCounts }: SidebarProps) {
  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-full border-r border-[#2D1F5E] bg-[#0C0820]">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[#2D1F5E]">
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

      {/* Status bar */}
      {(taskCounts.doNow > 0 || taskCounts.inProgress > 0) && (
        <div className="mx-3 mt-3 p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1.5">🔥 Focus Now</p>
          {taskCounts.doNow > 0 && (
            <p className="text-xs text-gray-300">
              <span className="font-bold text-red-300">{taskCounts.doNow}</span> urgent tasks
            </p>
          )}
          {taskCounts.inProgress > 0 && (
            <p className="text-xs text-gray-300">
              <span className="font-bold text-purple-300">{taskCounts.inProgress}</span> in progress
            </p>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-2">Views</p>
        {NAV.map(item => {
          const active = view === item.id;
          const showBadge =
            (item.id === 'delegations' && taskCounts.delegationAlerts > 0) ||
            (item.id === 'updates' && taskCounts.pendingUpdates > 0);
          const badgeCount = item.id === 'delegations' ? taskCounts.delegationAlerts : taskCounts.pendingUpdates;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${active
                  ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/20 text-white border border-purple-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }
              `}
            >
              <span className={active ? 'text-purple-400' : ''}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {showBadge && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer tip */}
      <div className="mx-3 mb-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
        <p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest mb-1">ADHD Tip</p>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Start with your "Do Now" quadrant. One task at a time.
        </p>
      </div>
    </aside>
  );
}
