import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { OKRView } from './components/OKRView';
import { SwotView } from './components/SwotView';
import { FirstTeamView } from './components/FirstTeamView';
import { TaskModal } from './components/TaskModal';
import { DelegationModal } from './components/DelegationModal';
import { DelegationsView } from './components/DelegationsView';
import { FrameworksLibrary } from './components/FrameworksLibrary';
import { UpdatesView } from './components/UpdatesView';
import { FocusView } from './components/FocusView';
import { BrainDumpView } from './components/BrainDumpView';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { NorthStarView } from './components/NorthStarView';
import { DecisionLogView } from './components/DecisionLogView';
import { WeeklyReviewView } from './components/WeeklyReviewView';
import { StakeholderMapView } from './components/StakeholderMapView';
import { DirectReportsView } from './components/DirectReportsView';
import { QuickCapture, QuickCaptureButton } from './components/QuickCapture';
import { SearchOverlay } from './components/SearchOverlay';
import { useAppStore } from './store';
import type { View, Task, QuadrantId } from './types';

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
  const [notifBanner, setNotifBanner] = useState(false);

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
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowQuickCapture(false);
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

  const enableNotifications = async () => {
    const permission = await Notification.requestPermission();
    setNotifBanner(false);
    if (permission === 'granted') fireNotificationsIfGranted(store.tasks);
  };

  const openAddTask = (quadrant?: QuadrantId) => {
    setEditTask(null);
    setDefaultQuadrant(quadrant ?? 'do-now');
    setShowTaskModal(true);
  };

  const openEditTask = (task: Task) => {
    setEditTask(task);
    setShowTaskModal(true);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (editTask) {
      store.updateTask(editTask.id, taskData);
    } else {
      store.addTask({ ...taskData, quadrant: taskData.quadrant ?? defaultQuadrant });
    }
  };

  const handleDelegate = (delegatedTo: string, followUpDate?: string, emailDraft?: string) => {
    if (!delegatingTask) return;
    store.markDelegated(delegatingTask.id, delegatedTo, followUpDate, emailDraft);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adhd-leader-session');
    setIsLoggedIn(false);
  };

  const handleSearchNavigate = (targetView: View) => {
    setView(targetView);
  };

  const delegationAlerts = store.tasks.filter(t => {
    if (!t.delegatedTo || t.followUpDone || !t.followUpDate) return false;
    const followUp = new Date(t.followUpDate);
    followUp.setHours(23, 59, 59, 999);
    return followUp <= new Date();
  }).length;

  const pendingUpdates = store.updates.reduce((sum, u) => {
    return sum + (u.recipientIds.some(id => !u.discussedWith.includes(id)) ? 1 : 0);
  }, 0);

  const today = new Date().toISOString().split('T')[0];
  const overdueCommitments = store.commitments.filter(c => !c.done && c.dueDate && c.dueDate < today).length;

  const taskCounts = {
    doNow:              store.tasks.filter(t => t.quadrant === 'do-now' && t.column !== 'done').length,
    inProgress:         store.tasks.filter(t => t.column === 'in-progress').length,
    delegationAlerts,
    pendingUpdates,
    dumpInbox:          store.dumpItems.filter(d => d.status === 'inbox').length,
    overdueCommitments,
  };

  if (!isLoggedIn) {
    return <LoginView onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#12111A]">
      <Sidebar
        view={view}
        onViewChange={setView}
        onLogout={handleLogout}
        onSearch={() => setShowSearch(true)}
        taskCounts={taskCounts}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
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

        <div className="flex-1 overflow-hidden p-6">
          {view === 'dashboard' && (
            <DashboardView
              tasks={store.tasks}
              okrs={store.okrs}
              updates={store.updates}
              dumpInboxCount={taskCounts.dumpInbox}
              delegationAlerts={taskCounts.delegationAlerts}
              onViewChange={setView}
              onEditTask={openEditTask}
            />
          )}
          {view === 'kanban' && (
            <KanbanBoard
              tasks={store.tasks}
              onAddTask={openAddTask}
              onEditTask={openEditTask}
              onDeleteTask={store.deleteTask}
              onMoveColumn={store.moveTaskColumn}
              onDelegateTask={task => setDelegatingTask(task)}
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
              onMarkFollowUpDone={store.markFollowUpDone}
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
            <SwotView
              items={store.swotItems}
              onAdd={store.addSwotItem}
              onDelete={store.deleteSwotItem}
            />
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
          {view === 'frameworks' && <FrameworksLibrary />}
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
            <NorthStarView northStar={store.northStar} onSave={store.saveNorthStar} />
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
            <WeeklyReviewView reviews={store.weeklyReviews} onSave={store.saveWeeklyReview} />
          )}
          {view === 'stakeholders' && (
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
          )}
          {view === 'direct-reports' && (
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
          )}
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
        data={{
          tasks:        store.tasks,
          decisions:    store.decisions,
          commitments:  store.commitments,
          updates:      store.updates,
          weeklyReviews: store.weeklyReviews,
          okrs:         store.okrs,
          dumpItems:    store.dumpItems,
        }}
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
    </div>
  );
}
