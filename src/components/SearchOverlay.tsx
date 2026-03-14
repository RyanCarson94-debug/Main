import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, CheckSquare, BookMarked, Target, Zap, BrainCircuit, CalendarCheck } from 'lucide-react';
import type {
  Task, Decision, Commitment, Update, WeeklyReview, OKR, DumpItem, View,
} from '../types';
import { PRIORITY_CONFIG, ENERGY_CONFIG } from '../types';

// ─── Result types ─────────────────────────────────────────────────────────────

type ResultType = 'task' | 'decision' | 'commitment' | 'update' | 'review' | 'okr' | 'dump';

interface SearchResult {
  type: ResultType;
  id: string;
  title: string;
  subtitle?: string;
  navigateTo: View;
  data: Task | Decision | Commitment | Update | WeeklyReview | OKR | DumpItem;
}

const TYPE_META: Record<ResultType, { label: string; icon: React.ReactNode; color: string }> = {
  task:       { label: 'Task',          icon: <Zap size={12} />,          color: 'text-purple-400' },
  decision:   { label: 'Decision',      icon: <BookMarked size={12} />,   color: 'text-pink-400' },
  commitment: { label: 'Commitment',    icon: <CheckSquare size={12} />,  color: 'text-amber-400' },
  update:     { label: '1:1 Update',    icon: <CalendarCheck size={12} />, color: 'text-blue-400' },
  review:     { label: 'Weekly Review', icon: <CalendarCheck size={12} />, color: 'text-emerald-400' },
  okr:        { label: 'OKR',           icon: <Target size={12} />,       color: 'text-red-400' },
  dump:       { label: 'Brain Dump',    icon: <BrainCircuit size={12} />, color: 'text-gray-400' },
};

// ─── Search engine ────────────────────────────────────────────────────────────

function searchAll(
  query: string,
  data: {
    tasks: Task[];
    decisions: Decision[];
    commitments: Commitment[];
    updates: Update[];
    weeklyReviews: WeeklyReview[];
    okrs: OKR[];
    dumpItems: DumpItem[];
  },
): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  data.tasks.forEach(t => {
    if (
      t.title.toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    ) {
      results.push({
        type: 'task',
        id: t.id,
        title: t.title,
        subtitle: [PRIORITY_CONFIG[t.priority].label, t.energy ? ENERGY_CONFIG[t.energy].label : undefined].filter(Boolean).join(' · '),
        navigateTo: 'kanban',
        data: t,
      });
    }
  });

  data.decisions.forEach(d => {
    if (
      d.title.toLowerCase().includes(q) ||
      d.context.toLowerCase().includes(q) ||
      d.decision.toLowerCase().includes(q) ||
      (d.people ?? '').toLowerCase().includes(q)
    ) {
      results.push({
        type: 'decision',
        id: d.id,
        title: d.title,
        subtitle: d.decision.slice(0, 60) + (d.decision.length > 60 ? '…' : ''),
        navigateTo: 'decision-log',
        data: d,
      });
    }
  });

  data.commitments.forEach(c => {
    if (c.what.toLowerCase().includes(q) || c.to.toLowerCase().includes(q)) {
      results.push({
        type: 'commitment',
        id: c.id,
        title: c.what,
        subtitle: `to ${c.to}${c.dueDate ? ` · due ${new Date(c.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}`,
        navigateTo: 'decision-log',
        data: c,
      });
    }
  });

  data.updates.forEach(u => {
    if (u.content.toLowerCase().includes(q)) {
      results.push({
        type: 'update',
        id: u.id,
        title: u.content.slice(0, 70) + (u.content.length > 70 ? '…' : ''),
        subtitle: new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        navigateTo: 'updates',
        data: u,
      });
    }
  });

  data.weeklyReviews.forEach(r => {
    if (
      r.wins.toLowerCase().includes(q) ||
      r.slipped.toLowerCase().includes(q) ||
      r.nextWeekFocus.toLowerCase().includes(q) ||
      (r.notes ?? '').toLowerCase().includes(q)
    ) {
      results.push({
        type: 'review',
        id: r.id,
        title: `Week of ${new Date(r.weekOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        subtitle: r.nextWeekFocus ? `Focus: ${r.nextWeekFocus.slice(0, 50)}` : undefined,
        navigateTo: 'weekly-review',
        data: r,
      });
    }
  });

  data.okrs.forEach(o => {
    if (
      o.objective.toLowerCase().includes(q) ||
      o.keyResults.some(kr => kr.description.toLowerCase().includes(q))
    ) {
      results.push({
        type: 'okr',
        id: o.id,
        title: o.objective,
        subtitle: `${o.keyResults.length} key results`,
        navigateTo: 'okrs',
        data: o,
      });
    }
  });

  data.dumpItems.forEach(d => {
    if (d.status !== 'archived' && d.content.toLowerCase().includes(q)) {
      results.push({
        type: 'dump',
        id: d.id,
        title: d.content.slice(0, 80) + (d.content.length > 80 ? '…' : ''),
        subtitle: d.status === 'inbox' ? 'In inbox' : d.status,
        navigateTo: 'dump',
        data: d,
      });
    }
  });

  return results.slice(0, 20);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: View, itemId?: string) => void;
  data: Parameters<typeof searchAll>[1];
}

export function SearchOverlay({ open, onClose, onNavigate, data }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce: only run search 120ms after the user stops typing
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 120);
    return () => clearTimeout(id);
  }, [query]);

  const results = useMemo(() => searchAll(debouncedQuery, data), [debouncedQuery, data]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) { pick(results[selected]); }
    if (e.key === 'Escape') onClose();
  };

  const pick = (r: SearchResult) => {
    onNavigate(r.navigateTo, r.id);
    onClose();
  };

  if (!open) return null;

  // Group by type
  const grouped = results.reduce<Record<ResultType, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<ResultType, SearchResult[]>);

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh] px-4 animate-[fadeIn_0.15s_ease-out]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl rounded-2xl bg-[#1A1824] border border-[#2A2640] shadow-2xl overflow-hidden animate-[slideIn_0.18s_ease-out]" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2A2640]">
          <Search size={16} className="text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search tasks, decisions, updates, OKRs…"
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
          />
          <div className="flex items-center gap-1.5">
            <kbd className="text-[10px] text-gray-600 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">↑↓</kbd>
            <kbd className="text-[10px] text-gray-600 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">↵</kbd>
            <button onClick={onClose} className="ml-1 text-gray-600 hover:text-gray-400 transition-colors"><X size={14} /></button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {query.trim() === '' && (
            <div className="px-4 py-8 text-center text-sm text-gray-600">Start typing to search everything…</div>
          )}
          {query.trim() !== '' && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-600">No results for "{query}"</div>
          )}
          {(Object.keys(grouped) as ResultType[]).map(type => {
            const meta = TYPE_META[type];
            const group = grouped[type];
            return (
              <div key={type}>
                <div className="px-4 py-1.5 flex items-center gap-1.5 bg-white/[0.02]">
                  <span className={meta.color}>{meta.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{meta.label}</span>
                </div>
                {group.map(r => {
                  const idx = flatIndex++;
                  const isSelected = selected === idx;
                  return (
                    <button
                      key={r.id}
                      onClick={() => pick(r)}
                      onMouseEnter={() => setSelected(idx)}
                      className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${isSelected ? 'bg-purple-500/15' : 'hover:bg-white/[0.03]'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{r.title}</p>
                        {r.subtitle && <p className="text-xs text-gray-500 truncate mt-0.5">{r.subtitle}</p>}
                      </div>
                      <span className={`text-[10px] font-bold shrink-0 mt-0.5 ${meta.color}`}>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-[#2A2640] text-[11px] text-gray-700">
            {results.length} result{results.length > 1 ? 's' : ''} — click or use arrows + enter
          </div>
        )}
      </div>
    </div>
  );
}
