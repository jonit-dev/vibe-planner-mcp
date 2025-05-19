import { PlusCircle } from 'lucide-react';
import React from 'react';
import { Task, TaskStatusType } from '../../types';
import KanbanCard from './KanbanCard';

export interface KanbanColumnProps {
  columnTitle: string;
  columnId: TaskStatusType;
  tasks: Task[];
  onAddTask: () => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  columnTitle,
  columnId,
  tasks,
  onAddTask
}) => {
  return (
    <div className="kanban-column bg-base-200 p-3 rounded-lg w-72 flex-shrink-0 flex flex-col max-h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <h3 className="font-semibold text-base-content text-md truncate" title={columnTitle}>{columnTitle}</h3>
        </div>
        <span className="badge badge-ghost badge-sm">{tasks.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <KanbanCard key={task.id} task={task} />
          ))
        ) : (
          <div className="flex items-center justify-center h-20 text-neutral-content opacity-50 text-xs italic p-2 text-center">
            No tasks in this column.
          </div>
        )}
      </div>

      <button
        onClick={onAddTask}
        className="btn btn-sm btn-ghost mt-2 text-neutral-content hover:bg-base-300 hover:text-primary justify-start w-full">
        <PlusCircle size={16} className="mr-2" /> Add Task
      </button>
    </div>
  );
};

export default KanbanColumn;
