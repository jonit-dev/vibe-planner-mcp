import { inject, injectable } from 'tsyringe';
import { z } from 'zod';
import { LoggerService } from '../../services/LoggerService.js';
import { PrdLifecycleService } from '../../vibeplanner/services/PrdLifecycleService.js';
import { PrdSchema } from '../../vibeplanner/types.js'; // Assuming PrdSchema is the correct one
import { MCPBaseTool } from '../MCPBaseTool.js';

// Define an empty input schema for tools that don't require input
// MCP SDK might require a non-empty object, so we use a dummy parameter if necessary.
// For now, let's try with a truly empty shape. If issues arise, add a dummy.
const GetAllAvailablePlansInputSchemaShape = z.object({
  // No parameters needed for this tool
  // Adding a dummy parameter if the framework requires it, but ideally it handles empty.
  // random_string: z.string().optional().describe('Dummy parameter for no-parameter tools'),
}).shape;

// The output will be an array of PRD objects
const GetAllAvailablePlansOutputSchema = z.array(PrdSchema);

@injectable()
export class GetAllAvailablePlansMCPTool extends MCPBaseTool<
  typeof GetAllAvailablePlansInputSchemaShape,
  typeof GetAllAvailablePlansOutputSchema
> {
  readonly toolName = 'getAllAvailablePlans';
  readonly description =
    'Retrieves a list of all available plans (PRDs) with their details.';
  readonly inputSchemaShape = GetAllAvailablePlansInputSchemaShape;
  readonly outputSchema = GetAllAvailablePlansOutputSchema;

  constructor(
    logger: LoggerService,
    @inject(PrdLifecycleService)
    private prdLifecycleService: PrdLifecycleService
  ) {
    super(logger);
    this.logger.info('[GetAllAvailablePlansMCPTool] Initialized');
  }

  async execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: z.infer<z.ZodObject<typeof GetAllAvailablePlansInputSchemaShape>>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: any
  ): Promise<z.infer<typeof GetAllAvailablePlansOutputSchema> | null> {
    this.logger.info(
      '[GetAllAvailablePlansMCPTool] Executing to get all available plans'
    );
    try {
      const plans = await this.prdLifecycleService.listPrds();
      this.logger.info(
        `[GetAllAvailablePlansMCPTool] Successfully retrieved ${plans.length} plans.`
      );
      return plans;
    } catch (error) {
      this.logger.error(
        '[GetAllAvailablePlansMCPTool] Error retrieving plans:',
        error as Error
      );
      // Propagate the error so the base class can format it for the MCP response
      throw error;
    }
  }
}
