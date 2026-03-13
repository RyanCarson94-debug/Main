import { useState } from 'react';
import { Plus, Trash2, Users, Link2, X, UserPlus } from 'lucide-react';
import type { FirstTeamMember, Task } from '../types';
import { QUADRANTS, PRIORITY_CONFIG } from '../types';

interface FirstTeamViewProps {
  members: FirstTeamMember[];
  tasks: Task[];
  onAdd: (member: Omit<FirstTeamMember, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<FirstTeamMember>) => void;
  onDelete: (id: string) => void;
  onLinkTask: (memberId: string, taskId: string) => void;
  onUnlinkTask: (memberId: string, taskId: string) => void;
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────

function AddMemberModal({
  onAdd,
  onClose,
}: {
  onAdd: (m: Omit<FirstTeamMember, 'id'>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), role: role.trim() });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#1A1824] border border-[#2A2640] p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-black text-white mb-4">Add Team Member</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
              Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="e.g. Alex Kim"
              className="w-full px-3 py-2.5 rounded-xl bg-[#1E1C28] border border-[#2A2640] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
              Role / Title
            </label>
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="e.g. VP Engineering"
              className="w-full px-3 py-2.5 rounded-xl bg-[#1E1C28] border border-[#2A2640] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-white hover:bg-white/5 transition-colors border border-white/5"
          >
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

// ─── Link Task Modal ──────────────────────────────────────────────────────────

function LinkTaskModal({
  tasks,
  linkedTaskIds,
  onLink,
  onClose,
}: {
  tasks: Task[];
  linkedTaskIds: string[];
  onLink: (taskId: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const available = tasks.filter(
    t =>
      t.column !== 'done' &&
      !linkedTaskIds.includes(t.id) &&
      (search === '' || t.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#1A1824] border border-[#2A2640] p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-black text-white mb-4">Link a Task</h3>
        <input
          autoFocus
          placeholder="Search tasks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-[#1E1C28] border border-[#2A2640] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 mb-3"
        />
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {available.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-8">
              {search ? 'No tasks match' : 'No active tasks available to link'}
            </p>
          ) : (
            available.map(task => {
              const q = QUADRANTS[task.quadrant];
              const p = PRIORITY_CONFIG[task.priority];
              return (
                <button
                  key={task.id}
                  onClick={() => {
                    onLink(task.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${q.bg} ${q.color} border ${q.border} shrink-0`}
                    >
                      {q.shortLabel}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.dot} shrink-0`} />
                    <span className="text-sm text-white truncate">{task.title}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-white hover:bg-white/5 transition-colors border border-white/5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Linked Task Card ─────────────────────────────────────────────────────────

function LinkedTaskCard({
  task,
  onUnlink,
  done = false,
}: {
  task: Task;
  onUnlink: () => void;
  done?: boolean;
}) {
  const q = QUADRANTS[task.quadrant];
  const p = PRIORITY_CONFIG[task.priority];

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        done ? 'bg-white/[0.02] border-white/5 opacity-50' : 'bg-[#1E1C28] border-[#2A2640]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${q.bg} ${q.color} border ${q.border}`}
            >
              {q.shortLabel}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${p.dot} shrink-0`} />
            <span className={`text-[10px] font-semibold ${p.color}`}>{p.label}</span>
            {task.column === 'in-progress' && (
              <span className="text-[10px] text-purple-400 font-semibold">In Progress</span>
            )}
          </div>
          <p
            className={`text-sm leading-snug ${
              done ? 'line-through text-gray-500' : 'text-gray-200'
            }`}
          >
            {task.title}
          </p>
          {task.dueDate && (
            <p className="text-[11px] text-gray-600 mt-1">
              Due{' '}
              {new Date(task.dueDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
          )}
        </div>
        <button
          onClick={onUnlink}
          title="Unlink task"
          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function FirstTeamView({
  members,
  tasks,
  onAdd,
  onDelete,
  onLinkTask,
  onUnlinkTask,
}: FirstTeamViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(members[0]?.id ?? null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showLinkTask, setShowLinkTask] = useState(false);

  const resolvedId =
    members.find(m => m.id === selectedId)?.id ?? members[0]?.id ?? null;
  const selectedMember = members.find(m => m.id === resolvedId) ?? null;

  // Resolve linked tasks, filter out deleted tasks
  const linkedTasks = selectedMember
    ? (selectedMember.linkedTaskIds ?? [])
        .map(id => tasks.find(t => t.id === id))
        .filter(Boolean as unknown as <T>(x: T | undefined) => x is T)
    : [];

  // Active task count badge per member
  const taskCounts = Object.fromEntries(
    members.map(m => [
      m.id,
      (m.linkedTaskIds ?? []).filter(id => {
        const t = tasks.find(t => t.id === id);
        return t && t.column !== 'done';
      }).length,
    ])
  );

  return (
    <div className="h-full flex gap-4">
      {/* ── Left panel ── */}
      <div className="w-[200px] shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">First Team</p>
          <button
            onClick={() => setShowAddMember(true)}
            className="p-1 rounded-lg text-gray-600 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
            title="Add member"
          >
            <UserPlus size={14} />
          </button>
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Users size={24} className="text-gray-700 mb-2" />
            <p className="text-xs text-gray-600">Add your peer leaders</p>
            <button
              onClick={() => setShowAddMember(true)}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-400 border border-white/10 hover:bg-purple-600/30 transition-colors"
            >
              + Add Member
            </button>
          </div>
        ) : (
          members.map(member => {
            const active = resolvedId === member.id;
            const count = taskCounts[member.id] ?? 0;
            return (
              <button
                key={member.id}
                onClick={() => setSelectedId(member.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                  active
                    ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/20 border border-white/10'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${
                      active ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {member.name}
                  </p>
                  <p className="text-[10px] text-pink-400 truncate">
                    {member.role || 'No role'}
                  </p>
                </div>
                {count > 0 && (
                  <span className="shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-white/10">
                    {count}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedMember ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Users size={36} className="text-gray-700 mb-3" />
            <p className="text-sm font-semibold text-gray-600">Select a team member</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                  <Users size={18} className="text-pink-400" />
                  {selectedMember.name}
                </h1>
                <p className="text-xs mt-0.5">
                  <span className="text-pink-400">{selectedMember.role || 'No role set'}</span>
                  {linkedTasks.filter(t => t.column !== 'done').length > 0 && (
                    <span className="text-gray-500">
                      {' · '}
                      {linkedTasks.filter(t => t.column !== 'done').length} active task
                      {linkedTasks.filter(t => t.column !== 'done').length !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLinkTask(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
                >
                  <Link2 size={13} />
                  Link Task
                </button>
                <button
                  onClick={() => onDelete(selectedMember.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove member"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Linked tasks */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {linkedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Link2 size={32} className="text-gray-700 mb-3" />
                  <p className="text-sm font-semibold text-gray-600">No tasks linked yet</p>
                  <p className="text-xs text-gray-700 mt-1">
                    Link tasks you need to do for or with {selectedMember.name}
                  </p>
                  <button
                    onClick={() => setShowLinkTask(true)}
                    className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
                  >
                    <Plus size={13} />
                    Link first task
                  </button>
                </div>
              ) : (
                <>
                  {linkedTasks.filter(t => t.column !== 'done').length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Active ({linkedTasks.filter(t => t.column !== 'done').length})
                      </p>
                      {linkedTasks
                        .filter(t => t.column !== 'done')
                        .map(task => (
                          <LinkedTaskCard
                            key={task.id}
                            task={task}
                            onUnlink={() => onUnlinkTask(selectedMember.id, task.id)}
                          />
                        ))}
                    </div>
                  )}

                  {linkedTasks.filter(t => t.column === 'done').length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Done
                      </p>
                      {linkedTasks
                        .filter(t => t.column === 'done')
                        .map(task => (
                          <LinkedTaskCard
                            key={task.id}
                            task={task}
                            onUnlink={() => onUnlinkTask(selectedMember.id, task.id)}
                            done
                          />
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showAddMember && (
        <AddMemberModal onAdd={onAdd} onClose={() => setShowAddMember(false)} />
      )}
      {showLinkTask && selectedMember && (
        <LinkTaskModal
          tasks={tasks}
          linkedTaskIds={selectedMember.linkedTaskIds ?? []}
          onLink={taskId => onLinkTask(selectedMember.id, taskId)}
          onClose={() => setShowLinkTask(false)}
        />
      )}
    </div>
  );
}
