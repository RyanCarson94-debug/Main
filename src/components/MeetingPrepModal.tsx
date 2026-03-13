import { X, MessageSquare, CheckSquare, Link, BookMarked, AlertTriangle } from 'lucide-react';
import type { Update, Commitment, Decision, Task, FirstTeamMember } from '../types';

interface MeetingPrepModalProps {
  personName: string;
  personId?: string;
  updates: Update[];
  commitments: Commitment[];
  decisions: Decision[];
  tasks: Task[];
  teamMembers: FirstTeamMember[];
  onClose: () => void;
}

export function MeetingPrepModal({
  personName, personId,
  updates, commitments, decisions, tasks, teamMembers,
  onClose,
}: MeetingPrepModalProps) {
  const today = new Date().toISOString().split('T')[0];

  // Updates for this person not yet discussed
  const pendingUpdates = personId
    ? updates.filter(u => u.recipientIds.includes(personId) && !u.discussedWith.includes(personId))
    : [];

  // My commitments to this person (open)
  const myCommitments = commitments.filter(
    c => !c.done && c.to.toLowerCase().includes(personName.toLowerCase()),
  );
  const overdueCommitments = myCommitments.filter(c => c.dueDate && c.dueDate < today);

  // Linked tasks if this person is in First Team
  const member = personId
    ? teamMembers.find(m => m.id === personId)
    : teamMembers.find(m => m.name.toLowerCase() === personName.toLowerCase());
  const linkedTasks = member?.linkedTaskIds
    ? tasks.filter(t => member.linkedTaskIds!.includes(t.id) && t.column !== 'done')
    : [];

  // Decisions mentioning them
  const relatedDecisions = decisions.filter(d =>
    (d.people ?? '').toLowerCase().includes(personName.toLowerCase()),
  ).slice(0, 3);

  const hasContent =
    pendingUpdates.length > 0 ||
    myCommitments.length > 0 ||
    linkedTasks.length > 0 ||
    relatedDecisions.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-[#0C0820] border border-[#2D1F5E] shadow-2xl max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D1F5E] shrink-0">
          <div>
            <h3 className="text-base font-black text-white">Meeting Prep</h3>
            <p className="text-xs text-gray-500 mt-0.5">{personName}</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!hasContent && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600">Nothing to prep — you're all clear with {personName}.</p>
            </div>
          )}

          {/* Overdue commitments */}
          {overdueCommitments.length > 0 && (
            <Section icon={<AlertTriangle size={13} className="text-red-400" />} label="Overdue Commitments" accent="red">
              {overdueCommitments.map(c => (
                <PrepItem key={c.id} text={c.what} sub={`Due ${new Date(c.dueDate!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`} urgent />
              ))}
            </Section>
          )}

          {/* Pending updates to discuss */}
          {pendingUpdates.length > 0 && (
            <Section icon={<MessageSquare size={13} className="text-blue-400" />} label={`${pendingUpdates.length} Update${pendingUpdates.length > 1 ? 's' : ''} to Discuss`}>
              {pendingUpdates.map(u => (
                <PrepItem key={u.id} text={u.content} sub={`${u.type.toUpperCase()} · ${new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`} />
              ))}
            </Section>
          )}

          {/* My active commitments to them */}
          {myCommitments.filter(c => !overdueCommitments.includes(c)).length > 0 && (
            <Section icon={<CheckSquare size={13} className="text-amber-400" />} label="My Commitments to Them">
              {myCommitments.filter(c => !overdueCommitments.includes(c)).map(c => (
                <PrepItem key={c.id} text={c.what} sub={c.dueDate ? `Due ${new Date(c.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : undefined} />
              ))}
            </Section>
          )}

          {/* Linked tasks */}
          {linkedTasks.length > 0 && (
            <Section icon={<Link size={13} className="text-purple-400" />} label="Linked Active Tasks">
              {linkedTasks.map(t => (
                <PrepItem key={t.id} text={t.title} sub={`${t.priority} · ${t.column}`} />
              ))}
            </Section>
          )}

          {/* Related decisions */}
          {relatedDecisions.length > 0 && (
            <Section icon={<BookMarked size={13} className="text-pink-400" />} label="Recent Decisions Involving Them">
              {relatedDecisions.map(d => (
                <PrepItem key={d.id} text={d.title} sub={new Date(d.madeAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
              ))}
            </Section>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#2D1F5E] shrink-0">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-white hover:bg-white/5 border border-white/5 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; accent?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">{label}</p>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function PrepItem({ text, sub, urgent = false }: { text: string; sub?: string; urgent?: boolean }) {
  return (
    <div className={`px-3 py-2 rounded-xl border text-sm ${urgent ? 'bg-red-500/5 border-red-500/15' : 'bg-[#16103A] border-[#2D1F5E]'}`}>
      <p className={urgent ? 'text-red-200' : 'text-gray-300'}>{text}</p>
      {sub && <p className={`text-xs mt-0.5 ${urgent ? 'text-red-400/70' : 'text-gray-600'}`}>{sub}</p>}
    </div>
  );
}
