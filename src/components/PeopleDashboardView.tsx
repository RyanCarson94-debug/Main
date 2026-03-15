import { useMemo } from 'react';
import {
  Users, Clock, MessageSquareWarning, CheckCircle2,
  AlertTriangle, ChevronRight, UserCheck, ClipboardList,
} from 'lucide-react';
import type {
  FirstTeamMember, UpdatePerson, OneOnOneNote, HardConversation,
  Commitment, Task,
} from '../types';
import type { View } from '../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PeopleDashboardViewProps {
  teamMembers:       FirstTeamMember[];
  updatePeople:      UpdatePerson[];
  oneOnOneNotes:     OneOnOneNote[];
  hardConversations: HardConversation[];
  commitments:       Commitment[];
  tasks:             Task[];
  onViewChange:      (view: View) => void;
  onPersonSelect?:   (personId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

function healthColor(days: number | null): string {
  if (days === null) return 'text-gray-600';
  if (days > 21)    return 'text-red-400';
  if (days > 14)    return 'text-amber-400';
  return 'text-emerald-400';
}

function healthBg(days: number | null): string {
  if (days === null) return 'bg-gray-500/5 border-gray-500/15';
  if (days > 21)    return 'bg-red-500/5 border-red-500/20';
  if (days > 14)    return 'bg-amber-500/5 border-amber-500/20';
  return 'bg-emerald-500/5 border-emerald-500/15';
}

// ─── Person Row ───────────────────────────────────────────────────────────────

function PersonRow({
  name, role, lastOneOnOne, openCommitments, hardConvoStatus, delegatedTasks,
  onViewOneOnOne, onViewHardConvos, onViewDelegations,
}: {
  name: string;
  role?: string;
  lastOneOnOne: string | undefined;
  openCommitments: number;
  hardConvoStatus: 'planning' | 'ready' | null;
  delegatedTasks: number;
  onViewOneOnOne: () => void;
  onViewHardConvos: () => void;
  onViewDelegations: () => void;
}) {
  const days = daysSince(lastOneOnOne);
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={`rounded-2xl border p-4 transition-all ${healthBg(days)}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
          <span className="text-xs font-black text-violet-300">{initials}</span>
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white">{name}</p>
            {role && <span className="text-[11px] text-gray-500">{role}</span>}
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">

            {/* 1:1 recency */}
            <button onClick={onViewOneOnOne}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <Clock size={11} className={healthColor(days)} />
              <span className={`text-[11px] font-semibold ${healthColor(days)}`}>
                {days === null
                  ? 'No 1:1 yet'
                  : days === 0
                    ? '1:1 today'
                    : `${days}d since 1:1`
                }
              </span>
              {days !== null && days > 14 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {days > 21 ? 'overdue' : 'soon'}
                </span>
              )}
            </button>

            {/* Open commitments */}
            {openCommitments > 0 && (
              <button onClick={onViewDelegations}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <ClipboardList size={11} className="text-sky-400" />
                <span className="text-[11px] font-semibold text-sky-400">
                  {openCommitments} commitment{openCommitments > 1 ? 's' : ''}
                </span>
              </button>
            )}

            {/* Hard convo status */}
            {hardConvoStatus && (
              <button onClick={onViewHardConvos}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <MessageSquareWarning size={11} className={hardConvoStatus === 'ready' ? 'text-blue-400' : 'text-amber-400'} />
                <span className={`text-[11px] font-semibold ${hardConvoStatus === 'ready' ? 'text-blue-400' : 'text-amber-400'}`}>
                  Conversation {hardConvoStatus === 'ready' ? 'ready' : 'in prep'}
                </span>
              </button>
            )}

            {/* Delegated tasks */}
            {delegatedTasks > 0 && (
              <button onClick={onViewDelegations}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <UserCheck size={11} className="text-violet-400" />
                <span className="text-[11px] font-semibold text-violet-400">
                  {delegatedTasks} delegated
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Quick action */}
        <button onClick={onViewOneOnOne}
          className="p-1.5 rounded-lg text-gray-600 hover:text-violet-400 hover:bg-violet-500/10 transition-colors shrink-0">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Summary Banner ───────────────────────────────────────────────────────────

function SummaryBanner({ overdueOneOnOnes, readyConvos, openCommitmentsTotal }: {
  overdueOneOnOnes: number;
  readyConvos: number;
  openCommitmentsTotal: number;
}) {
  if (overdueOneOnOnes === 0 && readyConvos === 0 && openCommitmentsTotal === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
        <p className="text-sm text-emerald-300 font-semibold">Your people are in good shape — no urgent signals.</p>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
      <div className="text-sm text-amber-200 space-y-0.5">
        {overdueOneOnOnes > 0 && <p>{overdueOneOnOnes} person{overdueOneOnOnes > 1 ? 's' : ''} overdue for a 1:1 (21+ days)</p>}
        {readyConvos > 0 && <p>{readyConvos} conversation{readyConvos > 1 ? 's' : ''} prepped and ready to have</p>}
        {openCommitmentsTotal > 0 && <p>{openCommitmentsTotal} open commitment{openCommitmentsTotal > 1 ? 's' : ''} to your team</p>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PeopleDashboardView({
  teamMembers, updatePeople, oneOnOneNotes, hardConversations, commitments, tasks, onViewChange, onPersonSelect,
}: PeopleDashboardViewProps) {

  // Merge team members + briefing people into one unified list
  const people = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; name: string; role?: string; source: 'team' | 'briefing' }[] = [];

    for (const m of teamMembers) {
      seen.add(m.name.toLowerCase());
      result.push({ id: m.id, name: m.name, role: m.role, source: 'team' });
    }
    for (const p of updatePeople) {
      if (!seen.has(p.name.toLowerCase())) {
        seen.add(p.name.toLowerCase());
        result.push({ id: p.id, name: p.name, role: p.relationship, source: 'briefing' });
      }
    }
    return result;
  }, [teamMembers, updatePeople]);

  // Per-person metrics
  const personMetrics = useMemo(() => {
    return people.map(person => {
      // Last 1:1 note
      const personNotes = oneOnOneNotes
        .filter(n => n.personId === person.id || n.personName?.toLowerCase() === person.name.toLowerCase())
        .sort((a, b) => b.date.localeCompare(a.date));
      const lastOneOnOne = personNotes[0]?.date;

      // Open commitments to this person
      const openCommitments = commitments.filter(c =>
        !c.done && c.to?.toLowerCase().includes(person.name.toLowerCase())
      ).length;

      // Hard conversation status
      const convo = hardConversations.find(c =>
        (c.person ?? '').toLowerCase() === person.name.toLowerCase() &&
        (c.status === 'planning' || c.status === 'ready')
      );
      const hardConvoStatus = convo ? convo.status as 'planning' | 'ready' : null;

      // Delegated tasks
      const delegatedTasks = tasks.filter(t =>
        t.column !== 'done' && t.delegatedTo?.toLowerCase().includes(person.name.toLowerCase())
      ).length;

      return { ...person, lastOneOnOne, openCommitments, hardConvoStatus, delegatedTasks };
    });
  }, [people, oneOnOneNotes, commitments, hardConversations, tasks]);

  // Sort: highest risk first (overdue 1:1 → pending convo → has open items)
  const sorted = useMemo(() => {
    return [...personMetrics].sort((a, b) => {
      const riskScore = (p: typeof personMetrics[0]) => {
        const days = daysSince(p.lastOneOnOne);
        let score = 0;
        if (days === null || days > 21) score += 30;
        else if (days > 14) score += 15;
        if (p.hardConvoStatus === 'ready') score += 10;
        if (p.hardConvoStatus === 'planning') score += 5;
        if (p.openCommitments > 0) score += p.openCommitments * 2;
        if (p.delegatedTasks > 0) score += p.delegatedTasks;
        return score;
      };
      return riskScore(b) - riskScore(a);
    });
  }, [personMetrics]);

  const overdueOneOnOnes = sorted.filter(p => {
    const days = daysSince(p.lastOneOnOne);
    return days === null || days > 21;
  }).length;

  const readyConvos = sorted.filter(p => p.hardConvoStatus === 'ready').length;
  const openCommitmentsTotal = sorted.reduce((s, p) => s + p.openCommitments, 0);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-sky-400" />
          <h1 className="text-xl font-black text-white">People Dashboard</h1>
        </div>
        <p className="text-[11px] text-gray-600">{people.length} people · sorted by risk</p>
      </div>

      {/* Summary banner */}
      <SummaryBanner
        overdueOneOnOnes={overdueOneOnOnes}
        readyConvos={readyConvos}
        openCommitmentsTotal={openCommitmentsTotal}
      />

      {/* People list */}
      {people.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-6">
          <Users size={32} className="text-gray-700" />
          <p className="text-sm text-gray-500">No people yet.</p>
          <p className="text-xs text-gray-700">Add your team in <button onClick={() => onViewChange('first-team')} className="text-violet-400 hover:underline">First Team</button> or <button onClick={() => onViewChange('updates')} className="text-violet-400 hover:underline">1:1 Briefings</button>.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2.5 pb-4">
          {sorted.map(person => (
            <PersonRow
              key={person.id}
              name={person.name}
              role={person.role}
              lastOneOnOne={person.lastOneOnOne}
              openCommitments={person.openCommitments}
              hardConvoStatus={person.hardConvoStatus}
              delegatedTasks={person.delegatedTasks}
              onViewOneOnOne={() => { if (onPersonSelect) onPersonSelect(person.id); onViewChange('one-on-one'); }}
              onViewHardConvos={() => onViewChange('hard-conversations')}
              onViewDelegations={() => onViewChange('delegations')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
