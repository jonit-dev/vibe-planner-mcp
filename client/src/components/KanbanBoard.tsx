import React from 'react';
import KanbanColumn from './KanbanColumn';
import type { TaskData } from './TaskCard'; // Type import

export interface ColumnWithTasks { // Exporting for potential use in App.tsx or parent components
  id: string;
  title: string;
  tasks: TaskData[];
}

interface KanbanBoardProps {
  columns?: ColumnWithTasks[]; // Made columns optional to allow default sample data
}

// Sample Data for testing
const sampleBoardData: ColumnWithTasks[] = [
  {
    id: 'PENDING',
    title: 'To Do',
    tasks: [
      { id: 'task-1', name: 'Review PRD document for Phase 3', description: 'Check all requirements and acceptance criteria.', status: 'PENDING' },
      { id: 'task-2', name: 'Setup frontend API service calls', description: 'Implement functions to call backend endpoints.', status: 'PENDING' },
      { id: 'task-3', name: 'Plan UI for settings page', status: 'PENDING' },
    ],
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    tasks: [
      { id: 'task-4', name: 'Develop basic UI components', description: 'Create TaskCard, KanbanColumn, KanbanBoard.', status: 'IN_PROGRESS' },
      { id: 'task-5', name: 'Integrate Tailwind CSS into Vite project', status: 'IN_PROGRESS' },
    ],
  },
  {
    id: 'COMPLETED',
    title: 'Completed',
    tasks: [
      { id: 'task-6', name: 'Initialize React project with Vite & TS', description: 'Includes ESLint and Prettier setup.', status: 'COMPLETED' },
      { id: 'task-7', name: 'Define Phase 2 tasks in markdown', status: 'COMPLETED' },
    ]
  },
  {
    id: 'BLOCKED',
    title: 'Blocked',
    tasks: []
  }
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns = sampleBoardData }) => {
  return (
    <div className='flex p-4 space-x-4 overflow-x-auto bg-gray-100 h-full'>
      <div className='max-w-7xl mx-auto w-full flex space-x-4 pb-8'>
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            title={column.title}
            tasks={column.tasks}
          />
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard; 
