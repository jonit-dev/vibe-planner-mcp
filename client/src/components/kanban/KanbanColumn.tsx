import React from 'react';
import KanbanCard from './KanbanCard';
import { Task, TaskStatus } from '../../types';
import { getStatusColor } from '../../lib/utils';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  title, 
  status, 
  tasks 
}) => {
  return (
    <div className="kanban-column">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(status)}`}></div>
          <h3 className="font-medium font-mono text-sm">{title}</h3>
        </div>
        <span className="badge badge-neutral">{tasks.length}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <KanbanCard key={task.id} task={task} />
          ))
        ) : (
          <div className="flex items-center justify-center h-24 text-base-content opacity-50 text-sm italic">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;