import { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, UserCheck, Mail, Calendar, RotateCcw } from 'lucide-react';
import type { Task } from '../types';

interface DelegationsViewProps {
  tasks: Task[];
  onOpenDelegationModal: (task: Task) => void;
  onMarkFollowUpDone: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

type Filter = 'all' | 'needs-followup' | 'overdue' | 'done';

function getFollowUpStatus(task: Task): 'overdue' | 'today' | 'upcoming' | 'done' | 'no-date' {
  if (task.followUpDone) return 'done';
  if (!task.followUpDate) return 'no-date';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUp = new Date(task.followUpDate);
  followUp.setHours(0, 0, 0, 0);
  if (followUp < today) return 'overdue';
  if (followUp.getTime() === today.getTime()) return 'today';
  return 'upcoming';
}

const STATUS_CONFIG = {
  overdue: { label: 'Follow-up Overdue', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <AlertTriangle size={12} /> },
  today: { label: 'Follow-up Today', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: <Clock size={12} /> },
  upcoming: { label: 'Follow-up Scheduled', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-white/10', icon: <Calendar size={12} /> },
  done: { label: 'Follow-up Done', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: <CheckCircle2 size={12} /> },
  'no-date': { label: 'No Follow-up Set', color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/30', icon: <Clock size={12} /> },
};

export function DelegationsView({ tasks, onOpenDelegationModal, onMarkFollowUpDone }: DelegationsViewProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  const delegated = tasks.filter(t => t.delegatedTo);

  const filtered = delegated.filter(t => {
    const status = getFollowUpStatus(t);
    if (filter === 'needs-followup') return status !== 'done' && status !== 'no-date';
    if (filter === 'overdue') return status === 'overdue' || status === 'today';
    if (filter === 'done') return status === 'done';
    return true;
  });

  const overdueCnt = delegated.filter(t => { const s = getFollowUpStatus(t); return s === 'overdue' || s === 'today'; }).length;

  const FILTERS: { id: Filter; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: delegated.length },
    { id: 'overdue', label: '🔥 Needs Attention', count: overdueCnt },
    { id: 'needs-followup', label: 'Scheduled', count: delegated.filter(t => { const s = getFollowUpStatus(t); return s === 'upcoming'; }).length },
    { id: 'done', label: '✅ Followed Up', count: delegated.filter(t => getFollowUpStatus(t) === 'done').length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <UserCheck className="text-amber-400" size={24} />
          Delegations
        </h2>
        <p className="text-gray-400 text-sm mt-0.5">Track what you've delegated and close every loop</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Delegated', value: delegated.length, color: 'text-white' },
          { label: 'Need Attention', value: overdueCnt, color: 'text-red-400' },
          { label: 'In Flight', value: delegated.filter(t => getFollowUpStatus(t) === 'upcoming').length, color: 'text-purple-400' },
          { label: 'Loops Closed', value: delegated.filter(t => getFollowUpStatus(t) === 'done').length, color: 'text-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className="p-3 rounded-xl bg-white/3 border border-[#2C2C30]">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`
              flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all
              ${filter === f.id
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'border-[#2C2C30] text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }
            `}
          >
            {f.label}
            {f.count !== undefined && (
              <span className={`px-1 rounded font-bold text-[10px] ${filter === f.id ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-gray-600'}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      {delegated.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-600">
          <UserCheck size={48} className="mb-3 opacity-20" />
          <p className="font-semibold text-gray-500">No delegated tasks yet</p>
          <p className="text-sm mt-1">Move tasks to the Delegate quadrant and click "Delegate" to track them here</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
          No tasks match this filter
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
          {filtered.map(task => {
            const status = getFollowUpStatus(task);
            const statusCfg = STATUS_CONFIG[status];
            const isEmailExpanded = expandedEmail === task.id;

            return (
              <div key={task.id} className={`rounded-2xl border overflow-hidden ${statusCfg.bg} ${statusCfg.border}`}>
                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{task.priority} priority</span>
                      </div>
                      <h3 className="font-bold text-white text-sm leading-snug">{task.title}</h3>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {!task.followUpDone && (
                        <button
                          onClick={() => onMarkFollowUpDone(task.id)}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-semibold transition-colors"
                        >
                          <CheckCircle2 size={11} />
                          Mark Followed Up
                        </button>
                      )}
                      <button
                        onClick={() => onOpenDelegationModal(task)}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 font-semibold transition-colors"
                      >
                        <RotateCcw size={11} />
                        Update
                      </button>
                    </div>
                  </div>

                  {/* Delegation meta */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1.5">
                      <UserCheck size={11} className="text-amber-400" />
                      <span>Delegated to <strong className="text-amber-300">{task.delegatedTo}</strong></span>
                    </span>
                    {task.delegatedAt && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(task.delegatedAt).toLocaleDateString()}
                      </span>
                    )}
                    {task.followUpDate && (
                      <span className={`flex items-center gap-1 font-medium ${status === 'overdue' ? 'text-red-400' : status === 'today' ? 'text-amber-400' : ''}`}>
                        <Calendar size={10} />
                        Follow-up: {new Date(task.followUpDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Commitment note */}
                  {task.commitmentNote && (
                    <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/8 border border-amber-500/15 mb-3">
                      <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5">Loop:</span>
                      <p className="text-xs text-amber-300 leading-relaxed">{task.commitmentNote}</p>
                    </div>
                  )}

                  {/* Email draft toggle */}
                  {task.delegationEmailDraft && (
                    <button
                      onClick={() => setExpandedEmail(isEmailExpanded ? null : task.id)}
                      className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                      <Mail size={11} />
                      {isEmailExpanded ? 'Hide email draft' : 'Show email draft'}
                    </button>
                  )}
                </div>

                {/* Email draft expanded */}
                {isEmailExpanded && task.delegationEmailDraft && (
                  <div className="px-4 pb-4">
                    <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans bg-black/20 rounded-xl p-4 border border-purple-500/10 max-h-64 overflow-y-auto">
                      {task.delegationEmailDraft}
                    </pre>
                    <button
                      onClick={() => { navigator.clipboard.writeText(task.delegationEmailDraft!); }}
                      className="mt-2 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                      Copy email
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
