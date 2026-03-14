import { useState, useMemo } from 'react';
import {
  CalendarDays, Plus, Clock, Users, ChevronRight, CheckCircle2,
  Circle, Trash2, ClipboardList, ListChecks, X, MapPin,
} from 'lucide-react';
import type {
  Meeting, MeetingType, Task, Decision,
  AgendaItem, MeetingActionItem,
} from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const MEETING_TYPE_CONFIG: Record<MeetingType, { label: string; color: string; bg: string; border: string }> = {
  'team':          { label: 'Team',          color: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
  'standup':       { label: 'Standup',       color: 'text-sky-300',    bg: 'bg-sky-500/10',    border: 'border-sky-500/30'    },
  'all-hands':     { label: 'All-Hands',     color: 'text-indigo-300', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  'client':        { label: 'Client',        color: 'text-emerald-300',bg: 'bg-emerald-500/10',border: 'border-emerald-500/30'},
  'board':         { label: 'Board',         color: 'text-red-300',    bg: 'bg-red-500/10',    border: 'border-red-500/30'    },
  'strategy':      { label: 'Strategy',      color: 'text-amber-300',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30'  },
  'retrospective': { label: 'Retrospective', color: 'text-pink-300',   bg: 'bg-pink-500/10',   border: 'border-pink-500/30'   },
  'workshop':      { label: 'Workshop',      color: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  'one-on-one':    { label: '1:1',           color: 'text-teal-300',   bg: 'bg-teal-500/10',   border: 'border-teal-500/30'   },
  'other':         { label: 'Other',         color: 'text-gray-300',   bg: 'bg-gray-500/10',   border: 'border-gray-500/30'   },
};

// ─── New Meeting Modal ────────────────────────────────────────────────────────

interface NewMeetingModalProps {
  onSave: (m: Omit<Meeting, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  editMeeting?: Meeting | null;
}

function NewMeetingModal({ onSave, onClose, editMeeting }: NewMeetingModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [title,    setTitle]    = useState(editMeeting?.title    ?? '');
  const [date,     setDate]     = useState(editMeeting?.date     ?? today);
  const [time,     setTime]     = useState(editMeeting?.time     ?? '');
  const [duration, setDuration] = useState(String(editMeeting?.durationMinutes ?? ''));
  const [type,     setType]     = useState<MeetingType>(editMeeting?.type ?? 'team');
  const [location, setLocation] = useState(editMeeting?.location ?? '');
  const [attendeeInput, setAttendeeInput] = useState('');
  const [attendees, setAttendees] = useState<string[]>(editMeeting?.attendees ?? []);
  const [objective, setObjective] = useState(editMeeting?.objective ?? '');

  const addAttendee = () => {
    const name = attendeeInput.trim();
    if (name && !attendees.includes(name)) setAttendees(prev => [...prev, name]);
    setAttendeeInput('');
  };

  const handleSave = () => {
    if (!title.trim() || !date) return;
    onSave({
      title: title.trim(),
      date,
      time: time || undefined,
      durationMinutes: duration ? parseInt(duration) : undefined,
      type,
      location: location.trim() || undefined,
      attendees,
      status: editMeeting?.status ?? 'upcoming',
      objective: objective.trim() || undefined,
      prepNotes:    editMeeting?.prepNotes    ?? '',
      agendaItems:  editMeeting?.agendaItems  ?? [],
      notes:        editMeeting?.notes        ?? '',
      actionItems:  editMeeting?.actionItems  ?? [],
      linkedTaskIds:     editMeeting?.linkedTaskIds     ?? [],
      linkedDecisionIds: editMeeting?.linkedDecisionIds ?? [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1824] border border-[#2A2640] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2640]">
          <h2 className="text-base font-bold text-white">{editMeeting ? 'Edit Meeting' : 'New Meeting'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Title *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Q2 Strategy Review"
              className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as MeetingType)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-sm focus:outline-none focus:border-violet-500"
            >
              {(Object.keys(MEETING_TYPE_CONFIG) as MeetingType[]).map(t => (
                <option key={t} value={t}>{MEETING_TYPE_CONFIG[t].label}</option>
              ))}
            </select>
          </div>
          {/* Date + Time + Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Date *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Duration (min)</label>
              <input
                type="number"
                min={5}
                step={5}
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="60"
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Location / Link</label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Zoom, Room 3B, Meet link…"
              className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
          {/* Attendees */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Attendees</label>
            <div className="flex gap-2">
              <input
                value={attendeeInput}
                onChange={e => setAttendeeInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAttendee(); } }}
                placeholder="Name, then Enter"
                className="flex-1 px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
              />
              <button onClick={addAttendee} className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">Add</button>
            </div>
            {attendees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {attendees.map(a => (
                  <span key={a} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#2A2640] text-xs text-gray-300">
                    {a}
                    <button onClick={() => setAttendees(prev => prev.filter(x => x !== a))} className="text-gray-500 hover:text-red-400 ml-0.5"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Objective */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Objective <span className="text-gray-600 font-normal">(what does success look like?)</span></label>
            <textarea
              value={objective}
              onChange={e => setObjective(e.target.value)}
              rows={2}
              placeholder="e.g. Align on Q3 priorities and get sign-off from leadership"
              className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#2A2640] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#2A2640] text-gray-400 hover:text-gray-200 text-sm font-semibold transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !date}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {editMeeting ? 'Save Changes' : 'Create Meeting'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Meeting Card ─────────────────────────────────────────────────────────────

function MeetingCard({
  meeting,
  onClick,
  onDelete,
}: {
  meeting: Meeting;
  onClick: () => void;
  onDelete: () => void;
}) {
  const cfg = MEETING_TYPE_CONFIG[meeting.type];
  const today = new Date().toISOString().split('T')[0];
  const isToday   = meeting.date === today;
  const isOverdue = meeting.status === 'upcoming' && meeting.date < today;

  const agendaTotal = meeting.agendaItems.reduce((s, a) => s + (a.durationMinutes ?? 0), 0);
  const pendingActions = meeting.actionItems.filter(a => !a.done).length;

  const fmtDate = (d: string) => {
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={onClick}
      className={`group relative bg-[#1A1824] border rounded-2xl p-4 cursor-pointer hover:border-violet-500/50 transition-all ${
        isToday   ? 'border-violet-500/40 ring-1 ring-violet-500/20' :
        isOverdue ? 'border-amber-500/30' :
        'border-[#2A2640]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {isToday && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30">TODAY</span>
            )}
            {isOverdue && meeting.status !== 'cancelled' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">PAST</span>
            )}
            {meeting.status === 'completed' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">DONE</span>
            )}
            {meeting.status === 'cancelled' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-500/20 text-gray-400 border border-gray-500/30">CANCELLED</span>
            )}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
              {cfg.label}
            </span>
          </div>
          <h3 className="font-semibold text-white text-sm leading-tight truncate">{meeting.title}</h3>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 shrink-0 p-1 text-gray-600 hover:text-red-400 transition-all"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1">
          <CalendarDays size={11} />
          {fmtDate(meeting.date)}
          {meeting.time && <span className="ml-0.5">{meeting.time}</span>}
        </span>
        {meeting.durationMinutes && (
          <span className="flex items-center gap-1">
            <Clock size={11} /> {meeting.durationMinutes}m
          </span>
        )}
        {meeting.location && (
          <span className="flex items-center gap-1 truncate max-w-[120px]">
            <MapPin size={11} /> {meeting.location}
          </span>
        )}
        {meeting.attendees.length > 0 && (
          <span className="flex items-center gap-1">
            <Users size={11} />
            {meeting.attendees.slice(0, 2).join(', ')}
            {meeting.attendees.length > 2 && ` +${meeting.attendees.length - 2}`}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mt-2.5 text-xs flex-wrap">
        {meeting.agendaItems.length > 0 && (
          <span className="flex items-center gap-1 text-gray-500">
            <ClipboardList size={11} />
            {meeting.agendaItems.length} agenda{agendaTotal > 0 && ` · ${agendaTotal}m`}
          </span>
        )}
        {pendingActions > 0 && (
          <span className="flex items-center gap-1 text-amber-400">
            <ListChecks size={11} /> {pendingActions} action{pendingActions !== 1 ? 's' : ''} open
          </span>
        )}
        {meeting.objective && (
          <span className="text-gray-600 truncate max-w-[200px]" title={meeting.objective}>
            {meeting.objective}
          </span>
        )}
      </div>

      <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 group-hover:text-violet-400 transition-colors" />
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface MeetingsViewProps {
  meetings: Meeting[];
  tasks: Task[];
  decisions: Decision[];
  onAdd: (m: Omit<Meeting, 'id' | 'createdAt'>) => Meeting;
  onUpdate: (id: string, updates: Partial<Meeting>) => void;
  onDelete: (id: string) => void;
  onAddAgendaItem: (meetingId: string, item: Omit<AgendaItem, 'id'>) => void;
  onUpdateAgendaItem: (meetingId: string, itemId: string, updates: Partial<AgendaItem>) => void;
  onDeleteAgendaItem: (meetingId: string, itemId: string) => void;
  onAddActionItem: (meetingId: string, item: Omit<MeetingActionItem, 'id'>) => void;
  onUpdateActionItem: (meetingId: string, itemId: string, updates: Partial<MeetingActionItem>) => void;
  onDeleteActionItem: (meetingId: string, itemId: string) => void;
  onConvertToTask: (meetingId: string, actionItemId: string, taskData: Omit<Task, 'id' | 'createdAt'>) => void;
  onLinkTask: (meetingId: string, taskId: string) => void;
  onUnlinkTask: (meetingId: string, taskId: string) => void;
  onLinkDecision: (meetingId: string, decisionId: string) => void;
  onUnlinkDecision: (meetingId: string, decisionId: string) => void;
  selectedMeetingId: string | null;
  onSelectMeeting: (id: string | null) => void;
}

export function MeetingsView({
  meetings, tasks, decisions,
  onAdd, onUpdate, onDelete,
  onAddAgendaItem, onUpdateAgendaItem, onDeleteAgendaItem,
  onAddActionItem, onUpdateActionItem, onDeleteActionItem,
  onConvertToTask, onLinkTask, onUnlinkTask, onLinkDecision, onUnlinkDecision,
  selectedMeetingId, onSelectMeeting,
}: MeetingsViewProps) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editModalMeeting, setEditModalMeeting] = useState<Meeting | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const { upcoming, past } = useMemo(() => {
    const sorted = [...meetings].sort((a, b) => a.date.localeCompare(b.date));
    return {
      upcoming: sorted.filter(m => m.status === 'upcoming' && m.date >= today),
      past:     sorted.filter(m => m.status === 'completed' || m.status === 'cancelled' || m.date < today).reverse(),
    };
  }, [meetings, today]);

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId) ?? null;

  const handleAdd = (data: Omit<Meeting, 'id' | 'createdAt'>) => {
    const m = onAdd(data);
    onSelectMeeting(m.id);
  };

  const handleEdit = (data: Omit<Meeting, 'id' | 'createdAt'>) => {
    if (!editModalMeeting) return;
    onUpdate(editModalMeeting.id, data);
    setEditModalMeeting(null);
  };

  const handleDelete = (id: string) => {
    if (selectedMeetingId === id) onSelectMeeting(null);
    onDelete(id);
  };

  // If a meeting is selected, show its detail view
  if (selectedMeeting) {
    return (
      <>
        <MeetingDetail
          meeting={selectedMeeting}
          tasks={tasks}
          decisions={decisions}
          onBack={() => onSelectMeeting(null)}
          onUpdate={updates => onUpdate(selectedMeeting.id, updates)}
          onEdit={() => setEditModalMeeting(selectedMeeting)}
          onAddAgendaItem={item => onAddAgendaItem(selectedMeeting.id, item)}
          onUpdateAgendaItem={(itemId, updates) => onUpdateAgendaItem(selectedMeeting.id, itemId, updates)}
          onDeleteAgendaItem={itemId => onDeleteAgendaItem(selectedMeeting.id, itemId)}
          onAddActionItem={item => onAddActionItem(selectedMeeting.id, item)}
          onUpdateActionItem={(itemId, updates) => onUpdateActionItem(selectedMeeting.id, itemId, updates)}
          onDeleteActionItem={itemId => onDeleteActionItem(selectedMeeting.id, itemId)}
          onConvertToTask={(actionItemId, taskData) => onConvertToTask(selectedMeeting.id, actionItemId, taskData)}
          onLinkTask={taskId => onLinkTask(selectedMeeting.id, taskId)}
          onUnlinkTask={taskId => onUnlinkTask(selectedMeeting.id, taskId)}
          onLinkDecision={decisionId => onLinkDecision(selectedMeeting.id, decisionId)}
          onUnlinkDecision={decisionId => onUnlinkDecision(selectedMeeting.id, decisionId)}
        />
        {editModalMeeting && (
          <NewMeetingModal
            editMeeting={editModalMeeting}
            onSave={handleEdit}
            onClose={() => setEditModalMeeting(null)}
          />
        )}
      </>
    );
  }

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <CalendarDays className="text-violet-400" size={24} />
            Meetings
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Prepare, run, and follow up on any meeting
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-all active:scale-95"
        >
          <Plus size={16} /> New Meeting
        </button>
      </div>

      {/* Stats bar */}
      {meetings.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5 shrink-0">
          {[
            { label: 'Upcoming',      value: upcoming.length,                            color: 'text-violet-300' },
            { label: 'Open Actions',  value: meetings.flatMap(m => m.actionItems).filter(a => !a.done).length, color: 'text-amber-300' },
            { label: 'Completed',     value: meetings.filter(m => m.status === 'completed').length, color: 'text-emerald-300' },
          ].map(s => (
            <div key={s.label} className="bg-[#1A1824] border border-[#2A2640] rounded-xl px-4 py-3 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 shrink-0">
        {(['upcoming', 'past'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${
              tab === t ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t} {t === 'upcoming' ? `(${upcoming.length})` : `(${past.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays size={40} className="text-gray-700 mb-3" />
            <p className="text-gray-500 font-semibold">
              {tab === 'upcoming' ? 'No upcoming meetings' : 'No past meetings yet'}
            </p>
            {tab === 'upcoming' && (
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors"
              >
                <Plus size={14} /> Schedule your first meeting
              </button>
            )}
          </div>
        ) : (
          list.map(m => (
            <MeetingCard
              key={m.id}
              meeting={m}
              onClick={() => onSelectMeeting(m.id)}
              onDelete={() => handleDelete(m.id)}
            />
          ))
        )}
      </div>

      {showNewModal && (
        <NewMeetingModal onSave={handleAdd} onClose={() => setShowNewModal(false)} />
      )}
      {editModalMeeting && (
        <NewMeetingModal editMeeting={editModalMeeting} onSave={handleEdit} onClose={() => setEditModalMeeting(null)} />
      )}
    </div>
  );
}

// ─── Meeting Detail ───────────────────────────────────────────────────────────

interface MeetingDetailProps {
  meeting: Meeting;
  tasks: Task[];
  decisions: Decision[];
  onBack: () => void;
  onUpdate: (updates: Partial<Meeting>) => void;
  onEdit: () => void;
  onAddAgendaItem: (item: Omit<AgendaItem, 'id'>) => void;
  onUpdateAgendaItem: (itemId: string, updates: Partial<AgendaItem>) => void;
  onDeleteAgendaItem: (itemId: string) => void;
  onAddActionItem: (item: Omit<MeetingActionItem, 'id'>) => void;
  onUpdateActionItem: (itemId: string, updates: Partial<MeetingActionItem>) => void;
  onDeleteActionItem: (itemId: string) => void;
  onConvertToTask: (actionItemId: string, taskData: Omit<Task, 'id' | 'createdAt'>) => void;
  onLinkTask: (taskId: string) => void;
  onUnlinkTask: (taskId: string) => void;
  onLinkDecision: (decisionId: string) => void;
  onUnlinkDecision: (decisionId: string) => void;
}

type DetailTab = 'prep' | 'agenda' | 'notes' | 'follow-ups';

function MeetingDetail({
  meeting, tasks, decisions,
  onBack, onUpdate, onEdit,
  onAddAgendaItem, onUpdateAgendaItem, onDeleteAgendaItem,
  onAddActionItem, onUpdateActionItem, onDeleteActionItem,
  onConvertToTask, onLinkTask, onUnlinkTask, onLinkDecision, onUnlinkDecision,
}: MeetingDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('prep');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const cfg = MEETING_TYPE_CONFIG[meeting.type];
  const today = new Date().toISOString().split('T')[0];
  const isUpcoming = meeting.status === 'upcoming' && meeting.date >= today;

  const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const pendingActions = meeting.actionItems.filter(a => !a.done).length;
  const completedAgenda = meeting.agendaItems.filter(a => a.done).length;

  const tabs: { id: DetailTab; label: string; badge?: number }[] = [
    { id: 'prep',       label: 'Prep' },
    { id: 'agenda',     label: 'Agenda',    badge: meeting.agendaItems.length },
    { id: 'notes',      label: 'Notes' },
    { id: 'follow-ups', label: 'Follow-ups', badge: pendingActions || undefined },
  ];

  const handleGeneratePrep = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiError('');
    try {
      const { generateMeetingPrep } = await import('../services/claudeApi');
      const result = await generateMeetingPrep(meeting);
      onUpdate({ prepNotes: result });
    } catch {
      setAiError('AI prep failed. Check your API key.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-3 transition-colors">
          <ChevronRight size={12} className="rotate-180" /> All meetings
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                {cfg.label}
              </span>
              {meeting.status === 'completed' && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">Completed</span>
              )}
              {meeting.status === 'cancelled' && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-gray-500/10 text-gray-400 border border-gray-500/30">Cancelled</span>
              )}
            </div>
            <h2 className="text-xl font-black text-white leading-tight">{meeting.title}</h2>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><CalendarDays size={11} />{fmtDate(meeting.date)}{meeting.time && ` at ${meeting.time}`}</span>
              {meeting.durationMinutes && <span className="flex items-center gap-1"><Clock size={11} />{meeting.durationMinutes} min</span>}
              {meeting.location && <span className="flex items-center gap-1"><MapPin size={11} />{meeting.location}</span>}
            </div>
            {meeting.attendees.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <Users size={11} className="text-gray-600" />
                {meeting.attendees.map(a => (
                  <span key={a} className="text-xs px-2 py-0.5 rounded-lg bg-[#2A2640] text-gray-300">{a}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {isUpcoming && (
              <>
                <button
                  onClick={() => onUpdate({ status: 'completed' })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold transition-colors"
                >
                  <CheckCircle2 size={13} /> Mark Done
                </button>
                <button
                  onClick={() => onUpdate({ status: 'cancelled' })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2A2640] text-gray-500 hover:text-red-400 text-xs font-semibold transition-colors"
                  title="Cancel this meeting"
                >
                  Cancel
                </button>
              </>
            )}
            {(meeting.status === 'completed' || meeting.status === 'cancelled') && (
              <button
                onClick={() => onUpdate({ status: 'upcoming' })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2A2640] text-gray-400 hover:text-gray-200 text-xs font-semibold transition-colors"
              >
                Reopen
              </button>
            )}
            <button onClick={onEdit} className="px-3 py-2 rounded-xl border border-[#2A2640] text-gray-400 hover:text-gray-200 text-xs font-semibold transition-colors">
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 shrink-0 border-b border-[#2A2640] pb-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`relative px-4 py-2 text-sm font-semibold transition-colors -mb-px ${
              activeTab === t.id
                ? 'text-violet-300 border-b-2 border-violet-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-6">
        {activeTab === 'prep' && (
          <PrepTab
            meeting={meeting}
            onUpdate={onUpdate}
            onGeneratePrep={handleGeneratePrep}
            aiLoading={aiLoading}
            aiError={aiError}
            tasks={tasks}
            decisions={decisions}
            onLinkTask={onLinkTask}
            onUnlinkTask={onUnlinkTask}
            onLinkDecision={onLinkDecision}
            onUnlinkDecision={onUnlinkDecision}
          />
        )}
        {activeTab === 'agenda' && (
          <AgendaTab
            meeting={meeting}
            onAdd={onAddAgendaItem}
            onUpdate={onUpdateAgendaItem}
            onDelete={onDeleteAgendaItem}
          />
        )}
        {activeTab === 'notes' && (
          <NotesTab
            notes={meeting.notes ?? ''}
            onUpdate={notes => onUpdate({ notes })}
            completedAgenda={completedAgenda}
            totalAgenda={meeting.agendaItems.length}
          />
        )}
        {activeTab === 'follow-ups' && (
          <FollowUpsTab
            meeting={meeting}
            tasks={tasks}
            onAddActionItem={onAddActionItem}
            onUpdateActionItem={onUpdateActionItem}
            onDeleteActionItem={onDeleteActionItem}
            onConvertToTask={onConvertToTask}
          />
        )}
      </div>
    </div>
  );
}

// ─── Prep Tab ─────────────────────────────────────────────────────────────────

function PrepTab({
  meeting, onUpdate, onGeneratePrep, aiLoading, aiError,
  tasks, decisions, onLinkTask, onUnlinkTask, onLinkDecision, onUnlinkDecision,
}: {
  meeting: Meeting;
  onUpdate: (u: Partial<Meeting>) => void;
  onGeneratePrep: () => void;
  aiLoading: boolean;
  aiError: string;
  tasks: Task[];
  decisions: Decision[];
  onLinkTask: (taskId: string) => void;
  onUnlinkTask: (taskId: string) => void;
  onLinkDecision: (decisionId: string) => void;
  onUnlinkDecision: (decisionId: string) => void;
}) {
  const [taskSearch, setTaskSearch] = useState('');
  const [decisionSearch, setDecisionSearch] = useState('');

  const linkedTasks    = tasks.filter(t => meeting.linkedTaskIds.includes(t.id));
  const linkedDecisions = decisions.filter(d => meeting.linkedDecisionIds.includes(d.id));

  const unlinkedTasks = tasks.filter(t =>
    !meeting.linkedTaskIds.includes(t.id) && t.column !== 'done' &&
    (taskSearch === '' || t.title.toLowerCase().includes(taskSearch.toLowerCase()))
  ).slice(0, 5);

  const unlinkedDecisions = decisions.filter(d =>
    !meeting.linkedDecisionIds.includes(d.id) &&
    (decisionSearch === '' || d.title.toLowerCase().includes(decisionSearch.toLowerCase()))
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Objective */}
      <Section title="Objective" subtitle="What does success look like for this meeting?">
        <textarea
          value={meeting.objective ?? ''}
          onChange={e => onUpdate({ objective: e.target.value })}
          rows={2}
          placeholder="e.g. Align on Q3 priorities and secure executive sign-off"
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500"
        />
      </Section>

      {/* Prep Notes */}
      <Section
        title="Prep Notes"
        subtitle="Context, things to bring up, data to pull, questions to ask"
        action={
          <button
            onClick={onGeneratePrep}
            disabled={aiLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {aiLoading ? 'Generating…' : '✦ AI Prep'}
          </button>
        }
      >
        {aiError && <p className="text-xs text-red-400 mb-2">{aiError}</p>}
        <textarea
          value={meeting.prepNotes ?? ''}
          onChange={e => onUpdate({ prepNotes: e.target.value })}
          rows={6}
          placeholder={'• What decisions need to be made?\n• What data / numbers to have ready?\n• Likely objections and your responses?\n• What do you need from attendees?'}
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500 font-mono text-xs leading-relaxed"
        />
      </Section>

      {/* Linked Tasks */}
      <Section title="Linked Tasks" subtitle="Tasks related to this meeting">
        {linkedTasks.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {linkedTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] group">
                <span className="text-sm text-gray-300 truncate">{t.title}</span>
                <button onClick={() => onUnlinkTask(t.id)} className="ml-2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          value={taskSearch}
          onChange={e => setTaskSearch(e.target.value)}
          placeholder="Search tasks to link…"
          className="w-full px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
        />
        {taskSearch && unlinkedTasks.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {unlinkedTasks.map(t => (
              <button
                key={t.id}
                onClick={() => { onLinkTask(t.id); setTaskSearch(''); }}
                className="w-full text-left px-3 py-2 rounded-xl bg-[#1A1824] border border-[#2A2640] hover:border-violet-500/50 text-sm text-gray-300 transition-colors flex items-center gap-2"
              >
                <Plus size={12} className="text-violet-400 shrink-0" />
                <span className="truncate">{t.title}</span>
              </button>
            ))}
          </div>
        )}
        {taskSearch && unlinkedTasks.length === 0 && (
          <p className="text-xs text-gray-600 mt-2 px-1">No matching tasks</p>
        )}
      </Section>

      {/* Linked Decisions */}
      <Section title="Linked Decisions" subtitle="Relevant past decisions">
        {linkedDecisions.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {linkedDecisions.map(d => (
              <div key={d.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] group">
                <span className="text-sm text-gray-300 truncate">{d.title}</span>
                <button onClick={() => onUnlinkDecision(d.id)} className="ml-2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          value={decisionSearch}
          onChange={e => setDecisionSearch(e.target.value)}
          placeholder="Search decisions to link…"
          className="w-full px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
        />
        {decisionSearch && unlinkedDecisions.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {unlinkedDecisions.map(d => (
              <button
                key={d.id}
                onClick={() => { onLinkDecision(d.id); setDecisionSearch(''); }}
                className="w-full text-left px-3 py-2 rounded-xl bg-[#1A1824] border border-[#2A2640] hover:border-violet-500/50 text-sm text-gray-300 transition-colors flex items-center gap-2"
              >
                <Plus size={12} className="text-violet-400 shrink-0" />
                <span className="truncate">{d.title}</span>
              </button>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── Agenda Tab ───────────────────────────────────────────────────────────────

function AgendaTab({
  meeting, onAdd, onUpdate, onDelete,
}: {
  meeting: Meeting;
  onAdd: (item: Omit<AgendaItem, 'id'>) => void;
  onUpdate: (id: string, u: Partial<AgendaItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [newTopic,    setNewTopic]    = useState('');
  const [newOwner,    setNewOwner]    = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [editingId,   setEditingId]   = useState<string | null>(null);

  const handleAdd = () => {
    const topic = newTopic.trim();
    if (!topic) return;
    onAdd({ topic, owner: newOwner.trim() || undefined, durationMinutes: newDuration ? parseInt(newDuration) : undefined, done: false });
    setNewTopic(''); setNewOwner(''); setNewDuration('');
  };

  const totalMinutes = meeting.agendaItems.reduce((s, a) => s + (a.durationMinutes ?? 0), 0);
  const doneCount    = meeting.agendaItems.filter(a => a.done).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      {meeting.agendaItems.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
          <span>{doneCount}/{meeting.agendaItems.length} items covered</span>
          {totalMinutes > 0 && <span>{totalMinutes} min total</span>}
          {meeting.durationMinutes && totalMinutes > meeting.durationMinutes && (
            <span className="text-amber-400">⚠ Agenda exceeds meeting duration</span>
          )}
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        {meeting.agendaItems.map((item, i) => (
          <AgendaItemRow
            key={item.id}
            item={item}
            index={i + 1}
            isEditing={editingId === item.id}
            onToggleEdit={() => setEditingId(editingId === item.id ? null : item.id)}
            onUpdate={u => onUpdate(item.id, u)}
            onDelete={() => onDelete(item.id)}
          />
        ))}
      </div>

      {/* Add new */}
      <div className="bg-[#1A1824] border border-[#2A2640] rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3">Add agenda item</p>
        <div className="flex gap-2 mb-2">
          <input
            value={newTopic}
            onChange={e => setNewTopic(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="Topic *"
            className="flex-1 px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
          />
          <input
            value={newOwner}
            onChange={e => setNewOwner(e.target.value)}
            placeholder="Owner"
            className="w-28 px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
          />
          <input
            type="number"
            min={1}
            value={newDuration}
            onChange={e => setNewDuration(e.target.value)}
            placeholder="min"
            className="w-16 px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={handleAdd}
            disabled={!newTopic.trim()}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function AgendaItemRow({
  item, index, isEditing, onToggleEdit, onUpdate, onDelete,
}: {
  item: AgendaItem; index: number; isEditing: boolean;
  onToggleEdit: () => void; onUpdate: (u: Partial<AgendaItem>) => void; onDelete: () => void;
}) {
  return (
    <div className={`bg-[#1A1824] border rounded-xl transition-colors ${item.done ? 'border-emerald-500/20 opacity-60' : 'border-[#2A2640]'}`}>
      <div className="flex items-start gap-3 p-3">
        <button onClick={() => onUpdate({ done: !item.done })} className="mt-0.5 shrink-0">
          {item.done
            ? <CheckCircle2 size={16} className="text-emerald-400" />
            : <Circle size={16} className="text-gray-600 hover:text-violet-400 transition-colors" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 justify-between">
            <div className="flex-1 min-w-0">
              <span className="text-xs text-gray-600 mr-2">{index}.</span>
              <span className={`text-sm font-medium ${item.done ? 'line-through text-gray-500' : 'text-white'}`}>
                {item.topic}
              </span>
              {item.owner && <span className="ml-2 text-xs text-gray-500">— {item.owner}</span>}
              {item.durationMinutes && <span className="ml-2 text-xs text-gray-600">{item.durationMinutes}m</span>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onToggleEdit} className="p-1 text-gray-600 hover:text-violet-400 transition-colors text-xs">
                {isEditing ? 'Done' : 'Notes'}
              </button>
              <button onClick={onDelete} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          {isEditing && (
            <textarea
              value={item.notes ?? ''}
              onChange={e => onUpdate({ notes: e.target.value })}
              rows={2}
              placeholder="Add notes for this agenda item…"
              autoFocus
              className="mt-2 w-full px-2 py-1.5 rounded-lg bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-xs resize-none focus:outline-none focus:border-violet-500"
            />
          )}
          {!isEditing && item.notes && (
            <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{item.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────

function NotesTab({
  notes, onUpdate, completedAgenda, totalAgenda,
}: {
  notes: string; onUpdate: (n: string) => void;
  completedAgenda: number; totalAgenda: number;
}) {
  return (
    <div className="space-y-4">
      {totalAgenda > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
          <CheckCircle2 size={12} className="text-emerald-400" />
          {completedAgenda}/{totalAgenda} agenda items covered
        </div>
      )}
      <textarea
        value={notes}
        onChange={e => onUpdate(e.target.value)}
        rows={20}
        placeholder={'Notes taken during the meeting…\n\nTip: Use • for bullet points, == for highlights, [name] for people'}
        className="w-full px-4 py-3 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500 leading-relaxed"
      />
    </div>
  );
}

// ─── Follow-ups Tab ───────────────────────────────────────────────────────────

function FollowUpsTab({
  meeting, tasks,
  onAddActionItem, onUpdateActionItem, onDeleteActionItem,
  onConvertToTask,
}: {
  meeting: Meeting;
  tasks: Task[];
  onAddActionItem: (item: Omit<MeetingActionItem, 'id'>) => void;
  onUpdateActionItem: (id: string, u: Partial<MeetingActionItem>) => void;
  onDeleteActionItem: (id: string) => void;
  onConvertToTask: (actionItemId: string, taskData: Omit<Task, 'id' | 'createdAt'>) => void;
}) {
  const [newWhat, setNewWhat]   = useState('');
  const [newWho,  setNewWho]    = useState('');
  const [newDue,  setNewDue]    = useState('');

  const handleAdd = () => {
    const what = newWhat.trim();
    if (!what) return;
    onAddActionItem({ what, who: newWho.trim() || undefined, dueDate: newDue || undefined, done: false });
    setNewWhat(''); setNewWho(''); setNewDue('');
  };

  const pending   = meeting.actionItems.filter(a => !a.done);
  const completed = meeting.actionItems.filter(a => a.done);

  return (
    <div className="space-y-5">
      {/* Add new action */}
      <div className="bg-[#1A1824] border border-[#2A2640] rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3">Capture follow-up action</p>
        <input
          value={newWhat}
          onChange={e => setNewWhat(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="What needs to happen? *"
          className="w-full px-3 py-2.5 mb-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
        />
        <div className="flex gap-2">
          <input
            value={newWho}
            onChange={e => setNewWho(e.target.value)}
            placeholder="Who?"
            className="flex-1 px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500"
          />
          <input
            type="date"
            value={newDue}
            onChange={e => setNewDue(e.target.value)}
            className="w-40 px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-sm focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={handleAdd}
            disabled={!newWhat.trim()}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2 px-1">Open ({pending.length})</p>
          <div className="space-y-2">
            {pending.map(a => (
              <ActionItemRow
                key={a.id}
                item={a}
                tasks={tasks}
                onUpdate={u => onUpdateActionItem(a.id, u)}
                onDelete={() => onDeleteActionItem(a.id)}
                onConvertToTask={taskData => onConvertToTask(a.id, taskData)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2 px-1">Done ({completed.length})</p>
          <div className="space-y-2 opacity-60">
            {completed.map(a => (
              <ActionItemRow
                key={a.id}
                item={a}
                tasks={tasks}
                onUpdate={u => onUpdateActionItem(a.id, u)}
                onDelete={() => onDeleteActionItem(a.id)}
                onConvertToTask={taskData => onConvertToTask(a.id, taskData)}
              />
            ))}
          </div>
        </div>
      )}

      {meeting.actionItems.length === 0 && (
        <div className="text-center py-12">
          <ListChecks size={36} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No follow-up actions yet</p>
          <p className="text-gray-600 text-xs mt-1">Add actions above as you capture them during the meeting</p>
        </div>
      )}
    </div>
  );
}

function ActionItemRow({
  item, tasks, onUpdate, onDelete, onConvertToTask,
}: {
  item: MeetingActionItem;
  tasks: Task[];
  onUpdate: (u: Partial<MeetingActionItem>) => void;
  onDelete: () => void;
  onConvertToTask: (taskData: Omit<Task, 'id' | 'createdAt'>) => void;
}) {
  const linkedTask = item.linkedTaskId ? tasks.find(t => t.id === item.linkedTaskId) : null;
  // linkedTaskId set but task was deleted — stale reference
  const hasStaleLink = !!item.linkedTaskId && !linkedTask;
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = !item.done && item.dueDate && item.dueDate < today;

  const handleConvert = () => {
    onConvertToTask({
      title: item.what,
      commitmentNote: item.who ? `Assigned to: ${item.who}` : undefined,
      quadrant: 'schedule',
      priority: 'medium',
      column: 'backlog',
      tags: ['meeting-action'],
    });
  };

  return (
    <div className={`bg-[#1A1824] border rounded-xl p-3 transition-colors ${item.done ? 'border-emerald-500/20' : isOverdue ? 'border-amber-500/30' : 'border-[#2A2640]'}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => onUpdate({ done: !item.done })} className="mt-0.5 shrink-0">
          {item.done
            ? <CheckCircle2 size={16} className="text-emerald-400" />
            : <Circle size={16} className="text-gray-600 hover:text-violet-400 transition-colors" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${item.done ? 'line-through text-gray-500' : 'text-white'}`}>
            {item.what}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {item.who && <span className="text-xs text-gray-500">→ {item.who}</span>}
            {item.dueDate && (
              <span className={`text-xs ${isOverdue ? 'text-amber-400' : 'text-gray-500'}`}>
                {isOverdue ? '⚠ ' : ''}Due {item.dueDate}
              </span>
            )}
            {linkedTask && (
              <span className="text-xs text-violet-400 flex items-center gap-1">
                <CheckCircle2 size={10} /> Task: {linkedTask.title.slice(0, 30)}{linkedTask.title.length > 30 ? '…' : ''}
              </span>
            )}
            {hasStaleLink && (
              <button
                onClick={() => onUpdate({ linkedTaskId: undefined })}
                className="text-xs text-gray-600 hover:text-amber-400 transition-colors flex items-center gap-1"
                title="Linked task was deleted — click to clear"
              >
                <X size={10} /> Task deleted
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!linkedTask && !hasStaleLink && !item.done && (
            <button
              onClick={handleConvert}
              title="Convert to task"
              className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 transition-colors whitespace-nowrap"
            >
              → Task
            </button>
          )}
          <button onClick={onDelete} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Section wrapper ────────────────────────────────────────────────────

function Section({ title, subtitle, action, children }: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
