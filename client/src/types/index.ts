export const TaskStatus = [
  'pending',
  'in_progress',
  'completed',
  'blocked',
  'cancelled',
  'validated',
  'failed',
  'needs_review',
] as const;
export type TaskStatusType = (typeof TaskStatus)[number];

export const PhaseStatus = [
  'pending',
  'in_progress',
  'completed',
  'on_hold',
] as const;
export type PhaseStatusType = (typeof PhaseStatus)[number];

export interface Task {
  id: string;
  name: string;
  description?: string | null;
  status: TaskStatusType;
  isValidated: boolean;
  creationDate: string; // Assuming string representation for dates from API
  updatedAt: string;
  completionDate?: string | null;
  order: number;
  phaseId: string;
  validationCommand?: string | null;
  validationOutput?: string | null;
  notes?: string | null;
  dependencies?: string[];
}

export interface Phase {
  id: string;
  name: string;
  description?: string | null;
  status: PhaseStatusType;
  tasks?: Task[];
  creationDate: string;
  updatedAt: string;
  completionDate?: string | null;
  order: number;
  prdId: string;
}

export interface Prd {
  id: string;
  name: string;
  description?: string | null;
  status: PhaseStatusType; // PRD status seems to use PhaseStatus in the backend schema
  phases?: Phase[];
  creationDate: string;
  updatedAt: string;
  completionDate?: string | null;
}

// For the /api/plans endpoint (list of summaries)
export interface PrdSummary {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string; // Mapped from creationDate in the API
}

// Representing the full structure from /api/plans/:planId
export type PlanDetail = Prd;

// The old KanbanColumn and Tag types might not be directly applicable
// to the new schema. Commenting them out for now.
/*
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: TaskStatus; // This TaskStatus was the old enum
}
*/
