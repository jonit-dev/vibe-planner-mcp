import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TaskStatusType } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getStatusColor(status: TaskStatusType): string {
  switch (status) {
    case 'pending':
      return 'bg-info text-info-content';
    case 'in_progress':
      return 'bg-warning text-warning-content';
    case 'completed':
      return 'bg-success text-success-content';
    case 'blocked':
      return 'bg-error text-error-content';
    case 'cancelled':
      return 'bg-neutral text-neutral-content';
    case 'validated':
      return 'bg-primary text-primary-content';
    case 'failed':
      return 'bg-error text-error-content';
    case 'needs_review':
      return 'bg-accent text-accent-content';
    default:
      return 'bg-base-300 text-base-content';
  }
}

export function getStatusLabel(status: TaskStatusType): string {
  return status
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
