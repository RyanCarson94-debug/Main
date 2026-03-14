import { useState, useMemo } from 'react';
import {
  BadgeCheck, Plus, ChevronRight, Trash2, X, Users,
} from 'lucide-react';
import type { RoleCharter, RoleCharterStatus } from '../types';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RoleCharterStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  'draft':        { label: 'Draft',        color: 'text-gray-400',    bg: 'bg-gray-500/10',    border: 'border-gray-500/30',    dot: 'bg-gray-500'    },
  'active':       { label: 'Active',       color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  'vacant':       { label: 'Vacant',       color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   dot: 'bg-amber-400'   },
  'being-hired':  { label: 'Hiring',       color: 'text-sky-300',     bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     dot: 'bg-sky-400'     },
};

const CHARTER_SECTIONS: Array<{
  key: keyof Omit<RoleCharter, 'id' | 'title' | 'status' | 'filledBy' | 'createdAt' | 'updatedAt'>;
  label: string;
  subtitle: string;
  placeholder: string;
  rows: number;
}> = [
  {
    key: 'summary',
    label: 'Why This Role Exists',
    subtitle: '2–3 sentences explaining the purpose and value of this role on the team',
    placeholder: 'e.g. The Head of Product owns the translation of company strategy into a product vision that the team can build toward. They are accountable for the roadmap, prioritisation, and ensuring every feature shipped moves a business metric.',
    rows: 3,
  },
  {
    key: 'coreAccountabilities',
    label: 'Core Accountabilities',
    subtitle: '4–6 key areas this role is responsible for delivering',
    placeholder: '1. Product strategy and roadmap — owned end to end\n2. Discovery and customer insight — qualitative and quantitative\n3. Cross-functional collaboration — aligning eng, design, and data\n4. Stakeholder communication — regular updates to leadership\n5. Team development — growing the PM function',
    rows: 7,
  },
  {
    key: 'decisionRights',
    label: 'Decision Rights',
    subtitle: 'What this role decides, recommends, and is consulted on',
    placeholder: 'DECIDE: Roadmap priority, feature scope, sprint goals, PM hiring\nCONSULT: Engineering capacity, design direction, pricing, GTM timing\nINFORM: Executive roadmap reviews, investor updates\nDELEGATE: Ticket writing, user research scheduling, analytics reporting',
    rows: 6,
  },
  {
    key: 'successCriteria',
    label: 'Success Criteria',
    subtitle: 'What does excellent look like in this role? How will you know it\'s being done well?',
    placeholder: 'e.g. Roadmap is clear 2 quarters ahead. Engineering ships without PM blockers. Business metrics move in the right direction. Stakeholders trust the product process. PM team is growing in capability.',
    rows: 5,
  },
  {
    key: 'keyInterfaces',
    label: 'Key Interfaces',
    subtitle: 'Who this role depends on and who depends on it',
    placeholder: 'Engineering Lead: daily — roadmap alignment, trade-offs, sprint planning\nDesign Lead: weekly — discovery synthesis, UX direction\nCEO/Founder: weekly — strategic alignment, roadmap review\nData: ongoing — metric definitions, experiment design\nCustomers: regularly — discovery calls, usability sessions',
    rows: 5,
  },
  {
    key: 'growthPath',
    label: 'Growth Path',
    subtitle: 'What advancement from this role looks like',
    placeholder: 'e.g. Strong performance here leads to: Director of Product (managing PMs), CPO (0-to-1 ownership), or GM (full P&L ownership).\n\nKey skills to develop: executive presence, data fluency, cross-functional influence.',
    rows: 4,
  },
  {
    key: 'notes',
    label: 'Notes',
    subtitle: 'Anything else worth capturing — open questions, context, history',
    placeholder: 'e.g. This role was restructured in Q3 to include data analysis. The previous PM left because the scope was too ambiguous — this charter should fix that.',
    rows: 3,
  },
];

// ─── New / Edit Modal ─────────────────────────────────────────────────────────

function CharterModal({ onSave, onClose, editCharter }: {
  onSave: (c: Omit<RoleCharter, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  editCharter?: RoleCharter | null;
}) {
  const [title,    setTitle]    = useState(editCharter?.title    ?? '');
  const [filledBy, setFilledBy] = useState(editCharter?.filledBy ?? '');
  const [status,   setStatus]   = useState<RoleCharterStatus>(editCharter?.status ?? 'draft');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title:              title.trim(),
      filledBy:           filledBy.trim() || undefined,
      status,
      summary:            editCharter?.summary,
      coreAccountabilities: editCharter?.coreAccountabilities,
      decisionRights:     editCharter?.decisionRights,
      successCriteria:    editCharter?.successCriteria,
      keyInterfaces:      editCharter?.keyInterfaces,
      growthPath:         editCharter?.growthPath,
      notes:              editCharter?.notes,
      updatedAt:          editCharter?.updatedAt,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1824] border border-[#2A2640] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2640]">
          <h2 className="text-base font-bold text-white">{editCharter ? 'Edit Role Charter' : 'New Role Charter'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Role Title *</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Head of Product, Senior Engineer, Engineering Manager"
              className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Filled By</label>
              <input value={filledBy} onChange={e => setFilledBy(e.target.value)} placeholder="Person's name"
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as RoleCharterStatus)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-sm focus:outline-none focus:border-violet-500">
                {(Object.keys(STATUS_CONFIG) as RoleCharterStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#2A2640] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#2A2640] text-gray-400 hover:text-gray-200 text-sm font-semibold transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!title.trim()}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors disabled:opacity-40">
            {editCharter ? 'Save' : 'Create Charter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Charter Card ─────────────────────────────────────────────────────────────

function CharterCard({ charter, onClick, onDelete }: {
  charter: RoleCharter; onClick: () => void; onDelete: () => void;
}) {
  const cfg = STATUS_CONFIG[charter.status];
  const filled = CHARTER_SECTIONS.filter(s => !!charter[s.key]).length;
  const total  = CHARTER_SECTIONS.length;
  const pct    = Math.round((filled / total) * 100);

  return (
    <div onClick={onClick}
      className="group relative bg-[#1A1824] border border-[#2A2640] rounded-2xl p-4 cursor-pointer hover:border-violet-500/50 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
            </span>
            {charter.status === 'draft' && (
              <span className="text-[10px] text-gray-500 font-medium">{pct}% complete</span>
            )}
          </div>
          <h3 className="font-bold text-white text-sm">{charter.title}</h3>
          {charter.filledBy && <p className="text-xs text-gray-500 mt-0.5">{charter.filledBy}</p>}
          {charter.summary  && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{charter.summary}</p>}
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 shrink-0 p-1 text-gray-600 hover:text-red-400 transition-all">
          <Trash2 size={13} />
        </button>
      </div>

      {charter.status !== 'vacant' && charter.status !== 'being-hired' && (
        <div className="h-1 bg-[#2A2640] rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      )}

      <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 group-hover:text-violet-400 transition-colors" />
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface RoleChartersViewProps {
  charters: RoleCharter[];
  onAdd: (c: Omit<RoleCharter, 'id' | 'createdAt'>) => RoleCharter;
  onUpdate: (id: string, updates: Partial<RoleCharter>) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

type StatusFilter = 'all' | 'active' | 'open';

export function RoleChartersView({
  charters, onAdd, onUpdate, onDelete, selectedId, onSelect,
}: RoleChartersViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editCharter, setEditCharter] = useState<RoleCharter | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    const sorted = [...charters].sort((a, b) => {
      const order: RoleCharterStatus[] = ['active', 'vacant', 'being-hired', 'draft'];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });
    if (filter === 'active') return sorted.filter(c => c.status === 'active');
    if (filter === 'open')   return sorted.filter(c => c.status === 'vacant' || c.status === 'being-hired');
    return sorted;
  }, [charters, filter]);

  const selected = charters.find(c => c.id === selectedId) ?? null;

  const handleAdd = (data: Omit<RoleCharter, 'id' | 'createdAt'>) => {
    const c = onAdd(data);
    onSelect(c.id);
  };

  const handleEdit = (data: Omit<RoleCharter, 'id' | 'createdAt'>) => {
    if (!editCharter) return;
    onUpdate(editCharter.id, data);
    setEditCharter(null);
  };

  if (selected) {
    return (
      <>
        <CharterDetail
          charter={selected}
          onBack={() => onSelect(null)}
          onUpdate={u => onUpdate(selected.id, u)}
          onEdit={() => setEditCharter(selected)}
        />
        {editCharter && <CharterModal editCharter={editCharter} onSave={handleEdit} onClose={() => setEditCharter(null)} />}
      </>
    );
  }

  const active       = charters.filter(c => c.status === 'active').length;
  const vacant       = charters.filter(c => c.status === 'vacant').length;
  const hiring       = charters.filter(c => c.status === 'being-hired').length;
  const hasOpenRoles = vacant + hiring > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BadgeCheck className="text-sky-400" size={24} /> Role Charters
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">Define each role on your team — accountabilities, decision rights, and what success looks like</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-all active:scale-95">
          <Plus size={16} /> New Charter
        </button>
      </div>

      {charters.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-5 shrink-0">
          {[
            { label: 'Total Roles',  value: charters.length, color: 'text-gray-300'   },
            { label: 'Active',       value: active,          color: 'text-emerald-300' },
            { label: 'Vacant',       value: vacant,          color: vacant  > 0 ? 'text-amber-300' : 'text-gray-500' },
            { label: 'Hiring',       value: hiring,          color: hiring  > 0 ? 'text-sky-300'   : 'text-gray-500' },
          ].map(s => (
            <div key={s.label} className="bg-[#1A1824] border border-[#2A2640] rounded-xl px-4 py-3 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {hasOpenRoles && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 shrink-0">
          <Users size={14} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">
            {vacant > 0 && <><span className="font-bold">{vacant}</span> vacant role{vacant !== 1 ? 's' : ''}</>}
            {vacant > 0 && hiring > 0 && ' · '}
            {hiring > 0 && <><span className="font-bold">{hiring}</span> role{hiring !== 1 ? 's' : ''} being hired</>}
          </p>
        </div>
      )}

      <div className="flex gap-1 mb-4 shrink-0">
        {([
          { id: 'all',    label: `All (${charters.length})` },
          { id: 'active', label: `Active (${active})` },
          { id: 'open',   label: `Open Roles (${vacant + hiring})` },
        ] as { id: StatusFilter; label: string }[]).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === f.id ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}>{f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BadgeCheck size={40} className="text-gray-700 mb-3" />
            <p className="text-gray-500 font-semibold">No role charters yet</p>
            <p className="text-gray-600 text-xs mt-1">Document each role — it prevents ambiguity, aids hiring, and makes your team structure visible</p>
            <button onClick={() => setShowModal(true)}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors">
              <Plus size={14} /> Create first charter
            </button>
          </div>
        ) : (
          filtered.map(c => (
            <CharterCard key={c.id} charter={c}
              onClick={() => onSelect(c.id)}
              onDelete={() => { if (selectedId === c.id) onSelect(null); onDelete(c.id); }} />
          ))
        )}
      </div>

      {showModal  && <CharterModal onSave={handleAdd} onClose={() => setShowModal(false)} />}
      {editCharter && <CharterModal editCharter={editCharter} onSave={handleEdit} onClose={() => setEditCharter(null)} />}
    </div>
  );
}

// ─── Charter Detail ───────────────────────────────────────────────────────────

function CharterDetail({ charter, onBack, onUpdate, onEdit }: {
  charter: RoleCharter;
  onBack: () => void;
  onUpdate: (u: Partial<RoleCharter>) => void;
  onEdit: () => void;
}) {
  const cfg    = STATUS_CONFIG[charter.status];
  const filled = CHARTER_SECTIONS.filter(s => !!charter[s.key]).length;
  const total  = CHARTER_SECTIONS.length;
  const pct    = Math.round((filled / total) * 100);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-3 transition-colors">
          <ChevronRight size={12} className="rotate-180" /> All charters
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
              </span>
              <span className="text-xs text-gray-500">{pct}% complete</span>
            </div>
            <h2 className="text-xl font-black text-white">{charter.title}</h2>
            {charter.filledBy && <p className="text-sm text-gray-400 mt-0.5">{charter.filledBy}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select value={charter.status}
              onChange={e => onUpdate({ status: e.target.value as RoleCharterStatus })}
              className="px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-xs font-semibold focus:outline-none focus:border-violet-500">
              {(Object.keys(STATUS_CONFIG) as RoleCharterStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <button onClick={onEdit} className="px-3 py-2 rounded-xl border border-[#2A2640] text-gray-400 hover:text-gray-200 text-xs font-semibold transition-colors">Edit</button>
          </div>
        </div>

        {/* Completion bar */}
        <div className="mt-3">
          <div className="h-1.5 bg-[#2A2640] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-sky-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="space-y-6 max-w-3xl">
          {CHARTER_SECTIONS.map(s => (
            <div key={s.key}>
              <p className="text-sm font-bold text-white mb-0.5">{s.label}</p>
              <p className="text-xs text-gray-500 mb-2">{s.subtitle}</p>
              <textarea
                value={(charter[s.key] as string | undefined) ?? ''}
                onChange={e => onUpdate({ [s.key]: e.target.value })}
                rows={s.rows}
                placeholder={s.placeholder}
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500 leading-relaxed"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
