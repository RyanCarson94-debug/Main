import { useState } from 'react';
import { BookMarked, Plus, Trash2, X, CheckSquare, Square, ChevronDown, ChevronUp, CalendarDays, Users } from 'lucide-react';
import type { Decision, Commitment } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface DecisionLogViewProps {
  decisions: Decision[];
  commitments: Commitment[];
  onAddDecision: (d: Omit<Decision, 'id'>) => void;
  onUpdateDecision: (id: string, updates: Partial<Decision>) => void;
  onDeleteDecision: (id: string) => void;
  onAddCommitment: (c: Omit<Commitment, 'id' | 'createdAt' | 'done'>) => void;
  onToggleCommitment: (id: string) => void;
  onDeleteCommitment: (id: string) => void;
}

type Tab = 'decisions' | 'commitments';

// ─── Decision Form Modal ──────────────────────────────────────────────────────

function DecisionFormModal({
  decision,
  onSave,
  onClose,
}: {
  decision?: Decision | null;
  onSave: (d: Omit<Decision, 'id'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: decision?.title ?? '',
    context: decision?.context ?? '',
    decision: decision?.decision ?? '',
    alternatives: decision?.alternatives ?? '',
    outcome: decision?.outcome ?? '',
    people: decision?.people ?? '',
    madeAt: decision?.madeAt ?? new Date().toISOString().split('T')[0],
    reviewAt: decision?.reviewAt ?? '',
  });

  const submit = () => {
    if (!form.title.trim() || !form.decision.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-[#1A1824] border border-[#2A2640] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2640] shrink-0">
          <h3 className="text-base font-black text-white">{decision ? 'Edit Decision' : 'Log a Decision'}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <Field label="Decision Title *">
            <input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What was decided?" className={INPUT} />
          </Field>
          <Field label="Context — what situation prompted this?">
            <textarea value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} placeholder="Background, problem, or trigger…" rows={2} className={`${INPUT} resize-none`} />
          </Field>
          <Field label="The Decision *">
            <textarea value={form.decision} onChange={e => setForm(f => ({ ...f, decision: e.target.value }))} placeholder="Exactly what was decided…" rows={2} className={`${INPUT} resize-none`} />
          </Field>
          <Field label="Alternatives considered">
            <input value={form.alternatives} onChange={e => setForm(f => ({ ...f, alternatives: e.target.value }))} placeholder="What else was on the table?" className={INPUT} />
          </Field>
          <Field label="People involved">
            <input value={form.people} onChange={e => setForm(f => ({ ...f, people: e.target.value }))} placeholder="Names or roles…" className={INPUT} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date Made">
              <input type="date" value={form.madeAt} onChange={e => setForm(f => ({ ...f, madeAt: e.target.value }))} className={`${INPUT} [color-scheme:dark]`} />
            </Field>
            <Field label="Review date">
              <input type="date" value={form.reviewAt} onChange={e => setForm(f => ({ ...f, reviewAt: e.target.value }))} className={`${INPUT} [color-scheme:dark]`} />
            </Field>
          </div>
          {decision && (
            <Field label="Outcome (fill in later)">
              <textarea value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} placeholder="What actually happened?" rows={2} className={`${INPUT} resize-none`} />
            </Field>
          )}
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-[#2A2640] shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-white hover:bg-white/5 transition-colors border border-white/5">Cancel</button>
          <button onClick={submit} disabled={!form.title.trim() || !form.decision.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-40">
            {decision ? 'Save Changes' : 'Log Decision'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Commitment Form Modal ────────────────────────────────────────────────────

function CommitmentFormModal({
  onSave,
  onClose,
}: {
  onSave: (c: Omit<Commitment, 'id' | 'createdAt' | 'done'>) => void;
  onClose: () => void;
}) {
  const [what, setWhat] = useState('');
  const [to, setTo] = useState('');
  const [dueDate, setDueDate] = useState('');

  const submit = () => {
    if (!what.trim() || !to.trim()) return;
    onSave({ what: what.trim(), to: to.trim(), dueDate: dueDate || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-[#1A1824] border border-[#2A2640] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-black text-white mb-4">Log a Commitment</h3>
        <div className="space-y-3">
          <Field label="What did you commit to? *">
            <input autoFocus value={what} onChange={e => setWhat(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="e.g. Review Alex's proposal" className={INPUT} />
          </Field>
          <Field label="Who did you commit to? *">
            <input value={to} onChange={e => setTo(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Person's name" className={INPUT} />
          </Field>
          <Field label="By when?">
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={`${INPUT} [color-scheme:dark]`} />
          </Field>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-white hover:bg-white/5 transition-colors border border-white/5">Cancel</button>
          <button onClick={submit} disabled={!what.trim() || !to.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors">Log Commitment</button>
        </div>
      </div>
    </div>
  );
}

// ─── Decision Card ────────────────────────────────────────────────────────────

function DecisionCard({
  decision,
  onEdit,
  onDelete,
}: {
  decision: Decision;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const reviewDue = decision.reviewAt && decision.reviewAt <= today;

  return (
    <>
      <div className="rounded-xl bg-[#1E1C28] border border-[#2A2640] overflow-hidden">
        <button onClick={() => setExpanded(e => !e)} className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {reviewDue && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">REVIEW DUE</span>}
              <p className="text-sm font-bold text-white truncate">{decision.title}</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span className="flex items-center gap-1"><CalendarDays size={10} /> {new Date(decision.madeAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              {decision.people && <span className="flex items-center gap-1"><Users size={10} /> {decision.people}</span>}
            </div>
          </div>
          {expanded ? <ChevronUp size={14} className="text-gray-600 shrink-0 mt-0.5" /> : <ChevronDown size={14} className="text-gray-600 shrink-0 mt-0.5" />}
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-[#2A2640] pt-3">
            {decision.context && <InfoBlock label="Context" text={decision.context} />}
            <InfoBlock label="Decision" text={decision.decision} highlight />
            {decision.alternatives && <InfoBlock label="Alternatives considered" text={decision.alternatives} />}
            {decision.outcome && <InfoBlock label="Outcome" text={decision.outcome} color="emerald" />}
            {decision.reviewAt && (
              <p className="text-[11px] text-gray-600 flex items-center gap-1">
                <CalendarDays size={10} /> Review: {new Date(decision.reviewAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={onEdit} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors">Edit / Add Outcome</button>
              <button onClick={() => setConfirmDelete(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">Delete</button>
            </div>
          </div>
        )}
      </div>
      {confirmDelete && (
        <ConfirmModal title="Delete decision?" message="This will permanently remove this decision log entry." onConfirm={onDelete} onClose={() => setConfirmDelete(false)} />
      )}
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT = 'w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function InfoBlock({ label, text, highlight = false, color }: { label: string; text: string; highlight?: boolean; color?: string }) {
  const textColor = color === 'emerald' ? 'text-emerald-300' : highlight ? 'text-white' : 'text-gray-300';
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm leading-relaxed ${textColor}`}>{text}</p>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function DecisionLogView({
  decisions, commitments,
  onAddDecision, onUpdateDecision, onDeleteDecision,
  onAddCommitment, onToggleCommitment, onDeleteCommitment,
}: DecisionLogViewProps) {
  const [tab, setTab] = useState<Tab>('decisions');
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [editDecision, setEditDecision] = useState<Decision | null>(null);
  const [showCommitmentForm, setShowCommitmentForm] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const overdueCommitments = commitments.filter(c => !c.done && c.dueDate && c.dueDate < today);
  const activeCommitments = commitments.filter(c => !c.done && !(c.dueDate && c.dueDate < today));
  const doneCommitments = commitments.filter(c => c.done);
  const reviewDueCount = decisions.filter(d => d.reviewAt && d.reviewAt <= today).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BookMarked className="text-purple-400" size={24} />
            Decision Log
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">Track what was decided and commitments you've made</p>
        </div>
        <button
          onClick={() => tab === 'decisions' ? setShowDecisionForm(true) : setShowCommitmentForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-all"
        >
          <Plus size={16} />
          {tab === 'decisions' ? 'Log Decision' : 'Log Commitment'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 shrink-0">
        {(['decisions', 'commitments'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
              tab === t ? 'bg-purple-600/20 text-white border border-white/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            {t}
            {t === 'decisions' && reviewDueCount > 0 && (
              <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">{reviewDueCount}</span>
            )}
            {t === 'commitments' && overdueCommitments.length > 0 && (
              <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">{overdueCommitments.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'decisions' && (
          <div className="space-y-2">
            {decisions.length === 0 ? (
              <EmptyState icon={<BookMarked size={36} />} text="No decisions logged yet" sub="Start capturing what you decide and why — your future self will thank you." />
            ) : (
              decisions.map(d => (
                <DecisionCard
                  key={d.id}
                  decision={d}
                  onEdit={() => setEditDecision(d)}
                  onDelete={() => onDeleteDecision(d.id)}
                />
              ))
            )}
          </div>
        )}

        {tab === 'commitments' && (
          <div className="space-y-4">
            {overdueCommitments.length > 0 && (
              <div>
                <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-2">Overdue</p>
                <div className="space-y-1.5">
                  {overdueCommitments.map(c => <CommitmentRow key={c.id} commitment={c} onToggle={() => onToggleCommitment(c.id)} onDelete={() => onDeleteCommitment(c.id)} overdue />)}
                </div>
              </div>
            )}
            {activeCommitments.length > 0 && (
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Active</p>
                <div className="space-y-1.5">
                  {activeCommitments.map(c => <CommitmentRow key={c.id} commitment={c} onToggle={() => onToggleCommitment(c.id)} onDelete={() => onDeleteCommitment(c.id)} />)}
                </div>
              </div>
            )}
            {commitments.length === 0 && (
              <EmptyState icon={<CheckSquare size={36} />} text="No commitments tracked" sub="Log verbal commitments you make in meetings — never forget what you promised." />
            )}
            {doneCommitments.length > 0 && (
              <div>
                <p className="text-xs font-black text-gray-600 uppercase tracking-widest mb-2">Done</p>
                <div className="space-y-1.5 opacity-50">
                  {doneCommitments.map(c => <CommitmentRow key={c.id} commitment={c} onToggle={() => onToggleCommitment(c.id)} onDelete={() => onDeleteCommitment(c.id)} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {(showDecisionForm || editDecision) && (
        <DecisionFormModal
          decision={editDecision}
          onSave={d => editDecision ? onUpdateDecision(editDecision.id, d) : onAddDecision(d)}
          onClose={() => { setShowDecisionForm(false); setEditDecision(null); }}
        />
      )}
      {showCommitmentForm && (
        <CommitmentFormModal
          onSave={onAddCommitment}
          onClose={() => setShowCommitmentForm(false)}
        />
      )}
    </div>
  );
}

// ─── Commitment Row ───────────────────────────────────────────────────────────

function CommitmentRow({
  commitment, onToggle, onDelete, overdue = false,
}: {
  commitment: Commitment;
  onToggle: () => void;
  onDelete: () => void;
  overdue?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border group ${overdue ? 'bg-red-500/5 border-red-500/15' : 'bg-[#1E1C28] border-[#2A2640]'}`}>
      <button onClick={onToggle} className="shrink-0 text-gray-600 hover:text-purple-400 transition-colors">
        {commitment.done ? <CheckSquare size={16} className="text-emerald-400" /> : <Square size={16} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${commitment.done ? 'line-through text-gray-500' : 'text-gray-200'}`}>
          {commitment.what}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          to <span className="text-gray-400 font-medium">{commitment.to}</span>
          {commitment.dueDate && (
            <span className={overdue ? ' · text-red-400 font-semibold' : ' · '}>
              {' '}due {new Date(commitment.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </p>
      </div>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function EmptyState({ icon, text, sub }: { icon: React.ReactNode; text: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-gray-700 mb-3">{icon}</div>
      <p className="text-sm font-semibold text-gray-600">{text}</p>
      <p className="text-xs text-gray-700 mt-1 max-w-xs">{sub}</p>
    </div>
  );
}
