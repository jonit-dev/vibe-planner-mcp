import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { inject, injectable } from 'tsyringe';
import { z } from 'zod';
import { LoggerService } from '../../services/LoggerService.js';
import { PhaseControlService } from '../../vibeplanner/services/PhaseControlService.js';
import { PrdLifecycleService } from '../../vibeplanner/services/PrdLifecycleService.js';
import {
  GetPlanStatusInput,
  GetPlanStatusInputSchema,
  GetPlanStatusOutput,
  GetPlanStatusOutputSchema,
  Phase, // For PlanOverview structure
  Prd, // For PlanOverview structure // For PlanOverview structure
  Task,
} from '../../vibeplanner/types';
import { MCPBaseTool } from '../MCPBaseTool';

// This interface was in VibePlannerTool.ts, moving it here or to types.ts might be better.
// For now, defining locally to match the expected structure from the old VibePlannerTool.getPlanStatus
interface PlanOverviewForTool extends Prd {
  phases: (Phase & { tasks: Task[] })[];
}

@injectable()
export class GetPlanStatusMCPTool extends MCPBaseTool<
  typeof GetPlanStatusInputSchema.shape,
  typeof GetPlanStatusOutputSchema // This is PlanOverviewSchemaDetailed from types.ts
> {
  readonly toolName = 'getPlanStatus'; // Full tool name
  readonly description =
    'Retrieves the current status and detailed overview of a specific plan.';
  readonly inputSchemaShape = GetPlanStatusInputSchema.shape;
  readonly outputSchema = GetPlanStatusOutputSchema;

  constructor(
    @inject(LoggerService) logger: LoggerService,
    @inject(PrdLifecycleService)
    private prdLifecycleService: PrdLifecycleService,
    @inject(PhaseControlService)
    private phaseControlService: PhaseControlService
  ) {
    super(logger);
  }

  async execute(
    params: GetPlanStatusInput,
    context: RequestHandlerExtra<ServerRequest, ServerNotification> // context is unused in original logic for this tool
  ): Promise<GetPlanStatusOutput> {
    // Output matches GetPlanStatusOutputSchema (PlanOverviewSchemaDetailed)
    this.logger.info(
      `[${this.toolName}] Executing getPlanStatus for planId: ${params.planId}`
    );

    // Logic moved from VibePlannerTool.getPlanStatus
    const prd = await this.prdLifecycleService.getPrd(params.planId);
    if (!prd) {
      // The execute method should throw an error if the plan is not found,
      // and MCPBaseTool will format it as a CallToolResult error.
      // Or, if a specific "not found" structured empty response is desired,
      // it needs to be representable by GetPlanStatusOutputSchema.
      // For now, throwing an error is simpler and aligns with how other errors are handled.
      throw new Error(`Plan with ID ${params.planId} not found.`);
    }

    const phasesWithTasks = await this.phaseControlService.getPhasesWithTasks(
      params.planId
    );

    // Construct the plain data object that matches GetPlanStatusOutputSchema (PlanOverviewSchemaDetailed)
    const planOverview: PlanOverviewForTool = {
      ...prd,
      phases: phasesWithTasks.map((p) => ({
        ...p,
        tasks: p.tasks || [], // Ensure tasks is always an array
      })) as (Phase & { tasks: Task[] })[], // Casting to satisfy the local PlanOverviewForTool interface
    };

    // Validate the constructed object against the official output schema before returning.
    // This ensures the logic correctly builds the expected GetPlanStatusOutput.
    try {
      const validatedData = GetPlanStatusOutputSchema.parse(planOverview);
      this.logger.info(
        `[${this.toolName}] Successfully retrieved and validated plan status for ${params.planId}`
      );
      return validatedData;
    } catch (validationError) {
      this.logger.error(
        `[${this.toolName}] Failed to validate plan status data for ${params.planId}:`,
        validationError
      );
      if (validationError instanceof z.ZodError) {
        throw new Error(
          `Data validation error for getPlanStatus: ${validationError.issues
            .map((i: any) => i.path.join('.') + ': ' + i.message)
            .join('; ')}`
        );
      }
      throw new Error('Failed to process or validate plan status data.');
    }
  }
}
