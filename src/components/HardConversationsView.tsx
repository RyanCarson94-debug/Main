import { useState, useMemo } from 'react';
import {
  MessageSquareWarning, Plus, ChevronRight, Trash2, X,
  CheckCircle2, Circle, AlertCircle,
} from 'lucide-react';
import type { HardConversation, ConversationType, ConversationStatus } from '../types';

// ─── Config ───────────────────────────────────────────────────────────────────

const CONV_TYPE_CONFIG: Record<ConversationType, { label: string; color: string; bg: string; border: string }> = {
  'feedback-positive':     { label: 'Positive Feedback',  color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  'feedback-constructive': { label: 'Constructive Feedback', color: 'text-amber-300',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30'  },
  'performance-issue':     { label: 'Performance Issue',  color: 'text-red-300',     bg: 'bg-red-500/10',    border: 'border-red-500/30'    },
  'role-change':           { label: 'Role Change',        color: 'text-violet-300',  bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
  'conflict-resolution':   { label: 'Conflict',           color: 'text-orange-300',  bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  'stakeholder-pushback':  { label: 'Stakeholder Pushback', color: 'text-sky-300',   bg: 'bg-sky-500/10',    border: 'border-sky-500/30'    },
  'letting-go':            { label: 'Letting Go',          color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/40'    },
  'boundary-setting':      { label: 'Boundary Setting',   color: 'text-indigo-300',  bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  'difficult-ask':         { label: 'Difficult Ask',      color: 'text-pink-300',    bg: 'bg-pink-500/10',   border: 'border-pink-500/30'   },
  'other':                 { label: 'Other',               color: 'text-gray-300',   bg: 'bg-gray-500/10',   border: 'border-gray-500/30'   },
};

const STATUS_CONFIG: Record<ConversationStatus, { label: string; color: string; bg: string; border: string }> = {
  'planning':  { label: 'Planning',   color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30'   },
  'ready':     { label: 'Ready',      color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  'had':       { label: 'Had',        color: 'text-violet-300',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30'  },
  'postponed': { label: 'Postponed',  color: 'text-gray-400',    bg: 'bg-gray-500/10',    border: 'border-gray-500/30'    },
};

// ─── Readiness helpers ────────────────────────────────────────────────────────

const PREP_FIELDS: Array<{ key: keyof HardConversation; label: string }> = [
  { key: 'context',              label: 'Context set'          },
  { key: 'desiredOutcome',       label: 'Outcome defined'      },
  { key: 'openingLine',          label: 'Opening prepared'     },
  { key: 'keyPoints',            label: 'Key points listed'    },
  { key: 'anticipatedReaction',  label: 'Reaction anticipated' },
  { key: 'yourResponse',         label: 'Response planned'     },
];

function readiness(c: HardConversation): number {
  return PREP_FIELDS.filter(f => !!c[f.key]).length;
}

// ─── New / Edit Modal ─────────────────────────────────────────────────────────

interface ConvModalProps {
  onSave: (c: Omit<HardConversation, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  editConv?: HardConversation | null;
}

function ConvModal({ onSave, onClose, editConv }: ConvModalProps) {
  const [title,      setTitle]      = useState(editConv?.title       ?? '');
  const [type,       setType]       = useState<ConversationType>(editConv?.type ?? 'feedback-constructive');
  const [person,     setPerson]     = useState(editConv?.person      ?? '');
  const [targetDate, setTargetDate] = useState(editConv?.targetDate  ?? '');
  const [status,     setStatus]     = useState<ConversationStatus>(editConv?.status ?? 'planning');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      type,
      person:     person.trim() || undefined,
      targetDate: targetDate    || undefined,
      status,
      context:             editConv?.context             ?? '',
      desiredOutcome:      editConv?.desiredOutcome      ?? '',
      openingLine:         editConv?.openingLine         ?? '',
      keyPoints:           editConv?.keyPoints           ?? '',
      anticipatedReaction: editConv?.anticipatedReaction ?? '',
      yourResponse:        editConv?.yourResponse        ?? '',
      actualOutcome:       editConv?.actualOutcome,
      followUpActions:     editConv?.followUpActions,
      hadAt:               editConv?.hadAt,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1824] border border-[#2A2640] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2640]">
          <h2 className="text-base font-bold text-white">{editConv ? 'Edit Conversation' : 'New Hard Conversation'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">What is this about? *</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Performance talk with Jamie, Pushback from Exec team on roadmap"
              className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Type</label>
              <select value={type} onChange={e => setType(e.target.value as ConversationType)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-sm focus:outline-none focus:border-violet-500">
                {(Object.keys(CONV_TYPE_CONFIG) as ConversationType[]).map(t => (
                  <option key={t} value={t}>{CONV_TYPE_CONFIG[t].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Person</label>
              <input value={person} onChange={e => setPerson(e.target.value)} placeholder="Who is it with?"
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Target Date</label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-sm focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as ConversationStatus)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-sm focus:outline-none focus:border-violet-500">
                {(Object.keys(STATUS_CONFIG) as ConversationStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#2A2640] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#2A2640] text-gray-400 hover:text-gray-200 text-sm font-semibold transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!title.trim()}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {editConv ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Conversation Card ────────────────────────────────────────────────────────

function ConvCard({ conv, onClick, onDelete }: {
  conv: HardConversation; onClick: () => void; onDelete: () => void;
}) {
  const typeCfg   = CONV_TYPE_CONFIG[conv.type];
  const statusCfg = STATUS_CONFIG[conv.status];
  const ready     = readiness(conv);
  const today     = new Date().toISOString().split('T')[0];
  const isOverdue = conv.targetDate && conv.targetDate < today && conv.status !== 'had';

  return (
    <div onClick={onClick}
      className={`group relative bg-[#1A1824] border rounded-2xl p-4 cursor-pointer hover:border-violet-500/50 transition-all ${
        isOverdue ? 'border-amber-500/30' : 'border-[#2A2640]'
      }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${typeCfg.bg} ${typeCfg.color} ${typeCfg.border}`}>
              {typeCfg.label}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
              {statusCfg.label}
            </span>
            {isOverdue && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">OVERDUE</span>}
          </div>
          <h3 className="font-semibold text-white text-sm leading-snug">{conv.title}</h3>
          {conv.person && <p className="text-xs text-gray-500 mt-0.5">with {conv.person}</p>}
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 shrink-0 p-1 text-gray-600 hover:text-red-400 transition-all">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {conv.targetDate && (
          <span className={`text-xs ${isOverdue ? 'text-amber-400' : 'text-gray-500'}`}>
            {conv.status === 'had' ? 'Had' : 'Target'}: {conv.targetDate}
          </span>
        )}
        {/* Readiness bar */}
        {conv.status !== 'had' && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {PREP_FIELDS.map(f => (
                <div key={f.key} className={`w-2 h-2 rounded-full ${conv[f.key] ? 'bg-violet-400' : 'bg-[#2A2640]'}`} />
              ))}
            </div>
            <span className={`text-xs ${ready >= 5 ? 'text-emerald-400' : ready >= 3 ? 'text-amber-400' : 'text-gray-500'}`}>
              {ready}/6 ready
            </span>
          </div>
        )}
      </div>

      <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 group-hover:text-violet-400 transition-colors" />
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface HardConversationsViewProps {
  conversations: HardConversation[];
  onAdd: (c: Omit<HardConversation, 'id' | 'createdAt'>) => HardConversation;
  onUpdate: (id: string, updates: Partial<HardConversation>) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

type TabFilter = 'planning' | 'ready' | 'had';

export function HardConversationsView({
  conversations, onAdd, onUpdate, onDelete, selectedId, onSelect,
}: HardConversationsViewProps) {
  const [tab,       setTab]       = useState<TabFilter>('planning');
  const [showModal, setShowModal] = useState(false);
  const [editConv,  setEditConv]  = useState<HardConversation | null>(null);

  const lists = useMemo(() => ({
    planning: conversations.filter(c => c.status === 'planning' || c.status === 'postponed'),
    ready:    conversations.filter(c => c.status === 'ready'),
    had:      conversations.filter(c => c.status === 'had').sort((a, b) => (b.hadAt ?? b.createdAt).localeCompare(a.hadAt ?? a.createdAt)),
  }), [conversations]);

  const selected = conversations.find(c => c.id === selectedId) ?? null;

  const handleAdd = (data: Omit<HardConversation, 'id' | 'createdAt'>) => {
    const c = onAdd(data);
    onSelect(c.id);
  };

  const handleEdit = (data: Omit<HardConversation, 'id' | 'createdAt'>) => {
    if (!editConv) return;
    onUpdate(editConv.id, data);
    setEditConv(null);
  };

  if (selected) {
    return (
      <>
        <ConversationDetail
          conv={selected}
          onBack={() => onSelect(null)}
          onUpdate={updates => onUpdate(selected.id, updates)}
          onEdit={() => setEditConv(selected)}
        />
        {editConv && <ConvModal editConv={editConv} onSave={handleEdit} onClose={() => setEditConv(null)} />}
      </>
    );
  }

  const current = lists[tab];
  const totalOpen = lists.planning.length + lists.ready.length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <MessageSquareWarning className="text-amber-400" size={24} /> Hard Conversations
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">Prep, structure, and follow through on the conversations you're avoiding</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-all active:scale-95">
          <Plus size={16} /> New Conversation
        </button>
      </div>

      {conversations.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5 shrink-0">
          {[
            { label: 'Needs Prep',  value: lists.planning.length, color: 'text-amber-300' },
            { label: 'Ready to Have', value: lists.ready.length,  color: 'text-emerald-300' },
            { label: 'Completed',   value: lists.had.length,      color: 'text-violet-300' },
          ].map(s => (
            <div key={s.label} className="bg-[#1A1824] border border-[#2A2640] rounded-xl px-4 py-3 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {totalOpen > 0 && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 shrink-0">
          <AlertCircle size={14} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">
            <span className="font-bold">{totalOpen}</span> conversation{totalOpen !== 1 ? 's' : ''} waiting — the longer you wait, the harder they get
          </p>
        </div>
      )}

      <div className="flex gap-1 mb-4 shrink-0">
        {([
          { id: 'planning', label: `Planning / Postponed (${lists.planning.length})` },
          { id: 'ready',    label: `Ready (${lists.ready.length})` },
          { id: 'had',      label: `Had (${lists.had.length})` },
        ] as { id: TabFilter; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}>{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {current.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageSquareWarning size={40} className="text-gray-700 mb-3" />
            <p className="text-gray-500 font-semibold">
              {tab === 'planning' ? 'No conversations being planned' :
               tab === 'ready'    ? 'None marked as ready yet' :
                                    'No conversations logged yet'}
            </p>
            {tab === 'planning' && (
              <button onClick={() => setShowModal(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors">
                <Plus size={14} /> Add one you've been putting off
              </button>
            )}
          </div>
        ) : (
          current.map(c => (
            <ConvCard key={c.id} conv={c} onClick={() => onSelect(c.id)}
              onDelete={() => { if (selectedId === c.id) onSelect(null); onDelete(c.id); }} />
          ))
        )}
      </div>

      {showModal && <ConvModal onSave={handleAdd} onClose={() => setShowModal(false)} />}
      {editConv  && <ConvModal editConv={editConv} onSave={handleEdit} onClose={() => setEditConv(null)} />}
    </div>
  );
}

// ─── Conversation Detail ──────────────────────────────────────────────────────

type ConvTab = 'prep' | 'outcome';

function ConversationDetail({ conv, onBack, onUpdate, onEdit }: {
  conv: HardConversation;
  onBack: () => void;
  onUpdate: (u: Partial<HardConversation>) => void;
  onEdit: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ConvTab>('prep');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState('');

  const typeCfg   = CONV_TYPE_CONFIG[conv.type];
  const statusCfg = STATUS_CONFIG[conv.status];
  const ready     = readiness(conv);
  const today     = new Date().toISOString().split('T')[0];
  const isOverdue = conv.targetDate && conv.targetDate < today && conv.status !== 'had';

  const handleAIPrep = async () => {
    if (aiLoading) return;
    setAiLoading(true); setAiError('');
    try {
      const { generateConversationPrep } = await import('../services/claudeApi');
      const result = await generateConversationPrep(conv);
      // Parse the returned sections and fill in empty fields
      onUpdate(result);
    } catch {
      setAiError('AI prep failed. Check your API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const markReady = () => onUpdate({ status: 'ready' });
  const markHad   = () => onUpdate({ status: 'had', hadAt: new Date().toISOString().split('T')[0] });
  const reopen    = () => onUpdate({ status: 'planning', hadAt: undefined });

  const tabs: { id: ConvTab; label: string }[] = [
    { id: 'prep',    label: 'Preparation' },
    { id: 'outcome', label: conv.status === 'had' ? 'Outcome' : 'Post-Conversation' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-3 transition-colors">
          <ChevronRight size={12} className="rotate-180" /> All conversations
        </button>
        <div className="flex items-start gap-4 justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${typeCfg.bg} ${typeCfg.color} ${typeCfg.border}`}>
                {typeCfg.label}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                {statusCfg.label}
              </span>
              {isOverdue && <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30">OVERDUE</span>}
            </div>
            <h2 className="text-xl font-black text-white leading-tight">{conv.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
              {conv.person && <span>With: {conv.person}</span>}
              {conv.targetDate && <span className={isOverdue ? 'text-amber-400' : ''}>{conv.status === 'had' ? 'Had' : 'Target'}: {conv.targetDate}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {conv.status === 'planning' && (
              <button onClick={markReady}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold transition-colors">
                <CheckCircle2 size={13} /> Mark Ready
              </button>
            )}
            {conv.status === 'ready' && (
              <button onClick={markHad}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 text-xs font-semibold transition-colors">
                <CheckCircle2 size={13} /> Had It
              </button>
            )}
            {conv.status === 'had' && (
              <button onClick={reopen}
                className="px-3 py-2 rounded-xl bg-[#2A2640] text-gray-400 hover:text-gray-200 text-xs font-semibold transition-colors">
                Reopen
              </button>
            )}
            {(conv.status === 'planning' || conv.status === 'postponed') && (
              <button onClick={() => onUpdate({ status: 'postponed' })}
                className="px-3 py-2 rounded-xl bg-[#2A2640] text-gray-500 hover:text-amber-400 text-xs font-semibold transition-colors">
                Postpone
              </button>
            )}
            <button onClick={onEdit} className="px-3 py-2 rounded-xl border border-[#2A2640] text-gray-400 hover:text-gray-200 text-xs font-semibold transition-colors">Edit</button>
          </div>
        </div>

        {/* Readiness indicator */}
        {conv.status !== 'had' && (
          <div className="mt-3 flex items-center gap-3 px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640]">
            <div className="flex gap-1">
              {PREP_FIELDS.map(f => (
                <div key={f.key} title={f.label}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${conv[f.key] ? 'bg-violet-400' : 'bg-[#2A2640]'}`} />
              ))}
            </div>
            <span className={`text-xs font-semibold ${ready >= 5 ? 'text-emerald-400' : ready >= 3 ? 'text-amber-400' : 'text-gray-500'}`}>
              {ready}/6 prep sections complete
            </span>
            {ready === 6 && conv.status !== 'ready' && (
              <button onClick={markReady} className="ml-auto text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                Mark as Ready →
              </button>
            )}
          </div>
        )}
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
        {activeTab === 'prep' && (
          <PrepTab conv={conv} onUpdate={onUpdate} onAIPrep={handleAIPrep} aiLoading={aiLoading} aiError={aiError} />
        )}
        {activeTab === 'outcome' && (
          <OutcomeTab conv={conv} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  );
}

// ─── Prep Tab ─────────────────────────────────────────────────────────────────

function PrepTab({ conv, onUpdate, onAIPrep, aiLoading, aiError }: {
  conv: HardConversation;
  onUpdate: (u: Partial<HardConversation>) => void;
  onAIPrep: () => void;
  aiLoading: boolean;
  aiError: string;
}) {
  const prepSections: Array<{
    key: keyof HardConversation;
    label: string;
    subtitle: string;
    placeholder: string;
    rows: number;
  }> = [
    {
      key: 'context',
      label: 'Context',
      subtitle: 'What has happened? Why does this conversation need to happen?',
      placeholder: 'Describe the background, specific incidents, and why this matters…',
      rows: 3,
    },
    {
      key: 'desiredOutcome',
      label: 'Desired Outcome',
      subtitle: 'What do you want to leave this conversation with?',
      placeholder: 'e.g. Agreement on a performance improvement plan, mutual understanding of the issue, a clear decision…',
      rows: 2,
    },
    {
      key: 'openingLine',
      label: 'Opening Line',
      subtitle: 'How will you start? The first sentence sets the tone.',
      placeholder: 'e.g. "I want to talk about something important — I care about your growth and I want to be direct…"',
      rows: 2,
    },
    {
      key: 'keyPoints',
      label: 'Key Points',
      subtitle: 'The 2–4 things you must get across, in order of priority',
      placeholder: '1. The specific behavior/situation\n2. The impact it\'s having\n3. What needs to change\n4. Support available',
      rows: 4,
    },
    {
      key: 'anticipatedReaction',
      label: 'Anticipated Reaction',
      subtitle: 'How might they respond? What\'s your read on their emotional state?',
      placeholder: 'e.g. Defensive, surprised, emotional, dismissive — and why you think that…',
      rows: 3,
    },
    {
      key: 'yourResponse',
      label: 'Your Response Plan',
      subtitle: 'How will you handle pushback, deflection, or escalation?',
      placeholder: 'e.g. "If they get defensive I\'ll acknowledge the emotion first, then redirect to the facts…"',
      rows: 3,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Work through each section before having the conversation</p>
        <button onClick={onAIPrep} disabled={aiLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 text-xs font-semibold transition-colors disabled:opacity-50">
          {aiLoading ? 'Generating…' : '✦ AI Prep'}
        </button>
      </div>
      {aiError && <p className="text-xs text-red-400">{aiError}</p>}
      {prepSections.map(s => (
        <div key={s.key}>
          <div className="flex items-center gap-2 mb-1.5">
            {conv[s.key]
              ? <CheckCircle2 size={13} className="text-violet-400 shrink-0" />
              : <Circle      size={13} className="text-gray-600 shrink-0" />}
            <div>
              <p className="text-sm font-bold text-white">{s.label}</p>
              <p className="text-xs text-gray-500">{s.subtitle}</p>
            </div>
          </div>
          <textarea
            value={(conv[s.key] as string | undefined) ?? ''}
            onChange={e => onUpdate({ [s.key]: e.target.value })}
            rows={s.rows}
            placeholder={s.placeholder}
            className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500 leading-relaxed"
          />
        </div>
      ))}
    </div>
  );
}

// ─── Outcome Tab ─────────────────────────────────────────────────────────────

function OutcomeTab({ conv, onUpdate }: {
  conv: HardConversation;
  onUpdate: (u: Partial<HardConversation>) => void;
}) {
  if (conv.status !== 'had') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Circle size={36} className="text-gray-700 mb-3" />
        <p className="text-gray-500 font-semibold">Not yet had</p>
        <p className="text-gray-600 text-xs mt-1">Once you've had the conversation, come back here to log what happened</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold text-white mb-0.5">Actual Outcome</p>
        <p className="text-xs text-gray-500 mb-2">What actually happened? How did they respond?</p>
        <textarea value={conv.actualOutcome ?? ''} onChange={e => onUpdate({ actualOutcome: e.target.value })} rows={4}
          placeholder="How did the conversation go? What was their reaction? Did you achieve your desired outcome?"
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500" />
      </div>
      <div>
        <p className="text-sm font-bold text-white mb-0.5">Follow-up Actions</p>
        <p className="text-xs text-gray-500 mb-2">What commitments were made? What needs to happen next?</p>
        <textarea value={conv.followUpActions ?? ''} onChange={e => onUpdate({ followUpActions: e.target.value })} rows={4}
          placeholder="e.g. Check-in in 2 weeks, send written summary, schedule follow-up…"
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500" />
      </div>
      {conv.hadAt && (
        <p className="text-xs text-gray-600">Logged: {conv.hadAt}</p>
      )}
    </div>
  );
}
