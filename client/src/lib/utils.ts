import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Task, TaskPriority, TaskStatus, FilterOptions } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.BACKLOG:
      return 'bg-neutral text-base-content';
    case TaskStatus.TODO:
      return 'bg-info text-info-content';
    case TaskStatus.IN_PROGRESS:
      return 'bg-warning text-warning-content';
    case TaskStatus.REVIEW:
      return 'bg-accent text-accent-content';
    case TaskStatus.DONE:
      return 'bg-success text-success-content';
    default:
      return 'bg-neutral text-base-content';
  }
}

export function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case TaskPriority.LOW:
      return 'badge-info';
    case TaskPriority.MEDIUM:
      return 'badge-warning';
    case TaskPriority.HIGH:
      return 'badge-error';
    default:
      return 'badge-info';
  }
}

export function getPriorityLabel(priority: TaskPriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function getStatusLabel(status: TaskStatus): string {
  return status.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function filterTasks(tasks: Task[], filters: FilterOptions): Task[] {
  return tasks.filter(task => {
    // Filter by status
    if (filters.status && task.status !== filters.status) {
      return false;
    }
    
    // Filter by priority
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }
    
    // Filter by search query
    if (filters.searchQuery && 
        !task.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
        !task.description.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by tags
    if (filters.tags.length > 0 && 
        !task.tags.some(tag => filters.tags.includes(tag.id))) {
      return false;
    }
    
    return true;
  });
}