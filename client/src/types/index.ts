export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

export enum TaskStatus {
  BACKLOG = "backlog",
  TODO = "todo",
  IN_PROGRESS = "in-progress",
  REVIEW = "review",
  DONE = "done"
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  dueDate?: string;
  tags: Tag[];
  assignee?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: TaskStatus;
}