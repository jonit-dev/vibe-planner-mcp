import React from 'react';
import type { TaskData } from './TaskCard'; // Importing TaskData as a type
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  title: string;
  tasks: TaskData[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, tasks }) => {
  return (
    <div className='bg-gray-50 rounded-lg p-3 flex-shrink-0 w-72 shadow'>
      <h2 className='text-md font-semibold text-gray-700 mb-3 px-1'>
        {title}
      </h2>
      <div className='max-h-[calc(100vh-12rem)] overflow-y-auto'>
        {tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        ) : (
          <p className='text-xs text-gray-500 p-2 text-center'>
            No tasks in this column.
          </p>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn; 
