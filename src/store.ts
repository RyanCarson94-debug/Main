import { useState, useEffect, useRef, useCallback } from 'react';
import { saveToCloud, loadFromCloud, subscribeToCloudChanges } from './services/supabase';

export type SaveSyncStatus = 'idle' | 'saving' | 'saved' | 'error';
import type {
  Task, OKR, SwotItem, FirstTeamMember, KanbanColumnId, QuadrantId,
  Update, UpdatePerson, TaskFocus, FocusStep, DumpItem, DumpItemStatus,
  Decision, Commitment, WeeklyReview, NorthStar, RecurrenceRule,
  Stakeholder, DirectReportProfile, Meeting, AgendaItem, MeetingActionItem,
  Project, ProjectMilestone, HardConversation,
  QuarterlyPlan, RoleClarityDoc, RoleCharter,
  PersonalReadme, OneOnOneNote,
} from './types';

const STORAGE_KEYS = {
  tasks:         'adhd-leader-tasks',
  okrs:          'adhd-leader-okrs',
  swot:          'adhd-leader-swot',
  team:          'adhd-leader-team',
  updatePeople:  'adhd-leader-update-people',
  updates:       'adhd-leader-updates',
  focusMap:      'adhd-leader-focus-map',
  dump:          'adhd-leader-dump',
  decisions:     'adhd-leader-decisions',
  commitments:   'adhd-leader-commitments',
  weeklyReviews: 'adhd-leader-weekly-reviews',
  northStar:          'adhd-leader-north-star',
  stakeholders:       'adhd-leader-stakeholders',
  directReportProfiles: 'adhd-leader-direct-report-profiles',
  meetings:           'adhd-leader-meetings',
  projects:           'adhd-leader-projects',
  hardConversations:  'adhd-leader-hard-conversations',
  quarterlyPlans:     'adhd-leader-quarterly-plans',
  roleClarityDoc:     'adhd-leader-role-clarity',
  roleCharters:       'adhd-leader-role-charters',
  personalReadme:     'adhd-leader-personal-readme',
  oneOnOneNotes:      'adhd-leader-one-on-one-notes',
};

// Dual-write: primary key + backup key for resilience
function saveToStorage<T>(key: string, value: T): void {
  const json = JSON.stringify(value);
  localStorage.setItem(key, json);
  localStorage.setItem(`${key}-bak`, json);
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* fall through to backup */ }
  try {
    const bak = localStorage.getItem(`${key}-bak`);
    if (bak) return JSON.parse(bak) as T;
  } catch { /* fall through to fallback */ }
  return fallback;
}

// ─── Recurrence helpers ───────────────────────────────────────────────────────

function getNextDueDate(currentDue: string, rule: RecurrenceRule): string | null {
  const date = new Date(currentDue);
  switch (rule.type) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekdays':
      date.setDate(date.getDate() + 1);
      while (date.getDay() === 0 || date.getDay() === 6)
        date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
  }
  if (rule.endDate && date > new Date(rule.endDate)) return null;
  return date.toISOString().split('T')[0];
}

// ─── Weekly review helper ─────────────────────────────────────────────────────

export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

// ─── Sample data ──────────────────────────────────────────────────────────────

const SAMPLE_TASKS: Task[] = [
  {
    id: '1',
    title: 'Prepare Q2 strategy presentation',
    description: 'Slides for the leadership team sync',
    quadrant: 'do-now',
    column: 'in-progress',
    priority: 'critical',
    energy: 'deep-work',
    tags: ['strategy', 'leadership'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Review team OKRs',
    quadrant: 'schedule',
    column: 'backlog',
    priority: 'high',
    energy: 'deep-work',
    tags: ['okrs', 'team'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Schedule 1:1s for this week',
    quadrant: 'do-now',
    column: 'backlog',
    priority: 'high',
    energy: 'admin',
    tags: ['team'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Update project status in Jira',
    quadrant: 'delegate',
    column: 'backlog',
    priority: 'medium',
    energy: 'admin',
    tags: ['admin'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Read leadership book chapter 3',
    quadrant: 'schedule',
    column: 'backlog',
    priority: 'low',
    energy: 'quick-win',
    tags: ['growth'],
    createdAt: new Date().toISOString(),
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

export function useAppStore() {
  const [tasks,         setTasks]         = useState<Task[]>(() => loadFromStorage(STORAGE_KEYS.tasks, SAMPLE_TASKS));
  const [okrs,          setOkrs]          = useState<OKR[]>(() => loadFromStorage(STORAGE_KEYS.okrs, []));
  const [swotItems,     setSwotItems]     = useState<SwotItem[]>(() => loadFromStorage(STORAGE_KEYS.swot, []));
  const [teamMembers,   setTeamMembers]   = useState<FirstTeamMember[]>(() => loadFromStorage(STORAGE_KEYS.team, []));
  const [updatePeople,  setUpdatePeople]  = useState<UpdatePerson[]>(() => loadFromStorage(STORAGE_KEYS.updatePeople, []));
  const [updates,       setUpdates]       = useState<Update[]>(() => loadFromStorage(STORAGE_KEYS.updates, []));
  const [focusMap,      setFocusMap]      = useState<Record<string, TaskFocus>>(() => loadFromStorage(STORAGE_KEYS.focusMap, {}));
  const [dumpItems,     setDumpItems]     = useState<DumpItem[]>(() => loadFromStorage(STORAGE_KEYS.dump, []));
  const [decisions,     setDecisions]     = useState<Decision[]>(() => loadFromStorage(STORAGE_KEYS.decisions, []));
  const [commitments,   setCommitments]   = useState<Commitment[]>(() => loadFromStorage(STORAGE_KEYS.commitments, []));
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>(() => loadFromStorage(STORAGE_KEYS.weeklyReviews, []));
  const [northStar,     setNorthStar]     = useState<NorthStar | null>(() => loadFromStorage<NorthStar | null>(STORAGE_KEYS.northStar, null));
  const [stakeholders,          setStakeholders]          = useState<Stakeholder[]>(() => loadFromStorage(STORAGE_KEYS.stakeholders, []));
  const [directReportProfiles,  setDirectReportProfiles]  = useState<DirectReportProfile[]>(() => loadFromStorage(STORAGE_KEYS.directReportProfiles, []));
  const [meetings,              setMeetings]              = useState<Meeting[]>(() => loadFromStorage(STORAGE_KEYS.meetings, []));
  const [projects,              setProjects]              = useState<Project[]>(() => loadFromStorage(STORAGE_KEYS.projects, []));
  const [hardConversations,     setHardConversations]     = useState<HardConversation[]>(() => loadFromStorage(STORAGE_KEYS.hardConversations, []));
  const [quarterlyPlans,        setQuarterlyPlans]        = useState<QuarterlyPlan[]>(() => loadFromStorage(STORAGE_KEYS.quarterlyPlans, []));
  const [roleClarityDoc,        setRoleClarityDoc]        = useState<RoleClarityDoc>(() => loadFromStorage(STORAGE_KEYS.roleClarityDoc, {}));
  const [roleCharters,          setRoleCharters]          = useState<RoleCharter[]>(() => loadFromStorage(STORAGE_KEYS.roleCharters, []));
  const [personalReadme,        setPersonalReadme]        = useState<PersonalReadme>(() => loadFromStorage(STORAGE_KEYS.personalReadme, {}));
  const [oneOnOneNotes,         setOneOnOneNotes]         = useState<OneOnOneNote[]>(() => loadFromStorage(STORAGE_KEYS.oneOnOneNotes, []));

  // Immediate localStorage saves — keeps local cache always current, independent of Supabase
  useEffect(() => { saveToStorage(STORAGE_KEYS.tasks,         tasks);         }, [tasks]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.okrs,          okrs);          }, [okrs]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.swot,          swotItems);     }, [swotItems]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.team,          teamMembers);   }, [teamMembers]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.updatePeople,  updatePeople);  }, [updatePeople]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.updates,       updates);       }, [updates]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.focusMap,      focusMap);      }, [focusMap]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.dump,          dumpItems);     }, [dumpItems]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.decisions,     decisions);     }, [decisions]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.commitments,   commitments);   }, [commitments]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.weeklyReviews, weeklyReviews); }, [weeklyReviews]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.northStar,             northStar);             }, [northStar]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.stakeholders,          stakeholders);          }, [stakeholders]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.directReportProfiles,  directReportProfiles);  }, [directReportProfiles]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.meetings,              meetings);              }, [meetings]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.projects,              projects);              }, [projects]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.hardConversations,     hardConversations);     }, [hardConversations]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.quarterlyPlans,        quarterlyPlans);        }, [quarterlyPlans]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.roleClarityDoc,        roleClarityDoc);        }, [roleClarityDoc]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.roleCharters,          roleCharters);          }, [roleCharters]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.personalReadme,        personalReadme);        }, [personalReadme]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.oneOnOneNotes,         oneOnOneNotes);         }, [oneOnOneNotes]);

  // ── Cloud sync (Supabase — primary source of truth) ───────────────────────
  // Strategy:
  //   • On mount: fetch from Supabase and apply it (cloud IS the truth).
  //     localStorage is only used as an instant-boot cache while we wait.
  //   • On change: debounced 800ms save to Supabase, then update localStorage cache.
  //   • Realtime: subscribe so other tabs/devices push changes here live.

  const [saveSyncStatus, setSaveSyncStatus] = useState<SaveSyncStatus>('idle');
  const cloudSaveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted       = useRef(true);
  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);

  // Helper: apply a cloud payload to all state setters
  const applyCloudPayload = useCallback((p: Record<string, unknown>) => {
    if (Array.isArray(p.tasks))               setTasks(p.tasks as Task[]);
    if (Array.isArray(p.okrs))                setOkrs(p.okrs as OKR[]);
    if (Array.isArray(p.swotItems))           setSwotItems(p.swotItems as SwotItem[]);
    if (Array.isArray(p.teamMembers))         setTeamMembers(p.teamMembers as FirstTeamMember[]);
    if (Array.isArray(p.updatePeople))        setUpdatePeople(p.updatePeople as UpdatePerson[]);
    if (Array.isArray(p.updates))             setUpdates(p.updates as Update[]);
    if (p.focusMap && typeof p.focusMap === 'object') setFocusMap(p.focusMap as Record<string, TaskFocus>);
    if (Array.isArray(p.dumpItems))           setDumpItems(p.dumpItems as DumpItem[]);
    if (Array.isArray(p.decisions))           setDecisions(p.decisions as Decision[]);
    if (Array.isArray(p.commitments))         setCommitments(p.commitments as Commitment[]);
    if (Array.isArray(p.weeklyReviews))       setWeeklyReviews(p.weeklyReviews as WeeklyReview[]);
    if (p.northStar)                          setNorthStar(p.northStar as NorthStar);
    if (Array.isArray(p.stakeholders))        setStakeholders(p.stakeholders as Stakeholder[]);
    if (Array.isArray(p.directReportProfiles)) setDirectReportProfiles(p.directReportProfiles as DirectReportProfile[]);
    if (Array.isArray(p.meetings))            setMeetings(p.meetings as Meeting[]);
    if (Array.isArray(p.projects))            setProjects(p.projects as Project[]);
    if (Array.isArray(p.hardConversations))   setHardConversations(p.hardConversations as HardConversation[]);
    if (Array.isArray(p.quarterlyPlans))      setQuarterlyPlans(p.quarterlyPlans as QuarterlyPlan[]);
    if (p.roleClarityDoc && typeof p.roleClarityDoc === 'object') setRoleClarityDoc(p.roleClarityDoc as RoleClarityDoc);
    if (Array.isArray(p.roleCharters))        setRoleCharters(p.roleCharters as RoleCharter[]);
    if (p.personalReadme && typeof p.personalReadme === 'object') setPersonalReadme(p.personalReadme as PersonalReadme);
    if (Array.isArray(p.oneOnOneNotes))       setOneOnOneNotes(p.oneOnOneNotes as OneOnOneNote[]);
  }, []);

  // On mount: load from Supabase if it has data we haven't seen yet.
  // We track the timestamp of the last snapshot we saved to Supabase in localStorage.
  // If cloud.saved_at > that timestamp, another device/session saved something newer — apply it.
  // If cloud.saved_at <= that timestamp, our local data already matches or is ahead — skip.
  // This prevents the cloud from overwriting local-only changes that haven't synced yet.
  const LAST_CLOUD_SAVE_KEY = 'adhd-leader-cloud-saved-at';
  useEffect(() => {
    void (async () => {
      const cloud = await loadFromCloud();
      if (!isMounted.current || !cloud) return;
      const cloudDate = new Date(cloud.saved_at);
      const lastSaveDate = new Date(loadFromStorage<string>(LAST_CLOUD_SAVE_KEY, '1970-01-01'));
      if (cloudDate <= lastSaveDate) return; // local is current — nothing new from cloud
      applyCloudPayload(cloud.payload as Record<string, unknown>);
      console.info('[sync] Applied newer cloud data:', cloud.saved_at);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: apply changes pushed from other tabs/devices
  useEffect(() => {
    const unsub = subscribeToCloudChanges((payload) => {
      if (!isMounted.current) return;
      applyCloudPayload(payload as Record<string, unknown>);
      console.info('[sync] Realtime update applied');
    });
    return unsub;
  }, [applyCloudPayload]);

  // Debounced cloud save (800ms) — also updates localStorage cache
  const triggerCloudSave = useCallback(() => {
    if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current);
    setSaveSyncStatus('saving');
    cloudSaveTimer.current = setTimeout(async () => {
      const snapshot = {
        tasks, okrs, swotItems, teamMembers, updatePeople, updates,
        focusMap, dumpItems, decisions, commitments, weeklyReviews,
        northStar, stakeholders, directReportProfiles, meetings,
        projects, hardConversations,
        quarterlyPlans, roleClarityDoc, roleCharters,
        personalReadme, oneOnOneNotes,
        cloudSavedAt: new Date().toISOString(),
      };
      try {
        await saveToCloud(snapshot);
        if (isMounted.current) {
          // Record the timestamp so we know what the cloud has — prevents overwriting on next startup
          saveToStorage(LAST_CLOUD_SAVE_KEY, snapshot.cloudSavedAt);
          setSaveSyncStatus('saved');
          setTimeout(() => { if (isMounted.current) setSaveSyncStatus('idle'); }, 2500);
        }
      } catch {
        if (isMounted.current) setSaveSyncStatus('error');
      }
      // localStorage is updated immediately by the per-field useEffects above — no need to batch here
    }, 800);
  }, [tasks, okrs, swotItems, teamMembers, updatePeople, updates,
      focusMap, dumpItems, decisions, commitments, weeklyReviews,
      northStar, stakeholders, directReportProfiles, meetings,
      projects, hardConversations, quarterlyPlans, roleClarityDoc, roleCharters,
      personalReadme, oneOnOneNotes]);

  useEffect(() => { triggerCloudSave(); }, [triggerCloudSave]);

  // ── Tasks ──────────────────────────────────────────────────────────────────

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = { ...task, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    // Cascade: remove from meeting links and action item links
    setMeetings(prev => prev.map(m => ({
      ...m,
      linkedTaskIds: m.linkedTaskIds.filter(tid => tid !== id),
      actionItems: m.actionItems.map(a =>
        a.linkedTaskId === id ? { ...a, linkedTaskId: undefined } : a
      ),
    })));
    // Cascade: remove from project links and milestone links
    setProjects(prev => prev.map(p => ({
      ...p,
      linkedTaskIds: p.linkedTaskIds.filter(tid => tid !== id),
      milestones: p.milestones.map(m => ({
        ...m,
        linkedTaskIds: m.linkedTaskIds.filter(tid => tid !== id),
      })),
    })));
  };

  const moveTaskColumn = (id: string, column: KanbanColumnId) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      const updated = prev.map(t =>
        t.id === id
          ? { ...t, column, completedAt: column === 'done' ? new Date().toISOString() : undefined }
          : t
      );
      // Auto-spawn next recurring instance when marked done
      if (column === 'done' && task?.recurrence && task.dueDate) {
        const nextDue = getNextDueDate(task.dueDate, task.recurrence);
        if (nextDue) {
          const next: Task = {
            ...task,
            id: crypto.randomUUID(),
            column: 'backlog',
            createdAt: new Date().toISOString(),
            completedAt: undefined,
            dueDate: nextDue,
          };
          return [...updated, next];
        }
      }
      return updated;
    });
  };

  const moveTaskQuadrant = (id: string, quadrant: QuadrantId) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, quadrant } : t));
  };

  const markDelegated = (id: string, delegatedTo: string, followUpDate?: string, emailDraft?: string) => {
    setTasks(prev => prev.map(t =>
      t.id === id
        ? { ...t, delegatedTo, delegatedAt: new Date().toISOString(), followUpDate, followUpDone: false, quadrant: 'delegate' as QuadrantId, ...(emailDraft ? { delegationEmailDraft: emailDraft } : {}) }
        : t
    ));
  };

  const markFollowUpDone = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, followUpDone: true } : t));
  };

  const saveDelegationEmail = (id: string, email: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, delegationEmailDraft: email } : t));
  };

  // ── OKRs ───────────────────────────────────────────────────────────────────

  const addOKR = (okr: Omit<OKR, 'id'>) => {
    setOkrs(prev => [...prev, { ...okr, id: crypto.randomUUID() }]);
  };
  const updateOKR = (id: string, updates: Partial<OKR>) => {
    setOkrs(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };
  const deleteOKR = (id: string) => {
    setOkrs(prev => prev.filter(o => o.id !== id));
  };

  // ── SWOT ───────────────────────────────────────────────────────────────────

  const addSwotItem = (item: Omit<SwotItem, 'id'>) => {
    setSwotItems(prev => [...prev, { ...item, id: crypto.randomUUID() }]);
  };
  const deleteSwotItem = (id: string) => {
    setSwotItems(prev => prev.filter(s => s.id !== id));
  };

  // ── Team ───────────────────────────────────────────────────────────────────

  const addTeamMember = (member: Omit<FirstTeamMember, 'id'>) => {
    setTeamMembers(prev => [...prev, { ...member, id: crypto.randomUUID() }]);
  };
  const updateTeamMember = (id: string, updates: Partial<FirstTeamMember>) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };
  const deleteTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };
  const linkTaskToMember = (memberId: string, taskId: string) => {
    setTeamMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, linkedTaskIds: [...new Set([...(m.linkedTaskIds ?? []), taskId])] } : m
    ));
  };
  const unlinkTaskFromMember = (memberId: string, taskId: string) => {
    setTeamMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, linkedTaskIds: (m.linkedTaskIds ?? []).filter(id => id !== taskId) } : m
    ));
  };

  // ── Brain Dump ─────────────────────────────────────────────────────────────

  const addDumpItem = (content: string, isPersonal?: boolean) => {
    const item: DumpItem = { id: crypto.randomUUID(), content: content.trim(), createdAt: new Date().toISOString(), status: 'inbox', ...(isPersonal && { isPersonal }) };
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
    const newTask: Task = { ...taskData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setTasks(prev => [newTask, ...prev]);
    setDumpItems(prev => prev.map(d => d.id === dumpId ? { ...d, status: 'task' as DumpItemStatus, convertedTaskId: newTask.id } : d));
    return newTask.id;
  };
  const clearDumpInbox = () => {
    setDumpItems(prev => prev.filter(d => d.status !== 'inbox'));
  };

  // ── Focus ──────────────────────────────────────────────────────────────────

  const setFocusSteps = (taskId: string, steps: FocusStep[]) => {
    setFocusMap(prev => ({ ...prev, [taskId]: { taskId, steps, updatedAt: new Date().toISOString() } }));
  };
  const toggleFocusStep = (taskId: string, stepId: string) => {
    setFocusMap(prev => {
      const focus = prev[taskId];
      if (!focus) return prev;
      return { ...prev, [taskId]: { ...focus, steps: focus.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s), updatedAt: new Date().toISOString() } };
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
      return { ...prev, [taskId]: { ...focus, steps: focus.steps.filter(s => s.id !== stepId), updatedAt: new Date().toISOString() } };
    });
  };
  const clearFocusSteps = (taskId: string) => {
    setFocusMap(prev => { const next = { ...prev }; delete next[taskId]; return next; });
  };

  // ── Updates / 1:1s ─────────────────────────────────────────────────────────

  const addUpdatePerson = (person: Omit<UpdatePerson, 'id'>) => {
    setUpdatePeople(prev => [...prev, { ...person, id: crypto.randomUUID() }]);
  };
  const deleteUpdatePerson = (id: string) => {
    setUpdatePeople(prev => prev.filter(p => p.id !== id));
    setUpdates(prev => prev.map(u => ({ ...u, recipientIds: u.recipientIds.filter(r => r !== id), discussedWith: u.discussedWith.filter(d => d !== id) })));
  };
  const addUpdate = (update: Omit<Update, 'id' | 'createdAt' | 'discussedWith'>) => {
    setUpdates(prev => [{ ...update, id: crypto.randomUUID(), createdAt: new Date().toISOString(), discussedWith: [] }, ...prev]);
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

  // ── Decisions ──────────────────────────────────────────────────────────────

  const addDecision = (d: Omit<Decision, 'id'>) => {
    setDecisions(prev => [{ ...d, id: crypto.randomUUID() }, ...prev]);
  };
  const updateDecision = (id: string, updates: Partial<Decision>) => {
    setDecisions(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };
  const deleteDecision = (id: string) => {
    setDecisions(prev => prev.filter(d => d.id !== id));
    // Cascade: remove this decision from any meeting links
    setMeetings(prev => prev.map(m => ({
      ...m,
      linkedDecisionIds: m.linkedDecisionIds.filter(did => did !== id),
    })));
  };

  // ── Commitments ────────────────────────────────────────────────────────────

  const addCommitment = (c: Omit<Commitment, 'id' | 'createdAt' | 'done'>) => {
    setCommitments(prev => [{ ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString(), done: false }, ...prev]);
  };
  const toggleCommitment = (id: string) => {
    setCommitments(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };
  const deleteCommitment = (id: string) => {
    setCommitments(prev => prev.filter(c => c.id !== id));
  };

  // ── Weekly Review ──────────────────────────────────────────────────────────

  const saveWeeklyReview = (review: Omit<WeeklyReview, 'id'>) => {
    setWeeklyReviews(prev => {
      const existing = prev.findIndex(r => r.weekOf === review.weekOf);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], ...review };
        return updated;
      }
      return [{ ...review, id: crypto.randomUUID() }, ...prev];
    });
  };

  // ── North Star ─────────────────────────────────────────────────────────────

  const saveNorthStar = (ns: NorthStar) => {
    setNorthStar(ns);
  };

  // ── Stakeholders ───────────────────────────────────────────────────────────

  const addStakeholder = (s: Omit<Stakeholder, 'id' | 'createdAt'>) => {
    setStakeholders(prev => [{ ...s, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...prev]);
  };
  const updateStakeholder = (id: string, updates: Partial<Stakeholder>) => {
    setStakeholders(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };
  const deleteStakeholder = (id: string) => {
    setStakeholders(prev => prev.filter(s => s.id !== id));
  };

  // ── Direct Report Profiles ─────────────────────────────────────────────────

  const saveDirectReportProfile = (profile: DirectReportProfile) => {
    setDirectReportProfiles(prev => {
      const idx = prev.findIndex(p => p.personId === profile.personId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = profile;
        return updated;
      }
      return [...prev, profile];
    });
  };

  // ── Meetings ───────────────────────────────────────────────────────────────

  const addMeeting = (m: Omit<Meeting, 'id' | 'createdAt'>) => {
    const meeting: Meeting = { ...m, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setMeetings(prev => [meeting, ...prev]);
    return meeting;
  };

  const updateMeeting = (id: string, updates: Partial<Meeting>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMeeting = (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  const addAgendaItem = (meetingId: string, item: Omit<AgendaItem, 'id'>) => {
    setMeetings(prev => prev.map(m =>
      m.id === meetingId
        ? { ...m, agendaItems: [...m.agendaItems, { ...item, id: crypto.randomUUID() }] }
        : m
    ));
  };

  const updateAgendaItem = (meetingId: string, itemId: string, updates: Partial<AgendaItem>) => {
    setMeetings(prev => prev.map(m =>
      m.id === meetingId
        ? { ...m, agendaItems: m.agendaItems.map(a => a.id === itemId ? { ...a, ...updates } : a) }
        : m
    ));
  };

  const deleteAgendaItem = (meetingId: string, itemId: string) => {
    setMeetings(prev => prev.map(m =>
      m.id === meetingId ? { ...m, agendaItems: m.agendaItems.filter(a => a.id !== itemId) } : m
    ));
  };

  const addMeetingActionItem = (meetingId: string, item: Omit<MeetingActionItem, 'id'>) => {
    setMeetings(prev => prev.map(m =>
      m.id === meetingId
        ? { ...m, actionItems: [...m.actionItems, { ...item, id: crypto.randomUUID() }] }
        : m
    ));
  };

  const updateMeetingActionItem = (meetingId: string, itemId: string, updates: Partial<MeetingActionItem>) => {
    setMeetings(prev => prev.map(m =>
      m.id === meetingId
        ? { ...m, actionItems: m.actionItems.map(a => a.id === itemId ? { ...a, ...updates } : a) }
        : m
    ));
  };

  const deleteMeetingActionItem = (meetingId: string, itemId: string) => {
    setMeetings(prev => prev.map(m =>
      m.id === meetingId ? { ...m, actionItems: m.actionItems.filter(a => a.id !== itemId) } : m
    ));
  };

  /** Convert a MeetingActionItem to a Task, linking them together. */
  const convertActionItemToTask = (meetingId: string, actionItemId: string, taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask = addTask(taskData);
    // Link the task back into the meeting
    setMeetings(prev => prev.map(m => {
      if (m.id !== meetingId) return m;
      return {
        ...m,
        actionItems: m.actionItems.map(a =>
          a.id === actionItemId ? { ...a, linkedTaskId: newTask.id } : a
        ),
        linkedTaskIds: m.linkedTaskIds.includes(newTask.id)
          ? m.linkedTaskIds
          : [...m.linkedTaskIds, newTask.id],
      };
    }));
    return newTask;
  };

  const linkTaskToMeeting = (meetingId: string, taskId: string) => {
    setMeetings(prev => prev.map(m =>
      m.id === meetingId && !m.linkedTaskIds.includes(taskId)
        ? { ...m, linkedTaskIds: [...m.linkedTaskIds, taskId] }
        : m
    ));
  };

  const unlinkTaskFromMeeting = (meetingId: string, taskId: string) => {
    setMeetings(prev => prev.map(m =>
      m.id === meetingId
        ? { ...m, linkedTaskIds: m.linkedTaskIds.filter(id => id !== taskId) }
        : m
    ));
  };

  const linkDecisionToMeeting = (meetingId: string, decisionId: string) => {
    setMeetings(prev => prev.map(m =>
      m.id === meetingId && !m.linkedDecisionIds.includes(decisionId)
        ? { ...m, linkedDecisionIds: [...m.linkedDecisionIds, decisionId] }
        : m
    ));
  };

  const unlinkDecisionFromMeeting = (meetingId: string, decisionId: string) => {
    setMeetings(prev => prev.map(m =>
      m.id === meetingId
        ? { ...m, linkedDecisionIds: m.linkedDecisionIds.filter(id => id !== decisionId) }
        : m
    ));
  };

  // ── Projects ───────────────────────────────────────────────────────────────

  const addProject = (p: Omit<Project, 'id' | 'createdAt'>) => {
    const project: Project = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setProjects(prev => [project, ...prev]);
    return project;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const addMilestone = (projectId: string, m: Omit<ProjectMilestone, 'id'>) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, milestones: [...p.milestones, { ...m, id: crypto.randomUUID() }] }
        : p
    ));
  };

  const updateMilestone = (projectId: string, milestoneId: string, updates: Partial<ProjectMilestone>) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, milestones: p.milestones.map(m => m.id === milestoneId ? { ...m, ...updates } : m) }
        : p
    ));
  };

  const deleteMilestone = (projectId: string, milestoneId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, milestones: p.milestones.filter(m => m.id !== milestoneId) } : p
    ));
  };

  const linkTaskToProject = (projectId: string, taskId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId && !p.linkedTaskIds.includes(taskId)
        ? { ...p, linkedTaskIds: [...p.linkedTaskIds, taskId] }
        : p
    ));
  };

  const unlinkTaskFromProject = (projectId: string, taskId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, linkedTaskIds: p.linkedTaskIds.filter(id => id !== taskId) }
        : p
    ));
  };

  const linkOKRToProject = (projectId: string, okrId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId && !p.linkedOKRIds.includes(okrId)
        ? { ...p, linkedOKRIds: [...p.linkedOKRIds, okrId] }
        : p
    ));
  };

  const unlinkOKRFromProject = (projectId: string, okrId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, linkedOKRIds: p.linkedOKRIds.filter(id => id !== okrId) }
        : p
    ));
  };

  // Cascade cleanup: when a task is deleted, remove from project links too
  // (already handled in deleteTask above via setMeetings — mirror for projects)

  // ── Personal README ────────────────────────────────────────────────────────

  const savePersonalReadme = (updates: Partial<PersonalReadme>) => {
    setPersonalReadme(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
  };

  // ── 1:1 Notes ──────────────────────────────────────────────────────────────

  const addOneOnOneNote = (n: Omit<OneOnOneNote, 'id' | 'createdAt'>) => {
    const note: OneOnOneNote = { ...n, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setOneOnOneNotes(prev => [note, ...prev]);
    return note;
  };

  const updateOneOnOneNote = (id: string, updates: Partial<OneOnOneNote>) => {
    setOneOnOneNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteOneOnOneNote = (id: string) => {
    setOneOnOneNotes(prev => prev.filter(n => n.id !== id));
  };

  // ── Quarterly Plans ────────────────────────────────────────────────────────

  const addQuarterlyPlan = (p: Omit<QuarterlyPlan, 'id' | 'createdAt'>) => {
    const plan: QuarterlyPlan = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setQuarterlyPlans(prev => [plan, ...prev]);
    return plan;
  };

  const updateQuarterlyPlan = (id: string, updates: Partial<QuarterlyPlan>) => {
    setQuarterlyPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteQuarterlyPlan = (id: string) => {
    setQuarterlyPlans(prev => prev.filter(p => p.id !== id));
  };

  // ── Role Clarity Doc ───────────────────────────────────────────────────────

  const saveRoleClarityDoc = (updates: Partial<RoleClarityDoc>) => {
    setRoleClarityDoc(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
  };

  // ── Role Charters ──────────────────────────────────────────────────────────

  const addRoleCharter = (c: Omit<RoleCharter, 'id' | 'createdAt'>) => {
    const charter: RoleCharter = { ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setRoleCharters(prev => [charter, ...prev]);
    return charter;
  };

  const updateRoleCharter = (id: string, updates: Partial<RoleCharter>) => {
    setRoleCharters(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
  };

  const deleteRoleCharter = (id: string) => {
    setRoleCharters(prev => prev.filter(c => c.id !== id));
  };

  // ── Hard Conversations ─────────────────────────────────────────────────────

  const addHardConversation = (c: Omit<HardConversation, 'id' | 'createdAt'>) => {
    const conv: HardConversation = { ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setHardConversations(prev => [conv, ...prev]);
    return conv;
  };

  const updateHardConversation = (id: string, updates: Partial<HardConversation>) => {
    setHardConversations(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteHardConversation = (id: string) => {
    setHardConversations(prev => prev.filter(c => c.id !== id));
  };

  return {
    saveSyncStatus,
    tasks, okrs, swotItems, teamMembers, updatePeople, updates, focusMap, dumpItems,
    decisions, commitments, weeklyReviews, northStar,
    addTask, updateTask, deleteTask, moveTaskColumn, moveTaskQuadrant,
    markDelegated, markFollowUpDone, saveDelegationEmail,
    addOKR, updateOKR, deleteOKR,
    addSwotItem, deleteSwotItem,
    addTeamMember, updateTeamMember, deleteTeamMember, linkTaskToMember, unlinkTaskFromMember,
    addDumpItem, updateDumpItem, deleteDumpItem, setDumpStatus, convertDumpToTask, clearDumpInbox,
    setFocusSteps, toggleFocusStep, addFocusStep, deleteFocusStep, clearFocusSteps,
    addUpdatePerson, deleteUpdatePerson, addUpdate, deleteUpdate, markDiscussed, markAllDiscussed,
    addDecision, updateDecision, deleteDecision,
    addCommitment, toggleCommitment, deleteCommitment,
    saveWeeklyReview,
    saveNorthStar,
    stakeholders, addStakeholder, updateStakeholder, deleteStakeholder,
    directReportProfiles, saveDirectReportProfile,
    meetings, addMeeting, updateMeeting, deleteMeeting,
    addAgendaItem, updateAgendaItem, deleteAgendaItem,
    addMeetingActionItem, updateMeetingActionItem, deleteMeetingActionItem,
    convertActionItemToTask, linkTaskToMeeting, unlinkTaskFromMeeting,
    linkDecisionToMeeting, unlinkDecisionFromMeeting,
    projects, addProject, updateProject, deleteProject,
    addMilestone, updateMilestone, deleteMilestone,
    linkTaskToProject, unlinkTaskFromProject, linkOKRToProject, unlinkOKRFromProject,
    hardConversations, addHardConversation, updateHardConversation, deleteHardConversation,
    quarterlyPlans, addQuarterlyPlan, updateQuarterlyPlan, deleteQuarterlyPlan,
    roleClarityDoc, saveRoleClarityDoc,
    roleCharters, addRoleCharter, updateRoleCharter, deleteRoleCharter,
    personalReadme, savePersonalReadme,
    oneOnOneNotes, addOneOnOneNote, updateOneOnOneNote, deleteOneOnOneNote,
  };
}
