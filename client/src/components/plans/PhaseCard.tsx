import React from 'react';
import { Phase } from '../../types'; // Corrected import path
import TaskItem from './TaskItem';

interface PhaseCardProps {
  phase: Phase;
}

const PhaseCard: React.FC<PhaseCardProps> = ({ phase }) => {
  return (
    <div className="p-4 mb-4 bg-base-100 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-semibold text-secondary-focus">{phase.name}</h3>
        <span
          className={`px-2.5 py-1 text-sm font-medium rounded-full 
            ${phase.status === 'completed' ? 'bg-success text-success-content' :
              phase.status === 'in_progress' ? 'bg-info text-info-content' :
                'bg-neutral text-neutral-content'}
          `}
        >
          {phase.status.replace('_', ' ')}
        </span>
      </div>
      {phase.description && (
        <p className="text-sm text-base-content/80 mb-2">{phase.description}</p>
      )}
      <div className="text-xs text-base-content/70 mb-3">
        <p><strong>Order:</strong> {phase.order}</p>
        <p><strong>Created:</strong> {new Date(phase.creationDate).toLocaleDateString()}</p>
        <p><strong>Updated:</strong> {new Date(phase.updatedAt).toLocaleDateString()}</p>
        {phase.completionDate && (
          <p><strong>Completed:</strong> {new Date(phase.completionDate).toLocaleDateString()}</p>
        )}
      </div>

      <h4 className="text-lg font-medium text-base-content mb-2">Tasks:</h4>
      {phase.tasks && phase.tasks.length > 0 ? (
        <ul className="space-y-1">
          {phase.tasks.sort((a, b) => a.order - b.order).map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      ) : (
        <p className="text-sm italic text-base-content/70">No tasks in this phase.</p>
      )}
    </div>
  );
};

export default PhaseCard; 
