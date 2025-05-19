import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  CallToolResult,
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';
import { Phase, Prd, Task, TaskStatus } from '../types';
import { PhaseControlService } from './PhaseControlService';
import { PrdLifecycleService } from './PrdLifecycleService';
import {
  TaskOrchestrationService,
  UpdateTaskDetails,
} from './TaskOrchestrationService';

// Import for getPlanningScaffold
import { readFile } from 'fs/promises';
import * as path from 'path';
import { MCP_DOCS_PATH } from '../../constants/pathConstants.js';

// Define PlanOverview based on expected structure for getPlanStatus
export interface PlanOverview extends Prd {
  phases: (Phase & { tasks: Task[] })[];
}

@injectable()
export class VibePlannerTool {
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

  async createPlan(
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
    prdDetails: { name: string; description: string; sourceTool?: string }
  ): Promise<CallToolResult> {
    const prd = await this.prdLifecycleService.initializePrd({
      name: prdDetails.name,
      description: prdDetails.description,
      sourceTool: prdDetails.sourceTool,
    });

    if (!prd) {
      return {
        content: [],
        error: { code: -1, message: 'Failed to initialize PRD.' },
      };
    }

    let firstTask: Task | undefined = undefined;
    const nextTask = await this.taskOrchestrationService.getNextTaskForPlan(
      prd.id
    );
    if (nextTask) {
      firstTask = nextTask;
    }

    return { content: [], structuredContent: { planId: prd.id, firstTask } };
  }

  async getPlanningScaffold(
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<string> {
    const filePath = path.join(MCP_DOCS_PATH, 'planning-documents.md');
    console.error(
      `[VibePlannerTool][getPlanningScaffold] Attempting to read: ${filePath}`
    );
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      return fileContent;
    } catch (error) {
      console.error(
        '[VibePlannerTool][getPlanningScaffold] Error reading planning document:',
        error
      );
      // Re-throw or return an error structure if your tool framework expects it
      // For direct string return, an error might be handled by the caller or MCP wrapper
      throw new Error(
        `Failed to read planning document: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async getPlanStatus(
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
    planId: string
  ): Promise<CallToolResult> {
    console.log(
      'VibePlannerTool: getPlanStatus called with context:',
      extra,
      'for planId:',
      planId
    );
    const prd = await this.prdLifecycleService.getPrd(planId);
    if (!prd) {
      return { content: [], structuredContent: undefined };
    }

    const phasesWithTasks = await this.phaseControlService.getPhasesWithTasks(
      planId
    );

    const planOverview: PlanOverview = {
      ...prd,
      phases: phasesWithTasks.map((p) => ({
        ...p,
        tasks: p.tasks || [],
      })) as (Phase & { tasks: Task[] })[],
    };

    return { content: [], structuredContent: { ...planOverview } };
  }

  async getNextTask(
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
    planId: string
  ): Promise<CallToolResult> {
    console.log(
      'VibePlannerTool: getNextTask called with context:',
      extra,
      'for planId:',
      planId
    );
    const task = await this.taskOrchestrationService.getNextTaskForPlan(planId);
    if (!task) {
      return { content: [], structuredContent: undefined };
    }
    return { content: [], structuredContent: task };
  }

  async updateTaskStatus(
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
    taskId: string,
    status: TaskStatus,
    details?: { validationOutput?: string; notes?: string; exitCode?: number }
  ): Promise<CallToolResult> {
    console.log(
      'VibePlannerTool: updateTaskStatus called with context:',
      extra,
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
      console.error(`Failed to update task ${taskId}`);
      return {
        content: [],
        structuredContent: undefined,
        error: { code: -1, message: `Failed to update task ${taskId}` },
      };
    }
    return { content: [], structuredContent: {} };
  }

  async requestTaskValidation(
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
    taskId: string
  ): Promise<CallToolResult> {
    console.log(
      'VibePlannerTool: requestTaskValidation called with context:',
      extra,
      'for taskId:',
      taskId
    );
    const task = await this.taskOrchestrationService.getTask(taskId);

    if (task && task.validationCommand) {
      return {
        content: [],
        structuredContent: { validationCommand: task.validationCommand },
      };
    } else if (task && !task.validationCommand) {
      console.warn(`Task ${taskId} found, but has no validation command.`);
      return { content: [], structuredContent: undefined };
    } else {
      console.error(`Task ${taskId} not found for validation request.`);
      return {
        content: [],
        structuredContent: undefined,
        error: { code: -1, message: `Task ${taskId} not found` },
      };
    }
  }
}
