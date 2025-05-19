import React from 'react';
import { 
  Inbox, 
  CheckCircle, 
  Clock, 
  Star, 
  Tag, 
  Filter, 
  AlertCircle, 
  ArrowUpRight
} from 'lucide-react';
import { useKanbanStore } from '../../store/kanbanStore';
import { TaskPriority, TaskStatus } from '../../types';

const Sidebar: React.FC = () => {
  const { tags, filterOptions, setFilter, clearFilters } = useKanbanStore();
  
  const handleStatusFilter = (status: TaskStatus | null) => {
    setFilter({ status });
  };
  
  const handlePriorityFilter = (priority: TaskPriority | null) => {
    setFilter({ priority });
  };
  
  const handleTagFilter = (tagId: string) => {
    const currentTags = [...filterOptions.tags];
    const tagIndex = currentTags.indexOf(tagId);
    
    if (tagIndex === -1) {
      currentTags.push(tagId);
    } else {
      currentTags.splice(tagIndex, 1);
    }
    
    setFilter({ tags: currentTags });
  };
  
  return (
    <aside className="w-56 bg-base-200 h-full border-r border-neutral flex flex-col">
      <div className="p-4">
        <h2 className="font-mono text-sm font-medium text-base-content opacity-60 mb-2">VIEWS</h2>
        <nav className="space-y-1">
          <button 
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
              !filterOptions.status ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral'
            }`}
            onClick={() => handleStatusFilter(null)}
          >
            <Inbox size={16} />
            <span>All Tasks</span>
          </button>
          
          <button 
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
              filterOptions.status === TaskStatus.TODO ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral'
            }`}
            onClick={() => handleStatusFilter(TaskStatus.TODO)}
          >
            <Clock size={16} />
            <span>To Do</span>
          </button>
          
          <button 
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
              filterOptions.status === TaskStatus.IN_PROGRESS ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral'
            }`}
            onClick={() => handleStatusFilter(TaskStatus.IN_PROGRESS)}
          >
            <ArrowUpRight size={16} />
            <span>In Progress</span>
          </button>
          
          <button 
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
              filterOptions.status === TaskStatus.DONE ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral'
            }`}
            onClick={() => handleStatusFilter(TaskStatus.DONE)}
          >
            <CheckCircle size={16} />
            <span>Done</span>
          </button>
        </nav>
      </div>
      
      <div className="p-4 border-t border-neutral">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-mono text-sm font-medium text-base-content opacity-60">PRIORITIES</h2>
        </div>
        <div className="space-y-1">
          <button 
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
              filterOptions.priority === TaskPriority.LOW ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral'
            }`}
            onClick={() => handlePriorityFilter(TaskPriority.LOW)}
          >
            <div className="w-3 h-3 rounded-full bg-info"></div>
            <span>Low</span>
          </button>
          
          <button 
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
              filterOptions.priority === TaskPriority.MEDIUM ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral'
            }`}
            onClick={() => handlePriorityFilter(TaskPriority.MEDIUM)}
          >
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span>Medium</span>
          </button>
          
          <button 
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
              filterOptions.priority === TaskPriority.HIGH ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral'
            }`}
            onClick={() => handlePriorityFilter(TaskPriority.HIGH)}
          >
            <div className="w-3 h-3 rounded-full bg-error"></div>
            <span>High</span>
          </button>
        </div>
      </div>
      
      <div className="p-4 border-t border-neutral">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-mono text-sm font-medium text-base-content opacity-60">TAGS</h2>
        </div>
        <div className="space-y-1">
          {tags.map(tag => (
            <button 
              key={tag.id}
              className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                filterOptions.tags.includes(tag.id) ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral'
              }`}
              onClick={() => handleTagFilter(tag.id)}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }}></div>
              <span>{tag.name}</span>
            </button>
          ))}
        </div>
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