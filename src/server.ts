import 'reflect-metadata'; // Must be the first import

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { container } from 'tsyringe';
import { z } from 'zod';
import { PlanningService } from './services/PlanningService.js';

async function main() {
  const planningService = container.resolve(PlanningService);

  const mcpServer = new McpServer({
    name: 'vibe-planner',
    version: '1.0.0',
  });

  // Define the 'startPlanning' tool
  mcpServer.tool(
    'startPlanning',
    {
      description: 'Gets instructions to start planning a new feature',
      paramsSchema: z.object({}),
    },
    async () => {
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

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error(
    '[VIBE-PLANNER] Connected to StdioServerTransport. Listening...'
  );
}

main().catch((error) => {
  console.error('[VIBE-PLANNER] CRITICAL ERROR in main():', error);
  process.exit(1);
});
