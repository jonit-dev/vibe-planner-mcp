import {
  ArrowUpRight,
  CheckCircle,
  Clock,
  Filter,
  Inbox
} from 'lucide-react';
import React from 'react';
import { useTasksStore } from '../../store/tasksStore';
import { TaskStatusType } from '../../types';

const Sidebar: React.FC = () => {
  const { filterOptions, setFilter, clearFilters } = useTasksStore();

  const handleStatusFilter = (status: TaskStatusType | null) => {
    setFilter({ status });
  };

  return (
    <aside className="w-56 bg-base-200 h-full border-r border-neutral flex flex-col">
      <div className="p-4">
        <h2 className="font-mono text-sm font-medium text-base-content opacity-60 mb-2">VIEWS</h2>
        <nav className="space-y-1">
          <button
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-colors ${!filterOptions.status ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral'
              }`}
            onClick={() => handleStatusFilter(null)}
          >
            <Inbox size={16} />
            <span>All Tasks</span>
          </button>

          <button
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-colors ${filterOptions.status === 'pending' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral'
              }`}
            onClick={() => handleStatusFilter('pending')}
          >
            <Clock size={16} />
            <span>To Do</span>
          </button>

          <button
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-colors ${filterOptions.status === 'in_progress' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral'
              }`}
            onClick={() => handleStatusFilter('in_progress')}
          >
            <ArrowUpRight size={16} />
            <span>In Progress</span>
          </button>

          <button
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-colors ${filterOptions.status === 'completed' ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral'
              }`}
            onClick={() => handleStatusFilter('completed')}
          >
            <CheckCircle size={16} />
            <span>Done</span>
          </button>
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-neutral">
        <button
          className="btn btn-sm btn-outline w-full"
          onClick={clearFilters}
        >
          <Filter size={16} />
          Clear Filters
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
