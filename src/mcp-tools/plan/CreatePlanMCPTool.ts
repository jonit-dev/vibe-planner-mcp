import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { inject, injectable } from 'tsyringe';
import { LoggerService } from '../../services/LoggerService.js';
import { PrdLifecycleService } from '../../vibeplanner/services/PrdLifecycleService.js';
import { TaskOrchestrationService } from '../../vibeplanner/services/TaskOrchestrationService.js';
import {
  CreatePlanInput,
  CreatePlanInputSchema,
  CreatePlanOutput,
  CreatePlanOutputSchema,
  PhaseStatus,
} from '../../vibeplanner/types';
import { MCPBaseTool } from '../MCPBaseTool';

@injectable()
export class CreatePlanMCPTool extends MCPBaseTool<
  typeof CreatePlanInputSchema.shape,
  typeof CreatePlanOutputSchema
> {
  readonly toolName = 'createPlan';
  readonly description =
    'Creates a new development plan (PRD) and returns its ID and a message.';
  readonly inputSchemaShape = CreatePlanInputSchema.shape;
  readonly outputSchema = CreatePlanOutputSchema;

  constructor(
    @inject(LoggerService) logger: LoggerService,
    @inject(PrdLifecycleService)
    private prdLifecycleService: PrdLifecycleService,
    @inject(TaskOrchestrationService)
    private taskOrchestrationService: TaskOrchestrationService
  ) {
    super(logger);
  }

  async execute(
    params: CreatePlanInput,
    context: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CreatePlanOutput> {
    if (!params.name || params.name.trim() === '') {
      throw new Error('Plan name is required and cannot be empty.');
    }

    const prd = await this.prdLifecycleService.initializePrd({
      name: params.name,
      description: params.description,
      sourceTool: params.sourceTool,
      status: params.status as PhaseStatus | undefined,
    });

    if (!prd) {
      throw new Error(
        'Failed to initialize PRD. Service returned no PRD object.'
      );
    }

    try {
      await this.taskOrchestrationService.getNextTaskForPlan(prd.id);
    } catch (taskError) {
      this.logger.warn(
        `[${this.toolName}] Error fetching first task for new plan ${prd.id}: ${
          taskError instanceof Error ? taskError.message : String(taskError)
        }`,
        taskError as Error
      );
    }

    const result: CreatePlanOutput = {
      planId: prd.id,
      message: `Plan ${prd.id} created successfully. First task check logged separately.`,
    };

    return result;
  }
}
