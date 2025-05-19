export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'CANCELLED'
  | 'NEEDS_REVIEW'
  | 'VALIDATED'
  | 'FAILED';

export interface TaskData {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  // Assuming these might come from the backend, based on VibePlanner types
  order?: number;
  createdAt?: string;
  updatedAt?: string;
  planId?: string;
  phaseId?: string;
  parentId?: string | null;
  details?: Record<string, unknown>; // For any extra task-specific details
}

export interface PhaseData {
  id: string;
  name: string;
  description?: string;
  order?: number;
  status?: string; // Or a specific PhaseStatus type if defined
  tasks: TaskData[];
  planId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrdData {
  // Assuming PRD means Plan or Project Requirement Document
  id: string;
  name: string;
  description?: string;
  // ... other relevant PRD/Plan fields
}

export interface PlanOverviewData extends PrdData {
  // Extending PrdData for PlanOverview
  phases: PhaseData[];
  // any other top-level plan details not in PrdData
  createdAt?: string;
  updatedAt?: string;
}
