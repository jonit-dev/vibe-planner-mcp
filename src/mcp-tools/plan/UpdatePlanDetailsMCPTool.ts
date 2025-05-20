import { inject, injectable } from 'tsyringe';
import { z } from 'zod';
import { LoggerService } from '../../services/LoggerService.js';
import { PrdLifecycleService } from '../../vibeplanner/services/PrdLifecycleService.js';
import { PrdSchema } from '../../vibeplanner/types.js';
import { MCPBaseTool } from '../MCPBaseTool.js';

const UpdatePlanDetailsInputSchemaShape = z.object({
  planId: z.string().uuid().describe('The ID of the plan (PRD) to update.'),
  name: z
    .string()
    .min(1)
    .optional()
    .describe(
      'The new name for the plan. If not provided, name will not be updated.'
    ),
  description: z
    .string()
    .optional()
    .describe(
      'The new description for the plan. If not provided, description will not be updated.'
    ),
}).shape;

const UpdatePlanDetailsOutputSchema = PrdSchema.nullable(); // Returns the updated PRD or null if not found

@injectable()
export class UpdatePlanDetailsMCPTool extends MCPBaseTool<
  typeof UpdatePlanDetailsInputSchemaShape,
  typeof UpdatePlanDetailsOutputSchema
> {
  readonly toolName = 'mcp_vibe-planner_updatePlanDetails';
  readonly description =
    'Updates the name and/or description of an existing plan (PRD).';
  readonly inputSchemaShape = UpdatePlanDetailsInputSchemaShape;
  readonly outputSchema = UpdatePlanDetailsOutputSchema;

  constructor(
    logger: LoggerService,
    @inject(PrdLifecycleService)
    private prdLifecycleService: PrdLifecycleService
  ) {
    super(logger);
    this.logger.info('[UpdatePlanDetailsMCPTool] Initialized');
  }

  async execute(
    params: z.infer<z.ZodObject<typeof UpdatePlanDetailsInputSchemaShape>>,
    context: any
  ): Promise<z.infer<typeof UpdatePlanDetailsOutputSchema>> {
    this.logger.info(
      `[UpdatePlanDetailsMCPTool] Executing to update details for plan ID: ${params.planId}`,
      { name: params.name, description: params.description }
    );

    if (params.name === undefined && params.description === undefined) {
      this.logger.warn(
        '[UpdatePlanDetailsMCPTool] No details provided to update. Skipping operation.'
      );
      // Optionally, return the current PRD or throw an error for bad input.
      // For now, returning null as if no update occurred or PRD not found,
      // though a more specific error/message might be better.
      // Or, fetch and return current PRD if no changes specified?
      // Let's throw an error for clearer feedback to the user.
      throw new Error('No name or description provided for update.');
    }

    try {
      const updatedPrd = await this.prdLifecycleService.updatePrdDetails(
        params.planId,
        {
          name: params.name, // Pass undefined if not provided, service should handle
          description: params.description, // Pass undefined if not provided, service should handle
        }
      );

      if (updatedPrd) {
        this.logger.info(
          `[UpdatePlanDetailsMCPTool] Successfully updated details for plan ID: ${params.planId}`,
          updatedPrd
        );
      } else {
        this.logger.warn(
          `[UpdatePlanDetailsMCPTool] Plan ID: ${params.planId} not found. No update performed.`
        );
      }
      return updatedPrd;
    } catch (error) {
      this.logger.error(
        `[UpdatePlanDetailsMCPTool] Error updating details for plan ID: ${params.planId}:`,
        error as Error
      );
      throw error;
    }
  }
}
