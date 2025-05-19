import {
  ArrowRight, Calendar, CheckCircle, ChevronDown,
  FileText, Hash, Info, Layers, Trash2, X, XCircle
} from 'lucide-react';
import React from 'react';
import { formatDate, getStatusLabel } from '../../lib/utils';
import { useTasksStore } from '../../store/tasksStore';
import { TaskStatus, TaskStatusType } from '../../types';

const TaskDetails: React.FC = () => {
  const { selectedTask, selectTask, updateTask, deleteTask } = useTasksStore();

  if (!selectedTask) return null;

  const handleClose = () => {
    selectTask(null);
  };

  const handleStatusChange = async (newStatus: TaskStatusType) => {
    if (selectedTask && selectedTask.status !== newStatus) {
      try {
        await updateTask(selectedTask.id, { status: newStatus });
      } catch (error) {
        console.error("Failed to update task status:", error);
      }
    }
  };

  const handleDelete = async () => {
    if (selectedTask && window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(selectedTask.id);
        selectTask(null);
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-base-100 w-full max-w-2xl rounded-lg shadow-xl animate-slide-up overflow-hidden flex flex-col max-h-[90vh]">
        {/* Standard Header */}
        <div className={`bg-base-200 p-4 relative border-b border-neutral`}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-base-content truncate pr-8" title={selectedTask.name}>
              {selectedTask.name}
            </h2>
            <button
              className="btn btn-sm btn-circle btn-ghost text-base-content absolute right-3 top-3"
              onClick={handleClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-grow p-5 space-y-6 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
          {/* Description Section */}
          {selectedTask.description && (
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body p-4">
                <h3 className="card-title text-sm flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-primary" />
                  Description
                </h3>
                <p className="text-sm text-base-content whitespace-pre-wrap leading-relaxed">
                  {selectedTask.description}
                </p>
              </div>
            </div>
          )}

          {/* Status Selection Box - Reverted to Dropdown */}
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-sm flex items-center gap-2 mb-3">
                <Info size={16} className="text-primary" />
                Status
              </h3>
              <div className="dropdown dropdown-top w-full">
                <label
                  tabIndex={0}
                  className={`btn btn-sm btn-outline border-base-300 hover:border-primary-focus w-full justify-between capitalize font-normal`}
                >
                  {getStatusLabel(selectedTask.status)}
                  <ChevronDown size={16} className="ml-1 opacity-70" />
                </label>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-1 shadow bg-base-300 rounded-md w-full mt-1">
                  {TaskStatus.map(statusValue => (
                    <li key={statusValue}>
                      <a
                        onClick={() => handleStatusChange(statusValue)}
                        className={`${selectedTask.status === statusValue
                          ? 'bg-primary text-primary-content'
                          : 'hover:bg-base-100 focus:bg-base-100'} capitalize text-sm p-2 rounded-md flex items-center gap-2`}
                      >
                        {selectedTask.status === statusValue && <ArrowRight size={14} />}
                        {getStatusLabel(statusValue)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Details and Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timeline Card */}
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body p-4">
                <h3 className="card-title text-sm flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-primary" />
                  Timeline
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between border-l-2 border-info pl-3 py-1">
                    <span className="opacity-80">Created</span>
                    <span className="font-mono">{formatDate(selectedTask.creationDate)}</span>
                  </div>
                  {selectedTask.completionDate && (
                    <div className="flex items-center justify-between border-l-2 border-success pl-3 py-1">
                      <span className="opacity-80">Completed</span>
                      <span className="font-mono">{formatDate(selectedTask.completionDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Validation Status Card */}
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body p-4">
                <h3 className="card-title text-sm flex items-center gap-2 mb-2">
                  {selectedTask.isValidated ? (
                    <CheckCircle size={16} className="text-success" />
                  ) : (
                    <XCircle size={16} className="text-error" />
                  )}
                  Validation
                </h3>
                <div className={`flex items-center gap-2 font-medium p-2 rounded-md ${selectedTask.isValidated
                  ? "bg-success bg-opacity-20 text-success"
                  : "bg-error bg-opacity-20 text-error"
                  }`}>
                  {selectedTask.isValidated ? 'Validated' : 'Not Validated'}
                </div>
              </div>
            </div>
          </div>

          {/* Technical Details Card */}
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-sm flex items-center gap-2 mb-2">
                <Layers size={16} className="text-primary" />
                Technical Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-70">Phase ID</label>
                  <div className="flex items-center gap-1.5 bg-base-300 p-2 rounded-md">
                    <Hash size={14} className="text-neutral opacity-60" />
                    <code className="font-mono text-xs break-all">{selectedTask.phaseId}</code>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-70">Order</label>
                  <div className="font-mono bg-base-300 p-2 rounded-md">{selectedTask.order}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-neutral p-4 flex justify-between items-center flex-shrink-0 bg-base-200">
          <button
            className="btn btn-sm btn-outline btn-error gap-2"
            onClick={handleDelete}
          >
            <Trash2 size={14} />
            Delete
          </button>
          <button
            className="btn btn-sm btn-primary gap-2"
            onClick={handleClose}
          >
            Ok
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
