import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { inject, injectable } from 'tsyringe';
import { LoggerService } from '../../services/LoggerService.js';
import { TaskOrchestrationService } from '../../vibeplanner/services/TaskOrchestrationService.js';
import {
  RequestTaskValidationInput,
  RequestTaskValidationInputSchema,
  RequestTaskValidationOutput,
  RequestTaskValidationOutputSchema,
} from '../../vibeplanner/types';
import { MCPBaseTool } from '../MCPBaseTool';

@injectable()
export class RequestTaskValidationMCPTool extends MCPBaseTool<
  typeof RequestTaskValidationInputSchema.shape,
  typeof RequestTaskValidationOutputSchema
> {
  readonly toolName = 'requestTaskValidation';
  readonly description = 'Requests the validation command for a specific task.';
  readonly inputSchemaShape = RequestTaskValidationInputSchema.shape;
  readonly outputSchema = RequestTaskValidationOutputSchema;

  constructor(
    @inject(LoggerService) logger: LoggerService,
    @inject(TaskOrchestrationService)
    private taskOrchestrationService: TaskOrchestrationService
  ) {
    super(logger);
  }

  async execute(
    params: RequestTaskValidationInput,
    context: RequestHandlerExtra<ServerRequest, ServerNotification> // Context unused by core logic
  ): Promise<RequestTaskValidationOutput | null> {
    this.logger.info(
      `[${this.toolName}] Executing for taskId: ${params.taskId}`
    );

    // Logic moved from VibePlannerTool.requestTaskValidation
    const task = await this.taskOrchestrationService.getTask(params.taskId);

    if (!task) {
      this.logger.warn(`[${this.toolName}] Task not found: ${params.taskId}`);
      // Consider if this should be an error or just an empty response.
      // For now, returning null, which MCPBaseTool will handle as empty structuredContent.
      return null;
    }

    if (task.validationCommand) {
      this.logger.info(
        `[${this.toolName}] Validation command found for task ${params.taskId}: ${task.validationCommand}`
      );
      return { validationCommand: task.validationCommand };
    } else {
      this.logger.info(
        `[${this.toolName}] No validation command found for task ${params.taskId}.`
      );
      // Return an object that conforms to RequestTaskValidationOutputSchema but indicates no command
      return { validationCommand: undefined };
    }
  }
}
