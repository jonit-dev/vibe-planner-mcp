import React from 'react';

// Placeholder TaskData type until actual types are defined/imported
export interface TaskData { // Exporting for use in KanbanColumn
  id: string;
  name: string;
  description?: string;
  status: string;
}

interface TaskCardProps {
  task: TaskData;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  return (
    <div className='bg-white shadow-md rounded-lg p-3 mb-3 border border-gray-200 hover:shadow-lg transition-shadow'>
      <h3
        className='text-sm font-semibold text-gray-800 mb-1 truncate'
        title={task.name}
      >
        {task.name}
      </h3>
      {task.description && (
        <p
          className='text-xs text-gray-600 mb-2 truncate'
          title={task.description}
        >
          {task.description}
        </p>
      )}
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded-full ${task.status === 'COMPLETED'
          ? 'bg-green-100 text-green-700'
          : task.status === 'IN_PROGRESS'
            ? 'bg-yellow-100 text-yellow-700' // Added IN_PROGRESS style
            : 'bg-blue-100 text-blue-700' // Default for PENDING or other statuses
          }`}
      >
        {task.status.replace('_', ' ').toLowerCase()}
      </span>
    </div>
  );
};

export default TaskCard; 
