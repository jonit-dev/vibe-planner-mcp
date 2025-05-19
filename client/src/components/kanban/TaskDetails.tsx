import {
  Calendar, Check, Trash2,
  X
} from 'lucide-react';
import React from 'react';
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils';
import { useTasksStore } from '../../store/tasksStore';
import { TaskStatus, TaskStatusType } from '../../types';

const TaskDetails: React.FC = () => {
  const { selectedTask, selectTask } = useTasksStore();

  if (!selectedTask) return null;

  const handleClose = () => {
    selectTask(null);
  };

  const handleStatusChange = (status: TaskStatusType) => {
    if (selectedTask) {
      console.log(`Placeholder: Update task ${selectedTask.id} to status ${status}`);
    }
  };

  const handleDelete = () => {
    if (selectedTask && window.confirm('Are you sure you want to delete this task?')) {
      console.log(`Placeholder: Delete task ${selectedTask.id}`);
      selectTask(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-base-100 w-full max-w-lg rounded-lg shadow-xl animate-slide-up overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-neutral flex-shrink-0">
          <h2 className="font-semibold text-lg text-base-content truncate pr-4" title={selectedTask.name}>
            {selectedTask.name}
          </h2>
          <button
            className="btn btn-sm btn-ghost btn-circle flex-shrink-0"
            onClick={handleClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
          <div className="space-y-5">
            {selectedTask.description && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-content uppercase tracking-wider mb-1.5">Description</h4>
                <p className="text-sm text-base-content whitespace-pre-wrap">
                  {selectedTask.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <h4 className="text-xs font-semibold text-neutral-content uppercase tracking-wider mb-1.5">Status</h4>
                <div className="dropdown dropdown-top w-full">
                  <label
                    tabIndex={0}
                    className={`${getStatusColor(selectedTask.status)} py-1.5 px-3 rounded-md cursor-pointer inline-flex items-center justify-between text-sm w-full capitalize`}
                  >
                    {getStatusLabel(selectedTask.status)}
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 opacity-70"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </label>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-1 shadow bg-base-200 rounded-md w-full mt-1">
                    {TaskStatus.map(statusValue => (
                      <li key={statusValue}>
                        <a
                          onClick={() => handleStatusChange(statusValue)}
                          className={`${selectedTask.status === statusValue ? 'bg-primary text-primary-content' : 'hover:bg-base-300'} capitalize text-sm p-2 rounded-md`}
                        >
                          {getStatusLabel(statusValue)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-neutral-content uppercase tracking-wider mb-1.5">Created</h4>
                <div className="flex items-center text-sm">
                  <Calendar size={14} className="mr-2 opacity-70 flex-shrink-0" />
                  <span>{formatDate(selectedTask.creationDate)}</span>
                </div>
              </div>

              {selectedTask.completionDate && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-content uppercase tracking-wider mb-1.5">Completed</h4>
                  <div className="flex items-center text-sm">
                    <Calendar size={14} className="mr-2 opacity-70 flex-shrink-0" />
                    <span>{formatDate(selectedTask.completionDate)}</span>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-neutral-content uppercase tracking-wider mb-1.5">Phase ID</h4>
                <p className="text-sm text-base-content break-all">{selectedTask.phaseId}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-neutral-content uppercase tracking-wider mb-1.5">Order</h4>
                <p className="text-sm text-base-content">{selectedTask.order}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-neutral-content uppercase tracking-wider mb-1.5">Validated</h4>
                <p className="text-sm text-base-content">{selectedTask.isValidated ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral p-4 flex justify-end space-x-2 flex-shrink-0 bg-base-200">
          <button
            className="btn btn-sm btn-ghost"
            onClick={handleDelete}
          >
            <Trash2 size={16} className="mr-1.5" />
            Delete Task
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={handleClose}
          >
            <Check size={16} className="mr-1.5" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
