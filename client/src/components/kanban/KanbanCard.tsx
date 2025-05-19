import { Clock } from 'lucide-react';
import React from 'react';
import { formatDate } from '../../lib/utils';
import { useTasksStore } from '../../store/tasksStore';
import { Task } from '../../types';

interface KanbanCardProps {
  task: Task;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ task }) => {
  const { selectTask } = useTasksStore();

  const handleClick = () => {
    selectTask(task.id);
  };

  return (
    <div
      className="kanban-card bg-base-100 p-3 rounded-md shadow hover:shadow-lg transition-shadow cursor-pointer animate-fade-in"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-semibold text-base-content text-sm break-words">{task.name}</h4>
      </div>

      {task.description && (
        <p className="text-xs text-base-content opacity-70 line-clamp-3 mb-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-neutral-content opacity-60 mt-2">
        <div className="flex items-center">
          <Clock size={12} className="mr-1 flex-shrink-0" />
          <span>{formatDate(task.creationDate)}</span>
        </div>

        <span className="badge badge-outline badge-xs capitalize">{task.status}</span>
      </div>
    </div>
  );
};

export default KanbanCard;
