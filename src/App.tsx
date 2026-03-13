import { useState } from 'react';
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
import { useAppStore } from './store';
import type { View, Task, QuadrantId } from './types';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('adhd-leader-session') === '1';
  });
  const [view, setView] = useState<View>('dashboard');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [defaultQuadrant, setDefaultQuadrant] = useState<QuadrantId>('do-now');
  const [delegatingTask, setDelegatingTask] = useState<Task | null>(null);

  const store = useAppStore();

  const openAddTask = (quadrant?: QuadrantId) => {
    setEditTask(null);
    setDefaultQuadrant(quadrant ?? 'do-now');
    setShowTaskModal(true);
  };

  const openEditTask = (task: Task) => {
    setEditTask(task);
    setShowTaskModal(true);
  };

  const openDelegateTask = (task: Task) => {
    setDelegatingTask(task);
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

  // Delegation alerts: overdue or due-today follow-ups
  const delegationAlerts = store.tasks.filter(t => {
    if (!t.delegatedTo || t.followUpDone || !t.followUpDate) return false;
    const followUp = new Date(t.followUpDate);
    followUp.setHours(23, 59, 59, 999);
    return followUp <= new Date();
  }).length;

  const pendingUpdates = store.updates.reduce((sum, u) => {
    const hasPending = u.recipientIds.some(id => !u.discussedWith.includes(id));
    return sum + (hasPending ? 1 : 0);
  }, 0);

  const taskCounts = {
    doNow: store.tasks.filter(t => t.quadrant === 'do-now' && t.column !== 'done').length,
    inProgress: store.tasks.filter(t => t.column === 'in-progress').length,
    delegationAlerts,
    pendingUpdates,
    dumpInbox: store.dumpItems.filter(d => d.status === 'inbox').length,
  };

  if (!isLoggedIn) {
    return <LoginView onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F0A1E]">
      <Sidebar view={view} onViewChange={setView} taskCounts={taskCounts} />

      <main className="flex-1 overflow-hidden p-6">
        {view === 'dashboard' && (
          <DashboardView
            tasks={store.tasks}
            okrs={store.okrs}
            updates={store.updates}
            teamMembers={store.teamMembers}
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
            onDelegateTask={openDelegateTask}
          />
        )}
        {view === 'eisenhower' && (
          <EisenhowerMatrix
            tasks={store.tasks}
            onAddTask={openAddTask}
            onEditTask={openEditTask}
            onDeleteTask={store.deleteTask}
            onMoveQuadrant={store.moveTaskQuadrant}
            onDelegateTask={openDelegateTask}
          />
        )}
        {view === 'delegations' && (
          <DelegationsView
            tasks={store.tasks}
            onOpenDelegationModal={openDelegateTask}
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
          />
        )}
      </main>

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
