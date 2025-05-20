import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { inject, injectable } from 'tsyringe';
import { z } from 'zod';
import { LoggerService } from '../../services/LoggerService.js';
import { PhaseControlService } from '../../vibeplanner/services/PhaseControlService.js';
import { MCPBaseTool } from '../MCPBaseTool.js';

// Input schema
const CreatePhaseInputSchema = z.object({
  planId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  order: z.number().optional(),
});

// Output schema
const CreatePhaseOutputSchema = z.object({
  phaseId: z.string(),
  message: z.string(),
});

type CreatePhaseInput = z.infer<typeof CreatePhaseInputSchema>;
type CreatePhaseOutput = z.infer<typeof CreatePhaseOutputSchema>;

@injectable()
export class CreatePhaseMCPTool extends MCPBaseTool<
  typeof CreatePhaseInputSchema.shape,
  typeof CreatePhaseOutputSchema
> {
  readonly toolName = 'createPhase';
  readonly description = 'Creates a new phase in a development plan.';
  readonly inputSchemaShape = CreatePhaseInputSchema.shape;
  readonly outputSchema = CreatePhaseOutputSchema;

  constructor(
    @inject(LoggerService) logger: LoggerService,
    @inject(PhaseControlService)
    private phaseControlService: PhaseControlService
  ) {
    super(logger);
  }

  async execute(
    params: CreatePhaseInput,
    context: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CreatePhaseOutput> {
    this.logger.info(
      `[${this.toolName}] Creating phase for plan: ${params.planId}`
    );

    const phase = await this.phaseControlService.addPhaseToPrd(params.planId, {
      name: params.name,
      description: params.description,
      order: params.order || 1,
    });

    if (!phase) {
      throw new Error(`Failed to create phase in plan ${params.planId}`);
    }

    return {
      phaseId: phase.id,
      message: `Phase ${phase.id} created successfully in plan ${params.planId}`,
    };
  }
}
