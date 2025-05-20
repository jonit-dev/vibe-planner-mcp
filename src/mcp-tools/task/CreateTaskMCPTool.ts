import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { inject, injectable } from 'tsyringe';
import { z } from 'zod';
import { LoggerService } from '../../services/LoggerService.js';
import { TaskOrchestrationService } from '../../vibeplanner/services/TaskOrchestrationService.js';
import { TaskSchema } from '../../vibeplanner/types.js';
import { MCPBaseTool } from '../MCPBaseTool.js';

// Input schema
const CreateTaskInputSchema = z.object({
  phaseId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  order: z.number().optional(),
  validationCommand: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
});

// Output schema
const CreateTaskOutputSchema = z.object({
  taskId: z.string(),
  message: z.string(),
  task: TaskSchema,
});

type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;
type CreateTaskOutput = z.infer<typeof CreateTaskOutputSchema>;

@injectable()
export class CreateTaskMCPTool extends MCPBaseTool<
  typeof CreateTaskInputSchema.shape,
  typeof CreateTaskOutputSchema
> {
  readonly toolName = 'createTask';
  readonly description = 'Creates a new task in a phase.';
  readonly inputSchemaShape = CreateTaskInputSchema.shape;
  readonly outputSchema = CreateTaskOutputSchema;

  constructor(
    @inject(LoggerService) logger: LoggerService,
    @inject(TaskOrchestrationService)
    private taskOrchestrationService: TaskOrchestrationService
  ) {
    super(logger);
  }

  async execute(
    params: CreateTaskInput,
    context: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CreateTaskOutput> {
    this.logger.info(
      `[${this.toolName}] Creating task in phase: ${params.phaseId}`
    );

    const task = await this.taskOrchestrationService.addTaskToPhase(
      params.phaseId,
      {
        name: params.name,
        description: params.description,
        order: params.order || 1,
        validationCommand: params.validationCommand,
        dependencies: params.dependencies,
      }
    );

    if (!task) {
      throw new Error(`Failed to create task in phase ${params.phaseId}`);
    }

    return {
      taskId: task.id,
      message: `Task ${task.id} created successfully in phase ${params.phaseId}`,
      task,
    };
  }
}
