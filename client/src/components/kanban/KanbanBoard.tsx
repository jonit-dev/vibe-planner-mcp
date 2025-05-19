import React, { useMemo } from 'react';
// filterTasks utility might need adjustment or to be moved if complex filtering is needed based on tasksStore
// import { filterTasks } from '../../lib/utils'; 
import { useTasksStore } from '../../store/tasksStore'; // Updated to useTasksStore
import { Task, TaskStatusType } from '../../types'; // Added Task and KanbanPhaseColumn imports, changed to TaskStatusType
import { KanbanColumn } from './KanbanColumn'; // Updated to named import

// Define the statuses for Kanban columns in a logical workflow order
const KANBAN_STATUSES: { id: TaskStatusType; title: string }[] = [
  { id: 'pending', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'completed', title: 'Done' },     // Simplified to Done, was 'Completed'
];

export const KanbanBoard: React.FC = () => {
  // Get data from the new useTasksStore
  // const phasesAsColumns = useTasksStore((state) => state.phasesAsColumns); // No longer using phasesAsColumns
  const allTasksForPlan = useTasksStore((state) => state.tasks);
  const isLoading = useTasksStore((state) => state.isLoading);
  const error = useTasksStore((state) => state.error);
  const filterOptions = useTasksStore((state) => state.filterOptions); // Get filter options

  // Filter tasks based on sidebar selection before grouping by status
  const tasksToDisplay = useMemo(() => {
    if (filterOptions.status) {
      return allTasksForPlan.filter(task => task.status === filterOptions.status);
    }
    return allTasksForPlan;
  }, [allTasksForPlan, filterOptions.status]);

  // Group tasks by their status using a defined mapping
  const tasksByStatus = useMemo(() => {
    const grouped: { [status in TaskStatusType]?: Task[] } = {};
    KANBAN_STATUSES.forEach(statusInfo => {
      grouped[statusInfo.id] = []; // Initialize for 'pending', 'in_progress', 'completed' columns
    });

    tasksToDisplay.forEach(task => {
      let targetColumnId: TaskStatusType = 'pending'; // Default column

      switch (task.status) {
        case 'pending':
        case 'cancelled':
        case 'failed':
          targetColumnId = 'pending';
          break;
        case 'in_progress':
        case 'blocked':
        case 'needs_review':
          targetColumnId = 'in_progress';
          break;
        case 'completed':
        case 'validated':
          targetColumnId = 'completed';
          break;
        default:
          // This case should ideally not be hit if all TaskStatusType values are handled.
          // If a new status is added to TaskStatusType and not to this switch,
          // it will default to 'pending'.
          console.warn(`Task '${task.name}' (ID: ${task.id}) has unmapped status '${task.status}'. Placed in 'To Do'.`);
          targetColumnId = 'pending';
          break;
      }

      if (grouped[targetColumnId]) {
        grouped[targetColumnId]!.push(task);
      } else {
        // This else should ideally not be hit if KANBAN_STATUSES correctly define the columns 
        // for which `grouped` was initialized (pending, in_progress, completed).
        // If targetColumnId is somehow not one of these, default to 'pending' column.
        console.error(`Task '${task.name}' (ID: ${task.id}) mapped to an unknown column ID '${targetColumnId}'. Forcing to 'To Do'.`);
        if (grouped['pending']) {
          grouped['pending']!.push(task);
        }
      }
    });
    return grouped;
  }, [tasksToDisplay]); // KANBAN_STATUSES is constant, dependency is tasksToDisplay

  const handleAddNewTaskToStatus = (status: TaskStatusType) => {
    // This would ideally open a modal or inline form
    // and then call an action from useTasksStore, e.g.:
    // const { addTask } = useTasksStore.getState();
    // addTask({ name: 'New Task', description: '...', status: status /*, other fields */ });
    alert(`Add new task with status ${status} - to be implemented`);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <span className="loading loading-lg loading-spinner text-primary"></span>
        <p className="mt-3 text-info-content opacity-70">Loading board data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-xl text-error-content">Error loading board data.</p>
        <p className="text-error-content opacity-80 mt-1">{error.message}</p>
      </div>
    );
  }

  if (KANBAN_STATUSES.length === 0) { // Check against our defined statuses
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-neutral-content opacity-60">No statuses (columns) defined for the board.</p>
      </div>
    );
  }

  // The main heading for the Kanban board itself might be redundant if KanbanPage already shows plan name.
  // Consider removing this H1 or making it more specific (e.g. "Task Board")
  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full">
      {/* Optional: Header for the board itself, e.g., for global actions like 'Add Phase' */}
      {/* <div className="p-4 flex items-center justify-between border-b border-base-300">
        <h2 className="text-xl font-semibold text-base-content">Task Board</h2>
      </div> */}

      <div className="flex-1 p-4 overflow-x-auto pb-6">
        <div className="flex h-full space-x-4">
          {KANBAN_STATUSES.map(statusInfo => (
            <KanbanColumn
              key={statusInfo.id}
              columnTitle={statusInfo.title}
              _columnId={statusInfo.id} // Ensure _columnId is used if that's the prop name in KanbanColumn
              tasks={tasksByStatus[statusInfo.id] || []}
              onAddTask={() => handleAddNewTaskToStatus(statusInfo.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
