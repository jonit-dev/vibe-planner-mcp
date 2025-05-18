import { z } from 'zod';

// Status Schemas
export const TaskStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'blocked',
  'cancelled',
  'validated',
  'failed',
  'needs_review',
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const PhaseStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'on_hold',
  // 'validated', // Not used yet, deferring decision
  // 'failed',    // Not used yet, deferring decision
]);
export type PhaseStatus = z.infer<typeof PhaseStatusSchema>;

// Core Schemas
export const TaskSchema = z.object({
  id: z.string().uuid().describe('Unique identifier for the task'),
  name: z.string().min(1).describe('Name of the task'),
  description: z
    .string()
    .nullable()
    .optional()
    .describe('Detailed description of the task'),
  status: TaskStatusSchema.describe('Current status of the task'),
  isValidated: z.boolean().describe('Whether the task has been validated'),
  dependencies: z
    .array(z.string().uuid())
    .optional()
    .describe(
      'List of task IDs that this task depends on. Populated by service layer.'
    ),
  creationDate: z.date().describe('Date when the task was created'),
  updatedAt: z.date().describe('Date when the task was last updated'),
  completionDate: z
    .date()
    .optional()
    .nullable()
    .describe('Date when the task was completed'),
  order: z
    .number()
    .int()
    .positive()
    .describe('Order of the task within a phase'),
  phaseId: z
    .string()
    .uuid()
    .describe('Identifier of the phase this task belongs to'),
  validationCommand: z
    .string()
    .nullable()
    .optional()
    .describe('Command to run for validating the task'),
  validationOutput: z
    .string()
    .nullable()
    .optional()
    .describe('Output of the validation command'),
  notes: z
    .string()
    .nullable()
    .optional()
    .describe('Additional notes for the task'),
});
export type Task = z.infer<typeof TaskSchema>;

export const PhaseSchema = z.object({
  id: z.string().uuid().describe('Unique identifier for the phase'),
  name: z.string().min(1).describe('Name of the phase'),
  description: z
    .string()
    .nullable()
    .optional()
    .describe('Detailed description of the phase'),
  status: PhaseStatusSchema,
  tasks: z
    .array(TaskSchema)
    .optional()
    .describe('List of tasks within this phase. Populated by service layer.'),
  creationDate: z.date().describe('Date when the phase was created'),
  updatedAt: z.date().describe('Date when the phase was last updated'),
  completionDate: z
    .date()
    .optional()
    .nullable()
    .describe('Date when the phase was completed'),
  order: z
    .number()
    .int()
    .positive()
    .describe('Order of the phase within a PRD'),
  prdId: z
    .string()
    .uuid()
    .describe('Identifier of the PRD this phase belongs to'),
});
export type Phase = z.infer<typeof PhaseSchema>;

export const PrdSchema = z.object({
  id: z.string().uuid().describe('Unique identifier for the PRD'),
  name: z.string().min(1).describe('Name of the Product Requirement Document'),
  description: z
    .string()
    .nullable()
    .optional()
    .describe('Overall description of the PRD'),
  status: PhaseStatusSchema.describe('Current status of the PRD'),
  phases: z
    .array(PhaseSchema)
    .optional()
    .describe('List of phases within this PRD. Populated by service layer.'),
  creationDate: z.date().describe('Date when the PRD was created'),
  updatedAt: z.date().describe('Date when the PRD was last updated'),
  completionDate: z
    .date()
    .optional()
    .nullable()
    .describe('Date when the PRD was completed'),
});
export type Prd = z.infer<typeof PrdSchema>;

export const PlanOverviewSchema = z.object({
  id: z.string().uuid().describe('Unique identifier for the plan overview'),
  name: z.string().min(1).describe('Name of the overall plan'),
  description: z.string().optional().describe('Description of the plan'),
  prds: z
    .array(PrdSchema)
    .optional()
    .describe('List of PRDs in this plan. Populated by service layer.'),
  creationDate: z.date().describe('Date when the plan was created'),
  updatedAt: z.date().describe('Date when the plan was last updated'),
});
export type PlanOverview = z.infer<typeof PlanOverviewSchema>;
