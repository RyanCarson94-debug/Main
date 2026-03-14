export type QuadrantId = 'do-now' | 'schedule' | 'delegate' | 'drop';
export type KanbanColumnId = 'backlog' | 'in-progress' | 'done';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type EnergyLevel = 'deep-work' | 'quick-win' | 'admin' | 'creative';
export type RecurrenceType = 'daily' | 'weekdays' | 'weekly' | 'monthly';
export type InfluenceLevel = 'high' | 'medium' | 'low';
export type InterestLevel  = 'high' | 'medium' | 'low';
export type MeetingType = 'team' | 'standup' | 'all-hands' | 'client' | 'board' | 'strategy' | 'retrospective' | 'workshop' | 'one-on-one' | 'other';
export type MeetingStatus = 'upcoming' | 'completed' | 'cancelled';
export type ProjectStatus = 'not-started' | 'on-track' | 'at-risk' | 'blocked' | 'completed' | 'cancelled';
export type MilestoneStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';
export type ConversationType =
  | 'feedback-positive' | 'feedback-constructive' | 'performance-issue'
  | 'role-change' | 'conflict-resolution' | 'stakeholder-pushback'
  | 'letting-go' | 'boundary-setting' | 'difficult-ask' | 'other';
export type ConversationStatus = 'planning' | 'ready' | 'had' | 'postponed';
export type QuarterlyPlanStatus = 'draft' | 'active' | 'complete';
export type RoleCharterStatus = 'draft' | 'active' | 'vacant' | 'being-hired';

export interface QuarterlyPlan {
  id: string;
  quarter: string;          // e.g. "Q2 2026"
  quarterNum: 1 | 2 | 3 | 4;
  year: number;
  status: QuarterlyPlanStatus;
  theme?: string;
  focusAreas: string[];     // max 3
  notList?: string;
  teamPriorities?: string;
  personalDevelopment?: string;
  blockers?: string;
  upwardCommitments?: string;
  successMeasures?: string;
  reflectionNotes?: string; // filled in when completing
  linkedOKRIds: string[];
  linkedProjectIds: string[];
  createdAt: string;
  completedAt?: string;
}

export interface RoleClarityDoc {
  roleTitle?: string;
  teamSize?: string;
  reportsTo?: string;
  scope?: string;
  coreAccountabilities?: string;
  iOwn?: string;
  iDontOwn?: string;
  decisionRights?: string;
  keyInterfaces?: string;
  successLooksLike?: string;
  workingPrinciples?: string;
  updatedAt?: string;
}

export interface RoleCharter {
  id: string;
  title: string;
  summary?: string;
  coreAccountabilities?: string;
  decisionRights?: string;
  successCriteria?: string;
  keyInterfaces?: string;
  growthPath?: string;
  filledBy?: string;
  status: RoleCharterStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate?: string;
  status: MilestoneStatus;
  notes?: string;
  linkedTaskIds: string[];
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  owner?: string;
  startDate?: string;
  dueDate?: string;
  successCriteria?: string;
  risks?: string;
  notes?: string;
  milestones: ProjectMilestone[];
  linkedOKRIds: string[];
  linkedTaskIds: string[];
  createdAt: string;
  completedAt?: string;
}

export interface HardConversation {
  id: string;
  title: string;
  type: ConversationType;
  person?: string;
  targetDate?: string;
  status: ConversationStatus;
  // Prep
  context?: string;
  desiredOutcome?: string;
  openingLine?: string;
  keyPoints?: string;
  anticipatedReaction?: string;
  yourResponse?: string;
  // Post-conversation
  actualOutcome?: string;
  followUpActions?: string;
  createdAt: string;
  hadAt?: string;
}

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
  | 'direct-reports'
  | 'day-planner'
  | 'meetings'
  | 'projects'
  | 'hard-conversations'
  | 'quarterly-planning'
  | 'role-clarity'
  | 'role-charters';

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
  estimateMinutes?: number;
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

export interface AgendaItem {
  id: string;
  topic: string;
  owner?: string;
  durationMinutes?: number;
  notes?: string;
  done: boolean;
}

export interface MeetingActionItem {
  id: string;
  what: string;
  who?: string;
  dueDate?: string;
  done: boolean;
  linkedTaskId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;        // YYYY-MM-DD
  time?: string;       // HH:MM
  durationMinutes?: number;
  type: MeetingType;
  location?: string;
  attendees: string[]; // free-text names
  status: MeetingStatus;
  objective?: string;  // what does success look like?
  prepNotes?: string;  // context, things to bring up, data needed
  agendaItems: AgendaItem[];
  notes?: string;      // notes taken during the meeting
  actionItems: MeetingActionItem[];
  linkedTaskIds: string[];
  linkedDecisionIds: string[];
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
