import { useState } from 'react';
import { Network, Plus, X, Edit2, ChevronRight } from 'lucide-react';
import type {
  Stakeholder, InfluenceLevel, InterestLevel,
  Update, Commitment, Decision, Task, FirstTeamMember,
} from '../types';
import { ConfirmModal } from './ConfirmModal';
import { MeetingPrepModal } from './MeetingPrepModal';

interface StakeholderMapViewProps {
  stakeholders: Stakeholder[];
  onAdd: (s: Omit<Stakeholder, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Stakeholder>) => void;
  onDelete: (id: string) => void;
  updates: Update[];
  commitments: Commitment[];
  decisions: Decision[];
  tasks: Task[];
  teamMembers: FirstTeamMember[];
}

// ─── Quadrant config ──────────────────────────────────────────────────────────

const QUADRANTS: {
  influence: InfluenceLevel;
  interest: InterestLevel;
  label: string;
  strategy: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  { influence: 'high', interest: 'high', label: 'Manage Closely',  strategy: 'Engage actively, consult on decisions',  color: 'text-red-400',    bg: 'bg-red-500/5',    border: 'border-red-500/20' },
  { influence: 'high', interest: 'low',  label: 'Keep Satisfied',  strategy: 'Regular updates, respect their time',    color: 'text-amber-400',  bg: 'bg-amber-500/5',  border: 'border-amber-500/20' },
  { influence: 'low',  interest: 'high', label: 'Keep Informed',   strategy: 'Inform of progress, address concerns',   color: 'text-blue-400',   bg: 'bg-blue-500/5',   border: 'border-blue-500/20' },
  { influence: 'low',  interest: 'low',  label: 'Monitor',         strategy: 'Periodic check-ins, minimal effort',     color: 'text-gray-400',   bg: 'bg-gray-500/5',   border: 'border-gray-500/20' },
];

// ─── Form Modal ───────────────────────────────────────────────────────────────

function StakeholderFormModal({
  stakeholder,
  onSave,
  onClose,
}: {
  stakeholder?: Stakeholder | null;
  onSave: (s: Omit<Stakeholder, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name:      stakeholder?.name      ?? '',
    role:      stakeholder?.role      ?? '',
    org:       stakeholder?.org       ?? '',
    influence: stakeholder?.influence ?? 'medium' as InfluenceLevel,
    interest:  stakeholder?.interest  ?? 'medium' as InterestLevel,
    strategy:  stakeholder?.strategy  ?? '',
    notes:     stakeholder?.notes     ?? '',
  });

  const submit = () => {
    if (!form.name.trim() || !form.role.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-[#141417] border border-[#2C2C30] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2C2C30]">
          <h3 className="text-base font-black text-white">{stakeholder ? 'Edit Stakeholder' : 'Add Stakeholder'}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <SField label="Name *">
              <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={INPUT} placeholder="Full name" />
            </SField>
            <SField label="Role *">
              <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={INPUT} placeholder="Title / role" />
            </SField>
          </div>
          <SField label="Organisation">
            <input value={form.org} onChange={e => setForm(f => ({ ...f, org: e.target.value }))} className={INPUT} placeholder="Team, dept, or company" />
          </SField>
          <div className="grid grid-cols-2 gap-3">
            <SField label="Influence">
              <select value={form.influence} onChange={e => setForm(f => ({ ...f, influence: e.target.value as InfluenceLevel }))} className={INPUT}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </SField>
            <SField label="Interest">
              <select value={form.interest} onChange={e => setForm(f => ({ ...f, interest: e.target.value as InterestLevel }))} className={INPUT}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </SField>
          </div>
          <SField label="Engagement strategy">
            <input value={form.strategy} onChange={e => setForm(f => ({ ...f, strategy: e.target.value }))} className={INPUT} placeholder="How will you manage this relationship?" />
          </SField>
          <SField label="Notes">
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${INPUT} resize-none`} placeholder="Context, preferences, history…" />
          </SField>
        </div>
        <div className="flex gap-2 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-white hover:bg-white/5 border border-white/5 transition-colors">Cancel</button>
          <button onClick={submit} disabled={!form.name.trim() || !form.role.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors">
            {stakeholder ? 'Save Changes' : 'Add Stakeholder'}
          </button>
        </div>
      </div>
    </div>
  );
}

const INPUT = 'w-full px-3 py-2.5 rounded-xl bg-[#111113] border border-[#2C2C30] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50';
function SField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function StakeholderMapView({
  stakeholders, onAdd, onUpdate, onDelete,
  updates, commitments, decisions, tasks, teamMembers,
}: StakeholderMapViewProps) {
  const [selected, setSelected]       = useState<Stakeholder | null>(null);
  const [showForm, setShowForm]       = useState(false);
  const [editTarget, setEditTarget]   = useState<Stakeholder | null>(null);
  const [confirmId, setConfirmId]     = useState<string | null>(null);
  const [showPrep, setShowPrep]       = useState(false);

  const getQuadrant = (s: Stakeholder) =>
    QUADRANTS.find(q => q.influence === s.influence && q.interest === s.interest);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Network className="text-blue-400" size={24} />
            Stakeholder Map
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">Know who to manage, inform, and satisfy</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-all"
        >
          <Plus size={16} /> Add Stakeholder
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex gap-4">
        {/* 2x2 Grid */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
          {/* Axis labels */}
          <div className="col-span-2 grid grid-cols-2 gap-3 shrink-0" style={{ height: 0 }}>
          </div>
          {QUADRANTS.map(q => {
            const inQuadrant = stakeholders.filter(s => s.influence === q.influence && s.interest === q.interest);
            return (
              <div key={`${q.influence}-${q.interest}`} className={`flex flex-col rounded-2xl border p-3 overflow-hidden ${q.bg} ${q.border}`}>
                <div className="mb-2 shrink-0">
                  <p className={`text-xs font-black uppercase tracking-widest ${q.color}`}>{q.label}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    Influence: <span className="capitalize font-semibold">{q.influence}</span>
                    {' · '}
                    Interest: <span className="capitalize font-semibold">{q.interest}</span>
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5">
                  {inQuadrant.length === 0 && (
                    <p className="text-xs text-gray-700 italic">None</p>
                  )}
                  {inQuadrant.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelected(selected?.id === s.id ? null : s)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl border transition-all ${
                        selected?.id === s.id
                          ? `bg-white/10 ${q.border} text-white`
                          : 'bg-white/[0.03] border-white/5 text-gray-300 hover:bg-white/[0.07]'
                      }`}
                    >
                      <p className="text-xs font-semibold truncate">{s.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{s.role}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-[240px] shrink-0 flex flex-col gap-3">
            <div className="rounded-2xl bg-[#1C1C1F] border border-[#2C2C30] p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-black text-white">{selected.name}</p>
                  <p className="text-xs text-gray-400">{selected.role}</p>
                  {selected.org && <p className="text-xs text-gray-600">{selected.org}</p>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => { setEditTarget(selected); setShowForm(true); }} className="text-gray-600 hover:text-purple-400 transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => setConfirmId(selected.id)} className="text-gray-600 hover:text-red-400 transition-colors"><X size={13} /></button>
                </div>
              </div>

              {getQuadrant(selected) && (
                <div className={`px-2.5 py-2 rounded-xl ${getQuadrant(selected)!.bg} ${getQuadrant(selected)!.border} border mb-3`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${getQuadrant(selected)!.color}`}>{getQuadrant(selected)!.label}</p>
                  <p className="text-xs text-gray-400">{getQuadrant(selected)!.strategy}</p>
                </div>
              )}

              {selected.strategy && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Your Strategy</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{selected.strategy}</p>
                </div>
              )}

              {selected.notes && (
                <div>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{selected.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowPrep(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15 text-purple-400 text-sm font-bold transition-colors"
            >
              <span>Meeting Prep</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      {stakeholders.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Network size={40} className="text-gray-800 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">No stakeholders mapped yet</p>
            <p className="text-xs text-gray-800 mt-1">Add stakeholders to see the 2×2 map</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <StakeholderFormModal
          stakeholder={editTarget}
          onSave={s => editTarget ? onUpdate(editTarget.id, s) : onAdd(s)}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}
      {confirmId && (
        <ConfirmModal
          title="Remove stakeholder?"
          message="This will remove them from your stakeholder map."
          onConfirm={() => { onDelete(confirmId); setSelected(null); }}
          onClose={() => setConfirmId(null)}
        />
      )}
      {showPrep && selected && (
        <MeetingPrepModal
          personName={selected.name}
          updates={updates}
          commitments={commitments}
          decisions={decisions}
          tasks={tasks}
          teamMembers={teamMembers}
          onClose={() => setShowPrep(false)}
        />
      )}
    </div>
  );
}
