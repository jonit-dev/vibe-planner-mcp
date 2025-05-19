import { Clock, TagIcon } from 'lucide-react';
import React from 'react';
import { formatDate } from '../../lib/utils';
import { useTasksStore } from '../../store/tasksStore';
import { Task } from '../../types';

interface KanbanCardProps {
  task: Task;
}

// Simple color utility for phase tags
const getPhaseColor = (phaseName: string = 'Default'): string => {
  // A more sophisticated color generation or mapping could be used
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-gray-500',
  ];
  let hash = 0;
  for (let i = 0; i < phaseName.length; i++) {
    hash = phaseName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index] || 'bg-gray-500';
};

const KanbanCard: React.FC<KanbanCardProps> = ({ task }) => {
  const { selectTask } = useTasksStore();
  const phases = useTasksStore((state) => state.phasesAsColumns); // Get all phases

  const phase = phases.find(p => p.id === task.phaseId); // Find the phase for this task

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

      {/* Phase Tag */}
      {phase && (
        <div className="mb-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPhaseColor(phase.name)} text-white`}
            title={`Phase: ${phase.name}`}
          >
            <TagIcon size={12} className="mr-1" />
            {phase.name}
          </span>
        </div>
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
