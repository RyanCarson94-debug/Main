import { useState, useEffect } from 'react';
import type { Task, OKR, SwotItem, FirstTeamMember, KanbanColumnId, QuadrantId } from './types';

const STORAGE_KEYS = {
  tasks: 'adhd-leader-tasks',
  okrs: 'adhd-leader-okrs',
  swot: 'adhd-leader-swot',
  team: 'adhd-leader-team',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const SAMPLE_TASKS: Task[] = [
  {
    id: '1',
    title: 'Prepare Q2 strategy presentation',
    description: 'Slides for the leadership team sync',
    quadrant: 'do-now',
    column: 'in-progress',
    priority: 'critical',
    tags: ['strategy', 'leadership'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Review team OKRs',
    quadrant: 'schedule',
    column: 'backlog',
    priority: 'high',
    tags: ['okrs', 'team'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Schedule 1:1s for this week',
    quadrant: 'do-now',
    column: 'backlog',
    priority: 'high',
    tags: ['team'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Update project status in Jira',
    quadrant: 'delegate',
    column: 'backlog',
    priority: 'medium',
    tags: ['admin'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Read leadership book chapter 3',
    quadrant: 'schedule',
    column: 'backlog',
    priority: 'low',
    tags: ['growth'],
    createdAt: new Date().toISOString(),
  },
];

export function useAppStore() {
  const [tasks, setTasks] = useState<Task[]>(() =>
    loadFromStorage(STORAGE_KEYS.tasks, SAMPLE_TASKS)
  );
  const [okrs, setOkrs] = useState<OKR[]>(() =>
    loadFromStorage(STORAGE_KEYS.okrs, [])
  );
  const [swotItems, setSwotItems] = useState<SwotItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.swot, [])
  );
  const [teamMembers, setTeamMembers] = useState<FirstTeamMember[]>(() =>
    loadFromStorage(STORAGE_KEYS.team, [])
  );

  useEffect(() => { saveToStorage(STORAGE_KEYS.tasks, tasks); }, [tasks]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.okrs, okrs); }, [okrs]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.swot, swotItems); }, [swotItems]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.team, teamMembers); }, [teamMembers]);

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const moveTaskColumn = (id: string, column: KanbanColumnId) => {
    setTasks(prev => prev.map(t =>
      t.id === id
        ? { ...t, column, completedAt: column === 'done' ? new Date().toISOString() : undefined }
        : t
    ));
  };

  const moveTaskQuadrant = (id: string, quadrant: QuadrantId) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, quadrant } : t));
  };

  const markDelegated = (
    id: string,
    delegatedTo: string,
    followUpDate?: string,
    emailDraft?: string,
  ) => {
    setTasks(prev => prev.map(t =>
      t.id === id
        ? {
            ...t,
            delegatedTo,
            delegatedAt: new Date().toISOString(),
            followUpDate,
            followUpDone: false,
            quadrant: 'delegate' as QuadrantId,
            ...(emailDraft ? { delegationEmailDraft: emailDraft } : {}),
          }
        : t
    ));
  };

  const markFollowUpDone = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, followUpDone: true } : t));
  };

  const saveDelegationEmail = (id: string, email: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, delegationEmailDraft: email } : t));
  };

  const addOKR = (okr: Omit<OKR, 'id'>) => {
    setOkrs(prev => [...prev, { ...okr, id: crypto.randomUUID() }]);
  };

  const updateOKR = (id: string, updates: Partial<OKR>) => {
    setOkrs(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOKR = (id: string) => {
    setOkrs(prev => prev.filter(o => o.id !== id));
  };

  const addSwotItem = (item: Omit<SwotItem, 'id'>) => {
    setSwotItems(prev => [...prev, { ...item, id: crypto.randomUUID() }]);
  };

  const deleteSwotItem = (id: string) => {
    setSwotItems(prev => prev.filter(s => s.id !== id));
  };

  const addTeamMember = (member: Omit<FirstTeamMember, 'id'>) => {
    setTeamMembers(prev => [...prev, { ...member, id: crypto.randomUUID() }]);
  };

  const updateTeamMember = (id: string, updates: Partial<FirstTeamMember>) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  return {
    tasks,
    okrs,
    swotItems,
    teamMembers,
    addTask,
    updateTask,
    deleteTask,
    moveTaskColumn,
    moveTaskQuadrant,
    markDelegated,
    markFollowUpDone,
    saveDelegationEmail,
    addOKR,
    updateOKR,
    deleteOKR,
    addSwotItem,
    deleteSwotItem,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
  };
}
