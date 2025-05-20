import { inject, injectable } from 'tsyringe';
import { z } from 'zod';
import { LoggerService } from '../../services/LoggerService.js';
import { PrdLifecycleService } from '../../vibeplanner/services/PrdLifecycleService.js';
import { MCPBaseTool } from '../MCPBaseTool.js';

const DeletePlanInputSchemaShape = z.object({
  planId: z.string().uuid().describe('The ID of the plan (PRD) to delete.'),
}).shape;

// Output schema will be a simple message indicating success or failure
const DeletePlanOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

@injectable()
export class DeletePlanMCPTool extends MCPBaseTool<
  typeof DeletePlanInputSchemaShape,
  typeof DeletePlanOutputSchema
> {
  readonly toolName = 'mcp_vibe-planner_deletePlan';
  readonly description =
    'Deletes an existing plan (PRD) and its associated data.';
  readonly inputSchemaShape = DeletePlanInputSchemaShape;
  readonly outputSchema = DeletePlanOutputSchema;

  constructor(
    logger: LoggerService,
    @inject(PrdLifecycleService)
    private prdLifecycleService: PrdLifecycleService
  ) {
    super(logger);
    this.logger.info('[DeletePlanMCPTool] Initialized');
  }

  async execute(
    params: z.infer<z.ZodObject<typeof DeletePlanInputSchemaShape>>,
    context: any
  ): Promise<z.infer<typeof DeletePlanOutputSchema>> {
    this.logger.info(
      `[DeletePlanMCPTool] Executing to delete plan ID: ${params.planId}`
    );
    try {
      // Note: PrdLifecycleService.deletePrd is expected to handle deletion of associated phases/tasks if necessary.
      // Current PrdLifecycleService.deletePrd calls dataPersistence.deletePrd, which only deletes the PRD itself.
      // For a full cleanup, PrdLifecycleService.deletePrd should be expanded to delete phases and tasks first.
      // This is a known limitation for now.
      const success = await this.prdLifecycleService.deletePrd(params.planId);

      if (success) {
        this.logger.info(
          `[DeletePlanMCPTool] Successfully deleted plan ID: ${params.planId}`
        );
        return {
          success: true,
          message: `Plan ID: ${params.planId} successfully deleted.`,
        };
      } else {
        this.logger.warn(
          `[DeletePlanMCPTool] Failed to delete plan ID: ${params.planId}. It might not exist or an error occurred.`
        );
        return {
          success: false,
          message: `Failed to delete plan ID: ${params.planId}. It might not exist or an error occurred.`,
        };
      }
    } catch (error) {
      this.logger.error(
        `[DeletePlanMCPTool] Error deleting plan ID: ${params.planId}:`,
        error as Error
      );
      // Propagate error for base class to handle MCP error response structure
      throw error;
    }
  }
}
