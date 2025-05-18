import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { container } from 'tsyringe';
import { PlanningService } from '../services/PlanningService.js';

export function registerPlanningTool(mcpServer: McpServer) {
  const planningService = container.resolve(PlanningService);

  mcpServer.tool(
    'startPlanning',
    {
      description: 'Gets instructions to start planning a new feature',
    },
    async (params, context) => {
      console.error(
        '[VIBE-PLANNER] startPlanning tool handler invoked. Params:',
        params
      );
      try {
        const fileContent = await planningService.getPlanningDocument();
        return {
          content: [{ type: 'text', text: fileContent }],
        };
      } catch (error) {
        console.error('[VIBE-PLANNER] Error reading planning document:', error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: Could not load planning document. ${errorMessage}`,
            },
          ],
          error: {
            code: -32000,
            message: 'Failed to read planning document.',
            data: errorMessage,
          },
        };
      }
    }
  );
}
