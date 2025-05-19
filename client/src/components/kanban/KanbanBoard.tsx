import React, { useMemo } from 'react';
// filterTasks utility might need adjustment or to be moved if complex filtering is needed based on tasksStore
// import { filterTasks } from '../../lib/utils'; 
import { useTasksStore } from '../../store/tasksStore'; // Updated to useTasksStore
import { Task } from '../../types'; // Added Task and KanbanPhaseColumn imports
import KanbanColumn from './KanbanColumn';

const KanbanBoard: React.FC = () => {
  // Get data from the new useTasksStore
  const phasesAsColumns = useTasksStore((state) => state.phasesAsColumns);
  const allTasksForPlan = useTasksStore((state) => state.tasks);
  const isLoading = useTasksStore((state) => state.isLoading);
  const error = useTasksStore((state) => state.error);
  // const filterOptions = useTasksStore((state) => state.filterOptions); // If using filters

  // Example: Memoize tasks per column if needed for performance or direct passing
  // This assumes tasks in `allTasksForPlan` have a `phaseId` property.
  const tasksByPhaseId = useMemo(() => {
    const grouped: { [phaseId: string]: Task[] } = {};
    allTasksForPlan.forEach(task => {
      if (!grouped[task.phaseId]) {
        grouped[task.phaseId] = [];
      }
      grouped[task.phaseId].push(task);
    });
    return grouped;
  }, [allTasksForPlan]);

  const handleAddNewTaskToPhase = (phaseId: string) => {
    // This would ideally open a modal or inline form
    // and then call an action from useTasksStore, e.g.:
    // const { addTask } = useTasksStore.getState();
    // addTask({ name: 'New Task', description: '...', status: 'pending' /*, other fields */ }, phaseId);
    alert(`Add new task to phase ${phaseId} - to be implemented`);
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

  if (!phasesAsColumns || phasesAsColumns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-neutral-content opacity-60">No phases (columns) defined for this plan.</p>
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
          {phasesAsColumns.map(phaseColumn => (
            <KanbanColumn
              key={phaseColumn.id}
              phase={phaseColumn} // Pass the whole phase object to KanbanColumn
              tasks={tasksByPhaseId[phaseColumn.id] || []} // Pass filtered tasks for this column
              onAddTask={() => handleAddNewTaskToPhase(phaseColumn.id)} // Pass add task handler
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
