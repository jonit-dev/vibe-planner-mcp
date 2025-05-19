import React, { useMemo } from 'react';
import { useKanbanStore } from '../../store/kanbanStore';
import KanbanColumn from './KanbanColumn';
import { filterTasks } from '../../lib/utils';
import { Plus } from 'lucide-react';

const KanbanBoard: React.FC = () => {
  const { columns, tasks, filterOptions, addTask } = useKanbanStore();
  
  const filteredTasks = useMemo(() => {
    return filterTasks(tasks, filterOptions);
  }, [tasks, filterOptions]);

  const handleAddNewTask = () => {
    // Implement later
    alert('Add task functionality to be implemented');
  };
  
  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full">
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-xl font-mono">Kanban Board</h1>
        <button 
          className="btn btn-sm btn-primary"
          onClick={handleAddNewTask}
        >
          <Plus size={16} /> New Task
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-x-auto pb-6">
        <div className="flex h-full space-x-4">
          {columns.map(column => (
            <KanbanColumn 
              key={column.id}
              title={column.title} 
              status={column.status}
              tasks={filteredTasks.filter(task => task.status === column.status)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;