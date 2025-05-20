import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { inject, injectable } from 'tsyringe';
import { z } from 'zod';
import { MCP_DOCS_PATH } from '../../constants/pathConstants.js';
import { LoggerService } from '../../services/LoggerService.js';
import { GetPlanningScaffoldInputSchema } from '../../vibeplanner/types'; // No specific input type, just the schema for shape
import { MCPBaseTool } from '../MCPBaseTool';

@injectable()
export class GetPlanningScaffoldMCPTool extends MCPBaseTool<
  typeof GetPlanningScaffoldInputSchema.shape,
  z.ZodString // OutputType is z.string(), which is an instance of ZodString
> {
  readonly toolName = 'getPlanningScaffold';
  readonly description =
    'Retrieves the standard planning document template/scaffold.';
  readonly inputSchemaShape = GetPlanningScaffoldInputSchema.shape;
  readonly outputSchema = z.string(); // The Zod schema object itself is z.string()

  constructor(@inject(LoggerService) logger: LoggerService) {
    super(logger);
  }

  async execute(
    params: z.infer<typeof GetPlanningScaffoldInputSchema>, // Empty object
    context: RequestHandlerExtra<ServerRequest, ServerNotification> // Context currently unused by this tool's core logic
  ): Promise<string> {
    // Returns a string
    this.logger.info(`[${this.toolName}] Executing...`);

    const filePath = path.join(MCP_DOCS_PATH, 'planning-documents.md');
    this.logger.info(`[${this.toolName}] Attempting to read: ${filePath}`);

    try {
      const fileContent = await readFile(filePath, 'utf-8');
      this.logger.info(`[${this.toolName}] Successfully read file content.`);
      return fileContent;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[${this.toolName}] Error reading planning document: ${errorMessage}`,
        error as Error
      );
      // Let MCPBaseTool handle wrapping this error into a CallToolResult
      throw new Error(`Failed to read planning document: ${errorMessage}`);
    }
  }
}
