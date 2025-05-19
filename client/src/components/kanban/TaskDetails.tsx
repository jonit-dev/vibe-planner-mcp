import React from 'react';
import { 
  X, Calendar, User, Tag, Clock, AlertCircle, Check, 
  ArrowUpRight, LayoutList, Trash2 
} from 'lucide-react';
import { useKanbanStore } from '../../store/kanbanStore';
import { formatDate, getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel } from '../../lib/utils';
import { TaskStatus } from '../../types';

const TaskDetails: React.FC = () => {
  const { selectedTask, selectTask, updateTask, deleteTask } = useKanbanStore();

  if (!selectedTask) return null;

  const handleClose = () => {
    selectTask(null);
  };

  const handleStatusChange = (status: TaskStatus) => {
    updateTask(selectedTask.id, { status });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(selectedTask.id);
      selectTask(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-base-100 w-full max-w-2xl rounded-lg shadow-xl animate-slide-up overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-neutral">
          <h2 className="font-mono font-semibold">Task Details</h2>
          <button 
            className="btn btn-sm btn-ghost btn-circle" 
            onClick={handleClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-medium">{selectedTask.title}</h3>
            <div className={`badge ${getPriorityColor(selectedTask.priority)}`}>
              {getPriorityLabel(selectedTask.priority)}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-mono text-base-content opacity-60 mb-2">DESCRIPTION</h4>
              <p className="text-base-content">
                {selectedTask.description || 'No description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-mono text-base-content opacity-60 mb-2">STATUS</h4>
                <div className="dropdown dropdown-top">
                  <label 
                    tabIndex={0} 
                    className={`${getStatusColor(selectedTask.status)} py-1 px-3 rounded-md cursor-pointer inline-flex items-center`}
                  >
                    {getStatusLabel(selectedTask.status)}
                  </label>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52">
                    {Object.values(TaskStatus).map(status => (
                      <li key={status}>
                        <a 
                          onClick={() => handleStatusChange(status)}
                          className={selectedTask.status === status ? 'active' : ''}
                        >
                          {getStatusLabel(status)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-mono text-base-content opacity-60 mb-2">ASSIGNEE</h4>
                <div className="flex items-center">
                  {selectedTask.assignee ? (
                    <>
                      <div className="avatar placeholder">
                        <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                          <span>{selectedTask.assignee.charAt(0)}</span>
                        </div>
                      </div>
                      <span className="ml-2">{selectedTask.assignee}</span>
                    </>
                  ) : (
                    <span className="text-base-content opacity-50">Unassigned</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-mono text-base-content opacity-60 mb-2">CREATED</h4>
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1.5" />
                  <span>{formatDate(selectedTask.createdAt)}</span>
                </div>
              </div>

              {selectedTask.dueDate && (
                <div>
                  <h4 className="text-sm font-mono text-base-content opacity-60 mb-2">DUE DATE</h4>
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1.5" />
                    <span>{formatDate(selectedTask.dueDate)}</span>
                  </div>
                </div>
              )}
            </div>

            {selectedTask.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-mono text-base-content opacity-60 mb-2">TAGS</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.tags.map(tag => (
                    <div 
                      key={tag.id}
                      className="badge" 
                      style={{ backgroundColor: tag.color, color: '#1E1E2E' }}
                    >
                      {tag.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-neutral p-4 flex justify-between">
          <button 
            className="btn btn-sm btn-error" 
            onClick={handleDelete}
          >
            <Trash2 size={14} />
            Delete
          </button>
          <button 
            className="btn btn-sm btn-primary" 
            onClick={handleClose}
          >
            <Check size={14} />
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;