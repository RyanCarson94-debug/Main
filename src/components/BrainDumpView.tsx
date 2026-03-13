import { useState, useRef, useEffect } from 'react';
import {
  BrainCircuit, Plus, Sparkles, Loader2, AlertCircle,
  CheckSquare, Lightbulb, Archive, Trash2,
  Check, X, ChevronDown,
} from 'lucide-react';
import type { DumpItem, DumpItemStatus, Task, QuadrantId, Priority } from '../types';
import { QUADRANTS, PRIORITY_CONFIG } from '../types';
import { triageDumpItems } from '../services/claudeApi';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DumpItemStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  inbox:    { label: 'Inbox',    color: 'text-gray-400',    bg: 'bg-gray-500/10',    border: 'border-gray-500/20',    icon: <BrainCircuit size={11} /> },
  task:     { label: 'Task',     color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <CheckSquare size={11} /> },
  idea:     { label: 'Idea',     color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: <Lightbulb size={11} /> },
  archived: { label: 'Archived', color: 'text-gray-600',    bg: 'bg-gray-500/5',     border: 'border-gray-500/10',    icon: <Archive size={11} /> },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface BrainDumpViewProps {
  items: DumpItem[];
  onAdd: (content: string) => void;
  onUpdate: (id: string, updates: Partial<DumpItem>) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: DumpItemStatus) => void;
  onConvertToTask: (dumpId: string, task: Omit<Task, 'id' | 'createdAt'>) => void;
  onClearInbox: () => void;
}

// ─── Convert-to-task inline form ─────────────────────────────────────────────

function ConvertToTaskForm({
  item,
  onConvert,
  onCancel,
}: {
  item: DumpItem;
  onConvert: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const suggestion = item.aiSuggestion;
  const [quadrant, setQuadrant] = useState<QuadrantId>(suggestion?.quadrant ?? 'schedule');
  const [priority, setPriority] = useState<Priority>(suggestion?.priority ?? 'medium');
  const [title, setTitle] = useState(item.content.length > 80 ? item.content.slice(0, 80) : item.content);

  const submit = () => {
    if (!title.trim()) return;
    onConvert({
      title: title.trim(),
      quadrant,
      priority,
      column: 'backlog',
      tags: [],
    });
  };

  return (
    <div className="mt-3 p-3 rounded-xl bg-[#141417] border border-white/10 space-y-3">
      {/* Title */}
      <div>
        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Task Title</label>
        <input
          autoFocus
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          className="w-full px-2.5 py-2 rounded-lg bg-[#1C1C1F] border border-[#2C2C30] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
        />
      </div>

      {/* Quadrant */}
      <div>
        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1.5">Quadrant</label>
        <div className="grid grid-cols-2 gap-1">
          {(Object.keys(QUADRANTS) as QuadrantId[]).map(q => (
            <button
              key={q}
              onClick={() => setQuadrant(q)}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all border text-left ${
                quadrant === q
                  ? `${QUADRANTS[q].bg} ${QUADRANTS[q].color} ${QUADRANTS[q].border}`
                  : 'bg-white/5 text-gray-500 border-white/5 hover:text-gray-300'
              }`}
            >
              {QUADRANTS[q].label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1.5">Priority</label>
        <div className="flex gap-1">
          {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                priority === p
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/5 border-white/5 text-gray-600 hover:text-gray-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
              {PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-white bg-white/5 border border-white/5 transition-colors">
          <X size={11} /> Cancel
        </button>
        <button
          onClick={submit}
          disabled={!title.trim()}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors disabled:opacity-40"
        >
          <CheckSquare size={12} /> Create Task
        </button>
      </div>
    </div>
  );
}

// ─── Single dump item card ────────────────────────────────────────────────────

function DumpCard({
  item,
  onDelete,
  onSetStatus,
  onConvertToTask,
}: {
  item: DumpItem;
  onDelete: () => void;
  onSetStatus: (s: DumpItemStatus) => void;
  onConvertToTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}) {
  const [converting, setConverting] = useState(false);
  const statusCfg = STATUS_CONFIG[item.status];
  const suggestion = item.aiSuggestion;

  const date = new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      item.status === 'archived' ? 'bg-white/[0.015] border-white/5 opacity-50' :
      item.status === 'task' ? 'bg-emerald-500/5 border-emerald-500/15' :
      item.status === 'idea' ? 'bg-blue-500/5 border-blue-500/15' :
      'bg-[#1C1C1F] border-[#2C2C30]'
    }`}>
      {/* Status badge + date */}
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
          {statusCfg.icon}
          {statusCfg.label}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-gray-700">{date}</span>
          <button onClick={onDelete} className="p-1 rounded text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-200 leading-relaxed mb-3">{item.content}</p>

      {/* AI suggestion pill */}
      {suggestion && item.status === 'inbox' && (
        <div className={`flex items-start gap-2 p-2.5 rounded-lg mb-3 text-xs border ${
          suggestion.type === 'task'    ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' :
          suggestion.type === 'idea'   ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' :
                                         'bg-gray-500/10 border-gray-500/20 text-gray-500'
        }`}>
          <Sparkles size={11} className="shrink-0 mt-0.5" />
          <span>
            <span className="font-bold uppercase tracking-wider">
              {suggestion.type === 'task' ? `→ Task · ${QUADRANTS[suggestion.quadrant!]?.shortLabel} · ${PRIORITY_CONFIG[suggestion.priority!]?.label}` :
               suggestion.type === 'idea' ? '→ Idea' : '→ Discard'}
            </span>
            {' '}{suggestion.reasoning}
          </span>
        </div>
      )}

      {/* Convert to task form */}
      {converting && (
        <ConvertToTaskForm
          item={item}
          onConvert={task => { onConvertToTask(task); setConverting(false); }}
          onCancel={() => setConverting(false)}
        />
      )}

      {/* Actions */}
      {item.status === 'inbox' && !converting && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setConverting(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-300 border border-white/10 hover:bg-purple-600/30 transition-colors"
          >
            <CheckSquare size={11} /> Make Task
          </button>
          <button
            onClick={() => onSetStatus('idea')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
          >
            <Lightbulb size={11} /> Park as Idea
          </button>
          <button
            onClick={() => onSetStatus('archived')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-500/10 text-gray-500 border border-gray-500/15 hover:text-gray-400 transition-colors"
          >
            <Archive size={11} /> Archive
          </button>
        </div>
      )}

      {/* Converted task link */}
      {item.status === 'task' && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-500">
          <Check size={11} /> Added to Task Board
        </div>
      )}
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function BrainDumpView({
  items,
  onAdd,
  onUpdate,
  onDelete,
  onSetStatus,
  onConvertToTask,
  onClearInbox,
}: BrainDumpViewProps) {
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<'inbox' | 'ideas' | 'done'>('inbox');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus capture area on mount
  useEffect(() => { textareaRef.current?.focus(); }, []);

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const capture = () => {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    lines.forEach(line => onAdd(line));
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setTab('inbox');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter to capture
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      capture();
    }
  };

  const handleAiTriage = async () => {
    const inboxItems = items.filter(i => i.status === 'inbox' && !i.aiSuggestion);
    if (inboxItems.length === 0) return;
    setAiLoading(true);
    setAiError(null);
    await triageDumpItems(
      inboxItems,
      suggestions => {
        Object.entries(suggestions).forEach(([id, suggestion]) => {
          onUpdate(id, { aiSuggestion: suggestion });
        });
        setAiLoading(false);
      },
      err => { setAiError(err); setAiLoading(false); },
    );
  };

  const inbox = items.filter(i => i.status === 'inbox');
  const ideas = items.filter(i => i.status === 'idea');
  const done = items.filter(i => i.status === 'task' || i.status === 'archived');
  const untriaged = inbox.filter(i => !i.aiSuggestion).length;

  const activeList = tab === 'inbox' ? inbox : tab === 'ideas' ? ideas : done;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BrainCircuit size={20} className="text-purple-400" />
          <h1 className="text-xl font-black text-white">Brain Dump</h1>
        </div>
        <div className="flex items-center gap-2">
          {inbox.length > 0 && (
            <button
              onClick={handleAiTriage}
              disabled={aiLoading || untriaged === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-300 border border-white/10 hover:bg-purple-600/30 transition-colors disabled:opacity-40"
            >
              {aiLoading
                ? <><Loader2 size={12} className="animate-spin" /> Triaging…</>
                : <><Sparkles size={12} /> AI Triage {untriaged > 0 ? `(${untriaged})` : ''}</>
              }
            </button>
          )}
          {inbox.length > 0 && (
            <button
              onClick={onClearInbox}
              className="text-xs text-gray-600 hover:text-red-400 transition-colors"
              title="Archive all inbox items"
            >
              Clear inbox
            </button>
          )}
        </div>
      </div>

      {/* Capture area */}
      <div className="shrink-0 rounded-2xl bg-[#1C1C1F] border border-[#2C2C30] focus-within:border-purple-500/50 transition-colors">
        <textarea
          ref={textareaRef}
          placeholder="Dump it here… anything on your mind. One thought per line or a wall of text — doesn't matter.&#10;&#10;Press Cmd+Enter (or the button below) to capture."
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={3}
          className="w-full px-4 pt-4 pb-2 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none resize-none leading-relaxed"
          style={{ minHeight: '80px' }}
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <p className="text-[11px] text-gray-700">
            {input.trim()
              ? `${input.split('\n').filter(l => l.trim()).length} item${input.split('\n').filter(l => l.trim()).length !== 1 ? 's' : ''} · ⌘↵ to capture`
              : 'Each line becomes a separate item'
            }
          </p>
          <button
            onClick={capture}
            disabled={!input.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-30"
          >
            <Plus size={13} /> Capture
          </button>
        </div>
      </div>

      {aiError && (
        <div className="shrink-0 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle size={13} className="shrink-0 text-red-400 mt-0.5" />
          <p className="text-xs text-red-400">{aiError}</p>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 shrink-0">
        {([
          { id: 'inbox', label: 'Inbox', count: inbox.length },
          { id: 'ideas', label: 'Ideas', count: ideas.length },
          { id: 'done', label: 'Processed', count: done.length },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === t.id
                ? 'bg-purple-600/30 text-purple-200 border border-white/10'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-purple-500/30 text-purple-300' : 'bg-white/10 text-gray-500'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pb-4">
        {activeList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BrainCircuit size={32} className="text-gray-700 mb-3" />
            {tab === 'inbox' && <p className="text-sm font-semibold text-gray-600">Inbox is clear — nice.</p>}
            {tab === 'ideas' && <p className="text-sm font-semibold text-gray-600">No ideas parked yet.</p>}
            {tab === 'done' && <p className="text-sm font-semibold text-gray-600">Nothing processed yet.</p>}
          </div>
        )}

        {tab === 'inbox' && inbox.length > 0 && (
          <div className="flex items-center justify-between px-1 mb-1">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
              {inbox.length} item{inbox.length !== 1 ? 's' : ''} to process
            </p>
            {untriaged > 0 && !aiLoading && (
              <button onClick={handleAiTriage} className="text-[11px] text-purple-500 hover:text-purple-300 flex items-center gap-1 transition-colors">
                <Sparkles size={10} /> Let AI sort these
              </button>
            )}
          </div>
        )}

        {tab === 'ideas' && ideas.length > 0 && (
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1 mb-1">
            Parked ideas — revisit when ready
          </p>
        )}

        {tab !== 'done' && activeList.map(item => (
          <DumpCard
            key={item.id}
            item={item}
            onDelete={() => onDelete(item.id)}
            onSetStatus={s => onSetStatus(item.id, s)}
            onConvertToTask={task => onConvertToTask(item.id, task)}
          />
        ))}

        {tab === 'done' && done.length > 0 && (
          <>
            {/* Tasks */}
            {done.filter(i => i.status === 'task').length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <CheckSquare size={11} /> Converted to Tasks
                </p>
                {done.filter(i => i.status === 'task').map(item => (
                  <DumpCard
                    key={item.id}
                    item={item}
                    onDelete={() => onDelete(item.id)}
                    onSetStatus={s => onSetStatus(item.id, s)}
                    onConvertToTask={task => onConvertToTask(item.id, task)}
                          />
                ))}
              </div>
            )}
            {/* Archived */}
            {done.filter(i => i.status === 'archived').length > 0 && (
              <div>
                <button
                  onClick={() => setShowDone(s => !s)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-gray-700 uppercase tracking-widest px-1 mb-2 hover:text-gray-500 transition-colors"
                >
                  <ChevronDown size={12} className={`transition-transform ${showDone ? 'rotate-180' : ''}`} />
                  Archived ({done.filter(i => i.status === 'archived').length})
                </button>
                {showDone && done.filter(i => i.status === 'archived').map(item => (
                  <DumpCard
                    key={item.id}
                    item={item}
                    onDelete={() => onDelete(item.id)}
                    onSetStatus={s => onSetStatus(item.id, s)}
                    onConvertToTask={task => onConvertToTask(item.id, task)}
                          />
                ))}
              </div>
            )}
          </>
        )}

        {/* Idea→Task shortcut in ideas tab */}
        {tab === 'ideas' && ideas.map(item => (
          <DumpCard
            key={item.id}
            item={item}
            onDelete={() => onDelete(item.id)}
            onSetStatus={s => onSetStatus(item.id, s)}
            onConvertToTask={task => onConvertToTask(item.id, task)}
          />
        ))}
      </div>
    </div>
  );
}
