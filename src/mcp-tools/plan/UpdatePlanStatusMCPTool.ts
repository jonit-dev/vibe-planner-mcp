import { inject, injectable } from 'tsyringe';
import { z } from 'zod';
import { LoggerService } from '../../services/LoggerService.js';
import { PrdLifecycleService } from '../../vibeplanner/services/PrdLifecycleService.js';
import { PhaseStatusSchema, PrdSchema } from '../../vibeplanner/types.js';
import { MCPBaseTool } from '../MCPBaseTool.js';

const UpdatePlanStatusInputSchemaShape = z.object({
  planId: z.string().uuid().describe('The ID of the plan (PRD) to update.'),
  status: PhaseStatusSchema.describe('The new status for the plan.'),
}).shape;

const UpdatePlanStatusOutputSchema = PrdSchema.nullable(); // Returns the updated PRD or null if not found

@injectable()
export class UpdatePlanStatusMCPTool extends MCPBaseTool<
  typeof UpdatePlanStatusInputSchemaShape,
  typeof UpdatePlanStatusOutputSchema
> {
  readonly toolName = 'mcp_vibe-planner_updatePlanStatus';
  readonly description = 'Updates the status of an existing plan (PRD).';
  readonly inputSchemaShape = UpdatePlanStatusInputSchemaShape;
  readonly outputSchema = UpdatePlanStatusOutputSchema;

  constructor(
    logger: LoggerService,
    @inject(PrdLifecycleService)
    private prdLifecycleService: PrdLifecycleService
  ) {
    super(logger);
    this.logger.info('[UpdatePlanStatusMCPTool] Initialized');
  }

  async execute(
    params: z.infer<z.ZodObject<typeof UpdatePlanStatusInputSchemaShape>>,
    context: any
  ): Promise<z.infer<typeof UpdatePlanStatusOutputSchema>> {
    this.logger.info(
      `[UpdatePlanStatusMCPTool] Executing to update status for plan ID: ${params.planId} to ${params.status}`
    );
    try {
      const updatedPrd = await this.prdLifecycleService.updatePrdStatus(
        params.planId,
        params.status
      );

      if (updatedPrd) {
        this.logger.info(
          `[UpdatePlanStatusMCPTool] Successfully updated status for plan ID: ${params.planId}`,
          updatedPrd
        );
      } else {
        this.logger.warn(
          `[UpdatePlanStatusMCPTool] Plan ID: ${params.planId} not found or status update failed. No update performed.`
        );
      }
      return updatedPrd;
    } catch (error) {
      this.logger.error(
        `[UpdatePlanStatusMCPTool] Error updating status for plan ID: ${params.planId}:`,
        error as Error
      );
      throw error;
    }
  }
}
