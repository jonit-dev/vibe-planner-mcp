import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { inject, injectable } from 'tsyringe';
import { LoggerService } from '../../services/LoggerService.js';
import {
  TaskOrchestrationService,
  UpdateTaskDetails,
} from '../../vibeplanner/services/TaskOrchestrationService.js';
import {
  TaskStatus,
  UpdateTaskStatusInput,
  UpdateTaskStatusInputSchema,
} from '../../vibeplanner/types';
import { MCPBaseTool } from '../MCPBaseTool';

@injectable()
export class UpdateTaskStatusMCPTool extends MCPBaseTool<
  typeof UpdateTaskStatusInputSchema.shape,
  undefined // OutputType is undefined, as this tool returns no specific data on success
> {
  readonly toolName = 'updateTaskStatus';
  readonly description = 'Updates the status of a specific task.';
  readonly inputSchemaShape = UpdateTaskStatusInputSchema.shape;
  readonly outputSchema = undefined; // No specific Zod schema for output

  constructor(
    @inject(LoggerService) logger: LoggerService,
    @inject(TaskOrchestrationService)
    private taskOrchestrationService: TaskOrchestrationService
  ) {
    super(logger);
  }

  async execute(
    params: UpdateTaskStatusInput,
    context: RequestHandlerExtra<ServerRequest, ServerNotification> // Context unused by core logic
  ): Promise<void> {
    // Returns void on success
    this.logger.info(
      `[${this.toolName}] Executing for taskId: ${params.taskId}, status: ${params.status}`,
      params.details
        ? `Details: ${JSON.stringify(params.details)}`
        : 'No details'
    );

    // Logic moved from VibePlannerTool.updateTaskStatus
    const updateDetails: UpdateTaskDetails = {
      status: params.status as TaskStatus, // Ensure correct type if params.status is just string
      validationOutput: params.details?.validationOutput,
      notes: params.details?.notes,
      exitCode: params.details?.exitCode,
    };

    const updatedTask = await this.taskOrchestrationService.updateTask(
      params.taskId,
      updateDetails
    );

    if (!updatedTask) {
      // If task update fails (e.g., task not found, or DB error from service),
      // taskOrchestrationService.updateTask should ideally throw an error or return a clear failure indicator.
      // Assuming it throws or returns null/undefined on failure that should be an error condition here.
      this.logger.error(
        `[${this.toolName}] Failed to update task ${params.taskId}. TaskOrchestrationService.updateTask returned falsy.`
      );
      throw new Error(`Failed to update task ${params.taskId}.`);
    }

    this.logger.info(
      `[${this.toolName}] Successfully updated task ${params.taskId} to status ${params.status}.`
    );
    // No specific data to return, MCPBaseTool will form an empty success response.
  }
}
