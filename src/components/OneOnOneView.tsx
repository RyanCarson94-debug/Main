import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users, ChevronRight, Sparkles, Loader2, Save,
  Clock, CheckCircle2, Trash2, CalendarDays, Plus,
} from 'lucide-react';
import type {
  FirstTeamMember, DirectReportProfile, UpdatePerson, Update,
  HardConversation, OneOnOneNote,
} from '../types';
import { streamOneOnOneAgenda, extractMyActionItems, type OneOnOneContext } from '../services/claudeApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Person {
  id:       string;
  name:     string;
  role?:    string;
  source:   'team' | 'briefing';
  profile?: DirectReportProfile;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ─── Person Card ──────────────────────────────────────────────────────────────

function PersonCard({ person, lastNote, pendingCount, onClick }: {
  person: Person;
  lastNote: OneOnOneNote | null;
  pendingCount: number;
  onClick: () => void;
}) {
  const days = lastNote ? daysSince(lastNote.date) : null;
  const overdue = days !== null && days > 14;

  return (
    <button onClick={onClick}
      className="group w-full text-left bg-[#1A1824] border border-[#2A2640] rounded-2xl p-4 hover:border-violet-500/40 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-white font-black text-sm shrink-0">
              {person.name[0]}
            </div>
            <div>
              <p className="font-bold text-white text-sm">{person.name}</p>
              {person.role && <p className="text-xs text-gray-500">{person.role}</p>}
            </div>
          </div>
        </div>
        <ChevronRight size={14} className="text-gray-700 group-hover:text-violet-400 transition-colors shrink-0 mt-1" />
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {days === null ? (
          <span className="text-[11px] text-gray-600">No 1:1 recorded yet</span>
        ) : (
          <span className={`flex items-center gap-1 text-[11px] font-semibold ${overdue ? 'text-amber-400' : 'text-gray-500'}`}>
            <Clock size={10} />
            {days === 0 ? 'Today' : `${days}d ago`}{overdue && ' — overdue'}
          </span>
        )}
        {pendingCount > 0 && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
            {pendingCount} pending
          </span>
        )}
        {person.profile?.growthGoals && (
          <span className="text-[11px] text-gray-600 truncate max-w-[140px]">{person.profile.growthGoals}</span>
        )}
      </div>
    </button>
  );
}

// ─── 1:1 Prep Panel ───────────────────────────────────────────────────────────

function OneOnOnePrepPanel({
  person, lastNote, pendingUpdates, readyConvos,
  onBack, onSaveNote, onDeleteNote, onAddTask, autoScroll,
}: {
  person: Person;
  lastNote: OneOnOneNote | null;
  pendingUpdates: Update[];
  readyConvos: HardConversation[];
  onBack: () => void;
  onSaveNote: (n: Omit<OneOnOneNote, 'id' | 'createdAt'>) => void;
  onDeleteNote: (id: string) => void;
  onAddTask?: (title: string, sourceNote?: string) => void;
  autoScroll?: boolean;
}) {
  const today = new Date().toISOString().split('T')[0];

  const [agenda,      setAgenda]      = useState(lastNote?.agenda ?? '');
  const [notes,       setNotes]       = useState('');
  const [actionItems, setActionItems] = useState('');
  const [aiLoading,       setAiLoading]       = useState(false);
  const [aiError,         setAiError]         = useState('');
  const [saved,           setSaved]           = useState(false);
  const [myTaskSuggestions, setMyTaskSuggestions] = useState<string[]>([]);
  const [extractingTasks, setExtractingTasks] = useState(false);

  const notesRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (autoScroll && notesRef.current) {
      setTimeout(() => {
        notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        notesRef.current?.focus();
      }, 150);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateAgenda = async () => {
    setAiLoading(true);
    setAiError('');
    setAgenda('');

    const ctx: OneOnOneContext = {
      personName:     person.name,
      personRole:     person.role,
      growthGoals:    person.profile?.growthGoals,
      strengths:      person.profile?.strengths,
      challenges:     person.profile?.developmentAreas?.join(', '),
      pendingItems:   pendingUpdates.map(u => u.content),
      hardConvos:     readyConvos.map(c => c.title),
      lastDate:       lastNote?.date,
      previousNotes:  lastNote?.notes,
    };

    await streamOneOnOneAgenda(
      ctx,
      chunk => setAgenda(prev => prev + chunk),
      ()    => setAiLoading(false),
      err   => { setAiError(err); setAiLoading(false); },
    );
  };

  const handleSave = () => {
    onSaveNote({
      personId:   person.id,
      personName: person.name,
      date:       today,
      agenda:     agenda || undefined,
      notes:      notes  || undefined,
      actionItems: actionItems || undefined,
    });
    // AI extraction of leader's action items — sourceNote stored separately, never appended to title
    if (onAddTask && actionItems.trim()) {
      setExtractingTasks(true);
      extractMyActionItems(
        actionItems,
        person.name,
        (items) => {
          if (items.length > 0) {
            setMyTaskSuggestions(items);
          }
          setExtractingTasks(false);
        },
        () => setExtractingTasks(false),
      );
    }
    setSaved(true);
    setNotes('');
    setActionItems('');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-3 transition-colors">
          <ChevronRight size={12} className="rotate-180" /> All people
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-white font-black text-base shrink-0">
            {person.name[0]}
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{person.name}</h2>
            {person.role && <p className="text-sm text-gray-400">{person.role}</p>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-6">

        {/* Context pills */}
        {(pendingUpdates.length > 0 || readyConvos.length > 0 || person.profile) && (
          <div className="space-y-3">
            {person.profile?.growthGoals && (
              <div className="px-4 py-3 rounded-xl bg-[#12111A] border border-[#2A2640]">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Growth Goals</p>
                <p className="text-sm text-gray-300">{person.profile.growthGoals}</p>
              </div>
            )}
            {(person.profile?.strengths?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {person.profile?.strengths.map((s, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{s}</span>
                ))}
              </div>
            )}

            {pendingUpdates.length > 0 && (
              <div className="px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-2">Pending Briefing Items</p>
                <ul className="space-y-1.5">
                  {pendingUpdates.slice(0, 5).map(u => (
                    <li key={u.id} className="text-xs text-gray-300 flex items-start gap-1.5">
                      <span className="text-violet-500 mt-0.5 shrink-0">·</span> {u.content}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {readyConvos.length > 0 && (
              <div className="px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Hard Conversations Ready</p>
                <ul className="space-y-1.5">
                  {readyConvos.map(c => (
                    <li key={c.id} className="text-xs text-amber-300 flex items-start gap-1.5">
                      <span className="shrink-0 mt-0.5">⚠</span> {c.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Agenda */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-white">Agenda</p>
            <button
              onClick={handleGenerateAgenda}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold hover:bg-violet-500/15 transition-colors disabled:opacity-40"
            >
              {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {agenda ? 'Regenerate' : 'Generate agenda'}
            </button>
          </div>
          {aiError && <p className="text-xs text-red-400 mb-2">{aiError}</p>}
          <textarea
            value={agenda}
            onChange={e => setAgenda(e.target.value)}
            rows={8}
            placeholder={"1. Check-in — how are they doing?\n2. ...\n\nOr click 'Generate agenda' to build one from context."}
            className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500 leading-relaxed"
          />
          {aiLoading && (
            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1.5"><Loader2 size={10} className="animate-spin" /> Generating…</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <p className="text-sm font-bold text-white mb-0.5">Meeting Notes</p>
          <p className="text-xs text-gray-500 mb-2">What happened — key takeaways, important context</p>
          <textarea
            ref={notesRef}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            placeholder="Notes from this 1:1…"
            className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Action Items */}
        <div>
          <p className="text-sm font-bold text-white mb-0.5">Action Items</p>
          <p className="text-xs text-gray-500 mb-2">What was agreed — who does what by when</p>
          <textarea
            value={actionItems}
            onChange={e => setActionItems(e.target.value)}
            rows={3}
            placeholder="- [ ] They: follow up on X by Friday&#10;- [ ] Me: unblock Y by EOW"
            className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Extracting action items loading state — shown ABOVE save so it's always visible */}
        {extractingTasks && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <Loader2 size={11} className="text-emerald-400 animate-spin shrink-0" />
            <p className="text-xs text-gray-500">Finding your action items…</p>
          </div>
        )}

        {/* My action items → tasks prompt — rendered above Save so suggestions are never below fold */}
        {myTaskSuggestions.length > 0 && onAddTask && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={12} /> {myTaskSuggestions.length} action item{myTaskSuggestions.length > 1 ? 's' : ''} for you — add to task board?
            </p>
            <div className="space-y-1">
              {myTaskSuggestions.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-xs text-gray-300 truncate">{t}</span>
                  <button
                    onClick={() => {
                      onAddTask(t, `1:1 · ${person.name}`);
                      setMyTaskSuggestions(prev => prev.filter((_, j) => j !== i));
                    }}
                    className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 text-[11px] font-bold hover:bg-emerald-600/30 transition-colors">
                    <Plus size={10} /> Add
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setMyTaskSuggestions([])}
              className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">
              Dismiss
            </button>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!agenda && !notes && !actionItems}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all disabled:opacity-40"
        >
          {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save 1:1 — {today}</>}
        </button>

        {/* Past notes for this person */}
        {lastNote && (
          <PastNoteSection note={lastNote} onDelete={onDeleteNote} />
        )}
      </div>
    </div>
  );
}

function PastNoteSection({ note, onDelete }: { note: OneOnOneNote; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-[#2A2640] overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          <CalendarDays size={12} className="text-gray-500" />
          <span className="text-xs font-semibold text-gray-400">Last 1:1 — {formatDateShort(note.date)}</span>
          <span className="text-[11px] text-gray-600">({daysSince(note.date)}d ago)</span>
        </div>
        <ChevronRight size={12} className={`text-gray-600 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-[#2A2640] pt-3 space-y-3">
          {note.agenda && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Agenda</p>
              <p className="text-xs text-gray-400 whitespace-pre-wrap">{note.agenda}</p>
            </div>
          )}
          {note.notes && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Notes</p>
              <p className="text-xs text-gray-400 whitespace-pre-wrap">{note.notes}</p>
            </div>
          )}
          {note.actionItems && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Action Items</p>
              <p className="text-xs text-gray-400 whitespace-pre-wrap">{note.actionItems}</p>
            </div>
          )}
          <button onClick={() => onDelete(note.id)}
            className="flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-red-400 transition-colors">
            <Trash2 size={10} /> Delete this note
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface OneOnOneViewProps {
  teamMembers:         FirstTeamMember[];
  directReportProfiles: DirectReportProfile[];
  updatePeople:        UpdatePerson[];
  onAddTask?:          (title: string, sourceNote?: string) => void;
  updates:             Update[];
  hardConversations:   HardConversation[];
  oneOnOneNotes:       OneOnOneNote[];
  onAddNote:           (n: Omit<OneOnOneNote, 'id' | 'createdAt'>) => void;
  onDeleteNote:        (id: string) => void;
  initialPersonId?:    string;
}

export function OneOnOneView({
  teamMembers, directReportProfiles, updatePeople, updates,
  hardConversations, oneOnOneNotes, onAddNote, onDeleteNote, initialPersonId, onAddTask,
}: OneOnOneViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialPersonId ?? null);

  // Merge team members + briefing people into a unified list
  const people = useMemo<Person[]>(() => {
    const seen = new Set<string>();
    const result: Person[] = [];

    for (const m of teamMembers) {
      seen.add(m.id);
      const profile = directReportProfiles.find(p => p.personId === m.id);
      result.push({ id: m.id, name: m.name, role: m.role, source: 'team', profile });
    }

    // Also include briefing people not already in team members
    for (const p of updatePeople) {
      if (!seen.has(p.id) && (p.relationship === 'direct-report' || p.relationship === 'peer')) {
        result.push({ id: p.id, name: p.name, source: 'briefing' });
      }
    }

    return result.sort((a, b) => {
      // Sort by most overdue first
      const aNotes = oneOnOneNotes.filter(n => n.personId === a.id);
      const bNotes = oneOnOneNotes.filter(n => n.personId === b.id);
      const aLast  = aNotes.sort((x, y) => y.date.localeCompare(x.date))[0];
      const bLast  = bNotes.sort((x, y) => y.date.localeCompare(x.date))[0];
      const aDays  = aLast ? daysSince(aLast.date) : 999;
      const bDays  = bLast ? daysSince(bLast.date) : 999;
      return bDays - aDays;
    });
  }, [teamMembers, directReportProfiles, updatePeople, oneOnOneNotes]);

  const selectedPerson = people.find(p => p.id === selectedId) ?? null;

  // For a given person, find pending updates and ready hard conversations
  const getContext = (person: Person) => {
    const personName = person.name.toLowerCase();
    const pendingUpdates = updates.filter(u => {
      const recipientPerson = updatePeople.find(p => u.recipientIds.includes(p.id) && p.name.toLowerCase().includes(personName.split(' ')[0].toLowerCase()));
      return !!recipientPerson && u.recipientIds.some(id => !u.discussedWith.includes(id));
    });
    const readyConvos = hardConversations.filter(c =>
      c.status === 'ready' &&
      c.person?.toLowerCase().includes(personName.split(' ')[0].toLowerCase())
    );
    const lastNote = oneOnOneNotes
      .filter(n => n.personId === person.id)
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
    return { pendingUpdates, readyConvos, lastNote };
  };

  if (selectedPerson) {
    const { pendingUpdates, readyConvos, lastNote } = getContext(selectedPerson);
    return (
      <OneOnOnePrepPanel
        person={selectedPerson}
        lastNote={lastNote}
        pendingUpdates={pendingUpdates}
        readyConvos={readyConvos}
        onBack={() => setSelectedId(null)}
        onSaveNote={onAddNote}
        onDeleteNote={onDeleteNote}
        onAddTask={onAddTask}
        autoScroll={!!initialPersonId && selectedId === initialPersonId}
      />
    );
  }

  // Stats
  const overdue    = people.filter(p => { const n = getContext(p).lastNote; return n ? daysSince(n.date) > 14 : true; });
  const withPending = people.filter(p => getContext(p).pendingUpdates.length > 0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="text-violet-400" size={24} /> 1:1 Builder
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Prep, run, and record your 1:1s — everything about each person in one place
          </p>
        </div>
      </div>

      {people.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5 shrink-0">
          {[
            { label: 'People', value: people.length, color: 'text-gray-300' },
            { label: 'Overdue 1:1', value: overdue.length, color: overdue.length > 0 ? 'text-amber-300' : 'text-gray-500' },
            { label: 'Pending Items', value: withPending.length, color: withPending.length > 0 ? 'text-violet-300' : 'text-gray-500' },
          ].map(s => (
            <div key={s.label} className="bg-[#1A1824] border border-[#2A2640] rounded-xl px-4 py-3 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {people.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={40} className="text-gray-700 mb-3" />
            <p className="text-gray-500 font-semibold">No one here yet</p>
            <p className="text-gray-600 text-xs mt-1 max-w-xs">
              Add your team in <span className="text-violet-400">First Team</span> or <span className="text-violet-400">1:1 Briefings</span> — they'll appear here automatically.
            </p>
          </div>
        ) : (
          people.map(person => {
            const { lastNote, pendingUpdates } = getContext(person);
            return (
              <PersonCard
                key={person.id}
                person={person}
                lastNote={lastNote}
                pendingCount={pendingUpdates.length}
                onClick={() => setSelectedId(person.id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
