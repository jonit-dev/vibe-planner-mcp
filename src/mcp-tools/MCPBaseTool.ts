import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z, ZodObject, ZodTypeAny } from 'zod';
import { LoggerService } from '../services/LoggerService.js';

// McpToolInputShape: A record of string keys to Zod types (structurally like ZodRawShape)
export type McpToolInputShape = Record<string, z.ZodTypeAny>;

// Type for the parameters object inferred from the InputShape
type InferredParams<S extends McpToolInputShape> = z.infer<ZodObject<S>>;

// Type for the plain result expected from the execute method
type InferredPlainResult<O extends ZodTypeAny | undefined> =
  O extends ZodTypeAny ? z.infer<O> | null : void | undefined | null;

// Using 'any' for McpToolContext as RequestHandlerExtra and its components are not reliably exportable
// Concrete tools can type this more specifically if needed (e.g., RequestHandlerExtra<ServerRequest, ServerNotification>)
type McpToolContext = any;

export abstract class MCPBaseTool<
  InputShape extends McpToolInputShape,
  OutputType extends ZodTypeAny | undefined // Represents the Zod schema for the output *type*, not its .shape
> {
  // Properties to be defined by concrete classes
  abstract readonly toolName: string; // Full tool name, e.g., "VibePlannerTool/createPlan"
  abstract readonly description: string;
  abstract readonly inputSchemaShape: InputShape; // e.g., CreatePlanInputSchema.shape
  abstract readonly outputSchema?: OutputType; // e.g., CreatePlanOutputSchema (the Zod schema object itself)

  protected logger: LoggerService;

  constructor(logger: LoggerService) {
    // Only logger is needed by the base class now
    this.logger = logger;
  }

  // Abstract execute method to be implemented by concrete tools
  // It now takes specific services as arguments, which the concrete tool will resolve and pass.
  // This will be further simplified when concrete tools inject services themselves.
  abstract execute(
    params: InferredParams<InputShape>,
    context: McpToolContext
  ): // services: Any // This approach is less clean than direct injection in concrete classes
  Promise<InferredPlainResult<OutputType>>;

  public register(mcpServer: McpServer): void {
    const config: {
      description: string;
      inputSchema: McpToolInputShape;
      outputSchema?: McpToolInputShape;
    } = {
      description: this.description,
      inputSchema: this.inputSchemaShape,
    };

    if (this.outputSchema instanceof ZodObject) {
      config.outputSchema = this.outputSchema.shape as McpToolInputShape;
    }
    // If outputSchema is not a ZodObject (e.g. z.string(), or undefined),
    // we don't set config.outputSchema. The MCP server infers this.

    mcpServer.registerTool(
      this.toolName,
      config as any,
      async (params: any, context: McpToolContext): Promise<any> => {
        try {
          const plainResult = await this.execute(
            params as InferredParams<InputShape>,
            context
          );

          // Format response based on result type
          const response = {
            content: [
              {
                type: 'text',
                text:
                  typeof plainResult === 'string'
                    ? plainResult
                    : JSON.stringify(plainResult),
              },
            ],
            structuredContent:
              typeof plainResult === 'string'
                ? { text: plainResult }
                : plainResult || {},
          };

          this.logger.debug(
            `[${this.toolName}] Returning response: ${JSON.stringify(response)}`
          );
          return response;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : `Unknown error in tool: ${this.toolName}`;
          this.logger.error(
            `[MCPTool: ${this.toolName}] Error during execution: ${errorMessage}`,
            error as Error
          );
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${errorMessage}`,
              },
            ],
            error: { code: -32000, message: errorMessage },
          };
        }
      }
    );
    this.logger.debug(`[MCPBaseTool] Registered tool: ${this.toolName}`); // Changed to debug
  }
}
