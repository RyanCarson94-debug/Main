import { useState, useMemo } from 'react';
import {
  FolderKanban, Plus, ChevronRight, CheckCircle2, Circle, Trash2,
  X, Target, ClipboardList, AlertTriangle, Layers,
} from 'lucide-react';
import type { Project, ProjectStatus, MilestoneStatus, ProjectMilestone, Task, OKR } from '../types';

// ─── Config ───────────────────────────────────────────────────────────────────

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  'not-started': { label: 'Not Started', color: 'text-gray-400',    bg: 'bg-gray-500/10',    border: 'border-gray-500/30',    dot: 'bg-gray-500'    },
  'on-track':    { label: 'On Track',    color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  'at-risk':     { label: 'At Risk',     color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   dot: 'bg-amber-400'   },
  'blocked':     { label: 'Blocked',     color: 'text-red-300',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     dot: 'bg-red-500'     },
  'completed':   { label: 'Completed',   color: 'text-violet-300',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  dot: 'bg-violet-400'  },
  'cancelled':   { label: 'Cancelled',   color: 'text-gray-500',    bg: 'bg-gray-500/5',     border: 'border-gray-600/20',    dot: 'bg-gray-600'    },
};

const MILESTONE_STATUS_CONFIG: Record<MilestoneStatus, { label: string; color: string }> = {
  'pending':     { label: 'Pending',     color: 'text-gray-400'    },
  'in-progress': { label: 'In Progress', color: 'text-sky-300'     },
  'completed':   { label: 'Done',        color: 'text-emerald-300' },
  'blocked':     { label: 'Blocked',     color: 'text-red-400'     },
};

// ─── New / Edit Project Modal ─────────────────────────────────────────────────

interface ProjectModalProps {
  onSave: (p: Omit<Project, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  editProject?: Project | null;
}

function ProjectModal({ onSave, onClose, editProject }: ProjectModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [title,     setTitle]     = useState(editProject?.title     ?? '');
  const [desc,      setDesc]      = useState(editProject?.description ?? '');
  const [status,    setStatus]    = useState<ProjectStatus>(editProject?.status ?? 'not-started');
  const [owner,     setOwner]     = useState(editProject?.owner     ?? '');
  const [startDate, setStartDate] = useState(editProject?.startDate ?? today);
  const [dueDate,   setDueDate]   = useState(editProject?.dueDate   ?? '');
  const [success,   setSuccess]   = useState(editProject?.successCriteria ?? '');
  const [risks,     setRisks]     = useState(editProject?.risks     ?? '');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: desc.trim() || undefined,
      status,
      owner: owner.trim() || undefined,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      successCriteria: success.trim() || undefined,
      risks: risks.trim() || undefined,
      notes:       editProject?.notes       ?? '',
      milestones:  editProject?.milestones  ?? [],
      linkedOKRIds:  editProject?.linkedOKRIds  ?? [],
      linkedTaskIds: editProject?.linkedTaskIds ?? [],
      completedAt: editProject?.completedAt,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1824] border border-[#2A2640] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2640]">
          <h2 className="text-base font-bold text-white">{editProject ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Project Name *</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Platform Redesign, Q3 GTM Launch"
              className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="What is this project trying to accomplish?"
              className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-sm focus:outline-none focus:border-violet-500">
                {(Object.keys(PROJECT_STATUS_CONFIG) as ProjectStatus[]).map(s => (
                  <option key={s} value={s}>{PROJECT_STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Owner</label>
              <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Who's driving this?"
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-sm focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Target Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-sm focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Success Criteria <span className="text-gray-600 font-normal">— what does done look like?</span></label>
            <textarea value={success} onChange={e => setSuccess(e.target.value)} rows={2}
              placeholder="e.g. Platform ships to 100% of users with zero P0 bugs, NPS > 45"
              className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Key Risks</label>
            <textarea value={risks} onChange={e => setRisks(e.target.value)} rows={2}
              placeholder="e.g. Dependency on vendor X, resource constraints in August"
              className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#2A2640] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#2A2640] text-gray-400 hover:text-gray-200 text-sm font-semibold transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!title.trim()}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {editProject ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, tasks, onClick, onDelete }: {
  project: Project; tasks: Task[]; onClick: () => void; onDelete: () => void;
}) {
  const cfg = PROJECT_STATUS_CONFIG[project.status];
  const milestonesDone  = project.milestones.filter(m => m.status === 'completed').length;
  const milestonesTotal = project.milestones.length;
  const progress        = milestonesTotal > 0 ? Math.round((milestonesDone / milestonesTotal) * 100) : 0;
  const openTasks       = tasks.filter(t => project.linkedTaskIds.includes(t.id) && t.column !== 'done').length;
  const today           = new Date().toISOString().split('T')[0];
  const isOverdue       = project.dueDate && project.dueDate < today && project.status !== 'completed' && project.status !== 'cancelled';
  const hasBlocked      = project.milestones.some(m => m.status === 'blocked');

  return (
    <div onClick={onClick}
      className={`group relative bg-[#1A1824] border rounded-2xl p-4 cursor-pointer hover:border-violet-500/50 transition-all ${
        project.status === 'blocked' ? 'border-red-500/30' :
        isOverdue                    ? 'border-amber-500/30' :
        'border-[#2A2640]'
      }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
            </span>
            {isOverdue && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">OVERDUE</span>}
            {hasBlocked && project.status !== 'blocked' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">MILESTONE BLOCKED</span>}
          </div>
          <h3 className="font-bold text-white text-sm leading-tight">{project.title}</h3>
          {project.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{project.description}</p>}
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 shrink-0 p-1 text-gray-600 hover:text-red-400 transition-all">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Progress bar */}
      {milestonesTotal > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{milestonesDone}/{milestonesTotal} milestones</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-[#2A2640] rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
        {project.owner && <span>{project.owner}</span>}
        {project.dueDate && (
          <span className={isOverdue ? 'text-amber-400' : ''}>
            Due {new Date(project.dueDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
        {openTasks > 0 && <span className="flex items-center gap-1"><ClipboardList size={10} /> {openTasks} open task{openTasks !== 1 ? 's' : ''}</span>}
        {project.linkedOKRIds.length > 0 && <span className="flex items-center gap-1"><Target size={10} /> {project.linkedOKRIds.length} OKR{project.linkedOKRIds.length !== 1 ? 's' : ''}</span>}
      </div>

      <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 group-hover:text-violet-400 transition-colors" />
    </div>
  );
}

// ─── Projects List View ───────────────────────────────────────────────────────

interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  okrs: OKR[];
  onAdd: (p: Omit<Project, 'id' | 'createdAt'>) => Project;
  onUpdate: (id: string, updates: Partial<Project>) => void;
  onDelete: (id: string) => void;
  onAddMilestone: (projectId: string, m: Omit<ProjectMilestone, 'id'>) => void;
  onUpdateMilestone: (projectId: string, milestoneId: string, updates: Partial<ProjectMilestone>) => void;
  onDeleteMilestone: (projectId: string, milestoneId: string) => void;
  onLinkTask: (projectId: string, taskId: string) => void;
  onUnlinkTask: (projectId: string, taskId: string) => void;
  onLinkOKR: (projectId: string, okrId: string) => void;
  onUnlinkOKR: (projectId: string, okrId: string) => void;
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
}

type StatusFilter = 'active' | 'all' | 'completed';

export function ProjectsView({
  projects, tasks, okrs,
  onAdd, onUpdate, onDelete,
  onAddMilestone, onUpdateMilestone, onDeleteMilestone,
  onLinkTask, onUnlinkTask, onLinkOKR, onUnlinkOKR,
  selectedProjectId, onSelectProject,
}: ProjectsViewProps) {
  const [filter,     setFilter]     = useState<StatusFilter>('active');
  const [showModal,  setShowModal]  = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    const sorted = [...projects].sort((a, b) => {
      const order: ProjectStatus[] = ['blocked', 'at-risk', 'on-track', 'not-started', 'completed', 'cancelled'];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });
    if (filter === 'active')    return sorted.filter(p => !['completed', 'cancelled'].includes(p.status));
    if (filter === 'completed') return sorted.filter(p => p.status === 'completed' || p.status === 'cancelled');
    return sorted;
  }, [projects, filter]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null;

  const handleAdd = (data: Omit<Project, 'id' | 'createdAt'>) => {
    const p = onAdd(data);
    onSelectProject(p.id);
  };

  const handleEdit = (data: Omit<Project, 'id' | 'createdAt'>) => {
    if (!editProject) return;
    onUpdate(editProject.id, data);
    setEditProject(null);
  };

  const handleDelete = (id: string) => {
    if (selectedProjectId === id) onSelectProject(null);
    onDelete(id);
  };

  if (selectedProject) {
    return (
      <>
        <ProjectDetail
          project={selectedProject}
          tasks={tasks}
          okrs={okrs}
          onBack={() => onSelectProject(null)}
          onUpdate={updates => onUpdate(selectedProject.id, updates)}
          onEdit={() => setEditProject(selectedProject)}
          onAddMilestone={m => onAddMilestone(selectedProject.id, m)}
          onUpdateMilestone={(mId, u) => onUpdateMilestone(selectedProject.id, mId, u)}
          onDeleteMilestone={mId => onDeleteMilestone(selectedProject.id, mId)}
          onLinkTask={taskId => onLinkTask(selectedProject.id, taskId)}
          onUnlinkTask={taskId => onUnlinkTask(selectedProject.id, taskId)}
          onLinkOKR={okrId => onLinkOKR(selectedProject.id, okrId)}
          onUnlinkOKR={okrId => onUnlinkOKR(selectedProject.id, okrId)}
        />
        {editProject && (
          <ProjectModal editProject={editProject} onSave={handleEdit} onClose={() => setEditProject(null)} />
        )}
      </>
    );
  }

  const active    = projects.filter(p => !['completed', 'cancelled'].includes(p.status));
  const blocked   = active.filter(p => p.status === 'blocked');
  const atRisk    = active.filter(p => p.status === 'at-risk');
  const openTasks = tasks.filter(t => projects.some(p => p.linkedTaskIds.includes(t.id)) && t.column !== 'done').length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <FolderKanban className="text-violet-400" size={24} /> Projects
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">Initiatives, milestones, and the work that connects tasks to strategy</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-all active:scale-95">
          <Plus size={16} /> New Project
        </button>
      </div>

      {projects.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-5 shrink-0">
          {[
            { label: 'Active',      value: active.length,    color: 'text-violet-300'  },
            { label: 'Blocked',     value: blocked.length,   color: blocked.length > 0  ? 'text-red-300'   : 'text-gray-500' },
            { label: 'At Risk',     value: atRisk.length,    color: atRisk.length > 0   ? 'text-amber-300' : 'text-gray-500' },
            { label: 'Open Tasks',  value: openTasks,        color: 'text-sky-300'      },
          ].map(s => (
            <div key={s.label} className="bg-[#1A1824] border border-[#2A2640] rounded-xl px-4 py-3 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 mb-4 shrink-0">
        {(['active', 'all', 'completed'] as StatusFilter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${
              filter === f ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}>
            {f === 'active' ? `Active (${active.length})` : f === 'completed' ? `Done (${projects.filter(p => ['completed','cancelled'].includes(p.status)).length})` : `All (${projects.length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Layers size={40} className="text-gray-700 mb-3" />
            <p className="text-gray-500 font-semibold">{filter === 'active' ? 'No active projects' : 'No projects yet'}</p>
            <button onClick={() => setShowModal(true)}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors">
              <Plus size={14} /> Create your first project
            </button>
          </div>
        ) : (
          filtered.map(p => (
            <ProjectCard key={p.id} project={p} tasks={tasks}
              onClick={() => onSelectProject(p.id)}
              onDelete={() => handleDelete(p.id)} />
          ))
        )}
      </div>

      {showModal  && <ProjectModal onSave={handleAdd}  onClose={() => setShowModal(false)} />}
      {editProject && <ProjectModal editProject={editProject} onSave={handleEdit} onClose={() => setEditProject(null)} />}
    </div>
  );
}

// ─── Project Detail ───────────────────────────────────────────────────────────

type ProjectTab = 'overview' | 'milestones' | 'tasks' | 'links';

function ProjectDetail({
  project, tasks, okrs,
  onBack, onUpdate, onEdit,
  onAddMilestone, onUpdateMilestone, onDeleteMilestone,
  onLinkTask, onUnlinkTask, onLinkOKR, onUnlinkOKR,
}: {
  project: Project; tasks: Task[]; okrs: OKR[];
  onBack: () => void; onUpdate: (u: Partial<Project>) => void; onEdit: () => void;
  onAddMilestone: (m: Omit<ProjectMilestone, 'id'>) => void;
  onUpdateMilestone: (id: string, u: Partial<ProjectMilestone>) => void;
  onDeleteMilestone: (id: string) => void;
  onLinkTask: (taskId: string) => void; onUnlinkTask: (taskId: string) => void;
  onLinkOKR: (okrId: string) => void;  onUnlinkOKR: (okrId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview');
  const cfg = PROJECT_STATUS_CONFIG[project.status];

  const milestonesDone  = project.milestones.filter(m => m.status === 'completed').length;
  const milestonesTotal = project.milestones.length;
  const progress        = milestonesTotal > 0 ? Math.round((milestonesDone / milestonesTotal) * 100) : 0;
  const today           = new Date().toISOString().split('T')[0];
  const isOverdue       = project.dueDate && project.dueDate < today && !['completed','cancelled'].includes(project.status);
  const linkedTasks     = tasks.filter(t => project.linkedTaskIds.includes(t.id));
  const openTaskCount   = linkedTasks.filter(t => t.column !== 'done').length;

  const statusOptions = Object.keys(PROJECT_STATUS_CONFIG) as ProjectStatus[];

  const tabs: { id: ProjectTab; label: string; badge?: number }[] = [
    { id: 'overview',   label: 'Overview' },
    { id: 'milestones', label: 'Milestones', badge: milestonesTotal > 0 ? milestonesTotal : undefined },
    { id: 'tasks',      label: 'Tasks',      badge: openTaskCount > 0 ? openTaskCount : undefined },
    { id: 'links',      label: 'OKR Links',  badge: project.linkedOKRIds.length > 0 ? project.linkedOKRIds.length : undefined },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-3 transition-colors">
          <ChevronRight size={12} className="rotate-180" /> All projects
        </button>
        <div className="flex items-start gap-4 justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
              </span>
              {isOverdue && <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30">OVERDUE</span>}
            </div>
            <h2 className="text-xl font-black text-white leading-tight">{project.title}</h2>
            {project.description && <p className="text-sm text-gray-400 mt-1">{project.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
              {project.owner     && <span>Owner: {project.owner}</span>}
              {project.startDate && <span>Start: {project.startDate}</span>}
              {project.dueDate   && <span className={isOverdue ? 'text-amber-400' : ''}>Due: {project.dueDate}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Inline status changer */}
            <select
              value={project.status}
              onChange={e => {
                const s = e.target.value as ProjectStatus;
                onUpdate({ status: s, completedAt: s === 'completed' ? new Date().toISOString() : undefined });
              }}
              className="px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-xs font-semibold focus:outline-none focus:border-violet-500"
            >
              {statusOptions.map(s => <option key={s} value={s}>{PROJECT_STATUS_CONFIG[s].label}</option>)}
            </select>
            <button onClick={onEdit} className="px-3 py-2 rounded-xl border border-[#2A2640] text-gray-400 hover:text-gray-200 text-xs font-semibold transition-colors">Edit</button>
          </div>
        </div>

        {/* Progress bar */}
        {milestonesTotal > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{milestonesDone}/{milestonesTotal} milestones complete</span>
              <span className="font-semibold text-violet-300">{progress}%</span>
            </div>
            <div className="h-2 bg-[#2A2640] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 shrink-0 border-b border-[#2A2640]">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`relative px-4 py-2 text-sm font-semibold transition-colors -mb-px ${
              activeTab === t.id ? 'text-violet-300 border-b-2 border-violet-400' : 'text-gray-500 hover:text-gray-300'
            }`}>
            {t.label}
            {t.badge != null && (
              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {activeTab === 'overview'   && <OverviewTab project={project} onUpdate={onUpdate} />}
        {activeTab === 'milestones' && <MilestonesTab project={project} tasks={tasks} onAdd={onAddMilestone} onUpdate={onUpdateMilestone} onDelete={onDeleteMilestone} />}
        {activeTab === 'tasks'      && <ProjectTasksTab project={project} tasks={tasks} onLink={onLinkTask} onUnlink={onUnlinkTask} />}
        {activeTab === 'links'      && <OKRLinksTab project={project} okrs={okrs} onLink={onLinkOKR} onUnlink={onUnlinkOKR} />}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ project, onUpdate }: { project: Project; onUpdate: (u: Partial<Project>) => void }) {
  return (
    <div className="space-y-5">
      <FieldBlock label="Success Criteria" subtitle="What does done look like?">
        <textarea value={project.successCriteria ?? ''} onChange={e => onUpdate({ successCriteria: e.target.value })} rows={3}
          placeholder="e.g. Platform ships to 100% of users, NPS > 45, zero P0 bugs open"
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500" />
      </FieldBlock>
      <FieldBlock label="Key Risks">
        <textarea value={project.risks ?? ''} onChange={e => onUpdate({ risks: e.target.value })} rows={3}
          placeholder="e.g. Vendor dependency, headcount gap in August, competing priorities from stakeholders"
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500" />
      </FieldBlock>
      <FieldBlock label="Notes" subtitle="Status updates, decisions, context">
        <textarea value={project.notes ?? ''} onChange={e => onUpdate({ notes: e.target.value })} rows={5}
          placeholder="Running notes, status updates, decisions made…"
          className="w-full px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm resize-none focus:outline-none focus:border-violet-500" />
      </FieldBlock>
    </div>
  );
}

// ─── Milestones Tab ───────────────────────────────────────────────────────────

function MilestonesTab({ project, tasks, onAdd, onUpdate, onDelete }: {
  project: Project; tasks: Task[];
  onAdd: (m: Omit<ProjectMilestone, 'id'>) => void;
  onUpdate: (id: string, u: Partial<ProjectMilestone>) => void;
  onDelete: (id: string) => void;
}) {
  const [newTitle,  setNewTitle]  = useState('');
  const [newDue,    setNewDue]    = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) return;
    onAdd({ title, dueDate: newDue || undefined, status: 'pending', linkedTaskIds: [] });
    setNewTitle(''); setNewDue('');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      {project.milestones.map((m, i) => {
        const milestoneStatus = MILESTONE_STATUS_CONFIG[m.status];
        const isOverdue = m.dueDate && m.dueDate < today && m.status !== 'completed';
        const milestoneTaskCount = tasks.filter(t => m.linkedTaskIds.includes(t.id)).length;

        return (
          <div key={m.id} className={`bg-[#1A1824] border rounded-xl transition-colors ${
            m.status === 'blocked' ? 'border-red-500/30' : isOverdue ? 'border-amber-500/30' : 'border-[#2A2640]'
          }`}>
            <div className="flex items-start gap-3 p-3">
              <button onClick={() => onUpdate(m.id, { status: m.status === 'completed' ? 'pending' : 'completed' })} className="mt-0.5 shrink-0">
                {m.status === 'completed'
                  ? <CheckCircle2 size={16} className="text-emerald-400" />
                  : <Circle size={16} className="text-gray-600 hover:text-violet-400 transition-colors" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-600">{i + 1}.</span>
                    <span className={`text-sm font-medium ${m.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>{m.title}</span>
                    <span className={`text-[10px] font-semibold ${milestoneStatus.color}`}>{milestoneStatus.label}</span>
                    {isOverdue && <AlertTriangle size={11} className="text-amber-400" />}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                      className="text-xs text-gray-600 hover:text-violet-400 px-1.5 py-0.5 transition-colors">
                      {expandedId === m.id ? 'Close' : 'Notes'}
                    </button>
                    <select value={m.status} onChange={e => onUpdate(m.id, { status: e.target.value as MilestoneStatus })}
                      onClick={e => e.stopPropagation()}
                      className="bg-[#12111A] border border-[#2A2640] text-gray-400 text-[10px] rounded-lg px-1.5 py-0.5 focus:outline-none">
                      {(Object.keys(MILESTONE_STATUS_CONFIG) as MilestoneStatus[]).map(s => (
                        <option key={s} value={s}>{MILESTONE_STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                    <button onClick={() => onDelete(m.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {m.dueDate && <span className={isOverdue ? 'text-amber-400' : ''}>Due {m.dueDate}</span>}
                  {milestoneTaskCount > 0 && <span>{milestoneTaskCount} task{milestoneTaskCount !== 1 ? 's' : ''}</span>}
                </div>
                {expandedId === m.id && (
                  <textarea value={m.notes ?? ''} onChange={e => onUpdate(m.id, { notes: e.target.value })} rows={2} autoFocus
                    placeholder="Add notes for this milestone…"
                    className="mt-2 w-full px-2 py-1.5 rounded-lg bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-xs resize-none focus:outline-none focus:border-violet-500" />
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Add new */}
      <div className="bg-[#1A1824] border border-[#2A2640] rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3">Add milestone</p>
        <div className="flex gap-2">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="Milestone title *"
            className="flex-1 px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
          <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)}
            className="w-36 px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white text-sm focus:outline-none focus:border-violet-500" />
          <button onClick={handleAdd} disabled={!newTitle.trim()}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-40">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Tasks Tab ────────────────────────────────────────────────────────

function ProjectTasksTab({ project, tasks, onLink, onUnlink }: {
  project: Project; tasks: Task[];
  onLink: (taskId: string) => void; onUnlink: (taskId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const linked   = tasks.filter(t => project.linkedTaskIds.includes(t.id));
  const unlinked = tasks.filter(t =>
    !project.linkedTaskIds.includes(t.id) && t.column !== 'done' &&
    (search === '' || t.title.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 6);

  return (
    <div className="space-y-4">
      {linked.length > 0 ? (
        <div className="space-y-2">
          {linked.map(t => (
            <div key={t.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] group">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {t.column === 'done'
                  ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  : <Circle size={13} className="text-gray-600 shrink-0" />}
                <span className={`text-sm truncate ${t.column === 'done' ? 'line-through text-gray-500' : 'text-gray-300'}`}>{t.title}</span>
              </div>
              <button onClick={() => onUnlink(t.id)} className="ml-2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-600 px-1">No tasks linked yet</p>
      )}

      <div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search open tasks to link…"
          className="w-full px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
        {search && (
          <div className="mt-1.5 space-y-1">
            {unlinked.length > 0 ? unlinked.map(t => (
              <button key={t.id} onClick={() => { onLink(t.id); setSearch(''); }}
                className="w-full text-left px-3 py-2 rounded-xl bg-[#1A1824] border border-[#2A2640] hover:border-violet-500/50 text-sm text-gray-300 transition-colors flex items-center gap-2">
                <Plus size={12} className="text-violet-400 shrink-0" />
                <span className="truncate">{t.title}</span>
              </button>
            )) : <p className="text-xs text-gray-600 px-1 mt-1">No matching tasks</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── OKR Links Tab ────────────────────────────────────────────────────────────

function OKRLinksTab({ project, okrs, onLink, onUnlink }: {
  project: Project; okrs: OKR[];
  onLink: (okrId: string) => void; onUnlink: (okrId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const linked   = okrs.filter(o => project.linkedOKRIds.includes(o.id));
  const unlinked = okrs.filter(o =>
    !project.linkedOKRIds.includes(o.id) &&
    (search === '' || o.objective.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 5);

  return (
    <div className="space-y-4">
      {linked.length > 0 ? (
        <div className="space-y-2">
          {linked.map(o => (
            <div key={o.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#12111A] border border-[#2A2640] group">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate font-medium">{o.objective}</p>
                <p className="text-xs text-gray-600">{o.quarter} · {o.keyResults.length} KRs</p>
              </div>
              <button onClick={() => onUnlink(o.id)} className="ml-2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-600 px-1">No OKRs linked yet — link this project to the objectives it supports</p>
      )}

      <div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search OKRs to link…"
          className="w-full px-3 py-2 rounded-xl bg-[#12111A] border border-[#2A2640] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500" />
        {search && (
          <div className="mt-1.5 space-y-1">
            {unlinked.length > 0 ? unlinked.map(o => (
              <button key={o.id} onClick={() => { onLink(o.id); setSearch(''); }}
                className="w-full text-left px-3 py-2 rounded-xl bg-[#1A1824] border border-[#2A2640] hover:border-violet-500/50 text-sm text-gray-300 transition-colors flex items-center gap-2">
                <Plus size={12} className="text-violet-400 shrink-0" />
                <span className="truncate">{o.objective}</span>
              </button>
            )) : <p className="text-xs text-gray-600 px-1 mt-1">No matching OKRs</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function FieldBlock({ label, subtitle, children }: { label: string; subtitle?: string; children: React.ReactNode }) {
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
