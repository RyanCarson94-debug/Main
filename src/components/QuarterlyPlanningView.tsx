import { useState, useMemo } from 'react';
import {
  Telescope, Plus, ChevronRight, CheckCircle2, Circle, Trash2, X,
  Target, FolderKanban, Sparkles, Pencil, Check,
} from 'lucide-react';
import type { QuarterlyPlan, QuarterlyPlanStatus, OKR, Project } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentQuarter(): { quarter: string; quarterNum: 1|2|3|4; year: number } {
  const now    = new Date();
  const month  = now.getMonth(); // 0-indexed
  const year   = now.getFullYear();
  const qNum   = (Math.floor(month / 3) + 1) as 1|2|3|4;
  return { quarter: `Q${qNum} ${year}`, quarterNum: qNum, year };
}

function nextQuarters(count = 4): Array<{ quarter: string; quarterNum: 1|2|3|4; year: number }> {
  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();
  const qNum  = Math.floor(month / 3) + 1;
  const result = [];
  for (let i = 0; i < count; i++) {
    const absQ  = qNum + i;
    const q     = ((absQ - 1) % 4 + 1) as 1|2|3|4;
    const y     = year + Math.floor((absQ - 1) / 4);
    result.push({ quarter: `Q${q} ${y}`, quarterNum: q, year: y });
  }
  return result;
}

const STATUS_CONFIG: Record<QuarterlyPlanStatus, { label: string; color: string; bg: string; border: string }> = {
  draft:    { label: 'Draft',    color: 'text-gray-400',    bg: 'bg-gray-500/10',    border: 'border-gray-500/30'    },
  active:   { label: 'Active',   color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  complete: { label: 'Complete', color: 'text-violet-300',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30'  },
};

const QUARTER_COLORS: Record<number, string> = { 1: 'text-sky-300', 2: 'text-emerald-300', 3: 'text-amber-300', 4: 'text-violet-300' };

// ─── New Plan Modal ───────────────────────────────────────────────────────────

function NewPlanModal({ onSave, onClose, existingQuarters }: {
  onSave: (p: Omit<QuarterlyPlan, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  existingQuarters: string[];
}) {
  const options = nextQuarters(6).filter(q => !existingQuarters.includes(q.quarter));
  const [selected, setSelected] = useState(options[0] ?? currentQuarter());

  const handleCreate = () => {
    onSave({
      quarter:       selected.quarter,
      quarterNum:    selected.quarterNum,
      year:          selected.year,
      status:        'draft',
      focusAreas:    [],
      linkedOKRIds:  [],
      linkedProjectIds: [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1824] border border-[#2A2640] rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2640]">
          <h2 className="text-base font-bold text-white">Start Quarterly Plan</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6">
          <label className="block text-xs font-semibold text-gray-400 mb-3">Which quarter?</label>
          <div className="space-y-2">
            {options.slice(0, 4).map(q => (
              <button key={q.quarter}
                onClick={() => setSelected(q)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selected.quarter === q.quarter
                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                    : 'border-[#2A2640] text-gray-400 hover:border-gray-500'
                }`}>
                <span className={`font-black text-lg ${QUARTER_COLORS[q.quarterNum]}`}>Q{q.quarterNum}</span>
                <span className="text-gray-400 ml-1 text-sm">{q.year}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#2A2640] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#2A2640] text-gray-400 hover:text-gray-200 text-sm font-semibold transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={!selected}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors disabled:opacity-40">
            Create Plan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, onClick, onDelete, onQuickUpdate, isCurrent }: {
  plan: QuarterlyPlan; onClick: () => void; onDelete: () => void;
  onQuickUpdate?: (u: Partial<QuarterlyPlan>) => void; isCurrent: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draftTheme, setDraftTheme] = useState(plan.theme ?? '');
  const [draftFocus, setDraftFocus] = useState<string[]>(plan.focusAreas);
  const [newFocus,   setNewFocus]   = useState('');

  const statusCfg = STATUS_CONFIG[plan.status];
  const filled = [
    plan.theme, plan.notList, plan.teamPriorities,
    plan.personalDevelopment, plan.blockers, plan.successMeasures,
  ].filter(Boolean).length;
  const total = 6;

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftTheme(plan.theme ?? '');
    setDraftFocus([...plan.focusAreas]);
    setEditing(true);
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickUpdate?.({ theme: draftTheme, focusAreas: draftFocus });
    setEditing(false);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(false);
  };

  const addDraftFocus = () => {
    const f = newFocus.trim();
    if (!f || draftFocus.length >= 3) return;
    setDraftFocus(prev => [...prev, f]);
    setNewFocus('');
  };

  return (
    <div
      onClick={editing ? undefined : onClick}
      className={`group relative rounded-2xl border p-5 transition-all ${
        editing ? 'border-violet-500/60 bg-[#1E1B2E]' :
        isCurrent ? 'cursor-pointer bg-[#1E1B2E] border-violet-500/40 hover:border-violet-500/50' :
        'cursor-pointer bg-[#1A1824] border-[#2A2640] hover:border-violet-500/50'
      }`}>
      {isCurrent && (
        <span className="absolute top-4 right-10 text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/30">
          CURRENT
        </span>
      )}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <span className={`font-black text-3xl ${QUARTER_COLORS[plan.quarterNum]}`}>Q{plan.quarterNum}</span>
          <span className="text-gray-400 ml-2 text-lg font-semibold">{plan.year}</span>
          {!editing && plan.theme && <p className="text-sm text-gray-300 mt-1 font-medium italic">"{plan.theme}"</p>}
        </div>
        <div className="flex items-center gap-1">
          {isCurrent && onQuickUpdate && !editing && (
            <button onClick={openEdit}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-violet-400 transition-all rounded-lg hover:bg-violet-500/10"
              title="Quick edit theme & focus areas">
              <Pencil size={12} />
            </button>
          )}
          {!editing && (
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Quick-edit strip */}
      {editing && (
        <div className="mb-4 space-y-3" onClick={e => e.stopPropagation()}>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Theme</label>
            <input
              autoFocus
              value={draftTheme}
              onChange={e => setDraftTheme(e.target.value)}
              placeholder='e.g. "Foundation", "Scale", "Stabilise"'
              className="w-full px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Focus Areas (max 3)</label>
            <div className="space-y-1.5 mb-2">
              {draftFocus.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12111A] border border-[#2A2640]">
                  <span className="text-xs font-bold text-violet-400 w-3 shrink-0">{i + 1}</span>
                  <span className="text-xs text-gray-200 flex-1">{f}</span>
                  <button onClick={() => setDraftFocus(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-gray-600 hover:text-red-400 transition-colors">
                    <X size={11} />
                  </button>
                </div>
              ))}
              {draftFocus.length < 3 && (
                <div className="flex gap-1.5">
                  <input value={newFocus} onChange={e => setNewFocus(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDraftFocus(); } }}
                    placeholder={`Focus area ${draftFocus.length + 1}…`}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-xs focus:outline-none focus:border-violet-500" />
                  <button onClick={addDraftFocus} disabled={!newFocus.trim()}
                    className="px-2.5 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs font-semibold transition-colors disabled:opacity-40 hover:bg-violet-600/30">
                    Add
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button onClick={saveEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors">
                <Check size={11} /> Save
              </button>
              <button onClick={cancelEdit}
                className="px-3 py-1.5 rounded-lg border border-[#2A2640] text-gray-400 hover:text-gray-200 text-xs font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={onClick}
                className="ml-auto text-xs text-violet-400 hover:text-violet-300 transition-colors">
                Full edit →
              </button>
            </div>
          </div>
        </div>
      )}

      {!editing && plan.focusAreas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {plan.focusAreas.map((f, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-lg bg-[#2A2640] text-gray-300">{f}</span>
          ))}
        </div>
      )}

      {!editing && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {plan.linkedOKRIds.length > 0    && <span className="flex items-center gap-1"><Target size={10} /> {plan.linkedOKRIds.length} OKRs</span>}
            {plan.linkedProjectIds.length > 0 && <span className="flex items-center gap-1"><FolderKanban size={10} /> {plan.linkedProjectIds.length} projects</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: total }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < filled ? 'bg-violet-400' : 'bg-[#2A2640]'}`} />
              ))}
            </div>
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
              {statusCfg.label}
            </span>
          </div>
        </div>
      )}

      {!editing && <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 group-hover:text-violet-400 transition-colors" />}
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface QuarterlyPlanningViewProps {
  plans: QuarterlyPlan[];
  okrs: OKR[];
  projects: Project[];
  onAdd: (p: Omit<QuarterlyPlan, 'id' | 'createdAt'>) => QuarterlyPlan;
  onUpdate: (id: string, updates: Partial<QuarterlyPlan>) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function QuarterlyPlanningView({
  plans, okrs, projects,
  onAdd, onUpdate, onDelete,
  selectedId, onSelect,
}: QuarterlyPlanningViewProps) {
  const [showModal, setShowModal] = useState(false);
  const { quarter: cq } = currentQuarter();

  const sorted = useMemo(() =>
    [...plans].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.quarterNum - a.quarterNum;
    }), [plans]);

  const selected = plans.find(p => p.id === selectedId) ?? null;

  const handleAdd = (data: Omit<QuarterlyPlan, 'id' | 'createdAt'>) => {
    const p = onAdd(data);
    onSelect(p.id);
  };

  if (selected) {
    return (
      <PlanDetail
        plan={selected}
        okrs={okrs}
        projects={projects}
        onBack={() => onSelect(null)}
        onUpdate={u => onUpdate(selected.id, u)}
        isCurrent={selected.quarter === cq}
      />
    );
  }

  const currentPlan = plans.find(p => p.quarter === cq);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Telescope className="text-violet-400" size={24} /> Quarterly Planning
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">Set the agenda for each quarter — focus areas, not-lists, OKRs, and what success looks like</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-all active:scale-95">
          <Plus size={16} /> New Quarter Plan
        </button>
      </div>

      {!currentPlan && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20 shrink-0">
          <Sparkles size={16} className="text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-300">{cq} has no plan yet</p>
            <p className="text-xs text-gray-500 mt-0.5">Set your focus areas and what you're NOT doing this quarter</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-colors">
            Start now
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Telescope size={40} className="text-gray-700 mb-3" />
            <p className="text-gray-500 font-semibold">No quarterly plans yet</p>
            <p className="text-gray-600 text-xs mt-1">A quarterly plan takes 20 minutes and saves you hours of drift</p>
            <button onClick={() => setShowModal(true)}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors">
              <Plus size={14} /> Plan {cq}
            </button>
          </div>
        ) : (
          sorted.map(p => (
            <PlanCard key={p.id} plan={p}
              isCurrent={p.quarter === cq}
              onClick={() => onSelect(p.id)}
              onDelete={() => { if (selectedId === p.id) onSelect(null); onDelete(p.id); }}
              onQuickUpdate={p.quarter === cq ? u => onUpdate(p.id, u) : undefined} />
          ))
        )}
      </div>

      {showModal && (
        <NewPlanModal
          onSave={handleAdd}
          onClose={() => setShowModal(false)}
          existingQuarters={plans.map(p => p.quarter)}
        />
      )}
    </div>
  );
}

// ─── Plan Detail ──────────────────────────────────────────────────────────────

type PlanTab = 'focus' | 'alignment' | 'reflection';

function PlanDetail({ plan, okrs, projects, onBack, onUpdate, isCurrent }: {
  plan: QuarterlyPlan; okrs: OKR[]; projects: Project[];
  onBack: () => void; onUpdate: (u: Partial<QuarterlyPlan>) => void; isCurrent: boolean;
}) {
  const [activeTab, setActiveTab] = useState<PlanTab>('focus');
  const statusCfg = STATUS_CONFIG[plan.status];

  const tabs: { id: PlanTab; label: string }[] = [
    { id: 'focus',      label: 'Focus & Direction' },
    { id: 'alignment',  label: 'OKRs & Projects'   },
    { id: 'reflection', label: plan.status === 'complete' ? 'Reflection' : 'Close Out' },
  ];

  const markActive   = () => onUpdate({ status: 'active' });
  const markComplete = () => onUpdate({ status: 'complete', completedAt: new Date().toISOString() });
  const reopen       = () => onUpdate({ status: 'active', completedAt: undefined });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-3 transition-colors">
          <ChevronRight size={12} className="rotate-180" /> All plans
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`font-black text-4xl ${QUARTER_COLORS[plan.quarterNum]}`}>Q{plan.quarterNum}</span>
              <span className="text-gray-300 text-2xl font-semibold">{plan.year}</span>
              {isCurrent && <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/30">CURRENT</span>}
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                {statusCfg.label}
              </span>
            </div>
            {plan.theme && <p className="text-gray-300 mt-1 italic text-sm">"{plan.theme}"</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {plan.status === 'draft'    && <button onClick={markActive}   className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold transition-colors">Activate</button>}
            {plan.status === 'active'   && <button onClick={markComplete} className="px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 text-xs font-semibold transition-colors">Complete Quarter</button>}
            {plan.status === 'complete' && <button onClick={reopen}       className="px-3 py-2 rounded-xl bg-[#2A2640] text-gray-400 hover:text-gray-200 text-xs font-semibold transition-colors">Reopen</button>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 shrink-0 border-b border-[#2A2640]">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold transition-colors -mb-px ${
              activeTab === t.id ? 'text-violet-300 border-b-2 border-violet-400' : 'text-gray-500 hover:text-gray-300'
            }`}>{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {activeTab === 'focus'      && <FocusTab      plan={plan} onUpdate={onUpdate} />}
        {activeTab === 'alignment'  && <AlignmentTab  plan={plan} okrs={okrs} projects={projects} onUpdate={onUpdate} />}
        {activeTab === 'reflection' && <ReflectionTab plan={plan} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}

// ─── Focus Tab ────────────────────────────────────────────────────────────────

function FocusTab({ plan, onUpdate }: { plan: QuarterlyPlan; onUpdate: (u: Partial<QuarterlyPlan>) => void }) {
  const [newFocus, setNewFocus] = useState('');

  const addFocusArea = () => {
    const f = newFocus.trim();
    if (!f || plan.focusAreas.length >= 3) return;
    onUpdate({ focusAreas: [...plan.focusAreas, f] });
    setNewFocus('');
  };

  const removeFocusArea = (i: number) => {
    onUpdate({ focusAreas: plan.focusAreas.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-6">
      {/* Theme */}
      <Section label="Quarter Theme" subtitle="One word or phrase that captures the spirit of this quarter">
        <input value={plan.theme ?? ''} onChange={e => onUpdate({ theme: e.target.value })}
          placeholder='e.g. "Foundation", "Scale", "Stabilise", "Grow"'
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
      </Section>

      {/* Focus Areas */}
      <Section label="Top 3 Focus Areas" subtitle="The 3 things that matter most this quarter — if nothing else moves, these must">
        <div className="space-y-2 mb-3">
          {plan.focusAreas.map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] group">
              <span className="text-sm font-bold text-violet-400 w-4 shrink-0">{i + 1}</span>
              <span className="text-sm text-white flex-1">{f}</span>
              <button onClick={() => removeFocusArea(i)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                <X size={13} />
              </button>
            </div>
          ))}
          {plan.focusAreas.length < 3 && (
            <div className="flex gap-2">
              <input value={newFocus} onChange={e => setNewFocus(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addFocusArea(); }}
                placeholder={`Focus area ${plan.focusAreas.length + 1}…`}
                className="flex-1 px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
              <button onClick={addFocusArea} disabled={!newFocus.trim()}
                className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-40">Add</button>
            </div>
          )}
        </div>
        {plan.focusAreas.length === 3 && <p className="text-xs text-gray-500">Max 3 focus areas — saying no to #4 is the discipline</p>}
      </Section>

      {/* Not List */}
      <Section label="The Not-List" subtitle="What are you explicitly NOT doing this quarter? Write it down.">
        <textarea value={plan.notList ?? ''} onChange={e => onUpdate({ notList: e.target.value })} rows={4}
          placeholder={"- Not taking on new hires until platform stabilises\n- Not attending anything without a clear agenda\n- Not starting new OKRs until current ones are ≥ 70%"}
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500" />
      </Section>

      {/* Team Priorities */}
      <Section label="What I'm Asking of My Team" subtitle="What do you need your team to deliver or focus on this quarter?">
        <textarea value={plan.teamPriorities ?? ''} onChange={e => onUpdate({ teamPriorities: e.target.value })} rows={3}
          placeholder="e.g. Eng: ship v2 by end of Q · Design: establish component library · PM: reduce backlog by 40%"
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500" />
      </Section>

      {/* Personal Dev */}
      <Section label="Personal Development" subtitle="One leadership or personal growth intention this quarter">
        <textarea value={plan.personalDevelopment ?? ''} onChange={e => onUpdate({ personalDevelopment: e.target.value })} rows={2}
          placeholder="e.g. Improve exec communication — shorter, clearer updates. Practice delegating without micro-managing."
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500" />
      </Section>

      {/* Blockers */}
      <Section label="Potential Blockers" subtitle="What could derail this quarter? Name it now.">
        <textarea value={plan.blockers ?? ''} onChange={e => onUpdate({ blockers: e.target.value })} rows={3}
          placeholder="e.g. Vendor contract delay, key person off in August, exec alignment still unclear on Q3 priority"
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500" />
      </Section>

      {/* Upward Commitments */}
      <Section label="Upward Commitments" subtitle="What have you committed to your manager, board, or investors?">
        <textarea value={plan.upwardCommitments ?? ''} onChange={e => onUpdate({ upwardCommitments: e.target.value })} rows={3}
          placeholder="e.g. Ship platform to 100% users by end of Q · Present hiring plan by week 4 · Hit 80% OKR score"
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500" />
      </Section>

      {/* Success Measures */}
      <Section label="How I'll Know It Was a Good Quarter" subtitle="Personal definition of a successful quarter for you">
        <textarea value={plan.successMeasures ?? ''} onChange={e => onUpdate({ successMeasures: e.target.value })} rows={3}
          placeholder="e.g. OKRs ≥ 70%, team morale strong, inbox under control, I left on time twice a week"
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500" />
      </Section>
    </div>
  );
}

// ─── Alignment Tab ────────────────────────────────────────────────────────────

function AlignmentTab({ plan, okrs, projects, onUpdate }: {
  plan: QuarterlyPlan; okrs: OKR[]; projects: Project[];
  onUpdate: (u: Partial<QuarterlyPlan>) => void;
}) {
  const [okrSearch,     setOkrSearch]     = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  const linkedOKRs     = okrs.filter(o => plan.linkedOKRIds.includes(o.id));
  const linkedProjects = projects.filter(p => plan.linkedProjectIds.includes(p.id));

  const suggestedOKRs = okrs.filter(o =>
    !plan.linkedOKRIds.includes(o.id) &&
    (okrSearch === '' || o.objective.toLowerCase().includes(okrSearch.toLowerCase()) || o.quarter.toLowerCase().includes(okrSearch.toLowerCase()))
  ).slice(0, 5);

  const suggestedProjects = projects.filter(p =>
    !plan.linkedProjectIds.includes(p.id) &&
    !['completed','cancelled'].includes(p.status) &&
    (projectSearch === '' || p.title.toLowerCase().includes(projectSearch.toLowerCase()))
  ).slice(0, 5);

  const toggleOKR     = (id: string) => onUpdate({ linkedOKRIds:     plan.linkedOKRIds.includes(id)     ? plan.linkedOKRIds.filter(x => x !== id)     : [...plan.linkedOKRIds, id]     });
  const toggleProject = (id: string) => onUpdate({ linkedProjectIds: plan.linkedProjectIds.includes(id) ? plan.linkedProjectIds.filter(x => x !== id) : [...plan.linkedProjectIds, id] });

  return (
    <div className="space-y-6">
      {/* OKRs */}
      <Section label="OKRs This Quarter" subtitle="Which objectives are you tracking this quarter?">
        {linkedOKRs.length > 0 && (
          <div className="space-y-2 mb-3">
            {linkedOKRs.map(o => (
              <div key={o.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-medium truncate">{o.objective}</p>
                  <p className="text-xs text-gray-500">{o.quarter} · {o.keyResults.length} KRs</p>
                </div>
                <button onClick={() => toggleOKR(o.id)} className="ml-2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <input value={okrSearch} onChange={e => setOkrSearch(e.target.value)}
          placeholder="Search OKRs to link…"
          className="w-full px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
        {okrSearch && (
          <div className="mt-1.5 space-y-1">
            {suggestedOKRs.length > 0 ? suggestedOKRs.map(o => (
              <button key={o.id} onClick={() => { toggleOKR(o.id); setOkrSearch(''); }}
                className="w-full text-left px-3 py-2 rounded-xl bg-[#1A1824] border border-[#2A2640] hover:border-violet-500/50 text-sm text-gray-300 transition-colors flex items-center gap-2">
                <Plus size={12} className="text-violet-400 shrink-0" /> <span className="truncate">{o.objective}</span>
              </button>
            )) : <p className="text-xs text-gray-600 px-1 mt-1">No matching OKRs</p>}
          </div>
        )}
      </Section>

      {/* Projects */}
      <Section label="Active Projects This Quarter" subtitle="Which initiatives are in flight this quarter?">
        {linkedProjects.length > 0 && (
          <div className="space-y-2 mb-3">
            {linkedProjects.map(p => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-medium truncate">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.status}{p.dueDate ? ` · Due ${p.dueDate}` : ''}</p>
                </div>
                <button onClick={() => toggleProject(p.id)} className="ml-2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <input value={projectSearch} onChange={e => setProjectSearch(e.target.value)}
          placeholder="Search projects to link…"
          className="w-full px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
        {projectSearch && (
          <div className="mt-1.5 space-y-1">
            {suggestedProjects.length > 0 ? suggestedProjects.map(p => (
              <button key={p.id} onClick={() => { toggleProject(p.id); setProjectSearch(''); }}
                className="w-full text-left px-3 py-2 rounded-xl bg-[#1A1824] border border-[#2A2640] hover:border-violet-500/50 text-sm text-gray-300 transition-colors flex items-center gap-2">
                <Plus size={12} className="text-violet-400 shrink-0" /> <span className="truncate">{p.title}</span>
              </button>
            )) : <p className="text-xs text-gray-600 px-1 mt-1">No matching active projects</p>}
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── Reflection Tab ───────────────────────────────────────────────────────────

function ReflectionTab({ plan, onUpdate }: { plan: QuarterlyPlan; onUpdate: (u: Partial<QuarterlyPlan>) => void }) {
  if (plan.status !== 'complete') {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#12111A] border border-[#2A2640]">
          <Circle size={16} className="text-gray-600 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-500">Complete the quarter to unlock the reflection section.</p>
        </div>
        <div className="space-y-3">
          {[
            'What did you actually accomplish?',
            'What did you leave undone — and was that the right call?',
            'What would you do differently?',
            'What do you carry forward into next quarter?',
          ].map(q => (
            <div key={q} className="px-4 py-3 rounded-xl bg-[#1A1824] border border-dashed border-[#2A2640]">
              <p className="text-sm text-gray-600">{q}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-violet-500/5 border border-violet-500/20">
        <CheckCircle2 size={14} className="text-violet-400 shrink-0" />
        <p className="text-xs text-violet-300">Quarter complete{plan.completedAt ? ` · ${plan.completedAt.split('T')[0]}` : ''}</p>
      </div>
      <Section label="Quarter Reflection" subtitle="What happened? What did you learn?">
        <textarea value={plan.reflectionNotes ?? ''} onChange={e => onUpdate({ reflectionNotes: e.target.value })} rows={12}
          placeholder={"What did you actually accomplish?\n\nWhat did you leave undone — and was that the right call?\n\nWhat would you do differently?\n\nWhat do you carry into next quarter?"}
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500 leading-relaxed" />
      </Section>
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function Section({ label, subtitle, children }: { label: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-bold text-white">{label}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
