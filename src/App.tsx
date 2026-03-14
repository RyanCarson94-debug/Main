import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { Search, Bot, Zap, CheckCircle2, Home, Plus, UserCheck as UserCheckIcon, LayoutDashboard as LayoutDashboardIcon } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { OKRView } from './components/OKRView';
import { FirstTeamView } from './components/FirstTeamView';
import { TaskModal } from './components/TaskModal';
import { DelegationModal } from './components/DelegationModal';
import { DelegationsView } from './components/DelegationsView';
import { UpdatesView } from './components/UpdatesView';
import { FocusView } from './components/FocusView';
import { BrainDumpView } from './components/BrainDumpView';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { DecisionLogView } from './components/DecisionLogView';
import { QuickCapture, QuickCaptureButton } from './components/QuickCapture';
import { ViewSkeleton } from './components/ViewSkeleton';
import { SearchOverlay } from './components/SearchOverlay';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { AICoach } from './components/AICoach';
import { DayPlannerView } from './components/DayPlannerView';
import { MeetingsView } from './components/MeetingsView';
import { ProjectsView } from './components/ProjectsView';
import { HardConversationsView } from './components/HardConversationsView';
import { QuarterlyPlanningView } from './components/QuarterlyPlanningView';
import { RoleClarityView } from './components/RoleClarityView';
import { RoleChartersView } from './components/RoleChartersView';

// Lazy-load infrequently-visited views so they're excluded from the initial bundle
const SwotView          = lazy(() => import('./components/SwotView').then(m => ({ default: m.SwotView })));
const FrameworksLibrary = lazy(() => import('./components/FrameworksLibrary').then(m => ({ default: m.FrameworksLibrary })));
const NorthStarView     = lazy(() => import('./components/NorthStarView').then(m => ({ default: m.NorthStarView })));
const WeeklyReviewView  = lazy(() => import('./components/WeeklyReviewView').then(m => ({ default: m.WeeklyReviewView })));
const StakeholderMapView = lazy(() => import('./components/StakeholderMapView').then(m => ({ default: m.StakeholderMapView })));
const DirectReportsView = lazy(() => import('./components/DirectReportsView').then(m => ({ default: m.DirectReportsView })));
import { useAppStore } from './store';
import type { View, Task, QuadrantId } from './types';
import { parseTasksCSV } from './utils/export';

// ─── Notification helper ──────────────────────────────────────────────────────

function fireNotificationsIfGranted(tasks: Task[]) {
  if (Notification.permission !== 'granted') return;
  const todayStr = new Date().toISOString().split('T')[0];
  const fired = new Set<string>(JSON.parse(sessionStorage.getItem('notified-tasks') ?? '[]') as string[]);
  const toNotify = tasks.filter(t =>
    t.column !== 'done' && t.dueDate && t.dueDate <= todayStr && !fired.has(t.id) &&
    (t.priority === 'critical' || t.priority === 'high')
  ).slice(0, 3);
  toNotify.forEach(t => {
    new Notification(t.dueDate! < todayStr ? '⚠️ Overdue task' : '📅 Due today', {
      body: t.title,
      icon: '/favicon.ico',
    });
    fired.add(t.id);
  });
  sessionStorage.setItem('notified-tasks', JSON.stringify([...fired]));
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('adhd-leader-session') === '1';
  });
  const [view, setView] = useState<View>('dashboard');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [defaultQuadrant, setDefaultQuadrant] = useState<QuadrantId>('do-now');
  const [delegatingTask, setDelegatingTask] = useState<Task | null>(null);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAICoach, setShowAICoach] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [selectedMeetingId,       setSelectedMeetingId]       = useState<string | null>(null);
  const [selectedProjectId,       setSelectedProjectId]       = useState<string | null>(null);
  const [selectedConversationId,  setSelectedConversationId]  = useState<string | null>(null);
  const [selectedQuarterlyPlanId, setSelectedQuarterlyPlanId] = useState<string | null>(null);
  const [selectedRoleCharterId,   setSelectedRoleCharterId]   = useState<string | null>(null);
  const [notifBanner, setNotifBanner] = useState(false);
  const [celebrationTask, setCelebrationTask] = useState<string | null>(null);
  const [loopCelebration, setLoopCelebration] = useState<string | null>(null);
  const csvImportRef = useRef<HTMLInputElement>(null);

  const store = useAppStore();

  // Global keyboard shortcuts
  useEffect(() => {
    if (!isLoggedIn) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      if (e.key === 'n' && !inInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setShowQuickCapture(true);
      }
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !inInput)) {
        e.preventDefault();
        setShowSearch(s => !s);
      }
      if (e.key === '?' && !inInput) {
        setShowShortcuts(s => !s);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowQuickCapture(false);
        setShowShortcuts(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLoggedIn]);

  // Notifications: fire on login if permission already granted; show banner if default
  useEffect(() => {
    if (!isLoggedIn) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const hasUrgent = store.tasks.some(t =>
      t.column !== 'done' && t.dueDate && t.dueDate <= todayStr &&
      (t.priority === 'critical' || t.priority === 'high')
    );
    if (!hasUrgent) return;
    if (Notification.permission === 'granted') {
      fireNotificationsIfGranted(store.tasks);
    } else if (Notification.permission === 'default') {
      setNotifBanner(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const enableNotifications = useCallback(async () => {
    const permission = await Notification.requestPermission();
    setNotifBanner(false);
    if (permission === 'granted') fireNotificationsIfGranted(store.tasks);
  }, [store.tasks]);

  const openAddTask = useCallback((quadrant?: QuadrantId) => {
    setEditTask(null);
    setDefaultQuadrant(quadrant ?? 'do-now');
    setShowTaskModal(true);
  }, []);

  const openEditTask = useCallback((task: Task) => {
    setEditTask(task);
    setShowTaskModal(true);
  }, []);

  const handleSaveTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (editTask) {
      store.updateTask(editTask.id, taskData);
    } else {
      store.addTask({ ...taskData, quadrant: taskData.quadrant ?? defaultQuadrant });
    }
  }, [editTask, defaultQuadrant, store.updateTask, store.addTask]);

  const handleMoveColumn = useCallback((id: string, col: import('./types').KanbanColumnId) => {
    if (col === 'done') {
      const task = store.tasks.find(t => t.id === id);
      if (task) {
        setCelebrationTask(task.title);
        setTimeout(() => setCelebrationTask(null), 2500);
      }
    }
    store.moveTaskColumn(id, col);
  }, [store.tasks, store.moveTaskColumn]);

  const handleMarkFollowUpDone = useCallback((id: string) => {
    const task = store.tasks.find(t => t.id === id);
    store.markFollowUpDone(id);
    if (task?.delegatedTo) {
      setLoopCelebration(task.delegatedTo);
      setTimeout(() => setLoopCelebration(null), 2800);
    }
  }, [store.tasks, store.markFollowUpDone]);

  const handleDelegate = useCallback((delegatedTo: string, followUpDate?: string, emailDraft?: string) => {
    if (!delegatingTask) return;
    store.markDelegated(delegatingTask.id, delegatedTo, followUpDate, emailDraft);
  }, [delegatingTask, store.markDelegated]);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('adhd-leader-session');
    setIsLoggedIn(false);
  }, []);

  const handleSearchNavigate = useCallback((targetView: View) => {
    setView(targetView);
    if (targetView !== 'meetings')           setSelectedMeetingId(null);
    if (targetView !== 'projects')           setSelectedProjectId(null);
    if (targetView !== 'hard-conversations') setSelectedConversationId(null);
    if (targetView !== 'quarterly-planning') setSelectedQuarterlyPlanId(null);
    if (targetView !== 'role-charters')      setSelectedRoleCharterId(null);
  }, []);

  const handleCSVImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const tasks = parseTasksCSV(ev.target?.result as string);
        tasks.forEach(t => store.addTask(t));
        alert(`Imported ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`);
      } catch (err) {
        alert(`Import failed: ${err instanceof Error ? err.message : 'Invalid CSV'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [store.addTask]);

  const taskCounts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    return {
      doNow:              store.tasks.filter(t => t.quadrant === 'do-now' && t.column !== 'done').length,
      inProgress:         store.tasks.filter(t => t.column === 'in-progress').length,
      delegationAlerts:   store.tasks.filter(t => {
        if (!t.delegatedTo || t.followUpDone || !t.followUpDate) return false;
        const d = new Date(t.followUpDate);
        d.setHours(23, 59, 59, 999);
        return d <= now;
      }).length,
      pendingUpdates:     store.updates.reduce((sum, u) =>
        sum + (u.recipientIds.some(id => !u.discussedWith.includes(id)) ? 1 : 0), 0),
      dumpInbox:          store.dumpItems.filter(d => d.status === 'inbox').length,
      overdueCommitments: store.commitments.filter(c => !c.done && c.dueDate && c.dueDate < today).length,
    };
  }, [store.tasks, store.updates, store.dumpItems, store.commitments]);

  const searchData = useMemo(() => ({
    tasks:        store.tasks,
    decisions:    store.decisions,
    commitments:  store.commitments,
    updates:      store.updates,
    weeklyReviews: store.weeklyReviews,
    okrs:         store.okrs,
    dumpItems:    store.dumpItems,
  }), [store.tasks, store.decisions, store.commitments, store.updates, store.weeklyReviews, store.okrs, store.dumpItems]);

  if (!isLoggedIn) {
    return <LoginView onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#12111A]">
      <Sidebar
        view={view}
        onViewChange={setView}
        onLogout={handleLogout}
        onSearch={() => setShowSearch(true)}
        onToggleAICoach={() => setShowAICoach(s => !s)}
        onShowShortcuts={() => setShowShortcuts(true)}
        aiCoachOpen={showAICoach}
        mobileOpen={showMobileNav}
        onMobileClose={() => setShowMobileNav(false)}
        taskCounts={taskCounts}
      />

      <main className={`flex-1 overflow-hidden flex flex-col transition-all ${showAICoach ? 'md:mr-[380px]' : ''}`}>
        {/* Mobile top header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#2A2640] bg-[#1A1826] shrink-0">
          <button
            onClick={() => setShowMobileNav(true)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
              <Zap size={11} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white">ADHD Leader</span>
          </button>
          <div className="flex items-center gap-2">
            {taskCounts.doNow > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
            <button onClick={() => setShowSearch(true)} className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors">
              <Search size={17} />
            </button>
            <button onClick={() => setShowAICoach(s => !s)} className={`p-1.5 transition-colors ${showAICoach ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'}`}>
              <Bot size={17} />
            </button>
          </div>
        </div>

        {/* Notification banner */}
        {notifBanner && (
          <div className="shrink-0 flex items-center justify-between px-5 py-2.5 bg-purple-600/20 border-b border-purple-500/20">
            <p className="text-xs text-purple-300">
              You have urgent overdue tasks. Enable notifications to get reminders.
            </p>
            <div className="flex gap-2">
              <button onClick={enableNotifications} className="text-xs font-bold text-white px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors">Enable</button>
              <button onClick={() => setNotifBanner(false)} className="text-xs text-purple-400 hover:text-purple-300 px-2">Not now</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden p-4 md:p-6 pb-20 md:pb-6">
          <div key={view} className="h-full animate-[fadeIn_0.18s_ease-out]">
          {view === 'dashboard' && (
            <DashboardView
              tasks={store.tasks}
              okrs={store.okrs}
              updates={store.updates}
              projects={store.projects}
              meetings={store.meetings}
              quarterlyPlans={store.quarterlyPlans}
              hardConversations={store.hardConversations}
              decisions={store.decisions}
              commitments={store.commitments}
              dumpInboxCount={taskCounts.dumpInbox}
              delegationAlerts={taskCounts.delegationAlerts}
              onViewChange={setView}
              onEditTask={openEditTask}
              onSelectProject={id => { setSelectedProjectId(id); setView('projects'); }}
            />
          )}
          {view === 'kanban' && (
            <KanbanBoard
              tasks={store.tasks}
              onAddTask={openAddTask}
              onEditTask={openEditTask}
              onDeleteTask={store.deleteTask}
              onMoveColumn={handleMoveColumn}
              onDelegateTask={task => setDelegatingTask(task)}
              onImportCSV={() => csvImportRef.current?.click()}
            />
          )}
          {view === 'eisenhower' && (
            <EisenhowerMatrix
              tasks={store.tasks}
              onAddTask={openAddTask}
              onEditTask={openEditTask}
              onDeleteTask={store.deleteTask}
              onMoveQuadrant={store.moveTaskQuadrant}
              onDelegateTask={task => setDelegatingTask(task)}
            />
          )}
          {view === 'delegations' && (
            <DelegationsView
              tasks={store.tasks}
              onOpenDelegationModal={task => setDelegatingTask(task)}
              onMarkFollowUpDone={handleMarkFollowUpDone}
              onDeleteTask={store.deleteTask}
            />
          )}
          {view === 'okrs' && (
            <OKRView
              okrs={store.okrs}
              onAddOKR={store.addOKR}
              onUpdateOKR={store.updateOKR}
              onDeleteOKR={store.deleteOKR}
            />
          )}
          {view === 'swot' && (
            <Suspense fallback={<ViewSkeleton />}>
              <SwotView
                items={store.swotItems}
                onAdd={store.addSwotItem}
                onDelete={store.deleteSwotItem}
              />
            </Suspense>
          )}
          {view === 'first-team' && (
            <FirstTeamView
              members={store.teamMembers}
              tasks={store.tasks}
              onAdd={store.addTeamMember}
              onUpdate={store.updateTeamMember}
              onDelete={store.deleteTeamMember}
              onLinkTask={store.linkTaskToMember}
              onUnlinkTask={store.unlinkTaskFromMember}
            />
          )}
          {view === 'dump' && (
            <BrainDumpView
              items={store.dumpItems}
              onAdd={store.addDumpItem}
              onUpdate={store.updateDumpItem}
              onDelete={store.deleteDumpItem}
              onSetStatus={store.setDumpStatus}
              onConvertToTask={store.convertDumpToTask}
              onClearInbox={store.clearDumpInbox}
            />
          )}
          {view === 'frameworks' && <Suspense fallback={<ViewSkeleton />}><FrameworksLibrary /></Suspense>}
          {view === 'focus' && (
            <FocusView
              tasks={store.tasks}
              focusMap={store.focusMap}
              onSetSteps={store.setFocusSteps}
              onToggleStep={store.toggleFocusStep}
              onAddStep={store.addFocusStep}
              onDeleteStep={store.deleteFocusStep}
              onClearSteps={store.clearFocusSteps}
            />
          )}
          {view === 'updates' && (
            <UpdatesView
              people={store.updatePeople}
              updates={store.updates}
              onAddPerson={store.addUpdatePerson}
              onDeletePerson={store.deleteUpdatePerson}
              onAddUpdate={store.addUpdate}
              onDeleteUpdate={store.deleteUpdate}
              onMarkDiscussed={store.markDiscussed}
              onMarkAllDiscussed={store.markAllDiscussed}
              commitments={store.commitments}
              decisions={store.decisions}
              tasks={store.tasks}
              teamMembers={store.teamMembers}
            />
          )}
          {view === 'north-star' && (
            <Suspense fallback={<ViewSkeleton />}>
              <NorthStarView northStar={store.northStar} onSave={store.saveNorthStar} />
            </Suspense>
          )}
          {view === 'decision-log' && (
            <DecisionLogView
              decisions={store.decisions}
              commitments={store.commitments}
              onAddDecision={store.addDecision}
              onUpdateDecision={store.updateDecision}
              onDeleteDecision={store.deleteDecision}
              onAddCommitment={store.addCommitment}
              onToggleCommitment={store.toggleCommitment}
              onDeleteCommitment={store.deleteCommitment}
            />
          )}
          {view === 'weekly-review' && (
            <Suspense fallback={<ViewSkeleton />}>
              <WeeklyReviewView
                reviews={store.weeklyReviews}
                tasks={store.tasks}
                quarterlyPlan={(() => {
                  const now = new Date();
                  const qNum = Math.floor(now.getMonth() / 3) + 1;
                  const qStr = `Q${qNum} ${now.getFullYear()}`;
                  return store.quarterlyPlans.find(p => p.quarter === qStr && (p.status === 'active' || p.status === 'draft')) ?? null;
                })()}
                onSave={store.saveWeeklyReview}
              />
            </Suspense>
          )}
          {view === 'day-planner' && (
            <DayPlannerView
              tasks={store.tasks}
              onEditTask={openEditTask}
              onAddTask={openAddTask}
            />
          )}
          {view === 'meetings' && (
            <MeetingsView
              meetings={store.meetings}
              tasks={store.tasks}
              decisions={store.decisions}
              onAdd={store.addMeeting}
              onUpdate={store.updateMeeting}
              onDelete={store.deleteMeeting}
              onAddAgendaItem={store.addAgendaItem}
              onUpdateAgendaItem={store.updateAgendaItem}
              onDeleteAgendaItem={store.deleteAgendaItem}
              onAddActionItem={store.addMeetingActionItem}
              onUpdateActionItem={store.updateMeetingActionItem}
              onDeleteActionItem={store.deleteMeetingActionItem}
              onConvertToTask={store.convertActionItemToTask}
              onLinkTask={store.linkTaskToMeeting}
              onUnlinkTask={store.unlinkTaskFromMeeting}
              onLinkDecision={store.linkDecisionToMeeting}
              onUnlinkDecision={store.unlinkDecisionFromMeeting}
              selectedMeetingId={selectedMeetingId}
              onSelectMeeting={setSelectedMeetingId}
            />
          )}
          {view === 'projects' && (
            <ProjectsView
              projects={store.projects}
              tasks={store.tasks}
              okrs={store.okrs}
              onAdd={store.addProject}
              onUpdate={store.updateProject}
              onDelete={store.deleteProject}
              onAddMilestone={store.addMilestone}
              onUpdateMilestone={store.updateMilestone}
              onDeleteMilestone={store.deleteMilestone}
              onLinkTask={store.linkTaskToProject}
              onUnlinkTask={store.unlinkTaskFromProject}
              onLinkOKR={store.linkOKRToProject}
              onUnlinkOKR={store.unlinkOKRFromProject}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
            />
          )}
          {view === 'hard-conversations' && (
            <HardConversationsView
              conversations={store.hardConversations}
              onAdd={store.addHardConversation}
              onUpdate={store.updateHardConversation}
              onDelete={store.deleteHardConversation}
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
            />
          )}
          {view === 'quarterly-planning' && (
            <QuarterlyPlanningView
              plans={store.quarterlyPlans}
              okrs={store.okrs}
              projects={store.projects}
              onAdd={store.addQuarterlyPlan}
              onUpdate={store.updateQuarterlyPlan}
              onDelete={store.deleteQuarterlyPlan}
              selectedId={selectedQuarterlyPlanId}
              onSelect={setSelectedQuarterlyPlanId}
            />
          )}
          {view === 'role-clarity' && (
            <RoleClarityView
              doc={store.roleClarityDoc}
              onSave={store.saveRoleClarityDoc}
            />
          )}
          {view === 'role-charters' && (
            <RoleChartersView
              charters={store.roleCharters}
              onAdd={store.addRoleCharter}
              onUpdate={store.updateRoleCharter}
              onDelete={store.deleteRoleCharter}
              selectedId={selectedRoleCharterId}
              onSelect={setSelectedRoleCharterId}
            />
          )}
          {view === 'stakeholders' && (
            <Suspense fallback={<ViewSkeleton />}>
            <StakeholderMapView
              stakeholders={store.stakeholders}
              onAdd={store.addStakeholder}
              onUpdate={store.updateStakeholder}
              onDelete={store.deleteStakeholder}
              updates={store.updates}
              commitments={store.commitments}
              decisions={store.decisions}
              tasks={store.tasks}
              teamMembers={store.teamMembers}
            />
            </Suspense>
          )}
          {view === 'direct-reports' && (
            <Suspense fallback={<ViewSkeleton />}>
            <DirectReportsView
              people={store.updatePeople}
              updates={store.updates}
              profiles={store.directReportProfiles}
              onSaveProfile={store.saveDirectReportProfile}
              commitments={store.commitments}
              decisions={store.decisions}
              tasks={store.tasks}
              teamMembers={store.teamMembers}
            />
            </Suspense>
          )}
          </div>
        </div>
      </main>

      {/* Global overlays */}
      <QuickCaptureButton onClick={() => setShowQuickCapture(true)} />

      <QuickCapture
        open={showQuickCapture}
        onClose={() => setShowQuickCapture(false)}
        onCapture={text => { store.addDumpItem(text); }}
      />

      <SearchOverlay
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onNavigate={handleSearchNavigate}
        data={searchData}
      />

      {showTaskModal && (
        <TaskModal
          task={editTask}
          onSave={handleSaveTask}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
        />
      )}

      {delegatingTask && (
        <DelegationModal
          task={delegatingTask}
          onDelegate={handleDelegate}
          onClose={() => setDelegatingTask(null)}
        />
      )}

      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {/* Task completion celebration */}
      {celebrationTask && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-sm shadow-2xl shadow-emerald-900/40 animate-[fadeIn_0.2s_ease-out]">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/30 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Done!</p>
              <p className="text-sm font-semibold text-white truncate max-w-[240px]">{celebrationTask}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loop-closed celebration */}
      {loopCelebration && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-sky-500/20 border border-sky-500/40 backdrop-blur-sm shadow-2xl shadow-sky-900/40 animate-[fadeIn_0.2s_ease-out]">
            <div className="w-7 h-7 rounded-xl bg-sky-500/30 border border-sky-500/40 flex items-center justify-center">
              <UserCheckIcon size={14} className="text-sky-400" />
            </div>
            <div>
              <p className="text-xs font-black text-sky-400 uppercase tracking-widest">Loop closed!</p>
              <p className="text-sm font-semibold text-white truncate max-w-[240px]">Follow-up with {loopCelebration} done</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 bg-[#1A1826]/95 backdrop-blur-md border-t border-[#2A2640]">
        {[
          { id: 'dashboard' as const, icon: <Home size={20} />, label: 'Home' },
          { id: 'focus' as const, icon: <Zap size={20} />, label: 'Focus' },
        ].map(item => (
          <button key={item.id} onClick={() => setView(item.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
              view === item.id ? 'text-violet-400' : 'text-gray-600 hover:text-gray-400'
            }`}>
            {item.icon}
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        ))}

        {/* Quick Capture FAB */}
        <button
          onClick={() => setShowQuickCapture(true)}
          className="flex flex-col items-center gap-0.5 -mt-4 px-4 py-2 rounded-2xl bg-violet-600 border-2 border-[#12111A] text-white shadow-lg shadow-violet-900/60 transition-all active:scale-95"
        >
          <Plus size={22} />
          <span className="text-[10px] font-semibold">Capture</span>
        </button>

        <button onClick={() => setView('delegations')}
          className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
            view === 'delegations' ? 'text-violet-400' : 'text-gray-600 hover:text-gray-400'
          }`}>
          <UserCheckIcon size={20} />
          <span className="text-[10px] font-semibold">Loops</span>
          {taskCounts.delegationAlerts > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-amber-500 text-[9px] font-black text-black flex items-center justify-center">{taskCounts.delegationAlerts}</span>
          )}
        </button>

        <button onClick={() => setView('kanban')}
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
            view === 'kanban' ? 'text-violet-400' : 'text-gray-600 hover:text-gray-400'
          }`}>
          <LayoutDashboardIcon size={20} />
          <span className="text-[10px] font-semibold">Tasks</span>
        </button>
      </nav>

      {showAICoach && (
        <AICoach
          tasks={store.tasks}
          okrs={store.okrs}
          decisions={store.decisions}
          projects={store.projects}
          quarterlyPlan={(() => {
            const now = new Date();
            const qNum = Math.floor(now.getMonth() / 3) + 1;
            const qStr = `Q${qNum} ${now.getFullYear()}`;
            return store.quarterlyPlans.find(p => p.quarter === qStr && (p.status === 'active' || p.status === 'draft')) ?? null;
          })()}
          onClose={() => setShowAICoach(false)}
        />
      )}

      {/* Hidden CSV import input */}
      <input
        ref={csvImportRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleCSVImport}
      />
    </div>
  );
}
