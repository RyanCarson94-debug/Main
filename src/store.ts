import { useState, useEffect } from 'react';
import type { Task, OKR, SwotItem, FirstTeamMember, KanbanColumnId, QuadrantId, Update, UpdatePerson, TaskFocus, FocusStep, DumpItem, DumpItemStatus } from './types';

const STORAGE_KEYS = {
  tasks: 'adhd-leader-tasks',
  okrs: 'adhd-leader-okrs',
  swot: 'adhd-leader-swot',
  team: 'adhd-leader-team',
  updatePeople: 'adhd-leader-update-people',
  updates: 'adhd-leader-updates',
  focusMap: 'adhd-leader-focus-map',
  dump: 'adhd-leader-dump',
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
  const [updatePeople, setUpdatePeople] = useState<UpdatePerson[]>(() =>
    loadFromStorage(STORAGE_KEYS.updatePeople, [])
  );
  const [updates, setUpdates] = useState<Update[]>(() =>
    loadFromStorage(STORAGE_KEYS.updates, [])
  );
  const [focusMap, setFocusMap] = useState<Record<string, TaskFocus>>(() =>
    loadFromStorage(STORAGE_KEYS.focusMap, {})
  );
  const [dumpItems, setDumpItems] = useState<DumpItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.dump, [])
  );

  useEffect(() => { saveToStorage(STORAGE_KEYS.tasks, tasks); }, [tasks]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.okrs, okrs); }, [okrs]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.swot, swotItems); }, [swotItems]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.team, teamMembers); }, [teamMembers]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.updatePeople, updatePeople); }, [updatePeople]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.updates, updates); }, [updates]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.focusMap, focusMap); }, [focusMap]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.dump, dumpItems); }, [dumpItems]);

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

  const addDumpItem = (content: string) => {
    const item: DumpItem = {
      id: crypto.randomUUID(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      status: 'inbox',
    };
    setDumpItems(prev => [item, ...prev]);
    return item.id;
  };

  const updateDumpItem = (id: string, updates: Partial<DumpItem>) => {
    setDumpItems(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDumpItem = (id: string) => {
    setDumpItems(prev => prev.filter(d => d.id !== id));
  };

  const setDumpStatus = (id: string, status: DumpItemStatus) => {
    setDumpItems(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  };

  const convertDumpToTask = (dumpId: string, taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    setDumpItems(prev => prev.map(d =>
      d.id === dumpId ? { ...d, status: 'task' as DumpItemStatus, convertedTaskId: newTask.id } : d
    ));
    return newTask.id;
  };

  const clearDumpInbox = () => {
    setDumpItems(prev => prev.filter(d => d.status !== 'inbox'));
  };

  const setFocusSteps = (taskId: string, steps: FocusStep[]) => {
    setFocusMap(prev => ({
      ...prev,
      [taskId]: { taskId, steps, updatedAt: new Date().toISOString() },
    }));
  };

  const toggleFocusStep = (taskId: string, stepId: string) => {
    setFocusMap(prev => {
      const focus = prev[taskId];
      if (!focus) return prev;
      return {
        ...prev,
        [taskId]: {
          ...focus,
          steps: focus.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s),
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const addFocusStep = (taskId: string, text: string, estimateMinutes?: number) => {
    const newStep: FocusStep = { id: crypto.randomUUID(), text, estimateMinutes, done: false };
    setFocusMap(prev => {
      const focus = prev[taskId];
      const steps = focus ? [...focus.steps, newStep] : [newStep];
      return { ...prev, [taskId]: { taskId, steps, updatedAt: new Date().toISOString() } };
    });
  };

  const deleteFocusStep = (taskId: string, stepId: string) => {
    setFocusMap(prev => {
      const focus = prev[taskId];
      if (!focus) return prev;
      return {
        ...prev,
        [taskId]: { ...focus, steps: focus.steps.filter(s => s.id !== stepId), updatedAt: new Date().toISOString() },
      };
    });
  };

  const clearFocusSteps = (taskId: string) => {
    setFocusMap(prev => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  const addUpdatePerson = (person: Omit<UpdatePerson, 'id'>) => {
    setUpdatePeople(prev => [...prev, { ...person, id: crypto.randomUUID() }]);
  };

  const deleteUpdatePerson = (id: string) => {
    setUpdatePeople(prev => prev.filter(p => p.id !== id));
    // Remove person from all updates
    setUpdates(prev => prev.map(u => ({
      ...u,
      recipientIds: u.recipientIds.filter(r => r !== id),
      discussedWith: u.discussedWith.filter(d => d !== id),
    })));
  };

  const addUpdate = (update: Omit<Update, 'id' | 'createdAt' | 'discussedWith'>) => {
    setUpdates(prev => [{
      ...update,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      discussedWith: [],
    }, ...prev]);
  };

  const deleteUpdate = (id: string) => {
    setUpdates(prev => prev.filter(u => u.id !== id));
  };

  const markDiscussed = (updateId: string, personId: string) => {
    setUpdates(prev => prev.map(u =>
      u.id === updateId && !u.discussedWith.includes(personId)
        ? { ...u, discussedWith: [...u.discussedWith, personId] }
        : u
    ));
  };

  const markAllDiscussed = (personId: string) => {
    setUpdates(prev => prev.map(u =>
      u.recipientIds.includes(personId) && !u.discussedWith.includes(personId)
        ? { ...u, discussedWith: [...u.discussedWith, personId] }
        : u
    ));
  };

  return {
    tasks,
    okrs,
    swotItems,
    teamMembers,
    updatePeople,
    updates,
    focusMap,
    dumpItems,
    addDumpItem,
    updateDumpItem,
    deleteDumpItem,
    setDumpStatus,
    convertDumpToTask,
    clearDumpInbox,
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
    setFocusSteps,
    toggleFocusStep,
    addFocusStep,
    deleteFocusStep,
    clearFocusSteps,
    addUpdatePerson,
    deleteUpdatePerson,
    addUpdate,
    deleteUpdate,
    markDiscussed,
    markAllDiscussed,
  };
}
