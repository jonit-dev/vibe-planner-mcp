import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { inject, injectable } from 'tsyringe';
import { MCP_DOCS_PATH } from '../../constants/pathConstants.js';
import { LoggerService } from '../../services/LoggerService.js';
import {
  GetPlanningScaffoldInput,
  GetPlanningScaffoldInputSchema,
  GetPlanningScaffoldOutput,
  GetPlanningScaffoldOutputSchema,
} from '../../vibeplanner/types';
import { MCPBaseTool } from '../MCPBaseTool';

@injectable()
export class GetPlanningScaffoldMCPTool extends MCPBaseTool<
  typeof GetPlanningScaffoldInputSchema.shape,
  typeof GetPlanningScaffoldOutputSchema
> {
  readonly toolName = 'getPlanningScaffold';
  readonly description =
    'Retrieves the standard planning document template/scaffold.';
  readonly inputSchemaShape = GetPlanningScaffoldInputSchema.shape;
  readonly outputSchema = GetPlanningScaffoldOutputSchema;

  constructor(@inject(LoggerService) logger: LoggerService) {
    super(logger);
  }

  async execute(
    params: GetPlanningScaffoldInput,
    context: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<GetPlanningScaffoldOutput> {
    this.logger.info(`[${this.toolName}] Executing...`);

    const filePath = path.join(MCP_DOCS_PATH, 'planning-documents.md');
    this.logger.info(`[${this.toolName}] Attempting to read: ${filePath}`);

    try {
      const fileContent = await readFile(filePath, 'utf-8');
      this.logger.info(`[${this.toolName}] Successfully read file content.`);
      return { text: fileContent };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[${this.toolName}] Error reading planning document: ${errorMessage}`,
        error as Error
      );
      throw new Error(`Failed to read planning document: ${errorMessage}`);
    }
  }
}
