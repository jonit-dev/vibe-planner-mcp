import React from 'react';
import { Task } from '../../types'; // Corrected import path

interface TaskItemProps {
  task: Task;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  return (
    <li className="p-3 mb-2 bg-base-content/10 rounded-md shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <h4 className="font-semibold text-base-content">{task.name}</h4>
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full 
            ${task.status === 'completed' ? 'bg-success text-success-content' :
              task.status === 'in_progress' ? 'bg-info text-info-content' :
                task.status === 'pending' ? 'bg-warning text-warning-content' :
                  'bg-neutral text-neutral-content'}
          `}
        >
          {task.status.replace('_', ' ')}
        </span>
      </div>
      {task.description && (
        <p className="text-sm text-base-content/80 mb-1">{task.description}</p>
      )}
      <div className="text-xs text-base-content/70 grid grid-cols-2 gap-x-2 gap-y-0.5">
        <p><strong>Order:</strong> {task.order}</p>
        <p><strong>Validated:</strong> {task.isValidated ? 'Yes' : 'No'}</p>
        <p><strong>Created:</strong> {new Date(task.creationDate).toLocaleDateString()}</p>
        <p><strong>Updated:</strong> {new Date(task.updatedAt).toLocaleDateString()}</p>
        {task.completionDate && (
          <p><strong>Completed:</strong> {new Date(task.completionDate).toLocaleDateString()}</p>
        )}
      </div>
      {task.notes && (
        <div className="mt-2 pt-1 border-t border-base-content/20">
          <p className="text-xs font-semibold text-base-content/90">Notes:</p>
          <p className="text-xs text-base-content/80 whitespace-pre-wrap">{task.notes}</p>
        </div>
      )}
      {task.validationCommand && (
        <div className="mt-2 pt-1 border-t border-base-content/20">
          <p className="text-xs font-semibold text-base-content/90">Validation Command:</p>
          <code className="text-xs text-info-content bg-neutral p-1 rounded block whitespace-pre-wrap">{task.validationCommand}</code>
        </div>
      )}
      {task.validationOutput && (
        <div className="mt-2 pt-1 border-t border-base-content/20">
          <p className="text-xs font-semibold text-base-content/90">Validation Output:</p>
          <pre className="text-xs text-accent-content bg-neutral p-1 rounded block whitespace-pre-wrap overflow-x-auto">{task.validationOutput}</pre>
        </div>
      )}
      {task.dependencies && task.dependencies.length > 0 && (
        <div className="mt-2 pt-1 border-t border-base-content/20">
          <p className="text-xs font-semibold text-base-content/90">Dependencies:</p>
          <ul className="list-disc list-inside pl-2">
            {task.dependencies.map((depId: string) => <li key={depId} className="text-xs">{depId}</li>)}
          </ul>
        </div>
      )}
    </li>
  );
}; 
