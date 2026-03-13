export type QuadrantId = 'do-now' | 'schedule' | 'delegate' | 'drop';
export type KanbanColumnId = 'backlog' | 'in-progress' | 'done';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type EnergyLevel = 'deep-work' | 'quick-win' | 'admin' | 'creative';
export type RecurrenceType = 'daily' | 'weekdays' | 'weekly' | 'monthly';
export type InfluenceLevel = 'high' | 'medium' | 'low';
export type InterestLevel  = 'high' | 'medium' | 'low';

export type View =
  | 'dashboard'
  | 'kanban'
  | 'eisenhower'
  | 'okrs'
  | 'swot'
  | 'first-team'
  | 'delegations'
  | 'frameworks'
  | 'updates'
  | 'focus'
  | 'dump'
  | 'north-star'
  | 'decision-log'
  | 'weekly-review'
  | 'stakeholders'
  | 'direct-reports';

export type DumpItemStatus = 'inbox' | 'task' | 'idea' | 'archived';

export interface RecurrenceRule {
  type: RecurrenceType;
  endDate?: string;
}

export interface DumpItem {
  id: string;
  content: string;
  createdAt: string;
  status: DumpItemStatus;
  convertedTaskId?: string;
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
  discussedWith: string[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  quadrant: QuadrantId;
  column: KanbanColumnId;
  priority: Priority;
  energy?: EnergyLevel;
  dueDate?: string;
  tags: string[];
  commitmentNote?: string;
  createdAt: string;
  completedAt?: string;
  recurrence?: RecurrenceRule;
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
  progress: number;
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
  linkedTaskIds?: string[];
}

export interface Decision {
  id: string;
  title: string;
  context: string;
  decision: string;
  alternatives?: string;
  outcome?: string;
  people?: string;
  madeAt: string;
  reviewAt?: string;
}

export interface Commitment {
  id: string;
  what: string;
  to: string;
  dueDate?: string;
  done: boolean;
  createdAt: string;
}

export interface WeeklyReview {
  id: string;
  weekOf: string;
  wins: string;
  slipped: string;
  commitmentsMade: string;
  nextWeekFocus: string;
  energyRating: number;
  notes?: string;
  completedAt: string;
}

export interface NorthStar {
  statement: string;
  antiGoals: string[];
  pillars: string[];
  updatedAt: string;
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
  backlog: { label: 'Backlog', color: 'text-gray-400', accent: 'bg-gray-600' },
  'in-progress': { label: 'In Progress', color: 'text-violet-300', accent: 'bg-violet-500' },
  done: { label: 'Done', color: 'text-emerald-400', accent: 'bg-emerald-500' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-400', dot: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-400', dot: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'text-amber-400', dot: 'bg-amber-500' },
  low: { label: 'Low', color: 'text-blue-400', dot: 'bg-blue-500' },
};

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  org?: string;
  influence: InfluenceLevel;
  interest: InterestLevel;
  strategy?: string;
  notes?: string;
  createdAt: string;
}

export interface DirectReportProfile {
  personId: string;
  growthGoals: string;
  strengths: string[];
  developmentAreas: string[];
  performanceNotes: string;
  lastUpdated: string;
}

export const ENERGY_CONFIG: Record<EnergyLevel, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  'deep-work': { label: 'Deep Work', emoji: '🧠', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  'quick-win': { label: 'Quick Win', emoji: '⚡', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  'admin':     { label: 'Admin',     emoji: '📋', color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/30'   },
  'creative':  { label: 'Creative',  emoji: '🎨', color: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/30'   },
};
