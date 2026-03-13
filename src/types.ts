export type QuadrantId = 'do-now' | 'schedule' | 'delegate' | 'drop';
export type KanbanColumnId = 'backlog' | 'in-progress' | 'done';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type View = 'kanban' | 'eisenhower' | 'okrs' | 'swot' | 'first-team' | 'delegations' | 'frameworks' | 'updates' | 'focus' | 'dump';

export type DumpItemStatus = 'inbox' | 'task' | 'idea' | 'archived';

export interface DumpItem {
  id: string;
  content: string;
  createdAt: string;
  status: DumpItemStatus;
  convertedTaskId?: string; // set when converted to a task
  aiSuggestion?: {
    type: 'task' | 'idea' | 'discard';
    quadrant?: QuadrantId;
    priority?: Priority;
    reasoning: string;
  };
}

export interface FocusStep {
  id: string;
  text: string;
  estimateMinutes?: number;
  done: boolean;
}

export interface TaskFocus {
  taskId: string;
  steps: FocusStep[];
  updatedAt: string;
}

export type UpdateType = 'fyi' | 'action' | 'decision' | 'blocker';
export type PersonRelationship = 'manager' | 'direct-report' | 'peer' | 'stakeholder';

export interface UpdatePerson {
  id: string;
  name: string;
  relationship: PersonRelationship;
}

export interface Update {
  id: string;
  content: string;
  type: UpdateType;
  createdAt: string;
  recipientIds: string[];
  discussedWith: string[]; // person IDs who have been told
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  quadrant: QuadrantId;
  column: KanbanColumnId;
  priority: Priority;
  dueDate?: string;
  tags: string[];
  commitmentNote?: string;
  createdAt: string;
  completedAt?: string;
  // Delegation tracking
  delegatedTo?: string;
  delegatedAt?: string;
  followUpDate?: string;
  followUpDone?: boolean;
  delegationEmailDraft?: string;
}

export interface OKR {
  id: string;
  objective: string;
  keyResults: KeyResult[];
  quarter: string;
}

export interface KeyResult {
  id: string;
  description: string;
  progress: number; // 0-100
  target: string;
  current: string;
}

export interface SwotItem {
  id: string;
  text: string;
  category: 'strength' | 'weakness' | 'opportunity' | 'threat';
}

export interface FirstTeamMember {
  id: string;
  name: string;
  role: string;
  commitment?: string;
}

export const QUADRANTS: Record<QuadrantId, { label: string; shortLabel: string; color: string; bg: string; border: string; description: string }> = {
  'do-now': {
    label: 'Do Now',
    shortLabel: 'DO',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    description: 'Urgent + Important',
  },
  'schedule': {
    label: 'Schedule',
    shortLabel: 'PLAN',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    description: 'Not Urgent + Important',
  },
  'delegate': {
    label: 'Delegate',
    shortLabel: 'DEL',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    description: 'Urgent + Not Important',
  },
  'drop': {
    label: 'Drop',
    shortLabel: 'DROP',
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    description: 'Not Urgent + Not Important',
  },
};

export const COLUMNS: Record<KanbanColumnId, { label: string; color: string; accent: string }> = {
  backlog: { label: 'Backlog', color: 'text-gray-300', accent: 'bg-gray-500' },
  'in-progress': { label: 'In Progress', color: 'text-purple-300', accent: 'bg-purple-500' },
  done: { label: 'Done', color: 'text-emerald-300', accent: 'bg-emerald-500' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-400', dot: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-400', dot: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'text-amber-400', dot: 'bg-amber-500' },
  low: { label: 'Low', color: 'text-blue-400', dot: 'bg-blue-500' },
};
