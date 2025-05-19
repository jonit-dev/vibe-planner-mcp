import { LayoutDashboard, Moon, Search, Settings } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useTasksStore } from '../../store/tasksStore';

const Header: React.FC = () => {
  const { filterOptions, setFilter } = useTasksStore();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ searchQuery: e.target.value });
  };

  return (
    <header className="bg-base-200 border-b border-neutral py-3 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center cursor-pointer">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span className="ml-2 text-lg font-semibold font-mono">KanBoard</span>
          </Link>
        </div>

        <div className="flex-1 mx-8">
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-base-content opacity-60" />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              className="input input-sm w-full pl-10 bg-base-300 border-neutral text-base-content"
              value={filterOptions.searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="btn btn-circle btn-sm btn-ghost">
            <Moon className="h-5 w-5" />
          </button>
          <button className="btn btn-circle btn-sm btn-ghost">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
