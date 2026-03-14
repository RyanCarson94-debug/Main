import { useState } from 'react';
import {
  MessageSquarePlus, Trash2, CheckCheck, ChevronDown, Plus,
  UserPlus, Check, Bell, Clock, AlertTriangle, Zap, Info, ClipboardList,
} from 'lucide-react';
import type { Update, UpdatePerson, UpdateType, PersonRelationship, Commitment, Decision, Task, FirstTeamMember } from '../types';
import { MeetingPrepModal } from './MeetingPrepModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const UPDATE_TYPE_CONFIG: Record<UpdateType, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  fyi:      { label: 'FYI',      color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: <Info size={11} /> },
  action:   { label: 'Action',   color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  icon: <Zap size={11} /> },
  decision: { label: 'Decision', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: <AlertTriangle size={11} /> },
  blocker:  { label: 'Blocker',  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    icon: <AlertTriangle size={11} /> },
};

const RELATIONSHIP_CONFIG: Record<PersonRelationship, { label: string; color: string }> = {
  'manager':       { label: 'Manager',       color: 'text-purple-400' },
  'direct-report': { label: 'Direct Report', color: 'text-emerald-400' },
  'peer':          { label: 'Peer',          color: 'text-blue-400' },
  'stakeholder':   { label: 'Stakeholder',   color: 'text-amber-400' },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface UpdatesViewProps {
  people: UpdatePerson[];
  updates: Update[];
  onAddPerson: (person: Omit<UpdatePerson, 'id'>) => void;
  onDeletePerson: (id: string) => void;
  onAddUpdate: (update: Omit<Update, 'id' | 'createdAt' | 'discussedWith'>) => void;
  onDeleteUpdate: (id: string) => void;
  onMarkDiscussed: (updateId: string, personId: string) => void;
  onMarkAllDiscussed: (personId: string) => void;
  // For meeting prep
  commitments?: Commitment[];
  decisions?: Decision[];
  tasks?: Task[];
  teamMembers?: FirstTeamMember[];
}

// ─── Add Person Modal ─────────────────────────────────────────────────────────

function AddPersonModal({ onAdd, onClose }: { onAdd: (p: Omit<UpdatePerson, 'id'>) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<PersonRelationship>('direct-report');

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), relationship });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-[#1A1824] border border-[#2A2640] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-black text-white mb-4">Add Person</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Sarah Chen"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full px-3 py-2.5 rounded-xl bg-[#1E1C28] border border-[#2A2640] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Relationship</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(RELATIONSHIP_CONFIG) as PersonRelationship[]).map(rel => (
                <button
                  key={rel}
                  onClick={() => setRelationship(rel)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                    relationship === rel
                      ? 'bg-purple-600/30 text-purple-200 border-purple-500/40'
                      : 'bg-white/5 text-gray-500 border-white/5 hover:text-gray-300'
                  }`}
                >
                  {RELATIONSHIP_CONFIG[rel].label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-white hover:bg-white/5 transition-colors border border-white/5">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="flex-1 py-2 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Update Form ──────────────────────────────────────────────────────────

function AddUpdateForm({
  people,
  onAdd,
  onClose,
  defaultPersonId,
}: {
  people: UpdatePerson[];
  onAdd: (u: Omit<Update, 'id' | 'createdAt' | 'discussedWith'>) => void;
  onClose: () => void;
  defaultPersonId?: string;
}) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<UpdateType>('fyi');
  const [selectedPeople, setSelectedPeople] = useState<string[]>(defaultPersonId ? [defaultPersonId] : []);

  const togglePerson = (id: string) => {
    setSelectedPeople(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const submit = () => {
    if (!content.trim() || selectedPeople.length === 0) return;
    onAdd({ content: content.trim(), type, recipientIds: selectedPeople });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-[#1A1824] border border-[#2A2640] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-black text-white mb-4">Log Update</h3>

        {/* Type selector */}
        <div className="flex gap-1.5 mb-4">
          {(Object.keys(UPDATE_TYPE_CONFIG) as UpdateType[]).map(t => {
            const cfg = UPDATE_TYPE_CONFIG[t];
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  type === t
                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                    : 'bg-white/5 text-gray-500 border-white/5 hover:text-gray-300'
                }`}
              >
                {cfg.icon}
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <textarea
          autoFocus
          placeholder="What happened or changed? Be specific…"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 rounded-xl bg-[#1E1C28] border border-[#2A2640] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none mb-4"
        />

        {/* Who needs to know */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Who needs to know?</p>
          {people.length === 0 ? (
            <p className="text-xs text-gray-600 italic">No people added yet — close this and add someone first.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {people.map(person => {
                const selected = selectedPeople.includes(person.id);
                const relCfg = RELATIONSHIP_CONFIG[person.relationship];
                return (
                  <button
                    key={person.id}
                    onClick={() => togglePerson(person.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      selected
                        ? 'bg-purple-600/30 text-purple-200 border-purple-500/40'
                        : 'bg-white/5 text-gray-500 border-white/5 hover:text-gray-300'
                    }`}
                  >
                    {selected && <Check size={10} />}
                    {person.name}
                    <span className={`text-[10px] ${selected ? 'text-purple-400' : relCfg.color}`}>
                      {relCfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-white hover:bg-white/5 transition-colors border border-white/5">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!content.trim() || selectedPeople.length === 0}
            className="flex-1 py-2 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-40"
          >
            Save Update
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Update Card ──────────────────────────────────────────────────────────────

function UpdateCard({
  update,
  personId,
  allPeople,
  discussed,
  onMarkDiscussed,
  onDelete,
}: {
  update: Update;
  personId: string;
  allPeople: UpdatePerson[];
  discussed: boolean;
  onMarkDiscussed: () => void;
  onDelete: () => void;
}) {
  const cfg = UPDATE_TYPE_CONFIG[update.type];
  const sharedWith = update.recipientIds
    .filter(id => id !== personId)
    .map(id => allPeople.find(p => p.id === id)?.name)
    .filter(Boolean);

  const date = new Date(update.createdAt);
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className={`p-4 rounded-xl border transition-all ${discussed ? 'bg-white/[0.02] border-white/5 opacity-50' : 'bg-[#1E1C28] border-[#2A2640]'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Type + date row */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
              {cfg.icon}
              {cfg.label}
            </span>
            <span className="text-[11px] text-gray-600">{dateStr}</span>
            {discussed && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                <Check size={10} /> Discussed
              </span>
            )}
          </div>

          {/* Content */}
          <p className="text-sm text-gray-200 leading-relaxed">{update.content}</p>

          {/* Also going to */}
          {sharedWith.length > 0 && (
            <p className="text-[11px] text-gray-600 mt-1.5">
              Also for: {sharedWith.join(', ')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!discussed && (
            <button
              onClick={onMarkDiscussed}
              title="Mark as discussed"
              className="p-1.5 rounded-lg text-gray-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <Check size={15} />
            </button>
          )}
          <button
            onClick={onDelete}
            title="Delete"
            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function UpdatesView({
  people,
  updates,
  onAddPerson,
  onDeletePerson,
  onAddUpdate,
  onDeleteUpdate,
  onMarkDiscussed,
  onMarkAllDiscussed,
  commitments = [],
  decisions = [],
  tasks = [],
  teamMembers = [],
}: UpdatesViewProps) {
  const [showPrep, setShowPrep] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    people.length > 0 ? people[0].id : null
  );
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [showDiscussed, setShowDiscussed] = useState(false);

  // Keep selectedPersonId valid
  const resolvedId = people.find(p => p.id === selectedPersonId)?.id ?? (people[0]?.id ?? null);

  const selectedPerson = people.find(p => p.id === resolvedId) ?? null;

  const personUpdates = resolvedId
    ? updates.filter(u => u.recipientIds.includes(resolvedId))
    : [];

  const pending = personUpdates.filter(u => !u.discussedWith.includes(resolvedId!));
  const discussed = personUpdates.filter(u => u.discussedWith.includes(resolvedId!));

  // Badge counts per person
  const pendingCounts = Object.fromEntries(
    people.map(p => [
      p.id,
      updates.filter(u => u.recipientIds.includes(p.id) && !u.discussedWith.includes(p.id)).length,
    ])
  );

  return (
    <div className="h-full flex gap-4">
      {/* ── Left panel: people list ── */}
      <div className="w-[200px] shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">People</p>
          <button
            onClick={() => setShowAddPerson(true)}
            className="p-1 rounded-lg text-gray-600 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
            title="Add person"
          >
            <UserPlus size={14} />
          </button>
        </div>

        {people.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <UserPlus size={24} className="text-gray-700 mb-2" />
            <p className="text-xs text-gray-600">Add the people you brief</p>
            <button
              onClick={() => setShowAddPerson(true)}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-400 border border-[#2A2640] hover:bg-purple-600/30 transition-colors"
            >
              + Add Person
            </button>
          </div>
        ) : (
          people.map(person => {
            const active = resolvedId === person.id;
            const count = pendingCounts[person.id] ?? 0;
            const relCfg = RELATIONSHIP_CONFIG[person.relationship];
            return (
              <button
                key={person.id}
                onClick={() => setSelectedPersonId(person.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group flex items-center gap-2 ${
                  active
                    ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/20 border border-[#2A2640]'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${active ? 'text-white' : 'text-gray-400'}`}>
                    {person.name}
                  </p>
                  <p className={`text-[10px] ${relCfg.color}`}>{relCfg.label}</p>
                </div>
                {count > 0 && (
                  <span className="shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {count}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* ── Right panel: updates for selected person ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedPerson ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Bell size={36} className="text-gray-700 mb-3" />
            <p className="text-sm font-semibold text-gray-600">Select a person to see their briefing</p>
          </div>
        ) : (
          <>
            {/* Person header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                  <Bell size={18} className="text-purple-400" />
                  {selectedPerson.name}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className={RELATIONSHIP_CONFIG[selectedPerson.relationship].color}>
                    {RELATIONSHIP_CONFIG[selectedPerson.relationship].label}
                  </span>
                  {' · '}
                  {pending.length} pending{pending.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrep(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                >
                  <ClipboardList size={13} />
                  Prep
                </button>
                {pending.length > 0 && (
                  <button
                    onClick={() => onMarkAllDiscussed(selectedPerson.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                  >
                    <CheckCheck size={13} />
                    All discussed
                  </button>
                )}
                <button
                  onClick={() => { setSelectedPersonId(selectedPerson.id); setShowAddUpdate(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
                >
                  <MessageSquarePlus size={13} />
                  Log update
                </button>
                <button
                  onClick={() => onDeletePerson(selectedPerson.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove person"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Pending updates */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {pending.length === 0 && discussed.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageSquarePlus size={32} className="text-gray-700 mb-3" />
                  <p className="text-sm font-semibold text-gray-600">Nothing logged yet</p>
                  <p className="text-xs text-gray-700 mt-1">Log an update to brief {selectedPerson.name}</p>
                  <button
                    onClick={() => setShowAddUpdate(true)}
                    className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
                  >
                    <Plus size={13} />
                    Log first update
                  </button>
                </div>
              )}

              {pending.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={11} />
                    To discuss ({pending.length})
                  </p>
                  {pending.map(u => (
                    <UpdateCard
                      key={u.id}
                      update={u}
                      personId={selectedPerson.id}
                      allPeople={people}
                      discussed={false}
                      onMarkDiscussed={() => onMarkDiscussed(u.id, selectedPerson.id)}
                      onDelete={() => onDeleteUpdate(u.id)}
                    />
                  ))}
                </div>
              )}

              {/* Discussed toggle */}
              {discussed.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowDiscussed(s => !s)}
                    className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-widest"
                  >
                    <ChevronDown size={13} className={`transition-transform ${showDiscussed ? 'rotate-180' : ''}`} />
                    Discussed ({discussed.length})
                  </button>
                  {showDiscussed && discussed.map(u => (
                    <UpdateCard
                      key={u.id}
                      update={u}
                      personId={selectedPerson.id}
                      allPeople={people}
                      discussed={true}
                      onMarkDiscussed={() => {}}
                      onDelete={() => onDeleteUpdate(u.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showAddPerson && (
        <AddPersonModal
          onAdd={person => { onAddPerson(person); setSelectedPersonId(undefined as unknown as string); }}
          onClose={() => setShowAddPerson(false)}
        />
      )}
      {showAddUpdate && (
        <AddUpdateForm
          people={people}
          defaultPersonId={resolvedId ?? undefined}
          onAdd={onAddUpdate}
          onClose={() => setShowAddUpdate(false)}
        />
      )}
      {showPrep && selectedPerson && (
        <MeetingPrepModal
          personName={selectedPerson.name}
          personId={selectedPerson.id}
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
