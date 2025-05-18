import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';
import { PhaseControlService } from './services/PhaseControlService';
import { PrdLifecycleService } from './services/PrdLifecycleService';
import {
  TaskOrchestrationService,
  UpdateTaskDetails,
} from './services/TaskOrchestrationService';
import { Phase, Prd, Task, TaskStatus } from './types';

// Placeholder for McpTool and McpToolContext from the SDK
// These would typically be imported from '@modelcontextprotocol/sdk'
// interface McpToolContext {
//   // Define properties of McpToolContext if known, e.g., logger, user info
//   [key: string]: any;
// }

// interface McpTool {
//   toolName: string;
//   toolDescription: string;
//   toolVersion: string;
//   // Define other methods if specified by the McpTool interface
//   startNewPlan(
//     context: McpToolContext,
//     prdDetails: { name: string; description: string; sourceTool?: string }
//   ): Promise<{ planId: string; firstTask?: Task }>;
//   getPlanStatus(
//     context: McpToolContext,
//     planId: string
//   ): Promise<PlanOverview | null>;
//   getNextTask(context: McpToolContext, planId: string): Promise<Task | null>;
//   updateTaskStatus(
//     context: McpToolContext,
//     taskId: string,
//     status: TaskStatus,
//     details?: { validationOutput?: string; notes?: string; exitCode?: number }
//   ): Promise<void>;
//   requestTaskValidation(
//     context: McpToolContext,
//     taskId: string
//   ): Promise<{ validationCommand: string } | null>;
// }

// Define PlanOverview based on expected structure for getPlanStatus
export interface PlanOverview extends Prd {
  phases: (Phase & { tasks: Task[] })[];
}

@injectable()
export class VibePlannerTool /* implements McpTool - Removed */ {
  public readonly toolName = 'VibePlannerTool';
  public readonly toolDescription =
    'A tool for managing development plans and tasks.';
  public readonly toolVersion = '0.1.0';

  constructor(
    @inject(PrdLifecycleService)
    private prdLifecycleService: PrdLifecycleService,
    @inject(PhaseControlService)
    private phaseControlService: PhaseControlService,
    @inject(TaskOrchestrationService)
    private taskOrchestrationService: TaskOrchestrationService
  ) {}

  async startNewPlan(
    context: any, // McpToolContext replaced with any
    prdDetails: { name: string; description: string; sourceTool?: string }
  ): Promise<{ planId: string; firstTask?: Task }> {
    const prd = await this.prdLifecycleService.initializePrd({
      name: prdDetails.name,
      description: prdDetails.description,
      sourceTool: prdDetails.sourceTool,
    });

    if (!prd) {
      // This case should ideally be handled with a more specific error
      // or prdLifecycleService.initializePrd should guarantee a PRD or throw.
      throw new Error('Failed to initialize PRD.');
    }

    // Optionally get the first task
    // The plan mentions: "Optionally uses TaskOrchestrationService.getNextTaskForPlan to return the first task."
    // Let's assume for now we always try to get the first task if the plan is created.
    let firstTask: Task | undefined = undefined;
    const nextTask = await this.taskOrchestrationService.getNextTaskForPlan(
      prd.id
    );
    if (nextTask) {
      firstTask = nextTask;
    }

    return { planId: prd.id, firstTask };
  }

  async getPlanStatus(
    context: any, // McpToolContext replaced with any
    planId: string
  ): Promise<PlanOverview | null> {
    console.log(
      'VibePlannerTool: getPlanStatus called with context:',
      context,
      'for planId:',
      planId
    );
    const prd = await this.prdLifecycleService.getPrd(planId);
    if (!prd) {
      return null;
    }

    // The plan specifies using PhaseControlService.getPhasesWithTasks.
    // PrdLifecycleService.getPrd might already populate phases and tasks fully via DataPersistenceService.
    // However, to adhere to the tool description, we make the call explicitly.
    const phasesWithTasks = await this.phaseControlService.getPhasesWithTasks(
      planId
    );

    // Combine the Prd base with the explicitly fetched phases and tasks
    // The `prd` object from getPrd should already have its `phases` populated,
    // and those phases should have their `tasks` populated by the service chain.
    // The phasesWithTasks variable also contains these fully populated phases.
    // We are ensuring the PlanOverview structure is met.
    const planOverview: PlanOverview = {
      ...prd,
      // Ensure that the phases property matches the PlanOverview definition,
      // where `phases` is an array of `Phase` objects, and each `Phase` object
      // must have a `tasks` array (even if empty).
      // The `as any` and then `as (Phase & { tasks: Task[] })[]` is to bridge the types if TypeScript
      // is struggling with the exact shape from Prd vs. the explicit call to getPhasesWithTasks.
      // Given that getPhasesWithTasks returns Phase[] where each Phase has tasks populated,
      // this cast should be safe.
      phases: phasesWithTasks.map((p) => ({
        ...p,
        tasks: p.tasks || [], // Ensure tasks is always an array
      })) as (Phase & { tasks: Task[] })[],
    };

    return planOverview;
  }

  async getNextTask(
    context: any, // McpToolContext replaced with any
    planId: string
  ): Promise<Task | null> {
    console.log(
      'VibePlannerTool: getNextTask called with context:',
      context,
      'for planId:',
      planId
    );
    return this.taskOrchestrationService.getNextTaskForPlan(planId);
  }

  async updateTaskStatus(
    context: any, // McpToolContext replaced with any
    taskId: string,
    status: TaskStatus,
    details?: { validationOutput?: string; notes?: string; exitCode?: number }
  ): Promise<void> {
    console.log(
      'VibePlannerTool: updateTaskStatus called with context:',
      context,
      'for taskId:',
      taskId,
      'status:',
      status,
      'details:',
      details
    );
    const updateDetails: UpdateTaskDetails = {
      status,
      validationOutput: details?.validationOutput,
      notes: details?.notes,
      exitCode: details?.exitCode,
    };

    const updatedTask = await this.taskOrchestrationService.updateTask(
      taskId,
      updateDetails
    );
    if (!updatedTask) {
      // Handle case where task is not found or update fails, e.g., throw an error
      // For now, consistent with plan, method is void. But logging an error or throwing might be better.
      console.error(`Failed to update task ${taskId}`);
      // Consider throwing an error if the MCP spec expects failures to be propagated
      // throw new Error(`Failed to update task ${taskId}`);
    }
    // Method is void, so no return value needed even on success.
  }

  async requestTaskValidation(
    context: any, // McpToolContext replaced with any
    taskId: string
  ): Promise<{ validationCommand: string } | null> {
    console.log(
      'VibePlannerTool: requestTaskValidation called with context:',
      context,
      'for taskId:',
      taskId
    );
    const task = await this.taskOrchestrationService.getTask(taskId);

    if (task && task.validationCommand) {
      return { validationCommand: task.validationCommand };
    } else if (task && !task.validationCommand) {
      // Task exists but has no validation command
      console.warn(`Task ${taskId} found, but has no validation command.`);
      return null;
    } else {
      // Task not found
      console.error(`Task ${taskId} not found for validation request.`);
      return null;
    }
  }
}
