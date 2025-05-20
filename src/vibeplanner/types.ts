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

// New schema for detailed plan overview
export const PlanOverviewSchemaDetailed = PrdSchema.extend({
  phases: z.array(
    PhaseSchema.extend({
      tasks: z.array(TaskSchema),
    })
  ),
});
export type PlanOverviewDetailed = z.infer<typeof PlanOverviewSchemaDetailed>;

// Schemas for MCP Tool Inputs & Outputs

// VibePlannerTool.createPlan
export const CreatePlanInputSchema = z.object({
  name: z.string(),
  description: z.string(),
  sourceTool: z.string().optional(),
  status: PhaseStatusSchema.optional(),
});
export type CreatePlanInput = z.infer<typeof CreatePlanInputSchema>;

// Temporarily simplified for debugging "cb is not a function"
export const CreatePlanOutputSchema = z.object({
  planId: z.string(),
  message: z.string().optional(), // Simplified field
});
export type CreatePlanOutput = z.infer<typeof CreatePlanOutputSchema>;

// VibePlannerTool.getPlanningScaffold
export const GetPlanningScaffoldInputSchema = z.object({});
export type GetPlanningScaffoldInput = z.infer<
  typeof GetPlanningScaffoldInputSchema
>;
// Output is a simple text content, handled directly in server.ts

// VibePlannerTool.getPlanStatus
export const GetPlanStatusInputSchema = z.object({ planId: z.string() });
export type GetPlanStatusInput = z.infer<typeof GetPlanStatusInputSchema>;
// Output schema for getPlanStatus is complex and derived from PrdSchema, handled in server.ts with sanitization.
// If we were to define it strictly here, it would be PrdSchema or a modified version.
// For now, we'll let server.ts handle the dynamic structuring and sanitization for its return.
// UPDATING: We will now use PlanOverviewSchemaDetailed for the GetPlanStatus output
export const GetPlanStatusOutputSchema = PlanOverviewSchemaDetailed;
export type GetPlanStatusOutput = z.infer<typeof GetPlanStatusOutputSchema>;

// VibePlannerTool.getNextTask
export const GetNextTaskInputSchema = z.object({ planId: z.string() });
export type GetNextTaskInput = z.infer<typeof GetNextTaskInputSchema>;
// Output is TaskSchema (or nullable TaskSchema), handled in server.ts with sanitization.

// VibePlannerTool.updateTaskStatus
export const UpdateTaskStatusInputSchema = z.object({
  taskId: z.string(),
  status: TaskStatusSchema,
  details: z.any().optional(),
});
export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusInputSchema>;

// VibePlannerTool.requestTaskValidation
export const RequestTaskValidationInputSchema = z.object({
  taskId: z.string(),
});
export type RequestTaskValidationInput = z.infer<
  typeof RequestTaskValidationInputSchema
>;
// Output is { validationCommand: string | undefined }, handled in server.ts.

// ADDING a formal schema for RequestTaskValidation output
export const RequestTaskValidationOutputSchema = z.object({
  validationCommand: z
    .string()
    .optional()
    .describe('The validation command, if available.'),
});
export type RequestTaskValidationOutput = z.infer<
  typeof RequestTaskValidationOutputSchema
>;
