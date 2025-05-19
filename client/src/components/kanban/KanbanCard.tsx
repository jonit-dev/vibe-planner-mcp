import React from 'react';
import { Clock, Tag } from 'lucide-react';
import { Task } from '../../types';
import { useKanbanStore } from '../../store/kanbanStore';
import { formatDate, getPriorityColor } from '../../lib/utils';

interface KanbanCardProps {
  task: Task;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ task }) => {
  const { selectTask } = useKanbanStore();

  const handleClick = () => {
    selectTask(task.id);
  };
  
  return (
    <div 
      className="kanban-card animate-fade-in" 
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-base-content">{task.title}</h4>
        <div className={`badge ${getPriorityColor(task.priority)} badge-sm ml-2`}>
          {task.priority}
        </div>
      </div>
      
      <p className="text-sm text-base-content opacity-70 line-clamp-2 mb-3">
        {task.description}
      </p>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {task.tags.map(tag => (
          <span 
            key={tag.id} 
            className="badge badge-sm" 
            style={{ backgroundColor: tag.color, color: '#1E1E2E' }}
          >
            {tag.name}
          </span>
        ))}
      </div>
      
      <div className="flex items-center justify-between text-xs text-base-content opacity-70">
        <div className="flex items-center">
          <Clock size={12} className="mr-1" />
          <span>{formatDate(task.createdAt)}</span>
        </div>
        
        {task.assignee && (
          <div className="avatar placeholder">
            <div className="bg-neutral-focus text-neutral-content rounded-full w-6">
              <span className="text-xs">{task.assignee.charAt(0)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;