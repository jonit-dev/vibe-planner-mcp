import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { inject, injectable } from 'tsyringe';
import { LoggerService } from '../../services/LoggerService.js';
import { TaskOrchestrationService } from '../../vibeplanner/services/TaskOrchestrationService.js';
import {
  GetNextTaskInput,
  GetNextTaskInputSchema,
  Task,
  TaskSchema,
} from '../../vibeplanner/types';
import { MCPBaseTool } from '../MCPBaseTool';

@injectable()
export class GetNextTaskMCPTool extends MCPBaseTool<
  typeof GetNextTaskInputSchema.shape,
  typeof TaskSchema // OutputType is TaskSchema
> {
  readonly toolName = 'getNextTask';
  readonly description =
    'Gets the next available task for a given development plan.';
  readonly inputSchemaShape = GetNextTaskInputSchema.shape;
  readonly outputSchema = TaskSchema;

  constructor(
    @inject(LoggerService) logger: LoggerService,
    @inject(TaskOrchestrationService)
    private taskOrchestrationService: TaskOrchestrationService
  ) {
    super(logger);
  }

  async execute(
    params: GetNextTaskInput,
    context: RequestHandlerExtra<ServerRequest, ServerNotification> // Context currently unused by this tool's core logic
  ): Promise<Task | null> {
    // Returns Task or null if not found
    this.logger.info(
      `[${this.toolName}] Executing for planId: ${params.planId}`
    );

    // Logic moved from VibePlannerTool.getNextTask
    // The VibePlannerTool.getNextTask directly calls taskOrchestrationService.getNextTaskForPlan
    // which already returns Promise<Task | null>
    const task = await this.taskOrchestrationService.getNextTaskForPlan(
      params.planId
    );

    if (!task) {
      this.logger.info(
        `[${this.toolName}] No next task found for planId: ${params.planId}`
      );
      return null; // Return null if no task is found
    }

    this.logger.info(
      `[${this.toolName}] Successfully retrieved next task: ${task.id} for planId: ${params.planId}`
    );
    return task;
  }
}
